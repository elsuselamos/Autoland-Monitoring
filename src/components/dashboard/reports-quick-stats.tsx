"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, AlertTriangle, Download } from "lucide-react"
import { useRecentAutolandsData } from "@/hooks/use-recent-autolands"

interface ReportsQuickStatsProps {
  search?: string
  aircraftReg?: string
  dateFrom?: string
  dateTo?: string
  result?: string
}

export function ReportsQuickStats({
  search = "",
  aircraftReg = "",
  dateFrom = "",
  dateTo = "",
  result = "ALL"
}: ReportsQuickStatsProps) {
  const { autolands, isLoading } = useRecentAutolandsData(
    100, // Get more data for accurate stats
    "date_utc",
    "desc",
    search || undefined,
    aircraftReg || undefined,
    dateFrom || undefined,
    dateTo || undefined,
    result
  )

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Calculate statistics
  const totalReports = autolands.length
  const successfulReports = autolands.filter((r) => r.result === "SUCCESSFUL").length
  const unsuccessfulReports = autolands.filter((r) => r.result === "UNSUCCESSFUL").length
  const successRate = totalReports > 0 ? ((successfulReports / totalReports) * 100).toFixed(1) : "0.0"
  const totalPages = Math.ceil(totalReports / 10) // Assuming 10 per page
  const currentPage = 1 // Default to page 1 for dashboard

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-white border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Total Reports</div>
              <div className="text-2xl font-bold text-gray-900">
                {totalReports}
              </div>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Successful</div>
              <div className="text-2xl font-bold text-success">
                {successfulReports}
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700">
              {successRate}%
            </Badge>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Unsuccessful</div>
              <div className="text-2xl font-bold text-vj-red">
                {unsuccessfulReports}
              </div>
            </div>
            <AlertTriangle className="w-8 h-8 text-vj-red" />
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Results</div>
              <div className="text-2xl font-bold text-gray-900">
                {totalReports}
              </div>
            </div>
            <Download className="w-8 h-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


