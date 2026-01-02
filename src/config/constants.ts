// VietJet Colors
export const COLORS = {
  VJ_RED: '#E31837',
  VJ_RED_DARK: '#B71530',
  VJ_RED_LIGHT: '#FF5A6E',
  VJ_YELLOW: '#FFD700',
  VJ_YELLOW_DARK: '#FFAA00',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
} as const

// Autoland Business Rules
export const AUTOLAND = {
  INTERVAL_DAYS: 30,
  DEFAULT_DUE_SOON_THRESHOLD: 7,
  DEFAULT_AUTO_REFRESH_INTERVAL: 60, // seconds
} as const

// API Constants
export const API = {
  BASE_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ENDPOINTS: {
    DASHBOARD: '/api/dashboard',
    AIRCRAFT: '/api/aircraft',
    REPORTS: '/api/reports',
    FLEET: '/api/fleet',
  },
} as const

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 20,
  MAX_PER_PAGE: 100,
} as const

// Status Types
export const STATUS = {
  AIRCRAFT: {
    ON_TIME: 'ON_TIME',
    DUE_SOON: 'DUE_SOON',
    OVERDUE: 'OVERDUE',
  },
  REPORT: {
    SUCCESSFUL: 'SUCCESSFUL',
    UNSUCCESSFUL: 'UNSUCCESSFUL',
  },
  EXTRACTION: {
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    PARTIAL: 'PARTIAL',
  },
} as const

// Sort Options
export const SORT_OPTIONS = {
  AIRCRAFT: ['days_remaining', 'last_autoland_date', 'aircraft_reg'],
  REPORTS: ['date_utc', 'aircraft_reg', 'result'],
} as const

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  ISO_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss",
} as const

// Chart Colors
export const CHART_COLORS = {
  VJ_RED: '#E31837',
  VJ_RED_DARK: '#B71530',
  VJ_YELLOW: '#FFD700',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  PURPLE: '#9966FF',
  CYAN: '#4BC0C0',
  ORANGE: '#FF9F40',
  PINK: '#FF6384',
} as const

// Table Columns
export const TABLE_COLUMNS = {
  AIRCRAFT: [
    'aircraft_reg',
    'last_autoland_date',
    'next_required_date',
    'days_remaining',
    'status',
  ],
  REPORTS: [
    'report_number',
    'aircraft_reg',
    'flight_number',
    'date_utc',
    'airport',
    'result',
    'captain',
  ],
} as const

