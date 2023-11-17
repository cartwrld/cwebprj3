import { Like } from 'typeorm'
import { AppDataSource } from '../data-source'
import { NextFunction, Request, Response } from 'express'
import { PokeTeam } from '../entity/PokeTeam'
import { Controller } from '../decorator/Controller'
import { Route } from '../decorator/Route'
import { validate, ValidationError, ValidatorOptions } from 'class-validator'

@Controller('/poketeam')
export default class PokeTeamController {
  private readonly pokeTeamRepo = AppDataSource.getRepository(PokeTeam)

  // https://github.com/typestack/class-validator#passing-options
  private readonly validOptions: ValidatorOptions = {
    stopAtFirstError: true,
    skipMissingProperties: false,
    validationError: { target: false, value: false }
  }

  @Route('get', '/:teamID*?') // the *? makes the param optional - see https://expressjs.com/en/guide/routing.html#route-paramters
  async read (req: Request, res: Response, next: NextFunction): Promise<PokeTeam | PokeTeam[]> {
    if (req.params.teamID) return await this.pokeTeamRepo.findOneBy({ teamID: req.params.teamID })
    else {
      const findOptions: any = { order: {} } // prepare order and where props
      const existingFields = this.pokeTeamRepo.metadata.ownColumns.map((col) => col.propertyName)

      // create a where clause ARRAY to eventually add to the findOptions
      // you must also use Like ('% ... %')
      // only add it to the findOptions IF searchwherelike query string is provided

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

  @Route('delete', '/:teamID')
  async delete (req: Request, res: Response, next: NextFunction): Promise<PokeTeam> {
    const pokeTeamToRemove = await this.pokeTeamRepo.findOneBy({ teamID: req.params.teamID })
    // res.statusCode = 204 --No Content - browser will complain since we are actually returning content
    if (pokeTeamToRemove) return await this.pokeTeamRepo.remove(pokeTeamToRemove)
    else next()
  }

  @Route('post')
  async create (req: Request, res: Response, next: NextFunction): Promise<PokeTeam | ValidationError[]> {
    const newPokeTeam = Object.assign(new PokeTeam(), req.body)
    const violations = await validate(newPokeTeam, this.validOptions)
    if (violations.length) {
      res.statusCode = 422 // Unprocessable Entity
      return violations
    } else {
      return await this.pokeTeamRepo.save(newPokeTeam)
    }
  }

  @Route('put', '/:teamID')
  async update (req: Request, res: Response, next: NextFunction): Promise<PokeTeam | ValidationError[]> {
    const pokeTeamToUpdate = await this.pokeTeamRepo.preload(req.body)
    // Extra validation - ensure the id param matched the id submitted in the body
    if (!pokeTeamToUpdate || pokeTeamToUpdate.teamID.toString() !== req.params.teamID) next() // pass the buck until 404 error is sent
    else {
      const violations = await validate(pokeTeamToUpdate, this.validOptions)
      if (violations.length) {
        res.statusCode = 422 // Unprocessable Entity
        return violations
      } else {
        return await this.pokeTeamRepo.save(pokeTeamToUpdate)
      }
    }
  }

  // @Route('get', '/gen/:gen*?') // the *? makes the param optional - see https://expressjs.com/en/guide/routing.html#route-paramters
  // async read (req: Request, res: Response, next: NextFunction): Promise<PokeTeam | PokeTeam[]> {
  //   if (req.params.teamID) return await this.pokeTeamRepo.findOneBy({ teamID: req.params.teamID })
  //   else {
  //     const findOptions: any = { order: {} } // prepare order and where props
  //     const existingFields = this.pokeTeamRepo.metadata.ownColumns.map((col) => col.propertyName)
  //
  //     // create a where clause ARRAY to eventually add to the findOptions
  //     // you must also use Like ('% ... %')
  //     // only add it to the findOptions IF searchwherelike query string is provided
  //
  //     const sortField: string = existingFields.includes(req.query.sortby) ? req.query.sortby : 'teamID'
  //     findOptions.order[sortField] = req.query.reverse ? 'DESC' : 'ASC'
  //     // findOption looks like { order{ phone: 'DESC' } }
  //     if (req.query.searchwherelike) {
  //       findOptions.where = []
  //       existingFields.forEach((column) => {
  //         findOptions.where.push({ [column]: Like('%' + req.query.searchwherelike + '%') })
  //       })
  //     }
  //     return await this.pokeTeamRepo.find(findOptions)
  //   }
  // }
}
