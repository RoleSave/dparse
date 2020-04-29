import { Result, DiceResult, Const, ExprCtx } from "../core/expressions"
import { Operators, Op } from "../core/operators"
import { randInt, randComp, cloneObj } from "../util/functions"

const simpleDie = (l: Result, r: Result): Omit<DiceResult, 'source'> => {
  if(l.value > 1000000) throw `Cannot roll more than 1,000,000 dice at once`
  if(l.value < 1) throw `Cannot roll less than 1 die`
  if(r.value < 2) throw `Cannot roll a die with less than 2 sides`

  let rolls; return {
    type: 'dice',
    rolls: rolls = [...Array(l.value)].map(() => randInt(r.value)+1),
    value: rolls.reduce((a,b)=>a+b, 0),
    prev: [ l, r ],
    rollCount: l.value,
    maxRoll: r.value
  }
}

Operators.registerOp({
  name: 'dice_basic',
  type: 'binop',
  text: 'd',
  prec: 4,
  eval: (op, l, r) => ({ ...simpleDie(l,r), source: op })
})

Operators.registerOp({
  name: 'dice_fate',
  type: 'postop',
  text: 'dF',
  prec: 4,
  eval: (op, l) => {
    if(l.value > 1000000) throw `Cannot roll more than 1,000,000 dice at once`
    if(l.value < 1) throw `Cannot roll less than 1 die`

    let rolls; return {
      type: 'dice',
      rolls: rolls = [...Array(l.value)].map(randComp),
      value: rolls.reduce((a,b)=>a+b, 0),
      source: op,
      prev: [ l ],
      rollCount: l.value,
      maxRoll: 1,
      minRoll: -1
    }
  }
})

Operators.registerOp({
  name: 'dice_percentile',
  type: 'postop',
  text: 'd%',
  prec: 4,
  display: 'd100',
  eval: (op, l) => ({ ...simpleDie(l, new Const(100).eval()), source: op })
})

Operators.registerOp({
  name: 'explode',
  type: 'postop',
  text: '!',
  prec: 3,
  requireType: 'dice',
  eval: function explodeDice(op: Op, l: Result, ctx: ExprCtx, depth: number = 0): DiceResult {
    let result = l as DiceResult, explCount = result.rolls.reduce((n,x) => n+(x===result.maxRoll?1:0),0)
    if(!explCount) return { ...result, source: op, prev: [ result ] }
    if(depth > 100) throw `Exploding dice exceeded 100 explosion steps; please try again`

    let explDie = cloneObj(result.source, { lhs: new Const(explCount) }),
        explResult = explodeDice(op, explDie.eval(ctx) as DiceResult, ctx, depth+1)
    let allRolls; return {
      ...result,
      rolls: allRolls = [ ...result.rolls, ...explResult.rolls ],
      value: allRolls.reduce((a,b)=>a+b, 0),
      prev: [ explResult ]
    }
  }
})
