import { Pool } from 'pg'

// Utilise le Connection Pooler de Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // Max 5 connexions par Lambda pour éviter l'épuisement du pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    return await client.query(text, params)
  } finally {
    client.release()
  }
}

export async function getClient() {
  return pool.connect()
}

export { pool }
