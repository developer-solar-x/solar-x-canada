'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatNumber } from '@/lib/utils'

interface ProductionTabProps {
  annualKwh: number
  productionChartData: Array<{ month: string; production: number }>
  isMobile: boolean
}

export function ProductionTab({ annualKwh, productionChartData, isMobile }: ProductionTabProps) {
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
            {Math.round(annualKwh / 365)} kWh
          </div>
        </div>
      </div>

      {/* Production chart */}
      <div className="h-[20rem] sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={productionChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="production" stroke="#1B4E7C" strokeWidth={isMobile ? 2 : 2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

