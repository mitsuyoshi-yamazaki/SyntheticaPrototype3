import type { ObjectId, Unit, Hull, GameObject } from "@/types/game"

/** ユニット種別コード */
export const UNIT_TYPE_CODES = {
  HULL: 0x00,
  ASSEMBLER: 0x40,
  COMPUTER: 0xc0,
} as const

/** ユニット識別子（種別コード + インデックス） */
export type UnitIdentifier = number // 8bit値: 上位2bitが種別、下位6bitがインデックス

/** 回路接続の結果 */
export type CircuitAccessResult = {
  readonly success: boolean
  readonly value?: number
  readonly error?: string
}

/** 回路接続システム */
export class CircuitConnectionSystem {
  /** ユニット種別からコードを取得 */
  public static getTypeCode(unitType: Unit["type"]): number {
    return UNIT_TYPE_CODES[unitType]
  }

  /** ユニット識別子を生成 */
  public static createIdentifier(unitType: Unit["type"], index: number): UnitIdentifier {
    if (index < 0 || index > 63) {
      throw new Error(`Invalid unit index: ${index}. Must be 0-63`)
    }
    const typeCode = this.getTypeCode(unitType)
    return (typeCode | index) as UnitIdentifier
  }

  /** ユニット識別子から種別コードを取得 */
  public static getTypeFromIdentifier(identifier: UnitIdentifier): number {
    return identifier & 0xc0 // 上位2bit
  }

  /** ユニット識別子からインデックスを取得 */
  public static getIndexFromIdentifier(identifier: UnitIdentifier): number {
    return identifier & 0x3f // 下位6bit
  }

  /** ユニット識別子からユニット種別を取得 */
  public static getUnitTypeFromIdentifier(identifier: UnitIdentifier): Unit["type"] | null {
    const typeCode = this.getTypeFromIdentifier(identifier)
    switch (typeCode) {
      case UNIT_TYPE_CODES.HULL:
        return "HULL"
      case UNIT_TYPE_CODES.ASSEMBLER:
        return "ASSEMBLER"
      case UNIT_TYPE_CODES.COMPUTER:
        return "COMPUTER"
      default:
        return null
    }
  }

  /** 
   * 回路接続が可能かチェック
   * 同一HULLに固定されているユニット間でのみ可能
   */
  public static canAccess(sourceUnit: Unit, targetUnit: Unit): boolean {
    // 両方のユニットが固定されているか確認
    if (!sourceUnit.parentHull || !targetUnit.parentHull) {
      return false
    }

    // 同一HULLに固定されているか確認
    return sourceUnit.parentHull === targetUnit.parentHull
  }

  /**
   * HULL内でユニットを検索
   * @param hull 検索対象のHULL
   * @param identifier ユニット識別子
   * @returns 見つかったユニット、または null
   */
  public static findUnitInHull(hull: Hull, identifier: UnitIdentifier): Unit | null {
    const unitType = this.getUnitTypeFromIdentifier(identifier)
    const index = this.getIndexFromIdentifier(identifier)

    if (!unitType) {
      return null
    }

    // 固定されているユニットから検索
    let currentIndex = 0
    for (const unitId of hull.attachedUnits) {
      // ここでは実際のユニットオブジェクトが必要
      // WorldStateから取得する必要があるため、このメソッドは
      // 実際にはWorldStateと連携して動作する必要がある
      // 今は型定義のみ
    }

    return null
  }

  /**
   * ユニットの操作メモリ読み取り
   * @param sourceUnit アクセス元ユニット
   * @param targetUnit アクセス先ユニット
   * @param address 操作メモリアドレス
   * @returns 読み取り結果
   */
  public static readUnitMemory(
    sourceUnit: Unit,
    targetUnit: Unit,
    address: number
  ): CircuitAccessResult {
    // アクセス権限チェック
    if (!this.canAccess(sourceUnit, targetUnit)) {
      return {
        success: false,
        error: "Circuit not connected: units not on same HULL",
      }
    }

    // アドレス範囲チェック（仮実装）
    if (address < 0 || address > 255) {
      return {
        success: false,
        error: `Invalid memory address: ${address}`,
      }
    }

    // 実際の読み取り処理はユニット種別ごとに異なる
    // ここでは型定義のみで、実装は各ユニットシステムで行う
    return {
      success: true,
      value: 0, // 仮の値
    }
  }

