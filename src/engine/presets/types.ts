/**
 * エージェントプリセット型定義
 */

import type { Vec2, UnitSpec, UnitType } from "@/types/game"

/** 単一HULL・単一COMPUTERエージェントのプリセット定義 */
export type SingleHullSingleComputerAgentPreset = {
  readonly case: "single-hull, single-computer"
  readonly name: string
  readonly description: string
  readonly units: readonly UnitDefinition[]
  readonly program: Uint8Array // COMPUTERユニット用プログラム
}

/** ユニット定義 */
export type UnitDefinition = {
  readonly type: UnitType
  readonly parameters: UnitSpec
  readonly isAttached: boolean // HULLに固定するか
}

/** エージェントプリセット（今後の拡張用Union型） */
export type AgentPreset = SingleHullSingleComputerAgentPreset
// 他のpreset型を作成したらここへ追加する

/** プリセット配置定義 */
export type AgentPresetPlacement = {
  readonly preset: AgentPreset
  readonly position: Vec2
}