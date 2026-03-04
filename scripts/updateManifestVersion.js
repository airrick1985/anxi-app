// scripts/updateManifestVersion.js
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import pkg from '../package.json' with { type: 'json' };

// 1. 更新 manifest.json
const manifestPath = resolve('public', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
manifest.version = pkg.version;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
console.log(`✅ 已更新 manifest.json version = ${pkg.version}`);

// 2. 更新 src/version.js 讓前端介面同步
const versionJsPath = resolve('src', 'version.js');
const versionJsContent = `export const appVersion = "${pkg.version}";\n`;
writeFileSync(versionJsPath, versionJsContent, 'utf-8');
console.log(`✅ 已更新 src/version.js appVersion = ${pkg.version}`);
