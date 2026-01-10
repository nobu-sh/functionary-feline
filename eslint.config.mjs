import antfu from "@antfu/eslint-config";

export default antfu({
  stylistic: {
    indent: 2,
    quotes: "double",
    semi: true,
  },
  typescript: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
    overrides: {
      // Zod we redeclare the inferred types under same name
      "ts/no-redeclare": "off",
      // Dont let the promises float mom!
      "ts/no-floating-promises": ["error", {
        ignoreVoid: true,
        ignoreIIFE: true,
      }],
      "antfu/no-top-level-await": "off",
    },
  },
  markdown: false,
});
