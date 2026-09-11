import { registerAs } from '@nestjs/config'
import { postgresConnection } from './postgres.options'

export const databaseConfig = registerAs('database', () => postgresConnection())
