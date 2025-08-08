import type { Meta, StoryObj } from "@storybook/nextjs"
import * as PIXI from "pixi.js"
import { withPixi } from "../../.storybook/decorators/pixi"
import { drawObject } from "@/lib/render-utils"
import { ObjectFactory } from "@/engine/object-factory"
import type { Hull, Assembler, Computer, ObjectId } from "@/types/game"

/**
 * エージェント（複数ユニットの組み合わせ）の描画確認用ストーリー
 * docs/デザイン仕様/v2/デザイン仕様.mdの仕様に基づいた表示を確認
 */
const meta: Meta = {
  title: "Game/Agents",
  decorators: [withPixi],
  parameters: {
    docs: {
      description: {
        component: "エージェント（複数ユニットの組み合わせ）の描画確認",
      },
    },
  },
}

export default meta

type HullWithAssemblerStory = StoryObj<{
  backgroundColor?: number
  hullCapacity: number
  assemblerCount: number
  firstAssemblerPower: number
  renderFunction?: (app: PIXI.Application) => void
}>

type HullWithComputerStory = StoryObj<{
  backgroundColor?: number
  hullCapacity: number
  computerCount: number
  firstComputerPower: number
  renderFunction?: (app: PIXI.Application) => void
}>

type HullWithBothStory = StoryObj<{
  backgroundColor?: number
  hullCapacity: number
  assemblerCount: number
  computerCount: number
  renderFunction?: (app: PIXI.Application) => void
}>

type ConnectedHullsStory = StoryObj<{
  backgroundColor?: number
  renderFunction?: (app: PIXI.Application) => void
}>

// 描画用ヘルパー関数
const drawHullWithAttached = (
  app: PIXI.Application,
  hull: Hull,
  getUnit: (id: ObjectId) => Assembler | Computer | Hull | null,
  x: number,
  y: number
) => {
  const container = new PIXI.Container()
  container.x = x
  container.y = y

  // HULLの描画（drawObjectを使用）
  const hullGraphics = new PIXI.Graphics()
  drawObject(hullGraphics, hull, id => getUnit(id) ?? undefined)
  container.addChild(hullGraphics)

  // 入れ子のHULLの描画
  hull.attachedUnits.hulls.forEach(hullInfo => {
    const childHull = getUnit(hullInfo.id) as Hull | null
    if (childHull == null) {
      return
    }

    // 子HULLは親HULLの横に配置（簡易的にサイズを30として計算）
    const offsetX = 30 * 2.5
    drawHullWithAttached(app, childHull, getUnit, x + offsetX, y)
  })

  app.stage.addChild(container)
}

export const HullWithAssembler: HullWithAssemblerStory = {
  args: {
    hullCapacity: 100,
    assemblerCount: 1,
    firstAssemblerPower: 1,
    renderFunction(
      this: { hullCapacity: number; assemblerCount: number; firstAssemblerPower: number },
      app: PIXI.Application
    ) {
      const factory = new ObjectFactory(800, 600)

      // arg値の範囲制限
      const hullCapacity = Math.max(50, Math.min(500, this.hullCapacity))
      const assemblerCount = Math.max(1, Math.min(8, this.assemblerCount))
      const firstAssemblerPower = Math.max(1, Math.min(10, this.firstAssemblerPower))

      // HULLを作成
      const hull = factory.createHull(1 as ObjectId, { x: 0, y: 0 }, hullCapacity)

      // ASSEMBLERを作成
      const assemblers: Assembler[] = []
      const assemblerInfos: { id: ObjectId; visualData: { angle: number } }[] = []

      for (let i = 0; i < assemblerCount; i++) {
        const power = i === 0 ? firstAssemblerPower : 1
        const assembler = factory.createAssembler(
          (i + 2) as ObjectId,
          { x: 0, y: 0 },
          power,
          hull.id
        )
        assemblers.push(assembler)
        assemblerInfos.push({
          id: assembler.id,
          visualData: { angle: (360 / assemblerCount) * i },
        })
      }

      // HULLに接続
      hull.attachedUnits = {
        hulls: [],
        assemblers: assemblerInfos,
        computers: [],
      }

      // 描画
      const units = new Map<ObjectId, Assembler | Computer>()
      assemblers.forEach(a => units.set(a.id, a))
      drawHullWithAttached(app, hull, id => units.get(id) ?? null, 150, 150)

      // ラベル
      const label = new PIXI.Text({
        text: "HULL with ASSEMBLER",
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: "Courier New, monospace",
        },
      })
      label.x = 150 - label.width / 2
      label.y = 220
      app.stage.addChild(label)
    },
  },
  argTypes: {
    hullCapacity: {
      control: { type: "range", min: 50, max: 500, step: 10 },
      description: "HULLの容量",
    },
    assemblerCount: {
      control: { type: "range", min: 1, max: 8, step: 1 },
      description: "ASSEMBLERの個数",
    },
    firstAssemblerPower: {
      control: { type: "range", min: 1, max: 10, step: 1 },
      description: "最初のASSEMBLERのパワー",
    },
  },
  parameters: {
    docs: {
      description: {
        story: "HULLにASSEMBLERがひとつ固定されている状態",
      },
    },
  },
}

