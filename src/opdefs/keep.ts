import { DiceResult, Result } from "../core/expressions"
import { Operators as Ops, BinOp } from "../core/operators"
import { removeLowest, removeHighest, sum } from "../util/functions"

const keep = (keep: (rs: number[], v: number) => number[]) => (op: BinOp, _l: Result, r: Result) => {
  let l = _l as DiceResult,
      keepRolls = keep(l.rolls, r.value)
  return {
    ...l,
    source: op,
    rolls: keepRolls,
    value: keepRolls.reduce(sum, 0),
    prev: [ l, r ]
  }
}

Ops.registerOp({
  name: 'keep_high',
  type: 'binop',
  text: 'kh',
  prec: 3,
  requireTypeL: 'dice',
  eval: keep((rs,v) => removeLowest(rs, rs.length-v))
})

Ops.registerOp({
  name: 'keep_low',
  type: 'binop',
  text: 'kl',
  prec: 3,
  requireTypeL: 'dice',
  eval: keep((rs,v) => removeHighest(rs, rs.length-v))
})

Ops.registerOp({
  name: 'keep_above',
  type: 'binop',
  text: 'k>',
  prec: 3,
  requireTypeL: 'dice',
  eval: keep((rs,v) => rs.filter(n => n >= v))
})

Ops.registerOp({
  name: 'keep_below',
  type: 'binop',
  text: 'k<',
  prec: 3,
  requireTypeL: 'dice',
  eval: keep((rs,v) => rs.filter(n => n <= v))
})
