"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, FileText, ExternalLink, ArrowUp, ArrowDown } from "lucide-react"
import type { AutolandReport } from "@/types"
import { formatDate, formatTime, getStatusColor } from "@/lib/utils"
import { useState } from "react"

interface ReportsTableProps {
  reports: AutolandReport[]
  isLoading?: boolean
  onSort?: (field: string, order: "asc" | "desc") => void
  sortBy?: string
  sortOrder?: "asc" | "desc"
  onViewDetail?: (report: AutolandReport) => void
}

export function ReportsTable({
  reports,
  isLoading = false,
  onSort,
  sortBy = "date_utc",
  sortOrder = "desc",
  onViewDetail,
}: ReportsTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

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

  if (reports.length === 0) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent>
          <div className="flex flex-col items-center justify-center h-96 text-gray-500">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">No Reports Found</p>
            <p className="text-sm text-gray-600">
              Try adjusting your search or filters to find reports.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

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

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>
          Autoland Reports
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({reports.length} results)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                {[
                  { key: "date_utc", label: "Date(Z) & Time(Z)" },
                  { key: "aircraft_reg", label: "Aircraft" },
                  { key: "flight_number", label: "Flight" },
                  { key: "airport", label: "Airport" },
                  { key: "captain", label: "Captain" },
                  { key: "result", label: "Result" },
                  { key: "actions", label: "Actions", sortable: false },
                ].map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                      column.sortable !== false ? "cursor-pointer hover:bg-gray-100" : ""
                    }`}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                  >
                    <div className="flex items-center">
                      {column.label}
                      <SortIcon field={column.key} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => {
                const statusColor = getStatusColor(report.result)
                const isSuccess = report.result === "SUCCESSFUL"

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
                          {report.airport}
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
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (onViewDetail) onViewDetail(report)
                            }}
                            className="text-vj-red hover:underline text-sm"
                            title="View Details"
                          >
                            View
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(
                                `https://storage.cloud.google.com/${report.pdf_storage_bucket}/${report.pdf_storage_path}`,
                                "_blank"
                              )
                            }}
                            className="text-gray-500 hover:text-vj-red transition-colors"
                            title="Download PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (onViewDetail) onViewDetail(report)
                                }}
                                className="px-4 py-2 bg-vj-red text-white rounded-lg hover:bg-vj-red-dark transition-colors"
                              >
                                View Full Details
                              </button>
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

