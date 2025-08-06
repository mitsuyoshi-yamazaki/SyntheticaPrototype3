import { Viewport } from "./viewport"
import type { Container } from "pixi.js"

// PixiJS Containerのモック
class MockContainer {
  public scale = {
    x: 1,
    y: 1,
    set: jest.fn((value: number) => {
      this.scale.x = value
      this.scale.y = value
    }),
  }
  public position = {
    x: 0,
    y: 0,
    set: jest.fn((x: number, y: number) => {
      this.position.x = x
      this.position.y = y
    }),
  }
}

describe("Viewport", () => {
  let viewport: Viewport
  const defaultConfig = {
    screenWidth: 800,
    screenHeight: 600,
    worldWidth: 1600,
    worldHeight: 1200,
  }

  beforeEach(() => {
    viewport = new Viewport(defaultConfig)
  })

  describe("初期化", () => {
    test("デフォルト値で初期化される", () => {
      expect(viewport.config.minZoom).toBe(0.1)
      expect(viewport.config.maxZoom).toBe(5.0)
      expect(viewport.config.initialZoom).toBe(1.0)
      expect(viewport.config.initialPosition).toEqual({ x: 800, y: 600 })
      expect(viewport.zoom).toBe(1.0)
      expect(viewport.position).toEqual({ x: 800, y: 600 })
    })

    test("カスタム設定で初期化される", () => {
      const customViewport = new Viewport({
        ...defaultConfig,
        minZoom: 0.5,
        maxZoom: 10,
        initialZoom: 2,
        initialPosition: { x: 100, y: 200 },
      })

      expect(customViewport.config.minZoom).toBe(0.5)
      expect(customViewport.config.maxZoom).toBe(10)
      expect(customViewport.zoom).toBe(2)
      expect(customViewport.position).toEqual({ x: 100, y: 200 })
    })
  })

  describe("カメラ操作", () => {
    test("setPosition: カメラ位置を設定", () => {
      viewport.setPosition({ x: 500, y: 400 })
      expect(viewport.position).toEqual({ x: 500, y: 400 })
    })

    test("setPosition: 境界内に制限される", () => {
      // 左上の境界を超える
      viewport.setPosition({ x: 0, y: 0 })
      expect(viewport.position).toEqual({ x: 400, y: 300 })

      // 右下の境界を超える
      viewport.setPosition({ x: 2000, y: 2000 })
      expect(viewport.position).toEqual({ x: 1200, y: 900 })
    })

    test("move: カメラを相対移動", () => {
      viewport.setPosition({ x: 800, y: 600 })
      viewport.move({ x: 100, y: -50 })
      expect(viewport.position).toEqual({ x: 900, y: 550 })
    })

    test("setZoom: ズームレベルを設定", () => {
      viewport.setZoom(2.0)
      expect(viewport.zoom).toBe(2.0)

      // 最小値制限
      viewport.setZoom(0.05)
      expect(viewport.zoom).toBe(0.1)

      // 最大値制限
      viewport.setZoom(10)
      expect(viewport.zoom).toBe(5.0)
    })

    test("setZoom: 中心点を指定してズーム", () => {
      viewport.setPosition({ x: 800, y: 600 })

      // 画面左上を中心にズームイン
      viewport.setZoom(2.0, { x: 0, y: 0 })

      // ズーム前の左上のワールド座標は (400, 300)
      // ズーム後も同じ位置が左上に来るように調整される
      expect(viewport.position).toEqual({ x: 600, y: 450 })
    })

    test("zoomIn/zoomOut: ズーム操作", () => {
      viewport.zoomIn()
      expect(viewport.zoom).toBeCloseTo(1.25)

      viewport.zoomOut()
      expect(viewport.zoom).toBeCloseTo(1.0)

      viewport.zoomIn(2.0)
      expect(viewport.zoom).toBeCloseTo(2.0)
    })

    test("fitToWorld: 全体表示", () => {
      viewport.fitToWorld()

      // 画面サイズ800x600、ワールドサイズ1600x1200
      // 縦横比を保持して全体が見えるようにズーム
      expect(viewport.zoom).toBeCloseTo(0.475) // min(800/1600, 600/1200) * 0.95

      // ズーム0.475の時、可視範囲の半分は 800/2/0.475 = 842.1...
      // これはワールドの半分（800）より大きいため、位置は境界に制限される
      const halfVisibleWidth = 800 / 2 / 0.475
      const halfVisibleHeight = 600 / 2 / 0.475
      const clampedX = Math.max(halfVisibleWidth, Math.min(1600 - halfVisibleWidth, 800))
      const clampedY = Math.max(halfVisibleHeight, Math.min(1200 - halfVisibleHeight, 600))

      expect(viewport.position.x).toBeCloseTo(clampedX)
      expect(viewport.position.y).toBeCloseTo(clampedY)
    })
  })

  describe("ドラッグ操作", () => {
    test("ドラッグでカメラを移動", () => {
      const initialPosition = { x: 800, y: 600 }
      viewport.setPosition(initialPosition)

      // ドラッグ開始
      viewport.startDrag({ x: 100, y: 100 })
      expect(viewport.state.isDragging).toBe(true)

      // ドラッグ中（右下に50px移動）
      viewport.drag({ x: 150, y: 150 })

      // スクリーン座標での移動は逆方向にカメラが移動
      expect(viewport.position).toEqual({ x: 750, y: 550 })

      // ドラッグ終了
      viewport.endDrag()
      expect(viewport.state.isDragging).toBe(false)
    })

    test("ズーム時のドラッグ移動量調整", () => {
      viewport.setPosition({ x: 800, y: 600 })
      viewport.setZoom(2.0)

      viewport.startDrag({ x: 100, y: 100 })
      viewport.drag({ x: 200, y: 200 }) // 100px移動

      // ズーム2倍の時、ワールド座標での移動量は半分
      expect(viewport.position).toEqual({ x: 750, y: 550 })
    })

    test("ドラッグ中でない場合は無視", () => {
      const initialPosition = { x: 800, y: 600 }
      viewport.setPosition(initialPosition)

      viewport.drag({ x: 200, y: 200 })
      expect(viewport.position).toEqual(initialPosition)
    })
  })

  describe("座標変換", () => {
    test("screenToWorld: スクリーン座標からワールド座標へ", () => {
      viewport.setPosition({ x: 800, y: 600 })
      viewport.setZoom(1.0)

      // 画面中央
      const center = viewport.screenToWorld({ x: 400, y: 300 })
      expect(center).toEqual({ x: 800, y: 600 })

      // 画面左上
      const topLeft = viewport.screenToWorld({ x: 0, y: 0 })
      expect(topLeft).toEqual({ x: 400, y: 300 })
    })

    test("worldToScreen: ワールド座標からスクリーン座標へ", () => {
      viewport.setPosition({ x: 800, y: 600 })
      viewport.setZoom(1.0)

      // カメラ位置（ワールド中心）
      const center = viewport.worldToScreen({ x: 800, y: 600 })
      expect(center).toEqual({ x: 400, y: 300 })

      // ワールド左上
      const origin = viewport.worldToScreen({ x: 0, y: 0 })
      expect(origin).toEqual({ x: -400, y: -300 })
    })

    test("座標変換の相互変換", () => {
      viewport.setPosition({ x: 1000, y: 800 })
      viewport.setZoom(1.5)

      const screenPos = { x: 123, y: 456 }
      const worldPos = viewport.screenToWorld(screenPos)
      const backToScreen = viewport.worldToScreen(worldPos)

      expect(backToScreen.x).toBeCloseTo(screenPos.x)
      expect(backToScreen.y).toBeCloseTo(screenPos.y)
    })
  })

  describe("可視判定", () => {
    test("getVisibleBounds: 可視領域を取得", () => {
      viewport.setPosition({ x: 800, y: 600 })
      viewport.setZoom(1.0)

      const bounds = viewport.getVisibleBounds()
      expect(bounds).toEqual({
        left: 400,
        top: 300,
        right: 1200,
        bottom: 900,
      })
    })

    test("getVisibleBounds: ズーム時の可視領域", () => {
      viewport.setPosition({ x: 800, y: 600 })
      viewport.setZoom(2.0)

      const bounds = viewport.getVisibleBounds()
      expect(bounds).toEqual({
        left: 600,
        top: 450,
        right: 1000,
        bottom: 750,
      })
    })

    test("isVisible: オブジェクトの可視判定", () => {
      viewport.setPosition({ x: 800, y: 600 })
      viewport.setZoom(1.0)

      // 画面内
      expect(viewport.isVisible({ x: 800, y: 600 })).toBe(true)
      expect(viewport.isVisible({ x: 400, y: 300 })).toBe(true)
      expect(viewport.isVisible({ x: 1200, y: 900 })).toBe(true)

      // 画面外
      expect(viewport.isVisible({ x: 0, y: 0 })).toBe(false)
      expect(viewport.isVisible({ x: 1600, y: 1200 })).toBe(false)

      // 半径を考慮
      expect(viewport.isVisible({ x: 350, y: 300 }, 50)).toBe(true)
      expect(viewport.isVisible({ x: 350, y: 300 }, 49)).toBe(false)
    })
  })

  describe("コンテナ連携", () => {
    test("setContainer: コンテナの変換を更新", () => {
      const container = new MockContainer() as unknown as Container
      viewport.setContainer(container)

      viewport.setPosition({ x: 800, y: 600 })
      viewport.setZoom(2.0)

      // コンテナのスケールと位置が更新される
      expect(container.scale.x).toBe(2.0)
      expect(container.scale.y).toBe(2.0)
      expect(container.position.x).toBe(-1200) // screenWidth/2 - position.x * zoom = 400 - 800 * 2
      expect(container.position.y).toBe(-900) // screenHeight/2 - position.y * zoom = 300 - 600 * 2
    })

    test("操作時にコンテナが自動更新される", () => {
      const container = new MockContainer() as unknown as Container
      viewport.setContainer(container)

      // 位置変更
      viewport.setPosition({ x: 1000, y: 800 })
      expect(container.position.x).toBe(-600) // 400 - 1000 * 1
      expect(container.position.y).toBe(-500) // 300 - 800 * 1

      // ズーム変更
      viewport.setZoom(0.5)
      expect(container.scale.x).toBe(0.5)
      expect(container.scale.y).toBe(0.5)
    })
  })

  describe("境界ケース", () => {
    test("極小ワールドでの制限", () => {
      const tinyViewport = new Viewport({
        screenWidth: 800,
        screenHeight: 600,
        worldWidth: 400,
        worldHeight: 300,
      })

      // ワールドがスクリーンより小さい場合でも、カメラは中央に固定される
      tinyViewport.setPosition({ x: 0, y: 0 })
      expect(tinyViewport.position).toEqual({ x: 400, y: 300 })
    })

    test("ズームレベルによる位置制限の変化", () => {
      // ズームアウト時
      viewport.setZoom(0.5)
      viewport.setPosition({ x: 0, y: 0 })
      // より広い範囲が見えるため、カメラはより端に近づける
      expect(viewport.position).toEqual({ x: 800, y: 600 })

      // ズームイン時
      viewport.setZoom(2.0)
      viewport.setPosition({ x: 0, y: 0 })
      // 見える範囲が狭いため、カメラはより中央に制限される
      expect(viewport.position).toEqual({ x: 200, y: 150 })
    })
  })
})
