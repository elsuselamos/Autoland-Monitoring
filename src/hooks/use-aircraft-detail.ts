"use client"

import { useState, useEffect } from "react"
import { Aircraft, AutolandReport } from "@/types"

interface UseAircraftDetailDataReturn {
  aircraft: Aircraft | null
  isLoading: boolean
  error: string | null
  autolands: AutolandReport[]
  isAutolandsLoading: boolean
  autolandsError: string | null
  refetch: () => void
}

export function useAircraftDetailData(aircraftReg: string): UseAircraftDetailDataReturn {
  const [aircraft, setAircraft] = useState<Aircraft | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autolands, setAutolands] = useState<AutolandReport[]>([])
  const [isAutolandsLoading, setIsAutolandsLoading] = useState(false)
  const [autolandsError, setAutolandsError] = useState<string | null>(null)

  // Fetch aircraft detail
  const fetchAircraftDetail = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/aircraft/${aircraftReg}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch aircraft detail")
      }

      setAircraft(result.data.aircraft || null)
    } catch (err) {
      console.error("Error fetching aircraft detail:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch autoland history
  const fetchAutolands = async (limit: number = 20) => {
    setIsAutolandsLoading(true)
    setAutolandsError(null)

    try {
      const response = await fetch(`/api/aircraft/${aircraftReg}/autolands?limit=${limit}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch autoland history")
      }

      setAutolands(result.data.autolands || [])
    } catch (err) {
      console.error("Error fetching autoland history:", err)
      setAutolandsError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsAutolandsLoading(false)
    }
  }

  // Fetch data on mount
  useEffect(() => {
    if (aircraftReg) {
      fetchAircraftDetail()
      fetchAutolands(20) // Default: last 20 autolands
    }
  }, [aircraftReg])

  const refetch = () => {
    if (aircraftReg) {
      fetchAircraftDetail()
      fetchAutolands(20)
    }
  }

  return {
    aircraft,
    isLoading,
    error,
    autolands,
    isAutolandsLoading,
    autolandsError,
    refetch,
  }
}


