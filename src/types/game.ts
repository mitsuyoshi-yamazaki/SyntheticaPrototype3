/**
 * ゲーム全体で使用する基本的な型定義
 */

/** オブジェクトの一意識別子 */
export type ObjectId = number & { readonly __brand: "ObjectId" }

/** ゲームオブジェクトの種別 */
export type ObjectType = 
  | "ENERGY"      // エネルギーオブジェクト
  | "HULL"        // HULLユニット
  | "ASSEMBLER"   // ASSEMBLERユニット
  | "COMPUTER"    // COMPUTERユニット

/** 2次元ベクトル */
export type Vec2 = {
  readonly x: number
  readonly y: number
}

/** ゲームオブジェクトの基本インターフェース */
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
  readonly type: "ENERGY"
}

/** ユニットの基本インターフェース */
export type Unit = GameObject & {
  readonly buildEnergy: number  // 構成エネルギー
  currentEnergy: number         // 現在のエネルギー（ダメージを受けると減少）
  readonly parentHull?: ObjectId // 所属するHULL
}

/** HULLユニット */
export type Hull = Unit & {
  readonly type: "HULL"
  readonly capacity: number     // エネルギー格納容量
  storedEnergy: number         // 格納中のエネルギー
  attachedUnits: ObjectId[]    // 固定されているユニット
}

/** ASSEMBLERユニット */
export type Assembler = Unit & {
  readonly type: "ASSEMBLER"
  readonly assemblePower: number // 組立能力
  isAssembling: boolean
  targetSpec?: UnitSpec         // 組立中のユニット仕様
  progress: number              // 組立進捗（0-1）
}

/** COMPUTERユニット */
export type Computer = Unit & {
  readonly type: "COMPUTER"
  readonly processingPower: number // 処理能力（命令/tick）
  readonly memorySize: number      // メモリサイズ（バイト）
  memory: Uint8Array              // メモリ内容
  programCounter: number          // プログラムカウンタ
  registers: Uint16Array          // レジスタ（8個）
}

/** ユニット仕様（組立用） */
export type UnitSpec = {
  type: ObjectType
  buildEnergy: number
  // タイプ別の追加パラメータ
  capacity?: number         // HULL用
  assemblePower?: number    // ASSEMBLER用
  processingPower?: number  // COMPUTER用
  memorySize?: number      // COMPUTER用
}

/** ワールドパラメータ */
export type WorldParameters = {
  // 物理
  maxForce: number
  forceScale: number
  friction: number
  
  // エネルギー
  energySourceCount: number
  energySourceMinRate: number
  energySourceMaxRate: number
  
  // 熱
  heatDiffusionRate: number
  heatRadiationRate: number
  
  // シミュレーション
  ticksPerFrame: number
  targetFPS: number
}

/** エネルギーソース */
export type EnergySource = {
  readonly id: ObjectId
  position: Vec2
  energyPerTick: number
}

/** 方向性力場 */
export type DirectionalForceField = {
  readonly id: ObjectId
  readonly type: "LINEAR" | "RADIAL" | "SPIRAL"
  position: Vec2
  radius: number
  strength: number
  direction?: Vec2  // LINEAR用
}

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

/** エージェント定義（初期化用） */
export type AgentDefinition = {
  name: string
  hull: {
    buildEnergy: number
    capacity: number
    position?: Vec2
  }
  units: {
    type: "ASSEMBLER" | "COMPUTER"
    buildEnergy: number
    assemblePower?: number
    processingPower?: number
    memorySize?: number
    program?: Uint8Array
  }[]
  position?: Vec2
}