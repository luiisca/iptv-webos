const postCssPresetEnv = require("postcss-preset-env");

const config = {
  plugins: [postCssPresetEnv({ stage: 0 })],
};

module.exports = config;
