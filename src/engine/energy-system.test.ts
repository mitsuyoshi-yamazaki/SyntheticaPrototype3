/**
 * エネルギーシステムのテスト
 */

import { EnergySystem, DEFAULT_ENERGY_PARAMETERS } from "./energy-system"
import type { EnergySystemParameters } from "./energy-system"
import type { ObjectId, EnergyObject } from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

// テスト用のObjectId生成関数
const createTestObjectId = (value: string | number): ObjectId => {
  return value as unknown as ObjectId
}

describe("EnergySystem", () => {
  let energySystem: EnergySystem
  const worldWidth = 1000
  const worldHeight = 1000

  beforeEach(() => {
    energySystem = new EnergySystem(worldWidth, worldHeight)
  })

  describe("エネルギーオブジェクトの生成", () => {
    test("正常なエネルギーオブジェクトを生成", () => {
      const id = createTestObjectId(1)
      const position = Vec2Utils.create(100, 200)
      const amount = 1000

      const energyObj = energySystem.createEnergyObject(id, position, amount)

      expect(energyObj.id).toBe(id)
      expect(energyObj.type).toBe("ENERGY")
      expect(energyObj.position).toEqual(position)
      expect(energyObj.energy).toBe(1000)
      expect(energyObj.mass).toBe(1000)
      expect(energyObj.radius).toBeGreaterThan(0)
    })

    test("最小値以下のエネルギーは最小値にクランプ", () => {
      const id = createTestObjectId(1)
      const position = Vec2Utils.create(0, 0)

      const energyObj = energySystem.createEnergyObject(id, position, 0)

      expect(energyObj.energy).toBe(DEFAULT_ENERGY_PARAMETERS.minEnergyAmount)
    })

    test("最大値以上のエネルギーは最大値にクランプ", () => {
      const id = createTestObjectId(1)
      const position = Vec2Utils.create(0, 0)
      const maxEnergy = DEFAULT_ENERGY_PARAMETERS.maxEnergyAmount

      const energyObj = energySystem.createEnergyObject(id, position, maxEnergy + 1000)

      expect(energyObj.energy).toBe(maxEnergy)
    })

    test("小数のエネルギーは整数に切り捨て", () => {
      const id = createTestObjectId(1)
      const position = Vec2Utils.create(0, 0)

      const energyObj = energySystem.createEnergyObject(id, position, 123.456)

      expect(energyObj.energy).toBe(123)
    })
  })

  describe("エネルギーオブジェクトの結合", () => {
    test("2つのオブジェクトを結合", () => {
      const obj1: EnergyObject = {
        id: createTestObjectId(1),
        type: "ENERGY",
        position: Vec2Utils.create(100, 100),
        velocity: Vec2Utils.create(0, 0),
        radius: 10,
        energy: 500,
        mass: 500,
      }
      const obj2: EnergyObject = {
        id: createTestObjectId(2),
        type: "ENERGY",
        position: Vec2Utils.create(200, 100),
        velocity: Vec2Utils.create(0, 0),
        radius: 10,
        energy: 300,
        mass: 300,
      }

      const result = energySystem.combineEnergyObjects([obj1, obj2], createTestObjectId(3))

      expect(result.combined.energy).toBe(800)
      expect(result.combined.mass).toBe(800)
      expect(result.removedIds).toEqual([obj1.id, obj2.id])

      // 質量中心の確認
      const expectedX = (100 * 500 + 200 * 300) / 800
      expect(result.combined.position.x).toBeCloseTo(expectedX, 5)
      expect(result.combined.position.y).toBeCloseTo(100, 5)
    })

    test("複数のオブジェクトを結合", () => {
      const objects: EnergyObject[] = []
      for (let i = 0; i < 5; i++) {
        objects.push({
          id: createTestObjectId(i),
          type: "ENERGY",
          position: Vec2Utils.create(i * 100, 0),
          velocity: Vec2Utils.create(0, 0),
          radius: 10,
          energy: 100,
          mass: 100,
        })
      }

      const result = energySystem.combineEnergyObjects(objects, createTestObjectId(10))

      expect(result.combined.energy).toBe(500)
      expect(result.removedIds).toHaveLength(5)
    })

    test("最大エネルギーを超える結合", () => {
      const maxEnergy = DEFAULT_ENERGY_PARAMETERS.maxEnergyAmount
      const halfMax = Math.floor(maxEnergy / 2) + 1000

      const obj1: EnergyObject = {
        id: createTestObjectId(1),
        type: "ENERGY",
        position: Vec2Utils.create(0, 0),
        velocity: Vec2Utils.create(0, 0),
        radius: 10,
        energy: halfMax,
        mass: halfMax,
      }
      const obj2: EnergyObject = {
        id: createTestObjectId(2),
        type: "ENERGY",
        position: Vec2Utils.create(0, 0),
        velocity: Vec2Utils.create(0, 0),
        radius: 10,
        energy: halfMax,
        mass: halfMax,
      }

      const result = energySystem.combineEnergyObjects([obj1, obj2], createTestObjectId(3))

      expect(result.combined.energy).toBe(maxEnergy)
    })

    test("1つのオブジェクトでは結合できない", () => {
      const obj: EnergyObject = {
        id: createTestObjectId(1),
        type: "ENERGY",
        position: Vec2Utils.create(0, 0),
        velocity: Vec2Utils.create(0, 0),
        radius: 10,
        energy: 100,
        mass: 100,
      }

      expect(() => {
        energySystem.combineEnergyObjects([obj], createTestObjectId(2))
      }).toThrow("結合には2つ以上のオブジェクトが必要です")
    })
  })

  describe("結合候補の検出", () => {
    test("近接する2つのオブジェクトが結合候補になる", () => {
      const energyObjects = new Map<ObjectId, EnergyObject>()

      const obj1: EnergyObject = {
        id: createTestObjectId(1),
        type: "ENERGY",
        position: Vec2Utils.create(100, 100),
        velocity: Vec2Utils.create(0, 0),
        radius: 2,
        energy: 100,
        mass: 100,
      }
      const obj2: EnergyObject = {
        id: createTestObjectId(2),
        type: "ENERGY",
        position: Vec2Utils.create(103, 100), // 3単位離れている
        velocity: Vec2Utils.create(0, 0),
        radius: 2,
        energy: 100,
        mass: 100,
      }

      energyObjects.set(obj1.id, obj1)
      energyObjects.set(obj2.id, obj2)

      const candidates = energySystem.findCombineCandidates(energyObjects)

      expect(candidates).toHaveLength(1)
      expect(candidates[0]).toHaveLength(2)
      expect(candidates[0]).toContain(obj1)
      expect(candidates[0]).toContain(obj2)
    })

    test("離れたオブジェクトは結合候補にならない", () => {
      const energyObjects = new Map<ObjectId, EnergyObject>()

      const obj1: EnergyObject = {
        id: createTestObjectId(1),
        type: "ENERGY",
        position: Vec2Utils.create(100, 100),
        velocity: Vec2Utils.create(0, 0),
        radius: 2,
        energy: 100,
        mass: 100,
      }
      const obj2: EnergyObject = {
        id: createTestObjectId(2),
        type: "ENERGY",
        position: Vec2Utils.create(110, 100), // 10単位離れている
        velocity: Vec2Utils.create(0, 0),
        radius: 2,
        energy: 100,
        mass: 100,
      }

      energyObjects.set(obj1.id, obj1)
      energyObjects.set(obj2.id, obj2)

      const candidates = energySystem.findCombineCandidates(energyObjects)

      expect(candidates).toHaveLength(0)
    })

    test("複数のグループが検出される", () => {
      const energyObjects = new Map<ObjectId, EnergyObject>()

      // グループ1
      for (let i = 0; i < 3; i++) {
        const obj: EnergyObject = {
          id: createTestObjectId(i),
          type: "ENERGY",
          position: Vec2Utils.create(100 + i * 3, 100),
          velocity: Vec2Utils.create(0, 0),
          radius: 2,
          energy: 100,
          mass: 100,
        }
        energyObjects.set(obj.id, obj)
      }

      // グループ2（離れた位置）
      for (let i = 3; i < 5; i++) {
        const obj: EnergyObject = {
          id: createTestObjectId(i),
          type: "ENERGY",
          position: Vec2Utils.create(200 + (i - 3) * 3, 200),
          velocity: Vec2Utils.create(0, 0),
          radius: 2,
          energy: 100,
          mass: 100,
        }
        energyObjects.set(obj.id, obj)
      }

      const candidates = energySystem.findCombineCandidates(energyObjects)

      expect(candidates).toHaveLength(2)
      expect(candidates[0]).toHaveLength(3)
      expect(candidates[1]).toHaveLength(2)
    })

    test("最大結合数の制限", () => {
      const params: EnergySystemParameters = {
        ...DEFAULT_ENERGY_PARAMETERS,
        maxCombinePerTick: 3,
      }
      energySystem = new EnergySystem(worldWidth, worldHeight, params)

      const energyObjects = new Map<ObjectId, EnergyObject>()

      // 5つの近接したオブジェクト
      for (let i = 0; i < 5; i++) {
        const obj: EnergyObject = {
          id: createTestObjectId(i),
          type: "ENERGY",
          position: Vec2Utils.create(100 + i * 2, 100),
          velocity: Vec2Utils.create(0, 0),
          radius: 2,
          energy: 100,
          mass: 100,
        }
        energyObjects.set(obj.id, obj)
      }

      const candidates = energySystem.findCombineCandidates(energyObjects)

      // 複数のグループに分かれる可能性がある
      const totalInCandidates = candidates.reduce((sum, group) => sum + group.length, 0)
      expect(totalInCandidates).toBe(5) // 全オブジェクトが候補に含まれる

      // 各グループは最大3つまで
      for (const group of candidates) {
        expect(group.length).toBeLessThanOrEqual(3)
      }
    })
  })

  describe("エネルギーオブジェクトの分割", () => {
    test("等分割", () => {
      const original: EnergyObject = {
        id: createTestObjectId(1),
        type: "ENERGY",
        position: Vec2Utils.create(500, 500),
        velocity: Vec2Utils.create(0, 0),
        radius: 20,
        energy: 1000,
        mass: 1000,
      }

      let nextId = 2
      const idGenerator = () => createTestObjectId(nextId++)

      const result = energySystem.splitEnergyObject(original, [250, 250, 250, 250], idGenerator)

      expect(result).toHaveLength(4)
      expect(result.every(obj => obj.energy === 250)).toBe(true)

      // 円周上に配置されることを確認
      const angles = result
        .map(obj => Math.atan2(obj.position.y - 500, obj.position.x - 500))
        .sort((a, b) => a - b)

      // 角度がほぼ均等に分布していることを確認
      for (let i = 0; i < angles.length; i++) {
        const nextIndex = (i + 1) % angles.length
        let diff = angles[nextIndex]! - angles[i]!
        if (diff < 0) {
          diff += 2 * Math.PI // 最後から最初への差分
        }
        const expectedDiff = (2 * Math.PI) / 4 // 90度
        expect(Math.abs(diff - expectedDiff)).toBeLessThan(0.1)
      }
    })

    test("不均等分割", () => {
      const original: EnergyObject = {
        id: createTestObjectId(1),
        type: "ENERGY",
        position: Vec2Utils.create(0, 0),
        velocity: Vec2Utils.create(0, 0),
        radius: 20,
        energy: 1000,
        mass: 1000,
      }

      let nextId = 2
      const idGenerator = () => createTestObjectId(nextId++)

      const result = energySystem.splitEnergyObject(original, [100, 200, 300], idGenerator)

      expect(result).toHaveLength(3)
      expect(result[0]!.energy).toBe(100)
      expect(result[1]!.energy).toBe(200)
      expect(result[2]!.energy).toBe(300)
    })

    test("分割後の合計が元のエネルギーを超える場合はエラー", () => {
      const original: EnergyObject = {
        id: createTestObjectId(1),
        type: "ENERGY",
        position: Vec2Utils.create(0, 0),
        velocity: Vec2Utils.create(0, 0),
        radius: 20,
        energy: 1000,
        mass: 1000,
      }

      expect(() => {
        energySystem.splitEnergyObject(original, [600, 600], () => createTestObjectId(2))
      }).toThrow("分割後の合計エネルギーが元のエネルギーを超えています")
    })

    test("0以下の分割量は無視される", () => {
      const original: EnergyObject = {
        id: createTestObjectId(1),
        type: "ENERGY",
        position: Vec2Utils.create(0, 0),
        velocity: Vec2Utils.create(0, 0),
        radius: 20,
        energy: 500,
        mass: 500,
      }

      let nextId = 2
      const idGenerator = () => createTestObjectId(nextId++)

      const result = energySystem.splitEnergyObject(original, [200, 0, -100, 300], idGenerator)

      expect(result).toHaveLength(2)
      expect(result[0]!.energy).toBe(200)
      expect(result[1]!.energy).toBe(300)
    })
  })

  describe("エネルギーフォーマット", () => {
    test("1024未満のエネルギー", () => {
      expect(EnergySystem.formatEnergy(0)).toBe("0E")
      expect(EnergySystem.formatEnergy(100)).toBe("100E")
      expect(EnergySystem.formatEnergy(1023)).toBe("1023E")
    })

    test("1024以上のエネルギー", () => {
      expect(EnergySystem.formatEnergy(1024)).toBe("[1]k[0]E")
      expect(EnergySystem.formatEnergy(2048)).toBe("[2]k[0]E")
      expect(EnergySystem.formatEnergy(1024 + 100)).toBe("[1]k[100]E")
      expect(EnergySystem.formatEnergy(164400)).toBe("[160]k[560]E")
    })

    test("16進表記", () => {
      expect(EnergySystem.toHexNotation(0)).toBe("[0x0000][0x0000]")
      expect(EnergySystem.toHexNotation(1)).toBe("[0x0000][0x0001]")
      expect(EnergySystem.toHexNotation(1024)).toBe("[0x0001][0x0000]")
      expect(EnergySystem.toHexNotation(164400)).toBe("[0x00A0][0x0230]")
      expect(EnergySystem.toHexNotation(67108863)).toBe("[0xFFFF][0x03FF]")
    })
  })

  describe("エッジケース", () => {
    test("空のマップで結合候補検出", () => {
      const energyObjects = new Map<ObjectId, EnergyObject>()
      const candidates = energySystem.findCombineCandidates(energyObjects)

      expect(candidates).toHaveLength(0)
    })

    test("1つのオブジェクトのみで結合候補検出", () => {
      const energyObjects = new Map<ObjectId, EnergyObject>()
      const obj: EnergyObject = {
        id: createTestObjectId(1),
        type: "ENERGY",
        position: Vec2Utils.create(0, 0),
        velocity: Vec2Utils.create(0, 0),
        radius: 10,
        energy: 100,
        mass: 100,
      }
      energyObjects.set(obj.id, obj)

      const candidates = energySystem.findCombineCandidates(energyObjects)

      expect(candidates).toHaveLength(0)
    })
  })
})
