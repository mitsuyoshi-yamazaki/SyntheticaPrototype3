import { GameWorld } from "./GameWorld"
import type { WorldConfig } from "@/engine"
import type { ObjectId } from "@/types/game"

// PixiJSのモック
jest.mock("pixi.js", () => ({
  Graphics: jest.fn().mockImplementation(() => ({
    rect: jest.fn().mockReturnThis(),
    circle: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    x: 0,
    y: 0,
  })),
  Container: jest.fn().mockImplementation(() => ({
    removeChildren: jest.fn(),
    addChild: jest.fn(),
  })),
  Text: jest.fn().mockImplementation(() => ({
    x: 0,
    y: 0,
    text: "",
    style: {},
    anchor: { x: 0, y: 0 },
  })),
}))

// エンジンのモック
jest.mock("../engine", () => ({
  World: jest.fn().mockImplementation((config: WorldConfig) => ({
    state: {
      tick: 0,
      width: config.width,
      height: config.height,
      energySources: new Map(),
      objects: new Map(),
      forceFields: new Map(),
    },
    heatSystem: {
      heatGrid: [],
    },
    tick: jest.fn(),
    spawnRandomEnergy: jest.fn(),
    addForceField: jest.fn(),
  })),
}))

// heat-map-rendererのモック
jest.mock("./heat-map-renderer", () => ({
  HeatMapRenderer: jest.fn().mockImplementation(() => ({
    graphics: {
      clear: jest.fn(),
      beginFill: jest.fn(),
      drawRect: jest.fn(),
      endFill: jest.fn(),
    },
    visible: false,
    alpha: 0.7,
    update: jest.fn(),
    destroy: jest.fn(),
  })),
}))

// render-utilsのモック
jest.mock("./render-utils", () => ({
  drawEnergySource: jest.fn(),
  drawForceField: jest.fn(),
  drawObject: jest.fn(),
}))

describe("GameWorld", () => {
  const createTestConfig = (width: number, height: number): WorldConfig => ({
    width,
    height,
  })

  test("初期化時にtickCountが0である", () => {
    const world = new GameWorld(createTestConfig(800, 600))
    expect(world.tickCount).toBe(0)
  })

  test("幅と高さが正しく設定される", () => {
    const width = 800
    const height = 600
    const world = new GameWorld(createTestConfig(width, height))

    expect(world.width).toBe(width)
    expect(world.height).toBe(height)
  })

  test("spawnRandomEnergyが呼び出せる", () => {
    const world = new GameWorld(createTestConfig(800, 600))

    // エラーなく実行できることを確認
    expect(() => {
      world.spawnRandomEnergy(100)
    }).not.toThrow()
  })

  test("tickメソッドが呼び出せる", () => {
    const world = new GameWorld(createTestConfig(800, 600))

    // エラーなく実行できることを確認
    expect(() => {
      world.tick()
    }).not.toThrow()
  })

  test("熱マップの表示切り替えができる", () => {
    const world = new GameWorld(createTestConfig(800, 600))

    expect(world.isHeatMapVisible).toBe(false)
    world.toggleHeatMap()
    expect(world.isHeatMapVisible).toBe(true)
    world.toggleHeatMap()
    expect(world.isHeatMapVisible).toBe(false)
  })

  test("熱マップの表示状態を設定できる", () => {
    const world = new GameWorld(createTestConfig(800, 600))

    world.setHeatMapVisible(true)
    expect(world.isHeatMapVisible).toBe(true)
    world.setHeatMapVisible(false)
    expect(world.isHeatMapVisible).toBe(false)
  })

  test("力場を追加できる", () => {
    const world = new GameWorld(createTestConfig(800, 600))

    const field = {
      id: 1 as ObjectId,
      type: "SPIRAL" as const,
      position: { x: 400, y: 300 },
      radius: 100,
      strength: 20,
    }

    // エラーなく実行できることを確認
    expect(() => {
      world.addForceField(field)
    }).not.toThrow()
  })

  test("オブジェクト数を取得できる", () => {
    const world = new GameWorld(createTestConfig(800, 600))
    expect(world.getObjectCount()).toBe(0)
  })
})
