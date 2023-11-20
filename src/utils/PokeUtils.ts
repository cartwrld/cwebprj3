import fetch from 'axios'
import { Pokemon } from '../entity/Pokemon'
import { AppDataSource } from '../data-source'
import { PokeTeam } from '../entity/PokeTeam'

/**
 * Utility class for fetching Pokemon and creating database entries
 */
export class PowerPoke {
  /**
   * This function creates an entry for each pokemon that was returned from
   * the original PokeAPI call. It fetches the main data, and then uses the main data
   * to determine what path to use the following fetch on (poke.url).
   */
  async fetchPokemonForDB (): Promise<void> {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0') // Replace with your actual API URL
    const data = response.data.results

    const collection = []

    for (const poke of data) {
      const pokeRes = await fetch(poke.url)
      const pokeData = pokeRes.data

      collection.push(new Pokemon(
        pokeData.id,
        pokeData.name,
        pokeData.types[0].type.name,
        pokeData.types.length > 1 ? pokeData.types[1].type.name : '',
        pokeData.stats[0].base_stat, // hp
        pokeData.stats[1].base_stat, // atk
        pokeData.stats[2].base_stat, // def
        pokeData.stats[3].base_stat, // spatk
        pokeData.stats[4].base_stat, // spdef
        pokeData.stats[5].base_stat, // spd
        pokeData.sprites.front_default
      ))
      console.log('Pushed ' + pokeData.name + 'to collection')
    }
    for (const pokeObj of collection) {
      await AppDataSource.manager.save(
        AppDataSource.manager.create(Pokemon, pokeObj)
      )
      console.log('Successfully added { ' + pokeObj.pokeName + ' } to database')
    }
  }

  /**
   * This function creates 7 pokemon team entries in the PokeTeam table
   * in the database. The first team is static, and is Ash Ketchums original
   * team. The other six are generated with random names from an array of 6
   * team names, and a 6 random pokemon, randomly selected by id.
   */
  async generatePokeTeamEntries (): Promise<void> {
    const pokeTeamNames = [
      'Nebula Nomads', 'Shadow Syndicate', 'Quantum Questers',
      'Phantom Phalanx', 'Rune Raiders', 'Blaze Battalion'
    ]
    const pokeTeams = []
    pokeTeams.push(new PokeTeam(1, 'Ash Ketchum OGs', 25, 12, 18, 1, 6, 7))

    // create 6 likely unique poketeams
    for (const team of pokeTeamNames) {
      const randPokes = Array.from({ length: 6 }, () => Math.floor(Math.random() * (1009 - 1) + 1))
      pokeTeams.push(new PokeTeam(
        null, team, randPokes[0], randPokes[1],
        randPokes[2], randPokes[3], randPokes[4], randPokes[5]))
    }
    // add team to db
    for (const team of pokeTeams) {
      await AppDataSource.manager.save(
        AppDataSource.manager.create(PokeTeam, team)
      )
    }
  }
}
