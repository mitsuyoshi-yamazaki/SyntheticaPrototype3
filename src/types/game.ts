/**
 * ゲーム全体で使用する基本的な型定義
 */

import { VMState } from "../engine"

/** オブジェクトの一意識別子 */
export type ObjectId = number & { readonly __brand: "ObjectId" }

/** ユニットの種別 */
export type HullType = "HULL" // HULLユニット
export type AssemblerType = "ASSEMBLER" // ASSEMBLERユニット
export type ComputerType = "COMPUTER" // COMPUTERユニット
export const UnitTypes = ["HULL", "ASSEMBLER", "COMPUTER"] as const
export type UnitType = (typeof UnitTypes)[number]

/** ゲームオブジェクトの種別 */
export type EnergyType = "ENERGY" // エネルギーオブジェクト
export type ObjectType = EnergyType | UnitType

/** 2次元ベクトル */
export type Vec2 = {
  readonly x: number
  readonly y: number
}

/**
 * ゲームオブジェクトの基本インターフェース
 *
 * 注: typeプロパティは規約上"case"とすべきだが、
 * ゲームオブジェクトの型判別には慣習的に"type"が使われるため、
 * APIの一貫性を優先してtypeを使用している
 */
export type GameObject = {
  readonly id: ObjectId
  readonly type: ObjectType
  position: Vec2
  velocity: Vec2
  readonly radius: number
  energy: number
  mass: number
}

/** エネルギーオブジェクト */
export type EnergyObject = GameObject & {
  readonly type: EnergyType
}

/** ユニットの基本インターフェース */
export type BaseUnit = GameObject & {
  readonly type: UnitType
  readonly buildEnergy: number // 構成エネルギー
  currentEnergy: number // 現在のエネルギー（ダメージを受けると減少）
  readonly parentHullId?: ObjectId // 所属するHULL
}

/** HULLユニット */
export type Hull = BaseUnit & {
  readonly type: HullType
  readonly capacity: number // エネルギー格納容量
  storedEnergy: number // 格納中のエネルギー
  attachedUnitIds: ObjectId[] // 固定されているユニット
  collectingEnergy: boolean // エネルギー収集中フラグ
  mergeTargetId?: ObjectId // マージ対象HULL ID
  detachTargetUnitType?: number // 分離対象ユニット種別
  detachTargetUnitIndex?: number // 分離対象ユニットindex
  detachExecuteFlag: boolean // 分離実行フラグ
}

/** ASSEMBLERユニット */
export type Assembler = BaseUnit & {
  readonly type: AssemblerType
  readonly assemblePower: number // 組立能力
  isAssembling: boolean
  targetSpec?: UnitSpec // 組立中のユニット仕様
  progress: number // 組立進捗（0-1）
  productionUnitType?: number // 生産ユニット種別
  productionHullIndex?: number // 生産ユニット接続HULL index
  productionParam1?: number // 生産パラメータ1
  productionParam2?: number // 生産パラメータ2
  productionParam3?: number // 生産パラメータ3（予約）
  productionParam4?: number // 生産パラメータ4（予約）
  productionParam5?: number // 生産パラメータ5（予約）
  productionParam6?: number // 生産パラメータ6（予約）
  repairUnitType?: number // 修理ユニット種別
  repairUnitIndex?: number // 修理ユニットindex
  repairState: boolean // 修理状態
  lastProducedUnitType?: number // 最後に生産したユニット種別
  lastProducedUnitIndex?: number // 最後に生産したユニットindex
  resetLastProducedFlag: boolean // 最後に生産したユニット情報をリセットフラグ
}

/** COMPUTERユニット */
export type Computer = BaseUnit & {
  readonly type: ComputerType
  readonly processingPower: number // 処理能力（正の整数の場合: 命令実行数/tick、負の整数の場合: -n は 1命令実行/n tick）
  readonly memorySize: number // メモリサイズ（バイト）
  readonly vm: VMState
  readonly computingState: {
    skippingTicks: number // （分数周波数の場合のみ）スキップする残りtick
    cycleOverflow: number // 次のtickへ持ち越す命令サイクル
  }
  externalMemoryAccessAllowed: boolean // メモリ領域の外部書き換え・読み取り許可状態
  memoryAddressHigh?: number // メモリ指定アドレス上位bit
  memoryAddressLow?: number // メモリ指定アドレス下位bit
  memoryValue?: number // メモリ値
  memoryWriteFlag: boolean // メモリ書き込みフラグ
}

export type Unit = Hull | Assembler | Computer

/** ユニット仕様 */
export type HullSpec = {
  readonly type: HullType
  readonly capacity: number
}

export type AssemblerSpec = {
  readonly type: AssemblerType
  readonly assemblePower: number
}

export type ComputerSpec = {
  readonly type: ComputerType
  readonly processingPower: number
  readonly memorySize: number
}

export type UnitSpec = HullSpec | AssemblerSpec | ComputerSpec

/**
 * ワールドパラメータ
 * このワールド固有のローカル設定（ゲーム世界の一部分の性質）
 */
export type WorldParameters = {
  // エネルギー源の配置
  energySourceCount: number
  energySourceMinRate: number
  energySourceMaxRate: number

  // シミュレーション設定
  ticksPerFrame: number
  maxFPS?: number // FPS上限（省略時は60）
}

/** エネルギーソース */
export type EnergySource = {
  readonly id: ObjectId
  position: Vec2
  energyPerTick: number
}

/** 線形力場 */
export type LinearForceField = {
  readonly id: ObjectId
  readonly type: "LINEAR"
  position: Vec2
  radius: number
  strength: number
  direction: Vec2 // 必須
}

/** 放射状力場 */
export type RadialForceField = {
  readonly id: ObjectId
  readonly type: "RADIAL"
  position: Vec2
  radius: number
  strength: number
}

/** 渦巻き力場 */
export type SpiralForceField = {
  readonly id: ObjectId
  readonly type: "SPIRAL"
  position: Vec2
  radius: number
  strength: number
}

/** 方向性力場 */
export type DirectionalForceField = LinearForceField | RadialForceField | SpiralForceField

/** 空間ハッシュグリッドのセル */
export type SpatialCell = {
  objects: Set<ObjectId>
}

/** ゲーム世界の状態 */
export type WorldState = {
  width: number
  height: number
  tick: number
  objects: Map<ObjectId, GameObject>
  energySources: Map<ObjectId, EnergySource>
  forceFields: Map<ObjectId, DirectionalForceField>
  spatialIndex: Map<string, SpatialCell>
  parameters: WorldParameters
  nextObjectId: number
}
