import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";

export default defineConfig([
  globalIgnores([
    ".next/**",
    "build/**",
    "coverage/**",
    "dist/**",
    "node_modules/**",
    "playwright-report/**",
    "test-results/**",
    "*.min.js",
    "next-env.d.ts",
  ]),
  {
    files: ["**/*.{js,cjs,mjs,ts,mts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: { ...globals.browser, ...globals.node },
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      "@typescript-eslint": tsPlugin,
      "jsx-a11y": jsxA11yPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactPlugin.configs.flat["jsx-runtime"].rules,
      ...reactHooksPlugin.configs["recommended-latest"].rules,
      ...jsxA11yPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-html-link-for-pages": "off",
    },
    settings: {
      react: { version: "detect" },
    },
  },
]);
