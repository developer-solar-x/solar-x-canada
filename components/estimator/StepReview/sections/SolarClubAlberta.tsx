'use client'

import { Sparkles, TrendingUp, DollarSign, Leaf } from 'lucide-react'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { findCEIPProgram, extractCityFromAddress, type AlbertaCEIPProgram } from '@/lib/alberta-ceip-data'

interface SolarClubAlbertaProps {
  systemSizeKw: number
  annualProductionKwh?: number
  city?: string | null
  address?: string | null
}

export function SolarClubAlberta({ 
  systemSizeKw, 
  annualProductionKwh,
  city,
  address
}: SolarClubAlbertaProps) {
  // Detect municipality and find CEIP program
  const detectedCity = city || extractCityFromAddress(address)
  const ceipPrograms = findCEIPProgram(detectedCity, 'Residential')
  const hasCEIPProgram = ceipPrograms.length > 0
  const primaryProgram = ceipPrograms[0] // Use first program (usually residential)
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

        {/* Alberta CEIP Qualifications & Eligibility */}
        <div className="bg-white rounded-lg p-4 border-2 border-navy-100">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-navy-600" size={18} />
            <h4 className="font-semibold text-gray-800">
              {hasCEIPProgram && primaryProgram 
                ? `${primaryProgram.city} CEIP Program Qualifications`
                : 'Alberta CEIP Program Qualifications'}
            </h4>
          </div>
          
          {hasCEIPProgram && primaryProgram ? (
            <>
              {/* Municipality-Specific Program Details */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200 mb-4">
                <div className="text-sm font-semibold text-navy-700 mb-3">Your Municipality's Program Details:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Loan Amount:</span>
                    <span className="font-semibold text-navy-700 ml-2">{primaryProgram.loanMaxAmount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Interest Rate:</span>
                    <span className="font-semibold text-navy-700 ml-2">{primaryProgram.interestRate}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Amortization:</span>
                    <span className="font-semibold text-navy-700 ml-2">{primaryProgram.amortization}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Rebate Amount:</span>
                    <span className="font-semibold text-green-600 ml-2">{primaryProgram.rebateAmount}</span>
                  </div>
                  {primaryProgram.maxRebate && (
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Max Rebate:</span>
                      <span className="font-semibold text-green-600 ml-2">{primaryProgram.maxRebate}</span>
                    </div>
                  )}
                </div>
                {primaryProgram.notableTerms && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <div className="text-xs font-semibold text-gray-700 mb-1">Notable Terms:</div>
                    <div className="text-xs text-gray-600">{primaryProgram.notableTerms}</div>
                  </div>
                )}
                {primaryProgram.limitations && (
                  <div className="mt-2">
                    <div className="text-xs font-semibold text-orange-700 mb-1">Limitations:</div>
                    <div className="text-xs text-orange-600">{primaryProgram.limitations}</div>
                  </div>
                )}
                {primaryProgram.payOut && (
                  <div className="mt-2">
                    <div className="text-xs font-semibold text-gray-700 mb-1">Payment Method:</div>
                    <div className="text-xs text-gray-600">{primaryProgram.payOut}</div>
                  </div>
                )}
              </div>
              
              {/* General Qualifications */}
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 font-bold">✓</span>
                  <span><strong>Energy Audit Required:</strong> Must complete a pre-retrofit energy audit before project approval</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 font-bold">✓</span>
                  <span><strong>Property Type:</strong> {primaryProgram.propertyType} properties</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 font-bold">✓</span>
                  <span><strong>Property Ownership:</strong> Must be the property owner (financing is attached to property tax roll)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 font-bold">✓</span>
                  <span><strong>Qualified Contractor:</strong> Work must be completed by a CEIP-qualified contractor</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 font-bold">✓</span>
                  <span><strong>Municipal Participation:</strong> Must be located in {primaryProgram.city}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 font-bold">✓</span>
                  <span><strong>Repayment:</strong> Financing repaid through property tax system over {primaryProgram.amortization}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 font-bold">✓</span>
                  <span><strong>Project Completion:</strong> Rebates/incentives paid to qualified contractor after verified completion</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Generic qualifications if municipality not found */}
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 font-bold">✓</span>
                  <span><strong>Energy Audit Required:</strong> Must complete a pre-retrofit energy audit before project approval</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 font-bold">✓</span>
                  <span><strong>Property Type:</strong> Available for both Residential and Commercial properties (terms vary by municipality)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 font-bold">✓</span>
                  <span><strong>Project Cost Minimum:</strong> Most municipalities require minimum project costs (typically $7,500+)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 font-bold">✓</span>
                  <span><strong>Property Ownership:</strong> Must be the property owner (financing is attached to property tax roll)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 font-bold">✓</span>
                  <span><strong>Qualified Contractor:</strong> Work must be completed by a CEIP-qualified contractor</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 font-bold">✓</span>
                  <span><strong>Municipal Participation:</strong> Must be located in a participating Alberta municipality</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 font-bold">✓</span>
                  <span><strong>Financing Terms:</strong> Loan amounts typically up to $50,000 (some municipalities up to 100% of project cost)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 font-bold">✓</span>
                  <span><strong>Repayment:</strong> Financing repaid through property tax system over 20-25 years</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 font-bold">✓</span>
                  <span><strong>Rebate Eligibility:</strong> Rebate amounts and terms vary by municipality (typically $400-$1,400 for residential)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 font-bold">✓</span>
                  <span><strong>Project Completion:</strong> Rebates/incentives paid to qualified contractor after verified completion</span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-700 mb-2">Program Details by Municipality:</div>
                <div className="text-xs text-gray-600 space-y-1 mb-3">
                  <p>• <strong>Loan Amounts:</strong> Typically $50,000 max (some municipalities up to 100% of project cost)</p>
                  <p>• <strong>Interest Rates:</strong> Range from 1.62% to 6% (varies by municipality)</p>
                  <p>• <strong>Amortization:</strong> 20-25 years depending on municipality</p>
                  <p>• <strong>Rebates:</strong> Range from $350-$1,400 for residential projects (some municipalities offer percentage-based rebates)</p>
                  <p>• <strong>Commercial:</strong> Higher loan limits available (up to $1,000,000 in some municipalities)</p>
                </div>
              </div>
            </>
          )}
          
          <div className="mt-4 pt-3 border-t border-gray-200 flex items-start gap-2 text-xs text-gray-600 bg-blue-50 rounded-lg p-3">
            <InfoTooltip
              content="Alberta CEIP (Clean Energy Improvement Program) provides financing and rebates for energy efficiency and renewable energy upgrades. Program terms, rebate amounts, and interest rates vary by municipality. Contact your local municipality or a CEIP-qualified contractor for specific program details in your area."
            />
            <span>
              <strong>Important:</strong> {hasCEIPProgram && primaryProgram 
                ? `Program terms shown are specific to ${primaryProgram.city}. Contact your local municipality or a CEIP-qualified contractor to confirm current eligibility requirements and application process.`
                : 'CEIP program terms, rebate amounts, and interest rates vary significantly by municipality. Contact your local municipality or a CEIP-qualified contractor to confirm specific eligibility requirements, rebate amounts, and financing terms available in your area.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}


