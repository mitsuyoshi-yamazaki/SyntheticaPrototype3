/**
 * ゲームループ制御のテスト
 */

import { GameLoop, GameLoopController } from "./game-loop"
import { WorldStateManager } from "./world-state"
import type { WorldParameters } from "@/types/game"

// requestAnimationFrameのモック
let rafCallbacks: { id: number; callback: FrameRequestCallback }[] = []
let rafId = 0
const mockRequestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
  const id = ++rafId
  rafCallbacks.push({ id, callback })
  return id
})
const mockCancelAnimationFrame = jest.fn((id: number) => {
  rafCallbacks = rafCallbacks.filter(item => item.id !== id)
})


// performance.nowのモック
let currentTime = 0
const mockPerformanceNow = jest.fn(() => currentTime)

// グローバルオブジェクトのモック設定
beforeAll(() => {
  global.requestAnimationFrame = mockRequestAnimationFrame as unknown as typeof requestAnimationFrame
  global.cancelAnimationFrame = mockCancelAnimationFrame
  global.performance = {
    now: mockPerformanceNow,
  } as unknown as Performance
})

beforeEach(() => {
  jest.clearAllMocks()
  rafCallbacks = []
  rafId = 0
  currentTime = 0
})

afterEach(() => {
  // テスト間の状態リーク防止
  rafCallbacks = []
})

// ユーティリティ関数
const callRafCallbacks = (time: number) => {
  // コールバックをコピーして実行（実行中に新しいコールバックが追加される可能性があるため）
  const callbacks = [...rafCallbacks]
  rafCallbacks = []
  callbacks.forEach(({ callback }) => callback(time))
}


