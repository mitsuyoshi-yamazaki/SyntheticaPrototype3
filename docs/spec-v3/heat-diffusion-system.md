# 熱拡散システム詳細仕様

## 概要

このドキュメントは、Synthetica v3における熱拡散システムの詳細な実装仕様を定義します。熱システムは、ゲーム世界のエントロピーを表現し、エージェントの活動と環境の相互作用を実現します。

## 熱処理の基本フロー

各tickにおける熱処理は以下の順序で実行されます：

1. **熱の発生**: ゲームオブジェクトの活動による熱の追加
2. **熱の拡散・平衡化**: セルオートマトン計算による熱の移動
3. **放熱**: 環境への熱の放出

## 1. 熱の発生

### 基本仕様

- エネルギー消費を伴う全ての活動は熱を発生させる
- 発生する熱量 = 消費されたエネルギー量
- 熱は活動が行われたゲームオブジェクトの座標に対応するセルに追加される

### 熱を発生させる活動

| 活動               | 発生熱量                       |
| ------------------ | ------------------------------ |
| ユニット生産       | 生産エネルギー                 |
| ユニット修復       | 修復に使用したエネルギー × 1.1 |
| COMPUTER動作       | 命令実行数 × 動作コスト        |
| HULLマージ         | マージコスト                   |
| エネルギー自然崩壊 | 崩壊したエネルギー量           |
| その他のアクション | 消費エネルギー量               |

## 2. 熱の拡散・平衡化

### セルオートマトン仕様

- **近傍**: ノイマン近傍（上下左右の4セル）
- **境界条件**: トーラス（上下左右がループ）
- **保存則**: セルオートマトン計算中は熱の総量が保存される

### 熱量移動の計算式

各セルについて、隣接する4セルとの間で熱量のやり取りを計算します。

```
// セル(x,y)の現在の熱量
currentHeat = heatMap[x][y]

// 隣接セルとの熱交換を計算
netHeatFlow = 0

for each neighbor in [north, south, east, west]:
    neighborHeat = heatMap[neighbor.x][neighbor.y]

    // 各セルの1/4を基準熱量とする
    baseHeat = floor(currentHeat / 4)
    neighborBaseHeat = floor(neighborHeat / 4)

    // 熱量差
    heatDifference = neighborBaseHeat - baseHeat

    // 移動熱量の計算（差の1/3を移動）
    // 正の値: 隣接セルから流入
    // 負の値: 隣接セルへ流出
    heatFlow = floor(heatDifference / 3)

    // 移動量の制限（差の半分未満）
    maxFlow = floor(abs(heatDifference) / 2) - 1
    if abs(heatFlow) > maxFlow:
        heatFlow = sign(heatFlow) * maxFlow

    netHeatFlow += heatFlow

// 次tickの熱量
newHeat[x][y] = currentHeat + netHeatFlow
```

### 実装上の注意

- 全セルの更新は同時に行う（同期更新）
- 負の熱量にならないよう、流出量の合計がセルの熱量を超えないことを保証

```
// 流出制限のチェック
totalOutflow = 0
for each heatFlow in outflows:
    totalOutflow += abs(heatFlow)

if totalOutflow > currentHeat:
    // 比例配分で流出量を調整
    scale = currentHeat / totalOutflow
    for each heatFlow in outflows:
        heatFlow = floor(heatFlow * scale)
```

## 3. 放熱

### 放熱メカニズム

各セルから環境（ゲーム世界の外）への熱の放出を計算します。

```
// 仮想的な環境温度を持つ隣接セルとの熱交換として計算
environmentHeat = floor(currentHeat * 9 / 10)

// 環境との熱量差
baseHeat = floor(currentHeat / 4)
envBaseHeat = floor(environmentHeat / 4)
heatDifference = baseHeat - envBaseHeat

// 放熱量（環境への流出）
radiationAmount = floor(heatDifference / 3)

// 放熱量の制限
maxRadiation = floor(heatDifference / 2) - 1
if radiationAmount > maxRadiation:
    radiationAmount = maxRadiation

// 放熱後の熱量
newHeat = currentHeat - radiationAmount
```

### 放熱の特性

- 熱量が多いセルほど放熱量が多い
- 完全に冷却されることはない（漸近的に減少）
- 低温のセルからの放熱は非常に少ない

## 熱ダメージの適用

### ダメージ閾値と計算

