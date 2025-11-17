'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface EstimateTabProps {
  productionChartData: Array<{ month: string; production: number }>
  displayAnnualProduction: number | null
  isMobile: boolean
}

export function EstimateTab({ productionChartData, displayAnnualProduction, isMobile }: EstimateTabProps) {
  return (
    <div className="space-y-6">
      {/* Annual Production Chart */}
      {productionChartData.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-navy-500 mb-4">Monthly Production</h3>
          <div className="h-[22rem] sm:h-80 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productionChartData} margin={isMobile ? { top: 8, right: 20, left: 36, bottom: 36 } : { top: 10, right: 20, left: 48, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: isMobile ? 10 : 11 }}
                  label={{ value: 'Month', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
                />
                <YAxis 
                  tick={{ fontSize: isMobile ? 10 : 11 }}
                  tickFormatter={(v: number) => `${Math.round(v)} kWh`}
                  label={{ value: 'Production (kWh)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  width={isMobile ? 50 : 60}
                />
                <Tooltip 
                  formatter={(value: number) => `${Math.round(value)} kWh`}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="production" 
                  stroke="#1B4E7C" 
                  strokeWidth={isMobile ? 2 : 2.5}
                  dot={{ r: isMobile ? 3 : 4, fill: '#1B4E7C' }}
                  activeDot={{ r: isMobile ? 6 : 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-sm text-gray-600 text-center">
            Annual Production: {typeof displayAnnualProduction === 'number' ? displayAnnualProduction.toLocaleString() : 'N/A'} kWh
          </div>
        </div>
      )}
    </div>
  )
}

