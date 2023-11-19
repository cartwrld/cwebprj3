import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from 'typeorm'
import { IsIn, IsNotEmpty, Length } from 'class-validator'

@Entity()
export class User {
  @PrimaryColumn({ type: 'nvarchar', length: 20 })
  @Length(1, 20, { message: 'Username must be from $constraint1 to $constraint2 characters' })
  @IsNotEmpty({ message: 'Username is required' })
    username: string

  @Column({ type: 'nvarchar', length: 50, nullable: false })
  @Length(1, 50, { message: 'Password must be from $constraint1 to $constraint2 characters' })
  @IsNotEmpty({ message: 'Password is required' })
    password: string

  @Column({ type: 'nvarchar', nullable: false })
  @IsNotEmpty({ message: 'You are not have privileges to perform this action!' })
    authtoken: string

  @Column({ type: 'nvarchar', length: 20 })
  @IsIn(['admin', 'trainer'])
  @IsNotEmpty({ message: 'Role is required' })
    role: string // This field represents the user's role (e.g., 'admin', 'pokeuser')
}