export const HullWithComputer: HullWithComputerStory = {
  args: {
    hullCapacity: 100,
    computerCount: 1,
    firstComputerPower: 1,
    renderFunction(
      this: { hullCapacity: number; computerCount: number; firstComputerPower: number },
      app: PIXI.Application
    ) {
      const factory = new ObjectFactory(800, 600)

      // arg値の範囲制限
      const hullCapacity = Math.max(50, Math.min(500, this.hullCapacity))
      const computerCount = Math.max(1, Math.min(8, this.computerCount))
      const firstComputerPower = Math.max(1, Math.min(10, this.firstComputerPower))

      // HULLを作成
      const hull = factory.createHull(1 as ObjectId, { x: 0, y: 0 }, hullCapacity)

      // COMPUTERを作成
      const computers: Computer[] = []
      const computerInfos: {
        id: ObjectId
        visualData: { startAngle: number; endAngle: number }
      }[] = []

      const anglePerComputer = 360 / computerCount
      for (let i = 0; i < computerCount; i++) {
        const power = i === 0 ? firstComputerPower : 1
        const computer = factory.createComputer(
          (i + 2) as ObjectId,
          { x: 0, y: 0 },
          power,
          64,
          hull.id
        )
        computers.push(computer)
        computerInfos.push({
          id: computer.id,
          visualData: {
            startAngle: anglePerComputer * i,
            endAngle: anglePerComputer * (i + 1),
          },
        })
      }

      // HULLに接続
      hull.attachedUnits = {
        hulls: [],
        assemblers: [],
        computers: computerInfos,
      }

      // 描画
      const units = new Map<ObjectId, Assembler | Computer>()
      computers.forEach(c => units.set(c.id, c))
      drawHullWithAttached(app, hull, id => units.get(id) ?? null, 150, 150)

      // ラベル
      const label = new PIXI.Text({
        text: "HULL with COMPUTER",
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: "Courier New, monospace",
        },
      })
      label.x = 150 - label.width / 2
      label.y = 220
      app.stage.addChild(label)
    },
  },
  argTypes: {
    hullCapacity: {
      control: { type: "range", min: 50, max: 500, step: 10 },
      description: "HULLの容量",
    },
    computerCount: {
      control: { type: "range", min: 1, max: 8, step: 1 },
      description: "COMPUTERの個数",
    },
    firstComputerPower: {
      control: { type: "range", min: 1, max: 10, step: 1 },
      description: "最初のCOMPUTERのパワー",
    },
  },
  parameters: {
    docs: {
      description: {
        story: "HULLにCOMPUTERがひとつ固定されている状態",
      },
    },
  },
}

