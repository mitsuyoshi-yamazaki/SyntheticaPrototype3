import type { Meta, StoryObj } from "@storybook/nextjs"
import * as PIXI from "pixi.js"
import { withPixi } from "../../.storybook/decorators/pixi"
import { drawEnergySource, drawForceField, drawObject } from "@/lib/render-utils"
import { ObjectFactory } from "@/engine/object-factory"
import type {
  LinearForceField as LinearForceFieldType,
  RadialForceField as RadialForceFieldType,
  SpiralForceField as SpiralForceFieldType,
  ObjectId,
  EnergySource as EnergySourceType,
} from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"

/**
 * ゲームオブジェクトの描画確認用ストーリー
 * docs/design.mdの仕様に基づいた各オブジェクトの表示を確認
 */
const meta: Meta = {
  title: "Game/Objects",
  decorators: [withPixi],
  parameters: {
    docs: {
      description: {
        component: "ゲーム内で使用される各種オブジェクトの描画確認",
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

type EnergyStory = StoryObj<{
  energyAmount: number
  renderFunction?: (app: PIXI.Application) => void
}>

export const Energy: EnergyStory = {
  args: {
    energyAmount: 10000,
    renderFunction(this: { energyAmount: number }, app: PIXI.Application): void {
      const factory = new ObjectFactory(800, 600)

      // エネルギーオブジェクトを作成
      const energyObj = factory.createEnergyObject(
        1 as ObjectId,
        { x: 100, y: 100 },
        this.energyAmount
      )

      // エネルギーオブジェクトを描画
      const energy = new PIXI.Graphics()
      drawObject(energy, energyObj)
      energy.x = energyObj.position.x
      energy.y = energyObj.position.y
      app.stage.addChild(energy)

      // ラベル
      const label = new PIXI.Text({
        text: "Energy",
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: "Courier New, monospace",
        },
      })
      label.x = 100 - label.width / 2
      label.y = 130
      app.stage.addChild(label)
    },
  },
  argTypes: {
    energyAmount: {
      control: { type: "range", min: 100, max: 100000, step: 100 },
      description: "エネルギー量",
    },
  },
  parameters: {
    docs: {
      description: {
        story: "エネルギーオブジェクト: #FFD700の小さな円形",
      },
    },
  },
}

export const EnergySource: Story = {
  args: {
    renderFunction: (app: PIXI.Application) => {
      // エネルギーソースを描画（太陽型）
      const sourceGraphics = new PIXI.Graphics()
      const source: EnergySourceType = {
        id: 1000001 as ObjectId, // 固定ID使用
        position: Vec2Utils.create(200, 150),
        energyPerTick: 400,
      }

      drawEnergySource(sourceGraphics, source)

      app.stage.addChild(sourceGraphics)

      // ラベル
      const label = new PIXI.Text({
        text: "Energy Source",
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: "Courier New, monospace",
        },
      })
      label.x = 100 - label.width / 2
      label.y = 140
      app.stage.addChild(label)
    },
  },
  parameters: {
    docs: {
      description: {
        story: "エネルギーソース: #FFB700の星形（太陽型）",
      },
    },
  },
}

export const Hull: Story = {
  args: {
    width: 200,
    height: 200,
    renderFunction: (app: PIXI.Application) => {
      const factory = new ObjectFactory(800, 600)

      // HULLを作成
      const hullObj = factory.createHull(1 as ObjectId, { x: 100, y: 100 }, 100)

      // HULLを描画
      const hull = new PIXI.Graphics()
      drawObject(hull, hullObj)
      hull.x = hullObj.position.x
      hull.y = hullObj.position.y
      app.stage.addChild(hull)

      // ラベル
      const label = new PIXI.Text({
        text: "HULL",
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: "Courier New, monospace",
        },
      })
      label.x = 100 - label.width / 2
      label.y = 130
      app.stage.addChild(label)
    },
  },
  parameters: {
    docs: {
      description: {
        story: "HULL: #A9A9A9の四角形",
      },
    },
  },
}

export const HullDamaged: Story = {
  args: {
    width: 200,
    height: 200,
    renderFunction: (app: PIXI.Application) => {
      const factory = new ObjectFactory(800, 600)

      // ダメージを受けたHULLを作成
      const hullObj = factory.createHull(1 as ObjectId, { x: 100, y: 100 }, 100)
      hullObj.currentEnergy = hullObj.buildEnergy * 0.3 // HPを30%に減らす

      // HULLを描画
      const hull = new PIXI.Graphics()
      drawObject(hull, hullObj)
      hull.x = hullObj.position.x
      hull.y = hullObj.position.y
      app.stage.addChild(hull)

      // ラベル
      const label = new PIXI.Text({
        text: "HULL (Damaged)",
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: "Courier New, monospace",
        },
      })
      label.x = 100 - label.width / 2
      label.y = 130
      app.stage.addChild(label)
    },
  },
  parameters: {
    docs: {
      description: {
        story: "HULL（ダメージ状態）: HP減少時は赤い縁が表示される",
      },
    },
  },
}

