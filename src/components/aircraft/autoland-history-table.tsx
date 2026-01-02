"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, FileText, ExternalLink } from "lucide-react"
import type { AutolandReport } from "@/types"
import { formatDate, formatTime, getStatusColor } from "@/lib/utils"

interface AutolandHistoryTableProps {
  autolands: AutolandReport[]
  isLoading?: boolean
  limit?: number
  showViewAll?: boolean
  viewAllHref?: string
}

export function AutolandHistoryTable({
  autolands,
  isLoading = false,
  limit = 20,
  showViewAll = false,
  viewAllHref,
}: AutolandHistoryTableProps) {
  if (isLoading) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-8 h-8 border-4 border-vj-red border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (autolands.length === 0) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent>
          <div className="flex flex-col items-center justify-center h-96 text-gray-500">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">No Autoland History</p>
            <p className="text-sm text-gray-600">
              This aircraft has no recorded autolands yet.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Autoland History</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Last {Math.min(limit, autolands.length)} autolands
          </span>
          {showViewAll && viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-xs text-vj-red hover:underline flex items-center gap-1"
            >
              View All
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Flight
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Airport
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Result
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Captain
                </th>
              </tr>
            </thead>
            <tbody>
              {autolands.slice(0, limit).map((autoland) => {
                const statusColor = getStatusColor(autoland.result)
                const isSuccess = autoland.result === "SUCCESSFUL"

                return (
                  <tr key={autoland.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(autoland.date_utc)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(autoland.time_utc)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-medium">
                        {autoland.flight_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {autoland.airport}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={statusColor}>
                        {isSuccess ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            {autoland.result}
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-1" />
                            {autoland.result}
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {autoland.captain || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/reports/${autoland.id}/pdf`)
                            if (response.ok) {
                              const blob = await response.blob()
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement("a")
                              a.href = url
                              a.download = autoland.pdf_filename || `autoland-${autoland.id}.pdf`
                              document.body.appendChild(a)
                              a.click()
                              window.URL.revokeObjectURL(url)
                              document.body.removeChild(a)
                            } else {
                              alert("Failed to download PDF. Please try again.")
                            }
                          } catch (error) {
                            console.error("Error downloading PDF:", error)
                            alert("Failed to download PDF. Please try again.")
                          }
                        }}
                        className="text-vj-red hover:underline flex items-center gap-1"
                        title="Download PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase font-semibold">
              Total Autolands
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {autolands.length}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase font-semibold">
              Success Rate
            </p>
            <p className="text-2xl font-bold text-success">
              {(() => {
                const successCount = autolands.filter(
                  (al: AutolandReport) => al.result === "SUCCESSFUL"
                ).length
                const rate = (successCount / autolands.length) * 100
                return rate.toFixed(1)
              })()}%
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase font-semibold">
              Last Autoland
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {autolands.length > 0
                ? formatDate(autolands[0].date_utc)
                : "N/A"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

