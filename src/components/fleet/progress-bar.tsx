"use client"

import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number // 0 to 100
  max?: number
  color?: "vj-red" | "vj-yellow" | "success" | "warning" | "error" | "info"
  showLabel?: boolean
  label?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  color,
  showLabel = false,
  label,
  size = "md",
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  // Auto-determine color if not specified
  const getColor = () => {
    if (color) return color
    if (percentage >= 80) return "success"
    if (percentage >= 50) return "vj-yellow"
    return "vj-red"
  }

  const autoColor = getColor()

  const colorClasses = {
    "vj-red": "bg-vj-red",
    "vj-yellow": "bg-vj-yellow",
    "success": "bg-green-500",
    "warning": "bg-yellow-500",
    "error": "bg-red-500",
    "info": "bg-blue-500",
  }

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  }

  return (
    <div className={cn("w-full space-y-1", className)}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{label}</span>
          {showLabel && (
            <span className="font-medium text-gray-900">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={cn("w-full bg-gray-100 rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            colorClasses[autoColor]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}


