import { Suspense } from "react"
import { SuccessRateCard } from "@/components/dashboard/success-rate-card"
import { CombinedStatsCards } from "@/components/dashboard/combined-stats-cards"
import { DashboardReportsSection } from "@/components/dashboard/dashboard-reports-section"
import { SuccessRateChart } from "@/components/dashboard/success-rate-chart"
import { AlertQueue } from "@/components/dashboard/alert-queue"
import { RecentAutolands } from "@/components/dashboard/recent-autolands"
import { AircraftDistributionChart } from "@/components/dashboard/aircraft-distribution-chart"

export const metadata = {
  title: "Dashboard - Autoland Monitoring",
  description: "Tổng quan giám sát tình trạng autoland của đội tàu bay VietJet",
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            📊 Dashboard Autoland
          </h1>
          <p className="mt-1 text-gray-600">
            Tổng quan giám sát tình trạng autoland của đội tàu bay VietJet
          </p>
        </div>

        {/* Success Rate Card + Combined Stats Cards on same row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
          {/* Success Rate Card - Takes 1 column (Left) */}
          <div className="lg:col-span-1 flex">
            <Suspense fallback={<div className="w-full">Loading success rate...</div>}>
              <div className="w-full">
                <SuccessRateCard />
              </div>
            </Suspense>
          </div>

          {/* Combined Stats Cards (8 cards in 2x4 grid) - Takes 3 columns (Right) */}
          <div className="lg:col-span-3">
            <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-4 gap-4">Loading stats...</div>}>
              <CombinedStatsCards />
            </Suspense>
          </div>
        </div>

        {/* Filters & Autoland Reports Table */}
        <Suspense fallback={<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-96">Loading reports...</div>}>
          <DashboardReportsSection />
        </Suspense>

        {/* 4 Cards Grid: No Alerts, Aircraft Distribution, Success Rate Trend, Recent Autolands */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Row 1, Col 1: Alert Queue (No Alerts) */}
          <Suspense fallback={<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 min-h-[400px]">Loading alerts...</div>}>
            <AlertQueue />
          </Suspense>

          {/* Row 1, Col 2: Aircraft Distribution */}
          <Suspense fallback={<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 min-h-[400px]">Loading chart...</div>}>
            <AircraftDistributionChart />
          </Suspense>

          {/* Row 2, Col 1: Success Rate Trend */}
          <Suspense fallback={<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 min-h-[400px]">Loading chart...</div>}>
            <SuccessRateChart height={250} />
          </Suspense>

          {/* Row 2, Col 2: Recent Autolands */}
          <Suspense fallback={<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 min-h-[400px]">Loading recent autolands...</div>}>
            <RecentAutolands limit={5} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
