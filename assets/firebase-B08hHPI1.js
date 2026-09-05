import{aQ as ww}from"./vendor-c1cwIoHV.js";const vw=()=>{};var op={};/**
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
 */const Lm={NODE_ADMIN:!1,SDK_VERSION:"${JSCORE_VERSION}"};/**
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
 */const O=function(n,e){if(!n)throw Fs(e)},Fs=function(n){return new Error("Firebase Database ("+Lm.SDK_VERSION+") INTERNAL ASSERT FAILED: "+n)};/**
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
 */const Fm=function(n){const e=[];let t=0;for(let r=0;r<n.length;r++){let s=n.charCodeAt(r);s<128?e[t++]=s:s<2048?(e[t++]=s>>6|192,e[t++]=s&63|128):(s&64512)===55296&&r+1<n.length&&(n.charCodeAt(r+1)&64512)===56320?(s=65536+((s&1023)<<10)+(n.charCodeAt(++r)&1023),e[t++]=s>>18|240,e[t++]=s>>12&63|128,e[t++]=s>>6&63|128,e[t++]=s&63|128):(e[t++]=s>>12|224,e[t++]=s>>6&63|128,e[t++]=s&63|128)}return e},Aw=function(n){const e=[];let t=0,r=0;for(;t<n.length;){const s=n[t++];if(s<128)e[r++]=String.fromCharCode(s);else if(s>191&&s<224){const i=n[t++];e[r++]=String.fromCharCode((s&31)<<6|i&63)}else if(s>239&&s<365){const i=n[t++],o=n[t++],a=n[t++],l=((s&7)<<18|(i&63)<<12|(o&63)<<6|a&63)-65536;e[r++]=String.fromCharCode(55296+(l>>10)),e[r++]=String.fromCharCode(56320+(l&1023))}else{const i=n[t++],o=n[t++];e[r++]=String.fromCharCode((s&15)<<12|(i&63)<<6|o&63)}}return e.join("")},oh={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,e){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let s=0;s<n.length;s+=3){const i=n[s],o=s+1<n.length,a=o?n[s+1]:0,l=s+2<n.length,u=l?n[s+2]:0,h=i>>2,f=(i&3)<<4|a>>4;let _=(a&15)<<2|u>>6,g=u&63;l||(g=64,o||(_=64)),r.push(t[h],t[f],t[_],t[g])}return r.join("")},encodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(n):this.encodeByteArray(Fm(n),e)},decodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(n):Aw(this.decodeStringToByteArray(n,e))},decodeStringToByteArray(n,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let s=0;s<n.length;){const i=t[n.charAt(s++)],a=s<n.length?t[n.charAt(s)]:0;++s;const u=s<n.length?t[n.charAt(s)]:64;++s;const f=s<n.length?t[n.charAt(s)]:64;if(++s,i==null||a==null||u==null||f==null)throw new bw;const _=i<<2|a>>4;if(r.push(_),u!==64){const g=a<<4&240|u>>2;if(r.push(g),f!==64){const w=u<<6&192|f;r.push(w)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class bw extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Um=function(n){const e=Fm(n);return oh.encodeByteArray(e,!0)},Ma=function(n){return Um(n).replace(/\./g,"")},La=function(n){try{return oh.decodeString(n,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
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
 */function Rw(n){return Bm(void 0,n)}function Bm(n,e){if(!(e instanceof Object))return e;switch(e.constructor){case Date:const t=e;return new Date(t.getTime());case Object:n===void 0&&(n={});break;case Array:n=[];break;default:return e}for(const t in e)!e.hasOwnProperty(t)||!Sw(t)||(n[t]=Bm(n[t],e[t]));return n}function Sw(n){return n!=="__proto__"}/**
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
 */function qm(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
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
 */const Cw=()=>qm().__FIREBASE_DEFAULTS__,Pw=()=>{if(typeof process>"u"||typeof op>"u")return;const n=op.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},Nw=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=n&&La(n[1]);return e&&JSON.parse(e)},wc=()=>{try{return vw()||Cw()||Pw()||Nw()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},kw=n=>{var e,t;return(t=(e=wc())==null?void 0:e.emulatorHosts)==null?void 0:t[n]},vc=n=>{const e=kw(n);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const r=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),r]:[e.substring(0,t),r]},zm=()=>{var n;return(n=wc())==null?void 0:n.config},Dw=n=>{var e;return(e=wc())==null?void 0:e[`_${n}`]};/**
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
 */class Kt{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,r)=>{t?this.reject(t):this.resolve(r),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,r))}}}/**
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
 */function vt(n){try{return(n.startsWith("http://")||n.startsWith("https://")?new URL(n).hostname:n).endsWith(".cloudworkstations.dev")}catch{return!1}}async function Ao(n){return(await fetch(n,{credentials:"include"})).ok}/**
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
 */function ah(n,e){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},r=e||"demo-project",s=n.iat||0,i=n.sub||n.user_id;if(!i)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const o={iss:`https://securetoken.google.com/${r}`,aud:r,iat:s,exp:s+3600,auth_time:s,sub:i,user_id:i,firebase:{sign_in_provider:"custom",identities:{}},...n};return[Ma(JSON.stringify(t)),Ma(JSON.stringify(o)),""].join(".")}const Vi={};function xw(){const n={prod:[],emulator:[]};for(const e of Object.keys(Vi))Vi[e]?n.emulator.push(e):n.prod.push(e);return n}function Vw(n){let e=document.getElementById(n),t=!1;return e||(e=document.createElement("div"),e.setAttribute("id",n),t=!0),{created:t,element:e}}let ap=!1;function Ac(n,e){if(typeof window>"u"||typeof document>"u"||!vt(window.location.host)||Vi[n]===e||Vi[n]||ap)return;Vi[n]=e;function t(_){return`__firebase__banner__${_}`}const r="__firebase__banner",i=xw().prod.length>0;function o(){const _=document.getElementById(r);_&&_.remove()}function a(_){_.style.display="flex",_.style.background="#7faaf0",_.style.position="fixed",_.style.bottom="5px",_.style.left="5px",_.style.padding=".5em",_.style.borderRadius="5px",_.style.alignItems="center"}function l(_,g){_.setAttribute("width","24"),_.setAttribute("id",g),_.setAttribute("height","24"),_.setAttribute("viewBox","0 0 24 24"),_.setAttribute("fill","none"),_.style.marginLeft="-6px"}function u(){const _=document.createElement("span");return _.style.cursor="pointer",_.style.marginLeft="16px",_.style.fontSize="24px",_.innerHTML=" &times;",_.onclick=()=>{ap=!0,o()},_}function h(_,g){_.setAttribute("id",g),_.innerText="Learn more",_.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",_.setAttribute("target","__blank"),_.style.paddingLeft="5px",_.style.textDecoration="underline"}function f(){const _=Vw(r),g=t("text"),w=document.getElementById(g)||document.createElement("span"),R=t("learnmore"),C=document.getElementById(R)||document.createElement("a"),V=t("preprendIcon"),B=document.getElementById(V)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(_.created){const L=_.element;a(L),h(C,R);const $=u();l(B,V),L.append(B,w,C,$),document.body.appendChild(L)}i?(w.innerText="Preview backend disconnected.",B.innerHTML=`<g clip-path="url(#clip0_6013_33858)">
<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6013_33858">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`):(B.innerHTML=`<g clip-path="url(#clip0_6083_34804)">
<path d="M11.4 15.2H12.6V11.2H11.4V15.2ZM12 10C12.1667 10 12.3056 9.94444 12.4167 9.83333C12.5389 9.71111 12.6 9.56667 12.6 9.4C12.6 9.23333 12.5389 9.09444 12.4167 8.98333C12.3056 8.86111 12.1667 8.8 12 8.8C11.8333 8.8 11.6889 8.86111 11.5667 8.98333C11.4556 9.09444 11.4 9.23333 11.4 9.4C11.4 9.56667 11.4556 9.71111 11.5667 9.83333C11.6889 9.94444 11.8333 10 12 10ZM12 18.4C11.1222 18.4 10.2944 18.2333 9.51667 17.9C8.73889 17.5667 8.05556 17.1111 7.46667 16.5333C6.88889 15.9444 6.43333 15.2611 6.1 14.4833C5.76667 13.7056 5.6 12.8778 5.6 12C5.6 11.1111 5.76667 10.2833 6.1 9.51667C6.43333 8.73889 6.88889 8.06111 7.46667 7.48333C8.05556 6.89444 8.73889 6.43333 9.51667 6.1C10.2944 5.76667 11.1222 5.6 12 5.6C12.8889 5.6 13.7167 5.76667 14.4833 6.1C15.2611 6.43333 15.9389 6.89444 16.5167 7.48333C17.1056 8.06111 17.5667 8.73889 17.9 9.51667C18.2333 10.2833 18.4 11.1111 18.4 12C18.4 12.8778 18.2333 13.7056 17.9 14.4833C17.5667 15.2611 17.1056 15.9444 16.5167 16.5333C15.9389 17.1111 15.2611 17.5667 14.4833 17.9C13.7167 18.2333 12.8889 18.4 12 18.4ZM12 17.2C13.4444 17.2 14.6722 16.6944 15.6833 15.6833C16.6944 14.6722 17.2 13.4444 17.2 12C17.2 10.5556 16.6944 9.32778 15.6833 8.31667C14.6722 7.30555 13.4444 6.8 12 6.8C10.5556 6.8 9.32778 7.30555 8.31667 8.31667C7.30556 9.32778 6.8 10.5556 6.8 12C6.8 13.4444 7.30556 14.6722 8.31667 15.6833C9.32778 16.6944 10.5556 17.2 12 17.2Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6083_34804">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`,w.innerText="Preview backend running in this workspace."),w.setAttribute("id",g)}document.readyState==="loading"?window.addEventListener("DOMContentLoaded",f):f()}/**
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
 */function _t(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function ch(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(_t())}function Gm(){var e;const n=(e=wc())==null?void 0:e.forceEnvironment;if(n==="node")return!0;if(n==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function Ow(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function Mw(){const n=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof n=="object"&&n.id!==void 0}function $m(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function Lw(){return Lm.NODE_ADMIN===!0}function jm(){return!Gm()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function Wm(){return!Gm()&&!!navigator.userAgent&&(navigator.userAgent.includes("Safari")||navigator.userAgent.includes("WebKit"))&&!navigator.userAgent.includes("Chrome")}function Km(){try{return typeof indexedDB=="object"}catch{return!1}}function Fw(){return new Promise((n,e)=>{try{let t=!0;const r="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(r);s.onsuccess=()=>{s.result.close(),t||self.indexedDB.deleteDatabase(r),n(!0)},s.onupgradeneeded=()=>{t=!1},s.onerror=()=>{var i;e(((i=s.error)==null?void 0:i.message)||"")}}catch(t){e(t)}})}/**
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
 */const Uw="FirebaseError";class $t extends Error{constructor(e,t,r){super(t),this.code=e,this.customData=r,this.name=Uw,Object.setPrototypeOf(this,$t.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,bo.prototype.create)}}class bo{constructor(e,t,r){this.service=e,this.serviceName=t,this.errors=r}create(e,...t){const r=t[0]||{},s=`${this.service}/${e}`,i=this.errors[e],o=i?Bw(i,r):"Error",a=`${this.serviceName}: ${o} (${s}).`;return new $t(s,a,r)}}function Bw(n,e){return n.replace(qw,(t,r)=>{const s=e[r];return s!=null?String(s):`<${r}?>`})}const qw=/\{\$([^}]+)}/g;/**
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
 */function Zi(n){return JSON.parse(n)}function Me(n){return JSON.stringify(n)}/**
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
 */const Hm=function(n){let e={},t={},r={},s="";try{const i=n.split(".");e=Zi(La(i[0])||""),t=Zi(La(i[1])||""),s=i[2],r=t.d||{},delete t.d}catch{}return{header:e,claims:t,data:r,signature:s}},zw=function(n){const e=Hm(n),t=e.claims;return!!t&&typeof t=="object"&&t.hasOwnProperty("iat")},Gw=function(n){const e=Hm(n).claims;return typeof e=="object"&&e.admin===!0};/**
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
 */function jt(n,e){return Object.prototype.hasOwnProperty.call(n,e)}function us(n,e){if(Object.prototype.hasOwnProperty.call(n,e))return n[e]}function cu(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}function Fa(n,e,t){const r={};for(const s in n)Object.prototype.hasOwnProperty.call(n,s)&&(r[s]=e.call(t,n[s],s,n));return r}function en(n,e){if(n===e)return!0;const t=Object.keys(n),r=Object.keys(e);for(const s of t){if(!r.includes(s))return!1;const i=n[s],o=e[s];if(cp(i)&&cp(o)){if(!en(i,o))return!1}else if(i!==o)return!1}for(const s of r)if(!t.includes(s))return!1;return!0}function cp(n){return n!==null&&typeof n=="object"}/**
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
 */function lh(n){const e=[];for(const[t,r]of Object.entries(n))Array.isArray(r)?r.forEach(s=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(s))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(r));return e.length?"&"+e.join("&"):""}/**
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
 */class $w{constructor(){this.chain_=[],this.buf_=[],this.W_=[],this.pad_=[],this.inbuf_=0,this.total_=0,this.blockSize=512/8,this.pad_[0]=128;for(let e=1;e<this.blockSize;++e)this.pad_[e]=0;this.reset()}reset(){this.chain_[0]=1732584193,this.chain_[1]=4023233417,this.chain_[2]=2562383102,this.chain_[3]=271733878,this.chain_[4]=3285377520,this.inbuf_=0,this.total_=0}compress_(e,t){t||(t=0);const r=this.W_;if(typeof e=="string")for(let f=0;f<16;f++)r[f]=e.charCodeAt(t)<<24|e.charCodeAt(t+1)<<16|e.charCodeAt(t+2)<<8|e.charCodeAt(t+3),t+=4;else for(let f=0;f<16;f++)r[f]=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3],t+=4;for(let f=16;f<80;f++){const _=r[f-3]^r[f-8]^r[f-14]^r[f-16];r[f]=(_<<1|_>>>31)&4294967295}let s=this.chain_[0],i=this.chain_[1],o=this.chain_[2],a=this.chain_[3],l=this.chain_[4],u,h;for(let f=0;f<80;f++){f<40?f<20?(u=a^i&(o^a),h=1518500249):(u=i^o^a,h=1859775393):f<60?(u=i&o|a&(i|o),h=2400959708):(u=i^o^a,h=3395469782);const _=(s<<5|s>>>27)+u+l+h+r[f]&4294967295;l=a,a=o,o=(i<<30|i>>>2)&4294967295,i=s,s=_}this.chain_[0]=this.chain_[0]+s&4294967295,this.chain_[1]=this.chain_[1]+i&4294967295,this.chain_[2]=this.chain_[2]+o&4294967295,this.chain_[3]=this.chain_[3]+a&4294967295,this.chain_[4]=this.chain_[4]+l&4294967295}update(e,t){if(e==null)return;t===void 0&&(t=e.length);const r=t-this.blockSize;let s=0;const i=this.buf_;let o=this.inbuf_;for(;s<t;){if(o===0)for(;s<=r;)this.compress_(e,s),s+=this.blockSize;if(typeof e=="string"){for(;s<t;)if(i[o]=e.charCodeAt(s),++o,++s,o===this.blockSize){this.compress_(i),o=0;break}}else for(;s<t;)if(i[o]=e[s],++o,++s,o===this.blockSize){this.compress_(i),o=0;break}}this.inbuf_=o,this.total_+=t}digest(){const e=[];let t=this.total_*8;this.inbuf_<56?this.update(this.pad_,56-this.inbuf_):this.update(this.pad_,this.blockSize-(this.inbuf_-56));for(let s=this.blockSize-1;s>=56;s--)this.buf_[s]=t&255,t/=256;this.compress_(this.buf_);let r=0;for(let s=0;s<5;s++)for(let i=24;i>=0;i-=8)e[r]=this.chain_[s]>>i&255,++r;return e}}function jw(n,e){const t=new Ww(n,e);return t.subscribe.bind(t)}class Ww{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(r=>{this.error(r)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,r){let s;if(e===void 0&&t===void 0&&r===void 0)throw new Error("Missing Observer.");Kw(e,["next","error","complete"])?s=e:s={next:e,error:t,complete:r},s.next===void 0&&(s.next=Ul),s.error===void 0&&(s.error=Ul),s.complete===void 0&&(s.complete=Ul);const i=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?s.error(this.finalError):s.complete()}catch{}}),this.observers.push(s),i}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(r){typeof console<"u"&&console.error&&console.error(r)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function Kw(n,e){if(typeof n!="object"||n===null)return!1;for(const t of e)if(t in n&&typeof n[t]=="function")return!0;return!1}function Ul(){}function hs(n,e){return`${n} failed: ${e} argument `}/**
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
 */const Hw=function(n){const e=[];let t=0;for(let r=0;r<n.length;r++){let s=n.charCodeAt(r);if(s>=55296&&s<=56319){const i=s-55296;r++,O(r<n.length,"Surrogate pair missing trail surrogate.");const o=n.charCodeAt(r)-56320;s=65536+(i<<10)+o}s<128?e[t++]=s:s<2048?(e[t++]=s>>6|192,e[t++]=s&63|128):s<65536?(e[t++]=s>>12|224,e[t++]=s>>6&63|128,e[t++]=s&63|128):(e[t++]=s>>18|240,e[t++]=s>>12&63|128,e[t++]=s>>6&63|128,e[t++]=s&63|128)}return e},bc=function(n){let e=0;for(let t=0;t<n.length;t++){const r=n.charCodeAt(t);r<128?e++:r<2048?e+=2:r>=55296&&r<=56319?(e+=4,t++):e+=3}return e};/**
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
 */function X(n){return n&&n._delegate?n._delegate:n}class qt{constructor(e,t,r){this.name=e,this.instanceFactory=t,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
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
 */const ir="[DEFAULT]";/**
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
 */class Qw{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const r=new Kt;if(this.instancesDeferred.set(t,r),this.isInitialized(t)||this.shouldAutoInitialize())try{const s=this.getOrInitializeService({instanceIdentifier:t});s&&r.resolve(s)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),r=(e==null?void 0:e.optional)??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(s){if(r)return null;throw s}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(Xw(e))try{this.getOrInitializeService({instanceIdentifier:ir})}catch{}for(const[t,r]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(t);try{const i=this.getOrInitializeService({instanceIdentifier:s});r.resolve(i)}catch{}}}}clearInstance(e=ir){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=ir){return this.instances.has(e)}getOptions(e=ir){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,r=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:r,options:t});for(const[i,o]of this.instancesDeferred.entries()){const a=this.normalizeInstanceIdentifier(i);r===a&&o.resolve(s)}return s}onInit(e,t){const r=this.normalizeInstanceIdentifier(t),s=this.onInitCallbacks.get(r)??new Set;s.add(e),this.onInitCallbacks.set(r,s);const i=this.instances.get(r);return i&&e(i,r),()=>{s.delete(e)}}invokeOnInitCallbacks(e,t){const r=this.onInitCallbacks.get(t);if(r)for(const s of r)try{s(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let r=this.instances.get(e);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:Yw(e),options:t}),this.instances.set(e,r),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(r,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,r)}catch{}return r||null}normalizeInstanceIdentifier(e=ir){return this.component?this.component.multipleInstances?e:ir:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Yw(n){return n===ir?void 0:n}function Xw(n){return n.instantiationMode==="EAGER"}/**
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
 */class Jw{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new Qw(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
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
 */var re;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(re||(re={}));const Zw={debug:re.DEBUG,verbose:re.VERBOSE,info:re.INFO,warn:re.WARN,error:re.ERROR,silent:re.SILENT},ev=re.INFO,tv={[re.DEBUG]:"log",[re.VERBOSE]:"log",[re.INFO]:"info",[re.WARN]:"warn",[re.ERROR]:"error"},nv=(n,e,...t)=>{if(e<n.logLevel)return;const r=new Date().toISOString(),s=tv[e];if(s)console[s](`[${r}]  ${n.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class Rc{constructor(e){this.name=e,this._logLevel=ev,this._logHandler=nv,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in re))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?Zw[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,re.DEBUG,...e),this._logHandler(this,re.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,re.VERBOSE,...e),this._logHandler(this,re.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,re.INFO,...e),this._logHandler(this,re.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,re.WARN,...e),this._logHandler(this,re.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,re.ERROR,...e),this._logHandler(this,re.ERROR,...e)}}/**
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
 */class rv{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(sv(t)){const r=t.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(t=>t).join(" ")}}function sv(n){const e=n.getComponent();return(e==null?void 0:e.type)==="VERSION"}const lu="@firebase/app",lp="0.14.5";/**
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
 */const tn=new Rc("@firebase/app"),iv="@firebase/app-compat",ov="@firebase/analytics-compat",av="@firebase/analytics",cv="@firebase/app-check-compat",lv="@firebase/app-check",uv="@firebase/auth",hv="@firebase/auth-compat",dv="@firebase/database",fv="@firebase/data-connect",pv="@firebase/database-compat",_v="@firebase/functions",mv="@firebase/functions-compat",gv="@firebase/installations",yv="@firebase/installations-compat",Iv="@firebase/messaging",Ev="@firebase/messaging-compat",Tv="@firebase/performance",wv="@firebase/performance-compat",vv="@firebase/remote-config",Av="@firebase/remote-config-compat",bv="@firebase/storage",Rv="@firebase/storage-compat",Sv="@firebase/firestore",Cv="@firebase/ai",Pv="@firebase/firestore-compat",Nv="firebase",kv="12.5.0";/**
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
 */const Ua="[DEFAULT]",Dv={[lu]:"fire-core",[iv]:"fire-core-compat",[av]:"fire-analytics",[ov]:"fire-analytics-compat",[lv]:"fire-app-check",[cv]:"fire-app-check-compat",[uv]:"fire-auth",[hv]:"fire-auth-compat",[dv]:"fire-rtdb",[fv]:"fire-data-connect",[pv]:"fire-rtdb-compat",[_v]:"fire-fn",[mv]:"fire-fn-compat",[gv]:"fire-iid",[yv]:"fire-iid-compat",[Iv]:"fire-fcm",[Ev]:"fire-fcm-compat",[Tv]:"fire-perf",[wv]:"fire-perf-compat",[vv]:"fire-rc",[Av]:"fire-rc-compat",[bv]:"fire-gcs",[Rv]:"fire-gcs-compat",[Sv]:"fire-fst",[Pv]:"fire-fst-compat",[Cv]:"fire-vertex","fire-js":"fire-js",[Nv]:"fire-js-all"};/**
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
 */const Ba=new Map,xv=new Map,uu=new Map;function up(n,e){try{n.container.addComponent(e)}catch(t){tn.debug(`Component ${e.name} failed to register with FirebaseApp ${n.name}`,t)}}function nn(n){const e=n.name;if(uu.has(e))return tn.debug(`There were multiple attempts to register component ${e}.`),!1;uu.set(e,n);for(const t of Ba.values())up(t,n);for(const t of xv.values())up(t,n);return!0}function Us(n,e){const t=n.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),n.container.getProvider(e)}function Vv(n,e,t=Ua){Us(n,e).clearInstance(t)}function Vt(n){return n==null?!1:n.settings!==void 0}/**
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
 */const Ov={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},Sn=new bo("app","Firebase",Ov);/**
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
 */class Mv{constructor(e,t,r){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new qt("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw Sn.create("app-deleted",{appName:this._name})}}/**
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
 */const Bs=kv;function Qm(n,e={}){let t=n;typeof e!="object"&&(e={name:e});const r={name:Ua,automaticDataCollectionEnabled:!0,...e},s=r.name;if(typeof s!="string"||!s)throw Sn.create("bad-app-name",{appName:String(s)});if(t||(t=zm()),!t)throw Sn.create("no-options");const i=Ba.get(s);if(i){if(en(t,i.options)&&en(r,i.config))return i;throw Sn.create("duplicate-app",{appName:s})}const o=new Jw(s);for(const l of uu.values())o.addComponent(l);const a=new Mv(t,r,o);return Ba.set(s,a),a}function Sc(n=Ua){const e=Ba.get(n);if(!e&&n===Ua&&zm())return Qm();if(!e)throw Sn.create("no-app",{appName:n});return e}function ht(n,e,t){let r=Dv[n]??n;t&&(r+=`-${t}`);const s=r.match(/\s|\//),i=e.match(/\s|\//);if(s||i){const o=[`Unable to register library "${r}" with version "${e}":`];s&&o.push(`library name "${r}" contains illegal characters (whitespace or "/")`),s&&i&&o.push("and"),i&&o.push(`version name "${e}" contains illegal characters (whitespace or "/")`),tn.warn(o.join(" "));return}nn(new qt(`${r}-version`,()=>({library:r,version:e}),"VERSION"))}/**
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
 */const Lv="firebase-heartbeat-database",Fv=1,eo="firebase-heartbeat-store";let Bl=null;function Ym(){return Bl||(Bl=ww(Lv,Fv,{upgrade:(n,e)=>{switch(e){case 0:try{n.createObjectStore(eo)}catch(t){console.warn(t)}}}}).catch(n=>{throw Sn.create("idb-open",{originalErrorMessage:n.message})})),Bl}async function Uv(n){try{const t=(await Ym()).transaction(eo),r=await t.objectStore(eo).get(Xm(n));return await t.done,r}catch(e){if(e instanceof $t)tn.warn(e.message);else{const t=Sn.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});tn.warn(t.message)}}}async function hp(n,e){try{const r=(await Ym()).transaction(eo,"readwrite");await r.objectStore(eo).put(e,Xm(n)),await r.done}catch(t){if(t instanceof $t)tn.warn(t.message);else{const r=Sn.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});tn.warn(r.message)}}}function Xm(n){return`${n.name}!${n.options.appId}`}/**
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
 */const Bv=1024,qv=30;class zv{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new $v(t),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var e,t;try{const s=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),i=dp();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===i||this._heartbeatsCache.heartbeats.some(o=>o.date===i))return;if(this._heartbeatsCache.heartbeats.push({date:i,agent:s}),this._heartbeatsCache.heartbeats.length>qv){const o=jv(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(o,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){tn.warn(r)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=dp(),{heartbeatsToSend:r,unsentEntries:s}=Gv(this._heartbeatsCache.heartbeats),i=Ma(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=t,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),i}catch(t){return tn.warn(t),""}}}function dp(){return new Date().toISOString().substring(0,10)}function Gv(n,e=Bv){const t=[];let r=n.slice();for(const s of n){const i=t.find(o=>o.agent===s.agent);if(i){if(i.dates.push(s.date),fp(t)>e){i.dates.pop();break}}else if(t.push({agent:s.agent,dates:[s.date]}),fp(t)>e){t.pop();break}r=r.slice(1)}return{heartbeatsToSend:t,unsentEntries:r}}class $v{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Km()?Fw().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await Uv(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return hp(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return hp(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...e.heartbeats]})}else return}}function fp(n){return Ma(JSON.stringify({version:2,heartbeats:n})).length}function jv(n){if(n.length===0)return-1;let e=0,t=n[0].date;for(let r=1;r<n.length;r++)n[r].date<t&&(t=n[r].date,e=r);return e}/**
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
 */function Wv(n){nn(new qt("platform-logger",e=>new rv(e),"PRIVATE")),nn(new qt("heartbeat",e=>new zv(e),"PRIVATE")),ht(lu,lp,n),ht(lu,lp,"esm2020"),ht("fire-js","")}Wv("");var Kv="firebase",Hv="12.5.0";/**
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
 */ht(Kv,Hv,"app");var pp=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Cn,Jm;(function(){var n;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(T,y){function E(){}E.prototype=y.prototype,T.F=y.prototype,T.prototype=new E,T.prototype.constructor=T,T.D=function(A,v,N){for(var I=Array(arguments.length-2),rt=2;rt<arguments.length;rt++)I[rt-2]=arguments[rt];return y.prototype[v].apply(A,I)}}function t(){this.blockSize=-1}function r(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}e(r,t),r.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function s(T,y,E){E||(E=0);const A=Array(16);if(typeof y=="string")for(var v=0;v<16;++v)A[v]=y.charCodeAt(E++)|y.charCodeAt(E++)<<8|y.charCodeAt(E++)<<16|y.charCodeAt(E++)<<24;else for(v=0;v<16;++v)A[v]=y[E++]|y[E++]<<8|y[E++]<<16|y[E++]<<24;y=T.g[0],E=T.g[1],v=T.g[2];let N=T.g[3],I;I=y+(N^E&(v^N))+A[0]+3614090360&4294967295,y=E+(I<<7&4294967295|I>>>25),I=N+(v^y&(E^v))+A[1]+3905402710&4294967295,N=y+(I<<12&4294967295|I>>>20),I=v+(E^N&(y^E))+A[2]+606105819&4294967295,v=N+(I<<17&4294967295|I>>>15),I=E+(y^v&(N^y))+A[3]+3250441966&4294967295,E=v+(I<<22&4294967295|I>>>10),I=y+(N^E&(v^N))+A[4]+4118548399&4294967295,y=E+(I<<7&4294967295|I>>>25),I=N+(v^y&(E^v))+A[5]+1200080426&4294967295,N=y+(I<<12&4294967295|I>>>20),I=v+(E^N&(y^E))+A[6]+2821735955&4294967295,v=N+(I<<17&4294967295|I>>>15),I=E+(y^v&(N^y))+A[7]+4249261313&4294967295,E=v+(I<<22&4294967295|I>>>10),I=y+(N^E&(v^N))+A[8]+1770035416&4294967295,y=E+(I<<7&4294967295|I>>>25),I=N+(v^y&(E^v))+A[9]+2336552879&4294967295,N=y+(I<<12&4294967295|I>>>20),I=v+(E^N&(y^E))+A[10]+4294925233&4294967295,v=N+(I<<17&4294967295|I>>>15),I=E+(y^v&(N^y))+A[11]+2304563134&4294967295,E=v+(I<<22&4294967295|I>>>10),I=y+(N^E&(v^N))+A[12]+1804603682&4294967295,y=E+(I<<7&4294967295|I>>>25),I=N+(v^y&(E^v))+A[13]+4254626195&4294967295,N=y+(I<<12&4294967295|I>>>20),I=v+(E^N&(y^E))+A[14]+2792965006&4294967295,v=N+(I<<17&4294967295|I>>>15),I=E+(y^v&(N^y))+A[15]+1236535329&4294967295,E=v+(I<<22&4294967295|I>>>10),I=y+(v^N&(E^v))+A[1]+4129170786&4294967295,y=E+(I<<5&4294967295|I>>>27),I=N+(E^v&(y^E))+A[6]+3225465664&4294967295,N=y+(I<<9&4294967295|I>>>23),I=v+(y^E&(N^y))+A[11]+643717713&4294967295,v=N+(I<<14&4294967295|I>>>18),I=E+(N^y&(v^N))+A[0]+3921069994&4294967295,E=v+(I<<20&4294967295|I>>>12),I=y+(v^N&(E^v))+A[5]+3593408605&4294967295,y=E+(I<<5&4294967295|I>>>27),I=N+(E^v&(y^E))+A[10]+38016083&4294967295,N=y+(I<<9&4294967295|I>>>23),I=v+(y^E&(N^y))+A[15]+3634488961&4294967295,v=N+(I<<14&4294967295|I>>>18),I=E+(N^y&(v^N))+A[4]+3889429448&4294967295,E=v+(I<<20&4294967295|I>>>12),I=y+(v^N&(E^v))+A[9]+568446438&4294967295,y=E+(I<<5&4294967295|I>>>27),I=N+(E^v&(y^E))+A[14]+3275163606&4294967295,N=y+(I<<9&4294967295|I>>>23),I=v+(y^E&(N^y))+A[3]+4107603335&4294967295,v=N+(I<<14&4294967295|I>>>18),I=E+(N^y&(v^N))+A[8]+1163531501&4294967295,E=v+(I<<20&4294967295|I>>>12),I=y+(v^N&(E^v))+A[13]+2850285829&4294967295,y=E+(I<<5&4294967295|I>>>27),I=N+(E^v&(y^E))+A[2]+4243563512&4294967295,N=y+(I<<9&4294967295|I>>>23),I=v+(y^E&(N^y))+A[7]+1735328473&4294967295,v=N+(I<<14&4294967295|I>>>18),I=E+(N^y&(v^N))+A[12]+2368359562&4294967295,E=v+(I<<20&4294967295|I>>>12),I=y+(E^v^N)+A[5]+4294588738&4294967295,y=E+(I<<4&4294967295|I>>>28),I=N+(y^E^v)+A[8]+2272392833&4294967295,N=y+(I<<11&4294967295|I>>>21),I=v+(N^y^E)+A[11]+1839030562&4294967295,v=N+(I<<16&4294967295|I>>>16),I=E+(v^N^y)+A[14]+4259657740&4294967295,E=v+(I<<23&4294967295|I>>>9),I=y+(E^v^N)+A[1]+2763975236&4294967295,y=E+(I<<4&4294967295|I>>>28),I=N+(y^E^v)+A[4]+1272893353&4294967295,N=y+(I<<11&4294967295|I>>>21),I=v+(N^y^E)+A[7]+4139469664&4294967295,v=N+(I<<16&4294967295|I>>>16),I=E+(v^N^y)+A[10]+3200236656&4294967295,E=v+(I<<23&4294967295|I>>>9),I=y+(E^v^N)+A[13]+681279174&4294967295,y=E+(I<<4&4294967295|I>>>28),I=N+(y^E^v)+A[0]+3936430074&4294967295,N=y+(I<<11&4294967295|I>>>21),I=v+(N^y^E)+A[3]+3572445317&4294967295,v=N+(I<<16&4294967295|I>>>16),I=E+(v^N^y)+A[6]+76029189&4294967295,E=v+(I<<23&4294967295|I>>>9),I=y+(E^v^N)+A[9]+3654602809&4294967295,y=E+(I<<4&4294967295|I>>>28),I=N+(y^E^v)+A[12]+3873151461&4294967295,N=y+(I<<11&4294967295|I>>>21),I=v+(N^y^E)+A[15]+530742520&4294967295,v=N+(I<<16&4294967295|I>>>16),I=E+(v^N^y)+A[2]+3299628645&4294967295,E=v+(I<<23&4294967295|I>>>9),I=y+(v^(E|~N))+A[0]+4096336452&4294967295,y=E+(I<<6&4294967295|I>>>26),I=N+(E^(y|~v))+A[7]+1126891415&4294967295,N=y+(I<<10&4294967295|I>>>22),I=v+(y^(N|~E))+A[14]+2878612391&4294967295,v=N+(I<<15&4294967295|I>>>17),I=E+(N^(v|~y))+A[5]+4237533241&4294967295,E=v+(I<<21&4294967295|I>>>11),I=y+(v^(E|~N))+A[12]+1700485571&4294967295,y=E+(I<<6&4294967295|I>>>26),I=N+(E^(y|~v))+A[3]+2399980690&4294967295,N=y+(I<<10&4294967295|I>>>22),I=v+(y^(N|~E))+A[10]+4293915773&4294967295,v=N+(I<<15&4294967295|I>>>17),I=E+(N^(v|~y))+A[1]+2240044497&4294967295,E=v+(I<<21&4294967295|I>>>11),I=y+(v^(E|~N))+A[8]+1873313359&4294967295,y=E+(I<<6&4294967295|I>>>26),I=N+(E^(y|~v))+A[15]+4264355552&4294967295,N=y+(I<<10&4294967295|I>>>22),I=v+(y^(N|~E))+A[6]+2734768916&4294967295,v=N+(I<<15&4294967295|I>>>17),I=E+(N^(v|~y))+A[13]+1309151649&4294967295,E=v+(I<<21&4294967295|I>>>11),I=y+(v^(E|~N))+A[4]+4149444226&4294967295,y=E+(I<<6&4294967295|I>>>26),I=N+(E^(y|~v))+A[11]+3174756917&4294967295,N=y+(I<<10&4294967295|I>>>22),I=v+(y^(N|~E))+A[2]+718787259&4294967295,v=N+(I<<15&4294967295|I>>>17),I=E+(N^(v|~y))+A[9]+3951481745&4294967295,T.g[0]=T.g[0]+y&4294967295,T.g[1]=T.g[1]+(v+(I<<21&4294967295|I>>>11))&4294967295,T.g[2]=T.g[2]+v&4294967295,T.g[3]=T.g[3]+N&4294967295}r.prototype.v=function(T,y){y===void 0&&(y=T.length);const E=y-this.blockSize,A=this.C;let v=this.h,N=0;for(;N<y;){if(v==0)for(;N<=E;)s(this,T,N),N+=this.blockSize;if(typeof T=="string"){for(;N<y;)if(A[v++]=T.charCodeAt(N++),v==this.blockSize){s(this,A),v=0;break}}else for(;N<y;)if(A[v++]=T[N++],v==this.blockSize){s(this,A),v=0;break}}this.h=v,this.o+=y},r.prototype.A=function(){var T=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);T[0]=128;for(var y=1;y<T.length-8;++y)T[y]=0;y=this.o*8;for(var E=T.length-8;E<T.length;++E)T[E]=y&255,y/=256;for(this.v(T),T=Array(16),y=0,E=0;E<4;++E)for(let A=0;A<32;A+=8)T[y++]=this.g[E]>>>A&255;return T};function i(T,y){var E=a;return Object.prototype.hasOwnProperty.call(E,T)?E[T]:E[T]=y(T)}function o(T,y){this.h=y;const E=[];let A=!0;for(let v=T.length-1;v>=0;v--){const N=T[v]|0;A&&N==y||(E[v]=N,A=!1)}this.g=E}var a={};function l(T){return-128<=T&&T<128?i(T,function(y){return new o([y|0],y<0?-1:0)}):new o([T|0],T<0?-1:0)}function u(T){if(isNaN(T)||!isFinite(T))return f;if(T<0)return C(u(-T));const y=[];let E=1;for(let A=0;T>=E;A++)y[A]=T/E|0,E*=4294967296;return new o(y,0)}function h(T,y){if(T.length==0)throw Error("number format error: empty string");if(y=y||10,y<2||36<y)throw Error("radix out of range: "+y);if(T.charAt(0)=="-")return C(h(T.substring(1),y));if(T.indexOf("-")>=0)throw Error('number format error: interior "-" character');const E=u(Math.pow(y,8));let A=f;for(let N=0;N<T.length;N+=8){var v=Math.min(8,T.length-N);const I=parseInt(T.substring(N,N+v),y);v<8?(v=u(Math.pow(y,v)),A=A.j(v).add(u(I))):(A=A.j(E),A=A.add(u(I)))}return A}var f=l(0),_=l(1),g=l(16777216);n=o.prototype,n.m=function(){if(R(this))return-C(this).m();let T=0,y=1;for(let E=0;E<this.g.length;E++){const A=this.i(E);T+=(A>=0?A:4294967296+A)*y,y*=4294967296}return T},n.toString=function(T){if(T=T||10,T<2||36<T)throw Error("radix out of range: "+T);if(w(this))return"0";if(R(this))return"-"+C(this).toString(T);const y=u(Math.pow(T,6));var E=this;let A="";for(;;){const v=$(E,y).g;E=V(E,v.j(y));let N=((E.g.length>0?E.g[0]:E.h)>>>0).toString(T);if(E=v,w(E))return N+A;for(;N.length<6;)N="0"+N;A=N+A}},n.i=function(T){return T<0?0:T<this.g.length?this.g[T]:this.h};function w(T){if(T.h!=0)return!1;for(let y=0;y<T.g.length;y++)if(T.g[y]!=0)return!1;return!0}function R(T){return T.h==-1}n.l=function(T){return T=V(this,T),R(T)?-1:w(T)?0:1};function C(T){const y=T.g.length,E=[];for(let A=0;A<y;A++)E[A]=~T.g[A];return new o(E,~T.h).add(_)}n.abs=function(){return R(this)?C(this):this},n.add=function(T){const y=Math.max(this.g.length,T.g.length),E=[];let A=0;for(let v=0;v<=y;v++){let N=A+(this.i(v)&65535)+(T.i(v)&65535),I=(N>>>16)+(this.i(v)>>>16)+(T.i(v)>>>16);A=I>>>16,N&=65535,I&=65535,E[v]=I<<16|N}return new o(E,E[E.length-1]&-2147483648?-1:0)};function V(T,y){return T.add(C(y))}n.j=function(T){if(w(this)||w(T))return f;if(R(this))return R(T)?C(this).j(C(T)):C(C(this).j(T));if(R(T))return C(this.j(C(T)));if(this.l(g)<0&&T.l(g)<0)return u(this.m()*T.m());const y=this.g.length+T.g.length,E=[];for(var A=0;A<2*y;A++)E[A]=0;for(A=0;A<this.g.length;A++)for(let v=0;v<T.g.length;v++){const N=this.i(A)>>>16,I=this.i(A)&65535,rt=T.i(v)>>>16,Jn=T.i(v)&65535;E[2*A+2*v]+=I*Jn,B(E,2*A+2*v),E[2*A+2*v+1]+=N*Jn,B(E,2*A+2*v+1),E[2*A+2*v+1]+=I*rt,B(E,2*A+2*v+1),E[2*A+2*v+2]+=N*rt,B(E,2*A+2*v+2)}for(T=0;T<y;T++)E[T]=E[2*T+1]<<16|E[2*T];for(T=y;T<2*y;T++)E[T]=0;return new o(E,0)};function B(T,y){for(;(T[y]&65535)!=T[y];)T[y+1]+=T[y]>>>16,T[y]&=65535,y++}function L(T,y){this.g=T,this.h=y}function $(T,y){if(w(y))throw Error("division by zero");if(w(T))return new L(f,f);if(R(T))return y=$(C(T),y),new L(C(y.g),C(y.h));if(R(y))return y=$(T,C(y)),new L(C(y.g),y.h);if(T.g.length>30){if(R(T)||R(y))throw Error("slowDivide_ only works with positive integers.");for(var E=_,A=y;A.l(T)<=0;)E=ne(E),A=ne(A);var v=H(E,1),N=H(A,1);for(A=H(A,2),E=H(E,2);!w(A);){var I=N.add(A);I.l(T)<=0&&(v=v.add(E),N=I),A=H(A,1),E=H(E,1)}return y=V(T,v.j(y)),new L(v,y)}for(v=f;T.l(y)>=0;){for(E=Math.max(1,Math.floor(T.m()/y.m())),A=Math.ceil(Math.log(E)/Math.LN2),A=A<=48?1:Math.pow(2,A-48),N=u(E),I=N.j(y);R(I)||I.l(T)>0;)E-=A,N=u(E),I=N.j(y);w(N)&&(N=_),v=v.add(N),T=V(T,I)}return new L(v,T)}n.B=function(T){return $(this,T).h},n.and=function(T){const y=Math.max(this.g.length,T.g.length),E=[];for(let A=0;A<y;A++)E[A]=this.i(A)&T.i(A);return new o(E,this.h&T.h)},n.or=function(T){const y=Math.max(this.g.length,T.g.length),E=[];for(let A=0;A<y;A++)E[A]=this.i(A)|T.i(A);return new o(E,this.h|T.h)},n.xor=function(T){const y=Math.max(this.g.length,T.g.length),E=[];for(let A=0;A<y;A++)E[A]=this.i(A)^T.i(A);return new o(E,this.h^T.h)};function ne(T){const y=T.g.length+1,E=[];for(let A=0;A<y;A++)E[A]=T.i(A)<<1|T.i(A-1)>>>31;return new o(E,T.h)}function H(T,y){const E=y>>5;y%=32;const A=T.g.length-E,v=[];for(let N=0;N<A;N++)v[N]=y>0?T.i(N+E)>>>y|T.i(N+E+1)<<32-y:T.i(N+E);return new o(v,T.h)}r.prototype.digest=r.prototype.A,r.prototype.reset=r.prototype.u,r.prototype.update=r.prototype.v,Jm=r,o.prototype.add=o.prototype.add,o.prototype.multiply=o.prototype.j,o.prototype.modulo=o.prototype.B,o.prototype.compare=o.prototype.l,o.prototype.toNumber=o.prototype.m,o.prototype.toString=o.prototype.toString,o.prototype.getBits=o.prototype.i,o.fromNumber=u,o.fromString=h,Cn=o}).apply(typeof pp<"u"?pp:typeof self<"u"?self:typeof window<"u"?window:{});var ua=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Zm,Pi,eg,va,hu,tg,ng,rg;(function(){var n,e=Object.defineProperty;function t(c){c=[typeof globalThis=="object"&&globalThis,c,typeof window=="object"&&window,typeof self=="object"&&self,typeof ua=="object"&&ua];for(var d=0;d<c.length;++d){var p=c[d];if(p&&p.Math==Math)return p}throw Error("Cannot find global object")}var r=t(this);function s(c,d){if(d)e:{var p=r;c=c.split(".");for(var m=0;m<c.length-1;m++){var S=c[m];if(!(S in p))break e;p=p[S]}c=c[c.length-1],m=p[c],d=d(m),d!=m&&d!=null&&e(p,c,{configurable:!0,writable:!0,value:d})}}s("Symbol.dispose",function(c){return c||Symbol("Symbol.dispose")}),s("Array.prototype.values",function(c){return c||function(){return this[Symbol.iterator]()}}),s("Object.entries",function(c){return c||function(d){var p=[],m;for(m in d)Object.prototype.hasOwnProperty.call(d,m)&&p.push([m,d[m]]);return p}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var i=i||{},o=this||self;function a(c){var d=typeof c;return d=="object"&&c!=null||d=="function"}function l(c,d,p){return c.call.apply(c.bind,arguments)}function u(c,d,p){return u=l,u.apply(null,arguments)}function h(c,d){var p=Array.prototype.slice.call(arguments,1);return function(){var m=p.slice();return m.push.apply(m,arguments),c.apply(this,m)}}function f(c,d){function p(){}p.prototype=d.prototype,c.Z=d.prototype,c.prototype=new p,c.prototype.constructor=c,c.Ob=function(m,S,k){for(var U=Array(arguments.length-2),Q=2;Q<arguments.length;Q++)U[Q-2]=arguments[Q];return d.prototype[S].apply(m,U)}}var _=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?c=>c&&AsyncContext.Snapshot.wrap(c):c=>c;function g(c){const d=c.length;if(d>0){const p=Array(d);for(let m=0;m<d;m++)p[m]=c[m];return p}return[]}function w(c,d){for(let m=1;m<arguments.length;m++){const S=arguments[m];var p=typeof S;if(p=p!="object"?p:S?Array.isArray(S)?"array":p:"null",p=="array"||p=="object"&&typeof S.length=="number"){p=c.length||0;const k=S.length||0;c.length=p+k;for(let U=0;U<k;U++)c[p+U]=S[U]}else c.push(S)}}class R{constructor(d,p){this.i=d,this.j=p,this.h=0,this.g=null}get(){let d;return this.h>0?(this.h--,d=this.g,this.g=d.next,d.next=null):d=this.i(),d}}function C(c){o.setTimeout(()=>{throw c},0)}function V(){var c=T;let d=null;return c.g&&(d=c.g,c.g=c.g.next,c.g||(c.h=null),d.next=null),d}class B{constructor(){this.h=this.g=null}add(d,p){const m=L.get();m.set(d,p),this.h?this.h.next=m:this.g=m,this.h=m}}var L=new R(()=>new $,c=>c.reset());class ${constructor(){this.next=this.g=this.h=null}set(d,p){this.h=d,this.g=p,this.next=null}reset(){this.next=this.g=this.h=null}}let ne,H=!1,T=new B,y=()=>{const c=Promise.resolve(void 0);ne=()=>{c.then(E)}};function E(){for(var c;c=V();){try{c.h.call(c.g)}catch(p){C(p)}var d=L;d.j(c),d.h<100&&(d.h++,c.next=d.g,d.g=c)}H=!1}function A(){this.u=this.u,this.C=this.C}A.prototype.u=!1,A.prototype.dispose=function(){this.u||(this.u=!0,this.N())},A.prototype[Symbol.dispose]=function(){this.dispose()},A.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function v(c,d){this.type=c,this.g=this.target=d,this.defaultPrevented=!1}v.prototype.h=function(){this.defaultPrevented=!0};var N=(function(){if(!o.addEventListener||!Object.defineProperty)return!1;var c=!1,d=Object.defineProperty({},"passive",{get:function(){c=!0}});try{const p=()=>{};o.addEventListener("test",p,d),o.removeEventListener("test",p,d)}catch{}return c})();function I(c){return/^[\s\xa0]*$/.test(c)}function rt(c,d){v.call(this,c?c.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,c&&this.init(c,d)}f(rt,v),rt.prototype.init=function(c,d){const p=this.type=c.type,m=c.changedTouches&&c.changedTouches.length?c.changedTouches[0]:null;this.target=c.target||c.srcElement,this.g=d,d=c.relatedTarget,d||(p=="mouseover"?d=c.fromElement:p=="mouseout"&&(d=c.toElement)),this.relatedTarget=d,m?(this.clientX=m.clientX!==void 0?m.clientX:m.pageX,this.clientY=m.clientY!==void 0?m.clientY:m.pageY,this.screenX=m.screenX||0,this.screenY=m.screenY||0):(this.clientX=c.clientX!==void 0?c.clientX:c.pageX,this.clientY=c.clientY!==void 0?c.clientY:c.pageY,this.screenX=c.screenX||0,this.screenY=c.screenY||0),this.button=c.button,this.key=c.key||"",this.ctrlKey=c.ctrlKey,this.altKey=c.altKey,this.shiftKey=c.shiftKey,this.metaKey=c.metaKey,this.pointerId=c.pointerId||0,this.pointerType=c.pointerType,this.state=c.state,this.i=c,c.defaultPrevented&&rt.Z.h.call(this)},rt.prototype.h=function(){rt.Z.h.call(this);const c=this.i;c.preventDefault?c.preventDefault():c.returnValue=!1};var Jn="closure_listenable_"+(Math.random()*1e6|0),$T=0;function jT(c,d,p,m,S){this.listener=c,this.proxy=null,this.src=d,this.type=p,this.capture=!!m,this.ha=S,this.key=++$T,this.da=this.fa=!1}function Qo(c){c.da=!0,c.listener=null,c.proxy=null,c.src=null,c.ha=null}function Yo(c,d,p){for(const m in c)d.call(p,c[m],m,c)}function WT(c,d){for(const p in c)d.call(void 0,c[p],p,c)}function sf(c){const d={};for(const p in c)d[p]=c[p];return d}const of="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function af(c,d){let p,m;for(let S=1;S<arguments.length;S++){m=arguments[S];for(p in m)c[p]=m[p];for(let k=0;k<of.length;k++)p=of[k],Object.prototype.hasOwnProperty.call(m,p)&&(c[p]=m[p])}}function Xo(c){this.src=c,this.g={},this.h=0}Xo.prototype.add=function(c,d,p,m,S){const k=c.toString();c=this.g[k],c||(c=this.g[k]=[],this.h++);const U=ml(c,d,m,S);return U>-1?(d=c[U],p||(d.fa=!1)):(d=new jT(d,this.src,k,!!m,S),d.fa=p,c.push(d)),d};function _l(c,d){const p=d.type;if(p in c.g){var m=c.g[p],S=Array.prototype.indexOf.call(m,d,void 0),k;(k=S>=0)&&Array.prototype.splice.call(m,S,1),k&&(Qo(d),c.g[p].length==0&&(delete c.g[p],c.h--))}}function ml(c,d,p,m){for(let S=0;S<c.length;++S){const k=c[S];if(!k.da&&k.listener==d&&k.capture==!!p&&k.ha==m)return S}return-1}var gl="closure_lm_"+(Math.random()*1e6|0),yl={};function cf(c,d,p,m,S){if(Array.isArray(d)){for(let k=0;k<d.length;k++)cf(c,d[k],p,m,S);return null}return p=hf(p),c&&c[Jn]?c.J(d,p,a(m)?!!m.capture:!1,S):KT(c,d,p,!1,m,S)}function KT(c,d,p,m,S,k){if(!d)throw Error("Invalid event type");const U=a(S)?!!S.capture:!!S;let Q=El(c);if(Q||(c[gl]=Q=new Xo(c)),p=Q.add(d,p,m,U,k),p.proxy)return p;if(m=HT(),p.proxy=m,m.src=c,m.listener=p,c.addEventListener)N||(S=U),S===void 0&&(S=!1),c.addEventListener(d.toString(),m,S);else if(c.attachEvent)c.attachEvent(uf(d.toString()),m);else if(c.addListener&&c.removeListener)c.addListener(m);else throw Error("addEventListener and attachEvent are unavailable.");return p}function HT(){function c(p){return d.call(c.src,c.listener,p)}const d=QT;return c}function lf(c,d,p,m,S){if(Array.isArray(d))for(var k=0;k<d.length;k++)lf(c,d[k],p,m,S);else m=a(m)?!!m.capture:!!m,p=hf(p),c&&c[Jn]?(c=c.i,k=String(d).toString(),k in c.g&&(d=c.g[k],p=ml(d,p,m,S),p>-1&&(Qo(d[p]),Array.prototype.splice.call(d,p,1),d.length==0&&(delete c.g[k],c.h--)))):c&&(c=El(c))&&(d=c.g[d.toString()],c=-1,d&&(c=ml(d,p,m,S)),(p=c>-1?d[c]:null)&&Il(p))}function Il(c){if(typeof c!="number"&&c&&!c.da){var d=c.src;if(d&&d[Jn])_l(d.i,c);else{var p=c.type,m=c.proxy;d.removeEventListener?d.removeEventListener(p,m,c.capture):d.detachEvent?d.detachEvent(uf(p),m):d.addListener&&d.removeListener&&d.removeListener(m),(p=El(d))?(_l(p,c),p.h==0&&(p.src=null,d[gl]=null)):Qo(c)}}}function uf(c){return c in yl?yl[c]:yl[c]="on"+c}function QT(c,d){if(c.da)c=!0;else{d=new rt(d,this);const p=c.listener,m=c.ha||c.src;c.fa&&Il(c),c=p.call(m,d)}return c}function El(c){return c=c[gl],c instanceof Xo?c:null}var Tl="__closure_events_fn_"+(Math.random()*1e9>>>0);function hf(c){return typeof c=="function"?c:(c[Tl]||(c[Tl]=function(d){return c.handleEvent(d)}),c[Tl])}function Ke(){A.call(this),this.i=new Xo(this),this.M=this,this.G=null}f(Ke,A),Ke.prototype[Jn]=!0,Ke.prototype.removeEventListener=function(c,d,p,m){lf(this,c,d,p,m)};function Ze(c,d){var p,m=c.G;if(m)for(p=[];m;m=m.G)p.push(m);if(c=c.M,m=d.type||d,typeof d=="string")d=new v(d,c);else if(d instanceof v)d.target=d.target||c;else{var S=d;d=new v(m,c),af(d,S)}S=!0;let k,U;if(p)for(U=p.length-1;U>=0;U--)k=d.g=p[U],S=Jo(k,m,!0,d)&&S;if(k=d.g=c,S=Jo(k,m,!0,d)&&S,S=Jo(k,m,!1,d)&&S,p)for(U=0;U<p.length;U++)k=d.g=p[U],S=Jo(k,m,!1,d)&&S}Ke.prototype.N=function(){if(Ke.Z.N.call(this),this.i){var c=this.i;for(const d in c.g){const p=c.g[d];for(let m=0;m<p.length;m++)Qo(p[m]);delete c.g[d],c.h--}}this.G=null},Ke.prototype.J=function(c,d,p,m){return this.i.add(String(c),d,!1,p,m)},Ke.prototype.K=function(c,d,p,m){return this.i.add(String(c),d,!0,p,m)};function Jo(c,d,p,m){if(d=c.i.g[String(d)],!d)return!0;d=d.concat();let S=!0;for(let k=0;k<d.length;++k){const U=d[k];if(U&&!U.da&&U.capture==p){const Q=U.listener,Oe=U.ha||U.src;U.fa&&_l(c.i,U),S=Q.call(Oe,m)!==!1&&S}}return S&&!m.defaultPrevented}function YT(c,d){if(typeof c!="function")if(c&&typeof c.handleEvent=="function")c=u(c.handleEvent,c);else throw Error("Invalid listener argument");return Number(d)>2147483647?-1:o.setTimeout(c,d||0)}function df(c){c.g=YT(()=>{c.g=null,c.i&&(c.i=!1,df(c))},c.l);const d=c.h;c.h=null,c.m.apply(null,d)}class XT extends A{constructor(d,p){super(),this.m=d,this.l=p,this.h=null,this.i=!1,this.g=null}j(d){this.h=arguments,this.g?this.i=!0:df(this)}N(){super.N(),this.g&&(o.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function ri(c){A.call(this),this.h=c,this.g={}}f(ri,A);var ff=[];function pf(c){Yo(c.g,function(d,p){this.g.hasOwnProperty(p)&&Il(d)},c),c.g={}}ri.prototype.N=function(){ri.Z.N.call(this),pf(this)},ri.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var wl=o.JSON.stringify,JT=o.JSON.parse,ZT=class{stringify(c){return o.JSON.stringify(c,void 0)}parse(c){return o.JSON.parse(c,void 0)}};function _f(){}function mf(){}var si={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function vl(){v.call(this,"d")}f(vl,v);function Al(){v.call(this,"c")}f(Al,v);var Zn={},gf=null;function Zo(){return gf=gf||new Ke}Zn.Ia="serverreachability";function yf(c){v.call(this,Zn.Ia,c)}f(yf,v);function ii(c){const d=Zo();Ze(d,new yf(d))}Zn.STAT_EVENT="statevent";function If(c,d){v.call(this,Zn.STAT_EVENT,c),this.stat=d}f(If,v);function et(c){const d=Zo();Ze(d,new If(d,c))}Zn.Ja="timingevent";function Ef(c,d){v.call(this,Zn.Ja,c),this.size=d}f(Ef,v);function oi(c,d){if(typeof c!="function")throw Error("Fn must not be null and must be a function");return o.setTimeout(function(){c()},d)}function ai(){this.g=!0}ai.prototype.ua=function(){this.g=!1};function ew(c,d,p,m,S,k){c.info(function(){if(c.g)if(k){var U="",Q=k.split("&");for(let pe=0;pe<Q.length;pe++){var Oe=Q[pe].split("=");if(Oe.length>1){const Ue=Oe[0];Oe=Oe[1];const kt=Ue.split("_");U=kt.length>=2&&kt[1]=="type"?U+(Ue+"="+Oe+"&"):U+(Ue+"=redacted&")}}}else U=null;else U=k;return"XMLHTTP REQ ("+m+") [attempt "+S+"]: "+d+`
`+p+`
`+U})}function tw(c,d,p,m,S,k,U){c.info(function(){return"XMLHTTP RESP ("+m+") [ attempt "+S+"]: "+d+`
`+p+`
`+k+" "+U})}function zr(c,d,p,m){c.info(function(){return"XMLHTTP TEXT ("+d+"): "+rw(c,p)+(m?" "+m:"")})}function nw(c,d){c.info(function(){return"TIMEOUT: "+d})}ai.prototype.info=function(){};function rw(c,d){if(!c.g)return d;if(!d)return null;try{const k=JSON.parse(d);if(k){for(c=0;c<k.length;c++)if(Array.isArray(k[c])){var p=k[c];if(!(p.length<2)){var m=p[1];if(Array.isArray(m)&&!(m.length<1)){var S=m[0];if(S!="noop"&&S!="stop"&&S!="close")for(let U=1;U<m.length;U++)m[U]=""}}}}return wl(k)}catch{return d}}var ea={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},Tf={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},wf;function bl(){}f(bl,_f),bl.prototype.g=function(){return new XMLHttpRequest},wf=new bl;function ci(c){return encodeURIComponent(String(c))}function sw(c){var d=1;c=c.split(":");const p=[];for(;d>0&&c.length;)p.push(c.shift()),d--;return c.length&&p.push(c.join(":")),p}function dn(c,d,p,m){this.j=c,this.i=d,this.l=p,this.S=m||1,this.V=new ri(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new vf}function vf(){this.i=null,this.g="",this.h=!1}var Af={},Rl={};function Sl(c,d,p){c.M=1,c.A=na(Nt(d)),c.u=p,c.R=!0,bf(c,null)}function bf(c,d){c.F=Date.now(),ta(c),c.B=Nt(c.A);var p=c.B,m=c.S;Array.isArray(m)||(m=[String(m)]),Ff(p.i,"t",m),c.C=0,p=c.j.L,c.h=new vf,c.g=np(c.j,p?d:null,!c.u),c.P>0&&(c.O=new XT(u(c.Y,c,c.g),c.P)),d=c.V,p=c.g,m=c.ba;var S="readystatechange";Array.isArray(S)||(S&&(ff[0]=S.toString()),S=ff);for(let k=0;k<S.length;k++){const U=cf(p,S[k],m||d.handleEvent,!1,d.h||d);if(!U)break;d.g[U.key]=U}d=c.J?sf(c.J):{},c.u?(c.v||(c.v="POST"),d["Content-Type"]="application/x-www-form-urlencoded",c.g.ea(c.B,c.v,c.u,d)):(c.v="GET",c.g.ea(c.B,c.v,null,d)),ii(),ew(c.i,c.v,c.B,c.l,c.S,c.u)}dn.prototype.ba=function(c){c=c.target;const d=this.O;d&&_n(c)==3?d.j():this.Y(c)},dn.prototype.Y=function(c){try{if(c==this.g)e:{const Q=_n(this.g),Oe=this.g.ya(),pe=this.g.ca();if(!(Q<3)&&(Q!=3||this.g&&(this.h.h||this.g.la()||jf(this.g)))){this.K||Q!=4||Oe==7||(Oe==8||pe<=0?ii(3):ii(2)),Cl(this);var d=this.g.ca();this.X=d;var p=iw(this);if(this.o=d==200,tw(this.i,this.v,this.B,this.l,this.S,Q,d),this.o){if(this.U&&!this.L){t:{if(this.g){var m,S=this.g;if((m=S.g?S.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!I(m)){var k=m;break t}}k=null}if(c=k)zr(this.i,this.l,c,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,Pl(this,c);else{this.o=!1,this.m=3,et(12),er(this),li(this);break e}}if(this.R){c=!0;let Ue;for(;!this.K&&this.C<p.length;)if(Ue=ow(this,p),Ue==Rl){Q==4&&(this.m=4,et(14),c=!1),zr(this.i,this.l,null,"[Incomplete Response]");break}else if(Ue==Af){this.m=4,et(15),zr(this.i,this.l,p,"[Invalid Chunk]"),c=!1;break}else zr(this.i,this.l,Ue,null),Pl(this,Ue);if(Rf(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),Q!=4||p.length!=0||this.h.h||(this.m=1,et(16),c=!1),this.o=this.o&&c,!c)zr(this.i,this.l,p,"[Invalid Chunked Response]"),er(this),li(this);else if(p.length>0&&!this.W){this.W=!0;var U=this.j;U.g==this&&U.aa&&!U.P&&(U.j.info("Great, no buffering proxy detected. Bytes received: "+p.length),Ll(U),U.P=!0,et(11))}}else zr(this.i,this.l,p,null),Pl(this,p);Q==4&&er(this),this.o&&!this.K&&(Q==4?Jf(this.j,this):(this.o=!1,ta(this)))}else Ew(this.g),d==400&&p.indexOf("Unknown SID")>0?(this.m=3,et(12)):(this.m=0,et(13)),er(this),li(this)}}}catch{}finally{}};function iw(c){if(!Rf(c))return c.g.la();const d=jf(c.g);if(d==="")return"";let p="";const m=d.length,S=_n(c.g)==4;if(!c.h.i){if(typeof TextDecoder>"u")return er(c),li(c),"";c.h.i=new o.TextDecoder}for(let k=0;k<m;k++)c.h.h=!0,p+=c.h.i.decode(d[k],{stream:!(S&&k==m-1)});return d.length=0,c.h.g+=p,c.C=0,c.h.g}function Rf(c){return c.g?c.v=="GET"&&c.M!=2&&c.j.Aa:!1}function ow(c,d){var p=c.C,m=d.indexOf(`
`,p);return m==-1?Rl:(p=Number(d.substring(p,m)),isNaN(p)?Af:(m+=1,m+p>d.length?Rl:(d=d.slice(m,m+p),c.C=m+p,d)))}dn.prototype.cancel=function(){this.K=!0,er(this)};function ta(c){c.T=Date.now()+c.H,Sf(c,c.H)}function Sf(c,d){if(c.D!=null)throw Error("WatchDog timer not null");c.D=oi(u(c.aa,c),d)}function Cl(c){c.D&&(o.clearTimeout(c.D),c.D=null)}dn.prototype.aa=function(){this.D=null;const c=Date.now();c-this.T>=0?(nw(this.i,this.B),this.M!=2&&(ii(),et(17)),er(this),this.m=2,li(this)):Sf(this,this.T-c)};function li(c){c.j.I==0||c.K||Jf(c.j,c)}function er(c){Cl(c);var d=c.O;d&&typeof d.dispose=="function"&&d.dispose(),c.O=null,pf(c.V),c.g&&(d=c.g,c.g=null,d.abort(),d.dispose())}function Pl(c,d){try{var p=c.j;if(p.I!=0&&(p.g==c||Nl(p.h,c))){if(!c.L&&Nl(p.h,c)&&p.I==3){try{var m=p.Ba.g.parse(d)}catch{m=null}if(Array.isArray(m)&&m.length==3){var S=m;if(S[0]==0){e:if(!p.v){if(p.g)if(p.g.F+3e3<c.F)aa(p),ia(p);else break e;Ml(p),et(18)}}else p.xa=S[1],0<p.xa-p.K&&S[2]<37500&&p.F&&p.A==0&&!p.C&&(p.C=oi(u(p.Va,p),6e3));Nf(p.h)<=1&&p.ta&&(p.ta=void 0)}else nr(p,11)}else if((c.L||p.g==c)&&aa(p),!I(d))for(S=p.Ba.g.parse(d),d=0;d<S.length;d++){let pe=S[d];const Ue=pe[0];if(!(Ue<=p.K))if(p.K=Ue,pe=pe[1],p.I==2)if(pe[0]=="c"){p.M=pe[1],p.ba=pe[2];const kt=pe[3];kt!=null&&(p.ka=kt,p.j.info("VER="+p.ka));const rr=pe[4];rr!=null&&(p.za=rr,p.j.info("SVER="+p.za));const mn=pe[5];mn!=null&&typeof mn=="number"&&mn>0&&(m=1.5*mn,p.O=m,p.j.info("backChannelRequestTimeoutMs_="+m)),m=p;const gn=c.g;if(gn){const la=gn.g?gn.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(la){var k=m.h;k.g||la.indexOf("spdy")==-1&&la.indexOf("quic")==-1&&la.indexOf("h2")==-1||(k.j=k.l,k.g=new Set,k.h&&(kl(k,k.h),k.h=null))}if(m.G){const Fl=gn.g?gn.g.getResponseHeader("X-HTTP-Session-Id"):null;Fl&&(m.wa=Fl,me(m.J,m.G,Fl))}}p.I=3,p.l&&p.l.ra(),p.aa&&(p.T=Date.now()-c.F,p.j.info("Handshake RTT: "+p.T+"ms")),m=p;var U=c;if(m.na=tp(m,m.L?m.ba:null,m.W),U.L){kf(m.h,U);var Q=U,Oe=m.O;Oe&&(Q.H=Oe),Q.D&&(Cl(Q),ta(Q)),m.g=U}else Yf(m);p.i.length>0&&oa(p)}else pe[0]!="stop"&&pe[0]!="close"||nr(p,7);else p.I==3&&(pe[0]=="stop"||pe[0]=="close"?pe[0]=="stop"?nr(p,7):Ol(p):pe[0]!="noop"&&p.l&&p.l.qa(pe),p.A=0)}}ii(4)}catch{}}var aw=class{constructor(c,d){this.g=c,this.map=d}};function Cf(c){this.l=c||10,o.PerformanceNavigationTiming?(c=o.performance.getEntriesByType("navigation"),c=c.length>0&&(c[0].nextHopProtocol=="hq"||c[0].nextHopProtocol=="h2")):c=!!(o.chrome&&o.chrome.loadTimes&&o.chrome.loadTimes()&&o.chrome.loadTimes().wasFetchedViaSpdy),this.j=c?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function Pf(c){return c.h?!0:c.g?c.g.size>=c.j:!1}function Nf(c){return c.h?1:c.g?c.g.size:0}function Nl(c,d){return c.h?c.h==d:c.g?c.g.has(d):!1}function kl(c,d){c.g?c.g.add(d):c.h=d}function kf(c,d){c.h&&c.h==d?c.h=null:c.g&&c.g.has(d)&&c.g.delete(d)}Cf.prototype.cancel=function(){if(this.i=Df(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const c of this.g.values())c.cancel();this.g.clear()}};function Df(c){if(c.h!=null)return c.i.concat(c.h.G);if(c.g!=null&&c.g.size!==0){let d=c.i;for(const p of c.g.values())d=d.concat(p.G);return d}return g(c.i)}var xf=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function cw(c,d){if(c){c=c.split("&");for(let p=0;p<c.length;p++){const m=c[p].indexOf("=");let S,k=null;m>=0?(S=c[p].substring(0,m),k=c[p].substring(m+1)):S=c[p],d(S,k?decodeURIComponent(k.replace(/\+/g," ")):"")}}}function fn(c){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let d;c instanceof fn?(this.l=c.l,ui(this,c.j),this.o=c.o,this.g=c.g,hi(this,c.u),this.h=c.h,Dl(this,Uf(c.i)),this.m=c.m):c&&(d=String(c).match(xf))?(this.l=!1,ui(this,d[1]||"",!0),this.o=di(d[2]||""),this.g=di(d[3]||"",!0),hi(this,d[4]),this.h=di(d[5]||"",!0),Dl(this,d[6]||"",!0),this.m=di(d[7]||"")):(this.l=!1,this.i=new pi(null,this.l))}fn.prototype.toString=function(){const c=[];var d=this.j;d&&c.push(fi(d,Vf,!0),":");var p=this.g;return(p||d=="file")&&(c.push("//"),(d=this.o)&&c.push(fi(d,Vf,!0),"@"),c.push(ci(p).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),p=this.u,p!=null&&c.push(":",String(p))),(p=this.h)&&(this.g&&p.charAt(0)!="/"&&c.push("/"),c.push(fi(p,p.charAt(0)=="/"?hw:uw,!0))),(p=this.i.toString())&&c.push("?",p),(p=this.m)&&c.push("#",fi(p,fw)),c.join("")},fn.prototype.resolve=function(c){const d=Nt(this);let p=!!c.j;p?ui(d,c.j):p=!!c.o,p?d.o=c.o:p=!!c.g,p?d.g=c.g:p=c.u!=null;var m=c.h;if(p)hi(d,c.u);else if(p=!!c.h){if(m.charAt(0)!="/")if(this.g&&!this.h)m="/"+m;else{var S=d.h.lastIndexOf("/");S!=-1&&(m=d.h.slice(0,S+1)+m)}if(S=m,S==".."||S==".")m="";else if(S.indexOf("./")!=-1||S.indexOf("/.")!=-1){m=S.lastIndexOf("/",0)==0,S=S.split("/");const k=[];for(let U=0;U<S.length;){const Q=S[U++];Q=="."?m&&U==S.length&&k.push(""):Q==".."?((k.length>1||k.length==1&&k[0]!="")&&k.pop(),m&&U==S.length&&k.push("")):(k.push(Q),m=!0)}m=k.join("/")}else m=S}return p?d.h=m:p=c.i.toString()!=="",p?Dl(d,Uf(c.i)):p=!!c.m,p&&(d.m=c.m),d};function Nt(c){return new fn(c)}function ui(c,d,p){c.j=p?di(d,!0):d,c.j&&(c.j=c.j.replace(/:$/,""))}function hi(c,d){if(d){if(d=Number(d),isNaN(d)||d<0)throw Error("Bad port number "+d);c.u=d}else c.u=null}function Dl(c,d,p){d instanceof pi?(c.i=d,pw(c.i,c.l)):(p||(d=fi(d,dw)),c.i=new pi(d,c.l))}function me(c,d,p){c.i.set(d,p)}function na(c){return me(c,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),c}function di(c,d){return c?d?decodeURI(c.replace(/%25/g,"%2525")):decodeURIComponent(c):""}function fi(c,d,p){return typeof c=="string"?(c=encodeURI(c).replace(d,lw),p&&(c=c.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),c):null}function lw(c){return c=c.charCodeAt(0),"%"+(c>>4&15).toString(16)+(c&15).toString(16)}var Vf=/[#\/\?@]/g,uw=/[#\?:]/g,hw=/[#\?]/g,dw=/[#\?@]/g,fw=/#/g;function pi(c,d){this.h=this.g=null,this.i=c||null,this.j=!!d}function tr(c){c.g||(c.g=new Map,c.h=0,c.i&&cw(c.i,function(d,p){c.add(decodeURIComponent(d.replace(/\+/g," ")),p)}))}n=pi.prototype,n.add=function(c,d){tr(this),this.i=null,c=Gr(this,c);let p=this.g.get(c);return p||this.g.set(c,p=[]),p.push(d),this.h+=1,this};function Of(c,d){tr(c),d=Gr(c,d),c.g.has(d)&&(c.i=null,c.h-=c.g.get(d).length,c.g.delete(d))}function Mf(c,d){return tr(c),d=Gr(c,d),c.g.has(d)}n.forEach=function(c,d){tr(this),this.g.forEach(function(p,m){p.forEach(function(S){c.call(d,S,m,this)},this)},this)};function Lf(c,d){tr(c);let p=[];if(typeof d=="string")Mf(c,d)&&(p=p.concat(c.g.get(Gr(c,d))));else for(c=Array.from(c.g.values()),d=0;d<c.length;d++)p=p.concat(c[d]);return p}n.set=function(c,d){return tr(this),this.i=null,c=Gr(this,c),Mf(this,c)&&(this.h-=this.g.get(c).length),this.g.set(c,[d]),this.h+=1,this},n.get=function(c,d){return c?(c=Lf(this,c),c.length>0?String(c[0]):d):d};function Ff(c,d,p){Of(c,d),p.length>0&&(c.i=null,c.g.set(Gr(c,d),g(p)),c.h+=p.length)}n.toString=function(){if(this.i)return this.i;if(!this.g)return"";const c=[],d=Array.from(this.g.keys());for(let m=0;m<d.length;m++){var p=d[m];const S=ci(p);p=Lf(this,p);for(let k=0;k<p.length;k++){let U=S;p[k]!==""&&(U+="="+ci(p[k])),c.push(U)}}return this.i=c.join("&")};function Uf(c){const d=new pi;return d.i=c.i,c.g&&(d.g=new Map(c.g),d.h=c.h),d}function Gr(c,d){return d=String(d),c.j&&(d=d.toLowerCase()),d}function pw(c,d){d&&!c.j&&(tr(c),c.i=null,c.g.forEach(function(p,m){const S=m.toLowerCase();m!=S&&(Of(this,m),Ff(this,S,p))},c)),c.j=d}function _w(c,d){const p=new ai;if(o.Image){const m=new Image;m.onload=h(pn,p,"TestLoadImage: loaded",!0,d,m),m.onerror=h(pn,p,"TestLoadImage: error",!1,d,m),m.onabort=h(pn,p,"TestLoadImage: abort",!1,d,m),m.ontimeout=h(pn,p,"TestLoadImage: timeout",!1,d,m),o.setTimeout(function(){m.ontimeout&&m.ontimeout()},1e4),m.src=c}else d(!1)}function mw(c,d){const p=new ai,m=new AbortController,S=setTimeout(()=>{m.abort(),pn(p,"TestPingServer: timeout",!1,d)},1e4);fetch(c,{signal:m.signal}).then(k=>{clearTimeout(S),k.ok?pn(p,"TestPingServer: ok",!0,d):pn(p,"TestPingServer: server error",!1,d)}).catch(()=>{clearTimeout(S),pn(p,"TestPingServer: error",!1,d)})}function pn(c,d,p,m,S){try{S&&(S.onload=null,S.onerror=null,S.onabort=null,S.ontimeout=null),m(p)}catch{}}function gw(){this.g=new ZT}function xl(c){this.i=c.Sb||null,this.h=c.ab||!1}f(xl,_f),xl.prototype.g=function(){return new ra(this.i,this.h)};function ra(c,d){Ke.call(this),this.H=c,this.o=d,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}f(ra,Ke),n=ra.prototype,n.open=function(c,d){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=c,this.D=d,this.readyState=1,mi(this)},n.send=function(c){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const d={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};c&&(d.body=c),(this.H||o).fetch(new Request(this.D,d)).then(this.Pa.bind(this),this.ga.bind(this))},n.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,_i(this)),this.readyState=0},n.Pa=function(c){if(this.g&&(this.l=c,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=c.headers,this.readyState=2,mi(this)),this.g&&(this.readyState=3,mi(this),this.g)))if(this.responseType==="arraybuffer")c.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof o.ReadableStream<"u"&&"body"in c){if(this.j=c.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;Bf(this)}else c.text().then(this.Oa.bind(this),this.ga.bind(this))};function Bf(c){c.j.read().then(c.Ma.bind(c)).catch(c.ga.bind(c))}n.Ma=function(c){if(this.g){if(this.o&&c.value)this.response.push(c.value);else if(!this.o){var d=c.value?c.value:new Uint8Array(0);(d=this.B.decode(d,{stream:!c.done}))&&(this.response=this.responseText+=d)}c.done?_i(this):mi(this),this.readyState==3&&Bf(this)}},n.Oa=function(c){this.g&&(this.response=this.responseText=c,_i(this))},n.Na=function(c){this.g&&(this.response=c,_i(this))},n.ga=function(){this.g&&_i(this)};function _i(c){c.readyState=4,c.l=null,c.j=null,c.B=null,mi(c)}n.setRequestHeader=function(c,d){this.A.append(c,d)},n.getResponseHeader=function(c){return this.h&&this.h.get(c.toLowerCase())||""},n.getAllResponseHeaders=function(){if(!this.h)return"";const c=[],d=this.h.entries();for(var p=d.next();!p.done;)p=p.value,c.push(p[0]+": "+p[1]),p=d.next();return c.join(`\r
`)};function mi(c){c.onreadystatechange&&c.onreadystatechange.call(c)}Object.defineProperty(ra.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(c){this.m=c?"include":"same-origin"}});function qf(c){let d="";return Yo(c,function(p,m){d+=m,d+=":",d+=p,d+=`\r
`}),d}function Vl(c,d,p){e:{for(m in p){var m=!1;break e}m=!0}m||(p=qf(p),typeof c=="string"?p!=null&&ci(p):me(c,d,p))}function Ce(c){Ke.call(this),this.headers=new Map,this.L=c||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}f(Ce,Ke);var yw=/^https?$/i,Iw=["POST","PUT"];n=Ce.prototype,n.Fa=function(c){this.H=c},n.ea=function(c,d,p,m){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+c);d=d?d.toUpperCase():"GET",this.D=c,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():wf.g(),this.g.onreadystatechange=_(u(this.Ca,this));try{this.B=!0,this.g.open(d,String(c),!0),this.B=!1}catch(k){zf(this,k);return}if(c=p||"",p=new Map(this.headers),m)if(Object.getPrototypeOf(m)===Object.prototype)for(var S in m)p.set(S,m[S]);else if(typeof m.keys=="function"&&typeof m.get=="function")for(const k of m.keys())p.set(k,m.get(k));else throw Error("Unknown input type for opt_headers: "+String(m));m=Array.from(p.keys()).find(k=>k.toLowerCase()=="content-type"),S=o.FormData&&c instanceof o.FormData,!(Array.prototype.indexOf.call(Iw,d,void 0)>=0)||m||S||p.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[k,U]of p)this.g.setRequestHeader(k,U);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(c),this.v=!1}catch(k){zf(this,k)}};function zf(c,d){c.h=!1,c.g&&(c.j=!0,c.g.abort(),c.j=!1),c.l=d,c.o=5,Gf(c),sa(c)}function Gf(c){c.A||(c.A=!0,Ze(c,"complete"),Ze(c,"error"))}n.abort=function(c){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=c||7,Ze(this,"complete"),Ze(this,"abort"),sa(this))},n.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),sa(this,!0)),Ce.Z.N.call(this)},n.Ca=function(){this.u||(this.B||this.v||this.j?$f(this):this.Xa())},n.Xa=function(){$f(this)};function $f(c){if(c.h&&typeof i<"u"){if(c.v&&_n(c)==4)setTimeout(c.Ca.bind(c),0);else if(Ze(c,"readystatechange"),_n(c)==4){c.h=!1;try{const k=c.ca();e:switch(k){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var d=!0;break e;default:d=!1}var p;if(!(p=d)){var m;if(m=k===0){let U=String(c.D).match(xf)[1]||null;!U&&o.self&&o.self.location&&(U=o.self.location.protocol.slice(0,-1)),m=!yw.test(U?U.toLowerCase():"")}p=m}if(p)Ze(c,"complete"),Ze(c,"success");else{c.o=6;try{var S=_n(c)>2?c.g.statusText:""}catch{S=""}c.l=S+" ["+c.ca()+"]",Gf(c)}}finally{sa(c)}}}}function sa(c,d){if(c.g){c.m&&(clearTimeout(c.m),c.m=null);const p=c.g;c.g=null,d||Ze(c,"ready");try{p.onreadystatechange=null}catch{}}}n.isActive=function(){return!!this.g};function _n(c){return c.g?c.g.readyState:0}n.ca=function(){try{return _n(this)>2?this.g.status:-1}catch{return-1}},n.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},n.La=function(c){if(this.g){var d=this.g.responseText;return c&&d.indexOf(c)==0&&(d=d.substring(c.length)),JT(d)}};function jf(c){try{if(!c.g)return null;if("response"in c.g)return c.g.response;switch(c.F){case"":case"text":return c.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in c.g)return c.g.mozResponseArrayBuffer}return null}catch{return null}}function Ew(c){const d={};c=(c.g&&_n(c)>=2&&c.g.getAllResponseHeaders()||"").split(`\r
`);for(let m=0;m<c.length;m++){if(I(c[m]))continue;var p=sw(c[m]);const S=p[0];if(p=p[1],typeof p!="string")continue;p=p.trim();const k=d[S]||[];d[S]=k,k.push(p)}WT(d,function(m){return m.join(", ")})}n.ya=function(){return this.o},n.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function gi(c,d,p){return p&&p.internalChannelParams&&p.internalChannelParams[c]||d}function Wf(c){this.za=0,this.i=[],this.j=new ai,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=gi("failFast",!1,c),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=gi("baseRetryDelayMs",5e3,c),this.Za=gi("retryDelaySeedMs",1e4,c),this.Ta=gi("forwardChannelMaxRetries",2,c),this.va=gi("forwardChannelRequestTimeoutMs",2e4,c),this.ma=c&&c.xmlHttpFactory||void 0,this.Ua=c&&c.Rb||void 0,this.Aa=c&&c.useFetchStreams||!1,this.O=void 0,this.L=c&&c.supportsCrossDomainXhr||!1,this.M="",this.h=new Cf(c&&c.concurrentRequestLimit),this.Ba=new gw,this.S=c&&c.fastHandshake||!1,this.R=c&&c.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=c&&c.Pb||!1,c&&c.ua&&this.j.ua(),c&&c.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&c&&c.detectBufferingProxy||!1,this.ia=void 0,c&&c.longPollingTimeout&&c.longPollingTimeout>0&&(this.ia=c.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}n=Wf.prototype,n.ka=8,n.I=1,n.connect=function(c,d,p,m){et(0),this.W=c,this.H=d||{},p&&m!==void 0&&(this.H.OSID=p,this.H.OAID=m),this.F=this.X,this.J=tp(this,null,this.W),oa(this)};function Ol(c){if(Kf(c),c.I==3){var d=c.V++,p=Nt(c.J);if(me(p,"SID",c.M),me(p,"RID",d),me(p,"TYPE","terminate"),yi(c,p),d=new dn(c,c.j,d),d.M=2,d.A=na(Nt(p)),p=!1,o.navigator&&o.navigator.sendBeacon)try{p=o.navigator.sendBeacon(d.A.toString(),"")}catch{}!p&&o.Image&&(new Image().src=d.A,p=!0),p||(d.g=np(d.j,null),d.g.ea(d.A)),d.F=Date.now(),ta(d)}ep(c)}function ia(c){c.g&&(Ll(c),c.g.cancel(),c.g=null)}function Kf(c){ia(c),c.v&&(o.clearTimeout(c.v),c.v=null),aa(c),c.h.cancel(),c.m&&(typeof c.m=="number"&&o.clearTimeout(c.m),c.m=null)}function oa(c){if(!Pf(c.h)&&!c.m){c.m=!0;var d=c.Ea;ne||y(),H||(ne(),H=!0),T.add(d,c),c.D=0}}function Tw(c,d){return Nf(c.h)>=c.h.j-(c.m?1:0)?!1:c.m?(c.i=d.G.concat(c.i),!0):c.I==1||c.I==2||c.D>=(c.Sa?0:c.Ta)?!1:(c.m=oi(u(c.Ea,c,d),Zf(c,c.D)),c.D++,!0)}n.Ea=function(c){if(this.m)if(this.m=null,this.I==1){if(!c){this.V=Math.floor(Math.random()*1e5),c=this.V++;const S=new dn(this,this.j,c);let k=this.o;if(this.U&&(k?(k=sf(k),af(k,this.U)):k=this.U),this.u!==null||this.R||(S.J=k,k=null),this.S)e:{for(var d=0,p=0;p<this.i.length;p++){t:{var m=this.i[p];if("__data__"in m.map&&(m=m.map.__data__,typeof m=="string")){m=m.length;break t}m=void 0}if(m===void 0)break;if(d+=m,d>4096){d=p;break e}if(d===4096||p===this.i.length-1){d=p+1;break e}}d=1e3}else d=1e3;d=Qf(this,S,d),p=Nt(this.J),me(p,"RID",c),me(p,"CVER",22),this.G&&me(p,"X-HTTP-Session-Id",this.G),yi(this,p),k&&(this.R?d="headers="+ci(qf(k))+"&"+d:this.u&&Vl(p,this.u,k)),kl(this.h,S),this.Ra&&me(p,"TYPE","init"),this.S?(me(p,"$req",d),me(p,"SID","null"),S.U=!0,Sl(S,p,null)):Sl(S,p,d),this.I=2}}else this.I==3&&(c?Hf(this,c):this.i.length==0||Pf(this.h)||Hf(this))};function Hf(c,d){var p;d?p=d.l:p=c.V++;const m=Nt(c.J);me(m,"SID",c.M),me(m,"RID",p),me(m,"AID",c.K),yi(c,m),c.u&&c.o&&Vl(m,c.u,c.o),p=new dn(c,c.j,p,c.D+1),c.u===null&&(p.J=c.o),d&&(c.i=d.G.concat(c.i)),d=Qf(c,p,1e3),p.H=Math.round(c.va*.5)+Math.round(c.va*.5*Math.random()),kl(c.h,p),Sl(p,m,d)}function yi(c,d){c.H&&Yo(c.H,function(p,m){me(d,m,p)}),c.l&&Yo({},function(p,m){me(d,m,p)})}function Qf(c,d,p){p=Math.min(c.i.length,p);const m=c.l?u(c.l.Ka,c.l,c):null;e:{var S=c.i;let Q=-1;for(;;){const Oe=["count="+p];Q==-1?p>0?(Q=S[0].g,Oe.push("ofs="+Q)):Q=0:Oe.push("ofs="+Q);let pe=!0;for(let Ue=0;Ue<p;Ue++){var k=S[Ue].g;const kt=S[Ue].map;if(k-=Q,k<0)Q=Math.max(0,S[Ue].g-100),pe=!1;else try{k="req"+k+"_"||"";try{var U=kt instanceof Map?kt:Object.entries(kt);for(const[rr,mn]of U){let gn=mn;a(mn)&&(gn=wl(mn)),Oe.push(k+rr+"="+encodeURIComponent(gn))}}catch(rr){throw Oe.push(k+"type="+encodeURIComponent("_badmap")),rr}}catch{m&&m(kt)}}if(pe){U=Oe.join("&");break e}}U=void 0}return c=c.i.splice(0,p),d.G=c,U}function Yf(c){if(!c.g&&!c.v){c.Y=1;var d=c.Da;ne||y(),H||(ne(),H=!0),T.add(d,c),c.A=0}}function Ml(c){return c.g||c.v||c.A>=3?!1:(c.Y++,c.v=oi(u(c.Da,c),Zf(c,c.A)),c.A++,!0)}n.Da=function(){if(this.v=null,Xf(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var c=4*this.T;this.j.info("BP detection timer enabled: "+c),this.B=oi(u(this.Wa,this),c)}},n.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,et(10),ia(this),Xf(this))};function Ll(c){c.B!=null&&(o.clearTimeout(c.B),c.B=null)}function Xf(c){c.g=new dn(c,c.j,"rpc",c.Y),c.u===null&&(c.g.J=c.o),c.g.P=0;var d=Nt(c.na);me(d,"RID","rpc"),me(d,"SID",c.M),me(d,"AID",c.K),me(d,"CI",c.F?"0":"1"),!c.F&&c.ia&&me(d,"TO",c.ia),me(d,"TYPE","xmlhttp"),yi(c,d),c.u&&c.o&&Vl(d,c.u,c.o),c.O&&(c.g.H=c.O);var p=c.g;c=c.ba,p.M=1,p.A=na(Nt(d)),p.u=null,p.R=!0,bf(p,c)}n.Va=function(){this.C!=null&&(this.C=null,ia(this),Ml(this),et(19))};function aa(c){c.C!=null&&(o.clearTimeout(c.C),c.C=null)}function Jf(c,d){var p=null;if(c.g==d){aa(c),Ll(c),c.g=null;var m=2}else if(Nl(c.h,d))p=d.G,kf(c.h,d),m=1;else return;if(c.I!=0){if(d.o)if(m==1){p=d.u?d.u.length:0,d=Date.now()-d.F;var S=c.D;m=Zo(),Ze(m,new Ef(m,p)),oa(c)}else Yf(c);else if(S=d.m,S==3||S==0&&d.X>0||!(m==1&&Tw(c,d)||m==2&&Ml(c)))switch(p&&p.length>0&&(d=c.h,d.i=d.i.concat(p)),S){case 1:nr(c,5);break;case 4:nr(c,10);break;case 3:nr(c,6);break;default:nr(c,2)}}}function Zf(c,d){let p=c.Qa+Math.floor(Math.random()*c.Za);return c.isActive()||(p*=2),p*d}function nr(c,d){if(c.j.info("Error code "+d),d==2){var p=u(c.bb,c),m=c.Ua;const S=!m;m=new fn(m||"//www.google.com/images/cleardot.gif"),o.location&&o.location.protocol=="http"||ui(m,"https"),na(m),S?_w(m.toString(),p):mw(m.toString(),p)}else et(2);c.I=0,c.l&&c.l.pa(d),ep(c),Kf(c)}n.bb=function(c){c?(this.j.info("Successfully pinged google.com"),et(2)):(this.j.info("Failed to ping google.com"),et(1))};function ep(c){if(c.I=0,c.ja=[],c.l){const d=Df(c.h);(d.length!=0||c.i.length!=0)&&(w(c.ja,d),w(c.ja,c.i),c.h.i.length=0,g(c.i),c.i.length=0),c.l.oa()}}function tp(c,d,p){var m=p instanceof fn?Nt(p):new fn(p);if(m.g!="")d&&(m.g=d+"."+m.g),hi(m,m.u);else{var S=o.location;m=S.protocol,d=d?d+"."+S.hostname:S.hostname,S=+S.port;const k=new fn(null);m&&ui(k,m),d&&(k.g=d),S&&hi(k,S),p&&(k.h=p),m=k}return p=c.G,d=c.wa,p&&d&&me(m,p,d),me(m,"VER",c.ka),yi(c,m),m}function np(c,d,p){if(d&&!c.L)throw Error("Can't create secondary domain capable XhrIo object.");return d=c.Aa&&!c.ma?new Ce(new xl({ab:p})):new Ce(c.ma),d.Fa(c.L),d}n.isActive=function(){return!!this.l&&this.l.isActive(this)};function rp(){}n=rp.prototype,n.ra=function(){},n.qa=function(){},n.pa=function(){},n.oa=function(){},n.isActive=function(){return!0},n.Ka=function(){};function ca(){}ca.prototype.g=function(c,d){return new mt(c,d)};function mt(c,d){Ke.call(this),this.g=new Wf(d),this.l=c,this.h=d&&d.messageUrlParams||null,c=d&&d.messageHeaders||null,d&&d.clientProtocolHeaderRequired&&(c?c["X-Client-Protocol"]="webchannel":c={"X-Client-Protocol":"webchannel"}),this.g.o=c,c=d&&d.initMessageHeaders||null,d&&d.messageContentType&&(c?c["X-WebChannel-Content-Type"]=d.messageContentType:c={"X-WebChannel-Content-Type":d.messageContentType}),d&&d.sa&&(c?c["X-WebChannel-Client-Profile"]=d.sa:c={"X-WebChannel-Client-Profile":d.sa}),this.g.U=c,(c=d&&d.Qb)&&!I(c)&&(this.g.u=c),this.A=d&&d.supportsCrossDomainXhr||!1,this.v=d&&d.sendRawJson||!1,(d=d&&d.httpSessionIdParam)&&!I(d)&&(this.g.G=d,c=this.h,c!==null&&d in c&&(c=this.h,d in c&&delete c[d])),this.j=new $r(this)}f(mt,Ke),mt.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},mt.prototype.close=function(){Ol(this.g)},mt.prototype.o=function(c){var d=this.g;if(typeof c=="string"){var p={};p.__data__=c,c=p}else this.v&&(p={},p.__data__=wl(c),c=p);d.i.push(new aw(d.Ya++,c)),d.I==3&&oa(d)},mt.prototype.N=function(){this.g.l=null,delete this.j,Ol(this.g),delete this.g,mt.Z.N.call(this)};function sp(c){vl.call(this),c.__headers__&&(this.headers=c.__headers__,this.statusCode=c.__status__,delete c.__headers__,delete c.__status__);var d=c.__sm__;if(d){e:{for(const p in d){c=p;break e}c=void 0}(this.i=c)&&(c=this.i,d=d!==null&&c in d?d[c]:void 0),this.data=d}else this.data=c}f(sp,vl);function ip(){Al.call(this),this.status=1}f(ip,Al);function $r(c){this.g=c}f($r,rp),$r.prototype.ra=function(){Ze(this.g,"a")},$r.prototype.qa=function(c){Ze(this.g,new sp(c))},$r.prototype.pa=function(c){Ze(this.g,new ip)},$r.prototype.oa=function(){Ze(this.g,"b")},ca.prototype.createWebChannel=ca.prototype.g,mt.prototype.send=mt.prototype.o,mt.prototype.open=mt.prototype.m,mt.prototype.close=mt.prototype.close,rg=function(){return new ca},ng=function(){return Zo()},tg=Zn,hu={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},ea.NO_ERROR=0,ea.TIMEOUT=8,ea.HTTP_ERROR=6,va=ea,Tf.COMPLETE="complete",eg=Tf,mf.EventType=si,si.OPEN="a",si.CLOSE="b",si.ERROR="c",si.MESSAGE="d",Ke.prototype.listen=Ke.prototype.J,Pi=mf,Ce.prototype.listenOnce=Ce.prototype.K,Ce.prototype.getLastError=Ce.prototype.Ha,Ce.prototype.getLastErrorCode=Ce.prototype.ya,Ce.prototype.getStatus=Ce.prototype.ca,Ce.prototype.getResponseJson=Ce.prototype.La,Ce.prototype.getResponseText=Ce.prototype.la,Ce.prototype.send=Ce.prototype.ea,Ce.prototype.setWithCredentials=Ce.prototype.Fa,Zm=Ce}).apply(typeof ua<"u"?ua:typeof self<"u"?self:typeof window<"u"?window:{});const _p="@firebase/firestore",mp="4.9.2";/**
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
 */class ze{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}ze.UNAUTHENTICATED=new ze(null),ze.GOOGLE_CREDENTIALS=new ze("google-credentials-uid"),ze.FIRST_PARTY=new ze("first-party-uid"),ze.MOCK_USER=new ze("mock-user");/**
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
 */let qs="12.3.0";/**
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
 */const xn=new Rc("@firebase/firestore");function Zr(){return xn.logLevel}function Qv(n){xn.setLogLevel(n)}function x(n,...e){if(xn.logLevel<=re.DEBUG){const t=e.map(uh);xn.debug(`Firestore (${qs}): ${n}`,...t)}}function Ne(n,...e){if(xn.logLevel<=re.ERROR){const t=e.map(uh);xn.error(`Firestore (${qs}): ${n}`,...t)}}function It(n,...e){if(xn.logLevel<=re.WARN){const t=e.map(uh);xn.warn(`Firestore (${qs}): ${n}`,...t)}}function uh(n){if(typeof n=="string")return n;try{/**
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
 */function q(n,e,t){let r="Unexpected state";typeof e=="string"?r=e:t=e,sg(n,r,t)}function sg(n,e,t){let r=`FIRESTORE (${qs}) INTERNAL ASSERTION FAILED: ${e} (ID: ${n.toString(16)})`;if(t!==void 0)try{r+=" CONTEXT: "+JSON.stringify(t)}catch{r+=" CONTEXT: "+t}throw Ne(r),new Error(r)}function z(n,e,t,r){let s="Unexpected state";typeof t=="string"?s=t:r=t,n||sg(e,s,r)}function Yv(n,e){n||q(57014,e)}function F(n,e){return n}/**
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
 */const P={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class D extends $t{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
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
 */class $e{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}/**
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
 */class ig{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class og{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable((()=>t(ze.UNAUTHENTICATED)))}shutdown(){}}class Xv{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable((()=>t(this.token.user)))}shutdown(){this.changeListener=null}}class Jv{constructor(e){this.t=e,this.currentUser=ze.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,t){z(this.o===void 0,42304);let r=this.i;const s=l=>this.i!==r?(r=this.i,t(l)):Promise.resolve();let i=new $e;this.o=()=>{this.i++,this.currentUser=this.u(),i.resolve(),i=new $e,e.enqueueRetryable((()=>s(this.currentUser)))};const o=()=>{const l=i;e.enqueueRetryable((async()=>{await l.promise,await s(this.currentUser)}))},a=l=>{x("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=l,this.o&&(this.auth.addAuthTokenListener(this.o),o())};this.t.onInit((l=>a(l))),setTimeout((()=>{if(!this.auth){const l=this.t.getImmediate({optional:!0});l?a(l):(x("FirebaseAuthCredentialsProvider","Auth not yet detected"),i.resolve(),i=new $e)}}),0),o()}getToken(){const e=this.i,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then((r=>this.i!==e?(x("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):r?(z(typeof r.accessToken=="string",31837,{l:r}),new ig(r.accessToken,this.currentUser)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const e=this.auth&&this.auth.getUid();return z(e===null||typeof e=="string",2055,{h:e}),new ze(e)}}class Zv{constructor(e,t,r){this.P=e,this.T=t,this.I=r,this.type="FirstParty",this.user=ze.FIRST_PARTY,this.A=new Map}R(){return this.I?this.I():null}get headers(){this.A.set("X-Goog-AuthUser",this.P);const e=this.R();return e&&this.A.set("Authorization",e),this.T&&this.A.set("X-Goog-Iam-Authorization-Token",this.T),this.A}}class eA{constructor(e,t,r){this.P=e,this.T=t,this.I=r}getToken(){return Promise.resolve(new Zv(this.P,this.T,this.I))}start(e,t){e.enqueueRetryable((()=>t(ze.FIRST_PARTY)))}shutdown(){}invalidateToken(){}}class du{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class tA{constructor(e,t){this.V=t,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,Vt(e)&&e.settings.appCheckToken&&(this.p=e.settings.appCheckToken)}start(e,t){z(this.o===void 0,3512);const r=i=>{i.error!=null&&x("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${i.error.message}`);const o=i.token!==this.m;return this.m=i.token,x("FirebaseAppCheckTokenProvider",`Received ${o?"new":"existing"} token.`),o?t(i.token):Promise.resolve()};this.o=i=>{e.enqueueRetryable((()=>r(i)))};const s=i=>{x("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=i,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit((i=>s(i))),setTimeout((()=>{if(!this.appCheck){const i=this.V.getImmediate({optional:!0});i?s(i):x("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}}),0)}getToken(){if(this.p)return Promise.resolve(new du(this.p));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then((t=>t?(z(typeof t.token=="string",44558,{tokenResult:t}),this.m=t.token,new du(t.token)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}class nA{getToken(){return Promise.resolve(new du(""))}invalidateToken(){}start(e,t){}shutdown(){}}/**
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
 */function rA(n){const e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(n);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let r=0;r<n;r++)t[r]=Math.floor(256*Math.random());return t}/**
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
 */class Cc{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516);let r="";for(;r.length<20;){const s=rA(40);for(let i=0;i<s.length;++i)r.length<20&&s[i]<t&&(r+=e.charAt(s[i]%62))}return r}}function j(n,e){return n<e?-1:n>e?1:0}function fu(n,e){const t=Math.min(n.length,e.length);for(let r=0;r<t;r++){const s=n.charAt(r),i=e.charAt(r);if(s!==i)return ql(s)===ql(i)?j(s,i):ql(s)?1:-1}return j(n.length,e.length)}const sA=55296,iA=57343;function ql(n){const e=n.charCodeAt(0);return e>=sA&&e<=iA}function ds(n,e,t){return n.length===e.length&&n.every(((r,s)=>t(r,e[s])))}function ag(n){return n+"\0"}/**
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
 */const pu="__name__";class Dt{constructor(e,t,r){t===void 0?t=0:t>e.length&&q(637,{offset:t,range:e.length}),r===void 0?r=e.length-t:r>e.length-t&&q(1746,{length:r,range:e.length-t}),this.segments=e,this.offset=t,this.len=r}get length(){return this.len}isEqual(e){return Dt.comparator(this,e)===0}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof Dt?e.forEach((r=>{t.push(r)})):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,r=this.limit();t<r;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const r=Math.min(e.length,t.length);for(let s=0;s<r;s++){const i=Dt.compareSegments(e.get(s),t.get(s));if(i!==0)return i}return j(e.length,t.length)}static compareSegments(e,t){const r=Dt.isNumericId(e),s=Dt.isNumericId(t);return r&&!s?-1:!r&&s?1:r&&s?Dt.extractNumericId(e).compare(Dt.extractNumericId(t)):fu(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return Cn.fromString(e.substring(4,e.length-2))}}class Z extends Dt{construct(e,t,r){return new Z(e,t,r)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const r of e){if(r.indexOf("//")>=0)throw new D(P.INVALID_ARGUMENT,`Invalid segment (${r}). Paths must not contain // in them.`);t.push(...r.split("/").filter((s=>s.length>0)))}return new Z(t)}static emptyPath(){return new Z([])}}const oA=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class Ie extends Dt{construct(e,t,r){return new Ie(e,t,r)}static isValidIdentifier(e){return oA.test(e)}canonicalString(){return this.toArray().map((e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),Ie.isValidIdentifier(e)||(e="`"+e+"`"),e))).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===pu}static keyField(){return new Ie([pu])}static fromServerFormat(e){const t=[];let r="",s=0;const i=()=>{if(r.length===0)throw new D(P.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(r),r=""};let o=!1;for(;s<e.length;){const a=e[s];if(a==="\\"){if(s+1===e.length)throw new D(P.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const l=e[s+1];if(l!=="\\"&&l!=="."&&l!=="`")throw new D(P.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);r+=l,s+=2}else a==="`"?(o=!o,s++):a!=="."||o?(r+=a,s++):(i(),s++)}if(i(),o)throw new D(P.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new Ie(t)}static emptyPath(){return new Ie([])}}/**
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
 */class M{constructor(e){this.path=e}static fromPath(e){return new M(Z.fromString(e))}static fromName(e){return new M(Z.fromString(e).popFirst(5))}static empty(){return new M(Z.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&Z.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return Z.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new M(new Z(e.slice()))}}/**
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
 */function hh(n,e,t){if(!t)throw new D(P.INVALID_ARGUMENT,`Function ${n}() cannot be called with an empty ${e}.`)}function cg(n,e,t,r){if(e===!0&&r===!0)throw new D(P.INVALID_ARGUMENT,`${n} and ${t} cannot be used together.`)}function gp(n){if(!M.isDocumentKey(n))throw new D(P.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${n} has ${n.length}.`)}function yp(n){if(M.isDocumentKey(n))throw new D(P.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${n} has ${n.length}.`)}function lg(n){return typeof n=="object"&&n!==null&&(Object.getPrototypeOf(n)===Object.prototype||Object.getPrototypeOf(n)===null)}function Pc(n){if(n===void 0)return"undefined";if(n===null)return"null";if(typeof n=="string")return n.length>20&&(n=`${n.substring(0,20)}...`),JSON.stringify(n);if(typeof n=="number"||typeof n=="boolean")return""+n;if(typeof n=="object"){if(n instanceof Array)return"an array";{const e=(function(r){return r.constructor?r.constructor.name:null})(n);return e?`a custom ${e} object`:"an object"}}return typeof n=="function"?"a function":q(12329,{type:typeof n})}function te(n,e){if("_delegate"in n&&(n=n._delegate),!(n instanceof e)){if(e.name===n.constructor.name)throw new D(P.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const t=Pc(n);throw new D(P.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return n}function ug(n,e){if(e<=0)throw new D(P.INVALID_ARGUMENT,`Function ${n}() requires a positive number, but it was: ${e}.`)}/**
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
 */function Ve(n,e){const t={typeString:n};return e&&(t.value=e),t}function Vr(n,e){if(!lg(n))throw new D(P.INVALID_ARGUMENT,"JSON must be an object");let t;for(const r in e)if(e[r]){const s=e[r].typeString,i="value"in e[r]?{value:e[r].value}:void 0;if(!(r in n)){t=`JSON missing required field: '${r}'`;break}const o=n[r];if(s&&typeof o!==s){t=`JSON field '${r}' must be a ${s}.`;break}if(i!==void 0&&o!==i.value){t=`Expected '${r}' field to equal '${i.value}'`;break}}if(t)throw new D(P.INVALID_ARGUMENT,t);return!0}/**
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
 */const Ip=-62135596800,Ep=1e6;class ce{static now(){return ce.fromMillis(Date.now())}static fromDate(e){return ce.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),r=Math.floor((e-1e3*t)*Ep);return new ce(t,r)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new D(P.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new D(P.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<Ip)throw new D(P.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new D(P.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/Ep}_compareTo(e){return this.seconds===e.seconds?j(this.nanoseconds,e.nanoseconds):j(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:ce._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(Vr(e,ce._jsonSchema))return new ce(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-Ip;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}ce._jsonSchemaVersion="firestore/timestamp/1.0",ce._jsonSchema={type:Ve("string",ce._jsonSchemaVersion),seconds:Ve("number"),nanoseconds:Ve("number")};/**
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
 */class G{static fromTimestamp(e){return new G(e)}static min(){return new G(new ce(0,0))}static max(){return new G(new ce(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
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
 */const fs=-1;class ps{constructor(e,t,r,s){this.indexId=e,this.collectionGroup=t,this.fields=r,this.indexState=s}}function _u(n){return n.fields.find((e=>e.kind===2))}function or(n){return n.fields.filter((e=>e.kind!==2))}function aA(n,e){let t=j(n.collectionGroup,e.collectionGroup);if(t!==0)return t;for(let r=0;r<Math.min(n.fields.length,e.fields.length);++r)if(t=cA(n.fields[r],e.fields[r]),t!==0)return t;return j(n.fields.length,e.fields.length)}ps.UNKNOWN_ID=-1;class gr{constructor(e,t){this.fieldPath=e,this.kind=t}}function cA(n,e){const t=Ie.comparator(n.fieldPath,e.fieldPath);return t!==0?t:j(n.kind,e.kind)}class _s{constructor(e,t){this.sequenceNumber=e,this.offset=t}static empty(){return new _s(0,Et.min())}}function hg(n,e){const t=n.toTimestamp().seconds,r=n.toTimestamp().nanoseconds+1,s=G.fromTimestamp(r===1e9?new ce(t+1,0):new ce(t,r));return new Et(s,M.empty(),e)}function dg(n){return new Et(n.readTime,n.key,fs)}class Et{constructor(e,t,r){this.readTime=e,this.documentKey=t,this.largestBatchId=r}static min(){return new Et(G.min(),M.empty(),fs)}static max(){return new Et(G.max(),M.empty(),fs)}}function dh(n,e){let t=n.readTime.compareTo(e.readTime);return t!==0?t:(t=M.comparator(n.documentKey,e.documentKey),t!==0?t:j(n.largestBatchId,e.largestBatchId))}/**
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
 */const fg="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class pg{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach((e=>e()))}}/**
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
 */async function $n(n){if(n.code!==P.FAILED_PRECONDITION||n.message!==fg)throw n;x("LocalStore","Unexpectedly lost primary lease")}/**
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
 */class b{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e((t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t)}),(t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t)}))}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&q(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new b(((r,s)=>{this.nextCallback=i=>{this.wrapSuccess(e,i).next(r,s)},this.catchCallback=i=>{this.wrapFailure(t,i).next(r,s)}}))}toPromise(){return new Promise(((e,t)=>{this.next(e,t)}))}wrapUserFunction(e){try{const t=e();return t instanceof b?t:b.resolve(t)}catch(t){return b.reject(t)}}wrapSuccess(e,t){return e?this.wrapUserFunction((()=>e(t))):b.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction((()=>e(t))):b.reject(t)}static resolve(e){return new b(((t,r)=>{t(e)}))}static reject(e){return new b(((t,r)=>{r(e)}))}static waitFor(e){return new b(((t,r)=>{let s=0,i=0,o=!1;e.forEach((a=>{++s,a.next((()=>{++i,o&&i===s&&t()}),(l=>r(l)))})),o=!0,i===s&&t()}))}static or(e){let t=b.resolve(!1);for(const r of e)t=t.next((s=>s?b.resolve(s):r()));return t}static forEach(e,t){const r=[];return e.forEach(((s,i)=>{r.push(t.call(this,s,i))})),this.waitFor(r)}static mapArray(e,t){return new b(((r,s)=>{const i=e.length,o=new Array(i);let a=0;for(let l=0;l<i;l++){const u=l;t(e[u]).next((h=>{o[u]=h,++a,a===i&&r(o)}),(h=>s(h)))}}))}static doWhile(e,t){return new b(((r,s)=>{const i=()=>{e()===!0?t().next((()=>{i()}),s):r()};i()}))}}/**
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
 */const gt="SimpleDb";class Nc{static open(e,t,r,s){try{return new Nc(t,e.transaction(s,r))}catch(i){throw new Oi(t,i)}}constructor(e,t){this.action=e,this.transaction=t,this.aborted=!1,this.S=new $e,this.transaction.oncomplete=()=>{this.S.resolve()},this.transaction.onabort=()=>{t.error?this.S.reject(new Oi(e,t.error)):this.S.resolve()},this.transaction.onerror=r=>{const s=fh(r.target.error);this.S.reject(new Oi(e,s))}}get D(){return this.S.promise}abort(e){e&&this.S.reject(e),this.aborted||(x(gt,"Aborting transaction:",e?e.message:"Client-initiated abort"),this.aborted=!0,this.transaction.abort())}C(){const e=this.transaction;this.aborted||typeof e.commit!="function"||e.commit()}store(e){const t=this.transaction.objectStore(e);return new uA(t)}}class Ut{static delete(e){return x(gt,"Removing database:",e),lr(qm().indexedDB.deleteDatabase(e)).toPromise()}static v(){if(!Km())return!1;if(Ut.F())return!0;const e=_t(),t=Ut.M(e),r=0<t&&t<10,s=_g(e),i=0<s&&s<4.5;return!(e.indexOf("MSIE ")>0||e.indexOf("Trident/")>0||e.indexOf("Edge/")>0||r||i)}static F(){var e;return typeof process<"u"&&((e=process.__PRIVATE_env)==null?void 0:e.__PRIVATE_USE_MOCK_PERSISTENCE)==="YES"}static O(e,t){return e.store(t)}static M(e){const t=e.match(/i(?:phone|pad|pod) os ([\d_]+)/i),r=t?t[1].split("_").slice(0,2).join("."):"-1";return Number(r)}constructor(e,t,r){this.name=e,this.version=t,this.N=r,this.B=null,Ut.M(_t())===12.2&&Ne("Firestore persistence suffers from a bug in iOS 12.2 Safari that may cause your app to stop working. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.")}async L(e){return this.db||(x(gt,"Opening database:",this.name),this.db=await new Promise(((t,r)=>{const s=indexedDB.open(this.name,this.version);s.onsuccess=i=>{const o=i.target.result;t(o)},s.onblocked=()=>{r(new Oi(e,"Cannot upgrade IndexedDB schema while another tab is open. Close all tabs that access Firestore and reload this page to proceed."))},s.onerror=i=>{const o=i.target.error;o.name==="VersionError"?r(new D(P.FAILED_PRECONDITION,"A newer version of the Firestore SDK was previously used and so the persisted data is not compatible with the version of the SDK you are now using. The SDK will operate with persistence disabled. If you need persistence, please re-upgrade to a newer version of the SDK or else clear the persisted IndexedDB data for your app to start fresh.")):o.name==="InvalidStateError"?r(new D(P.FAILED_PRECONDITION,"Unable to open an IndexedDB connection. This could be due to running in a private browsing session on a browser whose private browsing sessions do not support IndexedDB: "+o)):r(new Oi(e,o))},s.onupgradeneeded=i=>{x(gt,'Database "'+this.name+'" requires upgrade from version:',i.oldVersion);const o=i.target.result;this.N.k(o,s.transaction,i.oldVersion,this.version).next((()=>{x(gt,"Database upgrade to version "+this.version+" complete")}))}}))),this.q&&(this.db.onversionchange=t=>this.q(t)),this.db}$(e){this.q=e,this.db&&(this.db.onversionchange=t=>e(t))}async runTransaction(e,t,r,s){const i=t==="readonly";let o=0;for(;;){++o;try{this.db=await this.L(e);const a=Nc.open(this.db,e,i?"readonly":"readwrite",r),l=s(a).next((u=>(a.C(),u))).catch((u=>(a.abort(u),b.reject(u)))).toPromise();return l.catch((()=>{})),await a.D,l}catch(a){const l=a,u=l.name!=="FirebaseError"&&o<3;if(x(gt,"Transaction failed with error:",l.message,"Retrying:",u),this.close(),!u)return Promise.reject(l)}}}close(){this.db&&this.db.close(),this.db=void 0}}function _g(n){const e=n.match(/Android ([\d.]+)/i),t=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(t)}class lA{constructor(e){this.U=e,this.K=!1,this.W=null}get isDone(){return this.K}get G(){return this.W}set cursor(e){this.U=e}done(){this.K=!0}j(e){this.W=e}delete(){return lr(this.U.delete())}}class Oi extends D{constructor(e,t){super(P.UNAVAILABLE,`IndexedDB transaction '${e}' failed: ${t}`),this.name="IndexedDbTransactionError"}}function jn(n){return n.name==="IndexedDbTransactionError"}class uA{constructor(e){this.store=e}put(e,t){let r;return t!==void 0?(x(gt,"PUT",this.store.name,e,t),r=this.store.put(t,e)):(x(gt,"PUT",this.store.name,"<auto-key>",e),r=this.store.put(e)),lr(r)}add(e){return x(gt,"ADD",this.store.name,e,e),lr(this.store.add(e))}get(e){return lr(this.store.get(e)).next((t=>(t===void 0&&(t=null),x(gt,"GET",this.store.name,e,t),t)))}delete(e){return x(gt,"DELETE",this.store.name,e),lr(this.store.delete(e))}count(){return x(gt,"COUNT",this.store.name),lr(this.store.count())}J(e,t){const r=this.options(e,t),s=r.index?this.store.index(r.index):this.store;if(typeof s.getAll=="function"){const i=s.getAll(r.range);return new b(((o,a)=>{i.onerror=l=>{a(l.target.error)},i.onsuccess=l=>{o(l.target.result)}}))}{const i=this.cursor(r),o=[];return this.H(i,((a,l)=>{o.push(l)})).next((()=>o))}}Y(e,t){const r=this.store.getAll(e,t===null?void 0:t);return new b(((s,i)=>{r.onerror=o=>{i(o.target.error)},r.onsuccess=o=>{s(o.target.result)}}))}Z(e,t){x(gt,"DELETE ALL",this.store.name);const r=this.options(e,t);r.X=!1;const s=this.cursor(r);return this.H(s,((i,o,a)=>a.delete()))}ee(e,t){let r;t?r=e:(r={},t=e);const s=this.cursor(r);return this.H(s,t)}te(e){const t=this.cursor({});return new b(((r,s)=>{t.onerror=i=>{const o=fh(i.target.error);s(o)},t.onsuccess=i=>{const o=i.target.result;o?e(o.primaryKey,o.value).next((a=>{a?o.continue():r()})):r()}}))}H(e,t){const r=[];return new b(((s,i)=>{e.onerror=o=>{i(o.target.error)},e.onsuccess=o=>{const a=o.target.result;if(!a)return void s();const l=new lA(a),u=t(a.primaryKey,a.value,l);if(u instanceof b){const h=u.catch((f=>(l.done(),b.reject(f))));r.push(h)}l.isDone?s():l.G===null?a.continue():a.continue(l.G)}})).next((()=>b.waitFor(r)))}options(e,t){let r;return e!==void 0&&(typeof e=="string"?r=e:t=e),{index:r,range:t}}cursor(e){let t="next";if(e.reverse&&(t="prev"),e.index){const r=this.store.index(e.index);return e.X?r.openKeyCursor(e.range,t):r.openCursor(e.range,t)}return this.store.openCursor(e.range,t)}}function lr(n){return new b(((e,t)=>{n.onsuccess=r=>{const s=r.target.result;e(s)},n.onerror=r=>{const s=fh(r.target.error);t(s)}}))}let Tp=!1;function fh(n){const e=Ut.M(_t());if(e>=12.2&&e<13){const t="An internal error was encountered in the Indexed Database server";if(n.message.indexOf(t)>=0){const r=new D("internal",`IOS_INDEXEDDB_BUG1: IndexedDb has thrown '${t}'. This is likely due to an unavoidable bug in iOS. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.`);return Tp||(Tp=!0,setTimeout((()=>{throw r}),0)),r}}return n}const Mi="IndexBackfiller";class hA{constructor(e,t){this.asyncQueue=e,this.ne=t,this.task=null}start(){this.re(15e3)}stop(){this.task&&(this.task.cancel(),this.task=null)}get started(){return this.task!==null}re(e){x(Mi,`Scheduled in ${e}ms`),this.task=this.asyncQueue.enqueueAfterDelay("index_backfill",e,(async()=>{this.task=null;try{const t=await this.ne.ie();x(Mi,`Documents written: ${t}`)}catch(t){jn(t)?x(Mi,"Ignoring IndexedDB error during index backfill: ",t):await $n(t)}await this.re(6e4)}))}}class dA{constructor(e,t){this.localStore=e,this.persistence=t}async ie(e=50){return this.persistence.runTransaction("Backfill Indexes","readwrite-primary",(t=>this.se(t,e)))}se(e,t){const r=new Set;let s=t,i=!0;return b.doWhile((()=>i===!0&&s>0),(()=>this.localStore.indexManager.getNextCollectionGroupToUpdate(e).next((o=>{if(o!==null&&!r.has(o))return x(Mi,`Processing collection: ${o}`),this.oe(e,o,s).next((a=>{s-=a,r.add(o)}));i=!1})))).next((()=>t-s))}oe(e,t,r){return this.localStore.indexManager.getMinOffsetFromCollectionGroup(e,t).next((s=>this.localStore.localDocuments.getNextDocuments(e,t,s,r).next((i=>{const o=i.changes;return this.localStore.indexManager.updateIndexEntries(e,o).next((()=>this._e(s,i))).next((a=>(x(Mi,`Updating offset: ${a}`),this.localStore.indexManager.updateCollectionGroup(e,t,a)))).next((()=>o.size))}))))}_e(e,t){let r=e;return t.changes.forEach(((s,i)=>{const o=dg(i);dh(o,r)>0&&(r=o)})),new Et(r.readTime,r.documentKey,Math.max(t.batchId,e.largestBatchId))}}/**
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
 */class ot{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=r=>this.ae(r),this.ue=r=>t.writeSequenceNumber(r))}ae(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.ue&&this.ue(e),e}}ot.ce=-1;/**
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
 */const Pn=-1;function Ro(n){return n==null}function to(n){return n===0&&1/n==-1/0}function mg(n){return typeof n=="number"&&Number.isInteger(n)&&!to(n)&&n<=Number.MAX_SAFE_INTEGER&&n>=Number.MIN_SAFE_INTEGER}/**
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
 */const qa="";function Ye(n){let e="";for(let t=0;t<n.length;t++)e.length>0&&(e=wp(e)),e=fA(n.get(t),e);return wp(e)}function fA(n,e){let t=e;const r=n.length;for(let s=0;s<r;s++){const i=n.charAt(s);switch(i){case"\0":t+="";break;case qa:t+="";break;default:t+=i}}return t}function wp(n){return n+qa+""}function Ot(n){const e=n.length;if(z(e>=2,64408,{path:n}),e===2)return z(n.charAt(0)===qa&&n.charAt(1)==="",56145,{path:n}),Z.emptyPath();const t=e-2,r=[];let s="";for(let i=0;i<e;){const o=n.indexOf(qa,i);switch((o<0||o>t)&&q(50515,{path:n}),n.charAt(o+1)){case"":const a=n.substring(i,o);let l;s.length===0?l=a:(s+=a,l=s,s=""),r.push(l);break;case"":s+=n.substring(i,o),s+="\0";break;case"":s+=n.substring(i,o+1);break;default:q(61167,{path:n})}i=o+2}return new Z(r)}/**
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
 */const ar="remoteDocuments",So="owner",jr="owner",no="mutationQueues",pA="userId",At="mutations",vp="batchId",fr="userMutationsIndex",Ap=["userId","batchId"];/**
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
 */function Aa(n,e){return[n,Ye(e)]}function gg(n,e,t){return[n,Ye(e),t]}const _A={},ms="documentMutations",za="remoteDocumentsV14",mA=["prefixPath","collectionGroup","readTime","documentId"],ba="documentKeyIndex",gA=["prefixPath","collectionGroup","documentId"],yg="collectionGroupIndex",yA=["collectionGroup","readTime","prefixPath","documentId"],ro="remoteDocumentGlobal",mu="remoteDocumentGlobalKey",gs="targets",Ig="queryTargetsIndex",IA=["canonicalId","targetId"],ys="targetDocuments",EA=["targetId","path"],ph="documentTargetsIndex",TA=["path","targetId"],Ga="targetGlobalKey",yr="targetGlobal",so="collectionParents",wA=["collectionId","parent"],Is="clientMetadata",vA="clientId",kc="bundles",AA="bundleId",Dc="namedQueries",bA="name",_h="indexConfiguration",RA="indexId",gu="collectionGroupIndex",SA="collectionGroup",Li="indexState",CA=["indexId","uid"],Eg="sequenceNumberIndex",PA=["uid","sequenceNumber"],Fi="indexEntries",NA=["indexId","uid","arrayValue","directionalValue","orderedDocumentKey","documentKey"],Tg="documentKeyIndex",kA=["indexId","uid","orderedDocumentKey"],xc="documentOverlays",DA=["userId","collectionPath","documentId"],yu="collectionPathOverlayIndex",xA=["userId","collectionPath","largestBatchId"],wg="collectionGroupOverlayIndex",VA=["userId","collectionGroup","largestBatchId"],mh="globals",OA="name",vg=[no,At,ms,ar,gs,So,yr,ys,Is,ro,so,kc,Dc],MA=[...vg,xc],Ag=[no,At,ms,za,gs,So,yr,ys,Is,ro,so,kc,Dc,xc],bg=Ag,gh=[...bg,_h,Li,Fi],LA=gh,Rg=[...gh,mh],FA=Rg;/**
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
 */class Iu extends pg{constructor(e,t){super(),this.le=e,this.currentSequenceNumber=t}}function Fe(n,e){const t=F(n);return Ut.O(t.le,e)}/**
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
 */function bp(n){let e=0;for(const t in n)Object.prototype.hasOwnProperty.call(n,t)&&e++;return e}function Wn(n,e){for(const t in n)Object.prototype.hasOwnProperty.call(n,t)&&e(t,n[t])}function Sg(n,e){const t=[];for(const r in n)Object.prototype.hasOwnProperty.call(n,r)&&t.push(e(n[r],r,n));return t}function Cg(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}/**
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
 */let be=class Eu{constructor(e,t){this.comparator=e,this.root=t||Nn.EMPTY}insert(e,t){return new Eu(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,Nn.BLACK,null,null))}remove(e){return new Eu(this.comparator,this.root.remove(e,this.comparator).copy(null,null,Nn.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){const r=this.comparator(e,t.key);if(r===0)return t.value;r<0?t=t.left:r>0&&(t=t.right)}return null}indexOf(e){let t=0,r=this.root;for(;!r.isEmpty();){const s=this.comparator(e,r.key);if(s===0)return t+r.left.size;s<0?r=r.left:(t+=r.left.size+1,r=r.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal(((t,r)=>(e(t,r),!1)))}toString(){const e=[];return this.inorderTraversal(((t,r)=>(e.push(`${t}:${r}`),!1))),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new ha(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new ha(this.root,e,this.comparator,!1)}getReverseIterator(){return new ha(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new ha(this.root,e,this.comparator,!0)}},ha=class{constructor(e,t,r,s){this.isReverse=s,this.nodeStack=[];let i=1;for(;!e.isEmpty();)if(i=t?r(e.key,t):1,t&&s&&(i*=-1),i<0)e=this.isReverse?e.left:e.right;else{if(i===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}},Nn=class Wt{constructor(e,t,r,s,i){this.key=e,this.value=t,this.color=r??Wt.RED,this.left=s??Wt.EMPTY,this.right=i??Wt.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,r,s,i){return new Wt(e??this.key,t??this.value,r??this.color,s??this.left,i??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,r){let s=this;const i=r(e,s.key);return s=i<0?s.copy(null,null,null,s.left.insert(e,t,r),null):i===0?s.copy(null,t,null,null,null):s.copy(null,null,null,null,s.right.insert(e,t,r)),s.fixUp()}removeMin(){if(this.left.isEmpty())return Wt.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let r,s=this;if(t(e,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(e,t),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),t(e,s.key)===0){if(s.right.isEmpty())return Wt.EMPTY;r=s.right.min(),s=s.copy(r.key,r.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(e,t))}return s.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,Wt.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,Wt.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw q(43730,{key:this.key,value:this.value});if(this.right.isRed())throw q(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw q(27949);return e+(this.isRed()?0:1)}};Nn.EMPTY=null,Nn.RED=!0,Nn.BLACK=!1;Nn.EMPTY=new class{constructor(){this.size=0}get key(){throw q(57766)}get value(){throw q(16141)}get color(){throw q(16727)}get left(){throw q(29726)}get right(){throw q(36894)}copy(e,t,r,s,i){return this}insert(e,t,r){return new Nn(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
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
 */class he{constructor(e){this.comparator=e,this.data=new be(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal(((t,r)=>(e(t),!1)))}forEachInRange(e,t){const r=this.data.getIteratorFrom(e[0]);for(;r.hasNext();){const s=r.getNext();if(this.comparator(s.key,e[1])>=0)return;t(s.key)}}forEachWhile(e,t){let r;for(r=t!==void 0?this.data.getIteratorFrom(t):this.data.getIterator();r.hasNext();)if(!e(r.getNext().key))return}firstAfterOrEqual(e){const t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new Rp(this.data.getIterator())}getIteratorFrom(e){return new Rp(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach((r=>{t=t.add(r)})),t}isEqual(e){if(!(e instanceof he)||this.size!==e.size)return!1;const t=this.data.getIterator(),r=e.data.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=r.getNext().key;if(this.comparator(s,i)!==0)return!1}return!0}toArray(){const e=[];return this.forEach((t=>{e.push(t)})),e}toString(){const e=[];return this.forEach((t=>e.push(t))),"SortedSet("+e.toString()+")"}copy(e){const t=new he(this.comparator);return t.data=e,t}}class Rp{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}function Wr(n){return n.hasNext()?n.getNext():void 0}/**
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
 */class at{constructor(e){this.fields=e,e.sort(Ie.comparator)}static empty(){return new at([])}unionWith(e){let t=new he(Ie.comparator);for(const r of this.fields)t=t.add(r);for(const r of e)t=t.add(r);return new at(t.toArray())}covers(e){for(const t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return ds(this.fields,e.fields,((t,r)=>t.isEqual(r)))}}/**
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
 */class Pg extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
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
 */function UA(){return typeof atob<"u"}/**
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
 */class Re{constructor(e){this.binaryString=e}static fromBase64String(e){const t=(function(s){try{return atob(s)}catch(i){throw typeof DOMException<"u"&&i instanceof DOMException?new Pg("Invalid base64 string: "+i):i}})(e);return new Re(t)}static fromUint8Array(e){const t=(function(s){let i="";for(let o=0;o<s.length;++o)i+=String.fromCharCode(s[o]);return i})(e);return new Re(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return(function(t){return btoa(t)})(this.binaryString)}toUint8Array(){return(function(t){const r=new Uint8Array(t.length);for(let s=0;s<t.length;s++)r[s]=t.charCodeAt(s);return r})(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return j(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}Re.EMPTY_BYTE_STRING=new Re("");const BA=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function rn(n){if(z(!!n,39018),typeof n=="string"){let e=0;const t=BA.exec(n);if(z(!!t,46558,{timestamp:n}),t[1]){let s=t[1];s=(s+"000000000").substr(0,9),e=Number(s)}const r=new Date(n);return{seconds:Math.floor(r.getTime()/1e3),nanos:e}}return{seconds:Te(n.seconds),nanos:Te(n.nanos)}}function Te(n){return typeof n=="number"?n:typeof n=="string"?Number(n):0}function sn(n){return typeof n=="string"?Re.fromBase64String(n):Re.fromUint8Array(n)}/**
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
 */const Ng="server_timestamp",kg="__type__",Dg="__previous_value__",xg="__local_write_time__";function Vc(n){var t,r;return((r=(((t=n==null?void 0:n.mapValue)==null?void 0:t.fields)||{})[kg])==null?void 0:r.stringValue)===Ng}function Oc(n){const e=n.mapValue.fields[Dg];return Vc(e)?Oc(e):e}function io(n){const e=rn(n.mapValue.fields[xg].timestampValue);return new ce(e.seconds,e.nanos)}/**
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
 */class qA{constructor(e,t,r,s,i,o,a,l,u,h){this.databaseId=e,this.appId=t,this.persistenceKey=r,this.host=s,this.ssl=i,this.forceLongPolling=o,this.autoDetectLongPolling=a,this.longPollingOptions=l,this.useFetchStreams=u,this.isUsingEmulator=h}}const oo="(default)";class Vn{constructor(e,t){this.projectId=e,this.database=t||oo}static empty(){return new Vn("","")}get isDefaultDatabase(){return this.database===oo}isEqual(e){return e instanceof Vn&&e.projectId===this.projectId&&e.database===this.database}}/**
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
 */const yh="__type__",Vg="__max__",bn={mapValue:{fields:{__type__:{stringValue:Vg}}}},Ih="__vector__",Es="value",Ra={nullValue:"NULL_VALUE"};function On(n){return"nullValue"in n?0:"booleanValue"in n?1:"integerValue"in n||"doubleValue"in n?2:"timestampValue"in n?3:"stringValue"in n?5:"bytesValue"in n?6:"referenceValue"in n?7:"geoPointValue"in n?8:"arrayValue"in n?9:"mapValue"in n?Vc(n)?4:Og(n)?9007199254740991:Mc(n)?10:11:q(28295,{value:n})}function zt(n,e){if(n===e)return!0;const t=On(n);if(t!==On(e))return!1;switch(t){case 0:case 9007199254740991:return!0;case 1:return n.booleanValue===e.booleanValue;case 4:return io(n).isEqual(io(e));case 3:return(function(s,i){if(typeof s.timestampValue=="string"&&typeof i.timestampValue=="string"&&s.timestampValue.length===i.timestampValue.length)return s.timestampValue===i.timestampValue;const o=rn(s.timestampValue),a=rn(i.timestampValue);return o.seconds===a.seconds&&o.nanos===a.nanos})(n,e);case 5:return n.stringValue===e.stringValue;case 6:return(function(s,i){return sn(s.bytesValue).isEqual(sn(i.bytesValue))})(n,e);case 7:return n.referenceValue===e.referenceValue;case 8:return(function(s,i){return Te(s.geoPointValue.latitude)===Te(i.geoPointValue.latitude)&&Te(s.geoPointValue.longitude)===Te(i.geoPointValue.longitude)})(n,e);case 2:return(function(s,i){if("integerValue"in s&&"integerValue"in i)return Te(s.integerValue)===Te(i.integerValue);if("doubleValue"in s&&"doubleValue"in i){const o=Te(s.doubleValue),a=Te(i.doubleValue);return o===a?to(o)===to(a):isNaN(o)&&isNaN(a)}return!1})(n,e);case 9:return ds(n.arrayValue.values||[],e.arrayValue.values||[],zt);case 10:case 11:return(function(s,i){const o=s.mapValue.fields||{},a=i.mapValue.fields||{};if(bp(o)!==bp(a))return!1;for(const l in o)if(o.hasOwnProperty(l)&&(a[l]===void 0||!zt(o[l],a[l])))return!1;return!0})(n,e);default:return q(52216,{left:n})}}function ao(n,e){return(n.values||[]).find((t=>zt(t,e)))!==void 0}function Mn(n,e){if(n===e)return 0;const t=On(n),r=On(e);if(t!==r)return j(t,r);switch(t){case 0:case 9007199254740991:return 0;case 1:return j(n.booleanValue,e.booleanValue);case 2:return(function(i,o){const a=Te(i.integerValue||i.doubleValue),l=Te(o.integerValue||o.doubleValue);return a<l?-1:a>l?1:a===l?0:isNaN(a)?isNaN(l)?0:-1:1})(n,e);case 3:return Sp(n.timestampValue,e.timestampValue);case 4:return Sp(io(n),io(e));case 5:return fu(n.stringValue,e.stringValue);case 6:return(function(i,o){const a=sn(i),l=sn(o);return a.compareTo(l)})(n.bytesValue,e.bytesValue);case 7:return(function(i,o){const a=i.split("/"),l=o.split("/");for(let u=0;u<a.length&&u<l.length;u++){const h=j(a[u],l[u]);if(h!==0)return h}return j(a.length,l.length)})(n.referenceValue,e.referenceValue);case 8:return(function(i,o){const a=j(Te(i.latitude),Te(o.latitude));return a!==0?a:j(Te(i.longitude),Te(o.longitude))})(n.geoPointValue,e.geoPointValue);case 9:return Cp(n.arrayValue,e.arrayValue);case 10:return(function(i,o){var _,g,w,R;const a=i.fields||{},l=o.fields||{},u=(_=a[Es])==null?void 0:_.arrayValue,h=(g=l[Es])==null?void 0:g.arrayValue,f=j(((w=u==null?void 0:u.values)==null?void 0:w.length)||0,((R=h==null?void 0:h.values)==null?void 0:R.length)||0);return f!==0?f:Cp(u,h)})(n.mapValue,e.mapValue);case 11:return(function(i,o){if(i===bn.mapValue&&o===bn.mapValue)return 0;if(i===bn.mapValue)return 1;if(o===bn.mapValue)return-1;const a=i.fields||{},l=Object.keys(a),u=o.fields||{},h=Object.keys(u);l.sort(),h.sort();for(let f=0;f<l.length&&f<h.length;++f){const _=fu(l[f],h[f]);if(_!==0)return _;const g=Mn(a[l[f]],u[h[f]]);if(g!==0)return g}return j(l.length,h.length)})(n.mapValue,e.mapValue);default:throw q(23264,{he:t})}}function Sp(n,e){if(typeof n=="string"&&typeof e=="string"&&n.length===e.length)return j(n,e);const t=rn(n),r=rn(e),s=j(t.seconds,r.seconds);return s!==0?s:j(t.nanos,r.nanos)}function Cp(n,e){const t=n.values||[],r=e.values||[];for(let s=0;s<t.length&&s<r.length;++s){const i=Mn(t[s],r[s]);if(i)return i}return j(t.length,r.length)}function Ts(n){return Tu(n)}function Tu(n){return"nullValue"in n?"null":"booleanValue"in n?""+n.booleanValue:"integerValue"in n?""+n.integerValue:"doubleValue"in n?""+n.doubleValue:"timestampValue"in n?(function(t){const r=rn(t);return`time(${r.seconds},${r.nanos})`})(n.timestampValue):"stringValue"in n?n.stringValue:"bytesValue"in n?(function(t){return sn(t).toBase64()})(n.bytesValue):"referenceValue"in n?(function(t){return M.fromName(t).toString()})(n.referenceValue):"geoPointValue"in n?(function(t){return`geo(${t.latitude},${t.longitude})`})(n.geoPointValue):"arrayValue"in n?(function(t){let r="[",s=!0;for(const i of t.values||[])s?s=!1:r+=",",r+=Tu(i);return r+"]"})(n.arrayValue):"mapValue"in n?(function(t){const r=Object.keys(t.fields||{}).sort();let s="{",i=!0;for(const o of r)i?i=!1:s+=",",s+=`${o}:${Tu(t.fields[o])}`;return s+"}"})(n.mapValue):q(61005,{value:n})}function Sa(n){switch(On(n)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const e=Oc(n);return e?16+Sa(e):16;case 5:return 2*n.stringValue.length;case 6:return sn(n.bytesValue).approximateByteSize();case 7:return n.referenceValue.length;case 9:return(function(r){return(r.values||[]).reduce(((s,i)=>s+Sa(i)),0)})(n.arrayValue);case 10:case 11:return(function(r){let s=0;return Wn(r.fields,((i,o)=>{s+=i.length+Sa(o)})),s})(n.mapValue);default:throw q(13486,{value:n})}}function Tr(n,e){return{referenceValue:`projects/${n.projectId}/databases/${n.database}/documents/${e.path.canonicalString()}`}}function wu(n){return!!n&&"integerValue"in n}function co(n){return!!n&&"arrayValue"in n}function Pp(n){return!!n&&"nullValue"in n}function Np(n){return!!n&&"doubleValue"in n&&isNaN(Number(n.doubleValue))}function Ca(n){return!!n&&"mapValue"in n}function Mc(n){var t,r;return((r=(((t=n==null?void 0:n.mapValue)==null?void 0:t.fields)||{})[yh])==null?void 0:r.stringValue)===Ih}function Ui(n){if(n.geoPointValue)return{geoPointValue:{...n.geoPointValue}};if(n.timestampValue&&typeof n.timestampValue=="object")return{timestampValue:{...n.timestampValue}};if(n.mapValue){const e={mapValue:{fields:{}}};return Wn(n.mapValue.fields,((t,r)=>e.mapValue.fields[t]=Ui(r))),e}if(n.arrayValue){const e={arrayValue:{values:[]}};for(let t=0;t<(n.arrayValue.values||[]).length;++t)e.arrayValue.values[t]=Ui(n.arrayValue.values[t]);return e}return{...n}}function Og(n){return(((n.mapValue||{}).fields||{}).__type__||{}).stringValue===Vg}const Mg={mapValue:{fields:{[yh]:{stringValue:Ih},[Es]:{arrayValue:{}}}}};function zA(n){return"nullValue"in n?Ra:"booleanValue"in n?{booleanValue:!1}:"integerValue"in n||"doubleValue"in n?{doubleValue:NaN}:"timestampValue"in n?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"stringValue"in n?{stringValue:""}:"bytesValue"in n?{bytesValue:""}:"referenceValue"in n?Tr(Vn.empty(),M.empty()):"geoPointValue"in n?{geoPointValue:{latitude:-90,longitude:-180}}:"arrayValue"in n?{arrayValue:{}}:"mapValue"in n?Mc(n)?Mg:{mapValue:{}}:q(35942,{value:n})}function GA(n){return"nullValue"in n?{booleanValue:!1}:"booleanValue"in n?{doubleValue:NaN}:"integerValue"in n||"doubleValue"in n?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"timestampValue"in n?{stringValue:""}:"stringValue"in n?{bytesValue:""}:"bytesValue"in n?Tr(Vn.empty(),M.empty()):"referenceValue"in n?{geoPointValue:{latitude:-90,longitude:-180}}:"geoPointValue"in n?{arrayValue:{}}:"arrayValue"in n?Mg:"mapValue"in n?Mc(n)?{mapValue:{}}:bn:q(61959,{value:n})}function kp(n,e){const t=Mn(n.value,e.value);return t!==0?t:n.inclusive&&!e.inclusive?-1:!n.inclusive&&e.inclusive?1:0}function Dp(n,e){const t=Mn(n.value,e.value);return t!==0?t:n.inclusive&&!e.inclusive?1:!n.inclusive&&e.inclusive?-1:0}/**
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
 */class We{constructor(e){this.value=e}static empty(){return new We({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let r=0;r<e.length-1;++r)if(t=(t.mapValue.fields||{})[e.get(r)],!Ca(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=Ui(t)}setAll(e){let t=Ie.emptyPath(),r={},s=[];e.forEach(((o,a)=>{if(!t.isImmediateParentOf(a)){const l=this.getFieldsMap(t);this.applyChanges(l,r,s),r={},s=[],t=a.popLast()}o?r[a.lastSegment()]=Ui(o):s.push(a.lastSegment())}));const i=this.getFieldsMap(t);this.applyChanges(i,r,s)}delete(e){const t=this.field(e.popLast());Ca(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return zt(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let r=0;r<e.length;++r){let s=t.mapValue.fields[e.get(r)];Ca(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},t.mapValue.fields[e.get(r)]=s),t=s}return t.mapValue.fields}applyChanges(e,t,r){Wn(t,((s,i)=>e[s]=i));for(const s of r)delete e[s]}clone(){return new We(Ui(this.value))}}function Lg(n){const e=[];return Wn(n.fields,((t,r)=>{const s=new Ie([t]);if(Ca(r)){const i=Lg(r.mapValue).fields;if(i.length===0)e.push(s);else for(const o of i)e.push(s.child(o))}else e.push(s)})),new at(e)}/**
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
 */class ye{constructor(e,t,r,s,i,o,a){this.key=e,this.documentType=t,this.version=r,this.readTime=s,this.createTime=i,this.data=o,this.documentState=a}static newInvalidDocument(e){return new ye(e,0,G.min(),G.min(),G.min(),We.empty(),0)}static newFoundDocument(e,t,r,s){return new ye(e,1,t,G.min(),r,s,0)}static newNoDocument(e,t){return new ye(e,2,t,G.min(),G.min(),We.empty(),0)}static newUnknownDocument(e,t){return new ye(e,3,t,G.min(),G.min(),We.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual(G.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=We.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=We.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=G.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof ye&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new ye(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
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
 */class Ln{constructor(e,t){this.position=e,this.inclusive=t}}function xp(n,e,t){let r=0;for(let s=0;s<n.position.length;s++){const i=e[s],o=n.position[s];if(i.field.isKeyField()?r=M.comparator(M.fromName(o.referenceValue),t.key):r=Mn(o,t.data.field(i.field)),i.dir==="desc"&&(r*=-1),r!==0)break}return r}function Vp(n,e){if(n===null)return e===null;if(e===null||n.inclusive!==e.inclusive||n.position.length!==e.position.length)return!1;for(let t=0;t<n.position.length;t++)if(!zt(n.position[t],e.position[t]))return!1;return!0}/**
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
 */class lo{constructor(e,t="asc"){this.field=e,this.dir=t}}function $A(n,e){return n.dir===e.dir&&n.field.isEqual(e.field)}/**
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
 */class Fg{}class se extends Fg{constructor(e,t,r){super(),this.field=e,this.op=t,this.value=r}static create(e,t,r){return e.isKeyField()?t==="in"||t==="not-in"?this.createKeyFieldInFilter(e,t,r):new jA(e,t,r):t==="array-contains"?new HA(e,r):t==="in"?new $g(e,r):t==="not-in"?new QA(e,r):t==="array-contains-any"?new YA(e,r):new se(e,t,r)}static createKeyFieldInFilter(e,t,r){return t==="in"?new WA(e,r):new KA(e,r)}matches(e){const t=e.data.field(this.field);return this.op==="!="?t!==null&&t.nullValue===void 0&&this.matchesComparison(Mn(t,this.value)):t!==null&&On(this.value)===On(t)&&this.matchesComparison(Mn(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return q(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class le extends Fg{constructor(e,t){super(),this.filters=e,this.op=t,this.Pe=null}static create(e,t){return new le(e,t)}matches(e){return ws(this)?this.filters.find((t=>!t.matches(e)))===void 0:this.filters.find((t=>t.matches(e)))!==void 0}getFlattenedFilters(){return this.Pe!==null||(this.Pe=this.filters.reduce(((e,t)=>e.concat(t.getFlattenedFilters())),[])),this.Pe}getFilters(){return Object.assign([],this.filters)}}function ws(n){return n.op==="and"}function vu(n){return n.op==="or"}function Eh(n){return Ug(n)&&ws(n)}function Ug(n){for(const e of n.filters)if(e instanceof le)return!1;return!0}function Au(n){if(n instanceof se)return n.field.canonicalString()+n.op.toString()+Ts(n.value);if(Eh(n))return n.filters.map((e=>Au(e))).join(",");{const e=n.filters.map((t=>Au(t))).join(",");return`${n.op}(${e})`}}function Bg(n,e){return n instanceof se?(function(r,s){return s instanceof se&&r.op===s.op&&r.field.isEqual(s.field)&&zt(r.value,s.value)})(n,e):n instanceof le?(function(r,s){return s instanceof le&&r.op===s.op&&r.filters.length===s.filters.length?r.filters.reduce(((i,o,a)=>i&&Bg(o,s.filters[a])),!0):!1})(n,e):void q(19439)}function qg(n,e){const t=n.filters.concat(e);return le.create(t,n.op)}function zg(n){return n instanceof se?(function(t){return`${t.field.canonicalString()} ${t.op} ${Ts(t.value)}`})(n):n instanceof le?(function(t){return t.op.toString()+" {"+t.getFilters().map(zg).join(" ,")+"}"})(n):"Filter"}class jA extends se{constructor(e,t,r){super(e,t,r),this.key=M.fromName(r.referenceValue)}matches(e){const t=M.comparator(e.key,this.key);return this.matchesComparison(t)}}class WA extends se{constructor(e,t){super(e,"in",t),this.keys=Gg("in",t)}matches(e){return this.keys.some((t=>t.isEqual(e.key)))}}class KA extends se{constructor(e,t){super(e,"not-in",t),this.keys=Gg("not-in",t)}matches(e){return!this.keys.some((t=>t.isEqual(e.key)))}}function Gg(n,e){var t;return(((t=e.arrayValue)==null?void 0:t.values)||[]).map((r=>M.fromName(r.referenceValue)))}class HA extends se{constructor(e,t){super(e,"array-contains",t)}matches(e){const t=e.data.field(this.field);return co(t)&&ao(t.arrayValue,this.value)}}class $g extends se{constructor(e,t){super(e,"in",t)}matches(e){const t=e.data.field(this.field);return t!==null&&ao(this.value.arrayValue,t)}}class QA extends se{constructor(e,t){super(e,"not-in",t)}matches(e){if(ao(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const t=e.data.field(this.field);return t!==null&&t.nullValue===void 0&&!ao(this.value.arrayValue,t)}}class YA extends se{constructor(e,t){super(e,"array-contains-any",t)}matches(e){const t=e.data.field(this.field);return!(!co(t)||!t.arrayValue.values)&&t.arrayValue.values.some((r=>ao(this.value.arrayValue,r)))}}/**
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
 */class XA{constructor(e,t=null,r=[],s=[],i=null,o=null,a=null){this.path=e,this.collectionGroup=t,this.orderBy=r,this.filters=s,this.limit=i,this.startAt=o,this.endAt=a,this.Te=null}}function bu(n,e=null,t=[],r=[],s=null,i=null,o=null){return new XA(n,e,t,r,s,i,o)}function wr(n){const e=F(n);if(e.Te===null){let t=e.path.canonicalString();e.collectionGroup!==null&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map((r=>Au(r))).join(","),t+="|ob:",t+=e.orderBy.map((r=>(function(i){return i.field.canonicalString()+i.dir})(r))).join(","),Ro(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map((r=>Ts(r))).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map((r=>Ts(r))).join(",")),e.Te=t}return e.Te}function Co(n,e){if(n.limit!==e.limit||n.orderBy.length!==e.orderBy.length)return!1;for(let t=0;t<n.orderBy.length;t++)if(!$A(n.orderBy[t],e.orderBy[t]))return!1;if(n.filters.length!==e.filters.length)return!1;for(let t=0;t<n.filters.length;t++)if(!Bg(n.filters[t],e.filters[t]))return!1;return n.collectionGroup===e.collectionGroup&&!!n.path.isEqual(e.path)&&!!Vp(n.startAt,e.startAt)&&Vp(n.endAt,e.endAt)}function $a(n){return M.isDocumentKey(n.path)&&n.collectionGroup===null&&n.filters.length===0}function ja(n,e){return n.filters.filter((t=>t instanceof se&&t.field.isEqual(e)))}function Op(n,e,t){let r=Ra,s=!0;for(const i of ja(n,e)){let o=Ra,a=!0;switch(i.op){case"<":case"<=":o=zA(i.value);break;case"==":case"in":case">=":o=i.value;break;case">":o=i.value,a=!1;break;case"!=":case"not-in":o=Ra}kp({value:r,inclusive:s},{value:o,inclusive:a})<0&&(r=o,s=a)}if(t!==null){for(let i=0;i<n.orderBy.length;++i)if(n.orderBy[i].field.isEqual(e)){const o=t.position[i];kp({value:r,inclusive:s},{value:o,inclusive:t.inclusive})<0&&(r=o,s=t.inclusive);break}}return{value:r,inclusive:s}}function Mp(n,e,t){let r=bn,s=!0;for(const i of ja(n,e)){let o=bn,a=!0;switch(i.op){case">=":case">":o=GA(i.value),a=!1;break;case"==":case"in":case"<=":o=i.value;break;case"<":o=i.value,a=!1;break;case"!=":case"not-in":o=bn}Dp({value:r,inclusive:s},{value:o,inclusive:a})>0&&(r=o,s=a)}if(t!==null){for(let i=0;i<n.orderBy.length;++i)if(n.orderBy[i].field.isEqual(e)){const o=t.position[i];Dp({value:r,inclusive:s},{value:o,inclusive:t.inclusive})>0&&(r=o,s=t.inclusive);break}}return{value:r,inclusive:s}}/**
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
 */class an{constructor(e,t=null,r=[],s=[],i=null,o="F",a=null,l=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=r,this.filters=s,this.limit=i,this.limitType=o,this.startAt=a,this.endAt=l,this.Ie=null,this.Ee=null,this.de=null,this.startAt,this.endAt}}function jg(n,e,t,r,s,i,o,a){return new an(n,e,t,r,s,i,o,a)}function zs(n){return new an(n)}function Lp(n){return n.filters.length===0&&n.limit===null&&n.startAt==null&&n.endAt==null&&(n.explicitOrderBy.length===0||n.explicitOrderBy.length===1&&n.explicitOrderBy[0].field.isKeyField())}function Th(n){return n.collectionGroup!==null}function ss(n){const e=F(n);if(e.Ie===null){e.Ie=[];const t=new Set;for(const i of e.explicitOrderBy)e.Ie.push(i),t.add(i.field.canonicalString());const r=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(o){let a=new he(Ie.comparator);return o.filters.forEach((l=>{l.getFlattenedFilters().forEach((u=>{u.isInequality()&&(a=a.add(u.field))}))})),a})(e).forEach((i=>{t.has(i.canonicalString())||i.isKeyField()||e.Ie.push(new lo(i,r))})),t.has(Ie.keyField().canonicalString())||e.Ie.push(new lo(Ie.keyField(),r))}return e.Ie}function Xe(n){const e=F(n);return e.Ee||(e.Ee=Kg(e,ss(n))),e.Ee}function Wg(n){const e=F(n);return e.de||(e.de=Kg(e,n.explicitOrderBy)),e.de}function Kg(n,e){if(n.limitType==="F")return bu(n.path,n.collectionGroup,e,n.filters,n.limit,n.startAt,n.endAt);{e=e.map((s=>{const i=s.dir==="desc"?"asc":"desc";return new lo(s.field,i)}));const t=n.endAt?new Ln(n.endAt.position,n.endAt.inclusive):null,r=n.startAt?new Ln(n.startAt.position,n.startAt.inclusive):null;return bu(n.path,n.collectionGroup,e,n.filters,n.limit,t,r)}}function Ru(n,e){const t=n.filters.concat([e]);return new an(n.path,n.collectionGroup,n.explicitOrderBy.slice(),t,n.limit,n.limitType,n.startAt,n.endAt)}function Wa(n,e,t){return new an(n.path,n.collectionGroup,n.explicitOrderBy.slice(),n.filters.slice(),e,t,n.startAt,n.endAt)}function Po(n,e){return Co(Xe(n),Xe(e))&&n.limitType===e.limitType}function Hg(n){return`${wr(Xe(n))}|lt:${n.limitType}`}function es(n){return`Query(target=${(function(t){let r=t.path.canonicalString();return t.collectionGroup!==null&&(r+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(r+=`, filters: [${t.filters.map((s=>zg(s))).join(", ")}]`),Ro(t.limit)||(r+=", limit: "+t.limit),t.orderBy.length>0&&(r+=`, orderBy: [${t.orderBy.map((s=>(function(o){return`${o.field.canonicalString()} (${o.dir})`})(s))).join(", ")}]`),t.startAt&&(r+=", startAt: ",r+=t.startAt.inclusive?"b:":"a:",r+=t.startAt.position.map((s=>Ts(s))).join(",")),t.endAt&&(r+=", endAt: ",r+=t.endAt.inclusive?"a:":"b:",r+=t.endAt.position.map((s=>Ts(s))).join(",")),`Target(${r})`})(Xe(n))}; limitType=${n.limitType})`}function No(n,e){return e.isFoundDocument()&&(function(r,s){const i=s.key.path;return r.collectionGroup!==null?s.key.hasCollectionId(r.collectionGroup)&&r.path.isPrefixOf(i):M.isDocumentKey(r.path)?r.path.isEqual(i):r.path.isImmediateParentOf(i)})(n,e)&&(function(r,s){for(const i of ss(r))if(!i.field.isKeyField()&&s.data.field(i.field)===null)return!1;return!0})(n,e)&&(function(r,s){for(const i of r.filters)if(!i.matches(s))return!1;return!0})(n,e)&&(function(r,s){return!(r.startAt&&!(function(o,a,l){const u=xp(o,a,l);return o.inclusive?u<=0:u<0})(r.startAt,ss(r),s)||r.endAt&&!(function(o,a,l){const u=xp(o,a,l);return o.inclusive?u>=0:u>0})(r.endAt,ss(r),s))})(n,e)}function Qg(n){return n.collectionGroup||(n.path.length%2==1?n.path.lastSegment():n.path.get(n.path.length-2))}function Yg(n){return(e,t)=>{let r=!1;for(const s of ss(n)){const i=JA(s,e,t);if(i!==0)return i;r=r||s.field.isKeyField()}return 0}}function JA(n,e,t){const r=n.field.isKeyField()?M.comparator(e.key,t.key):(function(i,o,a){const l=o.data.field(i),u=a.data.field(i);return l!==null&&u!==null?Mn(l,u):q(42886)})(n.field,e,t);switch(n.dir){case"asc":return r;case"desc":return-1*r;default:return q(19790,{direction:n.dir})}}/**
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
 */class cn{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){const t=this.mapKeyFn(e),r=this.inner[t];if(r!==void 0){for(const[s,i]of r)if(this.equalsFn(s,e))return i}}has(e){return this.get(e)!==void 0}set(e,t){const r=this.mapKeyFn(e),s=this.inner[r];if(s===void 0)return this.inner[r]=[[e,t]],void this.innerSize++;for(let i=0;i<s.length;i++)if(this.equalsFn(s[i][0],e))return void(s[i]=[e,t]);s.push([e,t]),this.innerSize++}delete(e){const t=this.mapKeyFn(e),r=this.inner[t];if(r===void 0)return!1;for(let s=0;s<r.length;s++)if(this.equalsFn(r[s][0],e))return r.length===1?delete this.inner[t]:r.splice(s,1),this.innerSize--,!0;return!1}forEach(e){Wn(this.inner,((t,r)=>{for(const[s,i]of r)e(s,i)}))}isEmpty(){return Cg(this.inner)}size(){return this.innerSize}}/**
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
 */const ZA=new be(M.comparator);function ct(){return ZA}const Xg=new be(M.comparator);function Ni(...n){let e=Xg;for(const t of n)e=e.insert(t.key,t);return e}function Jg(n){let e=Xg;return n.forEach(((t,r)=>e=e.insert(t,r.overlayedDocument))),e}function Mt(){return Bi()}function Zg(){return Bi()}function Bi(){return new cn((n=>n.toString()),((n,e)=>n.isEqual(e)))}const eb=new be(M.comparator),tb=new he(M.comparator);function K(...n){let e=tb;for(const t of n)e=e.add(t);return e}const nb=new he(j);function wh(){return nb}/**
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
 */function vh(n,e){if(n.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:to(e)?"-0":e}}function ey(n){return{integerValue:""+n}}function ty(n,e){return mg(e)?ey(e):vh(n,e)}/**
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
 */class Lc{constructor(){this._=void 0}}function rb(n,e,t){return n instanceof vs?(function(s,i){const o={fields:{[kg]:{stringValue:Ng},[xg]:{timestampValue:{seconds:s.seconds,nanos:s.nanoseconds}}}};return i&&Vc(i)&&(i=Oc(i)),i&&(o.fields[Dg]=i),{mapValue:o}})(t,e):n instanceof vr?ry(n,e):n instanceof Ar?sy(n,e):(function(s,i){const o=ny(s,i),a=Fp(o)+Fp(s.Ae);return wu(o)&&wu(s.Ae)?ey(a):vh(s.serializer,a)})(n,e)}function sb(n,e,t){return n instanceof vr?ry(n,e):n instanceof Ar?sy(n,e):t}function ny(n,e){return n instanceof As?(function(r){return wu(r)||(function(i){return!!i&&"doubleValue"in i})(r)})(e)?e:{integerValue:0}:null}class vs extends Lc{}class vr extends Lc{constructor(e){super(),this.elements=e}}function ry(n,e){const t=iy(e);for(const r of n.elements)t.some((s=>zt(s,r)))||t.push(r);return{arrayValue:{values:t}}}class Ar extends Lc{constructor(e){super(),this.elements=e}}function sy(n,e){let t=iy(e);for(const r of n.elements)t=t.filter((s=>!zt(s,r)));return{arrayValue:{values:t}}}class As extends Lc{constructor(e,t){super(),this.serializer=e,this.Ae=t}}function Fp(n){return Te(n.integerValue||n.doubleValue)}function iy(n){return co(n)&&n.arrayValue.values?n.arrayValue.values.slice():[]}/**
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
 */class ko{constructor(e,t){this.field=e,this.transform=t}}function ib(n,e){return n.field.isEqual(e.field)&&(function(r,s){return r instanceof vr&&s instanceof vr||r instanceof Ar&&s instanceof Ar?ds(r.elements,s.elements,zt):r instanceof As&&s instanceof As?zt(r.Ae,s.Ae):r instanceof vs&&s instanceof vs})(n.transform,e.transform)}class ob{constructor(e,t){this.version=e,this.transformResults=t}}class we{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new we}static exists(e){return new we(void 0,e)}static updateTime(e){return new we(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function Pa(n,e){return n.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(n.updateTime):n.exists===void 0||n.exists===e.isFoundDocument()}class Fc{}function oy(n,e){if(!n.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return n.isNoDocument()?new $s(n.key,we.none()):new Gs(n.key,n.data,we.none());{const t=n.data,r=We.empty();let s=new he(Ie.comparator);for(let i of e.fields)if(!s.has(i)){let o=t.field(i);o===null&&i.length>1&&(i=i.popLast(),o=t.field(i)),o===null?r.delete(i):r.set(i,o),s=s.add(i)}return new ln(n.key,r,new at(s.toArray()),we.none())}}function ab(n,e,t){n instanceof Gs?(function(s,i,o){const a=s.value.clone(),l=Bp(s.fieldTransforms,i,o.transformResults);a.setAll(l),i.convertToFoundDocument(o.version,a).setHasCommittedMutations()})(n,e,t):n instanceof ln?(function(s,i,o){if(!Pa(s.precondition,i))return void i.convertToUnknownDocument(o.version);const a=Bp(s.fieldTransforms,i,o.transformResults),l=i.data;l.setAll(ay(s)),l.setAll(a),i.convertToFoundDocument(o.version,l).setHasCommittedMutations()})(n,e,t):(function(s,i,o){i.convertToNoDocument(o.version).setHasCommittedMutations()})(0,e,t)}function qi(n,e,t,r){return n instanceof Gs?(function(i,o,a,l){if(!Pa(i.precondition,o))return a;const u=i.value.clone(),h=qp(i.fieldTransforms,l,o);return u.setAll(h),o.convertToFoundDocument(o.version,u).setHasLocalMutations(),null})(n,e,t,r):n instanceof ln?(function(i,o,a,l){if(!Pa(i.precondition,o))return a;const u=qp(i.fieldTransforms,l,o),h=o.data;return h.setAll(ay(i)),h.setAll(u),o.convertToFoundDocument(o.version,h).setHasLocalMutations(),a===null?null:a.unionWith(i.fieldMask.fields).unionWith(i.fieldTransforms.map((f=>f.field)))})(n,e,t,r):(function(i,o,a){return Pa(i.precondition,o)?(o.convertToNoDocument(o.version).setHasLocalMutations(),null):a})(n,e,t)}function cb(n,e){let t=null;for(const r of n.fieldTransforms){const s=e.data.field(r.field),i=ny(r.transform,s||null);i!=null&&(t===null&&(t=We.empty()),t.set(r.field,i))}return t||null}function Up(n,e){return n.type===e.type&&!!n.key.isEqual(e.key)&&!!n.precondition.isEqual(e.precondition)&&!!(function(r,s){return r===void 0&&s===void 0||!(!r||!s)&&ds(r,s,((i,o)=>ib(i,o)))})(n.fieldTransforms,e.fieldTransforms)&&(n.type===0?n.value.isEqual(e.value):n.type!==1||n.data.isEqual(e.data)&&n.fieldMask.isEqual(e.fieldMask))}class Gs extends Fc{constructor(e,t,r,s=[]){super(),this.key=e,this.value=t,this.precondition=r,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}}class ln extends Fc{constructor(e,t,r,s,i=[]){super(),this.key=e,this.data=t,this.fieldMask=r,this.precondition=s,this.fieldTransforms=i,this.type=1}getFieldMask(){return this.fieldMask}}function ay(n){const e=new Map;return n.fieldMask.fields.forEach((t=>{if(!t.isEmpty()){const r=n.data.field(t);e.set(t,r)}})),e}function Bp(n,e,t){const r=new Map;z(n.length===t.length,32656,{Re:t.length,Ve:n.length});for(let s=0;s<t.length;s++){const i=n[s],o=i.transform,a=e.data.field(i.field);r.set(i.field,sb(o,a,t[s]))}return r}function qp(n,e,t){const r=new Map;for(const s of n){const i=s.transform,o=t.data.field(s.field);r.set(s.field,rb(i,o,e))}return r}class $s extends Fc{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class Ah extends Fc{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
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
 */class bh{constructor(e,t,r,s){this.batchId=e,this.localWriteTime=t,this.baseMutations=r,this.mutations=s}applyToRemoteDocument(e,t){const r=t.mutationResults;for(let s=0;s<this.mutations.length;s++){const i=this.mutations[s];i.key.isEqual(e.key)&&ab(i,e,r[s])}}applyToLocalView(e,t){for(const r of this.baseMutations)r.key.isEqual(e.key)&&(t=qi(r,e,t,this.localWriteTime));for(const r of this.mutations)r.key.isEqual(e.key)&&(t=qi(r,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){const r=Zg();return this.mutations.forEach((s=>{const i=e.get(s.key),o=i.overlayedDocument;let a=this.applyToLocalView(o,i.mutatedFields);a=t.has(s.key)?null:a;const l=oy(o,a);l!==null&&r.set(s.key,l),o.isValidDocument()||o.convertToNoDocument(G.min())})),r}keys(){return this.mutations.reduce(((e,t)=>e.add(t.key)),K())}isEqual(e){return this.batchId===e.batchId&&ds(this.mutations,e.mutations,((t,r)=>Up(t,r)))&&ds(this.baseMutations,e.baseMutations,((t,r)=>Up(t,r)))}}class Rh{constructor(e,t,r,s){this.batch=e,this.commitVersion=t,this.mutationResults=r,this.docVersions=s}static from(e,t,r){z(e.mutations.length===r.length,58842,{me:e.mutations.length,fe:r.length});let s=(function(){return eb})();const i=e.mutations;for(let o=0;o<i.length;o++)s=s.insert(i[o].key,r[o].version);return new Rh(e,t,r,s)}}/**
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
 */class Sh{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
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
 */class cy{constructor(e,t,r){this.alias=e,this.aggregateType=t,this.fieldPath=r}}/**
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
 */class lb{constructor(e,t){this.count=e,this.unchangedNames=t}}/**
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
 */var xe,ie;function ly(n){switch(n){case P.OK:return q(64938);case P.CANCELLED:case P.UNKNOWN:case P.DEADLINE_EXCEEDED:case P.RESOURCE_EXHAUSTED:case P.INTERNAL:case P.UNAVAILABLE:case P.UNAUTHENTICATED:return!1;case P.INVALID_ARGUMENT:case P.NOT_FOUND:case P.ALREADY_EXISTS:case P.PERMISSION_DENIED:case P.FAILED_PRECONDITION:case P.ABORTED:case P.OUT_OF_RANGE:case P.UNIMPLEMENTED:case P.DATA_LOSS:return!0;default:return q(15467,{code:n})}}function uy(n){if(n===void 0)return Ne("GRPC error has no .code"),P.UNKNOWN;switch(n){case xe.OK:return P.OK;case xe.CANCELLED:return P.CANCELLED;case xe.UNKNOWN:return P.UNKNOWN;case xe.DEADLINE_EXCEEDED:return P.DEADLINE_EXCEEDED;case xe.RESOURCE_EXHAUSTED:return P.RESOURCE_EXHAUSTED;case xe.INTERNAL:return P.INTERNAL;case xe.UNAVAILABLE:return P.UNAVAILABLE;case xe.UNAUTHENTICATED:return P.UNAUTHENTICATED;case xe.INVALID_ARGUMENT:return P.INVALID_ARGUMENT;case xe.NOT_FOUND:return P.NOT_FOUND;case xe.ALREADY_EXISTS:return P.ALREADY_EXISTS;case xe.PERMISSION_DENIED:return P.PERMISSION_DENIED;case xe.FAILED_PRECONDITION:return P.FAILED_PRECONDITION;case xe.ABORTED:return P.ABORTED;case xe.OUT_OF_RANGE:return P.OUT_OF_RANGE;case xe.UNIMPLEMENTED:return P.UNIMPLEMENTED;case xe.DATA_LOSS:return P.DATA_LOSS;default:return q(39323,{code:n})}}(ie=xe||(xe={}))[ie.OK=0]="OK",ie[ie.CANCELLED=1]="CANCELLED",ie[ie.UNKNOWN=2]="UNKNOWN",ie[ie.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",ie[ie.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",ie[ie.NOT_FOUND=5]="NOT_FOUND",ie[ie.ALREADY_EXISTS=6]="ALREADY_EXISTS",ie[ie.PERMISSION_DENIED=7]="PERMISSION_DENIED",ie[ie.UNAUTHENTICATED=16]="UNAUTHENTICATED",ie[ie.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",ie[ie.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",ie[ie.ABORTED=10]="ABORTED",ie[ie.OUT_OF_RANGE=11]="OUT_OF_RANGE",ie[ie.UNIMPLEMENTED=12]="UNIMPLEMENTED",ie[ie.INTERNAL=13]="INTERNAL",ie[ie.UNAVAILABLE=14]="UNAVAILABLE",ie[ie.DATA_LOSS=15]="DATA_LOSS";/**
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
 */let zi=null;/**
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
 */function hy(){return new TextEncoder}/**
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
 */const ub=new Cn([4294967295,4294967295],0);function zp(n){const e=hy().encode(n),t=new Jm;return t.update(e),new Uint8Array(t.digest())}function Gp(n){const e=new DataView(n.buffer),t=e.getUint32(0,!0),r=e.getUint32(4,!0),s=e.getUint32(8,!0),i=e.getUint32(12,!0);return[new Cn([t,r],0),new Cn([s,i],0)]}class Ch{constructor(e,t,r){if(this.bitmap=e,this.padding=t,this.hashCount=r,t<0||t>=8)throw new ki(`Invalid padding: ${t}`);if(r<0)throw new ki(`Invalid hash count: ${r}`);if(e.length>0&&this.hashCount===0)throw new ki(`Invalid hash count: ${r}`);if(e.length===0&&t!==0)throw new ki(`Invalid padding when bitmap length is 0: ${t}`);this.ge=8*e.length-t,this.pe=Cn.fromNumber(this.ge)}ye(e,t,r){let s=e.add(t.multiply(Cn.fromNumber(r)));return s.compare(ub)===1&&(s=new Cn([s.getBits(0),s.getBits(1)],0)),s.modulo(this.pe).toNumber()}we(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(this.ge===0)return!1;const t=zp(e),[r,s]=Gp(t);for(let i=0;i<this.hashCount;i++){const o=this.ye(r,s,i);if(!this.we(o))return!1}return!0}static create(e,t,r){const s=e%8==0?0:8-e%8,i=new Uint8Array(Math.ceil(e/8)),o=new Ch(i,s,t);return r.forEach((a=>o.insert(a))),o}insert(e){if(this.ge===0)return;const t=zp(e),[r,s]=Gp(t);for(let i=0;i<this.hashCount;i++){const o=this.ye(r,s,i);this.Se(o)}}Se(e){const t=Math.floor(e/8),r=e%8;this.bitmap[t]|=1<<r}}class ki extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
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
 */class Do{constructor(e,t,r,s,i){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=r,this.documentUpdates=s,this.resolvedLimboDocuments=i}static createSynthesizedRemoteEventForCurrentChange(e,t,r){const s=new Map;return s.set(e,xo.createSynthesizedTargetChangeForCurrentChange(e,t,r)),new Do(G.min(),s,new be(j),ct(),K())}}class xo{constructor(e,t,r,s,i){this.resumeToken=e,this.current=t,this.addedDocuments=r,this.modifiedDocuments=s,this.removedDocuments=i}static createSynthesizedTargetChangeForCurrentChange(e,t,r){return new xo(r,t,K(),K(),K())}}/**
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
 */class Na{constructor(e,t,r,s){this.be=e,this.removedTargetIds=t,this.key=r,this.De=s}}class dy{constructor(e,t){this.targetId=e,this.Ce=t}}class fy{constructor(e,t,r=Re.EMPTY_BYTE_STRING,s=null){this.state=e,this.targetIds=t,this.resumeToken=r,this.cause=s}}class $p{constructor(){this.ve=0,this.Fe=jp(),this.Me=Re.EMPTY_BYTE_STRING,this.xe=!1,this.Oe=!0}get current(){return this.xe}get resumeToken(){return this.Me}get Ne(){return this.ve!==0}get Be(){return this.Oe}Le(e){e.approximateByteSize()>0&&(this.Oe=!0,this.Me=e)}ke(){let e=K(),t=K(),r=K();return this.Fe.forEach(((s,i)=>{switch(i){case 0:e=e.add(s);break;case 2:t=t.add(s);break;case 1:r=r.add(s);break;default:q(38017,{changeType:i})}})),new xo(this.Me,this.xe,e,t,r)}qe(){this.Oe=!1,this.Fe=jp()}Qe(e,t){this.Oe=!0,this.Fe=this.Fe.insert(e,t)}$e(e){this.Oe=!0,this.Fe=this.Fe.remove(e)}Ue(){this.ve+=1}Ke(){this.ve-=1,z(this.ve>=0,3241,{ve:this.ve})}We(){this.Oe=!0,this.xe=!0}}class hb{constructor(e){this.Ge=e,this.ze=new Map,this.je=ct(),this.Je=da(),this.He=da(),this.Ye=new be(j)}Ze(e){for(const t of e.be)e.De&&e.De.isFoundDocument()?this.Xe(t,e.De):this.et(t,e.key,e.De);for(const t of e.removedTargetIds)this.et(t,e.key,e.De)}tt(e){this.forEachTarget(e,(t=>{const r=this.nt(t);switch(e.state){case 0:this.rt(t)&&r.Le(e.resumeToken);break;case 1:r.Ke(),r.Ne||r.qe(),r.Le(e.resumeToken);break;case 2:r.Ke(),r.Ne||this.removeTarget(t);break;case 3:this.rt(t)&&(r.We(),r.Le(e.resumeToken));break;case 4:this.rt(t)&&(this.it(t),r.Le(e.resumeToken));break;default:q(56790,{state:e.state})}}))}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.ze.forEach(((r,s)=>{this.rt(s)&&t(s)}))}st(e){const t=e.targetId,r=e.Ce.count,s=this.ot(t);if(s){const i=s.target;if($a(i))if(r===0){const o=new M(i.path);this.et(t,o,ye.newNoDocument(o,G.min()))}else z(r===1,20013,{expectedCount:r});else{const o=this._t(t);if(o!==r){const a=this.ut(e),l=a?this.ct(a,e,o):1;if(l!==0){this.it(t);const u=l===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Ye=this.Ye.insert(t,u)}zi==null||zi.lt((function(h,f,_,g,w){var V,B,L;const R={localCacheCount:h,existenceFilterCount:f.count,databaseId:_.database,projectId:_.projectId},C=f.unchangedNames;return C&&(R.bloomFilter={applied:w===0,hashCount:(C==null?void 0:C.hashCount)??0,bitmapLength:((B=(V=C==null?void 0:C.bits)==null?void 0:V.bitmap)==null?void 0:B.length)??0,padding:((L=C==null?void 0:C.bits)==null?void 0:L.padding)??0,mightContain:$=>(g==null?void 0:g.mightContain($))??!1}),R})(o,e.Ce,this.Ge.ht(),a,l))}}}}ut(e){const t=e.Ce.unchangedNames;if(!t||!t.bits)return null;const{bits:{bitmap:r="",padding:s=0},hashCount:i=0}=t;let o,a;try{o=sn(r).toUint8Array()}catch(l){if(l instanceof Pg)return It("Decoding the base64 bloom filter in existence filter failed ("+l.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw l}try{a=new Ch(o,s,i)}catch(l){return It(l instanceof ki?"BloomFilter error: ":"Applying bloom filter failed: ",l),null}return a.ge===0?null:a}ct(e,t,r){return t.Ce.count===r-this.Pt(e,t.targetId)?0:2}Pt(e,t){const r=this.Ge.getRemoteKeysForTarget(t);let s=0;return r.forEach((i=>{const o=this.Ge.ht(),a=`projects/${o.projectId}/databases/${o.database}/documents/${i.path.canonicalString()}`;e.mightContain(a)||(this.et(t,i,null),s++)})),s}Tt(e){const t=new Map;this.ze.forEach(((i,o)=>{const a=this.ot(o);if(a){if(i.current&&$a(a.target)){const l=new M(a.target.path);this.It(l).has(o)||this.Et(o,l)||this.et(o,l,ye.newNoDocument(l,e))}i.Be&&(t.set(o,i.ke()),i.qe())}}));let r=K();this.He.forEach(((i,o)=>{let a=!0;o.forEachWhile((l=>{const u=this.ot(l);return!u||u.purpose==="TargetPurposeLimboResolution"||(a=!1,!1)})),a&&(r=r.add(i))})),this.je.forEach(((i,o)=>o.setReadTime(e)));const s=new Do(e,t,this.Ye,this.je,r);return this.je=ct(),this.Je=da(),this.He=da(),this.Ye=new be(j),s}Xe(e,t){if(!this.rt(e))return;const r=this.Et(e,t.key)?2:0;this.nt(e).Qe(t.key,r),this.je=this.je.insert(t.key,t),this.Je=this.Je.insert(t.key,this.It(t.key).add(e)),this.He=this.He.insert(t.key,this.dt(t.key).add(e))}et(e,t,r){if(!this.rt(e))return;const s=this.nt(e);this.Et(e,t)?s.Qe(t,1):s.$e(t),this.He=this.He.insert(t,this.dt(t).delete(e)),this.He=this.He.insert(t,this.dt(t).add(e)),r&&(this.je=this.je.insert(t,r))}removeTarget(e){this.ze.delete(e)}_t(e){const t=this.nt(e).ke();return this.Ge.getRemoteKeysForTarget(e).size+t.addedDocuments.size-t.removedDocuments.size}Ue(e){this.nt(e).Ue()}nt(e){let t=this.ze.get(e);return t||(t=new $p,this.ze.set(e,t)),t}dt(e){let t=this.He.get(e);return t||(t=new he(j),this.He=this.He.insert(e,t)),t}It(e){let t=this.Je.get(e);return t||(t=new he(j),this.Je=this.Je.insert(e,t)),t}rt(e){const t=this.ot(e)!==null;return t||x("WatchChangeAggregator","Detected inactive target",e),t}ot(e){const t=this.ze.get(e);return t&&t.Ne?null:this.Ge.At(e)}it(e){this.ze.set(e,new $p),this.Ge.getRemoteKeysForTarget(e).forEach((t=>{this.et(e,t,null)}))}Et(e,t){return this.Ge.getRemoteKeysForTarget(e).has(t)}}function da(){return new be(M.comparator)}function jp(){return new be(M.comparator)}const db={asc:"ASCENDING",desc:"DESCENDING"},fb={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},pb={and:"AND",or:"OR"};class _b{constructor(e,t){this.databaseId=e,this.useProto3Json=t}}function Su(n,e){return n.useProto3Json||Ro(e)?e:{value:e}}function bs(n,e){return n.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function py(n,e){return n.useProto3Json?e.toBase64():e.toUint8Array()}function mb(n,e){return bs(n,e.toTimestamp())}function De(n){return z(!!n,49232),G.fromTimestamp((function(t){const r=rn(t);return new ce(r.seconds,r.nanos)})(n))}function Ph(n,e){return Cu(n,e).canonicalString()}function Cu(n,e){const t=(function(s){return new Z(["projects",s.projectId,"databases",s.database])})(n).child("documents");return e===void 0?t:t.child(e)}function _y(n){const e=Z.fromString(n);return z(Ay(e),10190,{key:e.toString()}),e}function uo(n,e){return Ph(n.databaseId,e.path)}function Bt(n,e){const t=_y(e);if(t.get(1)!==n.databaseId.projectId)throw new D(P.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+t.get(1)+" vs "+n.databaseId.projectId);if(t.get(3)!==n.databaseId.database)throw new D(P.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+t.get(3)+" vs "+n.databaseId.database);return new M(yy(t))}function my(n,e){return Ph(n.databaseId,e)}function gy(n){const e=_y(n);return e.length===4?Z.emptyPath():yy(e)}function Pu(n){return new Z(["projects",n.databaseId.projectId,"databases",n.databaseId.database]).canonicalString()}function yy(n){return z(n.length>4&&n.get(4)==="documents",29091,{key:n.toString()}),n.popFirst(5)}function Wp(n,e,t){return{name:uo(n,e),fields:t.value.mapValue.fields}}function Uc(n,e,t){const r=Bt(n,e.name),s=De(e.updateTime),i=e.createTime?De(e.createTime):G.min(),o=new We({mapValue:{fields:e.fields}}),a=ye.newFoundDocument(r,s,i,o);return t&&a.setHasCommittedMutations(),t?a.setHasCommittedMutations():a}function gb(n,e){return"found"in e?(function(r,s){z(!!s.found,43571),s.found.name,s.found.updateTime;const i=Bt(r,s.found.name),o=De(s.found.updateTime),a=s.found.createTime?De(s.found.createTime):G.min(),l=new We({mapValue:{fields:s.found.fields}});return ye.newFoundDocument(i,o,a,l)})(n,e):"missing"in e?(function(r,s){z(!!s.missing,3894),z(!!s.readTime,22933);const i=Bt(r,s.missing),o=De(s.readTime);return ye.newNoDocument(i,o)})(n,e):q(7234,{result:e})}function yb(n,e){let t;if("targetChange"in e){e.targetChange;const r=(function(u){return u==="NO_CHANGE"?0:u==="ADD"?1:u==="REMOVE"?2:u==="CURRENT"?3:u==="RESET"?4:q(39313,{state:u})})(e.targetChange.targetChangeType||"NO_CHANGE"),s=e.targetChange.targetIds||[],i=(function(u,h){return u.useProto3Json?(z(h===void 0||typeof h=="string",58123),Re.fromBase64String(h||"")):(z(h===void 0||h instanceof Buffer||h instanceof Uint8Array,16193),Re.fromUint8Array(h||new Uint8Array))})(n,e.targetChange.resumeToken),o=e.targetChange.cause,a=o&&(function(u){const h=u.code===void 0?P.UNKNOWN:uy(u.code);return new D(h,u.message||"")})(o);t=new fy(r,s,i,a||null)}else if("documentChange"in e){e.documentChange;const r=e.documentChange;r.document,r.document.name,r.document.updateTime;const s=Bt(n,r.document.name),i=De(r.document.updateTime),o=r.document.createTime?De(r.document.createTime):G.min(),a=new We({mapValue:{fields:r.document.fields}}),l=ye.newFoundDocument(s,i,o,a),u=r.targetIds||[],h=r.removedTargetIds||[];t=new Na(u,h,l.key,l)}else if("documentDelete"in e){e.documentDelete;const r=e.documentDelete;r.document;const s=Bt(n,r.document),i=r.readTime?De(r.readTime):G.min(),o=ye.newNoDocument(s,i),a=r.removedTargetIds||[];t=new Na([],a,o.key,o)}else if("documentRemove"in e){e.documentRemove;const r=e.documentRemove;r.document;const s=Bt(n,r.document),i=r.removedTargetIds||[];t=new Na([],i,s,null)}else{if(!("filter"in e))return q(11601,{Rt:e});{e.filter;const r=e.filter;r.targetId;const{count:s=0,unchangedNames:i}=r,o=new lb(s,i),a=r.targetId;t=new dy(a,o)}}return t}function ho(n,e){let t;if(e instanceof Gs)t={update:Wp(n,e.key,e.value)};else if(e instanceof $s)t={delete:uo(n,e.key)};else if(e instanceof ln)t={update:Wp(n,e.key,e.data),updateMask:Ab(e.fieldMask)};else{if(!(e instanceof Ah))return q(16599,{Vt:e.type});t={verify:uo(n,e.key)}}return e.fieldTransforms.length>0&&(t.updateTransforms=e.fieldTransforms.map((r=>(function(i,o){const a=o.transform;if(a instanceof vs)return{fieldPath:o.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(a instanceof vr)return{fieldPath:o.field.canonicalString(),appendMissingElements:{values:a.elements}};if(a instanceof Ar)return{fieldPath:o.field.canonicalString(),removeAllFromArray:{values:a.elements}};if(a instanceof As)return{fieldPath:o.field.canonicalString(),increment:a.Ae};throw q(20930,{transform:o.transform})})(0,r)))),e.precondition.isNone||(t.currentDocument=(function(s,i){return i.updateTime!==void 0?{updateTime:mb(s,i.updateTime)}:i.exists!==void 0?{exists:i.exists}:q(27497)})(n,e.precondition)),t}function Nu(n,e){const t=e.currentDocument?(function(i){return i.updateTime!==void 0?we.updateTime(De(i.updateTime)):i.exists!==void 0?we.exists(i.exists):we.none()})(e.currentDocument):we.none(),r=e.updateTransforms?e.updateTransforms.map((s=>(function(o,a){let l=null;if("setToServerValue"in a)z(a.setToServerValue==="REQUEST_TIME",16630,{proto:a}),l=new vs;else if("appendMissingElements"in a){const h=a.appendMissingElements.values||[];l=new vr(h)}else if("removeAllFromArray"in a){const h=a.removeAllFromArray.values||[];l=new Ar(h)}else"increment"in a?l=new As(o,a.increment):q(16584,{proto:a});const u=Ie.fromServerFormat(a.fieldPath);return new ko(u,l)})(n,s))):[];if(e.update){e.update.name;const s=Bt(n,e.update.name),i=new We({mapValue:{fields:e.update.fields}});if(e.updateMask){const o=(function(l){const u=l.fieldPaths||[];return new at(u.map((h=>Ie.fromServerFormat(h))))})(e.updateMask);return new ln(s,i,o,t,r)}return new Gs(s,i,t,r)}if(e.delete){const s=Bt(n,e.delete);return new $s(s,t)}if(e.verify){const s=Bt(n,e.verify);return new Ah(s,t)}return q(1463,{proto:e})}function Ib(n,e){return n&&n.length>0?(z(e!==void 0,14353),n.map((t=>(function(s,i){let o=s.updateTime?De(s.updateTime):De(i);return o.isEqual(G.min())&&(o=De(i)),new ob(o,s.transformResults||[])})(t,e)))):[]}function Iy(n,e){return{documents:[my(n,e.path)]}}function Bc(n,e){const t={structuredQuery:{}},r=e.path;let s;e.collectionGroup!==null?(s=r,t.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(s=r.popLast(),t.structuredQuery.from=[{collectionId:r.lastSegment()}]),t.parent=my(n,s);const i=(function(u){if(u.length!==0)return vy(le.create(u,"and"))})(e.filters);i&&(t.structuredQuery.where=i);const o=(function(u){if(u.length!==0)return u.map((h=>(function(_){return{field:wn(_.field),direction:Tb(_.dir)}})(h)))})(e.orderBy);o&&(t.structuredQuery.orderBy=o);const a=Su(n,e.limit);return a!==null&&(t.structuredQuery.limit=a),e.startAt&&(t.structuredQuery.startAt=(function(u){return{before:u.inclusive,values:u.position}})(e.startAt)),e.endAt&&(t.structuredQuery.endAt=(function(u){return{before:!u.inclusive,values:u.position}})(e.endAt)),{ft:t,parent:s}}function Ey(n,e,t,r){const{ft:s,parent:i}=Bc(n,e),o={},a=[];let l=0;return t.forEach((u=>{const h=r?u.alias:"aggregate_"+l++;o[h]=u.alias,u.aggregateType==="count"?a.push({alias:h,count:{}}):u.aggregateType==="avg"?a.push({alias:h,avg:{field:wn(u.fieldPath)}}):u.aggregateType==="sum"&&a.push({alias:h,sum:{field:wn(u.fieldPath)}})})),{request:{structuredAggregationQuery:{aggregations:a,structuredQuery:s.structuredQuery},parent:s.parent},gt:o,parent:i}}function Ty(n){let e=gy(n.parent);const t=n.structuredQuery,r=t.from?t.from.length:0;let s=null;if(r>0){z(r===1,65062);const h=t.from[0];h.allDescendants?s=h.collectionId:e=e.child(h.collectionId)}let i=[];t.where&&(i=(function(f){const _=wy(f);return _ instanceof le&&Eh(_)?_.getFilters():[_]})(t.where));let o=[];t.orderBy&&(o=(function(f){return f.map((_=>(function(w){return new lo(ts(w.field),(function(C){switch(C){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}})(w.direction))})(_)))})(t.orderBy));let a=null;t.limit&&(a=(function(f){let _;return _=typeof f=="object"?f.value:f,Ro(_)?null:_})(t.limit));let l=null;t.startAt&&(l=(function(f){const _=!!f.before,g=f.values||[];return new Ln(g,_)})(t.startAt));let u=null;return t.endAt&&(u=(function(f){const _=!f.before,g=f.values||[];return new Ln(g,_)})(t.endAt)),jg(e,s,o,i,a,"F",l,u)}function Eb(n,e){const t=(function(s){switch(s){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return q(28987,{purpose:s})}})(e.purpose);return t==null?null:{"goog-listen-tags":t}}function wy(n){return n.unaryFilter!==void 0?(function(t){switch(t.unaryFilter.op){case"IS_NAN":const r=ts(t.unaryFilter.field);return se.create(r,"==",{doubleValue:NaN});case"IS_NULL":const s=ts(t.unaryFilter.field);return se.create(s,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const i=ts(t.unaryFilter.field);return se.create(i,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const o=ts(t.unaryFilter.field);return se.create(o,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return q(61313);default:return q(60726)}})(n):n.fieldFilter!==void 0?(function(t){return se.create(ts(t.fieldFilter.field),(function(s){switch(s){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return q(58110);default:return q(50506)}})(t.fieldFilter.op),t.fieldFilter.value)})(n):n.compositeFilter!==void 0?(function(t){return le.create(t.compositeFilter.filters.map((r=>wy(r))),(function(s){switch(s){case"AND":return"and";case"OR":return"or";default:return q(1026)}})(t.compositeFilter.op))})(n):q(30097,{filter:n})}function Tb(n){return db[n]}function wb(n){return fb[n]}function vb(n){return pb[n]}function wn(n){return{fieldPath:n.canonicalString()}}function ts(n){return Ie.fromServerFormat(n.fieldPath)}function vy(n){return n instanceof se?(function(t){if(t.op==="=="){if(Np(t.value))return{unaryFilter:{field:wn(t.field),op:"IS_NAN"}};if(Pp(t.value))return{unaryFilter:{field:wn(t.field),op:"IS_NULL"}}}else if(t.op==="!="){if(Np(t.value))return{unaryFilter:{field:wn(t.field),op:"IS_NOT_NAN"}};if(Pp(t.value))return{unaryFilter:{field:wn(t.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:wn(t.field),op:wb(t.op),value:t.value}}})(n):n instanceof le?(function(t){const r=t.getFilters().map((s=>vy(s)));return r.length===1?r[0]:{compositeFilter:{op:vb(t.op),filters:r}}})(n):q(54877,{filter:n})}function Ab(n){const e=[];return n.fields.forEach((t=>e.push(t.canonicalString()))),{fieldPaths:e}}function Ay(n){return n.length>=4&&n.get(0)==="projects"&&n.get(2)==="databases"}/**
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
 */class Qt{constructor(e,t,r,s,i=G.min(),o=G.min(),a=Re.EMPTY_BYTE_STRING,l=null){this.target=e,this.targetId=t,this.purpose=r,this.sequenceNumber=s,this.snapshotVersion=i,this.lastLimboFreeSnapshotVersion=o,this.resumeToken=a,this.expectedCount=l}withSequenceNumber(e){return new Qt(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new Qt(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new Qt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new Qt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}/**
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
 */class by{constructor(e){this.yt=e}}function bb(n,e){let t;if(e.document)t=Uc(n.yt,e.document,!!e.hasCommittedMutations);else if(e.noDocument){const r=M.fromSegments(e.noDocument.path),s=Rr(e.noDocument.readTime);t=ye.newNoDocument(r,s),e.hasCommittedMutations&&t.setHasCommittedMutations()}else{if(!e.unknownDocument)return q(56709);{const r=M.fromSegments(e.unknownDocument.path),s=Rr(e.unknownDocument.version);t=ye.newUnknownDocument(r,s)}}return e.readTime&&t.setReadTime((function(s){const i=new ce(s[0],s[1]);return G.fromTimestamp(i)})(e.readTime)),t}function Kp(n,e){const t=e.key,r={prefixPath:t.getCollectionPath().popLast().toArray(),collectionGroup:t.collectionGroup,documentId:t.path.lastSegment(),readTime:Ka(e.readTime),hasCommittedMutations:e.hasCommittedMutations};if(e.isFoundDocument())r.document=(function(i,o){return{name:uo(i,o.key),fields:o.data.value.mapValue.fields,updateTime:bs(i,o.version.toTimestamp()),createTime:bs(i,o.createTime.toTimestamp())}})(n.yt,e);else if(e.isNoDocument())r.noDocument={path:t.path.toArray(),readTime:br(e.version)};else{if(!e.isUnknownDocument())return q(57904,{document:e});r.unknownDocument={path:t.path.toArray(),version:br(e.version)}}return r}function Ka(n){const e=n.toTimestamp();return[e.seconds,e.nanoseconds]}function br(n){const e=n.toTimestamp();return{seconds:e.seconds,nanoseconds:e.nanoseconds}}function Rr(n){const e=new ce(n.seconds,n.nanoseconds);return G.fromTimestamp(e)}function ur(n,e){const t=(e.baseMutations||[]).map((i=>Nu(n.yt,i)));for(let i=0;i<e.mutations.length-1;++i){const o=e.mutations[i];if(i+1<e.mutations.length&&e.mutations[i+1].transform!==void 0){const a=e.mutations[i+1];o.updateTransforms=a.transform.fieldTransforms,e.mutations.splice(i+1,1),++i}}const r=e.mutations.map((i=>Nu(n.yt,i))),s=ce.fromMillis(e.localWriteTimeMs);return new bh(e.batchId,s,t,r)}function Di(n){const e=Rr(n.readTime),t=n.lastLimboFreeSnapshotVersion!==void 0?Rr(n.lastLimboFreeSnapshotVersion):G.min();let r;return r=(function(i){return i.documents!==void 0})(n.query)?(function(i){const o=i.documents.length;return z(o===1,1966,{count:o}),Xe(zs(gy(i.documents[0])))})(n.query):(function(i){return Xe(Ty(i))})(n.query),new Qt(r,n.targetId,"TargetPurposeListen",n.lastListenSequenceNumber,e,t,Re.fromBase64String(n.resumeToken))}function Ry(n,e){const t=br(e.snapshotVersion),r=br(e.lastLimboFreeSnapshotVersion);let s;s=$a(e.target)?Iy(n.yt,e.target):Bc(n.yt,e.target).ft;const i=e.resumeToken.toBase64();return{targetId:e.targetId,canonicalId:wr(e.target),readTime:t,resumeToken:i,lastListenSequenceNumber:e.sequenceNumber,lastLimboFreeSnapshotVersion:r,query:s}}function qc(n){const e=Ty({parent:n.parent,structuredQuery:n.structuredQuery});return n.limitType==="LAST"?Wa(e,e.limit,"L"):e}function zl(n,e){return new Sh(e.largestBatchId,Nu(n.yt,e.overlayMutation))}function Hp(n,e){const t=e.path.lastSegment();return[n,Ye(e.path.popLast()),t]}function Qp(n,e,t,r){return{indexId:n,uid:e,sequenceNumber:t,readTime:br(r.readTime),documentKey:Ye(r.documentKey.path),largestBatchId:r.largestBatchId}}/**
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
 */class Rb{getBundleMetadata(e,t){return Yp(e).get(t).next((r=>{if(r)return(function(i){return{id:i.bundleId,createTime:Rr(i.createTime),version:i.version}})(r)}))}saveBundleMetadata(e,t){return Yp(e).put((function(s){return{bundleId:s.id,createTime:br(De(s.createTime)),version:s.version}})(t))}getNamedQuery(e,t){return Xp(e).get(t).next((r=>{if(r)return(function(i){return{name:i.name,query:qc(i.bundledQuery),readTime:Rr(i.readTime)}})(r)}))}saveNamedQuery(e,t){return Xp(e).put((function(s){return{name:s.name,readTime:br(De(s.readTime)),bundledQuery:s.bundledQuery}})(t))}}function Yp(n){return Fe(n,kc)}function Xp(n){return Fe(n,Dc)}/**
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
 */class zc{constructor(e,t){this.serializer=e,this.userId=t}static wt(e,t){const r=t.uid||"";return new zc(e,r)}getOverlay(e,t){return Ii(e).get(Hp(this.userId,t)).next((r=>r?zl(this.serializer,r):null))}getOverlays(e,t){const r=Mt();return b.forEach(t,(s=>this.getOverlay(e,s).next((i=>{i!==null&&r.set(s,i)})))).next((()=>r))}saveOverlays(e,t,r){const s=[];return r.forEach(((i,o)=>{const a=new Sh(t,o);s.push(this.St(e,a))})),b.waitFor(s)}removeOverlaysForBatchId(e,t,r){const s=new Set;t.forEach((o=>s.add(Ye(o.getCollectionPath()))));const i=[];return s.forEach((o=>{const a=IDBKeyRange.bound([this.userId,o,r],[this.userId,o,r+1],!1,!0);i.push(Ii(e).Z(yu,a))})),b.waitFor(i)}getOverlaysForCollection(e,t,r){const s=Mt(),i=Ye(t),o=IDBKeyRange.bound([this.userId,i,r],[this.userId,i,Number.POSITIVE_INFINITY],!0);return Ii(e).J(yu,o).next((a=>{for(const l of a){const u=zl(this.serializer,l);s.set(u.getKey(),u)}return s}))}getOverlaysForCollectionGroup(e,t,r,s){const i=Mt();let o;const a=IDBKeyRange.bound([this.userId,t,r],[this.userId,t,Number.POSITIVE_INFINITY],!0);return Ii(e).ee({index:wg,range:a},((l,u,h)=>{const f=zl(this.serializer,u);i.size()<s||f.largestBatchId===o?(i.set(f.getKey(),f),o=f.largestBatchId):h.done()})).next((()=>i))}St(e,t){return Ii(e).put((function(s,i,o){const[a,l,u]=Hp(i,o.mutation.key);return{userId:i,collectionPath:l,documentId:u,collectionGroup:o.mutation.key.getCollectionGroup(),largestBatchId:o.largestBatchId,overlayMutation:ho(s.yt,o.mutation)}})(this.serializer,this.userId,t))}}function Ii(n){return Fe(n,xc)}/**
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
 */class Sb{bt(e){return Fe(e,mh)}getSessionToken(e){return this.bt(e).get("sessionToken").next((t=>{const r=t==null?void 0:t.value;return r?Re.fromUint8Array(r):Re.EMPTY_BYTE_STRING}))}setSessionToken(e,t){return this.bt(e).put({name:"sessionToken",value:t.toUint8Array()})}}/**
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
 */class hr{constructor(){}Dt(e,t){this.Ct(e,t),t.vt()}Ct(e,t){if("nullValue"in e)this.Ft(t,5);else if("booleanValue"in e)this.Ft(t,10),t.Mt(e.booleanValue?1:0);else if("integerValue"in e)this.Ft(t,15),t.Mt(Te(e.integerValue));else if("doubleValue"in e){const r=Te(e.doubleValue);isNaN(r)?this.Ft(t,13):(this.Ft(t,15),to(r)?t.Mt(0):t.Mt(r))}else if("timestampValue"in e){let r=e.timestampValue;this.Ft(t,20),typeof r=="string"&&(r=rn(r)),t.xt(`${r.seconds||""}`),t.Mt(r.nanos||0)}else if("stringValue"in e)this.Ot(e.stringValue,t),this.Nt(t);else if("bytesValue"in e)this.Ft(t,30),t.Bt(sn(e.bytesValue)),this.Nt(t);else if("referenceValue"in e)this.Lt(e.referenceValue,t);else if("geoPointValue"in e){const r=e.geoPointValue;this.Ft(t,45),t.Mt(r.latitude||0),t.Mt(r.longitude||0)}else"mapValue"in e?Og(e)?this.Ft(t,Number.MAX_SAFE_INTEGER):Mc(e)?this.kt(e.mapValue,t):(this.qt(e.mapValue,t),this.Nt(t)):"arrayValue"in e?(this.Qt(e.arrayValue,t),this.Nt(t)):q(19022,{$t:e})}Ot(e,t){this.Ft(t,25),this.Ut(e,t)}Ut(e,t){t.xt(e)}qt(e,t){const r=e.fields||{};this.Ft(t,55);for(const s of Object.keys(r))this.Ot(s,t),this.Ct(r[s],t)}kt(e,t){var o,a;const r=e.fields||{};this.Ft(t,53);const s=Es,i=((a=(o=r[s].arrayValue)==null?void 0:o.values)==null?void 0:a.length)||0;this.Ft(t,15),t.Mt(Te(i)),this.Ot(s,t),this.Ct(r[s],t)}Qt(e,t){const r=e.values||[];this.Ft(t,50);for(const s of r)this.Ct(s,t)}Lt(e,t){this.Ft(t,37),M.fromName(e).path.forEach((r=>{this.Ft(t,60),this.Ut(r,t)}))}Ft(e,t){e.Mt(t)}Nt(e){e.Mt(2)}}hr.Kt=new hr;/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law | agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES | CONDITIONS OF ANY KIND, either express | implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Kr=255;function Cb(n){if(n===0)return 8;let e=0;return n>>4||(e+=4,n<<=4),n>>6||(e+=2,n<<=2),n>>7||(e+=1),e}function Jp(n){const e=64-(function(r){let s=0;for(let i=0;i<8;++i){const o=Cb(255&r[i]);if(s+=o,o!==8)break}return s})(n);return Math.ceil(e/8)}class Pb{constructor(){this.buffer=new Uint8Array(1024),this.position=0}Wt(e){const t=e[Symbol.iterator]();let r=t.next();for(;!r.done;)this.Gt(r.value),r=t.next();this.zt()}jt(e){const t=e[Symbol.iterator]();let r=t.next();for(;!r.done;)this.Jt(r.value),r=t.next();this.Ht()}Yt(e){for(const t of e){const r=t.charCodeAt(0);if(r<128)this.Gt(r);else if(r<2048)this.Gt(960|r>>>6),this.Gt(128|63&r);else if(t<"\uD800"||"\uDBFF"<t)this.Gt(480|r>>>12),this.Gt(128|63&r>>>6),this.Gt(128|63&r);else{const s=t.codePointAt(0);this.Gt(240|s>>>18),this.Gt(128|63&s>>>12),this.Gt(128|63&s>>>6),this.Gt(128|63&s)}}this.zt()}Zt(e){for(const t of e){const r=t.charCodeAt(0);if(r<128)this.Jt(r);else if(r<2048)this.Jt(960|r>>>6),this.Jt(128|63&r);else if(t<"\uD800"||"\uDBFF"<t)this.Jt(480|r>>>12),this.Jt(128|63&r>>>6),this.Jt(128|63&r);else{const s=t.codePointAt(0);this.Jt(240|s>>>18),this.Jt(128|63&s>>>12),this.Jt(128|63&s>>>6),this.Jt(128|63&s)}}this.Ht()}Xt(e){const t=this.en(e),r=Jp(t);this.tn(1+r),this.buffer[this.position++]=255&r;for(let s=t.length-r;s<t.length;++s)this.buffer[this.position++]=255&t[s]}nn(e){const t=this.en(e),r=Jp(t);this.tn(1+r),this.buffer[this.position++]=~(255&r);for(let s=t.length-r;s<t.length;++s)this.buffer[this.position++]=~(255&t[s])}rn(){this.sn(Kr),this.sn(255)}_n(){this.an(Kr),this.an(255)}reset(){this.position=0}seed(e){this.tn(e.length),this.buffer.set(e,this.position),this.position+=e.length}un(){return this.buffer.slice(0,this.position)}en(e){const t=(function(i){const o=new DataView(new ArrayBuffer(8));return o.setFloat64(0,i,!1),new Uint8Array(o.buffer)})(e),r=!!(128&t[0]);t[0]^=r?255:128;for(let s=1;s<t.length;++s)t[s]^=r?255:0;return t}Gt(e){const t=255&e;t===0?(this.sn(0),this.sn(255)):t===Kr?(this.sn(Kr),this.sn(0)):this.sn(t)}Jt(e){const t=255&e;t===0?(this.an(0),this.an(255)):t===Kr?(this.an(Kr),this.an(0)):this.an(e)}zt(){this.sn(0),this.sn(1)}Ht(){this.an(0),this.an(1)}sn(e){this.tn(1),this.buffer[this.position++]=e}an(e){this.tn(1),this.buffer[this.position++]=~e}tn(e){const t=e+this.position;if(t<=this.buffer.length)return;let r=2*this.buffer.length;r<t&&(r=t);const s=new Uint8Array(r);s.set(this.buffer),this.buffer=s}}class Nb{constructor(e){this.cn=e}Bt(e){this.cn.Wt(e)}xt(e){this.cn.Yt(e)}Mt(e){this.cn.Xt(e)}vt(){this.cn.rn()}}class kb{constructor(e){this.cn=e}Bt(e){this.cn.jt(e)}xt(e){this.cn.Zt(e)}Mt(e){this.cn.nn(e)}vt(){this.cn._n()}}class Ei{constructor(){this.cn=new Pb,this.ln=new Nb(this.cn),this.hn=new kb(this.cn)}seed(e){this.cn.seed(e)}Pn(e){return e===0?this.ln:this.hn}un(){return this.cn.un()}reset(){this.cn.reset()}}/**
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
 */class dr{constructor(e,t,r,s){this.Tn=e,this.In=t,this.En=r,this.dn=s}An(){const e=this.dn.length,t=e===0||this.dn[e-1]===255?e+1:e,r=new Uint8Array(t);return r.set(this.dn,0),t!==e?r.set([0],this.dn.length):++r[r.length-1],new dr(this.Tn,this.In,this.En,r)}Rn(e,t,r){return{indexId:this.Tn,uid:e,arrayValue:ka(this.En),directionalValue:ka(this.dn),orderedDocumentKey:ka(t),documentKey:r.path.toArray()}}Vn(e,t,r){const s=this.Rn(e,t,r);return[s.indexId,s.uid,s.arrayValue,s.directionalValue,s.orderedDocumentKey,s.documentKey]}}function yn(n,e){let t=n.Tn-e.Tn;return t!==0?t:(t=Zp(n.En,e.En),t!==0?t:(t=Zp(n.dn,e.dn),t!==0?t:M.comparator(n.In,e.In)))}function Zp(n,e){for(let t=0;t<n.length&&t<e.length;++t){const r=n[t]-e[t];if(r!==0)return r}return n.length-e.length}function ka(n){return Wm()?(function(t){let r="";for(let s=0;s<t.length;s++)r+=String.fromCharCode(t[s]);return r})(n):n}function e_(n){return typeof n!="string"?n:(function(t){const r=new Uint8Array(t.length);for(let s=0;s<t.length;s++)r[s]=t.charCodeAt(s);return r})(n)}class t_{constructor(e){this.mn=new he(((t,r)=>Ie.comparator(t.field,r.field))),this.collectionId=e.collectionGroup!=null?e.collectionGroup:e.path.lastSegment(),this.fn=e.orderBy,this.gn=[];for(const t of e.filters){const r=t;r.isInequality()?this.mn=this.mn.add(r):this.gn.push(r)}}get pn(){return this.mn.size>1}yn(e){if(z(e.collectionGroup===this.collectionId,49279),this.pn)return!1;const t=_u(e);if(t!==void 0&&!this.wn(t))return!1;const r=or(e);let s=new Set,i=0,o=0;for(;i<r.length&&this.wn(r[i]);++i)s=s.add(r[i].fieldPath.canonicalString());if(i===r.length)return!0;if(this.mn.size>0){const a=this.mn.getIterator().getNext();if(!s.has(a.field.canonicalString())){const l=r[i];if(!this.Sn(a,l)||!this.bn(this.fn[o++],l))return!1}++i}for(;i<r.length;++i){const a=r[i];if(o>=this.fn.length||!this.bn(this.fn[o++],a))return!1}return!0}Dn(){if(this.pn)return null;let e=new he(Ie.comparator);const t=[];for(const r of this.gn)if(!r.field.isKeyField())if(r.op==="array-contains"||r.op==="array-contains-any")t.push(new gr(r.field,2));else{if(e.has(r.field))continue;e=e.add(r.field),t.push(new gr(r.field,0))}for(const r of this.fn)r.field.isKeyField()||e.has(r.field)||(e=e.add(r.field),t.push(new gr(r.field,r.dir==="asc"?0:1)));return new ps(ps.UNKNOWN_ID,this.collectionId,t,_s.empty())}wn(e){for(const t of this.gn)if(this.Sn(t,e))return!0;return!1}Sn(e,t){if(e===void 0||!e.field.isEqual(t.fieldPath))return!1;const r=e.op==="array-contains"||e.op==="array-contains-any";return t.kind===2===r}bn(e,t){return!!e.field.isEqual(t.fieldPath)&&(t.kind===0&&e.dir==="asc"||t.kind===1&&e.dir==="desc")}}/**
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
 */function Sy(n){var t,r;if(z(n instanceof se||n instanceof le,20012),n instanceof se){if(n instanceof $g){const s=((r=(t=n.value.arrayValue)==null?void 0:t.values)==null?void 0:r.map((i=>se.create(n.field,"==",i))))||[];return le.create(s,"or")}return n}const e=n.filters.map((s=>Sy(s)));return le.create(e,n.op)}function Db(n){if(n.getFilters().length===0)return[];const e=xu(Sy(n));return z(Cy(e),7391),ku(e)||Du(e)?[e]:e.getFilters()}function ku(n){return n instanceof se}function Du(n){return n instanceof le&&Eh(n)}function Cy(n){return ku(n)||Du(n)||(function(t){if(t instanceof le&&vu(t)){for(const r of t.getFilters())if(!ku(r)&&!Du(r))return!1;return!0}return!1})(n)}function xu(n){if(z(n instanceof se||n instanceof le,34018),n instanceof se)return n;if(n.filters.length===1)return xu(n.filters[0]);const e=n.filters.map((r=>xu(r)));let t=le.create(e,n.op);return t=Ha(t),Cy(t)?t:(z(t instanceof le,64498),z(ws(t),40251),z(t.filters.length>1,57927),t.filters.reduce(((r,s)=>Nh(r,s))))}function Nh(n,e){let t;return z(n instanceof se||n instanceof le,38388),z(e instanceof se||e instanceof le,25473),t=n instanceof se?e instanceof se?(function(s,i){return le.create([s,i],"and")})(n,e):n_(n,e):e instanceof se?n_(e,n):(function(s,i){if(z(s.filters.length>0&&i.filters.length>0,48005),ws(s)&&ws(i))return qg(s,i.getFilters());const o=vu(s)?s:i,a=vu(s)?i:s,l=o.filters.map((u=>Nh(u,a)));return le.create(l,"or")})(n,e),Ha(t)}function n_(n,e){if(ws(e))return qg(e,n.getFilters());{const t=e.filters.map((r=>Nh(n,r)));return le.create(t,"or")}}function Ha(n){if(z(n instanceof se||n instanceof le,11850),n instanceof se)return n;const e=n.getFilters();if(e.length===1)return Ha(e[0]);if(Ug(n))return n;const t=e.map((s=>Ha(s))),r=[];return t.forEach((s=>{s instanceof se?r.push(s):s instanceof le&&(s.op===n.op?r.push(...s.filters):r.push(s))})),r.length===1?r[0]:le.create(r,n.op)}/**
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
 */class xb{constructor(){this.Cn=new kh}addToCollectionParentIndex(e,t){return this.Cn.add(t),b.resolve()}getCollectionParents(e,t){return b.resolve(this.Cn.getEntries(t))}addFieldIndex(e,t){return b.resolve()}deleteFieldIndex(e,t){return b.resolve()}deleteAllFieldIndexes(e){return b.resolve()}createTargetIndexes(e,t){return b.resolve()}getDocumentsMatchingTarget(e,t){return b.resolve(null)}getIndexType(e,t){return b.resolve(0)}getFieldIndexes(e,t){return b.resolve([])}getNextCollectionGroupToUpdate(e){return b.resolve(null)}getMinOffset(e,t){return b.resolve(Et.min())}getMinOffsetFromCollectionGroup(e,t){return b.resolve(Et.min())}updateCollectionGroup(e,t,r){return b.resolve()}updateIndexEntries(e,t){return b.resolve()}}class kh{constructor(){this.index={}}add(e){const t=e.lastSegment(),r=e.popLast(),s=this.index[t]||new he(Z.comparator),i=!s.has(r);return this.index[t]=s.add(r),i}has(e){const t=e.lastSegment(),r=e.popLast(),s=this.index[t];return s&&s.has(r)}getEntries(e){return(this.index[e]||new he(Z.comparator)).toArray()}}/**
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
 */const r_="IndexedDbIndexManager",fa=new Uint8Array(0);class Vb{constructor(e,t){this.databaseId=t,this.vn=new kh,this.Fn=new cn((r=>wr(r)),((r,s)=>Co(r,s))),this.uid=e.uid||""}addToCollectionParentIndex(e,t){if(!this.vn.has(t)){const r=t.lastSegment(),s=t.popLast();e.addOnCommittedListener((()=>{this.vn.add(t)}));const i={collectionId:r,parent:Ye(s)};return s_(e).put(i)}return b.resolve()}getCollectionParents(e,t){const r=[],s=IDBKeyRange.bound([t,""],[ag(t),""],!1,!0);return s_(e).J(s).next((i=>{for(const o of i){if(o.collectionId!==t)break;r.push(Ot(o.parent))}return r}))}addFieldIndex(e,t){const r=Ti(e),s=(function(a){return{indexId:a.indexId,collectionGroup:a.collectionGroup,fields:a.fields.map((l=>[l.fieldPath.canonicalString(),l.kind]))}})(t);delete s.indexId;const i=r.add(s);if(t.indexState){const o=Qr(e);return i.next((a=>{o.put(Qp(a,this.uid,t.indexState.sequenceNumber,t.indexState.offset))}))}return i.next()}deleteFieldIndex(e,t){const r=Ti(e),s=Qr(e),i=Hr(e);return r.delete(t.indexId).next((()=>s.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0)))).next((()=>i.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0))))}deleteAllFieldIndexes(e){const t=Ti(e),r=Hr(e),s=Qr(e);return t.Z().next((()=>r.Z())).next((()=>s.Z()))}createTargetIndexes(e,t){return b.forEach(this.Mn(t),(r=>this.getIndexType(e,r).next((s=>{if(s===0||s===1){const i=new t_(r).Dn();if(i!=null)return this.addFieldIndex(e,i)}}))))}getDocumentsMatchingTarget(e,t){const r=Hr(e);let s=!0;const i=new Map;return b.forEach(this.Mn(t),(o=>this.xn(e,o).next((a=>{s&&(s=!!a),i.set(o,a)})))).next((()=>{if(s){let o=K();const a=[];return b.forEach(i,((l,u)=>{x(r_,`Using index ${(function(L){return`id=${L.indexId}|cg=${L.collectionGroup}|f=${L.fields.map(($=>`${$.fieldPath}:${$.kind}`)).join(",")}`})(l)} to execute ${wr(t)}`);const h=(function(L,$){const ne=_u($);if(ne===void 0)return null;for(const H of ja(L,ne.fieldPath))switch(H.op){case"array-contains-any":return H.value.arrayValue.values||[];case"array-contains":return[H.value]}return null})(u,l),f=(function(L,$){const ne=new Map;for(const H of or($))for(const T of ja(L,H.fieldPath))switch(T.op){case"==":case"in":ne.set(H.fieldPath.canonicalString(),T.value);break;case"not-in":case"!=":return ne.set(H.fieldPath.canonicalString(),T.value),Array.from(ne.values())}return null})(u,l),_=(function(L,$){const ne=[];let H=!0;for(const T of or($)){const y=T.kind===0?Op(L,T.fieldPath,L.startAt):Mp(L,T.fieldPath,L.startAt);ne.push(y.value),H&&(H=y.inclusive)}return new Ln(ne,H)})(u,l),g=(function(L,$){const ne=[];let H=!0;for(const T of or($)){const y=T.kind===0?Mp(L,T.fieldPath,L.endAt):Op(L,T.fieldPath,L.endAt);ne.push(y.value),H&&(H=y.inclusive)}return new Ln(ne,H)})(u,l),w=this.On(l,u,_),R=this.On(l,u,g),C=this.Nn(l,u,f),V=this.Bn(l.indexId,h,w,_.inclusive,R,g.inclusive,C);return b.forEach(V,(B=>r.Y(B,t.limit).next((L=>{L.forEach(($=>{const ne=M.fromSegments($.documentKey);o.has(ne)||(o=o.add(ne),a.push(ne))}))}))))})).next((()=>a))}return b.resolve(null)}))}Mn(e){let t=this.Fn.get(e);return t||(e.filters.length===0?t=[e]:t=Db(le.create(e.filters,"and")).map((r=>bu(e.path,e.collectionGroup,e.orderBy,r.getFilters(),e.limit,e.startAt,e.endAt))),this.Fn.set(e,t),t)}Bn(e,t,r,s,i,o,a){const l=(t!=null?t.length:1)*Math.max(r.length,i.length),u=l/(t!=null?t.length:1),h=[];for(let f=0;f<l;++f){const _=t?this.Ln(t[f/u]):fa,g=this.kn(e,_,r[f%u],s),w=this.qn(e,_,i[f%u],o),R=a.map((C=>this.kn(e,_,C,!0)));h.push(...this.createRange(g,w,R))}return h}kn(e,t,r,s){const i=new dr(e,M.empty(),t,r);return s?i:i.An()}qn(e,t,r,s){const i=new dr(e,M.empty(),t,r);return s?i.An():i}xn(e,t){const r=new t_(t),s=t.collectionGroup!=null?t.collectionGroup:t.path.lastSegment();return this.getFieldIndexes(e,s).next((i=>{let o=null;for(const a of i)r.yn(a)&&(!o||a.fields.length>o.fields.length)&&(o=a);return o}))}getIndexType(e,t){let r=2;const s=this.Mn(t);return b.forEach(s,(i=>this.xn(e,i).next((o=>{o?r!==0&&o.fields.length<(function(l){let u=new he(Ie.comparator),h=!1;for(const f of l.filters)for(const _ of f.getFlattenedFilters())_.field.isKeyField()||(_.op==="array-contains"||_.op==="array-contains-any"?h=!0:u=u.add(_.field));for(const f of l.orderBy)f.field.isKeyField()||(u=u.add(f.field));return u.size+(h?1:0)})(i)&&(r=1):r=0})))).next((()=>(function(o){return o.limit!==null})(t)&&s.length>1&&r===2?1:r))}Qn(e,t){const r=new Ei;for(const s of or(e)){const i=t.data.field(s.fieldPath);if(i==null)return null;const o=r.Pn(s.kind);hr.Kt.Dt(i,o)}return r.un()}Ln(e){const t=new Ei;return hr.Kt.Dt(e,t.Pn(0)),t.un()}$n(e,t){const r=new Ei;return hr.Kt.Dt(Tr(this.databaseId,t),r.Pn((function(i){const o=or(i);return o.length===0?0:o[o.length-1].kind})(e))),r.un()}Nn(e,t,r){if(r===null)return[];let s=[];s.push(new Ei);let i=0;for(const o of or(e)){const a=r[i++];for(const l of s)if(this.Un(t,o.fieldPath)&&co(a))s=this.Kn(s,o,a);else{const u=l.Pn(o.kind);hr.Kt.Dt(a,u)}}return this.Wn(s)}On(e,t,r){return this.Nn(e,t,r.position)}Wn(e){const t=[];for(let r=0;r<e.length;++r)t[r]=e[r].un();return t}Kn(e,t,r){const s=[...e],i=[];for(const o of r.arrayValue.values||[])for(const a of s){const l=new Ei;l.seed(a.un()),hr.Kt.Dt(o,l.Pn(t.kind)),i.push(l)}return i}Un(e,t){return!!e.filters.find((r=>r instanceof se&&r.field.isEqual(t)&&(r.op==="in"||r.op==="not-in")))}getFieldIndexes(e,t){const r=Ti(e),s=Qr(e);return(t?r.J(gu,IDBKeyRange.bound(t,t)):r.J()).next((i=>{const o=[];return b.forEach(i,(a=>s.get([a.indexId,this.uid]).next((l=>{o.push((function(h,f){const _=f?new _s(f.sequenceNumber,new Et(Rr(f.readTime),new M(Ot(f.documentKey)),f.largestBatchId)):_s.empty(),g=h.fields.map((([w,R])=>new gr(Ie.fromServerFormat(w),R)));return new ps(h.indexId,h.collectionGroup,g,_)})(a,l))})))).next((()=>o))}))}getNextCollectionGroupToUpdate(e){return this.getFieldIndexes(e).next((t=>t.length===0?null:(t.sort(((r,s)=>{const i=r.indexState.sequenceNumber-s.indexState.sequenceNumber;return i!==0?i:j(r.collectionGroup,s.collectionGroup)})),t[0].collectionGroup)))}updateCollectionGroup(e,t,r){const s=Ti(e),i=Qr(e);return this.Gn(e).next((o=>s.J(gu,IDBKeyRange.bound(t,t)).next((a=>b.forEach(a,(l=>i.put(Qp(l.indexId,this.uid,o,r))))))))}updateIndexEntries(e,t){const r=new Map;return b.forEach(t,((s,i)=>{const o=r.get(s.collectionGroup);return(o?b.resolve(o):this.getFieldIndexes(e,s.collectionGroup)).next((a=>(r.set(s.collectionGroup,a),b.forEach(a,(l=>this.zn(e,s,l).next((u=>{const h=this.jn(i,l);return u.isEqual(h)?b.resolve():this.Jn(e,i,l,u,h)})))))))}))}Hn(e,t,r,s){return Hr(e).put(s.Rn(this.uid,this.$n(r,t.key),t.key))}Yn(e,t,r,s){return Hr(e).delete(s.Vn(this.uid,this.$n(r,t.key),t.key))}zn(e,t,r){const s=Hr(e);let i=new he(yn);return s.ee({index:Tg,range:IDBKeyRange.only([r.indexId,this.uid,ka(this.$n(r,t))])},((o,a)=>{i=i.add(new dr(r.indexId,t,e_(a.arrayValue),e_(a.directionalValue)))})).next((()=>i))}jn(e,t){let r=new he(yn);const s=this.Qn(t,e);if(s==null)return r;const i=_u(t);if(i!=null){const o=e.data.field(i.fieldPath);if(co(o))for(const a of o.arrayValue.values||[])r=r.add(new dr(t.indexId,e.key,this.Ln(a),s))}else r=r.add(new dr(t.indexId,e.key,fa,s));return r}Jn(e,t,r,s,i){x(r_,"Updating index entries for document '%s'",t.key);const o=[];return(function(l,u,h,f,_){const g=l.getIterator(),w=u.getIterator();let R=Wr(g),C=Wr(w);for(;R||C;){let V=!1,B=!1;if(R&&C){const L=h(R,C);L<0?B=!0:L>0&&(V=!0)}else R!=null?B=!0:V=!0;V?(f(C),C=Wr(w)):B?(_(R),R=Wr(g)):(R=Wr(g),C=Wr(w))}})(s,i,yn,(a=>{o.push(this.Hn(e,t,r,a))}),(a=>{o.push(this.Yn(e,t,r,a))})),b.waitFor(o)}Gn(e){let t=1;return Qr(e).ee({index:Eg,reverse:!0,range:IDBKeyRange.upperBound([this.uid,Number.MAX_SAFE_INTEGER])},((r,s,i)=>{i.done(),t=s.sequenceNumber+1})).next((()=>t))}createRange(e,t,r){r=r.sort(((o,a)=>yn(o,a))).filter(((o,a,l)=>!a||yn(o,l[a-1])!==0));const s=[];s.push(e);for(const o of r){const a=yn(o,e),l=yn(o,t);if(a===0)s[0]=e.An();else if(a>0&&l<0)s.push(o),s.push(o.An());else if(l>0)break}s.push(t);const i=[];for(let o=0;o<s.length;o+=2){if(this.Zn(s[o],s[o+1]))return[];const a=s[o].Vn(this.uid,fa,M.empty()),l=s[o+1].Vn(this.uid,fa,M.empty());i.push(IDBKeyRange.bound(a,l))}return i}Zn(e,t){return yn(e,t)>0}getMinOffsetFromCollectionGroup(e,t){return this.getFieldIndexes(e,t).next(i_)}getMinOffset(e,t){return b.mapArray(this.Mn(t),(r=>this.xn(e,r).next((s=>s||q(44426))))).next(i_)}}function s_(n){return Fe(n,so)}function Hr(n){return Fe(n,Fi)}function Ti(n){return Fe(n,_h)}function Qr(n){return Fe(n,Li)}function i_(n){z(n.length!==0,28825);let e=n[0].indexState.offset,t=e.largestBatchId;for(let r=1;r<n.length;r++){const s=n[r].indexState.offset;dh(s,e)<0&&(e=s),t<s.largestBatchId&&(t=s.largestBatchId)}return new Et(e.readTime,e.documentKey,t)}/**
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
 */const o_={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},Py=41943040;class Qe{static withCacheSize(e){return new Qe(e,Qe.DEFAULT_COLLECTION_PERCENTILE,Qe.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,t,r){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=r}}/**
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
 */function Ny(n,e,t){const r=n.store(At),s=n.store(ms),i=[],o=IDBKeyRange.only(t.batchId);let a=0;const l=r.ee({range:o},((h,f,_)=>(a++,_.delete())));i.push(l.next((()=>{z(a===1,47070,{batchId:t.batchId})})));const u=[];for(const h of t.mutations){const f=gg(e,h.key.path,t.batchId);i.push(s.delete(f)),u.push(h.key)}return b.waitFor(i).next((()=>u))}function Qa(n){if(!n)return 0;let e;if(n.document)e=n.document;else if(n.unknownDocument)e=n.unknownDocument;else{if(!n.noDocument)throw q(14731);e=n.noDocument}return JSON.stringify(e).length}/**
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
 */Qe.DEFAULT_COLLECTION_PERCENTILE=10,Qe.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,Qe.DEFAULT=new Qe(Py,Qe.DEFAULT_COLLECTION_PERCENTILE,Qe.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),Qe.DISABLED=new Qe(-1,0,0);class Gc{constructor(e,t,r,s){this.userId=e,this.serializer=t,this.indexManager=r,this.referenceDelegate=s,this.Xn={}}static wt(e,t,r,s){z(e.uid!=="",64387);const i=e.isAuthenticated()?e.uid:"";return new Gc(i,t,r,s)}checkEmpty(e){let t=!0;const r=IDBKeyRange.bound([this.userId,Number.NEGATIVE_INFINITY],[this.userId,Number.POSITIVE_INFINITY]);return In(e).ee({index:fr,range:r},((s,i,o)=>{t=!1,o.done()})).next((()=>t))}addMutationBatch(e,t,r,s){const i=ns(e),o=In(e);return o.add({}).next((a=>{z(typeof a=="number",49019);const l=new bh(a,t,r,s),u=(function(g,w,R){const C=R.baseMutations.map((B=>ho(g.yt,B))),V=R.mutations.map((B=>ho(g.yt,B)));return{userId:w,batchId:R.batchId,localWriteTimeMs:R.localWriteTime.toMillis(),baseMutations:C,mutations:V}})(this.serializer,this.userId,l),h=[];let f=new he(((_,g)=>j(_.canonicalString(),g.canonicalString())));for(const _ of s){const g=gg(this.userId,_.key.path,a);f=f.add(_.key.path.popLast()),h.push(o.put(u)),h.push(i.put(g,_A))}return f.forEach((_=>{h.push(this.indexManager.addToCollectionParentIndex(e,_))})),e.addOnCommittedListener((()=>{this.Xn[a]=l.keys()})),b.waitFor(h).next((()=>l))}))}lookupMutationBatch(e,t){return In(e).get(t).next((r=>r?(z(r.userId===this.userId,48,"Unexpected user for mutation batch",{userId:r.userId,batchId:t}),ur(this.serializer,r)):null))}er(e,t){return this.Xn[t]?b.resolve(this.Xn[t]):this.lookupMutationBatch(e,t).next((r=>{if(r){const s=r.keys();return this.Xn[t]=s,s}return null}))}getNextMutationBatchAfterBatchId(e,t){const r=t+1,s=IDBKeyRange.lowerBound([this.userId,r]);let i=null;return In(e).ee({index:fr,range:s},((o,a,l)=>{a.userId===this.userId&&(z(a.batchId>=r,47524,{tr:r}),i=ur(this.serializer,a)),l.done()})).next((()=>i))}getHighestUnacknowledgedBatchId(e){const t=IDBKeyRange.upperBound([this.userId,Number.POSITIVE_INFINITY]);let r=Pn;return In(e).ee({index:fr,range:t,reverse:!0},((s,i,o)=>{r=i.batchId,o.done()})).next((()=>r))}getAllMutationBatches(e){const t=IDBKeyRange.bound([this.userId,Pn],[this.userId,Number.POSITIVE_INFINITY]);return In(e).J(fr,t).next((r=>r.map((s=>ur(this.serializer,s)))))}getAllMutationBatchesAffectingDocumentKey(e,t){const r=Aa(this.userId,t.path),s=IDBKeyRange.lowerBound(r),i=[];return ns(e).ee({range:s},((o,a,l)=>{const[u,h,f]=o,_=Ot(h);if(u===this.userId&&t.path.isEqual(_))return In(e).get(f).next((g=>{if(!g)throw q(61480,{nr:o,batchId:f});z(g.userId===this.userId,10503,"Unexpected user for mutation batch",{userId:g.userId,batchId:f}),i.push(ur(this.serializer,g))}));l.done()})).next((()=>i))}getAllMutationBatchesAffectingDocumentKeys(e,t){let r=new he(j);const s=[];return t.forEach((i=>{const o=Aa(this.userId,i.path),a=IDBKeyRange.lowerBound(o),l=ns(e).ee({range:a},((u,h,f)=>{const[_,g,w]=u,R=Ot(g);_===this.userId&&i.path.isEqual(R)?r=r.add(w):f.done()}));s.push(l)})),b.waitFor(s).next((()=>this.rr(e,r)))}getAllMutationBatchesAffectingQuery(e,t){const r=t.path,s=r.length+1,i=Aa(this.userId,r),o=IDBKeyRange.lowerBound(i);let a=new he(j);return ns(e).ee({range:o},((l,u,h)=>{const[f,_,g]=l,w=Ot(_);f===this.userId&&r.isPrefixOf(w)?w.length===s&&(a=a.add(g)):h.done()})).next((()=>this.rr(e,a)))}rr(e,t){const r=[],s=[];return t.forEach((i=>{s.push(In(e).get(i).next((o=>{if(o===null)throw q(35274,{batchId:i});z(o.userId===this.userId,9748,"Unexpected user for mutation batch",{userId:o.userId,batchId:i}),r.push(ur(this.serializer,o))})))})),b.waitFor(s).next((()=>r))}removeMutationBatch(e,t){return Ny(e.le,this.userId,t).next((r=>(e.addOnCommittedListener((()=>{this.ir(t.batchId)})),b.forEach(r,(s=>this.referenceDelegate.markPotentiallyOrphaned(e,s))))))}ir(e){delete this.Xn[e]}performConsistencyCheck(e){return this.checkEmpty(e).next((t=>{if(!t)return b.resolve();const r=IDBKeyRange.lowerBound((function(o){return[o]})(this.userId)),s=[];return ns(e).ee({range:r},((i,o,a)=>{if(i[0]===this.userId){const l=Ot(i[1]);s.push(l)}else a.done()})).next((()=>{z(s.length===0,56720,{sr:s.map((i=>i.canonicalString()))})}))}))}containsKey(e,t){return ky(e,this.userId,t)}_r(e){return Dy(e).get(this.userId).next((t=>t||{userId:this.userId,lastAcknowledgedBatchId:Pn,lastStreamToken:""}))}}function ky(n,e,t){const r=Aa(e,t.path),s=r[1],i=IDBKeyRange.lowerBound(r);let o=!1;return ns(n).ee({range:i,X:!0},((a,l,u)=>{const[h,f,_]=a;h===e&&f===s&&(o=!0),u.done()})).next((()=>o))}function In(n){return Fe(n,At)}function ns(n){return Fe(n,ms)}function Dy(n){return Fe(n,no)}/**
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
 */class Sr{constructor(e){this.ar=e}next(){return this.ar+=2,this.ar}static ur(){return new Sr(0)}static cr(){return new Sr(-1)}}/**
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
 */class Ob{constructor(e,t){this.referenceDelegate=e,this.serializer=t}allocateTargetId(e){return this.lr(e).next((t=>{const r=new Sr(t.highestTargetId);return t.highestTargetId=r.next(),this.hr(e,t).next((()=>t.highestTargetId))}))}getLastRemoteSnapshotVersion(e){return this.lr(e).next((t=>G.fromTimestamp(new ce(t.lastRemoteSnapshotVersion.seconds,t.lastRemoteSnapshotVersion.nanoseconds))))}getHighestSequenceNumber(e){return this.lr(e).next((t=>t.highestListenSequenceNumber))}setTargetsMetadata(e,t,r){return this.lr(e).next((s=>(s.highestListenSequenceNumber=t,r&&(s.lastRemoteSnapshotVersion=r.toTimestamp()),t>s.highestListenSequenceNumber&&(s.highestListenSequenceNumber=t),this.hr(e,s))))}addTargetData(e,t){return this.Pr(e,t).next((()=>this.lr(e).next((r=>(r.targetCount+=1,this.Tr(t,r),this.hr(e,r))))))}updateTargetData(e,t){return this.Pr(e,t)}removeTargetData(e,t){return this.removeMatchingKeysForTargetId(e,t.targetId).next((()=>Yr(e).delete(t.targetId))).next((()=>this.lr(e))).next((r=>(z(r.targetCount>0,8065),r.targetCount-=1,this.hr(e,r))))}removeTargets(e,t,r){let s=0;const i=[];return Yr(e).ee(((o,a)=>{const l=Di(a);l.sequenceNumber<=t&&r.get(l.targetId)===null&&(s++,i.push(this.removeTargetData(e,l)))})).next((()=>b.waitFor(i))).next((()=>s))}forEachTarget(e,t){return Yr(e).ee(((r,s)=>{const i=Di(s);t(i)}))}lr(e){return a_(e).get(Ga).next((t=>(z(t!==null,2888),t)))}hr(e,t){return a_(e).put(Ga,t)}Pr(e,t){return Yr(e).put(Ry(this.serializer,t))}Tr(e,t){let r=!1;return e.targetId>t.highestTargetId&&(t.highestTargetId=e.targetId,r=!0),e.sequenceNumber>t.highestListenSequenceNumber&&(t.highestListenSequenceNumber=e.sequenceNumber,r=!0),r}getTargetCount(e){return this.lr(e).next((t=>t.targetCount))}getTargetData(e,t){const r=wr(t),s=IDBKeyRange.bound([r,Number.NEGATIVE_INFINITY],[r,Number.POSITIVE_INFINITY]);let i=null;return Yr(e).ee({range:s,index:Ig},((o,a,l)=>{const u=Di(a);Co(t,u.target)&&(i=u,l.done())})).next((()=>i))}addMatchingKeys(e,t,r){const s=[],i=vn(e);return t.forEach((o=>{const a=Ye(o.path);s.push(i.put({targetId:r,path:a})),s.push(this.referenceDelegate.addReference(e,r,o))})),b.waitFor(s)}removeMatchingKeys(e,t,r){const s=vn(e);return b.forEach(t,(i=>{const o=Ye(i.path);return b.waitFor([s.delete([r,o]),this.referenceDelegate.removeReference(e,r,i)])}))}removeMatchingKeysForTargetId(e,t){const r=vn(e),s=IDBKeyRange.bound([t],[t+1],!1,!0);return r.delete(s)}getMatchingKeysForTargetId(e,t){const r=IDBKeyRange.bound([t],[t+1],!1,!0),s=vn(e);let i=K();return s.ee({range:r,X:!0},((o,a,l)=>{const u=Ot(o[1]),h=new M(u);i=i.add(h)})).next((()=>i))}containsKey(e,t){const r=Ye(t.path),s=IDBKeyRange.bound([r],[ag(r)],!1,!0);let i=0;return vn(e).ee({index:ph,X:!0,range:s},(([o,a],l,u)=>{o!==0&&(i++,u.done())})).next((()=>i>0))}At(e,t){return Yr(e).get(t).next((r=>r?Di(r):null))}}function Yr(n){return Fe(n,gs)}function a_(n){return Fe(n,yr)}function vn(n){return Fe(n,ys)}/**
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
 */const c_="LruGarbageCollector",xy=1048576;function l_([n,e],[t,r]){const s=j(n,t);return s===0?j(e,r):s}class Mb{constructor(e){this.Ir=e,this.buffer=new he(l_),this.Er=0}dr(){return++this.Er}Ar(e){const t=[e,this.dr()];if(this.buffer.size<this.Ir)this.buffer=this.buffer.add(t);else{const r=this.buffer.last();l_(t,r)<0&&(this.buffer=this.buffer.delete(r).add(t))}}get maxValue(){return this.buffer.last()[0]}}class Vy{constructor(e,t,r){this.garbageCollector=e,this.asyncQueue=t,this.localStore=r,this.Rr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.Vr(6e4)}stop(){this.Rr&&(this.Rr.cancel(),this.Rr=null)}get started(){return this.Rr!==null}Vr(e){x(c_,`Garbage collection scheduled in ${e}ms`),this.Rr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,(async()=>{this.Rr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(t){jn(t)?x(c_,"Ignoring IndexedDB error during garbage collection: ",t):await $n(t)}await this.Vr(3e5)}))}}class Lb{constructor(e,t){this.mr=e,this.params=t}calculateTargetCount(e,t){return this.mr.gr(e).next((r=>Math.floor(t/100*r)))}nthSequenceNumber(e,t){if(t===0)return b.resolve(ot.ce);const r=new Mb(t);return this.mr.forEachTarget(e,(s=>r.Ar(s.sequenceNumber))).next((()=>this.mr.pr(e,(s=>r.Ar(s))))).next((()=>r.maxValue))}removeTargets(e,t,r){return this.mr.removeTargets(e,t,r)}removeOrphanedDocuments(e,t){return this.mr.removeOrphanedDocuments(e,t)}collect(e,t){return this.params.cacheSizeCollectionThreshold===-1?(x("LruGarbageCollector","Garbage collection skipped; disabled"),b.resolve(o_)):this.getCacheSize(e).next((r=>r<this.params.cacheSizeCollectionThreshold?(x("LruGarbageCollector",`Garbage collection skipped; Cache size ${r} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),o_):this.yr(e,t)))}getCacheSize(e){return this.mr.getCacheSize(e)}yr(e,t){let r,s,i,o,a,l,u;const h=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next((f=>(f>this.params.maximumSequenceNumbersToCollect?(x("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${f}`),s=this.params.maximumSequenceNumbersToCollect):s=f,o=Date.now(),this.nthSequenceNumber(e,s)))).next((f=>(r=f,a=Date.now(),this.removeTargets(e,r,t)))).next((f=>(i=f,l=Date.now(),this.removeOrphanedDocuments(e,r)))).next((f=>(u=Date.now(),Zr()<=re.DEBUG&&x("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${o-h}ms
	Determined least recently used ${s} in `+(a-o)+`ms
	Removed ${i} targets in `+(l-a)+`ms
	Removed ${f} documents in `+(u-l)+`ms
Total Duration: ${u-h}ms`),b.resolve({didRun:!0,sequenceNumbersCollected:s,targetsRemoved:i,documentsRemoved:f}))))}}function Oy(n,e){return new Lb(n,e)}/**
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
 */class Fb{constructor(e,t){this.db=e,this.garbageCollector=Oy(this,t)}gr(e){const t=this.wr(e);return this.db.getTargetCache().getTargetCount(e).next((r=>t.next((s=>r+s))))}wr(e){let t=0;return this.pr(e,(r=>{t++})).next((()=>t))}forEachTarget(e,t){return this.db.getTargetCache().forEachTarget(e,t)}pr(e,t){return this.Sr(e,((r,s)=>t(s)))}addReference(e,t,r){return pa(e,r)}removeReference(e,t,r){return pa(e,r)}removeTargets(e,t,r){return this.db.getTargetCache().removeTargets(e,t,r)}markPotentiallyOrphaned(e,t){return pa(e,t)}br(e,t){return(function(s,i){let o=!1;return Dy(s).te((a=>ky(s,a,i).next((l=>(l&&(o=!0),b.resolve(!l)))))).next((()=>o))})(e,t)}removeOrphanedDocuments(e,t){const r=this.db.getRemoteDocumentCache().newChangeBuffer(),s=[];let i=0;return this.Sr(e,((o,a)=>{if(a<=t){const l=this.br(e,o).next((u=>{if(!u)return i++,r.getEntry(e,o).next((()=>(r.removeEntry(o,G.min()),vn(e).delete((function(f){return[0,Ye(f.path)]})(o)))))}));s.push(l)}})).next((()=>b.waitFor(s))).next((()=>r.apply(e))).next((()=>i))}removeTarget(e,t){const r=t.withSequenceNumber(e.currentSequenceNumber);return this.db.getTargetCache().updateTargetData(e,r)}updateLimboDocument(e,t){return pa(e,t)}Sr(e,t){const r=vn(e);let s,i=ot.ce;return r.ee({index:ph},(([o,a],{path:l,sequenceNumber:u})=>{o===0?(i!==ot.ce&&t(new M(Ot(s)),i),i=u,s=l):i=ot.ce})).next((()=>{i!==ot.ce&&t(new M(Ot(s)),i)}))}getCacheSize(e){return this.db.getRemoteDocumentCache().getSize(e)}}function pa(n,e){return vn(n).put((function(r,s){return{targetId:0,path:Ye(r.path),sequenceNumber:s}})(e,n.currentSequenceNumber))}/**
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
 */class My{constructor(){this.changes=new cn((e=>e.toString()),((e,t)=>e.isEqual(t))),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,ye.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();const r=this.changes.get(t);return r!==void 0?b.resolve(r):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}/**
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
 */class Ub{constructor(e){this.serializer=e}setIndexManager(e){this.indexManager=e}addEntry(e,t,r){return sr(e).put(r)}removeEntry(e,t,r){return sr(e).delete((function(i,o){const a=i.path.toArray();return[a.slice(0,a.length-2),a[a.length-2],Ka(o),a[a.length-1]]})(t,r))}updateMetadata(e,t){return this.getMetadata(e).next((r=>(r.byteSize+=t,this.Dr(e,r))))}getEntry(e,t){let r=ye.newInvalidDocument(t);return sr(e).ee({index:ba,range:IDBKeyRange.only(wi(t))},((s,i)=>{r=this.Cr(t,i)})).next((()=>r))}vr(e,t){let r={size:0,document:ye.newInvalidDocument(t)};return sr(e).ee({index:ba,range:IDBKeyRange.only(wi(t))},((s,i)=>{r={document:this.Cr(t,i),size:Qa(i)}})).next((()=>r))}getEntries(e,t){let r=ct();return this.Fr(e,t,((s,i)=>{const o=this.Cr(s,i);r=r.insert(s,o)})).next((()=>r))}Mr(e,t){let r=ct(),s=new be(M.comparator);return this.Fr(e,t,((i,o)=>{const a=this.Cr(i,o);r=r.insert(i,a),s=s.insert(i,Qa(o))})).next((()=>({documents:r,Or:s})))}Fr(e,t,r){if(t.isEmpty())return b.resolve();let s=new he(d_);t.forEach((l=>s=s.add(l)));const i=IDBKeyRange.bound(wi(s.first()),wi(s.last())),o=s.getIterator();let a=o.getNext();return sr(e).ee({index:ba,range:i},((l,u,h)=>{const f=M.fromSegments([...u.prefixPath,u.collectionGroup,u.documentId]);for(;a&&d_(a,f)<0;)r(a,null),a=o.getNext();a&&a.isEqual(f)&&(r(a,u),a=o.hasNext()?o.getNext():null),a?h.j(wi(a)):h.done()})).next((()=>{for(;a;)r(a,null),a=o.hasNext()?o.getNext():null}))}getDocumentsMatchingQuery(e,t,r,s,i){const o=t.path,a=[o.popLast().toArray(),o.lastSegment(),Ka(r.readTime),r.documentKey.path.isEmpty()?"":r.documentKey.path.lastSegment()],l=[o.popLast().toArray(),o.lastSegment(),[Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],""];return sr(e).J(IDBKeyRange.bound(a,l,!0)).next((u=>{i==null||i.incrementDocumentReadCount(u.length);let h=ct();for(const f of u){const _=this.Cr(M.fromSegments(f.prefixPath.concat(f.collectionGroup,f.documentId)),f);_.isFoundDocument()&&(No(t,_)||s.has(_.key))&&(h=h.insert(_.key,_))}return h}))}getAllFromCollectionGroup(e,t,r,s){let i=ct();const o=h_(t,r),a=h_(t,Et.max());return sr(e).ee({index:yg,range:IDBKeyRange.bound(o,a,!0)},((l,u,h)=>{const f=this.Cr(M.fromSegments(u.prefixPath.concat(u.collectionGroup,u.documentId)),u);i=i.insert(f.key,f),i.size===s&&h.done()})).next((()=>i))}newChangeBuffer(e){return new Bb(this,!!e&&e.trackRemovals)}getSize(e){return this.getMetadata(e).next((t=>t.byteSize))}getMetadata(e){return u_(e).get(mu).next((t=>(z(!!t,20021),t)))}Dr(e,t){return u_(e).put(mu,t)}Cr(e,t){if(t){const r=bb(this.serializer,t);if(!(r.isNoDocument()&&r.version.isEqual(G.min())))return r}return ye.newInvalidDocument(e)}}function Ly(n){return new Ub(n)}class Bb extends My{constructor(e,t){super(),this.Nr=e,this.trackRemovals=t,this.Br=new cn((r=>r.toString()),((r,s)=>r.isEqual(s)))}applyChanges(e){const t=[];let r=0,s=new he(((i,o)=>j(i.canonicalString(),o.canonicalString())));return this.changes.forEach(((i,o)=>{const a=this.Br.get(i);if(t.push(this.Nr.removeEntry(e,i,a.readTime)),o.isValidDocument()){const l=Kp(this.Nr.serializer,o);s=s.add(i.path.popLast());const u=Qa(l);r+=u-a.size,t.push(this.Nr.addEntry(e,i,l))}else if(r-=a.size,this.trackRemovals){const l=Kp(this.Nr.serializer,o.convertToNoDocument(G.min()));t.push(this.Nr.addEntry(e,i,l))}})),s.forEach((i=>{t.push(this.Nr.indexManager.addToCollectionParentIndex(e,i))})),t.push(this.Nr.updateMetadata(e,r)),b.waitFor(t)}getFromCache(e,t){return this.Nr.vr(e,t).next((r=>(this.Br.set(t,{size:r.size,readTime:r.document.readTime}),r.document)))}getAllFromCache(e,t){return this.Nr.Mr(e,t).next((({documents:r,Or:s})=>(s.forEach(((i,o)=>{this.Br.set(i,{size:o,readTime:r.get(i).readTime})})),r)))}}function u_(n){return Fe(n,ro)}function sr(n){return Fe(n,za)}function wi(n){const e=n.path.toArray();return[e.slice(0,e.length-2),e[e.length-2],e[e.length-1]]}function h_(n,e){const t=e.documentKey.path.toArray();return[n,Ka(e.readTime),t.slice(0,t.length-2),t.length>0?t[t.length-1]:""]}function d_(n,e){const t=n.path.toArray(),r=e.path.toArray();let s=0;for(let i=0;i<t.length-2&&i<r.length-2;++i)if(s=j(t[i],r[i]),s)return s;return s=j(t.length,r.length),s||(s=j(t[t.length-2],r[r.length-2]),s||j(t[t.length-1],r[r.length-1]))}/**
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
 */class qb{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}}/**
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
 */class Fy{constructor(e,t,r,s){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=r,this.indexManager=s}getDocument(e,t){let r=null;return this.documentOverlayCache.getOverlay(e,t).next((s=>(r=s,this.remoteDocumentCache.getEntry(e,t)))).next((s=>(r!==null&&qi(r.mutation,s,at.empty(),ce.now()),s)))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next((r=>this.getLocalViewOfDocuments(e,r,K()).next((()=>r))))}getLocalViewOfDocuments(e,t,r=K()){const s=Mt();return this.populateOverlays(e,s,t).next((()=>this.computeViews(e,t,s,r).next((i=>{let o=Ni();return i.forEach(((a,l)=>{o=o.insert(a,l.overlayedDocument)})),o}))))}getOverlayedDocuments(e,t){const r=Mt();return this.populateOverlays(e,r,t).next((()=>this.computeViews(e,t,r,K())))}populateOverlays(e,t,r){const s=[];return r.forEach((i=>{t.has(i)||s.push(i)})),this.documentOverlayCache.getOverlays(e,s).next((i=>{i.forEach(((o,a)=>{t.set(o,a)}))}))}computeViews(e,t,r,s){let i=ct();const o=Bi(),a=(function(){return Bi()})();return t.forEach(((l,u)=>{const h=r.get(u.key);s.has(u.key)&&(h===void 0||h.mutation instanceof ln)?i=i.insert(u.key,u):h!==void 0?(o.set(u.key,h.mutation.getFieldMask()),qi(h.mutation,u,h.mutation.getFieldMask(),ce.now())):o.set(u.key,at.empty())})),this.recalculateAndSaveOverlays(e,i).next((l=>(l.forEach(((u,h)=>o.set(u,h))),t.forEach(((u,h)=>a.set(u,new qb(h,o.get(u)??null)))),a)))}recalculateAndSaveOverlays(e,t){const r=Bi();let s=new be(((o,a)=>o-a)),i=K();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next((o=>{for(const a of o)a.keys().forEach((l=>{const u=t.get(l);if(u===null)return;let h=r.get(l)||at.empty();h=a.applyToLocalView(u,h),r.set(l,h);const f=(s.get(a.batchId)||K()).add(l);s=s.insert(a.batchId,f)}))})).next((()=>{const o=[],a=s.getReverseIterator();for(;a.hasNext();){const l=a.getNext(),u=l.key,h=l.value,f=Zg();h.forEach((_=>{if(!i.has(_)){const g=oy(t.get(_),r.get(_));g!==null&&f.set(_,g),i=i.add(_)}})),o.push(this.documentOverlayCache.saveOverlays(e,u,f))}return b.waitFor(o)})).next((()=>r))}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next((r=>this.recalculateAndSaveOverlays(e,r)))}getDocumentsMatchingQuery(e,t,r,s){return(function(o){return M.isDocumentKey(o.path)&&o.collectionGroup===null&&o.filters.length===0})(t)?this.getDocumentsMatchingDocumentQuery(e,t.path):Th(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,r,s):this.getDocumentsMatchingCollectionQuery(e,t,r,s)}getNextDocuments(e,t,r,s){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,r,s).next((i=>{const o=s-i.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,r.largestBatchId,s-i.size):b.resolve(Mt());let a=fs,l=i;return o.next((u=>b.forEach(u,((h,f)=>(a<f.largestBatchId&&(a=f.largestBatchId),i.get(h)?b.resolve():this.remoteDocumentCache.getEntry(e,h).next((_=>{l=l.insert(h,_)}))))).next((()=>this.populateOverlays(e,u,i))).next((()=>this.computeViews(e,l,u,K()))).next((h=>({batchId:a,changes:Jg(h)})))))}))}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new M(t)).next((r=>{let s=Ni();return r.isFoundDocument()&&(s=s.insert(r.key,r)),s}))}getDocumentsMatchingCollectionGroupQuery(e,t,r,s){const i=t.collectionGroup;let o=Ni();return this.indexManager.getCollectionParents(e,i).next((a=>b.forEach(a,(l=>{const u=(function(f,_){return new an(_,null,f.explicitOrderBy.slice(),f.filters.slice(),f.limit,f.limitType,f.startAt,f.endAt)})(t,l.child(i));return this.getDocumentsMatchingCollectionQuery(e,u,r,s).next((h=>{h.forEach(((f,_)=>{o=o.insert(f,_)}))}))})).next((()=>o))))}getDocumentsMatchingCollectionQuery(e,t,r,s){let i;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,r.largestBatchId).next((o=>(i=o,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,r,i,s)))).next((o=>{i.forEach(((l,u)=>{const h=u.getKey();o.get(h)===null&&(o=o.insert(h,ye.newInvalidDocument(h)))}));let a=Ni();return o.forEach(((l,u)=>{const h=i.get(l);h!==void 0&&qi(h.mutation,u,at.empty(),ce.now()),No(t,u)&&(a=a.insert(l,u))})),a}))}}/**
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
 */class zb{constructor(e){this.serializer=e,this.Lr=new Map,this.kr=new Map}getBundleMetadata(e,t){return b.resolve(this.Lr.get(t))}saveBundleMetadata(e,t){return this.Lr.set(t.id,(function(s){return{id:s.id,version:s.version,createTime:De(s.createTime)}})(t)),b.resolve()}getNamedQuery(e,t){return b.resolve(this.kr.get(t))}saveNamedQuery(e,t){return this.kr.set(t.name,(function(s){return{name:s.name,query:qc(s.bundledQuery),readTime:De(s.readTime)}})(t)),b.resolve()}}/**
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
 */class Gb{constructor(){this.overlays=new be(M.comparator),this.qr=new Map}getOverlay(e,t){return b.resolve(this.overlays.get(t))}getOverlays(e,t){const r=Mt();return b.forEach(t,(s=>this.getOverlay(e,s).next((i=>{i!==null&&r.set(s,i)})))).next((()=>r))}saveOverlays(e,t,r){return r.forEach(((s,i)=>{this.St(e,t,i)})),b.resolve()}removeOverlaysForBatchId(e,t,r){const s=this.qr.get(r);return s!==void 0&&(s.forEach((i=>this.overlays=this.overlays.remove(i))),this.qr.delete(r)),b.resolve()}getOverlaysForCollection(e,t,r){const s=Mt(),i=t.length+1,o=new M(t.child("")),a=this.overlays.getIteratorFrom(o);for(;a.hasNext();){const l=a.getNext().value,u=l.getKey();if(!t.isPrefixOf(u.path))break;u.path.length===i&&l.largestBatchId>r&&s.set(l.getKey(),l)}return b.resolve(s)}getOverlaysForCollectionGroup(e,t,r,s){let i=new be(((u,h)=>u-h));const o=this.overlays.getIterator();for(;o.hasNext();){const u=o.getNext().value;if(u.getKey().getCollectionGroup()===t&&u.largestBatchId>r){let h=i.get(u.largestBatchId);h===null&&(h=Mt(),i=i.insert(u.largestBatchId,h)),h.set(u.getKey(),u)}}const a=Mt(),l=i.getIterator();for(;l.hasNext()&&(l.getNext().value.forEach(((u,h)=>a.set(u,h))),!(a.size()>=s)););return b.resolve(a)}St(e,t,r){const s=this.overlays.get(r.key);if(s!==null){const o=this.qr.get(s.largestBatchId).delete(r.key);this.qr.set(s.largestBatchId,o)}this.overlays=this.overlays.insert(r.key,new Sh(t,r));let i=this.qr.get(t);i===void 0&&(i=K(),this.qr.set(t,i)),this.qr.set(t,i.add(r.key))}}/**
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
 */class $b{constructor(){this.sessionToken=Re.EMPTY_BYTE_STRING}getSessionToken(e){return b.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,b.resolve()}}/**
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
 */class Dh{constructor(){this.Qr=new he(qe.$r),this.Ur=new he(qe.Kr)}isEmpty(){return this.Qr.isEmpty()}addReference(e,t){const r=new qe(e,t);this.Qr=this.Qr.add(r),this.Ur=this.Ur.add(r)}Wr(e,t){e.forEach((r=>this.addReference(r,t)))}removeReference(e,t){this.Gr(new qe(e,t))}zr(e,t){e.forEach((r=>this.removeReference(r,t)))}jr(e){const t=new M(new Z([])),r=new qe(t,e),s=new qe(t,e+1),i=[];return this.Ur.forEachInRange([r,s],(o=>{this.Gr(o),i.push(o.key)})),i}Jr(){this.Qr.forEach((e=>this.Gr(e)))}Gr(e){this.Qr=this.Qr.delete(e),this.Ur=this.Ur.delete(e)}Hr(e){const t=new M(new Z([])),r=new qe(t,e),s=new qe(t,e+1);let i=K();return this.Ur.forEachInRange([r,s],(o=>{i=i.add(o.key)})),i}containsKey(e){const t=new qe(e,0),r=this.Qr.firstAfterOrEqual(t);return r!==null&&e.isEqual(r.key)}}class qe{constructor(e,t){this.key=e,this.Yr=t}static $r(e,t){return M.comparator(e.key,t.key)||j(e.Yr,t.Yr)}static Kr(e,t){return j(e.Yr,t.Yr)||M.comparator(e.key,t.key)}}/**
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
 */class jb{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.tr=1,this.Zr=new he(qe.$r)}checkEmpty(e){return b.resolve(this.mutationQueue.length===0)}addMutationBatch(e,t,r,s){const i=this.tr;this.tr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const o=new bh(i,t,r,s);this.mutationQueue.push(o);for(const a of s)this.Zr=this.Zr.add(new qe(a.key,i)),this.indexManager.addToCollectionParentIndex(e,a.key.path.popLast());return b.resolve(o)}lookupMutationBatch(e,t){return b.resolve(this.Xr(t))}getNextMutationBatchAfterBatchId(e,t){const r=t+1,s=this.ei(r),i=s<0?0:s;return b.resolve(this.mutationQueue.length>i?this.mutationQueue[i]:null)}getHighestUnacknowledgedBatchId(){return b.resolve(this.mutationQueue.length===0?Pn:this.tr-1)}getAllMutationBatches(e){return b.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){const r=new qe(t,0),s=new qe(t,Number.POSITIVE_INFINITY),i=[];return this.Zr.forEachInRange([r,s],(o=>{const a=this.Xr(o.Yr);i.push(a)})),b.resolve(i)}getAllMutationBatchesAffectingDocumentKeys(e,t){let r=new he(j);return t.forEach((s=>{const i=new qe(s,0),o=new qe(s,Number.POSITIVE_INFINITY);this.Zr.forEachInRange([i,o],(a=>{r=r.add(a.Yr)}))})),b.resolve(this.ti(r))}getAllMutationBatchesAffectingQuery(e,t){const r=t.path,s=r.length+1;let i=r;M.isDocumentKey(i)||(i=i.child(""));const o=new qe(new M(i),0);let a=new he(j);return this.Zr.forEachWhile((l=>{const u=l.key.path;return!!r.isPrefixOf(u)&&(u.length===s&&(a=a.add(l.Yr)),!0)}),o),b.resolve(this.ti(a))}ti(e){const t=[];return e.forEach((r=>{const s=this.Xr(r);s!==null&&t.push(s)})),t}removeMutationBatch(e,t){z(this.ni(t.batchId,"removed")===0,55003),this.mutationQueue.shift();let r=this.Zr;return b.forEach(t.mutations,(s=>{const i=new qe(s.key,t.batchId);return r=r.delete(i),this.referenceDelegate.markPotentiallyOrphaned(e,s.key)})).next((()=>{this.Zr=r}))}ir(e){}containsKey(e,t){const r=new qe(t,0),s=this.Zr.firstAfterOrEqual(r);return b.resolve(t.isEqual(s&&s.key))}performConsistencyCheck(e){return this.mutationQueue.length,b.resolve()}ni(e,t){return this.ei(e)}ei(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}Xr(e){const t=this.ei(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}}/**
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
 */class Wb{constructor(e){this.ri=e,this.docs=(function(){return new be(M.comparator)})(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){const r=t.key,s=this.docs.get(r),i=s?s.size:0,o=this.ri(t);return this.docs=this.docs.insert(r,{document:t.mutableCopy(),size:o}),this.size+=o-i,this.indexManager.addToCollectionParentIndex(e,r.path.popLast())}removeEntry(e){const t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){const r=this.docs.get(t);return b.resolve(r?r.document.mutableCopy():ye.newInvalidDocument(t))}getEntries(e,t){let r=ct();return t.forEach((s=>{const i=this.docs.get(s);r=r.insert(s,i?i.document.mutableCopy():ye.newInvalidDocument(s))})),b.resolve(r)}getDocumentsMatchingQuery(e,t,r,s){let i=ct();const o=t.path,a=new M(o.child("__id-9223372036854775808__")),l=this.docs.getIteratorFrom(a);for(;l.hasNext();){const{key:u,value:{document:h}}=l.getNext();if(!o.isPrefixOf(u.path))break;u.path.length>o.length+1||dh(dg(h),r)<=0||(s.has(h.key)||No(t,h))&&(i=i.insert(h.key,h.mutableCopy()))}return b.resolve(i)}getAllFromCollectionGroup(e,t,r,s){q(9500)}ii(e,t){return b.forEach(this.docs,(r=>t(r)))}newChangeBuffer(e){return new Kb(this)}getSize(e){return b.resolve(this.size)}}class Kb extends My{constructor(e){super(),this.Nr=e}applyChanges(e){const t=[];return this.changes.forEach(((r,s)=>{s.isValidDocument()?t.push(this.Nr.addEntry(e,s)):this.Nr.removeEntry(r)})),b.waitFor(t)}getFromCache(e,t){return this.Nr.getEntry(e,t)}getAllFromCache(e,t){return this.Nr.getEntries(e,t)}}/**
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
 */class Hb{constructor(e){this.persistence=e,this.si=new cn((t=>wr(t)),Co),this.lastRemoteSnapshotVersion=G.min(),this.highestTargetId=0,this.oi=0,this._i=new Dh,this.targetCount=0,this.ai=Sr.ur()}forEachTarget(e,t){return this.si.forEach(((r,s)=>t(s))),b.resolve()}getLastRemoteSnapshotVersion(e){return b.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return b.resolve(this.oi)}allocateTargetId(e){return this.highestTargetId=this.ai.next(),b.resolve(this.highestTargetId)}setTargetsMetadata(e,t,r){return r&&(this.lastRemoteSnapshotVersion=r),t>this.oi&&(this.oi=t),b.resolve()}Pr(e){this.si.set(e.target,e);const t=e.targetId;t>this.highestTargetId&&(this.ai=new Sr(t),this.highestTargetId=t),e.sequenceNumber>this.oi&&(this.oi=e.sequenceNumber)}addTargetData(e,t){return this.Pr(t),this.targetCount+=1,b.resolve()}updateTargetData(e,t){return this.Pr(t),b.resolve()}removeTargetData(e,t){return this.si.delete(t.target),this._i.jr(t.targetId),this.targetCount-=1,b.resolve()}removeTargets(e,t,r){let s=0;const i=[];return this.si.forEach(((o,a)=>{a.sequenceNumber<=t&&r.get(a.targetId)===null&&(this.si.delete(o),i.push(this.removeMatchingKeysForTargetId(e,a.targetId)),s++)})),b.waitFor(i).next((()=>s))}getTargetCount(e){return b.resolve(this.targetCount)}getTargetData(e,t){const r=this.si.get(t)||null;return b.resolve(r)}addMatchingKeys(e,t,r){return this._i.Wr(t,r),b.resolve()}removeMatchingKeys(e,t,r){this._i.zr(t,r);const s=this.persistence.referenceDelegate,i=[];return s&&t.forEach((o=>{i.push(s.markPotentiallyOrphaned(e,o))})),b.waitFor(i)}removeMatchingKeysForTargetId(e,t){return this._i.jr(t),b.resolve()}getMatchingKeysForTargetId(e,t){const r=this._i.Hr(t);return b.resolve(r)}containsKey(e,t){return b.resolve(this._i.containsKey(t))}}/**
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
 */class xh{constructor(e,t){this.ui={},this.overlays={},this.ci=new ot(0),this.li=!1,this.li=!0,this.hi=new $b,this.referenceDelegate=e(this),this.Pi=new Hb(this),this.indexManager=new xb,this.remoteDocumentCache=(function(s){return new Wb(s)})((r=>this.referenceDelegate.Ti(r))),this.serializer=new by(t),this.Ii=new zb(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.li=!1,Promise.resolve()}get started(){return this.li}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new Gb,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let r=this.ui[e.toKey()];return r||(r=new jb(t,this.referenceDelegate),this.ui[e.toKey()]=r),r}getGlobalsCache(){return this.hi}getTargetCache(){return this.Pi}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Ii}runTransaction(e,t,r){x("MemoryPersistence","Starting transaction:",e);const s=new Qb(this.ci.next());return this.referenceDelegate.Ei(),r(s).next((i=>this.referenceDelegate.di(s).next((()=>i)))).toPromise().then((i=>(s.raiseOnCommittedEvent(),i)))}Ai(e,t){return b.or(Object.values(this.ui).map((r=>()=>r.containsKey(e,t))))}}class Qb extends pg{constructor(e){super(),this.currentSequenceNumber=e}}class $c{constructor(e){this.persistence=e,this.Ri=new Dh,this.Vi=null}static mi(e){return new $c(e)}get fi(){if(this.Vi)return this.Vi;throw q(60996)}addReference(e,t,r){return this.Ri.addReference(r,t),this.fi.delete(r.toString()),b.resolve()}removeReference(e,t,r){return this.Ri.removeReference(r,t),this.fi.add(r.toString()),b.resolve()}markPotentiallyOrphaned(e,t){return this.fi.add(t.toString()),b.resolve()}removeTarget(e,t){this.Ri.jr(t.targetId).forEach((s=>this.fi.add(s.toString())));const r=this.persistence.getTargetCache();return r.getMatchingKeysForTargetId(e,t.targetId).next((s=>{s.forEach((i=>this.fi.add(i.toString())))})).next((()=>r.removeTargetData(e,t)))}Ei(){this.Vi=new Set}di(e){const t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return b.forEach(this.fi,(r=>{const s=M.fromPath(r);return this.gi(e,s).next((i=>{i||t.removeEntry(s,G.min())}))})).next((()=>(this.Vi=null,t.apply(e))))}updateLimboDocument(e,t){return this.gi(e,t).next((r=>{r?this.fi.delete(t.toString()):this.fi.add(t.toString())}))}Ti(e){return 0}gi(e,t){return b.or([()=>b.resolve(this.Ri.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.Ai(e,t)])}}class Ya{constructor(e,t){this.persistence=e,this.pi=new cn((r=>Ye(r.path)),((r,s)=>r.isEqual(s))),this.garbageCollector=Oy(this,t)}static mi(e,t){return new Ya(e,t)}Ei(){}di(e){return b.resolve()}forEachTarget(e,t){return this.persistence.getTargetCache().forEachTarget(e,t)}gr(e){const t=this.wr(e);return this.persistence.getTargetCache().getTargetCount(e).next((r=>t.next((s=>r+s))))}wr(e){let t=0;return this.pr(e,(r=>{t++})).next((()=>t))}pr(e,t){return b.forEach(this.pi,((r,s)=>this.br(e,r,s).next((i=>i?b.resolve():t(s)))))}removeTargets(e,t,r){return this.persistence.getTargetCache().removeTargets(e,t,r)}removeOrphanedDocuments(e,t){let r=0;const s=this.persistence.getRemoteDocumentCache(),i=s.newChangeBuffer();return s.ii(e,(o=>this.br(e,o,t).next((a=>{a||(r++,i.removeEntry(o,G.min()))})))).next((()=>i.apply(e))).next((()=>r))}markPotentiallyOrphaned(e,t){return this.pi.set(t,e.currentSequenceNumber),b.resolve()}removeTarget(e,t){const r=t.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,r)}addReference(e,t,r){return this.pi.set(r,e.currentSequenceNumber),b.resolve()}removeReference(e,t,r){return this.pi.set(r,e.currentSequenceNumber),b.resolve()}updateLimboDocument(e,t){return this.pi.set(t,e.currentSequenceNumber),b.resolve()}Ti(e){let t=e.key.toString().length;return e.isFoundDocument()&&(t+=Sa(e.data.value)),t}br(e,t,r){return b.or([()=>this.persistence.Ai(e,t),()=>this.persistence.getTargetCache().containsKey(e,t),()=>{const s=this.pi.get(t);return b.resolve(s!==void 0&&s>r)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}/**
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
 */class Yb{constructor(e){this.serializer=e}k(e,t,r,s){const i=new Nc("createOrUpgrade",t);r<1&&s>=1&&((function(l){l.createObjectStore(So)})(e),(function(l){l.createObjectStore(no,{keyPath:pA}),l.createObjectStore(At,{keyPath:vp,autoIncrement:!0}).createIndex(fr,Ap,{unique:!0}),l.createObjectStore(ms)})(e),f_(e),(function(l){l.createObjectStore(ar)})(e));let o=b.resolve();return r<3&&s>=3&&(r!==0&&((function(l){l.deleteObjectStore(ys),l.deleteObjectStore(gs),l.deleteObjectStore(yr)})(e),f_(e)),o=o.next((()=>(function(l){const u=l.store(yr),h={highestTargetId:0,highestListenSequenceNumber:0,lastRemoteSnapshotVersion:G.min().toTimestamp(),targetCount:0};return u.put(Ga,h)})(i)))),r<4&&s>=4&&(r!==0&&(o=o.next((()=>(function(l,u){return u.store(At).J().next((f=>{l.deleteObjectStore(At),l.createObjectStore(At,{keyPath:vp,autoIncrement:!0}).createIndex(fr,Ap,{unique:!0});const _=u.store(At),g=f.map((w=>_.put(w)));return b.waitFor(g)}))})(e,i)))),o=o.next((()=>{(function(l){l.createObjectStore(Is,{keyPath:vA})})(e)}))),r<5&&s>=5&&(o=o.next((()=>this.yi(i)))),r<6&&s>=6&&(o=o.next((()=>((function(l){l.createObjectStore(ro)})(e),this.wi(i))))),r<7&&s>=7&&(o=o.next((()=>this.Si(i)))),r<8&&s>=8&&(o=o.next((()=>this.bi(e,i)))),r<9&&s>=9&&(o=o.next((()=>{(function(l){l.objectStoreNames.contains("remoteDocumentChanges")&&l.deleteObjectStore("remoteDocumentChanges")})(e)}))),r<10&&s>=10&&(o=o.next((()=>this.Di(i)))),r<11&&s>=11&&(o=o.next((()=>{(function(l){l.createObjectStore(kc,{keyPath:AA})})(e),(function(l){l.createObjectStore(Dc,{keyPath:bA})})(e)}))),r<12&&s>=12&&(o=o.next((()=>{(function(l){const u=l.createObjectStore(xc,{keyPath:DA});u.createIndex(yu,xA,{unique:!1}),u.createIndex(wg,VA,{unique:!1})})(e)}))),r<13&&s>=13&&(o=o.next((()=>(function(l){const u=l.createObjectStore(za,{keyPath:mA});u.createIndex(ba,gA),u.createIndex(yg,yA)})(e))).next((()=>this.Ci(e,i))).next((()=>e.deleteObjectStore(ar)))),r<14&&s>=14&&(o=o.next((()=>this.Fi(e,i)))),r<15&&s>=15&&(o=o.next((()=>(function(l){l.createObjectStore(_h,{keyPath:RA,autoIncrement:!0}).createIndex(gu,SA,{unique:!1}),l.createObjectStore(Li,{keyPath:CA}).createIndex(Eg,PA,{unique:!1}),l.createObjectStore(Fi,{keyPath:NA}).createIndex(Tg,kA,{unique:!1})})(e)))),r<16&&s>=16&&(o=o.next((()=>{t.objectStore(Li).clear()})).next((()=>{t.objectStore(Fi).clear()}))),r<17&&s>=17&&(o=o.next((()=>{(function(l){l.createObjectStore(mh,{keyPath:OA})})(e)}))),r<18&&s>=18&&Wm()&&(o=o.next((()=>{t.objectStore(Li).clear()})).next((()=>{t.objectStore(Fi).clear()}))),o}wi(e){let t=0;return e.store(ar).ee(((r,s)=>{t+=Qa(s)})).next((()=>{const r={byteSize:t};return e.store(ro).put(mu,r)}))}yi(e){const t=e.store(no),r=e.store(At);return t.J().next((s=>b.forEach(s,(i=>{const o=IDBKeyRange.bound([i.userId,Pn],[i.userId,i.lastAcknowledgedBatchId]);return r.J(fr,o).next((a=>b.forEach(a,(l=>{z(l.userId===i.userId,18650,"Cannot process batch from unexpected user",{batchId:l.batchId});const u=ur(this.serializer,l);return Ny(e,i.userId,u).next((()=>{}))}))))}))))}Si(e){const t=e.store(ys),r=e.store(ar);return e.store(yr).get(Ga).next((s=>{const i=[];return r.ee(((o,a)=>{const l=new Z(o),u=(function(f){return[0,Ye(f)]})(l);i.push(t.get(u).next((h=>h?b.resolve():(f=>t.put({targetId:0,path:Ye(f),sequenceNumber:s.highestListenSequenceNumber}))(l))))})).next((()=>b.waitFor(i)))}))}bi(e,t){e.createObjectStore(so,{keyPath:wA});const r=t.store(so),s=new kh,i=o=>{if(s.add(o)){const a=o.lastSegment(),l=o.popLast();return r.put({collectionId:a,parent:Ye(l)})}};return t.store(ar).ee({X:!0},((o,a)=>{const l=new Z(o);return i(l.popLast())})).next((()=>t.store(ms).ee({X:!0},(([o,a,l],u)=>{const h=Ot(a);return i(h.popLast())}))))}Di(e){const t=e.store(gs);return t.ee(((r,s)=>{const i=Di(s),o=Ry(this.serializer,i);return t.put(o)}))}Ci(e,t){const r=t.store(ar),s=[];return r.ee(((i,o)=>{const a=t.store(za),l=(function(f){return f.document?new M(Z.fromString(f.document.name).popFirst(5)):f.noDocument?M.fromSegments(f.noDocument.path):f.unknownDocument?M.fromSegments(f.unknownDocument.path):q(36783)})(o).path.toArray(),u={prefixPath:l.slice(0,l.length-2),collectionGroup:l[l.length-2],documentId:l[l.length-1],readTime:o.readTime||[0,0],unknownDocument:o.unknownDocument,noDocument:o.noDocument,document:o.document,hasCommittedMutations:!!o.hasCommittedMutations};s.push(a.put(u))})).next((()=>b.waitFor(s)))}Fi(e,t){const r=t.store(At),s=Ly(this.serializer),i=new xh($c.mi,this.serializer.yt);return r.J().next((o=>{const a=new Map;return o.forEach((l=>{let u=a.get(l.userId)??K();ur(this.serializer,l).keys().forEach((h=>u=u.add(h))),a.set(l.userId,u)})),b.forEach(a,((l,u)=>{const h=new ze(u),f=zc.wt(this.serializer,h),_=i.getIndexManager(h),g=Gc.wt(h,this.serializer,_,i.referenceDelegate);return new Fy(s,g,f,_).recalculateAndSaveOverlaysForDocumentKeys(new Iu(t,ot.ce),l).next()}))}))}}function f_(n){n.createObjectStore(ys,{keyPath:EA}).createIndex(ph,TA,{unique:!0}),n.createObjectStore(gs,{keyPath:"targetId"}).createIndex(Ig,IA,{unique:!0}),n.createObjectStore(yr)}const En="IndexedDbPersistence",Gl=18e5,$l=5e3,jl="Failed to obtain exclusive access to the persistence layer. To allow shared access, multi-tab synchronization has to be enabled in all tabs. If you are using `experimentalForceOwningTab:true`, make sure that only one tab has persistence enabled at any given time.",Uy="main";class Vh{constructor(e,t,r,s,i,o,a,l,u,h,f=18){if(this.allowTabSynchronization=e,this.persistenceKey=t,this.clientId=r,this.Mi=i,this.window=o,this.document=a,this.xi=u,this.Oi=h,this.Ni=f,this.ci=null,this.li=!1,this.isPrimary=!1,this.networkEnabled=!0,this.Bi=null,this.inForeground=!1,this.Li=null,this.ki=null,this.qi=Number.NEGATIVE_INFINITY,this.Qi=_=>Promise.resolve(),!Vh.v())throw new D(P.UNIMPLEMENTED,"This platform is either missing IndexedDB or is known to have an incomplete implementation. Offline persistence has been disabled.");this.referenceDelegate=new Fb(this,s),this.$i=t+Uy,this.serializer=new by(l),this.Ui=new Ut(this.$i,this.Ni,new Yb(this.serializer)),this.hi=new Sb,this.Pi=new Ob(this.referenceDelegate,this.serializer),this.remoteDocumentCache=Ly(this.serializer),this.Ii=new Rb,this.window&&this.window.localStorage?this.Ki=this.window.localStorage:(this.Ki=null,h===!1&&Ne(En,"LocalStorage is unavailable. As a result, persistence may not work reliably. In particular enablePersistence() could fail immediately after refreshing the page."))}start(){return this.Wi().then((()=>{if(!this.isPrimary&&!this.allowTabSynchronization)throw new D(P.FAILED_PRECONDITION,jl);return this.Gi(),this.zi(),this.ji(),this.runTransaction("getHighestListenSequenceNumber","readonly",(e=>this.Pi.getHighestSequenceNumber(e)))})).then((e=>{this.ci=new ot(e,this.xi)})).then((()=>{this.li=!0})).catch((e=>(this.Ui&&this.Ui.close(),Promise.reject(e))))}Ji(e){return this.Qi=async t=>{if(this.started)return e(t)},e(this.isPrimary)}setDatabaseDeletedListener(e){this.Ui.$((async t=>{t.newVersion===null&&await e()}))}setNetworkEnabled(e){this.networkEnabled!==e&&(this.networkEnabled=e,this.Mi.enqueueAndForget((async()=>{this.started&&await this.Wi()})))}Wi(){return this.runTransaction("updateClientMetadataAndTryBecomePrimary","readwrite",(e=>_a(e).put({clientId:this.clientId,updateTimeMs:Date.now(),networkEnabled:this.networkEnabled,inForeground:this.inForeground}).next((()=>{if(this.isPrimary)return this.Hi(e).next((t=>{t||(this.isPrimary=!1,this.Mi.enqueueRetryable((()=>this.Qi(!1))))}))})).next((()=>this.Yi(e))).next((t=>this.isPrimary&&!t?this.Zi(e).next((()=>!1)):!!t&&this.Xi(e).next((()=>!0)))))).catch((e=>{if(jn(e))return x(En,"Failed to extend owner lease: ",e),this.isPrimary;if(!this.allowTabSynchronization)throw e;return x(En,"Releasing owner lease after error during lease refresh",e),!1})).then((e=>{this.isPrimary!==e&&this.Mi.enqueueRetryable((()=>this.Qi(e))),this.isPrimary=e}))}Hi(e){return vi(e).get(jr).next((t=>b.resolve(this.es(t))))}ts(e){return _a(e).delete(this.clientId)}async ns(){if(this.isPrimary&&!this.rs(this.qi,Gl)){this.qi=Date.now();const e=await this.runTransaction("maybeGarbageCollectMultiClientState","readwrite-primary",(t=>{const r=Fe(t,Is);return r.J().next((s=>{const i=this.ss(s,Gl),o=s.filter((a=>i.indexOf(a)===-1));return b.forEach(o,(a=>r.delete(a.clientId))).next((()=>o))}))})).catch((()=>[]));if(this.Ki)for(const t of e)this.Ki.removeItem(this._s(t.clientId))}}ji(){this.ki=this.Mi.enqueueAfterDelay("client_metadata_refresh",4e3,(()=>this.Wi().then((()=>this.ns())).then((()=>this.ji()))))}es(e){return!!e&&e.ownerId===this.clientId}Yi(e){return this.Oi?b.resolve(!0):vi(e).get(jr).next((t=>{if(t!==null&&this.rs(t.leaseTimestampMs,$l)&&!this.us(t.ownerId)){if(this.es(t)&&this.networkEnabled)return!0;if(!this.es(t)){if(!t.allowTabSynchronization)throw new D(P.FAILED_PRECONDITION,jl);return!1}}return!(!this.networkEnabled||!this.inForeground)||_a(e).J().next((r=>this.ss(r,$l).find((s=>{if(this.clientId!==s.clientId){const i=!this.networkEnabled&&s.networkEnabled,o=!this.inForeground&&s.inForeground,a=this.networkEnabled===s.networkEnabled;if(i||o&&a)return!0}return!1}))===void 0))})).next((t=>(this.isPrimary!==t&&x(En,`Client ${t?"is":"is not"} eligible for a primary lease.`),t)))}async shutdown(){this.li=!1,this.cs(),this.ki&&(this.ki.cancel(),this.ki=null),this.ls(),this.hs(),await this.Ui.runTransaction("shutdown","readwrite",[So,Is],(e=>{const t=new Iu(e,ot.ce);return this.Zi(t).next((()=>this.ts(t)))})),this.Ui.close(),this.Ps()}ss(e,t){return e.filter((r=>this.rs(r.updateTimeMs,t)&&!this.us(r.clientId)))}Ts(){return this.runTransaction("getActiveClients","readonly",(e=>_a(e).J().next((t=>this.ss(t,Gl).map((r=>r.clientId))))))}get started(){return this.li}getGlobalsCache(){return this.hi}getMutationQueue(e,t){return Gc.wt(e,this.serializer,t,this.referenceDelegate)}getTargetCache(){return this.Pi}getRemoteDocumentCache(){return this.remoteDocumentCache}getIndexManager(e){return new Vb(e,this.serializer.yt.databaseId)}getDocumentOverlayCache(e){return zc.wt(this.serializer,e)}getBundleCache(){return this.Ii}runTransaction(e,t,r){x(En,"Starting transaction:",e);const s=t==="readonly"?"readonly":"readwrite",i=(function(l){return l===18?FA:l===17?Rg:l===16?LA:l===15?gh:l===14?bg:l===13?Ag:l===12?MA:l===11?vg:void q(60245)})(this.Ni);let o;return this.Ui.runTransaction(e,s,i,(a=>(o=new Iu(a,this.ci?this.ci.next():ot.ce),t==="readwrite-primary"?this.Hi(o).next((l=>!!l||this.Yi(o))).next((l=>{if(!l)throw Ne(`Failed to obtain primary lease for action '${e}'.`),this.isPrimary=!1,this.Mi.enqueueRetryable((()=>this.Qi(!1))),new D(P.FAILED_PRECONDITION,fg);return r(o)})).next((l=>this.Xi(o).next((()=>l)))):this.Is(o).next((()=>r(o)))))).then((a=>(o.raiseOnCommittedEvent(),a)))}Is(e){return vi(e).get(jr).next((t=>{if(t!==null&&this.rs(t.leaseTimestampMs,$l)&&!this.us(t.ownerId)&&!this.es(t)&&!(this.Oi||this.allowTabSynchronization&&t.allowTabSynchronization))throw new D(P.FAILED_PRECONDITION,jl)}))}Xi(e){const t={ownerId:this.clientId,allowTabSynchronization:this.allowTabSynchronization,leaseTimestampMs:Date.now()};return vi(e).put(jr,t)}static v(){return Ut.v()}Zi(e){const t=vi(e);return t.get(jr).next((r=>this.es(r)?(x(En,"Releasing primary lease."),t.delete(jr)):b.resolve()))}rs(e,t){const r=Date.now();return!(e<r-t)&&(!(e>r)||(Ne(`Detected an update time that is in the future: ${e} > ${r}`),!1))}Gi(){this.document!==null&&typeof this.document.addEventListener=="function"&&(this.Li=()=>{this.Mi.enqueueAndForget((()=>(this.inForeground=this.document.visibilityState==="visible",this.Wi())))},this.document.addEventListener("visibilitychange",this.Li),this.inForeground=this.document.visibilityState==="visible")}ls(){this.Li&&(this.document.removeEventListener("visibilitychange",this.Li),this.Li=null)}zi(){var e;typeof((e=this.window)==null?void 0:e.addEventListener)=="function"&&(this.Bi=()=>{this.cs();const t=/(?:Version|Mobile)\/1[456]/;jm()&&(navigator.appVersion.match(t)||navigator.userAgent.match(t))&&this.Mi.enterRestrictedMode(!0),this.Mi.enqueueAndForget((()=>this.shutdown()))},this.window.addEventListener("pagehide",this.Bi))}hs(){this.Bi&&(this.window.removeEventListener("pagehide",this.Bi),this.Bi=null)}us(e){var t;try{const r=((t=this.Ki)==null?void 0:t.getItem(this._s(e)))!==null;return x(En,`Client '${e}' ${r?"is":"is not"} zombied in LocalStorage`),r}catch(r){return Ne(En,"Failed to get zombied client id.",r),!1}}cs(){if(this.Ki)try{this.Ki.setItem(this._s(this.clientId),String(Date.now()))}catch(e){Ne("Failed to set zombie client id.",e)}}Ps(){if(this.Ki)try{this.Ki.removeItem(this._s(this.clientId))}catch{}}_s(e){return`firestore_zombie_${this.persistenceKey}_${e}`}}function vi(n){return Fe(n,So)}function _a(n){return Fe(n,Is)}function Oh(n,e){let t=n.projectId;return n.isDefaultDatabase||(t+="."+n.database),"firestore/"+e+"/"+t+"/"}/**
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
 */class Mh{constructor(e,t,r,s){this.targetId=e,this.fromCache=t,this.Es=r,this.ds=s}static As(e,t){let r=K(),s=K();for(const i of t.docChanges)switch(i.type){case 0:r=r.add(i.doc.key);break;case 1:s=s.add(i.doc.key)}return new Mh(e,t.fromCache,r,s)}}/**
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
 */class Xb{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}/**
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
 */class By{constructor(){this.Rs=!1,this.Vs=!1,this.fs=100,this.gs=(function(){return jm()?8:_g(_t())>0?6:4})()}initialize(e,t){this.ps=e,this.indexManager=t,this.Rs=!0}getDocumentsMatchingQuery(e,t,r,s){const i={result:null};return this.ys(e,t).next((o=>{i.result=o})).next((()=>{if(!i.result)return this.ws(e,t,s,r).next((o=>{i.result=o}))})).next((()=>{if(i.result)return;const o=new Xb;return this.Ss(e,t,o).next((a=>{if(i.result=a,this.Vs)return this.bs(e,t,o,a.size)}))})).next((()=>i.result))}bs(e,t,r,s){return r.documentReadCount<this.fs?(Zr()<=re.DEBUG&&x("QueryEngine","SDK will not create cache indexes for query:",es(t),"since it only creates cache indexes for collection contains","more than or equal to",this.fs,"documents"),b.resolve()):(Zr()<=re.DEBUG&&x("QueryEngine","Query:",es(t),"scans",r.documentReadCount,"local documents and returns",s,"documents as results."),r.documentReadCount>this.gs*s?(Zr()<=re.DEBUG&&x("QueryEngine","The SDK decides to create cache indexes for query:",es(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,Xe(t))):b.resolve())}ys(e,t){if(Lp(t))return b.resolve(null);let r=Xe(t);return this.indexManager.getIndexType(e,r).next((s=>s===0?null:(t.limit!==null&&s===1&&(t=Wa(t,null,"F"),r=Xe(t)),this.indexManager.getDocumentsMatchingTarget(e,r).next((i=>{const o=K(...i);return this.ps.getDocuments(e,o).next((a=>this.indexManager.getMinOffset(e,r).next((l=>{const u=this.Ds(t,a);return this.Cs(t,u,o,l.readTime)?this.ys(e,Wa(t,null,"F")):this.vs(e,u,t,l)}))))})))))}ws(e,t,r,s){return Lp(t)||s.isEqual(G.min())?b.resolve(null):this.ps.getDocuments(e,r).next((i=>{const o=this.Ds(t,i);return this.Cs(t,o,r,s)?b.resolve(null):(Zr()<=re.DEBUG&&x("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),es(t)),this.vs(e,o,t,hg(s,fs)).next((a=>a)))}))}Ds(e,t){let r=new he(Yg(e));return t.forEach(((s,i)=>{No(e,i)&&(r=r.add(i))})),r}Cs(e,t,r,s){if(e.limit===null)return!1;if(r.size!==t.size)return!0;const i=e.limitType==="F"?t.last():t.first();return!!i&&(i.hasPendingWrites||i.version.compareTo(s)>0)}Ss(e,t,r){return Zr()<=re.DEBUG&&x("QueryEngine","Using full collection scan to execute query:",es(t)),this.ps.getDocumentsMatchingQuery(e,t,Et.min(),r)}vs(e,t,r,s){return this.ps.getDocumentsMatchingQuery(e,r,s).next((i=>(t.forEach((o=>{i=i.insert(o.key,o)})),i)))}}/**
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
 */const Lh="LocalStore",Jb=3e8;class Zb{constructor(e,t,r,s){this.persistence=e,this.Fs=t,this.serializer=s,this.Ms=new be(j),this.xs=new cn((i=>wr(i)),Co),this.Os=new Map,this.Ns=e.getRemoteDocumentCache(),this.Pi=e.getTargetCache(),this.Ii=e.getBundleCache(),this.Bs(r)}Bs(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new Fy(this.Ns,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Ns.setIndexManager(this.indexManager),this.Fs.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",(t=>e.collect(t,this.Ms)))}}function qy(n,e,t,r){return new Zb(n,e,t,r)}async function zy(n,e){const t=F(n);return await t.persistence.runTransaction("Handle user change","readonly",(r=>{let s;return t.mutationQueue.getAllMutationBatches(r).next((i=>(s=i,t.Bs(e),t.mutationQueue.getAllMutationBatches(r)))).next((i=>{const o=[],a=[];let l=K();for(const u of s){o.push(u.batchId);for(const h of u.mutations)l=l.add(h.key)}for(const u of i){a.push(u.batchId);for(const h of u.mutations)l=l.add(h.key)}return t.localDocuments.getDocuments(r,l).next((u=>({Ls:u,removedBatchIds:o,addedBatchIds:a})))}))}))}function eR(n,e){const t=F(n);return t.persistence.runTransaction("Acknowledge batch","readwrite-primary",(r=>{const s=e.batch.keys(),i=t.Ns.newChangeBuffer({trackRemovals:!0});return(function(a,l,u,h){const f=u.batch,_=f.keys();let g=b.resolve();return _.forEach((w=>{g=g.next((()=>h.getEntry(l,w))).next((R=>{const C=u.docVersions.get(w);z(C!==null,48541),R.version.compareTo(C)<0&&(f.applyToRemoteDocument(R,u),R.isValidDocument()&&(R.setReadTime(u.commitVersion),h.addEntry(R)))}))})),g.next((()=>a.mutationQueue.removeMutationBatch(l,f)))})(t,r,e,i).next((()=>i.apply(r))).next((()=>t.mutationQueue.performConsistencyCheck(r))).next((()=>t.documentOverlayCache.removeOverlaysForBatchId(r,s,e.batch.batchId))).next((()=>t.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(r,(function(a){let l=K();for(let u=0;u<a.mutationResults.length;++u)a.mutationResults[u].transformResults.length>0&&(l=l.add(a.batch.mutations[u].key));return l})(e)))).next((()=>t.localDocuments.getDocuments(r,s)))}))}function Gy(n){const e=F(n);return e.persistence.runTransaction("Get last remote snapshot version","readonly",(t=>e.Pi.getLastRemoteSnapshotVersion(t)))}function tR(n,e){const t=F(n),r=e.snapshotVersion;let s=t.Ms;return t.persistence.runTransaction("Apply remote event","readwrite-primary",(i=>{const o=t.Ns.newChangeBuffer({trackRemovals:!0});s=t.Ms;const a=[];e.targetChanges.forEach(((h,f)=>{const _=s.get(f);if(!_)return;a.push(t.Pi.removeMatchingKeys(i,h.removedDocuments,f).next((()=>t.Pi.addMatchingKeys(i,h.addedDocuments,f))));let g=_.withSequenceNumber(i.currentSequenceNumber);e.targetMismatches.get(f)!==null?g=g.withResumeToken(Re.EMPTY_BYTE_STRING,G.min()).withLastLimboFreeSnapshotVersion(G.min()):h.resumeToken.approximateByteSize()>0&&(g=g.withResumeToken(h.resumeToken,r)),s=s.insert(f,g),(function(R,C,V){return R.resumeToken.approximateByteSize()===0||C.snapshotVersion.toMicroseconds()-R.snapshotVersion.toMicroseconds()>=Jb?!0:V.addedDocuments.size+V.modifiedDocuments.size+V.removedDocuments.size>0})(_,g,h)&&a.push(t.Pi.updateTargetData(i,g))}));let l=ct(),u=K();if(e.documentUpdates.forEach((h=>{e.resolvedLimboDocuments.has(h)&&a.push(t.persistence.referenceDelegate.updateLimboDocument(i,h))})),a.push($y(i,o,e.documentUpdates).next((h=>{l=h.ks,u=h.qs}))),!r.isEqual(G.min())){const h=t.Pi.getLastRemoteSnapshotVersion(i).next((f=>t.Pi.setTargetsMetadata(i,i.currentSequenceNumber,r)));a.push(h)}return b.waitFor(a).next((()=>o.apply(i))).next((()=>t.localDocuments.getLocalViewOfDocuments(i,l,u))).next((()=>l))})).then((i=>(t.Ms=s,i)))}function $y(n,e,t){let r=K(),s=K();return t.forEach((i=>r=r.add(i))),e.getEntries(n,r).next((i=>{let o=ct();return t.forEach(((a,l)=>{const u=i.get(a);l.isFoundDocument()!==u.isFoundDocument()&&(s=s.add(a)),l.isNoDocument()&&l.version.isEqual(G.min())?(e.removeEntry(a,l.readTime),o=o.insert(a,l)):!u.isValidDocument()||l.version.compareTo(u.version)>0||l.version.compareTo(u.version)===0&&u.hasPendingWrites?(e.addEntry(l),o=o.insert(a,l)):x(Lh,"Ignoring outdated watch update for ",a,". Current version:",u.version," Watch version:",l.version)})),{ks:o,qs:s}}))}function nR(n,e){const t=F(n);return t.persistence.runTransaction("Get next mutation batch","readonly",(r=>(e===void 0&&(e=Pn),t.mutationQueue.getNextMutationBatchAfterBatchId(r,e))))}function Rs(n,e){const t=F(n);return t.persistence.runTransaction("Allocate target","readwrite",(r=>{let s;return t.Pi.getTargetData(r,e).next((i=>i?(s=i,b.resolve(s)):t.Pi.allocateTargetId(r).next((o=>(s=new Qt(e,o,"TargetPurposeListen",r.currentSequenceNumber),t.Pi.addTargetData(r,s).next((()=>s)))))))})).then((r=>{const s=t.Ms.get(r.targetId);return(s===null||r.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(t.Ms=t.Ms.insert(r.targetId,r),t.xs.set(e,r.targetId)),r}))}async function Ss(n,e,t){const r=F(n),s=r.Ms.get(e),i=t?"readwrite":"readwrite-primary";try{t||await r.persistence.runTransaction("Release target",i,(o=>r.persistence.referenceDelegate.removeTarget(o,s)))}catch(o){if(!jn(o))throw o;x(Lh,`Failed to update sequence numbers for target ${e}: ${o}`)}r.Ms=r.Ms.remove(e),r.xs.delete(s.target)}function Xa(n,e,t){const r=F(n);let s=G.min(),i=K();return r.persistence.runTransaction("Execute query","readwrite",(o=>(function(l,u,h){const f=F(l),_=f.xs.get(h);return _!==void 0?b.resolve(f.Ms.get(_)):f.Pi.getTargetData(u,h)})(r,o,Xe(e)).next((a=>{if(a)return s=a.lastLimboFreeSnapshotVersion,r.Pi.getMatchingKeysForTargetId(o,a.targetId).next((l=>{i=l}))})).next((()=>r.Fs.getDocumentsMatchingQuery(o,e,t?s:G.min(),t?i:K()))).next((a=>(Ky(r,Qg(e),a),{documents:a,Qs:i})))))}function jy(n,e){const t=F(n),r=F(t.Pi),s=t.Ms.get(e);return s?Promise.resolve(s.target):t.persistence.runTransaction("Get target data","readonly",(i=>r.At(i,e).next((o=>o?o.target:null))))}function Wy(n,e){const t=F(n),r=t.Os.get(e)||G.min();return t.persistence.runTransaction("Get new document changes","readonly",(s=>t.Ns.getAllFromCollectionGroup(s,e,hg(r,fs),Number.MAX_SAFE_INTEGER))).then((s=>(Ky(t,e,s),s)))}function Ky(n,e,t){let r=n.Os.get(e)||G.min();t.forEach(((s,i)=>{i.readTime.compareTo(r)>0&&(r=i.readTime)})),n.Os.set(e,r)}async function rR(n,e,t,r){const s=F(n);let i=K(),o=ct();for(const u of t){const h=e.$s(u.metadata.name);u.document&&(i=i.add(h));const f=e.Us(u);f.setReadTime(e.Ks(u.metadata.readTime)),o=o.insert(h,f)}const a=s.Ns.newChangeBuffer({trackRemovals:!0}),l=await Rs(s,(function(h){return Xe(zs(Z.fromString(`__bundle__/docs/${h}`)))})(r));return s.persistence.runTransaction("Apply bundle documents","readwrite",(u=>$y(u,a,o).next((h=>(a.apply(u),h))).next((h=>s.Pi.removeMatchingKeysForTargetId(u,l.targetId).next((()=>s.Pi.addMatchingKeys(u,i,l.targetId))).next((()=>s.localDocuments.getLocalViewOfDocuments(u,h.ks,h.qs))).next((()=>h.ks))))))}async function sR(n,e,t=K()){const r=await Rs(n,Xe(qc(e.bundledQuery))),s=F(n);return s.persistence.runTransaction("Save named query","readwrite",(i=>{const o=De(e.readTime);if(r.snapshotVersion.compareTo(o)>=0)return s.Ii.saveNamedQuery(i,e);const a=r.withResumeToken(Re.EMPTY_BYTE_STRING,o);return s.Ms=s.Ms.insert(a.targetId,a),s.Pi.updateTargetData(i,a).next((()=>s.Pi.removeMatchingKeysForTargetId(i,r.targetId))).next((()=>s.Pi.addMatchingKeys(i,t,r.targetId))).next((()=>s.Ii.saveNamedQuery(i,e)))}))}/**
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
 */const Hy="firestore_clients";function p_(n,e){return`${Hy}_${n}_${e}`}const Qy="firestore_mutations";function __(n,e,t){let r=`${Qy}_${n}_${t}`;return e.isAuthenticated()&&(r+=`_${e.uid}`),r}const Yy="firestore_targets";function Wl(n,e){return`${Yy}_${n}_${e}`}/**
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
 */const xt="SharedClientState";class Ja{constructor(e,t,r,s){this.user=e,this.batchId=t,this.state=r,this.error=s}static Ws(e,t,r){const s=JSON.parse(r);let i,o=typeof s=="object"&&["pending","acknowledged","rejected"].indexOf(s.state)!==-1&&(s.error===void 0||typeof s.error=="object");return o&&s.error&&(o=typeof s.error.message=="string"&&typeof s.error.code=="string",o&&(i=new D(s.error.code,s.error.message))),o?new Ja(e,t,s.state,i):(Ne(xt,`Failed to parse mutation state for ID '${t}': ${r}`),null)}Gs(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class Gi{constructor(e,t,r){this.targetId=e,this.state=t,this.error=r}static Ws(e,t){const r=JSON.parse(t);let s,i=typeof r=="object"&&["not-current","current","rejected"].indexOf(r.state)!==-1&&(r.error===void 0||typeof r.error=="object");return i&&r.error&&(i=typeof r.error.message=="string"&&typeof r.error.code=="string",i&&(s=new D(r.error.code,r.error.message))),i?new Gi(e,r.state,s):(Ne(xt,`Failed to parse target state for ID '${e}': ${t}`),null)}Gs(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class Za{constructor(e,t){this.clientId=e,this.activeTargetIds=t}static Ws(e,t){const r=JSON.parse(t);let s=typeof r=="object"&&r.activeTargetIds instanceof Array,i=wh();for(let o=0;s&&o<r.activeTargetIds.length;++o)s=mg(r.activeTargetIds[o]),i=i.add(r.activeTargetIds[o]);return s?new Za(e,i):(Ne(xt,`Failed to parse client data for instance '${e}': ${t}`),null)}}class Fh{constructor(e,t){this.clientId=e,this.onlineState=t}static Ws(e){const t=JSON.parse(e);return typeof t=="object"&&["Unknown","Online","Offline"].indexOf(t.onlineState)!==-1&&typeof t.clientId=="string"?new Fh(t.clientId,t.onlineState):(Ne(xt,`Failed to parse online state: ${e}`),null)}}class Vu{constructor(){this.activeTargetIds=wh()}zs(e){this.activeTargetIds=this.activeTargetIds.add(e)}js(e){this.activeTargetIds=this.activeTargetIds.delete(e)}Gs(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class Kl{constructor(e,t,r,s,i){this.window=e,this.Mi=t,this.persistenceKey=r,this.Js=s,this.syncEngine=null,this.onlineStateHandler=null,this.sequenceNumberHandler=null,this.Hs=this.Ys.bind(this),this.Zs=new be(j),this.started=!1,this.Xs=[];const o=r.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");this.storage=this.window.localStorage,this.currentUser=i,this.eo=p_(this.persistenceKey,this.Js),this.no=(function(l){return`firestore_sequence_number_${l}`})(this.persistenceKey),this.Zs=this.Zs.insert(this.Js,new Vu),this.ro=new RegExp(`^${Hy}_${o}_([^_]*)$`),this.io=new RegExp(`^${Qy}_${o}_(\\d+)(?:_(.*))?$`),this.so=new RegExp(`^${Yy}_${o}_(\\d+)$`),this.oo=(function(l){return`firestore_online_state_${l}`})(this.persistenceKey),this._o=(function(l){return`firestore_bundle_loaded_v2_${l}`})(this.persistenceKey),this.window.addEventListener("storage",this.Hs)}static v(e){return!(!e||!e.localStorage)}async start(){const e=await this.syncEngine.Ts();for(const r of e){if(r===this.Js)continue;const s=this.getItem(p_(this.persistenceKey,r));if(s){const i=Za.Ws(r,s);i&&(this.Zs=this.Zs.insert(i.clientId,i))}}this.ao();const t=this.storage.getItem(this.oo);if(t){const r=this.uo(t);r&&this.co(r)}for(const r of this.Xs)this.Ys(r);this.Xs=[],this.window.addEventListener("pagehide",(()=>this.shutdown())),this.started=!0}writeSequenceNumber(e){this.setItem(this.no,JSON.stringify(e))}getAllActiveQueryTargets(){return this.lo(this.Zs)}isActiveQueryTarget(e){let t=!1;return this.Zs.forEach(((r,s)=>{s.activeTargetIds.has(e)&&(t=!0)})),t}addPendingMutation(e){this.ho(e,"pending")}updateMutationState(e,t,r){this.ho(e,t,r),this.Po(e)}addLocalQueryTarget(e,t=!0){let r="not-current";if(this.isActiveQueryTarget(e)){const s=this.storage.getItem(Wl(this.persistenceKey,e));if(s){const i=Gi.Ws(e,s);i&&(r=i.state)}}return t&&this.To.zs(e),this.ao(),r}removeLocalQueryTarget(e){this.To.js(e),this.ao()}isLocalQueryTarget(e){return this.To.activeTargetIds.has(e)}clearQueryState(e){this.removeItem(Wl(this.persistenceKey,e))}updateQueryState(e,t,r){this.Io(e,t,r)}handleUserChange(e,t,r){t.forEach((s=>{this.Po(s)})),this.currentUser=e,r.forEach((s=>{this.addPendingMutation(s)}))}setOnlineState(e){this.Eo(e)}notifyBundleLoaded(e){this.Ao(e)}shutdown(){this.started&&(this.window.removeEventListener("storage",this.Hs),this.removeItem(this.eo),this.started=!1)}getItem(e){const t=this.storage.getItem(e);return x(xt,"READ",e,t),t}setItem(e,t){x(xt,"SET",e,t),this.storage.setItem(e,t)}removeItem(e){x(xt,"REMOVE",e),this.storage.removeItem(e)}Ys(e){const t=e;if(t.storageArea===this.storage){if(x(xt,"EVENT",t.key,t.newValue),t.key===this.eo)return void Ne("Received WebStorage notification for local change. Another client might have garbage-collected our state");this.Mi.enqueueRetryable((async()=>{if(this.started){if(t.key!==null){if(this.ro.test(t.key)){if(t.newValue==null){const r=this.Ro(t.key);return this.Vo(r,null)}{const r=this.mo(t.key,t.newValue);if(r)return this.Vo(r.clientId,r)}}else if(this.io.test(t.key)){if(t.newValue!==null){const r=this.fo(t.key,t.newValue);if(r)return this.po(r)}}else if(this.so.test(t.key)){if(t.newValue!==null){const r=this.yo(t.key,t.newValue);if(r)return this.wo(r)}}else if(t.key===this.oo){if(t.newValue!==null){const r=this.uo(t.newValue);if(r)return this.co(r)}}else if(t.key===this.no){const r=(function(i){let o=ot.ce;if(i!=null)try{const a=JSON.parse(i);z(typeof a=="number",30636,{So:i}),o=a}catch(a){Ne(xt,"Failed to read sequence number from WebStorage",a)}return o})(t.newValue);r!==ot.ce&&this.sequenceNumberHandler(r)}else if(t.key===this._o){const r=this.bo(t.newValue);await Promise.all(r.map((s=>this.syncEngine.Do(s))))}}}else this.Xs.push(t)}))}}get To(){return this.Zs.get(this.Js)}ao(){this.setItem(this.eo,this.To.Gs())}ho(e,t,r){const s=new Ja(this.currentUser,e,t,r),i=__(this.persistenceKey,this.currentUser,e);this.setItem(i,s.Gs())}Po(e){const t=__(this.persistenceKey,this.currentUser,e);this.removeItem(t)}Eo(e){const t={clientId:this.Js,onlineState:e};this.storage.setItem(this.oo,JSON.stringify(t))}Io(e,t,r){const s=Wl(this.persistenceKey,e),i=new Gi(e,t,r);this.setItem(s,i.Gs())}Ao(e){const t=JSON.stringify(Array.from(e));this.setItem(this._o,t)}Ro(e){const t=this.ro.exec(e);return t?t[1]:null}mo(e,t){const r=this.Ro(e);return Za.Ws(r,t)}fo(e,t){const r=this.io.exec(e),s=Number(r[1]),i=r[2]!==void 0?r[2]:null;return Ja.Ws(new ze(i),s,t)}yo(e,t){const r=this.so.exec(e),s=Number(r[1]);return Gi.Ws(s,t)}uo(e){return Fh.Ws(e)}bo(e){return JSON.parse(e)}async po(e){if(e.user.uid===this.currentUser.uid)return this.syncEngine.Co(e.batchId,e.state,e.error);x(xt,`Ignoring mutation for non-active user ${e.user.uid}`)}wo(e){return this.syncEngine.vo(e.targetId,e.state,e.error)}Vo(e,t){const r=t?this.Zs.insert(e,t):this.Zs.remove(e),s=this.lo(this.Zs),i=this.lo(r),o=[],a=[];return i.forEach((l=>{s.has(l)||o.push(l)})),s.forEach((l=>{i.has(l)||a.push(l)})),this.syncEngine.Fo(o,a).then((()=>{this.Zs=r}))}co(e){this.Zs.get(e.clientId)&&this.onlineStateHandler(e.onlineState)}lo(e){let t=wh();return e.forEach(((r,s)=>{t=t.unionWith(s.activeTargetIds)})),t}}class Xy{constructor(){this.Mo=new Vu,this.xo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,r){}addLocalQueryTarget(e,t=!0){return t&&this.Mo.zs(e),this.xo[e]||"not-current"}updateQueryState(e,t,r){this.xo[e]=t}removeLocalQueryTarget(e){this.Mo.js(e)}isLocalQueryTarget(e){return this.Mo.activeTargetIds.has(e)}clearQueryState(e){delete this.xo[e]}getAllActiveQueryTargets(){return this.Mo.activeTargetIds}isActiveQueryTarget(e){return this.Mo.activeTargetIds.has(e)}start(){return this.Mo=new Vu,Promise.resolve()}handleUserChange(e,t,r){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}/**
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
 */class iR{Oo(e){}shutdown(){}}/**
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
 */const m_="ConnectivityMonitor";class g_{constructor(){this.No=()=>this.Bo(),this.Lo=()=>this.ko(),this.qo=[],this.Qo()}Oo(e){this.qo.push(e)}shutdown(){window.removeEventListener("online",this.No),window.removeEventListener("offline",this.Lo)}Qo(){window.addEventListener("online",this.No),window.addEventListener("offline",this.Lo)}Bo(){x(m_,"Network connectivity changed: AVAILABLE");for(const e of this.qo)e(0)}ko(){x(m_,"Network connectivity changed: UNAVAILABLE");for(const e of this.qo)e(1)}static v(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
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
 */let ma=null;function Ou(){return ma===null?ma=(function(){return 268435456+Math.round(2147483648*Math.random())})():ma++,"0x"+ma.toString(16)}/**
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
 */const Hl="RestConnection",oR={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};class aR{get $o(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const t=e.ssl?"https":"http",r=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.Uo=t+"://"+e.host,this.Ko=`projects/${r}/databases/${s}`,this.Wo=this.databaseId.database===oo?`project_id=${r}`:`project_id=${r}&database_id=${s}`}Go(e,t,r,s,i){const o=Ou(),a=this.zo(e,t.toUriEncodedString());x(Hl,`Sending RPC '${e}' ${o}:`,a,r);const l={"google-cloud-resource-prefix":this.Ko,"x-goog-request-params":this.Wo};this.jo(l,s,i);const{host:u}=new URL(a),h=vt(u);return this.Jo(e,a,l,r,h).then((f=>(x(Hl,`Received RPC '${e}' ${o}: `,f),f)),(f=>{throw It(Hl,`RPC '${e}' ${o} failed with error: `,f,"url: ",a,"request:",r),f}))}Ho(e,t,r,s,i,o){return this.Go(e,t,r,s,i)}jo(e,t,r){e["X-Goog-Api-Client"]=(function(){return"gl-js/ fire/"+qs})(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach(((s,i)=>e[i]=s)),r&&r.headers.forEach(((s,i)=>e[i]=s))}zo(e,t){const r=oR[e];return`${this.Uo}/v1/${t}:${r}`}terminate(){}}/**
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
 */class cR{constructor(e){this.Yo=e.Yo,this.Zo=e.Zo}Xo(e){this.e_=e}t_(e){this.n_=e}r_(e){this.i_=e}onMessage(e){this.s_=e}close(){this.Zo()}send(e){this.Yo(e)}o_(){this.e_()}__(){this.n_()}a_(e){this.i_(e)}u_(e){this.s_(e)}}/**
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
 */const He="WebChannelConnection";class lR extends aR{constructor(e){super(e),this.c_=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}Jo(e,t,r,s,i){const o=Ou();return new Promise(((a,l)=>{const u=new Zm;u.setWithCredentials(!0),u.listenOnce(eg.COMPLETE,(()=>{try{switch(u.getLastErrorCode()){case va.NO_ERROR:const f=u.getResponseJson();x(He,`XHR for RPC '${e}' ${o} received:`,JSON.stringify(f)),a(f);break;case va.TIMEOUT:x(He,`RPC '${e}' ${o} timed out`),l(new D(P.DEADLINE_EXCEEDED,"Request time out"));break;case va.HTTP_ERROR:const _=u.getStatus();if(x(He,`RPC '${e}' ${o} failed with status:`,_,"response text:",u.getResponseText()),_>0){let g=u.getResponseJson();Array.isArray(g)&&(g=g[0]);const w=g==null?void 0:g.error;if(w&&w.status&&w.message){const R=(function(V){const B=V.toLowerCase().replace(/_/g,"-");return Object.values(P).indexOf(B)>=0?B:P.UNKNOWN})(w.status);l(new D(R,w.message))}else l(new D(P.UNKNOWN,"Server responded with status "+u.getStatus()))}else l(new D(P.UNAVAILABLE,"Connection failed."));break;default:q(9055,{l_:e,streamId:o,h_:u.getLastErrorCode(),P_:u.getLastError()})}}finally{x(He,`RPC '${e}' ${o} completed.`)}}));const h=JSON.stringify(s);x(He,`RPC '${e}' ${o} sending request:`,s),u.send(t,"POST",h,r,15)}))}T_(e,t,r){const s=Ou(),i=[this.Uo,"/","google.firestore.v1.Firestore","/",e,"/channel"],o=rg(),a=ng(),l={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},u=this.longPollingOptions.timeoutSeconds;u!==void 0&&(l.longPollingTimeout=Math.round(1e3*u)),this.useFetchStreams&&(l.useFetchStreams=!0),this.jo(l.initMessageHeaders,t,r),l.encodeInitMessageHeaders=!0;const h=i.join("");x(He,`Creating RPC '${e}' stream ${s}: ${h}`,l);const f=o.createWebChannel(h,l);this.I_(f);let _=!1,g=!1;const w=new cR({Yo:C=>{g?x(He,`Not sending because RPC '${e}' stream ${s} is closed:`,C):(_||(x(He,`Opening RPC '${e}' stream ${s} transport.`),f.open(),_=!0),x(He,`RPC '${e}' stream ${s} sending:`,C),f.send(C))},Zo:()=>f.close()}),R=(C,V,B)=>{C.listen(V,(L=>{try{B(L)}catch($){setTimeout((()=>{throw $}),0)}}))};return R(f,Pi.EventType.OPEN,(()=>{g||(x(He,`RPC '${e}' stream ${s} transport opened.`),w.o_())})),R(f,Pi.EventType.CLOSE,(()=>{g||(g=!0,x(He,`RPC '${e}' stream ${s} transport closed`),w.a_(),this.E_(f))})),R(f,Pi.EventType.ERROR,(C=>{g||(g=!0,It(He,`RPC '${e}' stream ${s} transport errored. Name:`,C.name,"Message:",C.message),w.a_(new D(P.UNAVAILABLE,"The operation could not be completed")))})),R(f,Pi.EventType.MESSAGE,(C=>{var V;if(!g){const B=C.data[0];z(!!B,16349);const L=B,$=(L==null?void 0:L.error)||((V=L[0])==null?void 0:V.error);if($){x(He,`RPC '${e}' stream ${s} received error:`,$);const ne=$.status;let H=(function(E){const A=xe[E];if(A!==void 0)return uy(A)})(ne),T=$.message;H===void 0&&(H=P.INTERNAL,T="Unknown error status: "+ne+" with message "+$.message),g=!0,w.a_(new D(H,T)),f.close()}else x(He,`RPC '${e}' stream ${s} received:`,B),w.u_(B)}})),R(a,tg.STAT_EVENT,(C=>{C.stat===hu.PROXY?x(He,`RPC '${e}' stream ${s} detected buffering proxy`):C.stat===hu.NOPROXY&&x(He,`RPC '${e}' stream ${s} detected no buffering proxy`)})),setTimeout((()=>{w.__()}),0),w}terminate(){this.c_.forEach((e=>e.close())),this.c_=[]}I_(e){this.c_.push(e)}E_(e){this.c_=this.c_.filter((t=>t===e))}}/**
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
 */function Jy(){return typeof window<"u"?window:null}function Da(){return typeof document<"u"?document:null}/**
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
 */function Or(n){return new _b(n,!0)}/**
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
 */class Uh{constructor(e,t,r=1e3,s=1.5,i=6e4){this.Mi=e,this.timerId=t,this.d_=r,this.A_=s,this.R_=i,this.V_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.V_=0}g_(){this.V_=this.R_}p_(e){this.cancel();const t=Math.floor(this.V_+this.y_()),r=Math.max(0,Date.now()-this.f_),s=Math.max(0,t-r);s>0&&x("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.V_} ms, delay with jitter: ${t} ms, last attempt: ${r} ms ago)`),this.m_=this.Mi.enqueueAfterDelay(this.timerId,s,(()=>(this.f_=Date.now(),e()))),this.V_*=this.A_,this.V_<this.d_&&(this.V_=this.d_),this.V_>this.R_&&(this.V_=this.R_)}w_(){this.m_!==null&&(this.m_.skipDelay(),this.m_=null)}cancel(){this.m_!==null&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.V_}}/**
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
 */const y_="PersistentStream";class Zy{constructor(e,t,r,s,i,o,a,l){this.Mi=e,this.S_=r,this.b_=s,this.connection=i,this.authCredentialsProvider=o,this.appCheckCredentialsProvider=a,this.listener=l,this.state=0,this.D_=0,this.C_=null,this.v_=null,this.stream=null,this.F_=0,this.M_=new Uh(e,t)}x_(){return this.state===1||this.state===5||this.O_()}O_(){return this.state===2||this.state===3}start(){this.F_=0,this.state!==4?this.auth():this.N_()}async stop(){this.x_()&&await this.close(0)}B_(){this.state=0,this.M_.reset()}L_(){this.O_()&&this.C_===null&&(this.C_=this.Mi.enqueueAfterDelay(this.S_,6e4,(()=>this.k_())))}q_(e){this.Q_(),this.stream.send(e)}async k_(){if(this.O_())return this.close(0)}Q_(){this.C_&&(this.C_.cancel(),this.C_=null)}U_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(e,t){this.Q_(),this.U_(),this.M_.cancel(),this.D_++,e!==4?this.M_.reset():t&&t.code===P.RESOURCE_EXHAUSTED?(Ne(t.toString()),Ne("Using maximum backoff delay to prevent overloading the backend."),this.M_.g_()):t&&t.code===P.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.K_(),this.stream.close(),this.stream=null),this.state=e,await this.listener.r_(t)}K_(){}auth(){this.state=1;const e=this.W_(this.D_),t=this.D_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then((([r,s])=>{this.D_===t&&this.G_(r,s)}),(r=>{e((()=>{const s=new D(P.UNKNOWN,"Fetching auth token failed: "+r.message);return this.z_(s)}))}))}G_(e,t){const r=this.W_(this.D_);this.stream=this.j_(e,t),this.stream.Xo((()=>{r((()=>this.listener.Xo()))})),this.stream.t_((()=>{r((()=>(this.state=2,this.v_=this.Mi.enqueueAfterDelay(this.b_,1e4,(()=>(this.O_()&&(this.state=3),Promise.resolve()))),this.listener.t_())))})),this.stream.r_((s=>{r((()=>this.z_(s)))})),this.stream.onMessage((s=>{r((()=>++this.F_==1?this.J_(s):this.onNext(s)))}))}N_(){this.state=5,this.M_.p_((async()=>{this.state=0,this.start()}))}z_(e){return x(y_,`close with error: ${e}`),this.stream=null,this.close(4,e)}W_(e){return t=>{this.Mi.enqueueAndForget((()=>this.D_===e?t():(x(y_,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve())))}}}class uR extends Zy{constructor(e,t,r,s,i,o){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,r,s,o),this.serializer=i}j_(e,t){return this.connection.T_("Listen",e,t)}J_(e){return this.onNext(e)}onNext(e){this.M_.reset();const t=yb(this.serializer,e),r=(function(i){if(!("targetChange"in i))return G.min();const o=i.targetChange;return o.targetIds&&o.targetIds.length?G.min():o.readTime?De(o.readTime):G.min()})(e);return this.listener.H_(t,r)}Y_(e){const t={};t.database=Pu(this.serializer),t.addTarget=(function(i,o){let a;const l=o.target;if(a=$a(l)?{documents:Iy(i,l)}:{query:Bc(i,l).ft},a.targetId=o.targetId,o.resumeToken.approximateByteSize()>0){a.resumeToken=py(i,o.resumeToken);const u=Su(i,o.expectedCount);u!==null&&(a.expectedCount=u)}else if(o.snapshotVersion.compareTo(G.min())>0){a.readTime=bs(i,o.snapshotVersion.toTimestamp());const u=Su(i,o.expectedCount);u!==null&&(a.expectedCount=u)}return a})(this.serializer,e);const r=Eb(this.serializer,e);r&&(t.labels=r),this.q_(t)}Z_(e){const t={};t.database=Pu(this.serializer),t.removeTarget=e,this.q_(t)}}class hR extends Zy{constructor(e,t,r,s,i,o){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,r,s,o),this.serializer=i}get X_(){return this.F_>0}start(){this.lastStreamToken=void 0,super.start()}K_(){this.X_&&this.ea([])}j_(e,t){return this.connection.T_("Write",e,t)}J_(e){return z(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,z(!e.writeResults||e.writeResults.length===0,55816),this.listener.ta()}onNext(e){z(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this.M_.reset();const t=Ib(e.writeResults,e.commitTime),r=De(e.commitTime);return this.listener.na(r,t)}ra(){const e={};e.database=Pu(this.serializer),this.q_(e)}ea(e){const t={streamToken:this.lastStreamToken,writes:e.map((r=>ho(this.serializer,r)))};this.q_(t)}}/**
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
 */class dR{}class fR extends dR{constructor(e,t,r,s){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=r,this.serializer=s,this.ia=!1}sa(){if(this.ia)throw new D(P.FAILED_PRECONDITION,"The client has already been terminated.")}Go(e,t,r,s){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([i,o])=>this.connection.Go(e,Cu(t,r),s,i,o))).catch((i=>{throw i.name==="FirebaseError"?(i.code===P.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),i):new D(P.UNKNOWN,i.toString())}))}Ho(e,t,r,s,i){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([o,a])=>this.connection.Ho(e,Cu(t,r),s,o,a,i))).catch((o=>{throw o.name==="FirebaseError"?(o.code===P.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new D(P.UNKNOWN,o.toString())}))}terminate(){this.ia=!0,this.connection.terminate()}}class pR{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.oa=0,this._a=null,this.aa=!0}ua(){this.oa===0&&(this.ca("Unknown"),this._a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,(()=>(this._a=null,this.la("Backend didn't respond within 10 seconds."),this.ca("Offline"),Promise.resolve()))))}ha(e){this.state==="Online"?this.ca("Unknown"):(this.oa++,this.oa>=1&&(this.Pa(),this.la(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.ca("Offline")))}set(e){this.Pa(),this.oa=0,e==="Online"&&(this.aa=!1),this.ca(e)}ca(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}la(e){const t=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.aa?(Ne(t),this.aa=!1):x("OnlineStateTracker",t)}Pa(){this._a!==null&&(this._a.cancel(),this._a=null)}}/**
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
 */const Cr="RemoteStore";class _R{constructor(e,t,r,s,i){this.localStore=e,this.datastore=t,this.asyncQueue=r,this.remoteSyncer={},this.Ta=[],this.Ia=new Map,this.Ea=new Set,this.da=[],this.Aa=i,this.Aa.Oo((o=>{r.enqueueAndForget((async()=>{Kn(this)&&(x(Cr,"Restarting streams for network reachability change."),await(async function(l){const u=F(l);u.Ea.add(4),await js(u),u.Ra.set("Unknown"),u.Ea.delete(4),await Vo(u)})(this))}))})),this.Ra=new pR(r,s)}}async function Vo(n){if(Kn(n))for(const e of n.da)await e(!0)}async function js(n){for(const e of n.da)await e(!1)}function jc(n,e){const t=F(n);t.Ia.has(e.targetId)||(t.Ia.set(e.targetId,e),zh(t)?qh(t):Ks(t).O_()&&Bh(t,e))}function Cs(n,e){const t=F(n),r=Ks(t);t.Ia.delete(e),r.O_()&&eI(t,e),t.Ia.size===0&&(r.O_()?r.L_():Kn(t)&&t.Ra.set("Unknown"))}function Bh(n,e){if(n.Va.Ue(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(G.min())>0){const t=n.remoteSyncer.getRemoteKeysForTarget(e.targetId).size;e=e.withExpectedCount(t)}Ks(n).Y_(e)}function eI(n,e){n.Va.Ue(e),Ks(n).Z_(e)}function qh(n){n.Va=new hb({getRemoteKeysForTarget:e=>n.remoteSyncer.getRemoteKeysForTarget(e),At:e=>n.Ia.get(e)||null,ht:()=>n.datastore.serializer.databaseId}),Ks(n).start(),n.Ra.ua()}function zh(n){return Kn(n)&&!Ks(n).x_()&&n.Ia.size>0}function Kn(n){return F(n).Ea.size===0}function tI(n){n.Va=void 0}async function mR(n){n.Ra.set("Online")}async function gR(n){n.Ia.forEach(((e,t)=>{Bh(n,e)}))}async function yR(n,e){tI(n),zh(n)?(n.Ra.ha(e),qh(n)):n.Ra.set("Unknown")}async function IR(n,e,t){if(n.Ra.set("Online"),e instanceof fy&&e.state===2&&e.cause)try{await(async function(s,i){const o=i.cause;for(const a of i.targetIds)s.Ia.has(a)&&(await s.remoteSyncer.rejectListen(a,o),s.Ia.delete(a),s.Va.removeTarget(a))})(n,e)}catch(r){x(Cr,"Failed to remove targets %s: %s ",e.targetIds.join(","),r),await ec(n,r)}else if(e instanceof Na?n.Va.Ze(e):e instanceof dy?n.Va.st(e):n.Va.tt(e),!t.isEqual(G.min()))try{const r=await Gy(n.localStore);t.compareTo(r)>=0&&await(function(i,o){const a=i.Va.Tt(o);return a.targetChanges.forEach(((l,u)=>{if(l.resumeToken.approximateByteSize()>0){const h=i.Ia.get(u);h&&i.Ia.set(u,h.withResumeToken(l.resumeToken,o))}})),a.targetMismatches.forEach(((l,u)=>{const h=i.Ia.get(l);if(!h)return;i.Ia.set(l,h.withResumeToken(Re.EMPTY_BYTE_STRING,h.snapshotVersion)),eI(i,l);const f=new Qt(h.target,l,u,h.sequenceNumber);Bh(i,f)})),i.remoteSyncer.applyRemoteEvent(a)})(n,t)}catch(r){x(Cr,"Failed to raise snapshot:",r),await ec(n,r)}}async function ec(n,e,t){if(!jn(e))throw e;n.Ea.add(1),await js(n),n.Ra.set("Offline"),t||(t=()=>Gy(n.localStore)),n.asyncQueue.enqueueRetryable((async()=>{x(Cr,"Retrying IndexedDB access"),await t(),n.Ea.delete(1),await Vo(n)}))}function nI(n,e){return e().catch((t=>ec(n,t,e)))}async function Ws(n){const e=F(n),t=Fn(e);let r=e.Ta.length>0?e.Ta[e.Ta.length-1].batchId:Pn;for(;ER(e);)try{const s=await nR(e.localStore,r);if(s===null){e.Ta.length===0&&t.L_();break}r=s.batchId,TR(e,s)}catch(s){await ec(e,s)}rI(e)&&sI(e)}function ER(n){return Kn(n)&&n.Ta.length<10}function TR(n,e){n.Ta.push(e);const t=Fn(n);t.O_()&&t.X_&&t.ea(e.mutations)}function rI(n){return Kn(n)&&!Fn(n).x_()&&n.Ta.length>0}function sI(n){Fn(n).start()}async function wR(n){Fn(n).ra()}async function vR(n){const e=Fn(n);for(const t of n.Ta)e.ea(t.mutations)}async function AR(n,e,t){const r=n.Ta.shift(),s=Rh.from(r,e,t);await nI(n,(()=>n.remoteSyncer.applySuccessfulWrite(s))),await Ws(n)}async function bR(n,e){e&&Fn(n).X_&&await(async function(r,s){if((function(o){return ly(o)&&o!==P.ABORTED})(s.code)){const i=r.Ta.shift();Fn(r).B_(),await nI(r,(()=>r.remoteSyncer.rejectFailedWrite(i.batchId,s))),await Ws(r)}})(n,e),rI(n)&&sI(n)}async function I_(n,e){const t=F(n);t.asyncQueue.verifyOperationInProgress(),x(Cr,"RemoteStore received new credentials");const r=Kn(t);t.Ea.add(3),await js(t),r&&t.Ra.set("Unknown"),await t.remoteSyncer.handleCredentialChange(e),t.Ea.delete(3),await Vo(t)}async function Mu(n,e){const t=F(n);e?(t.Ea.delete(2),await Vo(t)):e||(t.Ea.add(2),await js(t),t.Ra.set("Unknown"))}function Ks(n){return n.ma||(n.ma=(function(t,r,s){const i=F(t);return i.sa(),new uR(r,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(n.datastore,n.asyncQueue,{Xo:mR.bind(null,n),t_:gR.bind(null,n),r_:yR.bind(null,n),H_:IR.bind(null,n)}),n.da.push((async e=>{e?(n.ma.B_(),zh(n)?qh(n):n.Ra.set("Unknown")):(await n.ma.stop(),tI(n))}))),n.ma}function Fn(n){return n.fa||(n.fa=(function(t,r,s){const i=F(t);return i.sa(),new hR(r,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(n.datastore,n.asyncQueue,{Xo:()=>Promise.resolve(),t_:wR.bind(null,n),r_:bR.bind(null,n),ta:vR.bind(null,n),na:AR.bind(null,n)}),n.da.push((async e=>{e?(n.fa.B_(),await Ws(n)):(await n.fa.stop(),n.Ta.length>0&&(x(Cr,`Stopping write stream with ${n.Ta.length} pending writes`),n.Ta=[]))}))),n.fa}/**
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
 */class Gh{constructor(e,t,r,s,i){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=r,this.op=s,this.removalCallback=i,this.deferred=new $e,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch((o=>{}))}get promise(){return this.deferred.promise}static createAndSchedule(e,t,r,s,i){const o=Date.now()+r,a=new Gh(e,t,o,s,i);return a.start(r),a}start(e){this.timerHandle=setTimeout((()=>this.handleDelayElapsed()),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new D(P.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget((()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then((e=>this.deferred.resolve(e)))):Promise.resolve()))}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function Hs(n,e){if(Ne("AsyncQueue",`${e}: ${n}`),jn(n))return new D(P.UNAVAILABLE,`${e}: ${n}`);throw n}/**
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
 */class Ir{static emptySet(e){return new Ir(e.comparator)}constructor(e){this.comparator=e?(t,r)=>e(t,r)||M.comparator(t.key,r.key):(t,r)=>M.comparator(t.key,r.key),this.keyedMap=Ni(),this.sortedSet=new be(this.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal(((t,r)=>(e(t),!1)))}add(e){const t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){const t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof Ir)||this.size!==e.size)return!1;const t=this.sortedSet.getIterator(),r=e.sortedSet.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=r.getNext().key;if(!s.isEqual(i))return!1}return!0}toString(){const e=[];return this.forEach((t=>{e.push(t.toString())})),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,t){const r=new Ir;return r.comparator=this.comparator,r.keyedMap=e,r.sortedSet=t,r}}/**
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
 */class E_{constructor(){this.ga=new be(M.comparator)}track(e){const t=e.doc.key,r=this.ga.get(t);r?e.type!==0&&r.type===3?this.ga=this.ga.insert(t,e):e.type===3&&r.type!==1?this.ga=this.ga.insert(t,{type:r.type,doc:e.doc}):e.type===2&&r.type===2?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):e.type===2&&r.type===0?this.ga=this.ga.insert(t,{type:0,doc:e.doc}):e.type===1&&r.type===0?this.ga=this.ga.remove(t):e.type===1&&r.type===2?this.ga=this.ga.insert(t,{type:1,doc:r.doc}):e.type===0&&r.type===1?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):q(63341,{Rt:e,pa:r}):this.ga=this.ga.insert(t,e)}ya(){const e=[];return this.ga.inorderTraversal(((t,r)=>{e.push(r)})),e}}class Pr{constructor(e,t,r,s,i,o,a,l,u){this.query=e,this.docs=t,this.oldDocs=r,this.docChanges=s,this.mutatedKeys=i,this.fromCache=o,this.syncStateChanged=a,this.excludesMetadataChanges=l,this.hasCachedResults=u}static fromInitialDocuments(e,t,r,s,i){const o=[];return t.forEach((a=>{o.push({type:0,doc:a})})),new Pr(e,t,Ir.emptySet(t),o,r,s,!0,!1,i)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&Po(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const t=this.docChanges,r=e.docChanges;if(t.length!==r.length)return!1;for(let s=0;s<t.length;s++)if(t[s].type!==r[s].type||!t[s].doc.isEqual(r[s].doc))return!1;return!0}}/**
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
 */class RR{constructor(){this.wa=void 0,this.Sa=[]}ba(){return this.Sa.some((e=>e.Da()))}}class SR{constructor(){this.queries=T_(),this.onlineState="Unknown",this.Ca=new Set}terminate(){(function(t,r){const s=F(t),i=s.queries;s.queries=T_(),i.forEach(((o,a)=>{for(const l of a.Sa)l.onError(r)}))})(this,new D(P.ABORTED,"Firestore shutting down"))}}function T_(){return new cn((n=>Hg(n)),Po)}async function $h(n,e){const t=F(n);let r=3;const s=e.query;let i=t.queries.get(s);i?!i.ba()&&e.Da()&&(r=2):(i=new RR,r=e.Da()?0:1);try{switch(r){case 0:i.wa=await t.onListen(s,!0);break;case 1:i.wa=await t.onListen(s,!1);break;case 2:await t.onFirstRemoteStoreListen(s)}}catch(o){const a=Hs(o,`Initialization of query '${es(e.query)}' failed`);return void e.onError(a)}t.queries.set(s,i),i.Sa.push(e),e.va(t.onlineState),i.wa&&e.Fa(i.wa)&&Wh(t)}async function jh(n,e){const t=F(n),r=e.query;let s=3;const i=t.queries.get(r);if(i){const o=i.Sa.indexOf(e);o>=0&&(i.Sa.splice(o,1),i.Sa.length===0?s=e.Da()?0:1:!i.ba()&&e.Da()&&(s=2))}switch(s){case 0:return t.queries.delete(r),t.onUnlisten(r,!0);case 1:return t.queries.delete(r),t.onUnlisten(r,!1);case 2:return t.onLastRemoteStoreUnlisten(r);default:return}}function CR(n,e){const t=F(n);let r=!1;for(const s of e){const i=s.query,o=t.queries.get(i);if(o){for(const a of o.Sa)a.Fa(s)&&(r=!0);o.wa=s}}r&&Wh(t)}function PR(n,e,t){const r=F(n),s=r.queries.get(e);if(s)for(const i of s.Sa)i.onError(t);r.queries.delete(e)}function Wh(n){n.Ca.forEach((e=>{e.next()}))}var Lu,w_;(w_=Lu||(Lu={})).Ma="default",w_.Cache="cache";class Kh{constructor(e,t,r){this.query=e,this.xa=t,this.Oa=!1,this.Na=null,this.onlineState="Unknown",this.options=r||{}}Fa(e){if(!this.options.includeMetadataChanges){const r=[];for(const s of e.docChanges)s.type!==3&&r.push(s);e=new Pr(e.query,e.docs,e.oldDocs,r,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.Oa?this.Ba(e)&&(this.xa.next(e),t=!0):this.La(e,this.onlineState)&&(this.ka(e),t=!0),this.Na=e,t}onError(e){this.xa.error(e)}va(e){this.onlineState=e;let t=!1;return this.Na&&!this.Oa&&this.La(this.Na,e)&&(this.ka(this.Na),t=!0),t}La(e,t){if(!e.fromCache||!this.Da())return!0;const r=t!=="Offline";return(!this.options.qa||!r)&&(!e.docs.isEmpty()||e.hasCachedResults||t==="Offline")}Ba(e){if(e.docChanges.length>0)return!0;const t=this.Na&&this.Na.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&this.options.includeMetadataChanges===!0}ka(e){e=Pr.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.Oa=!0,this.xa.next(e)}Da(){return this.options.source!==Lu.Cache}}/**
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
 */class iI{constructor(e,t){this.Qa=e,this.byteLength=t}$a(){return"metadata"in this.Qa}}/**
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
 */class v_{constructor(e){this.serializer=e}$s(e){return Bt(this.serializer,e)}Us(e){return e.metadata.exists?Uc(this.serializer,e.document,!1):ye.newNoDocument(this.$s(e.metadata.name),this.Ks(e.metadata.readTime))}Ks(e){return De(e)}}class Hh{constructor(e,t){this.Ua=e,this.serializer=t,this.Ka=[],this.Wa=[],this.collectionGroups=new Set,this.progress=oI(e)}get queries(){return this.Ka}get documents(){return this.Wa}Ga(e){this.progress.bytesLoaded+=e.byteLength;let t=this.progress.documentsLoaded;if(e.Qa.namedQuery)this.Ka.push(e.Qa.namedQuery);else if(e.Qa.documentMetadata){this.Wa.push({metadata:e.Qa.documentMetadata}),e.Qa.documentMetadata.exists||++t;const r=Z.fromString(e.Qa.documentMetadata.name);this.collectionGroups.add(r.get(r.length-2))}else e.Qa.document&&(this.Wa[this.Wa.length-1].document=e.Qa.document,++t);return t!==this.progress.documentsLoaded?(this.progress.documentsLoaded=t,{...this.progress}):null}za(e){const t=new Map,r=new v_(this.serializer);for(const s of e)if(s.metadata.queries){const i=r.$s(s.metadata.name);for(const o of s.metadata.queries){const a=(t.get(o)||K()).add(i);t.set(o,a)}}return t}async ja(e){const t=await rR(e,new v_(this.serializer),this.Wa,this.Ua.id),r=this.za(this.documents);for(const s of this.Ka)await sR(e,s,r.get(s.name));return this.progress.taskState="Success",{progress:this.progress,Ja:this.collectionGroups,Ha:t}}}function oI(n){return{taskState:"Running",documentsLoaded:0,bytesLoaded:0,totalDocuments:n.totalDocuments,totalBytes:n.totalBytes}}/**
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
 */class aI{constructor(e){this.key=e}}class cI{constructor(e){this.key=e}}class lI{constructor(e,t){this.query=e,this.Ya=t,this.Za=null,this.hasCachedResults=!1,this.current=!1,this.Xa=K(),this.mutatedKeys=K(),this.eu=Yg(e),this.tu=new Ir(this.eu)}get nu(){return this.Ya}ru(e,t){const r=t?t.iu:new E_,s=t?t.tu:this.tu;let i=t?t.mutatedKeys:this.mutatedKeys,o=s,a=!1;const l=this.query.limitType==="F"&&s.size===this.query.limit?s.last():null,u=this.query.limitType==="L"&&s.size===this.query.limit?s.first():null;if(e.inorderTraversal(((h,f)=>{const _=s.get(h),g=No(this.query,f)?f:null,w=!!_&&this.mutatedKeys.has(_.key),R=!!g&&(g.hasLocalMutations||this.mutatedKeys.has(g.key)&&g.hasCommittedMutations);let C=!1;_&&g?_.data.isEqual(g.data)?w!==R&&(r.track({type:3,doc:g}),C=!0):this.su(_,g)||(r.track({type:2,doc:g}),C=!0,(l&&this.eu(g,l)>0||u&&this.eu(g,u)<0)&&(a=!0)):!_&&g?(r.track({type:0,doc:g}),C=!0):_&&!g&&(r.track({type:1,doc:_}),C=!0,(l||u)&&(a=!0)),C&&(g?(o=o.add(g),i=R?i.add(h):i.delete(h)):(o=o.delete(h),i=i.delete(h)))})),this.query.limit!==null)for(;o.size>this.query.limit;){const h=this.query.limitType==="F"?o.last():o.first();o=o.delete(h.key),i=i.delete(h.key),r.track({type:1,doc:h})}return{tu:o,iu:r,Cs:a,mutatedKeys:i}}su(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,r,s){const i=this.tu;this.tu=e.tu,this.mutatedKeys=e.mutatedKeys;const o=e.iu.ya();o.sort(((h,f)=>(function(g,w){const R=C=>{switch(C){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return q(20277,{Rt:C})}};return R(g)-R(w)})(h.type,f.type)||this.eu(h.doc,f.doc))),this.ou(r),s=s??!1;const a=t&&!s?this._u():[],l=this.Xa.size===0&&this.current&&!s?1:0,u=l!==this.Za;return this.Za=l,o.length!==0||u?{snapshot:new Pr(this.query,e.tu,i,o,e.mutatedKeys,l===0,u,!1,!!r&&r.resumeToken.approximateByteSize()>0),au:a}:{au:a}}va(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({tu:this.tu,iu:new E_,mutatedKeys:this.mutatedKeys,Cs:!1},!1)):{au:[]}}uu(e){return!this.Ya.has(e)&&!!this.tu.has(e)&&!this.tu.get(e).hasLocalMutations}ou(e){e&&(e.addedDocuments.forEach((t=>this.Ya=this.Ya.add(t))),e.modifiedDocuments.forEach((t=>{})),e.removedDocuments.forEach((t=>this.Ya=this.Ya.delete(t))),this.current=e.current)}_u(){if(!this.current)return[];const e=this.Xa;this.Xa=K(),this.tu.forEach((r=>{this.uu(r.key)&&(this.Xa=this.Xa.add(r.key))}));const t=[];return e.forEach((r=>{this.Xa.has(r)||t.push(new cI(r))})),this.Xa.forEach((r=>{e.has(r)||t.push(new aI(r))})),t}cu(e){this.Ya=e.Qs,this.Xa=K();const t=this.ru(e.documents);return this.applyChanges(t,!0)}lu(){return Pr.fromInitialDocuments(this.query,this.tu,this.mutatedKeys,this.Za===0,this.hasCachedResults)}}const Hn="SyncEngine";class NR{constructor(e,t,r){this.query=e,this.targetId=t,this.view=r}}class kR{constructor(e){this.key=e,this.hu=!1}}class DR{constructor(e,t,r,s,i,o){this.localStore=e,this.remoteStore=t,this.eventManager=r,this.sharedClientState=s,this.currentUser=i,this.maxConcurrentLimboResolutions=o,this.Pu={},this.Tu=new cn((a=>Hg(a)),Po),this.Iu=new Map,this.Eu=new Set,this.du=new be(M.comparator),this.Au=new Map,this.Ru=new Dh,this.Vu={},this.mu=new Map,this.fu=Sr.cr(),this.onlineState="Unknown",this.gu=void 0}get isPrimaryClient(){return this.gu===!0}}async function xR(n,e,t=!0){const r=Wc(n);let s;const i=r.Tu.get(e);return i?(r.sharedClientState.addLocalQueryTarget(i.targetId),s=i.view.lu()):s=await uI(r,e,t,!0),s}async function VR(n,e){const t=Wc(n);await uI(t,e,!0,!1)}async function uI(n,e,t,r){const s=await Rs(n.localStore,Xe(e)),i=s.targetId,o=n.sharedClientState.addLocalQueryTarget(i,t);let a;return r&&(a=await Qh(n,e,i,o==="current",s.resumeToken)),n.isPrimaryClient&&t&&jc(n.remoteStore,s),a}async function Qh(n,e,t,r,s){n.pu=(f,_,g)=>(async function(R,C,V,B){let L=C.view.ru(V);L.Cs&&(L=await Xa(R.localStore,C.query,!1).then((({documents:T})=>C.view.ru(T,L))));const $=B&&B.targetChanges.get(C.targetId),ne=B&&B.targetMismatches.get(C.targetId)!=null,H=C.view.applyChanges(L,R.isPrimaryClient,$,ne);return Fu(R,C.targetId,H.au),H.snapshot})(n,f,_,g);const i=await Xa(n.localStore,e,!0),o=new lI(e,i.Qs),a=o.ru(i.documents),l=xo.createSynthesizedTargetChangeForCurrentChange(t,r&&n.onlineState!=="Offline",s),u=o.applyChanges(a,n.isPrimaryClient,l);Fu(n,t,u.au);const h=new NR(e,t,o);return n.Tu.set(e,h),n.Iu.has(t)?n.Iu.get(t).push(e):n.Iu.set(t,[e]),u.snapshot}async function OR(n,e,t){const r=F(n),s=r.Tu.get(e),i=r.Iu.get(s.targetId);if(i.length>1)return r.Iu.set(s.targetId,i.filter((o=>!Po(o,e)))),void r.Tu.delete(e);r.isPrimaryClient?(r.sharedClientState.removeLocalQueryTarget(s.targetId),r.sharedClientState.isActiveQueryTarget(s.targetId)||await Ss(r.localStore,s.targetId,!1).then((()=>{r.sharedClientState.clearQueryState(s.targetId),t&&Cs(r.remoteStore,s.targetId),Ps(r,s.targetId)})).catch($n)):(Ps(r,s.targetId),await Ss(r.localStore,s.targetId,!0))}async function MR(n,e){const t=F(n),r=t.Tu.get(e),s=t.Iu.get(r.targetId);t.isPrimaryClient&&s.length===1&&(t.sharedClientState.removeLocalQueryTarget(r.targetId),Cs(t.remoteStore,r.targetId))}async function LR(n,e,t){const r=Zh(n);try{const s=await(function(o,a){const l=F(o),u=ce.now(),h=a.reduce(((g,w)=>g.add(w.key)),K());let f,_;return l.persistence.runTransaction("Locally write mutations","readwrite",(g=>{let w=ct(),R=K();return l.Ns.getEntries(g,h).next((C=>{w=C,w.forEach(((V,B)=>{B.isValidDocument()||(R=R.add(V))}))})).next((()=>l.localDocuments.getOverlayedDocuments(g,w))).next((C=>{f=C;const V=[];for(const B of a){const L=cb(B,f.get(B.key).overlayedDocument);L!=null&&V.push(new ln(B.key,L,Lg(L.value.mapValue),we.exists(!0)))}return l.mutationQueue.addMutationBatch(g,u,V,a)})).next((C=>{_=C;const V=C.applyToLocalDocumentSet(f,R);return l.documentOverlayCache.saveOverlays(g,C.batchId,V)}))})).then((()=>({batchId:_.batchId,changes:Jg(f)})))})(r.localStore,e);r.sharedClientState.addPendingMutation(s.batchId),(function(o,a,l){let u=o.Vu[o.currentUser.toKey()];u||(u=new be(j)),u=u.insert(a,l),o.Vu[o.currentUser.toKey()]=u})(r,s.batchId,t),await un(r,s.changes),await Ws(r.remoteStore)}catch(s){const i=Hs(s,"Failed to persist write");t.reject(i)}}async function hI(n,e){const t=F(n);try{const r=await tR(t.localStore,e);e.targetChanges.forEach(((s,i)=>{const o=t.Au.get(i);o&&(z(s.addedDocuments.size+s.modifiedDocuments.size+s.removedDocuments.size<=1,22616),s.addedDocuments.size>0?o.hu=!0:s.modifiedDocuments.size>0?z(o.hu,14607):s.removedDocuments.size>0&&(z(o.hu,42227),o.hu=!1))})),await un(t,r,e)}catch(r){await $n(r)}}function A_(n,e,t){const r=F(n);if(r.isPrimaryClient&&t===0||!r.isPrimaryClient&&t===1){const s=[];r.Tu.forEach(((i,o)=>{const a=o.view.va(e);a.snapshot&&s.push(a.snapshot)})),(function(o,a){const l=F(o);l.onlineState=a;let u=!1;l.queries.forEach(((h,f)=>{for(const _ of f.Sa)_.va(a)&&(u=!0)})),u&&Wh(l)})(r.eventManager,e),s.length&&r.Pu.H_(s),r.onlineState=e,r.isPrimaryClient&&r.sharedClientState.setOnlineState(e)}}async function FR(n,e,t){const r=F(n);r.sharedClientState.updateQueryState(e,"rejected",t);const s=r.Au.get(e),i=s&&s.key;if(i){let o=new be(M.comparator);o=o.insert(i,ye.newNoDocument(i,G.min()));const a=K().add(i),l=new Do(G.min(),new Map,new be(j),o,a);await hI(r,l),r.du=r.du.remove(i),r.Au.delete(e),Jh(r)}else await Ss(r.localStore,e,!1).then((()=>Ps(r,e,t))).catch($n)}async function UR(n,e){const t=F(n),r=e.batch.batchId;try{const s=await eR(t.localStore,e);Xh(t,r,null),Yh(t,r),t.sharedClientState.updateMutationState(r,"acknowledged"),await un(t,s)}catch(s){await $n(s)}}async function BR(n,e,t){const r=F(n);try{const s=await(function(o,a){const l=F(o);return l.persistence.runTransaction("Reject batch","readwrite-primary",(u=>{let h;return l.mutationQueue.lookupMutationBatch(u,a).next((f=>(z(f!==null,37113),h=f.keys(),l.mutationQueue.removeMutationBatch(u,f)))).next((()=>l.mutationQueue.performConsistencyCheck(u))).next((()=>l.documentOverlayCache.removeOverlaysForBatchId(u,h,a))).next((()=>l.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(u,h))).next((()=>l.localDocuments.getDocuments(u,h)))}))})(r.localStore,e);Xh(r,e,t),Yh(r,e),r.sharedClientState.updateMutationState(e,"rejected",t),await un(r,s)}catch(s){await $n(s)}}async function qR(n,e){const t=F(n);Kn(t.remoteStore)||x(Hn,"The network is disabled. The task returned by 'awaitPendingWrites()' will not complete until the network is enabled.");try{const r=await(function(o){const a=F(o);return a.persistence.runTransaction("Get highest unacknowledged batch id","readonly",(l=>a.mutationQueue.getHighestUnacknowledgedBatchId(l)))})(t.localStore);if(r===Pn)return void e.resolve();const s=t.mu.get(r)||[];s.push(e),t.mu.set(r,s)}catch(r){const s=Hs(r,"Initialization of waitForPendingWrites() operation failed");e.reject(s)}}function Yh(n,e){(n.mu.get(e)||[]).forEach((t=>{t.resolve()})),n.mu.delete(e)}function Xh(n,e,t){const r=F(n);let s=r.Vu[r.currentUser.toKey()];if(s){const i=s.get(e);i&&(t?i.reject(t):i.resolve(),s=s.remove(e)),r.Vu[r.currentUser.toKey()]=s}}function Ps(n,e,t=null){n.sharedClientState.removeLocalQueryTarget(e);for(const r of n.Iu.get(e))n.Tu.delete(r),t&&n.Pu.yu(r,t);n.Iu.delete(e),n.isPrimaryClient&&n.Ru.jr(e).forEach((r=>{n.Ru.containsKey(r)||dI(n,r)}))}function dI(n,e){n.Eu.delete(e.path.canonicalString());const t=n.du.get(e);t!==null&&(Cs(n.remoteStore,t),n.du=n.du.remove(e),n.Au.delete(t),Jh(n))}function Fu(n,e,t){for(const r of t)r instanceof aI?(n.Ru.addReference(r.key,e),zR(n,r)):r instanceof cI?(x(Hn,"Document no longer in limbo: "+r.key),n.Ru.removeReference(r.key,e),n.Ru.containsKey(r.key)||dI(n,r.key)):q(19791,{wu:r})}function zR(n,e){const t=e.key,r=t.path.canonicalString();n.du.get(t)||n.Eu.has(r)||(x(Hn,"New document in limbo: "+t),n.Eu.add(r),Jh(n))}function Jh(n){for(;n.Eu.size>0&&n.du.size<n.maxConcurrentLimboResolutions;){const e=n.Eu.values().next().value;n.Eu.delete(e);const t=new M(Z.fromString(e)),r=n.fu.next();n.Au.set(r,new kR(t)),n.du=n.du.insert(t,r),jc(n.remoteStore,new Qt(Xe(zs(t.path)),r,"TargetPurposeLimboResolution",ot.ce))}}async function un(n,e,t){const r=F(n),s=[],i=[],o=[];r.Tu.isEmpty()||(r.Tu.forEach(((a,l)=>{o.push(r.pu(l,e,t).then((u=>{var h;if((u||t)&&r.isPrimaryClient){const f=u?!u.fromCache:(h=t==null?void 0:t.targetChanges.get(l.targetId))==null?void 0:h.current;r.sharedClientState.updateQueryState(l.targetId,f?"current":"not-current")}if(u){s.push(u);const f=Mh.As(l.targetId,u);i.push(f)}})))})),await Promise.all(o),r.Pu.H_(s),await(async function(l,u){const h=F(l);try{await h.persistence.runTransaction("notifyLocalViewChanges","readwrite",(f=>b.forEach(u,(_=>b.forEach(_.Es,(g=>h.persistence.referenceDelegate.addReference(f,_.targetId,g))).next((()=>b.forEach(_.ds,(g=>h.persistence.referenceDelegate.removeReference(f,_.targetId,g)))))))))}catch(f){if(!jn(f))throw f;x(Lh,"Failed to update sequence numbers: "+f)}for(const f of u){const _=f.targetId;if(!f.fromCache){const g=h.Ms.get(_),w=g.snapshotVersion,R=g.withLastLimboFreeSnapshotVersion(w);h.Ms=h.Ms.insert(_,R)}}})(r.localStore,i))}async function GR(n,e){const t=F(n);if(!t.currentUser.isEqual(e)){x(Hn,"User change. New user:",e.toKey());const r=await zy(t.localStore,e);t.currentUser=e,(function(i,o){i.mu.forEach((a=>{a.forEach((l=>{l.reject(new D(P.CANCELLED,o))}))})),i.mu.clear()})(t,"'waitForPendingWrites' promise is rejected due to a user change."),t.sharedClientState.handleUserChange(e,r.removedBatchIds,r.addedBatchIds),await un(t,r.Ls)}}function $R(n,e){const t=F(n),r=t.Au.get(e);if(r&&r.hu)return K().add(r.key);{let s=K();const i=t.Iu.get(e);if(!i)return s;for(const o of i){const a=t.Tu.get(o);s=s.unionWith(a.view.nu)}return s}}async function jR(n,e){const t=F(n),r=await Xa(t.localStore,e.query,!0),s=e.view.cu(r);return t.isPrimaryClient&&Fu(t,e.targetId,s.au),s}async function WR(n,e){const t=F(n);return Wy(t.localStore,e).then((r=>un(t,r)))}async function KR(n,e,t,r){const s=F(n),i=await(function(a,l){const u=F(a),h=F(u.mutationQueue);return u.persistence.runTransaction("Lookup mutation documents","readonly",(f=>h.er(f,l).next((_=>_?u.localDocuments.getDocuments(f,_):b.resolve(null)))))})(s.localStore,e);i!==null?(t==="pending"?await Ws(s.remoteStore):t==="acknowledged"||t==="rejected"?(Xh(s,e,r||null),Yh(s,e),(function(a,l){F(F(a).mutationQueue).ir(l)})(s.localStore,e)):q(6720,"Unknown batchState",{Su:t}),await un(s,i)):x(Hn,"Cannot apply mutation batch with id: "+e)}async function HR(n,e){const t=F(n);if(Wc(t),Zh(t),e===!0&&t.gu!==!0){const r=t.sharedClientState.getAllActiveQueryTargets(),s=await b_(t,r.toArray());t.gu=!0,await Mu(t.remoteStore,!0);for(const i of s)jc(t.remoteStore,i)}else if(e===!1&&t.gu!==!1){const r=[];let s=Promise.resolve();t.Iu.forEach(((i,o)=>{t.sharedClientState.isLocalQueryTarget(o)?r.push(o):s=s.then((()=>(Ps(t,o),Ss(t.localStore,o,!0)))),Cs(t.remoteStore,o)})),await s,await b_(t,r),(function(o){const a=F(o);a.Au.forEach(((l,u)=>{Cs(a.remoteStore,u)})),a.Ru.Jr(),a.Au=new Map,a.du=new be(M.comparator)})(t),t.gu=!1,await Mu(t.remoteStore,!1)}}async function b_(n,e,t){const r=F(n),s=[],i=[];for(const o of e){let a;const l=r.Iu.get(o);if(l&&l.length!==0){a=await Rs(r.localStore,Xe(l[0]));for(const u of l){const h=r.Tu.get(u),f=await jR(r,h);f.snapshot&&i.push(f.snapshot)}}else{const u=await jy(r.localStore,o);a=await Rs(r.localStore,u),await Qh(r,fI(u),o,!1,a.resumeToken)}s.push(a)}return r.Pu.H_(i),s}function fI(n){return jg(n.path,n.collectionGroup,n.orderBy,n.filters,n.limit,"F",n.startAt,n.endAt)}function QR(n){return(function(t){return F(F(t).persistence).Ts()})(F(n).localStore)}async function YR(n,e,t,r){const s=F(n);if(s.gu)return void x(Hn,"Ignoring unexpected query state notification.");const i=s.Iu.get(e);if(i&&i.length>0)switch(t){case"current":case"not-current":{const o=await Wy(s.localStore,Qg(i[0])),a=Do.createSynthesizedRemoteEventForCurrentChange(e,t==="current",Re.EMPTY_BYTE_STRING);await un(s,o,a);break}case"rejected":await Ss(s.localStore,e,!0),Ps(s,e,r);break;default:q(64155,t)}}async function XR(n,e,t){const r=Wc(n);if(r.gu){for(const s of e){if(r.Iu.has(s)&&r.sharedClientState.isActiveQueryTarget(s)){x(Hn,"Adding an already active target "+s);continue}const i=await jy(r.localStore,s),o=await Rs(r.localStore,i);await Qh(r,fI(i),o.targetId,!1,o.resumeToken),jc(r.remoteStore,o)}for(const s of t)r.Iu.has(s)&&await Ss(r.localStore,s,!1).then((()=>{Cs(r.remoteStore,s),Ps(r,s)})).catch($n)}}function Wc(n){const e=F(n);return e.remoteStore.remoteSyncer.applyRemoteEvent=hI.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=$R.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=FR.bind(null,e),e.Pu.H_=CR.bind(null,e.eventManager),e.Pu.yu=PR.bind(null,e.eventManager),e}function Zh(n){const e=F(n);return e.remoteStore.remoteSyncer.applySuccessfulWrite=UR.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=BR.bind(null,e),e}function JR(n,e,t){const r=F(n);(async function(i,o,a){try{const l=await o.getMetadata();if(await(function(g,w){const R=F(g),C=De(w.createTime);return R.persistence.runTransaction("hasNewerBundle","readonly",(V=>R.Ii.getBundleMetadata(V,w.id))).then((V=>!!V&&V.createTime.compareTo(C)>=0))})(i.localStore,l))return await o.close(),a._completeWith((function(g){return{taskState:"Success",documentsLoaded:g.totalDocuments,bytesLoaded:g.totalBytes,totalDocuments:g.totalDocuments,totalBytes:g.totalBytes}})(l)),Promise.resolve(new Set);a._updateProgress(oI(l));const u=new Hh(l,o.serializer);let h=await o.bu();for(;h;){const _=await u.Ga(h);_&&a._updateProgress(_),h=await o.bu()}const f=await u.ja(i.localStore);return await un(i,f.Ha,void 0),await(function(g,w){const R=F(g);return R.persistence.runTransaction("Save bundle","readwrite",(C=>R.Ii.saveBundleMetadata(C,w)))})(i.localStore,l),a._completeWith(f.progress),Promise.resolve(f.Ja)}catch(l){return It(Hn,`Loading bundle failed with ${l}`),a._failWith(l),Promise.resolve(new Set)}})(r,e,t).then((s=>{r.sharedClientState.notifyBundleLoaded(s)}))}class Ns{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=Or(e.databaseInfo.databaseId),this.sharedClientState=this.Du(e),this.persistence=this.Cu(e),await this.persistence.start(),this.localStore=this.vu(e),this.gcScheduler=this.Fu(e,this.localStore),this.indexBackfillerScheduler=this.Mu(e,this.localStore)}Fu(e,t){return null}Mu(e,t){return null}vu(e){return qy(this.persistence,new By,e.initialUser,this.serializer)}Cu(e){return new xh($c.mi,this.serializer)}Du(e){return new Xy}async terminate(){var e,t;(e=this.gcScheduler)==null||e.stop(),(t=this.indexBackfillerScheduler)==null||t.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}Ns.provider={build:()=>new Ns};class ed extends Ns{constructor(e){super(),this.cacheSizeBytes=e}Fu(e,t){z(this.persistence.referenceDelegate instanceof Ya,46915);const r=this.persistence.referenceDelegate.garbageCollector;return new Vy(r,e.asyncQueue,t)}Cu(e){const t=this.cacheSizeBytes!==void 0?Qe.withCacheSize(this.cacheSizeBytes):Qe.DEFAULT;return new xh((r=>Ya.mi(r,t)),this.serializer)}}class td extends Ns{constructor(e,t,r){super(),this.xu=e,this.cacheSizeBytes=t,this.forceOwnership=r,this.kind="persistent",this.synchronizeTabs=!1}async initialize(e){await super.initialize(e),await this.xu.initialize(this,e),await Zh(this.xu.syncEngine),await Ws(this.xu.remoteStore),await this.persistence.Ji((()=>(this.gcScheduler&&!this.gcScheduler.started&&this.gcScheduler.start(),this.indexBackfillerScheduler&&!this.indexBackfillerScheduler.started&&this.indexBackfillerScheduler.start(),Promise.resolve())))}vu(e){return qy(this.persistence,new By,e.initialUser,this.serializer)}Fu(e,t){const r=this.persistence.referenceDelegate.garbageCollector;return new Vy(r,e.asyncQueue,t)}Mu(e,t){const r=new dA(t,this.persistence);return new hA(e.asyncQueue,r)}Cu(e){const t=Oh(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey),r=this.cacheSizeBytes!==void 0?Qe.withCacheSize(this.cacheSizeBytes):Qe.DEFAULT;return new Vh(this.synchronizeTabs,t,e.clientId,r,e.asyncQueue,Jy(),Da(),this.serializer,this.sharedClientState,!!this.forceOwnership)}Du(e){return new Xy}}class pI extends td{constructor(e,t){super(e,t,!1),this.xu=e,this.cacheSizeBytes=t,this.synchronizeTabs=!0}async initialize(e){await super.initialize(e);const t=this.xu.syncEngine;this.sharedClientState instanceof Kl&&(this.sharedClientState.syncEngine={Co:KR.bind(null,t),vo:YR.bind(null,t),Fo:XR.bind(null,t),Ts:QR.bind(null,t),Do:WR.bind(null,t)},await this.sharedClientState.start()),await this.persistence.Ji((async r=>{await HR(this.xu.syncEngine,r),this.gcScheduler&&(r&&!this.gcScheduler.started?this.gcScheduler.start():r||this.gcScheduler.stop()),this.indexBackfillerScheduler&&(r&&!this.indexBackfillerScheduler.started?this.indexBackfillerScheduler.start():r||this.indexBackfillerScheduler.stop())}))}Du(e){const t=Jy();if(!Kl.v(t))throw new D(P.UNIMPLEMENTED,"IndexedDB persistence is only available on platforms that support LocalStorage.");const r=Oh(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey);return new Kl(t,e.asyncQueue,r,e.clientId,e.initialUser)}}class Un{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=r=>A_(this.syncEngine,r,1),this.remoteStore.remoteSyncer.handleCredentialChange=GR.bind(null,this.syncEngine),await Mu(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return(function(){return new SR})()}createDatastore(e){const t=Or(e.databaseInfo.databaseId),r=(function(i){return new lR(i)})(e.databaseInfo);return(function(i,o,a,l){return new fR(i,o,a,l)})(e.authCredentials,e.appCheckCredentials,r,t)}createRemoteStore(e){return(function(r,s,i,o,a){return new _R(r,s,i,o,a)})(this.localStore,this.datastore,e.asyncQueue,(t=>A_(this.syncEngine,t,0)),(function(){return g_.v()?new g_:new iR})())}createSyncEngine(e,t){return(function(s,i,o,a,l,u,h){const f=new DR(s,i,o,a,l,u);return h&&(f.gu=!0),f})(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){var e,t;await(async function(s){const i=F(s);x(Cr,"RemoteStore shutting down."),i.Ea.add(5),await js(i),i.Aa.shutdown(),i.Ra.set("Unknown")})(this.remoteStore),(e=this.datastore)==null||e.terminate(),(t=this.eventManager)==null||t.terminate()}}Un.provider={build:()=>new Un};function R_(n,e=10240){let t=0;return{async read(){if(t<n.byteLength){const r={value:n.slice(t,t+e),done:!1};return t+=e,r}return{done:!0}},async cancel(){},releaseLock(){},closed:Promise.resolve()}}/**
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
 */class Kc{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Ou(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Ou(this.observer.error,e):Ne("Uncaught Error in snapshot listener:",e.toString()))}Nu(){this.muted=!0}Ou(e,t){setTimeout((()=>{this.muted||e(t)}),0)}}/**
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
 */class ZR{constructor(e,t){this.Bu=e,this.serializer=t,this.metadata=new $e,this.buffer=new Uint8Array,this.Lu=(function(){return new TextDecoder("utf-8")})(),this.ku().then((r=>{r&&r.$a()?this.metadata.resolve(r.Qa.metadata):this.metadata.reject(new Error(`The first element of the bundle is not a metadata, it is
             ${JSON.stringify(r==null?void 0:r.Qa)}`))}),(r=>this.metadata.reject(r)))}close(){return this.Bu.cancel()}async getMetadata(){return this.metadata.promise}async bu(){return await this.getMetadata(),this.ku()}async ku(){const e=await this.qu();if(e===null)return null;const t=this.Lu.decode(e),r=Number(t);isNaN(r)&&this.Qu(`length string (${t}) is not valid number`);const s=await this.$u(r);return new iI(JSON.parse(s),e.length+r)}Uu(){return this.buffer.findIndex((e=>e===123))}async qu(){for(;this.Uu()<0&&!await this.Ku(););if(this.buffer.length===0)return null;const e=this.Uu();e<0&&this.Qu("Reached the end of bundle when a length string is expected.");const t=this.buffer.slice(0,e);return this.buffer=this.buffer.slice(e),t}async $u(e){for(;this.buffer.length<e;)await this.Ku()&&this.Qu("Reached the end of bundle when more is expected.");const t=this.Lu.decode(this.buffer.slice(0,e));return this.buffer=this.buffer.slice(e),t}Qu(e){throw this.Bu.cancel(),new Error(`Invalid bundle format: ${e}`)}async Ku(){const e=await this.Bu.read();if(!e.done){const t=new Uint8Array(this.buffer.length+e.value.length);t.set(this.buffer),t.set(e.value,this.buffer.length),this.buffer=t}return e.done}}/**
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
 */class eS{constructor(e,t){this.bundleData=e,this.serializer=t,this.cursor=0,this.elements=[];let r=this.bu();if(!r||!r.$a())throw new Error(`The first element of the bundle is not a metadata object, it is
         ${JSON.stringify(r==null?void 0:r.Qa)}`);this.metadata=r;do r=this.bu(),r!==null&&this.elements.push(r);while(r!==null)}getMetadata(){return this.metadata}Wu(){return this.elements}bu(){if(this.cursor===this.bundleData.length)return null;const e=this.qu(),t=this.$u(e);return new iI(JSON.parse(t),e)}$u(e){if(this.cursor+e>this.bundleData.length)throw new D(P.INTERNAL,"Reached the end of bundle when more is expected.");return this.bundleData.slice(this.cursor,this.cursor+=e)}qu(){const e=this.cursor;let t=this.cursor;for(;t<this.bundleData.length;){if(this.bundleData[t]==="{"){if(t===e)throw new Error("First character is a bracket and not a number");return this.cursor=t,Number(this.bundleData.slice(e,t))}t++}throw new Error("Reached the end of bundle when more is expected.")}}/**
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
 */class tS{constructor(e){this.datastore=e,this.readVersions=new Map,this.mutations=[],this.committed=!1,this.lastTransactionError=null,this.writtenDocs=new Set}async lookup(e){if(this.ensureCommitNotCalled(),this.mutations.length>0)throw this.lastTransactionError=new D(P.INVALID_ARGUMENT,"Firestore transactions require all reads to be executed before all writes."),this.lastTransactionError;const t=await(async function(s,i){const o=F(s),a={documents:i.map((f=>uo(o.serializer,f)))},l=await o.Ho("BatchGetDocuments",o.serializer.databaseId,Z.emptyPath(),a,i.length),u=new Map;l.forEach((f=>{const _=gb(o.serializer,f);u.set(_.key.toString(),_)}));const h=[];return i.forEach((f=>{const _=u.get(f.toString());z(!!_,55234,{key:f}),h.push(_)})),h})(this.datastore,e);return t.forEach((r=>this.recordVersion(r))),t}set(e,t){this.write(t.toMutation(e,this.precondition(e))),this.writtenDocs.add(e.toString())}update(e,t){try{this.write(t.toMutation(e,this.preconditionForUpdate(e)))}catch(r){this.lastTransactionError=r}this.writtenDocs.add(e.toString())}delete(e){this.write(new $s(e,this.precondition(e))),this.writtenDocs.add(e.toString())}async commit(){if(this.ensureCommitNotCalled(),this.lastTransactionError)throw this.lastTransactionError;const e=this.readVersions;this.mutations.forEach((t=>{e.delete(t.key.toString())})),e.forEach(((t,r)=>{const s=M.fromPath(r);this.mutations.push(new Ah(s,this.precondition(s)))})),await(async function(r,s){const i=F(r),o={writes:s.map((a=>ho(i.serializer,a)))};await i.Go("Commit",i.serializer.databaseId,Z.emptyPath(),o)})(this.datastore,this.mutations),this.committed=!0}recordVersion(e){let t;if(e.isFoundDocument())t=e.version;else{if(!e.isNoDocument())throw q(50498,{Gu:e.constructor.name});t=G.min()}const r=this.readVersions.get(e.key.toString());if(r){if(!t.isEqual(r))throw new D(P.ABORTED,"Document version changed between two reads.")}else this.readVersions.set(e.key.toString(),t)}precondition(e){const t=this.readVersions.get(e.toString());return!this.writtenDocs.has(e.toString())&&t?t.isEqual(G.min())?we.exists(!1):we.updateTime(t):we.none()}preconditionForUpdate(e){const t=this.readVersions.get(e.toString());if(!this.writtenDocs.has(e.toString())&&t){if(t.isEqual(G.min()))throw new D(P.INVALID_ARGUMENT,"Can't update a document that doesn't exist.");return we.updateTime(t)}return we.exists(!0)}write(e){this.ensureCommitNotCalled(),this.mutations.push(e)}ensureCommitNotCalled(){}}/**
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
 */class nS{constructor(e,t,r,s,i){this.asyncQueue=e,this.datastore=t,this.options=r,this.updateFunction=s,this.deferred=i,this.zu=r.maxAttempts,this.M_=new Uh(this.asyncQueue,"transaction_retry")}ju(){this.zu-=1,this.Ju()}Ju(){this.M_.p_((async()=>{const e=new tS(this.datastore),t=this.Hu(e);t&&t.then((r=>{this.asyncQueue.enqueueAndForget((()=>e.commit().then((()=>{this.deferred.resolve(r)})).catch((s=>{this.Yu(s)}))))})).catch((r=>{this.Yu(r)}))}))}Hu(e){try{const t=this.updateFunction(e);return!Ro(t)&&t.catch&&t.then?t:(this.deferred.reject(Error("Transaction callback must return a Promise")),null)}catch(t){return this.deferred.reject(t),null}}Yu(e){this.zu>0&&this.Zu(e)?(this.zu-=1,this.asyncQueue.enqueueAndForget((()=>(this.Ju(),Promise.resolve())))):this.deferred.reject(e)}Zu(e){if((e==null?void 0:e.name)==="FirebaseError"){const t=e.code;return t==="aborted"||t==="failed-precondition"||t==="already-exists"||!ly(t)}return!1}}/**
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
 */const Bn="FirestoreClient";class rS{constructor(e,t,r,s,i){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=r,this.databaseInfo=s,this.user=ze.UNAUTHENTICATED,this.clientId=Cc.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=i,this.authCredentials.start(r,(async o=>{x(Bn,"Received user=",o.uid),await this.authCredentialListener(o),this.user=o})),this.appCheckCredentials.start(r,(o=>(x(Bn,"Received new app check token=",o),this.appCheckCredentialListener(o,this.user))))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this.databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();const e=new $e;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted((async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){const r=Hs(t,"Failed to shutdown persistence");e.reject(r)}})),e.promise}}async function Ql(n,e){n.asyncQueue.verifyOperationInProgress(),x(Bn,"Initializing OfflineComponentProvider");const t=n.configuration;await e.initialize(t);let r=t.initialUser;n.setCredentialChangeListener((async s=>{r.isEqual(s)||(await zy(e.localStore,s),r=s)})),e.persistence.setDatabaseDeletedListener((()=>n.terminate())),n._offlineComponents=e}async function S_(n,e){n.asyncQueue.verifyOperationInProgress();const t=await nd(n);x(Bn,"Initializing OnlineComponentProvider"),await e.initialize(t,n.configuration),n.setCredentialChangeListener((r=>I_(e.remoteStore,r))),n.setAppCheckTokenChangeListener(((r,s)=>I_(e.remoteStore,s))),n._onlineComponents=e}async function nd(n){if(!n._offlineComponents)if(n._uninitializedComponentsProvider){x(Bn,"Using user provided OfflineComponentProvider");try{await Ql(n,n._uninitializedComponentsProvider._offline)}catch(e){const t=e;if(!(function(s){return s.name==="FirebaseError"?s.code===P.FAILED_PRECONDITION||s.code===P.UNIMPLEMENTED:!(typeof DOMException<"u"&&s instanceof DOMException)||s.code===22||s.code===20||s.code===11})(t))throw t;It("Error using user provided cache. Falling back to memory cache: "+t),await Ql(n,new Ns)}}else x(Bn,"Using default OfflineComponentProvider"),await Ql(n,new ed(void 0));return n._offlineComponents}async function Hc(n){return n._onlineComponents||(n._uninitializedComponentsProvider?(x(Bn,"Using user provided OnlineComponentProvider"),await S_(n,n._uninitializedComponentsProvider._online)):(x(Bn,"Using default OnlineComponentProvider"),await S_(n,new Un))),n._onlineComponents}function _I(n){return nd(n).then((e=>e.persistence))}function Qs(n){return nd(n).then((e=>e.localStore))}function mI(n){return Hc(n).then((e=>e.remoteStore))}function rd(n){return Hc(n).then((e=>e.syncEngine))}function gI(n){return Hc(n).then((e=>e.datastore))}async function ks(n){const e=await Hc(n),t=e.eventManager;return t.onListen=xR.bind(null,e.syncEngine),t.onUnlisten=OR.bind(null,e.syncEngine),t.onFirstRemoteStoreListen=VR.bind(null,e.syncEngine),t.onLastRemoteStoreUnlisten=MR.bind(null,e.syncEngine),t}function sS(n){return n.asyncQueue.enqueue((async()=>{const e=await _I(n),t=await mI(n);return e.setNetworkEnabled(!0),(function(s){const i=F(s);return i.Ea.delete(0),Vo(i)})(t)}))}function iS(n){return n.asyncQueue.enqueue((async()=>{const e=await _I(n),t=await mI(n);return e.setNetworkEnabled(!1),(async function(s){const i=F(s);i.Ea.add(0),await js(i),i.Ra.set("Offline")})(t)}))}function oS(n,e){const t=new $e;return n.asyncQueue.enqueueAndForget((async()=>(async function(s,i,o){try{const a=await(function(u,h){const f=F(u);return f.persistence.runTransaction("read document","readonly",(_=>f.localDocuments.getDocument(_,h)))})(s,i);a.isFoundDocument()?o.resolve(a):a.isNoDocument()?o.resolve(null):o.reject(new D(P.UNAVAILABLE,"Failed to get document from cache. (However, this document may exist on the server. Run again without setting 'source' in the GetOptions to attempt to retrieve the document from the server.)"))}catch(a){const l=Hs(a,`Failed to get document '${i} from cache`);o.reject(l)}})(await Qs(n),e,t))),t.promise}function yI(n,e,t={}){const r=new $e;return n.asyncQueue.enqueueAndForget((async()=>(function(i,o,a,l,u){const h=new Kc({next:_=>{h.Nu(),o.enqueueAndForget((()=>jh(i,f)));const g=_.docs.has(a);!g&&_.fromCache?u.reject(new D(P.UNAVAILABLE,"Failed to get document because the client is offline.")):g&&_.fromCache&&l&&l.source==="server"?u.reject(new D(P.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):u.resolve(_)},error:_=>u.reject(_)}),f=new Kh(zs(a.path),h,{includeMetadataChanges:!0,qa:!0});return $h(i,f)})(await ks(n),n.asyncQueue,e,t,r))),r.promise}function aS(n,e){const t=new $e;return n.asyncQueue.enqueueAndForget((async()=>(async function(s,i,o){try{const a=await Xa(s,i,!0),l=new lI(i,a.Qs),u=l.ru(a.documents),h=l.applyChanges(u,!1);o.resolve(h.snapshot)}catch(a){const l=Hs(a,`Failed to execute query '${i} against cache`);o.reject(l)}})(await Qs(n),e,t))),t.promise}function II(n,e,t={}){const r=new $e;return n.asyncQueue.enqueueAndForget((async()=>(function(i,o,a,l,u){const h=new Kc({next:_=>{h.Nu(),o.enqueueAndForget((()=>jh(i,f))),_.fromCache&&l.source==="server"?u.reject(new D(P.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):u.resolve(_)},error:_=>u.reject(_)}),f=new Kh(a,h,{includeMetadataChanges:!0,qa:!0});return $h(i,f)})(await ks(n),n.asyncQueue,e,t,r))),r.promise}function cS(n,e,t){const r=new $e;return n.asyncQueue.enqueueAndForget((async()=>{try{const s=await gI(n);r.resolve((async function(o,a,l){var R;const u=F(o),{request:h,gt:f,parent:_}=Ey(u.serializer,Wg(a),l);u.connection.$o||delete h.parent;const g=(await u.Ho("RunAggregationQuery",u.serializer.databaseId,_,h,1)).filter((C=>!!C.result));z(g.length===1,64727);const w=(R=g[0].result)==null?void 0:R.aggregateFields;return Object.keys(w).reduce(((C,V)=>(C[f[V]]=w[V],C)),{})})(s,e,t))}catch(s){r.reject(s)}})),r.promise}function lS(n,e){const t=new Kc(e);return n.asyncQueue.enqueueAndForget((async()=>(function(s,i){F(s).Ca.add(i),i.next()})(await ks(n),t))),()=>{t.Nu(),n.asyncQueue.enqueueAndForget((async()=>(function(s,i){F(s).Ca.delete(i)})(await ks(n),t)))}}function uS(n,e,t,r){const s=(function(o,a){let l;return l=typeof o=="string"?hy().encode(o):o,(function(h,f){return new ZR(h,f)})((function(h,f){if(h instanceof Uint8Array)return R_(h,f);if(h instanceof ArrayBuffer)return R_(new Uint8Array(h),f);if(h instanceof ReadableStream)return h.getReader();throw new Error("Source of `toByteStreamReader` has to be a ArrayBuffer or ReadableStream")})(l),a)})(t,Or(e));n.asyncQueue.enqueueAndForget((async()=>{JR(await rd(n),s,r)}))}function hS(n,e){return n.asyncQueue.enqueue((async()=>(function(r,s){const i=F(r);return i.persistence.runTransaction("Get named query","readonly",(o=>i.Ii.getNamedQuery(o,s)))})(await Qs(n),e)))}function EI(n,e){return(function(r,s){return new eS(r,s)})(n,e)}function dS(n,e){return n.asyncQueue.enqueue((async()=>(async function(r,s){const i=F(r),o=i.indexManager,a=[];return i.persistence.runTransaction("Configure indexes","readwrite",(l=>o.getFieldIndexes(l).next((u=>(function(f,_,g,w,R){f=[...f],_=[..._],f.sort(g),_.sort(g);const C=f.length,V=_.length;let B=0,L=0;for(;B<V&&L<C;){const $=g(f[L],_[B]);$<0?R(f[L++]):$>0?w(_[B++]):(B++,L++)}for(;B<V;)w(_[B++]);for(;L<C;)R(f[L++])})(u,s,aA,(h=>{a.push(o.addFieldIndex(l,h))}),(h=>{a.push(o.deleteFieldIndex(l,h))})))).next((()=>b.waitFor(a)))))})(await Qs(n),e)))}function fS(n,e){return n.asyncQueue.enqueue((async()=>(function(r,s){F(r).Fs.Vs=s})(await Qs(n),e)))}function pS(n){return n.asyncQueue.enqueue((async()=>(function(t){const r=F(t),s=r.indexManager;return r.persistence.runTransaction("Delete All Indexes","readwrite",(i=>s.deleteAllFieldIndexes(i)))})(await Qs(n))))}/**
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
 */function TI(n){const e={};return n.timeoutSeconds!==void 0&&(e.timeoutSeconds=n.timeoutSeconds),e}/**
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
 */const C_=new Map;/**
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
 */const wI="firestore.googleapis.com",P_=!0;class N_{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new D(P.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=wI,this.ssl=P_}else this.host=e.host,this.ssl=e.ssl??P_;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e.cacheSizeBytes===void 0)this.cacheSizeBytes=Py;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<xy)throw new D(P.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}cg("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=TI(e.experimentalLongPollingOptions??{}),(function(r){if(r.timeoutSeconds!==void 0){if(isNaN(r.timeoutSeconds))throw new D(P.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (must not be NaN)`);if(r.timeoutSeconds<5)throw new D(P.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (minimum allowed value is 5)`);if(r.timeoutSeconds>30)throw new D(P.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (maximum allowed value is 30)`)}})(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&(function(r,s){return r.timeoutSeconds===s.timeoutSeconds})(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams}}class Oo{constructor(e,t,r,s){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=r,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new N_({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new D(P.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new D(P.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new N_(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=(function(r){if(!r)return new og;switch(r.type){case"firstParty":return new eA(r.sessionIndex||"0",r.iamToken||null,r.authTokenFactory||null);case"provider":return r.client;default:throw new D(P.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}})(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return(function(t){const r=C_.get(t);r&&(x("ComponentProvider","Removing Datastore"),C_.delete(t),r.terminate())})(this),Promise.resolve()}}function vI(n,e,t,r={}){var u;n=te(n,Oo);const s=vt(e),i=n._getSettings(),o={...i,emulatorOptions:n._getEmulatorOptions()},a=`${e}:${t}`;s&&(Ao(`https://${a}`),Ac("Firestore",!0)),i.host!==wI&&i.host!==a&&It("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const l={...i,host:a,ssl:s,emulatorOptions:r};if(!en(l,o)&&(n._setSettings(l),r.mockUserToken)){let h,f;if(typeof r.mockUserToken=="string")h=r.mockUserToken,f=ze.MOCK_USER;else{h=ah(r.mockUserToken,(u=n._app)==null?void 0:u.options.projectId);const _=r.mockUserToken.sub||r.mockUserToken.user_id;if(!_)throw new D(P.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");f=new ze(_)}n._authCredentials=new Xv(new ig(h,f))}}/**
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
 */class Le{constructor(e,t,r){this.converter=t,this._query=r,this.type="query",this.firestore=e}withConverter(e){return new Le(this.firestore,e,this._query)}}class ue{constructor(e,t,r){this.converter=t,this._key=r,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new St(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new ue(this.firestore,e,this._key)}toJSON(){return{type:ue._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,r){if(Vr(t,ue._jsonSchema))return new ue(e,r||null,new M(Z.fromString(t.referencePath)))}}ue._jsonSchemaVersion="firestore/documentReference/1.0",ue._jsonSchema={type:Ve("string",ue._jsonSchemaVersion),referencePath:Ve("string")};class St extends Le{constructor(e,t,r){super(e,t,zs(r)),this._path=r,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new ue(this.firestore,null,new M(e))}withConverter(e){return new St(this.firestore,e,this._path)}}function _S(n,e,...t){if(n=X(n),hh("collection","path",e),n instanceof Oo){const r=Z.fromString(e,...t);return yp(r),new St(n,null,r)}{if(!(n instanceof ue||n instanceof St))throw new D(P.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(Z.fromString(e,...t));return yp(r),new St(n.firestore,null,r)}}function mS(n,e){if(n=te(n,Oo),hh("collectionGroup","collection id",e),e.indexOf("/")>=0)throw new D(P.INVALID_ARGUMENT,`Invalid collection ID '${e}' passed to function collectionGroup(). Collection IDs must not contain '/'.`);return new Le(n,null,(function(r){return new an(Z.emptyPath(),r)})(e))}function AI(n,e,...t){if(n=X(n),arguments.length===1&&(e=Cc.newId()),hh("doc","path",e),n instanceof Oo){const r=Z.fromString(e,...t);return gp(r),new ue(n,null,new M(r))}{if(!(n instanceof ue||n instanceof St))throw new D(P.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(Z.fromString(e,...t));return gp(r),new ue(n.firestore,n instanceof St?n.converter:null,new M(r))}}function gS(n,e){return n=X(n),e=X(e),(n instanceof ue||n instanceof St)&&(e instanceof ue||e instanceof St)&&n.firestore===e.firestore&&n.path===e.path&&n.converter===e.converter}function sd(n,e){return n=X(n),e=X(e),n instanceof Le&&e instanceof Le&&n.firestore===e.firestore&&Po(n._query,e._query)&&n.converter===e.converter}/**
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
 */const k_="AsyncQueue";class D_{constructor(e=Promise.resolve()){this.Xu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new Uh(this,"async_queue_retry"),this._c=()=>{const r=Da();r&&x(k_,"Visibility state changed to "+r.visibilityState),this.M_.w_()},this.ac=e;const t=Da();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.uc(),this.cc(e)}enterRestrictedMode(e){if(!this.ec){this.ec=!0,this.sc=e||!1;const t=Da();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this._c)}}enqueue(e){if(this.uc(),this.ec)return new Promise((()=>{}));const t=new $e;return this.cc((()=>this.ec&&this.sc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise))).then((()=>t.promise))}enqueueRetryable(e){this.enqueueAndForget((()=>(this.Xu.push(e),this.lc())))}async lc(){if(this.Xu.length!==0){try{await this.Xu[0](),this.Xu.shift(),this.M_.reset()}catch(e){if(!jn(e))throw e;x(k_,"Operation failed with retryable error: "+e)}this.Xu.length>0&&this.M_.p_((()=>this.lc()))}}cc(e){const t=this.ac.then((()=>(this.rc=!0,e().catch((r=>{throw this.nc=r,this.rc=!1,Ne("INTERNAL UNHANDLED ERROR: ",x_(r)),r})).then((r=>(this.rc=!1,r))))));return this.ac=t,t}enqueueAfterDelay(e,t,r){this.uc(),this.oc.indexOf(e)>-1&&(t=0);const s=Gh.createAndSchedule(this,e,t,r,(i=>this.hc(i)));return this.tc.push(s),s}uc(){this.nc&&q(47125,{Pc:x_(this.nc)})}verifyOperationInProgress(){}async Tc(){let e;do e=this.ac,await e;while(e!==this.ac)}Ic(e){for(const t of this.tc)if(t.timerId===e)return!0;return!1}Ec(e){return this.Tc().then((()=>{this.tc.sort(((t,r)=>t.targetTimeMs-r.targetTimeMs));for(const t of this.tc)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.Tc()}))}dc(e){this.oc.push(e)}hc(e){const t=this.tc.indexOf(e);this.tc.splice(t,1)}}function x_(n){let e=n.message||"";return n.stack&&(e=n.stack.includes(n.message)?n.stack:n.message+`
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
 */function is(n){return(function(t,r){if(typeof t!="object"||t===null)return!1;const s=t;for(const i of r)if(i in s&&typeof s[i]=="function")return!0;return!1})(n,["next","error","complete"])}class bI{constructor(){this._progressObserver={},this._taskCompletionResolver=new $e,this._lastProgress={taskState:"Running",totalBytes:0,totalDocuments:0,bytesLoaded:0,documentsLoaded:0}}onProgress(e,t,r){this._progressObserver={next:e,error:t,complete:r}}catch(e){return this._taskCompletionResolver.promise.catch(e)}then(e,t){return this._taskCompletionResolver.promise.then(e,t)}_completeWith(e){this._updateProgress(e),this._progressObserver.complete&&this._progressObserver.complete(),this._taskCompletionResolver.resolve(e)}_failWith(e){this._lastProgress.taskState="Error",this._progressObserver.next&&this._progressObserver.next(this._lastProgress),this._progressObserver.error&&this._progressObserver.error(e),this._taskCompletionResolver.reject(e)}_updateProgress(e){this._lastProgress=e,this._progressObserver.next&&this._progressObserver.next(e)}}/**
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
 */const yS=-1;class fe extends Oo{constructor(e,t,r,s){super(e,t,r,s),this.type="firestore",this._queue=new D_,this._persistenceKey=(s==null?void 0:s.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new D_(e),this._firestoreClient=void 0,await e}}}function RI(n,e,t){t||(t=oo);const r=Us(n,"firestore");if(r.isInitialized(t)){const s=r.getImmediate({identifier:t}),i=r.getOptions(t);if(en(i,e))return s;throw new D(P.FAILED_PRECONDITION,"initializeFirestore() has already been called with different options. To avoid this error, call initializeFirestore() with the same options as when it was originally called, or call getFirestore() to return the already initialized instance.")}if(e.cacheSizeBytes!==void 0&&e.localCache!==void 0)throw new D(P.INVALID_ARGUMENT,"cache and cacheSizeBytes cannot be specified at the same time as cacheSizeBytes willbe deprecated. Instead, specify the cache size in the cache object");if(e.cacheSizeBytes!==void 0&&e.cacheSizeBytes!==-1&&e.cacheSizeBytes<xy)throw new D(P.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");return e.host&&vt(e.host)&&Ao(e.host),r.initialize({options:e,instanceIdentifier:t})}function IS(n,e){const t=typeof n=="object"?n:Sc(),r=typeof n=="string"?n:e||oo,s=Us(t,"firestore").getImmediate({identifier:r});if(!s._initialized){const i=vc("firestore");i&&vI(s,...i)}return s}function ve(n){if(n._terminated)throw new D(P.FAILED_PRECONDITION,"The client has already been terminated.");return n._firestoreClient||SI(n),n._firestoreClient}function SI(n){var r,s,i;const e=n._freezeSettings(),t=(function(a,l,u,h){return new qA(a,l,u,h.host,h.ssl,h.experimentalForceLongPolling,h.experimentalAutoDetectLongPolling,TI(h.experimentalLongPollingOptions),h.useFetchStreams,h.isUsingEmulator)})(n._databaseId,((r=n._app)==null?void 0:r.options.appId)||"",n._persistenceKey,e);n._componentsProvider||(s=e.localCache)!=null&&s._offlineComponentProvider&&((i=e.localCache)!=null&&i._onlineComponentProvider)&&(n._componentsProvider={_offline:e.localCache._offlineComponentProvider,_online:e.localCache._onlineComponentProvider}),n._firestoreClient=new rS(n._authCredentials,n._appCheckCredentials,n._queue,t,n._componentsProvider&&(function(a){const l=a==null?void 0:a._online.build();return{_offline:a==null?void 0:a._offline.build(l),_online:l}})(n._componentsProvider))}function ES(n,e){It("enableIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead.");const t=n._freezeSettings();return CI(n,Un.provider,{build:r=>new td(r,t.cacheSizeBytes,e==null?void 0:e.forceOwnership)}),Promise.resolve()}async function TS(n){It("enableMultiTabIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead.");const e=n._freezeSettings();CI(n,Un.provider,{build:t=>new pI(t,e.cacheSizeBytes)})}function CI(n,e,t){if((n=te(n,fe))._firestoreClient||n._terminated)throw new D(P.FAILED_PRECONDITION,"Firestore has already been started and persistence can no longer be enabled. You can only enable persistence before calling any other methods on a Firestore object.");if(n._componentsProvider||n._getSettings().localCache)throw new D(P.FAILED_PRECONDITION,"SDK cache is already specified.");n._componentsProvider={_online:e,_offline:t},SI(n)}function wS(n){if(n._initialized&&!n._terminated)throw new D(P.FAILED_PRECONDITION,"Persistence can only be cleared before a Firestore instance is initialized or after it is terminated.");const e=new $e;return n._queue.enqueueAndForgetEvenWhileRestricted((async()=>{try{await(async function(r){if(!Ut.v())return Promise.resolve();const s=r+Uy;await Ut.delete(s)})(Oh(n._databaseId,n._persistenceKey)),e.resolve()}catch(t){e.reject(t)}})),e.promise}function vS(n){return(function(t){const r=new $e;return t.asyncQueue.enqueueAndForget((async()=>qR(await rd(t),r))),r.promise})(ve(n=te(n,fe)))}function AS(n){return sS(ve(n=te(n,fe)))}function bS(n){return iS(ve(n=te(n,fe)))}function RS(n){return Vv(n.app,"firestore",n._databaseId.database),n._delete()}function Uu(n,e){const t=ve(n=te(n,fe)),r=new bI;return uS(t,n._databaseId,e,r),r}function PI(n,e){return hS(ve(n=te(n,fe)),e).then((t=>t?new Le(n,null,t.query):null))}/**
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
 */class Ds{constructor(e="count",t){this._internalFieldPath=t,this.type="AggregateField",this.aggregateType=e}}class NI{constructor(e,t,r){this._userDataWriter=t,this._data=r,this.type="AggregateQuerySnapshot",this.query=e}data(){return this._userDataWriter.convertObjectMap(this._data)}}/**
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
 */class it{constructor(e){this._byteString=e}static fromBase64String(e){try{return new it(Re.fromBase64String(e))}catch(t){throw new D(P.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new it(Re.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:it._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(Vr(e,it._jsonSchema))return it.fromBase64String(e.bytes)}}it._jsonSchemaVersion="firestore/bytes/1.0",it._jsonSchema={type:Ve("string",it._jsonSchemaVersion),bytes:Ve("string")};/**
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
 */class Qn{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new D(P.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new Ie(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}function SS(){return new Qn(pu)}/**
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
 */class Yn{constructor(e){this._methodName=e}}/**
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
 */class Ct{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new D(P.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new D(P.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return j(this._lat,e._lat)||j(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:Ct._jsonSchemaVersion}}static fromJSON(e){if(Vr(e,Ct._jsonSchema))return new Ct(e.latitude,e.longitude)}}Ct._jsonSchemaVersion="firestore/geoPoint/1.0",Ct._jsonSchema={type:Ve("string",Ct._jsonSchemaVersion),latitude:Ve("number"),longitude:Ve("number")};/**
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
 */class wt{constructor(e){this._values=(e||[]).map((t=>t))}toArray(){return this._values.map((e=>e))}isEqual(e){return(function(r,s){if(r.length!==s.length)return!1;for(let i=0;i<r.length;++i)if(r[i]!==s[i])return!1;return!0})(this._values,e._values)}toJSON(){return{type:wt._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(Vr(e,wt._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every((t=>typeof t=="number")))return new wt(e.vectorValues);throw new D(P.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}wt._jsonSchemaVersion="firestore/vectorValue/1.0",wt._jsonSchema={type:Ve("string",wt._jsonSchemaVersion),vectorValues:Ve("object")};/**
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
 */const CS=/^__.*__$/;class PS{constructor(e,t,r){this.data=e,this.fieldMask=t,this.fieldTransforms=r}toMutation(e,t){return this.fieldMask!==null?new ln(e,this.data,this.fieldMask,t,this.fieldTransforms):new Gs(e,this.data,t,this.fieldTransforms)}}class kI{constructor(e,t,r){this.data=e,this.fieldMask=t,this.fieldTransforms=r}toMutation(e,t){return new ln(e,this.data,this.fieldMask,t,this.fieldTransforms)}}function DI(n){switch(n){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw q(40011,{Ac:n})}}class Qc{constructor(e,t,r,s,i,o){this.settings=e,this.databaseId=t,this.serializer=r,this.ignoreUndefinedProperties=s,i===void 0&&this.Rc(),this.fieldTransforms=i||[],this.fieldMask=o||[]}get path(){return this.settings.path}get Ac(){return this.settings.Ac}Vc(e){return new Qc({...this.settings,...e},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}mc(e){var s;const t=(s=this.path)==null?void 0:s.child(e),r=this.Vc({path:t,fc:!1});return r.gc(e),r}yc(e){var s;const t=(s=this.path)==null?void 0:s.child(e),r=this.Vc({path:t,fc:!1});return r.Rc(),r}wc(e){return this.Vc({path:void 0,fc:!0})}Sc(e){return tc(e,this.settings.methodName,this.settings.bc||!1,this.path,this.settings.Dc)}contains(e){return this.fieldMask.find((t=>e.isPrefixOf(t)))!==void 0||this.fieldTransforms.find((t=>e.isPrefixOf(t.field)))!==void 0}Rc(){if(this.path)for(let e=0;e<this.path.length;e++)this.gc(this.path.get(e))}gc(e){if(e.length===0)throw this.Sc("Document fields must not be empty");if(DI(this.Ac)&&CS.test(e))throw this.Sc('Document fields cannot begin and end with "__"')}}class NS{constructor(e,t,r){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=r||Or(e)}Cc(e,t,r,s=!1){return new Qc({Ac:e,methodName:t,Dc:r,path:Ie.emptyPath(),fc:!1,bc:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function Mr(n){const e=n._freezeSettings(),t=Or(n._databaseId);return new NS(n._databaseId,!!e.ignoreUndefinedProperties,t)}function Yc(n,e,t,r,s,i={}){const o=n.Cc(i.merge||i.mergeFields?2:0,e,t,s);hd("Data must be an object, but it was:",o,r);const a=OI(r,o);let l,u;if(i.merge)l=new at(o.fieldMask),u=o.fieldTransforms;else if(i.mergeFields){const h=[];for(const f of i.mergeFields){const _=fo(e,f,t);if(!o.contains(_))throw new D(P.INVALID_ARGUMENT,`Field '${_}' is specified in your field mask but missing from your input data.`);LI(h,_)||h.push(_)}l=new at(h),u=o.fieldTransforms.filter((f=>l.covers(f.field)))}else l=null,u=o.fieldTransforms;return new PS(new We(a),l,u)}class Mo extends Yn{_toFieldTransform(e){if(e.Ac!==2)throw e.Ac===1?e.Sc(`${this._methodName}() can only appear at the top level of your update data`):e.Sc(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof Mo}}function xI(n,e,t){return new Qc({Ac:3,Dc:e.settings.Dc,methodName:n._methodName,fc:t},e.databaseId,e.serializer,e.ignoreUndefinedProperties)}class id extends Yn{_toFieldTransform(e){return new ko(e.path,new vs)}isEqual(e){return e instanceof id}}class od extends Yn{constructor(e,t){super(e),this.vc=t}_toFieldTransform(e){const t=xI(this,e,!0),r=this.vc.map((i=>Lr(i,t))),s=new vr(r);return new ko(e.path,s)}isEqual(e){return e instanceof od&&en(this.vc,e.vc)}}class ad extends Yn{constructor(e,t){super(e),this.vc=t}_toFieldTransform(e){const t=xI(this,e,!0),r=this.vc.map((i=>Lr(i,t))),s=new Ar(r);return new ko(e.path,s)}isEqual(e){return e instanceof ad&&en(this.vc,e.vc)}}class cd extends Yn{constructor(e,t){super(e),this.Fc=t}_toFieldTransform(e){const t=new As(e.serializer,ty(e.serializer,this.Fc));return new ko(e.path,t)}isEqual(e){return e instanceof cd&&this.Fc===e.Fc}}function ld(n,e,t,r){const s=n.Cc(1,e,t);hd("Data must be an object, but it was:",s,r);const i=[],o=We.empty();Wn(r,((l,u)=>{const h=Xc(e,l,t);u=X(u);const f=s.yc(h);if(u instanceof Mo)i.push(h);else{const _=Lr(u,f);_!=null&&(i.push(h),o.set(h,_))}}));const a=new at(i);return new kI(o,a,s.fieldTransforms)}function ud(n,e,t,r,s,i){const o=n.Cc(1,e,t),a=[fo(e,r,t)],l=[s];if(i.length%2!=0)throw new D(P.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let _=0;_<i.length;_+=2)a.push(fo(e,i[_])),l.push(i[_+1]);const u=[],h=We.empty();for(let _=a.length-1;_>=0;--_)if(!LI(u,a[_])){const g=a[_];let w=l[_];w=X(w);const R=o.yc(g);if(w instanceof Mo)u.push(g);else{const C=Lr(w,R);C!=null&&(u.push(g),h.set(g,C))}}const f=new at(u);return new kI(h,f,o.fieldTransforms)}function VI(n,e,t,r=!1){return Lr(t,n.Cc(r?4:3,e))}function Lr(n,e){if(MI(n=X(n)))return hd("Unsupported field value:",e,n),OI(n,e);if(n instanceof Yn)return(function(r,s){if(!DI(s.Ac))throw s.Sc(`${r._methodName}() can only be used with update() and set()`);if(!s.path)throw s.Sc(`${r._methodName}() is not currently supported inside arrays`);const i=r._toFieldTransform(s);i&&s.fieldTransforms.push(i)})(n,e),null;if(n===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),n instanceof Array){if(e.settings.fc&&e.Ac!==4)throw e.Sc("Nested arrays are not supported");return(function(r,s){const i=[];let o=0;for(const a of r){let l=Lr(a,s.wc(o));l==null&&(l={nullValue:"NULL_VALUE"}),i.push(l),o++}return{arrayValue:{values:i}}})(n,e)}return(function(r,s){if((r=X(r))===null)return{nullValue:"NULL_VALUE"};if(typeof r=="number")return ty(s.serializer,r);if(typeof r=="boolean")return{booleanValue:r};if(typeof r=="string")return{stringValue:r};if(r instanceof Date){const i=ce.fromDate(r);return{timestampValue:bs(s.serializer,i)}}if(r instanceof ce){const i=new ce(r.seconds,1e3*Math.floor(r.nanoseconds/1e3));return{timestampValue:bs(s.serializer,i)}}if(r instanceof Ct)return{geoPointValue:{latitude:r.latitude,longitude:r.longitude}};if(r instanceof it)return{bytesValue:py(s.serializer,r._byteString)};if(r instanceof ue){const i=s.databaseId,o=r.firestore._databaseId;if(!o.isEqual(i))throw s.Sc(`Document reference is for database ${o.projectId}/${o.database} but should be for database ${i.projectId}/${i.database}`);return{referenceValue:Ph(r.firestore._databaseId||s.databaseId,r._key.path)}}if(r instanceof wt)return(function(o,a){return{mapValue:{fields:{[yh]:{stringValue:Ih},[Es]:{arrayValue:{values:o.toArray().map((u=>{if(typeof u!="number")throw a.Sc("VectorValues must only contain numeric values.");return vh(a.serializer,u)}))}}}}}})(r,s);throw s.Sc(`Unsupported field value: ${Pc(r)}`)})(n,e)}function OI(n,e){const t={};return Cg(n)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):Wn(n,((r,s)=>{const i=Lr(s,e.mc(r));i!=null&&(t[r]=i)})),{mapValue:{fields:t}}}function MI(n){return!(typeof n!="object"||n===null||n instanceof Array||n instanceof Date||n instanceof ce||n instanceof Ct||n instanceof it||n instanceof ue||n instanceof Yn||n instanceof wt)}function hd(n,e,t){if(!MI(t)||!lg(t)){const r=Pc(t);throw r==="an object"?e.Sc(n+" a custom object"):e.Sc(n+" "+r)}}function fo(n,e,t){if((e=X(e))instanceof Qn)return e._internalPath;if(typeof e=="string")return Xc(n,e);throw tc("Field path arguments must be of type string or ",n,!1,void 0,t)}const kS=new RegExp("[~\\*/\\[\\]]");function Xc(n,e,t){if(e.search(kS)>=0)throw tc(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,n,!1,void 0,t);try{return new Qn(...e.split("."))._internalPath}catch{throw tc(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,n,!1,void 0,t)}}function tc(n,e,t,r,s){const i=r&&!r.isEmpty(),o=s!==void 0;let a=`Function ${e}() called with invalid data`;t&&(a+=" (via `toFirestore()`)"),a+=". ";let l="";return(i||o)&&(l+=" (found",i&&(l+=` in field ${r}`),o&&(l+=` in document ${s}`),l+=")"),new D(P.INVALID_ARGUMENT,a+n+l)}function LI(n,e){return n.some((t=>t.isEqual(e)))}/**
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
 */class po{constructor(e,t,r,s,i){this._firestore=e,this._userDataWriter=t,this._key=r,this._document=s,this._converter=i}get id(){return this._key.path.lastSegment()}get ref(){return new ue(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new DS(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}get(e){if(this._document){const t=this._document.data.field(Jc("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}}class DS extends po{data(){return super.data()}}function Jc(n,e){return typeof e=="string"?Xc(n,e):e instanceof Qn?e._internalPath:e._delegate._internalPath}/**
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
 */function FI(n){if(n.limitType==="L"&&n.explicitOrderBy.length===0)throw new D(P.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class dd{}class Ys extends dd{}function xS(n,e,...t){let r=[];e instanceof dd&&r.push(e),r=r.concat(t),(function(i){const o=i.filter((l=>l instanceof Fr)).length,a=i.filter((l=>l instanceof Xs)).length;if(o>1||o>0&&a>0)throw new D(P.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")})(r);for(const s of r)n=s._apply(n);return n}class Xs extends Ys{constructor(e,t,r){super(),this._field=e,this._op=t,this._value=r,this.type="where"}static _create(e,t,r){return new Xs(e,t,r)}_apply(e){const t=this._parse(e);return BI(e._query,t),new Le(e.firestore,e.converter,Ru(e._query,t))}_parse(e){const t=Mr(e.firestore);return(function(i,o,a,l,u,h,f){let _;if(u.isKeyField()){if(h==="array-contains"||h==="array-contains-any")throw new D(P.INVALID_ARGUMENT,`Invalid Query. You can't perform '${h}' queries on documentId().`);if(h==="in"||h==="not-in"){O_(f,h);const w=[];for(const R of f)w.push(V_(l,i,R));_={arrayValue:{values:w}}}else _=V_(l,i,f)}else h!=="in"&&h!=="not-in"&&h!=="array-contains-any"||O_(f,h),_=VI(a,o,f,h==="in"||h==="not-in");return se.create(u,h,_)})(e._query,"where",t,e.firestore._databaseId,this._field,this._op,this._value)}}function VS(n,e,t){const r=e,s=Jc("where",n);return Xs._create(s,r,t)}class Fr extends dd{constructor(e,t){super(),this.type=e,this._queryConstraints=t}static _create(e,t){return new Fr(e,t)}_parse(e){const t=this._queryConstraints.map((r=>r._parse(e))).filter((r=>r.getFilters().length>0));return t.length===1?t[0]:le.create(t,this._getOperator())}_apply(e){const t=this._parse(e);return t.getFilters().length===0?e:((function(s,i){let o=s;const a=i.getFlattenedFilters();for(const l of a)BI(o,l),o=Ru(o,l)})(e._query,t),new Le(e.firestore,e.converter,Ru(e._query,t)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}function OS(...n){return n.forEach((e=>qI("or",e))),Fr._create("or",n)}function MS(...n){return n.forEach((e=>qI("and",e))),Fr._create("and",n)}class Zc extends Ys{constructor(e,t){super(),this._field=e,this._direction=t,this.type="orderBy"}static _create(e,t){return new Zc(e,t)}_apply(e){const t=(function(s,i,o){if(s.startAt!==null)throw new D(P.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(s.endAt!==null)throw new D(P.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new lo(i,o)})(e._query,this._field,this._direction);return new Le(e.firestore,e.converter,(function(s,i){const o=s.explicitOrderBy.concat([i]);return new an(s.path,s.collectionGroup,o,s.filters.slice(),s.limit,s.limitType,s.startAt,s.endAt)})(e._query,t))}}function LS(n,e="asc"){const t=e,r=Jc("orderBy",n);return Zc._create(r,t)}class Lo extends Ys{constructor(e,t,r){super(),this.type=e,this._limit=t,this._limitType=r}static _create(e,t,r){return new Lo(e,t,r)}_apply(e){return new Le(e.firestore,e.converter,Wa(e._query,this._limit,this._limitType))}}function FS(n){return ug("limit",n),Lo._create("limit",n,"F")}function US(n){return ug("limitToLast",n),Lo._create("limitToLast",n,"L")}class Fo extends Ys{constructor(e,t,r){super(),this.type=e,this._docOrFields=t,this._inclusive=r}static _create(e,t,r){return new Fo(e,t,r)}_apply(e){const t=UI(e,this.type,this._docOrFields,this._inclusive);return new Le(e.firestore,e.converter,(function(s,i){return new an(s.path,s.collectionGroup,s.explicitOrderBy.slice(),s.filters.slice(),s.limit,s.limitType,i,s.endAt)})(e._query,t))}}function BS(...n){return Fo._create("startAt",n,!0)}function qS(...n){return Fo._create("startAfter",n,!1)}class Uo extends Ys{constructor(e,t,r){super(),this.type=e,this._docOrFields=t,this._inclusive=r}static _create(e,t,r){return new Uo(e,t,r)}_apply(e){const t=UI(e,this.type,this._docOrFields,this._inclusive);return new Le(e.firestore,e.converter,(function(s,i){return new an(s.path,s.collectionGroup,s.explicitOrderBy.slice(),s.filters.slice(),s.limit,s.limitType,s.startAt,i)})(e._query,t))}}function zS(...n){return Uo._create("endBefore",n,!1)}function GS(...n){return Uo._create("endAt",n,!0)}function UI(n,e,t,r){if(t[0]=X(t[0]),t[0]instanceof po)return(function(i,o,a,l,u){if(!l)throw new D(P.NOT_FOUND,`Can't use a DocumentSnapshot that doesn't exist for ${a}().`);const h=[];for(const f of ss(i))if(f.field.isKeyField())h.push(Tr(o,l.key));else{const _=l.data.field(f.field);if(Vc(_))throw new D(P.INVALID_ARGUMENT,'Invalid query. You are trying to start or end a query using a document for which the field "'+f.field+'" is an uncommitted server timestamp. (Since the value of this field is unknown, you cannot start/end a query with it.)');if(_===null){const g=f.field.canonicalString();throw new D(P.INVALID_ARGUMENT,`Invalid query. You are trying to start or end a query using a document for which the field '${g}' (used as the orderBy) does not exist.`)}h.push(_)}return new Ln(h,u)})(n._query,n.firestore._databaseId,e,t[0]._document,r);{const s=Mr(n.firestore);return(function(o,a,l,u,h,f){const _=o.explicitOrderBy;if(h.length>_.length)throw new D(P.INVALID_ARGUMENT,`Too many arguments provided to ${u}(). The number of arguments must be less than or equal to the number of orderBy() clauses`);const g=[];for(let w=0;w<h.length;w++){const R=h[w];if(_[w].field.isKeyField()){if(typeof R!="string")throw new D(P.INVALID_ARGUMENT,`Invalid query. Expected a string for document ID in ${u}(), but got a ${typeof R}`);if(!Th(o)&&R.indexOf("/")!==-1)throw new D(P.INVALID_ARGUMENT,`Invalid query. When querying a collection and ordering by documentId(), the value passed to ${u}() must be a plain document ID, but '${R}' contains a slash.`);const C=o.path.child(Z.fromString(R));if(!M.isDocumentKey(C))throw new D(P.INVALID_ARGUMENT,`Invalid query. When querying a collection group and ordering by documentId(), the value passed to ${u}() must result in a valid document path, but '${C}' is not because it contains an odd number of segments.`);const V=new M(C);g.push(Tr(a,V))}else{const C=VI(l,u,R);g.push(C)}}return new Ln(g,f)})(n._query,n.firestore._databaseId,s,e,t,r)}}function V_(n,e,t){if(typeof(t=X(t))=="string"){if(t==="")throw new D(P.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!Th(e)&&t.indexOf("/")!==-1)throw new D(P.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${t}' contains a '/' character.`);const r=e.path.child(Z.fromString(t));if(!M.isDocumentKey(r))throw new D(P.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${r}' is not because it has an odd number of segments (${r.length}).`);return Tr(n,new M(r))}if(t instanceof ue)return Tr(n,t._key);throw new D(P.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${Pc(t)}.`)}function O_(n,e){if(!Array.isArray(n)||n.length===0)throw new D(P.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`)}function BI(n,e){const t=(function(s,i){for(const o of s)for(const a of o.getFlattenedFilters())if(i.indexOf(a.op)>=0)return a.op;return null})(n.filters,(function(s){switch(s){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}})(e.op));if(t!==null)throw t===e.op?new D(P.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new D(P.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${t.toString()}' filters.`)}function qI(n,e){if(!(e instanceof Xs||e instanceof Fr))throw new D(P.INVALID_ARGUMENT,`Function ${n}() requires AppliableConstraints created with a call to 'where(...)', 'or(...)', or 'and(...)'.`)}class fd{convertValue(e,t="none"){switch(On(e)){case 0:return null;case 1:return e.booleanValue;case 2:return Te(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,t);case 5:return e.stringValue;case 6:return this.convertBytes(sn(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,t);case 11:return this.convertObject(e.mapValue,t);case 10:return this.convertVectorValue(e.mapValue);default:throw q(62114,{value:e})}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){const r={};return Wn(e,((s,i)=>{r[s]=this.convertValue(i,t)})),r}convertVectorValue(e){var r,s,i;const t=(i=(s=(r=e.fields)==null?void 0:r[Es].arrayValue)==null?void 0:s.values)==null?void 0:i.map((o=>Te(o.doubleValue)));return new wt(t)}convertGeoPoint(e){return new Ct(Te(e.latitude),Te(e.longitude))}convertArray(e,t){return(e.values||[]).map((r=>this.convertValue(r,t)))}convertServerTimestamp(e,t){switch(t){case"previous":const r=Oc(e);return r==null?null:this.convertValue(r,t);case"estimate":return this.convertTimestamp(io(e));default:return null}}convertTimestamp(e){const t=rn(e);return new ce(t.seconds,t.nanos)}convertDocumentKey(e,t){const r=Z.fromString(e);z(Ay(r),9688,{name:e});const s=new Vn(r.get(1),r.get(3)),i=new M(r.popFirst(5));return s.isEqual(t)||Ne(`Document ${i} contains a document reference within a different database (${s.projectId}/${s.database}) which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),i}}/**
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
 */function el(n,e,t){let r;return r=n?t&&(t.merge||t.mergeFields)?n.toFirestore(e,t):n.toFirestore(e):e,r}class pd extends fd{constructor(e){super(),this.firestore=e}convertBytes(e){return new it(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new ue(this.firestore,null,t)}}/**
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
 */function $S(n){return new Ds("sum",fo("sum",n))}function jS(n){return new Ds("avg",fo("average",n))}function zI(){return new Ds("count")}function WS(n,e){var t,r;return n instanceof Ds&&e instanceof Ds&&n.aggregateType===e.aggregateType&&((t=n._internalFieldPath)==null?void 0:t.canonicalString())===((r=e._internalFieldPath)==null?void 0:r.canonicalString())}function KS(n,e){return sd(n.query,e.query)&&en(n.data(),e.data())}/**
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
 *//**
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
 */const GI="NOT SUPPORTED";class Yt{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class dt extends po{constructor(e,t,r,s,i,o){super(e,t,r,s,o),this._firestore=e,this._firestoreImpl=e,this.metadata=i}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new $i(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const r=this._document.data.field(Jc("DocumentSnapshot.get",e));if(r!==null)return this._userDataWriter.convertValue(r,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new D(P.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=dt._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}}function HS(n,e,t){if(Vr(e,dt._jsonSchema)){if(e.bundle===GI)throw new D(P.INVALID_ARGUMENT,"The provided JSON object was created in a client environment, which is not supported.");const r=Or(n._databaseId),s=EI(e.bundle,r),i=s.Wu(),o=new Hh(s.getMetadata(),r);for(const h of i)o.Ga(h);const a=o.documents;if(a.length!==1)throw new D(P.INVALID_ARGUMENT,`Expected bundle data to contain 1 document, but it contains ${a.length} documents.`);const l=Uc(r,a[0].document),u=new M(Z.fromString(e.bundleName));return new dt(n,new pd(n),u,l,new Yt(!1,!1),t||null)}}dt._jsonSchemaVersion="firestore/documentSnapshot/1.0",dt._jsonSchema={type:Ve("string",dt._jsonSchemaVersion),bundleSource:Ve("string","DocumentSnapshot"),bundleName:Ve("string"),bundle:Ve("string")};class $i extends dt{data(e={}){return super.data(e)}}class ft{constructor(e,t,r,s){this._firestore=e,this._userDataWriter=t,this._snapshot=s,this.metadata=new Yt(s.hasPendingWrites,s.fromCache),this.query=r}get docs(){const e=[];return this.forEach((t=>e.push(t))),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach((r=>{e.call(t,new $i(this._firestore,this._userDataWriter,r.key,r,new Yt(this._snapshot.mutatedKeys.has(r.key),this._snapshot.fromCache),this.query.converter))}))}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new D(P.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=(function(s,i){if(s._snapshot.oldDocs.isEmpty()){let o=0;return s._snapshot.docChanges.map((a=>{const l=new $i(s._firestore,s._userDataWriter,a.doc.key,a.doc,new Yt(s._snapshot.mutatedKeys.has(a.doc.key),s._snapshot.fromCache),s.query.converter);return a.doc,{type:"added",doc:l,oldIndex:-1,newIndex:o++}}))}{let o=s._snapshot.oldDocs;return s._snapshot.docChanges.filter((a=>i||a.type!==3)).map((a=>{const l=new $i(s._firestore,s._userDataWriter,a.doc.key,a.doc,new Yt(s._snapshot.mutatedKeys.has(a.doc.key),s._snapshot.fromCache),s.query.converter);let u=-1,h=-1;return a.type!==0&&(u=o.indexOf(a.doc.key),o=o.delete(a.doc.key)),a.type!==1&&(o=o.add(a.doc),h=o.indexOf(a.doc.key)),{type:YS(a.type),doc:l,oldIndex:u,newIndex:h}}))}})(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new D(P.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=ft._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=Cc.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],r=[],s=[];return this.docs.forEach((i=>{i._document!==null&&(t.push(i._document),r.push(this._userDataWriter.convertObjectMap(i._document.data.value.mapValue.fields,"previous")),s.push(i.ref.path))})),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function QS(n,e,t){if(Vr(e,ft._jsonSchema)){if(e.bundle===GI)throw new D(P.INVALID_ARGUMENT,"The provided JSON object was created in a client environment, which is not supported.");const r=Or(n._databaseId),s=EI(e.bundle,r),i=s.Wu(),o=new Hh(s.getMetadata(),r);for(const _ of i)o.Ga(_);if(o.queries.length!==1)throw new D(P.INVALID_ARGUMENT,`Snapshot data expected 1 query but found ${o.queries.length} queries.`);const a=qc(o.queries[0].bundledQuery),l=o.documents;let u=new Ir;l.map((_=>{const g=Uc(r,_.document);u=u.add(g)}));const h=Pr.fromInitialDocuments(a,u,K(),!1,!1),f=new Le(n,t||null,a);return new ft(n,new pd(n),f,h)}}function YS(n){switch(n){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return q(61501,{type:n})}}function XS(n,e){return n instanceof dt&&e instanceof dt?n._firestore===e._firestore&&n._key.isEqual(e._key)&&(n._document===null?e._document===null:n._document.isEqual(e._document))&&n._converter===e._converter:n instanceof ft&&e instanceof ft&&n._firestore===e._firestore&&sd(n.query,e.query)&&n.metadata.isEqual(e.metadata)&&n._snapshot.isEqual(e._snapshot)}/**
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
 */function JS(n){n=te(n,ue);const e=te(n.firestore,fe);return yI(ve(e),n._key).then((t=>_d(e,n,t)))}ft._jsonSchemaVersion="firestore/querySnapshot/1.0",ft._jsonSchema={type:Ve("string",ft._jsonSchemaVersion),bundleSource:Ve("string","QuerySnapshot"),bundleName:Ve("string"),bundle:Ve("string")};class Xn extends fd{constructor(e){super(),this.firestore=e}convertBytes(e){return new it(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new ue(this.firestore,null,t)}}function ZS(n){n=te(n,ue);const e=te(n.firestore,fe),t=ve(e),r=new Xn(e);return oS(t,n._key).then((s=>new dt(e,r,n._key,s,new Yt(s!==null&&s.hasLocalMutations,!0),n.converter)))}function eC(n){n=te(n,ue);const e=te(n.firestore,fe);return yI(ve(e),n._key,{source:"server"}).then((t=>_d(e,n,t)))}function tC(n){n=te(n,Le);const e=te(n.firestore,fe),t=ve(e),r=new Xn(e);return FI(n._query),II(t,n._query).then((s=>new ft(e,r,n,s)))}function nC(n){n=te(n,Le);const e=te(n.firestore,fe),t=ve(e),r=new Xn(e);return aS(t,n._query).then((s=>new ft(e,r,n,s)))}function rC(n){n=te(n,Le);const e=te(n.firestore,fe),t=ve(e),r=new Xn(e);return II(t,n._query,{source:"server"}).then((s=>new ft(e,r,n,s)))}function sC(n,e,t){n=te(n,ue);const r=te(n.firestore,fe),s=el(n.converter,e,t);return Js(r,[Yc(Mr(r),"setDoc",n._key,s,n.converter!==null,t).toMutation(n._key,we.none())])}function iC(n,e,t,...r){n=te(n,ue);const s=te(n.firestore,fe),i=Mr(s);let o;return o=typeof(e=X(e))=="string"||e instanceof Qn?ud(i,"updateDoc",n._key,e,t,r):ld(i,"updateDoc",n._key,e),Js(s,[o.toMutation(n._key,we.exists(!0))])}function oC(n){return Js(te(n.firestore,fe),[new $s(n._key,we.none())])}function aC(n,e){const t=te(n.firestore,fe),r=AI(n),s=el(n.converter,e);return Js(t,[Yc(Mr(n.firestore),"addDoc",r._key,s,n.converter!==null,{}).toMutation(r._key,we.exists(!1))]).then((()=>r))}function Bu(n,...e){var l,u,h;n=X(n);let t={includeMetadataChanges:!1,source:"default"},r=0;typeof e[r]!="object"||is(e[r])||(t=e[r++]);const s={includeMetadataChanges:t.includeMetadataChanges,source:t.source};if(is(e[r])){const f=e[r];e[r]=(l=f.next)==null?void 0:l.bind(f),e[r+1]=(u=f.error)==null?void 0:u.bind(f),e[r+2]=(h=f.complete)==null?void 0:h.bind(f)}let i,o,a;if(n instanceof ue)o=te(n.firestore,fe),a=zs(n._key.path),i={next:f=>{e[r]&&e[r](_d(o,n,f))},error:e[r+1],complete:e[r+2]};else{const f=te(n,Le);o=te(f.firestore,fe),a=f._query;const _=new Xn(o);i={next:g=>{e[r]&&e[r](new ft(o,_,f,g))},error:e[r+1],complete:e[r+2]},FI(n._query)}return(function(_,g,w,R){const C=new Kc(R),V=new Kh(g,C,w);return _.asyncQueue.enqueueAndForget((async()=>$h(await ks(_),V))),()=>{C.Nu(),_.asyncQueue.enqueueAndForget((async()=>jh(await ks(_),V)))}})(ve(o),a,s,i)}function cC(n,e,...t){const r=X(n),s=(function(l){const u={bundle:"",bundleName:"",bundleSource:""},h=["bundle","bundleName","bundleSource"];for(const f of h){if(!(f in l)){u.error=`snapshotJson missing required field: ${f}`;break}const _=l[f];if(typeof _!="string"){u.error=`snapshotJson field '${f}' must be a string.`;break}if(_.length===0){u.error=`snapshotJson field '${f}' cannot be an empty string.`;break}f==="bundle"?u.bundle=_:f==="bundleName"?u.bundleName=_:f==="bundleSource"&&(u.bundleSource=_)}return u})(e);if(s.error)throw new D(P.INVALID_ARGUMENT,s.error);let i,o=0;if(typeof t[o]!="object"||is(t[o])||(i=t[o++]),s.bundleSource==="QuerySnapshot"){let a=null;if(typeof t[o]=="object"&&is(t[o])){const l=t[o++];a={next:l.next,error:l.error,complete:l.complete}}else a={next:t[o++],error:t[o++],complete:t[o++]};return(function(u,h,f,_,g){let w,R=!1;return Uu(u,h.bundle).then((()=>PI(u,h.bundleName))).then((V=>{V&&!R&&(g&&V.withConverter(g),w=Bu(V,f||{},_))})).catch((V=>(_.error&&_.error(V),()=>{}))),()=>{R||(R=!0,w&&w())}})(r,s,i,a,t[o])}if(s.bundleSource==="DocumentSnapshot"){let a=null;if(typeof t[o]=="object"&&is(t[o])){const l=t[o++];a={next:l.next,error:l.error,complete:l.complete}}else a={next:t[o++],error:t[o++],complete:t[o++]};return(function(u,h,f,_,g){let w,R=!1;return Uu(u,h.bundle).then((()=>{if(!R){const V=new ue(u,g||null,M.fromPath(h.bundleName));w=Bu(V,f||{},_)}})).catch((V=>(_.error&&_.error(V),()=>{}))),()=>{R||(R=!0,w&&w())}})(r,s,i,a,t[o])}throw new D(P.INVALID_ARGUMENT,`unsupported bundle source: ${s.bundleSource}`)}function lC(n,e){return lS(ve(n=te(n,fe)),is(e)?e:{next:e})}function Js(n,e){return(function(r,s){const i=new $e;return r.asyncQueue.enqueueAndForget((async()=>LR(await rd(r),s,i))),i.promise})(ve(n),e)}function _d(n,e,t){const r=t.docs.get(e._key),s=new Xn(n);return new dt(n,s,e._key,r,new Yt(t.hasPendingWrites,t.fromCache),e.converter)}function uC(n){return $I(n,{count:zI()})}function $I(n,e){const t=te(n.firestore,fe),r=ve(t),s=Sg(e,((i,o)=>new cy(o,i.aggregateType,i._internalFieldPath)));return cS(r,n._query,s).then((i=>(function(a,l,u){const h=new Xn(a);return new NI(l,h,u)})(t,n,i)))}class hC{constructor(e){this.kind="memory",this._onlineComponentProvider=Un.provider,this._offlineComponentProvider=e!=null&&e.garbageCollector?e.garbageCollector._offlineComponentProvider:{build:()=>new ed(void 0)}}toJSON(){return{kind:this.kind}}}class dC{constructor(e){let t;this.kind="persistent",e!=null&&e.tabManager?(e.tabManager._initialize(e),t=e.tabManager):(t=WI(void 0),t._initialize(e)),this._onlineComponentProvider=t._onlineComponentProvider,this._offlineComponentProvider=t._offlineComponentProvider}toJSON(){return{kind:this.kind}}}class fC{constructor(){this.kind="memoryEager",this._offlineComponentProvider=Ns.provider}toJSON(){return{kind:this.kind}}}class pC{constructor(e){this.kind="memoryLru",this._offlineComponentProvider={build:()=>new ed(e)}}toJSON(){return{kind:this.kind}}}function _C(){return new fC}function mC(n){return new pC(n==null?void 0:n.cacheSizeBytes)}function gC(n){return new hC(n)}function jI(n){return new dC(n)}class yC{constructor(e){this.forceOwnership=e,this.kind="persistentSingleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=Un.provider,this._offlineComponentProvider={build:t=>new td(t,e==null?void 0:e.cacheSizeBytes,this.forceOwnership)}}}class IC{constructor(){this.kind="PersistentMultipleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=Un.provider,this._offlineComponentProvider={build:t=>new pI(t,e==null?void 0:e.cacheSizeBytes)}}}function WI(n){return new yC(n==null?void 0:n.forceOwnership)}function KI(){return new IC}/**
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
 */const EC={maxAttempts:5};/**
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
 */class HI{constructor(e,t){this._firestore=e,this._commitHandler=t,this._mutations=[],this._committed=!1,this._dataReader=Mr(e)}set(e,t,r){this._verifyNotCommitted();const s=Rn(e,this._firestore),i=el(s.converter,t,r),o=Yc(this._dataReader,"WriteBatch.set",s._key,i,s.converter!==null,r);return this._mutations.push(o.toMutation(s._key,we.none())),this}update(e,t,r,...s){this._verifyNotCommitted();const i=Rn(e,this._firestore);let o;return o=typeof(t=X(t))=="string"||t instanceof Qn?ud(this._dataReader,"WriteBatch.update",i._key,t,r,s):ld(this._dataReader,"WriteBatch.update",i._key,t),this._mutations.push(o.toMutation(i._key,we.exists(!0))),this}delete(e){this._verifyNotCommitted();const t=Rn(e,this._firestore);return this._mutations=this._mutations.concat(new $s(t._key,we.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new D(P.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function Rn(n,e){if((n=X(n)).firestore!==e)throw new D(P.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return n}/**
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
 */class TC{constructor(e,t){this._firestore=e,this._transaction=t,this._dataReader=Mr(e)}get(e){const t=Rn(e,this._firestore),r=new pd(this._firestore);return this._transaction.lookup([t._key]).then((s=>{if(!s||s.length!==1)return q(24041);const i=s[0];if(i.isFoundDocument())return new po(this._firestore,r,i.key,i,t.converter);if(i.isNoDocument())return new po(this._firestore,r,t._key,null,t.converter);throw q(18433,{doc:i})}))}set(e,t,r){const s=Rn(e,this._firestore),i=el(s.converter,t,r),o=Yc(this._dataReader,"Transaction.set",s._key,i,s.converter!==null,r);return this._transaction.set(s._key,o),this}update(e,t,r,...s){const i=Rn(e,this._firestore);let o;return o=typeof(t=X(t))=="string"||t instanceof Qn?ud(this._dataReader,"Transaction.update",i._key,t,r,s):ld(this._dataReader,"Transaction.update",i._key,t),this._transaction.update(i._key,o),this}delete(e){const t=Rn(e,this._firestore);return this._transaction.delete(t._key),this}}/**
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
 */class QI extends TC{constructor(e,t){super(e,t),this._firestore=e}get(e){const t=Rn(e,this._firestore),r=new Xn(this._firestore);return super.get(e).then((s=>new dt(this._firestore,r,t._key,s._document,new Yt(!1,!1),t.converter)))}}function wC(n,e,t){n=te(n,fe);const r={...EC,...t};return(function(i){if(i.maxAttempts<1)throw new D(P.INVALID_ARGUMENT,"Max attempts must be at least 1")})(r),(function(i,o,a){const l=new $e;return i.asyncQueue.enqueueAndForget((async()=>{const u=await gI(i);new nS(i.asyncQueue,u,a,o,l).ju()})),l.promise})(ve(n),(s=>e(new QI(n,s))),r)}/**
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
 */function vC(){return new Mo("deleteField")}function AC(){return new id("serverTimestamp")}function bC(...n){return new od("arrayUnion",n)}function RC(...n){return new ad("arrayRemove",n)}function SC(n){return new cd("increment",n)}function CC(n){return new wt(n)}/**
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
 */function PC(n){return ve(n=te(n,fe)),new HI(n,(e=>Js(n,e)))}/**
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
 */function NC(n,e){const t=ve(n=te(n,fe));if(!t._uninitializedComponentsProvider||t._uninitializedComponentsProvider._offline.kind==="memory")return It("Cannot enable indexes when persistence is disabled"),Promise.resolve();const r=(function(i){const o=typeof i=="string"?(function(u){try{return JSON.parse(u)}catch(h){throw new D(P.INVALID_ARGUMENT,"Failed to parse JSON: "+(h==null?void 0:h.message))}})(i):i,a=[];if(Array.isArray(o.indexes))for(const l of o.indexes){const u=M_(l,"collectionGroup"),h=[];if(Array.isArray(l.fields))for(const f of l.fields){const _=Xc("setIndexConfiguration",M_(f,"fieldPath"));f.arrayConfig==="CONTAINS"?h.push(new gr(_,2)):f.order==="ASCENDING"?h.push(new gr(_,0)):f.order==="DESCENDING"&&h.push(new gr(_,1))}a.push(new ps(ps.UNKNOWN_ID,u,h,_s.empty()))}return a})(e);return dS(t,r)}function M_(n,e){if(typeof n[e]!="string")throw new D(P.INVALID_ARGUMENT,"Missing string value for: "+e);return n[e]}/**
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
 */class YI{constructor(e){this._firestore=e,this.type="PersistentCacheIndexManager"}}function kC(n){var s;n=te(n,fe);const e=L_.get(n);if(e)return e;if(((s=ve(n)._uninitializedComponentsProvider)==null?void 0:s._offline.kind)!=="persistent")return null;const r=new YI(n);return L_.set(n,r),r}function DC(n){XI(n,!0)}function xC(n){XI(n,!1)}function VC(n){pS(ve(n._firestore)).then((e=>x("deleting all persistent cache indexes succeeded"))).catch((e=>It("deleting all persistent cache indexes failed",e)))}function XI(n,e){fS(ve(n._firestore),e).then((t=>x(`setting persistent cache index auto creation isEnabled=${e} succeeded`))).catch((t=>It(`setting persistent cache index auto creation isEnabled=${e} failed`,t)))}const L_=new WeakMap;/**
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
 */function OC(n){var r;const e=ve(te(n.firestore,fe)),t=(r=e._onlineComponents)==null?void 0:r.datastore.serializer;return t===void 0?null:Bc(t,Xe(n._query)).ft}function MC(n,e){var i;const t=Sg(e,((o,a)=>new cy(a,o.aggregateType,o._internalFieldPath))),r=ve(te(n.firestore,fe)),s=(i=r._onlineComponents)==null?void 0:i.datastore.serializer;return s===void 0?null:Ey(s,Wg(n._query),t,!0).request}/**
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
 */class LC{constructor(){throw new Error("instances of this class should not be created")}static onExistenceFilterMismatch(e){return md.instance.onExistenceFilterMismatch(e)}}class md{constructor(){this.Mc=new Map}static get instance(){return ga||(ga=new md,(function(t){if(zi)throw new Error("a TestingHooksSpi instance is already set");zi=t})(ga)),ga}lt(e){this.Mc.forEach((t=>t(e)))}onExistenceFilterMismatch(e){const t=Symbol(),r=this.Mc;return r.set(t,e),()=>r.delete(t)}}let ga=null;(function(e,t=!0){(function(s){qs=s})(Bs),nn(new qt("firestore",((r,{instanceIdentifier:s,options:i})=>{const o=r.getProvider("app").getImmediate(),a=new fe(new Jv(r.getProvider("auth-internal")),new tA(o,r.getProvider("app-check-internal")),(function(u,h){if(!Object.prototype.hasOwnProperty.apply(u.options,["projectId"]))throw new D(P.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new Vn(u.options.projectId,h)})(o,s),o);return i={useFetchStreams:t,...i},a._setSettings(i),a}),"PUBLIC").setMultipleInstances(!0)),ht(_p,mp,e),ht(_p,mp,"esm2020")})();const vx=Object.freeze(Object.defineProperty({__proto__:null,AbstractUserDataWriter:fd,AggregateField:Ds,AggregateQuerySnapshot:NI,Bytes:it,CACHE_SIZE_UNLIMITED:yS,CollectionReference:St,DocumentReference:ue,DocumentSnapshot:dt,FieldPath:Qn,FieldValue:Yn,Firestore:fe,FirestoreError:D,GeoPoint:Ct,LoadBundleTask:bI,PersistentCacheIndexManager:YI,Query:Le,QueryCompositeFilterConstraint:Fr,QueryConstraint:Ys,QueryDocumentSnapshot:$i,QueryEndAtConstraint:Uo,QueryFieldFilterConstraint:Xs,QueryLimitConstraint:Lo,QueryOrderByConstraint:Zc,QuerySnapshot:ft,QueryStartAtConstraint:Fo,SnapshotMetadata:Yt,Timestamp:ce,Transaction:QI,VectorValue:wt,WriteBatch:HI,_AutoId:Cc,_ByteString:Re,_DatabaseId:Vn,_DocumentKey:M,_EmptyAppCheckTokenProvider:nA,_EmptyAuthCredentialsProvider:og,_FieldPath:Ie,_TestingHooks:LC,_cast:te,_debugAssert:Yv,_internalAggregationQueryToProtoRunAggregationQueryRequest:MC,_internalQueryToProtoQueryTarget:OC,_isBase64Available:UA,_logWarn:It,_validateIsNotUsedTogether:cg,addDoc:aC,aggregateFieldEqual:WS,aggregateQuerySnapshotEqual:KS,and:MS,arrayRemove:RC,arrayUnion:bC,average:jS,clearIndexedDbPersistence:wS,collection:_S,collectionGroup:mS,connectFirestoreEmulator:vI,count:zI,deleteAllPersistentCacheIndexes:VC,deleteDoc:oC,deleteField:vC,disableNetwork:bS,disablePersistentCacheIndexAutoCreation:xC,doc:AI,documentId:SS,documentSnapshotFromJSON:HS,enableIndexedDbPersistence:ES,enableMultiTabIndexedDbPersistence:TS,enableNetwork:AS,enablePersistentCacheIndexAutoCreation:DC,endAt:GS,endBefore:zS,ensureFirestoreConfigured:ve,executeWrite:Js,getAggregateFromServer:$I,getCountFromServer:uC,getDoc:JS,getDocFromCache:ZS,getDocFromServer:eC,getDocs:tC,getDocsFromCache:nC,getDocsFromServer:rC,getFirestore:IS,getPersistentCacheIndexManager:kC,increment:SC,initializeFirestore:RI,limit:FS,limitToLast:US,loadBundle:Uu,memoryEagerGarbageCollector:_C,memoryLocalCache:gC,memoryLruGarbageCollector:mC,namedQuery:PI,onSnapshot:Bu,onSnapshotResume:cC,onSnapshotsInSync:lC,or:OS,orderBy:LS,persistentLocalCache:jI,persistentMultipleTabManager:KI,persistentSingleTabManager:WI,query:xS,queryEqual:sd,querySnapshotFromJSON:QS,refEqual:gS,runTransaction:wC,serverTimestamp:AC,setDoc:sC,setIndexConfiguration:NC,setLogLevel:Qv,snapshotEqual:XS,startAfter:qS,startAt:BS,sum:$S,terminate:RS,updateDoc:iC,vector:CC,waitForPendingWrites:vS,where:VS,writeBatch:PC},Symbol.toStringTag,{value:"Module"}));/**
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
 */const JI="firebasestorage.googleapis.com",ZI="storageBucket",FC=120*1e3,UC=600*1e3,BC=1e3;/**
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
 */class Se extends $t{constructor(e,t,r=0){super(Yl(e),`Firebase Storage: ${t} (${Yl(e)})`),this.status_=r,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,Se.prototype)}get status(){return this.status_}set status(e){this.status_=e}_codeEquals(e){return Yl(e)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(e){this.customData.serverResponse=e,this.customData.serverResponse?this.message=`${this._baseMessage}
${this.customData.serverResponse}`:this.message=this._baseMessage}}var Ee;(function(n){n.UNKNOWN="unknown",n.OBJECT_NOT_FOUND="object-not-found",n.BUCKET_NOT_FOUND="bucket-not-found",n.PROJECT_NOT_FOUND="project-not-found",n.QUOTA_EXCEEDED="quota-exceeded",n.UNAUTHENTICATED="unauthenticated",n.UNAUTHORIZED="unauthorized",n.UNAUTHORIZED_APP="unauthorized-app",n.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",n.INVALID_CHECKSUM="invalid-checksum",n.CANCELED="canceled",n.INVALID_EVENT_NAME="invalid-event-name",n.INVALID_URL="invalid-url",n.INVALID_DEFAULT_BUCKET="invalid-default-bucket",n.NO_DEFAULT_BUCKET="no-default-bucket",n.CANNOT_SLICE_BLOB="cannot-slice-blob",n.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",n.NO_DOWNLOAD_URL="no-download-url",n.INVALID_ARGUMENT="invalid-argument",n.INVALID_ARGUMENT_COUNT="invalid-argument-count",n.APP_DELETED="app-deleted",n.INVALID_ROOT_OPERATION="invalid-root-operation",n.INVALID_FORMAT="invalid-format",n.INTERNAL_ERROR="internal-error",n.UNSUPPORTED_ENVIRONMENT="unsupported-environment"})(Ee||(Ee={}));function Yl(n){return"storage/"+n}function gd(){const n="An unknown error occurred, please check the error payload for server response.";return new Se(Ee.UNKNOWN,n)}function qC(n){return new Se(Ee.OBJECT_NOT_FOUND,"Object '"+n+"' does not exist.")}function zC(n){return new Se(Ee.QUOTA_EXCEEDED,"Quota for bucket '"+n+"' exceeded, please view quota on https://firebase.google.com/pricing/.")}function GC(){const n="User is not authenticated, please authenticate using Firebase Authentication and try again.";return new Se(Ee.UNAUTHENTICATED,n)}function $C(){return new Se(Ee.UNAUTHORIZED_APP,"This app does not have permission to access Firebase Storage on this project.")}function jC(n){return new Se(Ee.UNAUTHORIZED,"User does not have permission to access '"+n+"'.")}function eE(){return new Se(Ee.RETRY_LIMIT_EXCEEDED,"Max retry time for operation exceeded, please try again.")}function tE(){return new Se(Ee.CANCELED,"User canceled the upload/download.")}function WC(n){return new Se(Ee.INVALID_URL,"Invalid URL '"+n+"'.")}function KC(n){return new Se(Ee.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+n+"'.")}function HC(){return new Se(Ee.NO_DEFAULT_BUCKET,"No default bucket found. Did you set the '"+ZI+"' property when initializing the app?")}function nE(){return new Se(Ee.CANNOT_SLICE_BLOB,"Cannot slice blob for upload. Please retry the upload.")}function QC(){return new Se(Ee.SERVER_FILE_WRONG_SIZE,"Server recorded incorrect upload file size, please retry the upload.")}function YC(){return new Se(Ee.NO_DOWNLOAD_URL,"The given file does not have any download URLs.")}function XC(n){return new Se(Ee.UNSUPPORTED_ENVIRONMENT,`${n} is missing. Make sure to install the required polyfills. See https://firebase.google.com/docs/web/environments-js-sdk#polyfills for more information.`)}function qu(n){return new Se(Ee.INVALID_ARGUMENT,n)}function rE(){return new Se(Ee.APP_DELETED,"The Firebase app was deleted.")}function JC(n){return new Se(Ee.INVALID_ROOT_OPERATION,"The operation '"+n+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}function ji(n,e){return new Se(Ee.INVALID_FORMAT,"String does not match format '"+n+"': "+e)}function Ai(n){throw new Se(Ee.INTERNAL_ERROR,"Internal error: "+n)}/**
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
 */class yt{constructor(e,t){this.bucket=e,this.path_=t}get path(){return this.path_}get isRoot(){return this.path.length===0}fullServerUrl(){const e=encodeURIComponent;return"/b/"+e(this.bucket)+"/o/"+e(this.path)}bucketOnlyServerUrl(){return"/b/"+encodeURIComponent(this.bucket)+"/o"}static makeFromBucketSpec(e,t){let r;try{r=yt.makeFromUrl(e,t)}catch{return new yt(e,"")}if(r.path==="")return r;throw KC(e)}static makeFromUrl(e,t){let r=null;const s="([A-Za-z0-9.\\-_]+)";function i($){$.path.charAt($.path.length-1)==="/"&&($.path_=$.path_.slice(0,-1))}const o="(/(.*))?$",a=new RegExp("^gs://"+s+o,"i"),l={bucket:1,path:3};function u($){$.path_=decodeURIComponent($.path)}const h="v[A-Za-z0-9_]+",f=t.replace(/[.]/g,"\\."),_="(/([^?#]*).*)?$",g=new RegExp(`^https?://${f}/${h}/b/${s}/o${_}`,"i"),w={bucket:1,path:3},R=t===JI?"(?:storage.googleapis.com|storage.cloud.google.com)":t,C="([^?#]*)",V=new RegExp(`^https?://${R}/${s}/${C}`,"i"),L=[{regex:a,indices:l,postModify:i},{regex:g,indices:w,postModify:u},{regex:V,indices:{bucket:1,path:2},postModify:u}];for(let $=0;$<L.length;$++){const ne=L[$],H=ne.regex.exec(e);if(H){const T=H[ne.indices.bucket];let y=H[ne.indices.path];y||(y=""),r=new yt(T,y),ne.postModify(r);break}}if(r==null)throw WC(e);return r}}class ZC{constructor(e){this.promise_=Promise.reject(e)}getPromise(){return this.promise_}cancel(e=!1){}}/**
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
 */function eP(n,e,t){let r=1,s=null,i=null,o=!1,a=0;function l(){return a===2}let u=!1;function h(...C){u||(u=!0,e.apply(null,C))}function f(C){s=setTimeout(()=>{s=null,n(g,l())},C)}function _(){i&&clearTimeout(i)}function g(C,...V){if(u){_();return}if(C){_(),h.call(null,C,...V);return}if(l()||o){_(),h.call(null,C,...V);return}r<64&&(r*=2);let L;a===1?(a=2,L=0):L=(r+Math.random())*1e3,f(L)}let w=!1;function R(C){w||(w=!0,_(),!u&&(s!==null?(C||(a=2),clearTimeout(s),f(0)):C||(a=1)))}return f(0),i=setTimeout(()=>{o=!0,R(!0)},t),R}function tP(n){n(!1)}/**
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
 */function nP(n){return n!==void 0}function rP(n){return typeof n=="function"}function sP(n){return typeof n=="object"&&!Array.isArray(n)}function tl(n){return typeof n=="string"||n instanceof String}function F_(n){return yd()&&n instanceof Blob}function yd(){return typeof Blob<"u"}function U_(n,e,t,r){if(r<e)throw qu(`Invalid value for '${n}'. Expected ${e} or greater.`);if(r>t)throw qu(`Invalid value for '${n}'. Expected ${t} or less.`)}/**
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
 */function Zs(n,e,t){let r=e;return t==null&&(r=`https://${e}`),`${t}://${r}/v0${n}`}function sE(n){const e=encodeURIComponent;let t="?";for(const r in n)if(n.hasOwnProperty(r)){const s=e(r)+"="+e(n[r]);t=t+s+"&"}return t=t.slice(0,-1),t}var Er;(function(n){n[n.NO_ERROR=0]="NO_ERROR",n[n.NETWORK_ERROR=1]="NETWORK_ERROR",n[n.ABORT=2]="ABORT"})(Er||(Er={}));/**
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
 */function iE(n,e){const t=n>=500&&n<600,s=[408,429].indexOf(n)!==-1,i=e.indexOf(n)!==-1;return t||s||i}/**
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
 */class iP{constructor(e,t,r,s,i,o,a,l,u,h,f,_=!0,g=!1){this.url_=e,this.method_=t,this.headers_=r,this.body_=s,this.successCodes_=i,this.additionalRetryCodes_=o,this.callback_=a,this.errorCallback_=l,this.timeout_=u,this.progressCallback_=h,this.connectionFactory_=f,this.retry=_,this.isUsingEmulator=g,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((w,R)=>{this.resolve_=w,this.reject_=R,this.start_()})}start_(){const e=(r,s)=>{if(s){r(!1,new ya(!1,null,!0));return}const i=this.connectionFactory_();this.pendingConnection_=i;const o=a=>{const l=a.loaded,u=a.lengthComputable?a.total:-1;this.progressCallback_!==null&&this.progressCallback_(l,u)};this.progressCallback_!==null&&i.addUploadProgressListener(o),i.send(this.url_,this.method_,this.isUsingEmulator,this.body_,this.headers_).then(()=>{this.progressCallback_!==null&&i.removeUploadProgressListener(o),this.pendingConnection_=null;const a=i.getErrorCode()===Er.NO_ERROR,l=i.getStatus();if(!a||iE(l,this.additionalRetryCodes_)&&this.retry){const h=i.getErrorCode()===Er.ABORT;r(!1,new ya(!1,null,h));return}const u=this.successCodes_.indexOf(l)!==-1;r(!0,new ya(u,i))})},t=(r,s)=>{const i=this.resolve_,o=this.reject_,a=s.connection;if(s.wasSuccessCode)try{const l=this.callback_(a,a.getResponse());nP(l)?i(l):i()}catch(l){o(l)}else if(a!==null){const l=gd();l.serverResponse=a.getErrorText(),this.errorCallback_?o(this.errorCallback_(a,l)):o(l)}else if(s.canceled){const l=this.appDelete_?rE():tE();o(l)}else{const l=eE();o(l)}};this.canceled_?t(!1,new ya(!1,null,!0)):this.backoffId_=eP(e,t,this.timeout_)}getPromise(){return this.promise_}cancel(e){this.canceled_=!0,this.appDelete_=e||!1,this.backoffId_!==null&&tP(this.backoffId_),this.pendingConnection_!==null&&this.pendingConnection_.abort()}}class ya{constructor(e,t,r){this.wasSuccessCode=e,this.connection=t,this.canceled=!!r}}function oP(n,e){e!==null&&e.length>0&&(n.Authorization="Firebase "+e)}function aP(n,e){n["X-Firebase-Storage-Version"]="webjs/"+(e??"AppManager")}function cP(n,e){e&&(n["X-Firebase-GMPID"]=e)}function lP(n,e){e!==null&&(n["X-Firebase-AppCheck"]=e)}function uP(n,e,t,r,s,i,o=!0,a=!1){const l=sE(n.urlParams),u=n.url+l,h=Object.assign({},n.headers);return cP(h,e),oP(h,t),aP(h,i),lP(h,r),new iP(u,n.method,h,n.body,n.successCodes,n.additionalRetryCodes,n.handler,n.errorHandler,n.timeout,n.progressCallback,s,o,a)}/**
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
 */function hP(){return typeof BlobBuilder<"u"?BlobBuilder:typeof WebKitBlobBuilder<"u"?WebKitBlobBuilder:void 0}function dP(...n){const e=hP();if(e!==void 0){const t=new e;for(let r=0;r<n.length;r++)t.append(n[r]);return t.getBlob()}else{if(yd())return new Blob(n);throw new Se(Ee.UNSUPPORTED_ENVIRONMENT,"This browser doesn't seem to support creating Blobs")}}function fP(n,e,t){return n.webkitSlice?n.webkitSlice(e,t):n.mozSlice?n.mozSlice(e,t):n.slice?n.slice(e,t):null}/**
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
 */function pP(n){if(typeof atob>"u")throw XC("base-64");return atob(n)}/**
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
 */const Lt={RAW:"raw",BASE64:"base64",BASE64URL:"base64url",DATA_URL:"data_url"};class Xl{constructor(e,t){this.data=e,this.contentType=t||null}}function _P(n,e){switch(n){case Lt.RAW:return new Xl(oE(e));case Lt.BASE64:case Lt.BASE64URL:return new Xl(aE(n,e));case Lt.DATA_URL:return new Xl(gP(e),yP(e))}throw gd()}function oE(n){const e=[];for(let t=0;t<n.length;t++){let r=n.charCodeAt(t);if(r<=127)e.push(r);else if(r<=2047)e.push(192|r>>6,128|r&63);else if((r&64512)===55296)if(!(t<n.length-1&&(n.charCodeAt(t+1)&64512)===56320))e.push(239,191,189);else{const i=r,o=n.charCodeAt(++t);r=65536|(i&1023)<<10|o&1023,e.push(240|r>>18,128|r>>12&63,128|r>>6&63,128|r&63)}else(r&64512)===56320?e.push(239,191,189):e.push(224|r>>12,128|r>>6&63,128|r&63)}return new Uint8Array(e)}function mP(n){let e;try{e=decodeURIComponent(n)}catch{throw ji(Lt.DATA_URL,"Malformed data URL.")}return oE(e)}function aE(n,e){switch(n){case Lt.BASE64:{const s=e.indexOf("-")!==-1,i=e.indexOf("_")!==-1;if(s||i)throw ji(n,"Invalid character '"+(s?"-":"_")+"' found: is it base64url encoded?");break}case Lt.BASE64URL:{const s=e.indexOf("+")!==-1,i=e.indexOf("/")!==-1;if(s||i)throw ji(n,"Invalid character '"+(s?"+":"/")+"' found: is it base64 encoded?");e=e.replace(/-/g,"+").replace(/_/g,"/");break}}let t;try{t=pP(e)}catch(s){throw s.message.includes("polyfill")?s:ji(n,"Invalid character found")}const r=new Uint8Array(t.length);for(let s=0;s<t.length;s++)r[s]=t.charCodeAt(s);return r}class cE{constructor(e){this.base64=!1,this.contentType=null;const t=e.match(/^data:([^,]+)?,/);if(t===null)throw ji(Lt.DATA_URL,"Must be formatted 'data:[<mediatype>][;base64],<data>");const r=t[1]||null;r!=null&&(this.base64=IP(r,";base64"),this.contentType=this.base64?r.substring(0,r.length-7):r),this.rest=e.substring(e.indexOf(",")+1)}}function gP(n){const e=new cE(n);return e.base64?aE(Lt.BASE64,e.rest):mP(e.rest)}function yP(n){return new cE(n).contentType}function IP(n,e){return n.length>=e.length?n.substring(n.length-e.length)===e:!1}/**
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
 */class Ht{constructor(e,t){let r=0,s="";F_(e)?(this.data_=e,r=e.size,s=e.type):e instanceof ArrayBuffer?(t?this.data_=new Uint8Array(e):(this.data_=new Uint8Array(e.byteLength),this.data_.set(new Uint8Array(e))),r=this.data_.length):e instanceof Uint8Array&&(t?this.data_=e:(this.data_=new Uint8Array(e.length),this.data_.set(e)),r=e.length),this.size_=r,this.type_=s}size(){return this.size_}type(){return this.type_}slice(e,t){if(F_(this.data_)){const r=this.data_,s=fP(r,e,t);return s===null?null:new Ht(s)}else{const r=new Uint8Array(this.data_.buffer,e,t-e);return new Ht(r,!0)}}static getBlob(...e){if(yd()){const t=e.map(r=>r instanceof Ht?r.data_:r);return new Ht(dP.apply(null,t))}else{const t=e.map(o=>tl(o)?_P(Lt.RAW,o).data:o.data_);let r=0;t.forEach(o=>{r+=o.byteLength});const s=new Uint8Array(r);let i=0;return t.forEach(o=>{for(let a=0;a<o.length;a++)s[i++]=o[a]}),new Ht(s,!0)}}uploadData(){return this.data_}}/**
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
 */function lE(n){let e;try{e=JSON.parse(n)}catch{return null}return sP(e)?e:null}/**
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
 */function EP(n){if(n.length===0)return null;const e=n.lastIndexOf("/");return e===-1?"":n.slice(0,e)}function TP(n,e){const t=e.split("/").filter(r=>r.length>0).join("/");return n.length===0?t:n+"/"+t}function uE(n){const e=n.lastIndexOf("/",n.length-2);return e===-1?n:n.slice(e+1)}/**
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
 */function wP(n,e){return e}class tt{constructor(e,t,r,s){this.server=e,this.local=t||e,this.writable=!!r,this.xform=s||wP}}let Ia=null;function vP(n){return!tl(n)||n.length<2?n:uE(n)}function Id(){if(Ia)return Ia;const n=[];n.push(new tt("bucket")),n.push(new tt("generation")),n.push(new tt("metageneration")),n.push(new tt("name","fullPath",!0));function e(i,o){return vP(o)}const t=new tt("name");t.xform=e,n.push(t);function r(i,o){return o!==void 0?Number(o):o}const s=new tt("size");return s.xform=r,n.push(s),n.push(new tt("timeCreated")),n.push(new tt("updated")),n.push(new tt("md5Hash",null,!0)),n.push(new tt("cacheControl",null,!0)),n.push(new tt("contentDisposition",null,!0)),n.push(new tt("contentEncoding",null,!0)),n.push(new tt("contentLanguage",null,!0)),n.push(new tt("contentType",null,!0)),n.push(new tt("metadata","customMetadata",!0)),Ia=n,Ia}function AP(n,e){function t(){const r=n.bucket,s=n.fullPath,i=new yt(r,s);return e._makeStorageReference(i)}Object.defineProperty(n,"ref",{get:t})}function bP(n,e,t){const r={};r.type="file";const s=t.length;for(let i=0;i<s;i++){const o=t[i];r[o.local]=o.xform(r,e[o.server])}return AP(r,n),r}function hE(n,e,t){const r=lE(e);return r===null?null:bP(n,r,t)}function RP(n,e,t,r){const s=lE(e);if(s===null||!tl(s.downloadTokens))return null;const i=s.downloadTokens;if(i.length===0)return null;const o=encodeURIComponent;return i.split(",").map(u=>{const h=n.bucket,f=n.fullPath,_="/b/"+o(h)+"/o/"+o(f),g=Zs(_,t,r),w=sE({alt:"media",token:u});return g+w})[0]}function dE(n,e){const t={},r=e.length;for(let s=0;s<r;s++){const i=e[s];i.writable&&(t[i.server]=n[i.local])}return JSON.stringify(t)}class Ur{constructor(e,t,r,s){this.url=e,this.method=t,this.handler=r,this.timeout=s,this.urlParams={},this.headers={},this.body=null,this.errorHandler=null,this.progressCallback=null,this.successCodes=[200],this.additionalRetryCodes=[]}}/**
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
 */function Jt(n){if(!n)throw gd()}function Ed(n,e){function t(r,s){const i=hE(n,s,e);return Jt(i!==null),i}return t}function SP(n,e){function t(r,s){const i=hE(n,s,e);return Jt(i!==null),RP(i,s,n.host,n._protocol)}return t}function Bo(n){function e(t,r){let s;return t.getStatus()===401?t.getErrorText().includes("Firebase App Check token is invalid")?s=$C():s=GC():t.getStatus()===402?s=zC(n.bucket):t.getStatus()===403?s=jC(n.path):s=r,s.status=t.getStatus(),s.serverResponse=r.serverResponse,s}return e}function Td(n){const e=Bo(n);function t(r,s){let i=e(r,s);return r.getStatus()===404&&(i=qC(n.path)),i.serverResponse=s.serverResponse,i}return t}function CP(n,e,t){const r=e.fullServerUrl(),s=Zs(r,n.host,n._protocol),i="GET",o=n.maxOperationRetryTime,a=new Ur(s,i,Ed(n,t),o);return a.errorHandler=Td(e),a}function PP(n,e,t){const r=e.fullServerUrl(),s=Zs(r,n.host,n._protocol),i="GET",o=n.maxOperationRetryTime,a=new Ur(s,i,SP(n,t),o);return a.errorHandler=Td(e),a}function NP(n,e){const t=e.fullServerUrl(),r=Zs(t,n.host,n._protocol),s="DELETE",i=n.maxOperationRetryTime;function o(l,u){}const a=new Ur(r,s,o,i);return a.successCodes=[200,204],a.errorHandler=Td(e),a}function kP(n,e){return n&&n.contentType||e&&e.type()||"application/octet-stream"}function fE(n,e,t){const r=Object.assign({},t);return r.fullPath=n.path,r.size=e.size(),r.contentType||(r.contentType=kP(null,e)),r}function pE(n,e,t,r,s){const i=e.bucketOnlyServerUrl(),o={"X-Goog-Upload-Protocol":"multipart"};function a(){let L="";for(let $=0;$<2;$++)L=L+Math.random().toString().slice(2);return L}const l=a();o["Content-Type"]="multipart/related; boundary="+l;const u=fE(e,r,s),h=dE(u,t),f="--"+l+`\r
Content-Type: application/json; charset=utf-8\r
\r
`+h+`\r
--`+l+`\r
Content-Type: `+u.contentType+`\r
\r
`,_=`\r
--`+l+"--",g=Ht.getBlob(f,r,_);if(g===null)throw nE();const w={name:u.fullPath},R=Zs(i,n.host,n._protocol),C="POST",V=n.maxUploadRetryTime,B=new Ur(R,C,Ed(n,t),V);return B.urlParams=w,B.headers=o,B.body=g.uploadData(),B.errorHandler=Bo(e),B}class nc{constructor(e,t,r,s){this.current=e,this.total=t,this.finalized=!!r,this.metadata=s||null}}function wd(n,e){let t=null;try{t=n.getResponseHeader("X-Goog-Upload-Status")}catch{Jt(!1)}return Jt(!!t&&(e||["active"]).indexOf(t)!==-1),t}function DP(n,e,t,r,s){const i=e.bucketOnlyServerUrl(),o=fE(e,r,s),a={name:o.fullPath},l=Zs(i,n.host,n._protocol),u="POST",h={"X-Goog-Upload-Protocol":"resumable","X-Goog-Upload-Command":"start","X-Goog-Upload-Header-Content-Length":`${r.size()}`,"X-Goog-Upload-Header-Content-Type":o.contentType,"Content-Type":"application/json; charset=utf-8"},f=dE(o,t),_=n.maxUploadRetryTime;function g(R){wd(R);let C;try{C=R.getResponseHeader("X-Goog-Upload-URL")}catch{Jt(!1)}return Jt(tl(C)),C}const w=new Ur(l,u,g,_);return w.urlParams=a,w.headers=h,w.body=f,w.errorHandler=Bo(e),w}function xP(n,e,t,r){const s={"X-Goog-Upload-Command":"query"};function i(u){const h=wd(u,["active","final"]);let f=null;try{f=u.getResponseHeader("X-Goog-Upload-Size-Received")}catch{Jt(!1)}f||Jt(!1);const _=Number(f);return Jt(!isNaN(_)),new nc(_,r.size(),h==="final")}const o="POST",a=n.maxUploadRetryTime,l=new Ur(t,o,i,a);return l.headers=s,l.errorHandler=Bo(e),l}const B_=256*1024;function VP(n,e,t,r,s,i,o,a){const l=new nc(0,0);if(o?(l.current=o.current,l.total=o.total):(l.current=0,l.total=r.size()),r.size()!==l.total)throw QC();const u=l.total-l.current;let h=u;s>0&&(h=Math.min(h,s));const f=l.current,_=f+h;let g="";h===0?g="finalize":u===h?g="upload, finalize":g="upload";const w={"X-Goog-Upload-Command":g,"X-Goog-Upload-Offset":`${l.current}`},R=r.slice(f,_);if(R===null)throw nE();function C($,ne){const H=wd($,["active","final"]),T=l.current+h,y=r.size();let E;return H==="final"?E=Ed(e,i)($,ne):E=null,new nc(T,y,H==="final",E)}const V="POST",B=e.maxUploadRetryTime,L=new Ur(t,V,C,B);return L.headers=w,L.body=R.uploadData(),L.progressCallback=a||null,L.errorHandler=Bo(n),L}const st={RUNNING:"running",PAUSED:"paused",SUCCESS:"success",CANCELED:"canceled",ERROR:"error"};function Jl(n){switch(n){case"running":case"pausing":case"canceling":return st.RUNNING;case"paused":return st.PAUSED;case"success":return st.SUCCESS;case"canceled":return st.CANCELED;case"error":return st.ERROR;default:return st.ERROR}}/**
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
 */class OP{constructor(e,t,r){if(rP(e)||t!=null||r!=null)this.next=e,this.error=t??void 0,this.complete=r??void 0;else{const i=e;this.next=i.next,this.error=i.error,this.complete=i.complete}}}/**
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
 */function Xr(n){return(...e)=>{Promise.resolve().then(()=>n(...e))}}class MP{constructor(){this.sent_=!1,this.xhr_=new XMLHttpRequest,this.initXhr(),this.errorCode_=Er.NO_ERROR,this.sendPromise_=new Promise(e=>{this.xhr_.addEventListener("abort",()=>{this.errorCode_=Er.ABORT,e()}),this.xhr_.addEventListener("error",()=>{this.errorCode_=Er.NETWORK_ERROR,e()}),this.xhr_.addEventListener("load",()=>{e()})})}send(e,t,r,s,i){if(this.sent_)throw Ai("cannot .send() more than once");if(vt(e)&&r&&(this.xhr_.withCredentials=!0),this.sent_=!0,this.xhr_.open(t,e,!0),i!==void 0)for(const o in i)i.hasOwnProperty(o)&&this.xhr_.setRequestHeader(o,i[o].toString());return s!==void 0?this.xhr_.send(s):this.xhr_.send(),this.sendPromise_}getErrorCode(){if(!this.sent_)throw Ai("cannot .getErrorCode() before sending");return this.errorCode_}getStatus(){if(!this.sent_)throw Ai("cannot .getStatus() before sending");try{return this.xhr_.status}catch{return-1}}getResponse(){if(!this.sent_)throw Ai("cannot .getResponse() before sending");return this.xhr_.response}getErrorText(){if(!this.sent_)throw Ai("cannot .getErrorText() before sending");return this.xhr_.statusText}abort(){this.xhr_.abort()}getResponseHeader(e){return this.xhr_.getResponseHeader(e)}addUploadProgressListener(e){this.xhr_.upload!=null&&this.xhr_.upload.addEventListener("progress",e)}removeUploadProgressListener(e){this.xhr_.upload!=null&&this.xhr_.upload.removeEventListener("progress",e)}}class LP extends MP{initXhr(){this.xhr_.responseType="text"}}function An(){return new LP}/**
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
 */class FP{isExponentialBackoffExpired(){return this.sleepTime>this.maxSleepTime}constructor(e,t,r=null){this._transferred=0,this._needToFetchStatus=!1,this._needToFetchMetadata=!1,this._observers=[],this._error=void 0,this._uploadUrl=void 0,this._request=void 0,this._chunkMultiplier=1,this._resolve=void 0,this._reject=void 0,this._ref=e,this._blob=t,this._metadata=r,this._mappings=Id(),this._resumable=this._shouldDoResumable(this._blob),this._state="running",this._errorHandler=s=>{if(this._request=void 0,this._chunkMultiplier=1,s._codeEquals(Ee.CANCELED))this._needToFetchStatus=!0,this.completeTransitions_();else{const i=this.isExponentialBackoffExpired();if(iE(s.status,[]))if(i)s=eE();else{this.sleepTime=Math.max(this.sleepTime*2,BC),this._needToFetchStatus=!0,this.completeTransitions_();return}this._error=s,this._transition("error")}},this._metadataErrorHandler=s=>{this._request=void 0,s._codeEquals(Ee.CANCELED)?this.completeTransitions_():(this._error=s,this._transition("error"))},this.sleepTime=0,this.maxSleepTime=this._ref.storage.maxUploadRetryTime,this._promise=new Promise((s,i)=>{this._resolve=s,this._reject=i,this._start()}),this._promise.then(null,()=>{})}_makeProgressCallback(){const e=this._transferred;return t=>this._updateProgress(e+t)}_shouldDoResumable(e){return e.size()>256*1024}_start(){this._state==="running"&&this._request===void 0&&(this._resumable?this._uploadUrl===void 0?this._createResumable():this._needToFetchStatus?this._fetchStatus():this._needToFetchMetadata?this._fetchMetadata():this.pendingTimeout=setTimeout(()=>{this.pendingTimeout=void 0,this._continueUpload()},this.sleepTime):this._oneShotUpload())}_resolveToken(e){Promise.all([this._ref.storage._getAuthToken(),this._ref.storage._getAppCheckToken()]).then(([t,r])=>{switch(this._state){case"running":e(t,r);break;case"canceling":this._transition("canceled");break;case"pausing":this._transition("paused");break}})}_createResumable(){this._resolveToken((e,t)=>{const r=DP(this._ref.storage,this._ref._location,this._mappings,this._blob,this._metadata),s=this._ref.storage._makeRequest(r,An,e,t);this._request=s,s.getPromise().then(i=>{this._request=void 0,this._uploadUrl=i,this._needToFetchStatus=!1,this.completeTransitions_()},this._errorHandler)})}_fetchStatus(){const e=this._uploadUrl;this._resolveToken((t,r)=>{const s=xP(this._ref.storage,this._ref._location,e,this._blob),i=this._ref.storage._makeRequest(s,An,t,r);this._request=i,i.getPromise().then(o=>{o=o,this._request=void 0,this._updateProgress(o.current),this._needToFetchStatus=!1,o.finalized&&(this._needToFetchMetadata=!0),this.completeTransitions_()},this._errorHandler)})}_continueUpload(){const e=B_*this._chunkMultiplier,t=new nc(this._transferred,this._blob.size()),r=this._uploadUrl;this._resolveToken((s,i)=>{let o;try{o=VP(this._ref._location,this._ref.storage,r,this._blob,e,this._mappings,t,this._makeProgressCallback())}catch(l){this._error=l,this._transition("error");return}const a=this._ref.storage._makeRequest(o,An,s,i,!1);this._request=a,a.getPromise().then(l=>{this._increaseMultiplier(),this._request=void 0,this._updateProgress(l.current),l.finalized?(this._metadata=l.metadata,this._transition("success")):this.completeTransitions_()},this._errorHandler)})}_increaseMultiplier(){B_*this._chunkMultiplier*2<32*1024*1024&&(this._chunkMultiplier*=2)}_fetchMetadata(){this._resolveToken((e,t)=>{const r=CP(this._ref.storage,this._ref._location,this._mappings),s=this._ref.storage._makeRequest(r,An,e,t);this._request=s,s.getPromise().then(i=>{this._request=void 0,this._metadata=i,this._transition("success")},this._metadataErrorHandler)})}_oneShotUpload(){this._resolveToken((e,t)=>{const r=pE(this._ref.storage,this._ref._location,this._mappings,this._blob,this._metadata),s=this._ref.storage._makeRequest(r,An,e,t);this._request=s,s.getPromise().then(i=>{this._request=void 0,this._metadata=i,this._updateProgress(this._blob.size()),this._transition("success")},this._errorHandler)})}_updateProgress(e){const t=this._transferred;this._transferred=e,this._transferred!==t&&this._notifyObservers()}_transition(e){if(this._state!==e)switch(e){case"canceling":case"pausing":this._state=e,this._request!==void 0?this._request.cancel():this.pendingTimeout&&(clearTimeout(this.pendingTimeout),this.pendingTimeout=void 0,this.completeTransitions_());break;case"running":const t=this._state==="paused";this._state=e,t&&(this._notifyObservers(),this._start());break;case"paused":this._state=e,this._notifyObservers();break;case"canceled":this._error=tE(),this._state=e,this._notifyObservers();break;case"error":this._state=e,this._notifyObservers();break;case"success":this._state=e,this._notifyObservers();break}}completeTransitions_(){switch(this._state){case"pausing":this._transition("paused");break;case"canceling":this._transition("canceled");break;case"running":this._start();break}}get snapshot(){const e=Jl(this._state);return{bytesTransferred:this._transferred,totalBytes:this._blob.size(),state:e,metadata:this._metadata,task:this,ref:this._ref}}on(e,t,r,s){const i=new OP(t||void 0,r||void 0,s||void 0);return this._addObserver(i),()=>{this._removeObserver(i)}}then(e,t){return this._promise.then(e,t)}catch(e){return this.then(null,e)}_addObserver(e){this._observers.push(e),this._notifyObserver(e)}_removeObserver(e){const t=this._observers.indexOf(e);t!==-1&&this._observers.splice(t,1)}_notifyObservers(){this._finishPromise(),this._observers.slice().forEach(t=>{this._notifyObserver(t)})}_finishPromise(){if(this._resolve!==void 0){let e=!0;switch(Jl(this._state)){case st.SUCCESS:Xr(this._resolve.bind(null,this.snapshot))();break;case st.CANCELED:case st.ERROR:const t=this._reject;Xr(t.bind(null,this._error))();break;default:e=!1;break}e&&(this._resolve=void 0,this._reject=void 0)}}_notifyObserver(e){switch(Jl(this._state)){case st.RUNNING:case st.PAUSED:e.next&&Xr(e.next.bind(e,this.snapshot))();break;case st.SUCCESS:e.complete&&Xr(e.complete.bind(e))();break;case st.CANCELED:case st.ERROR:e.error&&Xr(e.error.bind(e,this._error))();break;default:e.error&&Xr(e.error.bind(e,this._error))()}}resume(){const e=this._state==="paused"||this._state==="pausing";return e&&this._transition("running"),e}pause(){const e=this._state==="running";return e&&this._transition("pausing"),e}cancel(){const e=this._state==="running"||this._state==="pausing";return e&&this._transition("canceling"),e}}/**
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
 */class Nr{constructor(e,t){this._service=e,t instanceof yt?this._location=t:this._location=yt.makeFromUrl(t,e.host)}toString(){return"gs://"+this._location.bucket+"/"+this._location.path}_newRef(e,t){return new Nr(e,t)}get root(){const e=new yt(this._location.bucket,"");return this._newRef(this._service,e)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return uE(this._location.path)}get storage(){return this._service}get parent(){const e=EP(this._location.path);if(e===null)return null;const t=new yt(this._location.bucket,e);return new Nr(this._service,t)}_throwIfRoot(e){if(this._location.path==="")throw JC(e)}}function UP(n,e,t){n._throwIfRoot("uploadBytes");const r=pE(n.storage,n._location,Id(),new Ht(e,!0),t);return n.storage.makeRequestWithTokens(r,An).then(s=>({metadata:s,ref:n}))}function BP(n,e,t){return n._throwIfRoot("uploadBytesResumable"),new FP(n,new Ht(e),t)}function qP(n){n._throwIfRoot("getDownloadURL");const e=PP(n.storage,n._location,Id());return n.storage.makeRequestWithTokens(e,An).then(t=>{if(t===null)throw YC();return t})}function zP(n){n._throwIfRoot("deleteObject");const e=NP(n.storage,n._location);return n.storage.makeRequestWithTokens(e,An)}function GP(n,e){const t=TP(n._location.path,e),r=new yt(n._location.bucket,t);return new Nr(n.storage,r)}/**
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
 */function $P(n){return/^[A-Za-z]+:\/\//.test(n)}function jP(n,e){return new Nr(n,e)}function _E(n,e){if(n instanceof vd){const t=n;if(t._bucket==null)throw HC();const r=new Nr(t,t._bucket);return e!=null?_E(r,e):r}else return e!==void 0?GP(n,e):n}function WP(n,e){if(e&&$P(e)){if(n instanceof vd)return jP(n,e);throw qu("To use ref(service, url), the first argument must be a Storage instance.")}else return _E(n,e)}function q_(n,e){const t=e==null?void 0:e[ZI];return t==null?null:yt.makeFromBucketSpec(t,n)}function KP(n,e,t,r={}){n.host=`${e}:${t}`;const s=vt(e);s&&(Ao(`https://${n.host}/b`),Ac("Storage",!0)),n._isUsingEmulator=!0,n._protocol=s?"https":"http";const{mockUserToken:i}=r;i&&(n._overrideAuthToken=typeof i=="string"?i:ah(i,n.app.options.projectId))}class vd{constructor(e,t,r,s,i,o=!1){this.app=e,this._authProvider=t,this._appCheckProvider=r,this._url=s,this._firebaseVersion=i,this._isUsingEmulator=o,this._bucket=null,this._host=JI,this._protocol="https",this._appId=null,this._deleted=!1,this._maxOperationRetryTime=FC,this._maxUploadRetryTime=UC,this._requests=new Set,s!=null?this._bucket=yt.makeFromBucketSpec(s,this._host):this._bucket=q_(this._host,this.app.options)}get host(){return this._host}set host(e){this._host=e,this._url!=null?this._bucket=yt.makeFromBucketSpec(this._url,e):this._bucket=q_(e,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(e){U_("time",0,Number.POSITIVE_INFINITY,e),this._maxUploadRetryTime=e}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(e){U_("time",0,Number.POSITIVE_INFINITY,e),this._maxOperationRetryTime=e}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;const e=this._authProvider.getImmediate({optional:!0});if(e){const t=await e.getToken();if(t!==null)return t.accessToken}return null}async _getAppCheckToken(){if(Vt(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=this._appCheckProvider.getImmediate({optional:!0});return e?(await e.getToken()).token:null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(e=>e.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(e){return new Nr(this,e)}_makeRequest(e,t,r,s,i=!0){if(this._deleted)return new ZC(rE());{const o=uP(e,this._appId,r,s,t,this._firebaseVersion,i,this._isUsingEmulator);return this._requests.add(o),o.getPromise().then(()=>this._requests.delete(o),()=>this._requests.delete(o)),o}}async makeRequestWithTokens(e,t){const[r,s]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(e,t,r,s).getPromise()}}const z_="@firebase/storage",G_="0.14.0";/**
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
 */const mE="storage";function Ax(n,e,t){return n=X(n),UP(n,e,t)}function bx(n,e,t){return n=X(n),BP(n,e,t)}function Rx(n){return n=X(n),qP(n)}function Sx(n){return n=X(n),zP(n)}function Cx(n,e){return n=X(n),WP(n,e)}function HP(n=Sc(),e){n=X(n);const r=Us(n,mE).getImmediate({identifier:e}),s=vc("storage");return s&&QP(r,...s),r}function QP(n,e,t,r={}){KP(n,e,t,r)}function YP(n,{instanceIdentifier:e}){const t=n.getProvider("app").getImmediate(),r=n.getProvider("auth-internal"),s=n.getProvider("app-check-internal");return new vd(t,r,s,e,Bs)}function XP(){nn(new qt(mE,YP,"PUBLIC").setMultipleInstances(!0)),ht(z_,G_,""),ht(z_,G_,"esm2020")}XP();/**
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
 */const JP="type.googleapis.com/google.protobuf.Int64Value",ZP="type.googleapis.com/google.protobuf.UInt64Value";function gE(n,e){const t={};for(const r in n)n.hasOwnProperty(r)&&(t[r]=e(n[r]));return t}function rc(n){if(n==null)return null;if(n instanceof Number&&(n=n.valueOf()),typeof n=="number"&&isFinite(n)||n===!0||n===!1||Object.prototype.toString.call(n)==="[object String]")return n;if(n instanceof Date)return n.toISOString();if(Array.isArray(n))return n.map(e=>rc(e));if(typeof n=="function"||typeof n=="object")return gE(n,e=>rc(e));throw new Error("Data cannot be encoded in JSON: "+n)}function xs(n){if(n==null)return n;if(n["@type"])switch(n["@type"]){case JP:case ZP:{const e=Number(n.value);if(isNaN(e))throw new Error("Data cannot be decoded from JSON: "+n);return e}default:throw new Error("Data cannot be decoded from JSON: "+n)}return Array.isArray(n)?n.map(e=>xs(e)):typeof n=="function"||typeof n=="object"?gE(n,e=>xs(e)):n}/**
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
 */const Ad="functions";/**
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
 */const $_={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class lt extends $t{constructor(e,t,r){super(`${Ad}/${e}`,t||""),this.details=r,Object.setPrototypeOf(this,lt.prototype)}}function eN(n){if(n>=200&&n<300)return"ok";switch(n){case 0:return"internal";case 400:return"invalid-argument";case 401:return"unauthenticated";case 403:return"permission-denied";case 404:return"not-found";case 409:return"aborted";case 429:return"resource-exhausted";case 499:return"cancelled";case 500:return"internal";case 501:return"unimplemented";case 503:return"unavailable";case 504:return"deadline-exceeded"}return"unknown"}function sc(n,e){let t=eN(n),r=t,s;try{const i=e&&e.error;if(i){const o=i.status;if(typeof o=="string"){if(!$_[o])return new lt("internal","internal");t=$_[o],r=o}const a=i.message;typeof a=="string"&&(r=a),s=i.details,s!==void 0&&(s=xs(s))}}catch{}return t==="ok"?null:new lt(t,r,s)}/**
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
 */class tN{constructor(e,t,r,s){this.app=e,this.auth=null,this.messaging=null,this.appCheck=null,this.serverAppAppCheckToken=null,Vt(e)&&e.settings.appCheckToken&&(this.serverAppAppCheckToken=e.settings.appCheckToken),this.auth=t.getImmediate({optional:!0}),this.messaging=r.getImmediate({optional:!0}),this.auth||t.get().then(i=>this.auth=i,()=>{}),this.messaging||r.get().then(i=>this.messaging=i,()=>{}),this.appCheck||s==null||s.get().then(i=>this.appCheck=i,()=>{})}async getAuthToken(){if(this.auth)try{const e=await this.auth.getToken();return e==null?void 0:e.accessToken}catch{return}}async getMessagingToken(){if(!(!this.messaging||!("Notification"in self)||Notification.permission!=="granted"))try{return await this.messaging.getToken()}catch{return}}async getAppCheckToken(e){if(this.serverAppAppCheckToken)return this.serverAppAppCheckToken;if(this.appCheck){const t=e?await this.appCheck.getLimitedUseToken():await this.appCheck.getToken();return t.error?null:t.token}return null}async getContext(e){const t=await this.getAuthToken(),r=await this.getMessagingToken(),s=await this.getAppCheckToken(e);return{authToken:t,messagingToken:r,appCheckToken:s}}}/**
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
 */const zu="us-central1",nN=/^data: (.*?)(?:\n|$)/;function rN(n){let e=null;return{promise:new Promise((t,r)=>{e=setTimeout(()=>{r(new lt("deadline-exceeded","deadline-exceeded"))},n)}),cancel:()=>{e&&clearTimeout(e)}}}class sN{constructor(e,t,r,s,i=zu,o=(...a)=>fetch(...a)){this.app=e,this.fetchImpl=o,this.emulatorOrigin=null,this.contextProvider=new tN(e,t,r,s),this.cancelAllRequests=new Promise(a=>{this.deleteService=()=>Promise.resolve(a())});try{const a=new URL(i);this.customDomain=a.origin+(a.pathname==="/"?"":a.pathname),this.region=zu}catch{this.customDomain=null,this.region=i}}_delete(){return this.deleteService()}_url(e){const t=this.app.options.projectId;return this.emulatorOrigin!==null?`${this.emulatorOrigin}/${t}/${this.region}/${e}`:this.customDomain!==null?`${this.customDomain}/${e}`:`https://${this.region}-${t}.cloudfunctions.net/${e}`}}function iN(n,e,t){const r=vt(e);n.emulatorOrigin=`http${r?"s":""}://${e}:${t}`,r&&(Ao(n.emulatorOrigin+"/backends"),Ac("Functions",!0))}function oN(n,e,t){const r=s=>cN(n,e,s,t||{});return r.stream=(s,i)=>uN(n,e,s,i),r}function yE(n){return n.emulatorOrigin&&vt(n.emulatorOrigin)?"include":void 0}async function aN(n,e,t,r,s){t["Content-Type"]="application/json";let i;try{i=await r(n,{method:"POST",body:JSON.stringify(e),headers:t,credentials:yE(s)})}catch{return{status:0,json:null}}let o=null;try{o=await i.json()}catch{}return{status:i.status,json:o}}async function IE(n,e){const t={},r=await n.contextProvider.getContext(e.limitedUseAppCheckTokens);return r.authToken&&(t.Authorization="Bearer "+r.authToken),r.messagingToken&&(t["Firebase-Instance-ID-Token"]=r.messagingToken),r.appCheckToken!==null&&(t["X-Firebase-AppCheck"]=r.appCheckToken),t}function cN(n,e,t,r){const s=n._url(e);return lN(n,s,t,r)}async function lN(n,e,t,r){t=rc(t);const s={data:t},i=await IE(n,r),o=r.timeout||7e4,a=rN(o),l=await Promise.race([aN(e,s,i,n.fetchImpl,n),a.promise,n.cancelAllRequests]);if(a.cancel(),!l)throw new lt("cancelled","Firebase Functions instance was deleted.");const u=sc(l.status,l.json);if(u)throw u;if(!l.json)throw new lt("internal","Response is not valid JSON object.");let h=l.json.data;if(typeof h>"u"&&(h=l.json.result),typeof h>"u")throw new lt("internal","Response is missing data field.");return{data:xs(h)}}function uN(n,e,t,r){const s=n._url(e);return hN(n,s,t,r||{})}async function hN(n,e,t,r){var _;t=rc(t);const s={data:t},i=await IE(n,r);i["Content-Type"]="application/json",i.Accept="text/event-stream";let o;try{o=await n.fetchImpl(e,{method:"POST",body:JSON.stringify(s),headers:i,signal:r==null?void 0:r.signal,credentials:yE(n)})}catch(g){if(g instanceof Error&&g.name==="AbortError"){const R=new lt("cancelled","Request was cancelled.");return{data:Promise.reject(R),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(R)}}}}}}const w=sc(0,null);return{data:Promise.reject(w),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(w)}}}}}}let a,l;const u=new Promise((g,w)=>{a=g,l=w});(_=r==null?void 0:r.signal)==null||_.addEventListener("abort",()=>{const g=new lt("cancelled","Request was cancelled.");l(g)});const h=o.body.getReader(),f=dN(h,a,l,r==null?void 0:r.signal);return{stream:{[Symbol.asyncIterator](){const g=f.getReader();return{async next(){const{value:w,done:R}=await g.read();return{value:w,done:R}},async return(){return await g.cancel(),{done:!0,value:void 0}}}}},data:u}}function dN(n,e,t,r){const s=(o,a)=>{const l=o.match(nN);if(!l)return;const u=l[1];try{const h=JSON.parse(u);if("result"in h){e(xs(h.result));return}if("message"in h){a.enqueue(xs(h.message));return}if("error"in h){const f=sc(0,h);a.error(f),t(f);return}}catch(h){if(h instanceof lt){a.error(h),t(h);return}}},i=new TextDecoder;return new ReadableStream({start(o){let a="";return l();async function l(){if(r!=null&&r.aborted){const u=new lt("cancelled","Request was cancelled");return o.error(u),t(u),Promise.resolve()}try{const{value:u,done:h}=await n.read();if(h){a.trim()&&s(a.trim(),o),o.close();return}if(r!=null&&r.aborted){const _=new lt("cancelled","Request was cancelled");o.error(_),t(_),await n.cancel();return}a+=i.decode(u,{stream:!0});const f=a.split(`
`);a=f.pop()||"";for(const _ of f)_.trim()&&s(_.trim(),o);return l()}catch(u){const h=u instanceof lt?u:sc(0,null);o.error(h),t(h)}}},cancel(){return n.cancel()}})}const j_="@firebase/functions",W_="0.13.1";/**
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
 */const fN="auth-internal",pN="app-check-internal",_N="messaging-internal";function mN(n){const e=(t,{instanceIdentifier:r})=>{const s=t.getProvider("app").getImmediate(),i=t.getProvider(fN),o=t.getProvider(_N),a=t.getProvider(pN);return new sN(s,i,o,a,r)};nn(new qt(Ad,e,"PUBLIC").setMultipleInstances(!0)),ht(j_,W_,n),ht(j_,W_,"esm2020")}/**
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
 */function gN(n=Sc(),e=zu){const r=Us(X(n),Ad).getImmediate({identifier:e}),s=vc("functions");return s&&yN(r,...s),r}function yN(n,e,t){iN(X(n),e,t)}function Px(n,e,t){return oN(X(n),e,t)}mN();var K_={};const H_="@firebase/database",Q_="1.1.0";/**
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
 */let EE="";function IN(n){EE=n}/**
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
 */class EN{constructor(e){this.domStorage_=e,this.prefix_="firebase:"}set(e,t){t==null?this.domStorage_.removeItem(this.prefixedName_(e)):this.domStorage_.setItem(this.prefixedName_(e),Me(t))}get(e){const t=this.domStorage_.getItem(this.prefixedName_(e));return t==null?null:Zi(t)}remove(e){this.domStorage_.removeItem(this.prefixedName_(e))}prefixedName_(e){return this.prefix_+e}toString(){return this.domStorage_.toString()}}/**
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
 */class TN{constructor(){this.cache_={},this.isInMemoryStorage=!0}set(e,t){t==null?delete this.cache_[e]:this.cache_[e]=t}get(e){return jt(this.cache_,e)?this.cache_[e]:null}remove(e){delete this.cache_[e]}}/**
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
 */const TE=function(n){try{if(typeof window<"u"&&typeof window[n]<"u"){const e=window[n];return e.setItem("firebase:sentinel","cache"),e.removeItem("firebase:sentinel"),new EN(e)}}catch{}return new TN},pr=TE("localStorage"),wN=TE("sessionStorage");/**
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
 */const os=new Rc("@firebase/database"),vN=(function(){let n=1;return function(){return n++}})(),wE=function(n){const e=Hw(n),t=new $w;t.update(e);const r=t.digest();return oh.encodeByteArray(r)},qo=function(...n){let e="";for(let t=0;t<n.length;t++){const r=n[t];Array.isArray(r)||r&&typeof r=="object"&&typeof r.length=="number"?e+=qo.apply(null,r):typeof r=="object"?e+=Me(r):e+=r,e+=" "}return e};let Wi=null,Y_=!0;const AN=function(n,e){O(!0,"Can't turn on custom loggers persistently."),os.logLevel=re.VERBOSE,Wi=os.log.bind(os)},je=function(...n){if(Y_===!0&&(Y_=!1,Wi===null&&wN.get("logging_enabled")===!0&&AN()),Wi){const e=qo.apply(null,n);Wi(e)}},zo=function(n){return function(...e){je(n,...e)}},Gu=function(...n){const e="FIREBASE INTERNAL ERROR: "+qo(...n);os.error(e)},on=function(...n){const e=`FIREBASE FATAL ERROR: ${qo(...n)}`;throw os.error(e),new Error(e)},pt=function(...n){const e="FIREBASE WARNING: "+qo(...n);os.warn(e)},bN=function(){typeof window<"u"&&window.location&&window.location.protocol&&window.location.protocol.indexOf("https:")!==-1&&pt("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().")},nl=function(n){return typeof n=="number"&&(n!==n||n===Number.POSITIVE_INFINITY||n===Number.NEGATIVE_INFINITY)},RN=function(n){if(document.readyState==="complete")n();else{let e=!1;const t=function(){if(!document.body){setTimeout(t,Math.floor(10));return}e||(e=!0,n())};document.addEventListener?(document.addEventListener("DOMContentLoaded",t,!1),window.addEventListener("load",t,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",()=>{document.readyState==="complete"&&t()}),window.attachEvent("onload",t))}},Vs="[MIN_NAME]",kr="[MAX_NAME]",Br=function(n,e){if(n===e)return 0;if(n===Vs||e===kr)return-1;if(e===Vs||n===kr)return 1;{const t=X_(n),r=X_(e);return t!==null?r!==null?t-r===0?n.length-e.length:t-r:-1:r!==null?1:n<e?-1:1}},SN=function(n,e){return n===e?0:n<e?-1:1},bi=function(n,e){if(e&&n in e)return e[n];throw new Error("Missing required key ("+n+") in object: "+Me(e))},bd=function(n){if(typeof n!="object"||n===null)return Me(n);const e=[];for(const r in n)e.push(r);e.sort();let t="{";for(let r=0;r<e.length;r++)r!==0&&(t+=","),t+=Me(e[r]),t+=":",t+=bd(n[e[r]]);return t+="}",t},vE=function(n,e){const t=n.length;if(t<=e)return[n];const r=[];for(let s=0;s<t;s+=e)s+e>t?r.push(n.substring(s,t)):r.push(n.substring(s,s+e));return r};function Je(n,e){for(const t in n)n.hasOwnProperty(t)&&e(t,n[t])}const AE=function(n){O(!nl(n),"Invalid JSON number");const e=11,t=52,r=(1<<e-1)-1;let s,i,o,a,l;n===0?(i=0,o=0,s=1/n===-1/0?1:0):(s=n<0,n=Math.abs(n),n>=Math.pow(2,1-r)?(a=Math.min(Math.floor(Math.log(n)/Math.LN2),r),i=a+r,o=Math.round(n*Math.pow(2,t-a)-Math.pow(2,t))):(i=0,o=Math.round(n/Math.pow(2,1-r-t))));const u=[];for(l=t;l;l-=1)u.push(o%2?1:0),o=Math.floor(o/2);for(l=e;l;l-=1)u.push(i%2?1:0),i=Math.floor(i/2);u.push(s?1:0),u.reverse();const h=u.join("");let f="";for(l=0;l<64;l+=8){let _=parseInt(h.substr(l,8),2).toString(16);_.length===1&&(_="0"+_),f=f+_}return f.toLowerCase()},CN=function(){return!!(typeof window=="object"&&window.chrome&&window.chrome.extension&&!/^chrome/.test(window.location.href))},PN=function(){return typeof Windows=="object"&&typeof Windows.UI=="object"};function NN(n,e){let t="Unknown Error";n==="too_big"?t="The data requested exceeds the maximum size that can be accessed with a single request.":n==="permission_denied"?t="Client doesn't have permission to access the desired data.":n==="unavailable"&&(t="The service is unavailable");const r=new Error(n+" at "+e._path.toString()+": "+t);return r.code=n.toUpperCase(),r}const kN=new RegExp("^-?(0*)\\d{1,10}$"),DN=-2147483648,xN=2147483647,X_=function(n){if(kN.test(n)){const e=Number(n);if(e>=DN&&e<=xN)return e}return null},ei=function(n){try{n()}catch(e){setTimeout(()=>{const t=e.stack||"";throw pt("Exception was thrown by user callback.",t),e},Math.floor(0))}},VN=function(){return(typeof window=="object"&&window.navigator&&window.navigator.userAgent||"").search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i)>=0},Ki=function(n,e){const t=setTimeout(n,e);return typeof t=="number"&&typeof Deno<"u"&&Deno.unrefTimer?Deno.unrefTimer(t):typeof t=="object"&&t.unref&&t.unref(),t};/**
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
 */class ON{constructor(e,t){this.appCheckProvider=t,this.appName=e.name,Vt(e)&&e.settings.appCheckToken&&(this.serverAppAppCheckToken=e.settings.appCheckToken),this.appCheck=t==null?void 0:t.getImmediate({optional:!0}),this.appCheck||t==null||t.get().then(r=>this.appCheck=r)}getToken(e){if(this.serverAppAppCheckToken){if(e)throw new Error("Attempted reuse of `FirebaseServerApp.appCheckToken` after previous usage failed.");return Promise.resolve({token:this.serverAppAppCheckToken})}return this.appCheck?this.appCheck.getToken(e):new Promise((t,r)=>{setTimeout(()=>{this.appCheck?this.getToken(e).then(t,r):t(null)},0)})}addTokenChangeListener(e){var t;(t=this.appCheckProvider)==null||t.get().then(r=>r.addTokenListener(e))}notifyForInvalidToken(){pt(`Provided AppCheck credentials for the app named "${this.appName}" are invalid. This usually indicates your app was not initialized correctly.`)}}/**
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
 */class MN{constructor(e,t,r){this.appName_=e,this.firebaseOptions_=t,this.authProvider_=r,this.auth_=null,this.auth_=r.getImmediate({optional:!0}),this.auth_||r.onInit(s=>this.auth_=s)}getToken(e){return this.auth_?this.auth_.getToken(e).catch(t=>t&&t.code==="auth/token-not-initialized"?(je("Got auth/token-not-initialized error.  Treating as null token."),null):Promise.reject(t)):new Promise((t,r)=>{setTimeout(()=>{this.auth_?this.getToken(e).then(t,r):t(null)},0)})}addTokenChangeListener(e){this.auth_?this.auth_.addAuthTokenListener(e):this.authProvider_.get().then(t=>t.addAuthTokenListener(e))}removeTokenChangeListener(e){this.authProvider_.get().then(t=>t.removeAuthTokenListener(e))}notifyForInvalidToken(){let e='Provided authentication credentials for the app named "'+this.appName_+'" are invalid. This usually indicates your app was not initialized correctly. ';"credential"in this.firebaseOptions_?e+='Make sure the "credential" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':"serviceAccount"in this.firebaseOptions_?e+='Make sure the "serviceAccount" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':e+='Make sure the "apiKey" and "databaseURL" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.',pt(e)}}class xa{constructor(e){this.accessToken=e}getToken(e){return Promise.resolve({accessToken:this.accessToken})}addTokenChangeListener(e){e(this.accessToken)}removeTokenChangeListener(e){}notifyForInvalidToken(){}}xa.OWNER="owner";/**
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
 */const Rd="5",bE="v",RE="s",SE="r",CE="f",PE=/(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/,NE="ls",kE="p",$u="ac",DE="websocket",xE="long_polling";/**
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
 */class VE{constructor(e,t,r,s,i=!1,o="",a=!1,l=!1,u=null){this.secure=t,this.namespace=r,this.webSocketOnly=s,this.nodeAdmin=i,this.persistenceKey=o,this.includeNamespaceInQueryParams=a,this.isUsingEmulator=l,this.emulatorOptions=u,this._host=e.toLowerCase(),this._domain=this._host.substr(this._host.indexOf(".")+1),this.internalHost=pr.get("host:"+e)||this._host}isCacheableHost(){return this.internalHost.substr(0,2)==="s-"}isCustomHost(){return this._domain!=="firebaseio.com"&&this._domain!=="firebaseio-demo.com"}get host(){return this._host}set host(e){e!==this.internalHost&&(this.internalHost=e,this.isCacheableHost()&&pr.set("host:"+this._host,this.internalHost))}toString(){let e=this.toURLString();return this.persistenceKey&&(e+="<"+this.persistenceKey+">"),e}toURLString(){const e=this.secure?"https://":"http://",t=this.includeNamespaceInQueryParams?`?ns=${this.namespace}`:"";return`${e}${this.host}/${t}`}}function LN(n){return n.host!==n.internalHost||n.isCustomHost()||n.includeNamespaceInQueryParams}function OE(n,e,t){O(typeof e=="string","typeof type must == string"),O(typeof t=="object","typeof params must == object");let r;if(e===DE)r=(n.secure?"wss://":"ws://")+n.internalHost+"/.ws?";else if(e===xE)r=(n.secure?"https://":"http://")+n.internalHost+"/.lp?";else throw new Error("Unknown connection type: "+e);LN(n)&&(t.ns=n.namespace);const s=[];return Je(t,(i,o)=>{s.push(i+"="+o)}),r+s.join("&")}/**
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
 */class FN{constructor(){this.counters_={}}incrementCounter(e,t=1){jt(this.counters_,e)||(this.counters_[e]=0),this.counters_[e]+=t}get(){return Rw(this.counters_)}}/**
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
 */const Zl={},eu={};function Sd(n){const e=n.toString();return Zl[e]||(Zl[e]=new FN),Zl[e]}function UN(n,e){const t=n.toString();return eu[t]||(eu[t]=e()),eu[t]}/**
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
 */class BN{constructor(e){this.onMessage_=e,this.pendingResponses=[],this.currentResponseNum=0,this.closeAfterResponse=-1,this.onClose=null}closeAfter(e,t){this.closeAfterResponse=e,this.onClose=t,this.closeAfterResponse<this.currentResponseNum&&(this.onClose(),this.onClose=null)}handleResponse(e,t){for(this.pendingResponses[e]=t;this.pendingResponses[this.currentResponseNum];){const r=this.pendingResponses[this.currentResponseNum];delete this.pendingResponses[this.currentResponseNum];for(let s=0;s<r.length;++s)r[s]&&ei(()=>{this.onMessage_(r[s])});if(this.currentResponseNum===this.closeAfterResponse){this.onClose&&(this.onClose(),this.onClose=null);break}this.currentResponseNum++}}}/**
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
 */const J_="start",qN="close",zN="pLPCommand",GN="pRTLPCB",ME="id",LE="pw",FE="ser",$N="cb",jN="seg",WN="ts",KN="d",HN="dframe",UE=1870,BE=30,QN=UE-BE,YN=25e3,XN=3e4;class rs{constructor(e,t,r,s,i,o,a){this.connId=e,this.repoInfo=t,this.applicationId=r,this.appCheckToken=s,this.authToken=i,this.transportSessionId=o,this.lastSessionId=a,this.bytesSent=0,this.bytesReceived=0,this.everConnected_=!1,this.log_=zo(e),this.stats_=Sd(t),this.urlFn=l=>(this.appCheckToken&&(l[$u]=this.appCheckToken),OE(t,xE,l))}open(e,t){this.curSegmentNum=0,this.onDisconnect_=t,this.myPacketOrderer=new BN(e),this.isClosed_=!1,this.connectTimeoutTimer_=setTimeout(()=>{this.log_("Timed out trying to connect."),this.onClosed_(),this.connectTimeoutTimer_=null},Math.floor(XN)),RN(()=>{if(this.isClosed_)return;this.scriptTagHolder=new Cd((...i)=>{const[o,a,l,u,h]=i;if(this.incrementIncomingBytes_(i),!!this.scriptTagHolder)if(this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null),this.everConnected_=!0,o===J_)this.id=a,this.password=l;else if(o===qN)a?(this.scriptTagHolder.sendNewPolls=!1,this.myPacketOrderer.closeAfter(a,()=>{this.onClosed_()})):this.onClosed_();else throw new Error("Unrecognized command received: "+o)},(...i)=>{const[o,a]=i;this.incrementIncomingBytes_(i),this.myPacketOrderer.handleResponse(o,a)},()=>{this.onClosed_()},this.urlFn);const r={};r[J_]="t",r[FE]=Math.floor(Math.random()*1e8),this.scriptTagHolder.uniqueCallbackIdentifier&&(r[$N]=this.scriptTagHolder.uniqueCallbackIdentifier),r[bE]=Rd,this.transportSessionId&&(r[RE]=this.transportSessionId),this.lastSessionId&&(r[NE]=this.lastSessionId),this.applicationId&&(r[kE]=this.applicationId),this.appCheckToken&&(r[$u]=this.appCheckToken),typeof location<"u"&&location.hostname&&PE.test(location.hostname)&&(r[SE]=CE);const s=this.urlFn(r);this.log_("Connecting via long-poll to "+s),this.scriptTagHolder.addTag(s,()=>{})})}start(){this.scriptTagHolder.startLongPoll(this.id,this.password),this.addDisconnectPingFrame(this.id,this.password)}static forceAllow(){rs.forceAllow_=!0}static forceDisallow(){rs.forceDisallow_=!0}static isAvailable(){return rs.forceAllow_?!0:!rs.forceDisallow_&&typeof document<"u"&&document.createElement!=null&&!CN()&&!PN()}markConnectionHealthy(){}shutdown_(){this.isClosed_=!0,this.scriptTagHolder&&(this.scriptTagHolder.close(),this.scriptTagHolder=null),this.myDisconnFrame&&(document.body.removeChild(this.myDisconnFrame),this.myDisconnFrame=null),this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null)}onClosed_(){this.isClosed_||(this.log_("Longpoll is closing itself"),this.shutdown_(),this.onDisconnect_&&(this.onDisconnect_(this.everConnected_),this.onDisconnect_=null))}close(){this.isClosed_||(this.log_("Longpoll is being closed."),this.shutdown_())}send(e){const t=Me(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const r=Um(t),s=vE(r,QN);for(let i=0;i<s.length;i++)this.scriptTagHolder.enqueueSegment(this.curSegmentNum,s.length,s[i]),this.curSegmentNum++}addDisconnectPingFrame(e,t){this.myDisconnFrame=document.createElement("iframe");const r={};r[HN]="t",r[ME]=e,r[LE]=t,this.myDisconnFrame.src=this.urlFn(r),this.myDisconnFrame.style.display="none",document.body.appendChild(this.myDisconnFrame)}incrementIncomingBytes_(e){const t=Me(e).length;this.bytesReceived+=t,this.stats_.incrementCounter("bytes_received",t)}}class Cd{constructor(e,t,r,s){this.onDisconnect=r,this.urlFn=s,this.outstandingRequests=new Set,this.pendingSegs=[],this.currentSerial=Math.floor(Math.random()*1e8),this.sendNewPolls=!0;{this.uniqueCallbackIdentifier=vN(),window[zN+this.uniqueCallbackIdentifier]=e,window[GN+this.uniqueCallbackIdentifier]=t,this.myIFrame=Cd.createIFrame_();let i="";this.myIFrame.src&&this.myIFrame.src.substr(0,11)==="javascript:"&&(i='<script>document.domain="'+document.domain+'";<\/script>');const o="<html><body>"+i+"</body></html>";try{this.myIFrame.doc.open(),this.myIFrame.doc.write(o),this.myIFrame.doc.close()}catch(a){je("frame writing exception"),a.stack&&je(a.stack),je(a)}}}static createIFrame_(){const e=document.createElement("iframe");if(e.style.display="none",document.body){document.body.appendChild(e);try{e.contentWindow.document||je("No IE domain setting required")}catch{const r=document.domain;e.src="javascript:void((function(){document.open();document.domain='"+r+"';document.close();})())"}}else throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";return e.contentDocument?e.doc=e.contentDocument:e.contentWindow?e.doc=e.contentWindow.document:e.document&&(e.doc=e.document),e}close(){this.alive=!1,this.myIFrame&&(this.myIFrame.doc.body.textContent="",setTimeout(()=>{this.myIFrame!==null&&(document.body.removeChild(this.myIFrame),this.myIFrame=null)},Math.floor(0)));const e=this.onDisconnect;e&&(this.onDisconnect=null,e())}startLongPoll(e,t){for(this.myID=e,this.myPW=t,this.alive=!0;this.newRequest_(););}newRequest_(){if(this.alive&&this.sendNewPolls&&this.outstandingRequests.size<(this.pendingSegs.length>0?2:1)){this.currentSerial++;const e={};e[ME]=this.myID,e[LE]=this.myPW,e[FE]=this.currentSerial;let t=this.urlFn(e),r="",s=0;for(;this.pendingSegs.length>0&&this.pendingSegs[0].d.length+BE+r.length<=UE;){const o=this.pendingSegs.shift();r=r+"&"+jN+s+"="+o.seg+"&"+WN+s+"="+o.ts+"&"+KN+s+"="+o.d,s++}return t=t+r,this.addLongPollTag_(t,this.currentSerial),!0}else return!1}enqueueSegment(e,t,r){this.pendingSegs.push({seg:e,ts:t,d:r}),this.alive&&this.newRequest_()}addLongPollTag_(e,t){this.outstandingRequests.add(t);const r=()=>{this.outstandingRequests.delete(t),this.newRequest_()},s=setTimeout(r,Math.floor(YN)),i=()=>{clearTimeout(s),r()};this.addTag(e,i)}addTag(e,t){setTimeout(()=>{try{if(!this.sendNewPolls)return;const r=this.myIFrame.doc.createElement("script");r.type="text/javascript",r.async=!0,r.src=e,r.onload=r.onreadystatechange=function(){const s=r.readyState;(!s||s==="loaded"||s==="complete")&&(r.onload=r.onreadystatechange=null,r.parentNode&&r.parentNode.removeChild(r),t())},r.onerror=()=>{je("Long-poll script failed to load: "+e),this.sendNewPolls=!1,this.close()},this.myIFrame.doc.body.appendChild(r)}catch{}},Math.floor(1))}}/**
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
 */const JN=16384,ZN=45e3;let ic=null;typeof MozWebSocket<"u"?ic=MozWebSocket:typeof WebSocket<"u"&&(ic=WebSocket);class bt{constructor(e,t,r,s,i,o,a){this.connId=e,this.applicationId=r,this.appCheckToken=s,this.authToken=i,this.keepaliveTimer=null,this.frames=null,this.totalFrames=0,this.bytesSent=0,this.bytesReceived=0,this.log_=zo(this.connId),this.stats_=Sd(t),this.connURL=bt.connectionURL_(t,o,a,s,r),this.nodeAdmin=t.nodeAdmin}static connectionURL_(e,t,r,s,i){const o={};return o[bE]=Rd,typeof location<"u"&&location.hostname&&PE.test(location.hostname)&&(o[SE]=CE),t&&(o[RE]=t),r&&(o[NE]=r),s&&(o[$u]=s),i&&(o[kE]=i),OE(e,DE,o)}open(e,t){this.onDisconnect=t,this.onMessage=e,this.log_("Websocket connecting to "+this.connURL),this.everConnected_=!1,pr.set("previous_websocket_failure",!0);try{let r;Lw(),this.mySock=new ic(this.connURL,[],r)}catch(r){this.log_("Error instantiating WebSocket.");const s=r.message||r.data;s&&this.log_(s),this.onClosed_();return}this.mySock.onopen=()=>{this.log_("Websocket connected."),this.everConnected_=!0},this.mySock.onclose=()=>{this.log_("Websocket connection was disconnected."),this.mySock=null,this.onClosed_()},this.mySock.onmessage=r=>{this.handleIncomingFrame(r)},this.mySock.onerror=r=>{this.log_("WebSocket error.  Closing connection.");const s=r.message||r.data;s&&this.log_(s),this.onClosed_()}}start(){}static forceDisallow(){bt.forceDisallow_=!0}static isAvailable(){let e=!1;if(typeof navigator<"u"&&navigator.userAgent){const t=/Android ([0-9]{0,}\.[0-9]{0,})/,r=navigator.userAgent.match(t);r&&r.length>1&&parseFloat(r[1])<4.4&&(e=!0)}return!e&&ic!==null&&!bt.forceDisallow_}static previouslyFailed(){return pr.isInMemoryStorage||pr.get("previous_websocket_failure")===!0}markConnectionHealthy(){pr.remove("previous_websocket_failure")}appendFrame_(e){if(this.frames.push(e),this.frames.length===this.totalFrames){const t=this.frames.join("");this.frames=null;const r=Zi(t);this.onMessage(r)}}handleNewFrameCount_(e){this.totalFrames=e,this.frames=[]}extractFrameCount_(e){if(O(this.frames===null,"We already have a frame buffer"),e.length<=6){const t=Number(e);if(!isNaN(t))return this.handleNewFrameCount_(t),null}return this.handleNewFrameCount_(1),e}handleIncomingFrame(e){if(this.mySock===null)return;const t=e.data;if(this.bytesReceived+=t.length,this.stats_.incrementCounter("bytes_received",t.length),this.resetKeepAlive(),this.frames!==null)this.appendFrame_(t);else{const r=this.extractFrameCount_(t);r!==null&&this.appendFrame_(r)}}send(e){this.resetKeepAlive();const t=Me(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const r=vE(t,JN);r.length>1&&this.sendString_(String(r.length));for(let s=0;s<r.length;s++)this.sendString_(r[s])}shutdown_(){this.isClosed_=!0,this.keepaliveTimer&&(clearInterval(this.keepaliveTimer),this.keepaliveTimer=null),this.mySock&&(this.mySock.close(),this.mySock=null)}onClosed_(){this.isClosed_||(this.log_("WebSocket is closing itself"),this.shutdown_(),this.onDisconnect&&(this.onDisconnect(this.everConnected_),this.onDisconnect=null))}close(){this.isClosed_||(this.log_("WebSocket is being closed"),this.shutdown_())}resetKeepAlive(){clearInterval(this.keepaliveTimer),this.keepaliveTimer=setInterval(()=>{this.mySock&&this.sendString_("0"),this.resetKeepAlive()},Math.floor(ZN))}sendString_(e){try{this.mySock.send(e)}catch(t){this.log_("Exception thrown from WebSocket.send():",t.message||t.data,"Closing connection."),setTimeout(this.onClosed_.bind(this),0)}}}bt.responsesRequiredToBeHealthy=2;bt.healthyTimeout=3e4;/**
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
 */class _o{static get ALL_TRANSPORTS(){return[rs,bt]}static get IS_TRANSPORT_INITIALIZED(){return this.globalTransportInitialized_}constructor(e){this.initTransports_(e)}initTransports_(e){const t=bt&&bt.isAvailable();let r=t&&!bt.previouslyFailed();if(e.webSocketOnly&&(t||pt("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),r=!0),r)this.transports_=[bt];else{const s=this.transports_=[];for(const i of _o.ALL_TRANSPORTS)i&&i.isAvailable()&&s.push(i);_o.globalTransportInitialized_=!0}}initialTransport(){if(this.transports_.length>0)return this.transports_[0];throw new Error("No transports available")}upgradeTransport(){return this.transports_.length>1?this.transports_[1]:null}}_o.globalTransportInitialized_=!1;/**
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
 */const e0=6e4,t0=5e3,n0=10*1024,r0=100*1024,tu="t",Z_="d",s0="s",em="r",i0="e",tm="o",nm="a",rm="n",sm="p",o0="h";class a0{constructor(e,t,r,s,i,o,a,l,u,h){this.id=e,this.repoInfo_=t,this.applicationId_=r,this.appCheckToken_=s,this.authToken_=i,this.onMessage_=o,this.onReady_=a,this.onDisconnect_=l,this.onKill_=u,this.lastSessionId=h,this.connectionCount=0,this.pendingDataMessages=[],this.state_=0,this.log_=zo("c:"+this.id+":"),this.transportManager_=new _o(t),this.log_("Connection created"),this.start_()}start_(){const e=this.transportManager_.initialTransport();this.conn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,null,this.lastSessionId),this.primaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.conn_),r=this.disconnReceiver_(this.conn_);this.tx_=this.conn_,this.rx_=this.conn_,this.secondaryConn_=null,this.isHealthy_=!1,setTimeout(()=>{this.conn_&&this.conn_.open(t,r)},Math.floor(0));const s=e.healthyTimeout||0;s>0&&(this.healthyTimeout_=Ki(()=>{this.healthyTimeout_=null,this.isHealthy_||(this.conn_&&this.conn_.bytesReceived>r0?(this.log_("Connection exceeded healthy timeout but has received "+this.conn_.bytesReceived+" bytes.  Marking connection healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()):this.conn_&&this.conn_.bytesSent>n0?this.log_("Connection exceeded healthy timeout but has sent "+this.conn_.bytesSent+" bytes.  Leaving connection alive."):(this.log_("Closing unhealthy connection after timeout."),this.close()))},Math.floor(s)))}nextTransportId_(){return"c:"+this.id+":"+this.connectionCount++}disconnReceiver_(e){return t=>{e===this.conn_?this.onConnectionLost_(t):e===this.secondaryConn_?(this.log_("Secondary connection lost."),this.onSecondaryConnectionLost_()):this.log_("closing an old connection")}}connReceiver_(e){return t=>{this.state_!==2&&(e===this.rx_?this.onPrimaryMessageReceived_(t):e===this.secondaryConn_?this.onSecondaryMessageReceived_(t):this.log_("message on old connection"))}}sendRequest(e){const t={t:"d",d:e};this.sendData_(t)}tryCleanupConnection(){this.tx_===this.secondaryConn_&&this.rx_===this.secondaryConn_&&(this.log_("cleaning up and promoting a connection: "+this.secondaryConn_.connId),this.conn_=this.secondaryConn_,this.secondaryConn_=null)}onSecondaryControl_(e){if(tu in e){const t=e[tu];t===nm?this.upgradeIfSecondaryHealthy_():t===em?(this.log_("Got a reset on secondary, closing it"),this.secondaryConn_.close(),(this.tx_===this.secondaryConn_||this.rx_===this.secondaryConn_)&&this.close()):t===tm&&(this.log_("got pong on secondary."),this.secondaryResponsesRequired_--,this.upgradeIfSecondaryHealthy_())}}onSecondaryMessageReceived_(e){const t=bi("t",e),r=bi("d",e);if(t==="c")this.onSecondaryControl_(r);else if(t==="d")this.pendingDataMessages.push(r);else throw new Error("Unknown protocol layer: "+t)}upgradeIfSecondaryHealthy_(){this.secondaryResponsesRequired_<=0?(this.log_("Secondary connection is healthy."),this.isHealthy_=!0,this.secondaryConn_.markConnectionHealthy(),this.proceedWithUpgrade_()):(this.log_("sending ping on secondary."),this.secondaryConn_.send({t:"c",d:{t:sm,d:{}}}))}proceedWithUpgrade_(){this.secondaryConn_.start(),this.log_("sending client ack on secondary"),this.secondaryConn_.send({t:"c",d:{t:nm,d:{}}}),this.log_("Ending transmission on primary"),this.conn_.send({t:"c",d:{t:rm,d:{}}}),this.tx_=this.secondaryConn_,this.tryCleanupConnection()}onPrimaryMessageReceived_(e){const t=bi("t",e),r=bi("d",e);t==="c"?this.onControl_(r):t==="d"&&this.onDataMessage_(r)}onDataMessage_(e){this.onPrimaryResponse_(),this.onMessage_(e)}onPrimaryResponse_(){this.isHealthy_||(this.primaryResponsesRequired_--,this.primaryResponsesRequired_<=0&&(this.log_("Primary connection is healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()))}onControl_(e){const t=bi(tu,e);if(Z_ in e){const r=e[Z_];if(t===o0){const s={...r};this.repoInfo_.isUsingEmulator&&(s.h=this.repoInfo_.host),this.onHandshake_(s)}else if(t===rm){this.log_("recvd end transmission on primary"),this.rx_=this.secondaryConn_;for(let s=0;s<this.pendingDataMessages.length;++s)this.onDataMessage_(this.pendingDataMessages[s]);this.pendingDataMessages=[],this.tryCleanupConnection()}else t===s0?this.onConnectionShutdown_(r):t===em?this.onReset_(r):t===i0?Gu("Server Error: "+r):t===tm?(this.log_("got pong on primary."),this.onPrimaryResponse_(),this.sendPingOnPrimaryIfNecessary_()):Gu("Unknown control packet command: "+t)}}onHandshake_(e){const t=e.ts,r=e.v,s=e.h;this.sessionId=e.s,this.repoInfo_.host=s,this.state_===0&&(this.conn_.start(),this.onConnectionEstablished_(this.conn_,t),Rd!==r&&pt("Protocol version mismatch detected"),this.tryStartUpgrade_())}tryStartUpgrade_(){const e=this.transportManager_.upgradeTransport();e&&this.startUpgrade_(e)}startUpgrade_(e){this.secondaryConn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,this.sessionId),this.secondaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.secondaryConn_),r=this.disconnReceiver_(this.secondaryConn_);this.secondaryConn_.open(t,r),Ki(()=>{this.secondaryConn_&&(this.log_("Timed out trying to upgrade."),this.secondaryConn_.close())},Math.floor(e0))}onReset_(e){this.log_("Reset packet received.  New host: "+e),this.repoInfo_.host=e,this.state_===1?this.close():(this.closeConnections_(),this.start_())}onConnectionEstablished_(e,t){this.log_("Realtime connection established."),this.conn_=e,this.state_=1,this.onReady_&&(this.onReady_(t,this.sessionId),this.onReady_=null),this.primaryResponsesRequired_===0?(this.log_("Primary connection is healthy."),this.isHealthy_=!0):Ki(()=>{this.sendPingOnPrimaryIfNecessary_()},Math.floor(t0))}sendPingOnPrimaryIfNecessary_(){!this.isHealthy_&&this.state_===1&&(this.log_("sending ping on primary."),this.sendData_({t:"c",d:{t:sm,d:{}}}))}onSecondaryConnectionLost_(){const e=this.secondaryConn_;this.secondaryConn_=null,(this.tx_===e||this.rx_===e)&&this.close()}onConnectionLost_(e){this.conn_=null,!e&&this.state_===0?(this.log_("Realtime connection failed."),this.repoInfo_.isCacheableHost()&&(pr.remove("host:"+this.repoInfo_.host),this.repoInfo_.internalHost=this.repoInfo_.host)):this.state_===1&&this.log_("Realtime connection lost."),this.close()}onConnectionShutdown_(e){this.log_("Connection shutdown command received. Shutting down..."),this.onKill_&&(this.onKill_(e),this.onKill_=null),this.onDisconnect_=null,this.close()}sendData_(e){if(this.state_!==1)throw"Connection is not connected";this.tx_.send(e)}close(){this.state_!==2&&(this.log_("Closing realtime connection."),this.state_=2,this.closeConnections_(),this.onDisconnect_&&(this.onDisconnect_(),this.onDisconnect_=null))}closeConnections_(){this.log_("Shutting down all connections"),this.conn_&&(this.conn_.close(),this.conn_=null),this.secondaryConn_&&(this.secondaryConn_.close(),this.secondaryConn_=null),this.healthyTimeout_&&(clearTimeout(this.healthyTimeout_),this.healthyTimeout_=null)}}/**
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
 */class qE{put(e,t,r,s){}merge(e,t,r,s){}refreshAuthToken(e){}refreshAppCheckToken(e){}onDisconnectPut(e,t,r){}onDisconnectMerge(e,t,r){}onDisconnectCancel(e,t){}reportStats(e){}}/**
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
 */class zE{constructor(e){this.allowedEvents_=e,this.listeners_={},O(Array.isArray(e)&&e.length>0,"Requires a non-empty array")}trigger(e,...t){if(Array.isArray(this.listeners_[e])){const r=[...this.listeners_[e]];for(let s=0;s<r.length;s++)r[s].callback.apply(r[s].context,t)}}on(e,t,r){this.validateEventType_(e),this.listeners_[e]=this.listeners_[e]||[],this.listeners_[e].push({callback:t,context:r});const s=this.getInitialEvent(e);s&&t.apply(r,s)}off(e,t,r){this.validateEventType_(e);const s=this.listeners_[e]||[];for(let i=0;i<s.length;i++)if(s[i].callback===t&&(!r||r===s[i].context)){s.splice(i,1);return}}validateEventType_(e){O(this.allowedEvents_.find(t=>t===e),"Unknown event: "+e)}}/**
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
 */class oc extends zE{static getInstance(){return new oc}constructor(){super(["online"]),this.online_=!0,typeof window<"u"&&typeof window.addEventListener<"u"&&!ch()&&(window.addEventListener("online",()=>{this.online_||(this.online_=!0,this.trigger("online",!0))},!1),window.addEventListener("offline",()=>{this.online_&&(this.online_=!1,this.trigger("online",!1))},!1))}getInitialEvent(e){return O(e==="online","Unknown event type: "+e),[this.online_]}currentlyOnline(){return this.online_}}/**
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
 */const im=32,om=768;class de{constructor(e,t){if(t===void 0){this.pieces_=e.split("/");let r=0;for(let s=0;s<this.pieces_.length;s++)this.pieces_[s].length>0&&(this.pieces_[r]=this.pieces_[s],r++);this.pieces_.length=r,this.pieceNum_=0}else this.pieces_=e,this.pieceNum_=t}toString(){let e="";for(let t=this.pieceNum_;t<this.pieces_.length;t++)this.pieces_[t]!==""&&(e+="/"+this.pieces_[t]);return e||"/"}}function oe(){return new de("")}function Y(n){return n.pieceNum_>=n.pieces_.length?null:n.pieces_[n.pieceNum_]}function qn(n){return n.pieces_.length-n.pieceNum_}function _e(n){let e=n.pieceNum_;return e<n.pieces_.length&&e++,new de(n.pieces_,e)}function Pd(n){return n.pieceNum_<n.pieces_.length?n.pieces_[n.pieces_.length-1]:null}function c0(n){let e="";for(let t=n.pieceNum_;t<n.pieces_.length;t++)n.pieces_[t]!==""&&(e+="/"+encodeURIComponent(String(n.pieces_[t])));return e||"/"}function mo(n,e=0){return n.pieces_.slice(n.pieceNum_+e)}function GE(n){if(n.pieceNum_>=n.pieces_.length)return null;const e=[];for(let t=n.pieceNum_;t<n.pieces_.length-1;t++)e.push(n.pieces_[t]);return new de(e,0)}function ke(n,e){const t=[];for(let r=n.pieceNum_;r<n.pieces_.length;r++)t.push(n.pieces_[r]);if(e instanceof de)for(let r=e.pieceNum_;r<e.pieces_.length;r++)t.push(e.pieces_[r]);else{const r=e.split("/");for(let s=0;s<r.length;s++)r[s].length>0&&t.push(r[s])}return new de(t,0)}function J(n){return n.pieceNum_>=n.pieces_.length}function nt(n,e){const t=Y(n),r=Y(e);if(t===null)return e;if(t===r)return nt(_e(n),_e(e));throw new Error("INTERNAL ERROR: innerPath ("+e+") is not within outerPath ("+n+")")}function l0(n,e){const t=mo(n,0),r=mo(e,0);for(let s=0;s<t.length&&s<r.length;s++){const i=Br(t[s],r[s]);if(i!==0)return i}return t.length===r.length?0:t.length<r.length?-1:1}function Nd(n,e){if(qn(n)!==qn(e))return!1;for(let t=n.pieceNum_,r=e.pieceNum_;t<=n.pieces_.length;t++,r++)if(n.pieces_[t]!==e.pieces_[r])return!1;return!0}function Tt(n,e){let t=n.pieceNum_,r=e.pieceNum_;if(qn(n)>qn(e))return!1;for(;t<n.pieces_.length;){if(n.pieces_[t]!==e.pieces_[r])return!1;++t,++r}return!0}class u0{constructor(e,t){this.errorPrefix_=t,this.parts_=mo(e,0),this.byteLength_=Math.max(1,this.parts_.length);for(let r=0;r<this.parts_.length;r++)this.byteLength_+=bc(this.parts_[r]);$E(this)}}function h0(n,e){n.parts_.length>0&&(n.byteLength_+=1),n.parts_.push(e),n.byteLength_+=bc(e),$E(n)}function d0(n){const e=n.parts_.pop();n.byteLength_-=bc(e),n.parts_.length>0&&(n.byteLength_-=1)}function $E(n){if(n.byteLength_>om)throw new Error(n.errorPrefix_+"has a key path longer than "+om+" bytes ("+n.byteLength_+").");if(n.parts_.length>im)throw new Error(n.errorPrefix_+"path specified exceeds the maximum depth that can be written ("+im+") or object contains a cycle "+cr(n))}function cr(n){return n.parts_.length===0?"":"in property '"+n.parts_.join(".")+"'"}/**
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
 */class kd extends zE{static getInstance(){return new kd}constructor(){super(["visible"]);let e,t;typeof document<"u"&&typeof document.addEventListener<"u"&&(typeof document.hidden<"u"?(t="visibilitychange",e="hidden"):typeof document.mozHidden<"u"?(t="mozvisibilitychange",e="mozHidden"):typeof document.msHidden<"u"?(t="msvisibilitychange",e="msHidden"):typeof document.webkitHidden<"u"&&(t="webkitvisibilitychange",e="webkitHidden")),this.visible_=!0,t&&document.addEventListener(t,()=>{const r=!document[e];r!==this.visible_&&(this.visible_=r,this.trigger("visible",r))},!1)}getInitialEvent(e){return O(e==="visible","Unknown event type: "+e),[this.visible_]}}/**
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
 */const Ri=1e3,f0=300*1e3,am=30*1e3,p0=1.3,_0=3e4,m0="server_kill",cm=3;class Zt extends qE{constructor(e,t,r,s,i,o,a,l){if(super(),this.repoInfo_=e,this.applicationId_=t,this.onDataUpdate_=r,this.onConnectStatus_=s,this.onServerInfoUpdate_=i,this.authTokenProvider_=o,this.appCheckTokenProvider_=a,this.authOverride_=l,this.id=Zt.nextPersistentConnectionId_++,this.log_=zo("p:"+this.id+":"),this.interruptReasons_={},this.listens=new Map,this.outstandingPuts_=[],this.outstandingGets_=[],this.outstandingPutCount_=0,this.outstandingGetCount_=0,this.onDisconnectRequestQueue_=[],this.connected_=!1,this.reconnectDelay_=Ri,this.maxReconnectDelay_=f0,this.securityDebugCallback_=null,this.lastSessionId=null,this.establishConnectionTimer_=null,this.visible_=!1,this.requestCBHash_={},this.requestNumber_=0,this.realtime_=null,this.authToken_=null,this.appCheckToken_=null,this.forceTokenRefresh_=!1,this.invalidAuthTokenCount_=0,this.invalidAppCheckTokenCount_=0,this.firstConnection_=!0,this.lastConnectionAttemptTime_=null,this.lastConnectionEstablishedTime_=null,l)throw new Error("Auth override specified in options, but not supported on non Node.js platforms");kd.getInstance().on("visible",this.onVisible_,this),e.host.indexOf("fblocal")===-1&&oc.getInstance().on("online",this.onOnline_,this)}sendRequest(e,t,r){const s=++this.requestNumber_,i={r:s,a:e,b:t};this.log_(Me(i)),O(this.connected_,"sendRequest call when we're not connected not allowed."),this.realtime_.sendRequest(i),r&&(this.requestCBHash_[s]=r)}get(e){this.initConnection_();const t=new Kt,s={action:"g",request:{p:e._path.toString(),q:e._queryObject},onComplete:o=>{const a=o.d;o.s==="ok"?t.resolve(a):t.reject(a)}};this.outstandingGets_.push(s),this.outstandingGetCount_++;const i=this.outstandingGets_.length-1;return this.connected_&&this.sendGet_(i),t.promise}listen(e,t,r,s){this.initConnection_();const i=e._queryIdentifier,o=e._path.toString();this.log_("Listen called for "+o+" "+i),this.listens.has(o)||this.listens.set(o,new Map),O(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"listen() called for non-default but complete query"),O(!this.listens.get(o).has(i),"listen() called twice for same path/queryId.");const a={onComplete:s,hashFn:t,query:e,tag:r};this.listens.get(o).set(i,a),this.connected_&&this.sendListen_(a)}sendGet_(e){const t=this.outstandingGets_[e];this.sendRequest("g",t.request,r=>{delete this.outstandingGets_[e],this.outstandingGetCount_--,this.outstandingGetCount_===0&&(this.outstandingGets_=[]),t.onComplete&&t.onComplete(r)})}sendListen_(e){const t=e.query,r=t._path.toString(),s=t._queryIdentifier;this.log_("Listen on "+r+" for "+s);const i={p:r},o="q";e.tag&&(i.q=t._queryObject,i.t=e.tag),i.h=e.hashFn(),this.sendRequest(o,i,a=>{const l=a.d,u=a.s;Zt.warnOnListenWarnings_(l,t),(this.listens.get(r)&&this.listens.get(r).get(s))===e&&(this.log_("listen response",a),u!=="ok"&&this.removeListen_(r,s),e.onComplete&&e.onComplete(u,l))})}static warnOnListenWarnings_(e,t){if(e&&typeof e=="object"&&jt(e,"w")){const r=us(e,"w");if(Array.isArray(r)&&~r.indexOf("no_index")){const s='".indexOn": "'+t._queryParams.getIndex().toString()+'"',i=t._path.toString();pt(`Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ${s} at ${i} to your security rules for better performance.`)}}}refreshAuthToken(e){this.authToken_=e,this.log_("Auth token refreshed"),this.authToken_?this.tryAuth():this.connected_&&this.sendRequest("unauth",{},()=>{}),this.reduceReconnectDelayIfAdminCredential_(e)}reduceReconnectDelayIfAdminCredential_(e){(e&&e.length===40||Gw(e))&&(this.log_("Admin auth credential detected.  Reducing max reconnect time."),this.maxReconnectDelay_=am)}refreshAppCheckToken(e){this.appCheckToken_=e,this.log_("App check token refreshed"),this.appCheckToken_?this.tryAppCheck():this.connected_&&this.sendRequest("unappeck",{},()=>{})}tryAuth(){if(this.connected_&&this.authToken_){const e=this.authToken_,t=zw(e)?"auth":"gauth",r={cred:e};this.authOverride_===null?r.noauth=!0:typeof this.authOverride_=="object"&&(r.authvar=this.authOverride_),this.sendRequest(t,r,s=>{const i=s.s,o=s.d||"error";this.authToken_===e&&(i==="ok"?this.invalidAuthTokenCount_=0:this.onAuthRevoked_(i,o))})}}tryAppCheck(){this.connected_&&this.appCheckToken_&&this.sendRequest("appcheck",{token:this.appCheckToken_},e=>{const t=e.s,r=e.d||"error";t==="ok"?this.invalidAppCheckTokenCount_=0:this.onAppCheckRevoked_(t,r)})}unlisten(e,t){const r=e._path.toString(),s=e._queryIdentifier;this.log_("Unlisten called for "+r+" "+s),O(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"unlisten() called for non-default but complete query"),this.removeListen_(r,s)&&this.connected_&&this.sendUnlisten_(r,s,e._queryObject,t)}sendUnlisten_(e,t,r,s){this.log_("Unlisten on "+e+" for "+t);const i={p:e},o="n";s&&(i.q=r,i.t=s),this.sendRequest(o,i)}onDisconnectPut(e,t,r){this.initConnection_(),this.connected_?this.sendOnDisconnect_("o",e,t,r):this.onDisconnectRequestQueue_.push({pathString:e,action:"o",data:t,onComplete:r})}onDisconnectMerge(e,t,r){this.initConnection_(),this.connected_?this.sendOnDisconnect_("om",e,t,r):this.onDisconnectRequestQueue_.push({pathString:e,action:"om",data:t,onComplete:r})}onDisconnectCancel(e,t){this.initConnection_(),this.connected_?this.sendOnDisconnect_("oc",e,null,t):this.onDisconnectRequestQueue_.push({pathString:e,action:"oc",data:null,onComplete:t})}sendOnDisconnect_(e,t,r,s){const i={p:t,d:r};this.log_("onDisconnect "+e,i),this.sendRequest(e,i,o=>{s&&setTimeout(()=>{s(o.s,o.d)},Math.floor(0))})}put(e,t,r,s){this.putInternal("p",e,t,r,s)}merge(e,t,r,s){this.putInternal("m",e,t,r,s)}putInternal(e,t,r,s,i){this.initConnection_();const o={p:t,d:r};i!==void 0&&(o.h=i),this.outstandingPuts_.push({action:e,request:o,onComplete:s}),this.outstandingPutCount_++;const a=this.outstandingPuts_.length-1;this.connected_?this.sendPut_(a):this.log_("Buffering put: "+t)}sendPut_(e){const t=this.outstandingPuts_[e].action,r=this.outstandingPuts_[e].request,s=this.outstandingPuts_[e].onComplete;this.outstandingPuts_[e].queued=this.connected_,this.sendRequest(t,r,i=>{this.log_(t+" response",i),delete this.outstandingPuts_[e],this.outstandingPutCount_--,this.outstandingPutCount_===0&&(this.outstandingPuts_=[]),s&&s(i.s,i.d)})}reportStats(e){if(this.connected_){const t={c:e};this.log_("reportStats",t),this.sendRequest("s",t,r=>{if(r.s!=="ok"){const i=r.d;this.log_("reportStats","Error sending stats: "+i)}})}}onDataMessage_(e){if("r"in e){this.log_("from server: "+Me(e));const t=e.r,r=this.requestCBHash_[t];r&&(delete this.requestCBHash_[t],r(e.b))}else{if("error"in e)throw"A server-side error has occurred: "+e.error;"a"in e&&this.onDataPush_(e.a,e.b)}}onDataPush_(e,t){this.log_("handleServerMessage",e,t),e==="d"?this.onDataUpdate_(t.p,t.d,!1,t.t):e==="m"?this.onDataUpdate_(t.p,t.d,!0,t.t):e==="c"?this.onListenRevoked_(t.p,t.q):e==="ac"?this.onAuthRevoked_(t.s,t.d):e==="apc"?this.onAppCheckRevoked_(t.s,t.d):e==="sd"?this.onSecurityDebugPacket_(t):Gu("Unrecognized action received from server: "+Me(e)+`
Are you using the latest client?`)}onReady_(e,t){this.log_("connection ready"),this.connected_=!0,this.lastConnectionEstablishedTime_=new Date().getTime(),this.handleTimestamp_(e),this.lastSessionId=t,this.firstConnection_&&this.sendConnectStats_(),this.restoreState_(),this.firstConnection_=!1,this.onConnectStatus_(!0)}scheduleConnect_(e){O(!this.realtime_,"Scheduling a connect when we're already connected/ing?"),this.establishConnectionTimer_&&clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=setTimeout(()=>{this.establishConnectionTimer_=null,this.establishConnection_()},Math.floor(e))}initConnection_(){!this.realtime_&&this.firstConnection_&&this.scheduleConnect_(0)}onVisible_(e){e&&!this.visible_&&this.reconnectDelay_===this.maxReconnectDelay_&&(this.log_("Window became visible.  Reducing delay."),this.reconnectDelay_=Ri,this.realtime_||this.scheduleConnect_(0)),this.visible_=e}onOnline_(e){e?(this.log_("Browser went online."),this.reconnectDelay_=Ri,this.realtime_||this.scheduleConnect_(0)):(this.log_("Browser went offline.  Killing connection."),this.realtime_&&this.realtime_.close())}onRealtimeDisconnect_(){if(this.log_("data client disconnected"),this.connected_=!1,this.realtime_=null,this.cancelSentTransactions_(),this.requestCBHash_={},this.shouldReconnect_()){this.visible_?this.lastConnectionEstablishedTime_&&(new Date().getTime()-this.lastConnectionEstablishedTime_>_0&&(this.reconnectDelay_=Ri),this.lastConnectionEstablishedTime_=null):(this.log_("Window isn't visible.  Delaying reconnect."),this.reconnectDelay_=this.maxReconnectDelay_,this.lastConnectionAttemptTime_=new Date().getTime());const e=Math.max(0,new Date().getTime()-this.lastConnectionAttemptTime_);let t=Math.max(0,this.reconnectDelay_-e);t=Math.random()*t,this.log_("Trying to reconnect in "+t+"ms"),this.scheduleConnect_(t),this.reconnectDelay_=Math.min(this.maxReconnectDelay_,this.reconnectDelay_*p0)}this.onConnectStatus_(!1)}async establishConnection_(){if(this.shouldReconnect_()){this.log_("Making a connection attempt"),this.lastConnectionAttemptTime_=new Date().getTime(),this.lastConnectionEstablishedTime_=null;const e=this.onDataMessage_.bind(this),t=this.onReady_.bind(this),r=this.onRealtimeDisconnect_.bind(this),s=this.id+":"+Zt.nextConnectionId_++,i=this.lastSessionId;let o=!1,a=null;const l=function(){a?a.close():(o=!0,r())},u=function(f){O(a,"sendRequest call when we're not connected not allowed."),a.sendRequest(f)};this.realtime_={close:l,sendRequest:u};const h=this.forceTokenRefresh_;this.forceTokenRefresh_=!1;try{const[f,_]=await Promise.all([this.authTokenProvider_.getToken(h),this.appCheckTokenProvider_.getToken(h)]);o?je("getToken() completed but was canceled"):(je("getToken() completed. Creating connection."),this.authToken_=f&&f.accessToken,this.appCheckToken_=_&&_.token,a=new a0(s,this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,e,t,r,g=>{pt(g+" ("+this.repoInfo_.toString()+")"),this.interrupt(m0)},i))}catch(f){this.log_("Failed to get token: "+f),o||(this.repoInfo_.nodeAdmin&&pt(f),l())}}}interrupt(e){je("Interrupting connection for reason: "+e),this.interruptReasons_[e]=!0,this.realtime_?this.realtime_.close():(this.establishConnectionTimer_&&(clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=null),this.connected_&&this.onRealtimeDisconnect_())}resume(e){je("Resuming connection for reason: "+e),delete this.interruptReasons_[e],cu(this.interruptReasons_)&&(this.reconnectDelay_=Ri,this.realtime_||this.scheduleConnect_(0))}handleTimestamp_(e){const t=e-new Date().getTime();this.onServerInfoUpdate_({serverTimeOffset:t})}cancelSentTransactions_(){for(let e=0;e<this.outstandingPuts_.length;e++){const t=this.outstandingPuts_[e];t&&"h"in t.request&&t.queued&&(t.onComplete&&t.onComplete("disconnect"),delete this.outstandingPuts_[e],this.outstandingPutCount_--)}this.outstandingPutCount_===0&&(this.outstandingPuts_=[])}onListenRevoked_(e,t){let r;t?r=t.map(i=>bd(i)).join("$"):r="default";const s=this.removeListen_(e,r);s&&s.onComplete&&s.onComplete("permission_denied")}removeListen_(e,t){const r=new de(e).toString();let s;if(this.listens.has(r)){const i=this.listens.get(r);s=i.get(t),i.delete(t),i.size===0&&this.listens.delete(r)}else s=void 0;return s}onAuthRevoked_(e,t){je("Auth token revoked: "+e+"/"+t),this.authToken_=null,this.forceTokenRefresh_=!0,this.realtime_.close(),(e==="invalid_token"||e==="permission_denied")&&(this.invalidAuthTokenCount_++,this.invalidAuthTokenCount_>=cm&&(this.reconnectDelay_=am,this.authTokenProvider_.notifyForInvalidToken()))}onAppCheckRevoked_(e,t){je("App check token revoked: "+e+"/"+t),this.appCheckToken_=null,this.forceTokenRefresh_=!0,(e==="invalid_token"||e==="permission_denied")&&(this.invalidAppCheckTokenCount_++,this.invalidAppCheckTokenCount_>=cm&&this.appCheckTokenProvider_.notifyForInvalidToken())}onSecurityDebugPacket_(e){this.securityDebugCallback_?this.securityDebugCallback_(e):"msg"in e&&console.log("FIREBASE: "+e.msg.replace(`
`,`
FIREBASE: `))}restoreState_(){this.tryAuth(),this.tryAppCheck();for(const e of this.listens.values())for(const t of e.values())this.sendListen_(t);for(let e=0;e<this.outstandingPuts_.length;e++)this.outstandingPuts_[e]&&this.sendPut_(e);for(;this.onDisconnectRequestQueue_.length;){const e=this.onDisconnectRequestQueue_.shift();this.sendOnDisconnect_(e.action,e.pathString,e.data,e.onComplete)}for(let e=0;e<this.outstandingGets_.length;e++)this.outstandingGets_[e]&&this.sendGet_(e)}sendConnectStats_(){const e={};let t="js";e["sdk."+t+"."+EE.replace(/\./g,"-")]=1,ch()?e["framework.cordova"]=1:$m()&&(e["framework.reactnative"]=1),this.reportStats(e)}shouldReconnect_(){const e=oc.getInstance().currentlyOnline();return cu(this.interruptReasons_)&&e}}Zt.nextPersistentConnectionId_=0;Zt.nextConnectionId_=0;/**
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
 */class ee{constructor(e,t){this.name=e,this.node=t}static Wrap(e,t){return new ee(e,t)}}/**
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
 */class rl{getCompare(){return this.compare.bind(this)}indexedValueChanged(e,t){const r=new ee(Vs,e),s=new ee(Vs,t);return this.compare(r,s)!==0}minPost(){return ee.MIN}}/**
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
 */let Ea;class jE extends rl{static get __EMPTY_NODE(){return Ea}static set __EMPTY_NODE(e){Ea=e}compare(e,t){return Br(e.name,t.name)}isDefinedOn(e){throw Fs("KeyIndex.isDefinedOn not expected to be called.")}indexedValueChanged(e,t){return!1}minPost(){return ee.MIN}maxPost(){return new ee(kr,Ea)}makePost(e,t){return O(typeof e=="string","KeyIndex indexValue must always be a string."),new ee(e,Ea)}toString(){return".key"}}const as=new jE;/**
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
 */class Ta{constructor(e,t,r,s,i=null){this.isReverse_=s,this.resultGenerator_=i,this.nodeStack_=[];let o=1;for(;!e.isEmpty();)if(e=e,o=t?r(e.key,t):1,s&&(o*=-1),o<0)this.isReverse_?e=e.left:e=e.right;else if(o===0){this.nodeStack_.push(e);break}else this.nodeStack_.push(e),this.isReverse_?e=e.right:e=e.left}getNext(){if(this.nodeStack_.length===0)return null;let e=this.nodeStack_.pop(),t;if(this.resultGenerator_?t=this.resultGenerator_(e.key,e.value):t={key:e.key,value:e.value},this.isReverse_)for(e=e.left;!e.isEmpty();)this.nodeStack_.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack_.push(e),e=e.left;return t}hasNext(){return this.nodeStack_.length>0}peek(){if(this.nodeStack_.length===0)return null;const e=this.nodeStack_[this.nodeStack_.length-1];return this.resultGenerator_?this.resultGenerator_(e.key,e.value):{key:e.key,value:e.value}}}class Ge{constructor(e,t,r,s,i){this.key=e,this.value=t,this.color=r??Ge.RED,this.left=s??ut.EMPTY_NODE,this.right=i??ut.EMPTY_NODE}copy(e,t,r,s,i){return new Ge(e??this.key,t??this.value,r??this.color,s??this.left,i??this.right)}count(){return this.left.count()+1+this.right.count()}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||!!e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min_(){return this.left.isEmpty()?this:this.left.min_()}minKey(){return this.min_().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,r){let s=this;const i=r(e,s.key);return i<0?s=s.copy(null,null,null,s.left.insert(e,t,r),null):i===0?s=s.copy(null,t,null,null,null):s=s.copy(null,null,null,null,s.right.insert(e,t,r)),s.fixUp_()}removeMin_(){if(this.left.isEmpty())return ut.EMPTY_NODE;let e=this;return!e.left.isRed_()&&!e.left.left.isRed_()&&(e=e.moveRedLeft_()),e=e.copy(null,null,null,e.left.removeMin_(),null),e.fixUp_()}remove(e,t){let r,s;if(r=this,t(e,r.key)<0)!r.left.isEmpty()&&!r.left.isRed_()&&!r.left.left.isRed_()&&(r=r.moveRedLeft_()),r=r.copy(null,null,null,r.left.remove(e,t),null);else{if(r.left.isRed_()&&(r=r.rotateRight_()),!r.right.isEmpty()&&!r.right.isRed_()&&!r.right.left.isRed_()&&(r=r.moveRedRight_()),t(e,r.key)===0){if(r.right.isEmpty())return ut.EMPTY_NODE;s=r.right.min_(),r=r.copy(s.key,s.value,null,null,r.right.removeMin_())}r=r.copy(null,null,null,null,r.right.remove(e,t))}return r.fixUp_()}isRed_(){return this.color}fixUp_(){let e=this;return e.right.isRed_()&&!e.left.isRed_()&&(e=e.rotateLeft_()),e.left.isRed_()&&e.left.left.isRed_()&&(e=e.rotateRight_()),e.left.isRed_()&&e.right.isRed_()&&(e=e.colorFlip_()),e}moveRedLeft_(){let e=this.colorFlip_();return e.right.left.isRed_()&&(e=e.copy(null,null,null,null,e.right.rotateRight_()),e=e.rotateLeft_(),e=e.colorFlip_()),e}moveRedRight_(){let e=this.colorFlip_();return e.left.left.isRed_()&&(e=e.rotateRight_(),e=e.colorFlip_()),e}rotateLeft_(){const e=this.copy(null,null,Ge.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight_(){const e=this.copy(null,null,Ge.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip_(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth_(){const e=this.check_();return Math.pow(2,e)<=this.count()+1}check_(){if(this.isRed_()&&this.left.isRed_())throw new Error("Red node has red child("+this.key+","+this.value+")");if(this.right.isRed_())throw new Error("Right child of ("+this.key+","+this.value+") is red");const e=this.left.check_();if(e!==this.right.check_())throw new Error("Black depths differ");return e+(this.isRed_()?0:1)}}Ge.RED=!0;Ge.BLACK=!1;class g0{copy(e,t,r,s,i){return this}insert(e,t,r){return new Ge(e,t,null)}remove(e,t){return this}count(){return 0}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}check_(){return 0}isRed_(){return!1}}class ut{constructor(e,t=ut.EMPTY_NODE){this.comparator_=e,this.root_=t}insert(e,t){return new ut(this.comparator_,this.root_.insert(e,t,this.comparator_).copy(null,null,Ge.BLACK,null,null))}remove(e){return new ut(this.comparator_,this.root_.remove(e,this.comparator_).copy(null,null,Ge.BLACK,null,null))}get(e){let t,r=this.root_;for(;!r.isEmpty();){if(t=this.comparator_(e,r.key),t===0)return r.value;t<0?r=r.left:t>0&&(r=r.right)}return null}getPredecessorKey(e){let t,r=this.root_,s=null;for(;!r.isEmpty();)if(t=this.comparator_(e,r.key),t===0){if(r.left.isEmpty())return s?s.key:null;for(r=r.left;!r.right.isEmpty();)r=r.right;return r.key}else t<0?r=r.left:t>0&&(s=r,r=r.right);throw new Error("Attempted to find predecessor key for a nonexistent key.  What gives?")}isEmpty(){return this.root_.isEmpty()}count(){return this.root_.count()}minKey(){return this.root_.minKey()}maxKey(){return this.root_.maxKey()}inorderTraversal(e){return this.root_.inorderTraversal(e)}reverseTraversal(e){return this.root_.reverseTraversal(e)}getIterator(e){return new Ta(this.root_,null,this.comparator_,!1,e)}getIteratorFrom(e,t){return new Ta(this.root_,e,this.comparator_,!1,t)}getReverseIteratorFrom(e,t){return new Ta(this.root_,e,this.comparator_,!0,t)}getReverseIterator(e){return new Ta(this.root_,null,this.comparator_,!0,e)}}ut.EMPTY_NODE=new g0;/**
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
 */function y0(n,e){return Br(n.name,e.name)}function Dd(n,e){return Br(n,e)}/**
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
 */let ju;function I0(n){ju=n}const WE=function(n){return typeof n=="number"?"number:"+AE(n):"string:"+n},KE=function(n){if(n.isLeafNode()){const e=n.val();O(typeof e=="string"||typeof e=="number"||typeof e=="object"&&jt(e,".sv"),"Priority must be a string or number.")}else O(n===ju||n.isEmpty(),"priority of unexpected type.");O(n===ju||n.getPriority().isEmpty(),"Priority nodes can't have a priority of their own.")};/**
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
 */let lm;class Be{static set __childrenNodeConstructor(e){lm=e}static get __childrenNodeConstructor(){return lm}constructor(e,t=Be.__childrenNodeConstructor.EMPTY_NODE){this.value_=e,this.priorityNode_=t,this.lazyHash_=null,O(this.value_!==void 0&&this.value_!==null,"LeafNode shouldn't be created with null/undefined value."),KE(this.priorityNode_)}isLeafNode(){return!0}getPriority(){return this.priorityNode_}updatePriority(e){return new Be(this.value_,e)}getImmediateChild(e){return e===".priority"?this.priorityNode_:Be.__childrenNodeConstructor.EMPTY_NODE}getChild(e){return J(e)?this:Y(e)===".priority"?this.priorityNode_:Be.__childrenNodeConstructor.EMPTY_NODE}hasChild(){return!1}getPredecessorChildName(e,t){return null}updateImmediateChild(e,t){return e===".priority"?this.updatePriority(t):t.isEmpty()&&e!==".priority"?this:Be.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(e,t).updatePriority(this.priorityNode_)}updateChild(e,t){const r=Y(e);return r===null?t:t.isEmpty()&&r!==".priority"?this:(O(r!==".priority"||qn(e)===1,".priority must be the last token in a path"),this.updateImmediateChild(r,Be.__childrenNodeConstructor.EMPTY_NODE.updateChild(_e(e),t)))}isEmpty(){return!1}numChildren(){return 0}forEachChild(e,t){return!1}val(e){return e&&!this.getPriority().isEmpty()?{".value":this.getValue(),".priority":this.getPriority().val()}:this.getValue()}hash(){if(this.lazyHash_===null){let e="";this.priorityNode_.isEmpty()||(e+="priority:"+WE(this.priorityNode_.val())+":");const t=typeof this.value_;e+=t+":",t==="number"?e+=AE(this.value_):e+=this.value_,this.lazyHash_=wE(e)}return this.lazyHash_}getValue(){return this.value_}compareTo(e){return e===Be.__childrenNodeConstructor.EMPTY_NODE?1:e instanceof Be.__childrenNodeConstructor?-1:(O(e.isLeafNode(),"Unknown node type"),this.compareToLeafNode_(e))}compareToLeafNode_(e){const t=typeof e.value_,r=typeof this.value_,s=Be.VALUE_TYPE_ORDER.indexOf(t),i=Be.VALUE_TYPE_ORDER.indexOf(r);return O(s>=0,"Unknown leaf type: "+t),O(i>=0,"Unknown leaf type: "+r),s===i?r==="object"?0:this.value_<e.value_?-1:this.value_===e.value_?0:1:i-s}withIndex(){return this}isIndexed(){return!0}equals(e){if(e===this)return!0;if(e.isLeafNode()){const t=e;return this.value_===t.value_&&this.priorityNode_.equals(t.priorityNode_)}else return!1}}Be.VALUE_TYPE_ORDER=["object","boolean","number","string"];/**
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
 */let HE,QE;function E0(n){HE=n}function T0(n){QE=n}class w0 extends rl{compare(e,t){const r=e.node.getPriority(),s=t.node.getPriority(),i=r.compareTo(s);return i===0?Br(e.name,t.name):i}isDefinedOn(e){return!e.getPriority().isEmpty()}indexedValueChanged(e,t){return!e.getPriority().equals(t.getPriority())}minPost(){return ee.MIN}maxPost(){return new ee(kr,new Be("[PRIORITY-POST]",QE))}makePost(e,t){const r=HE(e);return new ee(t,new Be("[PRIORITY-POST]",r))}toString(){return".priority"}}const Ae=new w0;/**
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
 */const v0=Math.log(2);class A0{constructor(e){const t=i=>parseInt(Math.log(i)/v0,10),r=i=>parseInt(Array(i+1).join("1"),2);this.count=t(e+1),this.current_=this.count-1;const s=r(this.count);this.bits_=e+1&s}nextBitIsOne(){const e=!(this.bits_&1<<this.current_);return this.current_--,e}}const ac=function(n,e,t,r){n.sort(e);const s=function(l,u){const h=u-l;let f,_;if(h===0)return null;if(h===1)return f=n[l],_=t?t(f):f,new Ge(_,f.node,Ge.BLACK,null,null);{const g=parseInt(h/2,10)+l,w=s(l,g),R=s(g+1,u);return f=n[g],_=t?t(f):f,new Ge(_,f.node,Ge.BLACK,w,R)}},i=function(l){let u=null,h=null,f=n.length;const _=function(w,R){const C=f-w,V=f;f-=w;const B=s(C+1,V),L=n[C],$=t?t(L):L;g(new Ge($,L.node,R,null,B))},g=function(w){u?(u.left=w,u=w):(h=w,u=w)};for(let w=0;w<l.count;++w){const R=l.nextBitIsOne(),C=Math.pow(2,l.count-(w+1));R?_(C,Ge.BLACK):(_(C,Ge.BLACK),_(C,Ge.RED))}return h},o=new A0(n.length),a=i(o);return new ut(r||e,a)};/**
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
 */let nu;const Jr={};class Xt{static get Default(){return O(Jr&&Ae,"ChildrenNode.ts has not been loaded"),nu=nu||new Xt({".priority":Jr},{".priority":Ae}),nu}constructor(e,t){this.indexes_=e,this.indexSet_=t}get(e){const t=us(this.indexes_,e);if(!t)throw new Error("No index defined for "+e);return t instanceof ut?t:null}hasIndex(e){return jt(this.indexSet_,e.toString())}addIndex(e,t){O(e!==as,"KeyIndex always exists and isn't meant to be added to the IndexMap.");const r=[];let s=!1;const i=t.getIterator(ee.Wrap);let o=i.getNext();for(;o;)s=s||e.isDefinedOn(o.node),r.push(o),o=i.getNext();let a;s?a=ac(r,e.getCompare()):a=Jr;const l=e.toString(),u={...this.indexSet_};u[l]=e;const h={...this.indexes_};return h[l]=a,new Xt(h,u)}addToIndexes(e,t){const r=Fa(this.indexes_,(s,i)=>{const o=us(this.indexSet_,i);if(O(o,"Missing index implementation for "+i),s===Jr)if(o.isDefinedOn(e.node)){const a=[],l=t.getIterator(ee.Wrap);let u=l.getNext();for(;u;)u.name!==e.name&&a.push(u),u=l.getNext();return a.push(e),ac(a,o.getCompare())}else return Jr;else{const a=t.get(e.name);let l=s;return a&&(l=l.remove(new ee(e.name,a))),l.insert(e,e.node)}});return new Xt(r,this.indexSet_)}removeFromIndexes(e,t){const r=Fa(this.indexes_,s=>{if(s===Jr)return s;{const i=t.get(e.name);return i?s.remove(new ee(e.name,i)):s}});return new Xt(r,this.indexSet_)}}/**
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
 */let Si;class W{static get EMPTY_NODE(){return Si||(Si=new W(new ut(Dd),null,Xt.Default))}constructor(e,t,r){this.children_=e,this.priorityNode_=t,this.indexMap_=r,this.lazyHash_=null,this.priorityNode_&&KE(this.priorityNode_),this.children_.isEmpty()&&O(!this.priorityNode_||this.priorityNode_.isEmpty(),"An empty node cannot have a priority")}isLeafNode(){return!1}getPriority(){return this.priorityNode_||Si}updatePriority(e){return this.children_.isEmpty()?this:new W(this.children_,e,this.indexMap_)}getImmediateChild(e){if(e===".priority")return this.getPriority();{const t=this.children_.get(e);return t===null?Si:t}}getChild(e){const t=Y(e);return t===null?this:this.getImmediateChild(t).getChild(_e(e))}hasChild(e){return this.children_.get(e)!==null}updateImmediateChild(e,t){if(O(t,"We should always be passing snapshot nodes"),e===".priority")return this.updatePriority(t);{const r=new ee(e,t);let s,i;t.isEmpty()?(s=this.children_.remove(e),i=this.indexMap_.removeFromIndexes(r,this.children_)):(s=this.children_.insert(e,t),i=this.indexMap_.addToIndexes(r,this.children_));const o=s.isEmpty()?Si:this.priorityNode_;return new W(s,o,i)}}updateChild(e,t){const r=Y(e);if(r===null)return t;{O(Y(e)!==".priority"||qn(e)===1,".priority must be the last token in a path");const s=this.getImmediateChild(r).updateChild(_e(e),t);return this.updateImmediateChild(r,s)}}isEmpty(){return this.children_.isEmpty()}numChildren(){return this.children_.count()}val(e){if(this.isEmpty())return null;const t={};let r=0,s=0,i=!0;if(this.forEachChild(Ae,(o,a)=>{t[o]=a.val(e),r++,i&&W.INTEGER_REGEXP_.test(o)?s=Math.max(s,Number(o)):i=!1}),!e&&i&&s<2*r){const o=[];for(const a in t)o[a]=t[a];return o}else return e&&!this.getPriority().isEmpty()&&(t[".priority"]=this.getPriority().val()),t}hash(){if(this.lazyHash_===null){let e="";this.getPriority().isEmpty()||(e+="priority:"+WE(this.getPriority().val())+":"),this.forEachChild(Ae,(t,r)=>{const s=r.hash();s!==""&&(e+=":"+t+":"+s)}),this.lazyHash_=e===""?"":wE(e)}return this.lazyHash_}getPredecessorChildName(e,t,r){const s=this.resolveIndex_(r);if(s){const i=s.getPredecessorKey(new ee(e,t));return i?i.name:null}else return this.children_.getPredecessorKey(e)}getFirstChildName(e){const t=this.resolveIndex_(e);if(t){const r=t.minKey();return r&&r.name}else return this.children_.minKey()}getFirstChild(e){const t=this.getFirstChildName(e);return t?new ee(t,this.children_.get(t)):null}getLastChildName(e){const t=this.resolveIndex_(e);if(t){const r=t.maxKey();return r&&r.name}else return this.children_.maxKey()}getLastChild(e){const t=this.getLastChildName(e);return t?new ee(t,this.children_.get(t)):null}forEachChild(e,t){const r=this.resolveIndex_(e);return r?r.inorderTraversal(s=>t(s.name,s.node)):this.children_.inorderTraversal(t)}getIterator(e){return this.getIteratorFrom(e.minPost(),e)}getIteratorFrom(e,t){const r=this.resolveIndex_(t);if(r)return r.getIteratorFrom(e,s=>s);{const s=this.children_.getIteratorFrom(e.name,ee.Wrap);let i=s.peek();for(;i!=null&&t.compare(i,e)<0;)s.getNext(),i=s.peek();return s}}getReverseIterator(e){return this.getReverseIteratorFrom(e.maxPost(),e)}getReverseIteratorFrom(e,t){const r=this.resolveIndex_(t);if(r)return r.getReverseIteratorFrom(e,s=>s);{const s=this.children_.getReverseIteratorFrom(e.name,ee.Wrap);let i=s.peek();for(;i!=null&&t.compare(i,e)>0;)s.getNext(),i=s.peek();return s}}compareTo(e){return this.isEmpty()?e.isEmpty()?0:-1:e.isLeafNode()||e.isEmpty()?1:e===Go?-1:0}withIndex(e){if(e===as||this.indexMap_.hasIndex(e))return this;{const t=this.indexMap_.addIndex(e,this.children_);return new W(this.children_,this.priorityNode_,t)}}isIndexed(e){return e===as||this.indexMap_.hasIndex(e)}equals(e){if(e===this)return!0;if(e.isLeafNode())return!1;{const t=e;if(this.getPriority().equals(t.getPriority()))if(this.children_.count()===t.children_.count()){const r=this.getIterator(Ae),s=t.getIterator(Ae);let i=r.getNext(),o=s.getNext();for(;i&&o;){if(i.name!==o.name||!i.node.equals(o.node))return!1;i=r.getNext(),o=s.getNext()}return i===null&&o===null}else return!1;else return!1}}resolveIndex_(e){return e===as?null:this.indexMap_.get(e.toString())}}W.INTEGER_REGEXP_=/^(0|[1-9]\d*)$/;class b0 extends W{constructor(){super(new ut(Dd),W.EMPTY_NODE,Xt.Default)}compareTo(e){return e===this?0:1}equals(e){return e===this}getPriority(){return this}getImmediateChild(e){return W.EMPTY_NODE}isEmpty(){return!1}}const Go=new b0;Object.defineProperties(ee,{MIN:{value:new ee(Vs,W.EMPTY_NODE)},MAX:{value:new ee(kr,Go)}});jE.__EMPTY_NODE=W.EMPTY_NODE;Be.__childrenNodeConstructor=W;I0(Go);T0(Go);/**
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
 */const R0=!0;function Pe(n,e=null){if(n===null)return W.EMPTY_NODE;if(typeof n=="object"&&".priority"in n&&(e=n[".priority"]),O(e===null||typeof e=="string"||typeof e=="number"||typeof e=="object"&&".sv"in e,"Invalid priority type found: "+typeof e),typeof n=="object"&&".value"in n&&n[".value"]!==null&&(n=n[".value"]),typeof n!="object"||".sv"in n){const t=n;return new Be(t,Pe(e))}if(!(n instanceof Array)&&R0){const t=[];let r=!1;if(Je(n,(o,a)=>{if(o.substring(0,1)!=="."){const l=Pe(a);l.isEmpty()||(r=r||!l.getPriority().isEmpty(),t.push(new ee(o,l)))}}),t.length===0)return W.EMPTY_NODE;const i=ac(t,y0,o=>o.name,Dd);if(r){const o=ac(t,Ae.getCompare());return new W(i,Pe(e),new Xt({".priority":o},{".priority":Ae}))}else return new W(i,Pe(e),Xt.Default)}else{let t=W.EMPTY_NODE;return Je(n,(r,s)=>{if(jt(n,r)&&r.substring(0,1)!=="."){const i=Pe(s);(i.isLeafNode()||!i.isEmpty())&&(t=t.updateImmediateChild(r,i))}}),t.updatePriority(Pe(e))}}E0(Pe);/**
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
 */class S0 extends rl{constructor(e){super(),this.indexPath_=e,O(!J(e)&&Y(e)!==".priority","Can't create PathIndex with empty path or .priority key")}extractChild(e){return e.getChild(this.indexPath_)}isDefinedOn(e){return!e.getChild(this.indexPath_).isEmpty()}compare(e,t){const r=this.extractChild(e.node),s=this.extractChild(t.node),i=r.compareTo(s);return i===0?Br(e.name,t.name):i}makePost(e,t){const r=Pe(e),s=W.EMPTY_NODE.updateChild(this.indexPath_,r);return new ee(t,s)}maxPost(){const e=W.EMPTY_NODE.updateChild(this.indexPath_,Go);return new ee(kr,e)}toString(){return mo(this.indexPath_,0).join("/")}}/**
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
 */class C0 extends rl{compare(e,t){const r=e.node.compareTo(t.node);return r===0?Br(e.name,t.name):r}isDefinedOn(e){return!0}indexedValueChanged(e,t){return!e.equals(t)}minPost(){return ee.MIN}maxPost(){return ee.MAX}makePost(e,t){const r=Pe(e);return new ee(t,r)}toString(){return".value"}}const P0=new C0;/**
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
 */function YE(n){return{type:"value",snapshotNode:n}}function Os(n,e){return{type:"child_added",snapshotNode:e,childName:n}}function go(n,e){return{type:"child_removed",snapshotNode:e,childName:n}}function yo(n,e,t){return{type:"child_changed",snapshotNode:e,childName:n,oldSnap:t}}function N0(n,e){return{type:"child_moved",snapshotNode:e,childName:n}}/**
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
 */class xd{constructor(e){this.index_=e}updateChild(e,t,r,s,i,o){O(e.isIndexed(this.index_),"A node must be indexed if only a child is updated");const a=e.getImmediateChild(t);return a.getChild(s).equals(r.getChild(s))&&a.isEmpty()===r.isEmpty()||(o!=null&&(r.isEmpty()?e.hasChild(t)?o.trackChildChange(go(t,a)):O(e.isLeafNode(),"A child remove without an old child only makes sense on a leaf node"):a.isEmpty()?o.trackChildChange(Os(t,r)):o.trackChildChange(yo(t,r,a))),e.isLeafNode()&&r.isEmpty())?e:e.updateImmediateChild(t,r).withIndex(this.index_)}updateFullNode(e,t,r){return r!=null&&(e.isLeafNode()||e.forEachChild(Ae,(s,i)=>{t.hasChild(s)||r.trackChildChange(go(s,i))}),t.isLeafNode()||t.forEachChild(Ae,(s,i)=>{if(e.hasChild(s)){const o=e.getImmediateChild(s);o.equals(i)||r.trackChildChange(yo(s,i,o))}else r.trackChildChange(Os(s,i))})),t.withIndex(this.index_)}updatePriority(e,t){return e.isEmpty()?W.EMPTY_NODE:e.updatePriority(t)}filtersNodes(){return!1}getIndexedFilter(){return this}getIndex(){return this.index_}}/**
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
 */class Io{constructor(e){this.indexedFilter_=new xd(e.getIndex()),this.index_=e.getIndex(),this.startPost_=Io.getStartPost_(e),this.endPost_=Io.getEndPost_(e),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}getStartPost(){return this.startPost_}getEndPost(){return this.endPost_}matches(e){const t=this.startIsInclusive_?this.index_.compare(this.getStartPost(),e)<=0:this.index_.compare(this.getStartPost(),e)<0,r=this.endIsInclusive_?this.index_.compare(e,this.getEndPost())<=0:this.index_.compare(e,this.getEndPost())<0;return t&&r}updateChild(e,t,r,s,i,o){return this.matches(new ee(t,r))||(r=W.EMPTY_NODE),this.indexedFilter_.updateChild(e,t,r,s,i,o)}updateFullNode(e,t,r){t.isLeafNode()&&(t=W.EMPTY_NODE);let s=t.withIndex(this.index_);s=s.updatePriority(W.EMPTY_NODE);const i=this;return t.forEachChild(Ae,(o,a)=>{i.matches(new ee(o,a))||(s=s.updateImmediateChild(o,W.EMPTY_NODE))}),this.indexedFilter_.updateFullNode(e,s,r)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.indexedFilter_}getIndex(){return this.index_}static getStartPost_(e){if(e.hasStart()){const t=e.getIndexStartName();return e.getIndex().makePost(e.getIndexStartValue(),t)}else return e.getIndex().minPost()}static getEndPost_(e){if(e.hasEnd()){const t=e.getIndexEndName();return e.getIndex().makePost(e.getIndexEndValue(),t)}else return e.getIndex().maxPost()}}/**
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
 */class k0{constructor(e){this.withinDirectionalStart=t=>this.reverse_?this.withinEndPost(t):this.withinStartPost(t),this.withinDirectionalEnd=t=>this.reverse_?this.withinStartPost(t):this.withinEndPost(t),this.withinStartPost=t=>{const r=this.index_.compare(this.rangedFilter_.getStartPost(),t);return this.startIsInclusive_?r<=0:r<0},this.withinEndPost=t=>{const r=this.index_.compare(t,this.rangedFilter_.getEndPost());return this.endIsInclusive_?r<=0:r<0},this.rangedFilter_=new Io(e),this.index_=e.getIndex(),this.limit_=e.getLimit(),this.reverse_=!e.isViewFromLeft(),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}updateChild(e,t,r,s,i,o){return this.rangedFilter_.matches(new ee(t,r))||(r=W.EMPTY_NODE),e.getImmediateChild(t).equals(r)?e:e.numChildren()<this.limit_?this.rangedFilter_.getIndexedFilter().updateChild(e,t,r,s,i,o):this.fullLimitUpdateChild_(e,t,r,i,o)}updateFullNode(e,t,r){let s;if(t.isLeafNode()||t.isEmpty())s=W.EMPTY_NODE.withIndex(this.index_);else if(this.limit_*2<t.numChildren()&&t.isIndexed(this.index_)){s=W.EMPTY_NODE.withIndex(this.index_);let i;this.reverse_?i=t.getReverseIteratorFrom(this.rangedFilter_.getEndPost(),this.index_):i=t.getIteratorFrom(this.rangedFilter_.getStartPost(),this.index_);let o=0;for(;i.hasNext()&&o<this.limit_;){const a=i.getNext();if(this.withinDirectionalStart(a))if(this.withinDirectionalEnd(a))s=s.updateImmediateChild(a.name,a.node),o++;else break;else continue}}else{s=t.withIndex(this.index_),s=s.updatePriority(W.EMPTY_NODE);let i;this.reverse_?i=s.getReverseIterator(this.index_):i=s.getIterator(this.index_);let o=0;for(;i.hasNext();){const a=i.getNext();o<this.limit_&&this.withinDirectionalStart(a)&&this.withinDirectionalEnd(a)?o++:s=s.updateImmediateChild(a.name,W.EMPTY_NODE)}}return this.rangedFilter_.getIndexedFilter().updateFullNode(e,s,r)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.rangedFilter_.getIndexedFilter()}getIndex(){return this.index_}fullLimitUpdateChild_(e,t,r,s,i){let o;if(this.reverse_){const f=this.index_.getCompare();o=(_,g)=>f(g,_)}else o=this.index_.getCompare();const a=e;O(a.numChildren()===this.limit_,"");const l=new ee(t,r),u=this.reverse_?a.getFirstChild(this.index_):a.getLastChild(this.index_),h=this.rangedFilter_.matches(l);if(a.hasChild(t)){const f=a.getImmediateChild(t);let _=s.getChildAfterChild(this.index_,u,this.reverse_);for(;_!=null&&(_.name===t||a.hasChild(_.name));)_=s.getChildAfterChild(this.index_,_,this.reverse_);const g=_==null?1:o(_,l);if(h&&!r.isEmpty()&&g>=0)return i!=null&&i.trackChildChange(yo(t,r,f)),a.updateImmediateChild(t,r);{i!=null&&i.trackChildChange(go(t,f));const R=a.updateImmediateChild(t,W.EMPTY_NODE);return _!=null&&this.rangedFilter_.matches(_)?(i!=null&&i.trackChildChange(Os(_.name,_.node)),R.updateImmediateChild(_.name,_.node)):R}}else return r.isEmpty()?e:h&&o(u,l)>=0?(i!=null&&(i.trackChildChange(go(u.name,u.node)),i.trackChildChange(Os(t,r))),a.updateImmediateChild(t,r).updateImmediateChild(u.name,W.EMPTY_NODE)):e}}/**
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
 */class Vd{constructor(){this.limitSet_=!1,this.startSet_=!1,this.startNameSet_=!1,this.startAfterSet_=!1,this.endSet_=!1,this.endNameSet_=!1,this.endBeforeSet_=!1,this.limit_=0,this.viewFrom_="",this.indexStartValue_=null,this.indexStartName_="",this.indexEndValue_=null,this.indexEndName_="",this.index_=Ae}hasStart(){return this.startSet_}isViewFromLeft(){return this.viewFrom_===""?this.startSet_:this.viewFrom_==="l"}getIndexStartValue(){return O(this.startSet_,"Only valid if start has been set"),this.indexStartValue_}getIndexStartName(){return O(this.startSet_,"Only valid if start has been set"),this.startNameSet_?this.indexStartName_:Vs}hasEnd(){return this.endSet_}getIndexEndValue(){return O(this.endSet_,"Only valid if end has been set"),this.indexEndValue_}getIndexEndName(){return O(this.endSet_,"Only valid if end has been set"),this.endNameSet_?this.indexEndName_:kr}hasLimit(){return this.limitSet_}hasAnchoredLimit(){return this.limitSet_&&this.viewFrom_!==""}getLimit(){return O(this.limitSet_,"Only valid if limit has been set"),this.limit_}getIndex(){return this.index_}loadsAllData(){return!(this.startSet_||this.endSet_||this.limitSet_)}isDefault(){return this.loadsAllData()&&this.index_===Ae}copy(){const e=new Vd;return e.limitSet_=this.limitSet_,e.limit_=this.limit_,e.startSet_=this.startSet_,e.startAfterSet_=this.startAfterSet_,e.indexStartValue_=this.indexStartValue_,e.startNameSet_=this.startNameSet_,e.indexStartName_=this.indexStartName_,e.endSet_=this.endSet_,e.endBeforeSet_=this.endBeforeSet_,e.indexEndValue_=this.indexEndValue_,e.endNameSet_=this.endNameSet_,e.indexEndName_=this.indexEndName_,e.index_=this.index_,e.viewFrom_=this.viewFrom_,e}}function D0(n){return n.loadsAllData()?new xd(n.getIndex()):n.hasLimit()?new k0(n):new Io(n)}function um(n){const e={};if(n.isDefault())return e;let t;if(n.index_===Ae?t="$priority":n.index_===P0?t="$value":n.index_===as?t="$key":(O(n.index_ instanceof S0,"Unrecognized index type!"),t=n.index_.toString()),e.orderBy=Me(t),n.startSet_){const r=n.startAfterSet_?"startAfter":"startAt";e[r]=Me(n.indexStartValue_),n.startNameSet_&&(e[r]+=","+Me(n.indexStartName_))}if(n.endSet_){const r=n.endBeforeSet_?"endBefore":"endAt";e[r]=Me(n.indexEndValue_),n.endNameSet_&&(e[r]+=","+Me(n.indexEndName_))}return n.limitSet_&&(n.isViewFromLeft()?e.limitToFirst=n.limit_:e.limitToLast=n.limit_),e}function hm(n){const e={};if(n.startSet_&&(e.sp=n.indexStartValue_,n.startNameSet_&&(e.sn=n.indexStartName_),e.sin=!n.startAfterSet_),n.endSet_&&(e.ep=n.indexEndValue_,n.endNameSet_&&(e.en=n.indexEndName_),e.ein=!n.endBeforeSet_),n.limitSet_){e.l=n.limit_;let t=n.viewFrom_;t===""&&(n.isViewFromLeft()?t="l":t="r"),e.vf=t}return n.index_!==Ae&&(e.i=n.index_.toString()),e}/**
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
 */class cc extends qE{reportStats(e){throw new Error("Method not implemented.")}static getListenId_(e,t){return t!==void 0?"tag$"+t:(O(e._queryParams.isDefault(),"should have a tag if it's not a default query."),e._path.toString())}constructor(e,t,r,s){super(),this.repoInfo_=e,this.onDataUpdate_=t,this.authTokenProvider_=r,this.appCheckTokenProvider_=s,this.log_=zo("p:rest:"),this.listens_={}}listen(e,t,r,s){const i=e._path.toString();this.log_("Listen called for "+i+" "+e._queryIdentifier);const o=cc.getListenId_(e,r),a={};this.listens_[o]=a;const l=um(e._queryParams);this.restRequest_(i+".json",l,(u,h)=>{let f=h;if(u===404&&(f=null,u=null),u===null&&this.onDataUpdate_(i,f,!1,r),us(this.listens_,o)===a){let _;u?u===401?_="permission_denied":_="rest_error:"+u:_="ok",s(_,null)}})}unlisten(e,t){const r=cc.getListenId_(e,t);delete this.listens_[r]}get(e){const t=um(e._queryParams),r=e._path.toString(),s=new Kt;return this.restRequest_(r+".json",t,(i,o)=>{let a=o;i===404&&(a=null,i=null),i===null?(this.onDataUpdate_(r,a,!1,null),s.resolve(a)):s.reject(new Error(a))}),s.promise}refreshAuthToken(e){}restRequest_(e,t={},r){return t.format="export",Promise.all([this.authTokenProvider_.getToken(!1),this.appCheckTokenProvider_.getToken(!1)]).then(([s,i])=>{s&&s.accessToken&&(t.auth=s.accessToken),i&&i.token&&(t.ac=i.token);const o=(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host+e+"?ns="+this.repoInfo_.namespace+lh(t);this.log_("Sending REST request for "+o);const a=new XMLHttpRequest;a.onreadystatechange=()=>{if(r&&a.readyState===4){this.log_("REST Response for "+o+" received. status:",a.status,"response:",a.responseText);let l=null;if(a.status>=200&&a.status<300){try{l=Zi(a.responseText)}catch{pt("Failed to parse JSON response for "+o+": "+a.responseText)}r(null,l)}else a.status!==401&&a.status!==404&&pt("Got unsuccessful REST response for "+o+" Status: "+a.status),r(a.status);r=null}},a.open("GET",o,!0),a.send()})}}/**
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
 */class x0{constructor(){this.rootNode_=W.EMPTY_NODE}getNode(e){return this.rootNode_.getChild(e)}updateSnapshot(e,t){this.rootNode_=this.rootNode_.updateChild(e,t)}}/**
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
 */function lc(){return{value:null,children:new Map}}function ti(n,e,t){if(J(e))n.value=t,n.children.clear();else if(n.value!==null)n.value=n.value.updateChild(e,t);else{const r=Y(e);n.children.has(r)||n.children.set(r,lc());const s=n.children.get(r);e=_e(e),ti(s,e,t)}}function Wu(n,e){if(J(e))return n.value=null,n.children.clear(),!0;if(n.value!==null){if(n.value.isLeafNode())return!1;{const t=n.value;return n.value=null,t.forEachChild(Ae,(r,s)=>{ti(n,new de(r),s)}),Wu(n,e)}}else if(n.children.size>0){const t=Y(e);return e=_e(e),n.children.has(t)&&Wu(n.children.get(t),e)&&n.children.delete(t),n.children.size===0}else return!0}function Ku(n,e,t){n.value!==null?t(e,n.value):V0(n,(r,s)=>{const i=new de(e.toString()+"/"+r);Ku(s,i,t)})}function V0(n,e){n.children.forEach((t,r)=>{e(r,t)})}/**
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
 */class O0{constructor(e){this.collection_=e,this.last_=null}get(){const e=this.collection_.get(),t={...e};return this.last_&&Je(this.last_,(r,s)=>{t[r]=t[r]-s}),this.last_=e,t}}/**
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
 */const dm=10*1e3,M0=30*1e3,L0=300*1e3;class F0{constructor(e,t){this.server_=t,this.statsToReport_={},this.statsListener_=new O0(e);const r=dm+(M0-dm)*Math.random();Ki(this.reportStats_.bind(this),Math.floor(r))}reportStats_(){const e=this.statsListener_.get(),t={};let r=!1;Je(e,(s,i)=>{i>0&&jt(this.statsToReport_,s)&&(t[s]=i,r=!0)}),r&&this.server_.reportStats(t),Ki(this.reportStats_.bind(this),Math.floor(Math.random()*2*L0))}}/**
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
 */var Rt;(function(n){n[n.OVERWRITE=0]="OVERWRITE",n[n.MERGE=1]="MERGE",n[n.ACK_USER_WRITE=2]="ACK_USER_WRITE",n[n.LISTEN_COMPLETE=3]="LISTEN_COMPLETE"})(Rt||(Rt={}));function XE(){return{fromUser:!0,fromServer:!1,queryId:null,tagged:!1}}function Od(){return{fromUser:!1,fromServer:!0,queryId:null,tagged:!1}}function Md(n){return{fromUser:!1,fromServer:!0,queryId:n,tagged:!0}}/**
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
 */class uc{constructor(e,t,r){this.path=e,this.affectedTree=t,this.revert=r,this.type=Rt.ACK_USER_WRITE,this.source=XE()}operationForChild(e){if(J(this.path)){if(this.affectedTree.value!=null)return O(this.affectedTree.children.isEmpty(),"affectedTree should not have overlapping affected paths."),this;{const t=this.affectedTree.subtree(new de(e));return new uc(oe(),t,this.revert)}}else return O(Y(this.path)===e,"operationForChild called for unrelated child."),new uc(_e(this.path),this.affectedTree,this.revert)}}/**
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
 */class Eo{constructor(e,t){this.source=e,this.path=t,this.type=Rt.LISTEN_COMPLETE}operationForChild(e){return J(this.path)?new Eo(this.source,oe()):new Eo(this.source,_e(this.path))}}/**
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
 */class Dr{constructor(e,t,r){this.source=e,this.path=t,this.snap=r,this.type=Rt.OVERWRITE}operationForChild(e){return J(this.path)?new Dr(this.source,oe(),this.snap.getImmediateChild(e)):new Dr(this.source,_e(this.path),this.snap)}}/**
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
 */class To{constructor(e,t,r){this.source=e,this.path=t,this.children=r,this.type=Rt.MERGE}operationForChild(e){if(J(this.path)){const t=this.children.subtree(new de(e));return t.isEmpty()?null:t.value?new Dr(this.source,oe(),t.value):new To(this.source,oe(),t)}else return O(Y(this.path)===e,"Can't get a merge for a child not on the path of the operation"),new To(this.source,_e(this.path),this.children)}toString(){return"Operation("+this.path+": "+this.source.toString()+" merge: "+this.children.toString()+")"}}/**
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
 */class zn{constructor(e,t,r){this.node_=e,this.fullyInitialized_=t,this.filtered_=r}isFullyInitialized(){return this.fullyInitialized_}isFiltered(){return this.filtered_}isCompleteForPath(e){if(J(e))return this.isFullyInitialized()&&!this.filtered_;const t=Y(e);return this.isCompleteForChild(t)}isCompleteForChild(e){return this.isFullyInitialized()&&!this.filtered_||this.node_.hasChild(e)}getNode(){return this.node_}}/**
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
 */class U0{constructor(e){this.query_=e,this.index_=this.query_._queryParams.getIndex()}}function B0(n,e,t,r){const s=[],i=[];return e.forEach(o=>{o.type==="child_changed"&&n.index_.indexedValueChanged(o.oldSnap,o.snapshotNode)&&i.push(N0(o.childName,o.snapshotNode))}),Ci(n,s,"child_removed",e,r,t),Ci(n,s,"child_added",e,r,t),Ci(n,s,"child_moved",i,r,t),Ci(n,s,"child_changed",e,r,t),Ci(n,s,"value",e,r,t),s}function Ci(n,e,t,r,s,i){const o=r.filter(a=>a.type===t);o.sort((a,l)=>z0(n,a,l)),o.forEach(a=>{const l=q0(n,a,i);s.forEach(u=>{u.respondsTo(a.type)&&e.push(u.createEvent(l,n.query_))})})}function q0(n,e,t){return e.type==="value"||e.type==="child_removed"||(e.prevName=t.getPredecessorChildName(e.childName,e.snapshotNode,n.index_)),e}function z0(n,e,t){if(e.childName==null||t.childName==null)throw Fs("Should only compare child_ events.");const r=new ee(e.childName,e.snapshotNode),s=new ee(t.childName,t.snapshotNode);return n.index_.compare(r,s)}/**
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
 */function sl(n,e){return{eventCache:n,serverCache:e}}function Hi(n,e,t,r){return sl(new zn(e,t,r),n.serverCache)}function JE(n,e,t,r){return sl(n.eventCache,new zn(e,t,r))}function hc(n){return n.eventCache.isFullyInitialized()?n.eventCache.getNode():null}function xr(n){return n.serverCache.isFullyInitialized()?n.serverCache.getNode():null}/**
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
 */let ru;const G0=()=>(ru||(ru=new ut(SN)),ru);class ge{static fromObject(e){let t=new ge(null);return Je(e,(r,s)=>{t=t.set(new de(r),s)}),t}constructor(e,t=G0()){this.value=e,this.children=t}isEmpty(){return this.value===null&&this.children.isEmpty()}findRootMostMatchingPathAndValue(e,t){if(this.value!=null&&t(this.value))return{path:oe(),value:this.value};if(J(e))return null;{const r=Y(e),s=this.children.get(r);if(s!==null){const i=s.findRootMostMatchingPathAndValue(_e(e),t);return i!=null?{path:ke(new de(r),i.path),value:i.value}:null}else return null}}findRootMostValueAndPath(e){return this.findRootMostMatchingPathAndValue(e,()=>!0)}subtree(e){if(J(e))return this;{const t=Y(e),r=this.children.get(t);return r!==null?r.subtree(_e(e)):new ge(null)}}set(e,t){if(J(e))return new ge(t,this.children);{const r=Y(e),i=(this.children.get(r)||new ge(null)).set(_e(e),t),o=this.children.insert(r,i);return new ge(this.value,o)}}remove(e){if(J(e))return this.children.isEmpty()?new ge(null):new ge(null,this.children);{const t=Y(e),r=this.children.get(t);if(r){const s=r.remove(_e(e));let i;return s.isEmpty()?i=this.children.remove(t):i=this.children.insert(t,s),this.value===null&&i.isEmpty()?new ge(null):new ge(this.value,i)}else return this}}get(e){if(J(e))return this.value;{const t=Y(e),r=this.children.get(t);return r?r.get(_e(e)):null}}setTree(e,t){if(J(e))return t;{const r=Y(e),i=(this.children.get(r)||new ge(null)).setTree(_e(e),t);let o;return i.isEmpty()?o=this.children.remove(r):o=this.children.insert(r,i),new ge(this.value,o)}}fold(e){return this.fold_(oe(),e)}fold_(e,t){const r={};return this.children.inorderTraversal((s,i)=>{r[s]=i.fold_(ke(e,s),t)}),t(e,this.value,r)}findOnPath(e,t){return this.findOnPath_(e,oe(),t)}findOnPath_(e,t,r){const s=this.value?r(t,this.value):!1;if(s)return s;if(J(e))return null;{const i=Y(e),o=this.children.get(i);return o?o.findOnPath_(_e(e),ke(t,i),r):null}}foreachOnPath(e,t){return this.foreachOnPath_(e,oe(),t)}foreachOnPath_(e,t,r){if(J(e))return this;{this.value&&r(t,this.value);const s=Y(e),i=this.children.get(s);return i?i.foreachOnPath_(_e(e),ke(t,s),r):new ge(null)}}foreach(e){this.foreach_(oe(),e)}foreach_(e,t){this.children.inorderTraversal((r,s)=>{s.foreach_(ke(e,r),t)}),this.value&&t(e,this.value)}foreachChild(e){this.children.inorderTraversal((t,r)=>{r.value&&e(t,r.value)})}}/**
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
 */class Pt{constructor(e){this.writeTree_=e}static empty(){return new Pt(new ge(null))}}function Qi(n,e,t){if(J(e))return new Pt(new ge(t));{const r=n.writeTree_.findRootMostValueAndPath(e);if(r!=null){const s=r.path;let i=r.value;const o=nt(s,e);return i=i.updateChild(o,t),new Pt(n.writeTree_.set(s,i))}else{const s=new ge(t),i=n.writeTree_.setTree(e,s);return new Pt(i)}}}function fm(n,e,t){let r=n;return Je(t,(s,i)=>{r=Qi(r,ke(e,s),i)}),r}function pm(n,e){if(J(e))return Pt.empty();{const t=n.writeTree_.setTree(e,new ge(null));return new Pt(t)}}function Hu(n,e){return qr(n,e)!=null}function qr(n,e){const t=n.writeTree_.findRootMostValueAndPath(e);return t!=null?n.writeTree_.get(t.path).getChild(nt(t.path,e)):null}function _m(n){const e=[],t=n.writeTree_.value;return t!=null?t.isLeafNode()||t.forEachChild(Ae,(r,s)=>{e.push(new ee(r,s))}):n.writeTree_.children.inorderTraversal((r,s)=>{s.value!=null&&e.push(new ee(r,s.value))}),e}function kn(n,e){if(J(e))return n;{const t=qr(n,e);return t!=null?new Pt(new ge(t)):new Pt(n.writeTree_.subtree(e))}}function Qu(n){return n.writeTree_.isEmpty()}function Ms(n,e){return ZE(oe(),n.writeTree_,e)}function ZE(n,e,t){if(e.value!=null)return t.updateChild(n,e.value);{let r=null;return e.children.inorderTraversal((s,i)=>{s===".priority"?(O(i.value!==null,"Priority writes must always be leaf nodes"),r=i.value):t=ZE(ke(n,s),i,t)}),!t.getChild(n).isEmpty()&&r!==null&&(t=t.updateChild(ke(n,".priority"),r)),t}}/**
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
 */function il(n,e){return rT(e,n)}function $0(n,e,t,r,s){O(r>n.lastWriteId,"Stacking an older write on top of newer ones"),s===void 0&&(s=!0),n.allWrites.push({path:e,snap:t,writeId:r,visible:s}),s&&(n.visibleWrites=Qi(n.visibleWrites,e,t)),n.lastWriteId=r}function j0(n,e){for(let t=0;t<n.allWrites.length;t++){const r=n.allWrites[t];if(r.writeId===e)return r}return null}function W0(n,e){const t=n.allWrites.findIndex(a=>a.writeId===e);O(t>=0,"removeWrite called with nonexistent writeId.");const r=n.allWrites[t];n.allWrites.splice(t,1);let s=r.visible,i=!1,o=n.allWrites.length-1;for(;s&&o>=0;){const a=n.allWrites[o];a.visible&&(o>=t&&K0(a,r.path)?s=!1:Tt(r.path,a.path)&&(i=!0)),o--}if(s){if(i)return H0(n),!0;if(r.snap)n.visibleWrites=pm(n.visibleWrites,r.path);else{const a=r.children;Je(a,l=>{n.visibleWrites=pm(n.visibleWrites,ke(r.path,l))})}return!0}else return!1}function K0(n,e){if(n.snap)return Tt(n.path,e);for(const t in n.children)if(n.children.hasOwnProperty(t)&&Tt(ke(n.path,t),e))return!0;return!1}function H0(n){n.visibleWrites=eT(n.allWrites,Q0,oe()),n.allWrites.length>0?n.lastWriteId=n.allWrites[n.allWrites.length-1].writeId:n.lastWriteId=-1}function Q0(n){return n.visible}function eT(n,e,t){let r=Pt.empty();for(let s=0;s<n.length;++s){const i=n[s];if(e(i)){const o=i.path;let a;if(i.snap)Tt(t,o)?(a=nt(t,o),r=Qi(r,a,i.snap)):Tt(o,t)&&(a=nt(o,t),r=Qi(r,oe(),i.snap.getChild(a)));else if(i.children){if(Tt(t,o))a=nt(t,o),r=fm(r,a,i.children);else if(Tt(o,t))if(a=nt(o,t),J(a))r=fm(r,oe(),i.children);else{const l=us(i.children,Y(a));if(l){const u=l.getChild(_e(a));r=Qi(r,oe(),u)}}}else throw Fs("WriteRecord should have .snap or .children")}}return r}function tT(n,e,t,r,s){if(!r&&!s){const i=qr(n.visibleWrites,e);if(i!=null)return i;{const o=kn(n.visibleWrites,e);if(Qu(o))return t;if(t==null&&!Hu(o,oe()))return null;{const a=t||W.EMPTY_NODE;return Ms(o,a)}}}else{const i=kn(n.visibleWrites,e);if(!s&&Qu(i))return t;if(!s&&t==null&&!Hu(i,oe()))return null;{const o=function(u){return(u.visible||s)&&(!r||!~r.indexOf(u.writeId))&&(Tt(u.path,e)||Tt(e,u.path))},a=eT(n.allWrites,o,e),l=t||W.EMPTY_NODE;return Ms(a,l)}}}function Y0(n,e,t){let r=W.EMPTY_NODE;const s=qr(n.visibleWrites,e);if(s)return s.isLeafNode()||s.forEachChild(Ae,(i,o)=>{r=r.updateImmediateChild(i,o)}),r;if(t){const i=kn(n.visibleWrites,e);return t.forEachChild(Ae,(o,a)=>{const l=Ms(kn(i,new de(o)),a);r=r.updateImmediateChild(o,l)}),_m(i).forEach(o=>{r=r.updateImmediateChild(o.name,o.node)}),r}else{const i=kn(n.visibleWrites,e);return _m(i).forEach(o=>{r=r.updateImmediateChild(o.name,o.node)}),r}}function X0(n,e,t,r,s){O(r||s,"Either existingEventSnap or existingServerSnap must exist");const i=ke(e,t);if(Hu(n.visibleWrites,i))return null;{const o=kn(n.visibleWrites,i);return Qu(o)?s.getChild(t):Ms(o,s.getChild(t))}}function J0(n,e,t,r){const s=ke(e,t),i=qr(n.visibleWrites,s);if(i!=null)return i;if(r.isCompleteForChild(t)){const o=kn(n.visibleWrites,s);return Ms(o,r.getNode().getImmediateChild(t))}else return null}function Z0(n,e){return qr(n.visibleWrites,e)}function ek(n,e,t,r,s,i,o){let a;const l=kn(n.visibleWrites,e),u=qr(l,oe());if(u!=null)a=u;else if(t!=null)a=Ms(l,t);else return[];if(a=a.withIndex(o),!a.isEmpty()&&!a.isLeafNode()){const h=[],f=o.getCompare(),_=i?a.getReverseIteratorFrom(r,o):a.getIteratorFrom(r,o);let g=_.getNext();for(;g&&h.length<s;)f(g,r)!==0&&h.push(g),g=_.getNext();return h}else return[]}function tk(){return{visibleWrites:Pt.empty(),allWrites:[],lastWriteId:-1}}function dc(n,e,t,r){return tT(n.writeTree,n.treePath,e,t,r)}function Ld(n,e){return Y0(n.writeTree,n.treePath,e)}function mm(n,e,t,r){return X0(n.writeTree,n.treePath,e,t,r)}function fc(n,e){return Z0(n.writeTree,ke(n.treePath,e))}function nk(n,e,t,r,s,i){return ek(n.writeTree,n.treePath,e,t,r,s,i)}function Fd(n,e,t){return J0(n.writeTree,n.treePath,e,t)}function nT(n,e){return rT(ke(n.treePath,e),n.writeTree)}function rT(n,e){return{treePath:n,writeTree:e}}/**
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
 */class rk{constructor(){this.changeMap=new Map}trackChildChange(e){const t=e.type,r=e.childName;O(t==="child_added"||t==="child_changed"||t==="child_removed","Only child changes supported for tracking"),O(r!==".priority","Only non-priority child changes can be tracked.");const s=this.changeMap.get(r);if(s){const i=s.type;if(t==="child_added"&&i==="child_removed")this.changeMap.set(r,yo(r,e.snapshotNode,s.snapshotNode));else if(t==="child_removed"&&i==="child_added")this.changeMap.delete(r);else if(t==="child_removed"&&i==="child_changed")this.changeMap.set(r,go(r,s.oldSnap));else if(t==="child_changed"&&i==="child_added")this.changeMap.set(r,Os(r,e.snapshotNode));else if(t==="child_changed"&&i==="child_changed")this.changeMap.set(r,yo(r,e.snapshotNode,s.oldSnap));else throw Fs("Illegal combination of changes: "+e+" occurred after "+s)}else this.changeMap.set(r,e)}getChanges(){return Array.from(this.changeMap.values())}}/**
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
 */class sk{getCompleteChild(e){return null}getChildAfterChild(e,t,r){return null}}const sT=new sk;class Ud{constructor(e,t,r=null){this.writes_=e,this.viewCache_=t,this.optCompleteServerCache_=r}getCompleteChild(e){const t=this.viewCache_.eventCache;if(t.isCompleteForChild(e))return t.getNode().getImmediateChild(e);{const r=this.optCompleteServerCache_!=null?new zn(this.optCompleteServerCache_,!0,!1):this.viewCache_.serverCache;return Fd(this.writes_,e,r)}}getChildAfterChild(e,t,r){const s=this.optCompleteServerCache_!=null?this.optCompleteServerCache_:xr(this.viewCache_),i=nk(this.writes_,s,t,1,r,e);return i.length===0?null:i[0]}}/**
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
 */function ik(n){return{filter:n}}function ok(n,e){O(e.eventCache.getNode().isIndexed(n.filter.getIndex()),"Event snap not indexed"),O(e.serverCache.getNode().isIndexed(n.filter.getIndex()),"Server snap not indexed")}function ak(n,e,t,r,s){const i=new rk;let o,a;if(t.type===Rt.OVERWRITE){const u=t;u.source.fromUser?o=Yu(n,e,u.path,u.snap,r,s,i):(O(u.source.fromServer,"Unknown source."),a=u.source.tagged||e.serverCache.isFiltered()&&!J(u.path),o=pc(n,e,u.path,u.snap,r,s,a,i))}else if(t.type===Rt.MERGE){const u=t;u.source.fromUser?o=lk(n,e,u.path,u.children,r,s,i):(O(u.source.fromServer,"Unknown source."),a=u.source.tagged||e.serverCache.isFiltered(),o=Xu(n,e,u.path,u.children,r,s,a,i))}else if(t.type===Rt.ACK_USER_WRITE){const u=t;u.revert?o=dk(n,e,u.path,r,s,i):o=uk(n,e,u.path,u.affectedTree,r,s,i)}else if(t.type===Rt.LISTEN_COMPLETE)o=hk(n,e,t.path,r,i);else throw Fs("Unknown operation type: "+t.type);const l=i.getChanges();return ck(e,o,l),{viewCache:o,changes:l}}function ck(n,e,t){const r=e.eventCache;if(r.isFullyInitialized()){const s=r.getNode().isLeafNode()||r.getNode().isEmpty(),i=hc(n);(t.length>0||!n.eventCache.isFullyInitialized()||s&&!r.getNode().equals(i)||!r.getNode().getPriority().equals(i.getPriority()))&&t.push(YE(hc(e)))}}function iT(n,e,t,r,s,i){const o=e.eventCache;if(fc(r,t)!=null)return e;{let a,l;if(J(t))if(O(e.serverCache.isFullyInitialized(),"If change path is empty, we must have complete server data"),e.serverCache.isFiltered()){const u=xr(e),h=u instanceof W?u:W.EMPTY_NODE,f=Ld(r,h);a=n.filter.updateFullNode(e.eventCache.getNode(),f,i)}else{const u=dc(r,xr(e));a=n.filter.updateFullNode(e.eventCache.getNode(),u,i)}else{const u=Y(t);if(u===".priority"){O(qn(t)===1,"Can't have a priority with additional path components");const h=o.getNode();l=e.serverCache.getNode();const f=mm(r,t,h,l);f!=null?a=n.filter.updatePriority(h,f):a=o.getNode()}else{const h=_e(t);let f;if(o.isCompleteForChild(u)){l=e.serverCache.getNode();const _=mm(r,t,o.getNode(),l);_!=null?f=o.getNode().getImmediateChild(u).updateChild(h,_):f=o.getNode().getImmediateChild(u)}else f=Fd(r,u,e.serverCache);f!=null?a=n.filter.updateChild(o.getNode(),u,f,h,s,i):a=o.getNode()}}return Hi(e,a,o.isFullyInitialized()||J(t),n.filter.filtersNodes())}}function pc(n,e,t,r,s,i,o,a){const l=e.serverCache;let u;const h=o?n.filter:n.filter.getIndexedFilter();if(J(t))u=h.updateFullNode(l.getNode(),r,null);else if(h.filtersNodes()&&!l.isFiltered()){const g=l.getNode().updateChild(t,r);u=h.updateFullNode(l.getNode(),g,null)}else{const g=Y(t);if(!l.isCompleteForPath(t)&&qn(t)>1)return e;const w=_e(t),C=l.getNode().getImmediateChild(g).updateChild(w,r);g===".priority"?u=h.updatePriority(l.getNode(),C):u=h.updateChild(l.getNode(),g,C,w,sT,null)}const f=JE(e,u,l.isFullyInitialized()||J(t),h.filtersNodes()),_=new Ud(s,f,i);return iT(n,f,t,s,_,a)}function Yu(n,e,t,r,s,i,o){const a=e.eventCache;let l,u;const h=new Ud(s,e,i);if(J(t))u=n.filter.updateFullNode(e.eventCache.getNode(),r,o),l=Hi(e,u,!0,n.filter.filtersNodes());else{const f=Y(t);if(f===".priority")u=n.filter.updatePriority(e.eventCache.getNode(),r),l=Hi(e,u,a.isFullyInitialized(),a.isFiltered());else{const _=_e(t),g=a.getNode().getImmediateChild(f);let w;if(J(_))w=r;else{const R=h.getCompleteChild(f);R!=null?Pd(_)===".priority"&&R.getChild(GE(_)).isEmpty()?w=R:w=R.updateChild(_,r):w=W.EMPTY_NODE}if(g.equals(w))l=e;else{const R=n.filter.updateChild(a.getNode(),f,w,_,h,o);l=Hi(e,R,a.isFullyInitialized(),n.filter.filtersNodes())}}}return l}function gm(n,e){return n.eventCache.isCompleteForChild(e)}function lk(n,e,t,r,s,i,o){let a=e;return r.foreach((l,u)=>{const h=ke(t,l);gm(e,Y(h))&&(a=Yu(n,a,h,u,s,i,o))}),r.foreach((l,u)=>{const h=ke(t,l);gm(e,Y(h))||(a=Yu(n,a,h,u,s,i,o))}),a}function ym(n,e,t){return t.foreach((r,s)=>{e=e.updateChild(r,s)}),e}function Xu(n,e,t,r,s,i,o,a){if(e.serverCache.getNode().isEmpty()&&!e.serverCache.isFullyInitialized())return e;let l=e,u;J(t)?u=r:u=new ge(null).setTree(t,r);const h=e.serverCache.getNode();return u.children.inorderTraversal((f,_)=>{if(h.hasChild(f)){const g=e.serverCache.getNode().getImmediateChild(f),w=ym(n,g,_);l=pc(n,l,new de(f),w,s,i,o,a)}}),u.children.inorderTraversal((f,_)=>{const g=!e.serverCache.isCompleteForChild(f)&&_.value===null;if(!h.hasChild(f)&&!g){const w=e.serverCache.getNode().getImmediateChild(f),R=ym(n,w,_);l=pc(n,l,new de(f),R,s,i,o,a)}}),l}function uk(n,e,t,r,s,i,o){if(fc(s,t)!=null)return e;const a=e.serverCache.isFiltered(),l=e.serverCache;if(r.value!=null){if(J(t)&&l.isFullyInitialized()||l.isCompleteForPath(t))return pc(n,e,t,l.getNode().getChild(t),s,i,a,o);if(J(t)){let u=new ge(null);return l.getNode().forEachChild(as,(h,f)=>{u=u.set(new de(h),f)}),Xu(n,e,t,u,s,i,a,o)}else return e}else{let u=new ge(null);return r.foreach((h,f)=>{const _=ke(t,h);l.isCompleteForPath(_)&&(u=u.set(h,l.getNode().getChild(_)))}),Xu(n,e,t,u,s,i,a,o)}}function hk(n,e,t,r,s){const i=e.serverCache,o=JE(e,i.getNode(),i.isFullyInitialized()||J(t),i.isFiltered());return iT(n,o,t,r,sT,s)}function dk(n,e,t,r,s,i){let o;if(fc(r,t)!=null)return e;{const a=new Ud(r,e,s),l=e.eventCache.getNode();let u;if(J(t)||Y(t)===".priority"){let h;if(e.serverCache.isFullyInitialized())h=dc(r,xr(e));else{const f=e.serverCache.getNode();O(f instanceof W,"serverChildren would be complete if leaf node"),h=Ld(r,f)}h=h,u=n.filter.updateFullNode(l,h,i)}else{const h=Y(t);let f=Fd(r,h,e.serverCache);f==null&&e.serverCache.isCompleteForChild(h)&&(f=l.getImmediateChild(h)),f!=null?u=n.filter.updateChild(l,h,f,_e(t),a,i):e.eventCache.getNode().hasChild(h)?u=n.filter.updateChild(l,h,W.EMPTY_NODE,_e(t),a,i):u=l,u.isEmpty()&&e.serverCache.isFullyInitialized()&&(o=dc(r,xr(e)),o.isLeafNode()&&(u=n.filter.updateFullNode(u,o,i)))}return o=e.serverCache.isFullyInitialized()||fc(r,oe())!=null,Hi(e,u,o,n.filter.filtersNodes())}}/**
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
 */class fk{constructor(e,t){this.query_=e,this.eventRegistrations_=[];const r=this.query_._queryParams,s=new xd(r.getIndex()),i=D0(r);this.processor_=ik(i);const o=t.serverCache,a=t.eventCache,l=s.updateFullNode(W.EMPTY_NODE,o.getNode(),null),u=i.updateFullNode(W.EMPTY_NODE,a.getNode(),null),h=new zn(l,o.isFullyInitialized(),s.filtersNodes()),f=new zn(u,a.isFullyInitialized(),i.filtersNodes());this.viewCache_=sl(f,h),this.eventGenerator_=new U0(this.query_)}get query(){return this.query_}}function pk(n){return n.viewCache_.serverCache.getNode()}function _k(n){return hc(n.viewCache_)}function mk(n,e){const t=xr(n.viewCache_);return t&&(n.query._queryParams.loadsAllData()||!J(e)&&!t.getImmediateChild(Y(e)).isEmpty())?t.getChild(e):null}function Im(n){return n.eventRegistrations_.length===0}function gk(n,e){n.eventRegistrations_.push(e)}function Em(n,e,t){const r=[];if(t){O(e==null,"A cancel should cancel all event registrations.");const s=n.query._path;n.eventRegistrations_.forEach(i=>{const o=i.createCancelEvent(t,s);o&&r.push(o)})}if(e){let s=[];for(let i=0;i<n.eventRegistrations_.length;++i){const o=n.eventRegistrations_[i];if(!o.matches(e))s.push(o);else if(e.hasAnyCallback()){s=s.concat(n.eventRegistrations_.slice(i+1));break}}n.eventRegistrations_=s}else n.eventRegistrations_=[];return r}function Tm(n,e,t,r){e.type===Rt.MERGE&&e.source.queryId!==null&&(O(xr(n.viewCache_),"We should always have a full cache before handling merges"),O(hc(n.viewCache_),"Missing event cache, even though we have a server cache"));const s=n.viewCache_,i=ak(n.processor_,s,e,t,r);return ok(n.processor_,i.viewCache),O(i.viewCache.serverCache.isFullyInitialized()||!s.serverCache.isFullyInitialized(),"Once a server snap is complete, it should never go back"),n.viewCache_=i.viewCache,oT(n,i.changes,i.viewCache.eventCache.getNode(),null)}function yk(n,e){const t=n.viewCache_.eventCache,r=[];return t.getNode().isLeafNode()||t.getNode().forEachChild(Ae,(i,o)=>{r.push(Os(i,o))}),t.isFullyInitialized()&&r.push(YE(t.getNode())),oT(n,r,t.getNode(),e)}function oT(n,e,t,r){const s=r?[r]:n.eventRegistrations_;return B0(n.eventGenerator_,e,t,s)}/**
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
 */let _c;class aT{constructor(){this.views=new Map}}function Ik(n){O(!_c,"__referenceConstructor has already been defined"),_c=n}function Ek(){return O(_c,"Reference.ts has not been loaded"),_c}function Tk(n){return n.views.size===0}function Bd(n,e,t,r){const s=e.source.queryId;if(s!==null){const i=n.views.get(s);return O(i!=null,"SyncTree gave us an op for an invalid query."),Tm(i,e,t,r)}else{let i=[];for(const o of n.views.values())i=i.concat(Tm(o,e,t,r));return i}}function cT(n,e,t,r,s){const i=e._queryIdentifier,o=n.views.get(i);if(!o){let a=dc(t,s?r:null),l=!1;a?l=!0:r instanceof W?(a=Ld(t,r),l=!1):(a=W.EMPTY_NODE,l=!1);const u=sl(new zn(a,l,!1),new zn(r,s,!1));return new fk(e,u)}return o}function wk(n,e,t,r,s,i){const o=cT(n,e,r,s,i);return n.views.has(e._queryIdentifier)||n.views.set(e._queryIdentifier,o),gk(o,t),yk(o,t)}function vk(n,e,t,r){const s=e._queryIdentifier,i=[];let o=[];const a=Gn(n);if(s==="default")for(const[l,u]of n.views.entries())o=o.concat(Em(u,t,r)),Im(u)&&(n.views.delete(l),u.query._queryParams.loadsAllData()||i.push(u.query));else{const l=n.views.get(s);l&&(o=o.concat(Em(l,t,r)),Im(l)&&(n.views.delete(s),l.query._queryParams.loadsAllData()||i.push(l.query)))}return a&&!Gn(n)&&i.push(new(Ek())(e._repo,e._path)),{removed:i,events:o}}function lT(n){const e=[];for(const t of n.views.values())t.query._queryParams.loadsAllData()||e.push(t);return e}function Dn(n,e){let t=null;for(const r of n.views.values())t=t||mk(r,e);return t}function uT(n,e){if(e._queryParams.loadsAllData())return ol(n);{const r=e._queryIdentifier;return n.views.get(r)}}function hT(n,e){return uT(n,e)!=null}function Gn(n){return ol(n)!=null}function ol(n){for(const e of n.views.values())if(e.query._queryParams.loadsAllData())return e;return null}/**
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
 */let mc;function Ak(n){O(!mc,"__referenceConstructor has already been defined"),mc=n}function bk(){return O(mc,"Reference.ts has not been loaded"),mc}let Rk=1;class wm{constructor(e){this.listenProvider_=e,this.syncPointTree_=new ge(null),this.pendingWriteTree_=tk(),this.tagToQueryMap=new Map,this.queryToTagMap=new Map}}function dT(n,e,t,r,s){return $0(n.pendingWriteTree_,e,t,r,s),s?jo(n,new Dr(XE(),e,t)):[]}function _r(n,e,t=!1){const r=j0(n.pendingWriteTree_,e);if(W0(n.pendingWriteTree_,e)){let i=new ge(null);return r.snap!=null?i=i.set(oe(),!0):Je(r.children,o=>{i=i.set(new de(o),!0)}),jo(n,new uc(r.path,i,t))}else return[]}function $o(n,e,t){return jo(n,new Dr(Od(),e,t))}function Sk(n,e,t){const r=ge.fromObject(t);return jo(n,new To(Od(),e,r))}function Ck(n,e){return jo(n,new Eo(Od(),e))}function Pk(n,e,t){const r=zd(n,t);if(r){const s=Gd(r),i=s.path,o=s.queryId,a=nt(i,e),l=new Eo(Md(o),a);return $d(n,i,l)}else return[]}function gc(n,e,t,r,s=!1){const i=e._path,o=n.syncPointTree_.get(i);let a=[];if(o&&(e._queryIdentifier==="default"||hT(o,e))){const l=vk(o,e,t,r);Tk(o)&&(n.syncPointTree_=n.syncPointTree_.remove(i));const u=l.removed;if(a=l.events,!s){const h=u.findIndex(_=>_._queryParams.loadsAllData())!==-1,f=n.syncPointTree_.findOnPath(i,(_,g)=>Gn(g));if(h&&!f){const _=n.syncPointTree_.subtree(i);if(!_.isEmpty()){const g=Dk(_);for(let w=0;w<g.length;++w){const R=g[w],C=R.query,V=mT(n,R);n.listenProvider_.startListening(Yi(C),wo(n,C),V.hashFn,V.onComplete)}}}!f&&u.length>0&&!r&&(h?n.listenProvider_.stopListening(Yi(e),null):u.forEach(_=>{const g=n.queryToTagMap.get(al(_));n.listenProvider_.stopListening(Yi(_),g)}))}xk(n,u)}return a}function fT(n,e,t,r){const s=zd(n,r);if(s!=null){const i=Gd(s),o=i.path,a=i.queryId,l=nt(o,e),u=new Dr(Md(a),l,t);return $d(n,o,u)}else return[]}function Nk(n,e,t,r){const s=zd(n,r);if(s){const i=Gd(s),o=i.path,a=i.queryId,l=nt(o,e),u=ge.fromObject(t),h=new To(Md(a),l,u);return $d(n,o,h)}else return[]}function Ju(n,e,t,r=!1){const s=e._path;let i=null,o=!1;n.syncPointTree_.foreachOnPath(s,(_,g)=>{const w=nt(_,s);i=i||Dn(g,w),o=o||Gn(g)});let a=n.syncPointTree_.get(s);a?(o=o||Gn(a),i=i||Dn(a,oe())):(a=new aT,n.syncPointTree_=n.syncPointTree_.set(s,a));let l;i!=null?l=!0:(l=!1,i=W.EMPTY_NODE,n.syncPointTree_.subtree(s).foreachChild((g,w)=>{const R=Dn(w,oe());R&&(i=i.updateImmediateChild(g,R))}));const u=hT(a,e);if(!u&&!e._queryParams.loadsAllData()){const _=al(e);O(!n.queryToTagMap.has(_),"View does not exist, but we have a tag");const g=Vk();n.queryToTagMap.set(_,g),n.tagToQueryMap.set(g,_)}const h=il(n.pendingWriteTree_,s);let f=wk(a,e,t,h,i,l);if(!u&&!o&&!r){const _=uT(a,e);f=f.concat(Ok(n,e,_))}return f}function qd(n,e,t){const s=n.pendingWriteTree_,i=n.syncPointTree_.findOnPath(e,(o,a)=>{const l=nt(o,e),u=Dn(a,l);if(u)return u});return tT(s,e,i,t,!0)}function kk(n,e){const t=e._path;let r=null;n.syncPointTree_.foreachOnPath(t,(u,h)=>{const f=nt(u,t);r=r||Dn(h,f)});let s=n.syncPointTree_.get(t);s?r=r||Dn(s,oe()):(s=new aT,n.syncPointTree_=n.syncPointTree_.set(t,s));const i=r!=null,o=i?new zn(r,!0,!1):null,a=il(n.pendingWriteTree_,e._path),l=cT(s,e,a,i?o.getNode():W.EMPTY_NODE,i);return _k(l)}function jo(n,e){return pT(e,n.syncPointTree_,null,il(n.pendingWriteTree_,oe()))}function pT(n,e,t,r){if(J(n.path))return _T(n,e,t,r);{const s=e.get(oe());t==null&&s!=null&&(t=Dn(s,oe()));let i=[];const o=Y(n.path),a=n.operationForChild(o),l=e.children.get(o);if(l&&a){const u=t?t.getImmediateChild(o):null,h=nT(r,o);i=i.concat(pT(a,l,u,h))}return s&&(i=i.concat(Bd(s,n,r,t))),i}}function _T(n,e,t,r){const s=e.get(oe());t==null&&s!=null&&(t=Dn(s,oe()));let i=[];return e.children.inorderTraversal((o,a)=>{const l=t?t.getImmediateChild(o):null,u=nT(r,o),h=n.operationForChild(o);h&&(i=i.concat(_T(h,a,l,u)))}),s&&(i=i.concat(Bd(s,n,r,t))),i}function mT(n,e){const t=e.query,r=wo(n,t);return{hashFn:()=>(pk(e)||W.EMPTY_NODE).hash(),onComplete:s=>{if(s==="ok")return r?Pk(n,t._path,r):Ck(n,t._path);{const i=NN(s,t);return gc(n,t,null,i)}}}}function wo(n,e){const t=al(e);return n.queryToTagMap.get(t)}function al(n){return n._path.toString()+"$"+n._queryIdentifier}function zd(n,e){return n.tagToQueryMap.get(e)}function Gd(n){const e=n.indexOf("$");return O(e!==-1&&e<n.length-1,"Bad queryKey."),{queryId:n.substr(e+1),path:new de(n.substr(0,e))}}function $d(n,e,t){const r=n.syncPointTree_.get(e);O(r,"Missing sync point for query tag that we're tracking");const s=il(n.pendingWriteTree_,e);return Bd(r,t,s,null)}function Dk(n){return n.fold((e,t,r)=>{if(t&&Gn(t))return[ol(t)];{let s=[];return t&&(s=lT(t)),Je(r,(i,o)=>{s=s.concat(o)}),s}})}function Yi(n){return n._queryParams.loadsAllData()&&!n._queryParams.isDefault()?new(bk())(n._repo,n._path):n}function xk(n,e){for(let t=0;t<e.length;++t){const r=e[t];if(!r._queryParams.loadsAllData()){const s=al(r),i=n.queryToTagMap.get(s);n.queryToTagMap.delete(s),n.tagToQueryMap.delete(i)}}}function Vk(){return Rk++}function Ok(n,e,t){const r=e._path,s=wo(n,e),i=mT(n,t),o=n.listenProvider_.startListening(Yi(e),s,i.hashFn,i.onComplete),a=n.syncPointTree_.subtree(r);if(s)O(!Gn(a.value),"If we're adding a query, it shouldn't be shadowed");else{const l=a.fold((u,h,f)=>{if(!J(u)&&h&&Gn(h))return[ol(h).query];{let _=[];return h&&(_=_.concat(lT(h).map(g=>g.query))),Je(f,(g,w)=>{_=_.concat(w)}),_}});for(let u=0;u<l.length;++u){const h=l[u];n.listenProvider_.stopListening(Yi(h),wo(n,h))}}return o}/**
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
 */class jd{constructor(e){this.node_=e}getImmediateChild(e){const t=this.node_.getImmediateChild(e);return new jd(t)}node(){return this.node_}}class Wd{constructor(e,t){this.syncTree_=e,this.path_=t}getImmediateChild(e){const t=ke(this.path_,e);return new Wd(this.syncTree_,t)}node(){return qd(this.syncTree_,this.path_)}}const Mk=function(n){return n=n||{},n.timestamp=n.timestamp||new Date().getTime(),n},vm=function(n,e,t){if(!n||typeof n!="object")return n;if(O(".sv"in n,"Unexpected leaf node or priority contents"),typeof n[".sv"]=="string")return Lk(n[".sv"],e,t);if(typeof n[".sv"]=="object")return Fk(n[".sv"],e);O(!1,"Unexpected server value: "+JSON.stringify(n,null,2))},Lk=function(n,e,t){switch(n){case"timestamp":return t.timestamp;default:O(!1,"Unexpected server value: "+n)}},Fk=function(n,e,t){n.hasOwnProperty("increment")||O(!1,"Unexpected server value: "+JSON.stringify(n,null,2));const r=n.increment;typeof r!="number"&&O(!1,"Unexpected increment value: "+r);const s=e.node();if(O(s!==null&&typeof s<"u","Expected ChildrenNode.EMPTY_NODE for nulls"),!s.isLeafNode())return r;const o=s.getValue();return typeof o!="number"?r:o+r},Uk=function(n,e,t,r){return Kd(e,new Wd(t,n),r)},gT=function(n,e,t){return Kd(n,new jd(e),t)};function Kd(n,e,t){const r=n.getPriority().val(),s=vm(r,e.getImmediateChild(".priority"),t);let i;if(n.isLeafNode()){const o=n,a=vm(o.getValue(),e,t);return a!==o.getValue()||s!==o.getPriority().val()?new Be(a,Pe(s)):n}else{const o=n;return i=o,s!==o.getPriority().val()&&(i=i.updatePriority(new Be(s))),o.forEachChild(Ae,(a,l)=>{const u=Kd(l,e.getImmediateChild(a),t);u!==l&&(i=i.updateImmediateChild(a,u))}),i}}/**
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
 */class Hd{constructor(e="",t=null,r={children:{},childCount:0}){this.name=e,this.parent=t,this.node=r}}function Qd(n,e){let t=e instanceof de?e:new de(e),r=n,s=Y(t);for(;s!==null;){const i=us(r.node.children,s)||{children:{},childCount:0};r=new Hd(s,r,i),t=_e(t),s=Y(t)}return r}function ni(n){return n.node.value}function yT(n,e){n.node.value=e,Zu(n)}function IT(n){return n.node.childCount>0}function Bk(n){return ni(n)===void 0&&!IT(n)}function cl(n,e){Je(n.node.children,(t,r)=>{e(new Hd(t,n,r))})}function ET(n,e,t,r){t&&e(n),cl(n,s=>{ET(s,e,!0)})}function qk(n,e,t){let r=n.parent;for(;r!==null;){if(e(r))return!0;r=r.parent}return!1}function Wo(n){return new de(n.parent===null?n.name:Wo(n.parent)+"/"+n.name)}function Zu(n){n.parent!==null&&zk(n.parent,n.name,n)}function zk(n,e,t){const r=Bk(t),s=jt(n.node.children,e);r&&s?(delete n.node.children[e],n.node.childCount--,Zu(n)):!r&&!s&&(n.node.children[e]=t.node,n.node.childCount++,Zu(n))}/**
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
 */const Gk=/[\[\].#$\/\u0000-\u001F\u007F]/,$k=/[\[\].#$\u0000-\u001F\u007F]/,su=10*1024*1024,Yd=function(n){return typeof n=="string"&&n.length!==0&&!Gk.test(n)},TT=function(n){return typeof n=="string"&&n.length!==0&&!$k.test(n)},jk=function(n){return n&&(n=n.replace(/^\/*\.info(\/|$)/,"/")),TT(n)},wT=function(n){return n===null||typeof n=="string"||typeof n=="number"&&!nl(n)||n&&typeof n=="object"&&jt(n,".sv")},eh=function(n,e,t,r){ll(hs(n,"value"),e,t)},ll=function(n,e,t){const r=t instanceof de?new u0(t,n):t;if(e===void 0)throw new Error(n+"contains undefined "+cr(r));if(typeof e=="function")throw new Error(n+"contains a function "+cr(r)+" with contents = "+e.toString());if(nl(e))throw new Error(n+"contains "+e.toString()+" "+cr(r));if(typeof e=="string"&&e.length>su/3&&bc(e)>su)throw new Error(n+"contains a string greater than "+su+" utf8 bytes "+cr(r)+" ('"+e.substring(0,50)+"...')");if(e&&typeof e=="object"){let s=!1,i=!1;if(Je(e,(o,a)=>{if(o===".value")s=!0;else if(o!==".priority"&&o!==".sv"&&(i=!0,!Yd(o)))throw new Error(n+" contains an invalid key ("+o+") "+cr(r)+`.  Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`);h0(r,o),ll(n,a,r),d0(r)}),s&&i)throw new Error(n+' contains ".value" child '+cr(r)+" in addition to actual children.")}},Wk=function(n,e){let t,r;for(t=0;t<e.length;t++){r=e[t];const i=mo(r);for(let o=0;o<i.length;o++)if(!(i[o]===".priority"&&o===i.length-1)){if(!Yd(i[o]))throw new Error(n+"contains an invalid key ("+i[o]+") in path "+r.toString()+`. Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`)}}e.sort(l0);let s=null;for(t=0;t<e.length;t++){if(r=e[t],s!==null&&Tt(s,r))throw new Error(n+"contains a path "+s.toString()+" that is ancestor of another path "+r.toString());s=r}},Kk=function(n,e,t,r){const s=hs(n,"values");if(!(e&&typeof e=="object")||Array.isArray(e))throw new Error(s+" must be an object containing the children to replace.");const i=[];Je(e,(o,a)=>{const l=new de(o);if(ll(s,a,ke(t,l)),Pd(l)===".priority"&&!wT(a))throw new Error(s+"contains an invalid value for '"+l.toString()+"', which must be a valid Firebase priority (a string, finite number, server value, or null).");i.push(l)}),Wk(s,i)},Hk=function(n,e,t){if(nl(e))throw new Error(hs(n,"priority")+"is "+e.toString()+", but must be a valid Firebase priority (a string, finite number, server value, or null).");if(!wT(e))throw new Error(hs(n,"priority")+"must be a valid Firebase priority (a string, finite number, server value, or null).")},vT=function(n,e,t,r){if(!TT(t))throw new Error(hs(n,e)+'was an invalid path = "'+t+`". Paths must be non-empty strings and can't contain ".", "#", "$", "[", or "]"`)},Qk=function(n,e,t,r){t&&(t=t.replace(/^\/*\.info(\/|$)/,"/")),vT(n,e,t)},xi=function(n,e){if(Y(e)===".info")throw new Error(n+" failed = Can't modify data under /.info/")},Yk=function(n,e){const t=e.path.toString();if(typeof e.repoInfo.host!="string"||e.repoInfo.host.length===0||!Yd(e.repoInfo.namespace)&&e.repoInfo.host.split(":")[0]!=="localhost"||t.length!==0&&!jk(t))throw new Error(hs(n,"url")+`must be a valid firebase URL and the path can't contain ".", "#", "$", "[", or "]".`)};/**
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
 */class Xk{constructor(){this.eventLists_=[],this.recursionDepth_=0}}function Xd(n,e){let t=null;for(let r=0;r<e.length;r++){const s=e[r],i=s.getPath();t!==null&&!Nd(i,t.path)&&(n.eventLists_.push(t),t=null),t===null&&(t={events:[],path:i}),t.events.push(s)}t&&n.eventLists_.push(t)}function AT(n,e,t){Xd(n,t),bT(n,r=>Nd(r,e))}function Gt(n,e,t){Xd(n,t),bT(n,r=>Tt(r,e)||Tt(e,r))}function bT(n,e){n.recursionDepth_++;let t=!0;for(let r=0;r<n.eventLists_.length;r++){const s=n.eventLists_[r];if(s){const i=s.path;e(i)?(Jk(n.eventLists_[r]),n.eventLists_[r]=null):t=!1}}t&&(n.eventLists_=[]),n.recursionDepth_--}function Jk(n){for(let e=0;e<n.events.length;e++){const t=n.events[e];if(t!==null){n.events[e]=null;const r=t.getEventRunner();Wi&&je("event: "+t.toString()),ei(r)}}}/**
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
 */const Zk="repo_interrupt",eD=25;class tD{constructor(e,t,r,s){this.repoInfo_=e,this.forceRestClient_=t,this.authTokenProvider_=r,this.appCheckProvider_=s,this.dataUpdateCount=0,this.statsListener_=null,this.eventQueue_=new Xk,this.nextWriteId_=1,this.interceptServerDataCallback_=null,this.onDisconnect_=lc(),this.transactionQueueTree_=new Hd,this.persistentConnection_=null,this.key=this.repoInfo_.toURLString()}toString(){return(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host}}function nD(n,e,t){if(n.stats_=Sd(n.repoInfo_),n.forceRestClient_||VN())n.server_=new cc(n.repoInfo_,(r,s,i,o)=>{Am(n,r,s,i,o)},n.authTokenProvider_,n.appCheckProvider_),setTimeout(()=>bm(n,!0),0);else{if(typeof t<"u"&&t!==null){if(typeof t!="object")throw new Error("Only objects are supported for option databaseAuthVariableOverride");try{Me(t)}catch(r){throw new Error("Invalid authOverride provided: "+r)}}n.persistentConnection_=new Zt(n.repoInfo_,e,(r,s,i,o)=>{Am(n,r,s,i,o)},r=>{bm(n,r)},r=>{sD(n,r)},n.authTokenProvider_,n.appCheckProvider_,t),n.server_=n.persistentConnection_}n.authTokenProvider_.addTokenChangeListener(r=>{n.server_.refreshAuthToken(r)}),n.appCheckProvider_.addTokenChangeListener(r=>{n.server_.refreshAppCheckToken(r.token)}),n.statsReporter_=UN(n.repoInfo_,()=>new F0(n.stats_,n.server_)),n.infoData_=new x0,n.infoSyncTree_=new wm({startListening:(r,s,i,o)=>{let a=[];const l=n.infoData_.getNode(r._path);return l.isEmpty()||(a=$o(n.infoSyncTree_,r._path,l),setTimeout(()=>{o("ok")},0)),a},stopListening:()=>{}}),Zd(n,"connected",!1),n.serverSyncTree_=new wm({startListening:(r,s,i,o)=>(n.server_.listen(r,i,s,(a,l)=>{const u=o(a,l);Gt(n.eventQueue_,r._path,u)}),[]),stopListening:(r,s)=>{n.server_.unlisten(r,s)}})}function rD(n){const t=n.infoData_.getNode(new de(".info/serverTimeOffset")).val()||0;return new Date().getTime()+t}function Jd(n){return Mk({timestamp:rD(n)})}function Am(n,e,t,r,s){n.dataUpdateCount++;const i=new de(e);t=n.interceptServerDataCallback_?n.interceptServerDataCallback_(e,t):t;let o=[];if(s)if(r){const l=Fa(t,u=>Pe(u));o=Nk(n.serverSyncTree_,i,l,s)}else{const l=Pe(t);o=fT(n.serverSyncTree_,i,l,s)}else if(r){const l=Fa(t,u=>Pe(u));o=Sk(n.serverSyncTree_,i,l)}else{const l=Pe(t);o=$o(n.serverSyncTree_,i,l)}let a=i;o.length>0&&(a=hl(n,i)),Gt(n.eventQueue_,a,o)}function bm(n,e){Zd(n,"connected",e),e===!1&&aD(n)}function sD(n,e){Je(e,(t,r)=>{Zd(n,t,r)})}function Zd(n,e,t){const r=new de("/.info/"+e),s=Pe(t);n.infoData_.updateSnapshot(r,s);const i=$o(n.infoSyncTree_,r,s);Gt(n.eventQueue_,r,i)}function RT(n){return n.nextWriteId_++}function iD(n,e,t){const r=kk(n.serverSyncTree_,e);return r!=null?Promise.resolve(r):n.server_.get(e).then(s=>{const i=Pe(s).withIndex(e._queryParams.getIndex());Ju(n.serverSyncTree_,e,t,!0);let o;if(e._queryParams.loadsAllData())o=$o(n.serverSyncTree_,e._path,i);else{const a=wo(n.serverSyncTree_,e);o=fT(n.serverSyncTree_,e._path,i,a)}return Gt(n.eventQueue_,e._path,o),gc(n.serverSyncTree_,e,t,null,!0),i},s=>(ul(n,"get for query "+Me(e)+" failed: "+s),Promise.reject(new Error(s))))}function oD(n,e,t,r,s){ul(n,"set",{path:e.toString(),value:t,priority:r});const i=Jd(n),o=Pe(t,r),a=qd(n.serverSyncTree_,e),l=gT(o,a,i),u=RT(n),h=dT(n.serverSyncTree_,e,l,u,!0);Xd(n.eventQueue_,h),n.server_.put(e.toString(),o.val(!0),(_,g)=>{const w=_==="ok";w||pt("set at "+e+" failed: "+_);const R=_r(n.serverSyncTree_,u,!w);Gt(n.eventQueue_,e,R),Ls(n,s,_,g)});const f=kT(n,e);hl(n,f),Gt(n.eventQueue_,f,[])}function aD(n){ul(n,"onDisconnectEvents");const e=Jd(n),t=lc();Ku(n.onDisconnect_,oe(),(s,i)=>{const o=Uk(s,i,n.serverSyncTree_,e);ti(t,s,o)});let r=[];Ku(t,oe(),(s,i)=>{r=r.concat($o(n.serverSyncTree_,s,i));const o=kT(n,s);hl(n,o)}),n.onDisconnect_=lc(),Gt(n.eventQueue_,oe(),r)}function cD(n,e,t){n.server_.onDisconnectCancel(e.toString(),(r,s)=>{r==="ok"&&Wu(n.onDisconnect_,e),Ls(n,t,r,s)})}function Rm(n,e,t,r){const s=Pe(t);n.server_.onDisconnectPut(e.toString(),s.val(!0),(i,o)=>{i==="ok"&&ti(n.onDisconnect_,e,s),Ls(n,r,i,o)})}function lD(n,e,t,r,s){const i=Pe(t,r);n.server_.onDisconnectPut(e.toString(),i.val(!0),(o,a)=>{o==="ok"&&ti(n.onDisconnect_,e,i),Ls(n,s,o,a)})}function uD(n,e,t,r){if(cu(t)){je("onDisconnect().update() called with empty data.  Don't do anything."),Ls(n,r,"ok",void 0);return}n.server_.onDisconnectMerge(e.toString(),t,(s,i)=>{s==="ok"&&Je(t,(o,a)=>{const l=Pe(a);ti(n.onDisconnect_,ke(e,o),l)}),Ls(n,r,s,i)})}function hD(n,e,t){let r;Y(e._path)===".info"?r=Ju(n.infoSyncTree_,e,t):r=Ju(n.serverSyncTree_,e,t),AT(n.eventQueue_,e._path,r)}function th(n,e,t){let r;Y(e._path)===".info"?r=gc(n.infoSyncTree_,e,t):r=gc(n.serverSyncTree_,e,t),AT(n.eventQueue_,e._path,r)}function dD(n){n.persistentConnection_&&n.persistentConnection_.interrupt(Zk)}function ul(n,...e){let t="";n.persistentConnection_&&(t=n.persistentConnection_.id+":"),je(t,...e)}function Ls(n,e,t,r){e&&ei(()=>{if(t==="ok")e(null);else{const s=(t||"error").toUpperCase();let i=s;r&&(i+=": "+r);const o=new Error(i);o.code=s,e(o)}})}function ST(n,e,t){return qd(n.serverSyncTree_,e,t)||W.EMPTY_NODE}function ef(n,e=n.transactionQueueTree_){if(e||dl(n,e),ni(e)){const t=PT(n,e);O(t.length>0,"Sending zero length transaction queue"),t.every(s=>s.status===0)&&fD(n,Wo(e),t)}else IT(e)&&cl(e,t=>{ef(n,t)})}function fD(n,e,t){const r=t.map(u=>u.currentWriteId),s=ST(n,e,r);let i=s;const o=s.hash();for(let u=0;u<t.length;u++){const h=t[u];O(h.status===0,"tryToSendTransactionQueue_: items in queue should all be run."),h.status=1,h.retryCount++;const f=nt(e,h.path);i=i.updateChild(f,h.currentOutputSnapshotRaw)}const a=i.val(!0),l=e;n.server_.put(l.toString(),a,u=>{ul(n,"transaction put response",{path:l.toString(),status:u});let h=[];if(u==="ok"){const f=[];for(let _=0;_<t.length;_++)t[_].status=2,h=h.concat(_r(n.serverSyncTree_,t[_].currentWriteId)),t[_].onComplete&&f.push(()=>t[_].onComplete(null,!0,t[_].currentOutputSnapshotResolved)),t[_].unwatcher();dl(n,Qd(n.transactionQueueTree_,e)),ef(n,n.transactionQueueTree_),Gt(n.eventQueue_,e,h);for(let _=0;_<f.length;_++)ei(f[_])}else{if(u==="datastale")for(let f=0;f<t.length;f++)t[f].status===3?t[f].status=4:t[f].status=0;else{pt("transaction at "+l.toString()+" failed: "+u);for(let f=0;f<t.length;f++)t[f].status=4,t[f].abortReason=u}hl(n,e)}},o)}function hl(n,e){const t=CT(n,e),r=Wo(t),s=PT(n,t);return pD(n,s,r),r}function pD(n,e,t){if(e.length===0)return;const r=[];let s=[];const o=e.filter(a=>a.status===0).map(a=>a.currentWriteId);for(let a=0;a<e.length;a++){const l=e[a],u=nt(t,l.path);let h=!1,f;if(O(u!==null,"rerunTransactionsUnderNode_: relativePath should not be null."),l.status===4)h=!0,f=l.abortReason,s=s.concat(_r(n.serverSyncTree_,l.currentWriteId,!0));else if(l.status===0)if(l.retryCount>=eD)h=!0,f="maxretry",s=s.concat(_r(n.serverSyncTree_,l.currentWriteId,!0));else{const _=ST(n,l.path,o);l.currentInputSnapshot=_;const g=e[a].update(_.val());if(g!==void 0){ll("transaction failed: Data returned ",g,l.path);let w=Pe(g);typeof g=="object"&&g!=null&&jt(g,".priority")||(w=w.updatePriority(_.getPriority()));const C=l.currentWriteId,V=Jd(n),B=gT(w,_,V);l.currentOutputSnapshotRaw=w,l.currentOutputSnapshotResolved=B,l.currentWriteId=RT(n),o.splice(o.indexOf(C),1),s=s.concat(dT(n.serverSyncTree_,l.path,B,l.currentWriteId,l.applyLocally)),s=s.concat(_r(n.serverSyncTree_,C,!0))}else h=!0,f="nodata",s=s.concat(_r(n.serverSyncTree_,l.currentWriteId,!0))}Gt(n.eventQueue_,t,s),s=[],h&&(e[a].status=2,(function(_){setTimeout(_,Math.floor(0))})(e[a].unwatcher),e[a].onComplete&&(f==="nodata"?r.push(()=>e[a].onComplete(null,!1,e[a].currentInputSnapshot)):r.push(()=>e[a].onComplete(new Error(f),!1,null))))}dl(n,n.transactionQueueTree_);for(let a=0;a<r.length;a++)ei(r[a]);ef(n,n.transactionQueueTree_)}function CT(n,e){let t,r=n.transactionQueueTree_;for(t=Y(e);t!==null&&ni(r)===void 0;)r=Qd(r,t),e=_e(e),t=Y(e);return r}function PT(n,e){const t=[];return NT(n,e,t),t.sort((r,s)=>r.order-s.order),t}function NT(n,e,t){const r=ni(e);if(r)for(let s=0;s<r.length;s++)t.push(r[s]);cl(e,s=>{NT(n,s,t)})}function dl(n,e){const t=ni(e);if(t){let r=0;for(let s=0;s<t.length;s++)t[s].status!==2&&(t[r]=t[s],r++);t.length=r,yT(e,t.length>0?t:void 0)}cl(e,r=>{dl(n,r)})}function kT(n,e){const t=Wo(CT(n,e)),r=Qd(n.transactionQueueTree_,e);return qk(r,s=>{iu(n,s)}),iu(n,r),ET(r,s=>{iu(n,s)}),t}function iu(n,e){const t=ni(e);if(t){const r=[];let s=[],i=-1;for(let o=0;o<t.length;o++)t[o].status===3||(t[o].status===1?(O(i===o-1,"All SENT items should be at beginning of queue."),i=o,t[o].status=3,t[o].abortReason="set"):(O(t[o].status===0,"Unexpected transaction status in abort"),t[o].unwatcher(),s=s.concat(_r(n.serverSyncTree_,t[o].currentWriteId,!0)),t[o].onComplete&&r.push(t[o].onComplete.bind(null,new Error("set"),!1,null))));i===-1?yT(e,void 0):t.length=i+1,Gt(n.eventQueue_,Wo(e),s);for(let o=0;o<r.length;o++)ei(r[o])}}/**
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
 */function _D(n){let e="";const t=n.split("/");for(let r=0;r<t.length;r++)if(t[r].length>0){let s=t[r];try{s=decodeURIComponent(s.replace(/\+/g," "))}catch{}e+="/"+s}return e}function mD(n){const e={};n.charAt(0)==="?"&&(n=n.substring(1));for(const t of n.split("&")){if(t.length===0)continue;const r=t.split("=");r.length===2?e[decodeURIComponent(r[0])]=decodeURIComponent(r[1]):pt(`Invalid query segment '${t}' in query '${n}'`)}return e}const Sm=function(n,e){const t=gD(n),r=t.namespace;t.domain==="firebase.com"&&on(t.host+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead"),(!r||r==="undefined")&&t.domain!=="localhost"&&on("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com"),t.secure||bN();const s=t.scheme==="ws"||t.scheme==="wss";return{repoInfo:new VE(t.host,t.secure,r,s,e,"",r!==t.subdomain),path:new de(t.pathString)}},gD=function(n){let e="",t="",r="",s="",i="",o=!0,a="https",l=443;if(typeof n=="string"){let u=n.indexOf("//");u>=0&&(a=n.substring(0,u-1),n=n.substring(u+2));let h=n.indexOf("/");h===-1&&(h=n.length);let f=n.indexOf("?");f===-1&&(f=n.length),e=n.substring(0,Math.min(h,f)),h<f&&(s=_D(n.substring(h,f)));const _=mD(n.substring(Math.min(n.length,f)));u=e.indexOf(":"),u>=0?(o=a==="https"||a==="wss",l=parseInt(e.substring(u+1),10)):u=e.length;const g=e.slice(0,u);if(g.toLowerCase()==="localhost")t="localhost";else if(g.split(".").length<=2)t=g;else{const w=e.indexOf(".");r=e.substring(0,w).toLowerCase(),t=e.substring(w+1),i=r}"ns"in _&&(i=_.ns)}return{host:e,port:l,domain:t,subdomain:r,secure:o,scheme:a,pathString:s,namespace:i}};/**
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
 */class yD{constructor(e,t,r,s){this.eventType=e,this.eventRegistration=t,this.snapshot=r,this.prevName=s}getPath(){const e=this.snapshot.ref;return this.eventType==="value"?e._path:e.parent._path}getEventType(){return this.eventType}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.getPath().toString()+":"+this.eventType+":"+Me(this.snapshot.exportVal())}}class ID{constructor(e,t,r){this.eventRegistration=e,this.error=t,this.path=r}getPath(){return this.path}getEventType(){return"cancel"}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.path.toString()+":cancel"}}/**
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
 */class tf{constructor(e,t){this.snapshotCallback=e,this.cancelCallback=t}onValue(e,t){this.snapshotCallback.call(null,e,t)}onCancel(e){return O(this.hasCancelCallback,"Raising a cancel event on a listener with no cancel callback"),this.cancelCallback.call(null,e)}get hasCancelCallback(){return!!this.cancelCallback}matches(e){return this.snapshotCallback===e.snapshotCallback||this.snapshotCallback.userCallback!==void 0&&this.snapshotCallback.userCallback===e.snapshotCallback.userCallback&&this.snapshotCallback.context===e.snapshotCallback.context}}/**
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
 */class ED{constructor(e,t){this._repo=e,this._path=t}cancel(){const e=new Kt;return cD(this._repo,this._path,e.wrapCallback(()=>{})),e.promise}remove(){xi("OnDisconnect.remove",this._path);const e=new Kt;return Rm(this._repo,this._path,null,e.wrapCallback(()=>{})),e.promise}set(e){xi("OnDisconnect.set",this._path),eh("OnDisconnect.set",e,this._path);const t=new Kt;return Rm(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}setWithPriority(e,t){xi("OnDisconnect.setWithPriority",this._path),eh("OnDisconnect.setWithPriority",e,this._path),Hk("OnDisconnect.setWithPriority",t);const r=new Kt;return lD(this._repo,this._path,e,t,r.wrapCallback(()=>{})),r.promise}update(e){xi("OnDisconnect.update",this._path),Kk("OnDisconnect.update",e,this._path);const t=new Kt;return uD(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}}/**
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
 */class nf{constructor(e,t,r,s){this._repo=e,this._path=t,this._queryParams=r,this._orderByCalled=s}get key(){return J(this._path)?null:Pd(this._path)}get ref(){return new hn(this._repo,this._path)}get _queryIdentifier(){const e=hm(this._queryParams),t=bd(e);return t==="{}"?"default":t}get _queryObject(){return hm(this._queryParams)}isEqual(e){if(e=X(e),!(e instanceof nf))return!1;const t=this._repo===e._repo,r=Nd(this._path,e._path),s=this._queryIdentifier===e._queryIdentifier;return t&&r&&s}toJSON(){return this.toString()}toString(){return this._repo.toString()+c0(this._path)}}class hn extends nf{constructor(e,t){super(e,t,new Vd,!1)}get parent(){const e=GE(this._path);return e===null?null:new hn(this._repo,e)}get root(){let e=this;for(;e.parent!==null;)e=e.parent;return e}}class vo{constructor(e,t,r){this._node=e,this.ref=t,this._index=r}get priority(){return this._node.getPriority().val()}get key(){return this.ref.key}get size(){return this._node.numChildren()}child(e){const t=new de(e),r=nh(this.ref,e);return new vo(this._node.getChild(t),r,Ae)}exists(){return!this._node.isEmpty()}exportVal(){return this._node.val(!0)}forEach(e){return this._node.isLeafNode()?!1:!!this._node.forEachChild(this._index,(r,s)=>e(new vo(s,nh(this.ref,r),Ae)))}hasChild(e){const t=new de(e);return!this._node.getChild(t).isEmpty()}hasChildren(){return this._node.isLeafNode()?!1:!this._node.isEmpty()}toJSON(){return this.exportVal()}val(){return this._node.val()}}function Nx(n,e){return n=X(n),n._checkNotDeleted("ref"),e!==void 0?nh(n._root,e):n._root}function nh(n,e){return n=X(n),Y(n._path)===null?Qk("child","path",e):vT("child","path",e),new hn(n._repo,ke(n._path,e))}function kx(n){return n=X(n),new ED(n._repo,n._path)}function Dx(n,e){n=X(n),xi("set",n._path),eh("set",e,n._path);const t=new Kt;return oD(n._repo,n._path,e,null,t.wrapCallback(()=>{})),t.promise}function xx(n){n=X(n);const e=new tf(()=>{}),t=new Ko(e);return iD(n._repo,n,t).then(r=>new vo(r,new hn(n._repo,n._path),n._queryParams.getIndex()))}class Ko{constructor(e){this.callbackContext=e}respondsTo(e){return e==="value"}createEvent(e,t){const r=t._queryParams.getIndex();return new yD("value",this,new vo(e.snapshotNode,new hn(t._repo,t._path),r))}getEventRunner(e){return e.getEventType()==="cancel"?()=>this.callbackContext.onCancel(e.error):()=>this.callbackContext.onValue(e.snapshot,null)}createCancelEvent(e,t){return this.callbackContext.hasCancelCallback?new ID(this,e,t):null}matches(e){return e instanceof Ko?!e.callbackContext||!this.callbackContext?!0:e.callbackContext.matches(this.callbackContext):!1}hasAnyCallback(){return this.callbackContext!==null}}function TD(n,e,t,r,s){let i;if(typeof r=="object"&&(i=void 0,s=r),typeof r=="function"&&(i=r),s&&s.onlyOnce){const l=t,u=(h,f)=>{th(n._repo,n,a),l(h,f)};u.userCallback=t.userCallback,u.context=t.context,t=u}const o=new tf(t,i||void 0),a=new Ko(o);return hD(n._repo,n,a),()=>th(n._repo,n,a)}function Vx(n,e,t,r){return TD(n,"value",e,t,r)}function Ox(n,e,t){let r=null;const s=t?new tf(t):null;r=new Ko(s),th(n._repo,n,r)}Ik(hn);Ak(hn);/**
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
 */const wD="FIREBASE_DATABASE_EMULATOR_HOST",rh={};let vD=!1;function AD(n,e,t,r){const s=e.lastIndexOf(":"),i=e.substring(0,s),o=vt(i);n.repoInfo_=new VE(e,o,n.repoInfo_.namespace,n.repoInfo_.webSocketOnly,n.repoInfo_.nodeAdmin,n.repoInfo_.persistenceKey,n.repoInfo_.includeNamespaceInQueryParams,!0,t),r&&(n.authTokenProvider_=r)}function bD(n,e,t,r,s){let i=r||n.options.databaseURL;i===void 0&&(n.options.projectId||on("Can't determine Firebase Database URL. Be sure to include  a Project ID when calling firebase.initializeApp()."),je("Using default host for project ",n.options.projectId),i=`${n.options.projectId}-default-rtdb.firebaseio.com`);let o=Sm(i,s),a=o.repoInfo,l;typeof process<"u"&&K_&&(l=K_[wD]),l?(i=`http://${l}?ns=${a.namespace}`,o=Sm(i,s),a=o.repoInfo):o.repoInfo.secure;const u=new MN(n.name,n.options,e);Yk("Invalid Firebase Database URL",o),J(o.path)||on("Database URL must point to the root of a Firebase Database (not including a child path).");const h=SD(a,n,u,new ON(n,t));return new CD(h,n)}function RD(n,e){const t=rh[e];(!t||t[n.key]!==n)&&on(`Database ${e}(${n.repoInfo_}) has already been deleted.`),dD(n),delete t[n.key]}function SD(n,e,t,r){let s=rh[e.name];s||(s={},rh[e.name]=s);let i=s[n.toURLString()];return i&&on("Database initialized multiple times. Please make sure the format of the database URL matches with each database() call."),i=new tD(n,vD,t,r),s[n.toURLString()]=i,i}class CD{constructor(e,t){this._repoInternal=e,this.app=t,this.type="database",this._instanceStarted=!1}get _repo(){return this._instanceStarted||(nD(this._repoInternal,this.app.options.appId,this.app.options.databaseAuthVariableOverride),this._instanceStarted=!0),this._repoInternal}get _root(){return this._rootInternal||(this._rootInternal=new hn(this._repo,oe())),this._rootInternal}_delete(){return this._rootInternal!==null&&(RD(this._repo,this.app.name),this._repoInternal=null,this._rootInternal=null),Promise.resolve()}_checkNotDeleted(e){this._rootInternal===null&&on("Cannot call "+e+" on a deleted database.")}}function PD(n=Sc(),e){const t=Us(n,"database").getImmediate({identifier:e});if(!t._instanceStarted){const r=vc("database");r&&ND(t,...r)}return t}function ND(n,e,t,r={}){n=X(n),n._checkNotDeleted("useEmulator");const s=`${e}:${t}`,i=n._repoInternal;if(n._instanceStarted){if(s===n._repoInternal.repoInfo_.host&&en(r,i.repoInfo_.emulatorOptions))return;on("connectDatabaseEmulator() cannot initialize or alter the emulator configuration after the database instance has started.")}let o;if(i.repoInfo_.nodeAdmin)r.mockUserToken&&on('mockUserToken is not supported by the Admin SDK. For client access with mock users, please use the "firebase" package instead of "firebase-admin".'),o=new xa(xa.OWNER);else if(r.mockUserToken){const a=typeof r.mockUserToken=="string"?r.mockUserToken:ah(r.mockUserToken,n.app.options.projectId);o=new xa(a)}vt(e)&&(Ao(e),Ac("Database",!0)),AD(i,s,r,o)}/**
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
 */function kD(n){IN(Bs),nn(new qt("database",(e,{instanceIdentifier:t})=>{const r=e.getProvider("app").getImmediate(),s=e.getProvider("auth-internal"),i=e.getProvider("app-check-internal");return bD(r,s,i,t)},"PUBLIC").setMultipleInstances(!0)),ht(H_,Q_,n),ht(H_,Q_,"esm2020")}/**
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
 */const DD={".sv":"timestamp"};function Mx(){return DD}Zt.prototype.simpleListen=function(n,e){this.sendRequest("q",{p:n},e)};Zt.prototype.echo=function(n,e){this.sendRequest("echo",{d:n},e)};kD();const xD={apiKey:"AIzaSyBdE26vC0UAprsdTgBcmYrVuO67ZbccMTA",authDomain:"apps-script-api-443402.firebaseapp.com",databaseURL:"https://apps-script-api-443402-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"apps-script-api-443402",storageBucket:"apps-script-api-443402.firebasestorage.app",messagingSenderId:"46453918785",appId:"1:46453918785:web:a3c386def8dfe69f768ac0",measurementId:"G-TCZ9TL8FLW"},fl=Qm(xD),VD=RI(fl,{localCache:jI({tabManager:KI()})},"anxi-app"),OD=HP(fl),MD=gN(fl,"asia-east1"),LD=PD(fl),Lx=Object.freeze(Object.defineProperty({__proto__:null,db:VD,functions:MD,rtdb:LD,storage:OD},Symbol.toStringTag,{value:"Module"}));function DT(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const FD=DT,xT=new bo("auth","Firebase",DT());/**
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
 */const yc=new Rc("@firebase/auth");function UD(n,...e){yc.logLevel<=re.WARN&&yc.warn(`Auth (${Bs}): ${n}`,...e)}function Va(n,...e){yc.logLevel<=re.ERROR&&yc.error(`Auth (${Bs}): ${n}`,...e)}/**
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
 */function Cm(n,...e){throw rf(n,...e)}function VT(n,...e){return rf(n,...e)}function OT(n,e,t){const r={...FD(),[e]:t};return new bo("auth","Firebase",r).create(e,{appName:n.name})}function Oa(n){return OT(n,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function rf(n,...e){if(typeof n!="string"){const t=e[0],r=[...e.slice(1)];return r[0]&&(r[0].appName=n.name),n._errorFactory.create(t,...r)}return xT.create(n,...e)}function ae(n,e,...t){if(!n)throw rf(e,...t)}function Xi(n){const e="INTERNAL ASSERTION FAILED: "+n;throw Va(e),new Error(e)}function Ic(n,e){n||Xi(e)}function BD(){return Pm()==="http:"||Pm()==="https:"}function Pm(){var n;return typeof self<"u"&&((n=self.location)==null?void 0:n.protocol)||null}/**
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
 */function qD(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(BD()||Mw()||"connection"in navigator)?navigator.onLine:!0}function zD(){if(typeof navigator>"u")return null;const n=navigator;return n.languages&&n.languages[0]||n.language||null}/**
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
 */class Ho{constructor(e,t){this.shortDelay=e,this.longDelay=t,Ic(t>e,"Short delay should be less than long delay!"),this.isMobile=ch()||$m()}get(){return qD()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
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
 */function GD(n,e){Ic(n.emulator,"Emulator should always be set here");const{url:t}=n.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
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
 */class MT{static initialize(e,t,r){this.fetchImpl=e,t&&(this.headersImpl=t),r&&(this.responseImpl=r)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;Xi("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;Xi("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;Xi("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
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
 */const $D={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
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
 */const jD=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],WD=new Ho(3e4,6e4);function LT(n,e){return n.tenantId&&!e.tenantId?{...e,tenantId:n.tenantId}:e}async function pl(n,e,t,r,s={}){return FT(n,s,async()=>{let i={},o={};r&&(e==="GET"?o=r:i={body:JSON.stringify(r)});const a=lh({key:n.config.apiKey,...o}).slice(1),l=await n._getAdditionalHeaders();l["Content-Type"]="application/json",n.languageCode&&(l["X-Firebase-Locale"]=n.languageCode);const u={method:e,headers:l,...i};return Ow()||(u.referrerPolicy="no-referrer"),n.emulatorConfig&&vt(n.emulatorConfig.host)&&(u.credentials="include"),MT.fetch()(await UT(n,n.config.apiHost,t,a),u)})}async function FT(n,e,t){n._canInitEmulator=!1;const r={...$D,...e};try{const s=new KD(n),i=await Promise.race([t(),s.promise]);s.clearNetworkTimeout();const o=await i.json();if("needConfirmation"in o)throw wa(n,"account-exists-with-different-credential",o);if(i.ok&&!("errorMessage"in o))return o;{const a=i.ok?o.errorMessage:o.error.message,[l,u]=a.split(" : ");if(l==="FEDERATED_USER_ID_ALREADY_LINKED")throw wa(n,"credential-already-in-use",o);if(l==="EMAIL_EXISTS")throw wa(n,"email-already-in-use",o);if(l==="USER_DISABLED")throw wa(n,"user-disabled",o);const h=r[l]||l.toLowerCase().replace(/[_\s]+/g,"-");if(u)throw OT(n,h,u);Cm(n,h)}}catch(s){if(s instanceof $t)throw s;Cm(n,"network-request-failed",{message:String(s)})}}async function UT(n,e,t,r){const s=`${e}${t}?${r}`,i=n,o=i.config.emulator?GD(n.config,s):`${n.config.apiScheme}://${s}`;return jD.includes(t)&&(await i._persistenceManagerAvailable,i._getPersistenceType()==="COOKIE")?i._getPersistence()._getFinalTarget(o).toString():o}class KD{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,r)=>{this.timer=setTimeout(()=>r(VT(this.auth,"network-request-failed")),WD.get())})}}function wa(n,e,t){const r={appName:n.name};t.email&&(r.email=t.email),t.phoneNumber&&(r.phoneNumber=t.phoneNumber);const s=VT(n,e,r);return s.customData._tokenResponse=t,s}/**
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
 */async function HD(n,e){return pl(n,"POST","/v1/accounts:delete",e)}async function Ec(n,e){return pl(n,"POST","/v1/accounts:lookup",e)}/**
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
 */function Ji(n){if(n)try{const e=new Date(Number(n));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function QD(n,e=!1){const t=X(n),r=await t.getIdToken(e),s=BT(r);ae(s&&s.exp&&s.auth_time&&s.iat,t.auth,"internal-error");const i=typeof s.firebase=="object"?s.firebase:void 0,o=i==null?void 0:i.sign_in_provider;return{claims:s,token:r,authTime:Ji(ou(s.auth_time)),issuedAtTime:Ji(ou(s.iat)),expirationTime:Ji(ou(s.exp)),signInProvider:o||null,signInSecondFactor:(i==null?void 0:i.sign_in_second_factor)||null}}function ou(n){return Number(n)*1e3}function BT(n){const[e,t,r]=n.split(".");if(e===void 0||t===void 0||r===void 0)return Va("JWT malformed, contained fewer than 3 sections"),null;try{const s=La(t);return s?JSON.parse(s):(Va("Failed to decode base64 JWT payload"),null)}catch(s){return Va("Caught error parsing JWT payload as JSON",s==null?void 0:s.toString()),null}}function Nm(n){const e=BT(n);return ae(e,"internal-error"),ae(typeof e.exp<"u","internal-error"),ae(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
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
 */async function sh(n,e,t=!1){if(t)return e;try{return await e}catch(r){throw r instanceof $t&&YD(r)&&n.auth.currentUser===n&&await n.auth.signOut(),r}}function YD({code:n}){return n==="auth/user-disabled"||n==="auth/user-token-expired"}/**
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
 */class XD{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){const t=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),t}else{this.errorBackoff=3e4;const r=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,r)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
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
 */class ih{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=Ji(this.lastLoginAt),this.creationTime=Ji(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
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
 */async function Tc(n){var f;const e=n.auth,t=await n.getIdToken(),r=await sh(n,Ec(e,{idToken:t}));ae(r==null?void 0:r.users.length,e,"internal-error");const s=r.users[0];n._notifyReloadListener(s);const i=(f=s.providerUserInfo)!=null&&f.length?qT(s.providerUserInfo):[],o=ZD(n.providerData,i),a=n.isAnonymous,l=!(n.email&&s.passwordHash)&&!(o!=null&&o.length),u=a?l:!1,h={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:o,metadata:new ih(s.createdAt,s.lastLoginAt),isAnonymous:u};Object.assign(n,h)}async function JD(n){const e=X(n);await Tc(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function ZD(n,e){return[...n.filter(r=>!e.some(s=>s.providerId===r.providerId)),...e]}function qT(n){return n.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||"",displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}/**
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
 */async function ex(n,e){const t=await FT(n,{},async()=>{const r=lh({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:s,apiKey:i}=n.config,o=await UT(n,s,"/v1/token",`key=${i}`),a=await n._getAdditionalHeaders();a["Content-Type"]="application/x-www-form-urlencoded";const l={method:"POST",headers:a,body:r};return n.emulatorConfig&&vt(n.emulatorConfig.host)&&(l.credentials="include"),MT.fetch()(o,l)});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function tx(n,e){return pl(n,"POST","/v2/accounts:revokeToken",LT(n,e))}/**
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
 */class cs{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){ae(e.idToken,"internal-error"),ae(typeof e.idToken<"u","internal-error"),ae(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):Nm(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){ae(e.length!==0,"internal-error");const t=Nm(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(ae(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:r,refreshToken:s,expiresIn:i}=await ex(e,t);this.updateTokensAndExpiration(r,s,Number(i))}updateTokensAndExpiration(e,t,r){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+r*1e3}static fromJSON(e,t){const{refreshToken:r,accessToken:s,expirationTime:i}=t,o=new cs;return r&&(ae(typeof r=="string","internal-error",{appName:e}),o.refreshToken=r),s&&(ae(typeof s=="string","internal-error",{appName:e}),o.accessToken=s),i&&(ae(typeof i=="number","internal-error",{appName:e}),o.expirationTime=i),o}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new cs,this.toJSON())}_performRefresh(){return Xi("not implemented")}}/**
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
 */function Tn(n,e){ae(typeof n=="string"||typeof n>"u","internal-error",{appName:e})}class Ft{constructor({uid:e,auth:t,stsTokenManager:r,...s}){this.providerId="firebase",this.proactiveRefresh=new XD(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=r,this.accessToken=r.accessToken,this.displayName=s.displayName||null,this.email=s.email||null,this.emailVerified=s.emailVerified||!1,this.phoneNumber=s.phoneNumber||null,this.photoURL=s.photoURL||null,this.isAnonymous=s.isAnonymous||!1,this.tenantId=s.tenantId||null,this.providerData=s.providerData?[...s.providerData]:[],this.metadata=new ih(s.createdAt||void 0,s.lastLoginAt||void 0)}async getIdToken(e){const t=await sh(this,this.stsTokenManager.getToken(this.auth,e));return ae(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return QD(this,e)}reload(){return JD(this)}_assign(e){this!==e&&(ae(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>({...t})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new Ft({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return t.metadata._copy(this.metadata),t}_onReload(e){ae(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let r=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),r=!0),t&&await Tc(this),await this.auth._persistUserIfCurrent(this),r&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(Vt(this.auth.app))return Promise.reject(Oa(this.auth));const e=await this.getIdToken();return await sh(this,HD(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){const r=t.displayName??void 0,s=t.email??void 0,i=t.phoneNumber??void 0,o=t.photoURL??void 0,a=t.tenantId??void 0,l=t._redirectEventId??void 0,u=t.createdAt??void 0,h=t.lastLoginAt??void 0,{uid:f,emailVerified:_,isAnonymous:g,providerData:w,stsTokenManager:R}=t;ae(f&&R,e,"internal-error");const C=cs.fromJSON(this.name,R);ae(typeof f=="string",e,"internal-error"),Tn(r,e.name),Tn(s,e.name),ae(typeof _=="boolean",e,"internal-error"),ae(typeof g=="boolean",e,"internal-error"),Tn(i,e.name),Tn(o,e.name),Tn(a,e.name),Tn(l,e.name),Tn(u,e.name),Tn(h,e.name);const V=new Ft({uid:f,auth:e,email:s,emailVerified:_,displayName:r,isAnonymous:g,photoURL:o,phoneNumber:i,tenantId:a,stsTokenManager:C,createdAt:u,lastLoginAt:h});return w&&Array.isArray(w)&&(V.providerData=w.map(B=>({...B}))),l&&(V._redirectEventId=l),V}static async _fromIdTokenResponse(e,t,r=!1){const s=new cs;s.updateFromServerResponse(t);const i=new Ft({uid:t.localId,auth:e,stsTokenManager:s,isAnonymous:r});return await Tc(i),i}static async _fromGetAccountInfoResponse(e,t,r){const s=t.users[0];ae(s.localId!==void 0,"internal-error");const i=s.providerUserInfo!==void 0?qT(s.providerUserInfo):[],o=!(s.email&&s.passwordHash)&&!(i!=null&&i.length),a=new cs;a.updateFromIdToken(r);const l=new Ft({uid:s.localId,auth:e,stsTokenManager:a,isAnonymous:o}),u={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:i,metadata:new ih(s.createdAt,s.lastLoginAt),isAnonymous:!(s.email&&s.passwordHash)&&!(i!=null&&i.length)};return Object.assign(l,u),l}}/**
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
 */const km=new Map;function mr(n){Ic(n instanceof Function,"Expected a class definition");let e=km.get(n);return e?(Ic(e instanceof n,"Instance stored in cache mismatched with class"),e):(e=new n,km.set(n,e),e)}/**
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
 */class zT{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}zT.type="NONE";const Dm=zT;/**
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
 */function au(n,e,t){return`firebase:${n}:${e}:${t}`}class ls{constructor(e,t,r){this.persistence=e,this.auth=t,this.userKey=r;const{config:s,name:i}=this.auth;this.fullUserKey=au(this.userKey,s.apiKey,i),this.fullPersistenceKey=au("persistence",s.apiKey,i),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const t=await Ec(this.auth,{idToken:e}).catch(()=>{});return t?Ft._fromGetAccountInfoResponse(this.auth,t,e):null}return Ft._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,r="authUser"){if(!t.length)return new ls(mr(Dm),e,r);const s=(await Promise.all(t.map(async u=>{if(await u._isAvailable())return u}))).filter(u=>u);let i=s[0]||mr(Dm);const o=au(r,e.config.apiKey,e.name);let a=null;for(const u of t)try{const h=await u._get(o);if(h){let f;if(typeof h=="string"){const _=await Ec(e,{idToken:h}).catch(()=>{});if(!_)break;f=await Ft._fromGetAccountInfoResponse(e,_,h)}else f=Ft._fromJSON(e,h);u!==i&&(a=f),i=u;break}}catch{}const l=s.filter(u=>u._shouldAllowMigration);return!i._shouldAllowMigration||!l.length?new ls(i,e,r):(i=l[0],a&&await i._set(o,a.toJSON()),await Promise.all(t.map(async u=>{if(u!==i)try{await u._remove(o)}catch{}})),new ls(i,e,r))}}/**
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
 */function xm(n){const e=n.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(ix(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(nx(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(ax(e))return"Blackberry";if(cx(e))return"Webos";if(rx(e))return"Safari";if((e.includes("chrome/")||sx(e))&&!e.includes("edge/"))return"Chrome";if(ox(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,r=n.match(t);if((r==null?void 0:r.length)===2)return r[1]}return"Other"}function nx(n=_t()){return/firefox\//i.test(n)}function rx(n=_t()){const e=n.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function sx(n=_t()){return/crios\//i.test(n)}function ix(n=_t()){return/iemobile/i.test(n)}function ox(n=_t()){return/android/i.test(n)}function ax(n=_t()){return/blackberry/i.test(n)}function cx(n=_t()){return/webos/i.test(n)}/**
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
 */function GT(n,e=[]){let t;switch(n){case"Browser":t=xm(_t());break;case"Worker":t=`${xm(_t())}-${n}`;break;default:t=n}const r=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${Bs}/${r}`}/**
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
 */class lx{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const r=i=>new Promise((o,a)=>{try{const l=e(i);o(l)}catch(l){a(l)}});r.onAbort=t,this.queue.push(r);const s=this.queue.length-1;return()=>{this.queue[s]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const r of this.queue)await r(e),r.onAbort&&t.push(r.onAbort)}catch(r){t.reverse();for(const s of t)try{s()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:r==null?void 0:r.message})}}}/**
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
 */async function ux(n,e={}){return pl(n,"GET","/v2/passwordPolicy",LT(n,e))}/**
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
 */const hx=6;class dx{constructor(e){var r;const t=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=t.minPasswordLength??hx,t.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=t.maxPasswordLength),t.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=t.containsLowercaseCharacter),t.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=t.containsUppercaseCharacter),t.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=t.containsNumericCharacter),t.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=t.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=((r=e.allowedNonAlphanumericCharacters)==null?void 0:r.join(""))??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){const t={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,t),this.validatePasswordCharacterOptions(e,t),t.isValid&&(t.isValid=t.meetsMinPasswordLength??!0),t.isValid&&(t.isValid=t.meetsMaxPasswordLength??!0),t.isValid&&(t.isValid=t.containsLowercaseLetter??!0),t.isValid&&(t.isValid=t.containsUppercaseLetter??!0),t.isValid&&(t.isValid=t.containsNumericCharacter??!0),t.isValid&&(t.isValid=t.containsNonAlphanumericCharacter??!0),t}validatePasswordLengthOptions(e,t){const r=this.customStrengthOptions.minPasswordLength,s=this.customStrengthOptions.maxPasswordLength;r&&(t.meetsMinPasswordLength=e.length>=r),s&&(t.meetsMaxPasswordLength=e.length<=s)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let r;for(let s=0;s<e.length;s++)r=e.charAt(s),this.updatePasswordCharacterOptionsStatuses(t,r>="a"&&r<="z",r>="A"&&r<="Z",r>="0"&&r<="9",this.allowedNonAlphanumericCharacters.includes(r))}updatePasswordCharacterOptionsStatuses(e,t,r,s,i){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=r)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=s)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=i))}}/**
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
 */class fx{constructor(e,t,r,s){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=r,this.config=s,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new Vm(this),this.idTokenSubscription=new Vm(this),this.beforeStateQueue=new lx(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=xT,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=s.sdkClientVersion,this._persistenceManagerAvailable=new Promise(i=>this._resolvePersistenceManagerAvailable=i)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=mr(t)),this._initializationPromise=this.queue(async()=>{var r,s,i;if(!this._deleted&&(this.persistenceManager=await ls.create(this,e),(r=this._resolvePersistenceManagerAvailable)==null||r.call(this),!this._deleted)){if((s=this._popupRedirectResolver)!=null&&s._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=((i=this.currentUser)==null?void 0:i.uid)||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await Ec(this,{idToken:e}),r=await Ft._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(r)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var i;if(Vt(this.app)){const o=this.app.settings.authIdToken;return o?new Promise(a=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(o).then(a,a))}):this.directlySetCurrentUser(null)}const t=await this.assertedPersistence.getCurrentUser();let r=t,s=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const o=(i=this.redirectUser)==null?void 0:i._redirectEventId,a=r==null?void 0:r._redirectEventId,l=await this.tryRedirectSignIn(e);(!o||o===a)&&(l!=null&&l.user)&&(r=l.user,s=!0)}if(!r)return this.directlySetCurrentUser(null);if(!r._redirectEventId){if(s)try{await this.beforeStateQueue.runMiddleware(r)}catch(o){r=t,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(o))}return r?this.reloadAndSetCurrentUserOrClear(r):this.directlySetCurrentUser(null)}return ae(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===r._redirectEventId?this.directlySetCurrentUser(r):this.reloadAndSetCurrentUserOrClear(r)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await Tc(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=zD()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(Vt(this.app))return Promise.reject(Oa(this));const t=e?X(e):null;return t&&ae(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&ae(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return Vt(this.app)?Promise.reject(Oa(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return Vt(this.app)?Promise.reject(Oa(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(mr(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await ux(this),t=new dx(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new bo("auth","Firebase",e())}onAuthStateChanged(e,t,r){return this.registerStateListener(this.authStateSubscription,e,t,r)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,r){return this.registerStateListener(this.idTokenSubscription,e,t,r)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const r=this.onAuthStateChanged(()=>{r(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),r={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(r.tenantId=this.tenantId),await tx(this,r)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)==null?void 0:e.toJSON()}}async _setRedirectUser(e,t){const r=await this.getOrInitRedirectPersistenceManager(t);return e===null?r.removeCurrentUser():r.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&mr(e)||this._popupRedirectResolver;ae(t,this,"argument-error"),this.redirectPersistenceManager=await ls.create(this,[mr(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,r;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)==null?void 0:t._redirectEventId)===e?this._currentUser:((r=this.redirectUser)==null?void 0:r._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const e=((t=this.currentUser)==null?void 0:t.uid)??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,r,s){if(this._deleted)return()=>{};const i=typeof t=="function"?t:t.next.bind(t);let o=!1;const a=this._isInitialized?Promise.resolve():this._initializationPromise;if(ae(a,this,"internal-error"),a.then(()=>{o||i(this.currentUser)}),typeof t=="function"){const l=e.addObserver(t,r,s);return()=>{o=!0,l()}}else{const l=e.addObserver(t);return()=>{o=!0,l()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return ae(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=GT(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var s;const e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);const t=await((s=this.heartbeatServiceProvider.getImmediate({optional:!0}))==null?void 0:s.getHeartbeatsHeader());t&&(e["X-Firebase-Client"]=t);const r=await this._getAppCheckToken();return r&&(e["X-Firebase-AppCheck"]=r),e}async _getAppCheckToken(){var t;if(Vt(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=await((t=this.appCheckServiceProvider.getImmediate({optional:!0}))==null?void 0:t.getToken());return e!=null&&e.error&&UD(`Error while retrieving App Check token: ${e.error}`),e==null?void 0:e.token}}function px(n){return X(n)}class Vm{constructor(e){this.auth=e,this.observer=null,this.addObserver=jw(t=>this.observer=t)}get next(){return ae(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}function _x(n,e){const t=(e==null?void 0:e.persistence)||[],r=(Array.isArray(t)?t:[t]).map(mr);e!=null&&e.errorMap&&n._updateErrorMap(e.errorMap),n._initializeWithPersistence(r,e==null?void 0:e.popupRedirectResolver)}new Ho(3e4,6e4);/**
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
 */new Ho(2e3,1e4);/**
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
 */new Ho(3e4,6e4);/**
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
 */new Ho(5e3,15e3);var Om="@firebase/auth",Mm="1.11.1";/**
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
 */class mx{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)==null?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(r=>{e((r==null?void 0:r.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){ae(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
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
 */function gx(n){switch(n){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function yx(n){nn(new qt("auth",(e,{options:t})=>{const r=e.getProvider("app").getImmediate(),s=e.getProvider("heartbeat"),i=e.getProvider("app-check-internal"),{apiKey:o,authDomain:a}=r.options;ae(o&&!o.includes(":"),"invalid-api-key",{appName:r.name});const l={apiKey:o,authDomain:a,clientPlatform:n,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:GT(n)},u=new fx(r,s,i,l);return _x(u,t),u},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,r)=>{e.getProvider("auth-internal").initialize()})),nn(new qt("auth-internal",e=>{const t=px(e.getProvider("auth").getImmediate());return(r=>new mx(r))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),ht(Om,Mm,gx(n)),ht(Om,Mm,"esm2020")}/**
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
 */const Ix=300;Dw("authIdTokenMaxAge");yx("Browser");export{Bu as A,Vx as B,LS as C,xS as D,Cx as E,Qn as F,Nx as G,LD as H,AC as I,Mx as J,Dx as K,sC as L,OD as M,iC as N,Ax as O,bx as P,VS as Q,PC as R,ce as T,aC as a,RC as b,bC as c,_S as d,mS as e,VD as f,oC as g,vC as h,Sx as i,AI as j,SS as k,Lx as l,MD as m,xx as n,uC as o,JS as p,tC as q,Rx as r,gN as s,HP as t,Px as u,SC as v,vx as w,FS as x,Ox as y,kx as z};
