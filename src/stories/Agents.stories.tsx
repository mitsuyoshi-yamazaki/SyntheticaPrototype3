import type { Meta, StoryObj } from '@storybook/nextjs'
import * as PIXI from 'pixi.js'
import { withPixi } from '../../.storybook/decorators/pixi'
import { drawPillShape, drawSector, calculatePillShapeSize } from '@/lib/render-utils'
import { ObjectFactory } from '@/engine/object-factory'
import type { Hull, Assembler, Computer, ObjectId } from '@/types/game'

/**
 * エージェント（複数ユニットの組み合わせ）の描画確認用ストーリー
 * docs/デザイン仕様/v2/デザイン仕様.mdの仕様に基づいた表示を確認
 */
const meta: Meta = {
  title: 'Game/Agents',
  decorators: [withPixi],
  parameters: {
    docs: {
      description: {
        component: 'エージェント（複数ユニットの組み合わせ）の描画確認',
      },
    },
  },
}

export default meta

type Story = StoryObj<{
  width?: number
  height?: number
  backgroundColor?: number
  renderFunction?: (app: PIXI.Application) => void
}>

// 描画用ヘルパー関数
function drawHullWithAttached(
  app: PIXI.Application, 
  hull: Hull,
  getUnit: (id: ObjectId) => Assembler | Computer | Hull | null,
  x: number,
  y: number
) {
  const container = new PIXI.Container()
  container.x = x
  container.y = y

  // HULLの描画
  const hullGraphics = new PIXI.Graphics()
  const { width, height } = calculatePillShapeSize(hull.capacity)
  drawPillShape(hullGraphics, 0, 0, width, height)
  hullGraphics.fill(0xa9a9a9)
  container.addChild(hullGraphics)

  // 固定されているユニットを描画
  const attachedInfo = hull.attachedUnits
  const hasComputers = attachedInfo.computers.length > 0

  // ASSEMBLERの描画
  attachedInfo.assemblers.forEach(assemblerInfo => {
    const assembler = getUnit(assemblerInfo.id) as Assembler | null
    if (!assembler) return

    const angle = assemblerInfo.visualData.angle
    const innerRadius = hasComputers ? height * 0.3 : 0
    const outerRadius = Math.min(width, height) * 0.45

    const sectorGraphics = new PIXI.Graphics()
    drawSector(sectorGraphics, 0, 0, outerRadius, angle - 30, angle + 30, innerRadius)
    sectorGraphics.fill(0xff8c00)
    
    if (assembler.isAssembling) {
      sectorGraphics.circle(
        outerRadius * 0.7 * Math.cos(angle * Math.PI / 180),
        outerRadius * 0.7 * Math.sin(angle * Math.PI / 180), 
        3
      )
      sectorGraphics.fill({ color: 0xffd700, alpha: 0.5 })
    }
    
    container.addChild(sectorGraphics)
  })

  // COMPUTERの描画
  if (hasComputers) {
    const computerRadius = height * 0.25

    attachedInfo.computers.forEach(computerInfo => {
      const computer = getUnit(computerInfo.id) as Computer | null
      if (!computer) return

      const startAngle = computerInfo.visualData.startAngle
      const endAngle = computerInfo.visualData.endAngle

      const computerGraphics = new PIXI.Graphics()
      drawSector(computerGraphics, 0, 0, computerRadius, startAngle, endAngle)
      computerGraphics.fill(0x00bfff)

      if (computer.isRunning) {
        const midAngle = (startAngle + endAngle) / 2
        computerGraphics.circle(
          computerRadius * 0.5 * Math.cos(midAngle * Math.PI / 180),
          computerRadius * 0.5 * Math.sin(midAngle * Math.PI / 180),
          2
        )
        computerGraphics.fill({ color: 0xffffff, alpha: 0.9 })
      }

      container.addChild(computerGraphics)
    })
  }

  // 入れ子のHULLの描画
  attachedInfo.hulls.forEach(hullInfo => {
    const childHull = getUnit(hullInfo.id) as Hull | null
    if (!childHull) return

    // 子HULLは親HULLの横に配置
    const offsetX = width * 0.8
    drawHullWithAttached(app, childHull, getUnit, x + offsetX, y)
  })

  app.stage.addChild(container)
}

export const HullWithAssembler: Story = {
  args: {
    width: 300,
    height: 300,
    renderFunction: (app: PIXI.Application) => {
      const factory = new ObjectFactory(800, 600)
      
      // HULLを作成
      const hull = factory.createHull(1 as ObjectId, { x: 0, y: 0 }, 100)
      
      // ASSEMBLERを作成
      const assembler = factory.createAssembler(2 as ObjectId, { x: 0, y: 0 }, 1, hull.id)
      
      // HULLに接続
      hull.attachedUnits = {
        hulls: [],
        assemblers: [
          { id: assembler.id, visualData: { angle: 0 } }
        ],
        computers: [],
      }
      
      // 描画
      const units = new Map<ObjectId, Assembler | Computer>()
      units.set(assembler.id, assembler)
      drawHullWithAttached(app, hull, (id) => units.get(id) || null, 150, 150)
      
      // ラベル
      const label = new PIXI.Text({
        text: 'HULL with ASSEMBLER',
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: 'Courier New, monospace',
        },
      })
      label.x = 150 - label.width / 2
      label.y = 220
      app.stage.addChild(label)
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'HULLにASSEMBLERがひとつ固定されている状態',
      },
    },
  },
}

