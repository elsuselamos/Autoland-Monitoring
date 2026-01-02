"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react"

interface StatusBadgeProps {
  status: "ON_TIME" | "DUE_SOON" | "OVERDUE" | "SUCCESS" | "ERROR" | "WARNING"
  daysRemaining?: number
  showIcon?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function StatusBadge({
  status,
  daysRemaining,
  showIcon = true,
  size = "md",
  className,
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "ON_TIME":
      case "SUCCESS":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          icon: CheckCircle2,
          label: "Đúng hạn",
        }
      case "DUE_SOON":
      case "WARNING":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          icon: Clock,
          label: "Sắp đến hạn",
        }
      case "OVERDUE":
      case "ERROR":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          icon: AlertTriangle,
          label: "Quá hạn",
        }
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          icon: Clock,
          label: status,
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  }

  return (
    <Badge
      className={cn(
        config.bg,
        config.text,
        sizeClasses[size],
        "flex items-center gap-1.5 font-medium",
        className
      )}
    >
      {showIcon && <Icon className="w-4 h-4" />}
      <span>{config.label}</span>
      {daysRemaining !== undefined && (
        <span className="ml-1 text-xs opacity-75">
          ({daysRemaining}d)
        </span>
      )}
    </Badge>
  )
}


