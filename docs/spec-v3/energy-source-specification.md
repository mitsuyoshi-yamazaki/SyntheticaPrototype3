# エネルギーソース実装仕様

## 概要

このドキュメントは、Synthetica v3におけるエネルギーソースの詳細な実装仕様を定義します。エネルギーソースは、ゲーム世界にエネルギーを供給する固定オブジェクトです。

## エネルギーソースの基本仕様

### プロパティ

| プロパティ | 型 | 説明 | 値 |
|-----------|------|------|-----|
| position | Vec2 | 固定位置座標 | 初期配置時に決定 |
| energyPerTick | uint16 | 1tickあたりの生成量 | 10〜100E（ランダム） |
| id | uint32 | ユニークID | 自動割り当て |
| isActive | bool | 生成有効フラグ | true（常時） |

### 特性

- **破壊不可能**: エネルギーソースは削除・移動・変更できない
- **常時生成**: 毎tick、設定されたエネルギー量を生成する
- **物理的実体なし**: エネルギーソース自体は衝突判定を持たない

## エネルギー生成仕様

### 生成量

```
各エネルギーソースの生成量 = 10〜100E（初期化時にランダム決定）
```

- 初期化時に各エネルギーソースごとに固定値として決定
- ゲーム中の変更は不可

### 生成プロセス

1. **生成タイミング**: 環境処理フェーズ（tick処理の3-1）
2. **生成位置**: エネルギーソースの座標
3. **生成手順**:

```
for each energySource in world:
    if energySource.isActive:
        position = energySource.position
        amount = energySource.energyPerTick
        
        if isPositionOccupied(position):
            nearestEmpty = findNearestEmptyPosition(position)
            if nearestEmpty != null:
                createEnergyObject(nearestEmpty, amount)
        else:
            createEnergyObject(position, amount)
```

## エネルギーオブジェクトの物理仕様

### 基本特性

- **サイズ**: エネルギー量に比例（詳細は別途定義）
- **質量**: エネルギー量と等価
- **初期速度**: Vec2(0, 0)
- **衝突判定**: 通常のゲームオブジェクトと同様

### エネルギー結合ルール

隣接する複数のエネルギーオブジェクトは以下の条件で自動結合します：

```
結合条件:
1. 隣接している（距離 <= 隣接距離閾値）
2. 速度差が閾値以下（|velocity1 - velocity2| <= 10）

結合時の処理:
- 新エネルギー量 = energy1 + energy2
- 新速度 = Vec2(0, 0)
- 新位置 = 質量重心位置
```

### 結合処理の実装

```
// 擬似コード
function checkEnergyMerge(energy1, energy2):
    if !areAdjacent(energy1, energy2):
        return false
    
    velocityDiff = magnitude(energy1.velocity - energy2.velocity)
    if velocityDiff > 10:
        return false
    
    // 結合実行
    newEnergy = energy1.amount + energy2.amount
    newPosition = weightedCenter(energy1, energy2)
    
    removeObject(energy1)
    removeObject(energy2)
    createEnergyObject(newPosition, newEnergy, velocity=Vec2(0,0))
    
    return true
```

## 空き位置探索アルゴリズム

### 基本アルゴリズム（螺旋探索）

```
function findNearestEmptyPosition(center):
    maxRadius = 50  // 探索範囲の制限
    
    for radius in range(1, maxRadius):
        // 8方向を距離順に探索
        for angle in [0, 45, 90, 135, 180, 225, 270, 315]:
            position = center + polarToCartesian(radius, angle)
            if !isPositionOccupied(position):
                return position
    
    return null  // 空き位置なし
```

### 探索失敗時の処理

- 探索範囲内に空き位置が見つからない場合、そのtickではエネルギー生成をスキップ
- 次のtickで再度生成を試みる
- 生成スキップのログを記録（デバッグ用）

## 初期配置仕様

### 配置パラメータ

```
// 暫定値（調整可能）
ENERGY_SOURCE_COUNT = floor(WORLD_WIDTH * WORLD_HEIGHT / 10000)
MIN_DISTANCE_BETWEEN_SOURCES = 50  // 最小間隔（オプション）
```

### 配置アルゴリズム

```
function placeEnergySources(worldWidth, worldHeight, count):
    sources = []
    
    for i in range(count):
        // ランダム配置
        x = random(0, worldWidth)
        y = random(0, worldHeight)
        energyPerTick = random(10, 100)
        
        source = EnergySource(
            position: Vec2(x, y),
            energyPerTick: energyPerTick,
            id: generateUniqueId()
        )
        
        sources.append(source)
    
    return sources
```

## パフォーマンス考慮事項

### 最適化ポイント

1. **空間分割**: エネルギーソースを空間分割構造で管理
2. **結合チェック**: 近傍のエネルギーオブジェクトのみチェック
3. **生成スキップ**: 混雑エリアでの早期スキップ判定

### メモリ効率

```
// エネルギーソース1つあたりのメモリ使用量
struct EnergySource {
    uint32 id;           // 4 bytes
    uint16 x;            // 2 bytes
    uint16 y;            // 2 bytes
    uint16 energyPerTick;// 2 bytes
    uint16 flags;        // 2 bytes (将来の拡張用)
}  // 合計: 12 bytes
```

## デバッグ機能

### ログ出力

- エネルギー生成成功/失敗の統計
- 結合イベントの記録
- 空き位置探索の失敗回数

### 可視化

- エネルギーソースの位置表示（特別なマーカー）
- 生成量のヒートマップ表示
- 結合頻度の可視化

## 将来の拡張性

### v4での検討事項

1. **動的生成量**: 環境要因による生成量の変動
2. **エネルギータイプ**: 複数種類のエネルギー
3. **枯渇メカニズム**: 有限のエネルギー総量
4. **プレイヤー設置**: エネルギーソースの追加配置

### 設定可能パラメータ

将来的に以下のパラメータを実行時に調整可能にする：

- エネルギーソース密度
- 生成量の範囲
- 結合条件の閾値
- 探索範囲の制限

## 実装チェックリスト

- [ ] エネルギーソース構造体の定義
- [ ] 初期配置アルゴリズムの実装
- [ ] tick処理への統合
- [ ] エネルギー生成ロジック
- [ ] 空き位置探索アルゴリズム
- [ ] エネルギー結合処理
- [ ] デバッグ用ログ機能
- [ ] パフォーマンステスト
- [ ] パラメータ調整UI（開発用）

## 関連ドキュメント

- `game-world-requirement.md`: 基本的な要件定義
- `energy-definition.md`: エネルギーシステムの概要
- `energy-action-order.md`: 処理順序の仕様