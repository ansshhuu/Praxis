'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

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
import { aiUsageData } from '@/lib/dashboard-data'

const chartConfig = {
  requests: {
    label: 'Requests',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

export function UsageChart() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>AI Usage by Module</CardTitle>
        <CardDescription>Requests processed today</CardDescription>
      </CardHeader>
      <div className="px-2 pb-4 sm:px-4">
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <BarChart
            data={aiUsageData}
            layout="vertical"
            margin={{ left: 8, right: 16 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="module"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={82}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => `${Number(value).toLocaleString()} requests`}
                />
              }
            />
            <Bar dataKey="requests" fill="var(--color-requests)" radius={[0, 6, 6, 0]} barSize={22} />
          </BarChart>
        </ChartContainer>
      </div>
    </Card>
  )
}
