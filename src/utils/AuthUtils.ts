import { Request, Response } from 'express'
import { AppDataSource } from '../data-source'
import { User } from '../entity/User'

/**
 * Used for authenticating the user requesting pokemon/poketeam CRUD operations.
 */
export class Authenticate {
  private readonly userRepo = AppDataSource.getRepository(User)

  /**
   * This function is specifically for GET requests, since GET's can be performed
   * by any level of authenticated user.
   *
   * @param req {Request} the request
   * @param res {Response} the response
   * @returns {User} the user if they have a valid token, else a 401 error   */
  async generalAuth (req: Request, res: Response): Promise<User> {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    let user = new User()

    if (token) {
      user = await this.userRepo.findOneBy({ token })
      if (!user) return res.status(401).json({ error: 'token does not exist' })
    } else return res.status(401).json({ error: 'token does not exist' })

    this.fancifyString(req, user)

    return user
  }

  /**
   * This function handles the authorization check for the following requests:
   *     POST, PUT, DELETE.
   * It validates user authentication and checks if the user's access level meets
   * the requirements for the specified action.
   * Returns a 401 error if the user's access level is insufficient.
   *
   * @param req {Request} the request
   * @param res {Response} the response
   * @param method {string} either post, put, or delete
   * @returns {Promise<User>} the user if they have a valid access level, else a 401 error
   */
  async actionAuth (req: Request, res: Response, method: string): Promise<User> {
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

  /**
   * Creates a table that is printed to the console to display which information
   * after each request is made. It displays the username, request method, and
   * the access level of the user who initiated the request.
   *
   * @param req {Request}
   * @param user {User}
   * @private
   */
  private fancifyString (req, user): void {
    console.log('\nUsername |  Method  | Access Lvl  ')
    console.log('---------|----------|-------------')
    console.log(`${user.username}\t |   ${req.method}   |   ${user.accessLevel}`)
    console.log('---------|----------|-------------')
  }
}
