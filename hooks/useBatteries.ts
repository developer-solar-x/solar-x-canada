'use client'

import { useState, useEffect } from 'react'
import type { BatterySpec } from '@/config/battery-specs'
import { BATTERY_SPECS } from '@/config/battery-specs'

/**
 * Hook to fetch batteries from API with fallback to static data
 * Automatically refreshes when batteries are added/updated
 */
export function useBatteries(includeInactive: boolean = false) {
  const [batteries, setBatteries] = useState<BatterySpec[]>(BATTERY_SPECS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBatteries = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/batteries?includeInactive=${includeInactive}`)
      if (response.ok) {
        const result = await response.json()
        const fetchedBatteries = result.batteries || []
        
        // Transform to BatterySpec format if needed
        const formattedBatteries: BatterySpec[] = fetchedBatteries.map((b: any) => ({
          id: b.id || b.battery_id,
          brand: b.brand,
          model: b.model,
          nominalKwh: typeof b.nominalKwh === 'number' ? b.nominalKwh : parseFloat(b.nominal_kwh || b.nominalKwh || 0),
          usableKwh: typeof b.usableKwh === 'number' ? b.usableKwh : parseFloat(b.usable_kwh || b.usableKwh || 0),
          usablePercent: typeof b.usablePercent === 'number' ? b.usablePercent : parseFloat(b.usable_percent || b.usablePercent || 90),
          roundTripEfficiency: typeof b.roundTripEfficiency === 'number' ? b.roundTripEfficiency : parseFloat(b.round_trip_efficiency || b.roundTripEfficiency || 0.9),
          inverterKw: typeof b.inverterKw === 'number' ? b.inverterKw : parseFloat(b.inverter_kw || b.inverterKw || 5.0),
          price: typeof b.price === 'number' ? b.price : parseFloat(b.price || 0),
          warranty: {
            years: b.warranty?.years || b.warranty_years || 10,
            cycles: b.warranty?.cycles || b.warranty_cycles || 6000,
          },
          description: b.description,
        }))
        
        // Filter active batteries if needed
        const activeBatteries = includeInactive 
          ? formattedBatteries 
          : formattedBatteries.filter((b: any) => b.isActive !== false)
        
        // Use fetched batteries if available, otherwise fallback to static
        setBatteries(activeBatteries.length > 0 ? activeBatteries : BATTERY_SPECS)
      } else {
        // Fallback to static data on error
        console.warn('Failed to fetch batteries from API, using static data')
        setBatteries(BATTERY_SPECS)
      }
    } catch (err) {
      console.error('Error fetching batteries:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch batteries')
      // Fallback to static data on error
      setBatteries(BATTERY_SPECS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatteries()
    
    // Listen for battery updates from admin
    const handleBatteryUpdate = () => {
      fetchBatteries()
    }
    
    // Listen for custom event when batteries are added/updated
    window.addEventListener('batteries-updated', handleBatteryUpdate)
    
    // Also poll periodically to catch updates (every 5 seconds)
    const pollInterval = setInterval(fetchBatteries, 5000)
    
    return () => {
      window.removeEventListener('batteries-updated', handleBatteryUpdate)
      clearInterval(pollInterval)
    }
  }, [includeInactive])

  return {
    batteries,
    loading,
    error,
    refetch: fetchBatteries,
  }
}

