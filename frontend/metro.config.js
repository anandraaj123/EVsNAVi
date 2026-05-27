const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Add support for .cjs files which modern Firebase SDK uses
defaultConfig.resolver.sourceExts.push('cjs');

// Disable unstable package exports if needed (some Firebase packages resolve better this way)
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;
