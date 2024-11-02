import globals from "globals";
import pluginJs from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc";

export default [
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  {
    plugins: { jsdoc },
    files: ["src/**/*.js"],
    ignores: ["build/**/*", "webpack.config*.js"],
    rules: {
      "no-unused-vars": "warn",
      indent: ["error", 4, { "SwitchCase": 1 }],
      quotes: ["error", "double"],
      semi: ["error", "always"],

      // JSDoc rules
      "jsdoc/check-access": 2,
      "jsdoc/check-alignment": 2,
      "jsdoc/check-indentation": 1,
      "jsdoc/check-line-alignment": 1,
      "jsdoc/check-param-names": 2,
      "jsdoc/check-template-names": 1,
      "jsdoc/check-property-names": 2,
      "jsdoc/check-syntax": 1,
      "jsdoc/check-tag-names": 2,
      "jsdoc/check-types": 2,
      "jsdoc/check-values": 2,
      "jsdoc/empty-tags": 2,
      "jsdoc/implements-on-classes": 2,
      "jsdoc/informative-docs": 1,
      "jsdoc/match-description": 1,
      "jsdoc/multiline-blocks": 2,
      "jsdoc/no-bad-blocks": 1,
      "jsdoc/no-blank-block-descriptions": 1,
      "jsdoc/no-defaults": 1,
      "jsdoc/no-multi-asterisks": 2,
      // "jsdoc/no-undefined-types": 2,
      "jsdoc/require-asterisk-prefix": 1,
      "jsdoc/require-hyphen-before-param-description": 1,
      // "jsdoc/require-jsdoc": 1,
      "jsdoc/require-param": 2,
      "jsdoc/require-param-name": 2,
      "jsdoc/require-param-type": 2,
      "jsdoc/require-property": 2,
      "jsdoc/require-property-name": 2,
      "jsdoc/require-property-type": 2,
      "jsdoc/require-returns": 2,
      "jsdoc/require-returns-check": 2,
      "jsdoc/require-returns-type": 2,
      "jsdoc/require-template": 1,
      "jsdoc/require-throws": 1,
      "jsdoc/require-yields": 2,
      "jsdoc/require-yields-check": 2,
      "jsdoc/sort-tags": 1,
      "jsdoc/tag-lines": 2,
      "jsdoc/valid-types": 2,
    },
  },
];