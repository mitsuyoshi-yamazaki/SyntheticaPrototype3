"use client"

import { useEffect, useRef } from "react"
import * as PIXI from "pixi.js"
import { GameWorld } from "@/lib/GameWorld"

type GameCanvasProps = {
  width?: number
  height?: number
  ticksPerFrame?: number
}

/**
 * PixiJSを使用したゲームキャンバスコンポーネント
 * requestAnimationFrameごとにゲームがn tick進む
 */
const GameCanvasPixi = ({ width = 800, height = 600, ticksPerFrame = 1 }: GameCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const gameWorldRef = useRef<GameWorld | null>(null)

  useEffect(() => {
    if (containerRef.current == null) return

    // PixiJS Applicationの初期化
    const initPixi = async () => {
      // アプリケーション作成
      const app = new PIXI.Application()
      await app.init({
        width,
        height,
        backgroundColor: 0xf0f0f0,
        antialias: true,
        resolution: window.devicePixelRatio !== 0 ? window.devicePixelRatio : 1,
        autoDensity: true,
      })

      // キャンバスをDOMに追加
      if (containerRef.current != null && app.canvas != null) {
        containerRef.current.appendChild(app.canvas)
      }

      appRef.current = app

      // GameWorldの初期化
      const gameWorld = new GameWorld(width, height)
      gameWorldRef.current = gameWorld
      console.log("ゲームワールドを初期化しました")

      // レンダリング用コンテナ
      const gameContainer = new PIXI.Container()
      app.stage.addChild(gameContainer)

      // デバッグ情報用テキスト
      const debugText = new PIXI.Text({
        text: "",
        style: {
          fontFamily: "Arial",
          fontSize: 14,
          fill: 0x000000,
        },
      })
      debugText.x = 10
      debugText.y = 10
      app.stage.addChild(debugText)

      // 開発用：中央に円を描画
      const centerCircle = new PIXI.Graphics()
      centerCircle.circle(0, 0, 25)
      centerCircle.fill(0x6496c8)
      centerCircle.x = width / 2
      centerCircle.y = height / 2
      gameContainer.addChild(centerCircle)

      // FPS計測用
      let lastTime = performance.now()
      let frameCount = 0
      let fps = 0

      // ゲームループ
      app.ticker.add(() => {
        // FPS計算
        frameCount++
        const currentTime = performance.now()
        if (currentTime - lastTime >= 1000) {
          fps = frameCount
          frameCount = 0
          lastTime = currentTime
        }

        // ゲームをn tick進める
        for (let i = 0; i < ticksPerFrame; i++) {
          gameWorld.tick()
        }

        // ゲーム世界をレンダリング
        gameWorld.renderPixi(gameContainer)

        // デバッグ情報更新
        debugText.text = `FPS: ${fps}\nTicks per frame: ${ticksPerFrame}`
      })
    }

    void initPixi()

    // クリーンアップ関数
    return () => {
      if (appRef.current != null) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
      }
      gameWorldRef.current = null
    }
  }, [width, height, ticksPerFrame])

  return (
    <div className="flex justify-center">
      <div ref={containerRef} className="border border-gray-300 rounded-lg" />
    </div>
  )
}

export default GameCanvasPixi