# 物理演算システム詳細仕様

## 概要

このドキュメントは、Synthetica v3における物理演算システムの詳細な実装仕様を定義します。v3では全てのゲームオブジェクトは円形として扱われ、シンプルかつ効率的な物理シミュレーションを実現します。

## 1. 衝突判定システム

### 1.1 基本仕様

#### オブジェクト形状
- **形状**: 全てのゲームオブジェクトは円形
- **プロパティ**:
  - 中心座標: `Vec2(x, y)`
  - 半径: `radius`
  - 質量: `mass`（エネルギー量と等価）

#### 衝突判定式

```
// 2つのオブジェクト間の衝突判定
function checkCollision(obj1, obj2):
    dx = obj2.x - obj1.x
    dy = obj2.y - obj1.y
    distance = sqrt(dx * dx + dy * dy)
    
    return distance < (obj1.radius + obj2.radius)
```

### 1.2 最適化手法

#### 空間分割グリッド（Spatial Hash Grid）

v3では空間分割グリッドを採用し、効率的な衝突判定を実現します。

##### グリッドパラメータ

```
GRID_SIZE = 100  // 典型的なHULLサイズの2-3倍
WORLD_WIDTH = 10000
WORLD_HEIGHT = 10000
GRID_COLS = ceil(WORLD_WIDTH / GRID_SIZE)
GRID_ROWS = ceil(WORLD_HEIGHT / GRID_SIZE)
```

##### グリッド登録

```
function registerToGrid(object):
    // オブジェクトが占有する全グリッドセルを計算
    minX = floor((object.x - object.radius) / GRID_SIZE)
    maxX = floor((object.x + object.radius) / GRID_SIZE)
    minY = floor((object.y - object.radius) / GRID_SIZE)
    maxY = floor((object.y + object.radius) / GRID_SIZE)
    
    // トーラス境界を考慮
    for gx in range(minX, maxX + 1):
        for gy in range(minY, maxY + 1):
            gridX = gx % GRID_COLS
            gridY = gy % GRID_ROWS
            grid[gridY][gridX].add(object)
```

#### 距離による早期棄却

計算コストの高い平方根演算を避けるため、段階的な距離チェックを実装します。

```
function checkCollisionOptimized(obj1, obj2):
    // 1. マンハッタン距離による粗い判定
    dx = abs(obj2.x - obj1.x)
    dy = abs(obj2.y - obj1.y)
    maxDist = obj1.radius + obj2.radius
    
    if (dx > maxDist || dy > maxDist):
        return false  // 確実に衝突していない
    
    // 2. 距離の二乗による判定（平方根を避ける）
    distSq = dx * dx + dy * dy
    maxDistSq = maxDist * maxDist
    
    return distSq < maxDistSq
```

### 1.3 衝突検出フロー

```
function detectCollisions():
    // グリッドをクリア
    clearGrid()
    
    // 全オブジェクトをグリッドに登録
    for object in gameObjects:
        registerToGrid(object)
    
    // 衝突ペアを検出
    collisionPairs = []
    processedPairs = Set()
    
    for gridCell in grid:
        objects = gridCell.objects
        
        // 同一グリッド内のオブジェクトペアをチェック
        for i in range(0, objects.length):
            for j in range(i + 1, objects.length):
                obj1 = objects[i]
                obj2 = objects[j]
                
                // 重複チェックを避ける
                pairKey = min(obj1.id, obj2.id) + "," + max(obj1.id, obj2.id)
                if pairKey in processedPairs:
                    continue
                
                processedPairs.add(pairKey)
                
                // 詳細な衝突判定
                if checkCollisionOptimized(obj1, obj2):
                    collisionPairs.add({obj1, obj2})
    
    return collisionPairs
```

### 1.4 トーラス世界での特殊処理

#### 境界を跨ぐオブジェクトの処理

```
function handleTorusBoundary(object):
    // オブジェクトが境界付近にある場合の処理
    nearLeftEdge = object.x - object.radius < 0
    nearRightEdge = object.x + object.radius > WORLD_WIDTH
    nearTopEdge = object.y - object.radius < 0
    nearBottomEdge = object.y + object.radius > WORLD_HEIGHT
    
    // 境界を跨ぐ場合、反対側にも登録
    if nearLeftEdge:
        registerWrappedObject(object, WORLD_WIDTH, 0)
    if nearRightEdge:
        registerWrappedObject(object, -WORLD_WIDTH, 0)
    if nearTopEdge:
        registerWrappedObject(object, 0, WORLD_HEIGHT)
    if nearBottomEdge:
        registerWrappedObject(object, 0, -WORLD_HEIGHT)
```

#### ラップアラウンド距離計算

```
function torusDistance(obj1, obj2):
    dx = obj2.x - obj1.x
    dy = obj2.y - obj1.y
    
    // トーラスでの最短距離を計算
    if abs(dx) > WORLD_WIDTH / 2:
        dx = dx - sign(dx) * WORLD_WIDTH
    if abs(dy) > WORLD_HEIGHT / 2:
        dy = dy - sign(dy) * WORLD_HEIGHT
    
    return sqrt(dx * dx + dy * dy)
```

