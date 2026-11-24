// 全景圖 WebGL 繪製（不依賴外部套件）
// 整個畫面畫一個三角形，片段著色器依視角算出每個像素對應的全景圖座標：
// - 環景（sphere）：等距柱狀投影
// - 長條全景（strip）：貼在圓柱內側，範圍外顯示底色
// WebGL2 用 mipmap＋各向異性過濾；WebGL1 退回線性過濾。

const VERTEX = (gl2) => `${gl2 ? '#version 300 es\nin vec2 aPos;\nout vec2 vNdc;' : 'attribute vec2 aPos;\nvarying vec2 vNdc;'}
void main() {
  vNdc = aPos;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT = (gl2) => `${gl2 ? '#version 300 es' : ''}
precision highp float;
${gl2 ? 'in vec2 vNdc;\nout vec4 outColor;' : 'varying vec2 vNdc;'}
uniform sampler2D uTex;
uniform mat3 uRot;
uniform vec2 uTan;
uniform vec3 uStrip; // x：0 環景／1 長條；y：水平涵蓋角度；z：圓柱高度
uniform vec3 uBg;
const float PI = 3.141592653589793;
void main() {
  vec3 d = uRot * normalize(vec3(vNdc * uTan, -1.0));
  float lon = atan(d.x, -d.z);
  float lat = asin(clamp(d.y, -1.0, 1.0));
  float r = max(length(d.xz), 1e-5);
  vec2 uvSphere = vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);
  vec2 uvStrip = vec2(lon / uStrip.y + 0.5, 0.5 - (d.y / r) / uStrip.z);
  vec2 uv = mix(uvSphere, uvStrip, uStrip.x);
  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
