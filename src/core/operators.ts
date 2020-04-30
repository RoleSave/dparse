import { Result, ExprCtx, Expr } from "./expressions"

/// SECTION: Operators

/** (internal) Operator-related registry and utility functions. */
class OperatorReg {
  private readonly opRegistry: {[k:string]: OpDef} = {}
  private readonly groupRegistry: {[k:string]: GroupDef} = {}
  private highprec = 0
  private lowprec = 0

  /** Register a new operator. */
  registerOp(op: OpDef, redefine: boolean = false) {
    if(!redefine && this.opRegistry[op.name]) 
      throw `Attempted to redefine operator ${op.name}; please change the operator's name or set the 'redefine' flag as true in your call to registerOp`
    if(this.getOpList().filter(o=>o.name!==op.name).map(o=>o.text).includes(op.text))
      throw `Attempted to define operator ${op.name} with conflicting text representation ${op.text}`
    this.opRegistry[op.name] = op 
    this.highprec = Math.max(this.highprec, op.prec)
    this.lowprec = Math.min(this.lowprec, op.prec)
  }

  /** Register a new group type. */
  registerGroupType(grp: GroupDef, redefine: boolean = false) {
    if(!redefine && this.groupRegistry[grp.name])
      throw `Attempted to redefine group type ${grp.name}; please change the type's name or set the 'redefine' flag as true in your call to registerGroupType`
    if(this.getGroupList().filter(g=>g.name!==grp.name).map(g=>g.open).includes(grp.open))
      throw `Attempted to define group type ${grp.name} with conflicting opening text representation ${grp.open}`
    if(this.getGroupList().filter(g=>g.name!==grp.name).map(g=>g.close).includes(grp.close))
      throw `Attempted to define group type ${grp.name} with conflicting closing text representation ${grp.close}`
    this.groupRegistry[grp.name] = grp
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
  getOpsForPrec(prec: number): OpDef[] { 
    return this.getOpList().filter(op => op.prec == prec) 
  }

  /** Get a group type definition by name */
  getGroup(name: string): GroupDef|undefined { return this.groupRegistry[name] }
  getGroupList(): GroupDef[] { return Object.values(this.groupRegistry) }
  
  /** Returns true if the given `Expr` is an `Op`. */
  isOp(expr: Expr): expr is Op { return expr instanceof PostOp || expr instanceof BinOp }
  /** Returns true if the given `Expr` is a `PreOp`. */
  isPreOp(expr: Expr): expr is PreOp { return this.isOp(expr) && expr.def.type === 'preop' }
  /** Returns true if the given `Expr` is a `PostOp`. */
  isPostOp(expr: Expr): expr is PostOp { return this.isOp(expr) && expr.def.type === 'postop' }
  /** Returns true if the given `Expr` is a `BinOp`. */
  isBinOp(expr: Expr): expr is BinOp { return this.isOp(expr) && expr.def.type === 'binop' }
}

/** Operator-related registry and utility functions. */
export const Operators = new OperatorReg
export default Operators

/// SECTION: Operator types

/** All data required to define a new operator. */
export type OpDef = PreOpDef|PostOpDef|BinOpDef
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

/** A unary operator which comes before its operand. */
export type PreOpDef = OpDef_base & {
  type: 'preop'
  /** If present, throws an error if passed the wrong type of `Result`. */
  requireType?: Result['type']
  /** The body of the operator. */
  eval: (op: PreOp, rhs: Result, ctx: ExprCtx) => Result
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
export type Op = PreOp|PostOp|BinOp

/** A unary prefix operator. */
export class PreOp extends Expr {
  constructor(
    /** The operator definition. */
    readonly def: PreOpDef,
    /** The right-hand operand. */
    readonly rhs: Expr
  ) { super(!!def.cacheable && rhs.cacheable) }

  toString(ctx?: ExprCtx) { return `${this.def.display ?? this.def.text}${this.rhs.toString(ctx)}` }
  protected performEval(ctx: ExprCtx): Result {
    let l = this.rhs.eval(ctx)
    if(this.def.requireType && this.def.requireType !== l.type)
      throw `Cannot perform op ${this.def.text} on result of type ${l.type}`
    return this.def.eval(this, l, ctx)
  }
}

/** A unary postfix operator. */
export class PostOp extends Expr {
  constructor(
    /** The operator definition. */
    readonly def: PostOpDef, 
    /** The left-hand operand. */
    readonly lhs: Expr
  ) { super(!!def.cacheable && lhs.cacheable) }

  toString(ctx?: ExprCtx) { return `${this.lhs.toString(ctx)}${this.def.display ?? this.def.text}` }
  protected performEval(ctx: ExprCtx): Result {
    let l = this.lhs.eval(ctx)
    if(this.def.requireType && this.def.requireType !== l.type)
      throw `Cannot perform op ${this.def.text} on result of type ${l.type}`
    return this.def.eval(this, l, ctx)
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

  toString(ctx?: ExprCtx) { return `${this.lhs.toString(ctx)}${this.def.display ?? this.def.text}${this.rhs.toString(ctx)}` }
  protected performEval(ctx: ExprCtx): Result {
    let l = this.lhs.eval(ctx),
        r = this.rhs.eval(ctx)
    if(this.def.requireTypeL && this.def.requireTypeL !== l.type)
      throw `Cannot perform op ${this.def.name} on result of type ${l.type} (left hand side, ${l.source})`
    if(this.def.requireTypeR && this.def.requireTypeR !== r.type)
      throw `Cannot perform op ${this.def.name} on result of type ${r.type} (right hand side, ${r.source})`
    return this.def.eval(this, l, r, ctx)
  }
}

/// SECTION: Group types

/** All data required to define a new operator. */
export type GroupDef = {
  /** The internal name of the group type. Must be unique. */
  name: string
  /** The parsed opening text of the group. */
  open: string
  /** The parsed closing text of the group. */
  close: string
  /** The maximum number of expressions contained by this group. If not present, assumed to be infinite. */
  maxContents?: number
  /** If present, throws an error if a contained expression returns the wrong type of `Result`. */
  requireType?: Result['type']

  /** An optional override for how this group is represented by `toString`. If not present, `open` is used. */
  openDisplay?: string
  /** An optional override for how this group is represented by `toString`. If not present, `close` is used. */
  closeDisplay?: string
  /** Whether the contents of this list should be cached for display on creation. If not present, assumes false. */
  cacheContentDisplay?: boolean
  /** Whether the results of this group can be cached if its operands are cacheable. If not present, assumes false. */
  cacheable?: boolean

  /** The body of the operator. */
  eval: (grp: Group, contents: Result[], ctx: ExprCtx) => Result
}

export class Group extends Expr {
  private readonly toString_cached?: string

  constructor(
    readonly def: GroupDef,
    readonly contents: Expr[]
  ) { 
    super(!!def.cacheable && contents.reduce<boolean>((a,b) => a && !!b.cacheable, true))
    if(typeof def.maxContents !== 'undefined' && contents.length > def.maxContents)
      throw `Groups of type ${this.def.name} can only contain up to ${def.maxContents} expression${def.maxContents !== 1 ? 's' : ''}`
    if(def.cacheContentDisplay) this.toString_cached = this.toString()
  }

  toString(ctx?: ExprCtx) { return this.toString_cached ?? 
    `${this.def.openDisplay ?? this.def.open}${this.contents.map(e=>e.toString(ctx)).join(', ')}${this.def.closeDisplay ?? this.def.close}` }

  performEval(ctx: ExprCtx) {
    let results = this.contents.map(e => e.eval(ctx))
    if(this.def.requireType && !results.every(r => r.type === this.def.requireType))
      throw `Cannot evaluate group ${this.def.name} with contained expression not of type ${this.def.requireType}`

    return this.def.eval(this, results, ctx)
  }
}
