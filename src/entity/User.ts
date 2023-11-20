import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { IsNotEmpty, IsOptional, Length } from 'class-validator'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  @IsOptional()
    id: number

  @Column({ type: 'nvarchar', length: 50 })
  @Length(1, 50, { message: 'Username must be from $constraint1 to $constraint2 characters ' })
  @IsNotEmpty({ message: 'Username is required' })
    username: string

  @Column({ type: 'nvarchar', length: 50 })
  @IsNotEmpty({ message: 'Token is required' })
    token: string

  @Column({ type: 'nvarchar', length: 50 })
  @IsNotEmpty({ message: 'Access Level is required' })
    accessLevel: string
}
