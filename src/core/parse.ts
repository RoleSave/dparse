import { Expr, Group, Const, Variable } from "./expressions";
import { Operators as Ops, PostOp, PostOpDef, BinOpDef, BinOp, OpDef } from './operators'

/// SECTION: Definitions

type Token = {
  type: 'const'|'var'|'open'|'close'|'group'|'op'
  text: string
  opdef?: OpDef
  bound?: Token[]
}

/** Parse a single expression. */
export function parseExpr(expr: string): Expr {
  return convert(collapse(lex(expr)))
}

/** Parse a comma-separated list of expressions. */
export function parseExprList(exprs: string): Expr[] {
  return exprs.split(',').filter(x=>x.trim()).map(parseExpr)
}

/// SECTION: Lex
function lex(expr: string): Token[] {
  let tokens: Token[] = [],
      from = expr.toLowerCase(),
      c: string

  lex: while(c = from[0]) {
    from = from.slice(1)
    if(/\s/.test(c)) continue lex

    if(c === '(') { // TODO: /[\(\[\{]/.test(c)
      tokens.push({ type: 'open', text: c })
      continue lex }
    if(c === ')') { // TODO: /[\)\]\}]/.test(c)
      tokens.push({ type: 'close', text: c })
      continue lex }

    if(c === '-' && /\d/.test(from[0]) && !['const','var','close'].includes(tokens[tokens.length-1]?.type)) {
      let num = from.match(/(^\d+)/)![1]
      from = from.slice(num.length)
      tokens.push({ type: 'const', text: '-'+num })
      continue lex
    }

    if(/\d/.test(c)) {
      let num = (c+from).match(/(^\d+)/)![1]
      from = from.slice(num.length-1)
      tokens.push({ type: 'const', text: num })
      continue lex
    }

    if(c === '$') {
      let vname = from.match(/(^[a-z0-9_]+;?)/i)?.[1]
      from = from.slice(vname?.length)
      if(!vname) throw 'Expected variable name after $'
      if(vname.endsWith(';')) vname = vname.slice(0,-1)
      tokens.push({ type: 'var', text: vname })
      continue lex
    }

    for(let op of Ops.getOpList().sort((a,b) => b.text.length - a.text.length)) {
      if((c+from).startsWith(op.text.toLowerCase())) {
        from = from.slice(op.text.length-1)
        tokens.push({ type: 'op', text: op.text, opdef: op })
        continue lex
      }
    }

    // Unknown character
    throw `Unexpected token ${c} when parsing ${expr}`
  }

  return tokens
}

/// SECTION: Build AST
function collapse(tokens: Token[]): Token {
  if(tokens.length < 1) throw `Cannot parse empty expression`

  // Program counters and helper functions
  let ci = 0, t: Token
  const curr = () => tokens[ci],
        prev = () => tokens[ci-1],
        next = () => tokens[ci+1],
        advance = () => ci++,
        reset = () => ci = 0

  // Consume a set of parentheses, respecting nesting
  function consumeParens() {
    let nest = 0, cont = [], open = ci
    advance()
    while(t = curr()) {
      if(t.type == 'open' && t.text === tokens[open].text) nest++
      if(t.type == 'close' && t.text === matchParen[tokens[open].text]) nest--
      if(nest < 0) break
      cont.push(t)
      advance()
    }
    advance()

    tokens = [
      ...tokens.slice(0, open), 
      { type: 'group', 
        text: `(${cont.map(t=>t.text).join('')})`, 
        bound: [collapse(cont)] }, 
      ...tokens.slice(ci)
    ]
    ci = open+1
  }

  // Parentheses
  while(t = curr()) {
    if(t.type == 'open') consumeParens()
    else if(t.type == 'close') throw `Unexpected token ) when parsing ${tokens.map(t=>t.text).join('')}`
    else advance()
  } reset()

  // Operators

  for(let prec = Ops.highestOpPrec; prec >= Ops.lowestOpPrec; prec--) {
    while(t = curr()) {
      if(t.type !== 'op') { advance(); continue }

      let found = false
      for(let op of Ops.getOpsForPrec(prec)) if(t.opdef?.name == op.name) {
        found = true
        switch(op.type) {
          case 'postop': 
            if(!prev()) throw `Expected left-hand argument to operator ${curr().text}`
            tokens = [
              ...tokens.slice(0, ci-1), 
              { type: 'op', 
                text: prev().text+t.text, 
                bound: [prev()], 
                opdef: t.opdef }, 
              ...tokens.slice(ci+1)
            ]
            break

          case 'binop': 
            if(!prev()) throw `Expected left-hand argument to operator ${curr().text}`
            if(!next()) throw `Expected right-hand argument to operator ${curr().text}`
            tokens = [
              ...tokens.slice(0, ci-1), 
              { type: 'op', 
                text: prev().text+t.text+next().text, 
                bound: [prev(), next()], 
                opdef: t.opdef }, 
              ...tokens.slice(ci+2)
            ]
            break
        }
      }

      if(!found) advance()
    } reset()
  }

  if(tokens.length > 1) throw `Could not reduce expression ${tokens.map(t=>t.text).join('')} to a single base node`
  return tokens[0]
}

/// SECTION: Parse AST into expression
function convert(ast: Token): Expr {
  if(ast.type == 'group') return new Group(convert(ast.bound![0]))
  if(ast.type == 'const') return new Const(parseInt(ast.text, 10))
  if(ast.type == 'var') return new Variable(ast.text)

  if(ast.type == 'op') {
    if(!ast.bound?.length) throw `Encountered unbound operator ${ast.text}`
    switch(ast.opdef!.type) {
      case 'postop': 
        if(ast.bound.length < 1) throw `Not enough tokens bound for operator ${ast.text}, expected 1`
        return new PostOp(ast.opdef as PostOpDef, convert(ast.bound[0]))
      case 'binop': 
        if(ast.bound.length < 2) throw `Not enough tokens bound for operator ${ast.text}, expected 2`
        return new BinOp(ast.opdef as BinOpDef, convert(ast.bound[0]), convert(ast.bound[1]))
    }
  }

  throw `Encounted unexpected token type ${ast.type.toUpperCase()}`
}


const matchParen: {[k:string]:string} = {
  '(': ')',
  '[': ']',
  '{': '}'
}
