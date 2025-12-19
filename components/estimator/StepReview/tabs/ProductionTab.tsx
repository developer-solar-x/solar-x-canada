'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatNumber } from '@/lib/utils'

interface ProductionTabProps {
  annualKwh: number
  // Combined dataset: include production and usage for each month
  productionChartData: Array<{ month: string; production: number; usage?: number }>
  isMobile: boolean
}

export function ProductionTab({ annualKwh, productionChartData, isMobile }: ProductionTabProps) {
  // Build daily average from annual
  const dailyAvg = Math.round(annualKwh / 365)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-sm text-gray-600 mb-1">Annual Production</div>
          <div className="text-xl font-bold text-navy-500">
            {formatNumber(annualKwh)} kWh
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">Daily Average</div>
          <div className="text-xl font-bold text-navy-500">
            {dailyAvg} kWh
          </div>
        </div>
      </div>

      {/* Production vs Usage Bar Chart */}
      <div className="h-[22rem] sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={productionChartData} margin={isMobile ? { top: 10, right: 10, left: 10, bottom: 10 } : { top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 12 }} />
            <Bar dataKey="production" name="Production (kWh)" fill="#1B4E7C" radius={[4, 4, 0, 0]} />
            <Bar dataKey="usage" name="Usage (kWh)" fill="#DC143C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

