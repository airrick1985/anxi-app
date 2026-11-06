// 換戶時車位常先轉到新戶，舊戶才退戶，退戶當下已查不到車位。
// 車位轉出時先記到 salesParkingMoveOuts，退戶時帶進紀錄。不寫在戶別文件上：
// 修改銷控會把整包戶別資料寫回，可能蓋掉新紀錄，也會多出 Sheet 動態欄。
const { Firestore, Timestamp } = require('@google-cloud/firestore');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { inferCommitmentTier, isDealParking } = require('./utils/salesStatusGroups');
const { normalizeParking, resolveCancelledParkings } = require('./utils/cancelledParking');

const MOVE_OUTS = 'salesParkingMoveOuts';
const FREE_TIERS = ['available', 'released'];

const moveOutDocId = (projectId, unitId, spotId) => `${projectId}_${unitId}_${spotId}`;
const boundUnitOf = parking => String(parking?.buyerUnitId ?? '').trim();
const sameBuyer = (a, b) => !a || !b || String(a).trim() === String(b).trim();
const filled = value => (Array.isArray(value) ? value.length > 0 : String(value ?? '').trim() !== '');

async function handleParkingRebound(db, before, after) {
  const from = boundUnitOf(before);
  const to = boundUnitOf(after);
  // 釋出（沒有新戶）不算轉出：可能是客戶放棄車位，不該算進成交總價
  if (!to || from === to) return;
  const { projectId, spotId } = after;
  if (!projectId || !spotId) return;

  // 車位回到這戶，先前的轉出紀錄不再成立
  await db.collection(MOVE_OUTS).doc(moveOutDocId(projectId, to, spotId)).delete();
  if (!from) return;

  const snapshot = await db.collection('salesHouseholds').doc(`${projectId}_${from}`).get();
  const household = snapshot.data();
  const status = household?.salesStatus_backend;
  // 原戶沒有銷售資料、或車位只是準備購買，都不是這戶買方的成交車位
  if (!status || !isDealParking({ ...before, buyerUnitId: from }, from, status)) return;

  await db.collection(MOVE_OUTS).doc(moveOutDocId(projectId, from, spotId)).set({
    ...normalizeParking(before),
    projectId,
    fromUnitId: from,
    movedToUnitId: to,
    buyerName: household.buyerName || null,
    movedAt: Timestamp.now(), // 之後會放進退戶紀錄的陣列，陣列內不能用 serverTimestamp
  });
}

/**
 * 退戶時整理本戶已轉出的車位。
 * 轉出紀錄：比對買方，銷售狀態可不經退戶直接清空，舊買方的紀錄不算到新買方頭上。
 * 「持有車位」快照：涵蓋本機制上線前轉走、或先釋出再綁新戶的車位；目前無人綁定代表已釋出，不列入。
 * @returns movedOut 寫入退戶紀錄的清單；moveRefs 退戶後要清除的轉出紀錄
 */
async function collectMovedOutParkings(db, { projectId, unitId, household, boundParkings }) {
  const moves = await db.collection(MOVE_OUTS)
    .where('projectId', '==', projectId)
    .where('fromUnitId', '==', unitId)
    .get();
  const known = new Set(boundParkings.map(parking => parking.spotId));
  const movedOut = moves.docs
    .map(doc => doc.data())
    .filter(move => !known.has(move.spotId) && sameBuyer(move.buyerName, household.buyerName));
  movedOut.forEach(move => known.add(move.spotId));

  const snapshot = Array.isArray(household['持有車位']) ? household['持有車位'] : [];
  for (const raw of snapshot) {
    const parking = normalizeParking(raw);
    if (!parking.spotId || known.has(parking.spotId)) continue;
    known.add(parking.spotId);
    const current = await db.collection('salesParkings').doc(`${projectId}_${parking.spotId}`).get();
    const movedToUnitId = boundUnitOf(current.data());
    if (movedToUnitId && movedToUnitId !== unitId) movedOut.push({ ...parking, movedToUnitId });
  }
  return { movedOut, moveRefs: moves.docs.map(doc => doc.ref) };
}

// 復原後這戶可能再次退戶，轉出紀錄要放回去；車位本身留在新戶，不動
function restoreMoveOuts(db, batch, { projectId, unitId, cancelledData }) {
  const movedOut = Array.isArray(cancelledData.parkingMovedOut) ? cancelledData.parkingMovedOut : [];
  movedOut.filter(move => move?.spotId).forEach((move) => {
    batch.set(db.collection(MOVE_OUTS).doc(moveOutDocId(projectId, unitId, move.spotId)), {
      ...move,
      projectId,
      fromUnitId: unitId,
      buyerName: cancelledData.buyerName || null,
    });
  });
}

// 退戶會清空車位的銷售欄位，還有內容代表之後有人用了。
// salespersonUserKey 不看：舊版退戶沒清這欄，單獨殘留不算使用中。
function isParkingInUse(parking) {
  if (!parking) return false;
  if (['buyerUnitId', 'buyerName', 'salesperson', 'remarks'].some(field => filled(parking[field]))) return true;
  if (Number(parking.price_transaction) > 0) return true;
  return [parking.status_backend, parking.status].some(status => !FREE_TIERS.includes(inferCommitmentTier(status)));
}

// 復原前檢查備份車位的現況，已有資料的不可覆蓋
async function findParkingConflicts(db, projectId, parkings) {
  const conflicts = [];
  for (const { spotId } of parkings) {
    if (!spotId) continue;
    const snapshot = await db.collection('salesParkings').doc(`${projectId}_${spotId}`).get();
    const current = snapshot.data();
    if (isParkingInUse(current)) {
      conflicts.push({ spotId, unitId: boundUnitOf(current), status: current.status_backend || current.status || '' });
    }
  }
  return conflicts;
}

// 不含這些車位復原時，戶別的快照與總價也要扣掉：留在快照上，下次退戶會被當成轉出的車位算進總價
function householdFieldsWithoutSpots(cancelledData, spotIds) {
  const snapshot = Array.isArray(cancelledData['持有車位']) ? cancelledData['持有車位'] : [];
  const parkingTotal = resolveCancelledParkings(cancelledData)
    .filter(parking => parking.countsToDeal && !spotIds.has(parking.spotId))
    .reduce((sum, parking) => sum + (Number(parking.price_transaction) || 0), 0);
  return {
    持有車位: snapshot.filter(raw => !spotIds.has(normalizeParking(raw).spotId)),
    price_transaction_total: (Number(cancelledData.price_transaction_house) || 0) + parkingTotal,
  };
}

exports.onSalesParkingRebound = onDocumentUpdated({
  document: 'salesParkings/{docId}',
  database: 'anxi-app',
  region: 'asia-east1',
}, async (event) => {
  await handleParkingRebound(
    new Firestore({ databaseId: 'anxi-app' }),
    event.data?.before?.data(),
    event.data?.after?.data(),
  );
});

exports.collectMovedOutParkings = collectMovedOutParkings;
exports.restoreMoveOuts = restoreMoveOuts;
exports.findParkingConflicts = findParkingConflicts;
exports.householdFieldsWithoutSpots = householdFieldsWithoutSpots;
