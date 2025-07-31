# エネルギーオブジェクト物理仕様

## 概要

このドキュメントは、Synthetica v3におけるエネルギーオブジェクトの物理的な振る舞いの詳細仕様を定義します。エネルギーオブジェクトは、ゲーム世界における基本的な資源であり、物理法則に従って移動・結合します。

## 基本仕様

### オブジェクト特性

- **形状**: 円形（他のゲームオブジェクトと同様）
- **質量**: エネルギー量と等価（1E = 1質量単位）
- **物理演算**: 通常のゲームオブジェクトと同様の物理法則に従う

### サイズ計算

エネルギー量がオブジェクトの面積に比例します。

```
// エネルギー量から半径を計算
ENERGY_TO_AREA_RATIO = 1.0  // 比例係数（調整可能）

function calculateRadius(energy):
    area = energy * ENERGY_TO_AREA_RATIO
    radius = sqrt(area / PI)
    return radius

// 例：
// 1E → radius = sqrt(1.0 / 3.14159) ≈ 0.564
// 100E → radius = sqrt(100.0 / 3.14159) ≈ 5.64
// 1000E → radius = sqrt(1000.0 / 3.14159) ≈ 17.84
```

### エネルギー量の制約

- **最小値**: 1E（1E未満は存在しない）
- **最大値**: 制限なし
- **整数制約**: エネルギー量は常に整数値

## エネルギーの結合

### 結合条件

エネルギーオブジェクト同士が以下の条件を満たす場合、自動的に結合します：

1. 隣接している（距離 ≤ 隣接距離閾値）
2. 相対速度が閾値以下（|velocity1 - velocity2| ≤ 10）

### 結合処理

```
function mergeEnergyObjects(obj1, obj2):
    // 新しいエネルギー量
    newEnergy = obj1.energy + obj2.energy
    
    // 結合位置（2オブジェクトの中間点）
    newPosition = Vec2(
        (obj1.x + obj2.x) / 2,
        (obj1.y + obj2.y) / 2
    )
    
    // 新しい速度（運動量保存）
    totalMomentum = Vec2(
        obj1.velocity.x * obj1.mass + obj2.velocity.x * obj2.mass,
        obj1.velocity.y * obj1.mass + obj2.velocity.y * obj2.mass
    )
    newVelocity = Vec2(
        totalMomentum.x / newEnergy,
        totalMomentum.y / newEnergy
    )
    
    // 新しいオブジェクトを生成
    removeObject(obj1)
    removeObject(obj2)
    createEnergyObject(newPosition, newEnergy, newVelocity)
```

### 結合の特性

- **2オブジェクトずつ処理**: 3つ以上の同時結合はなし
- **連鎖的結合**: A+B→AB、AB+C→ABC のように順次処理
- **結合後の速度0**: HULL内での結合時は相対速度0のため、結合後も速度0

## HULLによるエネルギー回収

### 完全回収

HULLが十分な容量を持つ場合、エネルギーオブジェクト全体を回収します。

```
function collectEnergy(hull, energyObject):
    if hull.canStore(energyObject.energy):
        hull.storedEnergy += energyObject.energy
        removeObject(energyObject)
        return true
    else:
        return partialCollect(hull, energyObject)
```

### 部分回収

HULLの容量が不足する場合、可能な分だけ回収します。

```
function partialCollect(hull, energyObject):
    availableCapacity = hull.maxCapacity - hull.currentCapacity
    
    if availableCapacity <= 0:
        return false  // 回収不可
    
    // 回収可能な最大エネルギー量
    collectAmount = min(availableCapacity, energyObject.energy)
    
    // HULLに格納
    hull.storedEnergy += collectAmount
    
    // エネルギーオブジェクトを更新
    energyObject.energy -= collectAmount
    
    if energyObject.energy <= 0:
        removeObject(energyObject)
    else:
        // サイズを再計算
        energyObject.radius = calculateRadius(energyObject.energy)
        energyObject.mass = energyObject.energy
        // 位置と速度は変更なし
    
    return true
```

### HULL内での挙動

```
// HULL内に格納されたエネルギーは即座に統合される
function processEnergyInHull(hull):
    // HULL内のエネルギーオブジェクトは全て相対速度0
    // したがって全て結合条件を満たす
    
    totalEnergy = 0
    for energyObj in hull.containedEnergyObjects:
        totalEnergy += energyObj.energy
        removeObject(energyObj)
    
    if totalEnergy > 0:
        // 統合されたエネルギーとしてHULLが保持
        hull.storedEnergy += totalEnergy
```

## 物理演算との統合

### 初期生成

```
function spawnEnergyFromSource(source):
    position = source.position
    energy = source.energyPerTick
    velocity = Vec2(0, 0)  // 初期速度0
    
    newObject = EnergyObject{
        position: position,
        velocity: velocity,
        energy: energy,
        radius: calculateRadius(energy),
        mass: energy,
        type: ENERGY_OBJECT
    }
    
    addToWorld(newObject)
```

### 衝突処理

エネルギーオブジェクトは通常のゲームオブジェクトと同様に衝突判定されます：

- 他のエネルギーオブジェクトとの衝突 → 反発力 + 結合チェック
- ユニットとの衝突 → 反発力のみ
- 方向性力場の影響を受ける

## 特殊ケース

### エネルギー量0の処理

```
// エネルギーが0になったオブジェクトは即座に削除
if energyObject.energy <= 0:
    removeObject(energyObject)
```

### 最小エネルギー保証

```
// 1E未満にならないよう保証
function updateEnergy(energyObject, delta):
    newEnergy = energyObject.energy + delta
    
    if newEnergy < 1:
        if delta < 0:
            // 減少の場合、オブジェクトを削除
            removeObject(energyObject)
        else:
            // 増加の場合、1Eに設定
            energyObject.energy = 1
    else:
        energyObject.energy = floor(newEnergy)  // 整数値を保証
```

## パラメータ一覧

```
// サイズ計算
ENERGY_TO_AREA_RATIO = 1.0      // エネルギー対面積比（調整可能）

// 結合条件
MERGE_VELOCITY_THRESHOLD = 10    // 速度差閾値
ADJACENCY_DISTANCE = 5          // 隣接判定距離

// 物理特性
ENERGY_OBJECT_FRICTION = 0.98   // 摩擦係数（他オブジェクトと同じ）
```

## デバッグ表示

```
// エネルギーオブジェクトのデバッグ情報
function drawEnergyDebug(energyObject):
    // エネルギー量を中心に表示
    drawText(energyObject.position, energyObject.energy + "E")
    
    // 速度ベクトルを表示
    drawLine(
        energyObject.position,
        energyObject.position + energyObject.velocity * 10,
        color=GREEN
    )
    
    // 結合可能範囲を表示
    drawCircle(
        energyObject.position,
        energyObject.radius + ADJACENCY_DISTANCE,
        color=YELLOW,
        alpha=0.3
    )
```

## 実装チェックリスト

- [ ] エネルギーオブジェクト構造体の定義
- [ ] サイズ計算関数の実装
- [ ] 結合処理の実装
- [ ] 部分回収機能の実装
- [ ] HULL内での自動結合
- [ ] 物理演算システムへの統合
- [ ] エネルギー量の整数制約保証
- [ ] デバッグ表示機能

## 関連ドキュメント

- `energy-definition.md`: エネルギーシステムの基本定義
- `energy-source-specification.md`: エネルギー生成の仕様
- `physics-system-specification.md`: 物理演算の詳細
- `game-world-requirement.md`: 基本的なゲーム仕様