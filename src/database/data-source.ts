import { config } from 'dotenv'
import { DataSource } from 'typeorm'
import { postgresConnection } from './postgres.options'

config()

export default new DataSource({
  ...postgresConnection(),
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  logging: true,
})
