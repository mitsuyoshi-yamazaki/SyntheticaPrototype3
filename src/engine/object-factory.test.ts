/**
 * ObjectFactory テスト
 */

import { ObjectFactory, calculateEnergyRadius, calculateUnitRadius, calculateHullRadius } from "./object-factory"
import type { ObjectId, AgentDefinition, UnitSpec, Hull, Assembler, Computer } from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

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
      expect(calculateEnergyRadius(100)).toBeCloseTo(5.642, 2)
      expect(calculateEnergyRadius(400)).toBeCloseTo(11.284, 2)
      expect(calculateEnergyRadius(0)).toBe(0)
    })

    test("calculateUnitRadius - ユニットの半径を計算", () => {
      // calculateEnergyRadiusと同じ計算式
      expect(calculateUnitRadius(100)).toBeCloseTo(5.642, 2)
      expect(calculateUnitRadius(400)).toBeCloseTo(11.284, 2)
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
      const obj = factory.createEnergyObject(
        generateId(),
        Vec2Utils.create(0, 0),
        100,
        velocity
      )
      
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
      const obj = factory.createEnergyObject(
        generateId(),
        Vec2Utils.create(-100, -50),
        100
      )
      
      expect(obj.position).toEqual({ x: worldWidth - 100, y: worldHeight - 50 })
    })
  })

  describe("createHull", () => {
    test("基本的なHULLを作成", () => {
      const id = generateId()
      const position = Vec2Utils.create(300, 400)
      const buildEnergy = 1000
      const capacity = 500
      
      const hull = factory.createHull(id, position, buildEnergy, capacity)
      
      expect(hull).toMatchObject({
        id,
        type: "HULL",
        position: { x: 300, y: 400 },
        velocity: { x: 0, y: 0 },
        radius: calculateHullRadius(capacity, buildEnergy),
        energy: buildEnergy,
        mass: buildEnergy,
        buildEnergy,
        currentEnergy: buildEnergy,
        capacity,
        storedEnergy: 0,
        attachedUnits: [],
      })
    })

    test("速度を指定してHULLを作成", () => {
      const velocity = Vec2Utils.create(2, 4)
      const hull = factory.createHull(
        generateId(),
        Vec2Utils.create(0, 0),
        1000,
        500,
        velocity
      )
      
      expect(hull.velocity).toEqual({ x: 2, y: 4 })
    })
  })

  describe("createAssembler", () => {
    test("基本的なASSEMBLERを作成", () => {
      const id = generateId()
      const position = Vec2Utils.create(150, 250)
      const buildEnergy = 800
      const assemblePower = 2
      
      const assembler = factory.createAssembler(id, position, buildEnergy, assemblePower)
      
      expect(assembler).toMatchObject({
        id,
        type: "ASSEMBLER",
        position: { x: 150, y: 250 },
        velocity: { x: 0, y: 0 },
        radius: calculateUnitRadius(buildEnergy),
        energy: buildEnergy,
        mass: buildEnergy,
        buildEnergy,
        currentEnergy: buildEnergy,
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
        800,
        1,
        parentHullId
      )
      
      expect(assembler.parentHull).toBe(parentHullId)
    })
  })

  describe("createComputer", () => {
    test("基本的なCOMPUTERを作成", () => {
      const id = generateId()
      const position = Vec2Utils.create(500, 600)
      const buildEnergy = 600
      const processingPower = 10
      const memorySize = 1024
      
      const computer = factory.createComputer(
        id,
        position,
        buildEnergy,
        processingPower,
        memorySize
      )
      
      expect(computer).toMatchObject({
        id,
        type: "COMPUTER",
        position: { x: 500, y: 600 },
        velocity: { x: 0, y: 0 },
        radius: calculateUnitRadius(buildEnergy),
        energy: buildEnergy,
        mass: buildEnergy,
        buildEnergy,
        currentEnergy: buildEnergy,
        processingPower,
        memorySize,
        programCounter: 0,
      })
      
      expect(computer.memory.length).toBe(memorySize)
      expect(computer.registers.length).toBe(8)
      expect("parentHull" in computer).toBe(false)
    })

    test("プログラムを指定してCOMPUTERを作成", () => {
      const program = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])
      const computer = factory.createComputer(
        generateId(),
        Vec2Utils.create(0, 0),
        600,
        10,
        1024,
        undefined,
        Vec2Utils.create(0, 0),
        program
      )
      
      // プログラムがメモリにコピーされている
      expect(computer.memory[0]).toBe(0x01)
      expect(computer.memory[1]).toBe(0x02)
      expect(computer.memory[2]).toBe(0x03)
      expect(computer.memory[3]).toBe(0x04)
      expect(computer.memory[4]).toBe(0x05)
      expect(computer.memory[5]).toBe(0x00) // 残りは0
    })

    test("メモリサイズより大きいプログラムは切り詰められる", () => {
      const program = new Uint8Array(100).fill(0xff)
      const memorySize = 50
      const computer = factory.createComputer(
        generateId(),
        Vec2Utils.create(0, 0),
        600,
        10,
        memorySize,
        undefined,
        Vec2Utils.create(0, 0),
        program
      )
      
      expect(computer.memory.length).toBe(memorySize)
      expect(computer.memory[memorySize - 1]).toBe(0xff)
    })
  })

  describe("createFromSpec", () => {
    test("HULL仕様からオブジェクトを作成", () => {
      const spec: UnitSpec = {
        type: "HULL",
        buildEnergy: 1000,
        capacity: 800,
      }
      
      const obj = factory.createFromSpec(generateId(), spec, Vec2Utils.create(100, 200))
      
      expect(obj.type).toBe("HULL")
      expect((obj as Hull).capacity).toBe(800)
    })

    test("ASSEMBLER仕様からオブジェクトを作成", () => {
      const spec: UnitSpec = {
        type: "ASSEMBLER",
        buildEnergy: 800,
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
    })

    test("COMPUTER仕様からオブジェクトを作成", () => {
      const spec: UnitSpec = {
        type: "COMPUTER",
        buildEnergy: 600,
        processingPower: 20,
        memorySize: 2048,
      }
      
      const obj = factory.createFromSpec(generateId(), spec, Vec2Utils.create(100, 200))
      
      expect(obj.type).toBe("COMPUTER")
      expect((obj as Computer).processingPower).toBe(20)
      expect((obj as Computer).memorySize).toBe(2048)
    })

    test("ENERGY仕様からオブジェクトを作成", () => {
      const spec: UnitSpec = {
        type: "ENERGY",
        buildEnergy: 250,
      }
      
      const obj = factory.createFromSpec(generateId(), spec, Vec2Utils.create(100, 200))
      
      expect(obj.type).toBe("ENERGY")
      expect(obj.energy).toBe(250)
    })

    test("未知のタイプはエラー", () => {
      const spec = {
        type: "UNKNOWN",
        buildEnergy: 100,
      } as unknown as UnitSpec
      
      expect(() => {
        factory.createFromSpec(generateId(), spec, Vec2Utils.create(0, 0))
      }).toThrow("Unknown object type: UNKNOWN")
    })

    test("デフォルト値が適用される", () => {
      const hullSpec: UnitSpec = {
        type: "HULL",
        buildEnergy: 1000,
        // capacityは省略
      }
      
      const hull = factory.createFromSpec(generateId(), hullSpec, Vec2Utils.create(0, 0))
      expect((hull as Hull).capacity).toBe(100) // デフォルト値
      
      const assemblerSpec: UnitSpec = {
        type: "ASSEMBLER",
        buildEnergy: 800,
        // assemblePowerは省略
      }
      
      const assembler = factory.createFromSpec(
        generateId(),
        assemblerSpec,
        Vec2Utils.create(0, 0)
      )
      expect((assembler as Assembler).assemblePower).toBe(1) // デフォルト値
    })
  })

  describe("createAgent", () => {
    test("エージェント定義からオブジェクト群を作成", () => {
      const agentDef: AgentDefinition = {
        name: "TestAgent",
        hull: {
          buildEnergy: 1000,
          capacity: 500,
        },
        units: [
          {
            type: "ASSEMBLER",
            buildEnergy: 800,
            assemblePower: 2,
          },
          {
            type: "COMPUTER",
            buildEnergy: 600,
            processingPower: 10,
            memorySize: 1024,
          },
        ],
      }
      
      const objects = factory.createAgent(generateId, agentDef)
      
      expect(objects).toHaveLength(3)
      
      // HULL
      const hull = objects[0]
      expect(hull).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(hull!.type).toBe("HULL")
      expect((hull as Hull).capacity).toBe(500)
      expect((hull as Hull).attachedUnits).toHaveLength(2)
      
      // ASSEMBLER
      const assembler = objects[1]
      expect(assembler).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(assembler!.type).toBe("ASSEMBLER")
      expect((assembler as Assembler).assemblePower).toBe(2)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect((assembler as Assembler).parentHull).toBe(hull!.id)
      
      // COMPUTER
      const computer = objects[2]
      expect(computer).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(computer!.type).toBe("COMPUTER")
      expect((computer as Computer).processingPower).toBe(10)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect((computer as Computer).parentHull).toBe(hull!.id)
      
      // 全てのオブジェクトが同じ位置にある
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(assembler!.position).toEqual(hull!.position)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(computer!.position).toEqual(hull!.position)
    })

    test("位置を指定してエージェントを作成", () => {
      const agentDef: AgentDefinition = {
        name: "TestAgent",
        hull: {
          buildEnergy: 1000,
          capacity: 500,
        },
        units: [],
      }
      
      const position = Vec2Utils.create(123, 456)
      const objects = factory.createAgent(generateId, agentDef, position)
      
      expect(objects[0]).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(objects[0]!.position).toEqual({ x: 123, y: 456 })
    })

    test("エージェント定義に位置が含まれる場合", () => {
      const agentDef: AgentDefinition = {
        name: "TestAgent",
        position: Vec2Utils.create(789, 321),
        hull: {
          buildEnergy: 1000,
          capacity: 500,
        },
        units: [],
      }
      
      const objects = factory.createAgent(generateId, agentDef)
      
      expect(objects[0]).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(objects[0]!.position).toEqual({ x: 789, y: 321 })
    })

    test("引数の位置がエージェント定義の位置より優先される", () => {
      const agentDef: AgentDefinition = {
        name: "TestAgent",
        position: Vec2Utils.create(111, 222),
        hull: {
          buildEnergy: 1000,
          capacity: 500,
        },
        units: [],
      }
      
      const position = Vec2Utils.create(333, 444)
      const objects = factory.createAgent(generateId, agentDef, position)
      
      expect(objects[0]).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(objects[0]!.position).toEqual({ x: 333, y: 444 })
    })

    test("位置が指定されない場合はランダム位置", () => {
      const agentDef: AgentDefinition = {
        name: "TestAgent",
        hull: {
          buildEnergy: 1000,
          capacity: 500,
        },
        units: [],
      }
      
      const objects = factory.createAgent(generateId, agentDef)
      
      expect(objects[0]).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const pos = objects[0]!.position
      expect(pos.x).toBeGreaterThanOrEqual(0)
      expect(pos.x).toBeLessThan(worldWidth)
      expect(pos.y).toBeGreaterThanOrEqual(0)
      expect(pos.y).toBeLessThan(worldHeight)
    })

    test("COMPUTERにプログラムが設定される", () => {
      const program = new Uint8Array([0xaa, 0xbb, 0xcc])
      const agentDef: AgentDefinition = {
        name: "TestAgent",
        hull: {
          buildEnergy: 1000,
          capacity: 500,
        },
        units: [
          {
            type: "COMPUTER",
            buildEnergy: 600,
            processingPower: 10,
            memorySize: 1024,
            program,
          },
        ],
      }
      
      const objects = factory.createAgent(generateId, agentDef)
      const computer = objects[1]
      
      expect((computer as Computer).memory[0]).toBe(0xaa)
      expect((computer as Computer).memory[1]).toBe(0xbb)
      expect((computer as Computer).memory[2]).toBe(0xcc)
    })

    test("未知のユニットタイプはエラー", () => {
      const agentDef: AgentDefinition = {
        name: "TestAgent",
        hull: {
          buildEnergy: 1000,
          capacity: 500,
        },
        units: [
          ({
            type: "UNKNOWN",
            buildEnergy: 100,
          } as unknown as UnitSpec),
        ],
      }
      
      expect(() => {
        factory.createAgent(generateId, agentDef)
      }).toThrow("Unknown unit type: UNKNOWN")
    })

    test("HULLのattachedUnitsが正しく設定される", () => {
      const agentDef: AgentDefinition = {
        name: "TestAgent",
        hull: {
          buildEnergy: 1000,
          capacity: 500,
        },
        units: [
          {
            type: "ASSEMBLER",
            buildEnergy: 800,
          },
          {
            type: "COMPUTER",
            buildEnergy: 600,
            memorySize: 512,
          },
          {
            type: "ASSEMBLER",
            buildEnergy: 700,
          },
        ],
      }
      
      const objects = factory.createAgent(generateId, agentDef)
      const hull = objects[0] as Hull
      
      expect(hull.attachedUnits).toHaveLength(3)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(hull.attachedUnits[0]).toBe(objects[1]!.id)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(hull.attachedUnits[1]).toBe(objects[2]!.id)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(hull.attachedUnits[2]).toBe(objects[3]!.id)
    })
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
      expect(obj.radius).toBeCloseTo(Math.sqrt(energy / Math.PI), 2)
      expect(obj.energy).toBe(energy)
    })

    test("メモリサイズ0のCOMPUTER", () => {
      const computer = factory.createComputer(
        generateId(),
        Vec2Utils.create(0, 0),
        600,
        10,
        0
      )
      
      expect(computer.memory.length).toBe(0)
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