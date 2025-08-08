/**
 * 型ガード関数
 * 実行時型チェックをコンパイル時型チェックに変換
 */

import type {
  GameObject,
  EnergyObject,
  Hull,
  Assembler,
  Computer,
  Unit,
  BaseUnit,
  DirectionalForceField,
  LinearForceField,
  RadialForceField,
  SpiralForceField,
} from "@/types/game"

// GameObject型ガード
export const isEnergyObject = (obj: GameObject): obj is EnergyObject => {
  return obj.type === "ENERGY"
}

// Unit型ガード
export const isUnit = (obj: GameObject): obj is Unit => {
  return obj.type === "HULL" || obj.type === "ASSEMBLER" || obj.type === "COMPUTER"
}

export const isHull = (obj: GameObject | BaseUnit): obj is Hull => {
  return obj.type === "HULL"
}

export const isAssembler = (obj: GameObject | BaseUnit): obj is Assembler => {
  return obj.type === "ASSEMBLER"
}

export const isComputer = (obj: GameObject | BaseUnit): obj is Computer => {
  return obj.type === "COMPUTER"
}

// DirectionalForceField型ガード
export const isLinearForceField = (field: DirectionalForceField): field is LinearForceField => {
  return field.type === "LINEAR"
}

export const isRadialForceField = (field: DirectionalForceField): field is RadialForceField => {
  return field.type === "RADIAL"
}

export const isSpiralForceField = (field: DirectionalForceField): field is SpiralForceField => {
  return field.type === "SPIRAL"
}

// Assembler状態ガード
export const isAssemblerAssembling = (assembler: Assembler): boolean => {
  return assembler.isAssembling && assembler.targetSpec !== undefined
}

// Computer状態ガード
export const isComputerRunning = (computer: Computer): boolean => {
  return computer.isRunning
}

export const isComputerError = (computer: Computer): boolean => {
  return computer.vmError !== undefined
}

// Hull状態ガード
export const isHullCollectingEnergy = (hull: Hull): boolean => {
  return hull.collectingEnergy === true
}

// parentHull関連ガード
export const hasParentHull = (unit: BaseUnit): boolean => {
  return unit.parentHull !== undefined
}

export const isIndependentUnit = (unit: BaseUnit): boolean => {
  return unit.parentHull === undefined
}