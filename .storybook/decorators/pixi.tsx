import React, { useEffect, useRef } from "react"
import * as PIXI from "pixi.js"
import { Decorator } from "@storybook/react"

/**
 * PixiJSアプリケーションをStorybookで使用するためのデコレータ
 * WebGLコンテキストのメモリリークを防ぐため、適切なクリーンアップを行う
 */
export const withPixi: Decorator = (_Story, context) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)

  useEffect(() => {
    // 前のアプリケーションをクリーンアップ
    if (appRef.current) {
      appRef.current.destroy(true, { children: true })
      appRef.current = null
    }

    // コンテナが存在しない場合は何もしない
    if (!containerRef.current) {
      return
    }

    // PixiJSアプリケーションを初期化
    const initApp = async () => {
      // ストーリーのargs（パラメータ）を取得
      const width = (context.args?.["width"] as number) || 300
      const height = (context.args?.["height"] as number) || 300
      const backgroundColor = (context.args?.["backgroundColor"] as number) || 0x101010

      const app = new PIXI.Application()
      await app.init({
        width,
        height,
        backgroundColor,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      if (app.canvas instanceof HTMLCanvasElement && containerRef.current) {
        containerRef.current.appendChild(app.canvas)
      }

      appRef.current = app

      // ストーリーコンポーネントに描画ロジックを委譲
      // renderFunctionがargs内に定義されている場合、それを実行
      if (
        context.args?.["renderFunction"] &&
        typeof context.args["renderFunction"] === "function"
      ) {
        // renderFunctionをバインドして、this contextとしてargsを設定
        context.args["renderFunction"].call(context.args, app)
      }
    }

    void initApp()

    // クリーンアップ関数
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
      }
    }
  }, [context.id, context.args]) // ストーリーまたはパラメータが変わるたびに再実行

  return (
    <div style={{ padding: "20px" }}>
      <div ref={containerRef} />
    </div>
  )
}

/**
 * PixiJSアプリケーションのセットアップヘルパー（互換性のため残す）
 * 各ストーリーで共通のPixiJS初期化処理を提供
 */
export const setupPixiApp = async (
  container: HTMLDivElement,
  options: Partial<PIXI.ApplicationOptions> = {}
): Promise<PIXI.Application> => {
  const app = new PIXI.Application()

  await app.init({
    width: 400,
    height: 300,
    backgroundColor: 0x101010,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    ...options,
  })

  if (app.canvas instanceof HTMLCanvasElement) {
    container.appendChild(app.canvas)
  }

  return app
}
