import "@testing-library/jest-dom"

// PIXI.jsをモック化してESMエラーを回避
jest.mock("pixi.js", () => ({
  Graphics: jest.fn(),
  Text: jest.fn(),
  Application: jest.fn(),
}))
