'use client'

import { useEffect, useRef } from 'react'
import p5 from 'p5'
import { GameWorld } from '@/lib/GameWorld'

type GameCanvasProps = {
  width?: number
  height?: number
  ticksPerFrame?: number
}

/**
 * p5.jsインスタンスモードを使用したゲームキャンバスコンポーネント
 * draw()が呼ばれるごとにゲームがn tick進む
 */
const GameCanvas = ({ 
  width = 800, 
  height = 600, 
  ticksPerFrame = 1 
}: GameCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5InstanceRef = useRef<p5 | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const sketch = (p: p5) => {
      let gameWorld: GameWorld

      p.setup = () => {
        p.createCanvas(width, height)
        p.background(240)
        
        // GameWorldの初期化
        gameWorld = new GameWorld(width, height)
        console.log('ゲームワールドを初期化しました')
      }

      p.draw = () => {
        // 背景をクリア
        p.background(240)
        
        // ゲームをn tick進める
        for (let i = 0; i < ticksPerFrame; i++) {
          gameWorld.tick()
        }
        
        // ゲーム世界をレンダリング
        gameWorld.render(p)
        
        // 開発用：中央に円を描画
        p.fill(100, 150, 200)
        p.noStroke()
        p.circle(width / 2, height / 2, 50)
        
        // フレーム情報表示
        p.fill(0)
        p.text(`FPS: ${p.frameRate().toFixed(1)}`, 10, 20)
        p.text(`Ticks per frame: ${ticksPerFrame}`, 10, 40)
      }
    }

    // p5インスタンスを作成
    p5InstanceRef.current = new p5(sketch, containerRef.current)

    // クリーンアップ関数
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove()
        p5InstanceRef.current = null
      }
    }
  }, [width, height, ticksPerFrame])

  return (
    <div className="flex justify-center">
      <div ref={containerRef} className="border border-gray-300 rounded-lg" />
    </div>
  )
}

export default GameCanvas