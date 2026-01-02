"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useDashboardData } from "@/hooks/use-dashboard"
import { Plane, CheckCircle2, AlertTriangle, Clock } from "lucide-react"

export function QuickStatsCards() {
  const { stats, isLoading } = useDashboardData()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const quickStats = [
    {
      label: "Total Aircraft",
      value: stats?.totalAircraft || 0,
      icon: Plane,
      color: "text-gray-900",
    },
    {
      label: "On Time",
      value: stats?.onTimeCount || 0,
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      label: "Due Soon",
      value: stats?.dueSoonCount || 0,
      icon: Clock,
      color: "text-warning",
    },
    {
      label: "Overdue",
      value: stats?.overdueCount || 0,
      icon: AlertTriangle,
      color: "text-vj-red",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {quickStats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                </div>
                <Icon className={`w-8 h-8 ${stat.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}