### 1.5 パフォーマンス考慮事項

#### メモリ効率

```
struct CollisionObject {
    uint32 id;
    float32 x, y;      // 位置
    float32 radius;    // 半径
    uint16 gridCells[MAX_GRID_CELLS];  // 所属グリッド
    uint8 gridCellCount;
}
```

#### 並列化の可能性

- グリッドセルごとの衝突判定は独立して実行可能
- 読み取り専用フェーズと書き込みフェーズを分離

### 1.6 デバッグ機能

#### 衝突判定の可視化

```
// デバッグ描画
function drawCollisionDebug():
    // グリッド線の描画
    for x in range(0, WORLD_WIDTH, GRID_SIZE):
        drawLine(x, 0, x, WORLD_HEIGHT, alpha=0.2)
    for y in range(0, WORLD_HEIGHT, GRID_SIZE):
        drawLine(0, y, WORLD_WIDTH, y, alpha=0.2)
    
    // 衝突ペアの強調表示
    for pair in collisionPairs:
        drawLine(pair.obj1.pos, pair.obj2.pos, color=RED)
        
    // アクティブなグリッドセルの強調
    for gridCell in grid:
        if gridCell.objects.length > 1:
            drawRect(gridCell.bounds, color=YELLOW, alpha=0.3)
```

#### 統計情報

- 総衝突判定回数
- グリッドセルあたりの平均オブジェクト数
- 最も混雑したグリッドセル
- 衝突判定にかかった時間

## 2. 反発力の計算

### 2.1 基本原理

オブジェクトが重なった場合、重なり深度に基づいて反発力を計算します。反発力は重なりが大きいほど強くなりますが、上限値を持ちます。

### 2.2 反発力の計算式

```
function calculateSeparationForce(obj1, obj2):
    // 中心間ベクトル
    dx = obj2.x - obj1.x
    dy = obj2.y - obj1.y
    distance = sqrt(dx * dx + dy * dy)
    
    // 重なり深度
    overlap = (obj1.radius + obj2.radius) - distance
    
    if overlap <= 0:
        return Vec2(0, 0)  // 衝突していない
    
    // 反発力の大きさ（シグモイド関数で上限を設定）
    MAX_FORCE = 1000  // 反発力の上限値
    FORCE_SCALE = 10  // スケーリング係数
    
    // tanh関数により滑らかに上限に漸近
    forceMagnitude = MAX_FORCE * tanh(overlap / FORCE_SCALE)
    
    // 反発方向（obj1から見た場合）
    if distance > 0:
        directionX = -dx / distance
        directionY = -dy / distance
    else:
        // 完全に重なっている場合はランダムな方向
        angle = random() * 2 * PI
        directionX = cos(angle)
        directionY = sin(angle)
    
    return Vec2(forceMagnitude * directionX, forceMagnitude * directionY)
```

### 2.3 反発力の特性

- **重なり深度0付近**: 線形的に増加（≈ overlap × MAX_FORCE / FORCE_SCALE）
- **重なり深度が大きい場合**: MAX_FORCEに漸近
- **完全重複時**: ランダム方向への最大反発力

### 2.4 パラメータ調整

```
// 調整可能なパラメータ
MAX_SEPARATION_FORCE = 1000    // 反発力の上限
FORCE_SCALE_FACTOR = 10        // 反発力の増加率
MIN_SEPARATION_FORCE = 1       // 最小反発力（数値誤差対策）
```

## 3. 速度制限

### 3.1 基本方針

v3ではシステム的な速度制限を設けません。速度は以下の自然な制約により制限されます：

- 摩擦係数による減速
- 反発力の上限による加速度制限
- エネルギー保存則

### 3.2 実装上の考慮

```
// 数値的安定性のための緊急制限のみ
EMERGENCY_VELOCITY_LIMIT = 10000  // 数値エラー防止用

function updateVelocity(object, acceleration, deltaTime):
    object.velocity.x += acceleration.x * deltaTime
    object.velocity.y += acceleration.y * deltaTime
    
    // 数値エラー防止のみ
    speed = magnitude(object.velocity)
    if speed > EMERGENCY_VELOCITY_LIMIT:
        object.velocity = normalize(object.velocity) * EMERGENCY_VELOCITY_LIMIT
```

## 4. 質量と慣性

### 4.1 基本原理

- **質量**: オブジェクトの質量はエネルギー量と等価
- **運動方程式**: F = ma（ニュートンの第2法則）
- **慣性**: 力が加わらない限り等速直線運動を維持
- **回転**: v3では回転運動は扱わない

### 4.2 力と加速度の計算

