
/// SECTION: Results

export type Result = BaseResult | DiceResult
type Result_base = {
  source: Expr
  value: number
  prev: Result[]
  statuses?: { fromOp: string, text: string, results?: Result[] }[]
}

export type BaseResult = Result_base & { type: 'basic' }
export type DiceResult = Result_base & {
  type: 'dice'
  rolls: number[]
  rollCount: number
  maxRoll: number
  minRoll?: number
}

/// SECTION: Core expression types

export type ExprCtx = {[k:string]: Expr}

export abstract class Expr {
  constructor(readonly cacheable: boolean) {}

  private cached?: Result
  eval(ctx: {[k:string]: Expr|number} = {}): Result {
    if(this.cacheable && this.cached) return this.cached
    return this.cached = this.performEval(Expr.simplifyCtx(ctx))
  }

  protected abstract performEval(ctx: ExprCtx): Result
  abstract toString(): string

  private static simplifyCtx(ctx: {[k:string]: Expr|number}): ExprCtx {
    return Object.entries(ctx)
      .map(([k,v]) => [k, v instanceof Expr ? v : new Const(v)] as [string, Expr])
      .reduce((a,[k,v]) => ({ ...a, [k]: v }), {})
  }
}

export class Const extends Expr {
  constructor(readonly value: number) { super(true) }

  toString() { return this.value.toString() }
  protected performEval(): Result {
    return { type: 'basic', source: this, value: this.value, prev: [] }
  }
}

export class Group extends Expr {
  constructor(readonly contains: Expr) { super(contains.cacheable) }

  toString() { return `(${this.contains})` }
  protected performEval(ctx: ExprCtx): Result {
    return this.contains.eval(ctx)
  }
}

export class Variable extends Expr {
  constructor(readonly name: string) { super(false) }

  toString() { return `\$${this.name};` }
  protected performEval(ctx: ExprCtx): Result {
    let val = ctx[this.name]?.eval(ctx)
    return { type: 'basic', source: this, value: val?.value || NaN, prev: [val] }
  }
}

/// SECTION: Built-in operator definitions

import '../opdefs/math'
import '../opdefs/dice'
import '../opdefs/dnd5e'
import '../opdefs/keep'
import '../opdefs/reroll'
