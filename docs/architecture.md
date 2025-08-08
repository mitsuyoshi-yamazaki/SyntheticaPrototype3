# Synthetica v3 実装アーキテクチャ

## 概要

このドキュメントは、Synthetica v3プロトタイプの実装アーキテクチャを定義します。ブラウザ上で動作する静的HTMLアプリケーションとして、ゲームエンジン、物理演算、描画システムを統合します。

## 全体構成

```
┌─────────────────────────────────────────────────────────┐
│                    ブラウザ (Main Thread)                 │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────────────────────────┐  │
│  │  React UI   │  │  PixiJS (Ticker Driver)          │  │
│  │  Components │  │  Renderer + GameWorld.tick()     │  │
│  └──────┬──────┘  └──────────────┬───────────────────┘  │
│         │                        │                       │
│  ┌──────┴────────────────────────┴────────────────────┐  │
│  │              Game Engine Core (World)              │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  World State │ Physics │ Energy │ Units │ VM     │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## コアモジュール

### 1. Game Engine Core (`/src/engine/`)

#### World State Manager

- ゲーム世界の状態管理
- トーラス座標系の実装
- オブジェクトのライフサイクル管理

```typescript
interface WorldState {
  width: number
  height: number
  tick: number
  objects: Map<ObjectId, GameObject>
  spatialIndex: SpatialHashGrid
  parameters: WorldParameters
}
```

#### Object System

- 全ゲームオブジェクトの基底実装
- 円形オブジェクトの統一インターフェース

```typescript
interface GameObject {
  id: ObjectId
  type: ObjectType
  position: Vec2
  velocity: Vec2
  radius: number
  energy: number
}
```

### 2. Physics Engine (`/src/engine/`)

#### Collision Detection

- 空間ハッシュグリッド（セルサイズ: 100）
- 円形オブジェクト専用の最適化

#### Force System

- 反発力計算（tanh関数による制限）
- 方向性力場の実装
- トーラス境界の処理

### 3. Energy System (`/src/engine/`)

#### Energy Objects

- エネルギーオブジェクトの生成・結合
- サイズ計算（radius = sqrt(energy/π)）

#### Energy Sources

- ランダム位置生成
- 10-100E/tickの生成

#### Heat System

- セルオートマトンベースの熱拡散
- ノイマン近傍での熱流計算

### 4. Unit System (`/src/engine/` - ObjectFactory内に実装)

#### Unit Types

- HULL: コンテナユニット
- ASSEMBLER: 構築ユニット
- COMPUTER: 演算ユニット
- （将来: SENSOR, MOVER, CONNECTOR）

#### Unit Behaviors

- 各ユニットタイプ固有の動作
- エネルギー消費計算

### 5. Synthetica Script VM (`/src/vm/`)

#### Virtual Machine

- 16bitアーキテクチャ
- レジスタベース命令セット
- メモリ管理（最大64KB）

```typescript
interface VMState {
  registers: Uint16Array // 8 registers
  memory: Uint8Array // up to 64KB
  pc: number // program counter
  flags: VMFlags
}
```

#### Instruction Set

- 基本演算命令
- ビット操作命令
- ユニット制御命令
- スタック操作命令

### 6. Rendering System

#### PixiJS Integration (`/src/lib/GameWorld.ts`, `/src/components/GameCanvasPixi.tsx`)

- WebGLベースの高速描画
- バッチレンダリング（10,000+オブジェクト対応）
- カスタムViewport実装（パン・ズーム）
- レイヤー管理とデバッグオーバーレイ

#### Optimization

- 可視範囲カリング
- LODシステム
- オブジェクトプーリング

### 7. UI Components (`/src/components/`)

#### Control Panel

- 一時停止/再開
- シミュレーション速度調整
- 統計情報表示

#### Parameter Editor

- リアルタイムパラメータ調整
- プリセット管理

#### Debug Tools

- オブジェクトインスペクター
- VMステートビューア
- パフォーマンスモニター

### 8. Storybook (`/.storybook/`, `/src/stories/`)

#### 概要

Storybookを使用したコンポーネントカタログとビジュアル確認環境。

#### 構成

```
.storybook/
├── main.js           # Storybook設定
├── preview.js        # グローバル設定
└── decorators/       # カスタムデコレータ
    └── pixi.tsx      # PixiJS用デコレータ

