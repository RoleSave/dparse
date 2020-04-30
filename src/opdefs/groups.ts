import Operators from "../core/operators";
import { randOf } from "../util/functions";
import { Const } from "../core/expressions";

Operators.registerGroupType({
  name: 'parens',
  open: '(',
  close: ')',
  maxContents: 1,
  cacheable: true,
  eval: (grp, cnt) => ({ 
    type: 'basic', 
    source: grp, 
    value: cnt[0].value, 
    prev: [cnt[0]] 
  })
})

Operators.registerGroupType({
  name: 'rand_from_list',
  open: '[',
  close: ']',
  eval: (grp, cnt) => {
    let sel = randOf(cnt)
    return {
      type: 'basic',
      source: grp,
      value: sel.value,
      prev: sel.prev
    }
  }
})

Operators.registerGroupType({
  name: 'take_from_list',
  open: '{',
  close: '}',
  cacheContentDisplay: true,
  eval: (grp, cnt) => {
    let sel = cnt.length ? randOf(cnt) : new Const(NaN).eval()
    grp.contents.splice(cnt.indexOf(sel), 1)
    return {
      type: 'basic',
      source: grp,
      value: sel.value,
      prev: sel.prev
    }
  }
})
