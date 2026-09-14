# Mac 第二台電腦開發環境設定與雙機協作指南

> 適用情境：主力開發機為 Windows（`C:\Project\anxi-app\anxi-app`），另外新增一台 Mac 也要能開發、commit、發版、部署 Cloud Functions。
> 本文件在 git 版控內，兩台電腦都看得到；請保持更新。
> 最後更新：2026-09-08

---

## 0. 一分鐘總覽

| 項目 | 內容 |
|---|---|
| 前端 | Vue 3 + Vite + Vuetify，部署到 GitHub Pages（`gh-pages` 分支） |
| 後端 | Firebase Cloud Functions（Node 22，`functions/`），Firebase 專案 `apps-script-api-443402` |
| GitHub | `https://github.com/airrick1985/anxi-app.git`，主分支 `main` |
| Node 版本 | **22**（Windows 目前 v22.15.0；`functions/package.json` 的 engines 要求 22） |
| 必裝 CLI | git、Node 22 + npm、`gh`（GitHub CLI）、`firebase-tools`、（選配）`gcloud`、`cloudflared` |
| 不在 git 裡但必要的檔案 | `.env`、`docs/local/`、Claude Code 記憶檔（見第 4 章） |

---

## 1. Mac 基礎工具安裝（第一次用 Mac 必做）

打開「終端機」（Terminal，或 iTerm2），依序執行：

### 1.1 Xcode Command Line Tools（git 也隨之安裝）

```bash
xcode-select --install
```

跳出視窗後按「安裝」，等它跑完。

### 1.2 Homebrew（Mac 的套件管理器）

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

安裝完成後，畫面最後會提示兩行 `echo ... >> ~/.zprofile` 與 `eval ...` 的指令，**照著貼上執行**（Apple Silicon 的 Mac 路徑是 `/opt/homebrew`）。然後：

```bash
brew --version
```

### 1.3 Node 22（建議用 nvm，方便切版本）

```bash
brew install nvm
mkdir -p ~/.nvm
```

把下面幾行加進 `~/.zshrc`（可用 `nano ~/.zshrc` 編輯，存檔 Ctrl+O、離開 Ctrl+X）：

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$(brew --prefix nvm)/nvm.sh" ] && . "$(brew --prefix nvm)/nvm.sh"
```

重新開啟終端機（或 `source ~/.zshrc`），再：

```bash
nvm install 22
nvm alias default 22
node -v    # 應顯示 v22.x.x
npm -v
```

### 1.4 GitHub CLI、Firebase CLI

```bash
brew install gh
npm install -g firebase-tools
gh --version
firebase --version
```

### 1.5 選配工具

| 工具 | 用途 | 安裝 |
|---|---|---|
| Google Chrome | `scripts/captureLandingShots.mjs`、`scripts/smokeSalesDrawing.mjs` 用 puppeteer-core 開啟 | 官網下載安裝 |
| `gcloud` | 部署 `ai-proxy-backend/`（gen2 Cloud Function，`gcloud functions deploy aiProxy ...`） | `brew install --cask google-cloud-sdk` |
| `cloudflared` | 測 LIFF 時把 localhost 開成 https 網址 | `brew install cloudflared` |
| VS Code | 編輯器，裝 **Vue (Official)** 與 **Claude Code** 擴充 | `brew install --cask visual-studio-code` |

---

## 2. Git 與 GitHub 認證

### 2.1 使用者資訊（與 Windows 一致，commit 作者才不會分裂）

```bash
git config --global user.name  "airrick1985"
git config --global user.email "airrick1985@gmail.com"
```

### 2.2 換行字元設定（跨 Windows / Mac 必設）

```bash
git config --global core.autocrlf input
```

Windows 那台通常是 `autocrlf=true`，Mac 設 `input` 後兩邊 repo 內一律存 LF，不會出現整個檔案「全部行都被改」的假 diff。

### 2.3 GitHub 登入（讓 `git push` 與 `gh-pages` 部署免密碼）

```bash
gh auth login
```

選項依序選：**GitHub.com → HTTPS → Yes（用 GitHub 憑證認證 git）→ Login with a web browser**，複製一次性代碼到瀏覽器完成。之後：

```bash
gh auth setup-git
gh auth status
```

---

## 3. 取得專案

建議路徑與 Windows 對齊，Claude Code 的記憶檔（第 4.3 節）也比較好對照：

```bash
mkdir -p ~/Project/anxi-app
cd ~/Project/anxi-app
git clone https://github.com/airrick1985/anxi-app.git anxi-app
cd anxi-app
```

安裝相依套件（根目錄與 functions 各一次）：

```bash
npm install
cd functions && npm install && cd ..
```

> 備註
> - `xlsx` 套件是從 `https://cdn.sheetjs.com/...` 的 tgz 直接安裝，需要網路可連到 sheetjs。
> - `sass-embedded`、`puppeteer-core` 會下載平台對應的二進位，第一次安裝較久屬正常。

