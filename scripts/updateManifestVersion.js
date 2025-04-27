// scripts/updateManifestVersion.js
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import pkg from '../package.json' assert { type: 'json' };

const manifestPath = resolve('public', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

// 更新 version
manifest.version = pkg.version;

// 寫回去
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

console.log(`✅ 已更新 manifest.json version = ${pkg.version}`);