src/stories/
├── GameObjects.stories.tsx  # ゲームオブジェクト表示
└── UIOverlay.stories.tsx    # UIオーバーレイ表示
```

#### PixiJS統合

カスタムデコレータ（`.storybook/decorators/pixi.tsx`）により、PixiJSアプリケーションをStorybook内で安全に実行：

- WebGLコンテキストの適切な管理
- メモリリーク防止のためのクリーンアップ
- 各ストーリー間での独立性確保

#### ストーリー構成

**GameObjects.stories.tsx**
- Energy: エネルギーオブジェクト（#FFD700）
- EnergySource: エネルギーソース（#FFB700、星形）
- Hull: 通常/ダメージ状態（#A9A9A9）
- Assembler: 通常/活動中（#FF8C00）
- Computer: 通常/実行中（#00BFFF）
- ForceField: 力場表示（rgba(173,216,230,0.2)）
- Agent: 複数ユニット結合例

**UIOverlay.stories.tsx**
- DebugInfo: デバッグ情報表示
- PerformanceMetrics: パフォーマンス表示
- FullUI: 完全なUI構成例

#### 起動方法

```bash
yarn storybook  # http://localhost:6006
```

## データフロー

```
User Input → UI Components → Parameter Manager
                                    ↓
PixiJS Ticker → GameWorld.tick() → World.tick()
    ↓                                   ↓
Renderer ←───── World State ←────── Game Engine Core
                    ↑                   ↑
                Physics Engine      Energy System
                                        ↑
                                   Unit System
                                        ↑
                                  Synthetica VM
```

## パフォーマンス最適化

### メモリ管理

- オブジェクトプール使用
- TypedArray活用
- 最大10,000オブジェクト制限

### 計算最適化

- 空間分割による衝突判定
- ビット演算活用（1024進法計算）
- 不要な平方根計算の回避

### 描画最適化

- requestAnimationFrame使用
- 可視範囲外のオブジェクトスキップ
- バッチ描画

## 初期化フロー

```typescript
interface InitialConfiguration {
  worldSize: { width: number; height: number }
  parameters: WorldParameters
  initialAgents: AgentDefinition[]
}

class Game {
  constructor(config: InitialConfiguration) {
    // 1. ワールド初期化
    // 2. エネルギーソース配置
    // 3. 初期エージェント配置
    // 4. ゲームループ開始
  }
}
```

## パラメータシステム

```typescript
interface WorldParameters {
  // Physics
  maxForce: number
  forceScale: number
  friction: number

  // Energy
  energySourceCount: number
  energySourceMinRate: number
  energySourceMaxRate: number

  // Heat
  heatDiffusionRate: number
  heatRadiationRate: number

