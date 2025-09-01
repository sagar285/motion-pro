import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: process.cwd(),
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Fix unused variables warnings - allow underscore prefix
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "destructuredArrayIgnorePattern": "^_"
      }],
      
      // Turn off base rule to avoid conflicts
      "no-unused-vars": "off",
      
      // Fix explicit any warnings - downgrade to warning
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Fix other common TypeScript warnings
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-require-imports": "off",
      
      // Allow unescaped entities in JSX (quotes and apostrophes)
      "react/no-unescaped-entities": ["error", {
        "forbid": [">", "}"]
      }],
      
      // Relax some React hooks rules
      "react-hooks/exhaustive-deps": "warn",
      
      // Allow img tags (or make it a warning)
      "@next/next/no-img-element": "warn"
    }
  }
];

export default eslintConfig;