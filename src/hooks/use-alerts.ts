"use client"

import { useState, useEffect } from "react"
import type { Aircraft } from "@/types"

interface UseAlertsDataReturn {
  alerts: Aircraft[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useAlertsData(): UseAlertsDataReturn {
  const [alerts, setAlerts] = useState<Aircraft[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/dashboard/alerts")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch alerts")
      }

      setAlerts(result.data)
    } catch (err) {
      console.error("Error fetching alerts:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh every 30 seconds
  useEffect(() => {
    fetchData()

    const interval = setInterval(() => {
      fetchData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  const refetch = () => {
    fetchData()
  }

  return {
    alerts,
    isLoading,
    error,
    refetch,
  }
}


