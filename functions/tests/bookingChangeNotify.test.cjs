const test = require("node:test");
const assert = require("node:assert/strict");
const { toTaipeiDateStr, taipeiMidnight, buildBookingChanges, resolveNotifyRecipients } = require("../bookingChangeNotify");

const ts = (iso) => ({ toDate: () => new Date(iso) });

test("日期一律換算成台灣日期", () => {
  assert.equal(toTaipeiDateStr(ts("2026-11-24T00:00:00+08:00")), "2026-11-24"); // 新增預約的存法
  assert.equal(toTaipeiDateStr(ts("2026-11-24T00:00:00Z")), "2026-11-24"); // 舊版修改後的存法（台灣 08:00）
  assert.equal(toTaipeiDateStr("2026-11-24"), "2026-11-24");
  assert.equal(toTaipeiDateStr("2026-11-24T12:00:00.000Z"), "2026-11-24");
  assert.equal(toTaipeiDateStr("2026-11-23T16:00:00.000Z"), "2026-11-24"); // 瀏覽器本地午夜
  assert.equal(toTaipeiDateStr("abc"), null);
  assert.equal(toTaipeiDateStr(null), null);
  assert.equal(taipeiMidnight("2026-11-24").toISOString(), "2026-11-23T16:00:00.000Z");
});

test("只列實際變動且要通知的欄位", () => {
  const original = {
    appointmentDate: ts("2026-11-24T00:00:00+08:00"), appointmentTimeSlot: "09:30",
    inspectionMethod: "自行驗屋", bookerName: "王小明", bookingRemarks: "a", inspectors: "甲",
  };
  const changes = buildBookingChanges(original, {
    appointmentDate: ts("2026-11-25T00:00:00+08:00"), appointmentTimeSlot: "09:30", inspectionMethod: "委託驗屋",
    bookerName: "王小明", bookingRemarks: "b", inspectors: "乙", lastModifiedByName: "x", agentName: "李四",
  });
  assert.deepEqual(changes, [
    { field: "預約日期", before: "2026/11/24", after: "2026/11/25" },
    { field: "選擇方式", before: "自行驗屋", after: "委託驗屋" },
    { field: "受託人姓名", before: "無", after: "李四" },
  ]);
  assert.deepEqual(buildBookingChanges(original, { appointmentDate: ts("2026-11-24T00:00:00Z") }), []);
});

test("身分證遮罩、額外欄位以標籤列出", () => {
  const changes = buildBookingChanges(
    { agentIdNumber: "A123456789", bookingMethodDetails: { f1: "舊公司", f2: ["a"] } },
    {
      agentIdNumber: "B223456780",
      bookingMethodDetails: { f1: "新公司", f2: ["a", "b"], f3: "" },
      bookingMethodDetailsDisplay: [{ label: "公司", value: "新公司" }, { label: "項目", value: ["a", "b"] }, { label: "其他", value: "" }],
    });
  assert.deepEqual(changes, [
    { field: "受託人身分證", before: "A12***789", after: "B22***780" },
    { field: "公司", before: "舊公司", after: "新公司" },
    { field: "項目", before: "a", after: "a、b" },
  ]);
  // 換方式後同名欄位（id 不同）內容沒變就不列
  assert.deepEqual(buildBookingChanges(
    { bookingMethodDetails: { old: "ABC" }, bookingMethodDetailsDisplay: [{ label: "車號", value: "ABC" }] },
    { bookingMethodDetails: { neu: "ABC" }, bookingMethodDetailsDisplay: [{ label: "車號", value: "ABC" }] }), []);
  // 遮罩後相同仍視為有變動
  assert.equal(buildBookingChanges({ agentIdNumber: "A123456789" }, { agentIdNumber: "A129996789" }).length, 1);
});

test("收件人：名單外地址不寄、必寄一律包含、未勾預約人時副本改主收件人", () => {
  const details = [{ email: "boss@x", mandatory: true }, { email: "a@x", mandatory: false }, { email: "b@x", mandatory: false }];
  assert.deepEqual(resolveNotifyRecipients({ toBooker: true, cc: ["a@x", "hacker@y"] }, "me@x", details), { to: ["me@x"], cc: ["boss@x", "a@x"] });
  assert.deepEqual(resolveNotifyRecipients({ toBooker: false, cc: ["b@x"] }, "me@x", details), { to: ["boss@x", "b@x"], cc: [] });
  assert.deepEqual(resolveNotifyRecipients({ toBooker: true, cc: [] }, "", []), { to: [], cc: [] });
  assert.deepEqual(resolveNotifyRecipients({ toBooker: true, cc: ["a@x"] }, "a@x", details), { to: ["a@x"], cc: ["boss@x"] });
});
