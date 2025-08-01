import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  tseslint.configs.recommended,
  {
    files: ["**/*.{test,spec}.{ts,tsx,js,jsx}"],
    env: { "vitest-globals/env": true },
    plugins: { vitest: true },
    extends: ["plugin:vitest-globals/recommended"],
  },
]);
