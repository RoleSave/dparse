import { indent, fn } from '../util/functions'
import { failTests } from './runtests'

const failMark = '\u001B[1;31m✗\u001B[0m'
const succMark = '\u001B[1;32m✓\u001B[0m'
const todoMark = '\u001B[1;33m!\u001B[0m'

type AssertCtx = (true|string)[]
type DescribeBody = (it: (text: string, body: ItBody) => void, todo: (text: string) => void) => void
type ItBody = (assert: ReturnType<typeof buildAssert>) => void

export function describe(name: string, body: DescribeBody) {
  console.log(`\u001b[1m${name}\u001B[0m`)
  body(function it(text: string, body: ItBody) {
    let assertCtx: AssertCtx = []
    body(buildAssert(assertCtx))

    let succ = assertCtx.reduce((a,b) => a && (b === true), true as boolean)
    console.log(`  ${succ ? succMark : failMark} ${text}`)

    if(!succ) {
      failTests()
      for(let res of assertCtx.filter(fn.uniq)) {
        if(res === true) continue
        console.log(indent(res, 6))
      }
    }
  }, function todo(text: string) {
    console.log(`  ${todoMark} ${text}\n      \u001B[1;33mTODO:\u001B[0m Implement test`)
  })
}

export function testConsistency<T>(getParam: () => T, body: (param: T) => void, numTests: number = 10000) {
  let params = new Array(numTests).fill(0).map(getParam)
  for(let param of params) body(param)
  return params
}

function buildAssert(ctx: AssertCtx) { return {
  truth: function assertTruth(a: any, label?:string) {
    ctx.push(!!a || `expected: truthy value${label ? ` (${label})` : ''}\nactual: ${a}`)
  },

  equal: function assertEqual<T>(a: T, b: T, label?:string) { 
    ctx.push(a == b || `expected: ${b}${label ? ` (${label})` : ''}\nactual: ${a}`) 
  },

  strictEqual: function assertStrictEqual<T>(a: T, b: T, label?:string) { 
    ctx.push(a === b || `expected: ${b}${label ? ` (${label})` : ''}\nactual: ${a}`) 
  },

  notEqual: function assertNotEqual<T>(a: T, b: T, label?:string) { 
    ctx.push(a != b || `expected: ${a} != ${b}${label ? ` (${label})` : ''}`) 
  },

  strictNotEqual: function assertStrictNotEqual<T>(a: T, b: T, label?:string) { 
    ctx.push(a !== b || `expected: ${a} !== ${b}${label ? ` (${label})` : ''}`) 
  },

  inRange: function assertInRange(a: number, min: number, max: number, label?:string) {
    ctx.push(a >= min && a <= max || `expected: in range ${min} to ${max}${label ? ` (${label})` : ''}\nactual: ${a}`)
  },

  greaterThan: function assertGreaterThan(a: number, b: number, label?:string) {
    ctx.push(a > b || `expected: > ${b}${label ? ` (${label})` : ''}\nactual: ${a}`)
  },
  lessThan: function assertGreaterThan(a: number, b: number, label?:string) {
    ctx.push(a < b || `expected: < ${b}${label ? ` (${label})` : ''}\nactual: ${a}`)
  },
  greaterOrEqual: function assertGreaterThan(a: number, b: number, label?:string) {
    ctx.push(a >= b || `expected: >= ${b}${label ? ` (${label})` : ''}\nactual: ${a}`)
  },
  lessOrEqual: function assertGreaterThan(a: number, b: number, label?:string) {
    ctx.push(a <= b || `expected: <= ${b}${label ? ` (${label})` : ''}\nactual: ${a}`)
  },

  inArray: function assertInArray<T>(a: T, arr: any[], label?:string) {
    ctx.push(arr.includes(a) || `expected: in [${arr.join(',')}]${label ? ` (${label})` : ''}\nactual: ${a}`)
  },

  matchPred: function assertMatchPred<T>(a: T, pred: (a: T) => boolean, label?:string) {
    ctx.push(pred(a) || `${a} did not match predicate${label ? ` (${label})` : ''}`)
  }
}}
