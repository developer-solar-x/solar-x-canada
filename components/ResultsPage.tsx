'use client'

// Results page component - displays calculator results after lead capture

import { useState, useEffect } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { FeedbackForm } from './FeedbackForm'
import { 
  Zap, 
  DollarSign, 
  TrendingUp, 
  Battery, 
  Download, 
  Mail, 
  Handshake,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Leaf,
  Clock,
  ChevronDown,
  Sun
} from 'lucide-react'
import { formatCurrency, formatKw, formatKwh } from '@/lib/utils'
import { formatProductionRange } from '@/lib/production-range'
import { computeSolarBatteryOffsetCap } from '@/lib/peak-shaving/offset-cap'
import Link from 'next/link'
import { MapSnapshot } from '@/components/estimator/StepReview/sections/MapSnapshot'
import { RoofSummary } from '@/components/estimator/StepReview/sections/RoofSummary'
import { PhotosSummary } from '@/components/estimator/StepReview/sections/PhotosSummary'
import { EnergySummary } from '@/components/estimator/StepReview/sections/EnergySummary'
import { BatteryDetails } from '@/components/estimator/StepReview/sections/BatteryDetails'
import { BeforeAfterComparison } from '@/components/estimator/StepReview/sections/SystemSummaryCards'
import { SavingsTab } from '@/components/estimator/StepReview/tabs/SavingsTab'
import { EnvironmentalTab } from '@/components/estimator/StepReview/tabs/EnvironmentalTab'
import { ImageModal } from '@/components/ui/ImageModal'
import { NetMeteringResults } from '@/components/ResultsPage/sections/NetMeteringResults'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { FINANCING_OPTIONS } from '@/config/provinces'
import { SolarClubAlberta } from '@/components/estimator/StepReview/sections/SolarClubAlberta'

interface ResultsPageProps {
  estimate?: {
    system?: {
      sizeKw?: number
      numPanels?: number
    }
    production?: {
      annualKwh?: number
      monthlyKwh?: number[]
    }
    costs?: {
      totalCost?: number
      netCost?: number
      incentives?: number
    }
    savings?: {
      annualSavings?: number
      monthlySavings?: number
      paybackYears?: number
      lifetimeSavings?: number
    }
    environmental?: {
      co2OffsetTonsPerYear?: number
      treesEquivalent?: number
      carsOffRoadEquivalent?: number
    }
  }
  leadData?: {
    firstName?: string
    lastName?: string
    email?: string
    address?: string
    province?: string
  }
  batteryImpact?: {
    annualSavings: number
    monthlySavings: number
    batterySizeKwh: number
  }
  peakShaving?: {
    tou?: any
    ulo?: any
    ratePlan?: 'tou' | 'ulo'
  }
  solarRebate?: number
  batteryRebate?: number
  combinedTotalCost?: number
  combinedNetCost?: number
  displayPlan?: 'tou' | 'ulo'
  solarOverride?: {
    sizeKw?: number
    numPanels?: number
  }
  selectedBattery?: any
  batteryDetails?: any
  mapSnapshot?: string
  roofData?: {
    roofAreaSqft?: number
    roofType?: string
    roofPitch?: string
    shadingLevel?: string
    roofAge?: string
    roofPolygon?: any
    roofSections?: any[]
  }
  photos?: any[]
  photoSummary?: any
  monthlyBill?: number
  energyUsage?: any
  appliances?: any[]
  addOns?: any[]
  tou?: any
  ulo?: any
  programType?: 'quick' | 'hrs_residential' | 'net_metering'
  netMetering?: {
    tou?: any
    ulo?: any
  }
  financingOption?: string
  leadId?: string
  onMatchInstaller?: () => void
  onExportPDF?: () => void
}

