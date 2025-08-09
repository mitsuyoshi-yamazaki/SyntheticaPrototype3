/**
 * ゲーム世界の物理法則パラメータ
 * ゲーム世界全体に適用される普遍的な法則・定数の設定
 */

export type GameLawParameters = {
  // ========== 物理・運動 ==========
  
  /** 最大力 */
  maxForce: number;
  /** 力のスケール */
  forceScale: number;
  /** 摩擦係数 */
  friction: number;
  
  // ========== ユニット構成エネルギー ==========
  
  // HULL
  /** 容量1あたりの構成エネルギー */
  hullEnergyPerCapacity: number;
  
  // ASSEMBLER
  /** ASSEMBLER基本構成エネルギー */
  assemblerBaseEnergy: number;
  /** assemble_power 1あたりの追加エネルギー */
  assemblerEnergyPerPower: number;
  
  // COMPUTER
  /** COMPUTER基本構成エネルギー */
  computerBaseEnergy: number;
  /** 周波数に基づくエネルギー係数 */
  computerFrequencyEnergyMultiplier: number;
  /** 周波数の除数 */
  computerFrequencyDivisor: number;
  /** メモリ1バイトあたりのエネルギー */
  computerMemoryEnergyPerByte: number;
  
  // ========== ユニット生産エネルギー（生産コスト係数） ==========
  
  /** HULL生産時の追加コスト係数 */
  hullProductionRatio: number;
  /** ASSEMBLER生産時の追加コスト係数 */
  assemblerProductionRatio: number;
  /** COMPUTER生産時の追加コスト係数 */
  computerProductionRatio: number;
  
  // ========== 生産開始時コスト ==========
  
  /** 生産開始時に必要な初期エネルギーの係数 */
  productionStartCostRatio: number;
  
  // ========== COMPUTER動作時の消費エネルギー ==========
  
  /** 1バイト命令の実行コスト */
  computerInstructionCost1Byte: number;
  /** 3バイト命令の実行コスト */
  computerInstructionCost3Byte: number;
  /** 4バイト命令の実行コスト */
  computerInstructionCost4Byte: number;
  /** 5バイト命令の実行コスト */
  computerInstructionCost5Byte: number;
  /** 絶対アドレス命令の追加コスト */
  computerAbsoluteAddressCost: number;
  /** ユニット操作命令の追加コスト */
  computerUnitOperationCost: number;
  
  // ========== エネルギー収集・崩壊 ==========
  
  /** エネルギーオブジェクトの自然崩壊割合（per tick） */
  energyDecayRate: number;
  /** エネルギーソースの最小出力（E/tick） */
  energySourceMinOutput: number;
  /** エネルギーソースの最大出力（E/tick） */
  energySourceMaxOutput: number;
  /** HULLのエネルギー収集半径係数（HULL半径に対する倍率） */
  energyCollectionRadiusMultiplier: number;
  
  // ========== 熱システム ==========
  
  /** 消費エネルギーが熱に変わる割合 */
  energyToHeatConversionRatio: number;
  /** 熱拡散率 */
  heatDiffusionRate: number;
  /** 放熱率（per tick） */
  heatRadiationRate: number;
  /** 熱ダメージが発生する温度 */
  heatDamageThreshold: number;
  /** 熱ダメージ係数 */
  heatDamageMultiplier: number;
  /** 損傷ユニットへの熱ダメージ倍率 */
  heatDamageMultiplierDamaged: number;
  /** 生産中ユニットへの熱ダメージ倍率 */
  heatDamageMultiplierProducing: number;
  
  // ========== 修復コスト ==========
  
  /** 修復時の追加コスト係数 */
  repairCostMultiplier: number;
  
  // ========== ユニット結合・分離 ==========
  
  /** HULLマージ時のエネルギーコスト（0 = 未定義） */
  hullMergeEnergyCost: number;
  /** ユニット分離時のエネルギーコスト */
  unitDetachEnergyCost: number;
  
  // ========== 物理・移動 ==========
  
  /** 質量あたりの移動エネルギーコスト（0 = 未定義） */
  movementEnergyCostPerMass: number;
  /** 衝突時のエネルギー損失（0 = 未定義） */
  collisionEnergyLoss: number;
}

/**
 * デフォルトパラメータ
 * 元の仕様書に基づく標準値
 */
export const DEFAULT_PARAMETERS: GameLawParameters = {
  // 物理・運動
  maxForce: 10,
  forceScale: 5,
  friction: 0.98,
  
  // ユニット構成エネルギー
  hullEnergyPerCapacity: 2,
  assemblerBaseEnergy: 8000,
  assemblerEnergyPerPower: 2000,
  computerBaseEnergy: 500,
  computerFrequencyEnergyMultiplier: 100,
  computerFrequencyDivisor: 5,
  computerMemoryEnergyPerByte: 50,
  
  // ユニット生産エネルギー
  hullProductionRatio: 0.05,
  assemblerProductionRatio: 0.5,
  computerProductionRatio: 0.1,
  
  // 生産開始時コスト
  productionStartCostRatio: 0.05,
  
  // COMPUTER動作時の消費エネルギー
  computerInstructionCost1Byte: 1,
  computerInstructionCost3Byte: 3,
  computerInstructionCost4Byte: 4,
  computerInstructionCost5Byte: 5,
  computerAbsoluteAddressCost: 2,
  computerUnitOperationCost: 10,
  
  // エネルギー収集・崩壊
  energyDecayRate: 0.001,
  energySourceMinOutput: 10,
  energySourceMaxOutput: 100,
  energyCollectionRadiusMultiplier: 2,
  
  // 熱システム
  energyToHeatConversionRatio: 1.0,
  heatDiffusionRate: 0.1,
  heatRadiationRate: 0.01,
  heatDamageThreshold: 100,
  heatDamageMultiplier: 1.0,
  heatDamageMultiplierDamaged: 2.0,
  heatDamageMultiplierProducing: 3.0,
  
  // 修復コスト
  repairCostMultiplier: 1.1,
  
  // ユニット結合・分離
  hullMergeEnergyCost: 0, // 未定義
  unitDetachEnergyCost: 0,
  
  // 物理・移動
  movementEnergyCostPerMass: 0, // 未定義
  collisionEnergyLoss: 0, // 未定義
};

