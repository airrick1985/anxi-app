const u={w:400,h:275};let t=null;function x(n,d={}){y(n,{...d,page:"A3 landscape",area:u,padding:10,align:"center"})}function y(n,{page:d,area:h,padding:r=0,align:f="center",title:g="",onError:c}={}){if(!n)return;t!=null&&t.parentNode&&t.parentNode.removeChild(t);const e=document.createElement("iframe");e.style.cssText="position:fixed;left:-10000px;top:0;width:1600px;height:1100px;border:0;",document.body.appendChild(e),t=e;const{w:m,h:l}=h,i=e.contentWindow,o=i.document;o.open(),o.write(`<!doctype html><html><head><meta charset="utf-8">
    <title>${g}</title>
    <style>
      @page { size: ${d}; margin: 0; }
      html, body { margin: 0; background: #fff; }
      body { box-sizing: content-box; padding: ${r}mm; width: ${m}mm; height: ${l}mm; display: flex; justify-content: center; align-items: ${f==="top"?"flex-start":"center"}; overflow: hidden; }
      img { width: ${m}mm; height: auto; max-height: ${l}mm; object-fit: contain; }
    </style></head>
    <body><img src="${n}"></body></html>`),o.close();const s=()=>{e.parentNode&&e.parentNode.removeChild(e),t===e&&(t=null)};i.addEventListener("afterprint",()=>setTimeout(s,0));const p=()=>setTimeout(()=>{i.focus(),i.print()},100),a=o.querySelector("img");a.complete&&a.naturalWidth?p():(a.onload=p,a.onerror=()=>{s(),c==null||c()})}export{x as a,y as p};
