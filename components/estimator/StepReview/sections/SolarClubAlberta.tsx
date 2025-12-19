'use client'

import { Sparkles, TrendingUp, DollarSign, Leaf } from 'lucide-react'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

interface SolarClubAlbertaProps {
  systemSizeKw: number
  annualProductionKwh?: number
}

export function SolarClubAlberta({ 
  systemSizeKw, 
  annualProductionKwh 
}: SolarClubAlbertaProps) {
  // Calculate potential additional earnings from Solar Club
  // High export rate: up to 33¢/kWh during high production months
  // Low import rate: 6.89¢/kWh during low production months
  // Cash back: 3% on imported energy
  
  // Estimate: ~60% of production happens in high-production months (spring/summer)
  // where you can export at high rates
  const highProductionMonths = 6 // April - September
  const estimatedHighProductionKwh = annualProductionKwh 
    ? (annualProductionKwh * 0.6) 
    : (systemSizeKw * 1200 * 0.6) // Fallback estimate
  
  // Conservative estimate: 50% of high production is exported
  const estimatedExportKwh = estimatedHighProductionKwh * 0.5
  const highExportRate = 0.33 // 33¢/kWh
  const estimatedAdditionalEarnings = estimatedExportKwh * highExportRate

  return (
    <div className="card p-6 bg-gradient-to-br from-navy-50 to-blue-50 border-2 border-navy-100 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-500 rounded-lg">
          <Sparkles className="text-white" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-navy-700">Solar Club Alberta</h3>
          <p className="text-sm text-gray-600">Maximize your solar investment</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* High Export Rate */}
          <div className="bg-white rounded-lg p-4 border border-navy-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-navy-600" size={18} />
              <span className="font-semibold text-gray-800 text-sm">High Export Rate</span>
            </div>
            <div className="text-2xl font-bold text-red-500 mb-1">
              Up to 33¢/kWh
            </div>
            <p className="text-xs text-gray-600">
              During high production months (spring/summer)
            </p>
          </div>

          {/* Low Import Rate */}
          <div className="bg-white rounded-lg p-4 border border-navy-100">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-navy-600" size={18} />
              <span className="font-semibold text-gray-800 text-sm">Low Import Rate</span>
            </div>
            <div className="text-2xl font-bold text-red-500 mb-1">
              6.89¢/kWh
            </div>
            <p className="text-xs text-gray-600">
              During low production months (fall/winter)
            </p>
          </div>
        </div>

        {/* Additional Benefits */}
        <div className="bg-white rounded-lg p-4 border border-navy-100">
          <div className="flex items-start gap-2 mb-3">
            <Leaf className="text-navy-600 mt-0.5" size={18} />
            <div className="flex-1">
              <div className="font-semibold text-gray-800 mb-2">Additional Benefits</div>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span><strong>3% cash back</strong> on all imported energy (paid annually)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span><strong>Carbon credits</strong> - sell credits from your solar system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span><strong>Flexible switching</strong> - change rates with 10 days notice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span><strong>Pre-Solar Rate</strong> - 6.74¢/kWh while waiting for installation (up to 180 days)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Estimated Additional Earnings */}
        {estimatedAdditionalEarnings > 0 && (
          <div className="bg-white rounded-lg p-4 border-2 border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-navy-700 mb-1">
                  Estimated Additional Annual Earnings
                </div>
                <div className="text-xs text-gray-600">
                  From high export rates during peak production months
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-500">
                  ${Math.round(estimatedAdditionalEarnings).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">per year</div>
              </div>
            </div>
          </div>
        )}

        {/* Eligibility Note */}
        <div className="flex items-start gap-2 text-xs text-gray-700 bg-blue-50 rounded-lg p-3 border border-navy-100">
          <InfoTooltip
            content="Solar Club Alberta is available to Alberta residents with solar PV systems under 150 kW. Enrollment requires registration as a micro-generator and may include a donation to a local food bank or charity. Rates and benefits are subject to program terms and conditions."
          />
          <span>
            <strong>Eligibility:</strong> Available for solar systems under 150 kW. 
            Ask your installer about enrollment when you get your quote.
          </span>
        </div>
      </div>
    </div>
  )
}


