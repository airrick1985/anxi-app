import{aN as ow}from"./vendor-CfVTN-qe.js";const aw=()=>{};var Yf={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Rm={NODE_ADMIN:!1,SDK_VERSION:"${JSCORE_VERSION}"};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const O=function(n,e){if(!n)throw xs(e)},xs=function(n){return new Error("Firebase Database ("+Rm.SDK_VERSION+") INTERNAL ASSERT FAILED: "+n)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Sm=function(n){const e=[];let t=0;for(let r=0;r<n.length;r++){let s=n.charCodeAt(r);s<128?e[t++]=s:s<2048?(e[t++]=s>>6|192,e[t++]=s&63|128):(s&64512)===55296&&r+1<n.length&&(n.charCodeAt(r+1)&64512)===56320?(s=65536+((s&1023)<<10)+(n.charCodeAt(++r)&1023),e[t++]=s>>18|240,e[t++]=s>>12&63|128,e[t++]=s>>6&63|128,e[t++]=s&63|128):(e[t++]=s>>12|224,e[t++]=s>>6&63|128,e[t++]=s&63|128)}return e},cw=function(n){const e=[];let t=0,r=0;for(;t<n.length;){const s=n[t++];if(s<128)e[r++]=String.fromCharCode(s);else if(s>191&&s<224){const i=n[t++];e[r++]=String.fromCharCode((s&31)<<6|i&63)}else if(s>239&&s<365){const i=n[t++],o=n[t++],a=n[t++],l=((s&7)<<18|(i&63)<<12|(o&63)<<6|a&63)-65536;e[r++]=String.fromCharCode(55296+(l>>10)),e[r++]=String.fromCharCode(56320+(l&1023))}else{const i=n[t++],o=n[t++];e[r++]=String.fromCharCode((s&15)<<12|(i&63)<<6|o&63)}}return e.join("")},Ju={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,e){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let s=0;s<n.length;s+=3){const i=n[s],o=s+1<n.length,a=o?n[s+1]:0,l=s+2<n.length,u=l?n[s+2]:0,d=i>>2,f=(i&3)<<4|a>>4;let _=(a&15)<<2|u>>6,g=u&63;l||(g=64,o||(_=64)),r.push(t[d],t[f],t[_],t[g])}return r.join("")},encodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(n):this.encodeByteArray(Sm(n),e)},decodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(n):cw(this.decodeStringToByteArray(n,e))},decodeStringToByteArray(n,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let s=0;s<n.length;){const i=t[n.charAt(s++)],a=s<n.length?t[n.charAt(s)]:0;++s;const u=s<n.length?t[n.charAt(s)]:64;++s;const f=s<n.length?t[n.charAt(s)]:64;if(++s,i==null||a==null||u==null||f==null)throw new lw;const _=i<<2|a>>4;if(r.push(_),u!==64){const g=a<<4&240|u>>2;if(r.push(g),f!==64){const v=u<<6&192|f;r.push(v)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class lw extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Cm=function(n){const e=Sm(n);return Ju.encodeByteArray(e,!0)},Pa=function(n){return Cm(n).replace(/\./g,"")},Na=function(n){try{return Ju.decodeString(n,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function uw(n){return Pm(void 0,n)}function Pm(n,e){if(!(e instanceof Object))return e;switch(e.constructor){case Date:const t=e;return new Date(t.getTime());case Object:n===void 0&&(n={});break;case Array:n=[];break;default:return e}for(const t in e)!e.hasOwnProperty(t)||!hw(t)||(n[t]=Pm(n[t],e[t]));return n}function hw(n){return n!=="__proto__"}/**
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
 */function Nm(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
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
 */const dw=()=>Nm().__FIREBASE_DEFAULTS__,fw=()=>{if(typeof process>"u"||typeof Yf>"u")return;const n=Yf.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},pw=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=n&&Na(n[1]);return e&&JSON.parse(e)},pc=()=>{try{return aw()||dw()||fw()||pw()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},_w=n=>{var e,t;return(t=(e=pc())==null?void 0:e.emulatorHosts)==null?void 0:t[n]},_c=n=>{const e=_w(n);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const r=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),r]:[e.substring(0,t),r]},km=()=>{var n;return(n=pc())==null?void 0:n.config},mw=n=>{var e;return(e=pc())==null?void 0:e[`_${n}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wt{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,r)=>{t?this.reject(t):this.resolve(r),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,r))}}}/**
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
 */function wt(n){try{return(n.startsWith("http://")||n.startsWith("https://")?new URL(n).hostname:n).endsWith(".cloudworkstations.dev")}catch{return!1}}async function yo(n){return(await fetch(n,{credentials:"include"})).ok}/**
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
 */function Xu(n,e){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},r=e||"demo-project",s=n.iat||0,i=n.sub||n.user_id;if(!i)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const o={iss:`https://securetoken.google.com/${r}`,aud:r,iat:s,exp:s+3600,auth_time:s,sub:i,user_id:i,firebase:{sign_in_provider:"custom",identities:{}},...n};return[Pa(JSON.stringify(t)),Pa(JSON.stringify(o)),""].join(".")}const Ci={};function gw(){const n={prod:[],emulator:[]};for(const e of Object.keys(Ci))Ci[e]?n.emulator.push(e):n.prod.push(e);return n}function yw(n){let e=document.getElementById(n),t=!1;return e||(e=document.createElement("div"),e.setAttribute("id",n),t=!0),{created:t,element:e}}let Jf=!1;function mc(n,e){if(typeof window>"u"||typeof document>"u"||!wt(window.location.host)||Ci[n]===e||Ci[n]||Jf)return;Ci[n]=e;function t(_){return`__firebase__banner__${_}`}const r="__firebase__banner",i=gw().prod.length>0;function o(){const _=document.getElementById(r);_&&_.remove()}function a(_){_.style.display="flex",_.style.background="#7faaf0",_.style.position="fixed",_.style.bottom="5px",_.style.left="5px",_.style.padding=".5em",_.style.borderRadius="5px",_.style.alignItems="center"}function l(_,g){_.setAttribute("width","24"),_.setAttribute("id",g),_.setAttribute("height","24"),_.setAttribute("viewBox","0 0 24 24"),_.setAttribute("fill","none"),_.style.marginLeft="-6px"}function u(){const _=document.createElement("span");return _.style.cursor="pointer",_.style.marginLeft="16px",_.style.fontSize="24px",_.innerHTML=" &times;",_.onclick=()=>{Jf=!0,o()},_}function d(_,g){_.setAttribute("id",g),_.innerText="Learn more",_.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",_.setAttribute("target","__blank"),_.style.paddingLeft="5px",_.style.textDecoration="underline"}function f(){const _=yw(r),g=t("text"),v=document.getElementById(g)||document.createElement("span"),C=t("learnmore"),N=document.getElementById(C)||document.createElement("a"),V=t("preprendIcon"),B=document.getElementById(V)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(_.created){const U=_.element;a(U),d(N,C);const $=u();l(B,V),U.append(B,v,N,$),document.body.appendChild(U)}i?(v.innerText="Preview backend disconnected.",B.innerHTML=`<g clip-path="url(#clip0_6013_33858)">
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
</defs>`,v.innerText="Preview backend running in this workspace."),v.setAttribute("id",g)}document.readyState==="loading"?window.addEventListener("DOMContentLoaded",f):f()}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function pt(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function Zu(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(pt())}function Dm(){var e;const n=(e=pc())==null?void 0:e.forceEnvironment;if(n==="node")return!0;if(n==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function Iw(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function Ew(){const n=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof n=="object"&&n.id!==void 0}function xm(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function Tw(){return Rm.NODE_ADMIN===!0}function Vm(){return!Dm()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function Om(){return!Dm()&&!!navigator.userAgent&&(navigator.userAgent.includes("Safari")||navigator.userAgent.includes("WebKit"))&&!navigator.userAgent.includes("Chrome")}function Mm(){try{return typeof indexedDB=="object"}catch{return!1}}function ww(){return new Promise((n,e)=>{try{let t=!0;const r="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(r);s.onsuccess=()=>{s.result.close(),t||self.indexedDB.deleteDatabase(r),n(!0)},s.onupgradeneeded=()=>{t=!1},s.onerror=()=>{var i;e(((i=s.error)==null?void 0:i.message)||"")}}catch(t){e(t)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vw="FirebaseError";class zt extends Error{constructor(e,t,r){super(t),this.code=e,this.customData=r,this.name=vw,Object.setPrototypeOf(this,zt.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,Io.prototype.create)}}class Io{constructor(e,t,r){this.service=e,this.serviceName=t,this.errors=r}create(e,...t){const r=t[0]||{},s=`${this.service}/${e}`,i=this.errors[e],o=i?Aw(i,r):"Error",a=`${this.serviceName}: ${o} (${s}).`;return new zt(s,a,r)}}function Aw(n,e){return n.replace(bw,(t,r)=>{const s=e[r];return s!=null?String(s):`<${r}?>`})}const bw=/\{\$([^}]+)}/g;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ki(n){return JSON.parse(n)}function Me(n){return JSON.stringify(n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Lm=function(n){let e={},t={},r={},s="";try{const i=n.split(".");e=Ki(Na(i[0])||""),t=Ki(Na(i[1])||""),s=i[2],r=t.d||{},delete t.d}catch{}return{header:e,claims:t,data:r,signature:s}},Rw=function(n){const e=Lm(n),t=e.claims;return!!t&&typeof t=="object"&&t.hasOwnProperty("iat")},Sw=function(n){const e=Lm(n).claims;return typeof e=="object"&&e.admin===!0};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $t(n,e){return Object.prototype.hasOwnProperty.call(n,e)}function is(n,e){if(Object.prototype.hasOwnProperty.call(n,e))return n[e]}function Zl(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}function ka(n,e,t){const r={};for(const s in n)Object.prototype.hasOwnProperty.call(n,s)&&(r[s]=e.call(t,n[s],s,n));return r}function Jt(n,e){if(n===e)return!0;const t=Object.keys(n),r=Object.keys(e);for(const s of t){if(!r.includes(s))return!1;const i=n[s],o=e[s];if(Xf(i)&&Xf(o)){if(!Jt(i,o))return!1}else if(i!==o)return!1}for(const s of r)if(!t.includes(s))return!1;return!0}function Xf(n){return n!==null&&typeof n=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function eh(n){const e=[];for(const[t,r]of Object.entries(n))Array.isArray(r)?r.forEach(s=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(s))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(r));return e.length?"&"+e.join("&"):""}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cw{constructor(){this.chain_=[],this.buf_=[],this.W_=[],this.pad_=[],this.inbuf_=0,this.total_=0,this.blockSize=512/8,this.pad_[0]=128;for(let e=1;e<this.blockSize;++e)this.pad_[e]=0;this.reset()}reset(){this.chain_[0]=1732584193,this.chain_[1]=4023233417,this.chain_[2]=2562383102,this.chain_[3]=271733878,this.chain_[4]=3285377520,this.inbuf_=0,this.total_=0}compress_(e,t){t||(t=0);const r=this.W_;if(typeof e=="string")for(let f=0;f<16;f++)r[f]=e.charCodeAt(t)<<24|e.charCodeAt(t+1)<<16|e.charCodeAt(t+2)<<8|e.charCodeAt(t+3),t+=4;else for(let f=0;f<16;f++)r[f]=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3],t+=4;for(let f=16;f<80;f++){const _=r[f-3]^r[f-8]^r[f-14]^r[f-16];r[f]=(_<<1|_>>>31)&4294967295}let s=this.chain_[0],i=this.chain_[1],o=this.chain_[2],a=this.chain_[3],l=this.chain_[4],u,d;for(let f=0;f<80;f++){f<40?f<20?(u=a^i&(o^a),d=1518500249):(u=i^o^a,d=1859775393):f<60?(u=i&o|a&(i|o),d=2400959708):(u=i^o^a,d=3395469782);const _=(s<<5|s>>>27)+u+l+d+r[f]&4294967295;l=a,a=o,o=(i<<30|i>>>2)&4294967295,i=s,s=_}this.chain_[0]=this.chain_[0]+s&4294967295,this.chain_[1]=this.chain_[1]+i&4294967295,this.chain_[2]=this.chain_[2]+o&4294967295,this.chain_[3]=this.chain_[3]+a&4294967295,this.chain_[4]=this.chain_[4]+l&4294967295}update(e,t){if(e==null)return;t===void 0&&(t=e.length);const r=t-this.blockSize;let s=0;const i=this.buf_;let o=this.inbuf_;for(;s<t;){if(o===0)for(;s<=r;)this.compress_(e,s),s+=this.blockSize;if(typeof e=="string"){for(;s<t;)if(i[o]=e.charCodeAt(s),++o,++s,o===this.blockSize){this.compress_(i),o=0;break}}else for(;s<t;)if(i[o]=e[s],++o,++s,o===this.blockSize){this.compress_(i),o=0;break}}this.inbuf_=o,this.total_+=t}digest(){const e=[];let t=this.total_*8;this.inbuf_<56?this.update(this.pad_,56-this.inbuf_):this.update(this.pad_,this.blockSize-(this.inbuf_-56));for(let s=this.blockSize-1;s>=56;s--)this.buf_[s]=t&255,t/=256;this.compress_(this.buf_);let r=0;for(let s=0;s<5;s++)for(let i=24;i>=0;i-=8)e[r]=this.chain_[s]>>i&255,++r;return e}}function Pw(n,e){const t=new Nw(n,e);return t.subscribe.bind(t)}class Nw{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(r=>{this.error(r)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,r){let s;if(e===void 0&&t===void 0&&r===void 0)throw new Error("Missing Observer.");kw(e,["next","error","complete"])?s=e:s={next:e,error:t,complete:r},s.next===void 0&&(s.next=kl),s.error===void 0&&(s.error=kl),s.complete===void 0&&(s.complete=kl);const i=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?s.error(this.finalError):s.complete()}catch{}}),this.observers.push(s),i}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(r){typeof console<"u"&&console.error&&console.error(r)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function kw(n,e){if(typeof n!="object"||n===null)return!1;for(const t of e)if(t in n&&typeof n[t]=="function")return!0;return!1}function kl(){}function os(n,e){return`${n} failed: ${e} argument `}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Dw=function(n){const e=[];let t=0;for(let r=0;r<n.length;r++){let s=n.charCodeAt(r);if(s>=55296&&s<=56319){const i=s-55296;r++,O(r<n.length,"Surrogate pair missing trail surrogate.");const o=n.charCodeAt(r)-56320;s=65536+(i<<10)+o}s<128?e[t++]=s:s<2048?(e[t++]=s>>6|192,e[t++]=s&63|128):s<65536?(e[t++]=s>>12|224,e[t++]=s>>6&63|128,e[t++]=s&63|128):(e[t++]=s>>18|240,e[t++]=s>>12&63|128,e[t++]=s>>6&63|128,e[t++]=s&63|128)}return e},gc=function(n){let e=0;for(let t=0;t<n.length;t++){const r=n.charCodeAt(t);r<128?e++:r<2048?e+=2:r>=55296&&r<=56319?(e+=4,t++):e+=3}return e};/**
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
 */function te(n){return n&&n._delegate?n._delegate:n}class Bt{constructor(e,t,r){this.name=e,this.instanceFactory=t,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
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
 */const nr="[DEFAULT]";/**
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
 */class xw{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const r=new Wt;if(this.instancesDeferred.set(t,r),this.isInitialized(t)||this.shouldAutoInitialize())try{const s=this.getOrInitializeService({instanceIdentifier:t});s&&r.resolve(s)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),r=(e==null?void 0:e.optional)??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(s){if(r)return null;throw s}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(Ow(e))try{this.getOrInitializeService({instanceIdentifier:nr})}catch{}for(const[t,r]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(t);try{const i=this.getOrInitializeService({instanceIdentifier:s});r.resolve(i)}catch{}}}}clearInstance(e=nr){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=nr){return this.instances.has(e)}getOptions(e=nr){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,r=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:r,options:t});for(const[i,o]of this.instancesDeferred.entries()){const a=this.normalizeInstanceIdentifier(i);r===a&&o.resolve(s)}return s}onInit(e,t){const r=this.normalizeInstanceIdentifier(t),s=this.onInitCallbacks.get(r)??new Set;s.add(e),this.onInitCallbacks.set(r,s);const i=this.instances.get(r);return i&&e(i,r),()=>{s.delete(e)}}invokeOnInitCallbacks(e,t){const r=this.onInitCallbacks.get(t);if(r)for(const s of r)try{s(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let r=this.instances.get(e);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:Vw(e),options:t}),this.instances.set(e,r),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(r,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,r)}catch{}return r||null}normalizeInstanceIdentifier(e=nr){return this.component?this.component.multipleInstances?e:nr:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Vw(n){return n===nr?void 0:n}function Ow(n){return n.instantiationMode==="EAGER"}/**
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
 */class Mw{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new xw(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ne;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(ne||(ne={}));const Lw={debug:ne.DEBUG,verbose:ne.VERBOSE,info:ne.INFO,warn:ne.WARN,error:ne.ERROR,silent:ne.SILENT},Fw=ne.INFO,Uw={[ne.DEBUG]:"log",[ne.VERBOSE]:"log",[ne.INFO]:"info",[ne.WARN]:"warn",[ne.ERROR]:"error"},Bw=(n,e,...t)=>{if(e<n.logLevel)return;const r=new Date().toISOString(),s=Uw[e];if(s)console[s](`[${r}]  ${n.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class yc{constructor(e){this.name=e,this._logLevel=Fw,this._logHandler=Bw,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in ne))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?Lw[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,ne.DEBUG,...e),this._logHandler(this,ne.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,ne.VERBOSE,...e),this._logHandler(this,ne.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,ne.INFO,...e),this._logHandler(this,ne.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,ne.WARN,...e),this._logHandler(this,ne.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,ne.ERROR,...e),this._logHandler(this,ne.ERROR,...e)}}/**
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
 */class qw{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(Gw(t)){const r=t.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(t=>t).join(" ")}}function Gw(n){const e=n.getComponent();return(e==null?void 0:e.type)==="VERSION"}const eu="@firebase/app",Zf="0.14.5";/**
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
 */const Xt=new yc("@firebase/app"),zw="@firebase/app-compat",$w="@firebase/analytics-compat",jw="@firebase/analytics",Ww="@firebase/app-check-compat",Kw="@firebase/app-check",Hw="@firebase/auth",Qw="@firebase/auth-compat",Yw="@firebase/database",Jw="@firebase/data-connect",Xw="@firebase/database-compat",Zw="@firebase/functions",ev="@firebase/functions-compat",tv="@firebase/installations",nv="@firebase/installations-compat",rv="@firebase/messaging",sv="@firebase/messaging-compat",iv="@firebase/performance",ov="@firebase/performance-compat",av="@firebase/remote-config",cv="@firebase/remote-config-compat",lv="@firebase/storage",uv="@firebase/storage-compat",hv="@firebase/firestore",dv="@firebase/ai",fv="@firebase/firestore-compat",pv="firebase",_v="12.5.0";/**
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
 */const Da="[DEFAULT]",mv={[eu]:"fire-core",[zw]:"fire-core-compat",[jw]:"fire-analytics",[$w]:"fire-analytics-compat",[Kw]:"fire-app-check",[Ww]:"fire-app-check-compat",[Hw]:"fire-auth",[Qw]:"fire-auth-compat",[Yw]:"fire-rtdb",[Jw]:"fire-data-connect",[Xw]:"fire-rtdb-compat",[Zw]:"fire-fn",[ev]:"fire-fn-compat",[tv]:"fire-iid",[nv]:"fire-iid-compat",[rv]:"fire-fcm",[sv]:"fire-fcm-compat",[iv]:"fire-perf",[ov]:"fire-perf-compat",[av]:"fire-rc",[cv]:"fire-rc-compat",[lv]:"fire-gcs",[uv]:"fire-gcs-compat",[hv]:"fire-fst",[fv]:"fire-fst-compat",[dv]:"fire-vertex","fire-js":"fire-js",[pv]:"fire-js-all"};/**
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
 */const xa=new Map,gv=new Map,tu=new Map;function ep(n,e){try{n.container.addComponent(e)}catch(t){Xt.debug(`Component ${e.name} failed to register with FirebaseApp ${n.name}`,t)}}function Zt(n){const e=n.name;if(tu.has(e))return Xt.debug(`There were multiple attempts to register component ${e}.`),!1;tu.set(e,n);for(const t of xa.values())ep(t,n);for(const t of gv.values())ep(t,n);return!0}function Vs(n,e){const t=n.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),n.container.getProvider(e)}function yv(n,e,t=Da){Vs(n,e).clearInstance(t)}function xt(n){return n==null?!1:n.settings!==void 0}/**
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
 */const Iv={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},An=new Io("app","Firebase",Iv);/**
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
 */class Ev{constructor(e,t,r){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new Bt("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw An.create("app-deleted",{appName:this._name})}}/**
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
 */const Os=_v;function Fm(n,e={}){let t=n;typeof e!="object"&&(e={name:e});const r={name:Da,automaticDataCollectionEnabled:!0,...e},s=r.name;if(typeof s!="string"||!s)throw An.create("bad-app-name",{appName:String(s)});if(t||(t=km()),!t)throw An.create("no-options");const i=xa.get(s);if(i){if(Jt(t,i.options)&&Jt(r,i.config))return i;throw An.create("duplicate-app",{appName:s})}const o=new Mw(s);for(const l of tu.values())o.addComponent(l);const a=new Ev(t,r,o);return xa.set(s,a),a}function Ic(n=Da){const e=xa.get(n);if(!e&&n===Da&&km())return Fm();if(!e)throw An.create("no-app",{appName:n});return e}function ut(n,e,t){let r=mv[n]??n;t&&(r+=`-${t}`);const s=r.match(/\s|\//),i=e.match(/\s|\//);if(s||i){const o=[`Unable to register library "${r}" with version "${e}":`];s&&o.push(`library name "${r}" contains illegal characters (whitespace or "/")`),s&&i&&o.push("and"),i&&o.push(`version name "${e}" contains illegal characters (whitespace or "/")`),Xt.warn(o.join(" "));return}Zt(new Bt(`${r}-version`,()=>({library:r,version:e}),"VERSION"))}/**
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
 */const Tv="firebase-heartbeat-database",wv=1,Hi="firebase-heartbeat-store";let Dl=null;function Um(){return Dl||(Dl=ow(Tv,wv,{upgrade:(n,e)=>{switch(e){case 0:try{n.createObjectStore(Hi)}catch(t){console.warn(t)}}}}).catch(n=>{throw An.create("idb-open",{originalErrorMessage:n.message})})),Dl}async function vv(n){try{const t=(await Um()).transaction(Hi),r=await t.objectStore(Hi).get(Bm(n));return await t.done,r}catch(e){if(e instanceof zt)Xt.warn(e.message);else{const t=An.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});Xt.warn(t.message)}}}async function tp(n,e){try{const r=(await Um()).transaction(Hi,"readwrite");await r.objectStore(Hi).put(e,Bm(n)),await r.done}catch(t){if(t instanceof zt)Xt.warn(t.message);else{const r=An.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});Xt.warn(r.message)}}}function Bm(n){return`${n.name}!${n.options.appId}`}/**
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
 */const Av=1024,bv=30;class Rv{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new Cv(t),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var e,t;try{const s=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),i=np();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===i||this._heartbeatsCache.heartbeats.some(o=>o.date===i))return;if(this._heartbeatsCache.heartbeats.push({date:i,agent:s}),this._heartbeatsCache.heartbeats.length>bv){const o=Pv(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(o,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){Xt.warn(r)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=np(),{heartbeatsToSend:r,unsentEntries:s}=Sv(this._heartbeatsCache.heartbeats),i=Pa(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=t,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),i}catch(t){return Xt.warn(t),""}}}function np(){return new Date().toISOString().substring(0,10)}function Sv(n,e=Av){const t=[];let r=n.slice();for(const s of n){const i=t.find(o=>o.agent===s.agent);if(i){if(i.dates.push(s.date),rp(t)>e){i.dates.pop();break}}else if(t.push({agent:s.agent,dates:[s.date]}),rp(t)>e){t.pop();break}r=r.slice(1)}return{heartbeatsToSend:t,unsentEntries:r}}class Cv{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Mm()?ww().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await vv(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return tp(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return tp(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...e.heartbeats]})}else return}}function rp(n){return Pa(JSON.stringify({version:2,heartbeats:n})).length}function Pv(n){if(n.length===0)return-1;let e=0,t=n[0].date;for(let r=1;r<n.length;r++)n[r].date<t&&(t=n[r].date,e=r);return e}/**
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
 */function Nv(n){Zt(new Bt("platform-logger",e=>new qw(e),"PRIVATE")),Zt(new Bt("heartbeat",e=>new Rv(e),"PRIVATE")),ut(eu,Zf,n),ut(eu,Zf,"esm2020"),ut("fire-js","")}Nv("");var kv="firebase",Dv="12.5.0";/**
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
 */ut(kv,Dv,"app");var sp=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var bn,qm;(function(){var n;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(T,y){function E(){}E.prototype=y.prototype,T.F=y.prototype,T.prototype=new E,T.prototype.constructor=T,T.D=function(A,w,P){for(var I=Array(arguments.length-2),rt=2;rt<arguments.length;rt++)I[rt-2]=arguments[rt];return y.prototype[w].apply(A,I)}}function t(){this.blockSize=-1}function r(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}e(r,t),r.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function s(T,y,E){E||(E=0);const A=Array(16);if(typeof y=="string")for(var w=0;w<16;++w)A[w]=y.charCodeAt(E++)|y.charCodeAt(E++)<<8|y.charCodeAt(E++)<<16|y.charCodeAt(E++)<<24;else for(w=0;w<16;++w)A[w]=y[E++]|y[E++]<<8|y[E++]<<16|y[E++]<<24;y=T.g[0],E=T.g[1],w=T.g[2];let P=T.g[3],I;I=y+(P^E&(w^P))+A[0]+3614090360&4294967295,y=E+(I<<7&4294967295|I>>>25),I=P+(w^y&(E^w))+A[1]+3905402710&4294967295,P=y+(I<<12&4294967295|I>>>20),I=w+(E^P&(y^E))+A[2]+606105819&4294967295,w=P+(I<<17&4294967295|I>>>15),I=E+(y^w&(P^y))+A[3]+3250441966&4294967295,E=w+(I<<22&4294967295|I>>>10),I=y+(P^E&(w^P))+A[4]+4118548399&4294967295,y=E+(I<<7&4294967295|I>>>25),I=P+(w^y&(E^w))+A[5]+1200080426&4294967295,P=y+(I<<12&4294967295|I>>>20),I=w+(E^P&(y^E))+A[6]+2821735955&4294967295,w=P+(I<<17&4294967295|I>>>15),I=E+(y^w&(P^y))+A[7]+4249261313&4294967295,E=w+(I<<22&4294967295|I>>>10),I=y+(P^E&(w^P))+A[8]+1770035416&4294967295,y=E+(I<<7&4294967295|I>>>25),I=P+(w^y&(E^w))+A[9]+2336552879&4294967295,P=y+(I<<12&4294967295|I>>>20),I=w+(E^P&(y^E))+A[10]+4294925233&4294967295,w=P+(I<<17&4294967295|I>>>15),I=E+(y^w&(P^y))+A[11]+2304563134&4294967295,E=w+(I<<22&4294967295|I>>>10),I=y+(P^E&(w^P))+A[12]+1804603682&4294967295,y=E+(I<<7&4294967295|I>>>25),I=P+(w^y&(E^w))+A[13]+4254626195&4294967295,P=y+(I<<12&4294967295|I>>>20),I=w+(E^P&(y^E))+A[14]+2792965006&4294967295,w=P+(I<<17&4294967295|I>>>15),I=E+(y^w&(P^y))+A[15]+1236535329&4294967295,E=w+(I<<22&4294967295|I>>>10),I=y+(w^P&(E^w))+A[1]+4129170786&4294967295,y=E+(I<<5&4294967295|I>>>27),I=P+(E^w&(y^E))+A[6]+3225465664&4294967295,P=y+(I<<9&4294967295|I>>>23),I=w+(y^E&(P^y))+A[11]+643717713&4294967295,w=P+(I<<14&4294967295|I>>>18),I=E+(P^y&(w^P))+A[0]+3921069994&4294967295,E=w+(I<<20&4294967295|I>>>12),I=y+(w^P&(E^w))+A[5]+3593408605&4294967295,y=E+(I<<5&4294967295|I>>>27),I=P+(E^w&(y^E))+A[10]+38016083&4294967295,P=y+(I<<9&4294967295|I>>>23),I=w+(y^E&(P^y))+A[15]+3634488961&4294967295,w=P+(I<<14&4294967295|I>>>18),I=E+(P^y&(w^P))+A[4]+3889429448&4294967295,E=w+(I<<20&4294967295|I>>>12),I=y+(w^P&(E^w))+A[9]+568446438&4294967295,y=E+(I<<5&4294967295|I>>>27),I=P+(E^w&(y^E))+A[14]+3275163606&4294967295,P=y+(I<<9&4294967295|I>>>23),I=w+(y^E&(P^y))+A[3]+4107603335&4294967295,w=P+(I<<14&4294967295|I>>>18),I=E+(P^y&(w^P))+A[8]+1163531501&4294967295,E=w+(I<<20&4294967295|I>>>12),I=y+(w^P&(E^w))+A[13]+2850285829&4294967295,y=E+(I<<5&4294967295|I>>>27),I=P+(E^w&(y^E))+A[2]+4243563512&4294967295,P=y+(I<<9&4294967295|I>>>23),I=w+(y^E&(P^y))+A[7]+1735328473&4294967295,w=P+(I<<14&4294967295|I>>>18),I=E+(P^y&(w^P))+A[12]+2368359562&4294967295,E=w+(I<<20&4294967295|I>>>12),I=y+(E^w^P)+A[5]+4294588738&4294967295,y=E+(I<<4&4294967295|I>>>28),I=P+(y^E^w)+A[8]+2272392833&4294967295,P=y+(I<<11&4294967295|I>>>21),I=w+(P^y^E)+A[11]+1839030562&4294967295,w=P+(I<<16&4294967295|I>>>16),I=E+(w^P^y)+A[14]+4259657740&4294967295,E=w+(I<<23&4294967295|I>>>9),I=y+(E^w^P)+A[1]+2763975236&4294967295,y=E+(I<<4&4294967295|I>>>28),I=P+(y^E^w)+A[4]+1272893353&4294967295,P=y+(I<<11&4294967295|I>>>21),I=w+(P^y^E)+A[7]+4139469664&4294967295,w=P+(I<<16&4294967295|I>>>16),I=E+(w^P^y)+A[10]+3200236656&4294967295,E=w+(I<<23&4294967295|I>>>9),I=y+(E^w^P)+A[13]+681279174&4294967295,y=E+(I<<4&4294967295|I>>>28),I=P+(y^E^w)+A[0]+3936430074&4294967295,P=y+(I<<11&4294967295|I>>>21),I=w+(P^y^E)+A[3]+3572445317&4294967295,w=P+(I<<16&4294967295|I>>>16),I=E+(w^P^y)+A[6]+76029189&4294967295,E=w+(I<<23&4294967295|I>>>9),I=y+(E^w^P)+A[9]+3654602809&4294967295,y=E+(I<<4&4294967295|I>>>28),I=P+(y^E^w)+A[12]+3873151461&4294967295,P=y+(I<<11&4294967295|I>>>21),I=w+(P^y^E)+A[15]+530742520&4294967295,w=P+(I<<16&4294967295|I>>>16),I=E+(w^P^y)+A[2]+3299628645&4294967295,E=w+(I<<23&4294967295|I>>>9),I=y+(w^(E|~P))+A[0]+4096336452&4294967295,y=E+(I<<6&4294967295|I>>>26),I=P+(E^(y|~w))+A[7]+1126891415&4294967295,P=y+(I<<10&4294967295|I>>>22),I=w+(y^(P|~E))+A[14]+2878612391&4294967295,w=P+(I<<15&4294967295|I>>>17),I=E+(P^(w|~y))+A[5]+4237533241&4294967295,E=w+(I<<21&4294967295|I>>>11),I=y+(w^(E|~P))+A[12]+1700485571&4294967295,y=E+(I<<6&4294967295|I>>>26),I=P+(E^(y|~w))+A[3]+2399980690&4294967295,P=y+(I<<10&4294967295|I>>>22),I=w+(y^(P|~E))+A[10]+4293915773&4294967295,w=P+(I<<15&4294967295|I>>>17),I=E+(P^(w|~y))+A[1]+2240044497&4294967295,E=w+(I<<21&4294967295|I>>>11),I=y+(w^(E|~P))+A[8]+1873313359&4294967295,y=E+(I<<6&4294967295|I>>>26),I=P+(E^(y|~w))+A[15]+4264355552&4294967295,P=y+(I<<10&4294967295|I>>>22),I=w+(y^(P|~E))+A[6]+2734768916&4294967295,w=P+(I<<15&4294967295|I>>>17),I=E+(P^(w|~y))+A[13]+1309151649&4294967295,E=w+(I<<21&4294967295|I>>>11),I=y+(w^(E|~P))+A[4]+4149444226&4294967295,y=E+(I<<6&4294967295|I>>>26),I=P+(E^(y|~w))+A[11]+3174756917&4294967295,P=y+(I<<10&4294967295|I>>>22),I=w+(y^(P|~E))+A[2]+718787259&4294967295,w=P+(I<<15&4294967295|I>>>17),I=E+(P^(w|~y))+A[9]+3951481745&4294967295,T.g[0]=T.g[0]+y&4294967295,T.g[1]=T.g[1]+(w+(I<<21&4294967295|I>>>11))&4294967295,T.g[2]=T.g[2]+w&4294967295,T.g[3]=T.g[3]+P&4294967295}r.prototype.v=function(T,y){y===void 0&&(y=T.length);const E=y-this.blockSize,A=this.C;let w=this.h,P=0;for(;P<y;){if(w==0)for(;P<=E;)s(this,T,P),P+=this.blockSize;if(typeof T=="string"){for(;P<y;)if(A[w++]=T.charCodeAt(P++),w==this.blockSize){s(this,A),w=0;break}}else for(;P<y;)if(A[w++]=T[P++],w==this.blockSize){s(this,A),w=0;break}}this.h=w,this.o+=y},r.prototype.A=function(){var T=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);T[0]=128;for(var y=1;y<T.length-8;++y)T[y]=0;y=this.o*8;for(var E=T.length-8;E<T.length;++E)T[E]=y&255,y/=256;for(this.v(T),T=Array(16),y=0,E=0;E<4;++E)for(let A=0;A<32;A+=8)T[y++]=this.g[E]>>>A&255;return T};function i(T,y){var E=a;return Object.prototype.hasOwnProperty.call(E,T)?E[T]:E[T]=y(T)}function o(T,y){this.h=y;const E=[];let A=!0;for(let w=T.length-1;w>=0;w--){const P=T[w]|0;A&&P==y||(E[w]=P,A=!1)}this.g=E}var a={};function l(T){return-128<=T&&T<128?i(T,function(y){return new o([y|0],y<0?-1:0)}):new o([T|0],T<0?-1:0)}function u(T){if(isNaN(T)||!isFinite(T))return f;if(T<0)return N(u(-T));const y=[];let E=1;for(let A=0;T>=E;A++)y[A]=T/E|0,E*=4294967296;return new o(y,0)}function d(T,y){if(T.length==0)throw Error("number format error: empty string");if(y=y||10,y<2||36<y)throw Error("radix out of range: "+y);if(T.charAt(0)=="-")return N(d(T.substring(1),y));if(T.indexOf("-")>=0)throw Error('number format error: interior "-" character');const E=u(Math.pow(y,8));let A=f;for(let P=0;P<T.length;P+=8){var w=Math.min(8,T.length-P);const I=parseInt(T.substring(P,P+w),y);w<8?(w=u(Math.pow(y,w)),A=A.j(w).add(u(I))):(A=A.j(E),A=A.add(u(I)))}return A}var f=l(0),_=l(1),g=l(16777216);n=o.prototype,n.m=function(){if(C(this))return-N(this).m();let T=0,y=1;for(let E=0;E<this.g.length;E++){const A=this.i(E);T+=(A>=0?A:4294967296+A)*y,y*=4294967296}return T},n.toString=function(T){if(T=T||10,T<2||36<T)throw Error("radix out of range: "+T);if(v(this))return"0";if(C(this))return"-"+N(this).toString(T);const y=u(Math.pow(T,6));var E=this;let A="";for(;;){const w=$(E,y).g;E=V(E,w.j(y));let P=((E.g.length>0?E.g[0]:E.h)>>>0).toString(T);if(E=w,v(E))return P+A;for(;P.length<6;)P="0"+P;A=P+A}},n.i=function(T){return T<0?0:T<this.g.length?this.g[T]:this.h};function v(T){if(T.h!=0)return!1;for(let y=0;y<T.g.length;y++)if(T.g[y]!=0)return!1;return!0}function C(T){return T.h==-1}n.l=function(T){return T=V(this,T),C(T)?-1:v(T)?0:1};function N(T){const y=T.g.length,E=[];for(let A=0;A<y;A++)E[A]=~T.g[A];return new o(E,~T.h).add(_)}n.abs=function(){return C(this)?N(this):this},n.add=function(T){const y=Math.max(this.g.length,T.g.length),E=[];let A=0;for(let w=0;w<=y;w++){let P=A+(this.i(w)&65535)+(T.i(w)&65535),I=(P>>>16)+(this.i(w)>>>16)+(T.i(w)>>>16);A=I>>>16,P&=65535,I&=65535,E[w]=I<<16|P}return new o(E,E[E.length-1]&-2147483648?-1:0)};function V(T,y){return T.add(N(y))}n.j=function(T){if(v(this)||v(T))return f;if(C(this))return C(T)?N(this).j(N(T)):N(N(this).j(T));if(C(T))return N(this.j(N(T)));if(this.l(g)<0&&T.l(g)<0)return u(this.m()*T.m());const y=this.g.length+T.g.length,E=[];for(var A=0;A<2*y;A++)E[A]=0;for(A=0;A<this.g.length;A++)for(let w=0;w<T.g.length;w++){const P=this.i(A)>>>16,I=this.i(A)&65535,rt=T.i(w)>>>16,Qn=T.i(w)&65535;E[2*A+2*w]+=I*Qn,B(E,2*A+2*w),E[2*A+2*w+1]+=P*Qn,B(E,2*A+2*w+1),E[2*A+2*w+1]+=I*rt,B(E,2*A+2*w+1),E[2*A+2*w+2]+=P*rt,B(E,2*A+2*w+2)}for(T=0;T<y;T++)E[T]=E[2*T+1]<<16|E[2*T];for(T=y;T<2*y;T++)E[T]=0;return new o(E,0)};function B(T,y){for(;(T[y]&65535)!=T[y];)T[y+1]+=T[y]>>>16,T[y]&=65535,y++}function U(T,y){this.g=T,this.h=y}function $(T,y){if(v(y))throw Error("division by zero");if(v(T))return new U(f,f);if(C(T))return y=$(N(T),y),new U(N(y.g),N(y.h));if(C(y))return y=$(T,N(y)),new U(N(y.g),y.h);if(T.g.length>30){if(C(T)||C(y))throw Error("slowDivide_ only works with positive integers.");for(var E=_,A=y;A.l(T)<=0;)E=se(E),A=se(A);var w=Q(E,1),P=Q(A,1);for(A=Q(A,2),E=Q(E,2);!v(A);){var I=P.add(A);I.l(T)<=0&&(w=w.add(E),P=I),A=Q(A,1),E=Q(E,1)}return y=V(T,w.j(y)),new U(w,y)}for(w=f;T.l(y)>=0;){for(E=Math.max(1,Math.floor(T.m()/y.m())),A=Math.ceil(Math.log(E)/Math.LN2),A=A<=48?1:Math.pow(2,A-48),P=u(E),I=P.j(y);C(I)||I.l(T)>0;)E-=A,P=u(E),I=P.j(y);v(P)&&(P=_),w=w.add(P),T=V(T,I)}return new U(w,T)}n.B=function(T){return $(this,T).h},n.and=function(T){const y=Math.max(this.g.length,T.g.length),E=[];for(let A=0;A<y;A++)E[A]=this.i(A)&T.i(A);return new o(E,this.h&T.h)},n.or=function(T){const y=Math.max(this.g.length,T.g.length),E=[];for(let A=0;A<y;A++)E[A]=this.i(A)|T.i(A);return new o(E,this.h|T.h)},n.xor=function(T){const y=Math.max(this.g.length,T.g.length),E=[];for(let A=0;A<y;A++)E[A]=this.i(A)^T.i(A);return new o(E,this.h^T.h)};function se(T){const y=T.g.length+1,E=[];for(let A=0;A<y;A++)E[A]=T.i(A)<<1|T.i(A-1)>>>31;return new o(E,T.h)}function Q(T,y){const E=y>>5;y%=32;const A=T.g.length-E,w=[];for(let P=0;P<A;P++)w[P]=y>0?T.i(P+E)>>>y|T.i(P+E+1)<<32-y:T.i(P+E);return new o(w,T.h)}r.prototype.digest=r.prototype.A,r.prototype.reset=r.prototype.u,r.prototype.update=r.prototype.v,qm=r,o.prototype.add=o.prototype.add,o.prototype.multiply=o.prototype.j,o.prototype.modulo=o.prototype.B,o.prototype.compare=o.prototype.l,o.prototype.toNumber=o.prototype.m,o.prototype.toString=o.prototype.toString,o.prototype.getBits=o.prototype.i,o.fromNumber=u,o.fromString=d,bn=o}).apply(typeof sp<"u"?sp:typeof self<"u"?self:typeof window<"u"?window:{});var ra=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Gm,vi,zm,ma,nu,$m,jm,Wm;(function(){var n,e=Object.defineProperty;function t(c){c=[typeof globalThis=="object"&&globalThis,c,typeof window=="object"&&window,typeof self=="object"&&self,typeof ra=="object"&&ra];for(var h=0;h<c.length;++h){var p=c[h];if(p&&p.Math==Math)return p}throw Error("Cannot find global object")}var r=t(this);function s(c,h){if(h)e:{var p=r;c=c.split(".");for(var m=0;m<c.length-1;m++){var R=c[m];if(!(R in p))break e;p=p[R]}c=c[c.length-1],m=p[c],h=h(m),h!=m&&h!=null&&e(p,c,{configurable:!0,writable:!0,value:h})}}s("Symbol.dispose",function(c){return c||Symbol("Symbol.dispose")}),s("Array.prototype.values",function(c){return c||function(){return this[Symbol.iterator]()}}),s("Object.entries",function(c){return c||function(h){var p=[],m;for(m in h)Object.prototype.hasOwnProperty.call(h,m)&&p.push([m,h[m]]);return p}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var i=i||{},o=this||self;function a(c){var h=typeof c;return h=="object"&&c!=null||h=="function"}function l(c,h,p){return c.call.apply(c.bind,arguments)}function u(c,h,p){return u=l,u.apply(null,arguments)}function d(c,h){var p=Array.prototype.slice.call(arguments,1);return function(){var m=p.slice();return m.push.apply(m,arguments),c.apply(this,m)}}function f(c,h){function p(){}p.prototype=h.prototype,c.Z=h.prototype,c.prototype=new p,c.prototype.constructor=c,c.Ob=function(m,R,k){for(var F=Array(arguments.length-2),H=2;H<arguments.length;H++)F[H-2]=arguments[H];return h.prototype[R].apply(m,F)}}var _=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?c=>c&&AsyncContext.Snapshot.wrap(c):c=>c;function g(c){const h=c.length;if(h>0){const p=Array(h);for(let m=0;m<h;m++)p[m]=c[m];return p}return[]}function v(c,h){for(let m=1;m<arguments.length;m++){const R=arguments[m];var p=typeof R;if(p=p!="object"?p:R?Array.isArray(R)?"array":p:"null",p=="array"||p=="object"&&typeof R.length=="number"){p=c.length||0;const k=R.length||0;c.length=p+k;for(let F=0;F<k;F++)c[p+F]=R[F]}else c.push(R)}}class C{constructor(h,p){this.i=h,this.j=p,this.h=0,this.g=null}get(){let h;return this.h>0?(this.h--,h=this.g,this.g=h.next,h.next=null):h=this.i(),h}}function N(c){o.setTimeout(()=>{throw c},0)}function V(){var c=T;let h=null;return c.g&&(h=c.g,c.g=c.g.next,c.g||(c.h=null),h.next=null),h}class B{constructor(){this.h=this.g=null}add(h,p){const m=U.get();m.set(h,p),this.h?this.h.next=m:this.g=m,this.h=m}}var U=new C(()=>new $,c=>c.reset());class ${constructor(){this.next=this.g=this.h=null}set(h,p){this.h=h,this.g=p,this.next=null}reset(){this.next=this.g=this.h=null}}let se,Q=!1,T=new B,y=()=>{const c=Promise.resolve(void 0);se=()=>{c.then(E)}};function E(){for(var c;c=V();){try{c.h.call(c.g)}catch(p){N(p)}var h=U;h.j(c),h.h<100&&(h.h++,c.next=h.g,h.g=c)}Q=!1}function A(){this.u=this.u,this.C=this.C}A.prototype.u=!1,A.prototype.dispose=function(){this.u||(this.u=!0,this.N())},A.prototype[Symbol.dispose]=function(){this.dispose()},A.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function w(c,h){this.type=c,this.g=this.target=h,this.defaultPrevented=!1}w.prototype.h=function(){this.defaultPrevented=!0};var P=(function(){if(!o.addEventListener||!Object.defineProperty)return!1;var c=!1,h=Object.defineProperty({},"passive",{get:function(){c=!0}});try{const p=()=>{};o.addEventListener("test",p,h),o.removeEventListener("test",p,h)}catch{}return c})();function I(c){return/^[\s\xa0]*$/.test(c)}function rt(c,h){w.call(this,c?c.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,c&&this.init(c,h)}f(rt,w),rt.prototype.init=function(c,h){const p=this.type=c.type,m=c.changedTouches&&c.changedTouches.length?c.changedTouches[0]:null;this.target=c.target||c.srcElement,this.g=h,h=c.relatedTarget,h||(p=="mouseover"?h=c.fromElement:p=="mouseout"&&(h=c.toElement)),this.relatedTarget=h,m?(this.clientX=m.clientX!==void 0?m.clientX:m.pageX,this.clientY=m.clientY!==void 0?m.clientY:m.pageY,this.screenX=m.screenX||0,this.screenY=m.screenY||0):(this.clientX=c.clientX!==void 0?c.clientX:c.pageX,this.clientY=c.clientY!==void 0?c.clientY:c.pageY,this.screenX=c.screenX||0,this.screenY=c.screenY||0),this.button=c.button,this.key=c.key||"",this.ctrlKey=c.ctrlKey,this.altKey=c.altKey,this.shiftKey=c.shiftKey,this.metaKey=c.metaKey,this.pointerId=c.pointerId||0,this.pointerType=c.pointerType,this.state=c.state,this.i=c,c.defaultPrevented&&rt.Z.h.call(this)},rt.prototype.h=function(){rt.Z.h.call(this);const c=this.i;c.preventDefault?c.preventDefault():c.returnValue=!1};var Qn="closure_listenable_"+(Math.random()*1e6|0),CT=0;function PT(c,h,p,m,R){this.listener=c,this.proxy=null,this.src=h,this.type=p,this.capture=!!m,this.ha=R,this.key=++CT,this.da=this.fa=!1}function Go(c){c.da=!0,c.listener=null,c.proxy=null,c.src=null,c.ha=null}function zo(c,h,p){for(const m in c)h.call(p,c[m],m,c)}function NT(c,h){for(const p in c)h.call(void 0,c[p],p,c)}function Hd(c){const h={};for(const p in c)h[p]=c[p];return h}const Qd="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function Yd(c,h){let p,m;for(let R=1;R<arguments.length;R++){m=arguments[R];for(p in m)c[p]=m[p];for(let k=0;k<Qd.length;k++)p=Qd[k],Object.prototype.hasOwnProperty.call(m,p)&&(c[p]=m[p])}}function $o(c){this.src=c,this.g={},this.h=0}$o.prototype.add=function(c,h,p,m,R){const k=c.toString();c=this.g[k],c||(c=this.g[k]=[],this.h++);const F=cl(c,h,m,R);return F>-1?(h=c[F],p||(h.fa=!1)):(h=new PT(h,this.src,k,!!m,R),h.fa=p,c.push(h)),h};function al(c,h){const p=h.type;if(p in c.g){var m=c.g[p],R=Array.prototype.indexOf.call(m,h,void 0),k;(k=R>=0)&&Array.prototype.splice.call(m,R,1),k&&(Go(h),c.g[p].length==0&&(delete c.g[p],c.h--))}}function cl(c,h,p,m){for(let R=0;R<c.length;++R){const k=c[R];if(!k.da&&k.listener==h&&k.capture==!!p&&k.ha==m)return R}return-1}var ll="closure_lm_"+(Math.random()*1e6|0),ul={};function Jd(c,h,p,m,R){if(Array.isArray(h)){for(let k=0;k<h.length;k++)Jd(c,h[k],p,m,R);return null}return p=ef(p),c&&c[Qn]?c.J(h,p,a(m)?!!m.capture:!1,R):kT(c,h,p,!1,m,R)}function kT(c,h,p,m,R,k){if(!h)throw Error("Invalid event type");const F=a(R)?!!R.capture:!!R;let H=dl(c);if(H||(c[ll]=H=new $o(c)),p=H.add(h,p,m,F,k),p.proxy)return p;if(m=DT(),p.proxy=m,m.src=c,m.listener=p,c.addEventListener)P||(R=F),R===void 0&&(R=!1),c.addEventListener(h.toString(),m,R);else if(c.attachEvent)c.attachEvent(Zd(h.toString()),m);else if(c.addListener&&c.removeListener)c.addListener(m);else throw Error("addEventListener and attachEvent are unavailable.");return p}function DT(){function c(p){return h.call(c.src,c.listener,p)}const h=xT;return c}function Xd(c,h,p,m,R){if(Array.isArray(h))for(var k=0;k<h.length;k++)Xd(c,h[k],p,m,R);else m=a(m)?!!m.capture:!!m,p=ef(p),c&&c[Qn]?(c=c.i,k=String(h).toString(),k in c.g&&(h=c.g[k],p=cl(h,p,m,R),p>-1&&(Go(h[p]),Array.prototype.splice.call(h,p,1),h.length==0&&(delete c.g[k],c.h--)))):c&&(c=dl(c))&&(h=c.g[h.toString()],c=-1,h&&(c=cl(h,p,m,R)),(p=c>-1?h[c]:null)&&hl(p))}function hl(c){if(typeof c!="number"&&c&&!c.da){var h=c.src;if(h&&h[Qn])al(h.i,c);else{var p=c.type,m=c.proxy;h.removeEventListener?h.removeEventListener(p,m,c.capture):h.detachEvent?h.detachEvent(Zd(p),m):h.addListener&&h.removeListener&&h.removeListener(m),(p=dl(h))?(al(p,c),p.h==0&&(p.src=null,h[ll]=null)):Go(c)}}}function Zd(c){return c in ul?ul[c]:ul[c]="on"+c}function xT(c,h){if(c.da)c=!0;else{h=new rt(h,this);const p=c.listener,m=c.ha||c.src;c.fa&&hl(c),c=p.call(m,h)}return c}function dl(c){return c=c[ll],c instanceof $o?c:null}var fl="__closure_events_fn_"+(Math.random()*1e9>>>0);function ef(c){return typeof c=="function"?c:(c[fl]||(c[fl]=function(h){return c.handleEvent(h)}),c[fl])}function Ke(){A.call(this),this.i=new $o(this),this.M=this,this.G=null}f(Ke,A),Ke.prototype[Qn]=!0,Ke.prototype.removeEventListener=function(c,h,p,m){Xd(this,c,h,p,m)};function Ze(c,h){var p,m=c.G;if(m)for(p=[];m;m=m.G)p.push(m);if(c=c.M,m=h.type||h,typeof h=="string")h=new w(h,c);else if(h instanceof w)h.target=h.target||c;else{var R=h;h=new w(m,c),Yd(h,R)}R=!0;let k,F;if(p)for(F=p.length-1;F>=0;F--)k=h.g=p[F],R=jo(k,m,!0,h)&&R;if(k=h.g=c,R=jo(k,m,!0,h)&&R,R=jo(k,m,!1,h)&&R,p)for(F=0;F<p.length;F++)k=h.g=p[F],R=jo(k,m,!1,h)&&R}Ke.prototype.N=function(){if(Ke.Z.N.call(this),this.i){var c=this.i;for(const h in c.g){const p=c.g[h];for(let m=0;m<p.length;m++)Go(p[m]);delete c.g[h],c.h--}}this.G=null},Ke.prototype.J=function(c,h,p,m){return this.i.add(String(c),h,!1,p,m)},Ke.prototype.K=function(c,h,p,m){return this.i.add(String(c),h,!0,p,m)};function jo(c,h,p,m){if(h=c.i.g[String(h)],!h)return!0;h=h.concat();let R=!0;for(let k=0;k<h.length;++k){const F=h[k];if(F&&!F.da&&F.capture==p){const H=F.listener,Oe=F.ha||F.src;F.fa&&al(c.i,F),R=H.call(Oe,m)!==!1&&R}}return R&&!m.defaultPrevented}function VT(c,h){if(typeof c!="function")if(c&&typeof c.handleEvent=="function")c=u(c.handleEvent,c);else throw Error("Invalid listener argument");return Number(h)>2147483647?-1:o.setTimeout(c,h||0)}function tf(c){c.g=VT(()=>{c.g=null,c.i&&(c.i=!1,tf(c))},c.l);const h=c.h;c.h=null,c.m.apply(null,h)}class OT extends A{constructor(h,p){super(),this.m=h,this.l=p,this.h=null,this.i=!1,this.g=null}j(h){this.h=arguments,this.g?this.i=!0:tf(this)}N(){super.N(),this.g&&(o.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function Js(c){A.call(this),this.h=c,this.g={}}f(Js,A);var nf=[];function rf(c){zo(c.g,function(h,p){this.g.hasOwnProperty(p)&&hl(h)},c),c.g={}}Js.prototype.N=function(){Js.Z.N.call(this),rf(this)},Js.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var pl=o.JSON.stringify,MT=o.JSON.parse,LT=class{stringify(c){return o.JSON.stringify(c,void 0)}parse(c){return o.JSON.parse(c,void 0)}};function sf(){}function of(){}var Xs={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function _l(){w.call(this,"d")}f(_l,w);function ml(){w.call(this,"c")}f(ml,w);var Yn={},af=null;function Wo(){return af=af||new Ke}Yn.Ia="serverreachability";function cf(c){w.call(this,Yn.Ia,c)}f(cf,w);function Zs(c){const h=Wo();Ze(h,new cf(h))}Yn.STAT_EVENT="statevent";function lf(c,h){w.call(this,Yn.STAT_EVENT,c),this.stat=h}f(lf,w);function et(c){const h=Wo();Ze(h,new lf(h,c))}Yn.Ja="timingevent";function uf(c,h){w.call(this,Yn.Ja,c),this.size=h}f(uf,w);function ei(c,h){if(typeof c!="function")throw Error("Fn must not be null and must be a function");return o.setTimeout(function(){c()},h)}function ti(){this.g=!0}ti.prototype.ua=function(){this.g=!1};function FT(c,h,p,m,R,k){c.info(function(){if(c.g)if(k){var F="",H=k.split("&");for(let pe=0;pe<H.length;pe++){var Oe=H[pe].split("=");if(Oe.length>1){const Ue=Oe[0];Oe=Oe[1];const Nt=Ue.split("_");F=Nt.length>=2&&Nt[1]=="type"?F+(Ue+"="+Oe+"&"):F+(Ue+"=redacted&")}}}else F=null;else F=k;return"XMLHTTP REQ ("+m+") [attempt "+R+"]: "+h+`
`+p+`
`+F})}function UT(c,h,p,m,R,k,F){c.info(function(){return"XMLHTTP RESP ("+m+") [ attempt "+R+"]: "+h+`
`+p+`
`+k+" "+F})}function Fr(c,h,p,m){c.info(function(){return"XMLHTTP TEXT ("+h+"): "+qT(c,p)+(m?" "+m:"")})}function BT(c,h){c.info(function(){return"TIMEOUT: "+h})}ti.prototype.info=function(){};function qT(c,h){if(!c.g)return h;if(!h)return null;try{const k=JSON.parse(h);if(k){for(c=0;c<k.length;c++)if(Array.isArray(k[c])){var p=k[c];if(!(p.length<2)){var m=p[1];if(Array.isArray(m)&&!(m.length<1)){var R=m[0];if(R!="noop"&&R!="stop"&&R!="close")for(let F=1;F<m.length;F++)m[F]=""}}}}return pl(k)}catch{return h}}var Ko={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},hf={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},df;function gl(){}f(gl,sf),gl.prototype.g=function(){return new XMLHttpRequest},df=new gl;function ni(c){return encodeURIComponent(String(c))}function GT(c){var h=1;c=c.split(":");const p=[];for(;h>0&&c.length;)p.push(c.shift()),h--;return c.length&&p.push(c.join(":")),p}function ln(c,h,p,m){this.j=c,this.i=h,this.l=p,this.S=m||1,this.V=new Js(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new ff}function ff(){this.i=null,this.g="",this.h=!1}var pf={},yl={};function Il(c,h,p){c.M=1,c.A=Qo(Pt(h)),c.u=p,c.R=!0,_f(c,null)}function _f(c,h){c.F=Date.now(),Ho(c),c.B=Pt(c.A);var p=c.B,m=c.S;Array.isArray(m)||(m=[String(m)]),Cf(p.i,"t",m),c.C=0,p=c.j.L,c.h=new ff,c.g=Wf(c.j,p?h:null,!c.u),c.P>0&&(c.O=new OT(u(c.Y,c,c.g),c.P)),h=c.V,p=c.g,m=c.ba;var R="readystatechange";Array.isArray(R)||(R&&(nf[0]=R.toString()),R=nf);for(let k=0;k<R.length;k++){const F=Jd(p,R[k],m||h.handleEvent,!1,h.h||h);if(!F)break;h.g[F.key]=F}h=c.J?Hd(c.J):{},c.u?(c.v||(c.v="POST"),h["Content-Type"]="application/x-www-form-urlencoded",c.g.ea(c.B,c.v,c.u,h)):(c.v="GET",c.g.ea(c.B,c.v,null,h)),Zs(),FT(c.i,c.v,c.B,c.l,c.S,c.u)}ln.prototype.ba=function(c){c=c.target;const h=this.O;h&&dn(c)==3?h.j():this.Y(c)},ln.prototype.Y=function(c){try{if(c==this.g)e:{const H=dn(this.g),Oe=this.g.ya(),pe=this.g.ca();if(!(H<3)&&(H!=3||this.g&&(this.h.h||this.g.la()||Of(this.g)))){this.K||H!=4||Oe==7||(Oe==8||pe<=0?Zs(3):Zs(2)),El(this);var h=this.g.ca();this.X=h;var p=zT(this);if(this.o=h==200,UT(this.i,this.v,this.B,this.l,this.S,H,h),this.o){if(this.U&&!this.L){t:{if(this.g){var m,R=this.g;if((m=R.g?R.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!I(m)){var k=m;break t}}k=null}if(c=k)Fr(this.i,this.l,c,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,Tl(this,c);else{this.o=!1,this.m=3,et(12),Jn(this),ri(this);break e}}if(this.R){c=!0;let Ue;for(;!this.K&&this.C<p.length;)if(Ue=$T(this,p),Ue==yl){H==4&&(this.m=4,et(14),c=!1),Fr(this.i,this.l,null,"[Incomplete Response]");break}else if(Ue==pf){this.m=4,et(15),Fr(this.i,this.l,p,"[Invalid Chunk]"),c=!1;break}else Fr(this.i,this.l,Ue,null),Tl(this,Ue);if(mf(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),H!=4||p.length!=0||this.h.h||(this.m=1,et(16),c=!1),this.o=this.o&&c,!c)Fr(this.i,this.l,p,"[Invalid Chunked Response]"),Jn(this),ri(this);else if(p.length>0&&!this.W){this.W=!0;var F=this.j;F.g==this&&F.aa&&!F.P&&(F.j.info("Great, no buffering proxy detected. Bytes received: "+p.length),Pl(F),F.P=!0,et(11))}}else Fr(this.i,this.l,p,null),Tl(this,p);H==4&&Jn(this),this.o&&!this.K&&(H==4?Gf(this.j,this):(this.o=!1,Ho(this)))}else sw(this.g),h==400&&p.indexOf("Unknown SID")>0?(this.m=3,et(12)):(this.m=0,et(13)),Jn(this),ri(this)}}}catch{}finally{}};function zT(c){if(!mf(c))return c.g.la();const h=Of(c.g);if(h==="")return"";let p="";const m=h.length,R=dn(c.g)==4;if(!c.h.i){if(typeof TextDecoder>"u")return Jn(c),ri(c),"";c.h.i=new o.TextDecoder}for(let k=0;k<m;k++)c.h.h=!0,p+=c.h.i.decode(h[k],{stream:!(R&&k==m-1)});return h.length=0,c.h.g+=p,c.C=0,c.h.g}function mf(c){return c.g?c.v=="GET"&&c.M!=2&&c.j.Aa:!1}function $T(c,h){var p=c.C,m=h.indexOf(`
`,p);return m==-1?yl:(p=Number(h.substring(p,m)),isNaN(p)?pf:(m+=1,m+p>h.length?yl:(h=h.slice(m,m+p),c.C=m+p,h)))}ln.prototype.cancel=function(){this.K=!0,Jn(this)};function Ho(c){c.T=Date.now()+c.H,gf(c,c.H)}function gf(c,h){if(c.D!=null)throw Error("WatchDog timer not null");c.D=ei(u(c.aa,c),h)}function El(c){c.D&&(o.clearTimeout(c.D),c.D=null)}ln.prototype.aa=function(){this.D=null;const c=Date.now();c-this.T>=0?(BT(this.i,this.B),this.M!=2&&(Zs(),et(17)),Jn(this),this.m=2,ri(this)):gf(this,this.T-c)};function ri(c){c.j.I==0||c.K||Gf(c.j,c)}function Jn(c){El(c);var h=c.O;h&&typeof h.dispose=="function"&&h.dispose(),c.O=null,rf(c.V),c.g&&(h=c.g,c.g=null,h.abort(),h.dispose())}function Tl(c,h){try{var p=c.j;if(p.I!=0&&(p.g==c||wl(p.h,c))){if(!c.L&&wl(p.h,c)&&p.I==3){try{var m=p.Ba.g.parse(h)}catch{m=null}if(Array.isArray(m)&&m.length==3){var R=m;if(R[0]==0){e:if(!p.v){if(p.g)if(p.g.F+3e3<c.F)ea(p),Xo(p);else break e;Cl(p),et(18)}}else p.xa=R[1],0<p.xa-p.K&&R[2]<37500&&p.F&&p.A==0&&!p.C&&(p.C=ei(u(p.Va,p),6e3));Ef(p.h)<=1&&p.ta&&(p.ta=void 0)}else Zn(p,11)}else if((c.L||p.g==c)&&ea(p),!I(h))for(R=p.Ba.g.parse(h),h=0;h<R.length;h++){let pe=R[h];const Ue=pe[0];if(!(Ue<=p.K))if(p.K=Ue,pe=pe[1],p.I==2)if(pe[0]=="c"){p.M=pe[1],p.ba=pe[2];const Nt=pe[3];Nt!=null&&(p.ka=Nt,p.j.info("VER="+p.ka));const er=pe[4];er!=null&&(p.za=er,p.j.info("SVER="+p.za));const fn=pe[5];fn!=null&&typeof fn=="number"&&fn>0&&(m=1.5*fn,p.O=m,p.j.info("backChannelRequestTimeoutMs_="+m)),m=p;const pn=c.g;if(pn){const na=pn.g?pn.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(na){var k=m.h;k.g||na.indexOf("spdy")==-1&&na.indexOf("quic")==-1&&na.indexOf("h2")==-1||(k.j=k.l,k.g=new Set,k.h&&(vl(k,k.h),k.h=null))}if(m.G){const Nl=pn.g?pn.g.getResponseHeader("X-HTTP-Session-Id"):null;Nl&&(m.wa=Nl,me(m.J,m.G,Nl))}}p.I=3,p.l&&p.l.ra(),p.aa&&(p.T=Date.now()-c.F,p.j.info("Handshake RTT: "+p.T+"ms")),m=p;var F=c;if(m.na=jf(m,m.L?m.ba:null,m.W),F.L){Tf(m.h,F);var H=F,Oe=m.O;Oe&&(H.H=Oe),H.D&&(El(H),Ho(H)),m.g=F}else Bf(m);p.i.length>0&&Zo(p)}else pe[0]!="stop"&&pe[0]!="close"||Zn(p,7);else p.I==3&&(pe[0]=="stop"||pe[0]=="close"?pe[0]=="stop"?Zn(p,7):Sl(p):pe[0]!="noop"&&p.l&&p.l.qa(pe),p.A=0)}}Zs(4)}catch{}}var jT=class{constructor(c,h){this.g=c,this.map=h}};function yf(c){this.l=c||10,o.PerformanceNavigationTiming?(c=o.performance.getEntriesByType("navigation"),c=c.length>0&&(c[0].nextHopProtocol=="hq"||c[0].nextHopProtocol=="h2")):c=!!(o.chrome&&o.chrome.loadTimes&&o.chrome.loadTimes()&&o.chrome.loadTimes().wasFetchedViaSpdy),this.j=c?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function If(c){return c.h?!0:c.g?c.g.size>=c.j:!1}function Ef(c){return c.h?1:c.g?c.g.size:0}function wl(c,h){return c.h?c.h==h:c.g?c.g.has(h):!1}function vl(c,h){c.g?c.g.add(h):c.h=h}function Tf(c,h){c.h&&c.h==h?c.h=null:c.g&&c.g.has(h)&&c.g.delete(h)}yf.prototype.cancel=function(){if(this.i=wf(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const c of this.g.values())c.cancel();this.g.clear()}};function wf(c){if(c.h!=null)return c.i.concat(c.h.G);if(c.g!=null&&c.g.size!==0){let h=c.i;for(const p of c.g.values())h=h.concat(p.G);return h}return g(c.i)}var vf=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function WT(c,h){if(c){c=c.split("&");for(let p=0;p<c.length;p++){const m=c[p].indexOf("=");let R,k=null;m>=0?(R=c[p].substring(0,m),k=c[p].substring(m+1)):R=c[p],h(R,k?decodeURIComponent(k.replace(/\+/g," ")):"")}}}function un(c){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let h;c instanceof un?(this.l=c.l,si(this,c.j),this.o=c.o,this.g=c.g,ii(this,c.u),this.h=c.h,Al(this,Pf(c.i)),this.m=c.m):c&&(h=String(c).match(vf))?(this.l=!1,si(this,h[1]||"",!0),this.o=oi(h[2]||""),this.g=oi(h[3]||"",!0),ii(this,h[4]),this.h=oi(h[5]||"",!0),Al(this,h[6]||"",!0),this.m=oi(h[7]||"")):(this.l=!1,this.i=new ci(null,this.l))}un.prototype.toString=function(){const c=[];var h=this.j;h&&c.push(ai(h,Af,!0),":");var p=this.g;return(p||h=="file")&&(c.push("//"),(h=this.o)&&c.push(ai(h,Af,!0),"@"),c.push(ni(p).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),p=this.u,p!=null&&c.push(":",String(p))),(p=this.h)&&(this.g&&p.charAt(0)!="/"&&c.push("/"),c.push(ai(p,p.charAt(0)=="/"?QT:HT,!0))),(p=this.i.toString())&&c.push("?",p),(p=this.m)&&c.push("#",ai(p,JT)),c.join("")},un.prototype.resolve=function(c){const h=Pt(this);let p=!!c.j;p?si(h,c.j):p=!!c.o,p?h.o=c.o:p=!!c.g,p?h.g=c.g:p=c.u!=null;var m=c.h;if(p)ii(h,c.u);else if(p=!!c.h){if(m.charAt(0)!="/")if(this.g&&!this.h)m="/"+m;else{var R=h.h.lastIndexOf("/");R!=-1&&(m=h.h.slice(0,R+1)+m)}if(R=m,R==".."||R==".")m="";else if(R.indexOf("./")!=-1||R.indexOf("/.")!=-1){m=R.lastIndexOf("/",0)==0,R=R.split("/");const k=[];for(let F=0;F<R.length;){const H=R[F++];H=="."?m&&F==R.length&&k.push(""):H==".."?((k.length>1||k.length==1&&k[0]!="")&&k.pop(),m&&F==R.length&&k.push("")):(k.push(H),m=!0)}m=k.join("/")}else m=R}return p?h.h=m:p=c.i.toString()!=="",p?Al(h,Pf(c.i)):p=!!c.m,p&&(h.m=c.m),h};function Pt(c){return new un(c)}function si(c,h,p){c.j=p?oi(h,!0):h,c.j&&(c.j=c.j.replace(/:$/,""))}function ii(c,h){if(h){if(h=Number(h),isNaN(h)||h<0)throw Error("Bad port number "+h);c.u=h}else c.u=null}function Al(c,h,p){h instanceof ci?(c.i=h,XT(c.i,c.l)):(p||(h=ai(h,YT)),c.i=new ci(h,c.l))}function me(c,h,p){c.i.set(h,p)}function Qo(c){return me(c,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),c}function oi(c,h){return c?h?decodeURI(c.replace(/%25/g,"%2525")):decodeURIComponent(c):""}function ai(c,h,p){return typeof c=="string"?(c=encodeURI(c).replace(h,KT),p&&(c=c.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),c):null}function KT(c){return c=c.charCodeAt(0),"%"+(c>>4&15).toString(16)+(c&15).toString(16)}var Af=/[#\/\?@]/g,HT=/[#\?:]/g,QT=/[#\?]/g,YT=/[#\?@]/g,JT=/#/g;function ci(c,h){this.h=this.g=null,this.i=c||null,this.j=!!h}function Xn(c){c.g||(c.g=new Map,c.h=0,c.i&&WT(c.i,function(h,p){c.add(decodeURIComponent(h.replace(/\+/g," ")),p)}))}n=ci.prototype,n.add=function(c,h){Xn(this),this.i=null,c=Ur(this,c);let p=this.g.get(c);return p||this.g.set(c,p=[]),p.push(h),this.h+=1,this};function bf(c,h){Xn(c),h=Ur(c,h),c.g.has(h)&&(c.i=null,c.h-=c.g.get(h).length,c.g.delete(h))}function Rf(c,h){return Xn(c),h=Ur(c,h),c.g.has(h)}n.forEach=function(c,h){Xn(this),this.g.forEach(function(p,m){p.forEach(function(R){c.call(h,R,m,this)},this)},this)};function Sf(c,h){Xn(c);let p=[];if(typeof h=="string")Rf(c,h)&&(p=p.concat(c.g.get(Ur(c,h))));else for(c=Array.from(c.g.values()),h=0;h<c.length;h++)p=p.concat(c[h]);return p}n.set=function(c,h){return Xn(this),this.i=null,c=Ur(this,c),Rf(this,c)&&(this.h-=this.g.get(c).length),this.g.set(c,[h]),this.h+=1,this},n.get=function(c,h){return c?(c=Sf(this,c),c.length>0?String(c[0]):h):h};function Cf(c,h,p){bf(c,h),p.length>0&&(c.i=null,c.g.set(Ur(c,h),g(p)),c.h+=p.length)}n.toString=function(){if(this.i)return this.i;if(!this.g)return"";const c=[],h=Array.from(this.g.keys());for(let m=0;m<h.length;m++){var p=h[m];const R=ni(p);p=Sf(this,p);for(let k=0;k<p.length;k++){let F=R;p[k]!==""&&(F+="="+ni(p[k])),c.push(F)}}return this.i=c.join("&")};function Pf(c){const h=new ci;return h.i=c.i,c.g&&(h.g=new Map(c.g),h.h=c.h),h}function Ur(c,h){return h=String(h),c.j&&(h=h.toLowerCase()),h}function XT(c,h){h&&!c.j&&(Xn(c),c.i=null,c.g.forEach(function(p,m){const R=m.toLowerCase();m!=R&&(bf(this,m),Cf(this,R,p))},c)),c.j=h}function ZT(c,h){const p=new ti;if(o.Image){const m=new Image;m.onload=d(hn,p,"TestLoadImage: loaded",!0,h,m),m.onerror=d(hn,p,"TestLoadImage: error",!1,h,m),m.onabort=d(hn,p,"TestLoadImage: abort",!1,h,m),m.ontimeout=d(hn,p,"TestLoadImage: timeout",!1,h,m),o.setTimeout(function(){m.ontimeout&&m.ontimeout()},1e4),m.src=c}else h(!1)}function ew(c,h){const p=new ti,m=new AbortController,R=setTimeout(()=>{m.abort(),hn(p,"TestPingServer: timeout",!1,h)},1e4);fetch(c,{signal:m.signal}).then(k=>{clearTimeout(R),k.ok?hn(p,"TestPingServer: ok",!0,h):hn(p,"TestPingServer: server error",!1,h)}).catch(()=>{clearTimeout(R),hn(p,"TestPingServer: error",!1,h)})}function hn(c,h,p,m,R){try{R&&(R.onload=null,R.onerror=null,R.onabort=null,R.ontimeout=null),m(p)}catch{}}function tw(){this.g=new LT}function bl(c){this.i=c.Sb||null,this.h=c.ab||!1}f(bl,sf),bl.prototype.g=function(){return new Yo(this.i,this.h)};function Yo(c,h){Ke.call(this),this.H=c,this.o=h,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}f(Yo,Ke),n=Yo.prototype,n.open=function(c,h){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=c,this.D=h,this.readyState=1,ui(this)},n.send=function(c){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const h={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};c&&(h.body=c),(this.H||o).fetch(new Request(this.D,h)).then(this.Pa.bind(this),this.ga.bind(this))},n.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,li(this)),this.readyState=0},n.Pa=function(c){if(this.g&&(this.l=c,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=c.headers,this.readyState=2,ui(this)),this.g&&(this.readyState=3,ui(this),this.g)))if(this.responseType==="arraybuffer")c.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof o.ReadableStream<"u"&&"body"in c){if(this.j=c.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;Nf(this)}else c.text().then(this.Oa.bind(this),this.ga.bind(this))};function Nf(c){c.j.read().then(c.Ma.bind(c)).catch(c.ga.bind(c))}n.Ma=function(c){if(this.g){if(this.o&&c.value)this.response.push(c.value);else if(!this.o){var h=c.value?c.value:new Uint8Array(0);(h=this.B.decode(h,{stream:!c.done}))&&(this.response=this.responseText+=h)}c.done?li(this):ui(this),this.readyState==3&&Nf(this)}},n.Oa=function(c){this.g&&(this.response=this.responseText=c,li(this))},n.Na=function(c){this.g&&(this.response=c,li(this))},n.ga=function(){this.g&&li(this)};function li(c){c.readyState=4,c.l=null,c.j=null,c.B=null,ui(c)}n.setRequestHeader=function(c,h){this.A.append(c,h)},n.getResponseHeader=function(c){return this.h&&this.h.get(c.toLowerCase())||""},n.getAllResponseHeaders=function(){if(!this.h)return"";const c=[],h=this.h.entries();for(var p=h.next();!p.done;)p=p.value,c.push(p[0]+": "+p[1]),p=h.next();return c.join(`\r
`)};function ui(c){c.onreadystatechange&&c.onreadystatechange.call(c)}Object.defineProperty(Yo.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(c){this.m=c?"include":"same-origin"}});function kf(c){let h="";return zo(c,function(p,m){h+=m,h+=":",h+=p,h+=`\r
`}),h}function Rl(c,h,p){e:{for(m in p){var m=!1;break e}m=!0}m||(p=kf(p),typeof c=="string"?p!=null&&ni(p):me(c,h,p))}function Re(c){Ke.call(this),this.headers=new Map,this.L=c||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}f(Re,Ke);var nw=/^https?$/i,rw=["POST","PUT"];n=Re.prototype,n.Fa=function(c){this.H=c},n.ea=function(c,h,p,m){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+c);h=h?h.toUpperCase():"GET",this.D=c,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():df.g(),this.g.onreadystatechange=_(u(this.Ca,this));try{this.B=!0,this.g.open(h,String(c),!0),this.B=!1}catch(k){Df(this,k);return}if(c=p||"",p=new Map(this.headers),m)if(Object.getPrototypeOf(m)===Object.prototype)for(var R in m)p.set(R,m[R]);else if(typeof m.keys=="function"&&typeof m.get=="function")for(const k of m.keys())p.set(k,m.get(k));else throw Error("Unknown input type for opt_headers: "+String(m));m=Array.from(p.keys()).find(k=>k.toLowerCase()=="content-type"),R=o.FormData&&c instanceof o.FormData,!(Array.prototype.indexOf.call(rw,h,void 0)>=0)||m||R||p.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[k,F]of p)this.g.setRequestHeader(k,F);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(c),this.v=!1}catch(k){Df(this,k)}};function Df(c,h){c.h=!1,c.g&&(c.j=!0,c.g.abort(),c.j=!1),c.l=h,c.o=5,xf(c),Jo(c)}function xf(c){c.A||(c.A=!0,Ze(c,"complete"),Ze(c,"error"))}n.abort=function(c){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=c||7,Ze(this,"complete"),Ze(this,"abort"),Jo(this))},n.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),Jo(this,!0)),Re.Z.N.call(this)},n.Ca=function(){this.u||(this.B||this.v||this.j?Vf(this):this.Xa())},n.Xa=function(){Vf(this)};function Vf(c){if(c.h&&typeof i<"u"){if(c.v&&dn(c)==4)setTimeout(c.Ca.bind(c),0);else if(Ze(c,"readystatechange"),dn(c)==4){c.h=!1;try{const k=c.ca();e:switch(k){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var h=!0;break e;default:h=!1}var p;if(!(p=h)){var m;if(m=k===0){let F=String(c.D).match(vf)[1]||null;!F&&o.self&&o.self.location&&(F=o.self.location.protocol.slice(0,-1)),m=!nw.test(F?F.toLowerCase():"")}p=m}if(p)Ze(c,"complete"),Ze(c,"success");else{c.o=6;try{var R=dn(c)>2?c.g.statusText:""}catch{R=""}c.l=R+" ["+c.ca()+"]",xf(c)}}finally{Jo(c)}}}}function Jo(c,h){if(c.g){c.m&&(clearTimeout(c.m),c.m=null);const p=c.g;c.g=null,h||Ze(c,"ready");try{p.onreadystatechange=null}catch{}}}n.isActive=function(){return!!this.g};function dn(c){return c.g?c.g.readyState:0}n.ca=function(){try{return dn(this)>2?this.g.status:-1}catch{return-1}},n.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},n.La=function(c){if(this.g){var h=this.g.responseText;return c&&h.indexOf(c)==0&&(h=h.substring(c.length)),MT(h)}};function Of(c){try{if(!c.g)return null;if("response"in c.g)return c.g.response;switch(c.F){case"":case"text":return c.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in c.g)return c.g.mozResponseArrayBuffer}return null}catch{return null}}function sw(c){const h={};c=(c.g&&dn(c)>=2&&c.g.getAllResponseHeaders()||"").split(`\r
`);for(let m=0;m<c.length;m++){if(I(c[m]))continue;var p=GT(c[m]);const R=p[0];if(p=p[1],typeof p!="string")continue;p=p.trim();const k=h[R]||[];h[R]=k,k.push(p)}NT(h,function(m){return m.join(", ")})}n.ya=function(){return this.o},n.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function hi(c,h,p){return p&&p.internalChannelParams&&p.internalChannelParams[c]||h}function Mf(c){this.za=0,this.i=[],this.j=new ti,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=hi("failFast",!1,c),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=hi("baseRetryDelayMs",5e3,c),this.Za=hi("retryDelaySeedMs",1e4,c),this.Ta=hi("forwardChannelMaxRetries",2,c),this.va=hi("forwardChannelRequestTimeoutMs",2e4,c),this.ma=c&&c.xmlHttpFactory||void 0,this.Ua=c&&c.Rb||void 0,this.Aa=c&&c.useFetchStreams||!1,this.O=void 0,this.L=c&&c.supportsCrossDomainXhr||!1,this.M="",this.h=new yf(c&&c.concurrentRequestLimit),this.Ba=new tw,this.S=c&&c.fastHandshake||!1,this.R=c&&c.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=c&&c.Pb||!1,c&&c.ua&&this.j.ua(),c&&c.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&c&&c.detectBufferingProxy||!1,this.ia=void 0,c&&c.longPollingTimeout&&c.longPollingTimeout>0&&(this.ia=c.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}n=Mf.prototype,n.ka=8,n.I=1,n.connect=function(c,h,p,m){et(0),this.W=c,this.H=h||{},p&&m!==void 0&&(this.H.OSID=p,this.H.OAID=m),this.F=this.X,this.J=jf(this,null,this.W),Zo(this)};function Sl(c){if(Lf(c),c.I==3){var h=c.V++,p=Pt(c.J);if(me(p,"SID",c.M),me(p,"RID",h),me(p,"TYPE","terminate"),di(c,p),h=new ln(c,c.j,h),h.M=2,h.A=Qo(Pt(p)),p=!1,o.navigator&&o.navigator.sendBeacon)try{p=o.navigator.sendBeacon(h.A.toString(),"")}catch{}!p&&o.Image&&(new Image().src=h.A,p=!0),p||(h.g=Wf(h.j,null),h.g.ea(h.A)),h.F=Date.now(),Ho(h)}$f(c)}function Xo(c){c.g&&(Pl(c),c.g.cancel(),c.g=null)}function Lf(c){Xo(c),c.v&&(o.clearTimeout(c.v),c.v=null),ea(c),c.h.cancel(),c.m&&(typeof c.m=="number"&&o.clearTimeout(c.m),c.m=null)}function Zo(c){if(!If(c.h)&&!c.m){c.m=!0;var h=c.Ea;se||y(),Q||(se(),Q=!0),T.add(h,c),c.D=0}}function iw(c,h){return Ef(c.h)>=c.h.j-(c.m?1:0)?!1:c.m?(c.i=h.G.concat(c.i),!0):c.I==1||c.I==2||c.D>=(c.Sa?0:c.Ta)?!1:(c.m=ei(u(c.Ea,c,h),zf(c,c.D)),c.D++,!0)}n.Ea=function(c){if(this.m)if(this.m=null,this.I==1){if(!c){this.V=Math.floor(Math.random()*1e5),c=this.V++;const R=new ln(this,this.j,c);let k=this.o;if(this.U&&(k?(k=Hd(k),Yd(k,this.U)):k=this.U),this.u!==null||this.R||(R.J=k,k=null),this.S)e:{for(var h=0,p=0;p<this.i.length;p++){t:{var m=this.i[p];if("__data__"in m.map&&(m=m.map.__data__,typeof m=="string")){m=m.length;break t}m=void 0}if(m===void 0)break;if(h+=m,h>4096){h=p;break e}if(h===4096||p===this.i.length-1){h=p+1;break e}}h=1e3}else h=1e3;h=Uf(this,R,h),p=Pt(this.J),me(p,"RID",c),me(p,"CVER",22),this.G&&me(p,"X-HTTP-Session-Id",this.G),di(this,p),k&&(this.R?h="headers="+ni(kf(k))+"&"+h:this.u&&Rl(p,this.u,k)),vl(this.h,R),this.Ra&&me(p,"TYPE","init"),this.S?(me(p,"$req",h),me(p,"SID","null"),R.U=!0,Il(R,p,null)):Il(R,p,h),this.I=2}}else this.I==3&&(c?Ff(this,c):this.i.length==0||If(this.h)||Ff(this))};function Ff(c,h){var p;h?p=h.l:p=c.V++;const m=Pt(c.J);me(m,"SID",c.M),me(m,"RID",p),me(m,"AID",c.K),di(c,m),c.u&&c.o&&Rl(m,c.u,c.o),p=new ln(c,c.j,p,c.D+1),c.u===null&&(p.J=c.o),h&&(c.i=h.G.concat(c.i)),h=Uf(c,p,1e3),p.H=Math.round(c.va*.5)+Math.round(c.va*.5*Math.random()),vl(c.h,p),Il(p,m,h)}function di(c,h){c.H&&zo(c.H,function(p,m){me(h,m,p)}),c.l&&zo({},function(p,m){me(h,m,p)})}function Uf(c,h,p){p=Math.min(c.i.length,p);const m=c.l?u(c.l.Ka,c.l,c):null;e:{var R=c.i;let H=-1;for(;;){const Oe=["count="+p];H==-1?p>0?(H=R[0].g,Oe.push("ofs="+H)):H=0:Oe.push("ofs="+H);let pe=!0;for(let Ue=0;Ue<p;Ue++){var k=R[Ue].g;const Nt=R[Ue].map;if(k-=H,k<0)H=Math.max(0,R[Ue].g-100),pe=!1;else try{k="req"+k+"_"||"";try{var F=Nt instanceof Map?Nt:Object.entries(Nt);for(const[er,fn]of F){let pn=fn;a(fn)&&(pn=pl(fn)),Oe.push(k+er+"="+encodeURIComponent(pn))}}catch(er){throw Oe.push(k+"type="+encodeURIComponent("_badmap")),er}}catch{m&&m(Nt)}}if(pe){F=Oe.join("&");break e}}F=void 0}return c=c.i.splice(0,p),h.G=c,F}function Bf(c){if(!c.g&&!c.v){c.Y=1;var h=c.Da;se||y(),Q||(se(),Q=!0),T.add(h,c),c.A=0}}function Cl(c){return c.g||c.v||c.A>=3?!1:(c.Y++,c.v=ei(u(c.Da,c),zf(c,c.A)),c.A++,!0)}n.Da=function(){if(this.v=null,qf(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var c=4*this.T;this.j.info("BP detection timer enabled: "+c),this.B=ei(u(this.Wa,this),c)}},n.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,et(10),Xo(this),qf(this))};function Pl(c){c.B!=null&&(o.clearTimeout(c.B),c.B=null)}function qf(c){c.g=new ln(c,c.j,"rpc",c.Y),c.u===null&&(c.g.J=c.o),c.g.P=0;var h=Pt(c.na);me(h,"RID","rpc"),me(h,"SID",c.M),me(h,"AID",c.K),me(h,"CI",c.F?"0":"1"),!c.F&&c.ia&&me(h,"TO",c.ia),me(h,"TYPE","xmlhttp"),di(c,h),c.u&&c.o&&Rl(h,c.u,c.o),c.O&&(c.g.H=c.O);var p=c.g;c=c.ba,p.M=1,p.A=Qo(Pt(h)),p.u=null,p.R=!0,_f(p,c)}n.Va=function(){this.C!=null&&(this.C=null,Xo(this),Cl(this),et(19))};function ea(c){c.C!=null&&(o.clearTimeout(c.C),c.C=null)}function Gf(c,h){var p=null;if(c.g==h){ea(c),Pl(c),c.g=null;var m=2}else if(wl(c.h,h))p=h.G,Tf(c.h,h),m=1;else return;if(c.I!=0){if(h.o)if(m==1){p=h.u?h.u.length:0,h=Date.now()-h.F;var R=c.D;m=Wo(),Ze(m,new uf(m,p)),Zo(c)}else Bf(c);else if(R=h.m,R==3||R==0&&h.X>0||!(m==1&&iw(c,h)||m==2&&Cl(c)))switch(p&&p.length>0&&(h=c.h,h.i=h.i.concat(p)),R){case 1:Zn(c,5);break;case 4:Zn(c,10);break;case 3:Zn(c,6);break;default:Zn(c,2)}}}function zf(c,h){let p=c.Qa+Math.floor(Math.random()*c.Za);return c.isActive()||(p*=2),p*h}function Zn(c,h){if(c.j.info("Error code "+h),h==2){var p=u(c.bb,c),m=c.Ua;const R=!m;m=new un(m||"//www.google.com/images/cleardot.gif"),o.location&&o.location.protocol=="http"||si(m,"https"),Qo(m),R?ZT(m.toString(),p):ew(m.toString(),p)}else et(2);c.I=0,c.l&&c.l.pa(h),$f(c),Lf(c)}n.bb=function(c){c?(this.j.info("Successfully pinged google.com"),et(2)):(this.j.info("Failed to ping google.com"),et(1))};function $f(c){if(c.I=0,c.ja=[],c.l){const h=wf(c.h);(h.length!=0||c.i.length!=0)&&(v(c.ja,h),v(c.ja,c.i),c.h.i.length=0,g(c.i),c.i.length=0),c.l.oa()}}function jf(c,h,p){var m=p instanceof un?Pt(p):new un(p);if(m.g!="")h&&(m.g=h+"."+m.g),ii(m,m.u);else{var R=o.location;m=R.protocol,h=h?h+"."+R.hostname:R.hostname,R=+R.port;const k=new un(null);m&&si(k,m),h&&(k.g=h),R&&ii(k,R),p&&(k.h=p),m=k}return p=c.G,h=c.wa,p&&h&&me(m,p,h),me(m,"VER",c.ka),di(c,m),m}function Wf(c,h,p){if(h&&!c.L)throw Error("Can't create secondary domain capable XhrIo object.");return h=c.Aa&&!c.ma?new Re(new bl({ab:p})):new Re(c.ma),h.Fa(c.L),h}n.isActive=function(){return!!this.l&&this.l.isActive(this)};function Kf(){}n=Kf.prototype,n.ra=function(){},n.qa=function(){},n.pa=function(){},n.oa=function(){},n.isActive=function(){return!0},n.Ka=function(){};function ta(){}ta.prototype.g=function(c,h){return new _t(c,h)};function _t(c,h){Ke.call(this),this.g=new Mf(h),this.l=c,this.h=h&&h.messageUrlParams||null,c=h&&h.messageHeaders||null,h&&h.clientProtocolHeaderRequired&&(c?c["X-Client-Protocol"]="webchannel":c={"X-Client-Protocol":"webchannel"}),this.g.o=c,c=h&&h.initMessageHeaders||null,h&&h.messageContentType&&(c?c["X-WebChannel-Content-Type"]=h.messageContentType:c={"X-WebChannel-Content-Type":h.messageContentType}),h&&h.sa&&(c?c["X-WebChannel-Client-Profile"]=h.sa:c={"X-WebChannel-Client-Profile":h.sa}),this.g.U=c,(c=h&&h.Qb)&&!I(c)&&(this.g.u=c),this.A=h&&h.supportsCrossDomainXhr||!1,this.v=h&&h.sendRawJson||!1,(h=h&&h.httpSessionIdParam)&&!I(h)&&(this.g.G=h,c=this.h,c!==null&&h in c&&(c=this.h,h in c&&delete c[h])),this.j=new Br(this)}f(_t,Ke),_t.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},_t.prototype.close=function(){Sl(this.g)},_t.prototype.o=function(c){var h=this.g;if(typeof c=="string"){var p={};p.__data__=c,c=p}else this.v&&(p={},p.__data__=pl(c),c=p);h.i.push(new jT(h.Ya++,c)),h.I==3&&Zo(h)},_t.prototype.N=function(){this.g.l=null,delete this.j,Sl(this.g),delete this.g,_t.Z.N.call(this)};function Hf(c){_l.call(this),c.__headers__&&(this.headers=c.__headers__,this.statusCode=c.__status__,delete c.__headers__,delete c.__status__);var h=c.__sm__;if(h){e:{for(const p in h){c=p;break e}c=void 0}(this.i=c)&&(c=this.i,h=h!==null&&c in h?h[c]:void 0),this.data=h}else this.data=c}f(Hf,_l);function Qf(){ml.call(this),this.status=1}f(Qf,ml);function Br(c){this.g=c}f(Br,Kf),Br.prototype.ra=function(){Ze(this.g,"a")},Br.prototype.qa=function(c){Ze(this.g,new Hf(c))},Br.prototype.pa=function(c){Ze(this.g,new Qf)},Br.prototype.oa=function(){Ze(this.g,"b")},ta.prototype.createWebChannel=ta.prototype.g,_t.prototype.send=_t.prototype.o,_t.prototype.open=_t.prototype.m,_t.prototype.close=_t.prototype.close,Wm=function(){return new ta},jm=function(){return Wo()},$m=Yn,nu={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},Ko.NO_ERROR=0,Ko.TIMEOUT=8,Ko.HTTP_ERROR=6,ma=Ko,hf.COMPLETE="complete",zm=hf,of.EventType=Xs,Xs.OPEN="a",Xs.CLOSE="b",Xs.ERROR="c",Xs.MESSAGE="d",Ke.prototype.listen=Ke.prototype.J,vi=of,Re.prototype.listenOnce=Re.prototype.K,Re.prototype.getLastError=Re.prototype.Ha,Re.prototype.getLastErrorCode=Re.prototype.ya,Re.prototype.getStatus=Re.prototype.ca,Re.prototype.getResponseJson=Re.prototype.La,Re.prototype.getResponseText=Re.prototype.la,Re.prototype.send=Re.prototype.ea,Re.prototype.setWithCredentials=Re.prototype.Fa,Gm=Re}).apply(typeof ra<"u"?ra:typeof self<"u"?self:typeof window<"u"?window:{});const ip="@firebase/firestore",op="4.9.2";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ge{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}Ge.UNAUTHENTICATED=new Ge(null),Ge.GOOGLE_CREDENTIALS=new Ge("google-credentials-uid"),Ge.FIRST_PARTY=new Ge("first-party-uid"),Ge.MOCK_USER=new Ge("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Ms="12.3.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Nn=new yc("@firebase/firestore");function Hr(){return Nn.logLevel}function xv(n){Nn.setLogLevel(n)}function x(n,...e){if(Nn.logLevel<=ne.DEBUG){const t=e.map(th);Nn.debug(`Firestore (${Ms}): ${n}`,...t)}}function Ne(n,...e){if(Nn.logLevel<=ne.ERROR){const t=e.map(th);Nn.error(`Firestore (${Ms}): ${n}`,...t)}}function yt(n,...e){if(Nn.logLevel<=ne.WARN){const t=e.map(th);Nn.warn(`Firestore (${Ms}): ${n}`,...t)}}function th(n){if(typeof n=="string")return n;try{/**
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
 */function q(n,e,t){let r="Unexpected state";typeof e=="string"?r=e:t=e,Km(n,r,t)}function Km(n,e,t){let r=`FIRESTORE (${Ms}) INTERNAL ASSERTION FAILED: ${e} (ID: ${n.toString(16)})`;if(t!==void 0)try{r+=" CONTEXT: "+JSON.stringify(t)}catch{r+=" CONTEXT: "+t}throw Ne(r),new Error(r)}function G(n,e,t,r){let s="Unexpected state";typeof t=="string"?s=t:r=t,n||Km(e,s,r)}function Vv(n,e){n||q(57014,e)}function L(n,e){return n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const S={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class D extends zt{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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
 */class Hm{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class Qm{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable((()=>t(Ge.UNAUTHENTICATED)))}shutdown(){}}class Ov{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable((()=>t(this.token.user)))}shutdown(){this.changeListener=null}}class Mv{constructor(e){this.t=e,this.currentUser=Ge.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,t){G(this.o===void 0,42304);let r=this.i;const s=l=>this.i!==r?(r=this.i,t(l)):Promise.resolve();let i=new $e;this.o=()=>{this.i++,this.currentUser=this.u(),i.resolve(),i=new $e,e.enqueueRetryable((()=>s(this.currentUser)))};const o=()=>{const l=i;e.enqueueRetryable((async()=>{await l.promise,await s(this.currentUser)}))},a=l=>{x("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=l,this.o&&(this.auth.addAuthTokenListener(this.o),o())};this.t.onInit((l=>a(l))),setTimeout((()=>{if(!this.auth){const l=this.t.getImmediate({optional:!0});l?a(l):(x("FirebaseAuthCredentialsProvider","Auth not yet detected"),i.resolve(),i=new $e)}}),0),o()}getToken(){const e=this.i,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then((r=>this.i!==e?(x("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):r?(G(typeof r.accessToken=="string",31837,{l:r}),new Hm(r.accessToken,this.currentUser)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const e=this.auth&&this.auth.getUid();return G(e===null||typeof e=="string",2055,{h:e}),new Ge(e)}}class Lv{constructor(e,t,r){this.P=e,this.T=t,this.I=r,this.type="FirstParty",this.user=Ge.FIRST_PARTY,this.A=new Map}R(){return this.I?this.I():null}get headers(){this.A.set("X-Goog-AuthUser",this.P);const e=this.R();return e&&this.A.set("Authorization",e),this.T&&this.A.set("X-Goog-Iam-Authorization-Token",this.T),this.A}}class Fv{constructor(e,t,r){this.P=e,this.T=t,this.I=r}getToken(){return Promise.resolve(new Lv(this.P,this.T,this.I))}start(e,t){e.enqueueRetryable((()=>t(Ge.FIRST_PARTY)))}shutdown(){}invalidateToken(){}}class ru{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class Uv{constructor(e,t){this.V=t,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,xt(e)&&e.settings.appCheckToken&&(this.p=e.settings.appCheckToken)}start(e,t){G(this.o===void 0,3512);const r=i=>{i.error!=null&&x("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${i.error.message}`);const o=i.token!==this.m;return this.m=i.token,x("FirebaseAppCheckTokenProvider",`Received ${o?"new":"existing"} token.`),o?t(i.token):Promise.resolve()};this.o=i=>{e.enqueueRetryable((()=>r(i)))};const s=i=>{x("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=i,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit((i=>s(i))),setTimeout((()=>{if(!this.appCheck){const i=this.V.getImmediate({optional:!0});i?s(i):x("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}}),0)}getToken(){if(this.p)return Promise.resolve(new ru(this.p));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then((t=>t?(G(typeof t.token=="string",44558,{tokenResult:t}),this.m=t.token,new ru(t.token)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}class Bv{getToken(){return Promise.resolve(new ru(""))}invalidateToken(){}start(e,t){}shutdown(){}}/**
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
 */function qv(n){const e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(n);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let r=0;r<n;r++)t[r]=Math.floor(256*Math.random());return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ec{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516);let r="";for(;r.length<20;){const s=qv(40);for(let i=0;i<s.length;++i)r.length<20&&s[i]<t&&(r+=e.charAt(s[i]%62))}return r}}function j(n,e){return n<e?-1:n>e?1:0}function su(n,e){const t=Math.min(n.length,e.length);for(let r=0;r<t;r++){const s=n.charAt(r),i=e.charAt(r);if(s!==i)return xl(s)===xl(i)?j(s,i):xl(s)?1:-1}return j(n.length,e.length)}const Gv=55296,zv=57343;function xl(n){const e=n.charCodeAt(0);return e>=Gv&&e<=zv}function as(n,e,t){return n.length===e.length&&n.every(((r,s)=>t(r,e[s])))}function Ym(n){return n+"\0"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const iu="__name__";class kt{constructor(e,t,r){t===void 0?t=0:t>e.length&&q(637,{offset:t,range:e.length}),r===void 0?r=e.length-t:r>e.length-t&&q(1746,{length:r,range:e.length-t}),this.segments=e,this.offset=t,this.len=r}get length(){return this.len}isEqual(e){return kt.comparator(this,e)===0}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof kt?e.forEach((r=>{t.push(r)})):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,r=this.limit();t<r;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const r=Math.min(e.length,t.length);for(let s=0;s<r;s++){const i=kt.compareSegments(e.get(s),t.get(s));if(i!==0)return i}return j(e.length,t.length)}static compareSegments(e,t){const r=kt.isNumericId(e),s=kt.isNumericId(t);return r&&!s?-1:!r&&s?1:r&&s?kt.extractNumericId(e).compare(kt.extractNumericId(t)):su(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return bn.fromString(e.substring(4,e.length-2))}}class X extends kt{construct(e,t,r){return new X(e,t,r)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const r of e){if(r.indexOf("//")>=0)throw new D(S.INVALID_ARGUMENT,`Invalid segment (${r}). Paths must not contain // in them.`);t.push(...r.split("/").filter((s=>s.length>0)))}return new X(t)}static emptyPath(){return new X([])}}const $v=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class Ie extends kt{construct(e,t,r){return new Ie(e,t,r)}static isValidIdentifier(e){return $v.test(e)}canonicalString(){return this.toArray().map((e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),Ie.isValidIdentifier(e)||(e="`"+e+"`"),e))).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===iu}static keyField(){return new Ie([iu])}static fromServerFormat(e){const t=[];let r="",s=0;const i=()=>{if(r.length===0)throw new D(S.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(r),r=""};let o=!1;for(;s<e.length;){const a=e[s];if(a==="\\"){if(s+1===e.length)throw new D(S.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const l=e[s+1];if(l!=="\\"&&l!=="."&&l!=="`")throw new D(S.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);r+=l,s+=2}else a==="`"?(o=!o,s++):a!=="."||o?(r+=a,s++):(i(),s++)}if(i(),o)throw new D(S.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new Ie(t)}static emptyPath(){return new Ie([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class M{constructor(e){this.path=e}static fromPath(e){return new M(X.fromString(e))}static fromName(e){return new M(X.fromString(e).popFirst(5))}static empty(){return new M(X.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&X.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return X.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new M(new X(e.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function nh(n,e,t){if(!t)throw new D(S.INVALID_ARGUMENT,`Function ${n}() cannot be called with an empty ${e}.`)}function Jm(n,e,t,r){if(e===!0&&r===!0)throw new D(S.INVALID_ARGUMENT,`${n} and ${t} cannot be used together.`)}function ap(n){if(!M.isDocumentKey(n))throw new D(S.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${n} has ${n.length}.`)}function cp(n){if(M.isDocumentKey(n))throw new D(S.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${n} has ${n.length}.`)}function Xm(n){return typeof n=="object"&&n!==null&&(Object.getPrototypeOf(n)===Object.prototype||Object.getPrototypeOf(n)===null)}function Tc(n){if(n===void 0)return"undefined";if(n===null)return"null";if(typeof n=="string")return n.length>20&&(n=`${n.substring(0,20)}...`),JSON.stringify(n);if(typeof n=="number"||typeof n=="boolean")return""+n;if(typeof n=="object"){if(n instanceof Array)return"an array";{const e=(function(r){return r.constructor?r.constructor.name:null})(n);return e?`a custom ${e} object`:"an object"}}return typeof n=="function"?"a function":q(12329,{type:typeof n})}function ee(n,e){if("_delegate"in n&&(n=n._delegate),!(n instanceof e)){if(e.name===n.constructor.name)throw new D(S.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const t=Tc(n);throw new D(S.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return n}function Zm(n,e){if(e<=0)throw new D(S.INVALID_ARGUMENT,`Function ${n}() requires a positive number, but it was: ${e}.`)}/**
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
 */function Ve(n,e){const t={typeString:n};return e&&(t.value=e),t}function kr(n,e){if(!Xm(n))throw new D(S.INVALID_ARGUMENT,"JSON must be an object");let t;for(const r in e)if(e[r]){const s=e[r].typeString,i="value"in e[r]?{value:e[r].value}:void 0;if(!(r in n)){t=`JSON missing required field: '${r}'`;break}const o=n[r];if(s&&typeof o!==s){t=`JSON field '${r}' must be a ${s}.`;break}if(i!==void 0&&o!==i.value){t=`Expected '${r}' field to equal '${i.value}'`;break}}if(t)throw new D(S.INVALID_ARGUMENT,t);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const lp=-62135596800,up=1e6;class ce{static now(){return ce.fromMillis(Date.now())}static fromDate(e){return ce.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),r=Math.floor((e-1e3*t)*up);return new ce(t,r)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new D(S.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new D(S.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<lp)throw new D(S.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new D(S.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/up}_compareTo(e){return this.seconds===e.seconds?j(this.nanoseconds,e.nanoseconds):j(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:ce._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(kr(e,ce._jsonSchema))return new ce(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-lp;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}ce._jsonSchemaVersion="firestore/timestamp/1.0",ce._jsonSchema={type:Ve("string",ce._jsonSchemaVersion),seconds:Ve("number"),nanoseconds:Ve("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class z{static fromTimestamp(e){return new z(e)}static min(){return new z(new ce(0,0))}static max(){return new z(new ce(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
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
 */const cs=-1;class ls{constructor(e,t,r,s){this.indexId=e,this.collectionGroup=t,this.fields=r,this.indexState=s}}function ou(n){return n.fields.find((e=>e.kind===2))}function rr(n){return n.fields.filter((e=>e.kind!==2))}function jv(n,e){let t=j(n.collectionGroup,e.collectionGroup);if(t!==0)return t;for(let r=0;r<Math.min(n.fields.length,e.fields.length);++r)if(t=Wv(n.fields[r],e.fields[r]),t!==0)return t;return j(n.fields.length,e.fields.length)}ls.UNKNOWN_ID=-1;class pr{constructor(e,t){this.fieldPath=e,this.kind=t}}function Wv(n,e){const t=Ie.comparator(n.fieldPath,e.fieldPath);return t!==0?t:j(n.kind,e.kind)}class us{constructor(e,t){this.sequenceNumber=e,this.offset=t}static empty(){return new us(0,It.min())}}function eg(n,e){const t=n.toTimestamp().seconds,r=n.toTimestamp().nanoseconds+1,s=z.fromTimestamp(r===1e9?new ce(t+1,0):new ce(t,r));return new It(s,M.empty(),e)}function tg(n){return new It(n.readTime,n.key,cs)}class It{constructor(e,t,r){this.readTime=e,this.documentKey=t,this.largestBatchId=r}static min(){return new It(z.min(),M.empty(),cs)}static max(){return new It(z.max(),M.empty(),cs)}}function rh(n,e){let t=n.readTime.compareTo(e.readTime);return t!==0?t:(t=M.comparator(n.documentKey,e.documentKey),t!==0?t:j(n.largestBatchId,e.largestBatchId))}/**
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
 */const ng="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class rg{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach((e=>e()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function qn(n){if(n.code!==S.FAILED_PRECONDITION||n.message!==ng)throw n;x("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class b{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e((t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t)}),(t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t)}))}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&q(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new b(((r,s)=>{this.nextCallback=i=>{this.wrapSuccess(e,i).next(r,s)},this.catchCallback=i=>{this.wrapFailure(t,i).next(r,s)}}))}toPromise(){return new Promise(((e,t)=>{this.next(e,t)}))}wrapUserFunction(e){try{const t=e();return t instanceof b?t:b.resolve(t)}catch(t){return b.reject(t)}}wrapSuccess(e,t){return e?this.wrapUserFunction((()=>e(t))):b.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction((()=>e(t))):b.reject(t)}static resolve(e){return new b(((t,r)=>{t(e)}))}static reject(e){return new b(((t,r)=>{r(e)}))}static waitFor(e){return new b(((t,r)=>{let s=0,i=0,o=!1;e.forEach((a=>{++s,a.next((()=>{++i,o&&i===s&&t()}),(l=>r(l)))})),o=!0,i===s&&t()}))}static or(e){let t=b.resolve(!1);for(const r of e)t=t.next((s=>s?b.resolve(s):r()));return t}static forEach(e,t){const r=[];return e.forEach(((s,i)=>{r.push(t.call(this,s,i))})),this.waitFor(r)}static mapArray(e,t){return new b(((r,s)=>{const i=e.length,o=new Array(i);let a=0;for(let l=0;l<i;l++){const u=l;t(e[u]).next((d=>{o[u]=d,++a,a===i&&r(o)}),(d=>s(d)))}}))}static doWhile(e,t){return new b(((r,s)=>{const i=()=>{e()===!0?t().next((()=>{i()}),s):r()};i()}))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mt="SimpleDb";class wc{static open(e,t,r,s){try{return new wc(t,e.transaction(s,r))}catch(i){throw new Pi(t,i)}}constructor(e,t){this.action=e,this.transaction=t,this.aborted=!1,this.S=new $e,this.transaction.oncomplete=()=>{this.S.resolve()},this.transaction.onabort=()=>{t.error?this.S.reject(new Pi(e,t.error)):this.S.resolve()},this.transaction.onerror=r=>{const s=sh(r.target.error);this.S.reject(new Pi(e,s))}}get D(){return this.S.promise}abort(e){e&&this.S.reject(e),this.aborted||(x(mt,"Aborting transaction:",e?e.message:"Client-initiated abort"),this.aborted=!0,this.transaction.abort())}C(){const e=this.transaction;this.aborted||typeof e.commit!="function"||e.commit()}store(e){const t=this.transaction.objectStore(e);return new Hv(t)}}class Ft{static delete(e){return x(mt,"Removing database:",e),or(Nm().indexedDB.deleteDatabase(e)).toPromise()}static v(){if(!Mm())return!1;if(Ft.F())return!0;const e=pt(),t=Ft.M(e),r=0<t&&t<10,s=sg(e),i=0<s&&s<4.5;return!(e.indexOf("MSIE ")>0||e.indexOf("Trident/")>0||e.indexOf("Edge/")>0||r||i)}static F(){var e;return typeof process<"u"&&((e=process.__PRIVATE_env)==null?void 0:e.__PRIVATE_USE_MOCK_PERSISTENCE)==="YES"}static O(e,t){return e.store(t)}static M(e){const t=e.match(/i(?:phone|pad|pod) os ([\d_]+)/i),r=t?t[1].split("_").slice(0,2).join("."):"-1";return Number(r)}constructor(e,t,r){this.name=e,this.version=t,this.N=r,this.B=null,Ft.M(pt())===12.2&&Ne("Firestore persistence suffers from a bug in iOS 12.2 Safari that may cause your app to stop working. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.")}async L(e){return this.db||(x(mt,"Opening database:",this.name),this.db=await new Promise(((t,r)=>{const s=indexedDB.open(this.name,this.version);s.onsuccess=i=>{const o=i.target.result;t(o)},s.onblocked=()=>{r(new Pi(e,"Cannot upgrade IndexedDB schema while another tab is open. Close all tabs that access Firestore and reload this page to proceed."))},s.onerror=i=>{const o=i.target.error;o.name==="VersionError"?r(new D(S.FAILED_PRECONDITION,"A newer version of the Firestore SDK was previously used and so the persisted data is not compatible with the version of the SDK you are now using. The SDK will operate with persistence disabled. If you need persistence, please re-upgrade to a newer version of the SDK or else clear the persisted IndexedDB data for your app to start fresh.")):o.name==="InvalidStateError"?r(new D(S.FAILED_PRECONDITION,"Unable to open an IndexedDB connection. This could be due to running in a private browsing session on a browser whose private browsing sessions do not support IndexedDB: "+o)):r(new Pi(e,o))},s.onupgradeneeded=i=>{x(mt,'Database "'+this.name+'" requires upgrade from version:',i.oldVersion);const o=i.target.result;this.N.k(o,s.transaction,i.oldVersion,this.version).next((()=>{x(mt,"Database upgrade to version "+this.version+" complete")}))}}))),this.q&&(this.db.onversionchange=t=>this.q(t)),this.db}$(e){this.q=e,this.db&&(this.db.onversionchange=t=>e(t))}async runTransaction(e,t,r,s){const i=t==="readonly";let o=0;for(;;){++o;try{this.db=await this.L(e);const a=wc.open(this.db,e,i?"readonly":"readwrite",r),l=s(a).next((u=>(a.C(),u))).catch((u=>(a.abort(u),b.reject(u)))).toPromise();return l.catch((()=>{})),await a.D,l}catch(a){const l=a,u=l.name!=="FirebaseError"&&o<3;if(x(mt,"Transaction failed with error:",l.message,"Retrying:",u),this.close(),!u)return Promise.reject(l)}}}close(){this.db&&this.db.close(),this.db=void 0}}function sg(n){const e=n.match(/Android ([\d.]+)/i),t=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(t)}class Kv{constructor(e){this.U=e,this.K=!1,this.W=null}get isDone(){return this.K}get G(){return this.W}set cursor(e){this.U=e}done(){this.K=!0}j(e){this.W=e}delete(){return or(this.U.delete())}}class Pi extends D{constructor(e,t){super(S.UNAVAILABLE,`IndexedDB transaction '${e}' failed: ${t}`),this.name="IndexedDbTransactionError"}}function Gn(n){return n.name==="IndexedDbTransactionError"}class Hv{constructor(e){this.store=e}put(e,t){let r;return t!==void 0?(x(mt,"PUT",this.store.name,e,t),r=this.store.put(t,e)):(x(mt,"PUT",this.store.name,"<auto-key>",e),r=this.store.put(e)),or(r)}add(e){return x(mt,"ADD",this.store.name,e,e),or(this.store.add(e))}get(e){return or(this.store.get(e)).next((t=>(t===void 0&&(t=null),x(mt,"GET",this.store.name,e,t),t)))}delete(e){return x(mt,"DELETE",this.store.name,e),or(this.store.delete(e))}count(){return x(mt,"COUNT",this.store.name),or(this.store.count())}J(e,t){const r=this.options(e,t),s=r.index?this.store.index(r.index):this.store;if(typeof s.getAll=="function"){const i=s.getAll(r.range);return new b(((o,a)=>{i.onerror=l=>{a(l.target.error)},i.onsuccess=l=>{o(l.target.result)}}))}{const i=this.cursor(r),o=[];return this.H(i,((a,l)=>{o.push(l)})).next((()=>o))}}Y(e,t){const r=this.store.getAll(e,t===null?void 0:t);return new b(((s,i)=>{r.onerror=o=>{i(o.target.error)},r.onsuccess=o=>{s(o.target.result)}}))}Z(e,t){x(mt,"DELETE ALL",this.store.name);const r=this.options(e,t);r.X=!1;const s=this.cursor(r);return this.H(s,((i,o,a)=>a.delete()))}ee(e,t){let r;t?r=e:(r={},t=e);const s=this.cursor(r);return this.H(s,t)}te(e){const t=this.cursor({});return new b(((r,s)=>{t.onerror=i=>{const o=sh(i.target.error);s(o)},t.onsuccess=i=>{const o=i.target.result;o?e(o.primaryKey,o.value).next((a=>{a?o.continue():r()})):r()}}))}H(e,t){const r=[];return new b(((s,i)=>{e.onerror=o=>{i(o.target.error)},e.onsuccess=o=>{const a=o.target.result;if(!a)return void s();const l=new Kv(a),u=t(a.primaryKey,a.value,l);if(u instanceof b){const d=u.catch((f=>(l.done(),b.reject(f))));r.push(d)}l.isDone?s():l.G===null?a.continue():a.continue(l.G)}})).next((()=>b.waitFor(r)))}options(e,t){let r;return e!==void 0&&(typeof e=="string"?r=e:t=e),{index:r,range:t}}cursor(e){let t="next";if(e.reverse&&(t="prev"),e.index){const r=this.store.index(e.index);return e.X?r.openKeyCursor(e.range,t):r.openCursor(e.range,t)}return this.store.openCursor(e.range,t)}}function or(n){return new b(((e,t)=>{n.onsuccess=r=>{const s=r.target.result;e(s)},n.onerror=r=>{const s=sh(r.target.error);t(s)}}))}let hp=!1;function sh(n){const e=Ft.M(pt());if(e>=12.2&&e<13){const t="An internal error was encountered in the Indexed Database server";if(n.message.indexOf(t)>=0){const r=new D("internal",`IOS_INDEXEDDB_BUG1: IndexedDb has thrown '${t}'. This is likely due to an unavoidable bug in iOS. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.`);return hp||(hp=!0,setTimeout((()=>{throw r}),0)),r}}return n}const Ni="IndexBackfiller";class Qv{constructor(e,t){this.asyncQueue=e,this.ne=t,this.task=null}start(){this.re(15e3)}stop(){this.task&&(this.task.cancel(),this.task=null)}get started(){return this.task!==null}re(e){x(Ni,`Scheduled in ${e}ms`),this.task=this.asyncQueue.enqueueAfterDelay("index_backfill",e,(async()=>{this.task=null;try{const t=await this.ne.ie();x(Ni,`Documents written: ${t}`)}catch(t){Gn(t)?x(Ni,"Ignoring IndexedDB error during index backfill: ",t):await qn(t)}await this.re(6e4)}))}}class Yv{constructor(e,t){this.localStore=e,this.persistence=t}async ie(e=50){return this.persistence.runTransaction("Backfill Indexes","readwrite-primary",(t=>this.se(t,e)))}se(e,t){const r=new Set;let s=t,i=!0;return b.doWhile((()=>i===!0&&s>0),(()=>this.localStore.indexManager.getNextCollectionGroupToUpdate(e).next((o=>{if(o!==null&&!r.has(o))return x(Ni,`Processing collection: ${o}`),this.oe(e,o,s).next((a=>{s-=a,r.add(o)}));i=!1})))).next((()=>t-s))}oe(e,t,r){return this.localStore.indexManager.getMinOffsetFromCollectionGroup(e,t).next((s=>this.localStore.localDocuments.getNextDocuments(e,t,s,r).next((i=>{const o=i.changes;return this.localStore.indexManager.updateIndexEntries(e,o).next((()=>this._e(s,i))).next((a=>(x(Ni,`Updating offset: ${a}`),this.localStore.indexManager.updateCollectionGroup(e,t,a)))).next((()=>o.size))}))))}_e(e,t){let r=e;return t.changes.forEach(((s,i)=>{const o=tg(i);rh(o,r)>0&&(r=o)})),new It(r.readTime,r.documentKey,Math.max(t.batchId,e.largestBatchId))}}/**
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
 */class it{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=r=>this.ae(r),this.ue=r=>t.writeSequenceNumber(r))}ae(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.ue&&this.ue(e),e}}it.ce=-1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Rn=-1;function Eo(n){return n==null}function Qi(n){return n===0&&1/n==-1/0}function ig(n){return typeof n=="number"&&Number.isInteger(n)&&!Qi(n)&&n<=Number.MAX_SAFE_INTEGER&&n>=Number.MIN_SAFE_INTEGER}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Va="";function Ye(n){let e="";for(let t=0;t<n.length;t++)e.length>0&&(e=dp(e)),e=Jv(n.get(t),e);return dp(e)}function Jv(n,e){let t=e;const r=n.length;for(let s=0;s<r;s++){const i=n.charAt(s);switch(i){case"\0":t+="";break;case Va:t+="";break;default:t+=i}}return t}function dp(n){return n+Va+""}function Vt(n){const e=n.length;if(G(e>=2,64408,{path:n}),e===2)return G(n.charAt(0)===Va&&n.charAt(1)==="",56145,{path:n}),X.emptyPath();const t=e-2,r=[];let s="";for(let i=0;i<e;){const o=n.indexOf(Va,i);switch((o<0||o>t)&&q(50515,{path:n}),n.charAt(o+1)){case"":const a=n.substring(i,o);let l;s.length===0?l=a:(s+=a,l=s,s=""),r.push(l);break;case"":s+=n.substring(i,o),s+="\0";break;case"":s+=n.substring(i,o+1);break;default:q(61167,{path:n})}i=o+2}return new X(r)}/**
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
 */const sr="remoteDocuments",To="owner",qr="owner",Yi="mutationQueues",Xv="userId",vt="mutations",fp="batchId",ur="userMutationsIndex",pp=["userId","batchId"];/**
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
 */function ga(n,e){return[n,Ye(e)]}function og(n,e,t){return[n,Ye(e),t]}const Zv={},hs="documentMutations",Oa="remoteDocumentsV14",eA=["prefixPath","collectionGroup","readTime","documentId"],ya="documentKeyIndex",tA=["prefixPath","collectionGroup","documentId"],ag="collectionGroupIndex",nA=["collectionGroup","readTime","prefixPath","documentId"],Ji="remoteDocumentGlobal",au="remoteDocumentGlobalKey",ds="targets",cg="queryTargetsIndex",rA=["canonicalId","targetId"],fs="targetDocuments",sA=["targetId","path"],ih="documentTargetsIndex",iA=["path","targetId"],Ma="targetGlobalKey",_r="targetGlobal",Xi="collectionParents",oA=["collectionId","parent"],ps="clientMetadata",aA="clientId",vc="bundles",cA="bundleId",Ac="namedQueries",lA="name",oh="indexConfiguration",uA="indexId",cu="collectionGroupIndex",hA="collectionGroup",ki="indexState",dA=["indexId","uid"],lg="sequenceNumberIndex",fA=["uid","sequenceNumber"],Di="indexEntries",pA=["indexId","uid","arrayValue","directionalValue","orderedDocumentKey","documentKey"],ug="documentKeyIndex",_A=["indexId","uid","orderedDocumentKey"],bc="documentOverlays",mA=["userId","collectionPath","documentId"],lu="collectionPathOverlayIndex",gA=["userId","collectionPath","largestBatchId"],hg="collectionGroupOverlayIndex",yA=["userId","collectionGroup","largestBatchId"],ah="globals",IA="name",dg=[Yi,vt,hs,sr,ds,To,_r,fs,ps,Ji,Xi,vc,Ac],EA=[...dg,bc],fg=[Yi,vt,hs,Oa,ds,To,_r,fs,ps,Ji,Xi,vc,Ac,bc],pg=fg,ch=[...pg,oh,ki,Di],TA=ch,_g=[...ch,ah],wA=_g;/**
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
 */class uu extends rg{constructor(e,t){super(),this.le=e,this.currentSequenceNumber=t}}function Fe(n,e){const t=L(n);return Ft.O(t.le,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _p(n){let e=0;for(const t in n)Object.prototype.hasOwnProperty.call(n,t)&&e++;return e}function zn(n,e){for(const t in n)Object.prototype.hasOwnProperty.call(n,t)&&e(t,n[t])}function mg(n,e){const t=[];for(const r in n)Object.prototype.hasOwnProperty.call(n,r)&&t.push(e(n[r],r,n));return t}function gg(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Ae=class hu{constructor(e,t){this.comparator=e,this.root=t||Sn.EMPTY}insert(e,t){return new hu(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,Sn.BLACK,null,null))}remove(e){return new hu(this.comparator,this.root.remove(e,this.comparator).copy(null,null,Sn.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){const r=this.comparator(e,t.key);if(r===0)return t.value;r<0?t=t.left:r>0&&(t=t.right)}return null}indexOf(e){let t=0,r=this.root;for(;!r.isEmpty();){const s=this.comparator(e,r.key);if(s===0)return t+r.left.size;s<0?r=r.left:(t+=r.left.size+1,r=r.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal(((t,r)=>(e(t,r),!1)))}toString(){const e=[];return this.inorderTraversal(((t,r)=>(e.push(`${t}:${r}`),!1))),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new sa(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new sa(this.root,e,this.comparator,!1)}getReverseIterator(){return new sa(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new sa(this.root,e,this.comparator,!0)}},sa=class{constructor(e,t,r,s){this.isReverse=s,this.nodeStack=[];let i=1;for(;!e.isEmpty();)if(i=t?r(e.key,t):1,t&&s&&(i*=-1),i<0)e=this.isReverse?e.left:e.right;else{if(i===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}},Sn=class jt{constructor(e,t,r,s,i){this.key=e,this.value=t,this.color=r??jt.RED,this.left=s??jt.EMPTY,this.right=i??jt.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,r,s,i){return new jt(e??this.key,t??this.value,r??this.color,s??this.left,i??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,r){let s=this;const i=r(e,s.key);return s=i<0?s.copy(null,null,null,s.left.insert(e,t,r),null):i===0?s.copy(null,t,null,null,null):s.copy(null,null,null,null,s.right.insert(e,t,r)),s.fixUp()}removeMin(){if(this.left.isEmpty())return jt.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let r,s=this;if(t(e,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(e,t),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),t(e,s.key)===0){if(s.right.isEmpty())return jt.EMPTY;r=s.right.min(),s=s.copy(r.key,r.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(e,t))}return s.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,jt.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,jt.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw q(43730,{key:this.key,value:this.value});if(this.right.isRed())throw q(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw q(27949);return e+(this.isRed()?0:1)}};Sn.EMPTY=null,Sn.RED=!0,Sn.BLACK=!1;Sn.EMPTY=new class{constructor(){this.size=0}get key(){throw q(57766)}get value(){throw q(16141)}get color(){throw q(16727)}get left(){throw q(29726)}get right(){throw q(36894)}copy(e,t,r,s,i){return this}insert(e,t,r){return new Sn(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class he{constructor(e){this.comparator=e,this.data=new Ae(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal(((t,r)=>(e(t),!1)))}forEachInRange(e,t){const r=this.data.getIteratorFrom(e[0]);for(;r.hasNext();){const s=r.getNext();if(this.comparator(s.key,e[1])>=0)return;t(s.key)}}forEachWhile(e,t){let r;for(r=t!==void 0?this.data.getIteratorFrom(t):this.data.getIterator();r.hasNext();)if(!e(r.getNext().key))return}firstAfterOrEqual(e){const t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new mp(this.data.getIterator())}getIteratorFrom(e){return new mp(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach((r=>{t=t.add(r)})),t}isEqual(e){if(!(e instanceof he)||this.size!==e.size)return!1;const t=this.data.getIterator(),r=e.data.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=r.getNext().key;if(this.comparator(s,i)!==0)return!1}return!0}toArray(){const e=[];return this.forEach((t=>{e.push(t)})),e}toString(){const e=[];return this.forEach((t=>e.push(t))),"SortedSet("+e.toString()+")"}copy(e){const t=new he(this.comparator);return t.data=e,t}}class mp{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}function Gr(n){return n.hasNext()?n.getNext():void 0}/**
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
 */class ot{constructor(e){this.fields=e,e.sort(Ie.comparator)}static empty(){return new ot([])}unionWith(e){let t=new he(Ie.comparator);for(const r of this.fields)t=t.add(r);for(const r of e)t=t.add(r);return new ot(t.toArray())}covers(e){for(const t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return as(this.fields,e.fields,((t,r)=>t.isEqual(r)))}}/**
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
 */class yg extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
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
 */function vA(){return typeof atob<"u"}/**
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
 */class be{constructor(e){this.binaryString=e}static fromBase64String(e){const t=(function(s){try{return atob(s)}catch(i){throw typeof DOMException<"u"&&i instanceof DOMException?new yg("Invalid base64 string: "+i):i}})(e);return new be(t)}static fromUint8Array(e){const t=(function(s){let i="";for(let o=0;o<s.length;++o)i+=String.fromCharCode(s[o]);return i})(e);return new be(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return(function(t){return btoa(t)})(this.binaryString)}toUint8Array(){return(function(t){const r=new Uint8Array(t.length);for(let s=0;s<t.length;s++)r[s]=t.charCodeAt(s);return r})(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return j(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}be.EMPTY_BYTE_STRING=new be("");const AA=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function en(n){if(G(!!n,39018),typeof n=="string"){let e=0;const t=AA.exec(n);if(G(!!t,46558,{timestamp:n}),t[1]){let s=t[1];s=(s+"000000000").substr(0,9),e=Number(s)}const r=new Date(n);return{seconds:Math.floor(r.getTime()/1e3),nanos:e}}return{seconds:Ee(n.seconds),nanos:Ee(n.nanos)}}function Ee(n){return typeof n=="number"?n:typeof n=="string"?Number(n):0}function tn(n){return typeof n=="string"?be.fromBase64String(n):be.fromUint8Array(n)}/**
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
 */const Ig="server_timestamp",Eg="__type__",Tg="__previous_value__",wg="__local_write_time__";function Rc(n){var t,r;return((r=(((t=n==null?void 0:n.mapValue)==null?void 0:t.fields)||{})[Eg])==null?void 0:r.stringValue)===Ig}function Sc(n){const e=n.mapValue.fields[Tg];return Rc(e)?Sc(e):e}function Zi(n){const e=en(n.mapValue.fields[wg].timestampValue);return new ce(e.seconds,e.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bA{constructor(e,t,r,s,i,o,a,l,u,d){this.databaseId=e,this.appId=t,this.persistenceKey=r,this.host=s,this.ssl=i,this.forceLongPolling=o,this.autoDetectLongPolling=a,this.longPollingOptions=l,this.useFetchStreams=u,this.isUsingEmulator=d}}const eo="(default)";class kn{constructor(e,t){this.projectId=e,this.database=t||eo}static empty(){return new kn("","")}get isDefaultDatabase(){return this.database===eo}isEqual(e){return e instanceof kn&&e.projectId===this.projectId&&e.database===this.database}}/**
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
 */const lh="__type__",vg="__max__",wn={mapValue:{fields:{__type__:{stringValue:vg}}}},uh="__vector__",_s="value",Ia={nullValue:"NULL_VALUE"};function Dn(n){return"nullValue"in n?0:"booleanValue"in n?1:"integerValue"in n||"doubleValue"in n?2:"timestampValue"in n?3:"stringValue"in n?5:"bytesValue"in n?6:"referenceValue"in n?7:"geoPointValue"in n?8:"arrayValue"in n?9:"mapValue"in n?Rc(n)?4:Ag(n)?9007199254740991:Cc(n)?10:11:q(28295,{value:n})}function qt(n,e){if(n===e)return!0;const t=Dn(n);if(t!==Dn(e))return!1;switch(t){case 0:case 9007199254740991:return!0;case 1:return n.booleanValue===e.booleanValue;case 4:return Zi(n).isEqual(Zi(e));case 3:return(function(s,i){if(typeof s.timestampValue=="string"&&typeof i.timestampValue=="string"&&s.timestampValue.length===i.timestampValue.length)return s.timestampValue===i.timestampValue;const o=en(s.timestampValue),a=en(i.timestampValue);return o.seconds===a.seconds&&o.nanos===a.nanos})(n,e);case 5:return n.stringValue===e.stringValue;case 6:return(function(s,i){return tn(s.bytesValue).isEqual(tn(i.bytesValue))})(n,e);case 7:return n.referenceValue===e.referenceValue;case 8:return(function(s,i){return Ee(s.geoPointValue.latitude)===Ee(i.geoPointValue.latitude)&&Ee(s.geoPointValue.longitude)===Ee(i.geoPointValue.longitude)})(n,e);case 2:return(function(s,i){if("integerValue"in s&&"integerValue"in i)return Ee(s.integerValue)===Ee(i.integerValue);if("doubleValue"in s&&"doubleValue"in i){const o=Ee(s.doubleValue),a=Ee(i.doubleValue);return o===a?Qi(o)===Qi(a):isNaN(o)&&isNaN(a)}return!1})(n,e);case 9:return as(n.arrayValue.values||[],e.arrayValue.values||[],qt);case 10:case 11:return(function(s,i){const o=s.mapValue.fields||{},a=i.mapValue.fields||{};if(_p(o)!==_p(a))return!1;for(const l in o)if(o.hasOwnProperty(l)&&(a[l]===void 0||!qt(o[l],a[l])))return!1;return!0})(n,e);default:return q(52216,{left:n})}}function to(n,e){return(n.values||[]).find((t=>qt(t,e)))!==void 0}function xn(n,e){if(n===e)return 0;const t=Dn(n),r=Dn(e);if(t!==r)return j(t,r);switch(t){case 0:case 9007199254740991:return 0;case 1:return j(n.booleanValue,e.booleanValue);case 2:return(function(i,o){const a=Ee(i.integerValue||i.doubleValue),l=Ee(o.integerValue||o.doubleValue);return a<l?-1:a>l?1:a===l?0:isNaN(a)?isNaN(l)?0:-1:1})(n,e);case 3:return gp(n.timestampValue,e.timestampValue);case 4:return gp(Zi(n),Zi(e));case 5:return su(n.stringValue,e.stringValue);case 6:return(function(i,o){const a=tn(i),l=tn(o);return a.compareTo(l)})(n.bytesValue,e.bytesValue);case 7:return(function(i,o){const a=i.split("/"),l=o.split("/");for(let u=0;u<a.length&&u<l.length;u++){const d=j(a[u],l[u]);if(d!==0)return d}return j(a.length,l.length)})(n.referenceValue,e.referenceValue);case 8:return(function(i,o){const a=j(Ee(i.latitude),Ee(o.latitude));return a!==0?a:j(Ee(i.longitude),Ee(o.longitude))})(n.geoPointValue,e.geoPointValue);case 9:return yp(n.arrayValue,e.arrayValue);case 10:return(function(i,o){var _,g,v,C;const a=i.fields||{},l=o.fields||{},u=(_=a[_s])==null?void 0:_.arrayValue,d=(g=l[_s])==null?void 0:g.arrayValue,f=j(((v=u==null?void 0:u.values)==null?void 0:v.length)||0,((C=d==null?void 0:d.values)==null?void 0:C.length)||0);return f!==0?f:yp(u,d)})(n.mapValue,e.mapValue);case 11:return(function(i,o){if(i===wn.mapValue&&o===wn.mapValue)return 0;if(i===wn.mapValue)return 1;if(o===wn.mapValue)return-1;const a=i.fields||{},l=Object.keys(a),u=o.fields||{},d=Object.keys(u);l.sort(),d.sort();for(let f=0;f<l.length&&f<d.length;++f){const _=su(l[f],d[f]);if(_!==0)return _;const g=xn(a[l[f]],u[d[f]]);if(g!==0)return g}return j(l.length,d.length)})(n.mapValue,e.mapValue);default:throw q(23264,{he:t})}}function gp(n,e){if(typeof n=="string"&&typeof e=="string"&&n.length===e.length)return j(n,e);const t=en(n),r=en(e),s=j(t.seconds,r.seconds);return s!==0?s:j(t.nanos,r.nanos)}function yp(n,e){const t=n.values||[],r=e.values||[];for(let s=0;s<t.length&&s<r.length;++s){const i=xn(t[s],r[s]);if(i)return i}return j(t.length,r.length)}function ms(n){return du(n)}function du(n){return"nullValue"in n?"null":"booleanValue"in n?""+n.booleanValue:"integerValue"in n?""+n.integerValue:"doubleValue"in n?""+n.doubleValue:"timestampValue"in n?(function(t){const r=en(t);return`time(${r.seconds},${r.nanos})`})(n.timestampValue):"stringValue"in n?n.stringValue:"bytesValue"in n?(function(t){return tn(t).toBase64()})(n.bytesValue):"referenceValue"in n?(function(t){return M.fromName(t).toString()})(n.referenceValue):"geoPointValue"in n?(function(t){return`geo(${t.latitude},${t.longitude})`})(n.geoPointValue):"arrayValue"in n?(function(t){let r="[",s=!0;for(const i of t.values||[])s?s=!1:r+=",",r+=du(i);return r+"]"})(n.arrayValue):"mapValue"in n?(function(t){const r=Object.keys(t.fields||{}).sort();let s="{",i=!0;for(const o of r)i?i=!1:s+=",",s+=`${o}:${du(t.fields[o])}`;return s+"}"})(n.mapValue):q(61005,{value:n})}function Ea(n){switch(Dn(n)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const e=Sc(n);return e?16+Ea(e):16;case 5:return 2*n.stringValue.length;case 6:return tn(n.bytesValue).approximateByteSize();case 7:return n.referenceValue.length;case 9:return(function(r){return(r.values||[]).reduce(((s,i)=>s+Ea(i)),0)})(n.arrayValue);case 10:case 11:return(function(r){let s=0;return zn(r.fields,((i,o)=>{s+=i.length+Ea(o)})),s})(n.mapValue);default:throw q(13486,{value:n})}}function yr(n,e){return{referenceValue:`projects/${n.projectId}/databases/${n.database}/documents/${e.path.canonicalString()}`}}function fu(n){return!!n&&"integerValue"in n}function no(n){return!!n&&"arrayValue"in n}function Ip(n){return!!n&&"nullValue"in n}function Ep(n){return!!n&&"doubleValue"in n&&isNaN(Number(n.doubleValue))}function Ta(n){return!!n&&"mapValue"in n}function Cc(n){var t,r;return((r=(((t=n==null?void 0:n.mapValue)==null?void 0:t.fields)||{})[lh])==null?void 0:r.stringValue)===uh}function xi(n){if(n.geoPointValue)return{geoPointValue:{...n.geoPointValue}};if(n.timestampValue&&typeof n.timestampValue=="object")return{timestampValue:{...n.timestampValue}};if(n.mapValue){const e={mapValue:{fields:{}}};return zn(n.mapValue.fields,((t,r)=>e.mapValue.fields[t]=xi(r))),e}if(n.arrayValue){const e={arrayValue:{values:[]}};for(let t=0;t<(n.arrayValue.values||[]).length;++t)e.arrayValue.values[t]=xi(n.arrayValue.values[t]);return e}return{...n}}function Ag(n){return(((n.mapValue||{}).fields||{}).__type__||{}).stringValue===vg}const bg={mapValue:{fields:{[lh]:{stringValue:uh},[_s]:{arrayValue:{}}}}};function RA(n){return"nullValue"in n?Ia:"booleanValue"in n?{booleanValue:!1}:"integerValue"in n||"doubleValue"in n?{doubleValue:NaN}:"timestampValue"in n?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"stringValue"in n?{stringValue:""}:"bytesValue"in n?{bytesValue:""}:"referenceValue"in n?yr(kn.empty(),M.empty()):"geoPointValue"in n?{geoPointValue:{latitude:-90,longitude:-180}}:"arrayValue"in n?{arrayValue:{}}:"mapValue"in n?Cc(n)?bg:{mapValue:{}}:q(35942,{value:n})}function SA(n){return"nullValue"in n?{booleanValue:!1}:"booleanValue"in n?{doubleValue:NaN}:"integerValue"in n||"doubleValue"in n?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"timestampValue"in n?{stringValue:""}:"stringValue"in n?{bytesValue:""}:"bytesValue"in n?yr(kn.empty(),M.empty()):"referenceValue"in n?{geoPointValue:{latitude:-90,longitude:-180}}:"geoPointValue"in n?{arrayValue:{}}:"arrayValue"in n?bg:"mapValue"in n?Cc(n)?{mapValue:{}}:wn:q(61959,{value:n})}function Tp(n,e){const t=xn(n.value,e.value);return t!==0?t:n.inclusive&&!e.inclusive?-1:!n.inclusive&&e.inclusive?1:0}function wp(n,e){const t=xn(n.value,e.value);return t!==0?t:n.inclusive&&!e.inclusive?1:!n.inclusive&&e.inclusive?-1:0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class We{constructor(e){this.value=e}static empty(){return new We({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let r=0;r<e.length-1;++r)if(t=(t.mapValue.fields||{})[e.get(r)],!Ta(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=xi(t)}setAll(e){let t=Ie.emptyPath(),r={},s=[];e.forEach(((o,a)=>{if(!t.isImmediateParentOf(a)){const l=this.getFieldsMap(t);this.applyChanges(l,r,s),r={},s=[],t=a.popLast()}o?r[a.lastSegment()]=xi(o):s.push(a.lastSegment())}));const i=this.getFieldsMap(t);this.applyChanges(i,r,s)}delete(e){const t=this.field(e.popLast());Ta(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return qt(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let r=0;r<e.length;++r){let s=t.mapValue.fields[e.get(r)];Ta(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},t.mapValue.fields[e.get(r)]=s),t=s}return t.mapValue.fields}applyChanges(e,t,r){zn(t,((s,i)=>e[s]=i));for(const s of r)delete e[s]}clone(){return new We(xi(this.value))}}function Rg(n){const e=[];return zn(n.fields,((t,r)=>{const s=new Ie([t]);if(Ta(r)){const i=Rg(r.mapValue).fields;if(i.length===0)e.push(s);else for(const o of i)e.push(s.child(o))}else e.push(s)})),new ot(e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ye{constructor(e,t,r,s,i,o,a){this.key=e,this.documentType=t,this.version=r,this.readTime=s,this.createTime=i,this.data=o,this.documentState=a}static newInvalidDocument(e){return new ye(e,0,z.min(),z.min(),z.min(),We.empty(),0)}static newFoundDocument(e,t,r,s){return new ye(e,1,t,z.min(),r,s,0)}static newNoDocument(e,t){return new ye(e,2,t,z.min(),z.min(),We.empty(),0)}static newUnknownDocument(e,t){return new ye(e,3,t,z.min(),z.min(),We.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual(z.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=We.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=We.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=z.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof ye&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new ye(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
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
 */class Vn{constructor(e,t){this.position=e,this.inclusive=t}}function vp(n,e,t){let r=0;for(let s=0;s<n.position.length;s++){const i=e[s],o=n.position[s];if(i.field.isKeyField()?r=M.comparator(M.fromName(o.referenceValue),t.key):r=xn(o,t.data.field(i.field)),i.dir==="desc"&&(r*=-1),r!==0)break}return r}function Ap(n,e){if(n===null)return e===null;if(e===null||n.inclusive!==e.inclusive||n.position.length!==e.position.length)return!1;for(let t=0;t<n.position.length;t++)if(!qt(n.position[t],e.position[t]))return!1;return!0}/**
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
 */class ro{constructor(e,t="asc"){this.field=e,this.dir=t}}function CA(n,e){return n.dir===e.dir&&n.field.isEqual(e.field)}/**
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
 */class Sg{}class re extends Sg{constructor(e,t,r){super(),this.field=e,this.op=t,this.value=r}static create(e,t,r){return e.isKeyField()?t==="in"||t==="not-in"?this.createKeyFieldInFilter(e,t,r):new PA(e,t,r):t==="array-contains"?new DA(e,r):t==="in"?new xg(e,r):t==="not-in"?new xA(e,r):t==="array-contains-any"?new VA(e,r):new re(e,t,r)}static createKeyFieldInFilter(e,t,r){return t==="in"?new NA(e,r):new kA(e,r)}matches(e){const t=e.data.field(this.field);return this.op==="!="?t!==null&&t.nullValue===void 0&&this.matchesComparison(xn(t,this.value)):t!==null&&Dn(this.value)===Dn(t)&&this.matchesComparison(xn(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return q(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class le extends Sg{constructor(e,t){super(),this.filters=e,this.op=t,this.Pe=null}static create(e,t){return new le(e,t)}matches(e){return gs(this)?this.filters.find((t=>!t.matches(e)))===void 0:this.filters.find((t=>t.matches(e)))!==void 0}getFlattenedFilters(){return this.Pe!==null||(this.Pe=this.filters.reduce(((e,t)=>e.concat(t.getFlattenedFilters())),[])),this.Pe}getFilters(){return Object.assign([],this.filters)}}function gs(n){return n.op==="and"}function pu(n){return n.op==="or"}function hh(n){return Cg(n)&&gs(n)}function Cg(n){for(const e of n.filters)if(e instanceof le)return!1;return!0}function _u(n){if(n instanceof re)return n.field.canonicalString()+n.op.toString()+ms(n.value);if(hh(n))return n.filters.map((e=>_u(e))).join(",");{const e=n.filters.map((t=>_u(t))).join(",");return`${n.op}(${e})`}}function Pg(n,e){return n instanceof re?(function(r,s){return s instanceof re&&r.op===s.op&&r.field.isEqual(s.field)&&qt(r.value,s.value)})(n,e):n instanceof le?(function(r,s){return s instanceof le&&r.op===s.op&&r.filters.length===s.filters.length?r.filters.reduce(((i,o,a)=>i&&Pg(o,s.filters[a])),!0):!1})(n,e):void q(19439)}function Ng(n,e){const t=n.filters.concat(e);return le.create(t,n.op)}function kg(n){return n instanceof re?(function(t){return`${t.field.canonicalString()} ${t.op} ${ms(t.value)}`})(n):n instanceof le?(function(t){return t.op.toString()+" {"+t.getFilters().map(kg).join(" ,")+"}"})(n):"Filter"}class PA extends re{constructor(e,t,r){super(e,t,r),this.key=M.fromName(r.referenceValue)}matches(e){const t=M.comparator(e.key,this.key);return this.matchesComparison(t)}}class NA extends re{constructor(e,t){super(e,"in",t),this.keys=Dg("in",t)}matches(e){return this.keys.some((t=>t.isEqual(e.key)))}}class kA extends re{constructor(e,t){super(e,"not-in",t),this.keys=Dg("not-in",t)}matches(e){return!this.keys.some((t=>t.isEqual(e.key)))}}function Dg(n,e){var t;return(((t=e.arrayValue)==null?void 0:t.values)||[]).map((r=>M.fromName(r.referenceValue)))}class DA extends re{constructor(e,t){super(e,"array-contains",t)}matches(e){const t=e.data.field(this.field);return no(t)&&to(t.arrayValue,this.value)}}class xg extends re{constructor(e,t){super(e,"in",t)}matches(e){const t=e.data.field(this.field);return t!==null&&to(this.value.arrayValue,t)}}class xA extends re{constructor(e,t){super(e,"not-in",t)}matches(e){if(to(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const t=e.data.field(this.field);return t!==null&&t.nullValue===void 0&&!to(this.value.arrayValue,t)}}class VA extends re{constructor(e,t){super(e,"array-contains-any",t)}matches(e){const t=e.data.field(this.field);return!(!no(t)||!t.arrayValue.values)&&t.arrayValue.values.some((r=>to(this.value.arrayValue,r)))}}/**
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
 */class OA{constructor(e,t=null,r=[],s=[],i=null,o=null,a=null){this.path=e,this.collectionGroup=t,this.orderBy=r,this.filters=s,this.limit=i,this.startAt=o,this.endAt=a,this.Te=null}}function mu(n,e=null,t=[],r=[],s=null,i=null,o=null){return new OA(n,e,t,r,s,i,o)}function Ir(n){const e=L(n);if(e.Te===null){let t=e.path.canonicalString();e.collectionGroup!==null&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map((r=>_u(r))).join(","),t+="|ob:",t+=e.orderBy.map((r=>(function(i){return i.field.canonicalString()+i.dir})(r))).join(","),Eo(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map((r=>ms(r))).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map((r=>ms(r))).join(",")),e.Te=t}return e.Te}function wo(n,e){if(n.limit!==e.limit||n.orderBy.length!==e.orderBy.length)return!1;for(let t=0;t<n.orderBy.length;t++)if(!CA(n.orderBy[t],e.orderBy[t]))return!1;if(n.filters.length!==e.filters.length)return!1;for(let t=0;t<n.filters.length;t++)if(!Pg(n.filters[t],e.filters[t]))return!1;return n.collectionGroup===e.collectionGroup&&!!n.path.isEqual(e.path)&&!!Ap(n.startAt,e.startAt)&&Ap(n.endAt,e.endAt)}function La(n){return M.isDocumentKey(n.path)&&n.collectionGroup===null&&n.filters.length===0}function Fa(n,e){return n.filters.filter((t=>t instanceof re&&t.field.isEqual(e)))}function bp(n,e,t){let r=Ia,s=!0;for(const i of Fa(n,e)){let o=Ia,a=!0;switch(i.op){case"<":case"<=":o=RA(i.value);break;case"==":case"in":case">=":o=i.value;break;case">":o=i.value,a=!1;break;case"!=":case"not-in":o=Ia}Tp({value:r,inclusive:s},{value:o,inclusive:a})<0&&(r=o,s=a)}if(t!==null){for(let i=0;i<n.orderBy.length;++i)if(n.orderBy[i].field.isEqual(e)){const o=t.position[i];Tp({value:r,inclusive:s},{value:o,inclusive:t.inclusive})<0&&(r=o,s=t.inclusive);break}}return{value:r,inclusive:s}}function Rp(n,e,t){let r=wn,s=!0;for(const i of Fa(n,e)){let o=wn,a=!0;switch(i.op){case">=":case">":o=SA(i.value),a=!1;break;case"==":case"in":case"<=":o=i.value;break;case"<":o=i.value,a=!1;break;case"!=":case"not-in":o=wn}wp({value:r,inclusive:s},{value:o,inclusive:a})>0&&(r=o,s=a)}if(t!==null){for(let i=0;i<n.orderBy.length;++i)if(n.orderBy[i].field.isEqual(e)){const o=t.position[i];wp({value:r,inclusive:s},{value:o,inclusive:t.inclusive})>0&&(r=o,s=t.inclusive);break}}return{value:r,inclusive:s}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rn{constructor(e,t=null,r=[],s=[],i=null,o="F",a=null,l=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=r,this.filters=s,this.limit=i,this.limitType=o,this.startAt=a,this.endAt=l,this.Ie=null,this.Ee=null,this.de=null,this.startAt,this.endAt}}function Vg(n,e,t,r,s,i,o,a){return new rn(n,e,t,r,s,i,o,a)}function Ls(n){return new rn(n)}function Sp(n){return n.filters.length===0&&n.limit===null&&n.startAt==null&&n.endAt==null&&(n.explicitOrderBy.length===0||n.explicitOrderBy.length===1&&n.explicitOrderBy[0].field.isKeyField())}function dh(n){return n.collectionGroup!==null}function Zr(n){const e=L(n);if(e.Ie===null){e.Ie=[];const t=new Set;for(const i of e.explicitOrderBy)e.Ie.push(i),t.add(i.field.canonicalString());const r=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(o){let a=new he(Ie.comparator);return o.filters.forEach((l=>{l.getFlattenedFilters().forEach((u=>{u.isInequality()&&(a=a.add(u.field))}))})),a})(e).forEach((i=>{t.has(i.canonicalString())||i.isKeyField()||e.Ie.push(new ro(i,r))})),t.has(Ie.keyField().canonicalString())||e.Ie.push(new ro(Ie.keyField(),r))}return e.Ie}function Je(n){const e=L(n);return e.Ee||(e.Ee=Mg(e,Zr(n))),e.Ee}function Og(n){const e=L(n);return e.de||(e.de=Mg(e,n.explicitOrderBy)),e.de}function Mg(n,e){if(n.limitType==="F")return mu(n.path,n.collectionGroup,e,n.filters,n.limit,n.startAt,n.endAt);{e=e.map((s=>{const i=s.dir==="desc"?"asc":"desc";return new ro(s.field,i)}));const t=n.endAt?new Vn(n.endAt.position,n.endAt.inclusive):null,r=n.startAt?new Vn(n.startAt.position,n.startAt.inclusive):null;return mu(n.path,n.collectionGroup,e,n.filters,n.limit,t,r)}}function gu(n,e){const t=n.filters.concat([e]);return new rn(n.path,n.collectionGroup,n.explicitOrderBy.slice(),t,n.limit,n.limitType,n.startAt,n.endAt)}function Ua(n,e,t){return new rn(n.path,n.collectionGroup,n.explicitOrderBy.slice(),n.filters.slice(),e,t,n.startAt,n.endAt)}function vo(n,e){return wo(Je(n),Je(e))&&n.limitType===e.limitType}function Lg(n){return`${Ir(Je(n))}|lt:${n.limitType}`}function Qr(n){return`Query(target=${(function(t){let r=t.path.canonicalString();return t.collectionGroup!==null&&(r+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(r+=`, filters: [${t.filters.map((s=>kg(s))).join(", ")}]`),Eo(t.limit)||(r+=", limit: "+t.limit),t.orderBy.length>0&&(r+=`, orderBy: [${t.orderBy.map((s=>(function(o){return`${o.field.canonicalString()} (${o.dir})`})(s))).join(", ")}]`),t.startAt&&(r+=", startAt: ",r+=t.startAt.inclusive?"b:":"a:",r+=t.startAt.position.map((s=>ms(s))).join(",")),t.endAt&&(r+=", endAt: ",r+=t.endAt.inclusive?"a:":"b:",r+=t.endAt.position.map((s=>ms(s))).join(",")),`Target(${r})`})(Je(n))}; limitType=${n.limitType})`}function Ao(n,e){return e.isFoundDocument()&&(function(r,s){const i=s.key.path;return r.collectionGroup!==null?s.key.hasCollectionId(r.collectionGroup)&&r.path.isPrefixOf(i):M.isDocumentKey(r.path)?r.path.isEqual(i):r.path.isImmediateParentOf(i)})(n,e)&&(function(r,s){for(const i of Zr(r))if(!i.field.isKeyField()&&s.data.field(i.field)===null)return!1;return!0})(n,e)&&(function(r,s){for(const i of r.filters)if(!i.matches(s))return!1;return!0})(n,e)&&(function(r,s){return!(r.startAt&&!(function(o,a,l){const u=vp(o,a,l);return o.inclusive?u<=0:u<0})(r.startAt,Zr(r),s)||r.endAt&&!(function(o,a,l){const u=vp(o,a,l);return o.inclusive?u>=0:u>0})(r.endAt,Zr(r),s))})(n,e)}function Fg(n){return n.collectionGroup||(n.path.length%2==1?n.path.lastSegment():n.path.get(n.path.length-2))}function Ug(n){return(e,t)=>{let r=!1;for(const s of Zr(n)){const i=MA(s,e,t);if(i!==0)return i;r=r||s.field.isKeyField()}return 0}}function MA(n,e,t){const r=n.field.isKeyField()?M.comparator(e.key,t.key):(function(i,o,a){const l=o.data.field(i),u=a.data.field(i);return l!==null&&u!==null?xn(l,u):q(42886)})(n.field,e,t);switch(n.dir){case"asc":return r;case"desc":return-1*r;default:return q(19790,{direction:n.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sn{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){const t=this.mapKeyFn(e),r=this.inner[t];if(r!==void 0){for(const[s,i]of r)if(this.equalsFn(s,e))return i}}has(e){return this.get(e)!==void 0}set(e,t){const r=this.mapKeyFn(e),s=this.inner[r];if(s===void 0)return this.inner[r]=[[e,t]],void this.innerSize++;for(let i=0;i<s.length;i++)if(this.equalsFn(s[i][0],e))return void(s[i]=[e,t]);s.push([e,t]),this.innerSize++}delete(e){const t=this.mapKeyFn(e),r=this.inner[t];if(r===void 0)return!1;for(let s=0;s<r.length;s++)if(this.equalsFn(r[s][0],e))return r.length===1?delete this.inner[t]:r.splice(s,1),this.innerSize--,!0;return!1}forEach(e){zn(this.inner,((t,r)=>{for(const[s,i]of r)e(s,i)}))}isEmpty(){return gg(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const LA=new Ae(M.comparator);function at(){return LA}const Bg=new Ae(M.comparator);function Ai(...n){let e=Bg;for(const t of n)e=e.insert(t.key,t);return e}function qg(n){let e=Bg;return n.forEach(((t,r)=>e=e.insert(t,r.overlayedDocument))),e}function Ot(){return Vi()}function Gg(){return Vi()}function Vi(){return new sn((n=>n.toString()),((n,e)=>n.isEqual(e)))}const FA=new Ae(M.comparator),UA=new he(M.comparator);function K(...n){let e=UA;for(const t of n)e=e.add(t);return e}const BA=new he(j);function fh(){return BA}/**
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
 */function ph(n,e){if(n.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:Qi(e)?"-0":e}}function zg(n){return{integerValue:""+n}}function $g(n,e){return ig(e)?zg(e):ph(n,e)}/**
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
 */class Pc{constructor(){this._=void 0}}function qA(n,e,t){return n instanceof ys?(function(s,i){const o={fields:{[Eg]:{stringValue:Ig},[wg]:{timestampValue:{seconds:s.seconds,nanos:s.nanoseconds}}}};return i&&Rc(i)&&(i=Sc(i)),i&&(o.fields[Tg]=i),{mapValue:o}})(t,e):n instanceof Er?Wg(n,e):n instanceof Tr?Kg(n,e):(function(s,i){const o=jg(s,i),a=Cp(o)+Cp(s.Ae);return fu(o)&&fu(s.Ae)?zg(a):ph(s.serializer,a)})(n,e)}function GA(n,e,t){return n instanceof Er?Wg(n,e):n instanceof Tr?Kg(n,e):t}function jg(n,e){return n instanceof Is?(function(r){return fu(r)||(function(i){return!!i&&"doubleValue"in i})(r)})(e)?e:{integerValue:0}:null}class ys extends Pc{}class Er extends Pc{constructor(e){super(),this.elements=e}}function Wg(n,e){const t=Hg(e);for(const r of n.elements)t.some((s=>qt(s,r)))||t.push(r);return{arrayValue:{values:t}}}class Tr extends Pc{constructor(e){super(),this.elements=e}}function Kg(n,e){let t=Hg(e);for(const r of n.elements)t=t.filter((s=>!qt(s,r)));return{arrayValue:{values:t}}}class Is extends Pc{constructor(e,t){super(),this.serializer=e,this.Ae=t}}function Cp(n){return Ee(n.integerValue||n.doubleValue)}function Hg(n){return no(n)&&n.arrayValue.values?n.arrayValue.values.slice():[]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bo{constructor(e,t){this.field=e,this.transform=t}}function zA(n,e){return n.field.isEqual(e.field)&&(function(r,s){return r instanceof Er&&s instanceof Er||r instanceof Tr&&s instanceof Tr?as(r.elements,s.elements,qt):r instanceof Is&&s instanceof Is?qt(r.Ae,s.Ae):r instanceof ys&&s instanceof ys})(n.transform,e.transform)}class $A{constructor(e,t){this.version=e,this.transformResults=t}}class Te{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new Te}static exists(e){return new Te(void 0,e)}static updateTime(e){return new Te(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function wa(n,e){return n.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(n.updateTime):n.exists===void 0||n.exists===e.isFoundDocument()}class Nc{}function Qg(n,e){if(!n.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return n.isNoDocument()?new Us(n.key,Te.none()):new Fs(n.key,n.data,Te.none());{const t=n.data,r=We.empty();let s=new he(Ie.comparator);for(let i of e.fields)if(!s.has(i)){let o=t.field(i);o===null&&i.length>1&&(i=i.popLast(),o=t.field(i)),o===null?r.delete(i):r.set(i,o),s=s.add(i)}return new on(n.key,r,new ot(s.toArray()),Te.none())}}function jA(n,e,t){n instanceof Fs?(function(s,i,o){const a=s.value.clone(),l=Np(s.fieldTransforms,i,o.transformResults);a.setAll(l),i.convertToFoundDocument(o.version,a).setHasCommittedMutations()})(n,e,t):n instanceof on?(function(s,i,o){if(!wa(s.precondition,i))return void i.convertToUnknownDocument(o.version);const a=Np(s.fieldTransforms,i,o.transformResults),l=i.data;l.setAll(Yg(s)),l.setAll(a),i.convertToFoundDocument(o.version,l).setHasCommittedMutations()})(n,e,t):(function(s,i,o){i.convertToNoDocument(o.version).setHasCommittedMutations()})(0,e,t)}function Oi(n,e,t,r){return n instanceof Fs?(function(i,o,a,l){if(!wa(i.precondition,o))return a;const u=i.value.clone(),d=kp(i.fieldTransforms,l,o);return u.setAll(d),o.convertToFoundDocument(o.version,u).setHasLocalMutations(),null})(n,e,t,r):n instanceof on?(function(i,o,a,l){if(!wa(i.precondition,o))return a;const u=kp(i.fieldTransforms,l,o),d=o.data;return d.setAll(Yg(i)),d.setAll(u),o.convertToFoundDocument(o.version,d).setHasLocalMutations(),a===null?null:a.unionWith(i.fieldMask.fields).unionWith(i.fieldTransforms.map((f=>f.field)))})(n,e,t,r):(function(i,o,a){return wa(i.precondition,o)?(o.convertToNoDocument(o.version).setHasLocalMutations(),null):a})(n,e,t)}function WA(n,e){let t=null;for(const r of n.fieldTransforms){const s=e.data.field(r.field),i=jg(r.transform,s||null);i!=null&&(t===null&&(t=We.empty()),t.set(r.field,i))}return t||null}function Pp(n,e){return n.type===e.type&&!!n.key.isEqual(e.key)&&!!n.precondition.isEqual(e.precondition)&&!!(function(r,s){return r===void 0&&s===void 0||!(!r||!s)&&as(r,s,((i,o)=>zA(i,o)))})(n.fieldTransforms,e.fieldTransforms)&&(n.type===0?n.value.isEqual(e.value):n.type!==1||n.data.isEqual(e.data)&&n.fieldMask.isEqual(e.fieldMask))}class Fs extends Nc{constructor(e,t,r,s=[]){super(),this.key=e,this.value=t,this.precondition=r,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}}class on extends Nc{constructor(e,t,r,s,i=[]){super(),this.key=e,this.data=t,this.fieldMask=r,this.precondition=s,this.fieldTransforms=i,this.type=1}getFieldMask(){return this.fieldMask}}function Yg(n){const e=new Map;return n.fieldMask.fields.forEach((t=>{if(!t.isEmpty()){const r=n.data.field(t);e.set(t,r)}})),e}function Np(n,e,t){const r=new Map;G(n.length===t.length,32656,{Re:t.length,Ve:n.length});for(let s=0;s<t.length;s++){const i=n[s],o=i.transform,a=e.data.field(i.field);r.set(i.field,GA(o,a,t[s]))}return r}function kp(n,e,t){const r=new Map;for(const s of n){const i=s.transform,o=t.data.field(s.field);r.set(s.field,qA(i,o,e))}return r}class Us extends Nc{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class _h extends Nc{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mh{constructor(e,t,r,s){this.batchId=e,this.localWriteTime=t,this.baseMutations=r,this.mutations=s}applyToRemoteDocument(e,t){const r=t.mutationResults;for(let s=0;s<this.mutations.length;s++){const i=this.mutations[s];i.key.isEqual(e.key)&&jA(i,e,r[s])}}applyToLocalView(e,t){for(const r of this.baseMutations)r.key.isEqual(e.key)&&(t=Oi(r,e,t,this.localWriteTime));for(const r of this.mutations)r.key.isEqual(e.key)&&(t=Oi(r,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){const r=Gg();return this.mutations.forEach((s=>{const i=e.get(s.key),o=i.overlayedDocument;let a=this.applyToLocalView(o,i.mutatedFields);a=t.has(s.key)?null:a;const l=Qg(o,a);l!==null&&r.set(s.key,l),o.isValidDocument()||o.convertToNoDocument(z.min())})),r}keys(){return this.mutations.reduce(((e,t)=>e.add(t.key)),K())}isEqual(e){return this.batchId===e.batchId&&as(this.mutations,e.mutations,((t,r)=>Pp(t,r)))&&as(this.baseMutations,e.baseMutations,((t,r)=>Pp(t,r)))}}class gh{constructor(e,t,r,s){this.batch=e,this.commitVersion=t,this.mutationResults=r,this.docVersions=s}static from(e,t,r){G(e.mutations.length===r.length,58842,{me:e.mutations.length,fe:r.length});let s=(function(){return FA})();const i=e.mutations;for(let o=0;o<i.length;o++)s=s.insert(i[o].key,r[o].version);return new gh(e,t,r,s)}}/**
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
 */class yh{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
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
 */class Jg{constructor(e,t,r){this.alias=e,this.aggregateType=t,this.fieldPath=r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class KA{constructor(e,t){this.count=e,this.unchangedNames=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var xe,ie;function Xg(n){switch(n){case S.OK:return q(64938);case S.CANCELLED:case S.UNKNOWN:case S.DEADLINE_EXCEEDED:case S.RESOURCE_EXHAUSTED:case S.INTERNAL:case S.UNAVAILABLE:case S.UNAUTHENTICATED:return!1;case S.INVALID_ARGUMENT:case S.NOT_FOUND:case S.ALREADY_EXISTS:case S.PERMISSION_DENIED:case S.FAILED_PRECONDITION:case S.ABORTED:case S.OUT_OF_RANGE:case S.UNIMPLEMENTED:case S.DATA_LOSS:return!0;default:return q(15467,{code:n})}}function Zg(n){if(n===void 0)return Ne("GRPC error has no .code"),S.UNKNOWN;switch(n){case xe.OK:return S.OK;case xe.CANCELLED:return S.CANCELLED;case xe.UNKNOWN:return S.UNKNOWN;case xe.DEADLINE_EXCEEDED:return S.DEADLINE_EXCEEDED;case xe.RESOURCE_EXHAUSTED:return S.RESOURCE_EXHAUSTED;case xe.INTERNAL:return S.INTERNAL;case xe.UNAVAILABLE:return S.UNAVAILABLE;case xe.UNAUTHENTICATED:return S.UNAUTHENTICATED;case xe.INVALID_ARGUMENT:return S.INVALID_ARGUMENT;case xe.NOT_FOUND:return S.NOT_FOUND;case xe.ALREADY_EXISTS:return S.ALREADY_EXISTS;case xe.PERMISSION_DENIED:return S.PERMISSION_DENIED;case xe.FAILED_PRECONDITION:return S.FAILED_PRECONDITION;case xe.ABORTED:return S.ABORTED;case xe.OUT_OF_RANGE:return S.OUT_OF_RANGE;case xe.UNIMPLEMENTED:return S.UNIMPLEMENTED;case xe.DATA_LOSS:return S.DATA_LOSS;default:return q(39323,{code:n})}}(ie=xe||(xe={}))[ie.OK=0]="OK",ie[ie.CANCELLED=1]="CANCELLED",ie[ie.UNKNOWN=2]="UNKNOWN",ie[ie.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",ie[ie.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",ie[ie.NOT_FOUND=5]="NOT_FOUND",ie[ie.ALREADY_EXISTS=6]="ALREADY_EXISTS",ie[ie.PERMISSION_DENIED=7]="PERMISSION_DENIED",ie[ie.UNAUTHENTICATED=16]="UNAUTHENTICATED",ie[ie.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",ie[ie.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",ie[ie.ABORTED=10]="ABORTED",ie[ie.OUT_OF_RANGE=11]="OUT_OF_RANGE",ie[ie.UNIMPLEMENTED=12]="UNIMPLEMENTED",ie[ie.INTERNAL=13]="INTERNAL",ie[ie.UNAVAILABLE=14]="UNAVAILABLE",ie[ie.DATA_LOSS=15]="DATA_LOSS";/**
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
 */let Mi=null;/**
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
 */function ey(){return new TextEncoder}/**
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
 */const HA=new bn([4294967295,4294967295],0);function Dp(n){const e=ey().encode(n),t=new qm;return t.update(e),new Uint8Array(t.digest())}function xp(n){const e=new DataView(n.buffer),t=e.getUint32(0,!0),r=e.getUint32(4,!0),s=e.getUint32(8,!0),i=e.getUint32(12,!0);return[new bn([t,r],0),new bn([s,i],0)]}class Ih{constructor(e,t,r){if(this.bitmap=e,this.padding=t,this.hashCount=r,t<0||t>=8)throw new bi(`Invalid padding: ${t}`);if(r<0)throw new bi(`Invalid hash count: ${r}`);if(e.length>0&&this.hashCount===0)throw new bi(`Invalid hash count: ${r}`);if(e.length===0&&t!==0)throw new bi(`Invalid padding when bitmap length is 0: ${t}`);this.ge=8*e.length-t,this.pe=bn.fromNumber(this.ge)}ye(e,t,r){let s=e.add(t.multiply(bn.fromNumber(r)));return s.compare(HA)===1&&(s=new bn([s.getBits(0),s.getBits(1)],0)),s.modulo(this.pe).toNumber()}we(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(this.ge===0)return!1;const t=Dp(e),[r,s]=xp(t);for(let i=0;i<this.hashCount;i++){const o=this.ye(r,s,i);if(!this.we(o))return!1}return!0}static create(e,t,r){const s=e%8==0?0:8-e%8,i=new Uint8Array(Math.ceil(e/8)),o=new Ih(i,s,t);return r.forEach((a=>o.insert(a))),o}insert(e){if(this.ge===0)return;const t=Dp(e),[r,s]=xp(t);for(let i=0;i<this.hashCount;i++){const o=this.ye(r,s,i);this.Se(o)}}Se(e){const t=Math.floor(e/8),r=e%8;this.bitmap[t]|=1<<r}}class bi extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ro{constructor(e,t,r,s,i){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=r,this.documentUpdates=s,this.resolvedLimboDocuments=i}static createSynthesizedRemoteEventForCurrentChange(e,t,r){const s=new Map;return s.set(e,So.createSynthesizedTargetChangeForCurrentChange(e,t,r)),new Ro(z.min(),s,new Ae(j),at(),K())}}class So{constructor(e,t,r,s,i){this.resumeToken=e,this.current=t,this.addedDocuments=r,this.modifiedDocuments=s,this.removedDocuments=i}static createSynthesizedTargetChangeForCurrentChange(e,t,r){return new So(r,t,K(),K(),K())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class va{constructor(e,t,r,s){this.be=e,this.removedTargetIds=t,this.key=r,this.De=s}}class ty{constructor(e,t){this.targetId=e,this.Ce=t}}class ny{constructor(e,t,r=be.EMPTY_BYTE_STRING,s=null){this.state=e,this.targetIds=t,this.resumeToken=r,this.cause=s}}class Vp{constructor(){this.ve=0,this.Fe=Op(),this.Me=be.EMPTY_BYTE_STRING,this.xe=!1,this.Oe=!0}get current(){return this.xe}get resumeToken(){return this.Me}get Ne(){return this.ve!==0}get Be(){return this.Oe}Le(e){e.approximateByteSize()>0&&(this.Oe=!0,this.Me=e)}ke(){let e=K(),t=K(),r=K();return this.Fe.forEach(((s,i)=>{switch(i){case 0:e=e.add(s);break;case 2:t=t.add(s);break;case 1:r=r.add(s);break;default:q(38017,{changeType:i})}})),new So(this.Me,this.xe,e,t,r)}qe(){this.Oe=!1,this.Fe=Op()}Qe(e,t){this.Oe=!0,this.Fe=this.Fe.insert(e,t)}$e(e){this.Oe=!0,this.Fe=this.Fe.remove(e)}Ue(){this.ve+=1}Ke(){this.ve-=1,G(this.ve>=0,3241,{ve:this.ve})}We(){this.Oe=!0,this.xe=!0}}class QA{constructor(e){this.Ge=e,this.ze=new Map,this.je=at(),this.Je=ia(),this.He=ia(),this.Ye=new Ae(j)}Ze(e){for(const t of e.be)e.De&&e.De.isFoundDocument()?this.Xe(t,e.De):this.et(t,e.key,e.De);for(const t of e.removedTargetIds)this.et(t,e.key,e.De)}tt(e){this.forEachTarget(e,(t=>{const r=this.nt(t);switch(e.state){case 0:this.rt(t)&&r.Le(e.resumeToken);break;case 1:r.Ke(),r.Ne||r.qe(),r.Le(e.resumeToken);break;case 2:r.Ke(),r.Ne||this.removeTarget(t);break;case 3:this.rt(t)&&(r.We(),r.Le(e.resumeToken));break;case 4:this.rt(t)&&(this.it(t),r.Le(e.resumeToken));break;default:q(56790,{state:e.state})}}))}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.ze.forEach(((r,s)=>{this.rt(s)&&t(s)}))}st(e){const t=e.targetId,r=e.Ce.count,s=this.ot(t);if(s){const i=s.target;if(La(i))if(r===0){const o=new M(i.path);this.et(t,o,ye.newNoDocument(o,z.min()))}else G(r===1,20013,{expectedCount:r});else{const o=this._t(t);if(o!==r){const a=this.ut(e),l=a?this.ct(a,e,o):1;if(l!==0){this.it(t);const u=l===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Ye=this.Ye.insert(t,u)}Mi==null||Mi.lt((function(d,f,_,g,v){var V,B,U;const C={localCacheCount:d,existenceFilterCount:f.count,databaseId:_.database,projectId:_.projectId},N=f.unchangedNames;return N&&(C.bloomFilter={applied:v===0,hashCount:(N==null?void 0:N.hashCount)??0,bitmapLength:((B=(V=N==null?void 0:N.bits)==null?void 0:V.bitmap)==null?void 0:B.length)??0,padding:((U=N==null?void 0:N.bits)==null?void 0:U.padding)??0,mightContain:$=>(g==null?void 0:g.mightContain($))??!1}),C})(o,e.Ce,this.Ge.ht(),a,l))}}}}ut(e){const t=e.Ce.unchangedNames;if(!t||!t.bits)return null;const{bits:{bitmap:r="",padding:s=0},hashCount:i=0}=t;let o,a;try{o=tn(r).toUint8Array()}catch(l){if(l instanceof yg)return yt("Decoding the base64 bloom filter in existence filter failed ("+l.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw l}try{a=new Ih(o,s,i)}catch(l){return yt(l instanceof bi?"BloomFilter error: ":"Applying bloom filter failed: ",l),null}return a.ge===0?null:a}ct(e,t,r){return t.Ce.count===r-this.Pt(e,t.targetId)?0:2}Pt(e,t){const r=this.Ge.getRemoteKeysForTarget(t);let s=0;return r.forEach((i=>{const o=this.Ge.ht(),a=`projects/${o.projectId}/databases/${o.database}/documents/${i.path.canonicalString()}`;e.mightContain(a)||(this.et(t,i,null),s++)})),s}Tt(e){const t=new Map;this.ze.forEach(((i,o)=>{const a=this.ot(o);if(a){if(i.current&&La(a.target)){const l=new M(a.target.path);this.It(l).has(o)||this.Et(o,l)||this.et(o,l,ye.newNoDocument(l,e))}i.Be&&(t.set(o,i.ke()),i.qe())}}));let r=K();this.He.forEach(((i,o)=>{let a=!0;o.forEachWhile((l=>{const u=this.ot(l);return!u||u.purpose==="TargetPurposeLimboResolution"||(a=!1,!1)})),a&&(r=r.add(i))})),this.je.forEach(((i,o)=>o.setReadTime(e)));const s=new Ro(e,t,this.Ye,this.je,r);return this.je=at(),this.Je=ia(),this.He=ia(),this.Ye=new Ae(j),s}Xe(e,t){if(!this.rt(e))return;const r=this.Et(e,t.key)?2:0;this.nt(e).Qe(t.key,r),this.je=this.je.insert(t.key,t),this.Je=this.Je.insert(t.key,this.It(t.key).add(e)),this.He=this.He.insert(t.key,this.dt(t.key).add(e))}et(e,t,r){if(!this.rt(e))return;const s=this.nt(e);this.Et(e,t)?s.Qe(t,1):s.$e(t),this.He=this.He.insert(t,this.dt(t).delete(e)),this.He=this.He.insert(t,this.dt(t).add(e)),r&&(this.je=this.je.insert(t,r))}removeTarget(e){this.ze.delete(e)}_t(e){const t=this.nt(e).ke();return this.Ge.getRemoteKeysForTarget(e).size+t.addedDocuments.size-t.removedDocuments.size}Ue(e){this.nt(e).Ue()}nt(e){let t=this.ze.get(e);return t||(t=new Vp,this.ze.set(e,t)),t}dt(e){let t=this.He.get(e);return t||(t=new he(j),this.He=this.He.insert(e,t)),t}It(e){let t=this.Je.get(e);return t||(t=new he(j),this.Je=this.Je.insert(e,t)),t}rt(e){const t=this.ot(e)!==null;return t||x("WatchChangeAggregator","Detected inactive target",e),t}ot(e){const t=this.ze.get(e);return t&&t.Ne?null:this.Ge.At(e)}it(e){this.ze.set(e,new Vp),this.Ge.getRemoteKeysForTarget(e).forEach((t=>{this.et(e,t,null)}))}Et(e,t){return this.Ge.getRemoteKeysForTarget(e).has(t)}}function ia(){return new Ae(M.comparator)}function Op(){return new Ae(M.comparator)}const YA={asc:"ASCENDING",desc:"DESCENDING"},JA={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},XA={and:"AND",or:"OR"};class ZA{constructor(e,t){this.databaseId=e,this.useProto3Json=t}}function yu(n,e){return n.useProto3Json||Eo(e)?e:{value:e}}function Es(n,e){return n.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function ry(n,e){return n.useProto3Json?e.toBase64():e.toUint8Array()}function eb(n,e){return Es(n,e.toTimestamp())}function De(n){return G(!!n,49232),z.fromTimestamp((function(t){const r=en(t);return new ce(r.seconds,r.nanos)})(n))}function Eh(n,e){return Iu(n,e).canonicalString()}function Iu(n,e){const t=(function(s){return new X(["projects",s.projectId,"databases",s.database])})(n).child("documents");return e===void 0?t:t.child(e)}function sy(n){const e=X.fromString(n);return G(fy(e),10190,{key:e.toString()}),e}function so(n,e){return Eh(n.databaseId,e.path)}function Ut(n,e){const t=sy(e);if(t.get(1)!==n.databaseId.projectId)throw new D(S.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+t.get(1)+" vs "+n.databaseId.projectId);if(t.get(3)!==n.databaseId.database)throw new D(S.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+t.get(3)+" vs "+n.databaseId.database);return new M(ay(t))}function iy(n,e){return Eh(n.databaseId,e)}function oy(n){const e=sy(n);return e.length===4?X.emptyPath():ay(e)}function Eu(n){return new X(["projects",n.databaseId.projectId,"databases",n.databaseId.database]).canonicalString()}function ay(n){return G(n.length>4&&n.get(4)==="documents",29091,{key:n.toString()}),n.popFirst(5)}function Mp(n,e,t){return{name:so(n,e),fields:t.value.mapValue.fields}}function kc(n,e,t){const r=Ut(n,e.name),s=De(e.updateTime),i=e.createTime?De(e.createTime):z.min(),o=new We({mapValue:{fields:e.fields}}),a=ye.newFoundDocument(r,s,i,o);return t&&a.setHasCommittedMutations(),t?a.setHasCommittedMutations():a}function tb(n,e){return"found"in e?(function(r,s){G(!!s.found,43571),s.found.name,s.found.updateTime;const i=Ut(r,s.found.name),o=De(s.found.updateTime),a=s.found.createTime?De(s.found.createTime):z.min(),l=new We({mapValue:{fields:s.found.fields}});return ye.newFoundDocument(i,o,a,l)})(n,e):"missing"in e?(function(r,s){G(!!s.missing,3894),G(!!s.readTime,22933);const i=Ut(r,s.missing),o=De(s.readTime);return ye.newNoDocument(i,o)})(n,e):q(7234,{result:e})}function nb(n,e){let t;if("targetChange"in e){e.targetChange;const r=(function(u){return u==="NO_CHANGE"?0:u==="ADD"?1:u==="REMOVE"?2:u==="CURRENT"?3:u==="RESET"?4:q(39313,{state:u})})(e.targetChange.targetChangeType||"NO_CHANGE"),s=e.targetChange.targetIds||[],i=(function(u,d){return u.useProto3Json?(G(d===void 0||typeof d=="string",58123),be.fromBase64String(d||"")):(G(d===void 0||d instanceof Buffer||d instanceof Uint8Array,16193),be.fromUint8Array(d||new Uint8Array))})(n,e.targetChange.resumeToken),o=e.targetChange.cause,a=o&&(function(u){const d=u.code===void 0?S.UNKNOWN:Zg(u.code);return new D(d,u.message||"")})(o);t=new ny(r,s,i,a||null)}else if("documentChange"in e){e.documentChange;const r=e.documentChange;r.document,r.document.name,r.document.updateTime;const s=Ut(n,r.document.name),i=De(r.document.updateTime),o=r.document.createTime?De(r.document.createTime):z.min(),a=new We({mapValue:{fields:r.document.fields}}),l=ye.newFoundDocument(s,i,o,a),u=r.targetIds||[],d=r.removedTargetIds||[];t=new va(u,d,l.key,l)}else if("documentDelete"in e){e.documentDelete;const r=e.documentDelete;r.document;const s=Ut(n,r.document),i=r.readTime?De(r.readTime):z.min(),o=ye.newNoDocument(s,i),a=r.removedTargetIds||[];t=new va([],a,o.key,o)}else if("documentRemove"in e){e.documentRemove;const r=e.documentRemove;r.document;const s=Ut(n,r.document),i=r.removedTargetIds||[];t=new va([],i,s,null)}else{if(!("filter"in e))return q(11601,{Rt:e});{e.filter;const r=e.filter;r.targetId;const{count:s=0,unchangedNames:i}=r,o=new KA(s,i),a=r.targetId;t=new ty(a,o)}}return t}function io(n,e){let t;if(e instanceof Fs)t={update:Mp(n,e.key,e.value)};else if(e instanceof Us)t={delete:so(n,e.key)};else if(e instanceof on)t={update:Mp(n,e.key,e.data),updateMask:cb(e.fieldMask)};else{if(!(e instanceof _h))return q(16599,{Vt:e.type});t={verify:so(n,e.key)}}return e.fieldTransforms.length>0&&(t.updateTransforms=e.fieldTransforms.map((r=>(function(i,o){const a=o.transform;if(a instanceof ys)return{fieldPath:o.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(a instanceof Er)return{fieldPath:o.field.canonicalString(),appendMissingElements:{values:a.elements}};if(a instanceof Tr)return{fieldPath:o.field.canonicalString(),removeAllFromArray:{values:a.elements}};if(a instanceof Is)return{fieldPath:o.field.canonicalString(),increment:a.Ae};throw q(20930,{transform:o.transform})})(0,r)))),e.precondition.isNone||(t.currentDocument=(function(s,i){return i.updateTime!==void 0?{updateTime:eb(s,i.updateTime)}:i.exists!==void 0?{exists:i.exists}:q(27497)})(n,e.precondition)),t}function Tu(n,e){const t=e.currentDocument?(function(i){return i.updateTime!==void 0?Te.updateTime(De(i.updateTime)):i.exists!==void 0?Te.exists(i.exists):Te.none()})(e.currentDocument):Te.none(),r=e.updateTransforms?e.updateTransforms.map((s=>(function(o,a){let l=null;if("setToServerValue"in a)G(a.setToServerValue==="REQUEST_TIME",16630,{proto:a}),l=new ys;else if("appendMissingElements"in a){const d=a.appendMissingElements.values||[];l=new Er(d)}else if("removeAllFromArray"in a){const d=a.removeAllFromArray.values||[];l=new Tr(d)}else"increment"in a?l=new Is(o,a.increment):q(16584,{proto:a});const u=Ie.fromServerFormat(a.fieldPath);return new bo(u,l)})(n,s))):[];if(e.update){e.update.name;const s=Ut(n,e.update.name),i=new We({mapValue:{fields:e.update.fields}});if(e.updateMask){const o=(function(l){const u=l.fieldPaths||[];return new ot(u.map((d=>Ie.fromServerFormat(d))))})(e.updateMask);return new on(s,i,o,t,r)}return new Fs(s,i,t,r)}if(e.delete){const s=Ut(n,e.delete);return new Us(s,t)}if(e.verify){const s=Ut(n,e.verify);return new _h(s,t)}return q(1463,{proto:e})}function rb(n,e){return n&&n.length>0?(G(e!==void 0,14353),n.map((t=>(function(s,i){let o=s.updateTime?De(s.updateTime):De(i);return o.isEqual(z.min())&&(o=De(i)),new $A(o,s.transformResults||[])})(t,e)))):[]}function cy(n,e){return{documents:[iy(n,e.path)]}}function Dc(n,e){const t={structuredQuery:{}},r=e.path;let s;e.collectionGroup!==null?(s=r,t.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(s=r.popLast(),t.structuredQuery.from=[{collectionId:r.lastSegment()}]),t.parent=iy(n,s);const i=(function(u){if(u.length!==0)return dy(le.create(u,"and"))})(e.filters);i&&(t.structuredQuery.where=i);const o=(function(u){if(u.length!==0)return u.map((d=>(function(_){return{field:In(_.field),direction:ib(_.dir)}})(d)))})(e.orderBy);o&&(t.structuredQuery.orderBy=o);const a=yu(n,e.limit);return a!==null&&(t.structuredQuery.limit=a),e.startAt&&(t.structuredQuery.startAt=(function(u){return{before:u.inclusive,values:u.position}})(e.startAt)),e.endAt&&(t.structuredQuery.endAt=(function(u){return{before:!u.inclusive,values:u.position}})(e.endAt)),{ft:t,parent:s}}function ly(n,e,t,r){const{ft:s,parent:i}=Dc(n,e),o={},a=[];let l=0;return t.forEach((u=>{const d=r?u.alias:"aggregate_"+l++;o[d]=u.alias,u.aggregateType==="count"?a.push({alias:d,count:{}}):u.aggregateType==="avg"?a.push({alias:d,avg:{field:In(u.fieldPath)}}):u.aggregateType==="sum"&&a.push({alias:d,sum:{field:In(u.fieldPath)}})})),{request:{structuredAggregationQuery:{aggregations:a,structuredQuery:s.structuredQuery},parent:s.parent},gt:o,parent:i}}function uy(n){let e=oy(n.parent);const t=n.structuredQuery,r=t.from?t.from.length:0;let s=null;if(r>0){G(r===1,65062);const d=t.from[0];d.allDescendants?s=d.collectionId:e=e.child(d.collectionId)}let i=[];t.where&&(i=(function(f){const _=hy(f);return _ instanceof le&&hh(_)?_.getFilters():[_]})(t.where));let o=[];t.orderBy&&(o=(function(f){return f.map((_=>(function(v){return new ro(Yr(v.field),(function(N){switch(N){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}})(v.direction))})(_)))})(t.orderBy));let a=null;t.limit&&(a=(function(f){let _;return _=typeof f=="object"?f.value:f,Eo(_)?null:_})(t.limit));let l=null;t.startAt&&(l=(function(f){const _=!!f.before,g=f.values||[];return new Vn(g,_)})(t.startAt));let u=null;return t.endAt&&(u=(function(f){const _=!f.before,g=f.values||[];return new Vn(g,_)})(t.endAt)),Vg(e,s,o,i,a,"F",l,u)}function sb(n,e){const t=(function(s){switch(s){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return q(28987,{purpose:s})}})(e.purpose);return t==null?null:{"goog-listen-tags":t}}function hy(n){return n.unaryFilter!==void 0?(function(t){switch(t.unaryFilter.op){case"IS_NAN":const r=Yr(t.unaryFilter.field);return re.create(r,"==",{doubleValue:NaN});case"IS_NULL":const s=Yr(t.unaryFilter.field);return re.create(s,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const i=Yr(t.unaryFilter.field);return re.create(i,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const o=Yr(t.unaryFilter.field);return re.create(o,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return q(61313);default:return q(60726)}})(n):n.fieldFilter!==void 0?(function(t){return re.create(Yr(t.fieldFilter.field),(function(s){switch(s){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return q(58110);default:return q(50506)}})(t.fieldFilter.op),t.fieldFilter.value)})(n):n.compositeFilter!==void 0?(function(t){return le.create(t.compositeFilter.filters.map((r=>hy(r))),(function(s){switch(s){case"AND":return"and";case"OR":return"or";default:return q(1026)}})(t.compositeFilter.op))})(n):q(30097,{filter:n})}function ib(n){return YA[n]}function ob(n){return JA[n]}function ab(n){return XA[n]}function In(n){return{fieldPath:n.canonicalString()}}function Yr(n){return Ie.fromServerFormat(n.fieldPath)}function dy(n){return n instanceof re?(function(t){if(t.op==="=="){if(Ep(t.value))return{unaryFilter:{field:In(t.field),op:"IS_NAN"}};if(Ip(t.value))return{unaryFilter:{field:In(t.field),op:"IS_NULL"}}}else if(t.op==="!="){if(Ep(t.value))return{unaryFilter:{field:In(t.field),op:"IS_NOT_NAN"}};if(Ip(t.value))return{unaryFilter:{field:In(t.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:In(t.field),op:ob(t.op),value:t.value}}})(n):n instanceof le?(function(t){const r=t.getFilters().map((s=>dy(s)));return r.length===1?r[0]:{compositeFilter:{op:ab(t.op),filters:r}}})(n):q(54877,{filter:n})}function cb(n){const e=[];return n.fields.forEach((t=>e.push(t.canonicalString()))),{fieldPaths:e}}function fy(n){return n.length>=4&&n.get(0)==="projects"&&n.get(2)==="databases"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kt{constructor(e,t,r,s,i=z.min(),o=z.min(),a=be.EMPTY_BYTE_STRING,l=null){this.target=e,this.targetId=t,this.purpose=r,this.sequenceNumber=s,this.snapshotVersion=i,this.lastLimboFreeSnapshotVersion=o,this.resumeToken=a,this.expectedCount=l}withSequenceNumber(e){return new Kt(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new Kt(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new Kt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new Kt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class py{constructor(e){this.yt=e}}function lb(n,e){let t;if(e.document)t=kc(n.yt,e.document,!!e.hasCommittedMutations);else if(e.noDocument){const r=M.fromSegments(e.noDocument.path),s=vr(e.noDocument.readTime);t=ye.newNoDocument(r,s),e.hasCommittedMutations&&t.setHasCommittedMutations()}else{if(!e.unknownDocument)return q(56709);{const r=M.fromSegments(e.unknownDocument.path),s=vr(e.unknownDocument.version);t=ye.newUnknownDocument(r,s)}}return e.readTime&&t.setReadTime((function(s){const i=new ce(s[0],s[1]);return z.fromTimestamp(i)})(e.readTime)),t}function Lp(n,e){const t=e.key,r={prefixPath:t.getCollectionPath().popLast().toArray(),collectionGroup:t.collectionGroup,documentId:t.path.lastSegment(),readTime:Ba(e.readTime),hasCommittedMutations:e.hasCommittedMutations};if(e.isFoundDocument())r.document=(function(i,o){return{name:so(i,o.key),fields:o.data.value.mapValue.fields,updateTime:Es(i,o.version.toTimestamp()),createTime:Es(i,o.createTime.toTimestamp())}})(n.yt,e);else if(e.isNoDocument())r.noDocument={path:t.path.toArray(),readTime:wr(e.version)};else{if(!e.isUnknownDocument())return q(57904,{document:e});r.unknownDocument={path:t.path.toArray(),version:wr(e.version)}}return r}function Ba(n){const e=n.toTimestamp();return[e.seconds,e.nanoseconds]}function wr(n){const e=n.toTimestamp();return{seconds:e.seconds,nanoseconds:e.nanoseconds}}function vr(n){const e=new ce(n.seconds,n.nanoseconds);return z.fromTimestamp(e)}function ar(n,e){const t=(e.baseMutations||[]).map((i=>Tu(n.yt,i)));for(let i=0;i<e.mutations.length-1;++i){const o=e.mutations[i];if(i+1<e.mutations.length&&e.mutations[i+1].transform!==void 0){const a=e.mutations[i+1];o.updateTransforms=a.transform.fieldTransforms,e.mutations.splice(i+1,1),++i}}const r=e.mutations.map((i=>Tu(n.yt,i))),s=ce.fromMillis(e.localWriteTimeMs);return new mh(e.batchId,s,t,r)}function Ri(n){const e=vr(n.readTime),t=n.lastLimboFreeSnapshotVersion!==void 0?vr(n.lastLimboFreeSnapshotVersion):z.min();let r;return r=(function(i){return i.documents!==void 0})(n.query)?(function(i){const o=i.documents.length;return G(o===1,1966,{count:o}),Je(Ls(oy(i.documents[0])))})(n.query):(function(i){return Je(uy(i))})(n.query),new Kt(r,n.targetId,"TargetPurposeListen",n.lastListenSequenceNumber,e,t,be.fromBase64String(n.resumeToken))}function _y(n,e){const t=wr(e.snapshotVersion),r=wr(e.lastLimboFreeSnapshotVersion);let s;s=La(e.target)?cy(n.yt,e.target):Dc(n.yt,e.target).ft;const i=e.resumeToken.toBase64();return{targetId:e.targetId,canonicalId:Ir(e.target),readTime:t,resumeToken:i,lastListenSequenceNumber:e.sequenceNumber,lastLimboFreeSnapshotVersion:r,query:s}}function xc(n){const e=uy({parent:n.parent,structuredQuery:n.structuredQuery});return n.limitType==="LAST"?Ua(e,e.limit,"L"):e}function Vl(n,e){return new yh(e.largestBatchId,Tu(n.yt,e.overlayMutation))}function Fp(n,e){const t=e.path.lastSegment();return[n,Ye(e.path.popLast()),t]}function Up(n,e,t,r){return{indexId:n,uid:e,sequenceNumber:t,readTime:wr(r.readTime),documentKey:Ye(r.documentKey.path),largestBatchId:r.largestBatchId}}/**
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
 */class ub{getBundleMetadata(e,t){return Bp(e).get(t).next((r=>{if(r)return(function(i){return{id:i.bundleId,createTime:vr(i.createTime),version:i.version}})(r)}))}saveBundleMetadata(e,t){return Bp(e).put((function(s){return{bundleId:s.id,createTime:wr(De(s.createTime)),version:s.version}})(t))}getNamedQuery(e,t){return qp(e).get(t).next((r=>{if(r)return(function(i){return{name:i.name,query:xc(i.bundledQuery),readTime:vr(i.readTime)}})(r)}))}saveNamedQuery(e,t){return qp(e).put((function(s){return{name:s.name,readTime:wr(De(s.readTime)),bundledQuery:s.bundledQuery}})(t))}}function Bp(n){return Fe(n,vc)}function qp(n){return Fe(n,Ac)}/**
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
 */class Vc{constructor(e,t){this.serializer=e,this.userId=t}static wt(e,t){const r=t.uid||"";return new Vc(e,r)}getOverlay(e,t){return fi(e).get(Fp(this.userId,t)).next((r=>r?Vl(this.serializer,r):null))}getOverlays(e,t){const r=Ot();return b.forEach(t,(s=>this.getOverlay(e,s).next((i=>{i!==null&&r.set(s,i)})))).next((()=>r))}saveOverlays(e,t,r){const s=[];return r.forEach(((i,o)=>{const a=new yh(t,o);s.push(this.St(e,a))})),b.waitFor(s)}removeOverlaysForBatchId(e,t,r){const s=new Set;t.forEach((o=>s.add(Ye(o.getCollectionPath()))));const i=[];return s.forEach((o=>{const a=IDBKeyRange.bound([this.userId,o,r],[this.userId,o,r+1],!1,!0);i.push(fi(e).Z(lu,a))})),b.waitFor(i)}getOverlaysForCollection(e,t,r){const s=Ot(),i=Ye(t),o=IDBKeyRange.bound([this.userId,i,r],[this.userId,i,Number.POSITIVE_INFINITY],!0);return fi(e).J(lu,o).next((a=>{for(const l of a){const u=Vl(this.serializer,l);s.set(u.getKey(),u)}return s}))}getOverlaysForCollectionGroup(e,t,r,s){const i=Ot();let o;const a=IDBKeyRange.bound([this.userId,t,r],[this.userId,t,Number.POSITIVE_INFINITY],!0);return fi(e).ee({index:hg,range:a},((l,u,d)=>{const f=Vl(this.serializer,u);i.size()<s||f.largestBatchId===o?(i.set(f.getKey(),f),o=f.largestBatchId):d.done()})).next((()=>i))}St(e,t){return fi(e).put((function(s,i,o){const[a,l,u]=Fp(i,o.mutation.key);return{userId:i,collectionPath:l,documentId:u,collectionGroup:o.mutation.key.getCollectionGroup(),largestBatchId:o.largestBatchId,overlayMutation:io(s.yt,o.mutation)}})(this.serializer,this.userId,t))}}function fi(n){return Fe(n,bc)}/**
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
 */class hb{bt(e){return Fe(e,ah)}getSessionToken(e){return this.bt(e).get("sessionToken").next((t=>{const r=t==null?void 0:t.value;return r?be.fromUint8Array(r):be.EMPTY_BYTE_STRING}))}setSessionToken(e,t){return this.bt(e).put({name:"sessionToken",value:t.toUint8Array()})}}/**
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
 */class cr{constructor(){}Dt(e,t){this.Ct(e,t),t.vt()}Ct(e,t){if("nullValue"in e)this.Ft(t,5);else if("booleanValue"in e)this.Ft(t,10),t.Mt(e.booleanValue?1:0);else if("integerValue"in e)this.Ft(t,15),t.Mt(Ee(e.integerValue));else if("doubleValue"in e){const r=Ee(e.doubleValue);isNaN(r)?this.Ft(t,13):(this.Ft(t,15),Qi(r)?t.Mt(0):t.Mt(r))}else if("timestampValue"in e){let r=e.timestampValue;this.Ft(t,20),typeof r=="string"&&(r=en(r)),t.xt(`${r.seconds||""}`),t.Mt(r.nanos||0)}else if("stringValue"in e)this.Ot(e.stringValue,t),this.Nt(t);else if("bytesValue"in e)this.Ft(t,30),t.Bt(tn(e.bytesValue)),this.Nt(t);else if("referenceValue"in e)this.Lt(e.referenceValue,t);else if("geoPointValue"in e){const r=e.geoPointValue;this.Ft(t,45),t.Mt(r.latitude||0),t.Mt(r.longitude||0)}else"mapValue"in e?Ag(e)?this.Ft(t,Number.MAX_SAFE_INTEGER):Cc(e)?this.kt(e.mapValue,t):(this.qt(e.mapValue,t),this.Nt(t)):"arrayValue"in e?(this.Qt(e.arrayValue,t),this.Nt(t)):q(19022,{$t:e})}Ot(e,t){this.Ft(t,25),this.Ut(e,t)}Ut(e,t){t.xt(e)}qt(e,t){const r=e.fields||{};this.Ft(t,55);for(const s of Object.keys(r))this.Ot(s,t),this.Ct(r[s],t)}kt(e,t){var o,a;const r=e.fields||{};this.Ft(t,53);const s=_s,i=((a=(o=r[s].arrayValue)==null?void 0:o.values)==null?void 0:a.length)||0;this.Ft(t,15),t.Mt(Ee(i)),this.Ot(s,t),this.Ct(r[s],t)}Qt(e,t){const r=e.values||[];this.Ft(t,50);for(const s of r)this.Ct(s,t)}Lt(e,t){this.Ft(t,37),M.fromName(e).path.forEach((r=>{this.Ft(t,60),this.Ut(r,t)}))}Ft(e,t){e.Mt(t)}Nt(e){e.Mt(2)}}cr.Kt=new cr;/**
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
 */const zr=255;function db(n){if(n===0)return 8;let e=0;return n>>4||(e+=4,n<<=4),n>>6||(e+=2,n<<=2),n>>7||(e+=1),e}function Gp(n){const e=64-(function(r){let s=0;for(let i=0;i<8;++i){const o=db(255&r[i]);if(s+=o,o!==8)break}return s})(n);return Math.ceil(e/8)}class fb{constructor(){this.buffer=new Uint8Array(1024),this.position=0}Wt(e){const t=e[Symbol.iterator]();let r=t.next();for(;!r.done;)this.Gt(r.value),r=t.next();this.zt()}jt(e){const t=e[Symbol.iterator]();let r=t.next();for(;!r.done;)this.Jt(r.value),r=t.next();this.Ht()}Yt(e){for(const t of e){const r=t.charCodeAt(0);if(r<128)this.Gt(r);else if(r<2048)this.Gt(960|r>>>6),this.Gt(128|63&r);else if(t<"\uD800"||"\uDBFF"<t)this.Gt(480|r>>>12),this.Gt(128|63&r>>>6),this.Gt(128|63&r);else{const s=t.codePointAt(0);this.Gt(240|s>>>18),this.Gt(128|63&s>>>12),this.Gt(128|63&s>>>6),this.Gt(128|63&s)}}this.zt()}Zt(e){for(const t of e){const r=t.charCodeAt(0);if(r<128)this.Jt(r);else if(r<2048)this.Jt(960|r>>>6),this.Jt(128|63&r);else if(t<"\uD800"||"\uDBFF"<t)this.Jt(480|r>>>12),this.Jt(128|63&r>>>6),this.Jt(128|63&r);else{const s=t.codePointAt(0);this.Jt(240|s>>>18),this.Jt(128|63&s>>>12),this.Jt(128|63&s>>>6),this.Jt(128|63&s)}}this.Ht()}Xt(e){const t=this.en(e),r=Gp(t);this.tn(1+r),this.buffer[this.position++]=255&r;for(let s=t.length-r;s<t.length;++s)this.buffer[this.position++]=255&t[s]}nn(e){const t=this.en(e),r=Gp(t);this.tn(1+r),this.buffer[this.position++]=~(255&r);for(let s=t.length-r;s<t.length;++s)this.buffer[this.position++]=~(255&t[s])}rn(){this.sn(zr),this.sn(255)}_n(){this.an(zr),this.an(255)}reset(){this.position=0}seed(e){this.tn(e.length),this.buffer.set(e,this.position),this.position+=e.length}un(){return this.buffer.slice(0,this.position)}en(e){const t=(function(i){const o=new DataView(new ArrayBuffer(8));return o.setFloat64(0,i,!1),new Uint8Array(o.buffer)})(e),r=!!(128&t[0]);t[0]^=r?255:128;for(let s=1;s<t.length;++s)t[s]^=r?255:0;return t}Gt(e){const t=255&e;t===0?(this.sn(0),this.sn(255)):t===zr?(this.sn(zr),this.sn(0)):this.sn(t)}Jt(e){const t=255&e;t===0?(this.an(0),this.an(255)):t===zr?(this.an(zr),this.an(0)):this.an(e)}zt(){this.sn(0),this.sn(1)}Ht(){this.an(0),this.an(1)}sn(e){this.tn(1),this.buffer[this.position++]=e}an(e){this.tn(1),this.buffer[this.position++]=~e}tn(e){const t=e+this.position;if(t<=this.buffer.length)return;let r=2*this.buffer.length;r<t&&(r=t);const s=new Uint8Array(r);s.set(this.buffer),this.buffer=s}}class pb{constructor(e){this.cn=e}Bt(e){this.cn.Wt(e)}xt(e){this.cn.Yt(e)}Mt(e){this.cn.Xt(e)}vt(){this.cn.rn()}}class _b{constructor(e){this.cn=e}Bt(e){this.cn.jt(e)}xt(e){this.cn.Zt(e)}Mt(e){this.cn.nn(e)}vt(){this.cn._n()}}class pi{constructor(){this.cn=new fb,this.ln=new pb(this.cn),this.hn=new _b(this.cn)}seed(e){this.cn.seed(e)}Pn(e){return e===0?this.ln:this.hn}un(){return this.cn.un()}reset(){this.cn.reset()}}/**
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
 */class lr{constructor(e,t,r,s){this.Tn=e,this.In=t,this.En=r,this.dn=s}An(){const e=this.dn.length,t=e===0||this.dn[e-1]===255?e+1:e,r=new Uint8Array(t);return r.set(this.dn,0),t!==e?r.set([0],this.dn.length):++r[r.length-1],new lr(this.Tn,this.In,this.En,r)}Rn(e,t,r){return{indexId:this.Tn,uid:e,arrayValue:Aa(this.En),directionalValue:Aa(this.dn),orderedDocumentKey:Aa(t),documentKey:r.path.toArray()}}Vn(e,t,r){const s=this.Rn(e,t,r);return[s.indexId,s.uid,s.arrayValue,s.directionalValue,s.orderedDocumentKey,s.documentKey]}}function _n(n,e){let t=n.Tn-e.Tn;return t!==0?t:(t=zp(n.En,e.En),t!==0?t:(t=zp(n.dn,e.dn),t!==0?t:M.comparator(n.In,e.In)))}function zp(n,e){for(let t=0;t<n.length&&t<e.length;++t){const r=n[t]-e[t];if(r!==0)return r}return n.length-e.length}function Aa(n){return Om()?(function(t){let r="";for(let s=0;s<t.length;s++)r+=String.fromCharCode(t[s]);return r})(n):n}function $p(n){return typeof n!="string"?n:(function(t){const r=new Uint8Array(t.length);for(let s=0;s<t.length;s++)r[s]=t.charCodeAt(s);return r})(n)}class jp{constructor(e){this.mn=new he(((t,r)=>Ie.comparator(t.field,r.field))),this.collectionId=e.collectionGroup!=null?e.collectionGroup:e.path.lastSegment(),this.fn=e.orderBy,this.gn=[];for(const t of e.filters){const r=t;r.isInequality()?this.mn=this.mn.add(r):this.gn.push(r)}}get pn(){return this.mn.size>1}yn(e){if(G(e.collectionGroup===this.collectionId,49279),this.pn)return!1;const t=ou(e);if(t!==void 0&&!this.wn(t))return!1;const r=rr(e);let s=new Set,i=0,o=0;for(;i<r.length&&this.wn(r[i]);++i)s=s.add(r[i].fieldPath.canonicalString());if(i===r.length)return!0;if(this.mn.size>0){const a=this.mn.getIterator().getNext();if(!s.has(a.field.canonicalString())){const l=r[i];if(!this.Sn(a,l)||!this.bn(this.fn[o++],l))return!1}++i}for(;i<r.length;++i){const a=r[i];if(o>=this.fn.length||!this.bn(this.fn[o++],a))return!1}return!0}Dn(){if(this.pn)return null;let e=new he(Ie.comparator);const t=[];for(const r of this.gn)if(!r.field.isKeyField())if(r.op==="array-contains"||r.op==="array-contains-any")t.push(new pr(r.field,2));else{if(e.has(r.field))continue;e=e.add(r.field),t.push(new pr(r.field,0))}for(const r of this.fn)r.field.isKeyField()||e.has(r.field)||(e=e.add(r.field),t.push(new pr(r.field,r.dir==="asc"?0:1)));return new ls(ls.UNKNOWN_ID,this.collectionId,t,us.empty())}wn(e){for(const t of this.gn)if(this.Sn(t,e))return!0;return!1}Sn(e,t){if(e===void 0||!e.field.isEqual(t.fieldPath))return!1;const r=e.op==="array-contains"||e.op==="array-contains-any";return t.kind===2===r}bn(e,t){return!!e.field.isEqual(t.fieldPath)&&(t.kind===0&&e.dir==="asc"||t.kind===1&&e.dir==="desc")}}/**
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
 */function my(n){var t,r;if(G(n instanceof re||n instanceof le,20012),n instanceof re){if(n instanceof xg){const s=((r=(t=n.value.arrayValue)==null?void 0:t.values)==null?void 0:r.map((i=>re.create(n.field,"==",i))))||[];return le.create(s,"or")}return n}const e=n.filters.map((s=>my(s)));return le.create(e,n.op)}function mb(n){if(n.getFilters().length===0)return[];const e=Au(my(n));return G(gy(e),7391),wu(e)||vu(e)?[e]:e.getFilters()}function wu(n){return n instanceof re}function vu(n){return n instanceof le&&hh(n)}function gy(n){return wu(n)||vu(n)||(function(t){if(t instanceof le&&pu(t)){for(const r of t.getFilters())if(!wu(r)&&!vu(r))return!1;return!0}return!1})(n)}function Au(n){if(G(n instanceof re||n instanceof le,34018),n instanceof re)return n;if(n.filters.length===1)return Au(n.filters[0]);const e=n.filters.map((r=>Au(r)));let t=le.create(e,n.op);return t=qa(t),gy(t)?t:(G(t instanceof le,64498),G(gs(t),40251),G(t.filters.length>1,57927),t.filters.reduce(((r,s)=>Th(r,s))))}function Th(n,e){let t;return G(n instanceof re||n instanceof le,38388),G(e instanceof re||e instanceof le,25473),t=n instanceof re?e instanceof re?(function(s,i){return le.create([s,i],"and")})(n,e):Wp(n,e):e instanceof re?Wp(e,n):(function(s,i){if(G(s.filters.length>0&&i.filters.length>0,48005),gs(s)&&gs(i))return Ng(s,i.getFilters());const o=pu(s)?s:i,a=pu(s)?i:s,l=o.filters.map((u=>Th(u,a)));return le.create(l,"or")})(n,e),qa(t)}function Wp(n,e){if(gs(e))return Ng(e,n.getFilters());{const t=e.filters.map((r=>Th(n,r)));return le.create(t,"or")}}function qa(n){if(G(n instanceof re||n instanceof le,11850),n instanceof re)return n;const e=n.getFilters();if(e.length===1)return qa(e[0]);if(Cg(n))return n;const t=e.map((s=>qa(s))),r=[];return t.forEach((s=>{s instanceof re?r.push(s):s instanceof le&&(s.op===n.op?r.push(...s.filters):r.push(s))})),r.length===1?r[0]:le.create(r,n.op)}/**
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
 */class gb{constructor(){this.Cn=new wh}addToCollectionParentIndex(e,t){return this.Cn.add(t),b.resolve()}getCollectionParents(e,t){return b.resolve(this.Cn.getEntries(t))}addFieldIndex(e,t){return b.resolve()}deleteFieldIndex(e,t){return b.resolve()}deleteAllFieldIndexes(e){return b.resolve()}createTargetIndexes(e,t){return b.resolve()}getDocumentsMatchingTarget(e,t){return b.resolve(null)}getIndexType(e,t){return b.resolve(0)}getFieldIndexes(e,t){return b.resolve([])}getNextCollectionGroupToUpdate(e){return b.resolve(null)}getMinOffset(e,t){return b.resolve(It.min())}getMinOffsetFromCollectionGroup(e,t){return b.resolve(It.min())}updateCollectionGroup(e,t,r){return b.resolve()}updateIndexEntries(e,t){return b.resolve()}}class wh{constructor(){this.index={}}add(e){const t=e.lastSegment(),r=e.popLast(),s=this.index[t]||new he(X.comparator),i=!s.has(r);return this.index[t]=s.add(r),i}has(e){const t=e.lastSegment(),r=e.popLast(),s=this.index[t];return s&&s.has(r)}getEntries(e){return(this.index[e]||new he(X.comparator)).toArray()}}/**
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
 */const Kp="IndexedDbIndexManager",oa=new Uint8Array(0);class yb{constructor(e,t){this.databaseId=t,this.vn=new wh,this.Fn=new sn((r=>Ir(r)),((r,s)=>wo(r,s))),this.uid=e.uid||""}addToCollectionParentIndex(e,t){if(!this.vn.has(t)){const r=t.lastSegment(),s=t.popLast();e.addOnCommittedListener((()=>{this.vn.add(t)}));const i={collectionId:r,parent:Ye(s)};return Hp(e).put(i)}return b.resolve()}getCollectionParents(e,t){const r=[],s=IDBKeyRange.bound([t,""],[Ym(t),""],!1,!0);return Hp(e).J(s).next((i=>{for(const o of i){if(o.collectionId!==t)break;r.push(Vt(o.parent))}return r}))}addFieldIndex(e,t){const r=_i(e),s=(function(a){return{indexId:a.indexId,collectionGroup:a.collectionGroup,fields:a.fields.map((l=>[l.fieldPath.canonicalString(),l.kind]))}})(t);delete s.indexId;const i=r.add(s);if(t.indexState){const o=jr(e);return i.next((a=>{o.put(Up(a,this.uid,t.indexState.sequenceNumber,t.indexState.offset))}))}return i.next()}deleteFieldIndex(e,t){const r=_i(e),s=jr(e),i=$r(e);return r.delete(t.indexId).next((()=>s.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0)))).next((()=>i.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0))))}deleteAllFieldIndexes(e){const t=_i(e),r=$r(e),s=jr(e);return t.Z().next((()=>r.Z())).next((()=>s.Z()))}createTargetIndexes(e,t){return b.forEach(this.Mn(t),(r=>this.getIndexType(e,r).next((s=>{if(s===0||s===1){const i=new jp(r).Dn();if(i!=null)return this.addFieldIndex(e,i)}}))))}getDocumentsMatchingTarget(e,t){const r=$r(e);let s=!0;const i=new Map;return b.forEach(this.Mn(t),(o=>this.xn(e,o).next((a=>{s&&(s=!!a),i.set(o,a)})))).next((()=>{if(s){let o=K();const a=[];return b.forEach(i,((l,u)=>{x(Kp,`Using index ${(function(U){return`id=${U.indexId}|cg=${U.collectionGroup}|f=${U.fields.map(($=>`${$.fieldPath}:${$.kind}`)).join(",")}`})(l)} to execute ${Ir(t)}`);const d=(function(U,$){const se=ou($);if(se===void 0)return null;for(const Q of Fa(U,se.fieldPath))switch(Q.op){case"array-contains-any":return Q.value.arrayValue.values||[];case"array-contains":return[Q.value]}return null})(u,l),f=(function(U,$){const se=new Map;for(const Q of rr($))for(const T of Fa(U,Q.fieldPath))switch(T.op){case"==":case"in":se.set(Q.fieldPath.canonicalString(),T.value);break;case"not-in":case"!=":return se.set(Q.fieldPath.canonicalString(),T.value),Array.from(se.values())}return null})(u,l),_=(function(U,$){const se=[];let Q=!0;for(const T of rr($)){const y=T.kind===0?bp(U,T.fieldPath,U.startAt):Rp(U,T.fieldPath,U.startAt);se.push(y.value),Q&&(Q=y.inclusive)}return new Vn(se,Q)})(u,l),g=(function(U,$){const se=[];let Q=!0;for(const T of rr($)){const y=T.kind===0?Rp(U,T.fieldPath,U.endAt):bp(U,T.fieldPath,U.endAt);se.push(y.value),Q&&(Q=y.inclusive)}return new Vn(se,Q)})(u,l),v=this.On(l,u,_),C=this.On(l,u,g),N=this.Nn(l,u,f),V=this.Bn(l.indexId,d,v,_.inclusive,C,g.inclusive,N);return b.forEach(V,(B=>r.Y(B,t.limit).next((U=>{U.forEach(($=>{const se=M.fromSegments($.documentKey);o.has(se)||(o=o.add(se),a.push(se))}))}))))})).next((()=>a))}return b.resolve(null)}))}Mn(e){let t=this.Fn.get(e);return t||(e.filters.length===0?t=[e]:t=mb(le.create(e.filters,"and")).map((r=>mu(e.path,e.collectionGroup,e.orderBy,r.getFilters(),e.limit,e.startAt,e.endAt))),this.Fn.set(e,t),t)}Bn(e,t,r,s,i,o,a){const l=(t!=null?t.length:1)*Math.max(r.length,i.length),u=l/(t!=null?t.length:1),d=[];for(let f=0;f<l;++f){const _=t?this.Ln(t[f/u]):oa,g=this.kn(e,_,r[f%u],s),v=this.qn(e,_,i[f%u],o),C=a.map((N=>this.kn(e,_,N,!0)));d.push(...this.createRange(g,v,C))}return d}kn(e,t,r,s){const i=new lr(e,M.empty(),t,r);return s?i:i.An()}qn(e,t,r,s){const i=new lr(e,M.empty(),t,r);return s?i.An():i}xn(e,t){const r=new jp(t),s=t.collectionGroup!=null?t.collectionGroup:t.path.lastSegment();return this.getFieldIndexes(e,s).next((i=>{let o=null;for(const a of i)r.yn(a)&&(!o||a.fields.length>o.fields.length)&&(o=a);return o}))}getIndexType(e,t){let r=2;const s=this.Mn(t);return b.forEach(s,(i=>this.xn(e,i).next((o=>{o?r!==0&&o.fields.length<(function(l){let u=new he(Ie.comparator),d=!1;for(const f of l.filters)for(const _ of f.getFlattenedFilters())_.field.isKeyField()||(_.op==="array-contains"||_.op==="array-contains-any"?d=!0:u=u.add(_.field));for(const f of l.orderBy)f.field.isKeyField()||(u=u.add(f.field));return u.size+(d?1:0)})(i)&&(r=1):r=0})))).next((()=>(function(o){return o.limit!==null})(t)&&s.length>1&&r===2?1:r))}Qn(e,t){const r=new pi;for(const s of rr(e)){const i=t.data.field(s.fieldPath);if(i==null)return null;const o=r.Pn(s.kind);cr.Kt.Dt(i,o)}return r.un()}Ln(e){const t=new pi;return cr.Kt.Dt(e,t.Pn(0)),t.un()}$n(e,t){const r=new pi;return cr.Kt.Dt(yr(this.databaseId,t),r.Pn((function(i){const o=rr(i);return o.length===0?0:o[o.length-1].kind})(e))),r.un()}Nn(e,t,r){if(r===null)return[];let s=[];s.push(new pi);let i=0;for(const o of rr(e)){const a=r[i++];for(const l of s)if(this.Un(t,o.fieldPath)&&no(a))s=this.Kn(s,o,a);else{const u=l.Pn(o.kind);cr.Kt.Dt(a,u)}}return this.Wn(s)}On(e,t,r){return this.Nn(e,t,r.position)}Wn(e){const t=[];for(let r=0;r<e.length;++r)t[r]=e[r].un();return t}Kn(e,t,r){const s=[...e],i=[];for(const o of r.arrayValue.values||[])for(const a of s){const l=new pi;l.seed(a.un()),cr.Kt.Dt(o,l.Pn(t.kind)),i.push(l)}return i}Un(e,t){return!!e.filters.find((r=>r instanceof re&&r.field.isEqual(t)&&(r.op==="in"||r.op==="not-in")))}getFieldIndexes(e,t){const r=_i(e),s=jr(e);return(t?r.J(cu,IDBKeyRange.bound(t,t)):r.J()).next((i=>{const o=[];return b.forEach(i,(a=>s.get([a.indexId,this.uid]).next((l=>{o.push((function(d,f){const _=f?new us(f.sequenceNumber,new It(vr(f.readTime),new M(Vt(f.documentKey)),f.largestBatchId)):us.empty(),g=d.fields.map((([v,C])=>new pr(Ie.fromServerFormat(v),C)));return new ls(d.indexId,d.collectionGroup,g,_)})(a,l))})))).next((()=>o))}))}getNextCollectionGroupToUpdate(e){return this.getFieldIndexes(e).next((t=>t.length===0?null:(t.sort(((r,s)=>{const i=r.indexState.sequenceNumber-s.indexState.sequenceNumber;return i!==0?i:j(r.collectionGroup,s.collectionGroup)})),t[0].collectionGroup)))}updateCollectionGroup(e,t,r){const s=_i(e),i=jr(e);return this.Gn(e).next((o=>s.J(cu,IDBKeyRange.bound(t,t)).next((a=>b.forEach(a,(l=>i.put(Up(l.indexId,this.uid,o,r))))))))}updateIndexEntries(e,t){const r=new Map;return b.forEach(t,((s,i)=>{const o=r.get(s.collectionGroup);return(o?b.resolve(o):this.getFieldIndexes(e,s.collectionGroup)).next((a=>(r.set(s.collectionGroup,a),b.forEach(a,(l=>this.zn(e,s,l).next((u=>{const d=this.jn(i,l);return u.isEqual(d)?b.resolve():this.Jn(e,i,l,u,d)})))))))}))}Hn(e,t,r,s){return $r(e).put(s.Rn(this.uid,this.$n(r,t.key),t.key))}Yn(e,t,r,s){return $r(e).delete(s.Vn(this.uid,this.$n(r,t.key),t.key))}zn(e,t,r){const s=$r(e);let i=new he(_n);return s.ee({index:ug,range:IDBKeyRange.only([r.indexId,this.uid,Aa(this.$n(r,t))])},((o,a)=>{i=i.add(new lr(r.indexId,t,$p(a.arrayValue),$p(a.directionalValue)))})).next((()=>i))}jn(e,t){let r=new he(_n);const s=this.Qn(t,e);if(s==null)return r;const i=ou(t);if(i!=null){const o=e.data.field(i.fieldPath);if(no(o))for(const a of o.arrayValue.values||[])r=r.add(new lr(t.indexId,e.key,this.Ln(a),s))}else r=r.add(new lr(t.indexId,e.key,oa,s));return r}Jn(e,t,r,s,i){x(Kp,"Updating index entries for document '%s'",t.key);const o=[];return(function(l,u,d,f,_){const g=l.getIterator(),v=u.getIterator();let C=Gr(g),N=Gr(v);for(;C||N;){let V=!1,B=!1;if(C&&N){const U=d(C,N);U<0?B=!0:U>0&&(V=!0)}else C!=null?B=!0:V=!0;V?(f(N),N=Gr(v)):B?(_(C),C=Gr(g)):(C=Gr(g),N=Gr(v))}})(s,i,_n,(a=>{o.push(this.Hn(e,t,r,a))}),(a=>{o.push(this.Yn(e,t,r,a))})),b.waitFor(o)}Gn(e){let t=1;return jr(e).ee({index:lg,reverse:!0,range:IDBKeyRange.upperBound([this.uid,Number.MAX_SAFE_INTEGER])},((r,s,i)=>{i.done(),t=s.sequenceNumber+1})).next((()=>t))}createRange(e,t,r){r=r.sort(((o,a)=>_n(o,a))).filter(((o,a,l)=>!a||_n(o,l[a-1])!==0));const s=[];s.push(e);for(const o of r){const a=_n(o,e),l=_n(o,t);if(a===0)s[0]=e.An();else if(a>0&&l<0)s.push(o),s.push(o.An());else if(l>0)break}s.push(t);const i=[];for(let o=0;o<s.length;o+=2){if(this.Zn(s[o],s[o+1]))return[];const a=s[o].Vn(this.uid,oa,M.empty()),l=s[o+1].Vn(this.uid,oa,M.empty());i.push(IDBKeyRange.bound(a,l))}return i}Zn(e,t){return _n(e,t)>0}getMinOffsetFromCollectionGroup(e,t){return this.getFieldIndexes(e,t).next(Qp)}getMinOffset(e,t){return b.mapArray(this.Mn(t),(r=>this.xn(e,r).next((s=>s||q(44426))))).next(Qp)}}function Hp(n){return Fe(n,Xi)}function $r(n){return Fe(n,Di)}function _i(n){return Fe(n,oh)}function jr(n){return Fe(n,ki)}function Qp(n){G(n.length!==0,28825);let e=n[0].indexState.offset,t=e.largestBatchId;for(let r=1;r<n.length;r++){const s=n[r].indexState.offset;rh(s,e)<0&&(e=s),t<s.largestBatchId&&(t=s.largestBatchId)}return new It(e.readTime,e.documentKey,t)}/**
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
 */const Yp={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},yy=41943040;class Qe{static withCacheSize(e){return new Qe(e,Qe.DEFAULT_COLLECTION_PERCENTILE,Qe.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,t,r){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=r}}/**
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
 */function Iy(n,e,t){const r=n.store(vt),s=n.store(hs),i=[],o=IDBKeyRange.only(t.batchId);let a=0;const l=r.ee({range:o},((d,f,_)=>(a++,_.delete())));i.push(l.next((()=>{G(a===1,47070,{batchId:t.batchId})})));const u=[];for(const d of t.mutations){const f=og(e,d.key.path,t.batchId);i.push(s.delete(f)),u.push(d.key)}return b.waitFor(i).next((()=>u))}function Ga(n){if(!n)return 0;let e;if(n.document)e=n.document;else if(n.unknownDocument)e=n.unknownDocument;else{if(!n.noDocument)throw q(14731);e=n.noDocument}return JSON.stringify(e).length}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Qe.DEFAULT_COLLECTION_PERCENTILE=10,Qe.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,Qe.DEFAULT=new Qe(yy,Qe.DEFAULT_COLLECTION_PERCENTILE,Qe.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),Qe.DISABLED=new Qe(-1,0,0);class Oc{constructor(e,t,r,s){this.userId=e,this.serializer=t,this.indexManager=r,this.referenceDelegate=s,this.Xn={}}static wt(e,t,r,s){G(e.uid!=="",64387);const i=e.isAuthenticated()?e.uid:"";return new Oc(i,t,r,s)}checkEmpty(e){let t=!0;const r=IDBKeyRange.bound([this.userId,Number.NEGATIVE_INFINITY],[this.userId,Number.POSITIVE_INFINITY]);return mn(e).ee({index:ur,range:r},((s,i,o)=>{t=!1,o.done()})).next((()=>t))}addMutationBatch(e,t,r,s){const i=Jr(e),o=mn(e);return o.add({}).next((a=>{G(typeof a=="number",49019);const l=new mh(a,t,r,s),u=(function(g,v,C){const N=C.baseMutations.map((B=>io(g.yt,B))),V=C.mutations.map((B=>io(g.yt,B)));return{userId:v,batchId:C.batchId,localWriteTimeMs:C.localWriteTime.toMillis(),baseMutations:N,mutations:V}})(this.serializer,this.userId,l),d=[];let f=new he(((_,g)=>j(_.canonicalString(),g.canonicalString())));for(const _ of s){const g=og(this.userId,_.key.path,a);f=f.add(_.key.path.popLast()),d.push(o.put(u)),d.push(i.put(g,Zv))}return f.forEach((_=>{d.push(this.indexManager.addToCollectionParentIndex(e,_))})),e.addOnCommittedListener((()=>{this.Xn[a]=l.keys()})),b.waitFor(d).next((()=>l))}))}lookupMutationBatch(e,t){return mn(e).get(t).next((r=>r?(G(r.userId===this.userId,48,"Unexpected user for mutation batch",{userId:r.userId,batchId:t}),ar(this.serializer,r)):null))}er(e,t){return this.Xn[t]?b.resolve(this.Xn[t]):this.lookupMutationBatch(e,t).next((r=>{if(r){const s=r.keys();return this.Xn[t]=s,s}return null}))}getNextMutationBatchAfterBatchId(e,t){const r=t+1,s=IDBKeyRange.lowerBound([this.userId,r]);let i=null;return mn(e).ee({index:ur,range:s},((o,a,l)=>{a.userId===this.userId&&(G(a.batchId>=r,47524,{tr:r}),i=ar(this.serializer,a)),l.done()})).next((()=>i))}getHighestUnacknowledgedBatchId(e){const t=IDBKeyRange.upperBound([this.userId,Number.POSITIVE_INFINITY]);let r=Rn;return mn(e).ee({index:ur,range:t,reverse:!0},((s,i,o)=>{r=i.batchId,o.done()})).next((()=>r))}getAllMutationBatches(e){const t=IDBKeyRange.bound([this.userId,Rn],[this.userId,Number.POSITIVE_INFINITY]);return mn(e).J(ur,t).next((r=>r.map((s=>ar(this.serializer,s)))))}getAllMutationBatchesAffectingDocumentKey(e,t){const r=ga(this.userId,t.path),s=IDBKeyRange.lowerBound(r),i=[];return Jr(e).ee({range:s},((o,a,l)=>{const[u,d,f]=o,_=Vt(d);if(u===this.userId&&t.path.isEqual(_))return mn(e).get(f).next((g=>{if(!g)throw q(61480,{nr:o,batchId:f});G(g.userId===this.userId,10503,"Unexpected user for mutation batch",{userId:g.userId,batchId:f}),i.push(ar(this.serializer,g))}));l.done()})).next((()=>i))}getAllMutationBatchesAffectingDocumentKeys(e,t){let r=new he(j);const s=[];return t.forEach((i=>{const o=ga(this.userId,i.path),a=IDBKeyRange.lowerBound(o),l=Jr(e).ee({range:a},((u,d,f)=>{const[_,g,v]=u,C=Vt(g);_===this.userId&&i.path.isEqual(C)?r=r.add(v):f.done()}));s.push(l)})),b.waitFor(s).next((()=>this.rr(e,r)))}getAllMutationBatchesAffectingQuery(e,t){const r=t.path,s=r.length+1,i=ga(this.userId,r),o=IDBKeyRange.lowerBound(i);let a=new he(j);return Jr(e).ee({range:o},((l,u,d)=>{const[f,_,g]=l,v=Vt(_);f===this.userId&&r.isPrefixOf(v)?v.length===s&&(a=a.add(g)):d.done()})).next((()=>this.rr(e,a)))}rr(e,t){const r=[],s=[];return t.forEach((i=>{s.push(mn(e).get(i).next((o=>{if(o===null)throw q(35274,{batchId:i});G(o.userId===this.userId,9748,"Unexpected user for mutation batch",{userId:o.userId,batchId:i}),r.push(ar(this.serializer,o))})))})),b.waitFor(s).next((()=>r))}removeMutationBatch(e,t){return Iy(e.le,this.userId,t).next((r=>(e.addOnCommittedListener((()=>{this.ir(t.batchId)})),b.forEach(r,(s=>this.referenceDelegate.markPotentiallyOrphaned(e,s))))))}ir(e){delete this.Xn[e]}performConsistencyCheck(e){return this.checkEmpty(e).next((t=>{if(!t)return b.resolve();const r=IDBKeyRange.lowerBound((function(o){return[o]})(this.userId)),s=[];return Jr(e).ee({range:r},((i,o,a)=>{if(i[0]===this.userId){const l=Vt(i[1]);s.push(l)}else a.done()})).next((()=>{G(s.length===0,56720,{sr:s.map((i=>i.canonicalString()))})}))}))}containsKey(e,t){return Ey(e,this.userId,t)}_r(e){return Ty(e).get(this.userId).next((t=>t||{userId:this.userId,lastAcknowledgedBatchId:Rn,lastStreamToken:""}))}}function Ey(n,e,t){const r=ga(e,t.path),s=r[1],i=IDBKeyRange.lowerBound(r);let o=!1;return Jr(n).ee({range:i,X:!0},((a,l,u)=>{const[d,f,_]=a;d===e&&f===s&&(o=!0),u.done()})).next((()=>o))}function mn(n){return Fe(n,vt)}function Jr(n){return Fe(n,hs)}function Ty(n){return Fe(n,Yi)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ar{constructor(e){this.ar=e}next(){return this.ar+=2,this.ar}static ur(){return new Ar(0)}static cr(){return new Ar(-1)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ib{constructor(e,t){this.referenceDelegate=e,this.serializer=t}allocateTargetId(e){return this.lr(e).next((t=>{const r=new Ar(t.highestTargetId);return t.highestTargetId=r.next(),this.hr(e,t).next((()=>t.highestTargetId))}))}getLastRemoteSnapshotVersion(e){return this.lr(e).next((t=>z.fromTimestamp(new ce(t.lastRemoteSnapshotVersion.seconds,t.lastRemoteSnapshotVersion.nanoseconds))))}getHighestSequenceNumber(e){return this.lr(e).next((t=>t.highestListenSequenceNumber))}setTargetsMetadata(e,t,r){return this.lr(e).next((s=>(s.highestListenSequenceNumber=t,r&&(s.lastRemoteSnapshotVersion=r.toTimestamp()),t>s.highestListenSequenceNumber&&(s.highestListenSequenceNumber=t),this.hr(e,s))))}addTargetData(e,t){return this.Pr(e,t).next((()=>this.lr(e).next((r=>(r.targetCount+=1,this.Tr(t,r),this.hr(e,r))))))}updateTargetData(e,t){return this.Pr(e,t)}removeTargetData(e,t){return this.removeMatchingKeysForTargetId(e,t.targetId).next((()=>Wr(e).delete(t.targetId))).next((()=>this.lr(e))).next((r=>(G(r.targetCount>0,8065),r.targetCount-=1,this.hr(e,r))))}removeTargets(e,t,r){let s=0;const i=[];return Wr(e).ee(((o,a)=>{const l=Ri(a);l.sequenceNumber<=t&&r.get(l.targetId)===null&&(s++,i.push(this.removeTargetData(e,l)))})).next((()=>b.waitFor(i))).next((()=>s))}forEachTarget(e,t){return Wr(e).ee(((r,s)=>{const i=Ri(s);t(i)}))}lr(e){return Jp(e).get(Ma).next((t=>(G(t!==null,2888),t)))}hr(e,t){return Jp(e).put(Ma,t)}Pr(e,t){return Wr(e).put(_y(this.serializer,t))}Tr(e,t){let r=!1;return e.targetId>t.highestTargetId&&(t.highestTargetId=e.targetId,r=!0),e.sequenceNumber>t.highestListenSequenceNumber&&(t.highestListenSequenceNumber=e.sequenceNumber,r=!0),r}getTargetCount(e){return this.lr(e).next((t=>t.targetCount))}getTargetData(e,t){const r=Ir(t),s=IDBKeyRange.bound([r,Number.NEGATIVE_INFINITY],[r,Number.POSITIVE_INFINITY]);let i=null;return Wr(e).ee({range:s,index:cg},((o,a,l)=>{const u=Ri(a);wo(t,u.target)&&(i=u,l.done())})).next((()=>i))}addMatchingKeys(e,t,r){const s=[],i=En(e);return t.forEach((o=>{const a=Ye(o.path);s.push(i.put({targetId:r,path:a})),s.push(this.referenceDelegate.addReference(e,r,o))})),b.waitFor(s)}removeMatchingKeys(e,t,r){const s=En(e);return b.forEach(t,(i=>{const o=Ye(i.path);return b.waitFor([s.delete([r,o]),this.referenceDelegate.removeReference(e,r,i)])}))}removeMatchingKeysForTargetId(e,t){const r=En(e),s=IDBKeyRange.bound([t],[t+1],!1,!0);return r.delete(s)}getMatchingKeysForTargetId(e,t){const r=IDBKeyRange.bound([t],[t+1],!1,!0),s=En(e);let i=K();return s.ee({range:r,X:!0},((o,a,l)=>{const u=Vt(o[1]),d=new M(u);i=i.add(d)})).next((()=>i))}containsKey(e,t){const r=Ye(t.path),s=IDBKeyRange.bound([r],[Ym(r)],!1,!0);let i=0;return En(e).ee({index:ih,X:!0,range:s},(([o,a],l,u)=>{o!==0&&(i++,u.done())})).next((()=>i>0))}At(e,t){return Wr(e).get(t).next((r=>r?Ri(r):null))}}function Wr(n){return Fe(n,ds)}function Jp(n){return Fe(n,_r)}function En(n){return Fe(n,fs)}/**
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
 */const Xp="LruGarbageCollector",wy=1048576;function Zp([n,e],[t,r]){const s=j(n,t);return s===0?j(e,r):s}class Eb{constructor(e){this.Ir=e,this.buffer=new he(Zp),this.Er=0}dr(){return++this.Er}Ar(e){const t=[e,this.dr()];if(this.buffer.size<this.Ir)this.buffer=this.buffer.add(t);else{const r=this.buffer.last();Zp(t,r)<0&&(this.buffer=this.buffer.delete(r).add(t))}}get maxValue(){return this.buffer.last()[0]}}class vy{constructor(e,t,r){this.garbageCollector=e,this.asyncQueue=t,this.localStore=r,this.Rr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.Vr(6e4)}stop(){this.Rr&&(this.Rr.cancel(),this.Rr=null)}get started(){return this.Rr!==null}Vr(e){x(Xp,`Garbage collection scheduled in ${e}ms`),this.Rr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,(async()=>{this.Rr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(t){Gn(t)?x(Xp,"Ignoring IndexedDB error during garbage collection: ",t):await qn(t)}await this.Vr(3e5)}))}}class Tb{constructor(e,t){this.mr=e,this.params=t}calculateTargetCount(e,t){return this.mr.gr(e).next((r=>Math.floor(t/100*r)))}nthSequenceNumber(e,t){if(t===0)return b.resolve(it.ce);const r=new Eb(t);return this.mr.forEachTarget(e,(s=>r.Ar(s.sequenceNumber))).next((()=>this.mr.pr(e,(s=>r.Ar(s))))).next((()=>r.maxValue))}removeTargets(e,t,r){return this.mr.removeTargets(e,t,r)}removeOrphanedDocuments(e,t){return this.mr.removeOrphanedDocuments(e,t)}collect(e,t){return this.params.cacheSizeCollectionThreshold===-1?(x("LruGarbageCollector","Garbage collection skipped; disabled"),b.resolve(Yp)):this.getCacheSize(e).next((r=>r<this.params.cacheSizeCollectionThreshold?(x("LruGarbageCollector",`Garbage collection skipped; Cache size ${r} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),Yp):this.yr(e,t)))}getCacheSize(e){return this.mr.getCacheSize(e)}yr(e,t){let r,s,i,o,a,l,u;const d=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next((f=>(f>this.params.maximumSequenceNumbersToCollect?(x("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${f}`),s=this.params.maximumSequenceNumbersToCollect):s=f,o=Date.now(),this.nthSequenceNumber(e,s)))).next((f=>(r=f,a=Date.now(),this.removeTargets(e,r,t)))).next((f=>(i=f,l=Date.now(),this.removeOrphanedDocuments(e,r)))).next((f=>(u=Date.now(),Hr()<=ne.DEBUG&&x("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${o-d}ms
	Determined least recently used ${s} in `+(a-o)+`ms
	Removed ${i} targets in `+(l-a)+`ms
	Removed ${f} documents in `+(u-l)+`ms
Total Duration: ${u-d}ms`),b.resolve({didRun:!0,sequenceNumbersCollected:s,targetsRemoved:i,documentsRemoved:f}))))}}function Ay(n,e){return new Tb(n,e)}/**
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
 */class wb{constructor(e,t){this.db=e,this.garbageCollector=Ay(this,t)}gr(e){const t=this.wr(e);return this.db.getTargetCache().getTargetCount(e).next((r=>t.next((s=>r+s))))}wr(e){let t=0;return this.pr(e,(r=>{t++})).next((()=>t))}forEachTarget(e,t){return this.db.getTargetCache().forEachTarget(e,t)}pr(e,t){return this.Sr(e,((r,s)=>t(s)))}addReference(e,t,r){return aa(e,r)}removeReference(e,t,r){return aa(e,r)}removeTargets(e,t,r){return this.db.getTargetCache().removeTargets(e,t,r)}markPotentiallyOrphaned(e,t){return aa(e,t)}br(e,t){return(function(s,i){let o=!1;return Ty(s).te((a=>Ey(s,a,i).next((l=>(l&&(o=!0),b.resolve(!l)))))).next((()=>o))})(e,t)}removeOrphanedDocuments(e,t){const r=this.db.getRemoteDocumentCache().newChangeBuffer(),s=[];let i=0;return this.Sr(e,((o,a)=>{if(a<=t){const l=this.br(e,o).next((u=>{if(!u)return i++,r.getEntry(e,o).next((()=>(r.removeEntry(o,z.min()),En(e).delete((function(f){return[0,Ye(f.path)]})(o)))))}));s.push(l)}})).next((()=>b.waitFor(s))).next((()=>r.apply(e))).next((()=>i))}removeTarget(e,t){const r=t.withSequenceNumber(e.currentSequenceNumber);return this.db.getTargetCache().updateTargetData(e,r)}updateLimboDocument(e,t){return aa(e,t)}Sr(e,t){const r=En(e);let s,i=it.ce;return r.ee({index:ih},(([o,a],{path:l,sequenceNumber:u})=>{o===0?(i!==it.ce&&t(new M(Vt(s)),i),i=u,s=l):i=it.ce})).next((()=>{i!==it.ce&&t(new M(Vt(s)),i)}))}getCacheSize(e){return this.db.getRemoteDocumentCache().getSize(e)}}function aa(n,e){return En(n).put((function(r,s){return{targetId:0,path:Ye(r.path),sequenceNumber:s}})(e,n.currentSequenceNumber))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class by{constructor(){this.changes=new sn((e=>e.toString()),((e,t)=>e.isEqual(t))),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,ye.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();const r=this.changes.get(t);return r!==void 0?b.resolve(r):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vb{constructor(e){this.serializer=e}setIndexManager(e){this.indexManager=e}addEntry(e,t,r){return tr(e).put(r)}removeEntry(e,t,r){return tr(e).delete((function(i,o){const a=i.path.toArray();return[a.slice(0,a.length-2),a[a.length-2],Ba(o),a[a.length-1]]})(t,r))}updateMetadata(e,t){return this.getMetadata(e).next((r=>(r.byteSize+=t,this.Dr(e,r))))}getEntry(e,t){let r=ye.newInvalidDocument(t);return tr(e).ee({index:ya,range:IDBKeyRange.only(mi(t))},((s,i)=>{r=this.Cr(t,i)})).next((()=>r))}vr(e,t){let r={size:0,document:ye.newInvalidDocument(t)};return tr(e).ee({index:ya,range:IDBKeyRange.only(mi(t))},((s,i)=>{r={document:this.Cr(t,i),size:Ga(i)}})).next((()=>r))}getEntries(e,t){let r=at();return this.Fr(e,t,((s,i)=>{const o=this.Cr(s,i);r=r.insert(s,o)})).next((()=>r))}Mr(e,t){let r=at(),s=new Ae(M.comparator);return this.Fr(e,t,((i,o)=>{const a=this.Cr(i,o);r=r.insert(i,a),s=s.insert(i,Ga(o))})).next((()=>({documents:r,Or:s})))}Fr(e,t,r){if(t.isEmpty())return b.resolve();let s=new he(n_);t.forEach((l=>s=s.add(l)));const i=IDBKeyRange.bound(mi(s.first()),mi(s.last())),o=s.getIterator();let a=o.getNext();return tr(e).ee({index:ya,range:i},((l,u,d)=>{const f=M.fromSegments([...u.prefixPath,u.collectionGroup,u.documentId]);for(;a&&n_(a,f)<0;)r(a,null),a=o.getNext();a&&a.isEqual(f)&&(r(a,u),a=o.hasNext()?o.getNext():null),a?d.j(mi(a)):d.done()})).next((()=>{for(;a;)r(a,null),a=o.hasNext()?o.getNext():null}))}getDocumentsMatchingQuery(e,t,r,s,i){const o=t.path,a=[o.popLast().toArray(),o.lastSegment(),Ba(r.readTime),r.documentKey.path.isEmpty()?"":r.documentKey.path.lastSegment()],l=[o.popLast().toArray(),o.lastSegment(),[Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],""];return tr(e).J(IDBKeyRange.bound(a,l,!0)).next((u=>{i==null||i.incrementDocumentReadCount(u.length);let d=at();for(const f of u){const _=this.Cr(M.fromSegments(f.prefixPath.concat(f.collectionGroup,f.documentId)),f);_.isFoundDocument()&&(Ao(t,_)||s.has(_.key))&&(d=d.insert(_.key,_))}return d}))}getAllFromCollectionGroup(e,t,r,s){let i=at();const o=t_(t,r),a=t_(t,It.max());return tr(e).ee({index:ag,range:IDBKeyRange.bound(o,a,!0)},((l,u,d)=>{const f=this.Cr(M.fromSegments(u.prefixPath.concat(u.collectionGroup,u.documentId)),u);i=i.insert(f.key,f),i.size===s&&d.done()})).next((()=>i))}newChangeBuffer(e){return new Ab(this,!!e&&e.trackRemovals)}getSize(e){return this.getMetadata(e).next((t=>t.byteSize))}getMetadata(e){return e_(e).get(au).next((t=>(G(!!t,20021),t)))}Dr(e,t){return e_(e).put(au,t)}Cr(e,t){if(t){const r=lb(this.serializer,t);if(!(r.isNoDocument()&&r.version.isEqual(z.min())))return r}return ye.newInvalidDocument(e)}}function Ry(n){return new vb(n)}class Ab extends by{constructor(e,t){super(),this.Nr=e,this.trackRemovals=t,this.Br=new sn((r=>r.toString()),((r,s)=>r.isEqual(s)))}applyChanges(e){const t=[];let r=0,s=new he(((i,o)=>j(i.canonicalString(),o.canonicalString())));return this.changes.forEach(((i,o)=>{const a=this.Br.get(i);if(t.push(this.Nr.removeEntry(e,i,a.readTime)),o.isValidDocument()){const l=Lp(this.Nr.serializer,o);s=s.add(i.path.popLast());const u=Ga(l);r+=u-a.size,t.push(this.Nr.addEntry(e,i,l))}else if(r-=a.size,this.trackRemovals){const l=Lp(this.Nr.serializer,o.convertToNoDocument(z.min()));t.push(this.Nr.addEntry(e,i,l))}})),s.forEach((i=>{t.push(this.Nr.indexManager.addToCollectionParentIndex(e,i))})),t.push(this.Nr.updateMetadata(e,r)),b.waitFor(t)}getFromCache(e,t){return this.Nr.vr(e,t).next((r=>(this.Br.set(t,{size:r.size,readTime:r.document.readTime}),r.document)))}getAllFromCache(e,t){return this.Nr.Mr(e,t).next((({documents:r,Or:s})=>(s.forEach(((i,o)=>{this.Br.set(i,{size:o,readTime:r.get(i).readTime})})),r)))}}function e_(n){return Fe(n,Ji)}function tr(n){return Fe(n,Oa)}function mi(n){const e=n.path.toArray();return[e.slice(0,e.length-2),e[e.length-2],e[e.length-1]]}function t_(n,e){const t=e.documentKey.path.toArray();return[n,Ba(e.readTime),t.slice(0,t.length-2),t.length>0?t[t.length-1]:""]}function n_(n,e){const t=n.path.toArray(),r=e.path.toArray();let s=0;for(let i=0;i<t.length-2&&i<r.length-2;++i)if(s=j(t[i],r[i]),s)return s;return s=j(t.length,r.length),s||(s=j(t[t.length-2],r[r.length-2]),s||j(t[t.length-1],r[r.length-1]))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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
 */class bb{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Sy{constructor(e,t,r,s){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=r,this.indexManager=s}getDocument(e,t){let r=null;return this.documentOverlayCache.getOverlay(e,t).next((s=>(r=s,this.remoteDocumentCache.getEntry(e,t)))).next((s=>(r!==null&&Oi(r.mutation,s,ot.empty(),ce.now()),s)))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next((r=>this.getLocalViewOfDocuments(e,r,K()).next((()=>r))))}getLocalViewOfDocuments(e,t,r=K()){const s=Ot();return this.populateOverlays(e,s,t).next((()=>this.computeViews(e,t,s,r).next((i=>{let o=Ai();return i.forEach(((a,l)=>{o=o.insert(a,l.overlayedDocument)})),o}))))}getOverlayedDocuments(e,t){const r=Ot();return this.populateOverlays(e,r,t).next((()=>this.computeViews(e,t,r,K())))}populateOverlays(e,t,r){const s=[];return r.forEach((i=>{t.has(i)||s.push(i)})),this.documentOverlayCache.getOverlays(e,s).next((i=>{i.forEach(((o,a)=>{t.set(o,a)}))}))}computeViews(e,t,r,s){let i=at();const o=Vi(),a=(function(){return Vi()})();return t.forEach(((l,u)=>{const d=r.get(u.key);s.has(u.key)&&(d===void 0||d.mutation instanceof on)?i=i.insert(u.key,u):d!==void 0?(o.set(u.key,d.mutation.getFieldMask()),Oi(d.mutation,u,d.mutation.getFieldMask(),ce.now())):o.set(u.key,ot.empty())})),this.recalculateAndSaveOverlays(e,i).next((l=>(l.forEach(((u,d)=>o.set(u,d))),t.forEach(((u,d)=>a.set(u,new bb(d,o.get(u)??null)))),a)))}recalculateAndSaveOverlays(e,t){const r=Vi();let s=new Ae(((o,a)=>o-a)),i=K();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next((o=>{for(const a of o)a.keys().forEach((l=>{const u=t.get(l);if(u===null)return;let d=r.get(l)||ot.empty();d=a.applyToLocalView(u,d),r.set(l,d);const f=(s.get(a.batchId)||K()).add(l);s=s.insert(a.batchId,f)}))})).next((()=>{const o=[],a=s.getReverseIterator();for(;a.hasNext();){const l=a.getNext(),u=l.key,d=l.value,f=Gg();d.forEach((_=>{if(!i.has(_)){const g=Qg(t.get(_),r.get(_));g!==null&&f.set(_,g),i=i.add(_)}})),o.push(this.documentOverlayCache.saveOverlays(e,u,f))}return b.waitFor(o)})).next((()=>r))}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next((r=>this.recalculateAndSaveOverlays(e,r)))}getDocumentsMatchingQuery(e,t,r,s){return(function(o){return M.isDocumentKey(o.path)&&o.collectionGroup===null&&o.filters.length===0})(t)?this.getDocumentsMatchingDocumentQuery(e,t.path):dh(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,r,s):this.getDocumentsMatchingCollectionQuery(e,t,r,s)}getNextDocuments(e,t,r,s){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,r,s).next((i=>{const o=s-i.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,r.largestBatchId,s-i.size):b.resolve(Ot());let a=cs,l=i;return o.next((u=>b.forEach(u,((d,f)=>(a<f.largestBatchId&&(a=f.largestBatchId),i.get(d)?b.resolve():this.remoteDocumentCache.getEntry(e,d).next((_=>{l=l.insert(d,_)}))))).next((()=>this.populateOverlays(e,u,i))).next((()=>this.computeViews(e,l,u,K()))).next((d=>({batchId:a,changes:qg(d)})))))}))}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new M(t)).next((r=>{let s=Ai();return r.isFoundDocument()&&(s=s.insert(r.key,r)),s}))}getDocumentsMatchingCollectionGroupQuery(e,t,r,s){const i=t.collectionGroup;let o=Ai();return this.indexManager.getCollectionParents(e,i).next((a=>b.forEach(a,(l=>{const u=(function(f,_){return new rn(_,null,f.explicitOrderBy.slice(),f.filters.slice(),f.limit,f.limitType,f.startAt,f.endAt)})(t,l.child(i));return this.getDocumentsMatchingCollectionQuery(e,u,r,s).next((d=>{d.forEach(((f,_)=>{o=o.insert(f,_)}))}))})).next((()=>o))))}getDocumentsMatchingCollectionQuery(e,t,r,s){let i;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,r.largestBatchId).next((o=>(i=o,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,r,i,s)))).next((o=>{i.forEach(((l,u)=>{const d=u.getKey();o.get(d)===null&&(o=o.insert(d,ye.newInvalidDocument(d)))}));let a=Ai();return o.forEach(((l,u)=>{const d=i.get(l);d!==void 0&&Oi(d.mutation,u,ot.empty(),ce.now()),Ao(t,u)&&(a=a.insert(l,u))})),a}))}}/**
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
 */class Rb{constructor(e){this.serializer=e,this.Lr=new Map,this.kr=new Map}getBundleMetadata(e,t){return b.resolve(this.Lr.get(t))}saveBundleMetadata(e,t){return this.Lr.set(t.id,(function(s){return{id:s.id,version:s.version,createTime:De(s.createTime)}})(t)),b.resolve()}getNamedQuery(e,t){return b.resolve(this.kr.get(t))}saveNamedQuery(e,t){return this.kr.set(t.name,(function(s){return{name:s.name,query:xc(s.bundledQuery),readTime:De(s.readTime)}})(t)),b.resolve()}}/**
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
 */class Sb{constructor(){this.overlays=new Ae(M.comparator),this.qr=new Map}getOverlay(e,t){return b.resolve(this.overlays.get(t))}getOverlays(e,t){const r=Ot();return b.forEach(t,(s=>this.getOverlay(e,s).next((i=>{i!==null&&r.set(s,i)})))).next((()=>r))}saveOverlays(e,t,r){return r.forEach(((s,i)=>{this.St(e,t,i)})),b.resolve()}removeOverlaysForBatchId(e,t,r){const s=this.qr.get(r);return s!==void 0&&(s.forEach((i=>this.overlays=this.overlays.remove(i))),this.qr.delete(r)),b.resolve()}getOverlaysForCollection(e,t,r){const s=Ot(),i=t.length+1,o=new M(t.child("")),a=this.overlays.getIteratorFrom(o);for(;a.hasNext();){const l=a.getNext().value,u=l.getKey();if(!t.isPrefixOf(u.path))break;u.path.length===i&&l.largestBatchId>r&&s.set(l.getKey(),l)}return b.resolve(s)}getOverlaysForCollectionGroup(e,t,r,s){let i=new Ae(((u,d)=>u-d));const o=this.overlays.getIterator();for(;o.hasNext();){const u=o.getNext().value;if(u.getKey().getCollectionGroup()===t&&u.largestBatchId>r){let d=i.get(u.largestBatchId);d===null&&(d=Ot(),i=i.insert(u.largestBatchId,d)),d.set(u.getKey(),u)}}const a=Ot(),l=i.getIterator();for(;l.hasNext()&&(l.getNext().value.forEach(((u,d)=>a.set(u,d))),!(a.size()>=s)););return b.resolve(a)}St(e,t,r){const s=this.overlays.get(r.key);if(s!==null){const o=this.qr.get(s.largestBatchId).delete(r.key);this.qr.set(s.largestBatchId,o)}this.overlays=this.overlays.insert(r.key,new yh(t,r));let i=this.qr.get(t);i===void 0&&(i=K(),this.qr.set(t,i)),this.qr.set(t,i.add(r.key))}}/**
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
 */class Cb{constructor(){this.sessionToken=be.EMPTY_BYTE_STRING}getSessionToken(e){return b.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,b.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vh{constructor(){this.Qr=new he(qe.$r),this.Ur=new he(qe.Kr)}isEmpty(){return this.Qr.isEmpty()}addReference(e,t){const r=new qe(e,t);this.Qr=this.Qr.add(r),this.Ur=this.Ur.add(r)}Wr(e,t){e.forEach((r=>this.addReference(r,t)))}removeReference(e,t){this.Gr(new qe(e,t))}zr(e,t){e.forEach((r=>this.removeReference(r,t)))}jr(e){const t=new M(new X([])),r=new qe(t,e),s=new qe(t,e+1),i=[];return this.Ur.forEachInRange([r,s],(o=>{this.Gr(o),i.push(o.key)})),i}Jr(){this.Qr.forEach((e=>this.Gr(e)))}Gr(e){this.Qr=this.Qr.delete(e),this.Ur=this.Ur.delete(e)}Hr(e){const t=new M(new X([])),r=new qe(t,e),s=new qe(t,e+1);let i=K();return this.Ur.forEachInRange([r,s],(o=>{i=i.add(o.key)})),i}containsKey(e){const t=new qe(e,0),r=this.Qr.firstAfterOrEqual(t);return r!==null&&e.isEqual(r.key)}}class qe{constructor(e,t){this.key=e,this.Yr=t}static $r(e,t){return M.comparator(e.key,t.key)||j(e.Yr,t.Yr)}static Kr(e,t){return j(e.Yr,t.Yr)||M.comparator(e.key,t.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pb{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.tr=1,this.Zr=new he(qe.$r)}checkEmpty(e){return b.resolve(this.mutationQueue.length===0)}addMutationBatch(e,t,r,s){const i=this.tr;this.tr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const o=new mh(i,t,r,s);this.mutationQueue.push(o);for(const a of s)this.Zr=this.Zr.add(new qe(a.key,i)),this.indexManager.addToCollectionParentIndex(e,a.key.path.popLast());return b.resolve(o)}lookupMutationBatch(e,t){return b.resolve(this.Xr(t))}getNextMutationBatchAfterBatchId(e,t){const r=t+1,s=this.ei(r),i=s<0?0:s;return b.resolve(this.mutationQueue.length>i?this.mutationQueue[i]:null)}getHighestUnacknowledgedBatchId(){return b.resolve(this.mutationQueue.length===0?Rn:this.tr-1)}getAllMutationBatches(e){return b.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){const r=new qe(t,0),s=new qe(t,Number.POSITIVE_INFINITY),i=[];return this.Zr.forEachInRange([r,s],(o=>{const a=this.Xr(o.Yr);i.push(a)})),b.resolve(i)}getAllMutationBatchesAffectingDocumentKeys(e,t){let r=new he(j);return t.forEach((s=>{const i=new qe(s,0),o=new qe(s,Number.POSITIVE_INFINITY);this.Zr.forEachInRange([i,o],(a=>{r=r.add(a.Yr)}))})),b.resolve(this.ti(r))}getAllMutationBatchesAffectingQuery(e,t){const r=t.path,s=r.length+1;let i=r;M.isDocumentKey(i)||(i=i.child(""));const o=new qe(new M(i),0);let a=new he(j);return this.Zr.forEachWhile((l=>{const u=l.key.path;return!!r.isPrefixOf(u)&&(u.length===s&&(a=a.add(l.Yr)),!0)}),o),b.resolve(this.ti(a))}ti(e){const t=[];return e.forEach((r=>{const s=this.Xr(r);s!==null&&t.push(s)})),t}removeMutationBatch(e,t){G(this.ni(t.batchId,"removed")===0,55003),this.mutationQueue.shift();let r=this.Zr;return b.forEach(t.mutations,(s=>{const i=new qe(s.key,t.batchId);return r=r.delete(i),this.referenceDelegate.markPotentiallyOrphaned(e,s.key)})).next((()=>{this.Zr=r}))}ir(e){}containsKey(e,t){const r=new qe(t,0),s=this.Zr.firstAfterOrEqual(r);return b.resolve(t.isEqual(s&&s.key))}performConsistencyCheck(e){return this.mutationQueue.length,b.resolve()}ni(e,t){return this.ei(e)}ei(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}Xr(e){const t=this.ei(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nb{constructor(e){this.ri=e,this.docs=(function(){return new Ae(M.comparator)})(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){const r=t.key,s=this.docs.get(r),i=s?s.size:0,o=this.ri(t);return this.docs=this.docs.insert(r,{document:t.mutableCopy(),size:o}),this.size+=o-i,this.indexManager.addToCollectionParentIndex(e,r.path.popLast())}removeEntry(e){const t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){const r=this.docs.get(t);return b.resolve(r?r.document.mutableCopy():ye.newInvalidDocument(t))}getEntries(e,t){let r=at();return t.forEach((s=>{const i=this.docs.get(s);r=r.insert(s,i?i.document.mutableCopy():ye.newInvalidDocument(s))})),b.resolve(r)}getDocumentsMatchingQuery(e,t,r,s){let i=at();const o=t.path,a=new M(o.child("__id-9223372036854775808__")),l=this.docs.getIteratorFrom(a);for(;l.hasNext();){const{key:u,value:{document:d}}=l.getNext();if(!o.isPrefixOf(u.path))break;u.path.length>o.length+1||rh(tg(d),r)<=0||(s.has(d.key)||Ao(t,d))&&(i=i.insert(d.key,d.mutableCopy()))}return b.resolve(i)}getAllFromCollectionGroup(e,t,r,s){q(9500)}ii(e,t){return b.forEach(this.docs,(r=>t(r)))}newChangeBuffer(e){return new kb(this)}getSize(e){return b.resolve(this.size)}}class kb extends by{constructor(e){super(),this.Nr=e}applyChanges(e){const t=[];return this.changes.forEach(((r,s)=>{s.isValidDocument()?t.push(this.Nr.addEntry(e,s)):this.Nr.removeEntry(r)})),b.waitFor(t)}getFromCache(e,t){return this.Nr.getEntry(e,t)}getAllFromCache(e,t){return this.Nr.getEntries(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Db{constructor(e){this.persistence=e,this.si=new sn((t=>Ir(t)),wo),this.lastRemoteSnapshotVersion=z.min(),this.highestTargetId=0,this.oi=0,this._i=new vh,this.targetCount=0,this.ai=Ar.ur()}forEachTarget(e,t){return this.si.forEach(((r,s)=>t(s))),b.resolve()}getLastRemoteSnapshotVersion(e){return b.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return b.resolve(this.oi)}allocateTargetId(e){return this.highestTargetId=this.ai.next(),b.resolve(this.highestTargetId)}setTargetsMetadata(e,t,r){return r&&(this.lastRemoteSnapshotVersion=r),t>this.oi&&(this.oi=t),b.resolve()}Pr(e){this.si.set(e.target,e);const t=e.targetId;t>this.highestTargetId&&(this.ai=new Ar(t),this.highestTargetId=t),e.sequenceNumber>this.oi&&(this.oi=e.sequenceNumber)}addTargetData(e,t){return this.Pr(t),this.targetCount+=1,b.resolve()}updateTargetData(e,t){return this.Pr(t),b.resolve()}removeTargetData(e,t){return this.si.delete(t.target),this._i.jr(t.targetId),this.targetCount-=1,b.resolve()}removeTargets(e,t,r){let s=0;const i=[];return this.si.forEach(((o,a)=>{a.sequenceNumber<=t&&r.get(a.targetId)===null&&(this.si.delete(o),i.push(this.removeMatchingKeysForTargetId(e,a.targetId)),s++)})),b.waitFor(i).next((()=>s))}getTargetCount(e){return b.resolve(this.targetCount)}getTargetData(e,t){const r=this.si.get(t)||null;return b.resolve(r)}addMatchingKeys(e,t,r){return this._i.Wr(t,r),b.resolve()}removeMatchingKeys(e,t,r){this._i.zr(t,r);const s=this.persistence.referenceDelegate,i=[];return s&&t.forEach((o=>{i.push(s.markPotentiallyOrphaned(e,o))})),b.waitFor(i)}removeMatchingKeysForTargetId(e,t){return this._i.jr(t),b.resolve()}getMatchingKeysForTargetId(e,t){const r=this._i.Hr(t);return b.resolve(r)}containsKey(e,t){return b.resolve(this._i.containsKey(t))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ah{constructor(e,t){this.ui={},this.overlays={},this.ci=new it(0),this.li=!1,this.li=!0,this.hi=new Cb,this.referenceDelegate=e(this),this.Pi=new Db(this),this.indexManager=new gb,this.remoteDocumentCache=(function(s){return new Nb(s)})((r=>this.referenceDelegate.Ti(r))),this.serializer=new py(t),this.Ii=new Rb(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.li=!1,Promise.resolve()}get started(){return this.li}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new Sb,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let r=this.ui[e.toKey()];return r||(r=new Pb(t,this.referenceDelegate),this.ui[e.toKey()]=r),r}getGlobalsCache(){return this.hi}getTargetCache(){return this.Pi}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Ii}runTransaction(e,t,r){x("MemoryPersistence","Starting transaction:",e);const s=new xb(this.ci.next());return this.referenceDelegate.Ei(),r(s).next((i=>this.referenceDelegate.di(s).next((()=>i)))).toPromise().then((i=>(s.raiseOnCommittedEvent(),i)))}Ai(e,t){return b.or(Object.values(this.ui).map((r=>()=>r.containsKey(e,t))))}}class xb extends rg{constructor(e){super(),this.currentSequenceNumber=e}}class Mc{constructor(e){this.persistence=e,this.Ri=new vh,this.Vi=null}static mi(e){return new Mc(e)}get fi(){if(this.Vi)return this.Vi;throw q(60996)}addReference(e,t,r){return this.Ri.addReference(r,t),this.fi.delete(r.toString()),b.resolve()}removeReference(e,t,r){return this.Ri.removeReference(r,t),this.fi.add(r.toString()),b.resolve()}markPotentiallyOrphaned(e,t){return this.fi.add(t.toString()),b.resolve()}removeTarget(e,t){this.Ri.jr(t.targetId).forEach((s=>this.fi.add(s.toString())));const r=this.persistence.getTargetCache();return r.getMatchingKeysForTargetId(e,t.targetId).next((s=>{s.forEach((i=>this.fi.add(i.toString())))})).next((()=>r.removeTargetData(e,t)))}Ei(){this.Vi=new Set}di(e){const t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return b.forEach(this.fi,(r=>{const s=M.fromPath(r);return this.gi(e,s).next((i=>{i||t.removeEntry(s,z.min())}))})).next((()=>(this.Vi=null,t.apply(e))))}updateLimboDocument(e,t){return this.gi(e,t).next((r=>{r?this.fi.delete(t.toString()):this.fi.add(t.toString())}))}Ti(e){return 0}gi(e,t){return b.or([()=>b.resolve(this.Ri.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.Ai(e,t)])}}class za{constructor(e,t){this.persistence=e,this.pi=new sn((r=>Ye(r.path)),((r,s)=>r.isEqual(s))),this.garbageCollector=Ay(this,t)}static mi(e,t){return new za(e,t)}Ei(){}di(e){return b.resolve()}forEachTarget(e,t){return this.persistence.getTargetCache().forEachTarget(e,t)}gr(e){const t=this.wr(e);return this.persistence.getTargetCache().getTargetCount(e).next((r=>t.next((s=>r+s))))}wr(e){let t=0;return this.pr(e,(r=>{t++})).next((()=>t))}pr(e,t){return b.forEach(this.pi,((r,s)=>this.br(e,r,s).next((i=>i?b.resolve():t(s)))))}removeTargets(e,t,r){return this.persistence.getTargetCache().removeTargets(e,t,r)}removeOrphanedDocuments(e,t){let r=0;const s=this.persistence.getRemoteDocumentCache(),i=s.newChangeBuffer();return s.ii(e,(o=>this.br(e,o,t).next((a=>{a||(r++,i.removeEntry(o,z.min()))})))).next((()=>i.apply(e))).next((()=>r))}markPotentiallyOrphaned(e,t){return this.pi.set(t,e.currentSequenceNumber),b.resolve()}removeTarget(e,t){const r=t.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,r)}addReference(e,t,r){return this.pi.set(r,e.currentSequenceNumber),b.resolve()}removeReference(e,t,r){return this.pi.set(r,e.currentSequenceNumber),b.resolve()}updateLimboDocument(e,t){return this.pi.set(t,e.currentSequenceNumber),b.resolve()}Ti(e){let t=e.key.toString().length;return e.isFoundDocument()&&(t+=Ea(e.data.value)),t}br(e,t,r){return b.or([()=>this.persistence.Ai(e,t),()=>this.persistence.getTargetCache().containsKey(e,t),()=>{const s=this.pi.get(t);return b.resolve(s!==void 0&&s>r)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}/**
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
 */class Vb{constructor(e){this.serializer=e}k(e,t,r,s){const i=new wc("createOrUpgrade",t);r<1&&s>=1&&((function(l){l.createObjectStore(To)})(e),(function(l){l.createObjectStore(Yi,{keyPath:Xv}),l.createObjectStore(vt,{keyPath:fp,autoIncrement:!0}).createIndex(ur,pp,{unique:!0}),l.createObjectStore(hs)})(e),r_(e),(function(l){l.createObjectStore(sr)})(e));let o=b.resolve();return r<3&&s>=3&&(r!==0&&((function(l){l.deleteObjectStore(fs),l.deleteObjectStore(ds),l.deleteObjectStore(_r)})(e),r_(e)),o=o.next((()=>(function(l){const u=l.store(_r),d={highestTargetId:0,highestListenSequenceNumber:0,lastRemoteSnapshotVersion:z.min().toTimestamp(),targetCount:0};return u.put(Ma,d)})(i)))),r<4&&s>=4&&(r!==0&&(o=o.next((()=>(function(l,u){return u.store(vt).J().next((f=>{l.deleteObjectStore(vt),l.createObjectStore(vt,{keyPath:fp,autoIncrement:!0}).createIndex(ur,pp,{unique:!0});const _=u.store(vt),g=f.map((v=>_.put(v)));return b.waitFor(g)}))})(e,i)))),o=o.next((()=>{(function(l){l.createObjectStore(ps,{keyPath:aA})})(e)}))),r<5&&s>=5&&(o=o.next((()=>this.yi(i)))),r<6&&s>=6&&(o=o.next((()=>((function(l){l.createObjectStore(Ji)})(e),this.wi(i))))),r<7&&s>=7&&(o=o.next((()=>this.Si(i)))),r<8&&s>=8&&(o=o.next((()=>this.bi(e,i)))),r<9&&s>=9&&(o=o.next((()=>{(function(l){l.objectStoreNames.contains("remoteDocumentChanges")&&l.deleteObjectStore("remoteDocumentChanges")})(e)}))),r<10&&s>=10&&(o=o.next((()=>this.Di(i)))),r<11&&s>=11&&(o=o.next((()=>{(function(l){l.createObjectStore(vc,{keyPath:cA})})(e),(function(l){l.createObjectStore(Ac,{keyPath:lA})})(e)}))),r<12&&s>=12&&(o=o.next((()=>{(function(l){const u=l.createObjectStore(bc,{keyPath:mA});u.createIndex(lu,gA,{unique:!1}),u.createIndex(hg,yA,{unique:!1})})(e)}))),r<13&&s>=13&&(o=o.next((()=>(function(l){const u=l.createObjectStore(Oa,{keyPath:eA});u.createIndex(ya,tA),u.createIndex(ag,nA)})(e))).next((()=>this.Ci(e,i))).next((()=>e.deleteObjectStore(sr)))),r<14&&s>=14&&(o=o.next((()=>this.Fi(e,i)))),r<15&&s>=15&&(o=o.next((()=>(function(l){l.createObjectStore(oh,{keyPath:uA,autoIncrement:!0}).createIndex(cu,hA,{unique:!1}),l.createObjectStore(ki,{keyPath:dA}).createIndex(lg,fA,{unique:!1}),l.createObjectStore(Di,{keyPath:pA}).createIndex(ug,_A,{unique:!1})})(e)))),r<16&&s>=16&&(o=o.next((()=>{t.objectStore(ki).clear()})).next((()=>{t.objectStore(Di).clear()}))),r<17&&s>=17&&(o=o.next((()=>{(function(l){l.createObjectStore(ah,{keyPath:IA})})(e)}))),r<18&&s>=18&&Om()&&(o=o.next((()=>{t.objectStore(ki).clear()})).next((()=>{t.objectStore(Di).clear()}))),o}wi(e){let t=0;return e.store(sr).ee(((r,s)=>{t+=Ga(s)})).next((()=>{const r={byteSize:t};return e.store(Ji).put(au,r)}))}yi(e){const t=e.store(Yi),r=e.store(vt);return t.J().next((s=>b.forEach(s,(i=>{const o=IDBKeyRange.bound([i.userId,Rn],[i.userId,i.lastAcknowledgedBatchId]);return r.J(ur,o).next((a=>b.forEach(a,(l=>{G(l.userId===i.userId,18650,"Cannot process batch from unexpected user",{batchId:l.batchId});const u=ar(this.serializer,l);return Iy(e,i.userId,u).next((()=>{}))}))))}))))}Si(e){const t=e.store(fs),r=e.store(sr);return e.store(_r).get(Ma).next((s=>{const i=[];return r.ee(((o,a)=>{const l=new X(o),u=(function(f){return[0,Ye(f)]})(l);i.push(t.get(u).next((d=>d?b.resolve():(f=>t.put({targetId:0,path:Ye(f),sequenceNumber:s.highestListenSequenceNumber}))(l))))})).next((()=>b.waitFor(i)))}))}bi(e,t){e.createObjectStore(Xi,{keyPath:oA});const r=t.store(Xi),s=new wh,i=o=>{if(s.add(o)){const a=o.lastSegment(),l=o.popLast();return r.put({collectionId:a,parent:Ye(l)})}};return t.store(sr).ee({X:!0},((o,a)=>{const l=new X(o);return i(l.popLast())})).next((()=>t.store(hs).ee({X:!0},(([o,a,l],u)=>{const d=Vt(a);return i(d.popLast())}))))}Di(e){const t=e.store(ds);return t.ee(((r,s)=>{const i=Ri(s),o=_y(this.serializer,i);return t.put(o)}))}Ci(e,t){const r=t.store(sr),s=[];return r.ee(((i,o)=>{const a=t.store(Oa),l=(function(f){return f.document?new M(X.fromString(f.document.name).popFirst(5)):f.noDocument?M.fromSegments(f.noDocument.path):f.unknownDocument?M.fromSegments(f.unknownDocument.path):q(36783)})(o).path.toArray(),u={prefixPath:l.slice(0,l.length-2),collectionGroup:l[l.length-2],documentId:l[l.length-1],readTime:o.readTime||[0,0],unknownDocument:o.unknownDocument,noDocument:o.noDocument,document:o.document,hasCommittedMutations:!!o.hasCommittedMutations};s.push(a.put(u))})).next((()=>b.waitFor(s)))}Fi(e,t){const r=t.store(vt),s=Ry(this.serializer),i=new Ah(Mc.mi,this.serializer.yt);return r.J().next((o=>{const a=new Map;return o.forEach((l=>{let u=a.get(l.userId)??K();ar(this.serializer,l).keys().forEach((d=>u=u.add(d))),a.set(l.userId,u)})),b.forEach(a,((l,u)=>{const d=new Ge(u),f=Vc.wt(this.serializer,d),_=i.getIndexManager(d),g=Oc.wt(d,this.serializer,_,i.referenceDelegate);return new Sy(s,g,f,_).recalculateAndSaveOverlaysForDocumentKeys(new uu(t,it.ce),l).next()}))}))}}function r_(n){n.createObjectStore(fs,{keyPath:sA}).createIndex(ih,iA,{unique:!0}),n.createObjectStore(ds,{keyPath:"targetId"}).createIndex(cg,rA,{unique:!0}),n.createObjectStore(_r)}const gn="IndexedDbPersistence",Ol=18e5,Ml=5e3,Ll="Failed to obtain exclusive access to the persistence layer. To allow shared access, multi-tab synchronization has to be enabled in all tabs. If you are using `experimentalForceOwningTab:true`, make sure that only one tab has persistence enabled at any given time.",Cy="main";class bh{constructor(e,t,r,s,i,o,a,l,u,d,f=18){if(this.allowTabSynchronization=e,this.persistenceKey=t,this.clientId=r,this.Mi=i,this.window=o,this.document=a,this.xi=u,this.Oi=d,this.Ni=f,this.ci=null,this.li=!1,this.isPrimary=!1,this.networkEnabled=!0,this.Bi=null,this.inForeground=!1,this.Li=null,this.ki=null,this.qi=Number.NEGATIVE_INFINITY,this.Qi=_=>Promise.resolve(),!bh.v())throw new D(S.UNIMPLEMENTED,"This platform is either missing IndexedDB or is known to have an incomplete implementation. Offline persistence has been disabled.");this.referenceDelegate=new wb(this,s),this.$i=t+Cy,this.serializer=new py(l),this.Ui=new Ft(this.$i,this.Ni,new Vb(this.serializer)),this.hi=new hb,this.Pi=new Ib(this.referenceDelegate,this.serializer),this.remoteDocumentCache=Ry(this.serializer),this.Ii=new ub,this.window&&this.window.localStorage?this.Ki=this.window.localStorage:(this.Ki=null,d===!1&&Ne(gn,"LocalStorage is unavailable. As a result, persistence may not work reliably. In particular enablePersistence() could fail immediately after refreshing the page."))}start(){return this.Wi().then((()=>{if(!this.isPrimary&&!this.allowTabSynchronization)throw new D(S.FAILED_PRECONDITION,Ll);return this.Gi(),this.zi(),this.ji(),this.runTransaction("getHighestListenSequenceNumber","readonly",(e=>this.Pi.getHighestSequenceNumber(e)))})).then((e=>{this.ci=new it(e,this.xi)})).then((()=>{this.li=!0})).catch((e=>(this.Ui&&this.Ui.close(),Promise.reject(e))))}Ji(e){return this.Qi=async t=>{if(this.started)return e(t)},e(this.isPrimary)}setDatabaseDeletedListener(e){this.Ui.$((async t=>{t.newVersion===null&&await e()}))}setNetworkEnabled(e){this.networkEnabled!==e&&(this.networkEnabled=e,this.Mi.enqueueAndForget((async()=>{this.started&&await this.Wi()})))}Wi(){return this.runTransaction("updateClientMetadataAndTryBecomePrimary","readwrite",(e=>ca(e).put({clientId:this.clientId,updateTimeMs:Date.now(),networkEnabled:this.networkEnabled,inForeground:this.inForeground}).next((()=>{if(this.isPrimary)return this.Hi(e).next((t=>{t||(this.isPrimary=!1,this.Mi.enqueueRetryable((()=>this.Qi(!1))))}))})).next((()=>this.Yi(e))).next((t=>this.isPrimary&&!t?this.Zi(e).next((()=>!1)):!!t&&this.Xi(e).next((()=>!0)))))).catch((e=>{if(Gn(e))return x(gn,"Failed to extend owner lease: ",e),this.isPrimary;if(!this.allowTabSynchronization)throw e;return x(gn,"Releasing owner lease after error during lease refresh",e),!1})).then((e=>{this.isPrimary!==e&&this.Mi.enqueueRetryable((()=>this.Qi(e))),this.isPrimary=e}))}Hi(e){return gi(e).get(qr).next((t=>b.resolve(this.es(t))))}ts(e){return ca(e).delete(this.clientId)}async ns(){if(this.isPrimary&&!this.rs(this.qi,Ol)){this.qi=Date.now();const e=await this.runTransaction("maybeGarbageCollectMultiClientState","readwrite-primary",(t=>{const r=Fe(t,ps);return r.J().next((s=>{const i=this.ss(s,Ol),o=s.filter((a=>i.indexOf(a)===-1));return b.forEach(o,(a=>r.delete(a.clientId))).next((()=>o))}))})).catch((()=>[]));if(this.Ki)for(const t of e)this.Ki.removeItem(this._s(t.clientId))}}ji(){this.ki=this.Mi.enqueueAfterDelay("client_metadata_refresh",4e3,(()=>this.Wi().then((()=>this.ns())).then((()=>this.ji()))))}es(e){return!!e&&e.ownerId===this.clientId}Yi(e){return this.Oi?b.resolve(!0):gi(e).get(qr).next((t=>{if(t!==null&&this.rs(t.leaseTimestampMs,Ml)&&!this.us(t.ownerId)){if(this.es(t)&&this.networkEnabled)return!0;if(!this.es(t)){if(!t.allowTabSynchronization)throw new D(S.FAILED_PRECONDITION,Ll);return!1}}return!(!this.networkEnabled||!this.inForeground)||ca(e).J().next((r=>this.ss(r,Ml).find((s=>{if(this.clientId!==s.clientId){const i=!this.networkEnabled&&s.networkEnabled,o=!this.inForeground&&s.inForeground,a=this.networkEnabled===s.networkEnabled;if(i||o&&a)return!0}return!1}))===void 0))})).next((t=>(this.isPrimary!==t&&x(gn,`Client ${t?"is":"is not"} eligible for a primary lease.`),t)))}async shutdown(){this.li=!1,this.cs(),this.ki&&(this.ki.cancel(),this.ki=null),this.ls(),this.hs(),await this.Ui.runTransaction("shutdown","readwrite",[To,ps],(e=>{const t=new uu(e,it.ce);return this.Zi(t).next((()=>this.ts(t)))})),this.Ui.close(),this.Ps()}ss(e,t){return e.filter((r=>this.rs(r.updateTimeMs,t)&&!this.us(r.clientId)))}Ts(){return this.runTransaction("getActiveClients","readonly",(e=>ca(e).J().next((t=>this.ss(t,Ol).map((r=>r.clientId))))))}get started(){return this.li}getGlobalsCache(){return this.hi}getMutationQueue(e,t){return Oc.wt(e,this.serializer,t,this.referenceDelegate)}getTargetCache(){return this.Pi}getRemoteDocumentCache(){return this.remoteDocumentCache}getIndexManager(e){return new yb(e,this.serializer.yt.databaseId)}getDocumentOverlayCache(e){return Vc.wt(this.serializer,e)}getBundleCache(){return this.Ii}runTransaction(e,t,r){x(gn,"Starting transaction:",e);const s=t==="readonly"?"readonly":"readwrite",i=(function(l){return l===18?wA:l===17?_g:l===16?TA:l===15?ch:l===14?pg:l===13?fg:l===12?EA:l===11?dg:void q(60245)})(this.Ni);let o;return this.Ui.runTransaction(e,s,i,(a=>(o=new uu(a,this.ci?this.ci.next():it.ce),t==="readwrite-primary"?this.Hi(o).next((l=>!!l||this.Yi(o))).next((l=>{if(!l)throw Ne(`Failed to obtain primary lease for action '${e}'.`),this.isPrimary=!1,this.Mi.enqueueRetryable((()=>this.Qi(!1))),new D(S.FAILED_PRECONDITION,ng);return r(o)})).next((l=>this.Xi(o).next((()=>l)))):this.Is(o).next((()=>r(o)))))).then((a=>(o.raiseOnCommittedEvent(),a)))}Is(e){return gi(e).get(qr).next((t=>{if(t!==null&&this.rs(t.leaseTimestampMs,Ml)&&!this.us(t.ownerId)&&!this.es(t)&&!(this.Oi||this.allowTabSynchronization&&t.allowTabSynchronization))throw new D(S.FAILED_PRECONDITION,Ll)}))}Xi(e){const t={ownerId:this.clientId,allowTabSynchronization:this.allowTabSynchronization,leaseTimestampMs:Date.now()};return gi(e).put(qr,t)}static v(){return Ft.v()}Zi(e){const t=gi(e);return t.get(qr).next((r=>this.es(r)?(x(gn,"Releasing primary lease."),t.delete(qr)):b.resolve()))}rs(e,t){const r=Date.now();return!(e<r-t)&&(!(e>r)||(Ne(`Detected an update time that is in the future: ${e} > ${r}`),!1))}Gi(){this.document!==null&&typeof this.document.addEventListener=="function"&&(this.Li=()=>{this.Mi.enqueueAndForget((()=>(this.inForeground=this.document.visibilityState==="visible",this.Wi())))},this.document.addEventListener("visibilitychange",this.Li),this.inForeground=this.document.visibilityState==="visible")}ls(){this.Li&&(this.document.removeEventListener("visibilitychange",this.Li),this.Li=null)}zi(){var e;typeof((e=this.window)==null?void 0:e.addEventListener)=="function"&&(this.Bi=()=>{this.cs();const t=/(?:Version|Mobile)\/1[456]/;Vm()&&(navigator.appVersion.match(t)||navigator.userAgent.match(t))&&this.Mi.enterRestrictedMode(!0),this.Mi.enqueueAndForget((()=>this.shutdown()))},this.window.addEventListener("pagehide",this.Bi))}hs(){this.Bi&&(this.window.removeEventListener("pagehide",this.Bi),this.Bi=null)}us(e){var t;try{const r=((t=this.Ki)==null?void 0:t.getItem(this._s(e)))!==null;return x(gn,`Client '${e}' ${r?"is":"is not"} zombied in LocalStorage`),r}catch(r){return Ne(gn,"Failed to get zombied client id.",r),!1}}cs(){if(this.Ki)try{this.Ki.setItem(this._s(this.clientId),String(Date.now()))}catch(e){Ne("Failed to set zombie client id.",e)}}Ps(){if(this.Ki)try{this.Ki.removeItem(this._s(this.clientId))}catch{}}_s(e){return`firestore_zombie_${this.persistenceKey}_${e}`}}function gi(n){return Fe(n,To)}function ca(n){return Fe(n,ps)}function Rh(n,e){let t=n.projectId;return n.isDefaultDatabase||(t+="."+n.database),"firestore/"+e+"/"+t+"/"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Sh{constructor(e,t,r,s){this.targetId=e,this.fromCache=t,this.Es=r,this.ds=s}static As(e,t){let r=K(),s=K();for(const i of t.docChanges)switch(i.type){case 0:r=r.add(i.doc.key);break;case 1:s=s.add(i.doc.key)}return new Sh(e,t.fromCache,r,s)}}/**
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
 */class Ob{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}/**
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
 */class Py{constructor(){this.Rs=!1,this.Vs=!1,this.fs=100,this.gs=(function(){return Vm()?8:sg(pt())>0?6:4})()}initialize(e,t){this.ps=e,this.indexManager=t,this.Rs=!0}getDocumentsMatchingQuery(e,t,r,s){const i={result:null};return this.ys(e,t).next((o=>{i.result=o})).next((()=>{if(!i.result)return this.ws(e,t,s,r).next((o=>{i.result=o}))})).next((()=>{if(i.result)return;const o=new Ob;return this.Ss(e,t,o).next((a=>{if(i.result=a,this.Vs)return this.bs(e,t,o,a.size)}))})).next((()=>i.result))}bs(e,t,r,s){return r.documentReadCount<this.fs?(Hr()<=ne.DEBUG&&x("QueryEngine","SDK will not create cache indexes for query:",Qr(t),"since it only creates cache indexes for collection contains","more than or equal to",this.fs,"documents"),b.resolve()):(Hr()<=ne.DEBUG&&x("QueryEngine","Query:",Qr(t),"scans",r.documentReadCount,"local documents and returns",s,"documents as results."),r.documentReadCount>this.gs*s?(Hr()<=ne.DEBUG&&x("QueryEngine","The SDK decides to create cache indexes for query:",Qr(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,Je(t))):b.resolve())}ys(e,t){if(Sp(t))return b.resolve(null);let r=Je(t);return this.indexManager.getIndexType(e,r).next((s=>s===0?null:(t.limit!==null&&s===1&&(t=Ua(t,null,"F"),r=Je(t)),this.indexManager.getDocumentsMatchingTarget(e,r).next((i=>{const o=K(...i);return this.ps.getDocuments(e,o).next((a=>this.indexManager.getMinOffset(e,r).next((l=>{const u=this.Ds(t,a);return this.Cs(t,u,o,l.readTime)?this.ys(e,Ua(t,null,"F")):this.vs(e,u,t,l)}))))})))))}ws(e,t,r,s){return Sp(t)||s.isEqual(z.min())?b.resolve(null):this.ps.getDocuments(e,r).next((i=>{const o=this.Ds(t,i);return this.Cs(t,o,r,s)?b.resolve(null):(Hr()<=ne.DEBUG&&x("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),Qr(t)),this.vs(e,o,t,eg(s,cs)).next((a=>a)))}))}Ds(e,t){let r=new he(Ug(e));return t.forEach(((s,i)=>{Ao(e,i)&&(r=r.add(i))})),r}Cs(e,t,r,s){if(e.limit===null)return!1;if(r.size!==t.size)return!0;const i=e.limitType==="F"?t.last():t.first();return!!i&&(i.hasPendingWrites||i.version.compareTo(s)>0)}Ss(e,t,r){return Hr()<=ne.DEBUG&&x("QueryEngine","Using full collection scan to execute query:",Qr(t)),this.ps.getDocumentsMatchingQuery(e,t,It.min(),r)}vs(e,t,r,s){return this.ps.getDocumentsMatchingQuery(e,r,s).next((i=>(t.forEach((o=>{i=i.insert(o.key,o)})),i)))}}/**
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
 */const Ch="LocalStore",Mb=3e8;class Lb{constructor(e,t,r,s){this.persistence=e,this.Fs=t,this.serializer=s,this.Ms=new Ae(j),this.xs=new sn((i=>Ir(i)),wo),this.Os=new Map,this.Ns=e.getRemoteDocumentCache(),this.Pi=e.getTargetCache(),this.Ii=e.getBundleCache(),this.Bs(r)}Bs(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new Sy(this.Ns,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Ns.setIndexManager(this.indexManager),this.Fs.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",(t=>e.collect(t,this.Ms)))}}function Ny(n,e,t,r){return new Lb(n,e,t,r)}async function ky(n,e){const t=L(n);return await t.persistence.runTransaction("Handle user change","readonly",(r=>{let s;return t.mutationQueue.getAllMutationBatches(r).next((i=>(s=i,t.Bs(e),t.mutationQueue.getAllMutationBatches(r)))).next((i=>{const o=[],a=[];let l=K();for(const u of s){o.push(u.batchId);for(const d of u.mutations)l=l.add(d.key)}for(const u of i){a.push(u.batchId);for(const d of u.mutations)l=l.add(d.key)}return t.localDocuments.getDocuments(r,l).next((u=>({Ls:u,removedBatchIds:o,addedBatchIds:a})))}))}))}function Fb(n,e){const t=L(n);return t.persistence.runTransaction("Acknowledge batch","readwrite-primary",(r=>{const s=e.batch.keys(),i=t.Ns.newChangeBuffer({trackRemovals:!0});return(function(a,l,u,d){const f=u.batch,_=f.keys();let g=b.resolve();return _.forEach((v=>{g=g.next((()=>d.getEntry(l,v))).next((C=>{const N=u.docVersions.get(v);G(N!==null,48541),C.version.compareTo(N)<0&&(f.applyToRemoteDocument(C,u),C.isValidDocument()&&(C.setReadTime(u.commitVersion),d.addEntry(C)))}))})),g.next((()=>a.mutationQueue.removeMutationBatch(l,f)))})(t,r,e,i).next((()=>i.apply(r))).next((()=>t.mutationQueue.performConsistencyCheck(r))).next((()=>t.documentOverlayCache.removeOverlaysForBatchId(r,s,e.batch.batchId))).next((()=>t.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(r,(function(a){let l=K();for(let u=0;u<a.mutationResults.length;++u)a.mutationResults[u].transformResults.length>0&&(l=l.add(a.batch.mutations[u].key));return l})(e)))).next((()=>t.localDocuments.getDocuments(r,s)))}))}function Dy(n){const e=L(n);return e.persistence.runTransaction("Get last remote snapshot version","readonly",(t=>e.Pi.getLastRemoteSnapshotVersion(t)))}function Ub(n,e){const t=L(n),r=e.snapshotVersion;let s=t.Ms;return t.persistence.runTransaction("Apply remote event","readwrite-primary",(i=>{const o=t.Ns.newChangeBuffer({trackRemovals:!0});s=t.Ms;const a=[];e.targetChanges.forEach(((d,f)=>{const _=s.get(f);if(!_)return;a.push(t.Pi.removeMatchingKeys(i,d.removedDocuments,f).next((()=>t.Pi.addMatchingKeys(i,d.addedDocuments,f))));let g=_.withSequenceNumber(i.currentSequenceNumber);e.targetMismatches.get(f)!==null?g=g.withResumeToken(be.EMPTY_BYTE_STRING,z.min()).withLastLimboFreeSnapshotVersion(z.min()):d.resumeToken.approximateByteSize()>0&&(g=g.withResumeToken(d.resumeToken,r)),s=s.insert(f,g),(function(C,N,V){return C.resumeToken.approximateByteSize()===0||N.snapshotVersion.toMicroseconds()-C.snapshotVersion.toMicroseconds()>=Mb?!0:V.addedDocuments.size+V.modifiedDocuments.size+V.removedDocuments.size>0})(_,g,d)&&a.push(t.Pi.updateTargetData(i,g))}));let l=at(),u=K();if(e.documentUpdates.forEach((d=>{e.resolvedLimboDocuments.has(d)&&a.push(t.persistence.referenceDelegate.updateLimboDocument(i,d))})),a.push(xy(i,o,e.documentUpdates).next((d=>{l=d.ks,u=d.qs}))),!r.isEqual(z.min())){const d=t.Pi.getLastRemoteSnapshotVersion(i).next((f=>t.Pi.setTargetsMetadata(i,i.currentSequenceNumber,r)));a.push(d)}return b.waitFor(a).next((()=>o.apply(i))).next((()=>t.localDocuments.getLocalViewOfDocuments(i,l,u))).next((()=>l))})).then((i=>(t.Ms=s,i)))}function xy(n,e,t){let r=K(),s=K();return t.forEach((i=>r=r.add(i))),e.getEntries(n,r).next((i=>{let o=at();return t.forEach(((a,l)=>{const u=i.get(a);l.isFoundDocument()!==u.isFoundDocument()&&(s=s.add(a)),l.isNoDocument()&&l.version.isEqual(z.min())?(e.removeEntry(a,l.readTime),o=o.insert(a,l)):!u.isValidDocument()||l.version.compareTo(u.version)>0||l.version.compareTo(u.version)===0&&u.hasPendingWrites?(e.addEntry(l),o=o.insert(a,l)):x(Ch,"Ignoring outdated watch update for ",a,". Current version:",u.version," Watch version:",l.version)})),{ks:o,qs:s}}))}function Bb(n,e){const t=L(n);return t.persistence.runTransaction("Get next mutation batch","readonly",(r=>(e===void 0&&(e=Rn),t.mutationQueue.getNextMutationBatchAfterBatchId(r,e))))}function Ts(n,e){const t=L(n);return t.persistence.runTransaction("Allocate target","readwrite",(r=>{let s;return t.Pi.getTargetData(r,e).next((i=>i?(s=i,b.resolve(s)):t.Pi.allocateTargetId(r).next((o=>(s=new Kt(e,o,"TargetPurposeListen",r.currentSequenceNumber),t.Pi.addTargetData(r,s).next((()=>s)))))))})).then((r=>{const s=t.Ms.get(r.targetId);return(s===null||r.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(t.Ms=t.Ms.insert(r.targetId,r),t.xs.set(e,r.targetId)),r}))}async function ws(n,e,t){const r=L(n),s=r.Ms.get(e),i=t?"readwrite":"readwrite-primary";try{t||await r.persistence.runTransaction("Release target",i,(o=>r.persistence.referenceDelegate.removeTarget(o,s)))}catch(o){if(!Gn(o))throw o;x(Ch,`Failed to update sequence numbers for target ${e}: ${o}`)}r.Ms=r.Ms.remove(e),r.xs.delete(s.target)}function $a(n,e,t){const r=L(n);let s=z.min(),i=K();return r.persistence.runTransaction("Execute query","readwrite",(o=>(function(l,u,d){const f=L(l),_=f.xs.get(d);return _!==void 0?b.resolve(f.Ms.get(_)):f.Pi.getTargetData(u,d)})(r,o,Je(e)).next((a=>{if(a)return s=a.lastLimboFreeSnapshotVersion,r.Pi.getMatchingKeysForTargetId(o,a.targetId).next((l=>{i=l}))})).next((()=>r.Fs.getDocumentsMatchingQuery(o,e,t?s:z.min(),t?i:K()))).next((a=>(My(r,Fg(e),a),{documents:a,Qs:i})))))}function Vy(n,e){const t=L(n),r=L(t.Pi),s=t.Ms.get(e);return s?Promise.resolve(s.target):t.persistence.runTransaction("Get target data","readonly",(i=>r.At(i,e).next((o=>o?o.target:null))))}function Oy(n,e){const t=L(n),r=t.Os.get(e)||z.min();return t.persistence.runTransaction("Get new document changes","readonly",(s=>t.Ns.getAllFromCollectionGroup(s,e,eg(r,cs),Number.MAX_SAFE_INTEGER))).then((s=>(My(t,e,s),s)))}function My(n,e,t){let r=n.Os.get(e)||z.min();t.forEach(((s,i)=>{i.readTime.compareTo(r)>0&&(r=i.readTime)})),n.Os.set(e,r)}async function qb(n,e,t,r){const s=L(n);let i=K(),o=at();for(const u of t){const d=e.$s(u.metadata.name);u.document&&(i=i.add(d));const f=e.Us(u);f.setReadTime(e.Ks(u.metadata.readTime)),o=o.insert(d,f)}const a=s.Ns.newChangeBuffer({trackRemovals:!0}),l=await Ts(s,(function(d){return Je(Ls(X.fromString(`__bundle__/docs/${d}`)))})(r));return s.persistence.runTransaction("Apply bundle documents","readwrite",(u=>xy(u,a,o).next((d=>(a.apply(u),d))).next((d=>s.Pi.removeMatchingKeysForTargetId(u,l.targetId).next((()=>s.Pi.addMatchingKeys(u,i,l.targetId))).next((()=>s.localDocuments.getLocalViewOfDocuments(u,d.ks,d.qs))).next((()=>d.ks))))))}async function Gb(n,e,t=K()){const r=await Ts(n,Je(xc(e.bundledQuery))),s=L(n);return s.persistence.runTransaction("Save named query","readwrite",(i=>{const o=De(e.readTime);if(r.snapshotVersion.compareTo(o)>=0)return s.Ii.saveNamedQuery(i,e);const a=r.withResumeToken(be.EMPTY_BYTE_STRING,o);return s.Ms=s.Ms.insert(a.targetId,a),s.Pi.updateTargetData(i,a).next((()=>s.Pi.removeMatchingKeysForTargetId(i,r.targetId))).next((()=>s.Pi.addMatchingKeys(i,t,r.targetId))).next((()=>s.Ii.saveNamedQuery(i,e)))}))}/**
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
 */const Ly="firestore_clients";function s_(n,e){return`${Ly}_${n}_${e}`}const Fy="firestore_mutations";function i_(n,e,t){let r=`${Fy}_${n}_${t}`;return e.isAuthenticated()&&(r+=`_${e.uid}`),r}const Uy="firestore_targets";function Fl(n,e){return`${Uy}_${n}_${e}`}/**
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
 */const Dt="SharedClientState";class ja{constructor(e,t,r,s){this.user=e,this.batchId=t,this.state=r,this.error=s}static Ws(e,t,r){const s=JSON.parse(r);let i,o=typeof s=="object"&&["pending","acknowledged","rejected"].indexOf(s.state)!==-1&&(s.error===void 0||typeof s.error=="object");return o&&s.error&&(o=typeof s.error.message=="string"&&typeof s.error.code=="string",o&&(i=new D(s.error.code,s.error.message))),o?new ja(e,t,s.state,i):(Ne(Dt,`Failed to parse mutation state for ID '${t}': ${r}`),null)}Gs(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class Li{constructor(e,t,r){this.targetId=e,this.state=t,this.error=r}static Ws(e,t){const r=JSON.parse(t);let s,i=typeof r=="object"&&["not-current","current","rejected"].indexOf(r.state)!==-1&&(r.error===void 0||typeof r.error=="object");return i&&r.error&&(i=typeof r.error.message=="string"&&typeof r.error.code=="string",i&&(s=new D(r.error.code,r.error.message))),i?new Li(e,r.state,s):(Ne(Dt,`Failed to parse target state for ID '${e}': ${t}`),null)}Gs(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class Wa{constructor(e,t){this.clientId=e,this.activeTargetIds=t}static Ws(e,t){const r=JSON.parse(t);let s=typeof r=="object"&&r.activeTargetIds instanceof Array,i=fh();for(let o=0;s&&o<r.activeTargetIds.length;++o)s=ig(r.activeTargetIds[o]),i=i.add(r.activeTargetIds[o]);return s?new Wa(e,i):(Ne(Dt,`Failed to parse client data for instance '${e}': ${t}`),null)}}class Ph{constructor(e,t){this.clientId=e,this.onlineState=t}static Ws(e){const t=JSON.parse(e);return typeof t=="object"&&["Unknown","Online","Offline"].indexOf(t.onlineState)!==-1&&typeof t.clientId=="string"?new Ph(t.clientId,t.onlineState):(Ne(Dt,`Failed to parse online state: ${e}`),null)}}class bu{constructor(){this.activeTargetIds=fh()}zs(e){this.activeTargetIds=this.activeTargetIds.add(e)}js(e){this.activeTargetIds=this.activeTargetIds.delete(e)}Gs(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class Ul{constructor(e,t,r,s,i){this.window=e,this.Mi=t,this.persistenceKey=r,this.Js=s,this.syncEngine=null,this.onlineStateHandler=null,this.sequenceNumberHandler=null,this.Hs=this.Ys.bind(this),this.Zs=new Ae(j),this.started=!1,this.Xs=[];const o=r.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");this.storage=this.window.localStorage,this.currentUser=i,this.eo=s_(this.persistenceKey,this.Js),this.no=(function(l){return`firestore_sequence_number_${l}`})(this.persistenceKey),this.Zs=this.Zs.insert(this.Js,new bu),this.ro=new RegExp(`^${Ly}_${o}_([^_]*)$`),this.io=new RegExp(`^${Fy}_${o}_(\\d+)(?:_(.*))?$`),this.so=new RegExp(`^${Uy}_${o}_(\\d+)$`),this.oo=(function(l){return`firestore_online_state_${l}`})(this.persistenceKey),this._o=(function(l){return`firestore_bundle_loaded_v2_${l}`})(this.persistenceKey),this.window.addEventListener("storage",this.Hs)}static v(e){return!(!e||!e.localStorage)}async start(){const e=await this.syncEngine.Ts();for(const r of e){if(r===this.Js)continue;const s=this.getItem(s_(this.persistenceKey,r));if(s){const i=Wa.Ws(r,s);i&&(this.Zs=this.Zs.insert(i.clientId,i))}}this.ao();const t=this.storage.getItem(this.oo);if(t){const r=this.uo(t);r&&this.co(r)}for(const r of this.Xs)this.Ys(r);this.Xs=[],this.window.addEventListener("pagehide",(()=>this.shutdown())),this.started=!0}writeSequenceNumber(e){this.setItem(this.no,JSON.stringify(e))}getAllActiveQueryTargets(){return this.lo(this.Zs)}isActiveQueryTarget(e){let t=!1;return this.Zs.forEach(((r,s)=>{s.activeTargetIds.has(e)&&(t=!0)})),t}addPendingMutation(e){this.ho(e,"pending")}updateMutationState(e,t,r){this.ho(e,t,r),this.Po(e)}addLocalQueryTarget(e,t=!0){let r="not-current";if(this.isActiveQueryTarget(e)){const s=this.storage.getItem(Fl(this.persistenceKey,e));if(s){const i=Li.Ws(e,s);i&&(r=i.state)}}return t&&this.To.zs(e),this.ao(),r}removeLocalQueryTarget(e){this.To.js(e),this.ao()}isLocalQueryTarget(e){return this.To.activeTargetIds.has(e)}clearQueryState(e){this.removeItem(Fl(this.persistenceKey,e))}updateQueryState(e,t,r){this.Io(e,t,r)}handleUserChange(e,t,r){t.forEach((s=>{this.Po(s)})),this.currentUser=e,r.forEach((s=>{this.addPendingMutation(s)}))}setOnlineState(e){this.Eo(e)}notifyBundleLoaded(e){this.Ao(e)}shutdown(){this.started&&(this.window.removeEventListener("storage",this.Hs),this.removeItem(this.eo),this.started=!1)}getItem(e){const t=this.storage.getItem(e);return x(Dt,"READ",e,t),t}setItem(e,t){x(Dt,"SET",e,t),this.storage.setItem(e,t)}removeItem(e){x(Dt,"REMOVE",e),this.storage.removeItem(e)}Ys(e){const t=e;if(t.storageArea===this.storage){if(x(Dt,"EVENT",t.key,t.newValue),t.key===this.eo)return void Ne("Received WebStorage notification for local change. Another client might have garbage-collected our state");this.Mi.enqueueRetryable((async()=>{if(this.started){if(t.key!==null){if(this.ro.test(t.key)){if(t.newValue==null){const r=this.Ro(t.key);return this.Vo(r,null)}{const r=this.mo(t.key,t.newValue);if(r)return this.Vo(r.clientId,r)}}else if(this.io.test(t.key)){if(t.newValue!==null){const r=this.fo(t.key,t.newValue);if(r)return this.po(r)}}else if(this.so.test(t.key)){if(t.newValue!==null){const r=this.yo(t.key,t.newValue);if(r)return this.wo(r)}}else if(t.key===this.oo){if(t.newValue!==null){const r=this.uo(t.newValue);if(r)return this.co(r)}}else if(t.key===this.no){const r=(function(i){let o=it.ce;if(i!=null)try{const a=JSON.parse(i);G(typeof a=="number",30636,{So:i}),o=a}catch(a){Ne(Dt,"Failed to read sequence number from WebStorage",a)}return o})(t.newValue);r!==it.ce&&this.sequenceNumberHandler(r)}else if(t.key===this._o){const r=this.bo(t.newValue);await Promise.all(r.map((s=>this.syncEngine.Do(s))))}}}else this.Xs.push(t)}))}}get To(){return this.Zs.get(this.Js)}ao(){this.setItem(this.eo,this.To.Gs())}ho(e,t,r){const s=new ja(this.currentUser,e,t,r),i=i_(this.persistenceKey,this.currentUser,e);this.setItem(i,s.Gs())}Po(e){const t=i_(this.persistenceKey,this.currentUser,e);this.removeItem(t)}Eo(e){const t={clientId:this.Js,onlineState:e};this.storage.setItem(this.oo,JSON.stringify(t))}Io(e,t,r){const s=Fl(this.persistenceKey,e),i=new Li(e,t,r);this.setItem(s,i.Gs())}Ao(e){const t=JSON.stringify(Array.from(e));this.setItem(this._o,t)}Ro(e){const t=this.ro.exec(e);return t?t[1]:null}mo(e,t){const r=this.Ro(e);return Wa.Ws(r,t)}fo(e,t){const r=this.io.exec(e),s=Number(r[1]),i=r[2]!==void 0?r[2]:null;return ja.Ws(new Ge(i),s,t)}yo(e,t){const r=this.so.exec(e),s=Number(r[1]);return Li.Ws(s,t)}uo(e){return Ph.Ws(e)}bo(e){return JSON.parse(e)}async po(e){if(e.user.uid===this.currentUser.uid)return this.syncEngine.Co(e.batchId,e.state,e.error);x(Dt,`Ignoring mutation for non-active user ${e.user.uid}`)}wo(e){return this.syncEngine.vo(e.targetId,e.state,e.error)}Vo(e,t){const r=t?this.Zs.insert(e,t):this.Zs.remove(e),s=this.lo(this.Zs),i=this.lo(r),o=[],a=[];return i.forEach((l=>{s.has(l)||o.push(l)})),s.forEach((l=>{i.has(l)||a.push(l)})),this.syncEngine.Fo(o,a).then((()=>{this.Zs=r}))}co(e){this.Zs.get(e.clientId)&&this.onlineStateHandler(e.onlineState)}lo(e){let t=fh();return e.forEach(((r,s)=>{t=t.unionWith(s.activeTargetIds)})),t}}class By{constructor(){this.Mo=new bu,this.xo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,r){}addLocalQueryTarget(e,t=!0){return t&&this.Mo.zs(e),this.xo[e]||"not-current"}updateQueryState(e,t,r){this.xo[e]=t}removeLocalQueryTarget(e){this.Mo.js(e)}isLocalQueryTarget(e){return this.Mo.activeTargetIds.has(e)}clearQueryState(e){delete this.xo[e]}getAllActiveQueryTargets(){return this.Mo.activeTargetIds}isActiveQueryTarget(e){return this.Mo.activeTargetIds.has(e)}start(){return this.Mo=new bu,Promise.resolve()}handleUserChange(e,t,r){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}/**
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
 */class zb{Oo(e){}shutdown(){}}/**
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
 */const o_="ConnectivityMonitor";class a_{constructor(){this.No=()=>this.Bo(),this.Lo=()=>this.ko(),this.qo=[],this.Qo()}Oo(e){this.qo.push(e)}shutdown(){window.removeEventListener("online",this.No),window.removeEventListener("offline",this.Lo)}Qo(){window.addEventListener("online",this.No),window.addEventListener("offline",this.Lo)}Bo(){x(o_,"Network connectivity changed: AVAILABLE");for(const e of this.qo)e(0)}ko(){x(o_,"Network connectivity changed: UNAVAILABLE");for(const e of this.qo)e(1)}static v(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
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
 */let la=null;function Ru(){return la===null?la=(function(){return 268435456+Math.round(2147483648*Math.random())})():la++,"0x"+la.toString(16)}/**
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
 */const Bl="RestConnection",$b={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};class jb{get $o(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const t=e.ssl?"https":"http",r=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.Uo=t+"://"+e.host,this.Ko=`projects/${r}/databases/${s}`,this.Wo=this.databaseId.database===eo?`project_id=${r}`:`project_id=${r}&database_id=${s}`}Go(e,t,r,s,i){const o=Ru(),a=this.zo(e,t.toUriEncodedString());x(Bl,`Sending RPC '${e}' ${o}:`,a,r);const l={"google-cloud-resource-prefix":this.Ko,"x-goog-request-params":this.Wo};this.jo(l,s,i);const{host:u}=new URL(a),d=wt(u);return this.Jo(e,a,l,r,d).then((f=>(x(Bl,`Received RPC '${e}' ${o}: `,f),f)),(f=>{throw yt(Bl,`RPC '${e}' ${o} failed with error: `,f,"url: ",a,"request:",r),f}))}Ho(e,t,r,s,i,o){return this.Go(e,t,r,s,i)}jo(e,t,r){e["X-Goog-Api-Client"]=(function(){return"gl-js/ fire/"+Ms})(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach(((s,i)=>e[i]=s)),r&&r.headers.forEach(((s,i)=>e[i]=s))}zo(e,t){const r=$b[e];return`${this.Uo}/v1/${t}:${r}`}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wb{constructor(e){this.Yo=e.Yo,this.Zo=e.Zo}Xo(e){this.e_=e}t_(e){this.n_=e}r_(e){this.i_=e}onMessage(e){this.s_=e}close(){this.Zo()}send(e){this.Yo(e)}o_(){this.e_()}__(){this.n_()}a_(e){this.i_(e)}u_(e){this.s_(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const He="WebChannelConnection";class Kb extends jb{constructor(e){super(e),this.c_=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}Jo(e,t,r,s,i){const o=Ru();return new Promise(((a,l)=>{const u=new Gm;u.setWithCredentials(!0),u.listenOnce(zm.COMPLETE,(()=>{try{switch(u.getLastErrorCode()){case ma.NO_ERROR:const f=u.getResponseJson();x(He,`XHR for RPC '${e}' ${o} received:`,JSON.stringify(f)),a(f);break;case ma.TIMEOUT:x(He,`RPC '${e}' ${o} timed out`),l(new D(S.DEADLINE_EXCEEDED,"Request time out"));break;case ma.HTTP_ERROR:const _=u.getStatus();if(x(He,`RPC '${e}' ${o} failed with status:`,_,"response text:",u.getResponseText()),_>0){let g=u.getResponseJson();Array.isArray(g)&&(g=g[0]);const v=g==null?void 0:g.error;if(v&&v.status&&v.message){const C=(function(V){const B=V.toLowerCase().replace(/_/g,"-");return Object.values(S).indexOf(B)>=0?B:S.UNKNOWN})(v.status);l(new D(C,v.message))}else l(new D(S.UNKNOWN,"Server responded with status "+u.getStatus()))}else l(new D(S.UNAVAILABLE,"Connection failed."));break;default:q(9055,{l_:e,streamId:o,h_:u.getLastErrorCode(),P_:u.getLastError()})}}finally{x(He,`RPC '${e}' ${o} completed.`)}}));const d=JSON.stringify(s);x(He,`RPC '${e}' ${o} sending request:`,s),u.send(t,"POST",d,r,15)}))}T_(e,t,r){const s=Ru(),i=[this.Uo,"/","google.firestore.v1.Firestore","/",e,"/channel"],o=Wm(),a=jm(),l={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},u=this.longPollingOptions.timeoutSeconds;u!==void 0&&(l.longPollingTimeout=Math.round(1e3*u)),this.useFetchStreams&&(l.useFetchStreams=!0),this.jo(l.initMessageHeaders,t,r),l.encodeInitMessageHeaders=!0;const d=i.join("");x(He,`Creating RPC '${e}' stream ${s}: ${d}`,l);const f=o.createWebChannel(d,l);this.I_(f);let _=!1,g=!1;const v=new Wb({Yo:N=>{g?x(He,`Not sending because RPC '${e}' stream ${s} is closed:`,N):(_||(x(He,`Opening RPC '${e}' stream ${s} transport.`),f.open(),_=!0),x(He,`RPC '${e}' stream ${s} sending:`,N),f.send(N))},Zo:()=>f.close()}),C=(N,V,B)=>{N.listen(V,(U=>{try{B(U)}catch($){setTimeout((()=>{throw $}),0)}}))};return C(f,vi.EventType.OPEN,(()=>{g||(x(He,`RPC '${e}' stream ${s} transport opened.`),v.o_())})),C(f,vi.EventType.CLOSE,(()=>{g||(g=!0,x(He,`RPC '${e}' stream ${s} transport closed`),v.a_(),this.E_(f))})),C(f,vi.EventType.ERROR,(N=>{g||(g=!0,yt(He,`RPC '${e}' stream ${s} transport errored. Name:`,N.name,"Message:",N.message),v.a_(new D(S.UNAVAILABLE,"The operation could not be completed")))})),C(f,vi.EventType.MESSAGE,(N=>{var V;if(!g){const B=N.data[0];G(!!B,16349);const U=B,$=(U==null?void 0:U.error)||((V=U[0])==null?void 0:V.error);if($){x(He,`RPC '${e}' stream ${s} received error:`,$);const se=$.status;let Q=(function(E){const A=xe[E];if(A!==void 0)return Zg(A)})(se),T=$.message;Q===void 0&&(Q=S.INTERNAL,T="Unknown error status: "+se+" with message "+$.message),g=!0,v.a_(new D(Q,T)),f.close()}else x(He,`RPC '${e}' stream ${s} received:`,B),v.u_(B)}})),C(a,$m.STAT_EVENT,(N=>{N.stat===nu.PROXY?x(He,`RPC '${e}' stream ${s} detected buffering proxy`):N.stat===nu.NOPROXY&&x(He,`RPC '${e}' stream ${s} detected no buffering proxy`)})),setTimeout((()=>{v.__()}),0),v}terminate(){this.c_.forEach((e=>e.close())),this.c_=[]}I_(e){this.c_.push(e)}E_(e){this.c_=this.c_.filter((t=>t===e))}}/**
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
 */function qy(){return typeof window<"u"?window:null}function ba(){return typeof document<"u"?document:null}/**
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
 */function Dr(n){return new ZA(n,!0)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nh{constructor(e,t,r=1e3,s=1.5,i=6e4){this.Mi=e,this.timerId=t,this.d_=r,this.A_=s,this.R_=i,this.V_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.V_=0}g_(){this.V_=this.R_}p_(e){this.cancel();const t=Math.floor(this.V_+this.y_()),r=Math.max(0,Date.now()-this.f_),s=Math.max(0,t-r);s>0&&x("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.V_} ms, delay with jitter: ${t} ms, last attempt: ${r} ms ago)`),this.m_=this.Mi.enqueueAfterDelay(this.timerId,s,(()=>(this.f_=Date.now(),e()))),this.V_*=this.A_,this.V_<this.d_&&(this.V_=this.d_),this.V_>this.R_&&(this.V_=this.R_)}w_(){this.m_!==null&&(this.m_.skipDelay(),this.m_=null)}cancel(){this.m_!==null&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.V_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const c_="PersistentStream";class Gy{constructor(e,t,r,s,i,o,a,l){this.Mi=e,this.S_=r,this.b_=s,this.connection=i,this.authCredentialsProvider=o,this.appCheckCredentialsProvider=a,this.listener=l,this.state=0,this.D_=0,this.C_=null,this.v_=null,this.stream=null,this.F_=0,this.M_=new Nh(e,t)}x_(){return this.state===1||this.state===5||this.O_()}O_(){return this.state===2||this.state===3}start(){this.F_=0,this.state!==4?this.auth():this.N_()}async stop(){this.x_()&&await this.close(0)}B_(){this.state=0,this.M_.reset()}L_(){this.O_()&&this.C_===null&&(this.C_=this.Mi.enqueueAfterDelay(this.S_,6e4,(()=>this.k_())))}q_(e){this.Q_(),this.stream.send(e)}async k_(){if(this.O_())return this.close(0)}Q_(){this.C_&&(this.C_.cancel(),this.C_=null)}U_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(e,t){this.Q_(),this.U_(),this.M_.cancel(),this.D_++,e!==4?this.M_.reset():t&&t.code===S.RESOURCE_EXHAUSTED?(Ne(t.toString()),Ne("Using maximum backoff delay to prevent overloading the backend."),this.M_.g_()):t&&t.code===S.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.K_(),this.stream.close(),this.stream=null),this.state=e,await this.listener.r_(t)}K_(){}auth(){this.state=1;const e=this.W_(this.D_),t=this.D_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then((([r,s])=>{this.D_===t&&this.G_(r,s)}),(r=>{e((()=>{const s=new D(S.UNKNOWN,"Fetching auth token failed: "+r.message);return this.z_(s)}))}))}G_(e,t){const r=this.W_(this.D_);this.stream=this.j_(e,t),this.stream.Xo((()=>{r((()=>this.listener.Xo()))})),this.stream.t_((()=>{r((()=>(this.state=2,this.v_=this.Mi.enqueueAfterDelay(this.b_,1e4,(()=>(this.O_()&&(this.state=3),Promise.resolve()))),this.listener.t_())))})),this.stream.r_((s=>{r((()=>this.z_(s)))})),this.stream.onMessage((s=>{r((()=>++this.F_==1?this.J_(s):this.onNext(s)))}))}N_(){this.state=5,this.M_.p_((async()=>{this.state=0,this.start()}))}z_(e){return x(c_,`close with error: ${e}`),this.stream=null,this.close(4,e)}W_(e){return t=>{this.Mi.enqueueAndForget((()=>this.D_===e?t():(x(c_,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve())))}}}class Hb extends Gy{constructor(e,t,r,s,i,o){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,r,s,o),this.serializer=i}j_(e,t){return this.connection.T_("Listen",e,t)}J_(e){return this.onNext(e)}onNext(e){this.M_.reset();const t=nb(this.serializer,e),r=(function(i){if(!("targetChange"in i))return z.min();const o=i.targetChange;return o.targetIds&&o.targetIds.length?z.min():o.readTime?De(o.readTime):z.min()})(e);return this.listener.H_(t,r)}Y_(e){const t={};t.database=Eu(this.serializer),t.addTarget=(function(i,o){let a;const l=o.target;if(a=La(l)?{documents:cy(i,l)}:{query:Dc(i,l).ft},a.targetId=o.targetId,o.resumeToken.approximateByteSize()>0){a.resumeToken=ry(i,o.resumeToken);const u=yu(i,o.expectedCount);u!==null&&(a.expectedCount=u)}else if(o.snapshotVersion.compareTo(z.min())>0){a.readTime=Es(i,o.snapshotVersion.toTimestamp());const u=yu(i,o.expectedCount);u!==null&&(a.expectedCount=u)}return a})(this.serializer,e);const r=sb(this.serializer,e);r&&(t.labels=r),this.q_(t)}Z_(e){const t={};t.database=Eu(this.serializer),t.removeTarget=e,this.q_(t)}}class Qb extends Gy{constructor(e,t,r,s,i,o){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,r,s,o),this.serializer=i}get X_(){return this.F_>0}start(){this.lastStreamToken=void 0,super.start()}K_(){this.X_&&this.ea([])}j_(e,t){return this.connection.T_("Write",e,t)}J_(e){return G(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,G(!e.writeResults||e.writeResults.length===0,55816),this.listener.ta()}onNext(e){G(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this.M_.reset();const t=rb(e.writeResults,e.commitTime),r=De(e.commitTime);return this.listener.na(r,t)}ra(){const e={};e.database=Eu(this.serializer),this.q_(e)}ea(e){const t={streamToken:this.lastStreamToken,writes:e.map((r=>io(this.serializer,r)))};this.q_(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yb{}class Jb extends Yb{constructor(e,t,r,s){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=r,this.serializer=s,this.ia=!1}sa(){if(this.ia)throw new D(S.FAILED_PRECONDITION,"The client has already been terminated.")}Go(e,t,r,s){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([i,o])=>this.connection.Go(e,Iu(t,r),s,i,o))).catch((i=>{throw i.name==="FirebaseError"?(i.code===S.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),i):new D(S.UNKNOWN,i.toString())}))}Ho(e,t,r,s,i){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([o,a])=>this.connection.Ho(e,Iu(t,r),s,o,a,i))).catch((o=>{throw o.name==="FirebaseError"?(o.code===S.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new D(S.UNKNOWN,o.toString())}))}terminate(){this.ia=!0,this.connection.terminate()}}class Xb{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.oa=0,this._a=null,this.aa=!0}ua(){this.oa===0&&(this.ca("Unknown"),this._a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,(()=>(this._a=null,this.la("Backend didn't respond within 10 seconds."),this.ca("Offline"),Promise.resolve()))))}ha(e){this.state==="Online"?this.ca("Unknown"):(this.oa++,this.oa>=1&&(this.Pa(),this.la(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.ca("Offline")))}set(e){this.Pa(),this.oa=0,e==="Online"&&(this.aa=!1),this.ca(e)}ca(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}la(e){const t=`Could not reach Cloud Firestore backend. ${e}
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
 */const br="RemoteStore";class Zb{constructor(e,t,r,s,i){this.localStore=e,this.datastore=t,this.asyncQueue=r,this.remoteSyncer={},this.Ta=[],this.Ia=new Map,this.Ea=new Set,this.da=[],this.Aa=i,this.Aa.Oo((o=>{r.enqueueAndForget((async()=>{$n(this)&&(x(br,"Restarting streams for network reachability change."),await(async function(l){const u=L(l);u.Ea.add(4),await Bs(u),u.Ra.set("Unknown"),u.Ea.delete(4),await Co(u)})(this))}))})),this.Ra=new Xb(r,s)}}async function Co(n){if($n(n))for(const e of n.da)await e(!0)}async function Bs(n){for(const e of n.da)await e(!1)}function Lc(n,e){const t=L(n);t.Ia.has(e.targetId)||(t.Ia.set(e.targetId,e),xh(t)?Dh(t):Gs(t).O_()&&kh(t,e))}function vs(n,e){const t=L(n),r=Gs(t);t.Ia.delete(e),r.O_()&&zy(t,e),t.Ia.size===0&&(r.O_()?r.L_():$n(t)&&t.Ra.set("Unknown"))}function kh(n,e){if(n.Va.Ue(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(z.min())>0){const t=n.remoteSyncer.getRemoteKeysForTarget(e.targetId).size;e=e.withExpectedCount(t)}Gs(n).Y_(e)}function zy(n,e){n.Va.Ue(e),Gs(n).Z_(e)}function Dh(n){n.Va=new QA({getRemoteKeysForTarget:e=>n.remoteSyncer.getRemoteKeysForTarget(e),At:e=>n.Ia.get(e)||null,ht:()=>n.datastore.serializer.databaseId}),Gs(n).start(),n.Ra.ua()}function xh(n){return $n(n)&&!Gs(n).x_()&&n.Ia.size>0}function $n(n){return L(n).Ea.size===0}function $y(n){n.Va=void 0}async function eR(n){n.Ra.set("Online")}async function tR(n){n.Ia.forEach(((e,t)=>{kh(n,e)}))}async function nR(n,e){$y(n),xh(n)?(n.Ra.ha(e),Dh(n)):n.Ra.set("Unknown")}async function rR(n,e,t){if(n.Ra.set("Online"),e instanceof ny&&e.state===2&&e.cause)try{await(async function(s,i){const o=i.cause;for(const a of i.targetIds)s.Ia.has(a)&&(await s.remoteSyncer.rejectListen(a,o),s.Ia.delete(a),s.Va.removeTarget(a))})(n,e)}catch(r){x(br,"Failed to remove targets %s: %s ",e.targetIds.join(","),r),await Ka(n,r)}else if(e instanceof va?n.Va.Ze(e):e instanceof ty?n.Va.st(e):n.Va.tt(e),!t.isEqual(z.min()))try{const r=await Dy(n.localStore);t.compareTo(r)>=0&&await(function(i,o){const a=i.Va.Tt(o);return a.targetChanges.forEach(((l,u)=>{if(l.resumeToken.approximateByteSize()>0){const d=i.Ia.get(u);d&&i.Ia.set(u,d.withResumeToken(l.resumeToken,o))}})),a.targetMismatches.forEach(((l,u)=>{const d=i.Ia.get(l);if(!d)return;i.Ia.set(l,d.withResumeToken(be.EMPTY_BYTE_STRING,d.snapshotVersion)),zy(i,l);const f=new Kt(d.target,l,u,d.sequenceNumber);kh(i,f)})),i.remoteSyncer.applyRemoteEvent(a)})(n,t)}catch(r){x(br,"Failed to raise snapshot:",r),await Ka(n,r)}}async function Ka(n,e,t){if(!Gn(e))throw e;n.Ea.add(1),await Bs(n),n.Ra.set("Offline"),t||(t=()=>Dy(n.localStore)),n.asyncQueue.enqueueRetryable((async()=>{x(br,"Retrying IndexedDB access"),await t(),n.Ea.delete(1),await Co(n)}))}function jy(n,e){return e().catch((t=>Ka(n,t,e)))}async function qs(n){const e=L(n),t=On(e);let r=e.Ta.length>0?e.Ta[e.Ta.length-1].batchId:Rn;for(;sR(e);)try{const s=await Bb(e.localStore,r);if(s===null){e.Ta.length===0&&t.L_();break}r=s.batchId,iR(e,s)}catch(s){await Ka(e,s)}Wy(e)&&Ky(e)}function sR(n){return $n(n)&&n.Ta.length<10}function iR(n,e){n.Ta.push(e);const t=On(n);t.O_()&&t.X_&&t.ea(e.mutations)}function Wy(n){return $n(n)&&!On(n).x_()&&n.Ta.length>0}function Ky(n){On(n).start()}async function oR(n){On(n).ra()}async function aR(n){const e=On(n);for(const t of n.Ta)e.ea(t.mutations)}async function cR(n,e,t){const r=n.Ta.shift(),s=gh.from(r,e,t);await jy(n,(()=>n.remoteSyncer.applySuccessfulWrite(s))),await qs(n)}async function lR(n,e){e&&On(n).X_&&await(async function(r,s){if((function(o){return Xg(o)&&o!==S.ABORTED})(s.code)){const i=r.Ta.shift();On(r).B_(),await jy(r,(()=>r.remoteSyncer.rejectFailedWrite(i.batchId,s))),await qs(r)}})(n,e),Wy(n)&&Ky(n)}async function l_(n,e){const t=L(n);t.asyncQueue.verifyOperationInProgress(),x(br,"RemoteStore received new credentials");const r=$n(t);t.Ea.add(3),await Bs(t),r&&t.Ra.set("Unknown"),await t.remoteSyncer.handleCredentialChange(e),t.Ea.delete(3),await Co(t)}async function Su(n,e){const t=L(n);e?(t.Ea.delete(2),await Co(t)):e||(t.Ea.add(2),await Bs(t),t.Ra.set("Unknown"))}function Gs(n){return n.ma||(n.ma=(function(t,r,s){const i=L(t);return i.sa(),new Hb(r,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(n.datastore,n.asyncQueue,{Xo:eR.bind(null,n),t_:tR.bind(null,n),r_:nR.bind(null,n),H_:rR.bind(null,n)}),n.da.push((async e=>{e?(n.ma.B_(),xh(n)?Dh(n):n.Ra.set("Unknown")):(await n.ma.stop(),$y(n))}))),n.ma}function On(n){return n.fa||(n.fa=(function(t,r,s){const i=L(t);return i.sa(),new Qb(r,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(n.datastore,n.asyncQueue,{Xo:()=>Promise.resolve(),t_:oR.bind(null,n),r_:lR.bind(null,n),ta:aR.bind(null,n),na:cR.bind(null,n)}),n.da.push((async e=>{e?(n.fa.B_(),await qs(n)):(await n.fa.stop(),n.Ta.length>0&&(x(br,`Stopping write stream with ${n.Ta.length} pending writes`),n.Ta=[]))}))),n.fa}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vh{constructor(e,t,r,s,i){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=r,this.op=s,this.removalCallback=i,this.deferred=new $e,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch((o=>{}))}get promise(){return this.deferred.promise}static createAndSchedule(e,t,r,s,i){const o=Date.now()+r,a=new Vh(e,t,o,s,i);return a.start(r),a}start(e){this.timerHandle=setTimeout((()=>this.handleDelayElapsed()),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new D(S.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget((()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then((e=>this.deferred.resolve(e)))):Promise.resolve()))}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function zs(n,e){if(Ne("AsyncQueue",`${e}: ${n}`),Gn(n))return new D(S.UNAVAILABLE,`${e}: ${n}`);throw n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mr{static emptySet(e){return new mr(e.comparator)}constructor(e){this.comparator=e?(t,r)=>e(t,r)||M.comparator(t.key,r.key):(t,r)=>M.comparator(t.key,r.key),this.keyedMap=Ai(),this.sortedSet=new Ae(this.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal(((t,r)=>(e(t),!1)))}add(e){const t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){const t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof mr)||this.size!==e.size)return!1;const t=this.sortedSet.getIterator(),r=e.sortedSet.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=r.getNext().key;if(!s.isEqual(i))return!1}return!0}toString(){const e=[];return this.forEach((t=>{e.push(t.toString())})),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,t){const r=new mr;return r.comparator=this.comparator,r.keyedMap=e,r.sortedSet=t,r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class u_{constructor(){this.ga=new Ae(M.comparator)}track(e){const t=e.doc.key,r=this.ga.get(t);r?e.type!==0&&r.type===3?this.ga=this.ga.insert(t,e):e.type===3&&r.type!==1?this.ga=this.ga.insert(t,{type:r.type,doc:e.doc}):e.type===2&&r.type===2?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):e.type===2&&r.type===0?this.ga=this.ga.insert(t,{type:0,doc:e.doc}):e.type===1&&r.type===0?this.ga=this.ga.remove(t):e.type===1&&r.type===2?this.ga=this.ga.insert(t,{type:1,doc:r.doc}):e.type===0&&r.type===1?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):q(63341,{Rt:e,pa:r}):this.ga=this.ga.insert(t,e)}ya(){const e=[];return this.ga.inorderTraversal(((t,r)=>{e.push(r)})),e}}class Rr{constructor(e,t,r,s,i,o,a,l,u){this.query=e,this.docs=t,this.oldDocs=r,this.docChanges=s,this.mutatedKeys=i,this.fromCache=o,this.syncStateChanged=a,this.excludesMetadataChanges=l,this.hasCachedResults=u}static fromInitialDocuments(e,t,r,s,i){const o=[];return t.forEach((a=>{o.push({type:0,doc:a})})),new Rr(e,t,mr.emptySet(t),o,r,s,!0,!1,i)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&vo(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const t=this.docChanges,r=e.docChanges;if(t.length!==r.length)return!1;for(let s=0;s<t.length;s++)if(t[s].type!==r[s].type||!t[s].doc.isEqual(r[s].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class uR{constructor(){this.wa=void 0,this.Sa=[]}ba(){return this.Sa.some((e=>e.Da()))}}class hR{constructor(){this.queries=h_(),this.onlineState="Unknown",this.Ca=new Set}terminate(){(function(t,r){const s=L(t),i=s.queries;s.queries=h_(),i.forEach(((o,a)=>{for(const l of a.Sa)l.onError(r)}))})(this,new D(S.ABORTED,"Firestore shutting down"))}}function h_(){return new sn((n=>Lg(n)),vo)}async function Oh(n,e){const t=L(n);let r=3;const s=e.query;let i=t.queries.get(s);i?!i.ba()&&e.Da()&&(r=2):(i=new uR,r=e.Da()?0:1);try{switch(r){case 0:i.wa=await t.onListen(s,!0);break;case 1:i.wa=await t.onListen(s,!1);break;case 2:await t.onFirstRemoteStoreListen(s)}}catch(o){const a=zs(o,`Initialization of query '${Qr(e.query)}' failed`);return void e.onError(a)}t.queries.set(s,i),i.Sa.push(e),e.va(t.onlineState),i.wa&&e.Fa(i.wa)&&Lh(t)}async function Mh(n,e){const t=L(n),r=e.query;let s=3;const i=t.queries.get(r);if(i){const o=i.Sa.indexOf(e);o>=0&&(i.Sa.splice(o,1),i.Sa.length===0?s=e.Da()?0:1:!i.ba()&&e.Da()&&(s=2))}switch(s){case 0:return t.queries.delete(r),t.onUnlisten(r,!0);case 1:return t.queries.delete(r),t.onUnlisten(r,!1);case 2:return t.onLastRemoteStoreUnlisten(r);default:return}}function dR(n,e){const t=L(n);let r=!1;for(const s of e){const i=s.query,o=t.queries.get(i);if(o){for(const a of o.Sa)a.Fa(s)&&(r=!0);o.wa=s}}r&&Lh(t)}function fR(n,e,t){const r=L(n),s=r.queries.get(e);if(s)for(const i of s.Sa)i.onError(t);r.queries.delete(e)}function Lh(n){n.Ca.forEach((e=>{e.next()}))}var Cu,d_;(d_=Cu||(Cu={})).Ma="default",d_.Cache="cache";class Fh{constructor(e,t,r){this.query=e,this.xa=t,this.Oa=!1,this.Na=null,this.onlineState="Unknown",this.options=r||{}}Fa(e){if(!this.options.includeMetadataChanges){const r=[];for(const s of e.docChanges)s.type!==3&&r.push(s);e=new Rr(e.query,e.docs,e.oldDocs,r,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.Oa?this.Ba(e)&&(this.xa.next(e),t=!0):this.La(e,this.onlineState)&&(this.ka(e),t=!0),this.Na=e,t}onError(e){this.xa.error(e)}va(e){this.onlineState=e;let t=!1;return this.Na&&!this.Oa&&this.La(this.Na,e)&&(this.ka(this.Na),t=!0),t}La(e,t){if(!e.fromCache||!this.Da())return!0;const r=t!=="Offline";return(!this.options.qa||!r)&&(!e.docs.isEmpty()||e.hasCachedResults||t==="Offline")}Ba(e){if(e.docChanges.length>0)return!0;const t=this.Na&&this.Na.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&this.options.includeMetadataChanges===!0}ka(e){e=Rr.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.Oa=!0,this.xa.next(e)}Da(){return this.options.source!==Cu.Cache}}/**
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
 */class Hy{constructor(e,t){this.Qa=e,this.byteLength=t}$a(){return"metadata"in this.Qa}}/**
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
 */class f_{constructor(e){this.serializer=e}$s(e){return Ut(this.serializer,e)}Us(e){return e.metadata.exists?kc(this.serializer,e.document,!1):ye.newNoDocument(this.$s(e.metadata.name),this.Ks(e.metadata.readTime))}Ks(e){return De(e)}}class Uh{constructor(e,t){this.Ua=e,this.serializer=t,this.Ka=[],this.Wa=[],this.collectionGroups=new Set,this.progress=Qy(e)}get queries(){return this.Ka}get documents(){return this.Wa}Ga(e){this.progress.bytesLoaded+=e.byteLength;let t=this.progress.documentsLoaded;if(e.Qa.namedQuery)this.Ka.push(e.Qa.namedQuery);else if(e.Qa.documentMetadata){this.Wa.push({metadata:e.Qa.documentMetadata}),e.Qa.documentMetadata.exists||++t;const r=X.fromString(e.Qa.documentMetadata.name);this.collectionGroups.add(r.get(r.length-2))}else e.Qa.document&&(this.Wa[this.Wa.length-1].document=e.Qa.document,++t);return t!==this.progress.documentsLoaded?(this.progress.documentsLoaded=t,{...this.progress}):null}za(e){const t=new Map,r=new f_(this.serializer);for(const s of e)if(s.metadata.queries){const i=r.$s(s.metadata.name);for(const o of s.metadata.queries){const a=(t.get(o)||K()).add(i);t.set(o,a)}}return t}async ja(e){const t=await qb(e,new f_(this.serializer),this.Wa,this.Ua.id),r=this.za(this.documents);for(const s of this.Ka)await Gb(e,s,r.get(s.name));return this.progress.taskState="Success",{progress:this.progress,Ja:this.collectionGroups,Ha:t}}}function Qy(n){return{taskState:"Running",documentsLoaded:0,bytesLoaded:0,totalDocuments:n.totalDocuments,totalBytes:n.totalBytes}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yy{constructor(e){this.key=e}}class Jy{constructor(e){this.key=e}}class Xy{constructor(e,t){this.query=e,this.Ya=t,this.Za=null,this.hasCachedResults=!1,this.current=!1,this.Xa=K(),this.mutatedKeys=K(),this.eu=Ug(e),this.tu=new mr(this.eu)}get nu(){return this.Ya}ru(e,t){const r=t?t.iu:new u_,s=t?t.tu:this.tu;let i=t?t.mutatedKeys:this.mutatedKeys,o=s,a=!1;const l=this.query.limitType==="F"&&s.size===this.query.limit?s.last():null,u=this.query.limitType==="L"&&s.size===this.query.limit?s.first():null;if(e.inorderTraversal(((d,f)=>{const _=s.get(d),g=Ao(this.query,f)?f:null,v=!!_&&this.mutatedKeys.has(_.key),C=!!g&&(g.hasLocalMutations||this.mutatedKeys.has(g.key)&&g.hasCommittedMutations);let N=!1;_&&g?_.data.isEqual(g.data)?v!==C&&(r.track({type:3,doc:g}),N=!0):this.su(_,g)||(r.track({type:2,doc:g}),N=!0,(l&&this.eu(g,l)>0||u&&this.eu(g,u)<0)&&(a=!0)):!_&&g?(r.track({type:0,doc:g}),N=!0):_&&!g&&(r.track({type:1,doc:_}),N=!0,(l||u)&&(a=!0)),N&&(g?(o=o.add(g),i=C?i.add(d):i.delete(d)):(o=o.delete(d),i=i.delete(d)))})),this.query.limit!==null)for(;o.size>this.query.limit;){const d=this.query.limitType==="F"?o.last():o.first();o=o.delete(d.key),i=i.delete(d.key),r.track({type:1,doc:d})}return{tu:o,iu:r,Cs:a,mutatedKeys:i}}su(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,r,s){const i=this.tu;this.tu=e.tu,this.mutatedKeys=e.mutatedKeys;const o=e.iu.ya();o.sort(((d,f)=>(function(g,v){const C=N=>{switch(N){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return q(20277,{Rt:N})}};return C(g)-C(v)})(d.type,f.type)||this.eu(d.doc,f.doc))),this.ou(r),s=s??!1;const a=t&&!s?this._u():[],l=this.Xa.size===0&&this.current&&!s?1:0,u=l!==this.Za;return this.Za=l,o.length!==0||u?{snapshot:new Rr(this.query,e.tu,i,o,e.mutatedKeys,l===0,u,!1,!!r&&r.resumeToken.approximateByteSize()>0),au:a}:{au:a}}va(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({tu:this.tu,iu:new u_,mutatedKeys:this.mutatedKeys,Cs:!1},!1)):{au:[]}}uu(e){return!this.Ya.has(e)&&!!this.tu.has(e)&&!this.tu.get(e).hasLocalMutations}ou(e){e&&(e.addedDocuments.forEach((t=>this.Ya=this.Ya.add(t))),e.modifiedDocuments.forEach((t=>{})),e.removedDocuments.forEach((t=>this.Ya=this.Ya.delete(t))),this.current=e.current)}_u(){if(!this.current)return[];const e=this.Xa;this.Xa=K(),this.tu.forEach((r=>{this.uu(r.key)&&(this.Xa=this.Xa.add(r.key))}));const t=[];return e.forEach((r=>{this.Xa.has(r)||t.push(new Jy(r))})),this.Xa.forEach((r=>{e.has(r)||t.push(new Yy(r))})),t}cu(e){this.Ya=e.Qs,this.Xa=K();const t=this.ru(e.documents);return this.applyChanges(t,!0)}lu(){return Rr.fromInitialDocuments(this.query,this.tu,this.mutatedKeys,this.Za===0,this.hasCachedResults)}}const jn="SyncEngine";class pR{constructor(e,t,r){this.query=e,this.targetId=t,this.view=r}}class _R{constructor(e){this.key=e,this.hu=!1}}class mR{constructor(e,t,r,s,i,o){this.localStore=e,this.remoteStore=t,this.eventManager=r,this.sharedClientState=s,this.currentUser=i,this.maxConcurrentLimboResolutions=o,this.Pu={},this.Tu=new sn((a=>Lg(a)),vo),this.Iu=new Map,this.Eu=new Set,this.du=new Ae(M.comparator),this.Au=new Map,this.Ru=new vh,this.Vu={},this.mu=new Map,this.fu=Ar.cr(),this.onlineState="Unknown",this.gu=void 0}get isPrimaryClient(){return this.gu===!0}}async function gR(n,e,t=!0){const r=Fc(n);let s;const i=r.Tu.get(e);return i?(r.sharedClientState.addLocalQueryTarget(i.targetId),s=i.view.lu()):s=await Zy(r,e,t,!0),s}async function yR(n,e){const t=Fc(n);await Zy(t,e,!0,!1)}async function Zy(n,e,t,r){const s=await Ts(n.localStore,Je(e)),i=s.targetId,o=n.sharedClientState.addLocalQueryTarget(i,t);let a;return r&&(a=await Bh(n,e,i,o==="current",s.resumeToken)),n.isPrimaryClient&&t&&Lc(n.remoteStore,s),a}async function Bh(n,e,t,r,s){n.pu=(f,_,g)=>(async function(C,N,V,B){let U=N.view.ru(V);U.Cs&&(U=await $a(C.localStore,N.query,!1).then((({documents:T})=>N.view.ru(T,U))));const $=B&&B.targetChanges.get(N.targetId),se=B&&B.targetMismatches.get(N.targetId)!=null,Q=N.view.applyChanges(U,C.isPrimaryClient,$,se);return Pu(C,N.targetId,Q.au),Q.snapshot})(n,f,_,g);const i=await $a(n.localStore,e,!0),o=new Xy(e,i.Qs),a=o.ru(i.documents),l=So.createSynthesizedTargetChangeForCurrentChange(t,r&&n.onlineState!=="Offline",s),u=o.applyChanges(a,n.isPrimaryClient,l);Pu(n,t,u.au);const d=new pR(e,t,o);return n.Tu.set(e,d),n.Iu.has(t)?n.Iu.get(t).push(e):n.Iu.set(t,[e]),u.snapshot}async function IR(n,e,t){const r=L(n),s=r.Tu.get(e),i=r.Iu.get(s.targetId);if(i.length>1)return r.Iu.set(s.targetId,i.filter((o=>!vo(o,e)))),void r.Tu.delete(e);r.isPrimaryClient?(r.sharedClientState.removeLocalQueryTarget(s.targetId),r.sharedClientState.isActiveQueryTarget(s.targetId)||await ws(r.localStore,s.targetId,!1).then((()=>{r.sharedClientState.clearQueryState(s.targetId),t&&vs(r.remoteStore,s.targetId),As(r,s.targetId)})).catch(qn)):(As(r,s.targetId),await ws(r.localStore,s.targetId,!0))}async function ER(n,e){const t=L(n),r=t.Tu.get(e),s=t.Iu.get(r.targetId);t.isPrimaryClient&&s.length===1&&(t.sharedClientState.removeLocalQueryTarget(r.targetId),vs(t.remoteStore,r.targetId))}async function TR(n,e,t){const r=$h(n);try{const s=await(function(o,a){const l=L(o),u=ce.now(),d=a.reduce(((g,v)=>g.add(v.key)),K());let f,_;return l.persistence.runTransaction("Locally write mutations","readwrite",(g=>{let v=at(),C=K();return l.Ns.getEntries(g,d).next((N=>{v=N,v.forEach(((V,B)=>{B.isValidDocument()||(C=C.add(V))}))})).next((()=>l.localDocuments.getOverlayedDocuments(g,v))).next((N=>{f=N;const V=[];for(const B of a){const U=WA(B,f.get(B.key).overlayedDocument);U!=null&&V.push(new on(B.key,U,Rg(U.value.mapValue),Te.exists(!0)))}return l.mutationQueue.addMutationBatch(g,u,V,a)})).next((N=>{_=N;const V=N.applyToLocalDocumentSet(f,C);return l.documentOverlayCache.saveOverlays(g,N.batchId,V)}))})).then((()=>({batchId:_.batchId,changes:qg(f)})))})(r.localStore,e);r.sharedClientState.addPendingMutation(s.batchId),(function(o,a,l){let u=o.Vu[o.currentUser.toKey()];u||(u=new Ae(j)),u=u.insert(a,l),o.Vu[o.currentUser.toKey()]=u})(r,s.batchId,t),await an(r,s.changes),await qs(r.remoteStore)}catch(s){const i=zs(s,"Failed to persist write");t.reject(i)}}async function eI(n,e){const t=L(n);try{const r=await Ub(t.localStore,e);e.targetChanges.forEach(((s,i)=>{const o=t.Au.get(i);o&&(G(s.addedDocuments.size+s.modifiedDocuments.size+s.removedDocuments.size<=1,22616),s.addedDocuments.size>0?o.hu=!0:s.modifiedDocuments.size>0?G(o.hu,14607):s.removedDocuments.size>0&&(G(o.hu,42227),o.hu=!1))})),await an(t,r,e)}catch(r){await qn(r)}}function p_(n,e,t){const r=L(n);if(r.isPrimaryClient&&t===0||!r.isPrimaryClient&&t===1){const s=[];r.Tu.forEach(((i,o)=>{const a=o.view.va(e);a.snapshot&&s.push(a.snapshot)})),(function(o,a){const l=L(o);l.onlineState=a;let u=!1;l.queries.forEach(((d,f)=>{for(const _ of f.Sa)_.va(a)&&(u=!0)})),u&&Lh(l)})(r.eventManager,e),s.length&&r.Pu.H_(s),r.onlineState=e,r.isPrimaryClient&&r.sharedClientState.setOnlineState(e)}}async function wR(n,e,t){const r=L(n);r.sharedClientState.updateQueryState(e,"rejected",t);const s=r.Au.get(e),i=s&&s.key;if(i){let o=new Ae(M.comparator);o=o.insert(i,ye.newNoDocument(i,z.min()));const a=K().add(i),l=new Ro(z.min(),new Map,new Ae(j),o,a);await eI(r,l),r.du=r.du.remove(i),r.Au.delete(e),zh(r)}else await ws(r.localStore,e,!1).then((()=>As(r,e,t))).catch(qn)}async function vR(n,e){const t=L(n),r=e.batch.batchId;try{const s=await Fb(t.localStore,e);Gh(t,r,null),qh(t,r),t.sharedClientState.updateMutationState(r,"acknowledged"),await an(t,s)}catch(s){await qn(s)}}async function AR(n,e,t){const r=L(n);try{const s=await(function(o,a){const l=L(o);return l.persistence.runTransaction("Reject batch","readwrite-primary",(u=>{let d;return l.mutationQueue.lookupMutationBatch(u,a).next((f=>(G(f!==null,37113),d=f.keys(),l.mutationQueue.removeMutationBatch(u,f)))).next((()=>l.mutationQueue.performConsistencyCheck(u))).next((()=>l.documentOverlayCache.removeOverlaysForBatchId(u,d,a))).next((()=>l.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(u,d))).next((()=>l.localDocuments.getDocuments(u,d)))}))})(r.localStore,e);Gh(r,e,t),qh(r,e),r.sharedClientState.updateMutationState(e,"rejected",t),await an(r,s)}catch(s){await qn(s)}}async function bR(n,e){const t=L(n);$n(t.remoteStore)||x(jn,"The network is disabled. The task returned by 'awaitPendingWrites()' will not complete until the network is enabled.");try{const r=await(function(o){const a=L(o);return a.persistence.runTransaction("Get highest unacknowledged batch id","readonly",(l=>a.mutationQueue.getHighestUnacknowledgedBatchId(l)))})(t.localStore);if(r===Rn)return void e.resolve();const s=t.mu.get(r)||[];s.push(e),t.mu.set(r,s)}catch(r){const s=zs(r,"Initialization of waitForPendingWrites() operation failed");e.reject(s)}}function qh(n,e){(n.mu.get(e)||[]).forEach((t=>{t.resolve()})),n.mu.delete(e)}function Gh(n,e,t){const r=L(n);let s=r.Vu[r.currentUser.toKey()];if(s){const i=s.get(e);i&&(t?i.reject(t):i.resolve(),s=s.remove(e)),r.Vu[r.currentUser.toKey()]=s}}function As(n,e,t=null){n.sharedClientState.removeLocalQueryTarget(e);for(const r of n.Iu.get(e))n.Tu.delete(r),t&&n.Pu.yu(r,t);n.Iu.delete(e),n.isPrimaryClient&&n.Ru.jr(e).forEach((r=>{n.Ru.containsKey(r)||tI(n,r)}))}function tI(n,e){n.Eu.delete(e.path.canonicalString());const t=n.du.get(e);t!==null&&(vs(n.remoteStore,t),n.du=n.du.remove(e),n.Au.delete(t),zh(n))}function Pu(n,e,t){for(const r of t)r instanceof Yy?(n.Ru.addReference(r.key,e),RR(n,r)):r instanceof Jy?(x(jn,"Document no longer in limbo: "+r.key),n.Ru.removeReference(r.key,e),n.Ru.containsKey(r.key)||tI(n,r.key)):q(19791,{wu:r})}function RR(n,e){const t=e.key,r=t.path.canonicalString();n.du.get(t)||n.Eu.has(r)||(x(jn,"New document in limbo: "+t),n.Eu.add(r),zh(n))}function zh(n){for(;n.Eu.size>0&&n.du.size<n.maxConcurrentLimboResolutions;){const e=n.Eu.values().next().value;n.Eu.delete(e);const t=new M(X.fromString(e)),r=n.fu.next();n.Au.set(r,new _R(t)),n.du=n.du.insert(t,r),Lc(n.remoteStore,new Kt(Je(Ls(t.path)),r,"TargetPurposeLimboResolution",it.ce))}}async function an(n,e,t){const r=L(n),s=[],i=[],o=[];r.Tu.isEmpty()||(r.Tu.forEach(((a,l)=>{o.push(r.pu(l,e,t).then((u=>{var d;if((u||t)&&r.isPrimaryClient){const f=u?!u.fromCache:(d=t==null?void 0:t.targetChanges.get(l.targetId))==null?void 0:d.current;r.sharedClientState.updateQueryState(l.targetId,f?"current":"not-current")}if(u){s.push(u);const f=Sh.As(l.targetId,u);i.push(f)}})))})),await Promise.all(o),r.Pu.H_(s),await(async function(l,u){const d=L(l);try{await d.persistence.runTransaction("notifyLocalViewChanges","readwrite",(f=>b.forEach(u,(_=>b.forEach(_.Es,(g=>d.persistence.referenceDelegate.addReference(f,_.targetId,g))).next((()=>b.forEach(_.ds,(g=>d.persistence.referenceDelegate.removeReference(f,_.targetId,g)))))))))}catch(f){if(!Gn(f))throw f;x(Ch,"Failed to update sequence numbers: "+f)}for(const f of u){const _=f.targetId;if(!f.fromCache){const g=d.Ms.get(_),v=g.snapshotVersion,C=g.withLastLimboFreeSnapshotVersion(v);d.Ms=d.Ms.insert(_,C)}}})(r.localStore,i))}async function SR(n,e){const t=L(n);if(!t.currentUser.isEqual(e)){x(jn,"User change. New user:",e.toKey());const r=await ky(t.localStore,e);t.currentUser=e,(function(i,o){i.mu.forEach((a=>{a.forEach((l=>{l.reject(new D(S.CANCELLED,o))}))})),i.mu.clear()})(t,"'waitForPendingWrites' promise is rejected due to a user change."),t.sharedClientState.handleUserChange(e,r.removedBatchIds,r.addedBatchIds),await an(t,r.Ls)}}function CR(n,e){const t=L(n),r=t.Au.get(e);if(r&&r.hu)return K().add(r.key);{let s=K();const i=t.Iu.get(e);if(!i)return s;for(const o of i){const a=t.Tu.get(o);s=s.unionWith(a.view.nu)}return s}}async function PR(n,e){const t=L(n),r=await $a(t.localStore,e.query,!0),s=e.view.cu(r);return t.isPrimaryClient&&Pu(t,e.targetId,s.au),s}async function NR(n,e){const t=L(n);return Oy(t.localStore,e).then((r=>an(t,r)))}async function kR(n,e,t,r){const s=L(n),i=await(function(a,l){const u=L(a),d=L(u.mutationQueue);return u.persistence.runTransaction("Lookup mutation documents","readonly",(f=>d.er(f,l).next((_=>_?u.localDocuments.getDocuments(f,_):b.resolve(null)))))})(s.localStore,e);i!==null?(t==="pending"?await qs(s.remoteStore):t==="acknowledged"||t==="rejected"?(Gh(s,e,r||null),qh(s,e),(function(a,l){L(L(a).mutationQueue).ir(l)})(s.localStore,e)):q(6720,"Unknown batchState",{Su:t}),await an(s,i)):x(jn,"Cannot apply mutation batch with id: "+e)}async function DR(n,e){const t=L(n);if(Fc(t),$h(t),e===!0&&t.gu!==!0){const r=t.sharedClientState.getAllActiveQueryTargets(),s=await __(t,r.toArray());t.gu=!0,await Su(t.remoteStore,!0);for(const i of s)Lc(t.remoteStore,i)}else if(e===!1&&t.gu!==!1){const r=[];let s=Promise.resolve();t.Iu.forEach(((i,o)=>{t.sharedClientState.isLocalQueryTarget(o)?r.push(o):s=s.then((()=>(As(t,o),ws(t.localStore,o,!0)))),vs(t.remoteStore,o)})),await s,await __(t,r),(function(o){const a=L(o);a.Au.forEach(((l,u)=>{vs(a.remoteStore,u)})),a.Ru.Jr(),a.Au=new Map,a.du=new Ae(M.comparator)})(t),t.gu=!1,await Su(t.remoteStore,!1)}}async function __(n,e,t){const r=L(n),s=[],i=[];for(const o of e){let a;const l=r.Iu.get(o);if(l&&l.length!==0){a=await Ts(r.localStore,Je(l[0]));for(const u of l){const d=r.Tu.get(u),f=await PR(r,d);f.snapshot&&i.push(f.snapshot)}}else{const u=await Vy(r.localStore,o);a=await Ts(r.localStore,u),await Bh(r,nI(u),o,!1,a.resumeToken)}s.push(a)}return r.Pu.H_(i),s}function nI(n){return Vg(n.path,n.collectionGroup,n.orderBy,n.filters,n.limit,"F",n.startAt,n.endAt)}function xR(n){return(function(t){return L(L(t).persistence).Ts()})(L(n).localStore)}async function VR(n,e,t,r){const s=L(n);if(s.gu)return void x(jn,"Ignoring unexpected query state notification.");const i=s.Iu.get(e);if(i&&i.length>0)switch(t){case"current":case"not-current":{const o=await Oy(s.localStore,Fg(i[0])),a=Ro.createSynthesizedRemoteEventForCurrentChange(e,t==="current",be.EMPTY_BYTE_STRING);await an(s,o,a);break}case"rejected":await ws(s.localStore,e,!0),As(s,e,r);break;default:q(64155,t)}}async function OR(n,e,t){const r=Fc(n);if(r.gu){for(const s of e){if(r.Iu.has(s)&&r.sharedClientState.isActiveQueryTarget(s)){x(jn,"Adding an already active target "+s);continue}const i=await Vy(r.localStore,s),o=await Ts(r.localStore,i);await Bh(r,nI(i),o.targetId,!1,o.resumeToken),Lc(r.remoteStore,o)}for(const s of t)r.Iu.has(s)&&await ws(r.localStore,s,!1).then((()=>{vs(r.remoteStore,s),As(r,s)})).catch(qn)}}function Fc(n){const e=L(n);return e.remoteStore.remoteSyncer.applyRemoteEvent=eI.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=CR.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=wR.bind(null,e),e.Pu.H_=dR.bind(null,e.eventManager),e.Pu.yu=fR.bind(null,e.eventManager),e}function $h(n){const e=L(n);return e.remoteStore.remoteSyncer.applySuccessfulWrite=vR.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=AR.bind(null,e),e}function MR(n,e,t){const r=L(n);(async function(i,o,a){try{const l=await o.getMetadata();if(await(function(g,v){const C=L(g),N=De(v.createTime);return C.persistence.runTransaction("hasNewerBundle","readonly",(V=>C.Ii.getBundleMetadata(V,v.id))).then((V=>!!V&&V.createTime.compareTo(N)>=0))})(i.localStore,l))return await o.close(),a._completeWith((function(g){return{taskState:"Success",documentsLoaded:g.totalDocuments,bytesLoaded:g.totalBytes,totalDocuments:g.totalDocuments,totalBytes:g.totalBytes}})(l)),Promise.resolve(new Set);a._updateProgress(Qy(l));const u=new Uh(l,o.serializer);let d=await o.bu();for(;d;){const _=await u.Ga(d);_&&a._updateProgress(_),d=await o.bu()}const f=await u.ja(i.localStore);return await an(i,f.Ha,void 0),await(function(g,v){const C=L(g);return C.persistence.runTransaction("Save bundle","readwrite",(N=>C.Ii.saveBundleMetadata(N,v)))})(i.localStore,l),a._completeWith(f.progress),Promise.resolve(f.Ja)}catch(l){return yt(jn,`Loading bundle failed with ${l}`),a._failWith(l),Promise.resolve(new Set)}})(r,e,t).then((s=>{r.sharedClientState.notifyBundleLoaded(s)}))}class bs{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=Dr(e.databaseInfo.databaseId),this.sharedClientState=this.Du(e),this.persistence=this.Cu(e),await this.persistence.start(),this.localStore=this.vu(e),this.gcScheduler=this.Fu(e,this.localStore),this.indexBackfillerScheduler=this.Mu(e,this.localStore)}Fu(e,t){return null}Mu(e,t){return null}vu(e){return Ny(this.persistence,new Py,e.initialUser,this.serializer)}Cu(e){return new Ah(Mc.mi,this.serializer)}Du(e){return new By}async terminate(){var e,t;(e=this.gcScheduler)==null||e.stop(),(t=this.indexBackfillerScheduler)==null||t.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}bs.provider={build:()=>new bs};class jh extends bs{constructor(e){super(),this.cacheSizeBytes=e}Fu(e,t){G(this.persistence.referenceDelegate instanceof za,46915);const r=this.persistence.referenceDelegate.garbageCollector;return new vy(r,e.asyncQueue,t)}Cu(e){const t=this.cacheSizeBytes!==void 0?Qe.withCacheSize(this.cacheSizeBytes):Qe.DEFAULT;return new Ah((r=>za.mi(r,t)),this.serializer)}}class Wh extends bs{constructor(e,t,r){super(),this.xu=e,this.cacheSizeBytes=t,this.forceOwnership=r,this.kind="persistent",this.synchronizeTabs=!1}async initialize(e){await super.initialize(e),await this.xu.initialize(this,e),await $h(this.xu.syncEngine),await qs(this.xu.remoteStore),await this.persistence.Ji((()=>(this.gcScheduler&&!this.gcScheduler.started&&this.gcScheduler.start(),this.indexBackfillerScheduler&&!this.indexBackfillerScheduler.started&&this.indexBackfillerScheduler.start(),Promise.resolve())))}vu(e){return Ny(this.persistence,new Py,e.initialUser,this.serializer)}Fu(e,t){const r=this.persistence.referenceDelegate.garbageCollector;return new vy(r,e.asyncQueue,t)}Mu(e,t){const r=new Yv(t,this.persistence);return new Qv(e.asyncQueue,r)}Cu(e){const t=Rh(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey),r=this.cacheSizeBytes!==void 0?Qe.withCacheSize(this.cacheSizeBytes):Qe.DEFAULT;return new bh(this.synchronizeTabs,t,e.clientId,r,e.asyncQueue,qy(),ba(),this.serializer,this.sharedClientState,!!this.forceOwnership)}Du(e){return new By}}class rI extends Wh{constructor(e,t){super(e,t,!1),this.xu=e,this.cacheSizeBytes=t,this.synchronizeTabs=!0}async initialize(e){await super.initialize(e);const t=this.xu.syncEngine;this.sharedClientState instanceof Ul&&(this.sharedClientState.syncEngine={Co:kR.bind(null,t),vo:VR.bind(null,t),Fo:OR.bind(null,t),Ts:xR.bind(null,t),Do:NR.bind(null,t)},await this.sharedClientState.start()),await this.persistence.Ji((async r=>{await DR(this.xu.syncEngine,r),this.gcScheduler&&(r&&!this.gcScheduler.started?this.gcScheduler.start():r||this.gcScheduler.stop()),this.indexBackfillerScheduler&&(r&&!this.indexBackfillerScheduler.started?this.indexBackfillerScheduler.start():r||this.indexBackfillerScheduler.stop())}))}Du(e){const t=qy();if(!Ul.v(t))throw new D(S.UNIMPLEMENTED,"IndexedDB persistence is only available on platforms that support LocalStorage.");const r=Rh(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey);return new Ul(t,e.asyncQueue,r,e.clientId,e.initialUser)}}class Mn{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=r=>p_(this.syncEngine,r,1),this.remoteStore.remoteSyncer.handleCredentialChange=SR.bind(null,this.syncEngine),await Su(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return(function(){return new hR})()}createDatastore(e){const t=Dr(e.databaseInfo.databaseId),r=(function(i){return new Kb(i)})(e.databaseInfo);return(function(i,o,a,l){return new Jb(i,o,a,l)})(e.authCredentials,e.appCheckCredentials,r,t)}createRemoteStore(e){return(function(r,s,i,o,a){return new Zb(r,s,i,o,a)})(this.localStore,this.datastore,e.asyncQueue,(t=>p_(this.syncEngine,t,0)),(function(){return a_.v()?new a_:new zb})())}createSyncEngine(e,t){return(function(s,i,o,a,l,u,d){const f=new mR(s,i,o,a,l,u);return d&&(f.gu=!0),f})(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){var e,t;await(async function(s){const i=L(s);x(br,"RemoteStore shutting down."),i.Ea.add(5),await Bs(i),i.Aa.shutdown(),i.Ra.set("Unknown")})(this.remoteStore),(e=this.datastore)==null||e.terminate(),(t=this.eventManager)==null||t.terminate()}}Mn.provider={build:()=>new Mn};function m_(n,e=10240){let t=0;return{async read(){if(t<n.byteLength){const r={value:n.slice(t,t+e),done:!1};return t+=e,r}return{done:!0}},async cancel(){},releaseLock(){},closed:Promise.resolve()}}/**
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
 */class Uc{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Ou(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Ou(this.observer.error,e):Ne("Uncaught Error in snapshot listener:",e.toString()))}Nu(){this.muted=!0}Ou(e,t){setTimeout((()=>{this.muted||e(t)}),0)}}/**
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
 */class LR{constructor(e,t){this.Bu=e,this.serializer=t,this.metadata=new $e,this.buffer=new Uint8Array,this.Lu=(function(){return new TextDecoder("utf-8")})(),this.ku().then((r=>{r&&r.$a()?this.metadata.resolve(r.Qa.metadata):this.metadata.reject(new Error(`The first element of the bundle is not a metadata, it is
             ${JSON.stringify(r==null?void 0:r.Qa)}`))}),(r=>this.metadata.reject(r)))}close(){return this.Bu.cancel()}async getMetadata(){return this.metadata.promise}async bu(){return await this.getMetadata(),this.ku()}async ku(){const e=await this.qu();if(e===null)return null;const t=this.Lu.decode(e),r=Number(t);isNaN(r)&&this.Qu(`length string (${t}) is not valid number`);const s=await this.$u(r);return new Hy(JSON.parse(s),e.length+r)}Uu(){return this.buffer.findIndex((e=>e===123))}async qu(){for(;this.Uu()<0&&!await this.Ku(););if(this.buffer.length===0)return null;const e=this.Uu();e<0&&this.Qu("Reached the end of bundle when a length string is expected.");const t=this.buffer.slice(0,e);return this.buffer=this.buffer.slice(e),t}async $u(e){for(;this.buffer.length<e;)await this.Ku()&&this.Qu("Reached the end of bundle when more is expected.");const t=this.Lu.decode(this.buffer.slice(0,e));return this.buffer=this.buffer.slice(e),t}Qu(e){throw this.Bu.cancel(),new Error(`Invalid bundle format: ${e}`)}async Ku(){const e=await this.Bu.read();if(!e.done){const t=new Uint8Array(this.buffer.length+e.value.length);t.set(this.buffer),t.set(e.value,this.buffer.length),this.buffer=t}return e.done}}/**
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
 */class FR{constructor(e,t){this.bundleData=e,this.serializer=t,this.cursor=0,this.elements=[];let r=this.bu();if(!r||!r.$a())throw new Error(`The first element of the bundle is not a metadata object, it is
         ${JSON.stringify(r==null?void 0:r.Qa)}`);this.metadata=r;do r=this.bu(),r!==null&&this.elements.push(r);while(r!==null)}getMetadata(){return this.metadata}Wu(){return this.elements}bu(){if(this.cursor===this.bundleData.length)return null;const e=this.qu(),t=this.$u(e);return new Hy(JSON.parse(t),e)}$u(e){if(this.cursor+e>this.bundleData.length)throw new D(S.INTERNAL,"Reached the end of bundle when more is expected.");return this.bundleData.slice(this.cursor,this.cursor+=e)}qu(){const e=this.cursor;let t=this.cursor;for(;t<this.bundleData.length;){if(this.bundleData[t]==="{"){if(t===e)throw new Error("First character is a bracket and not a number");return this.cursor=t,Number(this.bundleData.slice(e,t))}t++}throw new Error("Reached the end of bundle when more is expected.")}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class UR{constructor(e){this.datastore=e,this.readVersions=new Map,this.mutations=[],this.committed=!1,this.lastTransactionError=null,this.writtenDocs=new Set}async lookup(e){if(this.ensureCommitNotCalled(),this.mutations.length>0)throw this.lastTransactionError=new D(S.INVALID_ARGUMENT,"Firestore transactions require all reads to be executed before all writes."),this.lastTransactionError;const t=await(async function(s,i){const o=L(s),a={documents:i.map((f=>so(o.serializer,f)))},l=await o.Ho("BatchGetDocuments",o.serializer.databaseId,X.emptyPath(),a,i.length),u=new Map;l.forEach((f=>{const _=tb(o.serializer,f);u.set(_.key.toString(),_)}));const d=[];return i.forEach((f=>{const _=u.get(f.toString());G(!!_,55234,{key:f}),d.push(_)})),d})(this.datastore,e);return t.forEach((r=>this.recordVersion(r))),t}set(e,t){this.write(t.toMutation(e,this.precondition(e))),this.writtenDocs.add(e.toString())}update(e,t){try{this.write(t.toMutation(e,this.preconditionForUpdate(e)))}catch(r){this.lastTransactionError=r}this.writtenDocs.add(e.toString())}delete(e){this.write(new Us(e,this.precondition(e))),this.writtenDocs.add(e.toString())}async commit(){if(this.ensureCommitNotCalled(),this.lastTransactionError)throw this.lastTransactionError;const e=this.readVersions;this.mutations.forEach((t=>{e.delete(t.key.toString())})),e.forEach(((t,r)=>{const s=M.fromPath(r);this.mutations.push(new _h(s,this.precondition(s)))})),await(async function(r,s){const i=L(r),o={writes:s.map((a=>io(i.serializer,a)))};await i.Go("Commit",i.serializer.databaseId,X.emptyPath(),o)})(this.datastore,this.mutations),this.committed=!0}recordVersion(e){let t;if(e.isFoundDocument())t=e.version;else{if(!e.isNoDocument())throw q(50498,{Gu:e.constructor.name});t=z.min()}const r=this.readVersions.get(e.key.toString());if(r){if(!t.isEqual(r))throw new D(S.ABORTED,"Document version changed between two reads.")}else this.readVersions.set(e.key.toString(),t)}precondition(e){const t=this.readVersions.get(e.toString());return!this.writtenDocs.has(e.toString())&&t?t.isEqual(z.min())?Te.exists(!1):Te.updateTime(t):Te.none()}preconditionForUpdate(e){const t=this.readVersions.get(e.toString());if(!this.writtenDocs.has(e.toString())&&t){if(t.isEqual(z.min()))throw new D(S.INVALID_ARGUMENT,"Can't update a document that doesn't exist.");return Te.updateTime(t)}return Te.exists(!0)}write(e){this.ensureCommitNotCalled(),this.mutations.push(e)}ensureCommitNotCalled(){}}/**
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
 */class BR{constructor(e,t,r,s,i){this.asyncQueue=e,this.datastore=t,this.options=r,this.updateFunction=s,this.deferred=i,this.zu=r.maxAttempts,this.M_=new Nh(this.asyncQueue,"transaction_retry")}ju(){this.zu-=1,this.Ju()}Ju(){this.M_.p_((async()=>{const e=new UR(this.datastore),t=this.Hu(e);t&&t.then((r=>{this.asyncQueue.enqueueAndForget((()=>e.commit().then((()=>{this.deferred.resolve(r)})).catch((s=>{this.Yu(s)}))))})).catch((r=>{this.Yu(r)}))}))}Hu(e){try{const t=this.updateFunction(e);return!Eo(t)&&t.catch&&t.then?t:(this.deferred.reject(Error("Transaction callback must return a Promise")),null)}catch(t){return this.deferred.reject(t),null}}Yu(e){this.zu>0&&this.Zu(e)?(this.zu-=1,this.asyncQueue.enqueueAndForget((()=>(this.Ju(),Promise.resolve())))):this.deferred.reject(e)}Zu(e){if((e==null?void 0:e.name)==="FirebaseError"){const t=e.code;return t==="aborted"||t==="failed-precondition"||t==="already-exists"||!Xg(t)}return!1}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ln="FirestoreClient";class qR{constructor(e,t,r,s,i){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=r,this.databaseInfo=s,this.user=Ge.UNAUTHENTICATED,this.clientId=Ec.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=i,this.authCredentials.start(r,(async o=>{x(Ln,"Received user=",o.uid),await this.authCredentialListener(o),this.user=o})),this.appCheckCredentials.start(r,(o=>(x(Ln,"Received new app check token=",o),this.appCheckCredentialListener(o,this.user))))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this.databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();const e=new $e;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted((async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){const r=zs(t,"Failed to shutdown persistence");e.reject(r)}})),e.promise}}async function ql(n,e){n.asyncQueue.verifyOperationInProgress(),x(Ln,"Initializing OfflineComponentProvider");const t=n.configuration;await e.initialize(t);let r=t.initialUser;n.setCredentialChangeListener((async s=>{r.isEqual(s)||(await ky(e.localStore,s),r=s)})),e.persistence.setDatabaseDeletedListener((()=>n.terminate())),n._offlineComponents=e}async function g_(n,e){n.asyncQueue.verifyOperationInProgress();const t=await Kh(n);x(Ln,"Initializing OnlineComponentProvider"),await e.initialize(t,n.configuration),n.setCredentialChangeListener((r=>l_(e.remoteStore,r))),n.setAppCheckTokenChangeListener(((r,s)=>l_(e.remoteStore,s))),n._onlineComponents=e}async function Kh(n){if(!n._offlineComponents)if(n._uninitializedComponentsProvider){x(Ln,"Using user provided OfflineComponentProvider");try{await ql(n,n._uninitializedComponentsProvider._offline)}catch(e){const t=e;if(!(function(s){return s.name==="FirebaseError"?s.code===S.FAILED_PRECONDITION||s.code===S.UNIMPLEMENTED:!(typeof DOMException<"u"&&s instanceof DOMException)||s.code===22||s.code===20||s.code===11})(t))throw t;yt("Error using user provided cache. Falling back to memory cache: "+t),await ql(n,new bs)}}else x(Ln,"Using default OfflineComponentProvider"),await ql(n,new jh(void 0));return n._offlineComponents}async function Bc(n){return n._onlineComponents||(n._uninitializedComponentsProvider?(x(Ln,"Using user provided OnlineComponentProvider"),await g_(n,n._uninitializedComponentsProvider._online)):(x(Ln,"Using default OnlineComponentProvider"),await g_(n,new Mn))),n._onlineComponents}function sI(n){return Kh(n).then((e=>e.persistence))}function $s(n){return Kh(n).then((e=>e.localStore))}function iI(n){return Bc(n).then((e=>e.remoteStore))}function Hh(n){return Bc(n).then((e=>e.syncEngine))}function oI(n){return Bc(n).then((e=>e.datastore))}async function Rs(n){const e=await Bc(n),t=e.eventManager;return t.onListen=gR.bind(null,e.syncEngine),t.onUnlisten=IR.bind(null,e.syncEngine),t.onFirstRemoteStoreListen=yR.bind(null,e.syncEngine),t.onLastRemoteStoreUnlisten=ER.bind(null,e.syncEngine),t}function GR(n){return n.asyncQueue.enqueue((async()=>{const e=await sI(n),t=await iI(n);return e.setNetworkEnabled(!0),(function(s){const i=L(s);return i.Ea.delete(0),Co(i)})(t)}))}function zR(n){return n.asyncQueue.enqueue((async()=>{const e=await sI(n),t=await iI(n);return e.setNetworkEnabled(!1),(async function(s){const i=L(s);i.Ea.add(0),await Bs(i),i.Ra.set("Offline")})(t)}))}function $R(n,e){const t=new $e;return n.asyncQueue.enqueueAndForget((async()=>(async function(s,i,o){try{const a=await(function(u,d){const f=L(u);return f.persistence.runTransaction("read document","readonly",(_=>f.localDocuments.getDocument(_,d)))})(s,i);a.isFoundDocument()?o.resolve(a):a.isNoDocument()?o.resolve(null):o.reject(new D(S.UNAVAILABLE,"Failed to get document from cache. (However, this document may exist on the server. Run again without setting 'source' in the GetOptions to attempt to retrieve the document from the server.)"))}catch(a){const l=zs(a,`Failed to get document '${i} from cache`);o.reject(l)}})(await $s(n),e,t))),t.promise}function aI(n,e,t={}){const r=new $e;return n.asyncQueue.enqueueAndForget((async()=>(function(i,o,a,l,u){const d=new Uc({next:_=>{d.Nu(),o.enqueueAndForget((()=>Mh(i,f)));const g=_.docs.has(a);!g&&_.fromCache?u.reject(new D(S.UNAVAILABLE,"Failed to get document because the client is offline.")):g&&_.fromCache&&l&&l.source==="server"?u.reject(new D(S.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):u.resolve(_)},error:_=>u.reject(_)}),f=new Fh(Ls(a.path),d,{includeMetadataChanges:!0,qa:!0});return Oh(i,f)})(await Rs(n),n.asyncQueue,e,t,r))),r.promise}function jR(n,e){const t=new $e;return n.asyncQueue.enqueueAndForget((async()=>(async function(s,i,o){try{const a=await $a(s,i,!0),l=new Xy(i,a.Qs),u=l.ru(a.documents),d=l.applyChanges(u,!1);o.resolve(d.snapshot)}catch(a){const l=zs(a,`Failed to execute query '${i} against cache`);o.reject(l)}})(await $s(n),e,t))),t.promise}function cI(n,e,t={}){const r=new $e;return n.asyncQueue.enqueueAndForget((async()=>(function(i,o,a,l,u){const d=new Uc({next:_=>{d.Nu(),o.enqueueAndForget((()=>Mh(i,f))),_.fromCache&&l.source==="server"?u.reject(new D(S.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):u.resolve(_)},error:_=>u.reject(_)}),f=new Fh(a,d,{includeMetadataChanges:!0,qa:!0});return Oh(i,f)})(await Rs(n),n.asyncQueue,e,t,r))),r.promise}function WR(n,e,t){const r=new $e;return n.asyncQueue.enqueueAndForget((async()=>{try{const s=await oI(n);r.resolve((async function(o,a,l){var C;const u=L(o),{request:d,gt:f,parent:_}=ly(u.serializer,Og(a),l);u.connection.$o||delete d.parent;const g=(await u.Ho("RunAggregationQuery",u.serializer.databaseId,_,d,1)).filter((N=>!!N.result));G(g.length===1,64727);const v=(C=g[0].result)==null?void 0:C.aggregateFields;return Object.keys(v).reduce(((N,V)=>(N[f[V]]=v[V],N)),{})})(s,e,t))}catch(s){r.reject(s)}})),r.promise}function KR(n,e){const t=new Uc(e);return n.asyncQueue.enqueueAndForget((async()=>(function(s,i){L(s).Ca.add(i),i.next()})(await Rs(n),t))),()=>{t.Nu(),n.asyncQueue.enqueueAndForget((async()=>(function(s,i){L(s).Ca.delete(i)})(await Rs(n),t)))}}function HR(n,e,t,r){const s=(function(o,a){let l;return l=typeof o=="string"?ey().encode(o):o,(function(d,f){return new LR(d,f)})((function(d,f){if(d instanceof Uint8Array)return m_(d,f);if(d instanceof ArrayBuffer)return m_(new Uint8Array(d),f);if(d instanceof ReadableStream)return d.getReader();throw new Error("Source of `toByteStreamReader` has to be a ArrayBuffer or ReadableStream")})(l),a)})(t,Dr(e));n.asyncQueue.enqueueAndForget((async()=>{MR(await Hh(n),s,r)}))}function QR(n,e){return n.asyncQueue.enqueue((async()=>(function(r,s){const i=L(r);return i.persistence.runTransaction("Get named query","readonly",(o=>i.Ii.getNamedQuery(o,s)))})(await $s(n),e)))}function lI(n,e){return(function(r,s){return new FR(r,s)})(n,e)}function YR(n,e){return n.asyncQueue.enqueue((async()=>(async function(r,s){const i=L(r),o=i.indexManager,a=[];return i.persistence.runTransaction("Configure indexes","readwrite",(l=>o.getFieldIndexes(l).next((u=>(function(f,_,g,v,C){f=[...f],_=[..._],f.sort(g),_.sort(g);const N=f.length,V=_.length;let B=0,U=0;for(;B<V&&U<N;){const $=g(f[U],_[B]);$<0?C(f[U++]):$>0?v(_[B++]):(B++,U++)}for(;B<V;)v(_[B++]);for(;U<N;)C(f[U++])})(u,s,jv,(d=>{a.push(o.addFieldIndex(l,d))}),(d=>{a.push(o.deleteFieldIndex(l,d))})))).next((()=>b.waitFor(a)))))})(await $s(n),e)))}function JR(n,e){return n.asyncQueue.enqueue((async()=>(function(r,s){L(r).Fs.Vs=s})(await $s(n),e)))}function XR(n){return n.asyncQueue.enqueue((async()=>(function(t){const r=L(t),s=r.indexManager;return r.persistence.runTransaction("Delete All Indexes","readwrite",(i=>s.deleteAllFieldIndexes(i)))})(await $s(n))))}/**
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
 */function uI(n){const e={};return n.timeoutSeconds!==void 0&&(e.timeoutSeconds=n.timeoutSeconds),e}/**
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
 */const y_=new Map;/**
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
 */const hI="firestore.googleapis.com",I_=!0;class E_{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new D(S.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=hI,this.ssl=I_}else this.host=e.host,this.ssl=e.ssl??I_;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e.cacheSizeBytes===void 0)this.cacheSizeBytes=yy;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<wy)throw new D(S.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}Jm("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=uI(e.experimentalLongPollingOptions??{}),(function(r){if(r.timeoutSeconds!==void 0){if(isNaN(r.timeoutSeconds))throw new D(S.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (must not be NaN)`);if(r.timeoutSeconds<5)throw new D(S.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (minimum allowed value is 5)`);if(r.timeoutSeconds>30)throw new D(S.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (maximum allowed value is 30)`)}})(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&(function(r,s){return r.timeoutSeconds===s.timeoutSeconds})(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams}}class Po{constructor(e,t,r,s){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=r,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new E_({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new D(S.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new D(S.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new E_(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=(function(r){if(!r)return new Qm;switch(r.type){case"firstParty":return new Fv(r.sessionIndex||"0",r.iamToken||null,r.authTokenFactory||null);case"provider":return r.client;default:throw new D(S.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}})(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return(function(t){const r=y_.get(t);r&&(x("ComponentProvider","Removing Datastore"),y_.delete(t),r.terminate())})(this),Promise.resolve()}}function dI(n,e,t,r={}){var u;n=ee(n,Po);const s=wt(e),i=n._getSettings(),o={...i,emulatorOptions:n._getEmulatorOptions()},a=`${e}:${t}`;s&&(yo(`https://${a}`),mc("Firestore",!0)),i.host!==hI&&i.host!==a&&yt("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const l={...i,host:a,ssl:s,emulatorOptions:r};if(!Jt(l,o)&&(n._setSettings(l),r.mockUserToken)){let d,f;if(typeof r.mockUserToken=="string")d=r.mockUserToken,f=Ge.MOCK_USER;else{d=Xu(r.mockUserToken,(u=n._app)==null?void 0:u.options.projectId);const _=r.mockUserToken.sub||r.mockUserToken.user_id;if(!_)throw new D(S.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");f=new Ge(_)}n._authCredentials=new Ov(new Hm(d,f))}}/**
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
 */class Le{constructor(e,t,r){this.converter=t,this._query=r,this.type="query",this.firestore=e}withConverter(e){return new Le(this.firestore,e,this._query)}}class ue{constructor(e,t,r){this.converter=t,this._key=r,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Rt(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new ue(this.firestore,e,this._key)}toJSON(){return{type:ue._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,r){if(kr(t,ue._jsonSchema))return new ue(e,r||null,new M(X.fromString(t.referencePath)))}}ue._jsonSchemaVersion="firestore/documentReference/1.0",ue._jsonSchema={type:Ve("string",ue._jsonSchemaVersion),referencePath:Ve("string")};class Rt extends Le{constructor(e,t,r){super(e,t,Ls(r)),this._path=r,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new ue(this.firestore,null,new M(e))}withConverter(e){return new Rt(this.firestore,e,this._path)}}function ZR(n,e,...t){if(n=te(n),nh("collection","path",e),n instanceof Po){const r=X.fromString(e,...t);return cp(r),new Rt(n,null,r)}{if(!(n instanceof ue||n instanceof Rt))throw new D(S.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(X.fromString(e,...t));return cp(r),new Rt(n.firestore,null,r)}}function eS(n,e){if(n=ee(n,Po),nh("collectionGroup","collection id",e),e.indexOf("/")>=0)throw new D(S.INVALID_ARGUMENT,`Invalid collection ID '${e}' passed to function collectionGroup(). Collection IDs must not contain '/'.`);return new Le(n,null,(function(r){return new rn(X.emptyPath(),r)})(e))}function fI(n,e,...t){if(n=te(n),arguments.length===1&&(e=Ec.newId()),nh("doc","path",e),n instanceof Po){const r=X.fromString(e,...t);return ap(r),new ue(n,null,new M(r))}{if(!(n instanceof ue||n instanceof Rt))throw new D(S.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(X.fromString(e,...t));return ap(r),new ue(n.firestore,n instanceof Rt?n.converter:null,new M(r))}}function tS(n,e){return n=te(n),e=te(e),(n instanceof ue||n instanceof Rt)&&(e instanceof ue||e instanceof Rt)&&n.firestore===e.firestore&&n.path===e.path&&n.converter===e.converter}function Qh(n,e){return n=te(n),e=te(e),n instanceof Le&&e instanceof Le&&n.firestore===e.firestore&&vo(n._query,e._query)&&n.converter===e.converter}/**
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
 */const T_="AsyncQueue";class w_{constructor(e=Promise.resolve()){this.Xu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new Nh(this,"async_queue_retry"),this._c=()=>{const r=ba();r&&x(T_,"Visibility state changed to "+r.visibilityState),this.M_.w_()},this.ac=e;const t=ba();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.uc(),this.cc(e)}enterRestrictedMode(e){if(!this.ec){this.ec=!0,this.sc=e||!1;const t=ba();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this._c)}}enqueue(e){if(this.uc(),this.ec)return new Promise((()=>{}));const t=new $e;return this.cc((()=>this.ec&&this.sc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise))).then((()=>t.promise))}enqueueRetryable(e){this.enqueueAndForget((()=>(this.Xu.push(e),this.lc())))}async lc(){if(this.Xu.length!==0){try{await this.Xu[0](),this.Xu.shift(),this.M_.reset()}catch(e){if(!Gn(e))throw e;x(T_,"Operation failed with retryable error: "+e)}this.Xu.length>0&&this.M_.p_((()=>this.lc()))}}cc(e){const t=this.ac.then((()=>(this.rc=!0,e().catch((r=>{throw this.nc=r,this.rc=!1,Ne("INTERNAL UNHANDLED ERROR: ",v_(r)),r})).then((r=>(this.rc=!1,r))))));return this.ac=t,t}enqueueAfterDelay(e,t,r){this.uc(),this.oc.indexOf(e)>-1&&(t=0);const s=Vh.createAndSchedule(this,e,t,r,(i=>this.hc(i)));return this.tc.push(s),s}uc(){this.nc&&q(47125,{Pc:v_(this.nc)})}verifyOperationInProgress(){}async Tc(){let e;do e=this.ac,await e;while(e!==this.ac)}Ic(e){for(const t of this.tc)if(t.timerId===e)return!0;return!1}Ec(e){return this.Tc().then((()=>{this.tc.sort(((t,r)=>t.targetTimeMs-r.targetTimeMs));for(const t of this.tc)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.Tc()}))}dc(e){this.oc.push(e)}hc(e){const t=this.tc.indexOf(e);this.tc.splice(t,1)}}function v_(n){let e=n.message||"";return n.stack&&(e=n.stack.includes(n.message)?n.stack:n.message+`
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
 */function es(n){return(function(t,r){if(typeof t!="object"||t===null)return!1;const s=t;for(const i of r)if(i in s&&typeof s[i]=="function")return!0;return!1})(n,["next","error","complete"])}class pI{constructor(){this._progressObserver={},this._taskCompletionResolver=new $e,this._lastProgress={taskState:"Running",totalBytes:0,totalDocuments:0,bytesLoaded:0,documentsLoaded:0}}onProgress(e,t,r){this._progressObserver={next:e,error:t,complete:r}}catch(e){return this._taskCompletionResolver.promise.catch(e)}then(e,t){return this._taskCompletionResolver.promise.then(e,t)}_completeWith(e){this._updateProgress(e),this._progressObserver.complete&&this._progressObserver.complete(),this._taskCompletionResolver.resolve(e)}_failWith(e){this._lastProgress.taskState="Error",this._progressObserver.next&&this._progressObserver.next(this._lastProgress),this._progressObserver.error&&this._progressObserver.error(e),this._taskCompletionResolver.reject(e)}_updateProgress(e){this._lastProgress=e,this._progressObserver.next&&this._progressObserver.next(e)}}/**
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
 */const nS=-1;class fe extends Po{constructor(e,t,r,s){super(e,t,r,s),this.type="firestore",this._queue=new w_,this._persistenceKey=(s==null?void 0:s.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new w_(e),this._firestoreClient=void 0,await e}}}function rS(n,e,t){t||(t=eo);const r=Vs(n,"firestore");if(r.isInitialized(t)){const s=r.getImmediate({identifier:t}),i=r.getOptions(t);if(Jt(i,e))return s;throw new D(S.FAILED_PRECONDITION,"initializeFirestore() has already been called with different options. To avoid this error, call initializeFirestore() with the same options as when it was originally called, or call getFirestore() to return the already initialized instance.")}if(e.cacheSizeBytes!==void 0&&e.localCache!==void 0)throw new D(S.INVALID_ARGUMENT,"cache and cacheSizeBytes cannot be specified at the same time as cacheSizeBytes willbe deprecated. Instead, specify the cache size in the cache object");if(e.cacheSizeBytes!==void 0&&e.cacheSizeBytes!==-1&&e.cacheSizeBytes<wy)throw new D(S.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");return e.host&&wt(e.host)&&yo(e.host),r.initialize({options:e,instanceIdentifier:t})}function _I(n,e){const t=typeof n=="object"?n:Ic(),r=typeof n=="string"?n:e||eo,s=Vs(t,"firestore").getImmediate({identifier:r});if(!s._initialized){const i=_c("firestore");i&&dI(s,...i)}return s}function we(n){if(n._terminated)throw new D(S.FAILED_PRECONDITION,"The client has already been terminated.");return n._firestoreClient||mI(n),n._firestoreClient}function mI(n){var r,s,i;const e=n._freezeSettings(),t=(function(a,l,u,d){return new bA(a,l,u,d.host,d.ssl,d.experimentalForceLongPolling,d.experimentalAutoDetectLongPolling,uI(d.experimentalLongPollingOptions),d.useFetchStreams,d.isUsingEmulator)})(n._databaseId,((r=n._app)==null?void 0:r.options.appId)||"",n._persistenceKey,e);n._componentsProvider||(s=e.localCache)!=null&&s._offlineComponentProvider&&((i=e.localCache)!=null&&i._onlineComponentProvider)&&(n._componentsProvider={_offline:e.localCache._offlineComponentProvider,_online:e.localCache._onlineComponentProvider}),n._firestoreClient=new qR(n._authCredentials,n._appCheckCredentials,n._queue,t,n._componentsProvider&&(function(a){const l=a==null?void 0:a._online.build();return{_offline:a==null?void 0:a._offline.build(l),_online:l}})(n._componentsProvider))}function sS(n,e){yt("enableIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead.");const t=n._freezeSettings();return gI(n,Mn.provider,{build:r=>new Wh(r,t.cacheSizeBytes,e==null?void 0:e.forceOwnership)}),Promise.resolve()}async function iS(n){yt("enableMultiTabIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead.");const e=n._freezeSettings();gI(n,Mn.provider,{build:t=>new rI(t,e.cacheSizeBytes)})}function gI(n,e,t){if((n=ee(n,fe))._firestoreClient||n._terminated)throw new D(S.FAILED_PRECONDITION,"Firestore has already been started and persistence can no longer be enabled. You can only enable persistence before calling any other methods on a Firestore object.");if(n._componentsProvider||n._getSettings().localCache)throw new D(S.FAILED_PRECONDITION,"SDK cache is already specified.");n._componentsProvider={_online:e,_offline:t},mI(n)}function oS(n){if(n._initialized&&!n._terminated)throw new D(S.FAILED_PRECONDITION,"Persistence can only be cleared before a Firestore instance is initialized or after it is terminated.");const e=new $e;return n._queue.enqueueAndForgetEvenWhileRestricted((async()=>{try{await(async function(r){if(!Ft.v())return Promise.resolve();const s=r+Cy;await Ft.delete(s)})(Rh(n._databaseId,n._persistenceKey)),e.resolve()}catch(t){e.reject(t)}})),e.promise}function aS(n){return(function(t){const r=new $e;return t.asyncQueue.enqueueAndForget((async()=>bR(await Hh(t),r))),r.promise})(we(n=ee(n,fe)))}function cS(n){return GR(we(n=ee(n,fe)))}function lS(n){return zR(we(n=ee(n,fe)))}function uS(n){return yv(n.app,"firestore",n._databaseId.database),n._delete()}function Nu(n,e){const t=we(n=ee(n,fe)),r=new pI;return HR(t,n._databaseId,e,r),r}function yI(n,e){return QR(we(n=ee(n,fe)),e).then((t=>t?new Le(n,null,t.query):null))}/**
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
 */class Ss{constructor(e="count",t){this._internalFieldPath=t,this.type="AggregateField",this.aggregateType=e}}class II{constructor(e,t,r){this._userDataWriter=t,this._data=r,this.type="AggregateQuerySnapshot",this.query=e}data(){return this._userDataWriter.convertObjectMap(this._data)}}/**
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
 */class st{constructor(e){this._byteString=e}static fromBase64String(e){try{return new st(be.fromBase64String(e))}catch(t){throw new D(S.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new st(be.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:st._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(kr(e,st._jsonSchema))return st.fromBase64String(e.bytes)}}st._jsonSchemaVersion="firestore/bytes/1.0",st._jsonSchema={type:Ve("string",st._jsonSchemaVersion),bytes:Ve("string")};/**
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
 */class Wn{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new D(S.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new Ie(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}function hS(){return new Wn(iu)}/**
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
 */class Kn{constructor(e){this._methodName=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class St{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new D(S.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new D(S.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return j(this._lat,e._lat)||j(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:St._jsonSchemaVersion}}static fromJSON(e){if(kr(e,St._jsonSchema))return new St(e.latitude,e.longitude)}}St._jsonSchemaVersion="firestore/geoPoint/1.0",St._jsonSchema={type:Ve("string",St._jsonSchemaVersion),latitude:Ve("number"),longitude:Ve("number")};/**
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
 */class Tt{constructor(e){this._values=(e||[]).map((t=>t))}toArray(){return this._values.map((e=>e))}isEqual(e){return(function(r,s){if(r.length!==s.length)return!1;for(let i=0;i<r.length;++i)if(r[i]!==s[i])return!1;return!0})(this._values,e._values)}toJSON(){return{type:Tt._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(kr(e,Tt._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every((t=>typeof t=="number")))return new Tt(e.vectorValues);throw new D(S.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}Tt._jsonSchemaVersion="firestore/vectorValue/1.0",Tt._jsonSchema={type:Ve("string",Tt._jsonSchemaVersion),vectorValues:Ve("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dS=/^__.*__$/;class fS{constructor(e,t,r){this.data=e,this.fieldMask=t,this.fieldTransforms=r}toMutation(e,t){return this.fieldMask!==null?new on(e,this.data,this.fieldMask,t,this.fieldTransforms):new Fs(e,this.data,t,this.fieldTransforms)}}class EI{constructor(e,t,r){this.data=e,this.fieldMask=t,this.fieldTransforms=r}toMutation(e,t){return new on(e,this.data,this.fieldMask,t,this.fieldTransforms)}}function TI(n){switch(n){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw q(40011,{Ac:n})}}class qc{constructor(e,t,r,s,i,o){this.settings=e,this.databaseId=t,this.serializer=r,this.ignoreUndefinedProperties=s,i===void 0&&this.Rc(),this.fieldTransforms=i||[],this.fieldMask=o||[]}get path(){return this.settings.path}get Ac(){return this.settings.Ac}Vc(e){return new qc({...this.settings,...e},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}mc(e){var s;const t=(s=this.path)==null?void 0:s.child(e),r=this.Vc({path:t,fc:!1});return r.gc(e),r}yc(e){var s;const t=(s=this.path)==null?void 0:s.child(e),r=this.Vc({path:t,fc:!1});return r.Rc(),r}wc(e){return this.Vc({path:void 0,fc:!0})}Sc(e){return Ha(e,this.settings.methodName,this.settings.bc||!1,this.path,this.settings.Dc)}contains(e){return this.fieldMask.find((t=>e.isPrefixOf(t)))!==void 0||this.fieldTransforms.find((t=>e.isPrefixOf(t.field)))!==void 0}Rc(){if(this.path)for(let e=0;e<this.path.length;e++)this.gc(this.path.get(e))}gc(e){if(e.length===0)throw this.Sc("Document fields must not be empty");if(TI(this.Ac)&&dS.test(e))throw this.Sc('Document fields cannot begin and end with "__"')}}class pS{constructor(e,t,r){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=r||Dr(e)}Cc(e,t,r,s=!1){return new qc({Ac:e,methodName:t,Dc:r,path:Ie.emptyPath(),fc:!1,bc:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function xr(n){const e=n._freezeSettings(),t=Dr(n._databaseId);return new pS(n._databaseId,!!e.ignoreUndefinedProperties,t)}function Gc(n,e,t,r,s,i={}){const o=n.Cc(i.merge||i.mergeFields?2:0,e,t,s);nd("Data must be an object, but it was:",o,r);const a=AI(r,o);let l,u;if(i.merge)l=new ot(o.fieldMask),u=o.fieldTransforms;else if(i.mergeFields){const d=[];for(const f of i.mergeFields){const _=oo(e,f,t);if(!o.contains(_))throw new D(S.INVALID_ARGUMENT,`Field '${_}' is specified in your field mask but missing from your input data.`);RI(d,_)||d.push(_)}l=new ot(d),u=o.fieldTransforms.filter((f=>l.covers(f.field)))}else l=null,u=o.fieldTransforms;return new fS(new We(a),l,u)}class No extends Kn{_toFieldTransform(e){if(e.Ac!==2)throw e.Ac===1?e.Sc(`${this._methodName}() can only appear at the top level of your update data`):e.Sc(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof No}}function wI(n,e,t){return new qc({Ac:3,Dc:e.settings.Dc,methodName:n._methodName,fc:t},e.databaseId,e.serializer,e.ignoreUndefinedProperties)}class Yh extends Kn{_toFieldTransform(e){return new bo(e.path,new ys)}isEqual(e){return e instanceof Yh}}class Jh extends Kn{constructor(e,t){super(e),this.vc=t}_toFieldTransform(e){const t=wI(this,e,!0),r=this.vc.map((i=>Vr(i,t))),s=new Er(r);return new bo(e.path,s)}isEqual(e){return e instanceof Jh&&Jt(this.vc,e.vc)}}class Xh extends Kn{constructor(e,t){super(e),this.vc=t}_toFieldTransform(e){const t=wI(this,e,!0),r=this.vc.map((i=>Vr(i,t))),s=new Tr(r);return new bo(e.path,s)}isEqual(e){return e instanceof Xh&&Jt(this.vc,e.vc)}}class Zh extends Kn{constructor(e,t){super(e),this.Fc=t}_toFieldTransform(e){const t=new Is(e.serializer,$g(e.serializer,this.Fc));return new bo(e.path,t)}isEqual(e){return e instanceof Zh&&this.Fc===e.Fc}}function ed(n,e,t,r){const s=n.Cc(1,e,t);nd("Data must be an object, but it was:",s,r);const i=[],o=We.empty();zn(r,((l,u)=>{const d=zc(e,l,t);u=te(u);const f=s.yc(d);if(u instanceof No)i.push(d);else{const _=Vr(u,f);_!=null&&(i.push(d),o.set(d,_))}}));const a=new ot(i);return new EI(o,a,s.fieldTransforms)}function td(n,e,t,r,s,i){const o=n.Cc(1,e,t),a=[oo(e,r,t)],l=[s];if(i.length%2!=0)throw new D(S.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let _=0;_<i.length;_+=2)a.push(oo(e,i[_])),l.push(i[_+1]);const u=[],d=We.empty();for(let _=a.length-1;_>=0;--_)if(!RI(u,a[_])){const g=a[_];let v=l[_];v=te(v);const C=o.yc(g);if(v instanceof No)u.push(g);else{const N=Vr(v,C);N!=null&&(u.push(g),d.set(g,N))}}const f=new ot(u);return new EI(d,f,o.fieldTransforms)}function vI(n,e,t,r=!1){return Vr(t,n.Cc(r?4:3,e))}function Vr(n,e){if(bI(n=te(n)))return nd("Unsupported field value:",e,n),AI(n,e);if(n instanceof Kn)return(function(r,s){if(!TI(s.Ac))throw s.Sc(`${r._methodName}() can only be used with update() and set()`);if(!s.path)throw s.Sc(`${r._methodName}() is not currently supported inside arrays`);const i=r._toFieldTransform(s);i&&s.fieldTransforms.push(i)})(n,e),null;if(n===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),n instanceof Array){if(e.settings.fc&&e.Ac!==4)throw e.Sc("Nested arrays are not supported");return(function(r,s){const i=[];let o=0;for(const a of r){let l=Vr(a,s.wc(o));l==null&&(l={nullValue:"NULL_VALUE"}),i.push(l),o++}return{arrayValue:{values:i}}})(n,e)}return(function(r,s){if((r=te(r))===null)return{nullValue:"NULL_VALUE"};if(typeof r=="number")return $g(s.serializer,r);if(typeof r=="boolean")return{booleanValue:r};if(typeof r=="string")return{stringValue:r};if(r instanceof Date){const i=ce.fromDate(r);return{timestampValue:Es(s.serializer,i)}}if(r instanceof ce){const i=new ce(r.seconds,1e3*Math.floor(r.nanoseconds/1e3));return{timestampValue:Es(s.serializer,i)}}if(r instanceof St)return{geoPointValue:{latitude:r.latitude,longitude:r.longitude}};if(r instanceof st)return{bytesValue:ry(s.serializer,r._byteString)};if(r instanceof ue){const i=s.databaseId,o=r.firestore._databaseId;if(!o.isEqual(i))throw s.Sc(`Document reference is for database ${o.projectId}/${o.database} but should be for database ${i.projectId}/${i.database}`);return{referenceValue:Eh(r.firestore._databaseId||s.databaseId,r._key.path)}}if(r instanceof Tt)return(function(o,a){return{mapValue:{fields:{[lh]:{stringValue:uh},[_s]:{arrayValue:{values:o.toArray().map((u=>{if(typeof u!="number")throw a.Sc("VectorValues must only contain numeric values.");return ph(a.serializer,u)}))}}}}}})(r,s);throw s.Sc(`Unsupported field value: ${Tc(r)}`)})(n,e)}function AI(n,e){const t={};return gg(n)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):zn(n,((r,s)=>{const i=Vr(s,e.mc(r));i!=null&&(t[r]=i)})),{mapValue:{fields:t}}}function bI(n){return!(typeof n!="object"||n===null||n instanceof Array||n instanceof Date||n instanceof ce||n instanceof St||n instanceof st||n instanceof ue||n instanceof Kn||n instanceof Tt)}function nd(n,e,t){if(!bI(t)||!Xm(t)){const r=Tc(t);throw r==="an object"?e.Sc(n+" a custom object"):e.Sc(n+" "+r)}}function oo(n,e,t){if((e=te(e))instanceof Wn)return e._internalPath;if(typeof e=="string")return zc(n,e);throw Ha("Field path arguments must be of type string or ",n,!1,void 0,t)}const _S=new RegExp("[~\\*/\\[\\]]");function zc(n,e,t){if(e.search(_S)>=0)throw Ha(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,n,!1,void 0,t);try{return new Wn(...e.split("."))._internalPath}catch{throw Ha(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,n,!1,void 0,t)}}function Ha(n,e,t,r,s){const i=r&&!r.isEmpty(),o=s!==void 0;let a=`Function ${e}() called with invalid data`;t&&(a+=" (via `toFirestore()`)"),a+=". ";let l="";return(i||o)&&(l+=" (found",i&&(l+=` in field ${r}`),o&&(l+=` in document ${s}`),l+=")"),new D(S.INVALID_ARGUMENT,a+n+l)}function RI(n,e){return n.some((t=>t.isEqual(e)))}/**
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
 */class ao{constructor(e,t,r,s,i){this._firestore=e,this._userDataWriter=t,this._key=r,this._document=s,this._converter=i}get id(){return this._key.path.lastSegment()}get ref(){return new ue(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new mS(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}get(e){if(this._document){const t=this._document.data.field($c("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}}class mS extends ao{data(){return super.data()}}function $c(n,e){return typeof e=="string"?zc(n,e):e instanceof Wn?e._internalPath:e._delegate._internalPath}/**
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
 */function SI(n){if(n.limitType==="L"&&n.explicitOrderBy.length===0)throw new D(S.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class rd{}class js extends rd{}function gS(n,e,...t){let r=[];e instanceof rd&&r.push(e),r=r.concat(t),(function(i){const o=i.filter((l=>l instanceof Or)).length,a=i.filter((l=>l instanceof Ws)).length;if(o>1||o>0&&a>0)throw new D(S.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")})(r);for(const s of r)n=s._apply(n);return n}class Ws extends js{constructor(e,t,r){super(),this._field=e,this._op=t,this._value=r,this.type="where"}static _create(e,t,r){return new Ws(e,t,r)}_apply(e){const t=this._parse(e);return PI(e._query,t),new Le(e.firestore,e.converter,gu(e._query,t))}_parse(e){const t=xr(e.firestore);return(function(i,o,a,l,u,d,f){let _;if(u.isKeyField()){if(d==="array-contains"||d==="array-contains-any")throw new D(S.INVALID_ARGUMENT,`Invalid Query. You can't perform '${d}' queries on documentId().`);if(d==="in"||d==="not-in"){b_(f,d);const v=[];for(const C of f)v.push(A_(l,i,C));_={arrayValue:{values:v}}}else _=A_(l,i,f)}else d!=="in"&&d!=="not-in"&&d!=="array-contains-any"||b_(f,d),_=vI(a,o,f,d==="in"||d==="not-in");return re.create(u,d,_)})(e._query,"where",t,e.firestore._databaseId,this._field,this._op,this._value)}}function yS(n,e,t){const r=e,s=$c("where",n);return Ws._create(s,r,t)}class Or extends rd{constructor(e,t){super(),this.type=e,this._queryConstraints=t}static _create(e,t){return new Or(e,t)}_parse(e){const t=this._queryConstraints.map((r=>r._parse(e))).filter((r=>r.getFilters().length>0));return t.length===1?t[0]:le.create(t,this._getOperator())}_apply(e){const t=this._parse(e);return t.getFilters().length===0?e:((function(s,i){let o=s;const a=i.getFlattenedFilters();for(const l of a)PI(o,l),o=gu(o,l)})(e._query,t),new Le(e.firestore,e.converter,gu(e._query,t)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}function IS(...n){return n.forEach((e=>NI("or",e))),Or._create("or",n)}function ES(...n){return n.forEach((e=>NI("and",e))),Or._create("and",n)}class jc extends js{constructor(e,t){super(),this._field=e,this._direction=t,this.type="orderBy"}static _create(e,t){return new jc(e,t)}_apply(e){const t=(function(s,i,o){if(s.startAt!==null)throw new D(S.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(s.endAt!==null)throw new D(S.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new ro(i,o)})(e._query,this._field,this._direction);return new Le(e.firestore,e.converter,(function(s,i){const o=s.explicitOrderBy.concat([i]);return new rn(s.path,s.collectionGroup,o,s.filters.slice(),s.limit,s.limitType,s.startAt,s.endAt)})(e._query,t))}}function TS(n,e="asc"){const t=e,r=$c("orderBy",n);return jc._create(r,t)}class ko extends js{constructor(e,t,r){super(),this.type=e,this._limit=t,this._limitType=r}static _create(e,t,r){return new ko(e,t,r)}_apply(e){return new Le(e.firestore,e.converter,Ua(e._query,this._limit,this._limitType))}}function wS(n){return Zm("limit",n),ko._create("limit",n,"F")}function vS(n){return Zm("limitToLast",n),ko._create("limitToLast",n,"L")}class Do extends js{constructor(e,t,r){super(),this.type=e,this._docOrFields=t,this._inclusive=r}static _create(e,t,r){return new Do(e,t,r)}_apply(e){const t=CI(e,this.type,this._docOrFields,this._inclusive);return new Le(e.firestore,e.converter,(function(s,i){return new rn(s.path,s.collectionGroup,s.explicitOrderBy.slice(),s.filters.slice(),s.limit,s.limitType,i,s.endAt)})(e._query,t))}}function AS(...n){return Do._create("startAt",n,!0)}function bS(...n){return Do._create("startAfter",n,!1)}class xo extends js{constructor(e,t,r){super(),this.type=e,this._docOrFields=t,this._inclusive=r}static _create(e,t,r){return new xo(e,t,r)}_apply(e){const t=CI(e,this.type,this._docOrFields,this._inclusive);return new Le(e.firestore,e.converter,(function(s,i){return new rn(s.path,s.collectionGroup,s.explicitOrderBy.slice(),s.filters.slice(),s.limit,s.limitType,s.startAt,i)})(e._query,t))}}function RS(...n){return xo._create("endBefore",n,!1)}function SS(...n){return xo._create("endAt",n,!0)}function CI(n,e,t,r){if(t[0]=te(t[0]),t[0]instanceof ao)return(function(i,o,a,l,u){if(!l)throw new D(S.NOT_FOUND,`Can't use a DocumentSnapshot that doesn't exist for ${a}().`);const d=[];for(const f of Zr(i))if(f.field.isKeyField())d.push(yr(o,l.key));else{const _=l.data.field(f.field);if(Rc(_))throw new D(S.INVALID_ARGUMENT,'Invalid query. You are trying to start or end a query using a document for which the field "'+f.field+'" is an uncommitted server timestamp. (Since the value of this field is unknown, you cannot start/end a query with it.)');if(_===null){const g=f.field.canonicalString();throw new D(S.INVALID_ARGUMENT,`Invalid query. You are trying to start or end a query using a document for which the field '${g}' (used as the orderBy) does not exist.`)}d.push(_)}return new Vn(d,u)})(n._query,n.firestore._databaseId,e,t[0]._document,r);{const s=xr(n.firestore);return(function(o,a,l,u,d,f){const _=o.explicitOrderBy;if(d.length>_.length)throw new D(S.INVALID_ARGUMENT,`Too many arguments provided to ${u}(). The number of arguments must be less than or equal to the number of orderBy() clauses`);const g=[];for(let v=0;v<d.length;v++){const C=d[v];if(_[v].field.isKeyField()){if(typeof C!="string")throw new D(S.INVALID_ARGUMENT,`Invalid query. Expected a string for document ID in ${u}(), but got a ${typeof C}`);if(!dh(o)&&C.indexOf("/")!==-1)throw new D(S.INVALID_ARGUMENT,`Invalid query. When querying a collection and ordering by documentId(), the value passed to ${u}() must be a plain document ID, but '${C}' contains a slash.`);const N=o.path.child(X.fromString(C));if(!M.isDocumentKey(N))throw new D(S.INVALID_ARGUMENT,`Invalid query. When querying a collection group and ordering by documentId(), the value passed to ${u}() must result in a valid document path, but '${N}' is not because it contains an odd number of segments.`);const V=new M(N);g.push(yr(a,V))}else{const N=vI(l,u,C);g.push(N)}}return new Vn(g,f)})(n._query,n.firestore._databaseId,s,e,t,r)}}function A_(n,e,t){if(typeof(t=te(t))=="string"){if(t==="")throw new D(S.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!dh(e)&&t.indexOf("/")!==-1)throw new D(S.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${t}' contains a '/' character.`);const r=e.path.child(X.fromString(t));if(!M.isDocumentKey(r))throw new D(S.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${r}' is not because it has an odd number of segments (${r.length}).`);return yr(n,new M(r))}if(t instanceof ue)return yr(n,t._key);throw new D(S.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${Tc(t)}.`)}function b_(n,e){if(!Array.isArray(n)||n.length===0)throw new D(S.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`)}function PI(n,e){const t=(function(s,i){for(const o of s)for(const a of o.getFlattenedFilters())if(i.indexOf(a.op)>=0)return a.op;return null})(n.filters,(function(s){switch(s){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}})(e.op));if(t!==null)throw t===e.op?new D(S.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new D(S.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${t.toString()}' filters.`)}function NI(n,e){if(!(e instanceof Ws||e instanceof Or))throw new D(S.INVALID_ARGUMENT,`Function ${n}() requires AppliableConstraints created with a call to 'where(...)', 'or(...)', or 'and(...)'.`)}class sd{convertValue(e,t="none"){switch(Dn(e)){case 0:return null;case 1:return e.booleanValue;case 2:return Ee(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,t);case 5:return e.stringValue;case 6:return this.convertBytes(tn(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,t);case 11:return this.convertObject(e.mapValue,t);case 10:return this.convertVectorValue(e.mapValue);default:throw q(62114,{value:e})}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){const r={};return zn(e,((s,i)=>{r[s]=this.convertValue(i,t)})),r}convertVectorValue(e){var r,s,i;const t=(i=(s=(r=e.fields)==null?void 0:r[_s].arrayValue)==null?void 0:s.values)==null?void 0:i.map((o=>Ee(o.doubleValue)));return new Tt(t)}convertGeoPoint(e){return new St(Ee(e.latitude),Ee(e.longitude))}convertArray(e,t){return(e.values||[]).map((r=>this.convertValue(r,t)))}convertServerTimestamp(e,t){switch(t){case"previous":const r=Sc(e);return r==null?null:this.convertValue(r,t);case"estimate":return this.convertTimestamp(Zi(e));default:return null}}convertTimestamp(e){const t=en(e);return new ce(t.seconds,t.nanos)}convertDocumentKey(e,t){const r=X.fromString(e);G(fy(r),9688,{name:e});const s=new kn(r.get(1),r.get(3)),i=new M(r.popFirst(5));return s.isEqual(t)||Ne(`Document ${i} contains a document reference within a different database (${s.projectId}/${s.database}) which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),i}}/**
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
 */function Wc(n,e,t){let r;return r=n?t&&(t.merge||t.mergeFields)?n.toFirestore(e,t):n.toFirestore(e):e,r}class id extends sd{constructor(e){super(),this.firestore=e}convertBytes(e){return new st(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new ue(this.firestore,null,t)}}/**
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
 */function CS(n){return new Ss("sum",oo("sum",n))}function PS(n){return new Ss("avg",oo("average",n))}function kI(){return new Ss("count")}function NS(n,e){var t,r;return n instanceof Ss&&e instanceof Ss&&n.aggregateType===e.aggregateType&&((t=n._internalFieldPath)==null?void 0:t.canonicalString())===((r=e._internalFieldPath)==null?void 0:r.canonicalString())}function kS(n,e){return Qh(n.query,e.query)&&Jt(n.data(),e.data())}/**
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
 */const DI="NOT SUPPORTED";class Ht{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class ht extends ao{constructor(e,t,r,s,i,o){super(e,t,r,s,o),this._firestore=e,this._firestoreImpl=e,this.metadata=i}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new Fi(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const r=this._document.data.field($c("DocumentSnapshot.get",e));if(r!==null)return this._userDataWriter.convertValue(r,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new D(S.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=ht._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}}function DS(n,e,t){if(kr(e,ht._jsonSchema)){if(e.bundle===DI)throw new D(S.INVALID_ARGUMENT,"The provided JSON object was created in a client environment, which is not supported.");const r=Dr(n._databaseId),s=lI(e.bundle,r),i=s.Wu(),o=new Uh(s.getMetadata(),r);for(const d of i)o.Ga(d);const a=o.documents;if(a.length!==1)throw new D(S.INVALID_ARGUMENT,`Expected bundle data to contain 1 document, but it contains ${a.length} documents.`);const l=kc(r,a[0].document),u=new M(X.fromString(e.bundleName));return new ht(n,new id(n),u,l,new Ht(!1,!1),t||null)}}ht._jsonSchemaVersion="firestore/documentSnapshot/1.0",ht._jsonSchema={type:Ve("string",ht._jsonSchemaVersion),bundleSource:Ve("string","DocumentSnapshot"),bundleName:Ve("string"),bundle:Ve("string")};class Fi extends ht{data(e={}){return super.data(e)}}class dt{constructor(e,t,r,s){this._firestore=e,this._userDataWriter=t,this._snapshot=s,this.metadata=new Ht(s.hasPendingWrites,s.fromCache),this.query=r}get docs(){const e=[];return this.forEach((t=>e.push(t))),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach((r=>{e.call(t,new Fi(this._firestore,this._userDataWriter,r.key,r,new Ht(this._snapshot.mutatedKeys.has(r.key),this._snapshot.fromCache),this.query.converter))}))}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new D(S.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=(function(s,i){if(s._snapshot.oldDocs.isEmpty()){let o=0;return s._snapshot.docChanges.map((a=>{const l=new Fi(s._firestore,s._userDataWriter,a.doc.key,a.doc,new Ht(s._snapshot.mutatedKeys.has(a.doc.key),s._snapshot.fromCache),s.query.converter);return a.doc,{type:"added",doc:l,oldIndex:-1,newIndex:o++}}))}{let o=s._snapshot.oldDocs;return s._snapshot.docChanges.filter((a=>i||a.type!==3)).map((a=>{const l=new Fi(s._firestore,s._userDataWriter,a.doc.key,a.doc,new Ht(s._snapshot.mutatedKeys.has(a.doc.key),s._snapshot.fromCache),s.query.converter);let u=-1,d=-1;return a.type!==0&&(u=o.indexOf(a.doc.key),o=o.delete(a.doc.key)),a.type!==1&&(o=o.add(a.doc),d=o.indexOf(a.doc.key)),{type:VS(a.type),doc:l,oldIndex:u,newIndex:d}}))}})(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new D(S.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=dt._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=Ec.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],r=[],s=[];return this.docs.forEach((i=>{i._document!==null&&(t.push(i._document),r.push(this._userDataWriter.convertObjectMap(i._document.data.value.mapValue.fields,"previous")),s.push(i.ref.path))})),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function xS(n,e,t){if(kr(e,dt._jsonSchema)){if(e.bundle===DI)throw new D(S.INVALID_ARGUMENT,"The provided JSON object was created in a client environment, which is not supported.");const r=Dr(n._databaseId),s=lI(e.bundle,r),i=s.Wu(),o=new Uh(s.getMetadata(),r);for(const _ of i)o.Ga(_);if(o.queries.length!==1)throw new D(S.INVALID_ARGUMENT,`Snapshot data expected 1 query but found ${o.queries.length} queries.`);const a=xc(o.queries[0].bundledQuery),l=o.documents;let u=new mr;l.map((_=>{const g=kc(r,_.document);u=u.add(g)}));const d=Rr.fromInitialDocuments(a,u,K(),!1,!1),f=new Le(n,t||null,a);return new dt(n,new id(n),f,d)}}function VS(n){switch(n){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return q(61501,{type:n})}}function OS(n,e){return n instanceof ht&&e instanceof ht?n._firestore===e._firestore&&n._key.isEqual(e._key)&&(n._document===null?e._document===null:n._document.isEqual(e._document))&&n._converter===e._converter:n instanceof dt&&e instanceof dt&&n._firestore===e._firestore&&Qh(n.query,e.query)&&n.metadata.isEqual(e.metadata)&&n._snapshot.isEqual(e._snapshot)}/**
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
 */function MS(n){n=ee(n,ue);const e=ee(n.firestore,fe);return aI(we(e),n._key).then((t=>od(e,n,t)))}dt._jsonSchemaVersion="firestore/querySnapshot/1.0",dt._jsonSchema={type:Ve("string",dt._jsonSchemaVersion),bundleSource:Ve("string","QuerySnapshot"),bundleName:Ve("string"),bundle:Ve("string")};class Hn extends sd{constructor(e){super(),this.firestore=e}convertBytes(e){return new st(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new ue(this.firestore,null,t)}}function LS(n){n=ee(n,ue);const e=ee(n.firestore,fe),t=we(e),r=new Hn(e);return $R(t,n._key).then((s=>new ht(e,r,n._key,s,new Ht(s!==null&&s.hasLocalMutations,!0),n.converter)))}function FS(n){n=ee(n,ue);const e=ee(n.firestore,fe);return aI(we(e),n._key,{source:"server"}).then((t=>od(e,n,t)))}function US(n){n=ee(n,Le);const e=ee(n.firestore,fe),t=we(e),r=new Hn(e);return SI(n._query),cI(t,n._query).then((s=>new dt(e,r,n,s)))}function BS(n){n=ee(n,Le);const e=ee(n.firestore,fe),t=we(e),r=new Hn(e);return jR(t,n._query).then((s=>new dt(e,r,n,s)))}function qS(n){n=ee(n,Le);const e=ee(n.firestore,fe),t=we(e),r=new Hn(e);return cI(t,n._query,{source:"server"}).then((s=>new dt(e,r,n,s)))}function GS(n,e,t){n=ee(n,ue);const r=ee(n.firestore,fe),s=Wc(n.converter,e,t);return Ks(r,[Gc(xr(r),"setDoc",n._key,s,n.converter!==null,t).toMutation(n._key,Te.none())])}function zS(n,e,t,...r){n=ee(n,ue);const s=ee(n.firestore,fe),i=xr(s);let o;return o=typeof(e=te(e))=="string"||e instanceof Wn?td(i,"updateDoc",n._key,e,t,r):ed(i,"updateDoc",n._key,e),Ks(s,[o.toMutation(n._key,Te.exists(!0))])}function $S(n){return Ks(ee(n.firestore,fe),[new Us(n._key,Te.none())])}function jS(n,e){const t=ee(n.firestore,fe),r=fI(n),s=Wc(n.converter,e);return Ks(t,[Gc(xr(n.firestore),"addDoc",r._key,s,n.converter!==null,{}).toMutation(r._key,Te.exists(!1))]).then((()=>r))}function ku(n,...e){var l,u,d;n=te(n);let t={includeMetadataChanges:!1,source:"default"},r=0;typeof e[r]!="object"||es(e[r])||(t=e[r++]);const s={includeMetadataChanges:t.includeMetadataChanges,source:t.source};if(es(e[r])){const f=e[r];e[r]=(l=f.next)==null?void 0:l.bind(f),e[r+1]=(u=f.error)==null?void 0:u.bind(f),e[r+2]=(d=f.complete)==null?void 0:d.bind(f)}let i,o,a;if(n instanceof ue)o=ee(n.firestore,fe),a=Ls(n._key.path),i={next:f=>{e[r]&&e[r](od(o,n,f))},error:e[r+1],complete:e[r+2]};else{const f=ee(n,Le);o=ee(f.firestore,fe),a=f._query;const _=new Hn(o);i={next:g=>{e[r]&&e[r](new dt(o,_,f,g))},error:e[r+1],complete:e[r+2]},SI(n._query)}return(function(_,g,v,C){const N=new Uc(C),V=new Fh(g,N,v);return _.asyncQueue.enqueueAndForget((async()=>Oh(await Rs(_),V))),()=>{N.Nu(),_.asyncQueue.enqueueAndForget((async()=>Mh(await Rs(_),V)))}})(we(o),a,s,i)}function WS(n,e,...t){const r=te(n),s=(function(l){const u={bundle:"",bundleName:"",bundleSource:""},d=["bundle","bundleName","bundleSource"];for(const f of d){if(!(f in l)){u.error=`snapshotJson missing required field: ${f}`;break}const _=l[f];if(typeof _!="string"){u.error=`snapshotJson field '${f}' must be a string.`;break}if(_.length===0){u.error=`snapshotJson field '${f}' cannot be an empty string.`;break}f==="bundle"?u.bundle=_:f==="bundleName"?u.bundleName=_:f==="bundleSource"&&(u.bundleSource=_)}return u})(e);if(s.error)throw new D(S.INVALID_ARGUMENT,s.error);let i,o=0;if(typeof t[o]!="object"||es(t[o])||(i=t[o++]),s.bundleSource==="QuerySnapshot"){let a=null;if(typeof t[o]=="object"&&es(t[o])){const l=t[o++];a={next:l.next,error:l.error,complete:l.complete}}else a={next:t[o++],error:t[o++],complete:t[o++]};return(function(u,d,f,_,g){let v,C=!1;return Nu(u,d.bundle).then((()=>yI(u,d.bundleName))).then((V=>{V&&!C&&(g&&V.withConverter(g),v=ku(V,f||{},_))})).catch((V=>(_.error&&_.error(V),()=>{}))),()=>{C||(C=!0,v&&v())}})(r,s,i,a,t[o])}if(s.bundleSource==="DocumentSnapshot"){let a=null;if(typeof t[o]=="object"&&es(t[o])){const l=t[o++];a={next:l.next,error:l.error,complete:l.complete}}else a={next:t[o++],error:t[o++],complete:t[o++]};return(function(u,d,f,_,g){let v,C=!1;return Nu(u,d.bundle).then((()=>{if(!C){const V=new ue(u,g||null,M.fromPath(d.bundleName));v=ku(V,f||{},_)}})).catch((V=>(_.error&&_.error(V),()=>{}))),()=>{C||(C=!0,v&&v())}})(r,s,i,a,t[o])}throw new D(S.INVALID_ARGUMENT,`unsupported bundle source: ${s.bundleSource}`)}function KS(n,e){return KR(we(n=ee(n,fe)),es(e)?e:{next:e})}function Ks(n,e){return(function(r,s){const i=new $e;return r.asyncQueue.enqueueAndForget((async()=>TR(await Hh(r),s,i))),i.promise})(we(n),e)}function od(n,e,t){const r=t.docs.get(e._key),s=new Hn(n);return new ht(n,s,e._key,r,new Ht(t.hasPendingWrites,t.fromCache),e.converter)}function HS(n){return xI(n,{count:kI()})}function xI(n,e){const t=ee(n.firestore,fe),r=we(t),s=mg(e,((i,o)=>new Jg(o,i.aggregateType,i._internalFieldPath)));return WR(r,n._query,s).then((i=>(function(a,l,u){const d=new Hn(a);return new II(l,d,u)})(t,n,i)))}class QS{constructor(e){this.kind="memory",this._onlineComponentProvider=Mn.provider,this._offlineComponentProvider=e!=null&&e.garbageCollector?e.garbageCollector._offlineComponentProvider:{build:()=>new jh(void 0)}}toJSON(){return{kind:this.kind}}}class YS{constructor(e){let t;this.kind="persistent",e!=null&&e.tabManager?(e.tabManager._initialize(e),t=e.tabManager):(t=VI(void 0),t._initialize(e)),this._onlineComponentProvider=t._onlineComponentProvider,this._offlineComponentProvider=t._offlineComponentProvider}toJSON(){return{kind:this.kind}}}class JS{constructor(){this.kind="memoryEager",this._offlineComponentProvider=bs.provider}toJSON(){return{kind:this.kind}}}class XS{constructor(e){this.kind="memoryLru",this._offlineComponentProvider={build:()=>new jh(e)}}toJSON(){return{kind:this.kind}}}function ZS(){return new JS}function eC(n){return new XS(n==null?void 0:n.cacheSizeBytes)}function tC(n){return new QS(n)}function nC(n){return new YS(n)}class rC{constructor(e){this.forceOwnership=e,this.kind="persistentSingleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=Mn.provider,this._offlineComponentProvider={build:t=>new Wh(t,e==null?void 0:e.cacheSizeBytes,this.forceOwnership)}}}class sC{constructor(){this.kind="PersistentMultipleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=Mn.provider,this._offlineComponentProvider={build:t=>new rI(t,e==null?void 0:e.cacheSizeBytes)}}}function VI(n){return new rC(n==null?void 0:n.forceOwnership)}function iC(){return new sC}/**
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
 */const oC={maxAttempts:5};/**
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
 */class OI{constructor(e,t){this._firestore=e,this._commitHandler=t,this._mutations=[],this._committed=!1,this._dataReader=xr(e)}set(e,t,r){this._verifyNotCommitted();const s=vn(e,this._firestore),i=Wc(s.converter,t,r),o=Gc(this._dataReader,"WriteBatch.set",s._key,i,s.converter!==null,r);return this._mutations.push(o.toMutation(s._key,Te.none())),this}update(e,t,r,...s){this._verifyNotCommitted();const i=vn(e,this._firestore);let o;return o=typeof(t=te(t))=="string"||t instanceof Wn?td(this._dataReader,"WriteBatch.update",i._key,t,r,s):ed(this._dataReader,"WriteBatch.update",i._key,t),this._mutations.push(o.toMutation(i._key,Te.exists(!0))),this}delete(e){this._verifyNotCommitted();const t=vn(e,this._firestore);return this._mutations=this._mutations.concat(new Us(t._key,Te.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new D(S.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function vn(n,e){if((n=te(n)).firestore!==e)throw new D(S.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return n}/**
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
 */class aC{constructor(e,t){this._firestore=e,this._transaction=t,this._dataReader=xr(e)}get(e){const t=vn(e,this._firestore),r=new id(this._firestore);return this._transaction.lookup([t._key]).then((s=>{if(!s||s.length!==1)return q(24041);const i=s[0];if(i.isFoundDocument())return new ao(this._firestore,r,i.key,i,t.converter);if(i.isNoDocument())return new ao(this._firestore,r,t._key,null,t.converter);throw q(18433,{doc:i})}))}set(e,t,r){const s=vn(e,this._firestore),i=Wc(s.converter,t,r),o=Gc(this._dataReader,"Transaction.set",s._key,i,s.converter!==null,r);return this._transaction.set(s._key,o),this}update(e,t,r,...s){const i=vn(e,this._firestore);let o;return o=typeof(t=te(t))=="string"||t instanceof Wn?td(this._dataReader,"Transaction.update",i._key,t,r,s):ed(this._dataReader,"Transaction.update",i._key,t),this._transaction.update(i._key,o),this}delete(e){const t=vn(e,this._firestore);return this._transaction.delete(t._key),this}}/**
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
 */class MI extends aC{constructor(e,t){super(e,t),this._firestore=e}get(e){const t=vn(e,this._firestore),r=new Hn(this._firestore);return super.get(e).then((s=>new ht(this._firestore,r,t._key,s._document,new Ht(!1,!1),t.converter)))}}function cC(n,e,t){n=ee(n,fe);const r={...oC,...t};return(function(i){if(i.maxAttempts<1)throw new D(S.INVALID_ARGUMENT,"Max attempts must be at least 1")})(r),(function(i,o,a){const l=new $e;return i.asyncQueue.enqueueAndForget((async()=>{const u=await oI(i);new BR(i.asyncQueue,u,a,o,l).ju()})),l.promise})(we(n),(s=>e(new MI(n,s))),r)}/**
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
 */function lC(){return new No("deleteField")}function uC(){return new Yh("serverTimestamp")}function hC(...n){return new Jh("arrayUnion",n)}function dC(...n){return new Xh("arrayRemove",n)}function fC(n){return new Zh("increment",n)}function pC(n){return new Tt(n)}/**
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
 */function _C(n){return we(n=ee(n,fe)),new OI(n,(e=>Ks(n,e)))}/**
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
 */function mC(n,e){const t=we(n=ee(n,fe));if(!t._uninitializedComponentsProvider||t._uninitializedComponentsProvider._offline.kind==="memory")return yt("Cannot enable indexes when persistence is disabled"),Promise.resolve();const r=(function(i){const o=typeof i=="string"?(function(u){try{return JSON.parse(u)}catch(d){throw new D(S.INVALID_ARGUMENT,"Failed to parse JSON: "+(d==null?void 0:d.message))}})(i):i,a=[];if(Array.isArray(o.indexes))for(const l of o.indexes){const u=R_(l,"collectionGroup"),d=[];if(Array.isArray(l.fields))for(const f of l.fields){const _=zc("setIndexConfiguration",R_(f,"fieldPath"));f.arrayConfig==="CONTAINS"?d.push(new pr(_,2)):f.order==="ASCENDING"?d.push(new pr(_,0)):f.order==="DESCENDING"&&d.push(new pr(_,1))}a.push(new ls(ls.UNKNOWN_ID,u,d,us.empty()))}return a})(e);return YR(t,r)}function R_(n,e){if(typeof n[e]!="string")throw new D(S.INVALID_ARGUMENT,"Missing string value for: "+e);return n[e]}/**
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
 */class LI{constructor(e){this._firestore=e,this.type="PersistentCacheIndexManager"}}function gC(n){var s;n=ee(n,fe);const e=S_.get(n);if(e)return e;if(((s=we(n)._uninitializedComponentsProvider)==null?void 0:s._offline.kind)!=="persistent")return null;const r=new LI(n);return S_.set(n,r),r}function yC(n){FI(n,!0)}function IC(n){FI(n,!1)}function EC(n){XR(we(n._firestore)).then((e=>x("deleting all persistent cache indexes succeeded"))).catch((e=>yt("deleting all persistent cache indexes failed",e)))}function FI(n,e){JR(we(n._firestore),e).then((t=>x(`setting persistent cache index auto creation isEnabled=${e} succeeded`))).catch((t=>yt(`setting persistent cache index auto creation isEnabled=${e} failed`,t)))}const S_=new WeakMap;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function TC(n){var r;const e=we(ee(n.firestore,fe)),t=(r=e._onlineComponents)==null?void 0:r.datastore.serializer;return t===void 0?null:Dc(t,Je(n._query)).ft}function wC(n,e){var i;const t=mg(e,((o,a)=>new Jg(a,o.aggregateType,o._internalFieldPath))),r=we(ee(n.firestore,fe)),s=(i=r._onlineComponents)==null?void 0:i.datastore.serializer;return s===void 0?null:ly(s,Og(n._query),t,!0).request}/**
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
 */class vC{constructor(){throw new Error("instances of this class should not be created")}static onExistenceFilterMismatch(e){return ad.instance.onExistenceFilterMismatch(e)}}class ad{constructor(){this.Mc=new Map}static get instance(){return ua||(ua=new ad,(function(t){if(Mi)throw new Error("a TestingHooksSpi instance is already set");Mi=t})(ua)),ua}lt(e){this.Mc.forEach((t=>t(e)))}onExistenceFilterMismatch(e){const t=Symbol(),r=this.Mc;return r.set(t,e),()=>r.delete(t)}}let ua=null;(function(e,t=!0){(function(s){Ms=s})(Os),Zt(new Bt("firestore",((r,{instanceIdentifier:s,options:i})=>{const o=r.getProvider("app").getImmediate(),a=new fe(new Mv(r.getProvider("auth-internal")),new Uv(o,r.getProvider("app-check-internal")),(function(u,d){if(!Object.prototype.hasOwnProperty.apply(u.options,["projectId"]))throw new D(S.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new kn(u.options.projectId,d)})(o,s),o);return i={useFetchStreams:t,...i},a._setSettings(i),a}),"PUBLIC").setMultipleInstances(!0)),ut(ip,op,e),ut(ip,op,"esm2020")})();const ax=Object.freeze(Object.defineProperty({__proto__:null,AbstractUserDataWriter:sd,AggregateField:Ss,AggregateQuerySnapshot:II,Bytes:st,CACHE_SIZE_UNLIMITED:nS,CollectionReference:Rt,DocumentReference:ue,DocumentSnapshot:ht,FieldPath:Wn,FieldValue:Kn,Firestore:fe,FirestoreError:D,GeoPoint:St,LoadBundleTask:pI,PersistentCacheIndexManager:LI,Query:Le,QueryCompositeFilterConstraint:Or,QueryConstraint:js,QueryDocumentSnapshot:Fi,QueryEndAtConstraint:xo,QueryFieldFilterConstraint:Ws,QueryLimitConstraint:ko,QueryOrderByConstraint:jc,QuerySnapshot:dt,QueryStartAtConstraint:Do,SnapshotMetadata:Ht,Timestamp:ce,Transaction:MI,VectorValue:Tt,WriteBatch:OI,_AutoId:Ec,_ByteString:be,_DatabaseId:kn,_DocumentKey:M,_EmptyAppCheckTokenProvider:Bv,_EmptyAuthCredentialsProvider:Qm,_FieldPath:Ie,_TestingHooks:vC,_cast:ee,_debugAssert:Vv,_internalAggregationQueryToProtoRunAggregationQueryRequest:wC,_internalQueryToProtoQueryTarget:TC,_isBase64Available:vA,_logWarn:yt,_validateIsNotUsedTogether:Jm,addDoc:jS,aggregateFieldEqual:NS,aggregateQuerySnapshotEqual:kS,and:ES,arrayRemove:dC,arrayUnion:hC,average:PS,clearIndexedDbPersistence:oS,collection:ZR,collectionGroup:eS,connectFirestoreEmulator:dI,count:kI,deleteAllPersistentCacheIndexes:EC,deleteDoc:$S,deleteField:lC,disableNetwork:lS,disablePersistentCacheIndexAutoCreation:IC,doc:fI,documentId:hS,documentSnapshotFromJSON:DS,enableIndexedDbPersistence:sS,enableMultiTabIndexedDbPersistence:iS,enableNetwork:cS,enablePersistentCacheIndexAutoCreation:yC,endAt:SS,endBefore:RS,ensureFirestoreConfigured:we,executeWrite:Ks,getAggregateFromServer:xI,getCountFromServer:HS,getDoc:MS,getDocFromCache:LS,getDocFromServer:FS,getDocs:US,getDocsFromCache:BS,getDocsFromServer:qS,getFirestore:_I,getPersistentCacheIndexManager:gC,increment:fC,initializeFirestore:rS,limit:wS,limitToLast:vS,loadBundle:Nu,memoryEagerGarbageCollector:ZS,memoryLocalCache:tC,memoryLruGarbageCollector:eC,namedQuery:yI,onSnapshot:ku,onSnapshotResume:WS,onSnapshotsInSync:KS,or:IS,orderBy:TS,persistentLocalCache:nC,persistentMultipleTabManager:iC,persistentSingleTabManager:VI,query:gS,queryEqual:Qh,querySnapshotFromJSON:xS,refEqual:tS,runTransaction:cC,serverTimestamp:uC,setDoc:GS,setIndexConfiguration:mC,setLogLevel:xv,snapshotEqual:OS,startAfter:bS,startAt:AS,sum:CS,terminate:uS,updateDoc:zS,vector:pC,waitForPendingWrites:aS,where:yS,writeBatch:_C},Symbol.toStringTag,{value:"Module"}));/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const UI="firebasestorage.googleapis.com",BI="storageBucket",AC=120*1e3,bC=600*1e3;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ce extends zt{constructor(e,t,r=0){super(Gl(e),`Firebase Storage: ${t} (${Gl(e)})`),this.status_=r,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,Ce.prototype)}get status(){return this.status_}set status(e){this.status_=e}_codeEquals(e){return Gl(e)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(e){this.customData.serverResponse=e,this.customData.serverResponse?this.message=`${this._baseMessage}
${this.customData.serverResponse}`:this.message=this._baseMessage}}var Se;(function(n){n.UNKNOWN="unknown",n.OBJECT_NOT_FOUND="object-not-found",n.BUCKET_NOT_FOUND="bucket-not-found",n.PROJECT_NOT_FOUND="project-not-found",n.QUOTA_EXCEEDED="quota-exceeded",n.UNAUTHENTICATED="unauthenticated",n.UNAUTHORIZED="unauthorized",n.UNAUTHORIZED_APP="unauthorized-app",n.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",n.INVALID_CHECKSUM="invalid-checksum",n.CANCELED="canceled",n.INVALID_EVENT_NAME="invalid-event-name",n.INVALID_URL="invalid-url",n.INVALID_DEFAULT_BUCKET="invalid-default-bucket",n.NO_DEFAULT_BUCKET="no-default-bucket",n.CANNOT_SLICE_BLOB="cannot-slice-blob",n.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",n.NO_DOWNLOAD_URL="no-download-url",n.INVALID_ARGUMENT="invalid-argument",n.INVALID_ARGUMENT_COUNT="invalid-argument-count",n.APP_DELETED="app-deleted",n.INVALID_ROOT_OPERATION="invalid-root-operation",n.INVALID_FORMAT="invalid-format",n.INTERNAL_ERROR="internal-error",n.UNSUPPORTED_ENVIRONMENT="unsupported-environment"})(Se||(Se={}));function Gl(n){return"storage/"+n}function cd(){const n="An unknown error occurred, please check the error payload for server response.";return new Ce(Se.UNKNOWN,n)}function RC(n){return new Ce(Se.OBJECT_NOT_FOUND,"Object '"+n+"' does not exist.")}function SC(n){return new Ce(Se.QUOTA_EXCEEDED,"Quota for bucket '"+n+"' exceeded, please view quota on https://firebase.google.com/pricing/.")}function CC(){const n="User is not authenticated, please authenticate using Firebase Authentication and try again.";return new Ce(Se.UNAUTHENTICATED,n)}function PC(){return new Ce(Se.UNAUTHORIZED_APP,"This app does not have permission to access Firebase Storage on this project.")}function NC(n){return new Ce(Se.UNAUTHORIZED,"User does not have permission to access '"+n+"'.")}function kC(){return new Ce(Se.RETRY_LIMIT_EXCEEDED,"Max retry time for operation exceeded, please try again.")}function DC(){return new Ce(Se.CANCELED,"User canceled the upload/download.")}function xC(n){return new Ce(Se.INVALID_URL,"Invalid URL '"+n+"'.")}function VC(n){return new Ce(Se.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+n+"'.")}function OC(){return new Ce(Se.NO_DEFAULT_BUCKET,"No default bucket found. Did you set the '"+BI+"' property when initializing the app?")}function MC(){return new Ce(Se.CANNOT_SLICE_BLOB,"Cannot slice blob for upload. Please retry the upload.")}function LC(){return new Ce(Se.NO_DOWNLOAD_URL,"The given file does not have any download URLs.")}function FC(n){return new Ce(Se.UNSUPPORTED_ENVIRONMENT,`${n} is missing. Make sure to install the required polyfills. See https://firebase.google.com/docs/web/environments-js-sdk#polyfills for more information.`)}function Du(n){return new Ce(Se.INVALID_ARGUMENT,n)}function qI(){return new Ce(Se.APP_DELETED,"The Firebase app was deleted.")}function UC(n){return new Ce(Se.INVALID_ROOT_OPERATION,"The operation '"+n+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}function Ui(n,e){return new Ce(Se.INVALID_FORMAT,"String does not match format '"+n+"': "+e)}function yi(n){throw new Ce(Se.INTERNAL_ERROR,"Internal error: "+n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gt{constructor(e,t){this.bucket=e,this.path_=t}get path(){return this.path_}get isRoot(){return this.path.length===0}fullServerUrl(){const e=encodeURIComponent;return"/b/"+e(this.bucket)+"/o/"+e(this.path)}bucketOnlyServerUrl(){return"/b/"+encodeURIComponent(this.bucket)+"/o"}static makeFromBucketSpec(e,t){let r;try{r=gt.makeFromUrl(e,t)}catch{return new gt(e,"")}if(r.path==="")return r;throw VC(e)}static makeFromUrl(e,t){let r=null;const s="([A-Za-z0-9.\\-_]+)";function i($){$.path.charAt($.path.length-1)==="/"&&($.path_=$.path_.slice(0,-1))}const o="(/(.*))?$",a=new RegExp("^gs://"+s+o,"i"),l={bucket:1,path:3};function u($){$.path_=decodeURIComponent($.path)}const d="v[A-Za-z0-9_]+",f=t.replace(/[.]/g,"\\."),_="(/([^?#]*).*)?$",g=new RegExp(`^https?://${f}/${d}/b/${s}/o${_}`,"i"),v={bucket:1,path:3},C=t===UI?"(?:storage.googleapis.com|storage.cloud.google.com)":t,N="([^?#]*)",V=new RegExp(`^https?://${C}/${s}/${N}`,"i"),U=[{regex:a,indices:l,postModify:i},{regex:g,indices:v,postModify:u},{regex:V,indices:{bucket:1,path:2},postModify:u}];for(let $=0;$<U.length;$++){const se=U[$],Q=se.regex.exec(e);if(Q){const T=Q[se.indices.bucket];let y=Q[se.indices.path];y||(y=""),r=new gt(T,y),se.postModify(r);break}}if(r==null)throw xC(e);return r}}class BC{constructor(e){this.promise_=Promise.reject(e)}getPromise(){return this.promise_}cancel(e=!1){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function qC(n,e,t){let r=1,s=null,i=null,o=!1,a=0;function l(){return a===2}let u=!1;function d(...N){u||(u=!0,e.apply(null,N))}function f(N){s=setTimeout(()=>{s=null,n(g,l())},N)}function _(){i&&clearTimeout(i)}function g(N,...V){if(u){_();return}if(N){_(),d.call(null,N,...V);return}if(l()||o){_(),d.call(null,N,...V);return}r<64&&(r*=2);let U;a===1?(a=2,U=0):U=(r+Math.random())*1e3,f(U)}let v=!1;function C(N){v||(v=!0,_(),!u&&(s!==null?(N||(a=2),clearTimeout(s),f(0)):N||(a=1)))}return f(0),i=setTimeout(()=>{o=!0,C(!0)},t),C}function GC(n){n(!1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function zC(n){return n!==void 0}function $C(n){return typeof n=="object"&&!Array.isArray(n)}function ld(n){return typeof n=="string"||n instanceof String}function C_(n){return ud()&&n instanceof Blob}function ud(){return typeof Blob<"u"}function P_(n,e,t,r){if(r<e)throw Du(`Invalid value for '${n}'. Expected ${e} or greater.`);if(r>t)throw Du(`Invalid value for '${n}'. Expected ${t} or less.`)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Kc(n,e,t){let r=e;return t==null&&(r=`https://${e}`),`${t}://${r}/v0${n}`}function GI(n){const e=encodeURIComponent;let t="?";for(const r in n)if(n.hasOwnProperty(r)){const s=e(r)+"="+e(n[r]);t=t+s+"&"}return t=t.slice(0,-1),t}var gr;(function(n){n[n.NO_ERROR=0]="NO_ERROR",n[n.NETWORK_ERROR=1]="NETWORK_ERROR",n[n.ABORT=2]="ABORT"})(gr||(gr={}));/**
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
 */function jC(n,e){const t=n>=500&&n<600,s=[408,429].indexOf(n)!==-1,i=e.indexOf(n)!==-1;return t||s||i}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class WC{constructor(e,t,r,s,i,o,a,l,u,d,f,_=!0,g=!1){this.url_=e,this.method_=t,this.headers_=r,this.body_=s,this.successCodes_=i,this.additionalRetryCodes_=o,this.callback_=a,this.errorCallback_=l,this.timeout_=u,this.progressCallback_=d,this.connectionFactory_=f,this.retry=_,this.isUsingEmulator=g,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((v,C)=>{this.resolve_=v,this.reject_=C,this.start_()})}start_(){const e=(r,s)=>{if(s){r(!1,new ha(!1,null,!0));return}const i=this.connectionFactory_();this.pendingConnection_=i;const o=a=>{const l=a.loaded,u=a.lengthComputable?a.total:-1;this.progressCallback_!==null&&this.progressCallback_(l,u)};this.progressCallback_!==null&&i.addUploadProgressListener(o),i.send(this.url_,this.method_,this.isUsingEmulator,this.body_,this.headers_).then(()=>{this.progressCallback_!==null&&i.removeUploadProgressListener(o),this.pendingConnection_=null;const a=i.getErrorCode()===gr.NO_ERROR,l=i.getStatus();if(!a||jC(l,this.additionalRetryCodes_)&&this.retry){const d=i.getErrorCode()===gr.ABORT;r(!1,new ha(!1,null,d));return}const u=this.successCodes_.indexOf(l)!==-1;r(!0,new ha(u,i))})},t=(r,s)=>{const i=this.resolve_,o=this.reject_,a=s.connection;if(s.wasSuccessCode)try{const l=this.callback_(a,a.getResponse());zC(l)?i(l):i()}catch(l){o(l)}else if(a!==null){const l=cd();l.serverResponse=a.getErrorText(),this.errorCallback_?o(this.errorCallback_(a,l)):o(l)}else if(s.canceled){const l=this.appDelete_?qI():DC();o(l)}else{const l=kC();o(l)}};this.canceled_?t(!1,new ha(!1,null,!0)):this.backoffId_=qC(e,t,this.timeout_)}getPromise(){return this.promise_}cancel(e){this.canceled_=!0,this.appDelete_=e||!1,this.backoffId_!==null&&GC(this.backoffId_),this.pendingConnection_!==null&&this.pendingConnection_.abort()}}class ha{constructor(e,t,r){this.wasSuccessCode=e,this.connection=t,this.canceled=!!r}}function KC(n,e){e!==null&&e.length>0&&(n.Authorization="Firebase "+e)}function HC(n,e){n["X-Firebase-Storage-Version"]="webjs/"+(e??"AppManager")}function QC(n,e){e&&(n["X-Firebase-GMPID"]=e)}function YC(n,e){e!==null&&(n["X-Firebase-AppCheck"]=e)}function JC(n,e,t,r,s,i,o=!0,a=!1){const l=GI(n.urlParams),u=n.url+l,d=Object.assign({},n.headers);return QC(d,e),KC(d,t),HC(d,i),YC(d,r),new WC(u,n.method,d,n.body,n.successCodes,n.additionalRetryCodes,n.handler,n.errorHandler,n.timeout,n.progressCallback,s,o,a)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function XC(){return typeof BlobBuilder<"u"?BlobBuilder:typeof WebKitBlobBuilder<"u"?WebKitBlobBuilder:void 0}function ZC(...n){const e=XC();if(e!==void 0){const t=new e;for(let r=0;r<n.length;r++)t.append(n[r]);return t.getBlob()}else{if(ud())return new Blob(n);throw new Ce(Se.UNSUPPORTED_ENVIRONMENT,"This browser doesn't seem to support creating Blobs")}}function eP(n,e,t){return n.webkitSlice?n.webkitSlice(e,t):n.mozSlice?n.mozSlice(e,t):n.slice?n.slice(e,t):null}/**
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
 */function tP(n){if(typeof atob>"u")throw FC("base-64");return atob(n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mt={RAW:"raw",BASE64:"base64",BASE64URL:"base64url",DATA_URL:"data_url"};class zl{constructor(e,t){this.data=e,this.contentType=t||null}}function nP(n,e){switch(n){case Mt.RAW:return new zl(zI(e));case Mt.BASE64:case Mt.BASE64URL:return new zl($I(n,e));case Mt.DATA_URL:return new zl(sP(e),iP(e))}throw cd()}function zI(n){const e=[];for(let t=0;t<n.length;t++){let r=n.charCodeAt(t);if(r<=127)e.push(r);else if(r<=2047)e.push(192|r>>6,128|r&63);else if((r&64512)===55296)if(!(t<n.length-1&&(n.charCodeAt(t+1)&64512)===56320))e.push(239,191,189);else{const i=r,o=n.charCodeAt(++t);r=65536|(i&1023)<<10|o&1023,e.push(240|r>>18,128|r>>12&63,128|r>>6&63,128|r&63)}else(r&64512)===56320?e.push(239,191,189):e.push(224|r>>12,128|r>>6&63,128|r&63)}return new Uint8Array(e)}function rP(n){let e;try{e=decodeURIComponent(n)}catch{throw Ui(Mt.DATA_URL,"Malformed data URL.")}return zI(e)}function $I(n,e){switch(n){case Mt.BASE64:{const s=e.indexOf("-")!==-1,i=e.indexOf("_")!==-1;if(s||i)throw Ui(n,"Invalid character '"+(s?"-":"_")+"' found: is it base64url encoded?");break}case Mt.BASE64URL:{const s=e.indexOf("+")!==-1,i=e.indexOf("/")!==-1;if(s||i)throw Ui(n,"Invalid character '"+(s?"+":"/")+"' found: is it base64 encoded?");e=e.replace(/-/g,"+").replace(/_/g,"/");break}}let t;try{t=tP(e)}catch(s){throw s.message.includes("polyfill")?s:Ui(n,"Invalid character found")}const r=new Uint8Array(t.length);for(let s=0;s<t.length;s++)r[s]=t.charCodeAt(s);return r}class jI{constructor(e){this.base64=!1,this.contentType=null;const t=e.match(/^data:([^,]+)?,/);if(t===null)throw Ui(Mt.DATA_URL,"Must be formatted 'data:[<mediatype>][;base64],<data>");const r=t[1]||null;r!=null&&(this.base64=oP(r,";base64"),this.contentType=this.base64?r.substring(0,r.length-7):r),this.rest=e.substring(e.indexOf(",")+1)}}function sP(n){const e=new jI(n);return e.base64?$I(Mt.BASE64,e.rest):rP(e.rest)}function iP(n){return new jI(n).contentType}function oP(n,e){return n.length>=e.length?n.substring(n.length-e.length)===e:!1}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Tn{constructor(e,t){let r=0,s="";C_(e)?(this.data_=e,r=e.size,s=e.type):e instanceof ArrayBuffer?(t?this.data_=new Uint8Array(e):(this.data_=new Uint8Array(e.byteLength),this.data_.set(new Uint8Array(e))),r=this.data_.length):e instanceof Uint8Array&&(t?this.data_=e:(this.data_=new Uint8Array(e.length),this.data_.set(e)),r=e.length),this.size_=r,this.type_=s}size(){return this.size_}type(){return this.type_}slice(e,t){if(C_(this.data_)){const r=this.data_,s=eP(r,e,t);return s===null?null:new Tn(s)}else{const r=new Uint8Array(this.data_.buffer,e,t-e);return new Tn(r,!0)}}static getBlob(...e){if(ud()){const t=e.map(r=>r instanceof Tn?r.data_:r);return new Tn(ZC.apply(null,t))}else{const t=e.map(o=>ld(o)?nP(Mt.RAW,o).data:o.data_);let r=0;t.forEach(o=>{r+=o.byteLength});const s=new Uint8Array(r);let i=0;return t.forEach(o=>{for(let a=0;a<o.length;a++)s[i++]=o[a]}),new Tn(s,!0)}}uploadData(){return this.data_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function WI(n){let e;try{e=JSON.parse(n)}catch{return null}return $C(e)?e:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function aP(n){if(n.length===0)return null;const e=n.lastIndexOf("/");return e===-1?"":n.slice(0,e)}function cP(n,e){const t=e.split("/").filter(r=>r.length>0).join("/");return n.length===0?t:n+"/"+t}function KI(n){const e=n.lastIndexOf("/",n.length-2);return e===-1?n:n.slice(e+1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function lP(n,e){return e}class tt{constructor(e,t,r,s){this.server=e,this.local=t||e,this.writable=!!r,this.xform=s||lP}}let da=null;function uP(n){return!ld(n)||n.length<2?n:KI(n)}function HI(){if(da)return da;const n=[];n.push(new tt("bucket")),n.push(new tt("generation")),n.push(new tt("metageneration")),n.push(new tt("name","fullPath",!0));function e(i,o){return uP(o)}const t=new tt("name");t.xform=e,n.push(t);function r(i,o){return o!==void 0?Number(o):o}const s=new tt("size");return s.xform=r,n.push(s),n.push(new tt("timeCreated")),n.push(new tt("updated")),n.push(new tt("md5Hash",null,!0)),n.push(new tt("cacheControl",null,!0)),n.push(new tt("contentDisposition",null,!0)),n.push(new tt("contentEncoding",null,!0)),n.push(new tt("contentLanguage",null,!0)),n.push(new tt("contentType",null,!0)),n.push(new tt("metadata","customMetadata",!0)),da=n,da}function hP(n,e){function t(){const r=n.bucket,s=n.fullPath,i=new gt(r,s);return e._makeStorageReference(i)}Object.defineProperty(n,"ref",{get:t})}function dP(n,e,t){const r={};r.type="file";const s=t.length;for(let i=0;i<s;i++){const o=t[i];r[o.local]=o.xform(r,e[o.server])}return hP(r,n),r}function QI(n,e,t){const r=WI(e);return r===null?null:dP(n,r,t)}function fP(n,e,t,r){const s=WI(e);if(s===null||!ld(s.downloadTokens))return null;const i=s.downloadTokens;if(i.length===0)return null;const o=encodeURIComponent;return i.split(",").map(u=>{const d=n.bucket,f=n.fullPath,_="/b/"+o(d)+"/o/"+o(f),g=Kc(_,t,r),v=GI({alt:"media",token:u});return g+v})[0]}function pP(n,e){const t={},r=e.length;for(let s=0;s<r;s++){const i=e[s];i.writable&&(t[i.server]=n[i.local])}return JSON.stringify(t)}class hd{constructor(e,t,r,s){this.url=e,this.method=t,this.handler=r,this.timeout=s,this.urlParams={},this.headers={},this.body=null,this.errorHandler=null,this.progressCallback=null,this.successCodes=[200],this.additionalRetryCodes=[]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function YI(n){if(!n)throw cd()}function _P(n,e){function t(r,s){const i=QI(n,s,e);return YI(i!==null),i}return t}function mP(n,e){function t(r,s){const i=QI(n,s,e);return YI(i!==null),fP(i,s,n.host,n._protocol)}return t}function JI(n){function e(t,r){let s;return t.getStatus()===401?t.getErrorText().includes("Firebase App Check token is invalid")?s=PC():s=CC():t.getStatus()===402?s=SC(n.bucket):t.getStatus()===403?s=NC(n.path):s=r,s.status=t.getStatus(),s.serverResponse=r.serverResponse,s}return e}function XI(n){const e=JI(n);function t(r,s){let i=e(r,s);return r.getStatus()===404&&(i=RC(n.path)),i.serverResponse=s.serverResponse,i}return t}function gP(n,e,t){const r=e.fullServerUrl(),s=Kc(r,n.host,n._protocol),i="GET",o=n.maxOperationRetryTime,a=new hd(s,i,mP(n,t),o);return a.errorHandler=XI(e),a}function yP(n,e){const t=e.fullServerUrl(),r=Kc(t,n.host,n._protocol),s="DELETE",i=n.maxOperationRetryTime;function o(l,u){}const a=new hd(r,s,o,i);return a.successCodes=[200,204],a.errorHandler=XI(e),a}function IP(n,e){return n&&n.contentType||e&&e.type()||"application/octet-stream"}function EP(n,e,t){const r=Object.assign({},t);return r.fullPath=n.path,r.size=e.size(),r.contentType||(r.contentType=IP(null,e)),r}function TP(n,e,t,r,s){const i=e.bucketOnlyServerUrl(),o={"X-Goog-Upload-Protocol":"multipart"};function a(){let U="";for(let $=0;$<2;$++)U=U+Math.random().toString().slice(2);return U}const l=a();o["Content-Type"]="multipart/related; boundary="+l;const u=EP(e,r,s),d=pP(u,t),f="--"+l+`\r
Content-Type: application/json; charset=utf-8\r
\r
`+d+`\r
--`+l+`\r
Content-Type: `+u.contentType+`\r
\r
`,_=`\r
--`+l+"--",g=Tn.getBlob(f,r,_);if(g===null)throw MC();const v={name:u.fullPath},C=Kc(i,n.host,n._protocol),N="POST",V=n.maxUploadRetryTime,B=new hd(C,N,_P(n,t),V);return B.urlParams=v,B.headers=o,B.body=g.uploadData(),B.errorHandler=JI(e),B}class wP{constructor(){this.sent_=!1,this.xhr_=new XMLHttpRequest,this.initXhr(),this.errorCode_=gr.NO_ERROR,this.sendPromise_=new Promise(e=>{this.xhr_.addEventListener("abort",()=>{this.errorCode_=gr.ABORT,e()}),this.xhr_.addEventListener("error",()=>{this.errorCode_=gr.NETWORK_ERROR,e()}),this.xhr_.addEventListener("load",()=>{e()})})}send(e,t,r,s,i){if(this.sent_)throw yi("cannot .send() more than once");if(wt(e)&&r&&(this.xhr_.withCredentials=!0),this.sent_=!0,this.xhr_.open(t,e,!0),i!==void 0)for(const o in i)i.hasOwnProperty(o)&&this.xhr_.setRequestHeader(o,i[o].toString());return s!==void 0?this.xhr_.send(s):this.xhr_.send(),this.sendPromise_}getErrorCode(){if(!this.sent_)throw yi("cannot .getErrorCode() before sending");return this.errorCode_}getStatus(){if(!this.sent_)throw yi("cannot .getStatus() before sending");try{return this.xhr_.status}catch{return-1}}getResponse(){if(!this.sent_)throw yi("cannot .getResponse() before sending");return this.xhr_.response}getErrorText(){if(!this.sent_)throw yi("cannot .getErrorText() before sending");return this.xhr_.statusText}abort(){this.xhr_.abort()}getResponseHeader(e){return this.xhr_.getResponseHeader(e)}addUploadProgressListener(e){this.xhr_.upload!=null&&this.xhr_.upload.addEventListener("progress",e)}removeUploadProgressListener(e){this.xhr_.upload!=null&&this.xhr_.upload.removeEventListener("progress",e)}}class vP extends wP{initXhr(){this.xhr_.responseType="text"}}function dd(){return new vP}/**
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
 */class Sr{constructor(e,t){this._service=e,t instanceof gt?this._location=t:this._location=gt.makeFromUrl(t,e.host)}toString(){return"gs://"+this._location.bucket+"/"+this._location.path}_newRef(e,t){return new Sr(e,t)}get root(){const e=new gt(this._location.bucket,"");return this._newRef(this._service,e)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return KI(this._location.path)}get storage(){return this._service}get parent(){const e=aP(this._location.path);if(e===null)return null;const t=new gt(this._location.bucket,e);return new Sr(this._service,t)}_throwIfRoot(e){if(this._location.path==="")throw UC(e)}}function AP(n,e,t){n._throwIfRoot("uploadBytes");const r=TP(n.storage,n._location,HI(),new Tn(e,!0),t);return n.storage.makeRequestWithTokens(r,dd).then(s=>({metadata:s,ref:n}))}function bP(n){n._throwIfRoot("getDownloadURL");const e=gP(n.storage,n._location,HI());return n.storage.makeRequestWithTokens(e,dd).then(t=>{if(t===null)throw LC();return t})}function RP(n){n._throwIfRoot("deleteObject");const e=yP(n.storage,n._location);return n.storage.makeRequestWithTokens(e,dd)}function SP(n,e){const t=cP(n._location.path,e),r=new gt(n._location.bucket,t);return new Sr(n.storage,r)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function CP(n){return/^[A-Za-z]+:\/\//.test(n)}function PP(n,e){return new Sr(n,e)}function ZI(n,e){if(n instanceof fd){const t=n;if(t._bucket==null)throw OC();const r=new Sr(t,t._bucket);return e!=null?ZI(r,e):r}else return e!==void 0?SP(n,e):n}function NP(n,e){if(e&&CP(e)){if(n instanceof fd)return PP(n,e);throw Du("To use ref(service, url), the first argument must be a Storage instance.")}else return ZI(n,e)}function N_(n,e){const t=e==null?void 0:e[BI];return t==null?null:gt.makeFromBucketSpec(t,n)}function kP(n,e,t,r={}){n.host=`${e}:${t}`;const s=wt(e);s&&(yo(`https://${n.host}/b`),mc("Storage",!0)),n._isUsingEmulator=!0,n._protocol=s?"https":"http";const{mockUserToken:i}=r;i&&(n._overrideAuthToken=typeof i=="string"?i:Xu(i,n.app.options.projectId))}class fd{constructor(e,t,r,s,i,o=!1){this.app=e,this._authProvider=t,this._appCheckProvider=r,this._url=s,this._firebaseVersion=i,this._isUsingEmulator=o,this._bucket=null,this._host=UI,this._protocol="https",this._appId=null,this._deleted=!1,this._maxOperationRetryTime=AC,this._maxUploadRetryTime=bC,this._requests=new Set,s!=null?this._bucket=gt.makeFromBucketSpec(s,this._host):this._bucket=N_(this._host,this.app.options)}get host(){return this._host}set host(e){this._host=e,this._url!=null?this._bucket=gt.makeFromBucketSpec(this._url,e):this._bucket=N_(e,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(e){P_("time",0,Number.POSITIVE_INFINITY,e),this._maxUploadRetryTime=e}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(e){P_("time",0,Number.POSITIVE_INFINITY,e),this._maxOperationRetryTime=e}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;const e=this._authProvider.getImmediate({optional:!0});if(e){const t=await e.getToken();if(t!==null)return t.accessToken}return null}async _getAppCheckToken(){if(xt(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=this._appCheckProvider.getImmediate({optional:!0});return e?(await e.getToken()).token:null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(e=>e.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(e){return new Sr(this,e)}_makeRequest(e,t,r,s,i=!0){if(this._deleted)return new BC(qI());{const o=JC(e,this._appId,r,s,t,this._firebaseVersion,i,this._isUsingEmulator);return this._requests.add(o),o.getPromise().then(()=>this._requests.delete(o),()=>this._requests.delete(o)),o}}async makeRequestWithTokens(e,t){const[r,s]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(e,t,r,s).getPromise()}}const k_="@firebase/storage",D_="0.14.0";/**
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
 */const eE="storage";function cx(n,e,t){return n=te(n),AP(n,e,t)}function lx(n){return n=te(n),bP(n)}function ux(n){return n=te(n),RP(n)}function hx(n,e){return n=te(n),NP(n,e)}function DP(n=Ic(),e){n=te(n);const r=Vs(n,eE).getImmediate({identifier:e}),s=_c("storage");return s&&xP(r,...s),r}function xP(n,e,t,r={}){kP(n,e,t,r)}function VP(n,{instanceIdentifier:e}){const t=n.getProvider("app").getImmediate(),r=n.getProvider("auth-internal"),s=n.getProvider("app-check-internal");return new fd(t,r,s,e,Os)}function OP(){Zt(new Bt(eE,VP,"PUBLIC").setMultipleInstances(!0)),ut(k_,D_,""),ut(k_,D_,"esm2020")}OP();/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const MP="type.googleapis.com/google.protobuf.Int64Value",LP="type.googleapis.com/google.protobuf.UInt64Value";function tE(n,e){const t={};for(const r in n)n.hasOwnProperty(r)&&(t[r]=e(n[r]));return t}function Qa(n){if(n==null)return null;if(n instanceof Number&&(n=n.valueOf()),typeof n=="number"&&isFinite(n)||n===!0||n===!1||Object.prototype.toString.call(n)==="[object String]")return n;if(n instanceof Date)return n.toISOString();if(Array.isArray(n))return n.map(e=>Qa(e));if(typeof n=="function"||typeof n=="object")return tE(n,e=>Qa(e));throw new Error("Data cannot be encoded in JSON: "+n)}function Cs(n){if(n==null)return n;if(n["@type"])switch(n["@type"]){case MP:case LP:{const e=Number(n.value);if(isNaN(e))throw new Error("Data cannot be decoded from JSON: "+n);return e}default:throw new Error("Data cannot be decoded from JSON: "+n)}return Array.isArray(n)?n.map(e=>Cs(e)):typeof n=="function"||typeof n=="object"?tE(n,e=>Cs(e)):n}/**
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
 */const pd="functions";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const x_={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class ct extends zt{constructor(e,t,r){super(`${pd}/${e}`,t||""),this.details=r,Object.setPrototypeOf(this,ct.prototype)}}function FP(n){if(n>=200&&n<300)return"ok";switch(n){case 0:return"internal";case 400:return"invalid-argument";case 401:return"unauthenticated";case 403:return"permission-denied";case 404:return"not-found";case 409:return"aborted";case 429:return"resource-exhausted";case 499:return"cancelled";case 500:return"internal";case 501:return"unimplemented";case 503:return"unavailable";case 504:return"deadline-exceeded"}return"unknown"}function Ya(n,e){let t=FP(n),r=t,s;try{const i=e&&e.error;if(i){const o=i.status;if(typeof o=="string"){if(!x_[o])return new ct("internal","internal");t=x_[o],r=o}const a=i.message;typeof a=="string"&&(r=a),s=i.details,s!==void 0&&(s=Cs(s))}}catch{}return t==="ok"?null:new ct(t,r,s)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class UP{constructor(e,t,r,s){this.app=e,this.auth=null,this.messaging=null,this.appCheck=null,this.serverAppAppCheckToken=null,xt(e)&&e.settings.appCheckToken&&(this.serverAppAppCheckToken=e.settings.appCheckToken),this.auth=t.getImmediate({optional:!0}),this.messaging=r.getImmediate({optional:!0}),this.auth||t.get().then(i=>this.auth=i,()=>{}),this.messaging||r.get().then(i=>this.messaging=i,()=>{}),this.appCheck||s==null||s.get().then(i=>this.appCheck=i,()=>{})}async getAuthToken(){if(this.auth)try{const e=await this.auth.getToken();return e==null?void 0:e.accessToken}catch{return}}async getMessagingToken(){if(!(!this.messaging||!("Notification"in self)||Notification.permission!=="granted"))try{return await this.messaging.getToken()}catch{return}}async getAppCheckToken(e){if(this.serverAppAppCheckToken)return this.serverAppAppCheckToken;if(this.appCheck){const t=e?await this.appCheck.getLimitedUseToken():await this.appCheck.getToken();return t.error?null:t.token}return null}async getContext(e){const t=await this.getAuthToken(),r=await this.getMessagingToken(),s=await this.getAppCheckToken(e);return{authToken:t,messagingToken:r,appCheckToken:s}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xu="us-central1",BP=/^data: (.*?)(?:\n|$)/;function qP(n){let e=null;return{promise:new Promise((t,r)=>{e=setTimeout(()=>{r(new ct("deadline-exceeded","deadline-exceeded"))},n)}),cancel:()=>{e&&clearTimeout(e)}}}class GP{constructor(e,t,r,s,i=xu,o=(...a)=>fetch(...a)){this.app=e,this.fetchImpl=o,this.emulatorOrigin=null,this.contextProvider=new UP(e,t,r,s),this.cancelAllRequests=new Promise(a=>{this.deleteService=()=>Promise.resolve(a())});try{const a=new URL(i);this.customDomain=a.origin+(a.pathname==="/"?"":a.pathname),this.region=xu}catch{this.customDomain=null,this.region=i}}_delete(){return this.deleteService()}_url(e){const t=this.app.options.projectId;return this.emulatorOrigin!==null?`${this.emulatorOrigin}/${t}/${this.region}/${e}`:this.customDomain!==null?`${this.customDomain}/${e}`:`https://${this.region}-${t}.cloudfunctions.net/${e}`}}function zP(n,e,t){const r=wt(e);n.emulatorOrigin=`http${r?"s":""}://${e}:${t}`,r&&(yo(n.emulatorOrigin+"/backends"),mc("Functions",!0))}function $P(n,e,t){const r=s=>WP(n,e,s,{});return r.stream=(s,i)=>HP(n,e,s,i),r}function nE(n){return n.emulatorOrigin&&wt(n.emulatorOrigin)?"include":void 0}async function jP(n,e,t,r,s){t["Content-Type"]="application/json";let i;try{i=await r(n,{method:"POST",body:JSON.stringify(e),headers:t,credentials:nE(s)})}catch{return{status:0,json:null}}let o=null;try{o=await i.json()}catch{}return{status:i.status,json:o}}async function rE(n,e){const t={},r=await n.contextProvider.getContext(e.limitedUseAppCheckTokens);return r.authToken&&(t.Authorization="Bearer "+r.authToken),r.messagingToken&&(t["Firebase-Instance-ID-Token"]=r.messagingToken),r.appCheckToken!==null&&(t["X-Firebase-AppCheck"]=r.appCheckToken),t}function WP(n,e,t,r){const s=n._url(e);return KP(n,s,t,r)}async function KP(n,e,t,r){t=Qa(t);const s={data:t},i=await rE(n,r),o=r.timeout||7e4,a=qP(o),l=await Promise.race([jP(e,s,i,n.fetchImpl,n),a.promise,n.cancelAllRequests]);if(a.cancel(),!l)throw new ct("cancelled","Firebase Functions instance was deleted.");const u=Ya(l.status,l.json);if(u)throw u;if(!l.json)throw new ct("internal","Response is not valid JSON object.");let d=l.json.data;if(typeof d>"u"&&(d=l.json.result),typeof d>"u")throw new ct("internal","Response is missing data field.");return{data:Cs(d)}}function HP(n,e,t,r){const s=n._url(e);return QP(n,s,t,r||{})}async function QP(n,e,t,r){var _;t=Qa(t);const s={data:t},i=await rE(n,r);i["Content-Type"]="application/json",i.Accept="text/event-stream";let o;try{o=await n.fetchImpl(e,{method:"POST",body:JSON.stringify(s),headers:i,signal:r==null?void 0:r.signal,credentials:nE(n)})}catch(g){if(g instanceof Error&&g.name==="AbortError"){const C=new ct("cancelled","Request was cancelled.");return{data:Promise.reject(C),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(C)}}}}}}const v=Ya(0,null);return{data:Promise.reject(v),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(v)}}}}}}let a,l;const u=new Promise((g,v)=>{a=g,l=v});(_=r==null?void 0:r.signal)==null||_.addEventListener("abort",()=>{const g=new ct("cancelled","Request was cancelled.");l(g)});const d=o.body.getReader(),f=YP(d,a,l,r==null?void 0:r.signal);return{stream:{[Symbol.asyncIterator](){const g=f.getReader();return{async next(){const{value:v,done:C}=await g.read();return{value:v,done:C}},async return(){return await g.cancel(),{done:!0,value:void 0}}}}},data:u}}function YP(n,e,t,r){const s=(o,a)=>{const l=o.match(BP);if(!l)return;const u=l[1];try{const d=JSON.parse(u);if("result"in d){e(Cs(d.result));return}if("message"in d){a.enqueue(Cs(d.message));return}if("error"in d){const f=Ya(0,d);a.error(f),t(f);return}}catch(d){if(d instanceof ct){a.error(d),t(d);return}}},i=new TextDecoder;return new ReadableStream({start(o){let a="";return l();async function l(){if(r!=null&&r.aborted){const u=new ct("cancelled","Request was cancelled");return o.error(u),t(u),Promise.resolve()}try{const{value:u,done:d}=await n.read();if(d){a.trim()&&s(a.trim(),o),o.close();return}if(r!=null&&r.aborted){const _=new ct("cancelled","Request was cancelled");o.error(_),t(_),await n.cancel();return}a+=i.decode(u,{stream:!0});const f=a.split(`
`);a=f.pop()||"";for(const _ of f)_.trim()&&s(_.trim(),o);return l()}catch(u){const d=u instanceof ct?u:Ya(0,null);o.error(d),t(d)}}},cancel(){return n.cancel()}})}const V_="@firebase/functions",O_="0.13.1";/**
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
 */const JP="auth-internal",XP="app-check-internal",ZP="messaging-internal";function eN(n){const e=(t,{instanceIdentifier:r})=>{const s=t.getProvider("app").getImmediate(),i=t.getProvider(JP),o=t.getProvider(ZP),a=t.getProvider(XP);return new GP(s,i,o,a,r)};Zt(new Bt(pd,e,"PUBLIC").setMultipleInstances(!0)),ut(V_,O_,n),ut(V_,O_,"esm2020")}/**
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
 */function tN(n=Ic(),e=xu){const r=Vs(te(n),pd).getImmediate({identifier:e}),s=_c("functions");return s&&nN(r,...s),r}function nN(n,e,t){zP(te(n),e,t)}function dx(n,e,t){return $P(te(n),e)}eN();var M_={};const L_="@firebase/database",F_="1.1.0";/**
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
 */let sE="";function rN(n){sE=n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sN{constructor(e){this.domStorage_=e,this.prefix_="firebase:"}set(e,t){t==null?this.domStorage_.removeItem(this.prefixedName_(e)):this.domStorage_.setItem(this.prefixedName_(e),Me(t))}get(e){const t=this.domStorage_.getItem(this.prefixedName_(e));return t==null?null:Ki(t)}remove(e){this.domStorage_.removeItem(this.prefixedName_(e))}prefixedName_(e){return this.prefix_+e}toString(){return this.domStorage_.toString()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class iN{constructor(){this.cache_={},this.isInMemoryStorage=!0}set(e,t){t==null?delete this.cache_[e]:this.cache_[e]=t}get(e){return $t(this.cache_,e)?this.cache_[e]:null}remove(e){delete this.cache_[e]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const iE=function(n){try{if(typeof window<"u"&&typeof window[n]<"u"){const e=window[n];return e.setItem("firebase:sentinel","cache"),e.removeItem("firebase:sentinel"),new sN(e)}}catch{}return new iN},hr=iE("localStorage"),oN=iE("sessionStorage");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ts=new yc("@firebase/database"),aN=(function(){let n=1;return function(){return n++}})(),oE=function(n){const e=Dw(n),t=new Cw;t.update(e);const r=t.digest();return Ju.encodeByteArray(r)},Vo=function(...n){let e="";for(let t=0;t<n.length;t++){const r=n[t];Array.isArray(r)||r&&typeof r=="object"&&typeof r.length=="number"?e+=Vo.apply(null,r):typeof r=="object"?e+=Me(r):e+=r,e+=" "}return e};let Bi=null,U_=!0;const cN=function(n,e){O(!0,"Can't turn on custom loggers persistently."),ts.logLevel=ne.VERBOSE,Bi=ts.log.bind(ts)},je=function(...n){if(U_===!0&&(U_=!1,Bi===null&&oN.get("logging_enabled")===!0&&cN()),Bi){const e=Vo.apply(null,n);Bi(e)}},Oo=function(n){return function(...e){je(n,...e)}},Vu=function(...n){const e="FIREBASE INTERNAL ERROR: "+Vo(...n);ts.error(e)},nn=function(...n){const e=`FIREBASE FATAL ERROR: ${Vo(...n)}`;throw ts.error(e),new Error(e)},ft=function(...n){const e="FIREBASE WARNING: "+Vo(...n);ts.warn(e)},lN=function(){typeof window<"u"&&window.location&&window.location.protocol&&window.location.protocol.indexOf("https:")!==-1&&ft("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().")},Hc=function(n){return typeof n=="number"&&(n!==n||n===Number.POSITIVE_INFINITY||n===Number.NEGATIVE_INFINITY)},uN=function(n){if(document.readyState==="complete")n();else{let e=!1;const t=function(){if(!document.body){setTimeout(t,Math.floor(10));return}e||(e=!0,n())};document.addEventListener?(document.addEventListener("DOMContentLoaded",t,!1),window.addEventListener("load",t,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",()=>{document.readyState==="complete"&&t()}),window.attachEvent("onload",t))}},Ps="[MIN_NAME]",Cr="[MAX_NAME]",Mr=function(n,e){if(n===e)return 0;if(n===Ps||e===Cr)return-1;if(e===Ps||n===Cr)return 1;{const t=B_(n),r=B_(e);return t!==null?r!==null?t-r===0?n.length-e.length:t-r:-1:r!==null?1:n<e?-1:1}},hN=function(n,e){return n===e?0:n<e?-1:1},Ii=function(n,e){if(e&&n in e)return e[n];throw new Error("Missing required key ("+n+") in object: "+Me(e))},_d=function(n){if(typeof n!="object"||n===null)return Me(n);const e=[];for(const r in n)e.push(r);e.sort();let t="{";for(let r=0;r<e.length;r++)r!==0&&(t+=","),t+=Me(e[r]),t+=":",t+=_d(n[e[r]]);return t+="}",t},aE=function(n,e){const t=n.length;if(t<=e)return[n];const r=[];for(let s=0;s<t;s+=e)s+e>t?r.push(n.substring(s,t)):r.push(n.substring(s,s+e));return r};function Xe(n,e){for(const t in n)n.hasOwnProperty(t)&&e(t,n[t])}const cE=function(n){O(!Hc(n),"Invalid JSON number");const e=11,t=52,r=(1<<e-1)-1;let s,i,o,a,l;n===0?(i=0,o=0,s=1/n===-1/0?1:0):(s=n<0,n=Math.abs(n),n>=Math.pow(2,1-r)?(a=Math.min(Math.floor(Math.log(n)/Math.LN2),r),i=a+r,o=Math.round(n*Math.pow(2,t-a)-Math.pow(2,t))):(i=0,o=Math.round(n/Math.pow(2,1-r-t))));const u=[];for(l=t;l;l-=1)u.push(o%2?1:0),o=Math.floor(o/2);for(l=e;l;l-=1)u.push(i%2?1:0),i=Math.floor(i/2);u.push(s?1:0),u.reverse();const d=u.join("");let f="";for(l=0;l<64;l+=8){let _=parseInt(d.substr(l,8),2).toString(16);_.length===1&&(_="0"+_),f=f+_}return f.toLowerCase()},dN=function(){return!!(typeof window=="object"&&window.chrome&&window.chrome.extension&&!/^chrome/.test(window.location.href))},fN=function(){return typeof Windows=="object"&&typeof Windows.UI=="object"};function pN(n,e){let t="Unknown Error";n==="too_big"?t="The data requested exceeds the maximum size that can be accessed with a single request.":n==="permission_denied"?t="Client doesn't have permission to access the desired data.":n==="unavailable"&&(t="The service is unavailable");const r=new Error(n+" at "+e._path.toString()+": "+t);return r.code=n.toUpperCase(),r}const _N=new RegExp("^-?(0*)\\d{1,10}$"),mN=-2147483648,gN=2147483647,B_=function(n){if(_N.test(n)){const e=Number(n);if(e>=mN&&e<=gN)return e}return null},Hs=function(n){try{n()}catch(e){setTimeout(()=>{const t=e.stack||"";throw ft("Exception was thrown by user callback.",t),e},Math.floor(0))}},yN=function(){return(typeof window=="object"&&window.navigator&&window.navigator.userAgent||"").search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i)>=0},qi=function(n,e){const t=setTimeout(n,e);return typeof t=="number"&&typeof Deno<"u"&&Deno.unrefTimer?Deno.unrefTimer(t):typeof t=="object"&&t.unref&&t.unref(),t};/**
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
 */class IN{constructor(e,t){this.appCheckProvider=t,this.appName=e.name,xt(e)&&e.settings.appCheckToken&&(this.serverAppAppCheckToken=e.settings.appCheckToken),this.appCheck=t==null?void 0:t.getImmediate({optional:!0}),this.appCheck||t==null||t.get().then(r=>this.appCheck=r)}getToken(e){if(this.serverAppAppCheckToken){if(e)throw new Error("Attempted reuse of `FirebaseServerApp.appCheckToken` after previous usage failed.");return Promise.resolve({token:this.serverAppAppCheckToken})}return this.appCheck?this.appCheck.getToken(e):new Promise((t,r)=>{setTimeout(()=>{this.appCheck?this.getToken(e).then(t,r):t(null)},0)})}addTokenChangeListener(e){var t;(t=this.appCheckProvider)==null||t.get().then(r=>r.addTokenListener(e))}notifyForInvalidToken(){ft(`Provided AppCheck credentials for the app named "${this.appName}" are invalid. This usually indicates your app was not initialized correctly.`)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class EN{constructor(e,t,r){this.appName_=e,this.firebaseOptions_=t,this.authProvider_=r,this.auth_=null,this.auth_=r.getImmediate({optional:!0}),this.auth_||r.onInit(s=>this.auth_=s)}getToken(e){return this.auth_?this.auth_.getToken(e).catch(t=>t&&t.code==="auth/token-not-initialized"?(je("Got auth/token-not-initialized error.  Treating as null token."),null):Promise.reject(t)):new Promise((t,r)=>{setTimeout(()=>{this.auth_?this.getToken(e).then(t,r):t(null)},0)})}addTokenChangeListener(e){this.auth_?this.auth_.addAuthTokenListener(e):this.authProvider_.get().then(t=>t.addAuthTokenListener(e))}removeTokenChangeListener(e){this.authProvider_.get().then(t=>t.removeAuthTokenListener(e))}notifyForInvalidToken(){let e='Provided authentication credentials for the app named "'+this.appName_+'" are invalid. This usually indicates your app was not initialized correctly. ';"credential"in this.firebaseOptions_?e+='Make sure the "credential" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':"serviceAccount"in this.firebaseOptions_?e+='Make sure the "serviceAccount" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':e+='Make sure the "apiKey" and "databaseURL" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.',ft(e)}}class Ra{constructor(e){this.accessToken=e}getToken(e){return Promise.resolve({accessToken:this.accessToken})}addTokenChangeListener(e){e(this.accessToken)}removeTokenChangeListener(e){}notifyForInvalidToken(){}}Ra.OWNER="owner";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const md="5",lE="v",uE="s",hE="r",dE="f",fE=/(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/,pE="ls",_E="p",Ou="ac",mE="websocket",gE="long_polling";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yE{constructor(e,t,r,s,i=!1,o="",a=!1,l=!1,u=null){this.secure=t,this.namespace=r,this.webSocketOnly=s,this.nodeAdmin=i,this.persistenceKey=o,this.includeNamespaceInQueryParams=a,this.isUsingEmulator=l,this.emulatorOptions=u,this._host=e.toLowerCase(),this._domain=this._host.substr(this._host.indexOf(".")+1),this.internalHost=hr.get("host:"+e)||this._host}isCacheableHost(){return this.internalHost.substr(0,2)==="s-"}isCustomHost(){return this._domain!=="firebaseio.com"&&this._domain!=="firebaseio-demo.com"}get host(){return this._host}set host(e){e!==this.internalHost&&(this.internalHost=e,this.isCacheableHost()&&hr.set("host:"+this._host,this.internalHost))}toString(){let e=this.toURLString();return this.persistenceKey&&(e+="<"+this.persistenceKey+">"),e}toURLString(){const e=this.secure?"https://":"http://",t=this.includeNamespaceInQueryParams?`?ns=${this.namespace}`:"";return`${e}${this.host}/${t}`}}function TN(n){return n.host!==n.internalHost||n.isCustomHost()||n.includeNamespaceInQueryParams}function IE(n,e,t){O(typeof e=="string","typeof type must == string"),O(typeof t=="object","typeof params must == object");let r;if(e===mE)r=(n.secure?"wss://":"ws://")+n.internalHost+"/.ws?";else if(e===gE)r=(n.secure?"https://":"http://")+n.internalHost+"/.lp?";else throw new Error("Unknown connection type: "+e);TN(n)&&(t.ns=n.namespace);const s=[];return Xe(t,(i,o)=>{s.push(i+"="+o)}),r+s.join("&")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wN{constructor(){this.counters_={}}incrementCounter(e,t=1){$t(this.counters_,e)||(this.counters_[e]=0),this.counters_[e]+=t}get(){return uw(this.counters_)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $l={},jl={};function gd(n){const e=n.toString();return $l[e]||($l[e]=new wN),$l[e]}function vN(n,e){const t=n.toString();return jl[t]||(jl[t]=e()),jl[t]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class AN{constructor(e){this.onMessage_=e,this.pendingResponses=[],this.currentResponseNum=0,this.closeAfterResponse=-1,this.onClose=null}closeAfter(e,t){this.closeAfterResponse=e,this.onClose=t,this.closeAfterResponse<this.currentResponseNum&&(this.onClose(),this.onClose=null)}handleResponse(e,t){for(this.pendingResponses[e]=t;this.pendingResponses[this.currentResponseNum];){const r=this.pendingResponses[this.currentResponseNum];delete this.pendingResponses[this.currentResponseNum];for(let s=0;s<r.length;++s)r[s]&&Hs(()=>{this.onMessage_(r[s])});if(this.currentResponseNum===this.closeAfterResponse){this.onClose&&(this.onClose(),this.onClose=null);break}this.currentResponseNum++}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const q_="start",bN="close",RN="pLPCommand",SN="pRTLPCB",EE="id",TE="pw",wE="ser",CN="cb",PN="seg",NN="ts",kN="d",DN="dframe",vE=1870,AE=30,xN=vE-AE,VN=25e3,ON=3e4;class Xr{constructor(e,t,r,s,i,o,a){this.connId=e,this.repoInfo=t,this.applicationId=r,this.appCheckToken=s,this.authToken=i,this.transportSessionId=o,this.lastSessionId=a,this.bytesSent=0,this.bytesReceived=0,this.everConnected_=!1,this.log_=Oo(e),this.stats_=gd(t),this.urlFn=l=>(this.appCheckToken&&(l[Ou]=this.appCheckToken),IE(t,gE,l))}open(e,t){this.curSegmentNum=0,this.onDisconnect_=t,this.myPacketOrderer=new AN(e),this.isClosed_=!1,this.connectTimeoutTimer_=setTimeout(()=>{this.log_("Timed out trying to connect."),this.onClosed_(),this.connectTimeoutTimer_=null},Math.floor(ON)),uN(()=>{if(this.isClosed_)return;this.scriptTagHolder=new yd((...i)=>{const[o,a,l,u,d]=i;if(this.incrementIncomingBytes_(i),!!this.scriptTagHolder)if(this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null),this.everConnected_=!0,o===q_)this.id=a,this.password=l;else if(o===bN)a?(this.scriptTagHolder.sendNewPolls=!1,this.myPacketOrderer.closeAfter(a,()=>{this.onClosed_()})):this.onClosed_();else throw new Error("Unrecognized command received: "+o)},(...i)=>{const[o,a]=i;this.incrementIncomingBytes_(i),this.myPacketOrderer.handleResponse(o,a)},()=>{this.onClosed_()},this.urlFn);const r={};r[q_]="t",r[wE]=Math.floor(Math.random()*1e8),this.scriptTagHolder.uniqueCallbackIdentifier&&(r[CN]=this.scriptTagHolder.uniqueCallbackIdentifier),r[lE]=md,this.transportSessionId&&(r[uE]=this.transportSessionId),this.lastSessionId&&(r[pE]=this.lastSessionId),this.applicationId&&(r[_E]=this.applicationId),this.appCheckToken&&(r[Ou]=this.appCheckToken),typeof location<"u"&&location.hostname&&fE.test(location.hostname)&&(r[hE]=dE);const s=this.urlFn(r);this.log_("Connecting via long-poll to "+s),this.scriptTagHolder.addTag(s,()=>{})})}start(){this.scriptTagHolder.startLongPoll(this.id,this.password),this.addDisconnectPingFrame(this.id,this.password)}static forceAllow(){Xr.forceAllow_=!0}static forceDisallow(){Xr.forceDisallow_=!0}static isAvailable(){return Xr.forceAllow_?!0:!Xr.forceDisallow_&&typeof document<"u"&&document.createElement!=null&&!dN()&&!fN()}markConnectionHealthy(){}shutdown_(){this.isClosed_=!0,this.scriptTagHolder&&(this.scriptTagHolder.close(),this.scriptTagHolder=null),this.myDisconnFrame&&(document.body.removeChild(this.myDisconnFrame),this.myDisconnFrame=null),this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null)}onClosed_(){this.isClosed_||(this.log_("Longpoll is closing itself"),this.shutdown_(),this.onDisconnect_&&(this.onDisconnect_(this.everConnected_),this.onDisconnect_=null))}close(){this.isClosed_||(this.log_("Longpoll is being closed."),this.shutdown_())}send(e){const t=Me(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const r=Cm(t),s=aE(r,xN);for(let i=0;i<s.length;i++)this.scriptTagHolder.enqueueSegment(this.curSegmentNum,s.length,s[i]),this.curSegmentNum++}addDisconnectPingFrame(e,t){this.myDisconnFrame=document.createElement("iframe");const r={};r[DN]="t",r[EE]=e,r[TE]=t,this.myDisconnFrame.src=this.urlFn(r),this.myDisconnFrame.style.display="none",document.body.appendChild(this.myDisconnFrame)}incrementIncomingBytes_(e){const t=Me(e).length;this.bytesReceived+=t,this.stats_.incrementCounter("bytes_received",t)}}class yd{constructor(e,t,r,s){this.onDisconnect=r,this.urlFn=s,this.outstandingRequests=new Set,this.pendingSegs=[],this.currentSerial=Math.floor(Math.random()*1e8),this.sendNewPolls=!0;{this.uniqueCallbackIdentifier=aN(),window[RN+this.uniqueCallbackIdentifier]=e,window[SN+this.uniqueCallbackIdentifier]=t,this.myIFrame=yd.createIFrame_();let i="";this.myIFrame.src&&this.myIFrame.src.substr(0,11)==="javascript:"&&(i='<script>document.domain="'+document.domain+'";<\/script>');const o="<html><body>"+i+"</body></html>";try{this.myIFrame.doc.open(),this.myIFrame.doc.write(o),this.myIFrame.doc.close()}catch(a){je("frame writing exception"),a.stack&&je(a.stack),je(a)}}}static createIFrame_(){const e=document.createElement("iframe");if(e.style.display="none",document.body){document.body.appendChild(e);try{e.contentWindow.document||je("No IE domain setting required")}catch{const r=document.domain;e.src="javascript:void((function(){document.open();document.domain='"+r+"';document.close();})())"}}else throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";return e.contentDocument?e.doc=e.contentDocument:e.contentWindow?e.doc=e.contentWindow.document:e.document&&(e.doc=e.document),e}close(){this.alive=!1,this.myIFrame&&(this.myIFrame.doc.body.textContent="",setTimeout(()=>{this.myIFrame!==null&&(document.body.removeChild(this.myIFrame),this.myIFrame=null)},Math.floor(0)));const e=this.onDisconnect;e&&(this.onDisconnect=null,e())}startLongPoll(e,t){for(this.myID=e,this.myPW=t,this.alive=!0;this.newRequest_(););}newRequest_(){if(this.alive&&this.sendNewPolls&&this.outstandingRequests.size<(this.pendingSegs.length>0?2:1)){this.currentSerial++;const e={};e[EE]=this.myID,e[TE]=this.myPW,e[wE]=this.currentSerial;let t=this.urlFn(e),r="",s=0;for(;this.pendingSegs.length>0&&this.pendingSegs[0].d.length+AE+r.length<=vE;){const o=this.pendingSegs.shift();r=r+"&"+PN+s+"="+o.seg+"&"+NN+s+"="+o.ts+"&"+kN+s+"="+o.d,s++}return t=t+r,this.addLongPollTag_(t,this.currentSerial),!0}else return!1}enqueueSegment(e,t,r){this.pendingSegs.push({seg:e,ts:t,d:r}),this.alive&&this.newRequest_()}addLongPollTag_(e,t){this.outstandingRequests.add(t);const r=()=>{this.outstandingRequests.delete(t),this.newRequest_()},s=setTimeout(r,Math.floor(VN)),i=()=>{clearTimeout(s),r()};this.addTag(e,i)}addTag(e,t){setTimeout(()=>{try{if(!this.sendNewPolls)return;const r=this.myIFrame.doc.createElement("script");r.type="text/javascript",r.async=!0,r.src=e,r.onload=r.onreadystatechange=function(){const s=r.readyState;(!s||s==="loaded"||s==="complete")&&(r.onload=r.onreadystatechange=null,r.parentNode&&r.parentNode.removeChild(r),t())},r.onerror=()=>{je("Long-poll script failed to load: "+e),this.sendNewPolls=!1,this.close()},this.myIFrame.doc.body.appendChild(r)}catch{}},Math.floor(1))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const MN=16384,LN=45e3;let Ja=null;typeof MozWebSocket<"u"?Ja=MozWebSocket:typeof WebSocket<"u"&&(Ja=WebSocket);class At{constructor(e,t,r,s,i,o,a){this.connId=e,this.applicationId=r,this.appCheckToken=s,this.authToken=i,this.keepaliveTimer=null,this.frames=null,this.totalFrames=0,this.bytesSent=0,this.bytesReceived=0,this.log_=Oo(this.connId),this.stats_=gd(t),this.connURL=At.connectionURL_(t,o,a,s,r),this.nodeAdmin=t.nodeAdmin}static connectionURL_(e,t,r,s,i){const o={};return o[lE]=md,typeof location<"u"&&location.hostname&&fE.test(location.hostname)&&(o[hE]=dE),t&&(o[uE]=t),r&&(o[pE]=r),s&&(o[Ou]=s),i&&(o[_E]=i),IE(e,mE,o)}open(e,t){this.onDisconnect=t,this.onMessage=e,this.log_("Websocket connecting to "+this.connURL),this.everConnected_=!1,hr.set("previous_websocket_failure",!0);try{let r;Tw(),this.mySock=new Ja(this.connURL,[],r)}catch(r){this.log_("Error instantiating WebSocket.");const s=r.message||r.data;s&&this.log_(s),this.onClosed_();return}this.mySock.onopen=()=>{this.log_("Websocket connected."),this.everConnected_=!0},this.mySock.onclose=()=>{this.log_("Websocket connection was disconnected."),this.mySock=null,this.onClosed_()},this.mySock.onmessage=r=>{this.handleIncomingFrame(r)},this.mySock.onerror=r=>{this.log_("WebSocket error.  Closing connection.");const s=r.message||r.data;s&&this.log_(s),this.onClosed_()}}start(){}static forceDisallow(){At.forceDisallow_=!0}static isAvailable(){let e=!1;if(typeof navigator<"u"&&navigator.userAgent){const t=/Android ([0-9]{0,}\.[0-9]{0,})/,r=navigator.userAgent.match(t);r&&r.length>1&&parseFloat(r[1])<4.4&&(e=!0)}return!e&&Ja!==null&&!At.forceDisallow_}static previouslyFailed(){return hr.isInMemoryStorage||hr.get("previous_websocket_failure")===!0}markConnectionHealthy(){hr.remove("previous_websocket_failure")}appendFrame_(e){if(this.frames.push(e),this.frames.length===this.totalFrames){const t=this.frames.join("");this.frames=null;const r=Ki(t);this.onMessage(r)}}handleNewFrameCount_(e){this.totalFrames=e,this.frames=[]}extractFrameCount_(e){if(O(this.frames===null,"We already have a frame buffer"),e.length<=6){const t=Number(e);if(!isNaN(t))return this.handleNewFrameCount_(t),null}return this.handleNewFrameCount_(1),e}handleIncomingFrame(e){if(this.mySock===null)return;const t=e.data;if(this.bytesReceived+=t.length,this.stats_.incrementCounter("bytes_received",t.length),this.resetKeepAlive(),this.frames!==null)this.appendFrame_(t);else{const r=this.extractFrameCount_(t);r!==null&&this.appendFrame_(r)}}send(e){this.resetKeepAlive();const t=Me(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const r=aE(t,MN);r.length>1&&this.sendString_(String(r.length));for(let s=0;s<r.length;s++)this.sendString_(r[s])}shutdown_(){this.isClosed_=!0,this.keepaliveTimer&&(clearInterval(this.keepaliveTimer),this.keepaliveTimer=null),this.mySock&&(this.mySock.close(),this.mySock=null)}onClosed_(){this.isClosed_||(this.log_("WebSocket is closing itself"),this.shutdown_(),this.onDisconnect&&(this.onDisconnect(this.everConnected_),this.onDisconnect=null))}close(){this.isClosed_||(this.log_("WebSocket is being closed"),this.shutdown_())}resetKeepAlive(){clearInterval(this.keepaliveTimer),this.keepaliveTimer=setInterval(()=>{this.mySock&&this.sendString_("0"),this.resetKeepAlive()},Math.floor(LN))}sendString_(e){try{this.mySock.send(e)}catch(t){this.log_("Exception thrown from WebSocket.send():",t.message||t.data,"Closing connection."),setTimeout(this.onClosed_.bind(this),0)}}}At.responsesRequiredToBeHealthy=2;At.healthyTimeout=3e4;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class co{static get ALL_TRANSPORTS(){return[Xr,At]}static get IS_TRANSPORT_INITIALIZED(){return this.globalTransportInitialized_}constructor(e){this.initTransports_(e)}initTransports_(e){const t=At&&At.isAvailable();let r=t&&!At.previouslyFailed();if(e.webSocketOnly&&(t||ft("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),r=!0),r)this.transports_=[At];else{const s=this.transports_=[];for(const i of co.ALL_TRANSPORTS)i&&i.isAvailable()&&s.push(i);co.globalTransportInitialized_=!0}}initialTransport(){if(this.transports_.length>0)return this.transports_[0];throw new Error("No transports available")}upgradeTransport(){return this.transports_.length>1?this.transports_[1]:null}}co.globalTransportInitialized_=!1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const FN=6e4,UN=5e3,BN=10*1024,qN=100*1024,Wl="t",G_="d",GN="s",z_="r",zN="e",$_="o",j_="a",W_="n",K_="p",$N="h";class jN{constructor(e,t,r,s,i,o,a,l,u,d){this.id=e,this.repoInfo_=t,this.applicationId_=r,this.appCheckToken_=s,this.authToken_=i,this.onMessage_=o,this.onReady_=a,this.onDisconnect_=l,this.onKill_=u,this.lastSessionId=d,this.connectionCount=0,this.pendingDataMessages=[],this.state_=0,this.log_=Oo("c:"+this.id+":"),this.transportManager_=new co(t),this.log_("Connection created"),this.start_()}start_(){const e=this.transportManager_.initialTransport();this.conn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,null,this.lastSessionId),this.primaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.conn_),r=this.disconnReceiver_(this.conn_);this.tx_=this.conn_,this.rx_=this.conn_,this.secondaryConn_=null,this.isHealthy_=!1,setTimeout(()=>{this.conn_&&this.conn_.open(t,r)},Math.floor(0));const s=e.healthyTimeout||0;s>0&&(this.healthyTimeout_=qi(()=>{this.healthyTimeout_=null,this.isHealthy_||(this.conn_&&this.conn_.bytesReceived>qN?(this.log_("Connection exceeded healthy timeout but has received "+this.conn_.bytesReceived+" bytes.  Marking connection healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()):this.conn_&&this.conn_.bytesSent>BN?this.log_("Connection exceeded healthy timeout but has sent "+this.conn_.bytesSent+" bytes.  Leaving connection alive."):(this.log_("Closing unhealthy connection after timeout."),this.close()))},Math.floor(s)))}nextTransportId_(){return"c:"+this.id+":"+this.connectionCount++}disconnReceiver_(e){return t=>{e===this.conn_?this.onConnectionLost_(t):e===this.secondaryConn_?(this.log_("Secondary connection lost."),this.onSecondaryConnectionLost_()):this.log_("closing an old connection")}}connReceiver_(e){return t=>{this.state_!==2&&(e===this.rx_?this.onPrimaryMessageReceived_(t):e===this.secondaryConn_?this.onSecondaryMessageReceived_(t):this.log_("message on old connection"))}}sendRequest(e){const t={t:"d",d:e};this.sendData_(t)}tryCleanupConnection(){this.tx_===this.secondaryConn_&&this.rx_===this.secondaryConn_&&(this.log_("cleaning up and promoting a connection: "+this.secondaryConn_.connId),this.conn_=this.secondaryConn_,this.secondaryConn_=null)}onSecondaryControl_(e){if(Wl in e){const t=e[Wl];t===j_?this.upgradeIfSecondaryHealthy_():t===z_?(this.log_("Got a reset on secondary, closing it"),this.secondaryConn_.close(),(this.tx_===this.secondaryConn_||this.rx_===this.secondaryConn_)&&this.close()):t===$_&&(this.log_("got pong on secondary."),this.secondaryResponsesRequired_--,this.upgradeIfSecondaryHealthy_())}}onSecondaryMessageReceived_(e){const t=Ii("t",e),r=Ii("d",e);if(t==="c")this.onSecondaryControl_(r);else if(t==="d")this.pendingDataMessages.push(r);else throw new Error("Unknown protocol layer: "+t)}upgradeIfSecondaryHealthy_(){this.secondaryResponsesRequired_<=0?(this.log_("Secondary connection is healthy."),this.isHealthy_=!0,this.secondaryConn_.markConnectionHealthy(),this.proceedWithUpgrade_()):(this.log_("sending ping on secondary."),this.secondaryConn_.send({t:"c",d:{t:K_,d:{}}}))}proceedWithUpgrade_(){this.secondaryConn_.start(),this.log_("sending client ack on secondary"),this.secondaryConn_.send({t:"c",d:{t:j_,d:{}}}),this.log_("Ending transmission on primary"),this.conn_.send({t:"c",d:{t:W_,d:{}}}),this.tx_=this.secondaryConn_,this.tryCleanupConnection()}onPrimaryMessageReceived_(e){const t=Ii("t",e),r=Ii("d",e);t==="c"?this.onControl_(r):t==="d"&&this.onDataMessage_(r)}onDataMessage_(e){this.onPrimaryResponse_(),this.onMessage_(e)}onPrimaryResponse_(){this.isHealthy_||(this.primaryResponsesRequired_--,this.primaryResponsesRequired_<=0&&(this.log_("Primary connection is healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()))}onControl_(e){const t=Ii(Wl,e);if(G_ in e){const r=e[G_];if(t===$N){const s={...r};this.repoInfo_.isUsingEmulator&&(s.h=this.repoInfo_.host),this.onHandshake_(s)}else if(t===W_){this.log_("recvd end transmission on primary"),this.rx_=this.secondaryConn_;for(let s=0;s<this.pendingDataMessages.length;++s)this.onDataMessage_(this.pendingDataMessages[s]);this.pendingDataMessages=[],this.tryCleanupConnection()}else t===GN?this.onConnectionShutdown_(r):t===z_?this.onReset_(r):t===zN?Vu("Server Error: "+r):t===$_?(this.log_("got pong on primary."),this.onPrimaryResponse_(),this.sendPingOnPrimaryIfNecessary_()):Vu("Unknown control packet command: "+t)}}onHandshake_(e){const t=e.ts,r=e.v,s=e.h;this.sessionId=e.s,this.repoInfo_.host=s,this.state_===0&&(this.conn_.start(),this.onConnectionEstablished_(this.conn_,t),md!==r&&ft("Protocol version mismatch detected"),this.tryStartUpgrade_())}tryStartUpgrade_(){const e=this.transportManager_.upgradeTransport();e&&this.startUpgrade_(e)}startUpgrade_(e){this.secondaryConn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,this.sessionId),this.secondaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.secondaryConn_),r=this.disconnReceiver_(this.secondaryConn_);this.secondaryConn_.open(t,r),qi(()=>{this.secondaryConn_&&(this.log_("Timed out trying to upgrade."),this.secondaryConn_.close())},Math.floor(FN))}onReset_(e){this.log_("Reset packet received.  New host: "+e),this.repoInfo_.host=e,this.state_===1?this.close():(this.closeConnections_(),this.start_())}onConnectionEstablished_(e,t){this.log_("Realtime connection established."),this.conn_=e,this.state_=1,this.onReady_&&(this.onReady_(t,this.sessionId),this.onReady_=null),this.primaryResponsesRequired_===0?(this.log_("Primary connection is healthy."),this.isHealthy_=!0):qi(()=>{this.sendPingOnPrimaryIfNecessary_()},Math.floor(UN))}sendPingOnPrimaryIfNecessary_(){!this.isHealthy_&&this.state_===1&&(this.log_("sending ping on primary."),this.sendData_({t:"c",d:{t:K_,d:{}}}))}onSecondaryConnectionLost_(){const e=this.secondaryConn_;this.secondaryConn_=null,(this.tx_===e||this.rx_===e)&&this.close()}onConnectionLost_(e){this.conn_=null,!e&&this.state_===0?(this.log_("Realtime connection failed."),this.repoInfo_.isCacheableHost()&&(hr.remove("host:"+this.repoInfo_.host),this.repoInfo_.internalHost=this.repoInfo_.host)):this.state_===1&&this.log_("Realtime connection lost."),this.close()}onConnectionShutdown_(e){this.log_("Connection shutdown command received. Shutting down..."),this.onKill_&&(this.onKill_(e),this.onKill_=null),this.onDisconnect_=null,this.close()}sendData_(e){if(this.state_!==1)throw"Connection is not connected";this.tx_.send(e)}close(){this.state_!==2&&(this.log_("Closing realtime connection."),this.state_=2,this.closeConnections_(),this.onDisconnect_&&(this.onDisconnect_(),this.onDisconnect_=null))}closeConnections_(){this.log_("Shutting down all connections"),this.conn_&&(this.conn_.close(),this.conn_=null),this.secondaryConn_&&(this.secondaryConn_.close(),this.secondaryConn_=null),this.healthyTimeout_&&(clearTimeout(this.healthyTimeout_),this.healthyTimeout_=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bE{put(e,t,r,s){}merge(e,t,r,s){}refreshAuthToken(e){}refreshAppCheckToken(e){}onDisconnectPut(e,t,r){}onDisconnectMerge(e,t,r){}onDisconnectCancel(e,t){}reportStats(e){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class RE{constructor(e){this.allowedEvents_=e,this.listeners_={},O(Array.isArray(e)&&e.length>0,"Requires a non-empty array")}trigger(e,...t){if(Array.isArray(this.listeners_[e])){const r=[...this.listeners_[e]];for(let s=0;s<r.length;s++)r[s].callback.apply(r[s].context,t)}}on(e,t,r){this.validateEventType_(e),this.listeners_[e]=this.listeners_[e]||[],this.listeners_[e].push({callback:t,context:r});const s=this.getInitialEvent(e);s&&t.apply(r,s)}off(e,t,r){this.validateEventType_(e);const s=this.listeners_[e]||[];for(let i=0;i<s.length;i++)if(s[i].callback===t&&(!r||r===s[i].context)){s.splice(i,1);return}}validateEventType_(e){O(this.allowedEvents_.find(t=>t===e),"Unknown event: "+e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xa extends RE{static getInstance(){return new Xa}constructor(){super(["online"]),this.online_=!0,typeof window<"u"&&typeof window.addEventListener<"u"&&!Zu()&&(window.addEventListener("online",()=>{this.online_||(this.online_=!0,this.trigger("online",!0))},!1),window.addEventListener("offline",()=>{this.online_&&(this.online_=!1,this.trigger("online",!1))},!1))}getInitialEvent(e){return O(e==="online","Unknown event type: "+e),[this.online_]}currentlyOnline(){return this.online_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const H_=32,Q_=768;class de{constructor(e,t){if(t===void 0){this.pieces_=e.split("/");let r=0;for(let s=0;s<this.pieces_.length;s++)this.pieces_[s].length>0&&(this.pieces_[r]=this.pieces_[s],r++);this.pieces_.length=r,this.pieceNum_=0}else this.pieces_=e,this.pieceNum_=t}toString(){let e="";for(let t=this.pieceNum_;t<this.pieces_.length;t++)this.pieces_[t]!==""&&(e+="/"+this.pieces_[t]);return e||"/"}}function oe(){return new de("")}function Y(n){return n.pieceNum_>=n.pieces_.length?null:n.pieces_[n.pieceNum_]}function Fn(n){return n.pieces_.length-n.pieceNum_}function _e(n){let e=n.pieceNum_;return e<n.pieces_.length&&e++,new de(n.pieces_,e)}function Id(n){return n.pieceNum_<n.pieces_.length?n.pieces_[n.pieces_.length-1]:null}function WN(n){let e="";for(let t=n.pieceNum_;t<n.pieces_.length;t++)n.pieces_[t]!==""&&(e+="/"+encodeURIComponent(String(n.pieces_[t])));return e||"/"}function lo(n,e=0){return n.pieces_.slice(n.pieceNum_+e)}function SE(n){if(n.pieceNum_>=n.pieces_.length)return null;const e=[];for(let t=n.pieceNum_;t<n.pieces_.length-1;t++)e.push(n.pieces_[t]);return new de(e,0)}function ke(n,e){const t=[];for(let r=n.pieceNum_;r<n.pieces_.length;r++)t.push(n.pieces_[r]);if(e instanceof de)for(let r=e.pieceNum_;r<e.pieces_.length;r++)t.push(e.pieces_[r]);else{const r=e.split("/");for(let s=0;s<r.length;s++)r[s].length>0&&t.push(r[s])}return new de(t,0)}function J(n){return n.pieceNum_>=n.pieces_.length}function nt(n,e){const t=Y(n),r=Y(e);if(t===null)return e;if(t===r)return nt(_e(n),_e(e));throw new Error("INTERNAL ERROR: innerPath ("+e+") is not within outerPath ("+n+")")}function KN(n,e){const t=lo(n,0),r=lo(e,0);for(let s=0;s<t.length&&s<r.length;s++){const i=Mr(t[s],r[s]);if(i!==0)return i}return t.length===r.length?0:t.length<r.length?-1:1}function Ed(n,e){if(Fn(n)!==Fn(e))return!1;for(let t=n.pieceNum_,r=e.pieceNum_;t<=n.pieces_.length;t++,r++)if(n.pieces_[t]!==e.pieces_[r])return!1;return!0}function Et(n,e){let t=n.pieceNum_,r=e.pieceNum_;if(Fn(n)>Fn(e))return!1;for(;t<n.pieces_.length;){if(n.pieces_[t]!==e.pieces_[r])return!1;++t,++r}return!0}class HN{constructor(e,t){this.errorPrefix_=t,this.parts_=lo(e,0),this.byteLength_=Math.max(1,this.parts_.length);for(let r=0;r<this.parts_.length;r++)this.byteLength_+=gc(this.parts_[r]);CE(this)}}function QN(n,e){n.parts_.length>0&&(n.byteLength_+=1),n.parts_.push(e),n.byteLength_+=gc(e),CE(n)}function YN(n){const e=n.parts_.pop();n.byteLength_-=gc(e),n.parts_.length>0&&(n.byteLength_-=1)}function CE(n){if(n.byteLength_>Q_)throw new Error(n.errorPrefix_+"has a key path longer than "+Q_+" bytes ("+n.byteLength_+").");if(n.parts_.length>H_)throw new Error(n.errorPrefix_+"path specified exceeds the maximum depth that can be written ("+H_+") or object contains a cycle "+ir(n))}function ir(n){return n.parts_.length===0?"":"in property '"+n.parts_.join(".")+"'"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Td extends RE{static getInstance(){return new Td}constructor(){super(["visible"]);let e,t;typeof document<"u"&&typeof document.addEventListener<"u"&&(typeof document.hidden<"u"?(t="visibilitychange",e="hidden"):typeof document.mozHidden<"u"?(t="mozvisibilitychange",e="mozHidden"):typeof document.msHidden<"u"?(t="msvisibilitychange",e="msHidden"):typeof document.webkitHidden<"u"&&(t="webkitvisibilitychange",e="webkitHidden")),this.visible_=!0,t&&document.addEventListener(t,()=>{const r=!document[e];r!==this.visible_&&(this.visible_=r,this.trigger("visible",r))},!1)}getInitialEvent(e){return O(e==="visible","Unknown event type: "+e),[this.visible_]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ei=1e3,JN=300*1e3,Y_=30*1e3,XN=1.3,ZN=3e4,e0="server_kill",J_=3;class Yt extends bE{constructor(e,t,r,s,i,o,a,l){if(super(),this.repoInfo_=e,this.applicationId_=t,this.onDataUpdate_=r,this.onConnectStatus_=s,this.onServerInfoUpdate_=i,this.authTokenProvider_=o,this.appCheckTokenProvider_=a,this.authOverride_=l,this.id=Yt.nextPersistentConnectionId_++,this.log_=Oo("p:"+this.id+":"),this.interruptReasons_={},this.listens=new Map,this.outstandingPuts_=[],this.outstandingGets_=[],this.outstandingPutCount_=0,this.outstandingGetCount_=0,this.onDisconnectRequestQueue_=[],this.connected_=!1,this.reconnectDelay_=Ei,this.maxReconnectDelay_=JN,this.securityDebugCallback_=null,this.lastSessionId=null,this.establishConnectionTimer_=null,this.visible_=!1,this.requestCBHash_={},this.requestNumber_=0,this.realtime_=null,this.authToken_=null,this.appCheckToken_=null,this.forceTokenRefresh_=!1,this.invalidAuthTokenCount_=0,this.invalidAppCheckTokenCount_=0,this.firstConnection_=!0,this.lastConnectionAttemptTime_=null,this.lastConnectionEstablishedTime_=null,l)throw new Error("Auth override specified in options, but not supported on non Node.js platforms");Td.getInstance().on("visible",this.onVisible_,this),e.host.indexOf("fblocal")===-1&&Xa.getInstance().on("online",this.onOnline_,this)}sendRequest(e,t,r){const s=++this.requestNumber_,i={r:s,a:e,b:t};this.log_(Me(i)),O(this.connected_,"sendRequest call when we're not connected not allowed."),this.realtime_.sendRequest(i),r&&(this.requestCBHash_[s]=r)}get(e){this.initConnection_();const t=new Wt,s={action:"g",request:{p:e._path.toString(),q:e._queryObject},onComplete:o=>{const a=o.d;o.s==="ok"?t.resolve(a):t.reject(a)}};this.outstandingGets_.push(s),this.outstandingGetCount_++;const i=this.outstandingGets_.length-1;return this.connected_&&this.sendGet_(i),t.promise}listen(e,t,r,s){this.initConnection_();const i=e._queryIdentifier,o=e._path.toString();this.log_("Listen called for "+o+" "+i),this.listens.has(o)||this.listens.set(o,new Map),O(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"listen() called for non-default but complete query"),O(!this.listens.get(o).has(i),"listen() called twice for same path/queryId.");const a={onComplete:s,hashFn:t,query:e,tag:r};this.listens.get(o).set(i,a),this.connected_&&this.sendListen_(a)}sendGet_(e){const t=this.outstandingGets_[e];this.sendRequest("g",t.request,r=>{delete this.outstandingGets_[e],this.outstandingGetCount_--,this.outstandingGetCount_===0&&(this.outstandingGets_=[]),t.onComplete&&t.onComplete(r)})}sendListen_(e){const t=e.query,r=t._path.toString(),s=t._queryIdentifier;this.log_("Listen on "+r+" for "+s);const i={p:r},o="q";e.tag&&(i.q=t._queryObject,i.t=e.tag),i.h=e.hashFn(),this.sendRequest(o,i,a=>{const l=a.d,u=a.s;Yt.warnOnListenWarnings_(l,t),(this.listens.get(r)&&this.listens.get(r).get(s))===e&&(this.log_("listen response",a),u!=="ok"&&this.removeListen_(r,s),e.onComplete&&e.onComplete(u,l))})}static warnOnListenWarnings_(e,t){if(e&&typeof e=="object"&&$t(e,"w")){const r=is(e,"w");if(Array.isArray(r)&&~r.indexOf("no_index")){const s='".indexOn": "'+t._queryParams.getIndex().toString()+'"',i=t._path.toString();ft(`Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ${s} at ${i} to your security rules for better performance.`)}}}refreshAuthToken(e){this.authToken_=e,this.log_("Auth token refreshed"),this.authToken_?this.tryAuth():this.connected_&&this.sendRequest("unauth",{},()=>{}),this.reduceReconnectDelayIfAdminCredential_(e)}reduceReconnectDelayIfAdminCredential_(e){(e&&e.length===40||Sw(e))&&(this.log_("Admin auth credential detected.  Reducing max reconnect time."),this.maxReconnectDelay_=Y_)}refreshAppCheckToken(e){this.appCheckToken_=e,this.log_("App check token refreshed"),this.appCheckToken_?this.tryAppCheck():this.connected_&&this.sendRequest("unappeck",{},()=>{})}tryAuth(){if(this.connected_&&this.authToken_){const e=this.authToken_,t=Rw(e)?"auth":"gauth",r={cred:e};this.authOverride_===null?r.noauth=!0:typeof this.authOverride_=="object"&&(r.authvar=this.authOverride_),this.sendRequest(t,r,s=>{const i=s.s,o=s.d||"error";this.authToken_===e&&(i==="ok"?this.invalidAuthTokenCount_=0:this.onAuthRevoked_(i,o))})}}tryAppCheck(){this.connected_&&this.appCheckToken_&&this.sendRequest("appcheck",{token:this.appCheckToken_},e=>{const t=e.s,r=e.d||"error";t==="ok"?this.invalidAppCheckTokenCount_=0:this.onAppCheckRevoked_(t,r)})}unlisten(e,t){const r=e._path.toString(),s=e._queryIdentifier;this.log_("Unlisten called for "+r+" "+s),O(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"unlisten() called for non-default but complete query"),this.removeListen_(r,s)&&this.connected_&&this.sendUnlisten_(r,s,e._queryObject,t)}sendUnlisten_(e,t,r,s){this.log_("Unlisten on "+e+" for "+t);const i={p:e},o="n";s&&(i.q=r,i.t=s),this.sendRequest(o,i)}onDisconnectPut(e,t,r){this.initConnection_(),this.connected_?this.sendOnDisconnect_("o",e,t,r):this.onDisconnectRequestQueue_.push({pathString:e,action:"o",data:t,onComplete:r})}onDisconnectMerge(e,t,r){this.initConnection_(),this.connected_?this.sendOnDisconnect_("om",e,t,r):this.onDisconnectRequestQueue_.push({pathString:e,action:"om",data:t,onComplete:r})}onDisconnectCancel(e,t){this.initConnection_(),this.connected_?this.sendOnDisconnect_("oc",e,null,t):this.onDisconnectRequestQueue_.push({pathString:e,action:"oc",data:null,onComplete:t})}sendOnDisconnect_(e,t,r,s){const i={p:t,d:r};this.log_("onDisconnect "+e,i),this.sendRequest(e,i,o=>{s&&setTimeout(()=>{s(o.s,o.d)},Math.floor(0))})}put(e,t,r,s){this.putInternal("p",e,t,r,s)}merge(e,t,r,s){this.putInternal("m",e,t,r,s)}putInternal(e,t,r,s,i){this.initConnection_();const o={p:t,d:r};i!==void 0&&(o.h=i),this.outstandingPuts_.push({action:e,request:o,onComplete:s}),this.outstandingPutCount_++;const a=this.outstandingPuts_.length-1;this.connected_?this.sendPut_(a):this.log_("Buffering put: "+t)}sendPut_(e){const t=this.outstandingPuts_[e].action,r=this.outstandingPuts_[e].request,s=this.outstandingPuts_[e].onComplete;this.outstandingPuts_[e].queued=this.connected_,this.sendRequest(t,r,i=>{this.log_(t+" response",i),delete this.outstandingPuts_[e],this.outstandingPutCount_--,this.outstandingPutCount_===0&&(this.outstandingPuts_=[]),s&&s(i.s,i.d)})}reportStats(e){if(this.connected_){const t={c:e};this.log_("reportStats",t),this.sendRequest("s",t,r=>{if(r.s!=="ok"){const i=r.d;this.log_("reportStats","Error sending stats: "+i)}})}}onDataMessage_(e){if("r"in e){this.log_("from server: "+Me(e));const t=e.r,r=this.requestCBHash_[t];r&&(delete this.requestCBHash_[t],r(e.b))}else{if("error"in e)throw"A server-side error has occurred: "+e.error;"a"in e&&this.onDataPush_(e.a,e.b)}}onDataPush_(e,t){this.log_("handleServerMessage",e,t),e==="d"?this.onDataUpdate_(t.p,t.d,!1,t.t):e==="m"?this.onDataUpdate_(t.p,t.d,!0,t.t):e==="c"?this.onListenRevoked_(t.p,t.q):e==="ac"?this.onAuthRevoked_(t.s,t.d):e==="apc"?this.onAppCheckRevoked_(t.s,t.d):e==="sd"?this.onSecurityDebugPacket_(t):Vu("Unrecognized action received from server: "+Me(e)+`
Are you using the latest client?`)}onReady_(e,t){this.log_("connection ready"),this.connected_=!0,this.lastConnectionEstablishedTime_=new Date().getTime(),this.handleTimestamp_(e),this.lastSessionId=t,this.firstConnection_&&this.sendConnectStats_(),this.restoreState_(),this.firstConnection_=!1,this.onConnectStatus_(!0)}scheduleConnect_(e){O(!this.realtime_,"Scheduling a connect when we're already connected/ing?"),this.establishConnectionTimer_&&clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=setTimeout(()=>{this.establishConnectionTimer_=null,this.establishConnection_()},Math.floor(e))}initConnection_(){!this.realtime_&&this.firstConnection_&&this.scheduleConnect_(0)}onVisible_(e){e&&!this.visible_&&this.reconnectDelay_===this.maxReconnectDelay_&&(this.log_("Window became visible.  Reducing delay."),this.reconnectDelay_=Ei,this.realtime_||this.scheduleConnect_(0)),this.visible_=e}onOnline_(e){e?(this.log_("Browser went online."),this.reconnectDelay_=Ei,this.realtime_||this.scheduleConnect_(0)):(this.log_("Browser went offline.  Killing connection."),this.realtime_&&this.realtime_.close())}onRealtimeDisconnect_(){if(this.log_("data client disconnected"),this.connected_=!1,this.realtime_=null,this.cancelSentTransactions_(),this.requestCBHash_={},this.shouldReconnect_()){this.visible_?this.lastConnectionEstablishedTime_&&(new Date().getTime()-this.lastConnectionEstablishedTime_>ZN&&(this.reconnectDelay_=Ei),this.lastConnectionEstablishedTime_=null):(this.log_("Window isn't visible.  Delaying reconnect."),this.reconnectDelay_=this.maxReconnectDelay_,this.lastConnectionAttemptTime_=new Date().getTime());const e=Math.max(0,new Date().getTime()-this.lastConnectionAttemptTime_);let t=Math.max(0,this.reconnectDelay_-e);t=Math.random()*t,this.log_("Trying to reconnect in "+t+"ms"),this.scheduleConnect_(t),this.reconnectDelay_=Math.min(this.maxReconnectDelay_,this.reconnectDelay_*XN)}this.onConnectStatus_(!1)}async establishConnection_(){if(this.shouldReconnect_()){this.log_("Making a connection attempt"),this.lastConnectionAttemptTime_=new Date().getTime(),this.lastConnectionEstablishedTime_=null;const e=this.onDataMessage_.bind(this),t=this.onReady_.bind(this),r=this.onRealtimeDisconnect_.bind(this),s=this.id+":"+Yt.nextConnectionId_++,i=this.lastSessionId;let o=!1,a=null;const l=function(){a?a.close():(o=!0,r())},u=function(f){O(a,"sendRequest call when we're not connected not allowed."),a.sendRequest(f)};this.realtime_={close:l,sendRequest:u};const d=this.forceTokenRefresh_;this.forceTokenRefresh_=!1;try{const[f,_]=await Promise.all([this.authTokenProvider_.getToken(d),this.appCheckTokenProvider_.getToken(d)]);o?je("getToken() completed but was canceled"):(je("getToken() completed. Creating connection."),this.authToken_=f&&f.accessToken,this.appCheckToken_=_&&_.token,a=new jN(s,this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,e,t,r,g=>{ft(g+" ("+this.repoInfo_.toString()+")"),this.interrupt(e0)},i))}catch(f){this.log_("Failed to get token: "+f),o||(this.repoInfo_.nodeAdmin&&ft(f),l())}}}interrupt(e){je("Interrupting connection for reason: "+e),this.interruptReasons_[e]=!0,this.realtime_?this.realtime_.close():(this.establishConnectionTimer_&&(clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=null),this.connected_&&this.onRealtimeDisconnect_())}resume(e){je("Resuming connection for reason: "+e),delete this.interruptReasons_[e],Zl(this.interruptReasons_)&&(this.reconnectDelay_=Ei,this.realtime_||this.scheduleConnect_(0))}handleTimestamp_(e){const t=e-new Date().getTime();this.onServerInfoUpdate_({serverTimeOffset:t})}cancelSentTransactions_(){for(let e=0;e<this.outstandingPuts_.length;e++){const t=this.outstandingPuts_[e];t&&"h"in t.request&&t.queued&&(t.onComplete&&t.onComplete("disconnect"),delete this.outstandingPuts_[e],this.outstandingPutCount_--)}this.outstandingPutCount_===0&&(this.outstandingPuts_=[])}onListenRevoked_(e,t){let r;t?r=t.map(i=>_d(i)).join("$"):r="default";const s=this.removeListen_(e,r);s&&s.onComplete&&s.onComplete("permission_denied")}removeListen_(e,t){const r=new de(e).toString();let s;if(this.listens.has(r)){const i=this.listens.get(r);s=i.get(t),i.delete(t),i.size===0&&this.listens.delete(r)}else s=void 0;return s}onAuthRevoked_(e,t){je("Auth token revoked: "+e+"/"+t),this.authToken_=null,this.forceTokenRefresh_=!0,this.realtime_.close(),(e==="invalid_token"||e==="permission_denied")&&(this.invalidAuthTokenCount_++,this.invalidAuthTokenCount_>=J_&&(this.reconnectDelay_=Y_,this.authTokenProvider_.notifyForInvalidToken()))}onAppCheckRevoked_(e,t){je("App check token revoked: "+e+"/"+t),this.appCheckToken_=null,this.forceTokenRefresh_=!0,(e==="invalid_token"||e==="permission_denied")&&(this.invalidAppCheckTokenCount_++,this.invalidAppCheckTokenCount_>=J_&&this.appCheckTokenProvider_.notifyForInvalidToken())}onSecurityDebugPacket_(e){this.securityDebugCallback_?this.securityDebugCallback_(e):"msg"in e&&console.log("FIREBASE: "+e.msg.replace(`
`,`
FIREBASE: `))}restoreState_(){this.tryAuth(),this.tryAppCheck();for(const e of this.listens.values())for(const t of e.values())this.sendListen_(t);for(let e=0;e<this.outstandingPuts_.length;e++)this.outstandingPuts_[e]&&this.sendPut_(e);for(;this.onDisconnectRequestQueue_.length;){const e=this.onDisconnectRequestQueue_.shift();this.sendOnDisconnect_(e.action,e.pathString,e.data,e.onComplete)}for(let e=0;e<this.outstandingGets_.length;e++)this.outstandingGets_[e]&&this.sendGet_(e)}sendConnectStats_(){const e={};let t="js";e["sdk."+t+"."+sE.replace(/\./g,"-")]=1,Zu()?e["framework.cordova"]=1:xm()&&(e["framework.reactnative"]=1),this.reportStats(e)}shouldReconnect_(){const e=Xa.getInstance().currentlyOnline();return Zl(this.interruptReasons_)&&e}}Yt.nextPersistentConnectionId_=0;Yt.nextConnectionId_=0;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Z{constructor(e,t){this.name=e,this.node=t}static Wrap(e,t){return new Z(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qc{getCompare(){return this.compare.bind(this)}indexedValueChanged(e,t){const r=new Z(Ps,e),s=new Z(Ps,t);return this.compare(r,s)!==0}minPost(){return Z.MIN}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let fa;class PE extends Qc{static get __EMPTY_NODE(){return fa}static set __EMPTY_NODE(e){fa=e}compare(e,t){return Mr(e.name,t.name)}isDefinedOn(e){throw xs("KeyIndex.isDefinedOn not expected to be called.")}indexedValueChanged(e,t){return!1}minPost(){return Z.MIN}maxPost(){return new Z(Cr,fa)}makePost(e,t){return O(typeof e=="string","KeyIndex indexValue must always be a string."),new Z(e,fa)}toString(){return".key"}}const ns=new PE;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pa{constructor(e,t,r,s,i=null){this.isReverse_=s,this.resultGenerator_=i,this.nodeStack_=[];let o=1;for(;!e.isEmpty();)if(e=e,o=t?r(e.key,t):1,s&&(o*=-1),o<0)this.isReverse_?e=e.left:e=e.right;else if(o===0){this.nodeStack_.push(e);break}else this.nodeStack_.push(e),this.isReverse_?e=e.right:e=e.left}getNext(){if(this.nodeStack_.length===0)return null;let e=this.nodeStack_.pop(),t;if(this.resultGenerator_?t=this.resultGenerator_(e.key,e.value):t={key:e.key,value:e.value},this.isReverse_)for(e=e.left;!e.isEmpty();)this.nodeStack_.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack_.push(e),e=e.left;return t}hasNext(){return this.nodeStack_.length>0}peek(){if(this.nodeStack_.length===0)return null;const e=this.nodeStack_[this.nodeStack_.length-1];return this.resultGenerator_?this.resultGenerator_(e.key,e.value):{key:e.key,value:e.value}}}class ze{constructor(e,t,r,s,i){this.key=e,this.value=t,this.color=r??ze.RED,this.left=s??lt.EMPTY_NODE,this.right=i??lt.EMPTY_NODE}copy(e,t,r,s,i){return new ze(e??this.key,t??this.value,r??this.color,s??this.left,i??this.right)}count(){return this.left.count()+1+this.right.count()}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||!!e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min_(){return this.left.isEmpty()?this:this.left.min_()}minKey(){return this.min_().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,r){let s=this;const i=r(e,s.key);return i<0?s=s.copy(null,null,null,s.left.insert(e,t,r),null):i===0?s=s.copy(null,t,null,null,null):s=s.copy(null,null,null,null,s.right.insert(e,t,r)),s.fixUp_()}removeMin_(){if(this.left.isEmpty())return lt.EMPTY_NODE;let e=this;return!e.left.isRed_()&&!e.left.left.isRed_()&&(e=e.moveRedLeft_()),e=e.copy(null,null,null,e.left.removeMin_(),null),e.fixUp_()}remove(e,t){let r,s;if(r=this,t(e,r.key)<0)!r.left.isEmpty()&&!r.left.isRed_()&&!r.left.left.isRed_()&&(r=r.moveRedLeft_()),r=r.copy(null,null,null,r.left.remove(e,t),null);else{if(r.left.isRed_()&&(r=r.rotateRight_()),!r.right.isEmpty()&&!r.right.isRed_()&&!r.right.left.isRed_()&&(r=r.moveRedRight_()),t(e,r.key)===0){if(r.right.isEmpty())return lt.EMPTY_NODE;s=r.right.min_(),r=r.copy(s.key,s.value,null,null,r.right.removeMin_())}r=r.copy(null,null,null,null,r.right.remove(e,t))}return r.fixUp_()}isRed_(){return this.color}fixUp_(){let e=this;return e.right.isRed_()&&!e.left.isRed_()&&(e=e.rotateLeft_()),e.left.isRed_()&&e.left.left.isRed_()&&(e=e.rotateRight_()),e.left.isRed_()&&e.right.isRed_()&&(e=e.colorFlip_()),e}moveRedLeft_(){let e=this.colorFlip_();return e.right.left.isRed_()&&(e=e.copy(null,null,null,null,e.right.rotateRight_()),e=e.rotateLeft_(),e=e.colorFlip_()),e}moveRedRight_(){let e=this.colorFlip_();return e.left.left.isRed_()&&(e=e.rotateRight_(),e=e.colorFlip_()),e}rotateLeft_(){const e=this.copy(null,null,ze.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight_(){const e=this.copy(null,null,ze.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip_(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth_(){const e=this.check_();return Math.pow(2,e)<=this.count()+1}check_(){if(this.isRed_()&&this.left.isRed_())throw new Error("Red node has red child("+this.key+","+this.value+")");if(this.right.isRed_())throw new Error("Right child of ("+this.key+","+this.value+") is red");const e=this.left.check_();if(e!==this.right.check_())throw new Error("Black depths differ");return e+(this.isRed_()?0:1)}}ze.RED=!0;ze.BLACK=!1;class t0{copy(e,t,r,s,i){return this}insert(e,t,r){return new ze(e,t,null)}remove(e,t){return this}count(){return 0}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}check_(){return 0}isRed_(){return!1}}class lt{constructor(e,t=lt.EMPTY_NODE){this.comparator_=e,this.root_=t}insert(e,t){return new lt(this.comparator_,this.root_.insert(e,t,this.comparator_).copy(null,null,ze.BLACK,null,null))}remove(e){return new lt(this.comparator_,this.root_.remove(e,this.comparator_).copy(null,null,ze.BLACK,null,null))}get(e){let t,r=this.root_;for(;!r.isEmpty();){if(t=this.comparator_(e,r.key),t===0)return r.value;t<0?r=r.left:t>0&&(r=r.right)}return null}getPredecessorKey(e){let t,r=this.root_,s=null;for(;!r.isEmpty();)if(t=this.comparator_(e,r.key),t===0){if(r.left.isEmpty())return s?s.key:null;for(r=r.left;!r.right.isEmpty();)r=r.right;return r.key}else t<0?r=r.left:t>0&&(s=r,r=r.right);throw new Error("Attempted to find predecessor key for a nonexistent key.  What gives?")}isEmpty(){return this.root_.isEmpty()}count(){return this.root_.count()}minKey(){return this.root_.minKey()}maxKey(){return this.root_.maxKey()}inorderTraversal(e){return this.root_.inorderTraversal(e)}reverseTraversal(e){return this.root_.reverseTraversal(e)}getIterator(e){return new pa(this.root_,null,this.comparator_,!1,e)}getIteratorFrom(e,t){return new pa(this.root_,e,this.comparator_,!1,t)}getReverseIteratorFrom(e,t){return new pa(this.root_,e,this.comparator_,!0,t)}getReverseIterator(e){return new pa(this.root_,null,this.comparator_,!0,e)}}lt.EMPTY_NODE=new t0;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function n0(n,e){return Mr(n.name,e.name)}function wd(n,e){return Mr(n,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Mu;function r0(n){Mu=n}const NE=function(n){return typeof n=="number"?"number:"+cE(n):"string:"+n},kE=function(n){if(n.isLeafNode()){const e=n.val();O(typeof e=="string"||typeof e=="number"||typeof e=="object"&&$t(e,".sv"),"Priority must be a string or number.")}else O(n===Mu||n.isEmpty(),"priority of unexpected type.");O(n===Mu||n.getPriority().isEmpty(),"Priority nodes can't have a priority of their own.")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let X_;class Be{static set __childrenNodeConstructor(e){X_=e}static get __childrenNodeConstructor(){return X_}constructor(e,t=Be.__childrenNodeConstructor.EMPTY_NODE){this.value_=e,this.priorityNode_=t,this.lazyHash_=null,O(this.value_!==void 0&&this.value_!==null,"LeafNode shouldn't be created with null/undefined value."),kE(this.priorityNode_)}isLeafNode(){return!0}getPriority(){return this.priorityNode_}updatePriority(e){return new Be(this.value_,e)}getImmediateChild(e){return e===".priority"?this.priorityNode_:Be.__childrenNodeConstructor.EMPTY_NODE}getChild(e){return J(e)?this:Y(e)===".priority"?this.priorityNode_:Be.__childrenNodeConstructor.EMPTY_NODE}hasChild(){return!1}getPredecessorChildName(e,t){return null}updateImmediateChild(e,t){return e===".priority"?this.updatePriority(t):t.isEmpty()&&e!==".priority"?this:Be.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(e,t).updatePriority(this.priorityNode_)}updateChild(e,t){const r=Y(e);return r===null?t:t.isEmpty()&&r!==".priority"?this:(O(r!==".priority"||Fn(e)===1,".priority must be the last token in a path"),this.updateImmediateChild(r,Be.__childrenNodeConstructor.EMPTY_NODE.updateChild(_e(e),t)))}isEmpty(){return!1}numChildren(){return 0}forEachChild(e,t){return!1}val(e){return e&&!this.getPriority().isEmpty()?{".value":this.getValue(),".priority":this.getPriority().val()}:this.getValue()}hash(){if(this.lazyHash_===null){let e="";this.priorityNode_.isEmpty()||(e+="priority:"+NE(this.priorityNode_.val())+":");const t=typeof this.value_;e+=t+":",t==="number"?e+=cE(this.value_):e+=this.value_,this.lazyHash_=oE(e)}return this.lazyHash_}getValue(){return this.value_}compareTo(e){return e===Be.__childrenNodeConstructor.EMPTY_NODE?1:e instanceof Be.__childrenNodeConstructor?-1:(O(e.isLeafNode(),"Unknown node type"),this.compareToLeafNode_(e))}compareToLeafNode_(e){const t=typeof e.value_,r=typeof this.value_,s=Be.VALUE_TYPE_ORDER.indexOf(t),i=Be.VALUE_TYPE_ORDER.indexOf(r);return O(s>=0,"Unknown leaf type: "+t),O(i>=0,"Unknown leaf type: "+r),s===i?r==="object"?0:this.value_<e.value_?-1:this.value_===e.value_?0:1:i-s}withIndex(){return this}isIndexed(){return!0}equals(e){if(e===this)return!0;if(e.isLeafNode()){const t=e;return this.value_===t.value_&&this.priorityNode_.equals(t.priorityNode_)}else return!1}}Be.VALUE_TYPE_ORDER=["object","boolean","number","string"];/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let DE,xE;function s0(n){DE=n}function i0(n){xE=n}class o0 extends Qc{compare(e,t){const r=e.node.getPriority(),s=t.node.getPriority(),i=r.compareTo(s);return i===0?Mr(e.name,t.name):i}isDefinedOn(e){return!e.getPriority().isEmpty()}indexedValueChanged(e,t){return!e.getPriority().equals(t.getPriority())}minPost(){return Z.MIN}maxPost(){return new Z(Cr,new Be("[PRIORITY-POST]",xE))}makePost(e,t){const r=DE(e);return new Z(t,new Be("[PRIORITY-POST]",r))}toString(){return".priority"}}const ve=new o0;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const a0=Math.log(2);class c0{constructor(e){const t=i=>parseInt(Math.log(i)/a0,10),r=i=>parseInt(Array(i+1).join("1"),2);this.count=t(e+1),this.current_=this.count-1;const s=r(this.count);this.bits_=e+1&s}nextBitIsOne(){const e=!(this.bits_&1<<this.current_);return this.current_--,e}}const Za=function(n,e,t,r){n.sort(e);const s=function(l,u){const d=u-l;let f,_;if(d===0)return null;if(d===1)return f=n[l],_=t?t(f):f,new ze(_,f.node,ze.BLACK,null,null);{const g=parseInt(d/2,10)+l,v=s(l,g),C=s(g+1,u);return f=n[g],_=t?t(f):f,new ze(_,f.node,ze.BLACK,v,C)}},i=function(l){let u=null,d=null,f=n.length;const _=function(v,C){const N=f-v,V=f;f-=v;const B=s(N+1,V),U=n[N],$=t?t(U):U;g(new ze($,U.node,C,null,B))},g=function(v){u?(u.left=v,u=v):(d=v,u=v)};for(let v=0;v<l.count;++v){const C=l.nextBitIsOne(),N=Math.pow(2,l.count-(v+1));C?_(N,ze.BLACK):(_(N,ze.BLACK),_(N,ze.RED))}return d},o=new c0(n.length),a=i(o);return new lt(r||e,a)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Kl;const Kr={};class Qt{static get Default(){return O(Kr&&ve,"ChildrenNode.ts has not been loaded"),Kl=Kl||new Qt({".priority":Kr},{".priority":ve}),Kl}constructor(e,t){this.indexes_=e,this.indexSet_=t}get(e){const t=is(this.indexes_,e);if(!t)throw new Error("No index defined for "+e);return t instanceof lt?t:null}hasIndex(e){return $t(this.indexSet_,e.toString())}addIndex(e,t){O(e!==ns,"KeyIndex always exists and isn't meant to be added to the IndexMap.");const r=[];let s=!1;const i=t.getIterator(Z.Wrap);let o=i.getNext();for(;o;)s=s||e.isDefinedOn(o.node),r.push(o),o=i.getNext();let a;s?a=Za(r,e.getCompare()):a=Kr;const l=e.toString(),u={...this.indexSet_};u[l]=e;const d={...this.indexes_};return d[l]=a,new Qt(d,u)}addToIndexes(e,t){const r=ka(this.indexes_,(s,i)=>{const o=is(this.indexSet_,i);if(O(o,"Missing index implementation for "+i),s===Kr)if(o.isDefinedOn(e.node)){const a=[],l=t.getIterator(Z.Wrap);let u=l.getNext();for(;u;)u.name!==e.name&&a.push(u),u=l.getNext();return a.push(e),Za(a,o.getCompare())}else return Kr;else{const a=t.get(e.name);let l=s;return a&&(l=l.remove(new Z(e.name,a))),l.insert(e,e.node)}});return new Qt(r,this.indexSet_)}removeFromIndexes(e,t){const r=ka(this.indexes_,s=>{if(s===Kr)return s;{const i=t.get(e.name);return i?s.remove(new Z(e.name,i)):s}});return new Qt(r,this.indexSet_)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Ti;class W{static get EMPTY_NODE(){return Ti||(Ti=new W(new lt(wd),null,Qt.Default))}constructor(e,t,r){this.children_=e,this.priorityNode_=t,this.indexMap_=r,this.lazyHash_=null,this.priorityNode_&&kE(this.priorityNode_),this.children_.isEmpty()&&O(!this.priorityNode_||this.priorityNode_.isEmpty(),"An empty node cannot have a priority")}isLeafNode(){return!1}getPriority(){return this.priorityNode_||Ti}updatePriority(e){return this.children_.isEmpty()?this:new W(this.children_,e,this.indexMap_)}getImmediateChild(e){if(e===".priority")return this.getPriority();{const t=this.children_.get(e);return t===null?Ti:t}}getChild(e){const t=Y(e);return t===null?this:this.getImmediateChild(t).getChild(_e(e))}hasChild(e){return this.children_.get(e)!==null}updateImmediateChild(e,t){if(O(t,"We should always be passing snapshot nodes"),e===".priority")return this.updatePriority(t);{const r=new Z(e,t);let s,i;t.isEmpty()?(s=this.children_.remove(e),i=this.indexMap_.removeFromIndexes(r,this.children_)):(s=this.children_.insert(e,t),i=this.indexMap_.addToIndexes(r,this.children_));const o=s.isEmpty()?Ti:this.priorityNode_;return new W(s,o,i)}}updateChild(e,t){const r=Y(e);if(r===null)return t;{O(Y(e)!==".priority"||Fn(e)===1,".priority must be the last token in a path");const s=this.getImmediateChild(r).updateChild(_e(e),t);return this.updateImmediateChild(r,s)}}isEmpty(){return this.children_.isEmpty()}numChildren(){return this.children_.count()}val(e){if(this.isEmpty())return null;const t={};let r=0,s=0,i=!0;if(this.forEachChild(ve,(o,a)=>{t[o]=a.val(e),r++,i&&W.INTEGER_REGEXP_.test(o)?s=Math.max(s,Number(o)):i=!1}),!e&&i&&s<2*r){const o=[];for(const a in t)o[a]=t[a];return o}else return e&&!this.getPriority().isEmpty()&&(t[".priority"]=this.getPriority().val()),t}hash(){if(this.lazyHash_===null){let e="";this.getPriority().isEmpty()||(e+="priority:"+NE(this.getPriority().val())+":"),this.forEachChild(ve,(t,r)=>{const s=r.hash();s!==""&&(e+=":"+t+":"+s)}),this.lazyHash_=e===""?"":oE(e)}return this.lazyHash_}getPredecessorChildName(e,t,r){const s=this.resolveIndex_(r);if(s){const i=s.getPredecessorKey(new Z(e,t));return i?i.name:null}else return this.children_.getPredecessorKey(e)}getFirstChildName(e){const t=this.resolveIndex_(e);if(t){const r=t.minKey();return r&&r.name}else return this.children_.minKey()}getFirstChild(e){const t=this.getFirstChildName(e);return t?new Z(t,this.children_.get(t)):null}getLastChildName(e){const t=this.resolveIndex_(e);if(t){const r=t.maxKey();return r&&r.name}else return this.children_.maxKey()}getLastChild(e){const t=this.getLastChildName(e);return t?new Z(t,this.children_.get(t)):null}forEachChild(e,t){const r=this.resolveIndex_(e);return r?r.inorderTraversal(s=>t(s.name,s.node)):this.children_.inorderTraversal(t)}getIterator(e){return this.getIteratorFrom(e.minPost(),e)}getIteratorFrom(e,t){const r=this.resolveIndex_(t);if(r)return r.getIteratorFrom(e,s=>s);{const s=this.children_.getIteratorFrom(e.name,Z.Wrap);let i=s.peek();for(;i!=null&&t.compare(i,e)<0;)s.getNext(),i=s.peek();return s}}getReverseIterator(e){return this.getReverseIteratorFrom(e.maxPost(),e)}getReverseIteratorFrom(e,t){const r=this.resolveIndex_(t);if(r)return r.getReverseIteratorFrom(e,s=>s);{const s=this.children_.getReverseIteratorFrom(e.name,Z.Wrap);let i=s.peek();for(;i!=null&&t.compare(i,e)>0;)s.getNext(),i=s.peek();return s}}compareTo(e){return this.isEmpty()?e.isEmpty()?0:-1:e.isLeafNode()||e.isEmpty()?1:e===Mo?-1:0}withIndex(e){if(e===ns||this.indexMap_.hasIndex(e))return this;{const t=this.indexMap_.addIndex(e,this.children_);return new W(this.children_,this.priorityNode_,t)}}isIndexed(e){return e===ns||this.indexMap_.hasIndex(e)}equals(e){if(e===this)return!0;if(e.isLeafNode())return!1;{const t=e;if(this.getPriority().equals(t.getPriority()))if(this.children_.count()===t.children_.count()){const r=this.getIterator(ve),s=t.getIterator(ve);let i=r.getNext(),o=s.getNext();for(;i&&o;){if(i.name!==o.name||!i.node.equals(o.node))return!1;i=r.getNext(),o=s.getNext()}return i===null&&o===null}else return!1;else return!1}}resolveIndex_(e){return e===ns?null:this.indexMap_.get(e.toString())}}W.INTEGER_REGEXP_=/^(0|[1-9]\d*)$/;class l0 extends W{constructor(){super(new lt(wd),W.EMPTY_NODE,Qt.Default)}compareTo(e){return e===this?0:1}equals(e){return e===this}getPriority(){return this}getImmediateChild(e){return W.EMPTY_NODE}isEmpty(){return!1}}const Mo=new l0;Object.defineProperties(Z,{MIN:{value:new Z(Ps,W.EMPTY_NODE)},MAX:{value:new Z(Cr,Mo)}});PE.__EMPTY_NODE=W.EMPTY_NODE;Be.__childrenNodeConstructor=W;r0(Mo);i0(Mo);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const u0=!0;function Pe(n,e=null){if(n===null)return W.EMPTY_NODE;if(typeof n=="object"&&".priority"in n&&(e=n[".priority"]),O(e===null||typeof e=="string"||typeof e=="number"||typeof e=="object"&&".sv"in e,"Invalid priority type found: "+typeof e),typeof n=="object"&&".value"in n&&n[".value"]!==null&&(n=n[".value"]),typeof n!="object"||".sv"in n){const t=n;return new Be(t,Pe(e))}if(!(n instanceof Array)&&u0){const t=[];let r=!1;if(Xe(n,(o,a)=>{if(o.substring(0,1)!=="."){const l=Pe(a);l.isEmpty()||(r=r||!l.getPriority().isEmpty(),t.push(new Z(o,l)))}}),t.length===0)return W.EMPTY_NODE;const i=Za(t,n0,o=>o.name,wd);if(r){const o=Za(t,ve.getCompare());return new W(i,Pe(e),new Qt({".priority":o},{".priority":ve}))}else return new W(i,Pe(e),Qt.Default)}else{let t=W.EMPTY_NODE;return Xe(n,(r,s)=>{if($t(n,r)&&r.substring(0,1)!=="."){const i=Pe(s);(i.isLeafNode()||!i.isEmpty())&&(t=t.updateImmediateChild(r,i))}}),t.updatePriority(Pe(e))}}s0(Pe);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class h0 extends Qc{constructor(e){super(),this.indexPath_=e,O(!J(e)&&Y(e)!==".priority","Can't create PathIndex with empty path or .priority key")}extractChild(e){return e.getChild(this.indexPath_)}isDefinedOn(e){return!e.getChild(this.indexPath_).isEmpty()}compare(e,t){const r=this.extractChild(e.node),s=this.extractChild(t.node),i=r.compareTo(s);return i===0?Mr(e.name,t.name):i}makePost(e,t){const r=Pe(e),s=W.EMPTY_NODE.updateChild(this.indexPath_,r);return new Z(t,s)}maxPost(){const e=W.EMPTY_NODE.updateChild(this.indexPath_,Mo);return new Z(Cr,e)}toString(){return lo(this.indexPath_,0).join("/")}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class d0 extends Qc{compare(e,t){const r=e.node.compareTo(t.node);return r===0?Mr(e.name,t.name):r}isDefinedOn(e){return!0}indexedValueChanged(e,t){return!e.equals(t)}minPost(){return Z.MIN}maxPost(){return Z.MAX}makePost(e,t){const r=Pe(e);return new Z(t,r)}toString(){return".value"}}const f0=new d0;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function VE(n){return{type:"value",snapshotNode:n}}function Ns(n,e){return{type:"child_added",snapshotNode:e,childName:n}}function uo(n,e){return{type:"child_removed",snapshotNode:e,childName:n}}function ho(n,e,t){return{type:"child_changed",snapshotNode:e,childName:n,oldSnap:t}}function p0(n,e){return{type:"child_moved",snapshotNode:e,childName:n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vd{constructor(e){this.index_=e}updateChild(e,t,r,s,i,o){O(e.isIndexed(this.index_),"A node must be indexed if only a child is updated");const a=e.getImmediateChild(t);return a.getChild(s).equals(r.getChild(s))&&a.isEmpty()===r.isEmpty()||(o!=null&&(r.isEmpty()?e.hasChild(t)?o.trackChildChange(uo(t,a)):O(e.isLeafNode(),"A child remove without an old child only makes sense on a leaf node"):a.isEmpty()?o.trackChildChange(Ns(t,r)):o.trackChildChange(ho(t,r,a))),e.isLeafNode()&&r.isEmpty())?e:e.updateImmediateChild(t,r).withIndex(this.index_)}updateFullNode(e,t,r){return r!=null&&(e.isLeafNode()||e.forEachChild(ve,(s,i)=>{t.hasChild(s)||r.trackChildChange(uo(s,i))}),t.isLeafNode()||t.forEachChild(ve,(s,i)=>{if(e.hasChild(s)){const o=e.getImmediateChild(s);o.equals(i)||r.trackChildChange(ho(s,i,o))}else r.trackChildChange(Ns(s,i))})),t.withIndex(this.index_)}updatePriority(e,t){return e.isEmpty()?W.EMPTY_NODE:e.updatePriority(t)}filtersNodes(){return!1}getIndexedFilter(){return this}getIndex(){return this.index_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fo{constructor(e){this.indexedFilter_=new vd(e.getIndex()),this.index_=e.getIndex(),this.startPost_=fo.getStartPost_(e),this.endPost_=fo.getEndPost_(e),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}getStartPost(){return this.startPost_}getEndPost(){return this.endPost_}matches(e){const t=this.startIsInclusive_?this.index_.compare(this.getStartPost(),e)<=0:this.index_.compare(this.getStartPost(),e)<0,r=this.endIsInclusive_?this.index_.compare(e,this.getEndPost())<=0:this.index_.compare(e,this.getEndPost())<0;return t&&r}updateChild(e,t,r,s,i,o){return this.matches(new Z(t,r))||(r=W.EMPTY_NODE),this.indexedFilter_.updateChild(e,t,r,s,i,o)}updateFullNode(e,t,r){t.isLeafNode()&&(t=W.EMPTY_NODE);let s=t.withIndex(this.index_);s=s.updatePriority(W.EMPTY_NODE);const i=this;return t.forEachChild(ve,(o,a)=>{i.matches(new Z(o,a))||(s=s.updateImmediateChild(o,W.EMPTY_NODE))}),this.indexedFilter_.updateFullNode(e,s,r)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.indexedFilter_}getIndex(){return this.index_}static getStartPost_(e){if(e.hasStart()){const t=e.getIndexStartName();return e.getIndex().makePost(e.getIndexStartValue(),t)}else return e.getIndex().minPost()}static getEndPost_(e){if(e.hasEnd()){const t=e.getIndexEndName();return e.getIndex().makePost(e.getIndexEndValue(),t)}else return e.getIndex().maxPost()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _0{constructor(e){this.withinDirectionalStart=t=>this.reverse_?this.withinEndPost(t):this.withinStartPost(t),this.withinDirectionalEnd=t=>this.reverse_?this.withinStartPost(t):this.withinEndPost(t),this.withinStartPost=t=>{const r=this.index_.compare(this.rangedFilter_.getStartPost(),t);return this.startIsInclusive_?r<=0:r<0},this.withinEndPost=t=>{const r=this.index_.compare(t,this.rangedFilter_.getEndPost());return this.endIsInclusive_?r<=0:r<0},this.rangedFilter_=new fo(e),this.index_=e.getIndex(),this.limit_=e.getLimit(),this.reverse_=!e.isViewFromLeft(),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}updateChild(e,t,r,s,i,o){return this.rangedFilter_.matches(new Z(t,r))||(r=W.EMPTY_NODE),e.getImmediateChild(t).equals(r)?e:e.numChildren()<this.limit_?this.rangedFilter_.getIndexedFilter().updateChild(e,t,r,s,i,o):this.fullLimitUpdateChild_(e,t,r,i,o)}updateFullNode(e,t,r){let s;if(t.isLeafNode()||t.isEmpty())s=W.EMPTY_NODE.withIndex(this.index_);else if(this.limit_*2<t.numChildren()&&t.isIndexed(this.index_)){s=W.EMPTY_NODE.withIndex(this.index_);let i;this.reverse_?i=t.getReverseIteratorFrom(this.rangedFilter_.getEndPost(),this.index_):i=t.getIteratorFrom(this.rangedFilter_.getStartPost(),this.index_);let o=0;for(;i.hasNext()&&o<this.limit_;){const a=i.getNext();if(this.withinDirectionalStart(a))if(this.withinDirectionalEnd(a))s=s.updateImmediateChild(a.name,a.node),o++;else break;else continue}}else{s=t.withIndex(this.index_),s=s.updatePriority(W.EMPTY_NODE);let i;this.reverse_?i=s.getReverseIterator(this.index_):i=s.getIterator(this.index_);let o=0;for(;i.hasNext();){const a=i.getNext();o<this.limit_&&this.withinDirectionalStart(a)&&this.withinDirectionalEnd(a)?o++:s=s.updateImmediateChild(a.name,W.EMPTY_NODE)}}return this.rangedFilter_.getIndexedFilter().updateFullNode(e,s,r)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.rangedFilter_.getIndexedFilter()}getIndex(){return this.index_}fullLimitUpdateChild_(e,t,r,s,i){let o;if(this.reverse_){const f=this.index_.getCompare();o=(_,g)=>f(g,_)}else o=this.index_.getCompare();const a=e;O(a.numChildren()===this.limit_,"");const l=new Z(t,r),u=this.reverse_?a.getFirstChild(this.index_):a.getLastChild(this.index_),d=this.rangedFilter_.matches(l);if(a.hasChild(t)){const f=a.getImmediateChild(t);let _=s.getChildAfterChild(this.index_,u,this.reverse_);for(;_!=null&&(_.name===t||a.hasChild(_.name));)_=s.getChildAfterChild(this.index_,_,this.reverse_);const g=_==null?1:o(_,l);if(d&&!r.isEmpty()&&g>=0)return i!=null&&i.trackChildChange(ho(t,r,f)),a.updateImmediateChild(t,r);{i!=null&&i.trackChildChange(uo(t,f));const C=a.updateImmediateChild(t,W.EMPTY_NODE);return _!=null&&this.rangedFilter_.matches(_)?(i!=null&&i.trackChildChange(Ns(_.name,_.node)),C.updateImmediateChild(_.name,_.node)):C}}else return r.isEmpty()?e:d&&o(u,l)>=0?(i!=null&&(i.trackChildChange(uo(u.name,u.node)),i.trackChildChange(Ns(t,r))),a.updateImmediateChild(t,r).updateImmediateChild(u.name,W.EMPTY_NODE)):e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ad{constructor(){this.limitSet_=!1,this.startSet_=!1,this.startNameSet_=!1,this.startAfterSet_=!1,this.endSet_=!1,this.endNameSet_=!1,this.endBeforeSet_=!1,this.limit_=0,this.viewFrom_="",this.indexStartValue_=null,this.indexStartName_="",this.indexEndValue_=null,this.indexEndName_="",this.index_=ve}hasStart(){return this.startSet_}isViewFromLeft(){return this.viewFrom_===""?this.startSet_:this.viewFrom_==="l"}getIndexStartValue(){return O(this.startSet_,"Only valid if start has been set"),this.indexStartValue_}getIndexStartName(){return O(this.startSet_,"Only valid if start has been set"),this.startNameSet_?this.indexStartName_:Ps}hasEnd(){return this.endSet_}getIndexEndValue(){return O(this.endSet_,"Only valid if end has been set"),this.indexEndValue_}getIndexEndName(){return O(this.endSet_,"Only valid if end has been set"),this.endNameSet_?this.indexEndName_:Cr}hasLimit(){return this.limitSet_}hasAnchoredLimit(){return this.limitSet_&&this.viewFrom_!==""}getLimit(){return O(this.limitSet_,"Only valid if limit has been set"),this.limit_}getIndex(){return this.index_}loadsAllData(){return!(this.startSet_||this.endSet_||this.limitSet_)}isDefault(){return this.loadsAllData()&&this.index_===ve}copy(){const e=new Ad;return e.limitSet_=this.limitSet_,e.limit_=this.limit_,e.startSet_=this.startSet_,e.startAfterSet_=this.startAfterSet_,e.indexStartValue_=this.indexStartValue_,e.startNameSet_=this.startNameSet_,e.indexStartName_=this.indexStartName_,e.endSet_=this.endSet_,e.endBeforeSet_=this.endBeforeSet_,e.indexEndValue_=this.indexEndValue_,e.endNameSet_=this.endNameSet_,e.indexEndName_=this.indexEndName_,e.index_=this.index_,e.viewFrom_=this.viewFrom_,e}}function m0(n){return n.loadsAllData()?new vd(n.getIndex()):n.hasLimit()?new _0(n):new fo(n)}function Z_(n){const e={};if(n.isDefault())return e;let t;if(n.index_===ve?t="$priority":n.index_===f0?t="$value":n.index_===ns?t="$key":(O(n.index_ instanceof h0,"Unrecognized index type!"),t=n.index_.toString()),e.orderBy=Me(t),n.startSet_){const r=n.startAfterSet_?"startAfter":"startAt";e[r]=Me(n.indexStartValue_),n.startNameSet_&&(e[r]+=","+Me(n.indexStartName_))}if(n.endSet_){const r=n.endBeforeSet_?"endBefore":"endAt";e[r]=Me(n.indexEndValue_),n.endNameSet_&&(e[r]+=","+Me(n.indexEndName_))}return n.limitSet_&&(n.isViewFromLeft()?e.limitToFirst=n.limit_:e.limitToLast=n.limit_),e}function em(n){const e={};if(n.startSet_&&(e.sp=n.indexStartValue_,n.startNameSet_&&(e.sn=n.indexStartName_),e.sin=!n.startAfterSet_),n.endSet_&&(e.ep=n.indexEndValue_,n.endNameSet_&&(e.en=n.indexEndName_),e.ein=!n.endBeforeSet_),n.limitSet_){e.l=n.limit_;let t=n.viewFrom_;t===""&&(n.isViewFromLeft()?t="l":t="r"),e.vf=t}return n.index_!==ve&&(e.i=n.index_.toString()),e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ec extends bE{reportStats(e){throw new Error("Method not implemented.")}static getListenId_(e,t){return t!==void 0?"tag$"+t:(O(e._queryParams.isDefault(),"should have a tag if it's not a default query."),e._path.toString())}constructor(e,t,r,s){super(),this.repoInfo_=e,this.onDataUpdate_=t,this.authTokenProvider_=r,this.appCheckTokenProvider_=s,this.log_=Oo("p:rest:"),this.listens_={}}listen(e,t,r,s){const i=e._path.toString();this.log_("Listen called for "+i+" "+e._queryIdentifier);const o=ec.getListenId_(e,r),a={};this.listens_[o]=a;const l=Z_(e._queryParams);this.restRequest_(i+".json",l,(u,d)=>{let f=d;if(u===404&&(f=null,u=null),u===null&&this.onDataUpdate_(i,f,!1,r),is(this.listens_,o)===a){let _;u?u===401?_="permission_denied":_="rest_error:"+u:_="ok",s(_,null)}})}unlisten(e,t){const r=ec.getListenId_(e,t);delete this.listens_[r]}get(e){const t=Z_(e._queryParams),r=e._path.toString(),s=new Wt;return this.restRequest_(r+".json",t,(i,o)=>{let a=o;i===404&&(a=null,i=null),i===null?(this.onDataUpdate_(r,a,!1,null),s.resolve(a)):s.reject(new Error(a))}),s.promise}refreshAuthToken(e){}restRequest_(e,t={},r){return t.format="export",Promise.all([this.authTokenProvider_.getToken(!1),this.appCheckTokenProvider_.getToken(!1)]).then(([s,i])=>{s&&s.accessToken&&(t.auth=s.accessToken),i&&i.token&&(t.ac=i.token);const o=(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host+e+"?ns="+this.repoInfo_.namespace+eh(t);this.log_("Sending REST request for "+o);const a=new XMLHttpRequest;a.onreadystatechange=()=>{if(r&&a.readyState===4){this.log_("REST Response for "+o+" received. status:",a.status,"response:",a.responseText);let l=null;if(a.status>=200&&a.status<300){try{l=Ki(a.responseText)}catch{ft("Failed to parse JSON response for "+o+": "+a.responseText)}r(null,l)}else a.status!==401&&a.status!==404&&ft("Got unsuccessful REST response for "+o+" Status: "+a.status),r(a.status);r=null}},a.open("GET",o,!0),a.send()})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class g0{constructor(){this.rootNode_=W.EMPTY_NODE}getNode(e){return this.rootNode_.getChild(e)}updateSnapshot(e,t){this.rootNode_=this.rootNode_.updateChild(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function tc(){return{value:null,children:new Map}}function Qs(n,e,t){if(J(e))n.value=t,n.children.clear();else if(n.value!==null)n.value=n.value.updateChild(e,t);else{const r=Y(e);n.children.has(r)||n.children.set(r,tc());const s=n.children.get(r);e=_e(e),Qs(s,e,t)}}function Lu(n,e){if(J(e))return n.value=null,n.children.clear(),!0;if(n.value!==null){if(n.value.isLeafNode())return!1;{const t=n.value;return n.value=null,t.forEachChild(ve,(r,s)=>{Qs(n,new de(r),s)}),Lu(n,e)}}else if(n.children.size>0){const t=Y(e);return e=_e(e),n.children.has(t)&&Lu(n.children.get(t),e)&&n.children.delete(t),n.children.size===0}else return!0}function Fu(n,e,t){n.value!==null?t(e,n.value):y0(n,(r,s)=>{const i=new de(e.toString()+"/"+r);Fu(s,i,t)})}function y0(n,e){n.children.forEach((t,r)=>{e(r,t)})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class I0{constructor(e){this.collection_=e,this.last_=null}get(){const e=this.collection_.get(),t={...e};return this.last_&&Xe(this.last_,(r,s)=>{t[r]=t[r]-s}),this.last_=e,t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tm=10*1e3,E0=30*1e3,T0=300*1e3;class w0{constructor(e,t){this.server_=t,this.statsToReport_={},this.statsListener_=new I0(e);const r=tm+(E0-tm)*Math.random();qi(this.reportStats_.bind(this),Math.floor(r))}reportStats_(){const e=this.statsListener_.get(),t={};let r=!1;Xe(e,(s,i)=>{i>0&&$t(this.statsToReport_,s)&&(t[s]=i,r=!0)}),r&&this.server_.reportStats(t),qi(this.reportStats_.bind(this),Math.floor(Math.random()*2*T0))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var bt;(function(n){n[n.OVERWRITE=0]="OVERWRITE",n[n.MERGE=1]="MERGE",n[n.ACK_USER_WRITE=2]="ACK_USER_WRITE",n[n.LISTEN_COMPLETE=3]="LISTEN_COMPLETE"})(bt||(bt={}));function OE(){return{fromUser:!0,fromServer:!1,queryId:null,tagged:!1}}function bd(){return{fromUser:!1,fromServer:!0,queryId:null,tagged:!1}}function Rd(n){return{fromUser:!1,fromServer:!0,queryId:n,tagged:!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nc{constructor(e,t,r){this.path=e,this.affectedTree=t,this.revert=r,this.type=bt.ACK_USER_WRITE,this.source=OE()}operationForChild(e){if(J(this.path)){if(this.affectedTree.value!=null)return O(this.affectedTree.children.isEmpty(),"affectedTree should not have overlapping affected paths."),this;{const t=this.affectedTree.subtree(new de(e));return new nc(oe(),t,this.revert)}}else return O(Y(this.path)===e,"operationForChild called for unrelated child."),new nc(_e(this.path),this.affectedTree,this.revert)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class po{constructor(e,t){this.source=e,this.path=t,this.type=bt.LISTEN_COMPLETE}operationForChild(e){return J(this.path)?new po(this.source,oe()):new po(this.source,_e(this.path))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pr{constructor(e,t,r){this.source=e,this.path=t,this.snap=r,this.type=bt.OVERWRITE}operationForChild(e){return J(this.path)?new Pr(this.source,oe(),this.snap.getImmediateChild(e)):new Pr(this.source,_e(this.path),this.snap)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _o{constructor(e,t,r){this.source=e,this.path=t,this.children=r,this.type=bt.MERGE}operationForChild(e){if(J(this.path)){const t=this.children.subtree(new de(e));return t.isEmpty()?null:t.value?new Pr(this.source,oe(),t.value):new _o(this.source,oe(),t)}else return O(Y(this.path)===e,"Can't get a merge for a child not on the path of the operation"),new _o(this.source,_e(this.path),this.children)}toString(){return"Operation("+this.path+": "+this.source.toString()+" merge: "+this.children.toString()+")"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Un{constructor(e,t,r){this.node_=e,this.fullyInitialized_=t,this.filtered_=r}isFullyInitialized(){return this.fullyInitialized_}isFiltered(){return this.filtered_}isCompleteForPath(e){if(J(e))return this.isFullyInitialized()&&!this.filtered_;const t=Y(e);return this.isCompleteForChild(t)}isCompleteForChild(e){return this.isFullyInitialized()&&!this.filtered_||this.node_.hasChild(e)}getNode(){return this.node_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class v0{constructor(e){this.query_=e,this.index_=this.query_._queryParams.getIndex()}}function A0(n,e,t,r){const s=[],i=[];return e.forEach(o=>{o.type==="child_changed"&&n.index_.indexedValueChanged(o.oldSnap,o.snapshotNode)&&i.push(p0(o.childName,o.snapshotNode))}),wi(n,s,"child_removed",e,r,t),wi(n,s,"child_added",e,r,t),wi(n,s,"child_moved",i,r,t),wi(n,s,"child_changed",e,r,t),wi(n,s,"value",e,r,t),s}function wi(n,e,t,r,s,i){const o=r.filter(a=>a.type===t);o.sort((a,l)=>R0(n,a,l)),o.forEach(a=>{const l=b0(n,a,i);s.forEach(u=>{u.respondsTo(a.type)&&e.push(u.createEvent(l,n.query_))})})}function b0(n,e,t){return e.type==="value"||e.type==="child_removed"||(e.prevName=t.getPredecessorChildName(e.childName,e.snapshotNode,n.index_)),e}function R0(n,e,t){if(e.childName==null||t.childName==null)throw xs("Should only compare child_ events.");const r=new Z(e.childName,e.snapshotNode),s=new Z(t.childName,t.snapshotNode);return n.index_.compare(r,s)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Yc(n,e){return{eventCache:n,serverCache:e}}function Gi(n,e,t,r){return Yc(new Un(e,t,r),n.serverCache)}function ME(n,e,t,r){return Yc(n.eventCache,new Un(e,t,r))}function rc(n){return n.eventCache.isFullyInitialized()?n.eventCache.getNode():null}function Nr(n){return n.serverCache.isFullyInitialized()?n.serverCache.getNode():null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Hl;const S0=()=>(Hl||(Hl=new lt(hN)),Hl);class ge{static fromObject(e){let t=new ge(null);return Xe(e,(r,s)=>{t=t.set(new de(r),s)}),t}constructor(e,t=S0()){this.value=e,this.children=t}isEmpty(){return this.value===null&&this.children.isEmpty()}findRootMostMatchingPathAndValue(e,t){if(this.value!=null&&t(this.value))return{path:oe(),value:this.value};if(J(e))return null;{const r=Y(e),s=this.children.get(r);if(s!==null){const i=s.findRootMostMatchingPathAndValue(_e(e),t);return i!=null?{path:ke(new de(r),i.path),value:i.value}:null}else return null}}findRootMostValueAndPath(e){return this.findRootMostMatchingPathAndValue(e,()=>!0)}subtree(e){if(J(e))return this;{const t=Y(e),r=this.children.get(t);return r!==null?r.subtree(_e(e)):new ge(null)}}set(e,t){if(J(e))return new ge(t,this.children);{const r=Y(e),i=(this.children.get(r)||new ge(null)).set(_e(e),t),o=this.children.insert(r,i);return new ge(this.value,o)}}remove(e){if(J(e))return this.children.isEmpty()?new ge(null):new ge(null,this.children);{const t=Y(e),r=this.children.get(t);if(r){const s=r.remove(_e(e));let i;return s.isEmpty()?i=this.children.remove(t):i=this.children.insert(t,s),this.value===null&&i.isEmpty()?new ge(null):new ge(this.value,i)}else return this}}get(e){if(J(e))return this.value;{const t=Y(e),r=this.children.get(t);return r?r.get(_e(e)):null}}setTree(e,t){if(J(e))return t;{const r=Y(e),i=(this.children.get(r)||new ge(null)).setTree(_e(e),t);let o;return i.isEmpty()?o=this.children.remove(r):o=this.children.insert(r,i),new ge(this.value,o)}}fold(e){return this.fold_(oe(),e)}fold_(e,t){const r={};return this.children.inorderTraversal((s,i)=>{r[s]=i.fold_(ke(e,s),t)}),t(e,this.value,r)}findOnPath(e,t){return this.findOnPath_(e,oe(),t)}findOnPath_(e,t,r){const s=this.value?r(t,this.value):!1;if(s)return s;if(J(e))return null;{const i=Y(e),o=this.children.get(i);return o?o.findOnPath_(_e(e),ke(t,i),r):null}}foreachOnPath(e,t){return this.foreachOnPath_(e,oe(),t)}foreachOnPath_(e,t,r){if(J(e))return this;{this.value&&r(t,this.value);const s=Y(e),i=this.children.get(s);return i?i.foreachOnPath_(_e(e),ke(t,s),r):new ge(null)}}foreach(e){this.foreach_(oe(),e)}foreach_(e,t){this.children.inorderTraversal((r,s)=>{s.foreach_(ke(e,r),t)}),this.value&&t(e,this.value)}foreachChild(e){this.children.inorderTraversal((t,r)=>{r.value&&e(t,r.value)})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ct{constructor(e){this.writeTree_=e}static empty(){return new Ct(new ge(null))}}function zi(n,e,t){if(J(e))return new Ct(new ge(t));{const r=n.writeTree_.findRootMostValueAndPath(e);if(r!=null){const s=r.path;let i=r.value;const o=nt(s,e);return i=i.updateChild(o,t),new Ct(n.writeTree_.set(s,i))}else{const s=new ge(t),i=n.writeTree_.setTree(e,s);return new Ct(i)}}}function nm(n,e,t){let r=n;return Xe(t,(s,i)=>{r=zi(r,ke(e,s),i)}),r}function rm(n,e){if(J(e))return Ct.empty();{const t=n.writeTree_.setTree(e,new ge(null));return new Ct(t)}}function Uu(n,e){return Lr(n,e)!=null}function Lr(n,e){const t=n.writeTree_.findRootMostValueAndPath(e);return t!=null?n.writeTree_.get(t.path).getChild(nt(t.path,e)):null}function sm(n){const e=[],t=n.writeTree_.value;return t!=null?t.isLeafNode()||t.forEachChild(ve,(r,s)=>{e.push(new Z(r,s))}):n.writeTree_.children.inorderTraversal((r,s)=>{s.value!=null&&e.push(new Z(r,s.value))}),e}function Cn(n,e){if(J(e))return n;{const t=Lr(n,e);return t!=null?new Ct(new ge(t)):new Ct(n.writeTree_.subtree(e))}}function Bu(n){return n.writeTree_.isEmpty()}function ks(n,e){return LE(oe(),n.writeTree_,e)}function LE(n,e,t){if(e.value!=null)return t.updateChild(n,e.value);{let r=null;return e.children.inorderTraversal((s,i)=>{s===".priority"?(O(i.value!==null,"Priority writes must always be leaf nodes"),r=i.value):t=LE(ke(n,s),i,t)}),!t.getChild(n).isEmpty()&&r!==null&&(t=t.updateChild(ke(n,".priority"),r)),t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Jc(n,e){return qE(e,n)}function C0(n,e,t,r,s){O(r>n.lastWriteId,"Stacking an older write on top of newer ones"),s===void 0&&(s=!0),n.allWrites.push({path:e,snap:t,writeId:r,visible:s}),s&&(n.visibleWrites=zi(n.visibleWrites,e,t)),n.lastWriteId=r}function P0(n,e){for(let t=0;t<n.allWrites.length;t++){const r=n.allWrites[t];if(r.writeId===e)return r}return null}function N0(n,e){const t=n.allWrites.findIndex(a=>a.writeId===e);O(t>=0,"removeWrite called with nonexistent writeId.");const r=n.allWrites[t];n.allWrites.splice(t,1);let s=r.visible,i=!1,o=n.allWrites.length-1;for(;s&&o>=0;){const a=n.allWrites[o];a.visible&&(o>=t&&k0(a,r.path)?s=!1:Et(r.path,a.path)&&(i=!0)),o--}if(s){if(i)return D0(n),!0;if(r.snap)n.visibleWrites=rm(n.visibleWrites,r.path);else{const a=r.children;Xe(a,l=>{n.visibleWrites=rm(n.visibleWrites,ke(r.path,l))})}return!0}else return!1}function k0(n,e){if(n.snap)return Et(n.path,e);for(const t in n.children)if(n.children.hasOwnProperty(t)&&Et(ke(n.path,t),e))return!0;return!1}function D0(n){n.visibleWrites=FE(n.allWrites,x0,oe()),n.allWrites.length>0?n.lastWriteId=n.allWrites[n.allWrites.length-1].writeId:n.lastWriteId=-1}function x0(n){return n.visible}function FE(n,e,t){let r=Ct.empty();for(let s=0;s<n.length;++s){const i=n[s];if(e(i)){const o=i.path;let a;if(i.snap)Et(t,o)?(a=nt(t,o),r=zi(r,a,i.snap)):Et(o,t)&&(a=nt(o,t),r=zi(r,oe(),i.snap.getChild(a)));else if(i.children){if(Et(t,o))a=nt(t,o),r=nm(r,a,i.children);else if(Et(o,t))if(a=nt(o,t),J(a))r=nm(r,oe(),i.children);else{const l=is(i.children,Y(a));if(l){const u=l.getChild(_e(a));r=zi(r,oe(),u)}}}else throw xs("WriteRecord should have .snap or .children")}}return r}function UE(n,e,t,r,s){if(!r&&!s){const i=Lr(n.visibleWrites,e);if(i!=null)return i;{const o=Cn(n.visibleWrites,e);if(Bu(o))return t;if(t==null&&!Uu(o,oe()))return null;{const a=t||W.EMPTY_NODE;return ks(o,a)}}}else{const i=Cn(n.visibleWrites,e);if(!s&&Bu(i))return t;if(!s&&t==null&&!Uu(i,oe()))return null;{const o=function(u){return(u.visible||s)&&(!r||!~r.indexOf(u.writeId))&&(Et(u.path,e)||Et(e,u.path))},a=FE(n.allWrites,o,e),l=t||W.EMPTY_NODE;return ks(a,l)}}}function V0(n,e,t){let r=W.EMPTY_NODE;const s=Lr(n.visibleWrites,e);if(s)return s.isLeafNode()||s.forEachChild(ve,(i,o)=>{r=r.updateImmediateChild(i,o)}),r;if(t){const i=Cn(n.visibleWrites,e);return t.forEachChild(ve,(o,a)=>{const l=ks(Cn(i,new de(o)),a);r=r.updateImmediateChild(o,l)}),sm(i).forEach(o=>{r=r.updateImmediateChild(o.name,o.node)}),r}else{const i=Cn(n.visibleWrites,e);return sm(i).forEach(o=>{r=r.updateImmediateChild(o.name,o.node)}),r}}function O0(n,e,t,r,s){O(r||s,"Either existingEventSnap or existingServerSnap must exist");const i=ke(e,t);if(Uu(n.visibleWrites,i))return null;{const o=Cn(n.visibleWrites,i);return Bu(o)?s.getChild(t):ks(o,s.getChild(t))}}function M0(n,e,t,r){const s=ke(e,t),i=Lr(n.visibleWrites,s);if(i!=null)return i;if(r.isCompleteForChild(t)){const o=Cn(n.visibleWrites,s);return ks(o,r.getNode().getImmediateChild(t))}else return null}function L0(n,e){return Lr(n.visibleWrites,e)}function F0(n,e,t,r,s,i,o){let a;const l=Cn(n.visibleWrites,e),u=Lr(l,oe());if(u!=null)a=u;else if(t!=null)a=ks(l,t);else return[];if(a=a.withIndex(o),!a.isEmpty()&&!a.isLeafNode()){const d=[],f=o.getCompare(),_=i?a.getReverseIteratorFrom(r,o):a.getIteratorFrom(r,o);let g=_.getNext();for(;g&&d.length<s;)f(g,r)!==0&&d.push(g),g=_.getNext();return d}else return[]}function U0(){return{visibleWrites:Ct.empty(),allWrites:[],lastWriteId:-1}}function sc(n,e,t,r){return UE(n.writeTree,n.treePath,e,t,r)}function Sd(n,e){return V0(n.writeTree,n.treePath,e)}function im(n,e,t,r){return O0(n.writeTree,n.treePath,e,t,r)}function ic(n,e){return L0(n.writeTree,ke(n.treePath,e))}function B0(n,e,t,r,s,i){return F0(n.writeTree,n.treePath,e,t,r,s,i)}function Cd(n,e,t){return M0(n.writeTree,n.treePath,e,t)}function BE(n,e){return qE(ke(n.treePath,e),n.writeTree)}function qE(n,e){return{treePath:n,writeTree:e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class q0{constructor(){this.changeMap=new Map}trackChildChange(e){const t=e.type,r=e.childName;O(t==="child_added"||t==="child_changed"||t==="child_removed","Only child changes supported for tracking"),O(r!==".priority","Only non-priority child changes can be tracked.");const s=this.changeMap.get(r);if(s){const i=s.type;if(t==="child_added"&&i==="child_removed")this.changeMap.set(r,ho(r,e.snapshotNode,s.snapshotNode));else if(t==="child_removed"&&i==="child_added")this.changeMap.delete(r);else if(t==="child_removed"&&i==="child_changed")this.changeMap.set(r,uo(r,s.oldSnap));else if(t==="child_changed"&&i==="child_added")this.changeMap.set(r,Ns(r,e.snapshotNode));else if(t==="child_changed"&&i==="child_changed")this.changeMap.set(r,ho(r,e.snapshotNode,s.oldSnap));else throw xs("Illegal combination of changes: "+e+" occurred after "+s)}else this.changeMap.set(r,e)}getChanges(){return Array.from(this.changeMap.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class G0{getCompleteChild(e){return null}getChildAfterChild(e,t,r){return null}}const GE=new G0;class Pd{constructor(e,t,r=null){this.writes_=e,this.viewCache_=t,this.optCompleteServerCache_=r}getCompleteChild(e){const t=this.viewCache_.eventCache;if(t.isCompleteForChild(e))return t.getNode().getImmediateChild(e);{const r=this.optCompleteServerCache_!=null?new Un(this.optCompleteServerCache_,!0,!1):this.viewCache_.serverCache;return Cd(this.writes_,e,r)}}getChildAfterChild(e,t,r){const s=this.optCompleteServerCache_!=null?this.optCompleteServerCache_:Nr(this.viewCache_),i=B0(this.writes_,s,t,1,r,e);return i.length===0?null:i[0]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function z0(n){return{filter:n}}function $0(n,e){O(e.eventCache.getNode().isIndexed(n.filter.getIndex()),"Event snap not indexed"),O(e.serverCache.getNode().isIndexed(n.filter.getIndex()),"Server snap not indexed")}function j0(n,e,t,r,s){const i=new q0;let o,a;if(t.type===bt.OVERWRITE){const u=t;u.source.fromUser?o=qu(n,e,u.path,u.snap,r,s,i):(O(u.source.fromServer,"Unknown source."),a=u.source.tagged||e.serverCache.isFiltered()&&!J(u.path),o=oc(n,e,u.path,u.snap,r,s,a,i))}else if(t.type===bt.MERGE){const u=t;u.source.fromUser?o=K0(n,e,u.path,u.children,r,s,i):(O(u.source.fromServer,"Unknown source."),a=u.source.tagged||e.serverCache.isFiltered(),o=Gu(n,e,u.path,u.children,r,s,a,i))}else if(t.type===bt.ACK_USER_WRITE){const u=t;u.revert?o=Y0(n,e,u.path,r,s,i):o=H0(n,e,u.path,u.affectedTree,r,s,i)}else if(t.type===bt.LISTEN_COMPLETE)o=Q0(n,e,t.path,r,i);else throw xs("Unknown operation type: "+t.type);const l=i.getChanges();return W0(e,o,l),{viewCache:o,changes:l}}function W0(n,e,t){const r=e.eventCache;if(r.isFullyInitialized()){const s=r.getNode().isLeafNode()||r.getNode().isEmpty(),i=rc(n);(t.length>0||!n.eventCache.isFullyInitialized()||s&&!r.getNode().equals(i)||!r.getNode().getPriority().equals(i.getPriority()))&&t.push(VE(rc(e)))}}function zE(n,e,t,r,s,i){const o=e.eventCache;if(ic(r,t)!=null)return e;{let a,l;if(J(t))if(O(e.serverCache.isFullyInitialized(),"If change path is empty, we must have complete server data"),e.serverCache.isFiltered()){const u=Nr(e),d=u instanceof W?u:W.EMPTY_NODE,f=Sd(r,d);a=n.filter.updateFullNode(e.eventCache.getNode(),f,i)}else{const u=sc(r,Nr(e));a=n.filter.updateFullNode(e.eventCache.getNode(),u,i)}else{const u=Y(t);if(u===".priority"){O(Fn(t)===1,"Can't have a priority with additional path components");const d=o.getNode();l=e.serverCache.getNode();const f=im(r,t,d,l);f!=null?a=n.filter.updatePriority(d,f):a=o.getNode()}else{const d=_e(t);let f;if(o.isCompleteForChild(u)){l=e.serverCache.getNode();const _=im(r,t,o.getNode(),l);_!=null?f=o.getNode().getImmediateChild(u).updateChild(d,_):f=o.getNode().getImmediateChild(u)}else f=Cd(r,u,e.serverCache);f!=null?a=n.filter.updateChild(o.getNode(),u,f,d,s,i):a=o.getNode()}}return Gi(e,a,o.isFullyInitialized()||J(t),n.filter.filtersNodes())}}function oc(n,e,t,r,s,i,o,a){const l=e.serverCache;let u;const d=o?n.filter:n.filter.getIndexedFilter();if(J(t))u=d.updateFullNode(l.getNode(),r,null);else if(d.filtersNodes()&&!l.isFiltered()){const g=l.getNode().updateChild(t,r);u=d.updateFullNode(l.getNode(),g,null)}else{const g=Y(t);if(!l.isCompleteForPath(t)&&Fn(t)>1)return e;const v=_e(t),N=l.getNode().getImmediateChild(g).updateChild(v,r);g===".priority"?u=d.updatePriority(l.getNode(),N):u=d.updateChild(l.getNode(),g,N,v,GE,null)}const f=ME(e,u,l.isFullyInitialized()||J(t),d.filtersNodes()),_=new Pd(s,f,i);return zE(n,f,t,s,_,a)}function qu(n,e,t,r,s,i,o){const a=e.eventCache;let l,u;const d=new Pd(s,e,i);if(J(t))u=n.filter.updateFullNode(e.eventCache.getNode(),r,o),l=Gi(e,u,!0,n.filter.filtersNodes());else{const f=Y(t);if(f===".priority")u=n.filter.updatePriority(e.eventCache.getNode(),r),l=Gi(e,u,a.isFullyInitialized(),a.isFiltered());else{const _=_e(t),g=a.getNode().getImmediateChild(f);let v;if(J(_))v=r;else{const C=d.getCompleteChild(f);C!=null?Id(_)===".priority"&&C.getChild(SE(_)).isEmpty()?v=C:v=C.updateChild(_,r):v=W.EMPTY_NODE}if(g.equals(v))l=e;else{const C=n.filter.updateChild(a.getNode(),f,v,_,d,o);l=Gi(e,C,a.isFullyInitialized(),n.filter.filtersNodes())}}}return l}function om(n,e){return n.eventCache.isCompleteForChild(e)}function K0(n,e,t,r,s,i,o){let a=e;return r.foreach((l,u)=>{const d=ke(t,l);om(e,Y(d))&&(a=qu(n,a,d,u,s,i,o))}),r.foreach((l,u)=>{const d=ke(t,l);om(e,Y(d))||(a=qu(n,a,d,u,s,i,o))}),a}function am(n,e,t){return t.foreach((r,s)=>{e=e.updateChild(r,s)}),e}function Gu(n,e,t,r,s,i,o,a){if(e.serverCache.getNode().isEmpty()&&!e.serverCache.isFullyInitialized())return e;let l=e,u;J(t)?u=r:u=new ge(null).setTree(t,r);const d=e.serverCache.getNode();return u.children.inorderTraversal((f,_)=>{if(d.hasChild(f)){const g=e.serverCache.getNode().getImmediateChild(f),v=am(n,g,_);l=oc(n,l,new de(f),v,s,i,o,a)}}),u.children.inorderTraversal((f,_)=>{const g=!e.serverCache.isCompleteForChild(f)&&_.value===null;if(!d.hasChild(f)&&!g){const v=e.serverCache.getNode().getImmediateChild(f),C=am(n,v,_);l=oc(n,l,new de(f),C,s,i,o,a)}}),l}function H0(n,e,t,r,s,i,o){if(ic(s,t)!=null)return e;const a=e.serverCache.isFiltered(),l=e.serverCache;if(r.value!=null){if(J(t)&&l.isFullyInitialized()||l.isCompleteForPath(t))return oc(n,e,t,l.getNode().getChild(t),s,i,a,o);if(J(t)){let u=new ge(null);return l.getNode().forEachChild(ns,(d,f)=>{u=u.set(new de(d),f)}),Gu(n,e,t,u,s,i,a,o)}else return e}else{let u=new ge(null);return r.foreach((d,f)=>{const _=ke(t,d);l.isCompleteForPath(_)&&(u=u.set(d,l.getNode().getChild(_)))}),Gu(n,e,t,u,s,i,a,o)}}function Q0(n,e,t,r,s){const i=e.serverCache,o=ME(e,i.getNode(),i.isFullyInitialized()||J(t),i.isFiltered());return zE(n,o,t,r,GE,s)}function Y0(n,e,t,r,s,i){let o;if(ic(r,t)!=null)return e;{const a=new Pd(r,e,s),l=e.eventCache.getNode();let u;if(J(t)||Y(t)===".priority"){let d;if(e.serverCache.isFullyInitialized())d=sc(r,Nr(e));else{const f=e.serverCache.getNode();O(f instanceof W,"serverChildren would be complete if leaf node"),d=Sd(r,f)}d=d,u=n.filter.updateFullNode(l,d,i)}else{const d=Y(t);let f=Cd(r,d,e.serverCache);f==null&&e.serverCache.isCompleteForChild(d)&&(f=l.getImmediateChild(d)),f!=null?u=n.filter.updateChild(l,d,f,_e(t),a,i):e.eventCache.getNode().hasChild(d)?u=n.filter.updateChild(l,d,W.EMPTY_NODE,_e(t),a,i):u=l,u.isEmpty()&&e.serverCache.isFullyInitialized()&&(o=sc(r,Nr(e)),o.isLeafNode()&&(u=n.filter.updateFullNode(u,o,i)))}return o=e.serverCache.isFullyInitialized()||ic(r,oe())!=null,Gi(e,u,o,n.filter.filtersNodes())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class J0{constructor(e,t){this.query_=e,this.eventRegistrations_=[];const r=this.query_._queryParams,s=new vd(r.getIndex()),i=m0(r);this.processor_=z0(i);const o=t.serverCache,a=t.eventCache,l=s.updateFullNode(W.EMPTY_NODE,o.getNode(),null),u=i.updateFullNode(W.EMPTY_NODE,a.getNode(),null),d=new Un(l,o.isFullyInitialized(),s.filtersNodes()),f=new Un(u,a.isFullyInitialized(),i.filtersNodes());this.viewCache_=Yc(f,d),this.eventGenerator_=new v0(this.query_)}get query(){return this.query_}}function X0(n){return n.viewCache_.serverCache.getNode()}function Z0(n){return rc(n.viewCache_)}function ek(n,e){const t=Nr(n.viewCache_);return t&&(n.query._queryParams.loadsAllData()||!J(e)&&!t.getImmediateChild(Y(e)).isEmpty())?t.getChild(e):null}function cm(n){return n.eventRegistrations_.length===0}function tk(n,e){n.eventRegistrations_.push(e)}function lm(n,e,t){const r=[];if(t){O(e==null,"A cancel should cancel all event registrations.");const s=n.query._path;n.eventRegistrations_.forEach(i=>{const o=i.createCancelEvent(t,s);o&&r.push(o)})}if(e){let s=[];for(let i=0;i<n.eventRegistrations_.length;++i){const o=n.eventRegistrations_[i];if(!o.matches(e))s.push(o);else if(e.hasAnyCallback()){s=s.concat(n.eventRegistrations_.slice(i+1));break}}n.eventRegistrations_=s}else n.eventRegistrations_=[];return r}function um(n,e,t,r){e.type===bt.MERGE&&e.source.queryId!==null&&(O(Nr(n.viewCache_),"We should always have a full cache before handling merges"),O(rc(n.viewCache_),"Missing event cache, even though we have a server cache"));const s=n.viewCache_,i=j0(n.processor_,s,e,t,r);return $0(n.processor_,i.viewCache),O(i.viewCache.serverCache.isFullyInitialized()||!s.serverCache.isFullyInitialized(),"Once a server snap is complete, it should never go back"),n.viewCache_=i.viewCache,$E(n,i.changes,i.viewCache.eventCache.getNode(),null)}function nk(n,e){const t=n.viewCache_.eventCache,r=[];return t.getNode().isLeafNode()||t.getNode().forEachChild(ve,(i,o)=>{r.push(Ns(i,o))}),t.isFullyInitialized()&&r.push(VE(t.getNode())),$E(n,r,t.getNode(),e)}function $E(n,e,t,r){const s=r?[r]:n.eventRegistrations_;return A0(n.eventGenerator_,e,t,s)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ac;class jE{constructor(){this.views=new Map}}function rk(n){O(!ac,"__referenceConstructor has already been defined"),ac=n}function sk(){return O(ac,"Reference.ts has not been loaded"),ac}function ik(n){return n.views.size===0}function Nd(n,e,t,r){const s=e.source.queryId;if(s!==null){const i=n.views.get(s);return O(i!=null,"SyncTree gave us an op for an invalid query."),um(i,e,t,r)}else{let i=[];for(const o of n.views.values())i=i.concat(um(o,e,t,r));return i}}function WE(n,e,t,r,s){const i=e._queryIdentifier,o=n.views.get(i);if(!o){let a=sc(t,s?r:null),l=!1;a?l=!0:r instanceof W?(a=Sd(t,r),l=!1):(a=W.EMPTY_NODE,l=!1);const u=Yc(new Un(a,l,!1),new Un(r,s,!1));return new J0(e,u)}return o}function ok(n,e,t,r,s,i){const o=WE(n,e,r,s,i);return n.views.has(e._queryIdentifier)||n.views.set(e._queryIdentifier,o),tk(o,t),nk(o,t)}function ak(n,e,t,r){const s=e._queryIdentifier,i=[];let o=[];const a=Bn(n);if(s==="default")for(const[l,u]of n.views.entries())o=o.concat(lm(u,t,r)),cm(u)&&(n.views.delete(l),u.query._queryParams.loadsAllData()||i.push(u.query));else{const l=n.views.get(s);l&&(o=o.concat(lm(l,t,r)),cm(l)&&(n.views.delete(s),l.query._queryParams.loadsAllData()||i.push(l.query)))}return a&&!Bn(n)&&i.push(new(sk())(e._repo,e._path)),{removed:i,events:o}}function KE(n){const e=[];for(const t of n.views.values())t.query._queryParams.loadsAllData()||e.push(t);return e}function Pn(n,e){let t=null;for(const r of n.views.values())t=t||ek(r,e);return t}function HE(n,e){if(e._queryParams.loadsAllData())return Xc(n);{const r=e._queryIdentifier;return n.views.get(r)}}function QE(n,e){return HE(n,e)!=null}function Bn(n){return Xc(n)!=null}function Xc(n){for(const e of n.views.values())if(e.query._queryParams.loadsAllData())return e;return null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let cc;function ck(n){O(!cc,"__referenceConstructor has already been defined"),cc=n}function lk(){return O(cc,"Reference.ts has not been loaded"),cc}let uk=1;class hm{constructor(e){this.listenProvider_=e,this.syncPointTree_=new ge(null),this.pendingWriteTree_=U0(),this.tagToQueryMap=new Map,this.queryToTagMap=new Map}}function YE(n,e,t,r,s){return C0(n.pendingWriteTree_,e,t,r,s),s?Fo(n,new Pr(OE(),e,t)):[]}function dr(n,e,t=!1){const r=P0(n.pendingWriteTree_,e);if(N0(n.pendingWriteTree_,e)){let i=new ge(null);return r.snap!=null?i=i.set(oe(),!0):Xe(r.children,o=>{i=i.set(new de(o),!0)}),Fo(n,new nc(r.path,i,t))}else return[]}function Lo(n,e,t){return Fo(n,new Pr(bd(),e,t))}function hk(n,e,t){const r=ge.fromObject(t);return Fo(n,new _o(bd(),e,r))}function dk(n,e){return Fo(n,new po(bd(),e))}function fk(n,e,t){const r=Dd(n,t);if(r){const s=xd(r),i=s.path,o=s.queryId,a=nt(i,e),l=new po(Rd(o),a);return Vd(n,i,l)}else return[]}function lc(n,e,t,r,s=!1){const i=e._path,o=n.syncPointTree_.get(i);let a=[];if(o&&(e._queryIdentifier==="default"||QE(o,e))){const l=ak(o,e,t,r);ik(o)&&(n.syncPointTree_=n.syncPointTree_.remove(i));const u=l.removed;if(a=l.events,!s){const d=u.findIndex(_=>_._queryParams.loadsAllData())!==-1,f=n.syncPointTree_.findOnPath(i,(_,g)=>Bn(g));if(d&&!f){const _=n.syncPointTree_.subtree(i);if(!_.isEmpty()){const g=mk(_);for(let v=0;v<g.length;++v){const C=g[v],N=C.query,V=eT(n,C);n.listenProvider_.startListening($i(N),mo(n,N),V.hashFn,V.onComplete)}}}!f&&u.length>0&&!r&&(d?n.listenProvider_.stopListening($i(e),null):u.forEach(_=>{const g=n.queryToTagMap.get(Zc(_));n.listenProvider_.stopListening($i(_),g)}))}gk(n,u)}return a}function JE(n,e,t,r){const s=Dd(n,r);if(s!=null){const i=xd(s),o=i.path,a=i.queryId,l=nt(o,e),u=new Pr(Rd(a),l,t);return Vd(n,o,u)}else return[]}function pk(n,e,t,r){const s=Dd(n,r);if(s){const i=xd(s),o=i.path,a=i.queryId,l=nt(o,e),u=ge.fromObject(t),d=new _o(Rd(a),l,u);return Vd(n,o,d)}else return[]}function zu(n,e,t,r=!1){const s=e._path;let i=null,o=!1;n.syncPointTree_.foreachOnPath(s,(_,g)=>{const v=nt(_,s);i=i||Pn(g,v),o=o||Bn(g)});let a=n.syncPointTree_.get(s);a?(o=o||Bn(a),i=i||Pn(a,oe())):(a=new jE,n.syncPointTree_=n.syncPointTree_.set(s,a));let l;i!=null?l=!0:(l=!1,i=W.EMPTY_NODE,n.syncPointTree_.subtree(s).foreachChild((g,v)=>{const C=Pn(v,oe());C&&(i=i.updateImmediateChild(g,C))}));const u=QE(a,e);if(!u&&!e._queryParams.loadsAllData()){const _=Zc(e);O(!n.queryToTagMap.has(_),"View does not exist, but we have a tag");const g=yk();n.queryToTagMap.set(_,g),n.tagToQueryMap.set(g,_)}const d=Jc(n.pendingWriteTree_,s);let f=ok(a,e,t,d,i,l);if(!u&&!o&&!r){const _=HE(a,e);f=f.concat(Ik(n,e,_))}return f}function kd(n,e,t){const s=n.pendingWriteTree_,i=n.syncPointTree_.findOnPath(e,(o,a)=>{const l=nt(o,e),u=Pn(a,l);if(u)return u});return UE(s,e,i,t,!0)}function _k(n,e){const t=e._path;let r=null;n.syncPointTree_.foreachOnPath(t,(u,d)=>{const f=nt(u,t);r=r||Pn(d,f)});let s=n.syncPointTree_.get(t);s?r=r||Pn(s,oe()):(s=new jE,n.syncPointTree_=n.syncPointTree_.set(t,s));const i=r!=null,o=i?new Un(r,!0,!1):null,a=Jc(n.pendingWriteTree_,e._path),l=WE(s,e,a,i?o.getNode():W.EMPTY_NODE,i);return Z0(l)}function Fo(n,e){return XE(e,n.syncPointTree_,null,Jc(n.pendingWriteTree_,oe()))}function XE(n,e,t,r){if(J(n.path))return ZE(n,e,t,r);{const s=e.get(oe());t==null&&s!=null&&(t=Pn(s,oe()));let i=[];const o=Y(n.path),a=n.operationForChild(o),l=e.children.get(o);if(l&&a){const u=t?t.getImmediateChild(o):null,d=BE(r,o);i=i.concat(XE(a,l,u,d))}return s&&(i=i.concat(Nd(s,n,r,t))),i}}function ZE(n,e,t,r){const s=e.get(oe());t==null&&s!=null&&(t=Pn(s,oe()));let i=[];return e.children.inorderTraversal((o,a)=>{const l=t?t.getImmediateChild(o):null,u=BE(r,o),d=n.operationForChild(o);d&&(i=i.concat(ZE(d,a,l,u)))}),s&&(i=i.concat(Nd(s,n,r,t))),i}function eT(n,e){const t=e.query,r=mo(n,t);return{hashFn:()=>(X0(e)||W.EMPTY_NODE).hash(),onComplete:s=>{if(s==="ok")return r?fk(n,t._path,r):dk(n,t._path);{const i=pN(s,t);return lc(n,t,null,i)}}}}function mo(n,e){const t=Zc(e);return n.queryToTagMap.get(t)}function Zc(n){return n._path.toString()+"$"+n._queryIdentifier}function Dd(n,e){return n.tagToQueryMap.get(e)}function xd(n){const e=n.indexOf("$");return O(e!==-1&&e<n.length-1,"Bad queryKey."),{queryId:n.substr(e+1),path:new de(n.substr(0,e))}}function Vd(n,e,t){const r=n.syncPointTree_.get(e);O(r,"Missing sync point for query tag that we're tracking");const s=Jc(n.pendingWriteTree_,e);return Nd(r,t,s,null)}function mk(n){return n.fold((e,t,r)=>{if(t&&Bn(t))return[Xc(t)];{let s=[];return t&&(s=KE(t)),Xe(r,(i,o)=>{s=s.concat(o)}),s}})}function $i(n){return n._queryParams.loadsAllData()&&!n._queryParams.isDefault()?new(lk())(n._repo,n._path):n}function gk(n,e){for(let t=0;t<e.length;++t){const r=e[t];if(!r._queryParams.loadsAllData()){const s=Zc(r),i=n.queryToTagMap.get(s);n.queryToTagMap.delete(s),n.tagToQueryMap.delete(i)}}}function yk(){return uk++}function Ik(n,e,t){const r=e._path,s=mo(n,e),i=eT(n,t),o=n.listenProvider_.startListening($i(e),s,i.hashFn,i.onComplete),a=n.syncPointTree_.subtree(r);if(s)O(!Bn(a.value),"If we're adding a query, it shouldn't be shadowed");else{const l=a.fold((u,d,f)=>{if(!J(u)&&d&&Bn(d))return[Xc(d).query];{let _=[];return d&&(_=_.concat(KE(d).map(g=>g.query))),Xe(f,(g,v)=>{_=_.concat(v)}),_}});for(let u=0;u<l.length;++u){const d=l[u];n.listenProvider_.stopListening($i(d),mo(n,d))}}return o}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Od{constructor(e){this.node_=e}getImmediateChild(e){const t=this.node_.getImmediateChild(e);return new Od(t)}node(){return this.node_}}class Md{constructor(e,t){this.syncTree_=e,this.path_=t}getImmediateChild(e){const t=ke(this.path_,e);return new Md(this.syncTree_,t)}node(){return kd(this.syncTree_,this.path_)}}const Ek=function(n){return n=n||{},n.timestamp=n.timestamp||new Date().getTime(),n},dm=function(n,e,t){if(!n||typeof n!="object")return n;if(O(".sv"in n,"Unexpected leaf node or priority contents"),typeof n[".sv"]=="string")return Tk(n[".sv"],e,t);if(typeof n[".sv"]=="object")return wk(n[".sv"],e);O(!1,"Unexpected server value: "+JSON.stringify(n,null,2))},Tk=function(n,e,t){switch(n){case"timestamp":return t.timestamp;default:O(!1,"Unexpected server value: "+n)}},wk=function(n,e,t){n.hasOwnProperty("increment")||O(!1,"Unexpected server value: "+JSON.stringify(n,null,2));const r=n.increment;typeof r!="number"&&O(!1,"Unexpected increment value: "+r);const s=e.node();if(O(s!==null&&typeof s<"u","Expected ChildrenNode.EMPTY_NODE for nulls"),!s.isLeafNode())return r;const o=s.getValue();return typeof o!="number"?r:o+r},vk=function(n,e,t,r){return Ld(e,new Md(t,n),r)},tT=function(n,e,t){return Ld(n,new Od(e),t)};function Ld(n,e,t){const r=n.getPriority().val(),s=dm(r,e.getImmediateChild(".priority"),t);let i;if(n.isLeafNode()){const o=n,a=dm(o.getValue(),e,t);return a!==o.getValue()||s!==o.getPriority().val()?new Be(a,Pe(s)):n}else{const o=n;return i=o,s!==o.getPriority().val()&&(i=i.updatePriority(new Be(s))),o.forEachChild(ve,(a,l)=>{const u=Ld(l,e.getImmediateChild(a),t);u!==l&&(i=i.updateImmediateChild(a,u))}),i}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fd{constructor(e="",t=null,r={children:{},childCount:0}){this.name=e,this.parent=t,this.node=r}}function Ud(n,e){let t=e instanceof de?e:new de(e),r=n,s=Y(t);for(;s!==null;){const i=is(r.node.children,s)||{children:{},childCount:0};r=new Fd(s,r,i),t=_e(t),s=Y(t)}return r}function Ys(n){return n.node.value}function nT(n,e){n.node.value=e,$u(n)}function rT(n){return n.node.childCount>0}function Ak(n){return Ys(n)===void 0&&!rT(n)}function el(n,e){Xe(n.node.children,(t,r)=>{e(new Fd(t,n,r))})}function sT(n,e,t,r){t&&e(n),el(n,s=>{sT(s,e,!0)})}function bk(n,e,t){let r=n.parent;for(;r!==null;){if(e(r))return!0;r=r.parent}return!1}function Uo(n){return new de(n.parent===null?n.name:Uo(n.parent)+"/"+n.name)}function $u(n){n.parent!==null&&Rk(n.parent,n.name,n)}function Rk(n,e,t){const r=Ak(t),s=$t(n.node.children,e);r&&s?(delete n.node.children[e],n.node.childCount--,$u(n)):!r&&!s&&(n.node.children[e]=t.node,n.node.childCount++,$u(n))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Sk=/[\[\].#$\/\u0000-\u001F\u007F]/,Ck=/[\[\].#$\u0000-\u001F\u007F]/,Ql=10*1024*1024,Bd=function(n){return typeof n=="string"&&n.length!==0&&!Sk.test(n)},iT=function(n){return typeof n=="string"&&n.length!==0&&!Ck.test(n)},Pk=function(n){return n&&(n=n.replace(/^\/*\.info(\/|$)/,"/")),iT(n)},oT=function(n){return n===null||typeof n=="string"||typeof n=="number"&&!Hc(n)||n&&typeof n=="object"&&$t(n,".sv")},ju=function(n,e,t,r){tl(os(n,"value"),e,t)},tl=function(n,e,t){const r=t instanceof de?new HN(t,n):t;if(e===void 0)throw new Error(n+"contains undefined "+ir(r));if(typeof e=="function")throw new Error(n+"contains a function "+ir(r)+" with contents = "+e.toString());if(Hc(e))throw new Error(n+"contains "+e.toString()+" "+ir(r));if(typeof e=="string"&&e.length>Ql/3&&gc(e)>Ql)throw new Error(n+"contains a string greater than "+Ql+" utf8 bytes "+ir(r)+" ('"+e.substring(0,50)+"...')");if(e&&typeof e=="object"){let s=!1,i=!1;if(Xe(e,(o,a)=>{if(o===".value")s=!0;else if(o!==".priority"&&o!==".sv"&&(i=!0,!Bd(o)))throw new Error(n+" contains an invalid key ("+o+") "+ir(r)+`.  Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`);QN(r,o),tl(n,a,r),YN(r)}),s&&i)throw new Error(n+' contains ".value" child '+ir(r)+" in addition to actual children.")}},Nk=function(n,e){let t,r;for(t=0;t<e.length;t++){r=e[t];const i=lo(r);for(let o=0;o<i.length;o++)if(!(i[o]===".priority"&&o===i.length-1)){if(!Bd(i[o]))throw new Error(n+"contains an invalid key ("+i[o]+") in path "+r.toString()+`. Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`)}}e.sort(KN);let s=null;for(t=0;t<e.length;t++){if(r=e[t],s!==null&&Et(s,r))throw new Error(n+"contains a path "+s.toString()+" that is ancestor of another path "+r.toString());s=r}},kk=function(n,e,t,r){const s=os(n,"values");if(!(e&&typeof e=="object")||Array.isArray(e))throw new Error(s+" must be an object containing the children to replace.");const i=[];Xe(e,(o,a)=>{const l=new de(o);if(tl(s,a,ke(t,l)),Id(l)===".priority"&&!oT(a))throw new Error(s+"contains an invalid value for '"+l.toString()+"', which must be a valid Firebase priority (a string, finite number, server value, or null).");i.push(l)}),Nk(s,i)},Dk=function(n,e,t){if(Hc(e))throw new Error(os(n,"priority")+"is "+e.toString()+", but must be a valid Firebase priority (a string, finite number, server value, or null).");if(!oT(e))throw new Error(os(n,"priority")+"must be a valid Firebase priority (a string, finite number, server value, or null).")},aT=function(n,e,t,r){if(!iT(t))throw new Error(os(n,e)+'was an invalid path = "'+t+`". Paths must be non-empty strings and can't contain ".", "#", "$", "[", or "]"`)},xk=function(n,e,t,r){t&&(t=t.replace(/^\/*\.info(\/|$)/,"/")),aT(n,e,t)},Si=function(n,e){if(Y(e)===".info")throw new Error(n+" failed = Can't modify data under /.info/")},Vk=function(n,e){const t=e.path.toString();if(typeof e.repoInfo.host!="string"||e.repoInfo.host.length===0||!Bd(e.repoInfo.namespace)&&e.repoInfo.host.split(":")[0]!=="localhost"||t.length!==0&&!Pk(t))throw new Error(os(n,"url")+`must be a valid firebase URL and the path can't contain ".", "#", "$", "[", or "]".`)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ok{constructor(){this.eventLists_=[],this.recursionDepth_=0}}function qd(n,e){let t=null;for(let r=0;r<e.length;r++){const s=e[r],i=s.getPath();t!==null&&!Ed(i,t.path)&&(n.eventLists_.push(t),t=null),t===null&&(t={events:[],path:i}),t.events.push(s)}t&&n.eventLists_.push(t)}function cT(n,e,t){qd(n,t),lT(n,r=>Ed(r,e))}function Gt(n,e,t){qd(n,t),lT(n,r=>Et(r,e)||Et(e,r))}function lT(n,e){n.recursionDepth_++;let t=!0;for(let r=0;r<n.eventLists_.length;r++){const s=n.eventLists_[r];if(s){const i=s.path;e(i)?(Mk(n.eventLists_[r]),n.eventLists_[r]=null):t=!1}}t&&(n.eventLists_=[]),n.recursionDepth_--}function Mk(n){for(let e=0;e<n.events.length;e++){const t=n.events[e];if(t!==null){n.events[e]=null;const r=t.getEventRunner();Bi&&je("event: "+t.toString()),Hs(r)}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Lk="repo_interrupt",Fk=25;class Uk{constructor(e,t,r,s){this.repoInfo_=e,this.forceRestClient_=t,this.authTokenProvider_=r,this.appCheckProvider_=s,this.dataUpdateCount=0,this.statsListener_=null,this.eventQueue_=new Ok,this.nextWriteId_=1,this.interceptServerDataCallback_=null,this.onDisconnect_=tc(),this.transactionQueueTree_=new Fd,this.persistentConnection_=null,this.key=this.repoInfo_.toURLString()}toString(){return(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host}}function Bk(n,e,t){if(n.stats_=gd(n.repoInfo_),n.forceRestClient_||yN())n.server_=new ec(n.repoInfo_,(r,s,i,o)=>{fm(n,r,s,i,o)},n.authTokenProvider_,n.appCheckProvider_),setTimeout(()=>pm(n,!0),0);else{if(typeof t<"u"&&t!==null){if(typeof t!="object")throw new Error("Only objects are supported for option databaseAuthVariableOverride");try{Me(t)}catch(r){throw new Error("Invalid authOverride provided: "+r)}}n.persistentConnection_=new Yt(n.repoInfo_,e,(r,s,i,o)=>{fm(n,r,s,i,o)},r=>{pm(n,r)},r=>{Gk(n,r)},n.authTokenProvider_,n.appCheckProvider_,t),n.server_=n.persistentConnection_}n.authTokenProvider_.addTokenChangeListener(r=>{n.server_.refreshAuthToken(r)}),n.appCheckProvider_.addTokenChangeListener(r=>{n.server_.refreshAppCheckToken(r.token)}),n.statsReporter_=vN(n.repoInfo_,()=>new w0(n.stats_,n.server_)),n.infoData_=new g0,n.infoSyncTree_=new hm({startListening:(r,s,i,o)=>{let a=[];const l=n.infoData_.getNode(r._path);return l.isEmpty()||(a=Lo(n.infoSyncTree_,r._path,l),setTimeout(()=>{o("ok")},0)),a},stopListening:()=>{}}),zd(n,"connected",!1),n.serverSyncTree_=new hm({startListening:(r,s,i,o)=>(n.server_.listen(r,i,s,(a,l)=>{const u=o(a,l);Gt(n.eventQueue_,r._path,u)}),[]),stopListening:(r,s)=>{n.server_.unlisten(r,s)}})}function qk(n){const t=n.infoData_.getNode(new de(".info/serverTimeOffset")).val()||0;return new Date().getTime()+t}function Gd(n){return Ek({timestamp:qk(n)})}function fm(n,e,t,r,s){n.dataUpdateCount++;const i=new de(e);t=n.interceptServerDataCallback_?n.interceptServerDataCallback_(e,t):t;let o=[];if(s)if(r){const l=ka(t,u=>Pe(u));o=pk(n.serverSyncTree_,i,l,s)}else{const l=Pe(t);o=JE(n.serverSyncTree_,i,l,s)}else if(r){const l=ka(t,u=>Pe(u));o=hk(n.serverSyncTree_,i,l)}else{const l=Pe(t);o=Lo(n.serverSyncTree_,i,l)}let a=i;o.length>0&&(a=rl(n,i)),Gt(n.eventQueue_,a,o)}function pm(n,e){zd(n,"connected",e),e===!1&&jk(n)}function Gk(n,e){Xe(e,(t,r)=>{zd(n,t,r)})}function zd(n,e,t){const r=new de("/.info/"+e),s=Pe(t);n.infoData_.updateSnapshot(r,s);const i=Lo(n.infoSyncTree_,r,s);Gt(n.eventQueue_,r,i)}function uT(n){return n.nextWriteId_++}function zk(n,e,t){const r=_k(n.serverSyncTree_,e);return r!=null?Promise.resolve(r):n.server_.get(e).then(s=>{const i=Pe(s).withIndex(e._queryParams.getIndex());zu(n.serverSyncTree_,e,t,!0);let o;if(e._queryParams.loadsAllData())o=Lo(n.serverSyncTree_,e._path,i);else{const a=mo(n.serverSyncTree_,e);o=JE(n.serverSyncTree_,e._path,i,a)}return Gt(n.eventQueue_,e._path,o),lc(n.serverSyncTree_,e,t,null,!0),i},s=>(nl(n,"get for query "+Me(e)+" failed: "+s),Promise.reject(new Error(s))))}function $k(n,e,t,r,s){nl(n,"set",{path:e.toString(),value:t,priority:r});const i=Gd(n),o=Pe(t,r),a=kd(n.serverSyncTree_,e),l=tT(o,a,i),u=uT(n),d=YE(n.serverSyncTree_,e,l,u,!0);qd(n.eventQueue_,d),n.server_.put(e.toString(),o.val(!0),(_,g)=>{const v=_==="ok";v||ft("set at "+e+" failed: "+_);const C=dr(n.serverSyncTree_,u,!v);Gt(n.eventQueue_,e,C),Ds(n,s,_,g)});const f=_T(n,e);rl(n,f),Gt(n.eventQueue_,f,[])}function jk(n){nl(n,"onDisconnectEvents");const e=Gd(n),t=tc();Fu(n.onDisconnect_,oe(),(s,i)=>{const o=vk(s,i,n.serverSyncTree_,e);Qs(t,s,o)});let r=[];Fu(t,oe(),(s,i)=>{r=r.concat(Lo(n.serverSyncTree_,s,i));const o=_T(n,s);rl(n,o)}),n.onDisconnect_=tc(),Gt(n.eventQueue_,oe(),r)}function Wk(n,e,t){n.server_.onDisconnectCancel(e.toString(),(r,s)=>{r==="ok"&&Lu(n.onDisconnect_,e),Ds(n,t,r,s)})}function _m(n,e,t,r){const s=Pe(t);n.server_.onDisconnectPut(e.toString(),s.val(!0),(i,o)=>{i==="ok"&&Qs(n.onDisconnect_,e,s),Ds(n,r,i,o)})}function Kk(n,e,t,r,s){const i=Pe(t,r);n.server_.onDisconnectPut(e.toString(),i.val(!0),(o,a)=>{o==="ok"&&Qs(n.onDisconnect_,e,i),Ds(n,s,o,a)})}function Hk(n,e,t,r){if(Zl(t)){je("onDisconnect().update() called with empty data.  Don't do anything."),Ds(n,r,"ok",void 0);return}n.server_.onDisconnectMerge(e.toString(),t,(s,i)=>{s==="ok"&&Xe(t,(o,a)=>{const l=Pe(a);Qs(n.onDisconnect_,ke(e,o),l)}),Ds(n,r,s,i)})}function Qk(n,e,t){let r;Y(e._path)===".info"?r=zu(n.infoSyncTree_,e,t):r=zu(n.serverSyncTree_,e,t),cT(n.eventQueue_,e._path,r)}function Wu(n,e,t){let r;Y(e._path)===".info"?r=lc(n.infoSyncTree_,e,t):r=lc(n.serverSyncTree_,e,t),cT(n.eventQueue_,e._path,r)}function Yk(n){n.persistentConnection_&&n.persistentConnection_.interrupt(Lk)}function nl(n,...e){let t="";n.persistentConnection_&&(t=n.persistentConnection_.id+":"),je(t,...e)}function Ds(n,e,t,r){e&&Hs(()=>{if(t==="ok")e(null);else{const s=(t||"error").toUpperCase();let i=s;r&&(i+=": "+r);const o=new Error(i);o.code=s,e(o)}})}function hT(n,e,t){return kd(n.serverSyncTree_,e,t)||W.EMPTY_NODE}function $d(n,e=n.transactionQueueTree_){if(e||sl(n,e),Ys(e)){const t=fT(n,e);O(t.length>0,"Sending zero length transaction queue"),t.every(s=>s.status===0)&&Jk(n,Uo(e),t)}else rT(e)&&el(e,t=>{$d(n,t)})}function Jk(n,e,t){const r=t.map(u=>u.currentWriteId),s=hT(n,e,r);let i=s;const o=s.hash();for(let u=0;u<t.length;u++){const d=t[u];O(d.status===0,"tryToSendTransactionQueue_: items in queue should all be run."),d.status=1,d.retryCount++;const f=nt(e,d.path);i=i.updateChild(f,d.currentOutputSnapshotRaw)}const a=i.val(!0),l=e;n.server_.put(l.toString(),a,u=>{nl(n,"transaction put response",{path:l.toString(),status:u});let d=[];if(u==="ok"){const f=[];for(let _=0;_<t.length;_++)t[_].status=2,d=d.concat(dr(n.serverSyncTree_,t[_].currentWriteId)),t[_].onComplete&&f.push(()=>t[_].onComplete(null,!0,t[_].currentOutputSnapshotResolved)),t[_].unwatcher();sl(n,Ud(n.transactionQueueTree_,e)),$d(n,n.transactionQueueTree_),Gt(n.eventQueue_,e,d);for(let _=0;_<f.length;_++)Hs(f[_])}else{if(u==="datastale")for(let f=0;f<t.length;f++)t[f].status===3?t[f].status=4:t[f].status=0;else{ft("transaction at "+l.toString()+" failed: "+u);for(let f=0;f<t.length;f++)t[f].status=4,t[f].abortReason=u}rl(n,e)}},o)}function rl(n,e){const t=dT(n,e),r=Uo(t),s=fT(n,t);return Xk(n,s,r),r}function Xk(n,e,t){if(e.length===0)return;const r=[];let s=[];const o=e.filter(a=>a.status===0).map(a=>a.currentWriteId);for(let a=0;a<e.length;a++){const l=e[a],u=nt(t,l.path);let d=!1,f;if(O(u!==null,"rerunTransactionsUnderNode_: relativePath should not be null."),l.status===4)d=!0,f=l.abortReason,s=s.concat(dr(n.serverSyncTree_,l.currentWriteId,!0));else if(l.status===0)if(l.retryCount>=Fk)d=!0,f="maxretry",s=s.concat(dr(n.serverSyncTree_,l.currentWriteId,!0));else{const _=hT(n,l.path,o);l.currentInputSnapshot=_;const g=e[a].update(_.val());if(g!==void 0){tl("transaction failed: Data returned ",g,l.path);let v=Pe(g);typeof g=="object"&&g!=null&&$t(g,".priority")||(v=v.updatePriority(_.getPriority()));const N=l.currentWriteId,V=Gd(n),B=tT(v,_,V);l.currentOutputSnapshotRaw=v,l.currentOutputSnapshotResolved=B,l.currentWriteId=uT(n),o.splice(o.indexOf(N),1),s=s.concat(YE(n.serverSyncTree_,l.path,B,l.currentWriteId,l.applyLocally)),s=s.concat(dr(n.serverSyncTree_,N,!0))}else d=!0,f="nodata",s=s.concat(dr(n.serverSyncTree_,l.currentWriteId,!0))}Gt(n.eventQueue_,t,s),s=[],d&&(e[a].status=2,(function(_){setTimeout(_,Math.floor(0))})(e[a].unwatcher),e[a].onComplete&&(f==="nodata"?r.push(()=>e[a].onComplete(null,!1,e[a].currentInputSnapshot)):r.push(()=>e[a].onComplete(new Error(f),!1,null))))}sl(n,n.transactionQueueTree_);for(let a=0;a<r.length;a++)Hs(r[a]);$d(n,n.transactionQueueTree_)}function dT(n,e){let t,r=n.transactionQueueTree_;for(t=Y(e);t!==null&&Ys(r)===void 0;)r=Ud(r,t),e=_e(e),t=Y(e);return r}function fT(n,e){const t=[];return pT(n,e,t),t.sort((r,s)=>r.order-s.order),t}function pT(n,e,t){const r=Ys(e);if(r)for(let s=0;s<r.length;s++)t.push(r[s]);el(e,s=>{pT(n,s,t)})}function sl(n,e){const t=Ys(e);if(t){let r=0;for(let s=0;s<t.length;s++)t[s].status!==2&&(t[r]=t[s],r++);t.length=r,nT(e,t.length>0?t:void 0)}el(e,r=>{sl(n,r)})}function _T(n,e){const t=Uo(dT(n,e)),r=Ud(n.transactionQueueTree_,e);return bk(r,s=>{Yl(n,s)}),Yl(n,r),sT(r,s=>{Yl(n,s)}),t}function Yl(n,e){const t=Ys(e);if(t){const r=[];let s=[],i=-1;for(let o=0;o<t.length;o++)t[o].status===3||(t[o].status===1?(O(i===o-1,"All SENT items should be at beginning of queue."),i=o,t[o].status=3,t[o].abortReason="set"):(O(t[o].status===0,"Unexpected transaction status in abort"),t[o].unwatcher(),s=s.concat(dr(n.serverSyncTree_,t[o].currentWriteId,!0)),t[o].onComplete&&r.push(t[o].onComplete.bind(null,new Error("set"),!1,null))));i===-1?nT(e,void 0):t.length=i+1,Gt(n.eventQueue_,Uo(e),s);for(let o=0;o<r.length;o++)Hs(r[o])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zk(n){let e="";const t=n.split("/");for(let r=0;r<t.length;r++)if(t[r].length>0){let s=t[r];try{s=decodeURIComponent(s.replace(/\+/g," "))}catch{}e+="/"+s}return e}function eD(n){const e={};n.charAt(0)==="?"&&(n=n.substring(1));for(const t of n.split("&")){if(t.length===0)continue;const r=t.split("=");r.length===2?e[decodeURIComponent(r[0])]=decodeURIComponent(r[1]):ft(`Invalid query segment '${t}' in query '${n}'`)}return e}const mm=function(n,e){const t=tD(n),r=t.namespace;t.domain==="firebase.com"&&nn(t.host+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead"),(!r||r==="undefined")&&t.domain!=="localhost"&&nn("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com"),t.secure||lN();const s=t.scheme==="ws"||t.scheme==="wss";return{repoInfo:new yE(t.host,t.secure,r,s,e,"",r!==t.subdomain),path:new de(t.pathString)}},tD=function(n){let e="",t="",r="",s="",i="",o=!0,a="https",l=443;if(typeof n=="string"){let u=n.indexOf("//");u>=0&&(a=n.substring(0,u-1),n=n.substring(u+2));let d=n.indexOf("/");d===-1&&(d=n.length);let f=n.indexOf("?");f===-1&&(f=n.length),e=n.substring(0,Math.min(d,f)),d<f&&(s=Zk(n.substring(d,f)));const _=eD(n.substring(Math.min(n.length,f)));u=e.indexOf(":"),u>=0?(o=a==="https"||a==="wss",l=parseInt(e.substring(u+1),10)):u=e.length;const g=e.slice(0,u);if(g.toLowerCase()==="localhost")t="localhost";else if(g.split(".").length<=2)t=g;else{const v=e.indexOf(".");r=e.substring(0,v).toLowerCase(),t=e.substring(v+1),i=r}"ns"in _&&(i=_.ns)}return{host:e,port:l,domain:t,subdomain:r,secure:o,scheme:a,pathString:s,namespace:i}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nD{constructor(e,t,r,s){this.eventType=e,this.eventRegistration=t,this.snapshot=r,this.prevName=s}getPath(){const e=this.snapshot.ref;return this.eventType==="value"?e._path:e.parent._path}getEventType(){return this.eventType}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.getPath().toString()+":"+this.eventType+":"+Me(this.snapshot.exportVal())}}class rD{constructor(e,t,r){this.eventRegistration=e,this.error=t,this.path=r}getPath(){return this.path}getEventType(){return"cancel"}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.path.toString()+":cancel"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jd{constructor(e,t){this.snapshotCallback=e,this.cancelCallback=t}onValue(e,t){this.snapshotCallback.call(null,e,t)}onCancel(e){return O(this.hasCancelCallback,"Raising a cancel event on a listener with no cancel callback"),this.cancelCallback.call(null,e)}get hasCancelCallback(){return!!this.cancelCallback}matches(e){return this.snapshotCallback===e.snapshotCallback||this.snapshotCallback.userCallback!==void 0&&this.snapshotCallback.userCallback===e.snapshotCallback.userCallback&&this.snapshotCallback.context===e.snapshotCallback.context}}/**
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
 */class sD{constructor(e,t){this._repo=e,this._path=t}cancel(){const e=new Wt;return Wk(this._repo,this._path,e.wrapCallback(()=>{})),e.promise}remove(){Si("OnDisconnect.remove",this._path);const e=new Wt;return _m(this._repo,this._path,null,e.wrapCallback(()=>{})),e.promise}set(e){Si("OnDisconnect.set",this._path),ju("OnDisconnect.set",e,this._path);const t=new Wt;return _m(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}setWithPriority(e,t){Si("OnDisconnect.setWithPriority",this._path),ju("OnDisconnect.setWithPriority",e,this._path),Dk("OnDisconnect.setWithPriority",t);const r=new Wt;return Kk(this._repo,this._path,e,t,r.wrapCallback(()=>{})),r.promise}update(e){Si("OnDisconnect.update",this._path),kk("OnDisconnect.update",e,this._path);const t=new Wt;return Hk(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}}/**
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
 */class Wd{constructor(e,t,r,s){this._repo=e,this._path=t,this._queryParams=r,this._orderByCalled=s}get key(){return J(this._path)?null:Id(this._path)}get ref(){return new cn(this._repo,this._path)}get _queryIdentifier(){const e=em(this._queryParams),t=_d(e);return t==="{}"?"default":t}get _queryObject(){return em(this._queryParams)}isEqual(e){if(e=te(e),!(e instanceof Wd))return!1;const t=this._repo===e._repo,r=Ed(this._path,e._path),s=this._queryIdentifier===e._queryIdentifier;return t&&r&&s}toJSON(){return this.toString()}toString(){return this._repo.toString()+WN(this._path)}}class cn extends Wd{constructor(e,t){super(e,t,new Ad,!1)}get parent(){const e=SE(this._path);return e===null?null:new cn(this._repo,e)}get root(){let e=this;for(;e.parent!==null;)e=e.parent;return e}}class go{constructor(e,t,r){this._node=e,this.ref=t,this._index=r}get priority(){return this._node.getPriority().val()}get key(){return this.ref.key}get size(){return this._node.numChildren()}child(e){const t=new de(e),r=Ku(this.ref,e);return new go(this._node.getChild(t),r,ve)}exists(){return!this._node.isEmpty()}exportVal(){return this._node.val(!0)}forEach(e){return this._node.isLeafNode()?!1:!!this._node.forEachChild(this._index,(r,s)=>e(new go(s,Ku(this.ref,r),ve)))}hasChild(e){const t=new de(e);return!this._node.getChild(t).isEmpty()}hasChildren(){return this._node.isLeafNode()?!1:!this._node.isEmpty()}toJSON(){return this.exportVal()}val(){return this._node.val()}}function fx(n,e){return n=te(n),n._checkNotDeleted("ref"),e!==void 0?Ku(n._root,e):n._root}function Ku(n,e){return n=te(n),Y(n._path)===null?xk("child","path",e):aT("child","path",e),new cn(n._repo,ke(n._path,e))}function px(n){return n=te(n),new sD(n._repo,n._path)}function _x(n,e){n=te(n),Si("set",n._path),ju("set",e,n._path);const t=new Wt;return $k(n._repo,n._path,e,null,t.wrapCallback(()=>{})),t.promise}function mx(n){n=te(n);const e=new jd(()=>{}),t=new Bo(e);return zk(n._repo,n,t).then(r=>new go(r,new cn(n._repo,n._path),n._queryParams.getIndex()))}class Bo{constructor(e){this.callbackContext=e}respondsTo(e){return e==="value"}createEvent(e,t){const r=t._queryParams.getIndex();return new nD("value",this,new go(e.snapshotNode,new cn(t._repo,t._path),r))}getEventRunner(e){return e.getEventType()==="cancel"?()=>this.callbackContext.onCancel(e.error):()=>this.callbackContext.onValue(e.snapshot,null)}createCancelEvent(e,t){return this.callbackContext.hasCancelCallback?new rD(this,e,t):null}matches(e){return e instanceof Bo?!e.callbackContext||!this.callbackContext?!0:e.callbackContext.matches(this.callbackContext):!1}hasAnyCallback(){return this.callbackContext!==null}}function iD(n,e,t,r,s){let i;if(typeof r=="object"&&(i=void 0,s=r),typeof r=="function"&&(i=r),s&&s.onlyOnce){const l=t,u=(d,f)=>{Wu(n._repo,n,a),l(d,f)};u.userCallback=t.userCallback,u.context=t.context,t=u}const o=new jd(t,i||void 0),a=new Bo(o);return Qk(n._repo,n,a),()=>Wu(n._repo,n,a)}function gx(n,e,t,r){return iD(n,"value",e,t,r)}function yx(n,e,t){let r=null;const s=t?new jd(t):null;r=new Bo(s),Wu(n._repo,n,r)}rk(cn);ck(cn);/**
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
 */const oD="FIREBASE_DATABASE_EMULATOR_HOST",Hu={};let aD=!1;function cD(n,e,t,r){const s=e.lastIndexOf(":"),i=e.substring(0,s),o=wt(i);n.repoInfo_=new yE(e,o,n.repoInfo_.namespace,n.repoInfo_.webSocketOnly,n.repoInfo_.nodeAdmin,n.repoInfo_.persistenceKey,n.repoInfo_.includeNamespaceInQueryParams,!0,t),r&&(n.authTokenProvider_=r)}function lD(n,e,t,r,s){let i=r||n.options.databaseURL;i===void 0&&(n.options.projectId||nn("Can't determine Firebase Database URL. Be sure to include  a Project ID when calling firebase.initializeApp()."),je("Using default host for project ",n.options.projectId),i=`${n.options.projectId}-default-rtdb.firebaseio.com`);let o=mm(i,s),a=o.repoInfo,l;typeof process<"u"&&M_&&(l=M_[oD]),l?(i=`http://${l}?ns=${a.namespace}`,o=mm(i,s),a=o.repoInfo):o.repoInfo.secure;const u=new EN(n.name,n.options,e);Vk("Invalid Firebase Database URL",o),J(o.path)||nn("Database URL must point to the root of a Firebase Database (not including a child path).");const d=hD(a,n,u,new IN(n,t));return new dD(d,n)}function uD(n,e){const t=Hu[e];(!t||t[n.key]!==n)&&nn(`Database ${e}(${n.repoInfo_}) has already been deleted.`),Yk(n),delete t[n.key]}function hD(n,e,t,r){let s=Hu[e.name];s||(s={},Hu[e.name]=s);let i=s[n.toURLString()];return i&&nn("Database initialized multiple times. Please make sure the format of the database URL matches with each database() call."),i=new Uk(n,aD,t,r),s[n.toURLString()]=i,i}class dD{constructor(e,t){this._repoInternal=e,this.app=t,this.type="database",this._instanceStarted=!1}get _repo(){return this._instanceStarted||(Bk(this._repoInternal,this.app.options.appId,this.app.options.databaseAuthVariableOverride),this._instanceStarted=!0),this._repoInternal}get _root(){return this._rootInternal||(this._rootInternal=new cn(this._repo,oe())),this._rootInternal}_delete(){return this._rootInternal!==null&&(uD(this._repo,this.app.name),this._repoInternal=null,this._rootInternal=null),Promise.resolve()}_checkNotDeleted(e){this._rootInternal===null&&nn("Cannot call "+e+" on a deleted database.")}}function fD(n=Ic(),e){const t=Vs(n,"database").getImmediate({identifier:e});if(!t._instanceStarted){const r=_c("database");r&&pD(t,...r)}return t}function pD(n,e,t,r={}){n=te(n),n._checkNotDeleted("useEmulator");const s=`${e}:${t}`,i=n._repoInternal;if(n._instanceStarted){if(s===n._repoInternal.repoInfo_.host&&Jt(r,i.repoInfo_.emulatorOptions))return;nn("connectDatabaseEmulator() cannot initialize or alter the emulator configuration after the database instance has started.")}let o;if(i.repoInfo_.nodeAdmin)r.mockUserToken&&nn('mockUserToken is not supported by the Admin SDK. For client access with mock users, please use the "firebase" package instead of "firebase-admin".'),o=new Ra(Ra.OWNER);else if(r.mockUserToken){const a=typeof r.mockUserToken=="string"?r.mockUserToken:Xu(r.mockUserToken,n.app.options.projectId);o=new Ra(a)}wt(e)&&(yo(e),mc("Database",!0)),cD(i,s,r,o)}/**
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
 */function _D(n){rN(Os),Zt(new Bt("database",(e,{instanceIdentifier:t})=>{const r=e.getProvider("app").getImmediate(),s=e.getProvider("auth-internal"),i=e.getProvider("app-check-internal");return lD(r,s,i,t)},"PUBLIC").setMultipleInstances(!0)),ut(L_,F_,n),ut(L_,F_,"esm2020")}/**
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
 */const mD={".sv":"timestamp"};function Ix(){return mD}Yt.prototype.simpleListen=function(n,e){this.sendRequest("q",{p:n},e)};Yt.prototype.echo=function(n,e){this.sendRequest("echo",{d:n},e)};_D();const gD={apiKey:"AIzaSyBdE26vC0UAprsdTgBcmYrVuO67ZbccMTA",authDomain:"apps-script-api-443402.firebaseapp.com",databaseURL:"https://apps-script-api-443402-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"apps-script-api-443402",storageBucket:"apps-script-api-443402.firebasestorage.app",messagingSenderId:"46453918785",appId:"1:46453918785:web:a3c386def8dfe69f768ac0",measurementId:"G-TCZ9TL8FLW"},il=Fm(gD),yD=_I(il,"anxi-app"),ID=DP(il),ED=tN(il,"asia-east1"),TD=fD(il),Ex=Object.freeze(Object.defineProperty({__proto__:null,db:yD,functions:ED,rtdb:TD,storage:ID},Symbol.toStringTag,{value:"Module"}));function mT(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const wD=mT,gT=new Io("auth","Firebase",mT());/**
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
 */const uc=new yc("@firebase/auth");function vD(n,...e){uc.logLevel<=ne.WARN&&uc.warn(`Auth (${Os}): ${n}`,...e)}function Sa(n,...e){uc.logLevel<=ne.ERROR&&uc.error(`Auth (${Os}): ${n}`,...e)}/**
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
 */function gm(n,...e){throw Kd(n,...e)}function yT(n,...e){return Kd(n,...e)}function IT(n,e,t){const r={...wD(),[e]:t};return new Io("auth","Firebase",r).create(e,{appName:n.name})}function Ca(n){return IT(n,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function Kd(n,...e){if(typeof n!="string"){const t=e[0],r=[...e.slice(1)];return r[0]&&(r[0].appName=n.name),n._errorFactory.create(t,...r)}return gT.create(n,...e)}function ae(n,e,...t){if(!n)throw Kd(e,...t)}function ji(n){const e="INTERNAL ASSERTION FAILED: "+n;throw Sa(e),new Error(e)}function hc(n,e){n||ji(e)}function AD(){return ym()==="http:"||ym()==="https:"}function ym(){var n;return typeof self<"u"&&((n=self.location)==null?void 0:n.protocol)||null}/**
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
 */function bD(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(AD()||Ew()||"connection"in navigator)?navigator.onLine:!0}function RD(){if(typeof navigator>"u")return null;const n=navigator;return n.languages&&n.languages[0]||n.language||null}/**
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
 */class qo{constructor(e,t){this.shortDelay=e,this.longDelay=t,hc(t>e,"Short delay should be less than long delay!"),this.isMobile=Zu()||xm()}get(){return bD()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
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
 */function SD(n,e){hc(n.emulator,"Emulator should always be set here");const{url:t}=n.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
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
 */class ET{static initialize(e,t,r){this.fetchImpl=e,t&&(this.headersImpl=t),r&&(this.responseImpl=r)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;ji("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;ji("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;ji("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
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
 */const CD={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
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
 */const PD=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],ND=new qo(3e4,6e4);function TT(n,e){return n.tenantId&&!e.tenantId?{...e,tenantId:n.tenantId}:e}async function ol(n,e,t,r,s={}){return wT(n,s,async()=>{let i={},o={};r&&(e==="GET"?o=r:i={body:JSON.stringify(r)});const a=eh({key:n.config.apiKey,...o}).slice(1),l=await n._getAdditionalHeaders();l["Content-Type"]="application/json",n.languageCode&&(l["X-Firebase-Locale"]=n.languageCode);const u={method:e,headers:l,...i};return Iw()||(u.referrerPolicy="no-referrer"),n.emulatorConfig&&wt(n.emulatorConfig.host)&&(u.credentials="include"),ET.fetch()(await vT(n,n.config.apiHost,t,a),u)})}async function wT(n,e,t){n._canInitEmulator=!1;const r={...CD,...e};try{const s=new kD(n),i=await Promise.race([t(),s.promise]);s.clearNetworkTimeout();const o=await i.json();if("needConfirmation"in o)throw _a(n,"account-exists-with-different-credential",o);if(i.ok&&!("errorMessage"in o))return o;{const a=i.ok?o.errorMessage:o.error.message,[l,u]=a.split(" : ");if(l==="FEDERATED_USER_ID_ALREADY_LINKED")throw _a(n,"credential-already-in-use",o);if(l==="EMAIL_EXISTS")throw _a(n,"email-already-in-use",o);if(l==="USER_DISABLED")throw _a(n,"user-disabled",o);const d=r[l]||l.toLowerCase().replace(/[_\s]+/g,"-");if(u)throw IT(n,d,u);gm(n,d)}}catch(s){if(s instanceof zt)throw s;gm(n,"network-request-failed",{message:String(s)})}}async function vT(n,e,t,r){const s=`${e}${t}?${r}`,i=n,o=i.config.emulator?SD(n.config,s):`${n.config.apiScheme}://${s}`;return PD.includes(t)&&(await i._persistenceManagerAvailable,i._getPersistenceType()==="COOKIE")?i._getPersistence()._getFinalTarget(o).toString():o}class kD{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,r)=>{this.timer=setTimeout(()=>r(yT(this.auth,"network-request-failed")),ND.get())})}}function _a(n,e,t){const r={appName:n.name};t.email&&(r.email=t.email),t.phoneNumber&&(r.phoneNumber=t.phoneNumber);const s=yT(n,e,r);return s.customData._tokenResponse=t,s}/**
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
 */async function DD(n,e){return ol(n,"POST","/v1/accounts:delete",e)}async function dc(n,e){return ol(n,"POST","/v1/accounts:lookup",e)}/**
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
 */function Wi(n){if(n)try{const e=new Date(Number(n));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function xD(n,e=!1){const t=te(n),r=await t.getIdToken(e),s=AT(r);ae(s&&s.exp&&s.auth_time&&s.iat,t.auth,"internal-error");const i=typeof s.firebase=="object"?s.firebase:void 0,o=i==null?void 0:i.sign_in_provider;return{claims:s,token:r,authTime:Wi(Jl(s.auth_time)),issuedAtTime:Wi(Jl(s.iat)),expirationTime:Wi(Jl(s.exp)),signInProvider:o||null,signInSecondFactor:(i==null?void 0:i.sign_in_second_factor)||null}}function Jl(n){return Number(n)*1e3}function AT(n){const[e,t,r]=n.split(".");if(e===void 0||t===void 0||r===void 0)return Sa("JWT malformed, contained fewer than 3 sections"),null;try{const s=Na(t);return s?JSON.parse(s):(Sa("Failed to decode base64 JWT payload"),null)}catch(s){return Sa("Caught error parsing JWT payload as JSON",s==null?void 0:s.toString()),null}}function Im(n){const e=AT(n);return ae(e,"internal-error"),ae(typeof e.exp<"u","internal-error"),ae(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
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
 */async function Qu(n,e,t=!1){if(t)return e;try{return await e}catch(r){throw r instanceof zt&&VD(r)&&n.auth.currentUser===n&&await n.auth.signOut(),r}}function VD({code:n}){return n==="auth/user-disabled"||n==="auth/user-token-expired"}/**
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
 */class OD{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){const t=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),t}else{this.errorBackoff=3e4;const r=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,r)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
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
 */class Yu{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=Wi(this.lastLoginAt),this.creationTime=Wi(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
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
 */async function fc(n){var f;const e=n.auth,t=await n.getIdToken(),r=await Qu(n,dc(e,{idToken:t}));ae(r==null?void 0:r.users.length,e,"internal-error");const s=r.users[0];n._notifyReloadListener(s);const i=(f=s.providerUserInfo)!=null&&f.length?bT(s.providerUserInfo):[],o=LD(n.providerData,i),a=n.isAnonymous,l=!(n.email&&s.passwordHash)&&!(o!=null&&o.length),u=a?l:!1,d={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:o,metadata:new Yu(s.createdAt,s.lastLoginAt),isAnonymous:u};Object.assign(n,d)}async function MD(n){const e=te(n);await fc(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function LD(n,e){return[...n.filter(r=>!e.some(s=>s.providerId===r.providerId)),...e]}function bT(n){return n.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||"",displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}/**
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
 */async function FD(n,e){const t=await wT(n,{},async()=>{const r=eh({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:s,apiKey:i}=n.config,o=await vT(n,s,"/v1/token",`key=${i}`),a=await n._getAdditionalHeaders();a["Content-Type"]="application/x-www-form-urlencoded";const l={method:"POST",headers:a,body:r};return n.emulatorConfig&&wt(n.emulatorConfig.host)&&(l.credentials="include"),ET.fetch()(o,l)});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function UD(n,e){return ol(n,"POST","/v2/accounts:revokeToken",TT(n,e))}/**
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
 */class rs{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){ae(e.idToken,"internal-error"),ae(typeof e.idToken<"u","internal-error"),ae(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):Im(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){ae(e.length!==0,"internal-error");const t=Im(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(ae(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:r,refreshToken:s,expiresIn:i}=await FD(e,t);this.updateTokensAndExpiration(r,s,Number(i))}updateTokensAndExpiration(e,t,r){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+r*1e3}static fromJSON(e,t){const{refreshToken:r,accessToken:s,expirationTime:i}=t,o=new rs;return r&&(ae(typeof r=="string","internal-error",{appName:e}),o.refreshToken=r),s&&(ae(typeof s=="string","internal-error",{appName:e}),o.accessToken=s),i&&(ae(typeof i=="number","internal-error",{appName:e}),o.expirationTime=i),o}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new rs,this.toJSON())}_performRefresh(){return ji("not implemented")}}/**
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
 */function yn(n,e){ae(typeof n=="string"||typeof n>"u","internal-error",{appName:e})}class Lt{constructor({uid:e,auth:t,stsTokenManager:r,...s}){this.providerId="firebase",this.proactiveRefresh=new OD(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=r,this.accessToken=r.accessToken,this.displayName=s.displayName||null,this.email=s.email||null,this.emailVerified=s.emailVerified||!1,this.phoneNumber=s.phoneNumber||null,this.photoURL=s.photoURL||null,this.isAnonymous=s.isAnonymous||!1,this.tenantId=s.tenantId||null,this.providerData=s.providerData?[...s.providerData]:[],this.metadata=new Yu(s.createdAt||void 0,s.lastLoginAt||void 0)}async getIdToken(e){const t=await Qu(this,this.stsTokenManager.getToken(this.auth,e));return ae(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return xD(this,e)}reload(){return MD(this)}_assign(e){this!==e&&(ae(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>({...t})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new Lt({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return t.metadata._copy(this.metadata),t}_onReload(e){ae(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let r=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),r=!0),t&&await fc(this),await this.auth._persistUserIfCurrent(this),r&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(xt(this.auth.app))return Promise.reject(Ca(this.auth));const e=await this.getIdToken();return await Qu(this,DD(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){const r=t.displayName??void 0,s=t.email??void 0,i=t.phoneNumber??void 0,o=t.photoURL??void 0,a=t.tenantId??void 0,l=t._redirectEventId??void 0,u=t.createdAt??void 0,d=t.lastLoginAt??void 0,{uid:f,emailVerified:_,isAnonymous:g,providerData:v,stsTokenManager:C}=t;ae(f&&C,e,"internal-error");const N=rs.fromJSON(this.name,C);ae(typeof f=="string",e,"internal-error"),yn(r,e.name),yn(s,e.name),ae(typeof _=="boolean",e,"internal-error"),ae(typeof g=="boolean",e,"internal-error"),yn(i,e.name),yn(o,e.name),yn(a,e.name),yn(l,e.name),yn(u,e.name),yn(d,e.name);const V=new Lt({uid:f,auth:e,email:s,emailVerified:_,displayName:r,isAnonymous:g,photoURL:o,phoneNumber:i,tenantId:a,stsTokenManager:N,createdAt:u,lastLoginAt:d});return v&&Array.isArray(v)&&(V.providerData=v.map(B=>({...B}))),l&&(V._redirectEventId=l),V}static async _fromIdTokenResponse(e,t,r=!1){const s=new rs;s.updateFromServerResponse(t);const i=new Lt({uid:t.localId,auth:e,stsTokenManager:s,isAnonymous:r});return await fc(i),i}static async _fromGetAccountInfoResponse(e,t,r){const s=t.users[0];ae(s.localId!==void 0,"internal-error");const i=s.providerUserInfo!==void 0?bT(s.providerUserInfo):[],o=!(s.email&&s.passwordHash)&&!(i!=null&&i.length),a=new rs;a.updateFromIdToken(r);const l=new Lt({uid:s.localId,auth:e,stsTokenManager:a,isAnonymous:o}),u={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:i,metadata:new Yu(s.createdAt,s.lastLoginAt),isAnonymous:!(s.email&&s.passwordHash)&&!(i!=null&&i.length)};return Object.assign(l,u),l}}/**
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
 */const Em=new Map;function fr(n){hc(n instanceof Function,"Expected a class definition");let e=Em.get(n);return e?(hc(e instanceof n,"Instance stored in cache mismatched with class"),e):(e=new n,Em.set(n,e),e)}/**
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
 */class RT{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}RT.type="NONE";const Tm=RT;/**
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
 */function Xl(n,e,t){return`firebase:${n}:${e}:${t}`}class ss{constructor(e,t,r){this.persistence=e,this.auth=t,this.userKey=r;const{config:s,name:i}=this.auth;this.fullUserKey=Xl(this.userKey,s.apiKey,i),this.fullPersistenceKey=Xl("persistence",s.apiKey,i),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const t=await dc(this.auth,{idToken:e}).catch(()=>{});return t?Lt._fromGetAccountInfoResponse(this.auth,t,e):null}return Lt._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,r="authUser"){if(!t.length)return new ss(fr(Tm),e,r);const s=(await Promise.all(t.map(async u=>{if(await u._isAvailable())return u}))).filter(u=>u);let i=s[0]||fr(Tm);const o=Xl(r,e.config.apiKey,e.name);let a=null;for(const u of t)try{const d=await u._get(o);if(d){let f;if(typeof d=="string"){const _=await dc(e,{idToken:d}).catch(()=>{});if(!_)break;f=await Lt._fromGetAccountInfoResponse(e,_,d)}else f=Lt._fromJSON(e,d);u!==i&&(a=f),i=u;break}}catch{}const l=s.filter(u=>u._shouldAllowMigration);return!i._shouldAllowMigration||!l.length?new ss(i,e,r):(i=l[0],a&&await i._set(o,a.toJSON()),await Promise.all(t.map(async u=>{if(u!==i)try{await u._remove(o)}catch{}})),new ss(i,e,r))}}/**
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
 */function wm(n){const e=n.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(zD(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(BD(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(jD(e))return"Blackberry";if(WD(e))return"Webos";if(qD(e))return"Safari";if((e.includes("chrome/")||GD(e))&&!e.includes("edge/"))return"Chrome";if($D(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,r=n.match(t);if((r==null?void 0:r.length)===2)return r[1]}return"Other"}function BD(n=pt()){return/firefox\//i.test(n)}function qD(n=pt()){const e=n.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function GD(n=pt()){return/crios\//i.test(n)}function zD(n=pt()){return/iemobile/i.test(n)}function $D(n=pt()){return/android/i.test(n)}function jD(n=pt()){return/blackberry/i.test(n)}function WD(n=pt()){return/webos/i.test(n)}/**
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
 */function ST(n,e=[]){let t;switch(n){case"Browser":t=wm(pt());break;case"Worker":t=`${wm(pt())}-${n}`;break;default:t=n}const r=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${Os}/${r}`}/**
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
 */class KD{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const r=i=>new Promise((o,a)=>{try{const l=e(i);o(l)}catch(l){a(l)}});r.onAbort=t,this.queue.push(r);const s=this.queue.length-1;return()=>{this.queue[s]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const r of this.queue)await r(e),r.onAbort&&t.push(r.onAbort)}catch(r){t.reverse();for(const s of t)try{s()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:r==null?void 0:r.message})}}}/**
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
 */async function HD(n,e={}){return ol(n,"GET","/v2/passwordPolicy",TT(n,e))}/**
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
 */const QD=6;class YD{constructor(e){var r;const t=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=t.minPasswordLength??QD,t.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=t.maxPasswordLength),t.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=t.containsLowercaseCharacter),t.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=t.containsUppercaseCharacter),t.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=t.containsNumericCharacter),t.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=t.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=((r=e.allowedNonAlphanumericCharacters)==null?void 0:r.join(""))??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){const t={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,t),this.validatePasswordCharacterOptions(e,t),t.isValid&&(t.isValid=t.meetsMinPasswordLength??!0),t.isValid&&(t.isValid=t.meetsMaxPasswordLength??!0),t.isValid&&(t.isValid=t.containsLowercaseLetter??!0),t.isValid&&(t.isValid=t.containsUppercaseLetter??!0),t.isValid&&(t.isValid=t.containsNumericCharacter??!0),t.isValid&&(t.isValid=t.containsNonAlphanumericCharacter??!0),t}validatePasswordLengthOptions(e,t){const r=this.customStrengthOptions.minPasswordLength,s=this.customStrengthOptions.maxPasswordLength;r&&(t.meetsMinPasswordLength=e.length>=r),s&&(t.meetsMaxPasswordLength=e.length<=s)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let r;for(let s=0;s<e.length;s++)r=e.charAt(s),this.updatePasswordCharacterOptionsStatuses(t,r>="a"&&r<="z",r>="A"&&r<="Z",r>="0"&&r<="9",this.allowedNonAlphanumericCharacters.includes(r))}updatePasswordCharacterOptionsStatuses(e,t,r,s,i){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=r)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=s)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=i))}}/**
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
 */class JD{constructor(e,t,r,s){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=r,this.config=s,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new vm(this),this.idTokenSubscription=new vm(this),this.beforeStateQueue=new KD(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=gT,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=s.sdkClientVersion,this._persistenceManagerAvailable=new Promise(i=>this._resolvePersistenceManagerAvailable=i)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=fr(t)),this._initializationPromise=this.queue(async()=>{var r,s,i;if(!this._deleted&&(this.persistenceManager=await ss.create(this,e),(r=this._resolvePersistenceManagerAvailable)==null||r.call(this),!this._deleted)){if((s=this._popupRedirectResolver)!=null&&s._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=((i=this.currentUser)==null?void 0:i.uid)||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await dc(this,{idToken:e}),r=await Lt._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(r)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var i;if(xt(this.app)){const o=this.app.settings.authIdToken;return o?new Promise(a=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(o).then(a,a))}):this.directlySetCurrentUser(null)}const t=await this.assertedPersistence.getCurrentUser();let r=t,s=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const o=(i=this.redirectUser)==null?void 0:i._redirectEventId,a=r==null?void 0:r._redirectEventId,l=await this.tryRedirectSignIn(e);(!o||o===a)&&(l!=null&&l.user)&&(r=l.user,s=!0)}if(!r)return this.directlySetCurrentUser(null);if(!r._redirectEventId){if(s)try{await this.beforeStateQueue.runMiddleware(r)}catch(o){r=t,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(o))}return r?this.reloadAndSetCurrentUserOrClear(r):this.directlySetCurrentUser(null)}return ae(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===r._redirectEventId?this.directlySetCurrentUser(r):this.reloadAndSetCurrentUserOrClear(r)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await fc(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=RD()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(xt(this.app))return Promise.reject(Ca(this));const t=e?te(e):null;return t&&ae(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&ae(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return xt(this.app)?Promise.reject(Ca(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return xt(this.app)?Promise.reject(Ca(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(fr(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await HD(this),t=new YD(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new Io("auth","Firebase",e())}onAuthStateChanged(e,t,r){return this.registerStateListener(this.authStateSubscription,e,t,r)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,r){return this.registerStateListener(this.idTokenSubscription,e,t,r)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const r=this.onAuthStateChanged(()=>{r(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),r={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(r.tenantId=this.tenantId),await UD(this,r)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)==null?void 0:e.toJSON()}}async _setRedirectUser(e,t){const r=await this.getOrInitRedirectPersistenceManager(t);return e===null?r.removeCurrentUser():r.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&fr(e)||this._popupRedirectResolver;ae(t,this,"argument-error"),this.redirectPersistenceManager=await ss.create(this,[fr(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,r;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)==null?void 0:t._redirectEventId)===e?this._currentUser:((r=this.redirectUser)==null?void 0:r._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const e=((t=this.currentUser)==null?void 0:t.uid)??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,r,s){if(this._deleted)return()=>{};const i=typeof t=="function"?t:t.next.bind(t);let o=!1;const a=this._isInitialized?Promise.resolve():this._initializationPromise;if(ae(a,this,"internal-error"),a.then(()=>{o||i(this.currentUser)}),typeof t=="function"){const l=e.addObserver(t,r,s);return()=>{o=!0,l()}}else{const l=e.addObserver(t);return()=>{o=!0,l()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return ae(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=ST(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var s;const e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);const t=await((s=this.heartbeatServiceProvider.getImmediate({optional:!0}))==null?void 0:s.getHeartbeatsHeader());t&&(e["X-Firebase-Client"]=t);const r=await this._getAppCheckToken();return r&&(e["X-Firebase-AppCheck"]=r),e}async _getAppCheckToken(){var t;if(xt(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=await((t=this.appCheckServiceProvider.getImmediate({optional:!0}))==null?void 0:t.getToken());return e!=null&&e.error&&vD(`Error while retrieving App Check token: ${e.error}`),e==null?void 0:e.token}}function XD(n){return te(n)}class vm{constructor(e){this.auth=e,this.observer=null,this.addObserver=Pw(t=>this.observer=t)}get next(){return ae(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}function ZD(n,e){const t=(e==null?void 0:e.persistence)||[],r=(Array.isArray(t)?t:[t]).map(fr);e!=null&&e.errorMap&&n._updateErrorMap(e.errorMap),n._initializeWithPersistence(r,e==null?void 0:e.popupRedirectResolver)}new qo(3e4,6e4);/**
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
 */new qo(2e3,1e4);/**
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
 */new qo(3e4,6e4);/**
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
 */new qo(5e3,15e3);var Am="@firebase/auth",bm="1.11.1";/**
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
 */class ex{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)==null?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(r=>{e((r==null?void 0:r.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){ae(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
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
 */function tx(n){switch(n){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function nx(n){Zt(new Bt("auth",(e,{options:t})=>{const r=e.getProvider("app").getImmediate(),s=e.getProvider("heartbeat"),i=e.getProvider("app-check-internal"),{apiKey:o,authDomain:a}=r.options;ae(o&&!o.includes(":"),"invalid-api-key",{appName:r.name});const l={apiKey:o,authDomain:a,clientPlatform:n,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:ST(n)},u=new JD(r,s,i,l);return ZD(u,t),u},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,r)=>{e.getProvider("auth-internal").initialize()})),Zt(new Bt("auth-internal",e=>{const t=XD(e.getProvider("auth").getImmediate());return(r=>new ex(r))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),ut(Am,bm,tx(n)),ut(Am,bm,"esm2020")}/**
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
 */const rx=300;mw("authIdTokenMaxAge");nx("Browser");export{hx as A,fx as B,TD as C,uC as D,Ix as E,_x as F,GS as G,ID as H,zS as I,cx as J,yS as K,_C as L,ce as T,jS as a,eS as b,ZR as c,yD as d,$S as e,ux as f,fI as g,hS as h,Ex as i,ED as j,mx as k,HS as l,MS as m,US as n,lx as o,tN as p,dx as q,fC as r,ax as s,wS as t,yx as u,px as v,ku as w,gx as x,TS as y,gS as z};
