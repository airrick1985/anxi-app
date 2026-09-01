// src/utils/festivalEffects.js
// ─────────────────────────────────────────────────────────────
// 節日特效「實作註冊表」：FestivalEffect.vue 依 festivals.js 的
// effect 代號從 EFFECTS 取出對應工廠函式並執行繪製。
//
// ✅ 如何新增特效：
//   1. 寫一個工廠函式 createXxx(w, h)，回傳：
//      - resize(w, h)        ：視窗尺寸變更時重新佈局粒子
//      - draw(ctx, t, w, h)  ：每幀繪製（t = 已經過毫秒，動畫請以 t 計算
//                              保持幀率無關；ctx 已依 devicePixelRatio 縮放）
//      - drawStatic(ctx, w, h)：使用者偏好減少動態（prefers-reduced-motion）時
//                              繪製的靜態畫面；不想顯示就留空函式
//   2. 在檔尾 EFFECTS 註冊：'代號': createXxx
//   3. 到 festivals.js 的節日設定填上該代號即可。
//
// 設計原則：pointer-events 由元件層設為 none、整體透明度保持低調，
// 粒子數依畫面面積縮放並設上限，避免影響操作與低階裝置效能。
// ─────────────────────────────────────────────────────────────

const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ── 中秋節：夜色罩層＋明月（玉兔）＋流雲＋星光＋螢火微粒 ── */
function createMidAutumn(w, h) {
  let stars = [];
  let clouds = [];
  let fireflies = [];
  let moon = {};

  const layout = (width, height) => {
    moon = {
      x: width - clamp(width * 0.14, 80, 160),
      y: clamp(height * 0.16, 90, 150),
      r: clamp(Math.min(width, height) * 0.09, 40, 72),
    };
    const starCount = clamp(Math.round((width * height) / 26000), 18, 60);
    stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.6,
      r: rand(0.5, 1.4),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.4, 1.1),
    }));
    clouds = [0, 1, 2].map(i => ({
      y: moon.y + rand(-moon.r, moon.r * 1.6),
      x: rand(0, width),
      w: rand(moon.r * 2.2, moon.r * 3.6),
      h: rand(moon.r * 0.35, moon.r * 0.55),
      speed: rand(6, 13), // px/s，緩慢飄移
      alpha: rand(0.06, 0.11),
      seed: i,
    }));
    const flyCount = clamp(Math.round((width * height) / 90000), 6, 14);
    fireflies = Array.from({ length: flyCount }, () => ({
      x: Math.random() * width,
      y: rand(height * 0.35, height),
      r: rand(1.2, 2.4),
      rise: rand(6, 14),   // px/s 緩慢上升
      swayAmp: rand(10, 26),
      swaySpeed: rand(0.2, 0.5),
      phase: rand(0, Math.PI * 2),
      baseY: 0,
    }));
    fireflies.forEach(f => { f.baseY = f.y; });
  };

  // 夜色罩層：把明亮底圖壓暗營造夜晚氛圍、凸顯月亮。
  // 上方（天空）較深、往下漸淺，底部維持較透明確保表單與按鈕可讀可操作
  const drawNight = (ctx, width, height) => {
    const night = ctx.createLinearGradient(0, 0, 0, height);
    night.addColorStop(0, 'rgba(8, 15, 42, 0.52)');
    night.addColorStop(0.45, 'rgba(10, 18, 48, 0.38)');
    night.addColorStop(1, 'rgba(12, 20, 52, 0.24)');
    ctx.fillStyle = night;
    ctx.fillRect(0, 0, width, height);
  };

  const drawMoon = (ctx) => {
    const { x, y, r } = moon;
    // 月暈
    const glow = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 3);
    glow.addColorStop(0, 'rgba(255, 236, 180, 0.30)');
    glow.addColorStop(1, 'rgba(255, 236, 180, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 3, 0, Math.PI * 2);
    ctx.fill();
    // 月體
    const body = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
    body.addColorStop(0, 'rgba(255, 250, 224, 0.92)');
    body.addColorStop(1, 'rgba(243, 220, 158, 0.85)');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // 月面陰影（環形山，避開玉兔位置只留邊緣兩處）
    ctx.fillStyle = 'rgba(210, 182, 120, 0.24)';
    [[0.45, -0.34, 0.09], [-0.52, 0.32, 0.07]].forEach(([dx, dy, dr]) => {
      ctx.beginPath();
      ctx.arc(x + dx * r, y + dy * r, dr * r, 0, Math.PI * 2);
      ctx.fill();
    });
    drawMoonRabbit(ctx);
  };

  // 月中玉兔：手工貝茲曲線剪影（100×100 座標箱，坐姿面向左，雙長耳＋圓背＋尾巴小凸），
  // 已用大(160px)/中(55px)/小(40px)月面實測皆清楚可辨；只建一次 Path2D 重複使用
  const rabbitPath = (() => {
    const p = new Path2D();
    p.moveTo(20, 88);                        // 前腳底
    p.bezierCurveTo(8, 84, 6, 70, 14, 60);   // 胸口
    p.bezierCurveTo(17, 54, 19, 50, 18, 44); // 頸前
    p.bezierCurveTo(10, 42, 9, 36, 15, 32);  // 鼻吻凸出
    p.bezierCurveTo(18, 29, 22, 27, 26, 27); // 額頭
    // 前耳
    p.bezierCurveTo(23, 19, 24, 9, 28, 3);
    p.bezierCurveTo(31, 0, 36, 2, 35, 8);
    p.bezierCurveTo(33, 14, 32, 19, 31, 25);
    p.bezierCurveTo(31, 25, 33, 24, 34, 24); // 耳間凹
    // 後耳
    p.bezierCurveTo(36, 15, 39, 6, 43, 2);
    p.bezierCurveTo(47, 0, 51, 3, 48, 9);
    p.bezierCurveTo(44, 16, 41, 22, 40, 27);
    // 後腦 → 背拱
    p.bezierCurveTo(48, 28, 54, 32, 58, 38);
    p.bezierCurveTo(70, 42, 80, 52, 82, 64);
    // 臀 → 尾巴小凸 → 底部
    p.bezierCurveTo(83, 74, 81, 80, 84, 82);
    p.bezierCurveTo(86, 86, 82, 90, 77, 90);
    p.bezierCurveTo(60, 92, 35, 92, 20, 88);
    p.closePath();
    return p;
  })();

  const drawMoonRabbit = (ctx) => {
    const { x, y, r } = moon;
    const s = (r * 1.15) / 100; // 兔子佔月面約 1.15r 寬，縮放到 100 座標箱

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.96, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate(x - 50 * s, y - 46 * s);
    ctx.scale(s, s);
    ctx.fillStyle = 'rgba(196, 160, 96, 0.45)';
    ctx.fill(rabbitPath);
    // 眼睛：月面底色的小圓點
    ctx.fillStyle = 'rgba(255, 250, 224, 0.85)';
    ctx.beginPath();
    ctx.arc(26.5, 36, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawStars = (ctx, t) => {
    stars.forEach(s => {
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.phase + (t / 1000) * s.speed));
      ctx.fillStyle = `rgba(255, 252, 235, ${(0.45 * tw).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawClouds = (ctx, t, width) => {
    clouds.forEach(c => {
      const span = width + c.w * 2;
      const x = ((c.x + (t / 1000) * c.speed) % span) - c.w;
      ctx.fillStyle = `rgba(255, 255, 255, ${c.alpha})`;
      // 三個橢圓疊出雲朵
      [[0, 0, 1], [-0.35, 0.25, 0.7], [0.4, 0.2, 0.75]].forEach(([dx, dy, scale]) => {
        ctx.beginPath();
        ctx.ellipse(x + dx * c.w, c.y + dy * c.h, (c.w / 2) * scale, (c.h / 2) * scale, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  };

  const drawFireflies = (ctx, t, width, height) => {
    fireflies.forEach(f => {
      const sec = t / 1000;
      const cycle = height * 0.75;
      const y = ((f.baseY - sec * f.rise) % cycle + cycle) % cycle + height * 0.22;
      const x = f.x + Math.sin(f.phase + sec * f.swaySpeed * Math.PI * 2) * f.swayAmp;
      const pulse = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(f.phase * 2 + sec * 1.6));
      ctx.fillStyle = `rgba(255, 222, 150, ${(0.5 * pulse).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(((x % width) + width) % width, y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  layout(w, h);
  return {
    resize: layout,
    draw(ctx, t, width, height) {
      drawNight(ctx, width, height);
      drawStars(ctx, t);
      drawMoon(ctx);
      drawClouds(ctx, t, width);
      drawFireflies(ctx, t, width, height);
    },
    // 減少動態：只畫靜態夜色、明月與星空
    drawStatic(ctx, width, height) {
      drawNight(ctx, width, height);
      drawStars(ctx, 0);
      drawMoon(ctx);
    },
  };
}

/* ── 聖誕節：飄雪（供 12 月使用，也是新特效的參考範本） ── */
function createSnow(w, h) {
  let flakes = [];

  const layout = (width, height) => {
    const count = clamp(Math.round((width * height) / 16000), 30, 110);
    flakes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: rand(1, 3),
      fall: rand(18, 55),   // px/s
      swayAmp: rand(8, 26),
      swaySpeed: rand(0.15, 0.45),
      phase: rand(0, Math.PI * 2),
      alpha: rand(0.35, 0.8),
      glyph: Math.random() < 0.12, // 少數畫成雪花符號
    }));
  };

  layout(w, h);
  return {
    resize: layout,
    draw(ctx, t, width, height) {
      const sec = t / 1000;
      flakes.forEach(f => {
        const y = (f.y + sec * f.fall) % (height + 20) - 10;
        const x = f.x + Math.sin(f.phase + sec * f.swaySpeed * Math.PI * 2) * f.swayAmp;
        const px = ((x % width) + width) % width;
        if (f.glyph) {
          ctx.fillStyle = `rgba(255, 255, 255, ${f.alpha * 0.9})`;
          ctx.font = `${Math.round(f.r * 5 + 6)}px sans-serif`;
          ctx.fillText('❄', px, y);
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${f.alpha})`;
          ctx.beginPath();
          ctx.arc(px, y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    },
    drawStatic() { /* 減少動態時不顯示雪 */ },
  };
}

/* ── 特效註冊表：festivals.js 的 effect 代號對應這裡 ─────── */
export const EFFECTS = {
  midautumn: createMidAutumn,
  snow: createSnow,
};
