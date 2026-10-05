/**
 * 列印預覽 iframe 共用腳本（報價單、公司借貸報價單）：
 * A4 頁面等比縮放到同時符合視窗寬與高（一頁完整可見，大螢幕放大），視窗大小改變時重算。
 * 以 transform 縮放（不重排，版面與列印一致）；body 高度改為縮放後高度，多頁時捲動不會出現空白區。
 * 須在頁面排版腳本之後執行（插入 window.onload 內）。
 */
export const PREVIEW_FIT_SCRIPT = `
  (function () {
    var MAX_UP = 2;
    var sheets = document.querySelectorAll('.sheet');
    if (!sheets.length) return;
    var wrap = document.getElementById('pages');
    if (!wrap) {
      wrap = document.createElement('div');
      sheets[0].parentNode.insertBefore(wrap, sheets[0]);
      Array.prototype.forEach.call(sheets, function (s) { wrap.appendChild(s); });
    }
    var root = document.documentElement, body = document.body;
    root.style.overflowX = 'hidden';
    root.style.overflowY = 'auto';
    body.style.overflow = 'hidden';
    wrap.style.display = 'flow-root'; // 頁面上下邊界留在容器內，一併縮放
    wrap.style.transformOrigin = 'top left';
    function fit() {
      var first = sheets[0];
      var cs = getComputedStyle(first);
      var w = first.offsetWidth + 16;
      var h = first.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
      var z = Math.min(root.clientWidth / w, (window.innerHeight - 1) / h, MAX_UP);
      wrap.style.width = (100 / z) + '%';
      wrap.style.transform = 'scale(' + z + ')';
      body.style.height = Math.ceil(wrap.offsetHeight * z) + 'px';
    }
    fit();
    var timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(fit, 80);
    });
  })();`;
