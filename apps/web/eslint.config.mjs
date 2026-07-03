import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // API responses are untyped JSON envelopes; `any` is intentional here.
      "@typescript-eslint/no-explicit-any": "off",
      // Small QR/avatar images — next/image optimization not worth it for the MVP.
      "@next/next/no-img-element": "off",
      // Experimental React-Compiler lint: fires on standard async fetch→setState
      // data-loading and SSR-safe client detection, which are intentional here.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
