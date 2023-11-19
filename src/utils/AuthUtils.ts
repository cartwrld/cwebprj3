import { Request, Response } from 'express'
import { AppDataSource } from '../data-source'
import { User } from '../entity/User'
export class Authenticate {
  private readonly userRepo = AppDataSource.getRepository(User)

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

    this.fancifyString(req, user)

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

  private fancifyString (req, u): void {
    console.log('\nUsername |  Method  | Access Lvl  ')
    console.log('---------|----------|-------------')
    console.log(`${u.username}\t |   ${req.method}   |   ${u.accessLevel}`)
    console.log('---------|----------|-------------')
  }
}
