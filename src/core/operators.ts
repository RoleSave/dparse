import { Result, ExprCtx, Expr, Const } from "./expressions"

/// SECTION: Operators

class OperatorReg {
  private readonly opRegistry: {[k:string]: OpDef} = {}
  private highprec = 0
  private lowprec = 0

  registerOp(op: OpDef) { 
    this.opRegistry[op.name] = op 
    this.highprec = Math.max(this.highprec, op.prec)
    this.lowprec = Math.min(this.lowprec, op.prec)
  }

  get highestOpPrec() { return this.highprec }
  get lowestOpPrec() { return this.lowprec }

  getOp(name: string): OpDef|undefined { return this.opRegistry[name] }
  getOpList(): OpDef[] { return Object.values(this.opRegistry) }

  getOpsForPrec(prec: number) { 
    return this.getOpList().filter(op => op.prec == prec) 
  }
  
  isOp(expr: Expr): expr is Op {
    return expr instanceof PostOp || expr instanceof BinOp
  }
}

export const Operators = new OperatorReg
export default Operators

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
