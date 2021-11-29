module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: [
    "@typescript-eslint",
  ],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],
  parserOptions: {
    createDefaultProgram: true,
    project: [
      "./tsconfig.json",
    ],
    tsconfigRootDir: __dirname,
    sourceType: "module"
  },
  rules: {
    "computed-property-spacing": ["warn", "never"],
    "array-bracket-spacing": ["warn", "never"],
    "object-curly-spacing": ["warn", "never"],
    "@typescript-eslint/type-annotation-spacing": ["warn", {
      before: false,
      after: true
    }],
    "space-in-parens": ["warn", "never"],
    "space-before-blocks": ["warn", "always"],
    "space-before-function-paren": ["warn", "never"],
    "semi": [2, "always"],
    "@typescript-eslint/no-explicit-any": "off",
    //"@typescript-eslint/no-extra-semi": "off",
    "@typescript-eslint/no-inferrable-types": "off",
    "no-else-return": "warn",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/explicit-member-accessibility": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/prefer-nullish-coalescing": "off",
    "@typescript-eslint/prefer-optional-chain": "warn",
    "@typescript-eslint/unbound-method": "off",
    "@typescript-eslint/prefer-as-const": "warn",
    "@typescript-eslint/no-this-alias": "off",
    "@typescript-eslint/prefer-optional-chain": "off",
    "@typescript-eslint/await-thenable": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_"
      },
    ],

    // TODO - enable these new recommended rules
    "@typescript-eslint/no-floating-promises": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/restrict-plus-operands": "off",
    "@typescript-eslint/restrict-template-expressions": "off",
    "@typescript-eslint/naming-convention": [
      "warn",
      {
        selector: "enum",
        format: ["UPPER_CASE"]
      },
      {
        selector: "enumMember",
        format: ["UPPER_CASE"],
        leadingUnderscore: "forbid",
        trailingUnderscore: "forbid"
      },
      {
        selector: "memberLike",
        modifiers: ["private"],
        format: ["camelCase"],
        leadingUnderscore: "require"
      },
      {
        selector: "interface",
        format: ["PascalCase"],
        prefix: ["I"],
      },
    ],
    curly: "off",
    "no-mixed-operators": "warn",
    "no-console": "warn",
    "no-process-exit": "warn",
  }
};
