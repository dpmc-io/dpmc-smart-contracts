module.exports = [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**", "artifacts/**", "cache/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        describe: "readonly",
        it: "readonly",
        before: "readonly",
        after: "readonly"
      }
    },
    rules: {}
  }
];
