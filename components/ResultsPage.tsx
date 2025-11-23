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
  Leaf
} from 'lucide-react'
import { formatCurrency, formatKw, formatKwh } from '@/lib/utils'
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
  onMatchInstaller,
  onExportPDF 
}: ResultsPageProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [installerMatchRequested, setInstallerMatchRequested] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; title: string } | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [activeSummaryTab, setActiveSummaryTab] = useState<'overview' | 'savings' | 'environmental'>('overview')
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleImageClick = (image: { src: string; alt: string; title: string }) => {
    setSelectedImage(image)
    setImageModalOpen(true)
  }

  // Use solarOverride if available (matches StepReview logic)
  // Priority: solarOverride (from battery savings step) > estimate.system (from API)
  // If we have exact panel count, calculate system size directly from it (no rounding needed)
  // 14 panels × 500W = 7000W = 7.0 kW exactly
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
  console.log('🔍 ResultsPage System Size Debug:', {
    numPanels,
    calculatedFromPanels: solarOverride?.numPanels ? (solarOverride.numPanels * panelWattage) / 1000 : null,
    finalSystemSizeKw: systemSizeKw,
    solarOverrideSizeKw: solarOverride?.sizeKw,
    estimateSystemSizeKw: estimate?.system?.sizeKw
  })

  // Calculate percentage offset (production vs actual usage)
  // Use actual annual usage from energyUsage data, or calculate from monthly bill if available
  const actualAnnualUsage = energyUsage?.annualKwh || 
                           (monthlyBill && typeof monthlyBill === 'number' ? (monthlyBill / 0.134) * 12 : null) || // Estimate from monthly bill (avg $0.134/kWh)
                           (estimate?.production?.annualKwh ? estimate.production.annualKwh / 0.8 : null) // Fallback: assume 80% offset if no usage data
  
  // Determine which rate plan is being used (TOU or ULO) - needed for battery capture
  const ratePlanForOffset = displayPlan || peakShaving?.ratePlan || 'tou'
  
  // Get solar production and battery solar capture
  const solarProduction = estimate?.production?.annualKwh || 0
  
  // Get battery solar capture from the appropriate rate plan
  // Check direct tou/ulo props first, then peakShaving structure
  const batterySolarCapture = ratePlanForOffset === 'ulo' 
    ? (ulo?.batterySolarCapture ?? peakShaving?.ulo?.batterySolarCapture ?? 0)
    : (tou?.batterySolarCapture ?? peakShaving?.tou?.batterySolarCapture ?? 0)
  
  // Calculate energy offset: (solar + battery solar capture) / annual usage * 100
  const totalEnergyOffset = solarProduction + batterySolarCapture
  
  // Calculate offset cap to account for winter limits (same as PeakShavingSalesCalculatorFRD)
  // Get roof azimuth from estimate or roofData, default to 180 (south-facing)
  const roofAzimuth = (estimate as any)?.roof?.azimuth ?? 
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
  const uncappedPercentage = actualAnnualUsage && actualAnnualUsage > 0 && totalEnergyOffset > 0
    ? (totalEnergyOffset / actualAnnualUsage) * 100
    : (actualAnnualUsage && actualAnnualUsage > 0 && solarProduction > 0
      ? (solarProduction / actualAnnualUsage) * 100
      : 80) // Fallback to 80% if we can't calculate
  
  // Apply offset cap (typically 90-93% to reflect winter limits)
  const cappedPercentage = Math.min(uncappedPercentage, offsetCapInfo.capFraction * 100)
  const percentageOffset = Math.round(cappedPercentage)
  
  // Calculate monthly production average
  const avgMonthlyProduction = estimate?.production?.annualKwh ? estimate.production.annualKwh / 12 : 0

  // Determine which rate plan is being used (TOU or ULO)
  const ratePlan = displayPlan || peakShaving?.ratePlan || 'tou'
  const touData = peakShaving?.tou
  const uloData = peakShaving?.ulo
  
  // Get rebate amounts (use provided values or calculate from estimate)
  const solarRebateAmount = solarRebate ?? estimate?.costs?.incentives ?? 0
  const batteryRebateAmount = batteryRebate ?? 0
  const totalRebates = solarRebateAmount + batteryRebateAmount
  
  // Get combined costs (if battery is included)
  const finalTotalCost = combinedTotalCost ?? estimate?.costs?.totalCost ?? 0
  const finalNetCost = combinedNetCost ?? estimate?.costs?.netCost ?? 0
  
  // Get combined savings from TOU/ULO if available, otherwise use estimate savings
  const getCombinedAnnual = (plan: any) =>
    plan?.allResults?.combined?.combined?.annual ||
    plan?.allResults?.combined?.annual ||
    plan?.combined?.annual ||
    null
  
  const getCombinedMonthly = (plan: any) =>
    plan?.allResults?.combined?.combined?.monthly ||
    plan?.allResults?.combined?.monthly ||
    plan?.combined?.monthly ||
    null
  
  const touCombinedAnnual = getCombinedAnnual(touData)
  const uloCombinedAnnual = getCombinedAnnual(uloData)
  const touCombinedMonthly = getCombinedMonthly(touData)
  const uloCombinedMonthly = getCombinedMonthly(uloData)
  
  // Get total bill savings percentage for both plans
  const getTotalBillSavingsPercent = (plan: any, directPlan: any) => {
    // First try to get from direct plan props (simplified data structure)
    if (directPlan?.totalBillSavingsPercent !== undefined) return directPlan.totalBillSavingsPercent
    
    // Then try to get from plan data (nested structure)
    if (plan?.totalBillSavingsPercent !== undefined) return plan.totalBillSavingsPercent
    
    // Calculate from before/after if available
    const beforeSolar = plan?.combined?.baselineAnnualBill || 
                       plan?.allResults?.combined?.combined?.baselineAnnualBill ||
                       directPlan?.beforeSolar
    const afterSolar = plan?.combined?.postSolarBatteryAnnualBill || 
                      plan?.combined?.postSolarAnnualBill ||
                      plan?.allResults?.combined?.combined?.postSolarBatteryAnnualBill ||
                      directPlan?.afterSolar
    
    if (beforeSolar && afterSolar && beforeSolar > 0) {
      return ((beforeSolar - afterSolar) / beforeSolar) * 100
    }
    return null
  }
  
  const touBillSavingsPercent = getTotalBillSavingsPercent(touData, tou)
  const uloBillSavingsPercent = getTotalBillSavingsPercent(uloData, ulo)
  
  // Get 25-year savings/profit for both plans
  const get25YearSavings = (plan: any, directPlan: any, annualSavings: number | null) => {
    // First try to get from direct plan props (simplified data structure)
    if (directPlan?.profit25Year !== undefined && directPlan.profit25Year > 0) return directPlan.profit25Year
    
    // Then try to get from plan data (nested structure)
    if (plan?.combined?.projection?.netProfit25Year !== undefined) return plan.combined.projection.netProfit25Year
    if (plan?.allResults?.combined?.combined?.projection?.netProfit25Year !== undefined) return plan.allResults.combined.combined.projection.netProfit25Year
    
    // Fallback: calculate from annual savings
    if (annualSavings && annualSavings > 0) {
      return annualSavings * 25
    }
    return null
  }
  
  const tou25YearSavings = get25YearSavings(touData, tou, touCombinedAnnual)
  const ulo25YearSavings = get25YearSavings(uloData, ulo, uloCombinedAnnual)
  
  // Calculate lifetime savings (25 years) - use best plan or fallback
  const lifetimeSavings = tou25YearSavings !== null && ulo25YearSavings !== null
    ? Math.max(tou25YearSavings, ulo25YearSavings)
    : (tou25YearSavings ?? ulo25YearSavings ?? (estimate?.savings?.lifetimeSavings || (estimate?.savings?.annualSavings ? estimate.savings.annualSavings * 25 : 0)))
  
  // Use combined savings if available, otherwise fall back to estimate savings
  const finalAnnualSavings = ratePlan === 'ulo' && uloCombinedAnnual 
    ? uloCombinedAnnual 
    : ratePlan === 'tou' && touCombinedAnnual 
    ? touCombinedAnnual 
    : (batteryImpact?.annualSavings && estimate?.savings?.annualSavings ? estimate.savings.annualSavings + batteryImpact.annualSavings : (estimate?.savings?.annualSavings ?? 0))
  
  const finalMonthlySavings = ratePlan === 'ulo' && uloCombinedMonthly 
    ? uloCombinedMonthly 
    : ratePlan === 'tou' && touCombinedMonthly 
    ? touCombinedMonthly 
    : (batteryImpact?.monthlySavings && estimate?.savings?.monthlySavings ? estimate.savings.monthlySavings + batteryImpact.monthlySavings : (estimate?.savings?.monthlySavings ?? 0))
  
  // Get payback period from data if available, otherwise calculate
  const getPaybackYears = (plan: any, directPlan: any, annualSavings: number | null) => {
    // First try to get from direct plan props (simplified data structure)
    if (directPlan?.paybackPeriod !== undefined && directPlan.paybackPeriod > 0) return directPlan.paybackPeriod
    
    // Then try to get from plan data (nested structure)
    if (plan?.paybackPeriod !== undefined && plan.paybackPeriod > 0) return plan.paybackPeriod
    if (plan?.combined?.projection?.paybackYears !== undefined) return plan.combined.projection.paybackYears
    if (plan?.allResults?.combined?.combined?.projection?.paybackYears !== undefined) return plan.allResults.combined.combined.projection.paybackYears
    
    // Fallback: calculate from net cost and annual savings
    if (finalNetCost > 0 && annualSavings && annualSavings > 0) {
      return finalNetCost / annualSavings
    }
    return null
  }
  
  const touPaybackYears = getPaybackYears(touData, tou, touCombinedAnnual)
  const uloPaybackYears = getPaybackYears(uloData, ulo, uloCombinedAnnual)
  
  // Use the selected plan's payback, or fallback to estimate
  const finalPaybackYears = ratePlan === 'ulo' && uloPaybackYears !== null
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

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-forest-500 to-forest-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-4">
              Your Solar Savings Results
            </h1>
            {leadData?.address && (
              <p className="text-xl text-white/90">
                {leadData.address}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Key Metrics Section */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {/* System Size */}
            <div className="bg-forest-50 rounded-xl p-6 text-center border border-forest-100">
              <div className="w-12 h-12 bg-forest-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="text-white" size={24} />
              </div>
              <div className="text-3xl font-bold text-forest-600 mb-1">
                {formatKw(systemSizeKw)}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                System Size
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {numPanels} panels
              </div>
            </div>

            {/* Percentage Offset */}
            <div className="bg-sky-50 rounded-xl p-6 text-center border border-sky-100">
              <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div className="text-3xl font-bold text-sky-600 mb-1">
                {percentageOffset}%
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Energy Offset
              </div>
              <div className="text-xs text-gray-500 mt-1">
                of your usage
              </div>
            </div>

            {/* Total Bill Savings - Show both plans if available */}
            <div className="bg-purple-50 rounded-xl p-6 text-center border border-purple-100">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="text-white" size={24} />
              </div>
              {touBillSavingsPercent !== null && uloBillSavingsPercent !== null ? (
                <>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {Math.max(touBillSavingsPercent, uloBillSavingsPercent).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 font-medium mb-1">
                    Total Bill Savings
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>TOU: {touBillSavingsPercent.toFixed(1)}%</div>
                    <div>ULO: {uloBillSavingsPercent.toFixed(1)}%</div>
                  </div>
                </>
              ) : touBillSavingsPercent !== null ? (
                <>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {touBillSavingsPercent.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Total Bill Savings
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    TOU Plan
                  </div>
                </>
              ) : uloBillSavingsPercent !== null ? (
                <>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {uloBillSavingsPercent.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Total Bill Savings
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ULO Plan
                  </div>
                </>
              ) : null}
            </div>

            {/* Payback Period - Show both plans if available */}
            <div className="bg-maple-50 rounded-xl p-6 text-center border border-maple-100">
              <div className="w-12 h-12 bg-maple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="text-white" size={24} />
              </div>
              {touPaybackYears !== null && uloPaybackYears !== null ? (
                <>
                  <div className="text-3xl font-bold text-maple-600 mb-1">
                    {Math.min(touPaybackYears, uloPaybackYears).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium mb-1">
                    Payback Period
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>TOU: {touPaybackYears.toFixed(1)} years</div>
                    <div>ULO: {uloPaybackYears.toFixed(1)} years</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-maple-600 mb-1">
                    {finalPaybackYears.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Payback Period
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    years
                  </div>
                </>
              )}
            </div>

            {/* Annual Savings - Show both plans if available */}
            <div className="bg-green-50 rounded-xl p-6 text-center border border-green-100">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="text-white" size={24} />
              </div>
              {touCombinedAnnual && uloCombinedAnnual ? (
                <>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {formatCurrency(Math.max(touCombinedAnnual, uloCombinedAnnual))}
                  </div>
                  <div className="text-sm text-gray-600 font-medium mb-1">
                    Annual Savings
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>TOU: {formatCurrency(touCombinedMonthly)}/month</div>
                    <div>ULO: {formatCurrency(uloCombinedMonthly)}/month</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {formatCurrency(finalAnnualSavings)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Annual Savings
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(finalMonthlySavings)}/month
                  </div>
                  {ratePlan && (
                    <div className="text-xs text-forest-600 mt-1 font-semibold">
                      {ratePlan.toUpperCase()} Plan
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Results Content */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Main Results */}
            <div className="lg:col-span-2 space-y-8">
              {/* What These Results Mean */}
              <div className="bg-white rounded-2xl p-8 shadow-md">
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
                      {touCombinedAnnual && uloCombinedAnnual ? (
                        <>
                          With the <strong>TOU rate plan</strong>, you'll save approximately {formatCurrency(touCombinedAnnual)} per year, 
                          which means your system will pay for itself in about {touPaybackYears !== null ? touPaybackYears.toFixed(1) : 'N/A'} years.{' '}
                          {tou25YearSavings !== null && <>Over 25 years, you could save over {formatCurrency(tou25YearSavings)}.</>}
                          {' '}With the <strong>ULO rate plan</strong>, you'll save approximately {formatCurrency(uloCombinedAnnual)} per year, 
                          which means your system will pay for itself in about {uloPaybackYears !== null ? uloPaybackYears.toFixed(1) : 'N/A'} years.{' '}
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
                    {estimate.environmental && (
                      <p className="text-gray-700 leading-relaxed">
                        Your solar system will offset approximately {estimate.environmental.co2OffsetTonsPerYear.toFixed(1)} tons of CO₂ per year. 
                        That's equivalent to planting {estimate.environmental.treesEquivalent} trees or taking {estimate.environmental.carsOffRoadEquivalent.toFixed(1)} cars off the road annually.
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
              </div>

              {/* Monthly Production Chart */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md">
                <h2 className="text-2xl font-bold text-forest-500 mb-6">
                  Monthly Production Estimate
                </h2>
                <div className="space-y-3">
                  {estimate?.production?.monthlyKwh?.map((kwh, index) => {
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                    const maxKwh = estimate.production.monthlyKwh.length > 0 ? Math.max(...estimate.production.monthlyKwh) : 0
                    const percentage = maxKwh > 0 ? (kwh / maxKwh) * 100 : 0
                    
                    return (
                      <div key={index} className="flex items-center gap-3 md:gap-4">
                        <div className="w-12 md:w-16 text-sm font-medium text-gray-700 flex-shrink-0">
                          {monthNames[index]}
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-full h-8 md:h-10 relative overflow-hidden min-w-0">
                          <div 
                            className="bg-gradient-to-r from-sky-400 to-forest-500 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          >
                            {percentage > 15 && (
                              <span className="text-xs font-semibold text-white whitespace-nowrap">
                                {formatKwh(kwh)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-20 md:w-24 text-xs md:text-sm font-medium text-gray-700 text-right flex-shrink-0">
                          {formatKwh(kwh)}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Production varies by season, with peak generation in summer months when days are longer and sunnier.
                </p>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-white rounded-2xl p-8 shadow-md">
                <h2 className="text-2xl font-bold text-forest-500 mb-6">
                  Cost Breakdown
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-700">System Cost</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(finalTotalCost)}</span>
                  </div>
                  {solarRebateAmount > 0 && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-200">
                      <span className="text-gray-700">Solar Rebates</span>
                      <span className="font-semibold text-green-600">-{formatCurrency(solarRebateAmount)}</span>
                    </div>
                  )}
                  {batteryRebateAmount > 0 && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-200">
                      <span className="text-gray-700">Battery Rebates</span>
                      <span className="font-semibold text-green-600">-{formatCurrency(batteryRebateAmount)}</span>
                    </div>
                  )}
                  {totalRebates > 0 && (
                    <div className="flex justify-between items-center py-2 border-b-2 border-gray-300">
                      <span className="font-semibold text-gray-700">Total Rebates</span>
                      <span className="font-semibold text-green-600">-{formatCurrency(totalRebates)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-4 bg-forest-50 rounded-lg px-4">
                    <span className="font-bold text-gray-900">Your Net Investment</span>
                    <span className="font-bold text-2xl text-forest-600">{formatCurrency(finalNetCost)}</span>
                  </div>
                </div>
              </div>

              {/* Rate Plan Information (TOU/ULO) */}
              {(touData || uloData) && (
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
                    {batteryDetails && (
                      <BatteryDetails
                        batteryDetails={batteryDetails}
                        peakShaving={peakShaving}
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

                    {/* TOU/ULO Comparison */}
                    {(() => {
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
                    includeBattery={!!batteryDetails}
                    tou={tou}
                    ulo={ulo}
                    peakShaving={peakShaving}
                    combinedNetCost={combinedNetCost || estimate?.costs?.netCost || 0}
                    isMobile={isMobile}
                  />
                )}

                {activeSummaryTab === 'environmental' && estimate.environmental && (
                  <EnvironmentalTab
                    co2OffsetTonsPerYear={estimate.environmental.co2OffsetTonsPerYear}
                    treesEquivalent={estimate.environmental.treesEquivalent}
                    carsOffRoadEquivalent={estimate.environmental.carsOffRoadEquivalent}
                  />
                )}
              </div>
            </div>

            {/* Right Column - Actions & Next Steps */}
            <div className="space-y-6">
              {/* Match with Installer CTA */}
              <div className="bg-white rounded-2xl p-8 shadow-md border-2 border-forest-200">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-forest-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Handshake className="text-white" size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-forest-500 mb-2">
                    Next Step: Get a Proposal
                  </h2>
                  <p className="text-gray-600">
                    Connect with vetted local installers to get detailed quotes
                  </p>
                </div>

                {installerMatchRequested ? (
                  <div className="bg-forest-50 border-2 border-forest-500 rounded-lg p-6 text-center">
                    <CheckCircle className="text-forest-500 mx-auto mb-3" size={48} />
                    <h3 className="font-bold text-forest-500 mb-2">Request Submitted!</h3>
                    <p className="text-sm text-gray-700">
                      We'll match you with vetted installers in your area. You'll receive quotes within 24-48 hours.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleMatchInstaller}
                    className="btn-primary w-full h-14 text-lg inline-flex items-center justify-center"
                  >
                    Match Me with a Vetted Installer
                    <ArrowRight className="ml-2" size={20} />
                  </button>
                )}

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
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <h3 className="font-bold text-gray-900 mb-4">Export Your Results</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleExportPDF}
                    className="w-full btn-outline border-forest-500 text-forest-500 hover:bg-forest-50 inline-flex items-center justify-center"
                  >
                    <Download className="mr-2" size={18} />
                    Download PDF Summary
                  </button>
                  {leadData?.email && (
                    <button
                      onClick={() => {
                        // In real implementation, this would email the PDF
                        alert('PDF will be emailed to ' + leadData.email)
                      }}
                      className="w-full btn-outline border-sky-500 text-sky-500 hover:bg-sky-50 inline-flex items-center justify-center"
                    >
                      <Mail className="mr-2" size={18} />
                      Email PDF to Me
                    </button>
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
            </div>
          </div>
        </div>
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

      <Footer />
    </main>
  )
}

