// API route to send estimate email to customer
// This route sends a professional email with the solar estimate details using Nodemailer with Gmail

import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { calculateSimpleMultiYear } from '@/lib/simple-peak-shaving'

// Email template for the estimate
// Follows the same data structure and calculations as StepReview component
function generateEstimateEmailTemplate(data: {
  fullName: string
  email: string
  address?: string
  estimate: any
  peakShaving?: any
  batteryDetails?: any
  leadId: string
}) {
  const { fullName, address, estimate, peakShaving, batteryDetails, leadId } = data
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  
  // Format number with commas
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-CA').format(Math.round(value))
  }
  
  // Extract estimate data (following StepReview logic)
  const systemSize = estimate?.system?.sizeKw || 0
  const numPanels = estimate?.system?.numPanels || 0
  const annualProduction = estimate?.production?.annualKwh || 0
  
  // Solar costs (from estimate)
  const solarTotalCost = estimate?.costs?.totalCost || 0
  const solarIncentives = estimate?.costs?.incentives || 0 // This is the solar rebate
  const solarNetCost = estimate?.costs?.netCost || 0
  
  // Battery data (if available)
  const hasBattery = !!(batteryDetails || peakShaving?.tou || peakShaving?.ulo)
  
  // Get battery price and rebate from multiple possible sources (matching StepReview logic)
  // First try batteryDetails, then try combined data from peakShaving
  const touCombined = (peakShaving as any)?.tou?.allResults?.combined?.combined || 
                     (peakShaving as any)?.tou?.combined?.combined ||
                     (peakShaving as any)?.tou?.combined
  const uloCombined = (peakShaving as any)?.ulo?.allResults?.combined?.combined || 
                     (peakShaving as any)?.ulo?.combined?.combined ||
                     (peakShaving as any)?.ulo?.combined
  
  // Get battery price from batteryDetails first, then from combined data
  const batteryPrice = batteryDetails?.battery?.price || 
                       touCombined?.batteryGrossCost || 
                       uloCombined?.batteryGrossCost || 
                       0
  
  // Get battery rebate from combined data if available (more accurate), otherwise calculate
  const batteryRebateFromCombined = touCombined?.batteryRebateApplied || uloCombined?.batteryRebateApplied || 0
  const batteryNominalKwh = batteryDetails?.battery?.nominalKwh || 
                            batteryDetails?.battery?.usableKwh || 
                            (batteryPrice > 0 ? Math.round(batteryPrice / 500) : 0) // Estimate: ~$500/kWh if not provided
  const batteryUsableKwh = batteryDetails?.battery?.usableKwh || batteryNominalKwh || 0
  
  // Calculate battery rebate: use from combined data if available, otherwise calculate
  // $300/kWh up to $5,000 max (matching StepReview logic)
  const batteryProgramRebate = batteryRebateFromCombined > 0
    ? batteryRebateFromCombined
    : (hasBattery && batteryPrice > 0
      ? Math.min(batteryNominalKwh * 300, 5000)
      : 0)
  
  // Get battery net cost from combined data if available, otherwise calculate
  const batteryNetFromCombined = touCombined?.batteryNetCost || uloCombined?.batteryNetCost || 0
  const batteryProgramNet = batteryNetFromCombined > 0
    ? batteryNetFromCombined
    : (hasBattery ? Math.max(0, batteryPrice - batteryProgramRebate) : 0)
  
  // Combined costs
  const combinedTotalCost = solarTotalCost + (hasBattery ? batteryPrice : 0)
  const combinedNetCost = solarNetCost + (hasBattery ? batteryProgramNet : 0)
  const totalRebates = solarIncentives + (hasBattery ? batteryProgramRebate : 0)
  
  // TOU and ULO plan data
  const tou = peakShaving?.tou
  const ulo = peakShaving?.ulo
  const hasBothPlans = !!(tou && ulo && hasBattery)
  
  // Note: touCombined and uloCombined are already defined above when getting battery data
  
  // Calculate savings
  const solarAnnualSavings = estimate?.savings?.annualSavings || 0
  const solarMonthlySavings = estimate?.savings?.monthlySavings || 0
  
  // Combined savings (solar + battery) - use combined data from Plan Comparison
  let touCombinedAnnual = solarAnnualSavings
  let uloCombinedAnnual = solarAnnualSavings
  let touCombinedMonthly = solarMonthlySavings
  let uloCombinedMonthly = solarMonthlySavings
  
  // Combined net costs (for payback calculation)
  let touCombinedNet = combinedNetCost
  let uloCombinedNet = combinedNetCost
  
  if (hasBothPlans) {
    // Use combined annual and monthly from Plan Comparison data (matches StepReview)
    touCombinedAnnual = touCombined?.annual || solarAnnualSavings
    uloCombinedAnnual = uloCombined?.annual || solarAnnualSavings
    touCombinedMonthly = touCombined?.monthly || Math.round((touCombined?.annual || 0) / 12) || solarMonthlySavings
    uloCombinedMonthly = uloCombined?.monthly || Math.round((uloCombined?.annual || 0) / 12) || solarMonthlySavings
    
    // Get net costs from combined data
    touCombinedNet = touCombined?.netCost ?? combinedNetCost
    uloCombinedNet = uloCombined?.netCost ?? combinedNetCost
  } else if (hasBattery && tou) {
    touCombinedAnnual = touCombined?.annual || solarAnnualSavings
    touCombinedMonthly = touCombined?.monthly || Math.round((touCombined?.annual || 0) / 12) || solarMonthlySavings
    touCombinedNet = touCombined?.netCost ?? combinedNetCost
  } else if (hasBattery && ulo) {
    uloCombinedAnnual = uloCombined?.annual || solarAnnualSavings
    uloCombinedMonthly = uloCombined?.monthly || Math.round((uloCombined?.annual || 0) / 12) || solarMonthlySavings
    uloCombinedNet = uloCombined?.netCost ?? combinedNetCost
  }
  
  // Calculate 25-year projections and payback for both plans
  // Use projection from combined data (matches StepReview Plan Comparison)
  let tou25YearTotal = 0
  let tou25YearProfit = 0
  let touPayback = 0
  let ulo25YearTotal = 0
  let ulo25YearProfit = 0
  let uloPayback = 0
  
  if (hasBothPlans) {
    // Get from combined projection data (same source as Plan Comparison)
    if (touCombined?.projection) {
      tou25YearTotal = touCombined.projection.totalSavings25Year || 0
      tou25YearProfit = touCombined.projection.netProfit25Year || 0
      touPayback = touCombined.projection.paybackYears || 0
    } else {
      // Calculate manually if projection not available
      const touProjection = calculateSimpleMultiYear(
        { annualSavings: touCombinedAnnual } as any,
        touCombinedNet,
        0.05,
        25
      )
      tou25YearTotal = touProjection.totalSavings25Year
      tou25YearProfit = touProjection.netProfit25Year
      touPayback = touProjection.paybackYears
    }
    
    if (uloCombined?.projection) {
      ulo25YearTotal = uloCombined.projection.totalSavings25Year || 0
      ulo25YearProfit = uloCombined.projection.netProfit25Year || 0
      uloPayback = uloCombined.projection.paybackYears || 0
    } else {
      // Calculate manually if projection not available
      const uloProjection = calculateSimpleMultiYear(
        { annualSavings: uloCombinedAnnual } as any,
        uloCombinedNet,
        0.05,
        25
      )
      ulo25YearTotal = uloProjection.totalSavings25Year
      ulo25YearProfit = uloProjection.netProfit25Year
      uloPayback = uloProjection.paybackYears
    }
  } else if (hasBattery && tou) {
    if (touCombined?.projection) {
      tou25YearTotal = touCombined.projection.totalSavings25Year || 0
      tou25YearProfit = touCombined.projection.netProfit25Year || 0
      touPayback = touCombined.projection.paybackYears || 0
    } else {
      const touProjection = calculateSimpleMultiYear(
        { annualSavings: touCombinedAnnual } as any,
        touCombinedNet,
        0.05,
        25
      )
      tou25YearTotal = touProjection.totalSavings25Year
      tou25YearProfit = touProjection.netProfit25Year
      touPayback = touProjection.paybackYears
    }
  } else if (hasBattery && ulo) {
    if (uloCombined?.projection) {
      ulo25YearTotal = uloCombined.projection.totalSavings25Year || 0
      ulo25YearProfit = uloCombined.projection.netProfit25Year || 0
      uloPayback = uloCombined.projection.paybackYears || 0
    } else {
      const uloProjection = calculateSimpleMultiYear(
        { annualSavings: uloCombinedAnnual } as any,
        uloCombinedNet,
        0.05,
        25
      )
      ulo25YearTotal = uloProjection.totalSavings25Year
      ulo25YearProfit = uloProjection.netProfit25Year
      uloPayback = uloProjection.paybackYears
    }
  }
  
  // Fallback values for single plan or no battery
  const displayAnnualSavings = hasBothPlans ? Math.max(touCombinedAnnual, uloCombinedAnnual) : (touCombinedAnnual || uloCombinedAnnual || solarAnnualSavings)
  const displayMonthlySavings = hasBothPlans ? Math.max(touCombinedMonthly, uloCombinedMonthly) : (touCombinedMonthly || uloCombinedMonthly || solarMonthlySavings)
  const paybackYears = estimate?.savings?.paybackYears || 0
  const twentyFiveYearSavings = estimate?.savings?.twentyFiveYearSavings || 0
  const co2Offset = estimate?.environmental?.co2OffsetTonsPerYear || 0
  const treesEquivalent = estimate?.environmental?.treesEquivalent || 0
  
  // Battery info
  const batteryBrand = batteryDetails?.battery?.brand || ''
  const batteryModel = batteryDetails?.battery?.model || ''
  const batteryKwh = batteryDetails?.battery?.usableKwh || 0
  
  return {
    subject: `Your Solar Estimate from SolarX - ${systemSize}kW System`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Solar Estimate</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc;">
    <!-- Header with gradient -->
    <tr>
      <td style="padding: 0;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #1B4E7C 0%, #2563eb 100%);">
          <tr>
            <td style="padding: 48px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">SolarX</h1>
              <div style="width: 60px; height: 3px; background-color: #ffffff; margin: 0 auto; border-radius: 2px;"></div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Main Content -->
    <tr>
      <td style="padding: 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse; background-color: #ffffff;">
          <tr>
            <td style="padding: 48px 40px 40px 40px;">
              <!-- Greeting Section -->
              <div style="margin-bottom: 40px;">
                <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2;">
                  Your Solar Estimate is Ready! ✨
                </h2>
                <p style="color: #64748b; font-size: 16px; line-height: 1.7; margin: 0 0 12px 0;">
                  Hi ${fullName},
                </p>
                <p style="color: #64748b; font-size: 16px; line-height: 1.7; margin: 0;">
                  Thank you for using the SolarX estimator! We've prepared a detailed solar estimate for${address ? ` <strong style="color: #1e293b;">${address}</strong>` : ' your property'}. Here's what we found:
                </p>
              </div>
        
              <!-- System Overview Card -->
              <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 12px; padding: 32px; margin: 0 0 32px 0; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(135deg, #1B4E7C 0%, #2563eb 100%); border-radius: 2px; margin-right: 12px;"></div>
                  <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                    System Overview
                  </h3>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #e2e8f0;">System Size:</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #e2e8f0;">
                      ${systemSize} kW (${numPanels} panels)
                    </td>
                  </tr>
                  ${hasBattery && batteryKwh > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #e2e8f0;">Battery Storage:</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #e2e8f0;">
                      ${batteryBrand} ${batteryModel} (${batteryKwh} kWh)
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px;">Annual Production:</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px;">
                      ${formatNumber(annualProduction)} kWh/year
                    </td>
                  </tr>
                </table>
              </div>
        
              <!-- Financial Summary Card -->
              <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 32px; margin: 0 0 32px 0; border: 1px solid #fecaca; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); border-radius: 2px; margin-right: 12px;"></div>
                  <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                    Financial Summary
                  </h3>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #fecaca;">Total System Cost:</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #fecaca;">
                      ${formatCurrency(combinedTotalCost)}
                    </td>
                  </tr>
                  ${hasBattery ? `
                  <tr>
                    <td style="padding: 10px 0; color: #94a3b8; font-size: 13px; border-bottom: 1px solid #fecaca;">
                      <span style="color: #64748b;">Solar</span> ${formatCurrency(solarTotalCost)} <span style="color: #64748b;">+ Battery</span> ${formatCurrency(batteryPrice)}
                    </td>
                    <td style="padding: 10px 0; text-align: right; color: #94a3b8; font-size: 13px; border-bottom: 1px solid #fecaca;"></td>
                  </tr>
                  ` : ''}
                  ${solarIncentives > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #fecaca;">Solar Rebate:</td>
                    <td style="padding: 12px 0; text-align: right; color: #16a34a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #fecaca;">
                      -${formatCurrency(solarIncentives)}
                    </td>
                  </tr>
                  ` : ''}
                  ${hasBattery && batteryPrice > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #fecaca;">Battery Rebate:</td>
                    <td style="padding: 12px 0; text-align: right; color: #16a34a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #fecaca;">
                      -${formatCurrency(batteryProgramRebate)}
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 16px 0 12px 0; color: #0f172a; font-size: 18px; font-weight: 700; border-top: 2px solid #dc2626;">
                      Net Cost After Rebates:
                    </td>
                    <td style="padding: 16px 0 12px 0; text-align: right; color: #dc2626; font-weight: 700; font-size: 22px; border-top: 2px solid #dc2626;">
                      ${formatCurrency(combinedNetCost)}
                    </td>
                  </tr>
                </table>
              </div>
        
              <!-- Savings Projections Card -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 32px; margin: 0 0 32px 0; border: 1px solid #bbf7d0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); border-radius: 2px; margin-right: 12px;"></div>
                  <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                    Your Savings
                  </h3>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  ${hasBothPlans ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #bbf7d0;">Monthly Savings:</td>
                    <td style="padding: 12px 0; text-align: right; color: #64748b; font-size: 13px; border-bottom: 1px solid #bbf7d0;"></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #64748b; font-size: 14px; padding-left: 16px;">TOU Plan:</td>
                    <td style="padding: 10px 0; text-align: right; color: #16a34a; font-weight: 600; font-size: 15px;">
                      ${formatCurrency(touCombinedMonthly)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #64748b; font-size: 14px; padding-left: 16px;">ULO Plan:</td>
                    <td style="padding: 10px 0; text-align: right; color: #16a34a; font-weight: 600; font-size: 15px;">
                      ${formatCurrency(uloCombinedMonthly)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 16px 0 12px 0; color: #64748b; font-size: 15px; border-top: 1px solid #bbf7d0; border-bottom: 1px solid #bbf7d0;">Annual Savings:</td>
                    <td style="padding: 16px 0 12px 0; text-align: right; color: #64748b; font-size: 13px; border-top: 1px solid #bbf7d0; border-bottom: 1px solid #bbf7d0;"></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #64748b; font-size: 14px; padding-left: 16px;">TOU Plan:</td>
                    <td style="padding: 10px 0; text-align: right; color: #16a34a; font-weight: 600; font-size: 15px;">
                      ${formatCurrency(touCombinedAnnual)}/year
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #64748b; font-size: 14px; padding-left: 16px;">ULO Plan:</td>
                    <td style="padding: 10px 0; text-align: right; color: #16a34a; font-weight: 600; font-size: 15px;">
                      ${formatCurrency(uloCombinedAnnual)}/year
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 16px 0 12px 0; color: #64748b; font-size: 15px; border-top: 1px solid #bbf7d0; border-bottom: 1px solid #bbf7d0;">25-Year Total Savings:</td>
                    <td style="padding: 16px 0 12px 0; text-align: right; color: #64748b; font-size: 13px; border-top: 1px solid #bbf7d0; border-bottom: 1px solid #bbf7d0;"></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #64748b; font-size: 14px; padding-left: 16px;">TOU Plan:</td>
                    <td style="padding: 10px 0; text-align: right; color: #16a34a; font-weight: 600; font-size: 15px;">
                      ${formatCurrency(tou25YearTotal)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #64748b; font-size: 14px; padding-left: 16px;">ULO Plan:</td>
                    <td style="padding: 10px 0; text-align: right; color: #16a34a; font-weight: 600; font-size: 15px;">
                      ${formatCurrency(ulo25YearTotal)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 16px 0 12px 0; color: #64748b; font-size: 15px; border-top: 1px solid #bbf7d0; border-bottom: 1px solid #bbf7d0;">Payback Period:</td>
                    <td style="padding: 16px 0 12px 0; text-align: right; color: #64748b; font-size: 13px; border-top: 1px solid #bbf7d0; border-bottom: 1px solid #bbf7d0;"></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #64748b; font-size: 14px; padding-left: 16px;">TOU Plan:</td>
                    <td style="padding: 10px 0; text-align: right; color: #1B4E7C; font-weight: 600; font-size: 15px;">
                      ${touPayback > 0 && touPayback < 100 ? touPayback.toFixed(1) + ' years' : 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #64748b; font-size: 14px; padding-left: 16px;">ULO Plan:</td>
                    <td style="padding: 10px 0; text-align: right; color: #1B4E7C; font-weight: 600; font-size: 15px;">
                      ${uloPayback > 0 && uloPayback < 100 ? uloPayback.toFixed(1) + ' years' : 'N/A'}
                    </td>
                  </tr>
                  ` : `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #bbf7d0;">Monthly Savings:</td>
                    <td style="padding: 12px 0; text-align: right; color: #16a34a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #bbf7d0;">
                      ${formatCurrency(displayMonthlySavings)}/month
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #bbf7d0;">Annual Savings:</td>
                    <td style="padding: 12px 0; text-align: right; color: #16a34a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #bbf7d0;">
                      ${formatCurrency(displayAnnualSavings)}/year
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #bbf7d0;">25-Year Total Savings:</td>
                    <td style="padding: 12px 0; text-align: right; color: #16a34a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #bbf7d0;">
                      ${formatCurrency(twentyFiveYearSavings)}
                    </td>
                  </tr>
                  ${paybackYears > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px;">Payback Period:</td>
                    <td style="padding: 12px 0; text-align: right; color: #1B4E7C; font-weight: 600; font-size: 15px;">
                      ${paybackYears.toFixed(1)} years
                    </td>
                  </tr>
                  ` : ''}
                  `}
                </table>
              </div>
        
              <!-- Environmental Impact Card -->
              ${co2Offset > 0 ? `
              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 32px; margin: 0 0 32px 0; border: 1px solid #a7f3d0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 2px; margin-right: 12px;"></div>
                  <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                    Environmental Impact
                  </h3>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #a7f3d0;">CO₂ Offset:</td>
                    <td style="padding: 12px 0; text-align: right; color: #16a34a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #a7f3d0;">
                      ${co2Offset.toFixed(1)} tons/year
                    </td>
                  </tr>
                  ${treesEquivalent > 0 ? `
                  <tr>
                    <td style="padding: 12px 0; color: #64748b; font-size: 15px;">Equivalent to:</td>
                    <td style="padding: 12px 0; text-align: right; color: #16a34a; font-weight: 600; font-size: 15px;">
                      ${formatNumber(treesEquivalent)} trees planted
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              ` : ''}
              
              <!-- Next Steps Card -->
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 32px; margin: 0 0 32px 0; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 20px;">
                  <div style="width: 4px; height: 24px; background: linear-gradient(135deg, #1B4E7C 0%, #2563eb 100%); border-radius: 2px; margin-right: 12px;"></div>
                  <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                    What Happens Next?
                  </h3>
                </div>
                <ul style="color: #64748b; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px; list-style: none;">
                  <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
                    <span style="position: absolute; left: 0; color: #1B4E7C; font-weight: 700;">✓</span>
                    A SolarX specialist will contact you within 24 hours
                  </li>
                  <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
                    <span style="position: absolute; left: 0; color: #1B4E7C; font-weight: 700;">✓</span>
                    We'll answer any questions and discuss your options
                  </li>
                  <li style="padding-left: 24px; position: relative;">
                    <span style="position: absolute; left: 0; color: #1B4E7C; font-weight: 700;">✓</span>
                    Schedule a free site assessment if you'd like to proceed
                  </li>
                </ul>
              </div>
              
              <!-- Reference ID -->
              <div style="text-align: center; margin: 40px 0 24px 0; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0; letter-spacing: 0.5px;">
                  Reference ID: <span style="color: #64748b; font-weight: 600;">${leadId}</span>
                </p>
              </div>
              
              <!-- Footer -->
              <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">
                  Questions? Reply to this email or call us at 
                  <a href="tel:+1-800-SOLAR-X" style="color: #1B4E7C; text-decoration: none; font-weight: 600;">1-800-SOLAR-X</a>
                </p>
                <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0;">
                  © ${new Date().getFullYear()} SolarX. All rights reserved.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
Your Solar Estimate from SolarX

Hi ${fullName},

Thank you for using the SolarX estimator! We've prepared a detailed solar estimate for${address ? ` ${address}` : ' your property'}.

SYSTEM OVERVIEW
System Size: ${systemSize} kW (${numPanels} panels)
Annual Production: ${formatNumber(annualProduction)} kWh/year
${hasBattery && batteryKwh > 0 ? `Battery: ${batteryBrand} ${batteryModel} (${batteryKwh} kWh)\n` : ''}
FINANCIAL SUMMARY
Total System Cost: ${formatCurrency(combinedTotalCost)}
${hasBattery ? `Solar ${formatCurrency(solarTotalCost)} + Battery ${formatCurrency(batteryPrice)}\n` : ''}
${solarIncentives > 0 ? `Solar rebate: -${formatCurrency(solarIncentives)}\n` : ''}
${hasBattery && batteryProgramRebate > 0 ? `Battery rebate: -${formatCurrency(batteryProgramRebate)}\n` : ''}
Net Cost After Rebates: ${formatCurrency(combinedNetCost)}

YOUR SAVINGS
${hasBothPlans ? `
Monthly Savings:
  TOU Plan: ${formatCurrency(touCombinedMonthly)}/month
  ULO Plan: ${formatCurrency(uloCombinedMonthly)}/month

Annual Savings:
  TOU Plan: ${formatCurrency(touCombinedAnnual)}/year
  ULO Plan: ${formatCurrency(uloCombinedAnnual)}/year

25-Year Total Savings:
  TOU Plan: ${formatCurrency(tou25YearTotal)}
  ULO Plan: ${formatCurrency(ulo25YearTotal)}

Payback Period:
  TOU Plan: ${touPayback > 0 && touPayback < 100 ? touPayback.toFixed(1) + ' years' : 'N/A'}
  ULO Plan: ${uloPayback > 0 && uloPayback < 100 ? uloPayback.toFixed(1) + ' years' : 'N/A'}
` : `Monthly Savings: ${formatCurrency(displayMonthlySavings)}/month
Annual Savings: ${formatCurrency(displayAnnualSavings)}/year
25-Year Total Savings: ${formatCurrency(twentyFiveYearSavings)}
${paybackYears > 0 ? `Payback Period: ${paybackYears.toFixed(1)} years\n` : ''}
`}
${co2Offset > 0 ? `
ENVIRONMENTAL IMPACT
CO₂ Offset: ${co2Offset.toFixed(1)} tons/year
${treesEquivalent > 0 ? `Equivalent to: ${formatNumber(treesEquivalent)} trees planted\n` : ''}
` : ''}
WHAT HAPPENS NEXT?
- A SolarX specialist will contact you within 24 hours
- We'll answer any questions and discuss your options
- Schedule a free site assessment if you'd like to proceed

Reference ID: ${leadId}

Questions? Reply to this email or call us at 1-800-SOLAR-X

© ${new Date().getFullYear()} SolarX. All rights reserved.
    `.trim(),
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fullName, email, address, estimate, peakShaving, batteryDetails, leadId } = body

    // Validate required fields
    if (!fullName || !email || !estimate || !leadId) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, email, estimate, leadId' },
        { status: 400 }
      )
    }

    // Generate email template
    const emailContent = generateEstimateEmailTemplate({
      fullName,
      email,
      address,
      estimate,
      peakShaving,
      batteryDetails,
      leadId,
    })

    // Configure Nodemailer with Gmail SMTP
    // Get Gmail credentials from environment variables
    const gmailUser = process.env.GMAIL_USER
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD
    
    // Validate Gmail credentials are configured
    if (!gmailUser || !gmailAppPassword) {
      console.error('Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.')
      // In development, log the email content instead of failing
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email would be sent to:', email)
        console.log('📧 Subject:', emailContent.subject)
        console.log('📧 Email template generated successfully')
        return NextResponse.json({
          success: true,
          message: 'Estimate email template generated (Gmail not configured)',
          warning: 'Gmail credentials not configured. Email not sent.',
        })
      }
      return NextResponse.json(
        { error: 'Email service not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // Create Nodemailer transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: gmailUser,
        pass: gmailAppPassword, // Gmail App Password (not regular password)
      },
    })

    // Send email using Nodemailer
    const mailOptions = {
      from: `SolarX <${gmailUser}>`, // Sender email (your Gmail address)
      to: email, // Recipient email
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    }

    try {
      const info = await transporter.sendMail(mailOptions)
      console.log('✅ Email sent successfully:', info.messageId)
      console.log('📧 Sent to:', email)
      
      return NextResponse.json({
        success: true,
        message: 'Estimate email sent successfully',
        messageId: info.messageId,
      })
    } catch (error) {
      console.error('❌ Email send error:', error)
      return NextResponse.json(
        { 
          error: 'Failed to send email', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

