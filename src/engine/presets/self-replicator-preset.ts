/**
 * 自己複製エージェントプリセット
 */

import type { SingleHullSingleComputerAgentPreset } from "./types"

/**
 * 自己複製プログラムを生成
 * 基本的な自己複製ループを実装
 */
const generateSelfReplicatorProgram = (): Uint8Array => {
  // プログラムを手動でアセンブル
  const program: number[] = []
  
  // ========== 初期化 ==========
  // SET_SP #0xFFFF (スタックポインタ初期化)
  program.push(0x0e)  // SET_SP
  // ※SET_SPはレジスタAの値をSPに設定するので、先にAに0xFFFFをロード
  program.push(0xe0, 0xff, 0xff)  // LOAD_IMM A, 0xFFFF
  program.push(0x0e)  // SET_SP
  
  // ========== メインループ ==========
  // main_loop:
  const main_loop = program.length
  
  // エネルギー収集開始
  // MOV A, #0x00 (HULL[0])
  program.push(0xe0, 0x00, 0x00)  // LOAD_IMM A, 0x0000
  // MOV B, #0x03 (energy_collect)
  program.push(0xe1, 0x03, 0x00)  // LOAD_IMM_B B, 0x0003
  // MOV C, #0x01 (enable)
  program.push(0xe0, 0x01, 0x00)  // LOAD_IMM A, 0x0001
  program.push(0x09)  // MOV_AC (A -> C)
  // UNIT_MEM_WRITE B, A, 0x00, C
  program.push(0x91, 0x03, 0x00, 0x00, 0x00)  // UNIT_MEM_WRITE
  
  // wait_energy:
  const wait_energy = program.length
  
  // エネルギー量チェック
  // MOV A, #0x00 (HULL[0])
  program.push(0xe0, 0x00, 0x00)  // LOAD_IMM A, 0x0000
  // MOV B, #0x02 (energy_amount)
  program.push(0xe1, 0x02, 0x00)  // LOAD_IMM_B B, 0x0002
  // UNIT_MEM_READ B, A, 0x00
  program.push(0x90, 0x02, 0x00, 0x00)  // UNIT_MEM_READ
  
  // エネルギーが十分か確認（簡易版：エネルギーが0より大きいか）
  // CMP A, #0x0000
  program.push(0xe1, 0x00, 0x00)  // LOAD_IMM_B B, 0x0000
  program.push(0x1e)  // CMP_AB
  
  // エネルギーが0なら待機ループに戻る
  // JZ wait_energy
  const offset_to_wait = wait_energy - (program.length + 3)
  program.push(0x61, offset_to_wait & 0xff, (offset_to_wait >> 8) & 0xff)
  
  // テンプレート (識別用パターン)
  program.push(0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00)  // 10101010
  
  // TODO: ここに複製処理を追加
  // 現在は単純にメインループに戻る
  
  // JMP main_loop
  const offset_to_main = main_loop - (program.length + 3)
  program.push(0x60, offset_to_main & 0xff, (offset_to_main >> 8) & 0xff)
  
  // プログラムをUint8Arrayに変換
  return new Uint8Array(program)
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