  // Simulation
  ticksPerFrame: number
  maxFPS?: number // FPS上限（オプション）
}
```

## エラーハンドリング

- VMエラー: 該当COMPUTERのみ停止
- 物理演算エラー: オブジェクトをセーフ位置へ
- メモリ不足: 古いオブジェクトから削除

## 実装状況

### 完了済み

- ✅ ゲームエンジンコア（World、WorldStateManager）
- ✅ 物理エンジン（衝突検出、反発力、力場）
- ✅ エネルギーシステム（生成、結合、収集）
- ✅ 熱システム（拡散、放射）
- ✅ 基本ユニット実装（HULL、ASSEMBLER、COMPUTER）
- ✅ PixiJS統合とレンダリング
- ✅ Viewport実装（パン・ズーム）
- ✅ Synthetica Script VM基本実装
- ✅ VM命令デコーダー・実行器
- ✅ エージェントプリセットシステム
- ✅ Storybook統合（コンポーネントカタログ）

### 部分実装

- ⚡ VM命令セット（基本命令は実装済み、SCANM/ASSEMBLE実装中）
- ⚡ ユニット動作ロジック（エネルギー収集は実装済み）

### 未実装

- ⏳ 高度なUI（パラメータエディタ、デバッグツール）
- ⏳ パフォーマンス最適化（LOD、カリング）
- ⏳ 自己複製の完全実装

## 拡張性

### エージェント定義インターフェース

```typescript
interface AgentDefinition {
  name: string
  hull: HullSpec
  units: UnitSpec[]
  program: Uint8Array // Synthetica Script bytecode
  position?: Vec2
}
```

### プラグインシステム（将来）

- カスタムユニットタイプ
- 追加の物理法則
- 拡張描画モード

## ディレクトリ構造

```
src/
├── engine/          # ゲームエンジンコア
│   ├── world.ts             # Worldクラス（tickメソッド付き）
│   ├── world-state.ts       # 状態管理
│   ├── object-factory.ts    # オブジェクト生成（ユニット含む）
│   ├── agent-factory.ts     # エージェント生成
│   ├── physics-engine.ts    # 物理演算統合
│   ├── collision-detector.ts # 衝突検出
│   ├── separation-force.ts  # 反発力計算
│   ├── spatial-hash-grid.ts # 空間分割
│   ├── force-field-system.ts # 力場システム
│   ├── energy-system.ts     # エネルギー管理
│   ├── energy-source-manager.ts # エネルギーソース
│   ├── energy-collector.ts  # エネルギー収集
│   ├── heat-system.ts       # 熱拡散システム
│   ├── viewport.ts          # カメラ制御
│   ├── vm-executor.ts       # VM実行器
│   ├── vm-decoder.ts        # VM命令デコーダー
│   ├── vm-state.ts          # VM状態管理
│   ├── vm-instructions.ts   # VM命令定義
│   └── presets/             # エージェントプリセット
│       ├── types.ts
│       └── self-replicator-preset.ts
├── components/      # UIコンポーネント
│   ├── GameCanvasPixi.tsx  # PixiJS描画・シミュレーション駆動
│   └── GameCanvasPixi.stories.tsx # Storybookストーリー
├── stories/         # Storybookストーリー
│   ├── GameObjects.stories.tsx  # ゲームオブジェクト
│   └── UIOverlay.stories.tsx    # UIオーバーレイ
├── lib/             # ブリッジクラス
│   └── GameWorld.ts     # UI層とエンジンのブリッジ
├── utils/           # ユーティリティ
│   ├── vec2.ts
│   ├── torus-math.ts
│   └── object-pool.ts
└── types/           # 型定義
    └── game.ts
```

.storybook/         # Storybook設定
├── main.js
├── preview.js
└── decorators/
    └── pixi.tsx     # PixiJS用デコレータ

## 実装優先順位

1. **フェーズ1: 基盤** (必須)
   - Vec2, トーラス数学
   - 基本的なゲームループ
   - オブジェクトシステム

2. **フェーズ2: 物理とエネルギー** (必須)
   - 衝突判定
   - エネルギーオブジェクト
   - 熱システム

3. **フェーズ3: ユニット** (必須)
   - HULLの実装
   - 基本的なユニット動作

4. **フェーズ4: VM** (必須)
   - Synthetica Script VM
   - COMPUTERユニット統合

5. **フェーズ5: UI** (必須)
   - 基本的な制御UI
   - パラメータエディタ

6. **フェーズ6: 最適化** (オプション)
   - パフォーマンス改善
   - デバッグツール

## テスト戦略

- 単体テスト: 各モジュールの機能
- 統合テスト: システム間の連携
- パフォーマンステスト: 大量オブジェクト時の動作
- エージェントテスト: サンプルエージェントの動作確認
