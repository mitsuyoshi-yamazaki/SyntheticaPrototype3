import type { Meta, StoryObj } from "@storybook/nextjs"
import * as PIXI from "pixi.js"
import { withPixi } from "../../.storybook/decorators/pixi"
import { drawObject } from "@/lib/render-utils"
import { ObjectFactory } from "@/engine/object-factory"
import type { ObjectId } from "@/types/game"

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

export const Energy: Story = {
  args: {
    width: 200,
    height: 200,
    renderFunction: (app: PIXI.Application) => {
      const factory = new ObjectFactory(800, 600)

      // エネルギーオブジェクトを作成
      const energyObj = factory.createEnergyObject(1 as ObjectId, { x: 100, y: 100 }, 10)

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
    width: 200,
    height: 200,
    renderFunction: (app: PIXI.Application) => {
      // エネルギーソースを描画（太陽型）
      const source = new PIXI.Graphics()
      source.star(0, 0, 8, 20, 12) // 8点の星形、外径20、内径12
      source.fill(0xffb700) // #FFB700

      // 中心の円
      source.circle(0, 0, 8)
      source.fill({ color: 0xffd700, alpha: 0.8 })

      source.x = 100
      source.y = 100
      app.stage.addChild(source)

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

export const ComputerRunning: Story = {
  args: {
    width: 200,
    height: 200,
    renderFunction: (app: PIXI.Application) => {
      const factory = new ObjectFactory(800, 600)

      // 動作中のCOMPUTERを作成
      const computerObj = factory.createComputer(1 as ObjectId, { x: 100, y: 100 }, 1, 64)
      computerObj.isRunning = true // 動作中に設定

      // COMPUTERを描画
      const computer = new PIXI.Graphics()
      drawObject(computer, computerObj)
      computer.x = computerObj.position.x
      computer.y = computerObj.position.y
      app.stage.addChild(computer)

      // ラベル
      const label = new PIXI.Text({
        text: "COMPUTER (Running)",
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
        story: "COMPUTER（動作中）: プログラム実行中は中央に白い点が表示される",
      },
    },
  },
}

export const ForceField: Story = {
  args: {
    width: 300,
    height: 300,
    renderFunction: (app: PIXI.Application) => {
      // 力場を描画（薄い円形）
      const field = new PIXI.Graphics()
      field.circle(0, 0, 80)
      field.fill({ color: 0xadd8e6, alpha: 0.2 }) // rgba(173,216,230,0.2)
      field.x = 150
      field.y = 150
      app.stage.addChild(field)

      // 力場の中心点
      const center = new PIXI.Graphics()
      center.circle(0, 0, 3)
      center.fill(0xadd8e6)
      center.x = 150
      center.y = 150
      app.stage.addChild(center)

      // ラベル
      const label = new PIXI.Text({
        text: "Force Field",
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: "Courier New, monospace",
        },
      })
      label.x = 150 - label.width / 2
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
