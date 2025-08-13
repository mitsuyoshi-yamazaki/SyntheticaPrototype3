import { Assembler, Computer, Hull, Unit } from "../types/game"

export class VMInvalidUnitMemoryError extends Error {
  public constructor(public readonly errorType: "Memory index out of range" | "Readonly memory") {
    super(errorType)
    this.name = "VMInvalidUnitMemoryError"
  }
}

export const VMUnitMemoryAccessor = {
  readMemory(unit: Unit, memoryIndex: number): number {
    try {
      switch (unit.type) {
        case "HULL":
          return readHullMemory(unit, memoryIndex)
        case "ASSEMBLER":
          return readAssemblerMemory(unit, memoryIndex)
        case "COMPUTER":
          return readComputerMemory(unit, memoryIndex)
        default: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _: never = unit
          return 0xff
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return 0xff
    }
  },

  writeMemory(unit: Unit, memoryIndex: number, value: number): void {
    try {
      switch (unit.type) {
        case "HULL":
          writeHullMemory(unit, memoryIndex, value)
          return
        case "ASSEMBLER":
          writeAssemblerMemory(unit, memoryIndex, value)
          return
        case "COMPUTER":
          writeComputerMemory(unit, memoryIndex, value)
          return
        default: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _: never = unit
          break
        }
      } // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return
    }
  },
}

/** throws */
const readHullMemory: (hull: Hull, memoryIndex: number) => number = (hull, memoryIndex) => {
  switch (memoryIndex) {
    case 0x00: // [R] uint HULL容量（スペック）
      return hull.capacity // FixMe: 16bit必要ではないか？
    case 0x01: // [R] uint 現在の格納量
      return hull.storedEnergy + hull.attachedUnitIds.length * 100 // FixMe: 接続しているユニット容積を算出する
    case 0x02: // [R] uint エネルギー格納量
      return hull.storedEnergy
    case 0x03: // [RW] bool エネルギー回収状態
      return hull.collectingEnergy ? 0x01 : 0x00
    case 0x04: // [RW] uint マージ対象指定
      return 0xff // TODO: 実装する
    case 0x05: // [RW] uint 分離対象ユニット種別
      return 0xff // TODO: 実装する
    case 0x06: // [RW] uint 分離対象ユニットindex
      return 0xff // TODO: 実装する
    case 0x07: // [RW] bool 分離実行フラグ。Trueを書き込むとリセット実行。実行後Falseがセットされる
      return 0x00 // TODO: 実装する
    default:
      throw new VMInvalidUnitMemoryError("Memory index out of range")
  }
}

/** throws */
const writeHullMemory: (hull: Hull, memoryIndex: number, value: number) => void = (
  hull,
  memoryIndex,
  value
) => {
  switch (memoryIndex) {
    case 0x00: // [R] uint HULL容量（スペック）
    case 0x01: // [R] uint 現在の格納量
    case 0x02: // [R] uint エネルギー格納量
      throw new VMInvalidUnitMemoryError("Readonly memory")

    case 0x03: // [RW] bool エネルギー回収状態
      hull.collectingEnergy = value === 0x00 ? false : true
      return
    case 0x04: // [RW] uint マージ対象指定
      // TODO: 実装する
      return
    case 0x05: // [RW] uint 分離対象ユニット種別
      // TODO: 実装する
      return
    case 0x06: // [RW] uint 分離対象ユニットindex
      // TODO: 実装する
      return
    case 0x07: // [RW] bool 分離実行フラグ。Trueを書き込むとリセット実行。実行後Falseがセットされる
      // TODO: 実装する
      return
    default:
      throw new VMInvalidUnitMemoryError("Memory index out of range")
  }
}

/** throws */
const readAssemblerMemory: (assembler: Assembler, memoryIndex: number) => number = (
  assembler,
  memoryIndex
) => {
  switch (memoryIndex) {
    case 0x00: // [R] uint assemble_power（スペック）
      return assembler.assemblePower
    case 0x01: // [RW] uint 生産ユニット種別
      return 0xff // TODO: 実装する
    case 0x02: // [RW] uint 生産ユニット接続HULL index
      return 0xff // TODO: 実装する
    case 0x03: // [RW] uint 生産パラメータ1
      return 0xff // TODO: 実装する
    case 0x04: // [RW] uint 生産パラメータ2
      return 0xff // TODO: 実装する
    case 0x05: // [RW] uint 生産パラメータ3（予約）
      return 0xff // TODO: 実装する
    case 0x06: // [RW] uint 生産パラメータ4（予約）
      return 0xff // TODO: 実装する
    case 0x07: // [RW] uint 生産パラメータ5（予約）
      return 0xff // TODO: 実装する
    case 0x08: // [RW] uint 生産パラメータ6（予約）
      return 0xff // TODO: 実装する
    case 0x09: // [RW] bool 生産状態（Trueをセットすると生産ユニット種別および生産パラメータの仕様を元に生産を開始する。Falseをセットすると生産を一時停止する。生産が完了するとFalseがセットされる）
      return assembler.isAssembling ? 0x01 : 0x00
    case 0x0a: // [RW] uint 修理ユニット種別
      return 0xff // TODO: 実装する
    case 0x0b: // [RW] uint 修理ユニットindex
      return 0xff // TODO: 実装する
    default:
      throw new VMInvalidUnitMemoryError("Memory index out of range")
  }
}