export function ResultsPage({ 
  estimate, 
  leadData, 
  batteryImpact,
  peakShaving,
  solarRebate,
  batteryRebate,
  combinedTotalCost,
  combinedNetCost,
  displayPlan,
  solarOverride,
  selectedBattery,
  batteryDetails,
  mapSnapshot,
  roofData,
  photos,
  photoSummary,
  monthlyBill,
  energyUsage,
  appliances,
  addOns,
  tou,
  ulo,
  programType,
  netMetering,
  financingOption,
  leadId,
  onMatchInstaller,
  onExportPDF,
  ...data // Accept additional data props (including touBeforeAfter, uloBeforeAfter, annualEscalator)
}: ResultsPageProps & { [key: string]: any }) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [installerMatchRequested, setInstallerMatchRequested] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; title: string } | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [activeSummaryTab, setActiveSummaryTab] = useState<'overview' | 'savings' | 'environmental'>('overview')
  const [copyButtonText, setCopyButtonText] = useState('Copy Link')
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [abandonedNotified, setAbandonedNotified] = useState(false)
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Notify internally when a user reaches results page without a saved lead ID (abandoned estimate)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (abandonedNotified) return

    const urlParams = new URLSearchParams(window.location.search)
    const leadIdFromQuery = urlParams.get('leadId')
    const effectiveLeadId = leadId || leadIdFromQuery

    if (effectiveLeadId) return

    // Only notify if we have at least some useful context
    const hasMeaningfulData =
      !!(leadData?.email || leadData?.address || estimate?.system?.sizeKw)

    if (!hasMeaningfulData) return

    ;(async () => {
      try {
        await fetch('/api/leads/abandoned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: leadData?.email,
            address: leadData?.address,
            province: leadData?.province,
            city: undefined,
            programType,
            estimatorMode: (data as any)?.estimatorMode,
            systemSizeKw: estimate?.system?.sizeKw,
            numPanels: estimate?.system?.numPanels,
            monthlyBill,
            annualUsageKwh: energyUsage?.annualKwh,
          }),
        })
        setAbandonedNotified(true)
      } catch (err) {
        console.error('Failed to notify abandoned estimate:', err)
      }
    })()
  }, [abandonedNotified, leadData, estimate, programType, leadId, monthlyBill, energyUsage, data])

  const handleImageClick = (image: { src: string; alt: string; title: string }) => {
    setSelectedImage(image)
    setImageModalOpen(true)
  }

  // Determine selected financing option from explicit prop or spread data.
  const rawFinancingOption: string | undefined =
    (data as any)?.financingOption ?? financingOption
  const financingOptionLabel =
    rawFinancingOption
      ? FINANCING_OPTIONS.find(option => option.id === rawFinancingOption)?.name ||
        rawFinancingOption
      : null
  const isCashPurchase =
    rawFinancingOption === 'cash' ||
    (financingOptionLabel || '').toLowerCase().includes('cash')

  // Use solarOverride if available (matches StepReview logic)
  // Priority: solarOverride (from battery savings step) > estimate.system (from API)
  // If we have exact panel count, calculate system size directly from it (no rounding needed)
  // 14 panels � 500W = 7000W = 7.0 kW exactly
  const panelWattage = 500 // Standard panel wattage
  const numPanels = solarOverride?.numPanels ?? estimate?.system?.numPanels
  
  // Calculate system size from exact panel count if available (always prefer panel count calculation)
  // This ensures 14 panels = 7.0 kW exactly, not 7.1 kW
  let systemSizeKw: number
  if (numPanels && numPanels > 0) {
    // Calculate directly from panel count: exact calculation, no rounding needed
    systemSizeKw = (numPanels * panelWattage) / 1000
  } else {
    // Fallback: use provided system size and round to nearest 0.5
    const rawSystemSizeKw = solarOverride?.sizeKw ?? estimate?.system?.sizeKw ?? 0
    systemSizeKw = Math.round(rawSystemSizeKw * 2) / 2
  }
  
  // Debug logging (remove after confirming fix)
  console.log('?? ResultsPage System Size Debug:', {
    numPanels,
    calculatedFromPanels: solarOverride?.numPanels ? (solarOverride.numPanels * panelWattage) / 1000 : null,
    finalSystemSizeKw: systemSizeKw,
    solarOverrideSizeKw: solarOverride?.sizeKw,
    estimateSystemSizeKw: estimate?.system?.sizeKw
  })

  // Calculate percentage offset shown in the "Energy Offset" card
  // For net metering, align this with the net metering energy coverage metric (same as NetMeteringResults).
  // For non-net-metering programs, keep the original capped offset model based on production vs usage.
  // Use actual annual usage from energyUsage data, or calculate from monthly bill if available.
  const actualAnnualUsage =
    energyUsage?.annualKwh ||
    (monthlyBill && typeof monthlyBill === 'number' ? (monthlyBill / 0.134) * 12 : null) || // Estimate from monthly bill (avg $0.134/kWh)
    (estimate?.production?.annualKwh ? estimate.production.annualKwh / 0.8 : null) // Fallback: assume 80% offset if no usage data

  // Determine which rate plan is being used (TOU or ULO) - needed for battery capture (non-net-metering)
  const ratePlanForOffset = displayPlan || peakShaving?.ratePlan || 'tou'

  // Get programType from props or data spread (net metering doesn't have rebates)
  // programType may be in the props or in the data spread
  const currentProgramType = (programType || (data as any)?.programType) as
    | 'quick'
    | 'hrs_residential'
    | 'net_metering'
    | undefined

  // Get rebate amounts (use provided values or calculate from estimate)
  // Net metering systems do NOT qualify for rebates
  const isNetMetering = currentProgramType === 'net_metering'
  const solarRebateAmount = isNetMetering ? 0 : (solarRebate ?? estimate?.costs?.incentives ?? 0)
  const batteryRebateAmount = isNetMetering ? 0 : (batteryRebate ?? 0)
  const totalRebates = solarRebateAmount + batteryRebateAmount

  let percentageOffset = 0

  if (isNetMetering && netMetering) {
    // Use the same energy coverage metric as NetMeteringResults: totalSolarProduction / totalLoad
    const nm: any = netMetering
    const plans = [
      { key: 'tou', plan: nm.tou },
      { key: 'ulo', plan: nm.ulo },
      { key: 'tiered', plan: nm.tiered },
    ].filter(p => p.plan && p.plan.annual)

    if (plans.length) {
      const selectedKey: 'tou' | 'ulo' | 'tiered' | undefined = nm.selectedRatePlan
      // Prefer selectedRatePlan; otherwise pick plan with highest energy coverage
      let chosen =
        (selectedKey && plans.find(p => p.key === selectedKey)) || plans[0]

      if (!selectedKey && plans.length > 1) {
        chosen = plans.reduce((best, current) => {
          const bestAnnual = best.plan.annual
          const currAnnual = current.plan.annual
          const bestCoverage =
            bestAnnual && bestAnnual.totalLoad > 0
              ? (bestAnnual.totalSolarProduction / bestAnnual.totalLoad) * 100
              : 0
          const currCoverage =
            currAnnual && currAnnual.totalLoad > 0
              ? (currAnnual.totalSolarProduction / currAnnual.totalLoad) * 100
              : 0
          return currCoverage > bestCoverage ? current : best
        }, chosen)
      }

      const annual = chosen.plan.annual
      if (annual && annual.totalLoad > 0) {
        const coverage = (annual.totalSolarProduction / annual.totalLoad) * 100
        percentageOffset = Math.round(Math.min(100, coverage))
      }
    }
  } else {
    // Original capped offset model for non-net-metering programs
    // Get total offset percentage from saved data (matches Step 4 display)
    // This is the capped percentage calculated in Step 4 (e.g., 85.64%)
    // Check direct tou/ulo props first, then peakShaving structure
    if (ratePlanForOffset === 'ulo') {
      // Get from ULO plan
      if (ulo?.totalOffset !== undefined && typeof ulo.totalOffset === 'number') {
        // totalOffset is already a percentage from Step 4
        percentageOffset = Math.round(ulo.totalOffset)
      } else if (peakShaving?.ulo?.result?.offsetPercentages) {
        // Calculate from offsetPercentages if available
        const solarDirect = peakShaving.ulo.result.offsetPercentages.solarDirect || 0
        const solarChargedBattery =
          peakShaving.ulo.result.offsetPercentages.solarChargedBattery || 0
        percentageOffset = Math.round(solarDirect + solarChargedBattery)
      }
    } else {
      // Get from TOU plan
      if (tou?.totalOffset !== undefined && typeof tou.totalOffset === 'number') {
        // totalOffset is already a percentage from Step 4
        percentageOffset = Math.round(tou.totalOffset)
      } else if (peakShaving?.tou?.result?.offsetPercentages) {
        // Calculate from offsetPercentages if available
        const solarDirect = peakShaving.tou.result.offsetPercentages.solarDirect || 0
        const solarChargedBattery =
          peakShaving.tou.result.offsetPercentages.solarChargedBattery || 0
        percentageOffset = Math.round(solarDirect + solarChargedBattery)
      }
    }

    // Fallback: calculate from solar production and battery capture if percentage not available
    if (percentageOffset === 0) {
      const solarProduction = estimate?.production?.annualKwh || 0
      const batterySolarCapture =
        ratePlanForOffset === 'ulo'
          ? ulo?.batterySolarCapture ??
            peakShaving?.ulo?.batterySolarCapture ??
            0
          : tou?.batterySolarCapture ??
            peakShaving?.tou?.batterySolarCapture ??
            0

      const totalEnergyOffset = solarProduction + batterySolarCapture

      // Calculate offset cap to account for winter limits (same as PeakShavingSalesCalculatorFRD)
      const roofAzimuth =
        (estimate as any)?.roof?.azimuth ??
        (roofData as any)?.roofAzimuth ??
        ((roofData?.roofPolygon?.features?.[0]?.properties as any)?.azimuth) ??
        180 // Default to south-facing

      const offsetCapInfo = computeSolarBatteryOffsetCap({
        usageKwh: actualAnnualUsage || 0,
        productionKwh: solarProduction,
        roofPitch: roofData?.roofPitch,
        roofAzimuth: roofAzimuth,
        roofSections: roofData?.roofSections,
      })

      // Calculate uncapped percentage
      const uncappedPercentage =
        actualAnnualUsage && actualAnnualUsage > 0 && totalEnergyOffset > 0
          ? (totalEnergyOffset / actualAnnualUsage) * 100
          : actualAnnualUsage && actualAnnualUsage > 0 && solarProduction > 0
          ? (solarProduction / actualAnnualUsage) * 100
          : 80 // Fallback to 80% if we can't calculate

      // Apply offset cap (typically 90-93% to reflect winter limits)
      const cappedPercentage = Math.min(
        uncappedPercentage,
        offsetCapInfo.capFraction * 100
      )
      percentageOffset = Math.round(cappedPercentage)
    }
  }
  
  // Calculate monthly production average
  const avgMonthlyProduction = estimate?.production?.annualKwh ? estimate.production.annualKwh / 12 : 0

  // Determine which rate plan is being used (TOU or ULO)
  const ratePlan = displayPlan || peakShaving?.ratePlan || 'tou'
  // For easy mode, tou/ulo props have the data directly; for detailed mode, it's in peakShaving
  const touData = tou || peakShaving?.tou
  const uloData = ulo || peakShaving?.ulo
  
  // Get combined costs (if battery is included)
  const finalTotalCost = combinedTotalCost ?? estimate?.costs?.totalCost ?? 0
  const finalNetCost = combinedNetCost ?? estimate?.costs?.netCost ?? 0

  // Derive solar vs battery cost for public results:
  // - Solar cost comes from the estimate's total/system cost.
  // - Battery cost is the portion of the combined cost above the solar cost,
  //   with a fallback to explicit battery pricing when available.
  const solarSystemCost = estimate?.costs?.totalCost ?? finalTotalCost
  const explicitBatteryPrice =
    batteryDetails?.battery?.price ??
    (batteryImpact ? batteryImpact.batterySizeKwh && batteryImpact.annualSavings && 0 : undefined)
  const inferredBatteryCost =
    finalTotalCost > solarSystemCost ? finalTotalCost - solarSystemCost : 0
  const batterySystemCost = explicitBatteryPrice ?? inferredBatteryCost
  const totalSystemCost = solarSystemCost + (batterySystemCost || 0)
  
  // Get touBeforeAfter and uloBeforeAfter from data (same as StepReview)
  // These are pre-calculated in step 4 and should be used directly
  // Also check tou/ulo props directly for beforeSolar/afterSolar (for easy mode)
  const touBeforeAfter = (peakShaving as any)?.touBeforeAfter || 
                        (data as any)?.touBeforeAfter || 
                        (tou?.beforeSolar !== undefined && tou?.afterSolar !== undefined ? {
                          before: tou.beforeSolar,
                          after: tou.afterSolar,
                          savings: tou.beforeSolar - tou.afterSolar
                        } : null)
  const uloBeforeAfter = (peakShaving as any)?.uloBeforeAfter || 
                        (data as any)?.uloBeforeAfter || 
                        (ulo?.beforeSolar !== undefined && ulo?.afterSolar !== undefined ? {
                          before: ulo.beforeSolar,
                          after: ulo.afterSolar,
                          savings: ulo.beforeSolar - ulo.afterSolar
                        } : null)
  
  // Calculate annual savings from touBeforeAfter/uloBeforeAfter (same as StepReview)
  // StepReview calculates: touSavings = touBefore - touAfter
  const touCombinedAnnual = touBeforeAfter && touBeforeAfter.before > 0 && touBeforeAfter.after >= 0
    ? touBeforeAfter.before - touBeforeAfter.after
    : (() => {
        // Check tou prop directly (for easy mode)
        if (tou?.beforeSolar !== undefined && tou?.afterSolar !== undefined && tou.beforeSolar > 0 && tou.afterSolar >= 0) {
          return tou.beforeSolar - tou.afterSolar
        }
        
        // Fallback: try to get from nested structure
        const combined = touData?.allResults?.combined?.combined || 
                        touData?.allResults?.combined || 
                        touData?.combined?.combined ||
                        touData?.combined ||
                        tou?.combined?.combined ||
                        tou?.combined
        
        if (!combined) return null
        
        const before = combined.baselineAnnualBill || combined.baselineAnnualBillEnergyOnly || tou?.beforeSolar || 0
        const after = combined.postSolarBatteryAnnualBill || combined.postSolarBatteryAnnualBillEnergyOnly || tou?.afterSolar || 0
        
        if (before > 0 && after >= 0) {
          return before - after
        }
        
        return combined.annual || combined.combinedAnnualSavings || tou?.savings || null
      })()
  
  const uloCombinedAnnual = uloBeforeAfter && uloBeforeAfter.before > 0 && uloBeforeAfter.after >= 0
    ? uloBeforeAfter.before - uloBeforeAfter.after
    : (() => {
        // Check ulo prop directly (for easy mode)
        if (ulo?.beforeSolar !== undefined && ulo?.afterSolar !== undefined && ulo.beforeSolar > 0 && ulo.afterSolar >= 0) {
          return ulo.beforeSolar - ulo.afterSolar
        }
        
        // Fallback: try to get from nested structure
        const combined = uloData?.allResults?.combined?.combined || 
                        uloData?.allResults?.combined || 
                        uloData?.combined?.combined ||
                        uloData?.combined ||
                        ulo?.combined?.combined ||
                        ulo?.combined
        
        if (!combined) return null
  
        const before = combined.baselineAnnualBill || combined.baselineAnnualBillEnergyOnly || ulo?.beforeSolar || 0
        const after = combined.postSolarBatteryAnnualBill || combined.postSolarBatteryAnnualBillEnergyOnly || ulo?.afterSolar || 0
        
        if (before > 0 && after >= 0) {
          return before - after
        }
        
        return combined.annual || combined.combinedAnnualSavings || ulo?.savings || null
      })()
  
  const touCombinedMonthly = touCombinedAnnual !== null ? touCombinedAnnual / 12 : null
  const uloCombinedMonthly = uloCombinedAnnual !== null ? uloCombinedAnnual / 12 : null
  
  // Calculate total bill savings percentage from touBeforeAfter/uloBeforeAfter (same as StepReview)
  // StepReview calculates: (before - after) / before * 100
  const touBillSavingsPercent = touBeforeAfter && touBeforeAfter.before > 0
    ? ((touBeforeAfter.before - touBeforeAfter.after) / touBeforeAfter.before) * 100
    : (() => {
        // Check tou prop directly first (for easy mode)
        if (tou?.beforeSolar !== undefined && tou?.afterSolar !== undefined && tou.beforeSolar > 0) {
          return ((tou.beforeSolar - tou.afterSolar) / tou.beforeSolar) * 100
        }
    
        // Fallback: calculate from nested structure
        const beforeSolar = touData?.combined?.baselineAnnualBill || 
                           touData?.combined?.combined?.baselineAnnualBill ||
                           touData?.allResults?.combined?.combined?.baselineAnnualBill ||
                           tou?.combined?.combined?.baselineAnnualBill ||
                           tou?.combined?.baselineAnnualBill ||
                           tou?.beforeSolar ||
                           0
        const afterSolar = touData?.combined?.postSolarBatteryAnnualBill || 
                          touData?.combined?.combined?.postSolarBatteryAnnualBill ||
                          touData?.combined?.postSolarAnnualBill ||
                          touData?.allResults?.combined?.combined?.postSolarBatteryAnnualBill ||
                          tou?.combined?.combined?.postSolarBatteryAnnualBill ||
                          tou?.combined?.postSolarBatteryAnnualBill ||
                          tou?.afterSolar ||
                          0
    
        if (beforeSolar > 0 && afterSolar >= 0) {
      return ((beforeSolar - afterSolar) / beforeSolar) * 100
    }
        
        if (tou?.totalBillSavingsPercent !== undefined) return tou.totalBillSavingsPercent
    return null
      })()
  
  const uloBillSavingsPercent = uloBeforeAfter && uloBeforeAfter.before > 0
    ? ((uloBeforeAfter.before - uloBeforeAfter.after) / uloBeforeAfter.before) * 100
    : (() => {
        // Check ulo prop directly first (for easy mode)
        if (ulo?.beforeSolar !== undefined && ulo?.afterSolar !== undefined && ulo.beforeSolar > 0) {
          return ((ulo.beforeSolar - ulo.afterSolar) / ulo.beforeSolar) * 100
        }
        
        // Fallback: calculate from nested structure
        const beforeSolar = uloData?.combined?.baselineAnnualBill || 
                           uloData?.combined?.combined?.baselineAnnualBill ||
                           uloData?.allResults?.combined?.combined?.baselineAnnualBill ||
                           ulo?.combined?.combined?.baselineAnnualBill ||
                           ulo?.combined?.baselineAnnualBill ||
                           ulo?.beforeSolar ||
                           0
        const afterSolar = uloData?.combined?.postSolarBatteryAnnualBill || 
                          uloData?.combined?.combined?.postSolarBatteryAnnualBill ||
                          uloData?.combined?.postSolarAnnualBill ||
                          uloData?.allResults?.combined?.combined?.postSolarBatteryAnnualBill ||
                          ulo?.combined?.combined?.postSolarBatteryAnnualBill ||
                          ulo?.combined?.postSolarBatteryAnnualBill ||
                          ulo?.afterSolar ||
                          0
        
        if (beforeSolar > 0 && afterSolar >= 0) {
          return ((beforeSolar - afterSolar) / beforeSolar) * 100
        }
        
        if (ulo?.totalBillSavingsPercent !== undefined) return ulo.totalBillSavingsPercent
        return null
      })()
  
  // Get net costs for TOU and ULO (needed for 25-year profit calculation)
  const touCombinedNet = (peakShaving as any)?.tou?.combined?.netCost ?? 
                        (peakShaving as any)?.tou?.allResults?.combined?.combined?.netCost ??
                        finalNetCost
  const uloCombinedNet = (peakShaving as any)?.ulo?.combined?.netCost ?? 
                        (peakShaving as any)?.ulo?.allResults?.combined?.combined?.netCost ??
                        finalNetCost

  // Get annual escalator (default to 4.5% if not provided)
  const annualEscalator = (data as any)?.annualEscalator ?? 4.5
  const escalation = annualEscalator / 100 // Convert percentage to decimal

  // Get 25-year profit for both plans - calculate same way as SavingsTab
  // Always calculate to ensure it matches the Complete Estimate Summary
  const get25YearProfit = (plan: any, directPlan: any, annualSavings: number | null, netCost: number) => {
    // Always calculate same way as SavingsTab: cumulative savings over 25 years with escalation, minus net cost
    // This ensures consistency with the Complete Estimate Summary
    if (annualSavings && annualSavings > 0 && netCost > 0) {
      let cumulativeSavings = 0
      for (let year = 1; year <= 25; year++) {
        const yearSavings = annualSavings * Math.pow(1 + escalation, year - 1)
        cumulativeSavings += yearSavings
      }
      // Profit = cumulative savings - net investment (same as SavingsTab)
      return cumulativeSavings - netCost
    }
    
    // Fallback: try to get from stored values only if calculation is not possible
    if (directPlan?.profit25Year !== undefined && directPlan.profit25Year > 0) return directPlan.profit25Year
    if (plan?.combined?.projection?.netProfit25Year !== undefined) return plan.combined.projection.netProfit25Year
    if (plan?.allResults?.combined?.combined?.projection?.netProfit25Year !== undefined) return plan.allResults.combined.combined.projection.netProfit25Year
    
    return null
  }
  
  const tou25YearSavings = get25YearProfit(touData, tou, touCombinedAnnual, touCombinedNet)
  const ulo25YearSavings = get25YearProfit(uloData, ulo, uloCombinedAnnual, uloCombinedNet)
  
  // Debug logging to verify calculation
  console.log('?? 25-Year Profit Calculation:', {
    touCombinedAnnual,
    touCombinedNet,
    tou25YearSavings,
    uloCombinedAnnual,
    uloCombinedNet,
    ulo25YearSavings,
    escalation,
    annualEscalator,
    touProfit25Year: tou?.profit25Year,
    uloProfit25Year: ulo?.profit25Year,
  })

  // Net metering narrative metrics for "What These Results Mean"
  // Calculate this BEFORE using it in finalAnnualSavings/finalPaybackYears/lifetimeSavings
  let netMeteringNarrative:
    | {
        planLabel: string
        annualSavings: number | null
        paybackYears: number | null
        profit25: number | null
      }
    | null = null

  if (isNetMetering && netMetering) {
    const nm: any = netMetering
    // Check if this is Alberta Solar Club
    const isAlberta = leadData?.province && (leadData.province.toUpperCase() === 'AB' || leadData.province.toUpperCase() === 'ALBERTA' || leadData.province.toUpperCase().includes('ALBERTA'))
    const albertaData = isAlberta && nm.tou?.alberta
    
    if (isAlberta && albertaData) {
      // Alberta Solar Club: Use tou plan (which contains Alberta data)
      const touPlan = nm.tou
      const projection = touPlan?.projection || {}
      const annualSavings: number | null =
        typeof projection.annualSavings === 'number'
          ? projection.annualSavings
          : touPlan.annual
          ? (touPlan.annual.importCost || 0) - (touPlan.annual.netAnnualBill || 0)
          : null

      let profit25: number | null =
        typeof projection.netProfit25Year === 'number'
          ? projection.netProfit25Year
          : null

      // If profit not provided, derive it from annualSavings and net cost
      if (
        (profit25 === null || profit25 === 0) &&
        annualSavings &&
        annualSavings > 0 &&
        finalNetCost > 0
      ) {
        let cumulativeSavings = 0
        for (let year = 1; year <= 25; year++) {
          const yearSavings = annualSavings * Math.pow(1 + escalation, year - 1)
          cumulativeSavings += yearSavings
        }
        profit25 = cumulativeSavings - finalNetCost
      }

      const paybackYears: number | null =
        typeof projection.paybackYears === 'number' && projection.paybackYears > 0
          ? projection.paybackYears
          : annualSavings && annualSavings > 0 && finalNetCost > 0
          ? (() => {
              // Calculate payback with 4.5% annual escalation
              const esc = 0.045
              let cumulative = 0
              for (let year = 1; year <= 25; year++) {
                const yearSavings = annualSavings * Math.pow(1 + esc, year - 1)
                cumulative += yearSavings
                if (cumulative >= finalNetCost) {
                  const prev = cumulative - yearSavings
                  return (year - 1) + ((finalNetCost - prev) / yearSavings)
                }
              }
              return null
            })()
          : null

      netMeteringNarrative = {
        planLabel: 'Alberta Solar Club',
        annualSavings,
        paybackYears,
        profit25,
      }
    } else {
      // Non-Alberta: Use TOU/ULO/Tiered plans
      const plans = [
        { key: 'tou', label: 'TOU', plan: nm.tou },
        { key: 'ulo', label: 'ULO', plan: nm.ulo },
        { key: 'tiered', label: 'Tiered', plan: nm.tiered },
      ].filter(p => p.plan)

      if (plans.length) {
        const selectedKey: 'tou' | 'ulo' | 'tiered' | undefined = nm.selectedRatePlan
        let chosen = (selectedKey && plans.find(p => p.key === selectedKey)) || plans[0]

        // If no selected plan, prefer the one with highest 25-year profit if available
        if (!selectedKey && plans.length > 1) {
          chosen = plans.reduce((best, current) => {
            const bestProfit = best.plan?.projection?.netProfit25Year ?? 0
            const currProfit = current.plan?.projection?.netProfit25Year ?? 0
            return currProfit > bestProfit ? current : best
          }, chosen)
        }

        const projection = chosen.plan.projection || {}
        const annualSavings: number | null =
          typeof projection.annualSavings === 'number'
            ? projection.annualSavings
            : chosen.plan.annual
            ? (chosen.plan.annual.importCost || 0) -
              (chosen.plan.annual.netAnnualBill || 0)
            : null

        let profit25: number | null =
          typeof projection.netProfit25Year === 'number'
            ? projection.netProfit25Year
            : null

        // If profit not provided, derive it from annualSavings and net cost
        if (
          (profit25 === null || profit25 === 0) &&
          annualSavings &&
          annualSavings > 0 &&
          finalNetCost > 0
        ) {
          let cumulativeSavings = 0
          for (let year = 1; year <= 25; year++) {
            const yearSavings = annualSavings * Math.pow(1 + escalation, year - 1)
            cumulativeSavings += yearSavings
          }
          profit25 = cumulativeSavings - finalNetCost
        }

        const paybackYears: number | null =
          typeof projection.paybackYears === 'number' && projection.paybackYears > 0
            ? projection.paybackYears
            : annualSavings && annualSavings > 0 && finalNetCost > 0
            ? (() => {
                // Calculate payback with 4.5% annual escalation
                const escalation = 0.045
                let cumulative = 0
                for (let year = 1; year <= 25; year++) {
                  const yearSavings = annualSavings * Math.pow(1 + escalation, year - 1)
                  cumulative += yearSavings
                  if (cumulative >= finalNetCost) {
                    const prev = cumulative - yearSavings
                    return (year - 1) + ((finalNetCost - prev) / yearSavings)
                  }
                }
                return null
              })()
            : null

        netMeteringNarrative = {
          planLabel: chosen.label,
          annualSavings,
          paybackYears,
          profit25,
        }
      }
    }
  }
  
  // Calculate lifetime savings (25 years) - use best plan or fallback
  // For net metering, prioritize net metering narrative data
  const lifetimeSavings = isNetMetering && netMeteringNarrative?.profit25
    ? netMeteringNarrative.profit25
    : tou25YearSavings !== null && ulo25YearSavings !== null
    ? Math.max(tou25YearSavings, ulo25YearSavings)
    : (tou25YearSavings ?? ulo25YearSavings ?? (estimate?.savings?.lifetimeSavings || (estimate?.savings?.annualSavings ? estimate.savings.annualSavings * 25 : 0)))
  
  // Use combined savings if available, otherwise fall back to estimate savings
  // For net metering, prioritize net metering narrative data
  const finalAnnualSavings = isNetMetering && netMeteringNarrative?.annualSavings
    ? netMeteringNarrative.annualSavings
    : ratePlan === 'ulo' && uloCombinedAnnual
      ? uloCombinedAnnual
      : ratePlan === 'tou' && touCombinedAnnual
      ? touCombinedAnnual
      : batteryImpact?.annualSavings && estimate?.savings?.annualSavings
      ? estimate.savings.annualSavings + batteryImpact.annualSavings
      : estimate?.savings?.annualSavings ?? 0

  const finalMonthlySavings = isNetMetering && netMeteringNarrative?.annualSavings
    ? netMeteringNarrative.annualSavings / 12
    : ratePlan === 'ulo' && uloCombinedMonthly
      ? uloCombinedMonthly
      : ratePlan === 'tou' && touCombinedMonthly
      ? touCombinedMonthly
      : batteryImpact?.monthlySavings && estimate?.savings?.monthlySavings
      ? estimate.savings.monthlySavings + batteryImpact.monthlySavings
      : estimate?.savings?.monthlySavings ?? 0
  
  // Calculate payback period using same logic as StepReview
  // StepReview uses calculatePayback which accumulates savings year by year with escalation
  
  // Calculate payback using same function as StepReview
  const calculatePayback = (firstYearSavings: number, netCost: number, escalationRate: number): number => {
    if (netCost <= 0) return 999 // If no cost, return very high number
    if (firstYearSavings <= 0) {
      // If savings are negative or zero, calculate how long it would take
      // Use a simple linear approximation for very long payback periods
      return 999
    }
    let cumulativeSavings = 0
    for (let year = 1; year <= 100; year++) { // Extended to 100 years to catch very long paybacks
      const yearSavings = firstYearSavings * Math.pow(1 + escalationRate, year - 1)
      cumulativeSavings += yearSavings
      if (cumulativeSavings >= netCost) {
        // Interpolate to get fractional year
        const prevYearSavings = year > 1 ? firstYearSavings * Math.pow(1 + escalationRate, year - 2) : 0
        const prevCumulative = cumulativeSavings - yearSavings
        const remaining = netCost - prevCumulative
        const fraction = remaining / yearSavings
        return (year - 1) + fraction
      }
    }
    // If not reached in 100 years, calculate approximate payback using geometric series
    if (escalationRate > 0) {
      const r = 1 + escalationRate
      const n = Math.log(1 + (netCost * escalationRate) / firstYearSavings) / Math.log(r)
      return isFinite(n) && n > 0 ? n : 999
    } else {
      // No escalation, simple division
      return netCost / firstYearSavings
    }
  }
  
  // Calculate payback for both plans
  const touPaybackYears = touCombinedAnnual !== null && touCombinedAnnual > 0
    ? calculatePayback(touCombinedAnnual, touCombinedNet, escalation)
    : (() => {
        // Fallback: try to get from stored value
        if (tou?.paybackPeriod !== undefined && tou.paybackPeriod > 0) return tou.paybackPeriod
        if (touData?.combined?.projection?.paybackYears !== undefined) return touData.combined.projection.paybackYears
        if (touData?.allResults?.combined?.combined?.projection?.paybackYears !== undefined) return touData.allResults.combined.combined.projection.paybackYears
        return null
      })()
  
  const uloPaybackYears = uloCombinedAnnual !== null && uloCombinedAnnual > 0
    ? calculatePayback(uloCombinedAnnual, uloCombinedNet, escalation)
    : (() => {
        // Fallback: try to get from stored value
        if (ulo?.paybackPeriod !== undefined && ulo.paybackPeriod > 0) return ulo.paybackPeriod
        if (uloData?.combined?.projection?.paybackYears !== undefined) return uloData.combined.projection.paybackYears
        if (uloData?.allResults?.combined?.combined?.projection?.paybackYears !== undefined) return uloData.allResults.combined.combined.projection.paybackYears
        return null
      })()
  
  // Use the selected plan's payback, or fallback to estimate
  // For net metering, prioritize net metering narrative data
  const finalPaybackYears = isNetMetering && netMeteringNarrative?.paybackYears
    ? netMeteringNarrative.paybackYears
    : ratePlan === 'ulo' && uloPaybackYears !== null
    ? uloPaybackYears
    : ratePlan === 'tou' && touPaybackYears !== null
    ? touPaybackYears
    : (finalNetCost > 0 && finalAnnualSavings > 0 
      ? finalNetCost / finalAnnualSavings 
      : (estimate?.savings?.paybackYears ?? 0))

  const handleMatchInstaller = () => {
    setInstallerMatchRequested(true)
    if (onMatchInstaller) {
      onMatchInstaller()
    }
    // In real implementation, this would call an API to flag the lead
  }

  const handleExportPDF = () => {
    if (onExportPDF) {
      onExportPDF()
    } else {
      // Default behavior - could open print dialog or generate PDF
      window.print()
    }
  }

  const handleEmailPdfToMe = async () => {
    if (!leadData?.email) return
    if (typeof window === 'undefined') return

    const urlParams = new URLSearchParams(window.location.search)
    const leadIdFromQuery = urlParams.get('leadId')
    const effectiveLeadId = leadId || leadIdFromQuery

    if (!effectiveLeadId) return

    setEmailSending(true)
    setEmailSent(false)
    setEmailError(null)

    try {
      const fullName =
        [leadData.firstName, leadData.lastName].filter(Boolean).join(' ') ||
        leadData.email

      const response = await fetch('/api/leads/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email: leadData.email,
          address: leadData.address,
          estimate,
          peakShaving,
          batteryDetails,
           leadId: effectiveLeadId,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to send email')
      }

      setEmailSent(true)
    } catch (error) {
      console.error('Error sending estimate email:', error)
      setEmailError('Failed to email your results. Please try again.')
    } finally {
      setEmailSending(false)
    }
  }

  // Battery capacity (for subtle display in the System Size card)
  const batteryKwh =
    batteryDetails?.battery?.nominalKwh ??
    batteryImpact?.batterySizeKwh ??
    0

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-forest-500 to-forest-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-4">
              Your Solar Savings Results
            </h1>
            {leadData?.address && (
              <p className="text-xl text-white/90 mb-4">
                {leadData.address}
              </p>
            )}
            {/* Tracking ID Display */}
            {typeof window !== 'undefined' && (() => {
              const urlParams = new URLSearchParams(window.location.search)
              const leadId = urlParams.get('leadId')
              return leadId ? (
                <div className="mt-6 flex flex-col items-center gap-4">
                  <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                    <span className="text-sm text-white/80 font-medium">Tracking ID:</span>
                    <code className="text-sm font-mono font-bold text-white bg-white/20 px-3 py-1 rounded">
                      {leadId}
                    </code>
                    <button
                      onClick={async () => {
                        const trackingUrl = `https://www.solarcalculatorcanada.org/track/${leadId}`
                        try {
                          await navigator.clipboard.writeText(trackingUrl)
                          // Show temporary success message
                          setCopyButtonText('? Copied!')
                          setTimeout(() => {
                            setCopyButtonText('Copy Link')
                          }, 2000)
                        } catch (err) {
                          console.error('Failed to copy:', err)
                        }
                      }}
                      className={`text-xs px-3 py-1 rounded transition-colors font-medium ${
                        copyButtonText === '? Copied!' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-white/20 hover:bg-white/30 text-white'
                      }`}
                      title="Copy tracking link"
                    >
                      {copyButtonText}
                    </button>
                  </div>
                  <Link
                    href={`/track/${leadId}`}
                    className="inline-flex items-center gap-2 bg-white text-forest-600 hover:bg-white/90 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                  >
                    <ArrowRight className="rotate-[-45deg]" size={18} />
                    Track My Estimate
                  </Link>
                </div>
              ) : null
            })()}
          </div>
        </div>
      </section>

      {/* Key Metrics Section */}
      <section className="py-16 bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {/* System Size */}
            <div className="bg-gradient-to-br from-forest-50 to-forest-100 rounded-2xl p-6 text-center border-2 border-forest-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center h-full">
              <div className="w-14 h-14 bg-gradient-to-br from-forest-500 to-forest-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Zap className="text-white" size={26} />
              </div>
              <div className="text-4xl font-bold text-forest-700 mb-2">
                {formatKw(systemSizeKw)}
              </div>
              <div className="text-sm text-gray-700 font-semibold">
                System Size
              </div>
              <div className="text-xs text-gray-600 mt-2 font-medium">
                {numPanels} panels
              </div>
              {batteryKwh > 0 && (
                <div className="text-[11px] text-gray-600 mt-1 font-medium">
                  + {batteryKwh} kWh battery
                </div>
              )}
            </div>

            {/* Percentage Offset */}
            <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-2xl p-6 text-center border-2 border-sky-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center h-full">
              <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <TrendingUp className="text-white" size={26} />
              </div>
              <div className="text-4xl font-bold text-sky-700 mb-2">
                {percentageOffset}%
              </div>
              <div className="text-sm text-gray-700 font-semibold">
                Energy Offset
              </div>
              <div className="text-xs text-gray-600 mt-2 font-medium">
                of your usage
              </div>
            </div>

            {/* Total Bill Savings - Show both plans if available */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center h-full">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <DollarSign className="text-white" size={26} />
              </div>
              {isNetMetering && netMetering ? (
                (() => {
                  // Check if this is Alberta Solar Club
                  const isAlberta = leadData?.province && (leadData.province.toUpperCase() === 'AB' || leadData.province.toUpperCase() === 'ALBERTA' || leadData.province.toUpperCase().includes('ALBERTA'))
                  const albertaData = isAlberta && (netMetering as any).tou?.alberta
                  
                  if (isAlberta && albertaData) {
                    // Alberta Solar Club: Show single savings percentage
                    const touPlan = (netMetering as any).tou
                    const projection = touPlan?.projection || {}
                    const annualSavings = projection.annualSavings ?? (touPlan?.annual?.importCost || 0) - (touPlan?.annual?.netAnnualBill || 0)
                    const importCost = touPlan?.annual?.importCost || 0
                    const savingsPercent = annualSavings > 0 && importCost > 0 ? (annualSavings / importCost) * 100 : 0
                    
                    return (
                      <>
                        <div className="text-sm text-gray-700 font-semibold mb-3">
                          Total Bill Savings (Alberta Solar Club)
                        </div>
                        <div className="text-4xl font-bold text-purple-700 mb-2">
                          {savingsPercent.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">
                          Summer: 33¢/kWh export • Winter: 6.89¢/kWh import
                        </div>
                      </>
                    )
                  }
                  
                  // Non-Alberta: Show TOU/ULO/Tiered plans
                  const plans = [
                    { id: 'TOU', data: (netMetering as any).tou },
                    { id: 'ULO', data: (netMetering as any).ulo },
                    { id: 'Tiered', data: (netMetering as any).tiered },
                  ].filter(p => p.data?.annual)

                  const getPercent = (plan: any) => {
                    const proj = plan.projection || {}
                    const annualSavings =
                      proj.annualSavings ??
                      (plan.annual
                        ? plan.annual.importCost - plan.annual.netAnnualBill
                        : 0)
                    const importCost = plan.annual?.importCost || 0
                    if (annualSavings > 0 && importCost > 0) {
                      return (annualSavings / importCost) * 100
                    }
                    return null
                  }

                  return plans.length ? (
                    <>
                      <div className="text-sm text-gray-700 font-semibold mb-3">
                        Total Bill Savings (Net Metering)
                      </div>
                      <div className="text-xs text-gray-600 space-y-2">
                        {plans.map(plan => {
                          const pct = getPercent(plan.data)
                          return (
                            <div
                              key={plan.id}
                              className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2"
                            >
                              <span className="font-medium">{plan.id}:</span>
                              <span className="text-xl font-bold text-purple-700">
                                {pct == null ? 'N/A' : `${pct.toFixed(1)}%`}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : null
                })()
              ) : touBillSavingsPercent !== null && uloBillSavingsPercent !== null ? (
                <>
                  <div className="text-sm text-gray-700 font-semibold mb-3">
                    Total Bill Savings
                  </div>
                  <div className="text-xs text-gray-600 space-y-2">
                    <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                      <span className="font-medium">TOU:</span>
                      <span className="text-xl font-bold text-purple-700">
                        {touBillSavingsPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                      <span className="font-medium">ULO:</span>
                      <span className="text-xl font-bold text-purple-700">
                        {uloBillSavingsPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </>
              ) : touBillSavingsPercent !== null ? (
                <>
                  <div className="text-4xl font-bold text-purple-700 mb-2">
                    {touBillSavingsPercent.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-700 font-semibold">
                    Total Bill Savings
                  </div>
                  <div className="text-xs text-gray-600 mt-2 font-medium">
                    TOU Plan
                  </div>
                </>
              ) : uloBillSavingsPercent !== null ? (
                <>
                  <div className="text-4xl font-bold text-purple-700 mb-2">
                    {uloBillSavingsPercent.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-700 font-semibold">
                    Total Bill Savings
                  </div>
                  <div className="text-xs text-gray-600 mt-2 font-medium">
                    ULO Plan
                  </div>
                </>
              ) : null}
            </div>

            {/* Payback Period - Show both plans if available (or all 3 net metering plans) */}
            <div className="bg-gradient-to-br from-maple-50 to-maple-100 rounded-2xl p-6 text-center border-2 border-maple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center h-full">
              <div className="w-14 h-14 bg-gradient-to-br from-maple-500 to-maple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Clock className="text-white" size={26} />
              </div>
              {isNetMetering && netMetering ? (
                (() => {
                  // Check if this is Alberta Solar Club
                  const isAlberta = leadData?.province && (leadData.province.toUpperCase() === 'AB' || leadData.province.toUpperCase() === 'ALBERTA' || leadData.province.toUpperCase().includes('ALBERTA'))
                  const albertaData = isAlberta && (netMetering as any).tou?.alberta
                  
                  if (isAlberta && albertaData) {
                    // Alberta Solar Club: Show single payback period
                    const touPlan = (netMetering as any).tou
                    const projection = touPlan?.projection || {}
                    const paybackYears = projection.paybackYears
                    const years = typeof paybackYears === 'number' && paybackYears > 0 ? paybackYears : null
                    
                    return (
                      <>
                        <div className="text-sm text-gray-700 font-semibold mb-3">
                          Payback Period (Alberta Solar Club)
                        </div>
                        <div className="text-4xl font-bold text-maple-700 mb-2">
                          {years == null ? 'N/A' : `${years.toFixed(1)} yrs`}
                        </div>
                        <div className="text-xs text-gray-600">
                          Based on summer/winter rates
                        </div>
                      </>
                    )
                  }
                  
                  // Non-Alberta: Show TOU/ULO/Tiered plans
                  const plans = [
                    { id: 'TOU', data: (netMetering as any).tou },
                    { id: 'ULO', data: (netMetering as any).ulo },
                    { id: 'Tiered', data: (netMetering as any).tiered },
                  ].filter(p => p.data)

                  const getPayback = (plan: any) => {
                    const proj = plan.projection || {}
                    const years = proj.paybackYears
                    return typeof years === 'number' && years > 0 ? years : null
                  }

                  return plans.length ? (
                    <>
                      <div className="text-sm text-gray-700 font-semibold mb-3">
                        Payback Period (Net Metering)
                      </div>
                      <div className="text-xs text-gray-600 space-y-2">
                        {plans.map(plan => {
                          const years = getPayback(plan.data)
                          return (
                            <div
                              key={plan.id}
                              className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2"
                            >
                              <span className="font-medium">{plan.id}:</span>
                              <span className="text-xl font-bold text-maple-700">
                                {years == null ? 'N/A' : `${years.toFixed(1)} yrs`}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : null
                })()
              ) : touPaybackYears !== null && uloPaybackYears !== null ? (
                <>
                  <div className="text-sm text-gray-700 font-semibold mb-3">
                    Payback Period
                  </div>
                  <div className="text-xs text-gray-600 space-y-2">
                    <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                      <span className="font-medium">TOU:</span>
                      <span className="text-xl font-bold text-maple-700">{touPaybackYears.toFixed(1)} yrs</span>
                    </div>
                    <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                      <span className="font-medium">ULO:</span>
                      <span className="text-xl font-bold text-maple-700">{uloPaybackYears.toFixed(1)} yrs</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold text-maple-700 mb-2">
                    {finalPaybackYears.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-700 font-semibold">
                    Payback Period
                  </div>
                  <div className="text-xs text-gray-600 mt-2 font-medium">
                    years
                  </div>
                </>
              )}
            </div>

            {/* 25-Year Lifetime Savings/Profit - Show both plans if available (or all 3 net metering plans) */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 text-center border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <TrendingUp className="text-white" size={26} />
              </div>
              {isNetMetering && netMetering ? (
                (() => {
                  // Check if this is Alberta Solar Club
                  const isAlberta = leadData?.province && (leadData.province.toUpperCase() === 'AB' || leadData.province.toUpperCase() === 'ALBERTA' || leadData.province.toUpperCase().includes('ALBERTA'))
                  const albertaData = isAlberta && (netMetering as any).tou?.alberta
                  
                  if (isAlberta && albertaData) {
                    // Alberta Solar Club: Show single 25-year profit
                    const touPlan = (netMetering as any).tou
                    const projection = touPlan?.projection || {}
                    const profit25 = projection.netProfit25Year ?? 0
                    
                    return (
                      <>
                        <div className="text-sm text-gray-700 font-semibold mb-3">
                          25-Year Profit (Alberta Solar Club)
                        </div>
                        <div className="text-3xl sm:text-4xl font-bold text-emerald-700 mb-2">
                          {formatCurrency(Math.round(profit25))}
                        </div>
                        <div className="text-xs text-gray-600">
                          After payback period
                        </div>
                      </>
                    )
                  }
                  
                  // Non-Alberta: Show TOU/ULO/Tiered plans
                  const plans = [
                    { id: 'TOU', data: (netMetering as any).tou },
                    { id: 'ULO', data: (netMetering as any).ulo },
                    { id: 'Tiered', data: (netMetering as any).tiered },
                  ].filter(p => p.data)

                  return plans.length ? (
                    <>
                      <div className="text-sm text-gray-700 font-semibold mb-3">
                        25-Year Profit (Net Metering)
                      </div>
                      <div className="text-xs text-gray-600 space-y-2">
                        {plans.map(plan => {
                          const proj = plan.data.projection || {}
                          const profit = proj.netProfit25Year ?? 0
                          return (
                            <div
                              key={plan.id}
                              className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2"
                            >
                              <span className="font-medium">{plan.id}:</span>
                              <span className="text-lg font-bold text-emerald-700">
                                {formatCurrency(Math.round(profit || 0))}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-emerald-200">
                        After payback period
                      </div>
                    </>
                  ) : null
                })()
              ) : tou25YearSavings !== null && ulo25YearSavings !== null ? (
                <>
                  <div className="text-sm text-gray-700 font-semibold mb-3">
                    25-Year Lifetime Savings
                  </div>
                  <div className="text-xs text-gray-600 space-y-2">
                    <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                      <span className="font-medium">TOU:</span>
                      <span className="text-lg font-bold text-emerald-700">{formatCurrency(Math.round(tou25YearSavings))}</span>
                  </div>
                    <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                      <span className="font-medium">ULO:</span>
                      <span className="text-lg font-bold text-emerald-700">{formatCurrency(Math.round(ulo25YearSavings))}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-emerald-200">
                    After payback period
                  </div>
                </>
              ) : lifetimeSavings > 0 ? (
                <>
                  <div className="text-3xl sm:text-4xl font-bold text-emerald-700 mb-2">
                    {formatCurrency(Math.round(lifetimeSavings))}
                  </div>
                  <div className="text-sm text-gray-700 font-semibold">
                    25-Year Lifetime Savings
                  </div>
                  <div className="text-xs text-gray-600 mt-2 font-medium">
                    {formatCurrency(Math.round(finalAnnualSavings))}/yr � 25 years
                  </div>
                  {ratePlan && (
                    <div className="text-xs text-forest-700 mt-2 font-semibold">
                      {ratePlan.toUpperCase()} Plan
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-3xl sm:text-4xl font-bold text-emerald-700 mb-2">
                    {formatCurrency(Math.round(finalAnnualSavings * 25))}
                  </div>
                  <div className="text-sm text-gray-700 font-semibold">
                    25-Year Projected Savings
                  </div>
                  <div className="text-xs text-gray-600 mt-2 font-medium">
                    Based on annual savings
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Results Content */}
      <section className="pt-20 pb-32 bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Main Results */}
            <div className="lg:col-span-2 space-y-8">
              {/* What These Results Mean */}
              <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
                <h2 className="text-2xl font-bold text-forest-500 mb-6 flex items-center gap-3">
                  <Lightbulb className="text-maple-500" size={28} />
                  What These Results Mean
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      Your {formatKw(systemSizeKw)} Solar System
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      Based on your property and energy usage, we recommend a {formatKw(systemSizeKw)} solar system with {numPanels} panels. 
                      {estimate?.production?.annualKwh && (
                        <> This system will generate approximately {formatKwh(estimate.production.annualKwh)} of electricity per year, 
                        which should cover about {percentageOffset}% of your energy needs.</>
                      )}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      Your Investment & Savings
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      After rebates, your net investment is {formatCurrency(finalNetCost)}.{' '}
                      {isNetMetering && netMeteringNarrative ? (
                        <>
                          {netMeteringNarrative.planLabel === 'Alberta Solar Club' ? (
                            <>
                              With <strong>Alberta Solar Club</strong> (summer export rate: 33¢/kWh, winter import rate: 6.89¢/kWh), you'll save
                              approximately{' '}
                              {formatCurrency(Math.round(netMeteringNarrative.annualSavings || 0))} per
                              year on electricity bills, which means your system will pay for itself in
                              about{' '}
                              {netMeteringNarrative.paybackYears != null && isFinite(netMeteringNarrative.paybackYears)
                                ? netMeteringNarrative.paybackYears.toFixed(1)
                                : 'N/A'}{' '}
                              years.{' '}
                              {netMeteringNarrative.profit25 !== null && (
                                <>
                                  Over the system's 25-year lifespan, you could save over{' '}
                                  {formatCurrency(Math.round(netMeteringNarrative.profit25))}.
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              For net metering with the{' '}
                              <strong>{netMeteringNarrative.planLabel} rate plan</strong>, you'll save
                              approximately{' '}
                              {formatCurrency(Math.round(netMeteringNarrative.annualSavings || 0))} per
                              year on electricity bills, which means your system will pay for itself in
                              about{' '}
                              {netMeteringNarrative.paybackYears != null && isFinite(netMeteringNarrative.paybackYears)
                                ? netMeteringNarrative.paybackYears.toFixed(1)
                                : 'N/A'}{' '}
                              years.{' '}
                              {netMeteringNarrative.profit25 !== null && (
                                <>
                                  Over the system's 25-year lifespan, you could save over{' '}
                                  {formatCurrency(Math.round(netMeteringNarrative.profit25))}.
                                </>
                              )}
                            </>
                          )}
                        </>
                      ) : touCombinedAnnual && uloCombinedAnnual ? (
                        <>
                          With the <strong>TOU rate plan</strong>, you'll save approximately {formatCurrency(touCombinedAnnual)} per year, 
                          which means your system will pay for itself in about {touPaybackYears != null && isFinite(touPaybackYears) ? touPaybackYears.toFixed(1) : 'N/A'} years.{' '}
                          {tou25YearSavings !== null && <>Over 25 years, you could save over {formatCurrency(tou25YearSavings)}.</>}
                          {' '}With the <strong>ULO rate plan</strong>, you'll save approximately {formatCurrency(uloCombinedAnnual)} per year, 
                          which means your system will pay for itself in about {uloPaybackYears != null && isFinite(uloPaybackYears) ? uloPaybackYears.toFixed(1) : 'N/A'} years.{' '}
                          {ulo25YearSavings !== null && <>Over 25 years, you could save over {formatCurrency(ulo25YearSavings)}.</>}
                        </>
                      ) : (
                        <>
                          You'll save approximately {formatCurrency(finalAnnualSavings)} per year on electricity bills{ratePlan ? ` with the ${ratePlan.toUpperCase()} rate plan` : ''}, 
                          which means your system will pay for itself in about {finalPaybackYears.toFixed(1)} years. 
                          Over the system's 25-year lifespan, you could save over {formatCurrency(lifetimeSavings)}.
                        </>
                      )}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      Environmental Impact
                    </h3>
                    {estimate?.environmental && (
                      <p className="text-gray-700 leading-relaxed">
                        Your solar system will offset approximately {estimate.environmental.co2OffsetTonsPerYear?.toFixed(1) || '0'} tons of CO? per year. 
                        That's equivalent to planting {estimate.environmental.treesEquivalent || 0} trees or taking {estimate.environmental.carsOffRoadEquivalent?.toFixed(1) || '0'} cars off the road annually.
                      </p>
                    )}
                  </div>

                  {/* Selected Battery Section */}
                  {(selectedBattery || batteryDetails) && (
                    <div className="bg-forest-50 rounded-lg p-6 border border-forest-200">
                      <div className="flex items-center gap-3 mb-3">
                        <Battery className="text-forest-600" size={24} />
                        <h3 className="font-bold text-gray-900">
                          Selected Battery System
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {batteryDetails?.battery && (
                          <>
                            <p className="text-gray-700">
                              <span className="font-semibold">Battery:</span>{' '}
                              {batteryDetails.battery.name || batteryDetails.battery.model || selectedBattery || 'Battery System'}
                            </p>
                            <p className="text-gray-700">
                              <span className="font-semibold">Capacity:</span>{' '}
                              {batteryDetails.battery.nominalKwh || batteryImpact?.batterySizeKwh || 0} kWh
                            </p>
                            {batteryDetails.battery.price && (
                              <p className="text-gray-700">
                                <span className="font-semibold">Battery Cost:</span>{' '}
                                {formatCurrency(batteryDetails.battery.price)}
                              </p>
                            )}
                            {displayPlan && (
                              <p className="text-gray-700">
                                <span className="font-semibold">Rate Plan:</span>{' '}
                                <span className="uppercase">{displayPlan}</span>
                              </p>
                            )}
                          </>
                        )}
                        {!batteryDetails?.battery && batteryImpact && (
                          <>
                            <p className="text-gray-700">
                              <span className="font-semibold">Battery Capacity:</span>{' '}
                              {batteryImpact.batterySizeKwh} kWh
                            </p>
                            {displayPlan && (
                              <p className="text-gray-700">
                                <span className="font-semibold">Rate Plan:</span>{' '}
                                <span className="uppercase">{displayPlan}</span>
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {batteryImpact && (
                    <div className="bg-sky-50 rounded-lg p-6 border border-sky-200">
                      <div className="flex items-center gap-3 mb-3">
                        <Battery className="text-sky-600" size={24} />
                        <h3 className="font-bold text-gray-900">
                          Battery Storage Benefits
                        </h3>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        With a {batteryImpact.batterySizeKwh}kWh battery system, you can save an additional {formatCurrency(batteryImpact.annualSavings)} per year 
                        through peak shaving and energy arbitrage. {estimate?.savings?.annualSavings && (
                          <>This brings your total annual savings to {formatCurrency(estimate.savings.annualSavings + batteryImpact.annualSavings)}.</>
                        )}
                      </p>
                    </div>
                  )}
                </div>

              {/* Engineering & final design disclaimer */}
              <div className="mt-6 flex items-start gap-2 text-xs text-gray-700">
                <InfoTooltip
                  content="System size, layout, equipment model, and projected output shown by this calculator are preliminary estimates only. Final design, pricing, and performance can only be confirmed after a full site assessment, roof analysis, and engineering review by a qualified installer."
                />
                <span>System design and performance are preliminary and must be confirmed by an installer.</span>
              </div>
              </div>

              {/* Rate Plan Information (TOU/ULO) - hide for net metering since we show dedicated cards above */}
              {!isNetMetering && (touData || uloData) && (
                <div className="bg-white rounded-2xl p-8 shadow-md">
                  <h2 className="text-2xl font-bold text-forest-500 mb-6">
                    Rate Plan Comparison
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Compare annual savings for each rate plan. Higher savings indicate a better option for your usage pattern.
                  </p>
                  <div className="space-y-4">
                    {(touData || uloData) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {touData && (
                          <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900">TOU Plan</span>
                            </div>
                            {touCombinedAnnual && (
                              <>
                                <div className="text-xs text-gray-500 mb-1">Annual Savings</div>
                                <div className="text-2xl font-bold text-forest-600">
                                  {formatCurrency(touCombinedAnnual)}/year
                                </div>
                              </>
                            )}
                            {touCombinedMonthly && (
                              <>
                                <div className="text-xs text-gray-500 mt-2 mb-1">Monthly Savings</div>
                                <div className="text-sm text-gray-600">
                                  {formatCurrency(touCombinedMonthly)}/month
                                </div>
                              </>
                            )}
                            {touBillSavingsPercent !== null && (
                              <>
                                <div className="text-xs text-gray-500 mt-2 mb-1">Total Bill Savings</div>
                                <div className="text-lg font-bold text-forest-600">
                                  {touBillSavingsPercent.toFixed(1)}%
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        {uloData && (
                          <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900">ULO Plan</span>
                            </div>
                            {uloCombinedAnnual && (
                              <>
                                <div className="text-xs text-gray-500 mb-1">Annual Savings</div>
                                <div className="text-2xl font-bold text-forest-600">
                                  {formatCurrency(uloCombinedAnnual)}/year
                                </div>
                              </>
                            )}
                            {uloCombinedMonthly && (
                              <>
                                <div className="text-xs text-gray-500 mt-2 mb-1">Monthly Savings</div>
                                <div className="text-sm text-gray-600">
                                  {formatCurrency(uloCombinedMonthly)}/month
                                </div>
                              </>
                            )}
                            {uloBillSavingsPercent !== null && (
                              <>
                                <div className="text-xs text-gray-500 mt-2 mb-1">Total Bill Savings</div>
                                <div className="text-lg font-bold text-forest-600">
                                  {uloBillSavingsPercent.toFixed(1)}%
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comprehensive Summary Section */}
              <div className="bg-white rounded-2xl p-8 shadow-md">
                <h2 className="text-2xl font-bold text-forest-500 mb-6">
                  Complete Estimate Summary
                </h2>
                
                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                  <button
                    onClick={() => setActiveSummaryTab('overview')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors ${
                      activeSummaryTab === 'overview'
                        ? 'text-forest-500 border-b-2 border-forest-500'
                        : 'text-gray-600 hover:text-forest-500'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveSummaryTab('savings')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors ${
                      activeSummaryTab === 'savings'
                        ? 'text-forest-500 border-b-2 border-forest-500'
                        : 'text-gray-600 hover:text-forest-500'
                    }`}
                  >
                    Savings & Payback
                  </button>
                  <button
                    onClick={() => setActiveSummaryTab('environmental')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors ${
                      activeSummaryTab === 'environmental'
                        ? 'text-forest-500 border-b-2 border-forest-500'
                        : 'text-gray-600 hover:text-forest-500'
                    }`}
                  >
                    Environmental Impact
                  </button>
                </div>

                {/* Tab Content */}
                {activeSummaryTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Roof Summary */}
                    {roofData && (
                      <RoofSummary
                        roofAreaSqft={roofData.roofAreaSqft || 0}
                        roofType={roofData.roofType}
                        roofPitch={roofData.roofPitch}
                        shadingLevel={roofData.shadingLevel}
                        roofAge={roofData.roofAge}
                        roofPolygon={roofData.roofPolygon}
                        roofSections={roofData.roofSections}
                      />
                    )}

                    {/* Energy Summary */}
                    {(monthlyBill || energyUsage) && (
                      <EnergySummary
                        energyUsage={energyUsage}
                        appliances={appliances}
                        monthlyBill={monthlyBill}
                      />
                    )}

                    {/* Photos */}
                    {photos && photos.length > 0 && (
                      <PhotosSummary
                        photos={photos}
                        photoSummary={photoSummary}
                        onImageClick={handleImageClick}
                      />
                    )}

                    {/* Battery Details */}
                    {batteryDetails && programType !== 'net_metering' && (
                      <BatteryDetails
                        batteryDetails={batteryDetails}
                        peakShaving={peakShaving}
                      />
                    )}

                    {/* Net Metering Results */}
                    {programType === 'net_metering' && netMetering && (
                      <NetMeteringResults
                        netMeteringData={netMetering}
                        systemSizeKw={estimate?.system?.sizeKw || solarOverride?.sizeKw}
                        numPanels={estimate?.system?.numPanels || solarOverride?.numPanels}
                        province={leadData?.province}
                      />
                    )}

                    {/* Add-ons */}
                    {addOns && addOns.length > 0 && (
                      <div className="bg-sky-50 rounded-lg p-6 border border-sky-200">
                        <h3 className="font-bold text-gray-900 mb-4">Selected Add-ons</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {addOns.map((addon: any, index: number) => (
                            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="font-semibold text-gray-900">{addon.name || addon}</div>
                              {addon.price && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {formatCurrency(addon.price)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TOU/ULO Comparison - Only show for battery/peak shaving programs */}
                    {programType !== 'net_metering' && (() => {
                      // Extract before/after data for TOU and ULO
                      let touBeforeAfter = null
                      let uloBeforeAfter = null
                      
                      if (batteryDetails) {
                        const touCombined = tou?.allResults?.combined?.combined || 
                                          tou?.combined?.combined ||
                                          tou?.combined
                        const uloCombined = ulo?.allResults?.combined?.combined || 
                                          ulo?.combined?.combined ||
                                          ulo?.combined
                        
                        if (touCombined) {
                          const before = touCombined.baselineAnnualBill || touCombined.baselineAnnualBillEnergyOnly || 0
                          const after = touCombined.postSolarBatteryAnnualBill || touCombined.postSolarBatteryAnnualBillEnergyOnly || 0
                          const annualSavings = touCombined.annual || (before - after)
                          if (before > 0 && after >= 0) {
                            touBeforeAfter = { before, after, savings: annualSavings }
                          }
                        }
                        
                        if (uloCombined) {
                          const before = uloCombined.baselineAnnualBill || uloCombined.baselineAnnualBillEnergyOnly || 0
                          const after = uloCombined.postSolarBatteryAnnualBill || uloCombined.postSolarBatteryAnnualBillEnergyOnly || 0
                          const annualSavings = uloCombined.annual || (before - after)
                          if (before > 0 && after >= 0) {
                            uloBeforeAfter = { before, after, savings: annualSavings }
                          }
                        }
                      }
                      
                      const combinedMonthlySavings = finalMonthlySavings
                      
                      return (touBeforeAfter || uloBeforeAfter) ? (
                        <BeforeAfterComparison
                          includeBattery={!!batteryDetails}
                          touBeforeAfter={touBeforeAfter}
                          uloBeforeAfter={uloBeforeAfter}
                          combinedMonthlySavings={combinedMonthlySavings}
                          displayPlan={displayPlan || 'tou'}
                        />
                      ) : null
                    })()}
                  </div>
                )}

                {activeSummaryTab === 'savings' && (
                  <SavingsTab
                    estimate={estimate}
                    programType={currentProgramType}
                    netMetering={netMetering as any}
                    includeBattery={!!batteryDetails}
                    tou={tou}
                    ulo={ulo}
                    peakShaving={peakShaving}
                    combinedNetCost={combinedNetCost || estimate?.costs?.netCost || 0}
                    isMobile={isMobile}
                    annualEscalator={annualEscalator}
                    touBeforeAfter={(() => {
                      const touCombined = tou?.allResults?.combined?.combined || 
                                        tou?.combined?.combined ||
                                        tou?.combined
                      if (touCombined) {
                        const before = touCombined.baselineAnnualBill || 0
                        const after = touCombined.postSolarBatteryAnnualBill || 0
                        if (before > 0 && after >= 0) {
                          return { before, after, savings: before - after }
                        }
                      }
                      return null
                    })()}
                    uloBeforeAfter={(() => {
                      const uloCombined = ulo?.allResults?.combined?.combined || 
                                        ulo?.combined?.combined ||
                                        ulo?.combined
                      if (uloCombined) {
                        const before = uloCombined.baselineAnnualBill || 0
                        const after = uloCombined.postSolarBatteryAnnualBill || 0
                        if (before > 0 && after >= 0) {
                          return { before, after, savings: before - after }
                        }
                      }
                      return null
                    })()}
                    province={leadData?.province}
                  />
                )}

                {activeSummaryTab === 'environmental' && estimate?.environmental && (
                  <EnvironmentalTab
                    co2OffsetTonsPerYear={estimate.environmental.co2OffsetTonsPerYear || 0}
                    treesEquivalent={estimate.environmental.treesEquivalent || 0}
                    carsOffRoadEquivalent={estimate.environmental.carsOffRoadEquivalent || 0}
                  />
                )}
              </div>

              {/* Solar Club Alberta - show only for Alberta province and net metering */}
              {leadData?.province && (leadData.province.toUpperCase() === 'AB' || leadData.province.toUpperCase() === 'ALBERTA') && programType === 'net_metering' && (
                <SolarClubAlberta
                  city={leadData?.address?.city || (typeof leadData?.address === 'string' ? leadData.address.split(',')[1]?.trim() : null) || undefined}
                  address={typeof leadData?.address === 'string' ? leadData.address : undefined}
                  systemSizeKw={estimate?.system?.sizeKw || solarOverride?.sizeKw || 0}
                  annualProductionKwh={estimate?.production?.annualKwh}
                />
              )}
            </div>

            {/* Right Column - Actions & Next Steps */}
            <div className="space-y-6">
              {/* Match with Installer CTA */}
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-forest-500 to-forest-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Handshake className="text-white" size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-forest-500 mb-2">
                    Next Step: Get a Proposal
                  </h2>
                  <p className="text-gray-600">
                    Connect with vetted local installers to get detailed quotes
                  </p>
                </div>

              {/* Not a contract or quote disclaimer */}
              <div className="mb-4 flex items-start gap-2 text-xs text-gray-700">
                <InfoTooltip
                  content="These results are estimates for educational and informational purposes only. They do not constitute a quote, contract, guarantee of performance, or confirmation of eligibility for any program or incentive. A qualified installer must provide a formal proposal and conduct a site assessment before any system is approved or installed."
                />
                <span>Results are informational only � not a formal quote or contract.</span>
              </div>

                  <button
                  disabled
                  className="w-full h-14 text-lg inline-flex items-center justify-center bg-gray-100 text-gray-400 cursor-not-allowed rounded-lg font-semibold relative"
                  >
                  <span>Match Me with a Vetted Installer</span>
                  <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-500 text-xs font-bold rounded-full">
                    COMING SOON
                  </span>
                  </button>

                <div className="mt-6 space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="text-forest-500 flex-shrink-0 mt-0.5" size={18} />
                    <span>All installers are certified and insured</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="text-forest-500 flex-shrink-0 mt-0.5" size={18} />
                    <span>Double warranty protection included</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="text-forest-500 flex-shrink-0 mt-0.5" size={18} />
                    <span>No obligation, compare quotes freely</span>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Export Your Results</h3>
                <div className="space-y-3">
                  {/* Track My Estimate Button */}
                  {typeof window !== 'undefined' && (() => {
                    const urlParams = new URLSearchParams(window.location.search)
                    const leadId = urlParams.get('leadId')
                    return leadId ? (
                      <Link
                        href={`/track/${leadId}`}
                        className="w-full btn-primary inline-flex items-center justify-center"
                      >
                        <ArrowRight className="mr-2" size={18} />
                        Track My Estimate
                      </Link>
                    ) : null
                  })()}
                  <button
                    onClick={handleExportPDF}
                    className="w-full btn-outline border-forest-500 text-forest-500 hover:bg-forest-50 inline-flex items-center justify-center"
                  >
                    <Download className="mr-2" size={18} />
                    Download PDF Summary
                  </button>
                  {leadData?.email && (
                    <>
                      <button
                        type="button"
                        onClick={handleEmailPdfToMe}
                        disabled={emailSending}
                         className="w-full h-11 text-sm inline-flex items-center justify-center bg-forest-500 text-white hover:bg-forest-600 rounded-lg font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                         {emailSending ? (
                           <>
                             <span className="mr-2 inline-flex h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                             <span>Sending Email...</span>
                           </>
                         ) : (
                           <>
                             <Mail className="mr-2" size={16} />
                             <span>Email PDF to Me</span>
                           </>
                         )}
                      </button>
                      {emailSent && !emailError && (
                        <p className="text-xs text-forest-600 mt-1 text-center">
                          Sent to {leadData.email}.
                        </p>
                      )}
                      {emailError && (
                        <p className="text-xs text-red-600 mt-1 text-center">
                          {emailError}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Feedback Link */}
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <h3 className="font-bold text-gray-900 mb-3">Help Us Improve</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Have suggestions for the calculator or want to report an issue?
                </p>
                <button
                  onClick={() => setShowFeedbackForm(true)}
                  className="w-full btn-outline text-sm"
                >
                  Provide Feedback
                </button>
              </div>

              {/* Trust Badges */}
              <div className="bg-sky-50 rounded-2xl p-6 border border-sky-200">
                <h3 className="font-bold text-gray-900 mb-4">Why Trust Our Platform</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Leaf className="text-forest-500 flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-gray-700">Independent, unbiased calculator</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="text-forest-500 flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-gray-700">All installers are vetted</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="text-forest-500 flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-gray-700">Transparent calculations</span>
                  </div>
                </div>
              </div>

              {/* System Specifications � under Why Trust card, reusing card styling */}
              <div className="bg-white rounded-2xl p-8 shadow-md">
                <h3 className="text-2xl font-bold text-forest-500 mb-4">System Specifications</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="font-medium">System Size</span>
                    <span className="font-semibold">{formatKw(systemSizeKw)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="font-medium">Number of Panels</span>
                    <span className="font-semibold">{numPanels ?? 0}</span>
                  </div>
                  {batteryKwh > 0 && (
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <span className="font-medium">Battery Capacity</span>
                      <span className="font-semibold">{batteryKwh} kWh</span>
                    </div>
                  )}
                  {estimate?.production?.annualKwh != null && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Annual Production</span>
                      <span className="font-semibold">
                        {formatProductionRange(estimate.production.annualKwh)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Production Estimate � moved under trust area */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md">
                <h3 className="text-2xl font-bold text-forest-500 mb-6">
                  Monthly Production Estimate
                </h3>
                <div className="space-y-3">
                  {estimate?.production?.monthlyKwh?.map((kwh, index) => {
                    const monthNames = [
                      'Jan',
                      'Feb',
                      'Mar',
                      'Apr',
                      'May',
                      'Jun',
                      'Jul',
                      'Aug',
                      'Sep',
                      'Oct',
                      'Nov',
                      'Dec',
                    ]
                    const monthlyKwh = estimate?.production?.monthlyKwh || []
                    const maxKwh = monthlyKwh.length > 0 ? Math.max(...monthlyKwh) : 0
                    const percentage = maxKwh > 0 ? (kwh / maxKwh) * 100 : 0

                    return (
                      <div key={index} className="flex items-center gap-3 md:gap-4">
                        <div className="w-12 md:w-16 text-sm font-medium text-gray-700 flex-shrink-0">
                          {monthNames[index]}
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-full h-8 md:h-10 relative overflow-hidden min-w-0">
                          <div
                            className="bg-gradient-to-r from-sky-400 to-forest-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          />
                        </div>
                        <div className="w-20 md:w-24 text-xs md:text-sm font-medium text-gray-700 text-right flex-shrink-0">
                          {formatKwh(kwh)}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Production varies by season, with peak generation in summer months when days are longer
                  and sunnier.
                </p>
              </div>

              {/* Cost Breakdown � moved here, preserving original card styling */}
              <div className="bg-white rounded-2xl p-8 shadow-md">
                <h3 className="text-2xl font-bold text-forest-500 mb-6">Cost Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-700">Solar System Cost</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(solarSystemCost)}
                    </span>
                  </div>
                  {batterySystemCost > 0 && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-200">
                      <span className="text-gray-700">Battery Cost</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(batterySystemCost)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="font-semibold text-gray-800">Total System Cost</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(totalSystemCost)}
                    </span>
                  </div>
                  {solarRebateAmount > 0 && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-200">
                      <span className="text-gray-700">Solar Rebates</span>
                      <span className="font-semibold text-green-600">
                        -{formatCurrency(solarRebateAmount)}
                      </span>
                    </div>
                  )}
                  {batteryRebateAmount > 0 && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-200">
                      <span className="text-gray-700">Battery Rebates</span>
                      <span className="font-semibold text-green-600">
                        -{formatCurrency(batteryRebateAmount)}
                      </span>
                    </div>
                  )}
                  {totalRebates > 0 && (
                    <div className="flex justify-between items-center py-2 border-b-2 border-gray-300">
                      <span className="font-semibold text-gray-700">Total Rebates</span>
                      <span className="font-semibold text-green-600">
                        -{formatCurrency(totalRebates)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-4 bg-forest-50 rounded-lg px-4">
                    <span className="font-bold text-gray-900">Your Net Investment</span>
                    <span className="font-bold text-2xl text-forest-600">
                      {formatCurrency(finalNetCost)}
                    </span>
                  </div>
                  {financingOptionLabel && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-700">Payment Method</span>
                        <span
                          className={
                            isCashPurchase
                              ? 'inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-[11px] font-semibold uppercase tracking-wide'
                              : 'font-semibold text-gray-900'
                          }
                        >
                          {financingOptionLabel}
                        </span>
                      </div>
                      {isCashPurchase && (
                        <p className="mt-2 text-[11px] text-green-700 font-medium">
                          Cash purchase offers the lowest lifetime cost and highest long?term savings.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-start gap-2 text-xs text-gray-700">
                  <InfoTooltip
                    content="Estimated pricing, incentives, and rebates are based on current publicly available program information. Programs may change, close, or require specific eligibility criteria. Final pricing and incentives are confirmed only through a formal proposal from a qualified installer."
                  />
                  <span>
                    Pricing and rebates are estimates only � final amounts come from your installer.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Assumption Summary Box */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <details className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-300 rounded-xl shadow-lg overflow-hidden">
          <summary className="cursor-pointer p-6 hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500 rounded-lg">
                  <InfoTooltip content="All calculations are based on the assumptions listed below. Actual results may vary based on weather, usage patterns, and equipment performance." />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Calculation Assumptions & Disclaimers</h3>
                  <p className="text-sm text-gray-600 mt-1">Click to expand details</p>
                </div>
              </div>
              <ChevronDown className="text-gray-600" size={24} />
            </div>
          </summary>
          
          <div className="px-6 pb-6 pt-4 border-t-2 border-gray-200 bg-white">
            <div className="space-y-6">
              {/* System Design Assumptions */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="text-yellow-600" size={18} />
                  System Design Assumptions
                </h4>
                <ul className="space-y-2 text-sm text-gray-700 ml-6 list-disc">
                  <li><strong>Roof Orientation:</strong> {(() => {
                    const azimuth = (estimate as any)?.roof?.azimuth ??
                      (roofData as any)?.roofAzimuth ??
                      ((roofData?.roofPolygon?.features?.[0]?.properties as any)?.azimuth) ??
                      180
                    return azimuth !== 180 ? `${azimuth}° (detected from roof drawing)` : '180° South-facing (default)'
                  })()}</li>
                  <li><strong>Roof Pitch:</strong> {roofData?.roofPitch || 'Medium (20-40°)'}</li>
                  <li><strong>Shading Level:</strong> {roofData?.shadingLevel || 'Minimal'} - accounts for tree shadows and obstructions</li>
                  <li><strong>Usable Roof Area:</strong> 90% after obstructions, further reduced by shading factor</li>
                  <li><strong>Panel Efficiency:</strong> 500W panels with standard degradation (0.5%/year)</li>
                  {leadData?.province && (leadData.province.toUpperCase() === 'AB' || leadData.province.toUpperCase().includes('ALBERTA')) && (
                    <li><strong>Alberta Snow Loss:</strong> 3-5% annual production loss during winter months (Oct-Mar)</li>
                  )}
                </ul>
              </div>

              {/* Weather & Production Assumptions */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Sun className="text-yellow-500" size={18} />
                  Weather & Production Assumptions
                </h4>
                <ul className="space-y-2 text-sm text-gray-700 ml-6 list-disc">
                  <li><strong>Solar Data:</strong> Based on NREL PVWatts database for your location</li>
                  <li><strong>Weather Variance:</strong> Actual production may vary ±5-10% based on annual weather patterns</li>
                  <li><strong>Seasonal Variation:</strong> Higher production in summer (Jun-Aug), lower in winter (Dec-Feb)</li>
                  <li><strong>System Performance:</strong> Assumes optimal panel angle and no major equipment failures</li>
                </ul>
              </div>

              {/* Usage & Savings Assumptions */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="text-green-600" size={18} />
                  Usage & Savings Assumptions
                </h4>
                <ul className="space-y-2 text-sm text-gray-700 ml-6 list-disc">
                  <li><strong>Annual Usage:</strong> Based on your monthly bill ({monthlyBill ? `$${monthlyBill}/month` : 'or appliance data'})</li>
                  <li><strong>Usage Patterns:</strong> Typical residential consumption patterns (peak/mid-peak/off-peak)</li>
                  <li><strong>Usage Stability:</strong> Assumes no major changes in electricity consumption</li>
                  <li><strong>Rate Escalation:</strong> {data.annualEscalator ? `${data.annualEscalator}% annual electricity rate increase` : '3% annual electricity rate increase (default)'}</li>
                </ul>
              </div>

              {/* Alberta Solar Club Specific Assumptions */}
              {leadData?.province && (leadData.province.toUpperCase() === 'AB' || leadData.province.toUpperCase().includes('ALBERTA')) && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Leaf className="text-amber-600" size={18} />
                    Alberta Solar Club Assumptions
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700 ml-6 list-disc">
                    <li><strong>Rate Switching:</strong> Assumes you switch to high export rate (33¢/kWh) in April and low import rate (6.89¢/kWh) in October</li>
                    <li><strong>Credit Banking:</strong> Credits roll over month-to-month but expire after 12 months if unused</li>
                    <li><strong>Cash Back:</strong> 3% cash back on all imported energy (paid annually)</li>
                    <li><strong>Carbon Credits:</strong> Estimated value, actual credits depend on market conditions</li>
                    <li className="text-red-600 font-semibold">⚠️ Forgetting to switch rates could reduce savings by $300-500/year</li>
                  </ul>
                </div>
              )}

              {/* Battery Assumptions (if applicable) */}
              {selectedBattery && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Battery className="text-blue-600" size={18} />
                    Battery Storage Assumptions
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700 ml-6 list-disc">
                    <li><strong>Battery Type:</strong> {batteryDetails?.battery?.brand} {batteryDetails?.battery?.model}</li>
                    <li><strong>Usable Capacity:</strong> {batteryDetails?.battery?.usableKwh} kWh</li>
                    <li><strong>Round-trip Efficiency:</strong> {((batteryDetails?.battery?.roundTripEfficiency || 0) * 100).toFixed(0)}%</li>
                    {leadData?.province && (leadData.province.toUpperCase() === 'AB' || leadData.province.toUpperCase().includes('ALBERTA')) ? (
                      <li><strong>Alberta Mode:</strong> Battery charges from solar only (no grid charging/arbitrage)</li>
                    ) : (
                      <li><strong>AI Optimization:</strong> Battery may charge from grid at off-peak rates to maximize savings</li>
                    )}
                    <li><strong>Lifespan:</strong> {batteryDetails?.battery?.warranty?.years || 10} year warranty, {(batteryDetails?.battery?.warranty?.cycles || 6000).toLocaleString()} cycles</li>
                  </ul>
                </div>
              )}

              {/* General Disclaimers */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <h4 className="font-bold text-yellow-900 mb-2">⚠️ Important Disclaimers</h4>
                <div className="space-y-1 text-xs text-yellow-800">
                  <p>• These are <strong>estimates only</strong> and not a guarantee of actual performance or savings</p>
                  <p>• Actual results depend on weather, usage patterns, equipment performance, and utility rate changes</p>
                  <p>• System design and final pricing subject to site inspection and engineering review</p>
                  <p>• Incentives and rebates are subject to availability and program terms at time of installation</p>
                  <p>• All financial projections assume current electricity rates and regulatory conditions</p>
                  <p>• Consult with a licensed installer for accurate system design and final pricing</p>
                </div>
              </div>
            </div>
          </div>
        </details>
      </section>

      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <FeedbackForm
          isModal={true}
          onClose={() => setShowFeedbackForm(false)}
          onSuccess={() => setShowFeedbackForm(false)}
        />
      )}

      {/* Image Modal */}
      {imageModalOpen && selectedImage && (
        <ImageModal
          isOpen={imageModalOpen}
          onClose={() => {
            setImageModalOpen(false)
            setSelectedImage(null)
          }}
          imageSrc={selectedImage.src}
          imageAlt={selectedImage.alt}
          title={selectedImage.title}
        />
      )}

      </div>
      <Footer />
    </main>
  )
}




