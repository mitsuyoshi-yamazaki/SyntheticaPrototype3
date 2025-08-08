/**
 * 描画ユーティリティ関数
 * デザイン仕様v2に基づく図形描画
 */

import * as PIXI from "pixi.js"
import type {
  Assembler,
  Computer,
  ObjectId,
  GameObject,
  Hull,
  DirectionalForceField,
  EnergySource,
} from "@/types/game"
import { calculateEnergySourceSize, calculateUnitRadius } from "../engine/object-factory"
import { isAssembler, isComputer, isHull } from "../utils/type-guards"

const RenderingParameters = {
  world: {
    backgroundColor: 0x101010,
  },
  independentUnit: {
    strokeWidth: 4,
  },
  attachedUnit: {
    strokeWidth: 3,
  },
  hull: {
    strokeColor: 0x2c3e50,
    damagedColor: 0xff0000,
  },
  computer: {
    color: 0x00bfff,
  },
  assembler: {
    fillColor: 0x882114,
    strokeColor: 0xe14628,
  },
}

/**
 * Pill shape（カプセル形状）を描画
 * @param graphics 描画先のGraphicsオブジェクト
 * @param x 中心X座標
 * @param y 中心Y座標
 * @param width 幅（直線部分を含む全体幅）
 * @param height 高さ（半円の直径）
 */
export const drawPillShape = (
  graphics: PIXI.Graphics,
  x: number,
  y: number,
  width: number,
  height: number
): void => {
  const radius = height / 2

  if (width <= height) {
    // 幅が高さ以下の場合は円として描画
    graphics.circle(x, y, radius)
  } else {
    // カプセル形状を描画
    const halfWidth = (width - height) / 2

    // 左の半円
    graphics.arc(x - halfWidth, y, radius, Math.PI / 2, Math.PI * 1.5)
    // 上の直線
    graphics.lineTo(x + halfWidth, y - radius)
    // 右の半円
    graphics.arc(x + halfWidth, y, radius, -Math.PI / 2, Math.PI / 2)
    // 下の直線
    graphics.lineTo(x - halfWidth, y + radius)
    graphics.closePath()
  }
}

/**
 * 扇形（セクター）を描画
 * @param graphics 描画先のGraphicsオブジェクト
 * @param centerX 中心X座標
 * @param centerY 中心Y座標
 * @param radius 半径
 * @param startAngle 開始角度（度）
 * @param endAngle 終了角度（度）
 * @param innerRadius 内側の半径（0の場合は通常の扇形、0より大きい場合は先端が欠けた扇形）
 */
export const drawSector = (
  graphics: PIXI.Graphics,
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  innerRadius = 0
): void => {
  const startRad = (startAngle * Math.PI) / 180
  const endRad = (endAngle * Math.PI) / 180

  if (innerRadius > 0) {
    // 先端が欠けた扇形
    const innerStartX = centerX + Math.cos(startRad) * innerRadius
    const innerStartY = centerY + Math.sin(startRad) * innerRadius
    const outerStartX = centerX + Math.cos(startRad) * radius
    const outerStartY = centerY + Math.sin(startRad) * radius

    graphics.moveTo(innerStartX, innerStartY)
    graphics.lineTo(outerStartX, outerStartY)
    graphics.arc(centerX, centerY, radius, startRad, endRad)

    const innerEndX = centerX + Math.cos(endRad) * innerRadius
    const innerEndY = centerY + Math.sin(endRad) * innerRadius

    graphics.lineTo(innerEndX, innerEndY)
    graphics.arc(centerX, centerY, innerRadius, endRad, startRad, true)
    graphics.closePath()
  } else {
    // 通常の扇形
    graphics.moveTo(centerX, centerY)
    const startX = centerX + Math.cos(startRad) * radius
    const startY = centerY + Math.sin(startRad) * radius
    graphics.lineTo(startX, startY)
    graphics.arc(centerX, centerY, radius, startRad, endRad)
    graphics.closePath()
  }
}

