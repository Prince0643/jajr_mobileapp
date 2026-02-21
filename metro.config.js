const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude web platform from bundling to avoid expo-sqlite WASM issues
config.resolver.blockList = [
  /.*\.wasm$/,
  /.*expo-sqlite.*web.*/,
];

module.exports = config;
