"use client"

import { useState, useEffect } from "react"
import { DashboardStats } from "@/types"

interface UseDashboardDataReturn {
  stats: DashboardStats | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useDashboardData(): UseDashboardDataReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/dashboard/stats")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch dashboard stats")
      }

      setStats(result.data)
    } catch (err) {
      console.error("Error fetching dashboard stats:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh based on settings (default: 60 seconds)
  useEffect(() => {
    fetchData()

    const interval = setInterval(() => {
      fetchData()
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [])

  const refetch = () => {
    fetchData()
  }

  return {
    stats,
    isLoading,
    error,
    refetch,
  }
}