```
HEAT_DAMAGE_THRESHOLD = 100  // 100度を超えるとダメージ

if cellHeat > HEAT_DAMAGE_THRESHOLD:
    damagePerTick = ceil(cellHeat - HEAT_DAMAGE_THRESHOLD)

    // ユニット状態による倍率
    if unit.isDamaged():  // 構成エネルギー50%以下
        damagePerTick *= 2
    else if unit.isProducing():  // 生産中
        damagePerTick *= 3
```

## パフォーマンス最適化

### 計算の最適化

```
// 事前計算テーブル
HEAT_QUARTER_TABLE = []  // floor(heat / 4) の事前計算
HEAT_FLOW_TABLE = []     // floor(diff / 3) の事前計算

// 差分更新
// 熱が変化したセルとその隣接セルのみ再計算
dirtySet = Set()
for cell in heatChangedCells:
    dirtySet.add(cell)
    dirtySet.add(cell.neighbors)
```

### メモリレイアウト

```
// キャッシュ効率を考慮したデータ構造
struct HeatGrid {
    uint16[][] currentHeat;  // 現在の熱量
    uint16[][] nextHeat;     // 次tickの熱量
    uint16[][] heatDelta;    // 熱の変化量（デバッグ用）
}
```

## 可視化とデバッグ

### 熱マップ表示

```
// 色分け例
0-20度:   青（寒冷）
21-50度:  緑（適温）
51-100度: 黄（高温）
101-200度: 橙（危険）
201度以上: 赤（致命的）
```

### デバッグ情報

- セルごとの熱量
- 熱の流入/流出量
- 放熱量
- 熱の総量（保存則チェック）

## パラメータ調整

### 調整可能なパラメータ

```
// 熱拡散パラメータ
HEAT_DIFFUSION_BASE = 4      // 基準熱量の分母
HEAT_FLOW_RATE = 3           // 熱流量の分母
HEAT_FLOW_LIMIT_RATIO = 2    // 最大流量の制限比

// 放熱パラメータ
RADIATION_ENV_RATIO = 9/10   // 環境温度の比率
RADIATION_RATE = 3           // 放熱率の分母

// ダメージパラメータ
HEAT_DAMAGE_THRESHOLD = 100  // ダメージ開始温度
DAMAGE_MULTIPLIER_DAMAGED = 2    // 損傷時の倍率
DAMAGE_MULTIPLIER_PRODUCING = 3  // 生産中の倍率
```

## 実装例

### 完全な熱拡散計算

```javascript
function updateHeatDiffusion(heatGrid, width, height) {
  const newHeat = Array(height)
    .fill()
    .map(() => Array(width).fill(0))

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const currentHeat = heatGrid[y][x]
      let netFlow = 0

      // 4方向の隣接セルとの熱交換
      const neighbors = [
        { x: x, y: (y - 1 + height) % height }, // 北
        { x: x, y: (y + 1) % height }, // 南
        { x: (x - 1 + width) % width, y: y }, // 西
        { x: (x + 1) % width, y: y }, // 東
      ]

      for (const neighbor of neighbors) {
        const neighborHeat = heatGrid[neighbor.y][neighbor.x]

        // 基準熱量
        const baseHeat = Math.floor(currentHeat / 4)
        const neighborBaseHeat = Math.floor(neighborHeat / 4)

        // 熱流量
        const diff = neighborBaseHeat - baseHeat
        let flow = Math.floor(diff / 3)

        // 流量制限
        const maxFlow = Math.floor(Math.abs(diff) / 2) - 1
        if (Math.abs(flow) > maxFlow && maxFlow > 0) {
          flow = Math.sign(flow) * maxFlow
        }

        netFlow += flow
      }

      // 流出制限チェック
      if (netFlow < 0 && Math.abs(netFlow) > currentHeat) {
        netFlow = -currentHeat
      }

      newHeat[y][x] = currentHeat + netFlow
    }
  }

  return newHeat
}
```

## 実装チェックリスト

- [ ] 熱発生処理の実装
- [ ] セルオートマトン熱拡散の実装
- [ ] 放熱処理の実装
- [ ] 熱ダメージ計算の実装
- [ ] 境界条件（トーラス）の処理
- [ ] 負の熱量防止の実装
- [ ] パフォーマンス最適化
- [ ] 熱マップ可視化
- [ ] デバッグツール
- [ ] パラメータ調整UI

## 関連ドキュメント

- `game-world-requirement.md`: 基本的な熱システムの要件
- `energy-action-order.md`: tick処理の順序
- `TODO.md`: 実装タスク管理
