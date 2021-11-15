var banotils=function(g){"use strict";const Ot="Input must be an string, Buffer or Uint8Array";function Nt(n){let e;if(n instanceof Uint8Array)e=n;else if(n instanceof Buffer)e=new Uint8Array(n);else if(typeof n=="string")e=new Uint8Array(Buffer.from(n,"utf8"));else throw new Error(Ot);return e}function zt(n){return Array.prototype.map.call(n,function(e){return(e<16?"0":"")+e.toString(16)}).join("")}function M(n){return(4294967296+n).toString(16).substring(1)}function Kt(n,e,t){let o=`
`+n+" = ";for(let r=0;r<e.length;r+=2){if(t===32)o+=M(e[r]).toUpperCase(),o+=" ",o+=M(e[r+1]).toUpperCase();else if(t===64)o+=M(e[r+1]).toUpperCase(),o+=M(e[r]).toUpperCase();else throw new Error("Invalid size "+t);r%6==4?o+=`
`+new Array(n.length+4).join(" "):r<e.length-2&&(o+=" ")}console.log(o)}function Vt(n,e,t){let o=new Date().getTime();const r=new Uint8Array(e);for(let a=0;a<e;a++)r[a]=a%256;const i=new Date().getTime();console.log("Generated random input in "+(i-o)+"ms"),o=i;for(let a=0;a<t;a++){const s=n(r),f=new Date().getTime(),y=f-o;o=f,console.log("Hashed in "+y+"ms: "+s.substring(0,20)+"..."),console.log(Math.round(e/(1<<20)/(y/1e3)*100)/100+" MB PER SECOND")}}var rt={normalizeInput:Nt,toHex:zt,debugPrint:Kt,testSpeed:Vt};const it=rt;function j(n,e,t){const o=n[e]+n[t];let r=n[e+1]+n[t+1];o>=4294967296&&r++,n[e]=o,n[e+1]=r}function st(n,e,t,o){let r=n[e]+t;t<0&&(r+=4294967296);let i=n[e+1]+o;r>=4294967296&&i++,n[e]=r,n[e+1]=i}function Xt(n,e){return n[e]^n[e+1]<<8^n[e+2]<<16^n[e+3]<<24}function B(n,e,t,o,r,i){const a=P[r],s=P[r+1],f=P[i],y=P[i+1];j(c,n,e),st(c,n,a,s);let d=c[o]^c[n],m=c[o+1]^c[n+1];c[o]=m,c[o+1]=d,j(c,t,o),d=c[e]^c[t],m=c[e+1]^c[t+1],c[e]=d>>>24^m<<8,c[e+1]=m>>>24^d<<8,j(c,n,e),st(c,n,f,y),d=c[o]^c[n],m=c[o+1]^c[n+1],c[o]=d>>>16^m<<16,c[o+1]=m>>>16^d<<16,j(c,t,o),d=c[e]^c[t],m=c[e+1]^c[t+1],c[e]=m>>>31^d<<1,c[e+1]=d>>>31^m<<1}const at=new Uint32Array([4089235720,1779033703,2227873595,3144134277,4271175723,1013904242,1595750129,2773480762,2917565137,1359893119,725511199,2600822924,4215389547,528734635,327033209,1541459225]),Jt=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3,11,8,12,0,5,2,15,13,10,14,3,6,7,1,9,4,7,9,3,1,13,12,11,14,2,6,5,10,4,0,15,8,9,0,5,7,2,4,10,15,14,1,11,12,6,8,3,13,2,12,6,10,0,11,8,3,4,13,7,5,15,14,1,9,12,5,1,15,14,13,4,10,0,7,6,3,9,2,8,11,13,11,7,14,12,1,3,9,5,0,15,4,8,6,2,10,6,15,14,9,11,3,0,8,12,2,13,7,1,4,10,5,10,2,8,4,7,6,1,5,15,11,9,14,3,12,13,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3],w=new Uint8Array(Jt.map(function(n){return n*2})),c=new Uint32Array(32),P=new Uint32Array(32);function ct(n,e){let t=0;for(t=0;t<16;t++)c[t]=n.h[t],c[t+16]=at[t];for(c[24]=c[24]^n.t,c[25]=c[25]^n.t/4294967296,e&&(c[28]=~c[28],c[29]=~c[29]),t=0;t<32;t++)P[t]=Xt(n.b,4*t);for(t=0;t<12;t++)B(0,8,16,24,w[t*16+0],w[t*16+1]),B(2,10,18,26,w[t*16+2],w[t*16+3]),B(4,12,20,28,w[t*16+4],w[t*16+5]),B(6,14,22,30,w[t*16+6],w[t*16+7]),B(0,10,20,30,w[t*16+8],w[t*16+9]),B(2,12,22,24,w[t*16+10],w[t*16+11]),B(4,14,16,26,w[t*16+12],w[t*16+13]),B(6,8,18,28,w[t*16+14],w[t*16+15]);for(t=0;t<16;t++)n.h[t]=n.h[t]^c[t]^c[t+16]}function ut(n,e){if(n===0||n>64)throw new Error("Illegal output length, expected 0 < length <= 64");if(e&&e.length>64)throw new Error("Illegal key, expected Uint8Array with 0 < length <= 64");const t={b:new Uint8Array(128),h:new Uint32Array(16),t:0,c:0,outlen:n};for(let r=0;r<16;r++)t.h[r]=at[r];const o=e?e.length:0;return t.h[0]^=16842752^o<<8^n,e&&(K(t,e),t.c=128),t}function K(n,e){for(let t=0;t<e.length;t++)n.c===128&&(n.t+=n.c,ct(n,!1),n.c=0),n.b[n.c++]=e[t]}function lt(n){for(n.t+=n.c;n.c<128;)n.b[n.c++]=0;ct(n,!0);const e=new Uint8Array(n.outlen);for(let t=0;t<n.outlen;t++)e[t]=n.h[t>>2]>>8*(t&3);return e}function ft(n,e,t){t=t||64,n=it.normalizeInput(n);const o=ut(t,e);return K(o,n),lt(o)}function Zt(n,e,t){const o=ft(n,e,t);return it.toHex(o)}var qt={blake2b:ft,blake2bHex:Zt,blake2bInit:ut,blake2bUpdate:K,blake2bFinal:lt};const bt=rt;function Qt(n,e){return n[e]^n[e+1]<<8^n[e+2]<<16^n[e+3]<<24}function I(n,e,t,o,r,i){b[n]=b[n]+b[e]+r,b[o]=W(b[o]^b[n],16),b[t]=b[t]+b[o],b[e]=W(b[e]^b[t],12),b[n]=b[n]+b[e]+i,b[o]=W(b[o]^b[n],8),b[t]=b[t]+b[o],b[e]=W(b[e]^b[t],7)}function W(n,e){return n>>>e^n<<32-e}const ht=new Uint32Array([1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225]),p=new Uint8Array([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3,11,8,12,0,5,2,15,13,10,14,3,6,7,1,9,4,7,9,3,1,13,12,11,14,2,6,5,10,4,0,15,8,9,0,5,7,2,4,10,15,14,1,11,12,6,8,3,13,2,12,6,10,0,11,8,3,4,13,7,5,15,14,1,9,12,5,1,15,14,13,4,10,0,7,6,3,9,2,8,11,13,11,7,14,12,1,3,9,5,0,15,4,8,6,2,10,6,15,14,9,11,3,0,8,12,2,13,7,1,4,10,5,10,2,8,4,7,6,1,5,15,11,9,14,3,12,13,0]),b=new Uint32Array(16),A=new Uint32Array(16);function dt(n,e){let t=0;for(t=0;t<8;t++)b[t]=n.h[t],b[t+8]=ht[t];for(b[12]^=n.t,b[13]^=n.t/4294967296,e&&(b[14]=~b[14]),t=0;t<16;t++)A[t]=Qt(n.b,4*t);for(t=0;t<10;t++)I(0,4,8,12,A[p[t*16+0]],A[p[t*16+1]]),I(1,5,9,13,A[p[t*16+2]],A[p[t*16+3]]),I(2,6,10,14,A[p[t*16+4]],A[p[t*16+5]]),I(3,7,11,15,A[p[t*16+6]],A[p[t*16+7]]),I(0,5,10,15,A[p[t*16+8]],A[p[t*16+9]]),I(1,6,11,12,A[p[t*16+10]],A[p[t*16+11]]),I(2,7,8,13,A[p[t*16+12]],A[p[t*16+13]]),I(3,4,9,14,A[p[t*16+14]],A[p[t*16+15]]);for(t=0;t<8;t++)n.h[t]^=b[t]^b[t+8]}function gt(n,e){if(!(n>0&&n<=32))throw new Error("Incorrect output length, should be in [1, 32]");const t=e?e.length:0;if(e&&!(t>0&&t<=32))throw new Error("Incorrect key length, should be in [1, 32]");const o={h:new Uint32Array(ht),b:new Uint8Array(64),c:0,t:0,outlen:n};return o.h[0]^=16842752^t<<8^n,t>0&&(V(o,e),o.c=64),o}function V(n,e){for(let t=0;t<e.length;t++)n.c===64&&(n.t+=n.c,dt(n,!1),n.c=0),n.b[n.c++]=e[t]}function yt(n){for(n.t+=n.c;n.c<64;)n.b[n.c++]=0;dt(n,!0);const e=new Uint8Array(n.outlen);for(let t=0;t<n.outlen;t++)e[t]=n.h[t>>2]>>8*(t&3)&255;return e}function At(n,e,t){t=t||32,n=bt.normalizeInput(n);const o=gt(t,e);return V(o,n),yt(o)}function Yt(n,e,t){const o=At(n,e,t);return bt.toHex(o)}var tn={blake2s:At,blake2sHex:Yt,blake2sInit:gt,blake2sUpdate:V,blake2sFinal:yt};const C=qt,T=tn;var h={blake2b:C.blake2b,blake2bHex:C.blake2bHex,blake2bInit:C.blake2bInit,blake2bUpdate:C.blake2bUpdate,blake2bFinal:C.blake2bFinal,blake2s:T.blake2s,blake2sHex:T.blake2sHex,blake2sInit:T.blake2sInit,blake2sUpdate:T.blake2sUpdate,blake2sFinal:T.blake2sFinal};function nn(n){const e=new Uint8Array(n.length/2);for(let t=0;t<e.length;++t)e[t]=parseInt(n.substring(t*2+0,t*2+2),16);return e}const l=function(n){let e;const t=new Float64Array(16);if(n)for(e=0;e<n.length;e++)t[e]=n[e];return t},en=new Uint8Array(32);en[0]=9;const wt=l(),X=l([1]);l([56129,1]),l([30883,4953,19914,30187,55467,16705,2637,112,59544,30585,16505,36039,65139,11119,27886,20995]);const on=l([61785,9906,39828,60374,45398,33411,5274,224,53552,61171,33010,6542,64743,22239,55772,9222]),pt=l([54554,36645,11616,51542,42930,38181,51040,26924,56412,64982,57905,49316,21502,52590,14035,8553]),vt=l([26200,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214]);l([41136,18958,6951,50414,58488,44335,6150,12099,55207,15867,153,11085,57099,20417,9344,11139]);function H(n,e){let t;for(t=0;t<16;t++)n[t]=e[t]|0}function D(n){let e,t;for(t=0;t<16;t++)n[t]+=65536,e=Math.floor(n[t]/65536),n[(t+1)*(t<15?1:0)]+=e-1+37*(e-1)*(t===15?1:0),n[t]-=e*65536}function mt(n,e,t){let o;const r=~(t-1);for(let i=0;i<16;i++)o=r&(n[i]^e[i]),n[i]^=o,e[i]^=o}function kt(n,e){let t,o,r;const i=l(),a=l();for(t=0;t<16;t++)a[t]=e[t];for(D(a),D(a),D(a),o=0;o<2;o++){for(i[0]=a[0]-65517,t=1;t<15;t++)i[t]=a[t]-65535-(i[t-1]>>16&1),i[t-1]&=65535;i[15]=a[15]-32767-(i[14]>>16&1),r=i[15]>>16&1,i[14]&=65535,mt(a,i,1-r)}for(t=0;t<16;t++)n[2*t]=a[t]&255,n[2*t+1]=a[t]>>8}function rn(n){const e=new Uint8Array(32);return kt(e,n),e[0]&1}function L(n,e,t){let o;for(o=0;o<16;o++)n[o]=e[o]+t[o]|0}function $(n,e,t){let o;for(o=0;o<16;o++)n[o]=e[o]-t[o]|0}function v(n,e,t){let o,r;const i=new Float64Array(31);for(o=0;o<31;o++)i[o]=0;for(o=0;o<16;o++)for(r=0;r<16;r++)i[o+r]+=e[o]*t[r];for(o=0;o<15;o++)i[o]+=38*i[o+16];for(o=0;o<16;o++)n[o]=i[o];D(n),D(n)}function sn(n,e){v(n,e,e)}function an(n,e){const t=l();let o;for(o=0;o<16;o++)t[o]=e[o];for(o=253;o>=0;o--)sn(t,t),o!==2&&o!==4&&v(t,t,e);for(o=0;o<16;o++)n[o]=t[o]}function xt(n,e){const t=l(),o=l(),r=l(),i=l(),a=l(),s=l(),f=l(),y=l(),d=l();$(t,n[1],n[0]),$(d,e[1],e[0]),v(t,t,d),L(o,n[0],n[1]),L(d,e[0],e[1]),v(o,o,d),v(r,n[3],e[3]),v(r,r,on),v(i,n[2],e[2]),L(i,i,i),$(a,o,t),$(s,i,r),L(f,i,r),L(y,o,t),v(n[0],a,s),v(n[1],y,f),v(n[2],f,s),v(n[3],a,y)}function Bt(n,e,t){let o;for(o=0;o<4;o++)mt(n[o],e[o],t)}function It(n,e){const t=l(),o=l(),r=l();an(r,e[2]),v(t,e[0],r),v(o,e[1],r),kt(n,o),n[31]^=rn(t)<<7}function cn(n,e,t){let o,r;for(H(n[0],wt),H(n[1],X),H(n[2],X),H(n[3],wt),r=255;r>=0;--r)o=t[r/8|0]>>(r&7)&1,Bt(n,e,o),xt(e,n),xt(n,n),Bt(n,e,o)}function Ut(n,e){const t=[l(),l(),l(),l()];H(t[0],pt),H(t[1],vt),H(t[2],X),v(t[3],pt,vt),cn(n,t,e)}const Ft=n=>{const e=n.length/4*5,t=new Uint8Array(e);for(let o=1;o<=e;o++){const r=o-1,i=o%5,a=r-(o-i)/5,s=n[a-1]<<5-i,f=n[a]>>i;t[r]=(f+s)%16}return t},un=n=>{const e=n.length-1,t=new Uint8Array(e);for(let o=0;o<e;o++)t[o]=n[o+1];return t},ln=n=>{let e="";for(let t=0;t<n.length;t++)e+=n[t].toString(16).toUpperCase();return e},_t=n=>{const e=new Uint8Array(n.length*2);for(let t=0;t<n.length;t++)e[t*2]=n[t]/16|0,e[t*2+1]=n[t]%16;return e},fn=(n,e)=>{for(let t=0;t<n.length;t++)if(n[t]!=e[t])return!1;return!0},Et=n=>{const e=n.length/2,t=new Uint8Array(e);for(let o=0;o<e;o++)t[o]=n[o*2]*16+n[o*2+1];return t},St=n=>{const e="13456789abcdefghijkmnopqrstuwxyz".split(""),t=n.length,o=n.split(""),r=new Uint8Array(t);for(let i=0;i<t;i++)r[i]=e.indexOf(o[i]);return r},Rt=n=>{const e=new Uint8Array(n.length);for(let t=0;t<n.length;t++)e[t]=parseInt(n.substr(t,1),16);return e},O=n=>{const e=n.length/5*4,t=new Uint8Array(e);for(let o=1;o<=e;o++){const r=o-1,i=o%4,a=r+(o-i)/4,s=n[a]<<i;let f;(e-o)%4==0?f=n[a-1]<<4:f=n[a+1]>>4-i,t[r]=(f+s)%32}return t},N=n=>{const e="13456789abcdefghijkmnopqrstuwxyz".split("");let t="";for(let o=0;o<n.length;o++)t+=e[n[o]];return t},J=new Float64Array([237,211,245,92,26,99,18,88,214,156,247,162,222,249,222,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16]);function Ht(n,e){let t,o,r,i;for(o=63;o>=32;--o){for(t=0,r=o-32,i=o-12;r<i;++r)e[r]+=t-16*e[o]*J[r-(o-32)],t=e[r]+128>>8,e[r]-=t*256;e[r]+=t,e[o]=0}for(t=0,r=0;r<32;r++)e[r]+=t-(e[31]>>4)*J[r],t=e[r]>>8,e[r]&=255;for(r=0;r<32;r++)e[r]-=t*J[r];for(o=0;o<32;o++)e[o+1]+=e[o]>>8,n[o]=e[o]&255}function Gt(n){const e=new Float64Array(64);let t;for(t=0;t<64;t++)e[t]=n[t];for(t=0;t<64;t++)n[t]=0;Ht(n,e)}function bn(n,e,t,o){let r=new Uint8Array(64),i=new Uint8Array(64),a=new Uint8Array(64),s,f;const y=new Float64Array(64),d=[l(),l(),l(),l()],m=Pt(o);let R=h.blake2bInit(64,null);h.blake2bUpdate(R,o),r=h.blake2bFinal(R),r[0]&=248,r[31]&=127,r[31]|=64;const Pn=t+64;for(s=0;s<t;s++)n[64+s]=e[s];for(s=0;s<32;s++)n[32+s]=r[32+s];for(R=h.blake2bInit(64,null),h.blake2bUpdate(R,n.subarray(32)),a=h.blake2bFinal(R),Gt(a),Ut(d,a),It(n,d),s=32;s<64;s++)n[s]=m[s-32];for(R=h.blake2bInit(64,null),h.blake2bUpdate(R,n),i=h.blake2bFinal(R),Gt(i),s=0;s<64;s++)y[s]=0;for(s=0;s<32;s++)y[s]=a[s];for(s=0;s<32;s++)for(f=0;f<32;f++)y[s+f]+=i[s]*r[f];return Ht(n.subarray(32),y),Pn}function hn(n){const e=Et(Rt(n)),t=N(O(_t(h.blake2b(e,null,5).reverse())));return`ban_${N(O(Rt(`0${n}`)))}${t}`}function Pt(n){let e=new Uint8Array(64);const t=[l(),l(),l(),l()],o=new Uint8Array(32),r=h.blake2bInit(64);return h.blake2bUpdate(r,n),e=h.blake2bFinal(r),e[0]&=248,e[31]&=127,e[31]|=64,Ut(t,e),It(o,t),o}function z(n){let e=n.substring(4,64);const t=un(Ft(St(e.substring(0,52)))),o=Ft(St(e.substring(52,60))),r=Et(t),i=h.blake2b(r,null,5).reverse(),a=o,s=_t(i);if(!fn(a,s)){const f=N(O(a)),y=N(O(s));throw new Error(`Incorrect checksum ${f} != ${y}`)}return nn(ln(t))}function dn(n,e){const t=new Uint8Array(64+e.length);bn(t,e,e.length,n);const o=new Uint8Array(64);for(let r=0;r<o.length;r++)o[r]=t[r];return o}const gn=new RegExp("^[0123456789abcdefABCDEF]{64}$");function k(n){const e=new Uint8Array(n.length/2);for(let t=0;t<e.length;++t)e[t]=parseInt(n.substring(t*2+0,t*2+2),16);return e}function x(n){return Array.prototype.map.call(n,e=>("00"+e.toString(16)).slice(-2)).join("").toUpperCase()}function Ct(n,e){const t=n.toString().split(""),o=[];let r="";const i=[];for(;t.length;){let a=1*Number(t.shift());for(let s=0;a||s<o.length;++s)a+=(o[s]||0)*10,o[s]=a%16,a=(a-o[s])/16}for(;o.length;)i.push(o.pop().toString(16));if(r=i.join(""),r.length%2!=0&&(r="0"+r),e>r.length/2){const a=e-r.length/2;for(let s=0;s<a;s++)r="00"+r}return r}function Tt(n){return gn.test(x(n))}function Dt(n,e,t){const o=h.blake2bInit(8);h.blake2bUpdate(o,e),h.blake2bUpdate(o,n);const r=h.blake2bFinal(o).reverse(),i=x(r);return BigInt("0x"+i)>t}function yn(n){const e=n.indexOf(".");let t=BigInt("1");if(e!==-1){n=n.replace(".","");const a=n.length-e;t=BigInt("10")**BigInt(a)}const o=BigInt(n),r=BigInt("100000000000000000000000000000");return o*r/t}function An(n){const e=BigInt("1000000000000000000000000000"),t=BigInt("100000000000000000000000000000"),o=n/t,i=(n-o*t)/e,a=o.toString(),s=i.toString();return a+"."+s.padStart(2,"0")}function wn(n,e=0){if(!Tt(n))throw new Error(`Invalid seed '${n}'`);const t=k(Ct(e,4)),o=h.blake2bInit(32);return h.blake2bUpdate(o,n),h.blake2bUpdate(o,t),h.blake2bFinal(o)}function G(n){return typeof n=="string"?z(n):Pt(n)}function U(n){return hn(x(n))}function pn(n){try{const e=Object.values(n.balances)[0];return{balance:BigInt(e.balance),pending:BigInt(e.pending)}}catch(e){}return null}var Lt;(function(n){n[n.SEND=0]="SEND",n[n.RECEIVE=1]="RECEIVE"})(Lt||(Lt={}));function vn(n){try{if(Array.isArray(n.history)){const e={history:[]};for(const t of n.history)e.history.push({hash:k(t.hash),amount:BigInt(t.amount),account:z(t.account),action:t.type==="send"?0:1});return e}}catch(e){}return null}function mn(n){try{return{blockCount:parseInt(n.block_count),frontier:k(n.frontier),representativeBlock:k(n.representative_block),modificationTimestamp:parseInt(n.modified_timestamp)}}catch(e){}return null}function kn(n){try{const e={blocks:[]},t=Object.values(n.blocks)[0];for(const[o,r]of Object.entries(t)){const{amount:i,source:a}=r,s={amount:BigInt(i),hash:k(o),source:z(a)};e.blocks.push(s)}return e}catch(e){}return null}function xn(n){try{return{account:z(n.representative)}}catch(e){}return null}const Bn=`#version 300 es
  precision highp float;
  const vec2 vertices[4] = vec2[](
    vec2(-1, +1),
    vec2(-1, -1),
    vec2(+1, +1),
    vec2(+1, -1)
  );
  void main() {
    gl_Position = vec4(vertices[gl_VertexID], 0.0, 1.0);
  }
`,In=`#version 300 es
  precision highp float;
  precision highp int;

  out vec4 fragColor;

  // Random work values
  // First 2 bytes will be overwritten by texture pixel position
  // Second 2 bytes will be modified if the canvas size is greater than 256x256
  uniform uvec4 uWork0;
  // Last 4 bytes remain as generated externally
  uniform uvec4 uWork1;

  uniform uvec4 uHash0;
  uniform uvec4 uHash1;

  // Defined separately from uint v[32] below as the original value is required
  // to calculate the second uint32 of the digest for threshold comparison
  #define BLAKE2B_IV32_1 0x6A09E667u

  // Both buffers represent 16 uint64s as 32 uint32s
  // because that's what GLSL offers, just like Javascript

  // Compression buffer, intialized to 2 instances of the initialization vector
  // The following values have been modified from the BLAKE2B_IV:
  // OUTLEN is constant 8 bytes
  // v[0] ^= 0x01010000u ^ uint(OUTLEN);
  // INLEN is constant 40 bytes: work value (8) + block hash (32)
  // v[24] ^= uint(INLEN);
  // It's always the "last" compression at this INLEN
  // v[28] = ~v[28];
  // v[29] = ~v[29];
  uint v[32] = uint[32](
    0xF2BDC900u, 0x6A09E667u, 0x84CAA73Bu, 0xBB67AE85u,
    0xFE94F82Bu, 0x3C6EF372u, 0x5F1D36F1u, 0xA54FF53Au,
    0xADE682D1u, 0x510E527Fu, 0x2B3E6C1Fu, 0x9B05688Cu,
    0xFB41BD6Bu, 0x1F83D9ABu, 0x137E2179u, 0x5BE0CD19u,
    0xF3BCC908u, 0x6A09E667u, 0x84CAA73Bu, 0xBB67AE85u,
    0xFE94F82Bu, 0x3C6EF372u, 0x5F1D36F1u, 0xA54FF53Au,
    0xADE682F9u, 0x510E527Fu, 0x2B3E6C1Fu, 0x9B05688Cu,
    0x04BE4294u, 0xE07C2654u, 0x137E2179u, 0x5BE0CD19u
  );
  // Input data buffer
  uint m[32];

  // These are offsets into the input data buffer for each mixing step.
  // They are multiplied by 2 from the original SIGMA values in
  // the C reference implementation, which refered to uint64s.
  const int SIGMA82[192] = int[192](
    0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,28,20,8,16,18,30,26,12,2,24,
    0,4,22,14,10,6,22,16,24,0,10,4,30,26,20,28,6,12,14,2,18,8,14,18,6,2,26,
    24,22,28,4,12,10,20,8,0,30,16,18,0,10,14,4,8,20,30,28,2,22,24,12,16,6,
    26,4,24,12,20,0,22,16,6,8,26,14,10,30,28,2,18,24,10,2,30,28,26,8,20,0,
    14,12,6,18,4,16,22,26,22,14,28,24,2,6,18,10,0,30,8,16,12,4,20,12,30,28,
    18,22,6,0,16,24,4,26,14,2,8,20,10,20,4,16,8,14,12,2,10,30,22,18,28,6,24,
    26,0,0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,28,20,8,16,18,30,26,12,
    2,24,0,4,22,14,10,6
  );

  // 64-bit unsigned addition within the compression buffer
  // Sets v[a,a+1] += b
  // b0 is the low 32 bits of b, b1 represents the high 32 bits
  void add_uint64 (int a, uint b0, uint b1) {
    uint o0 = v[a] + b0;
    uint o1 = v[a + 1] + b1;
    if (v[a] > 0xFFFFFFFFu - b0) { // did low 32 bits overflow?
      o1++;
    }
    v[a] = o0;
    v[a + 1] = o1;
  }
  // Sets v[a,a+1] += v[b,b+1]
  void add_uint64 (int a, int b) {
    add_uint64(a, v[b], v[b+1]);
  }

  // G Mixing function
  void B2B_G (int a, int b, int c, int d, int ix, int iy) {
    add_uint64(a, b);
    add_uint64(a, m[ix], m[ix + 1]);

    // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated to the right by 32 bits
    uint xor0 = v[d] ^ v[a];
    uint xor1 = v[d + 1] ^ v[a + 1];
    v[d] = xor1;
    v[d + 1] = xor0;

    add_uint64(c, d);

    // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 24 bits
    xor0 = v[b] ^ v[c];
    xor1 = v[b + 1] ^ v[c + 1];
    v[b] = (xor0 >> 24) ^ (xor1 << 8);
    v[b + 1] = (xor1 >> 24) ^ (xor0 << 8);

    add_uint64(a, b);
    add_uint64(a, m[iy], m[iy + 1]);

    // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated right by 16 bits
    xor0 = v[d] ^ v[a];
    xor1 = v[d + 1] ^ v[a + 1];
    v[d] = (xor0 >> 16) ^ (xor1 << 16);
    v[d + 1] = (xor1 >> 16) ^ (xor0 << 16);

    add_uint64(c, d);

    // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 63 bits
    xor0 = v[b] ^ v[c];
    xor1 = v[b + 1] ^ v[c + 1];
    v[b] = (xor1 >> 31) ^ (xor0 << 1);
    v[b + 1] = (xor0 >> 31) ^ (xor1 << 1);
  }

  void main() {
    int i;
    uint uv_x = uint(gl_FragCoord.x);
    uint uv_y = uint(gl_FragCoord.y);
    uint x_pos = uv_x % 256u;
    uint y_pos = uv_y % 256u;
    uint x_index = (uv_x - x_pos) / 256u;
    uint y_index = (uv_y - y_pos) / 256u;

    // First 2 work bytes are the x,y pos within the 256x256 area, the next
    //  two bytes are modified from the random generated value, XOR'd with
    //   the x,y area index of where this pixel is located
    m[0] = (x_pos ^ (y_pos << 8) ^ ((uWork0.b ^ x_index) << 16) ^ ((uWork0.a ^ y_index) << 24));
    // Remaining bytes are un-modified from the random generated value
    m[1] = (uWork1.r ^ (uWork1.g << 8) ^ (uWork1.b << 16) ^ (uWork1.a << 24));

    // Block hash
    m[2] = uHash0[0];
    m[3] = uHash0[1];
    m[4] = uHash0[2];
    m[5] = uHash0[3];
    m[6] = uHash1[0];
    m[7] = uHash1[1];
    m[8] = uHash1[2];
    m[9] = uHash1[3];

    // twelve rounds of mixing
    for(i=0;i<12;i++) {
      B2B_G(0, 8, 16, 24, SIGMA82[i * 16 + 0], SIGMA82[i * 16 + 1]);
      B2B_G(2, 10, 18, 26, SIGMA82[i * 16 + 2], SIGMA82[i * 16 + 3]);
      B2B_G(4, 12, 20, 28, SIGMA82[i * 16 + 4], SIGMA82[i * 16 + 5]);
      B2B_G(6, 14, 22, 30, SIGMA82[i * 16 + 6], SIGMA82[i * 16 + 7]);
      B2B_G(0, 10, 20, 30, SIGMA82[i * 16 + 8], SIGMA82[i * 16 + 9]);
      B2B_G(2, 12, 22, 24, SIGMA82[i * 16 + 10], SIGMA82[i * 16 + 11]);
      B2B_G(4, 14, 16, 26, SIGMA82[i * 16 + 12], SIGMA82[i * 16 + 13]);
      B2B_G(6, 8, 18, 28, SIGMA82[i * 16 + 14], SIGMA82[i * 16 + 15]);
    }

    // Threshold test, first 4 bytes not significant,
    //  only calculate digest of the second 4 bytes
    if((BLAKE2B_IV32_1 ^ v[1] ^ v[17]) > 0xFFFFFE00u) {
      // Success found, return pixel data so work value can be constructed
      fragColor = vec4(
        float(x_index + 1u)/255., // +1 to distinguish from 0 (unsuccessful) pixels
        float(y_index + 1u)/255., // Same as previous
        float(x_pos)/255., // Return the 2 custom bytes used in work value
        float(y_pos)/255.  // Second custom byte
      );
    }
  }
`;function Mt(n,e){let t="";for(let o=e-1;o>-1;o--)t+=(n[o]>15?"":"0")+n[o].toString(16);return t}function Un(n){let e="";for(let t=n.length;t>0;t-=2)e+=n.slice(t-2,t);return e}const Z=document.createElement("canvas"),u=Z.getContext("webgl2"),q=u.createShader(u.VERTEX_SHADER);u.shaderSource(q,Bn),u.compileShader(q);const Q=u.createShader(u.FRAGMENT_SHADER);u.shaderSource(Q,In),u.compileShader(Q);const F=u.createProgram();u.attachShader(F,q),u.attachShader(F,Q),u.linkProgram(F);function Fn(n,e=1){Z.width=Z.height=256<<e;const t=Un(x(n));return u.useProgram(F),u.viewport(0,0,u.drawingBufferWidth,u.drawingBufferHeight),u.clearColor(0,0,0,1),u.uniform4uiv(u.getUniformLocation(F,"uHash0"),new Uint32Array([parseInt(t.slice(56,64),16),parseInt(t.slice(48,56),16),parseInt(t.slice(40,48),16),parseInt(t.slice(32,40),16)])),u.uniform4uiv(u.getUniformLocation(F,"uHash1"),new Uint32Array([parseInt(t.slice(24,32),16),parseInt(t.slice(16,24),16),parseInt(t.slice(8,16),16),parseInt(t.slice(0,8),16)])),new Promise(o=>{const r=new Uint8Array(4),i=new Uint8Array(4);requestAnimationFrame(function a(){crypto.getRandomValues(r),crypto.getRandomValues(i),u.uniform4uiv(u.getUniformLocation(F,"uWork0"),Array.from(r)),u.uniform4uiv(u.getUniformLocation(F,"uWork1"),Array.from(i)),u.clear(u.COLOR_BUFFER_BIT),u.drawArrays(u.TRIANGLE_STRIP,0,4);const s=new Uint8Array(u.drawingBufferWidth*u.drawingBufferHeight*4);u.readPixels(0,0,u.drawingBufferWidth,u.drawingBufferHeight,u.RGBA,u.UNSIGNED_BYTE,s);for(let f=0;f<s.length;f+=4)if(s[f]!==0){const y=Mt(i,4),d=Mt(new Uint8Array([s[f+2],s[f+3],r[2]^s[f]-1,r[3]^s[f+1]-1]),4),m=y+d;o(k(m));return}requestAnimationFrame(a)})})}function Y(n){try{return{hash:k(n.hash)}}catch(e){}return null}let tt="";function _n(n){let e=BigInt(n.balance).toString(16);for(;e.length<32;)e="0"+e;const t=h.blake2bInit(32,null);return h.blake2bUpdate(t,k("0000000000000000000000000000000000000000000000000000000000000006")),h.blake2bUpdate(t,G(n.account)),h.blake2bUpdate(t,k(n.previous)),h.blake2bUpdate(t,G(n.representative)),h.blake2bUpdate(t,k(e)),h.blake2bUpdate(t,k(n.link)),h.blake2bFinal(t)}async function En(n){const e=await Fn(n);if(!Dt(n,e,0xFFFFFE00n))throw new Error(`Generated work '${x(e)}' is invalid`);return e}async function nt(n,e,t,o,r){const i=G(n),a=await En(e||i),s={};return s.type="state",s.account=U(i),s.previous=x(e||new Uint8Array(32)),s.representative=U(t),s.balance=r.toString(10),s.work=x(a),s.link=x(o),s.signature=x(dn(n,_n(s))),s}function _(n){if(!tt)throw new Error("API URL is invalid");return new Promise((e,t)=>{const o=JSON.stringify(n);fetch(tt,{method:"POST",headers:{"Content-Type":"application/json","Content-Length":String(o.length)},body:o}).then(r=>{const i=r.json();e(i)}).catch(r=>{t(r)})})}function E(n){return n?!n.hasOwnProperty("error"):!1}function S(n){const e=new Error("").stack.split(`
`)[2].replace(/^\s+at\s+(.+?)\s.+/g,"$1"),t=e.substr(e.lastIndexOf(".")+1).trim();console.warn(`API call '${t}' failed with: '${n}'`)}function Sn(n){if(n.startsWith("https")||n.startsWith("http"))tt=n;else throw new Error("Invalid API URL")}async function et(n){const e=U(n),t=await _({action:"account_info",account:e});return E(t)?mn(t):(S(t.error),null)}async function ot(n){const e=U(n),t=await _({action:"accounts_balances",accounts:[e]});return E(t)?pn(t):(S(t.error),null)}async function jt(n){const e=U(n),t=await _({action:"account_representative",account:e});return E(t)?xn(t):(S(t.error),null)}async function Wt(n,e=-1){const t=U(n),o=await _({action:"account_history",account:t,count:e,raw:!1});return E(o)?vn(o):(S(o.error),null)}async function Rn(n,e=-1){const t=U(n),o=await _({action:"accounts_pending",accounts:[t],count:e,threshold:1,source:!0});return E(o)?kn(o):(S(o.error),null)}async function $t(n,e,t,o){const i=await nt(n,null,e,t,o),a=await _({action:"process",json_block:"true",subtype:"open",block:i});return E(a)?Y(a):(S(a.error),null)}async function Hn(n,e,t,o){const r=G(n),i=await Wt(r),a=await ot(r);if(!i||i.history.length==0)return $t(n,e,t,o);const s=o+a.balance,f=(await et(r)).frontier,y=await nt(n,f,e,t,s),d=await _({action:"process",json_block:"true",subtype:"receive",block:y});return E(d)?Y(d):(S(d.error),null)}async function Gn(n,e,t){const o=G(n),r=await et(o),i=await ot(o),a=await jt(o),s=i.balance-t;if(i.balance<=0n||s<0n)return null;const f=r.frontier,y=await nt(n,f,a.account,e,s),d=await _({action:"process",json_block:"true",subtype:"send",block:y});return E(d)?Y(d):(S(d.error),null)}return g.bytesToHex=x,g.decimalToHex=Ct,g.getAccountAddress=U,g.getAccountBalance=ot,g.getAccountHistory=Wt,g.getAccountInfo=et,g.getAccountPending=Rn,g.getAccountRepresentative=jt,g.getAmountFromRaw=An,g.getPrivateKey=wn,g.getPublicKey=G,g.getRawFromAmount=yn,g.hexToBytes=k,g.isSeedValid=Tt,g.isWorkValid=Dt,g.openAccount=$t,g.receiveAccount=Hn,g.sendAccount=Gn,g.setAPIURL=Sn,Object.defineProperty(g,"__esModule",{value:!0}),g}({});
