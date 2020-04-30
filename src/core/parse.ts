import { Expr, Group, Const, Variable, RandFromList, TakeFromList } from "./expressions";
import { Operators, OpDef, PreOp, PreOpDef, PostOp, PostOpDef, BinOp, BinOpDef } from './operators'

/// SECTION: Definitions

type Token = {
  type: 'const'|'var'|'open'|'close'|'sep'|'group'|'op'
  text: string
  opdef?: OpDef
  bound?: Token[]
}

/** Parse a single expression. */
export function parseExpr(expr: string): Expr {
  let [ast,_] = collapse(lex(expr))
  if(_) throw `Expected only one expression`
  return convert(ast)
}

/** Parse a comma-separated list of expressions. */
export function parseExprList(exprs: string): Expr[] {
  return collapse(lex(exprs)).map(convert)
}

/// SECTION: Lex
function lex(expr: string): Token[] {
  let tokens: Token[] = [],
      from = expr.toLowerCase(),
      c: string

  lex: while(c = from[0]) {
    from = from.slice(1)
    if(/\s/.test(c)) continue lex

    // Brackets
    if(/[\(\[\{]/.test(c)) {
      tokens.push({ type: 'open', text: c })
      continue lex }
    if(/[\)\]\}]/.test(c)) {
      tokens.push({ type: 'close', text: c })
      continue lex }
    if(c === ',') {
      tokens.push({ type: 'sep', text: c })
      continue lex }

    // Negative numbers
    // TODO: Find a way to implement this as a preop instead of a parser exception
    if(c === '-' && /\d/.test(from[0]) && !['const','var','close'].includes(tokens[tokens.length-1]?.type)) {
      let num = from.match(/(^\d+)/)![1]
      from = from.slice(num.length)
      tokens.push({ type: 'const', text: '-'+num })
      continue lex
    }

    // Numbers
    if(/\d/.test(c)) {
      let num = (c+from).match(/(^\d+)/)![1]
      from = from.slice(num.length-1)
      tokens.push({ type: 'const', text: num })
      continue lex
    }

    // Variables
    if(c === '$') {
      let vname = from.match(/(^[a-z0-9_]+;?)/i)?.[1]
      from = from.slice(vname?.length)
      if(!vname) throw 'Expected variable name after $'
      if(vname.endsWith(';')) vname = vname.slice(0,-1)
      tokens.push({ type: 'var', text: vname })
      continue lex
    }

    // Operators
    for(let op of Operators.getOpList().sort((a,b) => b.text.length - a.text.length)) {
      if((c+from).startsWith(op.text.toLowerCase())) {
        from = from.slice(op.text.length-1)
        tokens.push({ type: 'op', text: op.text, opdef: op })
        continue lex
      }
    }

    // Unknown character
    throw `Unexpected token ${c} when parsing ${expr}`
  }

  let errIndex = -1
  if((errIndex = tokens.findIndex((t,i) => ['const','var','close'].includes(tokens[i-1]?.type) && ['const','var','open'].includes(t.type))) > -1)
    throw `Expected operator between tokens ${tokens[errIndex-1].text} and ${tokens[errIndex].text}`
  return tokens
}

/// SECTION: Build AST
function collapse(tokens: Token[]): Token[] {
  if(tokens.length < 1) throw `Cannot parse empty expression`

  // Program counters and helper functions
  let ci = 0, t: Token
  const curr = () => tokens[ci],
        prev = () => tokens[ci-1],
        next = () => tokens[ci+1],
        advance = () => ++ci,
        reset = () => ci = 0

  // Parentheses
  while(t = curr()) {
    if(t.type == 'close') throw `Unexpected token ${t.text} when parsing ${tokens.map(t=>t.text).join('')}`
    if(t.type == 'open') {
      let nest = 0, cont = [], open = ci,
          openText = tokens[open].text,
          closeText = matchParen[tokens[open].text]
      while(t = next()) {
        if(t.type == 'open' && t.text === openText) nest++
        if(t.type == 'close' && t.text === closeText) nest--
        if(nest < 0) break
        cont.push(t)
        advance()
      }
  
      if(nest >= 0) throw `Unexpected EOF when parsing ${tokens.map(t=>t.text).join('')}; expected ${closeText}`
      tokens.splice(open, cont.length+2, {
        type: 'group',
        text: `${openText}${cont.map(t=>t.text).join('')})${closeText}`, 
        bound: collapse(cont) })
      ci = open+1
    } else advance()
  } reset()

  // Operators
  for(let prec = Operators.highestOpPrec; prec >= Operators.lowestOpPrec; prec--) {
    while(t = curr()) {
      if(t.type !== 'op') { advance(); continue }

      let found = false
      for(let op of Operators.getOpsForPrec(prec)) if(found = t.opdef?.name == op.name) {
        switch(op.type) {
          case 'preop': 
            if(!next()) throw `Expected right-hand argument to operator ${t.text}`
            tokens.splice(ci, 2, { 
              type: 'op', 
              text: t.text+next().text, 
              bound: [next()], 
              opdef: t.opdef })
            break

          case 'postop': 
            if(!prev()) throw `Expected left-hand argument to operator ${t.text}`
            tokens.splice(ci-1, 2, { 
              type: 'op', 
              text: prev().text+t.text, 
              bound: [prev()], 
              opdef: t.opdef })
            break

          case 'binop': 
            if(!prev()) throw `Expected left-hand argument to operator ${t.text}`
            if(!next()) throw `Expected right-hand argument to operator ${t.text}`
            tokens.splice(ci-1, 3, { 
              type: 'op', 
              text: prev().text+t.text+next().text, 
              bound: [prev(), next()], 
              opdef: t.opdef })
            break
        }
      }

      if(!found) advance()
    } reset()
  }

  return tokens.filter(t => t.type !== 'sep')
}

/// SECTION: Parse AST into expression
function convert(ast: Token): Expr {
  if(ast.type == 'const') return new Const(parseInt(ast.text, 10))
  if(ast.type == 'var') return new Variable(ast.text)
  
  if(ast.type == 'group') switch(ast.text[0]) {
    case '(':
      if(ast.bound?.length !== 1) throw `Expected one bound token in () group`
      return new Group(convert(ast.bound![0]))
    case '[':
      if(!ast.bound?.length) throw `Expected at least one bound token in [] group`
      return new RandFromList(ast.bound.map(convert))
    case '{':
      if(!ast.bound?.length) throw `Expected at least one bound token in {} group`
      return new TakeFromList(ast.bound.map(convert))
  }

  if(ast.type == 'op') {
    if(!ast.bound?.length) throw `Encountered unbound operator ${ast.text}`
    switch(ast.opdef!.type) {
      case 'preop': 
        if(ast.bound.length < 1) throw `Not enough tokens bound for operator ${ast.text}, expected 1`
        return new PreOp(ast.opdef as PreOpDef, convert(ast.bound[0]))
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
