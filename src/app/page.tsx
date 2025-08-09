"use client"

import GameCanvasPixi from "@/components/GameCanvasPixi"
import { useState } from "react"

export default function Home() {
  const [isPaused, setIsPaused] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [targetTPS, setTargetTPS] = useState(60)
  const [debugMode, setDebugMode] = useState(false)

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
            targetTPS={targetTPS}
            debugMode={debugMode}
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

            <p className="text-sm text-gray-600 mb-4">
              {isPaused ? "シミュレーション一時停止中" : "シミュレーション実行中"}
            </p>

            {/* シミュレーション速度調整 */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                シミュレーション速度: {targetTPS} TPS
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={targetTPS}
                  onChange={(e) => handleTPSChange(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={targetTPS}
                  onChange={(e) => handleTPSChange(Number(e.target.value))}
                  className="w-16 px-2 py-1 border rounded text-center"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 TPS (最遅)</span>
                <span>60 TPS (標準)</span>
                <span>120 TPS (最速)</span>
              </div>
            </div>
            
            {/* デバッグモード */}
            <div className="border-t pt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={debugMode}
                  onChange={(e) => setDebugMode(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">COMPUTERデバッグモード</span>
              </label>
              {debugMode && (
                <div className="text-xs text-yellow-600 mt-2">
                  ※ HULLをクリックして選択すると、接続されたCOMPUTERの実行ログがコンソールに出力されます
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
