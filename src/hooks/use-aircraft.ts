"use client"

import { useState, useEffect } from "react"
import { Aircraft } from "@/types"

interface UseAircraftDataReturn {
  aircraft: Aircraft[]
  isLoading: boolean
  error: string | null
  pagination?: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
  refetch: () => void
}

export function useAircraftData(
  filters?: {
    status?: "ON_TIME" | "DUE_SOON" | "OVERDUE" | "ALL"
    sort_by?: "days_remaining" | "last_autoland_date" | "aircraft_reg"
    sort_order?: "asc" | "desc"
    page?: number
    per_page?: number
  }
): UseAircraftDataReturn {
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<{
    page: number
    per_page: number
    total: number
    total_pages: number
  } | undefined>(undefined)

  const buildQueryParams = () => {
    const params = new URLSearchParams()
    if (filters?.status && filters.status !== "ALL") {
      params.set("status", filters.status)
    }
    if (filters?.sort_by) {
      params.set("sort_by", filters.sort_by)
    }
    if (filters?.sort_order) {
      params.set("sort_order", filters.sort_order)
    }
    if (filters?.page) {
      params.set("page", filters.page.toString())
    }
    if (filters?.per_page) {
      params.set("per_page", filters.per_page.toString())
    }
    return params.toString()
  }

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const queryString = buildQueryParams()
      const response = await fetch(`/api/aircraft?${queryString}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch aircraft list")
      }

      setAircraft(result.data.aircraft || [])
      setPagination(result.data.pagination)
    } catch (err) {
      console.error("Error fetching aircraft list:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data on mount and filter changes
  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.status, filters?.sort_by, filters?.sort_order, filters?.page, filters?.per_page])

  const refetch = () => {
    fetchData()
  }

  return {
    aircraft,
    isLoading,
    error,
    pagination,
    refetch,
  }
}

