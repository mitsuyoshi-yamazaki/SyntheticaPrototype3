/**
 * 描画ユーティリティ関数
 * デザイン仕様v2に基づく図形描画
 */

import * as PIXI from 'pixi.js'
import type { Assembler, Computer, Hull } from '@/types/game'

/**
 * Pill shape（カプセル形状）を描画
 * @param graphics 描画先のGraphicsオブジェクト
 * @param x 中心X座標
 * @param y 中心Y座標
 * @param width 幅（直線部分を含む全体幅）
 * @param height 高さ（半円の直径）
 */
export function drawPillShape(
  graphics: PIXI.Graphics,
  x: number,
  y: number,
  width: number,
  height: number
): void {
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
export function drawSector(
  graphics: PIXI.Graphics,
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  innerRadius = 0
): void {
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
export function calculatePillShapeSize(capacity: number): { width: number; height: number } {
  // 仮の実装：容量に基づいてサイズを計算
  // TODO: 実装時に適切な閾値a, bを決定
  const minRadius = 15  // 最小半径
  const baseRadius = Math.sqrt(capacity / Math.PI) * 2
  const radius = Math.max(minRadius, baseRadius)
  
  const thresholdA = 100  // 円形からpill shapeに変わる閾値
  const thresholdB = 500  // pill shapeが最大長になる閾値
  
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
 * 視覚データを初期化・再計算
 * @param attachedUnits 固定されているユニット
 */
export function redistributeVisualPositions(
  attachedUnits: (Assembler | Computer | Hull)[]
): void {
  const assemblers = attachedUnits.filter((u): u is Assembler => u.type === 'ASSEMBLER')
  const computers = attachedUnits.filter((u): u is Computer => u.type === 'COMPUTER')
  
  // ASSEMBLERの角度を均等配分
  assemblers.forEach((assembler, index) => {
    assembler.visualData = {
      angle: (360 / assemblers.length) * index
    }
  })
  
  // COMPUTERのピザカット角度を計算
  if (computers.length > 0) {
    const totalComputerEnergy = computers.reduce((sum, c) => sum + c.buildEnergy, 0)
    let currentAngle = 0
    
    computers.forEach(computer => {
      const angleSize = (computer.buildEnergy / totalComputerEnergy) * 360
      computer.visualData = {
        startAngle: currentAngle,
        endAngle: currentAngle + angleSize
      }
      currentAngle += angleSize
    })
  }
}