/**
 * ObjectFactory テスト
 */

import {
  ObjectFactory,
  calculateEnergyRadius,
  calculateUnitRadius,
  calculateHullRadius,
  calculateHullBuildEnergy,
  calculateAssemblerBuildEnergy,
  calculateComputerBuildEnergy,
} from "./object-factory"
import type {
  ObjectId,
  Hull,
  Assembler,
  Computer,
  HullSpec,
  AssemblerSpec,
  ComputerSpec,
} from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"
import { setGameLawParameters, TEST_PARAMETERS } from "@/config/game-law-parameters"

// テスト用パラメータを設定
beforeAll(() => {
  setGameLawParameters(TEST_PARAMETERS)
})

// テスト用のObjectId生成関数
const createTestObjectId = (value: string | number): ObjectId => {
  // テスト環境でのみ使用する変換関数
  return value as unknown as ObjectId
}

describe("ObjectFactory", () => {
  const worldWidth = 1000
  const worldHeight = 800
  let factory: ObjectFactory
  let idCounter = 0

  const generateId = (): ObjectId => {
    idCounter++
    return createTestObjectId(`test-id-${idCounter}`)
  }

  beforeEach(() => {
    factory = new ObjectFactory(worldWidth, worldHeight)
    idCounter = 0
  })

  describe("半径計算関数", () => {
    test("calculateEnergyRadius - エネルギー量から半径を計算", () => {
      // ENERGY_TO_AREA_RATIO = 0.05の場合
      // area = 100 * 0.05 = 5, radius = sqrt(5/π) ≈ 1.262
      expect(calculateEnergyRadius(100)).toBeCloseTo(1.262, 2)
      // area = 400 * 0.05 = 20, radius = sqrt(20/π) ≈ 2.523
      expect(calculateEnergyRadius(400)).toBeCloseTo(2.523, 2)
      expect(calculateEnergyRadius(0)).toBe(0)
    })

    test("calculateUnitRadius - ユニットの半径を計算", () => {
      // calculateEnergyRadiusと同じ計算式
      expect(calculateUnitRadius(100)).toBeCloseTo(1.262, 2)
      expect(calculateUnitRadius(400)).toBeCloseTo(2.523, 2)
    })

    test("calculateHullRadius - HULLの半径を計算", () => {
      const capacity = 500
      const buildEnergy = 100
      const radius = calculateHullRadius(capacity, buildEnergy)

      // 容量ベースの半径 + エネルギーベースの半径
      const volumeRadius = Math.sqrt(capacity / Math.PI)
      const energyRadius = calculateEnergyRadius(buildEnergy)
      expect(radius).toBeCloseTo(volumeRadius + energyRadius, 2)
    })
  })

  describe("構成エネルギー計算関数", () => {
    test("calculateHullBuildEnergy - HULLの構成エネルギーを計算", () => {
      expect(calculateHullBuildEnergy(100)).toBe(200)
      expect(calculateHullBuildEnergy(500)).toBe(1000)
      expect(calculateHullBuildEnergy(0)).toBe(0)
    })

    test("calculateAssemblerBuildEnergy - ASSEMBLERの構成エネルギーを計算", () => {
      // TEST_PARAMETERS: assemblerBaseEnergy: 800, assemblerEnergyPerPower: 200
      expect(calculateAssemblerBuildEnergy(1)).toBe(1000) // 800 + 1 * 200
      expect(calculateAssemblerBuildEnergy(5)).toBe(1800) // 800 + 5 * 200
      expect(calculateAssemblerBuildEnergy(10)).toBe(2800) // 800 + 10 * 200
    })

    test("calculateComputerBuildEnergy - COMPUTERの構成エネルギーを計算", () => {
      // 例1: 動作周波数10/tick、メモリ256バイト
      expect(calculateComputerBuildEnergy(10, 256)).toBe(13700)

      // 例2: 動作周波数1/tick、メモリ64バイト
      expect(calculateComputerBuildEnergy(1, 64)).toBe(3705)

      // 最小値: 動作周波数0、メモリ0
      expect(calculateComputerBuildEnergy(0, 0)).toBe(500)
    })
  })

  describe("createEnergyObject", () => {
    test("基本的なエネルギーオブジェクトを作成", () => {
      const id = generateId()
      const position = Vec2Utils.create(100, 200)
      const energy = 250

      const obj = factory.createEnergyObject(id, position, energy)

      expect(obj).toMatchObject({
        id,
        type: "ENERGY",
        position: { x: 100, y: 200 },
        velocity: { x: 0, y: 0 },
        radius: calculateEnergyRadius(energy),
        energy,
        mass: energy,
      })
    })

    test("速度を指定してエネルギーオブジェクトを作成", () => {
      const velocity = Vec2Utils.create(5, -3)
      const obj = factory.createEnergyObject(generateId(), Vec2Utils.create(0, 0), 100, velocity)

      expect(obj.velocity).toEqual({ x: 5, y: -3 })
    })

    test("世界境界を超える位置がラップされる", () => {
      const obj = factory.createEnergyObject(
        generateId(),
        Vec2Utils.create(worldWidth + 100, worldHeight + 50),
        100
      )

      expect(obj.position).toEqual({ x: 100, y: 50 })
    })

    test("負の位置がラップされる", () => {
      const obj = factory.createEnergyObject(generateId(), Vec2Utils.create(-100, -50), 100)

      expect(obj.position).toEqual({ x: worldWidth - 100, y: worldHeight - 50 })
    })
  })

  describe("createHull", () => {
    test("基本的なHULLを作成", () => {
      const id = generateId()
      const position = Vec2Utils.create(300, 400)
      const capacity = 500

      const hull = factory.createHull(id, position, capacity)
      const expectedBuildEnergy = calculateHullBuildEnergy(capacity)

      expect(hull).toMatchObject({
        id,
        type: "HULL",
        position: { x: 300, y: 400 },
        velocity: { x: 0, y: 0 },
        radius: calculateHullRadius(capacity, expectedBuildEnergy),
        energy: 0,
        mass: expectedBuildEnergy,
        buildEnergy: expectedBuildEnergy,
        currentEnergy: expectedBuildEnergy,
        capacity,
        storedEnergy: 0,
        attachedUnitIds: [],
      })
    })

    test("速度を指定してHULLを作成", () => {
      const velocity = Vec2Utils.create(2, 4)
      const hull = factory.createHull(generateId(), Vec2Utils.create(0, 0), 500, velocity)

      expect(hull.velocity).toEqual({ x: 2, y: 4 })
    })
  })

  describe("createAssembler", () => {
    test("基本的なASSEMBLERを作成", () => {
      const id = generateId()
      const position = Vec2Utils.create(150, 250)
      const assemblePower = 2

      const assembler = factory.createAssembler(id, position, assemblePower)
      const expectedBuildEnergy = calculateAssemblerBuildEnergy(assemblePower)

      expect(assembler).toMatchObject({
        id,
        type: "ASSEMBLER",
        position: { x: 150, y: 250 },
        velocity: { x: 0, y: 0 },
        radius: calculateUnitRadius(expectedBuildEnergy),
        energy: 0,
        mass: expectedBuildEnergy,
        buildEnergy: expectedBuildEnergy,
        currentEnergy: expectedBuildEnergy,
        assemblePower,
        isAssembling: false,
        progress: 0,
      })

      // parentHullが未定義の場合はプロパティが存在しない
      expect("parentHull" in assembler).toBe(false)
    })

    test("親HULLを指定してASSEMBLERを作成", () => {
      const parentHullId = generateId()
      const assembler = factory.createAssembler(
        generateId(),
        Vec2Utils.create(0, 0),
        1,
        parentHullId
      )

      expect(assembler.parentHullId).toBe(parentHullId)
    })
  })

  describe("createComputer", () => {
    test("基本的なCOMPUTERを作成", () => {
      const id = generateId()
      const position = Vec2Utils.create(500, 600)
      const processingPower = 10
      const memorySize = 1024

      const computer = factory.createComputer(id, position, processingPower, memorySize)
      const expectedBuildEnergy = calculateComputerBuildEnergy(processingPower, memorySize)

      expect(computer).toMatchObject({
        id,
        type: "COMPUTER",
        position: { x: 500, y: 600 },
        velocity: { x: 0, y: 0 },
        radius: calculateUnitRadius(expectedBuildEnergy),
        energy: 0,
        mass: expectedBuildEnergy,
        buildEnergy: expectedBuildEnergy,
        currentEnergy: expectedBuildEnergy,
        processingPower,
        memorySize,
      })

      expect(computer.vm.memorySize).toBe(memorySize)
      expect("parentHull" in computer).toBe(false)
    })

    test("プログラムを指定してCOMPUTERを作成", () => {
      const program = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])
      const computer = factory.createComputer(
        generateId(),
        Vec2Utils.create(0, 0),
        10,
        1024,
        undefined,
        Vec2Utils.create(0, 0),
        program
      )

      // プログラムがメモリにコピーされている
      expect(computer.vm.readMemory8(0)).toBe(0x01)
      expect(computer.vm.readMemory8(1)).toBe(0x02)
      expect(computer.vm.readMemory8(2)).toBe(0x03)
      expect(computer.vm.readMemory8(3)).toBe(0x04)
      expect(computer.vm.readMemory8(4)).toBe(0x05)
      expect(computer.vm.readMemory8(5)).toBe(0x00) // 残りは0
    })

    test("メモリサイズより大きいプログラムは切り詰められる", () => {
      const program = new Uint8Array(100).fill(0xff)
      const memorySize = 50
      const computer = factory.createComputer(
        generateId(),
        Vec2Utils.create(0, 0),
        10,
        memorySize,
        undefined,
        Vec2Utils.create(0, 0),
        program
      )

      expect(computer.vm.memorySize).toBe(memorySize)
      expect(computer.vm.readMemory8(memorySize - 1)).toBe(0xff)
    })
  })

  describe("createFromSpec", () => {
    test("HULL仕様からオブジェクトを作成", () => {
      const spec: HullSpec = {
        type: "HULL",
        capacity: 800,
      }

      const obj = factory.createFromSpec(generateId(), spec, Vec2Utils.create(100, 200))

      expect(obj.type).toBe("HULL")
      expect((obj as Hull).capacity).toBe(800)
      expect((obj as Hull).buildEnergy).toBe(calculateHullBuildEnergy(800))
      expect(obj.energy).toBe(0) // Units don't use energy
    })

    test("ASSEMBLER仕様からオブジェクトを作成", () => {
      const spec: AssemblerSpec = {
        type: "ASSEMBLER",
        assemblePower: 3,
      }

      const obj = factory.createFromSpec(
        generateId(),
        spec,
        Vec2Utils.create(100, 200),
        generateId()
      )

      expect(obj.type).toBe("ASSEMBLER")
      expect((obj as Assembler).assemblePower).toBe(3)
      expect((obj as Assembler).buildEnergy).toBe(calculateAssemblerBuildEnergy(3))
      expect(obj.energy).toBe(0) // Units don't use energy
    })

    test("COMPUTER仕様からオブジェクトを作成", () => {
      const spec: ComputerSpec = {
        type: "COMPUTER",
        processingPower: 20,
        memorySize: 2048,
      }

      const obj = factory.createFromSpec(generateId(), spec, Vec2Utils.create(100, 200))

      expect(obj.type).toBe("COMPUTER")
      expect((obj as Computer).processingPower).toBe(20)
      expect((obj as Computer).memorySize).toBe(2048)
      expect((obj as Computer).buildEnergy).toBe(calculateComputerBuildEnergy(20, 2048))
      expect(obj.energy).toBe(0) // Units don't use energy
    })

    // ENERGYはUnitSpecに含まれないため、このテストは削除

    test("未知のタイプはエラー", () => {
      const spec = {
        type: "UNKNOWN",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any

      expect(() => {
        factory.createFromSpec(generateId(), spec, Vec2Utils.create(0, 0))
      }).toThrow("Unknown object type: UNKNOWN")
    })

    // union typeにより、必須パラメータが明示的になったため、デフォルト値のテストは不要
  })

  describe("境界値テスト", () => {
    test("エネルギー0のオブジェクト", () => {
      const obj = factory.createEnergyObject(generateId(), Vec2Utils.create(0, 0), 0)
      expect(obj.radius).toBe(0)
      expect(obj.energy).toBe(0)
      expect(obj.mass).toBe(0)
    })

    test("非常に大きなエネルギー値", () => {
      const energy = 1000000
      const obj = factory.createEnergyObject(generateId(), Vec2Utils.create(0, 0), energy)
      // ENERGY_TO_AREA_RATIO = 0.05
      // area = 1000000 * 0.05 = 50000, radius = sqrt(50000/π) ≈ 126.16
      expect(obj.radius).toBeCloseTo(126.16, 1)
      expect(obj.energy).toBe(energy)
    })

    test("世界境界上の位置", () => {
      const obj1 = factory.createEnergyObject(
        generateId(),
        Vec2Utils.create(worldWidth, worldHeight),
        100
      )
      expect(obj1.position).toEqual({ x: 0, y: 0 })

      const obj2 = factory.createEnergyObject(
        generateId(),
        Vec2Utils.create(worldWidth - 1, worldHeight - 1),
        100
      )
      expect(obj2.position).toEqual({ x: worldWidth - 1, y: worldHeight - 1 })
    })
  })

  describe("速度の独立性", () => {
    test("速度オブジェクトが独立してコピーされる", () => {
      const originalVelocity = Vec2Utils.create(10, 20)
      const obj = factory.createEnergyObject(
        generateId(),
        Vec2Utils.create(0, 0),
        100,
        originalVelocity
      )

      // 元の速度を変更（これはテストのための意図的な変更）
      // TypeScriptの読み取り専用プロパティを回避するため、新しいオブジェクトを作成
      const mutableVelocity = { ...originalVelocity }
      mutableVelocity.x = 999

      // オブジェクトの速度は変更されない（元のvelocityオブジェクトとは独立）
      expect(obj.velocity.x).toBe(10)
      expect(obj.velocity).not.toBe(originalVelocity) // 参照が異なることを確認
    })
  })
})
