"use client"

import GameCanvasPixi from "@/components/GameCanvasPixi"
import { useState } from "react"

export default function Home() {
  const [isRunning, setIsRunning] = useState(true)
  const [key, setKey] = useState(0)

  const handleToggleSimulation = () => {
    if (isRunning) {
      // 停止
      setIsRunning(false)
    } else {
      // 再起動（新しいキーで再マウント）
      setKey(prev => prev + 1)
      setIsRunning(true)
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Synthetica Prototype 2</h1>
        <p className="text-center text-gray-600 mb-8">
          自律エージェントが環境中で活動するMMOゲームのプロトタイプ
        </p>

        {/* ゲームキャンバス */}
        <div className="mb-8">
          {isRunning && (
            <GameCanvasPixi key={key} width={800} height={600} ticksPerFrame={1} />
          )}
          {!isRunning && (
            <div className="flex justify-center items-center bg-gray-200 rounded-lg" style={{ width: 800, height: 600 }}>
              <p className="text-gray-600 text-lg">シミュレーション停止中</p>
            </div>
          )}
        </div>

        {/* コントロールパネル */}
        <div className="flex justify-center">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">ゲーム設定</h2>
            
            {/* 停止/再起動ボタン */}
            <div className="mb-4">
              <button
                onClick={handleToggleSimulation}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isRunning 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {isRunning ? "停止" : "再起動"}
              </button>
            </div>
            
            <p className="text-sm text-gray-600">
              {isRunning ? "シミュレーション実行中" : "シミュレーション停止中"}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
