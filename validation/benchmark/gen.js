// Build the benchmark manifest: published QCA datasets, the user's data, the sample, and synthetic survey-like datasets.
const E=require('./engine.js'); const fs=require('fs');
const mul=a=>()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
const pct=(a,p)=>{const s=[...a].sort((x,y)=>x-y);const h=(s.length-1)*p,lo=Math.floor(h),hi=Math.ceil(h);return s[lo]+(s[hi]-s[lo])*(h-lo);};
const r2=v=>Math.round(v*100)/100;
const writeCSV=(file,cols,data)=>{ const n=data[cols[0]].length; const L=[cols.join(',')]; for(let i=0;i<n;i++) L.push(cols.map(c=>data[c][i]).join(',')); fs.writeFileSync(file,L.join('\n')+'\n'); };
const readCSV=f=>{ const L=fs.readFileSync(f,'utf8').trim().split(/\r?\n/); const h=L.shift().split(',').map(x=>x.replace(/"/g,'')); const d=Object.fromEntries(h.map(k=>[k,[]])); L.forEach(l=>l.split(',').forEach((v,i)=>d[h[i]].push(+v))); return {h,d}; };
const calibPct=(d,cols,hi=.95,lo=.05)=>{ const out={}; for(const c of cols){ const a={full:r2(pct(d[c],hi)),cross:r2(pct(d[c],.5)),non:r2(pct(d[c],lo))}; out[c]=d[c].map(x=>{ let v=E.calibrateValue(x,a.full,a.cross,a.non); if(v===0.5) v=0.501; return +v.toFixed(6); }); } return out; };
const M=[]; let id=0;
function add(name,file,outcome,conds,opt){ M.push(Object.assign({id:id++,name,file,outcome,conditions:conds,negate:false,incl:.8,pri:0,freq:1,dir:conds.map(()=>'1')},opt)); }
// Published datasets (settings as in the QCA literature/manual examples)
const pub=[['LF','SURV','DEV,URB,LIT,IND,STB'],['CVF','PROTEST','DEMOC,ETHFRACT,GEOCON,POLDIS,NATPRIDE'],['NF','W','A,I,M,U'],['HC','VOTE','FOREIGN,UNEMP,CONV,PRES80'],['Emme','JSR','S,C,L,R,P,V'],['Krook','WNP','ES,QU,WS,WM,LP']];
for(const [n,o,c] of pub){ const cs=c.split(','); for(const neg of [false,true]) for(const [incl,pri] of [[.8,0],[.75,.5],[.85,.7]]) add(`pub:${n}${neg?' ~':''} incl${incl} pri${pri}`,`data/pub_${n}.csv`,o,cs,{negate:neg,incl,pri,dir:cs.map(()=>neg?'0':'1')}); }
// (The original study's latent variable scores are not distributed.)
// Synthetic survey-like datasets (standardised scores -> percentile calibration)
const rnd=mul(2024); const g=()=>{ let u=0; while(!u) u=rnd(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*rnd()); };
for(let s=0;s<90;s++){
  const k=2+(s%7), N=[60,150,320,378,600,1000][s%6];
  const cols=Array.from({length:k},(_,j)=>'X'+(j+1)).concat(['Y']); const d=Object.fromEntries(cols.map(c=>[c,[]]));
  const w=Array.from({length:k},()=>rnd()*0.6-0.1), inter=rnd()*0.5;
  for(let i=0;i<N;i++){ const c=g(); const x=cols.slice(0,k).map(()=>0.5*c+0.85*g()); x.forEach((v,j)=>d['X'+(j+1)].push(v));
    let y=x.reduce((s,v,j)=>s+w[j]*v,0)+inter*Math.min(x[0],x[k-1])+0.6*g(); d.Y.push(y); }
  const hi=[.95,.9,.8][s%3], lo=1-hi; const cal=calibPct(d,cols,hi,lo); const file=`data/syn_${s}.csv`; writeCSV(file,cols,cal);
  const dirs=['1','0','-'];
  add(`syn:${s} k${k} N${N}`,file,'Y',cols.slice(0,k),{negate:s%4===3,incl:[.75,.8,.85][s%3],pri:[.5,.6,.7,.75][s%4],freq:[1,2,3,5][s%4],dir:cols.slice(0,k).map((_,j)=>j===0&&s%5===0?'-':j===1&&s%7===0?'0':'1')});
}
fs.writeFileSync('manifest.json',JSON.stringify(M,null,1)); console.log('cases',M.length);
