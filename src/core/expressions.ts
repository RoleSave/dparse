
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
  eval(ctx: ExprCtx = {}): Result {
    if(this.cacheable && this.cached) return this.cached
    return this.cached = this.performEval(ctx)
  }

  protected abstract performEval(ctx: ExprCtx): Result
  abstract toString(): string
}

export class Const extends Expr {
  constructor(readonly value: number) { super(true) }

  toString() { return this.value.toString() }
  protected performEval(ctx: ExprCtx): Result {
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

/// SECTION: Operators

const opRegistry: {[k:string]: OpDef} = {}
export let highestOpPrec = 0
export let lowestOpPrec = 0

export function registerOp(op: OpDef) { 
  opRegistry[op.name] = op 
  highestOpPrec = Math.max(highestOpPrec, op.prec)
  lowestOpPrec = Math.min(lowestOpPrec, op.prec)
}

export function getOp(name: string): OpDef|undefined { return opRegistry[name] }
export function getOpList(): OpDef[] { return Object.values(opRegistry) }
export function getOpsForPrec(prec: number) { 
  return Object.values(opRegistry).filter(op => op.prec == prec) }

export type OpDef = PostOpDef|BinOpDef
type OpDef_base = {
  name: string
  text: string
  prec: number
  display?: string
  cacheable?: boolean
}

export type PostOpDef = OpDef_base & {
  type: 'postop'
  requireType?: Result['type']
  eval: (op: PostOp, lhs: Result, ctx: ExprCtx) => Result
}

export type BinOpDef = OpDef_base & {
  type: 'binop'
  requireTypeL?: Result['type']
  requireTypeR?: Result['type']
  eval: (op: BinOp, lhs: Result, rhs: Result, ctx: ExprCtx) => Result
}

export type Op = PostOp|BinOp
export function isOp(expr: Expr): expr is Op {
  return expr instanceof PostOp || expr instanceof BinOp
}

export class PostOp extends Expr {
  constructor(
    readonly def: PostOpDef, 
    readonly lhs: Expr
  ) { super(!!def.cacheable && lhs.cacheable) }

  protected performEval(ctx: ExprCtx): Result {
    let l = this.lhs.eval(ctx)
    if(this.def.requireType && this.def.requireType !== l.type)
      throw `Cannot perform op ${this.def.text} on result of type ${l.type}`
    return this.def.eval(this, l, ctx)
  }

  toString() { return `${this.lhs}${this.def.display || this.def.text}` }
  clone(lhs?: Expr|number) { 
    if(typeof lhs === 'number') lhs = new Const(lhs)
    return new PostOp(this.def, lhs || this.lhs) 
  }
}

export class BinOp extends Expr {
  constructor(
    readonly def: BinOpDef, 
    readonly lhs: Expr,
    readonly rhs: Expr
  ) { super(!!def.cacheable && lhs.cacheable && rhs.cacheable) }

  protected performEval(ctx: ExprCtx): Result {
    let l = this.lhs.eval(ctx),
        r = this.rhs.eval(ctx)
    if(this.def.requireTypeL && this.def.requireTypeL !== l.type)
      throw `Cannot perform op ${this.def.text} on result of type ${l.type} (left hand side, ${l.source})`
    if(this.def.requireTypeR && this.def.requireTypeR !== r.type)
      throw `Cannot perform op ${this.def.text} on result of type ${r.type} (right hand side, ${r.source})`
    return this.def.eval(this, l, r, ctx)
  }
  
  toString() { return `${this.lhs}${this.def.display || this.def.text}${this.rhs}` }
  clone(lhs?: Expr|number, rhs?: Expr|number) {
    if(typeof lhs === 'number') lhs = new Const(lhs)
    if(typeof rhs === 'number') rhs = new Const(rhs)
    return new BinOp(this.def, lhs || this.lhs, rhs || this.rhs)
  }
}

/// SECTION: Delegated definitions

import './operators'
import './dicetypes'
import '../fns/core'
import '../fns/keep'
import '../fns/reroll'
import '../fns/wildmagic'
