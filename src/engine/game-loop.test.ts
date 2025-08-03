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
  global.requestAnimationFrame =
    mockRequestAnimationFrame as unknown as typeof requestAnimationFrame
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

// タイムスタンプを進めてRAFコールバックを呼ぶヘルパー
const advanceTime = (ms: number) => {
  currentTime += ms
  callRafCallbacks(currentTime)
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
      expect(onTick).toHaveBeenCalledTimes(0) // tickはまだ呼ばれない

      // フレームを進める
      advanceTime(17)
      // 次のrafコールバックが登録される
      expect(rafCallbacks.length).toBe(1)

      // onTickが呼ばれたか確認
      expect(onTick).toHaveBeenCalledTimes(1)
      expect(onRender).toHaveBeenCalledTimes(2) // start時とtick時
    })

    test("FPS上限に達するまでtickが実行される", () => {
      const { gameLoop, onTick, onRender } = createGameLoop()

      currentTime = 0
      gameLoop.start()

      // 60FPSの場合、16.67ms毎にtick
      advanceTime(17)
      expect(onTick).toHaveBeenCalledTimes(1)
      expect(onRender).toHaveBeenCalledTimes(2) // start時とtick時

      // まだ16.67ms経過していないのでtickは呼ばれない
      currentTime = 30
      callRafCallbacks(30)
      expect(onTick).toHaveBeenCalledTimes(1)

      // 16.67ms以上経過したらtickが呼ばれる
      currentTime = 34
      callRafCallbacks(34)
      expect(onTick).toHaveBeenCalledTimes(2)
    })

    test("長時間経過してもtickは1回だけ呼ばれる", () => {
      const { gameLoop, onTick } = createGameLoop()

      currentTime = 0
      gameLoop.start()

      // 100ms経過しても、tickは1回だけ呼ばれる
      currentTime = 100
      callRafCallbacks(100)
      expect(onTick).toHaveBeenCalledTimes(1)

      // 次のフレームでもう1回呼ばれる
      currentTime = 117
      callRafCallbacks(117)
      expect(onTick).toHaveBeenCalledTimes(2)
    })

    test("renderはtickと同時に呼ばれる", () => {
      const { gameLoop, onRender, onTick } = createGameLoop()

      currentTime = 0
      gameLoop.start()

      // 最初のtick
      currentTime = 17
      callRafCallbacks(17)
      expect(onTick).toHaveBeenCalledTimes(1)
      expect(onRender).toHaveBeenCalledTimes(2) // start時とtick時
      expect(onRender).toHaveBeenLastCalledWith(0) // 補間値は常に0

      // FPS上限未満では呼ばれない
      currentTime = 20
      callRafCallbacks(20)
      expect(onTick).toHaveBeenCalledTimes(1)
      expect(onRender).toHaveBeenCalledTimes(2)
    })

    test("一時停止中はtickが実行されない", () => {
      const { gameLoop, onTick } = createGameLoop()

      currentTime = 0
      gameLoop.start()
      gameLoop.pause()

      // 時間が経過してもtickは呼ばれない
      currentTime = 100
      callRafCallbacks(100)
      expect(onTick).not.toHaveBeenCalled()

      // 再開後はtickが呼ばれる
      gameLoop.resume()
      currentTime = 117
      callRafCallbacks(117)
      expect(onTick).toHaveBeenCalledTimes(1)
    })
  })

  describe("setMaxFPS", () => {
    test("FPS上限を変更できる", () => {
      const { gameLoop, onTick } = createGameLoop()

      currentTime = 0
      gameLoop.start()
      gameLoop.setMaxFPS(30) // 30FPSに変更

      // 30FPSの場合は33.33ms毎にtick
      currentTime = 34
      callRafCallbacks(34)
      expect(onTick).toHaveBeenCalledTimes(1)

      // 33.33ms未満では呼ばれない
      currentTime = 50
      callRafCallbacks(50)
      expect(onTick).toHaveBeenCalledTimes(1)

      // 33.33ms以上経過したら呼ばれる
      currentTime = 68
      callRafCallbacks(68)
      expect(onTick).toHaveBeenCalledTimes(2)
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
        maxFPS: 30,
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
      for (let i = 1; i <= 60; i++) {
        currentTime = i * 16.67
        callRafCallbacks(currentTime)
      }

      // 1秒経過後（1001ms以上）にFPSが更新される
      currentTime = 1001
      callRafCallbacks(1001)
      expect(controller.currentFPS).toBeGreaterThan(55)
      expect(controller.currentFPS).toBeLessThanOrEqual(61)
    })
  })

  describe("パラメータ更新", () => {
    test("maxFPSの更新が反映される", () => {
      const { controller, worldState } = createController()

      const incrementTickSpy = jest.spyOn(worldState, "incrementTick")

      currentTime = 0
      controller.start()
      controller.updateParameters({ maxFPS: 30 })

      // 30FPSの場合は33.33ms毎にtick
      currentTime = 34
      callRafCallbacks(34)
      expect(incrementTickSpy).toHaveBeenCalledTimes(1)

      // 33.33ms未満では呼ばれない
      currentTime = 50
      callRafCallbacks(50)
      expect(incrementTickSpy).toHaveBeenCalledTimes(1)

      // 次のtickは33.33ms後
      currentTime = 68
      callRafCallbacks(68)
      expect(incrementTickSpy).toHaveBeenCalledTimes(2)
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
