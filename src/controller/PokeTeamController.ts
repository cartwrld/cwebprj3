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

  private readonly validOptions: ValidatorOptions = {
    stopAtFirstError: true,
    skipMissingProperties: false,
    validationError: { target: false, value: false }
  }

  async generalAuth (req: Request, res: Response): Promise<User> {
    const token = req.header('Authorization')?.replace('Bearer ', '')

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

  @Route('get', '/:teamID*?')
  async read (req: Request, res: Response, next: NextFunction): Promise<PokeTeam | PokeTeam[]> {
    if (await this.generalAuth(req, res)) {
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

  @Route('post')
  async create (req: Request, res: Response, next: NextFunction): Promise<PokeTeam | ValidationError[]> {
    await this.actionAuth(req, res, 'post')

    const newPokeTeam = Object.assign(new PokeTeam(), req.body)
    const violations = await validate(newPokeTeam, this.validOptions)
    if (violations.length) {
      res.statusCode = 422 // Unprocessable Entity
      return violations
    } else {
      return await this.pokeTeamRepo.save(newPokeTeam)
    }
  }

  @Route('delete', '/:teamID')
  async delete (req: Request, res: Response, next: NextFunction): Promise<PokeTeam> {
    await this.actionAuth(req, res, 'delete')

    const pokeTeamToRemove = await this.pokeTeamRepo.findOneBy({ teamID: req.params.teamID })
    // res.statusCode = 204 --No Content - browser will complain since we are actually returning content
    if (pokeTeamToRemove) return await this.pokeTeamRepo.remove(pokeTeamToRemove)
    else next()
  }

  @Route('put', '/:teamID')
  async update (req: Request, res: Response, next: NextFunction): Promise<PokeTeam | ValidationError[]> {
    await this.actionAuth(req, res, 'put')

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
}