export const HullWithBoth: HullWithBothStory = {
  args: {
    hullCapacity: 100,
    assemblerCount: 1,
    computerCount: 1,
    renderFunction(
      this: { hullCapacity: number; assemblerCount: number; computerCount: number },
      app: PIXI.Application
    ) {
      const factory = new ObjectFactory(800, 600)

      // arg値の範囲制限
      const hullCapacity = Math.max(50, Math.min(500, this.hullCapacity))
      const assemblerCount = Math.max(1, Math.min(4, this.assemblerCount))
      const computerCount = Math.max(1, Math.min(4, this.computerCount))

      // HULLを作成
      const hull = factory.createHull(1 as ObjectId, { x: 0, y: 0 }, hullCapacity)

      // ASSEMBLERを作成
      const assemblers: Assembler[] = []
      const assemblerInfos: { id: ObjectId; visualData: { angle: number } }[] = []

      for (let i = 0; i < assemblerCount; i++) {
        const assembler = factory.createAssembler((i + 2) as ObjectId, { x: 0, y: 0 }, 1, hull.id)
        assemblers.push(assembler)
        assemblerInfos.push({
          id: assembler.id,
          visualData: { angle: (360 / assemblerCount) * i },
        })
      }

      // COMPUTERを作成
      const computers: Computer[] = []
      const computerInfos: {
        id: ObjectId
        visualData: { startAngle: number; endAngle: number }
      }[] = []

      const anglePerComputer = 360 / computerCount
      for (let i = 0; i < computerCount; i++) {
        const computer = factory.createComputer(
          (i + assemblerCount + 2) as ObjectId,
          { x: 0, y: 0 },
          1,
          64,
          hull.id
        )
        computers.push(computer)
        computerInfos.push({
          id: computer.id,
          visualData: {
            startAngle: anglePerComputer * i,
            endAngle: anglePerComputer * (i + 1),
          },
        })
      }

      // HULLに接続
      hull.attachedUnits = {
        hulls: [],
        assemblers: assemblerInfos,
        computers: computerInfos,
      }

      // 描画
      const units = new Map<ObjectId, Assembler | Computer>()
      assemblers.forEach(a => units.set(a.id, a))
      computers.forEach(c => units.set(c.id, c))
      drawHullWithAttached(app, hull, id => units.get(id) ?? null, 150, 150)

      // ラベル
      const label = new PIXI.Text({
        text: "HULL with ASSEMBLER + COMPUTER",
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: "Courier New, monospace",
        },
      })
      label.x = 150 - label.width / 2
      label.y = 220
      app.stage.addChild(label)
    },
  },
  argTypes: {
    hullCapacity: {
      control: { type: "range", min: 50, max: 500, step: 10 },
      description: "HULLの容量",
    },
    assemblerCount: {
      control: { type: "range", min: 1, max: 4, step: 1 },
      description: "ASSEMBLERの個数",
    },
    computerCount: {
      control: { type: "range", min: 1, max: 4, step: 1 },
      description: "COMPUTERの個数",
    },
  },
  parameters: {
    docs: {
      description: {
        story: "HULLにASSEMBLERとCOMPUTERがひとつずつ固定されている状態",
      },
    },
  },
}

export const ConnectedHulls: ConnectedHullsStory = {
  args: {
    renderFunction: (app: PIXI.Application) => {
      const factory = new ObjectFactory(800, 600)

      // 親HULLを作成
      const parentHull = factory.createHull(1 as ObjectId, { x: 0, y: 0 }, 100)

      // 親HULL用のユニット
      const parentAssembler = factory.createAssembler(
        2 as ObjectId,
        { x: 0, y: 0 },
        1,
        parentHull.id
      )
      const parentComputer = factory.createComputer(
        3 as ObjectId,
        { x: 0, y: 0 },
        1,
        64,
        parentHull.id
      )

      // 子HULLを作成
      const childHull = factory.createHull(4 as ObjectId, { x: 0, y: 0 }, 100)

      // 子HULL用のユニット
      const childAssembler = factory.createAssembler(5 as ObjectId, { x: 0, y: 0 }, 1, childHull.id)
      const childComputer = factory.createComputer(
        6 as ObjectId,
        { x: 0, y: 0 },
        1,
        64,
        childHull.id
      )

      // 子HULLにユニットを接続
      childHull.attachedUnits = {
        hulls: [],
        assemblers: [{ id: childAssembler.id, visualData: { angle: 0 } }],
        computers: [{ id: childComputer.id, visualData: { startAngle: 0, endAngle: 360 } }],
      }

      // 親HULLにユニットと子HULLを接続
      parentHull.attachedUnits = {
        hulls: [{ id: childHull.id }],
        assemblers: [{ id: parentAssembler.id, visualData: { angle: 180 } }],
        computers: [{ id: parentComputer.id, visualData: { startAngle: 0, endAngle: 360 } }],
      }

      // 描画
      const units = new Map<ObjectId, Assembler | Computer | Hull>()
      units.set(parentAssembler.id, parentAssembler)
      units.set(parentComputer.id, parentComputer)
      units.set(childHull.id, childHull)
      units.set(childAssembler.id, childAssembler)
      units.set(childComputer.id, childComputer)

      drawHullWithAttached(app, parentHull, id => units.get(id) ?? null, 180, 150)

      // ラベル
      const label = new PIXI.Text({
        text: "Connected HULLs",
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: "Courier New, monospace",
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
        story:
          "AssemblerとComputerがひとつずつ固定されている状態のHullに、同じ構成の別のHULLが固定されている状態",
      },
    },
  },
}
