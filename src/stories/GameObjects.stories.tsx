import React, { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import * as PIXI from 'pixi.js'
import { withPixi, setupPixiApp } from '../../.storybook/decorators/pixi'

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
  containerRef: React.RefObject<HTMLDivElement>
  appRef: React.RefObject<PIXI.Application | null>
}>

// コンポーネントの型定義
type PixiComponentProps = {
  containerRef: React.RefObject<HTMLDivElement>
  appRef: React.RefObject<PIXI.Application | null>
}

// エネルギーオブジェクト
const EnergyComponent = ({ containerRef, appRef }: PixiComponentProps) => {
  useEffect(() => {
    if (!containerRef?.current) return

    const setup = async () => {
      const app = await setupPixiApp(containerRef.current, {
        width: 200,
        height: 200,
      })
      if (appRef?.current !== undefined) {
        appRef.current = app
      }

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
    }

    void setup()
  }, [containerRef, appRef])

  return <></>
}

export const Energy: Story = {
  render: (args) => <EnergyComponent {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'エネルギーオブジェクト: #FFD700の小さな円形',
      },
    },
  },
}

// エネルギーソース
const EnergySourceComponent = ({ containerRef, appRef }: PixiComponentProps) => {
  useEffect(() => {
    if (!containerRef?.current) return

    const setup = async () => {
      const app = await setupPixiApp(containerRef.current, {
        width: 200,
        height: 200,
      })
      if (appRef?.current !== undefined) {
        appRef.current = app
      }

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
    }

    void setup()
  }, [containerRef, appRef])

  return <></>
}

export const EnergySource: Story = {
  render: (args) => <EnergySourceComponent {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'エネルギーソース: #FFB700の星形（太陽型）',
      },
    },
  },
}

// HULL
const HullComponent = ({ containerRef, appRef }: PixiComponentProps) => {
  useEffect(() => {
    if (!containerRef?.current) return

    const setup = async () => {
      const app = await setupPixiApp(containerRef.current, {
        width: 200,
        height: 200,
      })
      if (appRef?.current !== undefined) {
        appRef.current = app
      }

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
    }

    void setup()
  }, [containerRef, appRef])

  return <></>
}

export const Hull: Story = {
  render: (args) => <HullComponent {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'HULL: #A9A9A9の四角形',
      },
    },
  },
}

// HULL（ダメージ状態）
const HullDamagedComponent = ({ containerRef, appRef }: PixiComponentProps) => {
  useEffect(() => {
    if (!containerRef?.current) return

    const setup = async () => {
      const app = await setupPixiApp(containerRef.current, {
        width: 200,
        height: 200,
      })
      if (appRef?.current !== undefined) {
        appRef.current = app
      }

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
    }

    void setup()
  }, [containerRef, appRef])

  return <></>
}

export const HullDamaged: Story = {
  render: (args) => <HullDamagedComponent {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'HULL（ダメージ状態）: HP減少時は赤い縁が表示される',
      },
    },
  },
}

// ASSEMBLER
const AssemblerComponent = ({ containerRef, appRef }: PixiComponentProps) => {
  useEffect(() => {
    if (!containerRef?.current) return

    const setup = async () => {
      const app = await setupPixiApp(containerRef.current, {
        width: 200,
        height: 200,
      })
      if (appRef?.current !== undefined) {
        appRef.current = app
      }

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
    }

    void setup()
  }, [containerRef, appRef])

  return <></>
}

export const Assembler: Story = {
  render: (args) => <AssemblerComponent {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'ASSEMBLER: #FF8C00の正方形',
      },
    },
  },
}

// ASSEMBLER（活動中）
const AssemblerActiveComponent = ({ containerRef, appRef }: PixiComponentProps) => {
  useEffect(() => {
    if (!containerRef?.current) return

    const setup = async () => {
      const app = await setupPixiApp(containerRef.current, {
        width: 200,
        height: 200,
      })
      if (appRef?.current !== undefined) {
        appRef.current = app
      }

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
    }

    void setup()
  }, [containerRef, appRef])

  return <></>
}