```
function applyForce(object, force):
    // F = ma より a = F/m
    if object.mass > 0:
        acceleration.x = force.x / object.mass
        acceleration.y = force.y / object.mass
        
        object.acceleration.x += acceleration.x
        object.acceleration.y += acceleration.y
```

### 4.3 運動の更新

```
function updateMotion(object, deltaTime):
    // 速度の更新（v = v0 + at）
    object.velocity.x += object.acceleration.x * deltaTime
    object.velocity.y += object.acceleration.y * deltaTime
    
    // 位置の更新（x = x0 + vt）
    object.position.x += object.velocity.x * deltaTime
    object.position.y += object.velocity.y * deltaTime
    
    // 加速度をリセット（次フレームで再計算）
    object.acceleration = Vec2(0, 0)
```

### 4.4 質量の特殊ケース

```
// エネルギーオブジェクトの質量
energyObject.mass = energyObject.amount

// ユニットの質量
unit.mass = unit.buildEnergy + unit.containedEnergy

// 質量0の扱い（存在しないはずだが安全性のため）
if object.mass <= 0:
    object.mass = MIN_MASS  // 0.001など
```

## 5. 境界条件（トーラス世界）

### 5.1 基本仕様

- 世界の上端と下端が接続
- 世界の左端と右端が接続
- オブジェクトサイズは世界サイズの半分未満

### 5.2 座標のラップアラウンド

```
function wrapPosition(object):
    // 位置を世界境界内に収める
    object.x = ((object.x % WORLD_WIDTH) + WORLD_WIDTH) % WORLD_WIDTH
    object.y = ((object.y % WORLD_HEIGHT) + WORLD_HEIGHT) % WORLD_HEIGHT
```

### 5.3 境界を跨ぐ処理

```
function handleBoundaryCrossing(object):
    // 単純なラップアラウンド（オブジェクトサイズ < 世界サイズ/2 なので問題なし）
    if object.x < 0:
        object.x += WORLD_WIDTH
    else if object.x >= WORLD_WIDTH:
        object.x -= WORLD_WIDTH
        
    if object.y < 0:
        object.y += WORLD_HEIGHT
    else if object.y >= WORLD_HEIGHT:
        object.y -= WORLD_HEIGHT
```

## 6. 処理順序とタイミング

### 6.1 物理演算の処理フロー

```
function physicsUpdate(deltaTime):
    // 1. 力の初期化
    for object in gameObjects:
        object.acceleration = Vec2(0, 0)
    
    // 2. 外部力の適用（方向性力場など）
    applyExternalForces()
    
    // 3. 衝突検出
    collisionPairs = detectCollisions()
    
    // 4. 反発力の計算と適用
    for pair in collisionPairs:
        force = calculateSeparationForce(pair.obj1, pair.obj2)
        applyForce(pair.obj1, force)
        applyForce(pair.obj2, -force)  // 作用・反作用
    
    // 5. 運動の更新
    for object in gameObjects:
        updateMotion(object, deltaTime)
        wrapPosition(object)
    
    // 6. グリッドの更新（次フレーム用）
    updateSpatialGrid()
```

### 6.2 複数衝突の処理

```
// 複数オブジェクトとの衝突は自然に合成される
object A が B, C, D と衝突している場合：
- A←B の反発力
- A←C の反発力  
- A←D の反発力
これらが全て object A の acceleration に加算される
```

### 6.3 タイミング考慮事項

- **同期更新**: 全オブジェクトの位置更新は同時に行う
- **力の蓄積**: 1tick内の全ての力を蓄積してから運動を更新
- **衝突の再計算なし**: 1tick内では衝突判定は1回のみ

## 7. 物理定数とパラメータ

### 7.1 調整可能なパラメータ

```
// 反発力パラメータ
MAX_SEPARATION_FORCE = 1000
SEPARATION_FORCE_SCALE = 10

// 摩擦係数（後日調整）
FRICTION_COEFFICIENT = 0.98  // 暫定値

// 時間ステップ
PHYSICS_DELTA_TIME = 1.0  // 1tick = 1時間単位

// 最小値（ゼロ除算防止）
MIN_MASS = 0.001
MIN_DISTANCE = 0.001
```

### 7.2 実装時の注意事項

- 浮動小数点誤差の蓄積に注意
- ゼロ除算の防止
- 極端な値のクランプ処理

## 実装チェックリスト

### 衝突判定
- [ ] 円形衝突判定の基本実装
- [ ] 空間分割グリッドの実装
- [ ] 距離による早期棄却の実装
- [ ] トーラス境界処理
- [ ] グリッドサイズの調整機能

### 物理演算
- [ ] 反発力計算（tanh関数による上限設定）
- [ ] 質量に基づく加速度計算
- [ ] 速度・位置の更新
- [ ] 複数衝突の合成
- [ ] 境界ラップアラウンド

### デバッグ・調整
- [ ] 物理演算の可視化
- [ ] パラメータ調整UI
- [ ] パフォーマンス計測
- [ ] 物理演算の検証テスト