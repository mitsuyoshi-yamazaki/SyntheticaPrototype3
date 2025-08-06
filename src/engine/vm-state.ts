/**
 * Synthetica Script VM の状態管理
 */

/** レジスタ名 */
export const REGISTER_NAMES = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
} as const

/** レジスタ名の型 */
export type RegisterName = keyof typeof REGISTER_NAMES

/** フラグ名 */
export const FLAG_NAMES = {
  ZERO: "Z",
  CARRY: "C",
} as const

/** フラグ名の型 */
export type FlagName = keyof typeof FLAG_NAMES

/** VM状態 */
// eslint-disable-next-line @typescript-eslint/member-ordering
export class VMState {
  /** プログラムカウンタ（16bit） */
  private _pc = 0

  /** ワーキングレジスタ（A, B, C, D 各16bit） */
  private readonly _registers: Uint16Array

  /** スタックポインタ（16bit） */
  private _sp = 0xffff

  /** フラグ */
  private _zeroFlag = false
  private _carryFlag = false

  /** メモリ（最大64KB） */
  private readonly _memory: Uint8Array

  /** メモリサイズ */
  private readonly _memorySize: number

  public constructor(memorySize: number, existingMemory?: Uint8Array) {
    if (memorySize < 1 || memorySize > 0x10000) {
      throw new Error(`Invalid memory size: ${memorySize}. Must be 1-65536`)
    }
    this._memorySize = memorySize

    if (existingMemory != null) {
      if (existingMemory.length !== memorySize) {
        throw new Error(
          `Memory array size ${existingMemory.length} does not match memorySize ${memorySize}`
        )
      }
      this._memory = existingMemory
    } else {
      this._memory = new Uint8Array(memorySize)
    }

    this._registers = new Uint16Array(4) // A, B, C, D
  }

  /** プログラムカウンタ取得 */
  public get pc(): number {
    return this._pc
  }

  /** プログラムカウンタ設定 */
  public set pc(value: number) {
    this._pc = value & 0xffff // 16bitマスク
  }

  /** スタックポインタ取得 */
  public get sp(): number {
    return this._sp
  }

  /** スタックポインタ設定 */
  public set sp(value: number) {
    this._sp = value & 0xffff // 16bitマスク
  }

  /** ゼロフラグ取得 */
  public get zeroFlag(): boolean {
    return this._zeroFlag
  }

  /** ゼロフラグ設定 */
  public set zeroFlag(value: boolean) {
    this._zeroFlag = value
  }

  /** キャリーフラグ取得 */
  public get carryFlag(): boolean {
    return this._carryFlag
  }

  /** キャリーフラグ設定 */
  public set carryFlag(value: boolean) {
    this._carryFlag = value
  }

  /** メモリサイズ取得 */
  public get memorySize(): number {
    return this._memorySize
  }

  /** メモリ配列取得（直接アクセス用） */
  public getMemoryArray(): Uint8Array {
    return this._memory
  }

  /**
   * レジスタ読み取り
   * @param register レジスタ名
   * @returns レジスタ値（16bit）
   */
  public getRegister(register: RegisterName): number {
    return this._registers[REGISTER_NAMES[register]] ?? 0
  }

  /**
   * レジスタ書き込み
   * @param register レジスタ名
   * @param value 値（16bitマスクされる）
   */
  public setRegister(register: RegisterName, value: number): void {
    const index = REGISTER_NAMES[register]
    this._registers[index] = value & 0xffff
  }

  /**
   * レジスタインデックスでの読み取り
   * @param index レジスタインデックス（0-3）
   * @returns レジスタ値（16bit）
   */
  public getRegisterByIndex(index: number): number {
    if (index < 0 || index > 3) {
      throw new Error(`Invalid register index: ${index}`)
    }
    return this._registers[index] ?? 0
  }

  /**
   * レジスタインデックスでの書き込み
   * @param index レジスタインデックス（0-3）
   * @param value 値（16bitマスクされる）
   */
  public setRegisterByIndex(index: number, value: number): void {
    if (index < 0 || index > 3) {
      throw new Error(`Invalid register index: ${index}`)
    }
    this._registers[index] = value & 0xffff
  }

  /**
   * メモリ読み取り（8bit）
   * @param address アドレス（循環バッファとして扱う）
   * @returns メモリ値（8bit）
   */
  public readMemory8(address: number): number {
    return this._memory[address % this._memorySize]
  }

