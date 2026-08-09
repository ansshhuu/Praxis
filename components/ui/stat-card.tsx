"use client"

import { ReactNode } from "react"
import { LucideIcon } from "lucide-react"
import { CountUp, hoverCardClass } from "@/components/motion/primitives"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "./card"

interface StatCardProps {
  title: string
  value: string | ReactNode
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: {
    value: string
    isPositive?: boolean
    label?: string
  }
}

export function StatCard({ title, value, icon: Icon, iconColor = "text-[#D4A017]", iconBg = "bg-[#FFFAEC]", trend }: StatCardProps) {
  return (
    <Card className={cn("flex flex-col justify-center h-full", hoverCardClass)}>
      <CardContent className="flex items-center gap-4 py-5 px-6">
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
          <Icon className="size-6" />
        </div>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <div className="flex items-baseline gap-2">
            {/* Count up only for plain string values; a ReactNode value is
                rendered as given. CountUp itself passes through anything that
                isn't parseable as a number. */}
            <h3 className="text-2xl font-bold text-gray-900 truncate">
              {typeof value === "string" ? <CountUp value={value} /> : value}
            </h3>
            {trend && (
              <span className={`text-xs font-semibold ${trend.isPositive !== false ? "text-green-600" : "text-red-600"}`}>
                {trend.isPositive !== false ? "↑" : "↓"} {trend.value}
                {trend.label && <span className="text-gray-500 font-normal ml-1">{trend.label}</span>}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
