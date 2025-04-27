// scripts/autoPush.js
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// 讀取 package.json 取得版本號
const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));
const version = pkg.version || 'unknown';

try {
  console.log(`🚀 開始 Git 推送：v${version}`);
  
  execSync('git add .', { stdio: 'inherit' });
  execSync(`git commit -m "發佈 v${version}"`, { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });

  console.log(`✅ 成功推送 v${version}`);
} catch (err) {
  console.error('❌ Git 推送失敗：', err.message);
  process.exit(1);
}
