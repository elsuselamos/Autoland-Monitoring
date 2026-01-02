// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.DB_HOST = 'localhost'
process.env.DB_PORT = '5432'
process.env.DB_NAME = 'autoland_test'
process.env.DB_USER = 'test_user'
process.env.DB_PASSWORD = 'test_password'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname() => '/',
  useSearchParams() => new URLSearchParams(),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />,
  Filter: () => <svg data-testid="filter-icon" />,
  RefreshCw: () => <svg data-testid="refresh-icon" />,
  Plane: () => <svg data-testid="plane-icon" />,
  Clock: () => <svg data-testid="clock-icon" />,
  AlertTriangle: () => <svg data-testid="alert-icon" />,
  CheckCircle2: () => <svg data-testid="check-icon" />,
  XCircle: () => <svg data-testid="x-icon" />,
  FileText: () => <svg data-testid="file-icon" />,
  ArrowRight: () => <svg data-testid="arrow-icon" />,
  ArrowUp: () => <svg data-testid="arrow-up-icon" />,
  ArrowDown: () => <svg data-testid="arrow-down-icon" />,
  Download: () => <svg data-testid="download-icon" />,
  Activity: () => <svg data-testid="activity-icon" />,
  TrendingUp: () => <svg data-testid="trending-up-icon" />,
  TrendingDown: () => <svg data-testid="trending-down-icon" />,
  X: () => <svg data-testid="x-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  ExternalLink: () => <svg data-testid="external-link-icon" />,
}))


