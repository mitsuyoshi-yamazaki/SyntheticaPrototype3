import type { Meta, StoryObj } from '@storybook/react'
import GameCanvasPixi from './GameCanvasPixi'

/**
 * ゲームキャンバスコンポーネント
 * PixiJSを使用したゲーム画面の表示を行う
 */
const meta: Meta<typeof GameCanvasPixi> = {
  title: 'Game/GameCanvas',
  component: GameCanvasPixi,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'PixiJSベースのゲームキャンバス。ビューポート操作（パン・ズーム）に対応。',
      },
    },
  },
  argTypes: {
    width: {
      control: { type: 'range', min: 300, max: 1200, step: 100 },
      description: 'キャンバスの幅',
    },
    height: {
      control: { type: 'range', min: 300, max: 900, step: 100 },
      description: 'キャンバスの高さ',
    },
    ticksPerFrame: {
      control: { type: 'range', min: 0, max: 10, step: 1 },
      description: '1フレームあたりのtick数（0で一時停止）',
    },
  },
}

export default meta

type Story = StoryObj<typeof meta>

/**
 * デフォルト設定のゲームキャンバス
 */
export const Default: Story = {
  args: {
    width: 800,
    height: 600,
    ticksPerFrame: 1,
  },
}

/**
 * 小さいサイズのキャンバス
 */
export const Small: Story = {
  args: {
    width: 400,
    height: 300,
    ticksPerFrame: 1,
  },
  parameters: {
    docs: {
      description: {
        story: '小さいサイズでの表示確認',
      },
    },
  },
}

/**
 * 大きいサイズのキャンバス
 */
export const Large: Story = {
  args: {
    width: 1000,
    height: 750,
    ticksPerFrame: 1,
  },
  parameters: {
    docs: {
      description: {
        story: '大きいサイズでの表示確認',
      },
    },
  },
}

/**
 * 一時停止状態
 */
export const Paused: Story = {
  args: {
    width: 800,
    height: 600,
    ticksPerFrame: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'ticksPerFrameを0にすることでシミュレーションを一時停止',
      },
    },
  },
}

/**
 * 高速シミュレーション
 */
export const FastSimulation: Story = {
  args: {
    width: 800,
    height: 600,
    ticksPerFrame: 5,
  },
  parameters: {
    docs: {
      description: {
        story: '1フレームで5tick進む高速シミュレーション',
      },
    },
  },
}

/**
 * 正方形キャンバス
 */
export const Square: Story = {
  args: {
    width: 600,
    height: 600,
    ticksPerFrame: 1,
  },
  parameters: {
    docs: {
      description: {
        story: '正方形のキャンバスでの表示',
      },
    },
  },
}