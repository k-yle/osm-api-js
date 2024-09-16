import tsEslint from "typescript-eslint";
import config from "eslint-config-kyle";

export default tsEslint.config(...config, {
  rules: { quotes: ["error", "double"] },
});
