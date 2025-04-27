// scripts/bumpVersion.js
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const pkgPath = resolve('package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

// 解析目前版本
const [major, minor, patch] = pkg.version.split('.').map(Number);

// 自動 +1 patch
const newVersion = `${major}.${minor}.${patch + 1}`;

pkg.version = newVersion;

// 寫回 package.json
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');

console.log(`🔖 版本號已自動升級至 v${newVersion}`);
