// NREL PVWatts API integration for solar production calculations

import { roofPitchToDegrees } from '@/config/provinces'
import { withCache } from './cache'

// PVWatts API types
export interface PVWattsParams {
  lat: number
  lon: number
  system_capacity: number
  module_type?: number
  losses?: number
  array_type?: number
  tilt?: number
  azimuth?: number
  dataset?: string
  radius?: number
  timeframe?: string
  // Optional advanced parameters for better accuracy
  gcr?: number           // Ground coverage ratio (for tracking systems)
  dc_ac_ratio?: number   // DC to AC size ratio (typically 1.1-1.2)
  inv_eff?: number       // Inverter efficiency (typically 96%)
  soiling?: number[]     // Monthly soiling losses (12 values)
  albedo?: number        // Ground reflectance (0.2 for typical ground, 0.6 for snow)
}

export interface PVWattsResponse {
  outputs: {
    ac_annual: number
    ac_monthly: number[]
    poa_monthly: number[]
    solrad_annual: number
    solrad_monthly: number[]
    dc_monthly: number[]
    capacity_factor: number
  }
}

// Call NREL PVWatts v8 API with caching
export async function callPVWatts(params: PVWattsParams): Promise<PVWattsResponse> {
  const apiKey = process.env.NREL_API_KEY

  if (!apiKey) {
    throw new Error('NREL API key not configured')
  }

  // Use cache to avoid hitting rate limits during development
  // Cache key based on location and system parameters (exclude API key)
  const cacheParams = {
    lat: params.lat,
    lon: params.lon,
    system_capacity: params.system_capacity,
    module_type: params.module_type ?? 0,
    losses: params.losses ?? 14,
    array_type: params.array_type ?? 1,
    tilt: params.tilt ?? 30,
    azimuth: params.azimuth ?? 180,
  }

  return withCache(
    'pvwatts',
    cacheParams,
    async () => {
      // Construct API URL with parameters
      const queryParams = new URLSearchParams({
        api_key: apiKey,
        lat: params.lat.toString(),
        lon: params.lon.toString(),
        system_capacity: params.system_capacity.toString(),
        module_type: (params.module_type ?? 0).toString(),
        losses: (params.losses ?? 14).toString(),
        array_type: (params.array_type ?? 1).toString(),
        tilt: (params.tilt ?? 30).toString(),
        azimuth: (params.azimuth ?? 180).toString(),
        dataset: params.dataset ?? 'nsrdb',
        radius: (params.radius ?? 0).toString(),
        timeframe: params.timeframe ?? 'monthly',
      })
      
      // Add optional advanced parameters if provided
      if (params.dc_ac_ratio !== undefined) {
        queryParams.append('dc_ac_ratio', params.dc_ac_ratio.toString())
      }
      if (params.inv_eff !== undefined) {
        queryParams.append('inv_eff', params.inv_eff.toString())
      }
      if (params.gcr !== undefined) {
        queryParams.append('gcr', params.gcr.toString())
      }
      if (params.albedo !== undefined) {
        queryParams.append('albedo', params.albedo.toString())
      }
      if (params.soiling && params.soiling.length === 12) {
        queryParams.append('soiling', params.soiling.join('|'))
      }

      const url = `https://developer.nrel.gov/api/pvwatts/v8.json?${queryParams}`

      try {
        // Log request parameters for debugging (without API key)
        if (process.env.NODE_ENV === 'development') {
          console.log('PVWatts API request:', {
            lat: params.lat,
            lon: params.lon,
            system_capacity: params.system_capacity,
            tilt: params.tilt,
            azimuth: params.azimuth,
            module_type: params.module_type,
            losses: params.losses,
            array_type: params.array_type,
            dc_ac_ratio: params.dc_ac_ratio,
            inv_eff: params.inv_eff,
            albedo: params.albedo,
            soiling: params.soiling,
          })
        }
        
        const response = await fetch(url)
        
        if (!response.ok) {
          let errorMessage = response.statusText
          let errorDetails: any = null
          
          // Try to parse JSON error response
          try {
            const errorData = await response.json()
            if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
              errorMessage = errorData.errors.map((e: any) => e.message || e).join(', ')
              errorDetails = errorData.errors
            } else if (errorData.message) {
              errorMessage = errorData.message
            }
          } catch {
            // If JSON parsing fails, try text
            const errorText = await response.text().catch(() => response.statusText)
            errorMessage = errorText || response.statusText
          }
          
          console.error('PVWatts API error details:', {
            status: response.status,
            statusText: response.statusText,
            errorMessage,
            errorDetails,
            params: cacheParams,
            url: url.replace(apiKey, 'REDACTED')
          })
          throw new Error(`PVWatts API error: ${errorMessage}`)
        }

        const data = await response.json()
        
        // Check if the response has errors even with 200 status
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          const errorMessage = data.errors.map((e: any) => e.message || e).join(', ')
          console.error('PVWatts API returned errors in response:', {
            errors: data.errors,
            params: cacheParams
          })
          throw new Error(`PVWatts API error: ${errorMessage}`)
        }
        
        return data

      } catch (error) {
        console.error('PVWatts API call failed:', error)
        throw error
      }
    },
    7 * 24 * 60 * 60 * 1000 // Cache for 7 days (solar data doesn't change frequently)
  )
}

