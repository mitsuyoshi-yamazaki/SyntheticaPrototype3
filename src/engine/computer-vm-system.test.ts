import { ComputerVMSystem } from "./computer-vm-system"
import { ObjectFactory } from "./object-factory"
import { VMState } from "./vm-state"
import type { Computer, ObjectId } from "@/types/game"
import { setGameLawParameters, TEST_PARAMETERS } from "@/config/game-law-parameters"

// テスト用パラメータを設定
beforeAll(() => {
  setGameLawParameters(TEST_PARAMETERS)
})

describe("ComputerVMSystem", () => {
  let factory: ObjectFactory
  let computer: Computer

  beforeEach(() => {
    factory = new ObjectFactory(1000, 1000)
    computer = factory.createComputer(
      1 as ObjectId,
      { x: 100, y: 100 },
      10, // 処理能力: 10サイクル/tick
      256, // メモリサイズ: 256バイト
      undefined,
      { x: 0, y: 0 }
    )
  })

  describe("createVMState", () => {
    test("COMPUTERユニットからVMStateを作成", () => {
      // レジスタとフラグを設定
      computer.registers[0] = 0x1234 // A
      computer.registers[1] = 0x5678 // B
      computer.registers[2] = 0xabcd // C
      computer.registers[3] = 0xef00 // D
      computer.programCounter = 0x10
      computer.stackPointer = 0xf0
      computer.zeroFlag = true
      computer.carryFlag = false

      const vm = ComputerVMSystem.createVMState(computer)

      expect(vm.getRegister("A")).toBe(0x1234)
      expect(vm.getRegister("B")).toBe(0x5678)
      expect(vm.getRegister("C")).toBe(0xabcd)
      expect(vm.getRegister("D")).toBe(0xef00)
      expect(vm.pc).toBe(0x10)
      expect(vm.sp).toBe(0xf0)
      expect(vm.zeroFlag).toBe(true)
      expect(vm.carryFlag).toBe(false)
      expect(vm.memorySize).toBe(256)
    })

    test("メモリ内容が共有される", () => {
      computer.memory[0] = 0x42
      const vm = ComputerVMSystem.createVMState(computer)

      expect(vm.readMemory8(0)).toBe(0x42)

      // VMで変更
      vm.writeMemory8(0, 0x99)

      // computerのメモリも変更される
      expect(computer.memory[0]).toBe(0x99)
    })
  })

  describe("syncVMState", () => {
    test("VMStateをCOMPUTERユニットに同期", () => {
      const vm = new VMState(256)

      // VM状態を設定
      vm.setRegister("A", 0xaaaa)
      vm.setRegister("B", 0xbbbb)
      vm.setRegister("C", 0xcccc)
      vm.setRegister("D", 0xdddd)
      vm.pc = 0x50
      vm.sp = 0x80
      vm.zeroFlag = false
      vm.carryFlag = true

      ComputerVMSystem.syncVMState(vm, computer)

      expect(computer.registers[0]).toBe(0xaaaa)
      expect(computer.registers[1]).toBe(0xbbbb)
      expect(computer.registers[2]).toBe(0xcccc)
      expect(computer.registers[3]).toBe(0xdddd)
      expect(computer.programCounter).toBe(0x50)
      expect(computer.stackPointer).toBe(0x80)
      expect(computer.zeroFlag).toBe(false)
      expect(computer.carryFlag).toBe(true)
    })
  })

  describe("executeVM", () => {
    test("エラーがある場合でも実行を継続", () => {
      computer.vmError = "Some error"
      computer.programCounter = 0
      computer.memory[0] = 0x10 // INC_A
      computer.memory[1] = 0xff // HALT
      computer.registers[0] = 0

      ComputerVMSystem.executeVM(computer)

      expect(computer.programCounter).toBe(1) // INC_A実行後の位置
      expect(computer.registers[0]).toBe(1) // INC_Aが実行された
      expect(computer.vmCyclesExecuted).toBe(2) // INC_A(1) + HALT(1)
      expect(computer.vmError).toBeUndefined() // エラーがクリアされる
    })

    test("PCが範囲外でエラーがある場合は0にリセット", () => {
      computer.vmError = "Previous error"
      computer.programCounter = 300 // メモリサイズを超える
      computer.memory[0] = 0x10 // INC_A
      computer.memory[1] = 0xff // HALT
      computer.registers[0] = 0

      ComputerVMSystem.executeVM(computer)

      expect(computer.programCounter).toBe(1) // 0から実行されて1に進む
      expect(computer.registers[0]).toBe(1) // INC_Aが実行された
      expect(computer.vmCyclesExecuted).toBe(2) // INC_A(1) + HALT(1)
      expect(computer.vmError).toBeUndefined() // エラーがクリアされる
    })

    test("単純なプログラムの実行", () => {
      // プログラム: INC_A, INC_A, HALT
      computer.memory[0] = 0x10 // INC_A
      computer.memory[1] = 0x10 // INC_A
      computer.memory[2] = 0xff // HALT
      computer.memory[3] = 0x00
      computer.memory[4] = 0x00
      computer.memory[5] = 0x00
      computer.memory[6] = 0x00

      computer.registers[0] = 5 // A = 5

      ComputerVMSystem.executeVM(computer)

      expect(computer.registers[0]).toBe(7) // 5 + 2
      expect(computer.programCounter).toBe(2) // INC_A×2実行後HALTで停止
      expect(computer.vmCyclesExecuted).toBe(3) // 1 + 1 + 1
      expect(computer.vmError).toBeUndefined()
    })

    test("処理能力の制限", () => {
      // 長いプログラム
      for (let i = 0; i < 20; i++) {
        computer.memory[i] = 0x10 // INC_A
      }

      computer.processingPower = 5 // 5サイクル/tick
      computer.registers[0] = 0

      ComputerVMSystem.executeVM(computer)

      expect(computer.registers[0]).toBe(5) // 5回実行
      expect(computer.programCounter).toBe(5)
      expect(computer.vmCyclesExecuted).toBe(5)
      expect(computer.vmError).toBeUndefined() // エラーなし
    })

    test("既に実行済みサイクルがある場合", () => {
      computer.memory[0] = 0x10 // INC_A
      computer.memory[1] = 0x10 // INC_A

      computer.processingPower = 10
      computer.vmCyclesExecuted = 9 // 既に9サイクル実行済み
      computer.registers[0] = 0

      ComputerVMSystem.executeVM(computer)

      expect(computer.registers[0]).toBe(1) // 1回のみ実行
      expect(computer.programCounter).toBe(1)
      expect(computer.vmCyclesExecuted).toBe(10) // 9 + 1
    })

    test("未定義命令でもスキップして継続", () => {
      computer.memory[0] = 0xfe // 未定義命令
      computer.memory[1] = 0x10 // INC_A
      computer.memory[2] = 0xff // HALT
      computer.registers[0] = 0

      ComputerVMSystem.executeVM(computer)

      expect(computer.programCounter).toBe(2) // 未定義命令(+1)、INC_A(+1)実行後HALTで停止
      expect(computer.registers[0]).toBe(1) // INC_Aが実行された
      expect(computer.vmCyclesExecuted).toBe(3) // エラー(1) + INC_A(1) + HALT(1)
      expect(computer.vmError).toBeUndefined() // エラーはクリアされる
    })

    test("ジャンプ命令でのサイクル消費", () => {
      // プログラム: JMP +3, NOP, NOP, INC_A, HALT
      computer.memory[0] = 0x60 // JMP
      computer.memory[1] = 0x03 // offset +3
      computer.memory[2] = 0x00
      computer.memory[3] = 0x00 // NOP（スキップされる）
      computer.memory[4] = 0x00 // NOP（スキップされる）
      computer.memory[5] = 0x00 // NOP（スキップされる）
      computer.memory[6] = 0x10 // INC_A（アドレス6: PC=0 + 命令長3 + offset3 = 6）
      computer.memory[7] = 0xff // HALT
      computer.memory[8] = 0x00
      computer.memory[9] = 0x00
      computer.memory[10] = 0x00
      computer.memory[11] = 0x00

      computer.processingPower = 10
      computer.registers[0] = 0

      ComputerVMSystem.executeVM(computer)

      expect(computer.registers[0]).toBe(1)
      expect(computer.programCounter).toBe(7) // JMP(0→6)、INC_A実行(6→7)、HALTで停止
      expect(computer.vmCyclesExecuted).toBe(5) // JMP(3) + INC_A(1) + HALT(1)
      expect(computer.vmError).toBeUndefined() // エラーなし
    })
  })

  describe("resetCycleCounter", () => {
    test("サイクルカウンタのリセット", () => {
      computer.vmCyclesExecuted = 123

      ComputerVMSystem.resetCycleCounter(computer)

      expect(computer.vmCyclesExecuted).toBe(0)
    })
  })

  describe("startProgram", () => {
    test("プログラムの開始", () => {
      computer.programCounter = 99
      computer.vmError = "Some error"
      computer.vmCyclesExecuted = 10

      ComputerVMSystem.startProgram(computer)

      expect(computer.programCounter).toBe(0)
      expect(computer.vmError).toBeUndefined()
      expect(computer.vmCyclesExecuted).toBe(0)
    })

    test("指定アドレスからの開始", () => {
      ComputerVMSystem.startProgram(computer, 0x50)

      expect(computer.programCounter).toBe(0x50)
      expect(computer.vmError).toBeUndefined()
    })
  })

  describe("stopProgram", () => {
    test("プログラムの停止", () => {
      ComputerVMSystem.stopProgram(computer)

      expect(computer.vmError).toBe("Program stopped")
    })
  })

  describe("loadProgram", () => {
    test("プログラムのロード", () => {
      const program = new Uint8Array([0x10, 0x20, 0x30, 0x40])

      ComputerVMSystem.loadProgram(computer, program)

      expect(computer.memory[0]).toBe(0x10)
      expect(computer.memory[1]).toBe(0x20)
      expect(computer.memory[2]).toBe(0x30)
      expect(computer.memory[3]).toBe(0x40)
    })

    test("指定アドレスへのロード", () => {
      const program = new Uint8Array([0xaa, 0xbb])

      ComputerVMSystem.loadProgram(computer, program, 0x10)

      expect(computer.memory[0x10]).toBe(0xaa)
      expect(computer.memory[0x11]).toBe(0xbb)
    })

    test("メモリサイズを超えるプログラム", () => {
      const program = new Uint8Array(300) // メモリサイズ256を超える
      for (let i = 0; i < 300; i++) {
        program[i] = i & 0xff
      }

      ComputerVMSystem.loadProgram(computer, program)

      expect(computer.memory[255]).toBe(255)
      expect(computer.memory.length).toBe(256) // メモリサイズは変わらない
    })
  })
})
