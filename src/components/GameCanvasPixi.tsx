"use client"

import { useEffect, useRef, useState } from "react"
import * as PIXI from "pixi.js"
import { GameWorld } from "@/lib/GameWorld"
import { Viewport } from "@/engine/viewport"
import type { ObjectId } from "@/types/game"
import { Vec2 as Vec2Utils } from "@/utils/vec2"
import { SELF_REPLICATOR_PRESET } from "../engine/presets/self-replicator-preset"
import { setPresetParameters } from "@/config/game-law-parameters"

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
  const viewportRef = useRef<Viewport | null>(null)
  const isPausedRef = useRef(isPaused)
  const targetTPSRef = useRef(targetTPS)
  const [isHeatMapVisible, setIsHeatMapVisible] = useState(false)
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

      // エネルギーパラメータプリセットを適用
      setPresetParameters(energyPreset)

      // GameWorldの初期化
      const gameWorld = new GameWorld({
        width,
        height,
        debugMode,
        defaultAgentPresets: [
          {
            preset: SELF_REPLICATOR_PRESET,
            position: Vec2Utils.create(width * 0.3, height * 0.5),
          },
        ],
      })
      gameWorldRef.current = gameWorld
      console.log("ゲームワールドを初期化しました")

      // デモ用の力場を追加
      // 中央に渦巻き力場を追加
      gameWorld.addForceField({
        id: 1000001 as ObjectId, // 固定ID使用
        type: "SPIRAL",
        position: Vec2Utils.create(width / 2, height / 2),
        radius: Math.min(width, height) * 0.4,
        strength: 20,
      })

      // 左上に直線状力場を追加
      gameWorld.addForceField({
        id: 1000002 as ObjectId,
        type: "LINEAR",
        position: Vec2Utils.create(width * 0.2, height * 0.2),
        radius: 150,
        strength: 15,
        direction: Vec2Utils.create(1, 0),
      })

      // 右下に放射状力場を追加（斥力）
      gameWorld.addForceField({
        id: 1000003 as ObjectId,
        type: "RADIAL",
        position: Vec2Utils.create(width * 0.8, height * 0.8),
        radius: 150,
        strength: 25, // 正の値で斥力
      })

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

      // マウスイベントの設定
      app.stage.eventMode = "static"
      app.stage.hitArea = app.screen

      // パン操作（マウスドラッグ）
      let isDragging = false
      let dragStartPos = { x: 0, y: 0 }
      const DRAG_THRESHOLD = 5 // ピクセル

      app.stage.on("pointerdown", (event: PIXI.FederatedPointerEvent) => {
        dragStartPos = { x: event.global.x, y: event.global.y }
        isDragging = true
        viewport.startDrag({ x: event.global.x, y: event.global.y })
      })

      app.stage.on("pointermove", (event: PIXI.FederatedPointerEvent) => {
        if (isDragging) {
          viewport.drag({ x: event.global.x, y: event.global.y })
        }
      })

      app.stage.on("pointerup", (event: PIXI.FederatedPointerEvent) => {
        // ドラッグではなくクリックだった場合、オブジェクト選択
        const dragDistance = Math.sqrt(
          Math.pow(event.global.x - dragStartPos.x, 2) +
            Math.pow(event.global.y - dragStartPos.y, 2)
        )

        if (dragDistance < DRAG_THRESHOLD) {
          // スクリーン座標からワールド座標へ変換
          const worldPos = viewport.screenToWorld({ x: event.global.x, y: event.global.y })
          gameWorld.selectObjectAt(worldPos.x, worldPos.y)
        }

        isDragging = false
        viewport.endDrag()
      })

      app.stage.on("pointerupoutside", () => {
        isDragging = false
        viewport.endDrag()
      })

      // FPS/TPS計測用
      let lastTime = performance.now()
      let frameCount = 0
      let fps = 0
      let tickCount = 0
      let tps = 0

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
        const zoom = viewport.zoom.toFixed(2)
        const viewportPos = viewport.position
        const posX = Math.round(viewportPos.x)
        const posY = Math.round(viewportPos.y)
        const heatMapStatus = gameWorld.isHeatMapVisible ? "ON" : "OFF"
        const pauseStatus = isPausedRef.current ? " [PAUSED]" : ""
        debugText.text = `FPS: ${fps}${pauseStatus}\nTPS: ${tps} / ${targetTPSRef.current}\nTick: ${gameWorld.tickCount}\nObjects: ${objectCount}\nZoom: ${zoom}x\nCamera: (${posX}, ${posY})\nHeat Map: ${heatMapStatus}`
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
  }, [width, height, ticksPerFrame, energyPreset, debugMode])

  // 熱マップ表示状態の変更を反映
  useEffect(() => {
    if (gameWorldRef.current != null) {
      gameWorldRef.current.setHeatMapVisible(isHeatMapVisible)
    }
  }, [isHeatMapVisible])

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={containerRef} className="border border-gray-300 rounded-lg" />
      <div className="flex gap-4">
        <button
          onClick={() => setIsHeatMapVisible(!isHeatMapVisible)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          熱マップ: {isHeatMapVisible ? "ON" : "OFF"}
        </button>
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
