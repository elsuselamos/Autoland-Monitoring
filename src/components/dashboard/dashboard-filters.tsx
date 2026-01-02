"use client"

import { useEffect, useState } from "react"
import { ReportsFilters } from "@/components/reports/reports-filters"
import type { ReportFilters } from "@/types"

interface DashboardFiltersProps {
  filters: ReportFilters
  onFiltersChange: (filters: Partial<ReportFilters>) => void
  onReset: () => void
}

export function DashboardFilters({
  filters,
  onFiltersChange,
  onReset,
}: DashboardFiltersProps) {
  const [availableAircraft, setAvailableAircraft] = useState<string[]>([])

  // Fetch available aircraft for filter dropdown
  useEffect(() => {
    const fetchAircraft = async () => {
      try {
        const response = await fetch("/api/aircraft?per_page=100")
        const result = await response.json()
        if (result.success) {
          const aircraftRegs = result.data.aircraft.map((ac: any) => ac.aircraft_reg)
          setAvailableAircraft(aircraftRegs)
        }
      } catch (error) {
        console.error("Error fetching aircraft list:", error)
      }
    }
    fetchAircraft()
  }, [])

  return (
    <ReportsFilters
      filters={filters}
      onFiltersChange={onFiltersChange}
      onReset={onReset}
      availableAircraft={availableAircraft}
    />
  )
}


