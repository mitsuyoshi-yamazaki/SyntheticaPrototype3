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
export { SpatialHashGrid } from "./spatial-hash-grid"
export { CollisionDetector } from "./collision-detector"
export type { CollisionPair, CollisionResult } from "./collision-detector"
export {
  calculateSeparationForce,
  calculateTotalSeparationForce,
  DEFAULT_SEPARATION_PARAMETERS,
} from "./separation-force"
export type { SeparationForceParameters } from "./separation-force"
export { PhysicsEngine, DEFAULT_PHYSICS_PARAMETERS } from "./physics-engine"
export type {
  PhysicsParameters,
  PhysicsParametersUpdate,
  PhysicsUpdateResult,
} from "./physics-engine"
export { EnergySystem, DEFAULT_ENERGY_PARAMETERS } from "./energy-system"
export type { EnergyCombineResult, EnergySystemParameters } from "./energy-system"
export { EnergySourceManager, DEFAULT_SOURCE_PARAMETERS } from "./energy-source-manager"
export type { EnergyGenerationResult, EnergySourceParameters } from "./energy-source-manager"
export { EnergyCollector, DEFAULT_COLLECTOR_PARAMETERS } from "./energy-collector"
export type { EnergyCollectionResult, EnergyCollectorParameters } from "./energy-collector"
export { EnergyDecaySystem, DEFAULT_DECAY_PARAMETERS } from "./energy-decay-system"
export type { EnergyDecayResult, EnergyDecayParameters } from "./energy-decay-system"
export { HullEnergyManager } from "./hull-energy-manager"
export {
  AssemblerConstructionSystem,
  UnitCostCalculator,
  type ProducingUnit,
  type ConstructionParameters,
  type ConstructionResult,
} from "./assembler-construction-system"
export {
  CircuitConnectionSystem,
  UNIT_TYPE_CODES,
  type UnitIdentifier,
  type CircuitAccessResult,
} from "./circuit-connection-system"
export {
  createMemoryInterface,
  HullMemoryInterface,
  AssemblerMemoryInterface,
  ComputerMemoryInterface,
  HULL_MEMORY_MAP,
  ASSEMBLER_MEMORY_MAP,
  COMPUTER_MEMORY_MAP,
  type MemoryMap,
  type UnitMemoryInterface,
} from "./unit-memory-interface"
export { VMState, REGISTER_NAMES, FLAG_NAMES } from "./vm-state"
export type { RegisterName, FlagName } from "./vm-state"
export {
  getInstruction,
  getInstructionLength,
  isUndefinedInstruction,
  ALL_INSTRUCTIONS,
  ONE_BYTE_INSTRUCTIONS,
  THREE_BYTE_INSTRUCTIONS,
  FOUR_BYTE_INSTRUCTIONS,
  FIVE_BYTE_INSTRUCTIONS,
} from "./vm-instructions"
export type { Instruction, InstructionType } from "./vm-instructions"
export { InstructionDecoder } from "./vm-decoder"
export type { DecodedInstruction } from "./vm-decoder"
export { InstructionExecutor } from "./vm-executor"
export type { ExecutionResult } from "./vm-executor"
export { ComputerVMSystem } from "./computer-vm-system"
export { UnitSelfScanSystem, SCAN_RESULT_ADDRESSES, UNIT_TYPE_CODES } from "./unit-self-scan"
export { UnitEnergyControlSystem, ENERGY_SUBCOMMANDS } from "./unit-energy-control"
export type { EnergyOperationResult } from "./unit-energy-control"
