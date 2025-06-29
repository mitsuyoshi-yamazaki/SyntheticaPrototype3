"use client"

import GameCanvas from "@/components/GameCanvas"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Synthetica Prototype 2</h1>
        <p className="text-center text-gray-600 mb-8">
          自律エージェントが環境中で活動するMMOゲームのプロトタイプ
        </p>

        {/* ゲームキャンバス */}
        <div className="mb-8">
          <GameCanvas width={800} height={600} ticksPerFrame={1} />
        </div>

        {/* コントロールパネル */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">ゲーム設定</h2>
            <p className="text-sm text-gray-600">将来的にここに設定パネルが表示されます</p>
          </div>
        </div>
      </div>
    </main>
  )
}
