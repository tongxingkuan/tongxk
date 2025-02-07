// @ts-check
import js from "@eslint/js";
import json from "eslint-plugin-json";
import stylistic from "@stylistic/eslint-plugin";
import stylisticJsx from "@stylistic/eslint-plugin-jsx";
import globals from "globals";
import ts from "typescript-eslint";

const stylisticConfig = stylistic.configs.customize({
  indent: 2,
  quotes: "single",
  semi: false,
  jsx: true,
  braceStyle: "1tbs",
});
const { rules: stylisticRules, ...restStylisticConfig } = stylisticConfig;
export const eslintPreset = () => [
  {
    ignores: [
      "**/node_modules/",
      "**/.git/",
      "**/dist/",
      "**/build/",
      "**/coverage/",
      "**/*.config.js",
    ],
  },
  {
    files: ["**/*.{tsx,ts,jsx,js}"],
    ...restStylisticConfig,
    rules: {
      ...stylisticRules,
      "@stylistic/array-bracket-spacing": ["error", "never"],
      "@stylistic/arrow-parens": ["error", "as-needed"],
      "@stylistic/jsx-one-expression-per-line": ["off"],
      "@stylistic/jsx-first-prop-new-line": "off",
      "@stylistic/jsx-max-props-per-line": "off",
      "@stylistic/quote-props": ["error", "as-needed"],
      "@stylistic/max-statements-per-line": ["error", { max: 2 }],
    },
  },
  {
    files: ["**/*.js"],
    ...js.configs.recommended,
  },
  {
    files: ["**/*.json"],
    ...json.configs.recommended,
    rules: {
      "json/*": "off",
      "json/trailing-comma": "off",
    },
  },
  {
    files: ["**/*.jsx", "**/*.tsx"],
    plugins: {
      "@stylistic/jsx": stylisticJsx,
    },
    rules: {
      "@stylistic/jsx/jsx-pascal-case": [
        "error",
        {
          allowAllCaps: false,
          allowNamespace: true,
          allowLeadingUnderscore: true,
          ignore: ["hi"],
        },
      ],
      "@stylistic/jsx/jsx-self-closing-comp": [
        "error",
        { component: true, html: true },
      ],
    },
  },
  ...ts.config(
    {
      languageOptions: {
        globals: {
          ...globals.browser,
        },
      },
    },
    {
      files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
      languageOptions: {
        parserOptions: {
          project: "./tsconfig.app.json",
        },
      },
      extends: ts.configs.recommendedTypeChecked,
      rules: {
        "no-unused-vars": [
          "warn",
          {
            vars: "all",
            args: "none",
            argsIgnorePattern: "^_",
            caughtErrors: "none",
            ignoreRestSiblings: true,
          },
        ],
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/no-redundant-type-constituents": "off",
        "@typescript-eslint/no-unnecessary-type-constraint": "off",
        "@typescript-eslint/no-empty-object-type": "off",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            vars: "all",
            args: "none",
            caughtErrors: "none",
            ignoreRestSiblings: true,
            argsIgnorePattern: "^_",
          },
        ],
      },
    },
  ),
];

export default eslintPreset;
