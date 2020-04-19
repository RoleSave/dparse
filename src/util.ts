
export function randComp() { return randInt(3)-1 }
export function randInt(min: number, max?: number) {
  if(typeof max === 'undefined') { max = min; min = 0 }
  return Math.floor(Math.random()*(max-min)+min)
}

export function randOf<T>(arr: T[]): T {
  return arr[randInt(arr.length)]
}

export function removeHighest<T>(arr: T[], n: number): T[] {
  let out = [...arr]
  for(let i = 0; i < n; i++) {
    let highestIndex = -1
    out.forEach((n,i) => {
      if(n > (highestIndex < 0 ? Number.MIN_VALUE : out[highestIndex]))
        highestIndex = i
    })
    delete out[highestIndex]
  }
  return out.filter(x=>x)
}

export function removeLowest<T>(arr: T[], n: number): T[] {
  let out = [...arr]
  for(let i = 0; i < n; i++) {
    let lowestIndex = -1
    out.forEach((n,i) => {
      if(n < (lowestIndex < 0 ? Number.MAX_VALUE : out[lowestIndex]))
        lowestIndex = i
    })
    delete out[lowestIndex]
  }
  return out.filter(x=>x)
}

export function partitionArray<T>(arr: T[], parLength: number): T[][] {
  if(arr.length <= parLength) return [arr]
  return [arr.slice(0, parLength), ...partitionArray(arr.slice(parLength), parLength)]
}

export function trimLines(str: string): string {
  return str.trim().split('\n').map(x=>x.trim()).join('\n')
}

export function indent(str: string, by: string|number): string {
  if(typeof by === 'number') by = ' '.repeat(by)
  return str.split('\n').map(x=>by+x).join('\n')
}

export function indexable<T>(obj: {[k: string]: T}): {[k:string]: T} {
  return obj as {[k:string]: T}
}

export function arrayOf<T>(len: number, get: (i:number) => T): T[] {
  return new Array(len).fill(0).map((_,i) => get(i))
}

export const fn = {
  // filter
  uniq: (x:any,i:number,a:any[]) => a.indexOf(x) === i,
  id: <T>(x:T) => x,
  
  // reduce
  flatten: <T>(a:T[],b:T[]) => [...a,...b],
  sum: (a:number,b:number) => a+b,
  diff: (a:number,b:number) => a-b,
  prod: (a:number,b:number) => a*b,
  quot: (a:number,b:number) => a/b,
  rem: (a:number,b:number) => a%b,

  // sort
  lowFirst: (a:number,b:number) => a - b,
  highFirst: (a:number,b:number) => b - a
}
