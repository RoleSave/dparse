import { Expr, Const, AddOp, SubOp, MulOp, DivOp, ModOp, PowOp, Group } from "./expr";
import { BasicDice, FateDice, Dice, ExprDice, DiceFn } from "./dice";
import { Explode, Advantage, Disadvantage, DifficultyClass } from "../fns/standard";
import { KeepHigh, KeepLow, KeepAbove, KeepBelow } from "../fns/keep";
import { RerollHigh, RerollLow, RerollAbove, RerollBelow, RerollBelowRecursive, RerollAboveRecursive } from "../fns/reroll";
import { WildMagic } from "../fns/wildmagic";

type Token = {
  type: TokenType[]
  text: string
  bound?: Token[]
}

type TokenType = 
    'const'
  | 'open' 
  | 'close'
  | 'group'
  | 'expr'
  | 'binop'
    | 'op.add'
    | 'op.sub'
    | 'op.mul'
    | 'op.div'
    | 'op.mod'
    | 'op.pow'
  | 'postop'
  | 'die'
    | 'die.basic'
    | 'die.fate'
  | 'fn'
    | 'fn.explode'
    | 'fn.advantage'
    | 'fn.disadvantage'
    | 'fn.difficultyclass'
    | 'fn.keephigh'
    | 'fn.keeplow'
    | 'fn.keepabove'
    | 'fn.keepbelow'
    | 'fn.rerollhigh'
    | 'fn.rerolllow'
    | 'fn.rerollabove'
    | 'fn.rerollaboverec'
    | 'fn.rerollbelow'
    | 'fn.rerollbelowrec'
    | 'fn.wildmagic'

export function parseExprList(diceNotation: string): Expr[] {
  return diceNotation.split(',').filter(x=>x.trim()).map(parseExpr)
}

export function parseExpr(diceNotation: string): Expr {
  return convert(collapse(lex(diceNotation)))
}

/// SECTION: Lex linear text into discrete tokens
function lex(diceNotation: string): Token[] {
  let tokens: Token[] = [],
      from = diceNotation.toLowerCase(),
      c: string
  
  lex: while(c = from[0]) {
    from = from.slice(1)
    if(/\s/.test(c)) continue lex

    // Individual character operators
    switch(c) {
      case '(': tokens.push({ type: ['open'], text: c }); continue lex
      case ')': tokens.push({ type: ['close'], text: c }); continue lex
      case '!': tokens.push({ type: ['postop', 'fn'], text: '!' }); continue lex
      case '+': case '-': 
      case '*': case '/': case 'x':
      case '%': case '^': 
        tokens.push({ type: ['binop'], text: c })
        continue lex
    }

    // Constants
    if(/\d/.test(c)) {
      let num = (c+from).match(/(^\d+)/)![1]
      from = from.slice(num.length-1)
      tokens.push({ type: ['const'], text: num })
      continue lex
    }

    // Set-length operators
    let s: string
    switch(s = (c+from).slice(0,3)) {
      case 'adv': case 'dis':
        from = from.slice(2)
        tokens.push({ type: ['postop', 'fn'], text: s })
        continue lex

      case 'r!>': case 'r!<':
        from = from.slice(2)
        tokens.push({ type: ['binop', 'fn'], text: s })
        continue lex
    }

    switch(s = (c+from).slice(0,2)) {
      case 'dc':
      case 'kh': case 'kl':
      case 'k>': case 'k<':
      case 'rh': case 'rl':
      case 'r>': case 'r<':
        from = from.slice(1)
        tokens.push({ type: ['binop', 'fn'], text: s })
        continue lex

      case 'wm':
        from = from.slice(1)
        tokens.push({ type: ['postop', 'fn'], text: s })
        continue lex
      
      case 'df':
        from = from.slice(1)
        tokens.push({ type: ['postop', 'die'], text: s })
        continue lex

      case 'd%':
        from = from.slice(1)
        tokens.push({ type: ['binop', 'die'], text: 'd' }, { type: ['const'], text: '100' })
        continue lex
    }

    // Basic dice (d)
    if(c === 'd') {
      tokens.push({ type: ['binop', 'die'], text: 'd' })
      continue lex
    }

    // Unknown character
    throw `Unexpected token ${c} when parsing ${diceNotation}`
  }

  return tokens
}

