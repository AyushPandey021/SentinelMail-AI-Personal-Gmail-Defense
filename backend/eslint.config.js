import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      parserOptions: { ecmaVersion: 2022, sourceType: "module" }
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off"
    }
  }
];