// Calculate solar estimate with PVWatts data
export async function calculateSolarEstimate(
  lat: number,
  lon: number,
  systemSizeKw: number,
  roofPitch: string = 'medium',
  province: string = 'ON',
  azimuth: number = 180 // Roof orientation (default south-facing)
) {
  // Validate system size
  if (!systemSizeKw || systemSizeKw <= 0 || isNaN(systemSizeKw)) {
    throw new Error(`Invalid system size: ${systemSizeKw}. System size must be greater than 0.`)
  }
  
  // PVWatts API typically requires minimum system size of 0.1 kW
  if (systemSizeKw < 0.1) {
    throw new Error(`System size too small: ${systemSizeKw} kW. Minimum is 0.1 kW.`)
  }
  
  // Validate coordinates
  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
    throw new Error(`Invalid coordinates: lat=${lat}, lon=${lon}`)
  }
  
  // Validate latitude/longitude ranges
  if (lat < -90 || lat > 90) {
    throw new Error(`Invalid latitude: ${lat}. Must be between -90 and 90.`)
  }
  if (lon < -180 || lon > 180) {
    throw new Error(`Invalid longitude: ${lon}. Must be between -180 and 180.`)
  }
  
  // Convert roof pitch to tilt angle
  const tilt = roofPitchToDegrees(roofPitch)
  
  // Validate tilt (0-90 degrees)
  if (tilt < 0 || tilt > 90) {
    throw new Error(`Invalid tilt angle: ${tilt}. Must be between 0 and 90 degrees.`)
  }
  
  // Validate azimuth (0-360 degrees)
  if (azimuth < 0 || azimuth > 360) {
    throw new Error(`Invalid azimuth: ${azimuth}. Must be between 0 and 360 degrees.`)
  }

  // Determine region-specific parameters
  // Canada has more snow in winter, affecting albedo and soiling
  const isCanada = ['ON', 'BC', 'AB', 'QC', 'MB', 'SK', 'NS', 'NB', 'PE', 'NL', 'YT', 'NT', 'NU'].includes(province)
  
  // Monthly soiling losses for Canada (higher in winter due to snow)
  // Values are % losses per month (Jan-Dec) - must be between 0-100
  const canadaSoiling = [12, 10, 8, 4, 2, 1, 1, 2, 3, 5, 8, 10]
  const defaultSoiling = [2, 2, 3, 3, 4, 4, 5, 5, 4, 3, 2, 2]
  
  // Validate soiling values
  const soiling = isCanada ? canadaSoiling : defaultSoiling
  if (soiling.some(val => val < 0 || val > 100)) {
    throw new Error(`Invalid soiling values. All values must be between 0 and 100.`)
  }
  
  // Albedo (ground reflectance) - higher in winter due to snow in Canada
  // Using average value, could be made dynamic by month
  // Must be between 0 and 1
  const albedo = isCanada ? 0.35 : 0.2  // 0.35 accounts for seasonal snow
  if (albedo < 0 || albedo > 1) {
    throw new Error(`Invalid albedo: ${albedo}. Must be between 0 and 1.`)
  }
  
  // Validate inverter efficiency (0-100)
  const invEff = 96
  if (invEff < 0 || invEff > 100) {
    throw new Error(`Invalid inverter efficiency: ${invEff}. Must be between 0 and 100.`)
  }

  // Call PVWatts API with optimized parameters
  // Using Premium module type for N-type bifacial panels (22.5% efficiency)
  const pvData = await callPVWatts({
    lat,
    lon,
    system_capacity: systemSizeKw,
    tilt,
    azimuth: azimuth, // Use provided roof orientation
    module_type: 1, // Premium panels (N-type monocrystalline, 22.5% efficiency)
    losses: 14, // Default system losses (industry standard)
    array_type: 1, // Fixed roof mount
    dc_ac_ratio: 1.2, // Modern inverter sizing (20% DC oversizing)
    inv_eff: invEff, // Modern inverter efficiency (96%)
    albedo: albedo, // Region-specific ground reflectance (also benefits bifacial rear side)
    soiling: soiling, // Monthly soiling losses
  })

  // Extract production data
  let annualProductionKwh = pvData.outputs.ac_annual
  let monthlyProductionKwh = pvData.outputs.ac_monthly
  const capacityFactor = pvData.outputs.capacity_factor

  // Apply bifacial gain for rear-side energy capture
  // Use more conservative 4% gain for roof-mounted systems
  const bifacialGain = 1.04 // 4% additional production from rear side
  annualProductionKwh = Math.round(annualProductionKwh * bifacialGain)
  monthlyProductionKwh = monthlyProductionKwh.map(kwh => Math.round(kwh * bifacialGain))

  return {
    annualProductionKwh,
    monthlyProductionKwh,
    capacityFactor,
    solarRadiation: pvData.outputs.solrad_annual,
    pvWattsData: pvData.outputs,
  }
}

