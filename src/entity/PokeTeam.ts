import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { IsOptional, Length, IsPositive } from 'class-validator'

@Entity()
export class PokeTeam {
  @PrimaryGeneratedColumn()
  @IsOptional()
    teamID: number

  @Column('nvarchar', { length: 35, nullable: false })
  @Length(1, 50, { message: 'Team Name must be from $constraint1 to $constraint2 characters' })
    teamName: string

  @Column('int', { nullable: false })
  @IsPositive({ message: 'Team ID is must be a positive number!' })
    poke1: number

  @Column('int', { nullable: true })
  @IsPositive({ message: 'Pokemon ID must be a positive number!' })
    poke2: number

  @Column('int', { nullable: true })
  @IsPositive({ message: 'Pokemon ID must be a positive number!' })
    poke3: number

  @Column('int', { nullable: true })
  @IsPositive({ message: 'Pokemon ID must be a positive number!' })
    poke4: number

  @Column('int', { nullable: true })
  @IsPositive({ message: 'Pokemon ID must be a positive number!' })
    poke5: number

  @Column('int', { nullable: true })
  @IsPositive({ message: 'Pokemon ID must be a positive number!' })
    poke6: number
}
