// scripts/generateReleaseNotes.js (ESM)
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from '../package.json' with { type: 'json' }; // 導入 package.json 以獲取版本號

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 你的 GitHub Repo
const REPO_URL = 'https://github.com/airrick1985/anxi-app';

// 定義類別映射和用於匹配前導符號的正規表達式
const CATEGORY_MAP = {
  '✨': '新功能 (Features)',
  'feat': '新功能 (Features)',
  '🐛': '錯誤修復 (Bug Fixes)',
  'fix': '錯誤修復 (Bug Fixes)',
  '🛠️': '改進/優化 (Improvements)',
  'perf': '效能優化 (Performance)',
  'refactor': '程式碼重構 (Refactor)',
  'docs': '文件更新 (Documentation)',
  'chore': '雜項 (Chore)',
  'style': '樣式調整 (Style)',
  'test': '測試 (Tests)',
  '🚀': '部署 (Deployment)',
  '📝': '文件 (Documentation)',
  '🎨': '樣式 (Style)',
  '♻️': '重構 (Refactor)',
  '✅': '測試 (Tests)',
  '📦': '依賴 (Dependencies)',
  '⚙️': '配置 (Configuration)',
  '🚧': '進行中 (Work in Progress)',
  '🔥': '移除程式碼 (Remove Code)',
  '🚨': '重大變更 (Breaking Changes)',
};

// 用於匹配前導表情符號或關鍵字的正規表達式
// 這裡只包含您目前使用的 🐛 和 🛠️，您可以根據需要擴展 CATEGORY_MAP 和這個 Regex
const LEADING_SYMBOL_REGEX = /^(🐛|🛠️|✨|feat|fix|perf|refactor|docs|chore|style|test|🚀|📝|🎨|♻️|✅|📦|⚙️|🚧|🔥|🚨)\s*:\s*|^(🐛|🛠️|✨|🚀|📝|🎨|♻️|✅|📦|⚙️|🚧|🔥|🚨)\s*/i;


// 1. 讀取 CHANGELOG.md
const changelogPath = resolve(__dirname, '../CHANGELOG.md');
const changelog = readFileSync(changelogPath, 'utf-8');

// 2. 找出最新版本區塊
// 匹配格式: ## [版本號] - YYYY-MM-DD
const sectionMatch = changelog.match(/## \[(.*?)\] - (\d{4}-\d{2}-\d{2})\r?\n([\s\S]*?)(?=\r?\n## |\r?\n*$)/);

if (!sectionMatch) {
  console.error('❌ 找不到 CHANGELOG.md 的最新版本區塊');
  process.exit(1);
}

const [, versionFromChangelog, dateFromChangelogMarkdown, notesBlock] = sectionMatch;

// 產生現在時間 yyyy-mm-dd-hh-mm-ss (作為 fallback 或額外資訊)
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const currentTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours() + 8)}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

// 優先使用 CHANGELOG.md 中的日期，如果沒有則使用當前時間戳
const finalDate = dateFromChangelogMarkdown || currentTimestamp;


// 3. 解析 notes 並進行分類
const categorizedNotes = {};
const rawNotes = []; // 儲存原始未分類的筆記，以防萬一或用於其他顯示

notesBlock
  .split('\n')
  .filter(line => line.trim().startsWith('- ')) // 只處理以 '- ' 開頭的行
  .forEach(line => {
    let originalText = line.replace(/^- /, '').trim();
    rawNotes.push(originalText); // 將原始筆記加入 rawNotes 列表

    let text = originalText;
    let category = '其他 (Miscellaneous)'; // 預設類別

    const match = text.match(LEADING_SYMBOL_REGEX);
    if (match) {
      const matchedSymbolOrKeyword = match[1] || match[2]; // 根據哪個捕獲組匹配到
      if (matchedSymbolOrKeyword) {
        // 查找對應的類別
        const foundCategory = CATEGORY_MAP[matchedSymbolOrKeyword.toLowerCase()];
        if (foundCategory) {
          category = foundCategory;
          // 從文本中移除匹配到的符號或關鍵字
          text = text.replace(match[0], '').trim();
        }
      }
    }

    // 將 #123 類型的文字替換成超連結
    text = text.replace(/#(\d+)/g, (_, issueNumber) => {
      return `[#${issueNumber}](${REPO_URL}/issues/${issueNumber})`;
    });

    if (!categorizedNotes[category]) {
      categorizedNotes[category] = [];
    }
    categorizedNotes[category].push(text);
  });

// 4. 組成輸出物件
const output = {
  version: pkg.version || versionFromChangelog, // 優先使用 package.json 的版本
  date: finalDate,
  categories: categorizedNotes, // 新的分類結構
  rawNotes: rawNotes, // 原始筆記列表
};

// 5. 寫入 public/release-notes.json
const target = resolve(__dirname, '../public/release-notes.json');
writeFileSync(target, JSON.stringify(output, null, 2), 'utf-8');
console.log(`🎉 產生完成：release-notes.json (v${output.version}, ${output.date})`);