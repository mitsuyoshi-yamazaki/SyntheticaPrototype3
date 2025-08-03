# 方向性力場（Directional Force Field）実装仕様

## 概要

Synthetica v3では、移動ユニット（MOVER）の代わりに、環境要素として「方向性力場」を実装します。これは、特定の領域に存在するゲームオブジェクトに一定方向の力を与える環境フィールドです。

## 設計思想

- ゲームオブジェクトの質量差により、同じ力場でも異なる加速度を生じる
- これにより、ある程度の方向性を持ちながらもランダム性のある移動を実現
- エージェントが環境を利用した移動戦略を構築可能

## 方向性力場の基本仕様

### プロパティ

| プロパティ  | 型     | 説明             | 値の範囲               |
| ----------- | ------ | ---------------- | ---------------------- |
| position    | Vec2   | 領域の中心座標   | ワールド座標           |
| radius      | uint16 | 影響半径         | 10〜500                |
| forceVector | Vec2   | 力の方向と大きさ | 各成分 -100〜100       |
| fieldType   | enum   | 力場のタイプ     | LINEAR, RADIAL, SPIRAL |
| isActive    | bool   | 有効フラグ       | true/false             |

### 力場タイプ

#### 1. LINEAR（線形力場）

- 領域内の全オブジェクトに同一方向・同一大きさの力を与える
- 用途：一方向の流れ、風のような効果

```
force = forceVector  // 全位置で一定
```

#### 2. RADIAL（放射状力場）

- 中心から外側（または内側）に向かう力
- 用途：噴出、吸引効果

```
direction = normalize(objectPos - fieldCenter)
force = direction * forceMagnitude
```

#### 3. SPIRAL（渦巻き力場）

- 回転しながら中心に向かう（または離れる）力
- 用途：渦、竜巻効果

```
radialDir = normalize(objectPos - fieldCenter)
tangentDir = Vec2(-radialDir.y, radialDir.x)
force = radialComponent * radialDir + tangentComponent * tangentDir
```

## 力の計算と適用

### 基本計算式

```
// オブジェクトが力場内にいるかチェック
distance = magnitude(object.position - field.position)
if (distance <= field.radius):
    // 力場の強度計算（距離による減衰）
    strength = 1.0 - (distance / field.radius) * 0.5  // 中心で100%、端で50%

    // 力の計算
    appliedForce = field.calculateForce(object.position) * strength

    // 加速度の計算（F = ma より a = F/m）
    acceleration = appliedForce / object.mass

    // オブジェクトの加速度に追加
    object.acceleration += acceleration
```

### 複数力場の重ね合わせ

複数の力場が重なる場合、各力場からの力をベクトル加算します：

```
totalForce = Vec2(0, 0)
for field in affectingFields:
    if field.contains(object.position):
        totalForce += field.calculateForce(object.position)

acceleration = totalForce / object.mass
```

## 実装詳細

### 力場の配置

```
// 初期配置例
FORCE_FIELD_COUNT = 5〜20  // ワールドサイズに応じて調整
MIN_FIELD_DISTANCE = 200   // 力場間の最小距離

function placeForceFields(world):
    fields = []

    for i in range(FORCE_FIELD_COUNT):
        // ランダム配置
        position = Vec2(
            random(0, world.width),
            random(0, world.height)
        )

        // パラメータのランダム生成
        radius = random(50, 300)
        forceMagnitude = random(10, 50)
        forceAngle = random(0, 2 * PI)

        field = DirectionalForceField(
            position: position,
            radius: radius,
            forceVector: Vec2(
                forceMagnitude * cos(forceAngle),
                forceMagnitude * sin(forceAngle)
            ),
            fieldType: randomChoice([LINEAR, RADIAL, SPIRAL])
        )

        fields.append(field)

    return fields
```

### tick処理への統合

物理演算フェーズ（2-1）で力場の影響を計算：

```
// tick処理の物理演算フェーズ
function physicsPhase():
    // 2-1. 加速度・速度計算
    for object in gameObjects:
        // 既存の力（反発力など）
        object.acceleration = calculateExistingForces(object)

        // 力場からの力を追加
        for field in forceFields:
            if field.isActive and field.contains(object.position):
                force = field.calculateForce(object.position)
                object.acceleration += force / object.mass

        // 速度更新
        object.velocity += object.acceleration * deltaTime

        // 摩擦による減速
        object.velocity *= FRICTION_COEFFICIENT  // 0.95〜0.99
```

