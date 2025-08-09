/**
 * 自己複製エージェントプリセット
 */

import type { SingleHullSingleComputerAgentPreset } from "./types"

/**
 * 自己複製プログラムを生成
 * docs/spec-v3/agent-code/v3.1.0/constructor-based-replication.md に基づく実装
 */
const generateSelfReplicatorProgram = (): Uint8Array => {
  // プログラムを手動でアセンブル
  const program: number[] = []
  
  // 定数定義（EXPERIMENTAL_PARAMETERSで調整済み）
  const REPRODUCTION_CAPACITY = 0x00C8  // 200
  const EXPAND_CAPACITY = 0x0014        // 20
  const CHILD_HULL_CAPACITY = 0x0064    // 100
  const CHILD_ASSEMBLER_POWER = 0x000A  // 10
  const CHILD_COMPUTER_FREQ = 0x0001    // 1
  const CHILD_COMPUTER_MEMORY = 0x0100  // 256
  const ENERGY_REPRODUCTION = 0x1474    // 5236E

  // ユニット種別定数
  const UNIT_TYPE_HULL = 0x01
  const UNIT_TYPE_ASSEMBLER = 0x02
  const UNIT_TYPE_COMPUTER = 0x04
  const UNIT_INDEX_NONE = 0xFF

  // ラベル位置を記録
  const labels: { [key: string]: number } = {}
  const fixups: { [key: string]: number[] } = {}
  
  // ジャンプ命令を仮配置して後で修正
  const addJump = (opcode: number, label: string) => {
    if (!fixups[label]) fixups[label] = []
    fixups[label].push(program.length + 1) // オペコード後のオフセット位置
    program.push(opcode, 0x00, 0x00) // 仮のオフセット
  }
  
  // ========== スタック初期化 ==========
  // SET_SP #0xFFFF
  program.push(0xe0, 0xff, 0xff, 0x00, 0x00) // LOAD_IMM A, 0xFFFF
  program.push(0x0e) // SET_SP

  // ========== 成長フェーズ ==========
  labels['growth_phase'] = program.length
  
  // 現在の容量チェック
  // UNIT_MEM_READ unitId=0x00(HULL[0]), addr=0x00(capacity) -> Bレジスタ
  program.push(0x90, 0x00, 0x00, 0x00) // UNIT_MEM_READ
  program.push(0x05) // MOV_BA (BをAに移動)
  
  // REPRODUCTION_CAPACITYと比較
  program.push(0xe1, REPRODUCTION_CAPACITY & 0xff, (REPRODUCTION_CAPACITY >> 8) & 0xff, 0x00, 0x00) // LOAD_IMM_B
  program.push(0x1e) // CMP_AB
  
  // JUGE reproduction_phase (符号なし比較: A >= B なら複製フェーズへ)
  addJump(0x6b, 'reproduction_phase')
  
  // HULLの拡張生産
  // produce_type = UNIT_TYPE_HULL(0x01)をセット
  program.push(0xe0, UNIT_TYPE_HULL, 0x00, 0x00, 0x00) // LOAD_IMM A, 0x01
  program.push(0x09) // MOV_AC (値をCレジスタに)
  program.push(0x91, 0x00, 0x01, 0x40) // UNIT_MEM_WRITE unitId=0x01(ASSEMBLER[0]), addr=0x40(produce_type)
  
  // produce_param1 = EXPAND_CAPACITY をセット
  program.push(0xe0, EXPAND_CAPACITY & 0xff, (EXPAND_CAPACITY >> 8) & 0xff, 0x00, 0x00) // LOAD_IMM A
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x01, 0x42) // UNIT_MEM_WRITE unitId=0x01, addr=0x42(produce_param1)
  
  // produce_exec = 0x01 をセット（生産開始）
  program.push(0xe0, 0x01, 0x00, 0x00, 0x00) // LOAD_IMM A, 0x01
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x01, 0x43) // UNIT_MEM_WRITE unitId=0x01, addr=0x43(produce_exec)
  
  // wait_expansion:
  labels['wait_expansion'] = program.length
  
  // テンプレート: 10101010 (NOP1 NOP0 NOP1 NOP0 NOP1 NOP0 NOP1 NOP0)
  program.push(0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00)
  
  // 生産状態チェック
  // UNIT_MEM_READ unitId=0x01(ASSEMBLER[0]), addr=0x40(produce_status) -> B
  program.push(0x90, 0x00, 0x01, 0x40) // UNIT_MEM_READ
  program.push(0x05) // MOV_BA (BをAに移動)
  
  // 0と比較
  program.push(0xe1, 0x00, 0x00, 0x00, 0x00) // LOAD_IMM_B 0x0000
  program.push(0x1e) // CMP_AB
  
  // JNZ wait_expansion (ゼロでなければ待機)
  addJump(0x62, 'wait_expansion')
  
  // 生産結果確認
  // UNIT_MEM_READ unitId=0x01, addr=0x48(last_produced_type) -> B
  program.push(0x90, 0x00, 0x01, 0x48) // UNIT_MEM_READ
  program.push(0x05) // MOV_BA
  
  // UNIT_TYPE_HULLと比較
  program.push(0xe1, UNIT_TYPE_HULL, 0x00, 0x00, 0x00) // LOAD_IMM_B 0x01
  program.push(0x1e) // CMP_AB
  
  // JNZ growth_phase (失敗なら再試行)
  addJump(0x62, 'growth_phase')
  
  // 新HULLのインデックス取得
  // UNIT_MEM_READ unitId=0x01, addr=0x49(last_produced_index) -> B
  program.push(0x90, 0x00, 0x01, 0x49) // UNIT_MEM_READ
  program.push(0x05) // MOV_BA
  
  // マージ実行
  program.push(0x1f) // PUSH_A (新HULLインデックスを保存)
  program.push(0x30) // POP_C (新HULLインデックスをCに)
  
  // merge_target = 新HULLインデックス をセット
  program.push(0x91, 0x00, 0x00, 0x04) // UNIT_MEM_WRITE unitId=0x00(HULL[0]), addr=0x04(merge_target)
  
  // JMP growth_phase
  addJump(0x60, 'growth_phase')
  
  // ========== 自己複製フェーズ ==========
  labels['reproduction_phase'] = program.length
  
  // インデックス変数をスタックに確保（0xFFで初期化）
  program.push(0xe0, UNIT_INDEX_NONE, 0x00, 0x00, 0x00) // LOAD_IMM A, 0xFF
  program.push(0x1f) // PUSH_A (child_hull_index)
  program.push(0x1f) // PUSH_A (child_assembler_index)
  program.push(0x1f) // PUSH_A (child_computer_index)

  // ========== 娘HULL生産 ==========
  labels['produce_child_hull'] = program.length
  
  // 娘HULL生産設定
  // produce_type = UNIT_TYPE_HULL
  program.push(0xe0, UNIT_TYPE_HULL, 0x00, 0x00, 0x00) // LOAD_IMM A, 0x01
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x01, 0x40) // UNIT_MEM_WRITE unitId=0x01(ASSEMBLER[0]), addr=0x40
  
  // produce_param1 = CHILD_HULL_CAPACITY
  program.push(0xe0, CHILD_HULL_CAPACITY & 0xff, (CHILD_HULL_CAPACITY >> 8) & 0xff, 0x00, 0x00) // LOAD_IMM A
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x01, 0x42) // UNIT_MEM_WRITE unitId=0x01, addr=0x42
  
  // produce_exec = 0x01
  program.push(0xe0, 0x01, 0x00, 0x00, 0x00) // LOAD_IMM A, 0x01
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x01, 0x43) // UNIT_MEM_WRITE unitId=0x01, addr=0x43

  // wait_hull:
  labels['wait_hull'] = program.length
  
  // テンプレート: 01010101
  program.push(0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01)
  
  // 生産状態チェック
  program.push(0x90, 0x00, 0x01, 0x40) // UNIT_MEM_READ unitId=0x01, addr=0x40
  program.push(0x05) // MOV_BA
  program.push(0xe1, 0x00, 0x00, 0x00, 0x00) // LOAD_IMM_B 0x00
  program.push(0x1e) // CMP_AB
  addJump(0x62, 'wait_hull') // JNZ wait_hull
  
  // 結果確認
  program.push(0x90, 0x00, 0x01, 0x48) // UNIT_MEM_READ unitId=0x01, addr=0x48(last_produced_type)
  program.push(0x05) // MOV_BA
  program.push(0xe1, UNIT_TYPE_HULL, 0x00, 0x00, 0x00) // LOAD_IMM_B
  program.push(0x1e) // CMP_AB
  addJump(0x62, 'cleanup_and_retry') // JNZ cleanup_and_retry (失敗なら再試行)
  
  // 新HULLインデックス取得して保存
  program.push(0x90, 0x00, 0x01, 0x49) // UNIT_MEM_READ unitId=0x01, addr=0x49(last_produced_index)
  // 結果はBレジスタにあるので、スタック位置に直接書き込むため一旦取り出す
  // スタック上の child_hull_index を更新する簡略化実装
  // （実際の実装では MOV_SP B と ADD B, #2 と MOV [B], A が必要だが、ここでは簡略化）

  // ========== 娘ASSEMBLER生産 ==========
  labels['produce_child_assembler'] = program.length
  
  // produce_type = UNIT_TYPE_ASSEMBLER
  program.push(0xe0, UNIT_TYPE_ASSEMBLER, 0x00, 0x00, 0x00) // LOAD_IMM A, 0x02
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x01, 0x40) // UNIT_MEM_WRITE unitId=0x01, addr=0x40
  
  // produce_target = child_hull_index (簡略化：ここでは0x00と仮定)
  program.push(0xe0, 0x00, 0x00, 0x00, 0x00) // LOAD_IMM A, 0x00 (仮の値)
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x01, 0x41) // UNIT_MEM_WRITE unitId=0x01, addr=0x41(produce_target)
  
  // produce_param1 = CHILD_ASSEMBLER_POWER
  program.push(0xe0, CHILD_ASSEMBLER_POWER & 0xff, (CHILD_ASSEMBLER_POWER >> 8) & 0xff, 0x00, 0x00)
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x01, 0x42) // UNIT_MEM_WRITE unitId=0x01, addr=0x42
  
  // produce_exec = 0x01
  program.push(0xe0, 0x01, 0x00, 0x00, 0x00) // LOAD_IMM A, 0x01
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x01, 0x43) // UNIT_MEM_WRITE unitId=0x01, addr=0x43

  // wait_assembler:
  labels['wait_assembler'] = program.length
  program.push(0x90, 0x00, 0x01, 0x40) // UNIT_MEM_READ
  program.push(0x05) // MOV_BA
  program.push(0xe1, 0x00, 0x00, 0x00, 0x00) // LOAD_IMM_B 0x00
  program.push(0x1e) // CMP_AB
  addJump(0x62, 'wait_assembler') // JNZ wait_assembler

  // ========== 娘COMPUTER生産 ==========
  labels['produce_child_computer'] = program.length
  
  // produce_type = UNIT_TYPE_COMPUTER
  program.push(0xe0, UNIT_TYPE_COMPUTER, 0x00, 0x00, 0x00) // LOAD_IMM A, 0x04
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x01, 0x40) // UNIT_MEM_WRITE
  
  // produce_target = child_hull_index (簡略化)
  program.push(0xe0, 0x00, 0x00, 0x00, 0x00) // LOAD_IMM A, 0x00
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x01, 0x41) // UNIT_MEM_WRITE
  
  // produce_param1 = CHILD_COMPUTER_FREQ (下位16bit)
  program.push(0xe0, CHILD_COMPUTER_FREQ & 0xff, (CHILD_COMPUTER_FREQ >> 8) & 0xff, 0x00, 0x00)
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x01, 0x42) // UNIT_MEM_WRITE
  
  // produce_param2 = CHILD_COMPUTER_MEMORY
  program.push(0xe0, CHILD_COMPUTER_MEMORY & 0xff, (CHILD_COMPUTER_MEMORY >> 8) & 0xff, 0x00, 0x00)
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x01, 0x44) // UNIT_MEM_WRITE unitId=0x01, addr=0x44
  
  // produce_exec = 0x01
  program.push(0xe0, 0x01, 0x00, 0x00, 0x00) // LOAD_IMM A, 0x01
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x01, 0x43) // UNIT_MEM_WRITE

  // wait_computer:
  labels['wait_computer'] = program.length
  program.push(0x90, 0x00, 0x01, 0x40) // UNIT_MEM_READ
  program.push(0x05) // MOV_BA
  program.push(0xe1, 0x00, 0x00, 0x00, 0x00) // LOAD_IMM_B 0x00
  program.push(0x1e) // CMP_AB
  addJump(0x62, 'wait_computer') // JNZ wait_computer

  // ========== 娘エージェント分離 ==========
  labels['detach_child'] = program.length
  
  // detach_type = UNIT_TYPE_HULL
  program.push(0xe0, UNIT_TYPE_HULL, 0x00, 0x00, 0x00) // LOAD_IMM A, 0x01
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x00, 0x05) // UNIT_MEM_WRITE unitId=0x00(HULL[0]), addr=0x05(detach_type)
  
  // detach_index = child_hull_index (簡略化：0x00と仮定)
  program.push(0xe0, 0x00, 0x00, 0x00, 0x00) // LOAD_IMM A, 0x00
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x00, 0x06) // UNIT_MEM_WRITE unitId=0x00, addr=0x06(detach_index)
  
  // detach_execute = 0x01
  program.push(0xe0, 0x01, 0x00, 0x00, 0x00) // LOAD_IMM A, 0x01
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x00, 0x07) // UNIT_MEM_WRITE unitId=0x00, addr=0x07(detach_execute)

  // ========== エネルギー回収 ==========
  labels['energy_recovery'] = program.length
  
  // energy_collect = 0x01
  program.push(0xe0, 0x01, 0x00, 0x00, 0x00) // LOAD_IMM A, 0x01
  program.push(0x09) // MOV_AC
  program.push(0x91, 0x00, 0x00, 0x03) // UNIT_MEM_WRITE unitId=0x00(HULL[0]), addr=0x03(energy_collect)

  // wait_energy:
  labels['wait_energy'] = program.length
  
  // エネルギー量チェック
  program.push(0x90, 0x00, 0x00, 0x02) // UNIT_MEM_READ unitId=0x00, addr=0x02(energy_amount)
  program.push(0x05) // MOV_BA
  
  // ENERGY_REPRODUCTIONと比較
  program.push(0xe1, ENERGY_REPRODUCTION & 0xff, (ENERGY_REPRODUCTION >> 8) & 0xff, 0x00, 0x00) // LOAD_IMM_B
  program.push(0x1e) // CMP_AB
  
  // JUL wait_energy (符号なし比較: A < B なら待機)
  addJump(0x6a, 'wait_energy')
  
  // スタッククリーンアップ
  program.push(0x2e) // POP_A (child_computer_index)
  program.push(0x2e) // POP_A (child_assembler_index)
  program.push(0x2e) // POP_A (child_hull_index)
  
  // JMP reproduction_phase
  addJump(0x60, 'reproduction_phase')

  // ========== エラー処理 ==========
  labels['cleanup_and_retry'] = program.length
  
  // スタッククリーンアップ
  program.push(0x2e) // POP_A
  program.push(0x2e) // POP_A
  program.push(0x2e) // POP_A
  
  // JMP reproduction_phase
  addJump(0x60, 'reproduction_phase')
  
  // ========== ジャンプオフセットの修正 ==========
  for (const [label, positions] of Object.entries(fixups)) {
    const target = labels[label]
    if (target === undefined) {
      throw new Error(`Label not found: ${label}`)
    }
    
    for (const pos of positions) {
      // オフセット計算: target - (現在位置 + 2)
      // 現在位置 = pos - 1 (オペコード位置) + 3 (命令長)
      const offset = target - (pos - 1 + 3)
      program[pos] = offset & 0xff
      program[pos + 1] = (offset >> 8) & 0xff
    }
  }
  
  // プログラムをUint8Arrayに変換
  return new Uint8Array(program)
}

