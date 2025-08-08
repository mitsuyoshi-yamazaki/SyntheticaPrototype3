"use client"

import { useEffect, useRef } from "react"
import * as PIXI from "pixi.js"
import { GameWorld } from "@/lib/GameWorld"
import { Viewport } from "@/engine/viewport"

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
  const viewportRef = useRef<Viewport | null>(null)

  useEffect(() => {
    if (containerRef.current == null) {
      return
    }

    // PixiJS Applicationの初期化
    const initPixi = async () => {
      // アプリケーション作成
      const app = new PIXI.Application()
      await app.init({
        width,
        height,
        backgroundColor: 0x101010, // デザイン仕様: 背景色 #101010
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

      // Viewportの初期化
      const viewport = new Viewport({
        screenWidth: width,
        screenHeight: height,
        worldWidth: width,
        worldHeight: height,
        minZoom: 0.1,
        maxZoom: 5.0,
        initialZoom: 1.0,
      })
      viewportRef.current = viewport

      // レンダリング用コンテナ
      const gameContainer = new PIXI.Container()
      app.stage.addChild(gameContainer)

      // ViewportにコンテナをセットI
      viewport.setContainer(gameContainer)

      // UI背景（デザイン仕様: rgba(0, 0, 0, 0.6)）
      const uiBg = new PIXI.Graphics()
      uiBg.rect(5, 5, 180, 100)
      uiBg.fill({ color: 0x000000, alpha: 0.6 })
      app.stage.addChild(uiBg)

      // デバッグ情報用テキスト（デザイン仕様: 白文字、等幅フォント）
      const debugText = new PIXI.Text({
        text: "",
        style: {
          fontFamily: "Courier New, monospace",
          fontSize: 12,
          fill: 0xffffff,
        },
      })
      debugText.x = 10
      debugText.y = 10
      app.stage.addChild(debugText)

      // マウスイベントの設定
      app.stage.eventMode = "static"
      app.stage.hitArea = app.screen

      // パン操作（マウスドラッグ）
      let isDragging = false
      app.stage.on("pointerdown", (event: PIXI.FederatedPointerEvent) => {
        isDragging = true
        viewport.startDrag({ x: event.global.x, y: event.global.y })
      })

      app.stage.on("pointermove", (event: PIXI.FederatedPointerEvent) => {
        if (isDragging) {
          viewport.drag({ x: event.global.x, y: event.global.y })
        }
      })

      app.stage.on("pointerup", () => {
        isDragging = false
        viewport.endDrag()
      })

      app.stage.on("pointerupoutside", () => {
        isDragging = false
        viewport.endDrag()
      })


      // FPS計測用
      let lastTime = performance.now()
      let frameCount = 0
      let fps = 0

      // ズーム操作（マウスホイール）
      let wheelHandler: ((event: WheelEvent) => void) | null = null
      if (app.canvas instanceof HTMLCanvasElement) {
        wheelHandler = (event: WheelEvent) => {
          event.preventDefault()
          const rect = app.canvas.getBoundingClientRect()
          const mouseX = event.clientX - rect.left
          const mouseY = event.clientY - rect.top

          if (event.deltaY < 0) {
            viewport.zoomIn(1.1, { x: mouseX, y: mouseY })
          } else {
            viewport.zoomOut(1.1, { x: mouseX, y: mouseY })
          }
        }
        app.canvas.addEventListener("wheel", wheelHandler, { passive: false })
      }

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
        const objectCount = gameWorld.getObjectCount()
        const zoom = viewport.zoom.toFixed(2)
        const viewportPos = viewport.position
        const posX = Math.round(viewportPos.x)
        const posY = Math.round(viewportPos.y)
        debugText.text = `FPS: ${fps}\nTicks per frame: ${ticksPerFrame}\nTick: ${gameWorld.tickCount}\nObjects: ${objectCount}\nZoom: ${zoom}x\nCamera: (${posX}, ${posY})`
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
      viewportRef.current = null
    }
  }, [width, height, ticksPerFrame])

  return (
    <div className="flex justify-center">
      <div ref={containerRef} className="border border-gray-300 rounded-lg" />
    </div>
  )
}

export default GameCanvasPixi
