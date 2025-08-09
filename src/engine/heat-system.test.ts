/**
 * 熱拡散システムのテスト
 */

import { HeatSystem, createHeatParametersFromGameLaws } from "./heat-system"
import type { HeatSystemParameters } from "./heat-system"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

describe("HeatSystem", () => {
  let heatSystem: HeatSystem
  const width = 10
  const height = 10

  beforeEach(() => {
    heatSystem = new HeatSystem(width, height)
  })

  describe("基本的な熱の操作", () => {
    test("熱の追加と取得", () => {
      heatSystem.addHeat(5, 5, 100)
      expect(heatSystem.getHeat(5, 5)).toBe(100)

      // 他のセルは0のまま
      expect(heatSystem.getHeat(4, 5)).toBe(0)
      expect(heatSystem.getHeat(6, 5)).toBe(0)
    })

    test("座標から熱を追加", () => {
      const position = Vec2Utils.create(55, 55) // グリッド座標(5, 5)に対応
      heatSystem.addHeatAt(position, 200)

      expect(heatSystem.getHeat(5, 5)).toBe(200)
    })

    test("熱の累積", () => {
      heatSystem.addHeat(3, 3, 50)
      heatSystem.addHeat(3, 3, 30)
      heatSystem.addHeat(3, 3, 20)

      expect(heatSystem.getHeat(3, 3)).toBe(100)
    })

    test("負の熱量は追加されない", () => {
      heatSystem.addHeat(0, 0, 100)
      heatSystem.addHeat(0, 0, -50)

      expect(heatSystem.getHeat(0, 0)).toBe(100)
    })

    test("小数の熱量は切り捨て", () => {
      heatSystem.addHeat(0, 0, 50.7)
      expect(heatSystem.getHeat(0, 0)).toBe(50)
    })
  })

  describe("トーラス境界での熱操作", () => {
    test("境界を越えた座標でのアクセス", () => {
      heatSystem.addHeat(0, 0, 100)

      // 同じセルを指す
      expect(heatSystem.getHeat(width, 0)).toBe(100)
      expect(heatSystem.getHeat(0, height)).toBe(100)
      expect(heatSystem.getHeat(-width, 0)).toBe(100)
      expect(heatSystem.getHeat(0, -height)).toBe(100)
    })
  })

  describe("熱拡散の計算", () => {
    test("単一の熱源からの拡散", () => {
      // 中央に熱を配置
      heatSystem.addHeat(5, 5, 400)

      // 1ステップ拡散
      heatSystem.updateDiffusion()

      // 中央の熱が減少
      expect(heatSystem.getHeat(5, 5)).toBeLessThan(400)

      // 隣接セルに熱が拡散
      expect(heatSystem.getHeat(4, 5)).toBeGreaterThan(0)
      expect(heatSystem.getHeat(6, 5)).toBeGreaterThan(0)
      expect(heatSystem.getHeat(5, 4)).toBeGreaterThan(0)
      expect(heatSystem.getHeat(5, 6)).toBeGreaterThan(0)

      // 斜めのセルには拡散しない（ノイマン近傍）
      expect(heatSystem.getHeat(4, 4)).toBe(0)
    })

    test("熱の保存則", () => {
      // ランダムに熱を配置
      const initialHeat = 5000
      heatSystem.addHeat(2, 3, 1000)
      heatSystem.addHeat(7, 8, 2000)
      heatSystem.addHeat(1, 9, 2000)

      const statsBefore = heatSystem.getStats()
      expect(statsBefore.totalHeat).toBe(initialHeat)

      // 複数ステップ拡散
      for (let i = 0; i < 10; i++) {
        heatSystem.updateDiffusion()
      }

      const statsAfter = heatSystem.getStats()
      // 熱の総量が保存される（拡散のみでは熱は失われない）
      expect(statsAfter.totalHeat).toBe(initialHeat)
    })

    test("均一な熱分布は変化しない", () => {
      // 全セルに同じ熱量を設定
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          heatSystem.addHeat(x, y, 100)
        }
      }

      heatSystem.updateDiffusion()

      // 全セルが同じ熱量のまま
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          expect(heatSystem.getHeat(x, y)).toBe(100)
        }
      }
    })

    test("境界を跨いだ拡散", () => {
      // 端に熱を配置
      heatSystem.addHeat(0, 0, 400)

      heatSystem.updateDiffusion()

      // トーラス境界を越えて拡散
      expect(heatSystem.getHeat(width - 1, 0)).toBeGreaterThan(0) // 左端へ
      expect(heatSystem.getHeat(0, height - 1)).toBeGreaterThan(0) // 上端へ
    })
  })

  describe("放熱処理", () => {
    test("高温セルからの放熱", () => {
      heatSystem.addHeat(5, 5, 1000)
      const heatBefore = heatSystem.getHeat(5, 5)

      heatSystem.updateRadiation()

      const heatAfter = heatSystem.getHeat(5, 5)
      expect(heatAfter).toBeLessThan(heatBefore)
      expect(heatAfter).toBeGreaterThan(0) // 完全には冷却されない
    })

    test("低温セルからの放熱は少ない", () => {
      heatSystem.addHeat(5, 5, 10)
      const heatBefore = heatSystem.getHeat(5, 5)

      heatSystem.updateRadiation()

      const heatAfter = heatSystem.getHeat(5, 5)
      const radiationAmount = heatBefore - heatAfter
      expect(radiationAmount).toBeLessThanOrEqual(1)
    })

    test("温度0のセルは放熱しない", () => {
      heatSystem.updateRadiation()

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          expect(heatSystem.getHeat(x, y)).toBe(0)
        }
      }
    })

    test("放熱による熱の減少", () => {
      // 複数のセルに熱を配置
      heatSystem.addHeat(2, 2, 500)
      heatSystem.addHeat(7, 7, 800)

      const statsBefore = heatSystem.getStats()

      // 複数回放熱
      for (let i = 0; i < 5; i++) {
        heatSystem.updateRadiation()
      }

      const statsAfter = heatSystem.getStats()
      expect(statsAfter.totalHeat).toBeLessThan(statsBefore.totalHeat)
    })
  })

  describe("熱ダメージ計算", () => {
    test("閾値以下ではダメージなし", () => {
      const params = createHeatParametersFromGameLaws()
      heatSystem.addHeat(5, 5, params.heatDamageThreshold)

      const damage = heatSystem.calculateHeatDamage(5, 5)
      expect(damage).toBe(0)
    })

    test("閾値を超えるとダメージ発生", () => {
      const params = createHeatParametersFromGameLaws()
      const heat = params.heatDamageThreshold + 50
      heatSystem.addHeat(5, 5, heat)

      const damage = heatSystem.calculateHeatDamage(5, 5)
      expect(damage).toBe(50)
    })

    test("損傷時のダメージ倍率", () => {
      const params = createHeatParametersFromGameLaws()
      const heat = params.heatDamageThreshold + 20
      heatSystem.addHeat(5, 5, heat)

      const normalDamage = heatSystem.calculateHeatDamage(5, 5, false, false)
      const damagedDamage = heatSystem.calculateHeatDamage(5, 5, true, false)

      expect(damagedDamage).toBe(normalDamage * params.damageMultiplierDamaged)
    })

    test("生産中のダメージ倍率", () => {
      const params = createHeatParametersFromGameLaws()
      const heat = params.heatDamageThreshold + 30
      heatSystem.addHeat(5, 5, heat)

      const normalDamage = heatSystem.calculateHeatDamage(5, 5, false, false)
      const producingDamage = heatSystem.calculateHeatDamage(5, 5, false, true)

      expect(producingDamage).toBe(normalDamage * params.damageMultiplierProducing)
    })
  })

  describe("統計情報", () => {
    test("空のグリッドの統計", () => {
      const stats = heatSystem.getStats()

      expect(stats.totalHeat).toBe(0)
      expect(stats.maxHeat).toBe(0)
      expect(stats.minHeat).toBe(0)
      expect(stats.averageHeat).toBe(0)
      expect(stats.hotCellCount).toBe(0)
    })

    test("熱が配置されたグリッドの統計", () => {
      heatSystem.addHeat(1, 1, 50)
      heatSystem.addHeat(5, 5, 200)
      heatSystem.addHeat(8, 8, 150)

      const stats = heatSystem.getStats()

      expect(stats.totalHeat).toBe(400)
      expect(stats.maxHeat).toBe(200)
      expect(stats.minHeat).toBe(0)
      expect(stats.averageHeat).toBe(4) // 400 / 100セル
      expect(stats.hotCellCount).toBe(2) // 200と150が閾値(100)を超える
    })
  })

  describe("リセット機能", () => {
    test("熱グリッドのリセット", () => {
      // 熱を追加
      heatSystem.addHeat(3, 3, 100)
      heatSystem.addHeat(7, 7, 200)

      // リセット
      heatSystem.reset()

      // 全セルが0に
      const stats = heatSystem.getStats()
      expect(stats.totalHeat).toBe(0)
      expect(stats.maxHeat).toBe(0)
    })
  })

  describe("カスタムパラメータ", () => {
    test("異なる拡散パラメータでの動作", () => {
      const baseParams = createHeatParametersFromGameLaws()
      const params: HeatSystemParameters = {
        ...baseParams,
        heatFlowRate: 2, // より速い拡散
      }

      heatSystem = new HeatSystem(width, height, params)
      heatSystem.addHeat(5, 5, 400)

      heatSystem.updateDiffusion()

      // TEST_PARAMETERSではheatDiffusionBase = 4 (1 / 0.25)
      // baseHeat = 400 / 4 = 100
      // diff = 0 - 100 = -100 (隣接セルから中央への流れ)
      // flow = -100 / 2 = -50
      // maxFlow = 100 / 2 - 1 = 49
      // 実際のflow = -49 (制限される)
      // 隣接セルには19が流れ込む (制限の影響で若干少ない)
      const neighborHeat = heatSystem.getHeat(4, 5)
      expect(neighborHeat).toBeGreaterThan(15)
    })

    test("異なる放熱パラメータでの動作", () => {
      const baseParams = createHeatParametersFromGameLaws()
      const params: HeatSystemParameters = {
        ...baseParams,
        radiationEnvRatio: 0.5, // より速い放熱
      }

      heatSystem = new HeatSystem(width, height, params)
      heatSystem.addHeat(5, 5, 1000)

      const heatBefore = heatSystem.getHeat(5, 5)
      heatSystem.updateRadiation()
      const heatAfter = heatSystem.getHeat(5, 5)

      const radiationAmount = heatBefore - heatAfter
      // TEST_PARAMETERSではheatDiffusionBase = 4 (1 / 0.25)
      // 放熱計算: environmentHeat = 1000 * 0.5 = 500
      // baseHeat = 1000 / 4 = 250, envBaseHeat = 500 / 4 = 125
      // diff = 250 - 125 = 125
      // radiationAmount = 125 / 3 = 41 (floor)
      // ただし、maxRadiation = 125 / 2 - 1 = 61なので制限されない
      // 実際の放熱は計算式に依存
      expect(radiationAmount).toBeGreaterThan(10)
      expect(radiationAmount).toBeLessThan(100)
    })
  })

  describe("複雑なシナリオ", () => {
    test("拡散と放熱の組み合わせ", () => {
      // 熱源を配置
      heatSystem.addHeat(5, 5, 1000)

      // 10ステップのシミュレーション
      for (let i = 0; i < 10; i++) {
        heatSystem.updateDiffusion()
        heatSystem.updateRadiation()
      }

      const stats = heatSystem.getStats()

      // 熱が拡散し、全体的に冷却される
      expect(stats.totalHeat).toBeLessThan(1000)
      expect(stats.maxHeat).toBeLessThan(500)
      expect(stats.averageHeat).toBeGreaterThan(0)
    })

    test("複数の熱源での干渉", () => {
      // 近接する2つの熱源
      heatSystem.addHeat(4, 5, 500)
      heatSystem.addHeat(6, 5, 500)

      // 拡散
      heatSystem.updateDiffusion()

      // 中間地点(5,5)に熱が集まる
      const centerHeat = heatSystem.getHeat(5, 5)
      expect(centerHeat).toBeGreaterThan(0)

      // 熱源自体は減少
      expect(heatSystem.getHeat(4, 5)).toBeLessThan(500)
      expect(heatSystem.getHeat(6, 5)).toBeLessThan(500)
    })
  })
})
