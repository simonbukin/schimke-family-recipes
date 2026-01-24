export function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function for function composition with proper typing
export function pipe<A, B>(x: A, fn1: (a: A) => B): B;
export function pipe<A, B, C>(x: A, fn1: (a: A) => B, fn2: (b: B) => C): C;
export function pipe<A, B, C, D>(x: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D): D;
export function pipe<T>(x: T, ...fns: Array<(arg: unknown) => unknown>): unknown {
  return fns.reduce((v, f) => f(v), x as unknown);
}