export const AssemblerActive: Story = {
  render: (args) => <AssemblerActiveComponent {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'ASSEMBLER（活動中）: 組み立て中は内側が明るくなる',
      },
    },
  },
}

// COMPUTER
const ComputerComponent = ({ containerRef, appRef }: PixiComponentProps) => {
  useEffect(() => {
    if (!containerRef?.current) return

    const setup = async () => {
      const app = await setupPixiApp(containerRef.current, {
        width: 200,
        height: 200,
      })
      if (appRef?.current !== undefined) {
        appRef.current = app
      }

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
    }

    void setup()
  }, [containerRef, appRef])

  return <></>
}

export const Computer: Story = {
  render: (args) => <ComputerComponent {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'COMPUTER: #00BFFFの円形',
      },
    },
  },
}

// COMPUTER（動作中）
const ComputerRunningComponent = ({ containerRef, appRef }: PixiComponentProps) => {
  useEffect(() => {
    if (!containerRef?.current) return

    const setup = async () => {
      const app = await setupPixiApp(containerRef.current, {
        width: 200,
        height: 200,
      })
      if (appRef?.current !== undefined) {
        appRef.current = app
      }

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
    }

    void setup()
  }, [containerRef, appRef])

  return <></>
}

export const ComputerRunning: Story = {
  render: (args) => <ComputerRunningComponent {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'COMPUTER（動作中）: プログラム実行中は中央に白い点が表示される',
      },
    },
  },
}

// 力場
const ForceFieldComponent = ({ containerRef, appRef }: PixiComponentProps) => {
  useEffect(() => {
    if (!containerRef?.current) return

    const setup = async () => {
      const app = await setupPixiApp(containerRef.current, {
        width: 300,
        height: 300,
      })
      if (appRef?.current !== undefined) {
        appRef.current = app
      }

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
    }

    void setup()
  }, [containerRef, appRef])

  return <></>
}

export const ForceField: Story = {
  render: (args) => <ForceFieldComponent {...args} />,
  parameters: {
    docs: {
      description: {
        story: '力場: rgba(173,216,230,0.2)の薄い円形領域',
      },
    },
  },
}

// 複数オブジェクトの組み合わせ（エージェント）
const AgentComponent = ({ containerRef, appRef }: PixiComponentProps) => {
  useEffect(() => {
    if (!containerRef?.current) return

    const setup = async () => {
      const app = await setupPixiApp(containerRef.current, {
        width: 400,
        height: 300,
      })
      if (appRef?.current !== undefined) {
        appRef.current = app
      }

      // エージェント（HULL + ASSEMBLER + COMPUTER）
      const agent = new PIXI.Container()
      agent.x = 200
      agent.y = 150

      // HULL（中央）
      const hull = new PIXI.Graphics()
      const hullSize = 40
      hull.rect(-hullSize/2, -hullSize/2, hullSize, hullSize)
      hull.fill(0xa9a9a9)
      agent.addChild(hull)

      // ASSEMBLER（左側に接続）
      const assembler = new PIXI.Graphics()
      const assemblerSize = 25
      assembler.rect(-assemblerSize/2, -assemblerSize/2, assemblerSize, assemblerSize)
      assembler.fill(0xff8c00)
      assembler.x = -35
      agent.addChild(assembler)

      // COMPUTER（右側に接続）
      const computer = new PIXI.Graphics()
      computer.circle(0, 0, 12)
      computer.fill(0x00bfff)
      computer.circle(0, 0, 2)
      computer.fill({ color: 0xffffff, alpha: 0.9 })
      computer.x = 35
      agent.addChild(computer)

      app.stage.addChild(agent)

      // ラベル
      const label = new PIXI.Text({
        text: 'Agent (HULL + ASSEMBLER + COMPUTER)',
        style: {
          fontSize: 14,
          fill: 0xffffff,
          fontFamily: 'Courier New, monospace',
        },
      })
      label.x = 200 - label.width / 2
      label.y = 210
      app.stage.addChild(label)
    }

    void setup()
  }, [containerRef, appRef])

  return <></>
}

export const Agent: Story = {
  render: (args) => <AgentComponent {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'エージェント: 複数のユニットが結合した状態',
      },
    },
  },
}