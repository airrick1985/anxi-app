// scripts/generateReleaseNotes.js
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from '../package.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. 讀取 CHANGELOG.md
const changelogPath = resolve(__dirname, '../CHANGELOG.md');
const changelog = readFileSync(changelogPath, 'utf-8');

// 2. 解析出最新區塊
const match = changelog.match(/^## \[(.*?)\] - (\d{4}-\d{2}-\d{2})\n([\s\S]*?)(?=^## \[|\s*$)/m);

if (!match) {
  console.error('❌ 找不到有效的 CHANGELOG 版本段落！請檢查格式是否正確。');
  process.exit(1);
}

const [, versionInChangelog, dateInChangelog, notesBlock] = match;

// 3. 抓出每一條 "- " 的 notes
const notes = notesBlock
  .split('\n')
  .filter(line => line.trim().startsWith('- '))
  .map(line => line.trim().replace(/^- /, ''));

// 4. 組成 release-notes.json 格式
const output = {
  version: versionInChangelog || pkg.version,
  date: dateInChangelog,
  notes
};

// 5. 寫入 public/release-notes.json
const targetPath = resolve(__dirname, '../public/release-notes.json');
writeFileSync(targetPath, JSON.stringify(output, null, 2), 'utf-8');

console.log(`🎉 已產生 release-notes.json：v${output.version} (${output.date})`);
