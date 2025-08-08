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

const ValidationValues = {
  hull: {
    capacity: {
      min: 2000,
      max: 50000,
      step: 1000,
    },
  },
  assembler: {
    count: {
      min: 1,
      max: 8,
      step: 1,
    },
    power: {
      min: 10,
      max: 1000,
      step: 10,
    },
  },
  computer: {
    count: {
      min: 1,
      max: 8,
      step: 1,
    },
    power: {
      min: 1,
      max: 10,
      step: 1,
    },
  },
}
const validate = (value: number, validation: { min: number; max: number }): number => {
  return Math.max(validation.min, Math.min(validation.max, value))
}

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

// type ConnectedHullsStory = StoryObj<{
//   backgroundColor?: number
//   renderFunction?: (app: PIXI.Application) => void
// }>

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
  // // 入れ子のHULLの描画
  // hull.attachedUnits.hulls.forEach(hullInfo => {
  //   const childHull = getUnit(hullInfo.id) as Hull | null
  //   if (childHull == null) {
  //     return
  //   }
  //   // 子HULLは親HULLの横に配置（簡易的にサイズを30として計算）
  //   const offsetX = 30 * 2.5
  //   drawHullWithAttached(app, childHull, getUnit, x + offsetX, y)
  // })
  app.stage.addChild(container)
}

