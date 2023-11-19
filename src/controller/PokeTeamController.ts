import { Like } from 'typeorm'
import { AppDataSource } from '../data-source'
import { NextFunction, Request, Response } from 'express'
import { PokeTeam } from '../entity/PokeTeam'
import { Controller } from '../decorator/Controller'
import { Route } from '../decorator/Route'
import { validate, ValidationError, ValidatorOptions } from 'class-validator'
import { User } from '../entity/User'

@Controller('/poketeam')
export default class PokeTeamController {
  private readonly pokeTeamRepo = AppDataSource.getRepository(PokeTeam)
  private readonly userRepo = AppDataSource.getRepository(User)

  // https://github.com/typestack/class-validator#passing-options
  private readonly validOptions: ValidatorOptions = {
    stopAtFirstError: true,
    skipMissingProperties: false,
    validationError: { target: false, value: false }
  }

  @Route('get', '/:teamID*?') // the *? makes the param optional - see https://expressjs.com/en/guide/routing.html#route-paramters
  async read (req: Request, res: Response, next: NextFunction): Promise<PokeTeam | PokeTeam[]> {
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
    const accessLevel = user.accessLevel
    const rType = req.method

    console.log('This is the user: ' + user.username)
    console.log('This is the method being requested: ' + req.method)
    console.log("This is the user's access level: " + user.accessLevel)

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
    const token = req.header('Authorization')?.replace('Bearer ', '')
    console.log('This is the token ' + token)
    let user = new User()
    if (token) { // re-assign based on token
      user = await this.userRepo.findOneBy({ token })
      if (!user) {
        return res.status(401).json({ error: 'token does not exist' })
      }
    } else {
      return res.status(401).json({ error: 'token does not exist' })
    }
    const accessLevel = user.accessLevel
    const rType = req.method
    console.log('This is the user: ' + user.username)
    console.log('This is the method being requested: ' + req.method)
    console.log("This is the user's access level: " + user.accessLevel)

    if (accessLevel !== 'ADMIN') {
      return res.status(401).json({ error: 'user does not have permission' })
    }

    const pokeTeamToRemove = await this.pokeTeamRepo.findOneBy({ teamID: req.params.teamID })
    // res.statusCode = 204 --No Content - browser will complain since we are actually returning content
    if (pokeTeamToRemove) return await this.pokeTeamRepo.remove(pokeTeamToRemove)
    else next()
  }

  @Route('post')
  async create (req: Request, res: Response, next: NextFunction): Promise<PokeTeam | ValidationError[]> {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    console.log('This is the token ' + token)
    let user = new User()
    if (token) { // re-assign based on token
      user = await this.userRepo.findOneBy({ token })
      if (!user) {
        return res.status(401).json({ error: 'token does not exist' })
      }
    } else {
      return res.status(401).json({ error: 'token does not exist' })
    }
    const accessLevel = user.accessLevel
    const rType = req.method
    console.log('This is the user: ' + user.username)
    console.log('This is the method being requested: ' + req.method)
    console.log("This is the user's access level: " + user.accessLevel)

    if (!(accessLevel === 'ADMIN' || accessLevel === 'WRITE')) {
      return res.status(401).json({ error: 'user does not have permission' })
    }

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
    const token = req.header('Authorization')?.replace('Bearer ', '')
    let user = new User()
    if (token) { // re-assign based on token
      user = await this.userRepo.findOneBy({ token })
      if (!user) {
        return res.status(401).json({ error: 'token does not exist' })
      }
    } else {
      return res.status(401).json({ error: 'token does not exist' })
    }
    const accessLevel = user.accessLevel
    const rType = req.method
    console.log('This is the user: ' + user.username)
    console.log('This is the method being requested: ' + req.method)
    console.log("This is the user's access level: " + user.accessLevel)

    if (!(accessLevel === 'ADMIN' || accessLevel === 'WRITE')) {
      return res.status(401).json({ error: 'user does not have permission' })
    }

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
