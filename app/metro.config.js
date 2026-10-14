const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Do NOT set this to false — Better Auth requires package exports
// config.resolver.unstable_enablePackageExports = false;

module.exports = config;
