import { Expr, Const } from "../core/expr"
import { DiceResult, DiceFn } from "../core/dice"
import { removeHighest, removeLowest, fn } from "../util"

export function RerollHigh(num: Expr|number) { 
  return new (class RerollHigh extends DiceFn {
    apply(result: DiceResult): DiceResult {
      let rollNum = (num instanceof Expr ? num : num = new Const(num)).eval(),
          keepRolls = removeHighest(result.rolls, rollNum.value),
          stripRes = { ...result, source: result.source.clone() }
          
      if(keepRolls.length === result.rolls.length) return {
        ...result,
        prevResults: [stripRes, ...rollNum.rolls],
        modBy: this
      }

      let rerolled = [
        ...keepRolls,
        ...result.source.clone(rollNum.value).roll().rolls
      ]

      return {
        ...result,
        rolls: rerolled,
        total: rerolled.reduce(fn.sum, 0),
        prevResults: [stripRes, ...rollNum.rolls],
        modBy: this
      }
    }
  })('rh'+num)
}

export function RerollLow(num: Expr|number) { 
  return new (class RerollLow extends DiceFn {
    apply(result: DiceResult): DiceResult {
      let rollNum = (num instanceof Expr ? num : num = new Const(num)).eval(),
          keepRolls = removeLowest(result.rolls, rollNum.value),
          stripRes = { ...result, source: result.source.clone() }
          
      if(keepRolls.length === result.rolls.length) return {
        ...result,
        prevResults: [stripRes, ...rollNum.rolls],
        modBy: this
      }

      let rerolled = [
        ...keepRolls,
        ...result.source.clone(rollNum.value).roll().rolls
      ]

      return {
        ...result,
        rolls: rerolled,
        total: rerolled.reduce(fn.sum, 0),
        prevResults: [stripRes, ...rollNum.rolls],
        modBy: this
      }
    }
  })('rl'+num)
}

export function RerollAbove(num: Expr|number) { 
  return new (class RerollAbove extends DiceFn {
    apply(result: DiceResult): DiceResult {
      let rollNum = (num instanceof Expr ? num : num = new Const(num)).eval(),
          keepRolls = result.rolls.filter(n => n < rollNum.value),
          stripRes = { ...result, source: result.source.clone() }
          
      if(keepRolls.length === result.rolls.length) return {
        ...result,
        prevResults: [stripRes, ...rollNum.rolls],
        modBy: this
      }

      let rerolled = [
        ...keepRolls,
        ...result.source.clone(result.rolls.length - keepRolls.length).roll().rolls
      ]

      return {
        ...result,
        rolls: rerolled,
        total: rerolled.reduce(fn.sum, 0),
        prevResults: [stripRes, ...rollNum.rolls],
        modBy: this
      }
    }
  })('r>'+num)
}

export function RerollAboveRecursive(num: Expr|number) {
  let base = RerollAbove(num)
  return new (class RerollAboveRecursive extends DiceFn {
    apply(result: DiceResult): DiceResult {
      let rollNum = (num instanceof Expr ? num : num = new Const(num)).eval(),
          newRes = base.apply(result)
      while(newRes.rolls.find(r => r >= rollNum.value))
        newRes = base.apply(newRes)

      return {
        ...newRes,
        modBy: this
      }
    }
  })('r!>'+num)
}

export function RerollBelow(num: Expr|number) { 
  return new (class RerollBelow extends DiceFn {
    apply(result: DiceResult): DiceResult {
      let rollNum = (num instanceof Expr ? num : num = new Const(num)).eval(),
          keepRolls = result.rolls.filter(n => n > rollNum.value),
          stripRes = { ...result, source: result.source.clone() }

      if(keepRolls.length === result.rolls.length) return {
        ...result,
        prevResults: [stripRes, ...rollNum.rolls],
        modBy: this
      }

      let rerolled = [
        ...keepRolls,
        ...result.source.clone(result.rolls.length - keepRolls.length).roll().rolls
      ]

      return {
        ...result,
        rolls: rerolled,
        total: rerolled.reduce(fn.sum, 0),
        prevResults: [stripRes, ...rollNum.rolls],
        modBy: this
      }
    }
  })('r<'+num)
}

export function RerollBelowRecursive(num: Expr|number) {
  let base = RerollBelow(num)
  return new (class RerollBelowRecursive extends DiceFn {
    apply(result: DiceResult): DiceResult {
      let rollNum = (num instanceof Expr ? num : num = new Const(num)).eval(),
          newRes = base.apply(result)
      while(newRes.rolls.find(r => r <= rollNum.value))
        newRes = base.apply(newRes)

      return {
        ...newRes,
        modBy: this
      }
    }
  })('r!<'+num)
}
