import describe, { testConsistency } from "gruetest"
import { parseExpr, parseExprList } from "../core/parse"
import { Expr } from "../core/expressions"

describe('Expression system', it => {
  it('should properly parse/eval basic expressions', assert => {
    let exprs = {
      const: parseExpr('3'),
      add: parseExpr('3 + 2'),
      sub: parseExpr('3 - 2'),
      mul: parseExpr('3 * 2'),
      mulX: parseExpr('3 x 2'),
      div: parseExpr('3 / 2'),
      mod: parseExpr('3 % 2'),
      pow: parseExpr('3 ^ 2'),
      par: parseExpr('3 * (2+2)'),
    }

    assert.equal(exprs.const.toString(), '3', 'const parse')
    assert.equal(exprs.add.toString(), '3+2', 'add parse')
    assert.equal(exprs.sub.toString(), '3-2', 'sub parse')
    assert.equal(exprs.mul.toString(), '3*2', 'mul parse *')
    assert.equal(exprs.mulX.toString(), '3x2', 'mul parse x')
    assert.equal(exprs.div.toString(), '3/2', 'div parse')
    assert.equal(exprs.mod.toString(), '3%2', 'mod parse')
    assert.equal(exprs.pow.toString(), '3^2', 'pow parse')
    assert.equal(exprs.par.toString(), '3*(2+2)', 'par parse')

    assert.equal(exprs.const.eval().value, 3, 'const eval')
    assert.equal(exprs.add.eval().value, 5, 'add eval')
    assert.equal(exprs.sub.eval().value, 1, 'sub eval')
    assert.equal(exprs.mul.eval().value, 6, 'mul eval *')
    assert.equal(exprs.mulX.eval().value, 6, 'mul eval x')
    assert.equal(exprs.div.eval().value, 1, 'div eval')
    assert.equal(exprs.mod.eval().value, 1, 'mod eval')
    assert.equal(exprs.pow.eval().value, 9, 'pow eval')
    assert.equal(exprs.par.eval().value, 12, 'par eval')
  })

  it('should properly parse/eval expression lists', assert => {
    let [add, sub, mul, div] = parseExprList('3+2, 3-2, 3*2, 3/2')

    assert.equal(add.toString(), '3+2', 'add parse')
    assert.equal(sub.toString(), '3-2', 'sub parse')
    assert.equal(mul.toString(), '3*2', 'mul parse')
    assert.equal(div.toString(), '3/2', 'div parse')

    assert.equal(add.eval().value, 5, 'add eval')
    assert.equal(sub.eval().value, 1, 'sub eval')
    assert.equal(mul.eval().value, 6, 'mul eval')
    assert.equal(div.eval().value, 1, 'div eval')
  })

  it('should properly parse/eval variables', assert => {
    let [simple, modify, asdie1, asdie2] = parseExprList('$test, $test+3, $test;d6, $test d6')

    assert.equal(simple.toString(), '$test;',   'simple parse')
    assert.equal(modify.toString(), '$test;+3', 'modify parse')
    assert.equal(asdie1.toString(), '$test;d6', 'asdie1 parse')
    assert.equal(asdie2.toString(), '$test;d6', 'asdie2 parse')

    assert.equal(simple.toString(Expr.simplifyCtx({ test: 4 })), '(4)',   'simple parse ctx')
    assert.equal(modify.toString(Expr.simplifyCtx({ test: 4 })), '(4)+3', 'modify parse ctx')
    assert.equal(asdie1.toString(Expr.simplifyCtx({ test: 4 })), '(4)d6', 'asdie1 parse ctx')
    assert.equal(asdie2.toString(Expr.simplifyCtx({ test: 4 })), '(4)d6', 'asdie2 parse ctx')
    
    assert.equal(simple.eval({ test: 4 }).value, 4, 'simple eval')
    assert.equal(modify.eval({ test: 4 }).value, 7, 'modify eval')
    assert.inRange(asdie1.eval({ test: 4 }).value, 4, 24, 'asdie1 eval')
    assert.inRange(asdie2.eval({ test: 4 }).value, 4, 24, 'asdie2 eval')
  })

  it('should properly parse/eval dice notation', assert => {
    let exprs = {
      base: parseExpr('4d6'),
      fate: parseExpr('4dF'),
      perc: parseExpr('4d%'),
      exp: parseExpr('4d6!'),
      adv: parseExpr('1d6adv'),
      dis: parseExpr('1d6dis'),
      dc: parseExpr('4d6 dc10'),
      wm: parseExpr('4d6 wm'),

      kh: parseExpr('4d6kh3'),
      kl: parseExpr('4d6kl3'),
      kgt: parseExpr('4d6k>3'),
      klt: parseExpr('4d6k<3'),
      rh: parseExpr('2d6rh1'),
      rl: parseExpr('2d6rl1'),
      rgt: parseExpr('2d6r>3'),
      rlt: parseExpr('2d6r<3'),
      rrgt: parseExpr('2d6r!>3'),
      rrlt: parseExpr('2d6r!<3'),
    }

    assert.equal(exprs.base.toString(), '4d6', 'base parse')
    assert.equal(exprs.fate.toString(), '4dF', 'fate parse')
    assert.equal(exprs.perc.toString(), '4d100', 'percent parse')
    assert.equal(exprs.exp.toString(), '4d6!', 'exp parse')
    assert.equal(exprs.adv.toString(), '1d6adv', 'adv parse')
    assert.equal(exprs.dis.toString(), '1d6dis', 'dis parse')
    assert.equal(exprs.dc.toString(), '4d6 dc10', 'dc parse')
    assert.equal(exprs.wm.toString(), '4d6 wm', 'wm parse')

    assert.equal(exprs.kh.toString(), '4d6kh3', 'kh parse')
    assert.equal(exprs.kl.toString(), '4d6kl3', 'kl parse')
    assert.equal(exprs.kgt.toString(), '4d6k>3', 'kgt parse')
    assert.equal(exprs.klt.toString(), '4d6k<3', 'klt parse')
    assert.equal(exprs.rh.toString(), '2d6rh1', 'rh parse')
    assert.equal(exprs.rl.toString(), '2d6rl1', 'rl parse')
    assert.equal(exprs.rgt.toString(), '2d6r>3', 'rgt parse')
    assert.equal(exprs.rlt.toString(), '2d6r<3', 'rlt parse')
    assert.equal(exprs.rrgt.toString(), '2d6r!>3', 'rrgt parse')
    assert.equal(exprs.rrlt.toString(), '2d6r!<3', 'rrlt parse')
    
    let results = {
      base: testConsistency(() => exprs.base.eval(), r => assert.inRange(r.value, 4, 24, 'base consistency')),
      fate: testConsistency(() => exprs.fate.eval(), r => assert.inRange(r.value, -4, 4, 'fate consistency')),
      exp:  testConsistency(() => exprs.exp.eval(),  r => assert.greaterOrEqual(r.value, 4, 'exp consistency')),
      adv:  testConsistency(() => exprs.adv.eval(),  r => assert.inRange(r.value, 1, 6, 'adv consistency')),
      dis:  testConsistency(() => exprs.dis.eval(),  r => assert.inRange(r.value, 1, 6, 'dis consistency')),
      dc:   testConsistency(() => exprs.dc.eval(),   r => assert.inRange(r.value, 4, 24, 'dc consistency')),
      wm:   testConsistency(() => exprs.wm.eval(),   r => assert.inRange(r.value, 4, 24, 'wm consistency')),

      kh:   testConsistency(() => exprs.kh.eval(),   r => assert.inRange(r.value, 3, 18, 'kh consistency')),
      kl:   testConsistency(() => exprs.kl.eval(),   r => assert.inRange(r.value, 3, 18, 'kl consistency')),
      kgt:  testConsistency(() => exprs.kgt.eval(),  r => assert.inRange(r.value, 0, 24, 'kgt consistency')),
      klt:  testConsistency(() => exprs.klt.eval(),  r => assert.inRange(r.value, 0, 12, 'klt consistency')),
      rh:   testConsistency(() => exprs.rh.eval(),   r => assert.inRange(r.value, 2, 12, 'rh consistency')),
      rl:   testConsistency(() => exprs.rl.eval(),   r => assert.inRange(r.value, 2, 12, 'rl consistency')),
      rgt:  testConsistency(() => exprs.rgt.eval(),  r => assert.inRange(r.value, 2, 12, 'rgt consistency')),
      rlt:  testConsistency(() => exprs.rlt.eval(),  r => assert.inRange(r.value, 2, 12, 'rlt consistency')),
      rrgt: testConsistency(() => exprs.rrgt.eval(), r => assert.inRange(r.value, 2, 4, 'rrgt consistency')),
      rrlt: testConsistency(() => exprs.rrlt.eval(), r => assert.inRange(r.value, 8, 12, 'rrlt consistency')),
    }

    let rnums = Object.entries(results)
      .map(([k,v]) => ({ [k]: v.map(r=>r.value) }))
      .reduce((a,b) => ({...a,...b})) as unknown as {[k in keyof typeof results]: number[]}

    assert.equal(Math.min(...rnums.base), 4, 'base min')
    assert.equal(Math.max(...rnums.base), 24, 'base max')
    assert.equal(Math.min(...rnums.fate), -4, 'fate min')
    assert.equal(Math.max(...rnums.fate), 4, 'fate max')
    assert.equal(Math.min(...rnums.exp), 4, 'exp min')
    assert.equal(Math.min(...rnums.adv), 1, 'adv min')
    assert.equal(Math.max(...rnums.adv), 6, 'adv max')
    assert.equal(Math.min(...rnums.dis), 1, 'dis min')
    assert.equal(Math.max(...rnums.dis), 6, 'dis max')
    assert.equal(Math.min(...rnums.dc), 4, 'dc min')
    assert.equal(Math.max(...rnums.dc), 24, 'dc max')
    assert.equal(Math.min(...rnums.wm), 4, 'wm min')
    assert.equal(Math.max(...rnums.wm), 24, 'wm max')

    assert.equal(Math.min(...rnums.kh), 3, 'kh min')
    assert.equal(Math.max(...rnums.kh), 18, 'kh max')
    assert.equal(Math.min(...rnums.kl), 3, 'kl min')
    assert.equal(Math.max(...rnums.kl), 18, 'kl max')
    assert.equal(Math.min(...rnums.kgt), 0, 'kgt min')
    assert.equal(Math.max(...rnums.kgt), 24, 'kgt max')
    assert.equal(Math.min(...rnums.klt), 0, 'klt min')
    assert.equal(Math.max(...rnums.klt), 12, 'klt max')
    assert.equal(Math.min(...rnums.rh), 2, 'rh min')
    assert.equal(Math.max(...rnums.rh), 12, 'rh max')
    assert.equal(Math.min(...rnums.rl), 2, 'rl min')
    assert.equal(Math.max(...rnums.rl), 12, 'rl max')
    assert.equal(Math.min(...rnums.rgt), 2, 'rgt min')
    assert.equal(Math.max(...rnums.rgt), 12, 'rgt max')
    assert.equal(Math.min(...rnums.rlt), 2, 'rlt min')
    assert.equal(Math.max(...rnums.rlt), 12, 'rlt max')
    assert.equal(Math.min(...rnums.rrgt), 2, 'rrgt min')
    assert.equal(Math.max(...rnums.rrgt), 4, 'rrgt max')
    assert.equal(Math.min(...rnums.rrlt), 8, 'rrlt min')
    assert.equal(Math.max(...rnums.rrlt), 12, 'rrlt max')
  })
})
