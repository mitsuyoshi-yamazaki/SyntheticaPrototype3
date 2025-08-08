/**
 * 描画ユーティリティ関数
 * デザイン仕様v2に基づく図形描画
 */

import * as PIXI from "pixi.js"
import type {
  Assembler,
  Computer,
  ObjectId,
  AttachedUnitsInfo,
  GameObject,
  Hull,
} from "@/types/game"

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
    graphics.moveTo(x - halfWidth, y - radius)
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
 * AttachedUnitsInfoを生成
 * @param unitIds 固定されているユニットのIDリスト
 * @param getUnit IDからユニットを取得する関数
 * @returns 新しいAttachedUnitsInfo
 */
export const createAttachedUnitsInfo = (
  unitIds: ObjectId[],
  getUnit: (id: ObjectId) => GameObject | undefined
): AttachedUnitsInfo => {
  const hulls: { readonly id: ObjectId }[] = []
  const assemblers: { readonly id: ObjectId; readonly visualData: { readonly angle: number } }[] =
    []
  const computers: {
    readonly id: ObjectId
    readonly visualData: { readonly startAngle: number; readonly endAngle: number }
  }[] = []

  // ユニットを種別ごとに分類
  const assemblerUnits: Assembler[] = []
  const computerUnits: Computer[] = []

  for (const id of unitIds) {
    const unit = getUnit(id)
    if (unit === undefined) {
      continue
    }

    switch (unit.type) {
      case "HULL":
        hulls.push({ id })
        break
      case "ASSEMBLER":
        assemblerUnits.push(unit as Assembler)
        break
      case "COMPUTER":
        computerUnits.push(unit as Computer)
        break
    }
  }

  // ASSEMBLERの角度を均等配分
  assemblerUnits.forEach((assembler, index) => {
    assemblers.push({
      id: assembler.id,
      visualData: {
        angle: (360 / assemblerUnits.length) * index,
      },
    })
  })

  // COMPUTERのピザカット角度を計算
  if (computerUnits.length > 0) {
    const totalComputerEnergy = computerUnits.reduce((sum, c) => sum + c.buildEnergy, 0)
    let currentAngle = 0

    computerUnits.forEach(computer => {
      const angleSize = (computer.buildEnergy / totalComputerEnergy) * 360
      computers.push({
        id: computer.id,
        visualData: {
          startAngle: currentAngle,
          endAngle: currentAngle + angleSize,
        },
      })
      currentAngle += angleSize
    })
  }

  return { hulls, assemblers, computers }
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
      break
    }

    case "HULL": {
      // HULL（デザイン仕様v2: #A9A9A9、pill shape）
      const hull = gameObject as Hull
      const { width, height } = calculatePillShapeSize(hull.capacity)

      // Pill shapeを描画
      drawPillShape(graphics, 0, 0, width, height)
      graphics.fill(0xa9a9a9)

      // HP減少時は縁に赤み
      const healthRatio = hull.currentEnergy / hull.buildEnergy
      if (healthRatio < 0.7) {
        drawPillShape(graphics, 0, 0, width, height)
        graphics.stroke({ width: 2, color: 0xff0000, alpha: 1 - healthRatio })
      }

      // 固定されているユニットを描画
      const attachedInfo = hull.attachedUnits
      const hasAttached =
        attachedInfo.hulls.length > 0 ||
        attachedInfo.assemblers.length > 0 ||
        attachedInfo.computers.length > 0

      if (hasAttached && getUnit !== undefined) {
        // HULL内のASSEMBLERを描画
        const hasComputers = attachedInfo.computers.length > 0

        attachedInfo.assemblers.forEach(assemblerInfo => {
          const assembler = getUnit(assemblerInfo.id) as Assembler | undefined
          if (assembler === undefined) {
            return
          }

          const angle = assemblerInfo.visualData.angle
          const innerRadius = hasComputers ? height * 0.3 : 0 // COMPUTERがある場合は先端を欠く
          const outerRadius = Math.min(width, height) * 0.45

          // 扇形を描画
          const sectorGraphics = new PIXI.Graphics()
          drawSector(sectorGraphics, 0, 0, outerRadius, angle - 30, angle + 30, innerRadius)
          sectorGraphics.fill(0xff8c00)

          // 活動中は明るく
          if (assembler.isAssembling) {
            sectorGraphics.circle(
              outerRadius * 0.7 * Math.cos((angle * Math.PI) / 180),
              outerRadius * 0.7 * Math.sin((angle * Math.PI) / 180),
              3
            )
            sectorGraphics.fill({ color: 0xffd700, alpha: 0.5 })
          }

          graphics.addChild(sectorGraphics)
        })

        // HULL内のCOMPUTERを描画
        if (hasComputers) {
          const computerRadius = height * 0.25

          attachedInfo.computers.forEach(computerInfo => {
            const computer = getUnit(computerInfo.id) as Computer | undefined
            if (computer === undefined) {
              return
            }

            const startAngle = computerInfo.visualData.startAngle
            const endAngle = computerInfo.visualData.endAngle

            // ピザカット形状を描画
            const computerGraphics = new PIXI.Graphics()
            drawSector(computerGraphics, 0, 0, computerRadius, startAngle, endAngle)
            computerGraphics.fill(0x00bfff)

            // 活動中は中央に白い点
            if (computer.isRunning) {
              const midAngle = (startAngle + endAngle) / 2
              computerGraphics.circle(
                computerRadius * 0.5 * Math.cos((midAngle * Math.PI) / 180),
                computerRadius * 0.5 * Math.sin((midAngle * Math.PI) / 180),
                2
              )
              computerGraphics.fill({ color: 0xffffff, alpha: 0.9 })
            }

            graphics.addChild(computerGraphics)
          })
        }
      }
      break
    }

    case "ASSEMBLER": {
      // ASSEMBLER（デザイン仕様v2: #FF8C00、角丸長方形）
      const assembler = gameObject as Assembler
      const size = gameObject.radius * 2

      // HULLに固定されていない場合のみネイティブデザインを描画
      if (assembler.parentHull === undefined) {
        // 角丸長方形を描画
        graphics.roundRect(-size / 2, -size / 2, size, size, 5)
        graphics.fill(0xff8c00)

        // 活動中は明るく
        if (assembler.isAssembling) {
          graphics.roundRect(-size / 2 + 2, -size / 2 + 2, size - 4, size - 4, 3)
          graphics.fill({ color: 0xffd700, alpha: 0.3 })
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
        graphics.fill(0x00bfff)

        // 活動中は中央に白い点
        if (computer.isRunning) {
          graphics.circle(0, 0, 2)
          graphics.fill({ color: 0xffffff, alpha: 0.9 })
        }
      }
      // HULLに固定されている場合はHULL側で描画される
      break
    }

    default:
      // 未定義のタイプは灰色の円
      graphics.circle(0, 0, gameObject.radius)
      graphics.fill(0x808080)
      graphics.stroke({ width: 1, color: 0x404040 })
  }
}
