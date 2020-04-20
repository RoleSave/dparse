import { registerOp, Result, DiceResult, Const, ExprCtx, isOp, Op } from "../core/expressions"
import { arrayOf, randInt, fn, randComp } from "../util/functions"

const simpleDie = (l: Result, r: Result): Omit<DiceResult, 'source'> => {
  if(l.value > 1000000) throw `Cannot roll more than 1,000,000 dice at once`
  if(l.value < 1) throw `Cannot roll less than 1 die`
  if(r.value < 2) throw `Cannot roll a die with less than 2 sides`

  let rolls = arrayOf(l.value, () => randInt(r.value)+1)
  return {
    type: 'dice',
    rolls: rolls,
    value: rolls.reduce(fn.sum, 0),
    prev: [ ...l.prev, ...r.prev ],
    rollCount: l.value,
    maxRoll: r.value
  }
}

registerOp({
  name: 'dice_basic',
  type: 'binop',
  text: 'd',
  prec: 4,
  eval: (op, l, r) => ({ ...simpleDie(l,r), source: op })
})

registerOp({
  name: 'dice_fate',
  type: 'postop',
  text: 'dF',
  prec: 4,
  eval: (op, l) => {
    if(l.value > 1000000) throw `Cannot roll more than 1,000,000 dice at once`
    if(l.value < 1) throw `Cannot roll less than 1 die`

    let rolls = arrayOf(l.value, randComp)
    return {
      type: 'dice',
      rolls: rolls,
      value: rolls.reduce(fn.sum, 0),
      source: op,
      prev: l.prev,
      rollCount: l.value,
      maxRoll: 1,
      minRoll: -1
    }
  }
})

registerOp({
  name: 'dice_percentile',
  type: 'postop',
  text: 'd%',
  prec: 4,
  display: 'd100',
  eval: (op, l) => {
    const _100 = new Const(100).eval()
    return { ...simpleDie(l, _100), source: op }
  }
})

registerOp({
  name: 'explode',
  type: 'postop',
  text: '!',
  prec: 3,
  requireType: 'dice',
  eval: function explodeDice(op: Op, l: Result, ctx: ExprCtx, depth: number = 0): DiceResult {
    if(depth > 100) throw `Exploding dice exceeded 100 explosion steps; please try again`
    let result = l as DiceResult
  
    let explCount = result.rolls.reduce((n,x) => n+(x===result.maxRoll?1:0),0)
    if(explCount > 0) {
      let explDie: Op|undefined
      if(isOp(result.source)) explDie = result.source.clone(explCount)
      if(!explDie) throw `Could not construct new instance of ${result.source} for explosion`
  
      let explResult = explodeDice(op, explDie.eval(ctx) as DiceResult, ctx, depth+1),
          allRolls = [ ...result.rolls, ...explResult.rolls ]
      return {
        ...result,
        rolls: allRolls,
        value: allRolls.reduce(fn.sum, 0),
        prev: [ explResult, ...result.prev ]
      }
    }
  
    return result
  }
})
