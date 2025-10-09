"use client"

import GameCanvasPixi from "@/components/GameCanvasPixi"
import { useState } from "react"

export default function Home() {
  const [isPaused, setIsPaused] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [targetTPS, setTargetTPS] = useState(60)

  const handleTogglePause = () => {
    setIsPaused(prev => !prev)
  }

  const handleReset = () => {
    // 新しいキーで再マウント
    setResetKey(prev => prev + 1)
    setIsPaused(false)
  }

  const handleTPSChange = (value: number) => {
    // 範囲を1～120に制限
    const clampedValue = Math.max(1, Math.min(120, value))
    setTargetTPS(clampedValue)
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Synthetica Prototype</h1>
        <p className="text-center text-gray-600 mb-8"></p>

        {/* ゲームキャンバス */}
        <div className="mb-8 relative">
          <GameCanvasPixi
            key={resetKey}
            width={800}
            height={600}
            ticksPerFrame={1}
            isPaused={isPaused}
            targetTPS={targetTPS}
            debugMode={false}
          />
          {isPaused && (
            <div
              className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50 rounded-lg pointer-events-none"
              style={{ width: 800, height: 600 }}
            >
              <p className="text-white text-2xl font-bold">Paused</p>
            </div>
          )}
        </div>

        {/* コントロールパネル */}
        <div className="flex justify-center">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Settings</h2>

            {/* 一時停止/再開ボタン */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={handleTogglePause}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isPaused
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-yellow-500 hover:bg-yellow-600 text-white"
                }`}
              >
                {isPaused ? "Start" : "Pause"}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2 rounded-lg font-medium transition-colors bg-red-500 hover:bg-red-600 text-white"
              >
                Reset
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">{isPaused ? "Paused" : "Running"}</p>

            {/* シミュレーション速度調整 */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Simulation Speed: {targetTPS} TPS
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={targetTPS}
                  onChange={e => handleTPSChange(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={targetTPS}
                  onChange={e => handleTPSChange(Number(e.target.value))}
                  className="w-16 px-2 py-1 border rounded text-center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
