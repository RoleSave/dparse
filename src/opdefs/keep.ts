import { DiceResult, Result } from "../core/expressions"
import { Operators, BinOp } from "../core/operators"
import { removeN } from "../util/functions"

const keep = (keep: (rs: number[], v: number) => number[]) => (op: BinOp, _l: Result, r: Result) => {
  let l = _l as DiceResult, keepRolls
  return {
    ...l,
    source: op,
    rolls: keepRolls = keep(l.rolls, r.value),
    value: keepRolls.reduce((a,b)=>a+b, 0),
    prev: [ l, r ]
  }
}

Operators.registerOp({
  name: 'keep_high',
  type: 'binop',
  text: 'kh',
  prec: 3,
  requireTypeL: 'dice',
  eval: keep((rs,v) => removeN(rs, rs.length-v, Math.max))
})

Operators.registerOp({
  name: 'keep_low',
  type: 'binop',
  text: 'kl',
  prec: 3,
  requireTypeL: 'dice',
  eval: keep((rs,v) => removeN(rs, rs.length-v, Math.min))
})

Operators.registerOp({
  name: 'keep_above',
  type: 'binop',
  text: 'k>',
  prec: 3,
  requireTypeL: 'dice',
  eval: keep((rs,v) => rs.filter(n => n >= v))
})

Operators.registerOp({
  name: 'keep_below',
  type: 'binop',
  text: 'k<',
  prec: 3,
  requireTypeL: 'dice',
  eval: keep((rs,v) => rs.filter(n => n <= v))
})
