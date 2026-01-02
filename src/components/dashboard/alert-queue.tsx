"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import type { Aircraft } from "@/types"
import { useAlertsData } from "@/hooks/use-alerts"
import { formatDate, getStatusColor } from "@/lib/utils"

export function AlertQueue() {
  const { alerts, isLoading, error, refetch } = useAlertsData()
  const [currentTime, setCurrentTime] = useState<string>("")

  // Set current time only on client to avoid hydration mismatch
  useEffect(() => {
    setCurrentTime(new Date().toLocaleString())
  }, [])

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Auto-refreshing alerts...")
      refetch()
    }, 120000) // 2 minutes

    return () => clearInterval(interval)
  }, [refetch])

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-96">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-8 h-8 border-4 border-vj-red border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">🚨 Alert Queue Error</h3>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-vj-red text-white rounded-lg hover:bg-vj-red-dark transition-colors"
          >
            Retry
          </button>
        </div>
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card className="rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm hover:shadow-lg transition-shadow h-full flex flex-col min-h-[400px]">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            No Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <CheckCircle2 className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">
              All aircraft are on schedule!
            </p>
            <p className="text-sm text-gray-600">
              No aircraft need attention at this time.
            </p>
            {currentTime && (
              <div className="mt-4 text-xs text-gray-400">
                Last updated: {currentTime}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm hover:shadow-lg transition-shadow h-full flex flex-col min-h-[400px]">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 mb-1">🚨 Alert Queue</CardTitle>
            <p className="text-sm text-gray-600">
              Aircraft needing attention ({alerts.length})
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 text-sm text-vj-red border border-vj-red rounded hover:bg-vj-red/10 transition-colors"
          >
            Refresh
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-4">
        <div className="h-full overflow-y-auto space-y-3 scrollbar-thin">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="text-2xl">✈️</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{alert.aircraft_reg}</p>
                    <p className="text-xs text-gray-500">
                      Last autoland: {formatDate(alert.last_autoland_date)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {formatDate(alert.next_required_date)}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {alert.days_remaining < 0
                        ? `${Math.abs(alert.days_remaining)} days overdue`
                        : `${alert.days_remaining} days remaining`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge className={getStatusColor(alert.status)}>
                    {alert.status}
                  </Badge>
                  <Link
                    href={`/aircraft/${alert.aircraft_reg}`}
                    className="text-sm text-vj-red hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
