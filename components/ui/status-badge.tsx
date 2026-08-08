import { cn } from "@/lib/utils"

type StatusVariant = "success" | "active" | "completed" | "failed" | "running" | "pending" | "paused" | "draft" | "error"

interface StatusBadgeProps {
  status: StatusVariant | string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = status.toLowerCase()
  
  let variantClass = "bg-gray-100 text-gray-600"
  let dotClass = "bg-gray-400"
  
  if (["success", "active", "completed"].includes(s)) {
    variantClass = "bg-green-100 text-green-700"
    dotClass = "bg-green-500"
  } else if (["failed", "error"].includes(s)) {
    variantClass = "bg-red-100 text-red-700"
    dotClass = "bg-red-500"
  } else if (["running", "pending"].includes(s)) {
    variantClass = "bg-amber-100 text-amber-700"
    dotClass = "bg-amber-500 animate-pulse"
  } else if (["paused", "draft"].includes(s)) {
    variantClass = "bg-gray-100 text-gray-600"
    dotClass = "bg-gray-400"
  }

  // Capitalize first letter for display
  const label = status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
        variantClass,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", dotClass)} />
      {label}
    </span>
  )
}
