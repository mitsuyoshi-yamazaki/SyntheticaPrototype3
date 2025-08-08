import type { Hull, Assembler, Computer, Unit } from "@/types/game"

/** 操作メモリのアドレスマップ基底インターフェース */
export type MemoryMap = Record<
  number,
  {
    readonly name: string
    readonly access: "R" | "RW" // Read-only or Read-Write
    readonly description: string
  }
>

/** HULL操作メモリマップ */
export const HULL_MEMORY_MAP: MemoryMap = {
  0x00: { name: "capacity", access: "R", description: "HULL容量（スペック）" },
  0x01: { name: "currentCapacity", access: "R", description: "現在の格納量" },
  0x02: { name: "storedEnergy", access: "R", description: "エネルギー格納量" },
  0x03: { name: "collectingEnergy", access: "RW", description: "エネルギー回収状態" },
  0x04: { name: "mergeTarget", access: "RW", description: "マージ対象指定" },
  0x05: { name: "separateUnitType", access: "RW", description: "分離対象ユニット種別" },
  0x06: { name: "separateUnitIndex", access: "RW", description: "分離対象ユニットindex" },
  0x07: { name: "separateExecute", access: "RW", description: "分離実行フラグ" },
}

/** ASSEMBLER操作メモリマップ */
export const ASSEMBLER_MEMORY_MAP: MemoryMap = {
  0x00: { name: "assemblePower", access: "R", description: "assemble_power（スペック）" },
  0x01: { name: "productionUnitType", access: "RW", description: "生産ユニット種別" },
  0x02: { name: "productionHullIndex", access: "RW", description: "生産ユニット接続HULL index" },
  0x03: { name: "productionParam1", access: "RW", description: "生産パラメータ1" },
  0x04: { name: "productionParam2", access: "RW", description: "生産パラメータ2" },
  0x05: { name: "productionParam3", access: "RW", description: "生産パラメータ3（予約）" },
  0x06: { name: "productionParam4", access: "RW", description: "生産パラメータ4（予約）" },
  0x07: { name: "productionParam5", access: "RW", description: "生産パラメータ5（予約）" },
  0x08: { name: "productionParam6", access: "RW", description: "生産パラメータ6（予約）" },
  0x09: { name: "productionState", access: "RW", description: "生産状態" },
  0x0a: { name: "repairUnitType", access: "RW", description: "修理ユニット種別" },
  0x0b: { name: "repairUnitIndex", access: "RW", description: "修理ユニットindex" },
  0x0c: { name: "repairState", access: "RW", description: "修理状態" },
  0x0d: { name: "lastProducedType", access: "R", description: "最後に生産したユニット種別" },
  0x0e: { name: "lastProducedIndex", access: "R", description: "最後に生産したユニットindex" },
  0x0f: {
    name: "resetLastProduced",
    access: "RW",
    description: "最後に生産したユニット情報をリセット",
  },
}

/** COMPUTER操作メモリマップ */
export const COMPUTER_MEMORY_MAP: MemoryMap = {
  0x00: { name: "processingPower", access: "R", description: "処理能力（命令/tick）" },
  0x01: { name: "memorySize", access: "R", description: "メモリサイズ（バイト）" },
  0x02: { name: "memoryWriteEnabled", access: "RW", description: "メモリ書き換え許可状態" },
  0x03: { name: "programCounter", access: "RW", description: "プログラムカウンタ" },
  0x04: { name: "registerA", access: "R", description: "ワーキングレジスタA" },
  0x05: { name: "registerB", access: "R", description: "ワーキングレジスタB" },
  0x06: { name: "registerC", access: "R", description: "ワーキングレジスタC" },
  0x07: { name: "registerD", access: "R", description: "ワーキングレジスタD" },
}

/** ユニット操作メモリインターフェース */
export type UnitMemoryInterface = {
  /** 操作メモリ読み取り */
  readMemory(address: number): number | null
  /** 操作メモリ書き込み */
  writeMemory(address: number, value: number): boolean
  /** メモリマップ取得 */
  getMemoryMap(): MemoryMap
}

/** HULL操作メモリ実装 */
export class HullMemoryInterface implements UnitMemoryInterface {
  public constructor(private readonly hull: Hull) {}

  public readMemory(address: number): number | null {
    switch (address) {
      case 0x00: // capacity
        return this.hull.capacity
      case 0x01: // currentCapacity (格納オブジェクトの合計)
        // TODO: 実装はWorldStateと連携して格納オブジェクトを集計
        return 0
      case 0x02: // storedEnergy
        return this.hull.storedEnergy
      case 0x03: // collectingEnergy
        // TODO: エネルギー収集状態の実装
        return 0
      case 0x04: // mergeTarget
        // TODO: マージ対象の実装
        return 0
      case 0x05: // separateUnitType
        // TODO: 分離機能の実装
        return 0
      case 0x06: // separateUnitIndex
        return 0
      case 0x07: // separateExecute
        return 0
      default:
        return null
    }
  }

