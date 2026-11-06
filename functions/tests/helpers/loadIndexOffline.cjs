// 離線載入真正的 functions/index.js：Firestore 換成記憶體假資料，所有對外連線一律封鎖。
// 用假專案設定與假密鑰，就算程式出錯也碰不到正式環境。
const net = require('net');
const tls = require('tls');
const dns = require('dns');
const http = require('http');
const https = require('https');
const http2 = require('http2');
const { createFakeDb, Firestore } = require('./fakeFirestore.cjs');

const blockedConnections = [];
const deny = name => () => {
  blockedConnections.push(name);
  throw new Error(`NETWORK BLOCKED: ${name}`);
};
net.Socket.prototype.connect = deny('net.connect');
tls.connect = deny('tls.connect');
dns.lookup = deny('dns.lookup');
http.request = deny('http.request');
https.request = deny('https.request');
http2.connect = deny('http2.connect');

process.env.GCLOUD_PROJECT = 'offline';
process.env.FIREBASE_CONFIG = '{"projectId":"offline","databaseURL":"https://offline.firebaseio.com","storageBucket":"offline.appspot.com"}';
['SENDER_EMAIL', 'GMAIL_APP_PASSWORD', 'ANXISMART_LINE_CRM_TOKEN', 'GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_CLIENT_SECRET', 'GOOGLE_DRIVE_REFRESH_TOKEN']
  .forEach((key) => { process.env[key] = 'offline-test'; });

const db = createFakeDb();
class StubFirestore {
  constructor() {
    return db;
  }
}
Object.assign(StubFirestore, Firestore);
const firestorePath = require.resolve('@google-cloud/firestore');
const original = require(firestorePath);
require.cache[firestorePath].exports = new Proxy(original, {
  get: (target, key) => (key === 'Firestore' ? StubFirestore : target[key]),
});

function loadIndex() {
  const { log, warn } = console;
  console.log = () => {};
  console.warn = () => {};
  try {
    return require('../../index.js');
  } finally {
    console.log = log;
    console.warn = warn;
  }
}

module.exports = { db, loadIndex, blockedConnections };
