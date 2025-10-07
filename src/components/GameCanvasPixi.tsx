"use client"

import { useEffect, useRef, useState } from "react"
import * as PIXI from "pixi.js"
import { GameWorld } from "../game/GameWorld"

type GameCanvasProps = {
  width?: number
  height?: number
  ticksPerFrame?: number
  isPaused?: boolean
  targetTPS?: number
  debugMode?: boolean
}

/**
 * PixiJSを使用したゲームキャンバスコンポーネント
 * requestAnimationFrameごとにゲームがn tick進む
 */
const GameCanvasPixi = ({
  width = 800,
  height = 600,
  ticksPerFrame = 1,
  isPaused = false,
  targetTPS = 60,
  debugMode = false,
}: GameCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const gameWorldRef = useRef<GameWorld | null>(null)
  const isPausedRef = useRef(isPaused)
  const targetTPSRef = useRef(targetTPS)
  const [energyPreset, setEnergyPreset] = useState<"default" | "balanced" | "experimental">(
    "default"
  )

  // isPausedの最新値を保持
  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  // targetTPSの最新値を保持とFPS設定
  useEffect(() => {
    targetTPSRef.current = targetTPS
    if (appRef.current != null) {
      // PixiJSのtickerのmaxFPSを設定
      appRef.current.ticker.maxFPS = targetTPS
    }
  }, [targetTPS])

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

      // 初期FPS設定（refから読み取る）
      app.ticker.maxFPS = targetTPSRef.current

      // GameWorldの初期化
      const gameWorld = new GameWorld(width, height)
      gameWorldRef.current = gameWorld
      console.log("ゲームワールドを初期化しました")

      // レンダリング用コンテナ
      const gameContainer = new PIXI.Container()
      app.stage.addChild(gameContainer)

      // UI背景（デザイン仕様: rgba(0, 0, 0, 0.6)）
      const uiBg = new PIXI.Graphics()
      uiBg.rect(5, 5, 180, 120)
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

      // FPS/TPS計測用
      let lastTime = performance.now()
      let frameCount = 0
      let fps = 0
      let tickCount = 0
      let tps = 0

      // ゲームループ
      app.ticker.add(() => {
        // FPS/TPS計算
        frameCount++
        const currentTime = performance.now()
        if (currentTime - lastTime >= 1000) {
          fps = frameCount
          tps = tickCount
          frameCount = 0
          tickCount = 0
          lastTime = currentTime
        }

        // 一時停止中はtickを進めない
        if (!isPausedRef.current) {
          // ゲームをn tick進める
          for (let i = 0; i < ticksPerFrame; i++) {
            gameWorld.tick()
            tickCount++
          }
        }

        // ゲーム世界をレンダリング（一時停止中も描画は継続）
        gameWorld.renderPixi(gameContainer)

        // デバッグ情報更新
        const objectCount = gameWorld.getObjectCount()
        const pauseStatus = isPausedRef.current ? " [PAUSED]" : ""
        debugText.text = `FPS: ${fps}${pauseStatus}\nTPS: ${tps} / ${targetTPSRef.current}\nTick: ${gameWorld.tickCount}\nObjects: ${objectCount}`
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
  }, [width, height, ticksPerFrame, energyPreset, debugMode])

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={containerRef} className="border border-gray-300 rounded-lg" />
      <div className="flex gap-4">
        <select
          value={energyPreset}
          onChange={e => setEnergyPreset(e.target.value as "default" | "balanced" | "experimental")}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
        >
          <option value="default">デフォルト</option>
          <option value="balanced">バランス調整版</option>
          <option value="experimental">実験用</option>
        </select>
      </div>
    </div>
  )
}

export default GameCanvasPixi
