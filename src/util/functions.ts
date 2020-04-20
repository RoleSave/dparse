
export function randComp() { return randInt(3)-1 }
export function randInt(min: number, max?: number) {
  if(typeof max === 'undefined') { max = min; min = 0 }
  return Math.floor(Math.random()*(max-min)+min)
}

export function randOf<T>(arr: T[]): T {
  return arr[randInt(arr.length)]
}

export function removeHighest(arr: number[], n: number): number[] {
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

export function removeLowest(arr: number[], n: number): number[] {
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

export function arrayOf<T>(len: number, get: (i:number) => T): T[] {
  return new Array(len).fill(0).map((_,i) => get(i))
}

export const sum = (a:number,b:number) => a+b