${gl2 ? `
  // 經度在正後方由 1 跳回 0：改用平移半圈的座標算變化率，避免接縫出現一條模糊線
  float uAlt = fract(uv.x + 0.5);
  float dux = dFdx(uv.x);
  float duy = dFdy(uv.x);
  float duxAlt = dFdx(uAlt);
  float duyAlt = dFdy(uAlt);
  if (abs(duxAlt) < abs(dux)) dux = duxAlt;
  if (abs(duyAlt) < abs(duy)) duy = duyAlt;
  // 環景的天頂／地面橫向被拉長，變化率依緯度縮回來才不會糊成一片
  float k = mix(max(r, 0.02), 1.0, uStrip.x);
  vec4 color = textureGrad(uTex, uv, vec2(dux * k, dFdx(uv.y)), vec2(duy * k, dFdy(uv.y)));
  outColor = vec4(mix(uBg, color.rgb, inside), 1.0);` : `
  vec4 color = texture2D(uTex, clamp(uv, 0.0, 1.0));
  gl_FragColor = vec4(mix(uBg, color.rgb, inside), 1.0);`}
}`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`全景著色器編譯失敗：${log}`);
  }
  return shader;
}

/** 視角（弧度）→ 旋轉矩陣（列優先 3×3）：yaw 往右為正、pitch 往上為正 */
export function viewMatrix(yaw, pitch) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return [
    cy, -sy * sp, -sy * cp,
    0, cp, -sp,
    sy, cy * sp, cy * cp,
  ];
}

/** 裝置方向（DeviceOrientationEvent，角度）→ 相機旋轉矩陣（列優先 3×3）；相機朝螢幕背面 */
export function deviceMatrix(alphaDeg, betaDeg, gammaDeg, screenAngleDeg = 0) {
  const rad = Math.PI / 180;
  const x = (betaDeg || 0) * rad;
  const y = (alphaDeg || 0) * rad;
  const z = -(gammaDeg || 0) * rad;
  const c1 = Math.cos(x / 2);
  const c2 = Math.cos(y / 2);
  const c3 = Math.cos(z / 2);
  const s1 = Math.sin(x / 2);
  const s2 = Math.sin(y / 2);
  const s3 = Math.sin(z / 2);
  // 尤拉角（YXZ）→ 四元數
  let q = [
    s1 * c2 * c3 + c1 * s2 * s3,
    c1 * s2 * c3 - s1 * c2 * s3,
    c1 * c2 * s3 - s1 * s2 * c3,
    c1 * c2 * c3 + s1 * s2 * s3,
  ];
  const mul = (a, b) => [
    a[0] * b[3] + a[3] * b[0] + a[1] * b[2] - a[2] * b[1],
    a[1] * b[3] + a[3] * b[1] + a[2] * b[0] - a[0] * b[2],
    a[2] * b[3] + a[3] * b[2] + a[0] * b[1] - a[1] * b[0],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
  // 相機看向裝置背面（繞 X 軸 -90°），再依螢幕旋轉方向修正
  q = mul(q, [-Math.SQRT1_2, 0, 0, Math.SQRT1_2]);
  const half = (-(screenAngleDeg || 0) * rad) / 2;
  q = mul(q, [0, 0, Math.sin(half), Math.cos(half)]);
  const [qx, qy, qz, qw] = q;
  return [
    1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - qz * qw), 2 * (qx * qz + qy * qw),
    2 * (qx * qy + qz * qw), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - qx * qw),
    2 * (qx * qz - qy * qw), 2 * (qy * qz + qx * qw), 1 - 2 * (qx * qx + qy * qy),
  ];
}

/** 旋轉矩陣的視線方向 → { yaw, pitch } */
export function matrixHeading(m) {
  const fx = -m[2];
  const fy = -m[5];
  const fz = -m[8];
  return { yaw: Math.atan2(fx, -fz), pitch: Math.asin(Math.max(-1, Math.min(1, fy))) };
}

/** 繞垂直軸再轉 yaw（列優先 3×3） */
export function yawed(m, yaw) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [
    c * m[0] - s * m[6], c * m[1] - s * m[7], c * m[2] - s * m[8],
    m[3], m[4], m[5],
    s * m[0] + c * m[6], s * m[1] + c * m[7], s * m[2] + c * m[8],
  ];
}

export class PanoramaRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    const options = { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'default' };
    let gl = canvas.getContext('webgl2', options);
    this.gl2 = !!gl;
    if (!gl) gl = canvas.getContext('webgl', options) || canvas.getContext('experimental-webgl', options);
    if (!gl) throw new Error('此瀏覽器不支援全景瀏覽');
    this.gl = gl;
    this.texture = null;
    this.source = null;
    this.setup();
  }

  setup() {
    const { gl, gl2 } = this;
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX(gl2)));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT(gl2)));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`全景著色器連結失敗：${gl.getProgramInfoLog(program)}`);
    gl.useProgram(program);
    this.program = program;
    this.uniforms = {};
    ['uTex', 'uRot', 'uTan', 'uStrip', 'uBg'].forEach((name) => { this.uniforms[name] = gl.getUniformLocation(program, name); });

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(this.uniforms.uTex, 0);
    gl.uniform3f(this.uniforms.uBg, 0.07, 0.07, 0.08);
  }

  /** 貼圖寬度上限：手機／平板記憶體有限，取 4096 */
  maxTextureEdge() {
    const limit = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE) || 4096;
    const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    return Math.min(limit, coarse ? 4096 : 8192);
  }

  /** 載入全景圖（HTMLImageElement／ImageBitmap／Canvas）；wrap：左右相接 */
  setImage(source, { wrap = true } = {}) {
    const { gl, gl2 } = this;
    this.source = source;
    this.wrap = wrap;
    const width = source.naturalWidth || source.width;
    const height = source.naturalHeight || source.height;
    let upload = source;
    const maxEdge = this.maxTextureEdge();
    if (Math.max(width, height) > maxEdge) {
      const ratio = maxEdge / Math.max(width, height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
      upload = canvas;
    }
    if (this.texture) gl.deleteTexture(this.texture);
    this.texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, upload);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (gl2) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
      if (aniso) {
        const max = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1;
        gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max));
      }
    } else {
      // WebGL1 的非 2 次方貼圖不能重複也不能用 mipmap
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  }

  /** 依顯示大小調整畫布像素；回傳是否有變動 */
  resize(cssWidth, cssHeight, pixelRatio = 1) {
    const w = Math.max(1, Math.round(cssWidth * pixelRatio));
    const h = Math.max(1, Math.round(cssHeight * pixelRatio));
    if (this.canvas.width === w && this.canvas.height === h) return false;
    this.canvas.width = w;
    this.canvas.height = h;
    return true;
  }

  /**
   * @param {number[]} rot 列優先 3×3 旋轉矩陣
   * @param {number} tanX 水平半視角的正切
   * @param {number} tanY 垂直半視角的正切
   * @param {{angle:number,height:number}|null} strip 長條全景的圓柱幾何；環景傳 null
   */
  render(rot, tanX, tanY, strip = null) {
    const { gl, uniforms } = this;
    if (!this.texture || gl.isContextLost()) return;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // uniformMatrix3fv 需要欄優先
    gl.uniformMatrix3fv(uniforms.uRot, false, [rot[0], rot[3], rot[6], rot[1], rot[4], rot[7], rot[2], rot[5], rot[8]]);
    gl.uniform2f(uniforms.uTan, tanX, tanY);
    gl.uniform3f(uniforms.uStrip, strip ? 1 : 0, strip ? strip.angle : 1, strip ? strip.height : 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** 繪圖環境遺失後重建（貼圖從原圖重新上傳） */
  restore() {
    this.texture = null;
    this.setup();
    if (this.source) this.setImage(this.source, { wrap: this.wrap });
  }

  dispose() {
    const { gl } = this;
    if (this.texture) gl.deleteTexture(this.texture);
    if (this.program) gl.deleteProgram(this.program);
    this.texture = null;
    this.source = null;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
