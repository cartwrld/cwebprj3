import { Like } from 'typeorm'
import { AppDataSource } from '../data-source'
import { NextFunction, Request, Response } from 'express'
import { Pokemon } from '../entity/Pokemon'
import { Controller } from '../decorator/Controller'
import { Route } from '../decorator/Route'
import { validate, ValidationError, ValidatorOptions } from 'class-validator'
import { Authenticate } from '../utils/AuthUtils'

const auth = new Authenticate()

@Controller('/pokemon')
export default class PokemonController {
  private readonly pokemonRepo = AppDataSource.getRepository(Pokemon)

  private readonly validOptions: ValidatorOptions = {
    stopAtFirstError: true,
    skipMissingProperties: false,
    validationError: { target: false, value: false }
  }

  /**
   * This function ensures the user is authorized to retrieve entries, as well as retrieves
   * Pokemon data from the database when a GET request is made. It handles user authorization
   * and returns either a single Pokemon or a list of Pokemon based on the request.
   *
   * @param req {Request} the request
   * @param res {Response} the response
   * @returns {Promise<Pokemon | Pokemon[]>} a Pokemon or array of Pokemon.
   */
  @Route('get', '/:pokeID*?')
  async read (req: Request, res: Response): Promise<Pokemon | Pokemon[]> {
    if (await auth.generalAuth(req, res)) {
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

  /**
   * This function is responsible ensuring the user is authorized to create entries, as well
   * as creating a new Pokemon entry in the database when a POST request containing
   * details for a Pokemon is made.
   *
   * @param req {Request} the request
   * @param res {Response} the response
   * @returns {Promise<Pokemon | ValidationError[]>
   */
  @Route('post')
  async create (req: Request, res: Response): Promise<Pokemon | ValidationError[]> {
    await auth.actionAuth(req, res, 'post')

    const newPokemon = Object.assign(new Pokemon(), req.body)
    const violations = await validate(newPokemon, this.validOptions)
    if (violations.length) {
      res.statusCode = 422 // Unprocessable Entity
      return violations
    } else {
      return await this.pokemonRepo.save(newPokemon)
    }
  }

  /**
   * This function is responsible for ensuring the user is authorized to update entries, as well
   * as updating a Pokemon entry in the database when a PUT request containing
   * updated details for a Pokemon is made.
   *
   * @param req {Request} the request
   * @param res {Response} the response
   * @param next {NextFunction} the next function
   * @returns {Promise<Pokemon | ValidationError[]>} either your updated Pokemon or a list of validation errors
   */
  @Route('put', '/:pokeID')
  async update (req: Request, res: Response, next: NextFunction): Promise<Pokemon | ValidationError[]> {
    await auth.actionAuth(req, res, 'put')

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

  /**
   * This function is responsible for ensuring the user is authorized to delete entries, as well
   * as removing a Pokemon entry from the database when a DELETE request targeting
   * a specific Pokemon is made.
   *
   * @param req {Request} the request
   * @param res {Response} the response
   * @param next {NextFunction} the next function
   * @returns {Promise<Pokemon | ValidationError[]>} either your deleted Pokemon or a list of validation errors.
   */
  @Route('delete', '/:pokeID')
  async delete (req: Request, res: Response, next: NextFunction): Promise<Pokemon> {
    await auth.actionAuth(req, res, 'delete')

    const pokemonToRemove = await this.pokemonRepo.findOneBy({ pokeID: req.params.pokeID })
    // res.statusCode = 204 --No Content - browser will complain since we are actually returning content
    if (pokemonToRemove) return await this.pokemonRepo.remove(pokemonToRemove)
    else next()
  }
}
