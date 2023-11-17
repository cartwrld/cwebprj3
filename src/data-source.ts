import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { User } from './entity/User'
import { Pokemon } from './entity/Pokemon'
import { PokeTeam } from './entity/PokeTeam'

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: 'sqlite.db',
  synchronize: true,
  logging: false,
  entities: [User, Pokemon, PokeTeam],
  migrations: [],
  subscribers: []
})
