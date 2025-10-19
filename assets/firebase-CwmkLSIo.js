import{q as Vm}from"./vendor-cpyZX3vi.js";const Mm=()=>{};var Tu={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Rd={NODE_ADMIN:!1,SDK_VERSION:"${JSCORE_VERSION}"};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const O=function(n,e){if(!n)throw rs(e)},rs=function(n){return new Error("Firebase Database ("+Rd.SDK_VERSION+") INTERNAL ASSERT FAILED: "+n)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Sd=function(n){const e=[];let t=0;for(let s=0;s<n.length;s++){let r=n.charCodeAt(s);r<128?e[t++]=r:r<2048?(e[t++]=r>>6|192,e[t++]=r&63|128):(r&64512)===55296&&s+1<n.length&&(n.charCodeAt(s+1)&64512)===56320?(r=65536+((r&1023)<<10)+(n.charCodeAt(++s)&1023),e[t++]=r>>18|240,e[t++]=r>>12&63|128,e[t++]=r>>6&63|128,e[t++]=r&63|128):(e[t++]=r>>12|224,e[t++]=r>>6&63|128,e[t++]=r&63|128)}return e},Lm=function(n){const e=[];let t=0,s=0;for(;t<n.length;){const r=n[t++];if(r<128)e[s++]=String.fromCharCode(r);else if(r>191&&r<224){const i=n[t++];e[s++]=String.fromCharCode((r&31)<<6|i&63)}else if(r>239&&r<365){const i=n[t++],o=n[t++],c=n[t++],l=((r&7)<<18|(i&63)<<12|(o&63)<<6|c&63)-65536;e[s++]=String.fromCharCode(55296+(l>>10)),e[s++]=String.fromCharCode(56320+(l&1023))}else{const i=n[t++],o=n[t++];e[s++]=String.fromCharCode((r&15)<<12|(i&63)<<6|o&63)}}return e.join("")},Ga={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,e){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,s=[];for(let r=0;r<n.length;r+=3){const i=n[r],o=r+1<n.length,c=o?n[r+1]:0,l=r+2<n.length,h=l?n[r+2]:0,f=i>>2,p=(i&3)<<4|c>>4;let m=(c&15)<<2|h>>6,w=h&63;l||(w=64,o||(m=64)),s.push(t[f],t[p],t[m],t[w])}return s.join("")},encodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(n):this.encodeByteArray(Sd(n),e)},decodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(n):Lm(this.decodeStringToByteArray(n,e))},decodeStringToByteArray(n,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,s=[];for(let r=0;r<n.length;){const i=t[n.charAt(r++)],c=r<n.length?t[n.charAt(r)]:0;++r;const h=r<n.length?t[n.charAt(r)]:64;++r;const p=r<n.length?t[n.charAt(r)]:64;if(++r,i==null||c==null||h==null||p==null)throw new xm;const m=i<<2|c>>4;if(s.push(m),h!==64){const w=c<<4&240|h>>2;if(s.push(w),p!==64){const S=h<<6&192|p;s.push(S)}}}return s},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class xm extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const bd=function(n){const e=Sd(n);return Ga.encodeByteArray(e,!0)},oi=function(n){return bd(n).replace(/\./g,"")},ai=function(n){try{return Ga.decodeString(n,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Fm(n){return Pd(void 0,n)}function Pd(n,e){if(!(e instanceof Object))return e;switch(e.constructor){case Date:const t=e;return new Date(t.getTime());case Object:n===void 0&&(n={});break;case Array:n=[];break;default:return e}for(const t in e)!e.hasOwnProperty(t)||!Um(t)||(n[t]=Pd(n[t],e[t]));return n}function Um(n){return n!=="__proto__"}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Bm(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qm=()=>Bm().__FIREBASE_DEFAULTS__,$m=()=>{if(typeof process>"u"||typeof Tu>"u")return;const n=Tu.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},jm=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=n&&ai(n[1]);return e&&JSON.parse(e)},Li=()=>{try{return Mm()||qm()||$m()||jm()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},Wm=n=>{var e,t;return(t=(e=Li())==null?void 0:e.emulatorHosts)==null?void 0:t[n]},Ka=n=>{const e=Wm(n);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const s=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),s]:[e.substring(0,t),s]},Nd=()=>{var n;return(n=Li())==null?void 0:n.config},zm=n=>{var e;return(e=Li())==null?void 0:e[`_${n}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ct{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,s)=>{t?this.reject(t):this.resolve(s),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,s))}}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ot(n){try{return(n.startsWith("http://")||n.startsWith("https://")?new URL(n).hostname:n).endsWith(".cloudworkstations.dev")}catch{return!1}}async function Qa(n){return(await fetch(n,{credentials:"include"})).ok}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function kd(n,e){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},s=e||"demo-project",r=n.iat||0,i=n.sub||n.user_id;if(!i)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const o={iss:`https://securetoken.google.com/${s}`,aud:s,iat:r,exp:r+3600,auth_time:r,sub:i,user_id:i,firebase:{sign_in_provider:"custom",identities:{}},...n};return[oi(JSON.stringify(t)),oi(JSON.stringify(o)),""].join(".")}const $s={};function Hm(){const n={prod:[],emulator:[]};for(const e of Object.keys($s))$s[e]?n.emulator.push(e):n.prod.push(e);return n}function Gm(n){let e=document.getElementById(n),t=!1;return e||(e=document.createElement("div"),e.setAttribute("id",n),t=!0),{created:t,element:e}}let vu=!1;function Ya(n,e){if(typeof window>"u"||typeof document>"u"||!Ot(window.location.host)||$s[n]===e||$s[n]||vu)return;$s[n]=e;function t(m){return`__firebase__banner__${m}`}const s="__firebase__banner",i=Hm().prod.length>0;function o(){const m=document.getElementById(s);m&&m.remove()}function c(m){m.style.display="flex",m.style.background="#7faaf0",m.style.position="fixed",m.style.bottom="5px",m.style.left="5px",m.style.padding=".5em",m.style.borderRadius="5px",m.style.alignItems="center"}function l(m,w){m.setAttribute("width","24"),m.setAttribute("id",w),m.setAttribute("height","24"),m.setAttribute("viewBox","0 0 24 24"),m.setAttribute("fill","none"),m.style.marginLeft="-6px"}function h(){const m=document.createElement("span");return m.style.cursor="pointer",m.style.marginLeft="16px",m.style.fontSize="24px",m.innerHTML=" &times;",m.onclick=()=>{vu=!0,o()},m}function f(m,w){m.setAttribute("id",w),m.innerText="Learn more",m.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",m.setAttribute("target","__blank"),m.style.paddingLeft="5px",m.style.textDecoration="underline"}function p(){const m=Gm(s),w=t("text"),S=document.getElementById(w)||document.createElement("span"),k=t("learnmore"),N=document.getElementById(k)||document.createElement("a"),x=t("preprendIcon"),U=document.getElementById(x)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(m.created){const $=m.element;c($),f(N,k);const Q=h();l(U,x),$.append(U,S,N,Q),document.body.appendChild($)}i?(S.innerText="Preview backend disconnected.",U.innerHTML=`<g clip-path="url(#clip0_6013_33858)">
<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6013_33858">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`):(U.innerHTML=`<g clip-path="url(#clip0_6083_34804)">
<path d="M11.4 15.2H12.6V11.2H11.4V15.2ZM12 10C12.1667 10 12.3056 9.94444 12.4167 9.83333C12.5389 9.71111 12.6 9.56667 12.6 9.4C12.6 9.23333 12.5389 9.09444 12.4167 8.98333C12.3056 8.86111 12.1667 8.8 12 8.8C11.8333 8.8 11.6889 8.86111 11.5667 8.98333C11.4556 9.09444 11.4 9.23333 11.4 9.4C11.4 9.56667 11.4556 9.71111 11.5667 9.83333C11.6889 9.94444 11.8333 10 12 10ZM12 18.4C11.1222 18.4 10.2944 18.2333 9.51667 17.9C8.73889 17.5667 8.05556 17.1111 7.46667 16.5333C6.88889 15.9444 6.43333 15.2611 6.1 14.4833C5.76667 13.7056 5.6 12.8778 5.6 12C5.6 11.1111 5.76667 10.2833 6.1 9.51667C6.43333 8.73889 6.88889 8.06111 7.46667 7.48333C8.05556 6.89444 8.73889 6.43333 9.51667 6.1C10.2944 5.76667 11.1222 5.6 12 5.6C12.8889 5.6 13.7167 5.76667 14.4833 6.1C15.2611 6.43333 15.9389 6.89444 16.5167 7.48333C17.1056 8.06111 17.5667 8.73889 17.9 9.51667C18.2333 10.2833 18.4 11.1111 18.4 12C18.4 12.8778 18.2333 13.7056 17.9 14.4833C17.5667 15.2611 17.1056 15.9444 16.5167 16.5333C15.9389 17.1111 15.2611 17.5667 14.4833 17.9C13.7167 18.2333 12.8889 18.4 12 18.4ZM12 17.2C13.4444 17.2 14.6722 16.6944 15.6833 15.6833C16.6944 14.6722 17.2 13.4444 17.2 12C17.2 10.5556 16.6944 9.32778 15.6833 8.31667C14.6722 7.30555 13.4444 6.8 12 6.8C10.5556 6.8 9.32778 7.30555 8.31667 8.31667C7.30556 9.32778 6.8 10.5556 6.8 12C6.8 13.4444 7.30556 14.6722 8.31667 15.6833C9.32778 16.6944 10.5556 17.2 12 17.2Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6083_34804">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`,S.innerText="Preview backend running in this workspace."),S.setAttribute("id",w)}document.readyState==="loading"?window.addEventListener("DOMContentLoaded",p):p()}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function it(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function Xa(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(it())}function Km(){var e;const n=(e=Li())==null?void 0:e.forceEnvironment;if(n==="node")return!0;if(n==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function Qm(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function Ym(){const n=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof n=="object"&&n.id!==void 0}function Dd(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function Xm(){return Rd.NODE_ADMIN===!0}function Jm(){return!Km()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function Zm(){try{return typeof indexedDB=="object"}catch{return!1}}function eg(){return new Promise((n,e)=>{try{let t=!0;const s="validate-browser-context-for-indexeddb-analytics-module",r=self.indexedDB.open(s);r.onsuccess=()=>{r.result.close(),t||self.indexedDB.deleteDatabase(s),n(!0)},r.onupgradeneeded=()=>{t=!1},r.onerror=()=>{var i;e(((i=r.error)==null?void 0:i.message)||"")}}catch(t){e(t)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tg="FirebaseError";class It extends Error{constructor(e,t,s){super(t),this.code=e,this.customData=s,this.name=tg,Object.setPrototypeOf(this,It.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,fr.prototype.create)}}class fr{constructor(e,t,s){this.service=e,this.serviceName=t,this.errors=s}create(e,...t){const s=t[0]||{},r=`${this.service}/${e}`,i=this.errors[e],o=i?ng(i,s):"Error",c=`${this.serviceName}: ${o} (${r}).`;return new It(r,c,s)}}function ng(n,e){return n.replace(sg,(t,s)=>{const r=e[s];return r!=null?String(r):`<${s}?>`})}const sg=/\{\$([^}]+)}/g;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function er(n){return JSON.parse(n)}function Ne(n){return JSON.stringify(n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Od=function(n){let e={},t={},s={},r="";try{const i=n.split(".");e=er(ai(i[0])||""),t=er(ai(i[1])||""),r=i[2],s=t.d||{},delete t.d}catch{}return{header:e,claims:t,data:s,signature:r}},rg=function(n){const e=Od(n),t=e.claims;return!!t&&typeof t=="object"&&t.hasOwnProperty("iat")},ig=function(n){const e=Od(n).claims;return typeof e=="object"&&e.admin===!0};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wt(n,e){return Object.prototype.hasOwnProperty.call(n,e)}function Hn(n,e){if(Object.prototype.hasOwnProperty.call(n,e))return n[e]}function ia(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}function ci(n,e,t){const s={};for(const r in n)Object.prototype.hasOwnProperty.call(n,r)&&(s[r]=e.call(t,n[r],r,n));return s}function li(n,e){if(n===e)return!0;const t=Object.keys(n),s=Object.keys(e);for(const r of t){if(!s.includes(r))return!1;const i=n[r],o=e[r];if(Iu(i)&&Iu(o)){if(!li(i,o))return!1}else if(i!==o)return!1}for(const r of s)if(!t.includes(r))return!1;return!0}function Iu(n){return n!==null&&typeof n=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ja(n){const e=[];for(const[t,s]of Object.entries(n))Array.isArray(s)?s.forEach(r=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(r))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(s));return e.length?"&"+e.join("&"):""}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class og{constructor(){this.chain_=[],this.buf_=[],this.W_=[],this.pad_=[],this.inbuf_=0,this.total_=0,this.blockSize=512/8,this.pad_[0]=128;for(let e=1;e<this.blockSize;++e)this.pad_[e]=0;this.reset()}reset(){this.chain_[0]=1732584193,this.chain_[1]=4023233417,this.chain_[2]=2562383102,this.chain_[3]=271733878,this.chain_[4]=3285377520,this.inbuf_=0,this.total_=0}compress_(e,t){t||(t=0);const s=this.W_;if(typeof e=="string")for(let p=0;p<16;p++)s[p]=e.charCodeAt(t)<<24|e.charCodeAt(t+1)<<16|e.charCodeAt(t+2)<<8|e.charCodeAt(t+3),t+=4;else for(let p=0;p<16;p++)s[p]=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3],t+=4;for(let p=16;p<80;p++){const m=s[p-3]^s[p-8]^s[p-14]^s[p-16];s[p]=(m<<1|m>>>31)&4294967295}let r=this.chain_[0],i=this.chain_[1],o=this.chain_[2],c=this.chain_[3],l=this.chain_[4],h,f;for(let p=0;p<80;p++){p<40?p<20?(h=c^i&(o^c),f=1518500249):(h=i^o^c,f=1859775393):p<60?(h=i&o|c&(i|o),f=2400959708):(h=i^o^c,f=3395469782);const m=(r<<5|r>>>27)+h+l+f+s[p]&4294967295;l=c,c=o,o=(i<<30|i>>>2)&4294967295,i=r,r=m}this.chain_[0]=this.chain_[0]+r&4294967295,this.chain_[1]=this.chain_[1]+i&4294967295,this.chain_[2]=this.chain_[2]+o&4294967295,this.chain_[3]=this.chain_[3]+c&4294967295,this.chain_[4]=this.chain_[4]+l&4294967295}update(e,t){if(e==null)return;t===void 0&&(t=e.length);const s=t-this.blockSize;let r=0;const i=this.buf_;let o=this.inbuf_;for(;r<t;){if(o===0)for(;r<=s;)this.compress_(e,r),r+=this.blockSize;if(typeof e=="string"){for(;r<t;)if(i[o]=e.charCodeAt(r),++o,++r,o===this.blockSize){this.compress_(i),o=0;break}}else for(;r<t;)if(i[o]=e[r],++o,++r,o===this.blockSize){this.compress_(i),o=0;break}}this.inbuf_=o,this.total_+=t}digest(){const e=[];let t=this.total_*8;this.inbuf_<56?this.update(this.pad_,56-this.inbuf_):this.update(this.pad_,this.blockSize-(this.inbuf_-56));for(let r=this.blockSize-1;r>=56;r--)this.buf_[r]=t&255,t/=256;this.compress_(this.buf_);let s=0;for(let r=0;r<5;r++)for(let i=24;i>=0;i-=8)e[s]=this.chain_[r]>>i&255,++s;return e}}function ag(n,e){const t=new cg(n,e);return t.subscribe.bind(t)}class cg{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(s=>{this.error(s)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,s){let r;if(e===void 0&&t===void 0&&s===void 0)throw new Error("Missing Observer.");lg(e,["next","error","complete"])?r=e:r={next:e,error:t,complete:s},r.next===void 0&&(r.next=Bo),r.error===void 0&&(r.error=Bo),r.complete===void 0&&(r.complete=Bo);const i=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?r.error(this.finalError):r.complete()}catch{}}),this.observers.push(r),i}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(s){typeof console<"u"&&console.error&&console.error(s)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function lg(n,e){if(typeof n!="object"||n===null)return!1;for(const t of e)if(t in n&&typeof n[t]=="function")return!0;return!1}function Bo(){}function Gn(n,e){return`${n} failed: ${e} argument `}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ug=function(n){const e=[];let t=0;for(let s=0;s<n.length;s++){let r=n.charCodeAt(s);if(r>=55296&&r<=56319){const i=r-55296;s++,O(s<n.length,"Surrogate pair missing trail surrogate.");const o=n.charCodeAt(s)-56320;r=65536+(i<<10)+o}r<128?e[t++]=r:r<2048?(e[t++]=r>>6|192,e[t++]=r&63|128):r<65536?(e[t++]=r>>12|224,e[t++]=r>>6&63|128,e[t++]=r&63|128):(e[t++]=r>>18|240,e[t++]=r>>12&63|128,e[t++]=r>>6&63|128,e[t++]=r&63|128)}return e},xi=function(n){let e=0;for(let t=0;t<n.length;t++){const s=n.charCodeAt(t);s<128?e++:s<2048?e+=2:s>=55296&&s<=56319?(e+=4,t++):e+=3}return e};/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ne(n){return n&&n._delegate?n._delegate:n}class Tt{constructor(e,t,s){this.name=e,this.instanceFactory=t,this.type=s,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dn="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hg{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const s=new Ct;if(this.instancesDeferred.set(t,s),this.isInitialized(t)||this.shouldAutoInitialize())try{const r=this.getOrInitializeService({instanceIdentifier:t});r&&s.resolve(r)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),s=(e==null?void 0:e.optional)??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(r){if(s)return null;throw r}else{if(s)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(fg(e))try{this.getOrInitializeService({instanceIdentifier:dn})}catch{}for(const[t,s]of this.instancesDeferred.entries()){const r=this.normalizeInstanceIdentifier(t);try{const i=this.getOrInitializeService({instanceIdentifier:r});s.resolve(i)}catch{}}}}clearInstance(e=dn){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=dn){return this.instances.has(e)}getOptions(e=dn){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,s=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(s))throw Error(`${this.name}(${s}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const r=this.getOrInitializeService({instanceIdentifier:s,options:t});for(const[i,o]of this.instancesDeferred.entries()){const c=this.normalizeInstanceIdentifier(i);s===c&&o.resolve(r)}return r}onInit(e,t){const s=this.normalizeInstanceIdentifier(t),r=this.onInitCallbacks.get(s)??new Set;r.add(e),this.onInitCallbacks.set(s,r);const i=this.instances.get(s);return i&&e(i,s),()=>{r.delete(e)}}invokeOnInitCallbacks(e,t){const s=this.onInitCallbacks.get(t);if(s)for(const r of s)try{r(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let s=this.instances.get(e);if(!s&&this.component&&(s=this.component.instanceFactory(this.container,{instanceIdentifier:dg(e),options:t}),this.instances.set(e,s),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(s,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,s)}catch{}return s||null}normalizeInstanceIdentifier(e=dn){return this.component?this.component.multipleInstances?e:dn:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function dg(n){return n===dn?void 0:n}function fg(n){return n.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pg{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new hg(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var W;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(W||(W={}));const _g={debug:W.DEBUG,verbose:W.VERBOSE,info:W.INFO,warn:W.WARN,error:W.ERROR,silent:W.SILENT},mg=W.INFO,gg={[W.DEBUG]:"log",[W.VERBOSE]:"log",[W.INFO]:"info",[W.WARN]:"warn",[W.ERROR]:"error"},yg=(n,e,...t)=>{if(e<n.logLevel)return;const s=new Date().toISOString(),r=gg[e];if(r)console[r](`[${s}]  ${n.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class Fi{constructor(e){this.name=e,this._logLevel=mg,this._logHandler=yg,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in W))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?_g[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,W.DEBUG,...e),this._logHandler(this,W.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,W.VERBOSE,...e),this._logHandler(this,W.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,W.INFO,...e),this._logHandler(this,W.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,W.WARN,...e),this._logHandler(this,W.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,W.ERROR,...e),this._logHandler(this,W.ERROR,...e)}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Eg{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(Tg(t)){const s=t.getImmediate();return`${s.library}/${s.version}`}else return null}).filter(t=>t).join(" ")}}function Tg(n){const e=n.getComponent();return(e==null?void 0:e.type)==="VERSION"}const oa="@firebase/app",wu="0.14.4";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bt=new Fi("@firebase/app"),vg="@firebase/app-compat",Ig="@firebase/analytics-compat",wg="@firebase/analytics",Ag="@firebase/app-check-compat",Cg="@firebase/app-check",Rg="@firebase/auth",Sg="@firebase/auth-compat",bg="@firebase/database",Pg="@firebase/data-connect",Ng="@firebase/database-compat",kg="@firebase/functions",Dg="@firebase/functions-compat",Og="@firebase/installations",Vg="@firebase/installations-compat",Mg="@firebase/messaging",Lg="@firebase/messaging-compat",xg="@firebase/performance",Fg="@firebase/performance-compat",Ug="@firebase/remote-config",Bg="@firebase/remote-config-compat",qg="@firebase/storage",$g="@firebase/storage-compat",jg="@firebase/firestore",Wg="@firebase/ai",zg="@firebase/firestore-compat",Hg="firebase",Gg="12.4.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const aa="[DEFAULT]",Kg={[oa]:"fire-core",[vg]:"fire-core-compat",[wg]:"fire-analytics",[Ig]:"fire-analytics-compat",[Cg]:"fire-app-check",[Ag]:"fire-app-check-compat",[Rg]:"fire-auth",[Sg]:"fire-auth-compat",[bg]:"fire-rtdb",[Pg]:"fire-data-connect",[Ng]:"fire-rtdb-compat",[kg]:"fire-fn",[Dg]:"fire-fn-compat",[Og]:"fire-iid",[Vg]:"fire-iid-compat",[Mg]:"fire-fcm",[Lg]:"fire-fcm-compat",[xg]:"fire-perf",[Fg]:"fire-perf-compat",[Ug]:"fire-rc",[Bg]:"fire-rc-compat",[qg]:"fire-gcs",[$g]:"fire-gcs-compat",[jg]:"fire-fst",[zg]:"fire-fst-compat",[Wg]:"fire-vertex","fire-js":"fire-js",[Hg]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ui=new Map,Qg=new Map,ca=new Map;function Au(n,e){try{n.container.addComponent(e)}catch(t){bt.debug(`Component ${e.name} failed to register with FirebaseApp ${n.name}`,t)}}function Pt(n){const e=n.name;if(ca.has(e))return bt.debug(`There were multiple attempts to register component ${e}.`),!1;ca.set(e,n);for(const t of ui.values())Au(t,n);for(const t of Qg.values())Au(t,n);return!0}function Za(n,e){const t=n.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),n.container.getProvider(e)}function ht(n){return n==null?!1:n.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yg={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},zt=new fr("app","Firebase",Yg);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xg{constructor(e,t,s){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=s,this.container.addComponent(new Tt("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw zt.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const is=Gg;function Vd(n,e={}){let t=n;typeof e!="object"&&(e={name:e});const s={name:aa,automaticDataCollectionEnabled:!0,...e},r=s.name;if(typeof r!="string"||!r)throw zt.create("bad-app-name",{appName:String(r)});if(t||(t=Nd()),!t)throw zt.create("no-options");const i=ui.get(r);if(i){if(li(t,i.options)&&li(s,i.config))return i;throw zt.create("duplicate-app",{appName:r})}const o=new pg(r);for(const l of ca.values())o.addComponent(l);const c=new Xg(t,s,o);return ui.set(r,c),c}function ec(n=aa){const e=ui.get(n);if(!e&&n===aa&&Nd())return Vd();if(!e)throw zt.create("no-app",{appName:n});return e}function Ke(n,e,t){let s=Kg[n]??n;t&&(s+=`-${t}`);const r=s.match(/\s|\//),i=e.match(/\s|\//);if(r||i){const o=[`Unable to register library "${s}" with version "${e}":`];r&&o.push(`library name "${s}" contains illegal characters (whitespace or "/")`),r&&i&&o.push("and"),i&&o.push(`version name "${e}" contains illegal characters (whitespace or "/")`),bt.warn(o.join(" "));return}Pt(new Tt(`${s}-version`,()=>({library:s,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Jg="firebase-heartbeat-database",Zg=1,tr="firebase-heartbeat-store";let qo=null;function Md(){return qo||(qo=Vm(Jg,Zg,{upgrade:(n,e)=>{switch(e){case 0:try{n.createObjectStore(tr)}catch(t){console.warn(t)}}}}).catch(n=>{throw zt.create("idb-open",{originalErrorMessage:n.message})})),qo}async function ey(n){try{const t=(await Md()).transaction(tr),s=await t.objectStore(tr).get(Ld(n));return await t.done,s}catch(e){if(e instanceof It)bt.warn(e.message);else{const t=zt.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});bt.warn(t.message)}}}async function Cu(n,e){try{const s=(await Md()).transaction(tr,"readwrite");await s.objectStore(tr).put(e,Ld(n)),await s.done}catch(t){if(t instanceof It)bt.warn(t.message);else{const s=zt.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});bt.warn(s.message)}}}function Ld(n){return`${n.name}!${n.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ty=1024,ny=30;class sy{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new iy(t),this._heartbeatsCachePromise=this._storage.read().then(s=>(this._heartbeatsCache=s,s))}async triggerHeartbeat(){var e,t;try{const r=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),i=Ru();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===i||this._heartbeatsCache.heartbeats.some(o=>o.date===i))return;if(this._heartbeatsCache.heartbeats.push({date:i,agent:r}),this._heartbeatsCache.heartbeats.length>ny){const o=oy(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(o,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(s){bt.warn(s)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=Ru(),{heartbeatsToSend:s,unsentEntries:r}=ry(this._heartbeatsCache.heartbeats),i=oi(JSON.stringify({version:2,heartbeats:s}));return this._heartbeatsCache.lastSentHeartbeatDate=t,r.length>0?(this._heartbeatsCache.heartbeats=r,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),i}catch(t){return bt.warn(t),""}}}function Ru(){return new Date().toISOString().substring(0,10)}function ry(n,e=ty){const t=[];let s=n.slice();for(const r of n){const i=t.find(o=>o.agent===r.agent);if(i){if(i.dates.push(r.date),Su(t)>e){i.dates.pop();break}}else if(t.push({agent:r.agent,dates:[r.date]}),Su(t)>e){t.pop();break}s=s.slice(1)}return{heartbeatsToSend:t,unsentEntries:s}}class iy{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Zm()?eg().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await ey(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const s=await this.read();return Cu(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??s.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const s=await this.read();return Cu(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??s.lastSentHeartbeatDate,heartbeats:[...s.heartbeats,...e.heartbeats]})}else return}}function Su(n){return oi(JSON.stringify({version:2,heartbeats:n})).length}function oy(n){if(n.length===0)return-1;let e=0,t=n[0].date;for(let s=1;s<n.length;s++)n[s].date<t&&(t=n[s].date,e=s);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ay(n){Pt(new Tt("platform-logger",e=>new Eg(e),"PRIVATE")),Pt(new Tt("heartbeat",e=>new sy(e),"PRIVATE")),Ke(oa,wu,n),Ke(oa,wu,"esm2020"),Ke("fire-js","")}ay("");var cy="firebase",ly="12.4.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Ke(cy,ly,"app");var bu=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Ht,xd;(function(){var n;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(v,g){function E(){}E.prototype=g.prototype,v.F=g.prototype,v.prototype=new E,v.prototype.constructor=v,v.D=function(I,T,C){for(var y=Array(arguments.length-2),je=2;je<arguments.length;je++)y[je-2]=arguments[je];return g.prototype[T].apply(I,y)}}function t(){this.blockSize=-1}function s(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}e(s,t),s.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function r(v,g,E){E||(E=0);const I=Array(16);if(typeof g=="string")for(var T=0;T<16;++T)I[T]=g.charCodeAt(E++)|g.charCodeAt(E++)<<8|g.charCodeAt(E++)<<16|g.charCodeAt(E++)<<24;else for(T=0;T<16;++T)I[T]=g[E++]|g[E++]<<8|g[E++]<<16|g[E++]<<24;g=v.g[0],E=v.g[1],T=v.g[2];let C=v.g[3],y;y=g+(C^E&(T^C))+I[0]+3614090360&4294967295,g=E+(y<<7&4294967295|y>>>25),y=C+(T^g&(E^T))+I[1]+3905402710&4294967295,C=g+(y<<12&4294967295|y>>>20),y=T+(E^C&(g^E))+I[2]+606105819&4294967295,T=C+(y<<17&4294967295|y>>>15),y=E+(g^T&(C^g))+I[3]+3250441966&4294967295,E=T+(y<<22&4294967295|y>>>10),y=g+(C^E&(T^C))+I[4]+4118548399&4294967295,g=E+(y<<7&4294967295|y>>>25),y=C+(T^g&(E^T))+I[5]+1200080426&4294967295,C=g+(y<<12&4294967295|y>>>20),y=T+(E^C&(g^E))+I[6]+2821735955&4294967295,T=C+(y<<17&4294967295|y>>>15),y=E+(g^T&(C^g))+I[7]+4249261313&4294967295,E=T+(y<<22&4294967295|y>>>10),y=g+(C^E&(T^C))+I[8]+1770035416&4294967295,g=E+(y<<7&4294967295|y>>>25),y=C+(T^g&(E^T))+I[9]+2336552879&4294967295,C=g+(y<<12&4294967295|y>>>20),y=T+(E^C&(g^E))+I[10]+4294925233&4294967295,T=C+(y<<17&4294967295|y>>>15),y=E+(g^T&(C^g))+I[11]+2304563134&4294967295,E=T+(y<<22&4294967295|y>>>10),y=g+(C^E&(T^C))+I[12]+1804603682&4294967295,g=E+(y<<7&4294967295|y>>>25),y=C+(T^g&(E^T))+I[13]+4254626195&4294967295,C=g+(y<<12&4294967295|y>>>20),y=T+(E^C&(g^E))+I[14]+2792965006&4294967295,T=C+(y<<17&4294967295|y>>>15),y=E+(g^T&(C^g))+I[15]+1236535329&4294967295,E=T+(y<<22&4294967295|y>>>10),y=g+(T^C&(E^T))+I[1]+4129170786&4294967295,g=E+(y<<5&4294967295|y>>>27),y=C+(E^T&(g^E))+I[6]+3225465664&4294967295,C=g+(y<<9&4294967295|y>>>23),y=T+(g^E&(C^g))+I[11]+643717713&4294967295,T=C+(y<<14&4294967295|y>>>18),y=E+(C^g&(T^C))+I[0]+3921069994&4294967295,E=T+(y<<20&4294967295|y>>>12),y=g+(T^C&(E^T))+I[5]+3593408605&4294967295,g=E+(y<<5&4294967295|y>>>27),y=C+(E^T&(g^E))+I[10]+38016083&4294967295,C=g+(y<<9&4294967295|y>>>23),y=T+(g^E&(C^g))+I[15]+3634488961&4294967295,T=C+(y<<14&4294967295|y>>>18),y=E+(C^g&(T^C))+I[4]+3889429448&4294967295,E=T+(y<<20&4294967295|y>>>12),y=g+(T^C&(E^T))+I[9]+568446438&4294967295,g=E+(y<<5&4294967295|y>>>27),y=C+(E^T&(g^E))+I[14]+3275163606&4294967295,C=g+(y<<9&4294967295|y>>>23),y=T+(g^E&(C^g))+I[3]+4107603335&4294967295,T=C+(y<<14&4294967295|y>>>18),y=E+(C^g&(T^C))+I[8]+1163531501&4294967295,E=T+(y<<20&4294967295|y>>>12),y=g+(T^C&(E^T))+I[13]+2850285829&4294967295,g=E+(y<<5&4294967295|y>>>27),y=C+(E^T&(g^E))+I[2]+4243563512&4294967295,C=g+(y<<9&4294967295|y>>>23),y=T+(g^E&(C^g))+I[7]+1735328473&4294967295,T=C+(y<<14&4294967295|y>>>18),y=E+(C^g&(T^C))+I[12]+2368359562&4294967295,E=T+(y<<20&4294967295|y>>>12),y=g+(E^T^C)+I[5]+4294588738&4294967295,g=E+(y<<4&4294967295|y>>>28),y=C+(g^E^T)+I[8]+2272392833&4294967295,C=g+(y<<11&4294967295|y>>>21),y=T+(C^g^E)+I[11]+1839030562&4294967295,T=C+(y<<16&4294967295|y>>>16),y=E+(T^C^g)+I[14]+4259657740&4294967295,E=T+(y<<23&4294967295|y>>>9),y=g+(E^T^C)+I[1]+2763975236&4294967295,g=E+(y<<4&4294967295|y>>>28),y=C+(g^E^T)+I[4]+1272893353&4294967295,C=g+(y<<11&4294967295|y>>>21),y=T+(C^g^E)+I[7]+4139469664&4294967295,T=C+(y<<16&4294967295|y>>>16),y=E+(T^C^g)+I[10]+3200236656&4294967295,E=T+(y<<23&4294967295|y>>>9),y=g+(E^T^C)+I[13]+681279174&4294967295,g=E+(y<<4&4294967295|y>>>28),y=C+(g^E^T)+I[0]+3936430074&4294967295,C=g+(y<<11&4294967295|y>>>21),y=T+(C^g^E)+I[3]+3572445317&4294967295,T=C+(y<<16&4294967295|y>>>16),y=E+(T^C^g)+I[6]+76029189&4294967295,E=T+(y<<23&4294967295|y>>>9),y=g+(E^T^C)+I[9]+3654602809&4294967295,g=E+(y<<4&4294967295|y>>>28),y=C+(g^E^T)+I[12]+3873151461&4294967295,C=g+(y<<11&4294967295|y>>>21),y=T+(C^g^E)+I[15]+530742520&4294967295,T=C+(y<<16&4294967295|y>>>16),y=E+(T^C^g)+I[2]+3299628645&4294967295,E=T+(y<<23&4294967295|y>>>9),y=g+(T^(E|~C))+I[0]+4096336452&4294967295,g=E+(y<<6&4294967295|y>>>26),y=C+(E^(g|~T))+I[7]+1126891415&4294967295,C=g+(y<<10&4294967295|y>>>22),y=T+(g^(C|~E))+I[14]+2878612391&4294967295,T=C+(y<<15&4294967295|y>>>17),y=E+(C^(T|~g))+I[5]+4237533241&4294967295,E=T+(y<<21&4294967295|y>>>11),y=g+(T^(E|~C))+I[12]+1700485571&4294967295,g=E+(y<<6&4294967295|y>>>26),y=C+(E^(g|~T))+I[3]+2399980690&4294967295,C=g+(y<<10&4294967295|y>>>22),y=T+(g^(C|~E))+I[10]+4293915773&4294967295,T=C+(y<<15&4294967295|y>>>17),y=E+(C^(T|~g))+I[1]+2240044497&4294967295,E=T+(y<<21&4294967295|y>>>11),y=g+(T^(E|~C))+I[8]+1873313359&4294967295,g=E+(y<<6&4294967295|y>>>26),y=C+(E^(g|~T))+I[15]+4264355552&4294967295,C=g+(y<<10&4294967295|y>>>22),y=T+(g^(C|~E))+I[6]+2734768916&4294967295,T=C+(y<<15&4294967295|y>>>17),y=E+(C^(T|~g))+I[13]+1309151649&4294967295,E=T+(y<<21&4294967295|y>>>11),y=g+(T^(E|~C))+I[4]+4149444226&4294967295,g=E+(y<<6&4294967295|y>>>26),y=C+(E^(g|~T))+I[11]+3174756917&4294967295,C=g+(y<<10&4294967295|y>>>22),y=T+(g^(C|~E))+I[2]+718787259&4294967295,T=C+(y<<15&4294967295|y>>>17),y=E+(C^(T|~g))+I[9]+3951481745&4294967295,v.g[0]=v.g[0]+g&4294967295,v.g[1]=v.g[1]+(T+(y<<21&4294967295|y>>>11))&4294967295,v.g[2]=v.g[2]+T&4294967295,v.g[3]=v.g[3]+C&4294967295}s.prototype.v=function(v,g){g===void 0&&(g=v.length);const E=g-this.blockSize,I=this.C;let T=this.h,C=0;for(;C<g;){if(T==0)for(;C<=E;)r(this,v,C),C+=this.blockSize;if(typeof v=="string"){for(;C<g;)if(I[T++]=v.charCodeAt(C++),T==this.blockSize){r(this,I),T=0;break}}else for(;C<g;)if(I[T++]=v[C++],T==this.blockSize){r(this,I),T=0;break}}this.h=T,this.o+=g},s.prototype.A=function(){var v=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);v[0]=128;for(var g=1;g<v.length-8;++g)v[g]=0;g=this.o*8;for(var E=v.length-8;E<v.length;++E)v[E]=g&255,g/=256;for(this.v(v),v=Array(16),g=0,E=0;E<4;++E)for(let I=0;I<32;I+=8)v[g++]=this.g[E]>>>I&255;return v};function i(v,g){var E=c;return Object.prototype.hasOwnProperty.call(E,v)?E[v]:E[v]=g(v)}function o(v,g){this.h=g;const E=[];let I=!0;for(let T=v.length-1;T>=0;T--){const C=v[T]|0;I&&C==g||(E[T]=C,I=!1)}this.g=E}var c={};function l(v){return-128<=v&&v<128?i(v,function(g){return new o([g|0],g<0?-1:0)}):new o([v|0],v<0?-1:0)}function h(v){if(isNaN(v)||!isFinite(v))return p;if(v<0)return N(h(-v));const g=[];let E=1;for(let I=0;v>=E;I++)g[I]=v/E|0,E*=4294967296;return new o(g,0)}function f(v,g){if(v.length==0)throw Error("number format error: empty string");if(g=g||10,g<2||36<g)throw Error("radix out of range: "+g);if(v.charAt(0)=="-")return N(f(v.substring(1),g));if(v.indexOf("-")>=0)throw Error('number format error: interior "-" character');const E=h(Math.pow(g,8));let I=p;for(let C=0;C<v.length;C+=8){var T=Math.min(8,v.length-C);const y=parseInt(v.substring(C,C+T),g);T<8?(T=h(Math.pow(g,T)),I=I.j(T).add(h(y))):(I=I.j(E),I=I.add(h(y)))}return I}var p=l(0),m=l(1),w=l(16777216);n=o.prototype,n.m=function(){if(k(this))return-N(this).m();let v=0,g=1;for(let E=0;E<this.g.length;E++){const I=this.i(E);v+=(I>=0?I:4294967296+I)*g,g*=4294967296}return v},n.toString=function(v){if(v=v||10,v<2||36<v)throw Error("radix out of range: "+v);if(S(this))return"0";if(k(this))return"-"+N(this).toString(v);const g=h(Math.pow(v,6));var E=this;let I="";for(;;){const T=Q(E,g).g;E=x(E,T.j(g));let C=((E.g.length>0?E.g[0]:E.h)>>>0).toString(v);if(E=T,S(E))return C+I;for(;C.length<6;)C="0"+C;I=C+I}},n.i=function(v){return v<0?0:v<this.g.length?this.g[v]:this.h};function S(v){if(v.h!=0)return!1;for(let g=0;g<v.g.length;g++)if(v.g[g]!=0)return!1;return!0}function k(v){return v.h==-1}n.l=function(v){return v=x(this,v),k(v)?-1:S(v)?0:1};function N(v){const g=v.g.length,E=[];for(let I=0;I<g;I++)E[I]=~v.g[I];return new o(E,~v.h).add(m)}n.abs=function(){return k(this)?N(this):this},n.add=function(v){const g=Math.max(this.g.length,v.g.length),E=[];let I=0;for(let T=0;T<=g;T++){let C=I+(this.i(T)&65535)+(v.i(T)&65535),y=(C>>>16)+(this.i(T)>>>16)+(v.i(T)>>>16);I=y>>>16,C&=65535,y&=65535,E[T]=y<<16|C}return new o(E,E[E.length-1]&-2147483648?-1:0)};function x(v,g){return v.add(N(g))}n.j=function(v){if(S(this)||S(v))return p;if(k(this))return k(v)?N(this).j(N(v)):N(N(this).j(v));if(k(v))return N(this.j(N(v)));if(this.l(w)<0&&v.l(w)<0)return h(this.m()*v.m());const g=this.g.length+v.g.length,E=[];for(var I=0;I<2*g;I++)E[I]=0;for(I=0;I<this.g.length;I++)for(let T=0;T<v.g.length;T++){const C=this.i(I)>>>16,y=this.i(I)&65535,je=v.i(T)>>>16,on=v.i(T)&65535;E[2*I+2*T]+=y*on,U(E,2*I+2*T),E[2*I+2*T+1]+=C*on,U(E,2*I+2*T+1),E[2*I+2*T+1]+=y*je,U(E,2*I+2*T+1),E[2*I+2*T+2]+=C*je,U(E,2*I+2*T+2)}for(v=0;v<g;v++)E[v]=E[2*v+1]<<16|E[2*v];for(v=g;v<2*g;v++)E[v]=0;return new o(E,0)};function U(v,g){for(;(v[g]&65535)!=v[g];)v[g+1]+=v[g]>>>16,v[g]&=65535,g++}function $(v,g){this.g=v,this.h=g}function Q(v,g){if(S(g))throw Error("division by zero");if(S(v))return new $(p,p);if(k(v))return g=Q(N(v),g),new $(N(g.g),N(g.h));if(k(g))return g=Q(v,N(g)),new $(N(g.g),g.h);if(v.g.length>30){if(k(v)||k(g))throw Error("slowDivide_ only works with positive integers.");for(var E=m,I=g;I.l(v)<=0;)E=Ae(E),I=Ae(I);var T=ue(E,1),C=ue(I,1);for(I=ue(I,2),E=ue(E,2);!S(I);){var y=C.add(I);y.l(v)<=0&&(T=T.add(E),C=y),I=ue(I,1),E=ue(E,1)}return g=x(v,T.j(g)),new $(T,g)}for(T=p;v.l(g)>=0;){for(E=Math.max(1,Math.floor(v.m()/g.m())),I=Math.ceil(Math.log(E)/Math.LN2),I=I<=48?1:Math.pow(2,I-48),C=h(E),y=C.j(g);k(y)||y.l(v)>0;)E-=I,C=h(E),y=C.j(g);S(C)&&(C=m),T=T.add(C),v=x(v,y)}return new $(T,v)}n.B=function(v){return Q(this,v).h},n.and=function(v){const g=Math.max(this.g.length,v.g.length),E=[];for(let I=0;I<g;I++)E[I]=this.i(I)&v.i(I);return new o(E,this.h&v.h)},n.or=function(v){const g=Math.max(this.g.length,v.g.length),E=[];for(let I=0;I<g;I++)E[I]=this.i(I)|v.i(I);return new o(E,this.h|v.h)},n.xor=function(v){const g=Math.max(this.g.length,v.g.length),E=[];for(let I=0;I<g;I++)E[I]=this.i(I)^v.i(I);return new o(E,this.h^v.h)};function Ae(v){const g=v.g.length+1,E=[];for(let I=0;I<g;I++)E[I]=v.i(I)<<1|v.i(I-1)>>>31;return new o(E,v.h)}function ue(v,g){const E=g>>5;g%=32;const I=v.g.length-E,T=[];for(let C=0;C<I;C++)T[C]=g>0?v.i(C+E)>>>g|v.i(C+E+1)<<32-g:v.i(C+E);return new o(T,v.h)}s.prototype.digest=s.prototype.A,s.prototype.reset=s.prototype.u,s.prototype.update=s.prototype.v,xd=s,o.prototype.add=o.prototype.add,o.prototype.multiply=o.prototype.j,o.prototype.modulo=o.prototype.B,o.prototype.compare=o.prototype.l,o.prototype.toNumber=o.prototype.m,o.prototype.toString=o.prototype.toString,o.prototype.getBits=o.prototype.i,o.fromNumber=h,o.fromString=f,Ht=o}).apply(typeof bu<"u"?bu:typeof self<"u"?self:typeof window<"u"?window:{});var $r=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Fd,xs,Ud,Jr,la,Bd,qd,$d;(function(){var n,e=Object.defineProperty;function t(a){a=[typeof globalThis=="object"&&globalThis,a,typeof window=="object"&&window,typeof self=="object"&&self,typeof $r=="object"&&$r];for(var u=0;u<a.length;++u){var d=a[u];if(d&&d.Math==Math)return d}throw Error("Cannot find global object")}var s=t(this);function r(a,u){if(u)e:{var d=s;a=a.split(".");for(var _=0;_<a.length-1;_++){var A=a[_];if(!(A in d))break e;d=d[A]}a=a[a.length-1],_=d[a],u=u(_),u!=_&&u!=null&&e(d,a,{configurable:!0,writable:!0,value:u})}}r("Symbol.dispose",function(a){return a||Symbol("Symbol.dispose")}),r("Array.prototype.values",function(a){return a||function(){return this[Symbol.iterator]()}}),r("Object.entries",function(a){return a||function(u){var d=[],_;for(_ in u)Object.prototype.hasOwnProperty.call(u,_)&&d.push([_,u[_]]);return d}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var i=i||{},o=this||self;function c(a){var u=typeof a;return u=="object"&&a!=null||u=="function"}function l(a,u,d){return a.call.apply(a.bind,arguments)}function h(a,u,d){return h=l,h.apply(null,arguments)}function f(a,u){var d=Array.prototype.slice.call(arguments,1);return function(){var _=d.slice();return _.push.apply(_,arguments),a.apply(this,_)}}function p(a,u){function d(){}d.prototype=u.prototype,a.Z=u.prototype,a.prototype=new d,a.prototype.constructor=a,a.Ob=function(_,A,R){for(var D=Array(arguments.length-2),j=2;j<arguments.length;j++)D[j-2]=arguments[j];return u.prototype[A].apply(_,D)}}var m=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?a=>a&&AsyncContext.Snapshot.wrap(a):a=>a;function w(a){const u=a.length;if(u>0){const d=Array(u);for(let _=0;_<u;_++)d[_]=a[_];return d}return[]}function S(a,u){for(let _=1;_<arguments.length;_++){const A=arguments[_];var d=typeof A;if(d=d!="object"?d:A?Array.isArray(A)?"array":d:"null",d=="array"||d=="object"&&typeof A.length=="number"){d=a.length||0;const R=A.length||0;a.length=d+R;for(let D=0;D<R;D++)a[d+D]=A[D]}else a.push(A)}}class k{constructor(u,d){this.i=u,this.j=d,this.h=0,this.g=null}get(){let u;return this.h>0?(this.h--,u=this.g,this.g=u.next,u.next=null):u=this.i(),u}}function N(a){o.setTimeout(()=>{throw a},0)}function x(){var a=v;let u=null;return a.g&&(u=a.g,a.g=a.g.next,a.g||(a.h=null),u.next=null),u}class U{constructor(){this.h=this.g=null}add(u,d){const _=$.get();_.set(u,d),this.h?this.h.next=_:this.g=_,this.h=_}}var $=new k(()=>new Q,a=>a.reset());class Q{constructor(){this.next=this.g=this.h=null}set(u,d){this.h=u,this.g=d,this.next=null}reset(){this.next=this.g=this.h=null}}let Ae,ue=!1,v=new U,g=()=>{const a=Promise.resolve(void 0);Ae=()=>{a.then(E)}};function E(){for(var a;a=x();){try{a.h.call(a.g)}catch(d){N(d)}var u=$;u.j(a),u.h<100&&(u.h++,a.next=u.g,u.g=a)}ue=!1}function I(){this.u=this.u,this.C=this.C}I.prototype.u=!1,I.prototype.dispose=function(){this.u||(this.u=!0,this.N())},I.prototype[Symbol.dispose]=function(){this.dispose()},I.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function T(a,u){this.type=a,this.g=this.target=u,this.defaultPrevented=!1}T.prototype.h=function(){this.defaultPrevented=!0};var C=(function(){if(!o.addEventListener||!Object.defineProperty)return!1;var a=!1,u=Object.defineProperty({},"passive",{get:function(){a=!0}});try{const d=()=>{};o.addEventListener("test",d,u),o.removeEventListener("test",d,u)}catch{}return a})();function y(a){return/^[\s\xa0]*$/.test(a)}function je(a,u){T.call(this,a?a.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,a&&this.init(a,u)}p(je,T),je.prototype.init=function(a,u){const d=this.type=a.type,_=a.changedTouches&&a.changedTouches.length?a.changedTouches[0]:null;this.target=a.target||a.srcElement,this.g=u,u=a.relatedTarget,u||(d=="mouseover"?u=a.fromElement:d=="mouseout"&&(u=a.toElement)),this.relatedTarget=u,_?(this.clientX=_.clientX!==void 0?_.clientX:_.pageX,this.clientY=_.clientY!==void 0?_.clientY:_.pageY,this.screenX=_.screenX||0,this.screenY=_.screenY||0):(this.clientX=a.clientX!==void 0?a.clientX:a.pageX,this.clientY=a.clientY!==void 0?a.clientY:a.pageY,this.screenX=a.screenX||0,this.screenY=a.screenY||0),this.button=a.button,this.key=a.key||"",this.ctrlKey=a.ctrlKey,this.altKey=a.altKey,this.shiftKey=a.shiftKey,this.metaKey=a.metaKey,this.pointerId=a.pointerId||0,this.pointerType=a.pointerType,this.state=a.state,this.i=a,a.defaultPrevented&&je.Z.h.call(this)},je.prototype.h=function(){je.Z.h.call(this);const a=this.i;a.preventDefault?a.preventDefault():a.returnValue=!1};var on="closure_listenable_"+(Math.random()*1e6|0),nm=0;function sm(a,u,d,_,A){this.listener=a,this.proxy=null,this.src=u,this.type=d,this.capture=!!_,this.ha=A,this.key=++nm,this.da=this.fa=!1}function Sr(a){a.da=!0,a.listener=null,a.proxy=null,a.src=null,a.ha=null}function br(a,u,d){for(const _ in a)u.call(d,a[_],_,a)}function rm(a,u){for(const d in a)u.call(void 0,a[d],d,a)}function El(a){const u={};for(const d in a)u[d]=a[d];return u}const Tl="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function vl(a,u){let d,_;for(let A=1;A<arguments.length;A++){_=arguments[A];for(d in _)a[d]=_[d];for(let R=0;R<Tl.length;R++)d=Tl[R],Object.prototype.hasOwnProperty.call(_,d)&&(a[d]=_[d])}}function Pr(a){this.src=a,this.g={},this.h=0}Pr.prototype.add=function(a,u,d,_,A){const R=a.toString();a=this.g[R],a||(a=this.g[R]=[],this.h++);const D=go(a,u,_,A);return D>-1?(u=a[D],d||(u.fa=!1)):(u=new sm(u,this.src,R,!!_,A),u.fa=d,a.push(u)),u};function mo(a,u){const d=u.type;if(d in a.g){var _=a.g[d],A=Array.prototype.indexOf.call(_,u,void 0),R;(R=A>=0)&&Array.prototype.splice.call(_,A,1),R&&(Sr(u),a.g[d].length==0&&(delete a.g[d],a.h--))}}function go(a,u,d,_){for(let A=0;A<a.length;++A){const R=a[A];if(!R.da&&R.listener==u&&R.capture==!!d&&R.ha==_)return A}return-1}var yo="closure_lm_"+(Math.random()*1e6|0),Eo={};function Il(a,u,d,_,A){if(Array.isArray(u)){for(let R=0;R<u.length;R++)Il(a,u[R],d,_,A);return null}return d=Cl(d),a&&a[on]?a.J(u,d,c(_)?!!_.capture:!1,A):im(a,u,d,!1,_,A)}function im(a,u,d,_,A,R){if(!u)throw Error("Invalid event type");const D=c(A)?!!A.capture:!!A;let j=vo(a);if(j||(a[yo]=j=new Pr(a)),d=j.add(u,d,_,D,R),d.proxy)return d;if(_=om(),d.proxy=_,_.src=a,_.listener=d,a.addEventListener)C||(A=D),A===void 0&&(A=!1),a.addEventListener(u.toString(),_,A);else if(a.attachEvent)a.attachEvent(Al(u.toString()),_);else if(a.addListener&&a.removeListener)a.addListener(_);else throw Error("addEventListener and attachEvent are unavailable.");return d}function om(){function a(d){return u.call(a.src,a.listener,d)}const u=am;return a}function wl(a,u,d,_,A){if(Array.isArray(u))for(var R=0;R<u.length;R++)wl(a,u[R],d,_,A);else _=c(_)?!!_.capture:!!_,d=Cl(d),a&&a[on]?(a=a.i,R=String(u).toString(),R in a.g&&(u=a.g[R],d=go(u,d,_,A),d>-1&&(Sr(u[d]),Array.prototype.splice.call(u,d,1),u.length==0&&(delete a.g[R],a.h--)))):a&&(a=vo(a))&&(u=a.g[u.toString()],a=-1,u&&(a=go(u,d,_,A)),(d=a>-1?u[a]:null)&&To(d))}function To(a){if(typeof a!="number"&&a&&!a.da){var u=a.src;if(u&&u[on])mo(u.i,a);else{var d=a.type,_=a.proxy;u.removeEventListener?u.removeEventListener(d,_,a.capture):u.detachEvent?u.detachEvent(Al(d),_):u.addListener&&u.removeListener&&u.removeListener(_),(d=vo(u))?(mo(d,a),d.h==0&&(d.src=null,u[yo]=null)):Sr(a)}}}function Al(a){return a in Eo?Eo[a]:Eo[a]="on"+a}function am(a,u){if(a.da)a=!0;else{u=new je(u,this);const d=a.listener,_=a.ha||a.src;a.fa&&To(a),a=d.call(_,u)}return a}function vo(a){return a=a[yo],a instanceof Pr?a:null}var Io="__closure_events_fn_"+(Math.random()*1e9>>>0);function Cl(a){return typeof a=="function"?a:(a[Io]||(a[Io]=function(u){return a.handleEvent(u)}),a[Io])}function Ve(){I.call(this),this.i=new Pr(this),this.M=this,this.G=null}p(Ve,I),Ve.prototype[on]=!0,Ve.prototype.removeEventListener=function(a,u,d,_){wl(this,a,u,d,_)};function Ue(a,u){var d,_=a.G;if(_)for(d=[];_;_=_.G)d.push(_);if(a=a.M,_=u.type||u,typeof u=="string")u=new T(u,a);else if(u instanceof T)u.target=u.target||a;else{var A=u;u=new T(_,a),vl(u,A)}A=!0;let R,D;if(d)for(D=d.length-1;D>=0;D--)R=u.g=d[D],A=Nr(R,_,!0,u)&&A;if(R=u.g=a,A=Nr(R,_,!0,u)&&A,A=Nr(R,_,!1,u)&&A,d)for(D=0;D<d.length;D++)R=u.g=d[D],A=Nr(R,_,!1,u)&&A}Ve.prototype.N=function(){if(Ve.Z.N.call(this),this.i){var a=this.i;for(const u in a.g){const d=a.g[u];for(let _=0;_<d.length;_++)Sr(d[_]);delete a.g[u],a.h--}}this.G=null},Ve.prototype.J=function(a,u,d,_){return this.i.add(String(a),u,!1,d,_)},Ve.prototype.K=function(a,u,d,_){return this.i.add(String(a),u,!0,d,_)};function Nr(a,u,d,_){if(u=a.i.g[String(u)],!u)return!0;u=u.concat();let A=!0;for(let R=0;R<u.length;++R){const D=u[R];if(D&&!D.da&&D.capture==d){const j=D.listener,Ie=D.ha||D.src;D.fa&&mo(a.i,D),A=j.call(Ie,_)!==!1&&A}}return A&&!_.defaultPrevented}function cm(a,u){if(typeof a!="function")if(a&&typeof a.handleEvent=="function")a=h(a.handleEvent,a);else throw Error("Invalid listener argument");return Number(u)>2147483647?-1:o.setTimeout(a,u||0)}function Rl(a){a.g=cm(()=>{a.g=null,a.i&&(a.i=!1,Rl(a))},a.l);const u=a.h;a.h=null,a.m.apply(null,u)}class lm extends I{constructor(u,d){super(),this.m=u,this.l=d,this.h=null,this.i=!1,this.g=null}j(u){this.h=arguments,this.g?this.i=!0:Rl(this)}N(){super.N(),this.g&&(o.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function ms(a){I.call(this),this.h=a,this.g={}}p(ms,I);var Sl=[];function bl(a){br(a.g,function(u,d){this.g.hasOwnProperty(d)&&To(u)},a),a.g={}}ms.prototype.N=function(){ms.Z.N.call(this),bl(this)},ms.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var wo=o.JSON.stringify,um=o.JSON.parse,hm=class{stringify(a){return o.JSON.stringify(a,void 0)}parse(a){return o.JSON.parse(a,void 0)}};function Pl(){}function Nl(){}var gs={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function Ao(){T.call(this,"d")}p(Ao,T);function Co(){T.call(this,"c")}p(Co,T);var an={},kl=null;function kr(){return kl=kl||new Ve}an.Ia="serverreachability";function Dl(a){T.call(this,an.Ia,a)}p(Dl,T);function ys(a){const u=kr();Ue(u,new Dl(u))}an.STAT_EVENT="statevent";function Ol(a,u){T.call(this,an.STAT_EVENT,a),this.stat=u}p(Ol,T);function Be(a){const u=kr();Ue(u,new Ol(u,a))}an.Ja="timingevent";function Vl(a,u){T.call(this,an.Ja,a),this.size=u}p(Vl,T);function Es(a,u){if(typeof a!="function")throw Error("Fn must not be null and must be a function");return o.setTimeout(function(){a()},u)}function Ts(){this.g=!0}Ts.prototype.ua=function(){this.g=!1};function dm(a,u,d,_,A,R){a.info(function(){if(a.g)if(R){var D="",j=R.split("&");for(let se=0;se<j.length;se++){var Ie=j[se].split("=");if(Ie.length>1){const Ce=Ie[0];Ie=Ie[1];const lt=Ce.split("_");D=lt.length>=2&&lt[1]=="type"?D+(Ce+"="+Ie+"&"):D+(Ce+"=redacted&")}}}else D=null;else D=R;return"XMLHTTP REQ ("+_+") [attempt "+A+"]: "+u+`
`+d+`
`+D})}function fm(a,u,d,_,A,R,D){a.info(function(){return"XMLHTTP RESP ("+_+") [ attempt "+A+"]: "+u+`
`+d+`
`+R+" "+D})}function On(a,u,d,_){a.info(function(){return"XMLHTTP TEXT ("+u+"): "+_m(a,d)+(_?" "+_:"")})}function pm(a,u){a.info(function(){return"TIMEOUT: "+u})}Ts.prototype.info=function(){};function _m(a,u){if(!a.g)return u;if(!u)return null;try{const R=JSON.parse(u);if(R){for(a=0;a<R.length;a++)if(Array.isArray(R[a])){var d=R[a];if(!(d.length<2)){var _=d[1];if(Array.isArray(_)&&!(_.length<1)){var A=_[0];if(A!="noop"&&A!="stop"&&A!="close")for(let D=1;D<_.length;D++)_[D]=""}}}}return wo(R)}catch{return u}}var Dr={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},Ml={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},Ll;function Ro(){}p(Ro,Pl),Ro.prototype.g=function(){return new XMLHttpRequest},Ll=new Ro;function vs(a){return encodeURIComponent(String(a))}function mm(a){var u=1;a=a.split(":");const d=[];for(;u>0&&a.length;)d.push(a.shift()),u--;return a.length&&d.push(a.join(":")),d}function Mt(a,u,d,_){this.j=a,this.i=u,this.l=d,this.S=_||1,this.V=new ms(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new xl}function xl(){this.i=null,this.g="",this.h=!1}var Fl={},So={};function bo(a,u,d){a.M=1,a.A=Vr(ct(u)),a.u=d,a.R=!0,Ul(a,null)}function Ul(a,u){a.F=Date.now(),Or(a),a.B=ct(a.A);var d=a.B,_=a.S;Array.isArray(_)||(_=[String(_)]),Jl(d.i,"t",_),a.C=0,d=a.j.L,a.h=new xl,a.g=mu(a.j,d?u:null,!a.u),a.P>0&&(a.O=new lm(h(a.Y,a,a.g),a.P)),u=a.V,d=a.g,_=a.ba;var A="readystatechange";Array.isArray(A)||(A&&(Sl[0]=A.toString()),A=Sl);for(let R=0;R<A.length;R++){const D=Il(d,A[R],_||u.handleEvent,!1,u.h||u);if(!D)break;u.g[D.key]=D}u=a.J?El(a.J):{},a.u?(a.v||(a.v="POST"),u["Content-Type"]="application/x-www-form-urlencoded",a.g.ea(a.B,a.v,a.u,u)):(a.v="GET",a.g.ea(a.B,a.v,null,u)),ys(),dm(a.i,a.v,a.B,a.l,a.S,a.u)}Mt.prototype.ba=function(a){a=a.target;const u=this.O;u&&Ft(a)==3?u.j():this.Y(a)},Mt.prototype.Y=function(a){try{if(a==this.g)e:{const j=Ft(this.g),Ie=this.g.ya(),se=this.g.ca();if(!(j<3)&&(j!=3||this.g&&(this.h.h||this.g.la()||iu(this.g)))){this.K||j!=4||Ie==7||(Ie==8||se<=0?ys(3):ys(2)),Po(this);var u=this.g.ca();this.X=u;var d=gm(this);if(this.o=u==200,fm(this.i,this.v,this.B,this.l,this.S,j,u),this.o){if(this.U&&!this.L){t:{if(this.g){var _,A=this.g;if((_=A.g?A.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!y(_)){var R=_;break t}}R=null}if(a=R)On(this.i,this.l,a,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,No(this,a);else{this.o=!1,this.m=3,Be(12),cn(this),Is(this);break e}}if(this.R){a=!0;let Ce;for(;!this.K&&this.C<d.length;)if(Ce=ym(this,d),Ce==So){j==4&&(this.m=4,Be(14),a=!1),On(this.i,this.l,null,"[Incomplete Response]");break}else if(Ce==Fl){this.m=4,Be(15),On(this.i,this.l,d,"[Invalid Chunk]"),a=!1;break}else On(this.i,this.l,Ce,null),No(this,Ce);if(Bl(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),j!=4||d.length!=0||this.h.h||(this.m=1,Be(16),a=!1),this.o=this.o&&a,!a)On(this.i,this.l,d,"[Invalid Chunked Response]"),cn(this),Is(this);else if(d.length>0&&!this.W){this.W=!0;var D=this.j;D.g==this&&D.aa&&!D.P&&(D.j.info("Great, no buffering proxy detected. Bytes received: "+d.length),Fo(D),D.P=!0,Be(11))}}else On(this.i,this.l,d,null),No(this,d);j==4&&cn(this),this.o&&!this.K&&(j==4?du(this.j,this):(this.o=!1,Or(this)))}else Dm(this.g),u==400&&d.indexOf("Unknown SID")>0?(this.m=3,Be(12)):(this.m=0,Be(13)),cn(this),Is(this)}}}catch{}finally{}};function gm(a){if(!Bl(a))return a.g.la();const u=iu(a.g);if(u==="")return"";let d="";const _=u.length,A=Ft(a.g)==4;if(!a.h.i){if(typeof TextDecoder>"u")return cn(a),Is(a),"";a.h.i=new o.TextDecoder}for(let R=0;R<_;R++)a.h.h=!0,d+=a.h.i.decode(u[R],{stream:!(A&&R==_-1)});return u.length=0,a.h.g+=d,a.C=0,a.h.g}function Bl(a){return a.g?a.v=="GET"&&a.M!=2&&a.j.Aa:!1}function ym(a,u){var d=a.C,_=u.indexOf(`
`,d);return _==-1?So:(d=Number(u.substring(d,_)),isNaN(d)?Fl:(_+=1,_+d>u.length?So:(u=u.slice(_,_+d),a.C=_+d,u)))}Mt.prototype.cancel=function(){this.K=!0,cn(this)};function Or(a){a.T=Date.now()+a.H,ql(a,a.H)}function ql(a,u){if(a.D!=null)throw Error("WatchDog timer not null");a.D=Es(h(a.aa,a),u)}function Po(a){a.D&&(o.clearTimeout(a.D),a.D=null)}Mt.prototype.aa=function(){this.D=null;const a=Date.now();a-this.T>=0?(pm(this.i,this.B),this.M!=2&&(ys(),Be(17)),cn(this),this.m=2,Is(this)):ql(this,this.T-a)};function Is(a){a.j.I==0||a.K||du(a.j,a)}function cn(a){Po(a);var u=a.O;u&&typeof u.dispose=="function"&&u.dispose(),a.O=null,bl(a.V),a.g&&(u=a.g,a.g=null,u.abort(),u.dispose())}function No(a,u){try{var d=a.j;if(d.I!=0&&(d.g==a||ko(d.h,a))){if(!a.L&&ko(d.h,a)&&d.I==3){try{var _=d.Ba.g.parse(u)}catch{_=null}if(Array.isArray(_)&&_.length==3){var A=_;if(A[0]==0){e:if(!d.v){if(d.g)if(d.g.F+3e3<a.F)Ur(d),xr(d);else break e;xo(d),Be(18)}}else d.xa=A[1],0<d.xa-d.K&&A[2]<37500&&d.F&&d.A==0&&!d.C&&(d.C=Es(h(d.Va,d),6e3));Wl(d.h)<=1&&d.ta&&(d.ta=void 0)}else un(d,11)}else if((a.L||d.g==a)&&Ur(d),!y(u))for(A=d.Ba.g.parse(u),u=0;u<A.length;u++){let se=A[u];const Ce=se[0];if(!(Ce<=d.K))if(d.K=Ce,se=se[1],d.I==2)if(se[0]=="c"){d.M=se[1],d.ba=se[2];const lt=se[3];lt!=null&&(d.ka=lt,d.j.info("VER="+d.ka));const hn=se[4];hn!=null&&(d.za=hn,d.j.info("SVER="+d.za));const Ut=se[5];Ut!=null&&typeof Ut=="number"&&Ut>0&&(_=1.5*Ut,d.O=_,d.j.info("backChannelRequestTimeoutMs_="+_)),_=d;const Bt=a.g;if(Bt){const qr=Bt.g?Bt.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(qr){var R=_.h;R.g||qr.indexOf("spdy")==-1&&qr.indexOf("quic")==-1&&qr.indexOf("h2")==-1||(R.j=R.l,R.g=new Set,R.h&&(Do(R,R.h),R.h=null))}if(_.G){const Uo=Bt.g?Bt.g.getResponseHeader("X-HTTP-Session-Id"):null;Uo&&(_.wa=Uo,ae(_.J,_.G,Uo))}}d.I=3,d.l&&d.l.ra(),d.aa&&(d.T=Date.now()-a.F,d.j.info("Handshake RTT: "+d.T+"ms")),_=d;var D=a;if(_.na=_u(_,_.L?_.ba:null,_.W),D.L){zl(_.h,D);var j=D,Ie=_.O;Ie&&(j.H=Ie),j.D&&(Po(j),Or(j)),_.g=D}else uu(_);d.i.length>0&&Fr(d)}else se[0]!="stop"&&se[0]!="close"||un(d,7);else d.I==3&&(se[0]=="stop"||se[0]=="close"?se[0]=="stop"?un(d,7):Lo(d):se[0]!="noop"&&d.l&&d.l.qa(se),d.A=0)}}ys(4)}catch{}}var Em=class{constructor(a,u){this.g=a,this.map=u}};function $l(a){this.l=a||10,o.PerformanceNavigationTiming?(a=o.performance.getEntriesByType("navigation"),a=a.length>0&&(a[0].nextHopProtocol=="hq"||a[0].nextHopProtocol=="h2")):a=!!(o.chrome&&o.chrome.loadTimes&&o.chrome.loadTimes()&&o.chrome.loadTimes().wasFetchedViaSpdy),this.j=a?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function jl(a){return a.h?!0:a.g?a.g.size>=a.j:!1}function Wl(a){return a.h?1:a.g?a.g.size:0}function ko(a,u){return a.h?a.h==u:a.g?a.g.has(u):!1}function Do(a,u){a.g?a.g.add(u):a.h=u}function zl(a,u){a.h&&a.h==u?a.h=null:a.g&&a.g.has(u)&&a.g.delete(u)}$l.prototype.cancel=function(){if(this.i=Hl(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const a of this.g.values())a.cancel();this.g.clear()}};function Hl(a){if(a.h!=null)return a.i.concat(a.h.G);if(a.g!=null&&a.g.size!==0){let u=a.i;for(const d of a.g.values())u=u.concat(d.G);return u}return w(a.i)}var Gl=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function Tm(a,u){if(a){a=a.split("&");for(let d=0;d<a.length;d++){const _=a[d].indexOf("=");let A,R=null;_>=0?(A=a[d].substring(0,_),R=a[d].substring(_+1)):A=a[d],u(A,R?decodeURIComponent(R.replace(/\+/g," ")):"")}}}function Lt(a){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let u;a instanceof Lt?(this.l=a.l,ws(this,a.j),this.o=a.o,this.g=a.g,As(this,a.u),this.h=a.h,Oo(this,Zl(a.i)),this.m=a.m):a&&(u=String(a).match(Gl))?(this.l=!1,ws(this,u[1]||"",!0),this.o=Cs(u[2]||""),this.g=Cs(u[3]||"",!0),As(this,u[4]),this.h=Cs(u[5]||"",!0),Oo(this,u[6]||"",!0),this.m=Cs(u[7]||"")):(this.l=!1,this.i=new Ss(null,this.l))}Lt.prototype.toString=function(){const a=[];var u=this.j;u&&a.push(Rs(u,Kl,!0),":");var d=this.g;return(d||u=="file")&&(a.push("//"),(u=this.o)&&a.push(Rs(u,Kl,!0),"@"),a.push(vs(d).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),d=this.u,d!=null&&a.push(":",String(d))),(d=this.h)&&(this.g&&d.charAt(0)!="/"&&a.push("/"),a.push(Rs(d,d.charAt(0)=="/"?wm:Im,!0))),(d=this.i.toString())&&a.push("?",d),(d=this.m)&&a.push("#",Rs(d,Cm)),a.join("")},Lt.prototype.resolve=function(a){const u=ct(this);let d=!!a.j;d?ws(u,a.j):d=!!a.o,d?u.o=a.o:d=!!a.g,d?u.g=a.g:d=a.u!=null;var _=a.h;if(d)As(u,a.u);else if(d=!!a.h){if(_.charAt(0)!="/")if(this.g&&!this.h)_="/"+_;else{var A=u.h.lastIndexOf("/");A!=-1&&(_=u.h.slice(0,A+1)+_)}if(A=_,A==".."||A==".")_="";else if(A.indexOf("./")!=-1||A.indexOf("/.")!=-1){_=A.lastIndexOf("/",0)==0,A=A.split("/");const R=[];for(let D=0;D<A.length;){const j=A[D++];j=="."?_&&D==A.length&&R.push(""):j==".."?((R.length>1||R.length==1&&R[0]!="")&&R.pop(),_&&D==A.length&&R.push("")):(R.push(j),_=!0)}_=R.join("/")}else _=A}return d?u.h=_:d=a.i.toString()!=="",d?Oo(u,Zl(a.i)):d=!!a.m,d&&(u.m=a.m),u};function ct(a){return new Lt(a)}function ws(a,u,d){a.j=d?Cs(u,!0):u,a.j&&(a.j=a.j.replace(/:$/,""))}function As(a,u){if(u){if(u=Number(u),isNaN(u)||u<0)throw Error("Bad port number "+u);a.u=u}else a.u=null}function Oo(a,u,d){u instanceof Ss?(a.i=u,Rm(a.i,a.l)):(d||(u=Rs(u,Am)),a.i=new Ss(u,a.l))}function ae(a,u,d){a.i.set(u,d)}function Vr(a){return ae(a,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),a}function Cs(a,u){return a?u?decodeURI(a.replace(/%25/g,"%2525")):decodeURIComponent(a):""}function Rs(a,u,d){return typeof a=="string"?(a=encodeURI(a).replace(u,vm),d&&(a=a.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),a):null}function vm(a){return a=a.charCodeAt(0),"%"+(a>>4&15).toString(16)+(a&15).toString(16)}var Kl=/[#\/\?@]/g,Im=/[#\?:]/g,wm=/[#\?]/g,Am=/[#\?@]/g,Cm=/#/g;function Ss(a,u){this.h=this.g=null,this.i=a||null,this.j=!!u}function ln(a){a.g||(a.g=new Map,a.h=0,a.i&&Tm(a.i,function(u,d){a.add(decodeURIComponent(u.replace(/\+/g," ")),d)}))}n=Ss.prototype,n.add=function(a,u){ln(this),this.i=null,a=Vn(this,a);let d=this.g.get(a);return d||this.g.set(a,d=[]),d.push(u),this.h+=1,this};function Ql(a,u){ln(a),u=Vn(a,u),a.g.has(u)&&(a.i=null,a.h-=a.g.get(u).length,a.g.delete(u))}function Yl(a,u){return ln(a),u=Vn(a,u),a.g.has(u)}n.forEach=function(a,u){ln(this),this.g.forEach(function(d,_){d.forEach(function(A){a.call(u,A,_,this)},this)},this)};function Xl(a,u){ln(a);let d=[];if(typeof u=="string")Yl(a,u)&&(d=d.concat(a.g.get(Vn(a,u))));else for(a=Array.from(a.g.values()),u=0;u<a.length;u++)d=d.concat(a[u]);return d}n.set=function(a,u){return ln(this),this.i=null,a=Vn(this,a),Yl(this,a)&&(this.h-=this.g.get(a).length),this.g.set(a,[u]),this.h+=1,this},n.get=function(a,u){return a?(a=Xl(this,a),a.length>0?String(a[0]):u):u};function Jl(a,u,d){Ql(a,u),d.length>0&&(a.i=null,a.g.set(Vn(a,u),w(d)),a.h+=d.length)}n.toString=function(){if(this.i)return this.i;if(!this.g)return"";const a=[],u=Array.from(this.g.keys());for(let _=0;_<u.length;_++){var d=u[_];const A=vs(d);d=Xl(this,d);for(let R=0;R<d.length;R++){let D=A;d[R]!==""&&(D+="="+vs(d[R])),a.push(D)}}return this.i=a.join("&")};function Zl(a){const u=new Ss;return u.i=a.i,a.g&&(u.g=new Map(a.g),u.h=a.h),u}function Vn(a,u){return u=String(u),a.j&&(u=u.toLowerCase()),u}function Rm(a,u){u&&!a.j&&(ln(a),a.i=null,a.g.forEach(function(d,_){const A=_.toLowerCase();_!=A&&(Ql(this,_),Jl(this,A,d))},a)),a.j=u}function Sm(a,u){const d=new Ts;if(o.Image){const _=new Image;_.onload=f(xt,d,"TestLoadImage: loaded",!0,u,_),_.onerror=f(xt,d,"TestLoadImage: error",!1,u,_),_.onabort=f(xt,d,"TestLoadImage: abort",!1,u,_),_.ontimeout=f(xt,d,"TestLoadImage: timeout",!1,u,_),o.setTimeout(function(){_.ontimeout&&_.ontimeout()},1e4),_.src=a}else u(!1)}function bm(a,u){const d=new Ts,_=new AbortController,A=setTimeout(()=>{_.abort(),xt(d,"TestPingServer: timeout",!1,u)},1e4);fetch(a,{signal:_.signal}).then(R=>{clearTimeout(A),R.ok?xt(d,"TestPingServer: ok",!0,u):xt(d,"TestPingServer: server error",!1,u)}).catch(()=>{clearTimeout(A),xt(d,"TestPingServer: error",!1,u)})}function xt(a,u,d,_,A){try{A&&(A.onload=null,A.onerror=null,A.onabort=null,A.ontimeout=null),_(d)}catch{}}function Pm(){this.g=new hm}function Vo(a){this.i=a.Sb||null,this.h=a.ab||!1}p(Vo,Pl),Vo.prototype.g=function(){return new Mr(this.i,this.h)};function Mr(a,u){Ve.call(this),this.H=a,this.o=u,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}p(Mr,Ve),n=Mr.prototype,n.open=function(a,u){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=a,this.D=u,this.readyState=1,Ps(this)},n.send=function(a){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const u={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};a&&(u.body=a),(this.H||o).fetch(new Request(this.D,u)).then(this.Pa.bind(this),this.ga.bind(this))},n.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,bs(this)),this.readyState=0},n.Pa=function(a){if(this.g&&(this.l=a,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=a.headers,this.readyState=2,Ps(this)),this.g&&(this.readyState=3,Ps(this),this.g)))if(this.responseType==="arraybuffer")a.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof o.ReadableStream<"u"&&"body"in a){if(this.j=a.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;eu(this)}else a.text().then(this.Oa.bind(this),this.ga.bind(this))};function eu(a){a.j.read().then(a.Ma.bind(a)).catch(a.ga.bind(a))}n.Ma=function(a){if(this.g){if(this.o&&a.value)this.response.push(a.value);else if(!this.o){var u=a.value?a.value:new Uint8Array(0);(u=this.B.decode(u,{stream:!a.done}))&&(this.response=this.responseText+=u)}a.done?bs(this):Ps(this),this.readyState==3&&eu(this)}},n.Oa=function(a){this.g&&(this.response=this.responseText=a,bs(this))},n.Na=function(a){this.g&&(this.response=a,bs(this))},n.ga=function(){this.g&&bs(this)};function bs(a){a.readyState=4,a.l=null,a.j=null,a.B=null,Ps(a)}n.setRequestHeader=function(a,u){this.A.append(a,u)},n.getResponseHeader=function(a){return this.h&&this.h.get(a.toLowerCase())||""},n.getAllResponseHeaders=function(){if(!this.h)return"";const a=[],u=this.h.entries();for(var d=u.next();!d.done;)d=d.value,a.push(d[0]+": "+d[1]),d=u.next();return a.join(`\r
`)};function Ps(a){a.onreadystatechange&&a.onreadystatechange.call(a)}Object.defineProperty(Mr.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(a){this.m=a?"include":"same-origin"}});function tu(a){let u="";return br(a,function(d,_){u+=_,u+=":",u+=d,u+=`\r
`}),u}function Mo(a,u,d){e:{for(_ in d){var _=!1;break e}_=!0}_||(d=tu(d),typeof a=="string"?d!=null&&vs(d):ae(a,u,d))}function he(a){Ve.call(this),this.headers=new Map,this.L=a||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}p(he,Ve);var Nm=/^https?$/i,km=["POST","PUT"];n=he.prototype,n.Fa=function(a){this.H=a},n.ea=function(a,u,d,_){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+a);u=u?u.toUpperCase():"GET",this.D=a,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():Ll.g(),this.g.onreadystatechange=m(h(this.Ca,this));try{this.B=!0,this.g.open(u,String(a),!0),this.B=!1}catch(R){nu(this,R);return}if(a=d||"",d=new Map(this.headers),_)if(Object.getPrototypeOf(_)===Object.prototype)for(var A in _)d.set(A,_[A]);else if(typeof _.keys=="function"&&typeof _.get=="function")for(const R of _.keys())d.set(R,_.get(R));else throw Error("Unknown input type for opt_headers: "+String(_));_=Array.from(d.keys()).find(R=>R.toLowerCase()=="content-type"),A=o.FormData&&a instanceof o.FormData,!(Array.prototype.indexOf.call(km,u,void 0)>=0)||_||A||d.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[R,D]of d)this.g.setRequestHeader(R,D);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(a),this.v=!1}catch(R){nu(this,R)}};function nu(a,u){a.h=!1,a.g&&(a.j=!0,a.g.abort(),a.j=!1),a.l=u,a.o=5,su(a),Lr(a)}function su(a){a.A||(a.A=!0,Ue(a,"complete"),Ue(a,"error"))}n.abort=function(a){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=a||7,Ue(this,"complete"),Ue(this,"abort"),Lr(this))},n.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),Lr(this,!0)),he.Z.N.call(this)},n.Ca=function(){this.u||(this.B||this.v||this.j?ru(this):this.Xa())},n.Xa=function(){ru(this)};function ru(a){if(a.h&&typeof i<"u"){if(a.v&&Ft(a)==4)setTimeout(a.Ca.bind(a),0);else if(Ue(a,"readystatechange"),Ft(a)==4){a.h=!1;try{const R=a.ca();e:switch(R){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var u=!0;break e;default:u=!1}var d;if(!(d=u)){var _;if(_=R===0){let D=String(a.D).match(Gl)[1]||null;!D&&o.self&&o.self.location&&(D=o.self.location.protocol.slice(0,-1)),_=!Nm.test(D?D.toLowerCase():"")}d=_}if(d)Ue(a,"complete"),Ue(a,"success");else{a.o=6;try{var A=Ft(a)>2?a.g.statusText:""}catch{A=""}a.l=A+" ["+a.ca()+"]",su(a)}}finally{Lr(a)}}}}function Lr(a,u){if(a.g){a.m&&(clearTimeout(a.m),a.m=null);const d=a.g;a.g=null,u||Ue(a,"ready");try{d.onreadystatechange=null}catch{}}}n.isActive=function(){return!!this.g};function Ft(a){return a.g?a.g.readyState:0}n.ca=function(){try{return Ft(this)>2?this.g.status:-1}catch{return-1}},n.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},n.La=function(a){if(this.g){var u=this.g.responseText;return a&&u.indexOf(a)==0&&(u=u.substring(a.length)),um(u)}};function iu(a){try{if(!a.g)return null;if("response"in a.g)return a.g.response;switch(a.F){case"":case"text":return a.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in a.g)return a.g.mozResponseArrayBuffer}return null}catch{return null}}function Dm(a){const u={};a=(a.g&&Ft(a)>=2&&a.g.getAllResponseHeaders()||"").split(`\r
`);for(let _=0;_<a.length;_++){if(y(a[_]))continue;var d=mm(a[_]);const A=d[0];if(d=d[1],typeof d!="string")continue;d=d.trim();const R=u[A]||[];u[A]=R,R.push(d)}rm(u,function(_){return _.join(", ")})}n.ya=function(){return this.o},n.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function Ns(a,u,d){return d&&d.internalChannelParams&&d.internalChannelParams[a]||u}function ou(a){this.za=0,this.i=[],this.j=new Ts,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=Ns("failFast",!1,a),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=Ns("baseRetryDelayMs",5e3,a),this.Za=Ns("retryDelaySeedMs",1e4,a),this.Ta=Ns("forwardChannelMaxRetries",2,a),this.va=Ns("forwardChannelRequestTimeoutMs",2e4,a),this.ma=a&&a.xmlHttpFactory||void 0,this.Ua=a&&a.Rb||void 0,this.Aa=a&&a.useFetchStreams||!1,this.O=void 0,this.L=a&&a.supportsCrossDomainXhr||!1,this.M="",this.h=new $l(a&&a.concurrentRequestLimit),this.Ba=new Pm,this.S=a&&a.fastHandshake||!1,this.R=a&&a.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=a&&a.Pb||!1,a&&a.ua&&this.j.ua(),a&&a.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&a&&a.detectBufferingProxy||!1,this.ia=void 0,a&&a.longPollingTimeout&&a.longPollingTimeout>0&&(this.ia=a.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}n=ou.prototype,n.ka=8,n.I=1,n.connect=function(a,u,d,_){Be(0),this.W=a,this.H=u||{},d&&_!==void 0&&(this.H.OSID=d,this.H.OAID=_),this.F=this.X,this.J=_u(this,null,this.W),Fr(this)};function Lo(a){if(au(a),a.I==3){var u=a.V++,d=ct(a.J);if(ae(d,"SID",a.M),ae(d,"RID",u),ae(d,"TYPE","terminate"),ks(a,d),u=new Mt(a,a.j,u),u.M=2,u.A=Vr(ct(d)),d=!1,o.navigator&&o.navigator.sendBeacon)try{d=o.navigator.sendBeacon(u.A.toString(),"")}catch{}!d&&o.Image&&(new Image().src=u.A,d=!0),d||(u.g=mu(u.j,null),u.g.ea(u.A)),u.F=Date.now(),Or(u)}pu(a)}function xr(a){a.g&&(Fo(a),a.g.cancel(),a.g=null)}function au(a){xr(a),a.v&&(o.clearTimeout(a.v),a.v=null),Ur(a),a.h.cancel(),a.m&&(typeof a.m=="number"&&o.clearTimeout(a.m),a.m=null)}function Fr(a){if(!jl(a.h)&&!a.m){a.m=!0;var u=a.Ea;Ae||g(),ue||(Ae(),ue=!0),v.add(u,a),a.D=0}}function Om(a,u){return Wl(a.h)>=a.h.j-(a.m?1:0)?!1:a.m?(a.i=u.G.concat(a.i),!0):a.I==1||a.I==2||a.D>=(a.Sa?0:a.Ta)?!1:(a.m=Es(h(a.Ea,a,u),fu(a,a.D)),a.D++,!0)}n.Ea=function(a){if(this.m)if(this.m=null,this.I==1){if(!a){this.V=Math.floor(Math.random()*1e5),a=this.V++;const A=new Mt(this,this.j,a);let R=this.o;if(this.U&&(R?(R=El(R),vl(R,this.U)):R=this.U),this.u!==null||this.R||(A.J=R,R=null),this.S)e:{for(var u=0,d=0;d<this.i.length;d++){t:{var _=this.i[d];if("__data__"in _.map&&(_=_.map.__data__,typeof _=="string")){_=_.length;break t}_=void 0}if(_===void 0)break;if(u+=_,u>4096){u=d;break e}if(u===4096||d===this.i.length-1){u=d+1;break e}}u=1e3}else u=1e3;u=lu(this,A,u),d=ct(this.J),ae(d,"RID",a),ae(d,"CVER",22),this.G&&ae(d,"X-HTTP-Session-Id",this.G),ks(this,d),R&&(this.R?u="headers="+vs(tu(R))+"&"+u:this.u&&Mo(d,this.u,R)),Do(this.h,A),this.Ra&&ae(d,"TYPE","init"),this.S?(ae(d,"$req",u),ae(d,"SID","null"),A.U=!0,bo(A,d,null)):bo(A,d,u),this.I=2}}else this.I==3&&(a?cu(this,a):this.i.length==0||jl(this.h)||cu(this))};function cu(a,u){var d;u?d=u.l:d=a.V++;const _=ct(a.J);ae(_,"SID",a.M),ae(_,"RID",d),ae(_,"AID",a.K),ks(a,_),a.u&&a.o&&Mo(_,a.u,a.o),d=new Mt(a,a.j,d,a.D+1),a.u===null&&(d.J=a.o),u&&(a.i=u.G.concat(a.i)),u=lu(a,d,1e3),d.H=Math.round(a.va*.5)+Math.round(a.va*.5*Math.random()),Do(a.h,d),bo(d,_,u)}function ks(a,u){a.H&&br(a.H,function(d,_){ae(u,_,d)}),a.l&&br({},function(d,_){ae(u,_,d)})}function lu(a,u,d){d=Math.min(a.i.length,d);const _=a.l?h(a.l.Ka,a.l,a):null;e:{var A=a.i;let j=-1;for(;;){const Ie=["count="+d];j==-1?d>0?(j=A[0].g,Ie.push("ofs="+j)):j=0:Ie.push("ofs="+j);let se=!0;for(let Ce=0;Ce<d;Ce++){var R=A[Ce].g;const lt=A[Ce].map;if(R-=j,R<0)j=Math.max(0,A[Ce].g-100),se=!1;else try{R="req"+R+"_"||"";try{var D=lt instanceof Map?lt:Object.entries(lt);for(const[hn,Ut]of D){let Bt=Ut;c(Ut)&&(Bt=wo(Ut)),Ie.push(R+hn+"="+encodeURIComponent(Bt))}}catch(hn){throw Ie.push(R+"type="+encodeURIComponent("_badmap")),hn}}catch{_&&_(lt)}}if(se){D=Ie.join("&");break e}}D=void 0}return a=a.i.splice(0,d),u.G=a,D}function uu(a){if(!a.g&&!a.v){a.Y=1;var u=a.Da;Ae||g(),ue||(Ae(),ue=!0),v.add(u,a),a.A=0}}function xo(a){return a.g||a.v||a.A>=3?!1:(a.Y++,a.v=Es(h(a.Da,a),fu(a,a.A)),a.A++,!0)}n.Da=function(){if(this.v=null,hu(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var a=4*this.T;this.j.info("BP detection timer enabled: "+a),this.B=Es(h(this.Wa,this),a)}},n.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,Be(10),xr(this),hu(this))};function Fo(a){a.B!=null&&(o.clearTimeout(a.B),a.B=null)}function hu(a){a.g=new Mt(a,a.j,"rpc",a.Y),a.u===null&&(a.g.J=a.o),a.g.P=0;var u=ct(a.na);ae(u,"RID","rpc"),ae(u,"SID",a.M),ae(u,"AID",a.K),ae(u,"CI",a.F?"0":"1"),!a.F&&a.ia&&ae(u,"TO",a.ia),ae(u,"TYPE","xmlhttp"),ks(a,u),a.u&&a.o&&Mo(u,a.u,a.o),a.O&&(a.g.H=a.O);var d=a.g;a=a.ba,d.M=1,d.A=Vr(ct(u)),d.u=null,d.R=!0,Ul(d,a)}n.Va=function(){this.C!=null&&(this.C=null,xr(this),xo(this),Be(19))};function Ur(a){a.C!=null&&(o.clearTimeout(a.C),a.C=null)}function du(a,u){var d=null;if(a.g==u){Ur(a),Fo(a),a.g=null;var _=2}else if(ko(a.h,u))d=u.G,zl(a.h,u),_=1;else return;if(a.I!=0){if(u.o)if(_==1){d=u.u?u.u.length:0,u=Date.now()-u.F;var A=a.D;_=kr(),Ue(_,new Vl(_,d)),Fr(a)}else uu(a);else if(A=u.m,A==3||A==0&&u.X>0||!(_==1&&Om(a,u)||_==2&&xo(a)))switch(d&&d.length>0&&(u=a.h,u.i=u.i.concat(d)),A){case 1:un(a,5);break;case 4:un(a,10);break;case 3:un(a,6);break;default:un(a,2)}}}function fu(a,u){let d=a.Qa+Math.floor(Math.random()*a.Za);return a.isActive()||(d*=2),d*u}function un(a,u){if(a.j.info("Error code "+u),u==2){var d=h(a.bb,a),_=a.Ua;const A=!_;_=new Lt(_||"//www.google.com/images/cleardot.gif"),o.location&&o.location.protocol=="http"||ws(_,"https"),Vr(_),A?Sm(_.toString(),d):bm(_.toString(),d)}else Be(2);a.I=0,a.l&&a.l.pa(u),pu(a),au(a)}n.bb=function(a){a?(this.j.info("Successfully pinged google.com"),Be(2)):(this.j.info("Failed to ping google.com"),Be(1))};function pu(a){if(a.I=0,a.ja=[],a.l){const u=Hl(a.h);(u.length!=0||a.i.length!=0)&&(S(a.ja,u),S(a.ja,a.i),a.h.i.length=0,w(a.i),a.i.length=0),a.l.oa()}}function _u(a,u,d){var _=d instanceof Lt?ct(d):new Lt(d);if(_.g!="")u&&(_.g=u+"."+_.g),As(_,_.u);else{var A=o.location;_=A.protocol,u=u?u+"."+A.hostname:A.hostname,A=+A.port;const R=new Lt(null);_&&ws(R,_),u&&(R.g=u),A&&As(R,A),d&&(R.h=d),_=R}return d=a.G,u=a.wa,d&&u&&ae(_,d,u),ae(_,"VER",a.ka),ks(a,_),_}function mu(a,u,d){if(u&&!a.L)throw Error("Can't create secondary domain capable XhrIo object.");return u=a.Aa&&!a.ma?new he(new Vo({ab:d})):new he(a.ma),u.Fa(a.L),u}n.isActive=function(){return!!this.l&&this.l.isActive(this)};function gu(){}n=gu.prototype,n.ra=function(){},n.qa=function(){},n.pa=function(){},n.oa=function(){},n.isActive=function(){return!0},n.Ka=function(){};function Br(){}Br.prototype.g=function(a,u){return new Xe(a,u)};function Xe(a,u){Ve.call(this),this.g=new ou(u),this.l=a,this.h=u&&u.messageUrlParams||null,a=u&&u.messageHeaders||null,u&&u.clientProtocolHeaderRequired&&(a?a["X-Client-Protocol"]="webchannel":a={"X-Client-Protocol":"webchannel"}),this.g.o=a,a=u&&u.initMessageHeaders||null,u&&u.messageContentType&&(a?a["X-WebChannel-Content-Type"]=u.messageContentType:a={"X-WebChannel-Content-Type":u.messageContentType}),u&&u.sa&&(a?a["X-WebChannel-Client-Profile"]=u.sa:a={"X-WebChannel-Client-Profile":u.sa}),this.g.U=a,(a=u&&u.Qb)&&!y(a)&&(this.g.u=a),this.A=u&&u.supportsCrossDomainXhr||!1,this.v=u&&u.sendRawJson||!1,(u=u&&u.httpSessionIdParam)&&!y(u)&&(this.g.G=u,a=this.h,a!==null&&u in a&&(a=this.h,u in a&&delete a[u])),this.j=new Mn(this)}p(Xe,Ve),Xe.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},Xe.prototype.close=function(){Lo(this.g)},Xe.prototype.o=function(a){var u=this.g;if(typeof a=="string"){var d={};d.__data__=a,a=d}else this.v&&(d={},d.__data__=wo(a),a=d);u.i.push(new Em(u.Ya++,a)),u.I==3&&Fr(u)},Xe.prototype.N=function(){this.g.l=null,delete this.j,Lo(this.g),delete this.g,Xe.Z.N.call(this)};function yu(a){Ao.call(this),a.__headers__&&(this.headers=a.__headers__,this.statusCode=a.__status__,delete a.__headers__,delete a.__status__);var u=a.__sm__;if(u){e:{for(const d in u){a=d;break e}a=void 0}(this.i=a)&&(a=this.i,u=u!==null&&a in u?u[a]:void 0),this.data=u}else this.data=a}p(yu,Ao);function Eu(){Co.call(this),this.status=1}p(Eu,Co);function Mn(a){this.g=a}p(Mn,gu),Mn.prototype.ra=function(){Ue(this.g,"a")},Mn.prototype.qa=function(a){Ue(this.g,new yu(a))},Mn.prototype.pa=function(a){Ue(this.g,new Eu)},Mn.prototype.oa=function(){Ue(this.g,"b")},Br.prototype.createWebChannel=Br.prototype.g,Xe.prototype.send=Xe.prototype.o,Xe.prototype.open=Xe.prototype.m,Xe.prototype.close=Xe.prototype.close,$d=function(){return new Br},qd=function(){return kr()},Bd=an,la={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},Dr.NO_ERROR=0,Dr.TIMEOUT=8,Dr.HTTP_ERROR=6,Jr=Dr,Ml.COMPLETE="complete",Ud=Ml,Nl.EventType=gs,gs.OPEN="a",gs.CLOSE="b",gs.ERROR="c",gs.MESSAGE="d",Ve.prototype.listen=Ve.prototype.J,xs=Nl,he.prototype.listenOnce=he.prototype.K,he.prototype.getLastError=he.prototype.Ha,he.prototype.getLastErrorCode=he.prototype.ya,he.prototype.getStatus=he.prototype.ca,he.prototype.getResponseJson=he.prototype.La,he.prototype.getResponseText=he.prototype.la,he.prototype.send=he.prototype.ea,he.prototype.setWithCredentials=he.prototype.Fa,Fd=he}).apply(typeof $r<"u"?$r:typeof self<"u"?self:typeof window<"u"?window:{});const Pu="@firebase/firestore",Nu="4.9.2";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Le{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}Le.UNAUTHENTICATED=new Le(null),Le.GOOGLE_CREDENTIALS=new Le("google-credentials-uid"),Le.FIRST_PARTY=new Le("first-party-uid"),Le.MOCK_USER=new Le("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let os="12.3.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vn=new Fi("@firebase/firestore");function xn(){return vn.logLevel}function M(n,...e){if(vn.logLevel<=W.DEBUG){const t=e.map(tc);vn.debug(`Firestore (${os}): ${n}`,...t)}}function Nt(n,...e){if(vn.logLevel<=W.ERROR){const t=e.map(tc);vn.error(`Firestore (${os}): ${n}`,...t)}}function Kn(n,...e){if(vn.logLevel<=W.WARN){const t=e.map(tc);vn.warn(`Firestore (${os}): ${n}`,...t)}}function tc(n){if(typeof n=="string")return n;try{/**
* @license
* Copyright 2020 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/return(function(t){return JSON.stringify(t)})(n)}catch{return n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function F(n,e,t){let s="Unexpected state";typeof e=="string"?s=e:t=e,jd(n,s,t)}function jd(n,e,t){let s=`FIRESTORE (${os}) INTERNAL ASSERTION FAILED: ${e} (ID: ${n.toString(16)})`;if(t!==void 0)try{s+=" CONTEXT: "+JSON.stringify(t)}catch{s+=" CONTEXT: "+t}throw Nt(s),new Error(s)}function Z(n,e,t,s){let r="Unexpected state";typeof t=="string"?r=t:s=t,n||jd(e,r,s)}function B(n,e){return n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const b={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class V extends It{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _t{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wd{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class uy{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable((()=>t(Le.UNAUTHENTICATED)))}shutdown(){}}class hy{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable((()=>t(this.token.user)))}shutdown(){this.changeListener=null}}class dy{constructor(e){this.t=e,this.currentUser=Le.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,t){Z(this.o===void 0,42304);let s=this.i;const r=l=>this.i!==s?(s=this.i,t(l)):Promise.resolve();let i=new _t;this.o=()=>{this.i++,this.currentUser=this.u(),i.resolve(),i=new _t,e.enqueueRetryable((()=>r(this.currentUser)))};const o=()=>{const l=i;e.enqueueRetryable((async()=>{await l.promise,await r(this.currentUser)}))},c=l=>{M("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=l,this.o&&(this.auth.addAuthTokenListener(this.o),o())};this.t.onInit((l=>c(l))),setTimeout((()=>{if(!this.auth){const l=this.t.getImmediate({optional:!0});l?c(l):(M("FirebaseAuthCredentialsProvider","Auth not yet detected"),i.resolve(),i=new _t)}}),0),o()}getToken(){const e=this.i,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then((s=>this.i!==e?(M("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):s?(Z(typeof s.accessToken=="string",31837,{l:s}),new Wd(s.accessToken,this.currentUser)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const e=this.auth&&this.auth.getUid();return Z(e===null||typeof e=="string",2055,{h:e}),new Le(e)}}class fy{constructor(e,t,s){this.P=e,this.T=t,this.I=s,this.type="FirstParty",this.user=Le.FIRST_PARTY,this.A=new Map}R(){return this.I?this.I():null}get headers(){this.A.set("X-Goog-AuthUser",this.P);const e=this.R();return e&&this.A.set("Authorization",e),this.T&&this.A.set("X-Goog-Iam-Authorization-Token",this.T),this.A}}class py{constructor(e,t,s){this.P=e,this.T=t,this.I=s}getToken(){return Promise.resolve(new fy(this.P,this.T,this.I))}start(e,t){e.enqueueRetryable((()=>t(Le.FIRST_PARTY)))}shutdown(){}invalidateToken(){}}class ku{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class _y{constructor(e,t){this.V=t,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,ht(e)&&e.settings.appCheckToken&&(this.p=e.settings.appCheckToken)}start(e,t){Z(this.o===void 0,3512);const s=i=>{i.error!=null&&M("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${i.error.message}`);const o=i.token!==this.m;return this.m=i.token,M("FirebaseAppCheckTokenProvider",`Received ${o?"new":"existing"} token.`),o?t(i.token):Promise.resolve()};this.o=i=>{e.enqueueRetryable((()=>s(i)))};const r=i=>{M("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=i,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit((i=>r(i))),setTimeout((()=>{if(!this.appCheck){const i=this.V.getImmediate({optional:!0});i?r(i):M("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}}),0)}getToken(){if(this.p)return Promise.resolve(new ku(this.p));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then((t=>t?(Z(typeof t.token=="string",44558,{tokenResult:t}),this.m=t.token,new ku(t.token)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function my(n){const e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(n);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let s=0;s<n;s++)t[s]=Math.floor(256*Math.random());return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nc{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516);let s="";for(;s.length<20;){const r=my(40);for(let i=0;i<r.length;++i)s.length<20&&r[i]<t&&(s+=e.charAt(r[i]%62))}return s}}function H(n,e){return n<e?-1:n>e?1:0}function ua(n,e){const t=Math.min(n.length,e.length);for(let s=0;s<t;s++){const r=n.charAt(s),i=e.charAt(s);if(r!==i)return $o(r)===$o(i)?H(r,i):$o(r)?1:-1}return H(n.length,e.length)}const gy=55296,yy=57343;function $o(n){const e=n.charCodeAt(0);return e>=gy&&e<=yy}function Qn(n,e,t){return n.length===e.length&&n.every(((s,r)=>t(s,e[r])))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ha="__name__";class ut{constructor(e,t,s){t===void 0?t=0:t>e.length&&F(637,{offset:t,range:e.length}),s===void 0?s=e.length-t:s>e.length-t&&F(1746,{length:s,range:e.length-t}),this.segments=e,this.offset=t,this.len=s}get length(){return this.len}isEqual(e){return ut.comparator(this,e)===0}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof ut?e.forEach((s=>{t.push(s)})):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,s=this.limit();t<s;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const s=Math.min(e.length,t.length);for(let r=0;r<s;r++){const i=ut.compareSegments(e.get(r),t.get(r));if(i!==0)return i}return H(e.length,t.length)}static compareSegments(e,t){const s=ut.isNumericId(e),r=ut.isNumericId(t);return s&&!r?-1:!s&&r?1:s&&r?ut.extractNumericId(e).compare(ut.extractNumericId(t)):ua(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return Ht.fromString(e.substring(4,e.length-2))}}class oe extends ut{construct(e,t,s){return new oe(e,t,s)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const s of e){if(s.indexOf("//")>=0)throw new V(b.INVALID_ARGUMENT,`Invalid segment (${s}). Paths must not contain // in them.`);t.push(...s.split("/").filter((r=>r.length>0)))}return new oe(t)}static emptyPath(){return new oe([])}}const Ey=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class ke extends ut{construct(e,t,s){return new ke(e,t,s)}static isValidIdentifier(e){return Ey.test(e)}canonicalString(){return this.toArray().map((e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),ke.isValidIdentifier(e)||(e="`"+e+"`"),e))).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===ha}static keyField(){return new ke([ha])}static fromServerFormat(e){const t=[];let s="",r=0;const i=()=>{if(s.length===0)throw new V(b.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(s),s=""};let o=!1;for(;r<e.length;){const c=e[r];if(c==="\\"){if(r+1===e.length)throw new V(b.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const l=e[r+1];if(l!=="\\"&&l!=="."&&l!=="`")throw new V(b.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);s+=l,r+=2}else c==="`"?(o=!o,r++):c!=="."||o?(s+=c,r++):(i(),r++)}if(i(),o)throw new V(b.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new ke(t)}static emptyPath(){return new ke([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class L{constructor(e){this.path=e}static fromPath(e){return new L(oe.fromString(e))}static fromName(e){return new L(oe.fromString(e).popFirst(5))}static empty(){return new L(oe.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&oe.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return oe.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new L(new oe(e.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function zd(n,e,t){if(!t)throw new V(b.INVALID_ARGUMENT,`Function ${n}() cannot be called with an empty ${e}.`)}function Ty(n,e,t,s){if(e===!0&&s===!0)throw new V(b.INVALID_ARGUMENT,`${n} and ${t} cannot be used together.`)}function Du(n){if(!L.isDocumentKey(n))throw new V(b.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${n} has ${n.length}.`)}function Ou(n){if(L.isDocumentKey(n))throw new V(b.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${n} has ${n.length}.`)}function Hd(n){return typeof n=="object"&&n!==null&&(Object.getPrototypeOf(n)===Object.prototype||Object.getPrototypeOf(n)===null)}function Ui(n){if(n===void 0)return"undefined";if(n===null)return"null";if(typeof n=="string")return n.length>20&&(n=`${n.substring(0,20)}...`),JSON.stringify(n);if(typeof n=="number"||typeof n=="boolean")return""+n;if(typeof n=="object"){if(n instanceof Array)return"an array";{const e=(function(s){return s.constructor?s.constructor.name:null})(n);return e?`a custom ${e} object`:"an object"}}return typeof n=="function"?"a function":F(12329,{type:typeof n})}function Fe(n,e){if("_delegate"in n&&(n=n._delegate),!(n instanceof e)){if(e.name===n.constructor.name)throw new V(b.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const t=Ui(n);throw new V(b.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return n}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Te(n,e){const t={typeString:n};return e&&(t.value=e),t}function pr(n,e){if(!Hd(n))throw new V(b.INVALID_ARGUMENT,"JSON must be an object");let t;for(const s in e)if(e[s]){const r=e[s].typeString,i="value"in e[s]?{value:e[s].value}:void 0;if(!(s in n)){t=`JSON missing required field: '${s}'`;break}const o=n[s];if(r&&typeof o!==r){t=`JSON field '${s}' must be a ${r}.`;break}if(i!==void 0&&o!==i.value){t=`Expected '${s}' field to equal '${i.value}'`;break}}if(t)throw new V(b.INVALID_ARGUMENT,t);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vu=-62135596800,Mu=1e6;class le{static now(){return le.fromMillis(Date.now())}static fromDate(e){return le.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),s=Math.floor((e-1e3*t)*Mu);return new le(t,s)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new V(b.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new V(b.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<Vu)throw new V(b.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new V(b.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/Mu}_compareTo(e){return this.seconds===e.seconds?H(this.nanoseconds,e.nanoseconds):H(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:le._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(pr(e,le._jsonSchema))return new le(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-Vu;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}le._jsonSchemaVersion="firestore/timestamp/1.0",le._jsonSchema={type:Te("string",le._jsonSchemaVersion),seconds:Te("number"),nanoseconds:Te("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class q{static fromTimestamp(e){return new q(e)}static min(){return new q(new le(0,0))}static max(){return new q(new le(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nr=-1;function vy(n,e){const t=n.toTimestamp().seconds,s=n.toTimestamp().nanoseconds+1,r=q.fromTimestamp(s===1e9?new le(t+1,0):new le(t,s));return new Yt(r,L.empty(),e)}function Iy(n){return new Yt(n.readTime,n.key,nr)}class Yt{constructor(e,t,s){this.readTime=e,this.documentKey=t,this.largestBatchId=s}static min(){return new Yt(q.min(),L.empty(),nr)}static max(){return new Yt(q.max(),L.empty(),nr)}}function wy(n,e){let t=n.readTime.compareTo(e.readTime);return t!==0?t:(t=L.comparator(n.documentKey,e.documentKey),t!==0?t:H(n.largestBatchId,e.largestBatchId))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ay="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class Cy{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach((e=>e()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function as(n){if(n.code!==b.FAILED_PRECONDITION||n.message!==Ay)throw n;M("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class P{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e((t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t)}),(t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t)}))}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&F(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new P(((s,r)=>{this.nextCallback=i=>{this.wrapSuccess(e,i).next(s,r)},this.catchCallback=i=>{this.wrapFailure(t,i).next(s,r)}}))}toPromise(){return new Promise(((e,t)=>{this.next(e,t)}))}wrapUserFunction(e){try{const t=e();return t instanceof P?t:P.resolve(t)}catch(t){return P.reject(t)}}wrapSuccess(e,t){return e?this.wrapUserFunction((()=>e(t))):P.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction((()=>e(t))):P.reject(t)}static resolve(e){return new P(((t,s)=>{t(e)}))}static reject(e){return new P(((t,s)=>{s(e)}))}static waitFor(e){return new P(((t,s)=>{let r=0,i=0,o=!1;e.forEach((c=>{++r,c.next((()=>{++i,o&&i===r&&t()}),(l=>s(l)))})),o=!0,i===r&&t()}))}static or(e){let t=P.resolve(!1);for(const s of e)t=t.next((r=>r?P.resolve(r):s()));return t}static forEach(e,t){const s=[];return e.forEach(((r,i)=>{s.push(t.call(this,r,i))})),this.waitFor(s)}static mapArray(e,t){return new P(((s,r)=>{const i=e.length,o=new Array(i);let c=0;for(let l=0;l<i;l++){const h=l;t(e[h]).next((f=>{o[h]=f,++c,c===i&&s(o)}),(f=>r(f)))}}))}static doWhile(e,t){return new P(((s,r)=>{const i=()=>{e()===!0?t().next((()=>{i()}),r):s()};i()}))}}function Ry(n){const e=n.match(/Android ([\d.]+)/i),t=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(t)}function cs(n){return n.name==="IndexedDbTransactionError"}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bi{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=s=>this.ae(s),this.ue=s=>t.writeSequenceNumber(s))}ae(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.ue&&this.ue(e),e}}Bi.ce=-1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sc=-1;function qi(n){return n==null}function hi(n){return n===0&&1/n==-1/0}function Sy(n){return typeof n=="number"&&Number.isInteger(n)&&!hi(n)&&n<=Number.MAX_SAFE_INTEGER&&n>=Number.MIN_SAFE_INTEGER}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gd="";function by(n){let e="";for(let t=0;t<n.length;t++)e.length>0&&(e=Lu(e)),e=Py(n.get(t),e);return Lu(e)}function Py(n,e){let t=e;const s=n.length;for(let r=0;r<s;r++){const i=n.charAt(r);switch(i){case"\0":t+="";break;case Gd:t+="";break;default:t+=i}}return t}function Lu(n){return n+Gd+""}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xu(n){let e=0;for(const t in n)Object.prototype.hasOwnProperty.call(n,t)&&e++;return e}function sn(n,e){for(const t in n)Object.prototype.hasOwnProperty.call(n,t)&&e(t,n[t])}function Ny(n,e){const t=[];for(const s in n)Object.prototype.hasOwnProperty.call(n,s)&&t.push(e(n[s],s,n));return t}function Kd(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ve=class da{constructor(e,t){this.comparator=e,this.root=t||Gt.EMPTY}insert(e,t){return new da(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,Gt.BLACK,null,null))}remove(e){return new da(this.comparator,this.root.remove(e,this.comparator).copy(null,null,Gt.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){const s=this.comparator(e,t.key);if(s===0)return t.value;s<0?t=t.left:s>0&&(t=t.right)}return null}indexOf(e){let t=0,s=this.root;for(;!s.isEmpty();){const r=this.comparator(e,s.key);if(r===0)return t+s.left.size;r<0?s=s.left:(t+=s.left.size+1,s=s.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal(((t,s)=>(e(t,s),!1)))}toString(){const e=[];return this.inorderTraversal(((t,s)=>(e.push(`${t}:${s}`),!1))),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new jr(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new jr(this.root,e,this.comparator,!1)}getReverseIterator(){return new jr(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new jr(this.root,e,this.comparator,!0)}},jr=class{constructor(e,t,s,r){this.isReverse=r,this.nodeStack=[];let i=1;for(;!e.isEmpty();)if(i=t?s(e.key,t):1,t&&r&&(i*=-1),i<0)e=this.isReverse?e.left:e.right;else{if(i===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}},Gt=class At{constructor(e,t,s,r,i){this.key=e,this.value=t,this.color=s??At.RED,this.left=r??At.EMPTY,this.right=i??At.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,s,r,i){return new At(e??this.key,t??this.value,s??this.color,r??this.left,i??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,s){let r=this;const i=s(e,r.key);return r=i<0?r.copy(null,null,null,r.left.insert(e,t,s),null):i===0?r.copy(null,t,null,null,null):r.copy(null,null,null,null,r.right.insert(e,t,s)),r.fixUp()}removeMin(){if(this.left.isEmpty())return At.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let s,r=this;if(t(e,r.key)<0)r.left.isEmpty()||r.left.isRed()||r.left.left.isRed()||(r=r.moveRedLeft()),r=r.copy(null,null,null,r.left.remove(e,t),null);else{if(r.left.isRed()&&(r=r.rotateRight()),r.right.isEmpty()||r.right.isRed()||r.right.left.isRed()||(r=r.moveRedRight()),t(e,r.key)===0){if(r.right.isEmpty())return At.EMPTY;s=r.right.min(),r=r.copy(s.key,s.value,null,null,r.right.removeMin())}r=r.copy(null,null,null,null,r.right.remove(e,t))}return r.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,At.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,At.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw F(43730,{key:this.key,value:this.value});if(this.right.isRed())throw F(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw F(27949);return e+(this.isRed()?0:1)}};Gt.EMPTY=null,Gt.RED=!0,Gt.BLACK=!1;Gt.EMPTY=new class{constructor(){this.size=0}get key(){throw F(57766)}get value(){throw F(16141)}get color(){throw F(16727)}get left(){throw F(29726)}get right(){throw F(36894)}copy(e,t,s,r,i){return this}insert(e,t,s){return new Gt(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class we{constructor(e){this.comparator=e,this.data=new ve(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal(((t,s)=>(e(t),!1)))}forEachInRange(e,t){const s=this.data.getIteratorFrom(e[0]);for(;s.hasNext();){const r=s.getNext();if(this.comparator(r.key,e[1])>=0)return;t(r.key)}}forEachWhile(e,t){let s;for(s=t!==void 0?this.data.getIteratorFrom(t):this.data.getIterator();s.hasNext();)if(!e(s.getNext().key))return}firstAfterOrEqual(e){const t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new Fu(this.data.getIterator())}getIteratorFrom(e){return new Fu(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach((s=>{t=t.add(s)})),t}isEqual(e){if(!(e instanceof we)||this.size!==e.size)return!1;const t=this.data.getIterator(),s=e.data.getIterator();for(;t.hasNext();){const r=t.getNext().key,i=s.getNext().key;if(this.comparator(r,i)!==0)return!1}return!0}toArray(){const e=[];return this.forEach((t=>{e.push(t)})),e}toString(){const e=[];return this.forEach((t=>e.push(t))),"SortedSet("+e.toString()+")"}copy(e){const t=new we(this.comparator);return t.data=e,t}}class Fu{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Je{constructor(e){this.fields=e,e.sort(ke.comparator)}static empty(){return new Je([])}unionWith(e){let t=new we(ke.comparator);for(const s of this.fields)t=t.add(s);for(const s of e)t=t.add(s);return new Je(t.toArray())}covers(e){for(const t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return Qn(this.fields,e.fields,((t,s)=>t.isEqual(s)))}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qd extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Oe{constructor(e){this.binaryString=e}static fromBase64String(e){const t=(function(r){try{return atob(r)}catch(i){throw typeof DOMException<"u"&&i instanceof DOMException?new Qd("Invalid base64 string: "+i):i}})(e);return new Oe(t)}static fromUint8Array(e){const t=(function(r){let i="";for(let o=0;o<r.length;++o)i+=String.fromCharCode(r[o]);return i})(e);return new Oe(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return(function(t){return btoa(t)})(this.binaryString)}toUint8Array(){return(function(t){const s=new Uint8Array(t.length);for(let r=0;r<t.length;r++)s[r]=t.charCodeAt(r);return s})(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return H(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}Oe.EMPTY_BYTE_STRING=new Oe("");const ky=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Xt(n){if(Z(!!n,39018),typeof n=="string"){let e=0;const t=ky.exec(n);if(Z(!!t,46558,{timestamp:n}),t[1]){let r=t[1];r=(r+"000000000").substr(0,9),e=Number(r)}const s=new Date(n);return{seconds:Math.floor(s.getTime()/1e3),nanos:e}}return{seconds:_e(n.seconds),nanos:_e(n.nanos)}}function _e(n){return typeof n=="number"?n:typeof n=="string"?Number(n):0}function Jt(n){return typeof n=="string"?Oe.fromBase64String(n):Oe.fromUint8Array(n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yd="server_timestamp",Xd="__type__",Jd="__previous_value__",Zd="__local_write_time__";function rc(n){var t,s;return((s=(((t=n==null?void 0:n.mapValue)==null?void 0:t.fields)||{})[Xd])==null?void 0:s.stringValue)===Yd}function $i(n){const e=n.mapValue.fields[Jd];return rc(e)?$i(e):e}function sr(n){const e=Xt(n.mapValue.fields[Zd].timestampValue);return new le(e.seconds,e.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dy{constructor(e,t,s,r,i,o,c,l,h,f){this.databaseId=e,this.appId=t,this.persistenceKey=s,this.host=r,this.ssl=i,this.forceLongPolling=o,this.autoDetectLongPolling=c,this.longPollingOptions=l,this.useFetchStreams=h,this.isUsingEmulator=f}}const fa="(default)";class rr{constructor(e,t){this.projectId=e,this.database=t||fa}static empty(){return new rr("","")}get isDefaultDatabase(){return this.database===fa}isEqual(e){return e instanceof rr&&e.projectId===this.projectId&&e.database===this.database}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ef="__type__",Oy="__max__",Wr={mapValue:{}},tf="__vector__",di="value";function Zt(n){return"nullValue"in n?0:"booleanValue"in n?1:"integerValue"in n||"doubleValue"in n?2:"timestampValue"in n?3:"stringValue"in n?5:"bytesValue"in n?6:"referenceValue"in n?7:"geoPointValue"in n?8:"arrayValue"in n?9:"mapValue"in n?rc(n)?4:My(n)?9007199254740991:Vy(n)?10:11:F(28295,{value:n})}function vt(n,e){if(n===e)return!0;const t=Zt(n);if(t!==Zt(e))return!1;switch(t){case 0:case 9007199254740991:return!0;case 1:return n.booleanValue===e.booleanValue;case 4:return sr(n).isEqual(sr(e));case 3:return(function(r,i){if(typeof r.timestampValue=="string"&&typeof i.timestampValue=="string"&&r.timestampValue.length===i.timestampValue.length)return r.timestampValue===i.timestampValue;const o=Xt(r.timestampValue),c=Xt(i.timestampValue);return o.seconds===c.seconds&&o.nanos===c.nanos})(n,e);case 5:return n.stringValue===e.stringValue;case 6:return(function(r,i){return Jt(r.bytesValue).isEqual(Jt(i.bytesValue))})(n,e);case 7:return n.referenceValue===e.referenceValue;case 8:return(function(r,i){return _e(r.geoPointValue.latitude)===_e(i.geoPointValue.latitude)&&_e(r.geoPointValue.longitude)===_e(i.geoPointValue.longitude)})(n,e);case 2:return(function(r,i){if("integerValue"in r&&"integerValue"in i)return _e(r.integerValue)===_e(i.integerValue);if("doubleValue"in r&&"doubleValue"in i){const o=_e(r.doubleValue),c=_e(i.doubleValue);return o===c?hi(o)===hi(c):isNaN(o)&&isNaN(c)}return!1})(n,e);case 9:return Qn(n.arrayValue.values||[],e.arrayValue.values||[],vt);case 10:case 11:return(function(r,i){const o=r.mapValue.fields||{},c=i.mapValue.fields||{};if(xu(o)!==xu(c))return!1;for(const l in o)if(o.hasOwnProperty(l)&&(c[l]===void 0||!vt(o[l],c[l])))return!1;return!0})(n,e);default:return F(52216,{left:n})}}function ir(n,e){return(n.values||[]).find((t=>vt(t,e)))!==void 0}function Yn(n,e){if(n===e)return 0;const t=Zt(n),s=Zt(e);if(t!==s)return H(t,s);switch(t){case 0:case 9007199254740991:return 0;case 1:return H(n.booleanValue,e.booleanValue);case 2:return(function(i,o){const c=_e(i.integerValue||i.doubleValue),l=_e(o.integerValue||o.doubleValue);return c<l?-1:c>l?1:c===l?0:isNaN(c)?isNaN(l)?0:-1:1})(n,e);case 3:return Uu(n.timestampValue,e.timestampValue);case 4:return Uu(sr(n),sr(e));case 5:return ua(n.stringValue,e.stringValue);case 6:return(function(i,o){const c=Jt(i),l=Jt(o);return c.compareTo(l)})(n.bytesValue,e.bytesValue);case 7:return(function(i,o){const c=i.split("/"),l=o.split("/");for(let h=0;h<c.length&&h<l.length;h++){const f=H(c[h],l[h]);if(f!==0)return f}return H(c.length,l.length)})(n.referenceValue,e.referenceValue);case 8:return(function(i,o){const c=H(_e(i.latitude),_e(o.latitude));return c!==0?c:H(_e(i.longitude),_e(o.longitude))})(n.geoPointValue,e.geoPointValue);case 9:return Bu(n.arrayValue,e.arrayValue);case 10:return(function(i,o){var m,w,S,k;const c=i.fields||{},l=o.fields||{},h=(m=c[di])==null?void 0:m.arrayValue,f=(w=l[di])==null?void 0:w.arrayValue,p=H(((S=h==null?void 0:h.values)==null?void 0:S.length)||0,((k=f==null?void 0:f.values)==null?void 0:k.length)||0);return p!==0?p:Bu(h,f)})(n.mapValue,e.mapValue);case 11:return(function(i,o){if(i===Wr.mapValue&&o===Wr.mapValue)return 0;if(i===Wr.mapValue)return 1;if(o===Wr.mapValue)return-1;const c=i.fields||{},l=Object.keys(c),h=o.fields||{},f=Object.keys(h);l.sort(),f.sort();for(let p=0;p<l.length&&p<f.length;++p){const m=ua(l[p],f[p]);if(m!==0)return m;const w=Yn(c[l[p]],h[f[p]]);if(w!==0)return w}return H(l.length,f.length)})(n.mapValue,e.mapValue);default:throw F(23264,{he:t})}}function Uu(n,e){if(typeof n=="string"&&typeof e=="string"&&n.length===e.length)return H(n,e);const t=Xt(n),s=Xt(e),r=H(t.seconds,s.seconds);return r!==0?r:H(t.nanos,s.nanos)}function Bu(n,e){const t=n.values||[],s=e.values||[];for(let r=0;r<t.length&&r<s.length;++r){const i=Yn(t[r],s[r]);if(i)return i}return H(t.length,s.length)}function Xn(n){return pa(n)}function pa(n){return"nullValue"in n?"null":"booleanValue"in n?""+n.booleanValue:"integerValue"in n?""+n.integerValue:"doubleValue"in n?""+n.doubleValue:"timestampValue"in n?(function(t){const s=Xt(t);return`time(${s.seconds},${s.nanos})`})(n.timestampValue):"stringValue"in n?n.stringValue:"bytesValue"in n?(function(t){return Jt(t).toBase64()})(n.bytesValue):"referenceValue"in n?(function(t){return L.fromName(t).toString()})(n.referenceValue):"geoPointValue"in n?(function(t){return`geo(${t.latitude},${t.longitude})`})(n.geoPointValue):"arrayValue"in n?(function(t){let s="[",r=!0;for(const i of t.values||[])r?r=!1:s+=",",s+=pa(i);return s+"]"})(n.arrayValue):"mapValue"in n?(function(t){const s=Object.keys(t.fields||{}).sort();let r="{",i=!0;for(const o of s)i?i=!1:r+=",",r+=`${o}:${pa(t.fields[o])}`;return r+"}"})(n.mapValue):F(61005,{value:n})}function Zr(n){switch(Zt(n)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const e=$i(n);return e?16+Zr(e):16;case 5:return 2*n.stringValue.length;case 6:return Jt(n.bytesValue).approximateByteSize();case 7:return n.referenceValue.length;case 9:return(function(s){return(s.values||[]).reduce(((r,i)=>r+Zr(i)),0)})(n.arrayValue);case 10:case 11:return(function(s){let r=0;return sn(s.fields,((i,o)=>{r+=i.length+Zr(o)})),r})(n.mapValue);default:throw F(13486,{value:n})}}function qu(n,e){return{referenceValue:`projects/${n.projectId}/databases/${n.database}/documents/${e.path.canonicalString()}`}}function _a(n){return!!n&&"integerValue"in n}function ic(n){return!!n&&"arrayValue"in n}function $u(n){return!!n&&"nullValue"in n}function ju(n){return!!n&&"doubleValue"in n&&isNaN(Number(n.doubleValue))}function ei(n){return!!n&&"mapValue"in n}function Vy(n){var t,s;return((s=(((t=n==null?void 0:n.mapValue)==null?void 0:t.fields)||{})[ef])==null?void 0:s.stringValue)===tf}function js(n){if(n.geoPointValue)return{geoPointValue:{...n.geoPointValue}};if(n.timestampValue&&typeof n.timestampValue=="object")return{timestampValue:{...n.timestampValue}};if(n.mapValue){const e={mapValue:{fields:{}}};return sn(n.mapValue.fields,((t,s)=>e.mapValue.fields[t]=js(s))),e}if(n.arrayValue){const e={arrayValue:{values:[]}};for(let t=0;t<(n.arrayValue.values||[]).length;++t)e.arrayValue.values[t]=js(n.arrayValue.values[t]);return e}return{...n}}function My(n){return(((n.mapValue||{}).fields||{}).__type__||{}).stringValue===Oy}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ze{constructor(e){this.value=e}static empty(){return new ze({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let s=0;s<e.length-1;++s)if(t=(t.mapValue.fields||{})[e.get(s)],!ei(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=js(t)}setAll(e){let t=ke.emptyPath(),s={},r=[];e.forEach(((o,c)=>{if(!t.isImmediateParentOf(c)){const l=this.getFieldsMap(t);this.applyChanges(l,s,r),s={},r=[],t=c.popLast()}o?s[c.lastSegment()]=js(o):r.push(c.lastSegment())}));const i=this.getFieldsMap(t);this.applyChanges(i,s,r)}delete(e){const t=this.field(e.popLast());ei(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return vt(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let s=0;s<e.length;++s){let r=t.mapValue.fields[e.get(s)];ei(r)&&r.mapValue.fields||(r={mapValue:{fields:{}}},t.mapValue.fields[e.get(s)]=r),t=r}return t.mapValue.fields}applyChanges(e,t,s){sn(t,((r,i)=>e[r]=i));for(const r of s)delete e[r]}clone(){return new ze(js(this.value))}}function nf(n){const e=[];return sn(n.fields,((t,s)=>{const r=new ke([t]);if(ei(s)){const i=nf(s.mapValue).fields;if(i.length===0)e.push(r);else for(const o of i)e.push(r.child(o))}else e.push(r)})),new Je(e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xe{constructor(e,t,s,r,i,o,c){this.key=e,this.documentType=t,this.version=s,this.readTime=r,this.createTime=i,this.data=o,this.documentState=c}static newInvalidDocument(e){return new xe(e,0,q.min(),q.min(),q.min(),ze.empty(),0)}static newFoundDocument(e,t,s,r){return new xe(e,1,t,q.min(),s,r,0)}static newNoDocument(e,t){return new xe(e,2,t,q.min(),q.min(),ze.empty(),0)}static newUnknownDocument(e,t){return new xe(e,3,t,q.min(),q.min(),ze.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual(q.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=ze.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=ze.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=q.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof xe&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new xe(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fi{constructor(e,t){this.position=e,this.inclusive=t}}function Wu(n,e,t){let s=0;for(let r=0;r<n.position.length;r++){const i=e[r],o=n.position[r];if(i.field.isKeyField()?s=L.comparator(L.fromName(o.referenceValue),t.key):s=Yn(o,t.data.field(i.field)),i.dir==="desc"&&(s*=-1),s!==0)break}return s}function zu(n,e){if(n===null)return e===null;if(e===null||n.inclusive!==e.inclusive||n.position.length!==e.position.length)return!1;for(let t=0;t<n.position.length;t++)if(!vt(n.position[t],e.position[t]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class or{constructor(e,t="asc"){this.field=e,this.dir=t}}function Ly(n,e){return n.dir===e.dir&&n.field.isEqual(e.field)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sf{}class Ee extends sf{constructor(e,t,s){super(),this.field=e,this.op=t,this.value=s}static create(e,t,s){return e.isKeyField()?t==="in"||t==="not-in"?this.createKeyFieldInFilter(e,t,s):new Fy(e,t,s):t==="array-contains"?new qy(e,s):t==="in"?new $y(e,s):t==="not-in"?new jy(e,s):t==="array-contains-any"?new Wy(e,s):new Ee(e,t,s)}static createKeyFieldInFilter(e,t,s){return t==="in"?new Uy(e,s):new By(e,s)}matches(e){const t=e.data.field(this.field);return this.op==="!="?t!==null&&t.nullValue===void 0&&this.matchesComparison(Yn(t,this.value)):t!==null&&Zt(this.value)===Zt(t)&&this.matchesComparison(Yn(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return F(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class ot extends sf{constructor(e,t){super(),this.filters=e,this.op=t,this.Pe=null}static create(e,t){return new ot(e,t)}matches(e){return rf(this)?this.filters.find((t=>!t.matches(e)))===void 0:this.filters.find((t=>t.matches(e)))!==void 0}getFlattenedFilters(){return this.Pe!==null||(this.Pe=this.filters.reduce(((e,t)=>e.concat(t.getFlattenedFilters())),[])),this.Pe}getFilters(){return Object.assign([],this.filters)}}function rf(n){return n.op==="and"}function of(n){return xy(n)&&rf(n)}function xy(n){for(const e of n.filters)if(e instanceof ot)return!1;return!0}function ma(n){if(n instanceof Ee)return n.field.canonicalString()+n.op.toString()+Xn(n.value);if(of(n))return n.filters.map((e=>ma(e))).join(",");{const e=n.filters.map((t=>ma(t))).join(",");return`${n.op}(${e})`}}function af(n,e){return n instanceof Ee?(function(s,r){return r instanceof Ee&&s.op===r.op&&s.field.isEqual(r.field)&&vt(s.value,r.value)})(n,e):n instanceof ot?(function(s,r){return r instanceof ot&&s.op===r.op&&s.filters.length===r.filters.length?s.filters.reduce(((i,o,c)=>i&&af(o,r.filters[c])),!0):!1})(n,e):void F(19439)}function cf(n){return n instanceof Ee?(function(t){return`${t.field.canonicalString()} ${t.op} ${Xn(t.value)}`})(n):n instanceof ot?(function(t){return t.op.toString()+" {"+t.getFilters().map(cf).join(" ,")+"}"})(n):"Filter"}class Fy extends Ee{constructor(e,t,s){super(e,t,s),this.key=L.fromName(s.referenceValue)}matches(e){const t=L.comparator(e.key,this.key);return this.matchesComparison(t)}}class Uy extends Ee{constructor(e,t){super(e,"in",t),this.keys=lf("in",t)}matches(e){return this.keys.some((t=>t.isEqual(e.key)))}}class By extends Ee{constructor(e,t){super(e,"not-in",t),this.keys=lf("not-in",t)}matches(e){return!this.keys.some((t=>t.isEqual(e.key)))}}function lf(n,e){var t;return(((t=e.arrayValue)==null?void 0:t.values)||[]).map((s=>L.fromName(s.referenceValue)))}class qy extends Ee{constructor(e,t){super(e,"array-contains",t)}matches(e){const t=e.data.field(this.field);return ic(t)&&ir(t.arrayValue,this.value)}}class $y extends Ee{constructor(e,t){super(e,"in",t)}matches(e){const t=e.data.field(this.field);return t!==null&&ir(this.value.arrayValue,t)}}class jy extends Ee{constructor(e,t){super(e,"not-in",t)}matches(e){if(ir(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const t=e.data.field(this.field);return t!==null&&t.nullValue===void 0&&!ir(this.value.arrayValue,t)}}class Wy extends Ee{constructor(e,t){super(e,"array-contains-any",t)}matches(e){const t=e.data.field(this.field);return!(!ic(t)||!t.arrayValue.values)&&t.arrayValue.values.some((s=>ir(this.value.arrayValue,s)))}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zy{constructor(e,t=null,s=[],r=[],i=null,o=null,c=null){this.path=e,this.collectionGroup=t,this.orderBy=s,this.filters=r,this.limit=i,this.startAt=o,this.endAt=c,this.Te=null}}function Hu(n,e=null,t=[],s=[],r=null,i=null,o=null){return new zy(n,e,t,s,r,i,o)}function oc(n){const e=B(n);if(e.Te===null){let t=e.path.canonicalString();e.collectionGroup!==null&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map((s=>ma(s))).join(","),t+="|ob:",t+=e.orderBy.map((s=>(function(i){return i.field.canonicalString()+i.dir})(s))).join(","),qi(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map((s=>Xn(s))).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map((s=>Xn(s))).join(",")),e.Te=t}return e.Te}function ac(n,e){if(n.limit!==e.limit||n.orderBy.length!==e.orderBy.length)return!1;for(let t=0;t<n.orderBy.length;t++)if(!Ly(n.orderBy[t],e.orderBy[t]))return!1;if(n.filters.length!==e.filters.length)return!1;for(let t=0;t<n.filters.length;t++)if(!af(n.filters[t],e.filters[t]))return!1;return n.collectionGroup===e.collectionGroup&&!!n.path.isEqual(e.path)&&!!zu(n.startAt,e.startAt)&&zu(n.endAt,e.endAt)}function ga(n){return L.isDocumentKey(n.path)&&n.collectionGroup===null&&n.filters.length===0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ls{constructor(e,t=null,s=[],r=[],i=null,o="F",c=null,l=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=s,this.filters=r,this.limit=i,this.limitType=o,this.startAt=c,this.endAt=l,this.Ie=null,this.Ee=null,this.de=null,this.startAt,this.endAt}}function Hy(n,e,t,s,r,i,o,c){return new ls(n,e,t,s,r,i,o,c)}function ji(n){return new ls(n)}function Gu(n){return n.filters.length===0&&n.limit===null&&n.startAt==null&&n.endAt==null&&(n.explicitOrderBy.length===0||n.explicitOrderBy.length===1&&n.explicitOrderBy[0].field.isKeyField())}function uf(n){return n.collectionGroup!==null}function Ws(n){const e=B(n);if(e.Ie===null){e.Ie=[];const t=new Set;for(const i of e.explicitOrderBy)e.Ie.push(i),t.add(i.field.canonicalString());const s=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(o){let c=new we(ke.comparator);return o.filters.forEach((l=>{l.getFlattenedFilters().forEach((h=>{h.isInequality()&&(c=c.add(h.field))}))})),c})(e).forEach((i=>{t.has(i.canonicalString())||i.isKeyField()||e.Ie.push(new or(i,s))})),t.has(ke.keyField().canonicalString())||e.Ie.push(new or(ke.keyField(),s))}return e.Ie}function mt(n){const e=B(n);return e.Ee||(e.Ee=hf(e,Ws(n))),e.Ee}function Gy(n){const e=B(n);return e.de||(e.de=hf(e,n.explicitOrderBy)),e.de}function hf(n,e){if(n.limitType==="F")return Hu(n.path,n.collectionGroup,e,n.filters,n.limit,n.startAt,n.endAt);{e=e.map((r=>{const i=r.dir==="desc"?"asc":"desc";return new or(r.field,i)}));const t=n.endAt?new fi(n.endAt.position,n.endAt.inclusive):null,s=n.startAt?new fi(n.startAt.position,n.startAt.inclusive):null;return Hu(n.path,n.collectionGroup,e,n.filters,n.limit,t,s)}}function ya(n,e){const t=n.filters.concat([e]);return new ls(n.path,n.collectionGroup,n.explicitOrderBy.slice(),t,n.limit,n.limitType,n.startAt,n.endAt)}function pi(n,e,t){return new ls(n.path,n.collectionGroup,n.explicitOrderBy.slice(),n.filters.slice(),e,t,n.startAt,n.endAt)}function Wi(n,e){return ac(mt(n),mt(e))&&n.limitType===e.limitType}function df(n){return`${oc(mt(n))}|lt:${n.limitType}`}function Fn(n){return`Query(target=${(function(t){let s=t.path.canonicalString();return t.collectionGroup!==null&&(s+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(s+=`, filters: [${t.filters.map((r=>cf(r))).join(", ")}]`),qi(t.limit)||(s+=", limit: "+t.limit),t.orderBy.length>0&&(s+=`, orderBy: [${t.orderBy.map((r=>(function(o){return`${o.field.canonicalString()} (${o.dir})`})(r))).join(", ")}]`),t.startAt&&(s+=", startAt: ",s+=t.startAt.inclusive?"b:":"a:",s+=t.startAt.position.map((r=>Xn(r))).join(",")),t.endAt&&(s+=", endAt: ",s+=t.endAt.inclusive?"a:":"b:",s+=t.endAt.position.map((r=>Xn(r))).join(",")),`Target(${s})`})(mt(n))}; limitType=${n.limitType})`}function zi(n,e){return e.isFoundDocument()&&(function(s,r){const i=r.key.path;return s.collectionGroup!==null?r.key.hasCollectionId(s.collectionGroup)&&s.path.isPrefixOf(i):L.isDocumentKey(s.path)?s.path.isEqual(i):s.path.isImmediateParentOf(i)})(n,e)&&(function(s,r){for(const i of Ws(s))if(!i.field.isKeyField()&&r.data.field(i.field)===null)return!1;return!0})(n,e)&&(function(s,r){for(const i of s.filters)if(!i.matches(r))return!1;return!0})(n,e)&&(function(s,r){return!(s.startAt&&!(function(o,c,l){const h=Wu(o,c,l);return o.inclusive?h<=0:h<0})(s.startAt,Ws(s),r)||s.endAt&&!(function(o,c,l){const h=Wu(o,c,l);return o.inclusive?h>=0:h>0})(s.endAt,Ws(s),r))})(n,e)}function Ky(n){return n.collectionGroup||(n.path.length%2==1?n.path.lastSegment():n.path.get(n.path.length-2))}function ff(n){return(e,t)=>{let s=!1;for(const r of Ws(n)){const i=Qy(r,e,t);if(i!==0)return i;s=s||r.field.isKeyField()}return 0}}function Qy(n,e,t){const s=n.field.isKeyField()?L.comparator(e.key,t.key):(function(i,o,c){const l=o.data.field(i),h=c.data.field(i);return l!==null&&h!==null?Yn(l,h):F(42886)})(n.field,e,t);switch(n.dir){case"asc":return s;case"desc":return-1*s;default:return F(19790,{direction:n.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bn{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){const t=this.mapKeyFn(e),s=this.inner[t];if(s!==void 0){for(const[r,i]of s)if(this.equalsFn(r,e))return i}}has(e){return this.get(e)!==void 0}set(e,t){const s=this.mapKeyFn(e),r=this.inner[s];if(r===void 0)return this.inner[s]=[[e,t]],void this.innerSize++;for(let i=0;i<r.length;i++)if(this.equalsFn(r[i][0],e))return void(r[i]=[e,t]);r.push([e,t]),this.innerSize++}delete(e){const t=this.mapKeyFn(e),s=this.inner[t];if(s===void 0)return!1;for(let r=0;r<s.length;r++)if(this.equalsFn(s[r][0],e))return s.length===1?delete this.inner[t]:s.splice(r,1),this.innerSize--,!0;return!1}forEach(e){sn(this.inner,((t,s)=>{for(const[r,i]of s)e(r,i)}))}isEmpty(){return Kd(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yy=new ve(L.comparator);function kt(){return Yy}const pf=new ve(L.comparator);function Fs(...n){let e=pf;for(const t of n)e=e.insert(t.key,t);return e}function _f(n){let e=pf;return n.forEach(((t,s)=>e=e.insert(t,s.overlayedDocument))),e}function pn(){return zs()}function mf(){return zs()}function zs(){return new bn((n=>n.toString()),((n,e)=>n.isEqual(e)))}const Xy=new ve(L.comparator),Jy=new we(L.comparator);function K(...n){let e=Jy;for(const t of n)e=e.add(t);return e}const Zy=new we(H);function eE(){return Zy}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function cc(n,e){if(n.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:hi(e)?"-0":e}}function gf(n){return{integerValue:""+n}}function tE(n,e){return Sy(e)?gf(e):cc(n,e)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hi{constructor(){this._=void 0}}function nE(n,e,t){return n instanceof ar?(function(r,i){const o={fields:{[Xd]:{stringValue:Yd},[Zd]:{timestampValue:{seconds:r.seconds,nanos:r.nanoseconds}}}};return i&&rc(i)&&(i=$i(i)),i&&(o.fields[Jd]=i),{mapValue:o}})(t,e):n instanceof cr?Ef(n,e):n instanceof lr?Tf(n,e):(function(r,i){const o=yf(r,i),c=Ku(o)+Ku(r.Ae);return _a(o)&&_a(r.Ae)?gf(c):cc(r.serializer,c)})(n,e)}function sE(n,e,t){return n instanceof cr?Ef(n,e):n instanceof lr?Tf(n,e):t}function yf(n,e){return n instanceof _i?(function(s){return _a(s)||(function(i){return!!i&&"doubleValue"in i})(s)})(e)?e:{integerValue:0}:null}class ar extends Hi{}class cr extends Hi{constructor(e){super(),this.elements=e}}function Ef(n,e){const t=vf(e);for(const s of n.elements)t.some((r=>vt(r,s)))||t.push(s);return{arrayValue:{values:t}}}class lr extends Hi{constructor(e){super(),this.elements=e}}function Tf(n,e){let t=vf(e);for(const s of n.elements)t=t.filter((r=>!vt(r,s)));return{arrayValue:{values:t}}}class _i extends Hi{constructor(e,t){super(),this.serializer=e,this.Ae=t}}function Ku(n){return _e(n.integerValue||n.doubleValue)}function vf(n){return ic(n)&&n.arrayValue.values?n.arrayValue.values.slice():[]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rE{constructor(e,t){this.field=e,this.transform=t}}function iE(n,e){return n.field.isEqual(e.field)&&(function(s,r){return s instanceof cr&&r instanceof cr||s instanceof lr&&r instanceof lr?Qn(s.elements,r.elements,vt):s instanceof _i&&r instanceof _i?vt(s.Ae,r.Ae):s instanceof ar&&r instanceof ar})(n.transform,e.transform)}class oE{constructor(e,t){this.version=e,this.transformResults=t}}class $e{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new $e}static exists(e){return new $e(void 0,e)}static updateTime(e){return new $e(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function ti(n,e){return n.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(n.updateTime):n.exists===void 0||n.exists===e.isFoundDocument()}class Gi{}function If(n,e){if(!n.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return n.isNoDocument()?new Ki(n.key,$e.none()):new _r(n.key,n.data,$e.none());{const t=n.data,s=ze.empty();let r=new we(ke.comparator);for(let i of e.fields)if(!r.has(i)){let o=t.field(i);o===null&&i.length>1&&(i=i.popLast(),o=t.field(i)),o===null?s.delete(i):s.set(i,o),r=r.add(i)}return new rn(n.key,s,new Je(r.toArray()),$e.none())}}function aE(n,e,t){n instanceof _r?(function(r,i,o){const c=r.value.clone(),l=Yu(r.fieldTransforms,i,o.transformResults);c.setAll(l),i.convertToFoundDocument(o.version,c).setHasCommittedMutations()})(n,e,t):n instanceof rn?(function(r,i,o){if(!ti(r.precondition,i))return void i.convertToUnknownDocument(o.version);const c=Yu(r.fieldTransforms,i,o.transformResults),l=i.data;l.setAll(wf(r)),l.setAll(c),i.convertToFoundDocument(o.version,l).setHasCommittedMutations()})(n,e,t):(function(r,i,o){i.convertToNoDocument(o.version).setHasCommittedMutations()})(0,e,t)}function Hs(n,e,t,s){return n instanceof _r?(function(i,o,c,l){if(!ti(i.precondition,o))return c;const h=i.value.clone(),f=Xu(i.fieldTransforms,l,o);return h.setAll(f),o.convertToFoundDocument(o.version,h).setHasLocalMutations(),null})(n,e,t,s):n instanceof rn?(function(i,o,c,l){if(!ti(i.precondition,o))return c;const h=Xu(i.fieldTransforms,l,o),f=o.data;return f.setAll(wf(i)),f.setAll(h),o.convertToFoundDocument(o.version,f).setHasLocalMutations(),c===null?null:c.unionWith(i.fieldMask.fields).unionWith(i.fieldTransforms.map((p=>p.field)))})(n,e,t,s):(function(i,o,c){return ti(i.precondition,o)?(o.convertToNoDocument(o.version).setHasLocalMutations(),null):c})(n,e,t)}function cE(n,e){let t=null;for(const s of n.fieldTransforms){const r=e.data.field(s.field),i=yf(s.transform,r||null);i!=null&&(t===null&&(t=ze.empty()),t.set(s.field,i))}return t||null}function Qu(n,e){return n.type===e.type&&!!n.key.isEqual(e.key)&&!!n.precondition.isEqual(e.precondition)&&!!(function(s,r){return s===void 0&&r===void 0||!(!s||!r)&&Qn(s,r,((i,o)=>iE(i,o)))})(n.fieldTransforms,e.fieldTransforms)&&(n.type===0?n.value.isEqual(e.value):n.type!==1||n.data.isEqual(e.data)&&n.fieldMask.isEqual(e.fieldMask))}class _r extends Gi{constructor(e,t,s,r=[]){super(),this.key=e,this.value=t,this.precondition=s,this.fieldTransforms=r,this.type=0}getFieldMask(){return null}}class rn extends Gi{constructor(e,t,s,r,i=[]){super(),this.key=e,this.data=t,this.fieldMask=s,this.precondition=r,this.fieldTransforms=i,this.type=1}getFieldMask(){return this.fieldMask}}function wf(n){const e=new Map;return n.fieldMask.fields.forEach((t=>{if(!t.isEmpty()){const s=n.data.field(t);e.set(t,s)}})),e}function Yu(n,e,t){const s=new Map;Z(n.length===t.length,32656,{Re:t.length,Ve:n.length});for(let r=0;r<t.length;r++){const i=n[r],o=i.transform,c=e.data.field(i.field);s.set(i.field,sE(o,c,t[r]))}return s}function Xu(n,e,t){const s=new Map;for(const r of n){const i=r.transform,o=t.data.field(r.field);s.set(r.field,nE(i,o,e))}return s}class Ki extends Gi{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class lE extends Gi{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class uE{constructor(e,t,s,r){this.batchId=e,this.localWriteTime=t,this.baseMutations=s,this.mutations=r}applyToRemoteDocument(e,t){const s=t.mutationResults;for(let r=0;r<this.mutations.length;r++){const i=this.mutations[r];i.key.isEqual(e.key)&&aE(i,e,s[r])}}applyToLocalView(e,t){for(const s of this.baseMutations)s.key.isEqual(e.key)&&(t=Hs(s,e,t,this.localWriteTime));for(const s of this.mutations)s.key.isEqual(e.key)&&(t=Hs(s,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){const s=mf();return this.mutations.forEach((r=>{const i=e.get(r.key),o=i.overlayedDocument;let c=this.applyToLocalView(o,i.mutatedFields);c=t.has(r.key)?null:c;const l=If(o,c);l!==null&&s.set(r.key,l),o.isValidDocument()||o.convertToNoDocument(q.min())})),s}keys(){return this.mutations.reduce(((e,t)=>e.add(t.key)),K())}isEqual(e){return this.batchId===e.batchId&&Qn(this.mutations,e.mutations,((t,s)=>Qu(t,s)))&&Qn(this.baseMutations,e.baseMutations,((t,s)=>Qu(t,s)))}}class lc{constructor(e,t,s,r){this.batch=e,this.commitVersion=t,this.mutationResults=s,this.docVersions=r}static from(e,t,s){Z(e.mutations.length===s.length,58842,{me:e.mutations.length,fe:s.length});let r=(function(){return Xy})();const i=e.mutations;for(let o=0;o<i.length;o++)r=r.insert(i[o].key,s[o].version);return new lc(e,t,s,r)}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hE{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class dE{constructor(e,t,s){this.alias=e,this.aggregateType=t,this.fieldPath=s}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fE{constructor(e,t){this.count=e,this.unchangedNames=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ge,Y;function pE(n){switch(n){case b.OK:return F(64938);case b.CANCELLED:case b.UNKNOWN:case b.DEADLINE_EXCEEDED:case b.RESOURCE_EXHAUSTED:case b.INTERNAL:case b.UNAVAILABLE:case b.UNAUTHENTICATED:return!1;case b.INVALID_ARGUMENT:case b.NOT_FOUND:case b.ALREADY_EXISTS:case b.PERMISSION_DENIED:case b.FAILED_PRECONDITION:case b.ABORTED:case b.OUT_OF_RANGE:case b.UNIMPLEMENTED:case b.DATA_LOSS:return!0;default:return F(15467,{code:n})}}function Af(n){if(n===void 0)return Nt("GRPC error has no .code"),b.UNKNOWN;switch(n){case ge.OK:return b.OK;case ge.CANCELLED:return b.CANCELLED;case ge.UNKNOWN:return b.UNKNOWN;case ge.DEADLINE_EXCEEDED:return b.DEADLINE_EXCEEDED;case ge.RESOURCE_EXHAUSTED:return b.RESOURCE_EXHAUSTED;case ge.INTERNAL:return b.INTERNAL;case ge.UNAVAILABLE:return b.UNAVAILABLE;case ge.UNAUTHENTICATED:return b.UNAUTHENTICATED;case ge.INVALID_ARGUMENT:return b.INVALID_ARGUMENT;case ge.NOT_FOUND:return b.NOT_FOUND;case ge.ALREADY_EXISTS:return b.ALREADY_EXISTS;case ge.PERMISSION_DENIED:return b.PERMISSION_DENIED;case ge.FAILED_PRECONDITION:return b.FAILED_PRECONDITION;case ge.ABORTED:return b.ABORTED;case ge.OUT_OF_RANGE:return b.OUT_OF_RANGE;case ge.UNIMPLEMENTED:return b.UNIMPLEMENTED;case ge.DATA_LOSS:return b.DATA_LOSS;default:return F(39323,{code:n})}}(Y=ge||(ge={}))[Y.OK=0]="OK",Y[Y.CANCELLED=1]="CANCELLED",Y[Y.UNKNOWN=2]="UNKNOWN",Y[Y.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",Y[Y.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",Y[Y.NOT_FOUND=5]="NOT_FOUND",Y[Y.ALREADY_EXISTS=6]="ALREADY_EXISTS",Y[Y.PERMISSION_DENIED=7]="PERMISSION_DENIED",Y[Y.UNAUTHENTICATED=16]="UNAUTHENTICATED",Y[Y.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",Y[Y.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",Y[Y.ABORTED=10]="ABORTED",Y[Y.OUT_OF_RANGE=11]="OUT_OF_RANGE",Y[Y.UNIMPLEMENTED=12]="UNIMPLEMENTED",Y[Y.INTERNAL=13]="INTERNAL",Y[Y.UNAVAILABLE=14]="UNAVAILABLE",Y[Y.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _E(){return new TextEncoder}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mE=new Ht([4294967295,4294967295],0);function Ju(n){const e=_E().encode(n),t=new xd;return t.update(e),new Uint8Array(t.digest())}function Zu(n){const e=new DataView(n.buffer),t=e.getUint32(0,!0),s=e.getUint32(4,!0),r=e.getUint32(8,!0),i=e.getUint32(12,!0);return[new Ht([t,s],0),new Ht([r,i],0)]}class uc{constructor(e,t,s){if(this.bitmap=e,this.padding=t,this.hashCount=s,t<0||t>=8)throw new Us(`Invalid padding: ${t}`);if(s<0)throw new Us(`Invalid hash count: ${s}`);if(e.length>0&&this.hashCount===0)throw new Us(`Invalid hash count: ${s}`);if(e.length===0&&t!==0)throw new Us(`Invalid padding when bitmap length is 0: ${t}`);this.ge=8*e.length-t,this.pe=Ht.fromNumber(this.ge)}ye(e,t,s){let r=e.add(t.multiply(Ht.fromNumber(s)));return r.compare(mE)===1&&(r=new Ht([r.getBits(0),r.getBits(1)],0)),r.modulo(this.pe).toNumber()}we(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(this.ge===0)return!1;const t=Ju(e),[s,r]=Zu(t);for(let i=0;i<this.hashCount;i++){const o=this.ye(s,r,i);if(!this.we(o))return!1}return!0}static create(e,t,s){const r=e%8==0?0:8-e%8,i=new Uint8Array(Math.ceil(e/8)),o=new uc(i,r,t);return s.forEach((c=>o.insert(c))),o}insert(e){if(this.ge===0)return;const t=Ju(e),[s,r]=Zu(t);for(let i=0;i<this.hashCount;i++){const o=this.ye(s,r,i);this.Se(o)}}Se(e){const t=Math.floor(e/8),s=e%8;this.bitmap[t]|=1<<s}}class Us extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qi{constructor(e,t,s,r,i){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=s,this.documentUpdates=r,this.resolvedLimboDocuments=i}static createSynthesizedRemoteEventForCurrentChange(e,t,s){const r=new Map;return r.set(e,mr.createSynthesizedTargetChangeForCurrentChange(e,t,s)),new Qi(q.min(),r,new ve(H),kt(),K())}}class mr{constructor(e,t,s,r,i){this.resumeToken=e,this.current=t,this.addedDocuments=s,this.modifiedDocuments=r,this.removedDocuments=i}static createSynthesizedTargetChangeForCurrentChange(e,t,s){return new mr(s,t,K(),K(),K())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ni{constructor(e,t,s,r){this.be=e,this.removedTargetIds=t,this.key=s,this.De=r}}class Cf{constructor(e,t){this.targetId=e,this.Ce=t}}class Rf{constructor(e,t,s=Oe.EMPTY_BYTE_STRING,r=null){this.state=e,this.targetIds=t,this.resumeToken=s,this.cause=r}}class eh{constructor(){this.ve=0,this.Fe=th(),this.Me=Oe.EMPTY_BYTE_STRING,this.xe=!1,this.Oe=!0}get current(){return this.xe}get resumeToken(){return this.Me}get Ne(){return this.ve!==0}get Be(){return this.Oe}Le(e){e.approximateByteSize()>0&&(this.Oe=!0,this.Me=e)}ke(){let e=K(),t=K(),s=K();return this.Fe.forEach(((r,i)=>{switch(i){case 0:e=e.add(r);break;case 2:t=t.add(r);break;case 1:s=s.add(r);break;default:F(38017,{changeType:i})}})),new mr(this.Me,this.xe,e,t,s)}qe(){this.Oe=!1,this.Fe=th()}Qe(e,t){this.Oe=!0,this.Fe=this.Fe.insert(e,t)}$e(e){this.Oe=!0,this.Fe=this.Fe.remove(e)}Ue(){this.ve+=1}Ke(){this.ve-=1,Z(this.ve>=0,3241,{ve:this.ve})}We(){this.Oe=!0,this.xe=!0}}class gE{constructor(e){this.Ge=e,this.ze=new Map,this.je=kt(),this.Je=zr(),this.He=zr(),this.Ye=new ve(H)}Ze(e){for(const t of e.be)e.De&&e.De.isFoundDocument()?this.Xe(t,e.De):this.et(t,e.key,e.De);for(const t of e.removedTargetIds)this.et(t,e.key,e.De)}tt(e){this.forEachTarget(e,(t=>{const s=this.nt(t);switch(e.state){case 0:this.rt(t)&&s.Le(e.resumeToken);break;case 1:s.Ke(),s.Ne||s.qe(),s.Le(e.resumeToken);break;case 2:s.Ke(),s.Ne||this.removeTarget(t);break;case 3:this.rt(t)&&(s.We(),s.Le(e.resumeToken));break;case 4:this.rt(t)&&(this.it(t),s.Le(e.resumeToken));break;default:F(56790,{state:e.state})}}))}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.ze.forEach(((s,r)=>{this.rt(r)&&t(r)}))}st(e){const t=e.targetId,s=e.Ce.count,r=this.ot(t);if(r){const i=r.target;if(ga(i))if(s===0){const o=new L(i.path);this.et(t,o,xe.newNoDocument(o,q.min()))}else Z(s===1,20013,{expectedCount:s});else{const o=this._t(t);if(o!==s){const c=this.ut(e),l=c?this.ct(c,e,o):1;if(l!==0){this.it(t);const h=l===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Ye=this.Ye.insert(t,h)}}}}}ut(e){const t=e.Ce.unchangedNames;if(!t||!t.bits)return null;const{bits:{bitmap:s="",padding:r=0},hashCount:i=0}=t;let o,c;try{o=Jt(s).toUint8Array()}catch(l){if(l instanceof Qd)return Kn("Decoding the base64 bloom filter in existence filter failed ("+l.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw l}try{c=new uc(o,r,i)}catch(l){return Kn(l instanceof Us?"BloomFilter error: ":"Applying bloom filter failed: ",l),null}return c.ge===0?null:c}ct(e,t,s){return t.Ce.count===s-this.Pt(e,t.targetId)?0:2}Pt(e,t){const s=this.Ge.getRemoteKeysForTarget(t);let r=0;return s.forEach((i=>{const o=this.Ge.ht(),c=`projects/${o.projectId}/databases/${o.database}/documents/${i.path.canonicalString()}`;e.mightContain(c)||(this.et(t,i,null),r++)})),r}Tt(e){const t=new Map;this.ze.forEach(((i,o)=>{const c=this.ot(o);if(c){if(i.current&&ga(c.target)){const l=new L(c.target.path);this.It(l).has(o)||this.Et(o,l)||this.et(o,l,xe.newNoDocument(l,e))}i.Be&&(t.set(o,i.ke()),i.qe())}}));let s=K();this.He.forEach(((i,o)=>{let c=!0;o.forEachWhile((l=>{const h=this.ot(l);return!h||h.purpose==="TargetPurposeLimboResolution"||(c=!1,!1)})),c&&(s=s.add(i))})),this.je.forEach(((i,o)=>o.setReadTime(e)));const r=new Qi(e,t,this.Ye,this.je,s);return this.je=kt(),this.Je=zr(),this.He=zr(),this.Ye=new ve(H),r}Xe(e,t){if(!this.rt(e))return;const s=this.Et(e,t.key)?2:0;this.nt(e).Qe(t.key,s),this.je=this.je.insert(t.key,t),this.Je=this.Je.insert(t.key,this.It(t.key).add(e)),this.He=this.He.insert(t.key,this.dt(t.key).add(e))}et(e,t,s){if(!this.rt(e))return;const r=this.nt(e);this.Et(e,t)?r.Qe(t,1):r.$e(t),this.He=this.He.insert(t,this.dt(t).delete(e)),this.He=this.He.insert(t,this.dt(t).add(e)),s&&(this.je=this.je.insert(t,s))}removeTarget(e){this.ze.delete(e)}_t(e){const t=this.nt(e).ke();return this.Ge.getRemoteKeysForTarget(e).size+t.addedDocuments.size-t.removedDocuments.size}Ue(e){this.nt(e).Ue()}nt(e){let t=this.ze.get(e);return t||(t=new eh,this.ze.set(e,t)),t}dt(e){let t=this.He.get(e);return t||(t=new we(H),this.He=this.He.insert(e,t)),t}It(e){let t=this.Je.get(e);return t||(t=new we(H),this.Je=this.Je.insert(e,t)),t}rt(e){const t=this.ot(e)!==null;return t||M("WatchChangeAggregator","Detected inactive target",e),t}ot(e){const t=this.ze.get(e);return t&&t.Ne?null:this.Ge.At(e)}it(e){this.ze.set(e,new eh),this.Ge.getRemoteKeysForTarget(e).forEach((t=>{this.et(e,t,null)}))}Et(e,t){return this.Ge.getRemoteKeysForTarget(e).has(t)}}function zr(){return new ve(L.comparator)}function th(){return new ve(L.comparator)}const yE={asc:"ASCENDING",desc:"DESCENDING"},EE={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},TE={and:"AND",or:"OR"};class vE{constructor(e,t){this.databaseId=e,this.useProto3Json=t}}function Ea(n,e){return n.useProto3Json||qi(e)?e:{value:e}}function mi(n,e){return n.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function Sf(n,e){return n.useProto3Json?e.toBase64():e.toUint8Array()}function IE(n,e){return mi(n,e.toTimestamp())}function gt(n){return Z(!!n,49232),q.fromTimestamp((function(t){const s=Xt(t);return new le(s.seconds,s.nanos)})(n))}function hc(n,e){return Ta(n,e).canonicalString()}function Ta(n,e){const t=(function(r){return new oe(["projects",r.projectId,"databases",r.database])})(n).child("documents");return e===void 0?t:t.child(e)}function bf(n){const e=oe.fromString(n);return Z(Vf(e),10190,{key:e.toString()}),e}function va(n,e){return hc(n.databaseId,e.path)}function jo(n,e){const t=bf(e);if(t.get(1)!==n.databaseId.projectId)throw new V(b.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+t.get(1)+" vs "+n.databaseId.projectId);if(t.get(3)!==n.databaseId.database)throw new V(b.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+t.get(3)+" vs "+n.databaseId.database);return new L(Nf(t))}function Pf(n,e){return hc(n.databaseId,e)}function wE(n){const e=bf(n);return e.length===4?oe.emptyPath():Nf(e)}function Ia(n){return new oe(["projects",n.databaseId.projectId,"databases",n.databaseId.database]).canonicalString()}function Nf(n){return Z(n.length>4&&n.get(4)==="documents",29091,{key:n.toString()}),n.popFirst(5)}function nh(n,e,t){return{name:va(n,e),fields:t.value.mapValue.fields}}function AE(n,e){let t;if("targetChange"in e){e.targetChange;const s=(function(h){return h==="NO_CHANGE"?0:h==="ADD"?1:h==="REMOVE"?2:h==="CURRENT"?3:h==="RESET"?4:F(39313,{state:h})})(e.targetChange.targetChangeType||"NO_CHANGE"),r=e.targetChange.targetIds||[],i=(function(h,f){return h.useProto3Json?(Z(f===void 0||typeof f=="string",58123),Oe.fromBase64String(f||"")):(Z(f===void 0||f instanceof Buffer||f instanceof Uint8Array,16193),Oe.fromUint8Array(f||new Uint8Array))})(n,e.targetChange.resumeToken),o=e.targetChange.cause,c=o&&(function(h){const f=h.code===void 0?b.UNKNOWN:Af(h.code);return new V(f,h.message||"")})(o);t=new Rf(s,r,i,c||null)}else if("documentChange"in e){e.documentChange;const s=e.documentChange;s.document,s.document.name,s.document.updateTime;const r=jo(n,s.document.name),i=gt(s.document.updateTime),o=s.document.createTime?gt(s.document.createTime):q.min(),c=new ze({mapValue:{fields:s.document.fields}}),l=xe.newFoundDocument(r,i,o,c),h=s.targetIds||[],f=s.removedTargetIds||[];t=new ni(h,f,l.key,l)}else if("documentDelete"in e){e.documentDelete;const s=e.documentDelete;s.document;const r=jo(n,s.document),i=s.readTime?gt(s.readTime):q.min(),o=xe.newNoDocument(r,i),c=s.removedTargetIds||[];t=new ni([],c,o.key,o)}else if("documentRemove"in e){e.documentRemove;const s=e.documentRemove;s.document;const r=jo(n,s.document),i=s.removedTargetIds||[];t=new ni([],i,r,null)}else{if(!("filter"in e))return F(11601,{Rt:e});{e.filter;const s=e.filter;s.targetId;const{count:r=0,unchangedNames:i}=s,o=new fE(r,i),c=s.targetId;t=new Cf(c,o)}}return t}function CE(n,e){let t;if(e instanceof _r)t={update:nh(n,e.key,e.value)};else if(e instanceof Ki)t={delete:va(n,e.key)};else if(e instanceof rn)t={update:nh(n,e.key,e.data),updateMask:VE(e.fieldMask)};else{if(!(e instanceof lE))return F(16599,{Vt:e.type});t={verify:va(n,e.key)}}return e.fieldTransforms.length>0&&(t.updateTransforms=e.fieldTransforms.map((s=>(function(i,o){const c=o.transform;if(c instanceof ar)return{fieldPath:o.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(c instanceof cr)return{fieldPath:o.field.canonicalString(),appendMissingElements:{values:c.elements}};if(c instanceof lr)return{fieldPath:o.field.canonicalString(),removeAllFromArray:{values:c.elements}};if(c instanceof _i)return{fieldPath:o.field.canonicalString(),increment:c.Ae};throw F(20930,{transform:o.transform})})(0,s)))),e.precondition.isNone||(t.currentDocument=(function(r,i){return i.updateTime!==void 0?{updateTime:IE(r,i.updateTime)}:i.exists!==void 0?{exists:i.exists}:F(27497)})(n,e.precondition)),t}function RE(n,e){return n&&n.length>0?(Z(e!==void 0,14353),n.map((t=>(function(r,i){let o=r.updateTime?gt(r.updateTime):gt(i);return o.isEqual(q.min())&&(o=gt(i)),new oE(o,r.transformResults||[])})(t,e)))):[]}function SE(n,e){return{documents:[Pf(n,e.path)]}}function kf(n,e){const t={structuredQuery:{}},s=e.path;let r;e.collectionGroup!==null?(r=s,t.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(r=s.popLast(),t.structuredQuery.from=[{collectionId:s.lastSegment()}]),t.parent=Pf(n,r);const i=(function(h){if(h.length!==0)return Of(ot.create(h,"and"))})(e.filters);i&&(t.structuredQuery.where=i);const o=(function(h){if(h.length!==0)return h.map((f=>(function(m){return{field:$t(m.field),direction:kE(m.dir)}})(f)))})(e.orderBy);o&&(t.structuredQuery.orderBy=o);const c=Ea(n,e.limit);return c!==null&&(t.structuredQuery.limit=c),e.startAt&&(t.structuredQuery.startAt=(function(h){return{before:h.inclusive,values:h.position}})(e.startAt)),e.endAt&&(t.structuredQuery.endAt=(function(h){return{before:!h.inclusive,values:h.position}})(e.endAt)),{ft:t,parent:r}}function bE(n,e,t,s){const{ft:r,parent:i}=kf(n,e),o={},c=[];let l=0;return t.forEach((h=>{const f="aggregate_"+l++;o[f]=h.alias,h.aggregateType==="count"?c.push({alias:f,count:{}}):h.aggregateType==="avg"?c.push({alias:f,avg:{field:$t(h.fieldPath)}}):h.aggregateType==="sum"&&c.push({alias:f,sum:{field:$t(h.fieldPath)}})})),{request:{structuredAggregationQuery:{aggregations:c,structuredQuery:r.structuredQuery},parent:r.parent},gt:o,parent:i}}function PE(n){let e=wE(n.parent);const t=n.structuredQuery,s=t.from?t.from.length:0;let r=null;if(s>0){Z(s===1,65062);const f=t.from[0];f.allDescendants?r=f.collectionId:e=e.child(f.collectionId)}let i=[];t.where&&(i=(function(p){const m=Df(p);return m instanceof ot&&of(m)?m.getFilters():[m]})(t.where));let o=[];t.orderBy&&(o=(function(p){return p.map((m=>(function(S){return new or(Un(S.field),(function(N){switch(N){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}})(S.direction))})(m)))})(t.orderBy));let c=null;t.limit&&(c=(function(p){let m;return m=typeof p=="object"?p.value:p,qi(m)?null:m})(t.limit));let l=null;t.startAt&&(l=(function(p){const m=!!p.before,w=p.values||[];return new fi(w,m)})(t.startAt));let h=null;return t.endAt&&(h=(function(p){const m=!p.before,w=p.values||[];return new fi(w,m)})(t.endAt)),Hy(e,r,o,i,c,"F",l,h)}function NE(n,e){const t=(function(r){switch(r){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return F(28987,{purpose:r})}})(e.purpose);return t==null?null:{"goog-listen-tags":t}}function Df(n){return n.unaryFilter!==void 0?(function(t){switch(t.unaryFilter.op){case"IS_NAN":const s=Un(t.unaryFilter.field);return Ee.create(s,"==",{doubleValue:NaN});case"IS_NULL":const r=Un(t.unaryFilter.field);return Ee.create(r,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const i=Un(t.unaryFilter.field);return Ee.create(i,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const o=Un(t.unaryFilter.field);return Ee.create(o,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return F(61313);default:return F(60726)}})(n):n.fieldFilter!==void 0?(function(t){return Ee.create(Un(t.fieldFilter.field),(function(r){switch(r){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return F(58110);default:return F(50506)}})(t.fieldFilter.op),t.fieldFilter.value)})(n):n.compositeFilter!==void 0?(function(t){return ot.create(t.compositeFilter.filters.map((s=>Df(s))),(function(r){switch(r){case"AND":return"and";case"OR":return"or";default:return F(1026)}})(t.compositeFilter.op))})(n):F(30097,{filter:n})}function kE(n){return yE[n]}function DE(n){return EE[n]}function OE(n){return TE[n]}function $t(n){return{fieldPath:n.canonicalString()}}function Un(n){return ke.fromServerFormat(n.fieldPath)}function Of(n){return n instanceof Ee?(function(t){if(t.op==="=="){if(ju(t.value))return{unaryFilter:{field:$t(t.field),op:"IS_NAN"}};if($u(t.value))return{unaryFilter:{field:$t(t.field),op:"IS_NULL"}}}else if(t.op==="!="){if(ju(t.value))return{unaryFilter:{field:$t(t.field),op:"IS_NOT_NAN"}};if($u(t.value))return{unaryFilter:{field:$t(t.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:$t(t.field),op:DE(t.op),value:t.value}}})(n):n instanceof ot?(function(t){const s=t.getFilters().map((r=>Of(r)));return s.length===1?s[0]:{compositeFilter:{op:OE(t.op),filters:s}}})(n):F(54877,{filter:n})}function VE(n){const e=[];return n.fields.forEach((t=>e.push(t.canonicalString()))),{fieldPaths:e}}function Vf(n){return n.length>=4&&n.get(0)==="projects"&&n.get(2)==="databases"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wt{constructor(e,t,s,r,i=q.min(),o=q.min(),c=Oe.EMPTY_BYTE_STRING,l=null){this.target=e,this.targetId=t,this.purpose=s,this.sequenceNumber=r,this.snapshotVersion=i,this.lastLimboFreeSnapshotVersion=o,this.resumeToken=c,this.expectedCount=l}withSequenceNumber(e){return new Wt(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new Wt(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new Wt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new Wt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ME{constructor(e){this.yt=e}}function LE(n){const e=PE({parent:n.parent,structuredQuery:n.structuredQuery});return n.limitType==="LAST"?pi(e,e.limit,"L"):e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xE{constructor(){this.Cn=new FE}addToCollectionParentIndex(e,t){return this.Cn.add(t),P.resolve()}getCollectionParents(e,t){return P.resolve(this.Cn.getEntries(t))}addFieldIndex(e,t){return P.resolve()}deleteFieldIndex(e,t){return P.resolve()}deleteAllFieldIndexes(e){return P.resolve()}createTargetIndexes(e,t){return P.resolve()}getDocumentsMatchingTarget(e,t){return P.resolve(null)}getIndexType(e,t){return P.resolve(0)}getFieldIndexes(e,t){return P.resolve([])}getNextCollectionGroupToUpdate(e){return P.resolve(null)}getMinOffset(e,t){return P.resolve(Yt.min())}getMinOffsetFromCollectionGroup(e,t){return P.resolve(Yt.min())}updateCollectionGroup(e,t,s){return P.resolve()}updateIndexEntries(e,t){return P.resolve()}}class FE{constructor(){this.index={}}add(e){const t=e.lastSegment(),s=e.popLast(),r=this.index[t]||new we(oe.comparator),i=!r.has(s);return this.index[t]=r.add(s),i}has(e){const t=e.lastSegment(),s=e.popLast(),r=this.index[t];return r&&r.has(s)}getEntries(e){return(this.index[e]||new we(oe.comparator)).toArray()}}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sh={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},Mf=41943040;class We{static withCacheSize(e){return new We(e,We.DEFAULT_COLLECTION_PERCENTILE,We.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,t,s){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=s}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */We.DEFAULT_COLLECTION_PERCENTILE=10,We.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,We.DEFAULT=new We(Mf,We.DEFAULT_COLLECTION_PERCENTILE,We.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),We.DISABLED=new We(-1,0,0);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jn{constructor(e){this.ar=e}next(){return this.ar+=2,this.ar}static ur(){return new Jn(0)}static cr(){return new Jn(-1)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rh="LruGarbageCollector",UE=1048576;function ih([n,e],[t,s]){const r=H(n,t);return r===0?H(e,s):r}class BE{constructor(e){this.Ir=e,this.buffer=new we(ih),this.Er=0}dr(){return++this.Er}Ar(e){const t=[e,this.dr()];if(this.buffer.size<this.Ir)this.buffer=this.buffer.add(t);else{const s=this.buffer.last();ih(t,s)<0&&(this.buffer=this.buffer.delete(s).add(t))}}get maxValue(){return this.buffer.last()[0]}}class qE{constructor(e,t,s){this.garbageCollector=e,this.asyncQueue=t,this.localStore=s,this.Rr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.Vr(6e4)}stop(){this.Rr&&(this.Rr.cancel(),this.Rr=null)}get started(){return this.Rr!==null}Vr(e){M(rh,`Garbage collection scheduled in ${e}ms`),this.Rr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,(async()=>{this.Rr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(t){cs(t)?M(rh,"Ignoring IndexedDB error during garbage collection: ",t):await as(t)}await this.Vr(3e5)}))}}class $E{constructor(e,t){this.mr=e,this.params=t}calculateTargetCount(e,t){return this.mr.gr(e).next((s=>Math.floor(t/100*s)))}nthSequenceNumber(e,t){if(t===0)return P.resolve(Bi.ce);const s=new BE(t);return this.mr.forEachTarget(e,(r=>s.Ar(r.sequenceNumber))).next((()=>this.mr.pr(e,(r=>s.Ar(r))))).next((()=>s.maxValue))}removeTargets(e,t,s){return this.mr.removeTargets(e,t,s)}removeOrphanedDocuments(e,t){return this.mr.removeOrphanedDocuments(e,t)}collect(e,t){return this.params.cacheSizeCollectionThreshold===-1?(M("LruGarbageCollector","Garbage collection skipped; disabled"),P.resolve(sh)):this.getCacheSize(e).next((s=>s<this.params.cacheSizeCollectionThreshold?(M("LruGarbageCollector",`Garbage collection skipped; Cache size ${s} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),sh):this.yr(e,t)))}getCacheSize(e){return this.mr.getCacheSize(e)}yr(e,t){let s,r,i,o,c,l,h;const f=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next((p=>(p>this.params.maximumSequenceNumbersToCollect?(M("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${p}`),r=this.params.maximumSequenceNumbersToCollect):r=p,o=Date.now(),this.nthSequenceNumber(e,r)))).next((p=>(s=p,c=Date.now(),this.removeTargets(e,s,t)))).next((p=>(i=p,l=Date.now(),this.removeOrphanedDocuments(e,s)))).next((p=>(h=Date.now(),xn()<=W.DEBUG&&M("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${o-f}ms
	Determined least recently used ${r} in `+(c-o)+`ms
	Removed ${i} targets in `+(l-c)+`ms
	Removed ${p} documents in `+(h-l)+`ms
Total Duration: ${h-f}ms`),P.resolve({didRun:!0,sequenceNumbersCollected:r,targetsRemoved:i,documentsRemoved:p}))))}}function jE(n,e){return new $E(n,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class WE{constructor(){this.changes=new bn((e=>e.toString()),((e,t)=>e.isEqual(t))),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,xe.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();const s=this.changes.get(t);return s!==void 0?P.resolve(s):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zE{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class HE{constructor(e,t,s,r){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=s,this.indexManager=r}getDocument(e,t){let s=null;return this.documentOverlayCache.getOverlay(e,t).next((r=>(s=r,this.remoteDocumentCache.getEntry(e,t)))).next((r=>(s!==null&&Hs(s.mutation,r,Je.empty(),le.now()),r)))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next((s=>this.getLocalViewOfDocuments(e,s,K()).next((()=>s))))}getLocalViewOfDocuments(e,t,s=K()){const r=pn();return this.populateOverlays(e,r,t).next((()=>this.computeViews(e,t,r,s).next((i=>{let o=Fs();return i.forEach(((c,l)=>{o=o.insert(c,l.overlayedDocument)})),o}))))}getOverlayedDocuments(e,t){const s=pn();return this.populateOverlays(e,s,t).next((()=>this.computeViews(e,t,s,K())))}populateOverlays(e,t,s){const r=[];return s.forEach((i=>{t.has(i)||r.push(i)})),this.documentOverlayCache.getOverlays(e,r).next((i=>{i.forEach(((o,c)=>{t.set(o,c)}))}))}computeViews(e,t,s,r){let i=kt();const o=zs(),c=(function(){return zs()})();return t.forEach(((l,h)=>{const f=s.get(h.key);r.has(h.key)&&(f===void 0||f.mutation instanceof rn)?i=i.insert(h.key,h):f!==void 0?(o.set(h.key,f.mutation.getFieldMask()),Hs(f.mutation,h,f.mutation.getFieldMask(),le.now())):o.set(h.key,Je.empty())})),this.recalculateAndSaveOverlays(e,i).next((l=>(l.forEach(((h,f)=>o.set(h,f))),t.forEach(((h,f)=>c.set(h,new zE(f,o.get(h)??null)))),c)))}recalculateAndSaveOverlays(e,t){const s=zs();let r=new ve(((o,c)=>o-c)),i=K();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next((o=>{for(const c of o)c.keys().forEach((l=>{const h=t.get(l);if(h===null)return;let f=s.get(l)||Je.empty();f=c.applyToLocalView(h,f),s.set(l,f);const p=(r.get(c.batchId)||K()).add(l);r=r.insert(c.batchId,p)}))})).next((()=>{const o=[],c=r.getReverseIterator();for(;c.hasNext();){const l=c.getNext(),h=l.key,f=l.value,p=mf();f.forEach((m=>{if(!i.has(m)){const w=If(t.get(m),s.get(m));w!==null&&p.set(m,w),i=i.add(m)}})),o.push(this.documentOverlayCache.saveOverlays(e,h,p))}return P.waitFor(o)})).next((()=>s))}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next((s=>this.recalculateAndSaveOverlays(e,s)))}getDocumentsMatchingQuery(e,t,s,r){return(function(o){return L.isDocumentKey(o.path)&&o.collectionGroup===null&&o.filters.length===0})(t)?this.getDocumentsMatchingDocumentQuery(e,t.path):uf(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,s,r):this.getDocumentsMatchingCollectionQuery(e,t,s,r)}getNextDocuments(e,t,s,r){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,s,r).next((i=>{const o=r-i.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,s.largestBatchId,r-i.size):P.resolve(pn());let c=nr,l=i;return o.next((h=>P.forEach(h,((f,p)=>(c<p.largestBatchId&&(c=p.largestBatchId),i.get(f)?P.resolve():this.remoteDocumentCache.getEntry(e,f).next((m=>{l=l.insert(f,m)}))))).next((()=>this.populateOverlays(e,h,i))).next((()=>this.computeViews(e,l,h,K()))).next((f=>({batchId:c,changes:_f(f)})))))}))}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new L(t)).next((s=>{let r=Fs();return s.isFoundDocument()&&(r=r.insert(s.key,s)),r}))}getDocumentsMatchingCollectionGroupQuery(e,t,s,r){const i=t.collectionGroup;let o=Fs();return this.indexManager.getCollectionParents(e,i).next((c=>P.forEach(c,(l=>{const h=(function(p,m){return new ls(m,null,p.explicitOrderBy.slice(),p.filters.slice(),p.limit,p.limitType,p.startAt,p.endAt)})(t,l.child(i));return this.getDocumentsMatchingCollectionQuery(e,h,s,r).next((f=>{f.forEach(((p,m)=>{o=o.insert(p,m)}))}))})).next((()=>o))))}getDocumentsMatchingCollectionQuery(e,t,s,r){let i;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,s.largestBatchId).next((o=>(i=o,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,s,i,r)))).next((o=>{i.forEach(((l,h)=>{const f=h.getKey();o.get(f)===null&&(o=o.insert(f,xe.newInvalidDocument(f)))}));let c=Fs();return o.forEach(((l,h)=>{const f=i.get(l);f!==void 0&&Hs(f.mutation,h,Je.empty(),le.now()),zi(t,h)&&(c=c.insert(l,h))})),c}))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class GE{constructor(e){this.serializer=e,this.Lr=new Map,this.kr=new Map}getBundleMetadata(e,t){return P.resolve(this.Lr.get(t))}saveBundleMetadata(e,t){return this.Lr.set(t.id,(function(r){return{id:r.id,version:r.version,createTime:gt(r.createTime)}})(t)),P.resolve()}getNamedQuery(e,t){return P.resolve(this.kr.get(t))}saveNamedQuery(e,t){return this.kr.set(t.name,(function(r){return{name:r.name,query:LE(r.bundledQuery),readTime:gt(r.readTime)}})(t)),P.resolve()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class KE{constructor(){this.overlays=new ve(L.comparator),this.qr=new Map}getOverlay(e,t){return P.resolve(this.overlays.get(t))}getOverlays(e,t){const s=pn();return P.forEach(t,(r=>this.getOverlay(e,r).next((i=>{i!==null&&s.set(r,i)})))).next((()=>s))}saveOverlays(e,t,s){return s.forEach(((r,i)=>{this.St(e,t,i)})),P.resolve()}removeOverlaysForBatchId(e,t,s){const r=this.qr.get(s);return r!==void 0&&(r.forEach((i=>this.overlays=this.overlays.remove(i))),this.qr.delete(s)),P.resolve()}getOverlaysForCollection(e,t,s){const r=pn(),i=t.length+1,o=new L(t.child("")),c=this.overlays.getIteratorFrom(o);for(;c.hasNext();){const l=c.getNext().value,h=l.getKey();if(!t.isPrefixOf(h.path))break;h.path.length===i&&l.largestBatchId>s&&r.set(l.getKey(),l)}return P.resolve(r)}getOverlaysForCollectionGroup(e,t,s,r){let i=new ve(((h,f)=>h-f));const o=this.overlays.getIterator();for(;o.hasNext();){const h=o.getNext().value;if(h.getKey().getCollectionGroup()===t&&h.largestBatchId>s){let f=i.get(h.largestBatchId);f===null&&(f=pn(),i=i.insert(h.largestBatchId,f)),f.set(h.getKey(),h)}}const c=pn(),l=i.getIterator();for(;l.hasNext()&&(l.getNext().value.forEach(((h,f)=>c.set(h,f))),!(c.size()>=r)););return P.resolve(c)}St(e,t,s){const r=this.overlays.get(s.key);if(r!==null){const o=this.qr.get(r.largestBatchId).delete(s.key);this.qr.set(r.largestBatchId,o)}this.overlays=this.overlays.insert(s.key,new hE(t,s));let i=this.qr.get(t);i===void 0&&(i=K(),this.qr.set(t,i)),this.qr.set(t,i.add(s.key))}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class QE{constructor(){this.sessionToken=Oe.EMPTY_BYTE_STRING}getSessionToken(e){return P.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,P.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class dc{constructor(){this.Qr=new we(Se.$r),this.Ur=new we(Se.Kr)}isEmpty(){return this.Qr.isEmpty()}addReference(e,t){const s=new Se(e,t);this.Qr=this.Qr.add(s),this.Ur=this.Ur.add(s)}Wr(e,t){e.forEach((s=>this.addReference(s,t)))}removeReference(e,t){this.Gr(new Se(e,t))}zr(e,t){e.forEach((s=>this.removeReference(s,t)))}jr(e){const t=new L(new oe([])),s=new Se(t,e),r=new Se(t,e+1),i=[];return this.Ur.forEachInRange([s,r],(o=>{this.Gr(o),i.push(o.key)})),i}Jr(){this.Qr.forEach((e=>this.Gr(e)))}Gr(e){this.Qr=this.Qr.delete(e),this.Ur=this.Ur.delete(e)}Hr(e){const t=new L(new oe([])),s=new Se(t,e),r=new Se(t,e+1);let i=K();return this.Ur.forEachInRange([s,r],(o=>{i=i.add(o.key)})),i}containsKey(e){const t=new Se(e,0),s=this.Qr.firstAfterOrEqual(t);return s!==null&&e.isEqual(s.key)}}class Se{constructor(e,t){this.key=e,this.Yr=t}static $r(e,t){return L.comparator(e.key,t.key)||H(e.Yr,t.Yr)}static Kr(e,t){return H(e.Yr,t.Yr)||L.comparator(e.key,t.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class YE{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.tr=1,this.Zr=new we(Se.$r)}checkEmpty(e){return P.resolve(this.mutationQueue.length===0)}addMutationBatch(e,t,s,r){const i=this.tr;this.tr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const o=new uE(i,t,s,r);this.mutationQueue.push(o);for(const c of r)this.Zr=this.Zr.add(new Se(c.key,i)),this.indexManager.addToCollectionParentIndex(e,c.key.path.popLast());return P.resolve(o)}lookupMutationBatch(e,t){return P.resolve(this.Xr(t))}getNextMutationBatchAfterBatchId(e,t){const s=t+1,r=this.ei(s),i=r<0?0:r;return P.resolve(this.mutationQueue.length>i?this.mutationQueue[i]:null)}getHighestUnacknowledgedBatchId(){return P.resolve(this.mutationQueue.length===0?sc:this.tr-1)}getAllMutationBatches(e){return P.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){const s=new Se(t,0),r=new Se(t,Number.POSITIVE_INFINITY),i=[];return this.Zr.forEachInRange([s,r],(o=>{const c=this.Xr(o.Yr);i.push(c)})),P.resolve(i)}getAllMutationBatchesAffectingDocumentKeys(e,t){let s=new we(H);return t.forEach((r=>{const i=new Se(r,0),o=new Se(r,Number.POSITIVE_INFINITY);this.Zr.forEachInRange([i,o],(c=>{s=s.add(c.Yr)}))})),P.resolve(this.ti(s))}getAllMutationBatchesAffectingQuery(e,t){const s=t.path,r=s.length+1;let i=s;L.isDocumentKey(i)||(i=i.child(""));const o=new Se(new L(i),0);let c=new we(H);return this.Zr.forEachWhile((l=>{const h=l.key.path;return!!s.isPrefixOf(h)&&(h.length===r&&(c=c.add(l.Yr)),!0)}),o),P.resolve(this.ti(c))}ti(e){const t=[];return e.forEach((s=>{const r=this.Xr(s);r!==null&&t.push(r)})),t}removeMutationBatch(e,t){Z(this.ni(t.batchId,"removed")===0,55003),this.mutationQueue.shift();let s=this.Zr;return P.forEach(t.mutations,(r=>{const i=new Se(r.key,t.batchId);return s=s.delete(i),this.referenceDelegate.markPotentiallyOrphaned(e,r.key)})).next((()=>{this.Zr=s}))}ir(e){}containsKey(e,t){const s=new Se(t,0),r=this.Zr.firstAfterOrEqual(s);return P.resolve(t.isEqual(r&&r.key))}performConsistencyCheck(e){return this.mutationQueue.length,P.resolve()}ni(e,t){return this.ei(e)}ei(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}Xr(e){const t=this.ei(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class XE{constructor(e){this.ri=e,this.docs=(function(){return new ve(L.comparator)})(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){const s=t.key,r=this.docs.get(s),i=r?r.size:0,o=this.ri(t);return this.docs=this.docs.insert(s,{document:t.mutableCopy(),size:o}),this.size+=o-i,this.indexManager.addToCollectionParentIndex(e,s.path.popLast())}removeEntry(e){const t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){const s=this.docs.get(t);return P.resolve(s?s.document.mutableCopy():xe.newInvalidDocument(t))}getEntries(e,t){let s=kt();return t.forEach((r=>{const i=this.docs.get(r);s=s.insert(r,i?i.document.mutableCopy():xe.newInvalidDocument(r))})),P.resolve(s)}getDocumentsMatchingQuery(e,t,s,r){let i=kt();const o=t.path,c=new L(o.child("__id-9223372036854775808__")),l=this.docs.getIteratorFrom(c);for(;l.hasNext();){const{key:h,value:{document:f}}=l.getNext();if(!o.isPrefixOf(h.path))break;h.path.length>o.length+1||wy(Iy(f),s)<=0||(r.has(f.key)||zi(t,f))&&(i=i.insert(f.key,f.mutableCopy()))}return P.resolve(i)}getAllFromCollectionGroup(e,t,s,r){F(9500)}ii(e,t){return P.forEach(this.docs,(s=>t(s)))}newChangeBuffer(e){return new JE(this)}getSize(e){return P.resolve(this.size)}}class JE extends WE{constructor(e){super(),this.Nr=e}applyChanges(e){const t=[];return this.changes.forEach(((s,r)=>{r.isValidDocument()?t.push(this.Nr.addEntry(e,r)):this.Nr.removeEntry(s)})),P.waitFor(t)}getFromCache(e,t){return this.Nr.getEntry(e,t)}getAllFromCache(e,t){return this.Nr.getEntries(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ZE{constructor(e){this.persistence=e,this.si=new bn((t=>oc(t)),ac),this.lastRemoteSnapshotVersion=q.min(),this.highestTargetId=0,this.oi=0,this._i=new dc,this.targetCount=0,this.ai=Jn.ur()}forEachTarget(e,t){return this.si.forEach(((s,r)=>t(r))),P.resolve()}getLastRemoteSnapshotVersion(e){return P.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return P.resolve(this.oi)}allocateTargetId(e){return this.highestTargetId=this.ai.next(),P.resolve(this.highestTargetId)}setTargetsMetadata(e,t,s){return s&&(this.lastRemoteSnapshotVersion=s),t>this.oi&&(this.oi=t),P.resolve()}Pr(e){this.si.set(e.target,e);const t=e.targetId;t>this.highestTargetId&&(this.ai=new Jn(t),this.highestTargetId=t),e.sequenceNumber>this.oi&&(this.oi=e.sequenceNumber)}addTargetData(e,t){return this.Pr(t),this.targetCount+=1,P.resolve()}updateTargetData(e,t){return this.Pr(t),P.resolve()}removeTargetData(e,t){return this.si.delete(t.target),this._i.jr(t.targetId),this.targetCount-=1,P.resolve()}removeTargets(e,t,s){let r=0;const i=[];return this.si.forEach(((o,c)=>{c.sequenceNumber<=t&&s.get(c.targetId)===null&&(this.si.delete(o),i.push(this.removeMatchingKeysForTargetId(e,c.targetId)),r++)})),P.waitFor(i).next((()=>r))}getTargetCount(e){return P.resolve(this.targetCount)}getTargetData(e,t){const s=this.si.get(t)||null;return P.resolve(s)}addMatchingKeys(e,t,s){return this._i.Wr(t,s),P.resolve()}removeMatchingKeys(e,t,s){this._i.zr(t,s);const r=this.persistence.referenceDelegate,i=[];return r&&t.forEach((o=>{i.push(r.markPotentiallyOrphaned(e,o))})),P.waitFor(i)}removeMatchingKeysForTargetId(e,t){return this._i.jr(t),P.resolve()}getMatchingKeysForTargetId(e,t){const s=this._i.Hr(t);return P.resolve(s)}containsKey(e,t){return P.resolve(this._i.containsKey(t))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lf{constructor(e,t){this.ui={},this.overlays={},this.ci=new Bi(0),this.li=!1,this.li=!0,this.hi=new QE,this.referenceDelegate=e(this),this.Pi=new ZE(this),this.indexManager=new xE,this.remoteDocumentCache=(function(r){return new XE(r)})((s=>this.referenceDelegate.Ti(s))),this.serializer=new ME(t),this.Ii=new GE(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.li=!1,Promise.resolve()}get started(){return this.li}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new KE,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let s=this.ui[e.toKey()];return s||(s=new YE(t,this.referenceDelegate),this.ui[e.toKey()]=s),s}getGlobalsCache(){return this.hi}getTargetCache(){return this.Pi}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Ii}runTransaction(e,t,s){M("MemoryPersistence","Starting transaction:",e);const r=new eT(this.ci.next());return this.referenceDelegate.Ei(),s(r).next((i=>this.referenceDelegate.di(r).next((()=>i)))).toPromise().then((i=>(r.raiseOnCommittedEvent(),i)))}Ai(e,t){return P.or(Object.values(this.ui).map((s=>()=>s.containsKey(e,t))))}}class eT extends Cy{constructor(e){super(),this.currentSequenceNumber=e}}class fc{constructor(e){this.persistence=e,this.Ri=new dc,this.Vi=null}static mi(e){return new fc(e)}get fi(){if(this.Vi)return this.Vi;throw F(60996)}addReference(e,t,s){return this.Ri.addReference(s,t),this.fi.delete(s.toString()),P.resolve()}removeReference(e,t,s){return this.Ri.removeReference(s,t),this.fi.add(s.toString()),P.resolve()}markPotentiallyOrphaned(e,t){return this.fi.add(t.toString()),P.resolve()}removeTarget(e,t){this.Ri.jr(t.targetId).forEach((r=>this.fi.add(r.toString())));const s=this.persistence.getTargetCache();return s.getMatchingKeysForTargetId(e,t.targetId).next((r=>{r.forEach((i=>this.fi.add(i.toString())))})).next((()=>s.removeTargetData(e,t)))}Ei(){this.Vi=new Set}di(e){const t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return P.forEach(this.fi,(s=>{const r=L.fromPath(s);return this.gi(e,r).next((i=>{i||t.removeEntry(r,q.min())}))})).next((()=>(this.Vi=null,t.apply(e))))}updateLimboDocument(e,t){return this.gi(e,t).next((s=>{s?this.fi.delete(t.toString()):this.fi.add(t.toString())}))}Ti(e){return 0}gi(e,t){return P.or([()=>P.resolve(this.Ri.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.Ai(e,t)])}}class gi{constructor(e,t){this.persistence=e,this.pi=new bn((s=>by(s.path)),((s,r)=>s.isEqual(r))),this.garbageCollector=jE(this,t)}static mi(e,t){return new gi(e,t)}Ei(){}di(e){return P.resolve()}forEachTarget(e,t){return this.persistence.getTargetCache().forEachTarget(e,t)}gr(e){const t=this.wr(e);return this.persistence.getTargetCache().getTargetCount(e).next((s=>t.next((r=>s+r))))}wr(e){let t=0;return this.pr(e,(s=>{t++})).next((()=>t))}pr(e,t){return P.forEach(this.pi,((s,r)=>this.br(e,s,r).next((i=>i?P.resolve():t(r)))))}removeTargets(e,t,s){return this.persistence.getTargetCache().removeTargets(e,t,s)}removeOrphanedDocuments(e,t){let s=0;const r=this.persistence.getRemoteDocumentCache(),i=r.newChangeBuffer();return r.ii(e,(o=>this.br(e,o,t).next((c=>{c||(s++,i.removeEntry(o,q.min()))})))).next((()=>i.apply(e))).next((()=>s))}markPotentiallyOrphaned(e,t){return this.pi.set(t,e.currentSequenceNumber),P.resolve()}removeTarget(e,t){const s=t.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,s)}addReference(e,t,s){return this.pi.set(s,e.currentSequenceNumber),P.resolve()}removeReference(e,t,s){return this.pi.set(s,e.currentSequenceNumber),P.resolve()}updateLimboDocument(e,t){return this.pi.set(t,e.currentSequenceNumber),P.resolve()}Ti(e){let t=e.key.toString().length;return e.isFoundDocument()&&(t+=Zr(e.data.value)),t}br(e,t,s){return P.or([()=>this.persistence.Ai(e,t),()=>this.persistence.getTargetCache().containsKey(e,t),()=>{const r=this.pi.get(t);return P.resolve(r!==void 0&&r>s)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pc{constructor(e,t,s,r){this.targetId=e,this.fromCache=t,this.Es=s,this.ds=r}static As(e,t){let s=K(),r=K();for(const i of t.docChanges)switch(i.type){case 0:s=s.add(i.doc.key);break;case 1:r=r.add(i.doc.key)}return new pc(e,t.fromCache,s,r)}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tT{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nT{constructor(){this.Rs=!1,this.Vs=!1,this.fs=100,this.gs=(function(){return Jm()?8:Ry(it())>0?6:4})()}initialize(e,t){this.ps=e,this.indexManager=t,this.Rs=!0}getDocumentsMatchingQuery(e,t,s,r){const i={result:null};return this.ys(e,t).next((o=>{i.result=o})).next((()=>{if(!i.result)return this.ws(e,t,r,s).next((o=>{i.result=o}))})).next((()=>{if(i.result)return;const o=new tT;return this.Ss(e,t,o).next((c=>{if(i.result=c,this.Vs)return this.bs(e,t,o,c.size)}))})).next((()=>i.result))}bs(e,t,s,r){return s.documentReadCount<this.fs?(xn()<=W.DEBUG&&M("QueryEngine","SDK will not create cache indexes for query:",Fn(t),"since it only creates cache indexes for collection contains","more than or equal to",this.fs,"documents"),P.resolve()):(xn()<=W.DEBUG&&M("QueryEngine","Query:",Fn(t),"scans",s.documentReadCount,"local documents and returns",r,"documents as results."),s.documentReadCount>this.gs*r?(xn()<=W.DEBUG&&M("QueryEngine","The SDK decides to create cache indexes for query:",Fn(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,mt(t))):P.resolve())}ys(e,t){if(Gu(t))return P.resolve(null);let s=mt(t);return this.indexManager.getIndexType(e,s).next((r=>r===0?null:(t.limit!==null&&r===1&&(t=pi(t,null,"F"),s=mt(t)),this.indexManager.getDocumentsMatchingTarget(e,s).next((i=>{const o=K(...i);return this.ps.getDocuments(e,o).next((c=>this.indexManager.getMinOffset(e,s).next((l=>{const h=this.Ds(t,c);return this.Cs(t,h,o,l.readTime)?this.ys(e,pi(t,null,"F")):this.vs(e,h,t,l)}))))})))))}ws(e,t,s,r){return Gu(t)||r.isEqual(q.min())?P.resolve(null):this.ps.getDocuments(e,s).next((i=>{const o=this.Ds(t,i);return this.Cs(t,o,s,r)?P.resolve(null):(xn()<=W.DEBUG&&M("QueryEngine","Re-using previous result from %s to execute query: %s",r.toString(),Fn(t)),this.vs(e,o,t,vy(r,nr)).next((c=>c)))}))}Ds(e,t){let s=new we(ff(e));return t.forEach(((r,i)=>{zi(e,i)&&(s=s.add(i))})),s}Cs(e,t,s,r){if(e.limit===null)return!1;if(s.size!==t.size)return!0;const i=e.limitType==="F"?t.last():t.first();return!!i&&(i.hasPendingWrites||i.version.compareTo(r)>0)}Ss(e,t,s){return xn()<=W.DEBUG&&M("QueryEngine","Using full collection scan to execute query:",Fn(t)),this.ps.getDocumentsMatchingQuery(e,t,Yt.min(),s)}vs(e,t,s,r){return this.ps.getDocumentsMatchingQuery(e,s,r).next((i=>(t.forEach((o=>{i=i.insert(o.key,o)})),i)))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _c="LocalStore",sT=3e8;class rT{constructor(e,t,s,r){this.persistence=e,this.Fs=t,this.serializer=r,this.Ms=new ve(H),this.xs=new bn((i=>oc(i)),ac),this.Os=new Map,this.Ns=e.getRemoteDocumentCache(),this.Pi=e.getTargetCache(),this.Ii=e.getBundleCache(),this.Bs(s)}Bs(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new HE(this.Ns,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Ns.setIndexManager(this.indexManager),this.Fs.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",(t=>e.collect(t,this.Ms)))}}function iT(n,e,t,s){return new rT(n,e,t,s)}async function xf(n,e){const t=B(n);return await t.persistence.runTransaction("Handle user change","readonly",(s=>{let r;return t.mutationQueue.getAllMutationBatches(s).next((i=>(r=i,t.Bs(e),t.mutationQueue.getAllMutationBatches(s)))).next((i=>{const o=[],c=[];let l=K();for(const h of r){o.push(h.batchId);for(const f of h.mutations)l=l.add(f.key)}for(const h of i){c.push(h.batchId);for(const f of h.mutations)l=l.add(f.key)}return t.localDocuments.getDocuments(s,l).next((h=>({Ls:h,removedBatchIds:o,addedBatchIds:c})))}))}))}function oT(n,e){const t=B(n);return t.persistence.runTransaction("Acknowledge batch","readwrite-primary",(s=>{const r=e.batch.keys(),i=t.Ns.newChangeBuffer({trackRemovals:!0});return(function(c,l,h,f){const p=h.batch,m=p.keys();let w=P.resolve();return m.forEach((S=>{w=w.next((()=>f.getEntry(l,S))).next((k=>{const N=h.docVersions.get(S);Z(N!==null,48541),k.version.compareTo(N)<0&&(p.applyToRemoteDocument(k,h),k.isValidDocument()&&(k.setReadTime(h.commitVersion),f.addEntry(k)))}))})),w.next((()=>c.mutationQueue.removeMutationBatch(l,p)))})(t,s,e,i).next((()=>i.apply(s))).next((()=>t.mutationQueue.performConsistencyCheck(s))).next((()=>t.documentOverlayCache.removeOverlaysForBatchId(s,r,e.batch.batchId))).next((()=>t.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(s,(function(c){let l=K();for(let h=0;h<c.mutationResults.length;++h)c.mutationResults[h].transformResults.length>0&&(l=l.add(c.batch.mutations[h].key));return l})(e)))).next((()=>t.localDocuments.getDocuments(s,r)))}))}function Ff(n){const e=B(n);return e.persistence.runTransaction("Get last remote snapshot version","readonly",(t=>e.Pi.getLastRemoteSnapshotVersion(t)))}function aT(n,e){const t=B(n),s=e.snapshotVersion;let r=t.Ms;return t.persistence.runTransaction("Apply remote event","readwrite-primary",(i=>{const o=t.Ns.newChangeBuffer({trackRemovals:!0});r=t.Ms;const c=[];e.targetChanges.forEach(((f,p)=>{const m=r.get(p);if(!m)return;c.push(t.Pi.removeMatchingKeys(i,f.removedDocuments,p).next((()=>t.Pi.addMatchingKeys(i,f.addedDocuments,p))));let w=m.withSequenceNumber(i.currentSequenceNumber);e.targetMismatches.get(p)!==null?w=w.withResumeToken(Oe.EMPTY_BYTE_STRING,q.min()).withLastLimboFreeSnapshotVersion(q.min()):f.resumeToken.approximateByteSize()>0&&(w=w.withResumeToken(f.resumeToken,s)),r=r.insert(p,w),(function(k,N,x){return k.resumeToken.approximateByteSize()===0||N.snapshotVersion.toMicroseconds()-k.snapshotVersion.toMicroseconds()>=sT?!0:x.addedDocuments.size+x.modifiedDocuments.size+x.removedDocuments.size>0})(m,w,f)&&c.push(t.Pi.updateTargetData(i,w))}));let l=kt(),h=K();if(e.documentUpdates.forEach((f=>{e.resolvedLimboDocuments.has(f)&&c.push(t.persistence.referenceDelegate.updateLimboDocument(i,f))})),c.push(cT(i,o,e.documentUpdates).next((f=>{l=f.ks,h=f.qs}))),!s.isEqual(q.min())){const f=t.Pi.getLastRemoteSnapshotVersion(i).next((p=>t.Pi.setTargetsMetadata(i,i.currentSequenceNumber,s)));c.push(f)}return P.waitFor(c).next((()=>o.apply(i))).next((()=>t.localDocuments.getLocalViewOfDocuments(i,l,h))).next((()=>l))})).then((i=>(t.Ms=r,i)))}function cT(n,e,t){let s=K(),r=K();return t.forEach((i=>s=s.add(i))),e.getEntries(n,s).next((i=>{let o=kt();return t.forEach(((c,l)=>{const h=i.get(c);l.isFoundDocument()!==h.isFoundDocument()&&(r=r.add(c)),l.isNoDocument()&&l.version.isEqual(q.min())?(e.removeEntry(c,l.readTime),o=o.insert(c,l)):!h.isValidDocument()||l.version.compareTo(h.version)>0||l.version.compareTo(h.version)===0&&h.hasPendingWrites?(e.addEntry(l),o=o.insert(c,l)):M(_c,"Ignoring outdated watch update for ",c,". Current version:",h.version," Watch version:",l.version)})),{ks:o,qs:r}}))}function lT(n,e){const t=B(n);return t.persistence.runTransaction("Get next mutation batch","readonly",(s=>(e===void 0&&(e=sc),t.mutationQueue.getNextMutationBatchAfterBatchId(s,e))))}function uT(n,e){const t=B(n);return t.persistence.runTransaction("Allocate target","readwrite",(s=>{let r;return t.Pi.getTargetData(s,e).next((i=>i?(r=i,P.resolve(r)):t.Pi.allocateTargetId(s).next((o=>(r=new Wt(e,o,"TargetPurposeListen",s.currentSequenceNumber),t.Pi.addTargetData(s,r).next((()=>r)))))))})).then((s=>{const r=t.Ms.get(s.targetId);return(r===null||s.snapshotVersion.compareTo(r.snapshotVersion)>0)&&(t.Ms=t.Ms.insert(s.targetId,s),t.xs.set(e,s.targetId)),s}))}async function wa(n,e,t){const s=B(n),r=s.Ms.get(e),i=t?"readwrite":"readwrite-primary";try{t||await s.persistence.runTransaction("Release target",i,(o=>s.persistence.referenceDelegate.removeTarget(o,r)))}catch(o){if(!cs(o))throw o;M(_c,`Failed to update sequence numbers for target ${e}: ${o}`)}s.Ms=s.Ms.remove(e),s.xs.delete(r.target)}function oh(n,e,t){const s=B(n);let r=q.min(),i=K();return s.persistence.runTransaction("Execute query","readwrite",(o=>(function(l,h,f){const p=B(l),m=p.xs.get(f);return m!==void 0?P.resolve(p.Ms.get(m)):p.Pi.getTargetData(h,f)})(s,o,mt(e)).next((c=>{if(c)return r=c.lastLimboFreeSnapshotVersion,s.Pi.getMatchingKeysForTargetId(o,c.targetId).next((l=>{i=l}))})).next((()=>s.Fs.getDocumentsMatchingQuery(o,e,t?r:q.min(),t?i:K()))).next((c=>(hT(s,Ky(e),c),{documents:c,Qs:i})))))}function hT(n,e,t){let s=n.Os.get(e)||q.min();t.forEach(((r,i)=>{i.readTime.compareTo(s)>0&&(s=i.readTime)})),n.Os.set(e,s)}class ah{constructor(){this.activeTargetIds=eE()}zs(e){this.activeTargetIds=this.activeTargetIds.add(e)}js(e){this.activeTargetIds=this.activeTargetIds.delete(e)}Gs(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class dT{constructor(){this.Mo=new ah,this.xo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,s){}addLocalQueryTarget(e,t=!0){return t&&this.Mo.zs(e),this.xo[e]||"not-current"}updateQueryState(e,t,s){this.xo[e]=t}removeLocalQueryTarget(e){this.Mo.js(e)}isLocalQueryTarget(e){return this.Mo.activeTargetIds.has(e)}clearQueryState(e){delete this.xo[e]}getAllActiveQueryTargets(){return this.Mo.activeTargetIds}isActiveQueryTarget(e){return this.Mo.activeTargetIds.has(e)}start(){return this.Mo=new ah,Promise.resolve()}handleUserChange(e,t,s){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fT{Oo(e){}shutdown(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ch="ConnectivityMonitor";class lh{constructor(){this.No=()=>this.Bo(),this.Lo=()=>this.ko(),this.qo=[],this.Qo()}Oo(e){this.qo.push(e)}shutdown(){window.removeEventListener("online",this.No),window.removeEventListener("offline",this.Lo)}Qo(){window.addEventListener("online",this.No),window.addEventListener("offline",this.Lo)}Bo(){M(ch,"Network connectivity changed: AVAILABLE");for(const e of this.qo)e(0)}ko(){M(ch,"Network connectivity changed: UNAVAILABLE");for(const e of this.qo)e(1)}static v(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Hr=null;function Aa(){return Hr===null?Hr=(function(){return 268435456+Math.round(2147483648*Math.random())})():Hr++,"0x"+Hr.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Wo="RestConnection",pT={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};class _T{get $o(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const t=e.ssl?"https":"http",s=encodeURIComponent(this.databaseId.projectId),r=encodeURIComponent(this.databaseId.database);this.Uo=t+"://"+e.host,this.Ko=`projects/${s}/databases/${r}`,this.Wo=this.databaseId.database===fa?`project_id=${s}`:`project_id=${s}&database_id=${r}`}Go(e,t,s,r,i){const o=Aa(),c=this.zo(e,t.toUriEncodedString());M(Wo,`Sending RPC '${e}' ${o}:`,c,s);const l={"google-cloud-resource-prefix":this.Ko,"x-goog-request-params":this.Wo};this.jo(l,r,i);const{host:h}=new URL(c),f=Ot(h);return this.Jo(e,c,l,s,f).then((p=>(M(Wo,`Received RPC '${e}' ${o}: `,p),p)),(p=>{throw Kn(Wo,`RPC '${e}' ${o} failed with error: `,p,"url: ",c,"request:",s),p}))}Ho(e,t,s,r,i,o){return this.Go(e,t,s,r,i)}jo(e,t,s){e["X-Goog-Api-Client"]=(function(){return"gl-js/ fire/"+os})(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach(((r,i)=>e[i]=r)),s&&s.headers.forEach(((r,i)=>e[i]=r))}zo(e,t){const s=pT[e];return`${this.Uo}/v1/${t}:${s}`}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mT{constructor(e){this.Yo=e.Yo,this.Zo=e.Zo}Xo(e){this.e_=e}t_(e){this.n_=e}r_(e){this.i_=e}onMessage(e){this.s_=e}close(){this.Zo()}send(e){this.Yo(e)}o_(){this.e_()}__(){this.n_()}a_(e){this.i_(e)}u_(e){this.s_(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Me="WebChannelConnection";class gT extends _T{constructor(e){super(e),this.c_=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}Jo(e,t,s,r,i){const o=Aa();return new Promise(((c,l)=>{const h=new Fd;h.setWithCredentials(!0),h.listenOnce(Ud.COMPLETE,(()=>{try{switch(h.getLastErrorCode()){case Jr.NO_ERROR:const p=h.getResponseJson();M(Me,`XHR for RPC '${e}' ${o} received:`,JSON.stringify(p)),c(p);break;case Jr.TIMEOUT:M(Me,`RPC '${e}' ${o} timed out`),l(new V(b.DEADLINE_EXCEEDED,"Request time out"));break;case Jr.HTTP_ERROR:const m=h.getStatus();if(M(Me,`RPC '${e}' ${o} failed with status:`,m,"response text:",h.getResponseText()),m>0){let w=h.getResponseJson();Array.isArray(w)&&(w=w[0]);const S=w==null?void 0:w.error;if(S&&S.status&&S.message){const k=(function(x){const U=x.toLowerCase().replace(/_/g,"-");return Object.values(b).indexOf(U)>=0?U:b.UNKNOWN})(S.status);l(new V(k,S.message))}else l(new V(b.UNKNOWN,"Server responded with status "+h.getStatus()))}else l(new V(b.UNAVAILABLE,"Connection failed."));break;default:F(9055,{l_:e,streamId:o,h_:h.getLastErrorCode(),P_:h.getLastError()})}}finally{M(Me,`RPC '${e}' ${o} completed.`)}}));const f=JSON.stringify(r);M(Me,`RPC '${e}' ${o} sending request:`,r),h.send(t,"POST",f,s,15)}))}T_(e,t,s){const r=Aa(),i=[this.Uo,"/","google.firestore.v1.Firestore","/",e,"/channel"],o=$d(),c=qd(),l={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},h=this.longPollingOptions.timeoutSeconds;h!==void 0&&(l.longPollingTimeout=Math.round(1e3*h)),this.useFetchStreams&&(l.useFetchStreams=!0),this.jo(l.initMessageHeaders,t,s),l.encodeInitMessageHeaders=!0;const f=i.join("");M(Me,`Creating RPC '${e}' stream ${r}: ${f}`,l);const p=o.createWebChannel(f,l);this.I_(p);let m=!1,w=!1;const S=new mT({Yo:N=>{w?M(Me,`Not sending because RPC '${e}' stream ${r} is closed:`,N):(m||(M(Me,`Opening RPC '${e}' stream ${r} transport.`),p.open(),m=!0),M(Me,`RPC '${e}' stream ${r} sending:`,N),p.send(N))},Zo:()=>p.close()}),k=(N,x,U)=>{N.listen(x,($=>{try{U($)}catch(Q){setTimeout((()=>{throw Q}),0)}}))};return k(p,xs.EventType.OPEN,(()=>{w||(M(Me,`RPC '${e}' stream ${r} transport opened.`),S.o_())})),k(p,xs.EventType.CLOSE,(()=>{w||(w=!0,M(Me,`RPC '${e}' stream ${r} transport closed`),S.a_(),this.E_(p))})),k(p,xs.EventType.ERROR,(N=>{w||(w=!0,Kn(Me,`RPC '${e}' stream ${r} transport errored. Name:`,N.name,"Message:",N.message),S.a_(new V(b.UNAVAILABLE,"The operation could not be completed")))})),k(p,xs.EventType.MESSAGE,(N=>{var x;if(!w){const U=N.data[0];Z(!!U,16349);const $=U,Q=($==null?void 0:$.error)||((x=$[0])==null?void 0:x.error);if(Q){M(Me,`RPC '${e}' stream ${r} received error:`,Q);const Ae=Q.status;let ue=(function(E){const I=ge[E];if(I!==void 0)return Af(I)})(Ae),v=Q.message;ue===void 0&&(ue=b.INTERNAL,v="Unknown error status: "+Ae+" with message "+Q.message),w=!0,S.a_(new V(ue,v)),p.close()}else M(Me,`RPC '${e}' stream ${r} received:`,U),S.u_(U)}})),k(c,Bd.STAT_EVENT,(N=>{N.stat===la.PROXY?M(Me,`RPC '${e}' stream ${r} detected buffering proxy`):N.stat===la.NOPROXY&&M(Me,`RPC '${e}' stream ${r} detected no buffering proxy`)})),setTimeout((()=>{S.__()}),0),S}terminate(){this.c_.forEach((e=>e.close())),this.c_=[]}I_(e){this.c_.push(e)}E_(e){this.c_=this.c_.filter((t=>t===e))}}function zo(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Yi(n){return new vE(n,!0)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Uf{constructor(e,t,s=1e3,r=1.5,i=6e4){this.Mi=e,this.timerId=t,this.d_=s,this.A_=r,this.R_=i,this.V_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.V_=0}g_(){this.V_=this.R_}p_(e){this.cancel();const t=Math.floor(this.V_+this.y_()),s=Math.max(0,Date.now()-this.f_),r=Math.max(0,t-s);r>0&&M("ExponentialBackoff",`Backing off for ${r} ms (base delay: ${this.V_} ms, delay with jitter: ${t} ms, last attempt: ${s} ms ago)`),this.m_=this.Mi.enqueueAfterDelay(this.timerId,r,(()=>(this.f_=Date.now(),e()))),this.V_*=this.A_,this.V_<this.d_&&(this.V_=this.d_),this.V_>this.R_&&(this.V_=this.R_)}w_(){this.m_!==null&&(this.m_.skipDelay(),this.m_=null)}cancel(){this.m_!==null&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.V_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const uh="PersistentStream";class Bf{constructor(e,t,s,r,i,o,c,l){this.Mi=e,this.S_=s,this.b_=r,this.connection=i,this.authCredentialsProvider=o,this.appCheckCredentialsProvider=c,this.listener=l,this.state=0,this.D_=0,this.C_=null,this.v_=null,this.stream=null,this.F_=0,this.M_=new Uf(e,t)}x_(){return this.state===1||this.state===5||this.O_()}O_(){return this.state===2||this.state===3}start(){this.F_=0,this.state!==4?this.auth():this.N_()}async stop(){this.x_()&&await this.close(0)}B_(){this.state=0,this.M_.reset()}L_(){this.O_()&&this.C_===null&&(this.C_=this.Mi.enqueueAfterDelay(this.S_,6e4,(()=>this.k_())))}q_(e){this.Q_(),this.stream.send(e)}async k_(){if(this.O_())return this.close(0)}Q_(){this.C_&&(this.C_.cancel(),this.C_=null)}U_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(e,t){this.Q_(),this.U_(),this.M_.cancel(),this.D_++,e!==4?this.M_.reset():t&&t.code===b.RESOURCE_EXHAUSTED?(Nt(t.toString()),Nt("Using maximum backoff delay to prevent overloading the backend."),this.M_.g_()):t&&t.code===b.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.K_(),this.stream.close(),this.stream=null),this.state=e,await this.listener.r_(t)}K_(){}auth(){this.state=1;const e=this.W_(this.D_),t=this.D_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then((([s,r])=>{this.D_===t&&this.G_(s,r)}),(s=>{e((()=>{const r=new V(b.UNKNOWN,"Fetching auth token failed: "+s.message);return this.z_(r)}))}))}G_(e,t){const s=this.W_(this.D_);this.stream=this.j_(e,t),this.stream.Xo((()=>{s((()=>this.listener.Xo()))})),this.stream.t_((()=>{s((()=>(this.state=2,this.v_=this.Mi.enqueueAfterDelay(this.b_,1e4,(()=>(this.O_()&&(this.state=3),Promise.resolve()))),this.listener.t_())))})),this.stream.r_((r=>{s((()=>this.z_(r)))})),this.stream.onMessage((r=>{s((()=>++this.F_==1?this.J_(r):this.onNext(r)))}))}N_(){this.state=5,this.M_.p_((async()=>{this.state=0,this.start()}))}z_(e){return M(uh,`close with error: ${e}`),this.stream=null,this.close(4,e)}W_(e){return t=>{this.Mi.enqueueAndForget((()=>this.D_===e?t():(M(uh,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve())))}}}class yT extends Bf{constructor(e,t,s,r,i,o){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,s,r,o),this.serializer=i}j_(e,t){return this.connection.T_("Listen",e,t)}J_(e){return this.onNext(e)}onNext(e){this.M_.reset();const t=AE(this.serializer,e),s=(function(i){if(!("targetChange"in i))return q.min();const o=i.targetChange;return o.targetIds&&o.targetIds.length?q.min():o.readTime?gt(o.readTime):q.min()})(e);return this.listener.H_(t,s)}Y_(e){const t={};t.database=Ia(this.serializer),t.addTarget=(function(i,o){let c;const l=o.target;if(c=ga(l)?{documents:SE(i,l)}:{query:kf(i,l).ft},c.targetId=o.targetId,o.resumeToken.approximateByteSize()>0){c.resumeToken=Sf(i,o.resumeToken);const h=Ea(i,o.expectedCount);h!==null&&(c.expectedCount=h)}else if(o.snapshotVersion.compareTo(q.min())>0){c.readTime=mi(i,o.snapshotVersion.toTimestamp());const h=Ea(i,o.expectedCount);h!==null&&(c.expectedCount=h)}return c})(this.serializer,e);const s=NE(this.serializer,e);s&&(t.labels=s),this.q_(t)}Z_(e){const t={};t.database=Ia(this.serializer),t.removeTarget=e,this.q_(t)}}class ET extends Bf{constructor(e,t,s,r,i,o){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,s,r,o),this.serializer=i}get X_(){return this.F_>0}start(){this.lastStreamToken=void 0,super.start()}K_(){this.X_&&this.ea([])}j_(e,t){return this.connection.T_("Write",e,t)}J_(e){return Z(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,Z(!e.writeResults||e.writeResults.length===0,55816),this.listener.ta()}onNext(e){Z(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this.M_.reset();const t=RE(e.writeResults,e.commitTime),s=gt(e.commitTime);return this.listener.na(s,t)}ra(){const e={};e.database=Ia(this.serializer),this.q_(e)}ea(e){const t={streamToken:this.lastStreamToken,writes:e.map((s=>CE(this.serializer,s)))};this.q_(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class TT{}class vT extends TT{constructor(e,t,s,r){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=s,this.serializer=r,this.ia=!1}sa(){if(this.ia)throw new V(b.FAILED_PRECONDITION,"The client has already been terminated.")}Go(e,t,s,r){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([i,o])=>this.connection.Go(e,Ta(t,s),r,i,o))).catch((i=>{throw i.name==="FirebaseError"?(i.code===b.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),i):new V(b.UNKNOWN,i.toString())}))}Ho(e,t,s,r,i){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([o,c])=>this.connection.Ho(e,Ta(t,s),r,o,c,i))).catch((o=>{throw o.name==="FirebaseError"?(o.code===b.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new V(b.UNKNOWN,o.toString())}))}terminate(){this.ia=!0,this.connection.terminate()}}class IT{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.oa=0,this._a=null,this.aa=!0}ua(){this.oa===0&&(this.ca("Unknown"),this._a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,(()=>(this._a=null,this.la("Backend didn't respond within 10 seconds."),this.ca("Offline"),Promise.resolve()))))}ha(e){this.state==="Online"?this.ca("Unknown"):(this.oa++,this.oa>=1&&(this.Pa(),this.la(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.ca("Offline")))}set(e){this.Pa(),this.oa=0,e==="Online"&&(this.aa=!1),this.ca(e)}ca(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}la(e){const t=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.aa?(Nt(t),this.aa=!1):M("OnlineStateTracker",t)}Pa(){this._a!==null&&(this._a.cancel(),this._a=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const In="RemoteStore";class wT{constructor(e,t,s,r,i){this.localStore=e,this.datastore=t,this.asyncQueue=s,this.remoteSyncer={},this.Ta=[],this.Ia=new Map,this.Ea=new Set,this.da=[],this.Aa=i,this.Aa.Oo((o=>{s.enqueueAndForget((async()=>{Pn(this)&&(M(In,"Restarting streams for network reachability change."),await(async function(l){const h=B(l);h.Ea.add(4),await gr(h),h.Ra.set("Unknown"),h.Ea.delete(4),await Xi(h)})(this))}))})),this.Ra=new IT(s,r)}}async function Xi(n){if(Pn(n))for(const e of n.da)await e(!0)}async function gr(n){for(const e of n.da)await e(!1)}function qf(n,e){const t=B(n);t.Ia.has(e.targetId)||(t.Ia.set(e.targetId,e),Ec(t)?yc(t):us(t).O_()&&gc(t,e))}function mc(n,e){const t=B(n),s=us(t);t.Ia.delete(e),s.O_()&&$f(t,e),t.Ia.size===0&&(s.O_()?s.L_():Pn(t)&&t.Ra.set("Unknown"))}function gc(n,e){if(n.Va.Ue(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(q.min())>0){const t=n.remoteSyncer.getRemoteKeysForTarget(e.targetId).size;e=e.withExpectedCount(t)}us(n).Y_(e)}function $f(n,e){n.Va.Ue(e),us(n).Z_(e)}function yc(n){n.Va=new gE({getRemoteKeysForTarget:e=>n.remoteSyncer.getRemoteKeysForTarget(e),At:e=>n.Ia.get(e)||null,ht:()=>n.datastore.serializer.databaseId}),us(n).start(),n.Ra.ua()}function Ec(n){return Pn(n)&&!us(n).x_()&&n.Ia.size>0}function Pn(n){return B(n).Ea.size===0}function jf(n){n.Va=void 0}async function AT(n){n.Ra.set("Online")}async function CT(n){n.Ia.forEach(((e,t)=>{gc(n,e)}))}async function RT(n,e){jf(n),Ec(n)?(n.Ra.ha(e),yc(n)):n.Ra.set("Unknown")}async function ST(n,e,t){if(n.Ra.set("Online"),e instanceof Rf&&e.state===2&&e.cause)try{await(async function(r,i){const o=i.cause;for(const c of i.targetIds)r.Ia.has(c)&&(await r.remoteSyncer.rejectListen(c,o),r.Ia.delete(c),r.Va.removeTarget(c))})(n,e)}catch(s){M(In,"Failed to remove targets %s: %s ",e.targetIds.join(","),s),await yi(n,s)}else if(e instanceof ni?n.Va.Ze(e):e instanceof Cf?n.Va.st(e):n.Va.tt(e),!t.isEqual(q.min()))try{const s=await Ff(n.localStore);t.compareTo(s)>=0&&await(function(i,o){const c=i.Va.Tt(o);return c.targetChanges.forEach(((l,h)=>{if(l.resumeToken.approximateByteSize()>0){const f=i.Ia.get(h);f&&i.Ia.set(h,f.withResumeToken(l.resumeToken,o))}})),c.targetMismatches.forEach(((l,h)=>{const f=i.Ia.get(l);if(!f)return;i.Ia.set(l,f.withResumeToken(Oe.EMPTY_BYTE_STRING,f.snapshotVersion)),$f(i,l);const p=new Wt(f.target,l,h,f.sequenceNumber);gc(i,p)})),i.remoteSyncer.applyRemoteEvent(c)})(n,t)}catch(s){M(In,"Failed to raise snapshot:",s),await yi(n,s)}}async function yi(n,e,t){if(!cs(e))throw e;n.Ea.add(1),await gr(n),n.Ra.set("Offline"),t||(t=()=>Ff(n.localStore)),n.asyncQueue.enqueueRetryable((async()=>{M(In,"Retrying IndexedDB access"),await t(),n.Ea.delete(1),await Xi(n)}))}function Wf(n,e){return e().catch((t=>yi(n,t,e)))}async function Ji(n){const e=B(n),t=en(e);let s=e.Ta.length>0?e.Ta[e.Ta.length-1].batchId:sc;for(;bT(e);)try{const r=await lT(e.localStore,s);if(r===null){e.Ta.length===0&&t.L_();break}s=r.batchId,PT(e,r)}catch(r){await yi(e,r)}zf(e)&&Hf(e)}function bT(n){return Pn(n)&&n.Ta.length<10}function PT(n,e){n.Ta.push(e);const t=en(n);t.O_()&&t.X_&&t.ea(e.mutations)}function zf(n){return Pn(n)&&!en(n).x_()&&n.Ta.length>0}function Hf(n){en(n).start()}async function NT(n){en(n).ra()}async function kT(n){const e=en(n);for(const t of n.Ta)e.ea(t.mutations)}async function DT(n,e,t){const s=n.Ta.shift(),r=lc.from(s,e,t);await Wf(n,(()=>n.remoteSyncer.applySuccessfulWrite(r))),await Ji(n)}async function OT(n,e){e&&en(n).X_&&await(async function(s,r){if((function(o){return pE(o)&&o!==b.ABORTED})(r.code)){const i=s.Ta.shift();en(s).B_(),await Wf(s,(()=>s.remoteSyncer.rejectFailedWrite(i.batchId,r))),await Ji(s)}})(n,e),zf(n)&&Hf(n)}async function hh(n,e){const t=B(n);t.asyncQueue.verifyOperationInProgress(),M(In,"RemoteStore received new credentials");const s=Pn(t);t.Ea.add(3),await gr(t),s&&t.Ra.set("Unknown"),await t.remoteSyncer.handleCredentialChange(e),t.Ea.delete(3),await Xi(t)}async function VT(n,e){const t=B(n);e?(t.Ea.delete(2),await Xi(t)):e||(t.Ea.add(2),await gr(t),t.Ra.set("Unknown"))}function us(n){return n.ma||(n.ma=(function(t,s,r){const i=B(t);return i.sa(),new yT(s,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,r)})(n.datastore,n.asyncQueue,{Xo:AT.bind(null,n),t_:CT.bind(null,n),r_:RT.bind(null,n),H_:ST.bind(null,n)}),n.da.push((async e=>{e?(n.ma.B_(),Ec(n)?yc(n):n.Ra.set("Unknown")):(await n.ma.stop(),jf(n))}))),n.ma}function en(n){return n.fa||(n.fa=(function(t,s,r){const i=B(t);return i.sa(),new ET(s,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,r)})(n.datastore,n.asyncQueue,{Xo:()=>Promise.resolve(),t_:NT.bind(null,n),r_:OT.bind(null,n),ta:kT.bind(null,n),na:DT.bind(null,n)}),n.da.push((async e=>{e?(n.fa.B_(),await Ji(n)):(await n.fa.stop(),n.Ta.length>0&&(M(In,`Stopping write stream with ${n.Ta.length} pending writes`),n.Ta=[]))}))),n.fa}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Tc{constructor(e,t,s,r,i){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=s,this.op=r,this.removalCallback=i,this.deferred=new _t,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch((o=>{}))}get promise(){return this.deferred.promise}static createAndSchedule(e,t,s,r,i){const o=Date.now()+s,c=new Tc(e,t,o,r,i);return c.start(s),c}start(e){this.timerHandle=setTimeout((()=>this.handleDelayElapsed()),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new V(b.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget((()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then((e=>this.deferred.resolve(e)))):Promise.resolve()))}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function vc(n,e){if(Nt("AsyncQueue",`${e}: ${n}`),cs(n))return new V(b.UNAVAILABLE,`${e}: ${n}`);throw n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qn{static emptySet(e){return new qn(e.comparator)}constructor(e){this.comparator=e?(t,s)=>e(t,s)||L.comparator(t.key,s.key):(t,s)=>L.comparator(t.key,s.key),this.keyedMap=Fs(),this.sortedSet=new ve(this.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal(((t,s)=>(e(t),!1)))}add(e){const t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){const t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof qn)||this.size!==e.size)return!1;const t=this.sortedSet.getIterator(),s=e.sortedSet.getIterator();for(;t.hasNext();){const r=t.getNext().key,i=s.getNext().key;if(!r.isEqual(i))return!1}return!0}toString(){const e=[];return this.forEach((t=>{e.push(t.toString())})),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,t){const s=new qn;return s.comparator=this.comparator,s.keyedMap=e,s.sortedSet=t,s}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class dh{constructor(){this.ga=new ve(L.comparator)}track(e){const t=e.doc.key,s=this.ga.get(t);s?e.type!==0&&s.type===3?this.ga=this.ga.insert(t,e):e.type===3&&s.type!==1?this.ga=this.ga.insert(t,{type:s.type,doc:e.doc}):e.type===2&&s.type===2?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):e.type===2&&s.type===0?this.ga=this.ga.insert(t,{type:0,doc:e.doc}):e.type===1&&s.type===0?this.ga=this.ga.remove(t):e.type===1&&s.type===2?this.ga=this.ga.insert(t,{type:1,doc:s.doc}):e.type===0&&s.type===1?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):F(63341,{Rt:e,pa:s}):this.ga=this.ga.insert(t,e)}ya(){const e=[];return this.ga.inorderTraversal(((t,s)=>{e.push(s)})),e}}class Zn{constructor(e,t,s,r,i,o,c,l,h){this.query=e,this.docs=t,this.oldDocs=s,this.docChanges=r,this.mutatedKeys=i,this.fromCache=o,this.syncStateChanged=c,this.excludesMetadataChanges=l,this.hasCachedResults=h}static fromInitialDocuments(e,t,s,r,i){const o=[];return t.forEach((c=>{o.push({type:0,doc:c})})),new Zn(e,t,qn.emptySet(t),o,s,r,!0,!1,i)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&Wi(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const t=this.docChanges,s=e.docChanges;if(t.length!==s.length)return!1;for(let r=0;r<t.length;r++)if(t[r].type!==s[r].type||!t[r].doc.isEqual(s[r].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class MT{constructor(){this.wa=void 0,this.Sa=[]}ba(){return this.Sa.some((e=>e.Da()))}}class LT{constructor(){this.queries=fh(),this.onlineState="Unknown",this.Ca=new Set}terminate(){(function(t,s){const r=B(t),i=r.queries;r.queries=fh(),i.forEach(((o,c)=>{for(const l of c.Sa)l.onError(s)}))})(this,new V(b.ABORTED,"Firestore shutting down"))}}function fh(){return new bn((n=>df(n)),Wi)}async function Ic(n,e){const t=B(n);let s=3;const r=e.query;let i=t.queries.get(r);i?!i.ba()&&e.Da()&&(s=2):(i=new MT,s=e.Da()?0:1);try{switch(s){case 0:i.wa=await t.onListen(r,!0);break;case 1:i.wa=await t.onListen(r,!1);break;case 2:await t.onFirstRemoteStoreListen(r)}}catch(o){const c=vc(o,`Initialization of query '${Fn(e.query)}' failed`);return void e.onError(c)}t.queries.set(r,i),i.Sa.push(e),e.va(t.onlineState),i.wa&&e.Fa(i.wa)&&Ac(t)}async function wc(n,e){const t=B(n),s=e.query;let r=3;const i=t.queries.get(s);if(i){const o=i.Sa.indexOf(e);o>=0&&(i.Sa.splice(o,1),i.Sa.length===0?r=e.Da()?0:1:!i.ba()&&e.Da()&&(r=2))}switch(r){case 0:return t.queries.delete(s),t.onUnlisten(s,!0);case 1:return t.queries.delete(s),t.onUnlisten(s,!1);case 2:return t.onLastRemoteStoreUnlisten(s);default:return}}function xT(n,e){const t=B(n);let s=!1;for(const r of e){const i=r.query,o=t.queries.get(i);if(o){for(const c of o.Sa)c.Fa(r)&&(s=!0);o.wa=r}}s&&Ac(t)}function FT(n,e,t){const s=B(n),r=s.queries.get(e);if(r)for(const i of r.Sa)i.onError(t);s.queries.delete(e)}function Ac(n){n.Ca.forEach((e=>{e.next()}))}var Ca,ph;(ph=Ca||(Ca={})).Ma="default",ph.Cache="cache";class Cc{constructor(e,t,s){this.query=e,this.xa=t,this.Oa=!1,this.Na=null,this.onlineState="Unknown",this.options=s||{}}Fa(e){if(!this.options.includeMetadataChanges){const s=[];for(const r of e.docChanges)r.type!==3&&s.push(r);e=new Zn(e.query,e.docs,e.oldDocs,s,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.Oa?this.Ba(e)&&(this.xa.next(e),t=!0):this.La(e,this.onlineState)&&(this.ka(e),t=!0),this.Na=e,t}onError(e){this.xa.error(e)}va(e){this.onlineState=e;let t=!1;return this.Na&&!this.Oa&&this.La(this.Na,e)&&(this.ka(this.Na),t=!0),t}La(e,t){if(!e.fromCache||!this.Da())return!0;const s=t!=="Offline";return(!this.options.qa||!s)&&(!e.docs.isEmpty()||e.hasCachedResults||t==="Offline")}Ba(e){if(e.docChanges.length>0)return!0;const t=this.Na&&this.Na.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&this.options.includeMetadataChanges===!0}ka(e){e=Zn.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.Oa=!0,this.xa.next(e)}Da(){return this.options.source!==Ca.Cache}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gf{constructor(e){this.key=e}}class Kf{constructor(e){this.key=e}}class UT{constructor(e,t){this.query=e,this.Ya=t,this.Za=null,this.hasCachedResults=!1,this.current=!1,this.Xa=K(),this.mutatedKeys=K(),this.eu=ff(e),this.tu=new qn(this.eu)}get nu(){return this.Ya}ru(e,t){const s=t?t.iu:new dh,r=t?t.tu:this.tu;let i=t?t.mutatedKeys:this.mutatedKeys,o=r,c=!1;const l=this.query.limitType==="F"&&r.size===this.query.limit?r.last():null,h=this.query.limitType==="L"&&r.size===this.query.limit?r.first():null;if(e.inorderTraversal(((f,p)=>{const m=r.get(f),w=zi(this.query,p)?p:null,S=!!m&&this.mutatedKeys.has(m.key),k=!!w&&(w.hasLocalMutations||this.mutatedKeys.has(w.key)&&w.hasCommittedMutations);let N=!1;m&&w?m.data.isEqual(w.data)?S!==k&&(s.track({type:3,doc:w}),N=!0):this.su(m,w)||(s.track({type:2,doc:w}),N=!0,(l&&this.eu(w,l)>0||h&&this.eu(w,h)<0)&&(c=!0)):!m&&w?(s.track({type:0,doc:w}),N=!0):m&&!w&&(s.track({type:1,doc:m}),N=!0,(l||h)&&(c=!0)),N&&(w?(o=o.add(w),i=k?i.add(f):i.delete(f)):(o=o.delete(f),i=i.delete(f)))})),this.query.limit!==null)for(;o.size>this.query.limit;){const f=this.query.limitType==="F"?o.last():o.first();o=o.delete(f.key),i=i.delete(f.key),s.track({type:1,doc:f})}return{tu:o,iu:s,Cs:c,mutatedKeys:i}}su(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,s,r){const i=this.tu;this.tu=e.tu,this.mutatedKeys=e.mutatedKeys;const o=e.iu.ya();o.sort(((f,p)=>(function(w,S){const k=N=>{switch(N){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return F(20277,{Rt:N})}};return k(w)-k(S)})(f.type,p.type)||this.eu(f.doc,p.doc))),this.ou(s),r=r??!1;const c=t&&!r?this._u():[],l=this.Xa.size===0&&this.current&&!r?1:0,h=l!==this.Za;return this.Za=l,o.length!==0||h?{snapshot:new Zn(this.query,e.tu,i,o,e.mutatedKeys,l===0,h,!1,!!s&&s.resumeToken.approximateByteSize()>0),au:c}:{au:c}}va(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({tu:this.tu,iu:new dh,mutatedKeys:this.mutatedKeys,Cs:!1},!1)):{au:[]}}uu(e){return!this.Ya.has(e)&&!!this.tu.has(e)&&!this.tu.get(e).hasLocalMutations}ou(e){e&&(e.addedDocuments.forEach((t=>this.Ya=this.Ya.add(t))),e.modifiedDocuments.forEach((t=>{})),e.removedDocuments.forEach((t=>this.Ya=this.Ya.delete(t))),this.current=e.current)}_u(){if(!this.current)return[];const e=this.Xa;this.Xa=K(),this.tu.forEach((s=>{this.uu(s.key)&&(this.Xa=this.Xa.add(s.key))}));const t=[];return e.forEach((s=>{this.Xa.has(s)||t.push(new Kf(s))})),this.Xa.forEach((s=>{e.has(s)||t.push(new Gf(s))})),t}cu(e){this.Ya=e.Qs,this.Xa=K();const t=this.ru(e.documents);return this.applyChanges(t,!0)}lu(){return Zn.fromInitialDocuments(this.query,this.tu,this.mutatedKeys,this.Za===0,this.hasCachedResults)}}const Rc="SyncEngine";class BT{constructor(e,t,s){this.query=e,this.targetId=t,this.view=s}}class qT{constructor(e){this.key=e,this.hu=!1}}class $T{constructor(e,t,s,r,i,o){this.localStore=e,this.remoteStore=t,this.eventManager=s,this.sharedClientState=r,this.currentUser=i,this.maxConcurrentLimboResolutions=o,this.Pu={},this.Tu=new bn((c=>df(c)),Wi),this.Iu=new Map,this.Eu=new Set,this.du=new ve(L.comparator),this.Au=new Map,this.Ru=new dc,this.Vu={},this.mu=new Map,this.fu=Jn.cr(),this.onlineState="Unknown",this.gu=void 0}get isPrimaryClient(){return this.gu===!0}}async function jT(n,e,t=!0){const s=ep(n);let r;const i=s.Tu.get(e);return i?(s.sharedClientState.addLocalQueryTarget(i.targetId),r=i.view.lu()):r=await Qf(s,e,t,!0),r}async function WT(n,e){const t=ep(n);await Qf(t,e,!0,!1)}async function Qf(n,e,t,s){const r=await uT(n.localStore,mt(e)),i=r.targetId,o=n.sharedClientState.addLocalQueryTarget(i,t);let c;return s&&(c=await zT(n,e,i,o==="current",r.resumeToken)),n.isPrimaryClient&&t&&qf(n.remoteStore,r),c}async function zT(n,e,t,s,r){n.pu=(p,m,w)=>(async function(k,N,x,U){let $=N.view.ru(x);$.Cs&&($=await oh(k.localStore,N.query,!1).then((({documents:v})=>N.view.ru(v,$))));const Q=U&&U.targetChanges.get(N.targetId),Ae=U&&U.targetMismatches.get(N.targetId)!=null,ue=N.view.applyChanges($,k.isPrimaryClient,Q,Ae);return mh(k,N.targetId,ue.au),ue.snapshot})(n,p,m,w);const i=await oh(n.localStore,e,!0),o=new UT(e,i.Qs),c=o.ru(i.documents),l=mr.createSynthesizedTargetChangeForCurrentChange(t,s&&n.onlineState!=="Offline",r),h=o.applyChanges(c,n.isPrimaryClient,l);mh(n,t,h.au);const f=new BT(e,t,o);return n.Tu.set(e,f),n.Iu.has(t)?n.Iu.get(t).push(e):n.Iu.set(t,[e]),h.snapshot}async function HT(n,e,t){const s=B(n),r=s.Tu.get(e),i=s.Iu.get(r.targetId);if(i.length>1)return s.Iu.set(r.targetId,i.filter((o=>!Wi(o,e)))),void s.Tu.delete(e);s.isPrimaryClient?(s.sharedClientState.removeLocalQueryTarget(r.targetId),s.sharedClientState.isActiveQueryTarget(r.targetId)||await wa(s.localStore,r.targetId,!1).then((()=>{s.sharedClientState.clearQueryState(r.targetId),t&&mc(s.remoteStore,r.targetId),Ra(s,r.targetId)})).catch(as)):(Ra(s,r.targetId),await wa(s.localStore,r.targetId,!0))}async function GT(n,e){const t=B(n),s=t.Tu.get(e),r=t.Iu.get(s.targetId);t.isPrimaryClient&&r.length===1&&(t.sharedClientState.removeLocalQueryTarget(s.targetId),mc(t.remoteStore,s.targetId))}async function KT(n,e,t){const s=tv(n);try{const r=await(function(o,c){const l=B(o),h=le.now(),f=c.reduce(((w,S)=>w.add(S.key)),K());let p,m;return l.persistence.runTransaction("Locally write mutations","readwrite",(w=>{let S=kt(),k=K();return l.Ns.getEntries(w,f).next((N=>{S=N,S.forEach(((x,U)=>{U.isValidDocument()||(k=k.add(x))}))})).next((()=>l.localDocuments.getOverlayedDocuments(w,S))).next((N=>{p=N;const x=[];for(const U of c){const $=cE(U,p.get(U.key).overlayedDocument);$!=null&&x.push(new rn(U.key,$,nf($.value.mapValue),$e.exists(!0)))}return l.mutationQueue.addMutationBatch(w,h,x,c)})).next((N=>{m=N;const x=N.applyToLocalDocumentSet(p,k);return l.documentOverlayCache.saveOverlays(w,N.batchId,x)}))})).then((()=>({batchId:m.batchId,changes:_f(p)})))})(s.localStore,e);s.sharedClientState.addPendingMutation(r.batchId),(function(o,c,l){let h=o.Vu[o.currentUser.toKey()];h||(h=new ve(H)),h=h.insert(c,l),o.Vu[o.currentUser.toKey()]=h})(s,r.batchId,t),await yr(s,r.changes),await Ji(s.remoteStore)}catch(r){const i=vc(r,"Failed to persist write");t.reject(i)}}async function Yf(n,e){const t=B(n);try{const s=await aT(t.localStore,e);e.targetChanges.forEach(((r,i)=>{const o=t.Au.get(i);o&&(Z(r.addedDocuments.size+r.modifiedDocuments.size+r.removedDocuments.size<=1,22616),r.addedDocuments.size>0?o.hu=!0:r.modifiedDocuments.size>0?Z(o.hu,14607):r.removedDocuments.size>0&&(Z(o.hu,42227),o.hu=!1))})),await yr(t,s,e)}catch(s){await as(s)}}function _h(n,e,t){const s=B(n);if(s.isPrimaryClient&&t===0||!s.isPrimaryClient&&t===1){const r=[];s.Tu.forEach(((i,o)=>{const c=o.view.va(e);c.snapshot&&r.push(c.snapshot)})),(function(o,c){const l=B(o);l.onlineState=c;let h=!1;l.queries.forEach(((f,p)=>{for(const m of p.Sa)m.va(c)&&(h=!0)})),h&&Ac(l)})(s.eventManager,e),r.length&&s.Pu.H_(r),s.onlineState=e,s.isPrimaryClient&&s.sharedClientState.setOnlineState(e)}}async function QT(n,e,t){const s=B(n);s.sharedClientState.updateQueryState(e,"rejected",t);const r=s.Au.get(e),i=r&&r.key;if(i){let o=new ve(L.comparator);o=o.insert(i,xe.newNoDocument(i,q.min()));const c=K().add(i),l=new Qi(q.min(),new Map,new ve(H),o,c);await Yf(s,l),s.du=s.du.remove(i),s.Au.delete(e),Sc(s)}else await wa(s.localStore,e,!1).then((()=>Ra(s,e,t))).catch(as)}async function YT(n,e){const t=B(n),s=e.batch.batchId;try{const r=await oT(t.localStore,e);Jf(t,s,null),Xf(t,s),t.sharedClientState.updateMutationState(s,"acknowledged"),await yr(t,r)}catch(r){await as(r)}}async function XT(n,e,t){const s=B(n);try{const r=await(function(o,c){const l=B(o);return l.persistence.runTransaction("Reject batch","readwrite-primary",(h=>{let f;return l.mutationQueue.lookupMutationBatch(h,c).next((p=>(Z(p!==null,37113),f=p.keys(),l.mutationQueue.removeMutationBatch(h,p)))).next((()=>l.mutationQueue.performConsistencyCheck(h))).next((()=>l.documentOverlayCache.removeOverlaysForBatchId(h,f,c))).next((()=>l.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(h,f))).next((()=>l.localDocuments.getDocuments(h,f)))}))})(s.localStore,e);Jf(s,e,t),Xf(s,e),s.sharedClientState.updateMutationState(e,"rejected",t),await yr(s,r)}catch(r){await as(r)}}function Xf(n,e){(n.mu.get(e)||[]).forEach((t=>{t.resolve()})),n.mu.delete(e)}function Jf(n,e,t){const s=B(n);let r=s.Vu[s.currentUser.toKey()];if(r){const i=r.get(e);i&&(t?i.reject(t):i.resolve(),r=r.remove(e)),s.Vu[s.currentUser.toKey()]=r}}function Ra(n,e,t=null){n.sharedClientState.removeLocalQueryTarget(e);for(const s of n.Iu.get(e))n.Tu.delete(s),t&&n.Pu.yu(s,t);n.Iu.delete(e),n.isPrimaryClient&&n.Ru.jr(e).forEach((s=>{n.Ru.containsKey(s)||Zf(n,s)}))}function Zf(n,e){n.Eu.delete(e.path.canonicalString());const t=n.du.get(e);t!==null&&(mc(n.remoteStore,t),n.du=n.du.remove(e),n.Au.delete(t),Sc(n))}function mh(n,e,t){for(const s of t)s instanceof Gf?(n.Ru.addReference(s.key,e),JT(n,s)):s instanceof Kf?(M(Rc,"Document no longer in limbo: "+s.key),n.Ru.removeReference(s.key,e),n.Ru.containsKey(s.key)||Zf(n,s.key)):F(19791,{wu:s})}function JT(n,e){const t=e.key,s=t.path.canonicalString();n.du.get(t)||n.Eu.has(s)||(M(Rc,"New document in limbo: "+t),n.Eu.add(s),Sc(n))}function Sc(n){for(;n.Eu.size>0&&n.du.size<n.maxConcurrentLimboResolutions;){const e=n.Eu.values().next().value;n.Eu.delete(e);const t=new L(oe.fromString(e)),s=n.fu.next();n.Au.set(s,new qT(t)),n.du=n.du.insert(t,s),qf(n.remoteStore,new Wt(mt(ji(t.path)),s,"TargetPurposeLimboResolution",Bi.ce))}}async function yr(n,e,t){const s=B(n),r=[],i=[],o=[];s.Tu.isEmpty()||(s.Tu.forEach(((c,l)=>{o.push(s.pu(l,e,t).then((h=>{var f;if((h||t)&&s.isPrimaryClient){const p=h?!h.fromCache:(f=t==null?void 0:t.targetChanges.get(l.targetId))==null?void 0:f.current;s.sharedClientState.updateQueryState(l.targetId,p?"current":"not-current")}if(h){r.push(h);const p=pc.As(l.targetId,h);i.push(p)}})))})),await Promise.all(o),s.Pu.H_(r),await(async function(l,h){const f=B(l);try{await f.persistence.runTransaction("notifyLocalViewChanges","readwrite",(p=>P.forEach(h,(m=>P.forEach(m.Es,(w=>f.persistence.referenceDelegate.addReference(p,m.targetId,w))).next((()=>P.forEach(m.ds,(w=>f.persistence.referenceDelegate.removeReference(p,m.targetId,w)))))))))}catch(p){if(!cs(p))throw p;M(_c,"Failed to update sequence numbers: "+p)}for(const p of h){const m=p.targetId;if(!p.fromCache){const w=f.Ms.get(m),S=w.snapshotVersion,k=w.withLastLimboFreeSnapshotVersion(S);f.Ms=f.Ms.insert(m,k)}}})(s.localStore,i))}async function ZT(n,e){const t=B(n);if(!t.currentUser.isEqual(e)){M(Rc,"User change. New user:",e.toKey());const s=await xf(t.localStore,e);t.currentUser=e,(function(i,o){i.mu.forEach((c=>{c.forEach((l=>{l.reject(new V(b.CANCELLED,o))}))})),i.mu.clear()})(t,"'waitForPendingWrites' promise is rejected due to a user change."),t.sharedClientState.handleUserChange(e,s.removedBatchIds,s.addedBatchIds),await yr(t,s.Ls)}}function ev(n,e){const t=B(n),s=t.Au.get(e);if(s&&s.hu)return K().add(s.key);{let r=K();const i=t.Iu.get(e);if(!i)return r;for(const o of i){const c=t.Tu.get(o);r=r.unionWith(c.view.nu)}return r}}function ep(n){const e=B(n);return e.remoteStore.remoteSyncer.applyRemoteEvent=Yf.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=ev.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=QT.bind(null,e),e.Pu.H_=xT.bind(null,e.eventManager),e.Pu.yu=FT.bind(null,e.eventManager),e}function tv(n){const e=B(n);return e.remoteStore.remoteSyncer.applySuccessfulWrite=YT.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=XT.bind(null,e),e}class Ei{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=Yi(e.databaseInfo.databaseId),this.sharedClientState=this.Du(e),this.persistence=this.Cu(e),await this.persistence.start(),this.localStore=this.vu(e),this.gcScheduler=this.Fu(e,this.localStore),this.indexBackfillerScheduler=this.Mu(e,this.localStore)}Fu(e,t){return null}Mu(e,t){return null}vu(e){return iT(this.persistence,new nT,e.initialUser,this.serializer)}Cu(e){return new Lf(fc.mi,this.serializer)}Du(e){return new dT}async terminate(){var e,t;(e=this.gcScheduler)==null||e.stop(),(t=this.indexBackfillerScheduler)==null||t.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}Ei.provider={build:()=>new Ei};class nv extends Ei{constructor(e){super(),this.cacheSizeBytes=e}Fu(e,t){Z(this.persistence.referenceDelegate instanceof gi,46915);const s=this.persistence.referenceDelegate.garbageCollector;return new qE(s,e.asyncQueue,t)}Cu(e){const t=this.cacheSizeBytes!==void 0?We.withCacheSize(this.cacheSizeBytes):We.DEFAULT;return new Lf((s=>gi.mi(s,t)),this.serializer)}}class Sa{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=s=>_h(this.syncEngine,s,1),this.remoteStore.remoteSyncer.handleCredentialChange=ZT.bind(null,this.syncEngine),await VT(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return(function(){return new LT})()}createDatastore(e){const t=Yi(e.databaseInfo.databaseId),s=(function(i){return new gT(i)})(e.databaseInfo);return(function(i,o,c,l){return new vT(i,o,c,l)})(e.authCredentials,e.appCheckCredentials,s,t)}createRemoteStore(e){return(function(s,r,i,o,c){return new wT(s,r,i,o,c)})(this.localStore,this.datastore,e.asyncQueue,(t=>_h(this.syncEngine,t,0)),(function(){return lh.v()?new lh:new fT})())}createSyncEngine(e,t){return(function(r,i,o,c,l,h,f){const p=new $T(r,i,o,c,l,h);return f&&(p.gu=!0),p})(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){var e,t;await(async function(r){const i=B(r);M(In,"RemoteStore shutting down."),i.Ea.add(5),await gr(i),i.Aa.shutdown(),i.Ra.set("Unknown")})(this.remoteStore),(e=this.datastore)==null||e.terminate(),(t=this.eventManager)==null||t.terminate()}}Sa.provider={build:()=>new Sa};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bc{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Ou(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Ou(this.observer.error,e):Nt("Uncaught Error in snapshot listener:",e.toString()))}Nu(){this.muted=!0}Ou(e,t){setTimeout((()=>{this.muted||e(t)}),0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tn="FirestoreClient";class sv{constructor(e,t,s,r,i){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=s,this.databaseInfo=r,this.user=Le.UNAUTHENTICATED,this.clientId=nc.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=i,this.authCredentials.start(s,(async o=>{M(tn,"Received user=",o.uid),await this.authCredentialListener(o),this.user=o})),this.appCheckCredentials.start(s,(o=>(M(tn,"Received new app check token=",o),this.appCheckCredentialListener(o,this.user))))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this.databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();const e=new _t;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted((async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){const s=vc(t,"Failed to shutdown persistence");e.reject(s)}})),e.promise}}async function Ho(n,e){n.asyncQueue.verifyOperationInProgress(),M(tn,"Initializing OfflineComponentProvider");const t=n.configuration;await e.initialize(t);let s=t.initialUser;n.setCredentialChangeListener((async r=>{s.isEqual(r)||(await xf(e.localStore,r),s=r)})),e.persistence.setDatabaseDeletedListener((()=>n.terminate())),n._offlineComponents=e}async function gh(n,e){n.asyncQueue.verifyOperationInProgress();const t=await rv(n);M(tn,"Initializing OnlineComponentProvider"),await e.initialize(t,n.configuration),n.setCredentialChangeListener((s=>hh(e.remoteStore,s))),n.setAppCheckTokenChangeListener(((s,r)=>hh(e.remoteStore,r))),n._onlineComponents=e}async function rv(n){if(!n._offlineComponents)if(n._uninitializedComponentsProvider){M(tn,"Using user provided OfflineComponentProvider");try{await Ho(n,n._uninitializedComponentsProvider._offline)}catch(e){const t=e;if(!(function(r){return r.name==="FirebaseError"?r.code===b.FAILED_PRECONDITION||r.code===b.UNIMPLEMENTED:!(typeof DOMException<"u"&&r instanceof DOMException)||r.code===22||r.code===20||r.code===11})(t))throw t;Kn("Error using user provided cache. Falling back to memory cache: "+t),await Ho(n,new Ei)}}else M(tn,"Using default OfflineComponentProvider"),await Ho(n,new nv(void 0));return n._offlineComponents}async function Pc(n){return n._onlineComponents||(n._uninitializedComponentsProvider?(M(tn,"Using user provided OnlineComponentProvider"),await gh(n,n._uninitializedComponentsProvider._online)):(M(tn,"Using default OnlineComponentProvider"),await gh(n,new Sa))),n._onlineComponents}function iv(n){return Pc(n).then((e=>e.syncEngine))}function ov(n){return Pc(n).then((e=>e.datastore))}async function Ti(n){const e=await Pc(n),t=e.eventManager;return t.onListen=jT.bind(null,e.syncEngine),t.onUnlisten=HT.bind(null,e.syncEngine),t.onFirstRemoteStoreListen=WT.bind(null,e.syncEngine),t.onLastRemoteStoreUnlisten=GT.bind(null,e.syncEngine),t}function av(n,e,t={}){const s=new _t;return n.asyncQueue.enqueueAndForget((async()=>(function(i,o,c,l,h){const f=new bc({next:m=>{f.Nu(),o.enqueueAndForget((()=>wc(i,p)));const w=m.docs.has(c);!w&&m.fromCache?h.reject(new V(b.UNAVAILABLE,"Failed to get document because the client is offline.")):w&&m.fromCache&&l&&l.source==="server"?h.reject(new V(b.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):h.resolve(m)},error:m=>h.reject(m)}),p=new Cc(ji(c.path),f,{includeMetadataChanges:!0,qa:!0});return Ic(i,p)})(await Ti(n),n.asyncQueue,e,t,s))),s.promise}function cv(n,e,t={}){const s=new _t;return n.asyncQueue.enqueueAndForget((async()=>(function(i,o,c,l,h){const f=new bc({next:m=>{f.Nu(),o.enqueueAndForget((()=>wc(i,p))),m.fromCache&&l.source==="server"?h.reject(new V(b.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):h.resolve(m)},error:m=>h.reject(m)}),p=new Cc(c,f,{includeMetadataChanges:!0,qa:!0});return Ic(i,p)})(await Ti(n),n.asyncQueue,e,t,s))),s.promise}function lv(n,e,t){const s=new _t;return n.asyncQueue.enqueueAndForget((async()=>{try{const r=await ov(n);s.resolve((async function(o,c,l){var k;const h=B(o),{request:f,gt:p,parent:m}=bE(h.serializer,Gy(c),l);h.connection.$o||delete f.parent;const w=(await h.Ho("RunAggregationQuery",h.serializer.databaseId,m,f,1)).filter((N=>!!N.result));Z(w.length===1,64727);const S=(k=w[0].result)==null?void 0:k.aggregateFields;return Object.keys(S).reduce(((N,x)=>(N[p[x]]=S[x],N)),{})})(r,e,t))}catch(r){s.reject(r)}})),s.promise}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function tp(n){const e={};return n.timeoutSeconds!==void 0&&(e.timeoutSeconds=n.timeoutSeconds),e}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yh=new Map;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const np="firestore.googleapis.com",Eh=!0;class Th{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new V(b.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=np,this.ssl=Eh}else this.host=e.host,this.ssl=e.ssl??Eh;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e.cacheSizeBytes===void 0)this.cacheSizeBytes=Mf;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<UE)throw new V(b.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}Ty("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=tp(e.experimentalLongPollingOptions??{}),(function(s){if(s.timeoutSeconds!==void 0){if(isNaN(s.timeoutSeconds))throw new V(b.INVALID_ARGUMENT,`invalid long polling timeout: ${s.timeoutSeconds} (must not be NaN)`);if(s.timeoutSeconds<5)throw new V(b.INVALID_ARGUMENT,`invalid long polling timeout: ${s.timeoutSeconds} (minimum allowed value is 5)`);if(s.timeoutSeconds>30)throw new V(b.INVALID_ARGUMENT,`invalid long polling timeout: ${s.timeoutSeconds} (maximum allowed value is 30)`)}})(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&(function(s,r){return s.timeoutSeconds===r.timeoutSeconds})(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams}}class Zi{constructor(e,t,s,r){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=s,this._app=r,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Th({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new V(b.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new V(b.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Th(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=(function(s){if(!s)return new uy;switch(s.type){case"firstParty":return new py(s.sessionIndex||"0",s.iamToken||null,s.authTokenFactory||null);case"provider":return s.client;default:throw new V(b.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}})(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return(function(t){const s=yh.get(t);s&&(M("ComponentProvider","Removing Datastore"),yh.delete(t),s.terminate())})(this),Promise.resolve()}}function uv(n,e,t,s={}){var h;n=Fe(n,Zi);const r=Ot(e),i=n._getSettings(),o={...i,emulatorOptions:n._getEmulatorOptions()},c=`${e}:${t}`;r&&(Qa(`https://${c}`),Ya("Firestore",!0)),i.host!==np&&i.host!==c&&Kn("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const l={...i,host:c,ssl:r,emulatorOptions:s};if(!li(l,o)&&(n._setSettings(l),s.mockUserToken)){let f,p;if(typeof s.mockUserToken=="string")f=s.mockUserToken,p=Le.MOCK_USER;else{f=kd(s.mockUserToken,(h=n._app)==null?void 0:h.options.projectId);const m=s.mockUserToken.sub||s.mockUserToken.user_id;if(!m)throw new V(b.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");p=new Le(m)}n._authCredentials=new hy(new Wd(f,p))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vt{constructor(e,t,s){this.converter=t,this._query=s,this.type="query",this.firestore=e}withConverter(e){return new Vt(this.firestore,e,this._query)}}class de{constructor(e,t,s){this.converter=t,this._key=s,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Kt(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new de(this.firestore,e,this._key)}toJSON(){return{type:de._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,s){if(pr(t,de._jsonSchema))return new de(e,s||null,new L(oe.fromString(t.referencePath)))}}de._jsonSchemaVersion="firestore/documentReference/1.0",de._jsonSchema={type:Te("string",de._jsonSchemaVersion),referencePath:Te("string")};class Kt extends Vt{constructor(e,t,s){super(e,t,ji(s)),this._path=s,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new de(this.firestore,null,new L(e))}withConverter(e){return new Kt(this.firestore,e,this._path)}}function LR(n,e,...t){if(n=ne(n),zd("collection","path",e),n instanceof Zi){const s=oe.fromString(e,...t);return Ou(s),new Kt(n,null,s)}{if(!(n instanceof de||n instanceof Kt))throw new V(b.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const s=n._path.child(oe.fromString(e,...t));return Ou(s),new Kt(n.firestore,null,s)}}function hv(n,e,...t){if(n=ne(n),arguments.length===1&&(e=nc.newId()),zd("doc","path",e),n instanceof Zi){const s=oe.fromString(e,...t);return Du(s),new de(n,null,new L(s))}{if(!(n instanceof de||n instanceof Kt))throw new V(b.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const s=n._path.child(oe.fromString(e,...t));return Du(s),new de(n.firestore,n instanceof Kt?n.converter:null,new L(s))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vh="AsyncQueue";class Ih{constructor(e=Promise.resolve()){this.Xu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new Uf(this,"async_queue_retry"),this._c=()=>{const s=zo();s&&M(vh,"Visibility state changed to "+s.visibilityState),this.M_.w_()},this.ac=e;const t=zo();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.uc(),this.cc(e)}enterRestrictedMode(e){if(!this.ec){this.ec=!0,this.sc=e||!1;const t=zo();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this._c)}}enqueue(e){if(this.uc(),this.ec)return new Promise((()=>{}));const t=new _t;return this.cc((()=>this.ec&&this.sc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise))).then((()=>t.promise))}enqueueRetryable(e){this.enqueueAndForget((()=>(this.Xu.push(e),this.lc())))}async lc(){if(this.Xu.length!==0){try{await this.Xu[0](),this.Xu.shift(),this.M_.reset()}catch(e){if(!cs(e))throw e;M(vh,"Operation failed with retryable error: "+e)}this.Xu.length>0&&this.M_.p_((()=>this.lc()))}}cc(e){const t=this.ac.then((()=>(this.rc=!0,e().catch((s=>{throw this.nc=s,this.rc=!1,Nt("INTERNAL UNHANDLED ERROR: ",wh(s)),s})).then((s=>(this.rc=!1,s))))));return this.ac=t,t}enqueueAfterDelay(e,t,s){this.uc(),this.oc.indexOf(e)>-1&&(t=0);const r=Tc.createAndSchedule(this,e,t,s,(i=>this.hc(i)));return this.tc.push(r),r}uc(){this.nc&&F(47125,{Pc:wh(this.nc)})}verifyOperationInProgress(){}async Tc(){let e;do e=this.ac,await e;while(e!==this.ac)}Ic(e){for(const t of this.tc)if(t.timerId===e)return!0;return!1}Ec(e){return this.Tc().then((()=>{this.tc.sort(((t,s)=>t.targetTimeMs-s.targetTimeMs));for(const t of this.tc)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.Tc()}))}dc(e){this.oc.push(e)}hc(e){const t=this.tc.indexOf(e);this.tc.splice(t,1)}}function wh(n){let e=n.message||"";return n.stack&&(e=n.stack.includes(n.message)?n.stack:n.message+`
`+n.stack),e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ah(n){return(function(t,s){if(typeof t!="object"||t===null)return!1;const r=t;for(const i of s)if(i in r&&typeof r[i]=="function")return!0;return!1})(n,["next","error","complete"])}class at extends Zi{constructor(e,t,s,r){super(e,t,s,r),this.type="firestore",this._queue=new Ih,this._persistenceKey=(r==null?void 0:r.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new Ih(e),this._firestoreClient=void 0,await e}}}function dv(n,e){const t=typeof n=="object"?n:ec(),s=typeof n=="string"?n:e,r=Za(t,"firestore").getImmediate({identifier:s});if(!r._initialized){const i=Ka("firestore");i&&uv(r,...i)}return r}function hs(n){if(n._terminated)throw new V(b.FAILED_PRECONDITION,"The client has already been terminated.");return n._firestoreClient||fv(n),n._firestoreClient}function fv(n){var s,r,i;const e=n._freezeSettings(),t=(function(c,l,h,f){return new Dy(c,l,h,f.host,f.ssl,f.experimentalForceLongPolling,f.experimentalAutoDetectLongPolling,tp(f.experimentalLongPollingOptions),f.useFetchStreams,f.isUsingEmulator)})(n._databaseId,((s=n._app)==null?void 0:s.options.appId)||"",n._persistenceKey,e);n._componentsProvider||(r=e.localCache)!=null&&r._offlineComponentProvider&&((i=e.localCache)!=null&&i._onlineComponentProvider)&&(n._componentsProvider={_offline:e.localCache._offlineComponentProvider,_online:e.localCache._onlineComponentProvider}),n._firestoreClient=new sv(n._authCredentials,n._appCheckCredentials,n._queue,t,n._componentsProvider&&(function(c){const l=c==null?void 0:c._online.build();return{_offline:c==null?void 0:c._offline.build(l),_online:l}})(n._componentsProvider))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pv{constructor(e="count",t){this._internalFieldPath=t,this.type="AggregateField",this.aggregateType=e}}class _v{constructor(e,t,s){this._userDataWriter=t,this._data=s,this.type="AggregateQuerySnapshot",this.query=e}data(){return this._userDataWriter.convertObjectMap(this._data)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class et{constructor(e){this._byteString=e}static fromBase64String(e){try{return new et(Oe.fromBase64String(e))}catch(t){throw new V(b.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new et(Oe.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:et._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(pr(e,et._jsonSchema))return et.fromBase64String(e.bytes)}}et._jsonSchemaVersion="firestore/bytes/1.0",et._jsonSchema={type:Te("string",et._jsonSchemaVersion),bytes:Te("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ds{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new V(b.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new ke(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}function xR(){return new ds(ha)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eo{constructor(e){this._methodName=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yt{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new V(b.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new V(b.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return H(this._lat,e._lat)||H(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:yt._jsonSchemaVersion}}static fromJSON(e){if(pr(e,yt._jsonSchema))return new yt(e.latitude,e.longitude)}}yt._jsonSchemaVersion="firestore/geoPoint/1.0",yt._jsonSchema={type:Te("string",yt._jsonSchemaVersion),latitude:Te("number"),longitude:Te("number")};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Et{constructor(e){this._values=(e||[]).map((t=>t))}toArray(){return this._values.map((e=>e))}isEqual(e){return(function(s,r){if(s.length!==r.length)return!1;for(let i=0;i<s.length;++i)if(s[i]!==r[i])return!1;return!0})(this._values,e._values)}toJSON(){return{type:Et._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(pr(e,Et._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every((t=>typeof t=="number")))return new Et(e.vectorValues);throw new V(b.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}Et._jsonSchemaVersion="firestore/vectorValue/1.0",Et._jsonSchema={type:Te("string",Et._jsonSchemaVersion),vectorValues:Te("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mv=/^__.*__$/;class gv{constructor(e,t,s){this.data=e,this.fieldMask=t,this.fieldTransforms=s}toMutation(e,t){return this.fieldMask!==null?new rn(e,this.data,this.fieldMask,t,this.fieldTransforms):new _r(e,this.data,t,this.fieldTransforms)}}class sp{constructor(e,t,s){this.data=e,this.fieldMask=t,this.fieldTransforms=s}toMutation(e,t){return new rn(e,this.data,this.fieldMask,t,this.fieldTransforms)}}function rp(n){switch(n){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw F(40011,{Ac:n})}}class Nc{constructor(e,t,s,r,i,o){this.settings=e,this.databaseId=t,this.serializer=s,this.ignoreUndefinedProperties=r,i===void 0&&this.Rc(),this.fieldTransforms=i||[],this.fieldMask=o||[]}get path(){return this.settings.path}get Ac(){return this.settings.Ac}Vc(e){return new Nc({...this.settings,...e},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}mc(e){var r;const t=(r=this.path)==null?void 0:r.child(e),s=this.Vc({path:t,fc:!1});return s.gc(e),s}yc(e){var r;const t=(r=this.path)==null?void 0:r.child(e),s=this.Vc({path:t,fc:!1});return s.Rc(),s}wc(e){return this.Vc({path:void 0,fc:!0})}Sc(e){return vi(e,this.settings.methodName,this.settings.bc||!1,this.path,this.settings.Dc)}contains(e){return this.fieldMask.find((t=>e.isPrefixOf(t)))!==void 0||this.fieldTransforms.find((t=>e.isPrefixOf(t.field)))!==void 0}Rc(){if(this.path)for(let e=0;e<this.path.length;e++)this.gc(this.path.get(e))}gc(e){if(e.length===0)throw this.Sc("Document fields must not be empty");if(rp(this.Ac)&&mv.test(e))throw this.Sc('Document fields cannot begin and end with "__"')}}class yv{constructor(e,t,s){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=s||Yi(e)}Cc(e,t,s,r=!1){return new Nc({Ac:e,methodName:t,Dc:s,path:ke.emptyPath(),fc:!1,bc:r},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function Er(n){const e=n._freezeSettings(),t=Yi(n._databaseId);return new yv(n._databaseId,!!e.ignoreUndefinedProperties,t)}function kc(n,e,t,s,r,i={}){const o=n.Cc(i.merge||i.mergeFields?2:0,e,t,r);Oc("Data must be an object, but it was:",o,s);const c=ap(s,o);let l,h;if(i.merge)l=new Je(o.fieldMask),h=o.fieldTransforms;else if(i.mergeFields){const f=[];for(const p of i.mergeFields){const m=ba(e,p,t);if(!o.contains(m))throw new V(b.INVALID_ARGUMENT,`Field '${m}' is specified in your field mask but missing from your input data.`);lp(f,m)||f.push(m)}l=new Je(f),h=o.fieldTransforms.filter((p=>l.covers(p.field)))}else l=null,h=o.fieldTransforms;return new gv(new ze(c),l,h)}class to extends eo{_toFieldTransform(e){if(e.Ac!==2)throw e.Ac===1?e.Sc(`${this._methodName}() can only appear at the top level of your update data`):e.Sc(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof to}}class Dc extends eo{_toFieldTransform(e){return new rE(e.path,new ar)}isEqual(e){return e instanceof Dc}}function ip(n,e,t,s){const r=n.Cc(1,e,t);Oc("Data must be an object, but it was:",r,s);const i=[],o=ze.empty();sn(s,((l,h)=>{const f=Vc(e,l,t);h=ne(h);const p=r.yc(f);if(h instanceof to)i.push(f);else{const m=Tr(h,p);m!=null&&(i.push(f),o.set(f,m))}}));const c=new Je(i);return new sp(o,c,r.fieldTransforms)}function op(n,e,t,s,r,i){const o=n.Cc(1,e,t),c=[ba(e,s,t)],l=[r];if(i.length%2!=0)throw new V(b.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let m=0;m<i.length;m+=2)c.push(ba(e,i[m])),l.push(i[m+1]);const h=[],f=ze.empty();for(let m=c.length-1;m>=0;--m)if(!lp(h,c[m])){const w=c[m];let S=l[m];S=ne(S);const k=o.yc(w);if(S instanceof to)h.push(w);else{const N=Tr(S,k);N!=null&&(h.push(w),f.set(w,N))}}const p=new Je(h);return new sp(f,p,o.fieldTransforms)}function Ev(n,e,t,s=!1){return Tr(t,n.Cc(s?4:3,e))}function Tr(n,e){if(cp(n=ne(n)))return Oc("Unsupported field value:",e,n),ap(n,e);if(n instanceof eo)return(function(s,r){if(!rp(r.Ac))throw r.Sc(`${s._methodName}() can only be used with update() and set()`);if(!r.path)throw r.Sc(`${s._methodName}() is not currently supported inside arrays`);const i=s._toFieldTransform(r);i&&r.fieldTransforms.push(i)})(n,e),null;if(n===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),n instanceof Array){if(e.settings.fc&&e.Ac!==4)throw e.Sc("Nested arrays are not supported");return(function(s,r){const i=[];let o=0;for(const c of s){let l=Tr(c,r.wc(o));l==null&&(l={nullValue:"NULL_VALUE"}),i.push(l),o++}return{arrayValue:{values:i}}})(n,e)}return(function(s,r){if((s=ne(s))===null)return{nullValue:"NULL_VALUE"};if(typeof s=="number")return tE(r.serializer,s);if(typeof s=="boolean")return{booleanValue:s};if(typeof s=="string")return{stringValue:s};if(s instanceof Date){const i=le.fromDate(s);return{timestampValue:mi(r.serializer,i)}}if(s instanceof le){const i=new le(s.seconds,1e3*Math.floor(s.nanoseconds/1e3));return{timestampValue:mi(r.serializer,i)}}if(s instanceof yt)return{geoPointValue:{latitude:s.latitude,longitude:s.longitude}};if(s instanceof et)return{bytesValue:Sf(r.serializer,s._byteString)};if(s instanceof de){const i=r.databaseId,o=s.firestore._databaseId;if(!o.isEqual(i))throw r.Sc(`Document reference is for database ${o.projectId}/${o.database} but should be for database ${i.projectId}/${i.database}`);return{referenceValue:hc(s.firestore._databaseId||r.databaseId,s._key.path)}}if(s instanceof Et)return(function(o,c){return{mapValue:{fields:{[ef]:{stringValue:tf},[di]:{arrayValue:{values:o.toArray().map((h=>{if(typeof h!="number")throw c.Sc("VectorValues must only contain numeric values.");return cc(c.serializer,h)}))}}}}}})(s,r);throw r.Sc(`Unsupported field value: ${Ui(s)}`)})(n,e)}function ap(n,e){const t={};return Kd(n)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):sn(n,((s,r)=>{const i=Tr(r,e.mc(s));i!=null&&(t[s]=i)})),{mapValue:{fields:t}}}function cp(n){return!(typeof n!="object"||n===null||n instanceof Array||n instanceof Date||n instanceof le||n instanceof yt||n instanceof et||n instanceof de||n instanceof eo||n instanceof Et)}function Oc(n,e,t){if(!cp(t)||!Hd(t)){const s=Ui(t);throw s==="an object"?e.Sc(n+" a custom object"):e.Sc(n+" "+s)}}function ba(n,e,t){if((e=ne(e))instanceof ds)return e._internalPath;if(typeof e=="string")return Vc(n,e);throw vi("Field path arguments must be of type string or ",n,!1,void 0,t)}const Tv=new RegExp("[~\\*/\\[\\]]");function Vc(n,e,t){if(e.search(Tv)>=0)throw vi(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,n,!1,void 0,t);try{return new ds(...e.split("."))._internalPath}catch{throw vi(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,n,!1,void 0,t)}}function vi(n,e,t,s,r){const i=s&&!s.isEmpty(),o=r!==void 0;let c=`Function ${e}() called with invalid data`;t&&(c+=" (via `toFirestore()`)"),c+=". ";let l="";return(i||o)&&(l+=" (found",i&&(l+=` in field ${s}`),o&&(l+=` in document ${r}`),l+=")"),new V(b.INVALID_ARGUMENT,c+n+l)}function lp(n,e){return n.some((t=>t.isEqual(e)))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class up{constructor(e,t,s,r,i){this._firestore=e,this._userDataWriter=t,this._key=s,this._document=r,this._converter=i}get id(){return this._key.path.lastSegment()}get ref(){return new de(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new vv(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}get(e){if(this._document){const t=this._document.data.field(no("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}}class vv extends up{data(){return super.data()}}function no(n,e){return typeof e=="string"?Vc(n,e):e instanceof ds?e._internalPath:e._delegate._internalPath}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function hp(n){if(n.limitType==="L"&&n.explicitOrderBy.length===0)throw new V(b.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class Mc{}class Lc extends Mc{}function FR(n,e,...t){let s=[];e instanceof Mc&&s.push(e),s=s.concat(t),(function(i){const o=i.filter((l=>l instanceof xc)).length,c=i.filter((l=>l instanceof so)).length;if(o>1||o>0&&c>0)throw new V(b.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")})(s);for(const r of s)n=r._apply(n);return n}class so extends Lc{constructor(e,t,s){super(),this._field=e,this._op=t,this._value=s,this.type="where"}static _create(e,t,s){return new so(e,t,s)}_apply(e){const t=this._parse(e);return dp(e._query,t),new Vt(e.firestore,e.converter,ya(e._query,t))}_parse(e){const t=Er(e.firestore);return(function(i,o,c,l,h,f,p){let m;if(h.isKeyField()){if(f==="array-contains"||f==="array-contains-any")throw new V(b.INVALID_ARGUMENT,`Invalid Query. You can't perform '${f}' queries on documentId().`);if(f==="in"||f==="not-in"){Rh(p,f);const S=[];for(const k of p)S.push(Ch(l,i,k));m={arrayValue:{values:S}}}else m=Ch(l,i,p)}else f!=="in"&&f!=="not-in"&&f!=="array-contains-any"||Rh(p,f),m=Ev(c,o,p,f==="in"||f==="not-in");return Ee.create(h,f,m)})(e._query,"where",t,e.firestore._databaseId,this._field,this._op,this._value)}}function UR(n,e,t){const s=e,r=no("where",n);return so._create(r,s,t)}class xc extends Mc{constructor(e,t){super(),this.type=e,this._queryConstraints=t}static _create(e,t){return new xc(e,t)}_parse(e){const t=this._queryConstraints.map((s=>s._parse(e))).filter((s=>s.getFilters().length>0));return t.length===1?t[0]:ot.create(t,this._getOperator())}_apply(e){const t=this._parse(e);return t.getFilters().length===0?e:((function(r,i){let o=r;const c=i.getFlattenedFilters();for(const l of c)dp(o,l),o=ya(o,l)})(e._query,t),new Vt(e.firestore,e.converter,ya(e._query,t)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}class Fc extends Lc{constructor(e,t){super(),this._field=e,this._direction=t,this.type="orderBy"}static _create(e,t){return new Fc(e,t)}_apply(e){const t=(function(r,i,o){if(r.startAt!==null)throw new V(b.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(r.endAt!==null)throw new V(b.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new or(i,o)})(e._query,this._field,this._direction);return new Vt(e.firestore,e.converter,(function(r,i){const o=r.explicitOrderBy.concat([i]);return new ls(r.path,r.collectionGroup,o,r.filters.slice(),r.limit,r.limitType,r.startAt,r.endAt)})(e._query,t))}}function BR(n,e="asc"){const t=e,s=no("orderBy",n);return Fc._create(s,t)}class Uc extends Lc{constructor(e,t,s){super(),this.type=e,this._limit=t,this._limitType=s}static _create(e,t,s){return new Uc(e,t,s)}_apply(e){return new Vt(e.firestore,e.converter,pi(e._query,this._limit,this._limitType))}}function qR(n){return Uc._create("limit",n,"F")}function Ch(n,e,t){if(typeof(t=ne(t))=="string"){if(t==="")throw new V(b.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!uf(e)&&t.indexOf("/")!==-1)throw new V(b.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${t}' contains a '/' character.`);const s=e.path.child(oe.fromString(t));if(!L.isDocumentKey(s))throw new V(b.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${s}' is not because it has an odd number of segments (${s.length}).`);return qu(n,new L(s))}if(t instanceof de)return qu(n,t._key);throw new V(b.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${Ui(t)}.`)}function Rh(n,e){if(!Array.isArray(n)||n.length===0)throw new V(b.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`)}function dp(n,e){const t=(function(r,i){for(const o of r)for(const c of o.getFlattenedFilters())if(i.indexOf(c.op)>=0)return c.op;return null})(n.filters,(function(r){switch(r){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}})(e.op));if(t!==null)throw t===e.op?new V(b.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new V(b.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${t.toString()}' filters.`)}class Iv{convertValue(e,t="none"){switch(Zt(e)){case 0:return null;case 1:return e.booleanValue;case 2:return _e(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,t);case 5:return e.stringValue;case 6:return this.convertBytes(Jt(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,t);case 11:return this.convertObject(e.mapValue,t);case 10:return this.convertVectorValue(e.mapValue);default:throw F(62114,{value:e})}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){const s={};return sn(e,((r,i)=>{s[r]=this.convertValue(i,t)})),s}convertVectorValue(e){var s,r,i;const t=(i=(r=(s=e.fields)==null?void 0:s[di].arrayValue)==null?void 0:r.values)==null?void 0:i.map((o=>_e(o.doubleValue)));return new Et(t)}convertGeoPoint(e){return new yt(_e(e.latitude),_e(e.longitude))}convertArray(e,t){return(e.values||[]).map((s=>this.convertValue(s,t)))}convertServerTimestamp(e,t){switch(t){case"previous":const s=$i(e);return s==null?null:this.convertValue(s,t);case"estimate":return this.convertTimestamp(sr(e));default:return null}}convertTimestamp(e){const t=Xt(e);return new le(t.seconds,t.nanos)}convertDocumentKey(e,t){const s=oe.fromString(e);Z(Vf(s),9688,{name:e});const r=new rr(s.get(1),s.get(3)),i=new L(s.popFirst(5));return r.isEqual(t)||Nt(`Document ${i} contains a document reference within a different database (${r.projectId}/${r.database}) which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),i}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Bc(n,e,t){let s;return s=n?t&&(t.merge||t.mergeFields)?n.toFirestore(e,t):n.toFirestore(e):e,s}function wv(){return new pv("count")}class Bs{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class yn extends up{constructor(e,t,s,r,i,o){super(e,t,s,r,o),this._firestore=e,this._firestoreImpl=e,this.metadata=i}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new si(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const s=this._document.data.field(no("DocumentSnapshot.get",e));if(s!==null)return this._userDataWriter.convertValue(s,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new V(b.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=yn._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}}yn._jsonSchemaVersion="firestore/documentSnapshot/1.0",yn._jsonSchema={type:Te("string",yn._jsonSchemaVersion),bundleSource:Te("string","DocumentSnapshot"),bundleName:Te("string"),bundle:Te("string")};class si extends yn{data(e={}){return super.data(e)}}class En{constructor(e,t,s,r){this._firestore=e,this._userDataWriter=t,this._snapshot=r,this.metadata=new Bs(r.hasPendingWrites,r.fromCache),this.query=s}get docs(){const e=[];return this.forEach((t=>e.push(t))),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach((s=>{e.call(t,new si(this._firestore,this._userDataWriter,s.key,s,new Bs(this._snapshot.mutatedKeys.has(s.key),this._snapshot.fromCache),this.query.converter))}))}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new V(b.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=(function(r,i){if(r._snapshot.oldDocs.isEmpty()){let o=0;return r._snapshot.docChanges.map((c=>{const l=new si(r._firestore,r._userDataWriter,c.doc.key,c.doc,new Bs(r._snapshot.mutatedKeys.has(c.doc.key),r._snapshot.fromCache),r.query.converter);return c.doc,{type:"added",doc:l,oldIndex:-1,newIndex:o++}}))}{let o=r._snapshot.oldDocs;return r._snapshot.docChanges.filter((c=>i||c.type!==3)).map((c=>{const l=new si(r._firestore,r._userDataWriter,c.doc.key,c.doc,new Bs(r._snapshot.mutatedKeys.has(c.doc.key),r._snapshot.fromCache),r.query.converter);let h=-1,f=-1;return c.type!==0&&(h=o.indexOf(c.doc.key),o=o.delete(c.doc.key)),c.type!==1&&(o=o.add(c.doc),f=o.indexOf(c.doc.key)),{type:Av(c.type),doc:l,oldIndex:h,newIndex:f}}))}})(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new V(b.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=En._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=nc.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],s=[],r=[];return this.docs.forEach((i=>{i._document!==null&&(t.push(i._document),s.push(this._userDataWriter.convertObjectMap(i._document.data.value.mapValue.fields,"previous")),r.push(i.ref.path))})),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function Av(n){switch(n){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return F(61501,{type:n})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $R(n){n=Fe(n,de);const e=Fe(n.firestore,at);return av(hs(e),n._key).then((t=>fp(e,n,t)))}En._jsonSchemaVersion="firestore/querySnapshot/1.0",En._jsonSchema={type:Te("string",En._jsonSchemaVersion),bundleSource:Te("string","QuerySnapshot"),bundleName:Te("string"),bundle:Te("string")};class ro extends Iv{constructor(e){super(),this.firestore=e}convertBytes(e){return new et(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new de(this.firestore,null,t)}}function jR(n){n=Fe(n,Vt);const e=Fe(n.firestore,at),t=hs(e),s=new ro(e);return hp(n._query),cv(t,n._query).then((r=>new En(e,s,n,r)))}function WR(n,e,t){n=Fe(n,de);const s=Fe(n.firestore,at),r=Bc(n.converter,e,t);return vr(s,[kc(Er(s),"setDoc",n._key,r,n.converter!==null,t).toMutation(n._key,$e.none())])}function zR(n,e,t,...s){n=Fe(n,de);const r=Fe(n.firestore,at),i=Er(r);let o;return o=typeof(e=ne(e))=="string"||e instanceof ds?op(i,"updateDoc",n._key,e,t,s):ip(i,"updateDoc",n._key,e),vr(r,[o.toMutation(n._key,$e.exists(!0))])}function HR(n){return vr(Fe(n.firestore,at),[new Ki(n._key,$e.none())])}function GR(n,e){const t=Fe(n.firestore,at),s=hv(n),r=Bc(n.converter,e);return vr(t,[kc(Er(n.firestore),"addDoc",s._key,r,n.converter!==null,{}).toMutation(s._key,$e.exists(!1))]).then((()=>s))}function KR(n,...e){var l,h,f;n=ne(n);let t={includeMetadataChanges:!1,source:"default"},s=0;typeof e[s]!="object"||Ah(e[s])||(t=e[s++]);const r={includeMetadataChanges:t.includeMetadataChanges,source:t.source};if(Ah(e[s])){const p=e[s];e[s]=(l=p.next)==null?void 0:l.bind(p),e[s+1]=(h=p.error)==null?void 0:h.bind(p),e[s+2]=(f=p.complete)==null?void 0:f.bind(p)}let i,o,c;if(n instanceof de)o=Fe(n.firestore,at),c=ji(n._key.path),i={next:p=>{e[s]&&e[s](fp(o,n,p))},error:e[s+1],complete:e[s+2]};else{const p=Fe(n,Vt);o=Fe(p.firestore,at),c=p._query;const m=new ro(o);i={next:w=>{e[s]&&e[s](new En(o,m,p,w))},error:e[s+1],complete:e[s+2]},hp(n._query)}return(function(m,w,S,k){const N=new bc(k),x=new Cc(w,N,S);return m.asyncQueue.enqueueAndForget((async()=>Ic(await Ti(m),x))),()=>{N.Nu(),m.asyncQueue.enqueueAndForget((async()=>wc(await Ti(m),x)))}})(hs(o),c,r,i)}function vr(n,e){return(function(s,r){const i=new _t;return s.asyncQueue.enqueueAndForget((async()=>KT(await iv(s),r,i))),i.promise})(hs(n),e)}function fp(n,e,t){const s=t.docs.get(e._key),r=new ro(n);return new yn(n,r,e._key,s,new Bs(t.hasPendingWrites,t.fromCache),e.converter)}function QR(n){return Cv(n,{count:wv()})}function Cv(n,e){const t=Fe(n.firestore,at),s=hs(t),r=Ny(e,((i,o)=>new dE(o,i.aggregateType,i._internalFieldPath)));return lv(s,n._query,r).then((i=>(function(c,l,h){const f=new ro(c);return new _v(l,f,h)})(t,n,i)))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rv{constructor(e,t){this._firestore=e,this._commitHandler=t,this._mutations=[],this._committed=!1,this._dataReader=Er(e)}set(e,t,s){this._verifyNotCommitted();const r=Go(e,this._firestore),i=Bc(r.converter,t,s),o=kc(this._dataReader,"WriteBatch.set",r._key,i,r.converter!==null,s);return this._mutations.push(o.toMutation(r._key,$e.none())),this}update(e,t,s,...r){this._verifyNotCommitted();const i=Go(e,this._firestore);let o;return o=typeof(t=ne(t))=="string"||t instanceof ds?op(this._dataReader,"WriteBatch.update",i._key,t,s,r):ip(this._dataReader,"WriteBatch.update",i._key,t),this._mutations.push(o.toMutation(i._key,$e.exists(!0))),this}delete(e){this._verifyNotCommitted();const t=Go(e,this._firestore);return this._mutations=this._mutations.concat(new Ki(t._key,$e.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new V(b.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function Go(n,e){if((n=ne(n)).firestore!==e)throw new V(b.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return n}function YR(){return new Dc("serverTimestamp")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function XR(n){return hs(n=Fe(n,at)),new Rv(n,(e=>vr(n,e)))}(function(e,t=!0){(function(r){os=r})(is),Pt(new Tt("firestore",((s,{instanceIdentifier:r,options:i})=>{const o=s.getProvider("app").getImmediate(),c=new at(new dy(s.getProvider("auth-internal")),new _y(o,s.getProvider("app-check-internal")),(function(h,f){if(!Object.prototype.hasOwnProperty.apply(h.options,["projectId"]))throw new V(b.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new rr(h.options.projectId,f)})(o,r),o);return i={useFetchStreams:t,...i},c._setSettings(i),c}),"PUBLIC").setMultipleInstances(!0)),Ke(Pu,Nu,e),Ke(Pu,Nu,"esm2020")})();/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pp="firebasestorage.googleapis.com",_p="storageBucket",Sv=120*1e3,bv=600*1e3;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pe extends It{constructor(e,t,s=0){super(Ko(e),`Firebase Storage: ${t} (${Ko(e)})`),this.status_=s,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,pe.prototype)}get status(){return this.status_}set status(e){this.status_=e}_codeEquals(e){return Ko(e)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(e){this.customData.serverResponse=e,this.customData.serverResponse?this.message=`${this._baseMessage}
${this.customData.serverResponse}`:this.message=this._baseMessage}}var fe;(function(n){n.UNKNOWN="unknown",n.OBJECT_NOT_FOUND="object-not-found",n.BUCKET_NOT_FOUND="bucket-not-found",n.PROJECT_NOT_FOUND="project-not-found",n.QUOTA_EXCEEDED="quota-exceeded",n.UNAUTHENTICATED="unauthenticated",n.UNAUTHORIZED="unauthorized",n.UNAUTHORIZED_APP="unauthorized-app",n.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",n.INVALID_CHECKSUM="invalid-checksum",n.CANCELED="canceled",n.INVALID_EVENT_NAME="invalid-event-name",n.INVALID_URL="invalid-url",n.INVALID_DEFAULT_BUCKET="invalid-default-bucket",n.NO_DEFAULT_BUCKET="no-default-bucket",n.CANNOT_SLICE_BLOB="cannot-slice-blob",n.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",n.NO_DOWNLOAD_URL="no-download-url",n.INVALID_ARGUMENT="invalid-argument",n.INVALID_ARGUMENT_COUNT="invalid-argument-count",n.APP_DELETED="app-deleted",n.INVALID_ROOT_OPERATION="invalid-root-operation",n.INVALID_FORMAT="invalid-format",n.INTERNAL_ERROR="internal-error",n.UNSUPPORTED_ENVIRONMENT="unsupported-environment"})(fe||(fe={}));function Ko(n){return"storage/"+n}function qc(){const n="An unknown error occurred, please check the error payload for server response.";return new pe(fe.UNKNOWN,n)}function Pv(n){return new pe(fe.OBJECT_NOT_FOUND,"Object '"+n+"' does not exist.")}function Nv(n){return new pe(fe.QUOTA_EXCEEDED,"Quota for bucket '"+n+"' exceeded, please view quota on https://firebase.google.com/pricing/.")}function kv(){const n="User is not authenticated, please authenticate using Firebase Authentication and try again.";return new pe(fe.UNAUTHENTICATED,n)}function Dv(){return new pe(fe.UNAUTHORIZED_APP,"This app does not have permission to access Firebase Storage on this project.")}function Ov(n){return new pe(fe.UNAUTHORIZED,"User does not have permission to access '"+n+"'.")}function Vv(){return new pe(fe.RETRY_LIMIT_EXCEEDED,"Max retry time for operation exceeded, please try again.")}function Mv(){return new pe(fe.CANCELED,"User canceled the upload/download.")}function Lv(n){return new pe(fe.INVALID_URL,"Invalid URL '"+n+"'.")}function xv(n){return new pe(fe.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+n+"'.")}function Fv(){return new pe(fe.NO_DEFAULT_BUCKET,"No default bucket found. Did you set the '"+_p+"' property when initializing the app?")}function Uv(){return new pe(fe.CANNOT_SLICE_BLOB,"Cannot slice blob for upload. Please retry the upload.")}function Bv(){return new pe(fe.NO_DOWNLOAD_URL,"The given file does not have any download URLs.")}function qv(n){return new pe(fe.UNSUPPORTED_ENVIRONMENT,`${n} is missing. Make sure to install the required polyfills. See https://firebase.google.com/docs/web/environments-js-sdk#polyfills for more information.`)}function Pa(n){return new pe(fe.INVALID_ARGUMENT,n)}function mp(){return new pe(fe.APP_DELETED,"The Firebase app was deleted.")}function $v(n){return new pe(fe.INVALID_ROOT_OPERATION,"The operation '"+n+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}function Gs(n,e){return new pe(fe.INVALID_FORMAT,"String does not match format '"+n+"': "+e)}function Ds(n){throw new pe(fe.INTERNAL_ERROR,"Internal error: "+n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ze{constructor(e,t){this.bucket=e,this.path_=t}get path(){return this.path_}get isRoot(){return this.path.length===0}fullServerUrl(){const e=encodeURIComponent;return"/b/"+e(this.bucket)+"/o/"+e(this.path)}bucketOnlyServerUrl(){return"/b/"+encodeURIComponent(this.bucket)+"/o"}static makeFromBucketSpec(e,t){let s;try{s=Ze.makeFromUrl(e,t)}catch{return new Ze(e,"")}if(s.path==="")return s;throw xv(e)}static makeFromUrl(e,t){let s=null;const r="([A-Za-z0-9.\\-_]+)";function i(Q){Q.path.charAt(Q.path.length-1)==="/"&&(Q.path_=Q.path_.slice(0,-1))}const o="(/(.*))?$",c=new RegExp("^gs://"+r+o,"i"),l={bucket:1,path:3};function h(Q){Q.path_=decodeURIComponent(Q.path)}const f="v[A-Za-z0-9_]+",p=t.replace(/[.]/g,"\\."),m="(/([^?#]*).*)?$",w=new RegExp(`^https?://${p}/${f}/b/${r}/o${m}`,"i"),S={bucket:1,path:3},k=t===pp?"(?:storage.googleapis.com|storage.cloud.google.com)":t,N="([^?#]*)",x=new RegExp(`^https?://${k}/${r}/${N}`,"i"),$=[{regex:c,indices:l,postModify:i},{regex:w,indices:S,postModify:h},{regex:x,indices:{bucket:1,path:2},postModify:h}];for(let Q=0;Q<$.length;Q++){const Ae=$[Q],ue=Ae.regex.exec(e);if(ue){const v=ue[Ae.indices.bucket];let g=ue[Ae.indices.path];g||(g=""),s=new Ze(v,g),Ae.postModify(s);break}}if(s==null)throw Lv(e);return s}}class jv{constructor(e){this.promise_=Promise.reject(e)}getPromise(){return this.promise_}cancel(e=!1){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Wv(n,e,t){let s=1,r=null,i=null,o=!1,c=0;function l(){return c===2}let h=!1;function f(...N){h||(h=!0,e.apply(null,N))}function p(N){r=setTimeout(()=>{r=null,n(w,l())},N)}function m(){i&&clearTimeout(i)}function w(N,...x){if(h){m();return}if(N){m(),f.call(null,N,...x);return}if(l()||o){m(),f.call(null,N,...x);return}s<64&&(s*=2);let $;c===1?(c=2,$=0):$=(s+Math.random())*1e3,p($)}let S=!1;function k(N){S||(S=!0,m(),!h&&(r!==null?(N||(c=2),clearTimeout(r),p(0)):N||(c=1)))}return p(0),i=setTimeout(()=>{o=!0,k(!0)},t),k}function zv(n){n(!1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Hv(n){return n!==void 0}function Gv(n){return typeof n=="object"&&!Array.isArray(n)}function $c(n){return typeof n=="string"||n instanceof String}function Sh(n){return jc()&&n instanceof Blob}function jc(){return typeof Blob<"u"}function bh(n,e,t,s){if(s<e)throw Pa(`Invalid value for '${n}'. Expected ${e} or greater.`);if(s>t)throw Pa(`Invalid value for '${n}'. Expected ${t} or less.`)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Wc(n,e,t){let s=e;return t==null&&(s=`https://${e}`),`${t}://${s}/v0${n}`}function gp(n){const e=encodeURIComponent;let t="?";for(const s in n)if(n.hasOwnProperty(s)){const r=e(s)+"="+e(n[s]);t=t+r+"&"}return t=t.slice(0,-1),t}var Tn;(function(n){n[n.NO_ERROR=0]="NO_ERROR",n[n.NETWORK_ERROR=1]="NETWORK_ERROR",n[n.ABORT=2]="ABORT"})(Tn||(Tn={}));/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Kv(n,e){const t=n>=500&&n<600,r=[408,429].indexOf(n)!==-1,i=e.indexOf(n)!==-1;return t||r||i}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qv{constructor(e,t,s,r,i,o,c,l,h,f,p,m=!0,w=!1){this.url_=e,this.method_=t,this.headers_=s,this.body_=r,this.successCodes_=i,this.additionalRetryCodes_=o,this.callback_=c,this.errorCallback_=l,this.timeout_=h,this.progressCallback_=f,this.connectionFactory_=p,this.retry=m,this.isUsingEmulator=w,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((S,k)=>{this.resolve_=S,this.reject_=k,this.start_()})}start_(){const e=(s,r)=>{if(r){s(!1,new Gr(!1,null,!0));return}const i=this.connectionFactory_();this.pendingConnection_=i;const o=c=>{const l=c.loaded,h=c.lengthComputable?c.total:-1;this.progressCallback_!==null&&this.progressCallback_(l,h)};this.progressCallback_!==null&&i.addUploadProgressListener(o),i.send(this.url_,this.method_,this.isUsingEmulator,this.body_,this.headers_).then(()=>{this.progressCallback_!==null&&i.removeUploadProgressListener(o),this.pendingConnection_=null;const c=i.getErrorCode()===Tn.NO_ERROR,l=i.getStatus();if(!c||Kv(l,this.additionalRetryCodes_)&&this.retry){const f=i.getErrorCode()===Tn.ABORT;s(!1,new Gr(!1,null,f));return}const h=this.successCodes_.indexOf(l)!==-1;s(!0,new Gr(h,i))})},t=(s,r)=>{const i=this.resolve_,o=this.reject_,c=r.connection;if(r.wasSuccessCode)try{const l=this.callback_(c,c.getResponse());Hv(l)?i(l):i()}catch(l){o(l)}else if(c!==null){const l=qc();l.serverResponse=c.getErrorText(),this.errorCallback_?o(this.errorCallback_(c,l)):o(l)}else if(r.canceled){const l=this.appDelete_?mp():Mv();o(l)}else{const l=Vv();o(l)}};this.canceled_?t(!1,new Gr(!1,null,!0)):this.backoffId_=Wv(e,t,this.timeout_)}getPromise(){return this.promise_}cancel(e){this.canceled_=!0,this.appDelete_=e||!1,this.backoffId_!==null&&zv(this.backoffId_),this.pendingConnection_!==null&&this.pendingConnection_.abort()}}class Gr{constructor(e,t,s){this.wasSuccessCode=e,this.connection=t,this.canceled=!!s}}function Yv(n,e){e!==null&&e.length>0&&(n.Authorization="Firebase "+e)}function Xv(n,e){n["X-Firebase-Storage-Version"]="webjs/"+(e??"AppManager")}function Jv(n,e){e&&(n["X-Firebase-GMPID"]=e)}function Zv(n,e){e!==null&&(n["X-Firebase-AppCheck"]=e)}function eI(n,e,t,s,r,i,o=!0,c=!1){const l=gp(n.urlParams),h=n.url+l,f=Object.assign({},n.headers);return Jv(f,e),Yv(f,t),Xv(f,i),Zv(f,s),new Qv(h,n.method,f,n.body,n.successCodes,n.additionalRetryCodes,n.handler,n.errorHandler,n.timeout,n.progressCallback,r,o,c)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function tI(){return typeof BlobBuilder<"u"?BlobBuilder:typeof WebKitBlobBuilder<"u"?WebKitBlobBuilder:void 0}function nI(...n){const e=tI();if(e!==void 0){const t=new e;for(let s=0;s<n.length;s++)t.append(n[s]);return t.getBlob()}else{if(jc())return new Blob(n);throw new pe(fe.UNSUPPORTED_ENVIRONMENT,"This browser doesn't seem to support creating Blobs")}}function sI(n,e,t){return n.webkitSlice?n.webkitSlice(e,t):n.mozSlice?n.mozSlice(e,t):n.slice?n.slice(e,t):null}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function rI(n){if(typeof atob>"u")throw qv("base-64");return atob(n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dt={RAW:"raw",BASE64:"base64",BASE64URL:"base64url",DATA_URL:"data_url"};class Qo{constructor(e,t){this.data=e,this.contentType=t||null}}function iI(n,e){switch(n){case dt.RAW:return new Qo(yp(e));case dt.BASE64:case dt.BASE64URL:return new Qo(Ep(n,e));case dt.DATA_URL:return new Qo(aI(e),cI(e))}throw qc()}function yp(n){const e=[];for(let t=0;t<n.length;t++){let s=n.charCodeAt(t);if(s<=127)e.push(s);else if(s<=2047)e.push(192|s>>6,128|s&63);else if((s&64512)===55296)if(!(t<n.length-1&&(n.charCodeAt(t+1)&64512)===56320))e.push(239,191,189);else{const i=s,o=n.charCodeAt(++t);s=65536|(i&1023)<<10|o&1023,e.push(240|s>>18,128|s>>12&63,128|s>>6&63,128|s&63)}else(s&64512)===56320?e.push(239,191,189):e.push(224|s>>12,128|s>>6&63,128|s&63)}return new Uint8Array(e)}function oI(n){let e;try{e=decodeURIComponent(n)}catch{throw Gs(dt.DATA_URL,"Malformed data URL.")}return yp(e)}function Ep(n,e){switch(n){case dt.BASE64:{const r=e.indexOf("-")!==-1,i=e.indexOf("_")!==-1;if(r||i)throw Gs(n,"Invalid character '"+(r?"-":"_")+"' found: is it base64url encoded?");break}case dt.BASE64URL:{const r=e.indexOf("+")!==-1,i=e.indexOf("/")!==-1;if(r||i)throw Gs(n,"Invalid character '"+(r?"+":"/")+"' found: is it base64 encoded?");e=e.replace(/-/g,"+").replace(/_/g,"/");break}}let t;try{t=rI(e)}catch(r){throw r.message.includes("polyfill")?r:Gs(n,"Invalid character found")}const s=new Uint8Array(t.length);for(let r=0;r<t.length;r++)s[r]=t.charCodeAt(r);return s}class Tp{constructor(e){this.base64=!1,this.contentType=null;const t=e.match(/^data:([^,]+)?,/);if(t===null)throw Gs(dt.DATA_URL,"Must be formatted 'data:[<mediatype>][;base64],<data>");const s=t[1]||null;s!=null&&(this.base64=lI(s,";base64"),this.contentType=this.base64?s.substring(0,s.length-7):s),this.rest=e.substring(e.indexOf(",")+1)}}function aI(n){const e=new Tp(n);return e.base64?Ep(dt.BASE64,e.rest):oI(e.rest)}function cI(n){return new Tp(n).contentType}function lI(n,e){return n.length>=e.length?n.substring(n.length-e.length)===e:!1}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jt{constructor(e,t){let s=0,r="";Sh(e)?(this.data_=e,s=e.size,r=e.type):e instanceof ArrayBuffer?(t?this.data_=new Uint8Array(e):(this.data_=new Uint8Array(e.byteLength),this.data_.set(new Uint8Array(e))),s=this.data_.length):e instanceof Uint8Array&&(t?this.data_=e:(this.data_=new Uint8Array(e.length),this.data_.set(e)),s=e.length),this.size_=s,this.type_=r}size(){return this.size_}type(){return this.type_}slice(e,t){if(Sh(this.data_)){const s=this.data_,r=sI(s,e,t);return r===null?null:new jt(r)}else{const s=new Uint8Array(this.data_.buffer,e,t-e);return new jt(s,!0)}}static getBlob(...e){if(jc()){const t=e.map(s=>s instanceof jt?s.data_:s);return new jt(nI.apply(null,t))}else{const t=e.map(o=>$c(o)?iI(dt.RAW,o).data:o.data_);let s=0;t.forEach(o=>{s+=o.byteLength});const r=new Uint8Array(s);let i=0;return t.forEach(o=>{for(let c=0;c<o.length;c++)r[i++]=o[c]}),new jt(r,!0)}}uploadData(){return this.data_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function vp(n){let e;try{e=JSON.parse(n)}catch{return null}return Gv(e)?e:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function uI(n){if(n.length===0)return null;const e=n.lastIndexOf("/");return e===-1?"":n.slice(0,e)}function hI(n,e){const t=e.split("/").filter(s=>s.length>0).join("/");return n.length===0?t:n+"/"+t}function Ip(n){const e=n.lastIndexOf("/",n.length-2);return e===-1?n:n.slice(e+1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dI(n,e){return e}class qe{constructor(e,t,s,r){this.server=e,this.local=t||e,this.writable=!!s,this.xform=r||dI}}let Kr=null;function fI(n){return!$c(n)||n.length<2?n:Ip(n)}function wp(){if(Kr)return Kr;const n=[];n.push(new qe("bucket")),n.push(new qe("generation")),n.push(new qe("metageneration")),n.push(new qe("name","fullPath",!0));function e(i,o){return fI(o)}const t=new qe("name");t.xform=e,n.push(t);function s(i,o){return o!==void 0?Number(o):o}const r=new qe("size");return r.xform=s,n.push(r),n.push(new qe("timeCreated")),n.push(new qe("updated")),n.push(new qe("md5Hash",null,!0)),n.push(new qe("cacheControl",null,!0)),n.push(new qe("contentDisposition",null,!0)),n.push(new qe("contentEncoding",null,!0)),n.push(new qe("contentLanguage",null,!0)),n.push(new qe("contentType",null,!0)),n.push(new qe("metadata","customMetadata",!0)),Kr=n,Kr}function pI(n,e){function t(){const s=n.bucket,r=n.fullPath,i=new Ze(s,r);return e._makeStorageReference(i)}Object.defineProperty(n,"ref",{get:t})}function _I(n,e,t){const s={};s.type="file";const r=t.length;for(let i=0;i<r;i++){const o=t[i];s[o.local]=o.xform(s,e[o.server])}return pI(s,n),s}function Ap(n,e,t){const s=vp(e);return s===null?null:_I(n,s,t)}function mI(n,e,t,s){const r=vp(e);if(r===null||!$c(r.downloadTokens))return null;const i=r.downloadTokens;if(i.length===0)return null;const o=encodeURIComponent;return i.split(",").map(h=>{const f=n.bucket,p=n.fullPath,m="/b/"+o(f)+"/o/"+o(p),w=Wc(m,t,s),S=gp({alt:"media",token:h});return w+S})[0]}function gI(n,e){const t={},s=e.length;for(let r=0;r<s;r++){const i=e[r];i.writable&&(t[i.server]=n[i.local])}return JSON.stringify(t)}class Cp{constructor(e,t,s,r){this.url=e,this.method=t,this.handler=s,this.timeout=r,this.urlParams={},this.headers={},this.body=null,this.errorHandler=null,this.progressCallback=null,this.successCodes=[200],this.additionalRetryCodes=[]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Rp(n){if(!n)throw qc()}function yI(n,e){function t(s,r){const i=Ap(n,r,e);return Rp(i!==null),i}return t}function EI(n,e){function t(s,r){const i=Ap(n,r,e);return Rp(i!==null),mI(i,r,n.host,n._protocol)}return t}function Sp(n){function e(t,s){let r;return t.getStatus()===401?t.getErrorText().includes("Firebase App Check token is invalid")?r=Dv():r=kv():t.getStatus()===402?r=Nv(n.bucket):t.getStatus()===403?r=Ov(n.path):r=s,r.status=t.getStatus(),r.serverResponse=s.serverResponse,r}return e}function TI(n){const e=Sp(n);function t(s,r){let i=e(s,r);return s.getStatus()===404&&(i=Pv(n.path)),i.serverResponse=r.serverResponse,i}return t}function vI(n,e,t){const s=e.fullServerUrl(),r=Wc(s,n.host,n._protocol),i="GET",o=n.maxOperationRetryTime,c=new Cp(r,i,EI(n,t),o);return c.errorHandler=TI(e),c}function II(n,e){return n&&n.contentType||e&&e.type()||"application/octet-stream"}function wI(n,e,t){const s=Object.assign({},t);return s.fullPath=n.path,s.size=e.size(),s.contentType||(s.contentType=II(null,e)),s}function AI(n,e,t,s,r){const i=e.bucketOnlyServerUrl(),o={"X-Goog-Upload-Protocol":"multipart"};function c(){let $="";for(let Q=0;Q<2;Q++)$=$+Math.random().toString().slice(2);return $}const l=c();o["Content-Type"]="multipart/related; boundary="+l;const h=wI(e,s,r),f=gI(h,t),p="--"+l+`\r
Content-Type: application/json; charset=utf-8\r
\r
`+f+`\r
--`+l+`\r
Content-Type: `+h.contentType+`\r
\r
`,m=`\r
--`+l+"--",w=jt.getBlob(p,s,m);if(w===null)throw Uv();const S={name:h.fullPath},k=Wc(i,n.host,n._protocol),N="POST",x=n.maxUploadRetryTime,U=new Cp(k,N,yI(n,t),x);return U.urlParams=S,U.headers=o,U.body=w.uploadData(),U.errorHandler=Sp(e),U}class CI{constructor(){this.sent_=!1,this.xhr_=new XMLHttpRequest,this.initXhr(),this.errorCode_=Tn.NO_ERROR,this.sendPromise_=new Promise(e=>{this.xhr_.addEventListener("abort",()=>{this.errorCode_=Tn.ABORT,e()}),this.xhr_.addEventListener("error",()=>{this.errorCode_=Tn.NETWORK_ERROR,e()}),this.xhr_.addEventListener("load",()=>{e()})})}send(e,t,s,r,i){if(this.sent_)throw Ds("cannot .send() more than once");if(Ot(e)&&s&&(this.xhr_.withCredentials=!0),this.sent_=!0,this.xhr_.open(t,e,!0),i!==void 0)for(const o in i)i.hasOwnProperty(o)&&this.xhr_.setRequestHeader(o,i[o].toString());return r!==void 0?this.xhr_.send(r):this.xhr_.send(),this.sendPromise_}getErrorCode(){if(!this.sent_)throw Ds("cannot .getErrorCode() before sending");return this.errorCode_}getStatus(){if(!this.sent_)throw Ds("cannot .getStatus() before sending");try{return this.xhr_.status}catch{return-1}}getResponse(){if(!this.sent_)throw Ds("cannot .getResponse() before sending");return this.xhr_.response}getErrorText(){if(!this.sent_)throw Ds("cannot .getErrorText() before sending");return this.xhr_.statusText}abort(){this.xhr_.abort()}getResponseHeader(e){return this.xhr_.getResponseHeader(e)}addUploadProgressListener(e){this.xhr_.upload!=null&&this.xhr_.upload.addEventListener("progress",e)}removeUploadProgressListener(e){this.xhr_.upload!=null&&this.xhr_.upload.removeEventListener("progress",e)}}class RI extends CI{initXhr(){this.xhr_.responseType="text"}}function bp(){return new RI}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wn{constructor(e,t){this._service=e,t instanceof Ze?this._location=t:this._location=Ze.makeFromUrl(t,e.host)}toString(){return"gs://"+this._location.bucket+"/"+this._location.path}_newRef(e,t){return new wn(e,t)}get root(){const e=new Ze(this._location.bucket,"");return this._newRef(this._service,e)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return Ip(this._location.path)}get storage(){return this._service}get parent(){const e=uI(this._location.path);if(e===null)return null;const t=new Ze(this._location.bucket,e);return new wn(this._service,t)}_throwIfRoot(e){if(this._location.path==="")throw $v(e)}}function SI(n,e,t){n._throwIfRoot("uploadBytes");const s=AI(n.storage,n._location,wp(),new jt(e,!0),t);return n.storage.makeRequestWithTokens(s,bp).then(r=>({metadata:r,ref:n}))}function bI(n){n._throwIfRoot("getDownloadURL");const e=vI(n.storage,n._location,wp());return n.storage.makeRequestWithTokens(e,bp).then(t=>{if(t===null)throw Bv();return t})}function PI(n,e){const t=hI(n._location.path,e),s=new Ze(n._location.bucket,t);return new wn(n.storage,s)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function NI(n){return/^[A-Za-z]+:\/\//.test(n)}function kI(n,e){return new wn(n,e)}function Pp(n,e){if(n instanceof zc){const t=n;if(t._bucket==null)throw Fv();const s=new wn(t,t._bucket);return e!=null?Pp(s,e):s}else return e!==void 0?PI(n,e):n}function DI(n,e){if(e&&NI(e)){if(n instanceof zc)return kI(n,e);throw Pa("To use ref(service, url), the first argument must be a Storage instance.")}else return Pp(n,e)}function Ph(n,e){const t=e==null?void 0:e[_p];return t==null?null:Ze.makeFromBucketSpec(t,n)}function OI(n,e,t,s={}){n.host=`${e}:${t}`;const r=Ot(e);r&&(Qa(`https://${n.host}/b`),Ya("Storage",!0)),n._isUsingEmulator=!0,n._protocol=r?"https":"http";const{mockUserToken:i}=s;i&&(n._overrideAuthToken=typeof i=="string"?i:kd(i,n.app.options.projectId))}class zc{constructor(e,t,s,r,i,o=!1){this.app=e,this._authProvider=t,this._appCheckProvider=s,this._url=r,this._firebaseVersion=i,this._isUsingEmulator=o,this._bucket=null,this._host=pp,this._protocol="https",this._appId=null,this._deleted=!1,this._maxOperationRetryTime=Sv,this._maxUploadRetryTime=bv,this._requests=new Set,r!=null?this._bucket=Ze.makeFromBucketSpec(r,this._host):this._bucket=Ph(this._host,this.app.options)}get host(){return this._host}set host(e){this._host=e,this._url!=null?this._bucket=Ze.makeFromBucketSpec(this._url,e):this._bucket=Ph(e,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(e){bh("time",0,Number.POSITIVE_INFINITY,e),this._maxUploadRetryTime=e}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(e){bh("time",0,Number.POSITIVE_INFINITY,e),this._maxOperationRetryTime=e}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;const e=this._authProvider.getImmediate({optional:!0});if(e){const t=await e.getToken();if(t!==null)return t.accessToken}return null}async _getAppCheckToken(){if(ht(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=this._appCheckProvider.getImmediate({optional:!0});return e?(await e.getToken()).token:null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(e=>e.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(e){return new wn(this,e)}_makeRequest(e,t,s,r,i=!0){if(this._deleted)return new jv(mp());{const o=eI(e,this._appId,s,r,t,this._firebaseVersion,i,this._isUsingEmulator);return this._requests.add(o),o.getPromise().then(()=>this._requests.delete(o),()=>this._requests.delete(o)),o}}async makeRequestWithTokens(e,t){const[s,r]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(e,t,s,r).getPromise()}}const Nh="@firebase/storage",kh="0.14.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Np="storage";function JR(n,e,t){return n=ne(n),SI(n,e,t)}function ZR(n){return n=ne(n),bI(n)}function eS(n,e){return n=ne(n),DI(n,e)}function VI(n=ec(),e){n=ne(n);const s=Za(n,Np).getImmediate({identifier:e}),r=Ka("storage");return r&&MI(s,...r),s}function MI(n,e,t,s={}){OI(n,e,t,s)}function LI(n,{instanceIdentifier:e}){const t=n.getProvider("app").getImmediate(),s=n.getProvider("auth-internal"),r=n.getProvider("app-check-internal");return new zc(t,s,r,e,is)}function xI(){Pt(new Tt(Np,LI,"PUBLIC").setMultipleInstances(!0)),Ke(Nh,kh,""),Ke(Nh,kh,"esm2020")}xI();/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const FI="type.googleapis.com/google.protobuf.Int64Value",UI="type.googleapis.com/google.protobuf.UInt64Value";function kp(n,e){const t={};for(const s in n)n.hasOwnProperty(s)&&(t[s]=e(n[s]));return t}function Ii(n){if(n==null)return null;if(n instanceof Number&&(n=n.valueOf()),typeof n=="number"&&isFinite(n)||n===!0||n===!1||Object.prototype.toString.call(n)==="[object String]")return n;if(n instanceof Date)return n.toISOString();if(Array.isArray(n))return n.map(e=>Ii(e));if(typeof n=="function"||typeof n=="object")return kp(n,e=>Ii(e));throw new Error("Data cannot be encoded in JSON: "+n)}function es(n){if(n==null)return n;if(n["@type"])switch(n["@type"]){case FI:case UI:{const e=Number(n.value);if(isNaN(e))throw new Error("Data cannot be decoded from JSON: "+n);return e}default:throw new Error("Data cannot be decoded from JSON: "+n)}return Array.isArray(n)?n.map(e=>es(e)):typeof n=="function"||typeof n=="object"?kp(n,e=>es(e)):n}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Hc="functions";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Dh={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class He extends It{constructor(e,t,s){super(`${Hc}/${e}`,t||""),this.details=s,Object.setPrototypeOf(this,He.prototype)}}function BI(n){if(n>=200&&n<300)return"ok";switch(n){case 0:return"internal";case 400:return"invalid-argument";case 401:return"unauthenticated";case 403:return"permission-denied";case 404:return"not-found";case 409:return"aborted";case 429:return"resource-exhausted";case 499:return"cancelled";case 500:return"internal";case 501:return"unimplemented";case 503:return"unavailable";case 504:return"deadline-exceeded"}return"unknown"}function wi(n,e){let t=BI(n),s=t,r;try{const i=e&&e.error;if(i){const o=i.status;if(typeof o=="string"){if(!Dh[o])return new He("internal","internal");t=Dh[o],s=o}const c=i.message;typeof c=="string"&&(s=c),r=i.details,r!==void 0&&(r=es(r))}}catch{}return t==="ok"?null:new He(t,s,r)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qI{constructor(e,t,s,r){this.app=e,this.auth=null,this.messaging=null,this.appCheck=null,this.serverAppAppCheckToken=null,ht(e)&&e.settings.appCheckToken&&(this.serverAppAppCheckToken=e.settings.appCheckToken),this.auth=t.getImmediate({optional:!0}),this.messaging=s.getImmediate({optional:!0}),this.auth||t.get().then(i=>this.auth=i,()=>{}),this.messaging||s.get().then(i=>this.messaging=i,()=>{}),this.appCheck||r==null||r.get().then(i=>this.appCheck=i,()=>{})}async getAuthToken(){if(this.auth)try{const e=await this.auth.getToken();return e==null?void 0:e.accessToken}catch{return}}async getMessagingToken(){if(!(!this.messaging||!("Notification"in self)||Notification.permission!=="granted"))try{return await this.messaging.getToken()}catch{return}}async getAppCheckToken(e){if(this.serverAppAppCheckToken)return this.serverAppAppCheckToken;if(this.appCheck){const t=e?await this.appCheck.getLimitedUseToken():await this.appCheck.getToken();return t.error?null:t.token}return null}async getContext(e){const t=await this.getAuthToken(),s=await this.getMessagingToken(),r=await this.getAppCheckToken(e);return{authToken:t,messagingToken:s,appCheckToken:r}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Na="us-central1",$I=/^data: (.*?)(?:\n|$)/;function jI(n){let e=null;return{promise:new Promise((t,s)=>{e=setTimeout(()=>{s(new He("deadline-exceeded","deadline-exceeded"))},n)}),cancel:()=>{e&&clearTimeout(e)}}}class WI{constructor(e,t,s,r,i=Na,o=(...c)=>fetch(...c)){this.app=e,this.fetchImpl=o,this.emulatorOrigin=null,this.contextProvider=new qI(e,t,s,r),this.cancelAllRequests=new Promise(c=>{this.deleteService=()=>Promise.resolve(c())});try{const c=new URL(i);this.customDomain=c.origin+(c.pathname==="/"?"":c.pathname),this.region=Na}catch{this.customDomain=null,this.region=i}}_delete(){return this.deleteService()}_url(e){const t=this.app.options.projectId;return this.emulatorOrigin!==null?`${this.emulatorOrigin}/${t}/${this.region}/${e}`:this.customDomain!==null?`${this.customDomain}/${e}`:`https://${this.region}-${t}.cloudfunctions.net/${e}`}}function zI(n,e,t){const s=Ot(e);n.emulatorOrigin=`http${s?"s":""}://${e}:${t}`,s&&(Qa(n.emulatorOrigin+"/backends"),Ya("Functions",!0))}function HI(n,e,t){const s=r=>KI(n,e,r,{});return s.stream=(r,i)=>YI(n,e,r,i),s}function Dp(n){return n.emulatorOrigin&&Ot(n.emulatorOrigin)?"include":void 0}async function GI(n,e,t,s,r){t["Content-Type"]="application/json";let i;try{i=await s(n,{method:"POST",body:JSON.stringify(e),headers:t,credentials:Dp(r)})}catch{return{status:0,json:null}}let o=null;try{o=await i.json()}catch{}return{status:i.status,json:o}}async function Op(n,e){const t={},s=await n.contextProvider.getContext(e.limitedUseAppCheckTokens);return s.authToken&&(t.Authorization="Bearer "+s.authToken),s.messagingToken&&(t["Firebase-Instance-ID-Token"]=s.messagingToken),s.appCheckToken!==null&&(t["X-Firebase-AppCheck"]=s.appCheckToken),t}function KI(n,e,t,s){const r=n._url(e);return QI(n,r,t,s)}async function QI(n,e,t,s){t=Ii(t);const r={data:t},i=await Op(n,s),o=s.timeout||7e4,c=jI(o),l=await Promise.race([GI(e,r,i,n.fetchImpl,n),c.promise,n.cancelAllRequests]);if(c.cancel(),!l)throw new He("cancelled","Firebase Functions instance was deleted.");const h=wi(l.status,l.json);if(h)throw h;if(!l.json)throw new He("internal","Response is not valid JSON object.");let f=l.json.data;if(typeof f>"u"&&(f=l.json.result),typeof f>"u")throw new He("internal","Response is missing data field.");return{data:es(f)}}function YI(n,e,t,s){const r=n._url(e);return XI(n,r,t,s||{})}async function XI(n,e,t,s){var m;t=Ii(t);const r={data:t},i=await Op(n,s);i["Content-Type"]="application/json",i.Accept="text/event-stream";let o;try{o=await n.fetchImpl(e,{method:"POST",body:JSON.stringify(r),headers:i,signal:s==null?void 0:s.signal,credentials:Dp(n)})}catch(w){if(w instanceof Error&&w.name==="AbortError"){const k=new He("cancelled","Request was cancelled.");return{data:Promise.reject(k),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(k)}}}}}}const S=wi(0,null);return{data:Promise.reject(S),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(S)}}}}}}let c,l;const h=new Promise((w,S)=>{c=w,l=S});(m=s==null?void 0:s.signal)==null||m.addEventListener("abort",()=>{const w=new He("cancelled","Request was cancelled.");l(w)});const f=o.body.getReader(),p=JI(f,c,l,s==null?void 0:s.signal);return{stream:{[Symbol.asyncIterator](){const w=p.getReader();return{async next(){const{value:S,done:k}=await w.read();return{value:S,done:k}},async return(){return await w.cancel(),{done:!0,value:void 0}}}}},data:h}}function JI(n,e,t,s){const r=(o,c)=>{const l=o.match($I);if(!l)return;const h=l[1];try{const f=JSON.parse(h);if("result"in f){e(es(f.result));return}if("message"in f){c.enqueue(es(f.message));return}if("error"in f){const p=wi(0,f);c.error(p),t(p);return}}catch(f){if(f instanceof He){c.error(f),t(f);return}}},i=new TextDecoder;return new ReadableStream({start(o){let c="";return l();async function l(){if(s!=null&&s.aborted){const h=new He("cancelled","Request was cancelled");return o.error(h),t(h),Promise.resolve()}try{const{value:h,done:f}=await n.read();if(f){c.trim()&&r(c.trim(),o),o.close();return}if(s!=null&&s.aborted){const m=new He("cancelled","Request was cancelled");o.error(m),t(m),await n.cancel();return}c+=i.decode(h,{stream:!0});const p=c.split(`
`);c=p.pop()||"";for(const m of p)m.trim()&&r(m.trim(),o);return l()}catch(h){const f=h instanceof He?h:wi(0,null);o.error(f),t(f)}}},cancel(){return n.cancel()}})}const Oh="@firebase/functions",Vh="0.13.1";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ZI="auth-internal",ew="app-check-internal",tw="messaging-internal";function nw(n){const e=(t,{instanceIdentifier:s})=>{const r=t.getProvider("app").getImmediate(),i=t.getProvider(ZI),o=t.getProvider(tw),c=t.getProvider(ew);return new WI(r,i,o,c,s)};Pt(new Tt(Hc,e,"PUBLIC").setMultipleInstances(!0)),Ke(Oh,Vh,n),Ke(Oh,Vh,"esm2020")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function sw(n=ec(),e=Na){const s=Za(ne(n),Hc).getImmediate({identifier:e}),r=Ka("functions");return r&&rw(s,...r),s}function rw(n,e,t){zI(ne(n),e,t)}function tS(n,e,t){return HI(ne(n),e)}nw();const iw={apiKey:"AIzaSyBdE26vC0UAprsdTgBcmYrVuO67ZbccMTA",authDomain:"apps-script-api-443402.firebaseapp.com",databaseURL:"https://apps-script-api-443402-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"apps-script-api-443402",storageBucket:"apps-script-api-443402.appspot.com",messagingSenderId:"46453918785",appId:"1:46453918785:web:a3c386def8dfe69f768ac0",measurementId:"G-TCZ9TL8FLW"},io=Vd(iw),nS=dv(io,"anxi-app"),sS=VI(io),rS=sw(io,"asia-east1"),iS=getDatabase(io);var Mh={};const Lh="@firebase/database",xh="1.1.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Vp="";function ow(n){Vp=n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class aw{constructor(e){this.domStorage_=e,this.prefix_="firebase:"}set(e,t){t==null?this.domStorage_.removeItem(this.prefixedName_(e)):this.domStorage_.setItem(this.prefixedName_(e),Ne(t))}get(e){const t=this.domStorage_.getItem(this.prefixedName_(e));return t==null?null:er(t)}remove(e){this.domStorage_.removeItem(this.prefixedName_(e))}prefixedName_(e){return this.prefix_+e}toString(){return this.domStorage_.toString()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cw{constructor(){this.cache_={},this.isInMemoryStorage=!0}set(e,t){t==null?delete this.cache_[e]:this.cache_[e]=t}get(e){return wt(this.cache_,e)?this.cache_[e]:null}remove(e){delete this.cache_[e]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mp=function(n){try{if(typeof window<"u"&&typeof window[n]<"u"){const e=window[n];return e.setItem("firebase:sentinel","cache"),e.removeItem("firebase:sentinel"),new aw(e)}}catch{}return new cw},_n=Mp("localStorage"),lw=Mp("sessionStorage");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $n=new Fi("@firebase/database"),uw=(function(){let n=1;return function(){return n++}})(),Lp=function(n){const e=ug(n),t=new og;t.update(e);const s=t.digest();return Ga.encodeByteArray(s)},Ir=function(...n){let e="";for(let t=0;t<n.length;t++){const s=n[t];Array.isArray(s)||s&&typeof s=="object"&&typeof s.length=="number"?e+=Ir.apply(null,s):typeof s=="object"?e+=Ne(s):e+=s,e+=" "}return e};let Ks=null,Fh=!0;const hw=function(n,e){O(!0,"Can't turn on custom loggers persistently."),$n.logLevel=W.VERBOSE,Ks=$n.log.bind($n)},Pe=function(...n){if(Fh===!0&&(Fh=!1,Ks===null&&lw.get("logging_enabled")===!0&&hw()),Ks){const e=Ir.apply(null,n);Ks(e)}},wr=function(n){return function(...e){Pe(n,...e)}},ka=function(...n){const e="FIREBASE INTERNAL ERROR: "+Ir(...n);$n.error(e)},An=function(...n){const e=`FIREBASE FATAL ERROR: ${Ir(...n)}`;throw $n.error(e),new Error(e)},Qe=function(...n){const e="FIREBASE WARNING: "+Ir(...n);$n.warn(e)},dw=function(){typeof window<"u"&&window.location&&window.location.protocol&&window.location.protocol.indexOf("https:")!==-1&&Qe("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().")},oo=function(n){return typeof n=="number"&&(n!==n||n===Number.POSITIVE_INFINITY||n===Number.NEGATIVE_INFINITY)},fw=function(n){if(document.readyState==="complete")n();else{let e=!1;const t=function(){if(!document.body){setTimeout(t,Math.floor(10));return}e||(e=!0,n())};document.addEventListener?(document.addEventListener("DOMContentLoaded",t,!1),window.addEventListener("load",t,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",()=>{document.readyState==="complete"&&t()}),window.attachEvent("onload",t))}},ts="[MIN_NAME]",Cn="[MAX_NAME]",Nn=function(n,e){if(n===e)return 0;if(n===ts||e===Cn)return-1;if(e===ts||n===Cn)return 1;{const t=Uh(n),s=Uh(e);return t!==null?s!==null?t-s===0?n.length-e.length:t-s:-1:s!==null?1:n<e?-1:1}},pw=function(n,e){return n===e?0:n<e?-1:1},Os=function(n,e){if(e&&n in e)return e[n];throw new Error("Missing required key ("+n+") in object: "+Ne(e))},Gc=function(n){if(typeof n!="object"||n===null)return Ne(n);const e=[];for(const s in n)e.push(s);e.sort();let t="{";for(let s=0;s<e.length;s++)s!==0&&(t+=","),t+=Ne(e[s]),t+=":",t+=Gc(n[e[s]]);return t+="}",t},xp=function(n,e){const t=n.length;if(t<=e)return[n];const s=[];for(let r=0;r<t;r+=e)r+e>t?s.push(n.substring(r,t)):s.push(n.substring(r,r+e));return s};function Ye(n,e){for(const t in n)n.hasOwnProperty(t)&&e(t,n[t])}const Fp=function(n){O(!oo(n),"Invalid JSON number");const e=11,t=52,s=(1<<e-1)-1;let r,i,o,c,l;n===0?(i=0,o=0,r=1/n===-1/0?1:0):(r=n<0,n=Math.abs(n),n>=Math.pow(2,1-s)?(c=Math.min(Math.floor(Math.log(n)/Math.LN2),s),i=c+s,o=Math.round(n*Math.pow(2,t-c)-Math.pow(2,t))):(i=0,o=Math.round(n/Math.pow(2,1-s-t))));const h=[];for(l=t;l;l-=1)h.push(o%2?1:0),o=Math.floor(o/2);for(l=e;l;l-=1)h.push(i%2?1:0),i=Math.floor(i/2);h.push(r?1:0),h.reverse();const f=h.join("");let p="";for(l=0;l<64;l+=8){let m=parseInt(f.substr(l,8),2).toString(16);m.length===1&&(m="0"+m),p=p+m}return p.toLowerCase()},_w=function(){return!!(typeof window=="object"&&window.chrome&&window.chrome.extension&&!/^chrome/.test(window.location.href))},mw=function(){return typeof Windows=="object"&&typeof Windows.UI=="object"},gw=new RegExp("^-?(0*)\\d{1,10}$"),yw=-2147483648,Ew=2147483647,Uh=function(n){if(gw.test(n)){const e=Number(n);if(e>=yw&&e<=Ew)return e}return null},fs=function(n){try{n()}catch(e){setTimeout(()=>{const t=e.stack||"";throw Qe("Exception was thrown by user callback.",t),e},Math.floor(0))}},Tw=function(){return(typeof window=="object"&&window.navigator&&window.navigator.userAgent||"").search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i)>=0},Qs=function(n,e){const t=setTimeout(n,e);return typeof t=="number"&&typeof Deno<"u"&&Deno.unrefTimer?Deno.unrefTimer(t):typeof t=="object"&&t.unref&&t.unref(),t};/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vw{constructor(e,t){this.appCheckProvider=t,this.appName=e.name,ht(e)&&e.settings.appCheckToken&&(this.serverAppAppCheckToken=e.settings.appCheckToken),this.appCheck=t==null?void 0:t.getImmediate({optional:!0}),this.appCheck||t==null||t.get().then(s=>this.appCheck=s)}getToken(e){if(this.serverAppAppCheckToken){if(e)throw new Error("Attempted reuse of `FirebaseServerApp.appCheckToken` after previous usage failed.");return Promise.resolve({token:this.serverAppAppCheckToken})}return this.appCheck?this.appCheck.getToken(e):new Promise((t,s)=>{setTimeout(()=>{this.appCheck?this.getToken(e).then(t,s):t(null)},0)})}addTokenChangeListener(e){var t;(t=this.appCheckProvider)==null||t.get().then(s=>s.addTokenListener(e))}notifyForInvalidToken(){Qe(`Provided AppCheck credentials for the app named "${this.appName}" are invalid. This usually indicates your app was not initialized correctly.`)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Iw{constructor(e,t,s){this.appName_=e,this.firebaseOptions_=t,this.authProvider_=s,this.auth_=null,this.auth_=s.getImmediate({optional:!0}),this.auth_||s.onInit(r=>this.auth_=r)}getToken(e){return this.auth_?this.auth_.getToken(e).catch(t=>t&&t.code==="auth/token-not-initialized"?(Pe("Got auth/token-not-initialized error.  Treating as null token."),null):Promise.reject(t)):new Promise((t,s)=>{setTimeout(()=>{this.auth_?this.getToken(e).then(t,s):t(null)},0)})}addTokenChangeListener(e){this.auth_?this.auth_.addAuthTokenListener(e):this.authProvider_.get().then(t=>t.addAuthTokenListener(e))}removeTokenChangeListener(e){this.authProvider_.get().then(t=>t.removeAuthTokenListener(e))}notifyForInvalidToken(){let e='Provided authentication credentials for the app named "'+this.appName_+'" are invalid. This usually indicates your app was not initialized correctly. ';"credential"in this.firebaseOptions_?e+='Make sure the "credential" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':"serviceAccount"in this.firebaseOptions_?e+='Make sure the "serviceAccount" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':e+='Make sure the "apiKey" and "databaseURL" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.',Qe(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Kc="5",Up="v",Bp="s",qp="r",$p="f",jp=/(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/,Wp="ls",zp="p",Da="ac",Hp="websocket",Gp="long_polling";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ww{constructor(e,t,s,r,i=!1,o="",c=!1,l=!1,h=null){this.secure=t,this.namespace=s,this.webSocketOnly=r,this.nodeAdmin=i,this.persistenceKey=o,this.includeNamespaceInQueryParams=c,this.isUsingEmulator=l,this.emulatorOptions=h,this._host=e.toLowerCase(),this._domain=this._host.substr(this._host.indexOf(".")+1),this.internalHost=_n.get("host:"+e)||this._host}isCacheableHost(){return this.internalHost.substr(0,2)==="s-"}isCustomHost(){return this._domain!=="firebaseio.com"&&this._domain!=="firebaseio-demo.com"}get host(){return this._host}set host(e){e!==this.internalHost&&(this.internalHost=e,this.isCacheableHost()&&_n.set("host:"+this._host,this.internalHost))}toString(){let e=this.toURLString();return this.persistenceKey&&(e+="<"+this.persistenceKey+">"),e}toURLString(){const e=this.secure?"https://":"http://",t=this.includeNamespaceInQueryParams?`?ns=${this.namespace}`:"";return`${e}${this.host}/${t}`}}function Aw(n){return n.host!==n.internalHost||n.isCustomHost()||n.includeNamespaceInQueryParams}function Kp(n,e,t){O(typeof e=="string","typeof type must == string"),O(typeof t=="object","typeof params must == object");let s;if(e===Hp)s=(n.secure?"wss://":"ws://")+n.internalHost+"/.ws?";else if(e===Gp)s=(n.secure?"https://":"http://")+n.internalHost+"/.lp?";else throw new Error("Unknown connection type: "+e);Aw(n)&&(t.ns=n.namespace);const r=[];return Ye(t,(i,o)=>{r.push(i+"="+o)}),s+r.join("&")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cw{constructor(){this.counters_={}}incrementCounter(e,t=1){wt(this.counters_,e)||(this.counters_[e]=0),this.counters_[e]+=t}get(){return Fm(this.counters_)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yo={},Xo={};function Qc(n){const e=n.toString();return Yo[e]||(Yo[e]=new Cw),Yo[e]}function Rw(n,e){const t=n.toString();return Xo[t]||(Xo[t]=e()),Xo[t]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Sw{constructor(e){this.onMessage_=e,this.pendingResponses=[],this.currentResponseNum=0,this.closeAfterResponse=-1,this.onClose=null}closeAfter(e,t){this.closeAfterResponse=e,this.onClose=t,this.closeAfterResponse<this.currentResponseNum&&(this.onClose(),this.onClose=null)}handleResponse(e,t){for(this.pendingResponses[e]=t;this.pendingResponses[this.currentResponseNum];){const s=this.pendingResponses[this.currentResponseNum];delete this.pendingResponses[this.currentResponseNum];for(let r=0;r<s.length;++r)s[r]&&fs(()=>{this.onMessage_(s[r])});if(this.currentResponseNum===this.closeAfterResponse){this.onClose&&(this.onClose(),this.onClose=null);break}this.currentResponseNum++}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bh="start",bw="close",Pw="pLPCommand",Nw="pRTLPCB",Qp="id",Yp="pw",Xp="ser",kw="cb",Dw="seg",Ow="ts",Vw="d",Mw="dframe",Jp=1870,Zp=30,Lw=Jp-Zp,xw=25e3,Fw=3e4;class Bn{constructor(e,t,s,r,i,o,c){this.connId=e,this.repoInfo=t,this.applicationId=s,this.appCheckToken=r,this.authToken=i,this.transportSessionId=o,this.lastSessionId=c,this.bytesSent=0,this.bytesReceived=0,this.everConnected_=!1,this.log_=wr(e),this.stats_=Qc(t),this.urlFn=l=>(this.appCheckToken&&(l[Da]=this.appCheckToken),Kp(t,Gp,l))}open(e,t){this.curSegmentNum=0,this.onDisconnect_=t,this.myPacketOrderer=new Sw(e),this.isClosed_=!1,this.connectTimeoutTimer_=setTimeout(()=>{this.log_("Timed out trying to connect."),this.onClosed_(),this.connectTimeoutTimer_=null},Math.floor(Fw)),fw(()=>{if(this.isClosed_)return;this.scriptTagHolder=new Yc((...i)=>{const[o,c,l,h,f]=i;if(this.incrementIncomingBytes_(i),!!this.scriptTagHolder)if(this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null),this.everConnected_=!0,o===Bh)this.id=c,this.password=l;else if(o===bw)c?(this.scriptTagHolder.sendNewPolls=!1,this.myPacketOrderer.closeAfter(c,()=>{this.onClosed_()})):this.onClosed_();else throw new Error("Unrecognized command received: "+o)},(...i)=>{const[o,c]=i;this.incrementIncomingBytes_(i),this.myPacketOrderer.handleResponse(o,c)},()=>{this.onClosed_()},this.urlFn);const s={};s[Bh]="t",s[Xp]=Math.floor(Math.random()*1e8),this.scriptTagHolder.uniqueCallbackIdentifier&&(s[kw]=this.scriptTagHolder.uniqueCallbackIdentifier),s[Up]=Kc,this.transportSessionId&&(s[Bp]=this.transportSessionId),this.lastSessionId&&(s[Wp]=this.lastSessionId),this.applicationId&&(s[zp]=this.applicationId),this.appCheckToken&&(s[Da]=this.appCheckToken),typeof location<"u"&&location.hostname&&jp.test(location.hostname)&&(s[qp]=$p);const r=this.urlFn(s);this.log_("Connecting via long-poll to "+r),this.scriptTagHolder.addTag(r,()=>{})})}start(){this.scriptTagHolder.startLongPoll(this.id,this.password),this.addDisconnectPingFrame(this.id,this.password)}static forceAllow(){Bn.forceAllow_=!0}static forceDisallow(){Bn.forceDisallow_=!0}static isAvailable(){return Bn.forceAllow_?!0:!Bn.forceDisallow_&&typeof document<"u"&&document.createElement!=null&&!_w()&&!mw()}markConnectionHealthy(){}shutdown_(){this.isClosed_=!0,this.scriptTagHolder&&(this.scriptTagHolder.close(),this.scriptTagHolder=null),this.myDisconnFrame&&(document.body.removeChild(this.myDisconnFrame),this.myDisconnFrame=null),this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null)}onClosed_(){this.isClosed_||(this.log_("Longpoll is closing itself"),this.shutdown_(),this.onDisconnect_&&(this.onDisconnect_(this.everConnected_),this.onDisconnect_=null))}close(){this.isClosed_||(this.log_("Longpoll is being closed."),this.shutdown_())}send(e){const t=Ne(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const s=bd(t),r=xp(s,Lw);for(let i=0;i<r.length;i++)this.scriptTagHolder.enqueueSegment(this.curSegmentNum,r.length,r[i]),this.curSegmentNum++}addDisconnectPingFrame(e,t){this.myDisconnFrame=document.createElement("iframe");const s={};s[Mw]="t",s[Qp]=e,s[Yp]=t,this.myDisconnFrame.src=this.urlFn(s),this.myDisconnFrame.style.display="none",document.body.appendChild(this.myDisconnFrame)}incrementIncomingBytes_(e){const t=Ne(e).length;this.bytesReceived+=t,this.stats_.incrementCounter("bytes_received",t)}}class Yc{constructor(e,t,s,r){this.onDisconnect=s,this.urlFn=r,this.outstandingRequests=new Set,this.pendingSegs=[],this.currentSerial=Math.floor(Math.random()*1e8),this.sendNewPolls=!0;{this.uniqueCallbackIdentifier=uw(),window[Pw+this.uniqueCallbackIdentifier]=e,window[Nw+this.uniqueCallbackIdentifier]=t,this.myIFrame=Yc.createIFrame_();let i="";this.myIFrame.src&&this.myIFrame.src.substr(0,11)==="javascript:"&&(i='<script>document.domain="'+document.domain+'";<\/script>');const o="<html><body>"+i+"</body></html>";try{this.myIFrame.doc.open(),this.myIFrame.doc.write(o),this.myIFrame.doc.close()}catch(c){Pe("frame writing exception"),c.stack&&Pe(c.stack),Pe(c)}}}static createIFrame_(){const e=document.createElement("iframe");if(e.style.display="none",document.body){document.body.appendChild(e);try{e.contentWindow.document||Pe("No IE domain setting required")}catch{const s=document.domain;e.src="javascript:void((function(){document.open();document.domain='"+s+"';document.close();})())"}}else throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";return e.contentDocument?e.doc=e.contentDocument:e.contentWindow?e.doc=e.contentWindow.document:e.document&&(e.doc=e.document),e}close(){this.alive=!1,this.myIFrame&&(this.myIFrame.doc.body.textContent="",setTimeout(()=>{this.myIFrame!==null&&(document.body.removeChild(this.myIFrame),this.myIFrame=null)},Math.floor(0)));const e=this.onDisconnect;e&&(this.onDisconnect=null,e())}startLongPoll(e,t){for(this.myID=e,this.myPW=t,this.alive=!0;this.newRequest_(););}newRequest_(){if(this.alive&&this.sendNewPolls&&this.outstandingRequests.size<(this.pendingSegs.length>0?2:1)){this.currentSerial++;const e={};e[Qp]=this.myID,e[Yp]=this.myPW,e[Xp]=this.currentSerial;let t=this.urlFn(e),s="",r=0;for(;this.pendingSegs.length>0&&this.pendingSegs[0].d.length+Zp+s.length<=Jp;){const o=this.pendingSegs.shift();s=s+"&"+Dw+r+"="+o.seg+"&"+Ow+r+"="+o.ts+"&"+Vw+r+"="+o.d,r++}return t=t+s,this.addLongPollTag_(t,this.currentSerial),!0}else return!1}enqueueSegment(e,t,s){this.pendingSegs.push({seg:e,ts:t,d:s}),this.alive&&this.newRequest_()}addLongPollTag_(e,t){this.outstandingRequests.add(t);const s=()=>{this.outstandingRequests.delete(t),this.newRequest_()},r=setTimeout(s,Math.floor(xw)),i=()=>{clearTimeout(r),s()};this.addTag(e,i)}addTag(e,t){setTimeout(()=>{try{if(!this.sendNewPolls)return;const s=this.myIFrame.doc.createElement("script");s.type="text/javascript",s.async=!0,s.src=e,s.onload=s.onreadystatechange=function(){const r=s.readyState;(!r||r==="loaded"||r==="complete")&&(s.onload=s.onreadystatechange=null,s.parentNode&&s.parentNode.removeChild(s),t())},s.onerror=()=>{Pe("Long-poll script failed to load: "+e),this.sendNewPolls=!1,this.close()},this.myIFrame.doc.body.appendChild(s)}catch{}},Math.floor(1))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Uw=16384,Bw=45e3;let Ai=null;typeof MozWebSocket<"u"?Ai=MozWebSocket:typeof WebSocket<"u"&&(Ai=WebSocket);class st{constructor(e,t,s,r,i,o,c){this.connId=e,this.applicationId=s,this.appCheckToken=r,this.authToken=i,this.keepaliveTimer=null,this.frames=null,this.totalFrames=0,this.bytesSent=0,this.bytesReceived=0,this.log_=wr(this.connId),this.stats_=Qc(t),this.connURL=st.connectionURL_(t,o,c,r,s),this.nodeAdmin=t.nodeAdmin}static connectionURL_(e,t,s,r,i){const o={};return o[Up]=Kc,typeof location<"u"&&location.hostname&&jp.test(location.hostname)&&(o[qp]=$p),t&&(o[Bp]=t),s&&(o[Wp]=s),r&&(o[Da]=r),i&&(o[zp]=i),Kp(e,Hp,o)}open(e,t){this.onDisconnect=t,this.onMessage=e,this.log_("Websocket connecting to "+this.connURL),this.everConnected_=!1,_n.set("previous_websocket_failure",!0);try{let s;Xm(),this.mySock=new Ai(this.connURL,[],s)}catch(s){this.log_("Error instantiating WebSocket.");const r=s.message||s.data;r&&this.log_(r),this.onClosed_();return}this.mySock.onopen=()=>{this.log_("Websocket connected."),this.everConnected_=!0},this.mySock.onclose=()=>{this.log_("Websocket connection was disconnected."),this.mySock=null,this.onClosed_()},this.mySock.onmessage=s=>{this.handleIncomingFrame(s)},this.mySock.onerror=s=>{this.log_("WebSocket error.  Closing connection.");const r=s.message||s.data;r&&this.log_(r),this.onClosed_()}}start(){}static forceDisallow(){st.forceDisallow_=!0}static isAvailable(){let e=!1;if(typeof navigator<"u"&&navigator.userAgent){const t=/Android ([0-9]{0,}\.[0-9]{0,})/,s=navigator.userAgent.match(t);s&&s.length>1&&parseFloat(s[1])<4.4&&(e=!0)}return!e&&Ai!==null&&!st.forceDisallow_}static previouslyFailed(){return _n.isInMemoryStorage||_n.get("previous_websocket_failure")===!0}markConnectionHealthy(){_n.remove("previous_websocket_failure")}appendFrame_(e){if(this.frames.push(e),this.frames.length===this.totalFrames){const t=this.frames.join("");this.frames=null;const s=er(t);this.onMessage(s)}}handleNewFrameCount_(e){this.totalFrames=e,this.frames=[]}extractFrameCount_(e){if(O(this.frames===null,"We already have a frame buffer"),e.length<=6){const t=Number(e);if(!isNaN(t))return this.handleNewFrameCount_(t),null}return this.handleNewFrameCount_(1),e}handleIncomingFrame(e){if(this.mySock===null)return;const t=e.data;if(this.bytesReceived+=t.length,this.stats_.incrementCounter("bytes_received",t.length),this.resetKeepAlive(),this.frames!==null)this.appendFrame_(t);else{const s=this.extractFrameCount_(t);s!==null&&this.appendFrame_(s)}}send(e){this.resetKeepAlive();const t=Ne(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const s=xp(t,Uw);s.length>1&&this.sendString_(String(s.length));for(let r=0;r<s.length;r++)this.sendString_(s[r])}shutdown_(){this.isClosed_=!0,this.keepaliveTimer&&(clearInterval(this.keepaliveTimer),this.keepaliveTimer=null),this.mySock&&(this.mySock.close(),this.mySock=null)}onClosed_(){this.isClosed_||(this.log_("WebSocket is closing itself"),this.shutdown_(),this.onDisconnect&&(this.onDisconnect(this.everConnected_),this.onDisconnect=null))}close(){this.isClosed_||(this.log_("WebSocket is being closed"),this.shutdown_())}resetKeepAlive(){clearInterval(this.keepaliveTimer),this.keepaliveTimer=setInterval(()=>{this.mySock&&this.sendString_("0"),this.resetKeepAlive()},Math.floor(Bw))}sendString_(e){try{this.mySock.send(e)}catch(t){this.log_("Exception thrown from WebSocket.send():",t.message||t.data,"Closing connection."),setTimeout(this.onClosed_.bind(this),0)}}}st.responsesRequiredToBeHealthy=2;st.healthyTimeout=3e4;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ur{static get ALL_TRANSPORTS(){return[Bn,st]}static get IS_TRANSPORT_INITIALIZED(){return this.globalTransportInitialized_}constructor(e){this.initTransports_(e)}initTransports_(e){const t=st&&st.isAvailable();let s=t&&!st.previouslyFailed();if(e.webSocketOnly&&(t||Qe("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),s=!0),s)this.transports_=[st];else{const r=this.transports_=[];for(const i of ur.ALL_TRANSPORTS)i&&i.isAvailable()&&r.push(i);ur.globalTransportInitialized_=!0}}initialTransport(){if(this.transports_.length>0)return this.transports_[0];throw new Error("No transports available")}upgradeTransport(){return this.transports_.length>1?this.transports_[1]:null}}ur.globalTransportInitialized_=!1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qw=6e4,$w=5e3,jw=10*1024,Ww=100*1024,Jo="t",qh="d",zw="s",$h="r",Hw="e",jh="o",Wh="a",zh="n",Hh="p",Gw="h";class Kw{constructor(e,t,s,r,i,o,c,l,h,f){this.id=e,this.repoInfo_=t,this.applicationId_=s,this.appCheckToken_=r,this.authToken_=i,this.onMessage_=o,this.onReady_=c,this.onDisconnect_=l,this.onKill_=h,this.lastSessionId=f,this.connectionCount=0,this.pendingDataMessages=[],this.state_=0,this.log_=wr("c:"+this.id+":"),this.transportManager_=new ur(t),this.log_("Connection created"),this.start_()}start_(){const e=this.transportManager_.initialTransport();this.conn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,null,this.lastSessionId),this.primaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.conn_),s=this.disconnReceiver_(this.conn_);this.tx_=this.conn_,this.rx_=this.conn_,this.secondaryConn_=null,this.isHealthy_=!1,setTimeout(()=>{this.conn_&&this.conn_.open(t,s)},Math.floor(0));const r=e.healthyTimeout||0;r>0&&(this.healthyTimeout_=Qs(()=>{this.healthyTimeout_=null,this.isHealthy_||(this.conn_&&this.conn_.bytesReceived>Ww?(this.log_("Connection exceeded healthy timeout but has received "+this.conn_.bytesReceived+" bytes.  Marking connection healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()):this.conn_&&this.conn_.bytesSent>jw?this.log_("Connection exceeded healthy timeout but has sent "+this.conn_.bytesSent+" bytes.  Leaving connection alive."):(this.log_("Closing unhealthy connection after timeout."),this.close()))},Math.floor(r)))}nextTransportId_(){return"c:"+this.id+":"+this.connectionCount++}disconnReceiver_(e){return t=>{e===this.conn_?this.onConnectionLost_(t):e===this.secondaryConn_?(this.log_("Secondary connection lost."),this.onSecondaryConnectionLost_()):this.log_("closing an old connection")}}connReceiver_(e){return t=>{this.state_!==2&&(e===this.rx_?this.onPrimaryMessageReceived_(t):e===this.secondaryConn_?this.onSecondaryMessageReceived_(t):this.log_("message on old connection"))}}sendRequest(e){const t={t:"d",d:e};this.sendData_(t)}tryCleanupConnection(){this.tx_===this.secondaryConn_&&this.rx_===this.secondaryConn_&&(this.log_("cleaning up and promoting a connection: "+this.secondaryConn_.connId),this.conn_=this.secondaryConn_,this.secondaryConn_=null)}onSecondaryControl_(e){if(Jo in e){const t=e[Jo];t===Wh?this.upgradeIfSecondaryHealthy_():t===$h?(this.log_("Got a reset on secondary, closing it"),this.secondaryConn_.close(),(this.tx_===this.secondaryConn_||this.rx_===this.secondaryConn_)&&this.close()):t===jh&&(this.log_("got pong on secondary."),this.secondaryResponsesRequired_--,this.upgradeIfSecondaryHealthy_())}}onSecondaryMessageReceived_(e){const t=Os("t",e),s=Os("d",e);if(t==="c")this.onSecondaryControl_(s);else if(t==="d")this.pendingDataMessages.push(s);else throw new Error("Unknown protocol layer: "+t)}upgradeIfSecondaryHealthy_(){this.secondaryResponsesRequired_<=0?(this.log_("Secondary connection is healthy."),this.isHealthy_=!0,this.secondaryConn_.markConnectionHealthy(),this.proceedWithUpgrade_()):(this.log_("sending ping on secondary."),this.secondaryConn_.send({t:"c",d:{t:Hh,d:{}}}))}proceedWithUpgrade_(){this.secondaryConn_.start(),this.log_("sending client ack on secondary"),this.secondaryConn_.send({t:"c",d:{t:Wh,d:{}}}),this.log_("Ending transmission on primary"),this.conn_.send({t:"c",d:{t:zh,d:{}}}),this.tx_=this.secondaryConn_,this.tryCleanupConnection()}onPrimaryMessageReceived_(e){const t=Os("t",e),s=Os("d",e);t==="c"?this.onControl_(s):t==="d"&&this.onDataMessage_(s)}onDataMessage_(e){this.onPrimaryResponse_(),this.onMessage_(e)}onPrimaryResponse_(){this.isHealthy_||(this.primaryResponsesRequired_--,this.primaryResponsesRequired_<=0&&(this.log_("Primary connection is healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()))}onControl_(e){const t=Os(Jo,e);if(qh in e){const s=e[qh];if(t===Gw){const r={...s};this.repoInfo_.isUsingEmulator&&(r.h=this.repoInfo_.host),this.onHandshake_(r)}else if(t===zh){this.log_("recvd end transmission on primary"),this.rx_=this.secondaryConn_;for(let r=0;r<this.pendingDataMessages.length;++r)this.onDataMessage_(this.pendingDataMessages[r]);this.pendingDataMessages=[],this.tryCleanupConnection()}else t===zw?this.onConnectionShutdown_(s):t===$h?this.onReset_(s):t===Hw?ka("Server Error: "+s):t===jh?(this.log_("got pong on primary."),this.onPrimaryResponse_(),this.sendPingOnPrimaryIfNecessary_()):ka("Unknown control packet command: "+t)}}onHandshake_(e){const t=e.ts,s=e.v,r=e.h;this.sessionId=e.s,this.repoInfo_.host=r,this.state_===0&&(this.conn_.start(),this.onConnectionEstablished_(this.conn_,t),Kc!==s&&Qe("Protocol version mismatch detected"),this.tryStartUpgrade_())}tryStartUpgrade_(){const e=this.transportManager_.upgradeTransport();e&&this.startUpgrade_(e)}startUpgrade_(e){this.secondaryConn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,this.sessionId),this.secondaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.secondaryConn_),s=this.disconnReceiver_(this.secondaryConn_);this.secondaryConn_.open(t,s),Qs(()=>{this.secondaryConn_&&(this.log_("Timed out trying to upgrade."),this.secondaryConn_.close())},Math.floor(qw))}onReset_(e){this.log_("Reset packet received.  New host: "+e),this.repoInfo_.host=e,this.state_===1?this.close():(this.closeConnections_(),this.start_())}onConnectionEstablished_(e,t){this.log_("Realtime connection established."),this.conn_=e,this.state_=1,this.onReady_&&(this.onReady_(t,this.sessionId),this.onReady_=null),this.primaryResponsesRequired_===0?(this.log_("Primary connection is healthy."),this.isHealthy_=!0):Qs(()=>{this.sendPingOnPrimaryIfNecessary_()},Math.floor($w))}sendPingOnPrimaryIfNecessary_(){!this.isHealthy_&&this.state_===1&&(this.log_("sending ping on primary."),this.sendData_({t:"c",d:{t:Hh,d:{}}}))}onSecondaryConnectionLost_(){const e=this.secondaryConn_;this.secondaryConn_=null,(this.tx_===e||this.rx_===e)&&this.close()}onConnectionLost_(e){this.conn_=null,!e&&this.state_===0?(this.log_("Realtime connection failed."),this.repoInfo_.isCacheableHost()&&(_n.remove("host:"+this.repoInfo_.host),this.repoInfo_.internalHost=this.repoInfo_.host)):this.state_===1&&this.log_("Realtime connection lost."),this.close()}onConnectionShutdown_(e){this.log_("Connection shutdown command received. Shutting down..."),this.onKill_&&(this.onKill_(e),this.onKill_=null),this.onDisconnect_=null,this.close()}sendData_(e){if(this.state_!==1)throw"Connection is not connected";this.tx_.send(e)}close(){this.state_!==2&&(this.log_("Closing realtime connection."),this.state_=2,this.closeConnections_(),this.onDisconnect_&&(this.onDisconnect_(),this.onDisconnect_=null))}closeConnections_(){this.log_("Shutting down all connections"),this.conn_&&(this.conn_.close(),this.conn_=null),this.secondaryConn_&&(this.secondaryConn_.close(),this.secondaryConn_=null),this.healthyTimeout_&&(clearTimeout(this.healthyTimeout_),this.healthyTimeout_=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class e_{put(e,t,s,r){}merge(e,t,s,r){}refreshAuthToken(e){}refreshAppCheckToken(e){}onDisconnectPut(e,t,s){}onDisconnectMerge(e,t,s){}onDisconnectCancel(e,t){}reportStats(e){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class t_{constructor(e){this.allowedEvents_=e,this.listeners_={},O(Array.isArray(e)&&e.length>0,"Requires a non-empty array")}trigger(e,...t){if(Array.isArray(this.listeners_[e])){const s=[...this.listeners_[e]];for(let r=0;r<s.length;r++)s[r].callback.apply(s[r].context,t)}}on(e,t,s){this.validateEventType_(e),this.listeners_[e]=this.listeners_[e]||[],this.listeners_[e].push({callback:t,context:s});const r=this.getInitialEvent(e);r&&t.apply(s,r)}off(e,t,s){this.validateEventType_(e);const r=this.listeners_[e]||[];for(let i=0;i<r.length;i++)if(r[i].callback===t&&(!s||s===r[i].context)){r.splice(i,1);return}}validateEventType_(e){O(this.allowedEvents_.find(t=>t===e),"Unknown event: "+e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ci extends t_{static getInstance(){return new Ci}constructor(){super(["online"]),this.online_=!0,typeof window<"u"&&typeof window.addEventListener<"u"&&!Xa()&&(window.addEventListener("online",()=>{this.online_||(this.online_=!0,this.trigger("online",!0))},!1),window.addEventListener("offline",()=>{this.online_&&(this.online_=!1,this.trigger("online",!1))},!1))}getInitialEvent(e){return O(e==="online","Unknown event type: "+e),[this.online_]}currentlyOnline(){return this.online_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gh=32,Kh=768;class re{constructor(e,t){if(t===void 0){this.pieces_=e.split("/");let s=0;for(let r=0;r<this.pieces_.length;r++)this.pieces_[r].length>0&&(this.pieces_[s]=this.pieces_[r],s++);this.pieces_.length=s,this.pieceNum_=0}else this.pieces_=e,this.pieceNum_=t}toString(){let e="";for(let t=this.pieceNum_;t<this.pieces_.length;t++)this.pieces_[t]!==""&&(e+="/"+this.pieces_[t]);return e||"/"}}function te(){return new re("")}function z(n){return n.pieceNum_>=n.pieces_.length?null:n.pieces_[n.pieceNum_]}function nn(n){return n.pieces_.length-n.pieceNum_}function ie(n){let e=n.pieceNum_;return e<n.pieces_.length&&e++,new re(n.pieces_,e)}function Xc(n){return n.pieceNum_<n.pieces_.length?n.pieces_[n.pieces_.length-1]:null}function Qw(n){let e="";for(let t=n.pieceNum_;t<n.pieces_.length;t++)n.pieces_[t]!==""&&(e+="/"+encodeURIComponent(String(n.pieces_[t])));return e||"/"}function hr(n,e=0){return n.pieces_.slice(n.pieceNum_+e)}function n_(n){if(n.pieceNum_>=n.pieces_.length)return null;const e=[];for(let t=n.pieceNum_;t<n.pieces_.length-1;t++)e.push(n.pieces_[t]);return new re(e,0)}function me(n,e){const t=[];for(let s=n.pieceNum_;s<n.pieces_.length;s++)t.push(n.pieces_[s]);if(e instanceof re)for(let s=e.pieceNum_;s<e.pieces_.length;s++)t.push(e.pieces_[s]);else{const s=e.split("/");for(let r=0;r<s.length;r++)s[r].length>0&&t.push(s[r])}return new re(t,0)}function G(n){return n.pieceNum_>=n.pieces_.length}function tt(n,e){const t=z(n),s=z(e);if(t===null)return e;if(t===s)return tt(ie(n),ie(e));throw new Error("INTERNAL ERROR: innerPath ("+e+") is not within outerPath ("+n+")")}function Yw(n,e){const t=hr(n,0),s=hr(e,0);for(let r=0;r<t.length&&r<s.length;r++){const i=Nn(t[r],s[r]);if(i!==0)return i}return t.length===s.length?0:t.length<s.length?-1:1}function s_(n,e){if(nn(n)!==nn(e))return!1;for(let t=n.pieceNum_,s=e.pieceNum_;t<=n.pieces_.length;t++,s++)if(n.pieces_[t]!==e.pieces_[s])return!1;return!0}function nt(n,e){let t=n.pieceNum_,s=e.pieceNum_;if(nn(n)>nn(e))return!1;for(;t<n.pieces_.length;){if(n.pieces_[t]!==e.pieces_[s])return!1;++t,++s}return!0}class Xw{constructor(e,t){this.errorPrefix_=t,this.parts_=hr(e,0),this.byteLength_=Math.max(1,this.parts_.length);for(let s=0;s<this.parts_.length;s++)this.byteLength_+=xi(this.parts_[s]);r_(this)}}function Jw(n,e){n.parts_.length>0&&(n.byteLength_+=1),n.parts_.push(e),n.byteLength_+=xi(e),r_(n)}function Zw(n){const e=n.parts_.pop();n.byteLength_-=xi(e),n.parts_.length>0&&(n.byteLength_-=1)}function r_(n){if(n.byteLength_>Kh)throw new Error(n.errorPrefix_+"has a key path longer than "+Kh+" bytes ("+n.byteLength_+").");if(n.parts_.length>Gh)throw new Error(n.errorPrefix_+"path specified exceeds the maximum depth that can be written ("+Gh+") or object contains a cycle "+fn(n))}function fn(n){return n.parts_.length===0?"":"in property '"+n.parts_.join(".")+"'"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jc extends t_{static getInstance(){return new Jc}constructor(){super(["visible"]);let e,t;typeof document<"u"&&typeof document.addEventListener<"u"&&(typeof document.hidden<"u"?(t="visibilitychange",e="hidden"):typeof document.mozHidden<"u"?(t="mozvisibilitychange",e="mozHidden"):typeof document.msHidden<"u"?(t="msvisibilitychange",e="msHidden"):typeof document.webkitHidden<"u"&&(t="webkitvisibilitychange",e="webkitHidden")),this.visible_=!0,t&&document.addEventListener(t,()=>{const s=!document[e];s!==this.visible_&&(this.visible_=s,this.trigger("visible",s))},!1)}getInitialEvent(e){return O(e==="visible","Unknown event type: "+e),[this.visible_]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vs=1e3,eA=300*1e3,Qh=30*1e3,tA=1.3,nA=3e4,sA="server_kill",Yh=3;class St extends e_{constructor(e,t,s,r,i,o,c,l){if(super(),this.repoInfo_=e,this.applicationId_=t,this.onDataUpdate_=s,this.onConnectStatus_=r,this.onServerInfoUpdate_=i,this.authTokenProvider_=o,this.appCheckTokenProvider_=c,this.authOverride_=l,this.id=St.nextPersistentConnectionId_++,this.log_=wr("p:"+this.id+":"),this.interruptReasons_={},this.listens=new Map,this.outstandingPuts_=[],this.outstandingGets_=[],this.outstandingPutCount_=0,this.outstandingGetCount_=0,this.onDisconnectRequestQueue_=[],this.connected_=!1,this.reconnectDelay_=Vs,this.maxReconnectDelay_=eA,this.securityDebugCallback_=null,this.lastSessionId=null,this.establishConnectionTimer_=null,this.visible_=!1,this.requestCBHash_={},this.requestNumber_=0,this.realtime_=null,this.authToken_=null,this.appCheckToken_=null,this.forceTokenRefresh_=!1,this.invalidAuthTokenCount_=0,this.invalidAppCheckTokenCount_=0,this.firstConnection_=!0,this.lastConnectionAttemptTime_=null,this.lastConnectionEstablishedTime_=null,l)throw new Error("Auth override specified in options, but not supported on non Node.js platforms");Jc.getInstance().on("visible",this.onVisible_,this),e.host.indexOf("fblocal")===-1&&Ci.getInstance().on("online",this.onOnline_,this)}sendRequest(e,t,s){const r=++this.requestNumber_,i={r,a:e,b:t};this.log_(Ne(i)),O(this.connected_,"sendRequest call when we're not connected not allowed."),this.realtime_.sendRequest(i),s&&(this.requestCBHash_[r]=s)}get(e){this.initConnection_();const t=new Ct,r={action:"g",request:{p:e._path.toString(),q:e._queryObject},onComplete:o=>{const c=o.d;o.s==="ok"?t.resolve(c):t.reject(c)}};this.outstandingGets_.push(r),this.outstandingGetCount_++;const i=this.outstandingGets_.length-1;return this.connected_&&this.sendGet_(i),t.promise}listen(e,t,s,r){this.initConnection_();const i=e._queryIdentifier,o=e._path.toString();this.log_("Listen called for "+o+" "+i),this.listens.has(o)||this.listens.set(o,new Map),O(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"listen() called for non-default but complete query"),O(!this.listens.get(o).has(i),"listen() called twice for same path/queryId.");const c={onComplete:r,hashFn:t,query:e,tag:s};this.listens.get(o).set(i,c),this.connected_&&this.sendListen_(c)}sendGet_(e){const t=this.outstandingGets_[e];this.sendRequest("g",t.request,s=>{delete this.outstandingGets_[e],this.outstandingGetCount_--,this.outstandingGetCount_===0&&(this.outstandingGets_=[]),t.onComplete&&t.onComplete(s)})}sendListen_(e){const t=e.query,s=t._path.toString(),r=t._queryIdentifier;this.log_("Listen on "+s+" for "+r);const i={p:s},o="q";e.tag&&(i.q=t._queryObject,i.t=e.tag),i.h=e.hashFn(),this.sendRequest(o,i,c=>{const l=c.d,h=c.s;St.warnOnListenWarnings_(l,t),(this.listens.get(s)&&this.listens.get(s).get(r))===e&&(this.log_("listen response",c),h!=="ok"&&this.removeListen_(s,r),e.onComplete&&e.onComplete(h,l))})}static warnOnListenWarnings_(e,t){if(e&&typeof e=="object"&&wt(e,"w")){const s=Hn(e,"w");if(Array.isArray(s)&&~s.indexOf("no_index")){const r='".indexOn": "'+t._queryParams.getIndex().toString()+'"',i=t._path.toString();Qe(`Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ${r} at ${i} to your security rules for better performance.`)}}}refreshAuthToken(e){this.authToken_=e,this.log_("Auth token refreshed"),this.authToken_?this.tryAuth():this.connected_&&this.sendRequest("unauth",{},()=>{}),this.reduceReconnectDelayIfAdminCredential_(e)}reduceReconnectDelayIfAdminCredential_(e){(e&&e.length===40||ig(e))&&(this.log_("Admin auth credential detected.  Reducing max reconnect time."),this.maxReconnectDelay_=Qh)}refreshAppCheckToken(e){this.appCheckToken_=e,this.log_("App check token refreshed"),this.appCheckToken_?this.tryAppCheck():this.connected_&&this.sendRequest("unappeck",{},()=>{})}tryAuth(){if(this.connected_&&this.authToken_){const e=this.authToken_,t=rg(e)?"auth":"gauth",s={cred:e};this.authOverride_===null?s.noauth=!0:typeof this.authOverride_=="object"&&(s.authvar=this.authOverride_),this.sendRequest(t,s,r=>{const i=r.s,o=r.d||"error";this.authToken_===e&&(i==="ok"?this.invalidAuthTokenCount_=0:this.onAuthRevoked_(i,o))})}}tryAppCheck(){this.connected_&&this.appCheckToken_&&this.sendRequest("appcheck",{token:this.appCheckToken_},e=>{const t=e.s,s=e.d||"error";t==="ok"?this.invalidAppCheckTokenCount_=0:this.onAppCheckRevoked_(t,s)})}unlisten(e,t){const s=e._path.toString(),r=e._queryIdentifier;this.log_("Unlisten called for "+s+" "+r),O(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"unlisten() called for non-default but complete query"),this.removeListen_(s,r)&&this.connected_&&this.sendUnlisten_(s,r,e._queryObject,t)}sendUnlisten_(e,t,s,r){this.log_("Unlisten on "+e+" for "+t);const i={p:e},o="n";r&&(i.q=s,i.t=r),this.sendRequest(o,i)}onDisconnectPut(e,t,s){this.initConnection_(),this.connected_?this.sendOnDisconnect_("o",e,t,s):this.onDisconnectRequestQueue_.push({pathString:e,action:"o",data:t,onComplete:s})}onDisconnectMerge(e,t,s){this.initConnection_(),this.connected_?this.sendOnDisconnect_("om",e,t,s):this.onDisconnectRequestQueue_.push({pathString:e,action:"om",data:t,onComplete:s})}onDisconnectCancel(e,t){this.initConnection_(),this.connected_?this.sendOnDisconnect_("oc",e,null,t):this.onDisconnectRequestQueue_.push({pathString:e,action:"oc",data:null,onComplete:t})}sendOnDisconnect_(e,t,s,r){const i={p:t,d:s};this.log_("onDisconnect "+e,i),this.sendRequest(e,i,o=>{r&&setTimeout(()=>{r(o.s,o.d)},Math.floor(0))})}put(e,t,s,r){this.putInternal("p",e,t,s,r)}merge(e,t,s,r){this.putInternal("m",e,t,s,r)}putInternal(e,t,s,r,i){this.initConnection_();const o={p:t,d:s};i!==void 0&&(o.h=i),this.outstandingPuts_.push({action:e,request:o,onComplete:r}),this.outstandingPutCount_++;const c=this.outstandingPuts_.length-1;this.connected_?this.sendPut_(c):this.log_("Buffering put: "+t)}sendPut_(e){const t=this.outstandingPuts_[e].action,s=this.outstandingPuts_[e].request,r=this.outstandingPuts_[e].onComplete;this.outstandingPuts_[e].queued=this.connected_,this.sendRequest(t,s,i=>{this.log_(t+" response",i),delete this.outstandingPuts_[e],this.outstandingPutCount_--,this.outstandingPutCount_===0&&(this.outstandingPuts_=[]),r&&r(i.s,i.d)})}reportStats(e){if(this.connected_){const t={c:e};this.log_("reportStats",t),this.sendRequest("s",t,s=>{if(s.s!=="ok"){const i=s.d;this.log_("reportStats","Error sending stats: "+i)}})}}onDataMessage_(e){if("r"in e){this.log_("from server: "+Ne(e));const t=e.r,s=this.requestCBHash_[t];s&&(delete this.requestCBHash_[t],s(e.b))}else{if("error"in e)throw"A server-side error has occurred: "+e.error;"a"in e&&this.onDataPush_(e.a,e.b)}}onDataPush_(e,t){this.log_("handleServerMessage",e,t),e==="d"?this.onDataUpdate_(t.p,t.d,!1,t.t):e==="m"?this.onDataUpdate_(t.p,t.d,!0,t.t):e==="c"?this.onListenRevoked_(t.p,t.q):e==="ac"?this.onAuthRevoked_(t.s,t.d):e==="apc"?this.onAppCheckRevoked_(t.s,t.d):e==="sd"?this.onSecurityDebugPacket_(t):ka("Unrecognized action received from server: "+Ne(e)+`
Are you using the latest client?`)}onReady_(e,t){this.log_("connection ready"),this.connected_=!0,this.lastConnectionEstablishedTime_=new Date().getTime(),this.handleTimestamp_(e),this.lastSessionId=t,this.firstConnection_&&this.sendConnectStats_(),this.restoreState_(),this.firstConnection_=!1,this.onConnectStatus_(!0)}scheduleConnect_(e){O(!this.realtime_,"Scheduling a connect when we're already connected/ing?"),this.establishConnectionTimer_&&clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=setTimeout(()=>{this.establishConnectionTimer_=null,this.establishConnection_()},Math.floor(e))}initConnection_(){!this.realtime_&&this.firstConnection_&&this.scheduleConnect_(0)}onVisible_(e){e&&!this.visible_&&this.reconnectDelay_===this.maxReconnectDelay_&&(this.log_("Window became visible.  Reducing delay."),this.reconnectDelay_=Vs,this.realtime_||this.scheduleConnect_(0)),this.visible_=e}onOnline_(e){e?(this.log_("Browser went online."),this.reconnectDelay_=Vs,this.realtime_||this.scheduleConnect_(0)):(this.log_("Browser went offline.  Killing connection."),this.realtime_&&this.realtime_.close())}onRealtimeDisconnect_(){if(this.log_("data client disconnected"),this.connected_=!1,this.realtime_=null,this.cancelSentTransactions_(),this.requestCBHash_={},this.shouldReconnect_()){this.visible_?this.lastConnectionEstablishedTime_&&(new Date().getTime()-this.lastConnectionEstablishedTime_>nA&&(this.reconnectDelay_=Vs),this.lastConnectionEstablishedTime_=null):(this.log_("Window isn't visible.  Delaying reconnect."),this.reconnectDelay_=this.maxReconnectDelay_,this.lastConnectionAttemptTime_=new Date().getTime());const e=Math.max(0,new Date().getTime()-this.lastConnectionAttemptTime_);let t=Math.max(0,this.reconnectDelay_-e);t=Math.random()*t,this.log_("Trying to reconnect in "+t+"ms"),this.scheduleConnect_(t),this.reconnectDelay_=Math.min(this.maxReconnectDelay_,this.reconnectDelay_*tA)}this.onConnectStatus_(!1)}async establishConnection_(){if(this.shouldReconnect_()){this.log_("Making a connection attempt"),this.lastConnectionAttemptTime_=new Date().getTime(),this.lastConnectionEstablishedTime_=null;const e=this.onDataMessage_.bind(this),t=this.onReady_.bind(this),s=this.onRealtimeDisconnect_.bind(this),r=this.id+":"+St.nextConnectionId_++,i=this.lastSessionId;let o=!1,c=null;const l=function(){c?c.close():(o=!0,s())},h=function(p){O(c,"sendRequest call when we're not connected not allowed."),c.sendRequest(p)};this.realtime_={close:l,sendRequest:h};const f=this.forceTokenRefresh_;this.forceTokenRefresh_=!1;try{const[p,m]=await Promise.all([this.authTokenProvider_.getToken(f),this.appCheckTokenProvider_.getToken(f)]);o?Pe("getToken() completed but was canceled"):(Pe("getToken() completed. Creating connection."),this.authToken_=p&&p.accessToken,this.appCheckToken_=m&&m.token,c=new Kw(r,this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,e,t,s,w=>{Qe(w+" ("+this.repoInfo_.toString()+")"),this.interrupt(sA)},i))}catch(p){this.log_("Failed to get token: "+p),o||(this.repoInfo_.nodeAdmin&&Qe(p),l())}}}interrupt(e){Pe("Interrupting connection for reason: "+e),this.interruptReasons_[e]=!0,this.realtime_?this.realtime_.close():(this.establishConnectionTimer_&&(clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=null),this.connected_&&this.onRealtimeDisconnect_())}resume(e){Pe("Resuming connection for reason: "+e),delete this.interruptReasons_[e],ia(this.interruptReasons_)&&(this.reconnectDelay_=Vs,this.realtime_||this.scheduleConnect_(0))}handleTimestamp_(e){const t=e-new Date().getTime();this.onServerInfoUpdate_({serverTimeOffset:t})}cancelSentTransactions_(){for(let e=0;e<this.outstandingPuts_.length;e++){const t=this.outstandingPuts_[e];t&&"h"in t.request&&t.queued&&(t.onComplete&&t.onComplete("disconnect"),delete this.outstandingPuts_[e],this.outstandingPutCount_--)}this.outstandingPutCount_===0&&(this.outstandingPuts_=[])}onListenRevoked_(e,t){let s;t?s=t.map(i=>Gc(i)).join("$"):s="default";const r=this.removeListen_(e,s);r&&r.onComplete&&r.onComplete("permission_denied")}removeListen_(e,t){const s=new re(e).toString();let r;if(this.listens.has(s)){const i=this.listens.get(s);r=i.get(t),i.delete(t),i.size===0&&this.listens.delete(s)}else r=void 0;return r}onAuthRevoked_(e,t){Pe("Auth token revoked: "+e+"/"+t),this.authToken_=null,this.forceTokenRefresh_=!0,this.realtime_.close(),(e==="invalid_token"||e==="permission_denied")&&(this.invalidAuthTokenCount_++,this.invalidAuthTokenCount_>=Yh&&(this.reconnectDelay_=Qh,this.authTokenProvider_.notifyForInvalidToken()))}onAppCheckRevoked_(e,t){Pe("App check token revoked: "+e+"/"+t),this.appCheckToken_=null,this.forceTokenRefresh_=!0,(e==="invalid_token"||e==="permission_denied")&&(this.invalidAppCheckTokenCount_++,this.invalidAppCheckTokenCount_>=Yh&&this.appCheckTokenProvider_.notifyForInvalidToken())}onSecurityDebugPacket_(e){this.securityDebugCallback_?this.securityDebugCallback_(e):"msg"in e&&console.log("FIREBASE: "+e.msg.replace(`
`,`
FIREBASE: `))}restoreState_(){this.tryAuth(),this.tryAppCheck();for(const e of this.listens.values())for(const t of e.values())this.sendListen_(t);for(let e=0;e<this.outstandingPuts_.length;e++)this.outstandingPuts_[e]&&this.sendPut_(e);for(;this.onDisconnectRequestQueue_.length;){const e=this.onDisconnectRequestQueue_.shift();this.sendOnDisconnect_(e.action,e.pathString,e.data,e.onComplete)}for(let e=0;e<this.outstandingGets_.length;e++)this.outstandingGets_[e]&&this.sendGet_(e)}sendConnectStats_(){const e={};let t="js";e["sdk."+t+"."+Vp.replace(/\./g,"-")]=1,Xa()?e["framework.cordova"]=1:Dd()&&(e["framework.reactnative"]=1),this.reportStats(e)}shouldReconnect_(){const e=Ci.getInstance().currentlyOnline();return ia(this.interruptReasons_)&&e}}St.nextPersistentConnectionId_=0;St.nextConnectionId_=0;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class X{constructor(e,t){this.name=e,this.node=t}static Wrap(e,t){return new X(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ao{getCompare(){return this.compare.bind(this)}indexedValueChanged(e,t){const s=new X(ts,e),r=new X(ts,t);return this.compare(s,r)!==0}minPost(){return X.MIN}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Qr;class i_ extends ao{static get __EMPTY_NODE(){return Qr}static set __EMPTY_NODE(e){Qr=e}compare(e,t){return Nn(e.name,t.name)}isDefinedOn(e){throw rs("KeyIndex.isDefinedOn not expected to be called.")}indexedValueChanged(e,t){return!1}minPost(){return X.MIN}maxPost(){return new X(Cn,Qr)}makePost(e,t){return O(typeof e=="string","KeyIndex indexValue must always be a string."),new X(e,Qr)}toString(){return".key"}}const jn=new i_;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yr{constructor(e,t,s,r,i=null){this.isReverse_=r,this.resultGenerator_=i,this.nodeStack_=[];let o=1;for(;!e.isEmpty();)if(e=e,o=t?s(e.key,t):1,r&&(o*=-1),o<0)this.isReverse_?e=e.left:e=e.right;else if(o===0){this.nodeStack_.push(e);break}else this.nodeStack_.push(e),this.isReverse_?e=e.right:e=e.left}getNext(){if(this.nodeStack_.length===0)return null;let e=this.nodeStack_.pop(),t;if(this.resultGenerator_?t=this.resultGenerator_(e.key,e.value):t={key:e.key,value:e.value},this.isReverse_)for(e=e.left;!e.isEmpty();)this.nodeStack_.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack_.push(e),e=e.left;return t}hasNext(){return this.nodeStack_.length>0}peek(){if(this.nodeStack_.length===0)return null;const e=this.nodeStack_[this.nodeStack_.length-1];return this.resultGenerator_?this.resultGenerator_(e.key,e.value):{key:e.key,value:e.value}}}class be{constructor(e,t,s,r,i){this.key=e,this.value=t,this.color=s??be.RED,this.left=r??Ge.EMPTY_NODE,this.right=i??Ge.EMPTY_NODE}copy(e,t,s,r,i){return new be(e??this.key,t??this.value,s??this.color,r??this.left,i??this.right)}count(){return this.left.count()+1+this.right.count()}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||!!e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min_(){return this.left.isEmpty()?this:this.left.min_()}minKey(){return this.min_().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,s){let r=this;const i=s(e,r.key);return i<0?r=r.copy(null,null,null,r.left.insert(e,t,s),null):i===0?r=r.copy(null,t,null,null,null):r=r.copy(null,null,null,null,r.right.insert(e,t,s)),r.fixUp_()}removeMin_(){if(this.left.isEmpty())return Ge.EMPTY_NODE;let e=this;return!e.left.isRed_()&&!e.left.left.isRed_()&&(e=e.moveRedLeft_()),e=e.copy(null,null,null,e.left.removeMin_(),null),e.fixUp_()}remove(e,t){let s,r;if(s=this,t(e,s.key)<0)!s.left.isEmpty()&&!s.left.isRed_()&&!s.left.left.isRed_()&&(s=s.moveRedLeft_()),s=s.copy(null,null,null,s.left.remove(e,t),null);else{if(s.left.isRed_()&&(s=s.rotateRight_()),!s.right.isEmpty()&&!s.right.isRed_()&&!s.right.left.isRed_()&&(s=s.moveRedRight_()),t(e,s.key)===0){if(s.right.isEmpty())return Ge.EMPTY_NODE;r=s.right.min_(),s=s.copy(r.key,r.value,null,null,s.right.removeMin_())}s=s.copy(null,null,null,null,s.right.remove(e,t))}return s.fixUp_()}isRed_(){return this.color}fixUp_(){let e=this;return e.right.isRed_()&&!e.left.isRed_()&&(e=e.rotateLeft_()),e.left.isRed_()&&e.left.left.isRed_()&&(e=e.rotateRight_()),e.left.isRed_()&&e.right.isRed_()&&(e=e.colorFlip_()),e}moveRedLeft_(){let e=this.colorFlip_();return e.right.left.isRed_()&&(e=e.copy(null,null,null,null,e.right.rotateRight_()),e=e.rotateLeft_(),e=e.colorFlip_()),e}moveRedRight_(){let e=this.colorFlip_();return e.left.left.isRed_()&&(e=e.rotateRight_(),e=e.colorFlip_()),e}rotateLeft_(){const e=this.copy(null,null,be.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight_(){const e=this.copy(null,null,be.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip_(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth_(){const e=this.check_();return Math.pow(2,e)<=this.count()+1}check_(){if(this.isRed_()&&this.left.isRed_())throw new Error("Red node has red child("+this.key+","+this.value+")");if(this.right.isRed_())throw new Error("Right child of ("+this.key+","+this.value+") is red");const e=this.left.check_();if(e!==this.right.check_())throw new Error("Black depths differ");return e+(this.isRed_()?0:1)}}be.RED=!0;be.BLACK=!1;class rA{copy(e,t,s,r,i){return this}insert(e,t,s){return new be(e,t,null)}remove(e,t){return this}count(){return 0}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}check_(){return 0}isRed_(){return!1}}class Ge{constructor(e,t=Ge.EMPTY_NODE){this.comparator_=e,this.root_=t}insert(e,t){return new Ge(this.comparator_,this.root_.insert(e,t,this.comparator_).copy(null,null,be.BLACK,null,null))}remove(e){return new Ge(this.comparator_,this.root_.remove(e,this.comparator_).copy(null,null,be.BLACK,null,null))}get(e){let t,s=this.root_;for(;!s.isEmpty();){if(t=this.comparator_(e,s.key),t===0)return s.value;t<0?s=s.left:t>0&&(s=s.right)}return null}getPredecessorKey(e){let t,s=this.root_,r=null;for(;!s.isEmpty();)if(t=this.comparator_(e,s.key),t===0){if(s.left.isEmpty())return r?r.key:null;for(s=s.left;!s.right.isEmpty();)s=s.right;return s.key}else t<0?s=s.left:t>0&&(r=s,s=s.right);throw new Error("Attempted to find predecessor key for a nonexistent key.  What gives?")}isEmpty(){return this.root_.isEmpty()}count(){return this.root_.count()}minKey(){return this.root_.minKey()}maxKey(){return this.root_.maxKey()}inorderTraversal(e){return this.root_.inorderTraversal(e)}reverseTraversal(e){return this.root_.reverseTraversal(e)}getIterator(e){return new Yr(this.root_,null,this.comparator_,!1,e)}getIteratorFrom(e,t){return new Yr(this.root_,e,this.comparator_,!1,t)}getReverseIteratorFrom(e,t){return new Yr(this.root_,e,this.comparator_,!0,t)}getReverseIterator(e){return new Yr(this.root_,null,this.comparator_,!0,e)}}Ge.EMPTY_NODE=new rA;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function iA(n,e){return Nn(n.name,e.name)}function Zc(n,e){return Nn(n,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Oa;function oA(n){Oa=n}const o_=function(n){return typeof n=="number"?"number:"+Fp(n):"string:"+n},a_=function(n){if(n.isLeafNode()){const e=n.val();O(typeof e=="string"||typeof e=="number"||typeof e=="object"&&wt(e,".sv"),"Priority must be a string or number.")}else O(n===Oa||n.isEmpty(),"priority of unexpected type.");O(n===Oa||n.getPriority().isEmpty(),"Priority nodes can't have a priority of their own.")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Xh;class Re{static set __childrenNodeConstructor(e){Xh=e}static get __childrenNodeConstructor(){return Xh}constructor(e,t=Re.__childrenNodeConstructor.EMPTY_NODE){this.value_=e,this.priorityNode_=t,this.lazyHash_=null,O(this.value_!==void 0&&this.value_!==null,"LeafNode shouldn't be created with null/undefined value."),a_(this.priorityNode_)}isLeafNode(){return!0}getPriority(){return this.priorityNode_}updatePriority(e){return new Re(this.value_,e)}getImmediateChild(e){return e===".priority"?this.priorityNode_:Re.__childrenNodeConstructor.EMPTY_NODE}getChild(e){return G(e)?this:z(e)===".priority"?this.priorityNode_:Re.__childrenNodeConstructor.EMPTY_NODE}hasChild(){return!1}getPredecessorChildName(e,t){return null}updateImmediateChild(e,t){return e===".priority"?this.updatePriority(t):t.isEmpty()&&e!==".priority"?this:Re.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(e,t).updatePriority(this.priorityNode_)}updateChild(e,t){const s=z(e);return s===null?t:t.isEmpty()&&s!==".priority"?this:(O(s!==".priority"||nn(e)===1,".priority must be the last token in a path"),this.updateImmediateChild(s,Re.__childrenNodeConstructor.EMPTY_NODE.updateChild(ie(e),t)))}isEmpty(){return!1}numChildren(){return 0}forEachChild(e,t){return!1}val(e){return e&&!this.getPriority().isEmpty()?{".value":this.getValue(),".priority":this.getPriority().val()}:this.getValue()}hash(){if(this.lazyHash_===null){let e="";this.priorityNode_.isEmpty()||(e+="priority:"+o_(this.priorityNode_.val())+":");const t=typeof this.value_;e+=t+":",t==="number"?e+=Fp(this.value_):e+=this.value_,this.lazyHash_=Lp(e)}return this.lazyHash_}getValue(){return this.value_}compareTo(e){return e===Re.__childrenNodeConstructor.EMPTY_NODE?1:e instanceof Re.__childrenNodeConstructor?-1:(O(e.isLeafNode(),"Unknown node type"),this.compareToLeafNode_(e))}compareToLeafNode_(e){const t=typeof e.value_,s=typeof this.value_,r=Re.VALUE_TYPE_ORDER.indexOf(t),i=Re.VALUE_TYPE_ORDER.indexOf(s);return O(r>=0,"Unknown leaf type: "+t),O(i>=0,"Unknown leaf type: "+s),r===i?s==="object"?0:this.value_<e.value_?-1:this.value_===e.value_?0:1:i-r}withIndex(){return this}isIndexed(){return!0}equals(e){if(e===this)return!0;if(e.isLeafNode()){const t=e;return this.value_===t.value_&&this.priorityNode_.equals(t.priorityNode_)}else return!1}}Re.VALUE_TYPE_ORDER=["object","boolean","number","string"];/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let c_,l_;function aA(n){c_=n}function cA(n){l_=n}class lA extends ao{compare(e,t){const s=e.node.getPriority(),r=t.node.getPriority(),i=s.compareTo(r);return i===0?Nn(e.name,t.name):i}isDefinedOn(e){return!e.getPriority().isEmpty()}indexedValueChanged(e,t){return!e.getPriority().equals(t.getPriority())}minPost(){return X.MIN}maxPost(){return new X(Cn,new Re("[PRIORITY-POST]",l_))}makePost(e,t){const s=c_(e);return new X(t,new Re("[PRIORITY-POST]",s))}toString(){return".priority"}}const De=new lA;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const uA=Math.log(2);class hA{constructor(e){const t=i=>parseInt(Math.log(i)/uA,10),s=i=>parseInt(Array(i+1).join("1"),2);this.count=t(e+1),this.current_=this.count-1;const r=s(this.count);this.bits_=e+1&r}nextBitIsOne(){const e=!(this.bits_&1<<this.current_);return this.current_--,e}}const Ri=function(n,e,t,s){n.sort(e);const r=function(l,h){const f=h-l;let p,m;if(f===0)return null;if(f===1)return p=n[l],m=t?t(p):p,new be(m,p.node,be.BLACK,null,null);{const w=parseInt(f/2,10)+l,S=r(l,w),k=r(w+1,h);return p=n[w],m=t?t(p):p,new be(m,p.node,be.BLACK,S,k)}},i=function(l){let h=null,f=null,p=n.length;const m=function(S,k){const N=p-S,x=p;p-=S;const U=r(N+1,x),$=n[N],Q=t?t($):$;w(new be(Q,$.node,k,null,U))},w=function(S){h?(h.left=S,h=S):(f=S,h=S)};for(let S=0;S<l.count;++S){const k=l.nextBitIsOne(),N=Math.pow(2,l.count-(S+1));k?m(N,be.BLACK):(m(N,be.BLACK),m(N,be.RED))}return f},o=new hA(n.length),c=i(o);return new Ge(s||e,c)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Zo;const Ln={};class Rt{static get Default(){return O(Ln&&De,"ChildrenNode.ts has not been loaded"),Zo=Zo||new Rt({".priority":Ln},{".priority":De}),Zo}constructor(e,t){this.indexes_=e,this.indexSet_=t}get(e){const t=Hn(this.indexes_,e);if(!t)throw new Error("No index defined for "+e);return t instanceof Ge?t:null}hasIndex(e){return wt(this.indexSet_,e.toString())}addIndex(e,t){O(e!==jn,"KeyIndex always exists and isn't meant to be added to the IndexMap.");const s=[];let r=!1;const i=t.getIterator(X.Wrap);let o=i.getNext();for(;o;)r=r||e.isDefinedOn(o.node),s.push(o),o=i.getNext();let c;r?c=Ri(s,e.getCompare()):c=Ln;const l=e.toString(),h={...this.indexSet_};h[l]=e;const f={...this.indexes_};return f[l]=c,new Rt(f,h)}addToIndexes(e,t){const s=ci(this.indexes_,(r,i)=>{const o=Hn(this.indexSet_,i);if(O(o,"Missing index implementation for "+i),r===Ln)if(o.isDefinedOn(e.node)){const c=[],l=t.getIterator(X.Wrap);let h=l.getNext();for(;h;)h.name!==e.name&&c.push(h),h=l.getNext();return c.push(e),Ri(c,o.getCompare())}else return Ln;else{const c=t.get(e.name);let l=r;return c&&(l=l.remove(new X(e.name,c))),l.insert(e,e.node)}});return new Rt(s,this.indexSet_)}removeFromIndexes(e,t){const s=ci(this.indexes_,r=>{if(r===Ln)return r;{const i=t.get(e.name);return i?r.remove(new X(e.name,i)):r}});return new Rt(s,this.indexSet_)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Ms;class ee{static get EMPTY_NODE(){return Ms||(Ms=new ee(new Ge(Zc),null,Rt.Default))}constructor(e,t,s){this.children_=e,this.priorityNode_=t,this.indexMap_=s,this.lazyHash_=null,this.priorityNode_&&a_(this.priorityNode_),this.children_.isEmpty()&&O(!this.priorityNode_||this.priorityNode_.isEmpty(),"An empty node cannot have a priority")}isLeafNode(){return!1}getPriority(){return this.priorityNode_||Ms}updatePriority(e){return this.children_.isEmpty()?this:new ee(this.children_,e,this.indexMap_)}getImmediateChild(e){if(e===".priority")return this.getPriority();{const t=this.children_.get(e);return t===null?Ms:t}}getChild(e){const t=z(e);return t===null?this:this.getImmediateChild(t).getChild(ie(e))}hasChild(e){return this.children_.get(e)!==null}updateImmediateChild(e,t){if(O(t,"We should always be passing snapshot nodes"),e===".priority")return this.updatePriority(t);{const s=new X(e,t);let r,i;t.isEmpty()?(r=this.children_.remove(e),i=this.indexMap_.removeFromIndexes(s,this.children_)):(r=this.children_.insert(e,t),i=this.indexMap_.addToIndexes(s,this.children_));const o=r.isEmpty()?Ms:this.priorityNode_;return new ee(r,o,i)}}updateChild(e,t){const s=z(e);if(s===null)return t;{O(z(e)!==".priority"||nn(e)===1,".priority must be the last token in a path");const r=this.getImmediateChild(s).updateChild(ie(e),t);return this.updateImmediateChild(s,r)}}isEmpty(){return this.children_.isEmpty()}numChildren(){return this.children_.count()}val(e){if(this.isEmpty())return null;const t={};let s=0,r=0,i=!0;if(this.forEachChild(De,(o,c)=>{t[o]=c.val(e),s++,i&&ee.INTEGER_REGEXP_.test(o)?r=Math.max(r,Number(o)):i=!1}),!e&&i&&r<2*s){const o=[];for(const c in t)o[c]=t[c];return o}else return e&&!this.getPriority().isEmpty()&&(t[".priority"]=this.getPriority().val()),t}hash(){if(this.lazyHash_===null){let e="";this.getPriority().isEmpty()||(e+="priority:"+o_(this.getPriority().val())+":"),this.forEachChild(De,(t,s)=>{const r=s.hash();r!==""&&(e+=":"+t+":"+r)}),this.lazyHash_=e===""?"":Lp(e)}return this.lazyHash_}getPredecessorChildName(e,t,s){const r=this.resolveIndex_(s);if(r){const i=r.getPredecessorKey(new X(e,t));return i?i.name:null}else return this.children_.getPredecessorKey(e)}getFirstChildName(e){const t=this.resolveIndex_(e);if(t){const s=t.minKey();return s&&s.name}else return this.children_.minKey()}getFirstChild(e){const t=this.getFirstChildName(e);return t?new X(t,this.children_.get(t)):null}getLastChildName(e){const t=this.resolveIndex_(e);if(t){const s=t.maxKey();return s&&s.name}else return this.children_.maxKey()}getLastChild(e){const t=this.getLastChildName(e);return t?new X(t,this.children_.get(t)):null}forEachChild(e,t){const s=this.resolveIndex_(e);return s?s.inorderTraversal(r=>t(r.name,r.node)):this.children_.inorderTraversal(t)}getIterator(e){return this.getIteratorFrom(e.minPost(),e)}getIteratorFrom(e,t){const s=this.resolveIndex_(t);if(s)return s.getIteratorFrom(e,r=>r);{const r=this.children_.getIteratorFrom(e.name,X.Wrap);let i=r.peek();for(;i!=null&&t.compare(i,e)<0;)r.getNext(),i=r.peek();return r}}getReverseIterator(e){return this.getReverseIteratorFrom(e.maxPost(),e)}getReverseIteratorFrom(e,t){const s=this.resolveIndex_(t);if(s)return s.getReverseIteratorFrom(e,r=>r);{const r=this.children_.getReverseIteratorFrom(e.name,X.Wrap);let i=r.peek();for(;i!=null&&t.compare(i,e)>0;)r.getNext(),i=r.peek();return r}}compareTo(e){return this.isEmpty()?e.isEmpty()?0:-1:e.isLeafNode()||e.isEmpty()?1:e===Ar?-1:0}withIndex(e){if(e===jn||this.indexMap_.hasIndex(e))return this;{const t=this.indexMap_.addIndex(e,this.children_);return new ee(this.children_,this.priorityNode_,t)}}isIndexed(e){return e===jn||this.indexMap_.hasIndex(e)}equals(e){if(e===this)return!0;if(e.isLeafNode())return!1;{const t=e;if(this.getPriority().equals(t.getPriority()))if(this.children_.count()===t.children_.count()){const s=this.getIterator(De),r=t.getIterator(De);let i=s.getNext(),o=r.getNext();for(;i&&o;){if(i.name!==o.name||!i.node.equals(o.node))return!1;i=s.getNext(),o=r.getNext()}return i===null&&o===null}else return!1;else return!1}}resolveIndex_(e){return e===jn?null:this.indexMap_.get(e.toString())}}ee.INTEGER_REGEXP_=/^(0|[1-9]\d*)$/;class dA extends ee{constructor(){super(new Ge(Zc),ee.EMPTY_NODE,Rt.Default)}compareTo(e){return e===this?0:1}equals(e){return e===this}getPriority(){return this}getImmediateChild(e){return ee.EMPTY_NODE}isEmpty(){return!1}}const Ar=new dA;Object.defineProperties(X,{MIN:{value:new X(ts,ee.EMPTY_NODE)},MAX:{value:new X(Cn,Ar)}});i_.__EMPTY_NODE=ee.EMPTY_NODE;Re.__childrenNodeConstructor=ee;oA(Ar);cA(Ar);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fA=!0;function ye(n,e=null){if(n===null)return ee.EMPTY_NODE;if(typeof n=="object"&&".priority"in n&&(e=n[".priority"]),O(e===null||typeof e=="string"||typeof e=="number"||typeof e=="object"&&".sv"in e,"Invalid priority type found: "+typeof e),typeof n=="object"&&".value"in n&&n[".value"]!==null&&(n=n[".value"]),typeof n!="object"||".sv"in n){const t=n;return new Re(t,ye(e))}if(!(n instanceof Array)&&fA){const t=[];let s=!1;if(Ye(n,(o,c)=>{if(o.substring(0,1)!=="."){const l=ye(c);l.isEmpty()||(s=s||!l.getPriority().isEmpty(),t.push(new X(o,l)))}}),t.length===0)return ee.EMPTY_NODE;const i=Ri(t,iA,o=>o.name,Zc);if(s){const o=Ri(t,De.getCompare());return new ee(i,ye(e),new Rt({".priority":o},{".priority":De}))}else return new ee(i,ye(e),Rt.Default)}else{let t=ee.EMPTY_NODE;return Ye(n,(s,r)=>{if(wt(n,s)&&s.substring(0,1)!=="."){const i=ye(r);(i.isLeafNode()||!i.isEmpty())&&(t=t.updateImmediateChild(s,i))}}),t.updatePriority(ye(e))}}aA(ye);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pA extends ao{constructor(e){super(),this.indexPath_=e,O(!G(e)&&z(e)!==".priority","Can't create PathIndex with empty path or .priority key")}extractChild(e){return e.getChild(this.indexPath_)}isDefinedOn(e){return!e.getChild(this.indexPath_).isEmpty()}compare(e,t){const s=this.extractChild(e.node),r=this.extractChild(t.node),i=s.compareTo(r);return i===0?Nn(e.name,t.name):i}makePost(e,t){const s=ye(e),r=ee.EMPTY_NODE.updateChild(this.indexPath_,s);return new X(t,r)}maxPost(){const e=ee.EMPTY_NODE.updateChild(this.indexPath_,Ar);return new X(Cn,e)}toString(){return hr(this.indexPath_,0).join("/")}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _A extends ao{compare(e,t){const s=e.node.compareTo(t.node);return s===0?Nn(e.name,t.name):s}isDefinedOn(e){return!0}indexedValueChanged(e,t){return!e.equals(t)}minPost(){return X.MIN}maxPost(){return X.MAX}makePost(e,t){const s=ye(e);return new X(t,s)}toString(){return".value"}}const mA=new _A;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gA(n){return{type:"value",snapshotNode:n}}function yA(n,e){return{type:"child_added",snapshotNode:e,childName:n}}function EA(n,e){return{type:"child_removed",snapshotNode:e,childName:n}}function Jh(n,e,t){return{type:"child_changed",snapshotNode:e,childName:n,oldSnap:t}}function TA(n,e){return{type:"child_moved",snapshotNode:e,childName:n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class el{constructor(){this.limitSet_=!1,this.startSet_=!1,this.startNameSet_=!1,this.startAfterSet_=!1,this.endSet_=!1,this.endNameSet_=!1,this.endBeforeSet_=!1,this.limit_=0,this.viewFrom_="",this.indexStartValue_=null,this.indexStartName_="",this.indexEndValue_=null,this.indexEndName_="",this.index_=De}hasStart(){return this.startSet_}isViewFromLeft(){return this.viewFrom_===""?this.startSet_:this.viewFrom_==="l"}getIndexStartValue(){return O(this.startSet_,"Only valid if start has been set"),this.indexStartValue_}getIndexStartName(){return O(this.startSet_,"Only valid if start has been set"),this.startNameSet_?this.indexStartName_:ts}hasEnd(){return this.endSet_}getIndexEndValue(){return O(this.endSet_,"Only valid if end has been set"),this.indexEndValue_}getIndexEndName(){return O(this.endSet_,"Only valid if end has been set"),this.endNameSet_?this.indexEndName_:Cn}hasLimit(){return this.limitSet_}hasAnchoredLimit(){return this.limitSet_&&this.viewFrom_!==""}getLimit(){return O(this.limitSet_,"Only valid if limit has been set"),this.limit_}getIndex(){return this.index_}loadsAllData(){return!(this.startSet_||this.endSet_||this.limitSet_)}isDefault(){return this.loadsAllData()&&this.index_===De}copy(){const e=new el;return e.limitSet_=this.limitSet_,e.limit_=this.limit_,e.startSet_=this.startSet_,e.startAfterSet_=this.startAfterSet_,e.indexStartValue_=this.indexStartValue_,e.startNameSet_=this.startNameSet_,e.indexStartName_=this.indexStartName_,e.endSet_=this.endSet_,e.endBeforeSet_=this.endBeforeSet_,e.indexEndValue_=this.indexEndValue_,e.endNameSet_=this.endNameSet_,e.indexEndName_=this.indexEndName_,e.index_=this.index_,e.viewFrom_=this.viewFrom_,e}}function Zh(n){const e={};if(n.isDefault())return e;let t;if(n.index_===De?t="$priority":n.index_===mA?t="$value":n.index_===jn?t="$key":(O(n.index_ instanceof pA,"Unrecognized index type!"),t=n.index_.toString()),e.orderBy=Ne(t),n.startSet_){const s=n.startAfterSet_?"startAfter":"startAt";e[s]=Ne(n.indexStartValue_),n.startNameSet_&&(e[s]+=","+Ne(n.indexStartName_))}if(n.endSet_){const s=n.endBeforeSet_?"endBefore":"endAt";e[s]=Ne(n.indexEndValue_),n.endNameSet_&&(e[s]+=","+Ne(n.indexEndName_))}return n.limitSet_&&(n.isViewFromLeft()?e.limitToFirst=n.limit_:e.limitToLast=n.limit_),e}function ed(n){const e={};if(n.startSet_&&(e.sp=n.indexStartValue_,n.startNameSet_&&(e.sn=n.indexStartName_),e.sin=!n.startAfterSet_),n.endSet_&&(e.ep=n.indexEndValue_,n.endNameSet_&&(e.en=n.indexEndName_),e.ein=!n.endBeforeSet_),n.limitSet_){e.l=n.limit_;let t=n.viewFrom_;t===""&&(n.isViewFromLeft()?t="l":t="r"),e.vf=t}return n.index_!==De&&(e.i=n.index_.toString()),e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Si extends e_{reportStats(e){throw new Error("Method not implemented.")}static getListenId_(e,t){return t!==void 0?"tag$"+t:(O(e._queryParams.isDefault(),"should have a tag if it's not a default query."),e._path.toString())}constructor(e,t,s,r){super(),this.repoInfo_=e,this.onDataUpdate_=t,this.authTokenProvider_=s,this.appCheckTokenProvider_=r,this.log_=wr("p:rest:"),this.listens_={}}listen(e,t,s,r){const i=e._path.toString();this.log_("Listen called for "+i+" "+e._queryIdentifier);const o=Si.getListenId_(e,s),c={};this.listens_[o]=c;const l=Zh(e._queryParams);this.restRequest_(i+".json",l,(h,f)=>{let p=f;if(h===404&&(p=null,h=null),h===null&&this.onDataUpdate_(i,p,!1,s),Hn(this.listens_,o)===c){let m;h?h===401?m="permission_denied":m="rest_error:"+h:m="ok",r(m,null)}})}unlisten(e,t){const s=Si.getListenId_(e,t);delete this.listens_[s]}get(e){const t=Zh(e._queryParams),s=e._path.toString(),r=new Ct;return this.restRequest_(s+".json",t,(i,o)=>{let c=o;i===404&&(c=null,i=null),i===null?(this.onDataUpdate_(s,c,!1,null),r.resolve(c)):r.reject(new Error(c))}),r.promise}refreshAuthToken(e){}restRequest_(e,t={},s){return t.format="export",Promise.all([this.authTokenProvider_.getToken(!1),this.appCheckTokenProvider_.getToken(!1)]).then(([r,i])=>{r&&r.accessToken&&(t.auth=r.accessToken),i&&i.token&&(t.ac=i.token);const o=(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host+e+"?ns="+this.repoInfo_.namespace+Ja(t);this.log_("Sending REST request for "+o);const c=new XMLHttpRequest;c.onreadystatechange=()=>{if(s&&c.readyState===4){this.log_("REST Response for "+o+" received. status:",c.status,"response:",c.responseText);let l=null;if(c.status>=200&&c.status<300){try{l=er(c.responseText)}catch{Qe("Failed to parse JSON response for "+o+": "+c.responseText)}s(null,l)}else c.status!==401&&c.status!==404&&Qe("Got unsuccessful REST response for "+o+" Status: "+c.status),s(c.status);s=null}},c.open("GET",o,!0),c.send()})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vA{constructor(){this.rootNode_=ee.EMPTY_NODE}getNode(e){return this.rootNode_.getChild(e)}updateSnapshot(e,t){this.rootNode_=this.rootNode_.updateChild(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bi(){return{value:null,children:new Map}}function ps(n,e,t){if(G(e))n.value=t,n.children.clear();else if(n.value!==null)n.value=n.value.updateChild(e,t);else{const s=z(e);n.children.has(s)||n.children.set(s,bi());const r=n.children.get(s);e=ie(e),ps(r,e,t)}}function Va(n,e){if(G(e))return n.value=null,n.children.clear(),!0;if(n.value!==null){if(n.value.isLeafNode())return!1;{const t=n.value;return n.value=null,t.forEachChild(De,(s,r)=>{ps(n,new re(s),r)}),Va(n,e)}}else if(n.children.size>0){const t=z(e);return e=ie(e),n.children.has(t)&&Va(n.children.get(t),e)&&n.children.delete(t),n.children.size===0}else return!0}function Ma(n,e,t){n.value!==null?t(e,n.value):IA(n,(s,r)=>{const i=new re(e.toString()+"/"+s);Ma(r,i,t)})}function IA(n,e){n.children.forEach((t,s)=>{e(s,t)})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wA{constructor(e){this.collection_=e,this.last_=null}get(){const e=this.collection_.get(),t={...e};return this.last_&&Ye(this.last_,(s,r)=>{t[s]=t[s]-r}),this.last_=e,t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const td=10*1e3,AA=30*1e3,CA=300*1e3;class RA{constructor(e,t){this.server_=t,this.statsToReport_={},this.statsListener_=new wA(e);const s=td+(AA-td)*Math.random();Qs(this.reportStats_.bind(this),Math.floor(s))}reportStats_(){const e=this.statsListener_.get(),t={};let s=!1;Ye(e,(r,i)=>{i>0&&wt(this.statsToReport_,r)&&(t[r]=i,s=!0)}),s&&this.server_.reportStats(t),Qs(this.reportStats_.bind(this),Math.floor(Math.random()*2*CA))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ft;(function(n){n[n.OVERWRITE=0]="OVERWRITE",n[n.MERGE=1]="MERGE",n[n.ACK_USER_WRITE=2]="ACK_USER_WRITE",n[n.LISTEN_COMPLETE=3]="LISTEN_COMPLETE"})(ft||(ft={}));function u_(){return{fromUser:!0,fromServer:!1,queryId:null,tagged:!1}}function h_(){return{fromUser:!1,fromServer:!0,queryId:null,tagged:!1}}function d_(n){return{fromUser:!1,fromServer:!0,queryId:n,tagged:!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pi{constructor(e,t,s){this.path=e,this.affectedTree=t,this.revert=s,this.type=ft.ACK_USER_WRITE,this.source=u_()}operationForChild(e){if(G(this.path)){if(this.affectedTree.value!=null)return O(this.affectedTree.children.isEmpty(),"affectedTree should not have overlapping affected paths."),this;{const t=this.affectedTree.subtree(new re(e));return new Pi(te(),t,this.revert)}}else return O(z(this.path)===e,"operationForChild called for unrelated child."),new Pi(ie(this.path),this.affectedTree,this.revert)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rn{constructor(e,t,s){this.source=e,this.path=t,this.snap=s,this.type=ft.OVERWRITE}operationForChild(e){return G(this.path)?new Rn(this.source,te(),this.snap.getImmediateChild(e)):new Rn(this.source,ie(this.path),this.snap)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class dr{constructor(e,t,s){this.source=e,this.path=t,this.children=s,this.type=ft.MERGE}operationForChild(e){if(G(this.path)){const t=this.children.subtree(new re(e));return t.isEmpty()?null:t.value?new Rn(this.source,te(),t.value):new dr(this.source,te(),t)}else return O(z(this.path)===e,"Can't get a merge for a child not on the path of the operation"),new dr(this.source,ie(this.path),this.children)}toString(){return"Operation("+this.path+": "+this.source.toString()+" merge: "+this.children.toString()+")"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tl{constructor(e,t,s){this.node_=e,this.fullyInitialized_=t,this.filtered_=s}isFullyInitialized(){return this.fullyInitialized_}isFiltered(){return this.filtered_}isCompleteForPath(e){if(G(e))return this.isFullyInitialized()&&!this.filtered_;const t=z(e);return this.isCompleteForChild(t)}isCompleteForChild(e){return this.isFullyInitialized()&&!this.filtered_||this.node_.hasChild(e)}getNode(){return this.node_}}function SA(n,e,t,s){const r=[],i=[];return e.forEach(o=>{o.type==="child_changed"&&n.index_.indexedValueChanged(o.oldSnap,o.snapshotNode)&&i.push(TA(o.childName,o.snapshotNode))}),Ls(n,r,"child_removed",e,s,t),Ls(n,r,"child_added",e,s,t),Ls(n,r,"child_moved",i,s,t),Ls(n,r,"child_changed",e,s,t),Ls(n,r,"value",e,s,t),r}function Ls(n,e,t,s,r,i){const o=s.filter(c=>c.type===t);o.sort((c,l)=>PA(n,c,l)),o.forEach(c=>{const l=bA(n,c,i);r.forEach(h=>{h.respondsTo(c.type)&&e.push(h.createEvent(l,n.query_))})})}function bA(n,e,t){return e.type==="value"||e.type==="child_removed"||(e.prevName=t.getPredecessorChildName(e.childName,e.snapshotNode,n.index_)),e}function PA(n,e,t){if(e.childName==null||t.childName==null)throw rs("Should only compare child_ events.");const s=new X(e.childName,e.snapshotNode),r=new X(t.childName,t.snapshotNode);return n.index_.compare(s,r)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function f_(n,e){return{eventCache:n,serverCache:e}}function Ys(n,e,t,s){return f_(new tl(e,t,s),n.serverCache)}function p_(n,e,t,s){return f_(n.eventCache,new tl(e,t,s))}function La(n){return n.eventCache.isFullyInitialized()?n.eventCache.getNode():null}function Sn(n){return n.serverCache.isFullyInitialized()?n.serverCache.getNode():null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ea;const NA=()=>(ea||(ea=new Ge(pw)),ea);class ce{static fromObject(e){let t=new ce(null);return Ye(e,(s,r)=>{t=t.set(new re(s),r)}),t}constructor(e,t=NA()){this.value=e,this.children=t}isEmpty(){return this.value===null&&this.children.isEmpty()}findRootMostMatchingPathAndValue(e,t){if(this.value!=null&&t(this.value))return{path:te(),value:this.value};if(G(e))return null;{const s=z(e),r=this.children.get(s);if(r!==null){const i=r.findRootMostMatchingPathAndValue(ie(e),t);return i!=null?{path:me(new re(s),i.path),value:i.value}:null}else return null}}findRootMostValueAndPath(e){return this.findRootMostMatchingPathAndValue(e,()=>!0)}subtree(e){if(G(e))return this;{const t=z(e),s=this.children.get(t);return s!==null?s.subtree(ie(e)):new ce(null)}}set(e,t){if(G(e))return new ce(t,this.children);{const s=z(e),i=(this.children.get(s)||new ce(null)).set(ie(e),t),o=this.children.insert(s,i);return new ce(this.value,o)}}remove(e){if(G(e))return this.children.isEmpty()?new ce(null):new ce(null,this.children);{const t=z(e),s=this.children.get(t);if(s){const r=s.remove(ie(e));let i;return r.isEmpty()?i=this.children.remove(t):i=this.children.insert(t,r),this.value===null&&i.isEmpty()?new ce(null):new ce(this.value,i)}else return this}}get(e){if(G(e))return this.value;{const t=z(e),s=this.children.get(t);return s?s.get(ie(e)):null}}setTree(e,t){if(G(e))return t;{const s=z(e),i=(this.children.get(s)||new ce(null)).setTree(ie(e),t);let o;return i.isEmpty()?o=this.children.remove(s):o=this.children.insert(s,i),new ce(this.value,o)}}fold(e){return this.fold_(te(),e)}fold_(e,t){const s={};return this.children.inorderTraversal((r,i)=>{s[r]=i.fold_(me(e,r),t)}),t(e,this.value,s)}findOnPath(e,t){return this.findOnPath_(e,te(),t)}findOnPath_(e,t,s){const r=this.value?s(t,this.value):!1;if(r)return r;if(G(e))return null;{const i=z(e),o=this.children.get(i);return o?o.findOnPath_(ie(e),me(t,i),s):null}}foreachOnPath(e,t){return this.foreachOnPath_(e,te(),t)}foreachOnPath_(e,t,s){if(G(e))return this;{this.value&&s(t,this.value);const r=z(e),i=this.children.get(r);return i?i.foreachOnPath_(ie(e),me(t,r),s):new ce(null)}}foreach(e){this.foreach_(te(),e)}foreach_(e,t){this.children.inorderTraversal((s,r)=>{r.foreach_(me(e,s),t)}),this.value&&t(e,this.value)}foreachChild(e){this.children.inorderTraversal((t,s)=>{s.value&&e(t,s.value)})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rt{constructor(e){this.writeTree_=e}static empty(){return new rt(new ce(null))}}function Xs(n,e,t){if(G(e))return new rt(new ce(t));{const s=n.writeTree_.findRootMostValueAndPath(e);if(s!=null){const r=s.path;let i=s.value;const o=tt(r,e);return i=i.updateChild(o,t),new rt(n.writeTree_.set(r,i))}else{const r=new ce(t),i=n.writeTree_.setTree(e,r);return new rt(i)}}}function nd(n,e,t){let s=n;return Ye(t,(r,i)=>{s=Xs(s,me(e,r),i)}),s}function sd(n,e){if(G(e))return rt.empty();{const t=n.writeTree_.setTree(e,new ce(null));return new rt(t)}}function xa(n,e){return kn(n,e)!=null}function kn(n,e){const t=n.writeTree_.findRootMostValueAndPath(e);return t!=null?n.writeTree_.get(t.path).getChild(tt(t.path,e)):null}function rd(n){const e=[],t=n.writeTree_.value;return t!=null?t.isLeafNode()||t.forEachChild(De,(s,r)=>{e.push(new X(s,r))}):n.writeTree_.children.inorderTraversal((s,r)=>{r.value!=null&&e.push(new X(s,r.value))}),e}function Qt(n,e){if(G(e))return n;{const t=kn(n,e);return t!=null?new rt(new ce(t)):new rt(n.writeTree_.subtree(e))}}function Fa(n){return n.writeTree_.isEmpty()}function ns(n,e){return __(te(),n.writeTree_,e)}function __(n,e,t){if(e.value!=null)return t.updateChild(n,e.value);{let s=null;return e.children.inorderTraversal((r,i)=>{r===".priority"?(O(i.value!==null,"Priority writes must always be leaf nodes"),s=i.value):t=__(me(n,r),i,t)}),!t.getChild(n).isEmpty()&&s!==null&&(t=t.updateChild(me(n,".priority"),s)),t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function m_(n,e){return v_(e,n)}function kA(n,e,t,s,r){O(s>n.lastWriteId,"Stacking an older write on top of newer ones"),r===void 0&&(r=!0),n.allWrites.push({path:e,snap:t,writeId:s,visible:r}),r&&(n.visibleWrites=Xs(n.visibleWrites,e,t)),n.lastWriteId=s}function DA(n,e){for(let t=0;t<n.allWrites.length;t++){const s=n.allWrites[t];if(s.writeId===e)return s}return null}function OA(n,e){const t=n.allWrites.findIndex(c=>c.writeId===e);O(t>=0,"removeWrite called with nonexistent writeId.");const s=n.allWrites[t];n.allWrites.splice(t,1);let r=s.visible,i=!1,o=n.allWrites.length-1;for(;r&&o>=0;){const c=n.allWrites[o];c.visible&&(o>=t&&VA(c,s.path)?r=!1:nt(s.path,c.path)&&(i=!0)),o--}if(r){if(i)return MA(n),!0;if(s.snap)n.visibleWrites=sd(n.visibleWrites,s.path);else{const c=s.children;Ye(c,l=>{n.visibleWrites=sd(n.visibleWrites,me(s.path,l))})}return!0}else return!1}function VA(n,e){if(n.snap)return nt(n.path,e);for(const t in n.children)if(n.children.hasOwnProperty(t)&&nt(me(n.path,t),e))return!0;return!1}function MA(n){n.visibleWrites=g_(n.allWrites,LA,te()),n.allWrites.length>0?n.lastWriteId=n.allWrites[n.allWrites.length-1].writeId:n.lastWriteId=-1}function LA(n){return n.visible}function g_(n,e,t){let s=rt.empty();for(let r=0;r<n.length;++r){const i=n[r];if(e(i)){const o=i.path;let c;if(i.snap)nt(t,o)?(c=tt(t,o),s=Xs(s,c,i.snap)):nt(o,t)&&(c=tt(o,t),s=Xs(s,te(),i.snap.getChild(c)));else if(i.children){if(nt(t,o))c=tt(t,o),s=nd(s,c,i.children);else if(nt(o,t))if(c=tt(o,t),G(c))s=nd(s,te(),i.children);else{const l=Hn(i.children,z(c));if(l){const h=l.getChild(ie(c));s=Xs(s,te(),h)}}}else throw rs("WriteRecord should have .snap or .children")}}return s}function y_(n,e,t,s,r){if(!s&&!r){const i=kn(n.visibleWrites,e);if(i!=null)return i;{const o=Qt(n.visibleWrites,e);if(Fa(o))return t;if(t==null&&!xa(o,te()))return null;{const c=t||ee.EMPTY_NODE;return ns(o,c)}}}else{const i=Qt(n.visibleWrites,e);if(!r&&Fa(i))return t;if(!r&&t==null&&!xa(i,te()))return null;{const o=function(h){return(h.visible||r)&&(!s||!~s.indexOf(h.writeId))&&(nt(h.path,e)||nt(e,h.path))},c=g_(n.allWrites,o,e),l=t||ee.EMPTY_NODE;return ns(c,l)}}}function xA(n,e,t){let s=ee.EMPTY_NODE;const r=kn(n.visibleWrites,e);if(r)return r.isLeafNode()||r.forEachChild(De,(i,o)=>{s=s.updateImmediateChild(i,o)}),s;if(t){const i=Qt(n.visibleWrites,e);return t.forEachChild(De,(o,c)=>{const l=ns(Qt(i,new re(o)),c);s=s.updateImmediateChild(o,l)}),rd(i).forEach(o=>{s=s.updateImmediateChild(o.name,o.node)}),s}else{const i=Qt(n.visibleWrites,e);return rd(i).forEach(o=>{s=s.updateImmediateChild(o.name,o.node)}),s}}function FA(n,e,t,s,r){O(s||r,"Either existingEventSnap or existingServerSnap must exist");const i=me(e,t);if(xa(n.visibleWrites,i))return null;{const o=Qt(n.visibleWrites,i);return Fa(o)?r.getChild(t):ns(o,r.getChild(t))}}function UA(n,e,t,s){const r=me(e,t),i=kn(n.visibleWrites,r);if(i!=null)return i;if(s.isCompleteForChild(t)){const o=Qt(n.visibleWrites,r);return ns(o,s.getNode().getImmediateChild(t))}else return null}function BA(n,e){return kn(n.visibleWrites,e)}function qA(n,e,t,s,r,i,o){let c;const l=Qt(n.visibleWrites,e),h=kn(l,te());if(h!=null)c=h;else if(t!=null)c=ns(l,t);else return[];if(c=c.withIndex(o),!c.isEmpty()&&!c.isLeafNode()){const f=[],p=o.getCompare(),m=i?c.getReverseIteratorFrom(s,o):c.getIteratorFrom(s,o);let w=m.getNext();for(;w&&f.length<r;)p(w,s)!==0&&f.push(w),w=m.getNext();return f}else return[]}function $A(){return{visibleWrites:rt.empty(),allWrites:[],lastWriteId:-1}}function Ua(n,e,t,s){return y_(n.writeTree,n.treePath,e,t,s)}function E_(n,e){return xA(n.writeTree,n.treePath,e)}function id(n,e,t,s){return FA(n.writeTree,n.treePath,e,t,s)}function Ni(n,e){return BA(n.writeTree,me(n.treePath,e))}function jA(n,e,t,s,r,i){return qA(n.writeTree,n.treePath,e,t,s,r,i)}function nl(n,e,t){return UA(n.writeTree,n.treePath,e,t)}function T_(n,e){return v_(me(n.treePath,e),n.writeTree)}function v_(n,e){return{treePath:n,writeTree:e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class WA{constructor(){this.changeMap=new Map}trackChildChange(e){const t=e.type,s=e.childName;O(t==="child_added"||t==="child_changed"||t==="child_removed","Only child changes supported for tracking"),O(s!==".priority","Only non-priority child changes can be tracked.");const r=this.changeMap.get(s);if(r){const i=r.type;if(t==="child_added"&&i==="child_removed")this.changeMap.set(s,Jh(s,e.snapshotNode,r.snapshotNode));else if(t==="child_removed"&&i==="child_added")this.changeMap.delete(s);else if(t==="child_removed"&&i==="child_changed")this.changeMap.set(s,EA(s,r.oldSnap));else if(t==="child_changed"&&i==="child_added")this.changeMap.set(s,yA(s,e.snapshotNode));else if(t==="child_changed"&&i==="child_changed")this.changeMap.set(s,Jh(s,e.snapshotNode,r.oldSnap));else throw rs("Illegal combination of changes: "+e+" occurred after "+r)}else this.changeMap.set(s,e)}getChanges(){return Array.from(this.changeMap.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zA{getCompleteChild(e){return null}getChildAfterChild(e,t,s){return null}}const I_=new zA;class sl{constructor(e,t,s=null){this.writes_=e,this.viewCache_=t,this.optCompleteServerCache_=s}getCompleteChild(e){const t=this.viewCache_.eventCache;if(t.isCompleteForChild(e))return t.getNode().getImmediateChild(e);{const s=this.optCompleteServerCache_!=null?new tl(this.optCompleteServerCache_,!0,!1):this.viewCache_.serverCache;return nl(this.writes_,e,s)}}getChildAfterChild(e,t,s){const r=this.optCompleteServerCache_!=null?this.optCompleteServerCache_:Sn(this.viewCache_),i=jA(this.writes_,r,t,1,s,e);return i.length===0?null:i[0]}}function HA(n,e){O(e.eventCache.getNode().isIndexed(n.filter.getIndex()),"Event snap not indexed"),O(e.serverCache.getNode().isIndexed(n.filter.getIndex()),"Server snap not indexed")}function GA(n,e,t,s,r){const i=new WA;let o,c;if(t.type===ft.OVERWRITE){const h=t;h.source.fromUser?o=Ba(n,e,h.path,h.snap,s,r,i):(O(h.source.fromServer,"Unknown source."),c=h.source.tagged||e.serverCache.isFiltered()&&!G(h.path),o=ki(n,e,h.path,h.snap,s,r,c,i))}else if(t.type===ft.MERGE){const h=t;h.source.fromUser?o=QA(n,e,h.path,h.children,s,r,i):(O(h.source.fromServer,"Unknown source."),c=h.source.tagged||e.serverCache.isFiltered(),o=qa(n,e,h.path,h.children,s,r,c,i))}else if(t.type===ft.ACK_USER_WRITE){const h=t;h.revert?o=JA(n,e,h.path,s,r,i):o=YA(n,e,h.path,h.affectedTree,s,r,i)}else if(t.type===ft.LISTEN_COMPLETE)o=XA(n,e,t.path,s,i);else throw rs("Unknown operation type: "+t.type);const l=i.getChanges();return KA(e,o,l),{viewCache:o,changes:l}}function KA(n,e,t){const s=e.eventCache;if(s.isFullyInitialized()){const r=s.getNode().isLeafNode()||s.getNode().isEmpty(),i=La(n);(t.length>0||!n.eventCache.isFullyInitialized()||r&&!s.getNode().equals(i)||!s.getNode().getPriority().equals(i.getPriority()))&&t.push(gA(La(e)))}}function w_(n,e,t,s,r,i){const o=e.eventCache;if(Ni(s,t)!=null)return e;{let c,l;if(G(t))if(O(e.serverCache.isFullyInitialized(),"If change path is empty, we must have complete server data"),e.serverCache.isFiltered()){const h=Sn(e),f=h instanceof ee?h:ee.EMPTY_NODE,p=E_(s,f);c=n.filter.updateFullNode(e.eventCache.getNode(),p,i)}else{const h=Ua(s,Sn(e));c=n.filter.updateFullNode(e.eventCache.getNode(),h,i)}else{const h=z(t);if(h===".priority"){O(nn(t)===1,"Can't have a priority with additional path components");const f=o.getNode();l=e.serverCache.getNode();const p=id(s,t,f,l);p!=null?c=n.filter.updatePriority(f,p):c=o.getNode()}else{const f=ie(t);let p;if(o.isCompleteForChild(h)){l=e.serverCache.getNode();const m=id(s,t,o.getNode(),l);m!=null?p=o.getNode().getImmediateChild(h).updateChild(f,m):p=o.getNode().getImmediateChild(h)}else p=nl(s,h,e.serverCache);p!=null?c=n.filter.updateChild(o.getNode(),h,p,f,r,i):c=o.getNode()}}return Ys(e,c,o.isFullyInitialized()||G(t),n.filter.filtersNodes())}}function ki(n,e,t,s,r,i,o,c){const l=e.serverCache;let h;const f=o?n.filter:n.filter.getIndexedFilter();if(G(t))h=f.updateFullNode(l.getNode(),s,null);else if(f.filtersNodes()&&!l.isFiltered()){const w=l.getNode().updateChild(t,s);h=f.updateFullNode(l.getNode(),w,null)}else{const w=z(t);if(!l.isCompleteForPath(t)&&nn(t)>1)return e;const S=ie(t),N=l.getNode().getImmediateChild(w).updateChild(S,s);w===".priority"?h=f.updatePriority(l.getNode(),N):h=f.updateChild(l.getNode(),w,N,S,I_,null)}const p=p_(e,h,l.isFullyInitialized()||G(t),f.filtersNodes()),m=new sl(r,p,i);return w_(n,p,t,r,m,c)}function Ba(n,e,t,s,r,i,o){const c=e.eventCache;let l,h;const f=new sl(r,e,i);if(G(t))h=n.filter.updateFullNode(e.eventCache.getNode(),s,o),l=Ys(e,h,!0,n.filter.filtersNodes());else{const p=z(t);if(p===".priority")h=n.filter.updatePriority(e.eventCache.getNode(),s),l=Ys(e,h,c.isFullyInitialized(),c.isFiltered());else{const m=ie(t),w=c.getNode().getImmediateChild(p);let S;if(G(m))S=s;else{const k=f.getCompleteChild(p);k!=null?Xc(m)===".priority"&&k.getChild(n_(m)).isEmpty()?S=k:S=k.updateChild(m,s):S=ee.EMPTY_NODE}if(w.equals(S))l=e;else{const k=n.filter.updateChild(c.getNode(),p,S,m,f,o);l=Ys(e,k,c.isFullyInitialized(),n.filter.filtersNodes())}}}return l}function od(n,e){return n.eventCache.isCompleteForChild(e)}function QA(n,e,t,s,r,i,o){let c=e;return s.foreach((l,h)=>{const f=me(t,l);od(e,z(f))&&(c=Ba(n,c,f,h,r,i,o))}),s.foreach((l,h)=>{const f=me(t,l);od(e,z(f))||(c=Ba(n,c,f,h,r,i,o))}),c}function ad(n,e,t){return t.foreach((s,r)=>{e=e.updateChild(s,r)}),e}function qa(n,e,t,s,r,i,o,c){if(e.serverCache.getNode().isEmpty()&&!e.serverCache.isFullyInitialized())return e;let l=e,h;G(t)?h=s:h=new ce(null).setTree(t,s);const f=e.serverCache.getNode();return h.children.inorderTraversal((p,m)=>{if(f.hasChild(p)){const w=e.serverCache.getNode().getImmediateChild(p),S=ad(n,w,m);l=ki(n,l,new re(p),S,r,i,o,c)}}),h.children.inorderTraversal((p,m)=>{const w=!e.serverCache.isCompleteForChild(p)&&m.value===null;if(!f.hasChild(p)&&!w){const S=e.serverCache.getNode().getImmediateChild(p),k=ad(n,S,m);l=ki(n,l,new re(p),k,r,i,o,c)}}),l}function YA(n,e,t,s,r,i,o){if(Ni(r,t)!=null)return e;const c=e.serverCache.isFiltered(),l=e.serverCache;if(s.value!=null){if(G(t)&&l.isFullyInitialized()||l.isCompleteForPath(t))return ki(n,e,t,l.getNode().getChild(t),r,i,c,o);if(G(t)){let h=new ce(null);return l.getNode().forEachChild(jn,(f,p)=>{h=h.set(new re(f),p)}),qa(n,e,t,h,r,i,c,o)}else return e}else{let h=new ce(null);return s.foreach((f,p)=>{const m=me(t,f);l.isCompleteForPath(m)&&(h=h.set(f,l.getNode().getChild(m)))}),qa(n,e,t,h,r,i,c,o)}}function XA(n,e,t,s,r){const i=e.serverCache,o=p_(e,i.getNode(),i.isFullyInitialized()||G(t),i.isFiltered());return w_(n,o,t,s,I_,r)}function JA(n,e,t,s,r,i){let o;if(Ni(s,t)!=null)return e;{const c=new sl(s,e,r),l=e.eventCache.getNode();let h;if(G(t)||z(t)===".priority"){let f;if(e.serverCache.isFullyInitialized())f=Ua(s,Sn(e));else{const p=e.serverCache.getNode();O(p instanceof ee,"serverChildren would be complete if leaf node"),f=E_(s,p)}f=f,h=n.filter.updateFullNode(l,f,i)}else{const f=z(t);let p=nl(s,f,e.serverCache);p==null&&e.serverCache.isCompleteForChild(f)&&(p=l.getImmediateChild(f)),p!=null?h=n.filter.updateChild(l,f,p,ie(t),c,i):e.eventCache.getNode().hasChild(f)?h=n.filter.updateChild(l,f,ee.EMPTY_NODE,ie(t),c,i):h=l,h.isEmpty()&&e.serverCache.isFullyInitialized()&&(o=Ua(s,Sn(e)),o.isLeafNode()&&(h=n.filter.updateFullNode(h,o,i)))}return o=e.serverCache.isFullyInitialized()||Ni(s,te())!=null,Ys(e,h,o,n.filter.filtersNodes())}}function ZA(n,e){const t=Sn(n.viewCache_);return t&&(n.query._queryParams.loadsAllData()||!G(e)&&!t.getImmediateChild(z(e)).isEmpty())?t.getChild(e):null}function cd(n,e,t,s){e.type===ft.MERGE&&e.source.queryId!==null&&(O(Sn(n.viewCache_),"We should always have a full cache before handling merges"),O(La(n.viewCache_),"Missing event cache, even though we have a server cache"));const r=n.viewCache_,i=GA(n.processor_,r,e,t,s);return HA(n.processor_,i.viewCache),O(i.viewCache.serverCache.isFullyInitialized()||!r.serverCache.isFullyInitialized(),"Once a server snap is complete, it should never go back"),n.viewCache_=i.viewCache,eC(n,i.changes,i.viewCache.eventCache.getNode())}function eC(n,e,t,s){const r=n.eventRegistrations_;return SA(n.eventGenerator_,e,t,r)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ld;function tC(n){O(!ld,"__referenceConstructor has already been defined"),ld=n}function rl(n,e,t,s){const r=e.source.queryId;if(r!==null){const i=n.views.get(r);return O(i!=null,"SyncTree gave us an op for an invalid query."),cd(i,e,t,s)}else{let i=[];for(const o of n.views.values())i=i.concat(cd(o,e,t,s));return i}}function il(n,e){let t=null;for(const s of n.views.values())t=t||ZA(s,e);return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ud;function nC(n){O(!ud,"__referenceConstructor has already been defined"),ud=n}class hd{constructor(e){this.listenProvider_=e,this.syncPointTree_=new ce(null),this.pendingWriteTree_=$A(),this.tagToQueryMap=new Map,this.queryToTagMap=new Map}}function A_(n,e,t,s,r){return kA(n.pendingWriteTree_,e,t,s,r),r?lo(n,new Rn(u_(),e,t)):[]}function mn(n,e,t=!1){const s=DA(n.pendingWriteTree_,e);if(OA(n.pendingWriteTree_,e)){let i=new ce(null);return s.snap!=null?i=i.set(te(),!0):Ye(s.children,o=>{i=i.set(new re(o),!0)}),lo(n,new Pi(s.path,i,t))}else return[]}function co(n,e,t){return lo(n,new Rn(h_(),e,t))}function sC(n,e,t){const s=ce.fromObject(t);return lo(n,new dr(h_(),e,s))}function rC(n,e,t,s){const r=S_(n,s);if(r!=null){const i=b_(r),o=i.path,c=i.queryId,l=tt(o,e),h=new Rn(d_(c),l,t);return P_(n,o,h)}else return[]}function iC(n,e,t,s){const r=S_(n,s);if(r){const i=b_(r),o=i.path,c=i.queryId,l=tt(o,e),h=ce.fromObject(t),f=new dr(d_(c),l,h);return P_(n,o,f)}else return[]}function ol(n,e,t){const r=n.pendingWriteTree_,i=n.syncPointTree_.findOnPath(e,(o,c)=>{const l=tt(o,e),h=il(c,l);if(h)return h});return y_(r,e,i,t,!0)}function lo(n,e){return C_(e,n.syncPointTree_,null,m_(n.pendingWriteTree_,te()))}function C_(n,e,t,s){if(G(n.path))return R_(n,e,t,s);{const r=e.get(te());t==null&&r!=null&&(t=il(r,te()));let i=[];const o=z(n.path),c=n.operationForChild(o),l=e.children.get(o);if(l&&c){const h=t?t.getImmediateChild(o):null,f=T_(s,o);i=i.concat(C_(c,l,h,f))}return r&&(i=i.concat(rl(r,n,s,t))),i}}function R_(n,e,t,s){const r=e.get(te());t==null&&r!=null&&(t=il(r,te()));let i=[];return e.children.inorderTraversal((o,c)=>{const l=t?t.getImmediateChild(o):null,h=T_(s,o),f=n.operationForChild(o);f&&(i=i.concat(R_(f,c,l,h)))}),r&&(i=i.concat(rl(r,n,s,t))),i}function S_(n,e){return n.tagToQueryMap.get(e)}function b_(n){const e=n.indexOf("$");return O(e!==-1&&e<n.length-1,"Bad queryKey."),{queryId:n.substr(e+1),path:new re(n.substr(0,e))}}function P_(n,e,t){const s=n.syncPointTree_.get(e);O(s,"Missing sync point for query tag that we're tracking");const r=m_(n.pendingWriteTree_,e);return rl(s,t,r,null)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class al{constructor(e){this.node_=e}getImmediateChild(e){const t=this.node_.getImmediateChild(e);return new al(t)}node(){return this.node_}}class cl{constructor(e,t){this.syncTree_=e,this.path_=t}getImmediateChild(e){const t=me(this.path_,e);return new cl(this.syncTree_,t)}node(){return ol(this.syncTree_,this.path_)}}const oC=function(n){return n=n||{},n.timestamp=n.timestamp||new Date().getTime(),n},dd=function(n,e,t){if(!n||typeof n!="object")return n;if(O(".sv"in n,"Unexpected leaf node or priority contents"),typeof n[".sv"]=="string")return aC(n[".sv"],e,t);if(typeof n[".sv"]=="object")return cC(n[".sv"],e);O(!1,"Unexpected server value: "+JSON.stringify(n,null,2))},aC=function(n,e,t){switch(n){case"timestamp":return t.timestamp;default:O(!1,"Unexpected server value: "+n)}},cC=function(n,e,t){n.hasOwnProperty("increment")||O(!1,"Unexpected server value: "+JSON.stringify(n,null,2));const s=n.increment;typeof s!="number"&&O(!1,"Unexpected increment value: "+s);const r=e.node();if(O(r!==null&&typeof r<"u","Expected ChildrenNode.EMPTY_NODE for nulls"),!r.isLeafNode())return s;const o=r.getValue();return typeof o!="number"?s:o+s},lC=function(n,e,t,s){return ll(e,new cl(t,n),s)},N_=function(n,e,t){return ll(n,new al(e),t)};function ll(n,e,t){const s=n.getPriority().val(),r=dd(s,e.getImmediateChild(".priority"),t);let i;if(n.isLeafNode()){const o=n,c=dd(o.getValue(),e,t);return c!==o.getValue()||r!==o.getPriority().val()?new Re(c,ye(r)):n}else{const o=n;return i=o,r!==o.getPriority().val()&&(i=i.updatePriority(new Re(r))),o.forEachChild(De,(c,l)=>{const h=ll(l,e.getImmediateChild(c),t);h!==l&&(i=i.updateImmediateChild(c,h))}),i}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ul{constructor(e="",t=null,s={children:{},childCount:0}){this.name=e,this.parent=t,this.node=s}}function hl(n,e){let t=e instanceof re?e:new re(e),s=n,r=z(t);for(;r!==null;){const i=Hn(s.node.children,r)||{children:{},childCount:0};s=new ul(r,s,i),t=ie(t),r=z(t)}return s}function _s(n){return n.node.value}function k_(n,e){n.node.value=e,$a(n)}function D_(n){return n.node.childCount>0}function uC(n){return _s(n)===void 0&&!D_(n)}function uo(n,e){Ye(n.node.children,(t,s)=>{e(new ul(t,n,s))})}function O_(n,e,t,s){t&&e(n),uo(n,r=>{O_(r,e,!0)})}function hC(n,e,t){let s=n.parent;for(;s!==null;){if(e(s))return!0;s=s.parent}return!1}function Cr(n){return new re(n.parent===null?n.name:Cr(n.parent)+"/"+n.name)}function $a(n){n.parent!==null&&dC(n.parent,n.name,n)}function dC(n,e,t){const s=uC(t),r=wt(n.node.children,e);s&&r?(delete n.node.children[e],n.node.childCount--,$a(n)):!s&&!r&&(n.node.children[e]=t.node,n.node.childCount++,$a(n))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fC=/[\[\].#$\/\u0000-\u001F\u007F]/,pC=/[\[\].#$\u0000-\u001F\u007F]/,ta=10*1024*1024,dl=function(n){return typeof n=="string"&&n.length!==0&&!fC.test(n)},V_=function(n){return typeof n=="string"&&n.length!==0&&!pC.test(n)},_C=function(n){return n&&(n=n.replace(/^\/*\.info(\/|$)/,"/")),V_(n)},M_=function(n){return n===null||typeof n=="string"||typeof n=="number"&&!oo(n)||n&&typeof n=="object"&&wt(n,".sv")},ja=function(n,e,t,s){ho(Gn(n,"value"),e,t)},ho=function(n,e,t){const s=t instanceof re?new Xw(t,n):t;if(e===void 0)throw new Error(n+"contains undefined "+fn(s));if(typeof e=="function")throw new Error(n+"contains a function "+fn(s)+" with contents = "+e.toString());if(oo(e))throw new Error(n+"contains "+e.toString()+" "+fn(s));if(typeof e=="string"&&e.length>ta/3&&xi(e)>ta)throw new Error(n+"contains a string greater than "+ta+" utf8 bytes "+fn(s)+" ('"+e.substring(0,50)+"...')");if(e&&typeof e=="object"){let r=!1,i=!1;if(Ye(e,(o,c)=>{if(o===".value")r=!0;else if(o!==".priority"&&o!==".sv"&&(i=!0,!dl(o)))throw new Error(n+" contains an invalid key ("+o+") "+fn(s)+`.  Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`);Jw(s,o),ho(n,c,s),Zw(s)}),r&&i)throw new Error(n+' contains ".value" child '+fn(s)+" in addition to actual children.")}},mC=function(n,e){let t,s;for(t=0;t<e.length;t++){s=e[t];const i=hr(s);for(let o=0;o<i.length;o++)if(!(i[o]===".priority"&&o===i.length-1)){if(!dl(i[o]))throw new Error(n+"contains an invalid key ("+i[o]+") in path "+s.toString()+`. Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`)}}e.sort(Yw);let r=null;for(t=0;t<e.length;t++){if(s=e[t],r!==null&&nt(r,s))throw new Error(n+"contains a path "+r.toString()+" that is ancestor of another path "+s.toString());r=s}},gC=function(n,e,t,s){const r=Gn(n,"values");if(!(e&&typeof e=="object")||Array.isArray(e))throw new Error(r+" must be an object containing the children to replace.");const i=[];Ye(e,(o,c)=>{const l=new re(o);if(ho(r,c,me(t,l)),Xc(l)===".priority"&&!M_(c))throw new Error(r+"contains an invalid value for '"+l.toString()+"', which must be a valid Firebase priority (a string, finite number, server value, or null).");i.push(l)}),mC(r,i)},yC=function(n,e,t){if(oo(e))throw new Error(Gn(n,"priority")+"is "+e.toString()+", but must be a valid Firebase priority (a string, finite number, server value, or null).");if(!M_(e))throw new Error(Gn(n,"priority")+"must be a valid Firebase priority (a string, finite number, server value, or null).")},L_=function(n,e,t,s){if(!V_(t))throw new Error(Gn(n,e)+'was an invalid path = "'+t+`". Paths must be non-empty strings and can't contain ".", "#", "$", "[", or "]"`)},EC=function(n,e,t,s){t&&(t=t.replace(/^\/*\.info(\/|$)/,"/")),L_(n,e,t)},qs=function(n,e){if(z(e)===".info")throw new Error(n+" failed = Can't modify data under /.info/")},TC=function(n,e){const t=e.path.toString();if(typeof e.repoInfo.host!="string"||e.repoInfo.host.length===0||!dl(e.repoInfo.namespace)&&e.repoInfo.host.split(":")[0]!=="localhost"||t.length!==0&&!_C(t))throw new Error(Gn(n,"url")+`must be a valid firebase URL and the path can't contain ".", "#", "$", "[", or "]".`)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vC{constructor(){this.eventLists_=[],this.recursionDepth_=0}}function x_(n,e){let t=null;for(let s=0;s<e.length;s++){const r=e[s],i=r.getPath();t!==null&&!s_(i,t.path)&&(n.eventLists_.push(t),t=null),t===null&&(t={events:[],path:i}),t.events.push(r)}t&&n.eventLists_.push(t)}function Dt(n,e,t){x_(n,t),IC(n,s=>nt(s,e)||nt(e,s))}function IC(n,e){n.recursionDepth_++;let t=!0;for(let s=0;s<n.eventLists_.length;s++){const r=n.eventLists_[s];if(r){const i=r.path;e(i)?(wC(n.eventLists_[s]),n.eventLists_[s]=null):t=!1}}t&&(n.eventLists_=[]),n.recursionDepth_--}function wC(n){for(let e=0;e<n.events.length;e++){const t=n.events[e];if(t!==null){n.events[e]=null;const s=t.getEventRunner();Ks&&Pe("event: "+t.toString()),fs(s)}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const AC="repo_interrupt",CC=25;class RC{constructor(e,t,s,r){this.repoInfo_=e,this.forceRestClient_=t,this.authTokenProvider_=s,this.appCheckProvider_=r,this.dataUpdateCount=0,this.statsListener_=null,this.eventQueue_=new vC,this.nextWriteId_=1,this.interceptServerDataCallback_=null,this.onDisconnect_=bi(),this.transactionQueueTree_=new ul,this.persistentConnection_=null,this.key=this.repoInfo_.toURLString()}toString(){return(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host}}function SC(n,e,t){if(n.stats_=Qc(n.repoInfo_),n.forceRestClient_||Tw())n.server_=new Si(n.repoInfo_,(s,r,i,o)=>{fd(n,s,r,i,o)},n.authTokenProvider_,n.appCheckProvider_),setTimeout(()=>pd(n,!0),0);else{if(typeof t<"u"&&t!==null){if(typeof t!="object")throw new Error("Only objects are supported for option databaseAuthVariableOverride");try{Ne(t)}catch(s){throw new Error("Invalid authOverride provided: "+s)}}n.persistentConnection_=new St(n.repoInfo_,e,(s,r,i,o)=>{fd(n,s,r,i,o)},s=>{pd(n,s)},s=>{PC(n,s)},n.authTokenProvider_,n.appCheckProvider_,t),n.server_=n.persistentConnection_}n.authTokenProvider_.addTokenChangeListener(s=>{n.server_.refreshAuthToken(s)}),n.appCheckProvider_.addTokenChangeListener(s=>{n.server_.refreshAppCheckToken(s.token)}),n.statsReporter_=Rw(n.repoInfo_,()=>new RA(n.stats_,n.server_)),n.infoData_=new vA,n.infoSyncTree_=new hd({startListening:(s,r,i,o)=>{let c=[];const l=n.infoData_.getNode(s._path);return l.isEmpty()||(c=co(n.infoSyncTree_,s._path,l),setTimeout(()=>{o("ok")},0)),c},stopListening:()=>{}}),pl(n,"connected",!1),n.serverSyncTree_=new hd({startListening:(s,r,i,o)=>(n.server_.listen(s,i,r,(c,l)=>{const h=o(c,l);Dt(n.eventQueue_,s._path,h)}),[]),stopListening:(s,r)=>{n.server_.unlisten(s,r)}})}function bC(n){const t=n.infoData_.getNode(new re(".info/serverTimeOffset")).val()||0;return new Date().getTime()+t}function fl(n){return oC({timestamp:bC(n)})}function fd(n,e,t,s,r){n.dataUpdateCount++;const i=new re(e);t=n.interceptServerDataCallback_?n.interceptServerDataCallback_(e,t):t;let o=[];if(r)if(s){const l=ci(t,h=>ye(h));o=iC(n.serverSyncTree_,i,l,r)}else{const l=ye(t);o=rC(n.serverSyncTree_,i,l,r)}else if(s){const l=ci(t,h=>ye(h));o=sC(n.serverSyncTree_,i,l)}else{const l=ye(t);o=co(n.serverSyncTree_,i,l)}let c=i;o.length>0&&(c=fo(n,i)),Dt(n.eventQueue_,c,o)}function pd(n,e){pl(n,"connected",e),e===!1&&kC(n)}function PC(n,e){Ye(e,(t,s)=>{pl(n,t,s)})}function pl(n,e,t){const s=new re("/.info/"+e),r=ye(t);n.infoData_.updateSnapshot(s,r);const i=co(n.infoSyncTree_,s,r);Dt(n.eventQueue_,s,i)}function F_(n){return n.nextWriteId_++}function NC(n,e,t,s,r){_l(n,"set",{path:e.toString(),value:t,priority:s});const i=fl(n),o=ye(t,s),c=ol(n.serverSyncTree_,e),l=N_(o,c,i),h=F_(n),f=A_(n.serverSyncTree_,e,l,h,!0);x_(n.eventQueue_,f),n.server_.put(e.toString(),o.val(!0),(m,w)=>{const S=m==="ok";S||Qe("set at "+e+" failed: "+m);const k=mn(n.serverSyncTree_,h,!S);Dt(n.eventQueue_,e,k),ss(n,r,m,w)});const p=j_(n,e);fo(n,p),Dt(n.eventQueue_,p,[])}function kC(n){_l(n,"onDisconnectEvents");const e=fl(n),t=bi();Ma(n.onDisconnect_,te(),(r,i)=>{const o=lC(r,i,n.serverSyncTree_,e);ps(t,r,o)});let s=[];Ma(t,te(),(r,i)=>{s=s.concat(co(n.serverSyncTree_,r,i));const o=j_(n,r);fo(n,o)}),n.onDisconnect_=bi(),Dt(n.eventQueue_,te(),s)}function DC(n,e,t){n.server_.onDisconnectCancel(e.toString(),(s,r)=>{s==="ok"&&Va(n.onDisconnect_,e),ss(n,t,s,r)})}function _d(n,e,t,s){const r=ye(t);n.server_.onDisconnectPut(e.toString(),r.val(!0),(i,o)=>{i==="ok"&&ps(n.onDisconnect_,e,r),ss(n,s,i,o)})}function OC(n,e,t,s,r){const i=ye(t,s);n.server_.onDisconnectPut(e.toString(),i.val(!0),(o,c)=>{o==="ok"&&ps(n.onDisconnect_,e,i),ss(n,r,o,c)})}function VC(n,e,t,s){if(ia(t)){Pe("onDisconnect().update() called with empty data.  Don't do anything."),ss(n,s,"ok",void 0);return}n.server_.onDisconnectMerge(e.toString(),t,(r,i)=>{r==="ok"&&Ye(t,(o,c)=>{const l=ye(c);ps(n.onDisconnect_,me(e,o),l)}),ss(n,s,r,i)})}function MC(n){n.persistentConnection_&&n.persistentConnection_.interrupt(AC)}function _l(n,...e){let t="";n.persistentConnection_&&(t=n.persistentConnection_.id+":"),Pe(t,...e)}function ss(n,e,t,s){e&&fs(()=>{if(t==="ok")e(null);else{const r=(t||"error").toUpperCase();let i=r;s&&(i+=": "+s);const o=new Error(i);o.code=r,e(o)}})}function U_(n,e,t){return ol(n.serverSyncTree_,e,t)||ee.EMPTY_NODE}function ml(n,e=n.transactionQueueTree_){if(e||po(n,e),_s(e)){const t=q_(n,e);O(t.length>0,"Sending zero length transaction queue"),t.every(r=>r.status===0)&&LC(n,Cr(e),t)}else D_(e)&&uo(e,t=>{ml(n,t)})}function LC(n,e,t){const s=t.map(h=>h.currentWriteId),r=U_(n,e,s);let i=r;const o=r.hash();for(let h=0;h<t.length;h++){const f=t[h];O(f.status===0,"tryToSendTransactionQueue_: items in queue should all be run."),f.status=1,f.retryCount++;const p=tt(e,f.path);i=i.updateChild(p,f.currentOutputSnapshotRaw)}const c=i.val(!0),l=e;n.server_.put(l.toString(),c,h=>{_l(n,"transaction put response",{path:l.toString(),status:h});let f=[];if(h==="ok"){const p=[];for(let m=0;m<t.length;m++)t[m].status=2,f=f.concat(mn(n.serverSyncTree_,t[m].currentWriteId)),t[m].onComplete&&p.push(()=>t[m].onComplete(null,!0,t[m].currentOutputSnapshotResolved)),t[m].unwatcher();po(n,hl(n.transactionQueueTree_,e)),ml(n,n.transactionQueueTree_),Dt(n.eventQueue_,e,f);for(let m=0;m<p.length;m++)fs(p[m])}else{if(h==="datastale")for(let p=0;p<t.length;p++)t[p].status===3?t[p].status=4:t[p].status=0;else{Qe("transaction at "+l.toString()+" failed: "+h);for(let p=0;p<t.length;p++)t[p].status=4,t[p].abortReason=h}fo(n,e)}},o)}function fo(n,e){const t=B_(n,e),s=Cr(t),r=q_(n,t);return xC(n,r,s),s}function xC(n,e,t){if(e.length===0)return;const s=[];let r=[];const o=e.filter(c=>c.status===0).map(c=>c.currentWriteId);for(let c=0;c<e.length;c++){const l=e[c],h=tt(t,l.path);let f=!1,p;if(O(h!==null,"rerunTransactionsUnderNode_: relativePath should not be null."),l.status===4)f=!0,p=l.abortReason,r=r.concat(mn(n.serverSyncTree_,l.currentWriteId,!0));else if(l.status===0)if(l.retryCount>=CC)f=!0,p="maxretry",r=r.concat(mn(n.serverSyncTree_,l.currentWriteId,!0));else{const m=U_(n,l.path,o);l.currentInputSnapshot=m;const w=e[c].update(m.val());if(w!==void 0){ho("transaction failed: Data returned ",w,l.path);let S=ye(w);typeof w=="object"&&w!=null&&wt(w,".priority")||(S=S.updatePriority(m.getPriority()));const N=l.currentWriteId,x=fl(n),U=N_(S,m,x);l.currentOutputSnapshotRaw=S,l.currentOutputSnapshotResolved=U,l.currentWriteId=F_(n),o.splice(o.indexOf(N),1),r=r.concat(A_(n.serverSyncTree_,l.path,U,l.currentWriteId,l.applyLocally)),r=r.concat(mn(n.serverSyncTree_,N,!0))}else f=!0,p="nodata",r=r.concat(mn(n.serverSyncTree_,l.currentWriteId,!0))}Dt(n.eventQueue_,t,r),r=[],f&&(e[c].status=2,(function(m){setTimeout(m,Math.floor(0))})(e[c].unwatcher),e[c].onComplete&&(p==="nodata"?s.push(()=>e[c].onComplete(null,!1,e[c].currentInputSnapshot)):s.push(()=>e[c].onComplete(new Error(p),!1,null))))}po(n,n.transactionQueueTree_);for(let c=0;c<s.length;c++)fs(s[c]);ml(n,n.transactionQueueTree_)}function B_(n,e){let t,s=n.transactionQueueTree_;for(t=z(e);t!==null&&_s(s)===void 0;)s=hl(s,t),e=ie(e),t=z(e);return s}function q_(n,e){const t=[];return $_(n,e,t),t.sort((s,r)=>s.order-r.order),t}function $_(n,e,t){const s=_s(e);if(s)for(let r=0;r<s.length;r++)t.push(s[r]);uo(e,r=>{$_(n,r,t)})}function po(n,e){const t=_s(e);if(t){let s=0;for(let r=0;r<t.length;r++)t[r].status!==2&&(t[s]=t[r],s++);t.length=s,k_(e,t.length>0?t:void 0)}uo(e,s=>{po(n,s)})}function j_(n,e){const t=Cr(B_(n,e)),s=hl(n.transactionQueueTree_,e);return hC(s,r=>{na(n,r)}),na(n,s),O_(s,r=>{na(n,r)}),t}function na(n,e){const t=_s(e);if(t){const s=[];let r=[],i=-1;for(let o=0;o<t.length;o++)t[o].status===3||(t[o].status===1?(O(i===o-1,"All SENT items should be at beginning of queue."),i=o,t[o].status=3,t[o].abortReason="set"):(O(t[o].status===0,"Unexpected transaction status in abort"),t[o].unwatcher(),r=r.concat(mn(n.serverSyncTree_,t[o].currentWriteId,!0)),t[o].onComplete&&s.push(t[o].onComplete.bind(null,new Error("set"),!1,null))));i===-1?k_(e,void 0):t.length=i+1,Dt(n.eventQueue_,Cr(e),r);for(let o=0;o<s.length;o++)fs(s[o])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function FC(n){let e="";const t=n.split("/");for(let s=0;s<t.length;s++)if(t[s].length>0){let r=t[s];try{r=decodeURIComponent(r.replace(/\+/g," "))}catch{}e+="/"+r}return e}function UC(n){const e={};n.charAt(0)==="?"&&(n=n.substring(1));for(const t of n.split("&")){if(t.length===0)continue;const s=t.split("=");s.length===2?e[decodeURIComponent(s[0])]=decodeURIComponent(s[1]):Qe(`Invalid query segment '${t}' in query '${n}'`)}return e}const md=function(n,e){const t=BC(n),s=t.namespace;t.domain==="firebase.com"&&An(t.host+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead"),(!s||s==="undefined")&&t.domain!=="localhost"&&An("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com"),t.secure||dw();const r=t.scheme==="ws"||t.scheme==="wss";return{repoInfo:new ww(t.host,t.secure,s,r,e,"",s!==t.subdomain),path:new re(t.pathString)}},BC=function(n){let e="",t="",s="",r="",i="",o=!0,c="https",l=443;if(typeof n=="string"){let h=n.indexOf("//");h>=0&&(c=n.substring(0,h-1),n=n.substring(h+2));let f=n.indexOf("/");f===-1&&(f=n.length);let p=n.indexOf("?");p===-1&&(p=n.length),e=n.substring(0,Math.min(f,p)),f<p&&(r=FC(n.substring(f,p)));const m=UC(n.substring(Math.min(n.length,p)));h=e.indexOf(":"),h>=0?(o=c==="https"||c==="wss",l=parseInt(e.substring(h+1),10)):h=e.length;const w=e.slice(0,h);if(w.toLowerCase()==="localhost")t="localhost";else if(w.split(".").length<=2)t=w;else{const S=e.indexOf(".");s=e.substring(0,S).toLowerCase(),t=e.substring(S+1),i=s}"ns"in m&&(i=m.ns)}return{host:e,port:l,domain:t,subdomain:s,secure:o,scheme:c,pathString:r,namespace:i}};/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qC{constructor(e,t){this._repo=e,this._path=t}cancel(){const e=new Ct;return DC(this._repo,this._path,e.wrapCallback(()=>{})),e.promise}remove(){qs("OnDisconnect.remove",this._path);const e=new Ct;return _d(this._repo,this._path,null,e.wrapCallback(()=>{})),e.promise}set(e){qs("OnDisconnect.set",this._path),ja("OnDisconnect.set",e,this._path);const t=new Ct;return _d(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}setWithPriority(e,t){qs("OnDisconnect.setWithPriority",this._path),ja("OnDisconnect.setWithPriority",e,this._path),yC("OnDisconnect.setWithPriority",t);const s=new Ct;return OC(this._repo,this._path,e,t,s.wrapCallback(()=>{})),s.promise}update(e){qs("OnDisconnect.update",this._path),gC("OnDisconnect.update",e,this._path);const t=new Ct;return VC(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gl{constructor(e,t,s,r){this._repo=e,this._path=t,this._queryParams=s,this._orderByCalled=r}get key(){return G(this._path)?null:Xc(this._path)}get ref(){return new Dn(this._repo,this._path)}get _queryIdentifier(){const e=ed(this._queryParams),t=Gc(e);return t==="{}"?"default":t}get _queryObject(){return ed(this._queryParams)}isEqual(e){if(e=ne(e),!(e instanceof gl))return!1;const t=this._repo===e._repo,s=s_(this._path,e._path),r=this._queryIdentifier===e._queryIdentifier;return t&&s&&r}toJSON(){return this.toString()}toString(){return this._repo.toString()+Qw(this._path)}}class Dn extends gl{constructor(e,t){super(e,t,new el,!1)}get parent(){const e=n_(this._path);return e===null?null:new Dn(this._repo,e)}get root(){let e=this;for(;e.parent!==null;)e=e.parent;return e}}function oS(n,e){return n=ne(n),n._checkNotDeleted("ref"),e!==void 0?$C(n._root,e):n._root}function $C(n,e){return n=ne(n),z(n._path)===null?EC("child","path",e):L_("child","path",e),new Dn(n._repo,me(n._path,e))}function aS(n){return n=ne(n),new qC(n._repo,n._path)}function cS(n,e){n=ne(n),qs("set",n._path),ja("set",e,n._path);const t=new Ct;return NC(n._repo,n._path,e,null,t.wrapCallback(()=>{})),t.promise}tC(Dn);nC(Dn);/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jC="FIREBASE_DATABASE_EMULATOR_HOST",Wa={};let WC=!1;function zC(n,e,t,s,r){let i=s||n.options.databaseURL;i===void 0&&(n.options.projectId||An("Can't determine Firebase Database URL. Be sure to include  a Project ID when calling firebase.initializeApp()."),Pe("Using default host for project ",n.options.projectId),i=`${n.options.projectId}-default-rtdb.firebaseio.com`);let o=md(i,r),c=o.repoInfo,l;typeof process<"u"&&Mh&&(l=Mh[jC]),l?(i=`http://${l}?ns=${c.namespace}`,o=md(i,r),c=o.repoInfo):o.repoInfo.secure;const h=new Iw(n.name,n.options,e);TC("Invalid Firebase Database URL",o),G(o.path)||An("Database URL must point to the root of a Firebase Database (not including a child path).");const f=GC(c,n,h,new vw(n,t));return new KC(f,n)}function HC(n,e){const t=Wa[e];(!t||t[n.key]!==n)&&An(`Database ${e}(${n.repoInfo_}) has already been deleted.`),MC(n),delete t[n.key]}function GC(n,e,t,s){let r=Wa[e.name];r||(r={},Wa[e.name]=r);let i=r[n.toURLString()];return i&&An("Database initialized multiple times. Please make sure the format of the database URL matches with each database() call."),i=new RC(n,WC,t,s),r[n.toURLString()]=i,i}class KC{constructor(e,t){this._repoInternal=e,this.app=t,this.type="database",this._instanceStarted=!1}get _repo(){return this._instanceStarted||(SC(this._repoInternal,this.app.options.appId,this.app.options.databaseAuthVariableOverride),this._instanceStarted=!0),this._repoInternal}get _root(){return this._rootInternal||(this._rootInternal=new Dn(this._repo,te())),this._rootInternal}_delete(){return this._rootInternal!==null&&(HC(this._repo,this.app.name),this._repoInternal=null,this._rootInternal=null),Promise.resolve()}_checkNotDeleted(e){this._rootInternal===null&&An("Cannot call "+e+" on a deleted database.")}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function QC(n){ow(is),Pt(new Tt("database",(e,{instanceIdentifier:t})=>{const s=e.getProvider("app").getImmediate(),r=e.getProvider("auth-internal"),i=e.getProvider("app-check-internal");return zC(s,r,i,t)},"PUBLIC").setMultipleInstances(!0)),Ke(Lh,xh,n),Ke(Lh,xh,"esm2020")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const YC={".sv":"timestamp"};function lS(){return YC}St.prototype.simpleListen=function(n,e){this.sendRequest("q",{p:n},e)};St.prototype.echo=function(n,e){this.sendRequest("echo",{d:n},e)};QC();function W_(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const XC=W_,z_=new fr("auth","Firebase",W_());/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Di=new Fi("@firebase/auth");function JC(n,...e){Di.logLevel<=W.WARN&&Di.warn(`Auth (${is}): ${n}`,...e)}function ri(n,...e){Di.logLevel<=W.ERROR&&Di.error(`Auth (${is}): ${n}`,...e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gd(n,...e){throw yl(n,...e)}function H_(n,...e){return yl(n,...e)}function G_(n,e,t){const s={...XC(),[e]:t};return new fr("auth","Firebase",s).create(e,{appName:n.name})}function ii(n){return G_(n,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function yl(n,...e){if(typeof n!="string"){const t=e[0],s=[...e.slice(1)];return s[0]&&(s[0].appName=n.name),n._errorFactory.create(t,...s)}return z_.create(n,...e)}function J(n,e,...t){if(!n)throw yl(e,...t)}function Js(n){const e="INTERNAL ASSERTION FAILED: "+n;throw ri(e),new Error(e)}function Oi(n,e){n||Js(e)}function ZC(){return yd()==="http:"||yd()==="https:"}function yd(){var n;return typeof self<"u"&&((n=self.location)==null?void 0:n.protocol)||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function eR(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(ZC()||Ym()||"connection"in navigator)?navigator.onLine:!0}function tR(){if(typeof navigator>"u")return null;const n=navigator;return n.languages&&n.languages[0]||n.language||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rr{constructor(e,t){this.shortDelay=e,this.longDelay=t,Oi(t>e,"Short delay should be less than long delay!"),this.isMobile=Xa()||Dd()}get(){return eR()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function nR(n,e){Oi(n.emulator,"Emulator should always be set here");const{url:t}=n.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class K_{static initialize(e,t,s){this.fetchImpl=e,t&&(this.headersImpl=t),s&&(this.responseImpl=s)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;Js("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;Js("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;Js("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sR={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rR=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],iR=new Rr(3e4,6e4);function Q_(n,e){return n.tenantId&&!e.tenantId?{...e,tenantId:n.tenantId}:e}async function _o(n,e,t,s,r={}){return Y_(n,r,async()=>{let i={},o={};s&&(e==="GET"?o=s:i={body:JSON.stringify(s)});const c=Ja({key:n.config.apiKey,...o}).slice(1),l=await n._getAdditionalHeaders();l["Content-Type"]="application/json",n.languageCode&&(l["X-Firebase-Locale"]=n.languageCode);const h={method:e,headers:l,...i};return Qm()||(h.referrerPolicy="no-referrer"),n.emulatorConfig&&Ot(n.emulatorConfig.host)&&(h.credentials="include"),K_.fetch()(await X_(n,n.config.apiHost,t,c),h)})}async function Y_(n,e,t){n._canInitEmulator=!1;const s={...sR,...e};try{const r=new oR(n),i=await Promise.race([t(),r.promise]);r.clearNetworkTimeout();const o=await i.json();if("needConfirmation"in o)throw Xr(n,"account-exists-with-different-credential",o);if(i.ok&&!("errorMessage"in o))return o;{const c=i.ok?o.errorMessage:o.error.message,[l,h]=c.split(" : ");if(l==="FEDERATED_USER_ID_ALREADY_LINKED")throw Xr(n,"credential-already-in-use",o);if(l==="EMAIL_EXISTS")throw Xr(n,"email-already-in-use",o);if(l==="USER_DISABLED")throw Xr(n,"user-disabled",o);const f=s[l]||l.toLowerCase().replace(/[_\s]+/g,"-");if(h)throw G_(n,f,h);gd(n,f)}}catch(r){if(r instanceof It)throw r;gd(n,"network-request-failed",{message:String(r)})}}async function X_(n,e,t,s){const r=`${e}${t}?${s}`,i=n,o=i.config.emulator?nR(n.config,r):`${n.config.apiScheme}://${r}`;return rR.includes(t)&&(await i._persistenceManagerAvailable,i._getPersistenceType()==="COOKIE")?i._getPersistence()._getFinalTarget(o).toString():o}class oR{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,s)=>{this.timer=setTimeout(()=>s(H_(this.auth,"network-request-failed")),iR.get())})}}function Xr(n,e,t){const s={appName:n.name};t.email&&(s.email=t.email),t.phoneNumber&&(s.phoneNumber=t.phoneNumber);const r=H_(n,e,s);return r.customData._tokenResponse=t,r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function aR(n,e){return _o(n,"POST","/v1/accounts:delete",e)}async function Vi(n,e){return _o(n,"POST","/v1/accounts:lookup",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zs(n){if(n)try{const e=new Date(Number(n));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function cR(n,e=!1){const t=ne(n),s=await t.getIdToken(e),r=J_(s);J(r&&r.exp&&r.auth_time&&r.iat,t.auth,"internal-error");const i=typeof r.firebase=="object"?r.firebase:void 0,o=i==null?void 0:i.sign_in_provider;return{claims:r,token:s,authTime:Zs(sa(r.auth_time)),issuedAtTime:Zs(sa(r.iat)),expirationTime:Zs(sa(r.exp)),signInProvider:o||null,signInSecondFactor:(i==null?void 0:i.sign_in_second_factor)||null}}function sa(n){return Number(n)*1e3}function J_(n){const[e,t,s]=n.split(".");if(e===void 0||t===void 0||s===void 0)return ri("JWT malformed, contained fewer than 3 sections"),null;try{const r=ai(t);return r?JSON.parse(r):(ri("Failed to decode base64 JWT payload"),null)}catch(r){return ri("Caught error parsing JWT payload as JSON",r==null?void 0:r.toString()),null}}function Ed(n){const e=J_(n);return J(e,"internal-error"),J(typeof e.exp<"u","internal-error"),J(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function za(n,e,t=!1){if(t)return e;try{return await e}catch(s){throw s instanceof It&&lR(s)&&n.auth.currentUser===n&&await n.auth.signOut(),s}}function lR({code:n}){return n==="auth/user-disabled"||n==="auth/user-token-expired"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class uR{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){const t=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),t}else{this.errorBackoff=3e4;const s=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,s)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ha{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=Zs(this.lastLoginAt),this.creationTime=Zs(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Mi(n){var p;const e=n.auth,t=await n.getIdToken(),s=await za(n,Vi(e,{idToken:t}));J(s==null?void 0:s.users.length,e,"internal-error");const r=s.users[0];n._notifyReloadListener(r);const i=(p=r.providerUserInfo)!=null&&p.length?Z_(r.providerUserInfo):[],o=dR(n.providerData,i),c=n.isAnonymous,l=!(n.email&&r.passwordHash)&&!(o!=null&&o.length),h=c?l:!1,f={uid:r.localId,displayName:r.displayName||null,photoURL:r.photoUrl||null,email:r.email||null,emailVerified:r.emailVerified||!1,phoneNumber:r.phoneNumber||null,tenantId:r.tenantId||null,providerData:o,metadata:new Ha(r.createdAt,r.lastLoginAt),isAnonymous:h};Object.assign(n,f)}async function hR(n){const e=ne(n);await Mi(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function dR(n,e){return[...n.filter(s=>!e.some(r=>r.providerId===s.providerId)),...e]}function Z_(n){return n.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||"",displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function fR(n,e){const t=await Y_(n,{},async()=>{const s=Ja({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:r,apiKey:i}=n.config,o=await X_(n,r,"/v1/token",`key=${i}`),c=await n._getAdditionalHeaders();c["Content-Type"]="application/x-www-form-urlencoded";const l={method:"POST",headers:c,body:s};return n.emulatorConfig&&Ot(n.emulatorConfig.host)&&(l.credentials="include"),K_.fetch()(o,l)});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function pR(n,e){return _o(n,"POST","/v2/accounts:revokeToken",Q_(n,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wn{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){J(e.idToken,"internal-error"),J(typeof e.idToken<"u","internal-error"),J(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):Ed(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){J(e.length!==0,"internal-error");const t=Ed(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(J(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:s,refreshToken:r,expiresIn:i}=await fR(e,t);this.updateTokensAndExpiration(s,r,Number(i))}updateTokensAndExpiration(e,t,s){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+s*1e3}static fromJSON(e,t){const{refreshToken:s,accessToken:r,expirationTime:i}=t,o=new Wn;return s&&(J(typeof s=="string","internal-error",{appName:e}),o.refreshToken=s),r&&(J(typeof r=="string","internal-error",{appName:e}),o.accessToken=r),i&&(J(typeof i=="number","internal-error",{appName:e}),o.expirationTime=i),o}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new Wn,this.toJSON())}_performRefresh(){return Js("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function qt(n,e){J(typeof n=="string"||typeof n>"u","internal-error",{appName:e})}class pt{constructor({uid:e,auth:t,stsTokenManager:s,...r}){this.providerId="firebase",this.proactiveRefresh=new uR(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=s,this.accessToken=s.accessToken,this.displayName=r.displayName||null,this.email=r.email||null,this.emailVerified=r.emailVerified||!1,this.phoneNumber=r.phoneNumber||null,this.photoURL=r.photoURL||null,this.isAnonymous=r.isAnonymous||!1,this.tenantId=r.tenantId||null,this.providerData=r.providerData?[...r.providerData]:[],this.metadata=new Ha(r.createdAt||void 0,r.lastLoginAt||void 0)}async getIdToken(e){const t=await za(this,this.stsTokenManager.getToken(this.auth,e));return J(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return cR(this,e)}reload(){return hR(this)}_assign(e){this!==e&&(J(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>({...t})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new pt({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return t.metadata._copy(this.metadata),t}_onReload(e){J(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let s=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),s=!0),t&&await Mi(this),await this.auth._persistUserIfCurrent(this),s&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(ht(this.auth.app))return Promise.reject(ii(this.auth));const e=await this.getIdToken();return await za(this,aR(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){const s=t.displayName??void 0,r=t.email??void 0,i=t.phoneNumber??void 0,o=t.photoURL??void 0,c=t.tenantId??void 0,l=t._redirectEventId??void 0,h=t.createdAt??void 0,f=t.lastLoginAt??void 0,{uid:p,emailVerified:m,isAnonymous:w,providerData:S,stsTokenManager:k}=t;J(p&&k,e,"internal-error");const N=Wn.fromJSON(this.name,k);J(typeof p=="string",e,"internal-error"),qt(s,e.name),qt(r,e.name),J(typeof m=="boolean",e,"internal-error"),J(typeof w=="boolean",e,"internal-error"),qt(i,e.name),qt(o,e.name),qt(c,e.name),qt(l,e.name),qt(h,e.name),qt(f,e.name);const x=new pt({uid:p,auth:e,email:r,emailVerified:m,displayName:s,isAnonymous:w,photoURL:o,phoneNumber:i,tenantId:c,stsTokenManager:N,createdAt:h,lastLoginAt:f});return S&&Array.isArray(S)&&(x.providerData=S.map(U=>({...U}))),l&&(x._redirectEventId=l),x}static async _fromIdTokenResponse(e,t,s=!1){const r=new Wn;r.updateFromServerResponse(t);const i=new pt({uid:t.localId,auth:e,stsTokenManager:r,isAnonymous:s});return await Mi(i),i}static async _fromGetAccountInfoResponse(e,t,s){const r=t.users[0];J(r.localId!==void 0,"internal-error");const i=r.providerUserInfo!==void 0?Z_(r.providerUserInfo):[],o=!(r.email&&r.passwordHash)&&!(i!=null&&i.length),c=new Wn;c.updateFromIdToken(s);const l=new pt({uid:r.localId,auth:e,stsTokenManager:c,isAnonymous:o}),h={uid:r.localId,displayName:r.displayName||null,photoURL:r.photoUrl||null,email:r.email||null,emailVerified:r.emailVerified||!1,phoneNumber:r.phoneNumber||null,tenantId:r.tenantId||null,providerData:i,metadata:new Ha(r.createdAt,r.lastLoginAt),isAnonymous:!(r.email&&r.passwordHash)&&!(i!=null&&i.length)};return Object.assign(l,h),l}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Td=new Map;function gn(n){Oi(n instanceof Function,"Expected a class definition");let e=Td.get(n);return e?(Oi(e instanceof n,"Instance stored in cache mismatched with class"),e):(e=new n,Td.set(n,e),e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class em{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}em.type="NONE";const vd=em;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ra(n,e,t){return`firebase:${n}:${e}:${t}`}class zn{constructor(e,t,s){this.persistence=e,this.auth=t,this.userKey=s;const{config:r,name:i}=this.auth;this.fullUserKey=ra(this.userKey,r.apiKey,i),this.fullPersistenceKey=ra("persistence",r.apiKey,i),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const t=await Vi(this.auth,{idToken:e}).catch(()=>{});return t?pt._fromGetAccountInfoResponse(this.auth,t,e):null}return pt._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,s="authUser"){if(!t.length)return new zn(gn(vd),e,s);const r=(await Promise.all(t.map(async h=>{if(await h._isAvailable())return h}))).filter(h=>h);let i=r[0]||gn(vd);const o=ra(s,e.config.apiKey,e.name);let c=null;for(const h of t)try{const f=await h._get(o);if(f){let p;if(typeof f=="string"){const m=await Vi(e,{idToken:f}).catch(()=>{});if(!m)break;p=await pt._fromGetAccountInfoResponse(e,m,f)}else p=pt._fromJSON(e,f);h!==i&&(c=p),i=h;break}}catch{}const l=r.filter(h=>h._shouldAllowMigration);return!i._shouldAllowMigration||!l.length?new zn(i,e,s):(i=l[0],c&&await i._set(o,c.toJSON()),await Promise.all(t.map(async h=>{if(h!==i)try{await h._remove(o)}catch{}})),new zn(i,e,s))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Id(n){const e=n.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(yR(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(_R(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(TR(e))return"Blackberry";if(vR(e))return"Webos";if(mR(e))return"Safari";if((e.includes("chrome/")||gR(e))&&!e.includes("edge/"))return"Chrome";if(ER(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,s=n.match(t);if((s==null?void 0:s.length)===2)return s[1]}return"Other"}function _R(n=it()){return/firefox\//i.test(n)}function mR(n=it()){const e=n.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function gR(n=it()){return/crios\//i.test(n)}function yR(n=it()){return/iemobile/i.test(n)}function ER(n=it()){return/android/i.test(n)}function TR(n=it()){return/blackberry/i.test(n)}function vR(n=it()){return/webos/i.test(n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function tm(n,e=[]){let t;switch(n){case"Browser":t=Id(it());break;case"Worker":t=`${Id(it())}-${n}`;break;default:t=n}const s=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${is}/${s}`}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class IR{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const s=i=>new Promise((o,c)=>{try{const l=e(i);o(l)}catch(l){c(l)}});s.onAbort=t,this.queue.push(s);const r=this.queue.length-1;return()=>{this.queue[r]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const s of this.queue)await s(e),s.onAbort&&t.push(s.onAbort)}catch(s){t.reverse();for(const r of t)try{r()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:s==null?void 0:s.message})}}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function wR(n,e={}){return _o(n,"GET","/v2/passwordPolicy",Q_(n,e))}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const AR=6;class CR{constructor(e){var s;const t=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=t.minPasswordLength??AR,t.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=t.maxPasswordLength),t.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=t.containsLowercaseCharacter),t.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=t.containsUppercaseCharacter),t.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=t.containsNumericCharacter),t.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=t.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=((s=e.allowedNonAlphanumericCharacters)==null?void 0:s.join(""))??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){const t={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,t),this.validatePasswordCharacterOptions(e,t),t.isValid&&(t.isValid=t.meetsMinPasswordLength??!0),t.isValid&&(t.isValid=t.meetsMaxPasswordLength??!0),t.isValid&&(t.isValid=t.containsLowercaseLetter??!0),t.isValid&&(t.isValid=t.containsUppercaseLetter??!0),t.isValid&&(t.isValid=t.containsNumericCharacter??!0),t.isValid&&(t.isValid=t.containsNonAlphanumericCharacter??!0),t}validatePasswordLengthOptions(e,t){const s=this.customStrengthOptions.minPasswordLength,r=this.customStrengthOptions.maxPasswordLength;s&&(t.meetsMinPasswordLength=e.length>=s),r&&(t.meetsMaxPasswordLength=e.length<=r)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let s;for(let r=0;r<e.length;r++)s=e.charAt(r),this.updatePasswordCharacterOptionsStatuses(t,s>="a"&&s<="z",s>="A"&&s<="Z",s>="0"&&s<="9",this.allowedNonAlphanumericCharacters.includes(s))}updatePasswordCharacterOptionsStatuses(e,t,s,r,i){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=s)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=r)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=i))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class RR{constructor(e,t,s,r){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=s,this.config=r,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new wd(this),this.idTokenSubscription=new wd(this),this.beforeStateQueue=new IR(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=z_,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=r.sdkClientVersion,this._persistenceManagerAvailable=new Promise(i=>this._resolvePersistenceManagerAvailable=i)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=gn(t)),this._initializationPromise=this.queue(async()=>{var s,r,i;if(!this._deleted&&(this.persistenceManager=await zn.create(this,e),(s=this._resolvePersistenceManagerAvailable)==null||s.call(this),!this._deleted)){if((r=this._popupRedirectResolver)!=null&&r._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=((i=this.currentUser)==null?void 0:i.uid)||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await Vi(this,{idToken:e}),s=await pt._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(s)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var i;if(ht(this.app)){const o=this.app.settings.authIdToken;return o?new Promise(c=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(o).then(c,c))}):this.directlySetCurrentUser(null)}const t=await this.assertedPersistence.getCurrentUser();let s=t,r=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const o=(i=this.redirectUser)==null?void 0:i._redirectEventId,c=s==null?void 0:s._redirectEventId,l=await this.tryRedirectSignIn(e);(!o||o===c)&&(l!=null&&l.user)&&(s=l.user,r=!0)}if(!s)return this.directlySetCurrentUser(null);if(!s._redirectEventId){if(r)try{await this.beforeStateQueue.runMiddleware(s)}catch(o){s=t,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(o))}return s?this.reloadAndSetCurrentUserOrClear(s):this.directlySetCurrentUser(null)}return J(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===s._redirectEventId?this.directlySetCurrentUser(s):this.reloadAndSetCurrentUserOrClear(s)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await Mi(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=tR()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(ht(this.app))return Promise.reject(ii(this));const t=e?ne(e):null;return t&&J(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&J(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return ht(this.app)?Promise.reject(ii(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return ht(this.app)?Promise.reject(ii(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(gn(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await wR(this),t=new CR(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new fr("auth","Firebase",e())}onAuthStateChanged(e,t,s){return this.registerStateListener(this.authStateSubscription,e,t,s)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,s){return this.registerStateListener(this.idTokenSubscription,e,t,s)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const s=this.onAuthStateChanged(()=>{s(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),s={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(s.tenantId=this.tenantId),await pR(this,s)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)==null?void 0:e.toJSON()}}async _setRedirectUser(e,t){const s=await this.getOrInitRedirectPersistenceManager(t);return e===null?s.removeCurrentUser():s.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&gn(e)||this._popupRedirectResolver;J(t,this,"argument-error"),this.redirectPersistenceManager=await zn.create(this,[gn(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,s;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)==null?void 0:t._redirectEventId)===e?this._currentUser:((s=this.redirectUser)==null?void 0:s._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const e=((t=this.currentUser)==null?void 0:t.uid)??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,s,r){if(this._deleted)return()=>{};const i=typeof t=="function"?t:t.next.bind(t);let o=!1;const c=this._isInitialized?Promise.resolve():this._initializationPromise;if(J(c,this,"internal-error"),c.then(()=>{o||i(this.currentUser)}),typeof t=="function"){const l=e.addObserver(t,s,r);return()=>{o=!0,l()}}else{const l=e.addObserver(t);return()=>{o=!0,l()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return J(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=tm(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var r;const e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);const t=await((r=this.heartbeatServiceProvider.getImmediate({optional:!0}))==null?void 0:r.getHeartbeatsHeader());t&&(e["X-Firebase-Client"]=t);const s=await this._getAppCheckToken();return s&&(e["X-Firebase-AppCheck"]=s),e}async _getAppCheckToken(){var t;if(ht(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=await((t=this.appCheckServiceProvider.getImmediate({optional:!0}))==null?void 0:t.getToken());return e!=null&&e.error&&JC(`Error while retrieving App Check token: ${e.error}`),e==null?void 0:e.token}}function SR(n){return ne(n)}class wd{constructor(e){this.auth=e,this.observer=null,this.addObserver=ag(t=>this.observer=t)}get next(){return J(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}function bR(n,e){const t=(e==null?void 0:e.persistence)||[],s=(Array.isArray(t)?t:[t]).map(gn);e!=null&&e.errorMap&&n._updateErrorMap(e.errorMap),n._initializeWithPersistence(s,e==null?void 0:e.popupRedirectResolver)}new Rr(3e4,6e4);/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */new Rr(2e3,1e4);/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */new Rr(3e4,6e4);/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */new Rr(5e3,15e3);var Ad="@firebase/auth",Cd="1.11.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class PR{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)==null?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(s=>{e((s==null?void 0:s.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){J(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function NR(n){switch(n){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function kR(n){Pt(new Tt("auth",(e,{options:t})=>{const s=e.getProvider("app").getImmediate(),r=e.getProvider("heartbeat"),i=e.getProvider("app-check-internal"),{apiKey:o,authDomain:c}=s.options;J(o&&!o.includes(":"),"invalid-api-key",{appName:s.name});const l={apiKey:o,authDomain:c,clientPlatform:n,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:tm(n)},h=new RR(s,r,i,l);return bR(h,t),h},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,s)=>{e.getProvider("auth-internal").initialize()})),Pt(new Tt("auth-internal",e=>{const t=SR(e.getProvider("auth").getImmediate());return(s=>new PR(s))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),Ke(Ad,Cd,NR(n)),Ke(Ad,Cd,"esm2020")}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const DR=300;zm("authIdTokenMaxAge");kR("Browser");export{GR as A,qR as B,iS as C,lS as D,le as T,hv as a,$R as b,LR as c,nS as d,BR as e,QR as f,jR as g,tS as h,rS as i,sw as j,xR as k,XR as l,sS as m,JR as n,KR as o,ZR as p,FR as q,eS as r,YR as s,oS as t,zR as u,aS as v,UR as w,cS as x,WR as y,HR as z};
