import { Like } from 'typeorm'
import { AppDataSource } from '../data-source'
import { NextFunction, Request, Response, NextFunction, Request, Response } from 'express'
import { Pokemon } from '../entity/Pokemon'
import { Controller } from '../decorator/Controller'
import { Route } from '../decorator/Route'
import { validate, ValidationError, ValidatorOptions } from 'class-validator'

@Controller('/pokemon')
export default class PokemonController {
  private readonly pokemonRepo = AppDataSource.getRepository(Pokemon)

  private readonly validOptions: ValidatorOptions = {
    stopAtFirstError: true,
    skipMissingProperties: false,
    validationError: { target: false, value: false }
  }

  @Route('get', '/:pokeID*?') // the *? makes the param optional - see https://expressjs.com/en/guide/routing.html#route-paramters
  async read (req: Request, res: Response, next: NextFunction): Promise<Pokemon | Pokemon[]> {
    if (req.params.pokeID) return await this.pokemonRepo.findOneBy({ pokeID: req.params.pokeID })
    else {
      const findOptions: any = { order: {} } // prepare order and where props
      const existingFields = this.pokemonRepo.metadata.ownColumns.map((col) => col.propertyName)

      // @ts-expect-error
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

  @Route('delete', '/:pokeID')
  async delete (req: Request, res: Response, next: NextFunction): Promise<Pokemon> {
    const pokemonToRemove = await this.pokemonRepo.findOneBy({ pokeID: req.params.pokeID })
    // res.statusCode = 204 --No Content - browser will complain since we are actually returning content
    if (pokemonToRemove) return await this.pokemonRepo.remove(pokemonToRemove)
    else next()
  }

  @Route('post')
  async create (req: Request, res: Response, next: NextFunction): Promise<Pokemon | ValidationError[]> {
    const newPokemon = Object.assign(new Pokemon(), req.body)
    const violations = await validate(newPokemon, this.validOptions)
    if (violations.length) {
      res.statusCode = 422 // Unprocessable Entity
      return violations
    } else {
      return await this.pokemonRepo.save(newPokemon)
    }
  }

  @Route('put', '/:pokeID')
  async update (req: Request, res: Response, next: NextFunction): Promise<Pokemon | ValidationError[]> {
    const pokemonToUpdate = await this.pokemonRepo.preload(req.body)
    // Extra validation - ensure the id param matched the id submitted in the body
    if (!pokemonToUpdate || pokemonToUpdate.pokeID.toString() !== req.params.pokeID) next() // pass the buck until 404 error is sent
    else {
      const violations = await validate(pokemonToUpdate, this.validOptions)
      if (violations.length) {
        res.statusCode = 422 // Unprocessable Entity
        return violations
      } else {
        return await this.pokemonRepo.save(pokemonToUpdate)
      }
    }
  }
}