/**
 * バランス調整パラメータ
 * 自己複製が現実的に可能なバランス調整版
 */
export const BALANCED_PARAMETERS: GameLawParameters = {
  ...DEFAULT_PARAMETERS,
  
  // ASSEMBLERのコストを削減（自己複製を可能にする）
  assemblerEnergyPerPower: 1000, // 2000 → 1000
  
  // 生産コストを若干削減
  hullProductionRatio: 0.04, // 0.05 → 0.04
  assemblerProductionRatio: 0.4, // 0.5 → 0.4
  computerProductionRatio: 0.08, // 0.1 → 0.08
  
  // エネルギーソース出力を増加
  energySourceMinOutput: 15, // 10 → 15
  energySourceMaxOutput: 150, // 100 → 150
  
  // 熱ダメージを緩和
  heatDamageThreshold: 120, // 100 → 120
  heatRadiationRate: 0.015, // 0.01 → 0.015
};

/**
 * 実験用パラメータ
 * 極端な設定でゲームの挙動を確認するための設定
 */
export const EXPERIMENTAL_PARAMETERS: GameLawParameters = {
  ...DEFAULT_PARAMETERS,
  
  // 極端に低いコスト設定
  hullEnergyPerCapacity: 1,
  assemblerBaseEnergy: 1000,
  assemblerEnergyPerPower: 100,
  computerBaseEnergy: 100,
  computerMemoryEnergyPerByte: 10,
  
  // 生産コストを最小化
  hullProductionRatio: 0.01,
  assemblerProductionRatio: 0.05,
  computerProductionRatio: 0.01,
  
  // エネルギーソース出力を大幅増加
  energySourceMinOutput: 50,
  energySourceMaxOutput: 500,
  
  // 熱システムを無効化に近い状態
  heatDamageThreshold: 1000,
  heatRadiationRate: 0.5,
};

/**
 * テスト用パラメータ
 * ユニットテストで使用する固定値
 */
export const TEST_PARAMETERS: GameLawParameters = {
  // 物理・運動
  maxForce: 10,
  forceScale: 5,
  friction: 0.98,
  
  // ユニット構成エネルギー（テスト用に簡略化）
  hullEnergyPerCapacity: 2,
  assemblerBaseEnergy: 800,
  assemblerEnergyPerPower: 200,
  computerBaseEnergy: 500,
  computerFrequencyEnergyMultiplier: 100,
  computerFrequencyDivisor: 5,
  computerMemoryEnergyPerByte: 50,
  
  // ユニット生産エネルギー
  hullProductionRatio: 0.05,
  assemblerProductionRatio: 0.2,
  computerProductionRatio: 0.1,
  
  // 生産開始時コスト
  productionStartCostRatio: 0.05,
  
  // COMPUTER動作時の消費エネルギー
  computerInstructionCost1Byte: 1,
  computerInstructionCost3Byte: 3,
  computerInstructionCost4Byte: 4,
  computerInstructionCost5Byte: 5,
  computerAbsoluteAddressCost: 2,
  computerUnitOperationCost: 10,
  
  // エネルギー収集・崩壊
  energyDecayRate: 0.001,
  energySourceMinOutput: 10,
  energySourceMaxOutput: 100,
  energyCollectionRadiusMultiplier: 2,
  
  // 熱システム
  energyToHeatConversionRatio: 1.0,
  heatDiffusionRate: 0.25,
  heatRadiationRate: 0.1,
  heatDamageThreshold: 100,
  heatDamageMultiplier: 1.0,
  heatDamageMultiplierDamaged: 2.0,
  heatDamageMultiplierProducing: 3.0,
  
  // 修復コスト
  repairCostMultiplier: 1.1,
  
  // ユニット結合・分離
  hullMergeEnergyCost: 0,
  unitDetachEnergyCost: 0,
  
  // 物理・移動
  movementEnergyCostPerMass: 0,
  collisionEnergyLoss: 0,
};

/**
 * 現在のエネルギーパラメータ設定
 * 環境変数や設定に応じて切り替え
 */
let currentParameters: GameLawParameters = DEFAULT_PARAMETERS;

/**
 * 現在のゲーム法則パラメータを取得
 */
export const getGameLawParameters = (): GameLawParameters => {
  return currentParameters;
};

/**
 * ゲーム法則パラメータを設定
 */
export const setGameLawParameters = (params: GameLawParameters): void => {
  currentParameters = params;
};

/**
 * プリセット名からパラメータを取得
 */
export const getPresetParameters = (preset: 'default' | 'balanced' | 'experimental'): GameLawParameters => {
  switch (preset) {
    case 'balanced':
      return BALANCED_PARAMETERS;
    case 'experimental':
      return EXPERIMENTAL_PARAMETERS;
    default:
      return DEFAULT_PARAMETERS;
  }
};

/**
 * プリセット名からパラメータを設定
 */
export const setPresetParameters = (preset: 'default' | 'balanced' | 'experimental'): void => {
  currentParameters = getPresetParameters(preset);
};