import { Result, ExprCtx, Expr, Const } from "./expressions"

/// SECTION: Operators

/** (internal) Operator-related registry and utility functions. */
class OperatorReg {
  private readonly opRegistry: {[k:string]: OpDef} = {}
  private highprec = 0
  private lowprec = 0

  /** Register a new operator. */
  registerOp(op: OpDef) { 
    this.opRegistry[op.name] = op 
    this.highprec = Math.max(this.highprec, op.prec)
    this.lowprec = Math.min(this.lowprec, op.prec)
  }

  /** Get the highest registered operator precedence. */
  get highestOpPrec() { return this.highprec }
  /** Get the lowest registered operator precedence. */
  get lowestOpPrec() { return this.lowprec }

  /** Get an operator definition by name. */
  getOp(name: string): OpDef|undefined { return this.opRegistry[name] }
  /** Get a list of operator definitions. */
  getOpList(): OpDef[] { return Object.values(this.opRegistry) }

  /** Get a list of operator defintions matching the given precedence. */
  getOpsForPrec(prec: number) { 
    return this.getOpList().filter(op => op.prec == prec) 
  }
  
  /** Returns true if the given `Expr` is an `Op`. */
  isOp(expr: Expr): expr is Op {
    return expr instanceof PostOp || expr instanceof BinOp
  }
}

/** Operator-related registry and utility functions. */
export const Operators = new OperatorReg
export default Operators

/** All data required to define a new operator. */
export type OpDef = PostOpDef|BinOpDef
type OpDef_base = {
  /** The internal name of the operator. Must be unique. */
  name: string
  /** The parsed text of the operator. */
  text: string

  /** 
   * The precedence of the operator. Defines order of operations, higher is sooner. 
   * 
   * Default precedences:
   * - `0` Additive operators (add, subtract)
   * - `1` Multiplicative operators (multiply, divide, remainder)
   * - `2` Exponential operators (exponentiation)
   * - `3` Most postfix operators (exploding dice, advantage, etc.)
   * - `4` Dice types (d, dF, d%, etc.)
   */
  prec: number

  /** An optional override for how this operator is represented by `toString`. If not present, `text` is used. */
  display?: string
  /** Whether the results of this operator can be cached if its operands are cacheable. If not present, assumes false. */
  cacheable?: boolean
}

/** A unary operator which comes after its operand. */
export type PostOpDef = OpDef_base & {
  type: 'postop'
  /** If present, throws an error if passed the wrong type of `Result`. */
  requireType?: Result['type']
  /** The body of the operator. */
  eval: (op: PostOp, lhs: Result, ctx: ExprCtx) => Result
}

/** A binary operator which comes between its operands. */
export type BinOpDef = OpDef_base & {
  type: 'binop'
  /** If present, throws an error if passed the wrong type of `Result`. */
  requireTypeL?: Result['type']
  /** If present, throws an error if passed the wrong type of `Result`. */
  requireTypeR?: Result['type']
  /** The body of the operator. */
  eval: (op: BinOp, lhs: Result, rhs: Result, ctx: ExprCtx) => Result
}

/** An operator-based expression. */
export type Op = PostOp|BinOp

/** A unary postfix operator. */
export class PostOp extends Expr {
  constructor(
    /** The operator definition. */
    readonly def: PostOpDef, 
    /** The left-hand operand. */
    readonly lhs: Expr
  ) { super(!!def.cacheable && lhs.cacheable) }

  toString(ctx?: ExprCtx) { return `${this.lhs.toString(ctx)}${this.def.display || this.def.text}` }
  protected performEval(ctx: ExprCtx): Result {
    let l = this.lhs.eval(ctx)
    if(this.def.requireType && this.def.requireType !== l.type)
      throw `Cannot perform op ${this.def.text} on result of type ${l.type}`
    return this.def.eval(this, l, ctx)
  }


  /** Create a copy of this operator, optionally replacing the operands. */
  clone(lhs?: Expr|number) { 
    if(typeof lhs === 'number') lhs = new Const(lhs)
    return new PostOp(this.def, lhs || this.lhs) 
  }
}

/** A binary infix operator. */
export class BinOp extends Expr {
  constructor(
    /** The operator definition. */
    readonly def: BinOpDef, 
    /** The left-hand operand. */
    readonly lhs: Expr,
    /** The right-hand operand. */
    readonly rhs: Expr
  ) { super(!!def.cacheable && lhs.cacheable && rhs.cacheable) }

  toString(ctx?: ExprCtx) { return `${this.lhs.toString(ctx)}${this.def.display || this.def.text}${this.rhs.toString(ctx)}` }
  protected performEval(ctx: ExprCtx): Result {
    let l = this.lhs.eval(ctx),
        r = this.rhs.eval(ctx)
    if(this.def.requireTypeL && this.def.requireTypeL !== l.type)
      throw `Cannot perform op ${this.def.text} on result of type ${l.type} (left hand side, ${l.source})`
    if(this.def.requireTypeR && this.def.requireTypeR !== r.type)
      throw `Cannot perform op ${this.def.text} on result of type ${r.type} (right hand side, ${r.source})`
    return this.def.eval(this, l, r, ctx)
  }
  
  /** Create a copy of this operator, optionally replacing the operands. */
  clone(lhs?: Expr|number, rhs?: Expr|number) {
    if(typeof lhs === 'number') lhs = new Const(lhs)
    if(typeof rhs === 'number') rhs = new Const(rhs)
    return new BinOp(this.def, lhs || this.lhs, rhs || this.rhs)
  }
}
