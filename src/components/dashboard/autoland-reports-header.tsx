"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { useRecentAutolandsData } from "@/hooks/use-recent-autolands"

export function AutolandReportsHeader() {
  const { autolands, isLoading } = useRecentAutolandsData(20)

  if (isLoading) {
    return (
      <Card className="rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>
            Autoland Reports
            <span className="ml-2 text-sm font-normal text-gray-500">
              (Loading...)
            </span>
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>
          Autoland Reports
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({autolands.length} results)
          </span>
        </CardTitle>
      </CardHeader>
    </Card>
  )
}


