/**
 * ゲームエンジンのエクスポート
 */

export { World } from "./world"
export type { WorldConfig } from "./world"
export { WorldStateManager, DEFAULT_PARAMETERS, SPATIAL_CELL_SIZE } from "./world-state"
export { GameLoop, GameLoopController } from "./game-loop"
export type { GameLoopCallback } from "./game-loop"
export {
  ObjectFactory,
  calculateEnergyRadius,
  calculateUnitRadius,
  calculateHullRadius,
} from "./object-factory"
