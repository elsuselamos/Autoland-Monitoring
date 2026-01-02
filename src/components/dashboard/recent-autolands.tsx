"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import type { AutolandReport } from "@/types"
import { useRecentAutolandsData } from "@/hooks/use-recent-autolands"
import { formatDate, formatTime, getStatusColor } from "@/lib/utils"

interface RecentAutolandsProps {
  limit?: number
}

export function RecentAutolands({ limit: limit = 20 }: RecentAutolandsProps) {
  const { autolands, isLoading, error, refetch } = useRecentAutolandsData(limit)
  const [currentTime, setCurrentTime] = useState<string>("")

  // Set current time only on client to avoid hydration mismatch
  useEffect(() => {
    setCurrentTime(new Date().toLocaleString())
  }, [])

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
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-vj-red" />
            <div className="text-right">
              <p className="text-sm font-medium text-vj-red">Error Loading Data</p>
              <button
                onClick={() => refetch()}
                className="text-xs text-vj-red hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (autolands.length === 0) {
    return (
      <Card className="hover:shadow-lg transition-shadow h-96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            No Recent Autolands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">
              No recent autolands found
            </p>
            <p className="text-sm text-gray-600">
              Autoland reports will appear here once submitted.
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
            <CardTitle className="text-xl font-bold text-gray-900 mb-1">📝 Recent Autolands</CardTitle>
            <p className="text-sm text-gray-600">
              Last {limit} autoland reports
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
      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6">
        <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Aircraft
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Flight
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Result
                </th>
              </tr>
            </thead>
            <tbody>
              {autolands.map((autoland: any) => (
                <tr key={autoland.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{autoland.aircraft_reg}</span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{autoland.flight_number}</span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{formatDate(autoland.date_utc)}</span>
                    <span className="text-xs text-gray-400 block mt-1">{formatTime(autoland.time_utc)}</span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <Badge className={getStatusColor(autoland.result)}>
                      {autoland.result}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