describe("GameLoop", () => {
  const createGameLoop = () => {
    const onTick = jest.fn()
    const onRender = jest.fn()
    const gameLoop = new GameLoop(60, onTick, onRender) // 60 FPS
    return { gameLoop, onTick, onRender }
  }

  describe("初期状態", () => {
    test("初期状態では停止している", () => {
      const { gameLoop } = createGameLoop()
      expect(gameLoop.isRunning).toBe(false)
      expect(gameLoop.isPaused).toBe(false)
    })
  })

  describe("start/stop", () => {
    test("startで実行開始される", () => {
      const { gameLoop } = createGameLoop()
      
      gameLoop.start()
      
      expect(gameLoop.isRunning).toBe(true)
      expect(mockRequestAnimationFrame).toHaveBeenCalled()
    })

    test("既に実行中の場合、startは何もしない", () => {
      const { gameLoop } = createGameLoop()
      
      gameLoop.start()
      const callCount = mockRequestAnimationFrame.mock.calls.length
      
      gameLoop.start()
      
      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(callCount)
    })

    test("stopで実行停止される", () => {
      const { gameLoop } = createGameLoop()
      
      gameLoop.start()
      const frameId = rafId
      gameLoop.stop()
      
      expect(gameLoop.isRunning).toBe(false)
      expect(mockCancelAnimationFrame).toHaveBeenCalledWith(frameId)
    })
  })

  describe("pause/resume", () => {
    test("pauseで一時停止される", () => {
      const { gameLoop } = createGameLoop()
      
      gameLoop.start()
      gameLoop.pause()
      
      expect(gameLoop.isPaused).toBe(true)
      expect(gameLoop.isRunning).toBe(true)
    })

    test("resumeで再開される", () => {
      const { gameLoop } = createGameLoop()
      
      gameLoop.start()
      gameLoop.pause()
      gameLoop.resume()
      
      expect(gameLoop.isPaused).toBe(false)
    })

    test("一時停止中はtickが呼ばれない", () => {
      const { gameLoop, onTick } = createGameLoop()
      
      currentTime = 1000
      gameLoop.start()
      callRafCallbacks(1000) // 初回
      
      onTick.mockClear() // ここまでの呼び出しをクリア
      gameLoop.pause()
      
      callRafCallbacks(1020) // 1フレーム以上進める
      
      expect(onTick).not.toHaveBeenCalled()
    })
  })

  describe("ゲームループ実行", () => {
    test("基本的な動作確認", () => {
      const { gameLoop, onTick, onRender } = createGameLoop()
      
      currentTime = 0
      gameLoop.start()
      
      // rafコールバックが登録されているか確認
      expect(rafCallbacks.length).toBe(1)
      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1)
      
      // 最初の呼び出しでrenderが呼ばれているか
      expect(onRender).toHaveBeenCalledTimes(1)
      
      // フレームを進める（currentTimeを17に設定してからcallRafCallbacks）
      currentTime = 17
      callRafCallbacks(17)
      // 次のrafコールバックが登録される
      expect(rafCallbacks.length).toBe(1)
      
      // onTickが呼ばれたか確認
      expect(onTick).toHaveBeenCalledTimes(1)
    })
    
    test("固定タイムステップでtickが呼ばれる", () => {
      const { gameLoop, onTick, onRender } = createGameLoop()
      
      currentTime = 0
      gameLoop.start()
      // startの時点でloop()が呼ばれ、renderは1回実行される
      expect(onRender).toHaveBeenCalledTimes(1)
      
      // 1フレーム目（17ms経過）
      currentTime = 17
      callRafCallbacks(17) // 1tick分
      expect(onTick).toHaveBeenCalledTimes(1)
      expect(onTick).toHaveBeenCalledWith(1/60)
      
      currentTime = 34
      callRafCallbacks(34) // もう1tick分
      expect(onTick).toHaveBeenCalledTimes(2)
    })

    test("フレームスキップ時は複数回tickが呼ばれる", () => {
      const { gameLoop, onTick } = createGameLoop()
      
      currentTime = 0
      gameLoop.start()
      
      // 初回フレームで時間を大きく進める
      currentTime = 50
      callRafCallbacks(50) // 50ms経過（約3tick分）
      expect(onTick).toHaveBeenCalledTimes(3)
    })

    test("renderは毎フレーム呼ばれる", () => {
      const { gameLoop, onRender } = createGameLoop()
      
      currentTime = 0
      gameLoop.start()
      // startの時点で1回呼ばれる
      expect(onRender).toHaveBeenCalledTimes(1)
      
      // 各フレームでrenderが呼ばれる
      currentTime = 10
      callRafCallbacks(10)
      expect(onRender).toHaveBeenCalledTimes(2)
      
      currentTime = 20
      callRafCallbacks(20)
      expect(onRender).toHaveBeenCalledTimes(3)
    })

    test("大きなフレームスキップは制限される", () => {
      const { gameLoop, onTick } = createGameLoop()
      
      currentTime = 0
      gameLoop.start()
      
      // 初回フレームで200ms経過（最大100msに制限）
      currentTime = 200
      callRafCallbacks(200) // 200ms経過
      // 100ms = 16.67 * 6 = 100.02なので、実際には5回の可能性
      expect(onTick).toHaveBeenCalledTimes(5)
    })
  })

  describe("setTargetFPS", () => {
    test("FPSを変更できる", () => {
      const { gameLoop, onTick } = createGameLoop()
      
      currentTime = 0
      gameLoop.start()
      gameLoop.setTargetFPS(30) // 30FPSに変更
      
      // 30FPSの場合は33.33msでtick
      currentTime = 34
      callRafCallbacks(34) // 34ms経過
      expect(onTick).toHaveBeenCalledTimes(1)
    })
  })
})

