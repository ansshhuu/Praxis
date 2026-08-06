'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { successRateData } from '@/lib/dashboard-data'

const chartConfig = {
  rate: {
    label: 'Success rate',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

export function SuccessRateChart() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Workflow Success Rate</CardTitle>
        <CardDescription>Percentage of successful runs, last 7 days</CardDescription>
      </CardHeader>
      <div className="px-2 pb-4 sm:px-4">
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <AreaChart data={successRateData} margin={{ left: 4, right: 12, top: 8 }}>
            <defs>
              <linearGradient id="fillRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-rate)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-rate)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              domain={[80, 100]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={40}
              tickFormatter={(v) => `${v}%`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent formatter={(value) => `${value}%`} />}
            />
            <Area
              dataKey="rate"
              type="monotone"
              stroke="var(--color-rate)"
              strokeWidth={2}
              fill="url(#fillRate)"
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </Card>
  )
}
