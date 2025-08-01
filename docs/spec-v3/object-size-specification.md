# オブジェクトの大きさ・形状仕様

## 概要

このドキュメントは、Synthetica v3における全てのゲームオブジェクトの大きさと形状の具体的な仕様を定義します。v3では全てのオブジェクトは円形として扱われます。

## 基本原則

1. **統一形状**: 全てのゲームオブジェクトは円形
2. **サイズ計算**: オブジェクトの種類により異なるルール
3. **ダメージ不変**: ユニットがダメージを受けても大きさは変化しない

## エネルギーオブジェクトのサイズ

エネルギーオブジェクトのサイズ計算は`energy-object-physics.md`で定義済み：

```
ENERGY_TO_AREA_RATIO = 1.0  // 比例係数

function calculateEnergyRadius(energy):
    area = energy * ENERGY_TO_AREA_RATIO
    radius = sqrt(area / PI)
    return radius
```

## ユニットのサイズ計算

### HULL以外のユニット

ASSEMBLER、COMPUTERなどのユニットは、構成エネルギー量に基づいてサイズが決定されます。

```
function calculateUnitRadius(unit):
    // 構成エネルギー量（ダメージを含む全容量）
    buildEnergy = unit.buildEnergy
    
    // エネルギーオブジェクトと同じ計算式
    return calculateEnergyRadius(buildEnergy)

// 例：
// ASSEMBLER (構成エネルギー 1000E) → radius ≈ 17.84
// COMPUTER (構成エネルギー 600E) → radius ≈ 13.82
```

#### 重要な仕様

- **ダメージによるサイズ不変**: ユニットがダメージを受けて構成エネルギーが減少しても、オブジェクトのサイズは変化しない
- **サイズ基準**: 生成時の構成エネルギー量（buildEnergy）で固定

### HULLのサイズ

HULLは容積と構成エネルギーの両方を考慮してサイズが決定されます。

```
function calculateHullRadius(hull):
    // HULLの容積
    volume = hull.capacity
    
    // HULLの構成エネルギー
    buildEnergy = hull.buildEnergy
    
    // 容積から半径を計算（容積を面積として扱う）
    volumeRadius = sqrt(volume / PI)
    
    // 構成エネルギーから半径を計算
    energyRadius = calculateEnergyRadius(buildEnergy)
    
    // 合計半径（容積の半径 + 構成エネルギーの半径）
    totalRadius = volumeRadius + energyRadius
    
    return totalRadius

// 例：
// 容量100、構成エネルギー200Eの場合
// volumeRadius = sqrt(100 / 3.14159) ≈ 5.64
// energyRadius = sqrt(200 / 3.14159) ≈ 7.98
// totalRadius = 5.64 + 7.98 ≈ 13.62
```

#### HULLサイズの解釈

- **内部空間**: `volumeRadius`で表される部分（ユニットやエネルギーを格納可能）
- **構造部分**: `energyRadius`で表される部分（HULLの物理的な壁）

## 具体的なサイズ例

### ユニットのサイズ

| ユニット種別 | 構成エネルギー例 | 半径 |
|------------|---------------|------|
| ASSEMBLER (assemble_power=1) | 1000E | ≈17.84 |
| ASSEMBLER (assemble_power=2) | 1200E | ≈19.54 |
| COMPUTER (10命令/tick, 64byte) | 600E + 3200E | ≈34.15 |
| COMPUTER (1命令/tick, 0byte) | 500E | ≈12.62 |

### HULLのサイズ

| 容量 | 構成エネルギー | 容積半径 | エネルギー半径 | 総半径 |
|-----|-------------|---------|------------|-------|
| 50 | 100E | ≈3.99 | ≈5.64 | ≈9.63 |
| 100 | 200E | ≈5.64 | ≈7.98 | ≈13.62 |
| 500 | 1000E | ≈12.62 | ≈17.84 | ≈30.46 |
| 1000 | 2000E | ≈17.84 | ≈25.23 | ≈43.07 |

## 実装上の注意事項

### 衝突判定

```
function checkCollision(obj1, obj2):
    // 両オブジェクトの半径を使用
    distance = magnitude(obj2.position - obj1.position)
    return distance < (obj1.radius + obj2.radius)
```

### サイズ更新のタイミング

```
// ユニット生成時
function createUnit(type, specs):
    unit = new Unit(type, specs)
    unit.radius = calculateUnitRadius(unit)
    unit.radiusFixed = true  // サイズ固定フラグ
    return unit

// ダメージ処理時
function applyDamage(unit, damage):
    unit.currentEnergy -= damage
    // radiusは更新しない（サイズ不変）
    
// エネルギーオブジェクトの場合のみサイズ更新
function updateEnergyObject(energyObj, newEnergy):
    energyObj.energy = newEnergy
    energyObj.radius = calculateEnergyRadius(newEnergy)  // サイズ更新
```

### メモリ効率

```
struct GameObject {
    uint16 radius;       // 半径（固定小数点表現）
    uint8 type;          // オブジェクトタイプ
    bool radiusFixed;    // サイズ固定フラグ（ユニット用）
}
```

## パラメータ調整

```
// グローバル設定
ENERGY_TO_AREA_RATIO = 1.0    // エネルギー対面積比（全体的なサイズ調整）
MIN_RADIUS = 1.0              // 最小半径（描画用）
MAX_RADIUS = 1000.0           // 最大半径（数値制限）

// スケーリング関数（ゲームバランス調整用）
function scaleRadius(radius):
    // 必要に応じてスケーリング
    return radius * GLOBAL_SCALE_FACTOR
```

## デバッグ表示

```
function drawObjectDebug(object):
    // オブジェクトの境界円
    drawCircle(object.position, object.radius, color=WHITE)
    
    // HULLの場合、内部空間も表示
    if object.type == HULL:
        volumeRadius = sqrt(object.capacity / PI)
        drawCircle(object.position, volumeRadius, color=GRAY, alpha=0.5)
        
    // サイズ情報
    drawText(object.position, "R:" + object.radius)
```

## 実装チェックリスト

- [ ] エネルギー半径計算関数の共通化
- [ ] ユニットサイズ計算の実装
- [ ] HULLサイズ計算の実装
- [ ] サイズ固定フラグの実装
- [ ] 衝突判定でのサイズ使用
- [ ] デバッグ表示機能
- [ ] パラメータ調整UI

## 関連ドキュメント

- `energy-object-physics.md`: エネルギーオブジェクトのサイズ計算
- `physics-system-specification.md`: 衝突判定の詳細
- `game-world-requirement.md`: 基本的な仕様