/**
 * 容量からpill shapeのサイズを計算
 * @param capacity 容量
 * @returns { width, height } pill shapeの幅と高さ
 */
export const calculatePillShapeSize = (capacity: number): { width: number; height: number } => {
  // 仮の実装：容量に基づいてサイズを計算
  // TODO: 実装時に適切な閾値a, bを決定
  const minRadius = 15 // 最小半径
  const baseRadius = Math.sqrt(capacity / Math.PI) * 2
  const radius = Math.max(minRadius, baseRadius)

  const thresholdA = 100 // 円形からpill shapeに変わる閾値
  const thresholdB = 500 // pill shapeが最大長になる閾値

  if (capacity < thresholdA) {
    // 円形
    return { width: radius * 2, height: radius * 2 }
  } else if (capacity < thresholdB) {
    // 半径固定で長さを調整
    const ratio = (capacity - thresholdA) / (thresholdB - thresholdA)
    const extraLength = radius * ratio * 2
    return { width: radius * 2 + extraLength, height: radius * 2 }
  } else {
    // 半径=直線部分の長さ
    return { width: radius * 4, height: radius * 2 }
  }
}

/**
 * ゲームオブジェクトを描画
 * @param graphics 描画先のGraphicsオブジェクト
 * @param gameObject 描画するゲームオブジェクト
 * @param getUnit Hull内のユニットを取得する関数（Hull描画時のみ必要）
 */
