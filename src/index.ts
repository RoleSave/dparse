
export { Expr, Result, ExprCtx, isBaseResult, isDiceResult } from './core/expressions'
export { Operators, Op, OpDef } from './core/operators'
export { parseExpr, parseExprList } from './core/parse'

import './opdefs/math'
import './opdefs/dice'
import './opdefs/dnd5e'
import './opdefs/keep'
import './opdefs/reroll'