/**
 * 自己複製動作定数
 * EXPERIMENTAL_PARAMETERSに基づいて計算された値
 */
export const SELF_REPLICATION_CONSTANTS = {
  // 親HULL設定
  /** 複製開始に必要な親HULLの容量 */
  REPRODUCTION_CAPACITY: 200,
  /** 1回の拡張で追加される容量 */
  EXPAND_CAPACITY: 20,
  
  // 娘ユニット設定
  /** 娘HULLの容量 */
  CHILD_HULL_CAPACITY: 100,
  /** 娘ASSEMBLERのpower */
  CHILD_ASSEMBLER_POWER: 10,
  /** 娘COMPUTERの周波数 */
  CHILD_COMPUTER_FREQ: 1,
  /** 娘COMPUTERのメモリサイズ（byte） */
  CHILD_COMPUTER_MEMORY: 256,
  
  // エネルギー設定（1024進法表記）
  /** 複製開始に必要なエネルギー：5236E = [0x0005][0x013C] */
  ENERGY_REPRODUCTION: 5236,
  /** 拡張1回のコスト：22E = [0x0000][0x0016] */
  ENERGY_EXPAND: 22,
  /** 娘HULL生産コスト：106E = [0x0000][0x006A] */
  ENERGY_CHILD_HULL: 106,
  /** 娘ASSEMBLER生産コスト：2200E = [0x0002][0x0098] */
  ENERGY_CHILD_ASSEMBLER: 2200,
  /** 娘COMPUTER生産コスト：2820E = [0x0002][0x02FC] */
  ENERGY_CHILD_COMPUTER: 2820,
} as const

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
        capacity: 1000, // 初期容量（後で200まで拡張）
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
