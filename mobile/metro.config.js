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

// Keep resolution anchored to this app's node_modules. Without this, a module
// reached through ../shared can resolve a second copy of React from the repo
// root's node_modules (the Next.js app's), which fails at runtime with the
// invalid-hook-call error rather than anything that names the real cause.
config.resolver.disableHierarchicalLookup = true;

config.resolver.extraNodeModules = {
  "@shared": sharedRoot,
};

module.exports = config;
