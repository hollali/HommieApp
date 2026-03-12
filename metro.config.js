// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Workaround for Windows node:sea error
// Block node: protocol modules entirely
if (config.resolver) {
  const existingBlockList = Array.isArray(config.resolver.blockList) ? config.resolver.blockList : [];
  config.resolver.blockList = [...existingBlockList, /node:.*/];
  config.resolver.unstable_enablePackageExports = false;
} else {
  config.resolver = {
    blockList: [/node:.*/],
    unstable_enablePackageExports: false,
  };
}

module.exports = config;

