import { describe, testConsistency } from "../testcore";
import { wildMagicEffects, WildMagic } from "../../fns/wildmagic";
import { BasicDice } from "../../core/dice";
import { Explode, Advantage, Disadvantage, DifficultyClass } from "../../fns/standard";
import { KeepHigh, KeepLow, KeepAbove, KeepBelow } from "../../fns/keep";
import { RerollAbove, RerollBelow, RerollAboveRecursive, RerollBelowRecursive } from "../../fns/reroll";

describe('Dice functions', (it,todo) => {
  it('should properly calculate exploding dice', assert => {
    let exp = new BasicDice(10, 6, [Explode])

    let expRes = testConsistency(() => exp.eval().rolls[0], roll => {
      let maxCount = roll.rolls.reduce((a,b) => a+(b==roll.rollSides?1:0), 0)
      assert.equal(roll.rolls.length, roll.rollCount+maxCount, 'exp roll count')
    })
  })

  it('should properly apply advantage and disadvantage', assert => {
    let adv = new BasicDice(1, 20, [Advantage]), 
        dis = new BasicDice(1, 20, [Disadvantage])

    let advRes = testConsistency(() => adv.eval().rolls[0], roll => {
      assert.equal(roll.prevResults?.length, 1, 'adv results length')
      assert.greaterOrEqual(roll.total, roll.prevResults![0].total, 'adv a>b')
    })
    
    let disRes = testConsistency(() => dis.eval().rolls[0], roll => {
      assert.equal(roll.prevResults?.length, 1, 'dis results length')
      assert.lessOrEqual(roll.total, roll.prevResults![0].total, 'dis a<b')
    })
  })

  it('should properly set statuses for difficulty class', assert => {
    let dc = new BasicDice(1, 20, [DifficultyClass(10)])        

    let dcRes = testConsistency(() => dc.eval().rolls[0], roll => {
      assert.equal(roll.prevResults?.length, 0, 'dc results length')
      assert.equal(roll.statuses?.length, 1, 'dc statuses length')
      assert.equal(roll.statuses![0].type, 'dc', 'dc status type')
      assert.equal(roll.statuses![0].text, `DC 10: ${roll.total >= 10 ? 'Pass' : 'Fail'}`, 'dc status text')
    })
  })

  it('should properly set statuses for wild magic', assert => {
    let wm = new BasicDice(1, 2, [WildMagic])

    const wmEffects = wildMagicEffects.map(s => 'Wild Magic Effect: '+s.replace(/[\{\}]/g, ''))
    let wmRes = testConsistency(() => wm.eval().rolls[0], roll => {
      let isMinRoll = roll.total === roll.source.minimumRoll*roll.rolls.length
      assert.equal(roll.prevResults?.length, 0, 'wm results length')

      if(isMinRoll) {
        assert.equal(roll.statuses?.length, 1, 'wm statuses length')
        assert.equal(roll.statuses![0].type, 'wm', 'wm status type')
        assert.inArray(roll.statuses![0].text, wmEffects, 'wm status text')

        let match = wildMagicEffects[wmEffects.indexOf(roll.statuses![0].text)]
          .match(/\{(\d+d\d+)\}/)
        if(match) {
          assert.equal(roll.statuses![0].rolls?.[0].source.toString(), match[1], 'wm subroll parse')
        }
      } else {
        assert.equal(roll.statuses, undefined, 'wm statuses undefined')
      }
    })
  })

  it('should properly keep the highest/lowest N rolls', assert => {
    let kh = new BasicDice(4, 6, [KeepHigh(3)]),
        kl = new BasicDice(4, 6, [KeepLow(3)])

    let khRes = testConsistency(() => kh.eval().rolls[0], roll => {
      assert.equal(roll.prevResults?.length, 1, 'kh results length')
      assert.equal(roll.rolls.length, 3, 'kh roll count')
      assert.equal(roll.prevResults![0].rolls.length, 4, 'kh prev count')

      let lowRoll = Math.min(...roll.prevResults![0].rolls),
          lowKeep = Math.min(...roll.rolls)
      assert.lessOrEqual(lowRoll, lowKeep, 'kh lowest dropped')
    })

    let klRes = testConsistency(() => kl.eval().rolls[0], roll => {
      assert.equal(roll.prevResults?.length, 1, 'kl results length')
      assert.equal(roll.rolls.length, 3, 'kl roll count')
      assert.equal(roll.prevResults![0].rolls.length, 4, 'kl prev count')

      let highRoll = Math.max(...roll.prevResults![0].rolls),
          highKeep = Math.max(...roll.rolls)
      assert.greaterOrEqual(highRoll, highKeep, 'kl highest dropped')
    })
  })

  it('should properly keep rolls above/below threshold', assert => {
    let kgt = new BasicDice(4, 6, [KeepAbove(3)]),
        klt = new BasicDice(4, 6, [KeepBelow(3)])

    let kgtRes = testConsistency(() => kgt.eval().rolls[0], roll => {
      assert.equal(roll.prevResults?.length, 1, 'kgt results length')
      assert.greaterOrEqual(Math.min(...roll.rolls), 3, 'kgt >=3 kept')
    })

    let kltRes = testConsistency(() => klt.eval().rolls[0], roll => {
      assert.equal(roll.prevResults?.length, 1, 'klt results length')
      assert.lessOrEqual(Math.max(...roll.rolls), 3, 'klt <=3 kept')
    })
  })

  todo('should properly reroll the highest/lowest N rolls')

  it('should properly reroll above/below threshold', assert => {
    let rgt = new BasicDice(10, 4, [RerollAbove(3)]),
        rlt = new BasicDice(10, 4, [RerollBelow(2)])

    let rgtRes = testConsistency(() => rgt.eval().rolls[0], roll => {
      assert.equal(roll.prevResults?.length, 1, 'rgt results length')
      assert.equal(roll.rolls.length, roll.prevResults![0].rolls.length, 'rgt rolls length')
      
      let kept = roll.prevResults![0].rolls.filter(r => r <= 2)
      kept.forEach((r,i) => assert.equal(r, roll.rolls[i], 'rgt rolls kept'))
    })

    let rltRes = testConsistency(() => rlt.eval().rolls[0], roll => {
      assert.equal(roll.prevResults?.length, 1, 'rlt results length')
      assert.equal(roll.rolls.length, roll.prevResults![0].rolls.length, 'rlt rolls length')
      
      let kept = roll.prevResults![0].rolls.filter(r => r >= 3)
      kept.forEach((r,i) => assert.equal(r, roll.rolls[i], 'rlt rolls kept'))
    })
  })

  it('should properly reroll rec. above/below threshold', assert => {
    let rrgt = new BasicDice(10, 4, [RerollAboveRecursive(3)]),
        rrlt = new BasicDice(10, 4, [RerollBelowRecursive(2)])

    let rrgtRes = testConsistency(() => rrgt.eval().rolls[0], roll => {
      assert.equal(roll.prevResults?.length, 1, 'rrgt results length')
      assert.lessOrEqual(Math.max(...roll.rolls), 2, 'rrgt rolls max')
      
      let curr = roll, prev
      while(prev = curr.prevResults?.[0]) {
        assert.equal(curr.rolls.length, prev.rolls.length, 'rrgt rolls length')

        let kept = prev.rolls.filter(r => r <= 2)
        kept.forEach((r,i) => assert.equal(r, roll.rolls[i], 'rrgt rolls kept'))

        curr = prev
      }
    })

    let rrltRes = testConsistency(() => rrlt.eval().rolls[0], roll => {
      assert.equal(roll.prevResults?.length, 1, 'rrlt results length')
      assert.greaterOrEqual(Math.min(...roll.rolls), 3, 'rrlt rolls min')
      
      let curr = roll, prev
      while(prev = curr.prevResults?.[0]) {
        assert.equal(curr.rolls.length, prev.rolls.length, 'rrlt rolls length')

        let kept = prev.rolls.filter(r => r >= 3)
        kept.forEach((r,i) => assert.equal(r, roll.rolls[i], 'rrlt rolls kept'))

        curr = prev
      }
    })
  })
})
