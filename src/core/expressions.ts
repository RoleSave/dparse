import { Op } from './operators'
import { randOf } from '../util/functions'

/// SECTION: Results

/** The result of evaluating an expression. */
export type Result = BaseResult | DiceResult
type Result_base = {
  /** The expression evaluated to get this result. */
  source: Expr
  /** The numeric value of this result. */
  value: number
  /** Any previous results involved in the calculation of this one. */
  prev: Result[]

  /** Any additional messages passed up the chain. */
  statuses?: { 
    /** The name of the operator which generated this status. */
    fromOp: string, 
    /** The text of the status. */
    text: string, 
    /** Any additional results to be passed along with the status (see wild magic). */
    results?: Result[] 
  }[]
}

/** A simple result. */
export type BaseResult = Result_base & { type: 'basic' }

/** A result from a dice-based expression. */
export type DiceResult = Result_base & {
  type: 'dice'
  /** The expression evaluated to get this result. */
  source: Op
  /** A list of individual roll numbers. */
  rolls: number[]
  /** The number of expected rolls. Not guaranteed to equal `rolls.length` (see exploding dice in particular). */
  rollCount: number
  /** The maximum roll for a single die of the type used for this result. */
  maxRoll: number
  /** The minimum roll for a single die of the type used for this result. */
  minRoll?: number
}

export function isBaseResult(result: Result): result is BaseResult { return result.type === 'basic' }
export function isDiceResult(result: Result): result is DiceResult { return result.type === 'dice' }

/// SECTION: Core expression types

/** A mapping of variable names to expressions. Passed to `Expr#eval`. */
export type ExprCtx = {[k:string]: Expr}

/** An evaluable expression. */
export abstract class Expr {
  private cached?: Result
  constructor(/** Whether the result of this expression can be reliably cached. */ readonly cacheable: boolean) {}

  /** 
   * Evaluate this expression, or return the cached result if applicable.
   * @param ctx An `ExprCtx` from which to pull variables. Numbers will automatically be wrapped in `Const`.
   */
  eval(ctx: {[k:string]: Expr|number} = {}): Result {
    if(this.cacheable && this.cached) return this.cached
    return this.cached = this.performEval(Expr.simplifyCtx(ctx))
  }

  /** (internal) Perform the evaluation of this expression. */
  protected abstract performEval(ctx: ExprCtx): Result
  abstract toString(ctx?: ExprCtx): string

  /** Wrap numbers in `Const` for `ExprCtx`. */
  static simplifyCtx(ctx: {[k:string]: Expr|number}): ExprCtx {
    return Object.entries(ctx)
      .map(([k,v]) => [k, v instanceof Expr ? v : new Const(v)] as [string, Expr])
      .reduce((a,[k,v]) => ({ ...a, [k]: v }), {})
  }
}

/** A constant numeric value. */
export class Const extends Expr {
  constructor(/** The value of this constant. */ readonly value: number) { super(true) }

  toString() { return this.value.toString() }
  protected performEval(): Result {
    return { type: 'basic', source: this, value: this.value, prev: [] }
  }
}

/** A parenthesised expression. */
export class Group extends Expr {
  constructor(/** The expression inside the parens. */ readonly contains: Expr) { super(contains.cacheable) }

  toString(ctx?: ExprCtx) { return `(${this.contains.toString(ctx)})` }
  protected performEval(ctx: ExprCtx): Result {
    return this.contains.eval(ctx)
  }
}

/** A variable to be pulled from `ExprCtx` at eval time. */
export class Variable extends Expr {
  constructor(/** The name of the variable. */ readonly name: string) { super(false) }

  toString(ctx?: ExprCtx) { return ctx?.[this.name] ? `(${ctx[this.name].toString(ctx)})` : `\$${this.name};` }
  protected performEval(ctx: ExprCtx): Result {
    let val = ctx[this.name]?.eval(ctx)
    return { type: 'basic', source: this, value: val?.value || NaN, prev: [val] }
  }
}

/** Randomly select from a list. */
export class RandFromList extends Expr {
  constructor(/** The list. */ readonly list: Expr[]) { super(false) }

  toString(ctx?: ExprCtx) { return `[${this.list.map(e => e.toString(ctx)).join(', ')}]` }
  protected performEval(ctx: ExprCtx): Result {
    return randOf(this.list).eval(ctx)
  }
}

/** Randomly select from a list, removing selected options. */
export class TakeFromList extends Expr {
  private readonly stringRep?: string
  constructor(/** The list. */ readonly list: Expr[]) { 
    super(false) 
    this.stringRep = this.toString()
  }

  toString(ctx?: ExprCtx) { return this.stringRep || `{${this.list.map(e => e.toString(ctx)).join(', ')}}` }
  protected performEval(ctx: ExprCtx): Result {
    let expr = this.list.length ? randOf(this.list) : new Const(NaN)
    this.list.splice(this.list.indexOf(expr), 1)
    return expr.eval(ctx)
  }
}
