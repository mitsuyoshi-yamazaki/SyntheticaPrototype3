# 描画仕様

## カラーパレット

| カテゴリ         | 色                      | 用途の説明                               |
| ---------------- | ----------------------- | ---------------------------------------- |
| エネルギー       | `#FFD700`               | 黄色系（視認性が高い、熱・活動性の象徴） |
| エネルギーソース | `#FFB700`               | エネルギーと類似だが濃い色調で差別化     |
| computer         | `#00BFFF`               | 情報・通信を示す青系                     |
| assembler        | `#FF8C00`               | 工業・製造の印象                         |
| hull             | `#A9A9A9`               | 中立的、構造体を表すグレー               |
| 力場             | `rgba(173,216,230,0.2)` | ごく薄い水色、半透明                     |
| UIテキスト背景   | `rgba(0, 0, 0, 0.6)`    | UI領域に使用される半透明の黒             |
| UIテキスト文字色 | `#FFFFFF`               | 白文字（暗背景に明瞭）                   |

---

## オブジェクトデザイン仕様とPixi.js描画サンプル

### エネルギーオブジェクト

- 色: `#FFD700`
- 形状: 小さな円形

```js
const energy = new PIXI.Graphics()
energy.beginFill(0xffd700)
energy.drawCircle(0, 0, 5)
energy.endFill()
```

---

### エネルギーソース

- 色: `#FFB700`
- 形状: 放射状に尖った円形（太陽型）

```js
const source = new PIXI.Graphics()
source.beginFill(0xffb700)
source.drawStar(0, 0, 8, 5) // star(radius=5, points=8)
source.endFill()
```

---

### 生物ユニット（最小構成）

生物は複数ユニットから成り、それぞれの構成要素は以下。

#### computer

```js
const computer = new PIXI.Graphics()
computer.beginFill(0x00bfff)
computer.drawCircle(0, 0, 5)
computer.endFill()
```

#### assembler

```js
const assembler = new PIXI.Graphics()
assembler.beginFill(0xff8c00)
assembler.drawRect(-5, -5, 10, 10)
assembler.endFill()
```

#### hull

```js
const hull = new PIXI.Graphics()
hull.beginFill(0xa9a9a9)
hull.drawPolygon([-5, -5, 5, -5, 5, 5, -5, 5]) // 四角形
hull.endFill()
```

---

## 力場

- 色: `rgba(173,216,230,0.2)`
- 表現: 非表示も可能

```js
const field = new PIXI.Graphics()
field.beginFill(0xadd8e6, 0.2) // rgba
field.endFill()
```

---

## UIテキスト

### 仕様

- 表示位置：画面左上
- フォント：等幅フォント（例: `Courier New`, `monospace`）
- フォントサイズ：12px 程度
- テキスト色：`#FFFFFF`（白）
- 背景色：`rgba(0, 0, 0, 0.6)`（半透明黒）
- 表示内容例：

```
オブジェクト数: 152
時間: 2345.6 step
```

### 描画例（Pixi.js）

```js
const uiBg = new PIXI.Graphics()
uiBg.beginFill(0x000000, 0.6)
uiBg.drawRect(0, 0, 120, 40)
uiBg.endFill()

const uiText = new PIXI.Text("オブジェクト数: 152\n時間: 2345.6 step", {
  fontFamily: "Courier New",
  fontSize: 12,
  fill: 0xffffff,
})
uiText.position.set(5, 5)
```

---

## 備考

- 各オブジェクトの位置・大きさは動的に決定されるため、本仕様書には記載しない。
- オブジェクトの重なり順やレイヤー制御はPixi.jsの`zIndex`またはContainer階層で制御すること。