---

## 4. 把「不在 git 裡」的東西搬到 Mac

以下檔案因 `.gitignore` 排除，**必須從 Windows 手動複製**（AirDrop、隨身碟、iCloud、私人雲端皆可，但 `.env` 內含金鑰，不要走公開管道）。

### 4.1 `.env`（前端環境變數，必要）

位置：專案根目錄 `.env`。目前包含 4 個 key（值請從 Windows 複製）：

```
VITE_LIFF_ID_PROD=
VITE_LIFF_ID_DEV=
VITE_LIFF_ID_LEAD_REPORT=
VITE_LIFF_ID_FORM=
```

沒有這個檔，`npm run dev` 能跑，但 LIFF 相關頁面（預約時間表、名單回報、自訂表單）會拿不到 LIFF ID。

Cloud Functions 的密鑰（Gmail、LINE、Drive、Gemini 等）都存在 **Firebase Secret Manager**，隨 `firebase deploy` 自動掛載，**本機不需要任何 functions 的 .env**。

### 4.2 `docs/local/`（本機文件夾，建議搬）

整個資料夾 gitignore（見記憶 `project_docs_local_folder`）。裡面是資料備份 JSON、行銷文案草稿、LOGO 素材、`tmp/` 的截圖腳本範本等。若要在 Mac 上做相關工作就整包複製過去；不影響 build 與部署。

### 4.3 Claude Code 記憶檔（強烈建議搬，否則 Claude 在 Mac 上會「失憶」）

Claude Code 的專案記憶不是存在 repo 裡，而是依 **專案路徑** 存在使用者家目錄：

