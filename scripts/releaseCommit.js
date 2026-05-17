#!/usr/bin/env node
/**
 * 跨平台 Release Commit
 *
 * 取代原本 package.json 裡寫死的：
 *   git commit -m "Release v$(node -p "require('./package.json').version")"
 *
 * 該寫法用了 bash 的 $(...) 指令替換，在 Windows（cmd.exe）下不會被替換，
 * 導致 commit 訊息變成字面字串 "Release v$(node -p require('./package.json').version)"。
 *
 * 本腳本改用 Node 直接讀版本號並產生 commit，Windows / macOS / Linux 皆正確。
 *
 * 用法：
 *   node scripts/releaseCommit.js           → Release v1.2.3
 *   node scripts/releaseCommit.js --date    → Release v1.2.3 - 2026-05-17 11:40:00 (Asia/Taipei)
 */
const { execSync } = require('child_process');
const pkg = require('../package.json');

const version = pkg.version;
const withDate = process.argv.includes('--date');

function taipeiTimestamp() {
  // 以 Asia/Taipei 時區輸出 YYYY-MM-DD HH:MM:SS
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

const message = withDate
  ? `Release v${version} - ${taipeiTimestamp()}`
  : `Release v${version}`;

// 沿用原本「把所有變更一起進版」的發版流程；
// 不該進版的本機檔案請改用 .gitignore 排除。
execSync('git add -A', { stdio: 'inherit' });

// 沒有任何變更時不要讓整條發版鏈中斷
const staged = execSync('git diff --cached --name-only').toString().trim();
if (!staged) {
  console.log('ℹ️  沒有需要提交的變更，略過 release commit。');
  process.exit(0);
}

execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
console.log(`✅ 已建立發版 commit：${message}`);
