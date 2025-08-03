/**
 * ゲームエンジンのエクスポート
 */

export { World } from "./world"
export type { WorldConfig } from "./world"
export { WorldStateManager, DEFAULT_PARAMETERS, SPATIAL_CELL_SIZE } from "./world-state"
export {
  ObjectFactory,
  calculateEnergyRadius,
  calculateUnitRadius,
  calculateHullRadius,
} from "./object-factory"
