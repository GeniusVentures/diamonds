import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";
import prettier from "eslint-plugin-prettier";
import security from "eslint-plugin-security";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import diamondRules from "./eslint-diamond-rules.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
  // Global ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/artifacts/**",
      "**/cache/**",
      "**/coverage/**",
      "**/test-assets/**",
      "**/scripts/devops/**",
      "**/dist/**",
      "eslint-diamond-rules.js", // Plugin config file, not to be linted
      "eslint.config.mjs", // ESLint config itself, not to be linted
    ],
  },

  // Base config for JavaScript files (no TypeScript parsing)
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: 2021,
      sourceType: "module",
    },
    plugins: {
      prettier: prettier,
    },
    rules: {
      ...prettierConfig.rules,
      "no-console": "off",
      "no-debugger": "error",
    },
  },

  // TypeScript files configuration
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.mocha,
        ...globals.node,
      },
      parser: tsParser,
      ecmaVersion: 2021,
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      security: security,
      "diamond-rules": diamondRules,
      prettier: prettier,
    },
    rules: {
      // Prettier
      ...prettierConfig.rules,
      "prettier/prettier": "error",

      // TypeScript recommended overrides
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-unused-expressions": "off",

      // Security rules
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-possible-timing-attacks": "error",
      "security/detect-new-buffer": "error",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-non-literal-require": "error",
      "security/detect-object-injection": "warn",
      "security/detect-unsafe-regex": "error",

      // Diamond proxy specific security rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "warn",

      // General code quality
      "no-console": "off",
      "no-debugger": "error",

      // Security-focused rules for smart contract interactions
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",

      // Custom Diamond rules
      "diamond-rules/diamond-storage-pattern": "error",
      "diamond-rules/diamond-selector-validation": "error",
      "diamond-rules/secure-external-calls": "warn",
    },
  },
];
