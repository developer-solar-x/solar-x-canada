// Utility functions for the application

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Merge Tailwind CSS classes with proper precedence
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency values
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Format number with commas
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-CA').format(value)
}

// Format kWh values
export function formatKwh(value: number): string {
  return `${formatNumber(Math.round(value))} kWh`
}

// Format kW values
export function formatKw(value: number): string {
  return `${value.toFixed(1)} kW`
}

// Calculate estimated system size based on monthly bill
export function calculateQuickEstimate(
  monthlyBill: number,
  options?: { escalationPercent?: number }
) {
  // Ontario electricity rate average
  const avgElectricityRate = 0.134; // $/kWh
  // Solar production in Ontario
  const avgSolarProduction = 1200; // kWh per kW per year
  // Import tiered pricing
  const { calculateSystemCost } = require('@/config/pricing');
  
  // Calculate annual consumption
  const annualConsumption = (monthlyBill / avgElectricityRate) * 12;
  
  // Calculate system size needed
  const systemSize = annualConsumption / avgSolarProduction;
  
  // Calculate costs using tiered pricing
  const systemCost = calculateSystemCost(systemSize);
  
  // Calculate savings
  const annualSavings = monthlyBill * 12;
  
  // Calculate payback period with annual electricity rate escalation
  // Use provided escalationPercent (can be percent like 4.5 or decimal like 0.045), default 4.5%
  const escalatorPercent = typeof options?.escalationPercent === 'number' ? options.escalationPercent : 4.5
  const escalationRate = escalatorPercent > 1 ? escalatorPercent / 100 : escalatorPercent
  const paybackYears = calculatePaybackWithEscalation(annualSavings, systemCost, escalationRate);
  
  return {
    systemSize: Math.round(systemSize * 10) / 10,
    annualSavings: Math.round(annualSavings),
    paybackYears: paybackYears === Infinity ? 999 : Math.round(paybackYears * 10) / 10,
    estimatedCost: Math.round(systemCost)
  };
}

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Format relative time (e.g., "2 days ago")
export function formatRelativeTime(date: Date | string): string {
  // Convert string to Date if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Validate date
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number format (Canadian)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\(\)]+$/;
  const digits = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && digits.length === 10;
}

// Format phone number
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Calculate payback period accounting for electricity rate escalation.
 * As electricity costs rise each year, savings also increase, resulting in a shorter payback.
 * 
 * @param firstYearSavings - Annual savings in the first year ($)
 * @param netCost - Total system cost after rebates ($)
 * @param escalationRate - Annual electricity rate increase (e.g., 0.045 for 4.5%)
 * @param maxYears - Maximum years to calculate (default 25)
 * @returns Payback period in years, or Infinity if not achieved within maxYears
 */
export function calculatePaybackWithEscalation(
  firstYearSavings: number,
  netCost: number,
  escalationRate: number = 0.045,
  maxYears: number = 25
): number {
  if (netCost <= 0) return 0
  if (firstYearSavings <= 0) return Infinity
  
  let cumulativeSavings = 0
  for (let year = 1; year <= maxYears; year++) {
    // Savings grow each year with electricity rate increases
    const yearSavings = firstYearSavings * Math.pow(1 + escalationRate, year - 1)
    cumulativeSavings += yearSavings
    
    if (cumulativeSavings >= netCost) {
      // Calculate fractional year for more precise payback
      const prevCumulative = cumulativeSavings - yearSavings
      const remaining = netCost - prevCumulative
      const fraction = remaining / yearSavings
      return (year - 1) + fraction
    }
  }
  return Infinity
}

