import{q as gh}from"./vendor-D7zls8Ls.js";const _h=()=>{};var fa={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pu=function(n){const t=[];let e=0;for(let r=0;r<n.length;r++){let s=n.charCodeAt(r);s<128?t[e++]=s:s<2048?(t[e++]=s>>6|192,t[e++]=s&63|128):(s&64512)===55296&&r+1<n.length&&(n.charCodeAt(r+1)&64512)===56320?(s=65536+((s&1023)<<10)+(n.charCodeAt(++r)&1023),t[e++]=s>>18|240,t[e++]=s>>12&63|128,t[e++]=s>>6&63|128,t[e++]=s&63|128):(t[e++]=s>>12|224,t[e++]=s>>6&63|128,t[e++]=s&63|128)}return t},yh=function(n){const t=[];let e=0,r=0;for(;e<n.length;){const s=n[e++];if(s<128)t[r++]=String.fromCharCode(s);else if(s>191&&s<224){const o=n[e++];t[r++]=String.fromCharCode((s&31)<<6|o&63)}else if(s>239&&s<365){const o=n[e++],a=n[e++],c=n[e++],h=((s&7)<<18|(o&63)<<12|(a&63)<<6|c&63)-65536;t[r++]=String.fromCharCode(55296+(h>>10)),t[r++]=String.fromCharCode(56320+(h&1023))}else{const o=n[e++],a=n[e++];t[r++]=String.fromCharCode((s&15)<<12|(o&63)<<6|a&63)}}return t.join("")},bu={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,t){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const e=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let s=0;s<n.length;s+=3){const o=n[s],a=s+1<n.length,c=a?n[s+1]:0,h=s+2<n.length,d=h?n[s+2]:0,p=o>>2,y=(o&3)<<4|c>>4;let E=(c&15)<<2|d>>6,S=d&63;h||(S=64,a||(E=64)),r.push(e[p],e[y],e[E],e[S])}return r.join("")},encodeString(n,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(n):this.encodeByteArray(Pu(n),t)},decodeString(n,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(n):yh(this.decodeStringToByteArray(n,t))},decodeStringToByteArray(n,t){this.init_();const e=t?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let s=0;s<n.length;){const o=e[n.charAt(s++)],c=s<n.length?e[n.charAt(s)]:0;++s;const d=s<n.length?e[n.charAt(s)]:64;++s;const y=s<n.length?e[n.charAt(s)]:64;if(++s,o==null||c==null||d==null||y==null)throw new Eh;const E=o<<2|c>>4;if(r.push(E),d!==64){const S=c<<4&240|d>>2;if(r.push(S),y!==64){const b=d<<6&192|y;r.push(b)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class Eh extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Th=function(n){const t=Pu(n);return bu.encodeByteArray(t,!0)},Cr=function(n){return Th(n).replace(/\./g,"")},wh=function(n){try{return bu.decodeString(n,!0)}catch(t){console.error("base64Decode failed: ",t)}return null};/**
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
 */function Ih(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
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
 */const Ah=()=>Ih().__FIREBASE_DEFAULTS__,vh=()=>{if(typeof process>"u"||typeof fa>"u")return;const n=fa.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},Rh=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const t=n&&wh(n[1]);return t&&JSON.parse(t)},mi=()=>{try{return _h()||Ah()||vh()||Rh()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},Sh=n=>{var t,e;return(e=(t=mi())==null?void 0:t.emulatorHosts)==null?void 0:e[n]},gi=n=>{const t=Sh(n);if(!t)return;const e=t.lastIndexOf(":");if(e<=0||e+1===t.length)throw new Error(`Invalid host ${t} with no separate hostname and port!`);const r=parseInt(t.substring(e+1),10);return t[0]==="["?[t.substring(1,e-1),r]:[t.substring(0,e),r]},Vu=()=>{var n;return(n=mi())==null?void 0:n.config};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ch{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((t,e)=>{this.resolve=t,this.reject=e})}wrapCallback(t){return(e,r)=>{e?this.reject(e):this.resolve(r),typeof t=="function"&&(this.promise.catch(()=>{}),t.length===1?t(e):t(e,r))}}}/**
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
 */function Ye(n){try{return(n.startsWith("http://")||n.startsWith("https://")?new URL(n).hostname:n).endsWith(".cloudworkstations.dev")}catch{return!1}}async function _i(n){return(await fetch(n,{credentials:"include"})).ok}/**
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
 */function Du(n,t){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const e={alg:"none",type:"JWT"},r=t||"demo-project",s=n.iat||0,o=n.sub||n.user_id;if(!o)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const a={iss:`https://securetoken.google.com/${r}`,aud:r,iat:s,exp:s+3600,auth_time:s,sub:o,user_id:o,firebase:{sign_in_provider:"custom",identities:{}},...n};return[Cr(JSON.stringify(e)),Cr(JSON.stringify(a)),""].join(".")}const Pn={};function Ph(){const n={prod:[],emulator:[]};for(const t of Object.keys(Pn))Pn[t]?n.emulator.push(t):n.prod.push(t);return n}function bh(n){let t=document.getElementById(n),e=!1;return t||(t=document.createElement("div"),t.setAttribute("id",n),e=!0),{created:e,element:t}}let pa=!1;function yi(n,t){if(typeof window>"u"||typeof document>"u"||!Ye(window.location.host)||Pn[n]===t||Pn[n]||pa)return;Pn[n]=t;function e(E){return`__firebase__banner__${E}`}const r="__firebase__banner",o=Ph().prod.length>0;function a(){const E=document.getElementById(r);E&&E.remove()}function c(E){E.style.display="flex",E.style.background="#7faaf0",E.style.position="fixed",E.style.bottom="5px",E.style.left="5px",E.style.padding=".5em",E.style.borderRadius="5px",E.style.alignItems="center"}function h(E,S){E.setAttribute("width","24"),E.setAttribute("id",S),E.setAttribute("height","24"),E.setAttribute("viewBox","0 0 24 24"),E.setAttribute("fill","none"),E.style.marginLeft="-6px"}function d(){const E=document.createElement("span");return E.style.cursor="pointer",E.style.marginLeft="16px",E.style.fontSize="24px",E.innerHTML=" &times;",E.onclick=()=>{pa=!0,a()},E}function p(E,S){E.setAttribute("id",S),E.innerText="Learn more",E.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",E.setAttribute("target","__blank"),E.style.paddingLeft="5px",E.style.textDecoration="underline"}function y(){const E=bh(r),S=e("text"),b=document.getElementById(S)||document.createElement("span"),N=e("learnmore"),V=document.getElementById(N)||document.createElement("a"),q=e("preprendIcon"),F=document.getElementById(q)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(E.created){const B=E.element;c(B),p(V,N);const z=d();h(F,q),B.append(F,b,V,z),document.body.appendChild(B)}o?(b.innerText="Preview backend disconnected.",F.innerHTML=`<g clip-path="url(#clip0_6013_33858)">
<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6013_33858">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`):(F.innerHTML=`<g clip-path="url(#clip0_6083_34804)">
<path d="M11.4 15.2H12.6V11.2H11.4V15.2ZM12 10C12.1667 10 12.3056 9.94444 12.4167 9.83333C12.5389 9.71111 12.6 9.56667 12.6 9.4C12.6 9.23333 12.5389 9.09444 12.4167 8.98333C12.3056 8.86111 12.1667 8.8 12 8.8C11.8333 8.8 11.6889 8.86111 11.5667 8.98333C11.4556 9.09444 11.4 9.23333 11.4 9.4C11.4 9.56667 11.4556 9.71111 11.5667 9.83333C11.6889 9.94444 11.8333 10 12 10ZM12 18.4C11.1222 18.4 10.2944 18.2333 9.51667 17.9C8.73889 17.5667 8.05556 17.1111 7.46667 16.5333C6.88889 15.9444 6.43333 15.2611 6.1 14.4833C5.76667 13.7056 5.6 12.8778 5.6 12C5.6 11.1111 5.76667 10.2833 6.1 9.51667C6.43333 8.73889 6.88889 8.06111 7.46667 7.48333C8.05556 6.89444 8.73889 6.43333 9.51667 6.1C10.2944 5.76667 11.1222 5.6 12 5.6C12.8889 5.6 13.7167 5.76667 14.4833 6.1C15.2611 6.43333 15.9389 6.89444 16.5167 7.48333C17.1056 8.06111 17.5667 8.73889 17.9 9.51667C18.2333 10.2833 18.4 11.1111 18.4 12C18.4 12.8778 18.2333 13.7056 17.9 14.4833C17.5667 15.2611 17.1056 15.9444 16.5167 16.5333C15.9389 17.1111 15.2611 17.5667 14.4833 17.9C13.7167 18.2333 12.8889 18.4 12 18.4ZM12 17.2C13.4444 17.2 14.6722 16.6944 15.6833 15.6833C16.6944 14.6722 17.2 13.4444 17.2 12C17.2 10.5556 16.6944 9.32778 15.6833 8.31667C14.6722 7.30555 13.4444 6.8 12 6.8C10.5556 6.8 9.32778 7.30555 8.31667 8.31667C7.30556 9.32778 6.8 10.5556 6.8 12C6.8 13.4444 7.30556 14.6722 8.31667 15.6833C9.32778 16.6944 10.5556 17.2 12 17.2Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6083_34804">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`,b.innerText="Preview backend running in this workspace."),b.setAttribute("id",S)}document.readyState==="loading"?window.addEventListener("DOMContentLoaded",y):y()}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vh(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function Dh(){var t;const n=(t=mi())==null?void 0:t.forceEnvironment;if(n==="node")return!0;if(n==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function Nh(){return!Dh()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function kh(){try{return typeof indexedDB=="object"}catch{return!1}}function Oh(){return new Promise((n,t)=>{try{let e=!0;const r="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(r);s.onsuccess=()=>{s.result.close(),e||self.indexedDB.deleteDatabase(r),n(!0)},s.onupgradeneeded=()=>{e=!1},s.onerror=()=>{var o;t(((o=s.error)==null?void 0:o.message)||"")}}catch(e){t(e)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xh="FirebaseError";class ge extends Error{constructor(t,e,r){super(e),this.code=t,this.customData=r,this.name=xh,Object.setPrototypeOf(this,ge.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,Nu.prototype.create)}}class Nu{constructor(t,e,r){this.service=t,this.serviceName=e,this.errors=r}create(t,...e){const r=e[0]||{},s=`${this.service}/${t}`,o=this.errors[t],a=o?Mh(o,r):"Error",c=`${this.serviceName}: ${a} (${s}).`;return new ge(s,c,r)}}function Mh(n,t){return n.replace(Lh,(e,r)=>{const s=t[r];return s!=null?String(s):`<${r}?>`})}const Lh=/\{\$([^}]+)}/g;function Pr(n,t){if(n===t)return!0;const e=Object.keys(n),r=Object.keys(t);for(const s of e){if(!r.includes(s))return!1;const o=n[s],a=t[s];if(ma(o)&&ma(a)){if(!Pr(o,a))return!1}else if(o!==a)return!1}for(const s of r)if(!e.includes(s))return!1;return!0}function ma(n){return n!==null&&typeof n=="object"}/**
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
 */function ct(n){return n&&n._delegate?n._delegate:n}class be{constructor(t,e,r){this.name=t,this.instanceFactory=e,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}/**
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
 */const ve="[DEFAULT]";/**
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
 */class Fh{constructor(t,e){this.name=t,this.container=e,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){const e=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(e)){const r=new Ch;if(this.instancesDeferred.set(e,r),this.isInitialized(e)||this.shouldAutoInitialize())try{const s=this.getOrInitializeService({instanceIdentifier:e});s&&r.resolve(s)}catch{}}return this.instancesDeferred.get(e).promise}getImmediate(t){const e=this.normalizeInstanceIdentifier(t==null?void 0:t.identifier),r=(t==null?void 0:t.optional)??!1;if(this.isInitialized(e)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:e})}catch(s){if(r)return null;throw s}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,!!this.shouldAutoInitialize()){if(Bh(t))try{this.getOrInitializeService({instanceIdentifier:ve})}catch{}for(const[e,r]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(e);try{const o=this.getOrInitializeService({instanceIdentifier:s});r.resolve(o)}catch{}}}}clearInstance(t=ve){this.instancesDeferred.delete(t),this.instancesOptions.delete(t),this.instances.delete(t)}async delete(){const t=Array.from(this.instances.values());await Promise.all([...t.filter(e=>"INTERNAL"in e).map(e=>e.INTERNAL.delete()),...t.filter(e=>"_delete"in e).map(e=>e._delete())])}isComponentSet(){return this.component!=null}isInitialized(t=ve){return this.instances.has(t)}getOptions(t=ve){return this.instancesOptions.get(t)||{}}initialize(t={}){const{options:e={}}=t,r=this.normalizeInstanceIdentifier(t.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:r,options:e});for(const[o,a]of this.instancesDeferred.entries()){const c=this.normalizeInstanceIdentifier(o);r===c&&a.resolve(s)}return s}onInit(t,e){const r=this.normalizeInstanceIdentifier(e),s=this.onInitCallbacks.get(r)??new Set;s.add(t),this.onInitCallbacks.set(r,s);const o=this.instances.get(r);return o&&t(o,r),()=>{s.delete(t)}}invokeOnInitCallbacks(t,e){const r=this.onInitCallbacks.get(e);if(r)for(const s of r)try{s(t,e)}catch{}}getOrInitializeService({instanceIdentifier:t,options:e={}}){let r=this.instances.get(t);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:Uh(t),options:e}),this.instances.set(t,r),this.instancesOptions.set(t,e),this.invokeOnInitCallbacks(r,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,r)}catch{}return r||null}normalizeInstanceIdentifier(t=ve){return this.component?this.component.multipleInstances?t:ve:t}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Uh(n){return n===ve?void 0:n}function Bh(n){return n.instantiationMode==="EAGER"}/**
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
 */class qh{constructor(t){this.name=t,this.providers=new Map}addComponent(t){const e=this.getProvider(t.name);if(e.isComponentSet())throw new Error(`Component ${t.name} has already been registered with ${this.name}`);e.setComponent(t)}addOrOverwriteComponent(t){this.getProvider(t.name).isComponentSet()&&this.providers.delete(t.name),this.addComponent(t)}getProvider(t){if(this.providers.has(t))return this.providers.get(t);const e=new Fh(t,this);return this.providers.set(t,e),e}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var G;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(G||(G={}));const jh={debug:G.DEBUG,verbose:G.VERBOSE,info:G.INFO,warn:G.WARN,error:G.ERROR,silent:G.SILENT},$h=G.INFO,zh={[G.DEBUG]:"log",[G.VERBOSE]:"log",[G.INFO]:"info",[G.WARN]:"warn",[G.ERROR]:"error"},Hh=(n,t,...e)=>{if(t<n.logLevel)return;const r=new Date().toISOString(),s=zh[t];if(s)console[s](`[${r}]  ${n.name}:`,...e);else throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class ku{constructor(t){this.name=t,this._logLevel=$h,this._logHandler=Hh,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in G))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel=typeof t=="string"?jh[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if(typeof t!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,G.DEBUG,...t),this._logHandler(this,G.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,G.VERBOSE,...t),this._logHandler(this,G.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,G.INFO,...t),this._logHandler(this,G.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,G.WARN,...t),this._logHandler(this,G.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,G.ERROR,...t),this._logHandler(this,G.ERROR,...t)}}/**
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
 */class Gh{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(e=>{if(Kh(e)){const r=e.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(e=>e).join(" ")}}function Kh(n){const t=n.getComponent();return(t==null?void 0:t.type)==="VERSION"}const zs="@firebase/app",ga="0.14.1";/**
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
 */const Yt=new ku("@firebase/app"),Wh="@firebase/app-compat",Qh="@firebase/analytics-compat",Xh="@firebase/analytics",Yh="@firebase/app-check-compat",Jh="@firebase/app-check",Zh="@firebase/auth",td="@firebase/auth-compat",ed="@firebase/database",nd="@firebase/data-connect",rd="@firebase/database-compat",sd="@firebase/functions",id="@firebase/functions-compat",od="@firebase/installations",ad="@firebase/installations-compat",ud="@firebase/messaging",cd="@firebase/messaging-compat",ld="@firebase/performance",hd="@firebase/performance-compat",dd="@firebase/remote-config",fd="@firebase/remote-config-compat",pd="@firebase/storage",md="@firebase/storage-compat",gd="@firebase/firestore",_d="@firebase/ai",yd="@firebase/firestore-compat",Ed="firebase",Td="12.1.0";/**
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
 */const Hs="[DEFAULT]",wd={[zs]:"fire-core",[Wh]:"fire-core-compat",[Xh]:"fire-analytics",[Qh]:"fire-analytics-compat",[Jh]:"fire-app-check",[Yh]:"fire-app-check-compat",[Zh]:"fire-auth",[td]:"fire-auth-compat",[ed]:"fire-rtdb",[nd]:"fire-data-connect",[rd]:"fire-rtdb-compat",[sd]:"fire-fn",[id]:"fire-fn-compat",[od]:"fire-iid",[ad]:"fire-iid-compat",[ud]:"fire-fcm",[cd]:"fire-fcm-compat",[ld]:"fire-perf",[hd]:"fire-perf-compat",[dd]:"fire-rc",[fd]:"fire-rc-compat",[pd]:"fire-gcs",[md]:"fire-gcs-compat",[gd]:"fire-fst",[yd]:"fire-fst-compat",[_d]:"fire-vertex","fire-js":"fire-js",[Ed]:"fire-js-all"};/**
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
 */const br=new Map,Id=new Map,Gs=new Map;function _a(n,t){try{n.container.addComponent(t)}catch(e){Yt.debug(`Component ${t.name} failed to register with FirebaseApp ${n.name}`,e)}}function $e(n){const t=n.name;if(Gs.has(t))return Yt.debug(`There were multiple attempts to register component ${t}.`),!1;Gs.set(t,n);for(const e of br.values())_a(e,n);for(const e of Id.values())_a(e,n);return!0}function Ei(n,t){const e=n.container.getProvider("heartbeat").getImmediate({optional:!0});return e&&e.triggerHeartbeat(),n.container.getProvider(t)}function Ti(n){return n==null?!1:n.settings!==void 0}/**
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
 */const Ad={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},ae=new Nu("app","Firebase",Ad);/**
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
 */class vd{constructor(t,e,r){this._isDeleted=!1,this._options={...t},this._config={...e},this._name=e.name,this._automaticDataCollectionEnabled=e.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new be("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw ae.create("app-deleted",{appName:this._name})}}/**
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
 */const Ou=Td;function xu(n,t={}){let e=n;typeof t!="object"&&(t={name:t});const r={name:Hs,automaticDataCollectionEnabled:!0,...t},s=r.name;if(typeof s!="string"||!s)throw ae.create("bad-app-name",{appName:String(s)});if(e||(e=Vu()),!e)throw ae.create("no-options");const o=br.get(s);if(o){if(Pr(e,o.options)&&Pr(r,o.config))return o;throw ae.create("duplicate-app",{appName:s})}const a=new qh(s);for(const h of Gs.values())a.addComponent(h);const c=new vd(e,r,a);return br.set(s,c),c}function wi(n=Hs){const t=br.get(n);if(!t&&n===Hs&&Vu())return xu();if(!t)throw ae.create("no-app",{appName:n});return t}function Bt(n,t,e){let r=wd[n]??n;e&&(r+=`-${e}`);const s=r.match(/\s|\//),o=t.match(/\s|\//);if(s||o){const a=[`Unable to register library "${r}" with version "${t}":`];s&&a.push(`library name "${r}" contains illegal characters (whitespace or "/")`),s&&o&&a.push("and"),o&&a.push(`version name "${t}" contains illegal characters (whitespace or "/")`),Yt.warn(a.join(" "));return}$e(new be(`${r}-version`,()=>({library:r,version:t}),"VERSION"))}/**
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
 */const Rd="firebase-heartbeat-database",Sd=1,On="firebase-heartbeat-store";let xs=null;function Mu(){return xs||(xs=gh(Rd,Sd,{upgrade:(n,t)=>{switch(t){case 0:try{n.createObjectStore(On)}catch(e){console.warn(e)}}}}).catch(n=>{throw ae.create("idb-open",{originalErrorMessage:n.message})})),xs}async function Cd(n){try{const e=(await Mu()).transaction(On),r=await e.objectStore(On).get(Lu(n));return await e.done,r}catch(t){if(t instanceof ge)Yt.warn(t.message);else{const e=ae.create("idb-get",{originalErrorMessage:t==null?void 0:t.message});Yt.warn(e.message)}}}async function ya(n,t){try{const r=(await Mu()).transaction(On,"readwrite");await r.objectStore(On).put(t,Lu(n)),await r.done}catch(e){if(e instanceof ge)Yt.warn(e.message);else{const r=ae.create("idb-set",{originalErrorMessage:e==null?void 0:e.message});Yt.warn(r.message)}}}function Lu(n){return`${n.name}!${n.options.appId}`}/**
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
 */const Pd=1024,bd=30;class Vd{constructor(t){this.container=t,this._heartbeatsCache=null;const e=this.container.getProvider("app").getImmediate();this._storage=new Nd(e),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var t,e;try{const s=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),o=Ea();if(((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===o||this._heartbeatsCache.heartbeats.some(a=>a.date===o))return;if(this._heartbeatsCache.heartbeats.push({date:o,agent:s}),this._heartbeatsCache.heartbeats.length>bd){const a=kd(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(a,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){Yt.warn(r)}}async getHeartbeatsHeader(){var t;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const e=Ea(),{heartbeatsToSend:r,unsentEntries:s}=Dd(this._heartbeatsCache.heartbeats),o=Cr(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=e,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),o}catch(e){return Yt.warn(e),""}}}function Ea(){return new Date().toISOString().substring(0,10)}function Dd(n,t=Pd){const e=[];let r=n.slice();for(const s of n){const o=e.find(a=>a.agent===s.agent);if(o){if(o.dates.push(s.date),Ta(e)>t){o.dates.pop();break}}else if(e.push({agent:s.agent,dates:[s.date]}),Ta(e)>t){e.pop();break}r=r.slice(1)}return{heartbeatsToSend:e,unsentEntries:r}}class Nd{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return kh()?Oh().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const e=await Cd(this.app);return e!=null&&e.heartbeats?e:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){if(await this._canUseIndexedDBPromise){const r=await this.read();return ya(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){if(await this._canUseIndexedDBPromise){const r=await this.read();return ya(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...t.heartbeats]})}else return}}function Ta(n){return Cr(JSON.stringify({version:2,heartbeats:n})).length}function kd(n){if(n.length===0)return-1;let t=0,e=n[0].date;for(let r=1;r<n.length;r++)n[r].date<e&&(e=n[r].date,t=r);return t}/**
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
 */function Od(n){$e(new be("platform-logger",t=>new Gh(t),"PRIVATE")),$e(new be("heartbeat",t=>new Vd(t),"PRIVATE")),Bt(zs,ga,n),Bt(zs,ga,"esm2020"),Bt("fire-js","")}Od("");var xd="firebase",Md="12.1.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Bt(xd,Md,"app");var wa=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var ue,Fu;(function(){var n;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function t(I,m){function _(){}_.prototype=m.prototype,I.D=m.prototype,I.prototype=new _,I.prototype.constructor=I,I.C=function(T,w,v){for(var g=Array(arguments.length-2),Wt=2;Wt<arguments.length;Wt++)g[Wt-2]=arguments[Wt];return m.prototype[w].apply(T,g)}}function e(){this.blockSize=-1}function r(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.B=Array(this.blockSize),this.o=this.h=0,this.s()}t(r,e),r.prototype.s=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function s(I,m,_){_||(_=0);var T=Array(16);if(typeof m=="string")for(var w=0;16>w;++w)T[w]=m.charCodeAt(_++)|m.charCodeAt(_++)<<8|m.charCodeAt(_++)<<16|m.charCodeAt(_++)<<24;else for(w=0;16>w;++w)T[w]=m[_++]|m[_++]<<8|m[_++]<<16|m[_++]<<24;m=I.g[0],_=I.g[1],w=I.g[2];var v=I.g[3],g=m+(v^_&(w^v))+T[0]+3614090360&4294967295;m=_+(g<<7&4294967295|g>>>25),g=v+(w^m&(_^w))+T[1]+3905402710&4294967295,v=m+(g<<12&4294967295|g>>>20),g=w+(_^v&(m^_))+T[2]+606105819&4294967295,w=v+(g<<17&4294967295|g>>>15),g=_+(m^w&(v^m))+T[3]+3250441966&4294967295,_=w+(g<<22&4294967295|g>>>10),g=m+(v^_&(w^v))+T[4]+4118548399&4294967295,m=_+(g<<7&4294967295|g>>>25),g=v+(w^m&(_^w))+T[5]+1200080426&4294967295,v=m+(g<<12&4294967295|g>>>20),g=w+(_^v&(m^_))+T[6]+2821735955&4294967295,w=v+(g<<17&4294967295|g>>>15),g=_+(m^w&(v^m))+T[7]+4249261313&4294967295,_=w+(g<<22&4294967295|g>>>10),g=m+(v^_&(w^v))+T[8]+1770035416&4294967295,m=_+(g<<7&4294967295|g>>>25),g=v+(w^m&(_^w))+T[9]+2336552879&4294967295,v=m+(g<<12&4294967295|g>>>20),g=w+(_^v&(m^_))+T[10]+4294925233&4294967295,w=v+(g<<17&4294967295|g>>>15),g=_+(m^w&(v^m))+T[11]+2304563134&4294967295,_=w+(g<<22&4294967295|g>>>10),g=m+(v^_&(w^v))+T[12]+1804603682&4294967295,m=_+(g<<7&4294967295|g>>>25),g=v+(w^m&(_^w))+T[13]+4254626195&4294967295,v=m+(g<<12&4294967295|g>>>20),g=w+(_^v&(m^_))+T[14]+2792965006&4294967295,w=v+(g<<17&4294967295|g>>>15),g=_+(m^w&(v^m))+T[15]+1236535329&4294967295,_=w+(g<<22&4294967295|g>>>10),g=m+(w^v&(_^w))+T[1]+4129170786&4294967295,m=_+(g<<5&4294967295|g>>>27),g=v+(_^w&(m^_))+T[6]+3225465664&4294967295,v=m+(g<<9&4294967295|g>>>23),g=w+(m^_&(v^m))+T[11]+643717713&4294967295,w=v+(g<<14&4294967295|g>>>18),g=_+(v^m&(w^v))+T[0]+3921069994&4294967295,_=w+(g<<20&4294967295|g>>>12),g=m+(w^v&(_^w))+T[5]+3593408605&4294967295,m=_+(g<<5&4294967295|g>>>27),g=v+(_^w&(m^_))+T[10]+38016083&4294967295,v=m+(g<<9&4294967295|g>>>23),g=w+(m^_&(v^m))+T[15]+3634488961&4294967295,w=v+(g<<14&4294967295|g>>>18),g=_+(v^m&(w^v))+T[4]+3889429448&4294967295,_=w+(g<<20&4294967295|g>>>12),g=m+(w^v&(_^w))+T[9]+568446438&4294967295,m=_+(g<<5&4294967295|g>>>27),g=v+(_^w&(m^_))+T[14]+3275163606&4294967295,v=m+(g<<9&4294967295|g>>>23),g=w+(m^_&(v^m))+T[3]+4107603335&4294967295,w=v+(g<<14&4294967295|g>>>18),g=_+(v^m&(w^v))+T[8]+1163531501&4294967295,_=w+(g<<20&4294967295|g>>>12),g=m+(w^v&(_^w))+T[13]+2850285829&4294967295,m=_+(g<<5&4294967295|g>>>27),g=v+(_^w&(m^_))+T[2]+4243563512&4294967295,v=m+(g<<9&4294967295|g>>>23),g=w+(m^_&(v^m))+T[7]+1735328473&4294967295,w=v+(g<<14&4294967295|g>>>18),g=_+(v^m&(w^v))+T[12]+2368359562&4294967295,_=w+(g<<20&4294967295|g>>>12),g=m+(_^w^v)+T[5]+4294588738&4294967295,m=_+(g<<4&4294967295|g>>>28),g=v+(m^_^w)+T[8]+2272392833&4294967295,v=m+(g<<11&4294967295|g>>>21),g=w+(v^m^_)+T[11]+1839030562&4294967295,w=v+(g<<16&4294967295|g>>>16),g=_+(w^v^m)+T[14]+4259657740&4294967295,_=w+(g<<23&4294967295|g>>>9),g=m+(_^w^v)+T[1]+2763975236&4294967295,m=_+(g<<4&4294967295|g>>>28),g=v+(m^_^w)+T[4]+1272893353&4294967295,v=m+(g<<11&4294967295|g>>>21),g=w+(v^m^_)+T[7]+4139469664&4294967295,w=v+(g<<16&4294967295|g>>>16),g=_+(w^v^m)+T[10]+3200236656&4294967295,_=w+(g<<23&4294967295|g>>>9),g=m+(_^w^v)+T[13]+681279174&4294967295,m=_+(g<<4&4294967295|g>>>28),g=v+(m^_^w)+T[0]+3936430074&4294967295,v=m+(g<<11&4294967295|g>>>21),g=w+(v^m^_)+T[3]+3572445317&4294967295,w=v+(g<<16&4294967295|g>>>16),g=_+(w^v^m)+T[6]+76029189&4294967295,_=w+(g<<23&4294967295|g>>>9),g=m+(_^w^v)+T[9]+3654602809&4294967295,m=_+(g<<4&4294967295|g>>>28),g=v+(m^_^w)+T[12]+3873151461&4294967295,v=m+(g<<11&4294967295|g>>>21),g=w+(v^m^_)+T[15]+530742520&4294967295,w=v+(g<<16&4294967295|g>>>16),g=_+(w^v^m)+T[2]+3299628645&4294967295,_=w+(g<<23&4294967295|g>>>9),g=m+(w^(_|~v))+T[0]+4096336452&4294967295,m=_+(g<<6&4294967295|g>>>26),g=v+(_^(m|~w))+T[7]+1126891415&4294967295,v=m+(g<<10&4294967295|g>>>22),g=w+(m^(v|~_))+T[14]+2878612391&4294967295,w=v+(g<<15&4294967295|g>>>17),g=_+(v^(w|~m))+T[5]+4237533241&4294967295,_=w+(g<<21&4294967295|g>>>11),g=m+(w^(_|~v))+T[12]+1700485571&4294967295,m=_+(g<<6&4294967295|g>>>26),g=v+(_^(m|~w))+T[3]+2399980690&4294967295,v=m+(g<<10&4294967295|g>>>22),g=w+(m^(v|~_))+T[10]+4293915773&4294967295,w=v+(g<<15&4294967295|g>>>17),g=_+(v^(w|~m))+T[1]+2240044497&4294967295,_=w+(g<<21&4294967295|g>>>11),g=m+(w^(_|~v))+T[8]+1873313359&4294967295,m=_+(g<<6&4294967295|g>>>26),g=v+(_^(m|~w))+T[15]+4264355552&4294967295,v=m+(g<<10&4294967295|g>>>22),g=w+(m^(v|~_))+T[6]+2734768916&4294967295,w=v+(g<<15&4294967295|g>>>17),g=_+(v^(w|~m))+T[13]+1309151649&4294967295,_=w+(g<<21&4294967295|g>>>11),g=m+(w^(_|~v))+T[4]+4149444226&4294967295,m=_+(g<<6&4294967295|g>>>26),g=v+(_^(m|~w))+T[11]+3174756917&4294967295,v=m+(g<<10&4294967295|g>>>22),g=w+(m^(v|~_))+T[2]+718787259&4294967295,w=v+(g<<15&4294967295|g>>>17),g=_+(v^(w|~m))+T[9]+3951481745&4294967295,I.g[0]=I.g[0]+m&4294967295,I.g[1]=I.g[1]+(w+(g<<21&4294967295|g>>>11))&4294967295,I.g[2]=I.g[2]+w&4294967295,I.g[3]=I.g[3]+v&4294967295}r.prototype.u=function(I,m){m===void 0&&(m=I.length);for(var _=m-this.blockSize,T=this.B,w=this.h,v=0;v<m;){if(w==0)for(;v<=_;)s(this,I,v),v+=this.blockSize;if(typeof I=="string"){for(;v<m;)if(T[w++]=I.charCodeAt(v++),w==this.blockSize){s(this,T),w=0;break}}else for(;v<m;)if(T[w++]=I[v++],w==this.blockSize){s(this,T),w=0;break}}this.h=w,this.o+=m},r.prototype.v=function(){var I=Array((56>this.h?this.blockSize:2*this.blockSize)-this.h);I[0]=128;for(var m=1;m<I.length-8;++m)I[m]=0;var _=8*this.o;for(m=I.length-8;m<I.length;++m)I[m]=_&255,_/=256;for(this.u(I),I=Array(16),m=_=0;4>m;++m)for(var T=0;32>T;T+=8)I[_++]=this.g[m]>>>T&255;return I};function o(I,m){var _=c;return Object.prototype.hasOwnProperty.call(_,I)?_[I]:_[I]=m(I)}function a(I,m){this.h=m;for(var _=[],T=!0,w=I.length-1;0<=w;w--){var v=I[w]|0;T&&v==m||(_[w]=v,T=!1)}this.g=_}var c={};function h(I){return-128<=I&&128>I?o(I,function(m){return new a([m|0],0>m?-1:0)}):new a([I|0],0>I?-1:0)}function d(I){if(isNaN(I)||!isFinite(I))return y;if(0>I)return V(d(-I));for(var m=[],_=1,T=0;I>=_;T++)m[T]=I/_|0,_*=4294967296;return new a(m,0)}function p(I,m){if(I.length==0)throw Error("number format error: empty string");if(m=m||10,2>m||36<m)throw Error("radix out of range: "+m);if(I.charAt(0)=="-")return V(p(I.substring(1),m));if(0<=I.indexOf("-"))throw Error('number format error: interior "-" character');for(var _=d(Math.pow(m,8)),T=y,w=0;w<I.length;w+=8){var v=Math.min(8,I.length-w),g=parseInt(I.substring(w,w+v),m);8>v?(v=d(Math.pow(m,v)),T=T.j(v).add(d(g))):(T=T.j(_),T=T.add(d(g)))}return T}var y=h(0),E=h(1),S=h(16777216);n=a.prototype,n.m=function(){if(N(this))return-V(this).m();for(var I=0,m=1,_=0;_<this.g.length;_++){var T=this.i(_);I+=(0<=T?T:4294967296+T)*m,m*=4294967296}return I},n.toString=function(I){if(I=I||10,2>I||36<I)throw Error("radix out of range: "+I);if(b(this))return"0";if(N(this))return"-"+V(this).toString(I);for(var m=d(Math.pow(I,6)),_=this,T="";;){var w=z(_,m).g;_=q(_,w.j(m));var v=((0<_.g.length?_.g[0]:_.h)>>>0).toString(I);if(_=w,b(_))return v+T;for(;6>v.length;)v="0"+v;T=v+T}},n.i=function(I){return 0>I?0:I<this.g.length?this.g[I]:this.h};function b(I){if(I.h!=0)return!1;for(var m=0;m<I.g.length;m++)if(I.g[m]!=0)return!1;return!0}function N(I){return I.h==-1}n.l=function(I){return I=q(this,I),N(I)?-1:b(I)?0:1};function V(I){for(var m=I.g.length,_=[],T=0;T<m;T++)_[T]=~I.g[T];return new a(_,~I.h).add(E)}n.abs=function(){return N(this)?V(this):this},n.add=function(I){for(var m=Math.max(this.g.length,I.g.length),_=[],T=0,w=0;w<=m;w++){var v=T+(this.i(w)&65535)+(I.i(w)&65535),g=(v>>>16)+(this.i(w)>>>16)+(I.i(w)>>>16);T=g>>>16,v&=65535,g&=65535,_[w]=g<<16|v}return new a(_,_[_.length-1]&-2147483648?-1:0)};function q(I,m){return I.add(V(m))}n.j=function(I){if(b(this)||b(I))return y;if(N(this))return N(I)?V(this).j(V(I)):V(V(this).j(I));if(N(I))return V(this.j(V(I)));if(0>this.l(S)&&0>I.l(S))return d(this.m()*I.m());for(var m=this.g.length+I.g.length,_=[],T=0;T<2*m;T++)_[T]=0;for(T=0;T<this.g.length;T++)for(var w=0;w<I.g.length;w++){var v=this.i(T)>>>16,g=this.i(T)&65535,Wt=I.i(w)>>>16,on=I.i(w)&65535;_[2*T+2*w]+=g*on,F(_,2*T+2*w),_[2*T+2*w+1]+=v*on,F(_,2*T+2*w+1),_[2*T+2*w+1]+=g*Wt,F(_,2*T+2*w+1),_[2*T+2*w+2]+=v*Wt,F(_,2*T+2*w+2)}for(T=0;T<m;T++)_[T]=_[2*T+1]<<16|_[2*T];for(T=m;T<2*m;T++)_[T]=0;return new a(_,0)};function F(I,m){for(;(I[m]&65535)!=I[m];)I[m+1]+=I[m]>>>16,I[m]&=65535,m++}function B(I,m){this.g=I,this.h=m}function z(I,m){if(b(m))throw Error("division by zero");if(b(I))return new B(y,y);if(N(I))return m=z(V(I),m),new B(V(m.g),V(m.h));if(N(m))return m=z(I,V(m)),new B(V(m.g),m.h);if(30<I.g.length){if(N(I)||N(m))throw Error("slowDivide_ only works with positive integers.");for(var _=E,T=m;0>=T.l(I);)_=Ct(_),T=Ct(T);var w=st(_,1),v=st(T,1);for(T=st(T,2),_=st(_,2);!b(T);){var g=v.add(T);0>=g.l(I)&&(w=w.add(_),v=g),T=st(T,1),_=st(_,1)}return m=q(I,w.j(m)),new B(w,m)}for(w=y;0<=I.l(m);){for(_=Math.max(1,Math.floor(I.m()/m.m())),T=Math.ceil(Math.log(_)/Math.LN2),T=48>=T?1:Math.pow(2,T-48),v=d(_),g=v.j(m);N(g)||0<g.l(I);)_-=T,v=d(_),g=v.j(m);b(v)&&(v=E),w=w.add(v),I=q(I,g)}return new B(w,I)}n.A=function(I){return z(this,I).h},n.and=function(I){for(var m=Math.max(this.g.length,I.g.length),_=[],T=0;T<m;T++)_[T]=this.i(T)&I.i(T);return new a(_,this.h&I.h)},n.or=function(I){for(var m=Math.max(this.g.length,I.g.length),_=[],T=0;T<m;T++)_[T]=this.i(T)|I.i(T);return new a(_,this.h|I.h)},n.xor=function(I){for(var m=Math.max(this.g.length,I.g.length),_=[],T=0;T<m;T++)_[T]=this.i(T)^I.i(T);return new a(_,this.h^I.h)};function Ct(I){for(var m=I.g.length+1,_=[],T=0;T<m;T++)_[T]=I.i(T)<<1|I.i(T-1)>>>31;return new a(_,I.h)}function st(I,m){var _=m>>5;m%=32;for(var T=I.g.length-_,w=[],v=0;v<T;v++)w[v]=0<m?I.i(v+_)>>>m|I.i(v+_+1)<<32-m:I.i(v+_);return new a(w,I.h)}r.prototype.digest=r.prototype.v,r.prototype.reset=r.prototype.s,r.prototype.update=r.prototype.u,Fu=r,a.prototype.add=a.prototype.add,a.prototype.multiply=a.prototype.j,a.prototype.modulo=a.prototype.A,a.prototype.compare=a.prototype.l,a.prototype.toNumber=a.prototype.m,a.prototype.toString=a.prototype.toString,a.prototype.getBits=a.prototype.i,a.fromNumber=d,a.fromString=p,ue=a}).apply(typeof wa<"u"?wa:typeof self<"u"?self:typeof window<"u"?window:{});var pr=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Uu,vn,Bu,wr,Ks,qu,ju,$u;(function(){var n,t=typeof Object.defineProperties=="function"?Object.defineProperty:function(i,u,l){return i==Array.prototype||i==Object.prototype||(i[u]=l.value),i};function e(i){i=[typeof globalThis=="object"&&globalThis,i,typeof window=="object"&&window,typeof self=="object"&&self,typeof pr=="object"&&pr];for(var u=0;u<i.length;++u){var l=i[u];if(l&&l.Math==Math)return l}throw Error("Cannot find global object")}var r=e(this);function s(i,u){if(u)t:{var l=r;i=i.split(".");for(var f=0;f<i.length-1;f++){var A=i[f];if(!(A in l))break t;l=l[A]}i=i[i.length-1],f=l[i],u=u(f),u!=f&&u!=null&&t(l,i,{configurable:!0,writable:!0,value:u})}}function o(i,u){i instanceof String&&(i+="");var l=0,f=!1,A={next:function(){if(!f&&l<i.length){var R=l++;return{value:u(R,i[R]),done:!1}}return f=!0,{done:!0,value:void 0}}};return A[Symbol.iterator]=function(){return A},A}s("Array.prototype.values",function(i){return i||function(){return o(this,function(u,l){return l})}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var a=a||{},c=this||self;function h(i){var u=typeof i;return u=u!="object"?u:i?Array.isArray(i)?"array":u:"null",u=="array"||u=="object"&&typeof i.length=="number"}function d(i){var u=typeof i;return u=="object"&&i!=null||u=="function"}function p(i,u,l){return i.call.apply(i.bind,arguments)}function y(i,u,l){if(!i)throw Error();if(2<arguments.length){var f=Array.prototype.slice.call(arguments,2);return function(){var A=Array.prototype.slice.call(arguments);return Array.prototype.unshift.apply(A,f),i.apply(u,A)}}return function(){return i.apply(u,arguments)}}function E(i,u,l){return E=Function.prototype.bind&&Function.prototype.bind.toString().indexOf("native code")!=-1?p:y,E.apply(null,arguments)}function S(i,u){var l=Array.prototype.slice.call(arguments,1);return function(){var f=l.slice();return f.push.apply(f,arguments),i.apply(this,f)}}function b(i,u){function l(){}l.prototype=u.prototype,i.aa=u.prototype,i.prototype=new l,i.prototype.constructor=i,i.Qb=function(f,A,R){for(var D=Array(arguments.length-2),Q=2;Q<arguments.length;Q++)D[Q-2]=arguments[Q];return u.prototype[A].apply(f,D)}}function N(i){const u=i.length;if(0<u){const l=Array(u);for(let f=0;f<u;f++)l[f]=i[f];return l}return[]}function V(i,u){for(let l=1;l<arguments.length;l++){const f=arguments[l];if(h(f)){const A=i.length||0,R=f.length||0;i.length=A+R;for(let D=0;D<R;D++)i[A+D]=f[D]}else i.push(f)}}class q{constructor(u,l){this.i=u,this.j=l,this.h=0,this.g=null}get(){let u;return 0<this.h?(this.h--,u=this.g,this.g=u.next,u.next=null):u=this.i(),u}}function F(i){return/^[\s\xa0]*$/.test(i)}function B(){var i=c.navigator;return i&&(i=i.userAgent)?i:""}function z(i){return z[" "](i),i}z[" "]=function(){};var Ct=B().indexOf("Gecko")!=-1&&!(B().toLowerCase().indexOf("webkit")!=-1&&B().indexOf("Edge")==-1)&&!(B().indexOf("Trident")!=-1||B().indexOf("MSIE")!=-1)&&B().indexOf("Edge")==-1;function st(i,u,l){for(const f in i)u.call(l,i[f],f,i)}function I(i,u){for(const l in i)u.call(void 0,i[l],l,i)}function m(i){const u={};for(const l in i)u[l]=i[l];return u}const _="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function T(i,u){let l,f;for(let A=1;A<arguments.length;A++){f=arguments[A];for(l in f)i[l]=f[l];for(let R=0;R<_.length;R++)l=_[R],Object.prototype.hasOwnProperty.call(f,l)&&(i[l]=f[l])}}function w(i){var u=1;i=i.split(":");const l=[];for(;0<u&&i.length;)l.push(i.shift()),u--;return i.length&&l.push(i.join(":")),l}function v(i){c.setTimeout(()=>{throw i},0)}function g(){var i=hs;let u=null;return i.g&&(u=i.g,i.g=i.g.next,i.g||(i.h=null),u.next=null),u}class Wt{constructor(){this.h=this.g=null}add(u,l){const f=on.get();f.set(u,l),this.h?this.h.next=f:this.g=f,this.h=f}}var on=new q(()=>new xl,i=>i.reset());class xl{constructor(){this.next=this.g=this.h=null}set(u,l){this.h=u,this.g=l,this.next=null}reset(){this.next=this.g=this.h=null}}let an,un=!1,hs=new Wt,fo=()=>{const i=c.Promise.resolve(void 0);an=()=>{i.then(Ml)}};var Ml=()=>{for(var i;i=g();){try{i.h.call(i.g)}catch(l){v(l)}var u=on;u.j(i),100>u.h&&(u.h++,i.next=u.g,u.g=i)}un=!1};function te(){this.s=this.s,this.C=this.C}te.prototype.s=!1,te.prototype.ma=function(){this.s||(this.s=!0,this.N())},te.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function gt(i,u){this.type=i,this.g=this.target=u,this.defaultPrevented=!1}gt.prototype.h=function(){this.defaultPrevented=!0};var Ll=function(){if(!c.addEventListener||!Object.defineProperty)return!1;var i=!1,u=Object.defineProperty({},"passive",{get:function(){i=!0}});try{const l=()=>{};c.addEventListener("test",l,u),c.removeEventListener("test",l,u)}catch{}return i}();function cn(i,u){if(gt.call(this,i?i.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,i){var l=this.type=i.type,f=i.changedTouches&&i.changedTouches.length?i.changedTouches[0]:null;if(this.target=i.target||i.srcElement,this.g=u,u=i.relatedTarget){if(Ct){t:{try{z(u.nodeName);var A=!0;break t}catch{}A=!1}A||(u=null)}}else l=="mouseover"?u=i.fromElement:l=="mouseout"&&(u=i.toElement);this.relatedTarget=u,f?(this.clientX=f.clientX!==void 0?f.clientX:f.pageX,this.clientY=f.clientY!==void 0?f.clientY:f.pageY,this.screenX=f.screenX||0,this.screenY=f.screenY||0):(this.clientX=i.clientX!==void 0?i.clientX:i.pageX,this.clientY=i.clientY!==void 0?i.clientY:i.pageY,this.screenX=i.screenX||0,this.screenY=i.screenY||0),this.button=i.button,this.key=i.key||"",this.ctrlKey=i.ctrlKey,this.altKey=i.altKey,this.shiftKey=i.shiftKey,this.metaKey=i.metaKey,this.pointerId=i.pointerId||0,this.pointerType=typeof i.pointerType=="string"?i.pointerType:Fl[i.pointerType]||"",this.state=i.state,this.i=i,i.defaultPrevented&&cn.aa.h.call(this)}}b(cn,gt);var Fl={2:"touch",3:"pen",4:"mouse"};cn.prototype.h=function(){cn.aa.h.call(this);var i=this.i;i.preventDefault?i.preventDefault():i.returnValue=!1};var Qn="closure_listenable_"+(1e6*Math.random()|0),Ul=0;function Bl(i,u,l,f,A){this.listener=i,this.proxy=null,this.src=u,this.type=l,this.capture=!!f,this.ha=A,this.key=++Ul,this.da=this.fa=!1}function Xn(i){i.da=!0,i.listener=null,i.proxy=null,i.src=null,i.ha=null}function Yn(i){this.src=i,this.g={},this.h=0}Yn.prototype.add=function(i,u,l,f,A){var R=i.toString();i=this.g[R],i||(i=this.g[R]=[],this.h++);var D=fs(i,u,f,A);return-1<D?(u=i[D],l||(u.fa=!1)):(u=new Bl(u,this.src,R,!!f,A),u.fa=l,i.push(u)),u};function ds(i,u){var l=u.type;if(l in i.g){var f=i.g[l],A=Array.prototype.indexOf.call(f,u,void 0),R;(R=0<=A)&&Array.prototype.splice.call(f,A,1),R&&(Xn(u),i.g[l].length==0&&(delete i.g[l],i.h--))}}function fs(i,u,l,f){for(var A=0;A<i.length;++A){var R=i[A];if(!R.da&&R.listener==u&&R.capture==!!l&&R.ha==f)return A}return-1}var ps="closure_lm_"+(1e6*Math.random()|0),ms={};function po(i,u,l,f,A){if(Array.isArray(u)){for(var R=0;R<u.length;R++)po(i,u[R],l,f,A);return null}return l=_o(l),i&&i[Qn]?i.K(u,l,d(f)?!!f.capture:!1,A):ql(i,u,l,!1,f,A)}function ql(i,u,l,f,A,R){if(!u)throw Error("Invalid event type");var D=d(A)?!!A.capture:!!A,Q=_s(i);if(Q||(i[ps]=Q=new Yn(i)),l=Q.add(u,l,f,D,R),l.proxy)return l;if(f=jl(),l.proxy=f,f.src=i,f.listener=l,i.addEventListener)Ll||(A=D),A===void 0&&(A=!1),i.addEventListener(u.toString(),f,A);else if(i.attachEvent)i.attachEvent(go(u.toString()),f);else if(i.addListener&&i.removeListener)i.addListener(f);else throw Error("addEventListener and attachEvent are unavailable.");return l}function jl(){function i(l){return u.call(i.src,i.listener,l)}const u=$l;return i}function mo(i,u,l,f,A){if(Array.isArray(u))for(var R=0;R<u.length;R++)mo(i,u[R],l,f,A);else f=d(f)?!!f.capture:!!f,l=_o(l),i&&i[Qn]?(i=i.i,u=String(u).toString(),u in i.g&&(R=i.g[u],l=fs(R,l,f,A),-1<l&&(Xn(R[l]),Array.prototype.splice.call(R,l,1),R.length==0&&(delete i.g[u],i.h--)))):i&&(i=_s(i))&&(u=i.g[u.toString()],i=-1,u&&(i=fs(u,l,f,A)),(l=-1<i?u[i]:null)&&gs(l))}function gs(i){if(typeof i!="number"&&i&&!i.da){var u=i.src;if(u&&u[Qn])ds(u.i,i);else{var l=i.type,f=i.proxy;u.removeEventListener?u.removeEventListener(l,f,i.capture):u.detachEvent?u.detachEvent(go(l),f):u.addListener&&u.removeListener&&u.removeListener(f),(l=_s(u))?(ds(l,i),l.h==0&&(l.src=null,u[ps]=null)):Xn(i)}}}function go(i){return i in ms?ms[i]:ms[i]="on"+i}function $l(i,u){if(i.da)i=!0;else{u=new cn(u,this);var l=i.listener,f=i.ha||i.src;i.fa&&gs(i),i=l.call(f,u)}return i}function _s(i){return i=i[ps],i instanceof Yn?i:null}var ys="__closure_events_fn_"+(1e9*Math.random()>>>0);function _o(i){return typeof i=="function"?i:(i[ys]||(i[ys]=function(u){return i.handleEvent(u)}),i[ys])}function _t(){te.call(this),this.i=new Yn(this),this.M=this,this.F=null}b(_t,te),_t.prototype[Qn]=!0,_t.prototype.removeEventListener=function(i,u,l,f){mo(this,i,u,l,f)};function At(i,u){var l,f=i.F;if(f)for(l=[];f;f=f.F)l.push(f);if(i=i.M,f=u.type||u,typeof u=="string")u=new gt(u,i);else if(u instanceof gt)u.target=u.target||i;else{var A=u;u=new gt(f,i),T(u,A)}if(A=!0,l)for(var R=l.length-1;0<=R;R--){var D=u.g=l[R];A=Jn(D,f,!0,u)&&A}if(D=u.g=i,A=Jn(D,f,!0,u)&&A,A=Jn(D,f,!1,u)&&A,l)for(R=0;R<l.length;R++)D=u.g=l[R],A=Jn(D,f,!1,u)&&A}_t.prototype.N=function(){if(_t.aa.N.call(this),this.i){var i=this.i,u;for(u in i.g){for(var l=i.g[u],f=0;f<l.length;f++)Xn(l[f]);delete i.g[u],i.h--}}this.F=null},_t.prototype.K=function(i,u,l,f){return this.i.add(String(i),u,!1,l,f)},_t.prototype.L=function(i,u,l,f){return this.i.add(String(i),u,!0,l,f)};function Jn(i,u,l,f){if(u=i.i.g[String(u)],!u)return!0;u=u.concat();for(var A=!0,R=0;R<u.length;++R){var D=u[R];if(D&&!D.da&&D.capture==l){var Q=D.listener,dt=D.ha||D.src;D.fa&&ds(i.i,D),A=Q.call(dt,f)!==!1&&A}}return A&&!f.defaultPrevented}function yo(i,u,l){if(typeof i=="function")l&&(i=E(i,l));else if(i&&typeof i.handleEvent=="function")i=E(i.handleEvent,i);else throw Error("Invalid listener argument");return 2147483647<Number(u)?-1:c.setTimeout(i,u||0)}function Eo(i){i.g=yo(()=>{i.g=null,i.i&&(i.i=!1,Eo(i))},i.l);const u=i.h;i.h=null,i.m.apply(null,u)}class zl extends te{constructor(u,l){super(),this.m=u,this.l=l,this.h=null,this.i=!1,this.g=null}j(u){this.h=arguments,this.g?this.i=!0:Eo(this)}N(){super.N(),this.g&&(c.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function ln(i){te.call(this),this.h=i,this.g={}}b(ln,te);var To=[];function wo(i){st(i.g,function(u,l){this.g.hasOwnProperty(l)&&gs(u)},i),i.g={}}ln.prototype.N=function(){ln.aa.N.call(this),wo(this)},ln.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Es=c.JSON.stringify,Hl=c.JSON.parse,Gl=class{stringify(i){return c.JSON.stringify(i,void 0)}parse(i){return c.JSON.parse(i,void 0)}};function Ts(){}Ts.prototype.h=null;function Io(i){return i.h||(i.h=i.i())}function Ao(){}var hn={OPEN:"a",kb:"b",Ja:"c",wb:"d"};function ws(){gt.call(this,"d")}b(ws,gt);function Is(){gt.call(this,"c")}b(Is,gt);var Te={},vo=null;function Zn(){return vo=vo||new _t}Te.La="serverreachability";function Ro(i){gt.call(this,Te.La,i)}b(Ro,gt);function dn(i){const u=Zn();At(u,new Ro(u))}Te.STAT_EVENT="statevent";function So(i,u){gt.call(this,Te.STAT_EVENT,i),this.stat=u}b(So,gt);function vt(i){const u=Zn();At(u,new So(u,i))}Te.Ma="timingevent";function Co(i,u){gt.call(this,Te.Ma,i),this.size=u}b(Co,gt);function fn(i,u){if(typeof i!="function")throw Error("Fn must not be null and must be a function");return c.setTimeout(function(){i()},u)}function pn(){this.g=!0}pn.prototype.xa=function(){this.g=!1};function Kl(i,u,l,f,A,R){i.info(function(){if(i.g)if(R)for(var D="",Q=R.split("&"),dt=0;dt<Q.length;dt++){var K=Q[dt].split("=");if(1<K.length){var yt=K[0];K=K[1];var Et=yt.split("_");D=2<=Et.length&&Et[1]=="type"?D+(yt+"="+K+"&"):D+(yt+"=redacted&")}}else D=null;else D=R;return"XMLHTTP REQ ("+f+") [attempt "+A+"]: "+u+`
`+l+`
`+D})}function Wl(i,u,l,f,A,R,D){i.info(function(){return"XMLHTTP RESP ("+f+") [ attempt "+A+"]: "+u+`
`+l+`
`+R+" "+D})}function xe(i,u,l,f){i.info(function(){return"XMLHTTP TEXT ("+u+"): "+Xl(i,l)+(f?" "+f:"")})}function Ql(i,u){i.info(function(){return"TIMEOUT: "+u})}pn.prototype.info=function(){};function Xl(i,u){if(!i.g)return u;if(!u)return null;try{var l=JSON.parse(u);if(l){for(i=0;i<l.length;i++)if(Array.isArray(l[i])){var f=l[i];if(!(2>f.length)){var A=f[1];if(Array.isArray(A)&&!(1>A.length)){var R=A[0];if(R!="noop"&&R!="stop"&&R!="close")for(var D=1;D<A.length;D++)A[D]=""}}}}return Es(l)}catch{return u}}var tr={NO_ERROR:0,gb:1,tb:2,sb:3,nb:4,rb:5,ub:6,Ia:7,TIMEOUT:8,xb:9},Po={lb:"complete",Hb:"success",Ja:"error",Ia:"abort",zb:"ready",Ab:"readystatechange",TIMEOUT:"timeout",vb:"incrementaldata",yb:"progress",ob:"downloadprogress",Pb:"uploadprogress"},As;function er(){}b(er,Ts),er.prototype.g=function(){return new XMLHttpRequest},er.prototype.i=function(){return{}},As=new er;function ee(i,u,l,f){this.j=i,this.i=u,this.l=l,this.R=f||1,this.U=new ln(this),this.I=45e3,this.H=null,this.o=!1,this.m=this.A=this.v=this.L=this.F=this.S=this.B=null,this.D=[],this.g=null,this.C=0,this.s=this.u=null,this.X=-1,this.J=!1,this.O=0,this.M=null,this.W=this.K=this.T=this.P=!1,this.h=new bo}function bo(){this.i=null,this.g="",this.h=!1}var Vo={},vs={};function Rs(i,u,l){i.L=1,i.v=ir(Qt(u)),i.m=l,i.P=!0,Do(i,null)}function Do(i,u){i.F=Date.now(),nr(i),i.A=Qt(i.v);var l=i.A,f=i.R;Array.isArray(f)||(f=[String(f)]),Ho(l.i,"t",f),i.C=0,l=i.j.J,i.h=new bo,i.g=ca(i.j,l?u:null,!i.m),0<i.O&&(i.M=new zl(E(i.Y,i,i.g),i.O)),u=i.U,l=i.g,f=i.ca;var A="readystatechange";Array.isArray(A)||(A&&(To[0]=A.toString()),A=To);for(var R=0;R<A.length;R++){var D=po(l,A[R],f||u.handleEvent,!1,u.h||u);if(!D)break;u.g[D.key]=D}u=i.H?m(i.H):{},i.m?(i.u||(i.u="POST"),u["Content-Type"]="application/x-www-form-urlencoded",i.g.ea(i.A,i.u,i.m,u)):(i.u="GET",i.g.ea(i.A,i.u,null,u)),dn(),Kl(i.i,i.u,i.A,i.l,i.R,i.m)}ee.prototype.ca=function(i){i=i.target;const u=this.M;u&&Xt(i)==3?u.j():this.Y(i)},ee.prototype.Y=function(i){try{if(i==this.g)t:{const Et=Xt(this.g);var u=this.g.Ba();const Fe=this.g.Z();if(!(3>Et)&&(Et!=3||this.g&&(this.h.h||this.g.oa()||Jo(this.g)))){this.J||Et!=4||u==7||(u==8||0>=Fe?dn(3):dn(2)),Ss(this);var l=this.g.Z();this.X=l;e:if(No(this)){var f=Jo(this.g);i="";var A=f.length,R=Xt(this.g)==4;if(!this.h.i){if(typeof TextDecoder>"u"){we(this),mn(this);var D="";break e}this.h.i=new c.TextDecoder}for(u=0;u<A;u++)this.h.h=!0,i+=this.h.i.decode(f[u],{stream:!(R&&u==A-1)});f.length=0,this.h.g+=i,this.C=0,D=this.h.g}else D=this.g.oa();if(this.o=l==200,Wl(this.i,this.u,this.A,this.l,this.R,Et,l),this.o){if(this.T&&!this.K){e:{if(this.g){var Q,dt=this.g;if((Q=dt.g?dt.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!F(Q)){var K=Q;break e}}K=null}if(l=K)xe(this.i,this.l,l,"Initial handshake response via X-HTTP-Initial-Response"),this.K=!0,Cs(this,l);else{this.o=!1,this.s=3,vt(12),we(this),mn(this);break t}}if(this.P){l=!0;let Mt;for(;!this.J&&this.C<D.length;)if(Mt=Yl(this,D),Mt==vs){Et==4&&(this.s=4,vt(14),l=!1),xe(this.i,this.l,null,"[Incomplete Response]");break}else if(Mt==Vo){this.s=4,vt(15),xe(this.i,this.l,D,"[Invalid Chunk]"),l=!1;break}else xe(this.i,this.l,Mt,null),Cs(this,Mt);if(No(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),Et!=4||D.length!=0||this.h.h||(this.s=1,vt(16),l=!1),this.o=this.o&&l,!l)xe(this.i,this.l,D,"[Invalid Chunked Response]"),we(this),mn(this);else if(0<D.length&&!this.W){this.W=!0;var yt=this.j;yt.g==this&&yt.ba&&!yt.M&&(yt.j.info("Great, no buffering proxy detected. Bytes received: "+D.length),ks(yt),yt.M=!0,vt(11))}}else xe(this.i,this.l,D,null),Cs(this,D);Et==4&&we(this),this.o&&!this.J&&(Et==4?ia(this.j,this):(this.o=!1,nr(this)))}else ph(this.g),l==400&&0<D.indexOf("Unknown SID")?(this.s=3,vt(12)):(this.s=0,vt(13)),we(this),mn(this)}}}catch{}finally{}};function No(i){return i.g?i.u=="GET"&&i.L!=2&&i.j.Ca:!1}function Yl(i,u){var l=i.C,f=u.indexOf(`
`,l);return f==-1?vs:(l=Number(u.substring(l,f)),isNaN(l)?Vo:(f+=1,f+l>u.length?vs:(u=u.slice(f,f+l),i.C=f+l,u)))}ee.prototype.cancel=function(){this.J=!0,we(this)};function nr(i){i.S=Date.now()+i.I,ko(i,i.I)}function ko(i,u){if(i.B!=null)throw Error("WatchDog timer not null");i.B=fn(E(i.ba,i),u)}function Ss(i){i.B&&(c.clearTimeout(i.B),i.B=null)}ee.prototype.ba=function(){this.B=null;const i=Date.now();0<=i-this.S?(Ql(this.i,this.A),this.L!=2&&(dn(),vt(17)),we(this),this.s=2,mn(this)):ko(this,this.S-i)};function mn(i){i.j.G==0||i.J||ia(i.j,i)}function we(i){Ss(i);var u=i.M;u&&typeof u.ma=="function"&&u.ma(),i.M=null,wo(i.U),i.g&&(u=i.g,i.g=null,u.abort(),u.ma())}function Cs(i,u){try{var l=i.j;if(l.G!=0&&(l.g==i||Ps(l.h,i))){if(!i.K&&Ps(l.h,i)&&l.G==3){try{var f=l.Da.g.parse(u)}catch{f=null}if(Array.isArray(f)&&f.length==3){var A=f;if(A[0]==0){t:if(!l.u){if(l.g)if(l.g.F+3e3<i.F)hr(l),cr(l);else break t;Ns(l),vt(18)}}else l.za=A[1],0<l.za-l.T&&37500>A[2]&&l.F&&l.v==0&&!l.C&&(l.C=fn(E(l.Za,l),6e3));if(1>=Mo(l.h)&&l.ca){try{l.ca()}catch{}l.ca=void 0}}else Ae(l,11)}else if((i.K||l.g==i)&&hr(l),!F(u))for(A=l.Da.g.parse(u),u=0;u<A.length;u++){let K=A[u];if(l.T=K[0],K=K[1],l.G==2)if(K[0]=="c"){l.K=K[1],l.ia=K[2];const yt=K[3];yt!=null&&(l.la=yt,l.j.info("VER="+l.la));const Et=K[4];Et!=null&&(l.Aa=Et,l.j.info("SVER="+l.Aa));const Fe=K[5];Fe!=null&&typeof Fe=="number"&&0<Fe&&(f=1.5*Fe,l.L=f,l.j.info("backChannelRequestTimeoutMs_="+f)),f=l;const Mt=i.g;if(Mt){const fr=Mt.g?Mt.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(fr){var R=f.h;R.g||fr.indexOf("spdy")==-1&&fr.indexOf("quic")==-1&&fr.indexOf("h2")==-1||(R.j=R.l,R.g=new Set,R.h&&(bs(R,R.h),R.h=null))}if(f.D){const Os=Mt.g?Mt.g.getResponseHeader("X-HTTP-Session-Id"):null;Os&&(f.ya=Os,Y(f.I,f.D,Os))}}l.G=3,l.l&&l.l.ua(),l.ba&&(l.R=Date.now()-i.F,l.j.info("Handshake RTT: "+l.R+"ms")),f=l;var D=i;if(f.qa=ua(f,f.J?f.ia:null,f.W),D.K){Lo(f.h,D);var Q=D,dt=f.L;dt&&(Q.I=dt),Q.B&&(Ss(Q),nr(Q)),f.g=D}else ra(f);0<l.i.length&&lr(l)}else K[0]!="stop"&&K[0]!="close"||Ae(l,7);else l.G==3&&(K[0]=="stop"||K[0]=="close"?K[0]=="stop"?Ae(l,7):Ds(l):K[0]!="noop"&&l.l&&l.l.ta(K),l.v=0)}}dn(4)}catch{}}var Jl=class{constructor(i,u){this.g=i,this.map=u}};function Oo(i){this.l=i||10,c.PerformanceNavigationTiming?(i=c.performance.getEntriesByType("navigation"),i=0<i.length&&(i[0].nextHopProtocol=="hq"||i[0].nextHopProtocol=="h2")):i=!!(c.chrome&&c.chrome.loadTimes&&c.chrome.loadTimes()&&c.chrome.loadTimes().wasFetchedViaSpdy),this.j=i?this.l:1,this.g=null,1<this.j&&(this.g=new Set),this.h=null,this.i=[]}function xo(i){return i.h?!0:i.g?i.g.size>=i.j:!1}function Mo(i){return i.h?1:i.g?i.g.size:0}function Ps(i,u){return i.h?i.h==u:i.g?i.g.has(u):!1}function bs(i,u){i.g?i.g.add(u):i.h=u}function Lo(i,u){i.h&&i.h==u?i.h=null:i.g&&i.g.has(u)&&i.g.delete(u)}Oo.prototype.cancel=function(){if(this.i=Fo(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const i of this.g.values())i.cancel();this.g.clear()}};function Fo(i){if(i.h!=null)return i.i.concat(i.h.D);if(i.g!=null&&i.g.size!==0){let u=i.i;for(const l of i.g.values())u=u.concat(l.D);return u}return N(i.i)}function Zl(i){if(i.V&&typeof i.V=="function")return i.V();if(typeof Map<"u"&&i instanceof Map||typeof Set<"u"&&i instanceof Set)return Array.from(i.values());if(typeof i=="string")return i.split("");if(h(i)){for(var u=[],l=i.length,f=0;f<l;f++)u.push(i[f]);return u}u=[],l=0;for(f in i)u[l++]=i[f];return u}function th(i){if(i.na&&typeof i.na=="function")return i.na();if(!i.V||typeof i.V!="function"){if(typeof Map<"u"&&i instanceof Map)return Array.from(i.keys());if(!(typeof Set<"u"&&i instanceof Set)){if(h(i)||typeof i=="string"){var u=[];i=i.length;for(var l=0;l<i;l++)u.push(l);return u}u=[],l=0;for(const f in i)u[l++]=f;return u}}}function Uo(i,u){if(i.forEach&&typeof i.forEach=="function")i.forEach(u,void 0);else if(h(i)||typeof i=="string")Array.prototype.forEach.call(i,u,void 0);else for(var l=th(i),f=Zl(i),A=f.length,R=0;R<A;R++)u.call(void 0,f[R],l&&l[R],i)}var Bo=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function eh(i,u){if(i){i=i.split("&");for(var l=0;l<i.length;l++){var f=i[l].indexOf("="),A=null;if(0<=f){var R=i[l].substring(0,f);A=i[l].substring(f+1)}else R=i[l];u(R,A?decodeURIComponent(A.replace(/\+/g," ")):"")}}}function Ie(i){if(this.g=this.o=this.j="",this.s=null,this.m=this.l="",this.h=!1,i instanceof Ie){this.h=i.h,rr(this,i.j),this.o=i.o,this.g=i.g,sr(this,i.s),this.l=i.l;var u=i.i,l=new yn;l.i=u.i,u.g&&(l.g=new Map(u.g),l.h=u.h),qo(this,l),this.m=i.m}else i&&(u=String(i).match(Bo))?(this.h=!1,rr(this,u[1]||"",!0),this.o=gn(u[2]||""),this.g=gn(u[3]||"",!0),sr(this,u[4]),this.l=gn(u[5]||"",!0),qo(this,u[6]||"",!0),this.m=gn(u[7]||"")):(this.h=!1,this.i=new yn(null,this.h))}Ie.prototype.toString=function(){var i=[],u=this.j;u&&i.push(_n(u,jo,!0),":");var l=this.g;return(l||u=="file")&&(i.push("//"),(u=this.o)&&i.push(_n(u,jo,!0),"@"),i.push(encodeURIComponent(String(l)).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),l=this.s,l!=null&&i.push(":",String(l))),(l=this.l)&&(this.g&&l.charAt(0)!="/"&&i.push("/"),i.push(_n(l,l.charAt(0)=="/"?sh:rh,!0))),(l=this.i.toString())&&i.push("?",l),(l=this.m)&&i.push("#",_n(l,oh)),i.join("")};function Qt(i){return new Ie(i)}function rr(i,u,l){i.j=l?gn(u,!0):u,i.j&&(i.j=i.j.replace(/:$/,""))}function sr(i,u){if(u){if(u=Number(u),isNaN(u)||0>u)throw Error("Bad port number "+u);i.s=u}else i.s=null}function qo(i,u,l){u instanceof yn?(i.i=u,ah(i.i,i.h)):(l||(u=_n(u,ih)),i.i=new yn(u,i.h))}function Y(i,u,l){i.i.set(u,l)}function ir(i){return Y(i,"zx",Math.floor(2147483648*Math.random()).toString(36)+Math.abs(Math.floor(2147483648*Math.random())^Date.now()).toString(36)),i}function gn(i,u){return i?u?decodeURI(i.replace(/%25/g,"%2525")):decodeURIComponent(i):""}function _n(i,u,l){return typeof i=="string"?(i=encodeURI(i).replace(u,nh),l&&(i=i.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),i):null}function nh(i){return i=i.charCodeAt(0),"%"+(i>>4&15).toString(16)+(i&15).toString(16)}var jo=/[#\/\?@]/g,rh=/[#\?:]/g,sh=/[#\?]/g,ih=/[#\?@]/g,oh=/#/g;function yn(i,u){this.h=this.g=null,this.i=i||null,this.j=!!u}function ne(i){i.g||(i.g=new Map,i.h=0,i.i&&eh(i.i,function(u,l){i.add(decodeURIComponent(u.replace(/\+/g," ")),l)}))}n=yn.prototype,n.add=function(i,u){ne(this),this.i=null,i=Me(this,i);var l=this.g.get(i);return l||this.g.set(i,l=[]),l.push(u),this.h+=1,this};function $o(i,u){ne(i),u=Me(i,u),i.g.has(u)&&(i.i=null,i.h-=i.g.get(u).length,i.g.delete(u))}function zo(i,u){return ne(i),u=Me(i,u),i.g.has(u)}n.forEach=function(i,u){ne(this),this.g.forEach(function(l,f){l.forEach(function(A){i.call(u,A,f,this)},this)},this)},n.na=function(){ne(this);const i=Array.from(this.g.values()),u=Array.from(this.g.keys()),l=[];for(let f=0;f<u.length;f++){const A=i[f];for(let R=0;R<A.length;R++)l.push(u[f])}return l},n.V=function(i){ne(this);let u=[];if(typeof i=="string")zo(this,i)&&(u=u.concat(this.g.get(Me(this,i))));else{i=Array.from(this.g.values());for(let l=0;l<i.length;l++)u=u.concat(i[l])}return u},n.set=function(i,u){return ne(this),this.i=null,i=Me(this,i),zo(this,i)&&(this.h-=this.g.get(i).length),this.g.set(i,[u]),this.h+=1,this},n.get=function(i,u){return i?(i=this.V(i),0<i.length?String(i[0]):u):u};function Ho(i,u,l){$o(i,u),0<l.length&&(i.i=null,i.g.set(Me(i,u),N(l)),i.h+=l.length)}n.toString=function(){if(this.i)return this.i;if(!this.g)return"";const i=[],u=Array.from(this.g.keys());for(var l=0;l<u.length;l++){var f=u[l];const R=encodeURIComponent(String(f)),D=this.V(f);for(f=0;f<D.length;f++){var A=R;D[f]!==""&&(A+="="+encodeURIComponent(String(D[f]))),i.push(A)}}return this.i=i.join("&")};function Me(i,u){return u=String(u),i.j&&(u=u.toLowerCase()),u}function ah(i,u){u&&!i.j&&(ne(i),i.i=null,i.g.forEach(function(l,f){var A=f.toLowerCase();f!=A&&($o(this,f),Ho(this,A,l))},i)),i.j=u}function uh(i,u){const l=new pn;if(c.Image){const f=new Image;f.onload=S(re,l,"TestLoadImage: loaded",!0,u,f),f.onerror=S(re,l,"TestLoadImage: error",!1,u,f),f.onabort=S(re,l,"TestLoadImage: abort",!1,u,f),f.ontimeout=S(re,l,"TestLoadImage: timeout",!1,u,f),c.setTimeout(function(){f.ontimeout&&f.ontimeout()},1e4),f.src=i}else u(!1)}function ch(i,u){const l=new pn,f=new AbortController,A=setTimeout(()=>{f.abort(),re(l,"TestPingServer: timeout",!1,u)},1e4);fetch(i,{signal:f.signal}).then(R=>{clearTimeout(A),R.ok?re(l,"TestPingServer: ok",!0,u):re(l,"TestPingServer: server error",!1,u)}).catch(()=>{clearTimeout(A),re(l,"TestPingServer: error",!1,u)})}function re(i,u,l,f,A){try{A&&(A.onload=null,A.onerror=null,A.onabort=null,A.ontimeout=null),f(l)}catch{}}function lh(){this.g=new Gl}function hh(i,u,l){const f=l||"";try{Uo(i,function(A,R){let D=A;d(A)&&(D=Es(A)),u.push(f+R+"="+encodeURIComponent(D))})}catch(A){throw u.push(f+"type="+encodeURIComponent("_badmap")),A}}function or(i){this.l=i.Ub||null,this.j=i.eb||!1}b(or,Ts),or.prototype.g=function(){return new ar(this.l,this.j)},or.prototype.i=function(i){return function(){return i}}({});function ar(i,u){_t.call(this),this.D=i,this.o=u,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.u=new Headers,this.h=null,this.B="GET",this.A="",this.g=!1,this.v=this.j=this.l=null}b(ar,_t),n=ar.prototype,n.open=function(i,u){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.B=i,this.A=u,this.readyState=1,Tn(this)},n.send=function(i){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");this.g=!0;const u={headers:this.u,method:this.B,credentials:this.m,cache:void 0};i&&(u.body=i),(this.D||c).fetch(new Request(this.A,u)).then(this.Sa.bind(this),this.ga.bind(this))},n.abort=function(){this.response=this.responseText="",this.u=new Headers,this.status=0,this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),1<=this.readyState&&this.g&&this.readyState!=4&&(this.g=!1,En(this)),this.readyState=0},n.Sa=function(i){if(this.g&&(this.l=i,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=i.headers,this.readyState=2,Tn(this)),this.g&&(this.readyState=3,Tn(this),this.g)))if(this.responseType==="arraybuffer")i.arrayBuffer().then(this.Qa.bind(this),this.ga.bind(this));else if(typeof c.ReadableStream<"u"&&"body"in i){if(this.j=i.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.v=new TextDecoder;Go(this)}else i.text().then(this.Ra.bind(this),this.ga.bind(this))};function Go(i){i.j.read().then(i.Pa.bind(i)).catch(i.ga.bind(i))}n.Pa=function(i){if(this.g){if(this.o&&i.value)this.response.push(i.value);else if(!this.o){var u=i.value?i.value:new Uint8Array(0);(u=this.v.decode(u,{stream:!i.done}))&&(this.response=this.responseText+=u)}i.done?En(this):Tn(this),this.readyState==3&&Go(this)}},n.Ra=function(i){this.g&&(this.response=this.responseText=i,En(this))},n.Qa=function(i){this.g&&(this.response=i,En(this))},n.ga=function(){this.g&&En(this)};function En(i){i.readyState=4,i.l=null,i.j=null,i.v=null,Tn(i)}n.setRequestHeader=function(i,u){this.u.append(i,u)},n.getResponseHeader=function(i){return this.h&&this.h.get(i.toLowerCase())||""},n.getAllResponseHeaders=function(){if(!this.h)return"";const i=[],u=this.h.entries();for(var l=u.next();!l.done;)l=l.value,i.push(l[0]+": "+l[1]),l=u.next();return i.join(`\r
`)};function Tn(i){i.onreadystatechange&&i.onreadystatechange.call(i)}Object.defineProperty(ar.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(i){this.m=i?"include":"same-origin"}});function Ko(i){let u="";return st(i,function(l,f){u+=f,u+=":",u+=l,u+=`\r
`}),u}function Vs(i,u,l){t:{for(f in l){var f=!1;break t}f=!0}f||(l=Ko(l),typeof i=="string"?l!=null&&encodeURIComponent(String(l)):Y(i,u,l))}function tt(i){_t.call(this),this.headers=new Map,this.o=i||null,this.h=!1,this.v=this.g=null,this.D="",this.m=0,this.l="",this.j=this.B=this.u=this.A=!1,this.I=null,this.H="",this.J=!1}b(tt,_t);var dh=/^https?$/i,fh=["POST","PUT"];n=tt.prototype,n.Ha=function(i){this.J=i},n.ea=function(i,u,l,f){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+i);u=u?u.toUpperCase():"GET",this.D=i,this.l="",this.m=0,this.A=!1,this.h=!0,this.g=this.o?this.o.g():As.g(),this.v=this.o?Io(this.o):Io(As),this.g.onreadystatechange=E(this.Ea,this);try{this.B=!0,this.g.open(u,String(i),!0),this.B=!1}catch(R){Wo(this,R);return}if(i=l||"",l=new Map(this.headers),f)if(Object.getPrototypeOf(f)===Object.prototype)for(var A in f)l.set(A,f[A]);else if(typeof f.keys=="function"&&typeof f.get=="function")for(const R of f.keys())l.set(R,f.get(R));else throw Error("Unknown input type for opt_headers: "+String(f));f=Array.from(l.keys()).find(R=>R.toLowerCase()=="content-type"),A=c.FormData&&i instanceof c.FormData,!(0<=Array.prototype.indexOf.call(fh,u,void 0))||f||A||l.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[R,D]of l)this.g.setRequestHeader(R,D);this.H&&(this.g.responseType=this.H),"withCredentials"in this.g&&this.g.withCredentials!==this.J&&(this.g.withCredentials=this.J);try{Yo(this),this.u=!0,this.g.send(i),this.u=!1}catch(R){Wo(this,R)}};function Wo(i,u){i.h=!1,i.g&&(i.j=!0,i.g.abort(),i.j=!1),i.l=u,i.m=5,Qo(i),ur(i)}function Qo(i){i.A||(i.A=!0,At(i,"complete"),At(i,"error"))}n.abort=function(i){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.m=i||7,At(this,"complete"),At(this,"abort"),ur(this))},n.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),ur(this,!0)),tt.aa.N.call(this)},n.Ea=function(){this.s||(this.B||this.u||this.j?Xo(this):this.bb())},n.bb=function(){Xo(this)};function Xo(i){if(i.h&&typeof a<"u"&&(!i.v[1]||Xt(i)!=4||i.Z()!=2)){if(i.u&&Xt(i)==4)yo(i.Ea,0,i);else if(At(i,"readystatechange"),Xt(i)==4){i.h=!1;try{const D=i.Z();t:switch(D){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var u=!0;break t;default:u=!1}var l;if(!(l=u)){var f;if(f=D===0){var A=String(i.D).match(Bo)[1]||null;!A&&c.self&&c.self.location&&(A=c.self.location.protocol.slice(0,-1)),f=!dh.test(A?A.toLowerCase():"")}l=f}if(l)At(i,"complete"),At(i,"success");else{i.m=6;try{var R=2<Xt(i)?i.g.statusText:""}catch{R=""}i.l=R+" ["+i.Z()+"]",Qo(i)}}finally{ur(i)}}}}function ur(i,u){if(i.g){Yo(i);const l=i.g,f=i.v[0]?()=>{}:null;i.g=null,i.v=null,u||At(i,"ready");try{l.onreadystatechange=f}catch{}}}function Yo(i){i.I&&(c.clearTimeout(i.I),i.I=null)}n.isActive=function(){return!!this.g};function Xt(i){return i.g?i.g.readyState:0}n.Z=function(){try{return 2<Xt(this)?this.g.status:-1}catch{return-1}},n.oa=function(){try{return this.g?this.g.responseText:""}catch{return""}},n.Oa=function(i){if(this.g){var u=this.g.responseText;return i&&u.indexOf(i)==0&&(u=u.substring(i.length)),Hl(u)}};function Jo(i){try{if(!i.g)return null;if("response"in i.g)return i.g.response;switch(i.H){case"":case"text":return i.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in i.g)return i.g.mozResponseArrayBuffer}return null}catch{return null}}function ph(i){const u={};i=(i.g&&2<=Xt(i)&&i.g.getAllResponseHeaders()||"").split(`\r
`);for(let f=0;f<i.length;f++){if(F(i[f]))continue;var l=w(i[f]);const A=l[0];if(l=l[1],typeof l!="string")continue;l=l.trim();const R=u[A]||[];u[A]=R,R.push(l)}I(u,function(f){return f.join(", ")})}n.Ba=function(){return this.m},n.Ka=function(){return typeof this.l=="string"?this.l:String(this.l)};function wn(i,u,l){return l&&l.internalChannelParams&&l.internalChannelParams[i]||u}function Zo(i){this.Aa=0,this.i=[],this.j=new pn,this.ia=this.qa=this.I=this.W=this.g=this.ya=this.D=this.H=this.m=this.S=this.o=null,this.Ya=this.U=0,this.Va=wn("failFast",!1,i),this.F=this.C=this.u=this.s=this.l=null,this.X=!0,this.za=this.T=-1,this.Y=this.v=this.B=0,this.Ta=wn("baseRetryDelayMs",5e3,i),this.cb=wn("retryDelaySeedMs",1e4,i),this.Wa=wn("forwardChannelMaxRetries",2,i),this.wa=wn("forwardChannelRequestTimeoutMs",2e4,i),this.pa=i&&i.xmlHttpFactory||void 0,this.Xa=i&&i.Tb||void 0,this.Ca=i&&i.useFetchStreams||!1,this.L=void 0,this.J=i&&i.supportsCrossDomainXhr||!1,this.K="",this.h=new Oo(i&&i.concurrentRequestLimit),this.Da=new lh,this.P=i&&i.fastHandshake||!1,this.O=i&&i.encodeInitMessageHeaders||!1,this.P&&this.O&&(this.O=!1),this.Ua=i&&i.Rb||!1,i&&i.xa&&this.j.xa(),i&&i.forceLongPolling&&(this.X=!1),this.ba=!this.P&&this.X&&i&&i.detectBufferingProxy||!1,this.ja=void 0,i&&i.longPollingTimeout&&0<i.longPollingTimeout&&(this.ja=i.longPollingTimeout),this.ca=void 0,this.R=0,this.M=!1,this.ka=this.A=null}n=Zo.prototype,n.la=8,n.G=1,n.connect=function(i,u,l,f){vt(0),this.W=i,this.H=u||{},l&&f!==void 0&&(this.H.OSID=l,this.H.OAID=f),this.F=this.X,this.I=ua(this,null,this.W),lr(this)};function Ds(i){if(ta(i),i.G==3){var u=i.U++,l=Qt(i.I);if(Y(l,"SID",i.K),Y(l,"RID",u),Y(l,"TYPE","terminate"),In(i,l),u=new ee(i,i.j,u),u.L=2,u.v=ir(Qt(l)),l=!1,c.navigator&&c.navigator.sendBeacon)try{l=c.navigator.sendBeacon(u.v.toString(),"")}catch{}!l&&c.Image&&(new Image().src=u.v,l=!0),l||(u.g=ca(u.j,null),u.g.ea(u.v)),u.F=Date.now(),nr(u)}aa(i)}function cr(i){i.g&&(ks(i),i.g.cancel(),i.g=null)}function ta(i){cr(i),i.u&&(c.clearTimeout(i.u),i.u=null),hr(i),i.h.cancel(),i.s&&(typeof i.s=="number"&&c.clearTimeout(i.s),i.s=null)}function lr(i){if(!xo(i.h)&&!i.s){i.s=!0;var u=i.Ga;an||fo(),un||(an(),un=!0),hs.add(u,i),i.B=0}}function mh(i,u){return Mo(i.h)>=i.h.j-(i.s?1:0)?!1:i.s?(i.i=u.D.concat(i.i),!0):i.G==1||i.G==2||i.B>=(i.Va?0:i.Wa)?!1:(i.s=fn(E(i.Ga,i,u),oa(i,i.B)),i.B++,!0)}n.Ga=function(i){if(this.s)if(this.s=null,this.G==1){if(!i){this.U=Math.floor(1e5*Math.random()),i=this.U++;const A=new ee(this,this.j,i);let R=this.o;if(this.S&&(R?(R=m(R),T(R,this.S)):R=this.S),this.m!==null||this.O||(A.H=R,R=null),this.P)t:{for(var u=0,l=0;l<this.i.length;l++){e:{var f=this.i[l];if("__data__"in f.map&&(f=f.map.__data__,typeof f=="string")){f=f.length;break e}f=void 0}if(f===void 0)break;if(u+=f,4096<u){u=l;break t}if(u===4096||l===this.i.length-1){u=l+1;break t}}u=1e3}else u=1e3;u=na(this,A,u),l=Qt(this.I),Y(l,"RID",i),Y(l,"CVER",22),this.D&&Y(l,"X-HTTP-Session-Id",this.D),In(this,l),R&&(this.O?u="headers="+encodeURIComponent(String(Ko(R)))+"&"+u:this.m&&Vs(l,this.m,R)),bs(this.h,A),this.Ua&&Y(l,"TYPE","init"),this.P?(Y(l,"$req",u),Y(l,"SID","null"),A.T=!0,Rs(A,l,null)):Rs(A,l,u),this.G=2}}else this.G==3&&(i?ea(this,i):this.i.length==0||xo(this.h)||ea(this))};function ea(i,u){var l;u?l=u.l:l=i.U++;const f=Qt(i.I);Y(f,"SID",i.K),Y(f,"RID",l),Y(f,"AID",i.T),In(i,f),i.m&&i.o&&Vs(f,i.m,i.o),l=new ee(i,i.j,l,i.B+1),i.m===null&&(l.H=i.o),u&&(i.i=u.D.concat(i.i)),u=na(i,l,1e3),l.I=Math.round(.5*i.wa)+Math.round(.5*i.wa*Math.random()),bs(i.h,l),Rs(l,f,u)}function In(i,u){i.H&&st(i.H,function(l,f){Y(u,f,l)}),i.l&&Uo({},function(l,f){Y(u,f,l)})}function na(i,u,l){l=Math.min(i.i.length,l);var f=i.l?E(i.l.Na,i.l,i):null;t:{var A=i.i;let R=-1;for(;;){const D=["count="+l];R==-1?0<l?(R=A[0].g,D.push("ofs="+R)):R=0:D.push("ofs="+R);let Q=!0;for(let dt=0;dt<l;dt++){let K=A[dt].g;const yt=A[dt].map;if(K-=R,0>K)R=Math.max(0,A[dt].g-100),Q=!1;else try{hh(yt,D,"req"+K+"_")}catch{f&&f(yt)}}if(Q){f=D.join("&");break t}}}return i=i.i.splice(0,l),u.D=i,f}function ra(i){if(!i.g&&!i.u){i.Y=1;var u=i.Fa;an||fo(),un||(an(),un=!0),hs.add(u,i),i.v=0}}function Ns(i){return i.g||i.u||3<=i.v?!1:(i.Y++,i.u=fn(E(i.Fa,i),oa(i,i.v)),i.v++,!0)}n.Fa=function(){if(this.u=null,sa(this),this.ba&&!(this.M||this.g==null||0>=this.R)){var i=2*this.R;this.j.info("BP detection timer enabled: "+i),this.A=fn(E(this.ab,this),i)}},n.ab=function(){this.A&&(this.A=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.M=!0,vt(10),cr(this),sa(this))};function ks(i){i.A!=null&&(c.clearTimeout(i.A),i.A=null)}function sa(i){i.g=new ee(i,i.j,"rpc",i.Y),i.m===null&&(i.g.H=i.o),i.g.O=0;var u=Qt(i.qa);Y(u,"RID","rpc"),Y(u,"SID",i.K),Y(u,"AID",i.T),Y(u,"CI",i.F?"0":"1"),!i.F&&i.ja&&Y(u,"TO",i.ja),Y(u,"TYPE","xmlhttp"),In(i,u),i.m&&i.o&&Vs(u,i.m,i.o),i.L&&(i.g.I=i.L);var l=i.g;i=i.ia,l.L=1,l.v=ir(Qt(u)),l.m=null,l.P=!0,Do(l,i)}n.Za=function(){this.C!=null&&(this.C=null,cr(this),Ns(this),vt(19))};function hr(i){i.C!=null&&(c.clearTimeout(i.C),i.C=null)}function ia(i,u){var l=null;if(i.g==u){hr(i),ks(i),i.g=null;var f=2}else if(Ps(i.h,u))l=u.D,Lo(i.h,u),f=1;else return;if(i.G!=0){if(u.o)if(f==1){l=u.m?u.m.length:0,u=Date.now()-u.F;var A=i.B;f=Zn(),At(f,new Co(f,l)),lr(i)}else ra(i);else if(A=u.s,A==3||A==0&&0<u.X||!(f==1&&mh(i,u)||f==2&&Ns(i)))switch(l&&0<l.length&&(u=i.h,u.i=u.i.concat(l)),A){case 1:Ae(i,5);break;case 4:Ae(i,10);break;case 3:Ae(i,6);break;default:Ae(i,2)}}}function oa(i,u){let l=i.Ta+Math.floor(Math.random()*i.cb);return i.isActive()||(l*=2),l*u}function Ae(i,u){if(i.j.info("Error code "+u),u==2){var l=E(i.fb,i),f=i.Xa;const A=!f;f=new Ie(f||"//www.google.com/images/cleardot.gif"),c.location&&c.location.protocol=="http"||rr(f,"https"),ir(f),A?uh(f.toString(),l):ch(f.toString(),l)}else vt(2);i.G=0,i.l&&i.l.sa(u),aa(i),ta(i)}n.fb=function(i){i?(this.j.info("Successfully pinged google.com"),vt(2)):(this.j.info("Failed to ping google.com"),vt(1))};function aa(i){if(i.G=0,i.ka=[],i.l){const u=Fo(i.h);(u.length!=0||i.i.length!=0)&&(V(i.ka,u),V(i.ka,i.i),i.h.i.length=0,N(i.i),i.i.length=0),i.l.ra()}}function ua(i,u,l){var f=l instanceof Ie?Qt(l):new Ie(l);if(f.g!="")u&&(f.g=u+"."+f.g),sr(f,f.s);else{var A=c.location;f=A.protocol,u=u?u+"."+A.hostname:A.hostname,A=+A.port;var R=new Ie(null);f&&rr(R,f),u&&(R.g=u),A&&sr(R,A),l&&(R.l=l),f=R}return l=i.D,u=i.ya,l&&u&&Y(f,l,u),Y(f,"VER",i.la),In(i,f),f}function ca(i,u,l){if(u&&!i.J)throw Error("Can't create secondary domain capable XhrIo object.");return u=i.Ca&&!i.pa?new tt(new or({eb:l})):new tt(i.pa),u.Ha(i.J),u}n.isActive=function(){return!!this.l&&this.l.isActive(this)};function la(){}n=la.prototype,n.ua=function(){},n.ta=function(){},n.sa=function(){},n.ra=function(){},n.isActive=function(){return!0},n.Na=function(){};function dr(){}dr.prototype.g=function(i,u){return new Nt(i,u)};function Nt(i,u){_t.call(this),this.g=new Zo(u),this.l=i,this.h=u&&u.messageUrlParams||null,i=u&&u.messageHeaders||null,u&&u.clientProtocolHeaderRequired&&(i?i["X-Client-Protocol"]="webchannel":i={"X-Client-Protocol":"webchannel"}),this.g.o=i,i=u&&u.initMessageHeaders||null,u&&u.messageContentType&&(i?i["X-WebChannel-Content-Type"]=u.messageContentType:i={"X-WebChannel-Content-Type":u.messageContentType}),u&&u.va&&(i?i["X-WebChannel-Client-Profile"]=u.va:i={"X-WebChannel-Client-Profile":u.va}),this.g.S=i,(i=u&&u.Sb)&&!F(i)&&(this.g.m=i),this.v=u&&u.supportsCrossDomainXhr||!1,this.u=u&&u.sendRawJson||!1,(u=u&&u.httpSessionIdParam)&&!F(u)&&(this.g.D=u,i=this.h,i!==null&&u in i&&(i=this.h,u in i&&delete i[u])),this.j=new Le(this)}b(Nt,_t),Nt.prototype.m=function(){this.g.l=this.j,this.v&&(this.g.J=!0),this.g.connect(this.l,this.h||void 0)},Nt.prototype.close=function(){Ds(this.g)},Nt.prototype.o=function(i){var u=this.g;if(typeof i=="string"){var l={};l.__data__=i,i=l}else this.u&&(l={},l.__data__=Es(i),i=l);u.i.push(new Jl(u.Ya++,i)),u.G==3&&lr(u)},Nt.prototype.N=function(){this.g.l=null,delete this.j,Ds(this.g),delete this.g,Nt.aa.N.call(this)};function ha(i){ws.call(this),i.__headers__&&(this.headers=i.__headers__,this.statusCode=i.__status__,delete i.__headers__,delete i.__status__);var u=i.__sm__;if(u){t:{for(const l in u){i=l;break t}i=void 0}(this.i=i)&&(i=this.i,u=u!==null&&i in u?u[i]:void 0),this.data=u}else this.data=i}b(ha,ws);function da(){Is.call(this),this.status=1}b(da,Is);function Le(i){this.g=i}b(Le,la),Le.prototype.ua=function(){At(this.g,"a")},Le.prototype.ta=function(i){At(this.g,new ha(i))},Le.prototype.sa=function(i){At(this.g,new da)},Le.prototype.ra=function(){At(this.g,"b")},dr.prototype.createWebChannel=dr.prototype.g,Nt.prototype.send=Nt.prototype.o,Nt.prototype.open=Nt.prototype.m,Nt.prototype.close=Nt.prototype.close,$u=function(){return new dr},ju=function(){return Zn()},qu=Te,Ks={mb:0,pb:1,qb:2,Jb:3,Ob:4,Lb:5,Mb:6,Kb:7,Ib:8,Nb:9,PROXY:10,NOPROXY:11,Gb:12,Cb:13,Db:14,Bb:15,Eb:16,Fb:17,ib:18,hb:19,jb:20},tr.NO_ERROR=0,tr.TIMEOUT=8,tr.HTTP_ERROR=6,wr=tr,Po.COMPLETE="complete",Bu=Po,Ao.EventType=hn,hn.OPEN="a",hn.CLOSE="b",hn.ERROR="c",hn.MESSAGE="d",_t.prototype.listen=_t.prototype.K,vn=Ao,tt.prototype.listenOnce=tt.prototype.L,tt.prototype.getLastError=tt.prototype.Ka,tt.prototype.getLastErrorCode=tt.prototype.Ba,tt.prototype.getStatus=tt.prototype.Z,tt.prototype.getResponseJson=tt.prototype.Oa,tt.prototype.getResponseText=tt.prototype.oa,tt.prototype.send=tt.prototype.ea,tt.prototype.setWithCredentials=tt.prototype.Ha,Uu=tt}).apply(typeof pr<"u"?pr:typeof self<"u"?self:typeof window<"u"?window:{});const Ia="@firebase/firestore",Aa="4.9.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wt{constructor(t){this.uid=t}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(t){return t.uid===this.uid}}wt.UNAUTHENTICATED=new wt(null),wt.GOOGLE_CREDENTIALS=new wt("google-credentials-uid"),wt.FIRST_PARTY=new wt("first-party-uid"),wt.MOCK_USER=new wt("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Je="12.0.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ve=new ku("@firebase/firestore");function Ue(){return Ve.logLevel}function O(n,...t){if(Ve.logLevel<=G.DEBUG){const e=t.map(Ii);Ve.debug(`Firestore (${Je}): ${n}`,...e)}}function Jt(n,...t){if(Ve.logLevel<=G.ERROR){const e=t.map(Ii);Ve.error(`Firestore (${Je}): ${n}`,...e)}}function ze(n,...t){if(Ve.logLevel<=G.WARN){const e=t.map(Ii);Ve.warn(`Firestore (${Je}): ${n}`,...e)}}function Ii(n){if(typeof n=="string")return n;try{/**
* @license
* Copyright 2020 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/return function(e){return JSON.stringify(e)}(n)}catch{return n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function M(n,t,e){let r="Unexpected state";typeof t=="string"?r=t:e=t,zu(n,r,e)}function zu(n,t,e){let r=`FIRESTORE (${Je}) INTERNAL ASSERTION FAILED: ${t} (ID: ${n.toString(16)})`;if(e!==void 0)try{r+=" CONTEXT: "+JSON.stringify(e)}catch{r+=" CONTEXT: "+e}throw Jt(r),new Error(r)}function W(n,t,e,r){let s="Unexpected state";typeof e=="string"?s=e:r=e,n||zu(t,s,r)}function L(n,t){return n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const C={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class k extends ge{constructor(t,e){super(t,e),this.code=t,this.message=e,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qt{constructor(){this.promise=new Promise((t,e)=>{this.resolve=t,this.reject=e})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hu{constructor(t,e){this.user=e,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${t}`)}}class Ld{getToken(){return Promise.resolve(null)}invalidateToken(){}start(t,e){t.enqueueRetryable(()=>e(wt.UNAUTHENTICATED))}shutdown(){}}class Fd{constructor(t){this.token=t,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(t,e){this.changeListener=e,t.enqueueRetryable(()=>e(this.token.user))}shutdown(){this.changeListener=null}}class Ud{constructor(t){this.t=t,this.currentUser=wt.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(t,e){W(this.o===void 0,42304);let r=this.i;const s=h=>this.i!==r?(r=this.i,e(h)):Promise.resolve();let o=new qt;this.o=()=>{this.i++,this.currentUser=this.u(),o.resolve(),o=new qt,t.enqueueRetryable(()=>s(this.currentUser))};const a=()=>{const h=o;t.enqueueRetryable(async()=>{await h.promise,await s(this.currentUser)})},c=h=>{O("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=h,this.o&&(this.auth.addAuthTokenListener(this.o),a())};this.t.onInit(h=>c(h)),setTimeout(()=>{if(!this.auth){const h=this.t.getImmediate({optional:!0});h?c(h):(O("FirebaseAuthCredentialsProvider","Auth not yet detected"),o.resolve(),o=new qt)}},0),a()}getToken(){const t=this.i,e=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(e).then(r=>this.i!==t?(O("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):r?(W(typeof r.accessToken=="string",31837,{l:r}),new Hu(r.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const t=this.auth&&this.auth.getUid();return W(t===null||typeof t=="string",2055,{h:t}),new wt(t)}}class Bd{constructor(t,e,r){this.P=t,this.T=e,this.I=r,this.type="FirstParty",this.user=wt.FIRST_PARTY,this.A=new Map}R(){return this.I?this.I():null}get headers(){this.A.set("X-Goog-AuthUser",this.P);const t=this.R();return t&&this.A.set("Authorization",t),this.T&&this.A.set("X-Goog-Iam-Authorization-Token",this.T),this.A}}class qd{constructor(t,e,r){this.P=t,this.T=e,this.I=r}getToken(){return Promise.resolve(new Bd(this.P,this.T,this.I))}start(t,e){t.enqueueRetryable(()=>e(wt.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class va{constructor(t){this.value=t,this.type="AppCheck",this.headers=new Map,t&&t.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class jd{constructor(t,e){this.V=e,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,Ti(t)&&t.settings.appCheckToken&&(this.p=t.settings.appCheckToken)}start(t,e){W(this.o===void 0,3512);const r=o=>{o.error!=null&&O("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${o.error.message}`);const a=o.token!==this.m;return this.m=o.token,O("FirebaseAppCheckTokenProvider",`Received ${a?"new":"existing"} token.`),a?e(o.token):Promise.resolve()};this.o=o=>{t.enqueueRetryable(()=>r(o))};const s=o=>{O("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=o,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit(o=>s(o)),setTimeout(()=>{if(!this.appCheck){const o=this.V.getImmediate({optional:!0});o?s(o):O("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){if(this.p)return Promise.resolve(new va(this.p));const t=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(t).then(e=>e?(W(typeof e.token=="string",44558,{tokenResult:e}),this.m=e.token,new va(e.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $d(n){const t=typeof self<"u"&&(self.crypto||self.msCrypto),e=new Uint8Array(n);if(t&&typeof t.getRandomValues=="function")t.getRandomValues(e);else for(let r=0;r<n;r++)e[r]=Math.floor(256*Math.random());return e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ai{static newId(){const t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",e=62*Math.floor(4.129032258064516);let r="";for(;r.length<20;){const s=$d(40);for(let o=0;o<s.length;++o)r.length<20&&s[o]<e&&(r+=t.charAt(s[o]%62))}return r}}function j(n,t){return n<t?-1:n>t?1:0}function Ws(n,t){const e=Math.min(n.length,t.length);for(let r=0;r<e;r++){const s=n.charAt(r),o=t.charAt(r);if(s!==o)return Ms(s)===Ms(o)?j(s,o):Ms(s)?1:-1}return j(n.length,t.length)}const zd=55296,Hd=57343;function Ms(n){const t=n.charCodeAt(0);return t>=zd&&t<=Hd}function He(n,t,e){return n.length===t.length&&n.every((r,s)=>e(r,t[s]))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Qs="__name__";class Ft{constructor(t,e,r){e===void 0?e=0:e>t.length&&M(637,{offset:e,range:t.length}),r===void 0?r=t.length-e:r>t.length-e&&M(1746,{length:r,range:t.length-e}),this.segments=t,this.offset=e,this.len=r}get length(){return this.len}isEqual(t){return Ft.comparator(this,t)===0}child(t){const e=this.segments.slice(this.offset,this.limit());return t instanceof Ft?t.forEach(r=>{e.push(r)}):e.push(t),this.construct(e)}limit(){return this.offset+this.length}popFirst(t){return t=t===void 0?1:t,this.construct(this.segments,this.offset+t,this.length-t)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(t){return this.segments[this.offset+t]}isEmpty(){return this.length===0}isPrefixOf(t){if(t.length<this.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}isImmediateParentOf(t){if(this.length+1!==t.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}forEach(t){for(let e=this.offset,r=this.limit();e<r;e++)t(this.segments[e])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(t,e){const r=Math.min(t.length,e.length);for(let s=0;s<r;s++){const o=Ft.compareSegments(t.get(s),e.get(s));if(o!==0)return o}return j(t.length,e.length)}static compareSegments(t,e){const r=Ft.isNumericId(t),s=Ft.isNumericId(e);return r&&!s?-1:!r&&s?1:r&&s?Ft.extractNumericId(t).compare(Ft.extractNumericId(e)):Ws(t,e)}static isNumericId(t){return t.startsWith("__id")&&t.endsWith("__")}static extractNumericId(t){return ue.fromString(t.substring(4,t.length-2))}}class X extends Ft{construct(t,e,r){return new X(t,e,r)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...t){const e=[];for(const r of t){if(r.indexOf("//")>=0)throw new k(C.INVALID_ARGUMENT,`Invalid segment (${r}). Paths must not contain // in them.`);e.push(...r.split("/").filter(s=>s.length>0))}return new X(e)}static emptyPath(){return new X([])}}const Gd=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class pt extends Ft{construct(t,e,r){return new pt(t,e,r)}static isValidIdentifier(t){return Gd.test(t)}canonicalString(){return this.toArray().map(t=>(t=t.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),pt.isValidIdentifier(t)||(t="`"+t+"`"),t)).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===Qs}static keyField(){return new pt([Qs])}static fromServerFormat(t){const e=[];let r="",s=0;const o=()=>{if(r.length===0)throw new k(C.INVALID_ARGUMENT,`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);e.push(r),r=""};let a=!1;for(;s<t.length;){const c=t[s];if(c==="\\"){if(s+1===t.length)throw new k(C.INVALID_ARGUMENT,"Path has trailing escape character: "+t);const h=t[s+1];if(h!=="\\"&&h!=="."&&h!=="`")throw new k(C.INVALID_ARGUMENT,"Path has invalid escape sequence: "+t);r+=h,s+=2}else c==="`"?(a=!a,s++):c!=="."||a?(r+=c,s++):(o(),s++)}if(o(),a)throw new k(C.INVALID_ARGUMENT,"Unterminated ` in path: "+t);return new pt(e)}static emptyPath(){return new pt([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class x{constructor(t){this.path=t}static fromPath(t){return new x(X.fromString(t))}static fromName(t){return new x(X.fromString(t).popFirst(5))}static empty(){return new x(X.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(t){return this.path.length>=2&&this.path.get(this.path.length-2)===t}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(t){return t!==null&&X.comparator(this.path,t.path)===0}toString(){return this.path.toString()}static comparator(t,e){return X.comparator(t.path,e.path)}static isDocumentKey(t){return t.length%2==0}static fromSegments(t){return new x(new X(t.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gu(n,t,e){if(!e)throw new k(C.INVALID_ARGUMENT,`Function ${n}() cannot be called with an empty ${t}.`)}function Kd(n,t,e,r){if(t===!0&&r===!0)throw new k(C.INVALID_ARGUMENT,`${n} and ${e} cannot be used together.`)}function Ra(n){if(!x.isDocumentKey(n))throw new k(C.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${n} has ${n.length}.`)}function Sa(n){if(x.isDocumentKey(n))throw new k(C.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${n} has ${n.length}.`)}function Ku(n){return typeof n=="object"&&n!==null&&(Object.getPrototypeOf(n)===Object.prototype||Object.getPrototypeOf(n)===null)}function jr(n){if(n===void 0)return"undefined";if(n===null)return"null";if(typeof n=="string")return n.length>20&&(n=`${n.substring(0,20)}...`),JSON.stringify(n);if(typeof n=="number"||typeof n=="boolean")return""+n;if(typeof n=="object"){if(n instanceof Array)return"an array";{const t=function(r){return r.constructor?r.constructor.name:null}(n);return t?`a custom ${t} object`:"an object"}}return typeof n=="function"?"a function":M(12329,{type:typeof n})}function St(n,t){if("_delegate"in n&&(n=n._delegate),!(n instanceof t)){if(t.name===n.constructor.name)throw new k(C.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const e=jr(n);throw new k(C.INVALID_ARGUMENT,`Expected type '${t.name}', but it was: ${e}`)}}return n}/**
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
 */function ut(n,t){const e={typeString:n};return t&&(e.value=t),e}function $n(n,t){if(!Ku(n))throw new k(C.INVALID_ARGUMENT,"JSON must be an object");let e;for(const r in t)if(t[r]){const s=t[r].typeString,o="value"in t[r]?{value:t[r].value}:void 0;if(!(r in n)){e=`JSON missing required field: '${r}'`;break}const a=n[r];if(s&&typeof a!==s){e=`JSON field '${r}' must be a ${s}.`;break}if(o!==void 0&&a!==o.value){e=`Expected '${r}' field to equal '${o.value}'`;break}}if(e)throw new k(C.INVALID_ARGUMENT,e);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ca=-62135596800,Pa=1e6;class J{static now(){return J.fromMillis(Date.now())}static fromDate(t){return J.fromMillis(t.getTime())}static fromMillis(t){const e=Math.floor(t/1e3),r=Math.floor((t-1e3*e)*Pa);return new J(e,r)}constructor(t,e){if(this.seconds=t,this.nanoseconds=e,e<0)throw new k(C.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(e>=1e9)throw new k(C.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(t<Ca)throw new k(C.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t);if(t>=253402300800)throw new k(C.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/Pa}_compareTo(t){return this.seconds===t.seconds?j(this.nanoseconds,t.nanoseconds):j(this.seconds,t.seconds)}isEqual(t){return t.seconds===this.seconds&&t.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:J._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(t){if($n(t,J._jsonSchema))return new J(t.seconds,t.nanoseconds)}valueOf(){const t=this.seconds-Ca;return String(t).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}J._jsonSchemaVersion="firestore/timestamp/1.0",J._jsonSchema={type:ut("string",J._jsonSchemaVersion),seconds:ut("number"),nanoseconds:ut("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class U{static fromTimestamp(t){return new U(t)}static min(){return new U(new J(0,0))}static max(){return new U(new J(253402300799,999999999))}constructor(t){this.timestamp=t}compareTo(t){return this.timestamp._compareTo(t.timestamp)}isEqual(t){return this.timestamp.isEqual(t.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
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
 */const xn=-1;function Wd(n,t){const e=n.toTimestamp().seconds,r=n.toTimestamp().nanoseconds+1,s=U.fromTimestamp(r===1e9?new J(e+1,0):new J(e,r));return new le(s,x.empty(),t)}function Qd(n){return new le(n.readTime,n.key,xn)}class le{constructor(t,e,r){this.readTime=t,this.documentKey=e,this.largestBatchId=r}static min(){return new le(U.min(),x.empty(),xn)}static max(){return new le(U.max(),x.empty(),xn)}}function Xd(n,t){let e=n.readTime.compareTo(t.readTime);return e!==0?e:(e=x.comparator(n.documentKey,t.documentKey),e!==0?e:j(n.largestBatchId,t.largestBatchId))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yd="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class Jd{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(t){this.onCommittedListeners.push(t)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(t=>t())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ze(n){if(n.code!==C.FAILED_PRECONDITION||n.message!==Yd)throw n;O("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class P{constructor(t){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,t(e=>{this.isDone=!0,this.result=e,this.nextCallback&&this.nextCallback(e)},e=>{this.isDone=!0,this.error=e,this.catchCallback&&this.catchCallback(e)})}catch(t){return this.next(void 0,t)}next(t,e){return this.callbackAttached&&M(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(e,this.error):this.wrapSuccess(t,this.result):new P((r,s)=>{this.nextCallback=o=>{this.wrapSuccess(t,o).next(r,s)},this.catchCallback=o=>{this.wrapFailure(e,o).next(r,s)}})}toPromise(){return new Promise((t,e)=>{this.next(t,e)})}wrapUserFunction(t){try{const e=t();return e instanceof P?e:P.resolve(e)}catch(e){return P.reject(e)}}wrapSuccess(t,e){return t?this.wrapUserFunction(()=>t(e)):P.resolve(e)}wrapFailure(t,e){return t?this.wrapUserFunction(()=>t(e)):P.reject(e)}static resolve(t){return new P((e,r)=>{e(t)})}static reject(t){return new P((e,r)=>{r(t)})}static waitFor(t){return new P((e,r)=>{let s=0,o=0,a=!1;t.forEach(c=>{++s,c.next(()=>{++o,a&&o===s&&e()},h=>r(h))}),a=!0,o===s&&e()})}static or(t){let e=P.resolve(!1);for(const r of t)e=e.next(s=>s?P.resolve(s):r());return e}static forEach(t,e){const r=[];return t.forEach((s,o)=>{r.push(e.call(this,s,o))}),this.waitFor(r)}static mapArray(t,e){return new P((r,s)=>{const o=t.length,a=new Array(o);let c=0;for(let h=0;h<o;h++){const d=h;e(t[d]).next(p=>{a[d]=p,++c,c===o&&r(a)},p=>s(p))}})}static doWhile(t,e){return new P((r,s)=>{const o=()=>{t()===!0?e().next(()=>{o()},s):r()};o()})}}function Zd(n){const t=n.match(/Android ([\d.]+)/i),e=t?t[1].split(".").slice(0,2).join("."):"-1";return Number(e)}function tn(n){return n.name==="IndexedDbTransactionError"}/**
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
 */class $r{constructor(t,e){this.previousValue=t,e&&(e.sequenceNumberHandler=r=>this.ae(r),this.ue=r=>e.writeSequenceNumber(r))}ae(t){return this.previousValue=Math.max(t,this.previousValue),this.previousValue}next(){const t=++this.previousValue;return this.ue&&this.ue(t),t}}$r.ce=-1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vi=-1;function zr(n){return n==null}function Vr(n){return n===0&&1/n==-1/0}function tf(n){return typeof n=="number"&&Number.isInteger(n)&&!Vr(n)&&n<=Number.MAX_SAFE_INTEGER&&n>=Number.MIN_SAFE_INTEGER}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Wu="";function ef(n){let t="";for(let e=0;e<n.length;e++)t.length>0&&(t=ba(t)),t=nf(n.get(e),t);return ba(t)}function nf(n,t){let e=t;const r=n.length;for(let s=0;s<r;s++){const o=n.charAt(s);switch(o){case"\0":e+="";break;case Wu:e+="";break;default:e+=o}}return e}function ba(n){return n+Wu+""}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Va(n){let t=0;for(const e in n)Object.prototype.hasOwnProperty.call(n,e)&&t++;return t}function _e(n,t){for(const e in n)Object.prototype.hasOwnProperty.call(n,e)&&t(e,n[e])}function rf(n,t){const e=[];for(const r in n)Object.prototype.hasOwnProperty.call(n,r)&&e.push(t(n[r],r,n));return e}function Qu(n){for(const t in n)if(Object.prototype.hasOwnProperty.call(n,t))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Z{constructor(t,e){this.comparator=t,this.root=e||ft.EMPTY}insert(t,e){return new Z(this.comparator,this.root.insert(t,e,this.comparator).copy(null,null,ft.BLACK,null,null))}remove(t){return new Z(this.comparator,this.root.remove(t,this.comparator).copy(null,null,ft.BLACK,null,null))}get(t){let e=this.root;for(;!e.isEmpty();){const r=this.comparator(t,e.key);if(r===0)return e.value;r<0?e=e.left:r>0&&(e=e.right)}return null}indexOf(t){let e=0,r=this.root;for(;!r.isEmpty();){const s=this.comparator(t,r.key);if(s===0)return e+r.left.size;s<0?r=r.left:(e+=r.left.size+1,r=r.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(t){return this.root.inorderTraversal(t)}forEach(t){this.inorderTraversal((e,r)=>(t(e,r),!1))}toString(){const t=[];return this.inorderTraversal((e,r)=>(t.push(`${e}:${r}`),!1)),`{${t.join(", ")}}`}reverseTraversal(t){return this.root.reverseTraversal(t)}getIterator(){return new mr(this.root,null,this.comparator,!1)}getIteratorFrom(t){return new mr(this.root,t,this.comparator,!1)}getReverseIterator(){return new mr(this.root,null,this.comparator,!0)}getReverseIteratorFrom(t){return new mr(this.root,t,this.comparator,!0)}}class mr{constructor(t,e,r,s){this.isReverse=s,this.nodeStack=[];let o=1;for(;!t.isEmpty();)if(o=e?r(t.key,e):1,e&&s&&(o*=-1),o<0)t=this.isReverse?t.left:t.right;else{if(o===0){this.nodeStack.push(t);break}this.nodeStack.push(t),t=this.isReverse?t.right:t.left}}getNext(){let t=this.nodeStack.pop();const e={key:t.key,value:t.value};if(this.isReverse)for(t=t.left;!t.isEmpty();)this.nodeStack.push(t),t=t.right;else for(t=t.right;!t.isEmpty();)this.nodeStack.push(t),t=t.left;return e}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const t=this.nodeStack[this.nodeStack.length-1];return{key:t.key,value:t.value}}}class ft{constructor(t,e,r,s,o){this.key=t,this.value=e,this.color=r??ft.RED,this.left=s??ft.EMPTY,this.right=o??ft.EMPTY,this.size=this.left.size+1+this.right.size}copy(t,e,r,s,o){return new ft(t??this.key,e??this.value,r??this.color,s??this.left,o??this.right)}isEmpty(){return!1}inorderTraversal(t){return this.left.inorderTraversal(t)||t(this.key,this.value)||this.right.inorderTraversal(t)}reverseTraversal(t){return this.right.reverseTraversal(t)||t(this.key,this.value)||this.left.reverseTraversal(t)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(t,e,r){let s=this;const o=r(t,s.key);return s=o<0?s.copy(null,null,null,s.left.insert(t,e,r),null):o===0?s.copy(null,e,null,null,null):s.copy(null,null,null,null,s.right.insert(t,e,r)),s.fixUp()}removeMin(){if(this.left.isEmpty())return ft.EMPTY;let t=this;return t.left.isRed()||t.left.left.isRed()||(t=t.moveRedLeft()),t=t.copy(null,null,null,t.left.removeMin(),null),t.fixUp()}remove(t,e){let r,s=this;if(e(t,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(t,e),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),e(t,s.key)===0){if(s.right.isEmpty())return ft.EMPTY;r=s.right.min(),s=s.copy(r.key,r.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(t,e))}return s.fixUp()}isRed(){return this.color}fixUp(){let t=this;return t.right.isRed()&&!t.left.isRed()&&(t=t.rotateLeft()),t.left.isRed()&&t.left.left.isRed()&&(t=t.rotateRight()),t.left.isRed()&&t.right.isRed()&&(t=t.colorFlip()),t}moveRedLeft(){let t=this.colorFlip();return t.right.left.isRed()&&(t=t.copy(null,null,null,null,t.right.rotateRight()),t=t.rotateLeft(),t=t.colorFlip()),t}moveRedRight(){let t=this.colorFlip();return t.left.left.isRed()&&(t=t.rotateRight(),t=t.colorFlip()),t}rotateLeft(){const t=this.copy(null,null,ft.RED,null,this.right.left);return this.right.copy(null,null,this.color,t,null)}rotateRight(){const t=this.copy(null,null,ft.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,t)}colorFlip(){const t=this.left.copy(null,null,!this.left.color,null,null),e=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,t,e)}checkMaxDepth(){const t=this.check();return Math.pow(2,t)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw M(43730,{key:this.key,value:this.value});if(this.right.isRed())throw M(14113,{key:this.key,value:this.value});const t=this.left.check();if(t!==this.right.check())throw M(27949);return t+(this.isRed()?0:1)}}ft.EMPTY=null,ft.RED=!0,ft.BLACK=!1;ft.EMPTY=new class{constructor(){this.size=0}get key(){throw M(57766)}get value(){throw M(16141)}get color(){throw M(16727)}get left(){throw M(29726)}get right(){throw M(36894)}copy(t,e,r,s,o){return this}insert(t,e,r){return new ft(t,e)}remove(t,e){return this}isEmpty(){return!0}inorderTraversal(t){return!1}reverseTraversal(t){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lt{constructor(t){this.comparator=t,this.data=new Z(this.comparator)}has(t){return this.data.get(t)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(t){return this.data.indexOf(t)}forEach(t){this.data.inorderTraversal((e,r)=>(t(e),!1))}forEachInRange(t,e){const r=this.data.getIteratorFrom(t[0]);for(;r.hasNext();){const s=r.getNext();if(this.comparator(s.key,t[1])>=0)return;e(s.key)}}forEachWhile(t,e){let r;for(r=e!==void 0?this.data.getIteratorFrom(e):this.data.getIterator();r.hasNext();)if(!t(r.getNext().key))return}firstAfterOrEqual(t){const e=this.data.getIteratorFrom(t);return e.hasNext()?e.getNext().key:null}getIterator(){return new Da(this.data.getIterator())}getIteratorFrom(t){return new Da(this.data.getIteratorFrom(t))}add(t){return this.copy(this.data.remove(t).insert(t,!0))}delete(t){return this.has(t)?this.copy(this.data.remove(t)):this}isEmpty(){return this.data.isEmpty()}unionWith(t){let e=this;return e.size<t.size&&(e=t,t=this),t.forEach(r=>{e=e.add(r)}),e}isEqual(t){if(!(t instanceof lt)||this.size!==t.size)return!1;const e=this.data.getIterator(),r=t.data.getIterator();for(;e.hasNext();){const s=e.getNext().key,o=r.getNext().key;if(this.comparator(s,o)!==0)return!1}return!0}toArray(){const t=[];return this.forEach(e=>{t.push(e)}),t}toString(){const t=[];return this.forEach(e=>t.push(e)),"SortedSet("+t.toString()+")"}copy(t){const e=new lt(this.comparator);return e.data=t,e}}class Da{constructor(t){this.iter=t}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kt{constructor(t){this.fields=t,t.sort(pt.comparator)}static empty(){return new kt([])}unionWith(t){let e=new lt(pt.comparator);for(const r of this.fields)e=e.add(r);for(const r of t)e=e.add(r);return new kt(e.toArray())}covers(t){for(const e of this.fields)if(e.isPrefixOf(t))return!0;return!1}isEqual(t){return He(this.fields,t.fields,(e,r)=>e.isEqual(r))}}/**
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
 */class Xu extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mt{constructor(t){this.binaryString=t}static fromBase64String(t){const e=function(s){try{return atob(s)}catch(o){throw typeof DOMException<"u"&&o instanceof DOMException?new Xu("Invalid base64 string: "+o):o}}(t);return new mt(e)}static fromUint8Array(t){const e=function(s){let o="";for(let a=0;a<s.length;++a)o+=String.fromCharCode(s[a]);return o}(t);return new mt(e)}[Symbol.iterator](){let t=0;return{next:()=>t<this.binaryString.length?{value:this.binaryString.charCodeAt(t++),done:!1}:{value:void 0,done:!0}}}toBase64(){return function(e){return btoa(e)}(this.binaryString)}toUint8Array(){return function(e){const r=new Uint8Array(e.length);for(let s=0;s<e.length;s++)r[s]=e.charCodeAt(s);return r}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(t){return j(this.binaryString,t.binaryString)}isEqual(t){return this.binaryString===t.binaryString}}mt.EMPTY_BYTE_STRING=new mt("");const sf=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function he(n){if(W(!!n,39018),typeof n=="string"){let t=0;const e=sf.exec(n);if(W(!!e,46558,{timestamp:n}),e[1]){let s=e[1];s=(s+"000000000").substr(0,9),t=Number(s)}const r=new Date(n);return{seconds:Math.floor(r.getTime()/1e3),nanos:t}}return{seconds:it(n.seconds),nanos:it(n.nanos)}}function it(n){return typeof n=="number"?n:typeof n=="string"?Number(n):0}function de(n){return typeof n=="string"?mt.fromBase64String(n):mt.fromUint8Array(n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yu="server_timestamp",Ju="__type__",Zu="__previous_value__",tc="__local_write_time__";function Ri(n){var e,r;return((r=(((e=n==null?void 0:n.mapValue)==null?void 0:e.fields)||{})[Ju])==null?void 0:r.stringValue)===Yu}function Hr(n){const t=n.mapValue.fields[Zu];return Ri(t)?Hr(t):t}function Mn(n){const t=he(n.mapValue.fields[tc].timestampValue);return new J(t.seconds,t.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class of{constructor(t,e,r,s,o,a,c,h,d,p){this.databaseId=t,this.appId=e,this.persistenceKey=r,this.host=s,this.ssl=o,this.forceLongPolling=a,this.autoDetectLongPolling=c,this.longPollingOptions=h,this.useFetchStreams=d,this.isUsingEmulator=p}}const Xs="(default)";class Ln{constructor(t,e){this.projectId=t,this.database=e||Xs}static empty(){return new Ln("","")}get isDefaultDatabase(){return this.database===Xs}isEqual(t){return t instanceof Ln&&t.projectId===this.projectId&&t.database===this.database}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ec="__type__",af="__max__",gr={mapValue:{}},nc="__vector__",Dr="value";function fe(n){return"nullValue"in n?0:"booleanValue"in n?1:"integerValue"in n||"doubleValue"in n?2:"timestampValue"in n?3:"stringValue"in n?5:"bytesValue"in n?6:"referenceValue"in n?7:"geoPointValue"in n?8:"arrayValue"in n?9:"mapValue"in n?Ri(n)?4:cf(n)?9007199254740991:uf(n)?10:11:M(28295,{value:n})}function Gt(n,t){if(n===t)return!0;const e=fe(n);if(e!==fe(t))return!1;switch(e){case 0:case 9007199254740991:return!0;case 1:return n.booleanValue===t.booleanValue;case 4:return Mn(n).isEqual(Mn(t));case 3:return function(s,o){if(typeof s.timestampValue=="string"&&typeof o.timestampValue=="string"&&s.timestampValue.length===o.timestampValue.length)return s.timestampValue===o.timestampValue;const a=he(s.timestampValue),c=he(o.timestampValue);return a.seconds===c.seconds&&a.nanos===c.nanos}(n,t);case 5:return n.stringValue===t.stringValue;case 6:return function(s,o){return de(s.bytesValue).isEqual(de(o.bytesValue))}(n,t);case 7:return n.referenceValue===t.referenceValue;case 8:return function(s,o){return it(s.geoPointValue.latitude)===it(o.geoPointValue.latitude)&&it(s.geoPointValue.longitude)===it(o.geoPointValue.longitude)}(n,t);case 2:return function(s,o){if("integerValue"in s&&"integerValue"in o)return it(s.integerValue)===it(o.integerValue);if("doubleValue"in s&&"doubleValue"in o){const a=it(s.doubleValue),c=it(o.doubleValue);return a===c?Vr(a)===Vr(c):isNaN(a)&&isNaN(c)}return!1}(n,t);case 9:return He(n.arrayValue.values||[],t.arrayValue.values||[],Gt);case 10:case 11:return function(s,o){const a=s.mapValue.fields||{},c=o.mapValue.fields||{};if(Va(a)!==Va(c))return!1;for(const h in a)if(a.hasOwnProperty(h)&&(c[h]===void 0||!Gt(a[h],c[h])))return!1;return!0}(n,t);default:return M(52216,{left:n})}}function Fn(n,t){return(n.values||[]).find(e=>Gt(e,t))!==void 0}function Ge(n,t){if(n===t)return 0;const e=fe(n),r=fe(t);if(e!==r)return j(e,r);switch(e){case 0:case 9007199254740991:return 0;case 1:return j(n.booleanValue,t.booleanValue);case 2:return function(o,a){const c=it(o.integerValue||o.doubleValue),h=it(a.integerValue||a.doubleValue);return c<h?-1:c>h?1:c===h?0:isNaN(c)?isNaN(h)?0:-1:1}(n,t);case 3:return Na(n.timestampValue,t.timestampValue);case 4:return Na(Mn(n),Mn(t));case 5:return Ws(n.stringValue,t.stringValue);case 6:return function(o,a){const c=de(o),h=de(a);return c.compareTo(h)}(n.bytesValue,t.bytesValue);case 7:return function(o,a){const c=o.split("/"),h=a.split("/");for(let d=0;d<c.length&&d<h.length;d++){const p=j(c[d],h[d]);if(p!==0)return p}return j(c.length,h.length)}(n.referenceValue,t.referenceValue);case 8:return function(o,a){const c=j(it(o.latitude),it(a.latitude));return c!==0?c:j(it(o.longitude),it(a.longitude))}(n.geoPointValue,t.geoPointValue);case 9:return ka(n.arrayValue,t.arrayValue);case 10:return function(o,a){var E,S,b,N;const c=o.fields||{},h=a.fields||{},d=(E=c[Dr])==null?void 0:E.arrayValue,p=(S=h[Dr])==null?void 0:S.arrayValue,y=j(((b=d==null?void 0:d.values)==null?void 0:b.length)||0,((N=p==null?void 0:p.values)==null?void 0:N.length)||0);return y!==0?y:ka(d,p)}(n.mapValue,t.mapValue);case 11:return function(o,a){if(o===gr.mapValue&&a===gr.mapValue)return 0;if(o===gr.mapValue)return 1;if(a===gr.mapValue)return-1;const c=o.fields||{},h=Object.keys(c),d=a.fields||{},p=Object.keys(d);h.sort(),p.sort();for(let y=0;y<h.length&&y<p.length;++y){const E=Ws(h[y],p[y]);if(E!==0)return E;const S=Ge(c[h[y]],d[p[y]]);if(S!==0)return S}return j(h.length,p.length)}(n.mapValue,t.mapValue);default:throw M(23264,{he:e})}}function Na(n,t){if(typeof n=="string"&&typeof t=="string"&&n.length===t.length)return j(n,t);const e=he(n),r=he(t),s=j(e.seconds,r.seconds);return s!==0?s:j(e.nanos,r.nanos)}function ka(n,t){const e=n.values||[],r=t.values||[];for(let s=0;s<e.length&&s<r.length;++s){const o=Ge(e[s],r[s]);if(o)return o}return j(e.length,r.length)}function Ke(n){return Ys(n)}function Ys(n){return"nullValue"in n?"null":"booleanValue"in n?""+n.booleanValue:"integerValue"in n?""+n.integerValue:"doubleValue"in n?""+n.doubleValue:"timestampValue"in n?function(e){const r=he(e);return`time(${r.seconds},${r.nanos})`}(n.timestampValue):"stringValue"in n?n.stringValue:"bytesValue"in n?function(e){return de(e).toBase64()}(n.bytesValue):"referenceValue"in n?function(e){return x.fromName(e).toString()}(n.referenceValue):"geoPointValue"in n?function(e){return`geo(${e.latitude},${e.longitude})`}(n.geoPointValue):"arrayValue"in n?function(e){let r="[",s=!0;for(const o of e.values||[])s?s=!1:r+=",",r+=Ys(o);return r+"]"}(n.arrayValue):"mapValue"in n?function(e){const r=Object.keys(e.fields||{}).sort();let s="{",o=!0;for(const a of r)o?o=!1:s+=",",s+=`${a}:${Ys(e.fields[a])}`;return s+"}"}(n.mapValue):M(61005,{value:n})}function Ir(n){switch(fe(n)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const t=Hr(n);return t?16+Ir(t):16;case 5:return 2*n.stringValue.length;case 6:return de(n.bytesValue).approximateByteSize();case 7:return n.referenceValue.length;case 9:return function(r){return(r.values||[]).reduce((s,o)=>s+Ir(o),0)}(n.arrayValue);case 10:case 11:return function(r){let s=0;return _e(r.fields,(o,a)=>{s+=o.length+Ir(a)}),s}(n.mapValue);default:throw M(13486,{value:n})}}function Oa(n,t){return{referenceValue:`projects/${n.projectId}/databases/${n.database}/documents/${t.path.canonicalString()}`}}function Js(n){return!!n&&"integerValue"in n}function Si(n){return!!n&&"arrayValue"in n}function xa(n){return!!n&&"nullValue"in n}function Ma(n){return!!n&&"doubleValue"in n&&isNaN(Number(n.doubleValue))}function Ar(n){return!!n&&"mapValue"in n}function uf(n){var e,r;return((r=(((e=n==null?void 0:n.mapValue)==null?void 0:e.fields)||{})[ec])==null?void 0:r.stringValue)===nc}function bn(n){if(n.geoPointValue)return{geoPointValue:{...n.geoPointValue}};if(n.timestampValue&&typeof n.timestampValue=="object")return{timestampValue:{...n.timestampValue}};if(n.mapValue){const t={mapValue:{fields:{}}};return _e(n.mapValue.fields,(e,r)=>t.mapValue.fields[e]=bn(r)),t}if(n.arrayValue){const t={arrayValue:{values:[]}};for(let e=0;e<(n.arrayValue.values||[]).length;++e)t.arrayValue.values[e]=bn(n.arrayValue.values[e]);return t}return{...n}}function cf(n){return(((n.mapValue||{}).fields||{}).__type__||{}).stringValue===af}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bt{constructor(t){this.value=t}static empty(){return new bt({mapValue:{}})}field(t){if(t.isEmpty())return this.value;{let e=this.value;for(let r=0;r<t.length-1;++r)if(e=(e.mapValue.fields||{})[t.get(r)],!Ar(e))return null;return e=(e.mapValue.fields||{})[t.lastSegment()],e||null}}set(t,e){this.getFieldsMap(t.popLast())[t.lastSegment()]=bn(e)}setAll(t){let e=pt.emptyPath(),r={},s=[];t.forEach((a,c)=>{if(!e.isImmediateParentOf(c)){const h=this.getFieldsMap(e);this.applyChanges(h,r,s),r={},s=[],e=c.popLast()}a?r[c.lastSegment()]=bn(a):s.push(c.lastSegment())});const o=this.getFieldsMap(e);this.applyChanges(o,r,s)}delete(t){const e=this.field(t.popLast());Ar(e)&&e.mapValue.fields&&delete e.mapValue.fields[t.lastSegment()]}isEqual(t){return Gt(this.value,t.value)}getFieldsMap(t){let e=this.value;e.mapValue.fields||(e.mapValue={fields:{}});for(let r=0;r<t.length;++r){let s=e.mapValue.fields[t.get(r)];Ar(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},e.mapValue.fields[t.get(r)]=s),e=s}return e.mapValue.fields}applyChanges(t,e,r){_e(e,(s,o)=>t[s]=o);for(const s of r)delete t[s]}clone(){return new bt(bn(this.value))}}function rc(n){const t=[];return _e(n.fields,(e,r)=>{const s=new pt([e]);if(Ar(r)){const o=rc(r.mapValue).fields;if(o.length===0)t.push(s);else for(const a of o)t.push(s.child(a))}else t.push(s)}),new kt(t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class It{constructor(t,e,r,s,o,a,c){this.key=t,this.documentType=e,this.version=r,this.readTime=s,this.createTime=o,this.data=a,this.documentState=c}static newInvalidDocument(t){return new It(t,0,U.min(),U.min(),U.min(),bt.empty(),0)}static newFoundDocument(t,e,r,s){return new It(t,1,e,U.min(),r,s,0)}static newNoDocument(t,e){return new It(t,2,e,U.min(),U.min(),bt.empty(),0)}static newUnknownDocument(t,e){return new It(t,3,e,U.min(),U.min(),bt.empty(),2)}convertToFoundDocument(t,e){return!this.createTime.isEqual(U.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=t),this.version=t,this.documentType=1,this.data=e,this.documentState=0,this}convertToNoDocument(t){return this.version=t,this.documentType=2,this.data=bt.empty(),this.documentState=0,this}convertToUnknownDocument(t){return this.version=t,this.documentType=3,this.data=bt.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=U.min(),this}setReadTime(t){return this.readTime=t,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(t){return t instanceof It&&this.key.isEqual(t.key)&&this.version.isEqual(t.version)&&this.documentType===t.documentType&&this.documentState===t.documentState&&this.data.isEqual(t.data)}mutableCopy(){return new It(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
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
 */class Nr{constructor(t,e){this.position=t,this.inclusive=e}}function La(n,t,e){let r=0;for(let s=0;s<n.position.length;s++){const o=t[s],a=n.position[s];if(o.field.isKeyField()?r=x.comparator(x.fromName(a.referenceValue),e.key):r=Ge(a,e.data.field(o.field)),o.dir==="desc"&&(r*=-1),r!==0)break}return r}function Fa(n,t){if(n===null)return t===null;if(t===null||n.inclusive!==t.inclusive||n.position.length!==t.position.length)return!1;for(let e=0;e<n.position.length;e++)if(!Gt(n.position[e],t.position[e]))return!1;return!0}/**
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
 */class Un{constructor(t,e="asc"){this.field=t,this.dir=e}}function lf(n,t){return n.dir===t.dir&&n.field.isEqual(t.field)}/**
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
 */class sc{}class at extends sc{constructor(t,e,r){super(),this.field=t,this.op=e,this.value=r}static create(t,e,r){return t.isKeyField()?e==="in"||e==="not-in"?this.createKeyFieldInFilter(t,e,r):new df(t,e,r):e==="array-contains"?new mf(t,r):e==="in"?new gf(t,r):e==="not-in"?new _f(t,r):e==="array-contains-any"?new yf(t,r):new at(t,e,r)}static createKeyFieldInFilter(t,e,r){return e==="in"?new ff(t,r):new pf(t,r)}matches(t){const e=t.data.field(this.field);return this.op==="!="?e!==null&&e.nullValue===void 0&&this.matchesComparison(Ge(e,this.value)):e!==null&&fe(this.value)===fe(e)&&this.matchesComparison(Ge(e,this.value))}matchesComparison(t){switch(this.op){case"<":return t<0;case"<=":return t<=0;case"==":return t===0;case"!=":return t!==0;case">":return t>0;case">=":return t>=0;default:return M(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class Lt extends sc{constructor(t,e){super(),this.filters=t,this.op=e,this.Pe=null}static create(t,e){return new Lt(t,e)}matches(t){return ic(this)?this.filters.find(e=>!e.matches(t))===void 0:this.filters.find(e=>e.matches(t))!==void 0}getFlattenedFilters(){return this.Pe!==null||(this.Pe=this.filters.reduce((t,e)=>t.concat(e.getFlattenedFilters()),[])),this.Pe}getFilters(){return Object.assign([],this.filters)}}function ic(n){return n.op==="and"}function oc(n){return hf(n)&&ic(n)}function hf(n){for(const t of n.filters)if(t instanceof Lt)return!1;return!0}function Zs(n){if(n instanceof at)return n.field.canonicalString()+n.op.toString()+Ke(n.value);if(oc(n))return n.filters.map(t=>Zs(t)).join(",");{const t=n.filters.map(e=>Zs(e)).join(",");return`${n.op}(${t})`}}function ac(n,t){return n instanceof at?function(r,s){return s instanceof at&&r.op===s.op&&r.field.isEqual(s.field)&&Gt(r.value,s.value)}(n,t):n instanceof Lt?function(r,s){return s instanceof Lt&&r.op===s.op&&r.filters.length===s.filters.length?r.filters.reduce((o,a,c)=>o&&ac(a,s.filters[c]),!0):!1}(n,t):void M(19439)}function uc(n){return n instanceof at?function(e){return`${e.field.canonicalString()} ${e.op} ${Ke(e.value)}`}(n):n instanceof Lt?function(e){return e.op.toString()+" {"+e.getFilters().map(uc).join(" ,")+"}"}(n):"Filter"}class df extends at{constructor(t,e,r){super(t,e,r),this.key=x.fromName(r.referenceValue)}matches(t){const e=x.comparator(t.key,this.key);return this.matchesComparison(e)}}class ff extends at{constructor(t,e){super(t,"in",e),this.keys=cc("in",e)}matches(t){return this.keys.some(e=>e.isEqual(t.key))}}class pf extends at{constructor(t,e){super(t,"not-in",e),this.keys=cc("not-in",e)}matches(t){return!this.keys.some(e=>e.isEqual(t.key))}}function cc(n,t){var e;return(((e=t.arrayValue)==null?void 0:e.values)||[]).map(r=>x.fromName(r.referenceValue))}class mf extends at{constructor(t,e){super(t,"array-contains",e)}matches(t){const e=t.data.field(this.field);return Si(e)&&Fn(e.arrayValue,this.value)}}class gf extends at{constructor(t,e){super(t,"in",e)}matches(t){const e=t.data.field(this.field);return e!==null&&Fn(this.value.arrayValue,e)}}class _f extends at{constructor(t,e){super(t,"not-in",e)}matches(t){if(Fn(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const e=t.data.field(this.field);return e!==null&&e.nullValue===void 0&&!Fn(this.value.arrayValue,e)}}class yf extends at{constructor(t,e){super(t,"array-contains-any",e)}matches(t){const e=t.data.field(this.field);return!(!Si(e)||!e.arrayValue.values)&&e.arrayValue.values.some(r=>Fn(this.value.arrayValue,r))}}/**
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
 */class Ef{constructor(t,e=null,r=[],s=[],o=null,a=null,c=null){this.path=t,this.collectionGroup=e,this.orderBy=r,this.filters=s,this.limit=o,this.startAt=a,this.endAt=c,this.Te=null}}function Ua(n,t=null,e=[],r=[],s=null,o=null,a=null){return new Ef(n,t,e,r,s,o,a)}function Ci(n){const t=L(n);if(t.Te===null){let e=t.path.canonicalString();t.collectionGroup!==null&&(e+="|cg:"+t.collectionGroup),e+="|f:",e+=t.filters.map(r=>Zs(r)).join(","),e+="|ob:",e+=t.orderBy.map(r=>function(o){return o.field.canonicalString()+o.dir}(r)).join(","),zr(t.limit)||(e+="|l:",e+=t.limit),t.startAt&&(e+="|lb:",e+=t.startAt.inclusive?"b:":"a:",e+=t.startAt.position.map(r=>Ke(r)).join(",")),t.endAt&&(e+="|ub:",e+=t.endAt.inclusive?"a:":"b:",e+=t.endAt.position.map(r=>Ke(r)).join(",")),t.Te=e}return t.Te}function Pi(n,t){if(n.limit!==t.limit||n.orderBy.length!==t.orderBy.length)return!1;for(let e=0;e<n.orderBy.length;e++)if(!lf(n.orderBy[e],t.orderBy[e]))return!1;if(n.filters.length!==t.filters.length)return!1;for(let e=0;e<n.filters.length;e++)if(!ac(n.filters[e],t.filters[e]))return!1;return n.collectionGroup===t.collectionGroup&&!!n.path.isEqual(t.path)&&!!Fa(n.startAt,t.startAt)&&Fa(n.endAt,t.endAt)}function ti(n){return x.isDocumentKey(n.path)&&n.collectionGroup===null&&n.filters.length===0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class en{constructor(t,e=null,r=[],s=[],o=null,a="F",c=null,h=null){this.path=t,this.collectionGroup=e,this.explicitOrderBy=r,this.filters=s,this.limit=o,this.limitType=a,this.startAt=c,this.endAt=h,this.Ie=null,this.Ee=null,this.de=null,this.startAt,this.endAt}}function Tf(n,t,e,r,s,o,a,c){return new en(n,t,e,r,s,o,a,c)}function Gr(n){return new en(n)}function Ba(n){return n.filters.length===0&&n.limit===null&&n.startAt==null&&n.endAt==null&&(n.explicitOrderBy.length===0||n.explicitOrderBy.length===1&&n.explicitOrderBy[0].field.isKeyField())}function lc(n){return n.collectionGroup!==null}function Vn(n){const t=L(n);if(t.Ie===null){t.Ie=[];const e=new Set;for(const o of t.explicitOrderBy)t.Ie.push(o),e.add(o.field.canonicalString());const r=t.explicitOrderBy.length>0?t.explicitOrderBy[t.explicitOrderBy.length-1].dir:"asc";(function(a){let c=new lt(pt.comparator);return a.filters.forEach(h=>{h.getFlattenedFilters().forEach(d=>{d.isInequality()&&(c=c.add(d.field))})}),c})(t).forEach(o=>{e.has(o.canonicalString())||o.isKeyField()||t.Ie.push(new Un(o,r))}),e.has(pt.keyField().canonicalString())||t.Ie.push(new Un(pt.keyField(),r))}return t.Ie}function jt(n){const t=L(n);return t.Ee||(t.Ee=hc(t,Vn(n))),t.Ee}function wf(n){const t=L(n);return t.de||(t.de=hc(t,n.explicitOrderBy)),t.de}function hc(n,t){if(n.limitType==="F")return Ua(n.path,n.collectionGroup,t,n.filters,n.limit,n.startAt,n.endAt);{t=t.map(s=>{const o=s.dir==="desc"?"asc":"desc";return new Un(s.field,o)});const e=n.endAt?new Nr(n.endAt.position,n.endAt.inclusive):null,r=n.startAt?new Nr(n.startAt.position,n.startAt.inclusive):null;return Ua(n.path,n.collectionGroup,t,n.filters,n.limit,e,r)}}function ei(n,t){const e=n.filters.concat([t]);return new en(n.path,n.collectionGroup,n.explicitOrderBy.slice(),e,n.limit,n.limitType,n.startAt,n.endAt)}function ni(n,t,e){return new en(n.path,n.collectionGroup,n.explicitOrderBy.slice(),n.filters.slice(),t,e,n.startAt,n.endAt)}function Kr(n,t){return Pi(jt(n),jt(t))&&n.limitType===t.limitType}function dc(n){return`${Ci(jt(n))}|lt:${n.limitType}`}function Be(n){return`Query(target=${function(e){let r=e.path.canonicalString();return e.collectionGroup!==null&&(r+=" collectionGroup="+e.collectionGroup),e.filters.length>0&&(r+=`, filters: [${e.filters.map(s=>uc(s)).join(", ")}]`),zr(e.limit)||(r+=", limit: "+e.limit),e.orderBy.length>0&&(r+=`, orderBy: [${e.orderBy.map(s=>function(a){return`${a.field.canonicalString()} (${a.dir})`}(s)).join(", ")}]`),e.startAt&&(r+=", startAt: ",r+=e.startAt.inclusive?"b:":"a:",r+=e.startAt.position.map(s=>Ke(s)).join(",")),e.endAt&&(r+=", endAt: ",r+=e.endAt.inclusive?"a:":"b:",r+=e.endAt.position.map(s=>Ke(s)).join(",")),`Target(${r})`}(jt(n))}; limitType=${n.limitType})`}function Wr(n,t){return t.isFoundDocument()&&function(r,s){const o=s.key.path;return r.collectionGroup!==null?s.key.hasCollectionId(r.collectionGroup)&&r.path.isPrefixOf(o):x.isDocumentKey(r.path)?r.path.isEqual(o):r.path.isImmediateParentOf(o)}(n,t)&&function(r,s){for(const o of Vn(r))if(!o.field.isKeyField()&&s.data.field(o.field)===null)return!1;return!0}(n,t)&&function(r,s){for(const o of r.filters)if(!o.matches(s))return!1;return!0}(n,t)&&function(r,s){return!(r.startAt&&!function(a,c,h){const d=La(a,c,h);return a.inclusive?d<=0:d<0}(r.startAt,Vn(r),s)||r.endAt&&!function(a,c,h){const d=La(a,c,h);return a.inclusive?d>=0:d>0}(r.endAt,Vn(r),s))}(n,t)}function If(n){return n.collectionGroup||(n.path.length%2==1?n.path.lastSegment():n.path.get(n.path.length-2))}function fc(n){return(t,e)=>{let r=!1;for(const s of Vn(n)){const o=Af(s,t,e);if(o!==0)return o;r=r||s.field.isKeyField()}return 0}}function Af(n,t,e){const r=n.field.isKeyField()?x.comparator(t.key,e.key):function(o,a,c){const h=a.data.field(o),d=c.data.field(o);return h!==null&&d!==null?Ge(h,d):M(42886)}(n.field,t,e);switch(n.dir){case"asc":return r;case"desc":return-1*r;default:return M(19790,{direction:n.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ke{constructor(t,e){this.mapKeyFn=t,this.equalsFn=e,this.inner={},this.innerSize=0}get(t){const e=this.mapKeyFn(t),r=this.inner[e];if(r!==void 0){for(const[s,o]of r)if(this.equalsFn(s,t))return o}}has(t){return this.get(t)!==void 0}set(t,e){const r=this.mapKeyFn(t),s=this.inner[r];if(s===void 0)return this.inner[r]=[[t,e]],void this.innerSize++;for(let o=0;o<s.length;o++)if(this.equalsFn(s[o][0],t))return void(s[o]=[t,e]);s.push([t,e]),this.innerSize++}delete(t){const e=this.mapKeyFn(t),r=this.inner[e];if(r===void 0)return!1;for(let s=0;s<r.length;s++)if(this.equalsFn(r[s][0],t))return r.length===1?delete this.inner[e]:r.splice(s,1),this.innerSize--,!0;return!1}forEach(t){_e(this.inner,(e,r)=>{for(const[s,o]of r)t(s,o)})}isEmpty(){return Qu(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vf=new Z(x.comparator);function Zt(){return vf}const pc=new Z(x.comparator);function Rn(...n){let t=pc;for(const e of n)t=t.insert(e.key,e);return t}function mc(n){let t=pc;return n.forEach((e,r)=>t=t.insert(e,r.overlayedDocument)),t}function Re(){return Dn()}function gc(){return Dn()}function Dn(){return new ke(n=>n.toString(),(n,t)=>n.isEqual(t))}const Rf=new Z(x.comparator),Sf=new lt(x.comparator);function $(...n){let t=Sf;for(const e of n)t=t.add(e);return t}const Cf=new lt(j);function Pf(){return Cf}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bi(n,t){if(n.useProto3Json){if(isNaN(t))return{doubleValue:"NaN"};if(t===1/0)return{doubleValue:"Infinity"};if(t===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:Vr(t)?"-0":t}}function _c(n){return{integerValue:""+n}}function bf(n,t){return tf(t)?_c(t):bi(n,t)}/**
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
 */class Qr{constructor(){this._=void 0}}function Vf(n,t,e){return n instanceof Bn?function(s,o){const a={fields:{[Ju]:{stringValue:Yu},[tc]:{timestampValue:{seconds:s.seconds,nanos:s.nanoseconds}}}};return o&&Ri(o)&&(o=Hr(o)),o&&(a.fields[Zu]=o),{mapValue:a}}(e,t):n instanceof qn?Ec(n,t):n instanceof jn?Tc(n,t):function(s,o){const a=yc(s,o),c=qa(a)+qa(s.Ae);return Js(a)&&Js(s.Ae)?_c(c):bi(s.serializer,c)}(n,t)}function Df(n,t,e){return n instanceof qn?Ec(n,t):n instanceof jn?Tc(n,t):e}function yc(n,t){return n instanceof kr?function(r){return Js(r)||function(o){return!!o&&"doubleValue"in o}(r)}(t)?t:{integerValue:0}:null}class Bn extends Qr{}class qn extends Qr{constructor(t){super(),this.elements=t}}function Ec(n,t){const e=wc(t);for(const r of n.elements)e.some(s=>Gt(s,r))||e.push(r);return{arrayValue:{values:e}}}class jn extends Qr{constructor(t){super(),this.elements=t}}function Tc(n,t){let e=wc(t);for(const r of n.elements)e=e.filter(s=>!Gt(s,r));return{arrayValue:{values:e}}}class kr extends Qr{constructor(t,e){super(),this.serializer=t,this.Ae=e}}function qa(n){return it(n.integerValue||n.doubleValue)}function wc(n){return Si(n)&&n.arrayValue.values?n.arrayValue.values.slice():[]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nf{constructor(t,e){this.field=t,this.transform=e}}function kf(n,t){return n.field.isEqual(t.field)&&function(r,s){return r instanceof qn&&s instanceof qn||r instanceof jn&&s instanceof jn?He(r.elements,s.elements,Gt):r instanceof kr&&s instanceof kr?Gt(r.Ae,s.Ae):r instanceof Bn&&s instanceof Bn}(n.transform,t.transform)}class Of{constructor(t,e){this.version=t,this.transformResults=e}}class Dt{constructor(t,e){this.updateTime=t,this.exists=e}static none(){return new Dt}static exists(t){return new Dt(void 0,t)}static updateTime(t){return new Dt(t)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(t){return this.exists===t.exists&&(this.updateTime?!!t.updateTime&&this.updateTime.isEqual(t.updateTime):!t.updateTime)}}function vr(n,t){return n.updateTime!==void 0?t.isFoundDocument()&&t.version.isEqual(n.updateTime):n.exists===void 0||n.exists===t.isFoundDocument()}class Xr{}function Ic(n,t){if(!n.hasLocalMutations||t&&t.fields.length===0)return null;if(t===null)return n.isNoDocument()?new Yr(n.key,Dt.none()):new zn(n.key,n.data,Dt.none());{const e=n.data,r=bt.empty();let s=new lt(pt.comparator);for(let o of t.fields)if(!s.has(o)){let a=e.field(o);a===null&&o.length>1&&(o=o.popLast(),a=e.field(o)),a===null?r.delete(o):r.set(o,a),s=s.add(o)}return new ye(n.key,r,new kt(s.toArray()),Dt.none())}}function xf(n,t,e){n instanceof zn?function(s,o,a){const c=s.value.clone(),h=$a(s.fieldTransforms,o,a.transformResults);c.setAll(h),o.convertToFoundDocument(a.version,c).setHasCommittedMutations()}(n,t,e):n instanceof ye?function(s,o,a){if(!vr(s.precondition,o))return void o.convertToUnknownDocument(a.version);const c=$a(s.fieldTransforms,o,a.transformResults),h=o.data;h.setAll(Ac(s)),h.setAll(c),o.convertToFoundDocument(a.version,h).setHasCommittedMutations()}(n,t,e):function(s,o,a){o.convertToNoDocument(a.version).setHasCommittedMutations()}(0,t,e)}function Nn(n,t,e,r){return n instanceof zn?function(o,a,c,h){if(!vr(o.precondition,a))return c;const d=o.value.clone(),p=za(o.fieldTransforms,h,a);return d.setAll(p),a.convertToFoundDocument(a.version,d).setHasLocalMutations(),null}(n,t,e,r):n instanceof ye?function(o,a,c,h){if(!vr(o.precondition,a))return c;const d=za(o.fieldTransforms,h,a),p=a.data;return p.setAll(Ac(o)),p.setAll(d),a.convertToFoundDocument(a.version,p).setHasLocalMutations(),c===null?null:c.unionWith(o.fieldMask.fields).unionWith(o.fieldTransforms.map(y=>y.field))}(n,t,e,r):function(o,a,c){return vr(o.precondition,a)?(a.convertToNoDocument(a.version).setHasLocalMutations(),null):c}(n,t,e)}function Mf(n,t){let e=null;for(const r of n.fieldTransforms){const s=t.data.field(r.field),o=yc(r.transform,s||null);o!=null&&(e===null&&(e=bt.empty()),e.set(r.field,o))}return e||null}function ja(n,t){return n.type===t.type&&!!n.key.isEqual(t.key)&&!!n.precondition.isEqual(t.precondition)&&!!function(r,s){return r===void 0&&s===void 0||!(!r||!s)&&He(r,s,(o,a)=>kf(o,a))}(n.fieldTransforms,t.fieldTransforms)&&(n.type===0?n.value.isEqual(t.value):n.type!==1||n.data.isEqual(t.data)&&n.fieldMask.isEqual(t.fieldMask))}class zn extends Xr{constructor(t,e,r,s=[]){super(),this.key=t,this.value=e,this.precondition=r,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}}class ye extends Xr{constructor(t,e,r,s,o=[]){super(),this.key=t,this.data=e,this.fieldMask=r,this.precondition=s,this.fieldTransforms=o,this.type=1}getFieldMask(){return this.fieldMask}}function Ac(n){const t=new Map;return n.fieldMask.fields.forEach(e=>{if(!e.isEmpty()){const r=n.data.field(e);t.set(e,r)}}),t}function $a(n,t,e){const r=new Map;W(n.length===e.length,32656,{Re:e.length,Ve:n.length});for(let s=0;s<e.length;s++){const o=n[s],a=o.transform,c=t.data.field(o.field);r.set(o.field,Df(a,c,e[s]))}return r}function za(n,t,e){const r=new Map;for(const s of n){const o=s.transform,a=e.data.field(s.field);r.set(s.field,Vf(o,a,t))}return r}class Yr extends Xr{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class Lf extends Xr{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ff{constructor(t,e,r,s){this.batchId=t,this.localWriteTime=e,this.baseMutations=r,this.mutations=s}applyToRemoteDocument(t,e){const r=e.mutationResults;for(let s=0;s<this.mutations.length;s++){const o=this.mutations[s];o.key.isEqual(t.key)&&xf(o,t,r[s])}}applyToLocalView(t,e){for(const r of this.baseMutations)r.key.isEqual(t.key)&&(e=Nn(r,t,e,this.localWriteTime));for(const r of this.mutations)r.key.isEqual(t.key)&&(e=Nn(r,t,e,this.localWriteTime));return e}applyToLocalDocumentSet(t,e){const r=gc();return this.mutations.forEach(s=>{const o=t.get(s.key),a=o.overlayedDocument;let c=this.applyToLocalView(a,o.mutatedFields);c=e.has(s.key)?null:c;const h=Ic(a,c);h!==null&&r.set(s.key,h),a.isValidDocument()||a.convertToNoDocument(U.min())}),r}keys(){return this.mutations.reduce((t,e)=>t.add(e.key),$())}isEqual(t){return this.batchId===t.batchId&&He(this.mutations,t.mutations,(e,r)=>ja(e,r))&&He(this.baseMutations,t.baseMutations,(e,r)=>ja(e,r))}}class Vi{constructor(t,e,r,s){this.batch=t,this.commitVersion=e,this.mutationResults=r,this.docVersions=s}static from(t,e,r){W(t.mutations.length===r.length,58842,{me:t.mutations.length,fe:r.length});let s=function(){return Rf}();const o=t.mutations;for(let a=0;a<o.length;a++)s=s.insert(o[a].key,r[a].version);return new Vi(t,e,r,s)}}/**
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
 */class Uf{constructor(t,e){this.largestBatchId=t,this.mutation=e}getKey(){return this.mutation.key}isEqual(t){return t!==null&&this.mutation===t.mutation}toString(){return`Overlay{
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
 */class Bf{constructor(t,e,r){this.alias=t,this.aggregateType=e,this.fieldPath=r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qf{constructor(t,e){this.count=t,this.unchangedNames=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ot,H;function jf(n){switch(n){case C.OK:return M(64938);case C.CANCELLED:case C.UNKNOWN:case C.DEADLINE_EXCEEDED:case C.RESOURCE_EXHAUSTED:case C.INTERNAL:case C.UNAVAILABLE:case C.UNAUTHENTICATED:return!1;case C.INVALID_ARGUMENT:case C.NOT_FOUND:case C.ALREADY_EXISTS:case C.PERMISSION_DENIED:case C.FAILED_PRECONDITION:case C.ABORTED:case C.OUT_OF_RANGE:case C.UNIMPLEMENTED:case C.DATA_LOSS:return!0;default:return M(15467,{code:n})}}function vc(n){if(n===void 0)return Jt("GRPC error has no .code"),C.UNKNOWN;switch(n){case ot.OK:return C.OK;case ot.CANCELLED:return C.CANCELLED;case ot.UNKNOWN:return C.UNKNOWN;case ot.DEADLINE_EXCEEDED:return C.DEADLINE_EXCEEDED;case ot.RESOURCE_EXHAUSTED:return C.RESOURCE_EXHAUSTED;case ot.INTERNAL:return C.INTERNAL;case ot.UNAVAILABLE:return C.UNAVAILABLE;case ot.UNAUTHENTICATED:return C.UNAUTHENTICATED;case ot.INVALID_ARGUMENT:return C.INVALID_ARGUMENT;case ot.NOT_FOUND:return C.NOT_FOUND;case ot.ALREADY_EXISTS:return C.ALREADY_EXISTS;case ot.PERMISSION_DENIED:return C.PERMISSION_DENIED;case ot.FAILED_PRECONDITION:return C.FAILED_PRECONDITION;case ot.ABORTED:return C.ABORTED;case ot.OUT_OF_RANGE:return C.OUT_OF_RANGE;case ot.UNIMPLEMENTED:return C.UNIMPLEMENTED;case ot.DATA_LOSS:return C.DATA_LOSS;default:return M(39323,{code:n})}}(H=ot||(ot={}))[H.OK=0]="OK",H[H.CANCELLED=1]="CANCELLED",H[H.UNKNOWN=2]="UNKNOWN",H[H.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",H[H.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",H[H.NOT_FOUND=5]="NOT_FOUND",H[H.ALREADY_EXISTS=6]="ALREADY_EXISTS",H[H.PERMISSION_DENIED=7]="PERMISSION_DENIED",H[H.UNAUTHENTICATED=16]="UNAUTHENTICATED",H[H.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",H[H.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",H[H.ABORTED=10]="ABORTED",H[H.OUT_OF_RANGE=11]="OUT_OF_RANGE",H[H.UNIMPLEMENTED=12]="UNIMPLEMENTED",H[H.INTERNAL=13]="INTERNAL",H[H.UNAVAILABLE=14]="UNAVAILABLE",H[H.DATA_LOSS=15]="DATA_LOSS";/**
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
 */function $f(){return new TextEncoder}/**
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
 */const zf=new ue([4294967295,4294967295],0);function Ha(n){const t=$f().encode(n),e=new Fu;return e.update(t),new Uint8Array(e.digest())}function Ga(n){const t=new DataView(n.buffer),e=t.getUint32(0,!0),r=t.getUint32(4,!0),s=t.getUint32(8,!0),o=t.getUint32(12,!0);return[new ue([e,r],0),new ue([s,o],0)]}class Di{constructor(t,e,r){if(this.bitmap=t,this.padding=e,this.hashCount=r,e<0||e>=8)throw new Sn(`Invalid padding: ${e}`);if(r<0)throw new Sn(`Invalid hash count: ${r}`);if(t.length>0&&this.hashCount===0)throw new Sn(`Invalid hash count: ${r}`);if(t.length===0&&e!==0)throw new Sn(`Invalid padding when bitmap length is 0: ${e}`);this.ge=8*t.length-e,this.pe=ue.fromNumber(this.ge)}ye(t,e,r){let s=t.add(e.multiply(ue.fromNumber(r)));return s.compare(zf)===1&&(s=new ue([s.getBits(0),s.getBits(1)],0)),s.modulo(this.pe).toNumber()}we(t){return!!(this.bitmap[Math.floor(t/8)]&1<<t%8)}mightContain(t){if(this.ge===0)return!1;const e=Ha(t),[r,s]=Ga(e);for(let o=0;o<this.hashCount;o++){const a=this.ye(r,s,o);if(!this.we(a))return!1}return!0}static create(t,e,r){const s=t%8==0?0:8-t%8,o=new Uint8Array(Math.ceil(t/8)),a=new Di(o,s,e);return r.forEach(c=>a.insert(c)),a}insert(t){if(this.ge===0)return;const e=Ha(t),[r,s]=Ga(e);for(let o=0;o<this.hashCount;o++){const a=this.ye(r,s,o);this.Se(a)}}Se(t){const e=Math.floor(t/8),r=t%8;this.bitmap[e]|=1<<r}}class Sn extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jr{constructor(t,e,r,s,o){this.snapshotVersion=t,this.targetChanges=e,this.targetMismatches=r,this.documentUpdates=s,this.resolvedLimboDocuments=o}static createSynthesizedRemoteEventForCurrentChange(t,e,r){const s=new Map;return s.set(t,Hn.createSynthesizedTargetChangeForCurrentChange(t,e,r)),new Jr(U.min(),s,new Z(j),Zt(),$())}}class Hn{constructor(t,e,r,s,o){this.resumeToken=t,this.current=e,this.addedDocuments=r,this.modifiedDocuments=s,this.removedDocuments=o}static createSynthesizedTargetChangeForCurrentChange(t,e,r){return new Hn(r,e,$(),$(),$())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rr{constructor(t,e,r,s){this.be=t,this.removedTargetIds=e,this.key=r,this.De=s}}class Rc{constructor(t,e){this.targetId=t,this.Ce=e}}class Sc{constructor(t,e,r=mt.EMPTY_BYTE_STRING,s=null){this.state=t,this.targetIds=e,this.resumeToken=r,this.cause=s}}class Ka{constructor(){this.ve=0,this.Fe=Wa(),this.Me=mt.EMPTY_BYTE_STRING,this.xe=!1,this.Oe=!0}get current(){return this.xe}get resumeToken(){return this.Me}get Ne(){return this.ve!==0}get Be(){return this.Oe}Le(t){t.approximateByteSize()>0&&(this.Oe=!0,this.Me=t)}ke(){let t=$(),e=$(),r=$();return this.Fe.forEach((s,o)=>{switch(o){case 0:t=t.add(s);break;case 2:e=e.add(s);break;case 1:r=r.add(s);break;default:M(38017,{changeType:o})}}),new Hn(this.Me,this.xe,t,e,r)}qe(){this.Oe=!1,this.Fe=Wa()}Qe(t,e){this.Oe=!0,this.Fe=this.Fe.insert(t,e)}$e(t){this.Oe=!0,this.Fe=this.Fe.remove(t)}Ue(){this.ve+=1}Ke(){this.ve-=1,W(this.ve>=0,3241,{ve:this.ve})}We(){this.Oe=!0,this.xe=!0}}class Hf{constructor(t){this.Ge=t,this.ze=new Map,this.je=Zt(),this.Je=_r(),this.He=_r(),this.Ye=new Z(j)}Ze(t){for(const e of t.be)t.De&&t.De.isFoundDocument()?this.Xe(e,t.De):this.et(e,t.key,t.De);for(const e of t.removedTargetIds)this.et(e,t.key,t.De)}tt(t){this.forEachTarget(t,e=>{const r=this.nt(e);switch(t.state){case 0:this.rt(e)&&r.Le(t.resumeToken);break;case 1:r.Ke(),r.Ne||r.qe(),r.Le(t.resumeToken);break;case 2:r.Ke(),r.Ne||this.removeTarget(e);break;case 3:this.rt(e)&&(r.We(),r.Le(t.resumeToken));break;case 4:this.rt(e)&&(this.it(e),r.Le(t.resumeToken));break;default:M(56790,{state:t.state})}})}forEachTarget(t,e){t.targetIds.length>0?t.targetIds.forEach(e):this.ze.forEach((r,s)=>{this.rt(s)&&e(s)})}st(t){const e=t.targetId,r=t.Ce.count,s=this.ot(e);if(s){const o=s.target;if(ti(o))if(r===0){const a=new x(o.path);this.et(e,a,It.newNoDocument(a,U.min()))}else W(r===1,20013,{expectedCount:r});else{const a=this._t(e);if(a!==r){const c=this.ut(t),h=c?this.ct(c,t,a):1;if(h!==0){this.it(e);const d=h===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Ye=this.Ye.insert(e,d)}}}}}ut(t){const e=t.Ce.unchangedNames;if(!e||!e.bits)return null;const{bits:{bitmap:r="",padding:s=0},hashCount:o=0}=e;let a,c;try{a=de(r).toUint8Array()}catch(h){if(h instanceof Xu)return ze("Decoding the base64 bloom filter in existence filter failed ("+h.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw h}try{c=new Di(a,s,o)}catch(h){return ze(h instanceof Sn?"BloomFilter error: ":"Applying bloom filter failed: ",h),null}return c.ge===0?null:c}ct(t,e,r){return e.Ce.count===r-this.Pt(t,e.targetId)?0:2}Pt(t,e){const r=this.Ge.getRemoteKeysForTarget(e);let s=0;return r.forEach(o=>{const a=this.Ge.ht(),c=`projects/${a.projectId}/databases/${a.database}/documents/${o.path.canonicalString()}`;t.mightContain(c)||(this.et(e,o,null),s++)}),s}Tt(t){const e=new Map;this.ze.forEach((o,a)=>{const c=this.ot(a);if(c){if(o.current&&ti(c.target)){const h=new x(c.target.path);this.It(h).has(a)||this.Et(a,h)||this.et(a,h,It.newNoDocument(h,t))}o.Be&&(e.set(a,o.ke()),o.qe())}});let r=$();this.He.forEach((o,a)=>{let c=!0;a.forEachWhile(h=>{const d=this.ot(h);return!d||d.purpose==="TargetPurposeLimboResolution"||(c=!1,!1)}),c&&(r=r.add(o))}),this.je.forEach((o,a)=>a.setReadTime(t));const s=new Jr(t,e,this.Ye,this.je,r);return this.je=Zt(),this.Je=_r(),this.He=_r(),this.Ye=new Z(j),s}Xe(t,e){if(!this.rt(t))return;const r=this.Et(t,e.key)?2:0;this.nt(t).Qe(e.key,r),this.je=this.je.insert(e.key,e),this.Je=this.Je.insert(e.key,this.It(e.key).add(t)),this.He=this.He.insert(e.key,this.dt(e.key).add(t))}et(t,e,r){if(!this.rt(t))return;const s=this.nt(t);this.Et(t,e)?s.Qe(e,1):s.$e(e),this.He=this.He.insert(e,this.dt(e).delete(t)),this.He=this.He.insert(e,this.dt(e).add(t)),r&&(this.je=this.je.insert(e,r))}removeTarget(t){this.ze.delete(t)}_t(t){const e=this.nt(t).ke();return this.Ge.getRemoteKeysForTarget(t).size+e.addedDocuments.size-e.removedDocuments.size}Ue(t){this.nt(t).Ue()}nt(t){let e=this.ze.get(t);return e||(e=new Ka,this.ze.set(t,e)),e}dt(t){let e=this.He.get(t);return e||(e=new lt(j),this.He=this.He.insert(t,e)),e}It(t){let e=this.Je.get(t);return e||(e=new lt(j),this.Je=this.Je.insert(t,e)),e}rt(t){const e=this.ot(t)!==null;return e||O("WatchChangeAggregator","Detected inactive target",t),e}ot(t){const e=this.ze.get(t);return e&&e.Ne?null:this.Ge.At(t)}it(t){this.ze.set(t,new Ka),this.Ge.getRemoteKeysForTarget(t).forEach(e=>{this.et(t,e,null)})}Et(t,e){return this.Ge.getRemoteKeysForTarget(t).has(e)}}function _r(){return new Z(x.comparator)}function Wa(){return new Z(x.comparator)}const Gf={asc:"ASCENDING",desc:"DESCENDING"},Kf={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},Wf={and:"AND",or:"OR"};class Qf{constructor(t,e){this.databaseId=t,this.useProto3Json=e}}function ri(n,t){return n.useProto3Json||zr(t)?t:{value:t}}function Or(n,t){return n.useProto3Json?`${new Date(1e3*t.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+t.nanoseconds).slice(-9)}Z`:{seconds:""+t.seconds,nanos:t.nanoseconds}}function Cc(n,t){return n.useProto3Json?t.toBase64():t.toUint8Array()}function Xf(n,t){return Or(n,t.toTimestamp())}function $t(n){return W(!!n,49232),U.fromTimestamp(function(e){const r=he(e);return new J(r.seconds,r.nanos)}(n))}function Ni(n,t){return si(n,t).canonicalString()}function si(n,t){const e=function(s){return new X(["projects",s.projectId,"databases",s.database])}(n).child("documents");return t===void 0?e:e.child(t)}function Pc(n){const t=X.fromString(n);return W(Oc(t),10190,{key:t.toString()}),t}function ii(n,t){return Ni(n.databaseId,t.path)}function Ls(n,t){const e=Pc(t);if(e.get(1)!==n.databaseId.projectId)throw new k(C.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+e.get(1)+" vs "+n.databaseId.projectId);if(e.get(3)!==n.databaseId.database)throw new k(C.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+e.get(3)+" vs "+n.databaseId.database);return new x(Vc(e))}function bc(n,t){return Ni(n.databaseId,t)}function Yf(n){const t=Pc(n);return t.length===4?X.emptyPath():Vc(t)}function oi(n){return new X(["projects",n.databaseId.projectId,"databases",n.databaseId.database]).canonicalString()}function Vc(n){return W(n.length>4&&n.get(4)==="documents",29091,{key:n.toString()}),n.popFirst(5)}function Qa(n,t,e){return{name:ii(n,t),fields:e.value.mapValue.fields}}function Jf(n,t){let e;if("targetChange"in t){t.targetChange;const r=function(d){return d==="NO_CHANGE"?0:d==="ADD"?1:d==="REMOVE"?2:d==="CURRENT"?3:d==="RESET"?4:M(39313,{state:d})}(t.targetChange.targetChangeType||"NO_CHANGE"),s=t.targetChange.targetIds||[],o=function(d,p){return d.useProto3Json?(W(p===void 0||typeof p=="string",58123),mt.fromBase64String(p||"")):(W(p===void 0||p instanceof Buffer||p instanceof Uint8Array,16193),mt.fromUint8Array(p||new Uint8Array))}(n,t.targetChange.resumeToken),a=t.targetChange.cause,c=a&&function(d){const p=d.code===void 0?C.UNKNOWN:vc(d.code);return new k(p,d.message||"")}(a);e=new Sc(r,s,o,c||null)}else if("documentChange"in t){t.documentChange;const r=t.documentChange;r.document,r.document.name,r.document.updateTime;const s=Ls(n,r.document.name),o=$t(r.document.updateTime),a=r.document.createTime?$t(r.document.createTime):U.min(),c=new bt({mapValue:{fields:r.document.fields}}),h=It.newFoundDocument(s,o,a,c),d=r.targetIds||[],p=r.removedTargetIds||[];e=new Rr(d,p,h.key,h)}else if("documentDelete"in t){t.documentDelete;const r=t.documentDelete;r.document;const s=Ls(n,r.document),o=r.readTime?$t(r.readTime):U.min(),a=It.newNoDocument(s,o),c=r.removedTargetIds||[];e=new Rr([],c,a.key,a)}else if("documentRemove"in t){t.documentRemove;const r=t.documentRemove;r.document;const s=Ls(n,r.document),o=r.removedTargetIds||[];e=new Rr([],o,s,null)}else{if(!("filter"in t))return M(11601,{Rt:t});{t.filter;const r=t.filter;r.targetId;const{count:s=0,unchangedNames:o}=r,a=new qf(s,o),c=r.targetId;e=new Rc(c,a)}}return e}function Zf(n,t){let e;if(t instanceof zn)e={update:Qa(n,t.key,t.value)};else if(t instanceof Yr)e={delete:ii(n,t.key)};else if(t instanceof ye)e={update:Qa(n,t.key,t.data),updateMask:up(t.fieldMask)};else{if(!(t instanceof Lf))return M(16599,{Vt:t.type});e={verify:ii(n,t.key)}}return t.fieldTransforms.length>0&&(e.updateTransforms=t.fieldTransforms.map(r=>function(o,a){const c=a.transform;if(c instanceof Bn)return{fieldPath:a.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(c instanceof qn)return{fieldPath:a.field.canonicalString(),appendMissingElements:{values:c.elements}};if(c instanceof jn)return{fieldPath:a.field.canonicalString(),removeAllFromArray:{values:c.elements}};if(c instanceof kr)return{fieldPath:a.field.canonicalString(),increment:c.Ae};throw M(20930,{transform:a.transform})}(0,r))),t.precondition.isNone||(e.currentDocument=function(s,o){return o.updateTime!==void 0?{updateTime:Xf(s,o.updateTime)}:o.exists!==void 0?{exists:o.exists}:M(27497)}(n,t.precondition)),e}function tp(n,t){return n&&n.length>0?(W(t!==void 0,14353),n.map(e=>function(s,o){let a=s.updateTime?$t(s.updateTime):$t(o);return a.isEqual(U.min())&&(a=$t(o)),new Of(a,s.transformResults||[])}(e,t))):[]}function ep(n,t){return{documents:[bc(n,t.path)]}}function Dc(n,t){const e={structuredQuery:{}},r=t.path;let s;t.collectionGroup!==null?(s=r,e.structuredQuery.from=[{collectionId:t.collectionGroup,allDescendants:!0}]):(s=r.popLast(),e.structuredQuery.from=[{collectionId:r.lastSegment()}]),e.parent=bc(n,s);const o=function(d){if(d.length!==0)return kc(Lt.create(d,"and"))}(t.filters);o&&(e.structuredQuery.where=o);const a=function(d){if(d.length!==0)return d.map(p=>function(E){return{field:se(E.field),direction:ip(E.dir)}}(p))}(t.orderBy);a&&(e.structuredQuery.orderBy=a);const c=ri(n,t.limit);return c!==null&&(e.structuredQuery.limit=c),t.startAt&&(e.structuredQuery.startAt=function(d){return{before:d.inclusive,values:d.position}}(t.startAt)),t.endAt&&(e.structuredQuery.endAt=function(d){return{before:!d.inclusive,values:d.position}}(t.endAt)),{ft:e,parent:s}}function np(n,t,e,r){const{ft:s,parent:o}=Dc(n,t),a={},c=[];let h=0;return e.forEach(d=>{const p="aggregate_"+h++;a[p]=d.alias,d.aggregateType==="count"?c.push({alias:p,count:{}}):d.aggregateType==="avg"?c.push({alias:p,avg:{field:se(d.fieldPath)}}):d.aggregateType==="sum"&&c.push({alias:p,sum:{field:se(d.fieldPath)}})}),{request:{structuredAggregationQuery:{aggregations:c,structuredQuery:s.structuredQuery},parent:s.parent},gt:a,parent:o}}function rp(n){let t=Yf(n.parent);const e=n.structuredQuery,r=e.from?e.from.length:0;let s=null;if(r>0){W(r===1,65062);const p=e.from[0];p.allDescendants?s=p.collectionId:t=t.child(p.collectionId)}let o=[];e.where&&(o=function(y){const E=Nc(y);return E instanceof Lt&&oc(E)?E.getFilters():[E]}(e.where));let a=[];e.orderBy&&(a=function(y){return y.map(E=>function(b){return new Un(qe(b.field),function(V){switch(V){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(b.direction))}(E))}(e.orderBy));let c=null;e.limit&&(c=function(y){let E;return E=typeof y=="object"?y.value:y,zr(E)?null:E}(e.limit));let h=null;e.startAt&&(h=function(y){const E=!!y.before,S=y.values||[];return new Nr(S,E)}(e.startAt));let d=null;return e.endAt&&(d=function(y){const E=!y.before,S=y.values||[];return new Nr(S,E)}(e.endAt)),Tf(t,s,a,o,c,"F",h,d)}function sp(n,t){const e=function(s){switch(s){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return M(28987,{purpose:s})}}(t.purpose);return e==null?null:{"goog-listen-tags":e}}function Nc(n){return n.unaryFilter!==void 0?function(e){switch(e.unaryFilter.op){case"IS_NAN":const r=qe(e.unaryFilter.field);return at.create(r,"==",{doubleValue:NaN});case"IS_NULL":const s=qe(e.unaryFilter.field);return at.create(s,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const o=qe(e.unaryFilter.field);return at.create(o,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const a=qe(e.unaryFilter.field);return at.create(a,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return M(61313);default:return M(60726)}}(n):n.fieldFilter!==void 0?function(e){return at.create(qe(e.fieldFilter.field),function(s){switch(s){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return M(58110);default:return M(50506)}}(e.fieldFilter.op),e.fieldFilter.value)}(n):n.compositeFilter!==void 0?function(e){return Lt.create(e.compositeFilter.filters.map(r=>Nc(r)),function(s){switch(s){case"AND":return"and";case"OR":return"or";default:return M(1026)}}(e.compositeFilter.op))}(n):M(30097,{filter:n})}function ip(n){return Gf[n]}function op(n){return Kf[n]}function ap(n){return Wf[n]}function se(n){return{fieldPath:n.canonicalString()}}function qe(n){return pt.fromServerFormat(n.fieldPath)}function kc(n){return n instanceof at?function(e){if(e.op==="=="){if(Ma(e.value))return{unaryFilter:{field:se(e.field),op:"IS_NAN"}};if(xa(e.value))return{unaryFilter:{field:se(e.field),op:"IS_NULL"}}}else if(e.op==="!="){if(Ma(e.value))return{unaryFilter:{field:se(e.field),op:"IS_NOT_NAN"}};if(xa(e.value))return{unaryFilter:{field:se(e.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:se(e.field),op:op(e.op),value:e.value}}}(n):n instanceof Lt?function(e){const r=e.getFilters().map(s=>kc(s));return r.length===1?r[0]:{compositeFilter:{op:ap(e.op),filters:r}}}(n):M(54877,{filter:n})}function up(n){const t=[];return n.fields.forEach(e=>t.push(e.canonicalString())),{fieldPaths:t}}function Oc(n){return n.length>=4&&n.get(0)==="projects"&&n.get(2)==="databases"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class oe{constructor(t,e,r,s,o=U.min(),a=U.min(),c=mt.EMPTY_BYTE_STRING,h=null){this.target=t,this.targetId=e,this.purpose=r,this.sequenceNumber=s,this.snapshotVersion=o,this.lastLimboFreeSnapshotVersion=a,this.resumeToken=c,this.expectedCount=h}withSequenceNumber(t){return new oe(this.target,this.targetId,this.purpose,t,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(t,e){return new oe(this.target,this.targetId,this.purpose,this.sequenceNumber,e,this.lastLimboFreeSnapshotVersion,t,null)}withExpectedCount(t){return new oe(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,t)}withLastLimboFreeSnapshotVersion(t){return new oe(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,t,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cp{constructor(t){this.yt=t}}function lp(n){const t=rp({parent:n.parent,structuredQuery:n.structuredQuery});return n.limitType==="LAST"?ni(t,t.limit,"L"):t}/**
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
 */class hp{constructor(){this.Cn=new dp}addToCollectionParentIndex(t,e){return this.Cn.add(e),P.resolve()}getCollectionParents(t,e){return P.resolve(this.Cn.getEntries(e))}addFieldIndex(t,e){return P.resolve()}deleteFieldIndex(t,e){return P.resolve()}deleteAllFieldIndexes(t){return P.resolve()}createTargetIndexes(t,e){return P.resolve()}getDocumentsMatchingTarget(t,e){return P.resolve(null)}getIndexType(t,e){return P.resolve(0)}getFieldIndexes(t,e){return P.resolve([])}getNextCollectionGroupToUpdate(t){return P.resolve(null)}getMinOffset(t,e){return P.resolve(le.min())}getMinOffsetFromCollectionGroup(t,e){return P.resolve(le.min())}updateCollectionGroup(t,e,r){return P.resolve()}updateIndexEntries(t,e){return P.resolve()}}class dp{constructor(){this.index={}}add(t){const e=t.lastSegment(),r=t.popLast(),s=this.index[e]||new lt(X.comparator),o=!s.has(r);return this.index[e]=s.add(r),o}has(t){const e=t.lastSegment(),r=t.popLast(),s=this.index[e];return s&&s.has(r)}getEntries(t){return(this.index[t]||new lt(X.comparator)).toArray()}}/**
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
 */const Xa={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},xc=41943040;class Pt{static withCacheSize(t){return new Pt(t,Pt.DEFAULT_COLLECTION_PERCENTILE,Pt.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(t,e,r){this.cacheSizeCollectionThreshold=t,this.percentileToCollect=e,this.maximumSequenceNumbersToCollect=r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Pt.DEFAULT_COLLECTION_PERCENTILE=10,Pt.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,Pt.DEFAULT=new Pt(xc,Pt.DEFAULT_COLLECTION_PERCENTILE,Pt.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),Pt.DISABLED=new Pt(-1,0,0);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class We{constructor(t){this.ar=t}next(){return this.ar+=2,this.ar}static ur(){return new We(0)}static cr(){return new We(-1)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ya="LruGarbageCollector",fp=1048576;function Ja([n,t],[e,r]){const s=j(n,e);return s===0?j(t,r):s}class pp{constructor(t){this.Ir=t,this.buffer=new lt(Ja),this.Er=0}dr(){return++this.Er}Ar(t){const e=[t,this.dr()];if(this.buffer.size<this.Ir)this.buffer=this.buffer.add(e);else{const r=this.buffer.last();Ja(e,r)<0&&(this.buffer=this.buffer.delete(r).add(e))}}get maxValue(){return this.buffer.last()[0]}}class mp{constructor(t,e,r){this.garbageCollector=t,this.asyncQueue=e,this.localStore=r,this.Rr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.Vr(6e4)}stop(){this.Rr&&(this.Rr.cancel(),this.Rr=null)}get started(){return this.Rr!==null}Vr(t){O(Ya,`Garbage collection scheduled in ${t}ms`),this.Rr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",t,async()=>{this.Rr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(e){tn(e)?O(Ya,"Ignoring IndexedDB error during garbage collection: ",e):await Ze(e)}await this.Vr(3e5)})}}class gp{constructor(t,e){this.mr=t,this.params=e}calculateTargetCount(t,e){return this.mr.gr(t).next(r=>Math.floor(e/100*r))}nthSequenceNumber(t,e){if(e===0)return P.resolve($r.ce);const r=new pp(e);return this.mr.forEachTarget(t,s=>r.Ar(s.sequenceNumber)).next(()=>this.mr.pr(t,s=>r.Ar(s))).next(()=>r.maxValue)}removeTargets(t,e,r){return this.mr.removeTargets(t,e,r)}removeOrphanedDocuments(t,e){return this.mr.removeOrphanedDocuments(t,e)}collect(t,e){return this.params.cacheSizeCollectionThreshold===-1?(O("LruGarbageCollector","Garbage collection skipped; disabled"),P.resolve(Xa)):this.getCacheSize(t).next(r=>r<this.params.cacheSizeCollectionThreshold?(O("LruGarbageCollector",`Garbage collection skipped; Cache size ${r} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),Xa):this.yr(t,e))}getCacheSize(t){return this.mr.getCacheSize(t)}yr(t,e){let r,s,o,a,c,h,d;const p=Date.now();return this.calculateTargetCount(t,this.params.percentileToCollect).next(y=>(y>this.params.maximumSequenceNumbersToCollect?(O("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${y}`),s=this.params.maximumSequenceNumbersToCollect):s=y,a=Date.now(),this.nthSequenceNumber(t,s))).next(y=>(r=y,c=Date.now(),this.removeTargets(t,r,e))).next(y=>(o=y,h=Date.now(),this.removeOrphanedDocuments(t,r))).next(y=>(d=Date.now(),Ue()<=G.DEBUG&&O("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${a-p}ms
	Determined least recently used ${s} in `+(c-a)+`ms
	Removed ${o} targets in `+(h-c)+`ms
	Removed ${y} documents in `+(d-h)+`ms
Total Duration: ${d-p}ms`),P.resolve({didRun:!0,sequenceNumbersCollected:s,targetsRemoved:o,documentsRemoved:y})))}}function _p(n,t){return new gp(n,t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yp{constructor(){this.changes=new ke(t=>t.toString(),(t,e)=>t.isEqual(e)),this.changesApplied=!1}addEntry(t){this.assertNotApplied(),this.changes.set(t.key,t)}removeEntry(t,e){this.assertNotApplied(),this.changes.set(t,It.newInvalidDocument(t).setReadTime(e))}getEntry(t,e){this.assertNotApplied();const r=this.changes.get(e);return r!==void 0?P.resolve(r):this.getFromCache(t,e)}getEntries(t,e){return this.getAllFromCache(t,e)}apply(t){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(t)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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
 */class Ep{constructor(t,e){this.overlayedDocument=t,this.mutatedFields=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Tp{constructor(t,e,r,s){this.remoteDocumentCache=t,this.mutationQueue=e,this.documentOverlayCache=r,this.indexManager=s}getDocument(t,e){let r=null;return this.documentOverlayCache.getOverlay(t,e).next(s=>(r=s,this.remoteDocumentCache.getEntry(t,e))).next(s=>(r!==null&&Nn(r.mutation,s,kt.empty(),J.now()),s))}getDocuments(t,e){return this.remoteDocumentCache.getEntries(t,e).next(r=>this.getLocalViewOfDocuments(t,r,$()).next(()=>r))}getLocalViewOfDocuments(t,e,r=$()){const s=Re();return this.populateOverlays(t,s,e).next(()=>this.computeViews(t,e,s,r).next(o=>{let a=Rn();return o.forEach((c,h)=>{a=a.insert(c,h.overlayedDocument)}),a}))}getOverlayedDocuments(t,e){const r=Re();return this.populateOverlays(t,r,e).next(()=>this.computeViews(t,e,r,$()))}populateOverlays(t,e,r){const s=[];return r.forEach(o=>{e.has(o)||s.push(o)}),this.documentOverlayCache.getOverlays(t,s).next(o=>{o.forEach((a,c)=>{e.set(a,c)})})}computeViews(t,e,r,s){let o=Zt();const a=Dn(),c=function(){return Dn()}();return e.forEach((h,d)=>{const p=r.get(d.key);s.has(d.key)&&(p===void 0||p.mutation instanceof ye)?o=o.insert(d.key,d):p!==void 0?(a.set(d.key,p.mutation.getFieldMask()),Nn(p.mutation,d,p.mutation.getFieldMask(),J.now())):a.set(d.key,kt.empty())}),this.recalculateAndSaveOverlays(t,o).next(h=>(h.forEach((d,p)=>a.set(d,p)),e.forEach((d,p)=>c.set(d,new Ep(p,a.get(d)??null))),c))}recalculateAndSaveOverlays(t,e){const r=Dn();let s=new Z((a,c)=>a-c),o=$();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(t,e).next(a=>{for(const c of a)c.keys().forEach(h=>{const d=e.get(h);if(d===null)return;let p=r.get(h)||kt.empty();p=c.applyToLocalView(d,p),r.set(h,p);const y=(s.get(c.batchId)||$()).add(h);s=s.insert(c.batchId,y)})}).next(()=>{const a=[],c=s.getReverseIterator();for(;c.hasNext();){const h=c.getNext(),d=h.key,p=h.value,y=gc();p.forEach(E=>{if(!o.has(E)){const S=Ic(e.get(E),r.get(E));S!==null&&y.set(E,S),o=o.add(E)}}),a.push(this.documentOverlayCache.saveOverlays(t,d,y))}return P.waitFor(a)}).next(()=>r)}recalculateAndSaveOverlaysForDocumentKeys(t,e){return this.remoteDocumentCache.getEntries(t,e).next(r=>this.recalculateAndSaveOverlays(t,r))}getDocumentsMatchingQuery(t,e,r,s){return function(a){return x.isDocumentKey(a.path)&&a.collectionGroup===null&&a.filters.length===0}(e)?this.getDocumentsMatchingDocumentQuery(t,e.path):lc(e)?this.getDocumentsMatchingCollectionGroupQuery(t,e,r,s):this.getDocumentsMatchingCollectionQuery(t,e,r,s)}getNextDocuments(t,e,r,s){return this.remoteDocumentCache.getAllFromCollectionGroup(t,e,r,s).next(o=>{const a=s-o.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(t,e,r.largestBatchId,s-o.size):P.resolve(Re());let c=xn,h=o;return a.next(d=>P.forEach(d,(p,y)=>(c<y.largestBatchId&&(c=y.largestBatchId),o.get(p)?P.resolve():this.remoteDocumentCache.getEntry(t,p).next(E=>{h=h.insert(p,E)}))).next(()=>this.populateOverlays(t,d,o)).next(()=>this.computeViews(t,h,d,$())).next(p=>({batchId:c,changes:mc(p)})))})}getDocumentsMatchingDocumentQuery(t,e){return this.getDocument(t,new x(e)).next(r=>{let s=Rn();return r.isFoundDocument()&&(s=s.insert(r.key,r)),s})}getDocumentsMatchingCollectionGroupQuery(t,e,r,s){const o=e.collectionGroup;let a=Rn();return this.indexManager.getCollectionParents(t,o).next(c=>P.forEach(c,h=>{const d=function(y,E){return new en(E,null,y.explicitOrderBy.slice(),y.filters.slice(),y.limit,y.limitType,y.startAt,y.endAt)}(e,h.child(o));return this.getDocumentsMatchingCollectionQuery(t,d,r,s).next(p=>{p.forEach((y,E)=>{a=a.insert(y,E)})})}).next(()=>a))}getDocumentsMatchingCollectionQuery(t,e,r,s){let o;return this.documentOverlayCache.getOverlaysForCollection(t,e.path,r.largestBatchId).next(a=>(o=a,this.remoteDocumentCache.getDocumentsMatchingQuery(t,e,r,o,s))).next(a=>{o.forEach((h,d)=>{const p=d.getKey();a.get(p)===null&&(a=a.insert(p,It.newInvalidDocument(p)))});let c=Rn();return a.forEach((h,d)=>{const p=o.get(h);p!==void 0&&Nn(p.mutation,d,kt.empty(),J.now()),Wr(e,d)&&(c=c.insert(h,d))}),c})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wp{constructor(t){this.serializer=t,this.Lr=new Map,this.kr=new Map}getBundleMetadata(t,e){return P.resolve(this.Lr.get(e))}saveBundleMetadata(t,e){return this.Lr.set(e.id,function(s){return{id:s.id,version:s.version,createTime:$t(s.createTime)}}(e)),P.resolve()}getNamedQuery(t,e){return P.resolve(this.kr.get(e))}saveNamedQuery(t,e){return this.kr.set(e.name,function(s){return{name:s.name,query:lp(s.bundledQuery),readTime:$t(s.readTime)}}(e)),P.resolve()}}/**
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
 */class Ip{constructor(){this.overlays=new Z(x.comparator),this.qr=new Map}getOverlay(t,e){return P.resolve(this.overlays.get(e))}getOverlays(t,e){const r=Re();return P.forEach(e,s=>this.getOverlay(t,s).next(o=>{o!==null&&r.set(s,o)})).next(()=>r)}saveOverlays(t,e,r){return r.forEach((s,o)=>{this.St(t,e,o)}),P.resolve()}removeOverlaysForBatchId(t,e,r){const s=this.qr.get(r);return s!==void 0&&(s.forEach(o=>this.overlays=this.overlays.remove(o)),this.qr.delete(r)),P.resolve()}getOverlaysForCollection(t,e,r){const s=Re(),o=e.length+1,a=new x(e.child("")),c=this.overlays.getIteratorFrom(a);for(;c.hasNext();){const h=c.getNext().value,d=h.getKey();if(!e.isPrefixOf(d.path))break;d.path.length===o&&h.largestBatchId>r&&s.set(h.getKey(),h)}return P.resolve(s)}getOverlaysForCollectionGroup(t,e,r,s){let o=new Z((d,p)=>d-p);const a=this.overlays.getIterator();for(;a.hasNext();){const d=a.getNext().value;if(d.getKey().getCollectionGroup()===e&&d.largestBatchId>r){let p=o.get(d.largestBatchId);p===null&&(p=Re(),o=o.insert(d.largestBatchId,p)),p.set(d.getKey(),d)}}const c=Re(),h=o.getIterator();for(;h.hasNext()&&(h.getNext().value.forEach((d,p)=>c.set(d,p)),!(c.size()>=s)););return P.resolve(c)}St(t,e,r){const s=this.overlays.get(r.key);if(s!==null){const a=this.qr.get(s.largestBatchId).delete(r.key);this.qr.set(s.largestBatchId,a)}this.overlays=this.overlays.insert(r.key,new Uf(e,r));let o=this.qr.get(e);o===void 0&&(o=$(),this.qr.set(e,o)),this.qr.set(e,o.add(r.key))}}/**
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
 */class Ap{constructor(){this.sessionToken=mt.EMPTY_BYTE_STRING}getSessionToken(t){return P.resolve(this.sessionToken)}setSessionToken(t,e){return this.sessionToken=e,P.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ki{constructor(){this.Qr=new lt(ht.$r),this.Ur=new lt(ht.Kr)}isEmpty(){return this.Qr.isEmpty()}addReference(t,e){const r=new ht(t,e);this.Qr=this.Qr.add(r),this.Ur=this.Ur.add(r)}Wr(t,e){t.forEach(r=>this.addReference(r,e))}removeReference(t,e){this.Gr(new ht(t,e))}zr(t,e){t.forEach(r=>this.removeReference(r,e))}jr(t){const e=new x(new X([])),r=new ht(e,t),s=new ht(e,t+1),o=[];return this.Ur.forEachInRange([r,s],a=>{this.Gr(a),o.push(a.key)}),o}Jr(){this.Qr.forEach(t=>this.Gr(t))}Gr(t){this.Qr=this.Qr.delete(t),this.Ur=this.Ur.delete(t)}Hr(t){const e=new x(new X([])),r=new ht(e,t),s=new ht(e,t+1);let o=$();return this.Ur.forEachInRange([r,s],a=>{o=o.add(a.key)}),o}containsKey(t){const e=new ht(t,0),r=this.Qr.firstAfterOrEqual(e);return r!==null&&t.isEqual(r.key)}}class ht{constructor(t,e){this.key=t,this.Yr=e}static $r(t,e){return x.comparator(t.key,e.key)||j(t.Yr,e.Yr)}static Kr(t,e){return j(t.Yr,e.Yr)||x.comparator(t.key,e.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vp{constructor(t,e){this.indexManager=t,this.referenceDelegate=e,this.mutationQueue=[],this.tr=1,this.Zr=new lt(ht.$r)}checkEmpty(t){return P.resolve(this.mutationQueue.length===0)}addMutationBatch(t,e,r,s){const o=this.tr;this.tr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const a=new Ff(o,e,r,s);this.mutationQueue.push(a);for(const c of s)this.Zr=this.Zr.add(new ht(c.key,o)),this.indexManager.addToCollectionParentIndex(t,c.key.path.popLast());return P.resolve(a)}lookupMutationBatch(t,e){return P.resolve(this.Xr(e))}getNextMutationBatchAfterBatchId(t,e){const r=e+1,s=this.ei(r),o=s<0?0:s;return P.resolve(this.mutationQueue.length>o?this.mutationQueue[o]:null)}getHighestUnacknowledgedBatchId(){return P.resolve(this.mutationQueue.length===0?vi:this.tr-1)}getAllMutationBatches(t){return P.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(t,e){const r=new ht(e,0),s=new ht(e,Number.POSITIVE_INFINITY),o=[];return this.Zr.forEachInRange([r,s],a=>{const c=this.Xr(a.Yr);o.push(c)}),P.resolve(o)}getAllMutationBatchesAffectingDocumentKeys(t,e){let r=new lt(j);return e.forEach(s=>{const o=new ht(s,0),a=new ht(s,Number.POSITIVE_INFINITY);this.Zr.forEachInRange([o,a],c=>{r=r.add(c.Yr)})}),P.resolve(this.ti(r))}getAllMutationBatchesAffectingQuery(t,e){const r=e.path,s=r.length+1;let o=r;x.isDocumentKey(o)||(o=o.child(""));const a=new ht(new x(o),0);let c=new lt(j);return this.Zr.forEachWhile(h=>{const d=h.key.path;return!!r.isPrefixOf(d)&&(d.length===s&&(c=c.add(h.Yr)),!0)},a),P.resolve(this.ti(c))}ti(t){const e=[];return t.forEach(r=>{const s=this.Xr(r);s!==null&&e.push(s)}),e}removeMutationBatch(t,e){W(this.ni(e.batchId,"removed")===0,55003),this.mutationQueue.shift();let r=this.Zr;return P.forEach(e.mutations,s=>{const o=new ht(s.key,e.batchId);return r=r.delete(o),this.referenceDelegate.markPotentiallyOrphaned(t,s.key)}).next(()=>{this.Zr=r})}ir(t){}containsKey(t,e){const r=new ht(e,0),s=this.Zr.firstAfterOrEqual(r);return P.resolve(e.isEqual(s&&s.key))}performConsistencyCheck(t){return this.mutationQueue.length,P.resolve()}ni(t,e){return this.ei(t)}ei(t){return this.mutationQueue.length===0?0:t-this.mutationQueue[0].batchId}Xr(t){const e=this.ei(t);return e<0||e>=this.mutationQueue.length?null:this.mutationQueue[e]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rp{constructor(t){this.ri=t,this.docs=function(){return new Z(x.comparator)}(),this.size=0}setIndexManager(t){this.indexManager=t}addEntry(t,e){const r=e.key,s=this.docs.get(r),o=s?s.size:0,a=this.ri(e);return this.docs=this.docs.insert(r,{document:e.mutableCopy(),size:a}),this.size+=a-o,this.indexManager.addToCollectionParentIndex(t,r.path.popLast())}removeEntry(t){const e=this.docs.get(t);e&&(this.docs=this.docs.remove(t),this.size-=e.size)}getEntry(t,e){const r=this.docs.get(e);return P.resolve(r?r.document.mutableCopy():It.newInvalidDocument(e))}getEntries(t,e){let r=Zt();return e.forEach(s=>{const o=this.docs.get(s);r=r.insert(s,o?o.document.mutableCopy():It.newInvalidDocument(s))}),P.resolve(r)}getDocumentsMatchingQuery(t,e,r,s){let o=Zt();const a=e.path,c=new x(a.child("__id-9223372036854775808__")),h=this.docs.getIteratorFrom(c);for(;h.hasNext();){const{key:d,value:{document:p}}=h.getNext();if(!a.isPrefixOf(d.path))break;d.path.length>a.length+1||Xd(Qd(p),r)<=0||(s.has(p.key)||Wr(e,p))&&(o=o.insert(p.key,p.mutableCopy()))}return P.resolve(o)}getAllFromCollectionGroup(t,e,r,s){M(9500)}ii(t,e){return P.forEach(this.docs,r=>e(r))}newChangeBuffer(t){return new Sp(this)}getSize(t){return P.resolve(this.size)}}class Sp extends yp{constructor(t){super(),this.Nr=t}applyChanges(t){const e=[];return this.changes.forEach((r,s)=>{s.isValidDocument()?e.push(this.Nr.addEntry(t,s)):this.Nr.removeEntry(r)}),P.waitFor(e)}getFromCache(t,e){return this.Nr.getEntry(t,e)}getAllFromCache(t,e){return this.Nr.getEntries(t,e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cp{constructor(t){this.persistence=t,this.si=new ke(e=>Ci(e),Pi),this.lastRemoteSnapshotVersion=U.min(),this.highestTargetId=0,this.oi=0,this._i=new ki,this.targetCount=0,this.ai=We.ur()}forEachTarget(t,e){return this.si.forEach((r,s)=>e(s)),P.resolve()}getLastRemoteSnapshotVersion(t){return P.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(t){return P.resolve(this.oi)}allocateTargetId(t){return this.highestTargetId=this.ai.next(),P.resolve(this.highestTargetId)}setTargetsMetadata(t,e,r){return r&&(this.lastRemoteSnapshotVersion=r),e>this.oi&&(this.oi=e),P.resolve()}Pr(t){this.si.set(t.target,t);const e=t.targetId;e>this.highestTargetId&&(this.ai=new We(e),this.highestTargetId=e),t.sequenceNumber>this.oi&&(this.oi=t.sequenceNumber)}addTargetData(t,e){return this.Pr(e),this.targetCount+=1,P.resolve()}updateTargetData(t,e){return this.Pr(e),P.resolve()}removeTargetData(t,e){return this.si.delete(e.target),this._i.jr(e.targetId),this.targetCount-=1,P.resolve()}removeTargets(t,e,r){let s=0;const o=[];return this.si.forEach((a,c)=>{c.sequenceNumber<=e&&r.get(c.targetId)===null&&(this.si.delete(a),o.push(this.removeMatchingKeysForTargetId(t,c.targetId)),s++)}),P.waitFor(o).next(()=>s)}getTargetCount(t){return P.resolve(this.targetCount)}getTargetData(t,e){const r=this.si.get(e)||null;return P.resolve(r)}addMatchingKeys(t,e,r){return this._i.Wr(e,r),P.resolve()}removeMatchingKeys(t,e,r){this._i.zr(e,r);const s=this.persistence.referenceDelegate,o=[];return s&&e.forEach(a=>{o.push(s.markPotentiallyOrphaned(t,a))}),P.waitFor(o)}removeMatchingKeysForTargetId(t,e){return this._i.jr(e),P.resolve()}getMatchingKeysForTargetId(t,e){const r=this._i.Hr(e);return P.resolve(r)}containsKey(t,e){return P.resolve(this._i.containsKey(e))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mc{constructor(t,e){this.ui={},this.overlays={},this.ci=new $r(0),this.li=!1,this.li=!0,this.hi=new Ap,this.referenceDelegate=t(this),this.Pi=new Cp(this),this.indexManager=new hp,this.remoteDocumentCache=function(s){return new Rp(s)}(r=>this.referenceDelegate.Ti(r)),this.serializer=new cp(e),this.Ii=new wp(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.li=!1,Promise.resolve()}get started(){return this.li}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(t){return this.indexManager}getDocumentOverlayCache(t){let e=this.overlays[t.toKey()];return e||(e=new Ip,this.overlays[t.toKey()]=e),e}getMutationQueue(t,e){let r=this.ui[t.toKey()];return r||(r=new vp(e,this.referenceDelegate),this.ui[t.toKey()]=r),r}getGlobalsCache(){return this.hi}getTargetCache(){return this.Pi}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Ii}runTransaction(t,e,r){O("MemoryPersistence","Starting transaction:",t);const s=new Pp(this.ci.next());return this.referenceDelegate.Ei(),r(s).next(o=>this.referenceDelegate.di(s).next(()=>o)).toPromise().then(o=>(s.raiseOnCommittedEvent(),o))}Ai(t,e){return P.or(Object.values(this.ui).map(r=>()=>r.containsKey(t,e)))}}class Pp extends Jd{constructor(t){super(),this.currentSequenceNumber=t}}class Oi{constructor(t){this.persistence=t,this.Ri=new ki,this.Vi=null}static mi(t){return new Oi(t)}get fi(){if(this.Vi)return this.Vi;throw M(60996)}addReference(t,e,r){return this.Ri.addReference(r,e),this.fi.delete(r.toString()),P.resolve()}removeReference(t,e,r){return this.Ri.removeReference(r,e),this.fi.add(r.toString()),P.resolve()}markPotentiallyOrphaned(t,e){return this.fi.add(e.toString()),P.resolve()}removeTarget(t,e){this.Ri.jr(e.targetId).forEach(s=>this.fi.add(s.toString()));const r=this.persistence.getTargetCache();return r.getMatchingKeysForTargetId(t,e.targetId).next(s=>{s.forEach(o=>this.fi.add(o.toString()))}).next(()=>r.removeTargetData(t,e))}Ei(){this.Vi=new Set}di(t){const e=this.persistence.getRemoteDocumentCache().newChangeBuffer();return P.forEach(this.fi,r=>{const s=x.fromPath(r);return this.gi(t,s).next(o=>{o||e.removeEntry(s,U.min())})}).next(()=>(this.Vi=null,e.apply(t)))}updateLimboDocument(t,e){return this.gi(t,e).next(r=>{r?this.fi.delete(e.toString()):this.fi.add(e.toString())})}Ti(t){return 0}gi(t,e){return P.or([()=>P.resolve(this.Ri.containsKey(e)),()=>this.persistence.getTargetCache().containsKey(t,e),()=>this.persistence.Ai(t,e)])}}class xr{constructor(t,e){this.persistence=t,this.pi=new ke(r=>ef(r.path),(r,s)=>r.isEqual(s)),this.garbageCollector=_p(this,e)}static mi(t,e){return new xr(t,e)}Ei(){}di(t){return P.resolve()}forEachTarget(t,e){return this.persistence.getTargetCache().forEachTarget(t,e)}gr(t){const e=this.wr(t);return this.persistence.getTargetCache().getTargetCount(t).next(r=>e.next(s=>r+s))}wr(t){let e=0;return this.pr(t,r=>{e++}).next(()=>e)}pr(t,e){return P.forEach(this.pi,(r,s)=>this.br(t,r,s).next(o=>o?P.resolve():e(s)))}removeTargets(t,e,r){return this.persistence.getTargetCache().removeTargets(t,e,r)}removeOrphanedDocuments(t,e){let r=0;const s=this.persistence.getRemoteDocumentCache(),o=s.newChangeBuffer();return s.ii(t,a=>this.br(t,a,e).next(c=>{c||(r++,o.removeEntry(a,U.min()))})).next(()=>o.apply(t)).next(()=>r)}markPotentiallyOrphaned(t,e){return this.pi.set(e,t.currentSequenceNumber),P.resolve()}removeTarget(t,e){const r=e.withSequenceNumber(t.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(t,r)}addReference(t,e,r){return this.pi.set(r,t.currentSequenceNumber),P.resolve()}removeReference(t,e,r){return this.pi.set(r,t.currentSequenceNumber),P.resolve()}updateLimboDocument(t,e){return this.pi.set(e,t.currentSequenceNumber),P.resolve()}Ti(t){let e=t.key.toString().length;return t.isFoundDocument()&&(e+=Ir(t.data.value)),e}br(t,e,r){return P.or([()=>this.persistence.Ai(t,e),()=>this.persistence.getTargetCache().containsKey(t,e),()=>{const s=this.pi.get(e);return P.resolve(s!==void 0&&s>r)}])}getCacheSize(t){return this.persistence.getRemoteDocumentCache().getSize(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xi{constructor(t,e,r,s){this.targetId=t,this.fromCache=e,this.Es=r,this.ds=s}static As(t,e){let r=$(),s=$();for(const o of e.docChanges)switch(o.type){case 0:r=r.add(o.doc.key);break;case 1:s=s.add(o.doc.key)}return new xi(t,e.fromCache,r,s)}}/**
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
 */class bp{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(t){this._documentReadCount+=t}}/**
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
 */class Vp{constructor(){this.Rs=!1,this.Vs=!1,this.fs=100,this.gs=function(){return Nh()?8:Zd(Vh())>0?6:4}()}initialize(t,e){this.ps=t,this.indexManager=e,this.Rs=!0}getDocumentsMatchingQuery(t,e,r,s){const o={result:null};return this.ys(t,e).next(a=>{o.result=a}).next(()=>{if(!o.result)return this.ws(t,e,s,r).next(a=>{o.result=a})}).next(()=>{if(o.result)return;const a=new bp;return this.Ss(t,e,a).next(c=>{if(o.result=c,this.Vs)return this.bs(t,e,a,c.size)})}).next(()=>o.result)}bs(t,e,r,s){return r.documentReadCount<this.fs?(Ue()<=G.DEBUG&&O("QueryEngine","SDK will not create cache indexes for query:",Be(e),"since it only creates cache indexes for collection contains","more than or equal to",this.fs,"documents"),P.resolve()):(Ue()<=G.DEBUG&&O("QueryEngine","Query:",Be(e),"scans",r.documentReadCount,"local documents and returns",s,"documents as results."),r.documentReadCount>this.gs*s?(Ue()<=G.DEBUG&&O("QueryEngine","The SDK decides to create cache indexes for query:",Be(e),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(t,jt(e))):P.resolve())}ys(t,e){if(Ba(e))return P.resolve(null);let r=jt(e);return this.indexManager.getIndexType(t,r).next(s=>s===0?null:(e.limit!==null&&s===1&&(e=ni(e,null,"F"),r=jt(e)),this.indexManager.getDocumentsMatchingTarget(t,r).next(o=>{const a=$(...o);return this.ps.getDocuments(t,a).next(c=>this.indexManager.getMinOffset(t,r).next(h=>{const d=this.Ds(e,c);return this.Cs(e,d,a,h.readTime)?this.ys(t,ni(e,null,"F")):this.vs(t,d,e,h)}))})))}ws(t,e,r,s){return Ba(e)||s.isEqual(U.min())?P.resolve(null):this.ps.getDocuments(t,r).next(o=>{const a=this.Ds(e,o);return this.Cs(e,a,r,s)?P.resolve(null):(Ue()<=G.DEBUG&&O("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),Be(e)),this.vs(t,a,e,Wd(s,xn)).next(c=>c))})}Ds(t,e){let r=new lt(fc(t));return e.forEach((s,o)=>{Wr(t,o)&&(r=r.add(o))}),r}Cs(t,e,r,s){if(t.limit===null)return!1;if(r.size!==e.size)return!0;const o=t.limitType==="F"?e.last():e.first();return!!o&&(o.hasPendingWrites||o.version.compareTo(s)>0)}Ss(t,e,r){return Ue()<=G.DEBUG&&O("QueryEngine","Using full collection scan to execute query:",Be(e)),this.ps.getDocumentsMatchingQuery(t,e,le.min(),r)}vs(t,e,r,s){return this.ps.getDocumentsMatchingQuery(t,r,s).next(o=>(e.forEach(a=>{o=o.insert(a.key,a)}),o))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mi="LocalStore",Dp=3e8;class Np{constructor(t,e,r,s){this.persistence=t,this.Fs=e,this.serializer=s,this.Ms=new Z(j),this.xs=new ke(o=>Ci(o),Pi),this.Os=new Map,this.Ns=t.getRemoteDocumentCache(),this.Pi=t.getTargetCache(),this.Ii=t.getBundleCache(),this.Bs(r)}Bs(t){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(t),this.indexManager=this.persistence.getIndexManager(t),this.mutationQueue=this.persistence.getMutationQueue(t,this.indexManager),this.localDocuments=new Tp(this.Ns,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Ns.setIndexManager(this.indexManager),this.Fs.initialize(this.localDocuments,this.indexManager)}collectGarbage(t){return this.persistence.runTransaction("Collect garbage","readwrite-primary",e=>t.collect(e,this.Ms))}}function kp(n,t,e,r){return new Np(n,t,e,r)}async function Lc(n,t){const e=L(n);return await e.persistence.runTransaction("Handle user change","readonly",r=>{let s;return e.mutationQueue.getAllMutationBatches(r).next(o=>(s=o,e.Bs(t),e.mutationQueue.getAllMutationBatches(r))).next(o=>{const a=[],c=[];let h=$();for(const d of s){a.push(d.batchId);for(const p of d.mutations)h=h.add(p.key)}for(const d of o){c.push(d.batchId);for(const p of d.mutations)h=h.add(p.key)}return e.localDocuments.getDocuments(r,h).next(d=>({Ls:d,removedBatchIds:a,addedBatchIds:c}))})})}function Op(n,t){const e=L(n);return e.persistence.runTransaction("Acknowledge batch","readwrite-primary",r=>{const s=t.batch.keys(),o=e.Ns.newChangeBuffer({trackRemovals:!0});return function(c,h,d,p){const y=d.batch,E=y.keys();let S=P.resolve();return E.forEach(b=>{S=S.next(()=>p.getEntry(h,b)).next(N=>{const V=d.docVersions.get(b);W(V!==null,48541),N.version.compareTo(V)<0&&(y.applyToRemoteDocument(N,d),N.isValidDocument()&&(N.setReadTime(d.commitVersion),p.addEntry(N)))})}),S.next(()=>c.mutationQueue.removeMutationBatch(h,y))}(e,r,t,o).next(()=>o.apply(r)).next(()=>e.mutationQueue.performConsistencyCheck(r)).next(()=>e.documentOverlayCache.removeOverlaysForBatchId(r,s,t.batch.batchId)).next(()=>e.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(r,function(c){let h=$();for(let d=0;d<c.mutationResults.length;++d)c.mutationResults[d].transformResults.length>0&&(h=h.add(c.batch.mutations[d].key));return h}(t))).next(()=>e.localDocuments.getDocuments(r,s))})}function Fc(n){const t=L(n);return t.persistence.runTransaction("Get last remote snapshot version","readonly",e=>t.Pi.getLastRemoteSnapshotVersion(e))}function xp(n,t){const e=L(n),r=t.snapshotVersion;let s=e.Ms;return e.persistence.runTransaction("Apply remote event","readwrite-primary",o=>{const a=e.Ns.newChangeBuffer({trackRemovals:!0});s=e.Ms;const c=[];t.targetChanges.forEach((p,y)=>{const E=s.get(y);if(!E)return;c.push(e.Pi.removeMatchingKeys(o,p.removedDocuments,y).next(()=>e.Pi.addMatchingKeys(o,p.addedDocuments,y)));let S=E.withSequenceNumber(o.currentSequenceNumber);t.targetMismatches.get(y)!==null?S=S.withResumeToken(mt.EMPTY_BYTE_STRING,U.min()).withLastLimboFreeSnapshotVersion(U.min()):p.resumeToken.approximateByteSize()>0&&(S=S.withResumeToken(p.resumeToken,r)),s=s.insert(y,S),function(N,V,q){return N.resumeToken.approximateByteSize()===0||V.snapshotVersion.toMicroseconds()-N.snapshotVersion.toMicroseconds()>=Dp?!0:q.addedDocuments.size+q.modifiedDocuments.size+q.removedDocuments.size>0}(E,S,p)&&c.push(e.Pi.updateTargetData(o,S))});let h=Zt(),d=$();if(t.documentUpdates.forEach(p=>{t.resolvedLimboDocuments.has(p)&&c.push(e.persistence.referenceDelegate.updateLimboDocument(o,p))}),c.push(Mp(o,a,t.documentUpdates).next(p=>{h=p.ks,d=p.qs})),!r.isEqual(U.min())){const p=e.Pi.getLastRemoteSnapshotVersion(o).next(y=>e.Pi.setTargetsMetadata(o,o.currentSequenceNumber,r));c.push(p)}return P.waitFor(c).next(()=>a.apply(o)).next(()=>e.localDocuments.getLocalViewOfDocuments(o,h,d)).next(()=>h)}).then(o=>(e.Ms=s,o))}function Mp(n,t,e){let r=$(),s=$();return e.forEach(o=>r=r.add(o)),t.getEntries(n,r).next(o=>{let a=Zt();return e.forEach((c,h)=>{const d=o.get(c);h.isFoundDocument()!==d.isFoundDocument()&&(s=s.add(c)),h.isNoDocument()&&h.version.isEqual(U.min())?(t.removeEntry(c,h.readTime),a=a.insert(c,h)):!d.isValidDocument()||h.version.compareTo(d.version)>0||h.version.compareTo(d.version)===0&&d.hasPendingWrites?(t.addEntry(h),a=a.insert(c,h)):O(Mi,"Ignoring outdated watch update for ",c,". Current version:",d.version," Watch version:",h.version)}),{ks:a,qs:s}})}function Lp(n,t){const e=L(n);return e.persistence.runTransaction("Get next mutation batch","readonly",r=>(t===void 0&&(t=vi),e.mutationQueue.getNextMutationBatchAfterBatchId(r,t)))}function Fp(n,t){const e=L(n);return e.persistence.runTransaction("Allocate target","readwrite",r=>{let s;return e.Pi.getTargetData(r,t).next(o=>o?(s=o,P.resolve(s)):e.Pi.allocateTargetId(r).next(a=>(s=new oe(t,a,"TargetPurposeListen",r.currentSequenceNumber),e.Pi.addTargetData(r,s).next(()=>s))))}).then(r=>{const s=e.Ms.get(r.targetId);return(s===null||r.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(e.Ms=e.Ms.insert(r.targetId,r),e.xs.set(t,r.targetId)),r})}async function ai(n,t,e){const r=L(n),s=r.Ms.get(t),o=e?"readwrite":"readwrite-primary";try{e||await r.persistence.runTransaction("Release target",o,a=>r.persistence.referenceDelegate.removeTarget(a,s))}catch(a){if(!tn(a))throw a;O(Mi,`Failed to update sequence numbers for target ${t}: ${a}`)}r.Ms=r.Ms.remove(t),r.xs.delete(s.target)}function Za(n,t,e){const r=L(n);let s=U.min(),o=$();return r.persistence.runTransaction("Execute query","readwrite",a=>function(h,d,p){const y=L(h),E=y.xs.get(p);return E!==void 0?P.resolve(y.Ms.get(E)):y.Pi.getTargetData(d,p)}(r,a,jt(t)).next(c=>{if(c)return s=c.lastLimboFreeSnapshotVersion,r.Pi.getMatchingKeysForTargetId(a,c.targetId).next(h=>{o=h})}).next(()=>r.Fs.getDocumentsMatchingQuery(a,t,e?s:U.min(),e?o:$())).next(c=>(Up(r,If(t),c),{documents:c,Qs:o})))}function Up(n,t,e){let r=n.Os.get(t)||U.min();e.forEach((s,o)=>{o.readTime.compareTo(r)>0&&(r=o.readTime)}),n.Os.set(t,r)}class tu{constructor(){this.activeTargetIds=Pf()}zs(t){this.activeTargetIds=this.activeTargetIds.add(t)}js(t){this.activeTargetIds=this.activeTargetIds.delete(t)}Gs(){const t={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(t)}}class Bp{constructor(){this.Mo=new tu,this.xo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(t){}updateMutationState(t,e,r){}addLocalQueryTarget(t,e=!0){return e&&this.Mo.zs(t),this.xo[t]||"not-current"}updateQueryState(t,e,r){this.xo[t]=e}removeLocalQueryTarget(t){this.Mo.js(t)}isLocalQueryTarget(t){return this.Mo.activeTargetIds.has(t)}clearQueryState(t){delete this.xo[t]}getAllActiveQueryTargets(){return this.Mo.activeTargetIds}isActiveQueryTarget(t){return this.Mo.activeTargetIds.has(t)}start(){return this.Mo=new tu,Promise.resolve()}handleUserChange(t,e,r){}setOnlineState(t){}shutdown(){}writeSequenceNumber(t){}notifyBundleLoaded(t){}}/**
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
 */class qp{Oo(t){}shutdown(){}}/**
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
 */const eu="ConnectivityMonitor";class nu{constructor(){this.No=()=>this.Bo(),this.Lo=()=>this.ko(),this.qo=[],this.Qo()}Oo(t){this.qo.push(t)}shutdown(){window.removeEventListener("online",this.No),window.removeEventListener("offline",this.Lo)}Qo(){window.addEventListener("online",this.No),window.addEventListener("offline",this.Lo)}Bo(){O(eu,"Network connectivity changed: AVAILABLE");for(const t of this.qo)t(0)}ko(){O(eu,"Network connectivity changed: UNAVAILABLE");for(const t of this.qo)t(1)}static v(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
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
 */let yr=null;function ui(){return yr===null?yr=function(){return 268435456+Math.round(2147483648*Math.random())}():yr++,"0x"+yr.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fs="RestConnection",jp={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};class $p{get $o(){return!1}constructor(t){this.databaseInfo=t,this.databaseId=t.databaseId;const e=t.ssl?"https":"http",r=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.Uo=e+"://"+t.host,this.Ko=`projects/${r}/databases/${s}`,this.Wo=this.databaseId.database===Xs?`project_id=${r}`:`project_id=${r}&database_id=${s}`}Go(t,e,r,s,o){const a=ui(),c=this.zo(t,e.toUriEncodedString());O(Fs,`Sending RPC '${t}' ${a}:`,c,r);const h={"google-cloud-resource-prefix":this.Ko,"x-goog-request-params":this.Wo};this.jo(h,s,o);const{host:d}=new URL(c),p=Ye(d);return this.Jo(t,c,h,r,p).then(y=>(O(Fs,`Received RPC '${t}' ${a}: `,y),y),y=>{throw ze(Fs,`RPC '${t}' ${a} failed with error: `,y,"url: ",c,"request:",r),y})}Ho(t,e,r,s,o,a){return this.Go(t,e,r,s,o)}jo(t,e,r){t["X-Goog-Api-Client"]=function(){return"gl-js/ fire/"+Je}(),t["Content-Type"]="text/plain",this.databaseInfo.appId&&(t["X-Firebase-GMPID"]=this.databaseInfo.appId),e&&e.headers.forEach((s,o)=>t[o]=s),r&&r.headers.forEach((s,o)=>t[o]=s)}zo(t,e){const r=jp[t];return`${this.Uo}/v1/${e}:${r}`}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zp{constructor(t){this.Yo=t.Yo,this.Zo=t.Zo}Xo(t){this.e_=t}t_(t){this.n_=t}r_(t){this.i_=t}onMessage(t){this.s_=t}close(){this.Zo()}send(t){this.Yo(t)}o_(){this.e_()}__(){this.n_()}a_(t){this.i_(t)}u_(t){this.s_(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Tt="WebChannelConnection";class Hp extends $p{constructor(t){super(t),this.c_=[],this.forceLongPolling=t.forceLongPolling,this.autoDetectLongPolling=t.autoDetectLongPolling,this.useFetchStreams=t.useFetchStreams,this.longPollingOptions=t.longPollingOptions}Jo(t,e,r,s,o){const a=ui();return new Promise((c,h)=>{const d=new Uu;d.setWithCredentials(!0),d.listenOnce(Bu.COMPLETE,()=>{try{switch(d.getLastErrorCode()){case wr.NO_ERROR:const y=d.getResponseJson();O(Tt,`XHR for RPC '${t}' ${a} received:`,JSON.stringify(y)),c(y);break;case wr.TIMEOUT:O(Tt,`RPC '${t}' ${a} timed out`),h(new k(C.DEADLINE_EXCEEDED,"Request time out"));break;case wr.HTTP_ERROR:const E=d.getStatus();if(O(Tt,`RPC '${t}' ${a} failed with status:`,E,"response text:",d.getResponseText()),E>0){let S=d.getResponseJson();Array.isArray(S)&&(S=S[0]);const b=S==null?void 0:S.error;if(b&&b.status&&b.message){const N=function(q){const F=q.toLowerCase().replace(/_/g,"-");return Object.values(C).indexOf(F)>=0?F:C.UNKNOWN}(b.status);h(new k(N,b.message))}else h(new k(C.UNKNOWN,"Server responded with status "+d.getStatus()))}else h(new k(C.UNAVAILABLE,"Connection failed."));break;default:M(9055,{l_:t,streamId:a,h_:d.getLastErrorCode(),P_:d.getLastError()})}}finally{O(Tt,`RPC '${t}' ${a} completed.`)}});const p=JSON.stringify(s);O(Tt,`RPC '${t}' ${a} sending request:`,s),d.send(e,"POST",p,r,15)})}T_(t,e,r){const s=ui(),o=[this.Uo,"/","google.firestore.v1.Firestore","/",t,"/channel"],a=$u(),c=ju(),h={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},d=this.longPollingOptions.timeoutSeconds;d!==void 0&&(h.longPollingTimeout=Math.round(1e3*d)),this.useFetchStreams&&(h.useFetchStreams=!0),this.jo(h.initMessageHeaders,e,r),h.encodeInitMessageHeaders=!0;const p=o.join("");O(Tt,`Creating RPC '${t}' stream ${s}: ${p}`,h);const y=a.createWebChannel(p,h);this.I_(y);let E=!1,S=!1;const b=new zp({Yo:V=>{S?O(Tt,`Not sending because RPC '${t}' stream ${s} is closed:`,V):(E||(O(Tt,`Opening RPC '${t}' stream ${s} transport.`),y.open(),E=!0),O(Tt,`RPC '${t}' stream ${s} sending:`,V),y.send(V))},Zo:()=>y.close()}),N=(V,q,F)=>{V.listen(q,B=>{try{F(B)}catch(z){setTimeout(()=>{throw z},0)}})};return N(y,vn.EventType.OPEN,()=>{S||(O(Tt,`RPC '${t}' stream ${s} transport opened.`),b.o_())}),N(y,vn.EventType.CLOSE,()=>{S||(S=!0,O(Tt,`RPC '${t}' stream ${s} transport closed`),b.a_(),this.E_(y))}),N(y,vn.EventType.ERROR,V=>{S||(S=!0,ze(Tt,`RPC '${t}' stream ${s} transport errored. Name:`,V.name,"Message:",V.message),b.a_(new k(C.UNAVAILABLE,"The operation could not be completed")))}),N(y,vn.EventType.MESSAGE,V=>{var q;if(!S){const F=V.data[0];W(!!F,16349);const B=F,z=(B==null?void 0:B.error)||((q=B[0])==null?void 0:q.error);if(z){O(Tt,`RPC '${t}' stream ${s} received error:`,z);const Ct=z.status;let st=function(_){const T=ot[_];if(T!==void 0)return vc(T)}(Ct),I=z.message;st===void 0&&(st=C.INTERNAL,I="Unknown error status: "+Ct+" with message "+z.message),S=!0,b.a_(new k(st,I)),y.close()}else O(Tt,`RPC '${t}' stream ${s} received:`,F),b.u_(F)}}),N(c,qu.STAT_EVENT,V=>{V.stat===Ks.PROXY?O(Tt,`RPC '${t}' stream ${s} detected buffering proxy`):V.stat===Ks.NOPROXY&&O(Tt,`RPC '${t}' stream ${s} detected no buffering proxy`)}),setTimeout(()=>{b.__()},0),b}terminate(){this.c_.forEach(t=>t.close()),this.c_=[]}I_(t){this.c_.push(t)}E_(t){this.c_=this.c_.filter(e=>e===t)}}function Us(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zr(n){return new Qf(n,!0)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Uc{constructor(t,e,r=1e3,s=1.5,o=6e4){this.Mi=t,this.timerId=e,this.d_=r,this.A_=s,this.R_=o,this.V_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.V_=0}g_(){this.V_=this.R_}p_(t){this.cancel();const e=Math.floor(this.V_+this.y_()),r=Math.max(0,Date.now()-this.f_),s=Math.max(0,e-r);s>0&&O("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.V_} ms, delay with jitter: ${e} ms, last attempt: ${r} ms ago)`),this.m_=this.Mi.enqueueAfterDelay(this.timerId,s,()=>(this.f_=Date.now(),t())),this.V_*=this.A_,this.V_<this.d_&&(this.V_=this.d_),this.V_>this.R_&&(this.V_=this.R_)}w_(){this.m_!==null&&(this.m_.skipDelay(),this.m_=null)}cancel(){this.m_!==null&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.V_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ru="PersistentStream";class Bc{constructor(t,e,r,s,o,a,c,h){this.Mi=t,this.S_=r,this.b_=s,this.connection=o,this.authCredentialsProvider=a,this.appCheckCredentialsProvider=c,this.listener=h,this.state=0,this.D_=0,this.C_=null,this.v_=null,this.stream=null,this.F_=0,this.M_=new Uc(t,e)}x_(){return this.state===1||this.state===5||this.O_()}O_(){return this.state===2||this.state===3}start(){this.F_=0,this.state!==4?this.auth():this.N_()}async stop(){this.x_()&&await this.close(0)}B_(){this.state=0,this.M_.reset()}L_(){this.O_()&&this.C_===null&&(this.C_=this.Mi.enqueueAfterDelay(this.S_,6e4,()=>this.k_()))}q_(t){this.Q_(),this.stream.send(t)}async k_(){if(this.O_())return this.close(0)}Q_(){this.C_&&(this.C_.cancel(),this.C_=null)}U_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(t,e){this.Q_(),this.U_(),this.M_.cancel(),this.D_++,t!==4?this.M_.reset():e&&e.code===C.RESOURCE_EXHAUSTED?(Jt(e.toString()),Jt("Using maximum backoff delay to prevent overloading the backend."),this.M_.g_()):e&&e.code===C.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.K_(),this.stream.close(),this.stream=null),this.state=t,await this.listener.r_(e)}K_(){}auth(){this.state=1;const t=this.W_(this.D_),e=this.D_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([r,s])=>{this.D_===e&&this.G_(r,s)},r=>{t(()=>{const s=new k(C.UNKNOWN,"Fetching auth token failed: "+r.message);return this.z_(s)})})}G_(t,e){const r=this.W_(this.D_);this.stream=this.j_(t,e),this.stream.Xo(()=>{r(()=>this.listener.Xo())}),this.stream.t_(()=>{r(()=>(this.state=2,this.v_=this.Mi.enqueueAfterDelay(this.b_,1e4,()=>(this.O_()&&(this.state=3),Promise.resolve())),this.listener.t_()))}),this.stream.r_(s=>{r(()=>this.z_(s))}),this.stream.onMessage(s=>{r(()=>++this.F_==1?this.J_(s):this.onNext(s))})}N_(){this.state=5,this.M_.p_(async()=>{this.state=0,this.start()})}z_(t){return O(ru,`close with error: ${t}`),this.stream=null,this.close(4,t)}W_(t){return e=>{this.Mi.enqueueAndForget(()=>this.D_===t?e():(O(ru,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}}class Gp extends Bc{constructor(t,e,r,s,o,a){super(t,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",e,r,s,a),this.serializer=o}j_(t,e){return this.connection.T_("Listen",t,e)}J_(t){return this.onNext(t)}onNext(t){this.M_.reset();const e=Jf(this.serializer,t),r=function(o){if(!("targetChange"in o))return U.min();const a=o.targetChange;return a.targetIds&&a.targetIds.length?U.min():a.readTime?$t(a.readTime):U.min()}(t);return this.listener.H_(e,r)}Y_(t){const e={};e.database=oi(this.serializer),e.addTarget=function(o,a){let c;const h=a.target;if(c=ti(h)?{documents:ep(o,h)}:{query:Dc(o,h).ft},c.targetId=a.targetId,a.resumeToken.approximateByteSize()>0){c.resumeToken=Cc(o,a.resumeToken);const d=ri(o,a.expectedCount);d!==null&&(c.expectedCount=d)}else if(a.snapshotVersion.compareTo(U.min())>0){c.readTime=Or(o,a.snapshotVersion.toTimestamp());const d=ri(o,a.expectedCount);d!==null&&(c.expectedCount=d)}return c}(this.serializer,t);const r=sp(this.serializer,t);r&&(e.labels=r),this.q_(e)}Z_(t){const e={};e.database=oi(this.serializer),e.removeTarget=t,this.q_(e)}}class Kp extends Bc{constructor(t,e,r,s,o,a){super(t,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",e,r,s,a),this.serializer=o}get X_(){return this.F_>0}start(){this.lastStreamToken=void 0,super.start()}K_(){this.X_&&this.ea([])}j_(t,e){return this.connection.T_("Write",t,e)}J_(t){return W(!!t.streamToken,31322),this.lastStreamToken=t.streamToken,W(!t.writeResults||t.writeResults.length===0,55816),this.listener.ta()}onNext(t){W(!!t.streamToken,12678),this.lastStreamToken=t.streamToken,this.M_.reset();const e=tp(t.writeResults,t.commitTime),r=$t(t.commitTime);return this.listener.na(r,e)}ra(){const t={};t.database=oi(this.serializer),this.q_(t)}ea(t){const e={streamToken:this.lastStreamToken,writes:t.map(r=>Zf(this.serializer,r))};this.q_(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wp{}class Qp extends Wp{constructor(t,e,r,s){super(),this.authCredentials=t,this.appCheckCredentials=e,this.connection=r,this.serializer=s,this.ia=!1}sa(){if(this.ia)throw new k(C.FAILED_PRECONDITION,"The client has already been terminated.")}Go(t,e,r,s){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([o,a])=>this.connection.Go(t,si(e,r),s,o,a)).catch(o=>{throw o.name==="FirebaseError"?(o.code===C.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new k(C.UNKNOWN,o.toString())})}Ho(t,e,r,s,o){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([a,c])=>this.connection.Ho(t,si(e,r),s,a,c,o)).catch(a=>{throw a.name==="FirebaseError"?(a.code===C.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),a):new k(C.UNKNOWN,a.toString())})}terminate(){this.ia=!0,this.connection.terminate()}}class Xp{constructor(t,e){this.asyncQueue=t,this.onlineStateHandler=e,this.state="Unknown",this.oa=0,this._a=null,this.aa=!0}ua(){this.oa===0&&(this.ca("Unknown"),this._a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this._a=null,this.la("Backend didn't respond within 10 seconds."),this.ca("Offline"),Promise.resolve())))}ha(t){this.state==="Online"?this.ca("Unknown"):(this.oa++,this.oa>=1&&(this.Pa(),this.la(`Connection failed 1 times. Most recent error: ${t.toString()}`),this.ca("Offline")))}set(t){this.Pa(),this.oa=0,t==="Online"&&(this.aa=!1),this.ca(t)}ca(t){t!==this.state&&(this.state=t,this.onlineStateHandler(t))}la(t){const e=`Could not reach Cloud Firestore backend. ${t}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.aa?(Jt(e),this.aa=!1):O("OnlineStateTracker",e)}Pa(){this._a!==null&&(this._a.cancel(),this._a=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const De="RemoteStore";class Yp{constructor(t,e,r,s,o){this.localStore=t,this.datastore=e,this.asyncQueue=r,this.remoteSyncer={},this.Ta=[],this.Ia=new Map,this.Ea=new Set,this.da=[],this.Aa=o,this.Aa.Oo(a=>{r.enqueueAndForget(async()=>{Oe(this)&&(O(De,"Restarting streams for network reachability change."),await async function(h){const d=L(h);d.Ea.add(4),await Gn(d),d.Ra.set("Unknown"),d.Ea.delete(4),await ts(d)}(this))})}),this.Ra=new Xp(r,s)}}async function ts(n){if(Oe(n))for(const t of n.da)await t(!0)}async function Gn(n){for(const t of n.da)await t(!1)}function qc(n,t){const e=L(n);e.Ia.has(t.targetId)||(e.Ia.set(t.targetId,t),Bi(e)?Ui(e):nn(e).O_()&&Fi(e,t))}function Li(n,t){const e=L(n),r=nn(e);e.Ia.delete(t),r.O_()&&jc(e,t),e.Ia.size===0&&(r.O_()?r.L_():Oe(e)&&e.Ra.set("Unknown"))}function Fi(n,t){if(n.Va.Ue(t.targetId),t.resumeToken.approximateByteSize()>0||t.snapshotVersion.compareTo(U.min())>0){const e=n.remoteSyncer.getRemoteKeysForTarget(t.targetId).size;t=t.withExpectedCount(e)}nn(n).Y_(t)}function jc(n,t){n.Va.Ue(t),nn(n).Z_(t)}function Ui(n){n.Va=new Hf({getRemoteKeysForTarget:t=>n.remoteSyncer.getRemoteKeysForTarget(t),At:t=>n.Ia.get(t)||null,ht:()=>n.datastore.serializer.databaseId}),nn(n).start(),n.Ra.ua()}function Bi(n){return Oe(n)&&!nn(n).x_()&&n.Ia.size>0}function Oe(n){return L(n).Ea.size===0}function $c(n){n.Va=void 0}async function Jp(n){n.Ra.set("Online")}async function Zp(n){n.Ia.forEach((t,e)=>{Fi(n,t)})}async function tm(n,t){$c(n),Bi(n)?(n.Ra.ha(t),Ui(n)):n.Ra.set("Unknown")}async function em(n,t,e){if(n.Ra.set("Online"),t instanceof Sc&&t.state===2&&t.cause)try{await async function(s,o){const a=o.cause;for(const c of o.targetIds)s.Ia.has(c)&&(await s.remoteSyncer.rejectListen(c,a),s.Ia.delete(c),s.Va.removeTarget(c))}(n,t)}catch(r){O(De,"Failed to remove targets %s: %s ",t.targetIds.join(","),r),await Mr(n,r)}else if(t instanceof Rr?n.Va.Ze(t):t instanceof Rc?n.Va.st(t):n.Va.tt(t),!e.isEqual(U.min()))try{const r=await Fc(n.localStore);e.compareTo(r)>=0&&await function(o,a){const c=o.Va.Tt(a);return c.targetChanges.forEach((h,d)=>{if(h.resumeToken.approximateByteSize()>0){const p=o.Ia.get(d);p&&o.Ia.set(d,p.withResumeToken(h.resumeToken,a))}}),c.targetMismatches.forEach((h,d)=>{const p=o.Ia.get(h);if(!p)return;o.Ia.set(h,p.withResumeToken(mt.EMPTY_BYTE_STRING,p.snapshotVersion)),jc(o,h);const y=new oe(p.target,h,d,p.sequenceNumber);Fi(o,y)}),o.remoteSyncer.applyRemoteEvent(c)}(n,e)}catch(r){O(De,"Failed to raise snapshot:",r),await Mr(n,r)}}async function Mr(n,t,e){if(!tn(t))throw t;n.Ea.add(1),await Gn(n),n.Ra.set("Offline"),e||(e=()=>Fc(n.localStore)),n.asyncQueue.enqueueRetryable(async()=>{O(De,"Retrying IndexedDB access"),await e(),n.Ea.delete(1),await ts(n)})}function zc(n,t){return t().catch(e=>Mr(n,e,t))}async function es(n){const t=L(n),e=pe(t);let r=t.Ta.length>0?t.Ta[t.Ta.length-1].batchId:vi;for(;nm(t);)try{const s=await Lp(t.localStore,r);if(s===null){t.Ta.length===0&&e.L_();break}r=s.batchId,rm(t,s)}catch(s){await Mr(t,s)}Hc(t)&&Gc(t)}function nm(n){return Oe(n)&&n.Ta.length<10}function rm(n,t){n.Ta.push(t);const e=pe(n);e.O_()&&e.X_&&e.ea(t.mutations)}function Hc(n){return Oe(n)&&!pe(n).x_()&&n.Ta.length>0}function Gc(n){pe(n).start()}async function sm(n){pe(n).ra()}async function im(n){const t=pe(n);for(const e of n.Ta)t.ea(e.mutations)}async function om(n,t,e){const r=n.Ta.shift(),s=Vi.from(r,t,e);await zc(n,()=>n.remoteSyncer.applySuccessfulWrite(s)),await es(n)}async function am(n,t){t&&pe(n).X_&&await async function(r,s){if(function(a){return jf(a)&&a!==C.ABORTED}(s.code)){const o=r.Ta.shift();pe(r).B_(),await zc(r,()=>r.remoteSyncer.rejectFailedWrite(o.batchId,s)),await es(r)}}(n,t),Hc(n)&&Gc(n)}async function su(n,t){const e=L(n);e.asyncQueue.verifyOperationInProgress(),O(De,"RemoteStore received new credentials");const r=Oe(e);e.Ea.add(3),await Gn(e),r&&e.Ra.set("Unknown"),await e.remoteSyncer.handleCredentialChange(t),e.Ea.delete(3),await ts(e)}async function um(n,t){const e=L(n);t?(e.Ea.delete(2),await ts(e)):t||(e.Ea.add(2),await Gn(e),e.Ra.set("Unknown"))}function nn(n){return n.ma||(n.ma=function(e,r,s){const o=L(e);return o.sa(),new Gp(r,o.connection,o.authCredentials,o.appCheckCredentials,o.serializer,s)}(n.datastore,n.asyncQueue,{Xo:Jp.bind(null,n),t_:Zp.bind(null,n),r_:tm.bind(null,n),H_:em.bind(null,n)}),n.da.push(async t=>{t?(n.ma.B_(),Bi(n)?Ui(n):n.Ra.set("Unknown")):(await n.ma.stop(),$c(n))})),n.ma}function pe(n){return n.fa||(n.fa=function(e,r,s){const o=L(e);return o.sa(),new Kp(r,o.connection,o.authCredentials,o.appCheckCredentials,o.serializer,s)}(n.datastore,n.asyncQueue,{Xo:()=>Promise.resolve(),t_:sm.bind(null,n),r_:am.bind(null,n),ta:im.bind(null,n),na:om.bind(null,n)}),n.da.push(async t=>{t?(n.fa.B_(),await es(n)):(await n.fa.stop(),n.Ta.length>0&&(O(De,`Stopping write stream with ${n.Ta.length} pending writes`),n.Ta=[]))})),n.fa}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qi{constructor(t,e,r,s,o){this.asyncQueue=t,this.timerId=e,this.targetTimeMs=r,this.op=s,this.removalCallback=o,this.deferred=new qt,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(a=>{})}get promise(){return this.deferred.promise}static createAndSchedule(t,e,r,s,o){const a=Date.now()+r,c=new qi(t,e,a,s,o);return c.start(r),c}start(t){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),t)}skipDelay(){return this.handleDelayElapsed()}cancel(t){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new k(C.CANCELLED,"Operation cancelled"+(t?": "+t:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then(t=>this.deferred.resolve(t))):Promise.resolve())}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function ji(n,t){if(Jt("AsyncQueue",`${t}: ${n}`),tn(n))return new k(C.UNAVAILABLE,`${t}: ${n}`);throw n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class je{static emptySet(t){return new je(t.comparator)}constructor(t){this.comparator=t?(e,r)=>t(e,r)||x.comparator(e.key,r.key):(e,r)=>x.comparator(e.key,r.key),this.keyedMap=Rn(),this.sortedSet=new Z(this.comparator)}has(t){return this.keyedMap.get(t)!=null}get(t){return this.keyedMap.get(t)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(t){const e=this.keyedMap.get(t);return e?this.sortedSet.indexOf(e):-1}get size(){return this.sortedSet.size}forEach(t){this.sortedSet.inorderTraversal((e,r)=>(t(e),!1))}add(t){const e=this.delete(t.key);return e.copy(e.keyedMap.insert(t.key,t),e.sortedSet.insert(t,null))}delete(t){const e=this.get(t);return e?this.copy(this.keyedMap.remove(t),this.sortedSet.remove(e)):this}isEqual(t){if(!(t instanceof je)||this.size!==t.size)return!1;const e=this.sortedSet.getIterator(),r=t.sortedSet.getIterator();for(;e.hasNext();){const s=e.getNext().key,o=r.getNext().key;if(!s.isEqual(o))return!1}return!0}toString(){const t=[];return this.forEach(e=>{t.push(e.toString())}),t.length===0?"DocumentSet ()":`DocumentSet (
  `+t.join(`  
`)+`
)`}copy(t,e){const r=new je;return r.comparator=this.comparator,r.keyedMap=t,r.sortedSet=e,r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class iu{constructor(){this.ga=new Z(x.comparator)}track(t){const e=t.doc.key,r=this.ga.get(e);r?t.type!==0&&r.type===3?this.ga=this.ga.insert(e,t):t.type===3&&r.type!==1?this.ga=this.ga.insert(e,{type:r.type,doc:t.doc}):t.type===2&&r.type===2?this.ga=this.ga.insert(e,{type:2,doc:t.doc}):t.type===2&&r.type===0?this.ga=this.ga.insert(e,{type:0,doc:t.doc}):t.type===1&&r.type===0?this.ga=this.ga.remove(e):t.type===1&&r.type===2?this.ga=this.ga.insert(e,{type:1,doc:r.doc}):t.type===0&&r.type===1?this.ga=this.ga.insert(e,{type:2,doc:t.doc}):M(63341,{Rt:t,pa:r}):this.ga=this.ga.insert(e,t)}ya(){const t=[];return this.ga.inorderTraversal((e,r)=>{t.push(r)}),t}}class Qe{constructor(t,e,r,s,o,a,c,h,d){this.query=t,this.docs=e,this.oldDocs=r,this.docChanges=s,this.mutatedKeys=o,this.fromCache=a,this.syncStateChanged=c,this.excludesMetadataChanges=h,this.hasCachedResults=d}static fromInitialDocuments(t,e,r,s,o){const a=[];return e.forEach(c=>{a.push({type:0,doc:c})}),new Qe(t,e,je.emptySet(e),a,r,s,!0,!1,o)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(t){if(!(this.fromCache===t.fromCache&&this.hasCachedResults===t.hasCachedResults&&this.syncStateChanged===t.syncStateChanged&&this.mutatedKeys.isEqual(t.mutatedKeys)&&Kr(this.query,t.query)&&this.docs.isEqual(t.docs)&&this.oldDocs.isEqual(t.oldDocs)))return!1;const e=this.docChanges,r=t.docChanges;if(e.length!==r.length)return!1;for(let s=0;s<e.length;s++)if(e[s].type!==r[s].type||!e[s].doc.isEqual(r[s].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cm{constructor(){this.wa=void 0,this.Sa=[]}ba(){return this.Sa.some(t=>t.Da())}}class lm{constructor(){this.queries=ou(),this.onlineState="Unknown",this.Ca=new Set}terminate(){(function(e,r){const s=L(e),o=s.queries;s.queries=ou(),o.forEach((a,c)=>{for(const h of c.Sa)h.onError(r)})})(this,new k(C.ABORTED,"Firestore shutting down"))}}function ou(){return new ke(n=>dc(n),Kr)}async function $i(n,t){const e=L(n);let r=3;const s=t.query;let o=e.queries.get(s);o?!o.ba()&&t.Da()&&(r=2):(o=new cm,r=t.Da()?0:1);try{switch(r){case 0:o.wa=await e.onListen(s,!0);break;case 1:o.wa=await e.onListen(s,!1);break;case 2:await e.onFirstRemoteStoreListen(s)}}catch(a){const c=ji(a,`Initialization of query '${Be(t.query)}' failed`);return void t.onError(c)}e.queries.set(s,o),o.Sa.push(t),t.va(e.onlineState),o.wa&&t.Fa(o.wa)&&Hi(e)}async function zi(n,t){const e=L(n),r=t.query;let s=3;const o=e.queries.get(r);if(o){const a=o.Sa.indexOf(t);a>=0&&(o.Sa.splice(a,1),o.Sa.length===0?s=t.Da()?0:1:!o.ba()&&t.Da()&&(s=2))}switch(s){case 0:return e.queries.delete(r),e.onUnlisten(r,!0);case 1:return e.queries.delete(r),e.onUnlisten(r,!1);case 2:return e.onLastRemoteStoreUnlisten(r);default:return}}function hm(n,t){const e=L(n);let r=!1;for(const s of t){const o=s.query,a=e.queries.get(o);if(a){for(const c of a.Sa)c.Fa(s)&&(r=!0);a.wa=s}}r&&Hi(e)}function dm(n,t,e){const r=L(n),s=r.queries.get(t);if(s)for(const o of s.Sa)o.onError(e);r.queries.delete(t)}function Hi(n){n.Ca.forEach(t=>{t.next()})}var ci,au;(au=ci||(ci={})).Ma="default",au.Cache="cache";class Gi{constructor(t,e,r){this.query=t,this.xa=e,this.Oa=!1,this.Na=null,this.onlineState="Unknown",this.options=r||{}}Fa(t){if(!this.options.includeMetadataChanges){const r=[];for(const s of t.docChanges)s.type!==3&&r.push(s);t=new Qe(t.query,t.docs,t.oldDocs,r,t.mutatedKeys,t.fromCache,t.syncStateChanged,!0,t.hasCachedResults)}let e=!1;return this.Oa?this.Ba(t)&&(this.xa.next(t),e=!0):this.La(t,this.onlineState)&&(this.ka(t),e=!0),this.Na=t,e}onError(t){this.xa.error(t)}va(t){this.onlineState=t;let e=!1;return this.Na&&!this.Oa&&this.La(this.Na,t)&&(this.ka(this.Na),e=!0),e}La(t,e){if(!t.fromCache||!this.Da())return!0;const r=e!=="Offline";return(!this.options.qa||!r)&&(!t.docs.isEmpty()||t.hasCachedResults||e==="Offline")}Ba(t){if(t.docChanges.length>0)return!0;const e=this.Na&&this.Na.hasPendingWrites!==t.hasPendingWrites;return!(!t.syncStateChanged&&!e)&&this.options.includeMetadataChanges===!0}ka(t){t=Qe.fromInitialDocuments(t.query,t.docs,t.mutatedKeys,t.fromCache,t.hasCachedResults),this.Oa=!0,this.xa.next(t)}Da(){return this.options.source!==ci.Cache}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kc{constructor(t){this.key=t}}class Wc{constructor(t){this.key=t}}class fm{constructor(t,e){this.query=t,this.Ya=e,this.Za=null,this.hasCachedResults=!1,this.current=!1,this.Xa=$(),this.mutatedKeys=$(),this.eu=fc(t),this.tu=new je(this.eu)}get nu(){return this.Ya}ru(t,e){const r=e?e.iu:new iu,s=e?e.tu:this.tu;let o=e?e.mutatedKeys:this.mutatedKeys,a=s,c=!1;const h=this.query.limitType==="F"&&s.size===this.query.limit?s.last():null,d=this.query.limitType==="L"&&s.size===this.query.limit?s.first():null;if(t.inorderTraversal((p,y)=>{const E=s.get(p),S=Wr(this.query,y)?y:null,b=!!E&&this.mutatedKeys.has(E.key),N=!!S&&(S.hasLocalMutations||this.mutatedKeys.has(S.key)&&S.hasCommittedMutations);let V=!1;E&&S?E.data.isEqual(S.data)?b!==N&&(r.track({type:3,doc:S}),V=!0):this.su(E,S)||(r.track({type:2,doc:S}),V=!0,(h&&this.eu(S,h)>0||d&&this.eu(S,d)<0)&&(c=!0)):!E&&S?(r.track({type:0,doc:S}),V=!0):E&&!S&&(r.track({type:1,doc:E}),V=!0,(h||d)&&(c=!0)),V&&(S?(a=a.add(S),o=N?o.add(p):o.delete(p)):(a=a.delete(p),o=o.delete(p)))}),this.query.limit!==null)for(;a.size>this.query.limit;){const p=this.query.limitType==="F"?a.last():a.first();a=a.delete(p.key),o=o.delete(p.key),r.track({type:1,doc:p})}return{tu:a,iu:r,Cs:c,mutatedKeys:o}}su(t,e){return t.hasLocalMutations&&e.hasCommittedMutations&&!e.hasLocalMutations}applyChanges(t,e,r,s){const o=this.tu;this.tu=t.tu,this.mutatedKeys=t.mutatedKeys;const a=t.iu.ya();a.sort((p,y)=>function(S,b){const N=V=>{switch(V){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return M(20277,{Rt:V})}};return N(S)-N(b)}(p.type,y.type)||this.eu(p.doc,y.doc)),this.ou(r),s=s??!1;const c=e&&!s?this._u():[],h=this.Xa.size===0&&this.current&&!s?1:0,d=h!==this.Za;return this.Za=h,a.length!==0||d?{snapshot:new Qe(this.query,t.tu,o,a,t.mutatedKeys,h===0,d,!1,!!r&&r.resumeToken.approximateByteSize()>0),au:c}:{au:c}}va(t){return this.current&&t==="Offline"?(this.current=!1,this.applyChanges({tu:this.tu,iu:new iu,mutatedKeys:this.mutatedKeys,Cs:!1},!1)):{au:[]}}uu(t){return!this.Ya.has(t)&&!!this.tu.has(t)&&!this.tu.get(t).hasLocalMutations}ou(t){t&&(t.addedDocuments.forEach(e=>this.Ya=this.Ya.add(e)),t.modifiedDocuments.forEach(e=>{}),t.removedDocuments.forEach(e=>this.Ya=this.Ya.delete(e)),this.current=t.current)}_u(){if(!this.current)return[];const t=this.Xa;this.Xa=$(),this.tu.forEach(r=>{this.uu(r.key)&&(this.Xa=this.Xa.add(r.key))});const e=[];return t.forEach(r=>{this.Xa.has(r)||e.push(new Wc(r))}),this.Xa.forEach(r=>{t.has(r)||e.push(new Kc(r))}),e}cu(t){this.Ya=t.Qs,this.Xa=$();const e=this.ru(t.documents);return this.applyChanges(e,!0)}lu(){return Qe.fromInitialDocuments(this.query,this.tu,this.mutatedKeys,this.Za===0,this.hasCachedResults)}}const Ki="SyncEngine";class pm{constructor(t,e,r){this.query=t,this.targetId=e,this.view=r}}class mm{constructor(t){this.key=t,this.hu=!1}}class gm{constructor(t,e,r,s,o,a){this.localStore=t,this.remoteStore=e,this.eventManager=r,this.sharedClientState=s,this.currentUser=o,this.maxConcurrentLimboResolutions=a,this.Pu={},this.Tu=new ke(c=>dc(c),Kr),this.Iu=new Map,this.Eu=new Set,this.du=new Z(x.comparator),this.Au=new Map,this.Ru=new ki,this.Vu={},this.mu=new Map,this.fu=We.cr(),this.onlineState="Unknown",this.gu=void 0}get isPrimaryClient(){return this.gu===!0}}async function _m(n,t,e=!0){const r=tl(n);let s;const o=r.Tu.get(t);return o?(r.sharedClientState.addLocalQueryTarget(o.targetId),s=o.view.lu()):s=await Qc(r,t,e,!0),s}async function ym(n,t){const e=tl(n);await Qc(e,t,!0,!1)}async function Qc(n,t,e,r){const s=await Fp(n.localStore,jt(t)),o=s.targetId,a=n.sharedClientState.addLocalQueryTarget(o,e);let c;return r&&(c=await Em(n,t,o,a==="current",s.resumeToken)),n.isPrimaryClient&&e&&qc(n.remoteStore,s),c}async function Em(n,t,e,r,s){n.pu=(y,E,S)=>async function(N,V,q,F){let B=V.view.ru(q);B.Cs&&(B=await Za(N.localStore,V.query,!1).then(({documents:I})=>V.view.ru(I,B)));const z=F&&F.targetChanges.get(V.targetId),Ct=F&&F.targetMismatches.get(V.targetId)!=null,st=V.view.applyChanges(B,N.isPrimaryClient,z,Ct);return cu(N,V.targetId,st.au),st.snapshot}(n,y,E,S);const o=await Za(n.localStore,t,!0),a=new fm(t,o.Qs),c=a.ru(o.documents),h=Hn.createSynthesizedTargetChangeForCurrentChange(e,r&&n.onlineState!=="Offline",s),d=a.applyChanges(c,n.isPrimaryClient,h);cu(n,e,d.au);const p=new pm(t,e,a);return n.Tu.set(t,p),n.Iu.has(e)?n.Iu.get(e).push(t):n.Iu.set(e,[t]),d.snapshot}async function Tm(n,t,e){const r=L(n),s=r.Tu.get(t),o=r.Iu.get(s.targetId);if(o.length>1)return r.Iu.set(s.targetId,o.filter(a=>!Kr(a,t))),void r.Tu.delete(t);r.isPrimaryClient?(r.sharedClientState.removeLocalQueryTarget(s.targetId),r.sharedClientState.isActiveQueryTarget(s.targetId)||await ai(r.localStore,s.targetId,!1).then(()=>{r.sharedClientState.clearQueryState(s.targetId),e&&Li(r.remoteStore,s.targetId),li(r,s.targetId)}).catch(Ze)):(li(r,s.targetId),await ai(r.localStore,s.targetId,!0))}async function wm(n,t){const e=L(n),r=e.Tu.get(t),s=e.Iu.get(r.targetId);e.isPrimaryClient&&s.length===1&&(e.sharedClientState.removeLocalQueryTarget(r.targetId),Li(e.remoteStore,r.targetId))}async function Im(n,t,e){const r=bm(n);try{const s=await function(a,c){const h=L(a),d=J.now(),p=c.reduce((S,b)=>S.add(b.key),$());let y,E;return h.persistence.runTransaction("Locally write mutations","readwrite",S=>{let b=Zt(),N=$();return h.Ns.getEntries(S,p).next(V=>{b=V,b.forEach((q,F)=>{F.isValidDocument()||(N=N.add(q))})}).next(()=>h.localDocuments.getOverlayedDocuments(S,b)).next(V=>{y=V;const q=[];for(const F of c){const B=Mf(F,y.get(F.key).overlayedDocument);B!=null&&q.push(new ye(F.key,B,rc(B.value.mapValue),Dt.exists(!0)))}return h.mutationQueue.addMutationBatch(S,d,q,c)}).next(V=>{E=V;const q=V.applyToLocalDocumentSet(y,N);return h.documentOverlayCache.saveOverlays(S,V.batchId,q)})}).then(()=>({batchId:E.batchId,changes:mc(y)}))}(r.localStore,t);r.sharedClientState.addPendingMutation(s.batchId),function(a,c,h){let d=a.Vu[a.currentUser.toKey()];d||(d=new Z(j)),d=d.insert(c,h),a.Vu[a.currentUser.toKey()]=d}(r,s.batchId,e),await Kn(r,s.changes),await es(r.remoteStore)}catch(s){const o=ji(s,"Failed to persist write");e.reject(o)}}async function Xc(n,t){const e=L(n);try{const r=await xp(e.localStore,t);t.targetChanges.forEach((s,o)=>{const a=e.Au.get(o);a&&(W(s.addedDocuments.size+s.modifiedDocuments.size+s.removedDocuments.size<=1,22616),s.addedDocuments.size>0?a.hu=!0:s.modifiedDocuments.size>0?W(a.hu,14607):s.removedDocuments.size>0&&(W(a.hu,42227),a.hu=!1))}),await Kn(e,r,t)}catch(r){await Ze(r)}}function uu(n,t,e){const r=L(n);if(r.isPrimaryClient&&e===0||!r.isPrimaryClient&&e===1){const s=[];r.Tu.forEach((o,a)=>{const c=a.view.va(t);c.snapshot&&s.push(c.snapshot)}),function(a,c){const h=L(a);h.onlineState=c;let d=!1;h.queries.forEach((p,y)=>{for(const E of y.Sa)E.va(c)&&(d=!0)}),d&&Hi(h)}(r.eventManager,t),s.length&&r.Pu.H_(s),r.onlineState=t,r.isPrimaryClient&&r.sharedClientState.setOnlineState(t)}}async function Am(n,t,e){const r=L(n);r.sharedClientState.updateQueryState(t,"rejected",e);const s=r.Au.get(t),o=s&&s.key;if(o){let a=new Z(x.comparator);a=a.insert(o,It.newNoDocument(o,U.min()));const c=$().add(o),h=new Jr(U.min(),new Map,new Z(j),a,c);await Xc(r,h),r.du=r.du.remove(o),r.Au.delete(t),Wi(r)}else await ai(r.localStore,t,!1).then(()=>li(r,t,e)).catch(Ze)}async function vm(n,t){const e=L(n),r=t.batch.batchId;try{const s=await Op(e.localStore,t);Jc(e,r,null),Yc(e,r),e.sharedClientState.updateMutationState(r,"acknowledged"),await Kn(e,s)}catch(s){await Ze(s)}}async function Rm(n,t,e){const r=L(n);try{const s=await function(a,c){const h=L(a);return h.persistence.runTransaction("Reject batch","readwrite-primary",d=>{let p;return h.mutationQueue.lookupMutationBatch(d,c).next(y=>(W(y!==null,37113),p=y.keys(),h.mutationQueue.removeMutationBatch(d,y))).next(()=>h.mutationQueue.performConsistencyCheck(d)).next(()=>h.documentOverlayCache.removeOverlaysForBatchId(d,p,c)).next(()=>h.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(d,p)).next(()=>h.localDocuments.getDocuments(d,p))})}(r.localStore,t);Jc(r,t,e),Yc(r,t),r.sharedClientState.updateMutationState(t,"rejected",e),await Kn(r,s)}catch(s){await Ze(s)}}function Yc(n,t){(n.mu.get(t)||[]).forEach(e=>{e.resolve()}),n.mu.delete(t)}function Jc(n,t,e){const r=L(n);let s=r.Vu[r.currentUser.toKey()];if(s){const o=s.get(t);o&&(e?o.reject(e):o.resolve(),s=s.remove(t)),r.Vu[r.currentUser.toKey()]=s}}function li(n,t,e=null){n.sharedClientState.removeLocalQueryTarget(t);for(const r of n.Iu.get(t))n.Tu.delete(r),e&&n.Pu.yu(r,e);n.Iu.delete(t),n.isPrimaryClient&&n.Ru.jr(t).forEach(r=>{n.Ru.containsKey(r)||Zc(n,r)})}function Zc(n,t){n.Eu.delete(t.path.canonicalString());const e=n.du.get(t);e!==null&&(Li(n.remoteStore,e),n.du=n.du.remove(t),n.Au.delete(e),Wi(n))}function cu(n,t,e){for(const r of e)r instanceof Kc?(n.Ru.addReference(r.key,t),Sm(n,r)):r instanceof Wc?(O(Ki,"Document no longer in limbo: "+r.key),n.Ru.removeReference(r.key,t),n.Ru.containsKey(r.key)||Zc(n,r.key)):M(19791,{wu:r})}function Sm(n,t){const e=t.key,r=e.path.canonicalString();n.du.get(e)||n.Eu.has(r)||(O(Ki,"New document in limbo: "+e),n.Eu.add(r),Wi(n))}function Wi(n){for(;n.Eu.size>0&&n.du.size<n.maxConcurrentLimboResolutions;){const t=n.Eu.values().next().value;n.Eu.delete(t);const e=new x(X.fromString(t)),r=n.fu.next();n.Au.set(r,new mm(e)),n.du=n.du.insert(e,r),qc(n.remoteStore,new oe(jt(Gr(e.path)),r,"TargetPurposeLimboResolution",$r.ce))}}async function Kn(n,t,e){const r=L(n),s=[],o=[],a=[];r.Tu.isEmpty()||(r.Tu.forEach((c,h)=>{a.push(r.pu(h,t,e).then(d=>{var p;if((d||e)&&r.isPrimaryClient){const y=d?!d.fromCache:(p=e==null?void 0:e.targetChanges.get(h.targetId))==null?void 0:p.current;r.sharedClientState.updateQueryState(h.targetId,y?"current":"not-current")}if(d){s.push(d);const y=xi.As(h.targetId,d);o.push(y)}}))}),await Promise.all(a),r.Pu.H_(s),await async function(h,d){const p=L(h);try{await p.persistence.runTransaction("notifyLocalViewChanges","readwrite",y=>P.forEach(d,E=>P.forEach(E.Es,S=>p.persistence.referenceDelegate.addReference(y,E.targetId,S)).next(()=>P.forEach(E.ds,S=>p.persistence.referenceDelegate.removeReference(y,E.targetId,S)))))}catch(y){if(!tn(y))throw y;O(Mi,"Failed to update sequence numbers: "+y)}for(const y of d){const E=y.targetId;if(!y.fromCache){const S=p.Ms.get(E),b=S.snapshotVersion,N=S.withLastLimboFreeSnapshotVersion(b);p.Ms=p.Ms.insert(E,N)}}}(r.localStore,o))}async function Cm(n,t){const e=L(n);if(!e.currentUser.isEqual(t)){O(Ki,"User change. New user:",t.toKey());const r=await Lc(e.localStore,t);e.currentUser=t,function(o,a){o.mu.forEach(c=>{c.forEach(h=>{h.reject(new k(C.CANCELLED,a))})}),o.mu.clear()}(e,"'waitForPendingWrites' promise is rejected due to a user change."),e.sharedClientState.handleUserChange(t,r.removedBatchIds,r.addedBatchIds),await Kn(e,r.Ls)}}function Pm(n,t){const e=L(n),r=e.Au.get(t);if(r&&r.hu)return $().add(r.key);{let s=$();const o=e.Iu.get(t);if(!o)return s;for(const a of o){const c=e.Tu.get(a);s=s.unionWith(c.view.nu)}return s}}function tl(n){const t=L(n);return t.remoteStore.remoteSyncer.applyRemoteEvent=Xc.bind(null,t),t.remoteStore.remoteSyncer.getRemoteKeysForTarget=Pm.bind(null,t),t.remoteStore.remoteSyncer.rejectListen=Am.bind(null,t),t.Pu.H_=hm.bind(null,t.eventManager),t.Pu.yu=dm.bind(null,t.eventManager),t}function bm(n){const t=L(n);return t.remoteStore.remoteSyncer.applySuccessfulWrite=vm.bind(null,t),t.remoteStore.remoteSyncer.rejectFailedWrite=Rm.bind(null,t),t}class Lr{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(t){this.serializer=Zr(t.databaseInfo.databaseId),this.sharedClientState=this.Du(t),this.persistence=this.Cu(t),await this.persistence.start(),this.localStore=this.vu(t),this.gcScheduler=this.Fu(t,this.localStore),this.indexBackfillerScheduler=this.Mu(t,this.localStore)}Fu(t,e){return null}Mu(t,e){return null}vu(t){return kp(this.persistence,new Vp,t.initialUser,this.serializer)}Cu(t){return new Mc(Oi.mi,this.serializer)}Du(t){return new Bp}async terminate(){var t,e;(t=this.gcScheduler)==null||t.stop(),(e=this.indexBackfillerScheduler)==null||e.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}Lr.provider={build:()=>new Lr};class Vm extends Lr{constructor(t){super(),this.cacheSizeBytes=t}Fu(t,e){W(this.persistence.referenceDelegate instanceof xr,46915);const r=this.persistence.referenceDelegate.garbageCollector;return new mp(r,t.asyncQueue,e)}Cu(t){const e=this.cacheSizeBytes!==void 0?Pt.withCacheSize(this.cacheSizeBytes):Pt.DEFAULT;return new Mc(r=>xr.mi(r,e),this.serializer)}}class hi{async initialize(t,e){this.localStore||(this.localStore=t.localStore,this.sharedClientState=t.sharedClientState,this.datastore=this.createDatastore(e),this.remoteStore=this.createRemoteStore(e),this.eventManager=this.createEventManager(e),this.syncEngine=this.createSyncEngine(e,!t.synchronizeTabs),this.sharedClientState.onlineStateHandler=r=>uu(this.syncEngine,r,1),this.remoteStore.remoteSyncer.handleCredentialChange=Cm.bind(null,this.syncEngine),await um(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(t){return function(){return new lm}()}createDatastore(t){const e=Zr(t.databaseInfo.databaseId),r=function(o){return new Hp(o)}(t.databaseInfo);return function(o,a,c,h){return new Qp(o,a,c,h)}(t.authCredentials,t.appCheckCredentials,r,e)}createRemoteStore(t){return function(r,s,o,a,c){return new Yp(r,s,o,a,c)}(this.localStore,this.datastore,t.asyncQueue,e=>uu(this.syncEngine,e,0),function(){return nu.v()?new nu:new qp}())}createSyncEngine(t,e){return function(s,o,a,c,h,d,p){const y=new gm(s,o,a,c,h,d);return p&&(y.gu=!0),y}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,t.initialUser,t.maxConcurrentLimboResolutions,e)}async terminate(){var t,e;await async function(s){const o=L(s);O(De,"RemoteStore shutting down."),o.Ea.add(5),await Gn(o),o.Aa.shutdown(),o.Ra.set("Unknown")}(this.remoteStore),(t=this.datastore)==null||t.terminate(),(e=this.eventManager)==null||e.terminate()}}hi.provider={build:()=>new hi};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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
 */class Qi{constructor(t){this.observer=t,this.muted=!1}next(t){this.muted||this.observer.next&&this.Ou(this.observer.next,t)}error(t){this.muted||(this.observer.error?this.Ou(this.observer.error,t):Jt("Uncaught Error in snapshot listener:",t.toString()))}Nu(){this.muted=!0}Ou(t,e){setTimeout(()=>{this.muted||t(e)},0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const me="FirestoreClient";class Dm{constructor(t,e,r,s,o){this.authCredentials=t,this.appCheckCredentials=e,this.asyncQueue=r,this.databaseInfo=s,this.user=wt.UNAUTHENTICATED,this.clientId=Ai.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=o,this.authCredentials.start(r,async a=>{O(me,"Received user=",a.uid),await this.authCredentialListener(a),this.user=a}),this.appCheckCredentials.start(r,a=>(O(me,"Received new app check token=",a),this.appCheckCredentialListener(a,this.user)))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this.databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(t){this.authCredentialListener=t}setAppCheckTokenChangeListener(t){this.appCheckCredentialListener=t}terminate(){this.asyncQueue.enterRestrictedMode();const t=new qt;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),t.resolve()}catch(e){const r=ji(e,"Failed to shutdown persistence");t.reject(r)}}),t.promise}}async function Bs(n,t){n.asyncQueue.verifyOperationInProgress(),O(me,"Initializing OfflineComponentProvider");const e=n.configuration;await t.initialize(e);let r=e.initialUser;n.setCredentialChangeListener(async s=>{r.isEqual(s)||(await Lc(t.localStore,s),r=s)}),t.persistence.setDatabaseDeletedListener(()=>n.terminate()),n._offlineComponents=t}async function lu(n,t){n.asyncQueue.verifyOperationInProgress();const e=await Nm(n);O(me,"Initializing OnlineComponentProvider"),await t.initialize(e,n.configuration),n.setCredentialChangeListener(r=>su(t.remoteStore,r)),n.setAppCheckTokenChangeListener((r,s)=>su(t.remoteStore,s)),n._onlineComponents=t}async function Nm(n){if(!n._offlineComponents)if(n._uninitializedComponentsProvider){O(me,"Using user provided OfflineComponentProvider");try{await Bs(n,n._uninitializedComponentsProvider._offline)}catch(t){const e=t;if(!function(s){return s.name==="FirebaseError"?s.code===C.FAILED_PRECONDITION||s.code===C.UNIMPLEMENTED:!(typeof DOMException<"u"&&s instanceof DOMException)||s.code===22||s.code===20||s.code===11}(e))throw e;ze("Error using user provided cache. Falling back to memory cache: "+e),await Bs(n,new Lr)}}else O(me,"Using default OfflineComponentProvider"),await Bs(n,new Vm(void 0));return n._offlineComponents}async function Xi(n){return n._onlineComponents||(n._uninitializedComponentsProvider?(O(me,"Using user provided OnlineComponentProvider"),await lu(n,n._uninitializedComponentsProvider._online)):(O(me,"Using default OnlineComponentProvider"),await lu(n,new hi))),n._onlineComponents}function km(n){return Xi(n).then(t=>t.syncEngine)}function Om(n){return Xi(n).then(t=>t.datastore)}async function Fr(n){const t=await Xi(n),e=t.eventManager;return e.onListen=_m.bind(null,t.syncEngine),e.onUnlisten=Tm.bind(null,t.syncEngine),e.onFirstRemoteStoreListen=ym.bind(null,t.syncEngine),e.onLastRemoteStoreUnlisten=wm.bind(null,t.syncEngine),e}function xm(n,t,e={}){const r=new qt;return n.asyncQueue.enqueueAndForget(async()=>function(o,a,c,h,d){const p=new Qi({next:E=>{p.Nu(),a.enqueueAndForget(()=>zi(o,y));const S=E.docs.has(c);!S&&E.fromCache?d.reject(new k(C.UNAVAILABLE,"Failed to get document because the client is offline.")):S&&E.fromCache&&h&&h.source==="server"?d.reject(new k(C.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):d.resolve(E)},error:E=>d.reject(E)}),y=new Gi(Gr(c.path),p,{includeMetadataChanges:!0,qa:!0});return $i(o,y)}(await Fr(n),n.asyncQueue,t,e,r)),r.promise}function Mm(n,t,e={}){const r=new qt;return n.asyncQueue.enqueueAndForget(async()=>function(o,a,c,h,d){const p=new Qi({next:E=>{p.Nu(),a.enqueueAndForget(()=>zi(o,y)),E.fromCache&&h.source==="server"?d.reject(new k(C.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):d.resolve(E)},error:E=>d.reject(E)}),y=new Gi(c,p,{includeMetadataChanges:!0,qa:!0});return $i(o,y)}(await Fr(n),n.asyncQueue,t,e,r)),r.promise}function Lm(n,t,e){const r=new qt;return n.asyncQueue.enqueueAndForget(async()=>{try{const s=await Om(n);r.resolve(async function(a,c,h){var N;const d=L(a),{request:p,gt:y,parent:E}=np(d.serializer,wf(c),h);d.connection.$o||delete p.parent;const S=(await d.Ho("RunAggregationQuery",d.serializer.databaseId,E,p,1)).filter(V=>!!V.result);W(S.length===1,64727);const b=(N=S[0].result)==null?void 0:N.aggregateFields;return Object.keys(b).reduce((V,q)=>(V[y[q]]=b[q],V),{})}(s,t,e))}catch(s){r.reject(s)}}),r.promise}/**
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
 */function el(n){const t={};return n.timeoutSeconds!==void 0&&(t.timeoutSeconds=n.timeoutSeconds),t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const hu=new Map;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nl="firestore.googleapis.com",du=!0;class fu{constructor(t){if(t.host===void 0){if(t.ssl!==void 0)throw new k(C.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=nl,this.ssl=du}else this.host=t.host,this.ssl=t.ssl??du;if(this.isUsingEmulator=t.emulatorOptions!==void 0,this.credentials=t.credentials,this.ignoreUndefinedProperties=!!t.ignoreUndefinedProperties,this.localCache=t.localCache,t.cacheSizeBytes===void 0)this.cacheSizeBytes=xc;else{if(t.cacheSizeBytes!==-1&&t.cacheSizeBytes<fp)throw new k(C.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=t.cacheSizeBytes}Kd("experimentalForceLongPolling",t.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",t.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!t.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:t.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!t.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=el(t.experimentalLongPollingOptions??{}),function(r){if(r.timeoutSeconds!==void 0){if(isNaN(r.timeoutSeconds))throw new k(C.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (must not be NaN)`);if(r.timeoutSeconds<5)throw new k(C.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (minimum allowed value is 5)`);if(r.timeoutSeconds>30)throw new k(C.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!t.useFetchStreams}isEqual(t){return this.host===t.host&&this.ssl===t.ssl&&this.credentials===t.credentials&&this.cacheSizeBytes===t.cacheSizeBytes&&this.experimentalForceLongPolling===t.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===t.experimentalAutoDetectLongPolling&&function(r,s){return r.timeoutSeconds===s.timeoutSeconds}(this.experimentalLongPollingOptions,t.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===t.ignoreUndefinedProperties&&this.useFetchStreams===t.useFetchStreams}}class ns{constructor(t,e,r,s){this._authCredentials=t,this._appCheckCredentials=e,this._databaseId=r,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new fu({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new k(C.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(t){if(this._settingsFrozen)throw new k(C.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new fu(t),this._emulatorOptions=t.emulatorOptions||{},t.credentials!==void 0&&(this._authCredentials=function(r){if(!r)return new Ld;switch(r.type){case"firstParty":return new qd(r.sessionIndex||"0",r.iamToken||null,r.authTokenFactory||null);case"provider":return r.client;default:throw new k(C.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(t.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(e){const r=hu.get(e);r&&(O("ComponentProvider","Removing Datastore"),hu.delete(e),r.terminate())}(this),Promise.resolve()}}function Fm(n,t,e,r={}){var d;n=St(n,ns);const s=Ye(t),o=n._getSettings(),a={...o,emulatorOptions:n._getEmulatorOptions()},c=`${t}:${e}`;s&&(_i(`https://${c}`),yi("Firestore",!0)),o.host!==nl&&o.host!==c&&ze("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const h={...o,host:c,ssl:s,emulatorOptions:r};if(!Pr(h,a)&&(n._setSettings(h),r.mockUserToken)){let p,y;if(typeof r.mockUserToken=="string")p=r.mockUserToken,y=wt.MOCK_USER;else{p=Du(r.mockUserToken,(d=n._app)==null?void 0:d.options.projectId);const E=r.mockUserToken.sub||r.mockUserToken.user_id;if(!E)throw new k(C.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");y=new wt(E)}n._authCredentials=new Fd(new Hu(p,y))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ee{constructor(t,e,r){this.converter=e,this._query=r,this.type="query",this.firestore=t}withConverter(t){return new Ee(this.firestore,t,this._query)}}class et{constructor(t,e,r){this.converter=e,this._key=r,this.type="document",this.firestore=t}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new ce(this.firestore,this.converter,this._key.path.popLast())}withConverter(t){return new et(this.firestore,t,this._key)}toJSON(){return{type:et._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(t,e,r){if($n(e,et._jsonSchema))return new et(t,r||null,new x(X.fromString(e.referencePath)))}}et._jsonSchemaVersion="firestore/documentReference/1.0",et._jsonSchema={type:ut("string",et._jsonSchemaVersion),referencePath:ut("string")};class ce extends Ee{constructor(t,e,r){super(t,e,Gr(r)),this._path=r,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const t=this._path.popLast();return t.isEmpty()?null:new et(this.firestore,null,new x(t))}withConverter(t){return new ce(this.firestore,t,this._path)}}function M_(n,t,...e){if(n=ct(n),Gu("collection","path",t),n instanceof ns){const r=X.fromString(t,...e);return Sa(r),new ce(n,null,r)}{if(!(n instanceof et||n instanceof ce))throw new k(C.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(X.fromString(t,...e));return Sa(r),new ce(n.firestore,null,r)}}function L_(n,t,...e){if(n=ct(n),arguments.length===1&&(t=Ai.newId()),Gu("doc","path",t),n instanceof ns){const r=X.fromString(t,...e);return Ra(r),new et(n,null,new x(r))}{if(!(n instanceof et||n instanceof ce))throw new k(C.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(X.fromString(t,...e));return Ra(r),new et(n.firestore,n instanceof ce?n.converter:null,new x(r))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pu="AsyncQueue";class mu{constructor(t=Promise.resolve()){this.Xu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new Uc(this,"async_queue_retry"),this._c=()=>{const r=Us();r&&O(pu,"Visibility state changed to "+r.visibilityState),this.M_.w_()},this.ac=t;const e=Us();e&&typeof e.addEventListener=="function"&&e.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(t){this.enqueue(t)}enqueueAndForgetEvenWhileRestricted(t){this.uc(),this.cc(t)}enterRestrictedMode(t){if(!this.ec){this.ec=!0,this.sc=t||!1;const e=Us();e&&typeof e.removeEventListener=="function"&&e.removeEventListener("visibilitychange",this._c)}}enqueue(t){if(this.uc(),this.ec)return new Promise(()=>{});const e=new qt;return this.cc(()=>this.ec&&this.sc?Promise.resolve():(t().then(e.resolve,e.reject),e.promise)).then(()=>e.promise)}enqueueRetryable(t){this.enqueueAndForget(()=>(this.Xu.push(t),this.lc()))}async lc(){if(this.Xu.length!==0){try{await this.Xu[0](),this.Xu.shift(),this.M_.reset()}catch(t){if(!tn(t))throw t;O(pu,"Operation failed with retryable error: "+t)}this.Xu.length>0&&this.M_.p_(()=>this.lc())}}cc(t){const e=this.ac.then(()=>(this.rc=!0,t().catch(r=>{throw this.nc=r,this.rc=!1,Jt("INTERNAL UNHANDLED ERROR: ",gu(r)),r}).then(r=>(this.rc=!1,r))));return this.ac=e,e}enqueueAfterDelay(t,e,r){this.uc(),this.oc.indexOf(t)>-1&&(e=0);const s=qi.createAndSchedule(this,t,e,r,o=>this.hc(o));return this.tc.push(s),s}uc(){this.nc&&M(47125,{Pc:gu(this.nc)})}verifyOperationInProgress(){}async Tc(){let t;do t=this.ac,await t;while(t!==this.ac)}Ic(t){for(const e of this.tc)if(e.timerId===t)return!0;return!1}Ec(t){return this.Tc().then(()=>{this.tc.sort((e,r)=>e.targetTimeMs-r.targetTimeMs);for(const e of this.tc)if(e.skipDelay(),t!=="all"&&e.timerId===t)break;return this.Tc()})}dc(t){this.oc.push(t)}hc(t){const e=this.tc.indexOf(t);this.tc.splice(e,1)}}function gu(n){let t=n.message||"";return n.stack&&(t=n.stack.includes(n.message)?n.stack:n.message+`
`+n.stack),t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _u(n){return function(e,r){if(typeof e!="object"||e===null)return!1;const s=e;for(const o of r)if(o in s&&typeof s[o]=="function")return!0;return!1}(n,["next","error","complete"])}class Kt extends ns{constructor(t,e,r,s){super(t,e,r,s),this.type="firestore",this._queue=new mu,this._persistenceKey=(s==null?void 0:s.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const t=this._firestoreClient.terminate();this._queue=new mu(t),this._firestoreClient=void 0,await t}}}function Um(n,t){const e=typeof n=="object"?n:wi(),r=typeof n=="string"?n:t,s=Ei(e,"firestore").getImmediate({identifier:r});if(!s._initialized){const o=gi("firestore");o&&Fm(s,...o)}return s}function rn(n){if(n._terminated)throw new k(C.FAILED_PRECONDITION,"The client has already been terminated.");return n._firestoreClient||Bm(n),n._firestoreClient}function Bm(n){var r,s,o;const t=n._freezeSettings(),e=function(c,h,d,p){return new of(c,h,d,p.host,p.ssl,p.experimentalForceLongPolling,p.experimentalAutoDetectLongPolling,el(p.experimentalLongPollingOptions),p.useFetchStreams,p.isUsingEmulator)}(n._databaseId,((r=n._app)==null?void 0:r.options.appId)||"",n._persistenceKey,t);n._componentsProvider||(s=t.localCache)!=null&&s._offlineComponentProvider&&((o=t.localCache)!=null&&o._onlineComponentProvider)&&(n._componentsProvider={_offline:t.localCache._offlineComponentProvider,_online:t.localCache._onlineComponentProvider}),n._firestoreClient=new Dm(n._authCredentials,n._appCheckCredentials,n._queue,e,n._componentsProvider&&function(c){const h=c==null?void 0:c._online.build();return{_offline:c==null?void 0:c._offline.build(h),_online:h}}(n._componentsProvider))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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
 */class qm{constructor(t="count",e){this._internalFieldPath=e,this.type="AggregateField",this.aggregateType=t}}class jm{constructor(t,e,r){this._userDataWriter=e,this._data=r,this.type="AggregateQuerySnapshot",this.query=t}data(){return this._userDataWriter.convertObjectMap(this._data)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xt{constructor(t){this._byteString=t}static fromBase64String(t){try{return new xt(mt.fromBase64String(t))}catch(e){throw new k(C.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+e)}}static fromUint8Array(t){return new xt(mt.fromUint8Array(t))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(t){return this._byteString.isEqual(t._byteString)}toJSON(){return{type:xt._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(t){if($n(t,xt._jsonSchema))return xt.fromBase64String(t.bytes)}}xt._jsonSchemaVersion="firestore/bytes/1.0",xt._jsonSchema={type:ut("string",xt._jsonSchemaVersion),bytes:ut("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sn{constructor(...t){for(let e=0;e<t.length;++e)if(t[e].length===0)throw new k(C.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new pt(t)}isEqual(t){return this._internalPath.isEqual(t._internalPath)}}function F_(){return new sn(Qs)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rs{constructor(t){this._methodName=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zt{constructor(t,e){if(!isFinite(t)||t<-90||t>90)throw new k(C.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+t);if(!isFinite(e)||e<-180||e>180)throw new k(C.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+e);this._lat=t,this._long=e}get latitude(){return this._lat}get longitude(){return this._long}isEqual(t){return this._lat===t._lat&&this._long===t._long}_compareTo(t){return j(this._lat,t._lat)||j(this._long,t._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:zt._jsonSchemaVersion}}static fromJSON(t){if($n(t,zt._jsonSchema))return new zt(t.latitude,t.longitude)}}zt._jsonSchemaVersion="firestore/geoPoint/1.0",zt._jsonSchema={type:ut("string",zt._jsonSchemaVersion),latitude:ut("number"),longitude:ut("number")};/**
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
 */class Ht{constructor(t){this._values=(t||[]).map(e=>e)}toArray(){return this._values.map(t=>t)}isEqual(t){return function(r,s){if(r.length!==s.length)return!1;for(let o=0;o<r.length;++o)if(r[o]!==s[o])return!1;return!0}(this._values,t._values)}toJSON(){return{type:Ht._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(t){if($n(t,Ht._jsonSchema)){if(Array.isArray(t.vectorValues)&&t.vectorValues.every(e=>typeof e=="number"))return new Ht(t.vectorValues);throw new k(C.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}Ht._jsonSchemaVersion="firestore/vectorValue/1.0",Ht._jsonSchema={type:ut("string",Ht._jsonSchemaVersion),vectorValues:ut("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $m=/^__.*__$/;class zm{constructor(t,e,r){this.data=t,this.fieldMask=e,this.fieldTransforms=r}toMutation(t,e){return this.fieldMask!==null?new ye(t,this.data,this.fieldMask,e,this.fieldTransforms):new zn(t,this.data,e,this.fieldTransforms)}}class rl{constructor(t,e,r){this.data=t,this.fieldMask=e,this.fieldTransforms=r}toMutation(t,e){return new ye(t,this.data,this.fieldMask,e,this.fieldTransforms)}}function sl(n){switch(n){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw M(40011,{Ac:n})}}class Yi{constructor(t,e,r,s,o,a){this.settings=t,this.databaseId=e,this.serializer=r,this.ignoreUndefinedProperties=s,o===void 0&&this.Rc(),this.fieldTransforms=o||[],this.fieldMask=a||[]}get path(){return this.settings.path}get Ac(){return this.settings.Ac}Vc(t){return new Yi({...this.settings,...t},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}mc(t){var s;const e=(s=this.path)==null?void 0:s.child(t),r=this.Vc({path:e,fc:!1});return r.gc(t),r}yc(t){var s;const e=(s=this.path)==null?void 0:s.child(t),r=this.Vc({path:e,fc:!1});return r.Rc(),r}wc(t){return this.Vc({path:void 0,fc:!0})}Sc(t){return Ur(t,this.settings.methodName,this.settings.bc||!1,this.path,this.settings.Dc)}contains(t){return this.fieldMask.find(e=>t.isPrefixOf(e))!==void 0||this.fieldTransforms.find(e=>t.isPrefixOf(e.field))!==void 0}Rc(){if(this.path)for(let t=0;t<this.path.length;t++)this.gc(this.path.get(t))}gc(t){if(t.length===0)throw this.Sc("Document fields must not be empty");if(sl(this.Ac)&&$m.test(t))throw this.Sc('Document fields cannot begin and end with "__"')}}class Hm{constructor(t,e,r){this.databaseId=t,this.ignoreUndefinedProperties=e,this.serializer=r||Zr(t)}Cc(t,e,r,s=!1){return new Yi({Ac:t,methodName:e,Dc:r,path:pt.emptyPath(),fc:!1,bc:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function ss(n){const t=n._freezeSettings(),e=Zr(n._databaseId);return new Hm(n._databaseId,!!t.ignoreUndefinedProperties,e)}function il(n,t,e,r,s,o={}){const a=n.Cc(o.merge||o.mergeFields?2:0,t,e,s);Zi("Data must be an object, but it was:",a,r);const c=ul(r,a);let h,d;if(o.merge)h=new kt(a.fieldMask),d=a.fieldTransforms;else if(o.mergeFields){const p=[];for(const y of o.mergeFields){const E=di(t,y,e);if(!a.contains(E))throw new k(C.INVALID_ARGUMENT,`Field '${E}' is specified in your field mask but missing from your input data.`);ll(p,E)||p.push(E)}h=new kt(p),d=a.fieldTransforms.filter(y=>h.covers(y.field))}else h=null,d=a.fieldTransforms;return new zm(new bt(c),h,d)}class is extends rs{_toFieldTransform(t){if(t.Ac!==2)throw t.Ac===1?t.Sc(`${this._methodName}() can only appear at the top level of your update data`):t.Sc(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return t.fieldMask.push(t.path),null}isEqual(t){return t instanceof is}}class Ji extends rs{_toFieldTransform(t){return new Nf(t.path,new Bn)}isEqual(t){return t instanceof Ji}}function ol(n,t,e,r){const s=n.Cc(1,t,e);Zi("Data must be an object, but it was:",s,r);const o=[],a=bt.empty();_e(r,(h,d)=>{const p=to(t,h,e);d=ct(d);const y=s.yc(p);if(d instanceof is)o.push(p);else{const E=Wn(d,y);E!=null&&(o.push(p),a.set(p,E))}});const c=new kt(o);return new rl(a,c,s.fieldTransforms)}function al(n,t,e,r,s,o){const a=n.Cc(1,t,e),c=[di(t,r,e)],h=[s];if(o.length%2!=0)throw new k(C.INVALID_ARGUMENT,`Function ${t}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let E=0;E<o.length;E+=2)c.push(di(t,o[E])),h.push(o[E+1]);const d=[],p=bt.empty();for(let E=c.length-1;E>=0;--E)if(!ll(d,c[E])){const S=c[E];let b=h[E];b=ct(b);const N=a.yc(S);if(b instanceof is)d.push(S);else{const V=Wn(b,N);V!=null&&(d.push(S),p.set(S,V))}}const y=new kt(d);return new rl(p,y,a.fieldTransforms)}function Gm(n,t,e,r=!1){return Wn(e,n.Cc(r?4:3,t))}function Wn(n,t){if(cl(n=ct(n)))return Zi("Unsupported field value:",t,n),ul(n,t);if(n instanceof rs)return function(r,s){if(!sl(s.Ac))throw s.Sc(`${r._methodName}() can only be used with update() and set()`);if(!s.path)throw s.Sc(`${r._methodName}() is not currently supported inside arrays`);const o=r._toFieldTransform(s);o&&s.fieldTransforms.push(o)}(n,t),null;if(n===void 0&&t.ignoreUndefinedProperties)return null;if(t.path&&t.fieldMask.push(t.path),n instanceof Array){if(t.settings.fc&&t.Ac!==4)throw t.Sc("Nested arrays are not supported");return function(r,s){const o=[];let a=0;for(const c of r){let h=Wn(c,s.wc(a));h==null&&(h={nullValue:"NULL_VALUE"}),o.push(h),a++}return{arrayValue:{values:o}}}(n,t)}return function(r,s){if((r=ct(r))===null)return{nullValue:"NULL_VALUE"};if(typeof r=="number")return bf(s.serializer,r);if(typeof r=="boolean")return{booleanValue:r};if(typeof r=="string")return{stringValue:r};if(r instanceof Date){const o=J.fromDate(r);return{timestampValue:Or(s.serializer,o)}}if(r instanceof J){const o=new J(r.seconds,1e3*Math.floor(r.nanoseconds/1e3));return{timestampValue:Or(s.serializer,o)}}if(r instanceof zt)return{geoPointValue:{latitude:r.latitude,longitude:r.longitude}};if(r instanceof xt)return{bytesValue:Cc(s.serializer,r._byteString)};if(r instanceof et){const o=s.databaseId,a=r.firestore._databaseId;if(!a.isEqual(o))throw s.Sc(`Document reference is for database ${a.projectId}/${a.database} but should be for database ${o.projectId}/${o.database}`);return{referenceValue:Ni(r.firestore._databaseId||s.databaseId,r._key.path)}}if(r instanceof Ht)return function(a,c){return{mapValue:{fields:{[ec]:{stringValue:nc},[Dr]:{arrayValue:{values:a.toArray().map(d=>{if(typeof d!="number")throw c.Sc("VectorValues must only contain numeric values.");return bi(c.serializer,d)})}}}}}}(r,s);throw s.Sc(`Unsupported field value: ${jr(r)}`)}(n,t)}function ul(n,t){const e={};return Qu(n)?t.path&&t.path.length>0&&t.fieldMask.push(t.path):_e(n,(r,s)=>{const o=Wn(s,t.mc(r));o!=null&&(e[r]=o)}),{mapValue:{fields:e}}}function cl(n){return!(typeof n!="object"||n===null||n instanceof Array||n instanceof Date||n instanceof J||n instanceof zt||n instanceof xt||n instanceof et||n instanceof rs||n instanceof Ht)}function Zi(n,t,e){if(!cl(e)||!Ku(e)){const r=jr(e);throw r==="an object"?t.Sc(n+" a custom object"):t.Sc(n+" "+r)}}function di(n,t,e){if((t=ct(t))instanceof sn)return t._internalPath;if(typeof t=="string")return to(n,t);throw Ur("Field path arguments must be of type string or ",n,!1,void 0,e)}const Km=new RegExp("[~\\*/\\[\\]]");function to(n,t,e){if(t.search(Km)>=0)throw Ur(`Invalid field path (${t}). Paths must not contain '~', '*', '/', '[', or ']'`,n,!1,void 0,e);try{return new sn(...t.split("."))._internalPath}catch{throw Ur(`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,n,!1,void 0,e)}}function Ur(n,t,e,r,s){const o=r&&!r.isEmpty(),a=s!==void 0;let c=`Function ${t}() called with invalid data`;e&&(c+=" (via `toFirestore()`)"),c+=". ";let h="";return(o||a)&&(h+=" (found",o&&(h+=` in field ${r}`),a&&(h+=` in document ${s}`),h+=")"),new k(C.INVALID_ARGUMENT,c+n+h)}function ll(n,t){return n.some(e=>e.isEqual(t))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hl{constructor(t,e,r,s,o){this._firestore=t,this._userDataWriter=e,this._key=r,this._document=s,this._converter=o}get id(){return this._key.path.lastSegment()}get ref(){return new et(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const t=new Wm(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(t)}return this._userDataWriter.convertValue(this._document.data.value)}}get(t){if(this._document){const e=this._document.data.field(os("DocumentSnapshot.get",t));if(e!==null)return this._userDataWriter.convertValue(e)}}}class Wm extends hl{data(){return super.data()}}function os(n,t){return typeof t=="string"?to(n,t):t instanceof sn?t._internalPath:t._delegate._internalPath}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dl(n){if(n.limitType==="L"&&n.explicitOrderBy.length===0)throw new k(C.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class eo{}class fl extends eo{}function U_(n,t,...e){let r=[];t instanceof eo&&r.push(t),r=r.concat(e),function(o){const a=o.filter(h=>h instanceof no).length,c=o.filter(h=>h instanceof as).length;if(a>1||a>0&&c>0)throw new k(C.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")}(r);for(const s of r)n=s._apply(n);return n}class as extends fl{constructor(t,e,r){super(),this._field=t,this._op=e,this._value=r,this.type="where"}static _create(t,e,r){return new as(t,e,r)}_apply(t){const e=this._parse(t);return pl(t._query,e),new Ee(t.firestore,t.converter,ei(t._query,e))}_parse(t){const e=ss(t.firestore);return function(o,a,c,h,d,p,y){let E;if(d.isKeyField()){if(p==="array-contains"||p==="array-contains-any")throw new k(C.INVALID_ARGUMENT,`Invalid Query. You can't perform '${p}' queries on documentId().`);if(p==="in"||p==="not-in"){Eu(y,p);const b=[];for(const N of y)b.push(yu(h,o,N));E={arrayValue:{values:b}}}else E=yu(h,o,y)}else p!=="in"&&p!=="not-in"&&p!=="array-contains-any"||Eu(y,p),E=Gm(c,a,y,p==="in"||p==="not-in");return at.create(d,p,E)}(t._query,"where",e,t.firestore._databaseId,this._field,this._op,this._value)}}function B_(n,t,e){const r=t,s=os("where",n);return as._create(s,r,e)}class no extends eo{constructor(t,e){super(),this.type=t,this._queryConstraints=e}static _create(t,e){return new no(t,e)}_parse(t){const e=this._queryConstraints.map(r=>r._parse(t)).filter(r=>r.getFilters().length>0);return e.length===1?e[0]:Lt.create(e,this._getOperator())}_apply(t){const e=this._parse(t);return e.getFilters().length===0?t:(function(s,o){let a=s;const c=o.getFlattenedFilters();for(const h of c)pl(a,h),a=ei(a,h)}(t._query,e),new Ee(t.firestore,t.converter,ei(t._query,e)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}class ro extends fl{constructor(t,e){super(),this._field=t,this._direction=e,this.type="orderBy"}static _create(t,e){return new ro(t,e)}_apply(t){const e=function(s,o,a){if(s.startAt!==null)throw new k(C.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(s.endAt!==null)throw new k(C.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new Un(o,a)}(t._query,this._field,this._direction);return new Ee(t.firestore,t.converter,function(s,o){const a=s.explicitOrderBy.concat([o]);return new en(s.path,s.collectionGroup,a,s.filters.slice(),s.limit,s.limitType,s.startAt,s.endAt)}(t._query,e))}}function q_(n,t="asc"){const e=t,r=os("orderBy",n);return ro._create(r,e)}function yu(n,t,e){if(typeof(e=ct(e))=="string"){if(e==="")throw new k(C.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!lc(t)&&e.indexOf("/")!==-1)throw new k(C.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${e}' contains a '/' character.`);const r=t.path.child(X.fromString(e));if(!x.isDocumentKey(r))throw new k(C.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${r}' is not because it has an odd number of segments (${r.length}).`);return Oa(n,new x(r))}if(e instanceof et)return Oa(n,e._key);throw new k(C.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${jr(e)}.`)}function Eu(n,t){if(!Array.isArray(n)||n.length===0)throw new k(C.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${t.toString()}' filters.`)}function pl(n,t){const e=function(s,o){for(const a of s)for(const c of a.getFlattenedFilters())if(o.indexOf(c.op)>=0)return c.op;return null}(n.filters,function(s){switch(s){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}}(t.op));if(e!==null)throw e===t.op?new k(C.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${t.op.toString()}' filter.`):new k(C.INVALID_ARGUMENT,`Invalid query. You cannot use '${t.op.toString()}' filters with '${e.toString()}' filters.`)}class Qm{convertValue(t,e="none"){switch(fe(t)){case 0:return null;case 1:return t.booleanValue;case 2:return it(t.integerValue||t.doubleValue);case 3:return this.convertTimestamp(t.timestampValue);case 4:return this.convertServerTimestamp(t,e);case 5:return t.stringValue;case 6:return this.convertBytes(de(t.bytesValue));case 7:return this.convertReference(t.referenceValue);case 8:return this.convertGeoPoint(t.geoPointValue);case 9:return this.convertArray(t.arrayValue,e);case 11:return this.convertObject(t.mapValue,e);case 10:return this.convertVectorValue(t.mapValue);default:throw M(62114,{value:t})}}convertObject(t,e){return this.convertObjectMap(t.fields,e)}convertObjectMap(t,e="none"){const r={};return _e(t,(s,o)=>{r[s]=this.convertValue(o,e)}),r}convertVectorValue(t){var r,s,o;const e=(o=(s=(r=t.fields)==null?void 0:r[Dr].arrayValue)==null?void 0:s.values)==null?void 0:o.map(a=>it(a.doubleValue));return new Ht(e)}convertGeoPoint(t){return new zt(it(t.latitude),it(t.longitude))}convertArray(t,e){return(t.values||[]).map(r=>this.convertValue(r,e))}convertServerTimestamp(t,e){switch(e){case"previous":const r=Hr(t);return r==null?null:this.convertValue(r,e);case"estimate":return this.convertTimestamp(Mn(t));default:return null}}convertTimestamp(t){const e=he(t);return new J(e.seconds,e.nanos)}convertDocumentKey(t,e){const r=X.fromString(t);W(Oc(r),9688,{name:t});const s=new Ln(r.get(1),r.get(3)),o=new x(r.popFirst(5));return s.isEqual(e)||Jt(`Document ${o} contains a document reference within a different database (${s.projectId}/${s.database}) which is not supported. It will be treated as a reference in the current database (${e.projectId}/${e.database}) instead.`),o}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ml(n,t,e){let r;return r=n?e&&(e.merge||e.mergeFields)?n.toFirestore(t,e):n.toFirestore(t):t,r}function Xm(){return new qm("count")}class Cn{constructor(t,e){this.hasPendingWrites=t,this.fromCache=e}isEqual(t){return this.hasPendingWrites===t.hasPendingWrites&&this.fromCache===t.fromCache}}class Se extends hl{constructor(t,e,r,s,o,a){super(t,e,r,s,a),this._firestore=t,this._firestoreImpl=t,this.metadata=o}exists(){return super.exists()}data(t={}){if(this._document){if(this._converter){const e=new Sr(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(e,t)}return this._userDataWriter.convertValue(this._document.data.value,t.serverTimestamps)}}get(t,e={}){if(this._document){const r=this._document.data.field(os("DocumentSnapshot.get",t));if(r!==null)return this._userDataWriter.convertValue(r,e.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new k(C.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const t=this._document,e={};return e.type=Se._jsonSchemaVersion,e.bundle="",e.bundleSource="DocumentSnapshot",e.bundleName=this._key.toString(),!t||!t.isValidDocument()||!t.isFoundDocument()?e:(this._userDataWriter.convertObjectMap(t.data.value.mapValue.fields,"previous"),e.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),e)}}Se._jsonSchemaVersion="firestore/documentSnapshot/1.0",Se._jsonSchema={type:ut("string",Se._jsonSchemaVersion),bundleSource:ut("string","DocumentSnapshot"),bundleName:ut("string"),bundle:ut("string")};class Sr extends Se{data(t={}){return super.data(t)}}class Ce{constructor(t,e,r,s){this._firestore=t,this._userDataWriter=e,this._snapshot=s,this.metadata=new Cn(s.hasPendingWrites,s.fromCache),this.query=r}get docs(){const t=[];return this.forEach(e=>t.push(e)),t}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(t,e){this._snapshot.docs.forEach(r=>{t.call(e,new Sr(this._firestore,this._userDataWriter,r.key,r,new Cn(this._snapshot.mutatedKeys.has(r.key),this._snapshot.fromCache),this.query.converter))})}docChanges(t={}){const e=!!t.includeMetadataChanges;if(e&&this._snapshot.excludesMetadataChanges)throw new k(C.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===e||(this._cachedChanges=function(s,o){if(s._snapshot.oldDocs.isEmpty()){let a=0;return s._snapshot.docChanges.map(c=>{const h=new Sr(s._firestore,s._userDataWriter,c.doc.key,c.doc,new Cn(s._snapshot.mutatedKeys.has(c.doc.key),s._snapshot.fromCache),s.query.converter);return c.doc,{type:"added",doc:h,oldIndex:-1,newIndex:a++}})}{let a=s._snapshot.oldDocs;return s._snapshot.docChanges.filter(c=>o||c.type!==3).map(c=>{const h=new Sr(s._firestore,s._userDataWriter,c.doc.key,c.doc,new Cn(s._snapshot.mutatedKeys.has(c.doc.key),s._snapshot.fromCache),s.query.converter);let d=-1,p=-1;return c.type!==0&&(d=a.indexOf(c.doc.key),a=a.delete(c.doc.key)),c.type!==1&&(a=a.add(c.doc),p=a.indexOf(c.doc.key)),{type:Ym(c.type),doc:h,oldIndex:d,newIndex:p}})}}(this,e),this._cachedChangesIncludeMetadataChanges=e),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new k(C.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const t={};t.type=Ce._jsonSchemaVersion,t.bundleSource="QuerySnapshot",t.bundleName=Ai.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const e=[],r=[],s=[];return this.docs.forEach(o=>{o._document!==null&&(e.push(o._document),r.push(this._userDataWriter.convertObjectMap(o._document.data.value.mapValue.fields,"previous")),s.push(o.ref.path))}),t.bundle=(this._firestore,this.query._query,t.bundleName,"NOT SUPPORTED"),t}}function Ym(n){switch(n){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return M(61501,{type:n})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function j_(n){n=St(n,et);const t=St(n.firestore,Kt);return xm(rn(t),n._key).then(e=>gl(t,n,e))}Ce._jsonSchemaVersion="firestore/querySnapshot/1.0",Ce._jsonSchema={type:ut("string",Ce._jsonSchemaVersion),bundleSource:ut("string","QuerySnapshot"),bundleName:ut("string"),bundle:ut("string")};class us extends Qm{constructor(t){super(),this.firestore=t}convertBytes(t){return new xt(t)}convertReference(t){const e=this.convertDocumentKey(t,this.firestore._databaseId);return new et(this.firestore,null,e)}}function $_(n){n=St(n,Ee);const t=St(n.firestore,Kt),e=rn(t),r=new us(t);return dl(n._query),Mm(e,n._query).then(s=>new Ce(t,r,n,s))}function z_(n,t,e){n=St(n,et);const r=St(n.firestore,Kt),s=ml(n.converter,t,e);return cs(r,[il(ss(r),"setDoc",n._key,s,n.converter!==null,e).toMutation(n._key,Dt.none())])}function H_(n,t,e,...r){n=St(n,et);const s=St(n.firestore,Kt),o=ss(s);let a;return a=typeof(t=ct(t))=="string"||t instanceof sn?al(o,"updateDoc",n._key,t,e,r):ol(o,"updateDoc",n._key,t),cs(s,[a.toMutation(n._key,Dt.exists(!0))])}function G_(n){return cs(St(n.firestore,Kt),[new Yr(n._key,Dt.none())])}function K_(n,...t){var h,d,p;n=ct(n);let e={includeMetadataChanges:!1,source:"default"},r=0;typeof t[r]!="object"||_u(t[r])||(e=t[r++]);const s={includeMetadataChanges:e.includeMetadataChanges,source:e.source};if(_u(t[r])){const y=t[r];t[r]=(h=y.next)==null?void 0:h.bind(y),t[r+1]=(d=y.error)==null?void 0:d.bind(y),t[r+2]=(p=y.complete)==null?void 0:p.bind(y)}let o,a,c;if(n instanceof et)a=St(n.firestore,Kt),c=Gr(n._key.path),o={next:y=>{t[r]&&t[r](gl(a,n,y))},error:t[r+1],complete:t[r+2]};else{const y=St(n,Ee);a=St(y.firestore,Kt),c=y._query;const E=new us(a);o={next:S=>{t[r]&&t[r](new Ce(a,E,y,S))},error:t[r+1],complete:t[r+2]},dl(n._query)}return function(E,S,b,N){const V=new Qi(N),q=new Gi(S,V,b);return E.asyncQueue.enqueueAndForget(async()=>$i(await Fr(E),q)),()=>{V.Nu(),E.asyncQueue.enqueueAndForget(async()=>zi(await Fr(E),q))}}(rn(a),c,s,o)}function cs(n,t){return function(r,s){const o=new qt;return r.asyncQueue.enqueueAndForget(async()=>Im(await km(r),s,o)),o.promise}(rn(n),t)}function gl(n,t,e){const r=e.docs.get(t._key),s=new us(n);return new Se(n,s,t._key,r,new Cn(e.hasPendingWrites,e.fromCache),t.converter)}function W_(n){return Jm(n,{count:Xm()})}function Jm(n,t){const e=St(n.firestore,Kt),r=rn(e),s=rf(t,(o,a)=>new Bf(a,o.aggregateType,o._internalFieldPath));return Lm(r,n._query,s).then(o=>function(c,h,d){const p=new us(c);return new jm(h,p,d)}(e,n,o))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zm{constructor(t,e){this._firestore=t,this._commitHandler=e,this._mutations=[],this._committed=!1,this._dataReader=ss(t)}set(t,e,r){this._verifyNotCommitted();const s=qs(t,this._firestore),o=ml(s.converter,e,r),a=il(this._dataReader,"WriteBatch.set",s._key,o,s.converter!==null,r);return this._mutations.push(a.toMutation(s._key,Dt.none())),this}update(t,e,r,...s){this._verifyNotCommitted();const o=qs(t,this._firestore);let a;return a=typeof(e=ct(e))=="string"||e instanceof sn?al(this._dataReader,"WriteBatch.update",o._key,e,r,s):ol(this._dataReader,"WriteBatch.update",o._key,e),this._mutations.push(a.toMutation(o._key,Dt.exists(!0))),this}delete(t){this._verifyNotCommitted();const e=qs(t,this._firestore);return this._mutations=this._mutations.concat(new Yr(e._key,Dt.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new k(C.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function qs(n,t){if((n=ct(n)).firestore!==t)throw new k(C.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return n}function Q_(){return new Ji("serverTimestamp")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function X_(n){return rn(n=St(n,Kt)),new Zm(n,t=>cs(n,t))}(function(t,e=!0){(function(s){Je=s})(Ou),$e(new be("firestore",(r,{instanceIdentifier:s,options:o})=>{const a=r.getProvider("app").getImmediate(),c=new Kt(new Ud(r.getProvider("auth-internal")),new jd(a,r.getProvider("app-check-internal")),function(d,p){if(!Object.prototype.hasOwnProperty.apply(d.options,["projectId"]))throw new k(C.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new Ln(d.options.projectId,p)}(a,s),a);return o={useFetchStreams:e,...o},c._setSettings(o),c},"PUBLIC").setMultipleInstances(!0)),Bt(Ia,Aa,t),Bt(Ia,Aa,"esm2020")})();/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _l="firebasestorage.googleapis.com",yl="storageBucket",tg=2*60*1e3,eg=10*60*1e3;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rt extends ge{constructor(t,e,r=0){super(js(t),`Firebase Storage: ${e} (${js(t)})`),this.status_=r,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,rt.prototype)}get status(){return this.status_}set status(t){this.status_=t}_codeEquals(t){return js(t)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(t){this.customData.serverResponse=t,this.customData.serverResponse?this.message=`${this._baseMessage}
${this.customData.serverResponse}`:this.message=this._baseMessage}}var nt;(function(n){n.UNKNOWN="unknown",n.OBJECT_NOT_FOUND="object-not-found",n.BUCKET_NOT_FOUND="bucket-not-found",n.PROJECT_NOT_FOUND="project-not-found",n.QUOTA_EXCEEDED="quota-exceeded",n.UNAUTHENTICATED="unauthenticated",n.UNAUTHORIZED="unauthorized",n.UNAUTHORIZED_APP="unauthorized-app",n.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",n.INVALID_CHECKSUM="invalid-checksum",n.CANCELED="canceled",n.INVALID_EVENT_NAME="invalid-event-name",n.INVALID_URL="invalid-url",n.INVALID_DEFAULT_BUCKET="invalid-default-bucket",n.NO_DEFAULT_BUCKET="no-default-bucket",n.CANNOT_SLICE_BLOB="cannot-slice-blob",n.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",n.NO_DOWNLOAD_URL="no-download-url",n.INVALID_ARGUMENT="invalid-argument",n.INVALID_ARGUMENT_COUNT="invalid-argument-count",n.APP_DELETED="app-deleted",n.INVALID_ROOT_OPERATION="invalid-root-operation",n.INVALID_FORMAT="invalid-format",n.INTERNAL_ERROR="internal-error",n.UNSUPPORTED_ENVIRONMENT="unsupported-environment"})(nt||(nt={}));function js(n){return"storage/"+n}function so(){const n="An unknown error occurred, please check the error payload for server response.";return new rt(nt.UNKNOWN,n)}function ng(n){return new rt(nt.OBJECT_NOT_FOUND,"Object '"+n+"' does not exist.")}function rg(n){return new rt(nt.QUOTA_EXCEEDED,"Quota for bucket '"+n+"' exceeded, please view quota on https://firebase.google.com/pricing/.")}function sg(){const n="User is not authenticated, please authenticate using Firebase Authentication and try again.";return new rt(nt.UNAUTHENTICATED,n)}function ig(){return new rt(nt.UNAUTHORIZED_APP,"This app does not have permission to access Firebase Storage on this project.")}function og(n){return new rt(nt.UNAUTHORIZED,"User does not have permission to access '"+n+"'.")}function ag(){return new rt(nt.RETRY_LIMIT_EXCEEDED,"Max retry time for operation exceeded, please try again.")}function ug(){return new rt(nt.CANCELED,"User canceled the upload/download.")}function cg(n){return new rt(nt.INVALID_URL,"Invalid URL '"+n+"'.")}function lg(n){return new rt(nt.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+n+"'.")}function hg(){return new rt(nt.NO_DEFAULT_BUCKET,"No default bucket found. Did you set the '"+yl+"' property when initializing the app?")}function dg(){return new rt(nt.CANNOT_SLICE_BLOB,"Cannot slice blob for upload. Please retry the upload.")}function fg(){return new rt(nt.NO_DOWNLOAD_URL,"The given file does not have any download URLs.")}function pg(n){return new rt(nt.UNSUPPORTED_ENVIRONMENT,`${n} is missing. Make sure to install the required polyfills. See https://firebase.google.com/docs/web/environments-js-sdk#polyfills for more information.`)}function fi(n){return new rt(nt.INVALID_ARGUMENT,n)}function El(){return new rt(nt.APP_DELETED,"The Firebase app was deleted.")}function mg(n){return new rt(nt.INVALID_ROOT_OPERATION,"The operation '"+n+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}function kn(n,t){return new rt(nt.INVALID_FORMAT,"String does not match format '"+n+"': "+t)}function An(n){throw new rt(nt.INTERNAL_ERROR,"Internal error: "+n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ot{constructor(t,e){this.bucket=t,this.path_=e}get path(){return this.path_}get isRoot(){return this.path.length===0}fullServerUrl(){const t=encodeURIComponent;return"/b/"+t(this.bucket)+"/o/"+t(this.path)}bucketOnlyServerUrl(){return"/b/"+encodeURIComponent(this.bucket)+"/o"}static makeFromBucketSpec(t,e){let r;try{r=Ot.makeFromUrl(t,e)}catch{return new Ot(t,"")}if(r.path==="")return r;throw lg(t)}static makeFromUrl(t,e){let r=null;const s="([A-Za-z0-9.\\-_]+)";function o(z){z.path.charAt(z.path.length-1)==="/"&&(z.path_=z.path_.slice(0,-1))}const a="(/(.*))?$",c=new RegExp("^gs://"+s+a,"i"),h={bucket:1,path:3};function d(z){z.path_=decodeURIComponent(z.path)}const p="v[A-Za-z0-9_]+",y=e.replace(/[.]/g,"\\."),E="(/([^?#]*).*)?$",S=new RegExp(`^https?://${y}/${p}/b/${s}/o${E}`,"i"),b={bucket:1,path:3},N=e===_l?"(?:storage.googleapis.com|storage.cloud.google.com)":e,V="([^?#]*)",q=new RegExp(`^https?://${N}/${s}/${V}`,"i"),B=[{regex:c,indices:h,postModify:o},{regex:S,indices:b,postModify:d},{regex:q,indices:{bucket:1,path:2},postModify:d}];for(let z=0;z<B.length;z++){const Ct=B[z],st=Ct.regex.exec(t);if(st){const I=st[Ct.indices.bucket];let m=st[Ct.indices.path];m||(m=""),r=new Ot(I,m),Ct.postModify(r);break}}if(r==null)throw cg(t);return r}}class gg{constructor(t){this.promise_=Promise.reject(t)}getPromise(){return this.promise_}cancel(t=!1){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _g(n,t,e){let r=1,s=null,o=null,a=!1,c=0;function h(){return c===2}let d=!1;function p(...V){d||(d=!0,t.apply(null,V))}function y(V){s=setTimeout(()=>{s=null,n(S,h())},V)}function E(){o&&clearTimeout(o)}function S(V,...q){if(d){E();return}if(V){E(),p.call(null,V,...q);return}if(h()||a){E(),p.call(null,V,...q);return}r<64&&(r*=2);let B;c===1?(c=2,B=0):B=(r+Math.random())*1e3,y(B)}let b=!1;function N(V){b||(b=!0,E(),!d&&(s!==null?(V||(c=2),clearTimeout(s),y(0)):V||(c=1)))}return y(0),o=setTimeout(()=>{a=!0,N(!0)},e),N}function yg(n){n(!1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Eg(n){return n!==void 0}function Tg(n){return typeof n=="object"&&!Array.isArray(n)}function io(n){return typeof n=="string"||n instanceof String}function Tu(n){return oo()&&n instanceof Blob}function oo(){return typeof Blob<"u"}function wu(n,t,e,r){if(r<t)throw fi(`Invalid value for '${n}'. Expected ${t} or greater.`);if(r>e)throw fi(`Invalid value for '${n}'. Expected ${e} or less.`)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ls(n,t,e){let r=t;return e==null&&(r=`https://${t}`),`${e}://${r}/v0${n}`}function Tl(n){const t=encodeURIComponent;let e="?";for(const r in n)if(n.hasOwnProperty(r)){const s=t(r)+"="+t(n[r]);e=e+s+"&"}return e=e.slice(0,-1),e}var Pe;(function(n){n[n.NO_ERROR=0]="NO_ERROR",n[n.NETWORK_ERROR=1]="NETWORK_ERROR",n[n.ABORT=2]="ABORT"})(Pe||(Pe={}));/**
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
 */function wg(n,t){const e=n>=500&&n<600,s=[408,429].indexOf(n)!==-1,o=t.indexOf(n)!==-1;return e||s||o}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ig{constructor(t,e,r,s,o,a,c,h,d,p,y,E=!0,S=!1){this.url_=t,this.method_=e,this.headers_=r,this.body_=s,this.successCodes_=o,this.additionalRetryCodes_=a,this.callback_=c,this.errorCallback_=h,this.timeout_=d,this.progressCallback_=p,this.connectionFactory_=y,this.retry=E,this.isUsingEmulator=S,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((b,N)=>{this.resolve_=b,this.reject_=N,this.start_()})}start_(){const t=(r,s)=>{if(s){r(!1,new Er(!1,null,!0));return}const o=this.connectionFactory_();this.pendingConnection_=o;const a=c=>{const h=c.loaded,d=c.lengthComputable?c.total:-1;this.progressCallback_!==null&&this.progressCallback_(h,d)};this.progressCallback_!==null&&o.addUploadProgressListener(a),o.send(this.url_,this.method_,this.isUsingEmulator,this.body_,this.headers_).then(()=>{this.progressCallback_!==null&&o.removeUploadProgressListener(a),this.pendingConnection_=null;const c=o.getErrorCode()===Pe.NO_ERROR,h=o.getStatus();if(!c||wg(h,this.additionalRetryCodes_)&&this.retry){const p=o.getErrorCode()===Pe.ABORT;r(!1,new Er(!1,null,p));return}const d=this.successCodes_.indexOf(h)!==-1;r(!0,new Er(d,o))})},e=(r,s)=>{const o=this.resolve_,a=this.reject_,c=s.connection;if(s.wasSuccessCode)try{const h=this.callback_(c,c.getResponse());Eg(h)?o(h):o()}catch(h){a(h)}else if(c!==null){const h=so();h.serverResponse=c.getErrorText(),this.errorCallback_?a(this.errorCallback_(c,h)):a(h)}else if(s.canceled){const h=this.appDelete_?El():ug();a(h)}else{const h=ag();a(h)}};this.canceled_?e(!1,new Er(!1,null,!0)):this.backoffId_=_g(t,e,this.timeout_)}getPromise(){return this.promise_}cancel(t){this.canceled_=!0,this.appDelete_=t||!1,this.backoffId_!==null&&yg(this.backoffId_),this.pendingConnection_!==null&&this.pendingConnection_.abort()}}class Er{constructor(t,e,r){this.wasSuccessCode=t,this.connection=e,this.canceled=!!r}}function Ag(n,t){t!==null&&t.length>0&&(n.Authorization="Firebase "+t)}function vg(n,t){n["X-Firebase-Storage-Version"]="webjs/"+(t??"AppManager")}function Rg(n,t){t&&(n["X-Firebase-GMPID"]=t)}function Sg(n,t){t!==null&&(n["X-Firebase-AppCheck"]=t)}function Cg(n,t,e,r,s,o,a=!0,c=!1){const h=Tl(n.urlParams),d=n.url+h,p=Object.assign({},n.headers);return Rg(p,t),Ag(p,e),vg(p,o),Sg(p,r),new Ig(d,n.method,p,n.body,n.successCodes,n.additionalRetryCodes,n.handler,n.errorHandler,n.timeout,n.progressCallback,s,a,c)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Pg(){return typeof BlobBuilder<"u"?BlobBuilder:typeof WebKitBlobBuilder<"u"?WebKitBlobBuilder:void 0}function bg(...n){const t=Pg();if(t!==void 0){const e=new t;for(let r=0;r<n.length;r++)e.append(n[r]);return e.getBlob()}else{if(oo())return new Blob(n);throw new rt(nt.UNSUPPORTED_ENVIRONMENT,"This browser doesn't seem to support creating Blobs")}}function Vg(n,t,e){return n.webkitSlice?n.webkitSlice(t,e):n.mozSlice?n.mozSlice(t,e):n.slice?n.slice(t,e):null}/**
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
 */function Dg(n){if(typeof atob>"u")throw pg("base-64");return atob(n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ut={RAW:"raw",BASE64:"base64",BASE64URL:"base64url",DATA_URL:"data_url"};class $s{constructor(t,e){this.data=t,this.contentType=e||null}}function Ng(n,t){switch(n){case Ut.RAW:return new $s(wl(t));case Ut.BASE64:case Ut.BASE64URL:return new $s(Il(n,t));case Ut.DATA_URL:return new $s(Og(t),xg(t))}throw so()}function wl(n){const t=[];for(let e=0;e<n.length;e++){let r=n.charCodeAt(e);if(r<=127)t.push(r);else if(r<=2047)t.push(192|r>>6,128|r&63);else if((r&64512)===55296)if(!(e<n.length-1&&(n.charCodeAt(e+1)&64512)===56320))t.push(239,191,189);else{const o=r,a=n.charCodeAt(++e);r=65536|(o&1023)<<10|a&1023,t.push(240|r>>18,128|r>>12&63,128|r>>6&63,128|r&63)}else(r&64512)===56320?t.push(239,191,189):t.push(224|r>>12,128|r>>6&63,128|r&63)}return new Uint8Array(t)}function kg(n){let t;try{t=decodeURIComponent(n)}catch{throw kn(Ut.DATA_URL,"Malformed data URL.")}return wl(t)}function Il(n,t){switch(n){case Ut.BASE64:{const s=t.indexOf("-")!==-1,o=t.indexOf("_")!==-1;if(s||o)throw kn(n,"Invalid character '"+(s?"-":"_")+"' found: is it base64url encoded?");break}case Ut.BASE64URL:{const s=t.indexOf("+")!==-1,o=t.indexOf("/")!==-1;if(s||o)throw kn(n,"Invalid character '"+(s?"+":"/")+"' found: is it base64 encoded?");t=t.replace(/-/g,"+").replace(/_/g,"/");break}}let e;try{e=Dg(t)}catch(s){throw s.message.includes("polyfill")?s:kn(n,"Invalid character found")}const r=new Uint8Array(e.length);for(let s=0;s<e.length;s++)r[s]=e.charCodeAt(s);return r}class Al{constructor(t){this.base64=!1,this.contentType=null;const e=t.match(/^data:([^,]+)?,/);if(e===null)throw kn(Ut.DATA_URL,"Must be formatted 'data:[<mediatype>][;base64],<data>");const r=e[1]||null;r!=null&&(this.base64=Mg(r,";base64"),this.contentType=this.base64?r.substring(0,r.length-7):r),this.rest=t.substring(t.indexOf(",")+1)}}function Og(n){const t=new Al(n);return t.base64?Il(Ut.BASE64,t.rest):kg(t.rest)}function xg(n){return new Al(n).contentType}function Mg(n,t){return n.length>=t.length?n.substring(n.length-t.length)===t:!1}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ie{constructor(t,e){let r=0,s="";Tu(t)?(this.data_=t,r=t.size,s=t.type):t instanceof ArrayBuffer?(e?this.data_=new Uint8Array(t):(this.data_=new Uint8Array(t.byteLength),this.data_.set(new Uint8Array(t))),r=this.data_.length):t instanceof Uint8Array&&(e?this.data_=t:(this.data_=new Uint8Array(t.length),this.data_.set(t)),r=t.length),this.size_=r,this.type_=s}size(){return this.size_}type(){return this.type_}slice(t,e){if(Tu(this.data_)){const r=this.data_,s=Vg(r,t,e);return s===null?null:new ie(s)}else{const r=new Uint8Array(this.data_.buffer,t,e-t);return new ie(r,!0)}}static getBlob(...t){if(oo()){const e=t.map(r=>r instanceof ie?r.data_:r);return new ie(bg.apply(null,e))}else{const e=t.map(a=>io(a)?Ng(Ut.RAW,a).data:a.data_);let r=0;e.forEach(a=>{r+=a.byteLength});const s=new Uint8Array(r);let o=0;return e.forEach(a=>{for(let c=0;c<a.length;c++)s[o++]=a[c]}),new ie(s,!0)}}uploadData(){return this.data_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function vl(n){let t;try{t=JSON.parse(n)}catch{return null}return Tg(t)?t:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Lg(n){if(n.length===0)return null;const t=n.lastIndexOf("/");return t===-1?"":n.slice(0,t)}function Fg(n,t){const e=t.split("/").filter(r=>r.length>0).join("/");return n.length===0?e:n+"/"+e}function Rl(n){const t=n.lastIndexOf("/",n.length-2);return t===-1?n:n.slice(t+1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ug(n,t){return t}class Rt{constructor(t,e,r,s){this.server=t,this.local=e||t,this.writable=!!r,this.xform=s||Ug}}let Tr=null;function Bg(n){return!io(n)||n.length<2?n:Rl(n)}function Sl(){if(Tr)return Tr;const n=[];n.push(new Rt("bucket")),n.push(new Rt("generation")),n.push(new Rt("metageneration")),n.push(new Rt("name","fullPath",!0));function t(o,a){return Bg(a)}const e=new Rt("name");e.xform=t,n.push(e);function r(o,a){return a!==void 0?Number(a):a}const s=new Rt("size");return s.xform=r,n.push(s),n.push(new Rt("timeCreated")),n.push(new Rt("updated")),n.push(new Rt("md5Hash",null,!0)),n.push(new Rt("cacheControl",null,!0)),n.push(new Rt("contentDisposition",null,!0)),n.push(new Rt("contentEncoding",null,!0)),n.push(new Rt("contentLanguage",null,!0)),n.push(new Rt("contentType",null,!0)),n.push(new Rt("metadata","customMetadata",!0)),Tr=n,Tr}function qg(n,t){function e(){const r=n.bucket,s=n.fullPath,o=new Ot(r,s);return t._makeStorageReference(o)}Object.defineProperty(n,"ref",{get:e})}function jg(n,t,e){const r={};r.type="file";const s=e.length;for(let o=0;o<s;o++){const a=e[o];r[a.local]=a.xform(r,t[a.server])}return qg(r,n),r}function Cl(n,t,e){const r=vl(t);return r===null?null:jg(n,r,e)}function $g(n,t,e,r){const s=vl(t);if(s===null||!io(s.downloadTokens))return null;const o=s.downloadTokens;if(o.length===0)return null;const a=encodeURIComponent;return o.split(",").map(d=>{const p=n.bucket,y=n.fullPath,E="/b/"+a(p)+"/o/"+a(y),S=ls(E,e,r),b=Tl({alt:"media",token:d});return S+b})[0]}function zg(n,t){const e={},r=t.length;for(let s=0;s<r;s++){const o=t[s];o.writable&&(e[o.server]=n[o.local])}return JSON.stringify(e)}class ao{constructor(t,e,r,s){this.url=t,this.method=e,this.handler=r,this.timeout=s,this.urlParams={},this.headers={},this.body=null,this.errorHandler=null,this.progressCallback=null,this.successCodes=[200],this.additionalRetryCodes=[]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Pl(n){if(!n)throw so()}function Hg(n,t){function e(r,s){const o=Cl(n,s,t);return Pl(o!==null),o}return e}function Gg(n,t){function e(r,s){const o=Cl(n,s,t);return Pl(o!==null),$g(o,s,n.host,n._protocol)}return e}function bl(n){function t(e,r){let s;return e.getStatus()===401?e.getErrorText().includes("Firebase App Check token is invalid")?s=ig():s=sg():e.getStatus()===402?s=rg(n.bucket):e.getStatus()===403?s=og(n.path):s=r,s.status=e.getStatus(),s.serverResponse=r.serverResponse,s}return t}function Vl(n){const t=bl(n);function e(r,s){let o=t(r,s);return r.getStatus()===404&&(o=ng(n.path)),o.serverResponse=s.serverResponse,o}return e}function Kg(n,t,e){const r=t.fullServerUrl(),s=ls(r,n.host,n._protocol),o="GET",a=n.maxOperationRetryTime,c=new ao(s,o,Gg(n,e),a);return c.errorHandler=Vl(t),c}function Wg(n,t){const e=t.fullServerUrl(),r=ls(e,n.host,n._protocol),s="DELETE",o=n.maxOperationRetryTime;function a(h,d){}const c=new ao(r,s,a,o);return c.successCodes=[200,204],c.errorHandler=Vl(t),c}function Qg(n,t){return n&&n.contentType||t&&t.type()||"application/octet-stream"}function Xg(n,t,e){const r=Object.assign({},e);return r.fullPath=n.path,r.size=t.size(),r.contentType||(r.contentType=Qg(null,t)),r}function Yg(n,t,e,r,s){const o=t.bucketOnlyServerUrl(),a={"X-Goog-Upload-Protocol":"multipart"};function c(){let B="";for(let z=0;z<2;z++)B=B+Math.random().toString().slice(2);return B}const h=c();a["Content-Type"]="multipart/related; boundary="+h;const d=Xg(t,r,s),p=zg(d,e),y="--"+h+`\r
Content-Type: application/json; charset=utf-8\r
\r
`+p+`\r
--`+h+`\r
Content-Type: `+d.contentType+`\r
\r
`,E=`\r
--`+h+"--",S=ie.getBlob(y,r,E);if(S===null)throw dg();const b={name:d.fullPath},N=ls(o,n.host,n._protocol),V="POST",q=n.maxUploadRetryTime,F=new ao(N,V,Hg(n,e),q);return F.urlParams=b,F.headers=a,F.body=S.uploadData(),F.errorHandler=bl(t),F}class Jg{constructor(){this.sent_=!1,this.xhr_=new XMLHttpRequest,this.initXhr(),this.errorCode_=Pe.NO_ERROR,this.sendPromise_=new Promise(t=>{this.xhr_.addEventListener("abort",()=>{this.errorCode_=Pe.ABORT,t()}),this.xhr_.addEventListener("error",()=>{this.errorCode_=Pe.NETWORK_ERROR,t()}),this.xhr_.addEventListener("load",()=>{t()})})}send(t,e,r,s,o){if(this.sent_)throw An("cannot .send() more than once");if(Ye(t)&&r&&(this.xhr_.withCredentials=!0),this.sent_=!0,this.xhr_.open(e,t,!0),o!==void 0)for(const a in o)o.hasOwnProperty(a)&&this.xhr_.setRequestHeader(a,o[a].toString());return s!==void 0?this.xhr_.send(s):this.xhr_.send(),this.sendPromise_}getErrorCode(){if(!this.sent_)throw An("cannot .getErrorCode() before sending");return this.errorCode_}getStatus(){if(!this.sent_)throw An("cannot .getStatus() before sending");try{return this.xhr_.status}catch{return-1}}getResponse(){if(!this.sent_)throw An("cannot .getResponse() before sending");return this.xhr_.response}getErrorText(){if(!this.sent_)throw An("cannot .getErrorText() before sending");return this.xhr_.statusText}abort(){this.xhr_.abort()}getResponseHeader(t){return this.xhr_.getResponseHeader(t)}addUploadProgressListener(t){this.xhr_.upload!=null&&this.xhr_.upload.addEventListener("progress",t)}removeUploadProgressListener(t){this.xhr_.upload!=null&&this.xhr_.upload.removeEventListener("progress",t)}}class Zg extends Jg{initXhr(){this.xhr_.responseType="text"}}function uo(){return new Zg}/**
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
 */class Ne{constructor(t,e){this._service=t,e instanceof Ot?this._location=e:this._location=Ot.makeFromUrl(e,t.host)}toString(){return"gs://"+this._location.bucket+"/"+this._location.path}_newRef(t,e){return new Ne(t,e)}get root(){const t=new Ot(this._location.bucket,"");return this._newRef(this._service,t)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return Rl(this._location.path)}get storage(){return this._service}get parent(){const t=Lg(this._location.path);if(t===null)return null;const e=new Ot(this._location.bucket,t);return new Ne(this._service,e)}_throwIfRoot(t){if(this._location.path==="")throw mg(t)}}function t_(n,t,e){n._throwIfRoot("uploadBytes");const r=Yg(n.storage,n._location,Sl(),new ie(t,!0),e);return n.storage.makeRequestWithTokens(r,uo).then(s=>({metadata:s,ref:n}))}function e_(n){n._throwIfRoot("getDownloadURL");const t=Kg(n.storage,n._location,Sl());return n.storage.makeRequestWithTokens(t,uo).then(e=>{if(e===null)throw fg();return e})}function n_(n){n._throwIfRoot("deleteObject");const t=Wg(n.storage,n._location);return n.storage.makeRequestWithTokens(t,uo)}function r_(n,t){const e=Fg(n._location.path,t),r=new Ot(n._location.bucket,e);return new Ne(n.storage,r)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function s_(n){return/^[A-Za-z]+:\/\//.test(n)}function i_(n,t){return new Ne(n,t)}function Dl(n,t){if(n instanceof co){const e=n;if(e._bucket==null)throw hg();const r=new Ne(e,e._bucket);return t!=null?Dl(r,t):r}else return t!==void 0?r_(n,t):n}function o_(n,t){if(t&&s_(t)){if(n instanceof co)return i_(n,t);throw fi("To use ref(service, url), the first argument must be a Storage instance.")}else return Dl(n,t)}function Iu(n,t){const e=t==null?void 0:t[yl];return e==null?null:Ot.makeFromBucketSpec(e,n)}function a_(n,t,e,r={}){n.host=`${t}:${e}`;const s=Ye(t);s&&(_i(`https://${n.host}/b`),yi("Storage",!0)),n._isUsingEmulator=!0,n._protocol=s?"https":"http";const{mockUserToken:o}=r;o&&(n._overrideAuthToken=typeof o=="string"?o:Du(o,n.app.options.projectId))}class co{constructor(t,e,r,s,o,a=!1){this.app=t,this._authProvider=e,this._appCheckProvider=r,this._url=s,this._firebaseVersion=o,this._isUsingEmulator=a,this._bucket=null,this._host=_l,this._protocol="https",this._appId=null,this._deleted=!1,this._maxOperationRetryTime=tg,this._maxUploadRetryTime=eg,this._requests=new Set,s!=null?this._bucket=Ot.makeFromBucketSpec(s,this._host):this._bucket=Iu(this._host,this.app.options)}get host(){return this._host}set host(t){this._host=t,this._url!=null?this._bucket=Ot.makeFromBucketSpec(this._url,t):this._bucket=Iu(t,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(t){wu("time",0,Number.POSITIVE_INFINITY,t),this._maxUploadRetryTime=t}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(t){wu("time",0,Number.POSITIVE_INFINITY,t),this._maxOperationRetryTime=t}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;const t=this._authProvider.getImmediate({optional:!0});if(t){const e=await t.getToken();if(e!==null)return e.accessToken}return null}async _getAppCheckToken(){if(Ti(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const t=this._appCheckProvider.getImmediate({optional:!0});return t?(await t.getToken()).token:null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(t=>t.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(t){return new Ne(this,t)}_makeRequest(t,e,r,s,o=!0){if(this._deleted)return new gg(El());{const a=Cg(t,this._appId,r,s,e,this._firebaseVersion,o,this._isUsingEmulator);return this._requests.add(a),a.getPromise().then(()=>this._requests.delete(a),()=>this._requests.delete(a)),a}}async makeRequestWithTokens(t,e){const[r,s]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(t,e,r,s).getPromise()}}const Au="@firebase/storage",vu="0.14.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Nl="storage";function Y_(n,t,e){return n=ct(n),t_(n,t,e)}function J_(n){return n=ct(n),e_(n)}function Z_(n){return n=ct(n),n_(n)}function ty(n,t){return n=ct(n),o_(n,t)}function u_(n=wi(),t){n=ct(n);const r=Ei(n,Nl).getImmediate({identifier:t}),s=gi("storage");return s&&c_(r,...s),r}function c_(n,t,e,r={}){a_(n,t,e,r)}function l_(n,{instanceIdentifier:t}){const e=n.getProvider("app").getImmediate(),r=n.getProvider("auth-internal"),s=n.getProvider("app-check-internal");return new co(e,r,s,t,Ou)}function h_(){$e(new be(Nl,l_,"PUBLIC").setMultipleInstances(!0)),Bt(Au,vu,""),Bt(Au,vu,"esm2020")}h_();/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const d_="type.googleapis.com/google.protobuf.Int64Value",f_="type.googleapis.com/google.protobuf.UInt64Value";function kl(n,t){const e={};for(const r in n)n.hasOwnProperty(r)&&(e[r]=t(n[r]));return e}function Br(n){if(n==null)return null;if(n instanceof Number&&(n=n.valueOf()),typeof n=="number"&&isFinite(n)||n===!0||n===!1||Object.prototype.toString.call(n)==="[object String]")return n;if(n instanceof Date)return n.toISOString();if(Array.isArray(n))return n.map(t=>Br(t));if(typeof n=="function"||typeof n=="object")return kl(n,t=>Br(t));throw new Error("Data cannot be encoded in JSON: "+n)}function Xe(n){if(n==null)return n;if(n["@type"])switch(n["@type"]){case d_:case f_:{const t=Number(n.value);if(isNaN(t))throw new Error("Data cannot be decoded from JSON: "+n);return t}default:throw new Error("Data cannot be decoded from JSON: "+n)}return Array.isArray(n)?n.map(t=>Xe(t)):typeof n=="function"||typeof n=="object"?kl(n,t=>Xe(t)):n}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const lo="functions";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ru={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class Vt extends ge{constructor(t,e,r){super(`${lo}/${t}`,e||""),this.details=r,Object.setPrototypeOf(this,Vt.prototype)}}function p_(n){if(n>=200&&n<300)return"ok";switch(n){case 0:return"internal";case 400:return"invalid-argument";case 401:return"unauthenticated";case 403:return"permission-denied";case 404:return"not-found";case 409:return"aborted";case 429:return"resource-exhausted";case 499:return"cancelled";case 500:return"internal";case 501:return"unimplemented";case 503:return"unavailable";case 504:return"deadline-exceeded"}return"unknown"}function qr(n,t){let e=p_(n),r=e,s;try{const o=t&&t.error;if(o){const a=o.status;if(typeof a=="string"){if(!Ru[a])return new Vt("internal","internal");e=Ru[a],r=a}const c=o.message;typeof c=="string"&&(r=c),s=o.details,s!==void 0&&(s=Xe(s))}}catch{}return e==="ok"?null:new Vt(e,r,s)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class m_{constructor(t,e,r,s){this.app=t,this.auth=null,this.messaging=null,this.appCheck=null,this.serverAppAppCheckToken=null,Ti(t)&&t.settings.appCheckToken&&(this.serverAppAppCheckToken=t.settings.appCheckToken),this.auth=e.getImmediate({optional:!0}),this.messaging=r.getImmediate({optional:!0}),this.auth||e.get().then(o=>this.auth=o,()=>{}),this.messaging||r.get().then(o=>this.messaging=o,()=>{}),this.appCheck||s==null||s.get().then(o=>this.appCheck=o,()=>{})}async getAuthToken(){if(this.auth)try{const t=await this.auth.getToken();return t==null?void 0:t.accessToken}catch{return}}async getMessagingToken(){if(!(!this.messaging||!("Notification"in self)||Notification.permission!=="granted"))try{return await this.messaging.getToken()}catch{return}}async getAppCheckToken(t){if(this.serverAppAppCheckToken)return this.serverAppAppCheckToken;if(this.appCheck){const e=t?await this.appCheck.getLimitedUseToken():await this.appCheck.getToken();return e.error?null:e.token}return null}async getContext(t){const e=await this.getAuthToken(),r=await this.getMessagingToken(),s=await this.getAppCheckToken(t);return{authToken:e,messagingToken:r,appCheckToken:s}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pi="us-central1",g_=/^data: (.*?)(?:\n|$)/;function __(n){let t=null;return{promise:new Promise((e,r)=>{t=setTimeout(()=>{r(new Vt("deadline-exceeded","deadline-exceeded"))},n)}),cancel:()=>{t&&clearTimeout(t)}}}class y_{constructor(t,e,r,s,o=pi,a=(...c)=>fetch(...c)){this.app=t,this.fetchImpl=a,this.emulatorOrigin=null,this.contextProvider=new m_(t,e,r,s),this.cancelAllRequests=new Promise(c=>{this.deleteService=()=>Promise.resolve(c())});try{const c=new URL(o);this.customDomain=c.origin+(c.pathname==="/"?"":c.pathname),this.region=pi}catch{this.customDomain=null,this.region=o}}_delete(){return this.deleteService()}_url(t){const e=this.app.options.projectId;return this.emulatorOrigin!==null?`${this.emulatorOrigin}/${e}/${this.region}/${t}`:this.customDomain!==null?`${this.customDomain}/${t}`:`https://${this.region}-${e}.cloudfunctions.net/${t}`}}function E_(n,t,e){const r=Ye(t);n.emulatorOrigin=`http${r?"s":""}://${t}:${e}`,r&&(_i(n.emulatorOrigin),yi("Functions",!0))}function T_(n,t,e){const r=s=>I_(n,t,s,{});return r.stream=(s,o)=>v_(n,t,s,o),r}async function w_(n,t,e,r){e["Content-Type"]="application/json";let s;try{s=await r(n,{method:"POST",body:JSON.stringify(t),headers:e})}catch{return{status:0,json:null}}let o=null;try{o=await s.json()}catch{}return{status:s.status,json:o}}async function Ol(n,t){const e={},r=await n.contextProvider.getContext(t.limitedUseAppCheckTokens);return r.authToken&&(e.Authorization="Bearer "+r.authToken),r.messagingToken&&(e["Firebase-Instance-ID-Token"]=r.messagingToken),r.appCheckToken!==null&&(e["X-Firebase-AppCheck"]=r.appCheckToken),e}function I_(n,t,e,r){const s=n._url(t);return A_(n,s,e,r)}async function A_(n,t,e,r){e=Br(e);const s={data:e},o=await Ol(n,r),a=r.timeout||7e4,c=__(a),h=await Promise.race([w_(t,s,o,n.fetchImpl),c.promise,n.cancelAllRequests]);if(c.cancel(),!h)throw new Vt("cancelled","Firebase Functions instance was deleted.");const d=qr(h.status,h.json);if(d)throw d;if(!h.json)throw new Vt("internal","Response is not valid JSON object.");let p=h.json.data;if(typeof p>"u"&&(p=h.json.result),typeof p>"u")throw new Vt("internal","Response is missing data field.");return{data:Xe(p)}}function v_(n,t,e,r){const s=n._url(t);return R_(n,s,e,r||{})}async function R_(n,t,e,r){var E;e=Br(e);const s={data:e},o=await Ol(n,r);o["Content-Type"]="application/json",o.Accept="text/event-stream";let a;try{a=await n.fetchImpl(t,{method:"POST",body:JSON.stringify(s),headers:o,signal:r==null?void 0:r.signal})}catch(S){if(S instanceof Error&&S.name==="AbortError"){const N=new Vt("cancelled","Request was cancelled.");return{data:Promise.reject(N),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(N)}}}}}}const b=qr(0,null);return{data:Promise.reject(b),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(b)}}}}}}let c,h;const d=new Promise((S,b)=>{c=S,h=b});(E=r==null?void 0:r.signal)==null||E.addEventListener("abort",()=>{const S=new Vt("cancelled","Request was cancelled.");h(S)});const p=a.body.getReader(),y=S_(p,c,h,r==null?void 0:r.signal);return{stream:{[Symbol.asyncIterator](){const S=y.getReader();return{async next(){const{value:b,done:N}=await S.read();return{value:b,done:N}},async return(){return await S.cancel(),{done:!0,value:void 0}}}}},data:d}}function S_(n,t,e,r){const s=(a,c)=>{const h=a.match(g_);if(!h)return;const d=h[1];try{const p=JSON.parse(d);if("result"in p){t(Xe(p.result));return}if("message"in p){c.enqueue(Xe(p.message));return}if("error"in p){const y=qr(0,p);c.error(y),e(y);return}}catch(p){if(p instanceof Vt){c.error(p),e(p);return}}},o=new TextDecoder;return new ReadableStream({start(a){let c="";return h();async function h(){if(r!=null&&r.aborted){const d=new Vt("cancelled","Request was cancelled");return a.error(d),e(d),Promise.resolve()}try{const{value:d,done:p}=await n.read();if(p){c.trim()&&s(c.trim(),a),a.close();return}if(r!=null&&r.aborted){const E=new Vt("cancelled","Request was cancelled");a.error(E),e(E),await n.cancel();return}c+=o.decode(d,{stream:!0});const y=c.split(`
`);c=y.pop()||"";for(const E of y)E.trim()&&s(E.trim(),a);return h()}catch(d){const p=d instanceof Vt?d:qr(0,null);a.error(p),e(p)}}},cancel(){return n.cancel()}})}const Su="@firebase/functions",Cu="0.13.0";/**
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
 */const C_="auth-internal",P_="app-check-internal",b_="messaging-internal";function V_(n){const t=(e,{instanceIdentifier:r})=>{const s=e.getProvider("app").getImmediate(),o=e.getProvider(C_),a=e.getProvider(b_),c=e.getProvider(P_);return new y_(s,o,a,c,r)};$e(new be(lo,t,"PUBLIC").setMultipleInstances(!0)),Bt(Su,Cu,n),Bt(Su,Cu,"esm2020")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function D_(n=wi(),t=pi){const r=Ei(ct(n),lo).getImmediate({identifier:t}),s=gi("functions");return s&&N_(r,...s),r}function N_(n,t,e){E_(ct(n),t,e)}function ey(n,t,e){return T_(ct(n),t)}V_();const k_={apiKey:"AIzaSyBdE26vC0UAprsdTgBcmYrVuO67ZbccMTA",authDomain:"apps-script-api-443402.firebaseapp.com",projectId:"apps-script-api-443402",storageBucket:"apps-script-api-443402.firebasestorage.app",messagingSenderId:"46453918785",appId:"1:46453918785:web:a3c386def8dfe69f768ac0",measurementId:"G-TCZ9TL8FLW"},ho=xu(k_),ny=Um(ho,"anxi-app"),ry=u_(ho),sy=D_(ho);export{J as T,q_ as a,ny as b,M_ as c,L_ as d,j_ as e,sy as f,W_ as g,ey as h,$_ as i,F_ as j,X_ as k,ry as l,Y_ as m,J_ as n,K_ as o,z_ as p,U_ as q,ty as r,Q_ as s,G_ as t,H_ as u,Z_ as v,B_ as w};