## パフォーマンス最適化

### 空間分割による高速化

```
// グリッドベースの空間分割
GRID_SIZE = 100

function updateFieldGrid():
    fieldGrid = {}

    for field in forceFields:
        // 影響範囲のグリッドセルを計算
        minX = floor((field.position.x - field.radius) / GRID_SIZE)
        maxX = ceil((field.position.x + field.radius) / GRID_SIZE)
        minY = floor((field.position.y - field.radius) / GRID_SIZE)
        maxY = ceil((field.position.y + field.radius) / GRID_SIZE)

        // 該当グリッドに登録
        for x in range(minX, maxX + 1):
            for y in range(minY, maxY + 1):
                gridKey = (x, y)
                if gridKey not in fieldGrid:
                    fieldGrid[gridKey] = []
                fieldGrid[gridKey].append(field)
```

### バッチ処理

```
// オブジェクトごとに影響する力場を事前計算
function precomputeFieldInfluences():
    for object in gameObjects:
        gridKey = (
            floor(object.position.x / GRID_SIZE),
            floor(object.position.y / GRID_SIZE)
        )

        object.affectingFields = []
        if gridKey in fieldGrid:
            for field in fieldGrid[gridKey]:
                if field.contains(object.position):
                    object.affectingFields.append(field)
```

## 可視化とデバッグ

### 力場の表示

```
// 力場の可視化（開発用）
function renderForceField(field):
    // 外周円
    drawCircle(field.position, field.radius, alpha=0.2)

    // 力の方向を矢印で表示
    if field.fieldType == LINEAR:
        // グリッド状に矢印を配置
        for x in gridPoints:
            for y in gridPoints:
                if field.contains(Vec2(x, y)):
                    drawArrow(Vec2(x, y), field.forceVector)

    else if field.fieldType == RADIAL:
        // 放射状の矢印
        for angle in range(0, 360, 30):
            pos = field.position + polarToCartesian(field.radius * 0.7, angle)
            force = field.calculateForce(pos)
            drawArrow(pos, force)
```

### デバッグ情報

- 各オブジェクトが受けている力の合計
- 力場の影響を受けているオブジェクト数
- 力場ごとのパフォーマンス統計

## ゲームプレイへの影響

### 戦略的要素

1. **力場を利用した移動**
   - エージェントは力場の方向を利用して効率的に移動
   - 質量の調整により移動速度を制御

2. **力場の回避**
   - 不利な方向の力場を避ける経路選択
   - 力場の境界付近での位置取り

3. **資源収集の効率化**
   - 力場を利用したエネルギー収集ルートの構築
   - 複数の力場を組み合わせた移動パターン

### バランス調整パラメータ

```
// 調整可能なパラメータ
FORCE_FIELD_DENSITY = 0.00001  // 力場数/面積
MAX_FORCE_MAGNITUDE = 50       // 最大力の大きさ
FORCE_ATTENUATION = 0.5        // 距離による減衰率
FRICTION_COEFFICIENT = 0.98    // 摩擦係数
```

## 将来の拡張

### v4での検討事項

1. **動的力場**
   - 時間とともに変化する力場
   - プレイヤーが設置可能な力場

2. **条件付き力場**
   - 特定の条件（質量、種類）で影響が変わる
   - エネルギー消費型の強力な力場

3. **相互作用**
   - エージェントが力場に影響を与える
   - 力場同士の干渉効果

## 実装チェックリスト

- [ ] DirectionalForceField クラスの実装
- [ ] 3種類の力場タイプの実装
- [ ] 物理演算への統合
- [ ] 空間分割による最適化
- [ ] 初期配置アルゴリズム
- [ ] 可視化機能（デバッグ用）
- [ ] パラメータ調整UI
- [ ] パフォーマンステスト
- [ ] ゲームバランステスト

## 関連ドキュメント

- `game-world-requirement.md`: 基本的な物理演算の仕様
- `energy-action-order.md`: tick処理の順序
- `TODO.md`: 移動システムの要件
