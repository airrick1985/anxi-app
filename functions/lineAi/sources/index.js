// LINE AI 助理：雲端資料來源（lineAiSources）與給 AI 呼叫的工具
// 文件：{ type: 'drive'|'dropbox', name, ownerKey, shared, driveId, isFolder, path }
// - 個人來源（shared=false）：只有擁有者撰稿時可用，且 Agent 要允許個人來源
// - 共用來源（shared=true）：超級管理員建立，勾選到 Agent 的 sharedSourceIds 才可用

const { getDb, COL, toIso } = require('../db');
const drive = require('./drive');
const dropbox = require('./dropbox');

function serializeSource(d) {
  const x = d.data ? { id: d.id, ...d.data() } : d;
  return { id: x.id, type: x.type, name: x.name, shared: x.shared === true, ownerKey: x.ownerKey || null, isFolder: x.isFolder !== false, createdAt: toIso(x.createdAt) };
}

async function listOwn(userKey) {
  const snap = await getDb().collection(COL.sources).where('ownerKey', '==', userKey).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => s.shared !== true);
}

async function listShared() {
  const snap = await getDb().collection(COL.sources).where('shared', '==', true).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** 這次撰稿可用的來源 */
async function availableFor(user, agent) {
  if (!agent) return [];
  const [own, shared] = await Promise.all([agent.allowUserSources !== false ? listOwn(user.userKey) : [], listShared()]);
  const allowedShared = new Set(agent.sharedSourceIds || []);
  return [...own, ...shared.filter(s => allowedShared.has(s.id))];
}

async function addDrive({ ownerKey, link, name, shared = false }) {
  const id = drive.parseDriveId(link);
  if (!id) throw new Error('請貼上 Google Drive 資料夾或檔案的連結');
  const info = await drive.inspect(id);
  const doc = {
    type: 'drive', name: String(name || info.name || 'Google Drive').slice(0, 60), driveId: info.id, isFolder: info.isFolder,
    ownerKey, shared: shared === true, createdAt: new Date(),
  };
  const ref = await getDb().collection(COL.sources).add(doc);
  return { id: ref.id, ...doc };
}

const TOOLS = [
  {
    name: 'search_files',
    description: '搜尋使用者開放的雲端硬碟資料（Google Drive、Dropbox），依關鍵字找檔名或內文；需要價目、規格、合約條款、活動資訊等資料時使用。',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: '關鍵字，例如「價目表」「付款方式」；留空列出最近更新的檔案' } },
      required: ['query'],
    },
  },
  {
    name: 'read_file',
    description: '讀取 search_files 找到的檔案內容（純文字）。',
    parameters: {
      type: 'object',
      properties: { fileId: { type: 'string', description: 'search_files 回傳的 fileId' } },
      required: ['fileId'],
    },
  },
];

/** 工具實作；cited 收集讀過的檔名，回傳給前端顯示 */
function handlersFor(sources, cited) {
  const byId = new Map(sources.map(s => [s.id, s]));
  const driveSources = sources.filter(s => s.type === 'drive');
  const driveRoots = driveSources.map(s => ({ id: s.driveId, isFolder: s.isFolder !== false, name: s.name }));
  return {
    async search_files({ query }) {
      const results = [];
      const errors = [];
      if (driveSources.length) {
        try {
          // Drive 來源一起搜尋；讀檔時再檢查檔案在任一個開放的 Drive 來源底下，fileId 前綴只用來分辨 Drive／Dropbox
          const files = await drive.search(driveRoots, query);
          results.push(...files.map(f => ({ fileId: `${driveSources[0].id}|${f.id}`, name: f.name, source: 'Google Drive', modified: f.modifiedTime })));
        } catch (e) { errors.push(`Google Drive：${e.message}`); }
      }
      for (const s of sources.filter(x => x.type === 'dropbox')) {
        try {
          const files = await dropbox.search(s, query);
          results.push(...files.map(f => ({ fileId: `${s.id}|${f.id}`, name: f.name, path: f.path, source: 'Dropbox', modified: f.modifiedTime })));
        } catch (e) { errors.push(`Dropbox：${e.message}`); }
      }
      return { files: results.slice(0, 12), ...(errors.length ? { errors } : {}), ...(results.length ? {} : { note: '沒有找到符合的檔案' }) };
    },
    async read_file({ fileId }) {
      const [sourceId, ...rest] = String(fileId || '').split('|');
      const rawId = rest.join('|');
      const source = byId.get(sourceId);
      if (!source || !rawId) return { error: 'fileId 不正確，請先用 search_files 搜尋' };
      try {
        const r = source.type === 'drive' ? await drive.read(driveRoots, rawId) : await dropbox.read(source, rawId);
        if (!r.isFolder && !cited.includes(r.name)) cited.push(r.name);
        return r;
      } catch (e) {
        return { error: e.message };
      }
    },
  };
}

module.exports = { serializeSource, listOwn, listShared, availableFor, addDrive, TOOLS, handlersFor, drive, dropbox };
