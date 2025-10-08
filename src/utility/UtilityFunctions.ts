export type Range = {
  readonly max: number
  readonly min: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const strictEntries = <T extends Record<string | number, any>>(
  object: T
): [keyof T, T[keyof T]][] => {
  return Object.entries(object) as [keyof T, T[keyof T]][]
}

export const random = (max: number, min = 0): number => {
  return Math.random() * (max - min) + min
}

export const randomInRange = (range: Range): number => {
  return Math.random() * (range.max - range.min) + range.min
}
