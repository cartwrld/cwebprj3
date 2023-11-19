import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { IsOptional, Length, IsPositive } from 'class-validator'

@Entity()
export class PokeTeam {
  constructor (teamID?: number, teamName?: string, poke1?: number, poke2?: number,
    poke3?: number, poke4?: number, poke5?: number, poke6?: number) {
    this.teamID = teamID
    this.teamName = teamName
    this.poke1 = poke1
    this.poke2 = poke2
    this.poke3 = poke3
    this.poke4 = poke4
    this.poke5 = poke5
    this.poke6 = poke6
  }

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