/** throws */
const writeAssemblerMemory: (assembler: Assembler, memoryIndex: number, value: number) => void = (
  assembler,
  memoryIndex,
  _value
) => {
  switch (memoryIndex) {
    case 0x00: // [R] uint assemble_power（スペック）
      throw new VMInvalidUnitMemoryError("Readonly memory")

    case 0x01: // [RW] uint 生産ユニット種別
      // TODO: 実装する
      return
    case 0x02: // [RW] uint 生産ユニット接続HULL index
      // TODO: 実装する
      return
    case 0x03: // [RW] uint 生産パラメータ1
      // TODO: 実装する
      return
    case 0x04: // [RW] uint 生産パラメータ2
      // TODO: 実装する
      return
    case 0x05: // [RW] uint 生産パラメータ3（予約）
      // TODO: 実装する
      return
    case 0x06: // [RW] uint 生産パラメータ4（予約）
      // TODO: 実装する
      return
    case 0x07: // [RW] uint 生産パラメータ5（予約）
      // TODO: 実装する
      return
    case 0x08: // [RW] uint 生産パラメータ6（予約）
      // TODO: 実装する
      return
    case 0x09: // [RW] bool 生産状態（Trueをセットすると生産ユニット種別および生産パラメータの仕様を元に生産を開始する。Falseをセットすると生産を一時停止する。生産が完了するとFalseがセットされる）
      // TODO: 実装する
      return
    case 0x0a: // [RW] uint 修理ユニット種別
      // TODO: 実装する
      return
    case 0x0b: // [RW] uint 修理ユニットindex
      // TODO: 実装する
      return
    default:
      throw new VMInvalidUnitMemoryError("Memory index out of range")
  }
}

/** throws */
const readComputerMemory: (computer: Computer, memoryIndex: number) => number = (
  computer,
  memoryIndex
) => {
  switch (memoryIndex) {
    case 0x00: // [R] int 動作周波数（スペック）（正の整数: 命令実行数/tick、負の整数: -n は 1命令実行/n tick）
      return (computer.processingPower << 24) >> 24 // number値は64bit浮動小数点で格納されており、ビット演算をする際は32bit符号付き整数になる。8bitの符号付き整数にするために、32bit - 8bit分の左シフトで上位bitを削除し、右シフトで桁を戻す
    case 0x01: // [R] uint メモリ容量（スペック）
      return computer.memorySize
    case 0x02: // [RW] bool メモリ領域の外部書き換え・読み取り許可状態（他COMPUTERからメモリ内容の読み取りおよび書き換えの許可状態。生成時はTrue。FalseからTrueに変更する操作は自身のみ行える）
      return 0xff // TODO: 実装する
    case 0x03: // [RW] uint メモリ指定アドレス（メモリ領域の外部書き換え・読み取り許可状態であるとき、書き換え・読み取り対象アドレスを指定する）
      return 0xff // TODO: 実装する
    case 0x04: // [RW] uint メモリ値（メモリ領域の外部書き換え・読み取り許可状態であるとき、メモリ指定アドレスで指定されたメモリの内容を表示する。書き換えればメモリの内容が書き変わる）
      return 0xff // TODO: 実装する
    default:
      throw new VMInvalidUnitMemoryError("Memory index out of range")
  }
}

/** throws */
const writeComputerMemory: (computer: Computer, memoryIndex: number, value: number) => void = (
  computer,
  memoryIndex,
  _value
) => {
  switch (memoryIndex) {
    case 0x00: // [R] int 動作周波数（スペック）（正の整数: 命令実行数/tick、負の整数: -n は 1命令実行/n tick）
    case 0x01: // [R] uint メモリ容量（スペック）
      throw new VMInvalidUnitMemoryError("Readonly memory")

    case 0x02: // [RW] bool メモリ領域の外部書き換え・読み取り許可状態（他COMPUTERからメモリ内容の読み取りおよび書き換えの許可状態。生成時はTrue。FalseからTrueに変更する操作は自身のみ行える）
      // TODO: FalseからTrueに変更する操作は自身のみ行える制約を実装する
      return
    case 0x03: // [RW] uint メモリ指定アドレス（メモリ領域の外部書き換え・読み取り許可状態であるとき、書き換え・読み取り対象アドレスを指定する）
      return
    case 0x04: // [RW] uint メモリ値（メモリ領域の外部書き換え・読み取り許可状態であるとき、メモリ指定アドレスで指定されたメモリの内容を表示する。書き換えればメモリの内容が書き変わる）
      return
    default:
      throw new VMInvalidUnitMemoryError("Memory index out of range")
  }
}
