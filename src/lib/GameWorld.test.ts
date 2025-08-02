import { GameWorld } from "./GameWorld"

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
}))

// エンジンのモック
jest.mock("../engine", () => ({
  World: jest.fn().mockImplementation((config) => ({
    state: {
      tick: 0,
      width: config.width,
      height: config.height,
      energySources: new Map(),
      objects: new Map(),
    },
    start: jest.fn(),
    spawnRandomEnergy: jest.fn(),
  })),
}))

describe("GameWorld", () => {
  test("初期化時にtickCountが0である", () => {
    const world = new GameWorld(800, 600)
    expect(world.tickCount).toBe(0)
  })

  test("幅と高さが正しく設定される", () => {
    const width = 800
    const height = 600
    const world = new GameWorld(width, height)

    expect(world.width).toBe(width)
    expect(world.height).toBe(height)
  })

  test("tick()は互換性のため存在するが何もしない", () => {
    const world = new GameWorld(800, 600)
    const initialTick = world.tickCount

    world.tick()
    expect(world.tickCount).toBe(initialTick)
  })

  test("spawnRandomEnergyが呼び出せる", () => {
    const world = new GameWorld(800, 600)
    
    // エラーなく実行できることを確認
    expect(() => {
      world.spawnRandomEnergy(100)
    }).not.toThrow()
  })
})