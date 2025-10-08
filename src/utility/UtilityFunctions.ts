// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const strictEntries = <T extends Record<string | number, any>>(
  object: T
): [keyof T, T[keyof T]][] => {
  return Object.entries(object) as [keyof T, T[keyof T]][]
}
