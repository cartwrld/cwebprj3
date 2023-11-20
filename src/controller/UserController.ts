import { AppDataSource } from '../data-source'
import { NextFunction, Request, Response } from 'express'
import { User } from '../entity/User'
import { validate } from 'class-validator'
import { Controller } from '../decorator/Controller'
import { Route } from '../decorator/Route'
import { Authenticate } from '../utils/AuthUtils'

const auth = new Authenticate()

@Controller('/users')
export class UserController {
  private readonly userRepository = AppDataSource.getRepository(User)

  /**
   * Retrieves all users from the database and requires user authentication.
   *
   * @param req {Request} the request
   * @param res {Response} the response
   * @param next {NextFunction} the next function
   */
  @Route('GET')
  async all (req: Request, res: Response, next: NextFunction): Promise<User []> {
    await auth.generalAuth(req, res)
    return await this.userRepository.find()
  }

  /**
   * Retrieves a single user by ID from the database and requires user authentication.
   *
   * @param req {Request} the request
   * @param res {Response} the response
   * @param next {NextFunction} the next function
   */
  @Route('get', '/:id')
  async one (req: Request, res: Response, next: NextFunction): Promise<User> {
    await auth.generalAuth(req, res)
    return await this.userRepository.findOneBy({ id: req.params.id })
  }

  /**
   * Saves a new user to the database after authentication and validation.
   *
   * @param req {Request} the request
   * @param res {Response} the response
   * @param next {NextFunction} the next function
   */
  @Route('post')
  async save (req: Request, res: Response, next: NextFunction): Promise<any> {
    await auth.actionAuth(req, res, 'post')

    const newUser = Object.assign(new User(), req.body)
    const violations = await validate(newUser)
    if (violations.length) { // errors exist - don't save to db - return status code and the errors
      res.statuscode = 422 // Unprocessable Entity
      return violations
    } else {
      return await this.userRepository.save(newUser)
    }
  }

  /**
   * Deletes a user by ID from the database after authentication.
   *
   * @param req {Request} the request
   * @param res {Response} the response
   * @param next {NextFunction} the next function
   */
  @Route('delete', '/:id')
  async remove (req: Request, res: Response, next: NextFunction): Promise<User> {
    await auth.actionAuth(req, res, 'delete')
    const userToRemove = await this.userRepository.findOneBy({ id: req.params.id })
    return await this.userRepository.remove(userToRemove)
  }
}
