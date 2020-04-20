import { registerOp, PostOp, Result, ExprCtx, DiceResult, Op, isOp } from "../core/expressions"
import { fn } from "../util/functions"

registerOp({
  name: 'explode',
  type: 'postop',
  text: '!',
  prec: 3,
  requireType: 'dice',
  eval: function explodeDice(op: PostOp, l: Result, ctx: ExprCtx, depth: number = 0): DiceResult {
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

registerOp({
  name: 'advantage',
  type: 'postop',
  text: 'adv',
  prec: 3,
  eval: (op, orgRoll, ctx) => {
    let advRoll = orgRoll.source.eval(ctx),
        ordRoll = [orgRoll, advRoll].sort((a,b) => b.value - a.value)
    return {
      ...ordRoll[0],
      source: op,
      prev: [ ordRoll[1], ...orgRoll.prev ]
    }
  }
})

registerOp({
  name: 'disadvantage',
  type: 'postop',
  text: 'dis',
  prec: 3,
  eval: (op, orgRoll, ctx) => {
    let advRoll = orgRoll.source.eval(ctx),
        ordRoll = [orgRoll, advRoll].sort((a,b) => a.value - b.value)
    return {
      ...ordRoll[0],
      source: op,
      prev: [ ordRoll[1], ...orgRoll.prev ]
    }
  }
})

registerOp({
  name: 'difficulty_class',
  type: 'binop',
  text: 'dc',
  prec: -1,
  display: ' dc',
  eval: (op, l, r) => ({
    ...l,
    source: op,
    prev: [ l, r ],
    statuses: [
      ...l.statuses||[],
      ...r.statuses||[],
      { fromOp: op.def.name,
        text: l.value >= r.value ? 'Pass' : 'Fail' }
    ]
  })
})