export const HullWithAssembler: HullWithAssemblerStory = {
  args: {
    hullCapacity: 200,
    assemblerCount: 1,
    firstAssemblerPower: 1,
    renderFunction(
      this: { hullCapacity: number; assemblerCount: number; firstAssemblerPower: number },
      app: PIXI.Application
    ) {
      const factory = new ObjectFactory(800, 600)

      // arg値の範囲制限
      const hullCapacity = validate(this.hullCapacity, ValidationValues.hull.capacity)
      const assemblerCount = validate(this.assemblerCount, ValidationValues.assembler.count)
      const firstAssemblerPower = validate(
        this.firstAssemblerPower,
        ValidationValues.assembler.power
      )

      // HULLを作成
      const hull = factory.createHull(1 as ObjectId, { x: 0, y: 0 }, hullCapacity)

      // ASSEMBLERを作成
      const assemblers: Assembler[] = []

      for (let i = 0; i < assemblerCount; i++) {
        const power = i === 0 ? firstAssemblerPower : 1
        const assembler = factory.createAssembler(
          (i + 2) as ObjectId,
          { x: 0, y: 0 },
          power,
          hull.id
        )
        assemblers.push(assembler)
      }

      // HULLに接続
      hull.attachedUnitIds.push(...assemblers.map(assembler => assembler.id))

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
      control: { type: "range", ...ValidationValues.hull.capacity },
      description: "HULLの容量",
    },
    assemblerCount: {
      control: { type: "range", ...ValidationValues.assembler.count },
      description: "ASSEMBLERの個数",
    },
    firstAssemblerPower: {
      control: { type: "range", ...ValidationValues.assembler.power },
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
    hullCapacity: 200,
    computerCount: 1,
    firstComputerPower: 1,
    renderFunction(
      this: { hullCapacity: number; computerCount: number; firstComputerPower: number },
      app: PIXI.Application
    ) {
      const factory = new ObjectFactory(800, 600)

      // arg値の範囲制限
      const hullCapacity = validate(this.hullCapacity, ValidationValues.hull.capacity)
      const computerCount = validate(this.computerCount, ValidationValues.computer.count)
      const firstComputerPower = validate(this.firstComputerPower, ValidationValues.computer.power)

      // HULLを作成
      const hull = factory.createHull(1 as ObjectId, { x: 0, y: 0 }, hullCapacity)

      // COMPUTERを作成
      const computers: Computer[] = []
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
      }

      // HULLに接続
      hull.attachedUnitIds.push(...computers.map(computer => computer.id))

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
      control: { type: "range", ...ValidationValues.hull.capacity },
      description: "HULLの容量",
    },
    computerCount: {
      control: { type: "range", ...ValidationValues.computer.count },
      description: "COMPUTERの個数",
    },
    firstComputerPower: {
      control: { type: "range", ...ValidationValues.computer.power },
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
    hullCapacity: 200,
    assemblerCount: 1,
    computerCount: 1,
    renderFunction(
      this: { hullCapacity: number; assemblerCount: number; computerCount: number },
      app: PIXI.Application
    ) {
      const factory = new ObjectFactory(800, 600)

      // arg値の範囲制限
      const hullCapacity = validate(this.hullCapacity, ValidationValues.hull.capacity)
      const assemblerCount = validate(this.assemblerCount, ValidationValues.assembler.count)
      const computerCount = validate(this.computerCount, ValidationValues.computer.count)

      // HULLを作成
      const hull = factory.createHull(1 as ObjectId, { x: 0, y: 0 }, hullCapacity)

      // ASSEMBLERを作成
      const assemblers: Assembler[] = []

      for (let i = 0; i < assemblerCount; i++) {
        const assembler = factory.createAssembler((i + 2) as ObjectId, { x: 0, y: 0 }, 200, hull.id)
        assemblers.push(assembler)
      }

      // COMPUTERを作成
      const computers: Computer[] = []

      for (let i = 0; i < computerCount; i++) {
        const computer = factory.createComputer(
          (i + assemblerCount + 2) as ObjectId,
          { x: 0, y: 0 },
          1,
          64,
          hull.id
        )
        computers.push(computer)
      }

      // HULLに接続
      hull.attachedUnitIds.push(...assemblers.map(assembler => assembler.id))
      hull.attachedUnitIds.push(...computers.map(computer => computer.id))

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
      control: { type: "range", ...ValidationValues.hull.capacity },
      description: "HULLの容量",
    },
    assemblerCount: {
      control: { type: "range", ...ValidationValues.assembler.count },
      description: "ASSEMBLERの個数",
    },
    computerCount: {
      control: { type: "range", ...ValidationValues.computer.count },
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

// export const ConnectedHulls: ConnectedHullsStory = {
//   args: {
//     renderFunction: (app: PIXI.Application) => {
//       const factory = new ObjectFactory(800, 600)

//       // 親HULLを作成
//       const parentHull = factory.createHull(1 as ObjectId, { x: 0, y: 0 }, 100)

//       // 親HULL用のユニット
//       const parentAssembler = factory.createAssembler(
//         2 as ObjectId,
//         { x: 0, y: 0 },
//         1,
//         parentHull.id
//       )
//       const parentComputer = factory.createComputer(
//         3 as ObjectId,
//         { x: 0, y: 0 },
//         1,
//         64,
//         parentHull.id
//       )

//       // 子HULLを作成
//       const childHull = factory.createHull(4 as ObjectId, { x: 0, y: 0 }, 100)

//       // 子HULL用のユニット
//       const childAssembler = factory.createAssembler(5 as ObjectId, { x: 0, y: 0 }, 1, childHull.id)
//       const childComputer = factory.createComputer(
//         6 as ObjectId,
//         { x: 0, y: 0 },
//         1,
//         64,
//         childHull.id
//       )

//       // 子HULLにユニットを接続
//       childHull.attachedUnits = {
//         hulls: [],
//         assemblers: [{ id: childAssembler.id, visualData: { angle: 0 } }],
//         computers: [{ id: childComputer.id, visualData: { startAngle: 0, endAngle: 360 } }],
//       }

//       // 親HULLにユニットと子HULLを接続
//       parentHull.attachedUnits = {
//         hulls: [{ id: childHull.id }],
//         assemblers: [{ id: parentAssembler.id, visualData: { angle: 180 } }],
//         computers: [{ id: parentComputer.id, visualData: { startAngle: 0, endAngle: 360 } }],
//       }

//       // 描画
//       const units = new Map<ObjectId, Assembler | Computer | Hull>()
//       units.set(parentAssembler.id, parentAssembler)
//       units.set(parentComputer.id, parentComputer)
//       units.set(childHull.id, childHull)
//       units.set(childAssembler.id, childAssembler)
//       units.set(childComputer.id, childComputer)

//       drawHullWithAttached(app, parentHull, id => units.get(id) ?? null, 180, 150)

//       // ラベル
//       const label = new PIXI.Text({
//         text: "Connected HULLs",
//         style: {
//           fontSize: 14,
//           fill: 0xffffff,
//           fontFamily: "Courier New, monospace",
//         },
//       })
//       label.x = 250 - label.width / 2
//       label.y = 220
//       app.stage.addChild(label)
//     },
//   },
//   parameters: {
//     docs: {
//       description: {
//         story:
//           "AssemblerとComputerがひとつずつ固定されている状態のHullに、同じ構成の別のHULLが固定されている状態",
//       },
//     },
//   },
// }
