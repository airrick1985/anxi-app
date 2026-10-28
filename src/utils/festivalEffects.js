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
//      - fps（選填）          ：繪製幀率上限，畫面較重的特效用來省電
//   2. 在檔尾 EFFECTS 註冊：'代號': createXxx
//   3. 到 festivals.js 的節日設定填上該代號即可。
//
// 設計原則：pointer-events 由元件層設為 none、整體透明度保持低調，
// 粒子數依畫面面積縮放並設上限，避免影響操作與低階裝置效能。
// ─────────────────────────────────────────────────────────────

const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// 離屏貼圖：複雜的光影只畫一次，之後每幀只 drawImage。
// paint(g, k) 在寬 100 的座標箱裡繪製（高度依比例），k = 每單位的實際像素（給 shadowBlur 用）
const makeSprite = (w, h, paint) => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(w * dpr);
  canvas.height = Math.ceil(h * dpr);
  const g = canvas.getContext('2d');
  const k = dpr * (w / 100);
  g.scale(k, k);
  paint(g, k);
  return { img: canvas, w, h };
};

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

/* ── 萬聖節：紫色夜罩＋橘色滿月＋立體南瓜燈＋蝙蝠群＋小幽靈 ──
   3D 感：球面打光、雕刻切口厚度、地面投影；蝙蝠與幽靈有深度 z，以透視投影
   近大遠小、遠處較淡，蝙蝠會從遠方朝鏡頭飛近。
   效能：光影只在建立／resize 時畫進離屏貼圖，每幀只貼圖，並限制 30 fps。 */
