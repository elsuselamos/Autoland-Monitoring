import { GET } from '@/app/api/dashboard/stats/route'
import { NextResponse } from 'next/server'

// Mock database
jest.mock('@/lib/db', () => ({
  db: {
    query: jest.fn(),
  },
}))

jest.mock('@/lib/api', () => ({
  successResponse: jest.fn((data) => ({ success: true, data })),
  errorResponse: jest.fn((error, status) => ({ success: false, error, status })),
}))

describe('GET /api/dashboard/stats', () => {
  let mockDbQuery: jest.Mock

  beforeEach(() => {
    mockDbQuery = require('@/lib/db').db.query as jest.Mock
    mockDbQuery.mockClear()
  })

  it('should return dashboard stats successfully', async () => {
    // Mock database responses
    mockDbQuery
      .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // total aircraft
      .mockResolvedValueOnce({ rows: [{ count: '2' }] })  // overdue count
      .mockResolvedValueOnce({ rows: [{ count: '3' }] })  // due soon count
      .mockResolvedValueOnce({ rows: [{ success_rate: '95.5' }] }) // success rate

    const response = await GET()

    expect(mockDbQuery).toHaveBeenCalledTimes(4)
    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.totalAircraft).toBe(10)
    expect(data.data.overdueCount).toBe(2)
    expect(data.data.dueSoonCount).toBe(3)
    expect(data.data.successRate).toBe(95.5)
  })

  it('should handle database errors', async () => {
    mockDbQuery.mockRejectedValue(new Error('Database connection failed'))

    const response = await GET()

    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to fetch dashboard stats')
  })

  it('should calculate on time count correctly', async () => {
    mockDbQuery
      .mockResolvedValueOnce({ rows: [{ count: '10' }] })
      .mockResolvedValueOnce({ rows: [{ count: '2' }] })
      .mockResolvedValueOnce({ rows: [{ count: '3' }] })
      .mockResolvedValueOnce({ rows: [{ success_rate: '95.5' }] })

    const response = await GET()
    const data = await response.json()

    expect(data.data.onTimeCount).toBe(5) // 10 - 2 - 3
  })
})


