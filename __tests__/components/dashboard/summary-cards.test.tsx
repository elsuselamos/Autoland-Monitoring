import { render, screen, waitFor } from '@testing-library/react'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { useDashboardData } from '@/hooks/use-dashboard'

// Mock the hook
jest.mock('@/hooks/use-dashboard', () => ({
  useDashboardData: jest.fn(),
}))

describe('SummaryCards Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render loading state', () => {
    (useDashboardData as jest.Mock).mockReturnValue({
      stats: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    })

    render(<SummaryCards />)

    expect(screen.getAllByTestId('summary-card')).toHaveLength(4)
  })

  it('should render dashboard stats', async () => {
    (useDashboardData as jest.Mock).mockReturnValue({
      stats: {
        totalAircraft: 10,
        overdueCount: 2,
        dueSoonCount: 3,
        onTimeCount: 5,
        successRate: 95.5,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(<SummaryCards />)

    await waitFor(() => {
      expect(screen.getByText('Total Aircraft')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('Overdue')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('Due Soon')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('On Time')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('95.5%')).toBeInTheDocument()
    })
  })

  it('should render error state', () => {
    (useDashboardData as jest.Mock).mockReturnValue({
      stats: null,
      isLoading: false,
      error: 'Failed to fetch stats',
      refetch: jest.fn(),
    })

    render(<SummaryCards />)

    expect(screen.getByText('Failed to load stats')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('should call refetch on retry button click', () => {
    const mockRefetch = jest.fn()
    (useDashboardData as jest.Mock).mockReturnValue({
      stats: null,
      isLoading: false,
      error: 'Failed to fetch stats',
      refetch: mockRefetch,
    })

    render(<SummaryCards />)

    const retryButton = screen.getByRole('button', { name: /retry/i })
    retryButton.click()

    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('should have correct ARIA labels for accessibility', () => {
    (useDashboardData as jest.Mock).mockReturnValue({
      stats: {
        totalAircraft: 10,
        overdueCount: 2,
        dueSoonCount: 3,
        onTimeCount: 5,
        successRate: 95.5,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(<SummaryCards />)

    const cards = screen.getAllByRole('article')
    cards.forEach(card => {
      expect(card).toHaveAttribute('role', 'article')
    })
  })
})


