"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FleetGrid } from "@/components/fleet/fleet-grid"
import { useAircraftData } from "@/hooks/use-aircraft"
import { RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Activity } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Aircraft } from "@/types"

export default function FleetPage() {
  const [timeframe, setTimeframe] = useState<"7days" | "30days" | "90days">("30days")
  const [selectedView, setSelectedView] = useState<"grid" | "list">("grid")

  const {
    aircraft,
    isLoading,
    error,
    refetch,
  } = useAircraftData({
    status: "ALL",
    sort_by: "days_remaining",
    sort_order: "asc",
    page: 1,
    per_page: 100, // Get all aircraft for fleet overview
  })

  // Calculate fleet statistics
  const onTimeCount = aircraft.filter((ac) => ac.status === "ON_TIME").length
  const dueSoonCount = aircraft.filter((ac) => ac.status === "DUE_SOON").length
  const overdueCount = aircraft.filter((ac) => ac.status === "OVERDUE").length
  const totalCount = aircraft.length

  const complianceRate = totalCount > 0
    ? ((onTimeCount / totalCount) * 100).toFixed(1)
    : "0.0"

  const urgencyScore = totalCount > 0
    ? (((dueSoonCount * 10) + (overdueCount * 50)) / totalCount).toFixed(1)
    : "0.0"

  // Get aircraft with most urgent status
  const urgentAircraft = aircraft
    .filter((ac) => ac.status !== "ON_TIME")
    .sort((a, b) => a.days_remaining - b.days_remaining)
    .slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ✈️ Fleet Monitoring
          </h1>
          <p className="mt-1 text-gray-600">
            Comprehensive overview of autoland compliance across the entire fleet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-8 h-8 text-vj-red" />
              <div className="flex-1">
                <p className="text-lg font-semibold text-vj-red">Error Loading Fleet Data</p>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-vj-red text-white rounded-lg hover:bg-vj-red-dark transition-colors"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fleet Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Compliance Rate</div>
                <div className="text-3xl font-bold text-green-500">
                  {complianceRate}%
                </div>
                <div className="text-xs text-gray-600">
                  {onTimeCount} / {totalCount} aircraft on time
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Urgency Score</div>
                <div className="text-3xl font-bold text-vj-red">
                  {urgencyScore}
                </div>
                <div className="text-xs text-gray-600">
                  {(dueSoonCount + overdueCount)} aircraft need attention
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Due Soon</div>
                <div className="text-3xl font-bold text-yellow-500">
                  {dueSoonCount}
                </div>
                <div className="text-xs text-gray-600">
                  Within next 7 days
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Overdue</div>
                <div className="text-3xl font-bold text-red-500">
                  {overdueCount}
                </div>
                <div className="text-xs text-gray-600">
                  Require immediate action
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Alerts */}
      {urgentAircraft.length > 0 && (
        <Card className="border-red-200 bg-red-50 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-red-700">
                  Urgent Attention Required
                </h3>
              </div>
              <div className="space-y-2">
                {urgentAircraft.map((ac) => (
                  <div
                    key={ac.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xl">✈️</div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {ac.aircraft_reg}
                        </p>
                        <p className="text-sm text-gray-600">
                          {ac.days_remaining < 0
                            ? `${Math.abs(ac.days_remaining)} days overdue`
                            : `${ac.days_remaining} days remaining`}
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-vj-red text-white rounded-lg hover:bg-vj-red-dark transition-colors text-sm">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fleet Grid */}
      <FleetGrid aircraft={aircraft} isLoading={isLoading} />

      {/* Additional Information */}
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Fleet Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="font-medium text-gray-900">{formatDate(new Date())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Monitoring Period:</span>
                  <span className="font-medium text-gray-900">30-day cycle</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Compliance Threshold:</span>
                  <span className="font-medium text-gray-900">≥7 days remaining</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Next Cycle Check:</span>
                  <span className="font-medium text-gray-900">Ongoing</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Active Alerts:</span>
                  <span className="font-medium text-red-600">
                    {dueSoonCount + overdueCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Overall Status:</span>
                  <span className={`font-semibold ${overdueCount > 0 ? "text-red-600" : dueSoonCount > 0 ? "text-yellow-600" : "text-green-600"}`}>
                    {overdueCount > 0 ? "Critical" : dueSoonCount > 0 ? "Needs Attention" : "Good"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


