"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle2, AlertTriangle, FileText } from "lucide-react"
import { useAircraftDetailData } from "@/hooks/use-aircraft-detail"
import { formatDate, formatTime } from "@/lib/utils"

export function AircraftDetail({ params }: { params: { reg: string } }) {
  const { aircraft, isLoading, error, refetch } = useAircraftDetailData(params.reg)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent>
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin w-8 h-8 border-4 border-vj-red border-t-transparent rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-8 h-8 text-vj-red" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-vj-red">Error Loading Data</h3>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="w-full px-4 py-2 bg-vj-red text-white rounded-lg hover:bg-vj-red-dark transition-colors"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!aircraft) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium">Aircraft not found</p>
              <Link href="/fleet" className="text-vj-red hover:underline mt-4">
                View All Aircraft →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusColor = aircraft.status === "ON_TIME"
    ? "bg-green-100 text-green-700"
    : aircraft.status === "DUE_SOON"
    ? "bg-yellow-100 text-yellow-700"
    : "bg-red-100 text-red-700"

  const daysRemaining = aircraft.days_remaining
  const isOverdue = daysRemaining < 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm">
        <Link href="/fleet" className="text-gray-500 hover:text-gray-900">
          Fleet
        </Link>
        <span className="text-gray-400">/</span>
        <Link href={`/aircraft/${aircraft.aircraft_reg}`} className="text-gray-500 hover:text-gray-900 font-medium">
          {aircraft.aircraft_reg}
        </Link>
      </div>

      {/* Aircraft Info Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Aircraft Information</CardTitle>
          <Badge className={statusColor}>
            {aircraft.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Aircraft Registration */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Aircraft Registration</p>
              <p className="text-2xl font-bold text-vj-red">
                {aircraft.aircraft_reg}
              </p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-semibold text-gray-900">
                {aircraft.status}
              </p>
            </div>

            {/* Last Autoland Date */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Last Autoland Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(aircraft.last_autoland_date)}
              </p>
            </div>

            {/* Next Required Date */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Next Required Date</p>
              <p className={`text-lg font-semibold ${isOverdue ? "text-vj-red" : "text-gray-900"}`}>
                {formatDate(aircraft.next_required_date)}
              </p>
            </div>

            {/* Days Remaining */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Days Remaining</p>
              <div className="flex items-center space-x-2">
                <p className={`text-4xl font-bold ${isOverdue ? "text-vj-red" : aircraft.days_remaining <= 7 ? "text-vj-yellow" : "text-success"}`}>
                  {daysRemaining}
                </p>
                <p className="text-sm text-gray-600">days</p>
                {isOverdue && <AlertTriangle className="w-5 h-5 text-vj-red" />}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