function createHalloween(w, h) {
  const BAT_FRAMES = 8;
  const GHOST_FRAMES = 8;
  const FAR_Z = 6.5;     // 蝙蝠出現的最遠深度
  const HORIZON = 0.4;   // 透視中心（畫面高度比例）

  // 南瓜臉（100×100 座標箱，瓜身底部在 y=92）：三角眼、三角鼻、鋸齒笑口
  const facePath = (() => {
    const p = new Path2D();
    p.moveTo(29, 57); p.lineTo(43, 57); p.lineTo(38, 45); p.closePath();
    p.moveTo(57, 57); p.lineTo(71, 57); p.lineTo(62, 45); p.closePath();
    p.moveTo(46.5, 65); p.lineTo(53.5, 65); p.lineTo(50, 60); p.closePath();
    p.moveTo(25, 68);
    p.lineTo(34, 72); p.lineTo(38, 68.5); p.lineTo(43, 73);
    p.lineTo(57, 73); p.lineTo(62, 68.5); p.lineTo(66, 72);
    p.lineTo(75, 68);
    p.quadraticCurveTo(72, 81, 56, 84);
    p.lineTo(53, 79); p.lineTo(47, 79); p.lineTo(44, 84);
    p.quadraticCurveTo(28, 81, 25, 68);
    p.closePath();
    return p;
  })();

  const paintPumpkin = (g) => {
    // 瓜瓣由後往前畫：外瓣在後側（較暗、較窄），中央瓣最靠近鏡頭（最亮）
    [
      [-30, 18, 26, ['#e38c36', '#cc5c0c', '#7a2e06']],
      [30, 18, 26, ['#e38c36', '#cc5c0c', '#7a2e06']],
      [-16, 19, 29.5, ['#f5a748', '#e86f12', '#963a08']],
      [16, 19, 29.5, ['#f5a748', '#e86f12', '#963a08']],
      [0, 15, 31, ['#ffc46a', '#fb8a1c', '#b14a0a']],
    ].forEach(([dx, rx, ry, [c0, c1, c2]]) => {
      const x = 50 + dx;
      const grad = g.createRadialGradient(x - rx * 0.35, 45, 1, x, 61, ry);
      grad.addColorStop(0, c0);
      grad.addColorStop(0.55, c1);
      grad.addColorStop(1, c2);
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(x, 61, rx, ry, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(110, 36, 4, 0.45)';
      g.lineWidth = 1;
      g.stroke();
    });
    // 整體球面明暗與高光（source-atop：只染在瓜身上）
    g.globalCompositeOperation = 'source-atop';
    const shade = g.createRadialGradient(36, 44, 4, 50, 62, 56);
    shade.addColorStop(0, 'rgba(255, 236, 190, 0.28)');
    shade.addColorStop(0.45, 'rgba(255, 236, 190, 0)');
    shade.addColorStop(1, 'rgba(50, 8, 0, 0.6)');
    g.fillStyle = shade;
    g.fillRect(0, 0, 100, 100);
    g.fillStyle = 'rgba(255, 248, 225, 0.38)';
    g.beginPath();
    g.ellipse(35, 41, 7, 3.5, -0.5, 0, Math.PI * 2);
    g.fill();
    g.globalCompositeOperation = 'source-over';
    // 雕刻的臉：先填深色當切面，再把燭光內部往右下錯開 → 左上露出切口厚度
    g.fillStyle = '#9c3f08';
    g.fill(facePath);
    g.save();
    g.clip(facePath);
    g.translate(1.4, 1.8);
    const inner = g.createRadialGradient(50, 66, 2, 50, 66, 26);
    inner.addColorStop(0, '#ffe58a');
    inner.addColorStop(0.5, '#ffa82a');
    inner.addColorStop(1, '#e86a08');
    g.fillStyle = inner;
    g.fill(facePath);
    g.restore();
    // 蒂頭（底部陰影＋側光漸層＋切口亮面）
    g.fillStyle = 'rgba(90, 30, 0, 0.45)';
    g.beginPath();
    g.ellipse(50, 32, 8, 3, 0, 0, Math.PI * 2);
    g.fill();
    const stem = g.createLinearGradient(44, 0, 58, 0);
    stem.addColorStop(0, '#8a9a42');
    stem.addColorStop(0.5, '#5a6a24');
    stem.addColorStop(1, '#2f3a10');
    g.fillStyle = stem;
    g.beginPath();
    g.moveTo(45, 33);
    g.bezierCurveTo(45, 25, 47, 19, 53, 13);
    g.lineTo(59, 15.5);
    g.bezierCurveTo(54, 20, 53.5, 26, 55.5, 33);
    g.closePath();
    g.fill();
    g.fillStyle = '#b5c070';
    g.beginPath();
    g.ellipse(56, 14.2, 3.4, 1.5, 0.4, 0, Math.PI * 2);
    g.fill();
  };

  // 臉部燭光（疊在瓜身上、每幀改透明度做閃爍）：洞口外圍光暈＋較亮的燭光核心
  const paintFaceGlow = (g, k) => {
    // 只要光暈：形狀畫在箱外，靠陰影位移把模糊光暈投回原位
    g.shadowColor = 'rgba(255, 160, 30, 0.9)';
    g.shadowBlur = 5 * k;
    g.shadowOffsetX = 200 * k;
    g.fillStyle = '#000';
    g.translate(-200, 0);
    g.fill(facePath);
    g.translate(200, 0);
    g.shadowColor = 'transparent';
    g.save();
    g.clip(facePath);
    g.translate(1.4, 1.8);
    const core = g.createRadialGradient(50, 66, 2, 50, 66, 24);
    core.addColorStop(0, '#fffbe0');
    core.addColorStop(0.6, '#ffe07a');
    core.addColorStop(1, 'rgba(255, 190, 60, 0.6)');
    g.fillStyle = core;
    g.fill(facePath);
    g.restore();
  };

  const paintGlow = (g) => {
    const grad = g.createRadialGradient(50, 50, 0, 50, 50, 50);
    grad.addColorStop(0, 'rgba(255, 150, 40, 0.42)');
    grad.addColorStop(0.4, 'rgba(255, 120, 30, 0.16)');
    grad.addColorStop(1, 'rgba(255, 110, 20, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 100, 100);
  };

  const paintShadow = (g) => {
    g.scale(1, 0.32);
    const grad = g.createRadialGradient(50, 50, 0, 50, 50, 50);
    grad.addColorStop(0, 'rgba(12, 0, 20, 0.6)');
    grad.addColorStop(1, 'rgba(12, 0, 20, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 100, 100);
  };

  // 蝙蝠（100×64 座標箱，身體中心 50,30）；flap：-1 翅膀最低 ~ 1 最高
  const paintBat = (g, flap) => {
    const theta = flap * 0.9;
    const chord = 0.6 + 0.4 * Math.cos(theta); // 翅膀轉向上下時翼面變窄（透視縮短）
    const wing = g.createLinearGradient(0, 0, 0, 64);
    wing.addColorStop(0, '#3d2752');
    wing.addColorStop(1, '#120818');
    [-1, 1].forEach((side) => {
      const sx = 50 + side * 4;
      const sy = 27;
      const tx = 50 + side * (6 + 44 * Math.cos(theta));
      const ty = 30 - 44 * 0.7 * Math.sin(theta);
      // 翼面座標（u 沿翼展 0~1、v 往下的翼弦深度）→ 畫面座標
      const at = (u, v) => [sx + (tx - sx) * u, sy + (ty - sy) * u + v * chord];
      const elbow = at(0.45, -4);
      const fingers = [at(0.72, 15), at(0.46, 19), at(0.22, 17)];
      g.fillStyle = wing;
      g.beginPath();
      g.moveTo(sx, sy);
      g.quadraticCurveTo(...at(0.25, -6), ...elbow);
      g.quadraticCurveTo(...at(0.75, -4), tx, ty);
      // 後緣：指骨之間內凹的扇貝弧
      g.quadraticCurveTo(...at(0.84, 4), ...fingers[0]);
      g.quadraticCurveTo(...at(0.58, 11), ...fingers[1]);
      g.quadraticCurveTo(...at(0.34, 12), ...fingers[2]);
      g.quadraticCurveTo(...at(0.1, 9), ...at(0, 11));
      g.closePath();
      g.fill();
      // 指骨與前緣反光
      g.strokeStyle = 'rgba(96, 64, 128, 0.55)';
      g.lineWidth = 0.9;
      g.beginPath();
      fingers.forEach(([fx, fy]) => { g.moveTo(...elbow); g.lineTo(fx, fy); });
      g.stroke();
      g.strokeStyle = 'rgba(190, 150, 230, 0.35)';
      g.beginPath();
      g.moveTo(sx, sy);
      g.quadraticCurveTo(...at(0.25, -6), ...elbow);
      g.quadraticCurveTo(...at(0.75, -4), tx, ty);
      g.stroke();
    });
    // 身體與頭（球面漸層）
    const body = g.createRadialGradient(47, 22, 1, 50, 30, 13);
    body.addColorStop(0, '#5a3d72');
    body.addColorStop(0.5, '#25142f');
    body.addColorStop(1, '#0c0612');
    g.fillStyle = body;
    g.beginPath();
    g.ellipse(50, 33, 6, 9, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(50, 22, 5.5, 0, Math.PI * 2);
    g.moveTo(45.5, 20); g.lineTo(46, 12); g.lineTo(49, 17.5); g.closePath();
    g.moveTo(54.5, 20); g.lineTo(54, 12); g.lineTo(51, 17.5); g.closePath();
    g.fill();
    // 發光的眼睛
    g.fillStyle = '#ffb43a';
    g.beginPath();
    g.arc(48, 22, 1.1, 0, Math.PI * 2);
    g.moveTo(53.1, 22);
    g.arc(52, 22, 1.1, 0, Math.PI * 2);
    g.fill();
  };

  // 幽靈（100×120 座標箱，臉朝左）；wave：裙擺波動相位
  const paintGhost = (g, k, wave) => {
    const body = new Path2D();
    body.moveTo(16, 62);
    body.bezierCurveTo(16, 28, 32, 10, 50, 10);
    body.bezierCurveTo(68, 10, 84, 28, 84, 62);
    body.bezierCurveTo(84, 80, 88, 92, 90, 100 + Math.sin(wave) * 3);
    for (let i = 0; i < 4; i++) {
      const x0 = 90 - 20 * i;
      const y1 = 100 + Math.sin(wave + (i + 1) * 1.7) * 3;
      const bulge = 112 + Math.sin(wave + i * 1.7 + 0.9) * 3;
      body.quadraticCurveTo(x0 - 10, bulge, x0 - 20, y1);
    }
    body.bezierCurveTo(12, 92, 16, 80, 16, 62);
    body.closePath();

    const fill = g.createRadialGradient(38, 34, 4, 50, 56, 62);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.55, '#eceefe');
    fill.addColorStop(1, '#a9afd8');
    g.fillStyle = fill;
    g.fill(body);
    // 下半部內陰影與高光（source-atop：只染在身體上）
    g.globalCompositeOperation = 'source-atop';
    const under = g.createLinearGradient(0, 58, 0, 112);
    under.addColorStop(0, 'rgba(120, 128, 190, 0)');
    under.addColorStop(1, 'rgba(120, 128, 190, 0.45)');
    g.fillStyle = under;
    g.fillRect(0, 0, 100, 120);
    g.fillStyle = 'rgba(255, 255, 255, 0.85)';
    g.beginPath();
    g.ellipse(34, 28, 8, 4.5, -0.7, 0, Math.PI * 2);
    g.fill();
    g.globalCompositeOperation = 'source-over';
    // 臉（略偏左，翻面後就朝前進方向）：亮面眼睛、小嘴、腮紅
    [[36, 50], [58, 50]].forEach(([ex, ey]) => {
      const eye = g.createRadialGradient(ex - 2, ey - 3, 0.5, ex, ey, 8);
      eye.addColorStop(0, '#5b5285');
      eye.addColorStop(1, '#1d1830');
      g.fillStyle = eye;
      g.beginPath();
      g.ellipse(ex, ey, 5.5, 7.5, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(255, 255, 255, 0.9)';
      g.beginPath();
      g.arc(ex - 1.8, ey - 3, 1.8, 0, Math.PI * 2);
      g.fill();
    });
    g.fillStyle = '#2b2545';
    g.beginPath();
    g.ellipse(47, 66, 4.5, 5.5, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255, 150, 170, 0.35)';
    g.beginPath();
    g.ellipse(27, 61, 5, 3, 0, 0, Math.PI * 2);
    g.moveTo(72, 61);
    g.ellipse(67, 61, 5, 3, 0, 0, Math.PI * 2);
    g.fill();
    // 外圍冷光：畫在既有內容後方
    g.globalCompositeOperation = 'destination-over';
    g.shadowColor = 'rgba(190, 200, 255, 0.75)';
    g.shadowBlur = 10 * k;
    g.fillStyle = '#d8dcf6';
    g.fill(body);
  };

  // 滿月（100×100 座標箱，半徑 16，外圍光暈到箱邊）
  const MOON_R = 16;
  const paintMoon = (g) => {
    const halo = g.createRadialGradient(50, 50, MOON_R * 0.8, 50, 50, 50);
    halo.addColorStop(0, 'rgba(255, 170, 80, 0.38)');
    halo.addColorStop(0.4, 'rgba(255, 150, 60, 0.12)');
    halo.addColorStop(1, 'rgba(255, 150, 60, 0)');
    g.fillStyle = halo;
    g.fillRect(0, 0, 100, 100);
    const body = g.createRadialGradient(50 - MOON_R * 0.35, 50 - MOON_R * 0.35, MOON_R * 0.1, 50, 50, MOON_R);
    body.addColorStop(0, '#fff2cf');
    body.addColorStop(0.6, '#ffc878');
    body.addColorStop(1, '#e48a3a');
    g.fillStyle = body;
    g.beginPath();
    g.arc(50, 50, MOON_R, 0, Math.PI * 2);
    g.fill();
    g.save();
    g.clip();
    // 月海：幾塊柔和暗斑讓月面明暗不均
    [[-0.3, -0.15, 0.55], [0.35, 0.3, 0.45], [0.1, -0.45, 0.3]].forEach(([dx, dy, dr]) => {
      const x = 50 + dx * MOON_R;
      const y = 50 + dy * MOON_R;
      const r = dr * MOON_R;
      const mare = g.createRadialGradient(x, y, 0, x, y, r);
      mare.addColorStop(0, 'rgba(196, 104, 40, 0.3)');
      mare.addColorStop(1, 'rgba(196, 104, 40, 0)');
      g.fillStyle = mare;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    });
    // 小環形山：先畫暗坑，再把亮面往右下錯開 → 左上內壁留下陰影（凹陷感）
    [[0.45, -0.35, 0.1], [-0.5, 0.35, 0.08], [0.15, 0.6, 0.07], [-0.08, 0.12, 0.06]].forEach(([dx, dy, dr]) => {
      const x = 50 + dx * MOON_R;
      const y = 50 + dy * MOON_R;
      const r = dr * MOON_R;
      g.fillStyle = 'rgba(170, 86, 30, 0.32)';
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(255, 220, 160, 0.3)';
      g.beginPath();
      g.arc(x + r * 0.22, y + r * 0.22, r * 0.78, 0, Math.PI * 2);
      g.fill();
    });
    g.restore();
  };

  // 與視窗大小無關的貼圖只建一次
  const batFrames = Array.from({ length: BAT_FRAMES }, (_, i) =>
    makeSprite(96, 64, g => paintBat(g, Math.sin((i / BAT_FRAMES) * Math.PI * 2))));
  const ghostFrames = Array.from({ length: GHOST_FRAMES }, (_, i) =>
    makeSprite(100, 120, (g, k) => paintGhost(g, k, (i / GHOST_FRAMES) * Math.PI * 2)));
  const glowSprite = makeSprite(64, 64, paintGlow);
  const shadowSprite = makeSprite(100, 32, paintShadow);

  let moon = {};
  let moonSprite = null;
  let pumpkinSprite = null;
  let faceSprite = null;
  let pumpkins = [];
  let stars = [];
  let bats = [];
  let ghosts = [];
  let actors = [];   // 蝙蝠＋幽靈，每幀依深度排序（遠的先畫）
  let batPx = 0;     // z=1 時的蝙蝠寬
  let ghostPx = 0;   // z=1 時的幽靈寬
  let nightGrad = null;
  let nightH = 0;
  let lastSec = 0;

  const spawnBat = (b, width, height, initial) => {
    b.z = initial ? rand(1.6, FAR_Z) : rand(4.5, FAR_Z);
    // 以出現的螢幕位置反推世界座標
    const sx = rand(0.05, 0.95) * width;
    const sy = rand(0.06, 0.48) * height;
    b.x = ((sx - width / 2) / (width / 2)) * b.z;
    b.y = ((sy - height * HORIZON) / (height / 2)) * b.z;
    b.vx = rand(0.2, 0.6) * (Math.random() < 0.5 ? -1 : 1);
    b.vy = rand(-0.08, 0.04);
    b.vz = -rand(0.12, 0.55); // 往鏡頭飛近
    b.flapHz = rand(3.2, 5);
    b.phase = Math.random();
    b.fade = initial ? 1 : 0;
    return b;
  };

  const layout = (width, height) => {
    const minSide = Math.min(width, height);
    moon = {
      x: width - clamp(width * 0.14, 80, 160),
      y: clamp(height * 0.16, 90, 150),
      r: clamp(minSide * 0.085, 36, 66),
    };
    const moonBox = (moon.r * 100) / MOON_R;
    moonSprite = makeSprite(moonBox, moonBox, paintMoon);

    // 南瓜：左下一顆大的、右下一大一小（小的較遠：較小、地面線較高）
    const P = clamp(minSide * 0.17, 60, 128);
    pumpkinSprite = makeSprite(P, P, paintPumpkin);
    faceSprite = makeSprite(P, P, paintFaceGlow);
    pumpkins = [
      { x: width - P * 1.22, ground: height - P * 0.36, size: P * 0.55, alpha: 0.88, seed: 2.1 },
      { x: P * 0.78, ground: height - P * 0.2, size: P, alpha: 0.96, seed: 0.3 },
      { x: width - P * 0.66, ground: height - P * 0.16, size: P * 0.8, alpha: 0.96, seed: 4.7 },
    ];

    const starCount = clamp(Math.round((width * height) / 40000), 12, 40);
    stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.55,
      r: rand(0.5, 1.3),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.4, 1.1),
    }));

    batPx = clamp(minSide * 0.12, 46, 88);
    const batCount = clamp(Math.round((width * height) / 75000), 6, 14);
    bats = Array.from({ length: batCount }, () => spawnBat({ kind: 'bat' }, width, height, true));

    ghostPx = clamp(minSide * 0.13, 48, 92);
    const ghostCount = clamp(Math.round((width * height) / 320000), 2, 4);
    ghosts = Array.from({ length: ghostCount }, () => {
      const z0 = rand(1.8, 2.8);
      const sx = rand(0, width);
      const sy = rand(0.15, 0.5) * height;
      return {
        kind: 'ghost',
        z: z0,
        z0,
        zAmp: rand(0.3, 0.7),     // 緩慢飄近飄遠
        zSpeed: rand(0.15, 0.3),
        x: ((sx - width / 2) / (width / 2)) * z0,
        y: ((sy - height * HORIZON) / (height / 2)) * z0,
        vx: rand(0.06, 0.16) * (Math.random() < 0.5 ? -1 : 1),
        bobSpeed: rand(0.8, 1.4),
        fadeSpeed: rand(0.3, 0.6),
        phase: rand(0, Math.PI * 2),
      };
    });
    actors = [...bats, ...ghosts];
  };

  // 紫色夜罩：上深下淺，底部微暖呼應南瓜燭光；確保表單與按鈕可讀
  const drawNight = (ctx, width, height) => {
    if (!nightGrad || nightH !== height) {
      nightGrad = ctx.createLinearGradient(0, 0, 0, height);
      nightGrad.addColorStop(0, 'rgba(28, 6, 58, 0.62)');
      nightGrad.addColorStop(0.5, 'rgba(38, 10, 66, 0.44)');
      nightGrad.addColorStop(1, 'rgba(64, 20, 42, 0.32)');
      nightH = height;
    }
    ctx.fillStyle = nightGrad;
    ctx.fillRect(0, 0, width, height);
  };

  const drawStars = (ctx, sec) => {
    stars.forEach(s => {
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.phase + sec * s.speed));
      ctx.fillStyle = `rgba(240, 230, 255, ${(0.45 * tw).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawMoon = (ctx) => {
    const box = moonSprite.w;
    ctx.drawImage(moonSprite.img, moon.x - box / 2, moon.y - box / 2, box, box);
  };

  // 燭光閃爍：幾個不同頻率的正弦相加，看起來不規則但與幀率無關
  const flicker = (sec, seed) => clamp(
    0.72 + 0.14 * Math.sin(sec * 7.3 + seed) + 0.09 * Math.sin(sec * 12.9 + seed * 2.3)
      + 0.06 * Math.sin(sec * 23.1 + seed * 0.7),
    0.35, 1);

  const drawPumpkins = (ctx, sec, still) => {
    pumpkins.forEach(p => {
      const s = p.size;
      const lift = still ? 0 : (0.5 + 0.5 * Math.sin(sec * 1.1 + p.seed)) * s * 0.1; // 浮起高度
      const tilt = still ? 0 : Math.sin(sec * 0.8 + p.seed * 1.7) * 0.05;
      const light = still ? 0.85 : flicker(sec, p.seed);
      // 地面投影：浮得越高影子越小越淡
      const shrink = 1 - (lift / s) * 2.2;
      const sw = s * 0.95 * shrink;
      ctx.globalAlpha = p.alpha * shrink;
      ctx.drawImage(shadowSprite.img, p.x - sw / 2, p.ground - sw * 0.16, sw, sw * 0.32);
      // 燭光照亮周圍
      const gs = s * 2.4;
      ctx.globalAlpha = p.alpha * light * 0.75;
      ctx.drawImage(glowSprite.img, p.x - gs / 2, p.ground - lift - s * 0.45 - gs / 2, gs, gs);
      // 瓜身＋臉部燭光（以底部為支點微微搖晃）
      ctx.save();
      ctx.translate(p.x, p.ground - lift);
      ctx.rotate(tilt);
      ctx.globalAlpha = p.alpha;
      ctx.drawImage(pumpkinSprite.img, -s / 2, -s * 0.92, s, s);
      ctx.globalAlpha = p.alpha * light;
      ctx.drawImage(faceSprite.img, -s / 2, -s * 0.92, s, s);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  };

  const drawBat = (ctx, b, sec, width, height) => {
    const s = 1 / b.z;
    const bw = batPx * s;
    const cyc = (sec * b.flapHz + b.phase) % 1;
    const frame = batFrames[Math.floor(cyc * BAT_FRAMES)];
    const sx = width / 2 + b.x * s * (width / 2);
    const sy = height * HORIZON + b.y * s * (height / 2) - Math.sin(cyc * Math.PI * 2) * bw * 0.06;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(clamp(b.vx * 0.5, -0.3, 0.3) + Math.sin(sec * 1.3 + b.phase * 6) * 0.08);
    // 遠處較淡（大氣透視）
    ctx.globalAlpha = (0.3 + 0.65 * clamp((FAR_Z - b.z) / (FAR_Z - 1), 0, 1)) * b.fade;
    ctx.drawImage(frame.img, -bw / 2, -bw * 0.31, bw, bw * (2 / 3));
    ctx.restore();
  };

  const drawGhost = (ctx, g, sec, width, height) => {
    const s = 1 / g.z;
    const gw = ghostPx * s;
    const frame = ghostFrames[Math.floor(((sec * 0.8 + g.phase) % 1) * GHOST_FRAMES)];
    const sx = width / 2 + g.x * s * (width / 2);
    const sy = height * HORIZON + g.y * s * (height / 2) + Math.sin(sec * g.bobSpeed + g.phase) * gw * 0.12;
    const near = clamp((3.6 - g.z) / 2.6, 0, 1);
    const fade = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(sec * g.fadeSpeed + g.phase * 1.7)); // 時隱時現
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(Math.sin(sec * g.bobSpeed * 0.6 + g.phase) * 0.1);
    if (g.vx > 0) ctx.scale(-1, 1); // 貼圖臉朝左，往右飄時翻面
    ctx.globalAlpha = (0.45 + 0.4 * near) * fade;
    ctx.drawImage(frame.img, -gw / 2, -gw * 0.6, gw, gw * 1.2);
    ctx.restore();
  };

  const update = (dt, sec, width, height) => {
    bats.forEach(b => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.fade = Math.min(1, b.fade + dt * 0.8);
      const s = 1 / b.z;
      const size = batPx * s;
      const sx = width / 2 + b.x * s * (width / 2);
      const sy = height * HORIZON + b.y * s * (height / 2);
      // 飛過鏡頭或飛出畫面 → 回到遠方重新出現
      if (b.z < 1 || sx < -size || sx > width + size || sy < -size || sy > height + size) {
        spawnBat(b, width, height, false);
      }
    });
    ghosts.forEach(g => {
      g.x += g.vx * dt;
      g.z = g.z0 + Math.sin(sec * g.zSpeed + g.phase) * g.zAmp;
      // 飄出畫面就從另一側回來
      const edge = g.z * (1 + ghostPx / g.z / width);
      if (g.x > edge) g.x = -edge;
      else if (g.x < -edge) g.x = edge;
    });
  };

  layout(w, h);
  return {
    fps: 30,
    resize: layout,
    draw(ctx, t, width, height) {
      const sec = t / 1000;
      const dt = clamp(sec - lastSec, 0, 0.1); // 切回分頁等長間隔時不要瞬移
      lastSec = sec;
      update(dt, sec, width, height);
      drawNight(ctx, width, height);
      drawStars(ctx, sec);
      drawMoon(ctx);
      actors.sort((a, b) => b.z - a.z);
      actors.forEach(a => {
        if (a.kind === 'bat') drawBat(ctx, a, sec, width, height);
        else drawGhost(ctx, a, sec, width, height);
      });
      drawPumpkins(ctx, sec, false);
    },
    // 減少動態：只畫靜態夜色、星空、滿月與南瓜燈
    drawStatic(ctx, width, height) {
      drawNight(ctx, width, height);
      drawStars(ctx, 0);
      drawMoon(ctx);
      drawPumpkins(ctx, 0, true);
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
  halloween: createHalloween,
  snow: createSnow,
};
