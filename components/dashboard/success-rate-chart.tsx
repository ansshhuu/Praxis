'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DASHBOARD_RANGES, type DashboardRange, type SuccessRatePoint } from '@/lib/dashboard/types'

const AMBER = '#F5CA50'
const DARK_GOLD = '#D4A017'

const TAB_LABELS: Record<DashboardRange, string> = { 7: '7D', 30: '30D', 90: '90D' }

type TooltipPayload = { payload: SuccessRatePoint }[]

function ChartTip({ active, payload }: { active?: boolean; payload?: TooltipPayload }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-md">
      <p className="text-[12px] font-semibold text-gray-900">{point.label}</p>
      <p className="mt-0.5 text-[12px] font-medium text-[#D4A017]">{point.rate}% success rate</p>
      <p className="text-[11px] text-gray-400">{point.runs} {point.runs === 1 ? 'run' : 'runs'}</p>
    </div>
  )
}

export function SuccessRateChart({
  data,
  range,
  onRangeChange,
}: {
  data: SuccessRatePoint[]
  range: DashboardRange
  onRangeChange: (range: DashboardRange) => void
}) {
  const totalRuns = data.reduce((sum, point) => sum + point.runs, 0)
  const tickInterval = data.length > 30 ? Math.ceil(data.length / 8) : data.length > 10 ? 3 : 0

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Workflow Success Rate</CardTitle>
          <p className="mt-1 text-[13px] text-gray-500">
            {totalRuns > 0
              ? `${totalRuns.toLocaleString('en-US')} settled runs in the last ${range} days`
              : `No settled runs in the last ${range} days`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 rounded-lg bg-gray-50 p-0.5">
          {DASHBOARD_RANGES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onRangeChange(value)}
              aria-pressed={range === value}
              className={cn(
                'rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors',
                range === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900',
              )}
            >
              {TAB_LABELS[value]}
            </button>
          ))}
        </div>
      </CardHeader>

      <div className="px-2 pb-2">
        <ResponsiveContainer width="100%" height={264}>
          <AreaChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="dashSuccessFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={AMBER} stopOpacity={0.38} />
                <stop offset="100%" stopColor={AMBER} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="label"
              interval={tickInterval}
              tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              width={40}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<ChartTip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
            <Area
              dataKey="rate"
              type="monotone"
              stroke={DARK_GOLD}
              strokeWidth={2.5}
              fill="url(#dashSuccessFill)"
              activeDot={{ r: 4, fill: DARK_GOLD, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
