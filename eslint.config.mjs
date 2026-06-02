import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import vitestGlobals from "eslint-plugin-vitest-globals";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  tseslint.configs.recommended,
  {
    ...vitestGlobals.configs["flat/recommended"],
    files: ["**/*.{test,spec}.{ts,tsx,js,jsx}"],
  },
]);