/// SECTION: Collapse linear token list into a single AST token
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
      if(t.type.includes('open')) nest++
      if(t.type.includes('close')) nest--
      if(nest < 0) break
      cont.push(t)
      advance()
    }
    advance()

    tokens = [
      ...tokens.slice(0, open), 
      { type: ['group'], text: `(${cont.map(t=>t.text).join('')})`, bound: [collapse(cont)] }, 
      ...tokens.slice(ci)
    ]
    ci = open+1
  }

  // Consume a binary operator
  function collapseBinop(...type: TokenType[]) {
    if(!prev()) throw `Expected left-hand argument to operator ${curr().text}`
    if(!next()) throw `Expected right-hand argument to operator ${curr().text}`
    tokens = [
      ...tokens.slice(0, ci-1), 
      { type: ['expr', ...type], text: prev().text+t.text+next().text, bound: [prev(), next()] }, 
      ...tokens.slice(ci+2)
    ]
  }
  
  // Consume a postfix operator
  function collapsePostop(...type: TokenType[]) {
    if(!prev()) throw `Expected left-hand argument to operator ${curr().text}`
    tokens = [
      ...tokens.slice(0, ci-1), 
      { type: ['expr', ...type], text: prev().text+t.text, bound: [prev()] }, 
      ...tokens.slice(ci+1)
    ]
  }
  
  /// SECTION: Collapse stages

  // Parentheses
  while(t = curr()) {
    if(t.type.includes('open')) consumeParens()
    else if(t.type.includes('close')) throw `Unexpected token ) when parsing ${tokens.map(t=>t.text).join('')}`
    else advance()
  } reset()

  // Dice
  while(t = curr()) {
    if(t.type.includes('die')) switch(t.text) {
      case 'd': collapseBinop('die.basic', 'die'); break
      case 'df': collapsePostop('die.fate', 'die'); break
      default: advance()
    } else advance()
  } reset()

  // Dice functions
  while(t = curr()) {
    if(t.type.includes('fn')) switch(t.text) {
      case '!': collapsePostop('fn.explode', 'die'); break
      case 'adv': collapsePostop('fn.advantage', 'die'); break
      case 'dis': collapsePostop('fn.disadvantage', 'die'); break
      case 'wm': collapsePostop('fn.wildmagic', 'die'); break
      case 'kh': collapseBinop('fn.keephigh', 'die'); break
      case 'kl': collapseBinop('fn.keeplow', 'die'); break
      case 'k>': collapseBinop('fn.keepabove', 'die'); break
      case 'k<': collapseBinop('fn.keepbelow', 'die'); break
      case 'rh': collapseBinop('fn.rerollhigh', 'die'); break
      case 'rl': collapseBinop('fn.rerolllow', 'die'); break
      case 'r>': collapseBinop('fn.rerollabove', 'die'); break
      case 'r!>': collapseBinop('fn.rerollaboverec', 'die'); break
      case 'r<': collapseBinop('fn.rerollbelow', 'die'); break
      case 'r!<': collapseBinop('fn.rerollbelowrec', 'die'); break
      default: advance()
    } else advance()
  } reset()

  // Exponentiative operations
  while(t = curr()) {
    if(t.type.includes('binop')) switch(t.text) {
      case '^': collapseBinop('op.pow'); break
      default: advance()
    } else advance()
  } reset()

  // Multiplicative operations
  while(t = curr()) {
    if(t.type.includes('binop')) switch(t.text) {
      case '*': collapseBinop('op.mul'); break
      case 'x': collapseBinop('op.mul'); break
      case '/': collapseBinop('op.div'); break
      case '%': collapseBinop('op.mod'); break
      default: advance()
    } else advance()
  } reset()

  // Additive operations
  while(t = curr()) {
    if(t.type.includes('binop')) switch(t.text) {
      case '+': collapseBinop('op.add'); break
      case '-': collapseBinop('op.sub'); break
      default: advance()
    } else advance()
  } reset()

  // Late-binding functions
  while(t = curr()) {
    if(t.type.includes('fn')) switch(t.text) {
      case 'dc': collapseBinop('fn.difficultyclass', 'die'); break
      default: advance()
    } else advance()
  } reset()

  if(tokens.length > 1) throw `Could not reduce expression ${tokens.map(t=>t.text).join('')} to a single base node`
  return tokens[0]
}

