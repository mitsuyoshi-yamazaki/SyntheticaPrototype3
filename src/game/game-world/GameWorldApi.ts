import type { Vector } from "../../utility/Vector"
import type { AnyEnvironmentalObject, AnyGameObject } from "../object/types"

export type GameWorldApi = {
  searchObjects(): {
    id: AnyGameObject["id"]
    objectType: AnyGameObject["type"]
    position: Vector
    radius: number
  }[]

  searchEnvironmentalObjects(): {
    id: AnyEnvironmentalObject["id"]
    objectType: AnyEnvironmentalObject["type"]
    position: Vector
  }[]
}
