import { Like } from 'typeorm'
import { AppDataSource } from '../data-source'
import { NextFunction, Request, Response } from 'express'
import { Pokemon } from '../entity/Pokemon'
import { Controller } from '../decorator/Controller'
import { Route } from '../decorator/Route'
import { validate, ValidationError, ValidatorOptions } from 'class-validator'
import { User } from '../entity/User'

@Controller('/pokemon')
export default class PokemonController {
  private readonly pokemonRepo = AppDataSource.getRepository(Pokemon)
  private readonly userRepo = AppDataSource.getRepository(User)

  private readonly validOptions: ValidatorOptions = {
    stopAtFirstError: true,
    skipMissingProperties: false,
    validationError: { target: false, value: false }
  }

  async generalAuth (req: Request, res: Response): Promise<User> {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    console.log('This is the token ' + token)
    let user = new User()
    if (token) {
      user = await this.userRepo.findOneBy({ token })
      if (!user) {
        return res.status(401).json({ error: 'token does not exist' })
      }
    } else {
      return res.status(401).json({ error: 'token does not exist' })
    }
    console.log('\nUsername |  Method  | Access Lvl  ')
    console.log('---------|----------|-------------')

    console.log(`${user.username}\t |  ${req.method}\t|   ${user.accessLevel}`)

    return user
  }

  async actionAuth (req: Request, res: Response, method): Promise<User> {
    const user = await this.generalAuth(req, res)

    if (user.accessLevel === 'READ') {
      return res.status(401).json({ error: 'user does not have permission' })
    }

    switch (method) {
      case 'delete' :
        return user.accessLevel === 'ADMIN'
          ? user
          : res.status(401).json({ error: 'user does not have permission' })
      case 'post':
      case 'put' :
        return user.accessLevel === 'ADMIN' || user.accessLevel === 'WRITE'
          ? user
          : res.status(401).json({ error: 'user does not have permission' })
    }

    return user
  }

  @Route('get', '/:pokeID*?')
  async read (req: Request, res: Response, next: NextFunction): Promise<Pokemon | Pokemon[]> {
    if (await this.generalAuth(req, res)) {
      if (req.params.pokeID) {
        return await this.pokemonRepo.findOneBy({ pokeID: req.params.pokeID })
      }
      const findOptions: any = { order: {} }
      const existingFields = this.pokemonRepo.metadata.ownColumns.map((col) => col.propertyName)

      const sortField: string = existingFields.includes(req.query.sortby) ? req.query.sortby : 'pokeID'
      findOptions.order[sortField] = req.query.reverse ? 'DESC' : 'ASC'
      // findOption looks like { order{ phone: 'DESC' } }
      if (req.query.searchwherelike) {
        findOptions.where = []
        existingFields.forEach((column) => {
          findOptions.where.push({ [column]: Like('%' + req.query.searchwherelike + '%') })
        })
      }
      return await this.pokemonRepo.find(findOptions)
    }
  }

  @Route('post')
  async create (req: Request, res: Response, next: NextFunction): Promise<Pokemon | ValidationError[]> {
    await this.actionAuth(req, res, 'post')

    const newPokemon = Object.assign(new Pokemon(), req.body)
    const violations = await validate(newPokemon, this.validOptions)
    if (violations.length) {
      res.statusCode = 422 // Unprocessable Entity
      return violations
    } else {
      return await this.pokemonRepo.save(newPokemon)
    }
  }

  @Route('delete', '/:pokeID')
  async delete (req: Request, res: Response, next: NextFunction): Promise<Pokemon> {
    await this.actionAuth(req, res, 'delete')

    const pokemonToRemove = await this.pokemonRepo.findOneBy({ pokeID: req.params.pokeID })
    // res.statusCode = 204 --No Content - browser will complain since we are actually returning content
    if (pokemonToRemove) return await this.pokemonRepo.remove(pokemonToRemove)
    else next()
  }

  @Route('put', '/:pokeID')
  async update (req: Request, res: Response, next: NextFunction): Promise<Pokemon | ValidationError[]> {
    await this.actionAuth(req, res, 'put')

    const pokemonToUpdate = await this.pokemonRepo.preload(req.body)
    if (!pokemonToUpdate || pokemonToUpdate.pokeID.toString() !== req.params.pokeID) next() // pass the buck until 404 error is sent
    else {
      const violations = await validate(pokemonToUpdate, this.validOptions)
      if (violations.length) {
        res.statusCode = 422 // Unprocessable Entity
        return violations
      }
      return await this.pokemonRepo.save(pokemonToUpdate)
    }
  }
}
