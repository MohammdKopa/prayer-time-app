// Metro config — teaches the bundler about ../shared.
//
// The prayer engine lives outside this project root so the website and this
// app compute prayer times from one copy. Metro does not follow files outside
// the project root by default, so it needs both:
//
//   watchFolders      — permission to read and hot-reload ../shared
//   nodeModulesPaths  — where to resolve ../shared's own imports (adhan) from,
//                       since shared/ has no node_modules of its own
//
// adhan is pinned to an exact version in mobile/package.json, the website's
// package.json and scripts/package.json. Do not loosen it to a caret range:
// it is the library that decides prayer times, and a silent patch bump on one
// platform and not the others would fork the engine through its dependency.

const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, "..");
const sharedRoot = path.resolve(repoRoot, "shared");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders ?? []), sharedRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  ...(config.resolver.nodeModulesPaths ?? []),
];

// nodeModulesPaths above puts this app's node_modules FIRST, so ../shared
// resolves adhan from here rather than from the repo root (the Next.js app's
// copy). Hierarchical lookup is deliberately left on — expo-doctor flags
// disabling it, and nothing in shared/ imports React, so there is no second
// copy of React to guard against. adhan is pinned to one exact version across
// all three package.json files, so either path would resolve the same code.

config.resolver.extraNodeModules = {
  "@shared": sharedRoot,
};

module.exports = config;