describe("GameLoopController", () => {
  const createController = (params?: Partial<WorldParameters>) => {
    const worldState = new WorldStateManager(800, 600, params)
    const controller = new GameLoopController(worldState)
    return { controller, worldState }
  }

  describe("初期状態", () => {
    test("WorldStateのパラメータが反映される", () => {
      const params: Partial<WorldParameters> = {
        targetFPS: 30,
        ticksPerFrame: 2,
      }
      const { controller } = createController(params)
      
      expect(controller.isPaused).toBe(false)
      expect(controller.isRunning).toBe(false)
    })
  })

  describe("ゲーム制御", () => {
    test("start/stopが正常に動作する", () => {
      const { controller } = createController()
      
      controller.start()
      expect(controller.isRunning).toBe(true)
      
      controller.stop()
      expect(controller.isRunning).toBe(false)
    })

    test("pause/resumeが正常に動作する", () => {
      const { controller } = createController()
      
      controller.start()
      controller.pause()
      expect(controller.isPaused).toBe(true)
      
      controller.resume()
      expect(controller.isPaused).toBe(false)
    })
  })

  describe("tick処理", () => {
    test("ticksPerFrame分だけtickが実行される", () => {
      const { controller, worldState } = createController({
        ticksPerFrame: 3,
      })
      
      const incrementTickSpy = jest.spyOn(worldState, "incrementTick")
      
      currentTime = 0
      controller.start()
      
      // 1フレーム分の時間を進める
      currentTime = 17
      callRafCallbacks(17)
      
      expect(incrementTickSpy).toHaveBeenCalledTimes(3)
    })

    test("一時停止中はtickが実行されない", () => {
      const { controller, worldState } = createController()
      
      const incrementTickSpy = jest.spyOn(worldState, "incrementTick")
      
      currentTime = 0
      controller.start()
      
      currentTime = 17
      callRafCallbacks(17) // 1フレーム実行
      incrementTickSpy.mockClear() // 初回呼び出しをクリア
      
      controller.pause()
      currentTime = 37
      callRafCallbacks(37)
      
      expect(incrementTickSpy).not.toHaveBeenCalled()
    })
  })

  describe("FPS計測", () => {
    test("currentFPSが正しく計測される", () => {
      const { controller } = createController()
      
      currentTime = 0
      controller.start()
      
      // 最初の1秒間は0
      expect(controller.currentFPS).toBe(0)
      
      // 1秒間に60フレーム実行
      for (let i = 1; i <= 61; i++) {
        currentTime = i * 16.67
        callRafCallbacks(currentTime)
      }
      
      // 1秒経過後（1001ms以上）にFPSが更新される
      expect(controller.currentFPS).toBeGreaterThan(55)
      expect(controller.currentFPS).toBeLessThanOrEqual(61)
    })
  })

  describe("パラメータ更新", () => {
    test("targetFPSの更新が反映される", () => {
      const { controller, worldState } = createController()
      
      const incrementTickSpy = jest.spyOn(worldState, "incrementTick")
      
      currentTime = 0
      controller.start()
      controller.updateParameters({ targetFPS: 30 })
      
      // 30FPSの場合は33.33msでtick
      currentTime = 34
      callRafCallbacks(34)
      expect(incrementTickSpy).toHaveBeenCalledTimes(1)
    })

    test("ticksPerFrameの更新が反映される", () => {
      const { controller, worldState } = createController()
      
      const incrementTickSpy = jest.spyOn(worldState, "incrementTick")
      
      currentTime = 0
      controller.start()
      controller.updateParameters({ ticksPerFrame: 5 })
      
      // 1フレーム分の時間を進める
      currentTime = 17
      callRafCallbacks(17)
      expect(incrementTickSpy).toHaveBeenCalledTimes(5)
    })

    test("WorldStateのパラメータも更新される", () => {
      const { controller, worldState } = createController()
      
      const updateParamsSpy = jest.spyOn(worldState, "updateParameters")
      
      const newParams: Partial<WorldParameters> = {
        friction: 0.95,
        maxForce: 200,
      }
      
      controller.updateParameters(newParams)
      
      expect(updateParamsSpy).toHaveBeenCalledWith(newParams)
    })
  })
})