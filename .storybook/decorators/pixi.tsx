import React, { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import { Decorator } from '@storybook/react'

/**
 * PixiJSアプリケーションをStorybookで使用するためのデコレータ
 * WebGLコンテキストのメモリリークを防ぐため、適切なクリーンアップを行う
 */
export const withPixi: Decorator = (Story, context) => {
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

    // クリーンアップ関数
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
      }
    }
  }, [context.id]) // ストーリーが変わるたびに再実行

  return (
    <div style={{ padding: '20px' }}>
      <div ref={containerRef}>
        <Story {...context} containerRef={containerRef} appRef={appRef} />
      </div>
    </div>
  )
}

/**
 * PixiJSアプリケーションのセットアップヘルパー
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