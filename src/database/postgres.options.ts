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
  const databaseUrl = process.env.DATABASE_URL
  const dbHost = process.env.DB_HOST
  const isProd = process.env.NODE_ENV === 'production'

  if (isProd && !databaseUrl && (!dbHost || dbHost === 'localhost')) {
    throw new Error(
      'DATABASE_URL is missing. On Render, add the Postgres Internal Database URL to this Web Service (Environment), set NODE_ENV=production, use Build "npm install && npm run build" and Start "npm run migration:run:prod && npm run start:prod". Do not run migrations in the Build Command.',
    )
  }

  const useSsl = process.env.DB_SSL === 'true' || (isProd && process.env.DB_SSL !== 'false')
  const ssl: PostgresSsl = useSsl ? { rejectUnauthorized: false } : false

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
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
