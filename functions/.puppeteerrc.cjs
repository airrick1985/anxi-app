// functions/.puppeteerrc.cjs
const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // 關鍵設定：將快取目錄指向 node_modules 內部
  cacheDirectory: join(__dirname, 'node_modules', '.puppeteer_cache'),
};