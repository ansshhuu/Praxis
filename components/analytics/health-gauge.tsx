import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import type { ServiceStatus } from './types'

const STATUS_META: Record<ServiceStatus, { label: string; color: string; value: number }> = {
  up: { label: 'Healthy', color: '#22c55e', value: 100 },
  down: { label: 'Down', color: '#ef4444', value: 100 },
  not_configured: { label: 'Not configured', color: '#d1d5db', value: 100 },
}

export function HealthGauge({ name, status }: { name: string; status: ServiceStatus }) {
  const meta = STATUS_META[status]
  const data = [{ value: meta.value }]

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-1 text-center">
        <CardTitle className="text-sm">{name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-1 pb-4">
        <div className="relative flex size-24 items-center justify-center">
          <ResponsiveContainer width={96} height={96}>
            <PieChart>
              <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={32} outerRadius={44} startAngle={90} endAngle={-270} strokeWidth={0}>
                <Cell fill={meta.color} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className={cn('absolute size-2.5 rounded-full', status === 'up' ? 'bg-green-500' : status === 'down' ? 'bg-red-500' : 'bg-gray-400')} />
        </div>
        <span
          className={cn(
            'text-[11px] font-bold uppercase tracking-wide',
            status === 'up' ? 'text-green-600' : status === 'down' ? 'text-red-600' : 'text-gray-400',
          )}
        >
          {meta.label}
        </span>
      </CardContent>
    </Card>
  )
}
