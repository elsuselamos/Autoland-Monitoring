"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useDashboardData } from "@/hooks/use-dashboard"
import { useRecentAutolandsData } from "@/hooks/use-recent-autolands"
import { Plane, CheckCircle2, AlertTriangle, Clock, FileText, Download } from "lucide-react"

interface CombinedStatsCardsProps {
  search?: string
  aircraftReg?: string
  dateFrom?: string
  dateTo?: string
  result?: string
}

export function CombinedStatsCards({
  search = "",
  aircraftReg = "",
  dateFrom = "",
  dateTo = "",
  result = "ALL"
}: CombinedStatsCardsProps) {
  const { stats: dashboardStats, isLoading: isDashboardLoading } = useDashboardData()
  const { autolands, isLoading: isReportsLoading } = useRecentAutolandsData(
    100,
    "date_utc",
    "desc",
    search || undefined,
    aircraftReg || undefined,
    dateFrom || undefined,
    dateTo || undefined,
    result
  )

  const isLoading = isDashboardLoading || isReportsLoading

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
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

  // Calculate reports statistics
  const totalReports = autolands.length
  const successfulReports = autolands.filter((r) => r.result === "SUCCESSFUL").length
  const unsuccessfulReports = autolands.filter((r) => r.result === "UNSUCCESSFUL").length
  const successRate = totalReports > 0 ? ((successfulReports / totalReports) * 100).toFixed(1) : "0.0"

  // Row 1: Quick Stats (4 cards)
  const quickStats = [
    {
      label: "Total Aircraft",
      value: dashboardStats?.totalAircraft || 0,
      icon: Plane,
      color: "text-gray-900",
    },
    {
      label: "On Time",
      value: dashboardStats?.onTimeCount || 0,
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      label: "Due Soon",
      value: dashboardStats?.dueSoonCount || 0,
      icon: Clock,
      color: "text-warning",
    },
    {
      label: "Overdue",
      value: dashboardStats?.overdueCount || 0,
      icon: AlertTriangle,
      color: "text-vj-red",
    },
  ]

  // Row 2: Reports Stats (4 cards)
  const reportsStats = [
    {
      label: "Total Reports",
      value: totalReports,
      icon: FileText,
      color: "text-gray-900",
      badge: null,
    },
    {
      label: "Successful",
      value: successfulReports,
      icon: CheckCircle2,
      color: "text-success",
      badge: `${successRate}%`,
    },
    {
      label: "Unsuccessful",
      value: unsuccessfulReports,
      icon: AlertTriangle,
      color: "text-vj-red",
      badge: null,
    },
    {
      label: "Results",
      value: totalReports,
      icon: Download,
      color: "text-gray-900",
      badge: null,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Row 1: Quick Stats */}
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

      {/* Row 2: Reports Stats */}
      {reportsStats.map((stat) => {
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
                <div className="flex items-center gap-2">
                  {stat.badge && (
                    <Badge className="bg-green-100 text-green-700">
                      {stat.badge}
                    </Badge>
                  )}
                  <Icon className={`w-8 h-8 ${stat.color === "text-vj-red" ? "text-vj-red" : "text-gray-400"} opacity-50`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}


