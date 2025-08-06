/**
 * 自己複製エージェントプリセット
 */

import type { SingleHullSingleComputerAgentPreset } from "./types"

/**
 * ダミーの自己複製プログラムを生成
 * TODO: 実際の自己複製プログラムを実装
 */
const generateSelfReplicatorProgram = (): Uint8Array => {
  // ダミープログラム: エネルギー収集命令のみ
  // 0x81 = ENERGY命令（エネルギー収集開始）
  // 0x00 = HLT命令（停止）
  return new Uint8Array([0x81, 0x00])
}

/** 基本的な自己複製エージェントプリセット */
export const SELF_REPLICATOR_PRESET: SingleHullSingleComputerAgentPreset = {
  case: "single-hull, single-computer",
  name: "BasicSelfReplicator",
  description: "基本的な自己複製エージェント",
  units: [
    {
      type: "HULL",
      parameters: {
        type: "HULL",
        capacity: 1000,
      },
      isAttached: false, // HULL自身は接続されない
    },
    {
      type: "ASSEMBLER",
      parameters: {
        type: "ASSEMBLER",
        assemblePower: 10,
      },
      isAttached: true, // HULLに接続
    },
    {
      type: "COMPUTER",
      parameters: {
        type: "COMPUTER",
        processingPower: 5,
        memorySize: 512,
      },
      isAttached: true, // HULLに接続
    },
  ],
  program: generateSelfReplicatorProgram(),
}