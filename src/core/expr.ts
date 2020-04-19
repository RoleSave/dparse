import { DiceResult } from "./dice"
import { randInt, fn } from "../util"

export type Result = {
  source: Expr,
  value: number, 
  rolls: DiceResult[]
}

export abstract class Expr {
  constructor(readonly cacheable: boolean) {}

  private cached?: Result
  eval(): Result {
    if(this.cacheable) return this.cached || (this.cached = this.performEval())
    return this.performEval()
  }

  protected abstract performEval(): Result
  abstract toString(): string
}

export class Const extends Expr {
  constructor(readonly value: number) {super(true)}
  protected performEval(): Result { return { source: this, value: this.value, rolls: [] } }
  toString() { return this.value.toString() }
}

export class Group extends Expr {
  constructor(readonly contains: Expr) {super(contains.cacheable)}
  protected performEval(): Result { return this.contains.eval() }
  toString() { return `(${this.contains})` }
}

export abstract class BinOp extends Expr {
  constructor(
    readonly lhs: Expr, 
    readonly rhs: Expr, 
    readonly text: string, 
    readonly f: (a:number, b:number) => number
  ) {super(lhs.cacheable && rhs.cacheable)}

  toString() { return `${this.lhs} ${this.text} ${this.rhs}`}
  protected performEval(): Result {
    let lhs = this.lhs.eval(), rhs = this.rhs.eval()
    return { source: this, value: this.f(lhs.value, rhs.value), rolls: [...lhs.rolls||[], ...rhs.rolls||[]] }
  }
}

export class AddOp extends BinOp { constructor(lhs: Expr, rhs: Expr) {super(lhs, rhs, '+', fn.sum)} }
export class SubOp extends BinOp { constructor(lhs: Expr, rhs: Expr) {super(lhs, rhs, '-', fn.diff)} }
export class MulOp extends BinOp { constructor(lhs: Expr, rhs: Expr) {super(lhs, rhs, '*', fn.prod)} }
export class DivOp extends BinOp { constructor(lhs: Expr, rhs: Expr) {super(lhs, rhs, '/', (a,b) => b != 0 ? Math.floor(a/b) : NaN)} }
export class ModOp extends BinOp { constructor(lhs: Expr, rhs: Expr) {super(lhs, rhs, '%', (a,b) => b != 0 ? a%b : NaN)} }
export class PowOp extends BinOp { constructor(lhs: Expr, rhs: Expr) {super(lhs, rhs, '^', Math.pow)} }

export class RandomFromList extends Expr {
  private strRep?: string
  constructor(private list: number[], readonly removeSelected: boolean = false, readonly cacheStrRep = removeSelected) { 
    super(false)
    if(cacheStrRep) this.strRep = this.toString()
  }

  toString() { return this.strRep || `random[${this.list.join(',')}]` }
  protected performEval(): Result {
    let index = randInt(this.list.length),
        result = { source: this, value: this.list[index], rolls: [] }
    if(this.removeSelected) 
      this.list.splice(index, 1)
    return result
  }
}
