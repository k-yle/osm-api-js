import tsEslint from "typescript-eslint";
import config from "eslint-config-kyle";

export default tsEslint.config(...config, {
  ignores: ["**/*.snap"],
  rules: { quotes: ["error", "double"] },
});
