import{q as jm}from"./vendor-p4F8ADWg.js";const Wm=()=>{};var Ru={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Dd={NODE_ADMIN:!1,SDK_VERSION:"${JSCORE_VERSION}"};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const O=function(n,e){if(!n)throw sr(e)},sr=function(n){return new Error("Firebase Database ("+Dd.SDK_VERSION+") INTERNAL ASSERT FAILED: "+n)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Od=function(n){const e=[];let t=0;for(let r=0;r<n.length;r++){let s=n.charCodeAt(r);s<128?e[t++]=s:s<2048?(e[t++]=s>>6|192,e[t++]=s&63|128):(s&64512)===55296&&r+1<n.length&&(n.charCodeAt(r+1)&64512)===56320?(s=65536+((s&1023)<<10)+(n.charCodeAt(++r)&1023),e[t++]=s>>18|240,e[t++]=s>>12&63|128,e[t++]=s>>6&63|128,e[t++]=s&63|128):(e[t++]=s>>12|224,e[t++]=s>>6&63|128,e[t++]=s&63|128)}return e},zm=function(n){const e=[];let t=0,r=0;for(;t<n.length;){const s=n[t++];if(s<128)e[r++]=String.fromCharCode(s);else if(s>191&&s<224){const i=n[t++];e[r++]=String.fromCharCode((s&31)<<6|i&63)}else if(s>239&&s<365){const i=n[t++],a=n[t++],c=n[t++],l=((s&7)<<18|(i&63)<<12|(a&63)<<6|c&63)-65536;e[r++]=String.fromCharCode(55296+(l>>10)),e[r++]=String.fromCharCode(56320+(l&1023))}else{const i=n[t++],a=n[t++];e[r++]=String.fromCharCode((s&15)<<12|(i&63)<<6|a&63)}}return e.join("")},sc={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,e){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let s=0;s<n.length;s+=3){const i=n[s],a=s+1<n.length,c=a?n[s+1]:0,l=s+2<n.length,h=l?n[s+2]:0,f=i>>2,p=(i&3)<<4|c>>4;let m=(c&15)<<2|h>>6,v=h&63;l||(v=64,a||(m=64)),r.push(t[f],t[p],t[m],t[v])}return r.join("")},encodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(n):this.encodeByteArray(Od(n),e)},decodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(n):zm(this.decodeStringToByteArray(n,e))},decodeStringToByteArray(n,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let s=0;s<n.length;){const i=t[n.charAt(s++)],c=s<n.length?t[n.charAt(s)]:0;++s;const h=s<n.length?t[n.charAt(s)]:64;++s;const p=s<n.length?t[n.charAt(s)]:64;if(++s,i==null||c==null||h==null||p==null)throw new Hm;const m=i<<2|c>>4;if(r.push(m),h!==64){const v=c<<4&240|h>>2;if(r.push(v),p!==64){const R=h<<6&192|p;r.push(R)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class Hm extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Vd=function(n){const e=Od(n);return sc.encodeByteArray(e,!0)},fi=function(n){return Vd(n).replace(/\./g,"")},pi=function(n){try{return sc.decodeString(n,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gm(n){return Md(void 0,n)}function Md(n,e){if(!(e instanceof Object))return e;switch(e.constructor){case Date:const t=e;return new Date(t.getTime());case Object:n===void 0&&(n={});break;case Array:n=[];break;default:return e}for(const t in e)!e.hasOwnProperty(t)||!Km(t)||(n[t]=Md(n[t],e[t]));return n}function Km(n){return n!=="__proto__"}/**
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
 */function Qm(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
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
 */const Ym=()=>Qm().__FIREBASE_DEFAULTS__,Xm=()=>{if(typeof process>"u"||typeof Ru>"u")return;const n=Ru.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},Jm=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=n&&pi(n[1]);return e&&JSON.parse(e)},$i=()=>{try{return Wm()||Ym()||Xm()||Jm()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},Zm=n=>{var e,t;return(t=(e=$i())==null?void 0:e.emulatorHosts)==null?void 0:t[n]},ji=n=>{const e=Zm(n);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const r=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),r]:[e.substring(0,t),r]},Ld=()=>{var n;return(n=$i())==null?void 0:n.config},eg=n=>{var e;return(e=$i())==null?void 0:e[`_${n}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pt{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,r)=>{t?this.reject(t):this.resolve(r),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,r))}}}/**
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
 */function ut(n){try{return(n.startsWith("http://")||n.startsWith("https://")?new URL(n).hostname:n).endsWith(".cloudworkstations.dev")}catch{return!1}}async function Wi(n){return(await fetch(n,{credentials:"include"})).ok}/**
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
 */function ic(n,e){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},r=e||"demo-project",s=n.iat||0,i=n.sub||n.user_id;if(!i)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const a={iss:`https://securetoken.google.com/${r}`,aud:r,iat:s,exp:s+3600,auth_time:s,sub:i,user_id:i,firebase:{sign_in_provider:"custom",identities:{}},...n};return[fi(JSON.stringify(t)),fi(JSON.stringify(a)),""].join(".")}const jr={};function tg(){const n={prod:[],emulator:[]};for(const e of Object.keys(jr))jr[e]?n.emulator.push(e):n.prod.push(e);return n}function ng(n){let e=document.getElementById(n),t=!1;return e||(e=document.createElement("div"),e.setAttribute("id",n),t=!0),{created:t,element:e}}let Su=!1;function zi(n,e){if(typeof window>"u"||typeof document>"u"||!ut(window.location.host)||jr[n]===e||jr[n]||Su)return;jr[n]=e;function t(m){return`__firebase__banner__${m}`}const r="__firebase__banner",i=tg().prod.length>0;function a(){const m=document.getElementById(r);m&&m.remove()}function c(m){m.style.display="flex",m.style.background="#7faaf0",m.style.position="fixed",m.style.bottom="5px",m.style.left="5px",m.style.padding=".5em",m.style.borderRadius="5px",m.style.alignItems="center"}function l(m,v){m.setAttribute("width","24"),m.setAttribute("id",v),m.setAttribute("height","24"),m.setAttribute("viewBox","0 0 24 24"),m.setAttribute("fill","none"),m.style.marginLeft="-6px"}function h(){const m=document.createElement("span");return m.style.cursor="pointer",m.style.marginLeft="16px",m.style.fontSize="24px",m.innerHTML=" &times;",m.onclick=()=>{Su=!0,a()},m}function f(m,v){m.setAttribute("id",v),m.innerText="Learn more",m.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",m.setAttribute("target","__blank"),m.style.paddingLeft="5px",m.style.textDecoration="underline"}function p(){const m=ng(r),v=t("text"),R=document.getElementById(v)||document.createElement("span"),k=t("learnmore"),P=document.getElementById(k)||document.createElement("a"),F=t("preprendIcon"),x=document.getElementById(F)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(m.created){const B=m.element;c(B),f(P,k);const j=h();l(x,F),B.append(x,R,P,j),document.body.appendChild(B)}i?(R.innerText="Preview backend disconnected.",x.innerHTML=`<g clip-path="url(#clip0_6013_33858)">
<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6013_33858">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`):(x.innerHTML=`<g clip-path="url(#clip0_6083_34804)">
<path d="M11.4 15.2H12.6V11.2H11.4V15.2ZM12 10C12.1667 10 12.3056 9.94444 12.4167 9.83333C12.5389 9.71111 12.6 9.56667 12.6 9.4C12.6 9.23333 12.5389 9.09444 12.4167 8.98333C12.3056 8.86111 12.1667 8.8 12 8.8C11.8333 8.8 11.6889 8.86111 11.5667 8.98333C11.4556 9.09444 11.4 9.23333 11.4 9.4C11.4 9.56667 11.4556 9.71111 11.5667 9.83333C11.6889 9.94444 11.8333 10 12 10ZM12 18.4C11.1222 18.4 10.2944 18.2333 9.51667 17.9C8.73889 17.5667 8.05556 17.1111 7.46667 16.5333C6.88889 15.9444 6.43333 15.2611 6.1 14.4833C5.76667 13.7056 5.6 12.8778 5.6 12C5.6 11.1111 5.76667 10.2833 6.1 9.51667C6.43333 8.73889 6.88889 8.06111 7.46667 7.48333C8.05556 6.89444 8.73889 6.43333 9.51667 6.1C10.2944 5.76667 11.1222 5.6 12 5.6C12.8889 5.6 13.7167 5.76667 14.4833 6.1C15.2611 6.43333 15.9389 6.89444 16.5167 7.48333C17.1056 8.06111 17.5667 8.73889 17.9 9.51667C18.2333 10.2833 18.4 11.1111 18.4 12C18.4 12.8778 18.2333 13.7056 17.9 14.4833C17.5667 15.2611 17.1056 15.9444 16.5167 16.5333C15.9389 17.1111 15.2611 17.5667 14.4833 17.9C13.7167 18.2333 12.8889 18.4 12 18.4ZM12 17.2C13.4444 17.2 14.6722 16.6944 15.6833 15.6833C16.6944 14.6722 17.2 13.4444 17.2 12C17.2 10.5556 16.6944 9.32778 15.6833 8.31667C14.6722 7.30555 13.4444 6.8 12 6.8C10.5556 6.8 9.32778 7.30555 8.31667 8.31667C7.30556 9.32778 6.8 10.5556 6.8 12C6.8 13.4444 7.30556 14.6722 8.31667 15.6833C9.32778 16.6944 10.5556 17.2 12 17.2Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6083_34804">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`,R.innerText="Preview backend running in this workspace."),R.setAttribute("id",v)}document.readyState==="loading"?window.addEventListener("DOMContentLoaded",p):p()}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function at(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function oc(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(at())}function rg(){var e;const n=(e=$i())==null?void 0:e.forceEnvironment;if(n==="node")return!0;if(n==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function sg(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function ig(){const n=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof n=="object"&&n.id!==void 0}function xd(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function og(){return Dd.NODE_ADMIN===!0}function ag(){return!rg()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function cg(){try{return typeof indexedDB=="object"}catch{return!1}}function lg(){return new Promise((n,e)=>{try{let t=!0;const r="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(r);s.onsuccess=()=>{s.result.close(),t||self.indexedDB.deleteDatabase(r),n(!0)},s.onupgradeneeded=()=>{t=!1},s.onerror=()=>{var i;e(((i=s.error)==null?void 0:i.message)||"")}}catch(t){e(t)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ug="FirebaseError";class wt extends Error{constructor(e,t,r){super(t),this.code=e,this.customData=r,this.name=ug,Object.setPrototypeOf(this,wt.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,_s.prototype.create)}}class _s{constructor(e,t,r){this.service=e,this.serviceName=t,this.errors=r}create(e,...t){const r=t[0]||{},s=`${this.service}/${e}`,i=this.errors[e],a=i?hg(i,r):"Error",c=`${this.serviceName}: ${a} (${s}).`;return new wt(s,c,r)}}function hg(n,e){return n.replace(dg,(t,r)=>{const s=e[r];return s!=null?String(s):`<${r}?>`})}const dg=/\{\$([^}]+)}/g;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ts(n){return JSON.parse(n)}function be(n){return JSON.stringify(n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fd=function(n){let e={},t={},r={},s="";try{const i=n.split(".");e=ts(pi(i[0])||""),t=ts(pi(i[1])||""),s=i[2],r=t.d||{},delete t.d}catch{}return{header:e,claims:t,data:r,signature:s}},fg=function(n){const e=Fd(n),t=e.claims;return!!t&&typeof t=="object"&&t.hasOwnProperty("iat")},pg=function(n){const e=Fd(n).claims;return typeof e=="object"&&e.admin===!0};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function At(n,e){return Object.prototype.hasOwnProperty.call(n,e)}function Hn(n,e){if(Object.prototype.hasOwnProperty.call(n,e))return n[e]}function ma(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}function _i(n,e,t){const r={};for(const s in n)Object.prototype.hasOwnProperty.call(n,s)&&(r[s]=e.call(t,n[s],s,n));return r}function ns(n,e){if(n===e)return!0;const t=Object.keys(n),r=Object.keys(e);for(const s of t){if(!r.includes(s))return!1;const i=n[s],a=e[s];if(bu(i)&&bu(a)){if(!ns(i,a))return!1}else if(i!==a)return!1}for(const s of r)if(!t.includes(s))return!1;return!0}function bu(n){return n!==null&&typeof n=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ac(n){const e=[];for(const[t,r]of Object.entries(n))Array.isArray(r)?r.forEach(s=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(s))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(r));return e.length?"&"+e.join("&"):""}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _g{constructor(){this.chain_=[],this.buf_=[],this.W_=[],this.pad_=[],this.inbuf_=0,this.total_=0,this.blockSize=512/8,this.pad_[0]=128;for(let e=1;e<this.blockSize;++e)this.pad_[e]=0;this.reset()}reset(){this.chain_[0]=1732584193,this.chain_[1]=4023233417,this.chain_[2]=2562383102,this.chain_[3]=271733878,this.chain_[4]=3285377520,this.inbuf_=0,this.total_=0}compress_(e,t){t||(t=0);const r=this.W_;if(typeof e=="string")for(let p=0;p<16;p++)r[p]=e.charCodeAt(t)<<24|e.charCodeAt(t+1)<<16|e.charCodeAt(t+2)<<8|e.charCodeAt(t+3),t+=4;else for(let p=0;p<16;p++)r[p]=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3],t+=4;for(let p=16;p<80;p++){const m=r[p-3]^r[p-8]^r[p-14]^r[p-16];r[p]=(m<<1|m>>>31)&4294967295}let s=this.chain_[0],i=this.chain_[1],a=this.chain_[2],c=this.chain_[3],l=this.chain_[4],h,f;for(let p=0;p<80;p++){p<40?p<20?(h=c^i&(a^c),f=1518500249):(h=i^a^c,f=1859775393):p<60?(h=i&a|c&(i|a),f=2400959708):(h=i^a^c,f=3395469782);const m=(s<<5|s>>>27)+h+l+f+r[p]&4294967295;l=c,c=a,a=(i<<30|i>>>2)&4294967295,i=s,s=m}this.chain_[0]=this.chain_[0]+s&4294967295,this.chain_[1]=this.chain_[1]+i&4294967295,this.chain_[2]=this.chain_[2]+a&4294967295,this.chain_[3]=this.chain_[3]+c&4294967295,this.chain_[4]=this.chain_[4]+l&4294967295}update(e,t){if(e==null)return;t===void 0&&(t=e.length);const r=t-this.blockSize;let s=0;const i=this.buf_;let a=this.inbuf_;for(;s<t;){if(a===0)for(;s<=r;)this.compress_(e,s),s+=this.blockSize;if(typeof e=="string"){for(;s<t;)if(i[a]=e.charCodeAt(s),++a,++s,a===this.blockSize){this.compress_(i),a=0;break}}else for(;s<t;)if(i[a]=e[s],++a,++s,a===this.blockSize){this.compress_(i),a=0;break}}this.inbuf_=a,this.total_+=t}digest(){const e=[];let t=this.total_*8;this.inbuf_<56?this.update(this.pad_,56-this.inbuf_):this.update(this.pad_,this.blockSize-(this.inbuf_-56));for(let s=this.blockSize-1;s>=56;s--)this.buf_[s]=t&255,t/=256;this.compress_(this.buf_);let r=0;for(let s=0;s<5;s++)for(let i=24;i>=0;i-=8)e[r]=this.chain_[s]>>i&255,++r;return e}}function mg(n,e){const t=new gg(n,e);return t.subscribe.bind(t)}class gg{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(r=>{this.error(r)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,r){let s;if(e===void 0&&t===void 0&&r===void 0)throw new Error("Missing Observer.");yg(e,["next","error","complete"])?s=e:s={next:e,error:t,complete:r},s.next===void 0&&(s.next=Xo),s.error===void 0&&(s.error=Xo),s.complete===void 0&&(s.complete=Xo);const i=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?s.error(this.finalError):s.complete()}catch{}}),this.observers.push(s),i}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(r){typeof console<"u"&&console.error&&console.error(r)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function yg(n,e){if(typeof n!="object"||n===null)return!1;for(const t of e)if(t in n&&typeof n[t]=="function")return!0;return!1}function Xo(){}function Gn(n,e){return`${n} failed: ${e} argument `}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Eg=function(n){const e=[];let t=0;for(let r=0;r<n.length;r++){let s=n.charCodeAt(r);if(s>=55296&&s<=56319){const i=s-55296;r++,O(r<n.length,"Surrogate pair missing trail surrogate.");const a=n.charCodeAt(r)-56320;s=65536+(i<<10)+a}s<128?e[t++]=s:s<2048?(e[t++]=s>>6|192,e[t++]=s&63|128):s<65536?(e[t++]=s>>12|224,e[t++]=s>>6&63|128,e[t++]=s&63|128):(e[t++]=s>>18|240,e[t++]=s>>12&63|128,e[t++]=s>>6&63|128,e[t++]=s&63|128)}return e},Hi=function(n){let e=0;for(let t=0;t<n.length;t++){const r=n.charCodeAt(t);r<128?e++:r<2048?e+=2:r>=55296&&r<=56319?(e+=4,t++):e+=3}return e};/**
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
 */function te(n){return n&&n._delegate?n._delegate:n}class vt{constructor(e,t,r){this.name=e,this.instanceFactory=t,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
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
 */class Tg{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const r=new Pt;if(this.instancesDeferred.set(t,r),this.isInitialized(t)||this.shouldAutoInitialize())try{const s=this.getOrInitializeService({instanceIdentifier:t});s&&r.resolve(s)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),r=(e==null?void 0:e.optional)??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(s){if(r)return null;throw s}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(Ig(e))try{this.getOrInitializeService({instanceIdentifier:dn})}catch{}for(const[t,r]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(t);try{const i=this.getOrInitializeService({instanceIdentifier:s});r.resolve(i)}catch{}}}}clearInstance(e=dn){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=dn){return this.instances.has(e)}getOptions(e=dn){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,r=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:r,options:t});for(const[i,a]of this.instancesDeferred.entries()){const c=this.normalizeInstanceIdentifier(i);r===c&&a.resolve(s)}return s}onInit(e,t){const r=this.normalizeInstanceIdentifier(t),s=this.onInitCallbacks.get(r)??new Set;s.add(e),this.onInitCallbacks.set(r,s);const i=this.instances.get(r);return i&&e(i,r),()=>{s.delete(e)}}invokeOnInitCallbacks(e,t){const r=this.onInitCallbacks.get(t);if(r)for(const s of r)try{s(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let r=this.instances.get(e);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:vg(e),options:t}),this.instances.set(e,r),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(r,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,r)}catch{}return r||null}normalizeInstanceIdentifier(e=dn){return this.component?this.component.multipleInstances?e:dn:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function vg(n){return n===dn?void 0:n}function Ig(n){return n.instantiationMode==="EAGER"}/**
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
 */class wg{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new Tg(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var W;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(W||(W={}));const Ag={debug:W.DEBUG,verbose:W.VERBOSE,info:W.INFO,warn:W.WARN,error:W.ERROR,silent:W.SILENT},Cg=W.INFO,Rg={[W.DEBUG]:"log",[W.VERBOSE]:"log",[W.INFO]:"info",[W.WARN]:"warn",[W.ERROR]:"error"},Sg=(n,e,...t)=>{if(e<n.logLevel)return;const r=new Date().toISOString(),s=Rg[e];if(s)console[s](`[${r}]  ${n.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class Gi{constructor(e){this.name=e,this._logLevel=Cg,this._logHandler=Sg,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in W))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?Ag[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,W.DEBUG,...e),this._logHandler(this,W.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,W.VERBOSE,...e),this._logHandler(this,W.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,W.INFO,...e),this._logHandler(this,W.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,W.WARN,...e),this._logHandler(this,W.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,W.ERROR,...e),this._logHandler(this,W.ERROR,...e)}}/**
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
 */class bg{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(Pg(t)){const r=t.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(t=>t).join(" ")}}function Pg(n){const e=n.getComponent();return(e==null?void 0:e.type)==="VERSION"}const ga="@firebase/app",Pu="0.14.2";/**
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
 */const Dt=new Gi("@firebase/app"),Ng="@firebase/app-compat",kg="@firebase/analytics-compat",Dg="@firebase/analytics",Og="@firebase/app-check-compat",Vg="@firebase/app-check",Mg="@firebase/auth",Lg="@firebase/auth-compat",xg="@firebase/database",Fg="@firebase/data-connect",Ug="@firebase/database-compat",Bg="@firebase/functions",qg="@firebase/functions-compat",$g="@firebase/installations",jg="@firebase/installations-compat",Wg="@firebase/messaging",zg="@firebase/messaging-compat",Hg="@firebase/performance",Gg="@firebase/performance-compat",Kg="@firebase/remote-config",Qg="@firebase/remote-config-compat",Yg="@firebase/storage",Xg="@firebase/storage-compat",Jg="@firebase/firestore",Zg="@firebase/ai",ey="@firebase/firestore-compat",ty="firebase",ny="12.2.0";/**
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
 */const ya="[DEFAULT]",ry={[ga]:"fire-core",[Ng]:"fire-core-compat",[Dg]:"fire-analytics",[kg]:"fire-analytics-compat",[Vg]:"fire-app-check",[Og]:"fire-app-check-compat",[Mg]:"fire-auth",[Lg]:"fire-auth-compat",[xg]:"fire-rtdb",[Fg]:"fire-data-connect",[Ug]:"fire-rtdb-compat",[Bg]:"fire-fn",[qg]:"fire-fn-compat",[$g]:"fire-iid",[jg]:"fire-iid-compat",[Wg]:"fire-fcm",[zg]:"fire-fcm-compat",[Hg]:"fire-perf",[Gg]:"fire-perf-compat",[Kg]:"fire-rc",[Qg]:"fire-rc-compat",[Yg]:"fire-gcs",[Xg]:"fire-gcs-compat",[Jg]:"fire-fst",[ey]:"fire-fst-compat",[Zg]:"fire-vertex","fire-js":"fire-js",[ty]:"fire-js-all"};/**
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
 */const mi=new Map,sy=new Map,Ea=new Map;function Nu(n,e){try{n.container.addComponent(e)}catch(t){Dt.debug(`Component ${e.name} failed to register with FirebaseApp ${n.name}`,t)}}function Ot(n){const e=n.name;if(Ea.has(e))return Dt.debug(`There were multiple attempts to register component ${e}.`),!1;Ea.set(e,n);for(const t of mi.values())Nu(t,n);for(const t of sy.values())Nu(t,n);return!0}function Ki(n,e){const t=n.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),n.container.getProvider(e)}function dt(n){return n==null?!1:n.settings!==void 0}/**
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
 */const iy={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},Gt=new _s("app","Firebase",iy);/**
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
 */class oy{constructor(e,t,r){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new vt("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw Gt.create("app-deleted",{appName:this._name})}}/**
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
 */const ir=ny;function Ud(n,e={}){let t=n;typeof e!="object"&&(e={name:e});const r={name:ya,automaticDataCollectionEnabled:!0,...e},s=r.name;if(typeof s!="string"||!s)throw Gt.create("bad-app-name",{appName:String(s)});if(t||(t=Ld()),!t)throw Gt.create("no-options");const i=mi.get(s);if(i){if(ns(t,i.options)&&ns(r,i.config))return i;throw Gt.create("duplicate-app",{appName:s})}const a=new wg(s);for(const l of Ea.values())a.addComponent(l);const c=new oy(t,r,a);return mi.set(s,c),c}function Qi(n=ya){const e=mi.get(n);if(!e&&n===ya&&Ld())return Ud();if(!e)throw Gt.create("no-app",{appName:n});return e}function Qe(n,e,t){let r=ry[n]??n;t&&(r+=`-${t}`);const s=r.match(/\s|\//),i=e.match(/\s|\//);if(s||i){const a=[`Unable to register library "${r}" with version "${e}":`];s&&a.push(`library name "${r}" contains illegal characters (whitespace or "/")`),s&&i&&a.push("and"),i&&a.push(`version name "${e}" contains illegal characters (whitespace or "/")`),Dt.warn(a.join(" "));return}Ot(new vt(`${r}-version`,()=>({library:r,version:e}),"VERSION"))}/**
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
 */const ay="firebase-heartbeat-database",cy=1,rs="firebase-heartbeat-store";let Jo=null;function Bd(){return Jo||(Jo=jm(ay,cy,{upgrade:(n,e)=>{switch(e){case 0:try{n.createObjectStore(rs)}catch(t){console.warn(t)}}}}).catch(n=>{throw Gt.create("idb-open",{originalErrorMessage:n.message})})),Jo}async function ly(n){try{const t=(await Bd()).transaction(rs),r=await t.objectStore(rs).get(qd(n));return await t.done,r}catch(e){if(e instanceof wt)Dt.warn(e.message);else{const t=Gt.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});Dt.warn(t.message)}}}async function ku(n,e){try{const r=(await Bd()).transaction(rs,"readwrite");await r.objectStore(rs).put(e,qd(n)),await r.done}catch(t){if(t instanceof wt)Dt.warn(t.message);else{const r=Gt.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});Dt.warn(r.message)}}}function qd(n){return`${n.name}!${n.options.appId}`}/**
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
 */const uy=1024,hy=30;class dy{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new py(t),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var e,t;try{const s=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),i=Du();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===i||this._heartbeatsCache.heartbeats.some(a=>a.date===i))return;if(this._heartbeatsCache.heartbeats.push({date:i,agent:s}),this._heartbeatsCache.heartbeats.length>hy){const a=_y(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(a,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){Dt.warn(r)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=Du(),{heartbeatsToSend:r,unsentEntries:s}=fy(this._heartbeatsCache.heartbeats),i=fi(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=t,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),i}catch(t){return Dt.warn(t),""}}}function Du(){return new Date().toISOString().substring(0,10)}function fy(n,e=uy){const t=[];let r=n.slice();for(const s of n){const i=t.find(a=>a.agent===s.agent);if(i){if(i.dates.push(s.date),Ou(t)>e){i.dates.pop();break}}else if(t.push({agent:s.agent,dates:[s.date]}),Ou(t)>e){t.pop();break}r=r.slice(1)}return{heartbeatsToSend:t,unsentEntries:r}}class py{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return cg()?lg().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await ly(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return ku(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return ku(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...e.heartbeats]})}else return}}function Ou(n){return fi(JSON.stringify({version:2,heartbeats:n})).length}function _y(n){if(n.length===0)return-1;let e=0,t=n[0].date;for(let r=1;r<n.length;r++)n[r].date<t&&(t=n[r].date,e=r);return e}/**
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
 */function my(n){Ot(new vt("platform-logger",e=>new bg(e),"PRIVATE")),Ot(new vt("heartbeat",e=>new dy(e),"PRIVATE")),Qe(ga,Pu,n),Qe(ga,Pu,"esm2020"),Qe("fire-js","")}my("");var gy="firebase",yy="12.2.1";/**
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
 */Qe(gy,yy,"app");var Vu=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Kt,$d;(function(){var n;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(w,g){function E(){}E.prototype=g.prototype,w.D=g.prototype,w.prototype=new E,w.prototype.constructor=w,w.C=function(T,I,C){for(var y=Array(arguments.length-2),Ct=2;Ct<arguments.length;Ct++)y[Ct-2]=arguments[Ct];return g.prototype[I].apply(T,y)}}function t(){this.blockSize=-1}function r(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.B=Array(this.blockSize),this.o=this.h=0,this.s()}e(r,t),r.prototype.s=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function s(w,g,E){E||(E=0);var T=Array(16);if(typeof g=="string")for(var I=0;16>I;++I)T[I]=g.charCodeAt(E++)|g.charCodeAt(E++)<<8|g.charCodeAt(E++)<<16|g.charCodeAt(E++)<<24;else for(I=0;16>I;++I)T[I]=g[E++]|g[E++]<<8|g[E++]<<16|g[E++]<<24;g=w.g[0],E=w.g[1],I=w.g[2];var C=w.g[3],y=g+(C^E&(I^C))+T[0]+3614090360&4294967295;g=E+(y<<7&4294967295|y>>>25),y=C+(I^g&(E^I))+T[1]+3905402710&4294967295,C=g+(y<<12&4294967295|y>>>20),y=I+(E^C&(g^E))+T[2]+606105819&4294967295,I=C+(y<<17&4294967295|y>>>15),y=E+(g^I&(C^g))+T[3]+3250441966&4294967295,E=I+(y<<22&4294967295|y>>>10),y=g+(C^E&(I^C))+T[4]+4118548399&4294967295,g=E+(y<<7&4294967295|y>>>25),y=C+(I^g&(E^I))+T[5]+1200080426&4294967295,C=g+(y<<12&4294967295|y>>>20),y=I+(E^C&(g^E))+T[6]+2821735955&4294967295,I=C+(y<<17&4294967295|y>>>15),y=E+(g^I&(C^g))+T[7]+4249261313&4294967295,E=I+(y<<22&4294967295|y>>>10),y=g+(C^E&(I^C))+T[8]+1770035416&4294967295,g=E+(y<<7&4294967295|y>>>25),y=C+(I^g&(E^I))+T[9]+2336552879&4294967295,C=g+(y<<12&4294967295|y>>>20),y=I+(E^C&(g^E))+T[10]+4294925233&4294967295,I=C+(y<<17&4294967295|y>>>15),y=E+(g^I&(C^g))+T[11]+2304563134&4294967295,E=I+(y<<22&4294967295|y>>>10),y=g+(C^E&(I^C))+T[12]+1804603682&4294967295,g=E+(y<<7&4294967295|y>>>25),y=C+(I^g&(E^I))+T[13]+4254626195&4294967295,C=g+(y<<12&4294967295|y>>>20),y=I+(E^C&(g^E))+T[14]+2792965006&4294967295,I=C+(y<<17&4294967295|y>>>15),y=E+(g^I&(C^g))+T[15]+1236535329&4294967295,E=I+(y<<22&4294967295|y>>>10),y=g+(I^C&(E^I))+T[1]+4129170786&4294967295,g=E+(y<<5&4294967295|y>>>27),y=C+(E^I&(g^E))+T[6]+3225465664&4294967295,C=g+(y<<9&4294967295|y>>>23),y=I+(g^E&(C^g))+T[11]+643717713&4294967295,I=C+(y<<14&4294967295|y>>>18),y=E+(C^g&(I^C))+T[0]+3921069994&4294967295,E=I+(y<<20&4294967295|y>>>12),y=g+(I^C&(E^I))+T[5]+3593408605&4294967295,g=E+(y<<5&4294967295|y>>>27),y=C+(E^I&(g^E))+T[10]+38016083&4294967295,C=g+(y<<9&4294967295|y>>>23),y=I+(g^E&(C^g))+T[15]+3634488961&4294967295,I=C+(y<<14&4294967295|y>>>18),y=E+(C^g&(I^C))+T[4]+3889429448&4294967295,E=I+(y<<20&4294967295|y>>>12),y=g+(I^C&(E^I))+T[9]+568446438&4294967295,g=E+(y<<5&4294967295|y>>>27),y=C+(E^I&(g^E))+T[14]+3275163606&4294967295,C=g+(y<<9&4294967295|y>>>23),y=I+(g^E&(C^g))+T[3]+4107603335&4294967295,I=C+(y<<14&4294967295|y>>>18),y=E+(C^g&(I^C))+T[8]+1163531501&4294967295,E=I+(y<<20&4294967295|y>>>12),y=g+(I^C&(E^I))+T[13]+2850285829&4294967295,g=E+(y<<5&4294967295|y>>>27),y=C+(E^I&(g^E))+T[2]+4243563512&4294967295,C=g+(y<<9&4294967295|y>>>23),y=I+(g^E&(C^g))+T[7]+1735328473&4294967295,I=C+(y<<14&4294967295|y>>>18),y=E+(C^g&(I^C))+T[12]+2368359562&4294967295,E=I+(y<<20&4294967295|y>>>12),y=g+(E^I^C)+T[5]+4294588738&4294967295,g=E+(y<<4&4294967295|y>>>28),y=C+(g^E^I)+T[8]+2272392833&4294967295,C=g+(y<<11&4294967295|y>>>21),y=I+(C^g^E)+T[11]+1839030562&4294967295,I=C+(y<<16&4294967295|y>>>16),y=E+(I^C^g)+T[14]+4259657740&4294967295,E=I+(y<<23&4294967295|y>>>9),y=g+(E^I^C)+T[1]+2763975236&4294967295,g=E+(y<<4&4294967295|y>>>28),y=C+(g^E^I)+T[4]+1272893353&4294967295,C=g+(y<<11&4294967295|y>>>21),y=I+(C^g^E)+T[7]+4139469664&4294967295,I=C+(y<<16&4294967295|y>>>16),y=E+(I^C^g)+T[10]+3200236656&4294967295,E=I+(y<<23&4294967295|y>>>9),y=g+(E^I^C)+T[13]+681279174&4294967295,g=E+(y<<4&4294967295|y>>>28),y=C+(g^E^I)+T[0]+3936430074&4294967295,C=g+(y<<11&4294967295|y>>>21),y=I+(C^g^E)+T[3]+3572445317&4294967295,I=C+(y<<16&4294967295|y>>>16),y=E+(I^C^g)+T[6]+76029189&4294967295,E=I+(y<<23&4294967295|y>>>9),y=g+(E^I^C)+T[9]+3654602809&4294967295,g=E+(y<<4&4294967295|y>>>28),y=C+(g^E^I)+T[12]+3873151461&4294967295,C=g+(y<<11&4294967295|y>>>21),y=I+(C^g^E)+T[15]+530742520&4294967295,I=C+(y<<16&4294967295|y>>>16),y=E+(I^C^g)+T[2]+3299628645&4294967295,E=I+(y<<23&4294967295|y>>>9),y=g+(I^(E|~C))+T[0]+4096336452&4294967295,g=E+(y<<6&4294967295|y>>>26),y=C+(E^(g|~I))+T[7]+1126891415&4294967295,C=g+(y<<10&4294967295|y>>>22),y=I+(g^(C|~E))+T[14]+2878612391&4294967295,I=C+(y<<15&4294967295|y>>>17),y=E+(C^(I|~g))+T[5]+4237533241&4294967295,E=I+(y<<21&4294967295|y>>>11),y=g+(I^(E|~C))+T[12]+1700485571&4294967295,g=E+(y<<6&4294967295|y>>>26),y=C+(E^(g|~I))+T[3]+2399980690&4294967295,C=g+(y<<10&4294967295|y>>>22),y=I+(g^(C|~E))+T[10]+4293915773&4294967295,I=C+(y<<15&4294967295|y>>>17),y=E+(C^(I|~g))+T[1]+2240044497&4294967295,E=I+(y<<21&4294967295|y>>>11),y=g+(I^(E|~C))+T[8]+1873313359&4294967295,g=E+(y<<6&4294967295|y>>>26),y=C+(E^(g|~I))+T[15]+4264355552&4294967295,C=g+(y<<10&4294967295|y>>>22),y=I+(g^(C|~E))+T[6]+2734768916&4294967295,I=C+(y<<15&4294967295|y>>>17),y=E+(C^(I|~g))+T[13]+1309151649&4294967295,E=I+(y<<21&4294967295|y>>>11),y=g+(I^(E|~C))+T[4]+4149444226&4294967295,g=E+(y<<6&4294967295|y>>>26),y=C+(E^(g|~I))+T[11]+3174756917&4294967295,C=g+(y<<10&4294967295|y>>>22),y=I+(g^(C|~E))+T[2]+718787259&4294967295,I=C+(y<<15&4294967295|y>>>17),y=E+(C^(I|~g))+T[9]+3951481745&4294967295,w.g[0]=w.g[0]+g&4294967295,w.g[1]=w.g[1]+(I+(y<<21&4294967295|y>>>11))&4294967295,w.g[2]=w.g[2]+I&4294967295,w.g[3]=w.g[3]+C&4294967295}r.prototype.u=function(w,g){g===void 0&&(g=w.length);for(var E=g-this.blockSize,T=this.B,I=this.h,C=0;C<g;){if(I==0)for(;C<=E;)s(this,w,C),C+=this.blockSize;if(typeof w=="string"){for(;C<g;)if(T[I++]=w.charCodeAt(C++),I==this.blockSize){s(this,T),I=0;break}}else for(;C<g;)if(T[I++]=w[C++],I==this.blockSize){s(this,T),I=0;break}}this.h=I,this.o+=g},r.prototype.v=function(){var w=Array((56>this.h?this.blockSize:2*this.blockSize)-this.h);w[0]=128;for(var g=1;g<w.length-8;++g)w[g]=0;var E=8*this.o;for(g=w.length-8;g<w.length;++g)w[g]=E&255,E/=256;for(this.u(w),w=Array(16),g=E=0;4>g;++g)for(var T=0;32>T;T+=8)w[E++]=this.g[g]>>>T&255;return w};function i(w,g){var E=c;return Object.prototype.hasOwnProperty.call(E,w)?E[w]:E[w]=g(w)}function a(w,g){this.h=g;for(var E=[],T=!0,I=w.length-1;0<=I;I--){var C=w[I]|0;T&&C==g||(E[I]=C,T=!1)}this.g=E}var c={};function l(w){return-128<=w&&128>w?i(w,function(g){return new a([g|0],0>g?-1:0)}):new a([w|0],0>w?-1:0)}function h(w){if(isNaN(w)||!isFinite(w))return p;if(0>w)return P(h(-w));for(var g=[],E=1,T=0;w>=E;T++)g[T]=w/E|0,E*=4294967296;return new a(g,0)}function f(w,g){if(w.length==0)throw Error("number format error: empty string");if(g=g||10,2>g||36<g)throw Error("radix out of range: "+g);if(w.charAt(0)=="-")return P(f(w.substring(1),g));if(0<=w.indexOf("-"))throw Error('number format error: interior "-" character');for(var E=h(Math.pow(g,8)),T=p,I=0;I<w.length;I+=8){var C=Math.min(8,w.length-I),y=parseInt(w.substring(I,I+C),g);8>C?(C=h(Math.pow(g,C)),T=T.j(C).add(h(y))):(T=T.j(E),T=T.add(h(y)))}return T}var p=l(0),m=l(1),v=l(16777216);n=a.prototype,n.m=function(){if(k(this))return-P(this).m();for(var w=0,g=1,E=0;E<this.g.length;E++){var T=this.i(E);w+=(0<=T?T:4294967296+T)*g,g*=4294967296}return w},n.toString=function(w){if(w=w||10,2>w||36<w)throw Error("radix out of range: "+w);if(R(this))return"0";if(k(this))return"-"+P(this).toString(w);for(var g=h(Math.pow(w,6)),E=this,T="";;){var I=j(E,g).g;E=F(E,I.j(g));var C=((0<E.g.length?E.g[0]:E.h)>>>0).toString(w);if(E=I,R(E))return C+T;for(;6>C.length;)C="0"+C;T=C+T}},n.i=function(w){return 0>w?0:w<this.g.length?this.g[w]:this.h};function R(w){if(w.h!=0)return!1;for(var g=0;g<w.g.length;g++)if(w.g[g]!=0)return!1;return!0}function k(w){return w.h==-1}n.l=function(w){return w=F(this,w),k(w)?-1:R(w)?0:1};function P(w){for(var g=w.g.length,E=[],T=0;T<g;T++)E[T]=~w.g[T];return new a(E,~w.h).add(m)}n.abs=function(){return k(this)?P(this):this},n.add=function(w){for(var g=Math.max(this.g.length,w.g.length),E=[],T=0,I=0;I<=g;I++){var C=T+(this.i(I)&65535)+(w.i(I)&65535),y=(C>>>16)+(this.i(I)>>>16)+(w.i(I)>>>16);T=y>>>16,C&=65535,y&=65535,E[I]=y<<16|C}return new a(E,E[E.length-1]&-2147483648?-1:0)};function F(w,g){return w.add(P(g))}n.j=function(w){if(R(this)||R(w))return p;if(k(this))return k(w)?P(this).j(P(w)):P(P(this).j(w));if(k(w))return P(this.j(P(w)));if(0>this.l(v)&&0>w.l(v))return h(this.m()*w.m());for(var g=this.g.length+w.g.length,E=[],T=0;T<2*g;T++)E[T]=0;for(T=0;T<this.g.length;T++)for(var I=0;I<w.g.length;I++){var C=this.i(T)>>>16,y=this.i(T)&65535,Ct=w.i(I)>>>16,mr=w.i(I)&65535;E[2*T+2*I]+=y*mr,x(E,2*T+2*I),E[2*T+2*I+1]+=C*mr,x(E,2*T+2*I+1),E[2*T+2*I+1]+=y*Ct,x(E,2*T+2*I+1),E[2*T+2*I+2]+=C*Ct,x(E,2*T+2*I+2)}for(T=0;T<g;T++)E[T]=E[2*T+1]<<16|E[2*T];for(T=g;T<2*g;T++)E[T]=0;return new a(E,0)};function x(w,g){for(;(w[g]&65535)!=w[g];)w[g+1]+=w[g]>>>16,w[g]&=65535,g++}function B(w,g){this.g=w,this.h=g}function j(w,g){if(R(g))throw Error("division by zero");if(R(w))return new B(p,p);if(k(w))return g=j(P(w),g),new B(P(g.g),P(g.h));if(k(g))return g=j(w,P(g)),new B(P(g.g),g.h);if(30<w.g.length){if(k(w)||k(g))throw Error("slowDivide_ only works with positive integers.");for(var E=m,T=g;0>=T.l(w);)E=We(E),T=We(T);var I=pe(E,1),C=pe(T,1);for(T=pe(T,2),E=pe(E,2);!R(T);){var y=C.add(T);0>=y.l(w)&&(I=I.add(E),C=y),T=pe(T,1),E=pe(E,1)}return g=F(w,I.j(g)),new B(I,g)}for(I=p;0<=w.l(g);){for(E=Math.max(1,Math.floor(w.m()/g.m())),T=Math.ceil(Math.log(E)/Math.LN2),T=48>=T?1:Math.pow(2,T-48),C=h(E),y=C.j(g);k(y)||0<y.l(w);)E-=T,C=h(E),y=C.j(g);R(C)&&(C=m),I=I.add(C),w=F(w,y)}return new B(I,w)}n.A=function(w){return j(this,w).h},n.and=function(w){for(var g=Math.max(this.g.length,w.g.length),E=[],T=0;T<g;T++)E[T]=this.i(T)&w.i(T);return new a(E,this.h&w.h)},n.or=function(w){for(var g=Math.max(this.g.length,w.g.length),E=[],T=0;T<g;T++)E[T]=this.i(T)|w.i(T);return new a(E,this.h|w.h)},n.xor=function(w){for(var g=Math.max(this.g.length,w.g.length),E=[],T=0;T<g;T++)E[T]=this.i(T)^w.i(T);return new a(E,this.h^w.h)};function We(w){for(var g=w.g.length+1,E=[],T=0;T<g;T++)E[T]=w.i(T)<<1|w.i(T-1)>>>31;return new a(E,w.h)}function pe(w,g){var E=g>>5;g%=32;for(var T=w.g.length-E,I=[],C=0;C<T;C++)I[C]=0<g?w.i(C+E)>>>g|w.i(C+E+1)<<32-g:w.i(C+E);return new a(I,w.h)}r.prototype.digest=r.prototype.v,r.prototype.reset=r.prototype.s,r.prototype.update=r.prototype.u,$d=r,a.prototype.add=a.prototype.add,a.prototype.multiply=a.prototype.j,a.prototype.modulo=a.prototype.A,a.prototype.compare=a.prototype.l,a.prototype.toNumber=a.prototype.m,a.prototype.toString=a.prototype.toString,a.prototype.getBits=a.prototype.i,a.fromNumber=h,a.fromString=f,Kt=a}).apply(typeof Vu<"u"?Vu:typeof self<"u"?self:typeof window<"u"?window:{});var Ks=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var jd,Fr,Wd,si,Ta,zd,Hd,Gd;(function(){var n,e=typeof Object.defineProperties=="function"?Object.defineProperty:function(o,u,d){return o==Array.prototype||o==Object.prototype||(o[u]=d.value),o};function t(o){o=[typeof globalThis=="object"&&globalThis,o,typeof window=="object"&&window,typeof self=="object"&&self,typeof Ks=="object"&&Ks];for(var u=0;u<o.length;++u){var d=o[u];if(d&&d.Math==Math)return d}throw Error("Cannot find global object")}var r=t(this);function s(o,u){if(u)e:{var d=r;o=o.split(".");for(var _=0;_<o.length-1;_++){var A=o[_];if(!(A in d))break e;d=d[A]}o=o[o.length-1],_=d[o],u=u(_),u!=_&&u!=null&&e(d,o,{configurable:!0,writable:!0,value:u})}}function i(o,u){o instanceof String&&(o+="");var d=0,_=!1,A={next:function(){if(!_&&d<o.length){var S=d++;return{value:u(S,o[S]),done:!1}}return _=!0,{done:!0,value:void 0}}};return A[Symbol.iterator]=function(){return A},A}s("Array.prototype.values",function(o){return o||function(){return i(this,function(u,d){return d})}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var a=a||{},c=this||self;function l(o){var u=typeof o;return u=u!="object"?u:o?Array.isArray(o)?"array":u:"null",u=="array"||u=="object"&&typeof o.length=="number"}function h(o){var u=typeof o;return u=="object"&&o!=null||u=="function"}function f(o,u,d){return o.call.apply(o.bind,arguments)}function p(o,u,d){if(!o)throw Error();if(2<arguments.length){var _=Array.prototype.slice.call(arguments,2);return function(){var A=Array.prototype.slice.call(arguments);return Array.prototype.unshift.apply(A,_),o.apply(u,A)}}return function(){return o.apply(u,arguments)}}function m(o,u,d){return m=Function.prototype.bind&&Function.prototype.bind.toString().indexOf("native code")!=-1?f:p,m.apply(null,arguments)}function v(o,u){var d=Array.prototype.slice.call(arguments,1);return function(){var _=d.slice();return _.push.apply(_,arguments),o.apply(this,_)}}function R(o,u){function d(){}d.prototype=u.prototype,o.aa=u.prototype,o.prototype=new d,o.prototype.constructor=o,o.Qb=function(_,A,S){for(var D=Array(arguments.length-2),re=2;re<arguments.length;re++)D[re-2]=arguments[re];return u.prototype[A].apply(_,D)}}function k(o){const u=o.length;if(0<u){const d=Array(u);for(let _=0;_<u;_++)d[_]=o[_];return d}return[]}function P(o,u){for(let d=1;d<arguments.length;d++){const _=arguments[d];if(l(_)){const A=o.length||0,S=_.length||0;o.length=A+S;for(let D=0;D<S;D++)o[A+D]=_[D]}else o.push(_)}}class F{constructor(u,d){this.i=u,this.j=d,this.h=0,this.g=null}get(){let u;return 0<this.h?(this.h--,u=this.g,this.g=u.next,u.next=null):u=this.i(),u}}function x(o){return/^[\s\xa0]*$/.test(o)}function B(){var o=c.navigator;return o&&(o=o.userAgent)?o:""}function j(o){return j[" "](o),o}j[" "]=function(){};var We=B().indexOf("Gecko")!=-1&&!(B().toLowerCase().indexOf("webkit")!=-1&&B().indexOf("Edge")==-1)&&!(B().indexOf("Trident")!=-1||B().indexOf("MSIE")!=-1)&&B().indexOf("Edge")==-1;function pe(o,u,d){for(const _ in o)u.call(d,o[_],_,o)}function w(o,u){for(const d in o)u.call(void 0,o[d],d,o)}function g(o){const u={};for(const d in o)u[d]=o[d];return u}const E="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function T(o,u){let d,_;for(let A=1;A<arguments.length;A++){_=arguments[A];for(d in _)o[d]=_[d];for(let S=0;S<E.length;S++)d=E[S],Object.prototype.hasOwnProperty.call(_,d)&&(o[d]=_[d])}}function I(o){var u=1;o=o.split(":");const d=[];for(;0<u&&o.length;)d.push(o.shift()),u--;return o.length&&d.push(o.join(":")),d}function C(o){c.setTimeout(()=>{throw o},0)}function y(){var o=So;let u=null;return o.g&&(u=o.g,o.g=o.g.next,o.g||(o.h=null),u.next=null),u}class Ct{constructor(){this.h=this.g=null}add(u,d){const _=mr.get();_.set(u,d),this.h?this.h.next=_:this.g=_,this.h=_}}var mr=new F(()=>new cm,o=>o.reset());class cm{constructor(){this.next=this.g=this.h=null}set(u,d){this.h=u,this.g=d,this.next=null}reset(){this.next=this.g=this.h=null}}let gr,yr=!1,So=new Ct,Rl=()=>{const o=c.Promise.resolve(void 0);gr=()=>{o.then(lm)}};var lm=()=>{for(var o;o=y();){try{o.h.call(o.g)}catch(d){C(d)}var u=mr;u.j(o),100>u.h&&(u.h++,o.next=u.g,u.g=o)}yr=!1};function Ut(){this.s=this.s,this.C=this.C}Ut.prototype.s=!1,Ut.prototype.ma=function(){this.s||(this.s=!0,this.N())},Ut.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function De(o,u){this.type=o,this.g=this.target=u,this.defaultPrevented=!1}De.prototype.h=function(){this.defaultPrevented=!0};var um=function(){if(!c.addEventListener||!Object.defineProperty)return!1;var o=!1,u=Object.defineProperty({},"passive",{get:function(){o=!0}});try{const d=()=>{};c.addEventListener("test",d,u),c.removeEventListener("test",d,u)}catch{}return o}();function Er(o,u){if(De.call(this,o?o.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,o){var d=this.type=o.type,_=o.changedTouches&&o.changedTouches.length?o.changedTouches[0]:null;if(this.target=o.target||o.srcElement,this.g=u,u=o.relatedTarget){if(We){e:{try{j(u.nodeName);var A=!0;break e}catch{}A=!1}A||(u=null)}}else d=="mouseover"?u=o.fromElement:d=="mouseout"&&(u=o.toElement);this.relatedTarget=u,_?(this.clientX=_.clientX!==void 0?_.clientX:_.pageX,this.clientY=_.clientY!==void 0?_.clientY:_.pageY,this.screenX=_.screenX||0,this.screenY=_.screenY||0):(this.clientX=o.clientX!==void 0?o.clientX:o.pageX,this.clientY=o.clientY!==void 0?o.clientY:o.pageY,this.screenX=o.screenX||0,this.screenY=o.screenY||0),this.button=o.button,this.key=o.key||"",this.ctrlKey=o.ctrlKey,this.altKey=o.altKey,this.shiftKey=o.shiftKey,this.metaKey=o.metaKey,this.pointerId=o.pointerId||0,this.pointerType=typeof o.pointerType=="string"?o.pointerType:hm[o.pointerType]||"",this.state=o.state,this.i=o,o.defaultPrevented&&Er.aa.h.call(this)}}R(Er,De);var hm={2:"touch",3:"pen",4:"mouse"};Er.prototype.h=function(){Er.aa.h.call(this);var o=this.i;o.preventDefault?o.preventDefault():o.returnValue=!1};var Ps="closure_listenable_"+(1e6*Math.random()|0),dm=0;function fm(o,u,d,_,A){this.listener=o,this.proxy=null,this.src=u,this.type=d,this.capture=!!_,this.ha=A,this.key=++dm,this.da=this.fa=!1}function Ns(o){o.da=!0,o.listener=null,o.proxy=null,o.src=null,o.ha=null}function ks(o){this.src=o,this.g={},this.h=0}ks.prototype.add=function(o,u,d,_,A){var S=o.toString();o=this.g[S],o||(o=this.g[S]=[],this.h++);var D=Po(o,u,_,A);return-1<D?(u=o[D],d||(u.fa=!1)):(u=new fm(u,this.src,S,!!_,A),u.fa=d,o.push(u)),u};function bo(o,u){var d=u.type;if(d in o.g){var _=o.g[d],A=Array.prototype.indexOf.call(_,u,void 0),S;(S=0<=A)&&Array.prototype.splice.call(_,A,1),S&&(Ns(u),o.g[d].length==0&&(delete o.g[d],o.h--))}}function Po(o,u,d,_){for(var A=0;A<o.length;++A){var S=o[A];if(!S.da&&S.listener==u&&S.capture==!!d&&S.ha==_)return A}return-1}var No="closure_lm_"+(1e6*Math.random()|0),ko={};function Sl(o,u,d,_,A){if(Array.isArray(u)){for(var S=0;S<u.length;S++)Sl(o,u[S],d,_,A);return null}return d=Nl(d),o&&o[Ps]?o.K(u,d,h(_)?!!_.capture:!1,A):pm(o,u,d,!1,_,A)}function pm(o,u,d,_,A,S){if(!u)throw Error("Invalid event type");var D=h(A)?!!A.capture:!!A,re=Oo(o);if(re||(o[No]=re=new ks(o)),d=re.add(u,d,_,D,S),d.proxy)return d;if(_=_m(),d.proxy=_,_.src=o,_.listener=d,o.addEventListener)um||(A=D),A===void 0&&(A=!1),o.addEventListener(u.toString(),_,A);else if(o.attachEvent)o.attachEvent(Pl(u.toString()),_);else if(o.addListener&&o.removeListener)o.addListener(_);else throw Error("addEventListener and attachEvent are unavailable.");return d}function _m(){function o(d){return u.call(o.src,o.listener,d)}const u=mm;return o}function bl(o,u,d,_,A){if(Array.isArray(u))for(var S=0;S<u.length;S++)bl(o,u[S],d,_,A);else _=h(_)?!!_.capture:!!_,d=Nl(d),o&&o[Ps]?(o=o.i,u=String(u).toString(),u in o.g&&(S=o.g[u],d=Po(S,d,_,A),-1<d&&(Ns(S[d]),Array.prototype.splice.call(S,d,1),S.length==0&&(delete o.g[u],o.h--)))):o&&(o=Oo(o))&&(u=o.g[u.toString()],o=-1,u&&(o=Po(u,d,_,A)),(d=-1<o?u[o]:null)&&Do(d))}function Do(o){if(typeof o!="number"&&o&&!o.da){var u=o.src;if(u&&u[Ps])bo(u.i,o);else{var d=o.type,_=o.proxy;u.removeEventListener?u.removeEventListener(d,_,o.capture):u.detachEvent?u.detachEvent(Pl(d),_):u.addListener&&u.removeListener&&u.removeListener(_),(d=Oo(u))?(bo(d,o),d.h==0&&(d.src=null,u[No]=null)):Ns(o)}}}function Pl(o){return o in ko?ko[o]:ko[o]="on"+o}function mm(o,u){if(o.da)o=!0;else{u=new Er(u,this);var d=o.listener,_=o.ha||o.src;o.fa&&Do(o),o=d.call(_,u)}return o}function Oo(o){return o=o[No],o instanceof ks?o:null}var Vo="__closure_events_fn_"+(1e9*Math.random()>>>0);function Nl(o){return typeof o=="function"?o:(o[Vo]||(o[Vo]=function(u){return o.handleEvent(u)}),o[Vo])}function Oe(){Ut.call(this),this.i=new ks(this),this.M=this,this.F=null}R(Oe,Ut),Oe.prototype[Ps]=!0,Oe.prototype.removeEventListener=function(o,u,d,_){bl(this,o,u,d,_)};function Be(o,u){var d,_=o.F;if(_)for(d=[];_;_=_.F)d.push(_);if(o=o.M,_=u.type||u,typeof u=="string")u=new De(u,o);else if(u instanceof De)u.target=u.target||o;else{var A=u;u=new De(_,o),T(u,A)}if(A=!0,d)for(var S=d.length-1;0<=S;S--){var D=u.g=d[S];A=Ds(D,_,!0,u)&&A}if(D=u.g=o,A=Ds(D,_,!0,u)&&A,A=Ds(D,_,!1,u)&&A,d)for(S=0;S<d.length;S++)D=u.g=d[S],A=Ds(D,_,!1,u)&&A}Oe.prototype.N=function(){if(Oe.aa.N.call(this),this.i){var o=this.i,u;for(u in o.g){for(var d=o.g[u],_=0;_<d.length;_++)Ns(d[_]);delete o.g[u],o.h--}}this.F=null},Oe.prototype.K=function(o,u,d,_){return this.i.add(String(o),u,!1,d,_)},Oe.prototype.L=function(o,u,d,_){return this.i.add(String(o),u,!0,d,_)};function Ds(o,u,d,_){if(u=o.i.g[String(u)],!u)return!0;u=u.concat();for(var A=!0,S=0;S<u.length;++S){var D=u[S];if(D&&!D.da&&D.capture==d){var re=D.listener,Re=D.ha||D.src;D.fa&&bo(o.i,D),A=re.call(Re,_)!==!1&&A}}return A&&!_.defaultPrevented}function kl(o,u,d){if(typeof o=="function")d&&(o=m(o,d));else if(o&&typeof o.handleEvent=="function")o=m(o.handleEvent,o);else throw Error("Invalid listener argument");return 2147483647<Number(u)?-1:c.setTimeout(o,u||0)}function Dl(o){o.g=kl(()=>{o.g=null,o.i&&(o.i=!1,Dl(o))},o.l);const u=o.h;o.h=null,o.m.apply(null,u)}class gm extends Ut{constructor(u,d){super(),this.m=u,this.l=d,this.h=null,this.i=!1,this.g=null}j(u){this.h=arguments,this.g?this.i=!0:Dl(this)}N(){super.N(),this.g&&(c.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function Tr(o){Ut.call(this),this.h=o,this.g={}}R(Tr,Ut);var Ol=[];function Vl(o){pe(o.g,function(u,d){this.g.hasOwnProperty(d)&&Do(u)},o),o.g={}}Tr.prototype.N=function(){Tr.aa.N.call(this),Vl(this)},Tr.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Mo=c.JSON.stringify,ym=c.JSON.parse,Em=class{stringify(o){return c.JSON.stringify(o,void 0)}parse(o){return c.JSON.parse(o,void 0)}};function Lo(){}Lo.prototype.h=null;function Ml(o){return o.h||(o.h=o.i())}function Ll(){}var vr={OPEN:"a",kb:"b",Ja:"c",wb:"d"};function xo(){De.call(this,"d")}R(xo,De);function Fo(){De.call(this,"c")}R(Fo,De);var cn={},xl=null;function Os(){return xl=xl||new Oe}cn.La="serverreachability";function Fl(o){De.call(this,cn.La,o)}R(Fl,De);function Ir(o){const u=Os();Be(u,new Fl(u))}cn.STAT_EVENT="statevent";function Ul(o,u){De.call(this,cn.STAT_EVENT,o),this.stat=u}R(Ul,De);function qe(o){const u=Os();Be(u,new Ul(u,o))}cn.Ma="timingevent";function Bl(o,u){De.call(this,cn.Ma,o),this.size=u}R(Bl,De);function wr(o,u){if(typeof o!="function")throw Error("Fn must not be null and must be a function");return c.setTimeout(function(){o()},u)}function Ar(){this.g=!0}Ar.prototype.xa=function(){this.g=!1};function Tm(o,u,d,_,A,S){o.info(function(){if(o.g)if(S)for(var D="",re=S.split("&"),Re=0;Re<re.length;Re++){var X=re[Re].split("=");if(1<X.length){var Ve=X[0];X=X[1];var Me=Ve.split("_");D=2<=Me.length&&Me[1]=="type"?D+(Ve+"="+X+"&"):D+(Ve+"=redacted&")}}else D=null;else D=S;return"XMLHTTP REQ ("+_+") [attempt "+A+"]: "+u+`
`+d+`
`+D})}function vm(o,u,d,_,A,S,D){o.info(function(){return"XMLHTTP RESP ("+_+") [ attempt "+A+"]: "+u+`
`+d+`
`+S+" "+D})}function Dn(o,u,d,_){o.info(function(){return"XMLHTTP TEXT ("+u+"): "+wm(o,d)+(_?" "+_:"")})}function Im(o,u){o.info(function(){return"TIMEOUT: "+u})}Ar.prototype.info=function(){};function wm(o,u){if(!o.g)return u;if(!u)return null;try{var d=JSON.parse(u);if(d){for(o=0;o<d.length;o++)if(Array.isArray(d[o])){var _=d[o];if(!(2>_.length)){var A=_[1];if(Array.isArray(A)&&!(1>A.length)){var S=A[0];if(S!="noop"&&S!="stop"&&S!="close")for(var D=1;D<A.length;D++)A[D]=""}}}}return Mo(d)}catch{return u}}var Vs={NO_ERROR:0,gb:1,tb:2,sb:3,nb:4,rb:5,ub:6,Ia:7,TIMEOUT:8,xb:9},ql={lb:"complete",Hb:"success",Ja:"error",Ia:"abort",zb:"ready",Ab:"readystatechange",TIMEOUT:"timeout",vb:"incrementaldata",yb:"progress",ob:"downloadprogress",Pb:"uploadprogress"},Uo;function Ms(){}R(Ms,Lo),Ms.prototype.g=function(){return new XMLHttpRequest},Ms.prototype.i=function(){return{}},Uo=new Ms;function Bt(o,u,d,_){this.j=o,this.i=u,this.l=d,this.R=_||1,this.U=new Tr(this),this.I=45e3,this.H=null,this.o=!1,this.m=this.A=this.v=this.L=this.F=this.S=this.B=null,this.D=[],this.g=null,this.C=0,this.s=this.u=null,this.X=-1,this.J=!1,this.O=0,this.M=null,this.W=this.K=this.T=this.P=!1,this.h=new $l}function $l(){this.i=null,this.g="",this.h=!1}var jl={},Bo={};function qo(o,u,d){o.L=1,o.v=Us(Rt(u)),o.m=d,o.P=!0,Wl(o,null)}function Wl(o,u){o.F=Date.now(),Ls(o),o.A=Rt(o.v);var d=o.A,_=o.R;Array.isArray(_)||(_=[String(_)]),su(d.i,"t",_),o.C=0,d=o.j.J,o.h=new $l,o.g=Iu(o.j,d?u:null,!o.m),0<o.O&&(o.M=new gm(m(o.Y,o,o.g),o.O)),u=o.U,d=o.g,_=o.ca;var A="readystatechange";Array.isArray(A)||(A&&(Ol[0]=A.toString()),A=Ol);for(var S=0;S<A.length;S++){var D=Sl(d,A[S],_||u.handleEvent,!1,u.h||u);if(!D)break;u.g[D.key]=D}u=o.H?g(o.H):{},o.m?(o.u||(o.u="POST"),u["Content-Type"]="application/x-www-form-urlencoded",o.g.ea(o.A,o.u,o.m,u)):(o.u="GET",o.g.ea(o.A,o.u,null,u)),Ir(),Tm(o.i,o.u,o.A,o.l,o.R,o.m)}Bt.prototype.ca=function(o){o=o.target;const u=this.M;u&&St(o)==3?u.j():this.Y(o)},Bt.prototype.Y=function(o){try{if(o==this.g)e:{const Me=St(this.g);var u=this.g.Ba();const Mn=this.g.Z();if(!(3>Me)&&(Me!=3||this.g&&(this.h.h||this.g.oa()||hu(this.g)))){this.J||Me!=4||u==7||(u==8||0>=Mn?Ir(3):Ir(2)),$o(this);var d=this.g.Z();this.X=d;t:if(zl(this)){var _=hu(this.g);o="";var A=_.length,S=St(this.g)==4;if(!this.h.i){if(typeof TextDecoder>"u"){ln(this),Cr(this);var D="";break t}this.h.i=new c.TextDecoder}for(u=0;u<A;u++)this.h.h=!0,o+=this.h.i.decode(_[u],{stream:!(S&&u==A-1)});_.length=0,this.h.g+=o,this.C=0,D=this.h.g}else D=this.g.oa();if(this.o=d==200,vm(this.i,this.u,this.A,this.l,this.R,Me,d),this.o){if(this.T&&!this.K){t:{if(this.g){var re,Re=this.g;if((re=Re.g?Re.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!x(re)){var X=re;break t}}X=null}if(d=X)Dn(this.i,this.l,d,"Initial handshake response via X-HTTP-Initial-Response"),this.K=!0,jo(this,d);else{this.o=!1,this.s=3,qe(12),ln(this),Cr(this);break e}}if(this.P){d=!0;let st;for(;!this.J&&this.C<D.length;)if(st=Am(this,D),st==Bo){Me==4&&(this.s=4,qe(14),d=!1),Dn(this.i,this.l,null,"[Incomplete Response]");break}else if(st==jl){this.s=4,qe(15),Dn(this.i,this.l,D,"[Invalid Chunk]"),d=!1;break}else Dn(this.i,this.l,st,null),jo(this,st);if(zl(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),Me!=4||D.length!=0||this.h.h||(this.s=1,qe(16),d=!1),this.o=this.o&&d,!d)Dn(this.i,this.l,D,"[Invalid Chunked Response]"),ln(this),Cr(this);else if(0<D.length&&!this.W){this.W=!0;var Ve=this.j;Ve.g==this&&Ve.ba&&!Ve.M&&(Ve.j.info("Great, no buffering proxy detected. Bytes received: "+D.length),Qo(Ve),Ve.M=!0,qe(11))}}else Dn(this.i,this.l,D,null),jo(this,D);Me==4&&ln(this),this.o&&!this.J&&(Me==4?yu(this.j,this):(this.o=!1,Ls(this)))}else qm(this.g),d==400&&0<D.indexOf("Unknown SID")?(this.s=3,qe(12)):(this.s=0,qe(13)),ln(this),Cr(this)}}}catch{}finally{}};function zl(o){return o.g?o.u=="GET"&&o.L!=2&&o.j.Ca:!1}function Am(o,u){var d=o.C,_=u.indexOf(`
`,d);return _==-1?Bo:(d=Number(u.substring(d,_)),isNaN(d)?jl:(_+=1,_+d>u.length?Bo:(u=u.slice(_,_+d),o.C=_+d,u)))}Bt.prototype.cancel=function(){this.J=!0,ln(this)};function Ls(o){o.S=Date.now()+o.I,Hl(o,o.I)}function Hl(o,u){if(o.B!=null)throw Error("WatchDog timer not null");o.B=wr(m(o.ba,o),u)}function $o(o){o.B&&(c.clearTimeout(o.B),o.B=null)}Bt.prototype.ba=function(){this.B=null;const o=Date.now();0<=o-this.S?(Im(this.i,this.A),this.L!=2&&(Ir(),qe(17)),ln(this),this.s=2,Cr(this)):Hl(this,this.S-o)};function Cr(o){o.j.G==0||o.J||yu(o.j,o)}function ln(o){$o(o);var u=o.M;u&&typeof u.ma=="function"&&u.ma(),o.M=null,Vl(o.U),o.g&&(u=o.g,o.g=null,u.abort(),u.ma())}function jo(o,u){try{var d=o.j;if(d.G!=0&&(d.g==o||Wo(d.h,o))){if(!o.K&&Wo(d.h,o)&&d.G==3){try{var _=d.Da.g.parse(u)}catch{_=null}if(Array.isArray(_)&&_.length==3){var A=_;if(A[0]==0){e:if(!d.u){if(d.g)if(d.g.F+3e3<o.F)zs(d),js(d);else break e;Ko(d),qe(18)}}else d.za=A[1],0<d.za-d.T&&37500>A[2]&&d.F&&d.v==0&&!d.C&&(d.C=wr(m(d.Za,d),6e3));if(1>=Ql(d.h)&&d.ca){try{d.ca()}catch{}d.ca=void 0}}else hn(d,11)}else if((o.K||d.g==o)&&zs(d),!x(u))for(A=d.Da.g.parse(u),u=0;u<A.length;u++){let X=A[u];if(d.T=X[0],X=X[1],d.G==2)if(X[0]=="c"){d.K=X[1],d.ia=X[2];const Ve=X[3];Ve!=null&&(d.la=Ve,d.j.info("VER="+d.la));const Me=X[4];Me!=null&&(d.Aa=Me,d.j.info("SVER="+d.Aa));const Mn=X[5];Mn!=null&&typeof Mn=="number"&&0<Mn&&(_=1.5*Mn,d.L=_,d.j.info("backChannelRequestTimeoutMs_="+_)),_=d;const st=o.g;if(st){const Gs=st.g?st.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(Gs){var S=_.h;S.g||Gs.indexOf("spdy")==-1&&Gs.indexOf("quic")==-1&&Gs.indexOf("h2")==-1||(S.j=S.l,S.g=new Set,S.h&&(zo(S,S.h),S.h=null))}if(_.D){const Yo=st.g?st.g.getResponseHeader("X-HTTP-Session-Id"):null;Yo&&(_.ya=Yo,ae(_.I,_.D,Yo))}}d.G=3,d.l&&d.l.ua(),d.ba&&(d.R=Date.now()-o.F,d.j.info("Handshake RTT: "+d.R+"ms")),_=d;var D=o;if(_.qa=vu(_,_.J?_.ia:null,_.W),D.K){Yl(_.h,D);var re=D,Re=_.L;Re&&(re.I=Re),re.B&&($o(re),Ls(re)),_.g=D}else mu(_);0<d.i.length&&Ws(d)}else X[0]!="stop"&&X[0]!="close"||hn(d,7);else d.G==3&&(X[0]=="stop"||X[0]=="close"?X[0]=="stop"?hn(d,7):Go(d):X[0]!="noop"&&d.l&&d.l.ta(X),d.v=0)}}Ir(4)}catch{}}var Cm=class{constructor(o,u){this.g=o,this.map=u}};function Gl(o){this.l=o||10,c.PerformanceNavigationTiming?(o=c.performance.getEntriesByType("navigation"),o=0<o.length&&(o[0].nextHopProtocol=="hq"||o[0].nextHopProtocol=="h2")):o=!!(c.chrome&&c.chrome.loadTimes&&c.chrome.loadTimes()&&c.chrome.loadTimes().wasFetchedViaSpdy),this.j=o?this.l:1,this.g=null,1<this.j&&(this.g=new Set),this.h=null,this.i=[]}function Kl(o){return o.h?!0:o.g?o.g.size>=o.j:!1}function Ql(o){return o.h?1:o.g?o.g.size:0}function Wo(o,u){return o.h?o.h==u:o.g?o.g.has(u):!1}function zo(o,u){o.g?o.g.add(u):o.h=u}function Yl(o,u){o.h&&o.h==u?o.h=null:o.g&&o.g.has(u)&&o.g.delete(u)}Gl.prototype.cancel=function(){if(this.i=Xl(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const o of this.g.values())o.cancel();this.g.clear()}};function Xl(o){if(o.h!=null)return o.i.concat(o.h.D);if(o.g!=null&&o.g.size!==0){let u=o.i;for(const d of o.g.values())u=u.concat(d.D);return u}return k(o.i)}function Rm(o){if(o.V&&typeof o.V=="function")return o.V();if(typeof Map<"u"&&o instanceof Map||typeof Set<"u"&&o instanceof Set)return Array.from(o.values());if(typeof o=="string")return o.split("");if(l(o)){for(var u=[],d=o.length,_=0;_<d;_++)u.push(o[_]);return u}u=[],d=0;for(_ in o)u[d++]=o[_];return u}function Sm(o){if(o.na&&typeof o.na=="function")return o.na();if(!o.V||typeof o.V!="function"){if(typeof Map<"u"&&o instanceof Map)return Array.from(o.keys());if(!(typeof Set<"u"&&o instanceof Set)){if(l(o)||typeof o=="string"){var u=[];o=o.length;for(var d=0;d<o;d++)u.push(d);return u}u=[],d=0;for(const _ in o)u[d++]=_;return u}}}function Jl(o,u){if(o.forEach&&typeof o.forEach=="function")o.forEach(u,void 0);else if(l(o)||typeof o=="string")Array.prototype.forEach.call(o,u,void 0);else for(var d=Sm(o),_=Rm(o),A=_.length,S=0;S<A;S++)u.call(void 0,_[S],d&&d[S],o)}var Zl=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function bm(o,u){if(o){o=o.split("&");for(var d=0;d<o.length;d++){var _=o[d].indexOf("="),A=null;if(0<=_){var S=o[d].substring(0,_);A=o[d].substring(_+1)}else S=o[d];u(S,A?decodeURIComponent(A.replace(/\+/g," ")):"")}}}function un(o){if(this.g=this.o=this.j="",this.s=null,this.m=this.l="",this.h=!1,o instanceof un){this.h=o.h,xs(this,o.j),this.o=o.o,this.g=o.g,Fs(this,o.s),this.l=o.l;var u=o.i,d=new br;d.i=u.i,u.g&&(d.g=new Map(u.g),d.h=u.h),eu(this,d),this.m=o.m}else o&&(u=String(o).match(Zl))?(this.h=!1,xs(this,u[1]||"",!0),this.o=Rr(u[2]||""),this.g=Rr(u[3]||"",!0),Fs(this,u[4]),this.l=Rr(u[5]||"",!0),eu(this,u[6]||"",!0),this.m=Rr(u[7]||"")):(this.h=!1,this.i=new br(null,this.h))}un.prototype.toString=function(){var o=[],u=this.j;u&&o.push(Sr(u,tu,!0),":");var d=this.g;return(d||u=="file")&&(o.push("//"),(u=this.o)&&o.push(Sr(u,tu,!0),"@"),o.push(encodeURIComponent(String(d)).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),d=this.s,d!=null&&o.push(":",String(d))),(d=this.l)&&(this.g&&d.charAt(0)!="/"&&o.push("/"),o.push(Sr(d,d.charAt(0)=="/"?km:Nm,!0))),(d=this.i.toString())&&o.push("?",d),(d=this.m)&&o.push("#",Sr(d,Om)),o.join("")};function Rt(o){return new un(o)}function xs(o,u,d){o.j=d?Rr(u,!0):u,o.j&&(o.j=o.j.replace(/:$/,""))}function Fs(o,u){if(u){if(u=Number(u),isNaN(u)||0>u)throw Error("Bad port number "+u);o.s=u}else o.s=null}function eu(o,u,d){u instanceof br?(o.i=u,Vm(o.i,o.h)):(d||(u=Sr(u,Dm)),o.i=new br(u,o.h))}function ae(o,u,d){o.i.set(u,d)}function Us(o){return ae(o,"zx",Math.floor(2147483648*Math.random()).toString(36)+Math.abs(Math.floor(2147483648*Math.random())^Date.now()).toString(36)),o}function Rr(o,u){return o?u?decodeURI(o.replace(/%25/g,"%2525")):decodeURIComponent(o):""}function Sr(o,u,d){return typeof o=="string"?(o=encodeURI(o).replace(u,Pm),d&&(o=o.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),o):null}function Pm(o){return o=o.charCodeAt(0),"%"+(o>>4&15).toString(16)+(o&15).toString(16)}var tu=/[#\/\?@]/g,Nm=/[#\?:]/g,km=/[#\?]/g,Dm=/[#\?@]/g,Om=/#/g;function br(o,u){this.h=this.g=null,this.i=o||null,this.j=!!u}function qt(o){o.g||(o.g=new Map,o.h=0,o.i&&bm(o.i,function(u,d){o.add(decodeURIComponent(u.replace(/\+/g," ")),d)}))}n=br.prototype,n.add=function(o,u){qt(this),this.i=null,o=On(this,o);var d=this.g.get(o);return d||this.g.set(o,d=[]),d.push(u),this.h+=1,this};function nu(o,u){qt(o),u=On(o,u),o.g.has(u)&&(o.i=null,o.h-=o.g.get(u).length,o.g.delete(u))}function ru(o,u){return qt(o),u=On(o,u),o.g.has(u)}n.forEach=function(o,u){qt(this),this.g.forEach(function(d,_){d.forEach(function(A){o.call(u,A,_,this)},this)},this)},n.na=function(){qt(this);const o=Array.from(this.g.values()),u=Array.from(this.g.keys()),d=[];for(let _=0;_<u.length;_++){const A=o[_];for(let S=0;S<A.length;S++)d.push(u[_])}return d},n.V=function(o){qt(this);let u=[];if(typeof o=="string")ru(this,o)&&(u=u.concat(this.g.get(On(this,o))));else{o=Array.from(this.g.values());for(let d=0;d<o.length;d++)u=u.concat(o[d])}return u},n.set=function(o,u){return qt(this),this.i=null,o=On(this,o),ru(this,o)&&(this.h-=this.g.get(o).length),this.g.set(o,[u]),this.h+=1,this},n.get=function(o,u){return o?(o=this.V(o),0<o.length?String(o[0]):u):u};function su(o,u,d){nu(o,u),0<d.length&&(o.i=null,o.g.set(On(o,u),k(d)),o.h+=d.length)}n.toString=function(){if(this.i)return this.i;if(!this.g)return"";const o=[],u=Array.from(this.g.keys());for(var d=0;d<u.length;d++){var _=u[d];const S=encodeURIComponent(String(_)),D=this.V(_);for(_=0;_<D.length;_++){var A=S;D[_]!==""&&(A+="="+encodeURIComponent(String(D[_]))),o.push(A)}}return this.i=o.join("&")};function On(o,u){return u=String(u),o.j&&(u=u.toLowerCase()),u}function Vm(o,u){u&&!o.j&&(qt(o),o.i=null,o.g.forEach(function(d,_){var A=_.toLowerCase();_!=A&&(nu(this,_),su(this,A,d))},o)),o.j=u}function Mm(o,u){const d=new Ar;if(c.Image){const _=new Image;_.onload=v($t,d,"TestLoadImage: loaded",!0,u,_),_.onerror=v($t,d,"TestLoadImage: error",!1,u,_),_.onabort=v($t,d,"TestLoadImage: abort",!1,u,_),_.ontimeout=v($t,d,"TestLoadImage: timeout",!1,u,_),c.setTimeout(function(){_.ontimeout&&_.ontimeout()},1e4),_.src=o}else u(!1)}function Lm(o,u){const d=new Ar,_=new AbortController,A=setTimeout(()=>{_.abort(),$t(d,"TestPingServer: timeout",!1,u)},1e4);fetch(o,{signal:_.signal}).then(S=>{clearTimeout(A),S.ok?$t(d,"TestPingServer: ok",!0,u):$t(d,"TestPingServer: server error",!1,u)}).catch(()=>{clearTimeout(A),$t(d,"TestPingServer: error",!1,u)})}function $t(o,u,d,_,A){try{A&&(A.onload=null,A.onerror=null,A.onabort=null,A.ontimeout=null),_(d)}catch{}}function xm(){this.g=new Em}function Fm(o,u,d){const _=d||"";try{Jl(o,function(A,S){let D=A;h(A)&&(D=Mo(A)),u.push(_+S+"="+encodeURIComponent(D))})}catch(A){throw u.push(_+"type="+encodeURIComponent("_badmap")),A}}function Bs(o){this.l=o.Ub||null,this.j=o.eb||!1}R(Bs,Lo),Bs.prototype.g=function(){return new qs(this.l,this.j)},Bs.prototype.i=function(o){return function(){return o}}({});function qs(o,u){Oe.call(this),this.D=o,this.o=u,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.u=new Headers,this.h=null,this.B="GET",this.A="",this.g=!1,this.v=this.j=this.l=null}R(qs,Oe),n=qs.prototype,n.open=function(o,u){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.B=o,this.A=u,this.readyState=1,Nr(this)},n.send=function(o){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");this.g=!0;const u={headers:this.u,method:this.B,credentials:this.m,cache:void 0};o&&(u.body=o),(this.D||c).fetch(new Request(this.A,u)).then(this.Sa.bind(this),this.ga.bind(this))},n.abort=function(){this.response=this.responseText="",this.u=new Headers,this.status=0,this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),1<=this.readyState&&this.g&&this.readyState!=4&&(this.g=!1,Pr(this)),this.readyState=0},n.Sa=function(o){if(this.g&&(this.l=o,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=o.headers,this.readyState=2,Nr(this)),this.g&&(this.readyState=3,Nr(this),this.g)))if(this.responseType==="arraybuffer")o.arrayBuffer().then(this.Qa.bind(this),this.ga.bind(this));else if(typeof c.ReadableStream<"u"&&"body"in o){if(this.j=o.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.v=new TextDecoder;iu(this)}else o.text().then(this.Ra.bind(this),this.ga.bind(this))};function iu(o){o.j.read().then(o.Pa.bind(o)).catch(o.ga.bind(o))}n.Pa=function(o){if(this.g){if(this.o&&o.value)this.response.push(o.value);else if(!this.o){var u=o.value?o.value:new Uint8Array(0);(u=this.v.decode(u,{stream:!o.done}))&&(this.response=this.responseText+=u)}o.done?Pr(this):Nr(this),this.readyState==3&&iu(this)}},n.Ra=function(o){this.g&&(this.response=this.responseText=o,Pr(this))},n.Qa=function(o){this.g&&(this.response=o,Pr(this))},n.ga=function(){this.g&&Pr(this)};function Pr(o){o.readyState=4,o.l=null,o.j=null,o.v=null,Nr(o)}n.setRequestHeader=function(o,u){this.u.append(o,u)},n.getResponseHeader=function(o){return this.h&&this.h.get(o.toLowerCase())||""},n.getAllResponseHeaders=function(){if(!this.h)return"";const o=[],u=this.h.entries();for(var d=u.next();!d.done;)d=d.value,o.push(d[0]+": "+d[1]),d=u.next();return o.join(`\r
`)};function Nr(o){o.onreadystatechange&&o.onreadystatechange.call(o)}Object.defineProperty(qs.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(o){this.m=o?"include":"same-origin"}});function ou(o){let u="";return pe(o,function(d,_){u+=_,u+=":",u+=d,u+=`\r
`}),u}function Ho(o,u,d){e:{for(_ in d){var _=!1;break e}_=!0}_||(d=ou(d),typeof o=="string"?d!=null&&encodeURIComponent(String(d)):ae(o,u,d))}function ue(o){Oe.call(this),this.headers=new Map,this.o=o||null,this.h=!1,this.v=this.g=null,this.D="",this.m=0,this.l="",this.j=this.B=this.u=this.A=!1,this.I=null,this.H="",this.J=!1}R(ue,Oe);var Um=/^https?$/i,Bm=["POST","PUT"];n=ue.prototype,n.Ha=function(o){this.J=o},n.ea=function(o,u,d,_){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+o);u=u?u.toUpperCase():"GET",this.D=o,this.l="",this.m=0,this.A=!1,this.h=!0,this.g=this.o?this.o.g():Uo.g(),this.v=this.o?Ml(this.o):Ml(Uo),this.g.onreadystatechange=m(this.Ea,this);try{this.B=!0,this.g.open(u,String(o),!0),this.B=!1}catch(S){au(this,S);return}if(o=d||"",d=new Map(this.headers),_)if(Object.getPrototypeOf(_)===Object.prototype)for(var A in _)d.set(A,_[A]);else if(typeof _.keys=="function"&&typeof _.get=="function")for(const S of _.keys())d.set(S,_.get(S));else throw Error("Unknown input type for opt_headers: "+String(_));_=Array.from(d.keys()).find(S=>S.toLowerCase()=="content-type"),A=c.FormData&&o instanceof c.FormData,!(0<=Array.prototype.indexOf.call(Bm,u,void 0))||_||A||d.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[S,D]of d)this.g.setRequestHeader(S,D);this.H&&(this.g.responseType=this.H),"withCredentials"in this.g&&this.g.withCredentials!==this.J&&(this.g.withCredentials=this.J);try{uu(this),this.u=!0,this.g.send(o),this.u=!1}catch(S){au(this,S)}};function au(o,u){o.h=!1,o.g&&(o.j=!0,o.g.abort(),o.j=!1),o.l=u,o.m=5,cu(o),$s(o)}function cu(o){o.A||(o.A=!0,Be(o,"complete"),Be(o,"error"))}n.abort=function(o){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.m=o||7,Be(this,"complete"),Be(this,"abort"),$s(this))},n.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),$s(this,!0)),ue.aa.N.call(this)},n.Ea=function(){this.s||(this.B||this.u||this.j?lu(this):this.bb())},n.bb=function(){lu(this)};function lu(o){if(o.h&&typeof a<"u"&&(!o.v[1]||St(o)!=4||o.Z()!=2)){if(o.u&&St(o)==4)kl(o.Ea,0,o);else if(Be(o,"readystatechange"),St(o)==4){o.h=!1;try{const D=o.Z();e:switch(D){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var u=!0;break e;default:u=!1}var d;if(!(d=u)){var _;if(_=D===0){var A=String(o.D).match(Zl)[1]||null;!A&&c.self&&c.self.location&&(A=c.self.location.protocol.slice(0,-1)),_=!Um.test(A?A.toLowerCase():"")}d=_}if(d)Be(o,"complete"),Be(o,"success");else{o.m=6;try{var S=2<St(o)?o.g.statusText:""}catch{S=""}o.l=S+" ["+o.Z()+"]",cu(o)}}finally{$s(o)}}}}function $s(o,u){if(o.g){uu(o);const d=o.g,_=o.v[0]?()=>{}:null;o.g=null,o.v=null,u||Be(o,"ready");try{d.onreadystatechange=_}catch{}}}function uu(o){o.I&&(c.clearTimeout(o.I),o.I=null)}n.isActive=function(){return!!this.g};function St(o){return o.g?o.g.readyState:0}n.Z=function(){try{return 2<St(this)?this.g.status:-1}catch{return-1}},n.oa=function(){try{return this.g?this.g.responseText:""}catch{return""}},n.Oa=function(o){if(this.g){var u=this.g.responseText;return o&&u.indexOf(o)==0&&(u=u.substring(o.length)),ym(u)}};function hu(o){try{if(!o.g)return null;if("response"in o.g)return o.g.response;switch(o.H){case"":case"text":return o.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in o.g)return o.g.mozResponseArrayBuffer}return null}catch{return null}}function qm(o){const u={};o=(o.g&&2<=St(o)&&o.g.getAllResponseHeaders()||"").split(`\r
`);for(let _=0;_<o.length;_++){if(x(o[_]))continue;var d=I(o[_]);const A=d[0];if(d=d[1],typeof d!="string")continue;d=d.trim();const S=u[A]||[];u[A]=S,S.push(d)}w(u,function(_){return _.join(", ")})}n.Ba=function(){return this.m},n.Ka=function(){return typeof this.l=="string"?this.l:String(this.l)};function kr(o,u,d){return d&&d.internalChannelParams&&d.internalChannelParams[o]||u}function du(o){this.Aa=0,this.i=[],this.j=new Ar,this.ia=this.qa=this.I=this.W=this.g=this.ya=this.D=this.H=this.m=this.S=this.o=null,this.Ya=this.U=0,this.Va=kr("failFast",!1,o),this.F=this.C=this.u=this.s=this.l=null,this.X=!0,this.za=this.T=-1,this.Y=this.v=this.B=0,this.Ta=kr("baseRetryDelayMs",5e3,o),this.cb=kr("retryDelaySeedMs",1e4,o),this.Wa=kr("forwardChannelMaxRetries",2,o),this.wa=kr("forwardChannelRequestTimeoutMs",2e4,o),this.pa=o&&o.xmlHttpFactory||void 0,this.Xa=o&&o.Tb||void 0,this.Ca=o&&o.useFetchStreams||!1,this.L=void 0,this.J=o&&o.supportsCrossDomainXhr||!1,this.K="",this.h=new Gl(o&&o.concurrentRequestLimit),this.Da=new xm,this.P=o&&o.fastHandshake||!1,this.O=o&&o.encodeInitMessageHeaders||!1,this.P&&this.O&&(this.O=!1),this.Ua=o&&o.Rb||!1,o&&o.xa&&this.j.xa(),o&&o.forceLongPolling&&(this.X=!1),this.ba=!this.P&&this.X&&o&&o.detectBufferingProxy||!1,this.ja=void 0,o&&o.longPollingTimeout&&0<o.longPollingTimeout&&(this.ja=o.longPollingTimeout),this.ca=void 0,this.R=0,this.M=!1,this.ka=this.A=null}n=du.prototype,n.la=8,n.G=1,n.connect=function(o,u,d,_){qe(0),this.W=o,this.H=u||{},d&&_!==void 0&&(this.H.OSID=d,this.H.OAID=_),this.F=this.X,this.I=vu(this,null,this.W),Ws(this)};function Go(o){if(fu(o),o.G==3){var u=o.U++,d=Rt(o.I);if(ae(d,"SID",o.K),ae(d,"RID",u),ae(d,"TYPE","terminate"),Dr(o,d),u=new Bt(o,o.j,u),u.L=2,u.v=Us(Rt(d)),d=!1,c.navigator&&c.navigator.sendBeacon)try{d=c.navigator.sendBeacon(u.v.toString(),"")}catch{}!d&&c.Image&&(new Image().src=u.v,d=!0),d||(u.g=Iu(u.j,null),u.g.ea(u.v)),u.F=Date.now(),Ls(u)}Tu(o)}function js(o){o.g&&(Qo(o),o.g.cancel(),o.g=null)}function fu(o){js(o),o.u&&(c.clearTimeout(o.u),o.u=null),zs(o),o.h.cancel(),o.s&&(typeof o.s=="number"&&c.clearTimeout(o.s),o.s=null)}function Ws(o){if(!Kl(o.h)&&!o.s){o.s=!0;var u=o.Ga;gr||Rl(),yr||(gr(),yr=!0),So.add(u,o),o.B=0}}function $m(o,u){return Ql(o.h)>=o.h.j-(o.s?1:0)?!1:o.s?(o.i=u.D.concat(o.i),!0):o.G==1||o.G==2||o.B>=(o.Va?0:o.Wa)?!1:(o.s=wr(m(o.Ga,o,u),Eu(o,o.B)),o.B++,!0)}n.Ga=function(o){if(this.s)if(this.s=null,this.G==1){if(!o){this.U=Math.floor(1e5*Math.random()),o=this.U++;const A=new Bt(this,this.j,o);let S=this.o;if(this.S&&(S?(S=g(S),T(S,this.S)):S=this.S),this.m!==null||this.O||(A.H=S,S=null),this.P)e:{for(var u=0,d=0;d<this.i.length;d++){t:{var _=this.i[d];if("__data__"in _.map&&(_=_.map.__data__,typeof _=="string")){_=_.length;break t}_=void 0}if(_===void 0)break;if(u+=_,4096<u){u=d;break e}if(u===4096||d===this.i.length-1){u=d+1;break e}}u=1e3}else u=1e3;u=_u(this,A,u),d=Rt(this.I),ae(d,"RID",o),ae(d,"CVER",22),this.D&&ae(d,"X-HTTP-Session-Id",this.D),Dr(this,d),S&&(this.O?u="headers="+encodeURIComponent(String(ou(S)))+"&"+u:this.m&&Ho(d,this.m,S)),zo(this.h,A),this.Ua&&ae(d,"TYPE","init"),this.P?(ae(d,"$req",u),ae(d,"SID","null"),A.T=!0,qo(A,d,null)):qo(A,d,u),this.G=2}}else this.G==3&&(o?pu(this,o):this.i.length==0||Kl(this.h)||pu(this))};function pu(o,u){var d;u?d=u.l:d=o.U++;const _=Rt(o.I);ae(_,"SID",o.K),ae(_,"RID",d),ae(_,"AID",o.T),Dr(o,_),o.m&&o.o&&Ho(_,o.m,o.o),d=new Bt(o,o.j,d,o.B+1),o.m===null&&(d.H=o.o),u&&(o.i=u.D.concat(o.i)),u=_u(o,d,1e3),d.I=Math.round(.5*o.wa)+Math.round(.5*o.wa*Math.random()),zo(o.h,d),qo(d,_,u)}function Dr(o,u){o.H&&pe(o.H,function(d,_){ae(u,_,d)}),o.l&&Jl({},function(d,_){ae(u,_,d)})}function _u(o,u,d){d=Math.min(o.i.length,d);var _=o.l?m(o.l.Na,o.l,o):null;e:{var A=o.i;let S=-1;for(;;){const D=["count="+d];S==-1?0<d?(S=A[0].g,D.push("ofs="+S)):S=0:D.push("ofs="+S);let re=!0;for(let Re=0;Re<d;Re++){let X=A[Re].g;const Ve=A[Re].map;if(X-=S,0>X)S=Math.max(0,A[Re].g-100),re=!1;else try{Fm(Ve,D,"req"+X+"_")}catch{_&&_(Ve)}}if(re){_=D.join("&");break e}}}return o=o.i.splice(0,d),u.D=o,_}function mu(o){if(!o.g&&!o.u){o.Y=1;var u=o.Fa;gr||Rl(),yr||(gr(),yr=!0),So.add(u,o),o.v=0}}function Ko(o){return o.g||o.u||3<=o.v?!1:(o.Y++,o.u=wr(m(o.Fa,o),Eu(o,o.v)),o.v++,!0)}n.Fa=function(){if(this.u=null,gu(this),this.ba&&!(this.M||this.g==null||0>=this.R)){var o=2*this.R;this.j.info("BP detection timer enabled: "+o),this.A=wr(m(this.ab,this),o)}},n.ab=function(){this.A&&(this.A=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.M=!0,qe(10),js(this),gu(this))};function Qo(o){o.A!=null&&(c.clearTimeout(o.A),o.A=null)}function gu(o){o.g=new Bt(o,o.j,"rpc",o.Y),o.m===null&&(o.g.H=o.o),o.g.O=0;var u=Rt(o.qa);ae(u,"RID","rpc"),ae(u,"SID",o.K),ae(u,"AID",o.T),ae(u,"CI",o.F?"0":"1"),!o.F&&o.ja&&ae(u,"TO",o.ja),ae(u,"TYPE","xmlhttp"),Dr(o,u),o.m&&o.o&&Ho(u,o.m,o.o),o.L&&(o.g.I=o.L);var d=o.g;o=o.ia,d.L=1,d.v=Us(Rt(u)),d.m=null,d.P=!0,Wl(d,o)}n.Za=function(){this.C!=null&&(this.C=null,js(this),Ko(this),qe(19))};function zs(o){o.C!=null&&(c.clearTimeout(o.C),o.C=null)}function yu(o,u){var d=null;if(o.g==u){zs(o),Qo(o),o.g=null;var _=2}else if(Wo(o.h,u))d=u.D,Yl(o.h,u),_=1;else return;if(o.G!=0){if(u.o)if(_==1){d=u.m?u.m.length:0,u=Date.now()-u.F;var A=o.B;_=Os(),Be(_,new Bl(_,d)),Ws(o)}else mu(o);else if(A=u.s,A==3||A==0&&0<u.X||!(_==1&&$m(o,u)||_==2&&Ko(o)))switch(d&&0<d.length&&(u=o.h,u.i=u.i.concat(d)),A){case 1:hn(o,5);break;case 4:hn(o,10);break;case 3:hn(o,6);break;default:hn(o,2)}}}function Eu(o,u){let d=o.Ta+Math.floor(Math.random()*o.cb);return o.isActive()||(d*=2),d*u}function hn(o,u){if(o.j.info("Error code "+u),u==2){var d=m(o.fb,o),_=o.Xa;const A=!_;_=new un(_||"//www.google.com/images/cleardot.gif"),c.location&&c.location.protocol=="http"||xs(_,"https"),Us(_),A?Mm(_.toString(),d):Lm(_.toString(),d)}else qe(2);o.G=0,o.l&&o.l.sa(u),Tu(o),fu(o)}n.fb=function(o){o?(this.j.info("Successfully pinged google.com"),qe(2)):(this.j.info("Failed to ping google.com"),qe(1))};function Tu(o){if(o.G=0,o.ka=[],o.l){const u=Xl(o.h);(u.length!=0||o.i.length!=0)&&(P(o.ka,u),P(o.ka,o.i),o.h.i.length=0,k(o.i),o.i.length=0),o.l.ra()}}function vu(o,u,d){var _=d instanceof un?Rt(d):new un(d);if(_.g!="")u&&(_.g=u+"."+_.g),Fs(_,_.s);else{var A=c.location;_=A.protocol,u=u?u+"."+A.hostname:A.hostname,A=+A.port;var S=new un(null);_&&xs(S,_),u&&(S.g=u),A&&Fs(S,A),d&&(S.l=d),_=S}return d=o.D,u=o.ya,d&&u&&ae(_,d,u),ae(_,"VER",o.la),Dr(o,_),_}function Iu(o,u,d){if(u&&!o.J)throw Error("Can't create secondary domain capable XhrIo object.");return u=o.Ca&&!o.pa?new ue(new Bs({eb:d})):new ue(o.pa),u.Ha(o.J),u}n.isActive=function(){return!!this.l&&this.l.isActive(this)};function wu(){}n=wu.prototype,n.ua=function(){},n.ta=function(){},n.sa=function(){},n.ra=function(){},n.isActive=function(){return!0},n.Na=function(){};function Hs(){}Hs.prototype.g=function(o,u){return new Je(o,u)};function Je(o,u){Oe.call(this),this.g=new du(u),this.l=o,this.h=u&&u.messageUrlParams||null,o=u&&u.messageHeaders||null,u&&u.clientProtocolHeaderRequired&&(o?o["X-Client-Protocol"]="webchannel":o={"X-Client-Protocol":"webchannel"}),this.g.o=o,o=u&&u.initMessageHeaders||null,u&&u.messageContentType&&(o?o["X-WebChannel-Content-Type"]=u.messageContentType:o={"X-WebChannel-Content-Type":u.messageContentType}),u&&u.va&&(o?o["X-WebChannel-Client-Profile"]=u.va:o={"X-WebChannel-Client-Profile":u.va}),this.g.S=o,(o=u&&u.Sb)&&!x(o)&&(this.g.m=o),this.v=u&&u.supportsCrossDomainXhr||!1,this.u=u&&u.sendRawJson||!1,(u=u&&u.httpSessionIdParam)&&!x(u)&&(this.g.D=u,o=this.h,o!==null&&u in o&&(o=this.h,u in o&&delete o[u])),this.j=new Vn(this)}R(Je,Oe),Je.prototype.m=function(){this.g.l=this.j,this.v&&(this.g.J=!0),this.g.connect(this.l,this.h||void 0)},Je.prototype.close=function(){Go(this.g)},Je.prototype.o=function(o){var u=this.g;if(typeof o=="string"){var d={};d.__data__=o,o=d}else this.u&&(d={},d.__data__=Mo(o),o=d);u.i.push(new Cm(u.Ya++,o)),u.G==3&&Ws(u)},Je.prototype.N=function(){this.g.l=null,delete this.j,Go(this.g),delete this.g,Je.aa.N.call(this)};function Au(o){xo.call(this),o.__headers__&&(this.headers=o.__headers__,this.statusCode=o.__status__,delete o.__headers__,delete o.__status__);var u=o.__sm__;if(u){e:{for(const d in u){o=d;break e}o=void 0}(this.i=o)&&(o=this.i,u=u!==null&&o in u?u[o]:void 0),this.data=u}else this.data=o}R(Au,xo);function Cu(){Fo.call(this),this.status=1}R(Cu,Fo);function Vn(o){this.g=o}R(Vn,wu),Vn.prototype.ua=function(){Be(this.g,"a")},Vn.prototype.ta=function(o){Be(this.g,new Au(o))},Vn.prototype.sa=function(o){Be(this.g,new Cu)},Vn.prototype.ra=function(){Be(this.g,"b")},Hs.prototype.createWebChannel=Hs.prototype.g,Je.prototype.send=Je.prototype.o,Je.prototype.open=Je.prototype.m,Je.prototype.close=Je.prototype.close,Gd=function(){return new Hs},Hd=function(){return Os()},zd=cn,Ta={mb:0,pb:1,qb:2,Jb:3,Ob:4,Lb:5,Mb:6,Kb:7,Ib:8,Nb:9,PROXY:10,NOPROXY:11,Gb:12,Cb:13,Db:14,Bb:15,Eb:16,Fb:17,ib:18,hb:19,jb:20},Vs.NO_ERROR=0,Vs.TIMEOUT=8,Vs.HTTP_ERROR=6,si=Vs,ql.COMPLETE="complete",Wd=ql,Ll.EventType=vr,vr.OPEN="a",vr.CLOSE="b",vr.ERROR="c",vr.MESSAGE="d",Oe.prototype.listen=Oe.prototype.K,Fr=Ll,ue.prototype.listenOnce=ue.prototype.L,ue.prototype.getLastError=ue.prototype.Ka,ue.prototype.getLastErrorCode=ue.prototype.Ba,ue.prototype.getStatus=ue.prototype.Z,ue.prototype.getResponseJson=ue.prototype.Oa,ue.prototype.getResponseText=ue.prototype.oa,ue.prototype.send=ue.prototype.ea,ue.prototype.setWithCredentials=ue.prototype.Ha,jd=ue}).apply(typeof Ks<"u"?Ks:typeof self<"u"?self:typeof window<"u"?window:{});const Mu="@firebase/firestore",Lu="4.9.1";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xe{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}xe.UNAUTHENTICATED=new xe(null),xe.GOOGLE_CREDENTIALS=new xe("google-credentials-uid"),xe.FIRST_PARTY=new xe("first-party-uid"),xe.MOCK_USER=new xe("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let or="12.2.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vn=new Gi("@firebase/firestore");function xn(){return vn.logLevel}function M(n,...e){if(vn.logLevel<=W.DEBUG){const t=e.map(cc);vn.debug(`Firestore (${or}): ${n}`,...t)}}function Vt(n,...e){if(vn.logLevel<=W.ERROR){const t=e.map(cc);vn.error(`Firestore (${or}): ${n}`,...t)}}function Kn(n,...e){if(vn.logLevel<=W.WARN){const t=e.map(cc);vn.warn(`Firestore (${or}): ${n}`,...t)}}function cc(n){if(typeof n=="string")return n;try{/**
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
*/return function(t){return JSON.stringify(t)}(n)}catch{return n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function U(n,e,t){let r="Unexpected state";typeof e=="string"?r=e:t=e,Kd(n,r,t)}function Kd(n,e,t){let r=`FIRESTORE (${or}) INTERNAL ASSERTION FAILED: ${e} (ID: ${n.toString(16)})`;if(t!==void 0)try{r+=" CONTEXT: "+JSON.stringify(t)}catch{r+=" CONTEXT: "+t}throw Vt(r),new Error(r)}function Z(n,e,t,r){let s="Unexpected state";typeof t=="string"?s=t:r=t,n||Kd(e,s,r)}function q(n,e){return n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const b={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class V extends wt{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mt{constructor(){this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qd{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class Ey{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable(()=>t(xe.UNAUTHENTICATED))}shutdown(){}}class Ty{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable(()=>t(this.token.user))}shutdown(){this.changeListener=null}}class vy{constructor(e){this.t=e,this.currentUser=xe.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,t){Z(this.o===void 0,42304);let r=this.i;const s=l=>this.i!==r?(r=this.i,t(l)):Promise.resolve();let i=new mt;this.o=()=>{this.i++,this.currentUser=this.u(),i.resolve(),i=new mt,e.enqueueRetryable(()=>s(this.currentUser))};const a=()=>{const l=i;e.enqueueRetryable(async()=>{await l.promise,await s(this.currentUser)})},c=l=>{M("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=l,this.o&&(this.auth.addAuthTokenListener(this.o),a())};this.t.onInit(l=>c(l)),setTimeout(()=>{if(!this.auth){const l=this.t.getImmediate({optional:!0});l?c(l):(M("FirebaseAuthCredentialsProvider","Auth not yet detected"),i.resolve(),i=new mt)}},0),a()}getToken(){const e=this.i,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then(r=>this.i!==e?(M("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):r?(Z(typeof r.accessToken=="string",31837,{l:r}),new Qd(r.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const e=this.auth&&this.auth.getUid();return Z(e===null||typeof e=="string",2055,{h:e}),new xe(e)}}class Iy{constructor(e,t,r){this.P=e,this.T=t,this.I=r,this.type="FirstParty",this.user=xe.FIRST_PARTY,this.A=new Map}R(){return this.I?this.I():null}get headers(){this.A.set("X-Goog-AuthUser",this.P);const e=this.R();return e&&this.A.set("Authorization",e),this.T&&this.A.set("X-Goog-Iam-Authorization-Token",this.T),this.A}}class wy{constructor(e,t,r){this.P=e,this.T=t,this.I=r}getToken(){return Promise.resolve(new Iy(this.P,this.T,this.I))}start(e,t){e.enqueueRetryable(()=>t(xe.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class xu{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class Ay{constructor(e,t){this.V=t,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,dt(e)&&e.settings.appCheckToken&&(this.p=e.settings.appCheckToken)}start(e,t){Z(this.o===void 0,3512);const r=i=>{i.error!=null&&M("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${i.error.message}`);const a=i.token!==this.m;return this.m=i.token,M("FirebaseAppCheckTokenProvider",`Received ${a?"new":"existing"} token.`),a?t(i.token):Promise.resolve()};this.o=i=>{e.enqueueRetryable(()=>r(i))};const s=i=>{M("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=i,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit(i=>s(i)),setTimeout(()=>{if(!this.appCheck){const i=this.V.getImmediate({optional:!0});i?s(i):M("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){if(this.p)return Promise.resolve(new xu(this.p));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then(t=>t?(Z(typeof t.token=="string",44558,{tokenResult:t}),this.m=t.token,new xu(t.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
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
 */function Cy(n){const e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(n);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let r=0;r<n;r++)t[r]=Math.floor(256*Math.random());return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lc{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516);let r="";for(;r.length<20;){const s=Cy(40);for(let i=0;i<s.length;++i)r.length<20&&s[i]<t&&(r+=e.charAt(s[i]%62))}return r}}function H(n,e){return n<e?-1:n>e?1:0}function va(n,e){const t=Math.min(n.length,e.length);for(let r=0;r<t;r++){const s=n.charAt(r),i=e.charAt(r);if(s!==i)return Zo(s)===Zo(i)?H(s,i):Zo(s)?1:-1}return H(n.length,e.length)}const Ry=55296,Sy=57343;function Zo(n){const e=n.charCodeAt(0);return e>=Ry&&e<=Sy}function Qn(n,e,t){return n.length===e.length&&n.every((r,s)=>t(r,e[s]))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ia="__name__";class ht{constructor(e,t,r){t===void 0?t=0:t>e.length&&U(637,{offset:t,range:e.length}),r===void 0?r=e.length-t:r>e.length-t&&U(1746,{length:r,range:e.length-t}),this.segments=e,this.offset=t,this.len=r}get length(){return this.len}isEqual(e){return ht.comparator(this,e)===0}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof ht?e.forEach(r=>{t.push(r)}):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,r=this.limit();t<r;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const r=Math.min(e.length,t.length);for(let s=0;s<r;s++){const i=ht.compareSegments(e.get(s),t.get(s));if(i!==0)return i}return H(e.length,t.length)}static compareSegments(e,t){const r=ht.isNumericId(e),s=ht.isNumericId(t);return r&&!s?-1:!r&&s?1:r&&s?ht.extractNumericId(e).compare(ht.extractNumericId(t)):va(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return Kt.fromString(e.substring(4,e.length-2))}}class oe extends ht{construct(e,t,r){return new oe(e,t,r)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const r of e){if(r.indexOf("//")>=0)throw new V(b.INVALID_ARGUMENT,`Invalid segment (${r}). Paths must not contain // in them.`);t.push(...r.split("/").filter(s=>s.length>0))}return new oe(t)}static emptyPath(){return new oe([])}}const by=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class Pe extends ht{construct(e,t,r){return new Pe(e,t,r)}static isValidIdentifier(e){return by.test(e)}canonicalString(){return this.toArray().map(e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),Pe.isValidIdentifier(e)||(e="`"+e+"`"),e)).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===Ia}static keyField(){return new Pe([Ia])}static fromServerFormat(e){const t=[];let r="",s=0;const i=()=>{if(r.length===0)throw new V(b.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(r),r=""};let a=!1;for(;s<e.length;){const c=e[s];if(c==="\\"){if(s+1===e.length)throw new V(b.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const l=e[s+1];if(l!=="\\"&&l!=="."&&l!=="`")throw new V(b.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);r+=l,s+=2}else c==="`"?(a=!a,s++):c!=="."||a?(r+=c,s++):(i(),s++)}if(i(),a)throw new V(b.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new Pe(t)}static emptyPath(){return new Pe([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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
 */function Yd(n,e,t){if(!t)throw new V(b.INVALID_ARGUMENT,`Function ${n}() cannot be called with an empty ${e}.`)}function Py(n,e,t,r){if(e===!0&&r===!0)throw new V(b.INVALID_ARGUMENT,`${n} and ${t} cannot be used together.`)}function Fu(n){if(!L.isDocumentKey(n))throw new V(b.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${n} has ${n.length}.`)}function Uu(n){if(L.isDocumentKey(n))throw new V(b.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${n} has ${n.length}.`)}function Xd(n){return typeof n=="object"&&n!==null&&(Object.getPrototypeOf(n)===Object.prototype||Object.getPrototypeOf(n)===null)}function Yi(n){if(n===void 0)return"undefined";if(n===null)return"null";if(typeof n=="string")return n.length>20&&(n=`${n.substring(0,20)}...`),JSON.stringify(n);if(typeof n=="number"||typeof n=="boolean")return""+n;if(typeof n=="object"){if(n instanceof Array)return"an array";{const e=function(r){return r.constructor?r.constructor.name:null}(n);return e?`a custom ${e} object`:"an object"}}return typeof n=="function"?"a function":U(12329,{type:typeof n})}function Ue(n,e){if("_delegate"in n&&(n=n._delegate),!(n instanceof e)){if(e.name===n.constructor.name)throw new V(b.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const t=Yi(n);throw new V(b.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return n}/**
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
 */function Te(n,e){const t={typeString:n};return e&&(t.value=e),t}function ms(n,e){if(!Xd(n))throw new V(b.INVALID_ARGUMENT,"JSON must be an object");let t;for(const r in e)if(e[r]){const s=e[r].typeString,i="value"in e[r]?{value:e[r].value}:void 0;if(!(r in n)){t=`JSON missing required field: '${r}'`;break}const a=n[r];if(s&&typeof a!==s){t=`JSON field '${r}' must be a ${s}.`;break}if(i!==void 0&&a!==i.value){t=`Expected '${r}' field to equal '${i.value}'`;break}}if(t)throw new V(b.INVALID_ARGUMENT,t);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bu=-62135596800,qu=1e6;class le{static now(){return le.fromMillis(Date.now())}static fromDate(e){return le.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),r=Math.floor((e-1e3*t)*qu);return new le(t,r)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new V(b.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new V(b.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<Bu)throw new V(b.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new V(b.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/qu}_compareTo(e){return this.seconds===e.seconds?H(this.nanoseconds,e.nanoseconds):H(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:le._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(ms(e,le._jsonSchema))return new le(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-Bu;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}le._jsonSchemaVersion="firestore/timestamp/1.0",le._jsonSchema={type:Te("string",le._jsonSchemaVersion),seconds:Te("number"),nanoseconds:Te("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ${static fromTimestamp(e){return new $(e)}static min(){return new $(new le(0,0))}static max(){return new $(new le(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
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
 */const ss=-1;function Ny(n,e){const t=n.toTimestamp().seconds,r=n.toTimestamp().nanoseconds+1,s=$.fromTimestamp(r===1e9?new le(t+1,0):new le(t,r));return new Jt(s,L.empty(),e)}function ky(n){return new Jt(n.readTime,n.key,ss)}class Jt{constructor(e,t,r){this.readTime=e,this.documentKey=t,this.largestBatchId=r}static min(){return new Jt($.min(),L.empty(),ss)}static max(){return new Jt($.max(),L.empty(),ss)}}function Dy(n,e){let t=n.readTime.compareTo(e.readTime);return t!==0?t:(t=L.comparator(n.documentKey,e.documentKey),t!==0?t:H(n.largestBatchId,e.largestBatchId))}/**
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
 */const Oy="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class Vy{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(e=>e())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ar(n){if(n.code!==b.FAILED_PRECONDITION||n.message!==Oy)throw n;M("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class N{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e(t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t)},t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t)})}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&U(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new N((r,s)=>{this.nextCallback=i=>{this.wrapSuccess(e,i).next(r,s)},this.catchCallback=i=>{this.wrapFailure(t,i).next(r,s)}})}toPromise(){return new Promise((e,t)=>{this.next(e,t)})}wrapUserFunction(e){try{const t=e();return t instanceof N?t:N.resolve(t)}catch(t){return N.reject(t)}}wrapSuccess(e,t){return e?this.wrapUserFunction(()=>e(t)):N.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction(()=>e(t)):N.reject(t)}static resolve(e){return new N((t,r)=>{t(e)})}static reject(e){return new N((t,r)=>{r(e)})}static waitFor(e){return new N((t,r)=>{let s=0,i=0,a=!1;e.forEach(c=>{++s,c.next(()=>{++i,a&&i===s&&t()},l=>r(l))}),a=!0,i===s&&t()})}static or(e){let t=N.resolve(!1);for(const r of e)t=t.next(s=>s?N.resolve(s):r());return t}static forEach(e,t){const r=[];return e.forEach((s,i)=>{r.push(t.call(this,s,i))}),this.waitFor(r)}static mapArray(e,t){return new N((r,s)=>{const i=e.length,a=new Array(i);let c=0;for(let l=0;l<i;l++){const h=l;t(e[h]).next(f=>{a[h]=f,++c,c===i&&r(a)},f=>s(f))}})}static doWhile(e,t){return new N((r,s)=>{const i=()=>{e()===!0?t().next(()=>{i()},s):r()};i()})}}function My(n){const e=n.match(/Android ([\d.]+)/i),t=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(t)}function cr(n){return n.name==="IndexedDbTransactionError"}/**
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
 */class Xi{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=r=>this.ae(r),this.ue=r=>t.writeSequenceNumber(r))}ae(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.ue&&this.ue(e),e}}Xi.ce=-1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const uc=-1;function Ji(n){return n==null}function gi(n){return n===0&&1/n==-1/0}function Ly(n){return typeof n=="number"&&Number.isInteger(n)&&!gi(n)&&n<=Number.MAX_SAFE_INTEGER&&n>=Number.MIN_SAFE_INTEGER}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Jd="";function xy(n){let e="";for(let t=0;t<n.length;t++)e.length>0&&(e=$u(e)),e=Fy(n.get(t),e);return $u(e)}function Fy(n,e){let t=e;const r=n.length;for(let s=0;s<r;s++){const i=n.charAt(s);switch(i){case"\0":t+="";break;case Jd:t+="";break;default:t+=i}}return t}function $u(n){return n+Jd+""}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ju(n){let e=0;for(const t in n)Object.prototype.hasOwnProperty.call(n,t)&&e++;return e}function on(n,e){for(const t in n)Object.prototype.hasOwnProperty.call(n,t)&&e(t,n[t])}function Uy(n,e){const t=[];for(const r in n)Object.prototype.hasOwnProperty.call(n,r)&&t.push(e(n[r],r,n));return t}function Zd(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ve=class wa{constructor(e,t){this.comparator=e,this.root=t||Qt.EMPTY}insert(e,t){return new wa(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,Qt.BLACK,null,null))}remove(e){return new wa(this.comparator,this.root.remove(e,this.comparator).copy(null,null,Qt.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){const r=this.comparator(e,t.key);if(r===0)return t.value;r<0?t=t.left:r>0&&(t=t.right)}return null}indexOf(e){let t=0,r=this.root;for(;!r.isEmpty();){const s=this.comparator(e,r.key);if(s===0)return t+r.left.size;s<0?r=r.left:(t+=r.left.size+1,r=r.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal((t,r)=>(e(t,r),!1))}toString(){const e=[];return this.inorderTraversal((t,r)=>(e.push(`${t}:${r}`),!1)),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new Qs(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new Qs(this.root,e,this.comparator,!1)}getReverseIterator(){return new Qs(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new Qs(this.root,e,this.comparator,!0)}},Qs=class{constructor(e,t,r,s){this.isReverse=s,this.nodeStack=[];let i=1;for(;!e.isEmpty();)if(i=t?r(e.key,t):1,t&&s&&(i*=-1),i<0)e=this.isReverse?e.left:e.right;else{if(i===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}},Qt=class bt{constructor(e,t,r,s,i){this.key=e,this.value=t,this.color=r??bt.RED,this.left=s??bt.EMPTY,this.right=i??bt.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,r,s,i){return new bt(e??this.key,t??this.value,r??this.color,s??this.left,i??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,r){let s=this;const i=r(e,s.key);return s=i<0?s.copy(null,null,null,s.left.insert(e,t,r),null):i===0?s.copy(null,t,null,null,null):s.copy(null,null,null,null,s.right.insert(e,t,r)),s.fixUp()}removeMin(){if(this.left.isEmpty())return bt.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let r,s=this;if(t(e,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(e,t),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),t(e,s.key)===0){if(s.right.isEmpty())return bt.EMPTY;r=s.right.min(),s=s.copy(r.key,r.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(e,t))}return s.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,bt.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,bt.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw U(43730,{key:this.key,value:this.value});if(this.right.isRed())throw U(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw U(27949);return e+(this.isRed()?0:1)}};Qt.EMPTY=null,Qt.RED=!0,Qt.BLACK=!1;Qt.EMPTY=new class{constructor(){this.size=0}get key(){throw U(57766)}get value(){throw U(16141)}get color(){throw U(16727)}get left(){throw U(29726)}get right(){throw U(36894)}copy(e,t,r,s,i){return this}insert(e,t,r){return new Qt(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ie{constructor(e){this.comparator=e,this.data=new ve(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal((t,r)=>(e(t),!1))}forEachInRange(e,t){const r=this.data.getIteratorFrom(e[0]);for(;r.hasNext();){const s=r.getNext();if(this.comparator(s.key,e[1])>=0)return;t(s.key)}}forEachWhile(e,t){let r;for(r=t!==void 0?this.data.getIteratorFrom(t):this.data.getIterator();r.hasNext();)if(!e(r.getNext().key))return}firstAfterOrEqual(e){const t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new Wu(this.data.getIterator())}getIteratorFrom(e){return new Wu(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach(r=>{t=t.add(r)}),t}isEqual(e){if(!(e instanceof Ie)||this.size!==e.size)return!1;const t=this.data.getIterator(),r=e.data.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=r.getNext().key;if(this.comparator(s,i)!==0)return!1}return!0}toArray(){const e=[];return this.forEach(t=>{e.push(t)}),e}toString(){const e=[];return this.forEach(t=>e.push(t)),"SortedSet("+e.toString()+")"}copy(e){const t=new Ie(this.comparator);return t.data=e,t}}class Wu{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}/**
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
 */class Ze{constructor(e){this.fields=e,e.sort(Pe.comparator)}static empty(){return new Ze([])}unionWith(e){let t=new Ie(Pe.comparator);for(const r of this.fields)t=t.add(r);for(const r of e)t=t.add(r);return new Ze(t.toArray())}covers(e){for(const t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return Qn(this.fields,e.fields,(t,r)=>t.isEqual(r))}}/**
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
 */class ef extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
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
 */class ke{constructor(e){this.binaryString=e}static fromBase64String(e){const t=function(s){try{return atob(s)}catch(i){throw typeof DOMException<"u"&&i instanceof DOMException?new ef("Invalid base64 string: "+i):i}}(e);return new ke(t)}static fromUint8Array(e){const t=function(s){let i="";for(let a=0;a<s.length;++a)i+=String.fromCharCode(s[a]);return i}(e);return new ke(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return function(t){return btoa(t)}(this.binaryString)}toUint8Array(){return function(t){const r=new Uint8Array(t.length);for(let s=0;s<t.length;s++)r[s]=t.charCodeAt(s);return r}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return H(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}ke.EMPTY_BYTE_STRING=new ke("");const By=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Zt(n){if(Z(!!n,39018),typeof n=="string"){let e=0;const t=By.exec(n);if(Z(!!t,46558,{timestamp:n}),t[1]){let s=t[1];s=(s+"000000000").substr(0,9),e=Number(s)}const r=new Date(n);return{seconds:Math.floor(r.getTime()/1e3),nanos:e}}return{seconds:_e(n.seconds),nanos:_e(n.nanos)}}function _e(n){return typeof n=="number"?n:typeof n=="string"?Number(n):0}function en(n){return typeof n=="string"?ke.fromBase64String(n):ke.fromUint8Array(n)}/**
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
 */const tf="server_timestamp",nf="__type__",rf="__previous_value__",sf="__local_write_time__";function hc(n){var t,r;return((r=(((t=n==null?void 0:n.mapValue)==null?void 0:t.fields)||{})[nf])==null?void 0:r.stringValue)===tf}function Zi(n){const e=n.mapValue.fields[rf];return hc(e)?Zi(e):e}function is(n){const e=Zt(n.mapValue.fields[sf].timestampValue);return new le(e.seconds,e.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qy{constructor(e,t,r,s,i,a,c,l,h,f){this.databaseId=e,this.appId=t,this.persistenceKey=r,this.host=s,this.ssl=i,this.forceLongPolling=a,this.autoDetectLongPolling=c,this.longPollingOptions=l,this.useFetchStreams=h,this.isUsingEmulator=f}}const Aa="(default)";class os{constructor(e,t){this.projectId=e,this.database=t||Aa}static empty(){return new os("","")}get isDefaultDatabase(){return this.database===Aa}isEqual(e){return e instanceof os&&e.projectId===this.projectId&&e.database===this.database}}/**
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
 */const of="__type__",$y="__max__",Ys={mapValue:{}},af="__vector__",yi="value";function tn(n){return"nullValue"in n?0:"booleanValue"in n?1:"integerValue"in n||"doubleValue"in n?2:"timestampValue"in n?3:"stringValue"in n?5:"bytesValue"in n?6:"referenceValue"in n?7:"geoPointValue"in n?8:"arrayValue"in n?9:"mapValue"in n?hc(n)?4:Wy(n)?9007199254740991:jy(n)?10:11:U(28295,{value:n})}function It(n,e){if(n===e)return!0;const t=tn(n);if(t!==tn(e))return!1;switch(t){case 0:case 9007199254740991:return!0;case 1:return n.booleanValue===e.booleanValue;case 4:return is(n).isEqual(is(e));case 3:return function(s,i){if(typeof s.timestampValue=="string"&&typeof i.timestampValue=="string"&&s.timestampValue.length===i.timestampValue.length)return s.timestampValue===i.timestampValue;const a=Zt(s.timestampValue),c=Zt(i.timestampValue);return a.seconds===c.seconds&&a.nanos===c.nanos}(n,e);case 5:return n.stringValue===e.stringValue;case 6:return function(s,i){return en(s.bytesValue).isEqual(en(i.bytesValue))}(n,e);case 7:return n.referenceValue===e.referenceValue;case 8:return function(s,i){return _e(s.geoPointValue.latitude)===_e(i.geoPointValue.latitude)&&_e(s.geoPointValue.longitude)===_e(i.geoPointValue.longitude)}(n,e);case 2:return function(s,i){if("integerValue"in s&&"integerValue"in i)return _e(s.integerValue)===_e(i.integerValue);if("doubleValue"in s&&"doubleValue"in i){const a=_e(s.doubleValue),c=_e(i.doubleValue);return a===c?gi(a)===gi(c):isNaN(a)&&isNaN(c)}return!1}(n,e);case 9:return Qn(n.arrayValue.values||[],e.arrayValue.values||[],It);case 10:case 11:return function(s,i){const a=s.mapValue.fields||{},c=i.mapValue.fields||{};if(ju(a)!==ju(c))return!1;for(const l in a)if(a.hasOwnProperty(l)&&(c[l]===void 0||!It(a[l],c[l])))return!1;return!0}(n,e);default:return U(52216,{left:n})}}function as(n,e){return(n.values||[]).find(t=>It(t,e))!==void 0}function Yn(n,e){if(n===e)return 0;const t=tn(n),r=tn(e);if(t!==r)return H(t,r);switch(t){case 0:case 9007199254740991:return 0;case 1:return H(n.booleanValue,e.booleanValue);case 2:return function(i,a){const c=_e(i.integerValue||i.doubleValue),l=_e(a.integerValue||a.doubleValue);return c<l?-1:c>l?1:c===l?0:isNaN(c)?isNaN(l)?0:-1:1}(n,e);case 3:return zu(n.timestampValue,e.timestampValue);case 4:return zu(is(n),is(e));case 5:return va(n.stringValue,e.stringValue);case 6:return function(i,a){const c=en(i),l=en(a);return c.compareTo(l)}(n.bytesValue,e.bytesValue);case 7:return function(i,a){const c=i.split("/"),l=a.split("/");for(let h=0;h<c.length&&h<l.length;h++){const f=H(c[h],l[h]);if(f!==0)return f}return H(c.length,l.length)}(n.referenceValue,e.referenceValue);case 8:return function(i,a){const c=H(_e(i.latitude),_e(a.latitude));return c!==0?c:H(_e(i.longitude),_e(a.longitude))}(n.geoPointValue,e.geoPointValue);case 9:return Hu(n.arrayValue,e.arrayValue);case 10:return function(i,a){var m,v,R,k;const c=i.fields||{},l=a.fields||{},h=(m=c[yi])==null?void 0:m.arrayValue,f=(v=l[yi])==null?void 0:v.arrayValue,p=H(((R=h==null?void 0:h.values)==null?void 0:R.length)||0,((k=f==null?void 0:f.values)==null?void 0:k.length)||0);return p!==0?p:Hu(h,f)}(n.mapValue,e.mapValue);case 11:return function(i,a){if(i===Ys.mapValue&&a===Ys.mapValue)return 0;if(i===Ys.mapValue)return 1;if(a===Ys.mapValue)return-1;const c=i.fields||{},l=Object.keys(c),h=a.fields||{},f=Object.keys(h);l.sort(),f.sort();for(let p=0;p<l.length&&p<f.length;++p){const m=va(l[p],f[p]);if(m!==0)return m;const v=Yn(c[l[p]],h[f[p]]);if(v!==0)return v}return H(l.length,f.length)}(n.mapValue,e.mapValue);default:throw U(23264,{he:t})}}function zu(n,e){if(typeof n=="string"&&typeof e=="string"&&n.length===e.length)return H(n,e);const t=Zt(n),r=Zt(e),s=H(t.seconds,r.seconds);return s!==0?s:H(t.nanos,r.nanos)}function Hu(n,e){const t=n.values||[],r=e.values||[];for(let s=0;s<t.length&&s<r.length;++s){const i=Yn(t[s],r[s]);if(i)return i}return H(t.length,r.length)}function Xn(n){return Ca(n)}function Ca(n){return"nullValue"in n?"null":"booleanValue"in n?""+n.booleanValue:"integerValue"in n?""+n.integerValue:"doubleValue"in n?""+n.doubleValue:"timestampValue"in n?function(t){const r=Zt(t);return`time(${r.seconds},${r.nanos})`}(n.timestampValue):"stringValue"in n?n.stringValue:"bytesValue"in n?function(t){return en(t).toBase64()}(n.bytesValue):"referenceValue"in n?function(t){return L.fromName(t).toString()}(n.referenceValue):"geoPointValue"in n?function(t){return`geo(${t.latitude},${t.longitude})`}(n.geoPointValue):"arrayValue"in n?function(t){let r="[",s=!0;for(const i of t.values||[])s?s=!1:r+=",",r+=Ca(i);return r+"]"}(n.arrayValue):"mapValue"in n?function(t){const r=Object.keys(t.fields||{}).sort();let s="{",i=!0;for(const a of r)i?i=!1:s+=",",s+=`${a}:${Ca(t.fields[a])}`;return s+"}"}(n.mapValue):U(61005,{value:n})}function ii(n){switch(tn(n)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const e=Zi(n);return e?16+ii(e):16;case 5:return 2*n.stringValue.length;case 6:return en(n.bytesValue).approximateByteSize();case 7:return n.referenceValue.length;case 9:return function(r){return(r.values||[]).reduce((s,i)=>s+ii(i),0)}(n.arrayValue);case 10:case 11:return function(r){let s=0;return on(r.fields,(i,a)=>{s+=i.length+ii(a)}),s}(n.mapValue);default:throw U(13486,{value:n})}}function Gu(n,e){return{referenceValue:`projects/${n.projectId}/databases/${n.database}/documents/${e.path.canonicalString()}`}}function Ra(n){return!!n&&"integerValue"in n}function dc(n){return!!n&&"arrayValue"in n}function Ku(n){return!!n&&"nullValue"in n}function Qu(n){return!!n&&"doubleValue"in n&&isNaN(Number(n.doubleValue))}function oi(n){return!!n&&"mapValue"in n}function jy(n){var t,r;return((r=(((t=n==null?void 0:n.mapValue)==null?void 0:t.fields)||{})[of])==null?void 0:r.stringValue)===af}function Wr(n){if(n.geoPointValue)return{geoPointValue:{...n.geoPointValue}};if(n.timestampValue&&typeof n.timestampValue=="object")return{timestampValue:{...n.timestampValue}};if(n.mapValue){const e={mapValue:{fields:{}}};return on(n.mapValue.fields,(t,r)=>e.mapValue.fields[t]=Wr(r)),e}if(n.arrayValue){const e={arrayValue:{values:[]}};for(let t=0;t<(n.arrayValue.values||[]).length;++t)e.arrayValue.values[t]=Wr(n.arrayValue.values[t]);return e}return{...n}}function Wy(n){return(((n.mapValue||{}).fields||{}).__type__||{}).stringValue===$y}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class He{constructor(e){this.value=e}static empty(){return new He({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let r=0;r<e.length-1;++r)if(t=(t.mapValue.fields||{})[e.get(r)],!oi(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=Wr(t)}setAll(e){let t=Pe.emptyPath(),r={},s=[];e.forEach((a,c)=>{if(!t.isImmediateParentOf(c)){const l=this.getFieldsMap(t);this.applyChanges(l,r,s),r={},s=[],t=c.popLast()}a?r[c.lastSegment()]=Wr(a):s.push(c.lastSegment())});const i=this.getFieldsMap(t);this.applyChanges(i,r,s)}delete(e){const t=this.field(e.popLast());oi(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return It(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let r=0;r<e.length;++r){let s=t.mapValue.fields[e.get(r)];oi(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},t.mapValue.fields[e.get(r)]=s),t=s}return t.mapValue.fields}applyChanges(e,t,r){on(t,(s,i)=>e[s]=i);for(const s of r)delete e[s]}clone(){return new He(Wr(this.value))}}function cf(n){const e=[];return on(n.fields,(t,r)=>{const s=new Pe([t]);if(oi(r)){const i=cf(r.mapValue).fields;if(i.length===0)e.push(s);else for(const a of i)e.push(s.child(a))}else e.push(s)}),new Ze(e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fe{constructor(e,t,r,s,i,a,c){this.key=e,this.documentType=t,this.version=r,this.readTime=s,this.createTime=i,this.data=a,this.documentState=c}static newInvalidDocument(e){return new Fe(e,0,$.min(),$.min(),$.min(),He.empty(),0)}static newFoundDocument(e,t,r,s){return new Fe(e,1,t,$.min(),r,s,0)}static newNoDocument(e,t){return new Fe(e,2,t,$.min(),$.min(),He.empty(),0)}static newUnknownDocument(e,t){return new Fe(e,3,t,$.min(),$.min(),He.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual($.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=He.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=He.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=$.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof Fe&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new Fe(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
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
 */class Ei{constructor(e,t){this.position=e,this.inclusive=t}}function Yu(n,e,t){let r=0;for(let s=0;s<n.position.length;s++){const i=e[s],a=n.position[s];if(i.field.isKeyField()?r=L.comparator(L.fromName(a.referenceValue),t.key):r=Yn(a,t.data.field(i.field)),i.dir==="desc"&&(r*=-1),r!==0)break}return r}function Xu(n,e){if(n===null)return e===null;if(e===null||n.inclusive!==e.inclusive||n.position.length!==e.position.length)return!1;for(let t=0;t<n.position.length;t++)if(!It(n.position[t],e.position[t]))return!1;return!0}/**
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
 */class cs{constructor(e,t="asc"){this.field=e,this.dir=t}}function zy(n,e){return n.dir===e.dir&&n.field.isEqual(e.field)}/**
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
 */class lf{}class Ee extends lf{constructor(e,t,r){super(),this.field=e,this.op=t,this.value=r}static create(e,t,r){return e.isKeyField()?t==="in"||t==="not-in"?this.createKeyFieldInFilter(e,t,r):new Gy(e,t,r):t==="array-contains"?new Yy(e,r):t==="in"?new Xy(e,r):t==="not-in"?new Jy(e,r):t==="array-contains-any"?new Zy(e,r):new Ee(e,t,r)}static createKeyFieldInFilter(e,t,r){return t==="in"?new Ky(e,r):new Qy(e,r)}matches(e){const t=e.data.field(this.field);return this.op==="!="?t!==null&&t.nullValue===void 0&&this.matchesComparison(Yn(t,this.value)):t!==null&&tn(this.value)===tn(t)&&this.matchesComparison(Yn(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return U(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class ct extends lf{constructor(e,t){super(),this.filters=e,this.op=t,this.Pe=null}static create(e,t){return new ct(e,t)}matches(e){return uf(this)?this.filters.find(t=>!t.matches(e))===void 0:this.filters.find(t=>t.matches(e))!==void 0}getFlattenedFilters(){return this.Pe!==null||(this.Pe=this.filters.reduce((e,t)=>e.concat(t.getFlattenedFilters()),[])),this.Pe}getFilters(){return Object.assign([],this.filters)}}function uf(n){return n.op==="and"}function hf(n){return Hy(n)&&uf(n)}function Hy(n){for(const e of n.filters)if(e instanceof ct)return!1;return!0}function Sa(n){if(n instanceof Ee)return n.field.canonicalString()+n.op.toString()+Xn(n.value);if(hf(n))return n.filters.map(e=>Sa(e)).join(",");{const e=n.filters.map(t=>Sa(t)).join(",");return`${n.op}(${e})`}}function df(n,e){return n instanceof Ee?function(r,s){return s instanceof Ee&&r.op===s.op&&r.field.isEqual(s.field)&&It(r.value,s.value)}(n,e):n instanceof ct?function(r,s){return s instanceof ct&&r.op===s.op&&r.filters.length===s.filters.length?r.filters.reduce((i,a,c)=>i&&df(a,s.filters[c]),!0):!1}(n,e):void U(19439)}function ff(n){return n instanceof Ee?function(t){return`${t.field.canonicalString()} ${t.op} ${Xn(t.value)}`}(n):n instanceof ct?function(t){return t.op.toString()+" {"+t.getFilters().map(ff).join(" ,")+"}"}(n):"Filter"}class Gy extends Ee{constructor(e,t,r){super(e,t,r),this.key=L.fromName(r.referenceValue)}matches(e){const t=L.comparator(e.key,this.key);return this.matchesComparison(t)}}class Ky extends Ee{constructor(e,t){super(e,"in",t),this.keys=pf("in",t)}matches(e){return this.keys.some(t=>t.isEqual(e.key))}}class Qy extends Ee{constructor(e,t){super(e,"not-in",t),this.keys=pf("not-in",t)}matches(e){return!this.keys.some(t=>t.isEqual(e.key))}}function pf(n,e){var t;return(((t=e.arrayValue)==null?void 0:t.values)||[]).map(r=>L.fromName(r.referenceValue))}class Yy extends Ee{constructor(e,t){super(e,"array-contains",t)}matches(e){const t=e.data.field(this.field);return dc(t)&&as(t.arrayValue,this.value)}}class Xy extends Ee{constructor(e,t){super(e,"in",t)}matches(e){const t=e.data.field(this.field);return t!==null&&as(this.value.arrayValue,t)}}class Jy extends Ee{constructor(e,t){super(e,"not-in",t)}matches(e){if(as(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const t=e.data.field(this.field);return t!==null&&t.nullValue===void 0&&!as(this.value.arrayValue,t)}}class Zy extends Ee{constructor(e,t){super(e,"array-contains-any",t)}matches(e){const t=e.data.field(this.field);return!(!dc(t)||!t.arrayValue.values)&&t.arrayValue.values.some(r=>as(this.value.arrayValue,r))}}/**
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
 */class eE{constructor(e,t=null,r=[],s=[],i=null,a=null,c=null){this.path=e,this.collectionGroup=t,this.orderBy=r,this.filters=s,this.limit=i,this.startAt=a,this.endAt=c,this.Te=null}}function Ju(n,e=null,t=[],r=[],s=null,i=null,a=null){return new eE(n,e,t,r,s,i,a)}function fc(n){const e=q(n);if(e.Te===null){let t=e.path.canonicalString();e.collectionGroup!==null&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map(r=>Sa(r)).join(","),t+="|ob:",t+=e.orderBy.map(r=>function(i){return i.field.canonicalString()+i.dir}(r)).join(","),Ji(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map(r=>Xn(r)).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map(r=>Xn(r)).join(",")),e.Te=t}return e.Te}function pc(n,e){if(n.limit!==e.limit||n.orderBy.length!==e.orderBy.length)return!1;for(let t=0;t<n.orderBy.length;t++)if(!zy(n.orderBy[t],e.orderBy[t]))return!1;if(n.filters.length!==e.filters.length)return!1;for(let t=0;t<n.filters.length;t++)if(!df(n.filters[t],e.filters[t]))return!1;return n.collectionGroup===e.collectionGroup&&!!n.path.isEqual(e.path)&&!!Xu(n.startAt,e.startAt)&&Xu(n.endAt,e.endAt)}function ba(n){return L.isDocumentKey(n.path)&&n.collectionGroup===null&&n.filters.length===0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lr{constructor(e,t=null,r=[],s=[],i=null,a="F",c=null,l=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=r,this.filters=s,this.limit=i,this.limitType=a,this.startAt=c,this.endAt=l,this.Ie=null,this.Ee=null,this.de=null,this.startAt,this.endAt}}function tE(n,e,t,r,s,i,a,c){return new lr(n,e,t,r,s,i,a,c)}function eo(n){return new lr(n)}function Zu(n){return n.filters.length===0&&n.limit===null&&n.startAt==null&&n.endAt==null&&(n.explicitOrderBy.length===0||n.explicitOrderBy.length===1&&n.explicitOrderBy[0].field.isKeyField())}function _f(n){return n.collectionGroup!==null}function zr(n){const e=q(n);if(e.Ie===null){e.Ie=[];const t=new Set;for(const i of e.explicitOrderBy)e.Ie.push(i),t.add(i.field.canonicalString());const r=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(a){let c=new Ie(Pe.comparator);return a.filters.forEach(l=>{l.getFlattenedFilters().forEach(h=>{h.isInequality()&&(c=c.add(h.field))})}),c})(e).forEach(i=>{t.has(i.canonicalString())||i.isKeyField()||e.Ie.push(new cs(i,r))}),t.has(Pe.keyField().canonicalString())||e.Ie.push(new cs(Pe.keyField(),r))}return e.Ie}function gt(n){const e=q(n);return e.Ee||(e.Ee=mf(e,zr(n))),e.Ee}function nE(n){const e=q(n);return e.de||(e.de=mf(e,n.explicitOrderBy)),e.de}function mf(n,e){if(n.limitType==="F")return Ju(n.path,n.collectionGroup,e,n.filters,n.limit,n.startAt,n.endAt);{e=e.map(s=>{const i=s.dir==="desc"?"asc":"desc";return new cs(s.field,i)});const t=n.endAt?new Ei(n.endAt.position,n.endAt.inclusive):null,r=n.startAt?new Ei(n.startAt.position,n.startAt.inclusive):null;return Ju(n.path,n.collectionGroup,e,n.filters,n.limit,t,r)}}function Pa(n,e){const t=n.filters.concat([e]);return new lr(n.path,n.collectionGroup,n.explicitOrderBy.slice(),t,n.limit,n.limitType,n.startAt,n.endAt)}function Ti(n,e,t){return new lr(n.path,n.collectionGroup,n.explicitOrderBy.slice(),n.filters.slice(),e,t,n.startAt,n.endAt)}function to(n,e){return pc(gt(n),gt(e))&&n.limitType===e.limitType}function gf(n){return`${fc(gt(n))}|lt:${n.limitType}`}function Fn(n){return`Query(target=${function(t){let r=t.path.canonicalString();return t.collectionGroup!==null&&(r+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(r+=`, filters: [${t.filters.map(s=>ff(s)).join(", ")}]`),Ji(t.limit)||(r+=", limit: "+t.limit),t.orderBy.length>0&&(r+=`, orderBy: [${t.orderBy.map(s=>function(a){return`${a.field.canonicalString()} (${a.dir})`}(s)).join(", ")}]`),t.startAt&&(r+=", startAt: ",r+=t.startAt.inclusive?"b:":"a:",r+=t.startAt.position.map(s=>Xn(s)).join(",")),t.endAt&&(r+=", endAt: ",r+=t.endAt.inclusive?"a:":"b:",r+=t.endAt.position.map(s=>Xn(s)).join(",")),`Target(${r})`}(gt(n))}; limitType=${n.limitType})`}function no(n,e){return e.isFoundDocument()&&function(r,s){const i=s.key.path;return r.collectionGroup!==null?s.key.hasCollectionId(r.collectionGroup)&&r.path.isPrefixOf(i):L.isDocumentKey(r.path)?r.path.isEqual(i):r.path.isImmediateParentOf(i)}(n,e)&&function(r,s){for(const i of zr(r))if(!i.field.isKeyField()&&s.data.field(i.field)===null)return!1;return!0}(n,e)&&function(r,s){for(const i of r.filters)if(!i.matches(s))return!1;return!0}(n,e)&&function(r,s){return!(r.startAt&&!function(a,c,l){const h=Yu(a,c,l);return a.inclusive?h<=0:h<0}(r.startAt,zr(r),s)||r.endAt&&!function(a,c,l){const h=Yu(a,c,l);return a.inclusive?h>=0:h>0}(r.endAt,zr(r),s))}(n,e)}function rE(n){return n.collectionGroup||(n.path.length%2==1?n.path.lastSegment():n.path.get(n.path.length-2))}function yf(n){return(e,t)=>{let r=!1;for(const s of zr(n)){const i=sE(s,e,t);if(i!==0)return i;r=r||s.field.isKeyField()}return 0}}function sE(n,e,t){const r=n.field.isKeyField()?L.comparator(e.key,t.key):function(i,a,c){const l=a.data.field(i),h=c.data.field(i);return l!==null&&h!==null?Yn(l,h):U(42886)}(n.field,e,t);switch(n.dir){case"asc":return r;case"desc":return-1*r;default:return U(19790,{direction:n.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Sn{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){const t=this.mapKeyFn(e),r=this.inner[t];if(r!==void 0){for(const[s,i]of r)if(this.equalsFn(s,e))return i}}has(e){return this.get(e)!==void 0}set(e,t){const r=this.mapKeyFn(e),s=this.inner[r];if(s===void 0)return this.inner[r]=[[e,t]],void this.innerSize++;for(let i=0;i<s.length;i++)if(this.equalsFn(s[i][0],e))return void(s[i]=[e,t]);s.push([e,t]),this.innerSize++}delete(e){const t=this.mapKeyFn(e),r=this.inner[t];if(r===void 0)return!1;for(let s=0;s<r.length;s++)if(this.equalsFn(r[s][0],e))return r.length===1?delete this.inner[t]:r.splice(s,1),this.innerSize--,!0;return!1}forEach(e){on(this.inner,(t,r)=>{for(const[s,i]of r)e(s,i)})}isEmpty(){return Zd(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const iE=new ve(L.comparator);function Mt(){return iE}const Ef=new ve(L.comparator);function Ur(...n){let e=Ef;for(const t of n)e=e.insert(t.key,t);return e}function Tf(n){let e=Ef;return n.forEach((t,r)=>e=e.insert(t,r.overlayedDocument)),e}function pn(){return Hr()}function vf(){return Hr()}function Hr(){return new Sn(n=>n.toString(),(n,e)=>n.isEqual(e))}const oE=new ve(L.comparator),aE=new Ie(L.comparator);function K(...n){let e=aE;for(const t of n)e=e.add(t);return e}const cE=new Ie(H);function lE(){return cE}/**
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
 */function _c(n,e){if(n.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:gi(e)?"-0":e}}function If(n){return{integerValue:""+n}}function uE(n,e){return Ly(e)?If(e):_c(n,e)}/**
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
 */class ro{constructor(){this._=void 0}}function hE(n,e,t){return n instanceof ls?function(s,i){const a={fields:{[nf]:{stringValue:tf},[sf]:{timestampValue:{seconds:s.seconds,nanos:s.nanoseconds}}}};return i&&hc(i)&&(i=Zi(i)),i&&(a.fields[rf]=i),{mapValue:a}}(t,e):n instanceof us?Af(n,e):n instanceof hs?Cf(n,e):function(s,i){const a=wf(s,i),c=eh(a)+eh(s.Ae);return Ra(a)&&Ra(s.Ae)?If(c):_c(s.serializer,c)}(n,e)}function dE(n,e,t){return n instanceof us?Af(n,e):n instanceof hs?Cf(n,e):t}function wf(n,e){return n instanceof vi?function(r){return Ra(r)||function(i){return!!i&&"doubleValue"in i}(r)}(e)?e:{integerValue:0}:null}class ls extends ro{}class us extends ro{constructor(e){super(),this.elements=e}}function Af(n,e){const t=Rf(e);for(const r of n.elements)t.some(s=>It(s,r))||t.push(r);return{arrayValue:{values:t}}}class hs extends ro{constructor(e){super(),this.elements=e}}function Cf(n,e){let t=Rf(e);for(const r of n.elements)t=t.filter(s=>!It(s,r));return{arrayValue:{values:t}}}class vi extends ro{constructor(e,t){super(),this.serializer=e,this.Ae=t}}function eh(n){return _e(n.integerValue||n.doubleValue)}function Rf(n){return dc(n)&&n.arrayValue.values?n.arrayValue.values.slice():[]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fE{constructor(e,t){this.field=e,this.transform=t}}function pE(n,e){return n.field.isEqual(e.field)&&function(r,s){return r instanceof us&&s instanceof us||r instanceof hs&&s instanceof hs?Qn(r.elements,s.elements,It):r instanceof vi&&s instanceof vi?It(r.Ae,s.Ae):r instanceof ls&&s instanceof ls}(n.transform,e.transform)}class _E{constructor(e,t){this.version=e,this.transformResults=t}}class je{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new je}static exists(e){return new je(void 0,e)}static updateTime(e){return new je(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function ai(n,e){return n.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(n.updateTime):n.exists===void 0||n.exists===e.isFoundDocument()}class so{}function Sf(n,e){if(!n.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return n.isNoDocument()?new io(n.key,je.none()):new gs(n.key,n.data,je.none());{const t=n.data,r=He.empty();let s=new Ie(Pe.comparator);for(let i of e.fields)if(!s.has(i)){let a=t.field(i);a===null&&i.length>1&&(i=i.popLast(),a=t.field(i)),a===null?r.delete(i):r.set(i,a),s=s.add(i)}return new an(n.key,r,new Ze(s.toArray()),je.none())}}function mE(n,e,t){n instanceof gs?function(s,i,a){const c=s.value.clone(),l=nh(s.fieldTransforms,i,a.transformResults);c.setAll(l),i.convertToFoundDocument(a.version,c).setHasCommittedMutations()}(n,e,t):n instanceof an?function(s,i,a){if(!ai(s.precondition,i))return void i.convertToUnknownDocument(a.version);const c=nh(s.fieldTransforms,i,a.transformResults),l=i.data;l.setAll(bf(s)),l.setAll(c),i.convertToFoundDocument(a.version,l).setHasCommittedMutations()}(n,e,t):function(s,i,a){i.convertToNoDocument(a.version).setHasCommittedMutations()}(0,e,t)}function Gr(n,e,t,r){return n instanceof gs?function(i,a,c,l){if(!ai(i.precondition,a))return c;const h=i.value.clone(),f=rh(i.fieldTransforms,l,a);return h.setAll(f),a.convertToFoundDocument(a.version,h).setHasLocalMutations(),null}(n,e,t,r):n instanceof an?function(i,a,c,l){if(!ai(i.precondition,a))return c;const h=rh(i.fieldTransforms,l,a),f=a.data;return f.setAll(bf(i)),f.setAll(h),a.convertToFoundDocument(a.version,f).setHasLocalMutations(),c===null?null:c.unionWith(i.fieldMask.fields).unionWith(i.fieldTransforms.map(p=>p.field))}(n,e,t,r):function(i,a,c){return ai(i.precondition,a)?(a.convertToNoDocument(a.version).setHasLocalMutations(),null):c}(n,e,t)}function gE(n,e){let t=null;for(const r of n.fieldTransforms){const s=e.data.field(r.field),i=wf(r.transform,s||null);i!=null&&(t===null&&(t=He.empty()),t.set(r.field,i))}return t||null}function th(n,e){return n.type===e.type&&!!n.key.isEqual(e.key)&&!!n.precondition.isEqual(e.precondition)&&!!function(r,s){return r===void 0&&s===void 0||!(!r||!s)&&Qn(r,s,(i,a)=>pE(i,a))}(n.fieldTransforms,e.fieldTransforms)&&(n.type===0?n.value.isEqual(e.value):n.type!==1||n.data.isEqual(e.data)&&n.fieldMask.isEqual(e.fieldMask))}class gs extends so{constructor(e,t,r,s=[]){super(),this.key=e,this.value=t,this.precondition=r,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}}class an extends so{constructor(e,t,r,s,i=[]){super(),this.key=e,this.data=t,this.fieldMask=r,this.precondition=s,this.fieldTransforms=i,this.type=1}getFieldMask(){return this.fieldMask}}function bf(n){const e=new Map;return n.fieldMask.fields.forEach(t=>{if(!t.isEmpty()){const r=n.data.field(t);e.set(t,r)}}),e}function nh(n,e,t){const r=new Map;Z(n.length===t.length,32656,{Re:t.length,Ve:n.length});for(let s=0;s<t.length;s++){const i=n[s],a=i.transform,c=e.data.field(i.field);r.set(i.field,dE(a,c,t[s]))}return r}function rh(n,e,t){const r=new Map;for(const s of n){const i=s.transform,a=t.data.field(s.field);r.set(s.field,hE(i,a,e))}return r}class io extends so{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class yE extends so{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class EE{constructor(e,t,r,s){this.batchId=e,this.localWriteTime=t,this.baseMutations=r,this.mutations=s}applyToRemoteDocument(e,t){const r=t.mutationResults;for(let s=0;s<this.mutations.length;s++){const i=this.mutations[s];i.key.isEqual(e.key)&&mE(i,e,r[s])}}applyToLocalView(e,t){for(const r of this.baseMutations)r.key.isEqual(e.key)&&(t=Gr(r,e,t,this.localWriteTime));for(const r of this.mutations)r.key.isEqual(e.key)&&(t=Gr(r,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){const r=vf();return this.mutations.forEach(s=>{const i=e.get(s.key),a=i.overlayedDocument;let c=this.applyToLocalView(a,i.mutatedFields);c=t.has(s.key)?null:c;const l=Sf(a,c);l!==null&&r.set(s.key,l),a.isValidDocument()||a.convertToNoDocument($.min())}),r}keys(){return this.mutations.reduce((e,t)=>e.add(t.key),K())}isEqual(e){return this.batchId===e.batchId&&Qn(this.mutations,e.mutations,(t,r)=>th(t,r))&&Qn(this.baseMutations,e.baseMutations,(t,r)=>th(t,r))}}class mc{constructor(e,t,r,s){this.batch=e,this.commitVersion=t,this.mutationResults=r,this.docVersions=s}static from(e,t,r){Z(e.mutations.length===r.length,58842,{me:e.mutations.length,fe:r.length});let s=function(){return oE}();const i=e.mutations;for(let a=0;a<i.length;a++)s=s.insert(i[a].key,r[a].version);return new mc(e,t,r,s)}}/**
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
 */class TE{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
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
 */class vE{constructor(e,t,r){this.alias=e,this.aggregateType=t,this.fieldPath=r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class IE{constructor(e,t){this.count=e,this.unchangedNames=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ge,Q;function wE(n){switch(n){case b.OK:return U(64938);case b.CANCELLED:case b.UNKNOWN:case b.DEADLINE_EXCEEDED:case b.RESOURCE_EXHAUSTED:case b.INTERNAL:case b.UNAVAILABLE:case b.UNAUTHENTICATED:return!1;case b.INVALID_ARGUMENT:case b.NOT_FOUND:case b.ALREADY_EXISTS:case b.PERMISSION_DENIED:case b.FAILED_PRECONDITION:case b.ABORTED:case b.OUT_OF_RANGE:case b.UNIMPLEMENTED:case b.DATA_LOSS:return!0;default:return U(15467,{code:n})}}function Pf(n){if(n===void 0)return Vt("GRPC error has no .code"),b.UNKNOWN;switch(n){case ge.OK:return b.OK;case ge.CANCELLED:return b.CANCELLED;case ge.UNKNOWN:return b.UNKNOWN;case ge.DEADLINE_EXCEEDED:return b.DEADLINE_EXCEEDED;case ge.RESOURCE_EXHAUSTED:return b.RESOURCE_EXHAUSTED;case ge.INTERNAL:return b.INTERNAL;case ge.UNAVAILABLE:return b.UNAVAILABLE;case ge.UNAUTHENTICATED:return b.UNAUTHENTICATED;case ge.INVALID_ARGUMENT:return b.INVALID_ARGUMENT;case ge.NOT_FOUND:return b.NOT_FOUND;case ge.ALREADY_EXISTS:return b.ALREADY_EXISTS;case ge.PERMISSION_DENIED:return b.PERMISSION_DENIED;case ge.FAILED_PRECONDITION:return b.FAILED_PRECONDITION;case ge.ABORTED:return b.ABORTED;case ge.OUT_OF_RANGE:return b.OUT_OF_RANGE;case ge.UNIMPLEMENTED:return b.UNIMPLEMENTED;case ge.DATA_LOSS:return b.DATA_LOSS;default:return U(39323,{code:n})}}(Q=ge||(ge={}))[Q.OK=0]="OK",Q[Q.CANCELLED=1]="CANCELLED",Q[Q.UNKNOWN=2]="UNKNOWN",Q[Q.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",Q[Q.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",Q[Q.NOT_FOUND=5]="NOT_FOUND",Q[Q.ALREADY_EXISTS=6]="ALREADY_EXISTS",Q[Q.PERMISSION_DENIED=7]="PERMISSION_DENIED",Q[Q.UNAUTHENTICATED=16]="UNAUTHENTICATED",Q[Q.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",Q[Q.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",Q[Q.ABORTED=10]="ABORTED",Q[Q.OUT_OF_RANGE=11]="OUT_OF_RANGE",Q[Q.UNIMPLEMENTED=12]="UNIMPLEMENTED",Q[Q.INTERNAL=13]="INTERNAL",Q[Q.UNAVAILABLE=14]="UNAVAILABLE",Q[Q.DATA_LOSS=15]="DATA_LOSS";/**
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
 */function AE(){return new TextEncoder}/**
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
 */const CE=new Kt([4294967295,4294967295],0);function sh(n){const e=AE().encode(n),t=new $d;return t.update(e),new Uint8Array(t.digest())}function ih(n){const e=new DataView(n.buffer),t=e.getUint32(0,!0),r=e.getUint32(4,!0),s=e.getUint32(8,!0),i=e.getUint32(12,!0);return[new Kt([t,r],0),new Kt([s,i],0)]}class gc{constructor(e,t,r){if(this.bitmap=e,this.padding=t,this.hashCount=r,t<0||t>=8)throw new Br(`Invalid padding: ${t}`);if(r<0)throw new Br(`Invalid hash count: ${r}`);if(e.length>0&&this.hashCount===0)throw new Br(`Invalid hash count: ${r}`);if(e.length===0&&t!==0)throw new Br(`Invalid padding when bitmap length is 0: ${t}`);this.ge=8*e.length-t,this.pe=Kt.fromNumber(this.ge)}ye(e,t,r){let s=e.add(t.multiply(Kt.fromNumber(r)));return s.compare(CE)===1&&(s=new Kt([s.getBits(0),s.getBits(1)],0)),s.modulo(this.pe).toNumber()}we(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(this.ge===0)return!1;const t=sh(e),[r,s]=ih(t);for(let i=0;i<this.hashCount;i++){const a=this.ye(r,s,i);if(!this.we(a))return!1}return!0}static create(e,t,r){const s=e%8==0?0:8-e%8,i=new Uint8Array(Math.ceil(e/8)),a=new gc(i,s,t);return r.forEach(c=>a.insert(c)),a}insert(e){if(this.ge===0)return;const t=sh(e),[r,s]=ih(t);for(let i=0;i<this.hashCount;i++){const a=this.ye(r,s,i);this.Se(a)}}Se(e){const t=Math.floor(e/8),r=e%8;this.bitmap[t]|=1<<r}}class Br extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class oo{constructor(e,t,r,s,i){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=r,this.documentUpdates=s,this.resolvedLimboDocuments=i}static createSynthesizedRemoteEventForCurrentChange(e,t,r){const s=new Map;return s.set(e,ys.createSynthesizedTargetChangeForCurrentChange(e,t,r)),new oo($.min(),s,new ve(H),Mt(),K())}}class ys{constructor(e,t,r,s,i){this.resumeToken=e,this.current=t,this.addedDocuments=r,this.modifiedDocuments=s,this.removedDocuments=i}static createSynthesizedTargetChangeForCurrentChange(e,t,r){return new ys(r,t,K(),K(),K())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ci{constructor(e,t,r,s){this.be=e,this.removedTargetIds=t,this.key=r,this.De=s}}class Nf{constructor(e,t){this.targetId=e,this.Ce=t}}class kf{constructor(e,t,r=ke.EMPTY_BYTE_STRING,s=null){this.state=e,this.targetIds=t,this.resumeToken=r,this.cause=s}}class oh{constructor(){this.ve=0,this.Fe=ah(),this.Me=ke.EMPTY_BYTE_STRING,this.xe=!1,this.Oe=!0}get current(){return this.xe}get resumeToken(){return this.Me}get Ne(){return this.ve!==0}get Be(){return this.Oe}Le(e){e.approximateByteSize()>0&&(this.Oe=!0,this.Me=e)}ke(){let e=K(),t=K(),r=K();return this.Fe.forEach((s,i)=>{switch(i){case 0:e=e.add(s);break;case 2:t=t.add(s);break;case 1:r=r.add(s);break;default:U(38017,{changeType:i})}}),new ys(this.Me,this.xe,e,t,r)}qe(){this.Oe=!1,this.Fe=ah()}Qe(e,t){this.Oe=!0,this.Fe=this.Fe.insert(e,t)}$e(e){this.Oe=!0,this.Fe=this.Fe.remove(e)}Ue(){this.ve+=1}Ke(){this.ve-=1,Z(this.ve>=0,3241,{ve:this.ve})}We(){this.Oe=!0,this.xe=!0}}class RE{constructor(e){this.Ge=e,this.ze=new Map,this.je=Mt(),this.Je=Xs(),this.He=Xs(),this.Ye=new ve(H)}Ze(e){for(const t of e.be)e.De&&e.De.isFoundDocument()?this.Xe(t,e.De):this.et(t,e.key,e.De);for(const t of e.removedTargetIds)this.et(t,e.key,e.De)}tt(e){this.forEachTarget(e,t=>{const r=this.nt(t);switch(e.state){case 0:this.rt(t)&&r.Le(e.resumeToken);break;case 1:r.Ke(),r.Ne||r.qe(),r.Le(e.resumeToken);break;case 2:r.Ke(),r.Ne||this.removeTarget(t);break;case 3:this.rt(t)&&(r.We(),r.Le(e.resumeToken));break;case 4:this.rt(t)&&(this.it(t),r.Le(e.resumeToken));break;default:U(56790,{state:e.state})}})}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.ze.forEach((r,s)=>{this.rt(s)&&t(s)})}st(e){const t=e.targetId,r=e.Ce.count,s=this.ot(t);if(s){const i=s.target;if(ba(i))if(r===0){const a=new L(i.path);this.et(t,a,Fe.newNoDocument(a,$.min()))}else Z(r===1,20013,{expectedCount:r});else{const a=this._t(t);if(a!==r){const c=this.ut(e),l=c?this.ct(c,e,a):1;if(l!==0){this.it(t);const h=l===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Ye=this.Ye.insert(t,h)}}}}}ut(e){const t=e.Ce.unchangedNames;if(!t||!t.bits)return null;const{bits:{bitmap:r="",padding:s=0},hashCount:i=0}=t;let a,c;try{a=en(r).toUint8Array()}catch(l){if(l instanceof ef)return Kn("Decoding the base64 bloom filter in existence filter failed ("+l.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw l}try{c=new gc(a,s,i)}catch(l){return Kn(l instanceof Br?"BloomFilter error: ":"Applying bloom filter failed: ",l),null}return c.ge===0?null:c}ct(e,t,r){return t.Ce.count===r-this.Pt(e,t.targetId)?0:2}Pt(e,t){const r=this.Ge.getRemoteKeysForTarget(t);let s=0;return r.forEach(i=>{const a=this.Ge.ht(),c=`projects/${a.projectId}/databases/${a.database}/documents/${i.path.canonicalString()}`;e.mightContain(c)||(this.et(t,i,null),s++)}),s}Tt(e){const t=new Map;this.ze.forEach((i,a)=>{const c=this.ot(a);if(c){if(i.current&&ba(c.target)){const l=new L(c.target.path);this.It(l).has(a)||this.Et(a,l)||this.et(a,l,Fe.newNoDocument(l,e))}i.Be&&(t.set(a,i.ke()),i.qe())}});let r=K();this.He.forEach((i,a)=>{let c=!0;a.forEachWhile(l=>{const h=this.ot(l);return!h||h.purpose==="TargetPurposeLimboResolution"||(c=!1,!1)}),c&&(r=r.add(i))}),this.je.forEach((i,a)=>a.setReadTime(e));const s=new oo(e,t,this.Ye,this.je,r);return this.je=Mt(),this.Je=Xs(),this.He=Xs(),this.Ye=new ve(H),s}Xe(e,t){if(!this.rt(e))return;const r=this.Et(e,t.key)?2:0;this.nt(e).Qe(t.key,r),this.je=this.je.insert(t.key,t),this.Je=this.Je.insert(t.key,this.It(t.key).add(e)),this.He=this.He.insert(t.key,this.dt(t.key).add(e))}et(e,t,r){if(!this.rt(e))return;const s=this.nt(e);this.Et(e,t)?s.Qe(t,1):s.$e(t),this.He=this.He.insert(t,this.dt(t).delete(e)),this.He=this.He.insert(t,this.dt(t).add(e)),r&&(this.je=this.je.insert(t,r))}removeTarget(e){this.ze.delete(e)}_t(e){const t=this.nt(e).ke();return this.Ge.getRemoteKeysForTarget(e).size+t.addedDocuments.size-t.removedDocuments.size}Ue(e){this.nt(e).Ue()}nt(e){let t=this.ze.get(e);return t||(t=new oh,this.ze.set(e,t)),t}dt(e){let t=this.He.get(e);return t||(t=new Ie(H),this.He=this.He.insert(e,t)),t}It(e){let t=this.Je.get(e);return t||(t=new Ie(H),this.Je=this.Je.insert(e,t)),t}rt(e){const t=this.ot(e)!==null;return t||M("WatchChangeAggregator","Detected inactive target",e),t}ot(e){const t=this.ze.get(e);return t&&t.Ne?null:this.Ge.At(e)}it(e){this.ze.set(e,new oh),this.Ge.getRemoteKeysForTarget(e).forEach(t=>{this.et(e,t,null)})}Et(e,t){return this.Ge.getRemoteKeysForTarget(e).has(t)}}function Xs(){return new ve(L.comparator)}function ah(){return new ve(L.comparator)}const SE={asc:"ASCENDING",desc:"DESCENDING"},bE={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},PE={and:"AND",or:"OR"};class NE{constructor(e,t){this.databaseId=e,this.useProto3Json=t}}function Na(n,e){return n.useProto3Json||Ji(e)?e:{value:e}}function Ii(n,e){return n.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function Df(n,e){return n.useProto3Json?e.toBase64():e.toUint8Array()}function kE(n,e){return Ii(n,e.toTimestamp())}function yt(n){return Z(!!n,49232),$.fromTimestamp(function(t){const r=Zt(t);return new le(r.seconds,r.nanos)}(n))}function yc(n,e){return ka(n,e).canonicalString()}function ka(n,e){const t=function(s){return new oe(["projects",s.projectId,"databases",s.database])}(n).child("documents");return e===void 0?t:t.child(e)}function Of(n){const e=oe.fromString(n);return Z(Uf(e),10190,{key:e.toString()}),e}function Da(n,e){return yc(n.databaseId,e.path)}function ea(n,e){const t=Of(e);if(t.get(1)!==n.databaseId.projectId)throw new V(b.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+t.get(1)+" vs "+n.databaseId.projectId);if(t.get(3)!==n.databaseId.database)throw new V(b.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+t.get(3)+" vs "+n.databaseId.database);return new L(Mf(t))}function Vf(n,e){return yc(n.databaseId,e)}function DE(n){const e=Of(n);return e.length===4?oe.emptyPath():Mf(e)}function Oa(n){return new oe(["projects",n.databaseId.projectId,"databases",n.databaseId.database]).canonicalString()}function Mf(n){return Z(n.length>4&&n.get(4)==="documents",29091,{key:n.toString()}),n.popFirst(5)}function ch(n,e,t){return{name:Da(n,e),fields:t.value.mapValue.fields}}function OE(n,e){let t;if("targetChange"in e){e.targetChange;const r=function(h){return h==="NO_CHANGE"?0:h==="ADD"?1:h==="REMOVE"?2:h==="CURRENT"?3:h==="RESET"?4:U(39313,{state:h})}(e.targetChange.targetChangeType||"NO_CHANGE"),s=e.targetChange.targetIds||[],i=function(h,f){return h.useProto3Json?(Z(f===void 0||typeof f=="string",58123),ke.fromBase64String(f||"")):(Z(f===void 0||f instanceof Buffer||f instanceof Uint8Array,16193),ke.fromUint8Array(f||new Uint8Array))}(n,e.targetChange.resumeToken),a=e.targetChange.cause,c=a&&function(h){const f=h.code===void 0?b.UNKNOWN:Pf(h.code);return new V(f,h.message||"")}(a);t=new kf(r,s,i,c||null)}else if("documentChange"in e){e.documentChange;const r=e.documentChange;r.document,r.document.name,r.document.updateTime;const s=ea(n,r.document.name),i=yt(r.document.updateTime),a=r.document.createTime?yt(r.document.createTime):$.min(),c=new He({mapValue:{fields:r.document.fields}}),l=Fe.newFoundDocument(s,i,a,c),h=r.targetIds||[],f=r.removedTargetIds||[];t=new ci(h,f,l.key,l)}else if("documentDelete"in e){e.documentDelete;const r=e.documentDelete;r.document;const s=ea(n,r.document),i=r.readTime?yt(r.readTime):$.min(),a=Fe.newNoDocument(s,i),c=r.removedTargetIds||[];t=new ci([],c,a.key,a)}else if("documentRemove"in e){e.documentRemove;const r=e.documentRemove;r.document;const s=ea(n,r.document),i=r.removedTargetIds||[];t=new ci([],i,s,null)}else{if(!("filter"in e))return U(11601,{Rt:e});{e.filter;const r=e.filter;r.targetId;const{count:s=0,unchangedNames:i}=r,a=new IE(s,i),c=r.targetId;t=new Nf(c,a)}}return t}function VE(n,e){let t;if(e instanceof gs)t={update:ch(n,e.key,e.value)};else if(e instanceof io)t={delete:Da(n,e.key)};else if(e instanceof an)t={update:ch(n,e.key,e.data),updateMask:jE(e.fieldMask)};else{if(!(e instanceof yE))return U(16599,{Vt:e.type});t={verify:Da(n,e.key)}}return e.fieldTransforms.length>0&&(t.updateTransforms=e.fieldTransforms.map(r=>function(i,a){const c=a.transform;if(c instanceof ls)return{fieldPath:a.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(c instanceof us)return{fieldPath:a.field.canonicalString(),appendMissingElements:{values:c.elements}};if(c instanceof hs)return{fieldPath:a.field.canonicalString(),removeAllFromArray:{values:c.elements}};if(c instanceof vi)return{fieldPath:a.field.canonicalString(),increment:c.Ae};throw U(20930,{transform:a.transform})}(0,r))),e.precondition.isNone||(t.currentDocument=function(s,i){return i.updateTime!==void 0?{updateTime:kE(s,i.updateTime)}:i.exists!==void 0?{exists:i.exists}:U(27497)}(n,e.precondition)),t}function ME(n,e){return n&&n.length>0?(Z(e!==void 0,14353),n.map(t=>function(s,i){let a=s.updateTime?yt(s.updateTime):yt(i);return a.isEqual($.min())&&(a=yt(i)),new _E(a,s.transformResults||[])}(t,e))):[]}function LE(n,e){return{documents:[Vf(n,e.path)]}}function Lf(n,e){const t={structuredQuery:{}},r=e.path;let s;e.collectionGroup!==null?(s=r,t.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(s=r.popLast(),t.structuredQuery.from=[{collectionId:r.lastSegment()}]),t.parent=Vf(n,s);const i=function(h){if(h.length!==0)return Ff(ct.create(h,"and"))}(e.filters);i&&(t.structuredQuery.where=i);const a=function(h){if(h.length!==0)return h.map(f=>function(m){return{field:Wt(m.field),direction:BE(m.dir)}}(f))}(e.orderBy);a&&(t.structuredQuery.orderBy=a);const c=Na(n,e.limit);return c!==null&&(t.structuredQuery.limit=c),e.startAt&&(t.structuredQuery.startAt=function(h){return{before:h.inclusive,values:h.position}}(e.startAt)),e.endAt&&(t.structuredQuery.endAt=function(h){return{before:!h.inclusive,values:h.position}}(e.endAt)),{ft:t,parent:s}}function xE(n,e,t,r){const{ft:s,parent:i}=Lf(n,e),a={},c=[];let l=0;return t.forEach(h=>{const f="aggregate_"+l++;a[f]=h.alias,h.aggregateType==="count"?c.push({alias:f,count:{}}):h.aggregateType==="avg"?c.push({alias:f,avg:{field:Wt(h.fieldPath)}}):h.aggregateType==="sum"&&c.push({alias:f,sum:{field:Wt(h.fieldPath)}})}),{request:{structuredAggregationQuery:{aggregations:c,structuredQuery:s.structuredQuery},parent:s.parent},gt:a,parent:i}}function FE(n){let e=DE(n.parent);const t=n.structuredQuery,r=t.from?t.from.length:0;let s=null;if(r>0){Z(r===1,65062);const f=t.from[0];f.allDescendants?s=f.collectionId:e=e.child(f.collectionId)}let i=[];t.where&&(i=function(p){const m=xf(p);return m instanceof ct&&hf(m)?m.getFilters():[m]}(t.where));let a=[];t.orderBy&&(a=function(p){return p.map(m=>function(R){return new cs(Un(R.field),function(P){switch(P){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(R.direction))}(m))}(t.orderBy));let c=null;t.limit&&(c=function(p){let m;return m=typeof p=="object"?p.value:p,Ji(m)?null:m}(t.limit));let l=null;t.startAt&&(l=function(p){const m=!!p.before,v=p.values||[];return new Ei(v,m)}(t.startAt));let h=null;return t.endAt&&(h=function(p){const m=!p.before,v=p.values||[];return new Ei(v,m)}(t.endAt)),tE(e,s,a,i,c,"F",l,h)}function UE(n,e){const t=function(s){switch(s){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return U(28987,{purpose:s})}}(e.purpose);return t==null?null:{"goog-listen-tags":t}}function xf(n){return n.unaryFilter!==void 0?function(t){switch(t.unaryFilter.op){case"IS_NAN":const r=Un(t.unaryFilter.field);return Ee.create(r,"==",{doubleValue:NaN});case"IS_NULL":const s=Un(t.unaryFilter.field);return Ee.create(s,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const i=Un(t.unaryFilter.field);return Ee.create(i,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const a=Un(t.unaryFilter.field);return Ee.create(a,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return U(61313);default:return U(60726)}}(n):n.fieldFilter!==void 0?function(t){return Ee.create(Un(t.fieldFilter.field),function(s){switch(s){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return U(58110);default:return U(50506)}}(t.fieldFilter.op),t.fieldFilter.value)}(n):n.compositeFilter!==void 0?function(t){return ct.create(t.compositeFilter.filters.map(r=>xf(r)),function(s){switch(s){case"AND":return"and";case"OR":return"or";default:return U(1026)}}(t.compositeFilter.op))}(n):U(30097,{filter:n})}function BE(n){return SE[n]}function qE(n){return bE[n]}function $E(n){return PE[n]}function Wt(n){return{fieldPath:n.canonicalString()}}function Un(n){return Pe.fromServerFormat(n.fieldPath)}function Ff(n){return n instanceof Ee?function(t){if(t.op==="=="){if(Qu(t.value))return{unaryFilter:{field:Wt(t.field),op:"IS_NAN"}};if(Ku(t.value))return{unaryFilter:{field:Wt(t.field),op:"IS_NULL"}}}else if(t.op==="!="){if(Qu(t.value))return{unaryFilter:{field:Wt(t.field),op:"IS_NOT_NAN"}};if(Ku(t.value))return{unaryFilter:{field:Wt(t.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:Wt(t.field),op:qE(t.op),value:t.value}}}(n):n instanceof ct?function(t){const r=t.getFilters().map(s=>Ff(s));return r.length===1?r[0]:{compositeFilter:{op:$E(t.op),filters:r}}}(n):U(54877,{filter:n})}function jE(n){const e=[];return n.fields.forEach(t=>e.push(t.canonicalString())),{fieldPaths:e}}function Uf(n){return n.length>=4&&n.get(0)==="projects"&&n.get(2)==="databases"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ht{constructor(e,t,r,s,i=$.min(),a=$.min(),c=ke.EMPTY_BYTE_STRING,l=null){this.target=e,this.targetId=t,this.purpose=r,this.sequenceNumber=s,this.snapshotVersion=i,this.lastLimboFreeSnapshotVersion=a,this.resumeToken=c,this.expectedCount=l}withSequenceNumber(e){return new Ht(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new Ht(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new Ht(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new Ht(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class WE{constructor(e){this.yt=e}}function zE(n){const e=FE({parent:n.parent,structuredQuery:n.structuredQuery});return n.limitType==="LAST"?Ti(e,e.limit,"L"):e}/**
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
 */class HE{constructor(){this.Cn=new GE}addToCollectionParentIndex(e,t){return this.Cn.add(t),N.resolve()}getCollectionParents(e,t){return N.resolve(this.Cn.getEntries(t))}addFieldIndex(e,t){return N.resolve()}deleteFieldIndex(e,t){return N.resolve()}deleteAllFieldIndexes(e){return N.resolve()}createTargetIndexes(e,t){return N.resolve()}getDocumentsMatchingTarget(e,t){return N.resolve(null)}getIndexType(e,t){return N.resolve(0)}getFieldIndexes(e,t){return N.resolve([])}getNextCollectionGroupToUpdate(e){return N.resolve(null)}getMinOffset(e,t){return N.resolve(Jt.min())}getMinOffsetFromCollectionGroup(e,t){return N.resolve(Jt.min())}updateCollectionGroup(e,t,r){return N.resolve()}updateIndexEntries(e,t){return N.resolve()}}class GE{constructor(){this.index={}}add(e){const t=e.lastSegment(),r=e.popLast(),s=this.index[t]||new Ie(oe.comparator),i=!s.has(r);return this.index[t]=s.add(r),i}has(e){const t=e.lastSegment(),r=e.popLast(),s=this.index[t];return s&&s.has(r)}getEntries(e){return(this.index[e]||new Ie(oe.comparator)).toArray()}}/**
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
 */const lh={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},Bf=41943040;class ze{static withCacheSize(e){return new ze(e,ze.DEFAULT_COLLECTION_PERCENTILE,ze.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,t,r){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ze.DEFAULT_COLLECTION_PERCENTILE=10,ze.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,ze.DEFAULT=new ze(Bf,ze.DEFAULT_COLLECTION_PERCENTILE,ze.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),ze.DISABLED=new ze(-1,0,0);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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
 */const uh="LruGarbageCollector",KE=1048576;function hh([n,e],[t,r]){const s=H(n,t);return s===0?H(e,r):s}class QE{constructor(e){this.Ir=e,this.buffer=new Ie(hh),this.Er=0}dr(){return++this.Er}Ar(e){const t=[e,this.dr()];if(this.buffer.size<this.Ir)this.buffer=this.buffer.add(t);else{const r=this.buffer.last();hh(t,r)<0&&(this.buffer=this.buffer.delete(r).add(t))}}get maxValue(){return this.buffer.last()[0]}}class YE{constructor(e,t,r){this.garbageCollector=e,this.asyncQueue=t,this.localStore=r,this.Rr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.Vr(6e4)}stop(){this.Rr&&(this.Rr.cancel(),this.Rr=null)}get started(){return this.Rr!==null}Vr(e){M(uh,`Garbage collection scheduled in ${e}ms`),this.Rr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,async()=>{this.Rr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(t){cr(t)?M(uh,"Ignoring IndexedDB error during garbage collection: ",t):await ar(t)}await this.Vr(3e5)})}}class XE{constructor(e,t){this.mr=e,this.params=t}calculateTargetCount(e,t){return this.mr.gr(e).next(r=>Math.floor(t/100*r))}nthSequenceNumber(e,t){if(t===0)return N.resolve(Xi.ce);const r=new QE(t);return this.mr.forEachTarget(e,s=>r.Ar(s.sequenceNumber)).next(()=>this.mr.pr(e,s=>r.Ar(s))).next(()=>r.maxValue)}removeTargets(e,t,r){return this.mr.removeTargets(e,t,r)}removeOrphanedDocuments(e,t){return this.mr.removeOrphanedDocuments(e,t)}collect(e,t){return this.params.cacheSizeCollectionThreshold===-1?(M("LruGarbageCollector","Garbage collection skipped; disabled"),N.resolve(lh)):this.getCacheSize(e).next(r=>r<this.params.cacheSizeCollectionThreshold?(M("LruGarbageCollector",`Garbage collection skipped; Cache size ${r} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),lh):this.yr(e,t))}getCacheSize(e){return this.mr.getCacheSize(e)}yr(e,t){let r,s,i,a,c,l,h;const f=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next(p=>(p>this.params.maximumSequenceNumbersToCollect?(M("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${p}`),s=this.params.maximumSequenceNumbersToCollect):s=p,a=Date.now(),this.nthSequenceNumber(e,s))).next(p=>(r=p,c=Date.now(),this.removeTargets(e,r,t))).next(p=>(i=p,l=Date.now(),this.removeOrphanedDocuments(e,r))).next(p=>(h=Date.now(),xn()<=W.DEBUG&&M("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${a-f}ms
	Determined least recently used ${s} in `+(c-a)+`ms
	Removed ${i} targets in `+(l-c)+`ms
	Removed ${p} documents in `+(h-l)+`ms
Total Duration: ${h-f}ms`),N.resolve({didRun:!0,sequenceNumbersCollected:s,targetsRemoved:i,documentsRemoved:p})))}}function JE(n,e){return new XE(n,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ZE{constructor(){this.changes=new Sn(e=>e.toString(),(e,t)=>e.isEqual(t)),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,Fe.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();const r=this.changes.get(t);return r!==void 0?N.resolve(r):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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
 */class eT{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tT{constructor(e,t,r,s){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=r,this.indexManager=s}getDocument(e,t){let r=null;return this.documentOverlayCache.getOverlay(e,t).next(s=>(r=s,this.remoteDocumentCache.getEntry(e,t))).next(s=>(r!==null&&Gr(r.mutation,s,Ze.empty(),le.now()),s))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next(r=>this.getLocalViewOfDocuments(e,r,K()).next(()=>r))}getLocalViewOfDocuments(e,t,r=K()){const s=pn();return this.populateOverlays(e,s,t).next(()=>this.computeViews(e,t,s,r).next(i=>{let a=Ur();return i.forEach((c,l)=>{a=a.insert(c,l.overlayedDocument)}),a}))}getOverlayedDocuments(e,t){const r=pn();return this.populateOverlays(e,r,t).next(()=>this.computeViews(e,t,r,K()))}populateOverlays(e,t,r){const s=[];return r.forEach(i=>{t.has(i)||s.push(i)}),this.documentOverlayCache.getOverlays(e,s).next(i=>{i.forEach((a,c)=>{t.set(a,c)})})}computeViews(e,t,r,s){let i=Mt();const a=Hr(),c=function(){return Hr()}();return t.forEach((l,h)=>{const f=r.get(h.key);s.has(h.key)&&(f===void 0||f.mutation instanceof an)?i=i.insert(h.key,h):f!==void 0?(a.set(h.key,f.mutation.getFieldMask()),Gr(f.mutation,h,f.mutation.getFieldMask(),le.now())):a.set(h.key,Ze.empty())}),this.recalculateAndSaveOverlays(e,i).next(l=>(l.forEach((h,f)=>a.set(h,f)),t.forEach((h,f)=>c.set(h,new eT(f,a.get(h)??null))),c))}recalculateAndSaveOverlays(e,t){const r=Hr();let s=new ve((a,c)=>a-c),i=K();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next(a=>{for(const c of a)c.keys().forEach(l=>{const h=t.get(l);if(h===null)return;let f=r.get(l)||Ze.empty();f=c.applyToLocalView(h,f),r.set(l,f);const p=(s.get(c.batchId)||K()).add(l);s=s.insert(c.batchId,p)})}).next(()=>{const a=[],c=s.getReverseIterator();for(;c.hasNext();){const l=c.getNext(),h=l.key,f=l.value,p=vf();f.forEach(m=>{if(!i.has(m)){const v=Sf(t.get(m),r.get(m));v!==null&&p.set(m,v),i=i.add(m)}}),a.push(this.documentOverlayCache.saveOverlays(e,h,p))}return N.waitFor(a)}).next(()=>r)}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next(r=>this.recalculateAndSaveOverlays(e,r))}getDocumentsMatchingQuery(e,t,r,s){return function(a){return L.isDocumentKey(a.path)&&a.collectionGroup===null&&a.filters.length===0}(t)?this.getDocumentsMatchingDocumentQuery(e,t.path):_f(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,r,s):this.getDocumentsMatchingCollectionQuery(e,t,r,s)}getNextDocuments(e,t,r,s){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,r,s).next(i=>{const a=s-i.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,r.largestBatchId,s-i.size):N.resolve(pn());let c=ss,l=i;return a.next(h=>N.forEach(h,(f,p)=>(c<p.largestBatchId&&(c=p.largestBatchId),i.get(f)?N.resolve():this.remoteDocumentCache.getEntry(e,f).next(m=>{l=l.insert(f,m)}))).next(()=>this.populateOverlays(e,h,i)).next(()=>this.computeViews(e,l,h,K())).next(f=>({batchId:c,changes:Tf(f)})))})}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new L(t)).next(r=>{let s=Ur();return r.isFoundDocument()&&(s=s.insert(r.key,r)),s})}getDocumentsMatchingCollectionGroupQuery(e,t,r,s){const i=t.collectionGroup;let a=Ur();return this.indexManager.getCollectionParents(e,i).next(c=>N.forEach(c,l=>{const h=function(p,m){return new lr(m,null,p.explicitOrderBy.slice(),p.filters.slice(),p.limit,p.limitType,p.startAt,p.endAt)}(t,l.child(i));return this.getDocumentsMatchingCollectionQuery(e,h,r,s).next(f=>{f.forEach((p,m)=>{a=a.insert(p,m)})})}).next(()=>a))}getDocumentsMatchingCollectionQuery(e,t,r,s){let i;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,r.largestBatchId).next(a=>(i=a,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,r,i,s))).next(a=>{i.forEach((l,h)=>{const f=h.getKey();a.get(f)===null&&(a=a.insert(f,Fe.newInvalidDocument(f)))});let c=Ur();return a.forEach((l,h)=>{const f=i.get(l);f!==void 0&&Gr(f.mutation,h,Ze.empty(),le.now()),no(t,h)&&(c=c.insert(l,h))}),c})}}/**
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
 */class nT{constructor(e){this.serializer=e,this.Lr=new Map,this.kr=new Map}getBundleMetadata(e,t){return N.resolve(this.Lr.get(t))}saveBundleMetadata(e,t){return this.Lr.set(t.id,function(s){return{id:s.id,version:s.version,createTime:yt(s.createTime)}}(t)),N.resolve()}getNamedQuery(e,t){return N.resolve(this.kr.get(t))}saveNamedQuery(e,t){return this.kr.set(t.name,function(s){return{name:s.name,query:zE(s.bundledQuery),readTime:yt(s.readTime)}}(t)),N.resolve()}}/**
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
 */class rT{constructor(){this.overlays=new ve(L.comparator),this.qr=new Map}getOverlay(e,t){return N.resolve(this.overlays.get(t))}getOverlays(e,t){const r=pn();return N.forEach(t,s=>this.getOverlay(e,s).next(i=>{i!==null&&r.set(s,i)})).next(()=>r)}saveOverlays(e,t,r){return r.forEach((s,i)=>{this.St(e,t,i)}),N.resolve()}removeOverlaysForBatchId(e,t,r){const s=this.qr.get(r);return s!==void 0&&(s.forEach(i=>this.overlays=this.overlays.remove(i)),this.qr.delete(r)),N.resolve()}getOverlaysForCollection(e,t,r){const s=pn(),i=t.length+1,a=new L(t.child("")),c=this.overlays.getIteratorFrom(a);for(;c.hasNext();){const l=c.getNext().value,h=l.getKey();if(!t.isPrefixOf(h.path))break;h.path.length===i&&l.largestBatchId>r&&s.set(l.getKey(),l)}return N.resolve(s)}getOverlaysForCollectionGroup(e,t,r,s){let i=new ve((h,f)=>h-f);const a=this.overlays.getIterator();for(;a.hasNext();){const h=a.getNext().value;if(h.getKey().getCollectionGroup()===t&&h.largestBatchId>r){let f=i.get(h.largestBatchId);f===null&&(f=pn(),i=i.insert(h.largestBatchId,f)),f.set(h.getKey(),h)}}const c=pn(),l=i.getIterator();for(;l.hasNext()&&(l.getNext().value.forEach((h,f)=>c.set(h,f)),!(c.size()>=s)););return N.resolve(c)}St(e,t,r){const s=this.overlays.get(r.key);if(s!==null){const a=this.qr.get(s.largestBatchId).delete(r.key);this.qr.set(s.largestBatchId,a)}this.overlays=this.overlays.insert(r.key,new TE(t,r));let i=this.qr.get(t);i===void 0&&(i=K(),this.qr.set(t,i)),this.qr.set(t,i.add(r.key))}}/**
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
 */class sT{constructor(){this.sessionToken=ke.EMPTY_BYTE_STRING}getSessionToken(e){return N.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,N.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ec{constructor(){this.Qr=new Ie(Ae.$r),this.Ur=new Ie(Ae.Kr)}isEmpty(){return this.Qr.isEmpty()}addReference(e,t){const r=new Ae(e,t);this.Qr=this.Qr.add(r),this.Ur=this.Ur.add(r)}Wr(e,t){e.forEach(r=>this.addReference(r,t))}removeReference(e,t){this.Gr(new Ae(e,t))}zr(e,t){e.forEach(r=>this.removeReference(r,t))}jr(e){const t=new L(new oe([])),r=new Ae(t,e),s=new Ae(t,e+1),i=[];return this.Ur.forEachInRange([r,s],a=>{this.Gr(a),i.push(a.key)}),i}Jr(){this.Qr.forEach(e=>this.Gr(e))}Gr(e){this.Qr=this.Qr.delete(e),this.Ur=this.Ur.delete(e)}Hr(e){const t=new L(new oe([])),r=new Ae(t,e),s=new Ae(t,e+1);let i=K();return this.Ur.forEachInRange([r,s],a=>{i=i.add(a.key)}),i}containsKey(e){const t=new Ae(e,0),r=this.Qr.firstAfterOrEqual(t);return r!==null&&e.isEqual(r.key)}}class Ae{constructor(e,t){this.key=e,this.Yr=t}static $r(e,t){return L.comparator(e.key,t.key)||H(e.Yr,t.Yr)}static Kr(e,t){return H(e.Yr,t.Yr)||L.comparator(e.key,t.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class iT{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.tr=1,this.Zr=new Ie(Ae.$r)}checkEmpty(e){return N.resolve(this.mutationQueue.length===0)}addMutationBatch(e,t,r,s){const i=this.tr;this.tr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const a=new EE(i,t,r,s);this.mutationQueue.push(a);for(const c of s)this.Zr=this.Zr.add(new Ae(c.key,i)),this.indexManager.addToCollectionParentIndex(e,c.key.path.popLast());return N.resolve(a)}lookupMutationBatch(e,t){return N.resolve(this.Xr(t))}getNextMutationBatchAfterBatchId(e,t){const r=t+1,s=this.ei(r),i=s<0?0:s;return N.resolve(this.mutationQueue.length>i?this.mutationQueue[i]:null)}getHighestUnacknowledgedBatchId(){return N.resolve(this.mutationQueue.length===0?uc:this.tr-1)}getAllMutationBatches(e){return N.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){const r=new Ae(t,0),s=new Ae(t,Number.POSITIVE_INFINITY),i=[];return this.Zr.forEachInRange([r,s],a=>{const c=this.Xr(a.Yr);i.push(c)}),N.resolve(i)}getAllMutationBatchesAffectingDocumentKeys(e,t){let r=new Ie(H);return t.forEach(s=>{const i=new Ae(s,0),a=new Ae(s,Number.POSITIVE_INFINITY);this.Zr.forEachInRange([i,a],c=>{r=r.add(c.Yr)})}),N.resolve(this.ti(r))}getAllMutationBatchesAffectingQuery(e,t){const r=t.path,s=r.length+1;let i=r;L.isDocumentKey(i)||(i=i.child(""));const a=new Ae(new L(i),0);let c=new Ie(H);return this.Zr.forEachWhile(l=>{const h=l.key.path;return!!r.isPrefixOf(h)&&(h.length===s&&(c=c.add(l.Yr)),!0)},a),N.resolve(this.ti(c))}ti(e){const t=[];return e.forEach(r=>{const s=this.Xr(r);s!==null&&t.push(s)}),t}removeMutationBatch(e,t){Z(this.ni(t.batchId,"removed")===0,55003),this.mutationQueue.shift();let r=this.Zr;return N.forEach(t.mutations,s=>{const i=new Ae(s.key,t.batchId);return r=r.delete(i),this.referenceDelegate.markPotentiallyOrphaned(e,s.key)}).next(()=>{this.Zr=r})}ir(e){}containsKey(e,t){const r=new Ae(t,0),s=this.Zr.firstAfterOrEqual(r);return N.resolve(t.isEqual(s&&s.key))}performConsistencyCheck(e){return this.mutationQueue.length,N.resolve()}ni(e,t){return this.ei(e)}ei(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}Xr(e){const t=this.ei(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class oT{constructor(e){this.ri=e,this.docs=function(){return new ve(L.comparator)}(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){const r=t.key,s=this.docs.get(r),i=s?s.size:0,a=this.ri(t);return this.docs=this.docs.insert(r,{document:t.mutableCopy(),size:a}),this.size+=a-i,this.indexManager.addToCollectionParentIndex(e,r.path.popLast())}removeEntry(e){const t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){const r=this.docs.get(t);return N.resolve(r?r.document.mutableCopy():Fe.newInvalidDocument(t))}getEntries(e,t){let r=Mt();return t.forEach(s=>{const i=this.docs.get(s);r=r.insert(s,i?i.document.mutableCopy():Fe.newInvalidDocument(s))}),N.resolve(r)}getDocumentsMatchingQuery(e,t,r,s){let i=Mt();const a=t.path,c=new L(a.child("__id-9223372036854775808__")),l=this.docs.getIteratorFrom(c);for(;l.hasNext();){const{key:h,value:{document:f}}=l.getNext();if(!a.isPrefixOf(h.path))break;h.path.length>a.length+1||Dy(ky(f),r)<=0||(s.has(f.key)||no(t,f))&&(i=i.insert(f.key,f.mutableCopy()))}return N.resolve(i)}getAllFromCollectionGroup(e,t,r,s){U(9500)}ii(e,t){return N.forEach(this.docs,r=>t(r))}newChangeBuffer(e){return new aT(this)}getSize(e){return N.resolve(this.size)}}class aT extends ZE{constructor(e){super(),this.Nr=e}applyChanges(e){const t=[];return this.changes.forEach((r,s)=>{s.isValidDocument()?t.push(this.Nr.addEntry(e,s)):this.Nr.removeEntry(r)}),N.waitFor(t)}getFromCache(e,t){return this.Nr.getEntry(e,t)}getAllFromCache(e,t){return this.Nr.getEntries(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cT{constructor(e){this.persistence=e,this.si=new Sn(t=>fc(t),pc),this.lastRemoteSnapshotVersion=$.min(),this.highestTargetId=0,this.oi=0,this._i=new Ec,this.targetCount=0,this.ai=Jn.ur()}forEachTarget(e,t){return this.si.forEach((r,s)=>t(s)),N.resolve()}getLastRemoteSnapshotVersion(e){return N.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return N.resolve(this.oi)}allocateTargetId(e){return this.highestTargetId=this.ai.next(),N.resolve(this.highestTargetId)}setTargetsMetadata(e,t,r){return r&&(this.lastRemoteSnapshotVersion=r),t>this.oi&&(this.oi=t),N.resolve()}Pr(e){this.si.set(e.target,e);const t=e.targetId;t>this.highestTargetId&&(this.ai=new Jn(t),this.highestTargetId=t),e.sequenceNumber>this.oi&&(this.oi=e.sequenceNumber)}addTargetData(e,t){return this.Pr(t),this.targetCount+=1,N.resolve()}updateTargetData(e,t){return this.Pr(t),N.resolve()}removeTargetData(e,t){return this.si.delete(t.target),this._i.jr(t.targetId),this.targetCount-=1,N.resolve()}removeTargets(e,t,r){let s=0;const i=[];return this.si.forEach((a,c)=>{c.sequenceNumber<=t&&r.get(c.targetId)===null&&(this.si.delete(a),i.push(this.removeMatchingKeysForTargetId(e,c.targetId)),s++)}),N.waitFor(i).next(()=>s)}getTargetCount(e){return N.resolve(this.targetCount)}getTargetData(e,t){const r=this.si.get(t)||null;return N.resolve(r)}addMatchingKeys(e,t,r){return this._i.Wr(t,r),N.resolve()}removeMatchingKeys(e,t,r){this._i.zr(t,r);const s=this.persistence.referenceDelegate,i=[];return s&&t.forEach(a=>{i.push(s.markPotentiallyOrphaned(e,a))}),N.waitFor(i)}removeMatchingKeysForTargetId(e,t){return this._i.jr(t),N.resolve()}getMatchingKeysForTargetId(e,t){const r=this._i.Hr(t);return N.resolve(r)}containsKey(e,t){return N.resolve(this._i.containsKey(t))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qf{constructor(e,t){this.ui={},this.overlays={},this.ci=new Xi(0),this.li=!1,this.li=!0,this.hi=new sT,this.referenceDelegate=e(this),this.Pi=new cT(this),this.indexManager=new HE,this.remoteDocumentCache=function(s){return new oT(s)}(r=>this.referenceDelegate.Ti(r)),this.serializer=new WE(t),this.Ii=new nT(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.li=!1,Promise.resolve()}get started(){return this.li}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new rT,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let r=this.ui[e.toKey()];return r||(r=new iT(t,this.referenceDelegate),this.ui[e.toKey()]=r),r}getGlobalsCache(){return this.hi}getTargetCache(){return this.Pi}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Ii}runTransaction(e,t,r){M("MemoryPersistence","Starting transaction:",e);const s=new lT(this.ci.next());return this.referenceDelegate.Ei(),r(s).next(i=>this.referenceDelegate.di(s).next(()=>i)).toPromise().then(i=>(s.raiseOnCommittedEvent(),i))}Ai(e,t){return N.or(Object.values(this.ui).map(r=>()=>r.containsKey(e,t)))}}class lT extends Vy{constructor(e){super(),this.currentSequenceNumber=e}}class Tc{constructor(e){this.persistence=e,this.Ri=new Ec,this.Vi=null}static mi(e){return new Tc(e)}get fi(){if(this.Vi)return this.Vi;throw U(60996)}addReference(e,t,r){return this.Ri.addReference(r,t),this.fi.delete(r.toString()),N.resolve()}removeReference(e,t,r){return this.Ri.removeReference(r,t),this.fi.add(r.toString()),N.resolve()}markPotentiallyOrphaned(e,t){return this.fi.add(t.toString()),N.resolve()}removeTarget(e,t){this.Ri.jr(t.targetId).forEach(s=>this.fi.add(s.toString()));const r=this.persistence.getTargetCache();return r.getMatchingKeysForTargetId(e,t.targetId).next(s=>{s.forEach(i=>this.fi.add(i.toString()))}).next(()=>r.removeTargetData(e,t))}Ei(){this.Vi=new Set}di(e){const t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return N.forEach(this.fi,r=>{const s=L.fromPath(r);return this.gi(e,s).next(i=>{i||t.removeEntry(s,$.min())})}).next(()=>(this.Vi=null,t.apply(e)))}updateLimboDocument(e,t){return this.gi(e,t).next(r=>{r?this.fi.delete(t.toString()):this.fi.add(t.toString())})}Ti(e){return 0}gi(e,t){return N.or([()=>N.resolve(this.Ri.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.Ai(e,t)])}}class wi{constructor(e,t){this.persistence=e,this.pi=new Sn(r=>xy(r.path),(r,s)=>r.isEqual(s)),this.garbageCollector=JE(this,t)}static mi(e,t){return new wi(e,t)}Ei(){}di(e){return N.resolve()}forEachTarget(e,t){return this.persistence.getTargetCache().forEachTarget(e,t)}gr(e){const t=this.wr(e);return this.persistence.getTargetCache().getTargetCount(e).next(r=>t.next(s=>r+s))}wr(e){let t=0;return this.pr(e,r=>{t++}).next(()=>t)}pr(e,t){return N.forEach(this.pi,(r,s)=>this.br(e,r,s).next(i=>i?N.resolve():t(s)))}removeTargets(e,t,r){return this.persistence.getTargetCache().removeTargets(e,t,r)}removeOrphanedDocuments(e,t){let r=0;const s=this.persistence.getRemoteDocumentCache(),i=s.newChangeBuffer();return s.ii(e,a=>this.br(e,a,t).next(c=>{c||(r++,i.removeEntry(a,$.min()))})).next(()=>i.apply(e)).next(()=>r)}markPotentiallyOrphaned(e,t){return this.pi.set(t,e.currentSequenceNumber),N.resolve()}removeTarget(e,t){const r=t.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,r)}addReference(e,t,r){return this.pi.set(r,e.currentSequenceNumber),N.resolve()}removeReference(e,t,r){return this.pi.set(r,e.currentSequenceNumber),N.resolve()}updateLimboDocument(e,t){return this.pi.set(t,e.currentSequenceNumber),N.resolve()}Ti(e){let t=e.key.toString().length;return e.isFoundDocument()&&(t+=ii(e.data.value)),t}br(e,t,r){return N.or([()=>this.persistence.Ai(e,t),()=>this.persistence.getTargetCache().containsKey(e,t),()=>{const s=this.pi.get(t);return N.resolve(s!==void 0&&s>r)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vc{constructor(e,t,r,s){this.targetId=e,this.fromCache=t,this.Es=r,this.ds=s}static As(e,t){let r=K(),s=K();for(const i of t.docChanges)switch(i.type){case 0:r=r.add(i.doc.key);break;case 1:s=s.add(i.doc.key)}return new vc(e,t.fromCache,r,s)}}/**
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
 */class uT{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}/**
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
 */class hT{constructor(){this.Rs=!1,this.Vs=!1,this.fs=100,this.gs=function(){return ag()?8:My(at())>0?6:4}()}initialize(e,t){this.ps=e,this.indexManager=t,this.Rs=!0}getDocumentsMatchingQuery(e,t,r,s){const i={result:null};return this.ys(e,t).next(a=>{i.result=a}).next(()=>{if(!i.result)return this.ws(e,t,s,r).next(a=>{i.result=a})}).next(()=>{if(i.result)return;const a=new uT;return this.Ss(e,t,a).next(c=>{if(i.result=c,this.Vs)return this.bs(e,t,a,c.size)})}).next(()=>i.result)}bs(e,t,r,s){return r.documentReadCount<this.fs?(xn()<=W.DEBUG&&M("QueryEngine","SDK will not create cache indexes for query:",Fn(t),"since it only creates cache indexes for collection contains","more than or equal to",this.fs,"documents"),N.resolve()):(xn()<=W.DEBUG&&M("QueryEngine","Query:",Fn(t),"scans",r.documentReadCount,"local documents and returns",s,"documents as results."),r.documentReadCount>this.gs*s?(xn()<=W.DEBUG&&M("QueryEngine","The SDK decides to create cache indexes for query:",Fn(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,gt(t))):N.resolve())}ys(e,t){if(Zu(t))return N.resolve(null);let r=gt(t);return this.indexManager.getIndexType(e,r).next(s=>s===0?null:(t.limit!==null&&s===1&&(t=Ti(t,null,"F"),r=gt(t)),this.indexManager.getDocumentsMatchingTarget(e,r).next(i=>{const a=K(...i);return this.ps.getDocuments(e,a).next(c=>this.indexManager.getMinOffset(e,r).next(l=>{const h=this.Ds(t,c);return this.Cs(t,h,a,l.readTime)?this.ys(e,Ti(t,null,"F")):this.vs(e,h,t,l)}))})))}ws(e,t,r,s){return Zu(t)||s.isEqual($.min())?N.resolve(null):this.ps.getDocuments(e,r).next(i=>{const a=this.Ds(t,i);return this.Cs(t,a,r,s)?N.resolve(null):(xn()<=W.DEBUG&&M("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),Fn(t)),this.vs(e,a,t,Ny(s,ss)).next(c=>c))})}Ds(e,t){let r=new Ie(yf(e));return t.forEach((s,i)=>{no(e,i)&&(r=r.add(i))}),r}Cs(e,t,r,s){if(e.limit===null)return!1;if(r.size!==t.size)return!0;const i=e.limitType==="F"?t.last():t.first();return!!i&&(i.hasPendingWrites||i.version.compareTo(s)>0)}Ss(e,t,r){return xn()<=W.DEBUG&&M("QueryEngine","Using full collection scan to execute query:",Fn(t)),this.ps.getDocumentsMatchingQuery(e,t,Jt.min(),r)}vs(e,t,r,s){return this.ps.getDocumentsMatchingQuery(e,r,s).next(i=>(t.forEach(a=>{i=i.insert(a.key,a)}),i))}}/**
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
 */const Ic="LocalStore",dT=3e8;class fT{constructor(e,t,r,s){this.persistence=e,this.Fs=t,this.serializer=s,this.Ms=new ve(H),this.xs=new Sn(i=>fc(i),pc),this.Os=new Map,this.Ns=e.getRemoteDocumentCache(),this.Pi=e.getTargetCache(),this.Ii=e.getBundleCache(),this.Bs(r)}Bs(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new tT(this.Ns,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Ns.setIndexManager(this.indexManager),this.Fs.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",t=>e.collect(t,this.Ms))}}function pT(n,e,t,r){return new fT(n,e,t,r)}async function $f(n,e){const t=q(n);return await t.persistence.runTransaction("Handle user change","readonly",r=>{let s;return t.mutationQueue.getAllMutationBatches(r).next(i=>(s=i,t.Bs(e),t.mutationQueue.getAllMutationBatches(r))).next(i=>{const a=[],c=[];let l=K();for(const h of s){a.push(h.batchId);for(const f of h.mutations)l=l.add(f.key)}for(const h of i){c.push(h.batchId);for(const f of h.mutations)l=l.add(f.key)}return t.localDocuments.getDocuments(r,l).next(h=>({Ls:h,removedBatchIds:a,addedBatchIds:c}))})})}function _T(n,e){const t=q(n);return t.persistence.runTransaction("Acknowledge batch","readwrite-primary",r=>{const s=e.batch.keys(),i=t.Ns.newChangeBuffer({trackRemovals:!0});return function(c,l,h,f){const p=h.batch,m=p.keys();let v=N.resolve();return m.forEach(R=>{v=v.next(()=>f.getEntry(l,R)).next(k=>{const P=h.docVersions.get(R);Z(P!==null,48541),k.version.compareTo(P)<0&&(p.applyToRemoteDocument(k,h),k.isValidDocument()&&(k.setReadTime(h.commitVersion),f.addEntry(k)))})}),v.next(()=>c.mutationQueue.removeMutationBatch(l,p))}(t,r,e,i).next(()=>i.apply(r)).next(()=>t.mutationQueue.performConsistencyCheck(r)).next(()=>t.documentOverlayCache.removeOverlaysForBatchId(r,s,e.batch.batchId)).next(()=>t.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(r,function(c){let l=K();for(let h=0;h<c.mutationResults.length;++h)c.mutationResults[h].transformResults.length>0&&(l=l.add(c.batch.mutations[h].key));return l}(e))).next(()=>t.localDocuments.getDocuments(r,s))})}function jf(n){const e=q(n);return e.persistence.runTransaction("Get last remote snapshot version","readonly",t=>e.Pi.getLastRemoteSnapshotVersion(t))}function mT(n,e){const t=q(n),r=e.snapshotVersion;let s=t.Ms;return t.persistence.runTransaction("Apply remote event","readwrite-primary",i=>{const a=t.Ns.newChangeBuffer({trackRemovals:!0});s=t.Ms;const c=[];e.targetChanges.forEach((f,p)=>{const m=s.get(p);if(!m)return;c.push(t.Pi.removeMatchingKeys(i,f.removedDocuments,p).next(()=>t.Pi.addMatchingKeys(i,f.addedDocuments,p)));let v=m.withSequenceNumber(i.currentSequenceNumber);e.targetMismatches.get(p)!==null?v=v.withResumeToken(ke.EMPTY_BYTE_STRING,$.min()).withLastLimboFreeSnapshotVersion($.min()):f.resumeToken.approximateByteSize()>0&&(v=v.withResumeToken(f.resumeToken,r)),s=s.insert(p,v),function(k,P,F){return k.resumeToken.approximateByteSize()===0||P.snapshotVersion.toMicroseconds()-k.snapshotVersion.toMicroseconds()>=dT?!0:F.addedDocuments.size+F.modifiedDocuments.size+F.removedDocuments.size>0}(m,v,f)&&c.push(t.Pi.updateTargetData(i,v))});let l=Mt(),h=K();if(e.documentUpdates.forEach(f=>{e.resolvedLimboDocuments.has(f)&&c.push(t.persistence.referenceDelegate.updateLimboDocument(i,f))}),c.push(gT(i,a,e.documentUpdates).next(f=>{l=f.ks,h=f.qs})),!r.isEqual($.min())){const f=t.Pi.getLastRemoteSnapshotVersion(i).next(p=>t.Pi.setTargetsMetadata(i,i.currentSequenceNumber,r));c.push(f)}return N.waitFor(c).next(()=>a.apply(i)).next(()=>t.localDocuments.getLocalViewOfDocuments(i,l,h)).next(()=>l)}).then(i=>(t.Ms=s,i))}function gT(n,e,t){let r=K(),s=K();return t.forEach(i=>r=r.add(i)),e.getEntries(n,r).next(i=>{let a=Mt();return t.forEach((c,l)=>{const h=i.get(c);l.isFoundDocument()!==h.isFoundDocument()&&(s=s.add(c)),l.isNoDocument()&&l.version.isEqual($.min())?(e.removeEntry(c,l.readTime),a=a.insert(c,l)):!h.isValidDocument()||l.version.compareTo(h.version)>0||l.version.compareTo(h.version)===0&&h.hasPendingWrites?(e.addEntry(l),a=a.insert(c,l)):M(Ic,"Ignoring outdated watch update for ",c,". Current version:",h.version," Watch version:",l.version)}),{ks:a,qs:s}})}function yT(n,e){const t=q(n);return t.persistence.runTransaction("Get next mutation batch","readonly",r=>(e===void 0&&(e=uc),t.mutationQueue.getNextMutationBatchAfterBatchId(r,e)))}function ET(n,e){const t=q(n);return t.persistence.runTransaction("Allocate target","readwrite",r=>{let s;return t.Pi.getTargetData(r,e).next(i=>i?(s=i,N.resolve(s)):t.Pi.allocateTargetId(r).next(a=>(s=new Ht(e,a,"TargetPurposeListen",r.currentSequenceNumber),t.Pi.addTargetData(r,s).next(()=>s))))}).then(r=>{const s=t.Ms.get(r.targetId);return(s===null||r.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(t.Ms=t.Ms.insert(r.targetId,r),t.xs.set(e,r.targetId)),r})}async function Va(n,e,t){const r=q(n),s=r.Ms.get(e),i=t?"readwrite":"readwrite-primary";try{t||await r.persistence.runTransaction("Release target",i,a=>r.persistence.referenceDelegate.removeTarget(a,s))}catch(a){if(!cr(a))throw a;M(Ic,`Failed to update sequence numbers for target ${e}: ${a}`)}r.Ms=r.Ms.remove(e),r.xs.delete(s.target)}function dh(n,e,t){const r=q(n);let s=$.min(),i=K();return r.persistence.runTransaction("Execute query","readwrite",a=>function(l,h,f){const p=q(l),m=p.xs.get(f);return m!==void 0?N.resolve(p.Ms.get(m)):p.Pi.getTargetData(h,f)}(r,a,gt(e)).next(c=>{if(c)return s=c.lastLimboFreeSnapshotVersion,r.Pi.getMatchingKeysForTargetId(a,c.targetId).next(l=>{i=l})}).next(()=>r.Fs.getDocumentsMatchingQuery(a,e,t?s:$.min(),t?i:K())).next(c=>(TT(r,rE(e),c),{documents:c,Qs:i})))}function TT(n,e,t){let r=n.Os.get(e)||$.min();t.forEach((s,i)=>{i.readTime.compareTo(r)>0&&(r=i.readTime)}),n.Os.set(e,r)}class fh{constructor(){this.activeTargetIds=lE()}zs(e){this.activeTargetIds=this.activeTargetIds.add(e)}js(e){this.activeTargetIds=this.activeTargetIds.delete(e)}Gs(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class vT{constructor(){this.Mo=new fh,this.xo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,r){}addLocalQueryTarget(e,t=!0){return t&&this.Mo.zs(e),this.xo[e]||"not-current"}updateQueryState(e,t,r){this.xo[e]=t}removeLocalQueryTarget(e){this.Mo.js(e)}isLocalQueryTarget(e){return this.Mo.activeTargetIds.has(e)}clearQueryState(e){delete this.xo[e]}getAllActiveQueryTargets(){return this.Mo.activeTargetIds}isActiveQueryTarget(e){return this.Mo.activeTargetIds.has(e)}start(){return this.Mo=new fh,Promise.resolve()}handleUserChange(e,t,r){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}/**
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
 */class IT{Oo(e){}shutdown(){}}/**
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
 */const ph="ConnectivityMonitor";class _h{constructor(){this.No=()=>this.Bo(),this.Lo=()=>this.ko(),this.qo=[],this.Qo()}Oo(e){this.qo.push(e)}shutdown(){window.removeEventListener("online",this.No),window.removeEventListener("offline",this.Lo)}Qo(){window.addEventListener("online",this.No),window.addEventListener("offline",this.Lo)}Bo(){M(ph,"Network connectivity changed: AVAILABLE");for(const e of this.qo)e(0)}ko(){M(ph,"Network connectivity changed: UNAVAILABLE");for(const e of this.qo)e(1)}static v(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
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
 */let Js=null;function Ma(){return Js===null?Js=function(){return 268435456+Math.round(2147483648*Math.random())}():Js++,"0x"+Js.toString(16)}/**
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
 */const ta="RestConnection",wT={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};class AT{get $o(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const t=e.ssl?"https":"http",r=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.Uo=t+"://"+e.host,this.Ko=`projects/${r}/databases/${s}`,this.Wo=this.databaseId.database===Aa?`project_id=${r}`:`project_id=${r}&database_id=${s}`}Go(e,t,r,s,i){const a=Ma(),c=this.zo(e,t.toUriEncodedString());M(ta,`Sending RPC '${e}' ${a}:`,c,r);const l={"google-cloud-resource-prefix":this.Ko,"x-goog-request-params":this.Wo};this.jo(l,s,i);const{host:h}=new URL(c),f=ut(h);return this.Jo(e,c,l,r,f).then(p=>(M(ta,`Received RPC '${e}' ${a}: `,p),p),p=>{throw Kn(ta,`RPC '${e}' ${a} failed with error: `,p,"url: ",c,"request:",r),p})}Ho(e,t,r,s,i,a){return this.Go(e,t,r,s,i)}jo(e,t,r){e["X-Goog-Api-Client"]=function(){return"gl-js/ fire/"+or}(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach((s,i)=>e[i]=s),r&&r.headers.forEach((s,i)=>e[i]=s)}zo(e,t){const r=wT[e];return`${this.Uo}/v1/${t}:${r}`}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class CT{constructor(e){this.Yo=e.Yo,this.Zo=e.Zo}Xo(e){this.e_=e}t_(e){this.n_=e}r_(e){this.i_=e}onMessage(e){this.s_=e}close(){this.Zo()}send(e){this.Yo(e)}o_(){this.e_()}__(){this.n_()}a_(e){this.i_(e)}u_(e){this.s_(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Le="WebChannelConnection";class RT extends AT{constructor(e){super(e),this.c_=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}Jo(e,t,r,s,i){const a=Ma();return new Promise((c,l)=>{const h=new jd;h.setWithCredentials(!0),h.listenOnce(Wd.COMPLETE,()=>{try{switch(h.getLastErrorCode()){case si.NO_ERROR:const p=h.getResponseJson();M(Le,`XHR for RPC '${e}' ${a} received:`,JSON.stringify(p)),c(p);break;case si.TIMEOUT:M(Le,`RPC '${e}' ${a} timed out`),l(new V(b.DEADLINE_EXCEEDED,"Request time out"));break;case si.HTTP_ERROR:const m=h.getStatus();if(M(Le,`RPC '${e}' ${a} failed with status:`,m,"response text:",h.getResponseText()),m>0){let v=h.getResponseJson();Array.isArray(v)&&(v=v[0]);const R=v==null?void 0:v.error;if(R&&R.status&&R.message){const k=function(F){const x=F.toLowerCase().replace(/_/g,"-");return Object.values(b).indexOf(x)>=0?x:b.UNKNOWN}(R.status);l(new V(k,R.message))}else l(new V(b.UNKNOWN,"Server responded with status "+h.getStatus()))}else l(new V(b.UNAVAILABLE,"Connection failed."));break;default:U(9055,{l_:e,streamId:a,h_:h.getLastErrorCode(),P_:h.getLastError()})}}finally{M(Le,`RPC '${e}' ${a} completed.`)}});const f=JSON.stringify(s);M(Le,`RPC '${e}' ${a} sending request:`,s),h.send(t,"POST",f,r,15)})}T_(e,t,r){const s=Ma(),i=[this.Uo,"/","google.firestore.v1.Firestore","/",e,"/channel"],a=Gd(),c=Hd(),l={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},h=this.longPollingOptions.timeoutSeconds;h!==void 0&&(l.longPollingTimeout=Math.round(1e3*h)),this.useFetchStreams&&(l.useFetchStreams=!0),this.jo(l.initMessageHeaders,t,r),l.encodeInitMessageHeaders=!0;const f=i.join("");M(Le,`Creating RPC '${e}' stream ${s}: ${f}`,l);const p=a.createWebChannel(f,l);this.I_(p);let m=!1,v=!1;const R=new CT({Yo:P=>{v?M(Le,`Not sending because RPC '${e}' stream ${s} is closed:`,P):(m||(M(Le,`Opening RPC '${e}' stream ${s} transport.`),p.open(),m=!0),M(Le,`RPC '${e}' stream ${s} sending:`,P),p.send(P))},Zo:()=>p.close()}),k=(P,F,x)=>{P.listen(F,B=>{try{x(B)}catch(j){setTimeout(()=>{throw j},0)}})};return k(p,Fr.EventType.OPEN,()=>{v||(M(Le,`RPC '${e}' stream ${s} transport opened.`),R.o_())}),k(p,Fr.EventType.CLOSE,()=>{v||(v=!0,M(Le,`RPC '${e}' stream ${s} transport closed`),R.a_(),this.E_(p))}),k(p,Fr.EventType.ERROR,P=>{v||(v=!0,Kn(Le,`RPC '${e}' stream ${s} transport errored. Name:`,P.name,"Message:",P.message),R.a_(new V(b.UNAVAILABLE,"The operation could not be completed")))}),k(p,Fr.EventType.MESSAGE,P=>{var F;if(!v){const x=P.data[0];Z(!!x,16349);const B=x,j=(B==null?void 0:B.error)||((F=B[0])==null?void 0:F.error);if(j){M(Le,`RPC '${e}' stream ${s} received error:`,j);const We=j.status;let pe=function(E){const T=ge[E];if(T!==void 0)return Pf(T)}(We),w=j.message;pe===void 0&&(pe=b.INTERNAL,w="Unknown error status: "+We+" with message "+j.message),v=!0,R.a_(new V(pe,w)),p.close()}else M(Le,`RPC '${e}' stream ${s} received:`,x),R.u_(x)}}),k(c,zd.STAT_EVENT,P=>{P.stat===Ta.PROXY?M(Le,`RPC '${e}' stream ${s} detected buffering proxy`):P.stat===Ta.NOPROXY&&M(Le,`RPC '${e}' stream ${s} detected no buffering proxy`)}),setTimeout(()=>{R.__()},0),R}terminate(){this.c_.forEach(e=>e.close()),this.c_=[]}I_(e){this.c_.push(e)}E_(e){this.c_=this.c_.filter(t=>t===e)}}function na(){return typeof document<"u"?document:null}/**
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
 */function ao(n){return new NE(n,!0)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wf{constructor(e,t,r=1e3,s=1.5,i=6e4){this.Mi=e,this.timerId=t,this.d_=r,this.A_=s,this.R_=i,this.V_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.V_=0}g_(){this.V_=this.R_}p_(e){this.cancel();const t=Math.floor(this.V_+this.y_()),r=Math.max(0,Date.now()-this.f_),s=Math.max(0,t-r);s>0&&M("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.V_} ms, delay with jitter: ${t} ms, last attempt: ${r} ms ago)`),this.m_=this.Mi.enqueueAfterDelay(this.timerId,s,()=>(this.f_=Date.now(),e())),this.V_*=this.A_,this.V_<this.d_&&(this.V_=this.d_),this.V_>this.R_&&(this.V_=this.R_)}w_(){this.m_!==null&&(this.m_.skipDelay(),this.m_=null)}cancel(){this.m_!==null&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.V_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mh="PersistentStream";class zf{constructor(e,t,r,s,i,a,c,l){this.Mi=e,this.S_=r,this.b_=s,this.connection=i,this.authCredentialsProvider=a,this.appCheckCredentialsProvider=c,this.listener=l,this.state=0,this.D_=0,this.C_=null,this.v_=null,this.stream=null,this.F_=0,this.M_=new Wf(e,t)}x_(){return this.state===1||this.state===5||this.O_()}O_(){return this.state===2||this.state===3}start(){this.F_=0,this.state!==4?this.auth():this.N_()}async stop(){this.x_()&&await this.close(0)}B_(){this.state=0,this.M_.reset()}L_(){this.O_()&&this.C_===null&&(this.C_=this.Mi.enqueueAfterDelay(this.S_,6e4,()=>this.k_()))}q_(e){this.Q_(),this.stream.send(e)}async k_(){if(this.O_())return this.close(0)}Q_(){this.C_&&(this.C_.cancel(),this.C_=null)}U_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(e,t){this.Q_(),this.U_(),this.M_.cancel(),this.D_++,e!==4?this.M_.reset():t&&t.code===b.RESOURCE_EXHAUSTED?(Vt(t.toString()),Vt("Using maximum backoff delay to prevent overloading the backend."),this.M_.g_()):t&&t.code===b.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.K_(),this.stream.close(),this.stream=null),this.state=e,await this.listener.r_(t)}K_(){}auth(){this.state=1;const e=this.W_(this.D_),t=this.D_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([r,s])=>{this.D_===t&&this.G_(r,s)},r=>{e(()=>{const s=new V(b.UNKNOWN,"Fetching auth token failed: "+r.message);return this.z_(s)})})}G_(e,t){const r=this.W_(this.D_);this.stream=this.j_(e,t),this.stream.Xo(()=>{r(()=>this.listener.Xo())}),this.stream.t_(()=>{r(()=>(this.state=2,this.v_=this.Mi.enqueueAfterDelay(this.b_,1e4,()=>(this.O_()&&(this.state=3),Promise.resolve())),this.listener.t_()))}),this.stream.r_(s=>{r(()=>this.z_(s))}),this.stream.onMessage(s=>{r(()=>++this.F_==1?this.J_(s):this.onNext(s))})}N_(){this.state=5,this.M_.p_(async()=>{this.state=0,this.start()})}z_(e){return M(mh,`close with error: ${e}`),this.stream=null,this.close(4,e)}W_(e){return t=>{this.Mi.enqueueAndForget(()=>this.D_===e?t():(M(mh,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}}class ST extends zf{constructor(e,t,r,s,i,a){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,r,s,a),this.serializer=i}j_(e,t){return this.connection.T_("Listen",e,t)}J_(e){return this.onNext(e)}onNext(e){this.M_.reset();const t=OE(this.serializer,e),r=function(i){if(!("targetChange"in i))return $.min();const a=i.targetChange;return a.targetIds&&a.targetIds.length?$.min():a.readTime?yt(a.readTime):$.min()}(e);return this.listener.H_(t,r)}Y_(e){const t={};t.database=Oa(this.serializer),t.addTarget=function(i,a){let c;const l=a.target;if(c=ba(l)?{documents:LE(i,l)}:{query:Lf(i,l).ft},c.targetId=a.targetId,a.resumeToken.approximateByteSize()>0){c.resumeToken=Df(i,a.resumeToken);const h=Na(i,a.expectedCount);h!==null&&(c.expectedCount=h)}else if(a.snapshotVersion.compareTo($.min())>0){c.readTime=Ii(i,a.snapshotVersion.toTimestamp());const h=Na(i,a.expectedCount);h!==null&&(c.expectedCount=h)}return c}(this.serializer,e);const r=UE(this.serializer,e);r&&(t.labels=r),this.q_(t)}Z_(e){const t={};t.database=Oa(this.serializer),t.removeTarget=e,this.q_(t)}}class bT extends zf{constructor(e,t,r,s,i,a){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,r,s,a),this.serializer=i}get X_(){return this.F_>0}start(){this.lastStreamToken=void 0,super.start()}K_(){this.X_&&this.ea([])}j_(e,t){return this.connection.T_("Write",e,t)}J_(e){return Z(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,Z(!e.writeResults||e.writeResults.length===0,55816),this.listener.ta()}onNext(e){Z(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this.M_.reset();const t=ME(e.writeResults,e.commitTime),r=yt(e.commitTime);return this.listener.na(r,t)}ra(){const e={};e.database=Oa(this.serializer),this.q_(e)}ea(e){const t={streamToken:this.lastStreamToken,writes:e.map(r=>VE(this.serializer,r))};this.q_(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class PT{}class NT extends PT{constructor(e,t,r,s){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=r,this.serializer=s,this.ia=!1}sa(){if(this.ia)throw new V(b.FAILED_PRECONDITION,"The client has already been terminated.")}Go(e,t,r,s){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([i,a])=>this.connection.Go(e,ka(t,r),s,i,a)).catch(i=>{throw i.name==="FirebaseError"?(i.code===b.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),i):new V(b.UNKNOWN,i.toString())})}Ho(e,t,r,s,i){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([a,c])=>this.connection.Ho(e,ka(t,r),s,a,c,i)).catch(a=>{throw a.name==="FirebaseError"?(a.code===b.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),a):new V(b.UNKNOWN,a.toString())})}terminate(){this.ia=!0,this.connection.terminate()}}class kT{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.oa=0,this._a=null,this.aa=!0}ua(){this.oa===0&&(this.ca("Unknown"),this._a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this._a=null,this.la("Backend didn't respond within 10 seconds."),this.ca("Offline"),Promise.resolve())))}ha(e){this.state==="Online"?this.ca("Unknown"):(this.oa++,this.oa>=1&&(this.Pa(),this.la(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.ca("Offline")))}set(e){this.Pa(),this.oa=0,e==="Online"&&(this.aa=!1),this.ca(e)}ca(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}la(e){const t=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.aa?(Vt(t),this.aa=!1):M("OnlineStateTracker",t)}Pa(){this._a!==null&&(this._a.cancel(),this._a=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const In="RemoteStore";class DT{constructor(e,t,r,s,i){this.localStore=e,this.datastore=t,this.asyncQueue=r,this.remoteSyncer={},this.Ta=[],this.Ia=new Map,this.Ea=new Set,this.da=[],this.Aa=i,this.Aa.Oo(a=>{r.enqueueAndForget(async()=>{bn(this)&&(M(In,"Restarting streams for network reachability change."),await async function(l){const h=q(l);h.Ea.add(4),await Es(h),h.Ra.set("Unknown"),h.Ea.delete(4),await co(h)}(this))})}),this.Ra=new kT(r,s)}}async function co(n){if(bn(n))for(const e of n.da)await e(!0)}async function Es(n){for(const e of n.da)await e(!1)}function Hf(n,e){const t=q(n);t.Ia.has(e.targetId)||(t.Ia.set(e.targetId,e),Rc(t)?Cc(t):ur(t).O_()&&Ac(t,e))}function wc(n,e){const t=q(n),r=ur(t);t.Ia.delete(e),r.O_()&&Gf(t,e),t.Ia.size===0&&(r.O_()?r.L_():bn(t)&&t.Ra.set("Unknown"))}function Ac(n,e){if(n.Va.Ue(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo($.min())>0){const t=n.remoteSyncer.getRemoteKeysForTarget(e.targetId).size;e=e.withExpectedCount(t)}ur(n).Y_(e)}function Gf(n,e){n.Va.Ue(e),ur(n).Z_(e)}function Cc(n){n.Va=new RE({getRemoteKeysForTarget:e=>n.remoteSyncer.getRemoteKeysForTarget(e),At:e=>n.Ia.get(e)||null,ht:()=>n.datastore.serializer.databaseId}),ur(n).start(),n.Ra.ua()}function Rc(n){return bn(n)&&!ur(n).x_()&&n.Ia.size>0}function bn(n){return q(n).Ea.size===0}function Kf(n){n.Va=void 0}async function OT(n){n.Ra.set("Online")}async function VT(n){n.Ia.forEach((e,t)=>{Ac(n,e)})}async function MT(n,e){Kf(n),Rc(n)?(n.Ra.ha(e),Cc(n)):n.Ra.set("Unknown")}async function LT(n,e,t){if(n.Ra.set("Online"),e instanceof kf&&e.state===2&&e.cause)try{await async function(s,i){const a=i.cause;for(const c of i.targetIds)s.Ia.has(c)&&(await s.remoteSyncer.rejectListen(c,a),s.Ia.delete(c),s.Va.removeTarget(c))}(n,e)}catch(r){M(In,"Failed to remove targets %s: %s ",e.targetIds.join(","),r),await Ai(n,r)}else if(e instanceof ci?n.Va.Ze(e):e instanceof Nf?n.Va.st(e):n.Va.tt(e),!t.isEqual($.min()))try{const r=await jf(n.localStore);t.compareTo(r)>=0&&await function(i,a){const c=i.Va.Tt(a);return c.targetChanges.forEach((l,h)=>{if(l.resumeToken.approximateByteSize()>0){const f=i.Ia.get(h);f&&i.Ia.set(h,f.withResumeToken(l.resumeToken,a))}}),c.targetMismatches.forEach((l,h)=>{const f=i.Ia.get(l);if(!f)return;i.Ia.set(l,f.withResumeToken(ke.EMPTY_BYTE_STRING,f.snapshotVersion)),Gf(i,l);const p=new Ht(f.target,l,h,f.sequenceNumber);Ac(i,p)}),i.remoteSyncer.applyRemoteEvent(c)}(n,t)}catch(r){M(In,"Failed to raise snapshot:",r),await Ai(n,r)}}async function Ai(n,e,t){if(!cr(e))throw e;n.Ea.add(1),await Es(n),n.Ra.set("Offline"),t||(t=()=>jf(n.localStore)),n.asyncQueue.enqueueRetryable(async()=>{M(In,"Retrying IndexedDB access"),await t(),n.Ea.delete(1),await co(n)})}function Qf(n,e){return e().catch(t=>Ai(n,t,e))}async function lo(n){const e=q(n),t=nn(e);let r=e.Ta.length>0?e.Ta[e.Ta.length-1].batchId:uc;for(;xT(e);)try{const s=await yT(e.localStore,r);if(s===null){e.Ta.length===0&&t.L_();break}r=s.batchId,FT(e,s)}catch(s){await Ai(e,s)}Yf(e)&&Xf(e)}function xT(n){return bn(n)&&n.Ta.length<10}function FT(n,e){n.Ta.push(e);const t=nn(n);t.O_()&&t.X_&&t.ea(e.mutations)}function Yf(n){return bn(n)&&!nn(n).x_()&&n.Ta.length>0}function Xf(n){nn(n).start()}async function UT(n){nn(n).ra()}async function BT(n){const e=nn(n);for(const t of n.Ta)e.ea(t.mutations)}async function qT(n,e,t){const r=n.Ta.shift(),s=mc.from(r,e,t);await Qf(n,()=>n.remoteSyncer.applySuccessfulWrite(s)),await lo(n)}async function $T(n,e){e&&nn(n).X_&&await async function(r,s){if(function(a){return wE(a)&&a!==b.ABORTED}(s.code)){const i=r.Ta.shift();nn(r).B_(),await Qf(r,()=>r.remoteSyncer.rejectFailedWrite(i.batchId,s)),await lo(r)}}(n,e),Yf(n)&&Xf(n)}async function gh(n,e){const t=q(n);t.asyncQueue.verifyOperationInProgress(),M(In,"RemoteStore received new credentials");const r=bn(t);t.Ea.add(3),await Es(t),r&&t.Ra.set("Unknown"),await t.remoteSyncer.handleCredentialChange(e),t.Ea.delete(3),await co(t)}async function jT(n,e){const t=q(n);e?(t.Ea.delete(2),await co(t)):e||(t.Ea.add(2),await Es(t),t.Ra.set("Unknown"))}function ur(n){return n.ma||(n.ma=function(t,r,s){const i=q(t);return i.sa(),new ST(r,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)}(n.datastore,n.asyncQueue,{Xo:OT.bind(null,n),t_:VT.bind(null,n),r_:MT.bind(null,n),H_:LT.bind(null,n)}),n.da.push(async e=>{e?(n.ma.B_(),Rc(n)?Cc(n):n.Ra.set("Unknown")):(await n.ma.stop(),Kf(n))})),n.ma}function nn(n){return n.fa||(n.fa=function(t,r,s){const i=q(t);return i.sa(),new bT(r,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)}(n.datastore,n.asyncQueue,{Xo:()=>Promise.resolve(),t_:UT.bind(null,n),r_:$T.bind(null,n),ta:BT.bind(null,n),na:qT.bind(null,n)}),n.da.push(async e=>{e?(n.fa.B_(),await lo(n)):(await n.fa.stop(),n.Ta.length>0&&(M(In,`Stopping write stream with ${n.Ta.length} pending writes`),n.Ta=[]))})),n.fa}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Sc{constructor(e,t,r,s,i){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=r,this.op=s,this.removalCallback=i,this.deferred=new mt,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(a=>{})}get promise(){return this.deferred.promise}static createAndSchedule(e,t,r,s,i){const a=Date.now()+r,c=new Sc(e,t,a,s,i);return c.start(r),c}start(e){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new V(b.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then(e=>this.deferred.resolve(e))):Promise.resolve())}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function bc(n,e){if(Vt("AsyncQueue",`${e}: ${n}`),cr(n))return new V(b.UNAVAILABLE,`${e}: ${n}`);throw n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qn{static emptySet(e){return new qn(e.comparator)}constructor(e){this.comparator=e?(t,r)=>e(t,r)||L.comparator(t.key,r.key):(t,r)=>L.comparator(t.key,r.key),this.keyedMap=Ur(),this.sortedSet=new ve(this.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal((t,r)=>(e(t),!1))}add(e){const t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){const t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof qn)||this.size!==e.size)return!1;const t=this.sortedSet.getIterator(),r=e.sortedSet.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=r.getNext().key;if(!s.isEqual(i))return!1}return!0}toString(){const e=[];return this.forEach(t=>{e.push(t.toString())}),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,t){const r=new qn;return r.comparator=this.comparator,r.keyedMap=e,r.sortedSet=t,r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yh{constructor(){this.ga=new ve(L.comparator)}track(e){const t=e.doc.key,r=this.ga.get(t);r?e.type!==0&&r.type===3?this.ga=this.ga.insert(t,e):e.type===3&&r.type!==1?this.ga=this.ga.insert(t,{type:r.type,doc:e.doc}):e.type===2&&r.type===2?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):e.type===2&&r.type===0?this.ga=this.ga.insert(t,{type:0,doc:e.doc}):e.type===1&&r.type===0?this.ga=this.ga.remove(t):e.type===1&&r.type===2?this.ga=this.ga.insert(t,{type:1,doc:r.doc}):e.type===0&&r.type===1?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):U(63341,{Rt:e,pa:r}):this.ga=this.ga.insert(t,e)}ya(){const e=[];return this.ga.inorderTraversal((t,r)=>{e.push(r)}),e}}class Zn{constructor(e,t,r,s,i,a,c,l,h){this.query=e,this.docs=t,this.oldDocs=r,this.docChanges=s,this.mutatedKeys=i,this.fromCache=a,this.syncStateChanged=c,this.excludesMetadataChanges=l,this.hasCachedResults=h}static fromInitialDocuments(e,t,r,s,i){const a=[];return t.forEach(c=>{a.push({type:0,doc:c})}),new Zn(e,t,qn.emptySet(t),a,r,s,!0,!1,i)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&to(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const t=this.docChanges,r=e.docChanges;if(t.length!==r.length)return!1;for(let s=0;s<t.length;s++)if(t[s].type!==r[s].type||!t[s].doc.isEqual(r[s].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class WT{constructor(){this.wa=void 0,this.Sa=[]}ba(){return this.Sa.some(e=>e.Da())}}class zT{constructor(){this.queries=Eh(),this.onlineState="Unknown",this.Ca=new Set}terminate(){(function(t,r){const s=q(t),i=s.queries;s.queries=Eh(),i.forEach((a,c)=>{for(const l of c.Sa)l.onError(r)})})(this,new V(b.ABORTED,"Firestore shutting down"))}}function Eh(){return new Sn(n=>gf(n),to)}async function Pc(n,e){const t=q(n);let r=3;const s=e.query;let i=t.queries.get(s);i?!i.ba()&&e.Da()&&(r=2):(i=new WT,r=e.Da()?0:1);try{switch(r){case 0:i.wa=await t.onListen(s,!0);break;case 1:i.wa=await t.onListen(s,!1);break;case 2:await t.onFirstRemoteStoreListen(s)}}catch(a){const c=bc(a,`Initialization of query '${Fn(e.query)}' failed`);return void e.onError(c)}t.queries.set(s,i),i.Sa.push(e),e.va(t.onlineState),i.wa&&e.Fa(i.wa)&&kc(t)}async function Nc(n,e){const t=q(n),r=e.query;let s=3;const i=t.queries.get(r);if(i){const a=i.Sa.indexOf(e);a>=0&&(i.Sa.splice(a,1),i.Sa.length===0?s=e.Da()?0:1:!i.ba()&&e.Da()&&(s=2))}switch(s){case 0:return t.queries.delete(r),t.onUnlisten(r,!0);case 1:return t.queries.delete(r),t.onUnlisten(r,!1);case 2:return t.onLastRemoteStoreUnlisten(r);default:return}}function HT(n,e){const t=q(n);let r=!1;for(const s of e){const i=s.query,a=t.queries.get(i);if(a){for(const c of a.Sa)c.Fa(s)&&(r=!0);a.wa=s}}r&&kc(t)}function GT(n,e,t){const r=q(n),s=r.queries.get(e);if(s)for(const i of s.Sa)i.onError(t);r.queries.delete(e)}function kc(n){n.Ca.forEach(e=>{e.next()})}var La,Th;(Th=La||(La={})).Ma="default",Th.Cache="cache";class Dc{constructor(e,t,r){this.query=e,this.xa=t,this.Oa=!1,this.Na=null,this.onlineState="Unknown",this.options=r||{}}Fa(e){if(!this.options.includeMetadataChanges){const r=[];for(const s of e.docChanges)s.type!==3&&r.push(s);e=new Zn(e.query,e.docs,e.oldDocs,r,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.Oa?this.Ba(e)&&(this.xa.next(e),t=!0):this.La(e,this.onlineState)&&(this.ka(e),t=!0),this.Na=e,t}onError(e){this.xa.error(e)}va(e){this.onlineState=e;let t=!1;return this.Na&&!this.Oa&&this.La(this.Na,e)&&(this.ka(this.Na),t=!0),t}La(e,t){if(!e.fromCache||!this.Da())return!0;const r=t!=="Offline";return(!this.options.qa||!r)&&(!e.docs.isEmpty()||e.hasCachedResults||t==="Offline")}Ba(e){if(e.docChanges.length>0)return!0;const t=this.Na&&this.Na.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&this.options.includeMetadataChanges===!0}ka(e){e=Zn.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.Oa=!0,this.xa.next(e)}Da(){return this.options.source!==La.Cache}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jf{constructor(e){this.key=e}}class Zf{constructor(e){this.key=e}}class KT{constructor(e,t){this.query=e,this.Ya=t,this.Za=null,this.hasCachedResults=!1,this.current=!1,this.Xa=K(),this.mutatedKeys=K(),this.eu=yf(e),this.tu=new qn(this.eu)}get nu(){return this.Ya}ru(e,t){const r=t?t.iu:new yh,s=t?t.tu:this.tu;let i=t?t.mutatedKeys:this.mutatedKeys,a=s,c=!1;const l=this.query.limitType==="F"&&s.size===this.query.limit?s.last():null,h=this.query.limitType==="L"&&s.size===this.query.limit?s.first():null;if(e.inorderTraversal((f,p)=>{const m=s.get(f),v=no(this.query,p)?p:null,R=!!m&&this.mutatedKeys.has(m.key),k=!!v&&(v.hasLocalMutations||this.mutatedKeys.has(v.key)&&v.hasCommittedMutations);let P=!1;m&&v?m.data.isEqual(v.data)?R!==k&&(r.track({type:3,doc:v}),P=!0):this.su(m,v)||(r.track({type:2,doc:v}),P=!0,(l&&this.eu(v,l)>0||h&&this.eu(v,h)<0)&&(c=!0)):!m&&v?(r.track({type:0,doc:v}),P=!0):m&&!v&&(r.track({type:1,doc:m}),P=!0,(l||h)&&(c=!0)),P&&(v?(a=a.add(v),i=k?i.add(f):i.delete(f)):(a=a.delete(f),i=i.delete(f)))}),this.query.limit!==null)for(;a.size>this.query.limit;){const f=this.query.limitType==="F"?a.last():a.first();a=a.delete(f.key),i=i.delete(f.key),r.track({type:1,doc:f})}return{tu:a,iu:r,Cs:c,mutatedKeys:i}}su(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,r,s){const i=this.tu;this.tu=e.tu,this.mutatedKeys=e.mutatedKeys;const a=e.iu.ya();a.sort((f,p)=>function(v,R){const k=P=>{switch(P){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return U(20277,{Rt:P})}};return k(v)-k(R)}(f.type,p.type)||this.eu(f.doc,p.doc)),this.ou(r),s=s??!1;const c=t&&!s?this._u():[],l=this.Xa.size===0&&this.current&&!s?1:0,h=l!==this.Za;return this.Za=l,a.length!==0||h?{snapshot:new Zn(this.query,e.tu,i,a,e.mutatedKeys,l===0,h,!1,!!r&&r.resumeToken.approximateByteSize()>0),au:c}:{au:c}}va(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({tu:this.tu,iu:new yh,mutatedKeys:this.mutatedKeys,Cs:!1},!1)):{au:[]}}uu(e){return!this.Ya.has(e)&&!!this.tu.has(e)&&!this.tu.get(e).hasLocalMutations}ou(e){e&&(e.addedDocuments.forEach(t=>this.Ya=this.Ya.add(t)),e.modifiedDocuments.forEach(t=>{}),e.removedDocuments.forEach(t=>this.Ya=this.Ya.delete(t)),this.current=e.current)}_u(){if(!this.current)return[];const e=this.Xa;this.Xa=K(),this.tu.forEach(r=>{this.uu(r.key)&&(this.Xa=this.Xa.add(r.key))});const t=[];return e.forEach(r=>{this.Xa.has(r)||t.push(new Zf(r))}),this.Xa.forEach(r=>{e.has(r)||t.push(new Jf(r))}),t}cu(e){this.Ya=e.Qs,this.Xa=K();const t=this.ru(e.documents);return this.applyChanges(t,!0)}lu(){return Zn.fromInitialDocuments(this.query,this.tu,this.mutatedKeys,this.Za===0,this.hasCachedResults)}}const Oc="SyncEngine";class QT{constructor(e,t,r){this.query=e,this.targetId=t,this.view=r}}class YT{constructor(e){this.key=e,this.hu=!1}}class XT{constructor(e,t,r,s,i,a){this.localStore=e,this.remoteStore=t,this.eventManager=r,this.sharedClientState=s,this.currentUser=i,this.maxConcurrentLimboResolutions=a,this.Pu={},this.Tu=new Sn(c=>gf(c),to),this.Iu=new Map,this.Eu=new Set,this.du=new ve(L.comparator),this.Au=new Map,this.Ru=new Ec,this.Vu={},this.mu=new Map,this.fu=Jn.cr(),this.onlineState="Unknown",this.gu=void 0}get isPrimaryClient(){return this.gu===!0}}async function JT(n,e,t=!0){const r=ip(n);let s;const i=r.Tu.get(e);return i?(r.sharedClientState.addLocalQueryTarget(i.targetId),s=i.view.lu()):s=await ep(r,e,t,!0),s}async function ZT(n,e){const t=ip(n);await ep(t,e,!0,!1)}async function ep(n,e,t,r){const s=await ET(n.localStore,gt(e)),i=s.targetId,a=n.sharedClientState.addLocalQueryTarget(i,t);let c;return r&&(c=await ev(n,e,i,a==="current",s.resumeToken)),n.isPrimaryClient&&t&&Hf(n.remoteStore,s),c}async function ev(n,e,t,r,s){n.pu=(p,m,v)=>async function(k,P,F,x){let B=P.view.ru(F);B.Cs&&(B=await dh(k.localStore,P.query,!1).then(({documents:w})=>P.view.ru(w,B)));const j=x&&x.targetChanges.get(P.targetId),We=x&&x.targetMismatches.get(P.targetId)!=null,pe=P.view.applyChanges(B,k.isPrimaryClient,j,We);return Ih(k,P.targetId,pe.au),pe.snapshot}(n,p,m,v);const i=await dh(n.localStore,e,!0),a=new KT(e,i.Qs),c=a.ru(i.documents),l=ys.createSynthesizedTargetChangeForCurrentChange(t,r&&n.onlineState!=="Offline",s),h=a.applyChanges(c,n.isPrimaryClient,l);Ih(n,t,h.au);const f=new QT(e,t,a);return n.Tu.set(e,f),n.Iu.has(t)?n.Iu.get(t).push(e):n.Iu.set(t,[e]),h.snapshot}async function tv(n,e,t){const r=q(n),s=r.Tu.get(e),i=r.Iu.get(s.targetId);if(i.length>1)return r.Iu.set(s.targetId,i.filter(a=>!to(a,e))),void r.Tu.delete(e);r.isPrimaryClient?(r.sharedClientState.removeLocalQueryTarget(s.targetId),r.sharedClientState.isActiveQueryTarget(s.targetId)||await Va(r.localStore,s.targetId,!1).then(()=>{r.sharedClientState.clearQueryState(s.targetId),t&&wc(r.remoteStore,s.targetId),xa(r,s.targetId)}).catch(ar)):(xa(r,s.targetId),await Va(r.localStore,s.targetId,!0))}async function nv(n,e){const t=q(n),r=t.Tu.get(e),s=t.Iu.get(r.targetId);t.isPrimaryClient&&s.length===1&&(t.sharedClientState.removeLocalQueryTarget(r.targetId),wc(t.remoteStore,r.targetId))}async function rv(n,e,t){const r=uv(n);try{const s=await function(a,c){const l=q(a),h=le.now(),f=c.reduce((v,R)=>v.add(R.key),K());let p,m;return l.persistence.runTransaction("Locally write mutations","readwrite",v=>{let R=Mt(),k=K();return l.Ns.getEntries(v,f).next(P=>{R=P,R.forEach((F,x)=>{x.isValidDocument()||(k=k.add(F))})}).next(()=>l.localDocuments.getOverlayedDocuments(v,R)).next(P=>{p=P;const F=[];for(const x of c){const B=gE(x,p.get(x.key).overlayedDocument);B!=null&&F.push(new an(x.key,B,cf(B.value.mapValue),je.exists(!0)))}return l.mutationQueue.addMutationBatch(v,h,F,c)}).next(P=>{m=P;const F=P.applyToLocalDocumentSet(p,k);return l.documentOverlayCache.saveOverlays(v,P.batchId,F)})}).then(()=>({batchId:m.batchId,changes:Tf(p)}))}(r.localStore,e);r.sharedClientState.addPendingMutation(s.batchId),function(a,c,l){let h=a.Vu[a.currentUser.toKey()];h||(h=new ve(H)),h=h.insert(c,l),a.Vu[a.currentUser.toKey()]=h}(r,s.batchId,t),await Ts(r,s.changes),await lo(r.remoteStore)}catch(s){const i=bc(s,"Failed to persist write");t.reject(i)}}async function tp(n,e){const t=q(n);try{const r=await mT(t.localStore,e);e.targetChanges.forEach((s,i)=>{const a=t.Au.get(i);a&&(Z(s.addedDocuments.size+s.modifiedDocuments.size+s.removedDocuments.size<=1,22616),s.addedDocuments.size>0?a.hu=!0:s.modifiedDocuments.size>0?Z(a.hu,14607):s.removedDocuments.size>0&&(Z(a.hu,42227),a.hu=!1))}),await Ts(t,r,e)}catch(r){await ar(r)}}function vh(n,e,t){const r=q(n);if(r.isPrimaryClient&&t===0||!r.isPrimaryClient&&t===1){const s=[];r.Tu.forEach((i,a)=>{const c=a.view.va(e);c.snapshot&&s.push(c.snapshot)}),function(a,c){const l=q(a);l.onlineState=c;let h=!1;l.queries.forEach((f,p)=>{for(const m of p.Sa)m.va(c)&&(h=!0)}),h&&kc(l)}(r.eventManager,e),s.length&&r.Pu.H_(s),r.onlineState=e,r.isPrimaryClient&&r.sharedClientState.setOnlineState(e)}}async function sv(n,e,t){const r=q(n);r.sharedClientState.updateQueryState(e,"rejected",t);const s=r.Au.get(e),i=s&&s.key;if(i){let a=new ve(L.comparator);a=a.insert(i,Fe.newNoDocument(i,$.min()));const c=K().add(i),l=new oo($.min(),new Map,new ve(H),a,c);await tp(r,l),r.du=r.du.remove(i),r.Au.delete(e),Vc(r)}else await Va(r.localStore,e,!1).then(()=>xa(r,e,t)).catch(ar)}async function iv(n,e){const t=q(n),r=e.batch.batchId;try{const s=await _T(t.localStore,e);rp(t,r,null),np(t,r),t.sharedClientState.updateMutationState(r,"acknowledged"),await Ts(t,s)}catch(s){await ar(s)}}async function ov(n,e,t){const r=q(n);try{const s=await function(a,c){const l=q(a);return l.persistence.runTransaction("Reject batch","readwrite-primary",h=>{let f;return l.mutationQueue.lookupMutationBatch(h,c).next(p=>(Z(p!==null,37113),f=p.keys(),l.mutationQueue.removeMutationBatch(h,p))).next(()=>l.mutationQueue.performConsistencyCheck(h)).next(()=>l.documentOverlayCache.removeOverlaysForBatchId(h,f,c)).next(()=>l.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(h,f)).next(()=>l.localDocuments.getDocuments(h,f))})}(r.localStore,e);rp(r,e,t),np(r,e),r.sharedClientState.updateMutationState(e,"rejected",t),await Ts(r,s)}catch(s){await ar(s)}}function np(n,e){(n.mu.get(e)||[]).forEach(t=>{t.resolve()}),n.mu.delete(e)}function rp(n,e,t){const r=q(n);let s=r.Vu[r.currentUser.toKey()];if(s){const i=s.get(e);i&&(t?i.reject(t):i.resolve(),s=s.remove(e)),r.Vu[r.currentUser.toKey()]=s}}function xa(n,e,t=null){n.sharedClientState.removeLocalQueryTarget(e);for(const r of n.Iu.get(e))n.Tu.delete(r),t&&n.Pu.yu(r,t);n.Iu.delete(e),n.isPrimaryClient&&n.Ru.jr(e).forEach(r=>{n.Ru.containsKey(r)||sp(n,r)})}function sp(n,e){n.Eu.delete(e.path.canonicalString());const t=n.du.get(e);t!==null&&(wc(n.remoteStore,t),n.du=n.du.remove(e),n.Au.delete(t),Vc(n))}function Ih(n,e,t){for(const r of t)r instanceof Jf?(n.Ru.addReference(r.key,e),av(n,r)):r instanceof Zf?(M(Oc,"Document no longer in limbo: "+r.key),n.Ru.removeReference(r.key,e),n.Ru.containsKey(r.key)||sp(n,r.key)):U(19791,{wu:r})}function av(n,e){const t=e.key,r=t.path.canonicalString();n.du.get(t)||n.Eu.has(r)||(M(Oc,"New document in limbo: "+t),n.Eu.add(r),Vc(n))}function Vc(n){for(;n.Eu.size>0&&n.du.size<n.maxConcurrentLimboResolutions;){const e=n.Eu.values().next().value;n.Eu.delete(e);const t=new L(oe.fromString(e)),r=n.fu.next();n.Au.set(r,new YT(t)),n.du=n.du.insert(t,r),Hf(n.remoteStore,new Ht(gt(eo(t.path)),r,"TargetPurposeLimboResolution",Xi.ce))}}async function Ts(n,e,t){const r=q(n),s=[],i=[],a=[];r.Tu.isEmpty()||(r.Tu.forEach((c,l)=>{a.push(r.pu(l,e,t).then(h=>{var f;if((h||t)&&r.isPrimaryClient){const p=h?!h.fromCache:(f=t==null?void 0:t.targetChanges.get(l.targetId))==null?void 0:f.current;r.sharedClientState.updateQueryState(l.targetId,p?"current":"not-current")}if(h){s.push(h);const p=vc.As(l.targetId,h);i.push(p)}}))}),await Promise.all(a),r.Pu.H_(s),await async function(l,h){const f=q(l);try{await f.persistence.runTransaction("notifyLocalViewChanges","readwrite",p=>N.forEach(h,m=>N.forEach(m.Es,v=>f.persistence.referenceDelegate.addReference(p,m.targetId,v)).next(()=>N.forEach(m.ds,v=>f.persistence.referenceDelegate.removeReference(p,m.targetId,v)))))}catch(p){if(!cr(p))throw p;M(Ic,"Failed to update sequence numbers: "+p)}for(const p of h){const m=p.targetId;if(!p.fromCache){const v=f.Ms.get(m),R=v.snapshotVersion,k=v.withLastLimboFreeSnapshotVersion(R);f.Ms=f.Ms.insert(m,k)}}}(r.localStore,i))}async function cv(n,e){const t=q(n);if(!t.currentUser.isEqual(e)){M(Oc,"User change. New user:",e.toKey());const r=await $f(t.localStore,e);t.currentUser=e,function(i,a){i.mu.forEach(c=>{c.forEach(l=>{l.reject(new V(b.CANCELLED,a))})}),i.mu.clear()}(t,"'waitForPendingWrites' promise is rejected due to a user change."),t.sharedClientState.handleUserChange(e,r.removedBatchIds,r.addedBatchIds),await Ts(t,r.Ls)}}function lv(n,e){const t=q(n),r=t.Au.get(e);if(r&&r.hu)return K().add(r.key);{let s=K();const i=t.Iu.get(e);if(!i)return s;for(const a of i){const c=t.Tu.get(a);s=s.unionWith(c.view.nu)}return s}}function ip(n){const e=q(n);return e.remoteStore.remoteSyncer.applyRemoteEvent=tp.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=lv.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=sv.bind(null,e),e.Pu.H_=HT.bind(null,e.eventManager),e.Pu.yu=GT.bind(null,e.eventManager),e}function uv(n){const e=q(n);return e.remoteStore.remoteSyncer.applySuccessfulWrite=iv.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=ov.bind(null,e),e}class Ci{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=ao(e.databaseInfo.databaseId),this.sharedClientState=this.Du(e),this.persistence=this.Cu(e),await this.persistence.start(),this.localStore=this.vu(e),this.gcScheduler=this.Fu(e,this.localStore),this.indexBackfillerScheduler=this.Mu(e,this.localStore)}Fu(e,t){return null}Mu(e,t){return null}vu(e){return pT(this.persistence,new hT,e.initialUser,this.serializer)}Cu(e){return new qf(Tc.mi,this.serializer)}Du(e){return new vT}async terminate(){var e,t;(e=this.gcScheduler)==null||e.stop(),(t=this.indexBackfillerScheduler)==null||t.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}Ci.provider={build:()=>new Ci};class hv extends Ci{constructor(e){super(),this.cacheSizeBytes=e}Fu(e,t){Z(this.persistence.referenceDelegate instanceof wi,46915);const r=this.persistence.referenceDelegate.garbageCollector;return new YE(r,e.asyncQueue,t)}Cu(e){const t=this.cacheSizeBytes!==void 0?ze.withCacheSize(this.cacheSizeBytes):ze.DEFAULT;return new qf(r=>wi.mi(r,t),this.serializer)}}class Fa{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=r=>vh(this.syncEngine,r,1),this.remoteStore.remoteSyncer.handleCredentialChange=cv.bind(null,this.syncEngine),await jT(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return function(){return new zT}()}createDatastore(e){const t=ao(e.databaseInfo.databaseId),r=function(i){return new RT(i)}(e.databaseInfo);return function(i,a,c,l){return new NT(i,a,c,l)}(e.authCredentials,e.appCheckCredentials,r,t)}createRemoteStore(e){return function(r,s,i,a,c){return new DT(r,s,i,a,c)}(this.localStore,this.datastore,e.asyncQueue,t=>vh(this.syncEngine,t,0),function(){return _h.v()?new _h:new IT}())}createSyncEngine(e,t){return function(s,i,a,c,l,h,f){const p=new XT(s,i,a,c,l,h);return f&&(p.gu=!0),p}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){var e,t;await async function(s){const i=q(s);M(In,"RemoteStore shutting down."),i.Ea.add(5),await Es(i),i.Aa.shutdown(),i.Ra.set("Unknown")}(this.remoteStore),(e=this.datastore)==null||e.terminate(),(t=this.eventManager)==null||t.terminate()}}Fa.provider={build:()=>new Fa};/**
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
 */class Mc{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Ou(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Ou(this.observer.error,e):Vt("Uncaught Error in snapshot listener:",e.toString()))}Nu(){this.muted=!0}Ou(e,t){setTimeout(()=>{this.muted||e(t)},0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rn="FirestoreClient";class dv{constructor(e,t,r,s,i){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=r,this.databaseInfo=s,this.user=xe.UNAUTHENTICATED,this.clientId=lc.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=i,this.authCredentials.start(r,async a=>{M(rn,"Received user=",a.uid),await this.authCredentialListener(a),this.user=a}),this.appCheckCredentials.start(r,a=>(M(rn,"Received new app check token=",a),this.appCheckCredentialListener(a,this.user)))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this.databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();const e=new mt;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){const r=bc(t,"Failed to shutdown persistence");e.reject(r)}}),e.promise}}async function ra(n,e){n.asyncQueue.verifyOperationInProgress(),M(rn,"Initializing OfflineComponentProvider");const t=n.configuration;await e.initialize(t);let r=t.initialUser;n.setCredentialChangeListener(async s=>{r.isEqual(s)||(await $f(e.localStore,s),r=s)}),e.persistence.setDatabaseDeletedListener(()=>n.terminate()),n._offlineComponents=e}async function wh(n,e){n.asyncQueue.verifyOperationInProgress();const t=await fv(n);M(rn,"Initializing OnlineComponentProvider"),await e.initialize(t,n.configuration),n.setCredentialChangeListener(r=>gh(e.remoteStore,r)),n.setAppCheckTokenChangeListener((r,s)=>gh(e.remoteStore,s)),n._onlineComponents=e}async function fv(n){if(!n._offlineComponents)if(n._uninitializedComponentsProvider){M(rn,"Using user provided OfflineComponentProvider");try{await ra(n,n._uninitializedComponentsProvider._offline)}catch(e){const t=e;if(!function(s){return s.name==="FirebaseError"?s.code===b.FAILED_PRECONDITION||s.code===b.UNIMPLEMENTED:!(typeof DOMException<"u"&&s instanceof DOMException)||s.code===22||s.code===20||s.code===11}(t))throw t;Kn("Error using user provided cache. Falling back to memory cache: "+t),await ra(n,new Ci)}}else M(rn,"Using default OfflineComponentProvider"),await ra(n,new hv(void 0));return n._offlineComponents}async function Lc(n){return n._onlineComponents||(n._uninitializedComponentsProvider?(M(rn,"Using user provided OnlineComponentProvider"),await wh(n,n._uninitializedComponentsProvider._online)):(M(rn,"Using default OnlineComponentProvider"),await wh(n,new Fa))),n._onlineComponents}function pv(n){return Lc(n).then(e=>e.syncEngine)}function _v(n){return Lc(n).then(e=>e.datastore)}async function Ri(n){const e=await Lc(n),t=e.eventManager;return t.onListen=JT.bind(null,e.syncEngine),t.onUnlisten=tv.bind(null,e.syncEngine),t.onFirstRemoteStoreListen=ZT.bind(null,e.syncEngine),t.onLastRemoteStoreUnlisten=nv.bind(null,e.syncEngine),t}function mv(n,e,t={}){const r=new mt;return n.asyncQueue.enqueueAndForget(async()=>function(i,a,c,l,h){const f=new Mc({next:m=>{f.Nu(),a.enqueueAndForget(()=>Nc(i,p));const v=m.docs.has(c);!v&&m.fromCache?h.reject(new V(b.UNAVAILABLE,"Failed to get document because the client is offline.")):v&&m.fromCache&&l&&l.source==="server"?h.reject(new V(b.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):h.resolve(m)},error:m=>h.reject(m)}),p=new Dc(eo(c.path),f,{includeMetadataChanges:!0,qa:!0});return Pc(i,p)}(await Ri(n),n.asyncQueue,e,t,r)),r.promise}function gv(n,e,t={}){const r=new mt;return n.asyncQueue.enqueueAndForget(async()=>function(i,a,c,l,h){const f=new Mc({next:m=>{f.Nu(),a.enqueueAndForget(()=>Nc(i,p)),m.fromCache&&l.source==="server"?h.reject(new V(b.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):h.resolve(m)},error:m=>h.reject(m)}),p=new Dc(c,f,{includeMetadataChanges:!0,qa:!0});return Pc(i,p)}(await Ri(n),n.asyncQueue,e,t,r)),r.promise}function yv(n,e,t){const r=new mt;return n.asyncQueue.enqueueAndForget(async()=>{try{const s=await _v(n);r.resolve(async function(a,c,l){var k;const h=q(a),{request:f,gt:p,parent:m}=xE(h.serializer,nE(c),l);h.connection.$o||delete f.parent;const v=(await h.Ho("RunAggregationQuery",h.serializer.databaseId,m,f,1)).filter(P=>!!P.result);Z(v.length===1,64727);const R=(k=v[0].result)==null?void 0:k.aggregateFields;return Object.keys(R).reduce((P,F)=>(P[p[F]]=R[F],P),{})}(s,e,t))}catch(s){r.reject(s)}}),r.promise}/**
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
 */function op(n){const e={};return n.timeoutSeconds!==void 0&&(e.timeoutSeconds=n.timeoutSeconds),e}/**
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
 */const Ah=new Map;/**
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
 */const ap="firestore.googleapis.com",Ch=!0;class Rh{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new V(b.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=ap,this.ssl=Ch}else this.host=e.host,this.ssl=e.ssl??Ch;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e.cacheSizeBytes===void 0)this.cacheSizeBytes=Bf;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<KE)throw new V(b.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}Py("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=op(e.experimentalLongPollingOptions??{}),function(r){if(r.timeoutSeconds!==void 0){if(isNaN(r.timeoutSeconds))throw new V(b.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (must not be NaN)`);if(r.timeoutSeconds<5)throw new V(b.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (minimum allowed value is 5)`);if(r.timeoutSeconds>30)throw new V(b.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&function(r,s){return r.timeoutSeconds===s.timeoutSeconds}(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams}}class uo{constructor(e,t,r,s){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=r,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Rh({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new V(b.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new V(b.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Rh(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=function(r){if(!r)return new Ey;switch(r.type){case"firstParty":return new wy(r.sessionIndex||"0",r.iamToken||null,r.authTokenFactory||null);case"provider":return r.client;default:throw new V(b.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(t){const r=Ah.get(t);r&&(M("ComponentProvider","Removing Datastore"),Ah.delete(t),r.terminate())}(this),Promise.resolve()}}function Ev(n,e,t,r={}){var h;n=Ue(n,uo);const s=ut(e),i=n._getSettings(),a={...i,emulatorOptions:n._getEmulatorOptions()},c=`${e}:${t}`;s&&(Wi(`https://${c}`),zi("Firestore",!0)),i.host!==ap&&i.host!==c&&Kn("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const l={...i,host:c,ssl:s,emulatorOptions:r};if(!ns(l,a)&&(n._setSettings(l),r.mockUserToken)){let f,p;if(typeof r.mockUserToken=="string")f=r.mockUserToken,p=xe.MOCK_USER;else{f=ic(r.mockUserToken,(h=n._app)==null?void 0:h.options.projectId);const m=r.mockUserToken.sub||r.mockUserToken.user_id;if(!m)throw new V(b.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");p=new xe(m)}n._authCredentials=new Ty(new Qd(f,p))}}/**
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
 */class Ft{constructor(e,t,r){this.converter=t,this._query=r,this.type="query",this.firestore=e}withConverter(e){return new Ft(this.firestore,e,this._query)}}class he{constructor(e,t,r){this.converter=t,this._key=r,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Yt(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new he(this.firestore,e,this._key)}toJSON(){return{type:he._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,r){if(ms(t,he._jsonSchema))return new he(e,r||null,new L(oe.fromString(t.referencePath)))}}he._jsonSchemaVersion="firestore/documentReference/1.0",he._jsonSchema={type:Te("string",he._jsonSchemaVersion),referencePath:Te("string")};class Yt extends Ft{constructor(e,t,r){super(e,t,eo(r)),this._path=r,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new he(this.firestore,null,new L(e))}withConverter(e){return new Yt(this.firestore,e,this._path)}}function GR(n,e,...t){if(n=te(n),Yd("collection","path",e),n instanceof uo){const r=oe.fromString(e,...t);return Uu(r),new Yt(n,null,r)}{if(!(n instanceof he||n instanceof Yt))throw new V(b.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(oe.fromString(e,...t));return Uu(r),new Yt(n.firestore,null,r)}}function Tv(n,e,...t){if(n=te(n),arguments.length===1&&(e=lc.newId()),Yd("doc","path",e),n instanceof uo){const r=oe.fromString(e,...t);return Fu(r),new he(n,null,new L(r))}{if(!(n instanceof he||n instanceof Yt))throw new V(b.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(oe.fromString(e,...t));return Fu(r),new he(n.firestore,n instanceof Yt?n.converter:null,new L(r))}}/**
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
 */const Sh="AsyncQueue";class bh{constructor(e=Promise.resolve()){this.Xu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new Wf(this,"async_queue_retry"),this._c=()=>{const r=na();r&&M(Sh,"Visibility state changed to "+r.visibilityState),this.M_.w_()},this.ac=e;const t=na();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.uc(),this.cc(e)}enterRestrictedMode(e){if(!this.ec){this.ec=!0,this.sc=e||!1;const t=na();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this._c)}}enqueue(e){if(this.uc(),this.ec)return new Promise(()=>{});const t=new mt;return this.cc(()=>this.ec&&this.sc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise)).then(()=>t.promise)}enqueueRetryable(e){this.enqueueAndForget(()=>(this.Xu.push(e),this.lc()))}async lc(){if(this.Xu.length!==0){try{await this.Xu[0](),this.Xu.shift(),this.M_.reset()}catch(e){if(!cr(e))throw e;M(Sh,"Operation failed with retryable error: "+e)}this.Xu.length>0&&this.M_.p_(()=>this.lc())}}cc(e){const t=this.ac.then(()=>(this.rc=!0,e().catch(r=>{throw this.nc=r,this.rc=!1,Vt("INTERNAL UNHANDLED ERROR: ",Ph(r)),r}).then(r=>(this.rc=!1,r))));return this.ac=t,t}enqueueAfterDelay(e,t,r){this.uc(),this.oc.indexOf(e)>-1&&(t=0);const s=Sc.createAndSchedule(this,e,t,r,i=>this.hc(i));return this.tc.push(s),s}uc(){this.nc&&U(47125,{Pc:Ph(this.nc)})}verifyOperationInProgress(){}async Tc(){let e;do e=this.ac,await e;while(e!==this.ac)}Ic(e){for(const t of this.tc)if(t.timerId===e)return!0;return!1}Ec(e){return this.Tc().then(()=>{this.tc.sort((t,r)=>t.targetTimeMs-r.targetTimeMs);for(const t of this.tc)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.Tc()})}dc(e){this.oc.push(e)}hc(e){const t=this.tc.indexOf(e);this.tc.splice(t,1)}}function Ph(n){let e=n.message||"";return n.stack&&(e=n.stack.includes(n.message)?n.stack:n.message+`
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
 */function Nh(n){return function(t,r){if(typeof t!="object"||t===null)return!1;const s=t;for(const i of r)if(i in s&&typeof s[i]=="function")return!0;return!1}(n,["next","error","complete"])}class lt extends uo{constructor(e,t,r,s){super(e,t,r,s),this.type="firestore",this._queue=new bh,this._persistenceKey=(s==null?void 0:s.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new bh(e),this._firestoreClient=void 0,await e}}}function vv(n,e){const t=typeof n=="object"?n:Qi(),r=typeof n=="string"?n:e,s=Ki(t,"firestore").getImmediate({identifier:r});if(!s._initialized){const i=ji("firestore");i&&Ev(s,...i)}return s}function hr(n){if(n._terminated)throw new V(b.FAILED_PRECONDITION,"The client has already been terminated.");return n._firestoreClient||Iv(n),n._firestoreClient}function Iv(n){var r,s,i;const e=n._freezeSettings(),t=function(c,l,h,f){return new qy(c,l,h,f.host,f.ssl,f.experimentalForceLongPolling,f.experimentalAutoDetectLongPolling,op(f.experimentalLongPollingOptions),f.useFetchStreams,f.isUsingEmulator)}(n._databaseId,((r=n._app)==null?void 0:r.options.appId)||"",n._persistenceKey,e);n._componentsProvider||(s=e.localCache)!=null&&s._offlineComponentProvider&&((i=e.localCache)!=null&&i._onlineComponentProvider)&&(n._componentsProvider={_offline:e.localCache._offlineComponentProvider,_online:e.localCache._onlineComponentProvider}),n._firestoreClient=new dv(n._authCredentials,n._appCheckCredentials,n._queue,t,n._componentsProvider&&function(c){const l=c==null?void 0:c._online.build();return{_offline:c==null?void 0:c._offline.build(l),_online:l}}(n._componentsProvider))}/**
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
 */class wv{constructor(e="count",t){this._internalFieldPath=t,this.type="AggregateField",this.aggregateType=e}}class Av{constructor(e,t,r){this._userDataWriter=t,this._data=r,this.type="AggregateQuerySnapshot",this.query=e}data(){return this._userDataWriter.convertObjectMap(this._data)}}/**
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
 */class tt{constructor(e){this._byteString=e}static fromBase64String(e){try{return new tt(ke.fromBase64String(e))}catch(t){throw new V(b.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new tt(ke.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:tt._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(ms(e,tt._jsonSchema))return tt.fromBase64String(e.bytes)}}tt._jsonSchemaVersion="firestore/bytes/1.0",tt._jsonSchema={type:Te("string",tt._jsonSchemaVersion),bytes:Te("string")};/**
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
 */class dr{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new V(b.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new Pe(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}function KR(){return new dr(Ia)}/**
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
 */class ho{constructor(e){this._methodName=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Et{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new V(b.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new V(b.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return H(this._lat,e._lat)||H(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:Et._jsonSchemaVersion}}static fromJSON(e){if(ms(e,Et._jsonSchema))return new Et(e.latitude,e.longitude)}}Et._jsonSchemaVersion="firestore/geoPoint/1.0",Et._jsonSchema={type:Te("string",Et._jsonSchemaVersion),latitude:Te("number"),longitude:Te("number")};/**
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
 */class Tt{constructor(e){this._values=(e||[]).map(t=>t)}toArray(){return this._values.map(e=>e)}isEqual(e){return function(r,s){if(r.length!==s.length)return!1;for(let i=0;i<r.length;++i)if(r[i]!==s[i])return!1;return!0}(this._values,e._values)}toJSON(){return{type:Tt._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(ms(e,Tt._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every(t=>typeof t=="number"))return new Tt(e.vectorValues);throw new V(b.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}Tt._jsonSchemaVersion="firestore/vectorValue/1.0",Tt._jsonSchema={type:Te("string",Tt._jsonSchemaVersion),vectorValues:Te("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Cv=/^__.*__$/;class Rv{constructor(e,t,r){this.data=e,this.fieldMask=t,this.fieldTransforms=r}toMutation(e,t){return this.fieldMask!==null?new an(e,this.data,this.fieldMask,t,this.fieldTransforms):new gs(e,this.data,t,this.fieldTransforms)}}class cp{constructor(e,t,r){this.data=e,this.fieldMask=t,this.fieldTransforms=r}toMutation(e,t){return new an(e,this.data,this.fieldMask,t,this.fieldTransforms)}}function lp(n){switch(n){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw U(40011,{Ac:n})}}class xc{constructor(e,t,r,s,i,a){this.settings=e,this.databaseId=t,this.serializer=r,this.ignoreUndefinedProperties=s,i===void 0&&this.Rc(),this.fieldTransforms=i||[],this.fieldMask=a||[]}get path(){return this.settings.path}get Ac(){return this.settings.Ac}Vc(e){return new xc({...this.settings,...e},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}mc(e){var s;const t=(s=this.path)==null?void 0:s.child(e),r=this.Vc({path:t,fc:!1});return r.gc(e),r}yc(e){var s;const t=(s=this.path)==null?void 0:s.child(e),r=this.Vc({path:t,fc:!1});return r.Rc(),r}wc(e){return this.Vc({path:void 0,fc:!0})}Sc(e){return Si(e,this.settings.methodName,this.settings.bc||!1,this.path,this.settings.Dc)}contains(e){return this.fieldMask.find(t=>e.isPrefixOf(t))!==void 0||this.fieldTransforms.find(t=>e.isPrefixOf(t.field))!==void 0}Rc(){if(this.path)for(let e=0;e<this.path.length;e++)this.gc(this.path.get(e))}gc(e){if(e.length===0)throw this.Sc("Document fields must not be empty");if(lp(this.Ac)&&Cv.test(e))throw this.Sc('Document fields cannot begin and end with "__"')}}class Sv{constructor(e,t,r){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=r||ao(e)}Cc(e,t,r,s=!1){return new xc({Ac:e,methodName:t,Dc:r,path:Pe.emptyPath(),fc:!1,bc:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function vs(n){const e=n._freezeSettings(),t=ao(n._databaseId);return new Sv(n._databaseId,!!e.ignoreUndefinedProperties,t)}function Fc(n,e,t,r,s,i={}){const a=n.Cc(i.merge||i.mergeFields?2:0,e,t,s);Bc("Data must be an object, but it was:",a,r);const c=dp(r,a);let l,h;if(i.merge)l=new Ze(a.fieldMask),h=a.fieldTransforms;else if(i.mergeFields){const f=[];for(const p of i.mergeFields){const m=Ua(e,p,t);if(!a.contains(m))throw new V(b.INVALID_ARGUMENT,`Field '${m}' is specified in your field mask but missing from your input data.`);pp(f,m)||f.push(m)}l=new Ze(f),h=a.fieldTransforms.filter(p=>l.covers(p.field))}else l=null,h=a.fieldTransforms;return new Rv(new He(c),l,h)}class fo extends ho{_toFieldTransform(e){if(e.Ac!==2)throw e.Ac===1?e.Sc(`${this._methodName}() can only appear at the top level of your update data`):e.Sc(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof fo}}class Uc extends ho{_toFieldTransform(e){return new fE(e.path,new ls)}isEqual(e){return e instanceof Uc}}function up(n,e,t,r){const s=n.Cc(1,e,t);Bc("Data must be an object, but it was:",s,r);const i=[],a=He.empty();on(r,(l,h)=>{const f=qc(e,l,t);h=te(h);const p=s.yc(f);if(h instanceof fo)i.push(f);else{const m=Is(h,p);m!=null&&(i.push(f),a.set(f,m))}});const c=new Ze(i);return new cp(a,c,s.fieldTransforms)}function hp(n,e,t,r,s,i){const a=n.Cc(1,e,t),c=[Ua(e,r,t)],l=[s];if(i.length%2!=0)throw new V(b.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let m=0;m<i.length;m+=2)c.push(Ua(e,i[m])),l.push(i[m+1]);const h=[],f=He.empty();for(let m=c.length-1;m>=0;--m)if(!pp(h,c[m])){const v=c[m];let R=l[m];R=te(R);const k=a.yc(v);if(R instanceof fo)h.push(v);else{const P=Is(R,k);P!=null&&(h.push(v),f.set(v,P))}}const p=new Ze(h);return new cp(f,p,a.fieldTransforms)}function bv(n,e,t,r=!1){return Is(t,n.Cc(r?4:3,e))}function Is(n,e){if(fp(n=te(n)))return Bc("Unsupported field value:",e,n),dp(n,e);if(n instanceof ho)return function(r,s){if(!lp(s.Ac))throw s.Sc(`${r._methodName}() can only be used with update() and set()`);if(!s.path)throw s.Sc(`${r._methodName}() is not currently supported inside arrays`);const i=r._toFieldTransform(s);i&&s.fieldTransforms.push(i)}(n,e),null;if(n===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),n instanceof Array){if(e.settings.fc&&e.Ac!==4)throw e.Sc("Nested arrays are not supported");return function(r,s){const i=[];let a=0;for(const c of r){let l=Is(c,s.wc(a));l==null&&(l={nullValue:"NULL_VALUE"}),i.push(l),a++}return{arrayValue:{values:i}}}(n,e)}return function(r,s){if((r=te(r))===null)return{nullValue:"NULL_VALUE"};if(typeof r=="number")return uE(s.serializer,r);if(typeof r=="boolean")return{booleanValue:r};if(typeof r=="string")return{stringValue:r};if(r instanceof Date){const i=le.fromDate(r);return{timestampValue:Ii(s.serializer,i)}}if(r instanceof le){const i=new le(r.seconds,1e3*Math.floor(r.nanoseconds/1e3));return{timestampValue:Ii(s.serializer,i)}}if(r instanceof Et)return{geoPointValue:{latitude:r.latitude,longitude:r.longitude}};if(r instanceof tt)return{bytesValue:Df(s.serializer,r._byteString)};if(r instanceof he){const i=s.databaseId,a=r.firestore._databaseId;if(!a.isEqual(i))throw s.Sc(`Document reference is for database ${a.projectId}/${a.database} but should be for database ${i.projectId}/${i.database}`);return{referenceValue:yc(r.firestore._databaseId||s.databaseId,r._key.path)}}if(r instanceof Tt)return function(a,c){return{mapValue:{fields:{[of]:{stringValue:af},[yi]:{arrayValue:{values:a.toArray().map(h=>{if(typeof h!="number")throw c.Sc("VectorValues must only contain numeric values.");return _c(c.serializer,h)})}}}}}}(r,s);throw s.Sc(`Unsupported field value: ${Yi(r)}`)}(n,e)}function dp(n,e){const t={};return Zd(n)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):on(n,(r,s)=>{const i=Is(s,e.mc(r));i!=null&&(t[r]=i)}),{mapValue:{fields:t}}}function fp(n){return!(typeof n!="object"||n===null||n instanceof Array||n instanceof Date||n instanceof le||n instanceof Et||n instanceof tt||n instanceof he||n instanceof ho||n instanceof Tt)}function Bc(n,e,t){if(!fp(t)||!Xd(t)){const r=Yi(t);throw r==="an object"?e.Sc(n+" a custom object"):e.Sc(n+" "+r)}}function Ua(n,e,t){if((e=te(e))instanceof dr)return e._internalPath;if(typeof e=="string")return qc(n,e);throw Si("Field path arguments must be of type string or ",n,!1,void 0,t)}const Pv=new RegExp("[~\\*/\\[\\]]");function qc(n,e,t){if(e.search(Pv)>=0)throw Si(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,n,!1,void 0,t);try{return new dr(...e.split("."))._internalPath}catch{throw Si(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,n,!1,void 0,t)}}function Si(n,e,t,r,s){const i=r&&!r.isEmpty(),a=s!==void 0;let c=`Function ${e}() called with invalid data`;t&&(c+=" (via `toFirestore()`)"),c+=". ";let l="";return(i||a)&&(l+=" (found",i&&(l+=` in field ${r}`),a&&(l+=` in document ${s}`),l+=")"),new V(b.INVALID_ARGUMENT,c+n+l)}function pp(n,e){return n.some(t=>t.isEqual(e))}/**
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
 */class _p{constructor(e,t,r,s,i){this._firestore=e,this._userDataWriter=t,this._key=r,this._document=s,this._converter=i}get id(){return this._key.path.lastSegment()}get ref(){return new he(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new Nv(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}get(e){if(this._document){const t=this._document.data.field(po("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}}class Nv extends _p{data(){return super.data()}}function po(n,e){return typeof e=="string"?qc(n,e):e instanceof dr?e._internalPath:e._delegate._internalPath}/**
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
 */function mp(n){if(n.limitType==="L"&&n.explicitOrderBy.length===0)throw new V(b.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class $c{}class jc extends $c{}function QR(n,e,...t){let r=[];e instanceof $c&&r.push(e),r=r.concat(t),function(i){const a=i.filter(l=>l instanceof Wc).length,c=i.filter(l=>l instanceof _o).length;if(a>1||a>0&&c>0)throw new V(b.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")}(r);for(const s of r)n=s._apply(n);return n}class _o extends jc{constructor(e,t,r){super(),this._field=e,this._op=t,this._value=r,this.type="where"}static _create(e,t,r){return new _o(e,t,r)}_apply(e){const t=this._parse(e);return gp(e._query,t),new Ft(e.firestore,e.converter,Pa(e._query,t))}_parse(e){const t=vs(e.firestore);return function(i,a,c,l,h,f,p){let m;if(h.isKeyField()){if(f==="array-contains"||f==="array-contains-any")throw new V(b.INVALID_ARGUMENT,`Invalid Query. You can't perform '${f}' queries on documentId().`);if(f==="in"||f==="not-in"){Dh(p,f);const R=[];for(const k of p)R.push(kh(l,i,k));m={arrayValue:{values:R}}}else m=kh(l,i,p)}else f!=="in"&&f!=="not-in"&&f!=="array-contains-any"||Dh(p,f),m=bv(c,a,p,f==="in"||f==="not-in");return Ee.create(h,f,m)}(e._query,"where",t,e.firestore._databaseId,this._field,this._op,this._value)}}function YR(n,e,t){const r=e,s=po("where",n);return _o._create(s,r,t)}class Wc extends $c{constructor(e,t){super(),this.type=e,this._queryConstraints=t}static _create(e,t){return new Wc(e,t)}_parse(e){const t=this._queryConstraints.map(r=>r._parse(e)).filter(r=>r.getFilters().length>0);return t.length===1?t[0]:ct.create(t,this._getOperator())}_apply(e){const t=this._parse(e);return t.getFilters().length===0?e:(function(s,i){let a=s;const c=i.getFlattenedFilters();for(const l of c)gp(a,l),a=Pa(a,l)}(e._query,t),new Ft(e.firestore,e.converter,Pa(e._query,t)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}class zc extends jc{constructor(e,t){super(),this._field=e,this._direction=t,this.type="orderBy"}static _create(e,t){return new zc(e,t)}_apply(e){const t=function(s,i,a){if(s.startAt!==null)throw new V(b.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(s.endAt!==null)throw new V(b.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new cs(i,a)}(e._query,this._field,this._direction);return new Ft(e.firestore,e.converter,function(s,i){const a=s.explicitOrderBy.concat([i]);return new lr(s.path,s.collectionGroup,a,s.filters.slice(),s.limit,s.limitType,s.startAt,s.endAt)}(e._query,t))}}function XR(n,e="asc"){const t=e,r=po("orderBy",n);return zc._create(r,t)}class Hc extends jc{constructor(e,t,r){super(),this.type=e,this._limit=t,this._limitType=r}static _create(e,t,r){return new Hc(e,t,r)}_apply(e){return new Ft(e.firestore,e.converter,Ti(e._query,this._limit,this._limitType))}}function JR(n){return Hc._create("limit",n,"F")}function kh(n,e,t){if(typeof(t=te(t))=="string"){if(t==="")throw new V(b.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!_f(e)&&t.indexOf("/")!==-1)throw new V(b.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${t}' contains a '/' character.`);const r=e.path.child(oe.fromString(t));if(!L.isDocumentKey(r))throw new V(b.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${r}' is not because it has an odd number of segments (${r.length}).`);return Gu(n,new L(r))}if(t instanceof he)return Gu(n,t._key);throw new V(b.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${Yi(t)}.`)}function Dh(n,e){if(!Array.isArray(n)||n.length===0)throw new V(b.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`)}function gp(n,e){const t=function(s,i){for(const a of s)for(const c of a.getFlattenedFilters())if(i.indexOf(c.op)>=0)return c.op;return null}(n.filters,function(s){switch(s){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}}(e.op));if(t!==null)throw t===e.op?new V(b.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new V(b.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${t.toString()}' filters.`)}class kv{convertValue(e,t="none"){switch(tn(e)){case 0:return null;case 1:return e.booleanValue;case 2:return _e(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,t);case 5:return e.stringValue;case 6:return this.convertBytes(en(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,t);case 11:return this.convertObject(e.mapValue,t);case 10:return this.convertVectorValue(e.mapValue);default:throw U(62114,{value:e})}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){const r={};return on(e,(s,i)=>{r[s]=this.convertValue(i,t)}),r}convertVectorValue(e){var r,s,i;const t=(i=(s=(r=e.fields)==null?void 0:r[yi].arrayValue)==null?void 0:s.values)==null?void 0:i.map(a=>_e(a.doubleValue));return new Tt(t)}convertGeoPoint(e){return new Et(_e(e.latitude),_e(e.longitude))}convertArray(e,t){return(e.values||[]).map(r=>this.convertValue(r,t))}convertServerTimestamp(e,t){switch(t){case"previous":const r=Zi(e);return r==null?null:this.convertValue(r,t);case"estimate":return this.convertTimestamp(is(e));default:return null}}convertTimestamp(e){const t=Zt(e);return new le(t.seconds,t.nanos)}convertDocumentKey(e,t){const r=oe.fromString(e);Z(Uf(r),9688,{name:e});const s=new os(r.get(1),r.get(3)),i=new L(r.popFirst(5));return s.isEqual(t)||Vt(`Document ${i} contains a document reference within a different database (${s.projectId}/${s.database}) which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),i}}/**
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
 */function Gc(n,e,t){let r;return r=n?t&&(t.merge||t.mergeFields)?n.toFirestore(e,t):n.toFirestore(e):e,r}function Dv(){return new wv("count")}class qr{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class yn extends _p{constructor(e,t,r,s,i,a){super(e,t,r,s,a),this._firestore=e,this._firestoreImpl=e,this.metadata=i}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new li(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const r=this._document.data.field(po("DocumentSnapshot.get",e));if(r!==null)return this._userDataWriter.convertValue(r,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new V(b.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=yn._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}}yn._jsonSchemaVersion="firestore/documentSnapshot/1.0",yn._jsonSchema={type:Te("string",yn._jsonSchemaVersion),bundleSource:Te("string","DocumentSnapshot"),bundleName:Te("string"),bundle:Te("string")};class li extends yn{data(e={}){return super.data(e)}}class En{constructor(e,t,r,s){this._firestore=e,this._userDataWriter=t,this._snapshot=s,this.metadata=new qr(s.hasPendingWrites,s.fromCache),this.query=r}get docs(){const e=[];return this.forEach(t=>e.push(t)),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach(r=>{e.call(t,new li(this._firestore,this._userDataWriter,r.key,r,new qr(this._snapshot.mutatedKeys.has(r.key),this._snapshot.fromCache),this.query.converter))})}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new V(b.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=function(s,i){if(s._snapshot.oldDocs.isEmpty()){let a=0;return s._snapshot.docChanges.map(c=>{const l=new li(s._firestore,s._userDataWriter,c.doc.key,c.doc,new qr(s._snapshot.mutatedKeys.has(c.doc.key),s._snapshot.fromCache),s.query.converter);return c.doc,{type:"added",doc:l,oldIndex:-1,newIndex:a++}})}{let a=s._snapshot.oldDocs;return s._snapshot.docChanges.filter(c=>i||c.type!==3).map(c=>{const l=new li(s._firestore,s._userDataWriter,c.doc.key,c.doc,new qr(s._snapshot.mutatedKeys.has(c.doc.key),s._snapshot.fromCache),s.query.converter);let h=-1,f=-1;return c.type!==0&&(h=a.indexOf(c.doc.key),a=a.delete(c.doc.key)),c.type!==1&&(a=a.add(c.doc),f=a.indexOf(c.doc.key)),{type:Ov(c.type),doc:l,oldIndex:h,newIndex:f}})}}(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new V(b.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=En._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=lc.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],r=[],s=[];return this.docs.forEach(i=>{i._document!==null&&(t.push(i._document),r.push(this._userDataWriter.convertObjectMap(i._document.data.value.mapValue.fields,"previous")),s.push(i.ref.path))}),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function Ov(n){switch(n){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return U(61501,{type:n})}}/**
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
 */function ZR(n){n=Ue(n,he);const e=Ue(n.firestore,lt);return mv(hr(e),n._key).then(t=>yp(e,n,t))}En._jsonSchemaVersion="firestore/querySnapshot/1.0",En._jsonSchema={type:Te("string",En._jsonSchemaVersion),bundleSource:Te("string","QuerySnapshot"),bundleName:Te("string"),bundle:Te("string")};class mo extends kv{constructor(e){super(),this.firestore=e}convertBytes(e){return new tt(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new he(this.firestore,null,t)}}function eS(n){n=Ue(n,Ft);const e=Ue(n.firestore,lt),t=hr(e),r=new mo(e);return mp(n._query),gv(t,n._query).then(s=>new En(e,r,n,s))}function tS(n,e,t){n=Ue(n,he);const r=Ue(n.firestore,lt),s=Gc(n.converter,e,t);return ws(r,[Fc(vs(r),"setDoc",n._key,s,n.converter!==null,t).toMutation(n._key,je.none())])}function nS(n,e,t,...r){n=Ue(n,he);const s=Ue(n.firestore,lt),i=vs(s);let a;return a=typeof(e=te(e))=="string"||e instanceof dr?hp(i,"updateDoc",n._key,e,t,r):up(i,"updateDoc",n._key,e),ws(s,[a.toMutation(n._key,je.exists(!0))])}function rS(n){return ws(Ue(n.firestore,lt),[new io(n._key,je.none())])}function sS(n,e){const t=Ue(n.firestore,lt),r=Tv(n),s=Gc(n.converter,e);return ws(t,[Fc(vs(n.firestore),"addDoc",r._key,s,n.converter!==null,{}).toMutation(r._key,je.exists(!1))]).then(()=>r)}function iS(n,...e){var l,h,f;n=te(n);let t={includeMetadataChanges:!1,source:"default"},r=0;typeof e[r]!="object"||Nh(e[r])||(t=e[r++]);const s={includeMetadataChanges:t.includeMetadataChanges,source:t.source};if(Nh(e[r])){const p=e[r];e[r]=(l=p.next)==null?void 0:l.bind(p),e[r+1]=(h=p.error)==null?void 0:h.bind(p),e[r+2]=(f=p.complete)==null?void 0:f.bind(p)}let i,a,c;if(n instanceof he)a=Ue(n.firestore,lt),c=eo(n._key.path),i={next:p=>{e[r]&&e[r](yp(a,n,p))},error:e[r+1],complete:e[r+2]};else{const p=Ue(n,Ft);a=Ue(p.firestore,lt),c=p._query;const m=new mo(a);i={next:v=>{e[r]&&e[r](new En(a,m,p,v))},error:e[r+1],complete:e[r+2]},mp(n._query)}return function(m,v,R,k){const P=new Mc(k),F=new Dc(v,P,R);return m.asyncQueue.enqueueAndForget(async()=>Pc(await Ri(m),F)),()=>{P.Nu(),m.asyncQueue.enqueueAndForget(async()=>Nc(await Ri(m),F))}}(hr(a),c,s,i)}function ws(n,e){return function(r,s){const i=new mt;return r.asyncQueue.enqueueAndForget(async()=>rv(await pv(r),s,i)),i.promise}(hr(n),e)}function yp(n,e,t){const r=t.docs.get(e._key),s=new mo(n);return new yn(n,s,e._key,r,new qr(t.hasPendingWrites,t.fromCache),e.converter)}function oS(n){return Vv(n,{count:Dv()})}function Vv(n,e){const t=Ue(n.firestore,lt),r=hr(t),s=Uy(e,(i,a)=>new vE(a,i.aggregateType,i._internalFieldPath));return yv(r,n._query,s).then(i=>function(c,l,h){const f=new mo(c);return new Av(l,f,h)}(t,n,i))}/**
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
 */class Mv{constructor(e,t){this._firestore=e,this._commitHandler=t,this._mutations=[],this._committed=!1,this._dataReader=vs(e)}set(e,t,r){this._verifyNotCommitted();const s=sa(e,this._firestore),i=Gc(s.converter,t,r),a=Fc(this._dataReader,"WriteBatch.set",s._key,i,s.converter!==null,r);return this._mutations.push(a.toMutation(s._key,je.none())),this}update(e,t,r,...s){this._verifyNotCommitted();const i=sa(e,this._firestore);let a;return a=typeof(t=te(t))=="string"||t instanceof dr?hp(this._dataReader,"WriteBatch.update",i._key,t,r,s):up(this._dataReader,"WriteBatch.update",i._key,t),this._mutations.push(a.toMutation(i._key,je.exists(!0))),this}delete(e){this._verifyNotCommitted();const t=sa(e,this._firestore);return this._mutations=this._mutations.concat(new io(t._key,je.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new V(b.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function sa(n,e){if((n=te(n)).firestore!==e)throw new V(b.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return n}function aS(){return new Uc("serverTimestamp")}/**
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
 */function cS(n){return hr(n=Ue(n,lt)),new Mv(n,e=>ws(n,e))}(function(e,t=!0){(function(s){or=s})(ir),Ot(new vt("firestore",(r,{instanceIdentifier:s,options:i})=>{const a=r.getProvider("app").getImmediate(),c=new lt(new vy(r.getProvider("auth-internal")),new Ay(a,r.getProvider("app-check-internal")),function(h,f){if(!Object.prototype.hasOwnProperty.apply(h.options,["projectId"]))throw new V(b.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new os(h.options.projectId,f)}(a,s),a);return i={useFetchStreams:t,...i},c._setSettings(i),c},"PUBLIC").setMultipleInstances(!0)),Qe(Mu,Lu,e),Qe(Mu,Lu,"esm2020")})();/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ep="firebasestorage.googleapis.com",Tp="storageBucket",Lv=2*60*1e3,xv=10*60*1e3;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fe extends wt{constructor(e,t,r=0){super(ia(e),`Firebase Storage: ${t} (${ia(e)})`),this.status_=r,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,fe.prototype)}get status(){return this.status_}set status(e){this.status_=e}_codeEquals(e){return ia(e)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(e){this.customData.serverResponse=e,this.customData.serverResponse?this.message=`${this._baseMessage}
${this.customData.serverResponse}`:this.message=this._baseMessage}}var de;(function(n){n.UNKNOWN="unknown",n.OBJECT_NOT_FOUND="object-not-found",n.BUCKET_NOT_FOUND="bucket-not-found",n.PROJECT_NOT_FOUND="project-not-found",n.QUOTA_EXCEEDED="quota-exceeded",n.UNAUTHENTICATED="unauthenticated",n.UNAUTHORIZED="unauthorized",n.UNAUTHORIZED_APP="unauthorized-app",n.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",n.INVALID_CHECKSUM="invalid-checksum",n.CANCELED="canceled",n.INVALID_EVENT_NAME="invalid-event-name",n.INVALID_URL="invalid-url",n.INVALID_DEFAULT_BUCKET="invalid-default-bucket",n.NO_DEFAULT_BUCKET="no-default-bucket",n.CANNOT_SLICE_BLOB="cannot-slice-blob",n.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",n.NO_DOWNLOAD_URL="no-download-url",n.INVALID_ARGUMENT="invalid-argument",n.INVALID_ARGUMENT_COUNT="invalid-argument-count",n.APP_DELETED="app-deleted",n.INVALID_ROOT_OPERATION="invalid-root-operation",n.INVALID_FORMAT="invalid-format",n.INTERNAL_ERROR="internal-error",n.UNSUPPORTED_ENVIRONMENT="unsupported-environment"})(de||(de={}));function ia(n){return"storage/"+n}function Kc(){const n="An unknown error occurred, please check the error payload for server response.";return new fe(de.UNKNOWN,n)}function Fv(n){return new fe(de.OBJECT_NOT_FOUND,"Object '"+n+"' does not exist.")}function Uv(n){return new fe(de.QUOTA_EXCEEDED,"Quota for bucket '"+n+"' exceeded, please view quota on https://firebase.google.com/pricing/.")}function Bv(){const n="User is not authenticated, please authenticate using Firebase Authentication and try again.";return new fe(de.UNAUTHENTICATED,n)}function qv(){return new fe(de.UNAUTHORIZED_APP,"This app does not have permission to access Firebase Storage on this project.")}function $v(n){return new fe(de.UNAUTHORIZED,"User does not have permission to access '"+n+"'.")}function jv(){return new fe(de.RETRY_LIMIT_EXCEEDED,"Max retry time for operation exceeded, please try again.")}function Wv(){return new fe(de.CANCELED,"User canceled the upload/download.")}function zv(n){return new fe(de.INVALID_URL,"Invalid URL '"+n+"'.")}function Hv(n){return new fe(de.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+n+"'.")}function Gv(){return new fe(de.NO_DEFAULT_BUCKET,"No default bucket found. Did you set the '"+Tp+"' property when initializing the app?")}function Kv(){return new fe(de.CANNOT_SLICE_BLOB,"Cannot slice blob for upload. Please retry the upload.")}function Qv(){return new fe(de.NO_DOWNLOAD_URL,"The given file does not have any download URLs.")}function Yv(n){return new fe(de.UNSUPPORTED_ENVIRONMENT,`${n} is missing. Make sure to install the required polyfills. See https://firebase.google.com/docs/web/environments-js-sdk#polyfills for more information.`)}function Ba(n){return new fe(de.INVALID_ARGUMENT,n)}function vp(){return new fe(de.APP_DELETED,"The Firebase app was deleted.")}function Xv(n){return new fe(de.INVALID_ROOT_OPERATION,"The operation '"+n+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}function Kr(n,e){return new fe(de.INVALID_FORMAT,"String does not match format '"+n+"': "+e)}function Or(n){throw new fe(de.INTERNAL_ERROR,"Internal error: "+n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class et{constructor(e,t){this.bucket=e,this.path_=t}get path(){return this.path_}get isRoot(){return this.path.length===0}fullServerUrl(){const e=encodeURIComponent;return"/b/"+e(this.bucket)+"/o/"+e(this.path)}bucketOnlyServerUrl(){return"/b/"+encodeURIComponent(this.bucket)+"/o"}static makeFromBucketSpec(e,t){let r;try{r=et.makeFromUrl(e,t)}catch{return new et(e,"")}if(r.path==="")return r;throw Hv(e)}static makeFromUrl(e,t){let r=null;const s="([A-Za-z0-9.\\-_]+)";function i(j){j.path.charAt(j.path.length-1)==="/"&&(j.path_=j.path_.slice(0,-1))}const a="(/(.*))?$",c=new RegExp("^gs://"+s+a,"i"),l={bucket:1,path:3};function h(j){j.path_=decodeURIComponent(j.path)}const f="v[A-Za-z0-9_]+",p=t.replace(/[.]/g,"\\."),m="(/([^?#]*).*)?$",v=new RegExp(`^https?://${p}/${f}/b/${s}/o${m}`,"i"),R={bucket:1,path:3},k=t===Ep?"(?:storage.googleapis.com|storage.cloud.google.com)":t,P="([^?#]*)",F=new RegExp(`^https?://${k}/${s}/${P}`,"i"),B=[{regex:c,indices:l,postModify:i},{regex:v,indices:R,postModify:h},{regex:F,indices:{bucket:1,path:2},postModify:h}];for(let j=0;j<B.length;j++){const We=B[j],pe=We.regex.exec(e);if(pe){const w=pe[We.indices.bucket];let g=pe[We.indices.path];g||(g=""),r=new et(w,g),We.postModify(r);break}}if(r==null)throw zv(e);return r}}class Jv{constructor(e){this.promise_=Promise.reject(e)}getPromise(){return this.promise_}cancel(e=!1){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zv(n,e,t){let r=1,s=null,i=null,a=!1,c=0;function l(){return c===2}let h=!1;function f(...P){h||(h=!0,e.apply(null,P))}function p(P){s=setTimeout(()=>{s=null,n(v,l())},P)}function m(){i&&clearTimeout(i)}function v(P,...F){if(h){m();return}if(P){m(),f.call(null,P,...F);return}if(l()||a){m(),f.call(null,P,...F);return}r<64&&(r*=2);let B;c===1?(c=2,B=0):B=(r+Math.random())*1e3,p(B)}let R=!1;function k(P){R||(R=!0,m(),!h&&(s!==null?(P||(c=2),clearTimeout(s),p(0)):P||(c=1)))}return p(0),i=setTimeout(()=>{a=!0,k(!0)},t),k}function eI(n){n(!1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function tI(n){return n!==void 0}function nI(n){return typeof n=="object"&&!Array.isArray(n)}function Qc(n){return typeof n=="string"||n instanceof String}function Oh(n){return Yc()&&n instanceof Blob}function Yc(){return typeof Blob<"u"}function Vh(n,e,t,r){if(r<e)throw Ba(`Invalid value for '${n}'. Expected ${e} or greater.`);if(r>t)throw Ba(`Invalid value for '${n}'. Expected ${t} or less.`)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xc(n,e,t){let r=e;return t==null&&(r=`https://${e}`),`${t}://${r}/v0${n}`}function Ip(n){const e=encodeURIComponent;let t="?";for(const r in n)if(n.hasOwnProperty(r)){const s=e(r)+"="+e(n[r]);t=t+s+"&"}return t=t.slice(0,-1),t}var Tn;(function(n){n[n.NO_ERROR=0]="NO_ERROR",n[n.NETWORK_ERROR=1]="NETWORK_ERROR",n[n.ABORT=2]="ABORT"})(Tn||(Tn={}));/**
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
 */function rI(n,e){const t=n>=500&&n<600,s=[408,429].indexOf(n)!==-1,i=e.indexOf(n)!==-1;return t||s||i}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sI{constructor(e,t,r,s,i,a,c,l,h,f,p,m=!0,v=!1){this.url_=e,this.method_=t,this.headers_=r,this.body_=s,this.successCodes_=i,this.additionalRetryCodes_=a,this.callback_=c,this.errorCallback_=l,this.timeout_=h,this.progressCallback_=f,this.connectionFactory_=p,this.retry=m,this.isUsingEmulator=v,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((R,k)=>{this.resolve_=R,this.reject_=k,this.start_()})}start_(){const e=(r,s)=>{if(s){r(!1,new Zs(!1,null,!0));return}const i=this.connectionFactory_();this.pendingConnection_=i;const a=c=>{const l=c.loaded,h=c.lengthComputable?c.total:-1;this.progressCallback_!==null&&this.progressCallback_(l,h)};this.progressCallback_!==null&&i.addUploadProgressListener(a),i.send(this.url_,this.method_,this.isUsingEmulator,this.body_,this.headers_).then(()=>{this.progressCallback_!==null&&i.removeUploadProgressListener(a),this.pendingConnection_=null;const c=i.getErrorCode()===Tn.NO_ERROR,l=i.getStatus();if(!c||rI(l,this.additionalRetryCodes_)&&this.retry){const f=i.getErrorCode()===Tn.ABORT;r(!1,new Zs(!1,null,f));return}const h=this.successCodes_.indexOf(l)!==-1;r(!0,new Zs(h,i))})},t=(r,s)=>{const i=this.resolve_,a=this.reject_,c=s.connection;if(s.wasSuccessCode)try{const l=this.callback_(c,c.getResponse());tI(l)?i(l):i()}catch(l){a(l)}else if(c!==null){const l=Kc();l.serverResponse=c.getErrorText(),this.errorCallback_?a(this.errorCallback_(c,l)):a(l)}else if(s.canceled){const l=this.appDelete_?vp():Wv();a(l)}else{const l=jv();a(l)}};this.canceled_?t(!1,new Zs(!1,null,!0)):this.backoffId_=Zv(e,t,this.timeout_)}getPromise(){return this.promise_}cancel(e){this.canceled_=!0,this.appDelete_=e||!1,this.backoffId_!==null&&eI(this.backoffId_),this.pendingConnection_!==null&&this.pendingConnection_.abort()}}class Zs{constructor(e,t,r){this.wasSuccessCode=e,this.connection=t,this.canceled=!!r}}function iI(n,e){e!==null&&e.length>0&&(n.Authorization="Firebase "+e)}function oI(n,e){n["X-Firebase-Storage-Version"]="webjs/"+(e??"AppManager")}function aI(n,e){e&&(n["X-Firebase-GMPID"]=e)}function cI(n,e){e!==null&&(n["X-Firebase-AppCheck"]=e)}function lI(n,e,t,r,s,i,a=!0,c=!1){const l=Ip(n.urlParams),h=n.url+l,f=Object.assign({},n.headers);return aI(f,e),iI(f,t),oI(f,i),cI(f,r),new sI(h,n.method,f,n.body,n.successCodes,n.additionalRetryCodes,n.handler,n.errorHandler,n.timeout,n.progressCallback,s,a,c)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function uI(){return typeof BlobBuilder<"u"?BlobBuilder:typeof WebKitBlobBuilder<"u"?WebKitBlobBuilder:void 0}function hI(...n){const e=uI();if(e!==void 0){const t=new e;for(let r=0;r<n.length;r++)t.append(n[r]);return t.getBlob()}else{if(Yc())return new Blob(n);throw new fe(de.UNSUPPORTED_ENVIRONMENT,"This browser doesn't seem to support creating Blobs")}}function dI(n,e,t){return n.webkitSlice?n.webkitSlice(e,t):n.mozSlice?n.mozSlice(e,t):n.slice?n.slice(e,t):null}/**
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
 */function fI(n){if(typeof atob>"u")throw Yv("base-64");return atob(n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ft={RAW:"raw",BASE64:"base64",BASE64URL:"base64url",DATA_URL:"data_url"};class oa{constructor(e,t){this.data=e,this.contentType=t||null}}function pI(n,e){switch(n){case ft.RAW:return new oa(wp(e));case ft.BASE64:case ft.BASE64URL:return new oa(Ap(n,e));case ft.DATA_URL:return new oa(mI(e),gI(e))}throw Kc()}function wp(n){const e=[];for(let t=0;t<n.length;t++){let r=n.charCodeAt(t);if(r<=127)e.push(r);else if(r<=2047)e.push(192|r>>6,128|r&63);else if((r&64512)===55296)if(!(t<n.length-1&&(n.charCodeAt(t+1)&64512)===56320))e.push(239,191,189);else{const i=r,a=n.charCodeAt(++t);r=65536|(i&1023)<<10|a&1023,e.push(240|r>>18,128|r>>12&63,128|r>>6&63,128|r&63)}else(r&64512)===56320?e.push(239,191,189):e.push(224|r>>12,128|r>>6&63,128|r&63)}return new Uint8Array(e)}function _I(n){let e;try{e=decodeURIComponent(n)}catch{throw Kr(ft.DATA_URL,"Malformed data URL.")}return wp(e)}function Ap(n,e){switch(n){case ft.BASE64:{const s=e.indexOf("-")!==-1,i=e.indexOf("_")!==-1;if(s||i)throw Kr(n,"Invalid character '"+(s?"-":"_")+"' found: is it base64url encoded?");break}case ft.BASE64URL:{const s=e.indexOf("+")!==-1,i=e.indexOf("/")!==-1;if(s||i)throw Kr(n,"Invalid character '"+(s?"+":"/")+"' found: is it base64 encoded?");e=e.replace(/-/g,"+").replace(/_/g,"/");break}}let t;try{t=fI(e)}catch(s){throw s.message.includes("polyfill")?s:Kr(n,"Invalid character found")}const r=new Uint8Array(t.length);for(let s=0;s<t.length;s++)r[s]=t.charCodeAt(s);return r}class Cp{constructor(e){this.base64=!1,this.contentType=null;const t=e.match(/^data:([^,]+)?,/);if(t===null)throw Kr(ft.DATA_URL,"Must be formatted 'data:[<mediatype>][;base64],<data>");const r=t[1]||null;r!=null&&(this.base64=yI(r,";base64"),this.contentType=this.base64?r.substring(0,r.length-7):r),this.rest=e.substring(e.indexOf(",")+1)}}function mI(n){const e=new Cp(n);return e.base64?Ap(ft.BASE64,e.rest):_I(e.rest)}function gI(n){return new Cp(n).contentType}function yI(n,e){return n.length>=e.length?n.substring(n.length-e.length)===e:!1}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zt{constructor(e,t){let r=0,s="";Oh(e)?(this.data_=e,r=e.size,s=e.type):e instanceof ArrayBuffer?(t?this.data_=new Uint8Array(e):(this.data_=new Uint8Array(e.byteLength),this.data_.set(new Uint8Array(e))),r=this.data_.length):e instanceof Uint8Array&&(t?this.data_=e:(this.data_=new Uint8Array(e.length),this.data_.set(e)),r=e.length),this.size_=r,this.type_=s}size(){return this.size_}type(){return this.type_}slice(e,t){if(Oh(this.data_)){const r=this.data_,s=dI(r,e,t);return s===null?null:new zt(s)}else{const r=new Uint8Array(this.data_.buffer,e,t-e);return new zt(r,!0)}}static getBlob(...e){if(Yc()){const t=e.map(r=>r instanceof zt?r.data_:r);return new zt(hI.apply(null,t))}else{const t=e.map(a=>Qc(a)?pI(ft.RAW,a).data:a.data_);let r=0;t.forEach(a=>{r+=a.byteLength});const s=new Uint8Array(r);let i=0;return t.forEach(a=>{for(let c=0;c<a.length;c++)s[i++]=a[c]}),new zt(s,!0)}}uploadData(){return this.data_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Rp(n){let e;try{e=JSON.parse(n)}catch{return null}return nI(e)?e:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function EI(n){if(n.length===0)return null;const e=n.lastIndexOf("/");return e===-1?"":n.slice(0,e)}function TI(n,e){const t=e.split("/").filter(r=>r.length>0).join("/");return n.length===0?t:n+"/"+t}function Sp(n){const e=n.lastIndexOf("/",n.length-2);return e===-1?n:n.slice(e+1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function vI(n,e){return e}class $e{constructor(e,t,r,s){this.server=e,this.local=t||e,this.writable=!!r,this.xform=s||vI}}let ei=null;function II(n){return!Qc(n)||n.length<2?n:Sp(n)}function bp(){if(ei)return ei;const n=[];n.push(new $e("bucket")),n.push(new $e("generation")),n.push(new $e("metageneration")),n.push(new $e("name","fullPath",!0));function e(i,a){return II(a)}const t=new $e("name");t.xform=e,n.push(t);function r(i,a){return a!==void 0?Number(a):a}const s=new $e("size");return s.xform=r,n.push(s),n.push(new $e("timeCreated")),n.push(new $e("updated")),n.push(new $e("md5Hash",null,!0)),n.push(new $e("cacheControl",null,!0)),n.push(new $e("contentDisposition",null,!0)),n.push(new $e("contentEncoding",null,!0)),n.push(new $e("contentLanguage",null,!0)),n.push(new $e("contentType",null,!0)),n.push(new $e("metadata","customMetadata",!0)),ei=n,ei}function wI(n,e){function t(){const r=n.bucket,s=n.fullPath,i=new et(r,s);return e._makeStorageReference(i)}Object.defineProperty(n,"ref",{get:t})}function AI(n,e,t){const r={};r.type="file";const s=t.length;for(let i=0;i<s;i++){const a=t[i];r[a.local]=a.xform(r,e[a.server])}return wI(r,n),r}function Pp(n,e,t){const r=Rp(e);return r===null?null:AI(n,r,t)}function CI(n,e,t,r){const s=Rp(e);if(s===null||!Qc(s.downloadTokens))return null;const i=s.downloadTokens;if(i.length===0)return null;const a=encodeURIComponent;return i.split(",").map(h=>{const f=n.bucket,p=n.fullPath,m="/b/"+a(f)+"/o/"+a(p),v=Xc(m,t,r),R=Ip({alt:"media",token:h});return v+R})[0]}function RI(n,e){const t={},r=e.length;for(let s=0;s<r;s++){const i=e[s];i.writable&&(t[i.server]=n[i.local])}return JSON.stringify(t)}class Np{constructor(e,t,r,s){this.url=e,this.method=t,this.handler=r,this.timeout=s,this.urlParams={},this.headers={},this.body=null,this.errorHandler=null,this.progressCallback=null,this.successCodes=[200],this.additionalRetryCodes=[]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function kp(n){if(!n)throw Kc()}function SI(n,e){function t(r,s){const i=Pp(n,s,e);return kp(i!==null),i}return t}function bI(n,e){function t(r,s){const i=Pp(n,s,e);return kp(i!==null),CI(i,s,n.host,n._protocol)}return t}function Dp(n){function e(t,r){let s;return t.getStatus()===401?t.getErrorText().includes("Firebase App Check token is invalid")?s=qv():s=Bv():t.getStatus()===402?s=Uv(n.bucket):t.getStatus()===403?s=$v(n.path):s=r,s.status=t.getStatus(),s.serverResponse=r.serverResponse,s}return e}function PI(n){const e=Dp(n);function t(r,s){let i=e(r,s);return r.getStatus()===404&&(i=Fv(n.path)),i.serverResponse=s.serverResponse,i}return t}function NI(n,e,t){const r=e.fullServerUrl(),s=Xc(r,n.host,n._protocol),i="GET",a=n.maxOperationRetryTime,c=new Np(s,i,bI(n,t),a);return c.errorHandler=PI(e),c}function kI(n,e){return n&&n.contentType||e&&e.type()||"application/octet-stream"}function DI(n,e,t){const r=Object.assign({},t);return r.fullPath=n.path,r.size=e.size(),r.contentType||(r.contentType=kI(null,e)),r}function OI(n,e,t,r,s){const i=e.bucketOnlyServerUrl(),a={"X-Goog-Upload-Protocol":"multipart"};function c(){let B="";for(let j=0;j<2;j++)B=B+Math.random().toString().slice(2);return B}const l=c();a["Content-Type"]="multipart/related; boundary="+l;const h=DI(e,r,s),f=RI(h,t),p="--"+l+`\r
Content-Type: application/json; charset=utf-8\r
\r
`+f+`\r
--`+l+`\r
Content-Type: `+h.contentType+`\r
\r
`,m=`\r
--`+l+"--",v=zt.getBlob(p,r,m);if(v===null)throw Kv();const R={name:h.fullPath},k=Xc(i,n.host,n._protocol),P="POST",F=n.maxUploadRetryTime,x=new Np(k,P,SI(n,t),F);return x.urlParams=R,x.headers=a,x.body=v.uploadData(),x.errorHandler=Dp(e),x}class VI{constructor(){this.sent_=!1,this.xhr_=new XMLHttpRequest,this.initXhr(),this.errorCode_=Tn.NO_ERROR,this.sendPromise_=new Promise(e=>{this.xhr_.addEventListener("abort",()=>{this.errorCode_=Tn.ABORT,e()}),this.xhr_.addEventListener("error",()=>{this.errorCode_=Tn.NETWORK_ERROR,e()}),this.xhr_.addEventListener("load",()=>{e()})})}send(e,t,r,s,i){if(this.sent_)throw Or("cannot .send() more than once");if(ut(e)&&r&&(this.xhr_.withCredentials=!0),this.sent_=!0,this.xhr_.open(t,e,!0),i!==void 0)for(const a in i)i.hasOwnProperty(a)&&this.xhr_.setRequestHeader(a,i[a].toString());return s!==void 0?this.xhr_.send(s):this.xhr_.send(),this.sendPromise_}getErrorCode(){if(!this.sent_)throw Or("cannot .getErrorCode() before sending");return this.errorCode_}getStatus(){if(!this.sent_)throw Or("cannot .getStatus() before sending");try{return this.xhr_.status}catch{return-1}}getResponse(){if(!this.sent_)throw Or("cannot .getResponse() before sending");return this.xhr_.response}getErrorText(){if(!this.sent_)throw Or("cannot .getErrorText() before sending");return this.xhr_.statusText}abort(){this.xhr_.abort()}getResponseHeader(e){return this.xhr_.getResponseHeader(e)}addUploadProgressListener(e){this.xhr_.upload!=null&&this.xhr_.upload.addEventListener("progress",e)}removeUploadProgressListener(e){this.xhr_.upload!=null&&this.xhr_.upload.removeEventListener("progress",e)}}class MI extends VI{initXhr(){this.xhr_.responseType="text"}}function Op(){return new MI}/**
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
 */class wn{constructor(e,t){this._service=e,t instanceof et?this._location=t:this._location=et.makeFromUrl(t,e.host)}toString(){return"gs://"+this._location.bucket+"/"+this._location.path}_newRef(e,t){return new wn(e,t)}get root(){const e=new et(this._location.bucket,"");return this._newRef(this._service,e)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return Sp(this._location.path)}get storage(){return this._service}get parent(){const e=EI(this._location.path);if(e===null)return null;const t=new et(this._location.bucket,e);return new wn(this._service,t)}_throwIfRoot(e){if(this._location.path==="")throw Xv(e)}}function LI(n,e,t){n._throwIfRoot("uploadBytes");const r=OI(n.storage,n._location,bp(),new zt(e,!0),t);return n.storage.makeRequestWithTokens(r,Op).then(s=>({metadata:s,ref:n}))}function xI(n){n._throwIfRoot("getDownloadURL");const e=NI(n.storage,n._location,bp());return n.storage.makeRequestWithTokens(e,Op).then(t=>{if(t===null)throw Qv();return t})}function FI(n,e){const t=TI(n._location.path,e),r=new et(n._location.bucket,t);return new wn(n.storage,r)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function UI(n){return/^[A-Za-z]+:\/\//.test(n)}function BI(n,e){return new wn(n,e)}function Vp(n,e){if(n instanceof Jc){const t=n;if(t._bucket==null)throw Gv();const r=new wn(t,t._bucket);return e!=null?Vp(r,e):r}else return e!==void 0?FI(n,e):n}function qI(n,e){if(e&&UI(e)){if(n instanceof Jc)return BI(n,e);throw Ba("To use ref(service, url), the first argument must be a Storage instance.")}else return Vp(n,e)}function Mh(n,e){const t=e==null?void 0:e[Tp];return t==null?null:et.makeFromBucketSpec(t,n)}function $I(n,e,t,r={}){n.host=`${e}:${t}`;const s=ut(e);s&&(Wi(`https://${n.host}/b`),zi("Storage",!0)),n._isUsingEmulator=!0,n._protocol=s?"https":"http";const{mockUserToken:i}=r;i&&(n._overrideAuthToken=typeof i=="string"?i:ic(i,n.app.options.projectId))}class Jc{constructor(e,t,r,s,i,a=!1){this.app=e,this._authProvider=t,this._appCheckProvider=r,this._url=s,this._firebaseVersion=i,this._isUsingEmulator=a,this._bucket=null,this._host=Ep,this._protocol="https",this._appId=null,this._deleted=!1,this._maxOperationRetryTime=Lv,this._maxUploadRetryTime=xv,this._requests=new Set,s!=null?this._bucket=et.makeFromBucketSpec(s,this._host):this._bucket=Mh(this._host,this.app.options)}get host(){return this._host}set host(e){this._host=e,this._url!=null?this._bucket=et.makeFromBucketSpec(this._url,e):this._bucket=Mh(e,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(e){Vh("time",0,Number.POSITIVE_INFINITY,e),this._maxUploadRetryTime=e}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(e){Vh("time",0,Number.POSITIVE_INFINITY,e),this._maxOperationRetryTime=e}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;const e=this._authProvider.getImmediate({optional:!0});if(e){const t=await e.getToken();if(t!==null)return t.accessToken}return null}async _getAppCheckToken(){if(dt(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=this._appCheckProvider.getImmediate({optional:!0});return e?(await e.getToken()).token:null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(e=>e.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(e){return new wn(this,e)}_makeRequest(e,t,r,s,i=!0){if(this._deleted)return new Jv(vp());{const a=lI(e,this._appId,r,s,t,this._firebaseVersion,i,this._isUsingEmulator);return this._requests.add(a),a.getPromise().then(()=>this._requests.delete(a),()=>this._requests.delete(a)),a}}async makeRequestWithTokens(e,t){const[r,s]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(e,t,r,s).getPromise()}}const Lh="@firebase/storage",xh="0.14.0";/**
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
 */const Mp="storage";function lS(n,e,t){return n=te(n),LI(n,e,t)}function uS(n){return n=te(n),xI(n)}function hS(n,e){return n=te(n),qI(n,e)}function jI(n=Qi(),e){n=te(n);const r=Ki(n,Mp).getImmediate({identifier:e}),s=ji("storage");return s&&WI(r,...s),r}function WI(n,e,t,r={}){$I(n,e,t,r)}function zI(n,{instanceIdentifier:e}){const t=n.getProvider("app").getImmediate(),r=n.getProvider("auth-internal"),s=n.getProvider("app-check-internal");return new Jc(t,r,s,e,ir)}function HI(){Ot(new vt(Mp,zI,"PUBLIC").setMultipleInstances(!0)),Qe(Lh,xh,""),Qe(Lh,xh,"esm2020")}HI();/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const GI="type.googleapis.com/google.protobuf.Int64Value",KI="type.googleapis.com/google.protobuf.UInt64Value";function Lp(n,e){const t={};for(const r in n)n.hasOwnProperty(r)&&(t[r]=e(n[r]));return t}function bi(n){if(n==null)return null;if(n instanceof Number&&(n=n.valueOf()),typeof n=="number"&&isFinite(n)||n===!0||n===!1||Object.prototype.toString.call(n)==="[object String]")return n;if(n instanceof Date)return n.toISOString();if(Array.isArray(n))return n.map(e=>bi(e));if(typeof n=="function"||typeof n=="object")return Lp(n,e=>bi(e));throw new Error("Data cannot be encoded in JSON: "+n)}function er(n){if(n==null)return n;if(n["@type"])switch(n["@type"]){case GI:case KI:{const e=Number(n.value);if(isNaN(e))throw new Error("Data cannot be decoded from JSON: "+n);return e}default:throw new Error("Data cannot be decoded from JSON: "+n)}return Array.isArray(n)?n.map(e=>er(e)):typeof n=="function"||typeof n=="object"?Lp(n,e=>er(e)):n}/**
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
 */const Zc="functions";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fh={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class Ge extends wt{constructor(e,t,r){super(`${Zc}/${e}`,t||""),this.details=r,Object.setPrototypeOf(this,Ge.prototype)}}function QI(n){if(n>=200&&n<300)return"ok";switch(n){case 0:return"internal";case 400:return"invalid-argument";case 401:return"unauthenticated";case 403:return"permission-denied";case 404:return"not-found";case 409:return"aborted";case 429:return"resource-exhausted";case 499:return"cancelled";case 500:return"internal";case 501:return"unimplemented";case 503:return"unavailable";case 504:return"deadline-exceeded"}return"unknown"}function Pi(n,e){let t=QI(n),r=t,s;try{const i=e&&e.error;if(i){const a=i.status;if(typeof a=="string"){if(!Fh[a])return new Ge("internal","internal");t=Fh[a],r=a}const c=i.message;typeof c=="string"&&(r=c),s=i.details,s!==void 0&&(s=er(s))}}catch{}return t==="ok"?null:new Ge(t,r,s)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class YI{constructor(e,t,r,s){this.app=e,this.auth=null,this.messaging=null,this.appCheck=null,this.serverAppAppCheckToken=null,dt(e)&&e.settings.appCheckToken&&(this.serverAppAppCheckToken=e.settings.appCheckToken),this.auth=t.getImmediate({optional:!0}),this.messaging=r.getImmediate({optional:!0}),this.auth||t.get().then(i=>this.auth=i,()=>{}),this.messaging||r.get().then(i=>this.messaging=i,()=>{}),this.appCheck||s==null||s.get().then(i=>this.appCheck=i,()=>{})}async getAuthToken(){if(this.auth)try{const e=await this.auth.getToken();return e==null?void 0:e.accessToken}catch{return}}async getMessagingToken(){if(!(!this.messaging||!("Notification"in self)||Notification.permission!=="granted"))try{return await this.messaging.getToken()}catch{return}}async getAppCheckToken(e){if(this.serverAppAppCheckToken)return this.serverAppAppCheckToken;if(this.appCheck){const t=e?await this.appCheck.getLimitedUseToken():await this.appCheck.getToken();return t.error?null:t.token}return null}async getContext(e){const t=await this.getAuthToken(),r=await this.getMessagingToken(),s=await this.getAppCheckToken(e);return{authToken:t,messagingToken:r,appCheckToken:s}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qa="us-central1",XI=/^data: (.*?)(?:\n|$)/;function JI(n){let e=null;return{promise:new Promise((t,r)=>{e=setTimeout(()=>{r(new Ge("deadline-exceeded","deadline-exceeded"))},n)}),cancel:()=>{e&&clearTimeout(e)}}}class ZI{constructor(e,t,r,s,i=qa,a=(...c)=>fetch(...c)){this.app=e,this.fetchImpl=a,this.emulatorOrigin=null,this.contextProvider=new YI(e,t,r,s),this.cancelAllRequests=new Promise(c=>{this.deleteService=()=>Promise.resolve(c())});try{const c=new URL(i);this.customDomain=c.origin+(c.pathname==="/"?"":c.pathname),this.region=qa}catch{this.customDomain=null,this.region=i}}_delete(){return this.deleteService()}_url(e){const t=this.app.options.projectId;return this.emulatorOrigin!==null?`${this.emulatorOrigin}/${t}/${this.region}/${e}`:this.customDomain!==null?`${this.customDomain}/${e}`:`https://${this.region}-${t}.cloudfunctions.net/${e}`}}function ew(n,e,t){const r=ut(e);n.emulatorOrigin=`http${r?"s":""}://${e}:${t}`,r&&(Wi(n.emulatorOrigin+"/backends"),zi("Functions",!0))}function tw(n,e,t){const r=s=>rw(n,e,s,{});return r.stream=(s,i)=>iw(n,e,s,i),r}function xp(n){return n.emulatorOrigin&&ut(n.emulatorOrigin)?"include":void 0}async function nw(n,e,t,r,s){t["Content-Type"]="application/json";let i;try{i=await r(n,{method:"POST",body:JSON.stringify(e),headers:t,credentials:xp(s)})}catch{return{status:0,json:null}}let a=null;try{a=await i.json()}catch{}return{status:i.status,json:a}}async function Fp(n,e){const t={},r=await n.contextProvider.getContext(e.limitedUseAppCheckTokens);return r.authToken&&(t.Authorization="Bearer "+r.authToken),r.messagingToken&&(t["Firebase-Instance-ID-Token"]=r.messagingToken),r.appCheckToken!==null&&(t["X-Firebase-AppCheck"]=r.appCheckToken),t}function rw(n,e,t,r){const s=n._url(e);return sw(n,s,t,r)}async function sw(n,e,t,r){t=bi(t);const s={data:t},i=await Fp(n,r),a=r.timeout||7e4,c=JI(a),l=await Promise.race([nw(e,s,i,n.fetchImpl,n),c.promise,n.cancelAllRequests]);if(c.cancel(),!l)throw new Ge("cancelled","Firebase Functions instance was deleted.");const h=Pi(l.status,l.json);if(h)throw h;if(!l.json)throw new Ge("internal","Response is not valid JSON object.");let f=l.json.data;if(typeof f>"u"&&(f=l.json.result),typeof f>"u")throw new Ge("internal","Response is missing data field.");return{data:er(f)}}function iw(n,e,t,r){const s=n._url(e);return ow(n,s,t,r||{})}async function ow(n,e,t,r){var m;t=bi(t);const s={data:t},i=await Fp(n,r);i["Content-Type"]="application/json",i.Accept="text/event-stream";let a;try{a=await n.fetchImpl(e,{method:"POST",body:JSON.stringify(s),headers:i,signal:r==null?void 0:r.signal,credentials:xp(n)})}catch(v){if(v instanceof Error&&v.name==="AbortError"){const k=new Ge("cancelled","Request was cancelled.");return{data:Promise.reject(k),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(k)}}}}}}const R=Pi(0,null);return{data:Promise.reject(R),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(R)}}}}}}let c,l;const h=new Promise((v,R)=>{c=v,l=R});(m=r==null?void 0:r.signal)==null||m.addEventListener("abort",()=>{const v=new Ge("cancelled","Request was cancelled.");l(v)});const f=a.body.getReader(),p=aw(f,c,l,r==null?void 0:r.signal);return{stream:{[Symbol.asyncIterator](){const v=p.getReader();return{async next(){const{value:R,done:k}=await v.read();return{value:R,done:k}},async return(){return await v.cancel(),{done:!0,value:void 0}}}}},data:h}}function aw(n,e,t,r){const s=(a,c)=>{const l=a.match(XI);if(!l)return;const h=l[1];try{const f=JSON.parse(h);if("result"in f){e(er(f.result));return}if("message"in f){c.enqueue(er(f.message));return}if("error"in f){const p=Pi(0,f);c.error(p),t(p);return}}catch(f){if(f instanceof Ge){c.error(f),t(f);return}}},i=new TextDecoder;return new ReadableStream({start(a){let c="";return l();async function l(){if(r!=null&&r.aborted){const h=new Ge("cancelled","Request was cancelled");return a.error(h),t(h),Promise.resolve()}try{const{value:h,done:f}=await n.read();if(f){c.trim()&&s(c.trim(),a),a.close();return}if(r!=null&&r.aborted){const m=new Ge("cancelled","Request was cancelled");a.error(m),t(m),await n.cancel();return}c+=i.decode(h,{stream:!0});const p=c.split(`
`);c=p.pop()||"";for(const m of p)m.trim()&&s(m.trim(),a);return l()}catch(h){const f=h instanceof Ge?h:Pi(0,null);a.error(f),t(f)}}},cancel(){return n.cancel()}})}const Uh="@firebase/functions",Bh="0.13.1";/**
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
 */const cw="auth-internal",lw="app-check-internal",uw="messaging-internal";function hw(n){const e=(t,{instanceIdentifier:r})=>{const s=t.getProvider("app").getImmediate(),i=t.getProvider(cw),a=t.getProvider(uw),c=t.getProvider(lw);return new ZI(s,i,a,c,r)};Ot(new vt(Zc,e,"PUBLIC").setMultipleInstances(!0)),Qe(Uh,Bh,n),Qe(Uh,Bh,"esm2020")}/**
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
 */function dw(n=Qi(),e=qa){const r=Ki(te(n),Zc).getImmediate({identifier:e}),s=ji("functions");return s&&fw(r,...s),r}function fw(n,e,t){ew(te(n),e,t)}function dS(n,e,t){return tw(te(n),e)}hw();var qh={};const $h="@firebase/database",jh="1.1.0";/**
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
 */let Up="";function pw(n){Up=n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _w{constructor(e){this.domStorage_=e,this.prefix_="firebase:"}set(e,t){t==null?this.domStorage_.removeItem(this.prefixedName_(e)):this.domStorage_.setItem(this.prefixedName_(e),be(t))}get(e){const t=this.domStorage_.getItem(this.prefixedName_(e));return t==null?null:ts(t)}remove(e){this.domStorage_.removeItem(this.prefixedName_(e))}prefixedName_(e){return this.prefix_+e}toString(){return this.domStorage_.toString()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mw{constructor(){this.cache_={},this.isInMemoryStorage=!0}set(e,t){t==null?delete this.cache_[e]:this.cache_[e]=t}get(e){return At(this.cache_,e)?this.cache_[e]:null}remove(e){delete this.cache_[e]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bp=function(n){try{if(typeof window<"u"&&typeof window[n]<"u"){const e=window[n];return e.setItem("firebase:sentinel","cache"),e.removeItem("firebase:sentinel"),new _w(e)}}catch{}return new mw},_n=Bp("localStorage"),gw=Bp("sessionStorage");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $n=new Gi("@firebase/database"),yw=function(){let n=1;return function(){return n++}}(),qp=function(n){const e=Eg(n),t=new _g;t.update(e);const r=t.digest();return sc.encodeByteArray(r)},As=function(...n){let e="";for(let t=0;t<n.length;t++){const r=n[t];Array.isArray(r)||r&&typeof r=="object"&&typeof r.length=="number"?e+=As.apply(null,r):typeof r=="object"?e+=be(r):e+=r,e+=" "}return e};let Qr=null,Wh=!0;const Ew=function(n,e){O(!0,"Can't turn on custom loggers persistently."),$n.logLevel=W.VERBOSE,Qr=$n.log.bind($n)},Se=function(...n){if(Wh===!0&&(Wh=!1,Qr===null&&gw.get("logging_enabled")===!0&&Ew()),Qr){const e=As.apply(null,n);Qr(e)}},Cs=function(n){return function(...e){Se(n,...e)}},$a=function(...n){const e="FIREBASE INTERNAL ERROR: "+As(...n);$n.error(e)},Lt=function(...n){const e=`FIREBASE FATAL ERROR: ${As(...n)}`;throw $n.error(e),new Error(e)},Ye=function(...n){const e="FIREBASE WARNING: "+As(...n);$n.warn(e)},Tw=function(){typeof window<"u"&&window.location&&window.location.protocol&&window.location.protocol.indexOf("https:")!==-1&&Ye("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().")},go=function(n){return typeof n=="number"&&(n!==n||n===Number.POSITIVE_INFINITY||n===Number.NEGATIVE_INFINITY)},vw=function(n){if(document.readyState==="complete")n();else{let e=!1;const t=function(){if(!document.body){setTimeout(t,Math.floor(10));return}e||(e=!0,n())};document.addEventListener?(document.addEventListener("DOMContentLoaded",t,!1),window.addEventListener("load",t,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",()=>{document.readyState==="complete"&&t()}),window.attachEvent("onload",t))}},tr="[MIN_NAME]",An="[MAX_NAME]",Pn=function(n,e){if(n===e)return 0;if(n===tr||e===An)return-1;if(e===tr||n===An)return 1;{const t=zh(n),r=zh(e);return t!==null?r!==null?t-r===0?n.length-e.length:t-r:-1:r!==null?1:n<e?-1:1}},Iw=function(n,e){return n===e?0:n<e?-1:1},Vr=function(n,e){if(e&&n in e)return e[n];throw new Error("Missing required key ("+n+") in object: "+be(e))},el=function(n){if(typeof n!="object"||n===null)return be(n);const e=[];for(const r in n)e.push(r);e.sort();let t="{";for(let r=0;r<e.length;r++)r!==0&&(t+=","),t+=be(e[r]),t+=":",t+=el(n[e[r]]);return t+="}",t},$p=function(n,e){const t=n.length;if(t<=e)return[n];const r=[];for(let s=0;s<t;s+=e)s+e>t?r.push(n.substring(s,t)):r.push(n.substring(s,s+e));return r};function Xe(n,e){for(const t in n)n.hasOwnProperty(t)&&e(t,n[t])}const jp=function(n){O(!go(n),"Invalid JSON number");const e=11,t=52,r=(1<<e-1)-1;let s,i,a,c,l;n===0?(i=0,a=0,s=1/n===-1/0?1:0):(s=n<0,n=Math.abs(n),n>=Math.pow(2,1-r)?(c=Math.min(Math.floor(Math.log(n)/Math.LN2),r),i=c+r,a=Math.round(n*Math.pow(2,t-c)-Math.pow(2,t))):(i=0,a=Math.round(n/Math.pow(2,1-r-t))));const h=[];for(l=t;l;l-=1)h.push(a%2?1:0),a=Math.floor(a/2);for(l=e;l;l-=1)h.push(i%2?1:0),i=Math.floor(i/2);h.push(s?1:0),h.reverse();const f=h.join("");let p="";for(l=0;l<64;l+=8){let m=parseInt(f.substr(l,8),2).toString(16);m.length===1&&(m="0"+m),p=p+m}return p.toLowerCase()},ww=function(){return!!(typeof window=="object"&&window.chrome&&window.chrome.extension&&!/^chrome/.test(window.location.href))},Aw=function(){return typeof Windows=="object"&&typeof Windows.UI=="object"},Cw=new RegExp("^-?(0*)\\d{1,10}$"),Rw=-2147483648,Sw=2147483647,zh=function(n){if(Cw.test(n)){const e=Number(n);if(e>=Rw&&e<=Sw)return e}return null},fr=function(n){try{n()}catch(e){setTimeout(()=>{const t=e.stack||"";throw Ye("Exception was thrown by user callback.",t),e},Math.floor(0))}},bw=function(){return(typeof window=="object"&&window.navigator&&window.navigator.userAgent||"").search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i)>=0},Yr=function(n,e){const t=setTimeout(n,e);return typeof t=="number"&&typeof Deno<"u"&&Deno.unrefTimer?Deno.unrefTimer(t):typeof t=="object"&&t.unref&&t.unref(),t};/**
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
 */class Pw{constructor(e,t){this.appCheckProvider=t,this.appName=e.name,dt(e)&&e.settings.appCheckToken&&(this.serverAppAppCheckToken=e.settings.appCheckToken),this.appCheck=t==null?void 0:t.getImmediate({optional:!0}),this.appCheck||t==null||t.get().then(r=>this.appCheck=r)}getToken(e){if(this.serverAppAppCheckToken){if(e)throw new Error("Attempted reuse of `FirebaseServerApp.appCheckToken` after previous usage failed.");return Promise.resolve({token:this.serverAppAppCheckToken})}return this.appCheck?this.appCheck.getToken(e):new Promise((t,r)=>{setTimeout(()=>{this.appCheck?this.getToken(e).then(t,r):t(null)},0)})}addTokenChangeListener(e){var t;(t=this.appCheckProvider)==null||t.get().then(r=>r.addTokenListener(e))}notifyForInvalidToken(){Ye(`Provided AppCheck credentials for the app named "${this.appName}" are invalid. This usually indicates your app was not initialized correctly.`)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nw{constructor(e,t,r){this.appName_=e,this.firebaseOptions_=t,this.authProvider_=r,this.auth_=null,this.auth_=r.getImmediate({optional:!0}),this.auth_||r.onInit(s=>this.auth_=s)}getToken(e){return this.auth_?this.auth_.getToken(e).catch(t=>t&&t.code==="auth/token-not-initialized"?(Se("Got auth/token-not-initialized error.  Treating as null token."),null):Promise.reject(t)):new Promise((t,r)=>{setTimeout(()=>{this.auth_?this.getToken(e).then(t,r):t(null)},0)})}addTokenChangeListener(e){this.auth_?this.auth_.addAuthTokenListener(e):this.authProvider_.get().then(t=>t.addAuthTokenListener(e))}removeTokenChangeListener(e){this.authProvider_.get().then(t=>t.removeAuthTokenListener(e))}notifyForInvalidToken(){let e='Provided authentication credentials for the app named "'+this.appName_+'" are invalid. This usually indicates your app was not initialized correctly. ';"credential"in this.firebaseOptions_?e+='Make sure the "credential" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':"serviceAccount"in this.firebaseOptions_?e+='Make sure the "serviceAccount" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':e+='Make sure the "apiKey" and "databaseURL" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.',Ye(e)}}class ui{constructor(e){this.accessToken=e}getToken(e){return Promise.resolve({accessToken:this.accessToken})}addTokenChangeListener(e){e(this.accessToken)}removeTokenChangeListener(e){}notifyForInvalidToken(){}}ui.OWNER="owner";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tl="5",Wp="v",zp="s",Hp="r",Gp="f",Kp=/(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/,Qp="ls",Yp="p",ja="ac",Xp="websocket",Jp="long_polling";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zp{constructor(e,t,r,s,i=!1,a="",c=!1,l=!1,h=null){this.secure=t,this.namespace=r,this.webSocketOnly=s,this.nodeAdmin=i,this.persistenceKey=a,this.includeNamespaceInQueryParams=c,this.isUsingEmulator=l,this.emulatorOptions=h,this._host=e.toLowerCase(),this._domain=this._host.substr(this._host.indexOf(".")+1),this.internalHost=_n.get("host:"+e)||this._host}isCacheableHost(){return this.internalHost.substr(0,2)==="s-"}isCustomHost(){return this._domain!=="firebaseio.com"&&this._domain!=="firebaseio-demo.com"}get host(){return this._host}set host(e){e!==this.internalHost&&(this.internalHost=e,this.isCacheableHost()&&_n.set("host:"+this._host,this.internalHost))}toString(){let e=this.toURLString();return this.persistenceKey&&(e+="<"+this.persistenceKey+">"),e}toURLString(){const e=this.secure?"https://":"http://",t=this.includeNamespaceInQueryParams?`?ns=${this.namespace}`:"";return`${e}${this.host}/${t}`}}function kw(n){return n.host!==n.internalHost||n.isCustomHost()||n.includeNamespaceInQueryParams}function e_(n,e,t){O(typeof e=="string","typeof type must == string"),O(typeof t=="object","typeof params must == object");let r;if(e===Xp)r=(n.secure?"wss://":"ws://")+n.internalHost+"/.ws?";else if(e===Jp)r=(n.secure?"https://":"http://")+n.internalHost+"/.lp?";else throw new Error("Unknown connection type: "+e);kw(n)&&(t.ns=n.namespace);const s=[];return Xe(t,(i,a)=>{s.push(i+"="+a)}),r+s.join("&")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dw{constructor(){this.counters_={}}incrementCounter(e,t=1){At(this.counters_,e)||(this.counters_[e]=0),this.counters_[e]+=t}get(){return Gm(this.counters_)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const aa={},ca={};function nl(n){const e=n.toString();return aa[e]||(aa[e]=new Dw),aa[e]}function Ow(n,e){const t=n.toString();return ca[t]||(ca[t]=e()),ca[t]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vw{constructor(e){this.onMessage_=e,this.pendingResponses=[],this.currentResponseNum=0,this.closeAfterResponse=-1,this.onClose=null}closeAfter(e,t){this.closeAfterResponse=e,this.onClose=t,this.closeAfterResponse<this.currentResponseNum&&(this.onClose(),this.onClose=null)}handleResponse(e,t){for(this.pendingResponses[e]=t;this.pendingResponses[this.currentResponseNum];){const r=this.pendingResponses[this.currentResponseNum];delete this.pendingResponses[this.currentResponseNum];for(let s=0;s<r.length;++s)r[s]&&fr(()=>{this.onMessage_(r[s])});if(this.currentResponseNum===this.closeAfterResponse){this.onClose&&(this.onClose(),this.onClose=null);break}this.currentResponseNum++}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Hh="start",Mw="close",Lw="pLPCommand",xw="pRTLPCB",t_="id",n_="pw",r_="ser",Fw="cb",Uw="seg",Bw="ts",qw="d",$w="dframe",s_=1870,i_=30,jw=s_-i_,Ww=25e3,zw=3e4;class Bn{constructor(e,t,r,s,i,a,c){this.connId=e,this.repoInfo=t,this.applicationId=r,this.appCheckToken=s,this.authToken=i,this.transportSessionId=a,this.lastSessionId=c,this.bytesSent=0,this.bytesReceived=0,this.everConnected_=!1,this.log_=Cs(e),this.stats_=nl(t),this.urlFn=l=>(this.appCheckToken&&(l[ja]=this.appCheckToken),e_(t,Jp,l))}open(e,t){this.curSegmentNum=0,this.onDisconnect_=t,this.myPacketOrderer=new Vw(e),this.isClosed_=!1,this.connectTimeoutTimer_=setTimeout(()=>{this.log_("Timed out trying to connect."),this.onClosed_(),this.connectTimeoutTimer_=null},Math.floor(zw)),vw(()=>{if(this.isClosed_)return;this.scriptTagHolder=new rl((...i)=>{const[a,c,l,h,f]=i;if(this.incrementIncomingBytes_(i),!!this.scriptTagHolder)if(this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null),this.everConnected_=!0,a===Hh)this.id=c,this.password=l;else if(a===Mw)c?(this.scriptTagHolder.sendNewPolls=!1,this.myPacketOrderer.closeAfter(c,()=>{this.onClosed_()})):this.onClosed_();else throw new Error("Unrecognized command received: "+a)},(...i)=>{const[a,c]=i;this.incrementIncomingBytes_(i),this.myPacketOrderer.handleResponse(a,c)},()=>{this.onClosed_()},this.urlFn);const r={};r[Hh]="t",r[r_]=Math.floor(Math.random()*1e8),this.scriptTagHolder.uniqueCallbackIdentifier&&(r[Fw]=this.scriptTagHolder.uniqueCallbackIdentifier),r[Wp]=tl,this.transportSessionId&&(r[zp]=this.transportSessionId),this.lastSessionId&&(r[Qp]=this.lastSessionId),this.applicationId&&(r[Yp]=this.applicationId),this.appCheckToken&&(r[ja]=this.appCheckToken),typeof location<"u"&&location.hostname&&Kp.test(location.hostname)&&(r[Hp]=Gp);const s=this.urlFn(r);this.log_("Connecting via long-poll to "+s),this.scriptTagHolder.addTag(s,()=>{})})}start(){this.scriptTagHolder.startLongPoll(this.id,this.password),this.addDisconnectPingFrame(this.id,this.password)}static forceAllow(){Bn.forceAllow_=!0}static forceDisallow(){Bn.forceDisallow_=!0}static isAvailable(){return Bn.forceAllow_?!0:!Bn.forceDisallow_&&typeof document<"u"&&document.createElement!=null&&!ww()&&!Aw()}markConnectionHealthy(){}shutdown_(){this.isClosed_=!0,this.scriptTagHolder&&(this.scriptTagHolder.close(),this.scriptTagHolder=null),this.myDisconnFrame&&(document.body.removeChild(this.myDisconnFrame),this.myDisconnFrame=null),this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null)}onClosed_(){this.isClosed_||(this.log_("Longpoll is closing itself"),this.shutdown_(),this.onDisconnect_&&(this.onDisconnect_(this.everConnected_),this.onDisconnect_=null))}close(){this.isClosed_||(this.log_("Longpoll is being closed."),this.shutdown_())}send(e){const t=be(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const r=Vd(t),s=$p(r,jw);for(let i=0;i<s.length;i++)this.scriptTagHolder.enqueueSegment(this.curSegmentNum,s.length,s[i]),this.curSegmentNum++}addDisconnectPingFrame(e,t){this.myDisconnFrame=document.createElement("iframe");const r={};r[$w]="t",r[t_]=e,r[n_]=t,this.myDisconnFrame.src=this.urlFn(r),this.myDisconnFrame.style.display="none",document.body.appendChild(this.myDisconnFrame)}incrementIncomingBytes_(e){const t=be(e).length;this.bytesReceived+=t,this.stats_.incrementCounter("bytes_received",t)}}class rl{constructor(e,t,r,s){this.onDisconnect=r,this.urlFn=s,this.outstandingRequests=new Set,this.pendingSegs=[],this.currentSerial=Math.floor(Math.random()*1e8),this.sendNewPolls=!0;{this.uniqueCallbackIdentifier=yw(),window[Lw+this.uniqueCallbackIdentifier]=e,window[xw+this.uniqueCallbackIdentifier]=t,this.myIFrame=rl.createIFrame_();let i="";this.myIFrame.src&&this.myIFrame.src.substr(0,11)==="javascript:"&&(i='<script>document.domain="'+document.domain+'";<\/script>');const a="<html><body>"+i+"</body></html>";try{this.myIFrame.doc.open(),this.myIFrame.doc.write(a),this.myIFrame.doc.close()}catch(c){Se("frame writing exception"),c.stack&&Se(c.stack),Se(c)}}}static createIFrame_(){const e=document.createElement("iframe");if(e.style.display="none",document.body){document.body.appendChild(e);try{e.contentWindow.document||Se("No IE domain setting required")}catch{const r=document.domain;e.src="javascript:void((function(){document.open();document.domain='"+r+"';document.close();})())"}}else throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";return e.contentDocument?e.doc=e.contentDocument:e.contentWindow?e.doc=e.contentWindow.document:e.document&&(e.doc=e.document),e}close(){this.alive=!1,this.myIFrame&&(this.myIFrame.doc.body.textContent="",setTimeout(()=>{this.myIFrame!==null&&(document.body.removeChild(this.myIFrame),this.myIFrame=null)},Math.floor(0)));const e=this.onDisconnect;e&&(this.onDisconnect=null,e())}startLongPoll(e,t){for(this.myID=e,this.myPW=t,this.alive=!0;this.newRequest_(););}newRequest_(){if(this.alive&&this.sendNewPolls&&this.outstandingRequests.size<(this.pendingSegs.length>0?2:1)){this.currentSerial++;const e={};e[t_]=this.myID,e[n_]=this.myPW,e[r_]=this.currentSerial;let t=this.urlFn(e),r="",s=0;for(;this.pendingSegs.length>0&&this.pendingSegs[0].d.length+i_+r.length<=s_;){const a=this.pendingSegs.shift();r=r+"&"+Uw+s+"="+a.seg+"&"+Bw+s+"="+a.ts+"&"+qw+s+"="+a.d,s++}return t=t+r,this.addLongPollTag_(t,this.currentSerial),!0}else return!1}enqueueSegment(e,t,r){this.pendingSegs.push({seg:e,ts:t,d:r}),this.alive&&this.newRequest_()}addLongPollTag_(e,t){this.outstandingRequests.add(t);const r=()=>{this.outstandingRequests.delete(t),this.newRequest_()},s=setTimeout(r,Math.floor(Ww)),i=()=>{clearTimeout(s),r()};this.addTag(e,i)}addTag(e,t){setTimeout(()=>{try{if(!this.sendNewPolls)return;const r=this.myIFrame.doc.createElement("script");r.type="text/javascript",r.async=!0,r.src=e,r.onload=r.onreadystatechange=function(){const s=r.readyState;(!s||s==="loaded"||s==="complete")&&(r.onload=r.onreadystatechange=null,r.parentNode&&r.parentNode.removeChild(r),t())},r.onerror=()=>{Se("Long-poll script failed to load: "+e),this.sendNewPolls=!1,this.close()},this.myIFrame.doc.body.appendChild(r)}catch{}},Math.floor(1))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Hw=16384,Gw=45e3;let Ni=null;typeof MozWebSocket<"u"?Ni=MozWebSocket:typeof WebSocket<"u"&&(Ni=WebSocket);class it{constructor(e,t,r,s,i,a,c){this.connId=e,this.applicationId=r,this.appCheckToken=s,this.authToken=i,this.keepaliveTimer=null,this.frames=null,this.totalFrames=0,this.bytesSent=0,this.bytesReceived=0,this.log_=Cs(this.connId),this.stats_=nl(t),this.connURL=it.connectionURL_(t,a,c,s,r),this.nodeAdmin=t.nodeAdmin}static connectionURL_(e,t,r,s,i){const a={};return a[Wp]=tl,typeof location<"u"&&location.hostname&&Kp.test(location.hostname)&&(a[Hp]=Gp),t&&(a[zp]=t),r&&(a[Qp]=r),s&&(a[ja]=s),i&&(a[Yp]=i),e_(e,Xp,a)}open(e,t){this.onDisconnect=t,this.onMessage=e,this.log_("Websocket connecting to "+this.connURL),this.everConnected_=!1,_n.set("previous_websocket_failure",!0);try{let r;og(),this.mySock=new Ni(this.connURL,[],r)}catch(r){this.log_("Error instantiating WebSocket.");const s=r.message||r.data;s&&this.log_(s),this.onClosed_();return}this.mySock.onopen=()=>{this.log_("Websocket connected."),this.everConnected_=!0},this.mySock.onclose=()=>{this.log_("Websocket connection was disconnected."),this.mySock=null,this.onClosed_()},this.mySock.onmessage=r=>{this.handleIncomingFrame(r)},this.mySock.onerror=r=>{this.log_("WebSocket error.  Closing connection.");const s=r.message||r.data;s&&this.log_(s),this.onClosed_()}}start(){}static forceDisallow(){it.forceDisallow_=!0}static isAvailable(){let e=!1;if(typeof navigator<"u"&&navigator.userAgent){const t=/Android ([0-9]{0,}\.[0-9]{0,})/,r=navigator.userAgent.match(t);r&&r.length>1&&parseFloat(r[1])<4.4&&(e=!0)}return!e&&Ni!==null&&!it.forceDisallow_}static previouslyFailed(){return _n.isInMemoryStorage||_n.get("previous_websocket_failure")===!0}markConnectionHealthy(){_n.remove("previous_websocket_failure")}appendFrame_(e){if(this.frames.push(e),this.frames.length===this.totalFrames){const t=this.frames.join("");this.frames=null;const r=ts(t);this.onMessage(r)}}handleNewFrameCount_(e){this.totalFrames=e,this.frames=[]}extractFrameCount_(e){if(O(this.frames===null,"We already have a frame buffer"),e.length<=6){const t=Number(e);if(!isNaN(t))return this.handleNewFrameCount_(t),null}return this.handleNewFrameCount_(1),e}handleIncomingFrame(e){if(this.mySock===null)return;const t=e.data;if(this.bytesReceived+=t.length,this.stats_.incrementCounter("bytes_received",t.length),this.resetKeepAlive(),this.frames!==null)this.appendFrame_(t);else{const r=this.extractFrameCount_(t);r!==null&&this.appendFrame_(r)}}send(e){this.resetKeepAlive();const t=be(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const r=$p(t,Hw);r.length>1&&this.sendString_(String(r.length));for(let s=0;s<r.length;s++)this.sendString_(r[s])}shutdown_(){this.isClosed_=!0,this.keepaliveTimer&&(clearInterval(this.keepaliveTimer),this.keepaliveTimer=null),this.mySock&&(this.mySock.close(),this.mySock=null)}onClosed_(){this.isClosed_||(this.log_("WebSocket is closing itself"),this.shutdown_(),this.onDisconnect&&(this.onDisconnect(this.everConnected_),this.onDisconnect=null))}close(){this.isClosed_||(this.log_("WebSocket is being closed"),this.shutdown_())}resetKeepAlive(){clearInterval(this.keepaliveTimer),this.keepaliveTimer=setInterval(()=>{this.mySock&&this.sendString_("0"),this.resetKeepAlive()},Math.floor(Gw))}sendString_(e){try{this.mySock.send(e)}catch(t){this.log_("Exception thrown from WebSocket.send():",t.message||t.data,"Closing connection."),setTimeout(this.onClosed_.bind(this),0)}}}it.responsesRequiredToBeHealthy=2;it.healthyTimeout=3e4;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ds{static get ALL_TRANSPORTS(){return[Bn,it]}static get IS_TRANSPORT_INITIALIZED(){return this.globalTransportInitialized_}constructor(e){this.initTransports_(e)}initTransports_(e){const t=it&&it.isAvailable();let r=t&&!it.previouslyFailed();if(e.webSocketOnly&&(t||Ye("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),r=!0),r)this.transports_=[it];else{const s=this.transports_=[];for(const i of ds.ALL_TRANSPORTS)i&&i.isAvailable()&&s.push(i);ds.globalTransportInitialized_=!0}}initialTransport(){if(this.transports_.length>0)return this.transports_[0];throw new Error("No transports available")}upgradeTransport(){return this.transports_.length>1?this.transports_[1]:null}}ds.globalTransportInitialized_=!1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Kw=6e4,Qw=5e3,Yw=10*1024,Xw=100*1024,la="t",Gh="d",Jw="s",Kh="r",Zw="e",Qh="o",Yh="a",Xh="n",Jh="p",eA="h";class tA{constructor(e,t,r,s,i,a,c,l,h,f){this.id=e,this.repoInfo_=t,this.applicationId_=r,this.appCheckToken_=s,this.authToken_=i,this.onMessage_=a,this.onReady_=c,this.onDisconnect_=l,this.onKill_=h,this.lastSessionId=f,this.connectionCount=0,this.pendingDataMessages=[],this.state_=0,this.log_=Cs("c:"+this.id+":"),this.transportManager_=new ds(t),this.log_("Connection created"),this.start_()}start_(){const e=this.transportManager_.initialTransport();this.conn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,null,this.lastSessionId),this.primaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.conn_),r=this.disconnReceiver_(this.conn_);this.tx_=this.conn_,this.rx_=this.conn_,this.secondaryConn_=null,this.isHealthy_=!1,setTimeout(()=>{this.conn_&&this.conn_.open(t,r)},Math.floor(0));const s=e.healthyTimeout||0;s>0&&(this.healthyTimeout_=Yr(()=>{this.healthyTimeout_=null,this.isHealthy_||(this.conn_&&this.conn_.bytesReceived>Xw?(this.log_("Connection exceeded healthy timeout but has received "+this.conn_.bytesReceived+" bytes.  Marking connection healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()):this.conn_&&this.conn_.bytesSent>Yw?this.log_("Connection exceeded healthy timeout but has sent "+this.conn_.bytesSent+" bytes.  Leaving connection alive."):(this.log_("Closing unhealthy connection after timeout."),this.close()))},Math.floor(s)))}nextTransportId_(){return"c:"+this.id+":"+this.connectionCount++}disconnReceiver_(e){return t=>{e===this.conn_?this.onConnectionLost_(t):e===this.secondaryConn_?(this.log_("Secondary connection lost."),this.onSecondaryConnectionLost_()):this.log_("closing an old connection")}}connReceiver_(e){return t=>{this.state_!==2&&(e===this.rx_?this.onPrimaryMessageReceived_(t):e===this.secondaryConn_?this.onSecondaryMessageReceived_(t):this.log_("message on old connection"))}}sendRequest(e){const t={t:"d",d:e};this.sendData_(t)}tryCleanupConnection(){this.tx_===this.secondaryConn_&&this.rx_===this.secondaryConn_&&(this.log_("cleaning up and promoting a connection: "+this.secondaryConn_.connId),this.conn_=this.secondaryConn_,this.secondaryConn_=null)}onSecondaryControl_(e){if(la in e){const t=e[la];t===Yh?this.upgradeIfSecondaryHealthy_():t===Kh?(this.log_("Got a reset on secondary, closing it"),this.secondaryConn_.close(),(this.tx_===this.secondaryConn_||this.rx_===this.secondaryConn_)&&this.close()):t===Qh&&(this.log_("got pong on secondary."),this.secondaryResponsesRequired_--,this.upgradeIfSecondaryHealthy_())}}onSecondaryMessageReceived_(e){const t=Vr("t",e),r=Vr("d",e);if(t==="c")this.onSecondaryControl_(r);else if(t==="d")this.pendingDataMessages.push(r);else throw new Error("Unknown protocol layer: "+t)}upgradeIfSecondaryHealthy_(){this.secondaryResponsesRequired_<=0?(this.log_("Secondary connection is healthy."),this.isHealthy_=!0,this.secondaryConn_.markConnectionHealthy(),this.proceedWithUpgrade_()):(this.log_("sending ping on secondary."),this.secondaryConn_.send({t:"c",d:{t:Jh,d:{}}}))}proceedWithUpgrade_(){this.secondaryConn_.start(),this.log_("sending client ack on secondary"),this.secondaryConn_.send({t:"c",d:{t:Yh,d:{}}}),this.log_("Ending transmission on primary"),this.conn_.send({t:"c",d:{t:Xh,d:{}}}),this.tx_=this.secondaryConn_,this.tryCleanupConnection()}onPrimaryMessageReceived_(e){const t=Vr("t",e),r=Vr("d",e);t==="c"?this.onControl_(r):t==="d"&&this.onDataMessage_(r)}onDataMessage_(e){this.onPrimaryResponse_(),this.onMessage_(e)}onPrimaryResponse_(){this.isHealthy_||(this.primaryResponsesRequired_--,this.primaryResponsesRequired_<=0&&(this.log_("Primary connection is healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()))}onControl_(e){const t=Vr(la,e);if(Gh in e){const r=e[Gh];if(t===eA){const s={...r};this.repoInfo_.isUsingEmulator&&(s.h=this.repoInfo_.host),this.onHandshake_(s)}else if(t===Xh){this.log_("recvd end transmission on primary"),this.rx_=this.secondaryConn_;for(let s=0;s<this.pendingDataMessages.length;++s)this.onDataMessage_(this.pendingDataMessages[s]);this.pendingDataMessages=[],this.tryCleanupConnection()}else t===Jw?this.onConnectionShutdown_(r):t===Kh?this.onReset_(r):t===Zw?$a("Server Error: "+r):t===Qh?(this.log_("got pong on primary."),this.onPrimaryResponse_(),this.sendPingOnPrimaryIfNecessary_()):$a("Unknown control packet command: "+t)}}onHandshake_(e){const t=e.ts,r=e.v,s=e.h;this.sessionId=e.s,this.repoInfo_.host=s,this.state_===0&&(this.conn_.start(),this.onConnectionEstablished_(this.conn_,t),tl!==r&&Ye("Protocol version mismatch detected"),this.tryStartUpgrade_())}tryStartUpgrade_(){const e=this.transportManager_.upgradeTransport();e&&this.startUpgrade_(e)}startUpgrade_(e){this.secondaryConn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,this.sessionId),this.secondaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.secondaryConn_),r=this.disconnReceiver_(this.secondaryConn_);this.secondaryConn_.open(t,r),Yr(()=>{this.secondaryConn_&&(this.log_("Timed out trying to upgrade."),this.secondaryConn_.close())},Math.floor(Kw))}onReset_(e){this.log_("Reset packet received.  New host: "+e),this.repoInfo_.host=e,this.state_===1?this.close():(this.closeConnections_(),this.start_())}onConnectionEstablished_(e,t){this.log_("Realtime connection established."),this.conn_=e,this.state_=1,this.onReady_&&(this.onReady_(t,this.sessionId),this.onReady_=null),this.primaryResponsesRequired_===0?(this.log_("Primary connection is healthy."),this.isHealthy_=!0):Yr(()=>{this.sendPingOnPrimaryIfNecessary_()},Math.floor(Qw))}sendPingOnPrimaryIfNecessary_(){!this.isHealthy_&&this.state_===1&&(this.log_("sending ping on primary."),this.sendData_({t:"c",d:{t:Jh,d:{}}}))}onSecondaryConnectionLost_(){const e=this.secondaryConn_;this.secondaryConn_=null,(this.tx_===e||this.rx_===e)&&this.close()}onConnectionLost_(e){this.conn_=null,!e&&this.state_===0?(this.log_("Realtime connection failed."),this.repoInfo_.isCacheableHost()&&(_n.remove("host:"+this.repoInfo_.host),this.repoInfo_.internalHost=this.repoInfo_.host)):this.state_===1&&this.log_("Realtime connection lost."),this.close()}onConnectionShutdown_(e){this.log_("Connection shutdown command received. Shutting down..."),this.onKill_&&(this.onKill_(e),this.onKill_=null),this.onDisconnect_=null,this.close()}sendData_(e){if(this.state_!==1)throw"Connection is not connected";this.tx_.send(e)}close(){this.state_!==2&&(this.log_("Closing realtime connection."),this.state_=2,this.closeConnections_(),this.onDisconnect_&&(this.onDisconnect_(),this.onDisconnect_=null))}closeConnections_(){this.log_("Shutting down all connections"),this.conn_&&(this.conn_.close(),this.conn_=null),this.secondaryConn_&&(this.secondaryConn_.close(),this.secondaryConn_=null),this.healthyTimeout_&&(clearTimeout(this.healthyTimeout_),this.healthyTimeout_=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class o_{put(e,t,r,s){}merge(e,t,r,s){}refreshAuthToken(e){}refreshAppCheckToken(e){}onDisconnectPut(e,t,r){}onDisconnectMerge(e,t,r){}onDisconnectCancel(e,t){}reportStats(e){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class a_{constructor(e){this.allowedEvents_=e,this.listeners_={},O(Array.isArray(e)&&e.length>0,"Requires a non-empty array")}trigger(e,...t){if(Array.isArray(this.listeners_[e])){const r=[...this.listeners_[e]];for(let s=0;s<r.length;s++)r[s].callback.apply(r[s].context,t)}}on(e,t,r){this.validateEventType_(e),this.listeners_[e]=this.listeners_[e]||[],this.listeners_[e].push({callback:t,context:r});const s=this.getInitialEvent(e);s&&t.apply(r,s)}off(e,t,r){this.validateEventType_(e);const s=this.listeners_[e]||[];for(let i=0;i<s.length;i++)if(s[i].callback===t&&(!r||r===s[i].context)){s.splice(i,1);return}}validateEventType_(e){O(this.allowedEvents_.find(t=>t===e),"Unknown event: "+e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ki extends a_{static getInstance(){return new ki}constructor(){super(["online"]),this.online_=!0,typeof window<"u"&&typeof window.addEventListener<"u"&&!oc()&&(window.addEventListener("online",()=>{this.online_||(this.online_=!0,this.trigger("online",!0))},!1),window.addEventListener("offline",()=>{this.online_&&(this.online_=!1,this.trigger("online",!1))},!1))}getInitialEvent(e){return O(e==="online","Unknown event type: "+e),[this.online_]}currentlyOnline(){return this.online_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Zh=32,ed=768;class se{constructor(e,t){if(t===void 0){this.pieces_=e.split("/");let r=0;for(let s=0;s<this.pieces_.length;s++)this.pieces_[s].length>0&&(this.pieces_[r]=this.pieces_[s],r++);this.pieces_.length=r,this.pieceNum_=0}else this.pieces_=e,this.pieceNum_=t}toString(){let e="";for(let t=this.pieceNum_;t<this.pieces_.length;t++)this.pieces_[t]!==""&&(e+="/"+this.pieces_[t]);return e||"/"}}function ne(){return new se("")}function z(n){return n.pieceNum_>=n.pieces_.length?null:n.pieces_[n.pieceNum_]}function sn(n){return n.pieces_.length-n.pieceNum_}function ie(n){let e=n.pieceNum_;return e<n.pieces_.length&&e++,new se(n.pieces_,e)}function sl(n){return n.pieceNum_<n.pieces_.length?n.pieces_[n.pieces_.length-1]:null}function nA(n){let e="";for(let t=n.pieceNum_;t<n.pieces_.length;t++)n.pieces_[t]!==""&&(e+="/"+encodeURIComponent(String(n.pieces_[t])));return e||"/"}function fs(n,e=0){return n.pieces_.slice(n.pieceNum_+e)}function c_(n){if(n.pieceNum_>=n.pieces_.length)return null;const e=[];for(let t=n.pieceNum_;t<n.pieces_.length-1;t++)e.push(n.pieces_[t]);return new se(e,0)}function me(n,e){const t=[];for(let r=n.pieceNum_;r<n.pieces_.length;r++)t.push(n.pieces_[r]);if(e instanceof se)for(let r=e.pieceNum_;r<e.pieces_.length;r++)t.push(e.pieces_[r]);else{const r=e.split("/");for(let s=0;s<r.length;s++)r[s].length>0&&t.push(r[s])}return new se(t,0)}function G(n){return n.pieceNum_>=n.pieces_.length}function nt(n,e){const t=z(n),r=z(e);if(t===null)return e;if(t===r)return nt(ie(n),ie(e));throw new Error("INTERNAL ERROR: innerPath ("+e+") is not within outerPath ("+n+")")}function rA(n,e){const t=fs(n,0),r=fs(e,0);for(let s=0;s<t.length&&s<r.length;s++){const i=Pn(t[s],r[s]);if(i!==0)return i}return t.length===r.length?0:t.length<r.length?-1:1}function l_(n,e){if(sn(n)!==sn(e))return!1;for(let t=n.pieceNum_,r=e.pieceNum_;t<=n.pieces_.length;t++,r++)if(n.pieces_[t]!==e.pieces_[r])return!1;return!0}function rt(n,e){let t=n.pieceNum_,r=e.pieceNum_;if(sn(n)>sn(e))return!1;for(;t<n.pieces_.length;){if(n.pieces_[t]!==e.pieces_[r])return!1;++t,++r}return!0}class sA{constructor(e,t){this.errorPrefix_=t,this.parts_=fs(e,0),this.byteLength_=Math.max(1,this.parts_.length);for(let r=0;r<this.parts_.length;r++)this.byteLength_+=Hi(this.parts_[r]);u_(this)}}function iA(n,e){n.parts_.length>0&&(n.byteLength_+=1),n.parts_.push(e),n.byteLength_+=Hi(e),u_(n)}function oA(n){const e=n.parts_.pop();n.byteLength_-=Hi(e),n.parts_.length>0&&(n.byteLength_-=1)}function u_(n){if(n.byteLength_>ed)throw new Error(n.errorPrefix_+"has a key path longer than "+ed+" bytes ("+n.byteLength_+").");if(n.parts_.length>Zh)throw new Error(n.errorPrefix_+"path specified exceeds the maximum depth that can be written ("+Zh+") or object contains a cycle "+fn(n))}function fn(n){return n.parts_.length===0?"":"in property '"+n.parts_.join(".")+"'"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class il extends a_{static getInstance(){return new il}constructor(){super(["visible"]);let e,t;typeof document<"u"&&typeof document.addEventListener<"u"&&(typeof document.hidden<"u"?(t="visibilitychange",e="hidden"):typeof document.mozHidden<"u"?(t="mozvisibilitychange",e="mozHidden"):typeof document.msHidden<"u"?(t="msvisibilitychange",e="msHidden"):typeof document.webkitHidden<"u"&&(t="webkitvisibilitychange",e="webkitHidden")),this.visible_=!0,t&&document.addEventListener(t,()=>{const r=!document[e];r!==this.visible_&&(this.visible_=r,this.trigger("visible",r))},!1)}getInitialEvent(e){return O(e==="visible","Unknown event type: "+e),[this.visible_]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mr=1e3,aA=60*5*1e3,td=30*1e3,cA=1.3,lA=3e4,uA="server_kill",nd=3;class kt extends o_{constructor(e,t,r,s,i,a,c,l){if(super(),this.repoInfo_=e,this.applicationId_=t,this.onDataUpdate_=r,this.onConnectStatus_=s,this.onServerInfoUpdate_=i,this.authTokenProvider_=a,this.appCheckTokenProvider_=c,this.authOverride_=l,this.id=kt.nextPersistentConnectionId_++,this.log_=Cs("p:"+this.id+":"),this.interruptReasons_={},this.listens=new Map,this.outstandingPuts_=[],this.outstandingGets_=[],this.outstandingPutCount_=0,this.outstandingGetCount_=0,this.onDisconnectRequestQueue_=[],this.connected_=!1,this.reconnectDelay_=Mr,this.maxReconnectDelay_=aA,this.securityDebugCallback_=null,this.lastSessionId=null,this.establishConnectionTimer_=null,this.visible_=!1,this.requestCBHash_={},this.requestNumber_=0,this.realtime_=null,this.authToken_=null,this.appCheckToken_=null,this.forceTokenRefresh_=!1,this.invalidAuthTokenCount_=0,this.invalidAppCheckTokenCount_=0,this.firstConnection_=!0,this.lastConnectionAttemptTime_=null,this.lastConnectionEstablishedTime_=null,l)throw new Error("Auth override specified in options, but not supported on non Node.js platforms");il.getInstance().on("visible",this.onVisible_,this),e.host.indexOf("fblocal")===-1&&ki.getInstance().on("online",this.onOnline_,this)}sendRequest(e,t,r){const s=++this.requestNumber_,i={r:s,a:e,b:t};this.log_(be(i)),O(this.connected_,"sendRequest call when we're not connected not allowed."),this.realtime_.sendRequest(i),r&&(this.requestCBHash_[s]=r)}get(e){this.initConnection_();const t=new Pt,s={action:"g",request:{p:e._path.toString(),q:e._queryObject},onComplete:a=>{const c=a.d;a.s==="ok"?t.resolve(c):t.reject(c)}};this.outstandingGets_.push(s),this.outstandingGetCount_++;const i=this.outstandingGets_.length-1;return this.connected_&&this.sendGet_(i),t.promise}listen(e,t,r,s){this.initConnection_();const i=e._queryIdentifier,a=e._path.toString();this.log_("Listen called for "+a+" "+i),this.listens.has(a)||this.listens.set(a,new Map),O(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"listen() called for non-default but complete query"),O(!this.listens.get(a).has(i),"listen() called twice for same path/queryId.");const c={onComplete:s,hashFn:t,query:e,tag:r};this.listens.get(a).set(i,c),this.connected_&&this.sendListen_(c)}sendGet_(e){const t=this.outstandingGets_[e];this.sendRequest("g",t.request,r=>{delete this.outstandingGets_[e],this.outstandingGetCount_--,this.outstandingGetCount_===0&&(this.outstandingGets_=[]),t.onComplete&&t.onComplete(r)})}sendListen_(e){const t=e.query,r=t._path.toString(),s=t._queryIdentifier;this.log_("Listen on "+r+" for "+s);const i={p:r},a="q";e.tag&&(i.q=t._queryObject,i.t=e.tag),i.h=e.hashFn(),this.sendRequest(a,i,c=>{const l=c.d,h=c.s;kt.warnOnListenWarnings_(l,t),(this.listens.get(r)&&this.listens.get(r).get(s))===e&&(this.log_("listen response",c),h!=="ok"&&this.removeListen_(r,s),e.onComplete&&e.onComplete(h,l))})}static warnOnListenWarnings_(e,t){if(e&&typeof e=="object"&&At(e,"w")){const r=Hn(e,"w");if(Array.isArray(r)&&~r.indexOf("no_index")){const s='".indexOn": "'+t._queryParams.getIndex().toString()+'"',i=t._path.toString();Ye(`Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ${s} at ${i} to your security rules for better performance.`)}}}refreshAuthToken(e){this.authToken_=e,this.log_("Auth token refreshed"),this.authToken_?this.tryAuth():this.connected_&&this.sendRequest("unauth",{},()=>{}),this.reduceReconnectDelayIfAdminCredential_(e)}reduceReconnectDelayIfAdminCredential_(e){(e&&e.length===40||pg(e))&&(this.log_("Admin auth credential detected.  Reducing max reconnect time."),this.maxReconnectDelay_=td)}refreshAppCheckToken(e){this.appCheckToken_=e,this.log_("App check token refreshed"),this.appCheckToken_?this.tryAppCheck():this.connected_&&this.sendRequest("unappeck",{},()=>{})}tryAuth(){if(this.connected_&&this.authToken_){const e=this.authToken_,t=fg(e)?"auth":"gauth",r={cred:e};this.authOverride_===null?r.noauth=!0:typeof this.authOverride_=="object"&&(r.authvar=this.authOverride_),this.sendRequest(t,r,s=>{const i=s.s,a=s.d||"error";this.authToken_===e&&(i==="ok"?this.invalidAuthTokenCount_=0:this.onAuthRevoked_(i,a))})}}tryAppCheck(){this.connected_&&this.appCheckToken_&&this.sendRequest("appcheck",{token:this.appCheckToken_},e=>{const t=e.s,r=e.d||"error";t==="ok"?this.invalidAppCheckTokenCount_=0:this.onAppCheckRevoked_(t,r)})}unlisten(e,t){const r=e._path.toString(),s=e._queryIdentifier;this.log_("Unlisten called for "+r+" "+s),O(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"unlisten() called for non-default but complete query"),this.removeListen_(r,s)&&this.connected_&&this.sendUnlisten_(r,s,e._queryObject,t)}sendUnlisten_(e,t,r,s){this.log_("Unlisten on "+e+" for "+t);const i={p:e},a="n";s&&(i.q=r,i.t=s),this.sendRequest(a,i)}onDisconnectPut(e,t,r){this.initConnection_(),this.connected_?this.sendOnDisconnect_("o",e,t,r):this.onDisconnectRequestQueue_.push({pathString:e,action:"o",data:t,onComplete:r})}onDisconnectMerge(e,t,r){this.initConnection_(),this.connected_?this.sendOnDisconnect_("om",e,t,r):this.onDisconnectRequestQueue_.push({pathString:e,action:"om",data:t,onComplete:r})}onDisconnectCancel(e,t){this.initConnection_(),this.connected_?this.sendOnDisconnect_("oc",e,null,t):this.onDisconnectRequestQueue_.push({pathString:e,action:"oc",data:null,onComplete:t})}sendOnDisconnect_(e,t,r,s){const i={p:t,d:r};this.log_("onDisconnect "+e,i),this.sendRequest(e,i,a=>{s&&setTimeout(()=>{s(a.s,a.d)},Math.floor(0))})}put(e,t,r,s){this.putInternal("p",e,t,r,s)}merge(e,t,r,s){this.putInternal("m",e,t,r,s)}putInternal(e,t,r,s,i){this.initConnection_();const a={p:t,d:r};i!==void 0&&(a.h=i),this.outstandingPuts_.push({action:e,request:a,onComplete:s}),this.outstandingPutCount_++;const c=this.outstandingPuts_.length-1;this.connected_?this.sendPut_(c):this.log_("Buffering put: "+t)}sendPut_(e){const t=this.outstandingPuts_[e].action,r=this.outstandingPuts_[e].request,s=this.outstandingPuts_[e].onComplete;this.outstandingPuts_[e].queued=this.connected_,this.sendRequest(t,r,i=>{this.log_(t+" response",i),delete this.outstandingPuts_[e],this.outstandingPutCount_--,this.outstandingPutCount_===0&&(this.outstandingPuts_=[]),s&&s(i.s,i.d)})}reportStats(e){if(this.connected_){const t={c:e};this.log_("reportStats",t),this.sendRequest("s",t,r=>{if(r.s!=="ok"){const i=r.d;this.log_("reportStats","Error sending stats: "+i)}})}}onDataMessage_(e){if("r"in e){this.log_("from server: "+be(e));const t=e.r,r=this.requestCBHash_[t];r&&(delete this.requestCBHash_[t],r(e.b))}else{if("error"in e)throw"A server-side error has occurred: "+e.error;"a"in e&&this.onDataPush_(e.a,e.b)}}onDataPush_(e,t){this.log_("handleServerMessage",e,t),e==="d"?this.onDataUpdate_(t.p,t.d,!1,t.t):e==="m"?this.onDataUpdate_(t.p,t.d,!0,t.t):e==="c"?this.onListenRevoked_(t.p,t.q):e==="ac"?this.onAuthRevoked_(t.s,t.d):e==="apc"?this.onAppCheckRevoked_(t.s,t.d):e==="sd"?this.onSecurityDebugPacket_(t):$a("Unrecognized action received from server: "+be(e)+`
Are you using the latest client?`)}onReady_(e,t){this.log_("connection ready"),this.connected_=!0,this.lastConnectionEstablishedTime_=new Date().getTime(),this.handleTimestamp_(e),this.lastSessionId=t,this.firstConnection_&&this.sendConnectStats_(),this.restoreState_(),this.firstConnection_=!1,this.onConnectStatus_(!0)}scheduleConnect_(e){O(!this.realtime_,"Scheduling a connect when we're already connected/ing?"),this.establishConnectionTimer_&&clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=setTimeout(()=>{this.establishConnectionTimer_=null,this.establishConnection_()},Math.floor(e))}initConnection_(){!this.realtime_&&this.firstConnection_&&this.scheduleConnect_(0)}onVisible_(e){e&&!this.visible_&&this.reconnectDelay_===this.maxReconnectDelay_&&(this.log_("Window became visible.  Reducing delay."),this.reconnectDelay_=Mr,this.realtime_||this.scheduleConnect_(0)),this.visible_=e}onOnline_(e){e?(this.log_("Browser went online."),this.reconnectDelay_=Mr,this.realtime_||this.scheduleConnect_(0)):(this.log_("Browser went offline.  Killing connection."),this.realtime_&&this.realtime_.close())}onRealtimeDisconnect_(){if(this.log_("data client disconnected"),this.connected_=!1,this.realtime_=null,this.cancelSentTransactions_(),this.requestCBHash_={},this.shouldReconnect_()){this.visible_?this.lastConnectionEstablishedTime_&&(new Date().getTime()-this.lastConnectionEstablishedTime_>lA&&(this.reconnectDelay_=Mr),this.lastConnectionEstablishedTime_=null):(this.log_("Window isn't visible.  Delaying reconnect."),this.reconnectDelay_=this.maxReconnectDelay_,this.lastConnectionAttemptTime_=new Date().getTime());const e=Math.max(0,new Date().getTime()-this.lastConnectionAttemptTime_);let t=Math.max(0,this.reconnectDelay_-e);t=Math.random()*t,this.log_("Trying to reconnect in "+t+"ms"),this.scheduleConnect_(t),this.reconnectDelay_=Math.min(this.maxReconnectDelay_,this.reconnectDelay_*cA)}this.onConnectStatus_(!1)}async establishConnection_(){if(this.shouldReconnect_()){this.log_("Making a connection attempt"),this.lastConnectionAttemptTime_=new Date().getTime(),this.lastConnectionEstablishedTime_=null;const e=this.onDataMessage_.bind(this),t=this.onReady_.bind(this),r=this.onRealtimeDisconnect_.bind(this),s=this.id+":"+kt.nextConnectionId_++,i=this.lastSessionId;let a=!1,c=null;const l=function(){c?c.close():(a=!0,r())},h=function(p){O(c,"sendRequest call when we're not connected not allowed."),c.sendRequest(p)};this.realtime_={close:l,sendRequest:h};const f=this.forceTokenRefresh_;this.forceTokenRefresh_=!1;try{const[p,m]=await Promise.all([this.authTokenProvider_.getToken(f),this.appCheckTokenProvider_.getToken(f)]);a?Se("getToken() completed but was canceled"):(Se("getToken() completed. Creating connection."),this.authToken_=p&&p.accessToken,this.appCheckToken_=m&&m.token,c=new tA(s,this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,e,t,r,v=>{Ye(v+" ("+this.repoInfo_.toString()+")"),this.interrupt(uA)},i))}catch(p){this.log_("Failed to get token: "+p),a||(this.repoInfo_.nodeAdmin&&Ye(p),l())}}}interrupt(e){Se("Interrupting connection for reason: "+e),this.interruptReasons_[e]=!0,this.realtime_?this.realtime_.close():(this.establishConnectionTimer_&&(clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=null),this.connected_&&this.onRealtimeDisconnect_())}resume(e){Se("Resuming connection for reason: "+e),delete this.interruptReasons_[e],ma(this.interruptReasons_)&&(this.reconnectDelay_=Mr,this.realtime_||this.scheduleConnect_(0))}handleTimestamp_(e){const t=e-new Date().getTime();this.onServerInfoUpdate_({serverTimeOffset:t})}cancelSentTransactions_(){for(let e=0;e<this.outstandingPuts_.length;e++){const t=this.outstandingPuts_[e];t&&"h"in t.request&&t.queued&&(t.onComplete&&t.onComplete("disconnect"),delete this.outstandingPuts_[e],this.outstandingPutCount_--)}this.outstandingPutCount_===0&&(this.outstandingPuts_=[])}onListenRevoked_(e,t){let r;t?r=t.map(i=>el(i)).join("$"):r="default";const s=this.removeListen_(e,r);s&&s.onComplete&&s.onComplete("permission_denied")}removeListen_(e,t){const r=new se(e).toString();let s;if(this.listens.has(r)){const i=this.listens.get(r);s=i.get(t),i.delete(t),i.size===0&&this.listens.delete(r)}else s=void 0;return s}onAuthRevoked_(e,t){Se("Auth token revoked: "+e+"/"+t),this.authToken_=null,this.forceTokenRefresh_=!0,this.realtime_.close(),(e==="invalid_token"||e==="permission_denied")&&(this.invalidAuthTokenCount_++,this.invalidAuthTokenCount_>=nd&&(this.reconnectDelay_=td,this.authTokenProvider_.notifyForInvalidToken()))}onAppCheckRevoked_(e,t){Se("App check token revoked: "+e+"/"+t),this.appCheckToken_=null,this.forceTokenRefresh_=!0,(e==="invalid_token"||e==="permission_denied")&&(this.invalidAppCheckTokenCount_++,this.invalidAppCheckTokenCount_>=nd&&this.appCheckTokenProvider_.notifyForInvalidToken())}onSecurityDebugPacket_(e){this.securityDebugCallback_?this.securityDebugCallback_(e):"msg"in e&&console.log("FIREBASE: "+e.msg.replace(`
`,`
FIREBASE: `))}restoreState_(){this.tryAuth(),this.tryAppCheck();for(const e of this.listens.values())for(const t of e.values())this.sendListen_(t);for(let e=0;e<this.outstandingPuts_.length;e++)this.outstandingPuts_[e]&&this.sendPut_(e);for(;this.onDisconnectRequestQueue_.length;){const e=this.onDisconnectRequestQueue_.shift();this.sendOnDisconnect_(e.action,e.pathString,e.data,e.onComplete)}for(let e=0;e<this.outstandingGets_.length;e++)this.outstandingGets_[e]&&this.sendGet_(e)}sendConnectStats_(){const e={};let t="js";e["sdk."+t+"."+Up.replace(/\./g,"-")]=1,oc()?e["framework.cordova"]=1:xd()&&(e["framework.reactnative"]=1),this.reportStats(e)}shouldReconnect_(){const e=ki.getInstance().currentlyOnline();return ma(this.interruptReasons_)&&e}}kt.nextPersistentConnectionId_=0;kt.nextConnectionId_=0;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Y{constructor(e,t){this.name=e,this.node=t}static Wrap(e,t){return new Y(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yo{getCompare(){return this.compare.bind(this)}indexedValueChanged(e,t){const r=new Y(tr,e),s=new Y(tr,t);return this.compare(r,s)!==0}minPost(){return Y.MIN}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ti;class h_ extends yo{static get __EMPTY_NODE(){return ti}static set __EMPTY_NODE(e){ti=e}compare(e,t){return Pn(e.name,t.name)}isDefinedOn(e){throw sr("KeyIndex.isDefinedOn not expected to be called.")}indexedValueChanged(e,t){return!1}minPost(){return Y.MIN}maxPost(){return new Y(An,ti)}makePost(e,t){return O(typeof e=="string","KeyIndex indexValue must always be a string."),new Y(e,ti)}toString(){return".key"}}const jn=new h_;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ni{constructor(e,t,r,s,i=null){this.isReverse_=s,this.resultGenerator_=i,this.nodeStack_=[];let a=1;for(;!e.isEmpty();)if(e=e,a=t?r(e.key,t):1,s&&(a*=-1),a<0)this.isReverse_?e=e.left:e=e.right;else if(a===0){this.nodeStack_.push(e);break}else this.nodeStack_.push(e),this.isReverse_?e=e.right:e=e.left}getNext(){if(this.nodeStack_.length===0)return null;let e=this.nodeStack_.pop(),t;if(this.resultGenerator_?t=this.resultGenerator_(e.key,e.value):t={key:e.key,value:e.value},this.isReverse_)for(e=e.left;!e.isEmpty();)this.nodeStack_.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack_.push(e),e=e.left;return t}hasNext(){return this.nodeStack_.length>0}peek(){if(this.nodeStack_.length===0)return null;const e=this.nodeStack_[this.nodeStack_.length-1];return this.resultGenerator_?this.resultGenerator_(e.key,e.value):{key:e.key,value:e.value}}}class Ce{constructor(e,t,r,s,i){this.key=e,this.value=t,this.color=r??Ce.RED,this.left=s??Ke.EMPTY_NODE,this.right=i??Ke.EMPTY_NODE}copy(e,t,r,s,i){return new Ce(e??this.key,t??this.value,r??this.color,s??this.left,i??this.right)}count(){return this.left.count()+1+this.right.count()}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||!!e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min_(){return this.left.isEmpty()?this:this.left.min_()}minKey(){return this.min_().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,r){let s=this;const i=r(e,s.key);return i<0?s=s.copy(null,null,null,s.left.insert(e,t,r),null):i===0?s=s.copy(null,t,null,null,null):s=s.copy(null,null,null,null,s.right.insert(e,t,r)),s.fixUp_()}removeMin_(){if(this.left.isEmpty())return Ke.EMPTY_NODE;let e=this;return!e.left.isRed_()&&!e.left.left.isRed_()&&(e=e.moveRedLeft_()),e=e.copy(null,null,null,e.left.removeMin_(),null),e.fixUp_()}remove(e,t){let r,s;if(r=this,t(e,r.key)<0)!r.left.isEmpty()&&!r.left.isRed_()&&!r.left.left.isRed_()&&(r=r.moveRedLeft_()),r=r.copy(null,null,null,r.left.remove(e,t),null);else{if(r.left.isRed_()&&(r=r.rotateRight_()),!r.right.isEmpty()&&!r.right.isRed_()&&!r.right.left.isRed_()&&(r=r.moveRedRight_()),t(e,r.key)===0){if(r.right.isEmpty())return Ke.EMPTY_NODE;s=r.right.min_(),r=r.copy(s.key,s.value,null,null,r.right.removeMin_())}r=r.copy(null,null,null,null,r.right.remove(e,t))}return r.fixUp_()}isRed_(){return this.color}fixUp_(){let e=this;return e.right.isRed_()&&!e.left.isRed_()&&(e=e.rotateLeft_()),e.left.isRed_()&&e.left.left.isRed_()&&(e=e.rotateRight_()),e.left.isRed_()&&e.right.isRed_()&&(e=e.colorFlip_()),e}moveRedLeft_(){let e=this.colorFlip_();return e.right.left.isRed_()&&(e=e.copy(null,null,null,null,e.right.rotateRight_()),e=e.rotateLeft_(),e=e.colorFlip_()),e}moveRedRight_(){let e=this.colorFlip_();return e.left.left.isRed_()&&(e=e.rotateRight_(),e=e.colorFlip_()),e}rotateLeft_(){const e=this.copy(null,null,Ce.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight_(){const e=this.copy(null,null,Ce.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip_(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth_(){const e=this.check_();return Math.pow(2,e)<=this.count()+1}check_(){if(this.isRed_()&&this.left.isRed_())throw new Error("Red node has red child("+this.key+","+this.value+")");if(this.right.isRed_())throw new Error("Right child of ("+this.key+","+this.value+") is red");const e=this.left.check_();if(e!==this.right.check_())throw new Error("Black depths differ");return e+(this.isRed_()?0:1)}}Ce.RED=!0;Ce.BLACK=!1;class hA{copy(e,t,r,s,i){return this}insert(e,t,r){return new Ce(e,t,null)}remove(e,t){return this}count(){return 0}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}check_(){return 0}isRed_(){return!1}}class Ke{constructor(e,t=Ke.EMPTY_NODE){this.comparator_=e,this.root_=t}insert(e,t){return new Ke(this.comparator_,this.root_.insert(e,t,this.comparator_).copy(null,null,Ce.BLACK,null,null))}remove(e){return new Ke(this.comparator_,this.root_.remove(e,this.comparator_).copy(null,null,Ce.BLACK,null,null))}get(e){let t,r=this.root_;for(;!r.isEmpty();){if(t=this.comparator_(e,r.key),t===0)return r.value;t<0?r=r.left:t>0&&(r=r.right)}return null}getPredecessorKey(e){let t,r=this.root_,s=null;for(;!r.isEmpty();)if(t=this.comparator_(e,r.key),t===0){if(r.left.isEmpty())return s?s.key:null;for(r=r.left;!r.right.isEmpty();)r=r.right;return r.key}else t<0?r=r.left:t>0&&(s=r,r=r.right);throw new Error("Attempted to find predecessor key for a nonexistent key.  What gives?")}isEmpty(){return this.root_.isEmpty()}count(){return this.root_.count()}minKey(){return this.root_.minKey()}maxKey(){return this.root_.maxKey()}inorderTraversal(e){return this.root_.inorderTraversal(e)}reverseTraversal(e){return this.root_.reverseTraversal(e)}getIterator(e){return new ni(this.root_,null,this.comparator_,!1,e)}getIteratorFrom(e,t){return new ni(this.root_,e,this.comparator_,!1,t)}getReverseIteratorFrom(e,t){return new ni(this.root_,e,this.comparator_,!0,t)}getReverseIterator(e){return new ni(this.root_,null,this.comparator_,!0,e)}}Ke.EMPTY_NODE=new hA;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dA(n,e){return Pn(n.name,e.name)}function ol(n,e){return Pn(n,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Wa;function fA(n){Wa=n}const d_=function(n){return typeof n=="number"?"number:"+jp(n):"string:"+n},f_=function(n){if(n.isLeafNode()){const e=n.val();O(typeof e=="string"||typeof e=="number"||typeof e=="object"&&At(e,".sv"),"Priority must be a string or number.")}else O(n===Wa||n.isEmpty(),"priority of unexpected type.");O(n===Wa||n.getPriority().isEmpty(),"Priority nodes can't have a priority of their own.")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let rd;class we{static set __childrenNodeConstructor(e){rd=e}static get __childrenNodeConstructor(){return rd}constructor(e,t=we.__childrenNodeConstructor.EMPTY_NODE){this.value_=e,this.priorityNode_=t,this.lazyHash_=null,O(this.value_!==void 0&&this.value_!==null,"LeafNode shouldn't be created with null/undefined value."),f_(this.priorityNode_)}isLeafNode(){return!0}getPriority(){return this.priorityNode_}updatePriority(e){return new we(this.value_,e)}getImmediateChild(e){return e===".priority"?this.priorityNode_:we.__childrenNodeConstructor.EMPTY_NODE}getChild(e){return G(e)?this:z(e)===".priority"?this.priorityNode_:we.__childrenNodeConstructor.EMPTY_NODE}hasChild(){return!1}getPredecessorChildName(e,t){return null}updateImmediateChild(e,t){return e===".priority"?this.updatePriority(t):t.isEmpty()&&e!==".priority"?this:we.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(e,t).updatePriority(this.priorityNode_)}updateChild(e,t){const r=z(e);return r===null?t:t.isEmpty()&&r!==".priority"?this:(O(r!==".priority"||sn(e)===1,".priority must be the last token in a path"),this.updateImmediateChild(r,we.__childrenNodeConstructor.EMPTY_NODE.updateChild(ie(e),t)))}isEmpty(){return!1}numChildren(){return 0}forEachChild(e,t){return!1}val(e){return e&&!this.getPriority().isEmpty()?{".value":this.getValue(),".priority":this.getPriority().val()}:this.getValue()}hash(){if(this.lazyHash_===null){let e="";this.priorityNode_.isEmpty()||(e+="priority:"+d_(this.priorityNode_.val())+":");const t=typeof this.value_;e+=t+":",t==="number"?e+=jp(this.value_):e+=this.value_,this.lazyHash_=qp(e)}return this.lazyHash_}getValue(){return this.value_}compareTo(e){return e===we.__childrenNodeConstructor.EMPTY_NODE?1:e instanceof we.__childrenNodeConstructor?-1:(O(e.isLeafNode(),"Unknown node type"),this.compareToLeafNode_(e))}compareToLeafNode_(e){const t=typeof e.value_,r=typeof this.value_,s=we.VALUE_TYPE_ORDER.indexOf(t),i=we.VALUE_TYPE_ORDER.indexOf(r);return O(s>=0,"Unknown leaf type: "+t),O(i>=0,"Unknown leaf type: "+r),s===i?r==="object"?0:this.value_<e.value_?-1:this.value_===e.value_?0:1:i-s}withIndex(){return this}isIndexed(){return!0}equals(e){if(e===this)return!0;if(e.isLeafNode()){const t=e;return this.value_===t.value_&&this.priorityNode_.equals(t.priorityNode_)}else return!1}}we.VALUE_TYPE_ORDER=["object","boolean","number","string"];/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let p_,__;function pA(n){p_=n}function _A(n){__=n}class mA extends yo{compare(e,t){const r=e.node.getPriority(),s=t.node.getPriority(),i=r.compareTo(s);return i===0?Pn(e.name,t.name):i}isDefinedOn(e){return!e.getPriority().isEmpty()}indexedValueChanged(e,t){return!e.getPriority().equals(t.getPriority())}minPost(){return Y.MIN}maxPost(){return new Y(An,new we("[PRIORITY-POST]",__))}makePost(e,t){const r=p_(e);return new Y(t,new we("[PRIORITY-POST]",r))}toString(){return".priority"}}const Ne=new mA;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gA=Math.log(2);class yA{constructor(e){const t=i=>parseInt(Math.log(i)/gA,10),r=i=>parseInt(Array(i+1).join("1"),2);this.count=t(e+1),this.current_=this.count-1;const s=r(this.count);this.bits_=e+1&s}nextBitIsOne(){const e=!(this.bits_&1<<this.current_);return this.current_--,e}}const Di=function(n,e,t,r){n.sort(e);const s=function(l,h){const f=h-l;let p,m;if(f===0)return null;if(f===1)return p=n[l],m=t?t(p):p,new Ce(m,p.node,Ce.BLACK,null,null);{const v=parseInt(f/2,10)+l,R=s(l,v),k=s(v+1,h);return p=n[v],m=t?t(p):p,new Ce(m,p.node,Ce.BLACK,R,k)}},i=function(l){let h=null,f=null,p=n.length;const m=function(R,k){const P=p-R,F=p;p-=R;const x=s(P+1,F),B=n[P],j=t?t(B):B;v(new Ce(j,B.node,k,null,x))},v=function(R){h?(h.left=R,h=R):(f=R,h=R)};for(let R=0;R<l.count;++R){const k=l.nextBitIsOne(),P=Math.pow(2,l.count-(R+1));k?m(P,Ce.BLACK):(m(P,Ce.BLACK),m(P,Ce.RED))}return f},a=new yA(n.length),c=i(a);return new Ke(r||e,c)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ua;const Ln={};class Nt{static get Default(){return O(Ln&&Ne,"ChildrenNode.ts has not been loaded"),ua=ua||new Nt({".priority":Ln},{".priority":Ne}),ua}constructor(e,t){this.indexes_=e,this.indexSet_=t}get(e){const t=Hn(this.indexes_,e);if(!t)throw new Error("No index defined for "+e);return t instanceof Ke?t:null}hasIndex(e){return At(this.indexSet_,e.toString())}addIndex(e,t){O(e!==jn,"KeyIndex always exists and isn't meant to be added to the IndexMap.");const r=[];let s=!1;const i=t.getIterator(Y.Wrap);let a=i.getNext();for(;a;)s=s||e.isDefinedOn(a.node),r.push(a),a=i.getNext();let c;s?c=Di(r,e.getCompare()):c=Ln;const l=e.toString(),h={...this.indexSet_};h[l]=e;const f={...this.indexes_};return f[l]=c,new Nt(f,h)}addToIndexes(e,t){const r=_i(this.indexes_,(s,i)=>{const a=Hn(this.indexSet_,i);if(O(a,"Missing index implementation for "+i),s===Ln)if(a.isDefinedOn(e.node)){const c=[],l=t.getIterator(Y.Wrap);let h=l.getNext();for(;h;)h.name!==e.name&&c.push(h),h=l.getNext();return c.push(e),Di(c,a.getCompare())}else return Ln;else{const c=t.get(e.name);let l=s;return c&&(l=l.remove(new Y(e.name,c))),l.insert(e,e.node)}});return new Nt(r,this.indexSet_)}removeFromIndexes(e,t){const r=_i(this.indexes_,s=>{if(s===Ln)return s;{const i=t.get(e.name);return i?s.remove(new Y(e.name,i)):s}});return new Nt(r,this.indexSet_)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Lr;class ee{static get EMPTY_NODE(){return Lr||(Lr=new ee(new Ke(ol),null,Nt.Default))}constructor(e,t,r){this.children_=e,this.priorityNode_=t,this.indexMap_=r,this.lazyHash_=null,this.priorityNode_&&f_(this.priorityNode_),this.children_.isEmpty()&&O(!this.priorityNode_||this.priorityNode_.isEmpty(),"An empty node cannot have a priority")}isLeafNode(){return!1}getPriority(){return this.priorityNode_||Lr}updatePriority(e){return this.children_.isEmpty()?this:new ee(this.children_,e,this.indexMap_)}getImmediateChild(e){if(e===".priority")return this.getPriority();{const t=this.children_.get(e);return t===null?Lr:t}}getChild(e){const t=z(e);return t===null?this:this.getImmediateChild(t).getChild(ie(e))}hasChild(e){return this.children_.get(e)!==null}updateImmediateChild(e,t){if(O(t,"We should always be passing snapshot nodes"),e===".priority")return this.updatePriority(t);{const r=new Y(e,t);let s,i;t.isEmpty()?(s=this.children_.remove(e),i=this.indexMap_.removeFromIndexes(r,this.children_)):(s=this.children_.insert(e,t),i=this.indexMap_.addToIndexes(r,this.children_));const a=s.isEmpty()?Lr:this.priorityNode_;return new ee(s,a,i)}}updateChild(e,t){const r=z(e);if(r===null)return t;{O(z(e)!==".priority"||sn(e)===1,".priority must be the last token in a path");const s=this.getImmediateChild(r).updateChild(ie(e),t);return this.updateImmediateChild(r,s)}}isEmpty(){return this.children_.isEmpty()}numChildren(){return this.children_.count()}val(e){if(this.isEmpty())return null;const t={};let r=0,s=0,i=!0;if(this.forEachChild(Ne,(a,c)=>{t[a]=c.val(e),r++,i&&ee.INTEGER_REGEXP_.test(a)?s=Math.max(s,Number(a)):i=!1}),!e&&i&&s<2*r){const a=[];for(const c in t)a[c]=t[c];return a}else return e&&!this.getPriority().isEmpty()&&(t[".priority"]=this.getPriority().val()),t}hash(){if(this.lazyHash_===null){let e="";this.getPriority().isEmpty()||(e+="priority:"+d_(this.getPriority().val())+":"),this.forEachChild(Ne,(t,r)=>{const s=r.hash();s!==""&&(e+=":"+t+":"+s)}),this.lazyHash_=e===""?"":qp(e)}return this.lazyHash_}getPredecessorChildName(e,t,r){const s=this.resolveIndex_(r);if(s){const i=s.getPredecessorKey(new Y(e,t));return i?i.name:null}else return this.children_.getPredecessorKey(e)}getFirstChildName(e){const t=this.resolveIndex_(e);if(t){const r=t.minKey();return r&&r.name}else return this.children_.minKey()}getFirstChild(e){const t=this.getFirstChildName(e);return t?new Y(t,this.children_.get(t)):null}getLastChildName(e){const t=this.resolveIndex_(e);if(t){const r=t.maxKey();return r&&r.name}else return this.children_.maxKey()}getLastChild(e){const t=this.getLastChildName(e);return t?new Y(t,this.children_.get(t)):null}forEachChild(e,t){const r=this.resolveIndex_(e);return r?r.inorderTraversal(s=>t(s.name,s.node)):this.children_.inorderTraversal(t)}getIterator(e){return this.getIteratorFrom(e.minPost(),e)}getIteratorFrom(e,t){const r=this.resolveIndex_(t);if(r)return r.getIteratorFrom(e,s=>s);{const s=this.children_.getIteratorFrom(e.name,Y.Wrap);let i=s.peek();for(;i!=null&&t.compare(i,e)<0;)s.getNext(),i=s.peek();return s}}getReverseIterator(e){return this.getReverseIteratorFrom(e.maxPost(),e)}getReverseIteratorFrom(e,t){const r=this.resolveIndex_(t);if(r)return r.getReverseIteratorFrom(e,s=>s);{const s=this.children_.getReverseIteratorFrom(e.name,Y.Wrap);let i=s.peek();for(;i!=null&&t.compare(i,e)>0;)s.getNext(),i=s.peek();return s}}compareTo(e){return this.isEmpty()?e.isEmpty()?0:-1:e.isLeafNode()||e.isEmpty()?1:e===Rs?-1:0}withIndex(e){if(e===jn||this.indexMap_.hasIndex(e))return this;{const t=this.indexMap_.addIndex(e,this.children_);return new ee(this.children_,this.priorityNode_,t)}}isIndexed(e){return e===jn||this.indexMap_.hasIndex(e)}equals(e){if(e===this)return!0;if(e.isLeafNode())return!1;{const t=e;if(this.getPriority().equals(t.getPriority()))if(this.children_.count()===t.children_.count()){const r=this.getIterator(Ne),s=t.getIterator(Ne);let i=r.getNext(),a=s.getNext();for(;i&&a;){if(i.name!==a.name||!i.node.equals(a.node))return!1;i=r.getNext(),a=s.getNext()}return i===null&&a===null}else return!1;else return!1}}resolveIndex_(e){return e===jn?null:this.indexMap_.get(e.toString())}}ee.INTEGER_REGEXP_=/^(0|[1-9]\d*)$/;class EA extends ee{constructor(){super(new Ke(ol),ee.EMPTY_NODE,Nt.Default)}compareTo(e){return e===this?0:1}equals(e){return e===this}getPriority(){return this}getImmediateChild(e){return ee.EMPTY_NODE}isEmpty(){return!1}}const Rs=new EA;Object.defineProperties(Y,{MIN:{value:new Y(tr,ee.EMPTY_NODE)},MAX:{value:new Y(An,Rs)}});h_.__EMPTY_NODE=ee.EMPTY_NODE;we.__childrenNodeConstructor=ee;fA(Rs);_A(Rs);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const TA=!0;function ye(n,e=null){if(n===null)return ee.EMPTY_NODE;if(typeof n=="object"&&".priority"in n&&(e=n[".priority"]),O(e===null||typeof e=="string"||typeof e=="number"||typeof e=="object"&&".sv"in e,"Invalid priority type found: "+typeof e),typeof n=="object"&&".value"in n&&n[".value"]!==null&&(n=n[".value"]),typeof n!="object"||".sv"in n){const t=n;return new we(t,ye(e))}if(!(n instanceof Array)&&TA){const t=[];let r=!1;if(Xe(n,(a,c)=>{if(a.substring(0,1)!=="."){const l=ye(c);l.isEmpty()||(r=r||!l.getPriority().isEmpty(),t.push(new Y(a,l)))}}),t.length===0)return ee.EMPTY_NODE;const i=Di(t,dA,a=>a.name,ol);if(r){const a=Di(t,Ne.getCompare());return new ee(i,ye(e),new Nt({".priority":a},{".priority":Ne}))}else return new ee(i,ye(e),Nt.Default)}else{let t=ee.EMPTY_NODE;return Xe(n,(r,s)=>{if(At(n,r)&&r.substring(0,1)!=="."){const i=ye(s);(i.isLeafNode()||!i.isEmpty())&&(t=t.updateImmediateChild(r,i))}}),t.updatePriority(ye(e))}}pA(ye);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vA extends yo{constructor(e){super(),this.indexPath_=e,O(!G(e)&&z(e)!==".priority","Can't create PathIndex with empty path or .priority key")}extractChild(e){return e.getChild(this.indexPath_)}isDefinedOn(e){return!e.getChild(this.indexPath_).isEmpty()}compare(e,t){const r=this.extractChild(e.node),s=this.extractChild(t.node),i=r.compareTo(s);return i===0?Pn(e.name,t.name):i}makePost(e,t){const r=ye(e),s=ee.EMPTY_NODE.updateChild(this.indexPath_,r);return new Y(t,s)}maxPost(){const e=ee.EMPTY_NODE.updateChild(this.indexPath_,Rs);return new Y(An,e)}toString(){return fs(this.indexPath_,0).join("/")}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class IA extends yo{compare(e,t){const r=e.node.compareTo(t.node);return r===0?Pn(e.name,t.name):r}isDefinedOn(e){return!0}indexedValueChanged(e,t){return!e.equals(t)}minPost(){return Y.MIN}maxPost(){return Y.MAX}makePost(e,t){const r=ye(e);return new Y(t,r)}toString(){return".value"}}const wA=new IA;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function AA(n){return{type:"value",snapshotNode:n}}function CA(n,e){return{type:"child_added",snapshotNode:e,childName:n}}function RA(n,e){return{type:"child_removed",snapshotNode:e,childName:n}}function sd(n,e,t){return{type:"child_changed",snapshotNode:e,childName:n,oldSnap:t}}function SA(n,e){return{type:"child_moved",snapshotNode:e,childName:n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class al{constructor(){this.limitSet_=!1,this.startSet_=!1,this.startNameSet_=!1,this.startAfterSet_=!1,this.endSet_=!1,this.endNameSet_=!1,this.endBeforeSet_=!1,this.limit_=0,this.viewFrom_="",this.indexStartValue_=null,this.indexStartName_="",this.indexEndValue_=null,this.indexEndName_="",this.index_=Ne}hasStart(){return this.startSet_}isViewFromLeft(){return this.viewFrom_===""?this.startSet_:this.viewFrom_==="l"}getIndexStartValue(){return O(this.startSet_,"Only valid if start has been set"),this.indexStartValue_}getIndexStartName(){return O(this.startSet_,"Only valid if start has been set"),this.startNameSet_?this.indexStartName_:tr}hasEnd(){return this.endSet_}getIndexEndValue(){return O(this.endSet_,"Only valid if end has been set"),this.indexEndValue_}getIndexEndName(){return O(this.endSet_,"Only valid if end has been set"),this.endNameSet_?this.indexEndName_:An}hasLimit(){return this.limitSet_}hasAnchoredLimit(){return this.limitSet_&&this.viewFrom_!==""}getLimit(){return O(this.limitSet_,"Only valid if limit has been set"),this.limit_}getIndex(){return this.index_}loadsAllData(){return!(this.startSet_||this.endSet_||this.limitSet_)}isDefault(){return this.loadsAllData()&&this.index_===Ne}copy(){const e=new al;return e.limitSet_=this.limitSet_,e.limit_=this.limit_,e.startSet_=this.startSet_,e.startAfterSet_=this.startAfterSet_,e.indexStartValue_=this.indexStartValue_,e.startNameSet_=this.startNameSet_,e.indexStartName_=this.indexStartName_,e.endSet_=this.endSet_,e.endBeforeSet_=this.endBeforeSet_,e.indexEndValue_=this.indexEndValue_,e.endNameSet_=this.endNameSet_,e.indexEndName_=this.indexEndName_,e.index_=this.index_,e.viewFrom_=this.viewFrom_,e}}function id(n){const e={};if(n.isDefault())return e;let t;if(n.index_===Ne?t="$priority":n.index_===wA?t="$value":n.index_===jn?t="$key":(O(n.index_ instanceof vA,"Unrecognized index type!"),t=n.index_.toString()),e.orderBy=be(t),n.startSet_){const r=n.startAfterSet_?"startAfter":"startAt";e[r]=be(n.indexStartValue_),n.startNameSet_&&(e[r]+=","+be(n.indexStartName_))}if(n.endSet_){const r=n.endBeforeSet_?"endBefore":"endAt";e[r]=be(n.indexEndValue_),n.endNameSet_&&(e[r]+=","+be(n.indexEndName_))}return n.limitSet_&&(n.isViewFromLeft()?e.limitToFirst=n.limit_:e.limitToLast=n.limit_),e}function od(n){const e={};if(n.startSet_&&(e.sp=n.indexStartValue_,n.startNameSet_&&(e.sn=n.indexStartName_),e.sin=!n.startAfterSet_),n.endSet_&&(e.ep=n.indexEndValue_,n.endNameSet_&&(e.en=n.indexEndName_),e.ein=!n.endBeforeSet_),n.limitSet_){e.l=n.limit_;let t=n.viewFrom_;t===""&&(n.isViewFromLeft()?t="l":t="r"),e.vf=t}return n.index_!==Ne&&(e.i=n.index_.toString()),e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Oi extends o_{reportStats(e){throw new Error("Method not implemented.")}static getListenId_(e,t){return t!==void 0?"tag$"+t:(O(e._queryParams.isDefault(),"should have a tag if it's not a default query."),e._path.toString())}constructor(e,t,r,s){super(),this.repoInfo_=e,this.onDataUpdate_=t,this.authTokenProvider_=r,this.appCheckTokenProvider_=s,this.log_=Cs("p:rest:"),this.listens_={}}listen(e,t,r,s){const i=e._path.toString();this.log_("Listen called for "+i+" "+e._queryIdentifier);const a=Oi.getListenId_(e,r),c={};this.listens_[a]=c;const l=id(e._queryParams);this.restRequest_(i+".json",l,(h,f)=>{let p=f;if(h===404&&(p=null,h=null),h===null&&this.onDataUpdate_(i,p,!1,r),Hn(this.listens_,a)===c){let m;h?h===401?m="permission_denied":m="rest_error:"+h:m="ok",s(m,null)}})}unlisten(e,t){const r=Oi.getListenId_(e,t);delete this.listens_[r]}get(e){const t=id(e._queryParams),r=e._path.toString(),s=new Pt;return this.restRequest_(r+".json",t,(i,a)=>{let c=a;i===404&&(c=null,i=null),i===null?(this.onDataUpdate_(r,c,!1,null),s.resolve(c)):s.reject(new Error(c))}),s.promise}refreshAuthToken(e){}restRequest_(e,t={},r){return t.format="export",Promise.all([this.authTokenProvider_.getToken(!1),this.appCheckTokenProvider_.getToken(!1)]).then(([s,i])=>{s&&s.accessToken&&(t.auth=s.accessToken),i&&i.token&&(t.ac=i.token);const a=(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host+e+"?ns="+this.repoInfo_.namespace+ac(t);this.log_("Sending REST request for "+a);const c=new XMLHttpRequest;c.onreadystatechange=()=>{if(r&&c.readyState===4){this.log_("REST Response for "+a+" received. status:",c.status,"response:",c.responseText);let l=null;if(c.status>=200&&c.status<300){try{l=ts(c.responseText)}catch{Ye("Failed to parse JSON response for "+a+": "+c.responseText)}r(null,l)}else c.status!==401&&c.status!==404&&Ye("Got unsuccessful REST response for "+a+" Status: "+c.status),r(c.status);r=null}},c.open("GET",a,!0),c.send()})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bA{constructor(){this.rootNode_=ee.EMPTY_NODE}getNode(e){return this.rootNode_.getChild(e)}updateSnapshot(e,t){this.rootNode_=this.rootNode_.updateChild(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vi(){return{value:null,children:new Map}}function pr(n,e,t){if(G(e))n.value=t,n.children.clear();else if(n.value!==null)n.value=n.value.updateChild(e,t);else{const r=z(e);n.children.has(r)||n.children.set(r,Vi());const s=n.children.get(r);e=ie(e),pr(s,e,t)}}function za(n,e){if(G(e))return n.value=null,n.children.clear(),!0;if(n.value!==null){if(n.value.isLeafNode())return!1;{const t=n.value;return n.value=null,t.forEachChild(Ne,(r,s)=>{pr(n,new se(r),s)}),za(n,e)}}else if(n.children.size>0){const t=z(e);return e=ie(e),n.children.has(t)&&za(n.children.get(t),e)&&n.children.delete(t),n.children.size===0}else return!0}function Ha(n,e,t){n.value!==null?t(e,n.value):PA(n,(r,s)=>{const i=new se(e.toString()+"/"+r);Ha(s,i,t)})}function PA(n,e){n.children.forEach((t,r)=>{e(r,t)})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class NA{constructor(e){this.collection_=e,this.last_=null}get(){const e=this.collection_.get(),t={...e};return this.last_&&Xe(this.last_,(r,s)=>{t[r]=t[r]-s}),this.last_=e,t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ad=10*1e3,kA=30*1e3,DA=5*60*1e3;class OA{constructor(e,t){this.server_=t,this.statsToReport_={},this.statsListener_=new NA(e);const r=ad+(kA-ad)*Math.random();Yr(this.reportStats_.bind(this),Math.floor(r))}reportStats_(){const e=this.statsListener_.get(),t={};let r=!1;Xe(e,(s,i)=>{i>0&&At(this.statsToReport_,s)&&(t[s]=i,r=!0)}),r&&this.server_.reportStats(t),Yr(this.reportStats_.bind(this),Math.floor(Math.random()*2*DA))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var pt;(function(n){n[n.OVERWRITE=0]="OVERWRITE",n[n.MERGE=1]="MERGE",n[n.ACK_USER_WRITE=2]="ACK_USER_WRITE",n[n.LISTEN_COMPLETE=3]="LISTEN_COMPLETE"})(pt||(pt={}));function m_(){return{fromUser:!0,fromServer:!1,queryId:null,tagged:!1}}function g_(){return{fromUser:!1,fromServer:!0,queryId:null,tagged:!1}}function y_(n){return{fromUser:!1,fromServer:!0,queryId:n,tagged:!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mi{constructor(e,t,r){this.path=e,this.affectedTree=t,this.revert=r,this.type=pt.ACK_USER_WRITE,this.source=m_()}operationForChild(e){if(G(this.path)){if(this.affectedTree.value!=null)return O(this.affectedTree.children.isEmpty(),"affectedTree should not have overlapping affected paths."),this;{const t=this.affectedTree.subtree(new se(e));return new Mi(ne(),t,this.revert)}}else return O(z(this.path)===e,"operationForChild called for unrelated child."),new Mi(ie(this.path),this.affectedTree,this.revert)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cn{constructor(e,t,r){this.source=e,this.path=t,this.snap=r,this.type=pt.OVERWRITE}operationForChild(e){return G(this.path)?new Cn(this.source,ne(),this.snap.getImmediateChild(e)):new Cn(this.source,ie(this.path),this.snap)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ps{constructor(e,t,r){this.source=e,this.path=t,this.children=r,this.type=pt.MERGE}operationForChild(e){if(G(this.path)){const t=this.children.subtree(new se(e));return t.isEmpty()?null:t.value?new Cn(this.source,ne(),t.value):new ps(this.source,ne(),t)}else return O(z(this.path)===e,"Can't get a merge for a child not on the path of the operation"),new ps(this.source,ie(this.path),this.children)}toString(){return"Operation("+this.path+": "+this.source.toString()+" merge: "+this.children.toString()+")"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cl{constructor(e,t,r){this.node_=e,this.fullyInitialized_=t,this.filtered_=r}isFullyInitialized(){return this.fullyInitialized_}isFiltered(){return this.filtered_}isCompleteForPath(e){if(G(e))return this.isFullyInitialized()&&!this.filtered_;const t=z(e);return this.isCompleteForChild(t)}isCompleteForChild(e){return this.isFullyInitialized()&&!this.filtered_||this.node_.hasChild(e)}getNode(){return this.node_}}function VA(n,e,t,r){const s=[],i=[];return e.forEach(a=>{a.type==="child_changed"&&n.index_.indexedValueChanged(a.oldSnap,a.snapshotNode)&&i.push(SA(a.childName,a.snapshotNode))}),xr(n,s,"child_removed",e,r,t),xr(n,s,"child_added",e,r,t),xr(n,s,"child_moved",i,r,t),xr(n,s,"child_changed",e,r,t),xr(n,s,"value",e,r,t),s}function xr(n,e,t,r,s,i){const a=r.filter(c=>c.type===t);a.sort((c,l)=>LA(n,c,l)),a.forEach(c=>{const l=MA(n,c,i);s.forEach(h=>{h.respondsTo(c.type)&&e.push(h.createEvent(l,n.query_))})})}function MA(n,e,t){return e.type==="value"||e.type==="child_removed"||(e.prevName=t.getPredecessorChildName(e.childName,e.snapshotNode,n.index_)),e}function LA(n,e,t){if(e.childName==null||t.childName==null)throw sr("Should only compare child_ events.");const r=new Y(e.childName,e.snapshotNode),s=new Y(t.childName,t.snapshotNode);return n.index_.compare(r,s)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function E_(n,e){return{eventCache:n,serverCache:e}}function Xr(n,e,t,r){return E_(new cl(e,t,r),n.serverCache)}function T_(n,e,t,r){return E_(n.eventCache,new cl(e,t,r))}function Ga(n){return n.eventCache.isFullyInitialized()?n.eventCache.getNode():null}function Rn(n){return n.serverCache.isFullyInitialized()?n.serverCache.getNode():null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ha;const xA=()=>(ha||(ha=new Ke(Iw)),ha);class ce{static fromObject(e){let t=new ce(null);return Xe(e,(r,s)=>{t=t.set(new se(r),s)}),t}constructor(e,t=xA()){this.value=e,this.children=t}isEmpty(){return this.value===null&&this.children.isEmpty()}findRootMostMatchingPathAndValue(e,t){if(this.value!=null&&t(this.value))return{path:ne(),value:this.value};if(G(e))return null;{const r=z(e),s=this.children.get(r);if(s!==null){const i=s.findRootMostMatchingPathAndValue(ie(e),t);return i!=null?{path:me(new se(r),i.path),value:i.value}:null}else return null}}findRootMostValueAndPath(e){return this.findRootMostMatchingPathAndValue(e,()=>!0)}subtree(e){if(G(e))return this;{const t=z(e),r=this.children.get(t);return r!==null?r.subtree(ie(e)):new ce(null)}}set(e,t){if(G(e))return new ce(t,this.children);{const r=z(e),i=(this.children.get(r)||new ce(null)).set(ie(e),t),a=this.children.insert(r,i);return new ce(this.value,a)}}remove(e){if(G(e))return this.children.isEmpty()?new ce(null):new ce(null,this.children);{const t=z(e),r=this.children.get(t);if(r){const s=r.remove(ie(e));let i;return s.isEmpty()?i=this.children.remove(t):i=this.children.insert(t,s),this.value===null&&i.isEmpty()?new ce(null):new ce(this.value,i)}else return this}}get(e){if(G(e))return this.value;{const t=z(e),r=this.children.get(t);return r?r.get(ie(e)):null}}setTree(e,t){if(G(e))return t;{const r=z(e),i=(this.children.get(r)||new ce(null)).setTree(ie(e),t);let a;return i.isEmpty()?a=this.children.remove(r):a=this.children.insert(r,i),new ce(this.value,a)}}fold(e){return this.fold_(ne(),e)}fold_(e,t){const r={};return this.children.inorderTraversal((s,i)=>{r[s]=i.fold_(me(e,s),t)}),t(e,this.value,r)}findOnPath(e,t){return this.findOnPath_(e,ne(),t)}findOnPath_(e,t,r){const s=this.value?r(t,this.value):!1;if(s)return s;if(G(e))return null;{const i=z(e),a=this.children.get(i);return a?a.findOnPath_(ie(e),me(t,i),r):null}}foreachOnPath(e,t){return this.foreachOnPath_(e,ne(),t)}foreachOnPath_(e,t,r){if(G(e))return this;{this.value&&r(t,this.value);const s=z(e),i=this.children.get(s);return i?i.foreachOnPath_(ie(e),me(t,s),r):new ce(null)}}foreach(e){this.foreach_(ne(),e)}foreach_(e,t){this.children.inorderTraversal((r,s)=>{s.foreach_(me(e,r),t)}),this.value&&t(e,this.value)}foreachChild(e){this.children.inorderTraversal((t,r)=>{r.value&&e(t,r.value)})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ot{constructor(e){this.writeTree_=e}static empty(){return new ot(new ce(null))}}function Jr(n,e,t){if(G(e))return new ot(new ce(t));{const r=n.writeTree_.findRootMostValueAndPath(e);if(r!=null){const s=r.path;let i=r.value;const a=nt(s,e);return i=i.updateChild(a,t),new ot(n.writeTree_.set(s,i))}else{const s=new ce(t),i=n.writeTree_.setTree(e,s);return new ot(i)}}}function cd(n,e,t){let r=n;return Xe(t,(s,i)=>{r=Jr(r,me(e,s),i)}),r}function ld(n,e){if(G(e))return ot.empty();{const t=n.writeTree_.setTree(e,new ce(null));return new ot(t)}}function Ka(n,e){return Nn(n,e)!=null}function Nn(n,e){const t=n.writeTree_.findRootMostValueAndPath(e);return t!=null?n.writeTree_.get(t.path).getChild(nt(t.path,e)):null}function ud(n){const e=[],t=n.writeTree_.value;return t!=null?t.isLeafNode()||t.forEachChild(Ne,(r,s)=>{e.push(new Y(r,s))}):n.writeTree_.children.inorderTraversal((r,s)=>{s.value!=null&&e.push(new Y(r,s.value))}),e}function Xt(n,e){if(G(e))return n;{const t=Nn(n,e);return t!=null?new ot(new ce(t)):new ot(n.writeTree_.subtree(e))}}function Qa(n){return n.writeTree_.isEmpty()}function nr(n,e){return v_(ne(),n.writeTree_,e)}function v_(n,e,t){if(e.value!=null)return t.updateChild(n,e.value);{let r=null;return e.children.inorderTraversal((s,i)=>{s===".priority"?(O(i.value!==null,"Priority writes must always be leaf nodes"),r=i.value):t=v_(me(n,s),i,t)}),!t.getChild(n).isEmpty()&&r!==null&&(t=t.updateChild(me(n,".priority"),r)),t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function I_(n,e){return S_(e,n)}function FA(n,e,t,r,s){O(r>n.lastWriteId,"Stacking an older write on top of newer ones"),s===void 0&&(s=!0),n.allWrites.push({path:e,snap:t,writeId:r,visible:s}),s&&(n.visibleWrites=Jr(n.visibleWrites,e,t)),n.lastWriteId=r}function UA(n,e){for(let t=0;t<n.allWrites.length;t++){const r=n.allWrites[t];if(r.writeId===e)return r}return null}function BA(n,e){const t=n.allWrites.findIndex(c=>c.writeId===e);O(t>=0,"removeWrite called with nonexistent writeId.");const r=n.allWrites[t];n.allWrites.splice(t,1);let s=r.visible,i=!1,a=n.allWrites.length-1;for(;s&&a>=0;){const c=n.allWrites[a];c.visible&&(a>=t&&qA(c,r.path)?s=!1:rt(r.path,c.path)&&(i=!0)),a--}if(s){if(i)return $A(n),!0;if(r.snap)n.visibleWrites=ld(n.visibleWrites,r.path);else{const c=r.children;Xe(c,l=>{n.visibleWrites=ld(n.visibleWrites,me(r.path,l))})}return!0}else return!1}function qA(n,e){if(n.snap)return rt(n.path,e);for(const t in n.children)if(n.children.hasOwnProperty(t)&&rt(me(n.path,t),e))return!0;return!1}function $A(n){n.visibleWrites=w_(n.allWrites,jA,ne()),n.allWrites.length>0?n.lastWriteId=n.allWrites[n.allWrites.length-1].writeId:n.lastWriteId=-1}function jA(n){return n.visible}function w_(n,e,t){let r=ot.empty();for(let s=0;s<n.length;++s){const i=n[s];if(e(i)){const a=i.path;let c;if(i.snap)rt(t,a)?(c=nt(t,a),r=Jr(r,c,i.snap)):rt(a,t)&&(c=nt(a,t),r=Jr(r,ne(),i.snap.getChild(c)));else if(i.children){if(rt(t,a))c=nt(t,a),r=cd(r,c,i.children);else if(rt(a,t))if(c=nt(a,t),G(c))r=cd(r,ne(),i.children);else{const l=Hn(i.children,z(c));if(l){const h=l.getChild(ie(c));r=Jr(r,ne(),h)}}}else throw sr("WriteRecord should have .snap or .children")}}return r}function A_(n,e,t,r,s){if(!r&&!s){const i=Nn(n.visibleWrites,e);if(i!=null)return i;{const a=Xt(n.visibleWrites,e);if(Qa(a))return t;if(t==null&&!Ka(a,ne()))return null;{const c=t||ee.EMPTY_NODE;return nr(a,c)}}}else{const i=Xt(n.visibleWrites,e);if(!s&&Qa(i))return t;if(!s&&t==null&&!Ka(i,ne()))return null;{const a=function(h){return(h.visible||s)&&(!r||!~r.indexOf(h.writeId))&&(rt(h.path,e)||rt(e,h.path))},c=w_(n.allWrites,a,e),l=t||ee.EMPTY_NODE;return nr(c,l)}}}function WA(n,e,t){let r=ee.EMPTY_NODE;const s=Nn(n.visibleWrites,e);if(s)return s.isLeafNode()||s.forEachChild(Ne,(i,a)=>{r=r.updateImmediateChild(i,a)}),r;if(t){const i=Xt(n.visibleWrites,e);return t.forEachChild(Ne,(a,c)=>{const l=nr(Xt(i,new se(a)),c);r=r.updateImmediateChild(a,l)}),ud(i).forEach(a=>{r=r.updateImmediateChild(a.name,a.node)}),r}else{const i=Xt(n.visibleWrites,e);return ud(i).forEach(a=>{r=r.updateImmediateChild(a.name,a.node)}),r}}function zA(n,e,t,r,s){O(r||s,"Either existingEventSnap or existingServerSnap must exist");const i=me(e,t);if(Ka(n.visibleWrites,i))return null;{const a=Xt(n.visibleWrites,i);return Qa(a)?s.getChild(t):nr(a,s.getChild(t))}}function HA(n,e,t,r){const s=me(e,t),i=Nn(n.visibleWrites,s);if(i!=null)return i;if(r.isCompleteForChild(t)){const a=Xt(n.visibleWrites,s);return nr(a,r.getNode().getImmediateChild(t))}else return null}function GA(n,e){return Nn(n.visibleWrites,e)}function KA(n,e,t,r,s,i,a){let c;const l=Xt(n.visibleWrites,e),h=Nn(l,ne());if(h!=null)c=h;else if(t!=null)c=nr(l,t);else return[];if(c=c.withIndex(a),!c.isEmpty()&&!c.isLeafNode()){const f=[],p=a.getCompare(),m=i?c.getReverseIteratorFrom(r,a):c.getIteratorFrom(r,a);let v=m.getNext();for(;v&&f.length<s;)p(v,r)!==0&&f.push(v),v=m.getNext();return f}else return[]}function QA(){return{visibleWrites:ot.empty(),allWrites:[],lastWriteId:-1}}function Ya(n,e,t,r){return A_(n.writeTree,n.treePath,e,t,r)}function C_(n,e){return WA(n.writeTree,n.treePath,e)}function hd(n,e,t,r){return zA(n.writeTree,n.treePath,e,t,r)}function Li(n,e){return GA(n.writeTree,me(n.treePath,e))}function YA(n,e,t,r,s,i){return KA(n.writeTree,n.treePath,e,t,r,s,i)}function ll(n,e,t){return HA(n.writeTree,n.treePath,e,t)}function R_(n,e){return S_(me(n.treePath,e),n.writeTree)}function S_(n,e){return{treePath:n,writeTree:e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class XA{constructor(){this.changeMap=new Map}trackChildChange(e){const t=e.type,r=e.childName;O(t==="child_added"||t==="child_changed"||t==="child_removed","Only child changes supported for tracking"),O(r!==".priority","Only non-priority child changes can be tracked.");const s=this.changeMap.get(r);if(s){const i=s.type;if(t==="child_added"&&i==="child_removed")this.changeMap.set(r,sd(r,e.snapshotNode,s.snapshotNode));else if(t==="child_removed"&&i==="child_added")this.changeMap.delete(r);else if(t==="child_removed"&&i==="child_changed")this.changeMap.set(r,RA(r,s.oldSnap));else if(t==="child_changed"&&i==="child_added")this.changeMap.set(r,CA(r,e.snapshotNode));else if(t==="child_changed"&&i==="child_changed")this.changeMap.set(r,sd(r,e.snapshotNode,s.oldSnap));else throw sr("Illegal combination of changes: "+e+" occurred after "+s)}else this.changeMap.set(r,e)}getChanges(){return Array.from(this.changeMap.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class JA{getCompleteChild(e){return null}getChildAfterChild(e,t,r){return null}}const b_=new JA;class ul{constructor(e,t,r=null){this.writes_=e,this.viewCache_=t,this.optCompleteServerCache_=r}getCompleteChild(e){const t=this.viewCache_.eventCache;if(t.isCompleteForChild(e))return t.getNode().getImmediateChild(e);{const r=this.optCompleteServerCache_!=null?new cl(this.optCompleteServerCache_,!0,!1):this.viewCache_.serverCache;return ll(this.writes_,e,r)}}getChildAfterChild(e,t,r){const s=this.optCompleteServerCache_!=null?this.optCompleteServerCache_:Rn(this.viewCache_),i=YA(this.writes_,s,t,1,r,e);return i.length===0?null:i[0]}}function ZA(n,e){O(e.eventCache.getNode().isIndexed(n.filter.getIndex()),"Event snap not indexed"),O(e.serverCache.getNode().isIndexed(n.filter.getIndex()),"Server snap not indexed")}function eC(n,e,t,r,s){const i=new XA;let a,c;if(t.type===pt.OVERWRITE){const h=t;h.source.fromUser?a=Xa(n,e,h.path,h.snap,r,s,i):(O(h.source.fromServer,"Unknown source."),c=h.source.tagged||e.serverCache.isFiltered()&&!G(h.path),a=xi(n,e,h.path,h.snap,r,s,c,i))}else if(t.type===pt.MERGE){const h=t;h.source.fromUser?a=nC(n,e,h.path,h.children,r,s,i):(O(h.source.fromServer,"Unknown source."),c=h.source.tagged||e.serverCache.isFiltered(),a=Ja(n,e,h.path,h.children,r,s,c,i))}else if(t.type===pt.ACK_USER_WRITE){const h=t;h.revert?a=iC(n,e,h.path,r,s,i):a=rC(n,e,h.path,h.affectedTree,r,s,i)}else if(t.type===pt.LISTEN_COMPLETE)a=sC(n,e,t.path,r,i);else throw sr("Unknown operation type: "+t.type);const l=i.getChanges();return tC(e,a,l),{viewCache:a,changes:l}}function tC(n,e,t){const r=e.eventCache;if(r.isFullyInitialized()){const s=r.getNode().isLeafNode()||r.getNode().isEmpty(),i=Ga(n);(t.length>0||!n.eventCache.isFullyInitialized()||s&&!r.getNode().equals(i)||!r.getNode().getPriority().equals(i.getPriority()))&&t.push(AA(Ga(e)))}}function P_(n,e,t,r,s,i){const a=e.eventCache;if(Li(r,t)!=null)return e;{let c,l;if(G(t))if(O(e.serverCache.isFullyInitialized(),"If change path is empty, we must have complete server data"),e.serverCache.isFiltered()){const h=Rn(e),f=h instanceof ee?h:ee.EMPTY_NODE,p=C_(r,f);c=n.filter.updateFullNode(e.eventCache.getNode(),p,i)}else{const h=Ya(r,Rn(e));c=n.filter.updateFullNode(e.eventCache.getNode(),h,i)}else{const h=z(t);if(h===".priority"){O(sn(t)===1,"Can't have a priority with additional path components");const f=a.getNode();l=e.serverCache.getNode();const p=hd(r,t,f,l);p!=null?c=n.filter.updatePriority(f,p):c=a.getNode()}else{const f=ie(t);let p;if(a.isCompleteForChild(h)){l=e.serverCache.getNode();const m=hd(r,t,a.getNode(),l);m!=null?p=a.getNode().getImmediateChild(h).updateChild(f,m):p=a.getNode().getImmediateChild(h)}else p=ll(r,h,e.serverCache);p!=null?c=n.filter.updateChild(a.getNode(),h,p,f,s,i):c=a.getNode()}}return Xr(e,c,a.isFullyInitialized()||G(t),n.filter.filtersNodes())}}function xi(n,e,t,r,s,i,a,c){const l=e.serverCache;let h;const f=a?n.filter:n.filter.getIndexedFilter();if(G(t))h=f.updateFullNode(l.getNode(),r,null);else if(f.filtersNodes()&&!l.isFiltered()){const v=l.getNode().updateChild(t,r);h=f.updateFullNode(l.getNode(),v,null)}else{const v=z(t);if(!l.isCompleteForPath(t)&&sn(t)>1)return e;const R=ie(t),P=l.getNode().getImmediateChild(v).updateChild(R,r);v===".priority"?h=f.updatePriority(l.getNode(),P):h=f.updateChild(l.getNode(),v,P,R,b_,null)}const p=T_(e,h,l.isFullyInitialized()||G(t),f.filtersNodes()),m=new ul(s,p,i);return P_(n,p,t,s,m,c)}function Xa(n,e,t,r,s,i,a){const c=e.eventCache;let l,h;const f=new ul(s,e,i);if(G(t))h=n.filter.updateFullNode(e.eventCache.getNode(),r,a),l=Xr(e,h,!0,n.filter.filtersNodes());else{const p=z(t);if(p===".priority")h=n.filter.updatePriority(e.eventCache.getNode(),r),l=Xr(e,h,c.isFullyInitialized(),c.isFiltered());else{const m=ie(t),v=c.getNode().getImmediateChild(p);let R;if(G(m))R=r;else{const k=f.getCompleteChild(p);k!=null?sl(m)===".priority"&&k.getChild(c_(m)).isEmpty()?R=k:R=k.updateChild(m,r):R=ee.EMPTY_NODE}if(v.equals(R))l=e;else{const k=n.filter.updateChild(c.getNode(),p,R,m,f,a);l=Xr(e,k,c.isFullyInitialized(),n.filter.filtersNodes())}}}return l}function dd(n,e){return n.eventCache.isCompleteForChild(e)}function nC(n,e,t,r,s,i,a){let c=e;return r.foreach((l,h)=>{const f=me(t,l);dd(e,z(f))&&(c=Xa(n,c,f,h,s,i,a))}),r.foreach((l,h)=>{const f=me(t,l);dd(e,z(f))||(c=Xa(n,c,f,h,s,i,a))}),c}function fd(n,e,t){return t.foreach((r,s)=>{e=e.updateChild(r,s)}),e}function Ja(n,e,t,r,s,i,a,c){if(e.serverCache.getNode().isEmpty()&&!e.serverCache.isFullyInitialized())return e;let l=e,h;G(t)?h=r:h=new ce(null).setTree(t,r);const f=e.serverCache.getNode();return h.children.inorderTraversal((p,m)=>{if(f.hasChild(p)){const v=e.serverCache.getNode().getImmediateChild(p),R=fd(n,v,m);l=xi(n,l,new se(p),R,s,i,a,c)}}),h.children.inorderTraversal((p,m)=>{const v=!e.serverCache.isCompleteForChild(p)&&m.value===null;if(!f.hasChild(p)&&!v){const R=e.serverCache.getNode().getImmediateChild(p),k=fd(n,R,m);l=xi(n,l,new se(p),k,s,i,a,c)}}),l}function rC(n,e,t,r,s,i,a){if(Li(s,t)!=null)return e;const c=e.serverCache.isFiltered(),l=e.serverCache;if(r.value!=null){if(G(t)&&l.isFullyInitialized()||l.isCompleteForPath(t))return xi(n,e,t,l.getNode().getChild(t),s,i,c,a);if(G(t)){let h=new ce(null);return l.getNode().forEachChild(jn,(f,p)=>{h=h.set(new se(f),p)}),Ja(n,e,t,h,s,i,c,a)}else return e}else{let h=new ce(null);return r.foreach((f,p)=>{const m=me(t,f);l.isCompleteForPath(m)&&(h=h.set(f,l.getNode().getChild(m)))}),Ja(n,e,t,h,s,i,c,a)}}function sC(n,e,t,r,s){const i=e.serverCache,a=T_(e,i.getNode(),i.isFullyInitialized()||G(t),i.isFiltered());return P_(n,a,t,r,b_,s)}function iC(n,e,t,r,s,i){let a;if(Li(r,t)!=null)return e;{const c=new ul(r,e,s),l=e.eventCache.getNode();let h;if(G(t)||z(t)===".priority"){let f;if(e.serverCache.isFullyInitialized())f=Ya(r,Rn(e));else{const p=e.serverCache.getNode();O(p instanceof ee,"serverChildren would be complete if leaf node"),f=C_(r,p)}f=f,h=n.filter.updateFullNode(l,f,i)}else{const f=z(t);let p=ll(r,f,e.serverCache);p==null&&e.serverCache.isCompleteForChild(f)&&(p=l.getImmediateChild(f)),p!=null?h=n.filter.updateChild(l,f,p,ie(t),c,i):e.eventCache.getNode().hasChild(f)?h=n.filter.updateChild(l,f,ee.EMPTY_NODE,ie(t),c,i):h=l,h.isEmpty()&&e.serverCache.isFullyInitialized()&&(a=Ya(r,Rn(e)),a.isLeafNode()&&(h=n.filter.updateFullNode(h,a,i)))}return a=e.serverCache.isFullyInitialized()||Li(r,ne())!=null,Xr(e,h,a,n.filter.filtersNodes())}}function oC(n,e){const t=Rn(n.viewCache_);return t&&(n.query._queryParams.loadsAllData()||!G(e)&&!t.getImmediateChild(z(e)).isEmpty())?t.getChild(e):null}function pd(n,e,t,r){e.type===pt.MERGE&&e.source.queryId!==null&&(O(Rn(n.viewCache_),"We should always have a full cache before handling merges"),O(Ga(n.viewCache_),"Missing event cache, even though we have a server cache"));const s=n.viewCache_,i=eC(n.processor_,s,e,t,r);return ZA(n.processor_,i.viewCache),O(i.viewCache.serverCache.isFullyInitialized()||!s.serverCache.isFullyInitialized(),"Once a server snap is complete, it should never go back"),n.viewCache_=i.viewCache,aC(n,i.changes,i.viewCache.eventCache.getNode())}function aC(n,e,t,r){const s=n.eventRegistrations_;return VA(n.eventGenerator_,e,t,s)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let _d;function cC(n){O(!_d,"__referenceConstructor has already been defined"),_d=n}function hl(n,e,t,r){const s=e.source.queryId;if(s!==null){const i=n.views.get(s);return O(i!=null,"SyncTree gave us an op for an invalid query."),pd(i,e,t,r)}else{let i=[];for(const a of n.views.values())i=i.concat(pd(a,e,t,r));return i}}function dl(n,e){let t=null;for(const r of n.views.values())t=t||oC(r,e);return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let md;function lC(n){O(!md,"__referenceConstructor has already been defined"),md=n}class gd{constructor(e){this.listenProvider_=e,this.syncPointTree_=new ce(null),this.pendingWriteTree_=QA(),this.tagToQueryMap=new Map,this.queryToTagMap=new Map}}function N_(n,e,t,r,s){return FA(n.pendingWriteTree_,e,t,r,s),s?To(n,new Cn(m_(),e,t)):[]}function mn(n,e,t=!1){const r=UA(n.pendingWriteTree_,e);if(BA(n.pendingWriteTree_,e)){let i=new ce(null);return r.snap!=null?i=i.set(ne(),!0):Xe(r.children,a=>{i=i.set(new se(a),!0)}),To(n,new Mi(r.path,i,t))}else return[]}function Eo(n,e,t){return To(n,new Cn(g_(),e,t))}function uC(n,e,t){const r=ce.fromObject(t);return To(n,new ps(g_(),e,r))}function hC(n,e,t,r){const s=O_(n,r);if(s!=null){const i=V_(s),a=i.path,c=i.queryId,l=nt(a,e),h=new Cn(y_(c),l,t);return M_(n,a,h)}else return[]}function dC(n,e,t,r){const s=O_(n,r);if(s){const i=V_(s),a=i.path,c=i.queryId,l=nt(a,e),h=ce.fromObject(t),f=new ps(y_(c),l,h);return M_(n,a,f)}else return[]}function fl(n,e,t){const s=n.pendingWriteTree_,i=n.syncPointTree_.findOnPath(e,(a,c)=>{const l=nt(a,e),h=dl(c,l);if(h)return h});return A_(s,e,i,t,!0)}function To(n,e){return k_(e,n.syncPointTree_,null,I_(n.pendingWriteTree_,ne()))}function k_(n,e,t,r){if(G(n.path))return D_(n,e,t,r);{const s=e.get(ne());t==null&&s!=null&&(t=dl(s,ne()));let i=[];const a=z(n.path),c=n.operationForChild(a),l=e.children.get(a);if(l&&c){const h=t?t.getImmediateChild(a):null,f=R_(r,a);i=i.concat(k_(c,l,h,f))}return s&&(i=i.concat(hl(s,n,r,t))),i}}function D_(n,e,t,r){const s=e.get(ne());t==null&&s!=null&&(t=dl(s,ne()));let i=[];return e.children.inorderTraversal((a,c)=>{const l=t?t.getImmediateChild(a):null,h=R_(r,a),f=n.operationForChild(a);f&&(i=i.concat(D_(f,c,l,h)))}),s&&(i=i.concat(hl(s,n,r,t))),i}function O_(n,e){return n.tagToQueryMap.get(e)}function V_(n){const e=n.indexOf("$");return O(e!==-1&&e<n.length-1,"Bad queryKey."),{queryId:n.substr(e+1),path:new se(n.substr(0,e))}}function M_(n,e,t){const r=n.syncPointTree_.get(e);O(r,"Missing sync point for query tag that we're tracking");const s=I_(n.pendingWriteTree_,e);return hl(r,t,s,null)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pl{constructor(e){this.node_=e}getImmediateChild(e){const t=this.node_.getImmediateChild(e);return new pl(t)}node(){return this.node_}}class _l{constructor(e,t){this.syncTree_=e,this.path_=t}getImmediateChild(e){const t=me(this.path_,e);return new _l(this.syncTree_,t)}node(){return fl(this.syncTree_,this.path_)}}const fC=function(n){return n=n||{},n.timestamp=n.timestamp||new Date().getTime(),n},yd=function(n,e,t){if(!n||typeof n!="object")return n;if(O(".sv"in n,"Unexpected leaf node or priority contents"),typeof n[".sv"]=="string")return pC(n[".sv"],e,t);if(typeof n[".sv"]=="object")return _C(n[".sv"],e);O(!1,"Unexpected server value: "+JSON.stringify(n,null,2))},pC=function(n,e,t){switch(n){case"timestamp":return t.timestamp;default:O(!1,"Unexpected server value: "+n)}},_C=function(n,e,t){n.hasOwnProperty("increment")||O(!1,"Unexpected server value: "+JSON.stringify(n,null,2));const r=n.increment;typeof r!="number"&&O(!1,"Unexpected increment value: "+r);const s=e.node();if(O(s!==null&&typeof s<"u","Expected ChildrenNode.EMPTY_NODE for nulls"),!s.isLeafNode())return r;const a=s.getValue();return typeof a!="number"?r:a+r},mC=function(n,e,t,r){return ml(e,new _l(t,n),r)},L_=function(n,e,t){return ml(n,new pl(e),t)};function ml(n,e,t){const r=n.getPriority().val(),s=yd(r,e.getImmediateChild(".priority"),t);let i;if(n.isLeafNode()){const a=n,c=yd(a.getValue(),e,t);return c!==a.getValue()||s!==a.getPriority().val()?new we(c,ye(s)):n}else{const a=n;return i=a,s!==a.getPriority().val()&&(i=i.updatePriority(new we(s))),a.forEachChild(Ne,(c,l)=>{const h=ml(l,e.getImmediateChild(c),t);h!==l&&(i=i.updateImmediateChild(c,h))}),i}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gl{constructor(e="",t=null,r={children:{},childCount:0}){this.name=e,this.parent=t,this.node=r}}function yl(n,e){let t=e instanceof se?e:new se(e),r=n,s=z(t);for(;s!==null;){const i=Hn(r.node.children,s)||{children:{},childCount:0};r=new gl(s,r,i),t=ie(t),s=z(t)}return r}function _r(n){return n.node.value}function x_(n,e){n.node.value=e,Za(n)}function F_(n){return n.node.childCount>0}function gC(n){return _r(n)===void 0&&!F_(n)}function vo(n,e){Xe(n.node.children,(t,r)=>{e(new gl(t,n,r))})}function U_(n,e,t,r){t&&e(n),vo(n,s=>{U_(s,e,!0)})}function yC(n,e,t){let r=n.parent;for(;r!==null;){if(e(r))return!0;r=r.parent}return!1}function Ss(n){return new se(n.parent===null?n.name:Ss(n.parent)+"/"+n.name)}function Za(n){n.parent!==null&&EC(n.parent,n.name,n)}function EC(n,e,t){const r=gC(t),s=At(n.node.children,e);r&&s?(delete n.node.children[e],n.node.childCount--,Za(n)):!r&&!s&&(n.node.children[e]=t.node,n.node.childCount++,Za(n))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const TC=/[\[\].#$\/\u0000-\u001F\u007F]/,vC=/[\[\].#$\u0000-\u001F\u007F]/,da=10*1024*1024,El=function(n){return typeof n=="string"&&n.length!==0&&!TC.test(n)},B_=function(n){return typeof n=="string"&&n.length!==0&&!vC.test(n)},IC=function(n){return n&&(n=n.replace(/^\/*\.info(\/|$)/,"/")),B_(n)},q_=function(n){return n===null||typeof n=="string"||typeof n=="number"&&!go(n)||n&&typeof n=="object"&&At(n,".sv")},ec=function(n,e,t,r){Io(Gn(n,"value"),e,t)},Io=function(n,e,t){const r=t instanceof se?new sA(t,n):t;if(e===void 0)throw new Error(n+"contains undefined "+fn(r));if(typeof e=="function")throw new Error(n+"contains a function "+fn(r)+" with contents = "+e.toString());if(go(e))throw new Error(n+"contains "+e.toString()+" "+fn(r));if(typeof e=="string"&&e.length>da/3&&Hi(e)>da)throw new Error(n+"contains a string greater than "+da+" utf8 bytes "+fn(r)+" ('"+e.substring(0,50)+"...')");if(e&&typeof e=="object"){let s=!1,i=!1;if(Xe(e,(a,c)=>{if(a===".value")s=!0;else if(a!==".priority"&&a!==".sv"&&(i=!0,!El(a)))throw new Error(n+" contains an invalid key ("+a+") "+fn(r)+`.  Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`);iA(r,a),Io(n,c,r),oA(r)}),s&&i)throw new Error(n+' contains ".value" child '+fn(r)+" in addition to actual children.")}},wC=function(n,e){let t,r;for(t=0;t<e.length;t++){r=e[t];const i=fs(r);for(let a=0;a<i.length;a++)if(!(i[a]===".priority"&&a===i.length-1)){if(!El(i[a]))throw new Error(n+"contains an invalid key ("+i[a]+") in path "+r.toString()+`. Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`)}}e.sort(rA);let s=null;for(t=0;t<e.length;t++){if(r=e[t],s!==null&&rt(s,r))throw new Error(n+"contains a path "+s.toString()+" that is ancestor of another path "+r.toString());s=r}},AC=function(n,e,t,r){const s=Gn(n,"values");if(!(e&&typeof e=="object")||Array.isArray(e))throw new Error(s+" must be an object containing the children to replace.");const i=[];Xe(e,(a,c)=>{const l=new se(a);if(Io(s,c,me(t,l)),sl(l)===".priority"&&!q_(c))throw new Error(s+"contains an invalid value for '"+l.toString()+"', which must be a valid Firebase priority (a string, finite number, server value, or null).");i.push(l)}),wC(s,i)},CC=function(n,e,t){if(go(e))throw new Error(Gn(n,"priority")+"is "+e.toString()+", but must be a valid Firebase priority (a string, finite number, server value, or null).");if(!q_(e))throw new Error(Gn(n,"priority")+"must be a valid Firebase priority (a string, finite number, server value, or null).")},$_=function(n,e,t,r){if(!B_(t))throw new Error(Gn(n,e)+'was an invalid path = "'+t+`". Paths must be non-empty strings and can't contain ".", "#", "$", "[", or "]"`)},RC=function(n,e,t,r){t&&(t=t.replace(/^\/*\.info(\/|$)/,"/")),$_(n,e,t)},$r=function(n,e){if(z(e)===".info")throw new Error(n+" failed = Can't modify data under /.info/")},SC=function(n,e){const t=e.path.toString();if(typeof e.repoInfo.host!="string"||e.repoInfo.host.length===0||!El(e.repoInfo.namespace)&&e.repoInfo.host.split(":")[0]!=="localhost"||t.length!==0&&!IC(t))throw new Error(Gn(n,"url")+`must be a valid firebase URL and the path can't contain ".", "#", "$", "[", or "]".`)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bC{constructor(){this.eventLists_=[],this.recursionDepth_=0}}function j_(n,e){let t=null;for(let r=0;r<e.length;r++){const s=e[r],i=s.getPath();t!==null&&!l_(i,t.path)&&(n.eventLists_.push(t),t=null),t===null&&(t={events:[],path:i}),t.events.push(s)}t&&n.eventLists_.push(t)}function xt(n,e,t){j_(n,t),PC(n,r=>rt(r,e)||rt(e,r))}function PC(n,e){n.recursionDepth_++;let t=!0;for(let r=0;r<n.eventLists_.length;r++){const s=n.eventLists_[r];if(s){const i=s.path;e(i)?(NC(n.eventLists_[r]),n.eventLists_[r]=null):t=!1}}t&&(n.eventLists_=[]),n.recursionDepth_--}function NC(n){for(let e=0;e<n.events.length;e++){const t=n.events[e];if(t!==null){n.events[e]=null;const r=t.getEventRunner();Qr&&Se("event: "+t.toString()),fr(r)}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kC="repo_interrupt",DC=25;class OC{constructor(e,t,r,s){this.repoInfo_=e,this.forceRestClient_=t,this.authTokenProvider_=r,this.appCheckProvider_=s,this.dataUpdateCount=0,this.statsListener_=null,this.eventQueue_=new bC,this.nextWriteId_=1,this.interceptServerDataCallback_=null,this.onDisconnect_=Vi(),this.transactionQueueTree_=new gl,this.persistentConnection_=null,this.key=this.repoInfo_.toURLString()}toString(){return(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host}}function VC(n,e,t){if(n.stats_=nl(n.repoInfo_),n.forceRestClient_||bw())n.server_=new Oi(n.repoInfo_,(r,s,i,a)=>{Ed(n,r,s,i,a)},n.authTokenProvider_,n.appCheckProvider_),setTimeout(()=>Td(n,!0),0);else{if(typeof t<"u"&&t!==null){if(typeof t!="object")throw new Error("Only objects are supported for option databaseAuthVariableOverride");try{be(t)}catch(r){throw new Error("Invalid authOverride provided: "+r)}}n.persistentConnection_=new kt(n.repoInfo_,e,(r,s,i,a)=>{Ed(n,r,s,i,a)},r=>{Td(n,r)},r=>{LC(n,r)},n.authTokenProvider_,n.appCheckProvider_,t),n.server_=n.persistentConnection_}n.authTokenProvider_.addTokenChangeListener(r=>{n.server_.refreshAuthToken(r)}),n.appCheckProvider_.addTokenChangeListener(r=>{n.server_.refreshAppCheckToken(r.token)}),n.statsReporter_=Ow(n.repoInfo_,()=>new OA(n.stats_,n.server_)),n.infoData_=new bA,n.infoSyncTree_=new gd({startListening:(r,s,i,a)=>{let c=[];const l=n.infoData_.getNode(r._path);return l.isEmpty()||(c=Eo(n.infoSyncTree_,r._path,l),setTimeout(()=>{a("ok")},0)),c},stopListening:()=>{}}),vl(n,"connected",!1),n.serverSyncTree_=new gd({startListening:(r,s,i,a)=>(n.server_.listen(r,i,s,(c,l)=>{const h=a(c,l);xt(n.eventQueue_,r._path,h)}),[]),stopListening:(r,s)=>{n.server_.unlisten(r,s)}})}function MC(n){const t=n.infoData_.getNode(new se(".info/serverTimeOffset")).val()||0;return new Date().getTime()+t}function Tl(n){return fC({timestamp:MC(n)})}function Ed(n,e,t,r,s){n.dataUpdateCount++;const i=new se(e);t=n.interceptServerDataCallback_?n.interceptServerDataCallback_(e,t):t;let a=[];if(s)if(r){const l=_i(t,h=>ye(h));a=dC(n.serverSyncTree_,i,l,s)}else{const l=ye(t);a=hC(n.serverSyncTree_,i,l,s)}else if(r){const l=_i(t,h=>ye(h));a=uC(n.serverSyncTree_,i,l)}else{const l=ye(t);a=Eo(n.serverSyncTree_,i,l)}let c=i;a.length>0&&(c=wo(n,i)),xt(n.eventQueue_,c,a)}function Td(n,e){vl(n,"connected",e),e===!1&&FC(n)}function LC(n,e){Xe(e,(t,r)=>{vl(n,t,r)})}function vl(n,e,t){const r=new se("/.info/"+e),s=ye(t);n.infoData_.updateSnapshot(r,s);const i=Eo(n.infoSyncTree_,r,s);xt(n.eventQueue_,r,i)}function W_(n){return n.nextWriteId_++}function xC(n,e,t,r,s){Il(n,"set",{path:e.toString(),value:t,priority:r});const i=Tl(n),a=ye(t,r),c=fl(n.serverSyncTree_,e),l=L_(a,c,i),h=W_(n),f=N_(n.serverSyncTree_,e,l,h,!0);j_(n.eventQueue_,f),n.server_.put(e.toString(),a.val(!0),(m,v)=>{const R=m==="ok";R||Ye("set at "+e+" failed: "+m);const k=mn(n.serverSyncTree_,h,!R);xt(n.eventQueue_,e,k),rr(n,s,m,v)});const p=Q_(n,e);wo(n,p),xt(n.eventQueue_,p,[])}function FC(n){Il(n,"onDisconnectEvents");const e=Tl(n),t=Vi();Ha(n.onDisconnect_,ne(),(s,i)=>{const a=mC(s,i,n.serverSyncTree_,e);pr(t,s,a)});let r=[];Ha(t,ne(),(s,i)=>{r=r.concat(Eo(n.serverSyncTree_,s,i));const a=Q_(n,s);wo(n,a)}),n.onDisconnect_=Vi(),xt(n.eventQueue_,ne(),r)}function UC(n,e,t){n.server_.onDisconnectCancel(e.toString(),(r,s)=>{r==="ok"&&za(n.onDisconnect_,e),rr(n,t,r,s)})}function vd(n,e,t,r){const s=ye(t);n.server_.onDisconnectPut(e.toString(),s.val(!0),(i,a)=>{i==="ok"&&pr(n.onDisconnect_,e,s),rr(n,r,i,a)})}function BC(n,e,t,r,s){const i=ye(t,r);n.server_.onDisconnectPut(e.toString(),i.val(!0),(a,c)=>{a==="ok"&&pr(n.onDisconnect_,e,i),rr(n,s,a,c)})}function qC(n,e,t,r){if(ma(t)){Se("onDisconnect().update() called with empty data.  Don't do anything."),rr(n,r,"ok",void 0);return}n.server_.onDisconnectMerge(e.toString(),t,(s,i)=>{s==="ok"&&Xe(t,(a,c)=>{const l=ye(c);pr(n.onDisconnect_,me(e,a),l)}),rr(n,r,s,i)})}function $C(n){n.persistentConnection_&&n.persistentConnection_.interrupt(kC)}function Il(n,...e){let t="";n.persistentConnection_&&(t=n.persistentConnection_.id+":"),Se(t,...e)}function rr(n,e,t,r){e&&fr(()=>{if(t==="ok")e(null);else{const s=(t||"error").toUpperCase();let i=s;r&&(i+=": "+r);const a=new Error(i);a.code=s,e(a)}})}function z_(n,e,t){return fl(n.serverSyncTree_,e,t)||ee.EMPTY_NODE}function wl(n,e=n.transactionQueueTree_){if(e||Ao(n,e),_r(e)){const t=G_(n,e);O(t.length>0,"Sending zero length transaction queue"),t.every(s=>s.status===0)&&jC(n,Ss(e),t)}else F_(e)&&vo(e,t=>{wl(n,t)})}function jC(n,e,t){const r=t.map(h=>h.currentWriteId),s=z_(n,e,r);let i=s;const a=s.hash();for(let h=0;h<t.length;h++){const f=t[h];O(f.status===0,"tryToSendTransactionQueue_: items in queue should all be run."),f.status=1,f.retryCount++;const p=nt(e,f.path);i=i.updateChild(p,f.currentOutputSnapshotRaw)}const c=i.val(!0),l=e;n.server_.put(l.toString(),c,h=>{Il(n,"transaction put response",{path:l.toString(),status:h});let f=[];if(h==="ok"){const p=[];for(let m=0;m<t.length;m++)t[m].status=2,f=f.concat(mn(n.serverSyncTree_,t[m].currentWriteId)),t[m].onComplete&&p.push(()=>t[m].onComplete(null,!0,t[m].currentOutputSnapshotResolved)),t[m].unwatcher();Ao(n,yl(n.transactionQueueTree_,e)),wl(n,n.transactionQueueTree_),xt(n.eventQueue_,e,f);for(let m=0;m<p.length;m++)fr(p[m])}else{if(h==="datastale")for(let p=0;p<t.length;p++)t[p].status===3?t[p].status=4:t[p].status=0;else{Ye("transaction at "+l.toString()+" failed: "+h);for(let p=0;p<t.length;p++)t[p].status=4,t[p].abortReason=h}wo(n,e)}},a)}function wo(n,e){const t=H_(n,e),r=Ss(t),s=G_(n,t);return WC(n,s,r),r}function WC(n,e,t){if(e.length===0)return;const r=[];let s=[];const a=e.filter(c=>c.status===0).map(c=>c.currentWriteId);for(let c=0;c<e.length;c++){const l=e[c],h=nt(t,l.path);let f=!1,p;if(O(h!==null,"rerunTransactionsUnderNode_: relativePath should not be null."),l.status===4)f=!0,p=l.abortReason,s=s.concat(mn(n.serverSyncTree_,l.currentWriteId,!0));else if(l.status===0)if(l.retryCount>=DC)f=!0,p="maxretry",s=s.concat(mn(n.serverSyncTree_,l.currentWriteId,!0));else{const m=z_(n,l.path,a);l.currentInputSnapshot=m;const v=e[c].update(m.val());if(v!==void 0){Io("transaction failed: Data returned ",v,l.path);let R=ye(v);typeof v=="object"&&v!=null&&At(v,".priority")||(R=R.updatePriority(m.getPriority()));const P=l.currentWriteId,F=Tl(n),x=L_(R,m,F);l.currentOutputSnapshotRaw=R,l.currentOutputSnapshotResolved=x,l.currentWriteId=W_(n),a.splice(a.indexOf(P),1),s=s.concat(N_(n.serverSyncTree_,l.path,x,l.currentWriteId,l.applyLocally)),s=s.concat(mn(n.serverSyncTree_,P,!0))}else f=!0,p="nodata",s=s.concat(mn(n.serverSyncTree_,l.currentWriteId,!0))}xt(n.eventQueue_,t,s),s=[],f&&(e[c].status=2,function(m){setTimeout(m,Math.floor(0))}(e[c].unwatcher),e[c].onComplete&&(p==="nodata"?r.push(()=>e[c].onComplete(null,!1,e[c].currentInputSnapshot)):r.push(()=>e[c].onComplete(new Error(p),!1,null))))}Ao(n,n.transactionQueueTree_);for(let c=0;c<r.length;c++)fr(r[c]);wl(n,n.transactionQueueTree_)}function H_(n,e){let t,r=n.transactionQueueTree_;for(t=z(e);t!==null&&_r(r)===void 0;)r=yl(r,t),e=ie(e),t=z(e);return r}function G_(n,e){const t=[];return K_(n,e,t),t.sort((r,s)=>r.order-s.order),t}function K_(n,e,t){const r=_r(e);if(r)for(let s=0;s<r.length;s++)t.push(r[s]);vo(e,s=>{K_(n,s,t)})}function Ao(n,e){const t=_r(e);if(t){let r=0;for(let s=0;s<t.length;s++)t[s].status!==2&&(t[r]=t[s],r++);t.length=r,x_(e,t.length>0?t:void 0)}vo(e,r=>{Ao(n,r)})}function Q_(n,e){const t=Ss(H_(n,e)),r=yl(n.transactionQueueTree_,e);return yC(r,s=>{fa(n,s)}),fa(n,r),U_(r,s=>{fa(n,s)}),t}function fa(n,e){const t=_r(e);if(t){const r=[];let s=[],i=-1;for(let a=0;a<t.length;a++)t[a].status===3||(t[a].status===1?(O(i===a-1,"All SENT items should be at beginning of queue."),i=a,t[a].status=3,t[a].abortReason="set"):(O(t[a].status===0,"Unexpected transaction status in abort"),t[a].unwatcher(),s=s.concat(mn(n.serverSyncTree_,t[a].currentWriteId,!0)),t[a].onComplete&&r.push(t[a].onComplete.bind(null,new Error("set"),!1,null))));i===-1?x_(e,void 0):t.length=i+1,xt(n.eventQueue_,Ss(e),s);for(let a=0;a<r.length;a++)fr(r[a])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function zC(n){let e="";const t=n.split("/");for(let r=0;r<t.length;r++)if(t[r].length>0){let s=t[r];try{s=decodeURIComponent(s.replace(/\+/g," "))}catch{}e+="/"+s}return e}function HC(n){const e={};n.charAt(0)==="?"&&(n=n.substring(1));for(const t of n.split("&")){if(t.length===0)continue;const r=t.split("=");r.length===2?e[decodeURIComponent(r[0])]=decodeURIComponent(r[1]):Ye(`Invalid query segment '${t}' in query '${n}'`)}return e}const Id=function(n,e){const t=GC(n),r=t.namespace;t.domain==="firebase.com"&&Lt(t.host+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead"),(!r||r==="undefined")&&t.domain!=="localhost"&&Lt("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com"),t.secure||Tw();const s=t.scheme==="ws"||t.scheme==="wss";return{repoInfo:new Zp(t.host,t.secure,r,s,e,"",r!==t.subdomain),path:new se(t.pathString)}},GC=function(n){let e="",t="",r="",s="",i="",a=!0,c="https",l=443;if(typeof n=="string"){let h=n.indexOf("//");h>=0&&(c=n.substring(0,h-1),n=n.substring(h+2));let f=n.indexOf("/");f===-1&&(f=n.length);let p=n.indexOf("?");p===-1&&(p=n.length),e=n.substring(0,Math.min(f,p)),f<p&&(s=zC(n.substring(f,p)));const m=HC(n.substring(Math.min(n.length,p)));h=e.indexOf(":"),h>=0?(a=c==="https"||c==="wss",l=parseInt(e.substring(h+1),10)):h=e.length;const v=e.slice(0,h);if(v.toLowerCase()==="localhost")t="localhost";else if(v.split(".").length<=2)t=v;else{const R=e.indexOf(".");r=e.substring(0,R).toLowerCase(),t=e.substring(R+1),i=r}"ns"in m&&(i=m.ns)}return{host:e,port:l,domain:t,subdomain:r,secure:a,scheme:c,pathString:s,namespace:i}};/**
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
 */class KC{constructor(e,t){this._repo=e,this._path=t}cancel(){const e=new Pt;return UC(this._repo,this._path,e.wrapCallback(()=>{})),e.promise}remove(){$r("OnDisconnect.remove",this._path);const e=new Pt;return vd(this._repo,this._path,null,e.wrapCallback(()=>{})),e.promise}set(e){$r("OnDisconnect.set",this._path),ec("OnDisconnect.set",e,this._path);const t=new Pt;return vd(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}setWithPriority(e,t){$r("OnDisconnect.setWithPriority",this._path),ec("OnDisconnect.setWithPriority",e,this._path),CC("OnDisconnect.setWithPriority",t);const r=new Pt;return BC(this._repo,this._path,e,t,r.wrapCallback(()=>{})),r.promise}update(e){$r("OnDisconnect.update",this._path),AC("OnDisconnect.update",e,this._path);const t=new Pt;return qC(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}}/**
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
 */class Al{constructor(e,t,r,s){this._repo=e,this._path=t,this._queryParams=r,this._orderByCalled=s}get key(){return G(this._path)?null:sl(this._path)}get ref(){return new kn(this._repo,this._path)}get _queryIdentifier(){const e=od(this._queryParams),t=el(e);return t==="{}"?"default":t}get _queryObject(){return od(this._queryParams)}isEqual(e){if(e=te(e),!(e instanceof Al))return!1;const t=this._repo===e._repo,r=l_(this._path,e._path),s=this._queryIdentifier===e._queryIdentifier;return t&&r&&s}toJSON(){return this.toString()}toString(){return this._repo.toString()+nA(this._path)}}class kn extends Al{constructor(e,t){super(e,t,new al,!1)}get parent(){const e=c_(this._path);return e===null?null:new kn(this._repo,e)}get root(){let e=this;for(;e.parent!==null;)e=e.parent;return e}}function fS(n,e){return n=te(n),n._checkNotDeleted("ref"),e!==void 0?QC(n._root,e):n._root}function QC(n,e){return n=te(n),z(n._path)===null?RC("child","path",e):$_("child","path",e),new kn(n._repo,me(n._path,e))}function pS(n){return n=te(n),new KC(n._repo,n._path)}function _S(n,e){n=te(n),$r("set",n._path),ec("set",e,n._path);const t=new Pt;return xC(n._repo,n._path,e,null,t.wrapCallback(()=>{})),t.promise}cC(kn);lC(kn);/**
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
 */const YC="FIREBASE_DATABASE_EMULATOR_HOST",tc={};let XC=!1;function JC(n,e,t,r){const s=e.lastIndexOf(":"),i=e.substring(0,s),a=ut(i);n.repoInfo_=new Zp(e,a,n.repoInfo_.namespace,n.repoInfo_.webSocketOnly,n.repoInfo_.nodeAdmin,n.repoInfo_.persistenceKey,n.repoInfo_.includeNamespaceInQueryParams,!0,t),r&&(n.authTokenProvider_=r)}function ZC(n,e,t,r,s){let i=r||n.options.databaseURL;i===void 0&&(n.options.projectId||Lt("Can't determine Firebase Database URL. Be sure to include  a Project ID when calling firebase.initializeApp()."),Se("Using default host for project ",n.options.projectId),i=`${n.options.projectId}-default-rtdb.firebaseio.com`);let a=Id(i,s),c=a.repoInfo,l;typeof process<"u"&&qh&&(l=qh[YC]),l?(i=`http://${l}?ns=${c.namespace}`,a=Id(i,s),c=a.repoInfo):a.repoInfo.secure;const h=new Nw(n.name,n.options,e);SC("Invalid Firebase Database URL",a),G(a.path)||Lt("Database URL must point to the root of a Firebase Database (not including a child path).");const f=tR(c,n,h,new Pw(n,t));return new nR(f,n)}function eR(n,e){const t=tc[e];(!t||t[n.key]!==n)&&Lt(`Database ${e}(${n.repoInfo_}) has already been deleted.`),$C(n),delete t[n.key]}function tR(n,e,t,r){let s=tc[e.name];s||(s={},tc[e.name]=s);let i=s[n.toURLString()];return i&&Lt("Database initialized multiple times. Please make sure the format of the database URL matches with each database() call."),i=new OC(n,XC,t,r),s[n.toURLString()]=i,i}class nR{constructor(e,t){this._repoInternal=e,this.app=t,this.type="database",this._instanceStarted=!1}get _repo(){return this._instanceStarted||(VC(this._repoInternal,this.app.options.appId,this.app.options.databaseAuthVariableOverride),this._instanceStarted=!0),this._repoInternal}get _root(){return this._rootInternal||(this._rootInternal=new kn(this._repo,ne())),this._rootInternal}_delete(){return this._rootInternal!==null&&(eR(this._repo,this.app.name),this._repoInternal=null,this._rootInternal=null),Promise.resolve()}_checkNotDeleted(e){this._rootInternal===null&&Lt("Cannot call "+e+" on a deleted database.")}}function rR(n=Qi(),e){const t=Ki(n,"database").getImmediate({identifier:e});if(!t._instanceStarted){const r=ji("database");r&&sR(t,...r)}return t}function sR(n,e,t,r={}){n=te(n),n._checkNotDeleted("useEmulator");const s=`${e}:${t}`,i=n._repoInternal;if(n._instanceStarted){if(s===n._repoInternal.repoInfo_.host&&ns(r,i.repoInfo_.emulatorOptions))return;Lt("connectDatabaseEmulator() cannot initialize or alter the emulator configuration after the database instance has started.")}let a;if(i.repoInfo_.nodeAdmin)r.mockUserToken&&Lt('mockUserToken is not supported by the Admin SDK. For client access with mock users, please use the "firebase" package instead of "firebase-admin".'),a=new ui(ui.OWNER);else if(r.mockUserToken){const c=typeof r.mockUserToken=="string"?r.mockUserToken:ic(r.mockUserToken,n.app.options.projectId);a=new ui(c)}ut(e)&&(Wi(e),zi("Database",!0)),JC(i,s,r,a)}/**
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
 */function iR(n){pw(ir),Ot(new vt("database",(e,{instanceIdentifier:t})=>{const r=e.getProvider("app").getImmediate(),s=e.getProvider("auth-internal"),i=e.getProvider("app-check-internal");return ZC(r,s,i,t)},"PUBLIC").setMultipleInstances(!0)),Qe($h,jh,n),Qe($h,jh,"esm2020")}/**
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
 */const oR={".sv":"timestamp"};function mS(){return oR}kt.prototype.simpleListen=function(n,e){this.sendRequest("q",{p:n},e)};kt.prototype.echo=function(n,e){this.sendRequest("echo",{d:n},e)};iR();const aR={apiKey:"AIzaSyBdE26vC0UAprsdTgBcmYrVuO67ZbccMTA",authDomain:"apps-script-api-443402.firebaseapp.com",databaseURL:"https://apps-script-api-443402-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"apps-script-api-443402",storageBucket:"apps-script-api-443402.appspot.com",messagingSenderId:"46453918785",appId:"1:46453918785:web:a3c386def8dfe69f768ac0",measurementId:"G-TCZ9TL8FLW"},Co=Ud(aR),gS=vv(Co,"anxi-app"),yS=jI(Co),ES=dw(Co),TS=rR(Co);function Y_(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const cR=Y_,X_=new _s("auth","Firebase",Y_());/**
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
 */const Fi=new Gi("@firebase/auth");function lR(n,...e){Fi.logLevel<=W.WARN&&Fi.warn(`Auth (${ir}): ${n}`,...e)}function hi(n,...e){Fi.logLevel<=W.ERROR&&Fi.error(`Auth (${ir}): ${n}`,...e)}/**
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
 */function wd(n,...e){throw Cl(n,...e)}function J_(n,...e){return Cl(n,...e)}function Z_(n,e,t){const r={...cR(),[e]:t};return new _s("auth","Firebase",r).create(e,{appName:n.name})}function di(n){return Z_(n,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function Cl(n,...e){if(typeof n!="string"){const t=e[0],r=[...e.slice(1)];return r[0]&&(r[0].appName=n.name),n._errorFactory.create(t,...r)}return X_.create(n,...e)}function J(n,e,...t){if(!n)throw Cl(e,...t)}function Zr(n){const e="INTERNAL ASSERTION FAILED: "+n;throw hi(e),new Error(e)}function Ui(n,e){n||Zr(e)}function uR(){return Ad()==="http:"||Ad()==="https:"}function Ad(){var n;return typeof self<"u"&&((n=self.location)==null?void 0:n.protocol)||null}/**
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
 */function hR(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(uR()||ig()||"connection"in navigator)?navigator.onLine:!0}function dR(){if(typeof navigator>"u")return null;const n=navigator;return n.languages&&n.languages[0]||n.language||null}/**
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
 */class bs{constructor(e,t){this.shortDelay=e,this.longDelay=t,Ui(t>e,"Short delay should be less than long delay!"),this.isMobile=oc()||xd()}get(){return hR()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
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
 */function fR(n,e){Ui(n.emulator,"Emulator should always be set here");const{url:t}=n.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
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
 */class em{static initialize(e,t,r){this.fetchImpl=e,t&&(this.headersImpl=t),r&&(this.responseImpl=r)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;Zr("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;Zr("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;Zr("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
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
 */const pR={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
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
 */const _R=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],mR=new bs(3e4,6e4);function tm(n,e){return n.tenantId&&!e.tenantId?{...e,tenantId:n.tenantId}:e}async function Ro(n,e,t,r,s={}){return nm(n,s,async()=>{let i={},a={};r&&(e==="GET"?a=r:i={body:JSON.stringify(r)});const c=ac({key:n.config.apiKey,...a}).slice(1),l=await n._getAdditionalHeaders();l["Content-Type"]="application/json",n.languageCode&&(l["X-Firebase-Locale"]=n.languageCode);const h={method:e,headers:l,...i};return sg()||(h.referrerPolicy="no-referrer"),n.emulatorConfig&&ut(n.emulatorConfig.host)&&(h.credentials="include"),em.fetch()(await rm(n,n.config.apiHost,t,c),h)})}async function nm(n,e,t){n._canInitEmulator=!1;const r={...pR,...e};try{const s=new gR(n),i=await Promise.race([t(),s.promise]);s.clearNetworkTimeout();const a=await i.json();if("needConfirmation"in a)throw ri(n,"account-exists-with-different-credential",a);if(i.ok&&!("errorMessage"in a))return a;{const c=i.ok?a.errorMessage:a.error.message,[l,h]=c.split(" : ");if(l==="FEDERATED_USER_ID_ALREADY_LINKED")throw ri(n,"credential-already-in-use",a);if(l==="EMAIL_EXISTS")throw ri(n,"email-already-in-use",a);if(l==="USER_DISABLED")throw ri(n,"user-disabled",a);const f=r[l]||l.toLowerCase().replace(/[_\s]+/g,"-");if(h)throw Z_(n,f,h);wd(n,f)}}catch(s){if(s instanceof wt)throw s;wd(n,"network-request-failed",{message:String(s)})}}async function rm(n,e,t,r){const s=`${e}${t}?${r}`,i=n,a=i.config.emulator?fR(n.config,s):`${n.config.apiScheme}://${s}`;return _R.includes(t)&&(await i._persistenceManagerAvailable,i._getPersistenceType()==="COOKIE")?i._getPersistence()._getFinalTarget(a).toString():a}class gR{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,r)=>{this.timer=setTimeout(()=>r(J_(this.auth,"network-request-failed")),mR.get())})}}function ri(n,e,t){const r={appName:n.name};t.email&&(r.email=t.email),t.phoneNumber&&(r.phoneNumber=t.phoneNumber);const s=J_(n,e,r);return s.customData._tokenResponse=t,s}/**
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
 */async function yR(n,e){return Ro(n,"POST","/v1/accounts:delete",e)}async function Bi(n,e){return Ro(n,"POST","/v1/accounts:lookup",e)}/**
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
 */function es(n){if(n)try{const e=new Date(Number(n));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function ER(n,e=!1){const t=te(n),r=await t.getIdToken(e),s=sm(r);J(s&&s.exp&&s.auth_time&&s.iat,t.auth,"internal-error");const i=typeof s.firebase=="object"?s.firebase:void 0,a=i==null?void 0:i.sign_in_provider;return{claims:s,token:r,authTime:es(pa(s.auth_time)),issuedAtTime:es(pa(s.iat)),expirationTime:es(pa(s.exp)),signInProvider:a||null,signInSecondFactor:(i==null?void 0:i.sign_in_second_factor)||null}}function pa(n){return Number(n)*1e3}function sm(n){const[e,t,r]=n.split(".");if(e===void 0||t===void 0||r===void 0)return hi("JWT malformed, contained fewer than 3 sections"),null;try{const s=pi(t);return s?JSON.parse(s):(hi("Failed to decode base64 JWT payload"),null)}catch(s){return hi("Caught error parsing JWT payload as JSON",s==null?void 0:s.toString()),null}}function Cd(n){const e=sm(n);return J(e,"internal-error"),J(typeof e.exp<"u","internal-error"),J(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
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
 */async function nc(n,e,t=!1){if(t)return e;try{return await e}catch(r){throw r instanceof wt&&TR(r)&&n.auth.currentUser===n&&await n.auth.signOut(),r}}function TR({code:n}){return n==="auth/user-disabled"||n==="auth/user-token-expired"}/**
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
 */class vR{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){const t=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),t}else{this.errorBackoff=3e4;const r=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,r)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
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
 */class rc{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=es(this.lastLoginAt),this.creationTime=es(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
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
 */async function qi(n){var p;const e=n.auth,t=await n.getIdToken(),r=await nc(n,Bi(e,{idToken:t}));J(r==null?void 0:r.users.length,e,"internal-error");const s=r.users[0];n._notifyReloadListener(s);const i=(p=s.providerUserInfo)!=null&&p.length?im(s.providerUserInfo):[],a=wR(n.providerData,i),c=n.isAnonymous,l=!(n.email&&s.passwordHash)&&!(a!=null&&a.length),h=c?l:!1,f={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:a,metadata:new rc(s.createdAt,s.lastLoginAt),isAnonymous:h};Object.assign(n,f)}async function IR(n){const e=te(n);await qi(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function wR(n,e){return[...n.filter(r=>!e.some(s=>s.providerId===r.providerId)),...e]}function im(n){return n.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||"",displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}/**
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
 */async function AR(n,e){const t=await nm(n,{},async()=>{const r=ac({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:s,apiKey:i}=n.config,a=await rm(n,s,"/v1/token",`key=${i}`),c=await n._getAdditionalHeaders();c["Content-Type"]="application/x-www-form-urlencoded";const l={method:"POST",headers:c,body:r};return n.emulatorConfig&&ut(n.emulatorConfig.host)&&(l.credentials="include"),em.fetch()(a,l)});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function CR(n,e){return Ro(n,"POST","/v2/accounts:revokeToken",tm(n,e))}/**
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
 */class Wn{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){J(e.idToken,"internal-error"),J(typeof e.idToken<"u","internal-error"),J(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):Cd(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){J(e.length!==0,"internal-error");const t=Cd(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(J(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:r,refreshToken:s,expiresIn:i}=await AR(e,t);this.updateTokensAndExpiration(r,s,Number(i))}updateTokensAndExpiration(e,t,r){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+r*1e3}static fromJSON(e,t){const{refreshToken:r,accessToken:s,expirationTime:i}=t,a=new Wn;return r&&(J(typeof r=="string","internal-error",{appName:e}),a.refreshToken=r),s&&(J(typeof s=="string","internal-error",{appName:e}),a.accessToken=s),i&&(J(typeof i=="number","internal-error",{appName:e}),a.expirationTime=i),a}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new Wn,this.toJSON())}_performRefresh(){return Zr("not implemented")}}/**
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
 */function jt(n,e){J(typeof n=="string"||typeof n>"u","internal-error",{appName:e})}class _t{constructor({uid:e,auth:t,stsTokenManager:r,...s}){this.providerId="firebase",this.proactiveRefresh=new vR(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=r,this.accessToken=r.accessToken,this.displayName=s.displayName||null,this.email=s.email||null,this.emailVerified=s.emailVerified||!1,this.phoneNumber=s.phoneNumber||null,this.photoURL=s.photoURL||null,this.isAnonymous=s.isAnonymous||!1,this.tenantId=s.tenantId||null,this.providerData=s.providerData?[...s.providerData]:[],this.metadata=new rc(s.createdAt||void 0,s.lastLoginAt||void 0)}async getIdToken(e){const t=await nc(this,this.stsTokenManager.getToken(this.auth,e));return J(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return ER(this,e)}reload(){return IR(this)}_assign(e){this!==e&&(J(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>({...t})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new _t({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return t.metadata._copy(this.metadata),t}_onReload(e){J(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let r=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),r=!0),t&&await qi(this),await this.auth._persistUserIfCurrent(this),r&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(dt(this.auth.app))return Promise.reject(di(this.auth));const e=await this.getIdToken();return await nc(this,yR(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){const r=t.displayName??void 0,s=t.email??void 0,i=t.phoneNumber??void 0,a=t.photoURL??void 0,c=t.tenantId??void 0,l=t._redirectEventId??void 0,h=t.createdAt??void 0,f=t.lastLoginAt??void 0,{uid:p,emailVerified:m,isAnonymous:v,providerData:R,stsTokenManager:k}=t;J(p&&k,e,"internal-error");const P=Wn.fromJSON(this.name,k);J(typeof p=="string",e,"internal-error"),jt(r,e.name),jt(s,e.name),J(typeof m=="boolean",e,"internal-error"),J(typeof v=="boolean",e,"internal-error"),jt(i,e.name),jt(a,e.name),jt(c,e.name),jt(l,e.name),jt(h,e.name),jt(f,e.name);const F=new _t({uid:p,auth:e,email:s,emailVerified:m,displayName:r,isAnonymous:v,photoURL:a,phoneNumber:i,tenantId:c,stsTokenManager:P,createdAt:h,lastLoginAt:f});return R&&Array.isArray(R)&&(F.providerData=R.map(x=>({...x}))),l&&(F._redirectEventId=l),F}static async _fromIdTokenResponse(e,t,r=!1){const s=new Wn;s.updateFromServerResponse(t);const i=new _t({uid:t.localId,auth:e,stsTokenManager:s,isAnonymous:r});return await qi(i),i}static async _fromGetAccountInfoResponse(e,t,r){const s=t.users[0];J(s.localId!==void 0,"internal-error");const i=s.providerUserInfo!==void 0?im(s.providerUserInfo):[],a=!(s.email&&s.passwordHash)&&!(i!=null&&i.length),c=new Wn;c.updateFromIdToken(r);const l=new _t({uid:s.localId,auth:e,stsTokenManager:c,isAnonymous:a}),h={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:i,metadata:new rc(s.createdAt,s.lastLoginAt),isAnonymous:!(s.email&&s.passwordHash)&&!(i!=null&&i.length)};return Object.assign(l,h),l}}/**
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
 */const Rd=new Map;function gn(n){Ui(n instanceof Function,"Expected a class definition");let e=Rd.get(n);return e?(Ui(e instanceof n,"Instance stored in cache mismatched with class"),e):(e=new n,Rd.set(n,e),e)}/**
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
 */class om{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}om.type="NONE";const Sd=om;/**
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
 */function _a(n,e,t){return`firebase:${n}:${e}:${t}`}class zn{constructor(e,t,r){this.persistence=e,this.auth=t,this.userKey=r;const{config:s,name:i}=this.auth;this.fullUserKey=_a(this.userKey,s.apiKey,i),this.fullPersistenceKey=_a("persistence",s.apiKey,i),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const t=await Bi(this.auth,{idToken:e}).catch(()=>{});return t?_t._fromGetAccountInfoResponse(this.auth,t,e):null}return _t._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,r="authUser"){if(!t.length)return new zn(gn(Sd),e,r);const s=(await Promise.all(t.map(async h=>{if(await h._isAvailable())return h}))).filter(h=>h);let i=s[0]||gn(Sd);const a=_a(r,e.config.apiKey,e.name);let c=null;for(const h of t)try{const f=await h._get(a);if(f){let p;if(typeof f=="string"){const m=await Bi(e,{idToken:f}).catch(()=>{});if(!m)break;p=await _t._fromGetAccountInfoResponse(e,m,f)}else p=_t._fromJSON(e,f);h!==i&&(c=p),i=h;break}}catch{}const l=s.filter(h=>h._shouldAllowMigration);return!i._shouldAllowMigration||!l.length?new zn(i,e,r):(i=l[0],c&&await i._set(a,c.toJSON()),await Promise.all(t.map(async h=>{if(h!==i)try{await h._remove(a)}catch{}})),new zn(i,e,r))}}/**
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
 */function bd(n){const e=n.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(PR(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(RR(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(kR(e))return"Blackberry";if(DR(e))return"Webos";if(SR(e))return"Safari";if((e.includes("chrome/")||bR(e))&&!e.includes("edge/"))return"Chrome";if(NR(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,r=n.match(t);if((r==null?void 0:r.length)===2)return r[1]}return"Other"}function RR(n=at()){return/firefox\//i.test(n)}function SR(n=at()){const e=n.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function bR(n=at()){return/crios\//i.test(n)}function PR(n=at()){return/iemobile/i.test(n)}function NR(n=at()){return/android/i.test(n)}function kR(n=at()){return/blackberry/i.test(n)}function DR(n=at()){return/webos/i.test(n)}/**
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
 */function am(n,e=[]){let t;switch(n){case"Browser":t=bd(at());break;case"Worker":t=`${bd(at())}-${n}`;break;default:t=n}const r=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${ir}/${r}`}/**
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
 */class OR{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const r=i=>new Promise((a,c)=>{try{const l=e(i);a(l)}catch(l){c(l)}});r.onAbort=t,this.queue.push(r);const s=this.queue.length-1;return()=>{this.queue[s]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const r of this.queue)await r(e),r.onAbort&&t.push(r.onAbort)}catch(r){t.reverse();for(const s of t)try{s()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:r==null?void 0:r.message})}}}/**
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
 */async function VR(n,e={}){return Ro(n,"GET","/v2/passwordPolicy",tm(n,e))}/**
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
 */const MR=6;class LR{constructor(e){var r;const t=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=t.minPasswordLength??MR,t.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=t.maxPasswordLength),t.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=t.containsLowercaseCharacter),t.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=t.containsUppercaseCharacter),t.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=t.containsNumericCharacter),t.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=t.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=((r=e.allowedNonAlphanumericCharacters)==null?void 0:r.join(""))??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){const t={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,t),this.validatePasswordCharacterOptions(e,t),t.isValid&&(t.isValid=t.meetsMinPasswordLength??!0),t.isValid&&(t.isValid=t.meetsMaxPasswordLength??!0),t.isValid&&(t.isValid=t.containsLowercaseLetter??!0),t.isValid&&(t.isValid=t.containsUppercaseLetter??!0),t.isValid&&(t.isValid=t.containsNumericCharacter??!0),t.isValid&&(t.isValid=t.containsNonAlphanumericCharacter??!0),t}validatePasswordLengthOptions(e,t){const r=this.customStrengthOptions.minPasswordLength,s=this.customStrengthOptions.maxPasswordLength;r&&(t.meetsMinPasswordLength=e.length>=r),s&&(t.meetsMaxPasswordLength=e.length<=s)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let r;for(let s=0;s<e.length;s++)r=e.charAt(s),this.updatePasswordCharacterOptionsStatuses(t,r>="a"&&r<="z",r>="A"&&r<="Z",r>="0"&&r<="9",this.allowedNonAlphanumericCharacters.includes(r))}updatePasswordCharacterOptionsStatuses(e,t,r,s,i){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=r)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=s)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=i))}}/**
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
 */class xR{constructor(e,t,r,s){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=r,this.config=s,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new Pd(this),this.idTokenSubscription=new Pd(this),this.beforeStateQueue=new OR(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=X_,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=s.sdkClientVersion,this._persistenceManagerAvailable=new Promise(i=>this._resolvePersistenceManagerAvailable=i)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=gn(t)),this._initializationPromise=this.queue(async()=>{var r,s,i;if(!this._deleted&&(this.persistenceManager=await zn.create(this,e),(r=this._resolvePersistenceManagerAvailable)==null||r.call(this),!this._deleted)){if((s=this._popupRedirectResolver)!=null&&s._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=((i=this.currentUser)==null?void 0:i.uid)||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await Bi(this,{idToken:e}),r=await _t._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(r)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var i;if(dt(this.app)){const a=this.app.settings.authIdToken;return a?new Promise(c=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(a).then(c,c))}):this.directlySetCurrentUser(null)}const t=await this.assertedPersistence.getCurrentUser();let r=t,s=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const a=(i=this.redirectUser)==null?void 0:i._redirectEventId,c=r==null?void 0:r._redirectEventId,l=await this.tryRedirectSignIn(e);(!a||a===c)&&(l!=null&&l.user)&&(r=l.user,s=!0)}if(!r)return this.directlySetCurrentUser(null);if(!r._redirectEventId){if(s)try{await this.beforeStateQueue.runMiddleware(r)}catch(a){r=t,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(a))}return r?this.reloadAndSetCurrentUserOrClear(r):this.directlySetCurrentUser(null)}return J(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===r._redirectEventId?this.directlySetCurrentUser(r):this.reloadAndSetCurrentUserOrClear(r)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await qi(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=dR()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(dt(this.app))return Promise.reject(di(this));const t=e?te(e):null;return t&&J(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&J(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return dt(this.app)?Promise.reject(di(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return dt(this.app)?Promise.reject(di(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(gn(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await VR(this),t=new LR(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new _s("auth","Firebase",e())}onAuthStateChanged(e,t,r){return this.registerStateListener(this.authStateSubscription,e,t,r)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,r){return this.registerStateListener(this.idTokenSubscription,e,t,r)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const r=this.onAuthStateChanged(()=>{r(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),r={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(r.tenantId=this.tenantId),await CR(this,r)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)==null?void 0:e.toJSON()}}async _setRedirectUser(e,t){const r=await this.getOrInitRedirectPersistenceManager(t);return e===null?r.removeCurrentUser():r.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&gn(e)||this._popupRedirectResolver;J(t,this,"argument-error"),this.redirectPersistenceManager=await zn.create(this,[gn(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,r;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)==null?void 0:t._redirectEventId)===e?this._currentUser:((r=this.redirectUser)==null?void 0:r._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const e=((t=this.currentUser)==null?void 0:t.uid)??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,r,s){if(this._deleted)return()=>{};const i=typeof t=="function"?t:t.next.bind(t);let a=!1;const c=this._isInitialized?Promise.resolve():this._initializationPromise;if(J(c,this,"internal-error"),c.then(()=>{a||i(this.currentUser)}),typeof t=="function"){const l=e.addObserver(t,r,s);return()=>{a=!0,l()}}else{const l=e.addObserver(t);return()=>{a=!0,l()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return J(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=am(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var s;const e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);const t=await((s=this.heartbeatServiceProvider.getImmediate({optional:!0}))==null?void 0:s.getHeartbeatsHeader());t&&(e["X-Firebase-Client"]=t);const r=await this._getAppCheckToken();return r&&(e["X-Firebase-AppCheck"]=r),e}async _getAppCheckToken(){var t;if(dt(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=await((t=this.appCheckServiceProvider.getImmediate({optional:!0}))==null?void 0:t.getToken());return e!=null&&e.error&&lR(`Error while retrieving App Check token: ${e.error}`),e==null?void 0:e.token}}function FR(n){return te(n)}class Pd{constructor(e){this.auth=e,this.observer=null,this.addObserver=mg(t=>this.observer=t)}get next(){return J(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}function UR(n,e){const t=(e==null?void 0:e.persistence)||[],r=(Array.isArray(t)?t:[t]).map(gn);e!=null&&e.errorMap&&n._updateErrorMap(e.errorMap),n._initializeWithPersistence(r,e==null?void 0:e.popupRedirectResolver)}new bs(3e4,6e4);/**
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
 */new bs(2e3,1e4);/**
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
 */new bs(3e4,6e4);/**
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
 */new bs(5e3,15e3);var Nd="@firebase/auth",kd="1.11.0";/**
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
 */class BR{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)==null?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(r=>{e((r==null?void 0:r.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){J(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
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
 */function qR(n){switch(n){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function $R(n){Ot(new vt("auth",(e,{options:t})=>{const r=e.getProvider("app").getImmediate(),s=e.getProvider("heartbeat"),i=e.getProvider("app-check-internal"),{apiKey:a,authDomain:c}=r.options;J(a&&!a.includes(":"),"invalid-api-key",{appName:r.name});const l={apiKey:a,authDomain:c,clientPlatform:n,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:am(n)},h=new xR(r,s,i,l);return UR(h,t),h},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,r)=>{e.getProvider("auth-internal").initialize()})),Ot(new vt("auth-internal",e=>{const t=FR(e.getProvider("auth").getImmediate());return(r=>new BR(r))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),Qe(Nd,kd,qR(n)),Qe(Nd,kd,"esm2020")}/**
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
 */const jR=5*60;eg("authIdTokenMaxAge");$R("Browser");export{sS as A,JR as B,TS as C,mS as D,le as T,XR as a,eS as b,GR as c,gS as d,dw as e,ES as f,oS as g,dS as h,Tv as i,ZR as j,KR as k,cS as l,yS as m,lS as n,iS as o,uS as p,QR as q,hS as r,aS as s,fS as t,nS as u,pS as v,YR as w,_S as x,tS as y,rS as z};
