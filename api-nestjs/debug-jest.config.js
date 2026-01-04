const baseConfig = require('./jest.config.js');

module.exports = {
    ...baseConfig,
    globalSetup: undefined,
    globalTeardown: undefined,
};
