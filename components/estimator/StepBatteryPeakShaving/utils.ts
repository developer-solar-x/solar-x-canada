// Utility functions for StepBatteryPeakShaving component

export const calculateUsageFromBill = (monthlyBill: number) => {
  // All-in blended rate for Ontario (includes energy + delivery + regulatory + HST)
  // Energy charges: 9.8-39.1¢/kWh (varies by TOU/ULO)
  // Delivery charges: ~$50-70/month fixed + variable
  // Regulatory charges: ~$5-15/month
  // HST: 13% on top
  // Typical all-in rate: 22-24¢/kWh for residential customers
  const avgRate = 0.223 // 22.3¢/kWh blended rate (includes all charges)
  const monthlyKwh = monthlyBill / avgRate
  return Math.round(monthlyKwh * 12)
}

