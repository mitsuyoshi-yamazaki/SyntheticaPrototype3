import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"
import tseslint from "@typescript-eslint/eslint-plugin"
import tsparser from "@typescript-eslint/parser"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  // JavaScript recommended rules
  js.configs.recommended,
  
  // TypeScript configurations
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // TypeScript strict rules
      ...tseslint.configs.strict.rules,
      // TypeScript recommended type-checked rules
      ...tseslint.configs["recommended-type-checked"].rules,
      // TypeScript stylistic type-checked rules
      ...tseslint.configs["stylistic-type-checked"].rules,
      
      // Custom rules
      "prefer-const": "error",
      "no-var": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/prefer-function-type": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "prefer-arrow-callback": "error",
    },
  },
  
  // Next.js and Prettier rules
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
]

export default eslintConfig
