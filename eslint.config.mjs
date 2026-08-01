import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["src/app/**"],
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
  },
  {
    ignores: ["src/app/**"],
    files: ["**/*.js"],
    languageOptions: { sourceType: "module" },
  },
  {
    files: ["src/app/**/*.js"],
    languageOptions: { globals: globals.browser },
  },
]);
