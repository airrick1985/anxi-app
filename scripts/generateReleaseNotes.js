// scripts/generateReleaseNotes.js (ESM版)
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from '../package.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. 讀取 CHANGELOG.md
const changelog = readFileSync(resolve(__dirname, '../CHANGELOG.md'), 'utf-8');

// 2. 找到最新一版的段落（從第一個 ## 開始到下一個 ##）
const [firstSection] = changelog.split(/^## \[/m).slice(1); // 第一個版本
const [headerLine, ...restLines] = firstSection.split('\n');

// 3. 從 restLines 中過濾出 - 開頭的行，拿掉前面的 - 和空白
const notes = restLines
  .map(line => line.trim())
  .filter(line => line.startsWith('- '))
  .map(line => line.slice(2).trim());

// 4. 從 headerLine 取出版本號和日期
const match = headerLine.match(/^([^\]]+)\] - (\d{4}-\d{2}-\d{2})/);
const versionFromChangelog = match?.[1] ?? pkg.version;
const dateFromChangelog = match?.[2] ?? new Date().toISOString().slice(0, 10);

// 5. 組成 release-notes.json
const output = {
  version: versionFromChangelog,
  date: dateFromChangelog,
  notes
};

// 6. 寫入 public/release-notes.json
const outputPath = resolve(__dirname, '../public/release-notes.json');
writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

console.log(`🎉 成功產生 release-notes.json v${output.version} (${output.date})`);
