"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Plane, Clock, AlertTriangle, ArrowRight } from "lucide-react"
import type { Aircraft } from "@/types"
import { formatDate, getStatusColor, calculateProgress, getProgressColor } from "@/lib/utils"
import { ProgressBar } from "@/components/fleet/progress-bar"
import { StatusBadge } from "@/components/fleet/status-badge"

interface FleetGridProps {
  aircraft: Aircraft[]
  isLoading?: boolean
}

export function FleetGrid({ aircraft, isLoading }: FleetGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-2 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (aircraft.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
          <Plane className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-900">No Aircraft Found</p>
          <p className="text-sm text-gray-600">
            No aircraft registered in the system yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Fleet Overview Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fleet Overview</h2>
          <p className="text-sm text-gray-600">
            {aircraft.length} aircraft in the fleet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium text-green-700">
              {aircraft.filter((ac) => ac.status === "ON_TIME").length} On Time
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span className="text-sm font-medium text-yellow-700">
              {aircraft.filter((ac) => ac.status === "DUE_SOON").length} Due Soon
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 rounded-lg">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-sm font-medium text-red-700">
              {aircraft.filter((ac) => ac.status === "OVERDUE").length} Overdue
            </span>
          </div>
        </div>
      </div>

      {/* Fleet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {aircraft.map((ac) => {
          const progress = calculateProgress(ac.days_remaining, 30)
          const progressColor = getProgressColor(progress)
          const isOverdue = ac.days_remaining < 0

          return (
            <Link href={`/aircraft/${ac.aircraft_reg}`} key={ac.id}>
              <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6 space-y-4">
                  {/* Aircraft Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-vj-red/10 rounded-lg flex items-center justify-center">
                        <Plane className="w-6 h-6 text-vj-red" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-vj-red group-hover:text-vj-red-dark transition-colors">
                          {ac.aircraft_reg}
                        </p>
                        <p className="text-xs text-gray-500">
                          Last: {formatDate(ac.last_autoland_date)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      status={ac.status}
                      daysRemaining={ac.days_remaining}
                      size="sm"
                    />
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {isOverdue
                          ? `${Math.abs(ac.days_remaining)} days overdue`
                          : `${ac.days_remaining} days remaining`}
                      </span>
                      <Clock className={`w-4 h-4 ${isOverdue ? "text-red-500" : ac.days_remaining <= 7 ? "text-yellow-500" : "text-green-500"}`} />
                    </div>
                    <ProgressBar
                      value={progress}
                      max={100}
                      showLabel={false}
                      size="sm"
                    />
                  </div>

                  {/* Quick Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Next due:</span>
                      <span className="font-semibold text-gray-900">
                        {formatDate(ac.next_required_date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Progress:</span>
                      <span className="font-semibold text-gray-900">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-4 border-t border-gray-100 flex gap-2">
                    <button className="flex-1 text-xs text-vj-red hover:underline py-2 font-medium transition-colors">
                      View Details
                    </button>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-vj-red transition-colors self-center" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Fleet Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Aircraft</div>
                <div className="text-2xl font-bold text-gray-900">
                  {aircraft.length}
                </div>
              </div>
              <Plane className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">On Time</div>
                <div className="text-2xl font-bold text-green-500">
                  {aircraft.filter((ac) => ac.status === "ON_TIME").length}
                </div>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Due Soon</div>
                <div className="text-2xl font-bold text-yellow-500">
                  {aircraft.filter((ac) => ac.status === "DUE_SOON").length}
                </div>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Overdue</div>
                <div className="text-2xl font-bold text-red-500">
                  {aircraft.filter((ac) => ac.status === "OVERDUE").length}
                </div>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


