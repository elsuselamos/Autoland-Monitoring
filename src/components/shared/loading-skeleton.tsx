import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  variant?: "text" | "circular" | "rectangular"
}

export function LoadingSkeleton({
  className,
  variant = "rectangular",
}: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 rounded",
        variant === "circular" && "rounded-full",
        variant === "text" && "h-4 w-3/4",
        className
      )}
      role="status"
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function SummaryCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <LoadingSkeleton variant="text" className="w-20 h-4" />
          <LoadingSkeleton variant="text" className="w-24 h-8" />
        </div>
        <LoadingSkeleton variant="circular" className="w-16 h-16" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="hover:bg-gray-50">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4 whitespace-nowrap">
          <LoadingSkeleton
            variant="text"
            className={i === 0 ? "w-32" : "w-24"}
          />
        </td>
      ))}
    </tr>
  )
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number, columns?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <LoadingSkeleton variant="text" className="w-40 h-6" />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th
                  key={i}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  <LoadingSkeleton variant="text" className="w-24 h-4" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, i) => (
              <TableRowSkeleton key={i} columns={columns} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Dashboard skeletons
export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <SummaryCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <LoadingSkeleton variant="text" className="w-40 h-6 mb-4" />
      <div className="h-64">
        <LoadingSkeleton variant="rectangular" className="h-full w-full" />
      </div>
    </div>
  )
}

export function AlertQueueSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <LoadingSkeleton variant="text" className="w-32 h-6 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="rectangular" className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}

export function RecentAutolandsSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <LoadingSkeleton variant="text" className="w-32 h-6 mb-4" />
      <TableSkeleton rows={5} columns={5} />
    </div>
  )
}

// Aircraft skeletons
export function AircraftGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <LoadingSkeleton variant="text" className="w-24 h-6 mb-4" />
          <LoadingSkeleton variant="rectangular" className="h-32 w-full mb-4" />
          <LoadingSkeleton variant="text" className="w-16 h-4" />
        </div>
      ))}
    </div>
  )
}

export function AircraftDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <LoadingSkeleton variant="text" className="w-40 h-6" />
          <LoadingSkeleton variant="rectangular" className="w-24 h-8" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <LoadingSkeleton variant="text" className="w-20 h-4" />
              <LoadingSkeleton variant="text" className="w-32 h-8" />
            </div>
          ))}
        </div>
      </div>
      <ChartSkeleton />
    </div>
  )
}

export function AutolandHistoryTableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <LoadingSkeleton variant="text" className="w-40 h-6 mb-4" />
      <TableSkeleton rows={5} columns={5} />
    </div>
  )
}

export function AircraftTrendChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <LoadingSkeleton variant="text" className="w-40 h-6 mb-4" />
      <div className="h-80">
        <LoadingSkeleton variant="rectangular" className="h-full w-full" />
      </div>
    </div>
  )
}

