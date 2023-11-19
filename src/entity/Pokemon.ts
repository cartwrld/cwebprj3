import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { IsOptional, Length, IsNotEmpty, IsIn, IsPositive, Max, Min, IsUrl } from 'class-validator'

const POKE_TYPES = ['', 'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']

@Entity()
@Unique('unique_pokemon_pokeid', ['pokeID'])
export class Pokemon {
  /**
   *
   * @param id : <number>
   * @param name : <string>
   * @param t1 : <string>
   * @param t2 : <string>
   * @param hp : <number>
   * @param atk : <number>
   * @param def : <number>
   * @param spatk : <number>
   * @param spdef : <number>
   * @param spd : <number>
   * @param sprite : <string>
   *
   */
  constructor ()

  constructor (id: number, name: string, t1: string, t2: string, hp: number, atk: number, def: number, spatk: number,
    spdef: number, spd: number, sprite: string)

  constructor (id?: number, name?: string, t1?: string, t2?: string, hp?: number, atk?: number, def?: number,
    spatk?: number, spdef?: number, spd?: number, sprite?: string) {
    this.pokeID = id
    this.pokeName = name
    this.pokeType1 = t1
    this.pokeType2 = t2
    this.hp = hp
    this.atk = atk
    this.def = def
    this.spatk = spatk
    this.spdef = spdef
    this.spd = spd
    this.gen = Pokemon.setPokeGen(id)
    this.sprite = sprite
  }

  /**
   * Function for setting setting the Generation of the Pokemon based on the ID
   */
  private static setPokeGen (pokeid): number {
    const pokeNum = pokeid
    let pokeGen = 0
    switch (true) {
      case pokeNum <= 151:
        pokeGen = 1
        break
      case pokeNum >= 151 && pokeNum < 252:
        pokeGen = 2
        break
      case pokeNum >= 252 && pokeNum < 387:
        pokeGen = 3
        break
      case pokeNum >= 387 && pokeNum < 495:
        pokeGen = 4
        break
      case pokeNum >= 495 && pokeNum < 650:
        pokeGen = 5
        break
      case pokeNum >= 650 && pokeNum < 722:
        pokeGen = 6
        break
      case pokeNum >= 722 && pokeNum < 810:
        pokeGen = 7
        break
      case pokeNum >= 810 && pokeNum < 906:
        pokeGen = 8
        break
      case pokeNum >= 906 && pokeNum < 1017:
        pokeGen = 9
        break
      case pokeNum >= 1010:
        pokeGen = 10
        break
        // default: throw new Error('Unsuccessful in setting PokeGen ---> pokeNum was undefined')
    }
    return pokeGen
  }

  @PrimaryGeneratedColumn()

  @IsOptional()
    pokeID: number

  @Column('nvarchar', { nullable: false })
  @Length(1, 50, { message: 'Given Name must be from $constraint1 to $constraint2 characters ' })
    pokeName: string

  @Column('nvarchar', { nullable: false })
  @IsIn(POKE_TYPES, { message: 'You gotta choose a valid PokeType!' })
  @IsNotEmpty({ message: 'Cmon... you need a valid PokeType!' })
    pokeType1: string

  @Column('nvarchar', { nullable: false })
  @IsIn(POKE_TYPES, { message: 'You gotta choose a valid PokeType!' })
  @IsNotEmpty({ message: 'Cmon... you need a valid PokeType!' })
    pokeType2: string

  @Column('int', { nullable: false })
  @Max(10, { message: 'Gen 10 is the latest generation!' })
  @Min(1, { message: 'Gen 1 was the first generation!' })
    gen: number

  @Column({ type: 'int', width: 3, nullable: false })
  @IsPositive({ message: 'You can\'t be fainted all the time!' })
  @Min(1, { message: 'Gotta have at least 1 HP!' })
  @Max(999, { message: 'Get real buddy!' })
    hp: number

  @Column({ type: 'int', width: 3, nullable: false })
  @IsPositive({ message: 'You can\'t be THAT bad at fighting!' })
  @Max(999, { message: 'Get real buddy!' })
    atk: number

  @Column({ type: 'int', width: 3, nullable: false })
  @IsPositive({ message: 'You can\'t be THAT bad at protecting!' })
  @Max(999, { message: 'Get real buddy!' })
    def: number

  @Column({ type: 'int', width: 3, nullable: false })
  @IsPositive({ message: 'Not THAT kind of special!' })
  @Max(999, { message: 'Get real buddy!' })
    spatk: number

  @Column({ type: 'int', width: 3, nullable: false })
  @IsPositive({ message: 'Not THAT kind of special!' })
  @Max(999, { message: 'Get real buddy!' })
    spdef: number

  @Column({ type: 'int', width: 3, nullable: false })
  @IsPositive({ message: 'You can\'t be THAT slow!' })
  @Max(999, { message: 'Get real buddy!' })
    spd: number

  @Column('nvarchar', { length: 25, nullable: false })
  @IsUrl()
    sprite: string
}