| 電腦 | 記憶資料夾 |
|---|---|
| Windows | `C:\Users\user\.claude\projects\c--Project-anxi-app-anxi-app\memory\` |
| Mac（若照第 3 章的路徑 clone） | `~/.claude/projects/-Users-<你的mac帳號>-Project-anxi-app-anxi-app/memory/` |

資料夾名稱是專案完整路徑把 `/` 和 `\` 換成 `-` 得來的。在 Mac 上第一次用 Claude Code 開這個專案後，該資料夾會自動建立；把 Windows 的 `memory/` 整包（含 `MEMORY.md` 與 37 個 `*.md`）複製進去覆蓋即可。

> 之後兩邊各自累積的記憶不會自動同步。建議每隔一段時間把「較新的那台」的 `memory/` 複製到另一台，或以 Windows 為準單向覆蓋。

### 4.4 其他選配

| 項目 | 說明 |
|---|---|
| `.claude/settings.local.json` | 本機權限白名單，可複製過去省掉一些權限詢問；不複製也能用 |
| `.claude/skills/ai-ad-prompt-guide/` | 第三方 skill，gitignore；需要再複製 |
| `docs/*.pdf` | 合約範本樣張（含個資），gitignore；需要再複製 |
| `快速指令.TXT`（根目錄） | 在 git 裡，會一起 clone 下來，是常用指令小抄 |

---

## 5. Firebase 登入與驗證

```bash
firebase login              # 用 airrick1985@gmail.com 登入
firebase use apps-script-api-443402
firebase projects:list
```

`.firebaserc` 已在 repo 內指定預設專案，`firebase use` 主要是確認登入帳號有權限。

---

## 6. 在 Mac 上跑起來（驗收清單）

```bash
cd ~/Project/anxi-app/anxi-app
npm run dev              # 開 http://localhost:5173
```

可以登入、看到建案列表，代表前端環境 OK。再確認：

```bash
npx vue-tsc --noEmit     # 型別檢查過
node --check functions/index.js   # functions 語法過
gh auth status           # GitHub OK
firebase projects:list   # Firebase OK
```

---

## 7. 日常工作流（兩台電腦通用）

### 7.1 每次開工前 **一定先拉**

```bash
git pull --rebase origin main
```

兩台電腦交替開發，最常見的災難就是忘了 pull 就開始改，最後 push 衝突。養成「開工先 pull、收工必 push」的習慣。

### 7.2 開發

```bash
npm run dev
```

### 7.3 Commit（直接進 main，不開分支）

依專案慣例（記憶 `feedback_commit_to_main_workflow`、`feedback_commit_changelog_update_notes`）：

1. 先執行 `/commit-notes` skill，把本次更新摘要寫進 `CHANGELOG.md` 頂部（讓前台「新版本已推出」modal 顯示）。
2. 再 commit 到 `main` 並 push。

```bash
git add -A
git commit -m "說明"
git push
```

### 7.4 發版（bump 版本 → 產 release notes → commit → push → 部署 GitHub Pages）

```bash
npm run release:safe
```

`release:safe` 會先 `git pull --rebase origin main` 再執行 `release:publish`，避免兩台電腦各自 bump 造成版本號分岔（記憶 `feedback_release_pull_rebase_first`）。**兩台電腦不要同時發版。**

### 7.5 只重新打包部署（改圖片、錯字，不升版）

```bash
npm run deploy
```

### 7.6 部署 Cloud Functions

```bash
# 只部署改到的函式（強烈建議）
firebase deploy --only functions:FUNCTION_NAME

# 全部（慢，且容易 discovery timeout）
FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions
```

Mac 上設環境變數是把 `FUNCTIONS_DISCOVERY_TIMEOUT=120` 直接寫在指令前面（Windows PowerShell 則是 `$env:FUNCTIONS_DISCOVERY_TIMEOUT=120`）。新增或修改函式一律 `memory: "512MiB"`（記憶 `feedback_cloud_functions_memory`）。

### 7.7 測 LIFF（需要 https 網址）

```bash
npm run dev
cloudflared tunnel --url http://localhost:5173
```

把產生的 `https://xxx.trycloudflare.com` 填到 LINE Developers 的 LIFF Endpoint URL（DEV 那組）。

### 7.8 部署 AI 助理代理（`ai-proxy-backend/`，需 gcloud）

```bash
gcloud auth login
gcloud config set project apps-script-api-443402
cd ai-proxy-backend
gcloud functions deploy aiProxy --gen2 --runtime=nodejs20 --region=us-central1 --source=. --entry-point=aiProxy --trigger-http
```

---

## 8. 雙機切換的守則

| 時機 | 要做的事 |
|---|---|
| 離開 A 電腦前 | `git status` 確認乾淨；有改就 commit + push。做到一半不想 commit 的，至少 `git stash` 或用 WIP commit 推上去 |
| 到 B 電腦開工 | `git pull --rebase origin main`；若 `package.json` 有變動就再 `npm install`（functions 亦同） |
| 改了 `.env` | 另一台要手動同步（不在 git） |
| 改了 `docs/local/` 內容 | 另一台要手動同步（不在 git） |
| Claude 學到新記憶 | 定期把 `memory/` 複製到另一台（第 4.3 節） |
| 發版 | 只在一台上跑 `npm run release:safe`，跑完另一台記得 pull |
| 遇到 push 被拒（rejected） | `git pull --rebase origin main` 解衝突後再 push；**不要** `git push --force` |

---

## 9. Windows 與 Mac 的差異與注意事項

### 9.1 寫死 Windows 路徑的腳本

以下兩支腳本把 Chrome 路徑寫死成 Windows：

- `scripts/captureLandingShots.mjs` 第 12 行
- `scripts/smokeSalesDrawing.mjs` 第 10 行

```js
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
```

在 Mac 上跑時請暫時改成：

```js
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
```

（或之後把它改成依 `process.platform` 自動判斷、可用環境變數 `CHROME_PATH` 覆蓋，兩台就都不用改。）

### 9.2 Shell 語法差異

| 動作 | Windows PowerShell | Mac zsh |
|---|---|---|
| 設環境變數跑指令 | `$env:FOO=1; npm run x` | `FOO=1 npm run x` |
| 路徑分隔 | `\` 或 `/` | `/` |
| 查看檔案 | `Get-Content`、`type` | `cat`、`less` |
| 殺 port 5173 | `netstat -ano \| findstr 5173` | `lsof -ti:5173 \| xargs kill` |

`package.json` 的 scripts 已做跨平台處理（`cross-env`、`scripts/releaseCommit.js`），`npm run ...` 系列在兩邊行為一致。

### 9.3 `.claude/settings.json` 內的 Windows 路徑白名單

repo 內的 `.claude/settings.json` 有些 `Bash(git -C "c:/Project/...")` 的允許項目，在 Mac 上不會匹配到，但無害，Claude 會另外詢問權限。

### 9.4 全域 Claude Code 設定（`~/.claude/settings.json`）

Windows 的全域設定裡有兩個提示音 hook 是用 PowerShell 播 `.wav`，直接搬到 Mac 會失敗。Mac 上若要提示音，改成：

```json
"hooks": {
  "Stop": [{ "matcher": "", "hooks": [{ "type": "command", "command": "afplay /System/Library/Sounds/Glass.aiff" }] }],
  "Notification": [{ "matcher": "", "hooks": [{ "type": "command", "command": "afplay /System/Library/Sounds/Ping.aiff" }] }]
}
```

其他設定（`model`、`theme`、`additionalDirectories` 等）依需要自行複製；`additionalDirectories` 內的 Windows 路徑要改成 Mac 路徑。

### 9.5 檔名大小寫

Mac 預設檔案系統**不分大小寫**，Windows 也不分，但 GitHub / Linux 分。import 路徑的大小寫請與實際檔名完全一致，否則本機正常、CI 或別台機器壞掉。

### 9.6 `.DS_Store`

已在 `.gitignore`，不用擔心。

---

## 10. Claude Code 在 Mac 上

1. VS Code 安裝 **Claude Code** 擴充（或終端機 `npm install -g @anthropic-ai/claude-code` 後執行 `claude`）。
2. 用同一個 Anthropic 帳號登入。
3. 打開 `~/Project/anxi-app/anxi-app` 這個資料夾啟動 Claude Code，讓它建立專案記憶資料夾。
4. 把 Windows 的 `memory/` 複製過去（第 4.3 節）。
5. repo 內的 `.claude/skills/commit-notes/` 會隨 clone 一起過來，`/commit-notes` 在 Mac 上可直接用。

---

## 11. 疑難排解

| 症狀 | 處理 |
|---|---|
| `npm install` 卡在 `sass-embedded` 或 `puppeteer-core` | 網路問題居多，重跑一次；或 `rm -rf node_modules package-lock.json` 後再裝（注意 lock 檔會變，非必要不要 commit 它） |
| `npm run build` 記憶體不足 | 已內建 `--max-old-space-size=4096`；若仍失敗，關掉其他程式重跑 |
| `gh-pages` 部署失敗 `Permission denied` | `gh auth setup-git` 沒做，或 `gh auth status` 已過期，重新 `gh auth login` |
| `firebase deploy` 顯示 `Error: Failed to list functions` / discovery timeout | 前面加 `FUNCTIONS_DISCOVERY_TIMEOUT=120` |
| `firebase deploy` 顯示沒有權限 | `firebase login --reauth`，確認是 `airrick1985@gmail.com` |
| `vue-tsc` 在 Mac 報錯但 Windows 沒有 | 多半是檔名大小寫（9.5 節）或 Node 版本不同，先 `node -v` 確認是 22 |
| Claude 完全不記得專案慣例 | 記憶檔沒搬（4.3 節） |
| 一堆檔案顯示被修改但內容沒改 | 換行字元問題，確認 `git config --global core.autocrlf input`，然後 `git checkout -- .` 還原 |
