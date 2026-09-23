// 同名欄位共用顯示選項，但各預約項目／方式可能使用不同的儲存 ID。
export function collectCalendarCustomFields(menu, reservedLabels = []) {
  const fields = new Map();
  const reserved = new Set(reservedLabels);
  for (const item of Array.isArray(menu) ? menu : []) {
    for (const method of Array.isArray(item.methods) ? item.methods : []) {
      if (method.deleted) continue;
      for (const cf of Array.isArray(method.customFields) ? method.customFields : []) {
        if (!cf.expanded || !cf.label || !cf.id || reserved.has(cf.label)) continue;
        if (!fields.has(cf.label)) {
          // 保留第一個 ID 作為選項 key，沿用既有顯示設定。
          fields.set(cf.label, { key: cf.id, label: cf.label, isDynamic: true, sources: [] });
        }
        fields.get(cf.label).sources.push({
          key: cf.id, bookingType: item.title, inspectionMethod: method.title,
        });
      }
    }
  }
  return [...fields.values()];
}

export function getCalendarCustomFieldValue(event, field) {
  const sources = field.sources || [{ key: field.key }];
  const matching = sources.filter(source =>
    source.bookingType === event.bookingType && source.inspectionMethod === event.inspectionMethod);
  // 有對應項目時只讀取該項目，避免讀到切換預約項目前殘留的資料。
  for (const source of matching.length ? matching : sources) {
    const value = event.bookingMethodDetails?.[source.key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}
