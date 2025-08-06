# エネルギー自然崩壊システム仕様

## 概要

このドキュメントは、Synthetica v3におけるエネルギーの自然崩壊システムの詳細な実装仕様を定義します。エネルギーの自然崩壊は、未使用のエネルギーが時間経過により熱に変換される現象を表現し、エネルギーが無限に蓄積することを防ぎます。

## 物理的解釈

エネルギーの自然崩壊は、以下の現実世界の現象に対応します：

- **放射性崩壊**: 不安定な物質が自発的に崩壊する現象
- **熱力学第二法則**: 孤立系のエントロピーは常に増大する
- **エネルギーの散逸**: 秩序だったエネルギーが無秩序な熱エネルギーに変換される

## 崩壊の基本仕様

### 崩壊量の計算式

```
崩壊量 = ceil(sqrt(エネルギー量) / 10)
```

### 計算例

| エネルギー量 | 崩壊量/tick | 半減期（概算） |
| ------------ | ----------- | -------------- |
| 1E           | 1E          | 1 tick         |
| 10E          | 1E          | 7 ticks        |
| 100E         | 1E          | 50 ticks       |
| 400E         | 2E          | 134 ticks      |
| 1000E        | 4E          | 176 ticks      |
| 2500E        | 5E          | 357 ticks      |
| 10000E       | 10E         | 693 ticks      |

### 特性

- **最小崩壊量**: 1E/tick（エネルギー量が1-99Eの場合）
- **非線形性**: エネルギー量が多いほど崩壊速度が増加するが、平方根の関係
- **自己制限的**: 崩壊によりエネルギーが減少すると崩壊速度も低下

## 実装仕様

### 処理タイミング

tick処理の「環境処理フェーズ」内で実行：

1. エネルギーソースからエネルギー生成
2. **エネルギーの自然崩壊処理**（新規）

### 処理フロー

```javascript
function processEnergyDecay(energyObjects) {
  for (const energyObj of energyObjects) {
    // 崩壊量の計算
    const decayAmount = calculateDecayAmount(energyObj.energy)

    // エネルギーを減少
    const newEnergy = energyObj.energy - decayAmount

    if (newEnergy <= 0) {
      // エネルギーが完全に崩壊
      removeObject(energyObj)
      addHeatToCell(energyObj.position, energyObj.energy)
    } else {
      // 部分的な崩壊
      energyObj.energy = newEnergy
      energyObj.mass = newEnergy // 質量も同時に更新
      addHeatToCell(energyObj.position, decayAmount)
    }
  }
}

function calculateDecayAmount(energy) {
  return Math.ceil(Math.sqrt(energy) / 10)
}
```

### 熱への変換

- 崩壊したエネルギーは1:1の比率で熱に変換される
- 熱は、エネルギーオブジェクトが存在するセルに加算される
- 複数のセルにまたがるオブジェクトの場合、中心座標のセルに熱が発生

## 物理的影響

### サイズと質量の更新

エネルギーオブジェクトの崩壊に伴い：

- 質量 = エネルギー量（常に等価）
- サイズ（半径）= エネルギー量に応じて再計算（`energy-object-physics.md`参照）

### 衝突判定への影響

- エネルギーが減少すると半径も小さくなる
- 衝突判定の再計算が必要

## バランス調整

### パラメータ

```javascript
// 崩壊率の調整可能パラメータ
const DECAY_RATE_DIVISOR = 10 // 崩壊量計算の除数（大きいほど崩壊が遅い）
```

### 期待される効果

- **短期的**: 小さなエネルギーオブジェクト（1-10E）は数tickで消滅
- **中期的**: 中規模エネルギー（100-1000E）は数百tickで半減
- **長期的**: 大規模エネルギー（10000E以上）も徐々に減少

## 性能への配慮

### 最適化

```javascript
// 事前計算テーブルの使用
const DECAY_TABLE = new Map()
for (let i = 1; i <= 10000; i++) {
  DECAY_TABLE.set(i, Math.ceil(Math.sqrt(i) / 10))
}

function getDecayAmount(energy) {
  if (energy <= 10000) {
    return DECAY_TABLE.get(energy)
  }
  return Math.ceil(Math.sqrt(energy) / 10)
}
```

### 処理の効率化

- エネルギーオブジェクトのみを対象とする（type === "ENERGY"のフィルタリング）
- 崩壊量が0になることはないため、条件分岐を削減

## デバッグ機能

### 統計情報

- 崩壊したエネルギーの総量/tick
- 完全に消滅したオブジェクト数/tick
- 崩壊により発生した熱の総量/tick

### 可視化

- 崩壊中のエネルギーオブジェクトに視覚的インジケータ
- 崩壊率の高いオブジェクトを色分け表示

## 実装チェックリスト

- [ ] 崩壊量計算関数の実装
- [ ] tick処理への統合
- [ ] エネルギーオブジェクトの更新処理
- [ ] 熱への変換処理
- [ ] サイズ・質量の同期更新
- [ ] 完全崩壊時のオブジェクト削除
- [ ] パフォーマンステーブルの実装
- [ ] デバッグ統計の実装
- [ ] 単体テストの作成

## 関連ドキュメント

- `game-world-requirement.md`: エネルギーシステムの基本仕様
- `heat-diffusion-system.md`: 熱システムの仕様
- `energy-source-specification.md`: エネルギー生成の仕様
- `energy-object-physics.md`: エネルギーオブジェクトの物理仕様
