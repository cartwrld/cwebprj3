import { AppDataSource } from '../data-source'
import { NextFunction, Request, Response } from 'express'
import { User } from '../entity/User'
import { validate } from 'class-validator'
import { Controller } from '../decorator/Controller'
import { Route } from '../decorator/Route'

@Controller('/users')
export class UserController {
  private readonly userRepository = AppDataSource.getRepository(User)

  @Route('GET')
  async all (req: Request, res: Response, next: NextFunction): Promise<User []> {
    return await this.userRepository.find()
  }

  @Route('get', '/:id')
  async one (req: Request, response: Response, next: NextFunction): Promise<User> {
    return await this.userRepository.findOneBy({ id: req.params.id })
  }

  // typescript - private property fully typed object
  // only show first error
  // still validate missing properties
  // hide the target and value from the error object
  // private . . .

  @Route('post')
  async save (req: Request, res: Response, next: NextFunction): Promise<any> {
    const newUser = Object.assign(new User(), req.body)
    const violations = await validate(newUser)
    if (violations.length) { // errors exist - don't save to db - return status code and the errors
      res.statuscode = 422 // Unprocessable Entity
      return violations
    } else {
      return await this.userRepository.save(newUser)
    }
  }

  @Route('delete', '/:id')
  async remove (req: Request, res: Response, next: NextFunction): Promise<User> {
    const userToRemove = await this.userRepository.findOneBy({ id: req.params.id })
    return await this.userRepository.remove(userToRemove)
  }
}
