// 銷控 AI 智能助理：Cloud Functions 匯出（docs/銷控AI智能助理-spec.md）
// index.js 用法：
//   const salesAi = require('./salesAi');
//   salesAi.init({ performCancelPurchase, buildRemarksSummary: buildRemarksSummaryFromNotes });
//   exports.salesAiAgent = salesAi.salesAiAgent;
//   exports.salesAiAdmin = salesAi.salesAiAdmin;

const { onCall } = require('firebase-functions/v2/https');
const agent = require('./agent');
const admin = require('./admin');

const salesAiAgent = onCall({
  region: 'asia-east1',
  memory: '512MiB',
  timeoutSeconds: 120,
  secrets: ['SALES_BOT_GEMINI_KEY'],
}, (request) => agent.handleAgent(request));

const salesAiAdmin = onCall({
  region: 'asia-east1',
  memory: '512MiB',
  timeoutSeconds: 120,
  secrets: ['SALES_BOT_GEMINI_KEY'],
}, (request) => admin.handleAdmin(request));

module.exports = { salesAiAgent, salesAiAdmin, init: agent.init };
