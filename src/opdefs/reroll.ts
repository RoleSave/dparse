import { DiceResult, Result, ExprCtx, } from "../core/expressions"
import { Operators as Ops, Op, BinOp } from "../core/operators"
import { removeHighest, removeLowest, sum } from "../util/functions"

const reroll = (keep: (rolls:number[], vs:number) => number[]) => (op: BinOp, _l: Result, r: Result, ctx: ExprCtx): DiceResult => {
  let l = _l as DiceResult,
      keepRolls = keep(l.rolls, r.value)
  if(keepRolls.length === l.rolls.length) 
    return { ...l, source: op, prev: [ l, r ] }

  let rerollDie: Op|undefined
  if(Ops.isOp(l.source)) {
    if(/^reroll_.+_rec/.test(l.source.def.name)) l = l.prev[0] as DiceResult
    rerollDie = (l.source as Op).clone(l.rolls.length - keepRolls.length)
  }
  if(!rerollDie)
    throw `Could not construct new instance of ${l.source} for rerolling`

  let rerollResult = rerollDie.eval(ctx) as DiceResult,
      outRolls = [ ...keepRolls, ...rerollResult.rolls ]
  return {
    ...rerollResult,
    source: op,
    rolls: outRolls,
    value: outRolls.reduce(sum, 0),
    prev: [ l, r ]
  }
}

Ops.registerOp({
  name: 'reroll_high',
  type: 'binop',
  text: 'rh',
  prec: 3,
  requireTypeL: 'dice',
  eval: reroll(removeHighest)
})

Ops.registerOp({
  name: 'reroll_low',
  type: 'binop',
  text: 'rl',
  prec: 3,
  requireTypeL: 'dice',
  eval: reroll(removeLowest)
})

Ops.registerOp({
  name: 'reroll_above',
  type: 'binop',
  text: 'r>',
  prec: 3,
  requireTypeL: 'dice',
  eval: reroll((rs,v) => rs.filter(n => n < v))
})

Ops.registerOp({
  name: 'reroll_below',
  type: 'binop',
  text: 'r<',
  prec: 3,
  requireTypeL: 'dice',
  eval: reroll((rs,v) => rs.filter(n => n > v))
})

Ops.registerOp({
  name: 'reroll_above_rec',
  type: 'binop',
  text: 'r!>',
  prec: 3,
  requireTypeL: 'dice',
  eval: (op, l, r, ctx) => {
    let method = reroll((rs,v) => rs.filter(n => n < v)),
        result = method(op, l, r, ctx)
    while(result.rolls.find(n => n >= r.value))
      result = method(op, result, r, ctx)
    return result
  }
})

Ops.registerOp({
  name: 'reroll_below_rec',
  type: 'binop',
  text: 'r!<',
  prec: 3,
  requireTypeL: 'dice',
  eval: (op, l, r, ctx) => {
    let method = reroll((rs,v) => rs.filter(n => n > v)),
        result = method(op, l, r, ctx)
    while(result.rolls.find(n => n <= r.value))
      result = method(op, result, r, ctx)
    return result
  }
})
