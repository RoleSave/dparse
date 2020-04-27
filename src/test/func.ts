import describe, { testConsistency } from "gruetest";
import { wildMagicEffects } from "../opdefs/dnd5e";
import { isDiceResult, Op, parseExpr, parseExprList } from "../index";
import { DiceResult } from '../core/expressions'
import { removeHighest, removeLowest } from "../util/functions";

describe('Dice functions', (it,todo) => {
  it('should properly calculate exploding dice', assert => {
    let exp = parseExpr('10d6!')

    let expRes = testConsistency(() => exp.eval() as DiceResult, roll => {
      assert.equal(roll.prev.length, 1, 'explode prev length')
      let maxCount = roll.rolls.reduce((a,b) => a+(b==roll.maxRoll?1:0), 0)
      assert.equal(roll.rolls.length, roll.rollCount+maxCount, 'exp roll count')
    })
  })

  it('should properly apply advantage and disadvantage', assert => {
    let [adv, dis] = parseExprList('1d20adv, 1d20dis')

    let advRes = testConsistency(() => adv.eval() as DiceResult, roll => {
      assert.equal(roll.prev.length, 2, 'adv prev length')
      assert.greaterOrEqual(roll.value, roll.prev?.[0].value, 'adv a>b')
    })
    
    let disRes = testConsistency(() => dis.eval() as DiceResult, roll => {
      assert.equal(roll.prev.length, 2, 'dis prev length')
      assert.lessOrEqual(roll.value, roll.prev?.[0].value, 'dis a<b')
    })
  })

  it('should properly set statuses for difficulty class', assert => {
    let dc = parseExpr('1d20 dc10')

    let dcRes = testConsistency(() => dc.eval() as DiceResult, roll => {
      assert.equal(roll.prev.length, 2, 'dc prev length')
      assert.equal(roll.statuses?.length, 1, 'dc statuses length')
      assert.equal(roll.statuses?.[0].fromOp, 'difficulty_class', 'dc status type')
      assert.equal(roll.statuses?.[0].text, roll.value >= 10 ? 'Pass' : 'Fail', 'dc status text')
    })
  })

  it('should properly set statuses for wild magic', assert => {
    let wm = parseExpr('1d2wm')

    const wmEffects = wildMagicEffects.map(s => s.replace(/[\{\}]/g, ''))
    let wmRes = testConsistency(() => wm.eval() as DiceResult, roll => {
      assert.equal(roll.prev.length, 1, 'wm prev length')
      let min = (roll.source as Op).def.name === 'dice_fate' ? -1 : 1

      if(roll.value === roll.rolls.length * (typeof roll.minRoll !== 'undefined' ? roll.minRoll : 1)) {
        assert.equal(roll.statuses?.length, 1, 'wm statuses length')
        assert.equal(roll.statuses![0].fromOp, 'wild_magic', 'wm status type')
        assert.inArray(roll.statuses![0].text, wmEffects, 'wm status text')

        let match = wildMagicEffects[wmEffects.indexOf(roll.statuses![0].text)]
          .match(/\{(\d+d\d+)\}/)
        if(match) {
          assert.equal(roll.statuses![0].results?.[0].source.toString(), match[1], 'wm subroll parse')
        }
      } else {
        assert.equal(roll.statuses, undefined, 'wm statuses undefined')
      }
    })
  })

  it('should properly keep the highest/lowest N rolls', assert => {
    let [kh, kl] = parseExprList('4d6kh3, 4d6kl3')

    let khRes = testConsistency(() => kh.eval() as DiceResult, roll => {
      assert.equal(roll.prev.length, 2, 'kh prev length')
      assert.equal(roll.rolls.length, 3, 'kh roll count')
      assert.equal((roll.prev![0] as DiceResult).rolls.length, 4, 'kh prev count')

      let lowRoll = Math.min(...(roll.prev![0] as DiceResult).rolls),
          lowKeep = Math.min(...roll.rolls)
      assert.lessOrEqual(lowRoll, lowKeep, 'kh lowest dropped')
    })

    let klRes = testConsistency(() => kl.eval() as DiceResult, roll => {
      assert.equal(roll.prev.length, 2, 'kl prev length')
      assert.equal(roll.rolls.length, 3, 'kl roll count')
      assert.equal((roll.prev![0] as DiceResult).rolls.length, 4, 'kl prev count')

      let highRoll = Math.max(...(roll.prev![0] as DiceResult).rolls),
          highKeep = Math.max(...roll.rolls)
      assert.greaterOrEqual(highRoll, highKeep, 'kl highest dropped')
    })
  })

  it('should properly keep rolls above/below threshold', assert => {
    let [kgt, klt] = parseExprList('4d6k>3, 4d6k<3')

    let kgtRes = testConsistency(() => kgt.eval() as DiceResult, roll => {
      assert.equal(roll.prev.length, 2, 'kgt prev length')
      assert.greaterOrEqual(Math.min(...roll.rolls), 3, 'kgt >=3 kept')
    })

    let kltRes = testConsistency(() => klt.eval() as DiceResult, roll => {
      assert.equal(roll.prev.length, 2, 'klt prev length')
      assert.lessOrEqual(Math.max(...roll.rolls), 3, 'klt <=3 kept')
    })
  })

  it('should properly reroll the highest/lowest N rolls', assert => {
    let [rh, rl] = parseExprList('10d6rh5, 10d6rl5')

    let rhRes = testConsistency(() => rh.eval() as DiceResult, roll => {
      assert.equal(roll.prev.length, 2, 'rh prev length')
      assert.equal(roll.rolls.length, (roll.prev![0] as DiceResult).rolls.length, 'rh rolls length')

      let kept = removeHighest((roll.prev![0] as DiceResult).rolls, 5)
      kept.forEach((r,i) => assert.equal(r, roll.rolls[i]))
    })
    
    let rlRes = testConsistency(() => rl.eval() as DiceResult, roll => {
      assert.equal(roll.prev.length, 2, 'rl prev length')
      assert.equal(roll.rolls.length, (roll.prev![0] as DiceResult).rolls.length, 'rl rolls length')
      
      let kept = removeLowest((roll.prev![0] as DiceResult).rolls, 5)
      kept.forEach((r,i) => assert.equal(r, roll.rolls[i]))
    })
  })

  it('should properly reroll above/below threshold', assert => {
    let [rgt, rlt] = parseExprList('10d4r>3, 10d4r<2')

    let rgtRes = testConsistency(() => rgt.eval() as DiceResult, roll => {
      assert.equal(roll.prev.length, 2, 'r> prev length')
      assert.equal(roll.rolls.length, (roll.prev![0] as DiceResult).rolls.length, 'rgt rolls length')
      
      let kept = (roll.prev![0] as DiceResult).rolls.filter(r => r <= 2)
      kept.forEach((r,i) => assert.equal(r, roll.rolls[i], 'rgt rolls kept'))
    })

    let rltRes = testConsistency(() => rlt.eval() as DiceResult, roll => {
      assert.equal(roll.prev.length, 2, 'r< prev length')
      assert.equal(roll.rolls.length, (roll.prev![0] as DiceResult).rolls.length, 'rlt rolls length')
      
      let kept = (roll.prev![0] as DiceResult).rolls.filter(r => r >= 3)
      kept.forEach((r,i) => assert.equal(r, roll.rolls[i], 'rlt rolls kept'))
    })
  })

  it('should properly reroll rec. above/below threshold', assert => {
    let [rrgt, rrlt] = parseExprList('10d4r!>3, 10d4r!<2')

    let rrgtRes = testConsistency(() => rrgt.eval() as DiceResult, roll => {
      assert.equal(roll.prev.length, 2, 'r!> prev length')
      assert.lessOrEqual(Math.max(...roll.rolls), 2, 'rrgt rolls max')
      
      let curr = roll, prev
      while((prev = curr.prev[0]) && isDiceResult(prev) && prev.source.def.name === 'reroll_above_rec') {
        assert.equal(curr.prev.length, 2, 'r!> rec prev length')
        assert.equal(curr.rolls.length, prev.rolls.length, 'rrgt rolls length')

        let kept = prev.rolls.filter(r => r <= 2)
        kept.forEach((r,i) => assert.equal(r, roll.rolls[i], 'rrgt rolls kept'))

        curr = prev
      }
    })

    let rrltRes = testConsistency(() => rrlt.eval() as DiceResult, roll => {
      assert.equal(roll.prev.length, 2, 'r!< prev length')
      assert.greaterOrEqual(Math.min(...roll.rolls), 3, 'rrlt rolls min')
      
      let curr = roll, prev
      while((prev = curr.prev[0]) && isDiceResult(prev) && prev.source.def.name === 'reroll_below_rec') {
        assert.equal(roll.prev.length, 2, 'r!< rec prev length')
        assert.equal(curr.rolls.length, prev.rolls.length, 'rrlt rolls length')

        let kept = prev.rolls.filter(r => r >= 3)
        kept.forEach((r,i) => assert.equal(r, roll.rolls[i], 'rrlt rolls kept'))

        curr = prev
      }
    })
  })
})
