declare const ObjectIdBrand: unique symbol

export type Id<T> = number & { __brand: "ObjectId"; [ObjectIdBrand]: T }

let idIndex = 0
export const getNewId = <T>(): Id<T> => {
  const id = idIndex
  idIndex += 1
  return id as Id<T>
}
