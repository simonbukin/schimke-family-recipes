export function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

 // Helper function for function composition
export const pipe = (x: any, ...fns: Function[]) =>
  fns.reduce((v, f) => f(v), x);
