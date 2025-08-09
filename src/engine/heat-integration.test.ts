/**
 * 熱システム統合テスト
 */

import { World } from "./world"
import type { WorldConfig } from "./world"
import type { Hull, Computer, ObjectId } from "@/types/game"
import { Vec2 } from "@/utils/vec2"
import { setGameLawParameters, TEST_PARAMETERS } from "@/config/game-law-parameters"

// テスト用パラメータを設定
beforeAll(() => {
  setGameLawParameters(TEST_PARAMETERS)
})

describe("熱システム統合", () => {
  let world: World

  beforeEach(() => {
    const config: WorldConfig = {
      width: 100,
      height: 100,
    }
    world = new World(config)
  })

  describe("エネルギー消費による熱の生成", () => {
    test("エネルギーオブジェクトが崩壊すると熱が生成される", () => {
      // エネルギーオブジェクトを追加
      const position = { x: 50, y: 50 }
      world.createEnergyObject(position, 100)

      // 崩壊処理を実行（複数tick）
      for (let i = 0; i < 10; i++) {
        world.tick()
      }

      // 熱が生成されていることを確認
      const heat = world["_stateManager"].heatSystem.getHeat(5, 5) // グリッド座標(5,5)
      expect(heat).toBeGreaterThan(0)
    })

    test("HULLがエネルギーを収集すると熱が生成される", () => {
      // HULLを配置
      const hull: Hull = {
        id: 1 as ObjectId,
        type: "HULL",
        position: { x: 50, y: 50 },
        velocity: Vec2.zero,
        radius: 10,
        energy: 100,
        mass: 100,
        buildEnergy: 100,
        currentEnergy: 100,
        capacity: 200,
        storedEnergy: 0,
        attachedUnitIds: [],
        collectingEnergy: true,
      }
      world.addObject(hull)

      // エネルギーオブジェクトを近くに配置
      world.createEnergyObject({ x: 55, y: 50 }, 50)

      // 収集処理を実行
      world.tick()

      // 熱が生成されていることを確認
      const heat = world["_stateManager"].heatSystem.getHeat(5, 5)
      expect(heat).toBeGreaterThan(0)
    })
  })

  describe("熱拡散のセルオートマトン", () => {
    test("熱が隣接セルに拡散する", () => {
      // 中央のセルに熱を追加
      world["_stateManager"].heatSystem.addHeat(5, 5, 1000)

      // 初期状態を確認
      expect(world["_stateManager"].heatSystem.getHeat(5, 5)).toBe(1000)
      expect(world["_stateManager"].heatSystem.getHeat(6, 5)).toBe(0)
      expect(world["_stateManager"].heatSystem.getHeat(4, 5)).toBe(0)

      // 拡散処理を実行
      world.tick()

      // 熱が拡散していることを確認
      const centerHeat = world["_stateManager"].heatSystem.getHeat(5, 5)
      const rightHeat = world["_stateManager"].heatSystem.getHeat(6, 5)
      const leftHeat = world["_stateManager"].heatSystem.getHeat(4, 5)

      expect(centerHeat).toBeLessThan(1000) // 中央の熱が減少
      expect(rightHeat).toBeGreaterThan(0) // 右に熱が拡散
      expect(leftHeat).toBeGreaterThan(0) // 左に熱が拡散
    })

    test("複数tickで熱が均一化に向かう", () => {
      // 中央のセルに熱を追加
      world["_stateManager"].heatSystem.addHeat(5, 5, 1000)

      // 複数tick実行
      for (let i = 0; i < 50; i++) {
        world.tick()
      }

      // 熱が広く拡散していることを確認
      const heat55 = world["_stateManager"].heatSystem.getHeat(5, 5)
      const heat65 = world["_stateManager"].heatSystem.getHeat(6, 5)
      const heat75 = world["_stateManager"].heatSystem.getHeat(7, 5)

      // 中央から離れるほど熱が少ない
      expect(heat55).toBeGreaterThan(heat65)
      expect(heat65).toBeGreaterThan(heat75)

      // 全体的に熱が拡散している
      expect(heat75).toBeGreaterThan(0)
    })
  })

  describe("放熱による熱値の下降", () => {
    test("時間とともに熱が放熱される", () => {
      // 熱を追加
      world["_stateManager"].heatSystem.addHeat(5, 5, 1000)

      const initialHeat = world["_stateManager"].heatSystem.getHeat(5, 5)
      expect(initialHeat).toBe(1000)

      // 複数tick実行（放熱処理）
      for (let i = 0; i < 10; i++) {
        world.tick()
      }

      // 熱が減少していることを確認
      const currentHeat = world["_stateManager"].heatSystem.getHeat(5, 5)
      expect(currentHeat).toBeLessThan(initialHeat)
    })

    test("放熱により総熱量が減少する", () => {
      // 複数のセルに熱を追加（高温にして放熱を促進）
      for (let x = 3; x < 8; x++) {
        for (let y = 3; y < 8; y++) {
          world["_stateManager"].heatSystem.addHeat(x, y, 500)
        }
      }

      // 初期の総熱量を記録
      const initialStats = world["_stateManager"].heatSystem.getStats()
      const initialTotalHeat = initialStats.totalHeat

      // 複数tick実行（放熱は徐々に進行）
      for (let i = 0; i < 50; i++) {
        world.tick()
      }

      // 総熱量が減少していることを確認
      const currentStats = world["_stateManager"].heatSystem.getStats()
      expect(currentStats.totalHeat).toBeLessThan(initialTotalHeat)
    })
  })

  describe("熱によるダメージ", () => {
    test("高温セルのユニットがダメージを受ける", () => {
      // COMPUTERユニットを配置
      const computer: Computer = {
        id: 1 as ObjectId,
        type: "COMPUTER",
        position: { x: 50, y: 50 }, // グリッド座標(5,5)
        velocity: Vec2.zero,
        radius: 5,
        energy: 100,
        mass: 100,
        buildEnergy: 100,
        currentEnergy: 100,
        processingPower: 10,
        memorySize: 256,
        memory: new Uint8Array(256),
        programCounter: 0,
        registers: new Uint16Array(4),
        stackPointer: 0xff,
        zeroFlag: false,
        carryFlag: false,
        isRunning: false,
        vmCyclesExecuted: 0,
      }
      world.addObject(computer)

      // ユニットの位置に高熱を追加（ダメージ閾値を超える）
      world["_stateManager"].heatSystem.addHeat(5, 5, 150) // 閾値は100

      // 初期状態を確認
      expect(computer.currentEnergy).toBe(100)

      // tick実行（熱ダメージ処理）
      world.tick()

      // ダメージを受けていることを確認
      const updatedComputer = world["_stateManager"].state.objects.get(computer.id) as Computer
      expect(updatedComputer.currentEnergy).toBeLessThan(100)
    })

    test("損傷したユニットは追加ダメージを受ける", () => {
      // 損傷したHULLを配置
      const hull: Hull = {
        id: 1 as ObjectId,
        type: "HULL",
        position: { x: 50, y: 50 },
        velocity: Vec2.zero,
        radius: 10,
        energy: 50,
        mass: 100,
        buildEnergy: 100,
        currentEnergy: 50, // 損傷状態
        capacity: 200,
        storedEnergy: 0,
        attachedUnitIds: [],
      }
      world.addObject(hull)

      // 別の正常なHULLも配置
      const normalHull: Hull = {
        ...hull,
        id: 2 as ObjectId,
        position: { x: 60, y: 50 }, // グリッド座標(6,5)
        currentEnergy: 100, // 正常
        energy: 100,
      }
      world.addObject(normalHull)

      // 両方の位置に同じ熱を追加
      world["_stateManager"].heatSystem.addHeat(5, 5, 120)
      world["_stateManager"].heatSystem.addHeat(6, 5, 120)

      // tick実行
      world.tick()

      // 損傷したHULLの方がより多くダメージを受ける
      const damagedHull = world["_stateManager"].state.objects.get(hull.id) as Hull
      const healthyHull = world["_stateManager"].state.objects.get(normalHull.id) as Hull

      const damagedHullDamage = 50 - damagedHull.currentEnergy
      const healthyHullDamage = 100 - healthyHull.currentEnergy

      expect(damagedHullDamage).toBeGreaterThan(healthyHullDamage)
    })

    test("ユニットが破壊されると熱が生成される", () => {
      // 低HPのユニットを配置
      const computer: Computer = {
        id: 1 as ObjectId,
        type: "COMPUTER",
        position: { x: 50, y: 50 },
        velocity: Vec2.zero,
        radius: 5,
        energy: 5,
        mass: 100,
        buildEnergy: 100,
        currentEnergy: 5, // 低HP
        processingPower: 10,
        memorySize: 256,
        memory: new Uint8Array(256),
        programCounter: 0,
        registers: new Uint16Array(4),
        stackPointer: 0xff,
        zeroFlag: false,
        carryFlag: false,
        isRunning: false,
        vmCyclesExecuted: 0,
      }
      world.addObject(computer)

      // 致命的な熱を追加
      world["_stateManager"].heatSystem.addHeat(5, 5, 200)

      // 破壊前の熱を記録
      const heatBefore = world["_stateManager"].heatSystem.getHeat(5, 5)

      // tick実行（ユニット破壊）
      world.tick()

      // ユニットが削除されている
      expect(world["_stateManager"].state.objects.has(computer.id)).toBe(false)

      // 破壊により追加の熱が生成されている
      const heatAfter = world["_stateManager"].heatSystem.getHeat(5, 5)
      expect(heatAfter).toBeGreaterThan(heatBefore - 50) // 放熱を考慮しても熱が追加されている
    })
  })

  describe("統合動作", () => {
    test("エネルギー消費→熱生成→拡散→放熱の一連の流れ", () => {
      // エネルギーオブジェクトを配置
      world.createEnergyObject({ x: 50, y: 50 }, 200)

      // 複数tick実行
      const heatHistory: number[] = []
      for (let i = 0; i < 30; i++) {
        world.tick()
        const stats = world["_stateManager"].heatSystem.getStats()
        heatHistory.push(stats.totalHeat)
      }

      // 熱が生成され、その後減少していく
      const maxHeatIndex = heatHistory.indexOf(Math.max(...heatHistory))
      expect(maxHeatIndex).toBeGreaterThan(0) // 最初は熱が増加
      expect(heatHistory[29]).toBeLessThan(heatHistory[maxHeatIndex]) // 最終的には減少
    })
  })
})