  public writeMemory(address: number, _value: number): boolean {
    const memInfo = HULL_MEMORY_MAP[address]
    if (memInfo == null || memInfo.access !== "RW") {
      return false
    }

    switch (address) {
      case 0x03: // collectingEnergy
        // TODO: エネルギー収集状態の設定
        return true
      case 0x04: // mergeTarget
        // TODO: マージ対象の設定
        return true
      case 0x05: // separateUnitType
        // TODO: 分離対象ユニット種別の設定
        return true
      case 0x06: // separateUnitIndex
        return true
      case 0x07: // separateExecute
        // TODO: 分離実行
        return true
      default:
        return false
    }
  }

  public getMemoryMap(): MemoryMap {
    return HULL_MEMORY_MAP
  }
}

/** ASSEMBLER操作メモリ実装 */
export class AssemblerMemoryInterface implements UnitMemoryInterface {
  private productionUnitType = 0
  private productionHullIndex = 0
  private productionParams = new Uint16Array(6)
  private repairUnitType = 0
  private repairUnitIndex = 0
  private lastProducedType = 0
  private lastProducedIndex = 0

  public constructor(private readonly assembler: Assembler) {}

  public readMemory(address: number): number | null {
    switch (address) {
      case 0x00: // assemblePower
        return this.assembler.assemblePower
      case 0x01: // productionUnitType
        return this.productionUnitType
      case 0x02: // productionHullIndex
        return this.productionHullIndex
      case 0x03: // productionParam1
      case 0x04: // productionParam2
      case 0x05: // productionParam3
      case 0x06: // productionParam4
      case 0x07: // productionParam5
      case 0x08: // productionParam6
        return this.productionParams[address - 0x03] ?? null
      case 0x09: // productionState
        return this.assembler.isAssembling ? 1 : 0
      case 0x0a: // repairUnitType
        return this.repairUnitType
      case 0x0b: // repairUnitIndex
        return this.repairUnitIndex
      case 0x0c: // repairState
        // TODO: 修理状態の実装
        return 0
      case 0x0d: // lastProducedType
        return this.lastProducedType
      case 0x0e: // lastProducedIndex
        return this.lastProducedIndex
      case 0x0f: // resetLastProduced
        return 0
      default:
        return null
    }
  }

  public writeMemory(address: number, value: number): boolean {
    const memInfo = ASSEMBLER_MEMORY_MAP[address]
    if (memInfo == null || memInfo.access !== "RW") {
      return false
    }

    switch (address) {
      case 0x01: // productionUnitType
        this.productionUnitType = value & 0xff
        return true
      case 0x02: // productionHullIndex
        this.productionHullIndex = value & 0xff
        return true
      case 0x03: // productionParam1
      case 0x04: // productionParam2
      case 0x05: // productionParam3
      case 0x06: // productionParam4
      case 0x07: // productionParam5
      case 0x08: // productionParam6
        this.productionParams[address - 0x03] = value & 0xffff
        return true
      case 0x09: // productionState
        // TODO: 生産開始/停止の実装
        return true
      case 0x0a: // repairUnitType
        this.repairUnitType = value & 0xff
        return true
      case 0x0b: // repairUnitIndex
        this.repairUnitIndex = value & 0xff
        return true
      case 0x0c: // repairState
        // TODO: 修理開始/停止の実装
        return true
      case 0x0f: // resetLastProduced
        if (value === 1) {
          this.lastProducedType = 0
          this.lastProducedIndex = 0
        }
        return true
      default:
        return false
    }
  }

  public getMemoryMap(): MemoryMap {
    return ASSEMBLER_MEMORY_MAP
  }

  /** 生産完了時の内部メソッド（システム用） */
  public setLastProduced(unitType: number, index: number): void {
    this.lastProducedType = unitType
    this.lastProducedIndex = index
  }
}

/** COMPUTER操作メモリ実装 */
export class ComputerMemoryInterface implements UnitMemoryInterface {
  private memoryWriteEnabled = false

  public constructor(private readonly computer: Computer) {}

  public readMemory(address: number): number | null {
    switch (address) {
      case 0x00: // processingPower
        return this.computer.processingPower
      case 0x01: // memorySize
        return this.computer.memorySize
      case 0x02: // memoryWriteEnabled
        return this.memoryWriteEnabled ? 1 : 0
      case 0x03: // programCounter
        return this.computer.programCounter
      case 0x04: // registerA
      case 0x05: // registerB
      case 0x06: // registerC
      case 0x07: // registerD
        return this.computer.registers[address - 0x04] ?? null
      default:
        return null
    }
  }

  public writeMemory(address: number, value: number): boolean {
    const memInfo = COMPUTER_MEMORY_MAP[address]
    if (memInfo == null || memInfo.access !== "RW") {
      return false
    }

    switch (address) {
      case 0x02: // memoryWriteEnabled
        this.memoryWriteEnabled = value !== 0
        return true
      case 0x03: // programCounter
        if (value >= 0 && value < this.computer.memorySize) {
          this.computer.programCounter = value
          return true
        }
        return false
      default:
        return false
    }
  }

  public getMemoryMap(): MemoryMap {
    return COMPUTER_MEMORY_MAP
  }
}

/** ユニット種別に応じたメモリインターフェースを生成 */
export const createMemoryInterface = (unit: Unit): UnitMemoryInterface | null => {
  switch (unit.type) {
    case "HULL":
      return new HullMemoryInterface(unit)
    case "ASSEMBLER":
      return new AssemblerMemoryInterface(unit)
    case "COMPUTER":
      return new ComputerMemoryInterface(unit)
    default:
      return null
  }
}