  /**
   * ユニットの操作メモリ書き込み
   * @param sourceUnit アクセス元ユニット
   * @param targetUnit アクセス先ユニット
   * @param address 操作メモリアドレス
   * @param value 書き込む値
   * @returns 書き込み結果
   */
  public static writeUnitMemory(
    sourceUnit: Unit,
    targetUnit: Unit,
    address: number,
    value: number
  ): CircuitAccessResult {
    // アクセス権限チェック
    if (!this.canAccess(sourceUnit, targetUnit)) {
      return {
        success: false,
        error: "Circuit not connected: units not on same HULL",
      }
    }

    // アドレス範囲チェック（仮実装）
    if (address < 0 || address > 255) {
      return {
        success: false,
        error: `Invalid memory address: ${address}`,
      }
    }

    // 値の範囲チェック（16bit）
    if (value < 0 || value > 0xffff) {
      return {
        success: false,
        error: `Invalid value: ${value}. Must be 0-65535`,
      }
    }

    // 実際の書き込み処理はユニット種別ごとに異なる
    // ここでは型定義のみで、実装は各ユニットシステムで行う
    return {
      success: true,
    }
  }

  /**
   * HULL内のユニットをインデックス順に列挙
   * @param hull 対象HULL
   * @param unitType フィルタするユニット種別（省略時は全種別）
   * @returns ユニットIDとインデックスのペア配列
   */
  enumerateUnitsInHull(
    _hull: Hull,
    _unitType?: Unit["type"]
  ): { unitId: ObjectId; index: number; type: Unit["type"] }[] {
    // 実装は WorldState と連携して行う必要がある
    // ここでは型定義のみ
    return []
  }

  /**
   * HULL分離時の回路再構成
   * @param originalHull 元のHULL
   * @param separatedUnits 分離されるユニットID配列
   * @returns 新しいHULLの設定
   */
  public static reconfigureCircuitOnSeparation(
    originalHull: Hull,
    separatedUnits: ObjectId[]
  ): { remainingUnits: ObjectId[]; separatedCircuit: ObjectId[] } {
    const remainingUnits = originalHull.attachedUnits.filter(
      (unitId) => !separatedUnits.includes(unitId)
    )

    return {
      remainingUnits,
      separatedCircuit: separatedUnits,
    }
  }

  /**
   * HULL統合時の回路結合
   * @param hull1 統合元HULL1
   * @param hull2 統合元HULL2
   * @returns 統合後の回路構成
   */
  public static mergeCircuits(hull1: Hull, hull2: Hull): ObjectId[] {
    // 両HULLの固定ユニットを結合
    return [...hull1.attachedUnits, ...hull2.attachedUnits]
  }

  /**
   * デバッグ用: 回路接続状態の文字列表現
   * @param hull 対象HULL
   * @param units ユニット情報マップ
   * @returns デバッグ文字列
   */
  public static debugCircuitState(
    hull: Hull,
    units: Map<ObjectId, Unit>
  ): string {
    const lines: string[] = [`Hull[ID: ${hull.id}]`]
    
    // 固定ユニット（回路接続可能）
    lines.push("├─ Attached Units (回路接続可能):")
    
    const attachedByType = new Map<Unit["type"], number[]>()
    
    for (const unitId of hull.attachedUnits) {
      const unit = units.get(unitId)
      if (unit) {
        const indices = attachedByType.get(unit.type) ?? []
        indices.push(indices.length)
        attachedByType.set(unit.type, indices)
        
        const isLast = unitId === hull.attachedUnits[hull.attachedUnits.length - 1]
        const prefix = isLast ? "│  └─" : "│  ├─"
        lines.push(`${prefix} ${unit.type}[${indices.length - 1}]`)
      }
    }
    
    // 格納オブジェクト（回路接続不可）
    lines.push("└─ Contained Objects (回路接続不可):")
    lines.push("   └─ (実装待機中)")
    
    return lines.join("\n")
  }
}