import{q as Y_}from"./vendor-B96YLxiF.js";const X_=()=>{};var Zc={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yh={NODE_ADMIN:!1,SDK_VERSION:"${JSCORE_VERSION}"};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const V=function(n,e){if(!n)throw Xn(e)},Xn=function(n){return new Error("Firebase Database ("+Yh.SDK_VERSION+") INTERNAL ASSERT FAILED: "+n)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xh=function(n){const e=[];let t=0;for(let s=0;s<n.length;s++){let r=n.charCodeAt(s);r<128?e[t++]=r:r<2048?(e[t++]=r>>6|192,e[t++]=r&63|128):(r&64512)===55296&&s+1<n.length&&(n.charCodeAt(s+1)&64512)===56320?(r=65536+((r&1023)<<10)+(n.charCodeAt(++s)&1023),e[t++]=r>>18|240,e[t++]=r>>12&63|128,e[t++]=r>>6&63|128,e[t++]=r&63|128):(e[t++]=r>>12|224,e[t++]=r>>6&63|128,e[t++]=r&63|128)}return e},J_=function(n){const e=[];let t=0,s=0;for(;t<n.length;){const r=n[t++];if(r<128)e[s++]=String.fromCharCode(r);else if(r>191&&r<224){const i=n[t++];e[s++]=String.fromCharCode((r&31)<<6|i&63)}else if(r>239&&r<365){const i=n[t++],a=n[t++],l=n[t++],u=((r&7)<<18|(i&63)<<12|(a&63)<<6|l&63)-65536;e[s++]=String.fromCharCode(55296+(u>>10)),e[s++]=String.fromCharCode(56320+(u&1023))}else{const i=n[t++],a=n[t++];e[s++]=String.fromCharCode((r&15)<<12|(i&63)<<6|a&63)}}return e.join("")},Da={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,e){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,s=[];for(let r=0;r<n.length;r+=3){const i=n[r],a=r+1<n.length,l=a?n[r+1]:0,u=r+2<n.length,h=u?n[r+2]:0,f=i>>2,p=(i&3)<<4|l>>4;let m=(l&15)<<2|h>>6,I=h&63;u||(I=64,a||(m=64)),s.push(t[f],t[p],t[m],t[I])}return s.join("")},encodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(n):this.encodeByteArray(Xh(n),e)},decodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(n):J_(this.decodeStringToByteArray(n,e))},decodeStringToByteArray(n,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,s=[];for(let r=0;r<n.length;){const i=t[n.charAt(r++)],l=r<n.length?t[n.charAt(r)]:0;++r;const h=r<n.length?t[n.charAt(r)]:64;++r;const p=r<n.length?t[n.charAt(r)]:64;if(++r,i==null||l==null||h==null||p==null)throw new Z_;const m=i<<2|l>>4;if(s.push(m),h!==64){const I=l<<4&240|h>>2;if(s.push(I),p!==64){const C=h<<6&192|p;s.push(C)}}}return s},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class Z_ extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Jh=function(n){const e=Xh(n);return Da.encodeByteArray(e,!0)},Xr=function(n){return Jh(n).replace(/\./g,"")},Wo=function(n){try{return Da.decodeString(n,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function em(n){return Zh(void 0,n)}function Zh(n,e){if(!(e instanceof Object))return e;switch(e.constructor){case Date:const t=e;return new Date(t.getTime());case Object:n===void 0&&(n={});break;case Array:n=[];break;default:return e}for(const t in e)!e.hasOwnProperty(t)||!tm(t)||(n[t]=Zh(n[t],e[t]));return n}function tm(n){return n!=="__proto__"}/**
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
 */function nm(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
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
 */const sm=()=>nm().__FIREBASE_DEFAULTS__,rm=()=>{if(typeof process>"u"||typeof Zc>"u")return;const n=Zc.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},im=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=n&&Wo(n[1]);return e&&JSON.parse(e)},Va=()=>{try{return X_()||sm()||rm()||im()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},om=n=>{var e,t;return(t=(e=Va())==null?void 0:e.emulatorHosts)==null?void 0:t[n]},Ti=n=>{const e=om(n);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const s=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),s]:[e.substring(0,t),s]},ed=()=>{var n;return(n=Va())==null?void 0:n.config};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wt{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,s)=>{t?this.reject(t):this.resolve(s),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,s))}}}/**
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
 */function Yt(n){try{return(n.startsWith("http://")||n.startsWith("https://")?new URL(n).hostname:n).endsWith(".cloudworkstations.dev")}catch{return!1}}async function vi(n){return(await fetch(n,{credentials:"include"})).ok}/**
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
 */function Oa(n,e){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},s=e||"demo-project",r=n.iat||0,i=n.sub||n.user_id;if(!i)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const a={iss:`https://securetoken.google.com/${s}`,aud:s,iat:r,exp:r+3600,auth_time:r,sub:i,user_id:i,firebase:{sign_in_provider:"custom",identities:{}},...n};return[Xr(JSON.stringify(t)),Xr(JSON.stringify(a)),""].join(".")}const Os={};function am(){const n={prod:[],emulator:[]};for(const e of Object.keys(Os))Os[e]?n.emulator.push(e):n.prod.push(e);return n}function lm(n){let e=document.getElementById(n),t=!1;return e||(e=document.createElement("div"),e.setAttribute("id",n),t=!0),{created:t,element:e}}let eu=!1;function wi(n,e){if(typeof window>"u"||typeof document>"u"||!Yt(window.location.host)||Os[n]===e||Os[n]||eu)return;Os[n]=e;function t(m){return`__firebase__banner__${m}`}const s="__firebase__banner",i=am().prod.length>0;function a(){const m=document.getElementById(s);m&&m.remove()}function l(m){m.style.display="flex",m.style.background="#7faaf0",m.style.position="fixed",m.style.bottom="5px",m.style.left="5px",m.style.padding=".5em",m.style.borderRadius="5px",m.style.alignItems="center"}function u(m,I){m.setAttribute("width","24"),m.setAttribute("id",I),m.setAttribute("height","24"),m.setAttribute("viewBox","0 0 24 24"),m.setAttribute("fill","none"),m.style.marginLeft="-6px"}function h(){const m=document.createElement("span");return m.style.cursor="pointer",m.style.marginLeft="16px",m.style.fontSize="24px",m.innerHTML=" &times;",m.onclick=()=>{eu=!0,a()},m}function f(m,I){m.setAttribute("id",I),m.innerText="Learn more",m.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",m.setAttribute("target","__blank"),m.style.paddingLeft="5px",m.style.textDecoration="underline"}function p(){const m=lm(s),I=t("text"),C=document.getElementById(I)||document.createElement("span"),k=t("learnmore"),N=document.getElementById(k)||document.createElement("a"),B=t("preprendIcon"),L=document.getElementById(B)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(m.created){const U=m.element;l(U),f(N,k);const $=h();u(L,B),U.append(L,C,N,$),document.body.appendChild(U)}i?(C.innerText="Preview backend disconnected.",L.innerHTML=`<g clip-path="url(#clip0_6013_33858)">
<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6013_33858">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`):(L.innerHTML=`<g clip-path="url(#clip0_6083_34804)">
<path d="M11.4 15.2H12.6V11.2H11.4V15.2ZM12 10C12.1667 10 12.3056 9.94444 12.4167 9.83333C12.5389 9.71111 12.6 9.56667 12.6 9.4C12.6 9.23333 12.5389 9.09444 12.4167 8.98333C12.3056 8.86111 12.1667 8.8 12 8.8C11.8333 8.8 11.6889 8.86111 11.5667 8.98333C11.4556 9.09444 11.4 9.23333 11.4 9.4C11.4 9.56667 11.4556 9.71111 11.5667 9.83333C11.6889 9.94444 11.8333 10 12 10ZM12 18.4C11.1222 18.4 10.2944 18.2333 9.51667 17.9C8.73889 17.5667 8.05556 17.1111 7.46667 16.5333C6.88889 15.9444 6.43333 15.2611 6.1 14.4833C5.76667 13.7056 5.6 12.8778 5.6 12C5.6 11.1111 5.76667 10.2833 6.1 9.51667C6.43333 8.73889 6.88889 8.06111 7.46667 7.48333C8.05556 6.89444 8.73889 6.43333 9.51667 6.1C10.2944 5.76667 11.1222 5.6 12 5.6C12.8889 5.6 13.7167 5.76667 14.4833 6.1C15.2611 6.43333 15.9389 6.89444 16.5167 7.48333C17.1056 8.06111 17.5667 8.73889 17.9 9.51667C18.2333 10.2833 18.4 11.1111 18.4 12C18.4 12.8778 18.2333 13.7056 17.9 14.4833C17.5667 15.2611 17.1056 15.9444 16.5167 16.5333C15.9389 17.1111 15.2611 17.5667 14.4833 17.9C13.7167 18.2333 12.8889 18.4 12 18.4ZM12 17.2C13.4444 17.2 14.6722 16.6944 15.6833 15.6833C16.6944 14.6722 17.2 13.4444 17.2 12C17.2 10.5556 16.6944 9.32778 15.6833 8.31667C14.6722 7.30555 13.4444 6.8 12 6.8C10.5556 6.8 9.32778 7.30555 8.31667 8.31667C7.30556 9.32778 6.8 10.5556 6.8 12C6.8 13.4444 7.30556 14.6722 8.31667 15.6833C9.32778 16.6944 10.5556 17.2 12 17.2Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6083_34804">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`,C.innerText="Preview backend running in this workspace."),C.setAttribute("id",I)}document.readyState==="loading"?window.addEventListener("DOMContentLoaded",p):p()}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function td(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function nd(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(td())}function cm(){var e;const n=(e=Va())==null?void 0:e.forceEnvironment;if(n==="node")return!0;if(n==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function um(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function hm(){return Yh.NODE_ADMIN===!0}function dm(){return!cm()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function fm(){try{return typeof indexedDB=="object"}catch{return!1}}function pm(){return new Promise((n,e)=>{try{let t=!0;const s="validate-browser-context-for-indexeddb-analytics-module",r=self.indexedDB.open(s);r.onsuccess=()=>{r.result.close(),t||self.indexedDB.deleteDatabase(s),n(!0)},r.onupgradeneeded=()=>{t=!1},r.onerror=()=>{var i;e(((i=r.error)==null?void 0:i.message)||"")}}catch(t){e(t)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _m="FirebaseError";class Xt extends Error{constructor(e,t,s){super(t),this.code=e,this.customData=s,this.name=_m,Object.setPrototypeOf(this,Xt.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,sd.prototype.create)}}class sd{constructor(e,t,s){this.service=e,this.serviceName=t,this.errors=s}create(e,...t){const s=t[0]||{},r=`${this.service}/${e}`,i=this.errors[e],a=i?mm(i,s):"Error",l=`${this.serviceName}: ${a} (${r}).`;return new Xt(r,l,s)}}function mm(n,e){return n.replace(gm,(t,s)=>{const r=e[s];return r!=null?String(r):`<${s}?>`})}const gm=/\{\$([^}]+)}/g;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ws(n){return JSON.parse(n)}function Se(n){return JSON.stringify(n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rd=function(n){let e={},t={},s={},r="";try{const i=n.split(".");e=Ws(Wo(i[0])||""),t=Ws(Wo(i[1])||""),r=i[2],s=t.d||{},delete t.d}catch{}return{header:e,claims:t,data:s,signature:r}},ym=function(n){const e=rd(n),t=e.claims;return!!t&&typeof t=="object"&&t.hasOwnProperty("iat")},Em=function(n){const e=rd(n).claims;return typeof e=="object"&&e.admin===!0};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gt(n,e){return Object.prototype.hasOwnProperty.call(n,e)}function Un(n,e){if(Object.prototype.hasOwnProperty.call(n,e))return n[e]}function zo(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}function Jr(n,e,t){const s={};for(const r in n)Object.prototype.hasOwnProperty.call(n,r)&&(s[r]=e.call(t,n[r],r,n));return s}function zs(n,e){if(n===e)return!0;const t=Object.keys(n),s=Object.keys(e);for(const r of t){if(!s.includes(r))return!1;const i=n[r],a=e[r];if(tu(i)&&tu(a)){if(!zs(i,a))return!1}else if(i!==a)return!1}for(const r of s)if(!t.includes(r))return!1;return!0}function tu(n){return n!==null&&typeof n=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Tm(n){const e=[];for(const[t,s]of Object.entries(n))Array.isArray(s)?s.forEach(r=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(r))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(s));return e.length?"&"+e.join("&"):""}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vm{constructor(){this.chain_=[],this.buf_=[],this.W_=[],this.pad_=[],this.inbuf_=0,this.total_=0,this.blockSize=512/8,this.pad_[0]=128;for(let e=1;e<this.blockSize;++e)this.pad_[e]=0;this.reset()}reset(){this.chain_[0]=1732584193,this.chain_[1]=4023233417,this.chain_[2]=2562383102,this.chain_[3]=271733878,this.chain_[4]=3285377520,this.inbuf_=0,this.total_=0}compress_(e,t){t||(t=0);const s=this.W_;if(typeof e=="string")for(let p=0;p<16;p++)s[p]=e.charCodeAt(t)<<24|e.charCodeAt(t+1)<<16|e.charCodeAt(t+2)<<8|e.charCodeAt(t+3),t+=4;else for(let p=0;p<16;p++)s[p]=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3],t+=4;for(let p=16;p<80;p++){const m=s[p-3]^s[p-8]^s[p-14]^s[p-16];s[p]=(m<<1|m>>>31)&4294967295}let r=this.chain_[0],i=this.chain_[1],a=this.chain_[2],l=this.chain_[3],u=this.chain_[4],h,f;for(let p=0;p<80;p++){p<40?p<20?(h=l^i&(a^l),f=1518500249):(h=i^a^l,f=1859775393):p<60?(h=i&a|l&(i|a),f=2400959708):(h=i^a^l,f=3395469782);const m=(r<<5|r>>>27)+h+u+f+s[p]&4294967295;u=l,l=a,a=(i<<30|i>>>2)&4294967295,i=r,r=m}this.chain_[0]=this.chain_[0]+r&4294967295,this.chain_[1]=this.chain_[1]+i&4294967295,this.chain_[2]=this.chain_[2]+a&4294967295,this.chain_[3]=this.chain_[3]+l&4294967295,this.chain_[4]=this.chain_[4]+u&4294967295}update(e,t){if(e==null)return;t===void 0&&(t=e.length);const s=t-this.blockSize;let r=0;const i=this.buf_;let a=this.inbuf_;for(;r<t;){if(a===0)for(;r<=s;)this.compress_(e,r),r+=this.blockSize;if(typeof e=="string"){for(;r<t;)if(i[a]=e.charCodeAt(r),++a,++r,a===this.blockSize){this.compress_(i),a=0;break}}else for(;r<t;)if(i[a]=e[r],++a,++r,a===this.blockSize){this.compress_(i),a=0;break}}this.inbuf_=a,this.total_+=t}digest(){const e=[];let t=this.total_*8;this.inbuf_<56?this.update(this.pad_,56-this.inbuf_):this.update(this.pad_,this.blockSize-(this.inbuf_-56));for(let r=this.blockSize-1;r>=56;r--)this.buf_[r]=t&255,t/=256;this.compress_(this.buf_);let s=0;for(let r=0;r<5;r++)for(let i=24;i>=0;i-=8)e[s]=this.chain_[r]>>i&255,++s;return e}}function Bn(n,e){return`${n} failed: ${e} argument `}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wm=function(n){const e=[];let t=0;for(let s=0;s<n.length;s++){let r=n.charCodeAt(s);if(r>=55296&&r<=56319){const i=r-55296;s++,V(s<n.length,"Surrogate pair missing trail surrogate.");const a=n.charCodeAt(s)-56320;r=65536+(i<<10)+a}r<128?e[t++]=r:r<2048?(e[t++]=r>>6|192,e[t++]=r&63|128):r<65536?(e[t++]=r>>12|224,e[t++]=r>>6&63|128,e[t++]=r&63|128):(e[t++]=r>>18|240,e[t++]=r>>12&63|128,e[t++]=r>>6&63|128,e[t++]=r&63|128)}return e},Ii=function(n){let e=0;for(let t=0;t<n.length;t++){const s=n.charCodeAt(t);s<128?e++:s<2048?e+=2:s>=55296&&s<=56319?(e+=4,t++):e+=3}return e};/**
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
 */function ie(n){return n&&n._delegate?n._delegate:n}class jt{constructor(e,t,s){this.name=e,this.instanceFactory=t,this.type=s,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
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
 */const on="[DEFAULT]";/**
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
 */class Im{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const s=new wt;if(this.instancesDeferred.set(t,s),this.isInitialized(t)||this.shouldAutoInitialize())try{const r=this.getOrInitializeService({instanceIdentifier:t});r&&s.resolve(r)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),s=(e==null?void 0:e.optional)??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(r){if(s)return null;throw r}else{if(s)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(Rm(e))try{this.getOrInitializeService({instanceIdentifier:on})}catch{}for(const[t,s]of this.instancesDeferred.entries()){const r=this.normalizeInstanceIdentifier(t);try{const i=this.getOrInitializeService({instanceIdentifier:r});s.resolve(i)}catch{}}}}clearInstance(e=on){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=on){return this.instances.has(e)}getOptions(e=on){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,s=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(s))throw Error(`${this.name}(${s}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const r=this.getOrInitializeService({instanceIdentifier:s,options:t});for(const[i,a]of this.instancesDeferred.entries()){const l=this.normalizeInstanceIdentifier(i);s===l&&a.resolve(r)}return r}onInit(e,t){const s=this.normalizeInstanceIdentifier(t),r=this.onInitCallbacks.get(s)??new Set;r.add(e),this.onInitCallbacks.set(s,r);const i=this.instances.get(s);return i&&e(i,s),()=>{r.delete(e)}}invokeOnInitCallbacks(e,t){const s=this.onInitCallbacks.get(t);if(s)for(const r of s)try{r(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let s=this.instances.get(e);if(!s&&this.component&&(s=this.component.instanceFactory(this.container,{instanceIdentifier:Am(e),options:t}),this.instances.set(e,s),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(s,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,s)}catch{}return s||null}normalizeInstanceIdentifier(e=on){return this.component?this.component.multipleInstances?e:on:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Am(n){return n===on?void 0:n}function Rm(n){return n.instantiationMode==="EAGER"}/**
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
 */class Cm{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new Im(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var K;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(K||(K={}));const Sm={debug:K.DEBUG,verbose:K.VERBOSE,info:K.INFO,warn:K.WARN,error:K.ERROR,silent:K.SILENT},bm=K.INFO,Pm={[K.DEBUG]:"log",[K.VERBOSE]:"log",[K.INFO]:"info",[K.WARN]:"warn",[K.ERROR]:"error"},Nm=(n,e,...t)=>{if(e<n.logLevel)return;const s=new Date().toISOString(),r=Pm[e];if(r)console[r](`[${s}]  ${n.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class xa{constructor(e){this.name=e,this._logLevel=bm,this._logHandler=Nm,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in K))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?Sm[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,K.DEBUG,...e),this._logHandler(this,K.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,K.VERBOSE,...e),this._logHandler(this,K.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,K.INFO,...e),this._logHandler(this,K.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,K.WARN,...e),this._logHandler(this,K.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,K.ERROR,...e),this._logHandler(this,K.ERROR,...e)}}/**
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
 */class km{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(Dm(t)){const s=t.getImmediate();return`${s.library}/${s.version}`}else return null}).filter(t=>t).join(" ")}}function Dm(n){const e=n.getComponent();return(e==null?void 0:e.type)==="VERSION"}const Ho="@firebase/app",nu="0.14.1";/**
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
 */const Rt=new xa("@firebase/app"),Vm="@firebase/app-compat",Om="@firebase/analytics-compat",xm="@firebase/analytics",Mm="@firebase/app-check-compat",Lm="@firebase/app-check",Fm="@firebase/auth",Um="@firebase/auth-compat",Bm="@firebase/database",qm="@firebase/data-connect",jm="@firebase/database-compat",$m="@firebase/functions",Wm="@firebase/functions-compat",zm="@firebase/installations",Hm="@firebase/installations-compat",Gm="@firebase/messaging",Km="@firebase/messaging-compat",Qm="@firebase/performance",Ym="@firebase/performance-compat",Xm="@firebase/remote-config",Jm="@firebase/remote-config-compat",Zm="@firebase/storage",eg="@firebase/storage-compat",tg="@firebase/firestore",ng="@firebase/ai",sg="@firebase/firestore-compat",rg="firebase",ig="12.1.0";/**
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
 */const Go="[DEFAULT]",og={[Ho]:"fire-core",[Vm]:"fire-core-compat",[xm]:"fire-analytics",[Om]:"fire-analytics-compat",[Lm]:"fire-app-check",[Mm]:"fire-app-check-compat",[Fm]:"fire-auth",[Um]:"fire-auth-compat",[Bm]:"fire-rtdb",[qm]:"fire-data-connect",[jm]:"fire-rtdb-compat",[$m]:"fire-fn",[Wm]:"fire-fn-compat",[zm]:"fire-iid",[Hm]:"fire-iid-compat",[Gm]:"fire-fcm",[Km]:"fire-fcm-compat",[Qm]:"fire-perf",[Ym]:"fire-perf-compat",[Xm]:"fire-rc",[Jm]:"fire-rc-compat",[Zm]:"fire-gcs",[eg]:"fire-gcs-compat",[tg]:"fire-fst",[sg]:"fire-fst-compat",[ng]:"fire-vertex","fire-js":"fire-js",[rg]:"fire-js-all"};/**
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
 */const Zr=new Map,ag=new Map,Ko=new Map;function su(n,e){try{n.container.addComponent(e)}catch(t){Rt.debug(`Component ${e.name} failed to register with FirebaseApp ${n.name}`,t)}}function pn(n){const e=n.name;if(Ko.has(e))return Rt.debug(`There were multiple attempts to register component ${e}.`),!1;Ko.set(e,n);for(const t of Zr.values())su(t,n);for(const t of ag.values())su(t,n);return!0}function Ai(n,e){const t=n.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),n.container.getProvider(e)}function Ri(n){return n==null?!1:n.settings!==void 0}/**
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
 */const lg={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},Lt=new sd("app","Firebase",lg);/**
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
 */class cg{constructor(e,t,s){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=s,this.container.addComponent(new jt("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw Lt.create("app-deleted",{appName:this._name})}}/**
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
 */const Ma=ig;function id(n,e={}){let t=n;typeof e!="object"&&(e={name:e});const s={name:Go,automaticDataCollectionEnabled:!0,...e},r=s.name;if(typeof r!="string"||!r)throw Lt.create("bad-app-name",{appName:String(r)});if(t||(t=ed()),!t)throw Lt.create("no-options");const i=Zr.get(r);if(i){if(zs(t,i.options)&&zs(s,i.config))return i;throw Lt.create("duplicate-app",{appName:r})}const a=new Cm(r);for(const u of Ko.values())a.addComponent(u);const l=new cg(t,s,a);return Zr.set(r,l),l}function Ci(n=Go){const e=Zr.get(n);if(!e&&n===Go&&ed())return id();if(!e)throw Lt.create("no-app",{appName:n});return e}function nt(n,e,t){let s=og[n]??n;t&&(s+=`-${t}`);const r=s.match(/\s|\//),i=e.match(/\s|\//);if(r||i){const a=[`Unable to register library "${s}" with version "${e}":`];r&&a.push(`library name "${s}" contains illegal characters (whitespace or "/")`),r&&i&&a.push("and"),i&&a.push(`version name "${e}" contains illegal characters (whitespace or "/")`),Rt.warn(a.join(" "));return}pn(new jt(`${s}-version`,()=>({library:s,version:e}),"VERSION"))}/**
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
 */const ug="firebase-heartbeat-database",hg=1,Hs="firebase-heartbeat-store";let bo=null;function od(){return bo||(bo=Y_(ug,hg,{upgrade:(n,e)=>{switch(e){case 0:try{n.createObjectStore(Hs)}catch(t){console.warn(t)}}}}).catch(n=>{throw Lt.create("idb-open",{originalErrorMessage:n.message})})),bo}async function dg(n){try{const t=(await od()).transaction(Hs),s=await t.objectStore(Hs).get(ad(n));return await t.done,s}catch(e){if(e instanceof Xt)Rt.warn(e.message);else{const t=Lt.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});Rt.warn(t.message)}}}async function ru(n,e){try{const s=(await od()).transaction(Hs,"readwrite");await s.objectStore(Hs).put(e,ad(n)),await s.done}catch(t){if(t instanceof Xt)Rt.warn(t.message);else{const s=Lt.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});Rt.warn(s.message)}}}function ad(n){return`${n.name}!${n.options.appId}`}/**
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
 */const fg=1024,pg=30;class _g{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new gg(t),this._heartbeatsCachePromise=this._storage.read().then(s=>(this._heartbeatsCache=s,s))}async triggerHeartbeat(){var e,t;try{const r=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),i=iu();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===i||this._heartbeatsCache.heartbeats.some(a=>a.date===i))return;if(this._heartbeatsCache.heartbeats.push({date:i,agent:r}),this._heartbeatsCache.heartbeats.length>pg){const a=yg(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(a,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(s){Rt.warn(s)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=iu(),{heartbeatsToSend:s,unsentEntries:r}=mg(this._heartbeatsCache.heartbeats),i=Xr(JSON.stringify({version:2,heartbeats:s}));return this._heartbeatsCache.lastSentHeartbeatDate=t,r.length>0?(this._heartbeatsCache.heartbeats=r,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),i}catch(t){return Rt.warn(t),""}}}function iu(){return new Date().toISOString().substring(0,10)}function mg(n,e=fg){const t=[];let s=n.slice();for(const r of n){const i=t.find(a=>a.agent===r.agent);if(i){if(i.dates.push(r.date),ou(t)>e){i.dates.pop();break}}else if(t.push({agent:r.agent,dates:[r.date]}),ou(t)>e){t.pop();break}s=s.slice(1)}return{heartbeatsToSend:t,unsentEntries:s}}class gg{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return fm()?pm().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await dg(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const s=await this.read();return ru(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??s.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const s=await this.read();return ru(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??s.lastSentHeartbeatDate,heartbeats:[...s.heartbeats,...e.heartbeats]})}else return}}function ou(n){return Xr(JSON.stringify({version:2,heartbeats:n})).length}function yg(n){if(n.length===0)return-1;let e=0,t=n[0].date;for(let s=1;s<n.length;s++)n[s].date<t&&(t=n[s].date,e=s);return e}/**
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
 */function Eg(n){pn(new jt("platform-logger",e=>new km(e),"PRIVATE")),pn(new jt("heartbeat",e=>new _g(e),"PRIVATE")),nt(Ho,nu,n),nt(Ho,nu,"esm2020"),nt("fire-js","")}Eg("");var Tg="firebase",vg="12.1.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */nt(Tg,vg,"app");var au=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Ft,ld;(function(){var n;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(w,g){function E(){}E.prototype=g.prototype,w.D=g.prototype,w.prototype=new E,w.prototype.constructor=w,w.C=function(T,v,R){for(var y=Array(arguments.length-2),yt=2;yt<arguments.length;yt++)y[yt-2]=arguments[yt];return g.prototype[v].apply(T,y)}}function t(){this.blockSize=-1}function s(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.B=Array(this.blockSize),this.o=this.h=0,this.s()}e(s,t),s.prototype.s=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function r(w,g,E){E||(E=0);var T=Array(16);if(typeof g=="string")for(var v=0;16>v;++v)T[v]=g.charCodeAt(E++)|g.charCodeAt(E++)<<8|g.charCodeAt(E++)<<16|g.charCodeAt(E++)<<24;else for(v=0;16>v;++v)T[v]=g[E++]|g[E++]<<8|g[E++]<<16|g[E++]<<24;g=w.g[0],E=w.g[1],v=w.g[2];var R=w.g[3],y=g+(R^E&(v^R))+T[0]+3614090360&4294967295;g=E+(y<<7&4294967295|y>>>25),y=R+(v^g&(E^v))+T[1]+3905402710&4294967295,R=g+(y<<12&4294967295|y>>>20),y=v+(E^R&(g^E))+T[2]+606105819&4294967295,v=R+(y<<17&4294967295|y>>>15),y=E+(g^v&(R^g))+T[3]+3250441966&4294967295,E=v+(y<<22&4294967295|y>>>10),y=g+(R^E&(v^R))+T[4]+4118548399&4294967295,g=E+(y<<7&4294967295|y>>>25),y=R+(v^g&(E^v))+T[5]+1200080426&4294967295,R=g+(y<<12&4294967295|y>>>20),y=v+(E^R&(g^E))+T[6]+2821735955&4294967295,v=R+(y<<17&4294967295|y>>>15),y=E+(g^v&(R^g))+T[7]+4249261313&4294967295,E=v+(y<<22&4294967295|y>>>10),y=g+(R^E&(v^R))+T[8]+1770035416&4294967295,g=E+(y<<7&4294967295|y>>>25),y=R+(v^g&(E^v))+T[9]+2336552879&4294967295,R=g+(y<<12&4294967295|y>>>20),y=v+(E^R&(g^E))+T[10]+4294925233&4294967295,v=R+(y<<17&4294967295|y>>>15),y=E+(g^v&(R^g))+T[11]+2304563134&4294967295,E=v+(y<<22&4294967295|y>>>10),y=g+(R^E&(v^R))+T[12]+1804603682&4294967295,g=E+(y<<7&4294967295|y>>>25),y=R+(v^g&(E^v))+T[13]+4254626195&4294967295,R=g+(y<<12&4294967295|y>>>20),y=v+(E^R&(g^E))+T[14]+2792965006&4294967295,v=R+(y<<17&4294967295|y>>>15),y=E+(g^v&(R^g))+T[15]+1236535329&4294967295,E=v+(y<<22&4294967295|y>>>10),y=g+(v^R&(E^v))+T[1]+4129170786&4294967295,g=E+(y<<5&4294967295|y>>>27),y=R+(E^v&(g^E))+T[6]+3225465664&4294967295,R=g+(y<<9&4294967295|y>>>23),y=v+(g^E&(R^g))+T[11]+643717713&4294967295,v=R+(y<<14&4294967295|y>>>18),y=E+(R^g&(v^R))+T[0]+3921069994&4294967295,E=v+(y<<20&4294967295|y>>>12),y=g+(v^R&(E^v))+T[5]+3593408605&4294967295,g=E+(y<<5&4294967295|y>>>27),y=R+(E^v&(g^E))+T[10]+38016083&4294967295,R=g+(y<<9&4294967295|y>>>23),y=v+(g^E&(R^g))+T[15]+3634488961&4294967295,v=R+(y<<14&4294967295|y>>>18),y=E+(R^g&(v^R))+T[4]+3889429448&4294967295,E=v+(y<<20&4294967295|y>>>12),y=g+(v^R&(E^v))+T[9]+568446438&4294967295,g=E+(y<<5&4294967295|y>>>27),y=R+(E^v&(g^E))+T[14]+3275163606&4294967295,R=g+(y<<9&4294967295|y>>>23),y=v+(g^E&(R^g))+T[3]+4107603335&4294967295,v=R+(y<<14&4294967295|y>>>18),y=E+(R^g&(v^R))+T[8]+1163531501&4294967295,E=v+(y<<20&4294967295|y>>>12),y=g+(v^R&(E^v))+T[13]+2850285829&4294967295,g=E+(y<<5&4294967295|y>>>27),y=R+(E^v&(g^E))+T[2]+4243563512&4294967295,R=g+(y<<9&4294967295|y>>>23),y=v+(g^E&(R^g))+T[7]+1735328473&4294967295,v=R+(y<<14&4294967295|y>>>18),y=E+(R^g&(v^R))+T[12]+2368359562&4294967295,E=v+(y<<20&4294967295|y>>>12),y=g+(E^v^R)+T[5]+4294588738&4294967295,g=E+(y<<4&4294967295|y>>>28),y=R+(g^E^v)+T[8]+2272392833&4294967295,R=g+(y<<11&4294967295|y>>>21),y=v+(R^g^E)+T[11]+1839030562&4294967295,v=R+(y<<16&4294967295|y>>>16),y=E+(v^R^g)+T[14]+4259657740&4294967295,E=v+(y<<23&4294967295|y>>>9),y=g+(E^v^R)+T[1]+2763975236&4294967295,g=E+(y<<4&4294967295|y>>>28),y=R+(g^E^v)+T[4]+1272893353&4294967295,R=g+(y<<11&4294967295|y>>>21),y=v+(R^g^E)+T[7]+4139469664&4294967295,v=R+(y<<16&4294967295|y>>>16),y=E+(v^R^g)+T[10]+3200236656&4294967295,E=v+(y<<23&4294967295|y>>>9),y=g+(E^v^R)+T[13]+681279174&4294967295,g=E+(y<<4&4294967295|y>>>28),y=R+(g^E^v)+T[0]+3936430074&4294967295,R=g+(y<<11&4294967295|y>>>21),y=v+(R^g^E)+T[3]+3572445317&4294967295,v=R+(y<<16&4294967295|y>>>16),y=E+(v^R^g)+T[6]+76029189&4294967295,E=v+(y<<23&4294967295|y>>>9),y=g+(E^v^R)+T[9]+3654602809&4294967295,g=E+(y<<4&4294967295|y>>>28),y=R+(g^E^v)+T[12]+3873151461&4294967295,R=g+(y<<11&4294967295|y>>>21),y=v+(R^g^E)+T[15]+530742520&4294967295,v=R+(y<<16&4294967295|y>>>16),y=E+(v^R^g)+T[2]+3299628645&4294967295,E=v+(y<<23&4294967295|y>>>9),y=g+(v^(E|~R))+T[0]+4096336452&4294967295,g=E+(y<<6&4294967295|y>>>26),y=R+(E^(g|~v))+T[7]+1126891415&4294967295,R=g+(y<<10&4294967295|y>>>22),y=v+(g^(R|~E))+T[14]+2878612391&4294967295,v=R+(y<<15&4294967295|y>>>17),y=E+(R^(v|~g))+T[5]+4237533241&4294967295,E=v+(y<<21&4294967295|y>>>11),y=g+(v^(E|~R))+T[12]+1700485571&4294967295,g=E+(y<<6&4294967295|y>>>26),y=R+(E^(g|~v))+T[3]+2399980690&4294967295,R=g+(y<<10&4294967295|y>>>22),y=v+(g^(R|~E))+T[10]+4293915773&4294967295,v=R+(y<<15&4294967295|y>>>17),y=E+(R^(v|~g))+T[1]+2240044497&4294967295,E=v+(y<<21&4294967295|y>>>11),y=g+(v^(E|~R))+T[8]+1873313359&4294967295,g=E+(y<<6&4294967295|y>>>26),y=R+(E^(g|~v))+T[15]+4264355552&4294967295,R=g+(y<<10&4294967295|y>>>22),y=v+(g^(R|~E))+T[6]+2734768916&4294967295,v=R+(y<<15&4294967295|y>>>17),y=E+(R^(v|~g))+T[13]+1309151649&4294967295,E=v+(y<<21&4294967295|y>>>11),y=g+(v^(E|~R))+T[4]+4149444226&4294967295,g=E+(y<<6&4294967295|y>>>26),y=R+(E^(g|~v))+T[11]+3174756917&4294967295,R=g+(y<<10&4294967295|y>>>22),y=v+(g^(R|~E))+T[2]+718787259&4294967295,v=R+(y<<15&4294967295|y>>>17),y=E+(R^(v|~g))+T[9]+3951481745&4294967295,w.g[0]=w.g[0]+g&4294967295,w.g[1]=w.g[1]+(v+(y<<21&4294967295|y>>>11))&4294967295,w.g[2]=w.g[2]+v&4294967295,w.g[3]=w.g[3]+R&4294967295}s.prototype.u=function(w,g){g===void 0&&(g=w.length);for(var E=g-this.blockSize,T=this.B,v=this.h,R=0;R<g;){if(v==0)for(;R<=E;)r(this,w,R),R+=this.blockSize;if(typeof w=="string"){for(;R<g;)if(T[v++]=w.charCodeAt(R++),v==this.blockSize){r(this,T),v=0;break}}else for(;R<g;)if(T[v++]=w[R++],v==this.blockSize){r(this,T),v=0;break}}this.h=v,this.o+=g},s.prototype.v=function(){var w=Array((56>this.h?this.blockSize:2*this.blockSize)-this.h);w[0]=128;for(var g=1;g<w.length-8;++g)w[g]=0;var E=8*this.o;for(g=w.length-8;g<w.length;++g)w[g]=E&255,E/=256;for(this.u(w),w=Array(16),g=E=0;4>g;++g)for(var T=0;32>T;T+=8)w[E++]=this.g[g]>>>T&255;return w};function i(w,g){var E=l;return Object.prototype.hasOwnProperty.call(E,w)?E[w]:E[w]=g(w)}function a(w,g){this.h=g;for(var E=[],T=!0,v=w.length-1;0<=v;v--){var R=w[v]|0;T&&R==g||(E[v]=R,T=!1)}this.g=E}var l={};function u(w){return-128<=w&&128>w?i(w,function(g){return new a([g|0],0>g?-1:0)}):new a([w|0],0>w?-1:0)}function h(w){if(isNaN(w)||!isFinite(w))return p;if(0>w)return N(h(-w));for(var g=[],E=1,T=0;w>=E;T++)g[T]=w/E|0,E*=4294967296;return new a(g,0)}function f(w,g){if(w.length==0)throw Error("number format error: empty string");if(g=g||10,2>g||36<g)throw Error("radix out of range: "+g);if(w.charAt(0)=="-")return N(f(w.substring(1),g));if(0<=w.indexOf("-"))throw Error('number format error: interior "-" character');for(var E=h(Math.pow(g,8)),T=p,v=0;v<w.length;v+=8){var R=Math.min(8,w.length-v),y=parseInt(w.substring(v,v+R),g);8>R?(R=h(Math.pow(g,R)),T=T.j(R).add(h(y))):(T=T.j(E),T=T.add(h(y)))}return T}var p=u(0),m=u(1),I=u(16777216);n=a.prototype,n.m=function(){if(k(this))return-N(this).m();for(var w=0,g=1,E=0;E<this.g.length;E++){var T=this.i(E);w+=(0<=T?T:4294967296+T)*g,g*=4294967296}return w},n.toString=function(w){if(w=w||10,2>w||36<w)throw Error("radix out of range: "+w);if(C(this))return"0";if(k(this))return"-"+N(this).toString(w);for(var g=h(Math.pow(w,6)),E=this,T="";;){var v=$(E,g).g;E=B(E,v.j(g));var R=((0<E.g.length?E.g[0]:E.h)>>>0).toString(w);if(E=v,C(E))return R+T;for(;6>R.length;)R="0"+R;T=R+T}},n.i=function(w){return 0>w?0:w<this.g.length?this.g[w]:this.h};function C(w){if(w.h!=0)return!1;for(var g=0;g<w.g.length;g++)if(w.g[g]!=0)return!1;return!0}function k(w){return w.h==-1}n.l=function(w){return w=B(this,w),k(w)?-1:C(w)?0:1};function N(w){for(var g=w.g.length,E=[],T=0;T<g;T++)E[T]=~w.g[T];return new a(E,~w.h).add(m)}n.abs=function(){return k(this)?N(this):this},n.add=function(w){for(var g=Math.max(this.g.length,w.g.length),E=[],T=0,v=0;v<=g;v++){var R=T+(this.i(v)&65535)+(w.i(v)&65535),y=(R>>>16)+(this.i(v)>>>16)+(w.i(v)>>>16);T=y>>>16,R&=65535,y&=65535,E[v]=y<<16|R}return new a(E,E[E.length-1]&-2147483648?-1:0)};function B(w,g){return w.add(N(g))}n.j=function(w){if(C(this)||C(w))return p;if(k(this))return k(w)?N(this).j(N(w)):N(N(this).j(w));if(k(w))return N(this.j(N(w)));if(0>this.l(I)&&0>w.l(I))return h(this.m()*w.m());for(var g=this.g.length+w.g.length,E=[],T=0;T<2*g;T++)E[T]=0;for(T=0;T<this.g.length;T++)for(var v=0;v<w.g.length;v++){var R=this.i(T)>>>16,y=this.i(T)&65535,yt=w.i(v)>>>16,ls=w.i(v)&65535;E[2*T+2*v]+=y*ls,L(E,2*T+2*v),E[2*T+2*v+1]+=R*ls,L(E,2*T+2*v+1),E[2*T+2*v+1]+=y*yt,L(E,2*T+2*v+1),E[2*T+2*v+2]+=R*yt,L(E,2*T+2*v+2)}for(T=0;T<g;T++)E[T]=E[2*T+1]<<16|E[2*T];for(T=g;T<2*g;T++)E[T]=0;return new a(E,0)};function L(w,g){for(;(w[g]&65535)!=w[g];)w[g+1]+=w[g]>>>16,w[g]&=65535,g++}function U(w,g){this.g=w,this.h=g}function $(w,g){if(C(g))throw Error("division by zero");if(C(w))return new U(p,p);if(k(w))return g=$(N(w),g),new U(N(g.g),N(g.h));if(k(g))return g=$(w,N(g)),new U(N(g.g),g.h);if(30<w.g.length){if(k(w)||k(g))throw Error("slowDivide_ only works with positive integers.");for(var E=m,T=g;0>=T.l(w);)E=$e(E),T=$e(T);var v=fe(E,1),R=fe(T,1);for(T=fe(T,2),E=fe(E,2);!C(T);){var y=R.add(T);0>=y.l(w)&&(v=v.add(E),R=y),T=fe(T,1),E=fe(E,1)}return g=B(w,v.j(g)),new U(v,g)}for(v=p;0<=w.l(g);){for(E=Math.max(1,Math.floor(w.m()/g.m())),T=Math.ceil(Math.log(E)/Math.LN2),T=48>=T?1:Math.pow(2,T-48),R=h(E),y=R.j(g);k(y)||0<y.l(w);)E-=T,R=h(E),y=R.j(g);C(R)&&(R=m),v=v.add(R),w=B(w,y)}return new U(v,w)}n.A=function(w){return $(this,w).h},n.and=function(w){for(var g=Math.max(this.g.length,w.g.length),E=[],T=0;T<g;T++)E[T]=this.i(T)&w.i(T);return new a(E,this.h&w.h)},n.or=function(w){for(var g=Math.max(this.g.length,w.g.length),E=[],T=0;T<g;T++)E[T]=this.i(T)|w.i(T);return new a(E,this.h|w.h)},n.xor=function(w){for(var g=Math.max(this.g.length,w.g.length),E=[],T=0;T<g;T++)E[T]=this.i(T)^w.i(T);return new a(E,this.h^w.h)};function $e(w){for(var g=w.g.length+1,E=[],T=0;T<g;T++)E[T]=w.i(T)<<1|w.i(T-1)>>>31;return new a(E,w.h)}function fe(w,g){var E=g>>5;g%=32;for(var T=w.g.length-E,v=[],R=0;R<T;R++)v[R]=0<g?w.i(R+E)>>>g|w.i(R+E+1)<<32-g:w.i(R+E);return new a(v,w.h)}s.prototype.digest=s.prototype.v,s.prototype.reset=s.prototype.s,s.prototype.update=s.prototype.u,ld=s,a.prototype.add=a.prototype.add,a.prototype.multiply=a.prototype.j,a.prototype.modulo=a.prototype.A,a.prototype.compare=a.prototype.l,a.prototype.toNumber=a.prototype.m,a.prototype.toString=a.prototype.toString,a.prototype.getBits=a.prototype.i,a.fromNumber=h,a.fromString=f,Ft=a}).apply(typeof au<"u"?au:typeof self<"u"?self:typeof window<"u"?window:{});var xr=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var cd,Ns,ud,Wr,Qo,hd,dd,fd;(function(){var n,e=typeof Object.defineProperties=="function"?Object.defineProperty:function(o,c,d){return o==Array.prototype||o==Object.prototype||(o[c]=d.value),o};function t(o){o=[typeof globalThis=="object"&&globalThis,o,typeof window=="object"&&window,typeof self=="object"&&self,typeof xr=="object"&&xr];for(var c=0;c<o.length;++c){var d=o[c];if(d&&d.Math==Math)return d}throw Error("Cannot find global object")}var s=t(this);function r(o,c){if(c)e:{var d=s;o=o.split(".");for(var _=0;_<o.length-1;_++){var A=o[_];if(!(A in d))break e;d=d[A]}o=o[o.length-1],_=d[o],c=c(_),c!=_&&c!=null&&e(d,o,{configurable:!0,writable:!0,value:c})}}function i(o,c){o instanceof String&&(o+="");var d=0,_=!1,A={next:function(){if(!_&&d<o.length){var S=d++;return{value:c(S,o[S]),done:!1}}return _=!0,{done:!0,value:void 0}}};return A[Symbol.iterator]=function(){return A},A}r("Array.prototype.values",function(o){return o||function(){return i(this,function(c,d){return d})}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var a=a||{},l=this||self;function u(o){var c=typeof o;return c=c!="object"?c:o?Array.isArray(o)?"array":c:"null",c=="array"||c=="object"&&typeof o.length=="number"}function h(o){var c=typeof o;return c=="object"&&o!=null||c=="function"}function f(o,c,d){return o.call.apply(o.bind,arguments)}function p(o,c,d){if(!o)throw Error();if(2<arguments.length){var _=Array.prototype.slice.call(arguments,2);return function(){var A=Array.prototype.slice.call(arguments);return Array.prototype.unshift.apply(A,_),o.apply(c,A)}}return function(){return o.apply(c,arguments)}}function m(o,c,d){return m=Function.prototype.bind&&Function.prototype.bind.toString().indexOf("native code")!=-1?f:p,m.apply(null,arguments)}function I(o,c){var d=Array.prototype.slice.call(arguments,1);return function(){var _=d.slice();return _.push.apply(_,arguments),o.apply(this,_)}}function C(o,c){function d(){}d.prototype=c.prototype,o.aa=c.prototype,o.prototype=new d,o.prototype.constructor=o,o.Qb=function(_,A,S){for(var D=Array(arguments.length-2),te=2;te<arguments.length;te++)D[te-2]=arguments[te];return c.prototype[A].apply(_,D)}}function k(o){const c=o.length;if(0<c){const d=Array(c);for(let _=0;_<c;_++)d[_]=o[_];return d}return[]}function N(o,c){for(let d=1;d<arguments.length;d++){const _=arguments[d];if(u(_)){const A=o.length||0,S=_.length||0;o.length=A+S;for(let D=0;D<S;D++)o[A+D]=_[D]}else o.push(_)}}class B{constructor(c,d){this.i=c,this.j=d,this.h=0,this.g=null}get(){let c;return 0<this.h?(this.h--,c=this.g,this.g=c.next,c.next=null):c=this.i(),c}}function L(o){return/^[\s\xa0]*$/.test(o)}function U(){var o=l.navigator;return o&&(o=o.userAgent)?o:""}function $(o){return $[" "](o),o}$[" "]=function(){};var $e=U().indexOf("Gecko")!=-1&&!(U().toLowerCase().indexOf("webkit")!=-1&&U().indexOf("Edge")==-1)&&!(U().indexOf("Trident")!=-1||U().indexOf("MSIE")!=-1)&&U().indexOf("Edge")==-1;function fe(o,c,d){for(const _ in o)c.call(d,o[_],_,o)}function w(o,c){for(const d in o)c.call(void 0,o[d],d,o)}function g(o){const c={};for(const d in o)c[d]=o[d];return c}const E="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function T(o,c){let d,_;for(let A=1;A<arguments.length;A++){_=arguments[A];for(d in _)o[d]=_[d];for(let S=0;S<E.length;S++)d=E[S],Object.prototype.hasOwnProperty.call(_,d)&&(o[d]=_[d])}}function v(o){var c=1;o=o.split(":");const d=[];for(;0<c&&o.length;)d.push(o.shift()),c--;return o.length&&d.push(o.join(":")),d}function R(o){l.setTimeout(()=>{throw o},0)}function y(){var o=so;let c=null;return o.g&&(c=o.g,o.g=o.g.next,o.g||(o.h=null),c.next=null),c}class yt{constructor(){this.h=this.g=null}add(c,d){const _=ls.get();_.set(c,d),this.h?this.h.next=_:this.g=_,this.h=_}}var ls=new B(()=>new __,o=>o.reset());class __{constructor(){this.next=this.g=this.h=null}set(c,d){this.h=c,this.g=d,this.next=null}reset(){this.next=this.g=this.h=null}}let cs,us=!1,so=new yt,Zl=()=>{const o=l.Promise.resolve(void 0);cs=()=>{o.then(m_)}};var m_=()=>{for(var o;o=y();){try{o.h.call(o.g)}catch(d){R(d)}var c=ls;c.j(o),100>c.h&&(c.h++,o.next=c.g,c.g=o)}us=!1};function Nt(){this.s=this.s,this.C=this.C}Nt.prototype.s=!1,Nt.prototype.ma=function(){this.s||(this.s=!0,this.N())},Nt.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function ke(o,c){this.type=o,this.g=this.target=c,this.defaultPrevented=!1}ke.prototype.h=function(){this.defaultPrevented=!0};var g_=function(){if(!l.addEventListener||!Object.defineProperty)return!1;var o=!1,c=Object.defineProperty({},"passive",{get:function(){o=!0}});try{const d=()=>{};l.addEventListener("test",d,c),l.removeEventListener("test",d,c)}catch{}return o}();function hs(o,c){if(ke.call(this,o?o.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,o){var d=this.type=o.type,_=o.changedTouches&&o.changedTouches.length?o.changedTouches[0]:null;if(this.target=o.target||o.srcElement,this.g=c,c=o.relatedTarget){if($e){e:{try{$(c.nodeName);var A=!0;break e}catch{}A=!1}A||(c=null)}}else d=="mouseover"?c=o.fromElement:d=="mouseout"&&(c=o.toElement);this.relatedTarget=c,_?(this.clientX=_.clientX!==void 0?_.clientX:_.pageX,this.clientY=_.clientY!==void 0?_.clientY:_.pageY,this.screenX=_.screenX||0,this.screenY=_.screenY||0):(this.clientX=o.clientX!==void 0?o.clientX:o.pageX,this.clientY=o.clientY!==void 0?o.clientY:o.pageY,this.screenX=o.screenX||0,this.screenY=o.screenY||0),this.button=o.button,this.key=o.key||"",this.ctrlKey=o.ctrlKey,this.altKey=o.altKey,this.shiftKey=o.shiftKey,this.metaKey=o.metaKey,this.pointerId=o.pointerId||0,this.pointerType=typeof o.pointerType=="string"?o.pointerType:y_[o.pointerType]||"",this.state=o.state,this.i=o,o.defaultPrevented&&hs.aa.h.call(this)}}C(hs,ke);var y_={2:"touch",3:"pen",4:"mouse"};hs.prototype.h=function(){hs.aa.h.call(this);var o=this.i;o.preventDefault?o.preventDefault():o.returnValue=!1};var mr="closure_listenable_"+(1e6*Math.random()|0),E_=0;function T_(o,c,d,_,A){this.listener=o,this.proxy=null,this.src=c,this.type=d,this.capture=!!_,this.ha=A,this.key=++E_,this.da=this.fa=!1}function gr(o){o.da=!0,o.listener=null,o.proxy=null,o.src=null,o.ha=null}function yr(o){this.src=o,this.g={},this.h=0}yr.prototype.add=function(o,c,d,_,A){var S=o.toString();o=this.g[S],o||(o=this.g[S]=[],this.h++);var D=io(o,c,_,A);return-1<D?(c=o[D],d||(c.fa=!1)):(c=new T_(c,this.src,S,!!_,A),c.fa=d,o.push(c)),c};function ro(o,c){var d=c.type;if(d in o.g){var _=o.g[d],A=Array.prototype.indexOf.call(_,c,void 0),S;(S=0<=A)&&Array.prototype.splice.call(_,A,1),S&&(gr(c),o.g[d].length==0&&(delete o.g[d],o.h--))}}function io(o,c,d,_){for(var A=0;A<o.length;++A){var S=o[A];if(!S.da&&S.listener==c&&S.capture==!!d&&S.ha==_)return A}return-1}var oo="closure_lm_"+(1e6*Math.random()|0),ao={};function ec(o,c,d,_,A){if(Array.isArray(c)){for(var S=0;S<c.length;S++)ec(o,c[S],d,_,A);return null}return d=sc(d),o&&o[mr]?o.K(c,d,h(_)?!!_.capture:!1,A):v_(o,c,d,!1,_,A)}function v_(o,c,d,_,A,S){if(!c)throw Error("Invalid event type");var D=h(A)?!!A.capture:!!A,te=co(o);if(te||(o[oo]=te=new yr(o)),d=te.add(c,d,_,D,S),d.proxy)return d;if(_=w_(),d.proxy=_,_.src=o,_.listener=d,o.addEventListener)g_||(A=D),A===void 0&&(A=!1),o.addEventListener(c.toString(),_,A);else if(o.attachEvent)o.attachEvent(nc(c.toString()),_);else if(o.addListener&&o.removeListener)o.addListener(_);else throw Error("addEventListener and attachEvent are unavailable.");return d}function w_(){function o(d){return c.call(o.src,o.listener,d)}const c=I_;return o}function tc(o,c,d,_,A){if(Array.isArray(c))for(var S=0;S<c.length;S++)tc(o,c[S],d,_,A);else _=h(_)?!!_.capture:!!_,d=sc(d),o&&o[mr]?(o=o.i,c=String(c).toString(),c in o.g&&(S=o.g[c],d=io(S,d,_,A),-1<d&&(gr(S[d]),Array.prototype.splice.call(S,d,1),S.length==0&&(delete o.g[c],o.h--)))):o&&(o=co(o))&&(c=o.g[c.toString()],o=-1,c&&(o=io(c,d,_,A)),(d=-1<o?c[o]:null)&&lo(d))}function lo(o){if(typeof o!="number"&&o&&!o.da){var c=o.src;if(c&&c[mr])ro(c.i,o);else{var d=o.type,_=o.proxy;c.removeEventListener?c.removeEventListener(d,_,o.capture):c.detachEvent?c.detachEvent(nc(d),_):c.addListener&&c.removeListener&&c.removeListener(_),(d=co(c))?(ro(d,o),d.h==0&&(d.src=null,c[oo]=null)):gr(o)}}}function nc(o){return o in ao?ao[o]:ao[o]="on"+o}function I_(o,c){if(o.da)o=!0;else{c=new hs(c,this);var d=o.listener,_=o.ha||o.src;o.fa&&lo(o),o=d.call(_,c)}return o}function co(o){return o=o[oo],o instanceof yr?o:null}var uo="__closure_events_fn_"+(1e9*Math.random()>>>0);function sc(o){return typeof o=="function"?o:(o[uo]||(o[uo]=function(c){return o.handleEvent(c)}),o[uo])}function De(){Nt.call(this),this.i=new yr(this),this.M=this,this.F=null}C(De,Nt),De.prototype[mr]=!0,De.prototype.removeEventListener=function(o,c,d,_){tc(this,o,c,d,_)};function Ue(o,c){var d,_=o.F;if(_)for(d=[];_;_=_.F)d.push(_);if(o=o.M,_=c.type||c,typeof c=="string")c=new ke(c,o);else if(c instanceof ke)c.target=c.target||o;else{var A=c;c=new ke(_,o),T(c,A)}if(A=!0,d)for(var S=d.length-1;0<=S;S--){var D=c.g=d[S];A=Er(D,_,!0,c)&&A}if(D=c.g=o,A=Er(D,_,!0,c)&&A,A=Er(D,_,!1,c)&&A,d)for(S=0;S<d.length;S++)D=c.g=d[S],A=Er(D,_,!1,c)&&A}De.prototype.N=function(){if(De.aa.N.call(this),this.i){var o=this.i,c;for(c in o.g){for(var d=o.g[c],_=0;_<d.length;_++)gr(d[_]);delete o.g[c],o.h--}}this.F=null},De.prototype.K=function(o,c,d,_){return this.i.add(String(o),c,!1,d,_)},De.prototype.L=function(o,c,d,_){return this.i.add(String(o),c,!0,d,_)};function Er(o,c,d,_){if(c=o.i.g[String(c)],!c)return!0;c=c.concat();for(var A=!0,S=0;S<c.length;++S){var D=c[S];if(D&&!D.da&&D.capture==d){var te=D.listener,Re=D.ha||D.src;D.fa&&ro(o.i,D),A=te.call(Re,_)!==!1&&A}}return A&&!_.defaultPrevented}function rc(o,c,d){if(typeof o=="function")d&&(o=m(o,d));else if(o&&typeof o.handleEvent=="function")o=m(o.handleEvent,o);else throw Error("Invalid listener argument");return 2147483647<Number(c)?-1:l.setTimeout(o,c||0)}function ic(o){o.g=rc(()=>{o.g=null,o.i&&(o.i=!1,ic(o))},o.l);const c=o.h;o.h=null,o.m.apply(null,c)}class A_ extends Nt{constructor(c,d){super(),this.m=c,this.l=d,this.h=null,this.i=!1,this.g=null}j(c){this.h=arguments,this.g?this.i=!0:ic(this)}N(){super.N(),this.g&&(l.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function ds(o){Nt.call(this),this.h=o,this.g={}}C(ds,Nt);var oc=[];function ac(o){fe(o.g,function(c,d){this.g.hasOwnProperty(d)&&lo(c)},o),o.g={}}ds.prototype.N=function(){ds.aa.N.call(this),ac(this)},ds.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var ho=l.JSON.stringify,R_=l.JSON.parse,C_=class{stringify(o){return l.JSON.stringify(o,void 0)}parse(o){return l.JSON.parse(o,void 0)}};function fo(){}fo.prototype.h=null;function lc(o){return o.h||(o.h=o.i())}function cc(){}var fs={OPEN:"a",kb:"b",Ja:"c",wb:"d"};function po(){ke.call(this,"d")}C(po,ke);function _o(){ke.call(this,"c")}C(_o,ke);var tn={},uc=null;function Tr(){return uc=uc||new De}tn.La="serverreachability";function hc(o){ke.call(this,tn.La,o)}C(hc,ke);function ps(o){const c=Tr();Ue(c,new hc(c))}tn.STAT_EVENT="statevent";function dc(o,c){ke.call(this,tn.STAT_EVENT,o),this.stat=c}C(dc,ke);function Be(o){const c=Tr();Ue(c,new dc(c,o))}tn.Ma="timingevent";function fc(o,c){ke.call(this,tn.Ma,o),this.size=c}C(fc,ke);function _s(o,c){if(typeof o!="function")throw Error("Fn must not be null and must be a function");return l.setTimeout(function(){o()},c)}function ms(){this.g=!0}ms.prototype.xa=function(){this.g=!1};function S_(o,c,d,_,A,S){o.info(function(){if(o.g)if(S)for(var D="",te=S.split("&"),Re=0;Re<te.length;Re++){var X=te[Re].split("=");if(1<X.length){var Ve=X[0];X=X[1];var Oe=Ve.split("_");D=2<=Oe.length&&Oe[1]=="type"?D+(Ve+"="+X+"&"):D+(Ve+"=redacted&")}}else D=null;else D=S;return"XMLHTTP REQ ("+_+") [attempt "+A+"]: "+c+`
`+d+`
`+D})}function b_(o,c,d,_,A,S,D){o.info(function(){return"XMLHTTP RESP ("+_+") [ attempt "+A+"]: "+c+`
`+d+`
`+S+" "+D})}function Cn(o,c,d,_){o.info(function(){return"XMLHTTP TEXT ("+c+"): "+N_(o,d)+(_?" "+_:"")})}function P_(o,c){o.info(function(){return"TIMEOUT: "+c})}ms.prototype.info=function(){};function N_(o,c){if(!o.g)return c;if(!c)return null;try{var d=JSON.parse(c);if(d){for(o=0;o<d.length;o++)if(Array.isArray(d[o])){var _=d[o];if(!(2>_.length)){var A=_[1];if(Array.isArray(A)&&!(1>A.length)){var S=A[0];if(S!="noop"&&S!="stop"&&S!="close")for(var D=1;D<A.length;D++)A[D]=""}}}}return ho(d)}catch{return c}}var vr={NO_ERROR:0,gb:1,tb:2,sb:3,nb:4,rb:5,ub:6,Ia:7,TIMEOUT:8,xb:9},pc={lb:"complete",Hb:"success",Ja:"error",Ia:"abort",zb:"ready",Ab:"readystatechange",TIMEOUT:"timeout",vb:"incrementaldata",yb:"progress",ob:"downloadprogress",Pb:"uploadprogress"},mo;function wr(){}C(wr,fo),wr.prototype.g=function(){return new XMLHttpRequest},wr.prototype.i=function(){return{}},mo=new wr;function kt(o,c,d,_){this.j=o,this.i=c,this.l=d,this.R=_||1,this.U=new ds(this),this.I=45e3,this.H=null,this.o=!1,this.m=this.A=this.v=this.L=this.F=this.S=this.B=null,this.D=[],this.g=null,this.C=0,this.s=this.u=null,this.X=-1,this.J=!1,this.O=0,this.M=null,this.W=this.K=this.T=this.P=!1,this.h=new _c}function _c(){this.i=null,this.g="",this.h=!1}var mc={},go={};function yo(o,c,d){o.L=1,o.v=Cr(Et(c)),o.m=d,o.P=!0,gc(o,null)}function gc(o,c){o.F=Date.now(),Ir(o),o.A=Et(o.v);var d=o.A,_=o.R;Array.isArray(_)||(_=[String(_)]),kc(d.i,"t",_),o.C=0,d=o.j.J,o.h=new _c,o.g=Qc(o.j,d?c:null,!o.m),0<o.O&&(o.M=new A_(m(o.Y,o,o.g),o.O)),c=o.U,d=o.g,_=o.ca;var A="readystatechange";Array.isArray(A)||(A&&(oc[0]=A.toString()),A=oc);for(var S=0;S<A.length;S++){var D=ec(d,A[S],_||c.handleEvent,!1,c.h||c);if(!D)break;c.g[D.key]=D}c=o.H?g(o.H):{},o.m?(o.u||(o.u="POST"),c["Content-Type"]="application/x-www-form-urlencoded",o.g.ea(o.A,o.u,o.m,c)):(o.u="GET",o.g.ea(o.A,o.u,null,c)),ps(),S_(o.i,o.u,o.A,o.l,o.R,o.m)}kt.prototype.ca=function(o){o=o.target;const c=this.M;c&&Tt(o)==3?c.j():this.Y(o)},kt.prototype.Y=function(o){try{if(o==this.g)e:{const Oe=Tt(this.g);var c=this.g.Ba();const Pn=this.g.Z();if(!(3>Oe)&&(Oe!=3||this.g&&(this.h.h||this.g.oa()||Fc(this.g)))){this.J||Oe!=4||c==7||(c==8||0>=Pn?ps(3):ps(2)),Eo(this);var d=this.g.Z();this.X=d;t:if(yc(this)){var _=Fc(this.g);o="";var A=_.length,S=Tt(this.g)==4;if(!this.h.i){if(typeof TextDecoder>"u"){nn(this),gs(this);var D="";break t}this.h.i=new l.TextDecoder}for(c=0;c<A;c++)this.h.h=!0,o+=this.h.i.decode(_[c],{stream:!(S&&c==A-1)});_.length=0,this.h.g+=o,this.C=0,D=this.h.g}else D=this.g.oa();if(this.o=d==200,b_(this.i,this.u,this.A,this.l,this.R,Oe,d),this.o){if(this.T&&!this.K){t:{if(this.g){var te,Re=this.g;if((te=Re.g?Re.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!L(te)){var X=te;break t}}X=null}if(d=X)Cn(this.i,this.l,d,"Initial handshake response via X-HTTP-Initial-Response"),this.K=!0,To(this,d);else{this.o=!1,this.s=3,Be(12),nn(this),gs(this);break e}}if(this.P){d=!0;let st;for(;!this.J&&this.C<D.length;)if(st=k_(this,D),st==go){Oe==4&&(this.s=4,Be(14),d=!1),Cn(this.i,this.l,null,"[Incomplete Response]");break}else if(st==mc){this.s=4,Be(15),Cn(this.i,this.l,D,"[Invalid Chunk]"),d=!1;break}else Cn(this.i,this.l,st,null),To(this,st);if(yc(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),Oe!=4||D.length!=0||this.h.h||(this.s=1,Be(16),d=!1),this.o=this.o&&d,!d)Cn(this.i,this.l,D,"[Invalid Chunked Response]"),nn(this),gs(this);else if(0<D.length&&!this.W){this.W=!0;var Ve=this.j;Ve.g==this&&Ve.ba&&!Ve.M&&(Ve.j.info("Great, no buffering proxy detected. Bytes received: "+D.length),Co(Ve),Ve.M=!0,Be(11))}}else Cn(this.i,this.l,D,null),To(this,D);Oe==4&&nn(this),this.o&&!this.J&&(Oe==4?zc(this.j,this):(this.o=!1,Ir(this)))}else K_(this.g),d==400&&0<D.indexOf("Unknown SID")?(this.s=3,Be(12)):(this.s=0,Be(13)),nn(this),gs(this)}}}catch{}finally{}};function yc(o){return o.g?o.u=="GET"&&o.L!=2&&o.j.Ca:!1}function k_(o,c){var d=o.C,_=c.indexOf(`
`,d);return _==-1?go:(d=Number(c.substring(d,_)),isNaN(d)?mc:(_+=1,_+d>c.length?go:(c=c.slice(_,_+d),o.C=_+d,c)))}kt.prototype.cancel=function(){this.J=!0,nn(this)};function Ir(o){o.S=Date.now()+o.I,Ec(o,o.I)}function Ec(o,c){if(o.B!=null)throw Error("WatchDog timer not null");o.B=_s(m(o.ba,o),c)}function Eo(o){o.B&&(l.clearTimeout(o.B),o.B=null)}kt.prototype.ba=function(){this.B=null;const o=Date.now();0<=o-this.S?(P_(this.i,this.A),this.L!=2&&(ps(),Be(17)),nn(this),this.s=2,gs(this)):Ec(this,this.S-o)};function gs(o){o.j.G==0||o.J||zc(o.j,o)}function nn(o){Eo(o);var c=o.M;c&&typeof c.ma=="function"&&c.ma(),o.M=null,ac(o.U),o.g&&(c=o.g,o.g=null,c.abort(),c.ma())}function To(o,c){try{var d=o.j;if(d.G!=0&&(d.g==o||vo(d.h,o))){if(!o.K&&vo(d.h,o)&&d.G==3){try{var _=d.Da.g.parse(c)}catch{_=null}if(Array.isArray(_)&&_.length==3){var A=_;if(A[0]==0){e:if(!d.u){if(d.g)if(d.g.F+3e3<o.F)Dr(d),Nr(d);else break e;Ro(d),Be(18)}}else d.za=A[1],0<d.za-d.T&&37500>A[2]&&d.F&&d.v==0&&!d.C&&(d.C=_s(m(d.Za,d),6e3));if(1>=wc(d.h)&&d.ca){try{d.ca()}catch{}d.ca=void 0}}else rn(d,11)}else if((o.K||d.g==o)&&Dr(d),!L(c))for(A=d.Da.g.parse(c),c=0;c<A.length;c++){let X=A[c];if(d.T=X[0],X=X[1],d.G==2)if(X[0]=="c"){d.K=X[1],d.ia=X[2];const Ve=X[3];Ve!=null&&(d.la=Ve,d.j.info("VER="+d.la));const Oe=X[4];Oe!=null&&(d.Aa=Oe,d.j.info("SVER="+d.Aa));const Pn=X[5];Pn!=null&&typeof Pn=="number"&&0<Pn&&(_=1.5*Pn,d.L=_,d.j.info("backChannelRequestTimeoutMs_="+_)),_=d;const st=o.g;if(st){const Or=st.g?st.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(Or){var S=_.h;S.g||Or.indexOf("spdy")==-1&&Or.indexOf("quic")==-1&&Or.indexOf("h2")==-1||(S.j=S.l,S.g=new Set,S.h&&(wo(S,S.h),S.h=null))}if(_.D){const So=st.g?st.g.getResponseHeader("X-HTTP-Session-Id"):null;So&&(_.ya=So,oe(_.I,_.D,So))}}d.G=3,d.l&&d.l.ua(),d.ba&&(d.R=Date.now()-o.F,d.j.info("Handshake RTT: "+d.R+"ms")),_=d;var D=o;if(_.qa=Kc(_,_.J?_.ia:null,_.W),D.K){Ic(_.h,D);var te=D,Re=_.L;Re&&(te.I=Re),te.B&&(Eo(te),Ir(te)),_.g=D}else $c(_);0<d.i.length&&kr(d)}else X[0]!="stop"&&X[0]!="close"||rn(d,7);else d.G==3&&(X[0]=="stop"||X[0]=="close"?X[0]=="stop"?rn(d,7):Ao(d):X[0]!="noop"&&d.l&&d.l.ta(X),d.v=0)}}ps(4)}catch{}}var D_=class{constructor(o,c){this.g=o,this.map=c}};function Tc(o){this.l=o||10,l.PerformanceNavigationTiming?(o=l.performance.getEntriesByType("navigation"),o=0<o.length&&(o[0].nextHopProtocol=="hq"||o[0].nextHopProtocol=="h2")):o=!!(l.chrome&&l.chrome.loadTimes&&l.chrome.loadTimes()&&l.chrome.loadTimes().wasFetchedViaSpdy),this.j=o?this.l:1,this.g=null,1<this.j&&(this.g=new Set),this.h=null,this.i=[]}function vc(o){return o.h?!0:o.g?o.g.size>=o.j:!1}function wc(o){return o.h?1:o.g?o.g.size:0}function vo(o,c){return o.h?o.h==c:o.g?o.g.has(c):!1}function wo(o,c){o.g?o.g.add(c):o.h=c}function Ic(o,c){o.h&&o.h==c?o.h=null:o.g&&o.g.has(c)&&o.g.delete(c)}Tc.prototype.cancel=function(){if(this.i=Ac(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const o of this.g.values())o.cancel();this.g.clear()}};function Ac(o){if(o.h!=null)return o.i.concat(o.h.D);if(o.g!=null&&o.g.size!==0){let c=o.i;for(const d of o.g.values())c=c.concat(d.D);return c}return k(o.i)}function V_(o){if(o.V&&typeof o.V=="function")return o.V();if(typeof Map<"u"&&o instanceof Map||typeof Set<"u"&&o instanceof Set)return Array.from(o.values());if(typeof o=="string")return o.split("");if(u(o)){for(var c=[],d=o.length,_=0;_<d;_++)c.push(o[_]);return c}c=[],d=0;for(_ in o)c[d++]=o[_];return c}function O_(o){if(o.na&&typeof o.na=="function")return o.na();if(!o.V||typeof o.V!="function"){if(typeof Map<"u"&&o instanceof Map)return Array.from(o.keys());if(!(typeof Set<"u"&&o instanceof Set)){if(u(o)||typeof o=="string"){var c=[];o=o.length;for(var d=0;d<o;d++)c.push(d);return c}c=[],d=0;for(const _ in o)c[d++]=_;return c}}}function Rc(o,c){if(o.forEach&&typeof o.forEach=="function")o.forEach(c,void 0);else if(u(o)||typeof o=="string")Array.prototype.forEach.call(o,c,void 0);else for(var d=O_(o),_=V_(o),A=_.length,S=0;S<A;S++)c.call(void 0,_[S],d&&d[S],o)}var Cc=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function x_(o,c){if(o){o=o.split("&");for(var d=0;d<o.length;d++){var _=o[d].indexOf("="),A=null;if(0<=_){var S=o[d].substring(0,_);A=o[d].substring(_+1)}else S=o[d];c(S,A?decodeURIComponent(A.replace(/\+/g," ")):"")}}}function sn(o){if(this.g=this.o=this.j="",this.s=null,this.m=this.l="",this.h=!1,o instanceof sn){this.h=o.h,Ar(this,o.j),this.o=o.o,this.g=o.g,Rr(this,o.s),this.l=o.l;var c=o.i,d=new Ts;d.i=c.i,c.g&&(d.g=new Map(c.g),d.h=c.h),Sc(this,d),this.m=o.m}else o&&(c=String(o).match(Cc))?(this.h=!1,Ar(this,c[1]||"",!0),this.o=ys(c[2]||""),this.g=ys(c[3]||"",!0),Rr(this,c[4]),this.l=ys(c[5]||"",!0),Sc(this,c[6]||"",!0),this.m=ys(c[7]||"")):(this.h=!1,this.i=new Ts(null,this.h))}sn.prototype.toString=function(){var o=[],c=this.j;c&&o.push(Es(c,bc,!0),":");var d=this.g;return(d||c=="file")&&(o.push("//"),(c=this.o)&&o.push(Es(c,bc,!0),"@"),o.push(encodeURIComponent(String(d)).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),d=this.s,d!=null&&o.push(":",String(d))),(d=this.l)&&(this.g&&d.charAt(0)!="/"&&o.push("/"),o.push(Es(d,d.charAt(0)=="/"?F_:L_,!0))),(d=this.i.toString())&&o.push("?",d),(d=this.m)&&o.push("#",Es(d,B_)),o.join("")};function Et(o){return new sn(o)}function Ar(o,c,d){o.j=d?ys(c,!0):c,o.j&&(o.j=o.j.replace(/:$/,""))}function Rr(o,c){if(c){if(c=Number(c),isNaN(c)||0>c)throw Error("Bad port number "+c);o.s=c}else o.s=null}function Sc(o,c,d){c instanceof Ts?(o.i=c,q_(o.i,o.h)):(d||(c=Es(c,U_)),o.i=new Ts(c,o.h))}function oe(o,c,d){o.i.set(c,d)}function Cr(o){return oe(o,"zx",Math.floor(2147483648*Math.random()).toString(36)+Math.abs(Math.floor(2147483648*Math.random())^Date.now()).toString(36)),o}function ys(o,c){return o?c?decodeURI(o.replace(/%25/g,"%2525")):decodeURIComponent(o):""}function Es(o,c,d){return typeof o=="string"?(o=encodeURI(o).replace(c,M_),d&&(o=o.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),o):null}function M_(o){return o=o.charCodeAt(0),"%"+(o>>4&15).toString(16)+(o&15).toString(16)}var bc=/[#\/\?@]/g,L_=/[#\?:]/g,F_=/[#\?]/g,U_=/[#\?@]/g,B_=/#/g;function Ts(o,c){this.h=this.g=null,this.i=o||null,this.j=!!c}function Dt(o){o.g||(o.g=new Map,o.h=0,o.i&&x_(o.i,function(c,d){o.add(decodeURIComponent(c.replace(/\+/g," ")),d)}))}n=Ts.prototype,n.add=function(o,c){Dt(this),this.i=null,o=Sn(this,o);var d=this.g.get(o);return d||this.g.set(o,d=[]),d.push(c),this.h+=1,this};function Pc(o,c){Dt(o),c=Sn(o,c),o.g.has(c)&&(o.i=null,o.h-=o.g.get(c).length,o.g.delete(c))}function Nc(o,c){return Dt(o),c=Sn(o,c),o.g.has(c)}n.forEach=function(o,c){Dt(this),this.g.forEach(function(d,_){d.forEach(function(A){o.call(c,A,_,this)},this)},this)},n.na=function(){Dt(this);const o=Array.from(this.g.values()),c=Array.from(this.g.keys()),d=[];for(let _=0;_<c.length;_++){const A=o[_];for(let S=0;S<A.length;S++)d.push(c[_])}return d},n.V=function(o){Dt(this);let c=[];if(typeof o=="string")Nc(this,o)&&(c=c.concat(this.g.get(Sn(this,o))));else{o=Array.from(this.g.values());for(let d=0;d<o.length;d++)c=c.concat(o[d])}return c},n.set=function(o,c){return Dt(this),this.i=null,o=Sn(this,o),Nc(this,o)&&(this.h-=this.g.get(o).length),this.g.set(o,[c]),this.h+=1,this},n.get=function(o,c){return o?(o=this.V(o),0<o.length?String(o[0]):c):c};function kc(o,c,d){Pc(o,c),0<d.length&&(o.i=null,o.g.set(Sn(o,c),k(d)),o.h+=d.length)}n.toString=function(){if(this.i)return this.i;if(!this.g)return"";const o=[],c=Array.from(this.g.keys());for(var d=0;d<c.length;d++){var _=c[d];const S=encodeURIComponent(String(_)),D=this.V(_);for(_=0;_<D.length;_++){var A=S;D[_]!==""&&(A+="="+encodeURIComponent(String(D[_]))),o.push(A)}}return this.i=o.join("&")};function Sn(o,c){return c=String(c),o.j&&(c=c.toLowerCase()),c}function q_(o,c){c&&!o.j&&(Dt(o),o.i=null,o.g.forEach(function(d,_){var A=_.toLowerCase();_!=A&&(Pc(this,_),kc(this,A,d))},o)),o.j=c}function j_(o,c){const d=new ms;if(l.Image){const _=new Image;_.onload=I(Vt,d,"TestLoadImage: loaded",!0,c,_),_.onerror=I(Vt,d,"TestLoadImage: error",!1,c,_),_.onabort=I(Vt,d,"TestLoadImage: abort",!1,c,_),_.ontimeout=I(Vt,d,"TestLoadImage: timeout",!1,c,_),l.setTimeout(function(){_.ontimeout&&_.ontimeout()},1e4),_.src=o}else c(!1)}function $_(o,c){const d=new ms,_=new AbortController,A=setTimeout(()=>{_.abort(),Vt(d,"TestPingServer: timeout",!1,c)},1e4);fetch(o,{signal:_.signal}).then(S=>{clearTimeout(A),S.ok?Vt(d,"TestPingServer: ok",!0,c):Vt(d,"TestPingServer: server error",!1,c)}).catch(()=>{clearTimeout(A),Vt(d,"TestPingServer: error",!1,c)})}function Vt(o,c,d,_,A){try{A&&(A.onload=null,A.onerror=null,A.onabort=null,A.ontimeout=null),_(d)}catch{}}function W_(){this.g=new C_}function z_(o,c,d){const _=d||"";try{Rc(o,function(A,S){let D=A;h(A)&&(D=ho(A)),c.push(_+S+"="+encodeURIComponent(D))})}catch(A){throw c.push(_+"type="+encodeURIComponent("_badmap")),A}}function Sr(o){this.l=o.Ub||null,this.j=o.eb||!1}C(Sr,fo),Sr.prototype.g=function(){return new br(this.l,this.j)},Sr.prototype.i=function(o){return function(){return o}}({});function br(o,c){De.call(this),this.D=o,this.o=c,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.u=new Headers,this.h=null,this.B="GET",this.A="",this.g=!1,this.v=this.j=this.l=null}C(br,De),n=br.prototype,n.open=function(o,c){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.B=o,this.A=c,this.readyState=1,ws(this)},n.send=function(o){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");this.g=!0;const c={headers:this.u,method:this.B,credentials:this.m,cache:void 0};o&&(c.body=o),(this.D||l).fetch(new Request(this.A,c)).then(this.Sa.bind(this),this.ga.bind(this))},n.abort=function(){this.response=this.responseText="",this.u=new Headers,this.status=0,this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),1<=this.readyState&&this.g&&this.readyState!=4&&(this.g=!1,vs(this)),this.readyState=0},n.Sa=function(o){if(this.g&&(this.l=o,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=o.headers,this.readyState=2,ws(this)),this.g&&(this.readyState=3,ws(this),this.g)))if(this.responseType==="arraybuffer")o.arrayBuffer().then(this.Qa.bind(this),this.ga.bind(this));else if(typeof l.ReadableStream<"u"&&"body"in o){if(this.j=o.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.v=new TextDecoder;Dc(this)}else o.text().then(this.Ra.bind(this),this.ga.bind(this))};function Dc(o){o.j.read().then(o.Pa.bind(o)).catch(o.ga.bind(o))}n.Pa=function(o){if(this.g){if(this.o&&o.value)this.response.push(o.value);else if(!this.o){var c=o.value?o.value:new Uint8Array(0);(c=this.v.decode(c,{stream:!o.done}))&&(this.response=this.responseText+=c)}o.done?vs(this):ws(this),this.readyState==3&&Dc(this)}},n.Ra=function(o){this.g&&(this.response=this.responseText=o,vs(this))},n.Qa=function(o){this.g&&(this.response=o,vs(this))},n.ga=function(){this.g&&vs(this)};function vs(o){o.readyState=4,o.l=null,o.j=null,o.v=null,ws(o)}n.setRequestHeader=function(o,c){this.u.append(o,c)},n.getResponseHeader=function(o){return this.h&&this.h.get(o.toLowerCase())||""},n.getAllResponseHeaders=function(){if(!this.h)return"";const o=[],c=this.h.entries();for(var d=c.next();!d.done;)d=d.value,o.push(d[0]+": "+d[1]),d=c.next();return o.join(`\r
`)};function ws(o){o.onreadystatechange&&o.onreadystatechange.call(o)}Object.defineProperty(br.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(o){this.m=o?"include":"same-origin"}});function Vc(o){let c="";return fe(o,function(d,_){c+=_,c+=":",c+=d,c+=`\r
`}),c}function Io(o,c,d){e:{for(_ in d){var _=!1;break e}_=!0}_||(d=Vc(d),typeof o=="string"?d!=null&&encodeURIComponent(String(d)):oe(o,c,d))}function ce(o){De.call(this),this.headers=new Map,this.o=o||null,this.h=!1,this.v=this.g=null,this.D="",this.m=0,this.l="",this.j=this.B=this.u=this.A=!1,this.I=null,this.H="",this.J=!1}C(ce,De);var H_=/^https?$/i,G_=["POST","PUT"];n=ce.prototype,n.Ha=function(o){this.J=o},n.ea=function(o,c,d,_){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+o);c=c?c.toUpperCase():"GET",this.D=o,this.l="",this.m=0,this.A=!1,this.h=!0,this.g=this.o?this.o.g():mo.g(),this.v=this.o?lc(this.o):lc(mo),this.g.onreadystatechange=m(this.Ea,this);try{this.B=!0,this.g.open(c,String(o),!0),this.B=!1}catch(S){Oc(this,S);return}if(o=d||"",d=new Map(this.headers),_)if(Object.getPrototypeOf(_)===Object.prototype)for(var A in _)d.set(A,_[A]);else if(typeof _.keys=="function"&&typeof _.get=="function")for(const S of _.keys())d.set(S,_.get(S));else throw Error("Unknown input type for opt_headers: "+String(_));_=Array.from(d.keys()).find(S=>S.toLowerCase()=="content-type"),A=l.FormData&&o instanceof l.FormData,!(0<=Array.prototype.indexOf.call(G_,c,void 0))||_||A||d.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[S,D]of d)this.g.setRequestHeader(S,D);this.H&&(this.g.responseType=this.H),"withCredentials"in this.g&&this.g.withCredentials!==this.J&&(this.g.withCredentials=this.J);try{Lc(this),this.u=!0,this.g.send(o),this.u=!1}catch(S){Oc(this,S)}};function Oc(o,c){o.h=!1,o.g&&(o.j=!0,o.g.abort(),o.j=!1),o.l=c,o.m=5,xc(o),Pr(o)}function xc(o){o.A||(o.A=!0,Ue(o,"complete"),Ue(o,"error"))}n.abort=function(o){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.m=o||7,Ue(this,"complete"),Ue(this,"abort"),Pr(this))},n.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),Pr(this,!0)),ce.aa.N.call(this)},n.Ea=function(){this.s||(this.B||this.u||this.j?Mc(this):this.bb())},n.bb=function(){Mc(this)};function Mc(o){if(o.h&&typeof a<"u"&&(!o.v[1]||Tt(o)!=4||o.Z()!=2)){if(o.u&&Tt(o)==4)rc(o.Ea,0,o);else if(Ue(o,"readystatechange"),Tt(o)==4){o.h=!1;try{const D=o.Z();e:switch(D){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var c=!0;break e;default:c=!1}var d;if(!(d=c)){var _;if(_=D===0){var A=String(o.D).match(Cc)[1]||null;!A&&l.self&&l.self.location&&(A=l.self.location.protocol.slice(0,-1)),_=!H_.test(A?A.toLowerCase():"")}d=_}if(d)Ue(o,"complete"),Ue(o,"success");else{o.m=6;try{var S=2<Tt(o)?o.g.statusText:""}catch{S=""}o.l=S+" ["+o.Z()+"]",xc(o)}}finally{Pr(o)}}}}function Pr(o,c){if(o.g){Lc(o);const d=o.g,_=o.v[0]?()=>{}:null;o.g=null,o.v=null,c||Ue(o,"ready");try{d.onreadystatechange=_}catch{}}}function Lc(o){o.I&&(l.clearTimeout(o.I),o.I=null)}n.isActive=function(){return!!this.g};function Tt(o){return o.g?o.g.readyState:0}n.Z=function(){try{return 2<Tt(this)?this.g.status:-1}catch{return-1}},n.oa=function(){try{return this.g?this.g.responseText:""}catch{return""}},n.Oa=function(o){if(this.g){var c=this.g.responseText;return o&&c.indexOf(o)==0&&(c=c.substring(o.length)),R_(c)}};function Fc(o){try{if(!o.g)return null;if("response"in o.g)return o.g.response;switch(o.H){case"":case"text":return o.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in o.g)return o.g.mozResponseArrayBuffer}return null}catch{return null}}function K_(o){const c={};o=(o.g&&2<=Tt(o)&&o.g.getAllResponseHeaders()||"").split(`\r
`);for(let _=0;_<o.length;_++){if(L(o[_]))continue;var d=v(o[_]);const A=d[0];if(d=d[1],typeof d!="string")continue;d=d.trim();const S=c[A]||[];c[A]=S,S.push(d)}w(c,function(_){return _.join(", ")})}n.Ba=function(){return this.m},n.Ka=function(){return typeof this.l=="string"?this.l:String(this.l)};function Is(o,c,d){return d&&d.internalChannelParams&&d.internalChannelParams[o]||c}function Uc(o){this.Aa=0,this.i=[],this.j=new ms,this.ia=this.qa=this.I=this.W=this.g=this.ya=this.D=this.H=this.m=this.S=this.o=null,this.Ya=this.U=0,this.Va=Is("failFast",!1,o),this.F=this.C=this.u=this.s=this.l=null,this.X=!0,this.za=this.T=-1,this.Y=this.v=this.B=0,this.Ta=Is("baseRetryDelayMs",5e3,o),this.cb=Is("retryDelaySeedMs",1e4,o),this.Wa=Is("forwardChannelMaxRetries",2,o),this.wa=Is("forwardChannelRequestTimeoutMs",2e4,o),this.pa=o&&o.xmlHttpFactory||void 0,this.Xa=o&&o.Tb||void 0,this.Ca=o&&o.useFetchStreams||!1,this.L=void 0,this.J=o&&o.supportsCrossDomainXhr||!1,this.K="",this.h=new Tc(o&&o.concurrentRequestLimit),this.Da=new W_,this.P=o&&o.fastHandshake||!1,this.O=o&&o.encodeInitMessageHeaders||!1,this.P&&this.O&&(this.O=!1),this.Ua=o&&o.Rb||!1,o&&o.xa&&this.j.xa(),o&&o.forceLongPolling&&(this.X=!1),this.ba=!this.P&&this.X&&o&&o.detectBufferingProxy||!1,this.ja=void 0,o&&o.longPollingTimeout&&0<o.longPollingTimeout&&(this.ja=o.longPollingTimeout),this.ca=void 0,this.R=0,this.M=!1,this.ka=this.A=null}n=Uc.prototype,n.la=8,n.G=1,n.connect=function(o,c,d,_){Be(0),this.W=o,this.H=c||{},d&&_!==void 0&&(this.H.OSID=d,this.H.OAID=_),this.F=this.X,this.I=Kc(this,null,this.W),kr(this)};function Ao(o){if(Bc(o),o.G==3){var c=o.U++,d=Et(o.I);if(oe(d,"SID",o.K),oe(d,"RID",c),oe(d,"TYPE","terminate"),As(o,d),c=new kt(o,o.j,c),c.L=2,c.v=Cr(Et(d)),d=!1,l.navigator&&l.navigator.sendBeacon)try{d=l.navigator.sendBeacon(c.v.toString(),"")}catch{}!d&&l.Image&&(new Image().src=c.v,d=!0),d||(c.g=Qc(c.j,null),c.g.ea(c.v)),c.F=Date.now(),Ir(c)}Gc(o)}function Nr(o){o.g&&(Co(o),o.g.cancel(),o.g=null)}function Bc(o){Nr(o),o.u&&(l.clearTimeout(o.u),o.u=null),Dr(o),o.h.cancel(),o.s&&(typeof o.s=="number"&&l.clearTimeout(o.s),o.s=null)}function kr(o){if(!vc(o.h)&&!o.s){o.s=!0;var c=o.Ga;cs||Zl(),us||(cs(),us=!0),so.add(c,o),o.B=0}}function Q_(o,c){return wc(o.h)>=o.h.j-(o.s?1:0)?!1:o.s?(o.i=c.D.concat(o.i),!0):o.G==1||o.G==2||o.B>=(o.Va?0:o.Wa)?!1:(o.s=_s(m(o.Ga,o,c),Hc(o,o.B)),o.B++,!0)}n.Ga=function(o){if(this.s)if(this.s=null,this.G==1){if(!o){this.U=Math.floor(1e5*Math.random()),o=this.U++;const A=new kt(this,this.j,o);let S=this.o;if(this.S&&(S?(S=g(S),T(S,this.S)):S=this.S),this.m!==null||this.O||(A.H=S,S=null),this.P)e:{for(var c=0,d=0;d<this.i.length;d++){t:{var _=this.i[d];if("__data__"in _.map&&(_=_.map.__data__,typeof _=="string")){_=_.length;break t}_=void 0}if(_===void 0)break;if(c+=_,4096<c){c=d;break e}if(c===4096||d===this.i.length-1){c=d+1;break e}}c=1e3}else c=1e3;c=jc(this,A,c),d=Et(this.I),oe(d,"RID",o),oe(d,"CVER",22),this.D&&oe(d,"X-HTTP-Session-Id",this.D),As(this,d),S&&(this.O?c="headers="+encodeURIComponent(String(Vc(S)))+"&"+c:this.m&&Io(d,this.m,S)),wo(this.h,A),this.Ua&&oe(d,"TYPE","init"),this.P?(oe(d,"$req",c),oe(d,"SID","null"),A.T=!0,yo(A,d,null)):yo(A,d,c),this.G=2}}else this.G==3&&(o?qc(this,o):this.i.length==0||vc(this.h)||qc(this))};function qc(o,c){var d;c?d=c.l:d=o.U++;const _=Et(o.I);oe(_,"SID",o.K),oe(_,"RID",d),oe(_,"AID",o.T),As(o,_),o.m&&o.o&&Io(_,o.m,o.o),d=new kt(o,o.j,d,o.B+1),o.m===null&&(d.H=o.o),c&&(o.i=c.D.concat(o.i)),c=jc(o,d,1e3),d.I=Math.round(.5*o.wa)+Math.round(.5*o.wa*Math.random()),wo(o.h,d),yo(d,_,c)}function As(o,c){o.H&&fe(o.H,function(d,_){oe(c,_,d)}),o.l&&Rc({},function(d,_){oe(c,_,d)})}function jc(o,c,d){d=Math.min(o.i.length,d);var _=o.l?m(o.l.Na,o.l,o):null;e:{var A=o.i;let S=-1;for(;;){const D=["count="+d];S==-1?0<d?(S=A[0].g,D.push("ofs="+S)):S=0:D.push("ofs="+S);let te=!0;for(let Re=0;Re<d;Re++){let X=A[Re].g;const Ve=A[Re].map;if(X-=S,0>X)S=Math.max(0,A[Re].g-100),te=!1;else try{z_(Ve,D,"req"+X+"_")}catch{_&&_(Ve)}}if(te){_=D.join("&");break e}}}return o=o.i.splice(0,d),c.D=o,_}function $c(o){if(!o.g&&!o.u){o.Y=1;var c=o.Fa;cs||Zl(),us||(cs(),us=!0),so.add(c,o),o.v=0}}function Ro(o){return o.g||o.u||3<=o.v?!1:(o.Y++,o.u=_s(m(o.Fa,o),Hc(o,o.v)),o.v++,!0)}n.Fa=function(){if(this.u=null,Wc(this),this.ba&&!(this.M||this.g==null||0>=this.R)){var o=2*this.R;this.j.info("BP detection timer enabled: "+o),this.A=_s(m(this.ab,this),o)}},n.ab=function(){this.A&&(this.A=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.M=!0,Be(10),Nr(this),Wc(this))};function Co(o){o.A!=null&&(l.clearTimeout(o.A),o.A=null)}function Wc(o){o.g=new kt(o,o.j,"rpc",o.Y),o.m===null&&(o.g.H=o.o),o.g.O=0;var c=Et(o.qa);oe(c,"RID","rpc"),oe(c,"SID",o.K),oe(c,"AID",o.T),oe(c,"CI",o.F?"0":"1"),!o.F&&o.ja&&oe(c,"TO",o.ja),oe(c,"TYPE","xmlhttp"),As(o,c),o.m&&o.o&&Io(c,o.m,o.o),o.L&&(o.g.I=o.L);var d=o.g;o=o.ia,d.L=1,d.v=Cr(Et(c)),d.m=null,d.P=!0,gc(d,o)}n.Za=function(){this.C!=null&&(this.C=null,Nr(this),Ro(this),Be(19))};function Dr(o){o.C!=null&&(l.clearTimeout(o.C),o.C=null)}function zc(o,c){var d=null;if(o.g==c){Dr(o),Co(o),o.g=null;var _=2}else if(vo(o.h,c))d=c.D,Ic(o.h,c),_=1;else return;if(o.G!=0){if(c.o)if(_==1){d=c.m?c.m.length:0,c=Date.now()-c.F;var A=o.B;_=Tr(),Ue(_,new fc(_,d)),kr(o)}else $c(o);else if(A=c.s,A==3||A==0&&0<c.X||!(_==1&&Q_(o,c)||_==2&&Ro(o)))switch(d&&0<d.length&&(c=o.h,c.i=c.i.concat(d)),A){case 1:rn(o,5);break;case 4:rn(o,10);break;case 3:rn(o,6);break;default:rn(o,2)}}}function Hc(o,c){let d=o.Ta+Math.floor(Math.random()*o.cb);return o.isActive()||(d*=2),d*c}function rn(o,c){if(o.j.info("Error code "+c),c==2){var d=m(o.fb,o),_=o.Xa;const A=!_;_=new sn(_||"//www.google.com/images/cleardot.gif"),l.location&&l.location.protocol=="http"||Ar(_,"https"),Cr(_),A?j_(_.toString(),d):$_(_.toString(),d)}else Be(2);o.G=0,o.l&&o.l.sa(c),Gc(o),Bc(o)}n.fb=function(o){o?(this.j.info("Successfully pinged google.com"),Be(2)):(this.j.info("Failed to ping google.com"),Be(1))};function Gc(o){if(o.G=0,o.ka=[],o.l){const c=Ac(o.h);(c.length!=0||o.i.length!=0)&&(N(o.ka,c),N(o.ka,o.i),o.h.i.length=0,k(o.i),o.i.length=0),o.l.ra()}}function Kc(o,c,d){var _=d instanceof sn?Et(d):new sn(d);if(_.g!="")c&&(_.g=c+"."+_.g),Rr(_,_.s);else{var A=l.location;_=A.protocol,c=c?c+"."+A.hostname:A.hostname,A=+A.port;var S=new sn(null);_&&Ar(S,_),c&&(S.g=c),A&&Rr(S,A),d&&(S.l=d),_=S}return d=o.D,c=o.ya,d&&c&&oe(_,d,c),oe(_,"VER",o.la),As(o,_),_}function Qc(o,c,d){if(c&&!o.J)throw Error("Can't create secondary domain capable XhrIo object.");return c=o.Ca&&!o.pa?new ce(new Sr({eb:d})):new ce(o.pa),c.Ha(o.J),c}n.isActive=function(){return!!this.l&&this.l.isActive(this)};function Yc(){}n=Yc.prototype,n.ua=function(){},n.ta=function(){},n.sa=function(){},n.ra=function(){},n.isActive=function(){return!0},n.Na=function(){};function Vr(){}Vr.prototype.g=function(o,c){return new Ye(o,c)};function Ye(o,c){De.call(this),this.g=new Uc(c),this.l=o,this.h=c&&c.messageUrlParams||null,o=c&&c.messageHeaders||null,c&&c.clientProtocolHeaderRequired&&(o?o["X-Client-Protocol"]="webchannel":o={"X-Client-Protocol":"webchannel"}),this.g.o=o,o=c&&c.initMessageHeaders||null,c&&c.messageContentType&&(o?o["X-WebChannel-Content-Type"]=c.messageContentType:o={"X-WebChannel-Content-Type":c.messageContentType}),c&&c.va&&(o?o["X-WebChannel-Client-Profile"]=c.va:o={"X-WebChannel-Client-Profile":c.va}),this.g.S=o,(o=c&&c.Sb)&&!L(o)&&(this.g.m=o),this.v=c&&c.supportsCrossDomainXhr||!1,this.u=c&&c.sendRawJson||!1,(c=c&&c.httpSessionIdParam)&&!L(c)&&(this.g.D=c,o=this.h,o!==null&&c in o&&(o=this.h,c in o&&delete o[c])),this.j=new bn(this)}C(Ye,De),Ye.prototype.m=function(){this.g.l=this.j,this.v&&(this.g.J=!0),this.g.connect(this.l,this.h||void 0)},Ye.prototype.close=function(){Ao(this.g)},Ye.prototype.o=function(o){var c=this.g;if(typeof o=="string"){var d={};d.__data__=o,o=d}else this.u&&(d={},d.__data__=ho(o),o=d);c.i.push(new D_(c.Ya++,o)),c.G==3&&kr(c)},Ye.prototype.N=function(){this.g.l=null,delete this.j,Ao(this.g),delete this.g,Ye.aa.N.call(this)};function Xc(o){po.call(this),o.__headers__&&(this.headers=o.__headers__,this.statusCode=o.__status__,delete o.__headers__,delete o.__status__);var c=o.__sm__;if(c){e:{for(const d in c){o=d;break e}o=void 0}(this.i=o)&&(o=this.i,c=c!==null&&o in c?c[o]:void 0),this.data=c}else this.data=o}C(Xc,po);function Jc(){_o.call(this),this.status=1}C(Jc,_o);function bn(o){this.g=o}C(bn,Yc),bn.prototype.ua=function(){Ue(this.g,"a")},bn.prototype.ta=function(o){Ue(this.g,new Xc(o))},bn.prototype.sa=function(o){Ue(this.g,new Jc)},bn.prototype.ra=function(){Ue(this.g,"b")},Vr.prototype.createWebChannel=Vr.prototype.g,Ye.prototype.send=Ye.prototype.o,Ye.prototype.open=Ye.prototype.m,Ye.prototype.close=Ye.prototype.close,fd=function(){return new Vr},dd=function(){return Tr()},hd=tn,Qo={mb:0,pb:1,qb:2,Jb:3,Ob:4,Lb:5,Mb:6,Kb:7,Ib:8,Nb:9,PROXY:10,NOPROXY:11,Gb:12,Cb:13,Db:14,Bb:15,Eb:16,Fb:17,ib:18,hb:19,jb:20},vr.NO_ERROR=0,vr.TIMEOUT=8,vr.HTTP_ERROR=6,Wr=vr,pc.COMPLETE="complete",ud=pc,cc.EventType=fs,fs.OPEN="a",fs.CLOSE="b",fs.ERROR="c",fs.MESSAGE="d",De.prototype.listen=De.prototype.K,Ns=cc,ce.prototype.listenOnce=ce.prototype.L,ce.prototype.getLastError=ce.prototype.Ka,ce.prototype.getLastErrorCode=ce.prototype.Ba,ce.prototype.getStatus=ce.prototype.Z,ce.prototype.getResponseJson=ce.prototype.Oa,ce.prototype.getResponseText=ce.prototype.oa,ce.prototype.send=ce.prototype.ea,ce.prototype.setWithCredentials=ce.prototype.Ha,cd=ce}).apply(typeof xr<"u"?xr:typeof self<"u"?self:typeof window<"u"?window:{});const lu="@firebase/firestore",cu="4.9.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Me{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}Me.UNAUTHENTICATED=new Me(null),Me.GOOGLE_CREDENTIALS=new Me("google-credentials-uid"),Me.FIRST_PARTY=new Me("first-party-uid"),Me.MOCK_USER=new Me("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Jn="12.0.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _n=new xa("@firebase/firestore");function kn(){return _n.logLevel}function x(n,...e){if(_n.logLevel<=K.DEBUG){const t=e.map(La);_n.debug(`Firestore (${Jn}): ${n}`,...t)}}function Ct(n,...e){if(_n.logLevel<=K.ERROR){const t=e.map(La);_n.error(`Firestore (${Jn}): ${n}`,...t)}}function qn(n,...e){if(_n.logLevel<=K.WARN){const t=e.map(La);_n.warn(`Firestore (${Jn}): ${n}`,...t)}}function La(n){if(typeof n=="string")return n;try{/**
* @license
* Copyright 2020 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
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
 */function F(n,e,t){let s="Unexpected state";typeof e=="string"?s=e:t=e,pd(n,s,t)}function pd(n,e,t){let s=`FIRESTORE (${Jn}) INTERNAL ASSERTION FAILED: ${e} (ID: ${n.toString(16)})`;if(t!==void 0)try{s+=" CONTEXT: "+JSON.stringify(t)}catch{s+=" CONTEXT: "+t}throw Ct(s),new Error(s)}function J(n,e,t,s){let r="Unexpected state";typeof t=="string"?r=t:s=t,n||pd(e,r,s)}function q(n,e){return n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const b={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class O extends Xt{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ht{constructor(){this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _d{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class wg{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable(()=>t(Me.UNAUTHENTICATED))}shutdown(){}}class Ig{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable(()=>t(this.token.user))}shutdown(){this.changeListener=null}}class Ag{constructor(e){this.t=e,this.currentUser=Me.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,t){J(this.o===void 0,42304);let s=this.i;const r=u=>this.i!==s?(s=this.i,t(u)):Promise.resolve();let i=new ht;this.o=()=>{this.i++,this.currentUser=this.u(),i.resolve(),i=new ht,e.enqueueRetryable(()=>r(this.currentUser))};const a=()=>{const u=i;e.enqueueRetryable(async()=>{await u.promise,await r(this.currentUser)})},l=u=>{x("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=u,this.o&&(this.auth.addAuthTokenListener(this.o),a())};this.t.onInit(u=>l(u)),setTimeout(()=>{if(!this.auth){const u=this.t.getImmediate({optional:!0});u?l(u):(x("FirebaseAuthCredentialsProvider","Auth not yet detected"),i.resolve(),i=new ht)}},0),a()}getToken(){const e=this.i,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then(s=>this.i!==e?(x("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):s?(J(typeof s.accessToken=="string",31837,{l:s}),new _d(s.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const e=this.auth&&this.auth.getUid();return J(e===null||typeof e=="string",2055,{h:e}),new Me(e)}}class Rg{constructor(e,t,s){this.P=e,this.T=t,this.I=s,this.type="FirstParty",this.user=Me.FIRST_PARTY,this.A=new Map}R(){return this.I?this.I():null}get headers(){this.A.set("X-Goog-AuthUser",this.P);const e=this.R();return e&&this.A.set("Authorization",e),this.T&&this.A.set("X-Goog-Iam-Authorization-Token",this.T),this.A}}class Cg{constructor(e,t,s){this.P=e,this.T=t,this.I=s}getToken(){return Promise.resolve(new Rg(this.P,this.T,this.I))}start(e,t){e.enqueueRetryable(()=>t(Me.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class uu{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class Sg{constructor(e,t){this.V=t,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,Ri(e)&&e.settings.appCheckToken&&(this.p=e.settings.appCheckToken)}start(e,t){J(this.o===void 0,3512);const s=i=>{i.error!=null&&x("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${i.error.message}`);const a=i.token!==this.m;return this.m=i.token,x("FirebaseAppCheckTokenProvider",`Received ${a?"new":"existing"} token.`),a?t(i.token):Promise.resolve()};this.o=i=>{e.enqueueRetryable(()=>s(i))};const r=i=>{x("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=i,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit(i=>r(i)),setTimeout(()=>{if(!this.appCheck){const i=this.V.getImmediate({optional:!0});i?r(i):x("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){if(this.p)return Promise.resolve(new uu(this.p));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then(t=>t?(J(typeof t.token=="string",44558,{tokenResult:t}),this.m=t.token,new uu(t.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bg(n){const e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(n);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let s=0;s<n;s++)t[s]=Math.floor(256*Math.random());return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fa{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516);let s="";for(;s.length<20;){const r=bg(40);for(let i=0;i<r.length;++i)s.length<20&&r[i]<t&&(s+=e.charAt(r[i]%62))}return s}}function z(n,e){return n<e?-1:n>e?1:0}function Yo(n,e){const t=Math.min(n.length,e.length);for(let s=0;s<t;s++){const r=n.charAt(s),i=e.charAt(s);if(r!==i)return Po(r)===Po(i)?z(r,i):Po(r)?1:-1}return z(n.length,e.length)}const Pg=55296,Ng=57343;function Po(n){const e=n.charCodeAt(0);return e>=Pg&&e<=Ng}function jn(n,e,t){return n.length===e.length&&n.every((s,r)=>t(s,e[r]))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xo="__name__";class lt{constructor(e,t,s){t===void 0?t=0:t>e.length&&F(637,{offset:t,range:e.length}),s===void 0?s=e.length-t:s>e.length-t&&F(1746,{length:s,range:e.length-t}),this.segments=e,this.offset=t,this.len=s}get length(){return this.len}isEqual(e){return lt.comparator(this,e)===0}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof lt?e.forEach(s=>{t.push(s)}):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,s=this.limit();t<s;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const s=Math.min(e.length,t.length);for(let r=0;r<s;r++){const i=lt.compareSegments(e.get(r),t.get(r));if(i!==0)return i}return z(e.length,t.length)}static compareSegments(e,t){const s=lt.isNumericId(e),r=lt.isNumericId(t);return s&&!r?-1:!s&&r?1:s&&r?lt.extractNumericId(e).compare(lt.extractNumericId(t)):Yo(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return Ft.fromString(e.substring(4,e.length-2))}}class re extends lt{construct(e,t,s){return new re(e,t,s)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const s of e){if(s.indexOf("//")>=0)throw new O(b.INVALID_ARGUMENT,`Invalid segment (${s}). Paths must not contain // in them.`);t.push(...s.split("/").filter(r=>r.length>0))}return new re(t)}static emptyPath(){return new re([])}}const kg=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class be extends lt{construct(e,t,s){return new be(e,t,s)}static isValidIdentifier(e){return kg.test(e)}canonicalString(){return this.toArray().map(e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),be.isValidIdentifier(e)||(e="`"+e+"`"),e)).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===Xo}static keyField(){return new be([Xo])}static fromServerFormat(e){const t=[];let s="",r=0;const i=()=>{if(s.length===0)throw new O(b.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(s),s=""};let a=!1;for(;r<e.length;){const l=e[r];if(l==="\\"){if(r+1===e.length)throw new O(b.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const u=e[r+1];if(u!=="\\"&&u!=="."&&u!=="`")throw new O(b.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);s+=u,r+=2}else l==="`"?(a=!a,r++):l!=="."||a?(s+=l,r++):(i(),r++)}if(i(),a)throw new O(b.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new be(t)}static emptyPath(){return new be([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class M{constructor(e){this.path=e}static fromPath(e){return new M(re.fromString(e))}static fromName(e){return new M(re.fromString(e).popFirst(5))}static empty(){return new M(re.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&re.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return re.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new M(new re(e.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function md(n,e,t){if(!t)throw new O(b.INVALID_ARGUMENT,`Function ${n}() cannot be called with an empty ${e}.`)}function Dg(n,e,t,s){if(e===!0&&s===!0)throw new O(b.INVALID_ARGUMENT,`${n} and ${t} cannot be used together.`)}function hu(n){if(!M.isDocumentKey(n))throw new O(b.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${n} has ${n.length}.`)}function du(n){if(M.isDocumentKey(n))throw new O(b.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${n} has ${n.length}.`)}function gd(n){return typeof n=="object"&&n!==null&&(Object.getPrototypeOf(n)===Object.prototype||Object.getPrototypeOf(n)===null)}function Si(n){if(n===void 0)return"undefined";if(n===null)return"null";if(typeof n=="string")return n.length>20&&(n=`${n.substring(0,20)}...`),JSON.stringify(n);if(typeof n=="number"||typeof n=="boolean")return""+n;if(typeof n=="object"){if(n instanceof Array)return"an array";{const e=function(s){return s.constructor?s.constructor.name:null}(n);return e?`a custom ${e} object`:"an object"}}return typeof n=="function"?"a function":F(12329,{type:typeof n})}function Fe(n,e){if("_delegate"in n&&(n=n._delegate),!(n instanceof e)){if(e.name===n.constructor.name)throw new O(b.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const t=Si(n);throw new O(b.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return n}/**
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
 */function Ee(n,e){const t={typeString:n};return e&&(t.value=e),t}function rr(n,e){if(!gd(n))throw new O(b.INVALID_ARGUMENT,"JSON must be an object");let t;for(const s in e)if(e[s]){const r=e[s].typeString,i="value"in e[s]?{value:e[s].value}:void 0;if(!(s in n)){t=`JSON missing required field: '${s}'`;break}const a=n[s];if(r&&typeof a!==r){t=`JSON field '${s}' must be a ${r}.`;break}if(i!==void 0&&a!==i.value){t=`Expected '${s}' field to equal '${i.value}'`;break}}if(t)throw new O(b.INVALID_ARGUMENT,t);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fu=-62135596800,pu=1e6;class le{static now(){return le.fromMillis(Date.now())}static fromDate(e){return le.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),s=Math.floor((e-1e3*t)*pu);return new le(t,s)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new O(b.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new O(b.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<fu)throw new O(b.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new O(b.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/pu}_compareTo(e){return this.seconds===e.seconds?z(this.nanoseconds,e.nanoseconds):z(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:le._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(rr(e,le._jsonSchema))return new le(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-fu;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}le._jsonSchemaVersion="firestore/timestamp/1.0",le._jsonSchema={type:Ee("string",le._jsonSchemaVersion),seconds:Ee("number"),nanoseconds:Ee("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class j{static fromTimestamp(e){return new j(e)}static min(){return new j(new le(0,0))}static max(){return new j(new le(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
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
 */const Gs=-1;function Vg(n,e){const t=n.toTimestamp().seconds,s=n.toTimestamp().nanoseconds+1,r=j.fromTimestamp(s===1e9?new le(t+1,0):new le(t,s));return new $t(r,M.empty(),e)}function Og(n){return new $t(n.readTime,n.key,Gs)}class $t{constructor(e,t,s){this.readTime=e,this.documentKey=t,this.largestBatchId=s}static min(){return new $t(j.min(),M.empty(),Gs)}static max(){return new $t(j.max(),M.empty(),Gs)}}function xg(n,e){let t=n.readTime.compareTo(e.readTime);return t!==0?t:(t=M.comparator(n.documentKey,e.documentKey),t!==0?t:z(n.largestBatchId,e.largestBatchId))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mg="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class Lg{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(e=>e())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Zn(n){if(n.code!==b.FAILED_PRECONDITION||n.message!==Mg)throw n;x("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class P{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e(t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t)},t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t)})}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&F(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new P((s,r)=>{this.nextCallback=i=>{this.wrapSuccess(e,i).next(s,r)},this.catchCallback=i=>{this.wrapFailure(t,i).next(s,r)}})}toPromise(){return new Promise((e,t)=>{this.next(e,t)})}wrapUserFunction(e){try{const t=e();return t instanceof P?t:P.resolve(t)}catch(t){return P.reject(t)}}wrapSuccess(e,t){return e?this.wrapUserFunction(()=>e(t)):P.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction(()=>e(t)):P.reject(t)}static resolve(e){return new P((t,s)=>{t(e)})}static reject(e){return new P((t,s)=>{s(e)})}static waitFor(e){return new P((t,s)=>{let r=0,i=0,a=!1;e.forEach(l=>{++r,l.next(()=>{++i,a&&i===r&&t()},u=>s(u))}),a=!0,i===r&&t()})}static or(e){let t=P.resolve(!1);for(const s of e)t=t.next(r=>r?P.resolve(r):s());return t}static forEach(e,t){const s=[];return e.forEach((r,i)=>{s.push(t.call(this,r,i))}),this.waitFor(s)}static mapArray(e,t){return new P((s,r)=>{const i=e.length,a=new Array(i);let l=0;for(let u=0;u<i;u++){const h=u;t(e[h]).next(f=>{a[h]=f,++l,l===i&&s(a)},f=>r(f))}})}static doWhile(e,t){return new P((s,r)=>{const i=()=>{e()===!0?t().next(()=>{i()},r):s()};i()})}}function Fg(n){const e=n.match(/Android ([\d.]+)/i),t=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(t)}function es(n){return n.name==="IndexedDbTransactionError"}/**
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
 */class bi{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=s=>this.ae(s),this.ue=s=>t.writeSequenceNumber(s))}ae(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.ue&&this.ue(e),e}}bi.ce=-1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ua=-1;function Pi(n){return n==null}function ei(n){return n===0&&1/n==-1/0}function Ug(n){return typeof n=="number"&&Number.isInteger(n)&&!ei(n)&&n<=Number.MAX_SAFE_INTEGER&&n>=Number.MIN_SAFE_INTEGER}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yd="";function Bg(n){let e="";for(let t=0;t<n.length;t++)e.length>0&&(e=_u(e)),e=qg(n.get(t),e);return _u(e)}function qg(n,e){let t=e;const s=n.length;for(let r=0;r<s;r++){const i=n.charAt(r);switch(i){case"\0":t+="";break;case yd:t+="";break;default:t+=i}}return t}function _u(n){return n+yd+""}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mu(n){let e=0;for(const t in n)Object.prototype.hasOwnProperty.call(n,t)&&e++;return e}function Jt(n,e){for(const t in n)Object.prototype.hasOwnProperty.call(n,t)&&e(t,n[t])}function jg(n,e){const t=[];for(const s in n)Object.prototype.hasOwnProperty.call(n,s)&&t.push(e(n[s],s,n));return t}function Ed(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Te=class Jo{constructor(e,t){this.comparator=e,this.root=t||Ut.EMPTY}insert(e,t){return new Jo(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,Ut.BLACK,null,null))}remove(e){return new Jo(this.comparator,this.root.remove(e,this.comparator).copy(null,null,Ut.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){const s=this.comparator(e,t.key);if(s===0)return t.value;s<0?t=t.left:s>0&&(t=t.right)}return null}indexOf(e){let t=0,s=this.root;for(;!s.isEmpty();){const r=this.comparator(e,s.key);if(r===0)return t+s.left.size;r<0?s=s.left:(t+=s.left.size+1,s=s.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal((t,s)=>(e(t,s),!1))}toString(){const e=[];return this.inorderTraversal((t,s)=>(e.push(`${t}:${s}`),!1)),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new Mr(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new Mr(this.root,e,this.comparator,!1)}getReverseIterator(){return new Mr(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new Mr(this.root,e,this.comparator,!0)}},Mr=class{constructor(e,t,s,r){this.isReverse=r,this.nodeStack=[];let i=1;for(;!e.isEmpty();)if(i=t?s(e.key,t):1,t&&r&&(i*=-1),i<0)e=this.isReverse?e.left:e.right;else{if(i===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}},Ut=class vt{constructor(e,t,s,r,i){this.key=e,this.value=t,this.color=s??vt.RED,this.left=r??vt.EMPTY,this.right=i??vt.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,s,r,i){return new vt(e??this.key,t??this.value,s??this.color,r??this.left,i??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,s){let r=this;const i=s(e,r.key);return r=i<0?r.copy(null,null,null,r.left.insert(e,t,s),null):i===0?r.copy(null,t,null,null,null):r.copy(null,null,null,null,r.right.insert(e,t,s)),r.fixUp()}removeMin(){if(this.left.isEmpty())return vt.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let s,r=this;if(t(e,r.key)<0)r.left.isEmpty()||r.left.isRed()||r.left.left.isRed()||(r=r.moveRedLeft()),r=r.copy(null,null,null,r.left.remove(e,t),null);else{if(r.left.isRed()&&(r=r.rotateRight()),r.right.isEmpty()||r.right.isRed()||r.right.left.isRed()||(r=r.moveRedRight()),t(e,r.key)===0){if(r.right.isEmpty())return vt.EMPTY;s=r.right.min(),r=r.copy(s.key,s.value,null,null,r.right.removeMin())}r=r.copy(null,null,null,null,r.right.remove(e,t))}return r.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,vt.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,vt.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw F(43730,{key:this.key,value:this.value});if(this.right.isRed())throw F(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw F(27949);return e+(this.isRed()?0:1)}};Ut.EMPTY=null,Ut.RED=!0,Ut.BLACK=!1;Ut.EMPTY=new class{constructor(){this.size=0}get key(){throw F(57766)}get value(){throw F(16141)}get color(){throw F(16727)}get left(){throw F(29726)}get right(){throw F(36894)}copy(e,t,s,r,i){return this}insert(e,t,s){return new Ut(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ve{constructor(e){this.comparator=e,this.data=new Te(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal((t,s)=>(e(t),!1))}forEachInRange(e,t){const s=this.data.getIteratorFrom(e[0]);for(;s.hasNext();){const r=s.getNext();if(this.comparator(r.key,e[1])>=0)return;t(r.key)}}forEachWhile(e,t){let s;for(s=t!==void 0?this.data.getIteratorFrom(t):this.data.getIterator();s.hasNext();)if(!e(s.getNext().key))return}firstAfterOrEqual(e){const t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new gu(this.data.getIterator())}getIteratorFrom(e){return new gu(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach(s=>{t=t.add(s)}),t}isEqual(e){if(!(e instanceof ve)||this.size!==e.size)return!1;const t=this.data.getIterator(),s=e.data.getIterator();for(;t.hasNext();){const r=t.getNext().key,i=s.getNext().key;if(this.comparator(r,i)!==0)return!1}return!0}toArray(){const e=[];return this.forEach(t=>{e.push(t)}),e}toString(){const e=[];return this.forEach(t=>e.push(t)),"SortedSet("+e.toString()+")"}copy(e){const t=new ve(this.comparator);return t.data=e,t}}class gu{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xe{constructor(e){this.fields=e,e.sort(be.comparator)}static empty(){return new Xe([])}unionWith(e){let t=new ve(be.comparator);for(const s of this.fields)t=t.add(s);for(const s of e)t=t.add(s);return new Xe(t.toArray())}covers(e){for(const t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return jn(this.fields,e.fields,(t,s)=>t.isEqual(s))}}/**
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
 */class Td extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ne{constructor(e){this.binaryString=e}static fromBase64String(e){const t=function(r){try{return atob(r)}catch(i){throw typeof DOMException<"u"&&i instanceof DOMException?new Td("Invalid base64 string: "+i):i}}(e);return new Ne(t)}static fromUint8Array(e){const t=function(r){let i="";for(let a=0;a<r.length;++a)i+=String.fromCharCode(r[a]);return i}(e);return new Ne(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return function(t){return btoa(t)}(this.binaryString)}toUint8Array(){return function(t){const s=new Uint8Array(t.length);for(let r=0;r<t.length;r++)s[r]=t.charCodeAt(r);return s}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return z(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}Ne.EMPTY_BYTE_STRING=new Ne("");const $g=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Wt(n){if(J(!!n,39018),typeof n=="string"){let e=0;const t=$g.exec(n);if(J(!!t,46558,{timestamp:n}),t[1]){let r=t[1];r=(r+"000000000").substr(0,9),e=Number(r)}const s=new Date(n);return{seconds:Math.floor(s.getTime()/1e3),nanos:e}}return{seconds:pe(n.seconds),nanos:pe(n.nanos)}}function pe(n){return typeof n=="number"?n:typeof n=="string"?Number(n):0}function zt(n){return typeof n=="string"?Ne.fromBase64String(n):Ne.fromUint8Array(n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vd="server_timestamp",wd="__type__",Id="__previous_value__",Ad="__local_write_time__";function Ba(n){var t,s;return((s=(((t=n==null?void 0:n.mapValue)==null?void 0:t.fields)||{})[wd])==null?void 0:s.stringValue)===vd}function Ni(n){const e=n.mapValue.fields[Id];return Ba(e)?Ni(e):e}function Ks(n){const e=Wt(n.mapValue.fields[Ad].timestampValue);return new le(e.seconds,e.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wg{constructor(e,t,s,r,i,a,l,u,h,f){this.databaseId=e,this.appId=t,this.persistenceKey=s,this.host=r,this.ssl=i,this.forceLongPolling=a,this.autoDetectLongPolling=l,this.longPollingOptions=u,this.useFetchStreams=h,this.isUsingEmulator=f}}const Zo="(default)";class Qs{constructor(e,t){this.projectId=e,this.database=t||Zo}static empty(){return new Qs("","")}get isDefaultDatabase(){return this.database===Zo}isEqual(e){return e instanceof Qs&&e.projectId===this.projectId&&e.database===this.database}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Rd="__type__",zg="__max__",Lr={mapValue:{}},Cd="__vector__",ti="value";function Ht(n){return"nullValue"in n?0:"booleanValue"in n?1:"integerValue"in n||"doubleValue"in n?2:"timestampValue"in n?3:"stringValue"in n?5:"bytesValue"in n?6:"referenceValue"in n?7:"geoPointValue"in n?8:"arrayValue"in n?9:"mapValue"in n?Ba(n)?4:Gg(n)?9007199254740991:Hg(n)?10:11:F(28295,{value:n})}function mt(n,e){if(n===e)return!0;const t=Ht(n);if(t!==Ht(e))return!1;switch(t){case 0:case 9007199254740991:return!0;case 1:return n.booleanValue===e.booleanValue;case 4:return Ks(n).isEqual(Ks(e));case 3:return function(r,i){if(typeof r.timestampValue=="string"&&typeof i.timestampValue=="string"&&r.timestampValue.length===i.timestampValue.length)return r.timestampValue===i.timestampValue;const a=Wt(r.timestampValue),l=Wt(i.timestampValue);return a.seconds===l.seconds&&a.nanos===l.nanos}(n,e);case 5:return n.stringValue===e.stringValue;case 6:return function(r,i){return zt(r.bytesValue).isEqual(zt(i.bytesValue))}(n,e);case 7:return n.referenceValue===e.referenceValue;case 8:return function(r,i){return pe(r.geoPointValue.latitude)===pe(i.geoPointValue.latitude)&&pe(r.geoPointValue.longitude)===pe(i.geoPointValue.longitude)}(n,e);case 2:return function(r,i){if("integerValue"in r&&"integerValue"in i)return pe(r.integerValue)===pe(i.integerValue);if("doubleValue"in r&&"doubleValue"in i){const a=pe(r.doubleValue),l=pe(i.doubleValue);return a===l?ei(a)===ei(l):isNaN(a)&&isNaN(l)}return!1}(n,e);case 9:return jn(n.arrayValue.values||[],e.arrayValue.values||[],mt);case 10:case 11:return function(r,i){const a=r.mapValue.fields||{},l=i.mapValue.fields||{};if(mu(a)!==mu(l))return!1;for(const u in a)if(a.hasOwnProperty(u)&&(l[u]===void 0||!mt(a[u],l[u])))return!1;return!0}(n,e);default:return F(52216,{left:n})}}function Ys(n,e){return(n.values||[]).find(t=>mt(t,e))!==void 0}function $n(n,e){if(n===e)return 0;const t=Ht(n),s=Ht(e);if(t!==s)return z(t,s);switch(t){case 0:case 9007199254740991:return 0;case 1:return z(n.booleanValue,e.booleanValue);case 2:return function(i,a){const l=pe(i.integerValue||i.doubleValue),u=pe(a.integerValue||a.doubleValue);return l<u?-1:l>u?1:l===u?0:isNaN(l)?isNaN(u)?0:-1:1}(n,e);case 3:return yu(n.timestampValue,e.timestampValue);case 4:return yu(Ks(n),Ks(e));case 5:return Yo(n.stringValue,e.stringValue);case 6:return function(i,a){const l=zt(i),u=zt(a);return l.compareTo(u)}(n.bytesValue,e.bytesValue);case 7:return function(i,a){const l=i.split("/"),u=a.split("/");for(let h=0;h<l.length&&h<u.length;h++){const f=z(l[h],u[h]);if(f!==0)return f}return z(l.length,u.length)}(n.referenceValue,e.referenceValue);case 8:return function(i,a){const l=z(pe(i.latitude),pe(a.latitude));return l!==0?l:z(pe(i.longitude),pe(a.longitude))}(n.geoPointValue,e.geoPointValue);case 9:return Eu(n.arrayValue,e.arrayValue);case 10:return function(i,a){var m,I,C,k;const l=i.fields||{},u=a.fields||{},h=(m=l[ti])==null?void 0:m.arrayValue,f=(I=u[ti])==null?void 0:I.arrayValue,p=z(((C=h==null?void 0:h.values)==null?void 0:C.length)||0,((k=f==null?void 0:f.values)==null?void 0:k.length)||0);return p!==0?p:Eu(h,f)}(n.mapValue,e.mapValue);case 11:return function(i,a){if(i===Lr.mapValue&&a===Lr.mapValue)return 0;if(i===Lr.mapValue)return 1;if(a===Lr.mapValue)return-1;const l=i.fields||{},u=Object.keys(l),h=a.fields||{},f=Object.keys(h);u.sort(),f.sort();for(let p=0;p<u.length&&p<f.length;++p){const m=Yo(u[p],f[p]);if(m!==0)return m;const I=$n(l[u[p]],h[f[p]]);if(I!==0)return I}return z(u.length,f.length)}(n.mapValue,e.mapValue);default:throw F(23264,{he:t})}}function yu(n,e){if(typeof n=="string"&&typeof e=="string"&&n.length===e.length)return z(n,e);const t=Wt(n),s=Wt(e),r=z(t.seconds,s.seconds);return r!==0?r:z(t.nanos,s.nanos)}function Eu(n,e){const t=n.values||[],s=e.values||[];for(let r=0;r<t.length&&r<s.length;++r){const i=$n(t[r],s[r]);if(i)return i}return z(t.length,s.length)}function Wn(n){return ea(n)}function ea(n){return"nullValue"in n?"null":"booleanValue"in n?""+n.booleanValue:"integerValue"in n?""+n.integerValue:"doubleValue"in n?""+n.doubleValue:"timestampValue"in n?function(t){const s=Wt(t);return`time(${s.seconds},${s.nanos})`}(n.timestampValue):"stringValue"in n?n.stringValue:"bytesValue"in n?function(t){return zt(t).toBase64()}(n.bytesValue):"referenceValue"in n?function(t){return M.fromName(t).toString()}(n.referenceValue):"geoPointValue"in n?function(t){return`geo(${t.latitude},${t.longitude})`}(n.geoPointValue):"arrayValue"in n?function(t){let s="[",r=!0;for(const i of t.values||[])r?r=!1:s+=",",s+=ea(i);return s+"]"}(n.arrayValue):"mapValue"in n?function(t){const s=Object.keys(t.fields||{}).sort();let r="{",i=!0;for(const a of s)i?i=!1:r+=",",r+=`${a}:${ea(t.fields[a])}`;return r+"}"}(n.mapValue):F(61005,{value:n})}function zr(n){switch(Ht(n)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const e=Ni(n);return e?16+zr(e):16;case 5:return 2*n.stringValue.length;case 6:return zt(n.bytesValue).approximateByteSize();case 7:return n.referenceValue.length;case 9:return function(s){return(s.values||[]).reduce((r,i)=>r+zr(i),0)}(n.arrayValue);case 10:case 11:return function(s){let r=0;return Jt(s.fields,(i,a)=>{r+=i.length+zr(a)}),r}(n.mapValue);default:throw F(13486,{value:n})}}function Tu(n,e){return{referenceValue:`projects/${n.projectId}/databases/${n.database}/documents/${e.path.canonicalString()}`}}function ta(n){return!!n&&"integerValue"in n}function qa(n){return!!n&&"arrayValue"in n}function vu(n){return!!n&&"nullValue"in n}function wu(n){return!!n&&"doubleValue"in n&&isNaN(Number(n.doubleValue))}function Hr(n){return!!n&&"mapValue"in n}function Hg(n){var t,s;return((s=(((t=n==null?void 0:n.mapValue)==null?void 0:t.fields)||{})[Rd])==null?void 0:s.stringValue)===Cd}function xs(n){if(n.geoPointValue)return{geoPointValue:{...n.geoPointValue}};if(n.timestampValue&&typeof n.timestampValue=="object")return{timestampValue:{...n.timestampValue}};if(n.mapValue){const e={mapValue:{fields:{}}};return Jt(n.mapValue.fields,(t,s)=>e.mapValue.fields[t]=xs(s)),e}if(n.arrayValue){const e={arrayValue:{values:[]}};for(let t=0;t<(n.arrayValue.values||[]).length;++t)e.arrayValue.values[t]=xs(n.arrayValue.values[t]);return e}return{...n}}function Gg(n){return(((n.mapValue||{}).fields||{}).__type__||{}).stringValue===zg}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ze{constructor(e){this.value=e}static empty(){return new ze({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let s=0;s<e.length-1;++s)if(t=(t.mapValue.fields||{})[e.get(s)],!Hr(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=xs(t)}setAll(e){let t=be.emptyPath(),s={},r=[];e.forEach((a,l)=>{if(!t.isImmediateParentOf(l)){const u=this.getFieldsMap(t);this.applyChanges(u,s,r),s={},r=[],t=l.popLast()}a?s[l.lastSegment()]=xs(a):r.push(l.lastSegment())});const i=this.getFieldsMap(t);this.applyChanges(i,s,r)}delete(e){const t=this.field(e.popLast());Hr(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return mt(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let s=0;s<e.length;++s){let r=t.mapValue.fields[e.get(s)];Hr(r)&&r.mapValue.fields||(r={mapValue:{fields:{}}},t.mapValue.fields[e.get(s)]=r),t=r}return t.mapValue.fields}applyChanges(e,t,s){Jt(t,(r,i)=>e[r]=i);for(const r of s)delete e[r]}clone(){return new ze(xs(this.value))}}function Sd(n){const e=[];return Jt(n.fields,(t,s)=>{const r=new be([t]);if(Hr(s)){const i=Sd(s.mapValue).fields;if(i.length===0)e.push(r);else for(const a of i)e.push(r.child(a))}else e.push(r)}),new Xe(e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Le{constructor(e,t,s,r,i,a,l){this.key=e,this.documentType=t,this.version=s,this.readTime=r,this.createTime=i,this.data=a,this.documentState=l}static newInvalidDocument(e){return new Le(e,0,j.min(),j.min(),j.min(),ze.empty(),0)}static newFoundDocument(e,t,s,r){return new Le(e,1,t,j.min(),s,r,0)}static newNoDocument(e,t){return new Le(e,2,t,j.min(),j.min(),ze.empty(),0)}static newUnknownDocument(e,t){return new Le(e,3,t,j.min(),j.min(),ze.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual(j.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=ze.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=ze.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=j.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof Le&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new Le(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
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
 */class ni{constructor(e,t){this.position=e,this.inclusive=t}}function Iu(n,e,t){let s=0;for(let r=0;r<n.position.length;r++){const i=e[r],a=n.position[r];if(i.field.isKeyField()?s=M.comparator(M.fromName(a.referenceValue),t.key):s=$n(a,t.data.field(i.field)),i.dir==="desc"&&(s*=-1),s!==0)break}return s}function Au(n,e){if(n===null)return e===null;if(e===null||n.inclusive!==e.inclusive||n.position.length!==e.position.length)return!1;for(let t=0;t<n.position.length;t++)if(!mt(n.position[t],e.position[t]))return!1;return!0}/**
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
 */class Xs{constructor(e,t="asc"){this.field=e,this.dir=t}}function Kg(n,e){return n.dir===e.dir&&n.field.isEqual(e.field)}/**
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
 */class bd{}class ye extends bd{constructor(e,t,s){super(),this.field=e,this.op=t,this.value=s}static create(e,t,s){return e.isKeyField()?t==="in"||t==="not-in"?this.createKeyFieldInFilter(e,t,s):new Yg(e,t,s):t==="array-contains"?new Zg(e,s):t==="in"?new ey(e,s):t==="not-in"?new ty(e,s):t==="array-contains-any"?new ny(e,s):new ye(e,t,s)}static createKeyFieldInFilter(e,t,s){return t==="in"?new Xg(e,s):new Jg(e,s)}matches(e){const t=e.data.field(this.field);return this.op==="!="?t!==null&&t.nullValue===void 0&&this.matchesComparison($n(t,this.value)):t!==null&&Ht(this.value)===Ht(t)&&this.matchesComparison($n(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return F(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class ot extends bd{constructor(e,t){super(),this.filters=e,this.op=t,this.Pe=null}static create(e,t){return new ot(e,t)}matches(e){return Pd(this)?this.filters.find(t=>!t.matches(e))===void 0:this.filters.find(t=>t.matches(e))!==void 0}getFlattenedFilters(){return this.Pe!==null||(this.Pe=this.filters.reduce((e,t)=>e.concat(t.getFlattenedFilters()),[])),this.Pe}getFilters(){return Object.assign([],this.filters)}}function Pd(n){return n.op==="and"}function Nd(n){return Qg(n)&&Pd(n)}function Qg(n){for(const e of n.filters)if(e instanceof ot)return!1;return!0}function na(n){if(n instanceof ye)return n.field.canonicalString()+n.op.toString()+Wn(n.value);if(Nd(n))return n.filters.map(e=>na(e)).join(",");{const e=n.filters.map(t=>na(t)).join(",");return`${n.op}(${e})`}}function kd(n,e){return n instanceof ye?function(s,r){return r instanceof ye&&s.op===r.op&&s.field.isEqual(r.field)&&mt(s.value,r.value)}(n,e):n instanceof ot?function(s,r){return r instanceof ot&&s.op===r.op&&s.filters.length===r.filters.length?s.filters.reduce((i,a,l)=>i&&kd(a,r.filters[l]),!0):!1}(n,e):void F(19439)}function Dd(n){return n instanceof ye?function(t){return`${t.field.canonicalString()} ${t.op} ${Wn(t.value)}`}(n):n instanceof ot?function(t){return t.op.toString()+" {"+t.getFilters().map(Dd).join(" ,")+"}"}(n):"Filter"}class Yg extends ye{constructor(e,t,s){super(e,t,s),this.key=M.fromName(s.referenceValue)}matches(e){const t=M.comparator(e.key,this.key);return this.matchesComparison(t)}}class Xg extends ye{constructor(e,t){super(e,"in",t),this.keys=Vd("in",t)}matches(e){return this.keys.some(t=>t.isEqual(e.key))}}class Jg extends ye{constructor(e,t){super(e,"not-in",t),this.keys=Vd("not-in",t)}matches(e){return!this.keys.some(t=>t.isEqual(e.key))}}function Vd(n,e){var t;return(((t=e.arrayValue)==null?void 0:t.values)||[]).map(s=>M.fromName(s.referenceValue))}class Zg extends ye{constructor(e,t){super(e,"array-contains",t)}matches(e){const t=e.data.field(this.field);return qa(t)&&Ys(t.arrayValue,this.value)}}class ey extends ye{constructor(e,t){super(e,"in",t)}matches(e){const t=e.data.field(this.field);return t!==null&&Ys(this.value.arrayValue,t)}}class ty extends ye{constructor(e,t){super(e,"not-in",t)}matches(e){if(Ys(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const t=e.data.field(this.field);return t!==null&&t.nullValue===void 0&&!Ys(this.value.arrayValue,t)}}class ny extends ye{constructor(e,t){super(e,"array-contains-any",t)}matches(e){const t=e.data.field(this.field);return!(!qa(t)||!t.arrayValue.values)&&t.arrayValue.values.some(s=>Ys(this.value.arrayValue,s))}}/**
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
 */class sy{constructor(e,t=null,s=[],r=[],i=null,a=null,l=null){this.path=e,this.collectionGroup=t,this.orderBy=s,this.filters=r,this.limit=i,this.startAt=a,this.endAt=l,this.Te=null}}function Ru(n,e=null,t=[],s=[],r=null,i=null,a=null){return new sy(n,e,t,s,r,i,a)}function ja(n){const e=q(n);if(e.Te===null){let t=e.path.canonicalString();e.collectionGroup!==null&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map(s=>na(s)).join(","),t+="|ob:",t+=e.orderBy.map(s=>function(i){return i.field.canonicalString()+i.dir}(s)).join(","),Pi(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map(s=>Wn(s)).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map(s=>Wn(s)).join(",")),e.Te=t}return e.Te}function $a(n,e){if(n.limit!==e.limit||n.orderBy.length!==e.orderBy.length)return!1;for(let t=0;t<n.orderBy.length;t++)if(!Kg(n.orderBy[t],e.orderBy[t]))return!1;if(n.filters.length!==e.filters.length)return!1;for(let t=0;t<n.filters.length;t++)if(!kd(n.filters[t],e.filters[t]))return!1;return n.collectionGroup===e.collectionGroup&&!!n.path.isEqual(e.path)&&!!Au(n.startAt,e.startAt)&&Au(n.endAt,e.endAt)}function sa(n){return M.isDocumentKey(n.path)&&n.collectionGroup===null&&n.filters.length===0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ts{constructor(e,t=null,s=[],r=[],i=null,a="F",l=null,u=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=s,this.filters=r,this.limit=i,this.limitType=a,this.startAt=l,this.endAt=u,this.Ie=null,this.Ee=null,this.de=null,this.startAt,this.endAt}}function ry(n,e,t,s,r,i,a,l){return new ts(n,e,t,s,r,i,a,l)}function ki(n){return new ts(n)}function Cu(n){return n.filters.length===0&&n.limit===null&&n.startAt==null&&n.endAt==null&&(n.explicitOrderBy.length===0||n.explicitOrderBy.length===1&&n.explicitOrderBy[0].field.isKeyField())}function Od(n){return n.collectionGroup!==null}function Ms(n){const e=q(n);if(e.Ie===null){e.Ie=[];const t=new Set;for(const i of e.explicitOrderBy)e.Ie.push(i),t.add(i.field.canonicalString());const s=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(a){let l=new ve(be.comparator);return a.filters.forEach(u=>{u.getFlattenedFilters().forEach(h=>{h.isInequality()&&(l=l.add(h.field))})}),l})(e).forEach(i=>{t.has(i.canonicalString())||i.isKeyField()||e.Ie.push(new Xs(i,s))}),t.has(be.keyField().canonicalString())||e.Ie.push(new Xs(be.keyField(),s))}return e.Ie}function dt(n){const e=q(n);return e.Ee||(e.Ee=xd(e,Ms(n))),e.Ee}function iy(n){const e=q(n);return e.de||(e.de=xd(e,n.explicitOrderBy)),e.de}function xd(n,e){if(n.limitType==="F")return Ru(n.path,n.collectionGroup,e,n.filters,n.limit,n.startAt,n.endAt);{e=e.map(r=>{const i=r.dir==="desc"?"asc":"desc";return new Xs(r.field,i)});const t=n.endAt?new ni(n.endAt.position,n.endAt.inclusive):null,s=n.startAt?new ni(n.startAt.position,n.startAt.inclusive):null;return Ru(n.path,n.collectionGroup,e,n.filters,n.limit,t,s)}}function ra(n,e){const t=n.filters.concat([e]);return new ts(n.path,n.collectionGroup,n.explicitOrderBy.slice(),t,n.limit,n.limitType,n.startAt,n.endAt)}function ia(n,e,t){return new ts(n.path,n.collectionGroup,n.explicitOrderBy.slice(),n.filters.slice(),e,t,n.startAt,n.endAt)}function Di(n,e){return $a(dt(n),dt(e))&&n.limitType===e.limitType}function Md(n){return`${ja(dt(n))}|lt:${n.limitType}`}function Dn(n){return`Query(target=${function(t){let s=t.path.canonicalString();return t.collectionGroup!==null&&(s+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(s+=`, filters: [${t.filters.map(r=>Dd(r)).join(", ")}]`),Pi(t.limit)||(s+=", limit: "+t.limit),t.orderBy.length>0&&(s+=`, orderBy: [${t.orderBy.map(r=>function(a){return`${a.field.canonicalString()} (${a.dir})`}(r)).join(", ")}]`),t.startAt&&(s+=", startAt: ",s+=t.startAt.inclusive?"b:":"a:",s+=t.startAt.position.map(r=>Wn(r)).join(",")),t.endAt&&(s+=", endAt: ",s+=t.endAt.inclusive?"a:":"b:",s+=t.endAt.position.map(r=>Wn(r)).join(",")),`Target(${s})`}(dt(n))}; limitType=${n.limitType})`}function Vi(n,e){return e.isFoundDocument()&&function(s,r){const i=r.key.path;return s.collectionGroup!==null?r.key.hasCollectionId(s.collectionGroup)&&s.path.isPrefixOf(i):M.isDocumentKey(s.path)?s.path.isEqual(i):s.path.isImmediateParentOf(i)}(n,e)&&function(s,r){for(const i of Ms(s))if(!i.field.isKeyField()&&r.data.field(i.field)===null)return!1;return!0}(n,e)&&function(s,r){for(const i of s.filters)if(!i.matches(r))return!1;return!0}(n,e)&&function(s,r){return!(s.startAt&&!function(a,l,u){const h=Iu(a,l,u);return a.inclusive?h<=0:h<0}(s.startAt,Ms(s),r)||s.endAt&&!function(a,l,u){const h=Iu(a,l,u);return a.inclusive?h>=0:h>0}(s.endAt,Ms(s),r))}(n,e)}function oy(n){return n.collectionGroup||(n.path.length%2==1?n.path.lastSegment():n.path.get(n.path.length-2))}function Ld(n){return(e,t)=>{let s=!1;for(const r of Ms(n)){const i=ay(r,e,t);if(i!==0)return i;s=s||r.field.isKeyField()}return 0}}function ay(n,e,t){const s=n.field.isKeyField()?M.comparator(e.key,t.key):function(i,a,l){const u=a.data.field(i),h=l.data.field(i);return u!==null&&h!==null?$n(u,h):F(42886)}(n.field,e,t);switch(n.dir){case"asc":return s;case"desc":return-1*s;default:return F(19790,{direction:n.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vn{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){const t=this.mapKeyFn(e),s=this.inner[t];if(s!==void 0){for(const[r,i]of s)if(this.equalsFn(r,e))return i}}has(e){return this.get(e)!==void 0}set(e,t){const s=this.mapKeyFn(e),r=this.inner[s];if(r===void 0)return this.inner[s]=[[e,t]],void this.innerSize++;for(let i=0;i<r.length;i++)if(this.equalsFn(r[i][0],e))return void(r[i]=[e,t]);r.push([e,t]),this.innerSize++}delete(e){const t=this.mapKeyFn(e),s=this.inner[t];if(s===void 0)return!1;for(let r=0;r<s.length;r++)if(this.equalsFn(s[r][0],e))return s.length===1?delete this.inner[t]:s.splice(r,1),this.innerSize--,!0;return!1}forEach(e){Jt(this.inner,(t,s)=>{for(const[r,i]of s)e(r,i)})}isEmpty(){return Ed(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ly=new Te(M.comparator);function St(){return ly}const Fd=new Te(M.comparator);function ks(...n){let e=Fd;for(const t of n)e=e.insert(t.key,t);return e}function Ud(n){let e=Fd;return n.forEach((t,s)=>e=e.insert(t,s.overlayedDocument)),e}function ln(){return Ls()}function Bd(){return Ls()}function Ls(){return new vn(n=>n.toString(),(n,e)=>n.isEqual(e))}const cy=new Te(M.comparator),uy=new ve(M.comparator);function G(...n){let e=uy;for(const t of n)e=e.add(t);return e}const hy=new ve(z);function dy(){return hy}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Wa(n,e){if(n.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:ei(e)?"-0":e}}function qd(n){return{integerValue:""+n}}function fy(n,e){return Ug(e)?qd(e):Wa(n,e)}/**
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
 */class Oi{constructor(){this._=void 0}}function py(n,e,t){return n instanceof Js?function(r,i){const a={fields:{[wd]:{stringValue:vd},[Ad]:{timestampValue:{seconds:r.seconds,nanos:r.nanoseconds}}}};return i&&Ba(i)&&(i=Ni(i)),i&&(a.fields[Id]=i),{mapValue:a}}(t,e):n instanceof Zs?$d(n,e):n instanceof er?Wd(n,e):function(r,i){const a=jd(r,i),l=Su(a)+Su(r.Ae);return ta(a)&&ta(r.Ae)?qd(l):Wa(r.serializer,l)}(n,e)}function _y(n,e,t){return n instanceof Zs?$d(n,e):n instanceof er?Wd(n,e):t}function jd(n,e){return n instanceof si?function(s){return ta(s)||function(i){return!!i&&"doubleValue"in i}(s)}(e)?e:{integerValue:0}:null}class Js extends Oi{}class Zs extends Oi{constructor(e){super(),this.elements=e}}function $d(n,e){const t=zd(e);for(const s of n.elements)t.some(r=>mt(r,s))||t.push(s);return{arrayValue:{values:t}}}class er extends Oi{constructor(e){super(),this.elements=e}}function Wd(n,e){let t=zd(e);for(const s of n.elements)t=t.filter(r=>!mt(r,s));return{arrayValue:{values:t}}}class si extends Oi{constructor(e,t){super(),this.serializer=e,this.Ae=t}}function Su(n){return pe(n.integerValue||n.doubleValue)}function zd(n){return qa(n)&&n.arrayValue.values?n.arrayValue.values.slice():[]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class my{constructor(e,t){this.field=e,this.transform=t}}function gy(n,e){return n.field.isEqual(e.field)&&function(s,r){return s instanceof Zs&&r instanceof Zs||s instanceof er&&r instanceof er?jn(s.elements,r.elements,mt):s instanceof si&&r instanceof si?mt(s.Ae,r.Ae):s instanceof Js&&r instanceof Js}(n.transform,e.transform)}class yy{constructor(e,t){this.version=e,this.transformResults=t}}class je{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new je}static exists(e){return new je(void 0,e)}static updateTime(e){return new je(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function Gr(n,e){return n.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(n.updateTime):n.exists===void 0||n.exists===e.isFoundDocument()}class xi{}function Hd(n,e){if(!n.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return n.isNoDocument()?new Mi(n.key,je.none()):new ir(n.key,n.data,je.none());{const t=n.data,s=ze.empty();let r=new ve(be.comparator);for(let i of e.fields)if(!r.has(i)){let a=t.field(i);a===null&&i.length>1&&(i=i.popLast(),a=t.field(i)),a===null?s.delete(i):s.set(i,a),r=r.add(i)}return new Zt(n.key,s,new Xe(r.toArray()),je.none())}}function Ey(n,e,t){n instanceof ir?function(r,i,a){const l=r.value.clone(),u=Pu(r.fieldTransforms,i,a.transformResults);l.setAll(u),i.convertToFoundDocument(a.version,l).setHasCommittedMutations()}(n,e,t):n instanceof Zt?function(r,i,a){if(!Gr(r.precondition,i))return void i.convertToUnknownDocument(a.version);const l=Pu(r.fieldTransforms,i,a.transformResults),u=i.data;u.setAll(Gd(r)),u.setAll(l),i.convertToFoundDocument(a.version,u).setHasCommittedMutations()}(n,e,t):function(r,i,a){i.convertToNoDocument(a.version).setHasCommittedMutations()}(0,e,t)}function Fs(n,e,t,s){return n instanceof ir?function(i,a,l,u){if(!Gr(i.precondition,a))return l;const h=i.value.clone(),f=Nu(i.fieldTransforms,u,a);return h.setAll(f),a.convertToFoundDocument(a.version,h).setHasLocalMutations(),null}(n,e,t,s):n instanceof Zt?function(i,a,l,u){if(!Gr(i.precondition,a))return l;const h=Nu(i.fieldTransforms,u,a),f=a.data;return f.setAll(Gd(i)),f.setAll(h),a.convertToFoundDocument(a.version,f).setHasLocalMutations(),l===null?null:l.unionWith(i.fieldMask.fields).unionWith(i.fieldTransforms.map(p=>p.field))}(n,e,t,s):function(i,a,l){return Gr(i.precondition,a)?(a.convertToNoDocument(a.version).setHasLocalMutations(),null):l}(n,e,t)}function Ty(n,e){let t=null;for(const s of n.fieldTransforms){const r=e.data.field(s.field),i=jd(s.transform,r||null);i!=null&&(t===null&&(t=ze.empty()),t.set(s.field,i))}return t||null}function bu(n,e){return n.type===e.type&&!!n.key.isEqual(e.key)&&!!n.precondition.isEqual(e.precondition)&&!!function(s,r){return s===void 0&&r===void 0||!(!s||!r)&&jn(s,r,(i,a)=>gy(i,a))}(n.fieldTransforms,e.fieldTransforms)&&(n.type===0?n.value.isEqual(e.value):n.type!==1||n.data.isEqual(e.data)&&n.fieldMask.isEqual(e.fieldMask))}class ir extends xi{constructor(e,t,s,r=[]){super(),this.key=e,this.value=t,this.precondition=s,this.fieldTransforms=r,this.type=0}getFieldMask(){return null}}class Zt extends xi{constructor(e,t,s,r,i=[]){super(),this.key=e,this.data=t,this.fieldMask=s,this.precondition=r,this.fieldTransforms=i,this.type=1}getFieldMask(){return this.fieldMask}}function Gd(n){const e=new Map;return n.fieldMask.fields.forEach(t=>{if(!t.isEmpty()){const s=n.data.field(t);e.set(t,s)}}),e}function Pu(n,e,t){const s=new Map;J(n.length===t.length,32656,{Re:t.length,Ve:n.length});for(let r=0;r<t.length;r++){const i=n[r],a=i.transform,l=e.data.field(i.field);s.set(i.field,_y(a,l,t[r]))}return s}function Nu(n,e,t){const s=new Map;for(const r of n){const i=r.transform,a=t.data.field(r.field);s.set(r.field,py(i,a,e))}return s}class Mi extends xi{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class vy extends xi{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wy{constructor(e,t,s,r){this.batchId=e,this.localWriteTime=t,this.baseMutations=s,this.mutations=r}applyToRemoteDocument(e,t){const s=t.mutationResults;for(let r=0;r<this.mutations.length;r++){const i=this.mutations[r];i.key.isEqual(e.key)&&Ey(i,e,s[r])}}applyToLocalView(e,t){for(const s of this.baseMutations)s.key.isEqual(e.key)&&(t=Fs(s,e,t,this.localWriteTime));for(const s of this.mutations)s.key.isEqual(e.key)&&(t=Fs(s,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){const s=Bd();return this.mutations.forEach(r=>{const i=e.get(r.key),a=i.overlayedDocument;let l=this.applyToLocalView(a,i.mutatedFields);l=t.has(r.key)?null:l;const u=Hd(a,l);u!==null&&s.set(r.key,u),a.isValidDocument()||a.convertToNoDocument(j.min())}),s}keys(){return this.mutations.reduce((e,t)=>e.add(t.key),G())}isEqual(e){return this.batchId===e.batchId&&jn(this.mutations,e.mutations,(t,s)=>bu(t,s))&&jn(this.baseMutations,e.baseMutations,(t,s)=>bu(t,s))}}class za{constructor(e,t,s,r){this.batch=e,this.commitVersion=t,this.mutationResults=s,this.docVersions=r}static from(e,t,s){J(e.mutations.length===s.length,58842,{me:e.mutations.length,fe:s.length});let r=function(){return cy}();const i=e.mutations;for(let a=0;a<i.length;a++)r=r.insert(i[a].key,s[a].version);return new za(e,t,s,r)}}/**
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
 */class Iy{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
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
 */class Ay{constructor(e,t,s){this.alias=e,this.aggregateType=t,this.fieldPath=s}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ry{constructor(e,t){this.count=e,this.unchangedNames=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var me,Q;function Cy(n){switch(n){case b.OK:return F(64938);case b.CANCELLED:case b.UNKNOWN:case b.DEADLINE_EXCEEDED:case b.RESOURCE_EXHAUSTED:case b.INTERNAL:case b.UNAVAILABLE:case b.UNAUTHENTICATED:return!1;case b.INVALID_ARGUMENT:case b.NOT_FOUND:case b.ALREADY_EXISTS:case b.PERMISSION_DENIED:case b.FAILED_PRECONDITION:case b.ABORTED:case b.OUT_OF_RANGE:case b.UNIMPLEMENTED:case b.DATA_LOSS:return!0;default:return F(15467,{code:n})}}function Kd(n){if(n===void 0)return Ct("GRPC error has no .code"),b.UNKNOWN;switch(n){case me.OK:return b.OK;case me.CANCELLED:return b.CANCELLED;case me.UNKNOWN:return b.UNKNOWN;case me.DEADLINE_EXCEEDED:return b.DEADLINE_EXCEEDED;case me.RESOURCE_EXHAUSTED:return b.RESOURCE_EXHAUSTED;case me.INTERNAL:return b.INTERNAL;case me.UNAVAILABLE:return b.UNAVAILABLE;case me.UNAUTHENTICATED:return b.UNAUTHENTICATED;case me.INVALID_ARGUMENT:return b.INVALID_ARGUMENT;case me.NOT_FOUND:return b.NOT_FOUND;case me.ALREADY_EXISTS:return b.ALREADY_EXISTS;case me.PERMISSION_DENIED:return b.PERMISSION_DENIED;case me.FAILED_PRECONDITION:return b.FAILED_PRECONDITION;case me.ABORTED:return b.ABORTED;case me.OUT_OF_RANGE:return b.OUT_OF_RANGE;case me.UNIMPLEMENTED:return b.UNIMPLEMENTED;case me.DATA_LOSS:return b.DATA_LOSS;default:return F(39323,{code:n})}}(Q=me||(me={}))[Q.OK=0]="OK",Q[Q.CANCELLED=1]="CANCELLED",Q[Q.UNKNOWN=2]="UNKNOWN",Q[Q.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",Q[Q.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",Q[Q.NOT_FOUND=5]="NOT_FOUND",Q[Q.ALREADY_EXISTS=6]="ALREADY_EXISTS",Q[Q.PERMISSION_DENIED=7]="PERMISSION_DENIED",Q[Q.UNAUTHENTICATED=16]="UNAUTHENTICATED",Q[Q.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",Q[Q.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",Q[Q.ABORTED=10]="ABORTED",Q[Q.OUT_OF_RANGE=11]="OUT_OF_RANGE",Q[Q.UNIMPLEMENTED=12]="UNIMPLEMENTED",Q[Q.INTERNAL=13]="INTERNAL",Q[Q.UNAVAILABLE=14]="UNAVAILABLE",Q[Q.DATA_LOSS=15]="DATA_LOSS";/**
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
 */function Sy(){return new TextEncoder}/**
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
 */const by=new Ft([4294967295,4294967295],0);function ku(n){const e=Sy().encode(n),t=new ld;return t.update(e),new Uint8Array(t.digest())}function Du(n){const e=new DataView(n.buffer),t=e.getUint32(0,!0),s=e.getUint32(4,!0),r=e.getUint32(8,!0),i=e.getUint32(12,!0);return[new Ft([t,s],0),new Ft([r,i],0)]}class Ha{constructor(e,t,s){if(this.bitmap=e,this.padding=t,this.hashCount=s,t<0||t>=8)throw new Ds(`Invalid padding: ${t}`);if(s<0)throw new Ds(`Invalid hash count: ${s}`);if(e.length>0&&this.hashCount===0)throw new Ds(`Invalid hash count: ${s}`);if(e.length===0&&t!==0)throw new Ds(`Invalid padding when bitmap length is 0: ${t}`);this.ge=8*e.length-t,this.pe=Ft.fromNumber(this.ge)}ye(e,t,s){let r=e.add(t.multiply(Ft.fromNumber(s)));return r.compare(by)===1&&(r=new Ft([r.getBits(0),r.getBits(1)],0)),r.modulo(this.pe).toNumber()}we(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(this.ge===0)return!1;const t=ku(e),[s,r]=Du(t);for(let i=0;i<this.hashCount;i++){const a=this.ye(s,r,i);if(!this.we(a))return!1}return!0}static create(e,t,s){const r=e%8==0?0:8-e%8,i=new Uint8Array(Math.ceil(e/8)),a=new Ha(i,r,t);return s.forEach(l=>a.insert(l)),a}insert(e){if(this.ge===0)return;const t=ku(e),[s,r]=Du(t);for(let i=0;i<this.hashCount;i++){const a=this.ye(s,r,i);this.Se(a)}}Se(e){const t=Math.floor(e/8),s=e%8;this.bitmap[t]|=1<<s}}class Ds extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Li{constructor(e,t,s,r,i){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=s,this.documentUpdates=r,this.resolvedLimboDocuments=i}static createSynthesizedRemoteEventForCurrentChange(e,t,s){const r=new Map;return r.set(e,or.createSynthesizedTargetChangeForCurrentChange(e,t,s)),new Li(j.min(),r,new Te(z),St(),G())}}class or{constructor(e,t,s,r,i){this.resumeToken=e,this.current=t,this.addedDocuments=s,this.modifiedDocuments=r,this.removedDocuments=i}static createSynthesizedTargetChangeForCurrentChange(e,t,s){return new or(s,t,G(),G(),G())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kr{constructor(e,t,s,r){this.be=e,this.removedTargetIds=t,this.key=s,this.De=r}}class Qd{constructor(e,t){this.targetId=e,this.Ce=t}}class Yd{constructor(e,t,s=Ne.EMPTY_BYTE_STRING,r=null){this.state=e,this.targetIds=t,this.resumeToken=s,this.cause=r}}class Vu{constructor(){this.ve=0,this.Fe=Ou(),this.Me=Ne.EMPTY_BYTE_STRING,this.xe=!1,this.Oe=!0}get current(){return this.xe}get resumeToken(){return this.Me}get Ne(){return this.ve!==0}get Be(){return this.Oe}Le(e){e.approximateByteSize()>0&&(this.Oe=!0,this.Me=e)}ke(){let e=G(),t=G(),s=G();return this.Fe.forEach((r,i)=>{switch(i){case 0:e=e.add(r);break;case 2:t=t.add(r);break;case 1:s=s.add(r);break;default:F(38017,{changeType:i})}}),new or(this.Me,this.xe,e,t,s)}qe(){this.Oe=!1,this.Fe=Ou()}Qe(e,t){this.Oe=!0,this.Fe=this.Fe.insert(e,t)}$e(e){this.Oe=!0,this.Fe=this.Fe.remove(e)}Ue(){this.ve+=1}Ke(){this.ve-=1,J(this.ve>=0,3241,{ve:this.ve})}We(){this.Oe=!0,this.xe=!0}}class Py{constructor(e){this.Ge=e,this.ze=new Map,this.je=St(),this.Je=Fr(),this.He=Fr(),this.Ye=new Te(z)}Ze(e){for(const t of e.be)e.De&&e.De.isFoundDocument()?this.Xe(t,e.De):this.et(t,e.key,e.De);for(const t of e.removedTargetIds)this.et(t,e.key,e.De)}tt(e){this.forEachTarget(e,t=>{const s=this.nt(t);switch(e.state){case 0:this.rt(t)&&s.Le(e.resumeToken);break;case 1:s.Ke(),s.Ne||s.qe(),s.Le(e.resumeToken);break;case 2:s.Ke(),s.Ne||this.removeTarget(t);break;case 3:this.rt(t)&&(s.We(),s.Le(e.resumeToken));break;case 4:this.rt(t)&&(this.it(t),s.Le(e.resumeToken));break;default:F(56790,{state:e.state})}})}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.ze.forEach((s,r)=>{this.rt(r)&&t(r)})}st(e){const t=e.targetId,s=e.Ce.count,r=this.ot(t);if(r){const i=r.target;if(sa(i))if(s===0){const a=new M(i.path);this.et(t,a,Le.newNoDocument(a,j.min()))}else J(s===1,20013,{expectedCount:s});else{const a=this._t(t);if(a!==s){const l=this.ut(e),u=l?this.ct(l,e,a):1;if(u!==0){this.it(t);const h=u===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Ye=this.Ye.insert(t,h)}}}}}ut(e){const t=e.Ce.unchangedNames;if(!t||!t.bits)return null;const{bits:{bitmap:s="",padding:r=0},hashCount:i=0}=t;let a,l;try{a=zt(s).toUint8Array()}catch(u){if(u instanceof Td)return qn("Decoding the base64 bloom filter in existence filter failed ("+u.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw u}try{l=new Ha(a,r,i)}catch(u){return qn(u instanceof Ds?"BloomFilter error: ":"Applying bloom filter failed: ",u),null}return l.ge===0?null:l}ct(e,t,s){return t.Ce.count===s-this.Pt(e,t.targetId)?0:2}Pt(e,t){const s=this.Ge.getRemoteKeysForTarget(t);let r=0;return s.forEach(i=>{const a=this.Ge.ht(),l=`projects/${a.projectId}/databases/${a.database}/documents/${i.path.canonicalString()}`;e.mightContain(l)||(this.et(t,i,null),r++)}),r}Tt(e){const t=new Map;this.ze.forEach((i,a)=>{const l=this.ot(a);if(l){if(i.current&&sa(l.target)){const u=new M(l.target.path);this.It(u).has(a)||this.Et(a,u)||this.et(a,u,Le.newNoDocument(u,e))}i.Be&&(t.set(a,i.ke()),i.qe())}});let s=G();this.He.forEach((i,a)=>{let l=!0;a.forEachWhile(u=>{const h=this.ot(u);return!h||h.purpose==="TargetPurposeLimboResolution"||(l=!1,!1)}),l&&(s=s.add(i))}),this.je.forEach((i,a)=>a.setReadTime(e));const r=new Li(e,t,this.Ye,this.je,s);return this.je=St(),this.Je=Fr(),this.He=Fr(),this.Ye=new Te(z),r}Xe(e,t){if(!this.rt(e))return;const s=this.Et(e,t.key)?2:0;this.nt(e).Qe(t.key,s),this.je=this.je.insert(t.key,t),this.Je=this.Je.insert(t.key,this.It(t.key).add(e)),this.He=this.He.insert(t.key,this.dt(t.key).add(e))}et(e,t,s){if(!this.rt(e))return;const r=this.nt(e);this.Et(e,t)?r.Qe(t,1):r.$e(t),this.He=this.He.insert(t,this.dt(t).delete(e)),this.He=this.He.insert(t,this.dt(t).add(e)),s&&(this.je=this.je.insert(t,s))}removeTarget(e){this.ze.delete(e)}_t(e){const t=this.nt(e).ke();return this.Ge.getRemoteKeysForTarget(e).size+t.addedDocuments.size-t.removedDocuments.size}Ue(e){this.nt(e).Ue()}nt(e){let t=this.ze.get(e);return t||(t=new Vu,this.ze.set(e,t)),t}dt(e){let t=this.He.get(e);return t||(t=new ve(z),this.He=this.He.insert(e,t)),t}It(e){let t=this.Je.get(e);return t||(t=new ve(z),this.Je=this.Je.insert(e,t)),t}rt(e){const t=this.ot(e)!==null;return t||x("WatchChangeAggregator","Detected inactive target",e),t}ot(e){const t=this.ze.get(e);return t&&t.Ne?null:this.Ge.At(e)}it(e){this.ze.set(e,new Vu),this.Ge.getRemoteKeysForTarget(e).forEach(t=>{this.et(e,t,null)})}Et(e,t){return this.Ge.getRemoteKeysForTarget(e).has(t)}}function Fr(){return new Te(M.comparator)}function Ou(){return new Te(M.comparator)}const Ny={asc:"ASCENDING",desc:"DESCENDING"},ky={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},Dy={and:"AND",or:"OR"};class Vy{constructor(e,t){this.databaseId=e,this.useProto3Json=t}}function oa(n,e){return n.useProto3Json||Pi(e)?e:{value:e}}function ri(n,e){return n.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function Xd(n,e){return n.useProto3Json?e.toBase64():e.toUint8Array()}function Oy(n,e){return ri(n,e.toTimestamp())}function ft(n){return J(!!n,49232),j.fromTimestamp(function(t){const s=Wt(t);return new le(s.seconds,s.nanos)}(n))}function Ga(n,e){return aa(n,e).canonicalString()}function aa(n,e){const t=function(r){return new re(["projects",r.projectId,"databases",r.database])}(n).child("documents");return e===void 0?t:t.child(e)}function Jd(n){const e=re.fromString(n);return J(rf(e),10190,{key:e.toString()}),e}function la(n,e){return Ga(n.databaseId,e.path)}function No(n,e){const t=Jd(e);if(t.get(1)!==n.databaseId.projectId)throw new O(b.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+t.get(1)+" vs "+n.databaseId.projectId);if(t.get(3)!==n.databaseId.database)throw new O(b.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+t.get(3)+" vs "+n.databaseId.database);return new M(ef(t))}function Zd(n,e){return Ga(n.databaseId,e)}function xy(n){const e=Jd(n);return e.length===4?re.emptyPath():ef(e)}function ca(n){return new re(["projects",n.databaseId.projectId,"databases",n.databaseId.database]).canonicalString()}function ef(n){return J(n.length>4&&n.get(4)==="documents",29091,{key:n.toString()}),n.popFirst(5)}function xu(n,e,t){return{name:la(n,e),fields:t.value.mapValue.fields}}function My(n,e){let t;if("targetChange"in e){e.targetChange;const s=function(h){return h==="NO_CHANGE"?0:h==="ADD"?1:h==="REMOVE"?2:h==="CURRENT"?3:h==="RESET"?4:F(39313,{state:h})}(e.targetChange.targetChangeType||"NO_CHANGE"),r=e.targetChange.targetIds||[],i=function(h,f){return h.useProto3Json?(J(f===void 0||typeof f=="string",58123),Ne.fromBase64String(f||"")):(J(f===void 0||f instanceof Buffer||f instanceof Uint8Array,16193),Ne.fromUint8Array(f||new Uint8Array))}(n,e.targetChange.resumeToken),a=e.targetChange.cause,l=a&&function(h){const f=h.code===void 0?b.UNKNOWN:Kd(h.code);return new O(f,h.message||"")}(a);t=new Yd(s,r,i,l||null)}else if("documentChange"in e){e.documentChange;const s=e.documentChange;s.document,s.document.name,s.document.updateTime;const r=No(n,s.document.name),i=ft(s.document.updateTime),a=s.document.createTime?ft(s.document.createTime):j.min(),l=new ze({mapValue:{fields:s.document.fields}}),u=Le.newFoundDocument(r,i,a,l),h=s.targetIds||[],f=s.removedTargetIds||[];t=new Kr(h,f,u.key,u)}else if("documentDelete"in e){e.documentDelete;const s=e.documentDelete;s.document;const r=No(n,s.document),i=s.readTime?ft(s.readTime):j.min(),a=Le.newNoDocument(r,i),l=s.removedTargetIds||[];t=new Kr([],l,a.key,a)}else if("documentRemove"in e){e.documentRemove;const s=e.documentRemove;s.document;const r=No(n,s.document),i=s.removedTargetIds||[];t=new Kr([],i,r,null)}else{if(!("filter"in e))return F(11601,{Rt:e});{e.filter;const s=e.filter;s.targetId;const{count:r=0,unchangedNames:i}=s,a=new Ry(r,i),l=s.targetId;t=new Qd(l,a)}}return t}function Ly(n,e){let t;if(e instanceof ir)t={update:xu(n,e.key,e.value)};else if(e instanceof Mi)t={delete:la(n,e.key)};else if(e instanceof Zt)t={update:xu(n,e.key,e.data),updateMask:Hy(e.fieldMask)};else{if(!(e instanceof vy))return F(16599,{Vt:e.type});t={verify:la(n,e.key)}}return e.fieldTransforms.length>0&&(t.updateTransforms=e.fieldTransforms.map(s=>function(i,a){const l=a.transform;if(l instanceof Js)return{fieldPath:a.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(l instanceof Zs)return{fieldPath:a.field.canonicalString(),appendMissingElements:{values:l.elements}};if(l instanceof er)return{fieldPath:a.field.canonicalString(),removeAllFromArray:{values:l.elements}};if(l instanceof si)return{fieldPath:a.field.canonicalString(),increment:l.Ae};throw F(20930,{transform:a.transform})}(0,s))),e.precondition.isNone||(t.currentDocument=function(r,i){return i.updateTime!==void 0?{updateTime:Oy(r,i.updateTime)}:i.exists!==void 0?{exists:i.exists}:F(27497)}(n,e.precondition)),t}function Fy(n,e){return n&&n.length>0?(J(e!==void 0,14353),n.map(t=>function(r,i){let a=r.updateTime?ft(r.updateTime):ft(i);return a.isEqual(j.min())&&(a=ft(i)),new yy(a,r.transformResults||[])}(t,e))):[]}function Uy(n,e){return{documents:[Zd(n,e.path)]}}function tf(n,e){const t={structuredQuery:{}},s=e.path;let r;e.collectionGroup!==null?(r=s,t.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(r=s.popLast(),t.structuredQuery.from=[{collectionId:s.lastSegment()}]),t.parent=Zd(n,r);const i=function(h){if(h.length!==0)return sf(ot.create(h,"and"))}(e.filters);i&&(t.structuredQuery.where=i);const a=function(h){if(h.length!==0)return h.map(f=>function(m){return{field:Ot(m.field),direction:$y(m.dir)}}(f))}(e.orderBy);a&&(t.structuredQuery.orderBy=a);const l=oa(n,e.limit);return l!==null&&(t.structuredQuery.limit=l),e.startAt&&(t.structuredQuery.startAt=function(h){return{before:h.inclusive,values:h.position}}(e.startAt)),e.endAt&&(t.structuredQuery.endAt=function(h){return{before:!h.inclusive,values:h.position}}(e.endAt)),{ft:t,parent:r}}function By(n,e,t,s){const{ft:r,parent:i}=tf(n,e),a={},l=[];let u=0;return t.forEach(h=>{const f="aggregate_"+u++;a[f]=h.alias,h.aggregateType==="count"?l.push({alias:f,count:{}}):h.aggregateType==="avg"?l.push({alias:f,avg:{field:Ot(h.fieldPath)}}):h.aggregateType==="sum"&&l.push({alias:f,sum:{field:Ot(h.fieldPath)}})}),{request:{structuredAggregationQuery:{aggregations:l,structuredQuery:r.structuredQuery},parent:r.parent},gt:a,parent:i}}function qy(n){let e=xy(n.parent);const t=n.structuredQuery,s=t.from?t.from.length:0;let r=null;if(s>0){J(s===1,65062);const f=t.from[0];f.allDescendants?r=f.collectionId:e=e.child(f.collectionId)}let i=[];t.where&&(i=function(p){const m=nf(p);return m instanceof ot&&Nd(m)?m.getFilters():[m]}(t.where));let a=[];t.orderBy&&(a=function(p){return p.map(m=>function(C){return new Xs(Vn(C.field),function(N){switch(N){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(C.direction))}(m))}(t.orderBy));let l=null;t.limit&&(l=function(p){let m;return m=typeof p=="object"?p.value:p,Pi(m)?null:m}(t.limit));let u=null;t.startAt&&(u=function(p){const m=!!p.before,I=p.values||[];return new ni(I,m)}(t.startAt));let h=null;return t.endAt&&(h=function(p){const m=!p.before,I=p.values||[];return new ni(I,m)}(t.endAt)),ry(e,r,a,i,l,"F",u,h)}function jy(n,e){const t=function(r){switch(r){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return F(28987,{purpose:r})}}(e.purpose);return t==null?null:{"goog-listen-tags":t}}function nf(n){return n.unaryFilter!==void 0?function(t){switch(t.unaryFilter.op){case"IS_NAN":const s=Vn(t.unaryFilter.field);return ye.create(s,"==",{doubleValue:NaN});case"IS_NULL":const r=Vn(t.unaryFilter.field);return ye.create(r,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const i=Vn(t.unaryFilter.field);return ye.create(i,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const a=Vn(t.unaryFilter.field);return ye.create(a,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return F(61313);default:return F(60726)}}(n):n.fieldFilter!==void 0?function(t){return ye.create(Vn(t.fieldFilter.field),function(r){switch(r){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return F(58110);default:return F(50506)}}(t.fieldFilter.op),t.fieldFilter.value)}(n):n.compositeFilter!==void 0?function(t){return ot.create(t.compositeFilter.filters.map(s=>nf(s)),function(r){switch(r){case"AND":return"and";case"OR":return"or";default:return F(1026)}}(t.compositeFilter.op))}(n):F(30097,{filter:n})}function $y(n){return Ny[n]}function Wy(n){return ky[n]}function zy(n){return Dy[n]}function Ot(n){return{fieldPath:n.canonicalString()}}function Vn(n){return be.fromServerFormat(n.fieldPath)}function sf(n){return n instanceof ye?function(t){if(t.op==="=="){if(wu(t.value))return{unaryFilter:{field:Ot(t.field),op:"IS_NAN"}};if(vu(t.value))return{unaryFilter:{field:Ot(t.field),op:"IS_NULL"}}}else if(t.op==="!="){if(wu(t.value))return{unaryFilter:{field:Ot(t.field),op:"IS_NOT_NAN"}};if(vu(t.value))return{unaryFilter:{field:Ot(t.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:Ot(t.field),op:Wy(t.op),value:t.value}}}(n):n instanceof ot?function(t){const s=t.getFilters().map(r=>sf(r));return s.length===1?s[0]:{compositeFilter:{op:zy(t.op),filters:s}}}(n):F(54877,{filter:n})}function Hy(n){const e=[];return n.fields.forEach(t=>e.push(t.canonicalString())),{fieldPaths:e}}function rf(n){return n.length>=4&&n.get(0)==="projects"&&n.get(2)==="databases"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mt{constructor(e,t,s,r,i=j.min(),a=j.min(),l=Ne.EMPTY_BYTE_STRING,u=null){this.target=e,this.targetId=t,this.purpose=s,this.sequenceNumber=r,this.snapshotVersion=i,this.lastLimboFreeSnapshotVersion=a,this.resumeToken=l,this.expectedCount=u}withSequenceNumber(e){return new Mt(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new Mt(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new Mt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new Mt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gy{constructor(e){this.yt=e}}function Ky(n){const e=qy({parent:n.parent,structuredQuery:n.structuredQuery});return n.limitType==="LAST"?ia(e,e.limit,"L"):e}/**
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
 */class Qy{constructor(){this.Cn=new Yy}addToCollectionParentIndex(e,t){return this.Cn.add(t),P.resolve()}getCollectionParents(e,t){return P.resolve(this.Cn.getEntries(t))}addFieldIndex(e,t){return P.resolve()}deleteFieldIndex(e,t){return P.resolve()}deleteAllFieldIndexes(e){return P.resolve()}createTargetIndexes(e,t){return P.resolve()}getDocumentsMatchingTarget(e,t){return P.resolve(null)}getIndexType(e,t){return P.resolve(0)}getFieldIndexes(e,t){return P.resolve([])}getNextCollectionGroupToUpdate(e){return P.resolve(null)}getMinOffset(e,t){return P.resolve($t.min())}getMinOffsetFromCollectionGroup(e,t){return P.resolve($t.min())}updateCollectionGroup(e,t,s){return P.resolve()}updateIndexEntries(e,t){return P.resolve()}}class Yy{constructor(){this.index={}}add(e){const t=e.lastSegment(),s=e.popLast(),r=this.index[t]||new ve(re.comparator),i=!r.has(s);return this.index[t]=r.add(s),i}has(e){const t=e.lastSegment(),s=e.popLast(),r=this.index[t];return r&&r.has(s)}getEntries(e){return(this.index[e]||new ve(re.comparator)).toArray()}}/**
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
 */const Mu={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},of=41943040;class We{static withCacheSize(e){return new We(e,We.DEFAULT_COLLECTION_PERCENTILE,We.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,t,s){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=s}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */We.DEFAULT_COLLECTION_PERCENTILE=10,We.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,We.DEFAULT=new We(of,We.DEFAULT_COLLECTION_PERCENTILE,We.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),We.DISABLED=new We(-1,0,0);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zn{constructor(e){this.ar=e}next(){return this.ar+=2,this.ar}static ur(){return new zn(0)}static cr(){return new zn(-1)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Lu="LruGarbageCollector",Xy=1048576;function Fu([n,e],[t,s]){const r=z(n,t);return r===0?z(e,s):r}class Jy{constructor(e){this.Ir=e,this.buffer=new ve(Fu),this.Er=0}dr(){return++this.Er}Ar(e){const t=[e,this.dr()];if(this.buffer.size<this.Ir)this.buffer=this.buffer.add(t);else{const s=this.buffer.last();Fu(t,s)<0&&(this.buffer=this.buffer.delete(s).add(t))}}get maxValue(){return this.buffer.last()[0]}}class Zy{constructor(e,t,s){this.garbageCollector=e,this.asyncQueue=t,this.localStore=s,this.Rr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.Vr(6e4)}stop(){this.Rr&&(this.Rr.cancel(),this.Rr=null)}get started(){return this.Rr!==null}Vr(e){x(Lu,`Garbage collection scheduled in ${e}ms`),this.Rr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,async()=>{this.Rr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(t){es(t)?x(Lu,"Ignoring IndexedDB error during garbage collection: ",t):await Zn(t)}await this.Vr(3e5)})}}class eE{constructor(e,t){this.mr=e,this.params=t}calculateTargetCount(e,t){return this.mr.gr(e).next(s=>Math.floor(t/100*s))}nthSequenceNumber(e,t){if(t===0)return P.resolve(bi.ce);const s=new Jy(t);return this.mr.forEachTarget(e,r=>s.Ar(r.sequenceNumber)).next(()=>this.mr.pr(e,r=>s.Ar(r))).next(()=>s.maxValue)}removeTargets(e,t,s){return this.mr.removeTargets(e,t,s)}removeOrphanedDocuments(e,t){return this.mr.removeOrphanedDocuments(e,t)}collect(e,t){return this.params.cacheSizeCollectionThreshold===-1?(x("LruGarbageCollector","Garbage collection skipped; disabled"),P.resolve(Mu)):this.getCacheSize(e).next(s=>s<this.params.cacheSizeCollectionThreshold?(x("LruGarbageCollector",`Garbage collection skipped; Cache size ${s} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),Mu):this.yr(e,t))}getCacheSize(e){return this.mr.getCacheSize(e)}yr(e,t){let s,r,i,a,l,u,h;const f=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next(p=>(p>this.params.maximumSequenceNumbersToCollect?(x("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${p}`),r=this.params.maximumSequenceNumbersToCollect):r=p,a=Date.now(),this.nthSequenceNumber(e,r))).next(p=>(s=p,l=Date.now(),this.removeTargets(e,s,t))).next(p=>(i=p,u=Date.now(),this.removeOrphanedDocuments(e,s))).next(p=>(h=Date.now(),kn()<=K.DEBUG&&x("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${a-f}ms
	Determined least recently used ${r} in `+(l-a)+`ms
	Removed ${i} targets in `+(u-l)+`ms
	Removed ${p} documents in `+(h-u)+`ms
Total Duration: ${h-f}ms`),P.resolve({didRun:!0,sequenceNumbersCollected:r,targetsRemoved:i,documentsRemoved:p})))}}function tE(n,e){return new eE(n,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nE{constructor(){this.changes=new vn(e=>e.toString(),(e,t)=>e.isEqual(t)),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,Le.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();const s=this.changes.get(t);return s!==void 0?P.resolve(s):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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
 */class sE{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rE{constructor(e,t,s,r){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=s,this.indexManager=r}getDocument(e,t){let s=null;return this.documentOverlayCache.getOverlay(e,t).next(r=>(s=r,this.remoteDocumentCache.getEntry(e,t))).next(r=>(s!==null&&Fs(s.mutation,r,Xe.empty(),le.now()),r))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next(s=>this.getLocalViewOfDocuments(e,s,G()).next(()=>s))}getLocalViewOfDocuments(e,t,s=G()){const r=ln();return this.populateOverlays(e,r,t).next(()=>this.computeViews(e,t,r,s).next(i=>{let a=ks();return i.forEach((l,u)=>{a=a.insert(l,u.overlayedDocument)}),a}))}getOverlayedDocuments(e,t){const s=ln();return this.populateOverlays(e,s,t).next(()=>this.computeViews(e,t,s,G()))}populateOverlays(e,t,s){const r=[];return s.forEach(i=>{t.has(i)||r.push(i)}),this.documentOverlayCache.getOverlays(e,r).next(i=>{i.forEach((a,l)=>{t.set(a,l)})})}computeViews(e,t,s,r){let i=St();const a=Ls(),l=function(){return Ls()}();return t.forEach((u,h)=>{const f=s.get(h.key);r.has(h.key)&&(f===void 0||f.mutation instanceof Zt)?i=i.insert(h.key,h):f!==void 0?(a.set(h.key,f.mutation.getFieldMask()),Fs(f.mutation,h,f.mutation.getFieldMask(),le.now())):a.set(h.key,Xe.empty())}),this.recalculateAndSaveOverlays(e,i).next(u=>(u.forEach((h,f)=>a.set(h,f)),t.forEach((h,f)=>l.set(h,new sE(f,a.get(h)??null))),l))}recalculateAndSaveOverlays(e,t){const s=Ls();let r=new Te((a,l)=>a-l),i=G();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next(a=>{for(const l of a)l.keys().forEach(u=>{const h=t.get(u);if(h===null)return;let f=s.get(u)||Xe.empty();f=l.applyToLocalView(h,f),s.set(u,f);const p=(r.get(l.batchId)||G()).add(u);r=r.insert(l.batchId,p)})}).next(()=>{const a=[],l=r.getReverseIterator();for(;l.hasNext();){const u=l.getNext(),h=u.key,f=u.value,p=Bd();f.forEach(m=>{if(!i.has(m)){const I=Hd(t.get(m),s.get(m));I!==null&&p.set(m,I),i=i.add(m)}}),a.push(this.documentOverlayCache.saveOverlays(e,h,p))}return P.waitFor(a)}).next(()=>s)}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next(s=>this.recalculateAndSaveOverlays(e,s))}getDocumentsMatchingQuery(e,t,s,r){return function(a){return M.isDocumentKey(a.path)&&a.collectionGroup===null&&a.filters.length===0}(t)?this.getDocumentsMatchingDocumentQuery(e,t.path):Od(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,s,r):this.getDocumentsMatchingCollectionQuery(e,t,s,r)}getNextDocuments(e,t,s,r){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,s,r).next(i=>{const a=r-i.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,s.largestBatchId,r-i.size):P.resolve(ln());let l=Gs,u=i;return a.next(h=>P.forEach(h,(f,p)=>(l<p.largestBatchId&&(l=p.largestBatchId),i.get(f)?P.resolve():this.remoteDocumentCache.getEntry(e,f).next(m=>{u=u.insert(f,m)}))).next(()=>this.populateOverlays(e,h,i)).next(()=>this.computeViews(e,u,h,G())).next(f=>({batchId:l,changes:Ud(f)})))})}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new M(t)).next(s=>{let r=ks();return s.isFoundDocument()&&(r=r.insert(s.key,s)),r})}getDocumentsMatchingCollectionGroupQuery(e,t,s,r){const i=t.collectionGroup;let a=ks();return this.indexManager.getCollectionParents(e,i).next(l=>P.forEach(l,u=>{const h=function(p,m){return new ts(m,null,p.explicitOrderBy.slice(),p.filters.slice(),p.limit,p.limitType,p.startAt,p.endAt)}(t,u.child(i));return this.getDocumentsMatchingCollectionQuery(e,h,s,r).next(f=>{f.forEach((p,m)=>{a=a.insert(p,m)})})}).next(()=>a))}getDocumentsMatchingCollectionQuery(e,t,s,r){let i;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,s.largestBatchId).next(a=>(i=a,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,s,i,r))).next(a=>{i.forEach((u,h)=>{const f=h.getKey();a.get(f)===null&&(a=a.insert(f,Le.newInvalidDocument(f)))});let l=ks();return a.forEach((u,h)=>{const f=i.get(u);f!==void 0&&Fs(f.mutation,h,Xe.empty(),le.now()),Vi(t,h)&&(l=l.insert(u,h))}),l})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class iE{constructor(e){this.serializer=e,this.Lr=new Map,this.kr=new Map}getBundleMetadata(e,t){return P.resolve(this.Lr.get(t))}saveBundleMetadata(e,t){return this.Lr.set(t.id,function(r){return{id:r.id,version:r.version,createTime:ft(r.createTime)}}(t)),P.resolve()}getNamedQuery(e,t){return P.resolve(this.kr.get(t))}saveNamedQuery(e,t){return this.kr.set(t.name,function(r){return{name:r.name,query:Ky(r.bundledQuery),readTime:ft(r.readTime)}}(t)),P.resolve()}}/**
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
 */class oE{constructor(){this.overlays=new Te(M.comparator),this.qr=new Map}getOverlay(e,t){return P.resolve(this.overlays.get(t))}getOverlays(e,t){const s=ln();return P.forEach(t,r=>this.getOverlay(e,r).next(i=>{i!==null&&s.set(r,i)})).next(()=>s)}saveOverlays(e,t,s){return s.forEach((r,i)=>{this.St(e,t,i)}),P.resolve()}removeOverlaysForBatchId(e,t,s){const r=this.qr.get(s);return r!==void 0&&(r.forEach(i=>this.overlays=this.overlays.remove(i)),this.qr.delete(s)),P.resolve()}getOverlaysForCollection(e,t,s){const r=ln(),i=t.length+1,a=new M(t.child("")),l=this.overlays.getIteratorFrom(a);for(;l.hasNext();){const u=l.getNext().value,h=u.getKey();if(!t.isPrefixOf(h.path))break;h.path.length===i&&u.largestBatchId>s&&r.set(u.getKey(),u)}return P.resolve(r)}getOverlaysForCollectionGroup(e,t,s,r){let i=new Te((h,f)=>h-f);const a=this.overlays.getIterator();for(;a.hasNext();){const h=a.getNext().value;if(h.getKey().getCollectionGroup()===t&&h.largestBatchId>s){let f=i.get(h.largestBatchId);f===null&&(f=ln(),i=i.insert(h.largestBatchId,f)),f.set(h.getKey(),h)}}const l=ln(),u=i.getIterator();for(;u.hasNext()&&(u.getNext().value.forEach((h,f)=>l.set(h,f)),!(l.size()>=r)););return P.resolve(l)}St(e,t,s){const r=this.overlays.get(s.key);if(r!==null){const a=this.qr.get(r.largestBatchId).delete(s.key);this.qr.set(r.largestBatchId,a)}this.overlays=this.overlays.insert(s.key,new Iy(t,s));let i=this.qr.get(t);i===void 0&&(i=G(),this.qr.set(t,i)),this.qr.set(t,i.add(s.key))}}/**
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
 */class aE{constructor(){this.sessionToken=Ne.EMPTY_BYTE_STRING}getSessionToken(e){return P.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,P.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ka{constructor(){this.Qr=new ve(Ie.$r),this.Ur=new ve(Ie.Kr)}isEmpty(){return this.Qr.isEmpty()}addReference(e,t){const s=new Ie(e,t);this.Qr=this.Qr.add(s),this.Ur=this.Ur.add(s)}Wr(e,t){e.forEach(s=>this.addReference(s,t))}removeReference(e,t){this.Gr(new Ie(e,t))}zr(e,t){e.forEach(s=>this.removeReference(s,t))}jr(e){const t=new M(new re([])),s=new Ie(t,e),r=new Ie(t,e+1),i=[];return this.Ur.forEachInRange([s,r],a=>{this.Gr(a),i.push(a.key)}),i}Jr(){this.Qr.forEach(e=>this.Gr(e))}Gr(e){this.Qr=this.Qr.delete(e),this.Ur=this.Ur.delete(e)}Hr(e){const t=new M(new re([])),s=new Ie(t,e),r=new Ie(t,e+1);let i=G();return this.Ur.forEachInRange([s,r],a=>{i=i.add(a.key)}),i}containsKey(e){const t=new Ie(e,0),s=this.Qr.firstAfterOrEqual(t);return s!==null&&e.isEqual(s.key)}}class Ie{constructor(e,t){this.key=e,this.Yr=t}static $r(e,t){return M.comparator(e.key,t.key)||z(e.Yr,t.Yr)}static Kr(e,t){return z(e.Yr,t.Yr)||M.comparator(e.key,t.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lE{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.tr=1,this.Zr=new ve(Ie.$r)}checkEmpty(e){return P.resolve(this.mutationQueue.length===0)}addMutationBatch(e,t,s,r){const i=this.tr;this.tr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const a=new wy(i,t,s,r);this.mutationQueue.push(a);for(const l of r)this.Zr=this.Zr.add(new Ie(l.key,i)),this.indexManager.addToCollectionParentIndex(e,l.key.path.popLast());return P.resolve(a)}lookupMutationBatch(e,t){return P.resolve(this.Xr(t))}getNextMutationBatchAfterBatchId(e,t){const s=t+1,r=this.ei(s),i=r<0?0:r;return P.resolve(this.mutationQueue.length>i?this.mutationQueue[i]:null)}getHighestUnacknowledgedBatchId(){return P.resolve(this.mutationQueue.length===0?Ua:this.tr-1)}getAllMutationBatches(e){return P.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){const s=new Ie(t,0),r=new Ie(t,Number.POSITIVE_INFINITY),i=[];return this.Zr.forEachInRange([s,r],a=>{const l=this.Xr(a.Yr);i.push(l)}),P.resolve(i)}getAllMutationBatchesAffectingDocumentKeys(e,t){let s=new ve(z);return t.forEach(r=>{const i=new Ie(r,0),a=new Ie(r,Number.POSITIVE_INFINITY);this.Zr.forEachInRange([i,a],l=>{s=s.add(l.Yr)})}),P.resolve(this.ti(s))}getAllMutationBatchesAffectingQuery(e,t){const s=t.path,r=s.length+1;let i=s;M.isDocumentKey(i)||(i=i.child(""));const a=new Ie(new M(i),0);let l=new ve(z);return this.Zr.forEachWhile(u=>{const h=u.key.path;return!!s.isPrefixOf(h)&&(h.length===r&&(l=l.add(u.Yr)),!0)},a),P.resolve(this.ti(l))}ti(e){const t=[];return e.forEach(s=>{const r=this.Xr(s);r!==null&&t.push(r)}),t}removeMutationBatch(e,t){J(this.ni(t.batchId,"removed")===0,55003),this.mutationQueue.shift();let s=this.Zr;return P.forEach(t.mutations,r=>{const i=new Ie(r.key,t.batchId);return s=s.delete(i),this.referenceDelegate.markPotentiallyOrphaned(e,r.key)}).next(()=>{this.Zr=s})}ir(e){}containsKey(e,t){const s=new Ie(t,0),r=this.Zr.firstAfterOrEqual(s);return P.resolve(t.isEqual(r&&r.key))}performConsistencyCheck(e){return this.mutationQueue.length,P.resolve()}ni(e,t){return this.ei(e)}ei(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}Xr(e){const t=this.ei(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cE{constructor(e){this.ri=e,this.docs=function(){return new Te(M.comparator)}(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){const s=t.key,r=this.docs.get(s),i=r?r.size:0,a=this.ri(t);return this.docs=this.docs.insert(s,{document:t.mutableCopy(),size:a}),this.size+=a-i,this.indexManager.addToCollectionParentIndex(e,s.path.popLast())}removeEntry(e){const t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){const s=this.docs.get(t);return P.resolve(s?s.document.mutableCopy():Le.newInvalidDocument(t))}getEntries(e,t){let s=St();return t.forEach(r=>{const i=this.docs.get(r);s=s.insert(r,i?i.document.mutableCopy():Le.newInvalidDocument(r))}),P.resolve(s)}getDocumentsMatchingQuery(e,t,s,r){let i=St();const a=t.path,l=new M(a.child("__id-9223372036854775808__")),u=this.docs.getIteratorFrom(l);for(;u.hasNext();){const{key:h,value:{document:f}}=u.getNext();if(!a.isPrefixOf(h.path))break;h.path.length>a.length+1||xg(Og(f),s)<=0||(r.has(f.key)||Vi(t,f))&&(i=i.insert(f.key,f.mutableCopy()))}return P.resolve(i)}getAllFromCollectionGroup(e,t,s,r){F(9500)}ii(e,t){return P.forEach(this.docs,s=>t(s))}newChangeBuffer(e){return new uE(this)}getSize(e){return P.resolve(this.size)}}class uE extends nE{constructor(e){super(),this.Nr=e}applyChanges(e){const t=[];return this.changes.forEach((s,r)=>{r.isValidDocument()?t.push(this.Nr.addEntry(e,r)):this.Nr.removeEntry(s)}),P.waitFor(t)}getFromCache(e,t){return this.Nr.getEntry(e,t)}getAllFromCache(e,t){return this.Nr.getEntries(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hE{constructor(e){this.persistence=e,this.si=new vn(t=>ja(t),$a),this.lastRemoteSnapshotVersion=j.min(),this.highestTargetId=0,this.oi=0,this._i=new Ka,this.targetCount=0,this.ai=zn.ur()}forEachTarget(e,t){return this.si.forEach((s,r)=>t(r)),P.resolve()}getLastRemoteSnapshotVersion(e){return P.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return P.resolve(this.oi)}allocateTargetId(e){return this.highestTargetId=this.ai.next(),P.resolve(this.highestTargetId)}setTargetsMetadata(e,t,s){return s&&(this.lastRemoteSnapshotVersion=s),t>this.oi&&(this.oi=t),P.resolve()}Pr(e){this.si.set(e.target,e);const t=e.targetId;t>this.highestTargetId&&(this.ai=new zn(t),this.highestTargetId=t),e.sequenceNumber>this.oi&&(this.oi=e.sequenceNumber)}addTargetData(e,t){return this.Pr(t),this.targetCount+=1,P.resolve()}updateTargetData(e,t){return this.Pr(t),P.resolve()}removeTargetData(e,t){return this.si.delete(t.target),this._i.jr(t.targetId),this.targetCount-=1,P.resolve()}removeTargets(e,t,s){let r=0;const i=[];return this.si.forEach((a,l)=>{l.sequenceNumber<=t&&s.get(l.targetId)===null&&(this.si.delete(a),i.push(this.removeMatchingKeysForTargetId(e,l.targetId)),r++)}),P.waitFor(i).next(()=>r)}getTargetCount(e){return P.resolve(this.targetCount)}getTargetData(e,t){const s=this.si.get(t)||null;return P.resolve(s)}addMatchingKeys(e,t,s){return this._i.Wr(t,s),P.resolve()}removeMatchingKeys(e,t,s){this._i.zr(t,s);const r=this.persistence.referenceDelegate,i=[];return r&&t.forEach(a=>{i.push(r.markPotentiallyOrphaned(e,a))}),P.waitFor(i)}removeMatchingKeysForTargetId(e,t){return this._i.jr(t),P.resolve()}getMatchingKeysForTargetId(e,t){const s=this._i.Hr(t);return P.resolve(s)}containsKey(e,t){return P.resolve(this._i.containsKey(t))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class af{constructor(e,t){this.ui={},this.overlays={},this.ci=new bi(0),this.li=!1,this.li=!0,this.hi=new aE,this.referenceDelegate=e(this),this.Pi=new hE(this),this.indexManager=new Qy,this.remoteDocumentCache=function(r){return new cE(r)}(s=>this.referenceDelegate.Ti(s)),this.serializer=new Gy(t),this.Ii=new iE(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.li=!1,Promise.resolve()}get started(){return this.li}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new oE,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let s=this.ui[e.toKey()];return s||(s=new lE(t,this.referenceDelegate),this.ui[e.toKey()]=s),s}getGlobalsCache(){return this.hi}getTargetCache(){return this.Pi}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Ii}runTransaction(e,t,s){x("MemoryPersistence","Starting transaction:",e);const r=new dE(this.ci.next());return this.referenceDelegate.Ei(),s(r).next(i=>this.referenceDelegate.di(r).next(()=>i)).toPromise().then(i=>(r.raiseOnCommittedEvent(),i))}Ai(e,t){return P.or(Object.values(this.ui).map(s=>()=>s.containsKey(e,t)))}}class dE extends Lg{constructor(e){super(),this.currentSequenceNumber=e}}class Qa{constructor(e){this.persistence=e,this.Ri=new Ka,this.Vi=null}static mi(e){return new Qa(e)}get fi(){if(this.Vi)return this.Vi;throw F(60996)}addReference(e,t,s){return this.Ri.addReference(s,t),this.fi.delete(s.toString()),P.resolve()}removeReference(e,t,s){return this.Ri.removeReference(s,t),this.fi.add(s.toString()),P.resolve()}markPotentiallyOrphaned(e,t){return this.fi.add(t.toString()),P.resolve()}removeTarget(e,t){this.Ri.jr(t.targetId).forEach(r=>this.fi.add(r.toString()));const s=this.persistence.getTargetCache();return s.getMatchingKeysForTargetId(e,t.targetId).next(r=>{r.forEach(i=>this.fi.add(i.toString()))}).next(()=>s.removeTargetData(e,t))}Ei(){this.Vi=new Set}di(e){const t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return P.forEach(this.fi,s=>{const r=M.fromPath(s);return this.gi(e,r).next(i=>{i||t.removeEntry(r,j.min())})}).next(()=>(this.Vi=null,t.apply(e)))}updateLimboDocument(e,t){return this.gi(e,t).next(s=>{s?this.fi.delete(t.toString()):this.fi.add(t.toString())})}Ti(e){return 0}gi(e,t){return P.or([()=>P.resolve(this.Ri.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.Ai(e,t)])}}class ii{constructor(e,t){this.persistence=e,this.pi=new vn(s=>Bg(s.path),(s,r)=>s.isEqual(r)),this.garbageCollector=tE(this,t)}static mi(e,t){return new ii(e,t)}Ei(){}di(e){return P.resolve()}forEachTarget(e,t){return this.persistence.getTargetCache().forEachTarget(e,t)}gr(e){const t=this.wr(e);return this.persistence.getTargetCache().getTargetCount(e).next(s=>t.next(r=>s+r))}wr(e){let t=0;return this.pr(e,s=>{t++}).next(()=>t)}pr(e,t){return P.forEach(this.pi,(s,r)=>this.br(e,s,r).next(i=>i?P.resolve():t(r)))}removeTargets(e,t,s){return this.persistence.getTargetCache().removeTargets(e,t,s)}removeOrphanedDocuments(e,t){let s=0;const r=this.persistence.getRemoteDocumentCache(),i=r.newChangeBuffer();return r.ii(e,a=>this.br(e,a,t).next(l=>{l||(s++,i.removeEntry(a,j.min()))})).next(()=>i.apply(e)).next(()=>s)}markPotentiallyOrphaned(e,t){return this.pi.set(t,e.currentSequenceNumber),P.resolve()}removeTarget(e,t){const s=t.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,s)}addReference(e,t,s){return this.pi.set(s,e.currentSequenceNumber),P.resolve()}removeReference(e,t,s){return this.pi.set(s,e.currentSequenceNumber),P.resolve()}updateLimboDocument(e,t){return this.pi.set(t,e.currentSequenceNumber),P.resolve()}Ti(e){let t=e.key.toString().length;return e.isFoundDocument()&&(t+=zr(e.data.value)),t}br(e,t,s){return P.or([()=>this.persistence.Ai(e,t),()=>this.persistence.getTargetCache().containsKey(e,t),()=>{const r=this.pi.get(t);return P.resolve(r!==void 0&&r>s)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ya{constructor(e,t,s,r){this.targetId=e,this.fromCache=t,this.Es=s,this.ds=r}static As(e,t){let s=G(),r=G();for(const i of t.docChanges)switch(i.type){case 0:s=s.add(i.doc.key);break;case 1:r=r.add(i.doc.key)}return new Ya(e,t.fromCache,s,r)}}/**
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
 */class fE{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}/**
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
 */class pE{constructor(){this.Rs=!1,this.Vs=!1,this.fs=100,this.gs=function(){return dm()?8:Fg(td())>0?6:4}()}initialize(e,t){this.ps=e,this.indexManager=t,this.Rs=!0}getDocumentsMatchingQuery(e,t,s,r){const i={result:null};return this.ys(e,t).next(a=>{i.result=a}).next(()=>{if(!i.result)return this.ws(e,t,r,s).next(a=>{i.result=a})}).next(()=>{if(i.result)return;const a=new fE;return this.Ss(e,t,a).next(l=>{if(i.result=l,this.Vs)return this.bs(e,t,a,l.size)})}).next(()=>i.result)}bs(e,t,s,r){return s.documentReadCount<this.fs?(kn()<=K.DEBUG&&x("QueryEngine","SDK will not create cache indexes for query:",Dn(t),"since it only creates cache indexes for collection contains","more than or equal to",this.fs,"documents"),P.resolve()):(kn()<=K.DEBUG&&x("QueryEngine","Query:",Dn(t),"scans",s.documentReadCount,"local documents and returns",r,"documents as results."),s.documentReadCount>this.gs*r?(kn()<=K.DEBUG&&x("QueryEngine","The SDK decides to create cache indexes for query:",Dn(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,dt(t))):P.resolve())}ys(e,t){if(Cu(t))return P.resolve(null);let s=dt(t);return this.indexManager.getIndexType(e,s).next(r=>r===0?null:(t.limit!==null&&r===1&&(t=ia(t,null,"F"),s=dt(t)),this.indexManager.getDocumentsMatchingTarget(e,s).next(i=>{const a=G(...i);return this.ps.getDocuments(e,a).next(l=>this.indexManager.getMinOffset(e,s).next(u=>{const h=this.Ds(t,l);return this.Cs(t,h,a,u.readTime)?this.ys(e,ia(t,null,"F")):this.vs(e,h,t,u)}))})))}ws(e,t,s,r){return Cu(t)||r.isEqual(j.min())?P.resolve(null):this.ps.getDocuments(e,s).next(i=>{const a=this.Ds(t,i);return this.Cs(t,a,s,r)?P.resolve(null):(kn()<=K.DEBUG&&x("QueryEngine","Re-using previous result from %s to execute query: %s",r.toString(),Dn(t)),this.vs(e,a,t,Vg(r,Gs)).next(l=>l))})}Ds(e,t){let s=new ve(Ld(e));return t.forEach((r,i)=>{Vi(e,i)&&(s=s.add(i))}),s}Cs(e,t,s,r){if(e.limit===null)return!1;if(s.size!==t.size)return!0;const i=e.limitType==="F"?t.last():t.first();return!!i&&(i.hasPendingWrites||i.version.compareTo(r)>0)}Ss(e,t,s){return kn()<=K.DEBUG&&x("QueryEngine","Using full collection scan to execute query:",Dn(t)),this.ps.getDocumentsMatchingQuery(e,t,$t.min(),s)}vs(e,t,s,r){return this.ps.getDocumentsMatchingQuery(e,s,r).next(i=>(t.forEach(a=>{i=i.insert(a.key,a)}),i))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xa="LocalStore",_E=3e8;class mE{constructor(e,t,s,r){this.persistence=e,this.Fs=t,this.serializer=r,this.Ms=new Te(z),this.xs=new vn(i=>ja(i),$a),this.Os=new Map,this.Ns=e.getRemoteDocumentCache(),this.Pi=e.getTargetCache(),this.Ii=e.getBundleCache(),this.Bs(s)}Bs(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new rE(this.Ns,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Ns.setIndexManager(this.indexManager),this.Fs.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",t=>e.collect(t,this.Ms))}}function gE(n,e,t,s){return new mE(n,e,t,s)}async function lf(n,e){const t=q(n);return await t.persistence.runTransaction("Handle user change","readonly",s=>{let r;return t.mutationQueue.getAllMutationBatches(s).next(i=>(r=i,t.Bs(e),t.mutationQueue.getAllMutationBatches(s))).next(i=>{const a=[],l=[];let u=G();for(const h of r){a.push(h.batchId);for(const f of h.mutations)u=u.add(f.key)}for(const h of i){l.push(h.batchId);for(const f of h.mutations)u=u.add(f.key)}return t.localDocuments.getDocuments(s,u).next(h=>({Ls:h,removedBatchIds:a,addedBatchIds:l}))})})}function yE(n,e){const t=q(n);return t.persistence.runTransaction("Acknowledge batch","readwrite-primary",s=>{const r=e.batch.keys(),i=t.Ns.newChangeBuffer({trackRemovals:!0});return function(l,u,h,f){const p=h.batch,m=p.keys();let I=P.resolve();return m.forEach(C=>{I=I.next(()=>f.getEntry(u,C)).next(k=>{const N=h.docVersions.get(C);J(N!==null,48541),k.version.compareTo(N)<0&&(p.applyToRemoteDocument(k,h),k.isValidDocument()&&(k.setReadTime(h.commitVersion),f.addEntry(k)))})}),I.next(()=>l.mutationQueue.removeMutationBatch(u,p))}(t,s,e,i).next(()=>i.apply(s)).next(()=>t.mutationQueue.performConsistencyCheck(s)).next(()=>t.documentOverlayCache.removeOverlaysForBatchId(s,r,e.batch.batchId)).next(()=>t.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(s,function(l){let u=G();for(let h=0;h<l.mutationResults.length;++h)l.mutationResults[h].transformResults.length>0&&(u=u.add(l.batch.mutations[h].key));return u}(e))).next(()=>t.localDocuments.getDocuments(s,r))})}function cf(n){const e=q(n);return e.persistence.runTransaction("Get last remote snapshot version","readonly",t=>e.Pi.getLastRemoteSnapshotVersion(t))}function EE(n,e){const t=q(n),s=e.snapshotVersion;let r=t.Ms;return t.persistence.runTransaction("Apply remote event","readwrite-primary",i=>{const a=t.Ns.newChangeBuffer({trackRemovals:!0});r=t.Ms;const l=[];e.targetChanges.forEach((f,p)=>{const m=r.get(p);if(!m)return;l.push(t.Pi.removeMatchingKeys(i,f.removedDocuments,p).next(()=>t.Pi.addMatchingKeys(i,f.addedDocuments,p)));let I=m.withSequenceNumber(i.currentSequenceNumber);e.targetMismatches.get(p)!==null?I=I.withResumeToken(Ne.EMPTY_BYTE_STRING,j.min()).withLastLimboFreeSnapshotVersion(j.min()):f.resumeToken.approximateByteSize()>0&&(I=I.withResumeToken(f.resumeToken,s)),r=r.insert(p,I),function(k,N,B){return k.resumeToken.approximateByteSize()===0||N.snapshotVersion.toMicroseconds()-k.snapshotVersion.toMicroseconds()>=_E?!0:B.addedDocuments.size+B.modifiedDocuments.size+B.removedDocuments.size>0}(m,I,f)&&l.push(t.Pi.updateTargetData(i,I))});let u=St(),h=G();if(e.documentUpdates.forEach(f=>{e.resolvedLimboDocuments.has(f)&&l.push(t.persistence.referenceDelegate.updateLimboDocument(i,f))}),l.push(TE(i,a,e.documentUpdates).next(f=>{u=f.ks,h=f.qs})),!s.isEqual(j.min())){const f=t.Pi.getLastRemoteSnapshotVersion(i).next(p=>t.Pi.setTargetsMetadata(i,i.currentSequenceNumber,s));l.push(f)}return P.waitFor(l).next(()=>a.apply(i)).next(()=>t.localDocuments.getLocalViewOfDocuments(i,u,h)).next(()=>u)}).then(i=>(t.Ms=r,i))}function TE(n,e,t){let s=G(),r=G();return t.forEach(i=>s=s.add(i)),e.getEntries(n,s).next(i=>{let a=St();return t.forEach((l,u)=>{const h=i.get(l);u.isFoundDocument()!==h.isFoundDocument()&&(r=r.add(l)),u.isNoDocument()&&u.version.isEqual(j.min())?(e.removeEntry(l,u.readTime),a=a.insert(l,u)):!h.isValidDocument()||u.version.compareTo(h.version)>0||u.version.compareTo(h.version)===0&&h.hasPendingWrites?(e.addEntry(u),a=a.insert(l,u)):x(Xa,"Ignoring outdated watch update for ",l,". Current version:",h.version," Watch version:",u.version)}),{ks:a,qs:r}})}function vE(n,e){const t=q(n);return t.persistence.runTransaction("Get next mutation batch","readonly",s=>(e===void 0&&(e=Ua),t.mutationQueue.getNextMutationBatchAfterBatchId(s,e)))}function wE(n,e){const t=q(n);return t.persistence.runTransaction("Allocate target","readwrite",s=>{let r;return t.Pi.getTargetData(s,e).next(i=>i?(r=i,P.resolve(r)):t.Pi.allocateTargetId(s).next(a=>(r=new Mt(e,a,"TargetPurposeListen",s.currentSequenceNumber),t.Pi.addTargetData(s,r).next(()=>r))))}).then(s=>{const r=t.Ms.get(s.targetId);return(r===null||s.snapshotVersion.compareTo(r.snapshotVersion)>0)&&(t.Ms=t.Ms.insert(s.targetId,s),t.xs.set(e,s.targetId)),s})}async function ua(n,e,t){const s=q(n),r=s.Ms.get(e),i=t?"readwrite":"readwrite-primary";try{t||await s.persistence.runTransaction("Release target",i,a=>s.persistence.referenceDelegate.removeTarget(a,r))}catch(a){if(!es(a))throw a;x(Xa,`Failed to update sequence numbers for target ${e}: ${a}`)}s.Ms=s.Ms.remove(e),s.xs.delete(r.target)}function Uu(n,e,t){const s=q(n);let r=j.min(),i=G();return s.persistence.runTransaction("Execute query","readwrite",a=>function(u,h,f){const p=q(u),m=p.xs.get(f);return m!==void 0?P.resolve(p.Ms.get(m)):p.Pi.getTargetData(h,f)}(s,a,dt(e)).next(l=>{if(l)return r=l.lastLimboFreeSnapshotVersion,s.Pi.getMatchingKeysForTargetId(a,l.targetId).next(u=>{i=u})}).next(()=>s.Fs.getDocumentsMatchingQuery(a,e,t?r:j.min(),t?i:G())).next(l=>(IE(s,oy(e),l),{documents:l,Qs:i})))}function IE(n,e,t){let s=n.Os.get(e)||j.min();t.forEach((r,i)=>{i.readTime.compareTo(s)>0&&(s=i.readTime)}),n.Os.set(e,s)}class Bu{constructor(){this.activeTargetIds=dy()}zs(e){this.activeTargetIds=this.activeTargetIds.add(e)}js(e){this.activeTargetIds=this.activeTargetIds.delete(e)}Gs(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class AE{constructor(){this.Mo=new Bu,this.xo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,s){}addLocalQueryTarget(e,t=!0){return t&&this.Mo.zs(e),this.xo[e]||"not-current"}updateQueryState(e,t,s){this.xo[e]=t}removeLocalQueryTarget(e){this.Mo.js(e)}isLocalQueryTarget(e){return this.Mo.activeTargetIds.has(e)}clearQueryState(e){delete this.xo[e]}getAllActiveQueryTargets(){return this.Mo.activeTargetIds}isActiveQueryTarget(e){return this.Mo.activeTargetIds.has(e)}start(){return this.Mo=new Bu,Promise.resolve()}handleUserChange(e,t,s){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}/**
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
 */class RE{Oo(e){}shutdown(){}}/**
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
 */const qu="ConnectivityMonitor";class ju{constructor(){this.No=()=>this.Bo(),this.Lo=()=>this.ko(),this.qo=[],this.Qo()}Oo(e){this.qo.push(e)}shutdown(){window.removeEventListener("online",this.No),window.removeEventListener("offline",this.Lo)}Qo(){window.addEventListener("online",this.No),window.addEventListener("offline",this.Lo)}Bo(){x(qu,"Network connectivity changed: AVAILABLE");for(const e of this.qo)e(0)}ko(){x(qu,"Network connectivity changed: UNAVAILABLE");for(const e of this.qo)e(1)}static v(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
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
 */let Ur=null;function ha(){return Ur===null?Ur=function(){return 268435456+Math.round(2147483648*Math.random())}():Ur++,"0x"+Ur.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ko="RestConnection",CE={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};class SE{get $o(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const t=e.ssl?"https":"http",s=encodeURIComponent(this.databaseId.projectId),r=encodeURIComponent(this.databaseId.database);this.Uo=t+"://"+e.host,this.Ko=`projects/${s}/databases/${r}`,this.Wo=this.databaseId.database===Zo?`project_id=${s}`:`project_id=${s}&database_id=${r}`}Go(e,t,s,r,i){const a=ha(),l=this.zo(e,t.toUriEncodedString());x(ko,`Sending RPC '${e}' ${a}:`,l,s);const u={"google-cloud-resource-prefix":this.Ko,"x-goog-request-params":this.Wo};this.jo(u,r,i);const{host:h}=new URL(l),f=Yt(h);return this.Jo(e,l,u,s,f).then(p=>(x(ko,`Received RPC '${e}' ${a}: `,p),p),p=>{throw qn(ko,`RPC '${e}' ${a} failed with error: `,p,"url: ",l,"request:",s),p})}Ho(e,t,s,r,i,a){return this.Go(e,t,s,r,i)}jo(e,t,s){e["X-Goog-Api-Client"]=function(){return"gl-js/ fire/"+Jn}(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach((r,i)=>e[i]=r),s&&s.headers.forEach((r,i)=>e[i]=r)}zo(e,t){const s=CE[e];return`${this.Uo}/v1/${t}:${s}`}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bE{constructor(e){this.Yo=e.Yo,this.Zo=e.Zo}Xo(e){this.e_=e}t_(e){this.n_=e}r_(e){this.i_=e}onMessage(e){this.s_=e}close(){this.Zo()}send(e){this.Yo(e)}o_(){this.e_()}__(){this.n_()}a_(e){this.i_(e)}u_(e){this.s_(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xe="WebChannelConnection";class PE extends SE{constructor(e){super(e),this.c_=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}Jo(e,t,s,r,i){const a=ha();return new Promise((l,u)=>{const h=new cd;h.setWithCredentials(!0),h.listenOnce(ud.COMPLETE,()=>{try{switch(h.getLastErrorCode()){case Wr.NO_ERROR:const p=h.getResponseJson();x(xe,`XHR for RPC '${e}' ${a} received:`,JSON.stringify(p)),l(p);break;case Wr.TIMEOUT:x(xe,`RPC '${e}' ${a} timed out`),u(new O(b.DEADLINE_EXCEEDED,"Request time out"));break;case Wr.HTTP_ERROR:const m=h.getStatus();if(x(xe,`RPC '${e}' ${a} failed with status:`,m,"response text:",h.getResponseText()),m>0){let I=h.getResponseJson();Array.isArray(I)&&(I=I[0]);const C=I==null?void 0:I.error;if(C&&C.status&&C.message){const k=function(B){const L=B.toLowerCase().replace(/_/g,"-");return Object.values(b).indexOf(L)>=0?L:b.UNKNOWN}(C.status);u(new O(k,C.message))}else u(new O(b.UNKNOWN,"Server responded with status "+h.getStatus()))}else u(new O(b.UNAVAILABLE,"Connection failed."));break;default:F(9055,{l_:e,streamId:a,h_:h.getLastErrorCode(),P_:h.getLastError()})}}finally{x(xe,`RPC '${e}' ${a} completed.`)}});const f=JSON.stringify(r);x(xe,`RPC '${e}' ${a} sending request:`,r),h.send(t,"POST",f,s,15)})}T_(e,t,s){const r=ha(),i=[this.Uo,"/","google.firestore.v1.Firestore","/",e,"/channel"],a=fd(),l=dd(),u={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},h=this.longPollingOptions.timeoutSeconds;h!==void 0&&(u.longPollingTimeout=Math.round(1e3*h)),this.useFetchStreams&&(u.useFetchStreams=!0),this.jo(u.initMessageHeaders,t,s),u.encodeInitMessageHeaders=!0;const f=i.join("");x(xe,`Creating RPC '${e}' stream ${r}: ${f}`,u);const p=a.createWebChannel(f,u);this.I_(p);let m=!1,I=!1;const C=new bE({Yo:N=>{I?x(xe,`Not sending because RPC '${e}' stream ${r} is closed:`,N):(m||(x(xe,`Opening RPC '${e}' stream ${r} transport.`),p.open(),m=!0),x(xe,`RPC '${e}' stream ${r} sending:`,N),p.send(N))},Zo:()=>p.close()}),k=(N,B,L)=>{N.listen(B,U=>{try{L(U)}catch($){setTimeout(()=>{throw $},0)}})};return k(p,Ns.EventType.OPEN,()=>{I||(x(xe,`RPC '${e}' stream ${r} transport opened.`),C.o_())}),k(p,Ns.EventType.CLOSE,()=>{I||(I=!0,x(xe,`RPC '${e}' stream ${r} transport closed`),C.a_(),this.E_(p))}),k(p,Ns.EventType.ERROR,N=>{I||(I=!0,qn(xe,`RPC '${e}' stream ${r} transport errored. Name:`,N.name,"Message:",N.message),C.a_(new O(b.UNAVAILABLE,"The operation could not be completed")))}),k(p,Ns.EventType.MESSAGE,N=>{var B;if(!I){const L=N.data[0];J(!!L,16349);const U=L,$=(U==null?void 0:U.error)||((B=U[0])==null?void 0:B.error);if($){x(xe,`RPC '${e}' stream ${r} received error:`,$);const $e=$.status;let fe=function(E){const T=me[E];if(T!==void 0)return Kd(T)}($e),w=$.message;fe===void 0&&(fe=b.INTERNAL,w="Unknown error status: "+$e+" with message "+$.message),I=!0,C.a_(new O(fe,w)),p.close()}else x(xe,`RPC '${e}' stream ${r} received:`,L),C.u_(L)}}),k(l,hd.STAT_EVENT,N=>{N.stat===Qo.PROXY?x(xe,`RPC '${e}' stream ${r} detected buffering proxy`):N.stat===Qo.NOPROXY&&x(xe,`RPC '${e}' stream ${r} detected no buffering proxy`)}),setTimeout(()=>{C.__()},0),C}terminate(){this.c_.forEach(e=>e.close()),this.c_=[]}I_(e){this.c_.push(e)}E_(e){this.c_=this.c_.filter(t=>t===e)}}function Do(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Fi(n){return new Vy(n,!0)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class uf{constructor(e,t,s=1e3,r=1.5,i=6e4){this.Mi=e,this.timerId=t,this.d_=s,this.A_=r,this.R_=i,this.V_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.V_=0}g_(){this.V_=this.R_}p_(e){this.cancel();const t=Math.floor(this.V_+this.y_()),s=Math.max(0,Date.now()-this.f_),r=Math.max(0,t-s);r>0&&x("ExponentialBackoff",`Backing off for ${r} ms (base delay: ${this.V_} ms, delay with jitter: ${t} ms, last attempt: ${s} ms ago)`),this.m_=this.Mi.enqueueAfterDelay(this.timerId,r,()=>(this.f_=Date.now(),e())),this.V_*=this.A_,this.V_<this.d_&&(this.V_=this.d_),this.V_>this.R_&&(this.V_=this.R_)}w_(){this.m_!==null&&(this.m_.skipDelay(),this.m_=null)}cancel(){this.m_!==null&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.V_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $u="PersistentStream";class hf{constructor(e,t,s,r,i,a,l,u){this.Mi=e,this.S_=s,this.b_=r,this.connection=i,this.authCredentialsProvider=a,this.appCheckCredentialsProvider=l,this.listener=u,this.state=0,this.D_=0,this.C_=null,this.v_=null,this.stream=null,this.F_=0,this.M_=new uf(e,t)}x_(){return this.state===1||this.state===5||this.O_()}O_(){return this.state===2||this.state===3}start(){this.F_=0,this.state!==4?this.auth():this.N_()}async stop(){this.x_()&&await this.close(0)}B_(){this.state=0,this.M_.reset()}L_(){this.O_()&&this.C_===null&&(this.C_=this.Mi.enqueueAfterDelay(this.S_,6e4,()=>this.k_()))}q_(e){this.Q_(),this.stream.send(e)}async k_(){if(this.O_())return this.close(0)}Q_(){this.C_&&(this.C_.cancel(),this.C_=null)}U_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(e,t){this.Q_(),this.U_(),this.M_.cancel(),this.D_++,e!==4?this.M_.reset():t&&t.code===b.RESOURCE_EXHAUSTED?(Ct(t.toString()),Ct("Using maximum backoff delay to prevent overloading the backend."),this.M_.g_()):t&&t.code===b.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.K_(),this.stream.close(),this.stream=null),this.state=e,await this.listener.r_(t)}K_(){}auth(){this.state=1;const e=this.W_(this.D_),t=this.D_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([s,r])=>{this.D_===t&&this.G_(s,r)},s=>{e(()=>{const r=new O(b.UNKNOWN,"Fetching auth token failed: "+s.message);return this.z_(r)})})}G_(e,t){const s=this.W_(this.D_);this.stream=this.j_(e,t),this.stream.Xo(()=>{s(()=>this.listener.Xo())}),this.stream.t_(()=>{s(()=>(this.state=2,this.v_=this.Mi.enqueueAfterDelay(this.b_,1e4,()=>(this.O_()&&(this.state=3),Promise.resolve())),this.listener.t_()))}),this.stream.r_(r=>{s(()=>this.z_(r))}),this.stream.onMessage(r=>{s(()=>++this.F_==1?this.J_(r):this.onNext(r))})}N_(){this.state=5,this.M_.p_(async()=>{this.state=0,this.start()})}z_(e){return x($u,`close with error: ${e}`),this.stream=null,this.close(4,e)}W_(e){return t=>{this.Mi.enqueueAndForget(()=>this.D_===e?t():(x($u,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}}class NE extends hf{constructor(e,t,s,r,i,a){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,s,r,a),this.serializer=i}j_(e,t){return this.connection.T_("Listen",e,t)}J_(e){return this.onNext(e)}onNext(e){this.M_.reset();const t=My(this.serializer,e),s=function(i){if(!("targetChange"in i))return j.min();const a=i.targetChange;return a.targetIds&&a.targetIds.length?j.min():a.readTime?ft(a.readTime):j.min()}(e);return this.listener.H_(t,s)}Y_(e){const t={};t.database=ca(this.serializer),t.addTarget=function(i,a){let l;const u=a.target;if(l=sa(u)?{documents:Uy(i,u)}:{query:tf(i,u).ft},l.targetId=a.targetId,a.resumeToken.approximateByteSize()>0){l.resumeToken=Xd(i,a.resumeToken);const h=oa(i,a.expectedCount);h!==null&&(l.expectedCount=h)}else if(a.snapshotVersion.compareTo(j.min())>0){l.readTime=ri(i,a.snapshotVersion.toTimestamp());const h=oa(i,a.expectedCount);h!==null&&(l.expectedCount=h)}return l}(this.serializer,e);const s=jy(this.serializer,e);s&&(t.labels=s),this.q_(t)}Z_(e){const t={};t.database=ca(this.serializer),t.removeTarget=e,this.q_(t)}}class kE extends hf{constructor(e,t,s,r,i,a){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,s,r,a),this.serializer=i}get X_(){return this.F_>0}start(){this.lastStreamToken=void 0,super.start()}K_(){this.X_&&this.ea([])}j_(e,t){return this.connection.T_("Write",e,t)}J_(e){return J(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,J(!e.writeResults||e.writeResults.length===0,55816),this.listener.ta()}onNext(e){J(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this.M_.reset();const t=Fy(e.writeResults,e.commitTime),s=ft(e.commitTime);return this.listener.na(s,t)}ra(){const e={};e.database=ca(this.serializer),this.q_(e)}ea(e){const t={streamToken:this.lastStreamToken,writes:e.map(s=>Ly(this.serializer,s))};this.q_(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class DE{}class VE extends DE{constructor(e,t,s,r){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=s,this.serializer=r,this.ia=!1}sa(){if(this.ia)throw new O(b.FAILED_PRECONDITION,"The client has already been terminated.")}Go(e,t,s,r){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([i,a])=>this.connection.Go(e,aa(t,s),r,i,a)).catch(i=>{throw i.name==="FirebaseError"?(i.code===b.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),i):new O(b.UNKNOWN,i.toString())})}Ho(e,t,s,r,i){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([a,l])=>this.connection.Ho(e,aa(t,s),r,a,l,i)).catch(a=>{throw a.name==="FirebaseError"?(a.code===b.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),a):new O(b.UNKNOWN,a.toString())})}terminate(){this.ia=!0,this.connection.terminate()}}class OE{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.oa=0,this._a=null,this.aa=!0}ua(){this.oa===0&&(this.ca("Unknown"),this._a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this._a=null,this.la("Backend didn't respond within 10 seconds."),this.ca("Offline"),Promise.resolve())))}ha(e){this.state==="Online"?this.ca("Unknown"):(this.oa++,this.oa>=1&&(this.Pa(),this.la(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.ca("Offline")))}set(e){this.Pa(),this.oa=0,e==="Online"&&(this.aa=!1),this.ca(e)}ca(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}la(e){const t=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.aa?(Ct(t),this.aa=!1):x("OnlineStateTracker",t)}Pa(){this._a!==null&&(this._a.cancel(),this._a=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mn="RemoteStore";class xE{constructor(e,t,s,r,i){this.localStore=e,this.datastore=t,this.asyncQueue=s,this.remoteSyncer={},this.Ta=[],this.Ia=new Map,this.Ea=new Set,this.da=[],this.Aa=i,this.Aa.Oo(a=>{s.enqueueAndForget(async()=>{wn(this)&&(x(mn,"Restarting streams for network reachability change."),await async function(u){const h=q(u);h.Ea.add(4),await ar(h),h.Ra.set("Unknown"),h.Ea.delete(4),await Ui(h)}(this))})}),this.Ra=new OE(s,r)}}async function Ui(n){if(wn(n))for(const e of n.da)await e(!0)}async function ar(n){for(const e of n.da)await e(!1)}function df(n,e){const t=q(n);t.Ia.has(e.targetId)||(t.Ia.set(e.targetId,e),tl(t)?el(t):ns(t).O_()&&Za(t,e))}function Ja(n,e){const t=q(n),s=ns(t);t.Ia.delete(e),s.O_()&&ff(t,e),t.Ia.size===0&&(s.O_()?s.L_():wn(t)&&t.Ra.set("Unknown"))}function Za(n,e){if(n.Va.Ue(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(j.min())>0){const t=n.remoteSyncer.getRemoteKeysForTarget(e.targetId).size;e=e.withExpectedCount(t)}ns(n).Y_(e)}function ff(n,e){n.Va.Ue(e),ns(n).Z_(e)}function el(n){n.Va=new Py({getRemoteKeysForTarget:e=>n.remoteSyncer.getRemoteKeysForTarget(e),At:e=>n.Ia.get(e)||null,ht:()=>n.datastore.serializer.databaseId}),ns(n).start(),n.Ra.ua()}function tl(n){return wn(n)&&!ns(n).x_()&&n.Ia.size>0}function wn(n){return q(n).Ea.size===0}function pf(n){n.Va=void 0}async function ME(n){n.Ra.set("Online")}async function LE(n){n.Ia.forEach((e,t)=>{Za(n,e)})}async function FE(n,e){pf(n),tl(n)?(n.Ra.ha(e),el(n)):n.Ra.set("Unknown")}async function UE(n,e,t){if(n.Ra.set("Online"),e instanceof Yd&&e.state===2&&e.cause)try{await async function(r,i){const a=i.cause;for(const l of i.targetIds)r.Ia.has(l)&&(await r.remoteSyncer.rejectListen(l,a),r.Ia.delete(l),r.Va.removeTarget(l))}(n,e)}catch(s){x(mn,"Failed to remove targets %s: %s ",e.targetIds.join(","),s),await oi(n,s)}else if(e instanceof Kr?n.Va.Ze(e):e instanceof Qd?n.Va.st(e):n.Va.tt(e),!t.isEqual(j.min()))try{const s=await cf(n.localStore);t.compareTo(s)>=0&&await function(i,a){const l=i.Va.Tt(a);return l.targetChanges.forEach((u,h)=>{if(u.resumeToken.approximateByteSize()>0){const f=i.Ia.get(h);f&&i.Ia.set(h,f.withResumeToken(u.resumeToken,a))}}),l.targetMismatches.forEach((u,h)=>{const f=i.Ia.get(u);if(!f)return;i.Ia.set(u,f.withResumeToken(Ne.EMPTY_BYTE_STRING,f.snapshotVersion)),ff(i,u);const p=new Mt(f.target,u,h,f.sequenceNumber);Za(i,p)}),i.remoteSyncer.applyRemoteEvent(l)}(n,t)}catch(s){x(mn,"Failed to raise snapshot:",s),await oi(n,s)}}async function oi(n,e,t){if(!es(e))throw e;n.Ea.add(1),await ar(n),n.Ra.set("Offline"),t||(t=()=>cf(n.localStore)),n.asyncQueue.enqueueRetryable(async()=>{x(mn,"Retrying IndexedDB access"),await t(),n.Ea.delete(1),await Ui(n)})}function _f(n,e){return e().catch(t=>oi(n,t,e))}async function Bi(n){const e=q(n),t=Gt(e);let s=e.Ta.length>0?e.Ta[e.Ta.length-1].batchId:Ua;for(;BE(e);)try{const r=await vE(e.localStore,s);if(r===null){e.Ta.length===0&&t.L_();break}s=r.batchId,qE(e,r)}catch(r){await oi(e,r)}mf(e)&&gf(e)}function BE(n){return wn(n)&&n.Ta.length<10}function qE(n,e){n.Ta.push(e);const t=Gt(n);t.O_()&&t.X_&&t.ea(e.mutations)}function mf(n){return wn(n)&&!Gt(n).x_()&&n.Ta.length>0}function gf(n){Gt(n).start()}async function jE(n){Gt(n).ra()}async function $E(n){const e=Gt(n);for(const t of n.Ta)e.ea(t.mutations)}async function WE(n,e,t){const s=n.Ta.shift(),r=za.from(s,e,t);await _f(n,()=>n.remoteSyncer.applySuccessfulWrite(r)),await Bi(n)}async function zE(n,e){e&&Gt(n).X_&&await async function(s,r){if(function(a){return Cy(a)&&a!==b.ABORTED}(r.code)){const i=s.Ta.shift();Gt(s).B_(),await _f(s,()=>s.remoteSyncer.rejectFailedWrite(i.batchId,r)),await Bi(s)}}(n,e),mf(n)&&gf(n)}async function Wu(n,e){const t=q(n);t.asyncQueue.verifyOperationInProgress(),x(mn,"RemoteStore received new credentials");const s=wn(t);t.Ea.add(3),await ar(t),s&&t.Ra.set("Unknown"),await t.remoteSyncer.handleCredentialChange(e),t.Ea.delete(3),await Ui(t)}async function HE(n,e){const t=q(n);e?(t.Ea.delete(2),await Ui(t)):e||(t.Ea.add(2),await ar(t),t.Ra.set("Unknown"))}function ns(n){return n.ma||(n.ma=function(t,s,r){const i=q(t);return i.sa(),new NE(s,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,r)}(n.datastore,n.asyncQueue,{Xo:ME.bind(null,n),t_:LE.bind(null,n),r_:FE.bind(null,n),H_:UE.bind(null,n)}),n.da.push(async e=>{e?(n.ma.B_(),tl(n)?el(n):n.Ra.set("Unknown")):(await n.ma.stop(),pf(n))})),n.ma}function Gt(n){return n.fa||(n.fa=function(t,s,r){const i=q(t);return i.sa(),new kE(s,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,r)}(n.datastore,n.asyncQueue,{Xo:()=>Promise.resolve(),t_:jE.bind(null,n),r_:zE.bind(null,n),ta:$E.bind(null,n),na:WE.bind(null,n)}),n.da.push(async e=>{e?(n.fa.B_(),await Bi(n)):(await n.fa.stop(),n.Ta.length>0&&(x(mn,`Stopping write stream with ${n.Ta.length} pending writes`),n.Ta=[]))})),n.fa}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nl{constructor(e,t,s,r,i){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=s,this.op=r,this.removalCallback=i,this.deferred=new ht,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(a=>{})}get promise(){return this.deferred.promise}static createAndSchedule(e,t,s,r,i){const a=Date.now()+s,l=new nl(e,t,a,r,i);return l.start(s),l}start(e){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new O(b.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then(e=>this.deferred.resolve(e))):Promise.resolve())}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function sl(n,e){if(Ct("AsyncQueue",`${e}: ${n}`),es(n))return new O(b.UNAVAILABLE,`${e}: ${n}`);throw n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mn{static emptySet(e){return new Mn(e.comparator)}constructor(e){this.comparator=e?(t,s)=>e(t,s)||M.comparator(t.key,s.key):(t,s)=>M.comparator(t.key,s.key),this.keyedMap=ks(),this.sortedSet=new Te(this.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal((t,s)=>(e(t),!1))}add(e){const t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){const t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof Mn)||this.size!==e.size)return!1;const t=this.sortedSet.getIterator(),s=e.sortedSet.getIterator();for(;t.hasNext();){const r=t.getNext().key,i=s.getNext().key;if(!r.isEqual(i))return!1}return!0}toString(){const e=[];return this.forEach(t=>{e.push(t.toString())}),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,t){const s=new Mn;return s.comparator=this.comparator,s.keyedMap=e,s.sortedSet=t,s}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zu{constructor(){this.ga=new Te(M.comparator)}track(e){const t=e.doc.key,s=this.ga.get(t);s?e.type!==0&&s.type===3?this.ga=this.ga.insert(t,e):e.type===3&&s.type!==1?this.ga=this.ga.insert(t,{type:s.type,doc:e.doc}):e.type===2&&s.type===2?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):e.type===2&&s.type===0?this.ga=this.ga.insert(t,{type:0,doc:e.doc}):e.type===1&&s.type===0?this.ga=this.ga.remove(t):e.type===1&&s.type===2?this.ga=this.ga.insert(t,{type:1,doc:s.doc}):e.type===0&&s.type===1?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):F(63341,{Rt:e,pa:s}):this.ga=this.ga.insert(t,e)}ya(){const e=[];return this.ga.inorderTraversal((t,s)=>{e.push(s)}),e}}class Hn{constructor(e,t,s,r,i,a,l,u,h){this.query=e,this.docs=t,this.oldDocs=s,this.docChanges=r,this.mutatedKeys=i,this.fromCache=a,this.syncStateChanged=l,this.excludesMetadataChanges=u,this.hasCachedResults=h}static fromInitialDocuments(e,t,s,r,i){const a=[];return t.forEach(l=>{a.push({type:0,doc:l})}),new Hn(e,t,Mn.emptySet(t),a,s,r,!0,!1,i)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&Di(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const t=this.docChanges,s=e.docChanges;if(t.length!==s.length)return!1;for(let r=0;r<t.length;r++)if(t[r].type!==s[r].type||!t[r].doc.isEqual(s[r].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class GE{constructor(){this.wa=void 0,this.Sa=[]}ba(){return this.Sa.some(e=>e.Da())}}class KE{constructor(){this.queries=Hu(),this.onlineState="Unknown",this.Ca=new Set}terminate(){(function(t,s){const r=q(t),i=r.queries;r.queries=Hu(),i.forEach((a,l)=>{for(const u of l.Sa)u.onError(s)})})(this,new O(b.ABORTED,"Firestore shutting down"))}}function Hu(){return new vn(n=>Md(n),Di)}async function rl(n,e){const t=q(n);let s=3;const r=e.query;let i=t.queries.get(r);i?!i.ba()&&e.Da()&&(s=2):(i=new GE,s=e.Da()?0:1);try{switch(s){case 0:i.wa=await t.onListen(r,!0);break;case 1:i.wa=await t.onListen(r,!1);break;case 2:await t.onFirstRemoteStoreListen(r)}}catch(a){const l=sl(a,`Initialization of query '${Dn(e.query)}' failed`);return void e.onError(l)}t.queries.set(r,i),i.Sa.push(e),e.va(t.onlineState),i.wa&&e.Fa(i.wa)&&ol(t)}async function il(n,e){const t=q(n),s=e.query;let r=3;const i=t.queries.get(s);if(i){const a=i.Sa.indexOf(e);a>=0&&(i.Sa.splice(a,1),i.Sa.length===0?r=e.Da()?0:1:!i.ba()&&e.Da()&&(r=2))}switch(r){case 0:return t.queries.delete(s),t.onUnlisten(s,!0);case 1:return t.queries.delete(s),t.onUnlisten(s,!1);case 2:return t.onLastRemoteStoreUnlisten(s);default:return}}function QE(n,e){const t=q(n);let s=!1;for(const r of e){const i=r.query,a=t.queries.get(i);if(a){for(const l of a.Sa)l.Fa(r)&&(s=!0);a.wa=r}}s&&ol(t)}function YE(n,e,t){const s=q(n),r=s.queries.get(e);if(r)for(const i of r.Sa)i.onError(t);s.queries.delete(e)}function ol(n){n.Ca.forEach(e=>{e.next()})}var da,Gu;(Gu=da||(da={})).Ma="default",Gu.Cache="cache";class al{constructor(e,t,s){this.query=e,this.xa=t,this.Oa=!1,this.Na=null,this.onlineState="Unknown",this.options=s||{}}Fa(e){if(!this.options.includeMetadataChanges){const s=[];for(const r of e.docChanges)r.type!==3&&s.push(r);e=new Hn(e.query,e.docs,e.oldDocs,s,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.Oa?this.Ba(e)&&(this.xa.next(e),t=!0):this.La(e,this.onlineState)&&(this.ka(e),t=!0),this.Na=e,t}onError(e){this.xa.error(e)}va(e){this.onlineState=e;let t=!1;return this.Na&&!this.Oa&&this.La(this.Na,e)&&(this.ka(this.Na),t=!0),t}La(e,t){if(!e.fromCache||!this.Da())return!0;const s=t!=="Offline";return(!this.options.qa||!s)&&(!e.docs.isEmpty()||e.hasCachedResults||t==="Offline")}Ba(e){if(e.docChanges.length>0)return!0;const t=this.Na&&this.Na.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&this.options.includeMetadataChanges===!0}ka(e){e=Hn.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.Oa=!0,this.xa.next(e)}Da(){return this.options.source!==da.Cache}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yf{constructor(e){this.key=e}}class Ef{constructor(e){this.key=e}}class XE{constructor(e,t){this.query=e,this.Ya=t,this.Za=null,this.hasCachedResults=!1,this.current=!1,this.Xa=G(),this.mutatedKeys=G(),this.eu=Ld(e),this.tu=new Mn(this.eu)}get nu(){return this.Ya}ru(e,t){const s=t?t.iu:new zu,r=t?t.tu:this.tu;let i=t?t.mutatedKeys:this.mutatedKeys,a=r,l=!1;const u=this.query.limitType==="F"&&r.size===this.query.limit?r.last():null,h=this.query.limitType==="L"&&r.size===this.query.limit?r.first():null;if(e.inorderTraversal((f,p)=>{const m=r.get(f),I=Vi(this.query,p)?p:null,C=!!m&&this.mutatedKeys.has(m.key),k=!!I&&(I.hasLocalMutations||this.mutatedKeys.has(I.key)&&I.hasCommittedMutations);let N=!1;m&&I?m.data.isEqual(I.data)?C!==k&&(s.track({type:3,doc:I}),N=!0):this.su(m,I)||(s.track({type:2,doc:I}),N=!0,(u&&this.eu(I,u)>0||h&&this.eu(I,h)<0)&&(l=!0)):!m&&I?(s.track({type:0,doc:I}),N=!0):m&&!I&&(s.track({type:1,doc:m}),N=!0,(u||h)&&(l=!0)),N&&(I?(a=a.add(I),i=k?i.add(f):i.delete(f)):(a=a.delete(f),i=i.delete(f)))}),this.query.limit!==null)for(;a.size>this.query.limit;){const f=this.query.limitType==="F"?a.last():a.first();a=a.delete(f.key),i=i.delete(f.key),s.track({type:1,doc:f})}return{tu:a,iu:s,Cs:l,mutatedKeys:i}}su(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,s,r){const i=this.tu;this.tu=e.tu,this.mutatedKeys=e.mutatedKeys;const a=e.iu.ya();a.sort((f,p)=>function(I,C){const k=N=>{switch(N){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return F(20277,{Rt:N})}};return k(I)-k(C)}(f.type,p.type)||this.eu(f.doc,p.doc)),this.ou(s),r=r??!1;const l=t&&!r?this._u():[],u=this.Xa.size===0&&this.current&&!r?1:0,h=u!==this.Za;return this.Za=u,a.length!==0||h?{snapshot:new Hn(this.query,e.tu,i,a,e.mutatedKeys,u===0,h,!1,!!s&&s.resumeToken.approximateByteSize()>0),au:l}:{au:l}}va(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({tu:this.tu,iu:new zu,mutatedKeys:this.mutatedKeys,Cs:!1},!1)):{au:[]}}uu(e){return!this.Ya.has(e)&&!!this.tu.has(e)&&!this.tu.get(e).hasLocalMutations}ou(e){e&&(e.addedDocuments.forEach(t=>this.Ya=this.Ya.add(t)),e.modifiedDocuments.forEach(t=>{}),e.removedDocuments.forEach(t=>this.Ya=this.Ya.delete(t)),this.current=e.current)}_u(){if(!this.current)return[];const e=this.Xa;this.Xa=G(),this.tu.forEach(s=>{this.uu(s.key)&&(this.Xa=this.Xa.add(s.key))});const t=[];return e.forEach(s=>{this.Xa.has(s)||t.push(new Ef(s))}),this.Xa.forEach(s=>{e.has(s)||t.push(new yf(s))}),t}cu(e){this.Ya=e.Qs,this.Xa=G();const t=this.ru(e.documents);return this.applyChanges(t,!0)}lu(){return Hn.fromInitialDocuments(this.query,this.tu,this.mutatedKeys,this.Za===0,this.hasCachedResults)}}const ll="SyncEngine";class JE{constructor(e,t,s){this.query=e,this.targetId=t,this.view=s}}class ZE{constructor(e){this.key=e,this.hu=!1}}class eT{constructor(e,t,s,r,i,a){this.localStore=e,this.remoteStore=t,this.eventManager=s,this.sharedClientState=r,this.currentUser=i,this.maxConcurrentLimboResolutions=a,this.Pu={},this.Tu=new vn(l=>Md(l),Di),this.Iu=new Map,this.Eu=new Set,this.du=new Te(M.comparator),this.Au=new Map,this.Ru=new Ka,this.Vu={},this.mu=new Map,this.fu=zn.cr(),this.onlineState="Unknown",this.gu=void 0}get isPrimaryClient(){return this.gu===!0}}async function tT(n,e,t=!0){const s=Rf(n);let r;const i=s.Tu.get(e);return i?(s.sharedClientState.addLocalQueryTarget(i.targetId),r=i.view.lu()):r=await Tf(s,e,t,!0),r}async function nT(n,e){const t=Rf(n);await Tf(t,e,!0,!1)}async function Tf(n,e,t,s){const r=await wE(n.localStore,dt(e)),i=r.targetId,a=n.sharedClientState.addLocalQueryTarget(i,t);let l;return s&&(l=await sT(n,e,i,a==="current",r.resumeToken)),n.isPrimaryClient&&t&&df(n.remoteStore,r),l}async function sT(n,e,t,s,r){n.pu=(p,m,I)=>async function(k,N,B,L){let U=N.view.ru(B);U.Cs&&(U=await Uu(k.localStore,N.query,!1).then(({documents:w})=>N.view.ru(w,U)));const $=L&&L.targetChanges.get(N.targetId),$e=L&&L.targetMismatches.get(N.targetId)!=null,fe=N.view.applyChanges(U,k.isPrimaryClient,$,$e);return Qu(k,N.targetId,fe.au),fe.snapshot}(n,p,m,I);const i=await Uu(n.localStore,e,!0),a=new XE(e,i.Qs),l=a.ru(i.documents),u=or.createSynthesizedTargetChangeForCurrentChange(t,s&&n.onlineState!=="Offline",r),h=a.applyChanges(l,n.isPrimaryClient,u);Qu(n,t,h.au);const f=new JE(e,t,a);return n.Tu.set(e,f),n.Iu.has(t)?n.Iu.get(t).push(e):n.Iu.set(t,[e]),h.snapshot}async function rT(n,e,t){const s=q(n),r=s.Tu.get(e),i=s.Iu.get(r.targetId);if(i.length>1)return s.Iu.set(r.targetId,i.filter(a=>!Di(a,e))),void s.Tu.delete(e);s.isPrimaryClient?(s.sharedClientState.removeLocalQueryTarget(r.targetId),s.sharedClientState.isActiveQueryTarget(r.targetId)||await ua(s.localStore,r.targetId,!1).then(()=>{s.sharedClientState.clearQueryState(r.targetId),t&&Ja(s.remoteStore,r.targetId),fa(s,r.targetId)}).catch(Zn)):(fa(s,r.targetId),await ua(s.localStore,r.targetId,!0))}async function iT(n,e){const t=q(n),s=t.Tu.get(e),r=t.Iu.get(s.targetId);t.isPrimaryClient&&r.length===1&&(t.sharedClientState.removeLocalQueryTarget(s.targetId),Ja(t.remoteStore,s.targetId))}async function oT(n,e,t){const s=fT(n);try{const r=await function(a,l){const u=q(a),h=le.now(),f=l.reduce((I,C)=>I.add(C.key),G());let p,m;return u.persistence.runTransaction("Locally write mutations","readwrite",I=>{let C=St(),k=G();return u.Ns.getEntries(I,f).next(N=>{C=N,C.forEach((B,L)=>{L.isValidDocument()||(k=k.add(B))})}).next(()=>u.localDocuments.getOverlayedDocuments(I,C)).next(N=>{p=N;const B=[];for(const L of l){const U=Ty(L,p.get(L.key).overlayedDocument);U!=null&&B.push(new Zt(L.key,U,Sd(U.value.mapValue),je.exists(!0)))}return u.mutationQueue.addMutationBatch(I,h,B,l)}).next(N=>{m=N;const B=N.applyToLocalDocumentSet(p,k);return u.documentOverlayCache.saveOverlays(I,N.batchId,B)})}).then(()=>({batchId:m.batchId,changes:Ud(p)}))}(s.localStore,e);s.sharedClientState.addPendingMutation(r.batchId),function(a,l,u){let h=a.Vu[a.currentUser.toKey()];h||(h=new Te(z)),h=h.insert(l,u),a.Vu[a.currentUser.toKey()]=h}(s,r.batchId,t),await lr(s,r.changes),await Bi(s.remoteStore)}catch(r){const i=sl(r,"Failed to persist write");t.reject(i)}}async function vf(n,e){const t=q(n);try{const s=await EE(t.localStore,e);e.targetChanges.forEach((r,i)=>{const a=t.Au.get(i);a&&(J(r.addedDocuments.size+r.modifiedDocuments.size+r.removedDocuments.size<=1,22616),r.addedDocuments.size>0?a.hu=!0:r.modifiedDocuments.size>0?J(a.hu,14607):r.removedDocuments.size>0&&(J(a.hu,42227),a.hu=!1))}),await lr(t,s,e)}catch(s){await Zn(s)}}function Ku(n,e,t){const s=q(n);if(s.isPrimaryClient&&t===0||!s.isPrimaryClient&&t===1){const r=[];s.Tu.forEach((i,a)=>{const l=a.view.va(e);l.snapshot&&r.push(l.snapshot)}),function(a,l){const u=q(a);u.onlineState=l;let h=!1;u.queries.forEach((f,p)=>{for(const m of p.Sa)m.va(l)&&(h=!0)}),h&&ol(u)}(s.eventManager,e),r.length&&s.Pu.H_(r),s.onlineState=e,s.isPrimaryClient&&s.sharedClientState.setOnlineState(e)}}async function aT(n,e,t){const s=q(n);s.sharedClientState.updateQueryState(e,"rejected",t);const r=s.Au.get(e),i=r&&r.key;if(i){let a=new Te(M.comparator);a=a.insert(i,Le.newNoDocument(i,j.min()));const l=G().add(i),u=new Li(j.min(),new Map,new Te(z),a,l);await vf(s,u),s.du=s.du.remove(i),s.Au.delete(e),cl(s)}else await ua(s.localStore,e,!1).then(()=>fa(s,e,t)).catch(Zn)}async function lT(n,e){const t=q(n),s=e.batch.batchId;try{const r=await yE(t.localStore,e);If(t,s,null),wf(t,s),t.sharedClientState.updateMutationState(s,"acknowledged"),await lr(t,r)}catch(r){await Zn(r)}}async function cT(n,e,t){const s=q(n);try{const r=await function(a,l){const u=q(a);return u.persistence.runTransaction("Reject batch","readwrite-primary",h=>{let f;return u.mutationQueue.lookupMutationBatch(h,l).next(p=>(J(p!==null,37113),f=p.keys(),u.mutationQueue.removeMutationBatch(h,p))).next(()=>u.mutationQueue.performConsistencyCheck(h)).next(()=>u.documentOverlayCache.removeOverlaysForBatchId(h,f,l)).next(()=>u.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(h,f)).next(()=>u.localDocuments.getDocuments(h,f))})}(s.localStore,e);If(s,e,t),wf(s,e),s.sharedClientState.updateMutationState(e,"rejected",t),await lr(s,r)}catch(r){await Zn(r)}}function wf(n,e){(n.mu.get(e)||[]).forEach(t=>{t.resolve()}),n.mu.delete(e)}function If(n,e,t){const s=q(n);let r=s.Vu[s.currentUser.toKey()];if(r){const i=r.get(e);i&&(t?i.reject(t):i.resolve(),r=r.remove(e)),s.Vu[s.currentUser.toKey()]=r}}function fa(n,e,t=null){n.sharedClientState.removeLocalQueryTarget(e);for(const s of n.Iu.get(e))n.Tu.delete(s),t&&n.Pu.yu(s,t);n.Iu.delete(e),n.isPrimaryClient&&n.Ru.jr(e).forEach(s=>{n.Ru.containsKey(s)||Af(n,s)})}function Af(n,e){n.Eu.delete(e.path.canonicalString());const t=n.du.get(e);t!==null&&(Ja(n.remoteStore,t),n.du=n.du.remove(e),n.Au.delete(t),cl(n))}function Qu(n,e,t){for(const s of t)s instanceof yf?(n.Ru.addReference(s.key,e),uT(n,s)):s instanceof Ef?(x(ll,"Document no longer in limbo: "+s.key),n.Ru.removeReference(s.key,e),n.Ru.containsKey(s.key)||Af(n,s.key)):F(19791,{wu:s})}function uT(n,e){const t=e.key,s=t.path.canonicalString();n.du.get(t)||n.Eu.has(s)||(x(ll,"New document in limbo: "+t),n.Eu.add(s),cl(n))}function cl(n){for(;n.Eu.size>0&&n.du.size<n.maxConcurrentLimboResolutions;){const e=n.Eu.values().next().value;n.Eu.delete(e);const t=new M(re.fromString(e)),s=n.fu.next();n.Au.set(s,new ZE(t)),n.du=n.du.insert(t,s),df(n.remoteStore,new Mt(dt(ki(t.path)),s,"TargetPurposeLimboResolution",bi.ce))}}async function lr(n,e,t){const s=q(n),r=[],i=[],a=[];s.Tu.isEmpty()||(s.Tu.forEach((l,u)=>{a.push(s.pu(u,e,t).then(h=>{var f;if((h||t)&&s.isPrimaryClient){const p=h?!h.fromCache:(f=t==null?void 0:t.targetChanges.get(u.targetId))==null?void 0:f.current;s.sharedClientState.updateQueryState(u.targetId,p?"current":"not-current")}if(h){r.push(h);const p=Ya.As(u.targetId,h);i.push(p)}}))}),await Promise.all(a),s.Pu.H_(r),await async function(u,h){const f=q(u);try{await f.persistence.runTransaction("notifyLocalViewChanges","readwrite",p=>P.forEach(h,m=>P.forEach(m.Es,I=>f.persistence.referenceDelegate.addReference(p,m.targetId,I)).next(()=>P.forEach(m.ds,I=>f.persistence.referenceDelegate.removeReference(p,m.targetId,I)))))}catch(p){if(!es(p))throw p;x(Xa,"Failed to update sequence numbers: "+p)}for(const p of h){const m=p.targetId;if(!p.fromCache){const I=f.Ms.get(m),C=I.snapshotVersion,k=I.withLastLimboFreeSnapshotVersion(C);f.Ms=f.Ms.insert(m,k)}}}(s.localStore,i))}async function hT(n,e){const t=q(n);if(!t.currentUser.isEqual(e)){x(ll,"User change. New user:",e.toKey());const s=await lf(t.localStore,e);t.currentUser=e,function(i,a){i.mu.forEach(l=>{l.forEach(u=>{u.reject(new O(b.CANCELLED,a))})}),i.mu.clear()}(t,"'waitForPendingWrites' promise is rejected due to a user change."),t.sharedClientState.handleUserChange(e,s.removedBatchIds,s.addedBatchIds),await lr(t,s.Ls)}}function dT(n,e){const t=q(n),s=t.Au.get(e);if(s&&s.hu)return G().add(s.key);{let r=G();const i=t.Iu.get(e);if(!i)return r;for(const a of i){const l=t.Tu.get(a);r=r.unionWith(l.view.nu)}return r}}function Rf(n){const e=q(n);return e.remoteStore.remoteSyncer.applyRemoteEvent=vf.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=dT.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=aT.bind(null,e),e.Pu.H_=QE.bind(null,e.eventManager),e.Pu.yu=YE.bind(null,e.eventManager),e}function fT(n){const e=q(n);return e.remoteStore.remoteSyncer.applySuccessfulWrite=lT.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=cT.bind(null,e),e}class ai{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=Fi(e.databaseInfo.databaseId),this.sharedClientState=this.Du(e),this.persistence=this.Cu(e),await this.persistence.start(),this.localStore=this.vu(e),this.gcScheduler=this.Fu(e,this.localStore),this.indexBackfillerScheduler=this.Mu(e,this.localStore)}Fu(e,t){return null}Mu(e,t){return null}vu(e){return gE(this.persistence,new pE,e.initialUser,this.serializer)}Cu(e){return new af(Qa.mi,this.serializer)}Du(e){return new AE}async terminate(){var e,t;(e=this.gcScheduler)==null||e.stop(),(t=this.indexBackfillerScheduler)==null||t.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}ai.provider={build:()=>new ai};class pT extends ai{constructor(e){super(),this.cacheSizeBytes=e}Fu(e,t){J(this.persistence.referenceDelegate instanceof ii,46915);const s=this.persistence.referenceDelegate.garbageCollector;return new Zy(s,e.asyncQueue,t)}Cu(e){const t=this.cacheSizeBytes!==void 0?We.withCacheSize(this.cacheSizeBytes):We.DEFAULT;return new af(s=>ii.mi(s,t),this.serializer)}}class pa{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=s=>Ku(this.syncEngine,s,1),this.remoteStore.remoteSyncer.handleCredentialChange=hT.bind(null,this.syncEngine),await HE(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return function(){return new KE}()}createDatastore(e){const t=Fi(e.databaseInfo.databaseId),s=function(i){return new PE(i)}(e.databaseInfo);return function(i,a,l,u){return new VE(i,a,l,u)}(e.authCredentials,e.appCheckCredentials,s,t)}createRemoteStore(e){return function(s,r,i,a,l){return new xE(s,r,i,a,l)}(this.localStore,this.datastore,e.asyncQueue,t=>Ku(this.syncEngine,t,0),function(){return ju.v()?new ju:new RE}())}createSyncEngine(e,t){return function(r,i,a,l,u,h,f){const p=new eT(r,i,a,l,u,h);return f&&(p.gu=!0),p}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){var e,t;await async function(r){const i=q(r);x(mn,"RemoteStore shutting down."),i.Ea.add(5),await ar(i),i.Aa.shutdown(),i.Ra.set("Unknown")}(this.remoteStore),(e=this.datastore)==null||e.terminate(),(t=this.eventManager)==null||t.terminate()}}pa.provider={build:()=>new pa};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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
 */class ul{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Ou(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Ou(this.observer.error,e):Ct("Uncaught Error in snapshot listener:",e.toString()))}Nu(){this.muted=!0}Ou(e,t){setTimeout(()=>{this.muted||e(t)},0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Kt="FirestoreClient";class _T{constructor(e,t,s,r,i){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=s,this.databaseInfo=r,this.user=Me.UNAUTHENTICATED,this.clientId=Fa.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=i,this.authCredentials.start(s,async a=>{x(Kt,"Received user=",a.uid),await this.authCredentialListener(a),this.user=a}),this.appCheckCredentials.start(s,a=>(x(Kt,"Received new app check token=",a),this.appCheckCredentialListener(a,this.user)))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this.databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();const e=new ht;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){const s=sl(t,"Failed to shutdown persistence");e.reject(s)}}),e.promise}}async function Vo(n,e){n.asyncQueue.verifyOperationInProgress(),x(Kt,"Initializing OfflineComponentProvider");const t=n.configuration;await e.initialize(t);let s=t.initialUser;n.setCredentialChangeListener(async r=>{s.isEqual(r)||(await lf(e.localStore,r),s=r)}),e.persistence.setDatabaseDeletedListener(()=>n.terminate()),n._offlineComponents=e}async function Yu(n,e){n.asyncQueue.verifyOperationInProgress();const t=await mT(n);x(Kt,"Initializing OnlineComponentProvider"),await e.initialize(t,n.configuration),n.setCredentialChangeListener(s=>Wu(e.remoteStore,s)),n.setAppCheckTokenChangeListener((s,r)=>Wu(e.remoteStore,r)),n._onlineComponents=e}async function mT(n){if(!n._offlineComponents)if(n._uninitializedComponentsProvider){x(Kt,"Using user provided OfflineComponentProvider");try{await Vo(n,n._uninitializedComponentsProvider._offline)}catch(e){const t=e;if(!function(r){return r.name==="FirebaseError"?r.code===b.FAILED_PRECONDITION||r.code===b.UNIMPLEMENTED:!(typeof DOMException<"u"&&r instanceof DOMException)||r.code===22||r.code===20||r.code===11}(t))throw t;qn("Error using user provided cache. Falling back to memory cache: "+t),await Vo(n,new ai)}}else x(Kt,"Using default OfflineComponentProvider"),await Vo(n,new pT(void 0));return n._offlineComponents}async function hl(n){return n._onlineComponents||(n._uninitializedComponentsProvider?(x(Kt,"Using user provided OnlineComponentProvider"),await Yu(n,n._uninitializedComponentsProvider._online)):(x(Kt,"Using default OnlineComponentProvider"),await Yu(n,new pa))),n._onlineComponents}function gT(n){return hl(n).then(e=>e.syncEngine)}function yT(n){return hl(n).then(e=>e.datastore)}async function li(n){const e=await hl(n),t=e.eventManager;return t.onListen=tT.bind(null,e.syncEngine),t.onUnlisten=rT.bind(null,e.syncEngine),t.onFirstRemoteStoreListen=nT.bind(null,e.syncEngine),t.onLastRemoteStoreUnlisten=iT.bind(null,e.syncEngine),t}function ET(n,e,t={}){const s=new ht;return n.asyncQueue.enqueueAndForget(async()=>function(i,a,l,u,h){const f=new ul({next:m=>{f.Nu(),a.enqueueAndForget(()=>il(i,p));const I=m.docs.has(l);!I&&m.fromCache?h.reject(new O(b.UNAVAILABLE,"Failed to get document because the client is offline.")):I&&m.fromCache&&u&&u.source==="server"?h.reject(new O(b.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):h.resolve(m)},error:m=>h.reject(m)}),p=new al(ki(l.path),f,{includeMetadataChanges:!0,qa:!0});return rl(i,p)}(await li(n),n.asyncQueue,e,t,s)),s.promise}function TT(n,e,t={}){const s=new ht;return n.asyncQueue.enqueueAndForget(async()=>function(i,a,l,u,h){const f=new ul({next:m=>{f.Nu(),a.enqueueAndForget(()=>il(i,p)),m.fromCache&&u.source==="server"?h.reject(new O(b.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):h.resolve(m)},error:m=>h.reject(m)}),p=new al(l,f,{includeMetadataChanges:!0,qa:!0});return rl(i,p)}(await li(n),n.asyncQueue,e,t,s)),s.promise}function vT(n,e,t){const s=new ht;return n.asyncQueue.enqueueAndForget(async()=>{try{const r=await yT(n);s.resolve(async function(a,l,u){var k;const h=q(a),{request:f,gt:p,parent:m}=By(h.serializer,iy(l),u);h.connection.$o||delete f.parent;const I=(await h.Ho("RunAggregationQuery",h.serializer.databaseId,m,f,1)).filter(N=>!!N.result);J(I.length===1,64727);const C=(k=I[0].result)==null?void 0:k.aggregateFields;return Object.keys(C).reduce((N,B)=>(N[p[B]]=C[B],N),{})}(r,e,t))}catch(r){s.reject(r)}}),s.promise}/**
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
 */function Cf(n){const e={};return n.timeoutSeconds!==void 0&&(e.timeoutSeconds=n.timeoutSeconds),e}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xu=new Map;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Sf="firestore.googleapis.com",Ju=!0;class Zu{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new O(b.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=Sf,this.ssl=Ju}else this.host=e.host,this.ssl=e.ssl??Ju;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e.cacheSizeBytes===void 0)this.cacheSizeBytes=of;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<Xy)throw new O(b.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}Dg("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=Cf(e.experimentalLongPollingOptions??{}),function(s){if(s.timeoutSeconds!==void 0){if(isNaN(s.timeoutSeconds))throw new O(b.INVALID_ARGUMENT,`invalid long polling timeout: ${s.timeoutSeconds} (must not be NaN)`);if(s.timeoutSeconds<5)throw new O(b.INVALID_ARGUMENT,`invalid long polling timeout: ${s.timeoutSeconds} (minimum allowed value is 5)`);if(s.timeoutSeconds>30)throw new O(b.INVALID_ARGUMENT,`invalid long polling timeout: ${s.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&function(s,r){return s.timeoutSeconds===r.timeoutSeconds}(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams}}class qi{constructor(e,t,s,r){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=s,this._app=r,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Zu({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new O(b.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new O(b.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Zu(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=function(s){if(!s)return new wg;switch(s.type){case"firstParty":return new Cg(s.sessionIndex||"0",s.iamToken||null,s.authTokenFactory||null);case"provider":return s.client;default:throw new O(b.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(t){const s=Xu.get(t);s&&(x("ComponentProvider","Removing Datastore"),Xu.delete(t),s.terminate())}(this),Promise.resolve()}}function wT(n,e,t,s={}){var h;n=Fe(n,qi);const r=Yt(e),i=n._getSettings(),a={...i,emulatorOptions:n._getEmulatorOptions()},l=`${e}:${t}`;r&&(vi(`https://${l}`),wi("Firestore",!0)),i.host!==Sf&&i.host!==l&&qn("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const u={...i,host:l,ssl:r,emulatorOptions:s};if(!zs(u,a)&&(n._setSettings(u),s.mockUserToken)){let f,p;if(typeof s.mockUserToken=="string")f=s.mockUserToken,p=Me.MOCK_USER;else{f=Oa(s.mockUserToken,(h=n._app)==null?void 0:h.options.projectId);const m=s.mockUserToken.sub||s.mockUserToken.user_id;if(!m)throw new O(b.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");p=new Me(m)}n._authCredentials=new Ig(new _d(f,p))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class en{constructor(e,t,s){this.converter=t,this._query=s,this.type="query",this.firestore=e}withConverter(e){return new en(this.firestore,e,this._query)}}class ue{constructor(e,t,s){this.converter=t,this._key=s,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Bt(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new ue(this.firestore,e,this._key)}toJSON(){return{type:ue._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,s){if(rr(t,ue._jsonSchema))return new ue(e,s||null,new M(re.fromString(t.referencePath)))}}ue._jsonSchemaVersion="firestore/documentReference/1.0",ue._jsonSchema={type:Ee("string",ue._jsonSchemaVersion),referencePath:Ee("string")};class Bt extends en{constructor(e,t,s){super(e,t,ki(s)),this._path=s,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new ue(this.firestore,null,new M(e))}withConverter(e){return new Bt(this.firestore,e,this._path)}}function _R(n,e,...t){if(n=ie(n),md("collection","path",e),n instanceof qi){const s=re.fromString(e,...t);return du(s),new Bt(n,null,s)}{if(!(n instanceof ue||n instanceof Bt))throw new O(b.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const s=n._path.child(re.fromString(e,...t));return du(s),new Bt(n.firestore,null,s)}}function IT(n,e,...t){if(n=ie(n),arguments.length===1&&(e=Fa.newId()),md("doc","path",e),n instanceof qi){const s=re.fromString(e,...t);return hu(s),new ue(n,null,new M(s))}{if(!(n instanceof ue||n instanceof Bt))throw new O(b.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const s=n._path.child(re.fromString(e,...t));return hu(s),new ue(n.firestore,n instanceof Bt?n.converter:null,new M(s))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const eh="AsyncQueue";class th{constructor(e=Promise.resolve()){this.Xu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new uf(this,"async_queue_retry"),this._c=()=>{const s=Do();s&&x(eh,"Visibility state changed to "+s.visibilityState),this.M_.w_()},this.ac=e;const t=Do();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.uc(),this.cc(e)}enterRestrictedMode(e){if(!this.ec){this.ec=!0,this.sc=e||!1;const t=Do();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this._c)}}enqueue(e){if(this.uc(),this.ec)return new Promise(()=>{});const t=new ht;return this.cc(()=>this.ec&&this.sc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise)).then(()=>t.promise)}enqueueRetryable(e){this.enqueueAndForget(()=>(this.Xu.push(e),this.lc()))}async lc(){if(this.Xu.length!==0){try{await this.Xu[0](),this.Xu.shift(),this.M_.reset()}catch(e){if(!es(e))throw e;x(eh,"Operation failed with retryable error: "+e)}this.Xu.length>0&&this.M_.p_(()=>this.lc())}}cc(e){const t=this.ac.then(()=>(this.rc=!0,e().catch(s=>{throw this.nc=s,this.rc=!1,Ct("INTERNAL UNHANDLED ERROR: ",nh(s)),s}).then(s=>(this.rc=!1,s))));return this.ac=t,t}enqueueAfterDelay(e,t,s){this.uc(),this.oc.indexOf(e)>-1&&(t=0);const r=nl.createAndSchedule(this,e,t,s,i=>this.hc(i));return this.tc.push(r),r}uc(){this.nc&&F(47125,{Pc:nh(this.nc)})}verifyOperationInProgress(){}async Tc(){let e;do e=this.ac,await e;while(e!==this.ac)}Ic(e){for(const t of this.tc)if(t.timerId===e)return!0;return!1}Ec(e){return this.Tc().then(()=>{this.tc.sort((t,s)=>t.targetTimeMs-s.targetTimeMs);for(const t of this.tc)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.Tc()})}dc(e){this.oc.push(e)}hc(e){const t=this.tc.indexOf(e);this.tc.splice(t,1)}}function nh(n){let e=n.message||"";return n.stack&&(e=n.stack.includes(n.message)?n.stack:n.message+`
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
 */function sh(n){return function(t,s){if(typeof t!="object"||t===null)return!1;const r=t;for(const i of s)if(i in r&&typeof r[i]=="function")return!0;return!1}(n,["next","error","complete"])}class at extends qi{constructor(e,t,s,r){super(e,t,s,r),this.type="firestore",this._queue=new th,this._persistenceKey=(r==null?void 0:r.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new th(e),this._firestoreClient=void 0,await e}}}function AT(n,e){const t=typeof n=="object"?n:Ci(),s=typeof n=="string"?n:e,r=Ai(t,"firestore").getImmediate({identifier:s});if(!r._initialized){const i=Ti("firestore");i&&wT(r,...i)}return r}function ss(n){if(n._terminated)throw new O(b.FAILED_PRECONDITION,"The client has already been terminated.");return n._firestoreClient||RT(n),n._firestoreClient}function RT(n){var s,r,i;const e=n._freezeSettings(),t=function(l,u,h,f){return new Wg(l,u,h,f.host,f.ssl,f.experimentalForceLongPolling,f.experimentalAutoDetectLongPolling,Cf(f.experimentalLongPollingOptions),f.useFetchStreams,f.isUsingEmulator)}(n._databaseId,((s=n._app)==null?void 0:s.options.appId)||"",n._persistenceKey,e);n._componentsProvider||(r=e.localCache)!=null&&r._offlineComponentProvider&&((i=e.localCache)!=null&&i._onlineComponentProvider)&&(n._componentsProvider={_offline:e.localCache._offlineComponentProvider,_online:e.localCache._onlineComponentProvider}),n._firestoreClient=new _T(n._authCredentials,n._appCheckCredentials,n._queue,t,n._componentsProvider&&function(l){const u=l==null?void 0:l._online.build();return{_offline:l==null?void 0:l._offline.build(u),_online:u}}(n._componentsProvider))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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
 */class CT{constructor(e="count",t){this._internalFieldPath=t,this.type="AggregateField",this.aggregateType=e}}class ST{constructor(e,t,s){this._userDataWriter=t,this._data=s,this.type="AggregateQuerySnapshot",this.query=e}data(){return this._userDataWriter.convertObjectMap(this._data)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ze{constructor(e){this._byteString=e}static fromBase64String(e){try{return new Ze(Ne.fromBase64String(e))}catch(t){throw new O(b.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new Ze(Ne.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:Ze._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(rr(e,Ze._jsonSchema))return Ze.fromBase64String(e.bytes)}}Ze._jsonSchemaVersion="firestore/bytes/1.0",Ze._jsonSchema={type:Ee("string",Ze._jsonSchemaVersion),bytes:Ee("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rs{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new O(b.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new be(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}function mR(){return new rs(Xo)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ji{constructor(e){this._methodName=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pt{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new O(b.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new O(b.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return z(this._lat,e._lat)||z(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:pt._jsonSchemaVersion}}static fromJSON(e){if(rr(e,pt._jsonSchema))return new pt(e.latitude,e.longitude)}}pt._jsonSchemaVersion="firestore/geoPoint/1.0",pt._jsonSchema={type:Ee("string",pt._jsonSchemaVersion),latitude:Ee("number"),longitude:Ee("number")};/**
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
 */class _t{constructor(e){this._values=(e||[]).map(t=>t)}toArray(){return this._values.map(e=>e)}isEqual(e){return function(s,r){if(s.length!==r.length)return!1;for(let i=0;i<s.length;++i)if(s[i]!==r[i])return!1;return!0}(this._values,e._values)}toJSON(){return{type:_t._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(rr(e,_t._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every(t=>typeof t=="number"))return new _t(e.vectorValues);throw new O(b.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}_t._jsonSchemaVersion="firestore/vectorValue/1.0",_t._jsonSchema={type:Ee("string",_t._jsonSchemaVersion),vectorValues:Ee("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bT=/^__.*__$/;class PT{constructor(e,t,s){this.data=e,this.fieldMask=t,this.fieldTransforms=s}toMutation(e,t){return this.fieldMask!==null?new Zt(e,this.data,this.fieldMask,t,this.fieldTransforms):new ir(e,this.data,t,this.fieldTransforms)}}class bf{constructor(e,t,s){this.data=e,this.fieldMask=t,this.fieldTransforms=s}toMutation(e,t){return new Zt(e,this.data,this.fieldMask,t,this.fieldTransforms)}}function Pf(n){switch(n){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw F(40011,{Ac:n})}}class dl{constructor(e,t,s,r,i,a){this.settings=e,this.databaseId=t,this.serializer=s,this.ignoreUndefinedProperties=r,i===void 0&&this.Rc(),this.fieldTransforms=i||[],this.fieldMask=a||[]}get path(){return this.settings.path}get Ac(){return this.settings.Ac}Vc(e){return new dl({...this.settings,...e},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}mc(e){var r;const t=(r=this.path)==null?void 0:r.child(e),s=this.Vc({path:t,fc:!1});return s.gc(e),s}yc(e){var r;const t=(r=this.path)==null?void 0:r.child(e),s=this.Vc({path:t,fc:!1});return s.Rc(),s}wc(e){return this.Vc({path:void 0,fc:!0})}Sc(e){return ci(e,this.settings.methodName,this.settings.bc||!1,this.path,this.settings.Dc)}contains(e){return this.fieldMask.find(t=>e.isPrefixOf(t))!==void 0||this.fieldTransforms.find(t=>e.isPrefixOf(t.field))!==void 0}Rc(){if(this.path)for(let e=0;e<this.path.length;e++)this.gc(this.path.get(e))}gc(e){if(e.length===0)throw this.Sc("Document fields must not be empty");if(Pf(this.Ac)&&bT.test(e))throw this.Sc('Document fields cannot begin and end with "__"')}}class NT{constructor(e,t,s){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=s||Fi(e)}Cc(e,t,s,r=!1){return new dl({Ac:e,methodName:t,Dc:s,path:be.emptyPath(),fc:!1,bc:r},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function cr(n){const e=n._freezeSettings(),t=Fi(n._databaseId);return new NT(n._databaseId,!!e.ignoreUndefinedProperties,t)}function fl(n,e,t,s,r,i={}){const a=n.Cc(i.merge||i.mergeFields?2:0,e,t,r);_l("Data must be an object, but it was:",a,s);const l=Df(s,a);let u,h;if(i.merge)u=new Xe(a.fieldMask),h=a.fieldTransforms;else if(i.mergeFields){const f=[];for(const p of i.mergeFields){const m=_a(e,p,t);if(!a.contains(m))throw new O(b.INVALID_ARGUMENT,`Field '${m}' is specified in your field mask but missing from your input data.`);Of(f,m)||f.push(m)}u=new Xe(f),h=a.fieldTransforms.filter(p=>u.covers(p.field))}else u=null,h=a.fieldTransforms;return new PT(new ze(l),u,h)}class $i extends ji{_toFieldTransform(e){if(e.Ac!==2)throw e.Ac===1?e.Sc(`${this._methodName}() can only appear at the top level of your update data`):e.Sc(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof $i}}class pl extends ji{_toFieldTransform(e){return new my(e.path,new Js)}isEqual(e){return e instanceof pl}}function Nf(n,e,t,s){const r=n.Cc(1,e,t);_l("Data must be an object, but it was:",r,s);const i=[],a=ze.empty();Jt(s,(u,h)=>{const f=ml(e,u,t);h=ie(h);const p=r.yc(f);if(h instanceof $i)i.push(f);else{const m=ur(h,p);m!=null&&(i.push(f),a.set(f,m))}});const l=new Xe(i);return new bf(a,l,r.fieldTransforms)}function kf(n,e,t,s,r,i){const a=n.Cc(1,e,t),l=[_a(e,s,t)],u=[r];if(i.length%2!=0)throw new O(b.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let m=0;m<i.length;m+=2)l.push(_a(e,i[m])),u.push(i[m+1]);const h=[],f=ze.empty();for(let m=l.length-1;m>=0;--m)if(!Of(h,l[m])){const I=l[m];let C=u[m];C=ie(C);const k=a.yc(I);if(C instanceof $i)h.push(I);else{const N=ur(C,k);N!=null&&(h.push(I),f.set(I,N))}}const p=new Xe(h);return new bf(f,p,a.fieldTransforms)}function kT(n,e,t,s=!1){return ur(t,n.Cc(s?4:3,e))}function ur(n,e){if(Vf(n=ie(n)))return _l("Unsupported field value:",e,n),Df(n,e);if(n instanceof ji)return function(s,r){if(!Pf(r.Ac))throw r.Sc(`${s._methodName}() can only be used with update() and set()`);if(!r.path)throw r.Sc(`${s._methodName}() is not currently supported inside arrays`);const i=s._toFieldTransform(r);i&&r.fieldTransforms.push(i)}(n,e),null;if(n===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),n instanceof Array){if(e.settings.fc&&e.Ac!==4)throw e.Sc("Nested arrays are not supported");return function(s,r){const i=[];let a=0;for(const l of s){let u=ur(l,r.wc(a));u==null&&(u={nullValue:"NULL_VALUE"}),i.push(u),a++}return{arrayValue:{values:i}}}(n,e)}return function(s,r){if((s=ie(s))===null)return{nullValue:"NULL_VALUE"};if(typeof s=="number")return fy(r.serializer,s);if(typeof s=="boolean")return{booleanValue:s};if(typeof s=="string")return{stringValue:s};if(s instanceof Date){const i=le.fromDate(s);return{timestampValue:ri(r.serializer,i)}}if(s instanceof le){const i=new le(s.seconds,1e3*Math.floor(s.nanoseconds/1e3));return{timestampValue:ri(r.serializer,i)}}if(s instanceof pt)return{geoPointValue:{latitude:s.latitude,longitude:s.longitude}};if(s instanceof Ze)return{bytesValue:Xd(r.serializer,s._byteString)};if(s instanceof ue){const i=r.databaseId,a=s.firestore._databaseId;if(!a.isEqual(i))throw r.Sc(`Document reference is for database ${a.projectId}/${a.database} but should be for database ${i.projectId}/${i.database}`);return{referenceValue:Ga(s.firestore._databaseId||r.databaseId,s._key.path)}}if(s instanceof _t)return function(a,l){return{mapValue:{fields:{[Rd]:{stringValue:Cd},[ti]:{arrayValue:{values:a.toArray().map(h=>{if(typeof h!="number")throw l.Sc("VectorValues must only contain numeric values.");return Wa(l.serializer,h)})}}}}}}(s,r);throw r.Sc(`Unsupported field value: ${Si(s)}`)}(n,e)}function Df(n,e){const t={};return Ed(n)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):Jt(n,(s,r)=>{const i=ur(r,e.mc(s));i!=null&&(t[s]=i)}),{mapValue:{fields:t}}}function Vf(n){return!(typeof n!="object"||n===null||n instanceof Array||n instanceof Date||n instanceof le||n instanceof pt||n instanceof Ze||n instanceof ue||n instanceof ji||n instanceof _t)}function _l(n,e,t){if(!Vf(t)||!gd(t)){const s=Si(t);throw s==="an object"?e.Sc(n+" a custom object"):e.Sc(n+" "+s)}}function _a(n,e,t){if((e=ie(e))instanceof rs)return e._internalPath;if(typeof e=="string")return ml(n,e);throw ci("Field path arguments must be of type string or ",n,!1,void 0,t)}const DT=new RegExp("[~\\*/\\[\\]]");function ml(n,e,t){if(e.search(DT)>=0)throw ci(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,n,!1,void 0,t);try{return new rs(...e.split("."))._internalPath}catch{throw ci(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,n,!1,void 0,t)}}function ci(n,e,t,s,r){const i=s&&!s.isEmpty(),a=r!==void 0;let l=`Function ${e}() called with invalid data`;t&&(l+=" (via `toFirestore()`)"),l+=". ";let u="";return(i||a)&&(u+=" (found",i&&(u+=` in field ${s}`),a&&(u+=` in document ${r}`),u+=")"),new O(b.INVALID_ARGUMENT,l+n+u)}function Of(n,e){return n.some(t=>t.isEqual(e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xf{constructor(e,t,s,r,i){this._firestore=e,this._userDataWriter=t,this._key=s,this._document=r,this._converter=i}get id(){return this._key.path.lastSegment()}get ref(){return new ue(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new VT(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}get(e){if(this._document){const t=this._document.data.field(Wi("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}}class VT extends xf{data(){return super.data()}}function Wi(n,e){return typeof e=="string"?ml(n,e):e instanceof rs?e._internalPath:e._delegate._internalPath}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Mf(n){if(n.limitType==="L"&&n.explicitOrderBy.length===0)throw new O(b.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class gl{}class Lf extends gl{}function gR(n,e,...t){let s=[];e instanceof gl&&s.push(e),s=s.concat(t),function(i){const a=i.filter(u=>u instanceof yl).length,l=i.filter(u=>u instanceof zi).length;if(a>1||a>0&&l>0)throw new O(b.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")}(s);for(const r of s)n=r._apply(n);return n}class zi extends Lf{constructor(e,t,s){super(),this._field=e,this._op=t,this._value=s,this.type="where"}static _create(e,t,s){return new zi(e,t,s)}_apply(e){const t=this._parse(e);return Ff(e._query,t),new en(e.firestore,e.converter,ra(e._query,t))}_parse(e){const t=cr(e.firestore);return function(i,a,l,u,h,f,p){let m;if(h.isKeyField()){if(f==="array-contains"||f==="array-contains-any")throw new O(b.INVALID_ARGUMENT,`Invalid Query. You can't perform '${f}' queries on documentId().`);if(f==="in"||f==="not-in"){ih(p,f);const C=[];for(const k of p)C.push(rh(u,i,k));m={arrayValue:{values:C}}}else m=rh(u,i,p)}else f!=="in"&&f!=="not-in"&&f!=="array-contains-any"||ih(p,f),m=kT(l,a,p,f==="in"||f==="not-in");return ye.create(h,f,m)}(e._query,"where",t,e.firestore._databaseId,this._field,this._op,this._value)}}function yR(n,e,t){const s=e,r=Wi("where",n);return zi._create(r,s,t)}class yl extends gl{constructor(e,t){super(),this.type=e,this._queryConstraints=t}static _create(e,t){return new yl(e,t)}_parse(e){const t=this._queryConstraints.map(s=>s._parse(e)).filter(s=>s.getFilters().length>0);return t.length===1?t[0]:ot.create(t,this._getOperator())}_apply(e){const t=this._parse(e);return t.getFilters().length===0?e:(function(r,i){let a=r;const l=i.getFlattenedFilters();for(const u of l)Ff(a,u),a=ra(a,u)}(e._query,t),new en(e.firestore,e.converter,ra(e._query,t)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}class El extends Lf{constructor(e,t){super(),this._field=e,this._direction=t,this.type="orderBy"}static _create(e,t){return new El(e,t)}_apply(e){const t=function(r,i,a){if(r.startAt!==null)throw new O(b.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(r.endAt!==null)throw new O(b.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new Xs(i,a)}(e._query,this._field,this._direction);return new en(e.firestore,e.converter,function(r,i){const a=r.explicitOrderBy.concat([i]);return new ts(r.path,r.collectionGroup,a,r.filters.slice(),r.limit,r.limitType,r.startAt,r.endAt)}(e._query,t))}}function ER(n,e="asc"){const t=e,s=Wi("orderBy",n);return El._create(s,t)}function rh(n,e,t){if(typeof(t=ie(t))=="string"){if(t==="")throw new O(b.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!Od(e)&&t.indexOf("/")!==-1)throw new O(b.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${t}' contains a '/' character.`);const s=e.path.child(re.fromString(t));if(!M.isDocumentKey(s))throw new O(b.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${s}' is not because it has an odd number of segments (${s.length}).`);return Tu(n,new M(s))}if(t instanceof ue)return Tu(n,t._key);throw new O(b.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${Si(t)}.`)}function ih(n,e){if(!Array.isArray(n)||n.length===0)throw new O(b.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`)}function Ff(n,e){const t=function(r,i){for(const a of r)for(const l of a.getFlattenedFilters())if(i.indexOf(l.op)>=0)return l.op;return null}(n.filters,function(r){switch(r){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}}(e.op));if(t!==null)throw t===e.op?new O(b.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new O(b.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${t.toString()}' filters.`)}class OT{convertValue(e,t="none"){switch(Ht(e)){case 0:return null;case 1:return e.booleanValue;case 2:return pe(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,t);case 5:return e.stringValue;case 6:return this.convertBytes(zt(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,t);case 11:return this.convertObject(e.mapValue,t);case 10:return this.convertVectorValue(e.mapValue);default:throw F(62114,{value:e})}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){const s={};return Jt(e,(r,i)=>{s[r]=this.convertValue(i,t)}),s}convertVectorValue(e){var s,r,i;const t=(i=(r=(s=e.fields)==null?void 0:s[ti].arrayValue)==null?void 0:r.values)==null?void 0:i.map(a=>pe(a.doubleValue));return new _t(t)}convertGeoPoint(e){return new pt(pe(e.latitude),pe(e.longitude))}convertArray(e,t){return(e.values||[]).map(s=>this.convertValue(s,t))}convertServerTimestamp(e,t){switch(t){case"previous":const s=Ni(e);return s==null?null:this.convertValue(s,t);case"estimate":return this.convertTimestamp(Ks(e));default:return null}}convertTimestamp(e){const t=Wt(e);return new le(t.seconds,t.nanos)}convertDocumentKey(e,t){const s=re.fromString(e);J(rf(s),9688,{name:e});const r=new Qs(s.get(1),s.get(3)),i=new M(s.popFirst(5));return r.isEqual(t)||Ct(`Document ${i} contains a document reference within a different database (${r.projectId}/${r.database}) which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),i}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Tl(n,e,t){let s;return s=n?t&&(t.merge||t.mergeFields)?n.toFirestore(e,t):n.toFirestore(e):e,s}function xT(){return new CT("count")}class Vs{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class hn extends xf{constructor(e,t,s,r,i,a){super(e,t,s,r,a),this._firestore=e,this._firestoreImpl=e,this.metadata=i}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new Qr(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const s=this._document.data.field(Wi("DocumentSnapshot.get",e));if(s!==null)return this._userDataWriter.convertValue(s,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new O(b.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=hn._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}}hn._jsonSchemaVersion="firestore/documentSnapshot/1.0",hn._jsonSchema={type:Ee("string",hn._jsonSchemaVersion),bundleSource:Ee("string","DocumentSnapshot"),bundleName:Ee("string"),bundle:Ee("string")};class Qr extends hn{data(e={}){return super.data(e)}}class dn{constructor(e,t,s,r){this._firestore=e,this._userDataWriter=t,this._snapshot=r,this.metadata=new Vs(r.hasPendingWrites,r.fromCache),this.query=s}get docs(){const e=[];return this.forEach(t=>e.push(t)),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach(s=>{e.call(t,new Qr(this._firestore,this._userDataWriter,s.key,s,new Vs(this._snapshot.mutatedKeys.has(s.key),this._snapshot.fromCache),this.query.converter))})}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new O(b.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=function(r,i){if(r._snapshot.oldDocs.isEmpty()){let a=0;return r._snapshot.docChanges.map(l=>{const u=new Qr(r._firestore,r._userDataWriter,l.doc.key,l.doc,new Vs(r._snapshot.mutatedKeys.has(l.doc.key),r._snapshot.fromCache),r.query.converter);return l.doc,{type:"added",doc:u,oldIndex:-1,newIndex:a++}})}{let a=r._snapshot.oldDocs;return r._snapshot.docChanges.filter(l=>i||l.type!==3).map(l=>{const u=new Qr(r._firestore,r._userDataWriter,l.doc.key,l.doc,new Vs(r._snapshot.mutatedKeys.has(l.doc.key),r._snapshot.fromCache),r.query.converter);let h=-1,f=-1;return l.type!==0&&(h=a.indexOf(l.doc.key),a=a.delete(l.doc.key)),l.type!==1&&(a=a.add(l.doc),f=a.indexOf(l.doc.key)),{type:MT(l.type),doc:u,oldIndex:h,newIndex:f}})}}(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new O(b.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=dn._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=Fa.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],s=[],r=[];return this.docs.forEach(i=>{i._document!==null&&(t.push(i._document),s.push(this._userDataWriter.convertObjectMap(i._document.data.value.mapValue.fields,"previous")),r.push(i.ref.path))}),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function MT(n){switch(n){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return F(61501,{type:n})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function TR(n){n=Fe(n,ue);const e=Fe(n.firestore,at);return ET(ss(e),n._key).then(t=>Uf(e,n,t))}dn._jsonSchemaVersion="firestore/querySnapshot/1.0",dn._jsonSchema={type:Ee("string",dn._jsonSchemaVersion),bundleSource:Ee("string","QuerySnapshot"),bundleName:Ee("string"),bundle:Ee("string")};class Hi extends OT{constructor(e){super(),this.firestore=e}convertBytes(e){return new Ze(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new ue(this.firestore,null,t)}}function vR(n){n=Fe(n,en);const e=Fe(n.firestore,at),t=ss(e),s=new Hi(e);return Mf(n._query),TT(t,n._query).then(r=>new dn(e,s,n,r))}function wR(n,e,t){n=Fe(n,ue);const s=Fe(n.firestore,at),r=Tl(n.converter,e,t);return hr(s,[fl(cr(s),"setDoc",n._key,r,n.converter!==null,t).toMutation(n._key,je.none())])}function IR(n,e,t,...s){n=Fe(n,ue);const r=Fe(n.firestore,at),i=cr(r);let a;return a=typeof(e=ie(e))=="string"||e instanceof rs?kf(i,"updateDoc",n._key,e,t,s):Nf(i,"updateDoc",n._key,e),hr(r,[a.toMutation(n._key,je.exists(!0))])}function AR(n){return hr(Fe(n.firestore,at),[new Mi(n._key,je.none())])}function RR(n,e){const t=Fe(n.firestore,at),s=IT(n),r=Tl(n.converter,e);return hr(t,[fl(cr(n.firestore),"addDoc",s._key,r,n.converter!==null,{}).toMutation(s._key,je.exists(!1))]).then(()=>s)}function CR(n,...e){var u,h,f;n=ie(n);let t={includeMetadataChanges:!1,source:"default"},s=0;typeof e[s]!="object"||sh(e[s])||(t=e[s++]);const r={includeMetadataChanges:t.includeMetadataChanges,source:t.source};if(sh(e[s])){const p=e[s];e[s]=(u=p.next)==null?void 0:u.bind(p),e[s+1]=(h=p.error)==null?void 0:h.bind(p),e[s+2]=(f=p.complete)==null?void 0:f.bind(p)}let i,a,l;if(n instanceof ue)a=Fe(n.firestore,at),l=ki(n._key.path),i={next:p=>{e[s]&&e[s](Uf(a,n,p))},error:e[s+1],complete:e[s+2]};else{const p=Fe(n,en);a=Fe(p.firestore,at),l=p._query;const m=new Hi(a);i={next:I=>{e[s]&&e[s](new dn(a,m,p,I))},error:e[s+1],complete:e[s+2]},Mf(n._query)}return function(m,I,C,k){const N=new ul(k),B=new al(I,N,C);return m.asyncQueue.enqueueAndForget(async()=>rl(await li(m),B)),()=>{N.Nu(),m.asyncQueue.enqueueAndForget(async()=>il(await li(m),B))}}(ss(a),l,r,i)}function hr(n,e){return function(s,r){const i=new ht;return s.asyncQueue.enqueueAndForget(async()=>oT(await gT(s),r,i)),i.promise}(ss(n),e)}function Uf(n,e,t){const s=t.docs.get(e._key),r=new Hi(n);return new hn(n,r,e._key,s,new Vs(t.hasPendingWrites,t.fromCache),e.converter)}function SR(n){return LT(n,{count:xT()})}function LT(n,e){const t=Fe(n.firestore,at),s=ss(t),r=jg(e,(i,a)=>new Ay(a,i.aggregateType,i._internalFieldPath));return vT(s,n._query,r).then(i=>function(l,u,h){const f=new Hi(l);return new ST(u,f,h)}(t,n,i))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class FT{constructor(e,t){this._firestore=e,this._commitHandler=t,this._mutations=[],this._committed=!1,this._dataReader=cr(e)}set(e,t,s){this._verifyNotCommitted();const r=Oo(e,this._firestore),i=Tl(r.converter,t,s),a=fl(this._dataReader,"WriteBatch.set",r._key,i,r.converter!==null,s);return this._mutations.push(a.toMutation(r._key,je.none())),this}update(e,t,s,...r){this._verifyNotCommitted();const i=Oo(e,this._firestore);let a;return a=typeof(t=ie(t))=="string"||t instanceof rs?kf(this._dataReader,"WriteBatch.update",i._key,t,s,r):Nf(this._dataReader,"WriteBatch.update",i._key,t),this._mutations.push(a.toMutation(i._key,je.exists(!0))),this}delete(e){this._verifyNotCommitted();const t=Oo(e,this._firestore);return this._mutations=this._mutations.concat(new Mi(t._key,je.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new O(b.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function Oo(n,e){if((n=ie(n)).firestore!==e)throw new O(b.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return n}function bR(){return new pl("serverTimestamp")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function PR(n){return ss(n=Fe(n,at)),new FT(n,e=>hr(n,e))}(function(e,t=!0){(function(r){Jn=r})(Ma),pn(new jt("firestore",(s,{instanceIdentifier:r,options:i})=>{const a=s.getProvider("app").getImmediate(),l=new at(new Ag(s.getProvider("auth-internal")),new Sg(a,s.getProvider("app-check-internal")),function(h,f){if(!Object.prototype.hasOwnProperty.apply(h.options,["projectId"]))throw new O(b.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new Qs(h.options.projectId,f)}(a,r),a);return i={useFetchStreams:t,...i},l._setSettings(i),l},"PUBLIC").setMultipleInstances(!0)),nt(lu,cu,e),nt(lu,cu,"esm2020")})();/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bf="firebasestorage.googleapis.com",qf="storageBucket",UT=2*60*1e3,BT=10*60*1e3;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class de extends Xt{constructor(e,t,s=0){super(xo(e),`Firebase Storage: ${t} (${xo(e)})`),this.status_=s,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,de.prototype)}get status(){return this.status_}set status(e){this.status_=e}_codeEquals(e){return xo(e)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(e){this.customData.serverResponse=e,this.customData.serverResponse?this.message=`${this._baseMessage}
${this.customData.serverResponse}`:this.message=this._baseMessage}}var he;(function(n){n.UNKNOWN="unknown",n.OBJECT_NOT_FOUND="object-not-found",n.BUCKET_NOT_FOUND="bucket-not-found",n.PROJECT_NOT_FOUND="project-not-found",n.QUOTA_EXCEEDED="quota-exceeded",n.UNAUTHENTICATED="unauthenticated",n.UNAUTHORIZED="unauthorized",n.UNAUTHORIZED_APP="unauthorized-app",n.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",n.INVALID_CHECKSUM="invalid-checksum",n.CANCELED="canceled",n.INVALID_EVENT_NAME="invalid-event-name",n.INVALID_URL="invalid-url",n.INVALID_DEFAULT_BUCKET="invalid-default-bucket",n.NO_DEFAULT_BUCKET="no-default-bucket",n.CANNOT_SLICE_BLOB="cannot-slice-blob",n.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",n.NO_DOWNLOAD_URL="no-download-url",n.INVALID_ARGUMENT="invalid-argument",n.INVALID_ARGUMENT_COUNT="invalid-argument-count",n.APP_DELETED="app-deleted",n.INVALID_ROOT_OPERATION="invalid-root-operation",n.INVALID_FORMAT="invalid-format",n.INTERNAL_ERROR="internal-error",n.UNSUPPORTED_ENVIRONMENT="unsupported-environment"})(he||(he={}));function xo(n){return"storage/"+n}function vl(){const n="An unknown error occurred, please check the error payload for server response.";return new de(he.UNKNOWN,n)}function qT(n){return new de(he.OBJECT_NOT_FOUND,"Object '"+n+"' does not exist.")}function jT(n){return new de(he.QUOTA_EXCEEDED,"Quota for bucket '"+n+"' exceeded, please view quota on https://firebase.google.com/pricing/.")}function $T(){const n="User is not authenticated, please authenticate using Firebase Authentication and try again.";return new de(he.UNAUTHENTICATED,n)}function WT(){return new de(he.UNAUTHORIZED_APP,"This app does not have permission to access Firebase Storage on this project.")}function zT(n){return new de(he.UNAUTHORIZED,"User does not have permission to access '"+n+"'.")}function HT(){return new de(he.RETRY_LIMIT_EXCEEDED,"Max retry time for operation exceeded, please try again.")}function GT(){return new de(he.CANCELED,"User canceled the upload/download.")}function KT(n){return new de(he.INVALID_URL,"Invalid URL '"+n+"'.")}function QT(n){return new de(he.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+n+"'.")}function YT(){return new de(he.NO_DEFAULT_BUCKET,"No default bucket found. Did you set the '"+qf+"' property when initializing the app?")}function XT(){return new de(he.CANNOT_SLICE_BLOB,"Cannot slice blob for upload. Please retry the upload.")}function JT(){return new de(he.NO_DOWNLOAD_URL,"The given file does not have any download URLs.")}function ZT(n){return new de(he.UNSUPPORTED_ENVIRONMENT,`${n} is missing. Make sure to install the required polyfills. See https://firebase.google.com/docs/web/environments-js-sdk#polyfills for more information.`)}function ma(n){return new de(he.INVALID_ARGUMENT,n)}function jf(){return new de(he.APP_DELETED,"The Firebase app was deleted.")}function ev(n){return new de(he.INVALID_ROOT_OPERATION,"The operation '"+n+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}function Us(n,e){return new de(he.INVALID_FORMAT,"String does not match format '"+n+"': "+e)}function Rs(n){throw new de(he.INTERNAL_ERROR,"Internal error: "+n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Je{constructor(e,t){this.bucket=e,this.path_=t}get path(){return this.path_}get isRoot(){return this.path.length===0}fullServerUrl(){const e=encodeURIComponent;return"/b/"+e(this.bucket)+"/o/"+e(this.path)}bucketOnlyServerUrl(){return"/b/"+encodeURIComponent(this.bucket)+"/o"}static makeFromBucketSpec(e,t){let s;try{s=Je.makeFromUrl(e,t)}catch{return new Je(e,"")}if(s.path==="")return s;throw QT(e)}static makeFromUrl(e,t){let s=null;const r="([A-Za-z0-9.\\-_]+)";function i($){$.path.charAt($.path.length-1)==="/"&&($.path_=$.path_.slice(0,-1))}const a="(/(.*))?$",l=new RegExp("^gs://"+r+a,"i"),u={bucket:1,path:3};function h($){$.path_=decodeURIComponent($.path)}const f="v[A-Za-z0-9_]+",p=t.replace(/[.]/g,"\\."),m="(/([^?#]*).*)?$",I=new RegExp(`^https?://${p}/${f}/b/${r}/o${m}`,"i"),C={bucket:1,path:3},k=t===Bf?"(?:storage.googleapis.com|storage.cloud.google.com)":t,N="([^?#]*)",B=new RegExp(`^https?://${k}/${r}/${N}`,"i"),U=[{regex:l,indices:u,postModify:i},{regex:I,indices:C,postModify:h},{regex:B,indices:{bucket:1,path:2},postModify:h}];for(let $=0;$<U.length;$++){const $e=U[$],fe=$e.regex.exec(e);if(fe){const w=fe[$e.indices.bucket];let g=fe[$e.indices.path];g||(g=""),s=new Je(w,g),$e.postModify(s);break}}if(s==null)throw KT(e);return s}}class tv{constructor(e){this.promise_=Promise.reject(e)}getPromise(){return this.promise_}cancel(e=!1){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function nv(n,e,t){let s=1,r=null,i=null,a=!1,l=0;function u(){return l===2}let h=!1;function f(...N){h||(h=!0,e.apply(null,N))}function p(N){r=setTimeout(()=>{r=null,n(I,u())},N)}function m(){i&&clearTimeout(i)}function I(N,...B){if(h){m();return}if(N){m(),f.call(null,N,...B);return}if(u()||a){m(),f.call(null,N,...B);return}s<64&&(s*=2);let U;l===1?(l=2,U=0):U=(s+Math.random())*1e3,p(U)}let C=!1;function k(N){C||(C=!0,m(),!h&&(r!==null?(N||(l=2),clearTimeout(r),p(0)):N||(l=1)))}return p(0),i=setTimeout(()=>{a=!0,k(!0)},t),k}function sv(n){n(!1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function rv(n){return n!==void 0}function iv(n){return typeof n=="object"&&!Array.isArray(n)}function wl(n){return typeof n=="string"||n instanceof String}function oh(n){return Il()&&n instanceof Blob}function Il(){return typeof Blob<"u"}function ah(n,e,t,s){if(s<e)throw ma(`Invalid value for '${n}'. Expected ${e} or greater.`);if(s>t)throw ma(`Invalid value for '${n}'. Expected ${t} or less.`)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gi(n,e,t){let s=e;return t==null&&(s=`https://${e}`),`${t}://${s}/v0${n}`}function $f(n){const e=encodeURIComponent;let t="?";for(const s in n)if(n.hasOwnProperty(s)){const r=e(s)+"="+e(n[s]);t=t+r+"&"}return t=t.slice(0,-1),t}var fn;(function(n){n[n.NO_ERROR=0]="NO_ERROR",n[n.NETWORK_ERROR=1]="NETWORK_ERROR",n[n.ABORT=2]="ABORT"})(fn||(fn={}));/**
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
 */function ov(n,e){const t=n>=500&&n<600,r=[408,429].indexOf(n)!==-1,i=e.indexOf(n)!==-1;return t||r||i}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class av{constructor(e,t,s,r,i,a,l,u,h,f,p,m=!0,I=!1){this.url_=e,this.method_=t,this.headers_=s,this.body_=r,this.successCodes_=i,this.additionalRetryCodes_=a,this.callback_=l,this.errorCallback_=u,this.timeout_=h,this.progressCallback_=f,this.connectionFactory_=p,this.retry=m,this.isUsingEmulator=I,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((C,k)=>{this.resolve_=C,this.reject_=k,this.start_()})}start_(){const e=(s,r)=>{if(r){s(!1,new Br(!1,null,!0));return}const i=this.connectionFactory_();this.pendingConnection_=i;const a=l=>{const u=l.loaded,h=l.lengthComputable?l.total:-1;this.progressCallback_!==null&&this.progressCallback_(u,h)};this.progressCallback_!==null&&i.addUploadProgressListener(a),i.send(this.url_,this.method_,this.isUsingEmulator,this.body_,this.headers_).then(()=>{this.progressCallback_!==null&&i.removeUploadProgressListener(a),this.pendingConnection_=null;const l=i.getErrorCode()===fn.NO_ERROR,u=i.getStatus();if(!l||ov(u,this.additionalRetryCodes_)&&this.retry){const f=i.getErrorCode()===fn.ABORT;s(!1,new Br(!1,null,f));return}const h=this.successCodes_.indexOf(u)!==-1;s(!0,new Br(h,i))})},t=(s,r)=>{const i=this.resolve_,a=this.reject_,l=r.connection;if(r.wasSuccessCode)try{const u=this.callback_(l,l.getResponse());rv(u)?i(u):i()}catch(u){a(u)}else if(l!==null){const u=vl();u.serverResponse=l.getErrorText(),this.errorCallback_?a(this.errorCallback_(l,u)):a(u)}else if(r.canceled){const u=this.appDelete_?jf():GT();a(u)}else{const u=HT();a(u)}};this.canceled_?t(!1,new Br(!1,null,!0)):this.backoffId_=nv(e,t,this.timeout_)}getPromise(){return this.promise_}cancel(e){this.canceled_=!0,this.appDelete_=e||!1,this.backoffId_!==null&&sv(this.backoffId_),this.pendingConnection_!==null&&this.pendingConnection_.abort()}}class Br{constructor(e,t,s){this.wasSuccessCode=e,this.connection=t,this.canceled=!!s}}function lv(n,e){e!==null&&e.length>0&&(n.Authorization="Firebase "+e)}function cv(n,e){n["X-Firebase-Storage-Version"]="webjs/"+(e??"AppManager")}function uv(n,e){e&&(n["X-Firebase-GMPID"]=e)}function hv(n,e){e!==null&&(n["X-Firebase-AppCheck"]=e)}function dv(n,e,t,s,r,i,a=!0,l=!1){const u=$f(n.urlParams),h=n.url+u,f=Object.assign({},n.headers);return uv(f,e),lv(f,t),cv(f,i),hv(f,s),new av(h,n.method,f,n.body,n.successCodes,n.additionalRetryCodes,n.handler,n.errorHandler,n.timeout,n.progressCallback,r,a,l)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function fv(){return typeof BlobBuilder<"u"?BlobBuilder:typeof WebKitBlobBuilder<"u"?WebKitBlobBuilder:void 0}function pv(...n){const e=fv();if(e!==void 0){const t=new e;for(let s=0;s<n.length;s++)t.append(n[s]);return t.getBlob()}else{if(Il())return new Blob(n);throw new de(he.UNSUPPORTED_ENVIRONMENT,"This browser doesn't seem to support creating Blobs")}}function _v(n,e,t){return n.webkitSlice?n.webkitSlice(e,t):n.mozSlice?n.mozSlice(e,t):n.slice?n.slice(e,t):null}/**
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
 */function mv(n){if(typeof atob>"u")throw ZT("base-64");return atob(n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ct={RAW:"raw",BASE64:"base64",BASE64URL:"base64url",DATA_URL:"data_url"};class Mo{constructor(e,t){this.data=e,this.contentType=t||null}}function gv(n,e){switch(n){case ct.RAW:return new Mo(Wf(e));case ct.BASE64:case ct.BASE64URL:return new Mo(zf(n,e));case ct.DATA_URL:return new Mo(Ev(e),Tv(e))}throw vl()}function Wf(n){const e=[];for(let t=0;t<n.length;t++){let s=n.charCodeAt(t);if(s<=127)e.push(s);else if(s<=2047)e.push(192|s>>6,128|s&63);else if((s&64512)===55296)if(!(t<n.length-1&&(n.charCodeAt(t+1)&64512)===56320))e.push(239,191,189);else{const i=s,a=n.charCodeAt(++t);s=65536|(i&1023)<<10|a&1023,e.push(240|s>>18,128|s>>12&63,128|s>>6&63,128|s&63)}else(s&64512)===56320?e.push(239,191,189):e.push(224|s>>12,128|s>>6&63,128|s&63)}return new Uint8Array(e)}function yv(n){let e;try{e=decodeURIComponent(n)}catch{throw Us(ct.DATA_URL,"Malformed data URL.")}return Wf(e)}function zf(n,e){switch(n){case ct.BASE64:{const r=e.indexOf("-")!==-1,i=e.indexOf("_")!==-1;if(r||i)throw Us(n,"Invalid character '"+(r?"-":"_")+"' found: is it base64url encoded?");break}case ct.BASE64URL:{const r=e.indexOf("+")!==-1,i=e.indexOf("/")!==-1;if(r||i)throw Us(n,"Invalid character '"+(r?"+":"/")+"' found: is it base64 encoded?");e=e.replace(/-/g,"+").replace(/_/g,"/");break}}let t;try{t=mv(e)}catch(r){throw r.message.includes("polyfill")?r:Us(n,"Invalid character found")}const s=new Uint8Array(t.length);for(let r=0;r<t.length;r++)s[r]=t.charCodeAt(r);return s}class Hf{constructor(e){this.base64=!1,this.contentType=null;const t=e.match(/^data:([^,]+)?,/);if(t===null)throw Us(ct.DATA_URL,"Must be formatted 'data:[<mediatype>][;base64],<data>");const s=t[1]||null;s!=null&&(this.base64=vv(s,";base64"),this.contentType=this.base64?s.substring(0,s.length-7):s),this.rest=e.substring(e.indexOf(",")+1)}}function Ev(n){const e=new Hf(n);return e.base64?zf(ct.BASE64,e.rest):yv(e.rest)}function Tv(n){return new Hf(n).contentType}function vv(n,e){return n.length>=e.length?n.substring(n.length-e.length)===e:!1}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xt{constructor(e,t){let s=0,r="";oh(e)?(this.data_=e,s=e.size,r=e.type):e instanceof ArrayBuffer?(t?this.data_=new Uint8Array(e):(this.data_=new Uint8Array(e.byteLength),this.data_.set(new Uint8Array(e))),s=this.data_.length):e instanceof Uint8Array&&(t?this.data_=e:(this.data_=new Uint8Array(e.length),this.data_.set(e)),s=e.length),this.size_=s,this.type_=r}size(){return this.size_}type(){return this.type_}slice(e,t){if(oh(this.data_)){const s=this.data_,r=_v(s,e,t);return r===null?null:new xt(r)}else{const s=new Uint8Array(this.data_.buffer,e,t-e);return new xt(s,!0)}}static getBlob(...e){if(Il()){const t=e.map(s=>s instanceof xt?s.data_:s);return new xt(pv.apply(null,t))}else{const t=e.map(a=>wl(a)?gv(ct.RAW,a).data:a.data_);let s=0;t.forEach(a=>{s+=a.byteLength});const r=new Uint8Array(s);let i=0;return t.forEach(a=>{for(let l=0;l<a.length;l++)r[i++]=a[l]}),new xt(r,!0)}}uploadData(){return this.data_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gf(n){let e;try{e=JSON.parse(n)}catch{return null}return iv(e)?e:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wv(n){if(n.length===0)return null;const e=n.lastIndexOf("/");return e===-1?"":n.slice(0,e)}function Iv(n,e){const t=e.split("/").filter(s=>s.length>0).join("/");return n.length===0?t:n+"/"+t}function Kf(n){const e=n.lastIndexOf("/",n.length-2);return e===-1?n:n.slice(e+1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Av(n,e){return e}class qe{constructor(e,t,s,r){this.server=e,this.local=t||e,this.writable=!!s,this.xform=r||Av}}let qr=null;function Rv(n){return!wl(n)||n.length<2?n:Kf(n)}function Qf(){if(qr)return qr;const n=[];n.push(new qe("bucket")),n.push(new qe("generation")),n.push(new qe("metageneration")),n.push(new qe("name","fullPath",!0));function e(i,a){return Rv(a)}const t=new qe("name");t.xform=e,n.push(t);function s(i,a){return a!==void 0?Number(a):a}const r=new qe("size");return r.xform=s,n.push(r),n.push(new qe("timeCreated")),n.push(new qe("updated")),n.push(new qe("md5Hash",null,!0)),n.push(new qe("cacheControl",null,!0)),n.push(new qe("contentDisposition",null,!0)),n.push(new qe("contentEncoding",null,!0)),n.push(new qe("contentLanguage",null,!0)),n.push(new qe("contentType",null,!0)),n.push(new qe("metadata","customMetadata",!0)),qr=n,qr}function Cv(n,e){function t(){const s=n.bucket,r=n.fullPath,i=new Je(s,r);return e._makeStorageReference(i)}Object.defineProperty(n,"ref",{get:t})}function Sv(n,e,t){const s={};s.type="file";const r=t.length;for(let i=0;i<r;i++){const a=t[i];s[a.local]=a.xform(s,e[a.server])}return Cv(s,n),s}function Yf(n,e,t){const s=Gf(e);return s===null?null:Sv(n,s,t)}function bv(n,e,t,s){const r=Gf(e);if(r===null||!wl(r.downloadTokens))return null;const i=r.downloadTokens;if(i.length===0)return null;const a=encodeURIComponent;return i.split(",").map(h=>{const f=n.bucket,p=n.fullPath,m="/b/"+a(f)+"/o/"+a(p),I=Gi(m,t,s),C=$f({alt:"media",token:h});return I+C})[0]}function Pv(n,e){const t={},s=e.length;for(let r=0;r<s;r++){const i=e[r];i.writable&&(t[i.server]=n[i.local])}return JSON.stringify(t)}class Al{constructor(e,t,s,r){this.url=e,this.method=t,this.handler=s,this.timeout=r,this.urlParams={},this.headers={},this.body=null,this.errorHandler=null,this.progressCallback=null,this.successCodes=[200],this.additionalRetryCodes=[]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xf(n){if(!n)throw vl()}function Nv(n,e){function t(s,r){const i=Yf(n,r,e);return Xf(i!==null),i}return t}function kv(n,e){function t(s,r){const i=Yf(n,r,e);return Xf(i!==null),bv(i,r,n.host,n._protocol)}return t}function Jf(n){function e(t,s){let r;return t.getStatus()===401?t.getErrorText().includes("Firebase App Check token is invalid")?r=WT():r=$T():t.getStatus()===402?r=jT(n.bucket):t.getStatus()===403?r=zT(n.path):r=s,r.status=t.getStatus(),r.serverResponse=s.serverResponse,r}return e}function Zf(n){const e=Jf(n);function t(s,r){let i=e(s,r);return s.getStatus()===404&&(i=qT(n.path)),i.serverResponse=r.serverResponse,i}return t}function Dv(n,e,t){const s=e.fullServerUrl(),r=Gi(s,n.host,n._protocol),i="GET",a=n.maxOperationRetryTime,l=new Al(r,i,kv(n,t),a);return l.errorHandler=Zf(e),l}function Vv(n,e){const t=e.fullServerUrl(),s=Gi(t,n.host,n._protocol),r="DELETE",i=n.maxOperationRetryTime;function a(u,h){}const l=new Al(s,r,a,i);return l.successCodes=[200,204],l.errorHandler=Zf(e),l}function Ov(n,e){return n&&n.contentType||e&&e.type()||"application/octet-stream"}function xv(n,e,t){const s=Object.assign({},t);return s.fullPath=n.path,s.size=e.size(),s.contentType||(s.contentType=Ov(null,e)),s}function Mv(n,e,t,s,r){const i=e.bucketOnlyServerUrl(),a={"X-Goog-Upload-Protocol":"multipart"};function l(){let U="";for(let $=0;$<2;$++)U=U+Math.random().toString().slice(2);return U}const u=l();a["Content-Type"]="multipart/related; boundary="+u;const h=xv(e,s,r),f=Pv(h,t),p="--"+u+`\r
Content-Type: application/json; charset=utf-8\r
\r
`+f+`\r
--`+u+`\r
Content-Type: `+h.contentType+`\r
\r
`,m=`\r
--`+u+"--",I=xt.getBlob(p,s,m);if(I===null)throw XT();const C={name:h.fullPath},k=Gi(i,n.host,n._protocol),N="POST",B=n.maxUploadRetryTime,L=new Al(k,N,Nv(n,t),B);return L.urlParams=C,L.headers=a,L.body=I.uploadData(),L.errorHandler=Jf(e),L}class Lv{constructor(){this.sent_=!1,this.xhr_=new XMLHttpRequest,this.initXhr(),this.errorCode_=fn.NO_ERROR,this.sendPromise_=new Promise(e=>{this.xhr_.addEventListener("abort",()=>{this.errorCode_=fn.ABORT,e()}),this.xhr_.addEventListener("error",()=>{this.errorCode_=fn.NETWORK_ERROR,e()}),this.xhr_.addEventListener("load",()=>{e()})})}send(e,t,s,r,i){if(this.sent_)throw Rs("cannot .send() more than once");if(Yt(e)&&s&&(this.xhr_.withCredentials=!0),this.sent_=!0,this.xhr_.open(t,e,!0),i!==void 0)for(const a in i)i.hasOwnProperty(a)&&this.xhr_.setRequestHeader(a,i[a].toString());return r!==void 0?this.xhr_.send(r):this.xhr_.send(),this.sendPromise_}getErrorCode(){if(!this.sent_)throw Rs("cannot .getErrorCode() before sending");return this.errorCode_}getStatus(){if(!this.sent_)throw Rs("cannot .getStatus() before sending");try{return this.xhr_.status}catch{return-1}}getResponse(){if(!this.sent_)throw Rs("cannot .getResponse() before sending");return this.xhr_.response}getErrorText(){if(!this.sent_)throw Rs("cannot .getErrorText() before sending");return this.xhr_.statusText}abort(){this.xhr_.abort()}getResponseHeader(e){return this.xhr_.getResponseHeader(e)}addUploadProgressListener(e){this.xhr_.upload!=null&&this.xhr_.upload.addEventListener("progress",e)}removeUploadProgressListener(e){this.xhr_.upload!=null&&this.xhr_.upload.removeEventListener("progress",e)}}class Fv extends Lv{initXhr(){this.xhr_.responseType="text"}}function Rl(){return new Fv}/**
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
 */class gn{constructor(e,t){this._service=e,t instanceof Je?this._location=t:this._location=Je.makeFromUrl(t,e.host)}toString(){return"gs://"+this._location.bucket+"/"+this._location.path}_newRef(e,t){return new gn(e,t)}get root(){const e=new Je(this._location.bucket,"");return this._newRef(this._service,e)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return Kf(this._location.path)}get storage(){return this._service}get parent(){const e=wv(this._location.path);if(e===null)return null;const t=new Je(this._location.bucket,e);return new gn(this._service,t)}_throwIfRoot(e){if(this._location.path==="")throw ev(e)}}function Uv(n,e,t){n._throwIfRoot("uploadBytes");const s=Mv(n.storage,n._location,Qf(),new xt(e,!0),t);return n.storage.makeRequestWithTokens(s,Rl).then(r=>({metadata:r,ref:n}))}function Bv(n){n._throwIfRoot("getDownloadURL");const e=Dv(n.storage,n._location,Qf());return n.storage.makeRequestWithTokens(e,Rl).then(t=>{if(t===null)throw JT();return t})}function qv(n){n._throwIfRoot("deleteObject");const e=Vv(n.storage,n._location);return n.storage.makeRequestWithTokens(e,Rl)}function jv(n,e){const t=Iv(n._location.path,e),s=new Je(n._location.bucket,t);return new gn(n.storage,s)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $v(n){return/^[A-Za-z]+:\/\//.test(n)}function Wv(n,e){return new gn(n,e)}function ep(n,e){if(n instanceof Cl){const t=n;if(t._bucket==null)throw YT();const s=new gn(t,t._bucket);return e!=null?ep(s,e):s}else return e!==void 0?jv(n,e):n}function zv(n,e){if(e&&$v(e)){if(n instanceof Cl)return Wv(n,e);throw ma("To use ref(service, url), the first argument must be a Storage instance.")}else return ep(n,e)}function lh(n,e){const t=e==null?void 0:e[qf];return t==null?null:Je.makeFromBucketSpec(t,n)}function Hv(n,e,t,s={}){n.host=`${e}:${t}`;const r=Yt(e);r&&(vi(`https://${n.host}/b`),wi("Storage",!0)),n._isUsingEmulator=!0,n._protocol=r?"https":"http";const{mockUserToken:i}=s;i&&(n._overrideAuthToken=typeof i=="string"?i:Oa(i,n.app.options.projectId))}class Cl{constructor(e,t,s,r,i,a=!1){this.app=e,this._authProvider=t,this._appCheckProvider=s,this._url=r,this._firebaseVersion=i,this._isUsingEmulator=a,this._bucket=null,this._host=Bf,this._protocol="https",this._appId=null,this._deleted=!1,this._maxOperationRetryTime=UT,this._maxUploadRetryTime=BT,this._requests=new Set,r!=null?this._bucket=Je.makeFromBucketSpec(r,this._host):this._bucket=lh(this._host,this.app.options)}get host(){return this._host}set host(e){this._host=e,this._url!=null?this._bucket=Je.makeFromBucketSpec(this._url,e):this._bucket=lh(e,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(e){ah("time",0,Number.POSITIVE_INFINITY,e),this._maxUploadRetryTime=e}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(e){ah("time",0,Number.POSITIVE_INFINITY,e),this._maxOperationRetryTime=e}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;const e=this._authProvider.getImmediate({optional:!0});if(e){const t=await e.getToken();if(t!==null)return t.accessToken}return null}async _getAppCheckToken(){if(Ri(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=this._appCheckProvider.getImmediate({optional:!0});return e?(await e.getToken()).token:null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(e=>e.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(e){return new gn(this,e)}_makeRequest(e,t,s,r,i=!0){if(this._deleted)return new tv(jf());{const a=dv(e,this._appId,s,r,t,this._firebaseVersion,i,this._isUsingEmulator);return this._requests.add(a),a.getPromise().then(()=>this._requests.delete(a),()=>this._requests.delete(a)),a}}async makeRequestWithTokens(e,t){const[s,r]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(e,t,s,r).getPromise()}}const ch="@firebase/storage",uh="0.14.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tp="storage";function NR(n,e,t){return n=ie(n),Uv(n,e,t)}function kR(n){return n=ie(n),Bv(n)}function DR(n){return n=ie(n),qv(n)}function VR(n,e){return n=ie(n),zv(n,e)}function Gv(n=Ci(),e){n=ie(n);const s=Ai(n,tp).getImmediate({identifier:e}),r=Ti("storage");return r&&Kv(s,...r),s}function Kv(n,e,t,s={}){Hv(n,e,t,s)}function Qv(n,{instanceIdentifier:e}){const t=n.getProvider("app").getImmediate(),s=n.getProvider("auth-internal"),r=n.getProvider("app-check-internal");return new Cl(t,s,r,e,Ma)}function Yv(){pn(new jt(tp,Qv,"PUBLIC").setMultipleInstances(!0)),nt(ch,uh,""),nt(ch,uh,"esm2020")}Yv();/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xv="type.googleapis.com/google.protobuf.Int64Value",Jv="type.googleapis.com/google.protobuf.UInt64Value";function np(n,e){const t={};for(const s in n)n.hasOwnProperty(s)&&(t[s]=e(n[s]));return t}function ui(n){if(n==null)return null;if(n instanceof Number&&(n=n.valueOf()),typeof n=="number"&&isFinite(n)||n===!0||n===!1||Object.prototype.toString.call(n)==="[object String]")return n;if(n instanceof Date)return n.toISOString();if(Array.isArray(n))return n.map(e=>ui(e));if(typeof n=="function"||typeof n=="object")return np(n,e=>ui(e));throw new Error("Data cannot be encoded in JSON: "+n)}function Gn(n){if(n==null)return n;if(n["@type"])switch(n["@type"]){case Xv:case Jv:{const e=Number(n.value);if(isNaN(e))throw new Error("Data cannot be decoded from JSON: "+n);return e}default:throw new Error("Data cannot be decoded from JSON: "+n)}return Array.isArray(n)?n.map(e=>Gn(e)):typeof n=="function"||typeof n=="object"?np(n,e=>Gn(e)):n}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Sl="functions";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const hh={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class He extends Xt{constructor(e,t,s){super(`${Sl}/${e}`,t||""),this.details=s,Object.setPrototypeOf(this,He.prototype)}}function Zv(n){if(n>=200&&n<300)return"ok";switch(n){case 0:return"internal";case 400:return"invalid-argument";case 401:return"unauthenticated";case 403:return"permission-denied";case 404:return"not-found";case 409:return"aborted";case 429:return"resource-exhausted";case 499:return"cancelled";case 500:return"internal";case 501:return"unimplemented";case 503:return"unavailable";case 504:return"deadline-exceeded"}return"unknown"}function hi(n,e){let t=Zv(n),s=t,r;try{const i=e&&e.error;if(i){const a=i.status;if(typeof a=="string"){if(!hh[a])return new He("internal","internal");t=hh[a],s=a}const l=i.message;typeof l=="string"&&(s=l),r=i.details,r!==void 0&&(r=Gn(r))}}catch{}return t==="ok"?null:new He(t,s,r)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ew{constructor(e,t,s,r){this.app=e,this.auth=null,this.messaging=null,this.appCheck=null,this.serverAppAppCheckToken=null,Ri(e)&&e.settings.appCheckToken&&(this.serverAppAppCheckToken=e.settings.appCheckToken),this.auth=t.getImmediate({optional:!0}),this.messaging=s.getImmediate({optional:!0}),this.auth||t.get().then(i=>this.auth=i,()=>{}),this.messaging||s.get().then(i=>this.messaging=i,()=>{}),this.appCheck||r==null||r.get().then(i=>this.appCheck=i,()=>{})}async getAuthToken(){if(this.auth)try{const e=await this.auth.getToken();return e==null?void 0:e.accessToken}catch{return}}async getMessagingToken(){if(!(!this.messaging||!("Notification"in self)||Notification.permission!=="granted"))try{return await this.messaging.getToken()}catch{return}}async getAppCheckToken(e){if(this.serverAppAppCheckToken)return this.serverAppAppCheckToken;if(this.appCheck){const t=e?await this.appCheck.getLimitedUseToken():await this.appCheck.getToken();return t.error?null:t.token}return null}async getContext(e){const t=await this.getAuthToken(),s=await this.getMessagingToken(),r=await this.getAppCheckToken(e);return{authToken:t,messagingToken:s,appCheckToken:r}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ga="us-central1",tw=/^data: (.*?)(?:\n|$)/;function nw(n){let e=null;return{promise:new Promise((t,s)=>{e=setTimeout(()=>{s(new He("deadline-exceeded","deadline-exceeded"))},n)}),cancel:()=>{e&&clearTimeout(e)}}}class sw{constructor(e,t,s,r,i=ga,a=(...l)=>fetch(...l)){this.app=e,this.fetchImpl=a,this.emulatorOrigin=null,this.contextProvider=new ew(e,t,s,r),this.cancelAllRequests=new Promise(l=>{this.deleteService=()=>Promise.resolve(l())});try{const l=new URL(i);this.customDomain=l.origin+(l.pathname==="/"?"":l.pathname),this.region=ga}catch{this.customDomain=null,this.region=i}}_delete(){return this.deleteService()}_url(e){const t=this.app.options.projectId;return this.emulatorOrigin!==null?`${this.emulatorOrigin}/${t}/${this.region}/${e}`:this.customDomain!==null?`${this.customDomain}/${e}`:`https://${this.region}-${t}.cloudfunctions.net/${e}`}}function rw(n,e,t){const s=Yt(e);n.emulatorOrigin=`http${s?"s":""}://${e}:${t}`,s&&(vi(n.emulatorOrigin),wi("Functions",!0))}function iw(n,e,t){const s=r=>aw(n,e,r,{});return s.stream=(r,i)=>cw(n,e,r,i),s}async function ow(n,e,t,s){t["Content-Type"]="application/json";let r;try{r=await s(n,{method:"POST",body:JSON.stringify(e),headers:t})}catch{return{status:0,json:null}}let i=null;try{i=await r.json()}catch{}return{status:r.status,json:i}}async function sp(n,e){const t={},s=await n.contextProvider.getContext(e.limitedUseAppCheckTokens);return s.authToken&&(t.Authorization="Bearer "+s.authToken),s.messagingToken&&(t["Firebase-Instance-ID-Token"]=s.messagingToken),s.appCheckToken!==null&&(t["X-Firebase-AppCheck"]=s.appCheckToken),t}function aw(n,e,t,s){const r=n._url(e);return lw(n,r,t,s)}async function lw(n,e,t,s){t=ui(t);const r={data:t},i=await sp(n,s),a=s.timeout||7e4,l=nw(a),u=await Promise.race([ow(e,r,i,n.fetchImpl),l.promise,n.cancelAllRequests]);if(l.cancel(),!u)throw new He("cancelled","Firebase Functions instance was deleted.");const h=hi(u.status,u.json);if(h)throw h;if(!u.json)throw new He("internal","Response is not valid JSON object.");let f=u.json.data;if(typeof f>"u"&&(f=u.json.result),typeof f>"u")throw new He("internal","Response is missing data field.");return{data:Gn(f)}}function cw(n,e,t,s){const r=n._url(e);return uw(n,r,t,s||{})}async function uw(n,e,t,s){var m;t=ui(t);const r={data:t},i=await sp(n,s);i["Content-Type"]="application/json",i.Accept="text/event-stream";let a;try{a=await n.fetchImpl(e,{method:"POST",body:JSON.stringify(r),headers:i,signal:s==null?void 0:s.signal})}catch(I){if(I instanceof Error&&I.name==="AbortError"){const k=new He("cancelled","Request was cancelled.");return{data:Promise.reject(k),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(k)}}}}}}const C=hi(0,null);return{data:Promise.reject(C),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(C)}}}}}}let l,u;const h=new Promise((I,C)=>{l=I,u=C});(m=s==null?void 0:s.signal)==null||m.addEventListener("abort",()=>{const I=new He("cancelled","Request was cancelled.");u(I)});const f=a.body.getReader(),p=hw(f,l,u,s==null?void 0:s.signal);return{stream:{[Symbol.asyncIterator](){const I=p.getReader();return{async next(){const{value:C,done:k}=await I.read();return{value:C,done:k}},async return(){return await I.cancel(),{done:!0,value:void 0}}}}},data:h}}function hw(n,e,t,s){const r=(a,l)=>{const u=a.match(tw);if(!u)return;const h=u[1];try{const f=JSON.parse(h);if("result"in f){e(Gn(f.result));return}if("message"in f){l.enqueue(Gn(f.message));return}if("error"in f){const p=hi(0,f);l.error(p),t(p);return}}catch(f){if(f instanceof He){l.error(f),t(f);return}}},i=new TextDecoder;return new ReadableStream({start(a){let l="";return u();async function u(){if(s!=null&&s.aborted){const h=new He("cancelled","Request was cancelled");return a.error(h),t(h),Promise.resolve()}try{const{value:h,done:f}=await n.read();if(f){l.trim()&&r(l.trim(),a),a.close();return}if(s!=null&&s.aborted){const m=new He("cancelled","Request was cancelled");a.error(m),t(m),await n.cancel();return}l+=i.decode(h,{stream:!0});const p=l.split(`
`);l=p.pop()||"";for(const m of p)m.trim()&&r(m.trim(),a);return u()}catch(h){const f=h instanceof He?h:hi(0,null);a.error(f),t(f)}}},cancel(){return n.cancel()}})}const dh="@firebase/functions",fh="0.13.0";/**
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
 */const dw="auth-internal",fw="app-check-internal",pw="messaging-internal";function _w(n){const e=(t,{instanceIdentifier:s})=>{const r=t.getProvider("app").getImmediate(),i=t.getProvider(dw),a=t.getProvider(pw),l=t.getProvider(fw);return new sw(r,i,a,l,s)};pn(new jt(Sl,e,"PUBLIC").setMultipleInstances(!0)),nt(dh,fh,n),nt(dh,fh,"esm2020")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mw(n=Ci(),e=ga){const s=Ai(ie(n),Sl).getImmediate({identifier:e}),r=Ti("functions");return r&&gw(s,...r),s}function gw(n,e,t){rw(ie(n),e,t)}function OR(n,e,t){return iw(ie(n),e)}_w();var ph={};const _h="@firebase/database",mh="1.1.0";/**
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
 */let rp="";function yw(n){rp=n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ew{constructor(e){this.domStorage_=e,this.prefix_="firebase:"}set(e,t){t==null?this.domStorage_.removeItem(this.prefixedName_(e)):this.domStorage_.setItem(this.prefixedName_(e),Se(t))}get(e){const t=this.domStorage_.getItem(this.prefixedName_(e));return t==null?null:Ws(t)}remove(e){this.domStorage_.removeItem(this.prefixedName_(e))}prefixedName_(e){return this.prefix_+e}toString(){return this.domStorage_.toString()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Tw{constructor(){this.cache_={},this.isInMemoryStorage=!0}set(e,t){t==null?delete this.cache_[e]:this.cache_[e]=t}get(e){return gt(this.cache_,e)?this.cache_[e]:null}remove(e){delete this.cache_[e]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ip=function(n){try{if(typeof window<"u"&&typeof window[n]<"u"){const e=window[n];return e.setItem("firebase:sentinel","cache"),e.removeItem("firebase:sentinel"),new Ew(e)}}catch{}return new Tw},cn=ip("localStorage"),vw=ip("sessionStorage");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ln=new xa("@firebase/database"),ww=function(){let n=1;return function(){return n++}}(),op=function(n){const e=wm(n),t=new vm;t.update(e);const s=t.digest();return Da.encodeByteArray(s)},dr=function(...n){let e="";for(let t=0;t<n.length;t++){const s=n[t];Array.isArray(s)||s&&typeof s=="object"&&typeof s.length=="number"?e+=dr.apply(null,s):typeof s=="object"?e+=Se(s):e+=s,e+=" "}return e};let Bs=null,gh=!0;const Iw=function(n,e){V(!0,"Can't turn on custom loggers persistently."),Ln.logLevel=K.VERBOSE,Bs=Ln.log.bind(Ln)},Ce=function(...n){if(gh===!0&&(gh=!1,Bs===null&&vw.get("logging_enabled")===!0&&Iw()),Bs){const e=dr.apply(null,n);Bs(e)}},fr=function(n){return function(...e){Ce(n,...e)}},ya=function(...n){const e="FIREBASE INTERNAL ERROR: "+dr(...n);Ln.error(e)},bt=function(...n){const e=`FIREBASE FATAL ERROR: ${dr(...n)}`;throw Ln.error(e),new Error(e)},Ke=function(...n){const e="FIREBASE WARNING: "+dr(...n);Ln.warn(e)},Aw=function(){typeof window<"u"&&window.location&&window.location.protocol&&window.location.protocol.indexOf("https:")!==-1&&Ke("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().")},Ki=function(n){return typeof n=="number"&&(n!==n||n===Number.POSITIVE_INFINITY||n===Number.NEGATIVE_INFINITY)},Rw=function(n){if(document.readyState==="complete")n();else{let e=!1;const t=function(){if(!document.body){setTimeout(t,Math.floor(10));return}e||(e=!0,n())};document.addEventListener?(document.addEventListener("DOMContentLoaded",t,!1),window.addEventListener("load",t,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",()=>{document.readyState==="complete"&&t()}),window.attachEvent("onload",t))}},Kn="[MIN_NAME]",yn="[MAX_NAME]",In=function(n,e){if(n===e)return 0;if(n===Kn||e===yn)return-1;if(e===Kn||n===yn)return 1;{const t=yh(n),s=yh(e);return t!==null?s!==null?t-s===0?n.length-e.length:t-s:-1:s!==null?1:n<e?-1:1}},Cw=function(n,e){return n===e?0:n<e?-1:1},Cs=function(n,e){if(e&&n in e)return e[n];throw new Error("Missing required key ("+n+") in object: "+Se(e))},bl=function(n){if(typeof n!="object"||n===null)return Se(n);const e=[];for(const s in n)e.push(s);e.sort();let t="{";for(let s=0;s<e.length;s++)s!==0&&(t+=","),t+=Se(e[s]),t+=":",t+=bl(n[e[s]]);return t+="}",t},ap=function(n,e){const t=n.length;if(t<=e)return[n];const s=[];for(let r=0;r<t;r+=e)r+e>t?s.push(n.substring(r,t)):s.push(n.substring(r,r+e));return s};function Qe(n,e){for(const t in n)n.hasOwnProperty(t)&&e(t,n[t])}const lp=function(n){V(!Ki(n),"Invalid JSON number");const e=11,t=52,s=(1<<e-1)-1;let r,i,a,l,u;n===0?(i=0,a=0,r=1/n===-1/0?1:0):(r=n<0,n=Math.abs(n),n>=Math.pow(2,1-s)?(l=Math.min(Math.floor(Math.log(n)/Math.LN2),s),i=l+s,a=Math.round(n*Math.pow(2,t-l)-Math.pow(2,t))):(i=0,a=Math.round(n/Math.pow(2,1-s-t))));const h=[];for(u=t;u;u-=1)h.push(a%2?1:0),a=Math.floor(a/2);for(u=e;u;u-=1)h.push(i%2?1:0),i=Math.floor(i/2);h.push(r?1:0),h.reverse();const f=h.join("");let p="";for(u=0;u<64;u+=8){let m=parseInt(f.substr(u,8),2).toString(16);m.length===1&&(m="0"+m),p=p+m}return p.toLowerCase()},Sw=function(){return!!(typeof window=="object"&&window.chrome&&window.chrome.extension&&!/^chrome/.test(window.location.href))},bw=function(){return typeof Windows=="object"&&typeof Windows.UI=="object"},Pw=new RegExp("^-?(0*)\\d{1,10}$"),Nw=-2147483648,kw=2147483647,yh=function(n){if(Pw.test(n)){const e=Number(n);if(e>=Nw&&e<=kw)return e}return null},is=function(n){try{n()}catch(e){setTimeout(()=>{const t=e.stack||"";throw Ke("Exception was thrown by user callback.",t),e},Math.floor(0))}},Dw=function(){return(typeof window=="object"&&window.navigator&&window.navigator.userAgent||"").search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i)>=0},qs=function(n,e){const t=setTimeout(n,e);return typeof t=="number"&&typeof Deno<"u"&&Deno.unrefTimer?Deno.unrefTimer(t):typeof t=="object"&&t.unref&&t.unref(),t};/**
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
 */class Vw{constructor(e,t){this.appCheckProvider=t,this.appName=e.name,Ri(e)&&e.settings.appCheckToken&&(this.serverAppAppCheckToken=e.settings.appCheckToken),this.appCheck=t==null?void 0:t.getImmediate({optional:!0}),this.appCheck||t==null||t.get().then(s=>this.appCheck=s)}getToken(e){if(this.serverAppAppCheckToken){if(e)throw new Error("Attempted reuse of `FirebaseServerApp.appCheckToken` after previous usage failed.");return Promise.resolve({token:this.serverAppAppCheckToken})}return this.appCheck?this.appCheck.getToken(e):new Promise((t,s)=>{setTimeout(()=>{this.appCheck?this.getToken(e).then(t,s):t(null)},0)})}addTokenChangeListener(e){var t;(t=this.appCheckProvider)==null||t.get().then(s=>s.addTokenListener(e))}notifyForInvalidToken(){Ke(`Provided AppCheck credentials for the app named "${this.appName}" are invalid. This usually indicates your app was not initialized correctly.`)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ow{constructor(e,t,s){this.appName_=e,this.firebaseOptions_=t,this.authProvider_=s,this.auth_=null,this.auth_=s.getImmediate({optional:!0}),this.auth_||s.onInit(r=>this.auth_=r)}getToken(e){return this.auth_?this.auth_.getToken(e).catch(t=>t&&t.code==="auth/token-not-initialized"?(Ce("Got auth/token-not-initialized error.  Treating as null token."),null):Promise.reject(t)):new Promise((t,s)=>{setTimeout(()=>{this.auth_?this.getToken(e).then(t,s):t(null)},0)})}addTokenChangeListener(e){this.auth_?this.auth_.addAuthTokenListener(e):this.authProvider_.get().then(t=>t.addAuthTokenListener(e))}removeTokenChangeListener(e){this.authProvider_.get().then(t=>t.removeAuthTokenListener(e))}notifyForInvalidToken(){let e='Provided authentication credentials for the app named "'+this.appName_+'" are invalid. This usually indicates your app was not initialized correctly. ';"credential"in this.firebaseOptions_?e+='Make sure the "credential" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':"serviceAccount"in this.firebaseOptions_?e+='Make sure the "serviceAccount" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':e+='Make sure the "apiKey" and "databaseURL" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.',Ke(e)}}class Yr{constructor(e){this.accessToken=e}getToken(e){return Promise.resolve({accessToken:this.accessToken})}addTokenChangeListener(e){e(this.accessToken)}removeTokenChangeListener(e){}notifyForInvalidToken(){}}Yr.OWNER="owner";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pl="5",cp="v",up="s",hp="r",dp="f",fp=/(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/,pp="ls",_p="p",Ea="ac",mp="websocket",gp="long_polling";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yp{constructor(e,t,s,r,i=!1,a="",l=!1,u=!1,h=null){this.secure=t,this.namespace=s,this.webSocketOnly=r,this.nodeAdmin=i,this.persistenceKey=a,this.includeNamespaceInQueryParams=l,this.isUsingEmulator=u,this.emulatorOptions=h,this._host=e.toLowerCase(),this._domain=this._host.substr(this._host.indexOf(".")+1),this.internalHost=cn.get("host:"+e)||this._host}isCacheableHost(){return this.internalHost.substr(0,2)==="s-"}isCustomHost(){return this._domain!=="firebaseio.com"&&this._domain!=="firebaseio-demo.com"}get host(){return this._host}set host(e){e!==this.internalHost&&(this.internalHost=e,this.isCacheableHost()&&cn.set("host:"+this._host,this.internalHost))}toString(){let e=this.toURLString();return this.persistenceKey&&(e+="<"+this.persistenceKey+">"),e}toURLString(){const e=this.secure?"https://":"http://",t=this.includeNamespaceInQueryParams?`?ns=${this.namespace}`:"";return`${e}${this.host}/${t}`}}function xw(n){return n.host!==n.internalHost||n.isCustomHost()||n.includeNamespaceInQueryParams}function Ep(n,e,t){V(typeof e=="string","typeof type must == string"),V(typeof t=="object","typeof params must == object");let s;if(e===mp)s=(n.secure?"wss://":"ws://")+n.internalHost+"/.ws?";else if(e===gp)s=(n.secure?"https://":"http://")+n.internalHost+"/.lp?";else throw new Error("Unknown connection type: "+e);xw(n)&&(t.ns=n.namespace);const r=[];return Qe(t,(i,a)=>{r.push(i+"="+a)}),s+r.join("&")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mw{constructor(){this.counters_={}}incrementCounter(e,t=1){gt(this.counters_,e)||(this.counters_[e]=0),this.counters_[e]+=t}get(){return em(this.counters_)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Lo={},Fo={};function Nl(n){const e=n.toString();return Lo[e]||(Lo[e]=new Mw),Lo[e]}function Lw(n,e){const t=n.toString();return Fo[t]||(Fo[t]=e()),Fo[t]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fw{constructor(e){this.onMessage_=e,this.pendingResponses=[],this.currentResponseNum=0,this.closeAfterResponse=-1,this.onClose=null}closeAfter(e,t){this.closeAfterResponse=e,this.onClose=t,this.closeAfterResponse<this.currentResponseNum&&(this.onClose(),this.onClose=null)}handleResponse(e,t){for(this.pendingResponses[e]=t;this.pendingResponses[this.currentResponseNum];){const s=this.pendingResponses[this.currentResponseNum];delete this.pendingResponses[this.currentResponseNum];for(let r=0;r<s.length;++r)s[r]&&is(()=>{this.onMessage_(s[r])});if(this.currentResponseNum===this.closeAfterResponse){this.onClose&&(this.onClose(),this.onClose=null);break}this.currentResponseNum++}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Eh="start",Uw="close",Bw="pLPCommand",qw="pRTLPCB",Tp="id",vp="pw",wp="ser",jw="cb",$w="seg",Ww="ts",zw="d",Hw="dframe",Ip=1870,Ap=30,Gw=Ip-Ap,Kw=25e3,Qw=3e4;class On{constructor(e,t,s,r,i,a,l){this.connId=e,this.repoInfo=t,this.applicationId=s,this.appCheckToken=r,this.authToken=i,this.transportSessionId=a,this.lastSessionId=l,this.bytesSent=0,this.bytesReceived=0,this.everConnected_=!1,this.log_=fr(e),this.stats_=Nl(t),this.urlFn=u=>(this.appCheckToken&&(u[Ea]=this.appCheckToken),Ep(t,gp,u))}open(e,t){this.curSegmentNum=0,this.onDisconnect_=t,this.myPacketOrderer=new Fw(e),this.isClosed_=!1,this.connectTimeoutTimer_=setTimeout(()=>{this.log_("Timed out trying to connect."),this.onClosed_(),this.connectTimeoutTimer_=null},Math.floor(Qw)),Rw(()=>{if(this.isClosed_)return;this.scriptTagHolder=new kl((...i)=>{const[a,l,u,h,f]=i;if(this.incrementIncomingBytes_(i),!!this.scriptTagHolder)if(this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null),this.everConnected_=!0,a===Eh)this.id=l,this.password=u;else if(a===Uw)l?(this.scriptTagHolder.sendNewPolls=!1,this.myPacketOrderer.closeAfter(l,()=>{this.onClosed_()})):this.onClosed_();else throw new Error("Unrecognized command received: "+a)},(...i)=>{const[a,l]=i;this.incrementIncomingBytes_(i),this.myPacketOrderer.handleResponse(a,l)},()=>{this.onClosed_()},this.urlFn);const s={};s[Eh]="t",s[wp]=Math.floor(Math.random()*1e8),this.scriptTagHolder.uniqueCallbackIdentifier&&(s[jw]=this.scriptTagHolder.uniqueCallbackIdentifier),s[cp]=Pl,this.transportSessionId&&(s[up]=this.transportSessionId),this.lastSessionId&&(s[pp]=this.lastSessionId),this.applicationId&&(s[_p]=this.applicationId),this.appCheckToken&&(s[Ea]=this.appCheckToken),typeof location<"u"&&location.hostname&&fp.test(location.hostname)&&(s[hp]=dp);const r=this.urlFn(s);this.log_("Connecting via long-poll to "+r),this.scriptTagHolder.addTag(r,()=>{})})}start(){this.scriptTagHolder.startLongPoll(this.id,this.password),this.addDisconnectPingFrame(this.id,this.password)}static forceAllow(){On.forceAllow_=!0}static forceDisallow(){On.forceDisallow_=!0}static isAvailable(){return On.forceAllow_?!0:!On.forceDisallow_&&typeof document<"u"&&document.createElement!=null&&!Sw()&&!bw()}markConnectionHealthy(){}shutdown_(){this.isClosed_=!0,this.scriptTagHolder&&(this.scriptTagHolder.close(),this.scriptTagHolder=null),this.myDisconnFrame&&(document.body.removeChild(this.myDisconnFrame),this.myDisconnFrame=null),this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null)}onClosed_(){this.isClosed_||(this.log_("Longpoll is closing itself"),this.shutdown_(),this.onDisconnect_&&(this.onDisconnect_(this.everConnected_),this.onDisconnect_=null))}close(){this.isClosed_||(this.log_("Longpoll is being closed."),this.shutdown_())}send(e){const t=Se(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const s=Jh(t),r=ap(s,Gw);for(let i=0;i<r.length;i++)this.scriptTagHolder.enqueueSegment(this.curSegmentNum,r.length,r[i]),this.curSegmentNum++}addDisconnectPingFrame(e,t){this.myDisconnFrame=document.createElement("iframe");const s={};s[Hw]="t",s[Tp]=e,s[vp]=t,this.myDisconnFrame.src=this.urlFn(s),this.myDisconnFrame.style.display="none",document.body.appendChild(this.myDisconnFrame)}incrementIncomingBytes_(e){const t=Se(e).length;this.bytesReceived+=t,this.stats_.incrementCounter("bytes_received",t)}}class kl{constructor(e,t,s,r){this.onDisconnect=s,this.urlFn=r,this.outstandingRequests=new Set,this.pendingSegs=[],this.currentSerial=Math.floor(Math.random()*1e8),this.sendNewPolls=!0;{this.uniqueCallbackIdentifier=ww(),window[Bw+this.uniqueCallbackIdentifier]=e,window[qw+this.uniqueCallbackIdentifier]=t,this.myIFrame=kl.createIFrame_();let i="";this.myIFrame.src&&this.myIFrame.src.substr(0,11)==="javascript:"&&(i='<script>document.domain="'+document.domain+'";<\/script>');const a="<html><body>"+i+"</body></html>";try{this.myIFrame.doc.open(),this.myIFrame.doc.write(a),this.myIFrame.doc.close()}catch(l){Ce("frame writing exception"),l.stack&&Ce(l.stack),Ce(l)}}}static createIFrame_(){const e=document.createElement("iframe");if(e.style.display="none",document.body){document.body.appendChild(e);try{e.contentWindow.document||Ce("No IE domain setting required")}catch{const s=document.domain;e.src="javascript:void((function(){document.open();document.domain='"+s+"';document.close();})())"}}else throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";return e.contentDocument?e.doc=e.contentDocument:e.contentWindow?e.doc=e.contentWindow.document:e.document&&(e.doc=e.document),e}close(){this.alive=!1,this.myIFrame&&(this.myIFrame.doc.body.textContent="",setTimeout(()=>{this.myIFrame!==null&&(document.body.removeChild(this.myIFrame),this.myIFrame=null)},Math.floor(0)));const e=this.onDisconnect;e&&(this.onDisconnect=null,e())}startLongPoll(e,t){for(this.myID=e,this.myPW=t,this.alive=!0;this.newRequest_(););}newRequest_(){if(this.alive&&this.sendNewPolls&&this.outstandingRequests.size<(this.pendingSegs.length>0?2:1)){this.currentSerial++;const e={};e[Tp]=this.myID,e[vp]=this.myPW,e[wp]=this.currentSerial;let t=this.urlFn(e),s="",r=0;for(;this.pendingSegs.length>0&&this.pendingSegs[0].d.length+Ap+s.length<=Ip;){const a=this.pendingSegs.shift();s=s+"&"+$w+r+"="+a.seg+"&"+Ww+r+"="+a.ts+"&"+zw+r+"="+a.d,r++}return t=t+s,this.addLongPollTag_(t,this.currentSerial),!0}else return!1}enqueueSegment(e,t,s){this.pendingSegs.push({seg:e,ts:t,d:s}),this.alive&&this.newRequest_()}addLongPollTag_(e,t){this.outstandingRequests.add(t);const s=()=>{this.outstandingRequests.delete(t),this.newRequest_()},r=setTimeout(s,Math.floor(Kw)),i=()=>{clearTimeout(r),s()};this.addTag(e,i)}addTag(e,t){setTimeout(()=>{try{if(!this.sendNewPolls)return;const s=this.myIFrame.doc.createElement("script");s.type="text/javascript",s.async=!0,s.src=e,s.onload=s.onreadystatechange=function(){const r=s.readyState;(!r||r==="loaded"||r==="complete")&&(s.onload=s.onreadystatechange=null,s.parentNode&&s.parentNode.removeChild(s),t())},s.onerror=()=>{Ce("Long-poll script failed to load: "+e),this.sendNewPolls=!1,this.close()},this.myIFrame.doc.body.appendChild(s)}catch{}},Math.floor(1))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yw=16384,Xw=45e3;let di=null;typeof MozWebSocket<"u"?di=MozWebSocket:typeof WebSocket<"u"&&(di=WebSocket);class rt{constructor(e,t,s,r,i,a,l){this.connId=e,this.applicationId=s,this.appCheckToken=r,this.authToken=i,this.keepaliveTimer=null,this.frames=null,this.totalFrames=0,this.bytesSent=0,this.bytesReceived=0,this.log_=fr(this.connId),this.stats_=Nl(t),this.connURL=rt.connectionURL_(t,a,l,r,s),this.nodeAdmin=t.nodeAdmin}static connectionURL_(e,t,s,r,i){const a={};return a[cp]=Pl,typeof location<"u"&&location.hostname&&fp.test(location.hostname)&&(a[hp]=dp),t&&(a[up]=t),s&&(a[pp]=s),r&&(a[Ea]=r),i&&(a[_p]=i),Ep(e,mp,a)}open(e,t){this.onDisconnect=t,this.onMessage=e,this.log_("Websocket connecting to "+this.connURL),this.everConnected_=!1,cn.set("previous_websocket_failure",!0);try{let s;hm(),this.mySock=new di(this.connURL,[],s)}catch(s){this.log_("Error instantiating WebSocket.");const r=s.message||s.data;r&&this.log_(r),this.onClosed_();return}this.mySock.onopen=()=>{this.log_("Websocket connected."),this.everConnected_=!0},this.mySock.onclose=()=>{this.log_("Websocket connection was disconnected."),this.mySock=null,this.onClosed_()},this.mySock.onmessage=s=>{this.handleIncomingFrame(s)},this.mySock.onerror=s=>{this.log_("WebSocket error.  Closing connection.");const r=s.message||s.data;r&&this.log_(r),this.onClosed_()}}start(){}static forceDisallow(){rt.forceDisallow_=!0}static isAvailable(){let e=!1;if(typeof navigator<"u"&&navigator.userAgent){const t=/Android ([0-9]{0,}\.[0-9]{0,})/,s=navigator.userAgent.match(t);s&&s.length>1&&parseFloat(s[1])<4.4&&(e=!0)}return!e&&di!==null&&!rt.forceDisallow_}static previouslyFailed(){return cn.isInMemoryStorage||cn.get("previous_websocket_failure")===!0}markConnectionHealthy(){cn.remove("previous_websocket_failure")}appendFrame_(e){if(this.frames.push(e),this.frames.length===this.totalFrames){const t=this.frames.join("");this.frames=null;const s=Ws(t);this.onMessage(s)}}handleNewFrameCount_(e){this.totalFrames=e,this.frames=[]}extractFrameCount_(e){if(V(this.frames===null,"We already have a frame buffer"),e.length<=6){const t=Number(e);if(!isNaN(t))return this.handleNewFrameCount_(t),null}return this.handleNewFrameCount_(1),e}handleIncomingFrame(e){if(this.mySock===null)return;const t=e.data;if(this.bytesReceived+=t.length,this.stats_.incrementCounter("bytes_received",t.length),this.resetKeepAlive(),this.frames!==null)this.appendFrame_(t);else{const s=this.extractFrameCount_(t);s!==null&&this.appendFrame_(s)}}send(e){this.resetKeepAlive();const t=Se(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const s=ap(t,Yw);s.length>1&&this.sendString_(String(s.length));for(let r=0;r<s.length;r++)this.sendString_(s[r])}shutdown_(){this.isClosed_=!0,this.keepaliveTimer&&(clearInterval(this.keepaliveTimer),this.keepaliveTimer=null),this.mySock&&(this.mySock.close(),this.mySock=null)}onClosed_(){this.isClosed_||(this.log_("WebSocket is closing itself"),this.shutdown_(),this.onDisconnect&&(this.onDisconnect(this.everConnected_),this.onDisconnect=null))}close(){this.isClosed_||(this.log_("WebSocket is being closed"),this.shutdown_())}resetKeepAlive(){clearInterval(this.keepaliveTimer),this.keepaliveTimer=setInterval(()=>{this.mySock&&this.sendString_("0"),this.resetKeepAlive()},Math.floor(Xw))}sendString_(e){try{this.mySock.send(e)}catch(t){this.log_("Exception thrown from WebSocket.send():",t.message||t.data,"Closing connection."),setTimeout(this.onClosed_.bind(this),0)}}}rt.responsesRequiredToBeHealthy=2;rt.healthyTimeout=3e4;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tr{static get ALL_TRANSPORTS(){return[On,rt]}static get IS_TRANSPORT_INITIALIZED(){return this.globalTransportInitialized_}constructor(e){this.initTransports_(e)}initTransports_(e){const t=rt&&rt.isAvailable();let s=t&&!rt.previouslyFailed();if(e.webSocketOnly&&(t||Ke("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),s=!0),s)this.transports_=[rt];else{const r=this.transports_=[];for(const i of tr.ALL_TRANSPORTS)i&&i.isAvailable()&&r.push(i);tr.globalTransportInitialized_=!0}}initialTransport(){if(this.transports_.length>0)return this.transports_[0];throw new Error("No transports available")}upgradeTransport(){return this.transports_.length>1?this.transports_[1]:null}}tr.globalTransportInitialized_=!1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Jw=6e4,Zw=5e3,eI=10*1024,tI=100*1024,Uo="t",Th="d",nI="s",vh="r",sI="e",wh="o",Ih="a",Ah="n",Rh="p",rI="h";class iI{constructor(e,t,s,r,i,a,l,u,h,f){this.id=e,this.repoInfo_=t,this.applicationId_=s,this.appCheckToken_=r,this.authToken_=i,this.onMessage_=a,this.onReady_=l,this.onDisconnect_=u,this.onKill_=h,this.lastSessionId=f,this.connectionCount=0,this.pendingDataMessages=[],this.state_=0,this.log_=fr("c:"+this.id+":"),this.transportManager_=new tr(t),this.log_("Connection created"),this.start_()}start_(){const e=this.transportManager_.initialTransport();this.conn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,null,this.lastSessionId),this.primaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.conn_),s=this.disconnReceiver_(this.conn_);this.tx_=this.conn_,this.rx_=this.conn_,this.secondaryConn_=null,this.isHealthy_=!1,setTimeout(()=>{this.conn_&&this.conn_.open(t,s)},Math.floor(0));const r=e.healthyTimeout||0;r>0&&(this.healthyTimeout_=qs(()=>{this.healthyTimeout_=null,this.isHealthy_||(this.conn_&&this.conn_.bytesReceived>tI?(this.log_("Connection exceeded healthy timeout but has received "+this.conn_.bytesReceived+" bytes.  Marking connection healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()):this.conn_&&this.conn_.bytesSent>eI?this.log_("Connection exceeded healthy timeout but has sent "+this.conn_.bytesSent+" bytes.  Leaving connection alive."):(this.log_("Closing unhealthy connection after timeout."),this.close()))},Math.floor(r)))}nextTransportId_(){return"c:"+this.id+":"+this.connectionCount++}disconnReceiver_(e){return t=>{e===this.conn_?this.onConnectionLost_(t):e===this.secondaryConn_?(this.log_("Secondary connection lost."),this.onSecondaryConnectionLost_()):this.log_("closing an old connection")}}connReceiver_(e){return t=>{this.state_!==2&&(e===this.rx_?this.onPrimaryMessageReceived_(t):e===this.secondaryConn_?this.onSecondaryMessageReceived_(t):this.log_("message on old connection"))}}sendRequest(e){const t={t:"d",d:e};this.sendData_(t)}tryCleanupConnection(){this.tx_===this.secondaryConn_&&this.rx_===this.secondaryConn_&&(this.log_("cleaning up and promoting a connection: "+this.secondaryConn_.connId),this.conn_=this.secondaryConn_,this.secondaryConn_=null)}onSecondaryControl_(e){if(Uo in e){const t=e[Uo];t===Ih?this.upgradeIfSecondaryHealthy_():t===vh?(this.log_("Got a reset on secondary, closing it"),this.secondaryConn_.close(),(this.tx_===this.secondaryConn_||this.rx_===this.secondaryConn_)&&this.close()):t===wh&&(this.log_("got pong on secondary."),this.secondaryResponsesRequired_--,this.upgradeIfSecondaryHealthy_())}}onSecondaryMessageReceived_(e){const t=Cs("t",e),s=Cs("d",e);if(t==="c")this.onSecondaryControl_(s);else if(t==="d")this.pendingDataMessages.push(s);else throw new Error("Unknown protocol layer: "+t)}upgradeIfSecondaryHealthy_(){this.secondaryResponsesRequired_<=0?(this.log_("Secondary connection is healthy."),this.isHealthy_=!0,this.secondaryConn_.markConnectionHealthy(),this.proceedWithUpgrade_()):(this.log_("sending ping on secondary."),this.secondaryConn_.send({t:"c",d:{t:Rh,d:{}}}))}proceedWithUpgrade_(){this.secondaryConn_.start(),this.log_("sending client ack on secondary"),this.secondaryConn_.send({t:"c",d:{t:Ih,d:{}}}),this.log_("Ending transmission on primary"),this.conn_.send({t:"c",d:{t:Ah,d:{}}}),this.tx_=this.secondaryConn_,this.tryCleanupConnection()}onPrimaryMessageReceived_(e){const t=Cs("t",e),s=Cs("d",e);t==="c"?this.onControl_(s):t==="d"&&this.onDataMessage_(s)}onDataMessage_(e){this.onPrimaryResponse_(),this.onMessage_(e)}onPrimaryResponse_(){this.isHealthy_||(this.primaryResponsesRequired_--,this.primaryResponsesRequired_<=0&&(this.log_("Primary connection is healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()))}onControl_(e){const t=Cs(Uo,e);if(Th in e){const s=e[Th];if(t===rI){const r={...s};this.repoInfo_.isUsingEmulator&&(r.h=this.repoInfo_.host),this.onHandshake_(r)}else if(t===Ah){this.log_("recvd end transmission on primary"),this.rx_=this.secondaryConn_;for(let r=0;r<this.pendingDataMessages.length;++r)this.onDataMessage_(this.pendingDataMessages[r]);this.pendingDataMessages=[],this.tryCleanupConnection()}else t===nI?this.onConnectionShutdown_(s):t===vh?this.onReset_(s):t===sI?ya("Server Error: "+s):t===wh?(this.log_("got pong on primary."),this.onPrimaryResponse_(),this.sendPingOnPrimaryIfNecessary_()):ya("Unknown control packet command: "+t)}}onHandshake_(e){const t=e.ts,s=e.v,r=e.h;this.sessionId=e.s,this.repoInfo_.host=r,this.state_===0&&(this.conn_.start(),this.onConnectionEstablished_(this.conn_,t),Pl!==s&&Ke("Protocol version mismatch detected"),this.tryStartUpgrade_())}tryStartUpgrade_(){const e=this.transportManager_.upgradeTransport();e&&this.startUpgrade_(e)}startUpgrade_(e){this.secondaryConn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,this.sessionId),this.secondaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.secondaryConn_),s=this.disconnReceiver_(this.secondaryConn_);this.secondaryConn_.open(t,s),qs(()=>{this.secondaryConn_&&(this.log_("Timed out trying to upgrade."),this.secondaryConn_.close())},Math.floor(Jw))}onReset_(e){this.log_("Reset packet received.  New host: "+e),this.repoInfo_.host=e,this.state_===1?this.close():(this.closeConnections_(),this.start_())}onConnectionEstablished_(e,t){this.log_("Realtime connection established."),this.conn_=e,this.state_=1,this.onReady_&&(this.onReady_(t,this.sessionId),this.onReady_=null),this.primaryResponsesRequired_===0?(this.log_("Primary connection is healthy."),this.isHealthy_=!0):qs(()=>{this.sendPingOnPrimaryIfNecessary_()},Math.floor(Zw))}sendPingOnPrimaryIfNecessary_(){!this.isHealthy_&&this.state_===1&&(this.log_("sending ping on primary."),this.sendData_({t:"c",d:{t:Rh,d:{}}}))}onSecondaryConnectionLost_(){const e=this.secondaryConn_;this.secondaryConn_=null,(this.tx_===e||this.rx_===e)&&this.close()}onConnectionLost_(e){this.conn_=null,!e&&this.state_===0?(this.log_("Realtime connection failed."),this.repoInfo_.isCacheableHost()&&(cn.remove("host:"+this.repoInfo_.host),this.repoInfo_.internalHost=this.repoInfo_.host)):this.state_===1&&this.log_("Realtime connection lost."),this.close()}onConnectionShutdown_(e){this.log_("Connection shutdown command received. Shutting down..."),this.onKill_&&(this.onKill_(e),this.onKill_=null),this.onDisconnect_=null,this.close()}sendData_(e){if(this.state_!==1)throw"Connection is not connected";this.tx_.send(e)}close(){this.state_!==2&&(this.log_("Closing realtime connection."),this.state_=2,this.closeConnections_(),this.onDisconnect_&&(this.onDisconnect_(),this.onDisconnect_=null))}closeConnections_(){this.log_("Shutting down all connections"),this.conn_&&(this.conn_.close(),this.conn_=null),this.secondaryConn_&&(this.secondaryConn_.close(),this.secondaryConn_=null),this.healthyTimeout_&&(clearTimeout(this.healthyTimeout_),this.healthyTimeout_=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rp{put(e,t,s,r){}merge(e,t,s,r){}refreshAuthToken(e){}refreshAppCheckToken(e){}onDisconnectPut(e,t,s){}onDisconnectMerge(e,t,s){}onDisconnectCancel(e,t){}reportStats(e){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cp{constructor(e){this.allowedEvents_=e,this.listeners_={},V(Array.isArray(e)&&e.length>0,"Requires a non-empty array")}trigger(e,...t){if(Array.isArray(this.listeners_[e])){const s=[...this.listeners_[e]];for(let r=0;r<s.length;r++)s[r].callback.apply(s[r].context,t)}}on(e,t,s){this.validateEventType_(e),this.listeners_[e]=this.listeners_[e]||[],this.listeners_[e].push({callback:t,context:s});const r=this.getInitialEvent(e);r&&t.apply(s,r)}off(e,t,s){this.validateEventType_(e);const r=this.listeners_[e]||[];for(let i=0;i<r.length;i++)if(r[i].callback===t&&(!s||s===r[i].context)){r.splice(i,1);return}}validateEventType_(e){V(this.allowedEvents_.find(t=>t===e),"Unknown event: "+e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fi extends Cp{static getInstance(){return new fi}constructor(){super(["online"]),this.online_=!0,typeof window<"u"&&typeof window.addEventListener<"u"&&!nd()&&(window.addEventListener("online",()=>{this.online_||(this.online_=!0,this.trigger("online",!0))},!1),window.addEventListener("offline",()=>{this.online_&&(this.online_=!1,this.trigger("online",!1))},!1))}getInitialEvent(e){return V(e==="online","Unknown event type: "+e),[this.online_]}currentlyOnline(){return this.online_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ch=32,Sh=768;class ne{constructor(e,t){if(t===void 0){this.pieces_=e.split("/");let s=0;for(let r=0;r<this.pieces_.length;r++)this.pieces_[r].length>0&&(this.pieces_[s]=this.pieces_[r],s++);this.pieces_.length=s,this.pieceNum_=0}else this.pieces_=e,this.pieceNum_=t}toString(){let e="";for(let t=this.pieceNum_;t<this.pieces_.length;t++)this.pieces_[t]!==""&&(e+="/"+this.pieces_[t]);return e||"/"}}function ee(){return new ne("")}function W(n){return n.pieceNum_>=n.pieces_.length?null:n.pieces_[n.pieceNum_]}function Qt(n){return n.pieces_.length-n.pieceNum_}function se(n){let e=n.pieceNum_;return e<n.pieces_.length&&e++,new ne(n.pieces_,e)}function Dl(n){return n.pieceNum_<n.pieces_.length?n.pieces_[n.pieces_.length-1]:null}function oI(n){let e="";for(let t=n.pieceNum_;t<n.pieces_.length;t++)n.pieces_[t]!==""&&(e+="/"+encodeURIComponent(String(n.pieces_[t])));return e||"/"}function nr(n,e=0){return n.pieces_.slice(n.pieceNum_+e)}function Sp(n){if(n.pieceNum_>=n.pieces_.length)return null;const e=[];for(let t=n.pieceNum_;t<n.pieces_.length-1;t++)e.push(n.pieces_[t]);return new ne(e,0)}function _e(n,e){const t=[];for(let s=n.pieceNum_;s<n.pieces_.length;s++)t.push(n.pieces_[s]);if(e instanceof ne)for(let s=e.pieceNum_;s<e.pieces_.length;s++)t.push(e.pieces_[s]);else{const s=e.split("/");for(let r=0;r<s.length;r++)s[r].length>0&&t.push(s[r])}return new ne(t,0)}function H(n){return n.pieceNum_>=n.pieces_.length}function et(n,e){const t=W(n),s=W(e);if(t===null)return e;if(t===s)return et(se(n),se(e));throw new Error("INTERNAL ERROR: innerPath ("+e+") is not within outerPath ("+n+")")}function aI(n,e){const t=nr(n,0),s=nr(e,0);for(let r=0;r<t.length&&r<s.length;r++){const i=In(t[r],s[r]);if(i!==0)return i}return t.length===s.length?0:t.length<s.length?-1:1}function bp(n,e){if(Qt(n)!==Qt(e))return!1;for(let t=n.pieceNum_,s=e.pieceNum_;t<=n.pieces_.length;t++,s++)if(n.pieces_[t]!==e.pieces_[s])return!1;return!0}function tt(n,e){let t=n.pieceNum_,s=e.pieceNum_;if(Qt(n)>Qt(e))return!1;for(;t<n.pieces_.length;){if(n.pieces_[t]!==e.pieces_[s])return!1;++t,++s}return!0}class lI{constructor(e,t){this.errorPrefix_=t,this.parts_=nr(e,0),this.byteLength_=Math.max(1,this.parts_.length);for(let s=0;s<this.parts_.length;s++)this.byteLength_+=Ii(this.parts_[s]);Pp(this)}}function cI(n,e){n.parts_.length>0&&(n.byteLength_+=1),n.parts_.push(e),n.byteLength_+=Ii(e),Pp(n)}function uI(n){const e=n.parts_.pop();n.byteLength_-=Ii(e),n.parts_.length>0&&(n.byteLength_-=1)}function Pp(n){if(n.byteLength_>Sh)throw new Error(n.errorPrefix_+"has a key path longer than "+Sh+" bytes ("+n.byteLength_+").");if(n.parts_.length>Ch)throw new Error(n.errorPrefix_+"path specified exceeds the maximum depth that can be written ("+Ch+") or object contains a cycle "+an(n))}function an(n){return n.parts_.length===0?"":"in property '"+n.parts_.join(".")+"'"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vl extends Cp{static getInstance(){return new Vl}constructor(){super(["visible"]);let e,t;typeof document<"u"&&typeof document.addEventListener<"u"&&(typeof document.hidden<"u"?(t="visibilitychange",e="hidden"):typeof document.mozHidden<"u"?(t="mozvisibilitychange",e="mozHidden"):typeof document.msHidden<"u"?(t="msvisibilitychange",e="msHidden"):typeof document.webkitHidden<"u"&&(t="webkitvisibilitychange",e="webkitHidden")),this.visible_=!0,t&&document.addEventListener(t,()=>{const s=!document[e];s!==this.visible_&&(this.visible_=s,this.trigger("visible",s))},!1)}getInitialEvent(e){return V(e==="visible","Unknown event type: "+e),[this.visible_]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ss=1e3,hI=60*5*1e3,bh=30*1e3,dI=1.3,fI=3e4,pI="server_kill",Ph=3;class At extends Rp{constructor(e,t,s,r,i,a,l,u){if(super(),this.repoInfo_=e,this.applicationId_=t,this.onDataUpdate_=s,this.onConnectStatus_=r,this.onServerInfoUpdate_=i,this.authTokenProvider_=a,this.appCheckTokenProvider_=l,this.authOverride_=u,this.id=At.nextPersistentConnectionId_++,this.log_=fr("p:"+this.id+":"),this.interruptReasons_={},this.listens=new Map,this.outstandingPuts_=[],this.outstandingGets_=[],this.outstandingPutCount_=0,this.outstandingGetCount_=0,this.onDisconnectRequestQueue_=[],this.connected_=!1,this.reconnectDelay_=Ss,this.maxReconnectDelay_=hI,this.securityDebugCallback_=null,this.lastSessionId=null,this.establishConnectionTimer_=null,this.visible_=!1,this.requestCBHash_={},this.requestNumber_=0,this.realtime_=null,this.authToken_=null,this.appCheckToken_=null,this.forceTokenRefresh_=!1,this.invalidAuthTokenCount_=0,this.invalidAppCheckTokenCount_=0,this.firstConnection_=!0,this.lastConnectionAttemptTime_=null,this.lastConnectionEstablishedTime_=null,u)throw new Error("Auth override specified in options, but not supported on non Node.js platforms");Vl.getInstance().on("visible",this.onVisible_,this),e.host.indexOf("fblocal")===-1&&fi.getInstance().on("online",this.onOnline_,this)}sendRequest(e,t,s){const r=++this.requestNumber_,i={r,a:e,b:t};this.log_(Se(i)),V(this.connected_,"sendRequest call when we're not connected not allowed."),this.realtime_.sendRequest(i),s&&(this.requestCBHash_[r]=s)}get(e){this.initConnection_();const t=new wt,r={action:"g",request:{p:e._path.toString(),q:e._queryObject},onComplete:a=>{const l=a.d;a.s==="ok"?t.resolve(l):t.reject(l)}};this.outstandingGets_.push(r),this.outstandingGetCount_++;const i=this.outstandingGets_.length-1;return this.connected_&&this.sendGet_(i),t.promise}listen(e,t,s,r){this.initConnection_();const i=e._queryIdentifier,a=e._path.toString();this.log_("Listen called for "+a+" "+i),this.listens.has(a)||this.listens.set(a,new Map),V(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"listen() called for non-default but complete query"),V(!this.listens.get(a).has(i),"listen() called twice for same path/queryId.");const l={onComplete:r,hashFn:t,query:e,tag:s};this.listens.get(a).set(i,l),this.connected_&&this.sendListen_(l)}sendGet_(e){const t=this.outstandingGets_[e];this.sendRequest("g",t.request,s=>{delete this.outstandingGets_[e],this.outstandingGetCount_--,this.outstandingGetCount_===0&&(this.outstandingGets_=[]),t.onComplete&&t.onComplete(s)})}sendListen_(e){const t=e.query,s=t._path.toString(),r=t._queryIdentifier;this.log_("Listen on "+s+" for "+r);const i={p:s},a="q";e.tag&&(i.q=t._queryObject,i.t=e.tag),i.h=e.hashFn(),this.sendRequest(a,i,l=>{const u=l.d,h=l.s;At.warnOnListenWarnings_(u,t),(this.listens.get(s)&&this.listens.get(s).get(r))===e&&(this.log_("listen response",l),h!=="ok"&&this.removeListen_(s,r),e.onComplete&&e.onComplete(h,u))})}static warnOnListenWarnings_(e,t){if(e&&typeof e=="object"&&gt(e,"w")){const s=Un(e,"w");if(Array.isArray(s)&&~s.indexOf("no_index")){const r='".indexOn": "'+t._queryParams.getIndex().toString()+'"',i=t._path.toString();Ke(`Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ${r} at ${i} to your security rules for better performance.`)}}}refreshAuthToken(e){this.authToken_=e,this.log_("Auth token refreshed"),this.authToken_?this.tryAuth():this.connected_&&this.sendRequest("unauth",{},()=>{}),this.reduceReconnectDelayIfAdminCredential_(e)}reduceReconnectDelayIfAdminCredential_(e){(e&&e.length===40||Em(e))&&(this.log_("Admin auth credential detected.  Reducing max reconnect time."),this.maxReconnectDelay_=bh)}refreshAppCheckToken(e){this.appCheckToken_=e,this.log_("App check token refreshed"),this.appCheckToken_?this.tryAppCheck():this.connected_&&this.sendRequest("unappeck",{},()=>{})}tryAuth(){if(this.connected_&&this.authToken_){const e=this.authToken_,t=ym(e)?"auth":"gauth",s={cred:e};this.authOverride_===null?s.noauth=!0:typeof this.authOverride_=="object"&&(s.authvar=this.authOverride_),this.sendRequest(t,s,r=>{const i=r.s,a=r.d||"error";this.authToken_===e&&(i==="ok"?this.invalidAuthTokenCount_=0:this.onAuthRevoked_(i,a))})}}tryAppCheck(){this.connected_&&this.appCheckToken_&&this.sendRequest("appcheck",{token:this.appCheckToken_},e=>{const t=e.s,s=e.d||"error";t==="ok"?this.invalidAppCheckTokenCount_=0:this.onAppCheckRevoked_(t,s)})}unlisten(e,t){const s=e._path.toString(),r=e._queryIdentifier;this.log_("Unlisten called for "+s+" "+r),V(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"unlisten() called for non-default but complete query"),this.removeListen_(s,r)&&this.connected_&&this.sendUnlisten_(s,r,e._queryObject,t)}sendUnlisten_(e,t,s,r){this.log_("Unlisten on "+e+" for "+t);const i={p:e},a="n";r&&(i.q=s,i.t=r),this.sendRequest(a,i)}onDisconnectPut(e,t,s){this.initConnection_(),this.connected_?this.sendOnDisconnect_("o",e,t,s):this.onDisconnectRequestQueue_.push({pathString:e,action:"o",data:t,onComplete:s})}onDisconnectMerge(e,t,s){this.initConnection_(),this.connected_?this.sendOnDisconnect_("om",e,t,s):this.onDisconnectRequestQueue_.push({pathString:e,action:"om",data:t,onComplete:s})}onDisconnectCancel(e,t){this.initConnection_(),this.connected_?this.sendOnDisconnect_("oc",e,null,t):this.onDisconnectRequestQueue_.push({pathString:e,action:"oc",data:null,onComplete:t})}sendOnDisconnect_(e,t,s,r){const i={p:t,d:s};this.log_("onDisconnect "+e,i),this.sendRequest(e,i,a=>{r&&setTimeout(()=>{r(a.s,a.d)},Math.floor(0))})}put(e,t,s,r){this.putInternal("p",e,t,s,r)}merge(e,t,s,r){this.putInternal("m",e,t,s,r)}putInternal(e,t,s,r,i){this.initConnection_();const a={p:t,d:s};i!==void 0&&(a.h=i),this.outstandingPuts_.push({action:e,request:a,onComplete:r}),this.outstandingPutCount_++;const l=this.outstandingPuts_.length-1;this.connected_?this.sendPut_(l):this.log_("Buffering put: "+t)}sendPut_(e){const t=this.outstandingPuts_[e].action,s=this.outstandingPuts_[e].request,r=this.outstandingPuts_[e].onComplete;this.outstandingPuts_[e].queued=this.connected_,this.sendRequest(t,s,i=>{this.log_(t+" response",i),delete this.outstandingPuts_[e],this.outstandingPutCount_--,this.outstandingPutCount_===0&&(this.outstandingPuts_=[]),r&&r(i.s,i.d)})}reportStats(e){if(this.connected_){const t={c:e};this.log_("reportStats",t),this.sendRequest("s",t,s=>{if(s.s!=="ok"){const i=s.d;this.log_("reportStats","Error sending stats: "+i)}})}}onDataMessage_(e){if("r"in e){this.log_("from server: "+Se(e));const t=e.r,s=this.requestCBHash_[t];s&&(delete this.requestCBHash_[t],s(e.b))}else{if("error"in e)throw"A server-side error has occurred: "+e.error;"a"in e&&this.onDataPush_(e.a,e.b)}}onDataPush_(e,t){this.log_("handleServerMessage",e,t),e==="d"?this.onDataUpdate_(t.p,t.d,!1,t.t):e==="m"?this.onDataUpdate_(t.p,t.d,!0,t.t):e==="c"?this.onListenRevoked_(t.p,t.q):e==="ac"?this.onAuthRevoked_(t.s,t.d):e==="apc"?this.onAppCheckRevoked_(t.s,t.d):e==="sd"?this.onSecurityDebugPacket_(t):ya("Unrecognized action received from server: "+Se(e)+`
Are you using the latest client?`)}onReady_(e,t){this.log_("connection ready"),this.connected_=!0,this.lastConnectionEstablishedTime_=new Date().getTime(),this.handleTimestamp_(e),this.lastSessionId=t,this.firstConnection_&&this.sendConnectStats_(),this.restoreState_(),this.firstConnection_=!1,this.onConnectStatus_(!0)}scheduleConnect_(e){V(!this.realtime_,"Scheduling a connect when we're already connected/ing?"),this.establishConnectionTimer_&&clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=setTimeout(()=>{this.establishConnectionTimer_=null,this.establishConnection_()},Math.floor(e))}initConnection_(){!this.realtime_&&this.firstConnection_&&this.scheduleConnect_(0)}onVisible_(e){e&&!this.visible_&&this.reconnectDelay_===this.maxReconnectDelay_&&(this.log_("Window became visible.  Reducing delay."),this.reconnectDelay_=Ss,this.realtime_||this.scheduleConnect_(0)),this.visible_=e}onOnline_(e){e?(this.log_("Browser went online."),this.reconnectDelay_=Ss,this.realtime_||this.scheduleConnect_(0)):(this.log_("Browser went offline.  Killing connection."),this.realtime_&&this.realtime_.close())}onRealtimeDisconnect_(){if(this.log_("data client disconnected"),this.connected_=!1,this.realtime_=null,this.cancelSentTransactions_(),this.requestCBHash_={},this.shouldReconnect_()){this.visible_?this.lastConnectionEstablishedTime_&&(new Date().getTime()-this.lastConnectionEstablishedTime_>fI&&(this.reconnectDelay_=Ss),this.lastConnectionEstablishedTime_=null):(this.log_("Window isn't visible.  Delaying reconnect."),this.reconnectDelay_=this.maxReconnectDelay_,this.lastConnectionAttemptTime_=new Date().getTime());const e=Math.max(0,new Date().getTime()-this.lastConnectionAttemptTime_);let t=Math.max(0,this.reconnectDelay_-e);t=Math.random()*t,this.log_("Trying to reconnect in "+t+"ms"),this.scheduleConnect_(t),this.reconnectDelay_=Math.min(this.maxReconnectDelay_,this.reconnectDelay_*dI)}this.onConnectStatus_(!1)}async establishConnection_(){if(this.shouldReconnect_()){this.log_("Making a connection attempt"),this.lastConnectionAttemptTime_=new Date().getTime(),this.lastConnectionEstablishedTime_=null;const e=this.onDataMessage_.bind(this),t=this.onReady_.bind(this),s=this.onRealtimeDisconnect_.bind(this),r=this.id+":"+At.nextConnectionId_++,i=this.lastSessionId;let a=!1,l=null;const u=function(){l?l.close():(a=!0,s())},h=function(p){V(l,"sendRequest call when we're not connected not allowed."),l.sendRequest(p)};this.realtime_={close:u,sendRequest:h};const f=this.forceTokenRefresh_;this.forceTokenRefresh_=!1;try{const[p,m]=await Promise.all([this.authTokenProvider_.getToken(f),this.appCheckTokenProvider_.getToken(f)]);a?Ce("getToken() completed but was canceled"):(Ce("getToken() completed. Creating connection."),this.authToken_=p&&p.accessToken,this.appCheckToken_=m&&m.token,l=new iI(r,this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,e,t,s,I=>{Ke(I+" ("+this.repoInfo_.toString()+")"),this.interrupt(pI)},i))}catch(p){this.log_("Failed to get token: "+p),a||(this.repoInfo_.nodeAdmin&&Ke(p),u())}}}interrupt(e){Ce("Interrupting connection for reason: "+e),this.interruptReasons_[e]=!0,this.realtime_?this.realtime_.close():(this.establishConnectionTimer_&&(clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=null),this.connected_&&this.onRealtimeDisconnect_())}resume(e){Ce("Resuming connection for reason: "+e),delete this.interruptReasons_[e],zo(this.interruptReasons_)&&(this.reconnectDelay_=Ss,this.realtime_||this.scheduleConnect_(0))}handleTimestamp_(e){const t=e-new Date().getTime();this.onServerInfoUpdate_({serverTimeOffset:t})}cancelSentTransactions_(){for(let e=0;e<this.outstandingPuts_.length;e++){const t=this.outstandingPuts_[e];t&&"h"in t.request&&t.queued&&(t.onComplete&&t.onComplete("disconnect"),delete this.outstandingPuts_[e],this.outstandingPutCount_--)}this.outstandingPutCount_===0&&(this.outstandingPuts_=[])}onListenRevoked_(e,t){let s;t?s=t.map(i=>bl(i)).join("$"):s="default";const r=this.removeListen_(e,s);r&&r.onComplete&&r.onComplete("permission_denied")}removeListen_(e,t){const s=new ne(e).toString();let r;if(this.listens.has(s)){const i=this.listens.get(s);r=i.get(t),i.delete(t),i.size===0&&this.listens.delete(s)}else r=void 0;return r}onAuthRevoked_(e,t){Ce("Auth token revoked: "+e+"/"+t),this.authToken_=null,this.forceTokenRefresh_=!0,this.realtime_.close(),(e==="invalid_token"||e==="permission_denied")&&(this.invalidAuthTokenCount_++,this.invalidAuthTokenCount_>=Ph&&(this.reconnectDelay_=bh,this.authTokenProvider_.notifyForInvalidToken()))}onAppCheckRevoked_(e,t){Ce("App check token revoked: "+e+"/"+t),this.appCheckToken_=null,this.forceTokenRefresh_=!0,(e==="invalid_token"||e==="permission_denied")&&(this.invalidAppCheckTokenCount_++,this.invalidAppCheckTokenCount_>=Ph&&this.appCheckTokenProvider_.notifyForInvalidToken())}onSecurityDebugPacket_(e){this.securityDebugCallback_?this.securityDebugCallback_(e):"msg"in e&&console.log("FIREBASE: "+e.msg.replace(`
`,`
FIREBASE: `))}restoreState_(){this.tryAuth(),this.tryAppCheck();for(const e of this.listens.values())for(const t of e.values())this.sendListen_(t);for(let e=0;e<this.outstandingPuts_.length;e++)this.outstandingPuts_[e]&&this.sendPut_(e);for(;this.onDisconnectRequestQueue_.length;){const e=this.onDisconnectRequestQueue_.shift();this.sendOnDisconnect_(e.action,e.pathString,e.data,e.onComplete)}for(let e=0;e<this.outstandingGets_.length;e++)this.outstandingGets_[e]&&this.sendGet_(e)}sendConnectStats_(){const e={};let t="js";e["sdk."+t+"."+rp.replace(/\./g,"-")]=1,nd()?e["framework.cordova"]=1:um()&&(e["framework.reactnative"]=1),this.reportStats(e)}shouldReconnect_(){const e=fi.getInstance().currentlyOnline();return zo(this.interruptReasons_)&&e}}At.nextPersistentConnectionId_=0;At.nextConnectionId_=0;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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
 */class Qi{getCompare(){return this.compare.bind(this)}indexedValueChanged(e,t){const s=new Y(Kn,e),r=new Y(Kn,t);return this.compare(s,r)!==0}minPost(){return Y.MIN}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let jr;class Np extends Qi{static get __EMPTY_NODE(){return jr}static set __EMPTY_NODE(e){jr=e}compare(e,t){return In(e.name,t.name)}isDefinedOn(e){throw Xn("KeyIndex.isDefinedOn not expected to be called.")}indexedValueChanged(e,t){return!1}minPost(){return Y.MIN}maxPost(){return new Y(yn,jr)}makePost(e,t){return V(typeof e=="string","KeyIndex indexValue must always be a string."),new Y(e,jr)}toString(){return".key"}}const Fn=new Np;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $r{constructor(e,t,s,r,i=null){this.isReverse_=r,this.resultGenerator_=i,this.nodeStack_=[];let a=1;for(;!e.isEmpty();)if(e=e,a=t?s(e.key,t):1,r&&(a*=-1),a<0)this.isReverse_?e=e.left:e=e.right;else if(a===0){this.nodeStack_.push(e);break}else this.nodeStack_.push(e),this.isReverse_?e=e.right:e=e.left}getNext(){if(this.nodeStack_.length===0)return null;let e=this.nodeStack_.pop(),t;if(this.resultGenerator_?t=this.resultGenerator_(e.key,e.value):t={key:e.key,value:e.value},this.isReverse_)for(e=e.left;!e.isEmpty();)this.nodeStack_.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack_.push(e),e=e.left;return t}hasNext(){return this.nodeStack_.length>0}peek(){if(this.nodeStack_.length===0)return null;const e=this.nodeStack_[this.nodeStack_.length-1];return this.resultGenerator_?this.resultGenerator_(e.key,e.value):{key:e.key,value:e.value}}}class Ae{constructor(e,t,s,r,i){this.key=e,this.value=t,this.color=s??Ae.RED,this.left=r??Ge.EMPTY_NODE,this.right=i??Ge.EMPTY_NODE}copy(e,t,s,r,i){return new Ae(e??this.key,t??this.value,s??this.color,r??this.left,i??this.right)}count(){return this.left.count()+1+this.right.count()}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||!!e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min_(){return this.left.isEmpty()?this:this.left.min_()}minKey(){return this.min_().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,s){let r=this;const i=s(e,r.key);return i<0?r=r.copy(null,null,null,r.left.insert(e,t,s),null):i===0?r=r.copy(null,t,null,null,null):r=r.copy(null,null,null,null,r.right.insert(e,t,s)),r.fixUp_()}removeMin_(){if(this.left.isEmpty())return Ge.EMPTY_NODE;let e=this;return!e.left.isRed_()&&!e.left.left.isRed_()&&(e=e.moveRedLeft_()),e=e.copy(null,null,null,e.left.removeMin_(),null),e.fixUp_()}remove(e,t){let s,r;if(s=this,t(e,s.key)<0)!s.left.isEmpty()&&!s.left.isRed_()&&!s.left.left.isRed_()&&(s=s.moveRedLeft_()),s=s.copy(null,null,null,s.left.remove(e,t),null);else{if(s.left.isRed_()&&(s=s.rotateRight_()),!s.right.isEmpty()&&!s.right.isRed_()&&!s.right.left.isRed_()&&(s=s.moveRedRight_()),t(e,s.key)===0){if(s.right.isEmpty())return Ge.EMPTY_NODE;r=s.right.min_(),s=s.copy(r.key,r.value,null,null,s.right.removeMin_())}s=s.copy(null,null,null,null,s.right.remove(e,t))}return s.fixUp_()}isRed_(){return this.color}fixUp_(){let e=this;return e.right.isRed_()&&!e.left.isRed_()&&(e=e.rotateLeft_()),e.left.isRed_()&&e.left.left.isRed_()&&(e=e.rotateRight_()),e.left.isRed_()&&e.right.isRed_()&&(e=e.colorFlip_()),e}moveRedLeft_(){let e=this.colorFlip_();return e.right.left.isRed_()&&(e=e.copy(null,null,null,null,e.right.rotateRight_()),e=e.rotateLeft_(),e=e.colorFlip_()),e}moveRedRight_(){let e=this.colorFlip_();return e.left.left.isRed_()&&(e=e.rotateRight_(),e=e.colorFlip_()),e}rotateLeft_(){const e=this.copy(null,null,Ae.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight_(){const e=this.copy(null,null,Ae.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip_(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth_(){const e=this.check_();return Math.pow(2,e)<=this.count()+1}check_(){if(this.isRed_()&&this.left.isRed_())throw new Error("Red node has red child("+this.key+","+this.value+")");if(this.right.isRed_())throw new Error("Right child of ("+this.key+","+this.value+") is red");const e=this.left.check_();if(e!==this.right.check_())throw new Error("Black depths differ");return e+(this.isRed_()?0:1)}}Ae.RED=!0;Ae.BLACK=!1;class _I{copy(e,t,s,r,i){return this}insert(e,t,s){return new Ae(e,t,null)}remove(e,t){return this}count(){return 0}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}check_(){return 0}isRed_(){return!1}}class Ge{constructor(e,t=Ge.EMPTY_NODE){this.comparator_=e,this.root_=t}insert(e,t){return new Ge(this.comparator_,this.root_.insert(e,t,this.comparator_).copy(null,null,Ae.BLACK,null,null))}remove(e){return new Ge(this.comparator_,this.root_.remove(e,this.comparator_).copy(null,null,Ae.BLACK,null,null))}get(e){let t,s=this.root_;for(;!s.isEmpty();){if(t=this.comparator_(e,s.key),t===0)return s.value;t<0?s=s.left:t>0&&(s=s.right)}return null}getPredecessorKey(e){let t,s=this.root_,r=null;for(;!s.isEmpty();)if(t=this.comparator_(e,s.key),t===0){if(s.left.isEmpty())return r?r.key:null;for(s=s.left;!s.right.isEmpty();)s=s.right;return s.key}else t<0?s=s.left:t>0&&(r=s,s=s.right);throw new Error("Attempted to find predecessor key for a nonexistent key.  What gives?")}isEmpty(){return this.root_.isEmpty()}count(){return this.root_.count()}minKey(){return this.root_.minKey()}maxKey(){return this.root_.maxKey()}inorderTraversal(e){return this.root_.inorderTraversal(e)}reverseTraversal(e){return this.root_.reverseTraversal(e)}getIterator(e){return new $r(this.root_,null,this.comparator_,!1,e)}getIteratorFrom(e,t){return new $r(this.root_,e,this.comparator_,!1,t)}getReverseIteratorFrom(e,t){return new $r(this.root_,e,this.comparator_,!0,t)}getReverseIterator(e){return new $r(this.root_,null,this.comparator_,!0,e)}}Ge.EMPTY_NODE=new _I;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mI(n,e){return In(n.name,e.name)}function Ol(n,e){return In(n,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Ta;function gI(n){Ta=n}const kp=function(n){return typeof n=="number"?"number:"+lp(n):"string:"+n},Dp=function(n){if(n.isLeafNode()){const e=n.val();V(typeof e=="string"||typeof e=="number"||typeof e=="object"&&gt(e,".sv"),"Priority must be a string or number.")}else V(n===Ta||n.isEmpty(),"priority of unexpected type.");V(n===Ta||n.getPriority().isEmpty(),"Priority nodes can't have a priority of their own.")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Nh;class we{static set __childrenNodeConstructor(e){Nh=e}static get __childrenNodeConstructor(){return Nh}constructor(e,t=we.__childrenNodeConstructor.EMPTY_NODE){this.value_=e,this.priorityNode_=t,this.lazyHash_=null,V(this.value_!==void 0&&this.value_!==null,"LeafNode shouldn't be created with null/undefined value."),Dp(this.priorityNode_)}isLeafNode(){return!0}getPriority(){return this.priorityNode_}updatePriority(e){return new we(this.value_,e)}getImmediateChild(e){return e===".priority"?this.priorityNode_:we.__childrenNodeConstructor.EMPTY_NODE}getChild(e){return H(e)?this:W(e)===".priority"?this.priorityNode_:we.__childrenNodeConstructor.EMPTY_NODE}hasChild(){return!1}getPredecessorChildName(e,t){return null}updateImmediateChild(e,t){return e===".priority"?this.updatePriority(t):t.isEmpty()&&e!==".priority"?this:we.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(e,t).updatePriority(this.priorityNode_)}updateChild(e,t){const s=W(e);return s===null?t:t.isEmpty()&&s!==".priority"?this:(V(s!==".priority"||Qt(e)===1,".priority must be the last token in a path"),this.updateImmediateChild(s,we.__childrenNodeConstructor.EMPTY_NODE.updateChild(se(e),t)))}isEmpty(){return!1}numChildren(){return 0}forEachChild(e,t){return!1}val(e){return e&&!this.getPriority().isEmpty()?{".value":this.getValue(),".priority":this.getPriority().val()}:this.getValue()}hash(){if(this.lazyHash_===null){let e="";this.priorityNode_.isEmpty()||(e+="priority:"+kp(this.priorityNode_.val())+":");const t=typeof this.value_;e+=t+":",t==="number"?e+=lp(this.value_):e+=this.value_,this.lazyHash_=op(e)}return this.lazyHash_}getValue(){return this.value_}compareTo(e){return e===we.__childrenNodeConstructor.EMPTY_NODE?1:e instanceof we.__childrenNodeConstructor?-1:(V(e.isLeafNode(),"Unknown node type"),this.compareToLeafNode_(e))}compareToLeafNode_(e){const t=typeof e.value_,s=typeof this.value_,r=we.VALUE_TYPE_ORDER.indexOf(t),i=we.VALUE_TYPE_ORDER.indexOf(s);return V(r>=0,"Unknown leaf type: "+t),V(i>=0,"Unknown leaf type: "+s),r===i?s==="object"?0:this.value_<e.value_?-1:this.value_===e.value_?0:1:i-r}withIndex(){return this}isIndexed(){return!0}equals(e){if(e===this)return!0;if(e.isLeafNode()){const t=e;return this.value_===t.value_&&this.priorityNode_.equals(t.priorityNode_)}else return!1}}we.VALUE_TYPE_ORDER=["object","boolean","number","string"];/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Vp,Op;function yI(n){Vp=n}function EI(n){Op=n}class TI extends Qi{compare(e,t){const s=e.node.getPriority(),r=t.node.getPriority(),i=s.compareTo(r);return i===0?In(e.name,t.name):i}isDefinedOn(e){return!e.getPriority().isEmpty()}indexedValueChanged(e,t){return!e.getPriority().equals(t.getPriority())}minPost(){return Y.MIN}maxPost(){return new Y(yn,new we("[PRIORITY-POST]",Op))}makePost(e,t){const s=Vp(e);return new Y(t,new we("[PRIORITY-POST]",s))}toString(){return".priority"}}const Pe=new TI;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vI=Math.log(2);class wI{constructor(e){const t=i=>parseInt(Math.log(i)/vI,10),s=i=>parseInt(Array(i+1).join("1"),2);this.count=t(e+1),this.current_=this.count-1;const r=s(this.count);this.bits_=e+1&r}nextBitIsOne(){const e=!(this.bits_&1<<this.current_);return this.current_--,e}}const pi=function(n,e,t,s){n.sort(e);const r=function(u,h){const f=h-u;let p,m;if(f===0)return null;if(f===1)return p=n[u],m=t?t(p):p,new Ae(m,p.node,Ae.BLACK,null,null);{const I=parseInt(f/2,10)+u,C=r(u,I),k=r(I+1,h);return p=n[I],m=t?t(p):p,new Ae(m,p.node,Ae.BLACK,C,k)}},i=function(u){let h=null,f=null,p=n.length;const m=function(C,k){const N=p-C,B=p;p-=C;const L=r(N+1,B),U=n[N],$=t?t(U):U;I(new Ae($,U.node,k,null,L))},I=function(C){h?(h.left=C,h=C):(f=C,h=C)};for(let C=0;C<u.count;++C){const k=u.nextBitIsOne(),N=Math.pow(2,u.count-(C+1));k?m(N,Ae.BLACK):(m(N,Ae.BLACK),m(N,Ae.RED))}return f},a=new wI(n.length),l=i(a);return new Ge(s||e,l)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Bo;const Nn={};class It{static get Default(){return V(Nn&&Pe,"ChildrenNode.ts has not been loaded"),Bo=Bo||new It({".priority":Nn},{".priority":Pe}),Bo}constructor(e,t){this.indexes_=e,this.indexSet_=t}get(e){const t=Un(this.indexes_,e);if(!t)throw new Error("No index defined for "+e);return t instanceof Ge?t:null}hasIndex(e){return gt(this.indexSet_,e.toString())}addIndex(e,t){V(e!==Fn,"KeyIndex always exists and isn't meant to be added to the IndexMap.");const s=[];let r=!1;const i=t.getIterator(Y.Wrap);let a=i.getNext();for(;a;)r=r||e.isDefinedOn(a.node),s.push(a),a=i.getNext();let l;r?l=pi(s,e.getCompare()):l=Nn;const u=e.toString(),h={...this.indexSet_};h[u]=e;const f={...this.indexes_};return f[u]=l,new It(f,h)}addToIndexes(e,t){const s=Jr(this.indexes_,(r,i)=>{const a=Un(this.indexSet_,i);if(V(a,"Missing index implementation for "+i),r===Nn)if(a.isDefinedOn(e.node)){const l=[],u=t.getIterator(Y.Wrap);let h=u.getNext();for(;h;)h.name!==e.name&&l.push(h),h=u.getNext();return l.push(e),pi(l,a.getCompare())}else return Nn;else{const l=t.get(e.name);let u=r;return l&&(u=u.remove(new Y(e.name,l))),u.insert(e,e.node)}});return new It(s,this.indexSet_)}removeFromIndexes(e,t){const s=Jr(this.indexes_,r=>{if(r===Nn)return r;{const i=t.get(e.name);return i?r.remove(new Y(e.name,i)):r}});return new It(s,this.indexSet_)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let bs;class Z{static get EMPTY_NODE(){return bs||(bs=new Z(new Ge(Ol),null,It.Default))}constructor(e,t,s){this.children_=e,this.priorityNode_=t,this.indexMap_=s,this.lazyHash_=null,this.priorityNode_&&Dp(this.priorityNode_),this.children_.isEmpty()&&V(!this.priorityNode_||this.priorityNode_.isEmpty(),"An empty node cannot have a priority")}isLeafNode(){return!1}getPriority(){return this.priorityNode_||bs}updatePriority(e){return this.children_.isEmpty()?this:new Z(this.children_,e,this.indexMap_)}getImmediateChild(e){if(e===".priority")return this.getPriority();{const t=this.children_.get(e);return t===null?bs:t}}getChild(e){const t=W(e);return t===null?this:this.getImmediateChild(t).getChild(se(e))}hasChild(e){return this.children_.get(e)!==null}updateImmediateChild(e,t){if(V(t,"We should always be passing snapshot nodes"),e===".priority")return this.updatePriority(t);{const s=new Y(e,t);let r,i;t.isEmpty()?(r=this.children_.remove(e),i=this.indexMap_.removeFromIndexes(s,this.children_)):(r=this.children_.insert(e,t),i=this.indexMap_.addToIndexes(s,this.children_));const a=r.isEmpty()?bs:this.priorityNode_;return new Z(r,a,i)}}updateChild(e,t){const s=W(e);if(s===null)return t;{V(W(e)!==".priority"||Qt(e)===1,".priority must be the last token in a path");const r=this.getImmediateChild(s).updateChild(se(e),t);return this.updateImmediateChild(s,r)}}isEmpty(){return this.children_.isEmpty()}numChildren(){return this.children_.count()}val(e){if(this.isEmpty())return null;const t={};let s=0,r=0,i=!0;if(this.forEachChild(Pe,(a,l)=>{t[a]=l.val(e),s++,i&&Z.INTEGER_REGEXP_.test(a)?r=Math.max(r,Number(a)):i=!1}),!e&&i&&r<2*s){const a=[];for(const l in t)a[l]=t[l];return a}else return e&&!this.getPriority().isEmpty()&&(t[".priority"]=this.getPriority().val()),t}hash(){if(this.lazyHash_===null){let e="";this.getPriority().isEmpty()||(e+="priority:"+kp(this.getPriority().val())+":"),this.forEachChild(Pe,(t,s)=>{const r=s.hash();r!==""&&(e+=":"+t+":"+r)}),this.lazyHash_=e===""?"":op(e)}return this.lazyHash_}getPredecessorChildName(e,t,s){const r=this.resolveIndex_(s);if(r){const i=r.getPredecessorKey(new Y(e,t));return i?i.name:null}else return this.children_.getPredecessorKey(e)}getFirstChildName(e){const t=this.resolveIndex_(e);if(t){const s=t.minKey();return s&&s.name}else return this.children_.minKey()}getFirstChild(e){const t=this.getFirstChildName(e);return t?new Y(t,this.children_.get(t)):null}getLastChildName(e){const t=this.resolveIndex_(e);if(t){const s=t.maxKey();return s&&s.name}else return this.children_.maxKey()}getLastChild(e){const t=this.getLastChildName(e);return t?new Y(t,this.children_.get(t)):null}forEachChild(e,t){const s=this.resolveIndex_(e);return s?s.inorderTraversal(r=>t(r.name,r.node)):this.children_.inorderTraversal(t)}getIterator(e){return this.getIteratorFrom(e.minPost(),e)}getIteratorFrom(e,t){const s=this.resolveIndex_(t);if(s)return s.getIteratorFrom(e,r=>r);{const r=this.children_.getIteratorFrom(e.name,Y.Wrap);let i=r.peek();for(;i!=null&&t.compare(i,e)<0;)r.getNext(),i=r.peek();return r}}getReverseIterator(e){return this.getReverseIteratorFrom(e.maxPost(),e)}getReverseIteratorFrom(e,t){const s=this.resolveIndex_(t);if(s)return s.getReverseIteratorFrom(e,r=>r);{const r=this.children_.getReverseIteratorFrom(e.name,Y.Wrap);let i=r.peek();for(;i!=null&&t.compare(i,e)>0;)r.getNext(),i=r.peek();return r}}compareTo(e){return this.isEmpty()?e.isEmpty()?0:-1:e.isLeafNode()||e.isEmpty()?1:e===pr?-1:0}withIndex(e){if(e===Fn||this.indexMap_.hasIndex(e))return this;{const t=this.indexMap_.addIndex(e,this.children_);return new Z(this.children_,this.priorityNode_,t)}}isIndexed(e){return e===Fn||this.indexMap_.hasIndex(e)}equals(e){if(e===this)return!0;if(e.isLeafNode())return!1;{const t=e;if(this.getPriority().equals(t.getPriority()))if(this.children_.count()===t.children_.count()){const s=this.getIterator(Pe),r=t.getIterator(Pe);let i=s.getNext(),a=r.getNext();for(;i&&a;){if(i.name!==a.name||!i.node.equals(a.node))return!1;i=s.getNext(),a=r.getNext()}return i===null&&a===null}else return!1;else return!1}}resolveIndex_(e){return e===Fn?null:this.indexMap_.get(e.toString())}}Z.INTEGER_REGEXP_=/^(0|[1-9]\d*)$/;class II extends Z{constructor(){super(new Ge(Ol),Z.EMPTY_NODE,It.Default)}compareTo(e){return e===this?0:1}equals(e){return e===this}getPriority(){return this}getImmediateChild(e){return Z.EMPTY_NODE}isEmpty(){return!1}}const pr=new II;Object.defineProperties(Y,{MIN:{value:new Y(Kn,Z.EMPTY_NODE)},MAX:{value:new Y(yn,pr)}});Np.__EMPTY_NODE=Z.EMPTY_NODE;we.__childrenNodeConstructor=Z;gI(pr);EI(pr);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const AI=!0;function ge(n,e=null){if(n===null)return Z.EMPTY_NODE;if(typeof n=="object"&&".priority"in n&&(e=n[".priority"]),V(e===null||typeof e=="string"||typeof e=="number"||typeof e=="object"&&".sv"in e,"Invalid priority type found: "+typeof e),typeof n=="object"&&".value"in n&&n[".value"]!==null&&(n=n[".value"]),typeof n!="object"||".sv"in n){const t=n;return new we(t,ge(e))}if(!(n instanceof Array)&&AI){const t=[];let s=!1;if(Qe(n,(a,l)=>{if(a.substring(0,1)!=="."){const u=ge(l);u.isEmpty()||(s=s||!u.getPriority().isEmpty(),t.push(new Y(a,u)))}}),t.length===0)return Z.EMPTY_NODE;const i=pi(t,mI,a=>a.name,Ol);if(s){const a=pi(t,Pe.getCompare());return new Z(i,ge(e),new It({".priority":a},{".priority":Pe}))}else return new Z(i,ge(e),It.Default)}else{let t=Z.EMPTY_NODE;return Qe(n,(s,r)=>{if(gt(n,s)&&s.substring(0,1)!=="."){const i=ge(r);(i.isLeafNode()||!i.isEmpty())&&(t=t.updateImmediateChild(s,i))}}),t.updatePriority(ge(e))}}yI(ge);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class RI extends Qi{constructor(e){super(),this.indexPath_=e,V(!H(e)&&W(e)!==".priority","Can't create PathIndex with empty path or .priority key")}extractChild(e){return e.getChild(this.indexPath_)}isDefinedOn(e){return!e.getChild(this.indexPath_).isEmpty()}compare(e,t){const s=this.extractChild(e.node),r=this.extractChild(t.node),i=s.compareTo(r);return i===0?In(e.name,t.name):i}makePost(e,t){const s=ge(e),r=Z.EMPTY_NODE.updateChild(this.indexPath_,s);return new Y(t,r)}maxPost(){const e=Z.EMPTY_NODE.updateChild(this.indexPath_,pr);return new Y(yn,e)}toString(){return nr(this.indexPath_,0).join("/")}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class CI extends Qi{compare(e,t){const s=e.node.compareTo(t.node);return s===0?In(e.name,t.name):s}isDefinedOn(e){return!0}indexedValueChanged(e,t){return!e.equals(t)}minPost(){return Y.MIN}maxPost(){return Y.MAX}makePost(e,t){const s=ge(e);return new Y(t,s)}toString(){return".value"}}const SI=new CI;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bI(n){return{type:"value",snapshotNode:n}}function PI(n,e){return{type:"child_added",snapshotNode:e,childName:n}}function NI(n,e){return{type:"child_removed",snapshotNode:e,childName:n}}function kh(n,e,t){return{type:"child_changed",snapshotNode:e,childName:n,oldSnap:t}}function kI(n,e){return{type:"child_moved",snapshotNode:e,childName:n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xl{constructor(){this.limitSet_=!1,this.startSet_=!1,this.startNameSet_=!1,this.startAfterSet_=!1,this.endSet_=!1,this.endNameSet_=!1,this.endBeforeSet_=!1,this.limit_=0,this.viewFrom_="",this.indexStartValue_=null,this.indexStartName_="",this.indexEndValue_=null,this.indexEndName_="",this.index_=Pe}hasStart(){return this.startSet_}isViewFromLeft(){return this.viewFrom_===""?this.startSet_:this.viewFrom_==="l"}getIndexStartValue(){return V(this.startSet_,"Only valid if start has been set"),this.indexStartValue_}getIndexStartName(){return V(this.startSet_,"Only valid if start has been set"),this.startNameSet_?this.indexStartName_:Kn}hasEnd(){return this.endSet_}getIndexEndValue(){return V(this.endSet_,"Only valid if end has been set"),this.indexEndValue_}getIndexEndName(){return V(this.endSet_,"Only valid if end has been set"),this.endNameSet_?this.indexEndName_:yn}hasLimit(){return this.limitSet_}hasAnchoredLimit(){return this.limitSet_&&this.viewFrom_!==""}getLimit(){return V(this.limitSet_,"Only valid if limit has been set"),this.limit_}getIndex(){return this.index_}loadsAllData(){return!(this.startSet_||this.endSet_||this.limitSet_)}isDefault(){return this.loadsAllData()&&this.index_===Pe}copy(){const e=new xl;return e.limitSet_=this.limitSet_,e.limit_=this.limit_,e.startSet_=this.startSet_,e.startAfterSet_=this.startAfterSet_,e.indexStartValue_=this.indexStartValue_,e.startNameSet_=this.startNameSet_,e.indexStartName_=this.indexStartName_,e.endSet_=this.endSet_,e.endBeforeSet_=this.endBeforeSet_,e.indexEndValue_=this.indexEndValue_,e.endNameSet_=this.endNameSet_,e.indexEndName_=this.indexEndName_,e.index_=this.index_,e.viewFrom_=this.viewFrom_,e}}function Dh(n){const e={};if(n.isDefault())return e;let t;if(n.index_===Pe?t="$priority":n.index_===SI?t="$value":n.index_===Fn?t="$key":(V(n.index_ instanceof RI,"Unrecognized index type!"),t=n.index_.toString()),e.orderBy=Se(t),n.startSet_){const s=n.startAfterSet_?"startAfter":"startAt";e[s]=Se(n.indexStartValue_),n.startNameSet_&&(e[s]+=","+Se(n.indexStartName_))}if(n.endSet_){const s=n.endBeforeSet_?"endBefore":"endAt";e[s]=Se(n.indexEndValue_),n.endNameSet_&&(e[s]+=","+Se(n.indexEndName_))}return n.limitSet_&&(n.isViewFromLeft()?e.limitToFirst=n.limit_:e.limitToLast=n.limit_),e}function Vh(n){const e={};if(n.startSet_&&(e.sp=n.indexStartValue_,n.startNameSet_&&(e.sn=n.indexStartName_),e.sin=!n.startAfterSet_),n.endSet_&&(e.ep=n.indexEndValue_,n.endNameSet_&&(e.en=n.indexEndName_),e.ein=!n.endBeforeSet_),n.limitSet_){e.l=n.limit_;let t=n.viewFrom_;t===""&&(n.isViewFromLeft()?t="l":t="r"),e.vf=t}return n.index_!==Pe&&(e.i=n.index_.toString()),e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _i extends Rp{reportStats(e){throw new Error("Method not implemented.")}static getListenId_(e,t){return t!==void 0?"tag$"+t:(V(e._queryParams.isDefault(),"should have a tag if it's not a default query."),e._path.toString())}constructor(e,t,s,r){super(),this.repoInfo_=e,this.onDataUpdate_=t,this.authTokenProvider_=s,this.appCheckTokenProvider_=r,this.log_=fr("p:rest:"),this.listens_={}}listen(e,t,s,r){const i=e._path.toString();this.log_("Listen called for "+i+" "+e._queryIdentifier);const a=_i.getListenId_(e,s),l={};this.listens_[a]=l;const u=Dh(e._queryParams);this.restRequest_(i+".json",u,(h,f)=>{let p=f;if(h===404&&(p=null,h=null),h===null&&this.onDataUpdate_(i,p,!1,s),Un(this.listens_,a)===l){let m;h?h===401?m="permission_denied":m="rest_error:"+h:m="ok",r(m,null)}})}unlisten(e,t){const s=_i.getListenId_(e,t);delete this.listens_[s]}get(e){const t=Dh(e._queryParams),s=e._path.toString(),r=new wt;return this.restRequest_(s+".json",t,(i,a)=>{let l=a;i===404&&(l=null,i=null),i===null?(this.onDataUpdate_(s,l,!1,null),r.resolve(l)):r.reject(new Error(l))}),r.promise}refreshAuthToken(e){}restRequest_(e,t={},s){return t.format="export",Promise.all([this.authTokenProvider_.getToken(!1),this.appCheckTokenProvider_.getToken(!1)]).then(([r,i])=>{r&&r.accessToken&&(t.auth=r.accessToken),i&&i.token&&(t.ac=i.token);const a=(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host+e+"?ns="+this.repoInfo_.namespace+Tm(t);this.log_("Sending REST request for "+a);const l=new XMLHttpRequest;l.onreadystatechange=()=>{if(s&&l.readyState===4){this.log_("REST Response for "+a+" received. status:",l.status,"response:",l.responseText);let u=null;if(l.status>=200&&l.status<300){try{u=Ws(l.responseText)}catch{Ke("Failed to parse JSON response for "+a+": "+l.responseText)}s(null,u)}else l.status!==401&&l.status!==404&&Ke("Got unsuccessful REST response for "+a+" Status: "+l.status),s(l.status);s=null}},l.open("GET",a,!0),l.send()})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class DI{constructor(){this.rootNode_=Z.EMPTY_NODE}getNode(e){return this.rootNode_.getChild(e)}updateSnapshot(e,t){this.rootNode_=this.rootNode_.updateChild(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mi(){return{value:null,children:new Map}}function os(n,e,t){if(H(e))n.value=t,n.children.clear();else if(n.value!==null)n.value=n.value.updateChild(e,t);else{const s=W(e);n.children.has(s)||n.children.set(s,mi());const r=n.children.get(s);e=se(e),os(r,e,t)}}function va(n,e){if(H(e))return n.value=null,n.children.clear(),!0;if(n.value!==null){if(n.value.isLeafNode())return!1;{const t=n.value;return n.value=null,t.forEachChild(Pe,(s,r)=>{os(n,new ne(s),r)}),va(n,e)}}else if(n.children.size>0){const t=W(e);return e=se(e),n.children.has(t)&&va(n.children.get(t),e)&&n.children.delete(t),n.children.size===0}else return!0}function wa(n,e,t){n.value!==null?t(e,n.value):VI(n,(s,r)=>{const i=new ne(e.toString()+"/"+s);wa(r,i,t)})}function VI(n,e){n.children.forEach((t,s)=>{e(s,t)})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class OI{constructor(e){this.collection_=e,this.last_=null}get(){const e=this.collection_.get(),t={...e};return this.last_&&Qe(this.last_,(s,r)=>{t[s]=t[s]-r}),this.last_=e,t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Oh=10*1e3,xI=30*1e3,MI=5*60*1e3;class LI{constructor(e,t){this.server_=t,this.statsToReport_={},this.statsListener_=new OI(e);const s=Oh+(xI-Oh)*Math.random();qs(this.reportStats_.bind(this),Math.floor(s))}reportStats_(){const e=this.statsListener_.get(),t={};let s=!1;Qe(e,(r,i)=>{i>0&&gt(this.statsToReport_,r)&&(t[r]=i,s=!0)}),s&&this.server_.reportStats(t),qs(this.reportStats_.bind(this),Math.floor(Math.random()*2*MI))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ut;(function(n){n[n.OVERWRITE=0]="OVERWRITE",n[n.MERGE=1]="MERGE",n[n.ACK_USER_WRITE=2]="ACK_USER_WRITE",n[n.LISTEN_COMPLETE=3]="LISTEN_COMPLETE"})(ut||(ut={}));function xp(){return{fromUser:!0,fromServer:!1,queryId:null,tagged:!1}}function Mp(){return{fromUser:!1,fromServer:!0,queryId:null,tagged:!1}}function Lp(n){return{fromUser:!1,fromServer:!0,queryId:n,tagged:!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gi{constructor(e,t,s){this.path=e,this.affectedTree=t,this.revert=s,this.type=ut.ACK_USER_WRITE,this.source=xp()}operationForChild(e){if(H(this.path)){if(this.affectedTree.value!=null)return V(this.affectedTree.children.isEmpty(),"affectedTree should not have overlapping affected paths."),this;{const t=this.affectedTree.subtree(new ne(e));return new gi(ee(),t,this.revert)}}else return V(W(this.path)===e,"operationForChild called for unrelated child."),new gi(se(this.path),this.affectedTree,this.revert)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class En{constructor(e,t,s){this.source=e,this.path=t,this.snap=s,this.type=ut.OVERWRITE}operationForChild(e){return H(this.path)?new En(this.source,ee(),this.snap.getImmediateChild(e)):new En(this.source,se(this.path),this.snap)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sr{constructor(e,t,s){this.source=e,this.path=t,this.children=s,this.type=ut.MERGE}operationForChild(e){if(H(this.path)){const t=this.children.subtree(new ne(e));return t.isEmpty()?null:t.value?new En(this.source,ee(),t.value):new sr(this.source,ee(),t)}else return V(W(this.path)===e,"Can't get a merge for a child not on the path of the operation"),new sr(this.source,se(this.path),this.children)}toString(){return"Operation("+this.path+": "+this.source.toString()+" merge: "+this.children.toString()+")"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ml{constructor(e,t,s){this.node_=e,this.fullyInitialized_=t,this.filtered_=s}isFullyInitialized(){return this.fullyInitialized_}isFiltered(){return this.filtered_}isCompleteForPath(e){if(H(e))return this.isFullyInitialized()&&!this.filtered_;const t=W(e);return this.isCompleteForChild(t)}isCompleteForChild(e){return this.isFullyInitialized()&&!this.filtered_||this.node_.hasChild(e)}getNode(){return this.node_}}function FI(n,e,t,s){const r=[],i=[];return e.forEach(a=>{a.type==="child_changed"&&n.index_.indexedValueChanged(a.oldSnap,a.snapshotNode)&&i.push(kI(a.childName,a.snapshotNode))}),Ps(n,r,"child_removed",e,s,t),Ps(n,r,"child_added",e,s,t),Ps(n,r,"child_moved",i,s,t),Ps(n,r,"child_changed",e,s,t),Ps(n,r,"value",e,s,t),r}function Ps(n,e,t,s,r,i){const a=s.filter(l=>l.type===t);a.sort((l,u)=>BI(n,l,u)),a.forEach(l=>{const u=UI(n,l,i);r.forEach(h=>{h.respondsTo(l.type)&&e.push(h.createEvent(u,n.query_))})})}function UI(n,e,t){return e.type==="value"||e.type==="child_removed"||(e.prevName=t.getPredecessorChildName(e.childName,e.snapshotNode,n.index_)),e}function BI(n,e,t){if(e.childName==null||t.childName==null)throw Xn("Should only compare child_ events.");const s=new Y(e.childName,e.snapshotNode),r=new Y(t.childName,t.snapshotNode);return n.index_.compare(s,r)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Fp(n,e){return{eventCache:n,serverCache:e}}function js(n,e,t,s){return Fp(new Ml(e,t,s),n.serverCache)}function Up(n,e,t,s){return Fp(n.eventCache,new Ml(e,t,s))}function Ia(n){return n.eventCache.isFullyInitialized()?n.eventCache.getNode():null}function Tn(n){return n.serverCache.isFullyInitialized()?n.serverCache.getNode():null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let qo;const qI=()=>(qo||(qo=new Ge(Cw)),qo);class ae{static fromObject(e){let t=new ae(null);return Qe(e,(s,r)=>{t=t.set(new ne(s),r)}),t}constructor(e,t=qI()){this.value=e,this.children=t}isEmpty(){return this.value===null&&this.children.isEmpty()}findRootMostMatchingPathAndValue(e,t){if(this.value!=null&&t(this.value))return{path:ee(),value:this.value};if(H(e))return null;{const s=W(e),r=this.children.get(s);if(r!==null){const i=r.findRootMostMatchingPathAndValue(se(e),t);return i!=null?{path:_e(new ne(s),i.path),value:i.value}:null}else return null}}findRootMostValueAndPath(e){return this.findRootMostMatchingPathAndValue(e,()=>!0)}subtree(e){if(H(e))return this;{const t=W(e),s=this.children.get(t);return s!==null?s.subtree(se(e)):new ae(null)}}set(e,t){if(H(e))return new ae(t,this.children);{const s=W(e),i=(this.children.get(s)||new ae(null)).set(se(e),t),a=this.children.insert(s,i);return new ae(this.value,a)}}remove(e){if(H(e))return this.children.isEmpty()?new ae(null):new ae(null,this.children);{const t=W(e),s=this.children.get(t);if(s){const r=s.remove(se(e));let i;return r.isEmpty()?i=this.children.remove(t):i=this.children.insert(t,r),this.value===null&&i.isEmpty()?new ae(null):new ae(this.value,i)}else return this}}get(e){if(H(e))return this.value;{const t=W(e),s=this.children.get(t);return s?s.get(se(e)):null}}setTree(e,t){if(H(e))return t;{const s=W(e),i=(this.children.get(s)||new ae(null)).setTree(se(e),t);let a;return i.isEmpty()?a=this.children.remove(s):a=this.children.insert(s,i),new ae(this.value,a)}}fold(e){return this.fold_(ee(),e)}fold_(e,t){const s={};return this.children.inorderTraversal((r,i)=>{s[r]=i.fold_(_e(e,r),t)}),t(e,this.value,s)}findOnPath(e,t){return this.findOnPath_(e,ee(),t)}findOnPath_(e,t,s){const r=this.value?s(t,this.value):!1;if(r)return r;if(H(e))return null;{const i=W(e),a=this.children.get(i);return a?a.findOnPath_(se(e),_e(t,i),s):null}}foreachOnPath(e,t){return this.foreachOnPath_(e,ee(),t)}foreachOnPath_(e,t,s){if(H(e))return this;{this.value&&s(t,this.value);const r=W(e),i=this.children.get(r);return i?i.foreachOnPath_(se(e),_e(t,r),s):new ae(null)}}foreach(e){this.foreach_(ee(),e)}foreach_(e,t){this.children.inorderTraversal((s,r)=>{r.foreach_(_e(e,s),t)}),this.value&&t(e,this.value)}foreachChild(e){this.children.inorderTraversal((t,s)=>{s.value&&e(t,s.value)})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class it{constructor(e){this.writeTree_=e}static empty(){return new it(new ae(null))}}function $s(n,e,t){if(H(e))return new it(new ae(t));{const s=n.writeTree_.findRootMostValueAndPath(e);if(s!=null){const r=s.path;let i=s.value;const a=et(r,e);return i=i.updateChild(a,t),new it(n.writeTree_.set(r,i))}else{const r=new ae(t),i=n.writeTree_.setTree(e,r);return new it(i)}}}function xh(n,e,t){let s=n;return Qe(t,(r,i)=>{s=$s(s,_e(e,r),i)}),s}function Mh(n,e){if(H(e))return it.empty();{const t=n.writeTree_.setTree(e,new ae(null));return new it(t)}}function Aa(n,e){return An(n,e)!=null}function An(n,e){const t=n.writeTree_.findRootMostValueAndPath(e);return t!=null?n.writeTree_.get(t.path).getChild(et(t.path,e)):null}function Lh(n){const e=[],t=n.writeTree_.value;return t!=null?t.isLeafNode()||t.forEachChild(Pe,(s,r)=>{e.push(new Y(s,r))}):n.writeTree_.children.inorderTraversal((s,r)=>{r.value!=null&&e.push(new Y(s,r.value))}),e}function qt(n,e){if(H(e))return n;{const t=An(n,e);return t!=null?new it(new ae(t)):new it(n.writeTree_.subtree(e))}}function Ra(n){return n.writeTree_.isEmpty()}function Qn(n,e){return Bp(ee(),n.writeTree_,e)}function Bp(n,e,t){if(e.value!=null)return t.updateChild(n,e.value);{let s=null;return e.children.inorderTraversal((r,i)=>{r===".priority"?(V(i.value!==null,"Priority writes must always be leaf nodes"),s=i.value):t=Bp(_e(n,r),i,t)}),!t.getChild(n).isEmpty()&&s!==null&&(t=t.updateChild(_e(n,".priority"),s)),t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function qp(n,e){return Hp(e,n)}function jI(n,e,t,s,r){V(s>n.lastWriteId,"Stacking an older write on top of newer ones"),r===void 0&&(r=!0),n.allWrites.push({path:e,snap:t,writeId:s,visible:r}),r&&(n.visibleWrites=$s(n.visibleWrites,e,t)),n.lastWriteId=s}function $I(n,e){for(let t=0;t<n.allWrites.length;t++){const s=n.allWrites[t];if(s.writeId===e)return s}return null}function WI(n,e){const t=n.allWrites.findIndex(l=>l.writeId===e);V(t>=0,"removeWrite called with nonexistent writeId.");const s=n.allWrites[t];n.allWrites.splice(t,1);let r=s.visible,i=!1,a=n.allWrites.length-1;for(;r&&a>=0;){const l=n.allWrites[a];l.visible&&(a>=t&&zI(l,s.path)?r=!1:tt(s.path,l.path)&&(i=!0)),a--}if(r){if(i)return HI(n),!0;if(s.snap)n.visibleWrites=Mh(n.visibleWrites,s.path);else{const l=s.children;Qe(l,u=>{n.visibleWrites=Mh(n.visibleWrites,_e(s.path,u))})}return!0}else return!1}function zI(n,e){if(n.snap)return tt(n.path,e);for(const t in n.children)if(n.children.hasOwnProperty(t)&&tt(_e(n.path,t),e))return!0;return!1}function HI(n){n.visibleWrites=jp(n.allWrites,GI,ee()),n.allWrites.length>0?n.lastWriteId=n.allWrites[n.allWrites.length-1].writeId:n.lastWriteId=-1}function GI(n){return n.visible}function jp(n,e,t){let s=it.empty();for(let r=0;r<n.length;++r){const i=n[r];if(e(i)){const a=i.path;let l;if(i.snap)tt(t,a)?(l=et(t,a),s=$s(s,l,i.snap)):tt(a,t)&&(l=et(a,t),s=$s(s,ee(),i.snap.getChild(l)));else if(i.children){if(tt(t,a))l=et(t,a),s=xh(s,l,i.children);else if(tt(a,t))if(l=et(a,t),H(l))s=xh(s,ee(),i.children);else{const u=Un(i.children,W(l));if(u){const h=u.getChild(se(l));s=$s(s,ee(),h)}}}else throw Xn("WriteRecord should have .snap or .children")}}return s}function $p(n,e,t,s,r){if(!s&&!r){const i=An(n.visibleWrites,e);if(i!=null)return i;{const a=qt(n.visibleWrites,e);if(Ra(a))return t;if(t==null&&!Aa(a,ee()))return null;{const l=t||Z.EMPTY_NODE;return Qn(a,l)}}}else{const i=qt(n.visibleWrites,e);if(!r&&Ra(i))return t;if(!r&&t==null&&!Aa(i,ee()))return null;{const a=function(h){return(h.visible||r)&&(!s||!~s.indexOf(h.writeId))&&(tt(h.path,e)||tt(e,h.path))},l=jp(n.allWrites,a,e),u=t||Z.EMPTY_NODE;return Qn(l,u)}}}function KI(n,e,t){let s=Z.EMPTY_NODE;const r=An(n.visibleWrites,e);if(r)return r.isLeafNode()||r.forEachChild(Pe,(i,a)=>{s=s.updateImmediateChild(i,a)}),s;if(t){const i=qt(n.visibleWrites,e);return t.forEachChild(Pe,(a,l)=>{const u=Qn(qt(i,new ne(a)),l);s=s.updateImmediateChild(a,u)}),Lh(i).forEach(a=>{s=s.updateImmediateChild(a.name,a.node)}),s}else{const i=qt(n.visibleWrites,e);return Lh(i).forEach(a=>{s=s.updateImmediateChild(a.name,a.node)}),s}}function QI(n,e,t,s,r){V(s||r,"Either existingEventSnap or existingServerSnap must exist");const i=_e(e,t);if(Aa(n.visibleWrites,i))return null;{const a=qt(n.visibleWrites,i);return Ra(a)?r.getChild(t):Qn(a,r.getChild(t))}}function YI(n,e,t,s){const r=_e(e,t),i=An(n.visibleWrites,r);if(i!=null)return i;if(s.isCompleteForChild(t)){const a=qt(n.visibleWrites,r);return Qn(a,s.getNode().getImmediateChild(t))}else return null}function XI(n,e){return An(n.visibleWrites,e)}function JI(n,e,t,s,r,i,a){let l;const u=qt(n.visibleWrites,e),h=An(u,ee());if(h!=null)l=h;else if(t!=null)l=Qn(u,t);else return[];if(l=l.withIndex(a),!l.isEmpty()&&!l.isLeafNode()){const f=[],p=a.getCompare(),m=i?l.getReverseIteratorFrom(s,a):l.getIteratorFrom(s,a);let I=m.getNext();for(;I&&f.length<r;)p(I,s)!==0&&f.push(I),I=m.getNext();return f}else return[]}function ZI(){return{visibleWrites:it.empty(),allWrites:[],lastWriteId:-1}}function Ca(n,e,t,s){return $p(n.writeTree,n.treePath,e,t,s)}function Wp(n,e){return KI(n.writeTree,n.treePath,e)}function Fh(n,e,t,s){return QI(n.writeTree,n.treePath,e,t,s)}function yi(n,e){return XI(n.writeTree,_e(n.treePath,e))}function eA(n,e,t,s,r,i){return JI(n.writeTree,n.treePath,e,t,s,r,i)}function Ll(n,e,t){return YI(n.writeTree,n.treePath,e,t)}function zp(n,e){return Hp(_e(n.treePath,e),n.writeTree)}function Hp(n,e){return{treePath:n,writeTree:e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tA{constructor(){this.changeMap=new Map}trackChildChange(e){const t=e.type,s=e.childName;V(t==="child_added"||t==="child_changed"||t==="child_removed","Only child changes supported for tracking"),V(s!==".priority","Only non-priority child changes can be tracked.");const r=this.changeMap.get(s);if(r){const i=r.type;if(t==="child_added"&&i==="child_removed")this.changeMap.set(s,kh(s,e.snapshotNode,r.snapshotNode));else if(t==="child_removed"&&i==="child_added")this.changeMap.delete(s);else if(t==="child_removed"&&i==="child_changed")this.changeMap.set(s,NI(s,r.oldSnap));else if(t==="child_changed"&&i==="child_added")this.changeMap.set(s,PI(s,e.snapshotNode));else if(t==="child_changed"&&i==="child_changed")this.changeMap.set(s,kh(s,e.snapshotNode,r.oldSnap));else throw Xn("Illegal combination of changes: "+e+" occurred after "+r)}else this.changeMap.set(s,e)}getChanges(){return Array.from(this.changeMap.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nA{getCompleteChild(e){return null}getChildAfterChild(e,t,s){return null}}const Gp=new nA;class Fl{constructor(e,t,s=null){this.writes_=e,this.viewCache_=t,this.optCompleteServerCache_=s}getCompleteChild(e){const t=this.viewCache_.eventCache;if(t.isCompleteForChild(e))return t.getNode().getImmediateChild(e);{const s=this.optCompleteServerCache_!=null?new Ml(this.optCompleteServerCache_,!0,!1):this.viewCache_.serverCache;return Ll(this.writes_,e,s)}}getChildAfterChild(e,t,s){const r=this.optCompleteServerCache_!=null?this.optCompleteServerCache_:Tn(this.viewCache_),i=eA(this.writes_,r,t,1,s,e);return i.length===0?null:i[0]}}function sA(n,e){V(e.eventCache.getNode().isIndexed(n.filter.getIndex()),"Event snap not indexed"),V(e.serverCache.getNode().isIndexed(n.filter.getIndex()),"Server snap not indexed")}function rA(n,e,t,s,r){const i=new tA;let a,l;if(t.type===ut.OVERWRITE){const h=t;h.source.fromUser?a=Sa(n,e,h.path,h.snap,s,r,i):(V(h.source.fromServer,"Unknown source."),l=h.source.tagged||e.serverCache.isFiltered()&&!H(h.path),a=Ei(n,e,h.path,h.snap,s,r,l,i))}else if(t.type===ut.MERGE){const h=t;h.source.fromUser?a=oA(n,e,h.path,h.children,s,r,i):(V(h.source.fromServer,"Unknown source."),l=h.source.tagged||e.serverCache.isFiltered(),a=ba(n,e,h.path,h.children,s,r,l,i))}else if(t.type===ut.ACK_USER_WRITE){const h=t;h.revert?a=cA(n,e,h.path,s,r,i):a=aA(n,e,h.path,h.affectedTree,s,r,i)}else if(t.type===ut.LISTEN_COMPLETE)a=lA(n,e,t.path,s,i);else throw Xn("Unknown operation type: "+t.type);const u=i.getChanges();return iA(e,a,u),{viewCache:a,changes:u}}function iA(n,e,t){const s=e.eventCache;if(s.isFullyInitialized()){const r=s.getNode().isLeafNode()||s.getNode().isEmpty(),i=Ia(n);(t.length>0||!n.eventCache.isFullyInitialized()||r&&!s.getNode().equals(i)||!s.getNode().getPriority().equals(i.getPriority()))&&t.push(bI(Ia(e)))}}function Kp(n,e,t,s,r,i){const a=e.eventCache;if(yi(s,t)!=null)return e;{let l,u;if(H(t))if(V(e.serverCache.isFullyInitialized(),"If change path is empty, we must have complete server data"),e.serverCache.isFiltered()){const h=Tn(e),f=h instanceof Z?h:Z.EMPTY_NODE,p=Wp(s,f);l=n.filter.updateFullNode(e.eventCache.getNode(),p,i)}else{const h=Ca(s,Tn(e));l=n.filter.updateFullNode(e.eventCache.getNode(),h,i)}else{const h=W(t);if(h===".priority"){V(Qt(t)===1,"Can't have a priority with additional path components");const f=a.getNode();u=e.serverCache.getNode();const p=Fh(s,t,f,u);p!=null?l=n.filter.updatePriority(f,p):l=a.getNode()}else{const f=se(t);let p;if(a.isCompleteForChild(h)){u=e.serverCache.getNode();const m=Fh(s,t,a.getNode(),u);m!=null?p=a.getNode().getImmediateChild(h).updateChild(f,m):p=a.getNode().getImmediateChild(h)}else p=Ll(s,h,e.serverCache);p!=null?l=n.filter.updateChild(a.getNode(),h,p,f,r,i):l=a.getNode()}}return js(e,l,a.isFullyInitialized()||H(t),n.filter.filtersNodes())}}function Ei(n,e,t,s,r,i,a,l){const u=e.serverCache;let h;const f=a?n.filter:n.filter.getIndexedFilter();if(H(t))h=f.updateFullNode(u.getNode(),s,null);else if(f.filtersNodes()&&!u.isFiltered()){const I=u.getNode().updateChild(t,s);h=f.updateFullNode(u.getNode(),I,null)}else{const I=W(t);if(!u.isCompleteForPath(t)&&Qt(t)>1)return e;const C=se(t),N=u.getNode().getImmediateChild(I).updateChild(C,s);I===".priority"?h=f.updatePriority(u.getNode(),N):h=f.updateChild(u.getNode(),I,N,C,Gp,null)}const p=Up(e,h,u.isFullyInitialized()||H(t),f.filtersNodes()),m=new Fl(r,p,i);return Kp(n,p,t,r,m,l)}function Sa(n,e,t,s,r,i,a){const l=e.eventCache;let u,h;const f=new Fl(r,e,i);if(H(t))h=n.filter.updateFullNode(e.eventCache.getNode(),s,a),u=js(e,h,!0,n.filter.filtersNodes());else{const p=W(t);if(p===".priority")h=n.filter.updatePriority(e.eventCache.getNode(),s),u=js(e,h,l.isFullyInitialized(),l.isFiltered());else{const m=se(t),I=l.getNode().getImmediateChild(p);let C;if(H(m))C=s;else{const k=f.getCompleteChild(p);k!=null?Dl(m)===".priority"&&k.getChild(Sp(m)).isEmpty()?C=k:C=k.updateChild(m,s):C=Z.EMPTY_NODE}if(I.equals(C))u=e;else{const k=n.filter.updateChild(l.getNode(),p,C,m,f,a);u=js(e,k,l.isFullyInitialized(),n.filter.filtersNodes())}}}return u}function Uh(n,e){return n.eventCache.isCompleteForChild(e)}function oA(n,e,t,s,r,i,a){let l=e;return s.foreach((u,h)=>{const f=_e(t,u);Uh(e,W(f))&&(l=Sa(n,l,f,h,r,i,a))}),s.foreach((u,h)=>{const f=_e(t,u);Uh(e,W(f))||(l=Sa(n,l,f,h,r,i,a))}),l}function Bh(n,e,t){return t.foreach((s,r)=>{e=e.updateChild(s,r)}),e}function ba(n,e,t,s,r,i,a,l){if(e.serverCache.getNode().isEmpty()&&!e.serverCache.isFullyInitialized())return e;let u=e,h;H(t)?h=s:h=new ae(null).setTree(t,s);const f=e.serverCache.getNode();return h.children.inorderTraversal((p,m)=>{if(f.hasChild(p)){const I=e.serverCache.getNode().getImmediateChild(p),C=Bh(n,I,m);u=Ei(n,u,new ne(p),C,r,i,a,l)}}),h.children.inorderTraversal((p,m)=>{const I=!e.serverCache.isCompleteForChild(p)&&m.value===null;if(!f.hasChild(p)&&!I){const C=e.serverCache.getNode().getImmediateChild(p),k=Bh(n,C,m);u=Ei(n,u,new ne(p),k,r,i,a,l)}}),u}function aA(n,e,t,s,r,i,a){if(yi(r,t)!=null)return e;const l=e.serverCache.isFiltered(),u=e.serverCache;if(s.value!=null){if(H(t)&&u.isFullyInitialized()||u.isCompleteForPath(t))return Ei(n,e,t,u.getNode().getChild(t),r,i,l,a);if(H(t)){let h=new ae(null);return u.getNode().forEachChild(Fn,(f,p)=>{h=h.set(new ne(f),p)}),ba(n,e,t,h,r,i,l,a)}else return e}else{let h=new ae(null);return s.foreach((f,p)=>{const m=_e(t,f);u.isCompleteForPath(m)&&(h=h.set(f,u.getNode().getChild(m)))}),ba(n,e,t,h,r,i,l,a)}}function lA(n,e,t,s,r){const i=e.serverCache,a=Up(e,i.getNode(),i.isFullyInitialized()||H(t),i.isFiltered());return Kp(n,a,t,s,Gp,r)}function cA(n,e,t,s,r,i){let a;if(yi(s,t)!=null)return e;{const l=new Fl(s,e,r),u=e.eventCache.getNode();let h;if(H(t)||W(t)===".priority"){let f;if(e.serverCache.isFullyInitialized())f=Ca(s,Tn(e));else{const p=e.serverCache.getNode();V(p instanceof Z,"serverChildren would be complete if leaf node"),f=Wp(s,p)}f=f,h=n.filter.updateFullNode(u,f,i)}else{const f=W(t);let p=Ll(s,f,e.serverCache);p==null&&e.serverCache.isCompleteForChild(f)&&(p=u.getImmediateChild(f)),p!=null?h=n.filter.updateChild(u,f,p,se(t),l,i):e.eventCache.getNode().hasChild(f)?h=n.filter.updateChild(u,f,Z.EMPTY_NODE,se(t),l,i):h=u,h.isEmpty()&&e.serverCache.isFullyInitialized()&&(a=Ca(s,Tn(e)),a.isLeafNode()&&(h=n.filter.updateFullNode(h,a,i)))}return a=e.serverCache.isFullyInitialized()||yi(s,ee())!=null,js(e,h,a,n.filter.filtersNodes())}}function uA(n,e){const t=Tn(n.viewCache_);return t&&(n.query._queryParams.loadsAllData()||!H(e)&&!t.getImmediateChild(W(e)).isEmpty())?t.getChild(e):null}function qh(n,e,t,s){e.type===ut.MERGE&&e.source.queryId!==null&&(V(Tn(n.viewCache_),"We should always have a full cache before handling merges"),V(Ia(n.viewCache_),"Missing event cache, even though we have a server cache"));const r=n.viewCache_,i=rA(n.processor_,r,e,t,s);return sA(n.processor_,i.viewCache),V(i.viewCache.serverCache.isFullyInitialized()||!r.serverCache.isFullyInitialized(),"Once a server snap is complete, it should never go back"),n.viewCache_=i.viewCache,hA(n,i.changes,i.viewCache.eventCache.getNode())}function hA(n,e,t,s){const r=n.eventRegistrations_;return FI(n.eventGenerator_,e,t,r)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let jh;function dA(n){V(!jh,"__referenceConstructor has already been defined"),jh=n}function Ul(n,e,t,s){const r=e.source.queryId;if(r!==null){const i=n.views.get(r);return V(i!=null,"SyncTree gave us an op for an invalid query."),qh(i,e,t,s)}else{let i=[];for(const a of n.views.values())i=i.concat(qh(a,e,t,s));return i}}function Bl(n,e){let t=null;for(const s of n.views.values())t=t||uA(s,e);return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let $h;function fA(n){V(!$h,"__referenceConstructor has already been defined"),$h=n}class Wh{constructor(e){this.listenProvider_=e,this.syncPointTree_=new ae(null),this.pendingWriteTree_=ZI(),this.tagToQueryMap=new Map,this.queryToTagMap=new Map}}function Qp(n,e,t,s,r){return jI(n.pendingWriteTree_,e,t,s,r),r?Xi(n,new En(xp(),e,t)):[]}function un(n,e,t=!1){const s=$I(n.pendingWriteTree_,e);if(WI(n.pendingWriteTree_,e)){let i=new ae(null);return s.snap!=null?i=i.set(ee(),!0):Qe(s.children,a=>{i=i.set(new ne(a),!0)}),Xi(n,new gi(s.path,i,t))}else return[]}function Yi(n,e,t){return Xi(n,new En(Mp(),e,t))}function pA(n,e,t){const s=ae.fromObject(t);return Xi(n,new sr(Mp(),e,s))}function _A(n,e,t,s){const r=Jp(n,s);if(r!=null){const i=Zp(r),a=i.path,l=i.queryId,u=et(a,e),h=new En(Lp(l),u,t);return e_(n,a,h)}else return[]}function mA(n,e,t,s){const r=Jp(n,s);if(r){const i=Zp(r),a=i.path,l=i.queryId,u=et(a,e),h=ae.fromObject(t),f=new sr(Lp(l),u,h);return e_(n,a,f)}else return[]}function ql(n,e,t){const r=n.pendingWriteTree_,i=n.syncPointTree_.findOnPath(e,(a,l)=>{const u=et(a,e),h=Bl(l,u);if(h)return h});return $p(r,e,i,t,!0)}function Xi(n,e){return Yp(e,n.syncPointTree_,null,qp(n.pendingWriteTree_,ee()))}function Yp(n,e,t,s){if(H(n.path))return Xp(n,e,t,s);{const r=e.get(ee());t==null&&r!=null&&(t=Bl(r,ee()));let i=[];const a=W(n.path),l=n.operationForChild(a),u=e.children.get(a);if(u&&l){const h=t?t.getImmediateChild(a):null,f=zp(s,a);i=i.concat(Yp(l,u,h,f))}return r&&(i=i.concat(Ul(r,n,s,t))),i}}function Xp(n,e,t,s){const r=e.get(ee());t==null&&r!=null&&(t=Bl(r,ee()));let i=[];return e.children.inorderTraversal((a,l)=>{const u=t?t.getImmediateChild(a):null,h=zp(s,a),f=n.operationForChild(a);f&&(i=i.concat(Xp(f,l,u,h)))}),r&&(i=i.concat(Ul(r,n,s,t))),i}function Jp(n,e){return n.tagToQueryMap.get(e)}function Zp(n){const e=n.indexOf("$");return V(e!==-1&&e<n.length-1,"Bad queryKey."),{queryId:n.substr(e+1),path:new ne(n.substr(0,e))}}function e_(n,e,t){const s=n.syncPointTree_.get(e);V(s,"Missing sync point for query tag that we're tracking");const r=qp(n.pendingWriteTree_,e);return Ul(s,t,r,null)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jl{constructor(e){this.node_=e}getImmediateChild(e){const t=this.node_.getImmediateChild(e);return new jl(t)}node(){return this.node_}}class $l{constructor(e,t){this.syncTree_=e,this.path_=t}getImmediateChild(e){const t=_e(this.path_,e);return new $l(this.syncTree_,t)}node(){return ql(this.syncTree_,this.path_)}}const gA=function(n){return n=n||{},n.timestamp=n.timestamp||new Date().getTime(),n},zh=function(n,e,t){if(!n||typeof n!="object")return n;if(V(".sv"in n,"Unexpected leaf node or priority contents"),typeof n[".sv"]=="string")return yA(n[".sv"],e,t);if(typeof n[".sv"]=="object")return EA(n[".sv"],e);V(!1,"Unexpected server value: "+JSON.stringify(n,null,2))},yA=function(n,e,t){switch(n){case"timestamp":return t.timestamp;default:V(!1,"Unexpected server value: "+n)}},EA=function(n,e,t){n.hasOwnProperty("increment")||V(!1,"Unexpected server value: "+JSON.stringify(n,null,2));const s=n.increment;typeof s!="number"&&V(!1,"Unexpected increment value: "+s);const r=e.node();if(V(r!==null&&typeof r<"u","Expected ChildrenNode.EMPTY_NODE for nulls"),!r.isLeafNode())return s;const a=r.getValue();return typeof a!="number"?s:a+s},TA=function(n,e,t,s){return Wl(e,new $l(t,n),s)},t_=function(n,e,t){return Wl(n,new jl(e),t)};function Wl(n,e,t){const s=n.getPriority().val(),r=zh(s,e.getImmediateChild(".priority"),t);let i;if(n.isLeafNode()){const a=n,l=zh(a.getValue(),e,t);return l!==a.getValue()||r!==a.getPriority().val()?new we(l,ge(r)):n}else{const a=n;return i=a,r!==a.getPriority().val()&&(i=i.updatePriority(new we(r))),a.forEachChild(Pe,(l,u)=>{const h=Wl(u,e.getImmediateChild(l),t);h!==u&&(i=i.updateImmediateChild(l,h))}),i}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zl{constructor(e="",t=null,s={children:{},childCount:0}){this.name=e,this.parent=t,this.node=s}}function Hl(n,e){let t=e instanceof ne?e:new ne(e),s=n,r=W(t);for(;r!==null;){const i=Un(s.node.children,r)||{children:{},childCount:0};s=new zl(r,s,i),t=se(t),r=W(t)}return s}function as(n){return n.node.value}function n_(n,e){n.node.value=e,Pa(n)}function s_(n){return n.node.childCount>0}function vA(n){return as(n)===void 0&&!s_(n)}function Ji(n,e){Qe(n.node.children,(t,s)=>{e(new zl(t,n,s))})}function r_(n,e,t,s){t&&e(n),Ji(n,r=>{r_(r,e,!0)})}function wA(n,e,t){let s=n.parent;for(;s!==null;){if(e(s))return!0;s=s.parent}return!1}function _r(n){return new ne(n.parent===null?n.name:_r(n.parent)+"/"+n.name)}function Pa(n){n.parent!==null&&IA(n.parent,n.name,n)}function IA(n,e,t){const s=vA(t),r=gt(n.node.children,e);s&&r?(delete n.node.children[e],n.node.childCount--,Pa(n)):!s&&!r&&(n.node.children[e]=t.node,n.node.childCount++,Pa(n))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const AA=/[\[\].#$\/\u0000-\u001F\u007F]/,RA=/[\[\].#$\u0000-\u001F\u007F]/,jo=10*1024*1024,Gl=function(n){return typeof n=="string"&&n.length!==0&&!AA.test(n)},i_=function(n){return typeof n=="string"&&n.length!==0&&!RA.test(n)},CA=function(n){return n&&(n=n.replace(/^\/*\.info(\/|$)/,"/")),i_(n)},o_=function(n){return n===null||typeof n=="string"||typeof n=="number"&&!Ki(n)||n&&typeof n=="object"&&gt(n,".sv")},Na=function(n,e,t,s){Zi(Bn(n,"value"),e,t)},Zi=function(n,e,t){const s=t instanceof ne?new lI(t,n):t;if(e===void 0)throw new Error(n+"contains undefined "+an(s));if(typeof e=="function")throw new Error(n+"contains a function "+an(s)+" with contents = "+e.toString());if(Ki(e))throw new Error(n+"contains "+e.toString()+" "+an(s));if(typeof e=="string"&&e.length>jo/3&&Ii(e)>jo)throw new Error(n+"contains a string greater than "+jo+" utf8 bytes "+an(s)+" ('"+e.substring(0,50)+"...')");if(e&&typeof e=="object"){let r=!1,i=!1;if(Qe(e,(a,l)=>{if(a===".value")r=!0;else if(a!==".priority"&&a!==".sv"&&(i=!0,!Gl(a)))throw new Error(n+" contains an invalid key ("+a+") "+an(s)+`.  Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`);cI(s,a),Zi(n,l,s),uI(s)}),r&&i)throw new Error(n+' contains ".value" child '+an(s)+" in addition to actual children.")}},SA=function(n,e){let t,s;for(t=0;t<e.length;t++){s=e[t];const i=nr(s);for(let a=0;a<i.length;a++)if(!(i[a]===".priority"&&a===i.length-1)){if(!Gl(i[a]))throw new Error(n+"contains an invalid key ("+i[a]+") in path "+s.toString()+`. Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`)}}e.sort(aI);let r=null;for(t=0;t<e.length;t++){if(s=e[t],r!==null&&tt(r,s))throw new Error(n+"contains a path "+r.toString()+" that is ancestor of another path "+s.toString());r=s}},bA=function(n,e,t,s){const r=Bn(n,"values");if(!(e&&typeof e=="object")||Array.isArray(e))throw new Error(r+" must be an object containing the children to replace.");const i=[];Qe(e,(a,l)=>{const u=new ne(a);if(Zi(r,l,_e(t,u)),Dl(u)===".priority"&&!o_(l))throw new Error(r+"contains an invalid value for '"+u.toString()+"', which must be a valid Firebase priority (a string, finite number, server value, or null).");i.push(u)}),SA(r,i)},PA=function(n,e,t){if(Ki(e))throw new Error(Bn(n,"priority")+"is "+e.toString()+", but must be a valid Firebase priority (a string, finite number, server value, or null).");if(!o_(e))throw new Error(Bn(n,"priority")+"must be a valid Firebase priority (a string, finite number, server value, or null).")},a_=function(n,e,t,s){if(!i_(t))throw new Error(Bn(n,e)+'was an invalid path = "'+t+`". Paths must be non-empty strings and can't contain ".", "#", "$", "[", or "]"`)},NA=function(n,e,t,s){t&&(t=t.replace(/^\/*\.info(\/|$)/,"/")),a_(n,e,t)},xn=function(n,e){if(W(e)===".info")throw new Error(n+" failed = Can't modify data under /.info/")},kA=function(n,e){const t=e.path.toString();if(typeof e.repoInfo.host!="string"||e.repoInfo.host.length===0||!Gl(e.repoInfo.namespace)&&e.repoInfo.host.split(":")[0]!=="localhost"||t.length!==0&&!CA(t))throw new Error(Bn(n,"url")+`must be a valid firebase URL and the path can't contain ".", "#", "$", "[", or "]".`)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class DA{constructor(){this.eventLists_=[],this.recursionDepth_=0}}function l_(n,e){let t=null;for(let s=0;s<e.length;s++){const r=e[s],i=r.getPath();t!==null&&!bp(i,t.path)&&(n.eventLists_.push(t),t=null),t===null&&(t={events:[],path:i}),t.events.push(r)}t&&n.eventLists_.push(t)}function Pt(n,e,t){l_(n,t),VA(n,s=>tt(s,e)||tt(e,s))}function VA(n,e){n.recursionDepth_++;let t=!0;for(let s=0;s<n.eventLists_.length;s++){const r=n.eventLists_[s];if(r){const i=r.path;e(i)?(OA(n.eventLists_[s]),n.eventLists_[s]=null):t=!1}}t&&(n.eventLists_=[]),n.recursionDepth_--}function OA(n){for(let e=0;e<n.events.length;e++){const t=n.events[e];if(t!==null){n.events[e]=null;const s=t.getEventRunner();Bs&&Ce("event: "+t.toString()),is(s)}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xA="repo_interrupt",MA=25;class LA{constructor(e,t,s,r){this.repoInfo_=e,this.forceRestClient_=t,this.authTokenProvider_=s,this.appCheckProvider_=r,this.dataUpdateCount=0,this.statsListener_=null,this.eventQueue_=new DA,this.nextWriteId_=1,this.interceptServerDataCallback_=null,this.onDisconnect_=mi(),this.transactionQueueTree_=new zl,this.persistentConnection_=null,this.key=this.repoInfo_.toURLString()}toString(){return(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host}}function FA(n,e,t){if(n.stats_=Nl(n.repoInfo_),n.forceRestClient_||Dw())n.server_=new _i(n.repoInfo_,(s,r,i,a)=>{Hh(n,s,r,i,a)},n.authTokenProvider_,n.appCheckProvider_),setTimeout(()=>Gh(n,!0),0);else{if(typeof t<"u"&&t!==null){if(typeof t!="object")throw new Error("Only objects are supported for option databaseAuthVariableOverride");try{Se(t)}catch(s){throw new Error("Invalid authOverride provided: "+s)}}n.persistentConnection_=new At(n.repoInfo_,e,(s,r,i,a)=>{Hh(n,s,r,i,a)},s=>{Gh(n,s)},s=>{BA(n,s)},n.authTokenProvider_,n.appCheckProvider_,t),n.server_=n.persistentConnection_}n.authTokenProvider_.addTokenChangeListener(s=>{n.server_.refreshAuthToken(s)}),n.appCheckProvider_.addTokenChangeListener(s=>{n.server_.refreshAppCheckToken(s.token)}),n.statsReporter_=Lw(n.repoInfo_,()=>new LI(n.stats_,n.server_)),n.infoData_=new DI,n.infoSyncTree_=new Wh({startListening:(s,r,i,a)=>{let l=[];const u=n.infoData_.getNode(s._path);return u.isEmpty()||(l=Yi(n.infoSyncTree_,s._path,u),setTimeout(()=>{a("ok")},0)),l},stopListening:()=>{}}),Ql(n,"connected",!1),n.serverSyncTree_=new Wh({startListening:(s,r,i,a)=>(n.server_.listen(s,i,r,(l,u)=>{const h=a(l,u);Pt(n.eventQueue_,s._path,h)}),[]),stopListening:(s,r)=>{n.server_.unlisten(s,r)}})}function UA(n){const t=n.infoData_.getNode(new ne(".info/serverTimeOffset")).val()||0;return new Date().getTime()+t}function Kl(n){return gA({timestamp:UA(n)})}function Hh(n,e,t,s,r){n.dataUpdateCount++;const i=new ne(e);t=n.interceptServerDataCallback_?n.interceptServerDataCallback_(e,t):t;let a=[];if(r)if(s){const u=Jr(t,h=>ge(h));a=mA(n.serverSyncTree_,i,u,r)}else{const u=ge(t);a=_A(n.serverSyncTree_,i,u,r)}else if(s){const u=Jr(t,h=>ge(h));a=pA(n.serverSyncTree_,i,u)}else{const u=ge(t);a=Yi(n.serverSyncTree_,i,u)}let l=i;a.length>0&&(l=eo(n,i)),Pt(n.eventQueue_,l,a)}function Gh(n,e){Ql(n,"connected",e),e===!1&&jA(n)}function BA(n,e){Qe(e,(t,s)=>{Ql(n,t,s)})}function Ql(n,e,t){const s=new ne("/.info/"+e),r=ge(t);n.infoData_.updateSnapshot(s,r);const i=Yi(n.infoSyncTree_,s,r);Pt(n.eventQueue_,s,i)}function c_(n){return n.nextWriteId_++}function qA(n,e,t,s,r){Yl(n,"set",{path:e.toString(),value:t,priority:s});const i=Kl(n),a=ge(t,s),l=ql(n.serverSyncTree_,e),u=t_(a,l,i),h=c_(n),f=Qp(n.serverSyncTree_,e,u,h,!0);l_(n.eventQueue_,f),n.server_.put(e.toString(),a.val(!0),(m,I)=>{const C=m==="ok";C||Ke("set at "+e+" failed: "+m);const k=un(n.serverSyncTree_,h,!C);Pt(n.eventQueue_,e,k),Yn(n,r,m,I)});const p=p_(n,e);eo(n,p),Pt(n.eventQueue_,p,[])}function jA(n){Yl(n,"onDisconnectEvents");const e=Kl(n),t=mi();wa(n.onDisconnect_,ee(),(r,i)=>{const a=TA(r,i,n.serverSyncTree_,e);os(t,r,a)});let s=[];wa(t,ee(),(r,i)=>{s=s.concat(Yi(n.serverSyncTree_,r,i));const a=p_(n,r);eo(n,a)}),n.onDisconnect_=mi(),Pt(n.eventQueue_,ee(),s)}function $A(n,e,t){n.server_.onDisconnectCancel(e.toString(),(s,r)=>{s==="ok"&&va(n.onDisconnect_,e),Yn(n,t,s,r)})}function Kh(n,e,t,s){const r=ge(t);n.server_.onDisconnectPut(e.toString(),r.val(!0),(i,a)=>{i==="ok"&&os(n.onDisconnect_,e,r),Yn(n,s,i,a)})}function WA(n,e,t,s,r){const i=ge(t,s);n.server_.onDisconnectPut(e.toString(),i.val(!0),(a,l)=>{a==="ok"&&os(n.onDisconnect_,e,i),Yn(n,r,a,l)})}function zA(n,e,t,s){if(zo(t)){Ce("onDisconnect().update() called with empty data.  Don't do anything."),Yn(n,s,"ok",void 0);return}n.server_.onDisconnectMerge(e.toString(),t,(r,i)=>{r==="ok"&&Qe(t,(a,l)=>{const u=ge(l);os(n.onDisconnect_,_e(e,a),u)}),Yn(n,s,r,i)})}function HA(n){n.persistentConnection_&&n.persistentConnection_.interrupt(xA)}function Yl(n,...e){let t="";n.persistentConnection_&&(t=n.persistentConnection_.id+":"),Ce(t,...e)}function Yn(n,e,t,s){e&&is(()=>{if(t==="ok")e(null);else{const r=(t||"error").toUpperCase();let i=r;s&&(i+=": "+s);const a=new Error(i);a.code=r,e(a)}})}function u_(n,e,t){return ql(n.serverSyncTree_,e,t)||Z.EMPTY_NODE}function Xl(n,e=n.transactionQueueTree_){if(e||to(n,e),as(e)){const t=d_(n,e);V(t.length>0,"Sending zero length transaction queue"),t.every(r=>r.status===0)&&GA(n,_r(e),t)}else s_(e)&&Ji(e,t=>{Xl(n,t)})}function GA(n,e,t){const s=t.map(h=>h.currentWriteId),r=u_(n,e,s);let i=r;const a=r.hash();for(let h=0;h<t.length;h++){const f=t[h];V(f.status===0,"tryToSendTransactionQueue_: items in queue should all be run."),f.status=1,f.retryCount++;const p=et(e,f.path);i=i.updateChild(p,f.currentOutputSnapshotRaw)}const l=i.val(!0),u=e;n.server_.put(u.toString(),l,h=>{Yl(n,"transaction put response",{path:u.toString(),status:h});let f=[];if(h==="ok"){const p=[];for(let m=0;m<t.length;m++)t[m].status=2,f=f.concat(un(n.serverSyncTree_,t[m].currentWriteId)),t[m].onComplete&&p.push(()=>t[m].onComplete(null,!0,t[m].currentOutputSnapshotResolved)),t[m].unwatcher();to(n,Hl(n.transactionQueueTree_,e)),Xl(n,n.transactionQueueTree_),Pt(n.eventQueue_,e,f);for(let m=0;m<p.length;m++)is(p[m])}else{if(h==="datastale")for(let p=0;p<t.length;p++)t[p].status===3?t[p].status=4:t[p].status=0;else{Ke("transaction at "+u.toString()+" failed: "+h);for(let p=0;p<t.length;p++)t[p].status=4,t[p].abortReason=h}eo(n,e)}},a)}function eo(n,e){const t=h_(n,e),s=_r(t),r=d_(n,t);return KA(n,r,s),s}function KA(n,e,t){if(e.length===0)return;const s=[];let r=[];const a=e.filter(l=>l.status===0).map(l=>l.currentWriteId);for(let l=0;l<e.length;l++){const u=e[l],h=et(t,u.path);let f=!1,p;if(V(h!==null,"rerunTransactionsUnderNode_: relativePath should not be null."),u.status===4)f=!0,p=u.abortReason,r=r.concat(un(n.serverSyncTree_,u.currentWriteId,!0));else if(u.status===0)if(u.retryCount>=MA)f=!0,p="maxretry",r=r.concat(un(n.serverSyncTree_,u.currentWriteId,!0));else{const m=u_(n,u.path,a);u.currentInputSnapshot=m;const I=e[l].update(m.val());if(I!==void 0){Zi("transaction failed: Data returned ",I,u.path);let C=ge(I);typeof I=="object"&&I!=null&&gt(I,".priority")||(C=C.updatePriority(m.getPriority()));const N=u.currentWriteId,B=Kl(n),L=t_(C,m,B);u.currentOutputSnapshotRaw=C,u.currentOutputSnapshotResolved=L,u.currentWriteId=c_(n),a.splice(a.indexOf(N),1),r=r.concat(Qp(n.serverSyncTree_,u.path,L,u.currentWriteId,u.applyLocally)),r=r.concat(un(n.serverSyncTree_,N,!0))}else f=!0,p="nodata",r=r.concat(un(n.serverSyncTree_,u.currentWriteId,!0))}Pt(n.eventQueue_,t,r),r=[],f&&(e[l].status=2,function(m){setTimeout(m,Math.floor(0))}(e[l].unwatcher),e[l].onComplete&&(p==="nodata"?s.push(()=>e[l].onComplete(null,!1,e[l].currentInputSnapshot)):s.push(()=>e[l].onComplete(new Error(p),!1,null))))}to(n,n.transactionQueueTree_);for(let l=0;l<s.length;l++)is(s[l]);Xl(n,n.transactionQueueTree_)}function h_(n,e){let t,s=n.transactionQueueTree_;for(t=W(e);t!==null&&as(s)===void 0;)s=Hl(s,t),e=se(e),t=W(e);return s}function d_(n,e){const t=[];return f_(n,e,t),t.sort((s,r)=>s.order-r.order),t}function f_(n,e,t){const s=as(e);if(s)for(let r=0;r<s.length;r++)t.push(s[r]);Ji(e,r=>{f_(n,r,t)})}function to(n,e){const t=as(e);if(t){let s=0;for(let r=0;r<t.length;r++)t[r].status!==2&&(t[s]=t[r],s++);t.length=s,n_(e,t.length>0?t:void 0)}Ji(e,s=>{to(n,s)})}function p_(n,e){const t=_r(h_(n,e)),s=Hl(n.transactionQueueTree_,e);return wA(s,r=>{$o(n,r)}),$o(n,s),r_(s,r=>{$o(n,r)}),t}function $o(n,e){const t=as(e);if(t){const s=[];let r=[],i=-1;for(let a=0;a<t.length;a++)t[a].status===3||(t[a].status===1?(V(i===a-1,"All SENT items should be at beginning of queue."),i=a,t[a].status=3,t[a].abortReason="set"):(V(t[a].status===0,"Unexpected transaction status in abort"),t[a].unwatcher(),r=r.concat(un(n.serverSyncTree_,t[a].currentWriteId,!0)),t[a].onComplete&&s.push(t[a].onComplete.bind(null,new Error("set"),!1,null))));i===-1?n_(e,void 0):t.length=i+1,Pt(n.eventQueue_,_r(e),r);for(let a=0;a<s.length;a++)is(s[a])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function QA(n){let e="";const t=n.split("/");for(let s=0;s<t.length;s++)if(t[s].length>0){let r=t[s];try{r=decodeURIComponent(r.replace(/\+/g," "))}catch{}e+="/"+r}return e}function YA(n){const e={};n.charAt(0)==="?"&&(n=n.substring(1));for(const t of n.split("&")){if(t.length===0)continue;const s=t.split("=");s.length===2?e[decodeURIComponent(s[0])]=decodeURIComponent(s[1]):Ke(`Invalid query segment '${t}' in query '${n}'`)}return e}const Qh=function(n,e){const t=XA(n),s=t.namespace;t.domain==="firebase.com"&&bt(t.host+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead"),(!s||s==="undefined")&&t.domain!=="localhost"&&bt("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com"),t.secure||Aw();const r=t.scheme==="ws"||t.scheme==="wss";return{repoInfo:new yp(t.host,t.secure,s,r,e,"",s!==t.subdomain),path:new ne(t.pathString)}},XA=function(n){let e="",t="",s="",r="",i="",a=!0,l="https",u=443;if(typeof n=="string"){let h=n.indexOf("//");h>=0&&(l=n.substring(0,h-1),n=n.substring(h+2));let f=n.indexOf("/");f===-1&&(f=n.length);let p=n.indexOf("?");p===-1&&(p=n.length),e=n.substring(0,Math.min(f,p)),f<p&&(r=QA(n.substring(f,p)));const m=YA(n.substring(Math.min(n.length,p)));h=e.indexOf(":"),h>=0?(a=l==="https"||l==="wss",u=parseInt(e.substring(h+1),10)):h=e.length;const I=e.slice(0,h);if(I.toLowerCase()==="localhost")t="localhost";else if(I.split(".").length<=2)t=I;else{const C=e.indexOf(".");s=e.substring(0,C).toLowerCase(),t=e.substring(C+1),i=s}"ns"in m&&(i=m.ns)}return{host:e,port:u,domain:t,subdomain:s,secure:a,scheme:l,pathString:r,namespace:i}};/**
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
 */class JA{constructor(e,t){this._repo=e,this._path=t}cancel(){const e=new wt;return $A(this._repo,this._path,e.wrapCallback(()=>{})),e.promise}remove(){xn("OnDisconnect.remove",this._path);const e=new wt;return Kh(this._repo,this._path,null,e.wrapCallback(()=>{})),e.promise}set(e){xn("OnDisconnect.set",this._path),Na("OnDisconnect.set",e,this._path);const t=new wt;return Kh(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}setWithPriority(e,t){xn("OnDisconnect.setWithPriority",this._path),Na("OnDisconnect.setWithPriority",e,this._path),PA("OnDisconnect.setWithPriority",t);const s=new wt;return WA(this._repo,this._path,e,t,s.wrapCallback(()=>{})),s.promise}update(e){xn("OnDisconnect.update",this._path),bA("OnDisconnect.update",e,this._path);const t=new wt;return zA(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jl{constructor(e,t,s,r){this._repo=e,this._path=t,this._queryParams=s,this._orderByCalled=r}get key(){return H(this._path)?null:Dl(this._path)}get ref(){return new Rn(this._repo,this._path)}get _queryIdentifier(){const e=Vh(this._queryParams),t=bl(e);return t==="{}"?"default":t}get _queryObject(){return Vh(this._queryParams)}isEqual(e){if(e=ie(e),!(e instanceof Jl))return!1;const t=this._repo===e._repo,s=bp(this._path,e._path),r=this._queryIdentifier===e._queryIdentifier;return t&&s&&r}toJSON(){return this.toString()}toString(){return this._repo.toString()+oI(this._path)}}class Rn extends Jl{constructor(e,t){super(e,t,new xl,!1)}get parent(){const e=Sp(this._path);return e===null?null:new Rn(this._repo,e)}get root(){let e=this;for(;e.parent!==null;)e=e.parent;return e}}function xR(n,e){return n=ie(n),n._checkNotDeleted("ref"),e!==void 0?ZA(n._root,e):n._root}function ZA(n,e){return n=ie(n),W(n._path)===null?NA("child","path",e):a_("child","path",e),new Rn(n._repo,_e(n._path,e))}function MR(n){return n=ie(n),new JA(n._repo,n._path)}function LR(n){return xn("remove",n._path),eR(n,null)}function eR(n,e){n=ie(n),xn("set",n._path),Na("set",e,n._path);const t=new wt;return qA(n._repo,n._path,e,null,t.wrapCallback(()=>{})),t.promise}dA(Rn);fA(Rn);/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tR="FIREBASE_DATABASE_EMULATOR_HOST",ka={};let nR=!1;function sR(n,e,t,s){const r=e.lastIndexOf(":"),i=e.substring(0,r),a=Yt(i);n.repoInfo_=new yp(e,a,n.repoInfo_.namespace,n.repoInfo_.webSocketOnly,n.repoInfo_.nodeAdmin,n.repoInfo_.persistenceKey,n.repoInfo_.includeNamespaceInQueryParams,!0,t),s&&(n.authTokenProvider_=s)}function rR(n,e,t,s,r){let i=s||n.options.databaseURL;i===void 0&&(n.options.projectId||bt("Can't determine Firebase Database URL. Be sure to include  a Project ID when calling firebase.initializeApp()."),Ce("Using default host for project ",n.options.projectId),i=`${n.options.projectId}-default-rtdb.firebaseio.com`);let a=Qh(i,r),l=a.repoInfo,u;typeof process<"u"&&ph&&(u=ph[tR]),u?(i=`http://${u}?ns=${l.namespace}`,a=Qh(i,r),l=a.repoInfo):a.repoInfo.secure;const h=new Ow(n.name,n.options,e);kA("Invalid Firebase Database URL",a),H(a.path)||bt("Database URL must point to the root of a Firebase Database (not including a child path).");const f=oR(l,n,h,new Vw(n,t));return new aR(f,n)}function iR(n,e){const t=ka[e];(!t||t[n.key]!==n)&&bt(`Database ${e}(${n.repoInfo_}) has already been deleted.`),HA(n),delete t[n.key]}function oR(n,e,t,s){let r=ka[e.name];r||(r={},ka[e.name]=r);let i=r[n.toURLString()];return i&&bt("Database initialized multiple times. Please make sure the format of the database URL matches with each database() call."),i=new LA(n,nR,t,s),r[n.toURLString()]=i,i}class aR{constructor(e,t){this._repoInternal=e,this.app=t,this.type="database",this._instanceStarted=!1}get _repo(){return this._instanceStarted||(FA(this._repoInternal,this.app.options.appId,this.app.options.databaseAuthVariableOverride),this._instanceStarted=!0),this._repoInternal}get _root(){return this._rootInternal||(this._rootInternal=new Rn(this._repo,ee())),this._rootInternal}_delete(){return this._rootInternal!==null&&(iR(this._repo,this.app.name),this._repoInternal=null,this._rootInternal=null),Promise.resolve()}_checkNotDeleted(e){this._rootInternal===null&&bt("Cannot call "+e+" on a deleted database.")}}function lR(n=Ci(),e){const t=Ai(n,"database").getImmediate({identifier:e});if(!t._instanceStarted){const s=Ti("database");s&&cR(t,...s)}return t}function cR(n,e,t,s={}){n=ie(n),n._checkNotDeleted("useEmulator");const r=`${e}:${t}`,i=n._repoInternal;if(n._instanceStarted){if(r===n._repoInternal.repoInfo_.host&&zs(s,i.repoInfo_.emulatorOptions))return;bt("connectDatabaseEmulator() cannot initialize or alter the emulator configuration after the database instance has started.")}let a;if(i.repoInfo_.nodeAdmin)s.mockUserToken&&bt('mockUserToken is not supported by the Admin SDK. For client access with mock users, please use the "firebase" package instead of "firebase-admin".'),a=new Yr(Yr.OWNER);else if(s.mockUserToken){const l=typeof s.mockUserToken=="string"?s.mockUserToken:Oa(s.mockUserToken,n.app.options.projectId);a=new Yr(l)}Yt(e)&&(vi(e),wi("Database",!0)),sR(i,r,s,a)}/**
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
 */function uR(n){yw(Ma),pn(new jt("database",(e,{instanceIdentifier:t})=>{const s=e.getProvider("app").getImmediate(),r=e.getProvider("auth-internal"),i=e.getProvider("app-check-internal");return rR(s,r,i,t)},"PUBLIC").setMultipleInstances(!0)),nt(_h,mh,n),nt(_h,mh,"esm2020")}At.prototype.simpleListen=function(n,e){this.sendRequest("q",{p:n},e)};At.prototype.echo=function(n,e){this.sendRequest("echo",{d:n},e)};uR();const hR={apiKey:"AIzaSyBdE26vC0UAprsdTgBcmYrVuO67ZbccMTA",authDomain:"apps-script-api-443402.firebaseapp.com",databaseURL:"https://apps-script-api-443402-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"apps-script-api-443402",storageBucket:"apps-script-api-443402.appspot.com",messagingSenderId:"46453918785",appId:"1:46453918785:web:a3c386def8dfe69f768ac0",measurementId:"G-TCZ9TL8FLW"},no=id(hR),FR=AT(no,"anxi-app"),UR=Gv(no),BR=mw(no),qR=lR(no);export{DR as A,RR as B,qR as C,le as T,ER as a,TR as b,_R as c,IT as d,vR as e,BR as f,SR as g,OR as h,mR as i,PR as j,UR as k,NR as l,kR as m,FR as n,CR as o,xR as p,gR as q,VR as r,bR as s,MR as t,IR as u,eR as v,yR as w,LR as x,wR as y,AR as z};
