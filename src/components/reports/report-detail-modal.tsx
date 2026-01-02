"use client"

import { useState, useEffect } from "react"
import { X, Download, FileText, CheckCircle2, XCircle, AlertTriangle, Clock, Plane, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AutolandReport } from "@/types"
import { formatDate, formatTime, getStatusColor } from "@/lib/utils"

interface ReportDetailModalProps {
  report: AutolandReport | null
  isOpen: boolean
  onClose: () => void
}

export function ReportDetailModal({ report, isOpen, onClose }: ReportDetailModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [fullReport, setFullReport] = useState<AutolandReport | null>(report)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch full report data when modal opens
  useEffect(() => {
    if (isOpen && report?.id) {
      setIsLoading(true)
      fetch(`/api/reports/${report.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.report) {
            setFullReport(data.data.report)
          }
        })
        .catch((error) => {
          console.error("Error fetching report details:", error)
          // Fallback to provided report if fetch fails
          setFullReport(report)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setFullReport(report)
    }
  }, [isOpen, report])

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = "unset"
      }
    }
  }, [isOpen])

  const handleDownloadPDF = async () => {
    const reportToUse = fullReport || report
    if (!reportToUse) return

    setIsDownloading(true)
    try {
      const response = await fetch(`/api/reports/${reportToUse.id}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = reportToUse.pdf_filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        throw new Error("Failed to download PDF")
      }
    } catch (error) {
      console.error("Error downloading PDF:", error)
      alert("Failed to download PDF. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  if (!report || !isOpen) return null

  // Use fullReport if available, otherwise fallback to report
  const displayReport = fullReport || report

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-vj-red border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  const isSuccess = displayReport.result === "SUCCESSFUL"
  const statusColor = getStatusColor(displayReport.result)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Autoland Report Details
            </h2>
            <p className="text-sm text-gray-500">
              {displayReport.report_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div className={`p-4 rounded-xl ${
            isSuccess ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          }`}>
            <div className="flex items-center gap-3">
              {isSuccess ? (
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
              <div>
                <p className={`text-lg font-semibold ${isSuccess ? "text-green-700" : "text-red-700"}`}>
                  {displayReport.result}
                </p>
                <p className="text-sm text-gray-600">
                  {isSuccess
                    ? "This autoland operation was completed successfully"
                    : "This autoland operation was unsuccessful"}
                </p>
              </div>
            </div>
            {displayReport.reasons && (
              <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="font-medium">Reasons: {displayReport.reasons}</p>
              </div>
            )}
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Plane className="w-4 h-4" />
                <span>Aircraft</span>
              </div>
              <p className="text-lg font-semibold text-vj-red">
                {displayReport.aircraft_reg}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Date & Time(Z)</span>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(displayReport.date_utc)}
                </p>
                <p className="text-sm text-gray-500">
                  {displayReport.time_utc ? formatTime(displayReport.time_utc) : 'N/A'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FileText className="w-4 h-4" />
                <span>Flight</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {displayReport.flight_number}
              </p>
            </div>
          </div>

          {/* Flight Details */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Flight Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Airport</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {displayReport.airport}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Runway</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {displayReport.runway || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">TD Point</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {displayReport.td_point || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tracking</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {displayReport.tracking || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Captain</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {displayReport.captain || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">First Officer</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {displayReport.first_officer || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Wind Velocity</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {displayReport.wind_velocity || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">QNH</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {displayReport.qnh || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Parameters */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Technical Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Alignment</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {displayReport.alignment || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Speed Control</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {displayReport.speed_control || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Temperature</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {displayReport.temperature || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Landing</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {displayReport.landing || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Aircraft Dropout</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {displayReport.aircraft_dropout || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Visibility RVR</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {displayReport.visibility_rvr || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PDF Download */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-vj-red" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Original Report PDF
                    </p>
                    <p className="text-sm text-gray-500">
                      {displayReport.pdf_filename}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-6 py-3 bg-vj-red text-white rounded-lg hover:bg-vj-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download PDF
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

