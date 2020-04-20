import { describe, testConsistency } from "../testcore";
import { wildMagicEffects } from "../../opdefs/dnd5e";
import { parseExpr, parseExprList } from "../../core/parse";
import { DiceResult } from "../../core/expressions";
import { Op } from '../../core/operators'

describe('Dice functions', (it,todo) => {
  it('should properly calculate exploding dice', assert => {
    let exp = parseExpr('10d6!')

    let expRes = testConsistency(() => exp.eval() as DiceResult, roll => {
      let maxCount = roll.rolls.reduce((a,b) => a+(b==roll.maxRoll?1:0), 0)
      assert.equal(roll.rolls.length, roll.rollCount+maxCount, 'exp roll count')
    })
  })

  it('should properly apply advantage and disadvantage', assert => {
    let [adv, dis] = parseExprList('1d20adv, 1d20dis')

    let advRes = testConsistency(() => adv.eval() as DiceResult, roll => {
      assert.equal(roll.prev?.length, 1, 'adv results length')
      assert.greaterOrEqual(roll.value, roll.prev?.[0].value, 'adv a>b')
    })
    
    let disRes = testConsistency(() => dis.eval() as DiceResult, roll => {
      assert.equal(roll.prev?.length, 1, 'dis results length')
      assert.lessOrEqual(roll.value, roll.prev?.[0].value, 'dis a<b')
    })
  })

  it('should properly set statuses for difficulty class', assert => {
    let dc = parseExpr('1d20 dc10')

    let dcRes = testConsistency(() => dc.eval() as DiceResult, roll => {
      assert.equal(roll.statuses?.length, 1, 'dc statuses length')
      assert.equal(roll.statuses?.[0].fromOp, 'difficulty_class', 'dc status type')
      assert.equal(roll.statuses?.[0].text, roll.value >= 10 ? 'Pass' : 'Fail', 'dc status text')
    })
  })

  it('should properly set statuses for wild magic', assert => {
    let wm = parseExpr('1d2wm')

    const wmEffects = wildMagicEffects.map(s => s.replace(/[\{\}]/g, ''))
    let wmRes = testConsistency(() => wm.eval() as DiceResult, roll => {
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
      assert.equal(roll.rolls.length, 3, 'kh roll count')
      assert.equal((roll.prev![0] as DiceResult).rolls.length, 4, 'kh prev count')

      let lowRoll = Math.min(...(roll.prev![0] as DiceResult).rolls),
          lowKeep = Math.min(...roll.rolls)
      assert.lessOrEqual(lowRoll, lowKeep, 'kh lowest dropped')
    })

    let klRes = testConsistency(() => kl.eval() as DiceResult, roll => {
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
      assert.greaterOrEqual(Math.min(...roll.rolls), 3, 'kgt >=3 kept')
    })

    let kltRes = testConsistency(() => klt.eval() as DiceResult, roll => {
      assert.lessOrEqual(Math.max(...roll.rolls), 3, 'klt <=3 kept')
    })
  })

  todo('should properly reroll the highest/lowest N rolls')

  it('should properly reroll above/below threshold', assert => {
    let [rgt, rlt] = parseExprList('10d4r>3, 10d4r<2')

    let rgtRes = testConsistency(() => rgt.eval() as DiceResult, roll => {
      assert.equal(roll.rolls.length, (roll.prev![0] as DiceResult).rolls.length, 'rgt rolls length')
      
      let kept = (roll.prev![0] as DiceResult).rolls.filter(r => r <= 2)
      kept.forEach((r,i) => assert.equal(r, roll.rolls[i], 'rgt rolls kept'))
    })

    let rltRes = testConsistency(() => rlt.eval() as DiceResult, roll => {
      assert.equal(roll.rolls.length, (roll.prev![0] as DiceResult).rolls.length, 'rlt rolls length')
      
      let kept = (roll.prev![0] as DiceResult).rolls.filter(r => r >= 3)
      kept.forEach((r,i) => assert.equal(r, roll.rolls[i], 'rlt rolls kept'))
    })
  })

  it('should properly reroll rec. above/below threshold', assert => {
    let [rrgt, rrlt] = parseExprList('10d4r!>3, 10d4r!<2')

    let rrgtRes = testConsistency(() => rrgt.eval() as DiceResult, roll => {
      assert.lessOrEqual(Math.max(...roll.rolls), 2, 'rrgt rolls max')
      
      let curr = roll, prev
      while(prev = curr.prev?.[0] as DiceResult) {
        assert.equal(curr.rolls.length, prev.rolls.length, 'rrgt rolls length')

        let kept = prev.rolls.filter(r => r <= 2)
        kept.forEach((r,i) => assert.equal(r, roll.rolls[i], 'rrgt rolls kept'))

        curr = prev
      }
    })

    let rrltRes = testConsistency(() => rrlt.eval() as DiceResult, roll => {
      assert.greaterOrEqual(Math.min(...roll.rolls), 3, 'rrlt rolls min')
      
      let curr = roll, prev
      while(prev = curr.prev?.[0] as DiceResult) {
        assert.equal(curr.rolls.length, prev.rolls.length, 'rrlt rolls length')

        let kept = prev.rolls.filter(r => r >= 3)
        kept.forEach((r,i) => assert.equal(r, roll.rolls[i], 'rrlt rolls kept'))

        curr = prev
      }
    })
  })
})
