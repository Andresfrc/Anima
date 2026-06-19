// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: ["dist/*", ".expo/*", "node_modules/*"],
  },
  {
    rules: {
      // `react/no-unescaped-entities` es una regla pensada para HTML/web: en
      // React Native <Text> renderiza comillas y apóstrofes sin problema, así
      // que aquí solo genera ruido. La desactivamos a propósito.
      "react/no-unescaped-entities": "off",
      // Componentes internos sin displayName: útil saberlo, pero no debe romper
      // el build de CI.
      "react/display-name": "warn",
    },
  },
]);
