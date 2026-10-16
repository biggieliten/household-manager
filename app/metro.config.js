const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Let Metro bundle files from the shared folder
config.watchFolders = [
  ...(config.watchFolders ?? []),
  path.resolve(__dirname, "../shared"),
];
// Do NOT set this to false — Better Auth requires package exports
// config.resolver.unstable_enablePackageExports = false;

module.exports = config;
