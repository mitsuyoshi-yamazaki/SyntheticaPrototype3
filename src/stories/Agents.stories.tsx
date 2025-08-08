import type { Meta, StoryObj } from '@storybook/nextjs'
import * as PIXI from 'pixi.js'
import { withPixi } from '../../.storybook/decorators/pixi'
import { drawObject } from '@/lib/render-utils'
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

  // HULLの描画（drawObjectを使用）
  const hullGraphics = new PIXI.Graphics()
  drawObject(hullGraphics, hull, (id) => getUnit(id) ?? undefined)
  container.addChild(hullGraphics)

  // 入れ子のHULLの描画
  hull.attachedUnits.hulls.forEach(hullInfo => {
    const childHull = getUnit(hullInfo.id) as Hull | null
    if (childHull == null) { return }

    // 子HULLは親HULLの横に配置（簡易的にサイズを30として計算）
    const offsetX = 30 * 2.5
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
      drawHullWithAttached(app, hull, (id) => units.get(id) ?? null, 150, 150)
      
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
      drawHullWithAttached(app, hull, (id) => units.get(id) ?? null, 150, 150)
      
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
      drawHullWithAttached(app, hull, (id) => units.get(id) ?? null, 150, 150)
      
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
        (id) => units.get(id) ?? null,
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