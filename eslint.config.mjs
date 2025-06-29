import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    rules: {
      "prefer-const": "error",
      "no-var": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/prefer-function-type": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "prefer-arrow-callback": "error",
    },
  },
]

export default eslintConfig
