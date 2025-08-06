import { VMState } from "./vm-state"
import { InstructionDecoder } from "./vm-decoder"
import { InstructionExecutor } from "./vm-executor"

describe("InstructionExecutor", () => {
  let vm: VMState

  beforeEach(() => {
    vm = new VMState(1024)
  })

  describe("NOP命令", () => {
    test("NOP0実行", () => {
      vm.writeMemory8(0, 0x00) // NOP0
      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(1)
      expect(vm.pc).toBe(1)
    })
  })

  describe("データ移動命令", () => {
    test("XCHG（レジスタ交換）", () => {
      vm.setRegister("A", 0x1234)
      vm.setRegister("B", 0x5678)
      vm.writeMemory8(0, 0x02) // XCHG

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0x5678)
      expect(vm.getRegister("B")).toBe(0x1234)
      expect(vm.pc).toBe(1)
    })

    test("MOV_AB（レジスタコピー）", () => {
      vm.setRegister("A", 0xabcd)
      vm.writeMemory8(0, 0x03) // MOV_AB

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("B")).toBe(0xabcd)
      expect(vm.pc).toBe(1)
    })

    test("MOV_SP（スタックポインタ読み取り）", () => {
      vm.sp = 0x8000
      vm.writeMemory8(0, 0x0d) // MOV_SP

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x8000)
    })

    test("SET_SP（スタックポインタ設定）", () => {
      vm.setRegister("A", 0x7fff)
      vm.writeMemory8(0, 0x0e) // SET_SP

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.sp).toBe(0x7fff)
    })

    test("MOV_A_IMM（即値ロード）", () => {
      vm.writeMemory8(0, 0x70) // MOV_A_IMM
      vm.writeMemory8(1, 0x34)
      vm.writeMemory8(2, 0x12)

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0x1234)
      expect(vm.pc).toBe(3)
    })
  })

  describe("算術演算命令", () => {
    test("INC_A（インクリメント）", () => {
      vm.setRegister("A", 0x00ff)
      vm.writeMemory8(0, 0x10) // INC_A

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x0100)
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
    })

    test("INC_A（キャリー発生）", () => {
      vm.setRegister("A", 0xffff)
      vm.writeMemory8(0, 0x10) // INC_A

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x0000)
      expect(vm.zeroFlag).toBe(true)
      expect(vm.carryFlag).toBe(true)
    })

    test("DEC_A（デクリメント）", () => {
      vm.setRegister("A", 0x0100)
      vm.writeMemory8(0, 0x14) // DEC_A

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x00ff)
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
    })

    test("ADD_AB（レジスタ加算）", () => {
      vm.setRegister("A", 0x1234)
      vm.setRegister("B", 0x5678)
      vm.writeMemory8(0, 0x18) // ADD_AB

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x68ac)
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
    })

    test("SUB_AB（レジスタ減算）", () => {
      vm.setRegister("A", 0x5678)
      vm.setRegister("B", 0x1234)
      vm.writeMemory8(0, 0x19) // SUB_AB

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x4444)
      expect(vm.zeroFlag).toBe(false)
      expect(vm.carryFlag).toBe(false)
    })

    test("XOR_AB（排他的論理和）", () => {
      vm.setRegister("A", 0xff00)
      vm.setRegister("B", 0x0ff0)
      vm.writeMemory8(0, 0x1a) // XOR_AB

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0xf0f0)
      expect(vm.carryFlag).toBe(false)
    })

    test("CMP_AB（比較）", () => {
      vm.setRegister("A", 0x1000)
      vm.setRegister("B", 0x1000)
      vm.writeMemory8(0, 0x1e) // CMP_AB

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x1000) // 値は変更されない
      expect(vm.zeroFlag).toBe(true)
      expect(vm.carryFlag).toBe(false)
    })

    test("ADD_A_IMM（即値加算）", () => {
      vm.setRegister("A", 0x1000)
      vm.writeMemory8(0, 0x74) // ADD_A_IMM
      vm.writeMemory8(1, 0x34)
      vm.writeMemory8(2, 0x12)

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x2234)
      expect(vm.pc).toBe(3)
    })
  })

  describe("スタック操作命令", () => {
    test("PUSH_A", () => {
      vm.setRegister("A", 0x1234)
      vm.sp = 0xfffe
      vm.writeMemory8(0, 0x1f) // PUSH_A

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.success).toBe(true)
      expect(result.cycles).toBe(2) // スタック操作は2サイクル
      expect(vm.sp).toBe(0xfffc)
      expect(vm.readMemory16(0xfffc)).toBe(0x1234)
    })

    test("POP_A", () => {
      vm.sp = 0xfffc
      vm.writeMemory16(0xfffc, 0x5678)
      vm.writeMemory8(0, 0x2e) // POP_A

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.cycles).toBe(2)
      expect(vm.getRegister("A")).toBe(0x5678)
      expect(vm.sp).toBe(0xfffe)
    })
  })

  describe("メモリアクセス命令", () => {
    test("LOAD_A（相対アドレス）", () => {
      vm.pc = 0x100
      vm.writeMemory8(0x100, 0x40) // LOAD_A
      vm.writeMemory8(0x101, 0x10) // offset low
      vm.writeMemory8(0x102, 0x00) // offset high
      vm.writeMemory8(0x113, 0x42) // データ（0x100 + 3 + 0x10）

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.cycles).toBe(2) // メモリアクセスは2サイクル
      expect(vm.getRegister("A")).toBe(0x42)
      expect(vm.pc).toBe(0x103)
    })

    test("STORE_A（相対アドレス）", () => {
      vm.setRegister("A", 0x1234)
      vm.writeMemory8(0, 0x41) // STORE_A
      vm.writeMemory8(1, 0x10)
      vm.writeMemory8(2, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.readMemory8(0x13)).toBe(0x34) // 下位バイトのみ
    })

    test("LOAD_IND（インデックス）", () => {
      vm.setRegister("B", 0x200)
      vm.writeMemory8(0, 0x42) // LOAD_IND
      vm.writeMemory8(1, 0x10) // offset
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(0x210, 0x99) // B + offset

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x99)
    })

    test("LOAD_REG（レジスタベース）", () => {
      vm.setRegister("C", 0x300) // レジスタ2
      vm.writeMemory8(0x300, 0x77)
      vm.writeMemory8(0, 0x50) // LOAD_REG
      vm.writeMemory8(1, 0x02) // Cレジスタ
      vm.writeMemory8(2, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x77)
    })

    test("LOAD_ABS（絶対アドレス）", () => {
      vm.writeMemory8(0x1234, 0x88)
      vm.writeMemory8(0, 0x80) // LOAD_ABS
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x34) // address low
      vm.writeMemory8(3, 0x12) // address high

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0x88)
      expect(vm.pc).toBe(4)
    })

    test("LOAD_ABS_W（16bitロード）", () => {
      vm.writeMemory16(0x1234, 0xabcd)
      vm.writeMemory8(0, 0x82) // LOAD_ABS_W
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x34)
      vm.writeMemory8(3, 0x12)

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.getRegister("A")).toBe(0xabcd)
    })
  })

  describe("ジャンプ命令", () => {
    test("JMP（無条件ジャンプ）", () => {
      vm.pc = 0x100
      vm.writeMemory8(0x100, 0x60) // JMP
      vm.writeMemory8(0x101, 0x10) // offset
      vm.writeMemory8(0x102, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.cycles).toBe(3) // ジャンプは3サイクル
      expect(vm.pc).toBe(0x113) // 0x100 + 3 + 0x10
    })

    test("JZ（ゼロフラグジャンプ - 成立）", () => {
      vm.zeroFlag = true
      vm.writeMemory8(0, 0x61) // JZ
      vm.writeMemory8(1, 0x20)
      vm.writeMemory8(2, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.cycles).toBe(3)
      expect(vm.pc).toBe(0x23) // 0 + 3 + 0x20
    })

    test("JZ（ゼロフラグジャンプ - 不成立）", () => {
      vm.zeroFlag = false
      vm.writeMemory8(0, 0x61) // JZ
      vm.writeMemory8(1, 0x20)
      vm.writeMemory8(2, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.cycles).toBe(1) // ジャンプしない場合は1サイクル
      expect(vm.pc).toBe(3) // 通常のPC進行
    })

    test("CALL（サブルーチン呼び出し）", () => {
      vm.pc = 0x100
      vm.sp = 0xfffe
      vm.writeMemory8(0x100, 0x65) // CALL
      vm.writeMemory8(0x101, 0x50)
      vm.writeMemory8(0x102, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.pc).toBe(0x153) // 0x100 + 3 + 0x50
      expect(vm.sp).toBe(0xfffc)
      expect(vm.readMemory16(0xfffc)).toBe(0x103) // リターンアドレス
    })

    test("RET（リターン）", () => {
      vm.sp = 0xfffc
      vm.writeMemory16(0xfffc, 0x200)
      vm.writeMemory8(0, 0x66) // RET
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.pc).toBe(0x200)
      expect(vm.sp).toBe(0xfffe)
    })

    test("JMP_ABS（絶対ジャンプ）", () => {
      vm.writeMemory8(0, 0x90) // JMP_ABS
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x34)
      vm.writeMemory8(3, 0x12)

      const decoded = InstructionDecoder.decode(vm)
      InstructionExecutor.execute(vm, decoded)

      expect(vm.pc).toBe(0x1234)
    })
  })

  describe("特殊命令", () => {
    test("HALT（実行停止）", () => {
      vm.writeMemory8(0, 0xff) // HALT
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(3, 0x00)
      vm.writeMemory8(4, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.success).toBe(true)
      expect(result.halted).toBe(true)
      expect(result.cycles).toBe(1)
      expect(vm.pc).toBe(0) // PCは進まない
    })

    describe("SCANM命令", () => {
      test("メモリブロックのコピーが正しく動作する", () => {
        const memory = vm.getMemoryArray()
        
        // ソースデータを設定
        for (let i = 0; i < 10; i++) {
          memory[0x10 + i] = i + 1
        }

        // SCANM命令を配置: 0x10から0x80へコピー
        memory[0] = 0xc2 // SCANM
        memory[1] = 0x10 // src低位
        memory[2] = 0x00 // src高位
        memory[3] = 0x80 // dest低位
        memory[4] = 0x00 // dest高位

        // レジスタCに長さを設定
        vm.setRegister("C", 10)

        // 実行
        const decoded = InstructionDecoder.decode(vm)
        const result = InstructionExecutor.execute(vm, decoded)

        expect(result.success).toBe(true)
        expect(result.cycles).toBe(15) // 5 + 10バイト

        // コピー結果を確認
        for (let i = 0; i < 10; i++) {
          expect(memory[0x80 + i]).toBe(i + 1)
        }

        // ソースデータは変更されていない
        for (let i = 0; i < 10; i++) {
          expect(memory[0x10 + i]).toBe(i + 1)
        }
      })

      test("レジスタCが0の場合は256バイトコピー", () => {
        const memory = vm.getMemoryArray()
        
        // SCANM命令を配置
        memory[0] = 0xc2 // SCANM
        memory[1] = 0x10 // src低位
        memory[2] = 0x00 // src高位
        memory[3] = 0x80 // dest低位
        memory[4] = 0x00 // dest高位

        // レジスタCに0を設定（256バイトとして扱われる）
        vm.setRegister("C", 0)

        // ソースデータを設定
        for (let i = 0; i < 10; i++) {
          memory[0x10 + i] = i + 1
        }

        // 実行
        const decoded = InstructionDecoder.decode(vm)
        const result = InstructionExecutor.execute(vm, decoded)

        expect(result.success).toBe(true)
        expect(result.cycles).toBe(261) // 5 + 256バイト

        // 最初の10バイトがコピーされている
        for (let i = 0; i < 10; i++) {
          expect(memory[0x80 + i]).toBe(i + 1)
        }
      })

      test("最大256バイトまでコピー可能", () => {
        const memory = vm.getMemoryArray()
        
        // SCANM命令を配置
        memory[0] = 0xc2 // SCANM
        memory[1] = 0x00 // src低位
        memory[2] = 0x00 // src高位
        memory[3] = 0x00 // dest低位
        memory[4] = 0x01 // dest高位（0x100）

        // レジスタCに256を設定（0x100）
        vm.setRegister("C", 0x100) // 下位8ビットは0x00 (=256)

        // 実行
        const decoded = InstructionDecoder.decode(vm)
        const result = InstructionExecutor.execute(vm, decoded)

        expect(result.success).toBe(true)
        expect(result.cycles).toBe(261) // 5 + 256バイト（最大）
      })

      test("レジスタCの下位8ビットのみが使用される", () => {
        const memory = vm.getMemoryArray()
        
        // SCANM命令を配置
        memory[0] = 0xc2 // SCANM
        memory[1] = 0x00 // src低位
        memory[2] = 0x00 // src高位
        memory[3] = 0x00 // dest低位
        memory[4] = 0x01 // dest高位（0x100）

        // レジスタCに大きな値を設定
        vm.setRegister("C", 0x150) // 336 → 下位8ビットは0x50(80)

        // 実行
        const decoded = InstructionDecoder.decode(vm)
        const result = InstructionExecutor.execute(vm, decoded)

        expect(result.success).toBe(true)
        expect(result.cycles).toBe(85) // 5 + 80バイト (0x50)
      })

      test("メモリの循環バッファとして動作する", () => {
        const memory = vm.getMemoryArray()
        
        // メモリ末尾付近にデータを配置
        memory[1022] = 0xaa
        memory[1023] = 0xbb
        memory[0] = 0xcc // 循環
        memory[1] = 0xdd

        // SCANM命令を配置
        memory[10] = 0xc2 // SCANM
        memory[11] = 0xfe // src低位（1022）
        memory[12] = 0x03 // src高位
        memory[13] = 0x20 // dest低位（32）
        memory[14] = 0x00 // dest高位

        // レジスタCに長さを設定
        vm.setRegister("C", 4)
        vm.pc = 10

        // 実行
        const decoded = InstructionDecoder.decode(vm)
        const result = InstructionExecutor.execute(vm, decoded)

        expect(result.success).toBe(true)

        // コピー結果を確認（循環を考慮）
        expect(memory[32]).toBe(0xaa) // memory[1022]
        expect(memory[33]).toBe(0xbb) // memory[1023]
        expect(memory[34]).toBe(0xcc) // memory[0]
        expect(memory[35]).toBe(0xdd) // memory[1]
      })

      test("プログラムカウンタが正しく進む", () => {
        const memory = vm.getMemoryArray()
        
        // SCANM命令を配置
        memory[0] = 0xc2 // SCANM
        memory[1] = 0x00
        memory[2] = 0x00
        memory[3] = 0x00
        memory[4] = 0x00

        vm.setRegister("C", 1)

        // 実行
        const decoded = InstructionDecoder.decode(vm)
        const result = InstructionExecutor.execute(vm, decoded)

        expect(result.success).toBe(true)
        expect(vm.pc).toBe(5) // 5バイト命令
      })

      test("自己複製コードの例", () => {
        const memory = vm.getMemoryArray()
        
        // 簡単なプログラム
        memory[0x10] = 0x03 // MOV_AB
        memory[0x11] = 0x04 // MOV_AD
        memory[0x12] = 0x05 // MOV_BA
        memory[0x13] = 0xff // HALT

        // SCANM命令でプログラムを複製
        memory[0] = 0xc2 // SCANM
        memory[1] = 0x10 // src低位
        memory[2] = 0x00 // src高位
        memory[3] = 0x80 // dest低位
        memory[4] = 0x00 // dest高位

        vm.setRegister("C", 4) // 4バイトコピー

        // 実行
        const decoded = InstructionDecoder.decode(vm)
        const result = InstructionExecutor.execute(vm, decoded)

        expect(result.success).toBe(true)

        // コピー先にプログラムが複製されている
        expect(memory[0x80]).toBe(0x03) // MOV_AB
        expect(memory[0x81]).toBe(0x04) // MOV_AD
        expect(memory[0x82]).toBe(0x05) // MOV_BA
        expect(memory[0x83]).toBe(0xff) // HALT
      })
    })

    describe("ASSEMBLE命令", () => {
      test("ユニットコンテキストなしでエラー", () => {
        const memory = vm.getMemoryArray()
        
        // ASSEMBLE命令を配置
        memory[0] = 0xc3 // ASSEMBLE
        memory[1] = 0x40 // ユニットID (ASSEMBLER[0])
        memory[2] = 0x00 // コマンド（開始）
        memory[3] = 0x00 // 予約
        memory[4] = 0x00 // 予約

        // 実行（ユニットコンテキストなし）
        const decoded = InstructionDecoder.decode(vm)
        const result = InstructionExecutor.execute(vm, decoded)

        expect(result.success).toBe(false)
        expect(result.error).toContain("ASSEMBLE instruction requires unit context")
      })

      test("無効なコマンドでエラー", () => {
        const memory = vm.getMemoryArray()
        
        // モックユニット
        /*
        const hull: Hull = {
          id: "hull-1" as ObjectId,
          type: "HULL",
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          radius: 10,
          initialEnergy: 100,
          currentEnergy: 100,
          capacity: 200,
          storedEnergy: 0,
          attachedUnits: ["computer-1" as ObjectId, "assembler-1" as ObjectId],
        }
        */
        
        const computer: Computer = {
          id: "computer-1" as ObjectId,
          type: "COMPUTER",
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          radius: 5,
          initialEnergy: 50,
          currentEnergy: 50,
          parentHull: "hull-1" as ObjectId,
          processingPower: 10,
          memorySize: 256,
          memory: new Uint8Array(256),
          programCounter: 0,
          registers: new Uint16Array(4),
          stackPointer: 0xffff,
          zeroFlag: false,
          carryFlag: false,
          isRunning: true,
          vmCyclesExecuted: 0,
        }
        
        const assembler: Assembler = {
          id: "assembler-1" as ObjectId,
          type: "ASSEMBLER",
          position: { x: 10, y: 0 },
          velocity: { x: 0, y: 0 },
          radius: 7,
          initialEnergy: 100,
          currentEnergy: 100,
          parentHull: "hull-1" as ObjectId,
          assemblePower: 5,
          isAssembling: false,
          progress: 0,
        }
        
        // findUnitByIdモック
        const originalFindUnitById = InstructionExecutor.findUnitById
        InstructionExecutor.findUnitById = jest.fn((currentUnit, unitId) => {
          if (unitId === 0x40) {
            return assembler
          }
          return null
        })
        
        // ASSEMBLE命令を配置
        memory[0] = 0xc3 // ASSEMBLE
        memory[1] = 0x40 // ユニットID (ASSEMBLER[0])
        memory[2] = 0xff // 無効なコマンド
        memory[3] = 0x00 // 予約
        memory[4] = 0x00 // 予約

        // 実行
        const decoded = InstructionDecoder.decode(vm)
        const result = InstructionExecutor.execute(vm, decoded, computer)

        expect(result.success).toBe(false)
        expect(result.error).toContain("Invalid ASSEMBLE command: 255")
        
        // モックを元に戻す
        InstructionExecutor.findUnitById = originalFindUnitById
      })
    })
  })

  describe("エラー処理", () => {
    test("未定義命令", () => {
      vm.writeMemory8(0, 0x3f) // 未定義

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Undefined instruction")
    })

    test("ユニット制御命令（ユニットコンテキストなし）", () => {
      vm.writeMemory8(0, 0xa0) // UNIT_MEM_READ
      vm.writeMemory8(1, 0x00)
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(3, 0x00)

      const decoded = InstructionDecoder.decode(vm)
      const result = InstructionExecutor.execute(vm, decoded)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Unit control instruction requires unit context")
    })
  })

  describe("step実行", () => {
    test("単一ステップ実行", () => {
      vm.writeMemory8(0, 0x10) // INC_A
      vm.setRegister("A", 0x00)

      const result = InstructionExecutor.step(vm)

      expect(result.success).toBe(true)
      expect(vm.getRegister("A")).toBe(0x01)
      expect(vm.pc).toBe(1)
    })
  })

  describe("run実行", () => {
    test("複数命令の連続実行", () => {
      // プログラム: A=1, A++, A++, HALT
      vm.writeMemory8(0, 0x70) // MOV_A_IMM
      vm.writeMemory8(1, 0x01)
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(3, 0x10) // INC_A
      vm.writeMemory8(4, 0x10) // INC_A
      vm.writeMemory8(5, 0xff) // HALT
      vm.writeMemory8(6, 0x00)
      vm.writeMemory8(7, 0x00)
      vm.writeMemory8(8, 0x00)
      vm.writeMemory8(9, 0x00)

      const cycles = InstructionExecutor.run(vm, 10)

      expect(cycles).toBe(4) // 1 + 1 + 1 + 1
      expect(vm.getRegister("A")).toBe(0x03)
      expect(vm.pc).toBe(5) // HALTで停止
    })

    test("HALT命令で停止", () => {
      vm.writeMemory8(0, 0x10) // INC_A
      vm.writeMemory8(1, 0xff) // HALT
      vm.writeMemory8(2, 0x00)
      vm.writeMemory8(3, 0x00)
      vm.writeMemory8(4, 0x00)
      vm.writeMemory8(5, 0x00)
      vm.writeMemory8(6, 0x10) // INC_A（実行されない）

      const cycles = InstructionExecutor.run(vm, 10)

      expect(cycles).toBe(2) // INC_A(1) + HALT(1)
      expect(vm.getRegister("A")).toBe(0x01)
      expect(vm.pc).toBe(1) // HALTで停止
    })

    test("最大サイクル制限", () => {
      // 無限ループ
      vm.writeMemory8(0, 0x60) // JMP
      vm.writeMemory8(1, 0xfd) // -3
      vm.writeMemory8(2, 0xff)

      const cycles = InstructionExecutor.run(vm, 10)

      expect(cycles).toBe(12) // 3サイクル × 4回 = 12（10を超える）
    })
  })
})
