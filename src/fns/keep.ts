import { Expr, Const } from "../core/expr"
import { DiceResult, DiceFn } from "../core/dice"
import { removeLowest, removeHighest, fn } from "../util/functions"

export function KeepHigh(num: Expr|number) { 
  return new (class KeepHigh extends DiceFn {
    apply(result: DiceResult): DiceResult {
      let keepNum = (num instanceof Expr ? num : num = new Const(num)).eval(),
          keepRolls = removeLowest(result.rolls, result.rolls.length-keepNum.value),
          stripRes = { ...result, source: result.source.clone() }
      return {
        ...result,
        rolls: keepRolls,
        total: keepRolls.reduce(fn.sum, 0),
        prevResults: [stripRes, ...keepNum.rolls],
        modBy: this
      }
    }
  })('kh'+num)
}

export function KeepLow(num: Expr|number) { 
  return new (class KeepLow extends DiceFn {
    apply(result: DiceResult): DiceResult {
      let keepNum = (num instanceof Expr ? num : num = new Const(num)).eval(),
          keepRolls = removeHighest(result.rolls, result.rolls.length-keepNum.value),
          stripRes = { ...result, source: result.source.clone() }
      return {
        ...result,
        rolls: keepRolls,
        total: keepRolls.reduce(fn.sum, 0),
        prevResults: [stripRes, ...keepNum.rolls],
        modBy: this
      }
    }
  })('kl'+num)
}

export function KeepAbove(num: Expr|number) { 
  return new (class KeepAbove extends DiceFn {
    apply(result: DiceResult): DiceResult {
      let keepNum = (num instanceof Expr ? num : num = new Const(num)).eval(),
          keepRolls = result.rolls.filter(n => n >= keepNum.value),
          stripRes = { ...result, source: result.source.clone() }
      return {
        ...result,
        rolls: keepRolls,
        total: keepRolls.reduce(fn.sum, 0),
        prevResults: [stripRes, ...keepNum.rolls],
        modBy: this
      }
    }
  })('k>'+num)
}

export function KeepBelow(num: Expr|number) { 
  return new (class KeepBelow extends DiceFn {
    apply(result: DiceResult): DiceResult {
      let keepNum = (num instanceof Expr ? num : num = new Const(num)).eval(),
          keepRolls = result.rolls.filter(n => n <= keepNum.value),
          stripRes = { ...result, source: result.source.clone() }
      return {
        ...result,
        rolls: keepRolls,
        total: keepRolls.reduce(fn.sum, 0),
        prevResults: [stripRes, ...keepNum.rolls],
        modBy: this
      }
    }
  })('k<'+num)
}
