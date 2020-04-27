import { Operators, BinOpDef } from "../core/operators";

Operators.registerOp({
  name: 'add',
  type: 'binop',
  text: '+',
  prec: 0,
  cacheable: true,
  eval: (op, l, r) => ({
    type: 'basic',
    source: op,
    value: l.value + r.value,
    prev: [l,r]
  })
})

Operators.registerOp({
  name: 'sub',
  type: 'binop',
  text: '-',
  prec: 0,
  cacheable: true,
  eval: (op, l, r) => ({
    type: 'basic',
    source: op,
    value: l.value - r.value,
    prev: [l,r]
  })
})

let mul: BinOpDef = {
  name: 'mul_?',
  type: 'binop',
  text: '?',
  prec: 1,
  cacheable: true,
  eval: (op, l, r) => ({
    type: 'basic',
    source: op,
    value: l.value * r.value,
    prev: [l,r]
  })
}
Operators.registerOp({ ...mul, name: 'mul_*', text: '*' })
Operators.registerOp({ ...mul, name: 'mul_x', text: 'x' })

Operators.registerOp({
  name: 'div',
  type: 'binop',
  text: '/',
  prec: 1,
  cacheable: true,
  eval: (op, l, r) => ({
    type: 'basic',
    source: op,
    value: r.value !== 0 ? Math.floor(l.value / r.value) : NaN,
    prev: [l,r]
  })
})

Operators.registerOp({
  name: 'mod',
  type: 'binop',
  text: '%',
  prec: 1,
  cacheable: true,
  eval: (op, l, r) => ({
    type: 'basic',
    source: op,
    value: r.value !== 0 ? l.value % r.value : NaN,
    prev: [l,r]
  })
})

Operators.registerOp({
  name: 'pow',
  type: 'binop',
  text: '^',
  prec: 2,
  cacheable: true,
  eval: (op, l, r) => ({
    type: 'basic',
    source: op,
    value: Math.pow(l.value, r.value),
    prev: [l,r]
  })
})
