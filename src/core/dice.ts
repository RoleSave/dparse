import { Expr, Result, Const } from "./expr"
import { randInt, randComp, fn, arrayOf } from "../util"

export type DiceResult = {
  rolls: number[]
  total: number
  source: Dice
  prevResults?: DiceResult[]
  modBy?: DiceFn
  rollCount: number
  rollSides: number
  statuses?: { text: string, type: 'dc'|'wm', rolls?: DiceResult[] }[]
  tag?: string
}

export abstract class Dice extends Expr {
  constructor(readonly functions: DiceFn[] = []) { super(false) }
  readonly minimumRoll: number = 1

  abstract roll(): DiceResult
  protected performEval(): Result {
    let dr = this.roll()
    for(let fn of this.functions) dr = fn.apply(dr)
    return new Result(this, dr.total, [dr])
  }

  addFn(...fn: DiceFn[]) { this.functions.push(...fn); return this }
  abstract clone(lhs?: Expr|number, rhs?: Expr|number): this
}

export class BasicDice extends Dice {
  readonly lhs: Expr
  readonly rhs: Expr
  
  constructor(lhs: Expr|number, rhs: Expr|number, functions: DiceFn[] = []) { 
    super(functions)
    this.lhs = lhs instanceof Expr ? lhs : new Const(lhs)
    this.rhs = rhs instanceof Expr ? rhs : new Const(rhs)
  }

  toString() { return `${this.lhs}d${this.rhs}${this.functions.join('')}` }
  roll(): DiceResult {
    let count = this.lhs.eval(), sides = this.rhs.eval()
    if(count.value > 1000000) throw `Cannot roll more than 1,000,000 dice at once`
    if(count.value < 1) throw `Cannot roll less than 1 die`
    if(sides.value < 2) throw `Cannot roll a die with less than 2 sides`

    let rolls = arrayOf(count.value, () => randInt(sides.value)+1)
    return {
      rolls: rolls,
      total: rolls.reduce(fn.sum, 0),
      source: this,
      prevResults: [ ...count.rolls, ...sides.rolls ],
      rollCount: count.value,
      rollSides: sides.value
    }
  }

  clone(lhs?: Expr|number, rhs?: Expr|number): this {
    return new BasicDice(lhs || this.lhs, rhs || this.rhs) as this
  }
}

export class FateDice extends Dice {
  readonly lhs: Expr
  readonly minimumRoll = -1

  constructor(lhs: Expr|number, functions: DiceFn[] = []) {
    super(functions)
    this.lhs = lhs instanceof Expr ? lhs : new Const(lhs)
  }

  toString() { return `${this.lhs}dF${this.functions.join('')}` }
  roll(): DiceResult {
    let count = this.lhs.eval()
    if(count.value > 1000000) throw `Cannot roll more than 1,000,000 dice at once`
    if(count.value < 1) throw `Cannot roll less than 1 die`

    let rolls = arrayOf(count.value, randComp)
    return {
      rolls: rolls,
      total: rolls.reduce(fn.sum, 0),
      source: this,
      prevResults: count.rolls,
      rollCount: count.value,
      rollSides: 1
    }
  }

  clone(lhs?: Expr|number): this {
    return new FateDice(lhs || this.lhs) as this
  }
}

// Wrapper class around Expr to allow applying certain dice functions to arbitrary non-dice expressions
export class ExprDice extends Dice {
  constructor(readonly base: Expr, functions: DiceFn[] = []) { super(functions) }
  toString() { return this.base.toString() }
  roll() { 
    let result = this.base.eval()
    return {
      rolls: [],
      total: result.value,
      source: this,
      prevResults: result.rolls,
      rollCount: 0,
      rollSides: 0
    }
  }

  clone(lhs?: Expr|number): this {
    lhs = lhs ? lhs instanceof Expr ? lhs : new Const(lhs) : this.base
    return new ExprDice(lhs) as this
  }
}

export abstract class DiceFn {
  constructor(readonly text: string) {}
  abstract apply(result: DiceResult): DiceResult
  toString() { return this.text }
}
