// GitHub Pages 不提供自訂 Cache-Control；保留近期舊資源，讓快取中的 HTML
// 與開著的舊分頁仍能載入動態 chunk。非 assets 檔案照常替換，避免保留已刪公開頁。
import { readdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ghpages from 'gh-pages';

export const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const MANIFEST = 'asset-retention.json';

async function listFiles(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true }).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const files = await Promise.all(entries.map(async (entry) => {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) return listFiles(path.join(dir, entry.name), relative);
    return entry.isFile() ? [relative] : [];
  }));
  return files.flat();
}

export async function retainAssets(directory, currentAssets, now = Date.now()) {
  let previous = {};
  try {
    previous = JSON.parse(await readFile(path.join(directory, MANIFEST), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error; // 不以毀損的紀錄冒險刪除資源
  }
  const retained = Object.create(null);
  for (const file of await listFiles(path.join(directory, 'assets'))) {
    // 首次導入時，沒有歷史紀錄的舊資源也享有完整七天寬限。
    const lastUsed = currentAssets.has(file) ? now : (previous[file] ?? now);
    if (!Number.isFinite(lastUsed)) throw new Error(`Invalid retention timestamp: ${file}`);
    if (currentAssets.has(file) || now - lastUsed < RETENTION_MS) {
      retained[file] = lastUsed;
    } else {
      await rm(path.join(directory, 'assets', file));
    }
  }
  await writeFile(path.join(directory, MANIFEST), JSON.stringify(retained, null, 2) + '\n');
}

export async function createPublishOptions(directory) {
  // HTML、manifest 與新 assets 仍由同一次 gh-pages commit 發布。
  const currentAssets = new Set(await listFiles(path.join(directory, 'assets')));
  return {
    src: ['**/*', '!stats.html'],
    remove: ['**/*', '!assets/**', `!${MANIFEST}`],
    nojekyll: true,
    beforeAdd: (git) => retainAssets(git.cwd, currentAssets),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const directory = path.resolve('dist');
  await readFile(path.join(directory, 'index.html')); // 未建置時直接停止
  const options = await createPublishOptions(directory);
  await new Promise((resolve, reject) => {
    ghpages.publish(directory, options, (error) => error ? reject(error) : resolve());
  });
  console.log('Published; previous assets retained for 7 days.');
}
