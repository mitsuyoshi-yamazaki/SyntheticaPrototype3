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

### 2. Physics Engine (`/src/physics/`)

#### Collision Detection

- 空間ハッシュグリッド（セルサイズ: 100）
- 円形オブジェクト専用の最適化

#### Force System

- 反発力計算（tanh関数による制限）
- 方向性力場の実装
- トーラス境界の処理

### 3. Energy System (`/src/energy/`)

#### Energy Objects

- エネルギーオブジェクトの生成・結合
- サイズ計算（radius = sqrt(energy/π)）

#### Energy Sources

- ランダム位置生成
- 10-100E/tickの生成

#### Heat System

- セルオートマトンベースの熱拡散
- ノイマン近傍での熱流計算

### 4. Unit System (`/src/units/`)

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

### 6. Rendering System (`/src/rendering/`)

#### PixiJS Integration

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
│   ├── world.ts         # Worldクラス（tickメソッド付き）
│   ├── world-state.ts   # 状態管理
│   └── object-factory.ts # オブジェクト生成
├── physics/         # 物理エンジン
│   ├── collision.ts
│   ├── forces.ts
│   └── spatial-hash.ts
├── energy/          # エネルギーシステム
│   ├── energy-object.ts
│   ├── energy-source.ts
│   └── heat-system.ts
├── units/           # ユニットシステム
│   ├── base-unit.ts
│   ├── hull.ts
│   ├── assembler.ts
│   └── computer.ts
├── vm/              # Synthetica Script VM
│   ├── vm.ts
│   ├── instructions.ts
│   └── memory.ts
├── rendering/       # 描画システム
│   ├── renderer.ts
│   ├── camera.ts
│   └── debug-overlay.ts
├── components/      # UIコンポーネント
│   ├── GameCanvasPixi.tsx # PixiJS描画・シミュレーション駆動
│   ├── ControlPanel.tsx
│   ├── ParameterEditor.tsx
│   └── DebugTools.tsx
├── lib/             # ブリッジクラス
│   └── GameWorld.ts     # UI層とエンジンのブリッジ
├── utils/           # ユーティリティ
│   ├── vec2.ts
│   ├── torus-math.ts
│   └── object-pool.ts
└── types/           # 型定義
    ├── game.ts
    ├── physics.ts
    └── vm.ts
```

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
