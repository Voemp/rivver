const { withNativeWind } = require('nativewind/metro')
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Monorepo support: watch the entire monorepo
config.watchFolders = [monorepoRoot]

// Resolve modules from both app and monorepo root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 })
