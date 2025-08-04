/**
 * 方向性力場システムのテスト
 */

import { ForceFieldSystem, DEFAULT_FORCE_FIELD_PARAMETERS } from "./force-field-system"
import type { ForceFieldSystemParameters } from "./force-field-system"
import type { DirectionalForceField, GameObject, ObjectId } from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

describe("ForceFieldSystem", () => {
  let forceFieldSystem: ForceFieldSystem
  let mockIdGenerator: () => ObjectId
  let idCounter = 1

  beforeEach(() => {
    forceFieldSystem = new ForceFieldSystem()
    idCounter = 1
    mockIdGenerator = () => idCounter++ as ObjectId
  })

  describe("線形力場（LINEAR）", () => {
    test("一定方向の力を生成", () => {
      const field: DirectionalForceField = {
        id: 1 as ObjectId,
        type: "LINEAR",
        position: Vec2Utils.create(100, 100),
        radius: 50,
        strength: 1,
        direction: Vec2Utils.create(10, 0), // 右向きの力
      }

      // 力場内の複数の点で同じ力が発生
      const force1 = forceFieldSystem.calculateForceFromField(
        Vec2Utils.create(100, 100),
        field
      )
      const force2 = forceFieldSystem.calculateForceFromField(
        Vec2Utils.create(120, 100),
        field
      )
      const force3 = forceFieldSystem.calculateForceFromField(
        Vec2Utils.create(100, 120),
        field
      )

      expect(force1).toEqual({ x: 10, y: 0 })
      expect(force2).toEqual({ x: 10, y: 0 })
      expect(force3).toEqual({ x: 10, y: 0 })
    })

    test("影響範囲外では力が発生しない", () => {
      const field: DirectionalForceField = {
        id: 1 as ObjectId,
        type: "LINEAR",
        position: Vec2Utils.create(100, 100),
        radius: 50,
        strength: 1,
        direction: Vec2Utils.create(10, 0),
      }

      const force = forceFieldSystem.calculateForceFromField(
        Vec2Utils.create(200, 100), // 範囲外
        field
      )

      expect(force).toBeNull()
    })

    test("端付近では減衰する", () => {
      const field: DirectionalForceField = {
        id: 1 as ObjectId,
        type: "LINEAR",
        position: Vec2Utils.create(100, 100),
        radius: 50,
        strength: 1,
        direction: Vec2Utils.create(10, 0),
      }

      // 端（距離50）での力
      const force = forceFieldSystem.calculateForceFromField(
        Vec2Utils.create(150, 100),
        field
      )

      // 減衰により元の50%の強度
      expect(force).toEqual({ x: 5, y: 0 })
    })
  })

  describe("放射状力場（RADIAL）", () => {
    test("中心から外向きの力を生成", () => {
      const field: DirectionalForceField = {
        id: 1 as ObjectId,
        type: "RADIAL",
        position: Vec2Utils.create(100, 100),
        radius: 50,
        strength: 10,
      }

      // 右側の点
      const force1 = forceFieldSystem.calculateForceFromField(
        Vec2Utils.create(120, 100),
        field
      )
      // 上側の点
      const force2 = forceFieldSystem.calculateForceFromField(
        Vec2Utils.create(100, 80),
        field
      )

      // 正規化された方向に強度を掛けた値
      expect(force1).toEqual({ x: 10, y: 0 })
      expect(force2).toEqual({ x: 0, y: -10 })
    })

    test("負の強度で内向きの力を生成", () => {
      const field: DirectionalForceField = {
        id: 1 as ObjectId,
        type: "RADIAL",
        position: Vec2Utils.create(100, 100),
        radius: 50,
        strength: -10,
      }

      const force = forceFieldSystem.calculateForceFromField(
        Vec2Utils.create(120, 100),
        field
      )

      // 中心に向かう力
      expect(force!.x).toBe(-10)
      expect(force!.y).toBeCloseTo(0, 10)
    })

    test("中心点では任意の方向", () => {
      const field: DirectionalForceField = {
        id: 1 as ObjectId,
        type: "RADIAL",
        position: Vec2Utils.create(100, 100),
        radius: 50,
        strength: 10,
      }

      const force = forceFieldSystem.calculateForceFromField(
        Vec2Utils.create(100, 100), // 中心点
        field
      )

      // 任意の方向（実装では右向き）
      expect(force).toEqual({ x: 10, y: 0 })
    })
  })

  describe("渦巻き力場（SPIRAL）", () => {
    test("接線方向と放射方向の組み合わせ", () => {
      const field: DirectionalForceField = {
        id: 1 as ObjectId,
        type: "SPIRAL",
        position: Vec2Utils.create(100, 100),
        radius: 50,
        strength: 10,
      }

      // 右側の点（放射方向: 右、接線方向: 下）
      const force = forceFieldSystem.calculateForceFromField(
        Vec2Utils.create(120, 100),
        field
      )

      // 距離20、半径50なので、放射比率 = 20/50 * 0.3 = 0.12
      // 接線比率 = 1 - 0.12 = 0.88
      // 放射成分: (1, 0) * 10 * 0.12 = (1.2, 0)
      // 接線成分: (0, 1) * 10 * 0.88 = (0, 8.8)
      expect(force!.x).toBeCloseTo(1.2, 1)
      expect(force!.y).toBeCloseTo(8.8, 1)
    })

    test("中心に近いほど接線成分が強い", () => {
      const field: DirectionalForceField = {
        id: 1 as ObjectId,
        type: "SPIRAL",
        position: Vec2Utils.create(100, 100),
        radius: 50,
        strength: 10,
      }

      // 中心近く
      const forceNear = forceFieldSystem.calculateForceFromField(
        Vec2Utils.create(105, 100), // 距離5
        field
      )
      // 中心から遠く
      const forceFar = forceFieldSystem.calculateForceFromField(
        Vec2Utils.create(140, 100), // 距離40
        field
      )

      // 接線成分の比率を比較
      const tangentRatioNear = Math.abs(forceNear!.y) / 10
      const tangentRatioFar = Math.abs(forceFar!.y) / 10

      expect(tangentRatioNear).toBeGreaterThan(tangentRatioFar)
    })

    test("中心点では接線方向のみ", () => {
      const field: DirectionalForceField = {
        id: 1 as ObjectId,
        type: "SPIRAL",
        position: Vec2Utils.create(100, 100),
        radius: 50,
        strength: 10,
      }

      const force = forceFieldSystem.calculateForceFromField(
        Vec2Utils.create(100, 100), // 中心点
        field
      )

      // 接線方向のみ（実装では上向き）
      expect(force).toEqual({ x: 0, y: 10 })
    })
  })

  describe("複数力場の重ね合わせ", () => {
    test("複数の力場からの力を合計", () => {
      const forceFields = new Map<ObjectId, DirectionalForceField>([
        [
          1 as ObjectId,
          {
            id: 1 as ObjectId,
            type: "LINEAR",
            position: Vec2Utils.create(100, 100),
            radius: 50,
            strength: 1,
            direction: Vec2Utils.create(10, 0),
          },
        ],
        [
          2 as ObjectId,
          {
            id: 2 as ObjectId,
            type: "LINEAR",
            position: Vec2Utils.create(100, 100),
            radius: 50,
            strength: 1,
            direction: Vec2Utils.create(0, 5),
          },
        ],
      ])

      const object: GameObject = {
        id: 100 as ObjectId,
        type: "ENERGY",
        position: Vec2Utils.create(100, 100),
        velocity: Vec2Utils.create(0, 0),
        radius: 5,
        energy: 100,
        mass: 10,
      }

      const totalForce = forceFieldSystem.calculateTotalForce(object, forceFields)

      expect(totalForce).toEqual({ x: 10, y: 5 })
    })

    test("影響範囲外の力場は無視", () => {
      const forceFields = new Map<ObjectId, DirectionalForceField>([
        [
          1 as ObjectId,
          {
            id: 1 as ObjectId,
            type: "LINEAR",
            position: Vec2Utils.create(100, 100),
            radius: 50,
            strength: 1,
            direction: Vec2Utils.create(10, 0),
          },
        ],
        [
          2 as ObjectId,
          {
            id: 2 as ObjectId,
            type: "LINEAR",
            position: Vec2Utils.create(300, 300), // 遠い
            radius: 50,
            strength: 1,
            direction: Vec2Utils.create(0, 5),
          },
        ],
      ])

      const object: GameObject = {
        id: 100 as ObjectId,
        type: "ENERGY",
        position: Vec2Utils.create(100, 100),
        velocity: Vec2Utils.create(0, 0),
        radius: 5,
        energy: 100,
        mass: 10,
      }

      const totalForce = forceFieldSystem.calculateTotalForce(object, forceFields)

      // 最初の力場のみ影響
      expect(totalForce).toEqual({ x: 10, y: 0 })
    })
  })

  describe("力場の生成", () => {
    test("指定数の力場を生成", () => {
      const fields = forceFieldSystem.generateForceFields(1000, 1000, 5, mockIdGenerator)

      expect(fields).toHaveLength(5)
      expect(fields[0]!.id).toBe(1)
      expect(fields[4]!.id).toBe(5)
    })

    test("力場間の最小距離を保つ", () => {
      const fields = forceFieldSystem.generateForceFields(1000, 1000, 3, mockIdGenerator)

      // 全てのペアで最小距離をチェック
      for (let i = 0; i < fields.length; i++) {
        for (let j = i + 1; j < fields.length; j++) {
          const distance = Vec2Utils.distance(fields[i]!.position, fields[j]!.position)
          expect(distance).toBeGreaterThanOrEqual(200)
        }
      }
    })

    test("パラメータが適切な範囲内", () => {
      const fields = forceFieldSystem.generateForceFields(1000, 1000, 10, mockIdGenerator)

      for (const field of fields) {
        expect(field.radius).toBeGreaterThanOrEqual(50)
        expect(field.radius).toBeLessThanOrEqual(300)

        if (field.type === "LINEAR") {
          expect(field.strength).toBe(1)
          expect(field.direction).toBeDefined()
          const magnitude = Vec2Utils.magnitude(field.direction!)
          expect(magnitude).toBeGreaterThanOrEqual(10)
          expect(magnitude).toBeLessThanOrEqual(50)
        } else {
          expect(field.strength).toBeGreaterThanOrEqual(10)
          expect(field.strength).toBeLessThanOrEqual(50)
        }
      }
    })

    test("全ての力場タイプが生成される", () => {
      // 多数生成して全タイプが含まれることを確認
      const fields = forceFieldSystem.generateForceFields(2000, 2000, 30, mockIdGenerator)

      const types = new Set(fields.map((f) => f.type))
      expect(types.has("LINEAR")).toBe(true)
      expect(types.has("RADIAL")).toBe(true)
      expect(types.has("SPIRAL")).toBe(true)
    })
  })

  describe("カスタムパラメータ", () => {
    test("減衰開始位置の変更", () => {
      const params: ForceFieldSystemParameters = {
        ...DEFAULT_FORCE_FIELD_PARAMETERS,
        attenuationStart: 0.8, // 80%から減衰開始
      }

      forceFieldSystem = new ForceFieldSystem(params)

      const field: DirectionalForceField = {
        id: 1 as ObjectId,
        type: "LINEAR",
        position: Vec2Utils.create(100, 100),
        radius: 100,
        strength: 1,
        direction: Vec2Utils.create(10, 0),
      }

      // 70%の位置（減衰前）
      const force1 = forceFieldSystem.calculateForceFromField(
        Vec2Utils.create(170, 100), // 距離70
        field
      )
      // 90%の位置（減衰後）
      const force2 = forceFieldSystem.calculateForceFromField(
        Vec2Utils.create(190, 100), // 距離90
        field
      )

      expect(force1).toEqual({ x: 10, y: 0 }) // 減衰なし
      expect(force2!.x).toBeLessThan(10) // 減衰あり
    })

    test("摩擦係数の取得", () => {
      const params: ForceFieldSystemParameters = {
        ...DEFAULT_FORCE_FIELD_PARAMETERS,
        frictionCoefficient: 0.95,
      }

      forceFieldSystem = new ForceFieldSystem(params)

      expect(forceFieldSystem.frictionCoefficient).toBe(0.95)
    })
  })

  describe("可視化データ生成", () => {
    test("力場の可視化データを生成", () => {
      const field: DirectionalForceField = {
        id: 1 as ObjectId,
        type: "LINEAR",
        position: Vec2Utils.create(100, 100),
        radius: 50,
        strength: 1,
        direction: Vec2Utils.create(10, 0),
      }

      const data = forceFieldSystem.getVisualizationData(field, 30)

      expect(data.length).toBeGreaterThan(0)

      // 全てのデータポイントが力場内にあること
      for (const point of data) {
        const distance = Vec2Utils.distance(point.position, field.position)
        expect(distance).toBeLessThanOrEqual(field.radius)
        expect(point.force).toBeDefined()
      }
    })

    test("渦巻き力場の可視化", () => {
      const field: DirectionalForceField = {
        id: 1 as ObjectId,
        type: "SPIRAL",
        position: Vec2Utils.create(100, 100),
        radius: 50,
        strength: 10,
      }

      const data = forceFieldSystem.getVisualizationData(field, 20)

      // 渦巻きパターンの確認
      for (const point of data) {
        const delta = Vec2Utils.sub(point.position, field.position)
        const distance = Vec2Utils.magnitude(delta)

        if (distance > 0) {
          // 力が接線成分を持つこと
          const radialDir = Vec2Utils.normalize(delta)
          const dotProduct =
            radialDir.x * point.force.x + radialDir.y * point.force.y

          // 完全に放射方向でない（接線成分がある）
          const forceMagnitude = Vec2Utils.magnitude(point.force)
          expect(Math.abs(dotProduct)).toBeLessThan(forceMagnitude * 0.9)
        }
      }
    })
  })
})