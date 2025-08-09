/**
 * 自己複製エージェントプリセットのテスト
 */

import { SELF_REPLICATOR_PRESET, SELF_REPLICATION_CONSTANTS } from "./self-replicator-preset"
import { InstructionDecoder } from "../vm-decoder"
import { VMState } from "../vm-state"

describe("SelfReplicatorPreset", () => {
  describe("定数定義", () => {
    test("自己複製定数が正しく定義されている", () => {
      expect(SELF_REPLICATION_CONSTANTS.REPRODUCTION_CAPACITY).toBe(200)
      expect(SELF_REPLICATION_CONSTANTS.EXPAND_CAPACITY).toBe(20)
      expect(SELF_REPLICATION_CONSTANTS.CHILD_HULL_CAPACITY).toBe(100)
      expect(SELF_REPLICATION_CONSTANTS.CHILD_ASSEMBLER_POWER).toBe(10)
      expect(SELF_REPLICATION_CONSTANTS.CHILD_COMPUTER_FREQ).toBe(1)
      expect(SELF_REPLICATION_CONSTANTS.CHILD_COMPUTER_MEMORY).toBe(256)
      expect(SELF_REPLICATION_CONSTANTS.ENERGY_REPRODUCTION).toBe(5236)
    })
  })

  describe("プリセット構造", () => {
    test("基本構造が正しい", () => {
      expect(SELF_REPLICATOR_PRESET.case).toBe("single-hull, single-computer")
      expect(SELF_REPLICATOR_PRESET.name).toBe("BasicSelfReplicator")
      expect(SELF_REPLICATOR_PRESET.units).toHaveLength(3)
    })

    test("HULLユニットの設定が正しい", () => {
      const hull = SELF_REPLICATOR_PRESET.units[0]
      expect(hull?.type).toBe("HULL")
      expect(hull?.parameters.type).toBe("HULL")
      expect(hull?.parameters.capacity).toBe(1000)
      expect(hull?.isAttached).toBe(false)
    })

    test("ASSEMBLERユニットの設定が正しい", () => {
      const assembler = SELF_REPLICATOR_PRESET.units[1]
      expect(assembler?.type).toBe("ASSEMBLER")
      expect(assembler?.parameters.type).toBe("ASSEMBLER")
      expect(assembler?.parameters.assemblePower).toBe(10)
      expect(assembler?.isAttached).toBe(true)
    })

    test("COMPUTERユニットの設定が正しい", () => {
      const computer = SELF_REPLICATOR_PRESET.units[2]
      expect(computer?.type).toBe("COMPUTER")
      expect(computer?.parameters.type).toBe("COMPUTER")
      expect(computer?.parameters.processingPower).toBe(5)
      expect(computer?.parameters.memorySize).toBe(512)
      expect(computer?.isAttached).toBe(true)
    })
  })

  describe("生成されたプログラム", () => {
    test("プログラムが生成される", () => {
      expect(SELF_REPLICATOR_PRESET.program).toBeInstanceOf(Uint8Array)
      expect(SELF_REPLICATOR_PRESET.program.length).toBeGreaterThan(0)
    })

    test("スタック初期化で開始する", () => {
      const program = SELF_REPLICATOR_PRESET.program
      // LOAD_IMM A, 0xFFFF
      expect(program[0]).toBe(0xe0) // LOAD_IMM
      expect(program[1]).toBe(0xff)
      expect(program[2]).toBe(0xff)
      expect(program[3]).toBe(0x00)
      expect(program[4]).toBe(0x00)
      // SET_SP
      expect(program[5]).toBe(0x0e)
    })

    test("主要な命令が含まれている", () => {
      const program = SELF_REPLICATOR_PRESET.program
      const vm = new VMState(65536)
      
      // プログラムをメモリにロード
      for (let i = 0; i < program.length; i++) {
        vm.writeMemory8(i, program[i] ?? 0)
      }

      // いくつかの命令をデコードして確認
      const instructions: string[] = []
      let pc = 0
      let count = 0
      const maxInstructions = 20 // 最初の20命令を確認

      while (pc < program.length && count < maxInstructions) {
        const decoded = InstructionDecoder.decodeAt(vm, pc)
        if (decoded.instruction) {
          instructions.push(decoded.instruction.mnemonic)
        }
        pc += decoded.length
        count++
      }

      // 期待される命令が含まれているか確認
      expect(instructions).toContain("LOAD_IMM") // 即値ロード
      expect(instructions).toContain("SET_SP") // スタック初期化
      expect(instructions).toContain("UNIT_MEM_READ") // ユニットメモリ読み取り
      expect(instructions).toContain("MOV_BA") // レジスタ移動
      expect(instructions).toContain("CMP_AB") // 比較
    })

    test("テンプレートパターンが含まれている", () => {
      const program = SELF_REPLICATOR_PRESET.program
      
      // 10101010パターンを探す（成長フェーズの待機）
      let found10101010 = false
      for (let i = 0; i <= program.length - 8; i++) {
        if (
          program[i] === 0x01 && program[i+1] === 0x00 &&
          program[i+2] === 0x01 && program[i+3] === 0x00 &&
          program[i+4] === 0x01 && program[i+5] === 0x00 &&
          program[i+6] === 0x01 && program[i+7] === 0x00
        ) {
          found10101010 = true
          break
        }
      }
      expect(found10101010).toBe(true)

      // 01010101パターンを探す（娘HULL生産の待機）
      let found01010101 = false
      for (let i = 0; i <= program.length - 8; i++) {
        if (
          program[i] === 0x00 && program[i+1] === 0x01 &&
          program[i+2] === 0x00 && program[i+3] === 0x01 &&
          program[i+4] === 0x00 && program[i+5] === 0x01 &&
          program[i+6] === 0x00 && program[i+7] === 0x01
        ) {
          found01010101 = true
          break
        }
      }
      expect(found01010101).toBe(true)
    })

    test("ジャンプオフセットが正しく設定されている", () => {
      const program = SELF_REPLICATOR_PRESET.program
      const vm = new VMState(65536)
      
      // プログラムをメモリにロード
      for (let i = 0; i < program.length; i++) {
        vm.writeMemory8(i, program[i] ?? 0)
      }

      // ジャンプ命令を探して、オフセットが妥当な範囲内か確認
      let pc = 0
      while (pc < program.length) {
        const decoded = InstructionDecoder.decodeAt(vm, pc)
        
        if (decoded.instruction?.type === "JUMP") {
          const offset = decoded.operands.offset16
          if (offset !== undefined) {
            const target = (pc + decoded.length + offset) & 0xffff
            // ジャンプ先がプログラム範囲内であることを確認
            expect(target).toBeGreaterThanOrEqual(0)
            expect(target).toBeLessThan(program.length + 100) // 少し余裕を持たせる
          }
        }
        
        pc += decoded.length
      }
    })
  })
})