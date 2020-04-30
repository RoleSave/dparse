import describe, { testConsistency } from "gruetest"
import { Expr, parseExpr, parseExprList } from "../index"
import { TakeFromList } from "../core/expressions"

describe('Expression system', it => {
  it('should properly parse/eval basic expressions', assert => {
    let exprs = {
      num: parseExpr('3'),
      add: parseExpr('3 + 2'),
      sub: parseExpr('3 - 2'),
      mul: parseExpr('3 * 2'),
      mlx: parseExpr('3 x 2'),
      div: parseExpr('3 / 2'),
      mod: parseExpr('3 % 2'),
      pow: parseExpr('3 ^ 2'),
      par: parseExpr('3 * (2+2)'),
      neg: parseExpr('-2'),
      ang: parseExpr('3+-2'),
      sng: parseExpr('3--2'),
      mng: parseExpr('3*-2'),
      dng: parseExpr('3/-2'),
    }

    assert.equal(exprs.num.toString(), '3',       'const parse')
    assert.equal(exprs.add.toString(), '3+2',     'add parse')
    assert.equal(exprs.sub.toString(), '3-2',     'sub parse')
    assert.equal(exprs.mul.toString(), '3*2',     'mul parse *')
    assert.equal(exprs.mlx.toString(), '3x2',     'mul parse x')
    assert.equal(exprs.div.toString(), '3/2',     'div parse')
    assert.equal(exprs.mod.toString(), '3%2',     'mod parse')
    assert.equal(exprs.pow.toString(), '3^2',     'pow parse')
    assert.equal(exprs.par.toString(), '3*(2+2)', 'par parse')
    assert.equal(exprs.neg.toString(), '-2',      'neg parse')
    assert.equal(exprs.ang.toString(), '3+-2',    'ang parse')
    assert.equal(exprs.sng.toString(), '3--2',    'sng parse')
    assert.equal(exprs.mng.toString(), '3*-2',    'mng parse')
    assert.equal(exprs.dng.toString(), '3/-2',    'dng parse')

    assert.equal(exprs.num.eval().value, 3,  'const eval')
    assert.equal(exprs.add.eval().value, 5,  'add eval')
    assert.equal(exprs.sub.eval().value, 1,  'sub eval')
    assert.equal(exprs.mul.eval().value, 6,  'mul eval *')
    assert.equal(exprs.mlx.eval().value, 6,  'mul eval x')
    assert.equal(exprs.div.eval().value, 1,  'div eval')
    assert.equal(exprs.mod.eval().value, 1,  'mod eval')
    assert.equal(exprs.pow.eval().value, 9,  'pow eval')
    assert.equal(exprs.par.eval().value, 12, 'par eval')
    assert.equal(exprs.neg.eval().value, -2, 'neg eval')
    assert.equal(exprs.ang.eval().value, 1,  'ang eval')
    assert.equal(exprs.sng.eval().value, 5,  'sng eval')
    assert.equal(exprs.mng.eval().value, -6, 'mng eval')
    assert.equal(exprs.dng.eval().value, -2, 'dng eval')
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

  it('should properly parse/eval list selection', assert => {
    let [slctList,takeList] = parseExprList('[15,14,13,12,10,8], {15,14,13,12,10,8}')
    assert.equal(slctList.toString(), '[15, 14, 13, 12, 10, 8]', 'slctlist parse')
    assert.equal(takeList.toString(), '{15, 14, 13, 12, 10, 8}', 'slctlist parse')

    let arr = [15,14,13,12,10,8]
    testConsistency(() => slctList.eval(), result => {
      assert.inArray(result.value, arr, 'sellist eval')
    })

    while((takeList as TakeFromList).list.length > 0) {
      assert.inArray(takeList.eval().value, arr, 'takelist eval')
      arr = (takeList as TakeFromList).list.map(e => e.eval().value)
    }

    assert.equal(takeList.toString(), '{15, 14, 13, 12, 10, 8}', 'takelist parse after')
    assert.equal(arr.length, 0, 'takelist length after')
    assert.matchPred(takeList.eval().value, isNaN, 'takelist eval after')
  })

  it('should properly parse/eval dice notation', assert => {
    let exprs = {
      dbs: parseExpr('4d6'),
      dft: parseExpr('4dF'),
      dpc: parseExpr('4d%'),
      exp: parseExpr('4d6!'),
      adv: parseExpr('1d6adv'),
      dis: parseExpr('1d6dis'),
      dcl: parseExpr('4d6 dc10'),
      wmg: parseExpr('4d6 wm'),

      khi: parseExpr('4d6kh3'),
      klo: parseExpr('4d6kl3'),
      kgt: parseExpr('4d6k>3'),
      klt: parseExpr('4d6k<3'),
      rhi: parseExpr('2d6rh1'),
      rlo: parseExpr('2d6rl1'),
      rgt: parseExpr('2d6r>3'),
      rlt: parseExpr('2d6r<3'),
      rgr: parseExpr('2d6r!>3'),
      rlr: parseExpr('2d6r!<3'),
    }

    assert.equal(exprs.dbs.toString(), '4d6',      'dbs parse')
    assert.equal(exprs.dft.toString(), '4dF',      'dft parse')
    assert.equal(exprs.dpc.toString(), '4d100',    'dpc parse')
    assert.equal(exprs.exp.toString(), '4d6!',     'exp parse')
    assert.equal(exprs.adv.toString(), '1d6adv',   'adv parse')
    assert.equal(exprs.dis.toString(), '1d6dis',   'dis parse')
    assert.equal(exprs.dcl.toString(), '4d6 dc10', 'dcl parse')
    assert.equal(exprs.wmg.toString(), '4d6 wm',   'wmg parse')

    assert.equal(exprs.khi.toString(), '4d6kh3',  'khi parse')
    assert.equal(exprs.klo.toString(), '4d6kl3',  'klo parse')
    assert.equal(exprs.kgt.toString(), '4d6k>3',  'kgt parse')
    assert.equal(exprs.klt.toString(), '4d6k<3',  'klt parse')
    assert.equal(exprs.rhi.toString(), '2d6rh1',  'rhi parse')
    assert.equal(exprs.rlo.toString(), '2d6rl1',  'rlo parse')
    assert.equal(exprs.rgt.toString(), '2d6r>3',  'rgt parse')
    assert.equal(exprs.rlt.toString(), '2d6r<3',  'rlt parse')
    assert.equal(exprs.rgr.toString(), '2d6r!>3', 'rgr parse')
    assert.equal(exprs.rlr.toString(), '2d6r!<3', 'rlr parse')
    
    let results = {
      dbs: testConsistency(() => exprs.dbs.eval(), r => assert.inRange(r.value, 4, 24, 'dbs consistency')),
      dft: testConsistency(() => exprs.dft.eval(), r => assert.inRange(r.value, -4, 4, 'dft consistency')),
      adv: testConsistency(() => exprs.adv.eval(), r => assert.inRange(r.value, 1, 6,  'adv consistency')),
      dis: testConsistency(() => exprs.dis.eval(), r => assert.inRange(r.value, 1, 6,  'dis consistency')),
      dcl: testConsistency(() => exprs.dcl.eval(), r => assert.inRange(r.value, 4, 24, 'dcl consistency')),
      wmg: testConsistency(() => exprs.wmg.eval(), r => assert.inRange(r.value, 4, 24, 'wmg consistency')),
      exp: testConsistency(() => exprs.exp.eval(), r => assert.greaterOrEqual(r.value, 4, 'exp consistency')),

      khi: testConsistency(() => exprs.khi.eval(), r => assert.inRange(r.value, 3, 18, 'khi consistency')),
      klo: testConsistency(() => exprs.klo.eval(), r => assert.inRange(r.value, 3, 18, 'klo consistency')),
      kgt: testConsistency(() => exprs.kgt.eval(), r => assert.inRange(r.value, 0, 24, 'kgt consistency')),
      klt: testConsistency(() => exprs.klt.eval(), r => assert.inRange(r.value, 0, 12, 'klt consistency')),
      rhi: testConsistency(() => exprs.rhi.eval(), r => assert.inRange(r.value, 2, 12, 'rhi consistency')),
      rlo: testConsistency(() => exprs.rlo.eval(), r => assert.inRange(r.value, 2, 12, 'rlo consistency')),
      rgt: testConsistency(() => exprs.rgt.eval(), r => assert.inRange(r.value, 2, 12, 'rgt consistency')),
      rlt: testConsistency(() => exprs.rlt.eval(), r => assert.inRange(r.value, 2, 12, 'rlt consistency')),
      rgr: testConsistency(() => exprs.rgr.eval(), r => assert.inRange(r.value, 2, 4,  'rgr consistency')),
      rlr: testConsistency(() => exprs.rlr.eval(), r => assert.inRange(r.value, 8, 12, 'rlr consistency')),
    }

    let rnums = Object.entries(results)
      .map(([k,v]) => ({ [k]: v.map(r=>r.value) }))
      .reduce((a,b) => ({...a,...b})) as unknown as {[k in keyof typeof results]: number[]}

    assert.equal(Math.min(...rnums.dbs), 4,  'dbs min')
    assert.equal(Math.max(...rnums.dbs), 24, 'dbs max')
    assert.equal(Math.min(...rnums.dft), -4, 'dft min')
    assert.equal(Math.max(...rnums.dft), 4,  'dft max')
    assert.equal(Math.min(...rnums.exp), 4,  'exp min')
    assert.equal(Math.min(...rnums.adv), 1,  'adv min')
    assert.equal(Math.max(...rnums.adv), 6,  'adv max')
    assert.equal(Math.min(...rnums.dis), 1,  'dis min')
    assert.equal(Math.max(...rnums.dis), 6,  'dis max')
    assert.equal(Math.min(...rnums.dcl), 4,  'dcl min')
    assert.equal(Math.max(...rnums.dcl), 24, 'dcl max')
    assert.equal(Math.min(...rnums.wmg), 4,  'wmg min')
    assert.equal(Math.max(...rnums.wmg), 24, 'wmg max')

    assert.equal(Math.min(...rnums.khi), 3,  'khi min')
    assert.equal(Math.max(...rnums.khi), 18, 'khi max')
    assert.equal(Math.min(...rnums.klo), 3,  'klo min')
    assert.equal(Math.max(...rnums.klo), 18, 'klo max')
    assert.equal(Math.min(...rnums.kgt), 0,  'kgt min')
    assert.equal(Math.max(...rnums.kgt), 24, 'kgt max')
    assert.equal(Math.min(...rnums.klt), 0,  'klt min')
    assert.equal(Math.max(...rnums.klt), 12, 'klt max')
    assert.equal(Math.min(...rnums.rhi), 2,  'rhi min')
    assert.equal(Math.max(...rnums.rhi), 12, 'rhi max')
    assert.equal(Math.min(...rnums.rlo), 2,  'rlo min')
    assert.equal(Math.max(...rnums.rlo), 12, 'rlo max')
    assert.equal(Math.min(...rnums.rgt), 2,  'rgt min')
    assert.equal(Math.max(...rnums.rgt), 12, 'rgt max')
    assert.equal(Math.min(...rnums.rlt), 2,  'rlt min')
    assert.equal(Math.max(...rnums.rlt), 12, 'rlt max')
    assert.equal(Math.min(...rnums.rgr), 2,  'rgr min')
    assert.equal(Math.max(...rnums.rgr), 4,  'rgr max')
    assert.equal(Math.min(...rnums.rlr), 8,  'rlr min')
    assert.equal(Math.max(...rnums.rlr), 12, 'rlr max')
  })

  it('should throw expected parser errors', assert => {
    assert.throws(() => parseExpr('$'), e => e === 'Expected variable name after $')
    assert.throws(() => parseExpr('asdfasdf'), e => e === 'Unexpected token a when parsing asdfasdf')

    assert.throws(() => parseExpr(''), e => e === 'Cannot parse empty expression')
    assert.throws(() => parseExpr('('), e => e === 'Unexpected EOF when parsing (; expected )')
    assert.throws(() => parseExpr(')'), e => e === 'Unexpected token ) when parsing )')
    assert.throws(() => parseExpr('2+2 2+2'), e => e === 'Expected operator between tokens 2 and 2')

    assert.throws(() => parseExpr('adv'), e => e === 'Expected left-hand argument to operator adv')
    assert.throws(() => parseExpr('dc10'), e => e === 'Expected left-hand argument to operator dc')
    assert.throws(() => parseExpr('10dc'), e => e === 'Expected right-hand argument to operator dc')
  })
})
