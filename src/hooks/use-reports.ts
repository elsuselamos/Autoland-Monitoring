"use client"

import { useState, useEffect } from "react"
import type { AutolandReport, ReportFilters } from "@/types"

interface UseReportsDataReturn {
  reports: AutolandReport[]
  isLoading: boolean
  error: string | null
  pagination?: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
  filters: ReportFilters
  setFilters: (filters: Partial<ReportFilters>) => void
  refetch: () => void
}

export function useReportsData(initialFilters: ReportFilters = {}): UseReportsDataReturn {
  const [reports, setReports] = useState<AutolandReport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<{
    page: number
    per_page: number
    total: number
    total_pages: number
  } | undefined>(undefined)
  const [filters, setFiltersState] = useState<ReportFilters>({
    aircraft_reg: "",
    date_from: "",
    date_to: "",
    result: "ALL",
    status: "",
    search: "",
    ...initialFilters,
  })

  const buildQueryParams = () => {
    const params = new URLSearchParams()

    if (filters.aircraft_reg) params.set("aircraft_reg", filters.aircraft_reg)
    if (filters.date_from) params.set("date_from", filters.date_from)
    if (filters.date_to) params.set("date_to", filters.date_to)
    if (filters.result && filters.result !== "ALL") params.set("result", filters.result)
    if (filters.status) params.set("status", filters.status)
    if (filters.search) params.set("search", filters.search)
    if (filters.page) params.set("page", filters.page.toString())
    if (filters.per_page) params.set("per_page", filters.per_page.toString())
    if (filters.sort_by) params.set("sort_by", filters.sort_by)
    if (filters.sort_order) params.set("sort_order", filters.sort_order)

    return params.toString()
  }

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const queryString = buildQueryParams()
      const response = await fetch(`/api/reports?${queryString}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch reports")
      }

      setReports(result.data.reports || [])
      setPagination(result.data.pagination)
    } catch (err) {
      console.error("Error fetching reports:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data on mount and filter changes
  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.aircraft_reg,
    filters.date_from,
    filters.date_to,
    filters.result,
    filters.status,
    filters.search,
    filters.page,
    filters.per_page,
    filters.sort_by,
    filters.sort_order,
  ])

  const setFilters = (newFilters: Partial<ReportFilters>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change (unless explicitly setting page)
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }))
  }

  const refetch = () => {
    fetchData()
  }

  return {
    reports,
    isLoading,
    error,
    pagination,
    filters,
    setFilters,
    refetch,
  }
}

