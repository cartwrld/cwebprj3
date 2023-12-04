import { Like } from 'typeorm'
import { AppDataSource } from '../data-source'
import { NextFunction, Request, Response } from 'express'
import { PokeTeam } from '../entity/PokeTeam'
import { Controller } from '../decorator/Controller'
import { Route } from '../decorator/Route'
import { validate, ValidationError, ValidatorOptions } from 'class-validator'
import { Authenticate } from '../utils/AuthUtils'

const auth = new Authenticate()

/**
 * Controller for the poketeam routes
 */
@Controller('/poketeam')
export default class PokeTeamController {
  private readonly pokeTeamRepo = AppDataSource.getRepository(PokeTeam)

  private readonly validOptions: ValidatorOptions = {
    stopAtFirstError: true,
    skipMissingProperties: false,
    validationError: { target: false, value: false }
  }

  /**
   * This function ensures the user is authorized to retrieve entries, as well as retrieves
   * PokeTeam data from the database when a GET request is made. It handles user authorization
   * and returns either a single PokeTeam or a list of PokeTeams based on the request.
   *
   * @param req {Request} the request
   * @param res {Response} the response
   * @returns {Promise<PokeTeam | PokeTeam[]>} a PokeTeam or array of PokeTeams.
   */
  @Route('get', '/:teamID*?')
  async read (req: Request, res: Response): Promise<PokeTeam | PokeTeam[]> {
    if (await auth.generalAuth(req, res)) {
      if (req.params.teamID) {
        return await this.pokeTeamRepo.findOneBy({ teamID: req.params.teamID })
      }
      const findOptions: any = { order: {} } // prepare order and where props
      const existingFields = this.pokeTeamRepo.metadata.ownColumns.map((col) => col.propertyName)

      const sortField: string = existingFields.includes(req.query.sortby) ? req.query.sortby : 'teamID'
      findOptions.order[sortField] = req.query.reverse ? 'DESC' : 'ASC'
      // findOption looks like { order{ phone: 'DESC' } }
      if (req.query.searchwherelike) {
        findOptions.where = []
        existingFields.forEach((column) => {
          findOptions.where.push({ [column]: Like('%' + req.query.searchwherelike + '%') })
        })
      }
      return await this.pokeTeamRepo.find(findOptions)
    }
  }

  /**
   * This function is responsible ensuring the user is authorized to create entries, as well
   * as creating a new PokeTeam entry in the database when a POST request containing
   * details for a PokeTeam is made.
   *
   * @param req {Request} the request
   * @param res {Response} the response
   * @returns {Promise<PokeTeam | ValidationError[]>
   */
  @Route('post')
  async create (req: Request, res: Response): Promise<PokeTeam | ValidationError[]> {
    await auth.actionAuth(req, res, 'post')

    const newPokeTeam = Object.assign(new PokeTeam(), req.body)
    const violations = await validate(newPokeTeam, this.validOptions)
    if (violations.length) {
      res.statusCode = 422 // Unprocessable Entity
      return violations
    } else {
      return await this.pokeTeamRepo.save(newPokeTeam)
    }
  }

  /**
   * This function is responsible for ensuring the user is authorized to update entries, as well
   * as updating a PokeTeam entry in the database when a PUT request containing
   * updated details for a PokeTeam is made.
   *
   * @param req {Request} the request
   * @param res {Response} the response
   * @param next {NextFunction} the next function
   * @returns {Promise<PokeTeam | ValidationError[]>} either your updated PokeTeam or a list of validation errors
   */
  @Route('put', '/:teamID')
  async update (req: Request, res: Response, next: NextFunction): Promise<PokeTeam | ValidationError[]> {
    await auth.actionAuth(req, res, 'put')

    const pokeTeamToUpdate = await this.pokeTeamRepo.preload(req.body)
    if (!pokeTeamToUpdate || pokeTeamToUpdate.teamID.toString() !== req.params.teamID) next()
    else {
      const violations = await validate(pokeTeamToUpdate, this.validOptions)
      if (violations.length) {
        res.statusCode = 422 // Unprocessable Entity
        return violations
      }
      return await this.pokeTeamRepo.save(pokeTeamToUpdate)
    }
  }

  /**
   * This function is responsible for ensuring the user is authorized to delete entries, as well
   * as removing a PokeTeam entry from the database when a DELETE request targeting
   * a specific PokeTeam is made.
   *

   * @returns {Promise<PokeTeam | ValidationError[]>} either your deleted PokeTeam or a list of validation errors.
   */
  @Route('delete', '/:teamID')
  async delete (req: Request, res: Response, next: NextFunction): Promise<PokeTeam> {
    await auth.actionAuth(req, res, 'delete')

    const pokeTeamToRemove = await this.pokeTeamRepo.findOneBy({ teamID: req.params.teamID })
    // res.statusCode = 204 --No Content - browser will complain since we are actually returning content
    if (pokeTeamToRemove) return await this.pokeTeamRepo.remove(pokeTeamToRemove)
    else next()
  }
}
