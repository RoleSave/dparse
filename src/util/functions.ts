
/** Randomly return -1, 0, or 1. */
export function randComp() { return randInt(3)-1 }

/** Return a random integer between `0` and `max`. */
export function randInt(max: number): number
/** Return a random integer between `min` and `max`. */
export function randInt(min: number, max: number): number
export function randInt(min: number, max?: number) {
  if(typeof max === 'undefined') { max = min; min = 0 }
  return Math.floor(Math.random()*(max-min)+min)
}

/** Return a random element of the given array. */
export function randOf<T>(arr: T[]): T {
  return arr[randInt(arr.length)]
}

/** Return a copy of the given array with `n` of the highest elements removed. */
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

/** Return a copy of the given array with `n` of the lowest elements removed. */
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

/** Generate an array of the given length, setting each element to the results of calling `get`. */
export function arrayOf<T>(len: number, get: (i:number) => T): T[] {
  return new Array(len).fill(0).map((_,i) => get(i))
}

/** Add two numbers. Most commonly used with `Array#reduce`. */
export const sum = (a:number,b:number) => a+b
