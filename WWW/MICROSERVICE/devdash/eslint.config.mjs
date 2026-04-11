import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    "node_modules/**",
    "node_modules__old_*/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".devdash/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
  {
    files: ["src/**/*.{test,spec}.{ts,tsx}"],
    languageOptions: {
      globals: {
        afterAll: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        describe: "readonly",
        expect: "readonly",
        it: "readonly",
        vi: "readonly",
      },
    },
  },
]);

export default eslintConfig;
