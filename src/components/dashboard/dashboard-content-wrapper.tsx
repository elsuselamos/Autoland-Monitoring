"use client"

import { useState } from "react"
import { CombinedStatsCards } from "./combined-stats-cards"
import { DashboardReportsSection } from "./dashboard-reports-section"
import type { ReportFilters } from "@/types"

export function DashboardContentWrapper() {
  const [filters, setFilters] = useState<ReportFilters>({
    aircraft_reg: "",
    date_from: "",
    date_to: "",
    result: "ALL",
    status: "",
    search: "",
    page: 1,
    per_page: 20,
    sort_by: "date_utc",
    sort_order: "desc",
  })

  return (
    <div className="space-y-4">
      {/* Combined Stats Cards (2 rows x 4 columns) */}
      <CombinedStatsCards
        search={filters.search || ""}
        aircraftReg={filters.aircraft_reg || ""}
        dateFrom={filters.date_from || ""}
        dateTo={filters.date_to || ""}
        result={filters.result || "ALL"}
      />

      {/* Dashboard Reports Section (Filters & Table) */}
      <DashboardReportsSection />
    </div>
  )
}


