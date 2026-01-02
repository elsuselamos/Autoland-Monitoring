import { Pool, PoolConfig } from 'pg'

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'autoland',
  user: process.env.DB_USER || 'autoland',
  password: process.env.DB_PASSWORD || 'autoland123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

const pool = new Pool(poolConfig)

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  getClient: () => pool.connect(),
}

export default db

// Graceful shutdown - only register once to avoid memory leak warnings
// Use a global flag to prevent multiple registrations during hot reload
if (!(global as any).__dbShutdownHandlersRegistered) {
  // Increase max listeners in development to avoid warnings
  if (process.env.NODE_ENV === 'development') {
    process.setMaxListeners(20)
  }

  const gracefulShutdown = async () => {
    await pool.end()
  }

  process.once('SIGTERM', gracefulShutdown)
  process.once('SIGINT', gracefulShutdown)
  
  ;(global as any).__dbShutdownHandlersRegistered = true
}

