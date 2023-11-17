import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { IsNotEmpty, IsOptional, Length, MaxLength } from 'class-validator'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  @IsOptional()
    id: number

  @Column({ type: 'nvarchar', length: 50 })
  @Length(1, 50, { message: 'First Name must be from $constraint1 to $constraint2 characters ' })
  @IsNotEmpty({ message: 'First Name is required' })
    firstName: string

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  @MaxLength(50, { message: 'Last Name can be at most $constraint1 characters' })
  @IsOptional()
    lastName: string

  @Column({ type: 'integer', width: 3 })
    age: number
}
