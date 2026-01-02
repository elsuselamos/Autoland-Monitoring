"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, FileText, ArrowUp, ArrowDown } from "lucide-react"
import type { AutolandReport } from "@/types"
import { useRecentAutolandsData } from "@/hooks/use-recent-autolands"
import { formatDate, formatTime, getStatusColor } from "@/lib/utils"
import { useState } from "react"

interface AutolandReportsTableProps {
  onViewDetail?: (report: AutolandReport) => void
  onSort?: (field: string, order: "asc" | "desc") => void
  sortBy?: string
  sortOrder?: "asc" | "desc"
  search?: string
  aircraftReg?: string
  dateFrom?: string
  dateTo?: string
  result?: string
}

export function AutolandReportsTable({ 
  onViewDetail,
  onSort,
  sortBy = "date_utc",
  sortOrder = "desc",
  search = "",
  aircraftReg = "",
  dateFrom = "",
  dateTo = "",
  result = "ALL"
}: AutolandReportsTableProps) {
  // Minimum 10 results required for Autoland Reports table
  const MIN_RESULTS = 10
  const { autolands, isLoading, error } = useRecentAutolandsData(
    MIN_RESULTS, 
    sortBy, 
    sortOrder, 
    search,
    aircraftReg || undefined,
    dateFrom || undefined,
    dateTo || undefined,
    result
  )
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const handleSort = (field: string) => {
    if (onSort) {
      const newOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc"
      onSort(field, newOrder)
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1" />
    )
  }

  if (isLoading) {
    return (
      <Card className="rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>
            Autoland Reports
            <span className="ml-2 text-sm font-normal text-gray-500">
              (Loading...)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-8 h-8 border-4 border-vj-red border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Autoland Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-red-500">
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (autolands.length === 0) {
    return (
      <Card className="rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>
            Autoland Reports
            <span className="ml-2 text-sm font-normal text-gray-500">
              (0 results)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-96 text-gray-500">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">No Reports Found</p>
            <p className="text-sm text-gray-600">
              No autoland reports available at this time.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>
          Autoland Reports
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({autolands.length} results)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                {[
                  { key: "date_utc", label: "Date & Time(Z)", sortable: true },
                  { key: "aircraft_reg", label: "Aircraft", sortable: true },
                  { key: "flight_number", label: "Flight", sortable: true },
                  { key: "airport", label: "Airport", sortable: true },
                  { key: "captain", label: "Captain", sortable: true },
                  { key: "result", label: "Result", sortable: true },
                  { key: "days_remaining", label: "To Go", sortable: true },
                ].map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                      column.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                    }`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center">
                      {column.label}
                      {column.sortable && <SortIcon field={column.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {autolands.map((report: any) => {
                const statusColor = getStatusColor(report.result)
                const isSuccess = report.result === "SUCCESSFUL"
                
                // Calculate days remaining (To Go)
                const daysRemaining = report.days_remaining !== null && report.days_remaining !== undefined
                  ? report.days_remaining
                  : null

                const toGoText = daysRemaining !== null && !isNaN(daysRemaining)
                  ? daysRemaining < 0
                    ? `${Math.abs(daysRemaining)} days overdue`
                    : `${daysRemaining} days`
                  : "N/A"

                const toGoColor = daysRemaining !== null && !isNaN(daysRemaining)
                  ? daysRemaining < 0
                    ? "text-error font-semibold"
                    : daysRemaining <= 7
                    ? "text-warning font-semibold"
                    : "text-gray-600"
                  : "text-gray-400"

                return (
                  <>
                    <tr
                      key={report.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedRow(expandedRow === report.id ? null : report.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(report.date_utc)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(report.time_utc)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-vj-red">
                          {report.aircraft_reg}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {report.flight_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {report.airport || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {report.captain || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={statusColor}>
                          {isSuccess ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              {report.result}
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-1" />
                              {report.result}
                            </>
                          )}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${toGoColor}`}>
                          {toGoText}
                        </span>
                        {report.next_required_date && (
                          <span className="text-xs text-gray-400 block mt-1">
                            Next: {formatDate(report.next_required_date)}
                          </span>
                        )}
                      </td>
                    </tr>
                    {/* Expanded Row - Quick Details */}
                    {expandedRow === report.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="space-y-4">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500 uppercase font-semibold">
                                  Runway
                                </p>
                                <p className="text-sm font-medium text-gray-900">
                                  {report.runway || "N/A"}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500 uppercase font-semibold">
                                  TD Point
                                </p>
                                <p className="text-sm font-medium text-gray-900">
                                  {report.td_point || "N/A"}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500 uppercase font-semibold">
                                  Tracking
                                </p>
                                <p className="text-sm font-medium text-gray-900">
                                  {report.tracking || "N/A"}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500 uppercase font-semibold">
                                  Visibility
                                </p>
                                <p className="text-sm font-medium text-gray-900">
                                  {report.visibility_rvr || "N/A"}
                                </p>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              {onViewDetail && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onViewDetail(report)
                                  }}
                                  className="px-4 py-2 bg-vj-red text-white rounded-lg hover:bg-vj-red-dark transition-colors"
                                >
                                  View Full Details
                                </button>
                              )}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  try {
                                    const response = await fetch(`/api/reports/${report.id}/pdf`)
                                    if (response.ok) {
                                      const blob = await response.blob()
                                      const url = window.URL.createObjectURL(blob)
                                      const a = document.createElement("a")
                                      a.href = url
                                      a.download = report.pdf_filename || `autoland-${report.id}.pdf`
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
                                className="px-4 py-2 border border-vj-red text-vj-red rounded-lg hover:bg-vj-red/10 transition-colors"
                              >
                                <FileText className="w-4 h-4 mr-2 inline" />
                                Download PDF
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

