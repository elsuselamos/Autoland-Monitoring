"use client"

import { Calendar, Search, X, Filter } from "lucide-react"
import { useState } from "react"
import type { ReportFilters } from "@/types"

interface ReportsFiltersProps {
  filters: ReportFilters
  onFiltersChange: (filters: Partial<ReportFilters>) => void
  onReset: () => void
  availableAircraft?: string[]
}

export function ReportsFilters({
  filters,
  onFiltersChange,
  onReset,
  availableAircraft = [],
}: ReportsFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleReset = () => {
    onReset()
    setShowAdvanced(false)
  }

  const hasActiveFilters = 
    filters.aircraft_reg ||
    filters.date_from ||
    filters.date_to ||
    filters.result !== "ALL" ||
    filters.status ||
    filters.search

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by flight number, airport, or captain..."
            value={filters.search || ""}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vj-red/50 focus:border-vj-red"
          />
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-vj-red text-white text-xs rounded-full px-2 py-0.5">
              Active
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          {/* Aircraft Registration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aircraft Registration
            </label>
            <select
              value={filters.aircraft_reg || ""}
              onChange={(e) => onFiltersChange({ aircraft_reg: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vj-red/50 focus:border-vj-red"
            >
              <option value="">All Aircraft</option>
              {availableAircraft.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* Result Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Result
            </label>
            <select
              value={filters.result || "ALL"}
              onChange={(e) =>
                onFiltersChange({ result: e.target.value as "ALL" | "SUCCESSFUL" | "UNSUCCESSFUL" })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vj-red/50 focus:border-vj-red"
            >
              <option value="ALL">All Results</option>
              <option value="SUCCESSFUL">Successful</option>
              <option value="UNSUCCESSFUL">Unsuccessful</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date From
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={filters.date_from || ""}
                  onChange={(e) => onFiltersChange({ date_from: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vj-red/50 focus:border-vj-red"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date To
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={filters.date_to || ""}
                  onChange={(e) => onFiltersChange({ date_to: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vj-red/50 focus:border-vj-red"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Reset Filters
              </button>
            )}
            <button
              onClick={() => setShowAdvanced(false)}
              className="px-4 py-2 bg-vj-red text-white rounded-lg hover:bg-vj-red-dark transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