export const HullWithComputer: Story = {
  args: {
    width: 300,
    height: 300,
    renderFunction: (app: PIXI.Application) => {
      const factory = new ObjectFactory(800, 600)
      
      // HULLを作成
      const hull = factory.createHull(1 as ObjectId, { x: 0, y: 0 }, 100)
      
      // COMPUTERを作成
      const computer = factory.createComputer(2 as ObjectId, { x: 0, y: 0 }, 1, 64, hull.id)
      
      // HULLに接続
      hull.attachedUnits = {
        hulls: [],
        assemblers: [],
        computers: [
          { id: computer.id, visualData: { startAngle: 0, endAngle: 360 } }
        ],
      }
      
      // 描画
      const units = new Map<ObjectId, Assembler | Computer>()
      units.set(computer.id, computer)
      drawHullWithAttached(app, hull, (id) => units.get(id) || null, 150, 150)
      
      // ラベル
      const label = new PIXI.Text({
        text: 'HULL with COMPUTER',
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: 'Courier New, monospace',
        },
      })
      label.x = 150 - label.width / 2
      label.y = 220
      app.stage.addChild(label)
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'HULLにCOMPUTERがひとつ固定されている状態',
      },
    },
  },
}

export const HullWithBoth: Story = {
  args: {
    width: 300,
    height: 300,
    renderFunction: (app: PIXI.Application) => {
      const factory = new ObjectFactory(800, 600)
      
      // HULLを作成
      const hull = factory.createHull(1 as ObjectId, { x: 0, y: 0 }, 100)
      
      // ASSEMBLERを作成
      const assembler = factory.createAssembler(2 as ObjectId, { x: 0, y: 0 }, 1, hull.id)
      
      // COMPUTERを作成
      const computer = factory.createComputer(3 as ObjectId, { x: 0, y: 0 }, 1, 64, hull.id)
      
      // HULLに接続
      hull.attachedUnits = {
        hulls: [],
        assemblers: [
          { id: assembler.id, visualData: { angle: 0 } }
        ],
        computers: [
          { id: computer.id, visualData: { startAngle: 0, endAngle: 360 } }
        ],
      }
      
      // 描画
      const units = new Map<ObjectId, Assembler | Computer>()
      units.set(assembler.id, assembler)
      units.set(computer.id, computer)
      drawHullWithAttached(app, hull, (id) => units.get(id) || null, 150, 150)
      
      // ラベル
      const label = new PIXI.Text({
        text: 'HULL with ASSEMBLER + COMPUTER',
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: 'Courier New, monospace',
        },
      })
      label.x = 150 - label.width / 2
      label.y = 220
      app.stage.addChild(label)
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'HULLにASSEMBLERとCOMPUTERがひとつずつ固定されている状態',
      },
    },
  },
}

export const NestedHulls: Story = {
  args: {
    width: 500,
    height: 300,
    renderFunction: (app: PIXI.Application) => {
      const factory = new ObjectFactory(800, 600)
      
      // 親HULLを作成
      const parentHull = factory.createHull(1 as ObjectId, { x: 0, y: 0 }, 100)
      
      // 親HULL用のユニット
      const parentAssembler = factory.createAssembler(2 as ObjectId, { x: 0, y: 0 }, 1, parentHull.id)
      const parentComputer = factory.createComputer(3 as ObjectId, { x: 0, y: 0 }, 1, 64, parentHull.id)
      
      // 子HULLを作成
      const childHull = factory.createHull(4 as ObjectId, { x: 0, y: 0 }, 100)
      
      // 子HULL用のユニット
      const childAssembler = factory.createAssembler(5 as ObjectId, { x: 0, y: 0 }, 1, childHull.id)
      const childComputer = factory.createComputer(6 as ObjectId, { x: 0, y: 0 }, 1, 64, childHull.id)
      
      // 子HULLにユニットを接続
      childHull.attachedUnits = {
        hulls: [],
        assemblers: [
          { id: childAssembler.id, visualData: { angle: 0 } }
        ],
        computers: [
          { id: childComputer.id, visualData: { startAngle: 0, endAngle: 360 } }
        ],
      }
      
      // 親HULLにユニットと子HULLを接続
      parentHull.attachedUnits = {
        hulls: [
          { id: childHull.id }
        ],
        assemblers: [
          { id: parentAssembler.id, visualData: { angle: 180 } }
        ],
        computers: [
          { id: parentComputer.id, visualData: { startAngle: 0, endAngle: 360 } }
        ],
      }
      
      // 描画
      const units = new Map<ObjectId, Assembler | Computer | Hull>()
      units.set(parentAssembler.id, parentAssembler)
      units.set(parentComputer.id, parentComputer)
      units.set(childHull.id, childHull)
      units.set(childAssembler.id, childAssembler)
      units.set(childComputer.id, childComputer)
      
      drawHullWithAttached(
        app, 
        parentHull, 
        (id) => units.get(id) || null,
        180,
        150
      )
      
      // ラベル
      const label = new PIXI.Text({
        text: 'Nested HULLs (Parent + Child)',
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: 'Courier New, monospace',
        },
      })
      label.x = 250 - label.width / 2
      label.y = 220
      app.stage.addChild(label)
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'AssemblerとComputerがひとつずつ固定されている状態のHullに、同じ構成の別のHULLが固定されている状態',
      },
    },
  },
}