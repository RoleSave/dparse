import { DiceResult, DiceFn } from "../core/dice"
import { Expr, Const } from "../core/expr"
import { fn } from "../util/functions"

export const Explode = new (class Explode extends DiceFn {
  apply(result: DiceResult, depth: number = 0): DiceResult {
    if(depth > 100) throw `Exploding dice exceeded 100 explosion steps; please try again`
    let explCount = result.rolls.reduce((n,x) => n+(x===result.rollSides?1:0),0)

    if(explCount > 0) {
      let explDie = result.source.clone(explCount, result.rollSides).addFn(this),
          explResult = this.apply(explDie.roll(), depth+1),
          allRolls = [ ...result.rolls, ...explResult.rolls ]
      return {
        ...result,
        rolls: allRolls,
        total: allRolls.reduce(fn.sum, 0),
        prevResults: [explResult, ...result.prevResults||[]],
        modBy: this,
        tag: depth ? `explosion depth ${depth}` : undefined
      }
    }

    return {
      ...result,
      tag: depth ? `explosion depth ${depth}` : undefined
    }
  }
})('!')

export const Advantage = new (class Advantage extends DiceFn {
  apply(result: DiceResult): DiceResult {
    let advRoll = result.source.clone().roll(),
        stripRes = {...result, source: result.source.clone()},
        rolls = [stripRes, advRoll].sort((a,b) => b.total - a.total)
    return {
      ...rolls[0],
      prevResults: [rolls[1], ...result.prevResults||[]],
      modBy: this
    }
  }
})('adv')

export const Disadvantage = new (class Disadvantage extends DiceFn {
  apply(result: DiceResult): DiceResult {
    let advRoll = result.source.clone().roll(),
        stripRes = {...result, source: result.source.clone()},
        rolls = [stripRes, advRoll].sort((a,b) => a.total - b.total)
    return {
      ...rolls[0],
      prevResults: [rolls[1], ...result.prevResults||[]],
      modBy: this
    }
  }
})('dis')

export function DifficultyClass(dc: Expr|number) {
  return new (class DifficultyClass extends DiceFn {
    apply(result: DiceResult): DiceResult {
      let dcRes = (dc instanceof Expr ? dc : dc = new Const(dc)).eval()
      return {
        ...result,
        prevResults: [...dcRes.rolls, ...result.prevResults||[]],
        modBy: this,

        statuses: [
          ...result.statuses||[],
          { text: `DC ${dcRes.value}: ${result.total >= dcRes.value ? 'Pass' : 'Fail'}`, 
            type: 'dc' }
        ]
      }
    }
  })('dc'+dc)
}
