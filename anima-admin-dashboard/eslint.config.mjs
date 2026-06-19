import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Avisos de la era React Compiler (eslint-plugin-react-hooks v6) que marcan
      // patrones idiomáticos y preexistentes (fetch-en-effect, badge inline). Se
      // dejan como WARN: visibles como deuda técnica, sin bloquear el CI.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/immutability": "warn",
      // Regla cosmética: React DOM ya escapa las comillas en texto JSX.
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
