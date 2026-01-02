"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plane, Clock, ArrowRight } from "lucide-react"
import type { Aircraft } from "@/types"
import { formatDate, getStatusColor, calculateProgress, getProgressColor } from "@/lib/utils"

interface AircraftGridProps {
  aircraft: Aircraft[]
  isLoading?: boolean
}

export function AircraftGrid({ aircraft, isLoading }: AircraftGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow">
            <CardContent>
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <div className="animate-spin w-8 h-8 border-4 border-vj-red border-t-transparent rounded-full"></div>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fleet Overview</h2>
          <p className="text-sm text-gray-600">
            {aircraft.length} aircraft total
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aircraft.map((ac) => {
          const progress = calculateProgress(ac.days_remaining, 30)
          const progressColor = getProgressColor(progress)
          const statusColor = getStatusColor(ac.status)
          const daysRemainingText = ac.days_remaining < 0
            ? `${Math.abs(ac.days_remaining)} days overdue`
            : `${ac.days_remaining} days remaining`

          return (
            <Link href={`/aircraft/${ac.aircraft_reg}`} key={ac.id}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">✈️</div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">
                          {ac.aircraft_reg}
                        </p>
                        <p className="text-xs text-gray-500">
                          Last: {formatDate(ac.last_autoland_date)}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusColor}>
                      {ac.status}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">
                        Days remaining: {daysRemainingText}
                      </span>
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round(progress)}%
                    </div>
                  </div>

                  {/* Next Due */}
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500">Next due:</span>
                    <ArrowRight className="w-4 h-4 text-vj-red ml-2" />
                    <span className="font-semibold text-gray-900 ml-2">
                      {formatDate(ac.next_required_date)}
                    </span>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button className="flex-1 text-xs text-vj-red hover:underline py-2">
                      View Details
                    </button>
                    <button className="flex-1 text-xs text-vj-red hover:underline py-2">
                      History
                    </button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

