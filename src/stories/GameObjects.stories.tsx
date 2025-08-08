import type { Meta, StoryObj } from '@storybook/nextjs'
import * as PIXI from 'pixi.js'
import { withPixi } from '../../.storybook/decorators/pixi'

/**
 * ゲームオブジェクトの描画確認用ストーリー
 * docs/design.mdの仕様に基づいた各オブジェクトの表示を確認
 */
const meta: Meta = {
  title: 'Game/Objects',
  decorators: [withPixi],
  parameters: {
    docs: {
      description: {
        component: 'ゲーム内で使用される各種オブジェクトの描画確認',
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
      // エネルギーオブジェクトを描画
      const energy = new PIXI.Graphics()
      energy.circle(0, 0, 10)
      energy.fill(0xffd700) // #FFD700
      energy.x = 100
      energy.y = 100
      app.stage.addChild(energy)

      // ラベル
      const label = new PIXI.Text({
        text: 'Energy',
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: 'Courier New, monospace',
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
        story: 'エネルギーオブジェクト: #FFD700の小さな円形',
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
        text: 'Energy Source',
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: 'Courier New, monospace',
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
        story: 'エネルギーソース: #FFB700の星形（太陽型）',
      },
    },
  },
}

export const Hull: Story = {
  args: {
    width: 200,
    height: 200,
    renderFunction: (app: PIXI.Application) => {
      // HULLを描画（四角形）
      const hull = new PIXI.Graphics()
      const size = 30
      hull.rect(-size/2, -size/2, size, size)
      hull.fill(0xa9a9a9) // #A9A9A9
      hull.x = 100
      hull.y = 100
      app.stage.addChild(hull)

      // ラベル
      const label = new PIXI.Text({
        text: 'HULL',
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: 'Courier New, monospace',
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
        story: 'HULL: #A9A9A9の四角形',
      },
    },
  },
}

export const HullDamaged: Story = {
  args: {
    width: 200,
    height: 200,
    renderFunction: (app: PIXI.Application) => {
      // ダメージを受けたHULLを描画
      const hull = new PIXI.Graphics()
      const size = 30
      hull.rect(-size/2, -size/2, size, size)
      hull.fill(0xa9a9a9) // #A9A9A9
      
      // HP減少時の赤い縁
      hull.rect(-size/2, -size/2, size, size)
      hull.stroke({ width: 2, color: 0xff0000, alpha: 0.6 })
      
      hull.x = 100
      hull.y = 100
      app.stage.addChild(hull)

      // ラベル
      const label = new PIXI.Text({
        text: 'HULL (Damaged)',
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: 'Courier New, monospace',
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
        story: 'HULL（ダメージ状態）: HP減少時は赤い縁が表示される',
      },
    },
  },
}

export const Assembler: Story = {
  args: {
    width: 200,
    height: 200,
    renderFunction: (app: PIXI.Application) => {
      // ASSEMBLERを描画（正方形）
      const assembler = new PIXI.Graphics()
      const size = 30
      assembler.rect(-size/2, -size/2, size, size)
      assembler.fill(0xff8c00) // #FF8C00
      assembler.x = 100
      assembler.y = 100
      app.stage.addChild(assembler)

      // ラベル
      const label = new PIXI.Text({
        text: 'ASSEMBLER',
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: 'Courier New, monospace',
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
        story: 'ASSEMBLER: #FF8C00の正方形',
      },
    },
  },
}

export const AssemblerActive: Story = {
  args: {
    width: 200,
    height: 200,
    renderFunction: (app: PIXI.Application) => {
      // 活動中のASSEMBLERを描画
      const assembler = new PIXI.Graphics()
      const size = 30
      assembler.rect(-size/2, -size/2, size, size)
      assembler.fill(0xff8c00) // #FF8C00
      
      // 活動中の明るい内側
      assembler.rect(-size/2 + 2, -size/2 + 2, size - 4, size - 4)
      assembler.fill({ color: 0xffd700, alpha: 0.3 })
      
      assembler.x = 100
      assembler.y = 100
      app.stage.addChild(assembler)

      // ラベル
      const label = new PIXI.Text({
        text: 'ASSEMBLER (Active)',
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: 'Courier New, monospace',
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
        story: 'ASSEMBLER（活動中）: 組み立て中は内側が明るくなる',
      },
    },
  },
}

export const Computer: Story = {
  args: {
    width: 200,
    height: 200,
    renderFunction: (app: PIXI.Application) => {
      // COMPUTERを描画（円形）
      const computer = new PIXI.Graphics()
      computer.circle(0, 0, 15)
      computer.fill(0x00bfff) // #00BFFF
      computer.x = 100
      computer.y = 100
      app.stage.addChild(computer)

      // ラベル
      const label = new PIXI.Text({
        text: 'COMPUTER',
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: 'Courier New, monospace',
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
        story: 'COMPUTER: #00BFFFの円形',
      },
    },
  },
}

export const ComputerRunning: Story = {
  args: {
    width: 200,
    height: 200,
    renderFunction: (app: PIXI.Application) => {
      // 動作中のCOMPUTERを描画
      const computer = new PIXI.Graphics()
      computer.circle(0, 0, 15)
      computer.fill(0x00bfff) // #00BFFF
      
      // 動作中の白い点
      computer.circle(0, 0, 3)
      computer.fill({ color: 0xffffff, alpha: 0.9 })
      
      computer.x = 100
      computer.y = 100
      app.stage.addChild(computer)

      // ラベル
      const label = new PIXI.Text({
        text: 'COMPUTER (Running)',
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: 'Courier New, monospace',
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
        story: 'COMPUTER（動作中）: プログラム実行中は中央に白い点が表示される',
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
        text: 'Force Field',
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: 'Courier New, monospace',
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
        story: '力場: rgba(173,216,230,0.2)の薄い円形領域',
      },
    },
  },
}