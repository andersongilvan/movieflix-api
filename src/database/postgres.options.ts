type PostgresSsl = false | { rejectUnauthorized: false }

type PostgresConnection =
  | {
      type: 'postgres'
      url: string
      ssl: PostgresSsl
    }
  | {
      type: 'postgres'
      host: string
      port: number
      username: string
      password: string
      database: string
      ssl: PostgresSsl
    }

export function postgresConnection(): PostgresConnection {
  const useSsl = process.env.DB_SSL === 'true' || (process.env.NODE_ENV === 'production' && process.env.DB_SSL !== 'false')
  const ssl: PostgresSsl = useSsl ? { rejectUnauthorized: false } : false

  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl,
    }
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'db_movieflix',
    ssl,
  }
}
