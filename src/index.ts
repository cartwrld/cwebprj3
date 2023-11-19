import * as express from 'express'
import * as bodyParser from 'body-parser'
import { AppDataSource } from './data-source'
import { UserController } from './controller/UserController'
import * as createError from 'http-errors'
import { RouteDefinition } from './decorator/RouteDefinition'
import * as cors from 'cors'
import PokemonController from './controller/PokemonController'
import PokeTeamController from './controller/PokeTeamController'
import fetch from 'axios'
import { Pokemon } from './entity/Pokemon'
import { PokeTeam } from './entity/PokeTeam'

const port = 3004

// cors options
const corsOptions = {
  origin: /localhost:\d{4,5}$/i, // localhost any 4 or 5  digit port
  credentials: true, // needed to set and return cookies
  allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization',
  methods: 'GET,PUT,POST,DELETE',
  maxAge: 43200 // 12 hours
}

AppDataSource.initialize().then(async () => {
  // create express app
  const app = express()
  app.use(bodyParser.json())

  app.use(cors(corsOptions))

  // add handler for pre-flight options request to ANY path
  app.options('*', cors(corsOptions))

  // Iterate over all our controllers and register our routes
  const controllers: any[] = [UserController, PokemonController, PokeTeamController]
  controllers.forEach((controller) => {
    // This is our instantiated class
    // eslint-disable-next-line new-cap
    const instance = new controller()
    // The prefix saved to our controller
    const path = Reflect.getMetadata('path', controller)
    // Our `routes` array containing all our routes for this controller
    const routes: RouteDefinition[] = Reflect.getMetadata('routes', controller)

    // Iterate over all routes and register them to our express application
    routes.forEach((route) => {
      // eslint-disable-next-line max-len
      app[route.method.toLowerCase()](path + route.param, (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const result = instance[route.action](req, res, next)
        if (result instanceof Promise) {
          result.then((result) => result !== null && result !== undefined ? res.send(result) : next())
            .catch((err) => next(createError(500, err)))
        } else if (result !== null && result !== undefined) res.json(result)
      })
    })
  })

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404))
  })

  // error handler
  app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    res.json({ status: err.status, message: err.message, stack: err.stack.split(/\s{4,}/) })
  })

  // start express server
  app.listen(port)

  async function fetchPokemonForDB (): Promise<void> {
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

  const pokeTeamObj = {
    teamName: 'Ash Ketchum OGs',
    poke1: 25,
    poke2: 12,
    poke3: 18,
    poke4: 1,
    poke5: 6,
    poke6: 7
  }

  // adding premade item to the db
  await AppDataSource.manager.save(
    // create an entry in PokeTeam table, based on the pokeTeamObj
    AppDataSource.manager.create(PokeTeam, pokeTeamObj)
  )

  // await fetchPokemonForDB() // <----- don't uncomment, will add 1144 rows to the db

  console.log('Open http://localhost:' + port + '/users to see results')
  console.log('Open http://localhost:' + port + '/pokemon to see results')
  console.log('Open http://localhost:' + port + '/poketeam to see results')
}).catch(error => console.log(error))
