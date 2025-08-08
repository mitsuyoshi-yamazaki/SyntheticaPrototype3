import type { Meta, StoryObj } from "@storybook/nextjs"
import GameCanvasPixi from "./GameCanvasPixi"

/**
 * ゲームキャンバスコンポーネント
 * PixiJSを使用したゲーム画面の表示を行う
 */
const meta: Meta<typeof GameCanvasPixi> = {
  title: "Game/GameCanvas",
  component: GameCanvasPixi,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "PixiJSベースのゲームキャンバス。ビューポート操作（パン・ズーム）に対応。",
      },
    },
  },
  argTypes: {
    width: {
      control: { type: "range", min: 300, max: 1200, step: 100 },
      description: "キャンバスの幅",
    },
    height: {
      control: { type: "range", min: 300, max: 900, step: 100 },
      description: "キャンバスの高さ",
    },
    ticksPerFrame: {
      control: { type: "range", min: 0, max: 10, step: 1 },
      description: "1フレームあたりのtick数（0で一時停止）",
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
