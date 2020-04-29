import { DiceResult, Result, ExprCtx, Const, } from "../core/expressions"
import { Operators, BinOp } from "../core/operators"
import { removeN, cloneObj } from "../util/functions"

const reroll = (keep: (rolls:number[], vs:number) => number[]) => (op: BinOp, _l: Result, r: Result, ctx: ExprCtx): DiceResult => {
  let l = _l as DiceResult, keepRolls = keep(l.rolls, r.value), outRolls
  if(keepRolls.length == l.rolls.length) return { ...l, source: op, prev: [ l, r ] }

  if(l.source.def.name.endsWith('_rec')) l = l.prev[0] as DiceResult
  let rerollDie = cloneObj(l.source, { lhs: new Const(l.rolls.length - keepRolls.length) }),
      rerollRes = rerollDie.eval(ctx) as DiceResult
  return {
    ...rerollRes,
    source: op,
    rolls: outRolls = [ ...keepRolls, ...rerollRes.rolls ],
    value: outRolls.reduce((a,b)=>a+b, 0),
    prev: [ l, r ]
  }
}

Operators.registerOp({
  name: 'reroll_high',
  type: 'binop',
  text: 'rh',
  prec: 3,
  requireTypeL: 'dice',
  eval: reroll((rs,v) => removeN(rs, v, Math.min))
})

Operators.registerOp({
  name: 'reroll_low',
  type: 'binop',
  text: 'rl',
  prec: 3,
  requireTypeL: 'dice',
  eval: reroll((rs,v) => removeN(rs, v, Math.max))
})

Operators.registerOp({
  name: 'reroll_above',
  type: 'binop',
  text: 'r>',
  prec: 3,
  requireTypeL: 'dice',
  eval: reroll((rs,v) => rs.filter(n => n < v))
})

Operators.registerOp({
  name: 'reroll_below',
  type: 'binop',
  text: 'r<',
  prec: 3,
  requireTypeL: 'dice',
  eval: reroll((rs,v) => rs.filter(n => n > v))
})

Operators.registerOp({
  name: 'reroll_above_rec',
  type: 'binop',
  text: 'r!>',
  prec: 3,
  requireTypeL: 'dice',
  eval: (op, l, r, ctx) => {
    let method = reroll((rs,v) => rs.filter(n => n < v))
    do l = method(op, l, r, ctx); while(l.rolls.find(n => n >= r.value))
    return l
  }
})

Operators.registerOp({
  name: 'reroll_below_rec',
  type: 'binop',
  text: 'r!<',
  prec: 3,
  requireTypeL: 'dice',
  eval: (op, l, r, ctx) => {
    let method = reroll((rs,v) => rs.filter(n => n > v))
    do l = method(op, l, r, ctx); while(l.rolls.find(n => n <= r.value))
    return l
  }
})
