"use client"

import GameCanvasPixi from "@/components/GameCanvasPixi"
import { useState } from "react"

export default function Home() {
  const [isPaused, setIsPaused] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  const handleTogglePause = () => {
    setIsPaused(prev => !prev)
  }

  const handleReset = () => {
    // 新しいキーで再マウント
    setResetKey(prev => prev + 1)
    setIsPaused(false)
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Synthetica Prototype 2</h1>
        <p className="text-center text-gray-600 mb-8">
          自律エージェントが環境中で活動するMMOゲームのプロトタイプ
        </p>

        {/* ゲームキャンバス */}
        <div className="mb-8 relative">
          <GameCanvasPixi 
            key={resetKey} 
            width={800} 
            height={600} 
            ticksPerFrame={1} 
            isPaused={isPaused}
          />
          {isPaused && (
            <div
              className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50 rounded-lg pointer-events-none"
              style={{ width: 800, height: 600 }}
            >
              <p className="text-white text-2xl font-bold">一時停止中</p>
            </div>
          )}
        </div>

        {/* コントロールパネル */}
        <div className="flex justify-center">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">ゲーム設定</h2>

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
                {isPaused ? "再開" : "一時停止"}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2 rounded-lg font-medium transition-colors bg-red-500 hover:bg-red-600 text-white"
              >
                リセット
              </button>
            </div>

            <p className="text-sm text-gray-600">
              {isPaused ? "シミュレーション一時停止中" : "シミュレーション実行中"}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
