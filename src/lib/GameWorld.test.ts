import { GameWorld } from './GameWorld'

describe('GameWorld', () => {
  test('初期化時にtickCountが0である', () => {
    const world = new GameWorld(800, 600)
    expect(world.tickCount).toBe(0)
  })

  test('幅と高さが正しく設定される', () => {
    const width = 800
    const height = 600
    const world = new GameWorld(width, height)
    
    expect(world.width).toBe(width)
    expect(world.height).toBe(height)
  })

  test('tick()でtickCountが増加する', () => {
    const world = new GameWorld(800, 600)
    
    world.tick()
    expect(world.tickCount).toBe(1)
    
    world.tick()
    expect(world.tickCount).toBe(2)
  })
})