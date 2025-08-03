const nextJest = require("next/jest")

const createJestConfig = nextJest({
  dir: "./",
})

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  transformIgnorePatterns: ["node_modules/(?!(pixi\\.js|@pixi|earcut|@xmldom|parse-svg-path)/)"],
}

module.exports = createJestConfig(customJestConfig)