export const drawObject = (
  graphics: PIXI.Graphics,
  gameObject: GameObject,
  getUnit?: (id: ObjectId) => GameObject | undefined
): void => {
  switch (gameObject.type) {
    case "ENERGY": {
      // エネルギーオブジェクト（デザイン仕様: #FFD700、小さな円形）
      graphics.circle(0, 0, gameObject.radius)
      graphics.fill(0xffd700)
      return
    }

    case "HULL": {
      // HULL（デザイン仕様v2: #A9A9A9、pill shape）
      const hull = gameObject as Hull
      const hullRadius = calculateUnitRadius(hull.buildEnergy)

      graphics.circle(0, 0, hullRadius)
      graphics.fill(RenderingParameters.world.backgroundColor)
      graphics.stroke({
        width: RenderingParameters.independentUnit.strokeWidth,
        color: RenderingParameters.hull.strokeColor,
      })

      // HP減少時は縁に赤み
      const healthRatio = hull.currentEnergy / hull.buildEnergy
      if (healthRatio < 0.7) {
        graphics.circle(0, 0, hullRadius)
        graphics.stroke({
          width: RenderingParameters.independentUnit.strokeWidth,
          color: RenderingParameters.hull.damagedColor,
          alpha: 1 - healthRatio,
        })
      }

      if (hull.attachedUnitIds.length <= 0 || getUnit == null) {
        return
      }

      // 固定されているユニットを描画
      const attachedAssemblers: Assembler[] = []
      const attachedComputers: Computer[] = []
      const attachedHulls: Hull[] = []

      hull.attachedUnitIds.forEach(unitId => {
        const unit = getUnit(unitId)
        if (unit == null) {
          return
        }

        if (isAssembler(unit)) {
          attachedAssemblers.push(unit)
          return
        }
        if (isComputer(unit)) {
          attachedComputers.push(unit)
          return
        }
        if (isHull(unit)) {
          attachedHulls.push(unit)
          return
        }
      })

      // HULL内のCOMPUTERを描画
      const [totalComputerBuildEnergy, computerRadius] = ((): [number, number] => {
        const totalBuildEnergy = attachedComputers.reduce(
          (result, current) => result + current.buildEnergy,
          0
        )
        if (totalBuildEnergy <= 0) {
          return [0, 0]
        }
        return [totalBuildEnergy, calculateUnitRadius(totalBuildEnergy)]
      })()

      if (totalComputerBuildEnergy > 0) {
        graphics.circle(0, 0, computerRadius)
        graphics.fill(RenderingParameters.computer.color)
      }

      // HULL内のASSEMBLERを描画
      let currentAngle = 0
      const fillableMaxBuildEnergy = hull.buildEnergy - totalComputerBuildEnergy
      if (fillableMaxBuildEnergy > 0) {
        attachedAssemblers.forEach(assembler => {
          const buildEnergyRatio = assembler.buildEnergy / fillableMaxBuildEnergy
          const startAngle = currentAngle
          const endAngle = startAngle + buildEnergyRatio * Math.PI * 2

          // 扇形を描画
          const sectorGraphics = new PIXI.Graphics()
          const innerRadius =
            computerRadius === 0 ? 5 : computerRadius + RenderingParameters.attachedUnit.strokeWidth
          drawSector(
            sectorGraphics,
            0,
            0,
            hullRadius - RenderingParameters.independentUnit.strokeWidth,
            startAngle,
            endAngle,
            innerRadius
          )
          sectorGraphics.stroke({
            width: RenderingParameters.attachedUnit.strokeWidth,
            color: RenderingParameters.assembler.strokeColor,
            alpha: 1,
          })
          sectorGraphics.fill(RenderingParameters.assembler.fillColor)

          currentAngle = endAngle

          if (assembler.isAssembling) {
            // TODO:活動中のインジケータ描画
          }

          graphics.addChild(sectorGraphics)
        })
      }

      // TODO: 接続しているHULLを描画する
      return
    }

    case "ASSEMBLER": {
      // ASSEMBLER（デザイン仕様v2: #FF8C00、角丸長方形）
      const assembler = gameObject as Assembler
      const size = gameObject.radius * 2

      // HULLに固定されていない場合のみネイティブデザインを描画
      if (assembler.parentHull === undefined) {
        // 角丸長方形を描画
        graphics.roundRect(-size / 2, -size / 2, size, size, 5)
        graphics.stroke({
          width: RenderingParameters.independentUnit.strokeWidth,
          color: RenderingParameters.assembler.strokeColor,
          alpha: 1,
        })
        graphics.fill(RenderingParameters.assembler.fillColor)

        // 活動中はドットを描く
        if (assembler.isAssembling) {
          graphics.circle(0, 0, gameObject.radius / 3)
          graphics.fill({ color: 0xf3b449, alpha: 1 })
        }
      }
      // HULLに固定されている場合はHULL側で描画される
      break
    }

    case "COMPUTER": {
      // COMPUTER（デザイン仕様v2: #00BFFF、円形）
      const computer = gameObject as Computer

      // HULLに固定されていない場合のみネイティブデザインを描画
      if (computer.parentHull === undefined) {
        // 円形を描画
        graphics.circle(0, 0, gameObject.radius)
        graphics.fill(RenderingParameters.computer.color)
      }
      // HULLに固定されている場合はHULL側で描画される
      break
    }

    default: {
      // Exhaustive check
      const exhaustiveCheck: never = gameObject.type
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Unknown game object type: ${exhaustiveCheck}`)
    }
  }
}

/**
 * エネルギーソースを描画
 * @param graphics 描画先のGraphicsオブジェクト
 * @param source 描画するエネルギーソース
 */
export const drawEnergySource = (graphics: PIXI.Graphics, source: EnergySource): void => {
  const size = calculateEnergySourceSize(source)
  const halfSize = size / 2
  graphics.roundRect(source.position.x - halfSize, source.position.y - halfSize, size, size, 2)
  graphics.fill({ color: 0xffd700, alpha: 0.8 })
}

/**
 * 方向性力場を描画
 * @param graphics 描画先のGraphicsオブジェクト
 * @param forceField 描画する方向性力場
 */
export const drawForceField = (
  graphics: PIXI.Graphics,
  forceField: DirectionalForceField
): void => {
  graphics.circle(forceField.position.x, forceField.position.y, forceField.radius)
  const fillColor: number = (() => {
    switch (forceField.type) {
      case "LINEAR":
        return 0xadd8e6
      case "RADIAL":
        return 0xd8e6ad
      case "SPIRAL":
        return 0xe6add8
    }
  })()

  graphics.fill({ color: fillColor, alpha: 0.2 })
}