export const Assembler: Story = {
  args: {
    width: 200,
    height: 200,
    renderFunction: (app: PIXI.Application) => {
      const factory = new ObjectFactory(800, 600)

      // ASSEMBLERを作成（parentHullなし）
      const assemblerObj = factory.createAssembler(1 as ObjectId, { x: 100, y: 100 }, 1)

      // ASSEMBLERを描画
      const assembler = new PIXI.Graphics()
      drawObject(assembler, assemblerObj)
      assembler.x = assemblerObj.position.x
      assembler.y = assemblerObj.position.y
      app.stage.addChild(assembler)

      // ラベル
      const label = new PIXI.Text({
        text: "ASSEMBLER",
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: "Courier New, monospace",
        },
      })
      label.x = 100 - label.width / 2
      label.y = 130
      app.stage.addChild(label)
    },
  },
  parameters: {
    docs: {
      description: {
        story: "ASSEMBLER: #FF8C00の正方形",
      },
    },
  },
}

export const AssemblerActive: Story = {
  args: {
    width: 200,
    height: 200,
    renderFunction: (app: PIXI.Application) => {
      const factory = new ObjectFactory(800, 600)

      // 活動中のASSEMBLERを作成
      const assemblerObj = factory.createAssembler(1 as ObjectId, { x: 100, y: 100 }, 1)
      assemblerObj.isAssembling = true // 活動中に設定

      // ASSEMBLERを描画
      const assembler = new PIXI.Graphics()
      drawObject(assembler, assemblerObj)
      assembler.x = assemblerObj.position.x
      assembler.y = assemblerObj.position.y
      app.stage.addChild(assembler)

      // ラベル
      const label = new PIXI.Text({
        text: "ASSEMBLER (Active)",
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: "Courier New, monospace",
        },
      })
      label.x = 100 - label.width / 2
      label.y = 130
      app.stage.addChild(label)
    },
  },
  parameters: {
    docs: {
      description: {
        story: "ASSEMBLER（活動中）: 組み立て中は内側が明るくなる",
      },
    },
  },
}

export const Computer: Story = {
  args: {
    width: 200,
    height: 200,
    renderFunction: (app: PIXI.Application) => {
      const factory = new ObjectFactory(800, 600)

      // COMPUTERを作成
      const computerObj = factory.createComputer(1 as ObjectId, { x: 100, y: 100 }, 1, 64)

      // COMPUTERを描画
      const computer = new PIXI.Graphics()
      drawObject(computer, computerObj)
      computer.x = computerObj.position.x
      computer.y = computerObj.position.y
      app.stage.addChild(computer)

      // ラベル
      const label = new PIXI.Text({
        text: "COMPUTER",
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: "Courier New, monospace",
        },
      })
      label.x = 100 - label.width / 2
      label.y = 130
      app.stage.addChild(label)
    },
  },
  parameters: {
    docs: {
      description: {
        story: "COMPUTER: #00BFFFの円形",
      },
    },
  },
}

export const LinearForceField: Story = {
  args: {
    renderFunction: (app: PIXI.Application) => {
      // 力場を描画（薄い円形）
      const field = new PIXI.Graphics()
      const forceField: LinearForceFieldType = {
        id: 1000001 as ObjectId, // 固定ID使用
        type: "LINEAR",
        position: Vec2Utils.create(200, 150),
        radius: 300 * 0.4,
        strength: 20,
        direction: Vec2Utils.create(1, 0),
      }
      drawForceField(field, forceField)

      app.stage.addChild(field)

      // ラベル
      const label = new PIXI.Text({
        text: "Force Field",
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: "Courier New, monospace",
        },
      })
      label.x = 200 - label.width / 2
      label.y = 250
      app.stage.addChild(label)
    },
  },
  parameters: {
    docs: {
      description: {
        story: "力場: rgba(173,216,230,0.2)の薄い円形領域",
      },
    },
  },
}

export const RadialForceField: Story = {
  args: {
    renderFunction: (app: PIXI.Application) => {
      // 力場を描画（薄い円形）
      const field = new PIXI.Graphics()
      const forceField: RadialForceFieldType = {
        id: 1000001 as ObjectId, // 固定ID使用
        type: "RADIAL",
        position: Vec2Utils.create(200, 150),
        radius: 300 * 0.4,
        strength: 20,
      }
      drawForceField(field, forceField)

      app.stage.addChild(field)

      // ラベル
      const label = new PIXI.Text({
        text: "Force Field",
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: "Courier New, monospace",
        },
      })
      label.x = 200 - label.width / 2
      label.y = 250
      app.stage.addChild(label)
    },
  },
  parameters: {
    docs: {
      description: {
        story: "力場: rgba(173,216,230,0.2)の薄い円形領域",
      },
    },
  },
}

export const SpiralForceField: Story = {
  args: {
    renderFunction: (app: PIXI.Application) => {
      // 力場を描画（薄い円形）
      const field = new PIXI.Graphics()
      const forceField: SpiralForceFieldType = {
        id: 1000001 as ObjectId, // 固定ID使用
        type: "SPIRAL",
        position: Vec2Utils.create(200, 150),
        radius: 300 * 0.4,
        strength: 20,
      }
      drawForceField(field, forceField)

      app.stage.addChild(field)

      // ラベル
      const label = new PIXI.Text({
        text: "Force Field",
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: "Courier New, monospace",
        },
      })
      label.x = 200 - label.width / 2
      label.y = 250
      app.stage.addChild(label)
    },
  },
  parameters: {
    docs: {
      description: {
        story: "力場: rgba(173,216,230,0.2)の薄い円形領域",
      },
    },
  },
}
