import React, { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import * as PIXI from 'pixi.js'
import { withPixi, setupPixiApp } from '../../.storybook/decorators/pixi'

/**
 * UI要素の描画確認用ストーリー
 * デバッグ情報などのオーバーレイ表示を確認
 */
const meta: Meta = {
  title: 'Game/UI Overlay',
  decorators: [withPixi],
  parameters: {
    docs: {
      description: {
        component: 'ゲーム画面上に表示されるUI要素の確認',
      },
    },
  },
}

export default meta

type Story = StoryObj<{
  containerRef: React.RefObject<HTMLDivElement>
  appRef: React.RefObject<PIXI.Application | null>
}>

// デバッグ情報表示
export const DebugInfo: Story = {
  render: ({ containerRef, appRef }) => {
    useEffect(() => {
      if (!containerRef.current) return

      const setup = async () => {
        const app = await setupPixiApp(containerRef.current!, {
          width: 400,
          height: 300,
        })
        appRef.current = app

        // 背景のゲーム要素（サンプル）
        const backgroundElements = new PIXI.Container()
        
        // いくつかのオブジェクトを配置
        for (let i = 0; i < 5; i++) {
          const obj = new PIXI.Graphics()
          obj.circle(0, 0, 10)
          obj.fill(0xffd700)
          obj.x = 50 + i * 70
          obj.y = 150
          backgroundElements.addChild(obj)
        }
        
        app.stage.addChild(backgroundElements)

        // UI背景（半透明黒）
        const uiBg = new PIXI.Graphics()
        uiBg.rect(5, 5, 180, 100)
        uiBg.fill({ color: 0x000000, alpha: 0.6 })
        app.stage.addChild(uiBg)

        // デバッグテキスト
        const debugText = new PIXI.Text({
          text: 'FPS: 60\nTicks per frame: 1\nTick: 12345\nObjects: 152\nZoom: 1.00x\nCamera: (0, 0)',
          style: {
            fontSize: 12,
            fill: 0xffffff,
            fontFamily: 'Courier New, monospace',
          },
        })
        debugText.x = 10
        debugText.y = 10
        app.stage.addChild(debugText)
      }

      void setup()
    }, [containerRef, appRef])

    return null
  },
  parameters: {
    docs: {
      description: {
        story: 'デバッグ情報の表示: 半透明黒背景に白文字、等幅フォント',
      },
    },
  },
}

// パフォーマンス表示
export const PerformanceMetrics: Story = {
  render: ({ containerRef, appRef }) => {
    useEffect(() => {
      if (!containerRef.current) return

      const setup = async () => {
        const app = await setupPixiApp(containerRef.current!, {
          width: 400,
          height: 300,
        })
        appRef.current = app

        // パフォーマンスメトリクス用背景
        const perfBg = new PIXI.Graphics()
        perfBg.rect(5, 5, 150, 80)
        perfBg.fill({ color: 0x000000, alpha: 0.6 })
        app.stage.addChild(perfBg)

        // パフォーマンステキスト
        const perfText = new PIXI.Text({
          text: 'Performance\n───────────\nFPS: 60\nDraw Calls: 42\nTextures: 8\nMemory: 24.3MB',
          style: {
            fontSize: 11,
            fill: 0xffffff,
            fontFamily: 'Courier New, monospace',
          },
        })
        perfText.x = 10
        perfText.y = 10
        app.stage.addChild(perfText)

        // FPS低下時の警告（赤色）
        const warningText = new PIXI.Text({
          text: '⚠ Low FPS',
          style: {
            fontSize: 11,
            fill: 0xff4444,
            fontFamily: 'Courier New, monospace',
          },
        })
        warningText.x = 10
        warningText.y = 70
        app.stage.addChild(warningText)
      }

      void setup()
    }, [containerRef, appRef])

    return null
  },
  parameters: {
    docs: {
      description: {
        story: 'パフォーマンスメトリクスの表示',
      },
    },
  },
}

// 複数のUI要素の組み合わせ
export const FullUI: Story = {
  render: ({ containerRef, appRef }) => {
    useEffect(() => {
      if (!containerRef.current) return

      const setup = async () => {
        const app = await setupPixiApp(containerRef.current!, {
          width: 600,
          height: 400,
        })
        appRef.current = app

        // 背景に力場を表示
        const field = new PIXI.Graphics()
        field.circle(300, 200, 100)
        field.fill({ color: 0xadd8e6, alpha: 0.2 })
        app.stage.addChild(field)

        // いくつかのゲームオブジェクト
        const objects = new PIXI.Container()
        
        // エネルギーソース
        const source = new PIXI.Graphics()
        source.star(0, 0, 8, 15, 10)
        source.fill(0xffb700)
        source.x = 300
        source.y = 200
        objects.addChild(source)

        // エージェント
        const agent = new PIXI.Container()
        agent.x = 400
        agent.y = 250
        
        const hull = new PIXI.Graphics()
        hull.rect(-15, -15, 30, 30)
        hull.fill(0xa9a9a9)
        agent.addChild(hull)
        
        const computer = new PIXI.Graphics()
        computer.circle(20, 0, 10)
        computer.fill(0x00bfff)
        agent.addChild(computer)
        
        objects.addChild(agent)
        app.stage.addChild(objects)

        // 左上: デバッグ情報
        const debugBg = new PIXI.Graphics()
        debugBg.rect(5, 5, 180, 100)
        debugBg.fill({ color: 0x000000, alpha: 0.6 })
        app.stage.addChild(debugBg)

        const debugText = new PIXI.Text({
          text: 'FPS: 60\nTicks per frame: 1\nTick: 12345\nObjects: 152\nZoom: 1.00x\nCamera: (0, 0)',
          style: {
            fontSize: 12,
            fill: 0xffffff,
            fontFamily: 'Courier New, monospace',
          },
        })
        debugText.x = 10
        debugText.y = 10
        app.stage.addChild(debugText)

        // 右上: エネルギー統計
        const statsBg = new PIXI.Graphics()
        statsBg.rect(410, 5, 185, 60)
        statsBg.fill({ color: 0x000000, alpha: 0.6 })
        app.stage.addChild(statsBg)

        const statsText = new PIXI.Text({
          text: 'Energy Stats\n─────────────\nTotal: 1,024,000\nSources: 5\nAgents: 12',
          style: {
            fontSize: 11,
            fill: 0xffffff,
            fontFamily: 'Courier New, monospace',
          },
        })
        statsText.x = 415
        statsText.y = 10
        app.stage.addChild(statsText)

        // 下部: 操作ヒント
        const hintBg = new PIXI.Graphics()
        hintBg.rect(5, 365, 590, 30)
        hintBg.fill({ color: 0x000000, alpha: 0.6 })
        app.stage.addChild(hintBg)

        const hintText = new PIXI.Text({
          text: 'Mouse: Pan | Wheel: Zoom | Space: Pause | 1-5: Speed',
          style: {
            fontSize: 11,
            fill: 0xaaaaaa,
            fontFamily: 'Courier New, monospace',
          },
        })
        hintText.x = 10
        hintText.y = 372
        app.stage.addChild(hintText)
      }

      void setup()
    }, [containerRef, appRef])

    return null
  },
  parameters: {
    docs: {
      description: {
        story: '完全なUI構成の例: デバッグ情報、統計、操作ヒントを含む',
      },
    },
  },
}