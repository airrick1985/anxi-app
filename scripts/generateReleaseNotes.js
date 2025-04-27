// scripts/generateReleaseNotes.js (ESM)
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from '../package.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 你的 GitHub Repo
const REPO_URL = 'https://github.com/airrick1985/anxi-app';

// 1. 讀取 CHANGELOG.md
const changelogPath = resolve(__dirname, '../CHANGELOG.md');
const changelog = readFileSync(changelogPath, 'utf-8');

// 2. 找出最新版本區塊
const sectionMatch = changelog.match(/## \[(.*?)\] - (\d{4}-\d{2}-\d{2})\n([\s\S]*?)(?=\n## |\n*$)/);

if (!sectionMatch) {
  console.error('❌ 找不到 CHANGELOG.md 的最新版本區塊');
  process.exit(1);
}

const [, versionFromChangelog, dateFromChangelog, notesBlock] = sectionMatch;

// 3. 解析 notes
const notes = notesBlock
  .split('\n')
  .filter(line => line.trim().startsWith('- '))
  .map(line => {
    let text = line.replace(/^- /, '').trim();
    // 將 #123 類型的文字替換成超連結
    text = text.replace(/#(\d+)/g, (_, issueNumber) => {
      return `[#${issueNumber}](${REPO_URL}/issues/${issueNumber})`;
    });
    return text;
  });

// 4. 組成輸出物件
const output = {
  version: pkg.version || versionFromChangelog,
  date: dateFromChangelog,
  notes
};

// 5. 寫入 public/release-notes.json
const target = resolve(__dirname, '../public/release-notes.json');
writeFileSync(target, JSON.stringify(output, null, 2), 'utf-8');
console.log(`🎉 產生完成：release-notes.json (v${output.version}, ${output.date})`);
