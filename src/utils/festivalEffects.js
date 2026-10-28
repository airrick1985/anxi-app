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
//      - hitTest(x, y)（選填）：該座標是否點得到特效圖案（桌機游標變手指）
//      - tap(x, y)（選填）    ：點擊互動。元件在 window 監聽，點在按鈕、輸入框等
//                              可操作元素上不會呼叫；減少動態時不啟用
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
   互動：點幽靈 → 變凶臉衝向鏡頭到幾乎滿版後淡出，幾秒後從遠處回來；
         點南瓜 → 跳一下變成血紅燭光的尖牙怒臉，約 5 秒後變回笑臉；
         點月亮 → 隨機出現蝙蝠爆飛／血月／女巫飛過／月亮變臉／月蝕其中一種。
   效能：光影只在建立／resize 時畫進離屏貼圖，每幀只貼圖，並限制 30 fps。 */
function createHalloween(w, h) {
  const BAT_FRAMES = 8;
  const GHOST_FRAMES = 8;
  const FAR_Z = 6.5;     // 蝙蝠出現的最遠深度
  const HORIZON = 0.4;   // 透視中心（畫面高度比例）
  // 幽靈被點到：膨脹抖動 → 衝向鏡頭 → 震動淡出（秒），之後隱藏幾秒再從遠處出現
  const SCARE_PUFF = 0.25;
  const SCARE_RUSH = 0.75;
  const SCARE_FADE = 0.4;
  const GHOST_RESPAWN = 3;
  // 南瓜被點到：變臉時間、維持時間、變回時間（秒）
  const SCARY_IN = 0.15;
  const SCARY_HOLD = 5;
  const SCARY_OUT = 0.6;
  const HIT_PAD = 10;    // 點擊範圍比圖案大一圈（px），手機較好點

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

  // 嚇人臉：往中間下斜的怒眼、倒三角鼻、上下兩排交錯尖牙的大嘴
  const scaryFacePath = (() => {
    const p = new Path2D();
    p.moveTo(23, 42); p.lineTo(45, 52); p.lineTo(40, 59.5); p.lineTo(26, 56.5); p.closePath();
    p.moveTo(77, 42); p.lineTo(55, 52); p.lineTo(60, 59.5); p.lineTo(74, 56.5); p.closePath();
    p.moveTo(46, 59); p.lineTo(54, 59); p.lineTo(50, 64.5); p.closePath();
    const L = 15;
    const R = 85;
    const s = x => Math.sin((Math.PI * (x - L)) / (R - L));
    const top = x => 64 + 4 * s(x);
    const bottom = x => 64 + 30 * s(x);
    const fang = x => (bottom(x) - top(x)) * 0.45; // 牙長不到嘴高一半，上下排不會交疊
    // 每段中間六成是尖牙、兩側留牙齦線，牙與牙之間露出發光的洞口
    const teeth = (n, edge, dir, reverse) => {
      for (let j = 0; j < n; j++) {
        const i = reverse ? n - 1 - j : j;
        const x0 = L + ((R - L) * i) / n;
        const x1 = L + ((R - L) * (i + 1)) / n;
        const xm = (x0 + x1) / 2;
        const [xa, xb, xEnd] = reverse ? [x1 - (x1 - x0) * 0.2, x0 + (x1 - x0) * 0.2, x0]
          : [x0 + (x1 - x0) * 0.2, x1 - (x1 - x0) * 0.2, x1];
        p.lineTo(xa, edge(xa));
        p.lineTo(xm, edge(xm) + dir * fang(xm));
        p.lineTo(xb, edge(xb));
        p.lineTo(xEnd, edge(xEnd));
      }
    };
    p.moveTo(L, 64);
    teeth(5, top, 1, false);
    teeth(4, bottom, -1, true);
    p.closePath();
    return p;
  })();

  // 南瓜的兩種表情：切面顏色、洞內燭光漸層（中心 x, y, 半徑）、臉部光暈
  const SMILE = {
    face: facePath,
    wall: '#9c3f08',
    glowAt: [50, 66, 26],
    inner: ['#ffe58a', '#ffa82a', '#e86a08'],
    halo: 'rgba(255, 160, 30, 0.9)',
    core: ['#fffbe0', '#ffe07a', 'rgba(255, 190, 60, 0.6)'],
  };
  const SCARY = {
    face: scaryFacePath,
    wall: '#4a0806',
    glowAt: [50, 68, 32],
    inner: ['#ffd2a8', '#ff3b1c', '#a3080a'],
    halo: 'rgba(255, 24, 8, 0.95)',
    core: ['#fff0dc', '#ff6a40', 'rgba(220, 0, 0, 0.6)'],
    tint: 'rgba(70, 0, 12, 0.42)', // 瓜身壓暗偏紅，襯出臉部紅光
  };

  const paintPumpkin = (g, look) => {
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
    if (look.tint) {
      g.fillStyle = look.tint;
      g.fillRect(0, 0, 100, 100);
    }
    g.fillStyle = 'rgba(255, 248, 225, 0.38)';
    g.beginPath();
    g.ellipse(35, 41, 7, 3.5, -0.5, 0, Math.PI * 2);
    g.fill();
    g.globalCompositeOperation = 'source-over';
    // 雕刻的臉：先填深色當切面，再把燭光內部往右下錯開 → 左上露出切口厚度
    g.fillStyle = look.wall;
    g.fill(look.face);
    g.save();
    g.clip(look.face);
    g.translate(1.4, 1.8);
    const [gx, gy, gr] = look.glowAt;
    const inner = g.createRadialGradient(gx, gy, 2, gx, gy, gr);
    look.inner.forEach((c, i) => inner.addColorStop(i / 2, c));
    g.fillStyle = inner;
    g.fill(look.face);
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
  const paintFaceGlow = (g, k, look) => {
    // 只要光暈：形狀畫在箱外，靠陰影位移把模糊光暈投回原位
    g.shadowColor = look.halo;
    g.shadowBlur = 5 * k;
    g.shadowOffsetX = 200 * k;
    g.fillStyle = '#000';
    g.translate(-200, 0);
    g.fill(look.face);
    g.translate(200, 0);
    g.shadowColor = 'transparent';
    g.save();
    g.clip(look.face);
    g.translate(1.4, 1.8);
    const [gx, gy, gr] = look.glowAt;
    const core = g.createRadialGradient(gx, gy, 2, gx, gy, gr - 2);
    look.core.forEach((c, i) => core.addColorStop([0, 0.6, 1][i], c));
    g.fillStyle = core;
    g.fill(look.face);
    g.restore();
  };

  // 燭光照亮周圍的圓形光暈；stops：中心、四成處、外緣顏色
  const paintGlow = (g, stops) => {
    const grad = g.createRadialGradient(50, 50, 0, 50, 50, 50);
    stops.forEach((c, i) => grad.addColorStop([0, 0.4, 1][i], c));
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

  // 凶臉幽靈（100×120 座標箱，正面朝鏡頭）：衝刺時直接畫在主畫布上，放到滿版也清晰；
  // 明暗一律用 clip 不用合成模式，避免染到背後的畫面
  const paintScaryGhost = (g, wave) => {
    const body = new Path2D();
    body.moveTo(14, 62);
    body.bezierCurveTo(14, 26, 31, 8, 50, 8);
    body.bezierCurveTo(69, 8, 86, 26, 86, 62);
    body.bezierCurveTo(86, 80, 90, 94, 93, 108 + Math.sin(wave) * 3);
    // 破爛的尖角裙擺
    for (let i = 1; i <= 5; i++) {
      body.lineTo(93 - 17.2 * (i - 0.5), 94 + Math.sin(wave + i * 1.3) * 3);
      body.lineTo(93 - 17.2 * i, 108 + Math.sin(wave + i * 1.7) * 4);
    }
    body.bezierCurveTo(10, 94, 14, 80, 14, 62);
    body.closePath();

    const aura = g.createRadialGradient(50, 58, 20, 50, 58, 78);
    aura.addColorStop(0, 'rgba(170, 0, 24, 0.45)');
    aura.addColorStop(1, 'rgba(170, 0, 24, 0)');
    g.fillStyle = aura;
    g.fillRect(-28, -20, 156, 156);
    // 身體：灰紫冷色球面漸層＋下半部陰影＋高光
    const fill = g.createRadialGradient(38, 30, 4, 50, 56, 66);
    fill.addColorStop(0, '#f1eef8');
    fill.addColorStop(0.5, '#c4bdd8');
    fill.addColorStop(1, '#5f5880');
    g.fillStyle = fill;
    g.fill(body);
    g.save();
    g.clip(body);
    const under = g.createLinearGradient(0, 60, 0, 112);
    under.addColorStop(0, 'rgba(40, 18, 60, 0)');
    under.addColorStop(1, 'rgba(40, 18, 60, 0.5)');
    g.fillStyle = under;
    g.fillRect(0, 0, 100, 120);
    g.fillStyle = 'rgba(255, 255, 255, 0.45)';
    g.beginPath();
    g.ellipse(33, 25, 8, 4.5, -0.7, 0, Math.PI * 2);
    g.fill();
    g.restore();
    // 左右對稱的五官：凹陷眼窩、往中間下斜的怒眼＋紅色發光瞳孔、怒眉
    [1, -1].forEach((side) => {
      const X = x => 50 + side * (x - 50);
      g.fillStyle = 'rgba(70, 40, 90, 0.35)';
      g.beginPath();
      g.ellipse(X(36), 50, 13, 10, side * 0.35, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#16060f';
      g.beginPath();
      g.moveTo(X(25), 41); g.lineTo(X(46), 50); g.lineTo(X(42), 58); g.lineTo(X(28), 55);
      g.closePath();
      g.fill();
      const px = X(37);
      const pupil = g.createRadialGradient(px, 51.5, 0, px, 51.5, 5);
      pupil.addColorStop(0, '#fff3c4');
      pupil.addColorStop(0.35, '#ff3a1e');
      pupil.addColorStop(1, 'rgba(255, 0, 0, 0)');
      g.fillStyle = pupil;
      g.beginPath();
      g.arc(px, 51.5, 5, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#2a1430';
      g.lineWidth = 3.2;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(X(22), 35);
      g.lineTo(X(46), 44);
      g.stroke();
    });
    // 張大的嘴：暗紅喉嚨透出紅光，上排兩側獠牙較長、下排尖牙
    const mouth = new Path2D();
    mouth.moveTo(30, 66);
    mouth.quadraticCurveTo(50, 58, 70, 66);
    mouth.ellipse(50, 66, 20, 26, 0, 0, Math.PI);
    mouth.closePath();
    const throat = g.createLinearGradient(0, 62, 0, 92);
    throat.addColorStop(0, '#2a0010');
    throat.addColorStop(1, '#5a0414');
    g.fillStyle = throat;
    g.fill(mouth);
    g.save();
    g.clip(mouth);
    const ember = g.createRadialGradient(50, 84, 0, 50, 84, 18);
    ember.addColorStop(0, 'rgba(255, 40, 30, 0.55)');
    ember.addColorStop(1, 'rgba(255, 40, 30, 0)');
    g.fillStyle = ember;
    g.fillRect(30, 60, 40, 34);
    const lip = (x) => { const t = (x - 30) / 40; return 66 - 16 * t * (1 - t); };
    const jaw = x => 66 + 26 * Math.sqrt(Math.max(0, 1 - ((x - 50) / 20) ** 2));
    g.fillStyle = '#f4ecdc';
    g.beginPath();
    [33.5, 40, 46.5, 53.5, 60, 66.5].forEach((x, i, arr) => {
      const len = i === 0 || i === arr.length - 1 ? 11 : 7;
      g.moveTo(x - 3.2, lip(x) - 2); g.lineTo(x + 3.2, lip(x) - 2); g.lineTo(x, lip(x) + len); g.closePath();
    });
    [37, 43.5, 50, 56.5, 63].forEach((x) => {
      g.moveTo(x - 3, jaw(x) + 2); g.lineTo(x + 3, jaw(x) + 2); g.lineTo(x, jaw(x) - 6.5); g.closePath();
    });
    g.fill();
    g.restore();
  };

  // 滿月（100×100 座標箱，半徑 16，外圍光暈到箱邊）；look：橘色滿月或血月的配色
  const MOON_R = 16;
  const HARVEST_MOON = {
    halo: ['rgba(255, 170, 80, 0.38)', 'rgba(255, 150, 60, 0.12)', 'rgba(255, 150, 60, 0)'],
    body: ['#fff2cf', '#ffc878', '#e48a3a'],
    mare: ['rgba(196, 104, 40, 0.3)', 'rgba(196, 104, 40, 0)'],
    crater: ['rgba(170, 86, 30, 0.32)', 'rgba(255, 220, 160, 0.3)'],
  };
  const BLOOD_MOON = {
    halo: ['rgba(230, 24, 20, 0.55)', 'rgba(190, 0, 0, 0.2)', 'rgba(160, 0, 0, 0)'],
    body: ['#ffa080', '#d42618', '#640606'],
    mare: ['rgba(80, 0, 0, 0.42)', 'rgba(80, 0, 0, 0)'],
    crater: ['rgba(70, 0, 0, 0.42)', 'rgba(255, 140, 120, 0.25)'],
  };
  const paintMoon = (g, look) => {
    const halo = g.createRadialGradient(50, 50, MOON_R * 0.8, 50, 50, 50);
    look.halo.forEach((c, i) => halo.addColorStop([0, 0.4, 1][i], c));
    g.fillStyle = halo;
    g.fillRect(0, 0, 100, 100);
    const body = g.createRadialGradient(50 - MOON_R * 0.35, 50 - MOON_R * 0.35, MOON_R * 0.1, 50, 50, MOON_R);
    look.body.forEach((c, i) => body.addColorStop([0, 0.6, 1][i], c));
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
      mare.addColorStop(0, look.mare[0]);
      mare.addColorStop(1, look.mare[1]);
      g.fillStyle = mare;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    });
    // 小環形山：先畫暗坑，再把亮面往右下錯開 → 左上內壁留下陰影（凹陷感）
    [[0.45, -0.35, 0.1], [-0.5, 0.35, 0.08], [0.15, 0.6, 0.07], [-0.08, 0.12, 0.06]].forEach(([dx, dy, dr]) => {
      const x = 50 + dx * MOON_R;
      const y = 50 + dy * MOON_R;
      const r = dr * MOON_R;
      g.fillStyle = look.crater[0];
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = look.crater[1];
      g.beginPath();
      g.arc(x + r * 0.22, y + r * 0.22, r * 0.78, 0, Math.PI * 2);
      g.fill();
    });
    g.restore();
  };

  // 月亮的臉（與月亮同一個座標箱，月心 50,50、半徑 16）：part = 'eyes' 往中間下斜的怒眼
  // （深眼窩＋發紅光瞳孔＋眉骨陰影）、'blink' 閉眼、'mouth' 滿口尖牙、嘴角裂開的獰笑；
  // 分開畫才能單獨眨眼、讓嘴巴陰笑開合
  const FACE_INK = 'rgba(70, 14, 4, 0.9)';
  const paintMoonFace = (g, part) => {
    g.fillStyle = FACE_INK;
    g.strokeStyle = FACE_INK;
    g.lineCap = 'round';
    if (part === 'mouth') {
      const mouth = new Path2D();
      mouth.moveTo(36, 50.5);
      mouth.quadraticCurveTo(50, 58.5, 64, 50.5);
      mouth.quadraticCurveTo(50, 67, 36, 50.5);
      g.fill(mouth);
      // 嘴裡透出紅光＋上下兩排尖牙（裁在嘴型內）
      g.save();
      g.clip(mouth);
      const ember = g.createRadialGradient(50, 57.5, 0, 50, 57.5, 7);
      ember.addColorStop(0, 'rgba(255, 60, 20, 0.75)');
      ember.addColorStop(1, 'rgba(255, 60, 20, 0)');
      g.fillStyle = ember;
      g.fillRect(36, 50, 28, 12);
      g.fillStyle = 'rgba(255, 238, 200, 0.95)';
      g.beginPath();
      [41, 44.5, 48, 52, 55.5, 59].forEach((x) => {
        const y = 50.5 + 8 * (1 - ((x - 50) / 14) ** 2) * 0.5; // 上唇曲線
        g.moveTo(x - 1.3, y - 1); g.lineTo(x + 1.3, y - 1); g.lineTo(x, y + 2.2); g.closePath();
      });
      [43, 46.5, 50, 53.5, 57].forEach((x) => {
        const y = 50.5 + 16.5 * (1 - ((x - 50) / 14) ** 2) * 0.5; // 下唇曲線
        g.moveTo(x - 1.2, y + 1); g.lineTo(x + 1.2, y + 1); g.lineTo(x, y - 2); g.closePath();
      });
      g.fill();
      g.restore();
      // 嘴角往上裂開的紋路
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(36, 50.5); g.lineTo(34.4, 48);
      g.moveTo(64, 50.5); g.lineTo(65.6, 48);
      g.stroke();
      return;
    }
    [1, -1].forEach((side) => {
      const X = x => 50 + side * (x - 50);
      if (part === 'blink') {
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(X(38.5), 45.2);
        g.lineTo(X(47), 47.8);
        g.stroke();
        return;
      }
      // 眉骨陰影
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(X(37.5), 41.2);
      g.lineTo(X(48), 45);
      g.stroke();
      g.beginPath();
      g.moveTo(X(38.5), 43);
      g.lineTo(X(47.5), 46.6);
      g.lineTo(X(45.8), 49.4);
      g.lineTo(X(39.6), 47.4);
      g.closePath();
      g.fill();
      const px = X(43.2);
      const pupil = g.createRadialGradient(px, 46.6, 0, px, 46.6, 1.6);
      pupil.addColorStop(0, '#fff2a0');
      pupil.addColorStop(0.45, '#ff3a10');
      pupil.addColorStop(1, 'rgba(255, 30, 0, 0)');
      g.fillStyle = pupil;
      g.beginPath();
      g.arc(px, 46.6, 1.6, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = FACE_INK;
    });
  };

  // 騎掃帚的女巫剪影（100×60 座標箱，面朝左飛）；wave：斗篷與頭髮飄動相位
  const paintWitch = (g, wave) => {
    const ink = '#150a1e';
    // 掃帚：柄＋尾端掃把
    g.strokeStyle = ink;
    g.lineCap = 'round';
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(10, 41);
    g.lineTo(76, 35);
    g.stroke();
    g.fillStyle = ink;
    g.beginPath();
    g.moveTo(73, 32.5);
    g.lineTo(96, 25 + Math.sin(wave) * 1.5);
    g.quadraticCurveTo(100, 36, 97, 47 + Math.sin(wave + 1) * 1.5);
    g.lineTo(73, 38.5);
    g.closePath();
    g.fill();
    // 斗篷往後飄
    g.beginPath();
    g.moveTo(47, 20);
    g.quadraticCurveTo(62, 12 + Math.sin(wave) * 3, 80, 13 + Math.sin(wave + 0.8) * 5);
    g.quadraticCurveTo(76, 21 + Math.sin(wave + 1.6) * 3, 84, 27 + Math.sin(wave + 2.2) * 4);
    g.quadraticCurveTo(70, 30, 60, 34);
    g.closePath();
    g.fill();
    // 身體（前傾）＋垂下的腿與尖頭靴
    g.beginPath();
    g.moveTo(39, 37);
    g.lineTo(44, 21);
    g.quadraticCurveTo(50, 18, 55, 22);
    g.lineTo(63, 37);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(49, 37);
    g.lineTo(46, 47);
    g.lineTo(37, 49.5);
    g.lineTo(40, 46);
    g.lineTo(42.5, 45.5);
    g.lineTo(45, 37);
    g.closePath();
    g.fill();
    // 手臂握著掃帚
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(46, 24);
    g.lineTo(36, 37);
    g.stroke();
    // 頭、尖鼻、往後飄的頭髮
    g.beginPath();
    g.arc(45, 16, 4.6, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(41.5, 14.5); g.lineTo(36.5, 17.5); g.lineTo(41.5, 18);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(47, 13);
    g.quadraticCurveTo(56, 15 + Math.sin(wave + 1) * 2, 60, 21 + Math.sin(wave + 1.5) * 2);
    g.quadraticCurveTo(53, 20, 47, 19);
    g.closePath();
    g.fill();
    // 尖帽：寬帽簷＋被風吹得往後彎的帽尖
    g.beginPath();
    g.ellipse(46, 11.5, 9.5, 2, -0.15, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(40.5, 11.5);
    g.quadraticCurveTo(47, 2, 63, 0.5 + Math.sin(wave) * 1.2);
    g.quadraticCurveTo(54, 4, 51.5, 10.5);
    g.closePath();
    g.fill();
    // 月光從右上打過來的輪廓光（只染在剪影上）
    g.globalCompositeOperation = 'source-atop';
    const rim = g.createLinearGradient(70, -10, 40, 30);
    rim.addColorStop(0, 'rgba(255, 170, 90, 0.55)');
    rim.addColorStop(1, 'rgba(255, 170, 90, 0)');
    g.fillStyle = rim;
    g.fillRect(0, 0, 100, 60);
    g.globalCompositeOperation = 'source-over';
  };

  // 與視窗大小無關的貼圖只建一次
  const batFrames = Array.from({ length: BAT_FRAMES }, (_, i) =>
    makeSprite(96, 64, g => paintBat(g, Math.sin((i / BAT_FRAMES) * Math.PI * 2))));
  const ghostFrames = Array.from({ length: GHOST_FRAMES }, (_, i) =>
    makeSprite(100, 120, (g, k) => paintGhost(g, k, (i / GHOST_FRAMES) * Math.PI * 2)));
  const glowSprite = makeSprite(64, 64, g => paintGlow(g,
    ['rgba(255, 150, 40, 0.42)', 'rgba(255, 120, 30, 0.16)', 'rgba(255, 110, 20, 0)']));
  const redGlowSprite = makeSprite(64, 64, g => paintGlow(g,
    ['rgba(255, 40, 20, 0.5)', 'rgba(220, 10, 10, 0.2)', 'rgba(200, 0, 0, 0)']));
  const shadowSprite = makeSprite(100, 32, paintShadow);
  const witchFrames = Array.from({ length: 4 }, (_, i) =>
    makeSprite(180, 108, g => paintWitch(g, (i / 4) * Math.PI * 2)));
  const sparkSprite = makeSprite(24, 24, g => paintGlow(g,
    ['rgba(255, 250, 210, 1)', 'rgba(255, 200, 90, 0.6)', 'rgba(255, 170, 60, 0)']));
  const eyeGlowSprite = makeSprite(24, 24, g => paintGlow(g,
    ['rgba(255, 230, 160, 1)', 'rgba(255, 40, 20, 0.85)', 'rgba(255, 0, 0, 0)']));

  let moon = {};
  let moonSprite = null;
  let bloodMoonSprite = null;
  let moonFace = {};       // 月亮變臉：eyes／blink／mouth 三張貼圖
  let moonEvent = null;    // 點月亮觸發的效果 { kind, t0 }
  let lastMoonKind = '';
  let burstBats = [];      // 從月亮爆飛出來的蝙蝠
  let sparks = [];         // 女巫掃帚留下的星塵
  let witchPx = 0;
  let viewW = w;
  let viewH = h;
  // 本幀的月亮效果狀態（月亮、星空、幽靈共用）
  const fx = { kind: '', e: -1, blood: 0, cover: 0, eclipseDx: 0 };
  let pumpkinSprite = null;
  let faceSprite = null;
  let scaryPumpkinSprite = null;
  let scaryFaceSprite = null;
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

  // born：出現的時間（之後 1.5 秒淡入）；初次佈局給 -Infinity 直接顯示
  const spawnGhost = (g, width, height, born) => {
    const z0 = rand(1.8, 2.8);
    const sx = rand(0, width);
    const sy = rand(0.15, 0.5) * height;
    return Object.assign(g, {
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
      born,
      scare: null,      // 被點到後的衝刺狀態
      hiddenUntil: 0,   // 衝刺結束後隱藏到這個時間
      gw: 0,            // 上一幀畫出的位置與大小（點擊判定用）
    });
  };
  const isIdle = g => !g.scare && !g.hiddenUntil;

  const layout = (width, height) => {
    const minSide = Math.min(width, height);
    moon = {
      x: width - clamp(width * 0.14, 80, 160),
      y: clamp(height * 0.16, 90, 150),
      r: clamp(minSide * 0.085, 36, 66),
    };
    const moonBox = (moon.r * 100) / MOON_R;
    moonSprite = makeSprite(moonBox, moonBox, g => paintMoon(g, HARVEST_MOON));
    bloodMoonSprite = makeSprite(moonBox, moonBox, g => paintMoon(g, BLOOD_MOON));
    moonFace = Object.fromEntries(['eyes', 'blink', 'mouth']
      .map(part => [part, makeSprite(moonBox, moonBox, g => paintMoonFace(g, part))]));
    witchPx = clamp(minSide * 0.22, 80, 170);
    viewW = width;
    viewH = height;

    // 南瓜：左下一顆大的、右下一大一小（小的較遠：較小、地面線較高）
    const P = clamp(minSide * 0.17, 60, 128);
    pumpkinSprite = makeSprite(P, P, g => paintPumpkin(g, SMILE));
    faceSprite = makeSprite(P, P, (g, k) => paintFaceGlow(g, k, SMILE));
    scaryPumpkinSprite = makeSprite(P, P, g => paintPumpkin(g, SCARY));
    scaryFaceSprite = makeSprite(P, P, (g, k) => paintFaceGlow(g, k, SCARY));
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
    ghosts = Array.from({ length: ghostCount }, () => spawnGhost({ kind: 'ghost' }, width, height, -Infinity));
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

  // bright：亮度倍率（血月時星星隱去、月蝕時更亮）
  const drawStars = (ctx, sec, bright = 1) => {
    if (bright <= 0) return;
    stars.forEach(s => {
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.phase + sec * s.speed));
      ctx.fillStyle = `rgba(240, 230, 255, ${Math.min(1, 0.45 * tw * bright).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // ── 點月亮：隨機出現一種效果（不連續重複）；值為效果長度（秒）──
  //   bats 蝙蝠從月亮爆飛／blood 血月（南瓜一起變兇）／witch 女巫騎掃帚飛過月亮／
  //   face 月亮變臉眨眼陰笑／eclipse 月蝕（畫面變暗、幽靈眼睛發紅光）
  const MOON_EVENTS = { bats: 3, blood: 5.6, witch: 4.3, face: 4.2, eclipse: 4 };
  const WITCH_FLIGHT = 3.2;

  const smooth = t => t * t * (3 - 2 * t);
  // 淡入 → 維持 → 淡出的強度 0~1
  const envelope = (e, inT, hold, outT) => {
    if (e < 0) return 0;
    if (e < inT) return e / inT;
    if (e < inT + hold) return 1;
    return clamp(1 - (e - inT - hold) / outT, 0, 1);
  };

  const updateMoonState = (sec) => {
    fx.kind = moonEvent?.kind || '';
    fx.e = moonEvent ? sec - moonEvent.t0 : -1;
    const e = fx.e;
    fx.blood = fx.kind === 'blood' ? envelope(e, 0.5, 4.5, 0.6) : 0;
    // 月蝕暗影的位置（以月亮半徑計）：從左滑入 → 全蝕 → 往右滑出
    fx.eclipseDx = 0;
    if (fx.kind === 'eclipse') {
      if (e < 1.2) fx.eclipseDx = -2.2 * (1 - smooth(e / 1.2));
      else if (e > 2.8) fx.eclipseDx = 2.2 * smooth(clamp((e - 2.8) / 1.2, 0, 1));
    }
    fx.cover = fx.kind === 'eclipse' ? clamp(1 - Math.abs(fx.eclipseDx) / 2, 0, 1) : 0;
  };

  const drawMoon = (ctx, sec) => {
    const { kind, e, blood, cover } = fx;
    const pulse = e >= 0 && e < 0.35 ? Math.sin((Math.PI * e) / 0.35) : 0; // 被點到時鼓一下
    // 蝙蝠爆飛的瞬間震一下；陰笑時一直抖
    const jitter = (kind === 'bats' && e < 0.5 ? 1 - e / 0.5 : 0) + (kind === 'face' && e > 2 && e < 3.2 ? 0.6 : 0);
    const x = moon.x + (jitter ? Math.sin(sec * 80) * moon.r * 0.05 * jitter : 0);
    const y = moon.y;
    const scale = 1 + 0.08 * pulse + 0.1 * blood; // 血月時月亮變大逼近
    const box = moonSprite.w * scale;
    const left = x - box / 2;
    const top = y - box / 2;
    ctx.globalAlpha = 1 - 0.6 * cover; // 月蝕時光暈跟著暗下來
    ctx.drawImage(moonSprite.img, left, top, box, box);
    if (blood) {
      ctx.globalAlpha = blood;
      ctx.drawImage(bloodMoonSprite.img, left, top, box, box);
    }
    if (kind === 'face') {
      ctx.globalAlpha = envelope(e, 0.8, 2.6, 0.8);
      ctx.drawImage((e > 1.5 && e < 1.68 ? moonFace.blink : moonFace.eyes).img, left, top, box, box);
      // 陰笑：嘴巴以嘴的位置為中心快速開合
      const chuckle = e > 2 && e < 3.2 ? 1 + 0.3 * Math.abs(Math.sin(sec * 22)) : 1;
      const mouthY = top + box * 0.55;
      ctx.save();
      ctx.translate(0, mouthY);
      ctx.scale(1, chuckle);
      ctx.translate(0, -mouthY);
      ctx.drawImage(moonFace.mouth.img, left, top, box, box);
      ctx.restore();
    }
    if (kind === 'eclipse') drawEclipse(ctx, x, y, moon.r * scale, fx.eclipseDx, cover);
    ctx.globalAlpha = 1;
  };

  // 月蝕：暗影滑過月面（裁在月面內），全蝕時月緣透出一圈紅銅色光環
  const drawEclipse = (ctx, x, y, r, dx, cover) => {
    const sx = x + dx * r;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r * 1.02, 0, Math.PI * 2);
    ctx.clip();
    const shade = ctx.createRadialGradient(sx, y, r * 0.86, sx, y, r * 1.1);
    shade.addColorStop(0, 'rgba(40, 6, 10, 0.93)');
    shade.addColorStop(1, 'rgba(40, 6, 10, 0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = shade;
    ctx.fillRect(x - r * 1.1, y - r * 1.1, r * 2.2, r * 2.2);
    ctx.restore();
    if (cover > 0.85) {
      const ring = (cover - 0.85) / 0.15;
      ctx.strokeStyle = '#ff7a3c';
      ctx.globalAlpha = 0.55 * ring;
      ctx.lineWidth = r * 0.07;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.18 * ring;
      ctx.lineWidth = r * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.12, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  // 女巫沿二次貝茲曲線從右側飛入、剛好從月亮前方掠過、往左上飛出
  const witchPos = (p) => {
    const P0 = [viewW + witchPx, moon.y + moon.r * 1.6];
    const P2 = [-witchPx, moon.y - moon.r * 0.6 - viewH * 0.06];
    const pm = clamp((viewW + witchPx - moon.x) / (viewW + 2 * witchPx), 0.15, 0.6); // 飛到月亮的進度
    // 反解控制點，讓曲線在 pm 時剛好通過月心
    const M = [moon.x, moon.y];
    const P1 = [0, 1].map(i => (M[i] - (1 - pm) ** 2 * P0[i] - pm ** 2 * P2[i]) / (2 * pm * (1 - pm)));
    const at = i => (1 - p) ** 2 * P0[i] + 2 * p * (1 - p) * P1[i] + p ** 2 * P2[i];
    const d = i => 2 * (1 - p) * (P1[i] - P0[i]) + 2 * p * (P2[i] - P1[i]);
    return { x: at(0), y: at(1), dx: d(0), dy: d(1) };
  };

  // 回傳掃帚尾端位置（灑星塵用）；飛完回傳 null
  const drawWitch = (ctx, e) => {
    const p = e / WITCH_FLIGHT;
    if (p < 0 || p >= 1) return null;
    const { x, y, dx, dy } = witchPos(p);
    const size = witchPx * (0.75 + 0.5 * p); // 越飛越近
    const frame = witchFrames[Math.floor(((e * 3) % 1) * witchFrames.length)];
    const rot = clamp(Math.atan2(-dy, -dx), -0.45, 0.45); // 貼圖面朝左，轉向前進方向
    const by = y + Math.sin(e * 7) * size * 0.03;
    ctx.save();
    ctx.translate(x, by);
    ctx.rotate(rot);
    ctx.drawImage(frame.img, -size / 2, -size * 0.3, size, size * 0.6);
    ctx.restore();
    const [lx, ly] = [size * 0.47, size * 0.06];
    return { x: x + lx * Math.cos(rot) - ly * Math.sin(rot), y: by + lx * Math.sin(rot) + ly * Math.cos(rot) };
  };

  const drawSparks = (ctx, sec) => {
    sparks = sparks.filter(s => sec - s.t0 < s.life);
    sparks.forEach((s) => {
      const age = sec - s.t0;
      const k = age / s.life;
      const size = s.size * (1 - 0.5 * k);
      ctx.globalAlpha = (1 - k) * (0.6 + 0.4 * Math.sin(age * 30 + s.size));
      ctx.drawImage(sparkSprite.img, s.x + s.vx * age - size,
        s.y + s.vy * age + 15 * age * age - size, size * 2, size * 2);
    });
    ctx.globalAlpha = 1;
  };

  // 蝙蝠從月亮爆飛：從月亮所在的深度出發，各自朝畫面上隨機一點飛向鏡頭
  // （世界座標等速直線，透視投影後仍是直線，越近越大越快）
  const BURST_Z = 3.6;
  const toWorld = (sx, sy, z) => [((sx - viewW / 2) / (viewW / 2)) * z, ((sy - viewH * HORIZON) / (viewH / 2)) * z];
  const startBatBurst = () => {
    const count = clamp(Math.round((viewW * viewH) / 55000), 14, 24);
    burstBats = Array.from({ length: count }, () => {
      const vz = -rand(1.8, 2.6);
      const t1 = (BURST_Z - 1) / -vz; // 飛到 z=1 的時間
      const [x0, y0] = toWorld(moon.x + rand(-0.3, 0.3) * moon.r, moon.y + rand(-0.3, 0.3) * moon.r, BURST_Z);
      const [x1, y1] = toWorld(rand(0.05, 0.95) * viewW, rand(0.1, 0.85) * viewH, 1);
      return {
        x: x0, y: y0, z: BURST_Z, vx: (x1 - x0) / t1, vy: (y1 - y0) / t1, vz,
        flapHz: rand(6, 8), phase: Math.random(), fade: 1, delay: rand(0, 0.7),
      };
    });
  };

  const startMoonEvent = () => {
    const kinds = Object.keys(MOON_EVENTS).filter(k => k !== lastMoonKind);
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    lastMoonKind = kind;
    moonEvent = { kind, t0: lastSec };
    if (kind === 'bats') startBatBurst();
    if (kind === 'blood') {
      // 月亮轉紅後南瓜一起變兇（已經是兇臉的就直接重新計時）
      pumpkins.forEach((p) => {
        const m = scaryMix(p, lastSec);
        p.scaredAt = m > 0 ? lastSec - SCARY_IN * m : lastSec + 0.35;
        p.jumpAt = lastSec + 0.35;
      });
    }
  };

  // 燭光閃爍：幾個不同頻率的正弦相加，看起來不規則但與幀率無關
  const flicker = (sec, seed) => clamp(
    0.72 + 0.14 * Math.sin(sec * 7.3 + seed) + 0.09 * Math.sin(sec * 12.9 + seed * 2.3)
      + 0.06 * Math.sin(sec * 23.1 + seed * 0.7),
    0.35, 1);

  // 南瓜嚇人程度 0~1：變臉 → 維持 → 慢慢變回笑臉（沒被點過 scaredAt 為 undefined → 0）
  const scaryMix = (p, sec) => {
    const e = sec - p.scaredAt;
    if (!(e >= 0)) return 0;
    if (e < SCARY_IN) return e / SCARY_IN;
    if (e < SCARY_HOLD) return 1;
    return clamp(1 - (e - SCARY_HOLD) / SCARY_OUT, 0, 1);
  };

  const drawPumpkins = (ctx, sec, still) => {
    pumpkins.forEach(p => {
      const s = p.size;
      const m = still ? 0 : scaryMix(p, sec);
      // 被點到：跳一下＋抖動，0.5 秒內衰減
      const je = sec - p.jumpAt;
      const jump = je >= 0 && je < 0.5 ? 1 - je / 0.5 : 0;
      const hop = jump ? Math.sin(Math.PI * (je / 0.5)) * s * 0.16 : 0;
      const shakeX = jump ? Math.sin(je * 70) * s * 0.035 * jump : 0;
      const lift = (still ? 0 : (0.5 + 0.5 * Math.sin(sec * 1.1 + p.seed)) * s * 0.1) + hop; // 浮起高度
      const tilt = (still ? 0 : Math.sin(sec * 0.8 + p.seed * 1.7) * 0.05) + (jump ? Math.sin(je * 55) * 0.12 * jump : 0);
      const light = still ? 0.85 : flicker(sec, p.seed);
      const fury = flicker(sec * 1.8, p.seed + 1); // 嚇人時燭光閃得更兇
      p.lift = lift;
      // 地面投影：浮得越高影子越小越淡
      const shrink = Math.max(0.35, 1 - (lift / s) * 2.2);
      const sw = s * 0.95 * shrink;
      ctx.globalAlpha = p.alpha * shrink;
      ctx.drawImage(shadowSprite.img, p.x - sw / 2, p.ground - sw * 0.16, sw, sw * 0.32);
      // 燭光照亮周圍：嚇人時轉紅、範圍變大，被點到的瞬間爆亮
      const gs = s * (2.4 + 0.8 * m + 0.9 * jump);
      const gx = p.x + shakeX - gs / 2;
      const gy = p.ground - lift - s * 0.45 - gs / 2;
      if (m < 1) {
        ctx.globalAlpha = p.alpha * light * 0.75 * (1 - m);
        ctx.drawImage(glowSprite.img, gx, gy, gs, gs);
      }
      if (m > 0) {
        ctx.globalAlpha = p.alpha * Math.min(1, fury * 0.85 * m + 0.4 * jump);
        ctx.drawImage(redGlowSprite.img, gx, gy, gs, gs);
      }
      // 瓜身＋臉部燭光（以底部為支點微微搖晃）；嚇人的臉疊在上面淡入淡出
      ctx.save();
      ctx.translate(p.x + shakeX, p.ground - lift);
      ctx.rotate(tilt);
      ctx.globalAlpha = p.alpha;
      ctx.drawImage(pumpkinSprite.img, -s / 2, -s * 0.92, s, s);
      if (m > 0) {
        ctx.globalAlpha = p.alpha * m;
        ctx.drawImage(scaryPumpkinSprite.img, -s / 2, -s * 0.92, s, s);
      }
      if (m < 1) {
        ctx.globalAlpha = p.alpha * light * (1 - m);
        ctx.drawImage(faceSprite.img, -s / 2, -s * 0.92, s, s);
      }
      if (m > 0) {
        ctx.globalAlpha = p.alpha * fury * m;
        ctx.drawImage(scaryFaceSprite.img, -s / 2, -s * 0.92, s, s);
      }
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
    const alpha = (0.45 + 0.4 * near) * fade * clamp((sec - g.born) / 1.5, 0, 1);
    g.sx = sx;
    g.sy = sy;
    g.gw = gw;
    g.alpha = alpha;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(Math.sin(sec * g.bobSpeed * 0.6 + g.phase) * 0.1);
    if (g.vx > 0) ctx.scale(-1, 1); // 貼圖臉朝左，往右飄時翻面
    ctx.globalAlpha = alpha;
    ctx.drawImage(frame.img, -gw / 2, -gw * 0.6, gw, gw * 1.2);
    // 月蝕時眼睛發紅光（貼圖眼睛在 36,50 與 58,50）
    if (fx.cover) {
      const es = gw * 0.2;
      ctx.globalAlpha = fx.cover;
      [-0.14, 0.08].forEach(ex => ctx.drawImage(eyeGlowSprite.img, ex * gw - es / 2, -0.1 * gw - es / 2, es, es));
    }
    ctx.restore();
  };

  // 被點到的幽靈：原地膨脹抖動 → 衝向畫面中央放大到幾乎滿版 → 淡出
  const drawScaredGhost = (ctx, g, sec, width, height) => {
    const { t0, sx, sy, gw, alpha: a0 } = g.scare;
    const e = sec - t0;
    const target = Math.max(width, height / 1.2) * 1.15; // 幾乎滿版時的寬
    let size;
    let x;
    let y;
    let alpha;
    if (e < SCARE_PUFF) {
      const p = e / SCARE_PUFF;
      size = gw * (1 + 0.25 * Math.sin((p * Math.PI) / 2));
      x = sx + Math.sin(e * 90) * gw * 0.05;
      y = sy;
      alpha = a0 + (0.95 - a0) * p;
    } else if (e < SCARE_PUFF + SCARE_RUSH) {
      const p = (e - SCARE_PUFF) / SCARE_RUSH;
      const s0 = gw * 1.25;
      // 透視：距離等速縮短 → 越靠近放大越快，像迎面撲來
      size = s0 / (1 - p * (1 - s0 / target));
      x = sx + (width / 2 - sx) * p;
      y = sy + (height * 0.45 - sy) * p;
      alpha = 0.95;
    } else {
      const f = clamp((e - SCARE_PUFF - SCARE_RUSH) / SCARE_FADE, 0, 1);
      size = target * (1 + 0.12 * f);
      x = width / 2;
      y = height * 0.45;
      alpha = 0.95 * (1 - f);
    }
    const k = size / 100;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    ctx.translate(-50, -60);
    ctx.globalAlpha = alpha;
    paintScaryGhost(ctx, sec * 5);
    ctx.restore();
  };

  // 幽靈撲到眼前的瞬間整個特效層震一下（0~1）
  const screenShake = sec => ghosts.reduce((max, g) => {
    if (!g.scare) return max;
    const e = sec - g.scare.t0 - SCARE_PUFF - SCARE_RUSH;
    return e > -0.08 && e < SCARE_FADE ? Math.max(max, 1 - Math.max(e, 0) / SCARE_FADE) : max;
  }, 0);

  // 點擊判定（用上一幀畫出的位置）
  const pumpkinAt = (x, y) => pumpkins.find((p) => {
    const cy = p.ground - (p.lift || 0) - p.size * 0.36;
    return ((x - p.x) / (p.size * 0.5 + HIT_PAD)) ** 2 + ((y - cy) / (p.size * 0.42 + HIT_PAD)) ** 2 <= 1;
  });
  const ghostAt = (x, y) => ghosts
    .filter(g => isIdle(g) && g.gw
      && Math.abs(x - g.sx) <= g.gw * 0.36 + HIT_PAD && Math.abs(y - g.sy) <= g.gw * 0.5 + HIT_PAD)
    .sort((a, b) => a.z - b.z)[0];
  // 月亮效果進行中不能再點
  const moonAt = (x, y) => !moonEvent && Math.hypot(x - moon.x, y - moon.y) <= moon.r + HIT_PAD;

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
      if (g.scare) {
        if (sec - g.scare.t0 > SCARE_PUFF + SCARE_RUSH + SCARE_FADE) {
          g.scare = null;
          g.hiddenUntil = sec + GHOST_RESPAWN;
        }
        return;
      }
      if (g.hiddenUntil) {
        if (sec >= g.hiddenUntil) spawnGhost(g, width, height, sec);
        return;
      }
      g.x += g.vx * dt;
      g.z = g.z0 + Math.sin(sec * g.zSpeed + g.phase) * g.zAmp;
      // 飄出畫面就從另一側回來
      const edge = g.z * (1 + ghostPx / g.z / width);
      if (g.x > edge) g.x = -edge;
      else if (g.x < -edge) g.x = edge;
    });
    if (burstBats.length) {
      burstBats = burstBats.filter((b) => {
        if (b.delay > 0) {
          b.delay -= dt;
          return true;
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.z += b.vz * dt;
        const s = 1 / b.z;
        const size = batPx * s;
        const sx = width / 2 + b.x * s * (width / 2);
        const sy = height * HORIZON + b.y * s * (height / 2);
        // 飛過鏡頭或飛出畫面就消失
        return b.z > 0.5 && sx > -size && sx < width + size && sy > -size && sy < height + size;
      });
    }
    if (moonEvent && sec - moonEvent.t0 > MOON_EVENTS[moonEvent.kind]) moonEvent = null;
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
      updateMoonState(sec);
      drawNight(ctx, width, height);
      // 血月：整片夜色轉暗紅；月蝕：整片畫面變暗，只剩燭光與幽靈的光
      if (fx.blood) {
        ctx.fillStyle = `rgba(110, 0, 14, ${(0.3 * fx.blood).toFixed(3)})`;
        ctx.fillRect(0, 0, width, height);
      }
      if (fx.cover) {
        ctx.fillStyle = `rgba(6, 0, 16, ${(0.45 * fx.cover).toFixed(3)})`;
        ctx.fillRect(0, 0, width, height);
      }
      const shake = screenShake(sec);
      ctx.save();
      if (shake) ctx.translate(Math.sin(sec * 97) * 9 * shake, Math.cos(sec * 83) * 7 * shake);
      drawStars(ctx, sec, (1 - fx.blood) * (1 + fx.cover));
      drawMoon(ctx, sec);
      if (fx.kind === 'witch') {
        const tail = drawWitch(ctx, fx.e);
        if (tail && sparks.length < 90) {
          for (let i = 0; i < 2; i++) {
            sparks.push({
              x: tail.x, y: tail.y, t0: sec, vx: rand(-20, 20), vy: rand(10, 45),
              size: rand(2, 4.5), life: rand(0.7, 1.2),
            });
          }
        }
      }
      if (sparks.length) drawSparks(ctx, sec);
      actors.sort((a, b) => b.z - a.z);
      actors.forEach(a => {
        if (a.kind === 'bat') drawBat(ctx, a, sec, width, height);
        else if (isIdle(a)) drawGhost(ctx, a, sec, width, height);
      });
      drawPumpkins(ctx, sec, false);
      // 從月亮爆飛的蝙蝠飛近時會掠過南瓜前方
      if (burstBats.length) {
        burstBats.sort((a, b) => b.z - a.z);
        burstBats.forEach(b => { if (b.delay <= 0) drawBat(ctx, b, sec, width, height); });
      }
      // 衝向鏡頭的幽靈蓋在最上層
      ghosts.forEach(g => { if (g.scare) drawScaredGhost(ctx, g, sec, width, height); });
      ctx.restore();
    },
    hitTest(x, y) {
      return !!(pumpkinAt(x, y) || ghostAt(x, y) || moonAt(x, y));
    },
    tap(x, y) {
      const p = pumpkinAt(x, y);
      if (p) {
        // 已經是嚇人臉就重新計時，不閃回笑臉
        p.scaredAt = lastSec - SCARY_IN * scaryMix(p, lastSec);
        p.jumpAt = lastSec;
        return true;
      }
      const g = ghostAt(x, y);
      if (g) {
        g.scare = { t0: lastSec, sx: g.sx, sy: g.sy, gw: g.gw, alpha: g.alpha };
        return true;
      }
      if (!moonAt(x, y)) return false;
      startMoonEvent();
      return true;
    },
    // 減少動態：只畫靜態夜色、星空、滿月與南瓜燈
    drawStatic(ctx, width, height) {
      drawNight(ctx, width, height);
      drawStars(ctx, 0);
      drawMoon(ctx, 0);
      drawPumpkins(ctx, 0, true);
    },
  };
}

/* ── 聖誕節：雪夜＋銀白滿月＋聖誕老人雪橇與馴鹿＋聖誕樹＋雪人＋禮物 ──
   3D 感：球面／圓錐打光、積雪雪丘與地面投影；雪花有深度（近大快、遠小慢），
   近處的雪飄在場景前方；雪橇從月亮那側由遠而近飛過夜空，遠側馴鹿較暗，拖出金色星塵。
   互動：每個圖案有幾種效果，每次點隨機換一種（不連續重複），播放中再點同一個會略過：
     雪橇 → 撒禮物／空中翻圈／放煙火／加速衝刺；聖誕樹 → 燈光秀／搖樹落雪／星星變流星；
     雪人 → 揮手帽子彈起／丟雪球砸鏡頭／開心跳；禮物 → 打開噴彩帶／大跳翻滾／跳出小驚喜；
     月亮 → 雪橇不在時叫它出發，雪橇在飛時改成流星雨或暴風雪。
   效能：同萬聖節，光影只在建立／resize 時畫進離屏貼圖，每幀只貼圖，並限制 30 fps。 */
function createChristmas(w, h) {
  const DEER_FRAMES = 8;
  const DEER_W = 0.78;   // 馴鹿寬（相對雪橇寬）
  const PASS_GAP = 7;    // 雪橇兩趟之間的空檔（秒）
  const HIT_PAD = 10;    // 點擊範圍比圖案大一圈（px），手機較好點
  // 各互動效果的長度（秒）；衝刺會一路衝到這趟飛完
  const TEAM_FX = { drop: 1.4, loop: 1.6, fireworks: 1.3, dash: Infinity };
  const TREE_FX = { show: 3, shake: 1.3, meteor: 3.7 };
  const SNOWMAN_FX = { wave: 1.8, throw: 2.5, jump: 0.85 };
  const GIFT_FX = { open: 2.8, flip: 1.15, surprise: 2.5 };
  const MOON_FX = { shower: 2.8, blizzard: 5 };
  const SCENE_FX = { tree: TREE_FX, snowman: SNOWMAN_FX, gift: GIFT_FX };
  const LOOP_R = 0.75;          // 翻圈半徑（雪橇寬）
  const METEOR_FLIGHT = 1.4;    // 樹頂星星飛走的時間
  const THROW_AT = 0.35;        // 雪人出手
  const BALL_FLIGHT = 0.7;      // 雪球飛到鏡頭
  const SPLAT_HOLD = 1;
  const SPLAT_FADE = 0.4;
  const MAX_PARTICLES = 360;
  // 燈串、煙火、彩帶共用的顏色（白色只給煙火）
  const FX_COLORS = ['#ff5a5a', '#ffd23f', '#4fc3ff', '#7dff7a', '#ff7ae0', '#ffffff'];
  const LIGHT_COLORS = FX_COLORS.slice(0, 5);

  const rgbOf = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ');
  const smooth = q => q * q * (3 - 2 * q);
  const easeOut = q => 1 - (1 - q) ** 3;
  const easeOutBack = q => 1 + 2.70158 * (q - 1) ** 3 + 1.70158 * (q - 1) ** 2;
  // 隨機挑一種效果，不和這個圖案上一次一樣
  const pickFx = (obj, table) => {
    const kinds = Object.keys(table).filter(k => k !== obj.lastFx);
    obj.lastFx = kinds[Math.floor(Math.random() * kinds.length)];
    return obj.lastFx;
  };

  // 球面漸層：光從左上來
  const sphere = (g, x, y, r, [c0, c1, c2]) => {
    const grad = g.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.08, x, y, r * 1.05);
    grad.addColorStop(0, c0);
    grad.addColorStop(0.5, c1);
    grad.addColorStop(1, c2);
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  };
  const linear = (g, x0, y0, x1, y1, [c0, c1]) => {
    const grad = g.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, c0);
    grad.addColorStop(1, c1);
    return grad;
  };

  // 滿月（100×100 座標箱，半徑 16，外圍光暈到箱邊）：冷白月色呼應雪夜
  const MOON_R = 16;
  const paintMoon = (g) => {
    const halo = g.createRadialGradient(50, 50, MOON_R * 0.8, 50, 50, 50);
    halo.addColorStop(0, 'rgba(214, 228, 255, 0.36)');
    halo.addColorStop(0.4, 'rgba(190, 210, 255, 0.12)');
    halo.addColorStop(1, 'rgba(190, 210, 255, 0)');
    g.fillStyle = halo;
    g.fillRect(0, 0, 100, 100);
    sphere(g, 50, 50, MOON_R, ['#ffffff', '#eef2fa', '#b4c0da']);
    g.save();
    g.beginPath();
    g.arc(50, 50, MOON_R, 0, Math.PI * 2);
    g.clip();
    [[-0.3, -0.15, 0.55], [0.35, 0.3, 0.45], [0.1, -0.45, 0.3]].forEach(([dx, dy, dr]) => {
      const x = 50 + dx * MOON_R;
      const y = 50 + dy * MOON_R;
      const r = dr * MOON_R;
      const mare = g.createRadialGradient(x, y, 0, x, y, r);
      mare.addColorStop(0, 'rgba(130, 148, 188, 0.26)');
      mare.addColorStop(1, 'rgba(130, 148, 188, 0)');
      g.fillStyle = mare;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    });
    g.restore();
  };

  const paintGlow = rgb => (g) => {
    const grad = g.createRadialGradient(50, 50, 0, 50, 50, 50);
    grad.addColorStop(0, `rgba(${rgb}, 0.5)`);
    grad.addColorStop(0.4, `rgba(${rgb}, 0.18)`);
    grad.addColorStop(1, `rgba(${rgb}, 0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 100, 100);
  };

  // 發光小燈泡：白色核心＋同色光暈（燈光秀、煙火火花、流星頭）
  const paintBulb = color => (g) => {
    const rgb = rgbOf(color);
    const grad = g.createRadialGradient(50, 50, 0, 50, 50, 50);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.16, `rgba(${rgb}, 1)`);
    grad.addColorStop(0.42, `rgba(${rgb}, 0.35)`);
    grad.addColorStop(1, `rgba(${rgb}, 0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 100, 100);
  };

  // 雪地上的接觸陰影（偏藍）
  const paintShadow = (g) => {
    g.scale(1, 0.32);
    const grad = g.createRadialGradient(50, 50, 0, 50, 50, 50);
    grad.addColorStop(0, 'rgba(30, 48, 100, 0.5)');
    grad.addColorStop(1, 'rgba(30, 48, 100, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 100, 100);
  };

  // 星芒：十字光芒＋柔光核心，用於樹頂星光與雪橇星塵
  const paintSparkle = (g) => {
    const core = g.createRadialGradient(50, 50, 0, 50, 50, 34);
    core.addColorStop(0, 'rgba(255, 252, 232, 0.95)');
    core.addColorStop(0.2, 'rgba(255, 232, 150, 0.5)');
    core.addColorStop(1, 'rgba(255, 220, 120, 0)');
    g.fillStyle = core;
    g.fillRect(0, 0, 100, 100);
    g.fillStyle = 'rgba(255, 248, 215, 0.9)';
    g.translate(50, 50);
    [0, Math.PI / 2].forEach((rot) => {
      g.save();
      g.rotate(rot);
      g.beginPath();
      g.moveTo(-50, 0);
      g.quadraticCurveTo(0, -2.4, 50, 0);
      g.quadraticCurveTo(0, 2.4, -50, 0);
      g.fill();
      g.restore();
    });
  };

  // 雪花：柔光雪點，近處少數畫成六角結晶
  const paintFlake = (g) => {
    const grad = g.createRadialGradient(50, 50, 0, 50, 50, 50);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.75)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 100, 100);
  };
  const paintCrystal = (g, k) => {
    g.translate(50, 50);
    g.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    g.lineCap = 'round';
    g.lineWidth = 5;
    g.shadowColor = 'rgba(200, 220, 255, 0.9)';
    g.shadowBlur = 4 * k;
    for (let i = 0; i < 6; i++) {
      g.rotate(Math.PI / 3);
      g.beginPath();
      g.moveTo(0, 0); g.lineTo(0, -42);
      g.moveTo(0, -18); g.lineTo(-12, -28);
      g.moveTo(0, -18); g.lineTo(12, -28);
      g.moveTo(0, -30); g.lineTo(-8, -37);
      g.moveTo(0, -30); g.lineTo(8, -37);
      g.stroke();
    }
  };

  // 雪丘（100×32 座標箱，物件站在 y≈15）：頂面受光、往下偏藍，下緣延伸到畫面外
  const paintDrift = (g) => {
    const p = new Path2D();
    p.moveTo(0, 32);
    p.bezierCurveTo(2, 20, 12, 13, 26, 14);
    p.bezierCurveTo(36, 7, 56, 6, 68, 11);
    p.bezierCurveTo(84, 9, 97, 18, 100, 32);
    p.closePath();
    const grad = g.createLinearGradient(0, 6, 0, 32);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.45, '#e9f0fb');
    grad.addColorStop(1, '#bccbe4');
    g.fillStyle = grad;
    g.fill(p);
    g.globalCompositeOperation = 'source-atop';
    const shade = g.createRadialGradient(34, 8, 2, 50, 20, 60);
    shade.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    shade.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    shade.addColorStop(1, 'rgba(90, 110, 160, 0.35)');
    g.fillStyle = shade;
    g.fillRect(0, 0, 100, 32);
    g.globalCompositeOperation = 'source-over';
    // 雪面閃光
    g.fillStyle = 'rgba(255, 255, 255, 0.95)';
    [[22, 17], [40, 12], [57, 11], [74, 15], [86, 20], [31, 22], [63, 19]].forEach(([x, y]) => {
      g.beginPath();
      g.arc(x, y, 0.7, 0, Math.PI * 2);
      g.fill();
    });
  };

  // 聖誕樹（100×140 座標箱，樹幹底部在 y=132）：三層圓錐枝葉由下往上畫，
  // 上層在下層投下陰影；樹梢積雪、燈串、彩球（樹頂星星另外一張貼圖，才能飛走）
  const TIERS = [[56, 116, 46], [33, 86, 37], [12, 58, 27]]; // [頂 y, 底 y, 底部半寬]
  const TREE_H = 140;
  const TREE_GROUND = 132;
  const STAR = [50, 11];
  const STAR_R = 42;                      // 星星貼圖內的外半徑（100×100）
  const STAR_SIZE = (8.5 * 100) / STAR_R; // 星星貼圖寬（樹的座標單位）
  const tierEdgeY = ([, bottom, hw], x) => bottom + 4 * (1 - ((x - 50) / hw) ** 2); // 底緣中間較低 → 圓錐感
  const tierHalf = ([top, bottom, hw], y) => hw * clamp((y - top) / (bottom - top), 0, 1);
  const tierEdge = (p, tier) => {
    const hw = tier[2];
    const n = Math.max(4, Math.round(hw / 8));
    for (let i = 0; i < n; i++) {
      const x0 = 50 - hw + (2 * hw * i) / n;
      const x1 = 50 - hw + (2 * hw * (i + 1)) / n;
      const xm = (x0 + x1) / 2;
      p.quadraticCurveTo(xm, tierEdgeY(tier, xm) + 4, x1, tierEdgeY(tier, x1) - 2);
    }
  };
  const tierPaths = TIERS.map((tier) => {
    const [top, bottom, hw] = tier;
    const p = new Path2D();
    p.moveTo(50, top);
    p.quadraticCurveTo(50 - hw * 0.42, (top + bottom) / 2, 50 - hw, bottom - 2);
    tierEdge(p, tier);
    p.quadraticCurveTo(50 + hw * 0.42, (top + bottom) / 2, 50, top);
    p.closePath();
    return p;
  });
  // 燈串：每層斜繞過正面、中間下垂；下兩層的上半部被上一層蓋住，只能掛在下半段
  const garlands = TIERS.map((tier, i) => {
    const [top, bottom, hw] = tier;
    const [a, b] = i < 2 ? [0.6, 0.78] : [0.36, 0.62];
    const n = Math.max(5, Math.round(hw / 5.5));
    return Array.from({ length: n + 1 }, (_, j) => {
      const u = j / n;
      const y = top + (bottom - top) * (a + (b - a) * u + 0.1 * Math.sin(Math.PI * u));
      return [50 + (2 * u - 1) * tierHalf(tier, y) * 0.94, y];
    });
  });
  const treeLights = garlands.flatMap(pts => pts.slice(1, -1))
    .map(([x, y], i) => ({ x, y, color: LIGHT_COLORS[i % LIGHT_COLORS.length], group: i % 3 }));
  const BAUBLE_COLORS = [
    ['#ffb0b0', '#e0262f', '#6e0a10'],
    ['#fff2b0', '#f0b429', '#7a4e00'],
    ['#b8dcff', '#2f78d8', '#0e2c62'],
    ['#ffffff', '#cdd5e2', '#66708a'],
    ['#ecc6ff', '#9a4fd8', '#40146a'],
  ];
  const BAUBLES = [ // [層, 橫向 -1~1, 高度比例, 顏色]
    [0, -0.74, 0.88, 0], [0, -0.26, 0.98, 1], [0, 0.26, 0.93, 2], [0, 0.72, 0.84, 4],
    [1, -0.62, 0.9, 2], [1, -0.04, 0.99, 0], [1, 0.56, 0.86, 1],
    [2, -0.54, 0.88, 1], [2, 0.1, 0.97, 4], [2, 0.5, 0.78, 0], [2, -0.2, 0.32, 3],
  ];

  const paintTree = (g, k) => {
    const trunk = g.createLinearGradient(44, 0, 56, 0);
    trunk.addColorStop(0, '#9a6a40');
    trunk.addColorStop(0.5, '#6a4022');
    trunk.addColorStop(1, '#341c0a');
    g.fillStyle = trunk;
    g.fillRect(44, 110, 12, TREE_GROUND - 110);
    TIERS.forEach((tier, i) => {
      const [top, bottom, hw] = tier;
      const path = tierPaths[i];
      // 上一層在下層投下柔和陰影：形狀畫在箱外，靠陰影位移投回原位（往右下偏）
      if (i > 0) {
        g.save();
        g.clip(tierPaths[i - 1]);
        g.shadowColor = 'rgba(0, 26, 10, 0.6)';
        g.shadowBlur = 4 * k;
        g.shadowOffsetX = 201.5 * k;
        g.shadowOffsetY = 3.5 * k;
        g.translate(-200, 0);
        g.fillStyle = '#000';
        g.fill(path);
        g.restore();
      }
      const grad = g.createLinearGradient(50 - hw, 0, 50 + hw, 0);
      grad.addColorStop(0, '#52b868');
      grad.addColorStop(0.42, '#238a42');
      grad.addColorStop(1, '#0b4522');
      g.fillStyle = grad;
      g.fill(path);
      g.save();
      g.clip(path);
      // 枝葉紋理：由頂往下散開的明暗線
      g.lineWidth = 0.9;
      [-0.78, -0.45, -0.14, 0.18, 0.5, 0.8].forEach((f, j) => {
        g.strokeStyle = j < 2 ? 'rgba(170, 235, 170, 0.22)' : 'rgba(2, 36, 14, 0.3)';
        g.beginPath();
        g.moveTo(50, top + 2);
        g.quadraticCurveTo(50 + hw * f * 0.45, (top + bottom) / 2, 50 + hw * f, bottom + 4);
        g.stroke();
      });
      // 樹梢積雪：沿底緣描一圈白邊，裁切後只留內側
      const edge = new Path2D();
      edge.moveTo(50 - hw, bottom - 2);
      tierEdge(edge, tier);
      g.strokeStyle = linear(g, 50 - hw, 0, 50 + hw, 0, ['rgba(255, 255, 255, 0.98)', 'rgba(196, 212, 240, 0.85)']);
      g.lineWidth = 5.5;
      g.stroke(edge);
      g.restore();
    });
    // 整棵樹的明暗（source-atop：只染在樹上）
    g.globalCompositeOperation = 'source-atop';
    const shade = g.createRadialGradient(38, 60, 6, 50, 72, 80);
    shade.addColorStop(0, 'rgba(255, 255, 220, 0.12)');
    shade.addColorStop(0.5, 'rgba(255, 255, 220, 0)');
    shade.addColorStop(1, 'rgba(0, 18, 8, 0.32)');
    g.fillStyle = shade;
    g.fillRect(0, 0, 100, TREE_H);
    g.globalCompositeOperation = 'source-over';
    // 燈串電線與未亮的燈泡（亮燈另外疊一層貼圖閃爍）
    g.strokeStyle = 'rgba(16, 40, 20, 0.7)';
    g.lineWidth = 0.6;
    garlands.forEach((pts) => {
      g.beginPath();
      g.moveTo(...pts[0]);
      for (let j = 1; j < pts.length; j++) {
        const [x0, y0] = pts[j - 1];
        const [x1, y1] = pts[j];
        g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 1.2, x1, y1);
      }
      g.stroke();
    });
    treeLights.forEach(({ x, y, color }) => {
      g.fillStyle = color;
      g.beginPath();
      g.arc(x, y, 1.6, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(0, 0, 0, 0.45)';
      g.fill();
    });
    // 彩球
    BAUBLES.forEach(([t, u, f, c]) => {
      const tier = TIERS[t];
      const y = tier[0] + (tier[1] - tier[0]) * f;
      const x = 50 + u * tierHalf(tier, y);
      const r = 3.8 - t * 0.45;
      g.fillStyle = '#c9a040';
      g.fillRect(x - r * 0.3, y - r - 1, r * 0.6, 1.4);
      sphere(g, x, y, r, BAUBLE_COLORS[c]);
      g.fillStyle = 'rgba(255, 255, 255, 0.8)';
      g.beginPath();
      g.arc(x - r * 0.35, y - r * 0.4, r * 0.22, 0, Math.PI * 2);
      g.fill();
    });
  };

  // 樹頂星星（100×100，置中）：每個尖角分成兩個斜面，依面向光源（左上）決定明暗 → 立體切面
  const paintStar = (g) => {
    const LIGHT_DIR = -Math.PI * 0.75;
    const dark = [196, 128, 16];
    const lite = [255, 246, 176];
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      const tip = [50 + Math.cos(a) * STAR_R, 50 + Math.sin(a) * STAR_R];
      [-1, 1].forEach((side) => {
        const b = a + (side * Math.PI) / 5;
        const lit = 0.5 + 0.5 * Math.cos(a + (side * Math.PI) / 2 - LIGHT_DIR);
        g.fillStyle = `rgb(${dark.map((v, j) => Math.round(v + (lite[j] - v) * lit)).join(', ')})`;
        g.beginPath();
        g.moveTo(50, 50);
        g.lineTo(...tip);
        g.lineTo(50 + Math.cos(b) * STAR_R * 0.42, 50 + Math.sin(b) * STAR_R * 0.42);
        g.closePath();
        g.fill();
      });
    }
  };

  // 亮著的燈（分三組輪流閃爍）：燈泡本身加同色光暈
  const paintLights = (g, k, group) => {
    treeLights.filter(l => l.group === group).forEach(({ x, y, color }) => {
      g.shadowColor = color;
      g.shadowBlur = 5 * k;
      g.fillStyle = color;
      g.beginPath();
      g.arc(x, y, 1.8, 0, Math.PI * 2);
      g.fill();
      g.fill();
      g.shadowColor = 'transparent';
      g.fillStyle = 'rgba(255, 255, 255, 0.85)';
      g.beginPath();
      g.arc(x - 0.45, y - 0.5, 0.7, 0, Math.PI * 2);
      g.fill();
    });
  };

  // 雪人（100×134 座標箱，底部 y=130，臉微朝左）：三顆雪球球面打光，球與球交接處有接觸陰影。
  // 分三張貼圖：身體、舉起的右手（以肩為軸揮動）、高帽（可以彈起翻轉）
  const SNOWMAN_H = 134;
  const SNOWMAN_GROUND = 130;
  const SNOWMAN_SHOULDER = [67, 63];
  const SNOWMAN_HAND = [88, 47];
  const SNOWMAN_HAT = [50, 17];
  const SNOWMAN_CHEEKS = [[40.5, 40], [56.5, 39.5]];
  const paintSnowman = (g, part) => {
    g.translate(0, 4);
    g.lineCap = 'round';
    if (part === 'arm') {
      g.strokeStyle = '#5a3a1e';
      g.lineWidth = 2.3;
      g.beginPath();
      g.moveTo(67, 59); g.lineTo(88, 43);
      g.stroke();
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(81, 48); g.lineTo(88, 51);
      g.moveTo(84, 45.5); g.lineTo(84, 37);
      g.stroke();
      return;
    }
    if (part === 'hat') {
      // 高帽（微微歪戴）：帽簷先畫，帽身蓋住帽簷後半
      g.translate(50, 22);
      g.rotate(-0.14);
      g.translate(-50, -22);
      g.fillStyle = linear(g, 0, 19, 0, 26, ['#4a4a56', '#0a0a10']);
      g.beginPath();
      g.ellipse(50, 22.5, 16, 3.6, 0, 0, Math.PI * 2);
      g.fill();
      const crown = g.createLinearGradient(40, 0, 60, 0);
      crown.addColorStop(0, '#5a5a68');
      crown.addColorStop(0.35, '#2a2a34');
      crown.addColorStop(1, '#08080c');
      g.fillStyle = crown;
      g.beginPath();
      g.moveTo(40, 22); g.lineTo(41, 4); g.lineTo(59, 4); g.lineTo(60, 22);
      g.closePath();
      g.fill();
      g.fillStyle = '#3c3c48';
      g.beginPath();
      g.ellipse(50, 4, 9, 1.8, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#c81e28';
      g.beginPath();
      g.moveTo(40.3, 16); g.lineTo(59.7, 16); g.lineTo(59.9, 20); g.lineTo(40.1, 20);
      g.closePath();
      g.fill();
      // 冬青葉與果實
      g.fillStyle = '#2e9a4a';
      g.beginPath();
      g.ellipse(42.5, 16.5, 3.4, 1.4, -0.5, 0, Math.PI * 2);
      g.moveTo(49, 16);
      g.ellipse(46.5, 15.8, 3.4, 1.4, 0.4, 0, Math.PI * 2);
      g.fill();
      sphere(g, 44.3, 17.6, 1.2, ['#ff9a9a', '#e0262f', '#6e0a10']);
      sphere(g, 45.9, 18.2, 1.1, ['#ff9a9a', '#e0262f', '#6e0a10']);
      return;
    }
    const SNOW = ['#ffffff', '#eef3fb', '#a6b6d4'];
    const coal = ['#74747e', '#26262e', '#060608'];
    const contact = (x, y, rx, ry, [cx, cy, cr]) => {
      g.save();
      g.beginPath();
      g.arc(cx, cy, cr, 0, Math.PI * 2);
      g.clip();
      g.translate(x, y);
      g.scale(1, ry / rx);
      const grad = g.createRadialGradient(0, 0, 0, 0, 0, rx);
      grad.addColorStop(0, 'rgba(60, 80, 130, 0.45)');
      grad.addColorStop(1, 'rgba(60, 80, 130, 0)');
      g.fillStyle = grad;
      g.fillRect(-rx, -rx, rx * 2, rx * 2);
      g.restore();
    };
    const BOTTOM = [50, 101, 25];
    const MIDDLE = [50, 64, 18.5];
    const HEAD = [50, 34, 14];
    sphere(g, ...BOTTOM, SNOW);
    contact(50, 80, 18, 6, BOTTOM);
    sphere(g, ...MIDDLE, SNOW);
    contact(50, 47, 13, 4.5, MIDDLE);
    sphere(g, ...HEAD, SNOW);
    // 左手樹枝
    g.strokeStyle = '#5a3a1e';
    g.lineWidth = 2.3;
    g.beginPath();
    g.moveTo(35, 62); g.lineTo(13, 50);
    g.stroke();
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(20, 54); g.lineTo(14, 44);
    g.moveTo(17, 52); g.lineTo(9, 53);
    g.stroke();
    // 煤炭鈕扣
    [[48, 56], [47.8, 64], [48.2, 72]].forEach(([x, y]) => sphere(g, x, y, 2, coal));
    // 圍巾：垂下的尾端在後、繞頸一圈在前
    const scarf = linear(g, 36, 0, 66, 0, ['#ff5a60', '#8e0c16']);
    g.fillStyle = scarf;
    const tail = new Path2D();
    tail.moveTo(55, 48); tail.lineTo(62.5, 47); tail.lineTo(67.5, 67); tail.lineTo(60, 68.5);
    tail.closePath();
    g.fill(tail);
    g.save();
    g.clip(tail);
    g.fillStyle = 'rgba(255, 255, 255, 0.85)';
    g.fillRect(50, 55, 25, 2.4);
    g.fillRect(50, 60.5, 25, 2.4);
    g.restore();
    g.strokeStyle = '#c81e28';
    g.lineWidth = 0.9;
    g.beginPath();
    [60.5, 62.5, 64.5, 66.5].forEach((x, i) => { g.moveTo(x, 68.2 - i * 0.35); g.lineTo(x + 0.3, 71); });
    g.stroke();
    g.fillStyle = scarf;
    g.beginPath();
    g.moveTo(36.5, 44);
    g.quadraticCurveTo(50, 51, 63.5, 44);
    g.lineTo(64, 49.5);
    g.quadraticCurveTo(50, 57, 36, 49.5);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(255, 140, 140, 0.45)';
    g.beginPath();
    g.ellipse(44, 47.5, 6, 1.2, 0.2, 0, Math.PI * 2);
    g.fill();
    // 臉：煤炭眼睛、紅蘿蔔鼻子、煤炭笑嘴、腮紅
    sphere(g, 44.5, 30, 1.9, coal);
    sphere(g, 53.5, 30, 1.9, coal);
    g.fillStyle = linear(g, 0, 32, 0, 38, ['#ffb24a', '#d85a0a']);
    g.beginPath();
    g.moveTo(49, 32.5);
    g.quadraticCurveTo(50.6, 35.2, 49, 38);
    g.lineTo(35, 36.6);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(150, 60, 0, 0.5)';
    g.lineWidth = 0.5;
    g.beginPath();
    g.moveTo(45, 33.6); g.lineTo(45.4, 37.4);
    g.moveTo(41, 34.8); g.lineTo(41.3, 37);
    g.stroke();
    for (let i = 0; i < 5; i++) {
      sphere(g, 42 + i * 3, 40.5 + Math.sin((i / 4) * Math.PI) * 1.8, 0.9, coal);
    }
    g.fillStyle = 'rgba(255, 150, 170, 0.3)';
    g.beginPath();
    g.ellipse(40.5, 36, 3, 1.8, 0, 0, Math.PI * 2);
    g.moveTo(59.5, 35.5);
    g.ellipse(56.5, 35.5, 3, 1.8, 0, 0, Math.PI * 2);
    g.fill();
  };

  // 禮物盒（100×100 座標箱，底部 y=96）：斜投影立體方盒（正面、側面、頂面明暗不同）。
  // 盒身與蓋子分兩張貼圖，蓋子才能彈開；盒口內側畫暗色，打開時看得到
  const GIFT_STYLES = [
    { front: ['#f0545a', '#c4202a'], side: ['#9a1820', '#5e0a10'], top: ['#ff8a8c', '#ec5258'], ribbon: ['#fff0a0', '#f2bd38', '#a8740c'] },
    { front: ['#3fbf6e', '#1f8a48'], side: ['#18663a', '#0a3a1e'], top: ['#7ae09c', '#44c274'], ribbon: ['#ffb0b0', '#e0262f', '#8a0e14'] },
    { front: ['#5a8ef0', '#2f62c8'], side: ['#22468e', '#10265a'], top: ['#9ab8ff', '#6690ee'], ribbon: ['#ffffff', '#e2e8f2', '#9aa4b8'] },
    { front: ['#ffd25e', '#e8a524'], side: ['#b0740e', '#6e4404'], top: ['#ffe9a0', '#ffd25e'], ribbon: ['#ffb0b0', '#d81e2a', '#7a0a10'] },
  ];
  const GIFT_LID = [50, 34];  // 蓋子中心（彈開時的轉軸）
  const paintGift = (g, st, part) => {
    const quad = (pts, fill) => {
      g.fillStyle = fill;
      g.beginPath();
      g.moveTo(...pts[0]);
      pts.slice(1).forEach(p => g.lineTo(...p));
      g.closePath();
      g.fill();
    };
    const [r0, r1, r2] = st.ribbon;
    if (part === 'body') {
      const F = (u, v) => [8 + 60 * u, 42 + 54 * v];           // 正面
      const T = (u, d) => [8 + 60 * u + 24 * d, 42 - 16 * d];  // 盒口（d：往後的深度）
      const S = (d, v) => [68 + 24 * d, 42 - 16 * d + 54 * v]; // 側面
      quad([F(0, 0), F(1, 0), F(1, 1), F(0, 1)], linear(g, 8, 42, 68, 96, st.front));
      quad([S(0, 0), S(1, 0), S(1, 1), S(0, 1)], linear(g, 68, 40, 92, 90, st.side));
      quad([T(0, 0), T(1, 0), T(1, 1), T(0, 1)], linear(g, 0, 42, 0, 26, ['#160608', st.side[1]]));
      quad([F(0.43, 0), F(0.57, 0), F(0.57, 1), F(0.43, 1)], linear(g, 0, 42, 0, 96, [r0, r1]));
      quad([S(0.4, 0), S(0.6, 0), S(0.6, 1), S(0.4, 1)], linear(g, 0, 34, 0, 88, [r1, r2]));
      g.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      g.lineWidth = 0.9;
      g.beginPath();
      g.moveTo(...F(1, 0)); g.lineTo(...F(1, 1));
      g.stroke();
      return;
    }
    // 蓋子：比盒身略寬、往下蓋住盒口一截，頂面十字緞帶與蝴蝶結
    const F = (u, v) => [6 + 64 * u, 40 + 13 * v];
    const T = (u, d) => [6 + 64 * u + 24 * d, 40 - 16 * d];
    const S = (d, v) => [70 + 24 * d, 40 - 16 * d + 13 * v];
    quad([F(0, 0), F(1, 0), F(1, 1), F(0, 1)], linear(g, 6, 40, 70, 53, st.front));
    quad([S(0, 0), S(1, 0), S(1, 1), S(0, 1)], linear(g, 70, 38, 94, 40, st.side));
    quad([T(0, 0), T(1, 0), T(1, 1), T(0, 1)], linear(g, 6, 40, 94, 24, st.top));
    quad([F(0.434, 0), F(0.566, 0), F(0.566, 1), F(0.434, 1)], r1);
    quad([S(0.4, 0), S(0.6, 0), S(0.6, 1), S(0.4, 1)], r2);
    quad([T(0.434, 0), T(0.566, 0), T(0.566, 1), T(0.434, 1)], r0);
    quad([T(0, 0.4), T(1, 0.4), T(1, 0.6), T(0, 0.6)], r0);
    // 稜線反光與蓋子下緣
    g.lineWidth = 0.9;
    g.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    g.beginPath();
    g.moveTo(...F(0, 0)); g.lineTo(...F(1, 0)); g.lineTo(...T(1, 1));
    g.stroke();
    g.strokeStyle = 'rgba(0, 0, 0, 0.28)';
    g.beginPath();
    g.moveTo(...F(0, 1)); g.lineTo(...F(1, 1)); g.lineTo(...S(1, 1));
    g.stroke();
    // 蝴蝶結：兩個圈＋垂帶＋結
    const [bx, by] = T(0.5, 0.5);
    g.fillStyle = r1;
    g.beginPath();
    g.moveTo(bx - 1, by);
    g.lineTo(bx - 9, by + 9); g.lineTo(bx - 6, by + 8); g.lineTo(bx - 5.5, by + 11);
    g.lineTo(bx + 1, by + 1);
    g.moveTo(bx + 1, by);
    g.lineTo(bx + 10, by + 7); g.lineTo(bx + 7, by + 7.5); g.lineTo(bx + 7.5, by + 10.5);
    g.lineTo(bx - 1, by + 1);
    g.fill();
    [-1, 1].forEach((side) => {
      g.fillStyle = linear(g, bx, by - 14, bx, by, [r0, r1]);
      g.beginPath();
      g.ellipse(bx + side * 8, by - 6, 9, 5.5, -side * 0.5, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = r2;
      g.beginPath();
      g.ellipse(bx + side * 7, by - 5.5, 4.5, 2.2, -side * 0.5, 0, Math.PI * 2);
      g.fill();
    });
    sphere(g, bx, by - 1.5, 3.6, st.ribbon);
  };

  // 拐杖糖（100×100）：禮物跳出的小驚喜之一
  const paintCane = (g) => {
    const p = new Path2D();
    p.moveTo(60, 94);
    p.lineTo(60, 32);
    p.arc(45, 32, 15, 0, Math.PI, true);
    p.lineTo(30, 42);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.lineWidth = 13;
    g.strokeStyle = '#f6f8fc';
    g.stroke(p);
    g.save();
    g.setLineDash([7, 7]);
    g.lineCap = 'butt';
    g.strokeStyle = '#e0262f';
    g.stroke(p);
    g.restore();
    // 立體：右下暗面、左上高光
    g.lineWidth = 4;
    g.strokeStyle = 'rgba(60, 0, 10, 0.2)';
    g.save();
    g.translate(3.5, 1);
    g.stroke(p);
    g.restore();
    g.lineWidth = 2.4;
    g.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    g.save();
    g.translate(-3, -1);
    g.stroke(p);
    g.restore();
  };

  // 雪球與砸在鏡頭上的雪（100×100）：不規則雪團＋往下流的雪痕＋四散的小雪塊
  const paintSnowball = (g) => {
    sphere(g, 50, 50, 46, ['#ffffff', '#eef3fb', '#9fb0d0']);
    g.fillStyle = 'rgba(150, 170, 210, 0.35)';
    [[62, 58, 5], [40, 66, 4], [58, 36, 3.5], [70, 46, 3]].forEach(([x, y, r]) => {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    });
  };
  const paintSplat = (g, k) => {
    const lobes = 14;
    const pts = Array.from({ length: lobes }, (_, i) => {
      const a = (i / lobes) * Math.PI * 2;
      const r = 27 + 6 * Math.sin(i * 2.7) + 4 * Math.cos(i * 4.3);
      return [50 + Math.cos(a) * r, 46 + Math.sin(a) * r * 0.92];
    });
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const blob = new Path2D();
    blob.moveTo(...mid(pts[lobes - 1], pts[0]));
    pts.forEach((p, i) => blob.quadraticCurveTo(...p, ...mid(p, pts[(i + 1) % lobes])));
    blob.closePath();
    const shapes = [blob];
    [[37, 6, 20], [49, 7.5, 30], [61, 5.5, 17], [69, 4.5, 11]].forEach(([x, wd, len]) => {
      const d = new Path2D();
      d.moveTo(x - wd / 2, 58);
      d.lineTo(x - wd / 2, 58 + len);
      d.arc(x, 58 + len, wd / 2, Math.PI, 0, true);
      d.lineTo(x + wd / 2, 58);
      d.closePath();
      shapes.push(d);
    });
    [[14, 30, 3.5], [86, 38, 4], [20, 72, 3], [84, 70, 2.6], [30, 10, 2.8], [74, 12, 3.2], [8, 52, 2.2], [93, 55, 2]].forEach(([x, y, r]) => {
      const c = new Path2D();
      c.arc(x, y, r, 0, Math.PI * 2);
      shapes.push(c);
    });
    // 先畫一圈陰影（形狀放箱外、陰影投回原位）把雪和底下的頁面分開，再畫雪
    g.save();
    g.shadowColor = 'rgba(20, 32, 70, 0.4)';
    g.shadowBlur = 3 * k;
    g.shadowOffsetX = 200 * k;
    g.shadowOffsetY = 1 * k;
    g.translate(-200, 0);
    g.fillStyle = '#000';
    shapes.forEach(s => g.fill(s));
    g.restore();
    const fill = g.createRadialGradient(42, 36, 4, 50, 50, 52);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.5, '#f2f6fd');
    fill.addColorStop(1, '#c4d2ea');
    g.fillStyle = fill;
    shapes.forEach(s => g.fill(s));
    g.fillStyle = 'rgba(150, 170, 210, 0.3)';
    [[58, 54, 6], [40, 52, 4], [62, 38, 3.5], [47, 62, 3]].forEach(([x, y, r]) => {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    });
    g.fillStyle = 'rgba(255, 255, 255, 0.9)';
    g.beginPath();
    g.ellipse(40, 33, 9, 5, -0.5, 0, Math.PI * 2);
    g.fill();
  };

  // 雪橇（100×80 座標箱，朝左；中心約在 50,40）：聖誕老人坐在紅色雪橇上，身後一袋禮物。
  // wave：-1＝握著韁繩；0、1＝揮手的兩格
  const SLEIGH_HAND = [45, 33]; // 握韁繩的手
  const SLEIGH_HOOK = [21, 33]; // 揮手時韁繩改從車頭拉出
  const paintSleigh = (g, wave) => {
    // 禮物袋（最後方），袋口露出兩個小禮盒
    [[79.5, 11, 7, 6, -0.25, '#3fae5f'], [86.5, 9.5, 6, 7, 0.2, '#e8464d']].forEach(([x, y, bw, bh, rot, c]) => {
      g.save();
      g.translate(x, y);
      g.rotate(rot);
      g.fillStyle = c;
      g.fillRect(-bw / 2, -bh / 2, bw, bh);
      g.fillStyle = '#ffd56a';
      g.fillRect(-0.8, -bh / 2, 1.6, bh);
      g.restore();
    });
    const sack = g.createRadialGradient(79, 18, 1, 84, 26, 17);
    sack.addColorStop(0, '#c89a62');
    sack.addColorStop(0.6, '#8e6234');
    sack.addColorStop(1, '#4e3216');
    g.fillStyle = sack;
    g.beginPath();
    g.moveTo(73, 40);
    g.bezierCurveTo(68, 26, 72, 15, 78, 13);
    g.lineTo(91, 13);
    g.bezierCurveTo(97, 18, 98, 30, 93, 40);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(60, 36, 14, 0.5)';
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(80, 15); g.quadraticCurveTo(78, 26, 80, 36);
    g.stroke();
    // 聖誕老人：紅袍身體＋白毛邊＋黑腰帶
    const coat = g.createRadialGradient(58, 25, 1, 64, 33, 15);
    coat.addColorStop(0, '#ff6a6a');
    coat.addColorStop(0.5, '#d01c26');
    coat.addColorStop(1, '#6a0810');
    g.fillStyle = coat;
    g.beginPath();
    g.ellipse(64, 33, 11, 13, 0, 0, Math.PI * 2);
    g.fill();
    g.save();
    g.clip();
    g.fillStyle = '#f2f4fa';
    g.fillRect(53, 20, 3.2, 30);
    g.fillStyle = '#1a1214';
    g.fillRect(50, 37, 30, 3.4);
    g.strokeStyle = '#f2c14e';
    g.lineWidth = 0.9;
    g.strokeRect(56.5, 36.6, 4, 4.2);
    g.restore();
    // 頭、鬍子、鼻子、眼睛
    sphere(g, 57, 15, 5.6, ['#ffe6d2', '#f6c4a2', '#c98a6a']);
    const beard = g.createRadialGradient(54, 19, 1, 57, 23, 9);
    beard.addColorStop(0, '#ffffff');
    beard.addColorStop(0.6, '#eef1f7');
    beard.addColorStop(1, '#b4bccf');
    g.fillStyle = beard;
    g.beginPath();
    [[53.5, 19.5, 3.6], [57, 21.5, 4.6], [61, 20, 3.6], [55, 25, 3.8], [59.5, 25.5, 3.6], [57, 28.5, 3]].forEach(([x, y, r]) => {
      g.moveTo(x + r, y);
      g.arc(x, y, r, 0, Math.PI * 2);
    });
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.ellipse(52.6, 18.2, 2.6, 1.5, 0.25, 0, Math.PI * 2);
    g.moveTo(58.4, 18.6);
    g.ellipse(55.8, 18.6, 2.6, 1.5, -0.2, 0, Math.PI * 2);
    g.fill();
    sphere(g, 52, 16.2, 1.7, ['#ffd0c8', '#f08a86', '#b8504c']);
    g.fillStyle = 'rgba(255, 120, 120, 0.35)';
    g.beginPath();
    g.arc(57, 16.8, 1.6, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#2a1a14';
    g.lineWidth = 0.8;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(54.4, 13.8, 1.1, Math.PI * 1.1, Math.PI * 1.9);
    g.stroke();
    // 帽子：紅色帽身往後垂、白色毛邊與毛球
    const hat = linear(g, 52, 2, 76, 10, ['#ff4a50', '#8a0a12']);
    g.fillStyle = hat;
    g.beginPath();
    g.moveTo(51.5, 11);
    g.bezierCurveTo(52, 3.5, 60, 1, 68, 2.5);
    g.bezierCurveTo(73, 3.5, 76, 6.5, 77, 10);
    g.bezierCurveTo(73, 8.5, 67, 9, 63, 11);
    g.closePath();
    g.fill();
    g.strokeStyle = '#f2f4fa';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(51.5, 11.2);
    g.quadraticCurveTo(57, 9.6, 63, 10.6);
    g.stroke();
    sphere(g, 77, 10.5, 3, ['#ffffff', '#eef1f7', '#a8b2c8']);
    // 手臂：握韁繩往前伸，或手肘不動、前臂左右擺著揮手
    g.lineJoin = 'round';
    if (wave < 0) {
      g.strokeStyle = '#b8141e';
      g.lineWidth = 5.4;
      g.beginPath();
      g.moveTo(61, 26);
      g.quadraticCurveTo(54, 33, 47.5, 32.5);
      g.stroke();
      g.strokeStyle = 'rgba(255, 120, 120, 0.5)';
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(60, 24.4);
      g.quadraticCurveTo(54, 30.6, 48, 30.6);
      g.stroke();
      g.strokeStyle = '#f2f4fa';
      g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(48.6, 29.8);
      g.lineTo(48.3, 35);
      g.stroke();
      sphere(g, ...SLEIGH_HAND, 2.6, ['#5a4a40', '#2a1c14', '#0e0806']);
    } else {
      const a = wave ? -0.35 : -0.8; // 前臂偏離垂直的角度
      const [ex, ey] = [51, 26];
      const hx = ex + Math.sin(a) * 12;
      const hy = ey - Math.cos(a) * 12;
      g.strokeStyle = '#b8141e';
      g.lineWidth = 5.4;
      g.beginPath();
      g.moveTo(61, 26);
      g.quadraticCurveTo(55, 27.5, ex, ey);
      g.lineTo(hx, hy);
      g.stroke();
      g.strokeStyle = 'rgba(255, 120, 120, 0.5)';
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(60, 24.6);
      g.quadraticCurveTo(55, 26, ex - 0.6, ey - 1.4);
      g.stroke();
      const [cx, cy] = [ex + (hx - ex) * 0.8, ey + (hy - ey) * 0.8];
      const [nx, ny] = [Math.cos(a) * 2.6, Math.sin(a) * 2.6];
      g.strokeStyle = '#f2f4fa';
      g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(cx - nx, cy - ny);
      g.lineTo(cx + nx, cy + ny);
      g.stroke();
      sphere(g, hx, hy, 2.6, ['#5a4a40', '#2a1c14', '#0e0806']);
    }
    // 雪橇車身（前端捲起）：紅色漸層＋左上受光＋金邊
    const body = new Path2D();
    body.moveTo(84, 27);
    body.bezierCurveTo(92, 27, 95, 44, 89, 57);
    body.lineTo(32, 59);
    body.bezierCurveTo(20, 59, 13, 52, 11, 43);
    body.bezierCurveTo(9.5, 35, 14, 29.5, 20, 30.5);
    body.bezierCurveTo(25.5, 31.5, 25.5, 38.5, 20.5, 38.5);
    body.bezierCurveTo(26, 42.5, 33, 43.5, 40, 42);
    body.lineTo(74, 42);
    body.bezierCurveTo(78, 41, 80, 34, 82, 29);
    body.closePath();
    const red = g.createLinearGradient(0, 27, 0, 59);
    red.addColorStop(0, '#ff5a5f');
    red.addColorStop(0.45, '#d41a24');
    red.addColorStop(1, '#6e0a10');
    g.fillStyle = red;
    g.fill(body);
    g.save();
    g.clip(body);
    const lit = g.createRadialGradient(34, 38, 2, 50, 46, 50);
    lit.addColorStop(0, 'rgba(255, 220, 200, 0.3)');
    lit.addColorStop(0.5, 'rgba(255, 220, 200, 0)');
    lit.addColorStop(1, 'rgba(40, 0, 0, 0.35)');
    g.fillStyle = lit;
    g.fillRect(0, 0, 100, 80);
    g.restore();
    const gold = linear(g, 0, 28, 0, 60, ['#fff0a8', '#c8901c']);
    g.strokeStyle = gold;
    g.lineWidth = 1.5;
    g.stroke(body);
    g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(36, 53);
    g.bezierCurveTo(44, 46, 50, 56, 58, 51);
    g.bezierCurveTo(66, 46, 72, 55, 82, 49);
    g.moveTo(20.5, 38.5);
    g.quadraticCurveTo(15, 38, 16, 34.5);
    g.quadraticCurveTo(17.5, 32.5, 19.5, 34);
    g.stroke();
    // 滑板與支架（前端往上捲）
    const metal = g.createLinearGradient(0, 58, 0, 72);
    metal.addColorStop(0, '#fff1b0');
    metal.addColorStop(0.5, '#e0a82a');
    metal.addColorStop(1, '#8a5a08');
    g.strokeStyle = metal;
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(38, 58.5); g.lineTo(36, 68);
    g.moveTo(80, 57.5); g.lineTo(81, 68);
    g.stroke();
    g.beginPath();
    g.moveTo(93, 64);
    g.quadraticCurveTo(92, 69, 86, 69);
    g.lineTo(24, 69);
    g.bezierCurveTo(10, 69, 5, 62, 7, 56);
    g.bezierCurveTo(8.5, 52, 13, 52.5, 13, 56);
    g.stroke();
  };

  // 馴鹿（100×76 座標箱，朝左）：phase＝飛馳步伐（弧度）；far＝遠側那隻（整體較暗）
  const DEER_COLLAR = [34, 30];
  const DEER_NOSE = [13.2, 25.5];
  const paintDeer = (g, phase, far) => {
    const tone = far
      ? { body: ['#9c6e44', '#5e3a1e', '#2a1608'], legNear: '#3e2410', legFar: '#2a180a', antler: '#a89272', antlerFar: '#7a684c', muzzle: '#8a6a4a', belly: 'rgba(220, 196, 160, 0.3)' }
      : { body: ['#d6a068', '#8e5a32', '#4a2a12'], legNear: '#6a4224', legFar: '#4a2c16', antler: '#eedcb4', antlerFar: '#b8a27a', muzzle: '#c89a70', belly: 'rgba(250, 232, 200, 0.6)' };
    // 腳：大腿、小腿、蹄；角度以正下方為 0、往前（左）為正
    const leg = (hx, hy, a1, a2, color, w1) => {
      const kx = hx - Math.sin(a1) * 12;
      const ky = hy + Math.cos(a1) * 12;
      const fx = kx - Math.sin(a2) * 11;
      const fy = ky + Math.cos(a2) * 11;
      g.strokeStyle = color;
      g.lineCap = 'round';
      g.lineWidth = w1;
      g.beginPath(); g.moveTo(hx, hy); g.lineTo(kx, ky); g.stroke();
      g.lineWidth = w1 * 0.55;
      g.beginPath(); g.moveTo(kx, ky); g.lineTo(fx, fy); g.stroke();
      g.strokeStyle = '#1e120a';
      g.lineWidth = w1 * 0.6;
      g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx - Math.sin(a2) * 2.2, fy + Math.cos(a2) * 2.2); g.stroke();
    };
    // 飛馳步：前腳往前伸、後腳往後蹬，收腳時膝蓋彎折
    const legs = (ph, color) => {
      const s = Math.sin(ph);
      const fold = 0.5 - 0.5 * s;
      const fa = 0.55 + 0.55 * s;
      leg(37, 45, fa, fa - (0.25 + 1.1 * fold), color, 4.4);
      const ba = -(0.55 + 0.55 * s);
      leg(70, 45, ba, ba + (0.3 + 0.9 * fold), color, 5);
    };
    const antler = (x, y, color) => {
      g.strokeStyle = color;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.lineWidth = 1.7;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x - 1.5, y - 8, x + 4, y - 13);
      g.moveTo(x - 0.6, y - 5); g.lineTo(x - 5.5, y - 9.5);
      g.moveTo(x + 0.6, y - 9.5); g.lineTo(x - 2, y - 14.5);
      g.moveTo(x + 4, y - 13); g.lineTo(x + 8, y - 14);
      g.stroke();
    };
    legs(phase + 0.7, tone.legFar);
    g.fillStyle = '#f2ead8';
    g.beginPath();
    g.ellipse(77.5, 34.5, 3.2, 2, -0.5, 0, Math.PI * 2);
    g.fill();
    // 脖子與頭用同一組漸層（亮面在頭部左上）
    const head = g.createRadialGradient(21, 17, 1, 30, 26, 18);
    tone.body.forEach((c, i) => head.addColorStop(i / 2, c));
    g.fillStyle = head;
    g.beginPath();
    g.moveTo(32, 39);
    g.quadraticCurveTo(27, 31, 21, 23.5);
    g.lineTo(29, 18.5);
    g.quadraticCurveTo(35, 27, 45, 31);
    g.closePath();
    g.fill();
    const body = g.createRadialGradient(46, 33, 1, 54, 40, 26);
    tone.body.forEach((c, i) => body.addColorStop(i / 2, c));
    g.fillStyle = body;
    g.beginPath();
    g.ellipse(54, 40, 23, 10.5, -0.04, 0, Math.PI * 2);
    g.fill();
    g.save();
    g.clip();
    g.fillStyle = tone.belly;
    g.beginPath();
    g.ellipse(52, 49, 16, 4.5, 0, 0, Math.PI * 2);
    g.fill();
    // 胸背帶
    g.strokeStyle = '#c81e28';
    g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(43.5, 28); g.lineTo(41.5, 52);
    g.stroke();
    g.restore();
    antler(28.5, 17.5, tone.antlerFar);
    g.fillStyle = head;
    g.beginPath();
    g.ellipse(22.5, 22, 7.6, 5.2, -0.45, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = tone.muzzle;
    g.beginPath();
    g.ellipse(16.2, 25, 3.6, 2.9, -0.4, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = tone.body[1];
    g.beginPath();
    g.ellipse(29.5, 18.5, 3.8, 1.6, -0.5, 0, Math.PI * 2);
    g.fill();
    antler(25.5, 17, tone.antler);
    g.fillStyle = '#140a04';
    g.beginPath();
    g.arc(21, 20.5, 1.15, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255, 255, 255, 0.85)';
    g.beginPath();
    g.arc(20.6, 20.1, 0.4, 0, Math.PI * 2);
    g.fill();
    sphere(g, ...DEER_NOSE, 1.7, ['#6a5a50', '#2a1a12', '#0a0604']);
    // 項圈與金鈴
    g.strokeStyle = '#c81e28';
    g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(37, 27); g.lineTo(30.6, 33.2);
    g.stroke();
    sphere(g, 31.5, 34.6, 1.9, ['#fff2b0', '#e8b02a', '#7a5000']);
    legs(phase, tone.legNear);
  };

  // 魯道夫的紅鼻子（每幀疊在領頭馴鹿上，搭配紅光閃爍）
  const paintRedNose = g => sphere(g, 50, 50, 34, ['#ffc8b8', '#ff2a24', '#8a0000']);

  // 與視窗大小無關的貼圖只建一次
  const SLEIGH_SPRITE = 132;
  const DEER_SPRITE = 104;
  const deerFrames = Array.from({ length: DEER_FRAMES }, (_, i) =>
    makeSprite(DEER_SPRITE, DEER_SPRITE * 0.76, g => paintDeer(g, (i / DEER_FRAMES) * Math.PI * 2, false)));
  const deerFarFrames = Array.from({ length: DEER_FRAMES }, (_, i) =>
    makeSprite(DEER_SPRITE, DEER_SPRITE * 0.76, g => paintDeer(g, (i / DEER_FRAMES) * Math.PI * 2, true)));
  const sleighSprites = [-1, 0, 1].map(wave =>
    makeSprite(SLEIGH_SPRITE, SLEIGH_SPRITE * 0.8, g => paintSleigh(g, wave)));
  const noseSprite = makeSprite(12, 12, paintRedNose);
  const redGlow = makeSprite(48, 48, paintGlow('255, 50, 40'));
  const warmGlow = makeSprite(64, 64, paintGlow('255, 214, 140'));
  const coolGlow = makeSprite(64, 64, paintGlow('214, 228, 255'));
  const sparkleSprite = makeSprite(48, 48, paintSparkle);
  const bulbSprites = FX_COLORS.map(c => makeSprite(24, 24, paintBulb(c)));
  const flakeSprite = makeSprite(16, 16, paintFlake);
  const crystalSprite = makeSprite(40, 40, paintCrystal);
  const shadowSprite = makeSprite(100, 32, paintShadow);
  const snowballSprite = makeSprite(120, 120, paintSnowball);
  let splatSprite = null; // 第一次丟雪球才建（尺寸跟著畫面）

  // 雪橇隊伍：以雪橇中心為原點、單位＝雪橇寬，朝左飛（往右飛時整組翻面）
  // [x, y, 是否遠側, 步伐相位]：兩對並排馴鹿＋領頭的魯道夫，遠側那隻略高、較暗
  const TEAM_FAR = [[-0.9, -0.1, true, 0.15], [-1.62, -0.16, true, 0.55]];
  const TEAM_NEAR = [[-0.98, -0.03, false, 0], [-1.7, -0.09, false, 0.4]];
  const RUDOLPH = [-2.42, -0.15, false, 0.8];
  const SLEIGH_AT = [0, 0];
  const DEER_H = DEER_W * 0.76;
  const LOOP_LEN = Math.PI * 2 * LOOP_R - RUDOLPH[0]; // 翻圈時每個成員要走的路程

  let viewW = w;
  let viewH = h;
  let moon = {};
  let moonSprite = null;
  let moonFx = null;     // 流星雨／暴風雪
  let moonFlashAt = -9;
  let stars = [];
  let farFlakes = [];
  let nearFlakes = [];
  let stormFlakes = [];  // 暴風雪時額外加入的雪
  let snowClock = 0;     // 雪的下落時間（暴風雪時走得快）
  let windX = 0;         // 暴風雪把雪吹偏的累積位移
  let windDir = 1;
  let sleighPx = 0;      // 最近時的雪橇寬
  let passDur = 10;      // 雪橇正常速度飛越一趟的秒數
  let sky = {};
  let pass = null;       // 目前這一趟：{ p 進度 0~1, dir, speed, gallop, fx }
  let nextPassAt = 1.2;  // 進頁面約 1 秒後第一趟出發
  let passCount = 0;
  let teamNow = null;    // 這一幀的隊伍位置（畫圖與點擊共用）
  const teamPicks = {};
  const moonPicks = {};
  let treeSprite = null;
  let lightSprites = [];
  let starSprite = null;
  let snowmanSprite = null;
  let snowmanArm = null;
  let snowmanHat = null;
  let giftBodies = [];
  let giftLids = [];
  let caneSprite = null;
  let driftSprite = null;
  let drifts = [];
  let scene = [];        // 聖誕樹、雪人、禮物，依地面線由遠到近排序
  let tree = null;
  let snowman = null;
  let gifts = [];        // 由近到遠（點擊時前面的優先）
  let particles = [];
  let emitAcc = 0;
  let ball = null;       // 飛向鏡頭的雪球
  let splat = null;      // 砸在鏡頭上的雪
  let splatPx = 0;
  let nightGrad = null;
  let nightH = 0;
  let lastSec = 0;

  const makeFlakes = (count, zMax, width, height) => Array.from({ length: count }, () => {
    const z = rand(1, zMax);
    return {
      x: Math.random() * width,
      y: Math.random() * (height + 40),
      z,
      size: (7 / z) * rand(0.8, 1.2),
      fall: (64 / z) * rand(0.85, 1.15), // px/s
      swayAmp: (24 / z) * rand(0.6, 1.4),
      swaySpeed: rand(0.15, 0.4),
      phase: rand(0, Math.PI * 2),
      alpha: clamp(1.1 / z, 0.3, 0.9),
      crystal: z < 1.7 && Math.random() < 0.3,
      spin: rand(-0.8, 0.8),
    };
  });

  const layout = (width, height) => {
    viewW = width;
    viewH = height;
    const minSide = Math.min(width, height);
    moon = {
      x: width - clamp(width * 0.14, 80, 160),
      y: clamp(height * 0.16, 90, 150),
      r: clamp(minSide * 0.085, 36, 66),
    };
    const moonBox = (moon.r * 100) / MOON_R;
    moonSprite = makeSprite(moonBox, moonBox, paintMoon);

    const starCount = clamp(Math.round((width * height) / 40000), 12, 40);
    stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.55,
      r: rand(0.5, 1.3),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.4, 1.1),
    }));

    // 雪花深度 z：1 最近（大、快、亮）~ 4 最遠
    const flakeCount = clamp(Math.round((width * height) / 15000), 30, 100);
    const flakes = makeFlakes(flakeCount, 4, width, height);
    farFlakes = flakes.filter(f => f.z >= 1.8);
    nearFlakes = flakes.filter(f => f.z < 1.8);
    stormFlakes = makeFlakes(Math.round(flakeCount * 1.6), 2.6, width, height);

    sleighPx = clamp(minSide * 0.17, 64, 130);
    passDur = clamp(width / 120, 8, 14);
    sky = { y0: moon.y + moon.r * 0.2, y1: clamp(height * 0.3, moon.y + moon.r * 1.5, height * 0.42) };
    particles = [];
    ball = null;
    splat = null;
    splatPx = clamp(minSide * 0.55, 200, 420);
    splatSprite = null;

    // 場景：左下聖誕樹與禮物、右下雪人與禮物，各坐在一座雪丘上
    const T = clamp(minSide * 0.3, 110, 240);
    const S = clamp(minSide * 0.22, 84, 170);
    const G = clamp(minSide * 0.075, 26, 56);
    const treeW = (T * 100) / TREE_H;
    const starW = (STAR_SIZE * treeW * 1.6) / 100;
    treeSprite = makeSprite(treeW, T, paintTree);
    lightSprites = [0, 1, 2].map(j => makeSprite(treeW, T, (g, k) => paintLights(g, k, j)));
    starSprite = makeSprite(starW, starW, paintStar);
    const snowmanW = (S * 100) / SNOWMAN_H;
    snowmanSprite = makeSprite(snowmanW, S, g => paintSnowman(g, 'body'));
    snowmanArm = makeSprite(snowmanW, S, g => paintSnowman(g, 'arm'));
    snowmanHat = makeSprite(snowmanW, S, g => paintSnowman(g, 'hat'));
    giftBodies = GIFT_STYLES.map(st => makeSprite(G * 1.2, G * 1.2, g => paintGift(g, st, 'body')));
    giftLids = GIFT_STYLES.map(st => makeSprite(G * 1.2, G * 1.2, g => paintGift(g, st, 'lid')));
    caneSprite = makeSprite(G, G, paintCane);
    tree = { kind: 'tree', x: T * 0.4, ground: height - T * 0.07, size: T };
    snowman = { kind: 'snowman', x: width - S * 0.42, ground: height - S * 0.06, size: S };
    drifts = [
      { x: tree.x - T * 0.05, ground: tree.ground, w: T * 1.6 },
      { x: snowman.x - S * 0.2, ground: snowman.ground, w: S * 1.7 },
    ];
    driftSprite = makeSprite(Math.max(...drifts.map(d => d.w)), Math.max(...drifts.map(d => d.w)) * 0.32, paintDrift);
    gifts = [
      { kind: 'gift', x: T * 0.78, ground: height - T * 0.045, size: G * 1.15, style: 0, seed: 0.4 },
      { kind: 'gift', x: T * 1.02, ground: height - T * 0.075, size: G * 0.85, style: 1, seed: 2.2 },
      { kind: 'gift', x: T * 0.12, ground: height - T * 0.03, size: G * 0.95, style: 2, seed: 3.9 },
      { kind: 'gift', x: width - S * 1.0, ground: height - S * 0.03, size: G, style: 3, seed: 1.3 },
    ];
    scene = [tree, snowman, ...gifts].sort((a, b) => a.ground - b.ground);
    gifts.sort((a, b) => b.ground - a.ground);
  };

  // ── 粒子：星塵、煙火、落雪、彩帶、撒下的禮物、流星，共用一套更新 ──
  // layer：sky（夜空，雪橇後方）、front（場景前方）、top（最上層，砸在鏡頭的碎雪）
  const emit = (p) => {
    if (particles.length < MAX_PARTICLES) {
      particles.push({ life: 0, vx: 0, vy: 0, g: 0, drag: 0, rot: 0, vr: 0, ...p });
    }
  };

  const updateParticles = (dt) => {
    particles.forEach((p) => {
      p.life += dt;
      if (p.drag) {
        const k = Math.max(0, 1 - p.drag * dt);
        p.vx *= k;
        p.vy *= k;
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      // 撒下的禮物：落地彈一下就停住，之後淡出
      if (p.kind === 'gift' && p.y >= p.floor && p.vy > 0) {
        p.y = p.floor;
        if (p.landed === undefined) p.landed = p.life;
        if (p.bounces++ < 1) {
          p.vy *= -0.35;
          p.vx *= 0.5;
          p.vr *= 0.4;
        } else {
          p.vx = 0;
          p.vy = 0;
          p.vr = 0;
          p.g = 0;
        }
      }
    });
    particles = particles.filter(p => p.life < p.max && !(p.landed !== undefined && p.life - p.landed > 0.9));
  };

  const drawParticles = (ctx, layer) => {
    particles.forEach((p) => {
      if (p.layer !== layer) return;
      const k = p.life / p.max;
      if (p.kind === 'sparkle') {
        const d = p.size * (0.5 + 0.5 * (1 - k));
        ctx.globalAlpha = (1 - k) * (0.6 + 0.4 * Math.sin(p.tw + p.life * 14));
        ctx.drawImage(sparkleSprite.img, p.x - d / 2, p.y - d / 2, d, d);
      } else if (p.kind === 'spark') {
        // 煙火火花：拖著短尾巴，快熄滅時閃爍
        const a = k < 0.65 ? 1 : ((1 - k) / 0.35) * (0.55 + 0.45 * Math.sin(p.life * 40));
        ctx.globalAlpha = a * 0.7;
        ctx.strokeStyle = FX_COLORS[p.color];
        ctx.lineWidth = p.size * 0.22;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.07, p.y - p.vy * 0.07);
        ctx.stroke();
        ctx.globalAlpha = a;
        ctx.drawImage(bulbSprites[p.color].img, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.kind === 'flash') {
        const d = p.size * (0.6 + 0.4 * k);
        ctx.globalAlpha = 1 - k;
        ctx.drawImage(warmGlow.img, p.x - d / 2, p.y - d / 2, d, d);
      } else if (p.kind === 'snow') {
        ctx.globalAlpha = Math.min(1, (1 - k) * 3) * 0.95;
        ctx.drawImage(flakeSprite.img, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.kind === 'mist') {
        const d = p.size * (1 + k * 0.8);
        ctx.globalAlpha = 0.35 * (1 - k);
        ctx.drawImage(flakeSprite.img, p.x - d / 2, p.y - d / 2, d, d);
      } else if (p.kind === 'confetti') {
        // 彩帶片：邊轉邊翻面
        ctx.globalAlpha = Math.min(1, (1 - k) * 3);
        ctx.fillStyle = FX_COLORS[p.color];
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.life * p.flip));
        ctx.fillRect(-p.size / 2, -p.size * 0.3, p.size, p.size * 0.6);
        ctx.restore();
      } else if (p.kind === 'gift') {
        ctx.globalAlpha = p.landed === undefined ? 1 : clamp(1 - (p.life - p.landed - 0.4) / 0.5, 0, 1);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.drawImage(giftBodies[p.style].img, -p.size / 2, -p.size * 0.6, p.size, p.size);
        ctx.drawImage(giftLids[p.style].img, -p.size / 2, -p.size * 0.6, p.size, p.size);
        ctx.restore();
      } else if (p.kind === 'meteor') {
        const fade = Math.min(1, k * 5) * Math.min(1, (1 - k) * 3);
        const len = p.size * Math.min(1, k * 4);
        const v = Math.hypot(p.vx, p.vy);
        const tx = p.x - (p.vx / v) * len;
        const ty = p.y - (p.vy / v) * len;
        const grad = ctx.createLinearGradient(p.x, p.y, tx, ty);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(1, 'rgba(200, 220, 255, 0)');
        ctx.globalAlpha = fade;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.drawImage(bulbSprites[5].img, p.x - 6, p.y - 6, 12, 12);
      }
    });
    ctx.globalAlpha = 1;
  };

  // 深藍夜罩：上深下淺；確保表單與按鈕可讀
  const drawNight = (ctx, width, height) => {
    if (!nightGrad || nightH !== height) {
      nightGrad = ctx.createLinearGradient(0, 0, 0, height);
      nightGrad.addColorStop(0, 'rgba(6, 22, 80, 0.62)');
      nightGrad.addColorStop(0.5, 'rgba(12, 34, 96, 0.44)');
      nightGrad.addColorStop(1, 'rgba(26, 50, 108, 0.32)');
      nightH = height;
    }
    ctx.fillStyle = nightGrad;
    ctx.fillRect(0, 0, width, height);
  };

  const drawStars = (ctx, sec) => {
    stars.forEach((s) => {
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.phase + sec * s.speed));
      ctx.fillStyle = `rgba(235, 242, 255, ${(0.5 * tw).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawMoon = (ctx, sec) => {
    const box = moonSprite.w;
    // 叫雪橇出發時月亮亮一下
    const flash = clamp(1 - (sec - moonFlashAt) / 0.8, 0, 1);
    if (flash) {
      const d = moon.r * 6;
      ctx.globalAlpha = flash;
      ctx.drawImage(coolGlow.img, moon.x - d / 2, moon.y - d / 2, d, d);
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(moonSprite.img, moon.x - box / 2, moon.y - box / 2, box, box);
  };

  // 雪：下落用 snowClock、橫向加上風的累積位移（遠的雪被吹得少），暴風雪時才不會瞬移。
  // storm > 0 時順著風向把雪拉成斜線
  const drawFlakes = (ctx, list, sec, storm = 0) => {
    const alpha = storm || 1;
    list.forEach((f) => {
      const y = ((f.y + snowClock * f.fall) % (viewH + 40)) - 20;
      const x = f.x + windX / f.z + Math.sin(f.phase + sec * f.swaySpeed * Math.PI * 2) * f.swayAmp;
      const px = ((x % viewW) + viewW) % viewW;
      ctx.globalAlpha = f.alpha * alpha;
      if (storm) {
        const vx = (windDir * viewW * 0.35 * storm) / f.z;
        const vy = f.fall * (1 + 2.2 * storm);
        ctx.save();
        ctx.translate(px, y);
        ctx.rotate(Math.atan2(vy, vx));
        ctx.drawImage(flakeSprite.img, -f.size * (1 + 2.5 * storm) / 2, -f.size * 0.4, f.size * (1 + 2.5 * storm), f.size * 0.8);
        ctx.restore();
      } else if (f.crystal) {
        const d = f.size * 2.4;
        ctx.save();
        ctx.translate(px, y);
        ctx.rotate(f.phase + sec * f.spin);
        ctx.drawImage(crystalSprite.img, -d / 2, -d / 2, d, d);
        ctx.restore();
      } else {
        ctx.drawImage(flakeSprite.img, px - f.size / 2, y - f.size / 2, f.size, f.size);
      }
    });
    ctx.globalAlpha = 1;
  };

  // 暴風雪強度 0~1：快速變大 → 維持 → 慢慢停
  const blizzardMix = (sec) => {
    if (moonFx?.kind !== 'blizzard') return 0;
    const e = sec - moonFx.t0;
    return clamp(Math.min(e / 0.8, (MOON_FX.blizzard - e) / 1.4), 0, 1);
  };

  // ── 雪橇 ──
  const startPass = (dir) => {
    pass = { p: 0, dir, speed: 1, gallop: 0, fx: null };
    passCount += 1;
  };

  const updatePass = (dt, sec) => {
    if (!pass && sec >= nextPassAt) startPass(passCount % 2 === 0 ? 1 : -1);
    if (!pass) return;
    if (pass.fx && sec - pass.fx.t0 > TEAM_FX[pass.fx.kind]) pass.fx = null;
    const target = pass.fx?.kind === 'dash' ? 4.5 : 1;
    pass.speed += (target - pass.speed) * Math.min(1, dt * 3);
    pass.p += (dt / passDur) * pass.speed;
    pass.gallop += dt * 1.5 * (0.6 + 0.4 * pass.speed); // 衝刺時跑得更快
    if (pass.p >= 1) {
      pass = null;
      nextPassAt = sec + PASS_GAP;
    }
  };

  // 這一趟的位置：從月亮那側的遠方出發，往另一側飛近；每趟換方向
  const teamPose = (sec, width, height) => {
    if (!pass) return null;
    const { p, dir, fx } = pass;
    const scale = 0.5 + 0.5 * p;
    const x0 = width + 1.45 * sleighPx;
    const x1 = -0.7 * sleighPx;
    const x = x0 + (x1 - x0) * p;
    const dip = height * 0.05;
    const y = sky.y0 + (sky.y1 - sky.y0) * p - Math.sin(Math.PI * p) * dip;
    // 機頭依飛行方向微微上揚／下壓
    const dx = x1 - x0;
    const dy = sky.y1 - sky.y0 - Math.PI * Math.cos(Math.PI * p) * dip;
    const e = fx ? sec - fx.t0 : 0;
    return {
      x: dir > 0 ? x : width - x,
      y: y + Math.sin(sec * 1.7 + 1) * sleighPx * scale * 0.04,
      dir,
      scale,
      tilt: clamp(Math.atan2(-dy, -dx) * 0.6, -0.2, 0.2) + Math.sin(sec * 1.7) * 0.03,
      vx: (dir * dx * pass.speed) / passDur,
      gallop: pass.gallop,
      loop: fx?.kind === 'loop' ? LOOP_LEN * smooth(clamp(e / TEAM_FX.loop, 0, 1)) : null,
      loopUp: fx?.loopUp,
      wave: fx?.kind === 'drop',
      e,
    };
  };

  // 隊伍中每個成員的位置與角度。翻圈時依序沿同一個圓繞一圈：領頭的先進圈，
  // 整隊同時往後補回入圈點的位移，繞完剛好回到原位；上方空間不夠就往下翻
  const memberPose = (pose, [bx, by]) => {
    if (pose.loop === null) return { x: bx, y: by, a: 0 };
    const lam = pose.loop;
    const E = RUDOLPH[0];
    const d = lam - (bx - E);
    const up = pose.loopUp ? 1 : -1;
    let x = bx - lam;
    let y = 0;
    let a = 0;
    if (d >= Math.PI * 2 * LOOP_R) x = E - (d - Math.PI * 2 * LOOP_R);
    else if (d >= 0) {
      a = (up * d) / LOOP_R;
      x = E - LOOP_R * Math.sin(d / LOOP_R);
      y = -up * LOOP_R * (1 - Math.cos(d / LOOP_R));
    }
    return { x: x - (lam * E) / LOOP_LEN - by * Math.sin(a), y: y + by * Math.cos(a), a };
  };
  // 成員身上的點（成員座標，單位＝雪橇寬）→ 隊伍座標
  const memberPoint = (m, ox, oy) => [
    m.x + ox * Math.cos(m.a) - oy * Math.sin(m.a),
    m.y + ox * Math.sin(m.a) + oy * Math.cos(m.a),
  ];
  // 隊伍座標 → 螢幕座標
  const toScreen = (pose, [lx, ly]) => {
    const u = sleighPx * pose.scale;
    const c = Math.cos(pose.tilt);
    const s = Math.sin(pose.tilt);
    return [pose.x + pose.dir * u * (lx * c - ly * s), pose.y + u * (lx * s + ly * c)];
  };
  const gallopOf = (pose, off) => (pose.gallop + off) % 1;
  const bob = c => -Math.sin(c * Math.PI * 2) * 0.025; // 四腳騰空時身體最高
  const deerPose = (pose, d) => memberPose(pose, [d[0], d[1] + bob(gallopOf(pose, d[3]))]);

  const burst = (x, y, u) => {
    const main = Math.floor(Math.random() * LIGHT_COLORS.length);
    const n = 44;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(-0.08, 0.08);
      const sp = u * rand(2.8, 3.8);
      emit({
        kind: 'spark', layer: 'sky', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        g: u * 0.8, drag: 1.5, max: rand(1.2, 1.7), size: u * rand(0.12, 0.17), color: i % 4 === 0 ? 5 : main,
      });
    }
    emit({ kind: 'flash', layer: 'sky', x, y, max: 0.4, size: u * 2.4 });
  };

  const updateTeamFx = (dt, width, height) => {
    const pose = teamNow;
    if (!pose) {
      emitAcc = 0;
      return;
    }
    const { fx } = pass;
    const u = sleighPx * pose.scale;
    const sleigh = memberPose(pose, SLEIGH_AT);
    // 星塵（翻圈、衝刺時更多更久，畫出軌跡）
    emitAcc += dt * (fx?.kind === 'dash' ? 90 : fx?.kind === 'loop' ? 70 : 34);
    while (emitAcc >= 1) {
      emitAcc -= 1;
      const [x, y] = toScreen(pose, memberPoint(sleigh, rand(0.3, 0.48), rand(0.18, 0.3)));
      emit({
        kind: 'sparkle', layer: 'sky', x, y,
        vx: pose.dir * rand(4, 18), vy: rand(6, 22),
        max: fx?.kind === 'loop' ? rand(1.6, 2.2) : rand(0.8, 1.5),
        size: u * rand(0.1, 0.2), tw: rand(0, Math.PI * 2),
      });
    }
    if (fx?.kind === 'drop') {
      // 撒禮物：從禮物袋一個接一個拋出，帶著雪橇的速度往前飛、落到畫面底部
      while (fx.thrown < fx.count && pose.e >= 0.15 + fx.thrown * 0.18) {
        fx.thrown += 1;
        const [x, y] = toScreen(pose, memberPoint(sleigh, 0.34, -0.2));
        emit({
          kind: 'gift', layer: 'front', x, y,
          vx: pose.vx * 0.35 + rand(-40, 40), vy: -rand(60, 150), g: 520, vr: rand(-4, 4),
          max: 8, size: u * rand(0.24, 0.32), style: Math.floor(Math.random() * GIFT_STYLES.length),
          floor: height - rand(6, 40), bounces: 0,
        });
      }
    }
    if (fx?.kind === 'fireworks') {
      // 雪橇後上方炸開兩朵（限制在畫面內）
      while (fx.bursts < 2 && pose.e >= fx.bursts * 0.4) {
        fx.bursts += 1;
        const [x, y] = toScreen(pose, [1.3 + fx.bursts * 0.5, -0.9 - fx.bursts * 0.25]);
        burst(clamp(x, width * 0.12, width * 0.88), clamp(y, height * 0.16, height * 0.45), u);
      }
    }
  };

  const drawTeam = (ctx, pose, sec) => {
    const u = sleighPx * pose.scale; // 一個隊伍單位（雪橇寬）的像素
    const drawDeer = (d) => {
      const [, , far, off] = d;
      const m = deerPose(pose, d);
      const frames = far ? deerFarFrames : deerFrames;
      const s = far ? 0.94 : 1;
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.a);
      ctx.drawImage(frames[Math.floor(gallopOf(pose, off) * DEER_FRAMES)].img,
        -(DEER_W * s) / 2, -(DEER_H * s) / 2, DEER_W * s, DEER_H * s);
      ctx.restore();
    };
    const deerPoint = (d, [px, py]) =>
      memberPoint(deerPose(pose, d), ((px - 50) / 100) * DEER_W, ((py - 38) / 100) * DEER_W);
    const sleigh = memberPose(pose, SLEIGH_AT);
    ctx.save();
    ctx.translate(pose.x, pose.y);
    ctx.scale(pose.dir * u, u);
    ctx.rotate(pose.tilt);
    TEAM_FAR.forEach(drawDeer);
    ctx.save();
    ctx.translate(sleigh.x, sleigh.y);
    ctx.rotate(sleigh.a);
    ctx.drawImage(sleighSprites[pose.wave ? 1 + (Math.floor(sec * 6) % 2) : 0].img, -0.5, -0.4, 1, 0.8);
    ctx.restore();
    TEAM_NEAR.forEach(drawDeer);
    drawDeer(RUDOLPH);
    // 韁繩：從聖誕老人的手（揮手時從車頭）經過每隻近側馴鹿的項圈，每段略微下垂
    const [hx, hy] = pose.wave ? SLEIGH_HOOK : SLEIGH_HAND;
    const pts = [
      memberPoint(sleigh, (hx - 50) / 100, (hy - 40) / 100),
      ...[...TEAM_NEAR, RUDOLPH].map(d => deerPoint(d, DEER_COLLAR)),
    ];
    ctx.strokeStyle = 'rgba(240, 200, 110, 0.9)';
    ctx.lineWidth = Math.max(1, u * 0.012) / u;
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 0.03, x1, y1);
    }
    ctx.stroke();
    // 魯道夫的紅鼻子：一閃一閃的紅光
    const [nx, ny] = deerPoint(RUDOLPH, DEER_NOSE);
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(sec * 5);
    ctx.drawImage(redGlow.img, nx - 0.13, ny - 0.13, 0.26, 0.26);
    ctx.globalAlpha = 1;
    ctx.drawImage(noseSprite.img, nx - 0.026, ny - 0.026, 0.052, 0.052);
    ctx.restore();
  };

  const teamAt = (x, y) => {
    const pose = teamNow;
    if (!pose) return false;
    const u = sleighPx * pose.scale;
    const dx = ((x - pose.x) / u) * pose.dir;
    const dy = (y - pose.y) / u;
    const c = Math.cos(pose.tilt);
    const s = Math.sin(pose.tilt);
    const lx = dx * c + dy * s;
    const ly = -dx * s + dy * c;
    const pad = HIT_PAD / u;
    const reach = pose.loop === null ? 0 : LOOP_R * 2;
    const topY = pose.loopUp ? -0.45 - reach : -0.45;
    const bottomY = pose.loopUp ? 0.35 : 0.35 + reach;
    return lx >= -2.85 - pad && lx <= 0.55 + pad && ly >= topY - pad && ly <= bottomY + pad;
  };

  // ── 聖誕樹 ──
  const treePoint = (t, x, y) => {
    const unit = t.size / TREE_H;
    return [t.x + (x - 50) * unit, t.ground + (y - TREE_GROUND) * unit];
  };
  // 星星飛走的路線：先往上竄、再往畫面中間劃過去，越飛越快
  const meteorAt = (fx, e) => {
    const s = clamp(e / METEOR_FLIGHT, 0, 1) ** 1.6;
    const [x0, y0, cx, cy, x1, y1] = fx.path;
    return {
      x: (1 - s) ** 2 * x0 + 2 * (1 - s) * s * cx + s * s * x1,
      y: (1 - s) ** 2 * y0 + 2 * (1 - s) * s * cy + s * s * y1,
      dx: 2 * (1 - s) * (cx - x0) + 2 * s * (x1 - cx),
      dy: 2 * (1 - s) * (cy - y0) + 2 * s * (y1 - cy),
    };
  };

  const startTreeFx = (t, sec) => {
    const kind = pickFx(t, TREE_FX);
    t.fx = { kind, t0: sec, acc: 0 };
    const T = t.size;
    const [sx, sy] = treePoint(t, ...STAR);
    if (kind === 'show') {
      // 星星爆亮，往上噴出金色星光
      for (let i = 0; i < 26; i++) {
        const a = rand(-Math.PI, 0);
        const sp = T * rand(0.5, 1.1);
        emit({
          kind: 'sparkle', layer: 'front', x: sx, y: sy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          g: T * 0.6, drag: 1.4, max: rand(0.9, 1.5), size: T * rand(0.05, 0.09), tw: rand(0, Math.PI * 2),
        });
      }
    } else if (kind === 'shake') {
      // 樹梢積雪被抖落：沿每層底緣噴出雪粒，加幾團雪霧
      TIERS.forEach((tier) => {
        for (let j = 0; j < 14; j++) {
          const tx = 50 + rand(-1, 1) * tier[2];
          const [x, y] = treePoint(t, tx, tierEdgeY(tier, tx) - rand(0, 6));
          emit({
            kind: 'snow', layer: 'front', x, y, vx: rand(-0.25, 0.25) * T, vy: -rand(0, 0.25) * T,
            g: T * 0.9, drag: 1.2, max: rand(1.1, 1.9), size: T * rand(0.025, 0.05),
          });
        }
      });
      for (let j = 0; j < 7; j++) {
        const [x, y] = treePoint(t, 50 + rand(-35, 35), rand(50, 115));
        emit({
          kind: 'mist', layer: 'front', x, y, vx: rand(-0.1, 0.1) * T, vy: T * rand(0.02, 0.1),
          max: rand(1, 1.5), size: T * rand(0.18, 0.3),
        });
      }
    } else {
      t.fx.path = [sx, sy, sx + viewW * 0.08, sy - viewH * 0.55, Math.min(viewW * 0.8, sx + viewW * 0.55), viewH * 0.07];
    }
  };

  const drawTree = (ctx, t, sec, still) => {
    const fx = still ? null : t.fx;
    const e = fx ? sec - fx.t0 : 0;
    const T = t.size;
    const unit = T / TREE_H;
    const tw = 100 * unit;
    // 燈光照亮周圍＋地面接觸陰影
    const gs = T * 1.3;
    ctx.globalAlpha = 0.4;
    ctx.drawImage(warmGlow.img, t.x - gs / 2, t.ground - T * 0.45 - gs / 2, gs, gs);
    const sw = T * 0.62;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(shadowSprite.img, t.x - sw / 2, t.ground - sw * 0.16, sw, sw * 0.32);
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(t.x, t.ground);
    if (fx?.kind === 'shake' && e < 0.9) ctx.rotate(Math.sin(e * 28) * 0.06 * (1 - e / 0.9)); // 以樹幹為軸抖動
    const left = -tw / 2;
    const top = -TREE_GROUND * unit;
    ctx.drawImage(treeSprite.img, left, top, tw, T);
    if (fx?.kind === 'show') {
      // 燈光秀：跑馬燈快速流動、顏色輪轉
      const shift = Math.floor(e * 8);
      const bs = 16 * unit;
      treeLights.forEach((l, i) => {
        ctx.globalAlpha = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(e * 16 - i * 0.9));
        ctx.drawImage(bulbSprites[(i + shift) % LIGHT_COLORS.length].img,
          (l.x - 50) * unit - bs / 2, (l.y - TREE_GROUND) * unit - bs / 2, bs, bs);
      });
    } else {
      // 燈串三組輪流亮暗
      lightSprites.forEach((sp, j) => {
        ctx.globalAlpha = still ? 0.85 : 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(sec * 2.6 + j * 2.1));
        ctx.drawImage(sp.img, left, top, tw, T);
      });
    }
    // 樹頂星星：光暈脈動＋緩慢旋轉的星芒；燈光秀時爆亮，飛走後過一會兒長回來
    const grow = fx?.kind === 'meteor' ? (e < 3 ? 0 : easeOutBack(clamp((e - 3) / 0.6, 0, 1))) : 1;
    const boost = fx?.kind === 'show' ? Math.max(0, 1 - e / 1.2) : 0;
    if (grow > 0) {
      const sx = (STAR[0] - 50) * unit;
      const sy = (STAR[1] - TREE_GROUND) * unit;
      const pulse = still ? 0.8 : 0.7 + 0.3 * Math.sin(sec * 1.9);
      const gg = T * 0.36 * (1 + boost * 1.4) * grow;
      ctx.globalAlpha = Math.min(1, 0.6 * pulse + boost * 0.4);
      ctx.drawImage(warmGlow.img, sx - gg / 2, sy - gg / 2, gg, gg);
      ctx.globalAlpha = 1;
      const ss = STAR_SIZE * unit * 1.6 * grow;
      ctx.drawImage(starSprite.img, sx - ss / 2, sy - ss / 2, ss, ss);
      ctx.globalAlpha = pulse;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(still ? 0 : sec * 0.35);
      const fl = T * 0.26 * pulse * (1 + boost) * grow;
      ctx.drawImage(sparkleSprite.img, -fl / 2, -fl / 2, fl, fl);
      ctx.restore();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  };

  // 飛走中的樹頂星星：亮尾巴＋旋轉的星星，越飛越小
  const drawTreeMeteor = (ctx, sec) => {
    const fx = tree.fx;
    if (fx?.kind !== 'meteor') return;
    const e = sec - fx.t0;
    if (e >= METEOR_FLIGHT) return;
    const q = e / METEOR_FLIGHT;
    const { x, y, dx, dy } = meteorAt(fx, e);
    const unit = tree.size / TREE_H;
    const ss = STAR_SIZE * unit * 1.6 * (1 - 0.55 * q);
    const v = Math.hypot(dx, dy) || 1;
    const len = tree.size * (0.25 + 0.7 * q);
    const tx = x - (dx / v) * len;
    const ty = y - (dy / v) * len;
    const grad = ctx.createLinearGradient(x, y, tx, ty);
    grad.addColorStop(0, 'rgba(255, 244, 190, 0.9)');
    grad.addColorStop(1, 'rgba(255, 220, 120, 0)');
    ctx.globalAlpha = Math.min(1, (1 - q) * 4);
    ctx.strokeStyle = grad;
    ctx.lineCap = 'round';
    ctx.lineWidth = ss * 0.35;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    const gg = ss * 2.2;
    ctx.drawImage(warmGlow.img, x - gg / 2, y - gg / 2, gg, gg);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(e * 9);
    ctx.drawImage(starSprite.img, -ss / 2, -ss / 2, ss, ss);
    ctx.restore();
    ctx.globalAlpha = 1;
  };

  const treeAt = (x, y) => {
    const T = tree.size;
    const top = tree.ground - (T * (TREE_GROUND - 2)) / TREE_H;
    if (y < top - HIT_PAD || y > tree.ground + HIT_PAD) return false;
    const half = (clamp((y - top) / (T * 0.8), 0.08, 1) * T * 46) / TREE_H;
    return Math.abs(x - tree.x) <= half + HIT_PAD;
  };

  // ── 雪人 ──
  const snowmanPoint = (s, px, py, arm = 0) => {
    const [ax, ay] = SNOWMAN_SHOULDER;
    const c = Math.cos(arm);
    const n = Math.sin(arm);
    const x = ax + (px - ax) * c - (py - ay) * n;
    const y = ay + (px - ax) * n + (py - ay) * c;
    const unit = s.size / SNOWMAN_H;
    return [s.x + (x - 50) * unit, s.ground + (y - SNOWMAN_GROUND) * unit];
  };
  // 右手角度：揮手左右擺；丟雪球先往後拉再往前甩
  const armAngle = (fx, sec) => {
    if (!fx) return 0;
    const e = sec - fx.t0;
    if (fx.kind === 'wave') return e < 1.6 ? Math.sin(e * 13) * 0.42 * Math.min(1, (1.6 - e) * 3) : 0;
    if (fx.kind !== 'throw') return 0;
    if (e < 0.25) return 0.7 * smooth(e / 0.25);
    if (e < 0.4) return 0.7 - 1.6 * smooth((e - 0.25) / 0.15);
    if (e < 0.9) return -0.9 * (1 - smooth((e - 0.4) / 0.5));
    return 0;
  };
  // 開心跳之後的腮紅：變紅 → 維持 → 退回
  const blushMix = (s, sec) => {
    const e = sec - s.blushAt;
    if (!(e >= 0)) return 0;
    return clamp(Math.min(e / 0.15, (3 - e) / 0.5), 0, 1);
  };

  const drawSnowman = (ctx, s, sec, still) => {
    const S = s.size;
    const unit = S / SNOWMAN_H;
    const fx = still ? null : s.fx;
    const e = fx ? sec - fx.t0 : 0;
    let lift = 0;
    let squash = 0;
    if (fx?.kind === 'jump') {
      if (e < 0.6) lift = Math.sin((Math.PI * e) / 0.6) * S * 0.2;
      else if (e < 0.85) squash = Math.sin((Math.PI * (e - 0.6)) / 0.25) * 0.09;
    }
    const shrink = 1 - (lift / S) * 2;
    const sw = S * 0.72 * shrink;
    ctx.globalAlpha = 0.9 * shrink;
    ctx.drawImage(shadowSprite.img, s.x - sw / 2, s.ground - sw * 0.16, sw, sw * 0.32);
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(s.x, s.ground - lift);
    ctx.rotate(still ? 0 : Math.sin(sec * 0.9) * 0.035); // 以底部為支點微微搖晃
    ctx.scale(1 + squash, 1 - squash);
    const w = 100 * unit;
    const left = -w / 2;
    const top = -SNOWMAN_GROUND * unit;
    ctx.drawImage(snowmanSprite.img, left, top, w, S);
    const blush = still ? 0 : blushMix(s, sec);
    if (blush) {
      ctx.fillStyle = `rgba(255, 80, 110, ${(0.5 * blush).toFixed(3)})`;
      ctx.beginPath();
      SNOWMAN_CHEEKS.forEach(([cx, cy]) => {
        const x = (cx - 50) * unit;
        const y = (cy - SNOWMAN_GROUND) * unit;
        ctx.moveTo(x + 3.4 * unit, y);
        ctx.ellipse(x, y, 3.4 * unit, 2.1 * unit, 0, 0, Math.PI * 2);
      });
      ctx.fill();
    }
    // 右手（以肩為軸）；丟雪球出手前手上抓著一顆
    const [ax, ay] = SNOWMAN_SHOULDER;
    const pivotX = (ax - 50) * unit;
    const pivotY = (ay - SNOWMAN_GROUND) * unit;
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(armAngle(fx, sec));
    ctx.drawImage(snowmanArm.img, left - pivotX, top - pivotY, w, S);
    if (fx?.kind === 'throw' && e < THROW_AT) {
      const d = 7 * unit;
      ctx.drawImage(snowballSprite.img, (SNOWMAN_HAND[0] - ax) * unit - d / 2, (SNOWMAN_HAND[1] - ay) * unit - d / 2, d, d);
    }
    ctx.restore();
    // 帽子：揮手時彈起翻一圈再落回頭上
    let hatLift = 0;
    let hatRot = 0;
    if (fx?.kind === 'wave' && e > 0.15 && e < 1.05) {
      const q = (e - 0.15) / 0.9;
      hatLift = Math.sin(Math.PI * q) * S * 0.42;
      hatRot = Math.PI * 2 * smooth(q);
    }
    const hx = (SNOWMAN_HAT[0] - 50) * unit;
    const hy = (SNOWMAN_HAT[1] - SNOWMAN_GROUND) * unit;
    ctx.save();
    ctx.translate(hx, hy - hatLift);
    ctx.rotate(hatRot);
    ctx.drawImage(snowmanHat.img, left - hx, top - hy, w, S);
    ctx.restore();
    ctx.restore();
  };

  // 雪球朝鏡頭飛來：越來越大，砸中後碎雪貼在畫面上往下滑
  const drawBall = (ctx, sec) => {
    if (!ball) return;
    const q = clamp((sec - ball.t0) / BALL_FLIGHT, 0, 1);
    const x = ball.x0 + (ball.x1 - ball.x0) * q;
    const y = ball.y0 + (ball.y1 - ball.y0) * q - Math.sin(Math.PI * q) * viewH * 0.1;
    const d = ball.s0 + (ball.s1 - ball.s0) * q ** 2.2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ball.spin * q);
    ctx.drawImage(snowballSprite.img, -d / 2, -d / 2, d, d);
    ctx.restore();
  };

  const drawSplat = (ctx, sec) => {
    if (!splat) return;
    const e = sec - splat.t0;
    const d = splatPx * (e < 0.08 ? 0.7 + 0.3 * (e / 0.08) : 1);
    const slide = e > 0.15 ? (e - 0.15) ** 1.5 * splatPx * 0.12 : 0;
    ctx.globalAlpha = 0.96 * (e < SPLAT_HOLD ? 1 : clamp(1 - (e - SPLAT_HOLD) / SPLAT_FADE, 0, 1));
    ctx.save();
    ctx.translate(splat.x, splat.y + slide);
    ctx.rotate(splat.rot);
    ctx.scale(splat.flip, 1);
    ctx.drawImage(splatSprite.img, -d / 2, -d / 2, d, d);
    ctx.restore();
    ctx.globalAlpha = 1;
  };

  const snowmanAt = (x, y) => {
    const S = snowman.size;
    return Math.abs(x - snowman.x) <= S * 0.22 + HIT_PAD
      && y <= snowman.ground + HIT_PAD && y >= snowman.ground - S * 0.95 - HIT_PAD;
  };

  // ── 禮物 ──
  // 蓋子彈開的高度 0~1：彈開 → 浮著晃 → 蓋回
  const lidLift = (fx, e) => {
    const [hold, close] = fx.kind === 'open' ? [2.3, 2.6] : [2.05, 2.35];
    if (e < 0.22) return easeOut(e / 0.22);
    if (e < hold) return 1 + Math.sin((e - 0.22) * 5) * 0.06;
    if (e < close) return 1 - smooth((e - hold) / (close - hold));
    return 0;
  };
  // 小驚喜升起的程度：從盒裡彈出（帶回彈）→ 上下晃 → 縮回去
  const itemRise = (e) => {
    if (e < 0.12) return 0;
    if (e < 0.55) return easeOutBack((e - 0.12) / 0.43);
    if (e < 1.75) return 1;
    if (e < 2) return 1 - smooth((e - 1.75) / 0.25);
    return 0;
  };

  const drawGiftItem = (ctx, gift, e, top) => {
    const r = itemRise(e);
    if (r <= 0) return;
    const { size } = gift;
    const ih = size * 0.85 * (0.6 + 0.4 * Math.min(r, 1));
    const bottom = top + size * 0.4 + ih * (1 - r) + Math.sin(e * 6) * size * 0.03;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-size * 2, top - size * 3, size * 4, size * 3.42); // 只露出盒口以上
    ctx.clip();
    if (gift.fx.item === 0) {
      // 小雪人（戴帽）
      const sw = (ih * 100) / SNOWMAN_H;
      const sy = bottom - (ih * SNOWMAN_GROUND) / SNOWMAN_H;
      [snowmanSprite, snowmanArm, snowmanHat].forEach(sp => ctx.drawImage(sp.img, -sw / 2, sy, sw, ih));
    } else if (gift.fx.item === 1) {
      ctx.drawImage(caneSprite.img, -ih / 2, bottom - ih, ih, ih);
    } else {
      const ss = ih * 0.9;
      ctx.drawImage(warmGlow.img, -ss, bottom - ih * 0.5 - ss, ss * 2, ss * 2);
      ctx.drawImage(starSprite.img, -ss / 2, bottom - ih * 0.5 - ss / 2, ss, ss);
    }
    ctx.restore();
  };

  const drawGift = (ctx, gift, sec, still) => {
    const { x, ground, size, seed } = gift;
    const fx = still ? null : gift.fx;
    const e = fx ? sec - fx.t0 : 0;
    let lift = 0;
    let rot = 0;
    let flip = 0;
    let sx = 1;
    let sy = 1;
    if (!fx) {
      // 平常每隔幾秒輕跳一下，落地時壓扁回彈
      const q = still ? 9 : ((sec + seed * 3) % (5.5 + seed)) / 0.55;
      const hop = q < 1 ? Math.sin(q * Math.PI) : 0;
      const squash = q >= 1 && q < 1.4 ? Math.sin(((q - 1) / 0.4) * Math.PI) * 0.08 : 0;
      lift = hop * size * 0.22;
      rot = hop * 0.06 * (seed > 2 ? -1 : 1);
      sx = 1 - hop * 0.04 + squash;
      sy = 1 + hop * 0.06 - squash;
    } else if (fx.kind === 'flip') {
      // 大跳翻滾：高高跳起，繞盒子中心翻一圈
      const q = e / 0.9;
      if (q < 1) {
        lift = Math.sin(Math.PI * q) * size * 1.5;
        flip = Math.PI * 2 * smooth(q) * fx.side;
      } else {
        const squash = Math.sin(Math.PI * clamp((q - 1) / 0.28, 0, 1)) * 0.1;
        sx = 1 + squash;
        sy = 1 - squash;
      }
    }
    const shrink = 1 - clamp(lift / size, 0, 1) * 0.6;
    const sw = size * 0.95 * shrink;
    ctx.globalAlpha = 0.85 * shrink;
    ctx.drawImage(shadowSprite.img, x + size * 0.04 - sw / 2, ground - sw * 0.16, sw, sw * 0.32);
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(x, ground - lift);
    if (flip) {
      ctx.translate(0, -size * 0.5);
      ctx.rotate(flip);
      ctx.translate(0, size * 0.5);
    }
    ctx.rotate(rot);
    ctx.scale(sx, sy);
    const left = -size / 2;
    const top = -size * 0.96;
    ctx.drawImage(giftBodies[gift.style].img, left, top, size, size);
    if (fx?.kind === 'surprise') drawGiftItem(ctx, gift, e, top);
    const k = fx && fx.kind !== 'flip' ? lidLift(fx, e) : 0;
    if (k) {
      // 打開時蓋子往上彈；小驚喜時蓋子飛得更高更偏，讓出盒口
      const cx = left + (GIFT_LID[0] / 100) * size;
      const cy = top + (GIFT_LID[1] / 100) * size;
      const far = fx.kind === 'surprise';
      ctx.save();
      ctx.translate(cx + (far ? k * size * 0.55 * fx.side : 0), cy - k * size * (far ? 1.05 : 0.5));
      ctx.rotate(k * (far ? 0.8 : 0.4) * fx.side);
      ctx.drawImage(giftLids[gift.style].img, left - cx, top - cy, size, size);
      ctx.restore();
    } else {
      ctx.drawImage(giftLids[gift.style].img, left, top, size, size);
    }
    ctx.restore();
  };

  const giftAt = (x, y) => gifts.find(g => Math.abs(x - g.x) <= g.size * 0.46 + HIT_PAD
    && y <= g.ground + HIT_PAD && y >= g.ground - g.size * 0.78 - HIT_PAD);

  // ── 各圖案效果的時間軸：到點觸發（出手、噴彩帶、拖尾巴），播完清掉 ──
  const updateScene = (dt, sec) => {
    scene.forEach((o) => {
      if (o.fx && sec - o.fx.t0 > SCENE_FX[o.kind][o.fx.kind]) o.fx = null;
    });
    const minSide = Math.min(viewW, viewH);
    const tfx = tree.fx;
    if (tfx?.kind === 'meteor' && sec - tfx.t0 < METEOR_FLIGHT) {
      tfx.acc += dt * 60;
      while (tfx.acc >= 1) {
        tfx.acc -= 1;
        const { x, y } = meteorAt(tfx, sec - tfx.t0);
        emit({
          kind: 'sparkle', layer: 'front', x: x + rand(-4, 4), y: y + rand(-4, 4),
          vx: rand(-15, 15), vy: rand(5, 30), max: rand(0.5, 1), size: tree.size * rand(0.04, 0.08), tw: rand(0, Math.PI * 2),
        });
      }
    }
    const sfx = snowman.fx;
    if (sfx?.kind === 'throw' && !sfx.released && sec - sfx.t0 >= THROW_AT) {
      sfx.released = true;
      const [x0, y0] = snowmanPoint(snowman, ...SNOWMAN_HAND, armAngle(sfx, sec));
      if (!splatSprite) splatSprite = makeSprite(splatPx, splatPx, paintSplat);
      ball = {
        t0: sec, x0, y0, x1: viewW * rand(0.3, 0.65), y1: viewH * rand(0.28, 0.55),
        s0: snowman.size * 0.07, s1: splatPx * 0.45, spin: rand(-6, 6),
      };
    }
    if (ball && sec - ball.t0 >= BALL_FLIGHT) {
      // 砸中鏡頭：碎雪貼上、畫面一震、雪塊四濺
      splat = { t0: sec, x: ball.x1, y: ball.y1, rot: rand(-0.4, 0.4), flip: Math.random() < 0.5 ? -1 : 1 };
      for (let i = 0; i < 24; i++) {
        const a = rand(0, Math.PI * 2);
        const sp = minSide * rand(0.35, 0.9);
        emit({
          kind: 'snow', layer: 'top', x: ball.x1, y: ball.y1, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          g: minSide * 1.4, drag: 1.5, max: rand(0.6, 1.1), size: minSide * rand(0.015, 0.035),
        });
      }
      ball = null;
    }
    if (splat && sec - splat.t0 > SPLAT_HOLD + SPLAT_FADE) splat = null;
    // 禮物蓋子彈開的瞬間噴出彩帶（小驚喜只噴一點星光）
    gifts.forEach((gift) => {
      const { fx } = gift;
      if (!fx || fx.popped || fx.kind === 'flip' || sec - fx.t0 < 0.05) return;
      fx.popped = true;
      const oy = gift.ground - gift.size * 0.62;
      const n = fx.kind === 'open' ? 40 : 10;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + rand(-0.7, 0.7);
        const sp = gift.size * rand(3, 6);
        if (fx.kind === 'open' && i % 4) {
          emit({
            kind: 'confetti', layer: 'front', x: gift.x, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            g: gift.size * 6, drag: 1.8, max: rand(1.2, 2), size: gift.size * rand(0.07, 0.11),
            color: Math.floor(Math.random() * LIGHT_COLORS.length), rot: rand(0, Math.PI * 2), vr: rand(-10, 10), flip: rand(6, 14),
          });
        } else {
          emit({
            kind: 'sparkle', layer: 'front', x: gift.x, y: oy, vx: Math.cos(a) * sp * 0.6, vy: Math.sin(a) * sp * 0.6,
            g: gift.size * 2, drag: 1.6, max: rand(0.7, 1.2), size: gift.size * rand(0.2, 0.32), tw: rand(0, Math.PI * 2),
          });
        }
      }
    });
  };

  // ── 月亮：流星雨、暴風雪 ──
  const updateMoon = (dt, sec) => {
    if (moonFx && sec - moonFx.t0 > MOON_FX[moonFx.kind]) moonFx = null;
    const storm = blizzardMix(sec);
    snowClock += dt * (1 + 2.2 * storm);
    windX += dt * storm * windDir * viewW * 0.35;
    if (moonFx?.kind !== 'shower') return;
    const e = sec - moonFx.t0;
    const minSide = Math.min(viewW, viewH);
    while (moonFx.spawned < 11 && e >= moonFx.spawned * 0.22) {
      moonFx.spawned += 1;
      const a = Math.PI * (windDir > 0 ? 0.22 : 0.78) + rand(-0.06, 0.06); // 整陣往同一方向劃
      const sp = minSide * rand(0.9, 1.3);
      emit({
        kind: 'meteor', layer: 'sky', x: rand(0.05, 0.95) * viewW, y: rand(0, 0.3) * viewH,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, max: rand(0.5, 0.8), size: minSide * rand(0.12, 0.2),
      });
    }
  };

  const moonAt = (x, y) => (x - moon.x) ** 2 + (y - moon.y) ** 2 <= (moon.r + HIT_PAD) ** 2;

  const drawScene = (ctx, sec, still) => {
    drifts.forEach((d) => {
      ctx.drawImage(driftSprite.img, d.x - d.w / 2, d.ground - d.w * 0.15, d.w, d.w * 0.32);
    });
    scene.forEach((o) => {
      if (o.kind === 'tree') drawTree(ctx, o, sec, still);
      else if (o.kind === 'snowman') drawSnowman(ctx, o, sec, still);
      else drawGift(ctx, o, sec, still);
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
      updatePass(dt, sec);
      teamNow = teamPose(sec, width, height);
      updateTeamFx(dt, width, height);
      updateScene(dt, sec);
      updateMoon(dt, sec);
      updateParticles(dt);
      drawNight(ctx, width, height);
      // 雪球砸中鏡頭時畫面一震（貼在鏡頭上的雪不跟著震）
      const shake = splat ? clamp(1 - (sec - splat.t0) / 0.3, 0, 1) : 0;
      ctx.save();
      if (shake) ctx.translate(Math.sin(sec * 97) * 8 * shake, Math.cos(sec * 83) * 6 * shake);
      drawStars(ctx, sec);
      drawMoon(ctx, sec);
      drawFlakes(ctx, farFlakes, sec);
      drawParticles(ctx, 'sky');
      if (teamNow) drawTeam(ctx, teamNow, sec);
      drawScene(ctx, sec, false);
      drawParticles(ctx, 'front');
      drawTreeMeteor(ctx, sec);
      drawBall(ctx, sec);
      const storm = blizzardMix(sec);
      if (storm) {
        ctx.fillStyle = `rgba(230, 238, 255, ${(0.16 * storm).toFixed(3)})`;
        ctx.fillRect(0, 0, width, height);
        drawFlakes(ctx, stormFlakes, sec, storm);
      }
      drawFlakes(ctx, nearFlakes, sec);
      ctx.restore();
      drawSplat(ctx, sec);
      drawParticles(ctx, 'top');
    },
    hitTest(x, y) {
      return !!(giftAt(x, y) || snowmanAt(x, y) || treeAt(x, y) || teamAt(x, y) || moonAt(x, y));
    },
    tap(x, y) {
      const sec = lastSec;
      const gift = giftAt(x, y);
      if (gift) {
        if (!gift.fx) {
          gift.fx = { kind: pickFx(gift, GIFT_FX), t0: sec, side: Math.random() < 0.5 ? -1 : 1, item: Math.floor(Math.random() * 3) };
        }
        return true;
      }
      if (snowmanAt(x, y)) {
        if (!snowman.fx) {
          snowman.fx = { kind: pickFx(snowman, SNOWMAN_FX), t0: sec };
          if (snowman.fx.kind === 'jump') snowman.blushAt = sec;
        }
        return true;
      }
      if (treeAt(x, y)) {
        if (!tree.fx) startTreeFx(tree, sec);
        return true;
      }
      if (teamAt(x, y)) {
        if (!pass.fx) {
          pass.fx = {
            kind: pickFx(teamPicks, TEAM_FX), t0: sec, thrown: 0, count: 3 + Math.floor(Math.random() * 3), bursts: 0,
            loopUp: teamNow.y - sleighPx * teamNow.scale * (LOOP_R * 2 + 0.5) > 0,
          };
        }
        return true;
      }
      if (!moonAt(x, y)) return false;
      if (!pass) {
        // 雪橇不在：馬上從月亮那側出發
        startPass(1);
        moonFlashAt = sec;
      } else if (!moonFx) {
        moonFx = { kind: pickFx(moonPicks, MOON_FX), t0: sec, spawned: 0 };
        windDir = Math.random() < 0.5 ? -1 : 1;
      }
      return true;
    },
    // 減少動態：只畫靜態夜色、星空、滿月、雪景與聖誕樹
    drawStatic(ctx, width, height) {
      drawNight(ctx, width, height);
      drawStars(ctx, 0);
      drawMoon(ctx, 0);
      drawFlakes(ctx, farFlakes, 0);
      drawScene(ctx, 0, true);
      drawFlakes(ctx, nearFlakes, 0);
    },
  };
}

/* ── 飄雪：最簡單的特效，也是新特效的參考範本 ── */
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
  christmas: createChristmas,
  snow: createSnow,
};
