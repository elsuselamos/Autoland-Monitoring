"use client"

import { useState, useEffect } from "react"
import { DashboardFilters } from "./dashboard-filters"
import { AutolandReportsTable } from "./autoland-reports-table"
import { ReportsQuickStats } from "./reports-quick-stats"
import { ReportDetailModal } from "@/components/reports/report-detail-modal"
import type { ReportFilters, AutolandReport } from "@/types"

export function DashboardReportsSection() {
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

  const [selectedReport, setSelectedReport] = useState<AutolandReport | null>(null)
  const [sortBy, setSortBy] = useState<string>("date_utc")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const handleResetFilters = () => {
    setFilters({
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
    setSortBy("date_utc")
    setSortOrder("desc")
  }

  const handleViewDetail = (report: AutolandReport) => {
    setSelectedReport(report)
  }

  const handleCloseModal = () => {
    setSelectedReport(null)
  }

  const handleSort = (field: string, order: "asc" | "desc") => {
    setSortBy(field)
    setSortOrder(order)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <DashboardFilters
        filters={filters}
        onFiltersChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
        onReset={handleResetFilters}
      />

      {/* Reports Table */}
      <AutolandReportsTable 
        onViewDetail={handleViewDetail}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        search={filters.search || ""}
        aircraftReg={filters.aircraft_reg || ""}
        dateFrom={filters.date_from || ""}
        dateTo={filters.date_to || ""}
        result={filters.result || "ALL"}
      />

      {/* Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          isOpen={!!selectedReport}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

