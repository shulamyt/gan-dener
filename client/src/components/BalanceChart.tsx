import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import type { BalanceHistory } from '../types'

interface BalanceChartProps {
  data: BalanceHistory[]
}

export function BalanceChart({ data }: BalanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No balance history available
      </div>
    )
  }

  const chartData = data
    .slice(-30) // Last 30 entries
    .map((entry) => ({
      date: format(new Date(entry.createdAt), 'MMM dd'),
      balance: entry.newBalance,
      change: entry.changeAmount,
    }))

  const formatTooltip = (value: number, name: string) => {
    if (name === 'balance') {
      return [`₪${value.toLocaleString()}`, 'Balance']
    }
    return [value, name]
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            className="text-xs"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(value) => `₪${value.toLocaleString()}`}
            className="text-xs"
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={formatTooltip}
            labelStyle={{ color: '#374151' }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="balance" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#1d4ed8' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}