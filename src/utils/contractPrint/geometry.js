// 對齊／平均分散／吸附的純運算。單位（unit）＝一個物件或一個群組：
// { ids: string[], x, y, w, h, base }，base 為基線 y。

export function union(boxes) {
  if (!boxes.length) return null
  let x1 = Infinity
  let y1 = Infinity
  let x2 = -Infinity
  let y2 = -Infinity
  for (const b of boxes) {
    x1 = Math.min(x1, b.x)
    y1 = Math.min(y1, b.y)
    x2 = Math.max(x2, b.x + b.w)
    y2 = Math.max(y2, b.y + b.h)
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
}

export const intersects = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

const median = (nums) => {
  const s = [...nums].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** 回傳每個單位要移動的量：Map<unit, {dx, dy}> */
export function alignMoves(units, mode) {
  const all = union(units)
  const moves = new Map()
  const baseTarget = mode === 'baseline' ? median(units.map((u) => u.base)) : 0
  for (const u of units) {
    let dx = 0
    let dy = 0
    if (mode === 'left') dx = all.x - u.x
    else if (mode === 'hcenter') dx = all.x + all.w / 2 - (u.x + u.w / 2)
    else if (mode === 'right') dx = all.x + all.w - (u.x + u.w)
    else if (mode === 'top') dy = all.y - u.y
    else if (mode === 'vmiddle') dy = all.y + all.h / 2 - (u.y + u.h / 2)
    else if (mode === 'bottom') dy = all.y + all.h - (u.y + u.h)
    else if (mode === 'baseline') dy = baseTarget - u.base
    moves.set(u, { dx, dy })
  }
  return moves
}

/** 平均分散：頭尾不動，中間單位之間的間距相等 */
export function distributeMoves(units, axis) {
  const moves = new Map()
  if (units.length < 3) return moves
  const pos = axis === 'h' ? 'x' : 'y'
  const len = axis === 'h' ? 'w' : 'h'
  const sorted = [...units].sort((a, b) => a[pos] - b[pos])
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const span = last[pos] + last[len] - first[pos]
  const total = sorted.reduce((s, u) => s + u[len], 0)
  const gap = (span - total) / (sorted.length - 1)
  let cursor = first[pos]
  for (const u of sorted) {
    const d = cursor - u[pos]
    moves.set(u, axis === 'h' ? { dx: d, dy: 0 } : { dx: 0, dy: d })
    cursor += u[len] + gap
  }
  return moves
}

/**
 * 拖曳吸附：找出最接近的對齊線，回傳修正量與參考線位置。
 * @param {number[]} lines    移動中物件的候選線（已含目前位移）
 * @param {number[]} targets  可吸附的線
 */
export function snapAxis(lines, targets, tolerance) {
  let best = null
  for (const line of lines) {
    for (const t of targets) {
      const d = t - line
      if (Math.abs(d) <= tolerance && (!best || Math.abs(d) < Math.abs(best.delta))) best = { delta: d, at: t }
    }
  }
  return best
}
