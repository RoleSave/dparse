
/** Randomly return -1, 0, or 1. */
export function randComp() { return randInt(3)-1 }
/** Return a random element of the given array. */
export function randOf<T>(arr: T[]): T { return arr[randInt(arr.length)] }

/** Return a random integer between `min` (inclusive) and `max` (exclusive).
 *  If only one is specificed, the bottom bound defaults to 0. */
export function randInt(min: number, max: number = 0) {
  return Math.floor(Math.random()*(Math.max(min,max)-Math.min(min,max))+Math.min(min,max))
}

/** Return a copy of the given array with `n` of the elements removed, as determined by the `find` function. */
export function removeN<T>(arr: T[], n: number, find: (...xs:T[]) => T) {
  let out = [...arr]
  for(let i=0;i<n;i++) out.splice(out.indexOf(find(...out)), 1)
  return out
}

/** Create a shallow clone of an object, optionally replacing properties. */
export function cloneObj<T>(obj: T, replace: object = {}): T {
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj, replace) as T
}
