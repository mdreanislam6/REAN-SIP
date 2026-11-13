#!/usr/bin/env node
/**
 * Repairs `expo-module.config.json` files that declare an Android `publication`
 * block without a `version` field.
 *
 * Expo's Gradle autolinking plugin deserialises that block into a Kotlin data
 * class where `version` is required, so a package that omits it makes
 * `./gradlew assembleRelease` fail with:
 *
 *   kotlinx.serialization.MissingFieldException:
 *     Field 'version' is required for type with serial name
 *     'expo.modules.plugin.configuration.Publication', but it was missing
 *
 * Some published Expo module versions ship exactly that. The version is only
 * used to resolve the module's local Maven artifact, so filling it in from the
 * package's own package.json is safe and keeps the build reproducible.
 *
 *   node scripts/patch-expo-modules.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NODE_MODULES = path.join(ROOT, 'node_modules');

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.bin' || entry.name === '.cache') continue;
      walk(full, out);
    } else if (entry.name === 'expo-module.config.json') {
      out.push(full);
    }
  }
  return out;
}

function packageVersionFor(configPath) {
  // The config sits at the package root, next to its package.json.
  const pkgPath = path.join(path.dirname(configPath), 'package.json');
  try {
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
  } catch {
    return null;
  }
}

if (!fs.existsSync(NODE_MODULES)) {
  console.log('patch-expo-modules: no node_modules yet, nothing to do');
  process.exit(0);
}

const configs = walk(NODE_MODULES, []);
let patched = 0;

for (const configPath of configs) {
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    continue;
  }

  let changed = false;
  for (const platform of ['android', 'apple']) {
    const block = config[platform];
    if (!block || typeof block !== 'object') continue;
    const publication = block.publication;
    if (!publication || typeof publication !== 'object') continue;
    if (publication.version) continue;

    const version = packageVersionFor(configPath);
    if (!version) continue;
    publication.version = version;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
    patched += 1;
    console.log(`patched ${path.relative(ROOT, configPath)}`);
  }
}

console.log(`patch-expo-modules: ${patched} file(s) patched, ${configs.length} scanned`);
