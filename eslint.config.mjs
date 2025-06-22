import js from "@eslint/js";
import { config, configs } from "typescript-eslint";

export default config(
   {
      ignores: ["dist", "deploy"],
   },
   {
      settings: {
         "import/resolver": {
            typescript: {
               project: "packages/*/tsconfig.json",
            },
         },
      },
      extends: [js.configs.recommended, ...configs.recommended],
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
         ecmaVersion: 2020,
      },
      plugins: {},
      rules: {},
   },
);