  /**
   * メモリ書き込み（8bit）
   * @param address アドレス（循環バッファとして扱う）
   * @param value 値（8bitマスクされる）
   */
  public writeMemory8(address: number, value: number): void {
    this._memory[address % this._memorySize] = value & 0xff
  }

  /**
   * メモリ読み取り（16bit、リトルエンディアン）
   * @param address アドレス
   * @returns メモリ値（16bit）
   */
  public readMemory16(address: number): number {
    const low = this.readMemory8(address)
    const high = this.readMemory8(address + 1)
    return low | (high << 8)
  }

  /**
   * メモリ書き込み（16bit、リトルエンディアン）
   * @param address アドレス
   * @param value 値（16bitマスクされる）
   */
  public writeMemory16(address: number, value: number): void {
    const masked = value & 0xffff
    this.writeMemory8(address, masked & 0xff)
    this.writeMemory8(address + 1, (masked >> 8) & 0xff)
  }

  /**
   * メモリブロック読み取り
   * @param address 開始アドレス
   * @param length 長さ
   * @returns メモリデータ
   */
  public readMemoryBlock(address: number, length: number): Uint8Array {
    const result = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
      result[i] = this.readMemory8(address + i)
    }
    return result
  }

  /**
   * メモリブロック書き込み
   * @param address 開始アドレス
   * @param data データ
   */
  public writeMemoryBlock(address: number, data: Uint8Array): void {
    for (let i = 0; i < data.length; i++) {
      this.writeMemory8(address + i, data[i] ?? 0)
    }
  }

  /**
   * プログラムカウンタを進める
   * @param bytes 進める量
   * @returns 新しいPC値
   */
  public advancePC(bytes: number): number {
    this._pc = (this._pc + bytes) & 0xffff
    return this._pc
  }

  /**
   * スタックにプッシュ（16bit）
   * @param value プッシュする値
   */
  public push16(value: number): void {
    this._sp = (this._sp - 2) & 0xffff
    this.writeMemory16(this._sp, value)
  }

  /**
   * スタックからポップ（16bit）
   * @returns ポップした値
   */
  public pop16(): number {
    const value = this.readMemory16(this._sp)
    this._sp = (this._sp + 2) & 0xffff
    return value
  }

  /**
   * フラグ更新（ゼロフラグ）
   * @param value 演算結果
   */
  public updateZeroFlag(value: number): void {
    this._zeroFlag = (value & 0xffff) === 0
  }

  /**
   * フラグ更新（キャリーフラグ - 加算用）
   * @param result 演算結果（32bit）
   */
  public updateCarryFlagAdd(result: number): void {
    this._carryFlag = result > 0xffff
  }

  /**
   * フラグ更新（キャリーフラグ - 減算用）
   * @param a 被減数
   * @param b 減数
   */
  public updateCarryFlagSub(a: number, b: number): void {
    this._carryFlag = a < b
  }

  /**
   * VM状態のクローン作成
   * @returns 複製されたVM状態
   */
  public clone(): VMState {
    const cloned = new VMState(this._memorySize)
    cloned._pc = this._pc
    cloned._sp = this._sp
    cloned._zeroFlag = this._zeroFlag
    cloned._carryFlag = this._carryFlag
    cloned._registers.set(this._registers)
    cloned._memory.set(this._memory)
    return cloned
  }

  /**
   * VM状態のリセット
   */
  public reset(): void {
    this._pc = 0
    this._sp = 0xffff
    this._zeroFlag = false
    this._carryFlag = false
    this._registers.fill(0)
    this._memory.fill(0)
  }

  /**
   * デバッグ用文字列表現
   * @returns VM状態の文字列
   */
  public toString(): string {
    const flags = `${this._zeroFlag ? "Z" : "-"}${this._carryFlag ? "C" : "-"}`
    return [
      `PC: 0x${this._pc.toString(16).padStart(4, "0")}`,
      `SP: 0x${this._sp.toString(16).padStart(4, "0")}`,
      `Flags: ${flags}`,
      `A: 0x${this.getRegister("A").toString(16).padStart(4, "0")}`,
      `B: 0x${this.getRegister("B").toString(16).padStart(4, "0")}`,
      `C: 0x${this.getRegister("C").toString(16).padStart(4, "0")}`,
      `D: 0x${this.getRegister("D").toString(16).padStart(4, "0")}`,
    ].join(" | ")
  }
}