/// SECTION: Convert an AST token into a processable Expr instance
function convert(ast: Token): Expr {
  if(ast.type.includes('group')) return new Group(convert(ast.bound![0]))
  if(ast.type.includes('const')) return new Const(parseInt(ast.text, 10))

  const bindDiceFn = (get: DiceFn|((rhs: Expr) => DiceFn)): Expr => {
    if(!ast.bound?.[0].type.includes('die')) throw `Cannot apply a dice function to something that isn't a die`
    let over = convert(ast.bound[0]) as Dice

    if(get instanceof DiceFn) return over.addFn(get)
    else {
      if(!ast.bound?.[1]) throw `Expected right-hand argument to operator ${ast.text}`
      return over.addFn(get(convert(ast.bound[1])))
    }
  }

  const bindSpecialFn = (get: DiceFn|((rhs: Expr) => DiceFn)): Expr => {
    if(!ast.bound) throw `Expected left-hand argument to operator ${ast.text}`
    if(ast.bound?.[0].type.includes('die')) return bindDiceFn(get)

    let over = new ExprDice(convert(ast.bound[0]))
    if(get instanceof DiceFn) return over.addFn(get)
    else {
      if(!ast.bound[1]) throw `Expected right-hand argument to operator ${ast.text}`
      return over.addFn(get(convert(ast.bound[1])))
    }
  }

  if(ast.type.includes('expr')) switch(ast.type[1]) {
    case 'op.add': return new AddOp(convert(ast.bound![0]), convert(ast.bound![1]))
    case 'op.sub': return new SubOp(convert(ast.bound![0]), convert(ast.bound![1]))
    case 'op.mul': return new MulOp(convert(ast.bound![0]), convert(ast.bound![1]))
    case 'op.div': return new DivOp(convert(ast.bound![0]), convert(ast.bound![1]))
    case 'op.mod': return new ModOp(convert(ast.bound![0]), convert(ast.bound![1]))
    case 'op.pow': return new PowOp(convert(ast.bound![0]), convert(ast.bound![1]))

    case 'die.basic': return new BasicDice(convert(ast.bound![0]), convert(ast.bound![1]))
    case 'die.fate': return new FateDice(convert(ast.bound![0]))

    /// SECTION: Standard functions
    case 'fn.explode': return bindDiceFn(Explode)
    case 'fn.advantage': return bindDiceFn(Advantage)
    case 'fn.disadvantage': return bindDiceFn(Disadvantage)
      
    /// SECTION: Keep functions
    case 'fn.keephigh': return bindDiceFn(rhs => KeepHigh(rhs))
    case 'fn.keeplow': return bindDiceFn(rhs => KeepLow(rhs))
    case 'fn.keepabove': return bindDiceFn(rhs => KeepAbove(rhs))
    case 'fn.keepbelow': return bindDiceFn(rhs => KeepBelow(rhs))

    /// SECTION: Reroll functions
    case 'fn.rerollhigh': return bindDiceFn(rhs => RerollHigh(rhs))
    case 'fn.rerolllow': return bindDiceFn(rhs => RerollLow(rhs))
    case 'fn.rerollabove': return bindDiceFn(rhs => RerollAbove(rhs))
    case 'fn.rerollaboverec': return bindDiceFn(rhs => RerollAboveRecursive(rhs))
    case 'fn.rerollbelow': return bindDiceFn(rhs => RerollBelow(rhs))
    case 'fn.rerollbelowrec': return bindDiceFn(rhs => RerollBelowRecursive(rhs))
      
    /// SECTION: Class-specific
    case 'fn.wildmagic': return bindDiceFn(WildMagic)

    /// SECTION: Late-binding functions
    case 'fn.difficultyclass': return bindSpecialFn(rhs => DifficultyClass(rhs))
    
    default:
      throw `Expression type ${ast.type[1]} is not implemented`
  }

  throw `Unexpected token ${ast.text} at conversion time`
}
