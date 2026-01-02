"use client"

import { useState, useEffect, useCallback } from "react"
import type { AutolandReport } from "@/types"

interface UseRecentAutolandsDataReturn {
  autolands: AutolandReport[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

interface UseRecentAutolandsDataOptions {
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export function useRecentAutolandsData(
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  search?: string,
  aircraftReg?: string,
  dateFrom?: string,
  dateTo?: string,
  result?: string
): UseRecentAutolandsDataReturn {
  const [autolands, setAutolands] = useState<AutolandReport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set("limit", limit.toString())
      if (sortBy) {
        params.set("sort_by", sortBy)
      }
      if (sortOrder) {
        params.set("sort_order", sortOrder)
      }
      if (search) {
        params.set("search", search)
      }
      if (aircraftReg) {
        params.set("aircraft_reg", aircraftReg)
      }
      if (dateFrom) {
        params.set("date_from", dateFrom)
      }
      if (dateTo) {
        params.set("date_to", dateTo)
      }
      if (result && result !== "ALL") {
        params.set("result", result)
      }

      const response = await fetch(`/api/dashboard/autolands/recent?${params.toString()}`)
      const responseData = await response.json()

      if (!responseData.success) {
        throw new Error(responseData.error || "Failed to fetch recent autolands")
      }

      setAutolands(responseData.data)
    } catch (err) {
      console.error("Error fetching recent autolands:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [limit, sortBy, sortOrder, search, aircraftReg, dateFrom, dateTo, result])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = () => {
    fetchData()
  }

  return {
    autolands,
    isLoading,
    error,
    refetch,
  }
}

