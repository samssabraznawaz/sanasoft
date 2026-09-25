// ═══════════════════════════════════════════════════════════════════
// SaNaSoft-ANN v2 — APPLICATION
// ═══════════════════════════════════════════════════════════════════
const VERSION='2.0';
const DEFAULT_SETTINGS=()=>({
  covRescale:'standardized',dvRescale:'standardized',
  scheme:'kfold',networks:10,training:90,test:10,holdout:0,seed:42,
  hiddenLayers:2,autoUnits:true,units:[4,3],autoMax:8,autoMax2:4,hAct:'sigmoid',oAct:'sigmoid',initCenter:0,initOffset:0.5,
  algorithm:'ffbp',type:'batch',batchSize:32,lr:1.0,momentum:0.9,lrLower:0.001,lrReductionEpochs:10,adamLr:0.01,scgLambda:5e-7,scgSigma:5e-5,
  maxEpochs:3000,patience:100,minEpochs:300,minRelChange:1e-5,maxTimeMin:15,l2:0,permRepeats:10,
  output:{summary:true,caseSummary:true,modelSummary:true,rmse:true,sensitivity:true,comparison:true,diagram:true,weights:true,curves:true,predObs:true,descriptives:true,benchmark:true},
  report:{style:'apa7',context:'',tableStart:1}
});
const newModel=name=>({name,dependent:null,covariates:[],factors:[],pls:{},plsR2:''});
const APP={step:0,data:null,models:[newModel('Model A')],active:0,settings:DEFAULT_SETTINGS(),results:null,charts:{},resModel:0,resNet:0,resTab:'Summary',worker:null,cancel:false,maxArrows:''};
const STEPS=[
  {title:'Welcome',icon:'🏠',desc:'Start here'},
  {title:'Import Data',icon:'📂',desc:'Upload & screen data'},
  {title:'Models & Variables',icon:'📊',desc:'Outputs, inputs, PLS paths'},
  {title:'Partitioning',icon:'✂️',desc:'10 networks · 90/10'},
  {title:'Architecture',icon:'🧠',desc:'Layers, neurons, activation'},
  {title:'Training',icon:'⚙️',desc:'Algorithm & stopping rules'},
  {title:'Output Options',icon:'📋',desc:'What to display'},
  {title:'Review & Run',icon:'▶️',desc:'Compliance & execute'},
  {title:'Results',icon:'📈',desc:'Tables, charts, diagram'},
  {title:'Report',icon:'📄',desc:'Publication-ready write-up'},
];

// ───────────────────────── UTILITIES ─────────────────────────
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jsq=s=>String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const f=(v,d=3)=>(v===null||v===undefined||!isFinite(v))?'–':Number(v).toFixed(d);
const f0=(v,d=3)=>{const s=f(v,d);return s.replace(/^(-?)0\./,'$1.');}; // APA: drop leading zero where bounded
function toNum(v){if(v===null||v===undefined)return null;if(typeof v==='number')return isFinite(v)?v:null;const s=String(v).trim();if(s===''||/^(na|n\/a|nan|null|\.|-|missing|#null!)$/i.test(s))return null;const x=Number(s.replace(/,(?=\d{1,}$)/,'.'));return isFinite(x)?x:null;}
function rng32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function gauss(r){let u=0,v=0;while(u===0)u=r();v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function meanA(a){return a.reduce((x,y)=>x+y,0)/(a.length||1);}
function sdA(a){if(a.length<2)return 0;const m=meanA(a);return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1));}
function toast(msg,type){const t=document.createElement('div');t.textContent=msg;t.style.cssText=`position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:${type==='err'?'#c62828':'#1a237e'};color:#fff;padding:10px 18px;border-radius:10px;font-size:13px;z-index:2000;box-shadow:0 6px 20px rgba(0,0,0,.25)`;document.body.appendChild(t);setTimeout(()=>t.remove(),3200);}
function download(name,content,type){const a=document.createElement('a');const blob=content instanceof Blob?content:new Blob([content],{type:type||'text/plain'});a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}

// ───────────────────────── STATISTICS ─────────────────────────
function describe(vals){
  const x=vals.filter(v=>v!==null);const n=x.length;if(!n)return{n:0};
  const m=meanA(x);let m2=0,m3=0,m4=0;x.forEach(v=>{const d=v-m;m2+=d*d;m3+=d*d*d;m4+=d*d*d*d;});
  const sdv=Math.sqrt(m2/Math.max(1,n-1));const g1=(m3/n)/Math.pow(m2/n,1.5);const g2=(m4/n)/Math.pow(m2/n,2)-3;
  const skew=n>2?g1*Math.sqrt(n*(n-1))/(n-2):NaN;
  const kurt=n>3?((n+1)*g2+6)*(n-1)/((n-2)*(n-3)):NaN;
  return{n,mean:m,sd:sdv,min:Math.min(...x),max:Math.max(...x),skew,kurt};
}
// Solve (A)x=b with Gaussian elimination (small systems)
function solve(A,b){const n=b.length;const M=A.map((r,i)=>[...r,b[i]]);for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;[M[c],M[p]]=[M[p],M[c]];const d=M[c][c];if(Math.abs(d)<1e-14)return null;for(let r=0;r<n;r++){if(r===c)continue;const k=M[r][c]/d;for(let j=c;j<=n;j++)M[r][j]-=k*M[c][j];}}return M.map((r,i)=>r[n]/r[i]);}
function invert(A){const n=A.length;const M=A.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>i===j?1:0)]);for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;[M[c],M[p]]=[M[p],M[c]];const d=M[c][c];if(Math.abs(d)<1e-14)return null;for(let j=0;j<2*n;j++)M[c][j]/=d;for(let r=0;r<n;r++){if(r===c)continue;const k=M[r][c];for(let j=0;j<2*n;j++)M[r][j]-=k*M[c][j];}}return M.map(r=>r.slice(n));}
// OLS with intercept; X: array of rows. Returns {b, se, yhat, r2, sse, df}
function ols(X,y,ridge=1e-10){
  const n=X.length,p=X[0].length+1;const XtX=Array.from({length:p},()=>new Array(p).fill(0)),Xty=new Array(p).fill(0);
  for(let i=0;i<n;i++){const r=[1,...X[i]];for(let a=0;a<p;a++){Xty[a]+=r[a]*y[i];for(let b=0;b<p;b++)XtX[a][b]+=r[a]*r[b];}}
  for(let a=1;a<p;a++)XtX[a][a]+=ridge;
  const inv=invert(XtX);if(!inv)return null;
  const b=inv.map(row=>row.reduce((s,v,j)=>s+v*Xty[j],0));
  const yhat=X.map(r=>b[0]+r.reduce((s,v,j)=>s+v*b[j+1],0));
  const ym=meanA(y);let sse=0,sst=0;for(let i=0;i<n;i++){sse+=(y[i]-yhat[i])**2;sst+=(y[i]-ym)**2;}
  const df=n-p;const s2=sse/Math.max(1,df);
  return{b,se:inv.map((r,i)=>Math.sqrt(Math.max(0,r[i]*s2))),yhat,r2:1-sse/(sst||1),sse,df,n,p};
}
// Regularized incomplete beta → F and t distribution p-values
function lnGamma(z){const g=7,c=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];if(z<0.5)return Math.log(Math.PI/Math.sin(Math.PI*z))-lnGamma(1-z);z-=1;let x=c[0];for(let i=1;i<g+2;i++)x+=c[i]/(z+i);const t=z+g+0.5;return 0.5*Math.log(2*Math.PI)+(z+0.5)*Math.log(t)-t+Math.log(x);}
function betacf(a,b,x){let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;if(Math.abs(d)<1e-30)d=1e-30;d=1/d;let h=d;for(let m=1;m<=300;m++){const m2=2*m;let aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;h*=d*c;aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<3e-12)break;}return h;}
function ibeta(x,a,b){if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(lnGamma(a+b)-lnGamma(a)-lnGamma(b)+a*Math.log(x)+b*Math.log(1-x));return x<(a+1)/(a+b+2)?bt*betacf(a,b,x)/a:1-bt*betacf(b,a,1-x)/b;}
const pF=(F,d1,d2)=>F<=0?1:ibeta(d2/(d2+d1*F),d2/2,d1/2);
const pT=(t,df)=>ibeta(df/(df+t*t),df/2,0.5);
const fmtP=p=>p<.001?'< .001':'= '+f0(p,3);

// ───────────────────────── NAVIGATION ─────────────────────────
function goStep(n){if(n<0||n>9)return;APP.step=n;renderProgressBar();renderSidebar();renderStep();$('content').scrollTop=0;}
function next(){goStep(APP.step+1);} function prev(){goStep(APP.step-1);}
function renderProgressBar(){
  let h='';STEPS.forEach((s,i)=>{const cls=i<APP.step?'done':i===APP.step?'active':'';
    h+=`<div class="step-pill" title="${esc(s.title)}"><div class="step-dot ${cls}" onclick="goStep(${i})"><span>${i===0?'⌂':i}</span></div><div class="step-label ${i===APP.step?'active':''}">${esc(s.title)}</div></div>`;
    if(i<STEPS.length-1)h+=`<div class="step-connector ${i<APP.step?'done':''}"></div>`;});
  $('progress-bar').innerHTML=h;
}
function renderSidebar(){
  $('sidebar').innerHTML=STEPS.map((s,i)=>{const cls=i<APP.step?'done':i===APP.step?'active':'';
    return `<div class="sidebar-step ${cls}" onclick="goStep(${i})"><div class="snum">${i<APP.step?'✓':(i===0?'⌂':i)}</div><div><div class="stitle">${s.icon} ${esc(s.title)}</div><div class="sdesc">${esc(s.desc)}</div></div></div>`;}).join('')+
    `<div style="margin-top:auto;padding:12px;font-size:10.5px;color:var(--muted);line-height:1.5;border-top:1px solid var(--border)">Engine: pure-JavaScript MLP in a background thread · data never leave your computer.<br>Developed by Prof. S. Sabraz Nawaz &amp; Prof. Ghazanfar Ali.<br><a href="https://github.com/samssabraznawaz/sanasoft/tree/main/ann" target="_blank" rel="noopener" style="color:var(--primary-light)">Source code &amp; validation</a> · <a href="../" style="color:var(--primary-light)">SaNaSoft fsQCA</a></div>`;
}
function renderStep(){Object.values(APP.charts).forEach(c=>{try{c.destroy();}catch(e){}});APP.charts={};
  const fns=[renderStep0,renderStep1,renderStep2,renderStep3,renderStep4,renderStep5,renderStep6,renderStep7,renderStep8,renderStep9];
  const c=$('content');c.innerHTML='';fns[APP.step](c);}
const navBtns=(backLbl,nextLbl,nextFn)=>`<div class="btn-group">${backLbl?`<button class="btn btn-outline" onclick="prev()">← ${backLbl}</button>`:''}${nextLbl?`<button class="btn btn-primary" onclick="${nextFn||'next()'}">${nextLbl} →</button>`:''}</div>`;

// ───────────────────────── STEP 0 — WELCOME ─────────────────────────
function renderStep0(c){
  c.innerHTML=`
  <div class="card" style="text-align:center;padding:34px">
    <div style="font-size:52px;margin-bottom:8px">🧠</div>
    <h1 style="font-size:26px;color:var(--primary);margin-bottom:8px">Welcome to SaNaSoft-ANN 2.0</h1>
    <p style="color:var(--muted);font-size:14px;max-width:680px;margin:0 auto 18px">A guided neural-network tool for the <strong>PLS-SEM + ANN hybrid approach</strong>. It reproduces the SPSS Multilayer Perceptron and automates the full procedure of Leong et al. (2025): ten networks, 90/10 partitioning, RMSE tables, R² and the averaged sensitivity analysis.</p>
    <div class="flow">${['Significant PLS-SEM predictors','Inputs → ANN','10 networks (10-fold, 90/10)','2 hidden layers · sigmoid · FFBP','RMSE & R²','Sensitivity analysis','Compare with PLS-SEM','Report'].map((s,i,a)=>`<span class="s">${s}</span>${i<a.length-1?'<span class="a">→</span>':''}`).join('')}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;max-width:820px;margin:18px auto 22px;text-align:left">
      ${[['⚡','Fast','A full ten-network analysis takes seconds, not minutes. The work runs in a background thread so the page stays responsive.'],
         ['🔬','Faithful to the guideline','Implements the Leong et al. (2025) steps, formulas and reporting tables, with a compliance checker before you run.'],
         ['🧩','Several models at once','Analyse every endogenous construct (Model A, B, C…) in one run, as most SEM-ANN papers do.'],
         ['📄','Ready to publish','Report in APA, Harvard, Emerald, Chicago, IEEE or Vancouver style with formatted tables, downloadable as Word.']]
        .map(x=>`<div class="card" style="padding:14px;margin:0;box-shadow:none;border:1.5px solid var(--border)"><div style="font-size:22px">${x[0]}</div><div style="font-weight:700;font-size:13px;margin:4px 0">${x[1]}</div><div style="font-size:12px;color:var(--muted);line-height:1.5">${x[2]}</div></div>`).join('')}
    </div>
    <div class="warn-box" style="max-width:700px;margin:0 auto 18px;text-align:left"><strong>Prerequisite:</strong> this is Stage 2 of the hybrid analysis. First complete your PLS-SEM analysis (e.g., SmartPLS), then export the <strong>latent variable scores</strong> as CSV or Excel. Only predictors with <strong>significant</strong> PLS-SEM paths should enter the ANN.</div>
    <div class="inline-flex" style="justify-content:center">
      <button class="btn btn-accent" onclick="next()">🚀 Start with my data</button>
      <button class="btn btn-outline" onclick="loadDemo()">🧪 Try with demo data</button>
    </div>
    <div class="ok-box" style="max-width:700px;margin:20px auto 0;text-align:left"><strong>Developed by Prof. S. Sabraz Nawaz and Prof. Ghazanfar Ali.</strong> Please cite SaNaSoft-ANN when you use it:<br><span style="font-family:'Times New Roman',serif">Samsudeen, S. N., &amp; Ghazanfar, A. A. (2026). <i>SaNaSoft-ANN: Guided artificial neural network analysis for PLS-SEM latent variable scores</i> (Version ${VERSION}) [Computer software]. https://samssabraznawaz.github.io/sanasoft/ann/</span><br><span class="small">The report in Step 9 adds this citation automatically in your chosen style. Companion tool for configurational analysis of the same scores: <a href="../">SaNaSoft fsQCA</a>.</span></div>
    <div class="hint-box" style="max-width:700px;margin:12px auto 0;text-align:left"><strong>Guideline implemented:</strong> Leong, L.-Y., Hew, T.-S., Ooi, K.-B., Tan, G. W.-H., &amp; Koohang, A. (2025). An SEM-ANN approach – Guidelines in information systems research. <em>Journal of Computer Information Systems, 65</em>(6), 706–737. https://doi.org/10.1080/08874417.2024.2329128. Open the <strong>📖 SPSS Tutorial</strong> (top right) to see each SPSS dialog next to its SaNaSoft-ANN equivalent.</div>
  </div>`;
}

// ───────────────────────── DEMO DATA ─────────────────────────
function loadDemo(){
  const r=rng32(2025),n=320;const rows=[];
  for(let i=0;i<n;i++){
    const g=gauss(r);const L=()=>0.55*g+Math.sqrt(1-0.3025)*gauss(r);
    const PE=L(),EE=L(),SI=L(),FC=L(),HM=L();
    const BI=0.42*PE+0.08*EE+0.20*SI+0.12*FC+0.26*HM+0.18*Math.max(0,PE)*Math.max(0,HM)-0.10*Math.max(0,-SI)**2+0.55*gauss(r);
    const UB=0.45*BI+0.22*FC+0.25*Math.tanh(1.8*BI)*(FC>0?1:0.3)+0.6*gauss(r);
    rows.push({ID:i+1,Gender:r()<0.52?'Female':'Male',PE,EE,SI,FC,HM,BI,UB});
  }
  ['PE','EE','SI','FC','HM','BI','UB'].forEach(k=>{const v=rows.map(x=>x[k]);const m=meanA(v),s=sdA(v);rows.forEach(x=>x[k]=+((x[k]-m)/s).toFixed(3));});
  rows[17].EE='';rows[88].SI='';rows[203].BI='';// a few missing values → listwise deletion demo
  setData(rows,['ID','Gender','PE','EE','SI','FC','HM','BI','UB'],'demo_UTAUT_LV_scores.csv (built-in demo)');
  const plsFor=(dep,ins)=>{const ok=rows.filter(x=>[dep,...ins].every(k=>toNum(x[k])!==null));const res=ols(ok.map(x=>ins.map(k=>+x[k])),ok.map(x=>+x[dep]));const pls={};ins.forEach((k,i)=>{const t=res.b[i+1]/res.se[i+1];pls[k]={beta:+res.b[i+1].toFixed(3),sig:pT(Math.abs(t),res.df)<.05};});return{pls,r2:res.r2.toFixed(3)};};
  const a=plsFor('BI',['PE','EE','SI','FC','HM']),b=plsFor('UB',['BI','FC']);
  APP.models=[Object.assign(newModel('Model A'),{dependent:'BI',covariates:['PE','EE','SI','FC','HM'],pls:a.pls,plsR2:a.r2}),
              Object.assign(newModel('Model B'),{dependent:'UB',covariates:['BI','FC'],pls:b.pls,plsR2:b.r2})];
  APP.active=0;APP.results=null;
  toast('Demo data loaded: 320 respondents, UTAUT constructs, two ANN models');
  goStep(1);
}

// ───────────────────────── STEP 1 — IMPORT & SCREEN ─────────────────────────
function renderStep1(c){
  c.innerHTML=`
  <div class="card">
    <div class="card-title">📂 Step 1: Import & Screen Your Data</div>
    <div class="card-subtitle">Latent variable scores exported from SmartPLS, ADANCO, WarpPLS, R (seminr/cSEM) or SPSS</div>
    <div class="hint-box"><strong>What should the file look like?</strong> One row per respondent, one column per construct score (first row = column names). You may include ID or demographic columns — you choose later which columns enter the ANN. Empty cells, "NA" or "." are treated as missing.</div>
    <div id="drop-zone" onclick="$('file-input').click()">
      <div class="dz-icon">📁</div><div class="dz-text">Click to upload or drag & drop your file here</div>
      <div class="dz-sub">CSV (.csv, .txt) or Excel (.xlsx, .xls) · processed entirely in your browser</div>
    </div>
    <input type="file" id="file-input" accept=".csv,.txt,.xlsx,.xls" style="display:none" onchange="handleFileUpload(this.files[0]);this.value=''">
    <div id="file-info" style="margin-top:14px"></div>
    <div id="data-screen"></div>
  </div>
  ${navBtns('Back','Next: Models & Variables','validateStep1()')}`;
  setupDropZone();if(APP.data)showDataInfo();
}
function setupDropZone(){const dz=$('drop-zone');if(!dz)return;
  dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('dragover');});
  dz.addEventListener('dragleave',()=>dz.classList.remove('dragover'));
  dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('dragover');if(e.dataTransfer.files[0])handleFileUpload(e.dataTransfer.files[0]);});}
function handleFileUpload(file){
  if(!file)return;const ext=file.name.split('.').pop().toLowerCase();
  if(ext==='csv'||ext==='txt'){
    Papa.parse(file,{header:true,dynamicTyping:false,skipEmptyLines:'greedy',transformHeader:h=>h.trim(),
      complete:r=>{if(!r.data.length){toast('The file appears to be empty','err');return;}setData(r.data,r.meta.fields.filter(h=>h!==''),file.name);},
      error:e=>toast('Could not read CSV: '+e.message,'err')});
  }else if(ext==='xlsx'||ext==='xls'){
    const reader=new FileReader();
    reader.onload=e=>{try{const wb=XLSX.read(e.target.result,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];
      const json=XLSX.utils.sheet_to_json(ws,{defval:'',raw:true});if(!json.length){toast('The first sheet is empty','err');return;}
      const hdr=XLSX.utils.sheet_to_json(ws,{header:1})[0].map(h=>String(h).trim()).filter(Boolean);
      setData(json,hdr,file.name+(wb.SheetNames.length>1?` (sheet "${wb.SheetNames[0]}")`:''));}catch(err){toast('Could not read Excel file: '+err.message,'err');}};
    reader.readAsArrayBuffer(file);
  }else toast('Unsupported file type. Please use CSV or Excel.','err');
}
function setData(rows,headers,fileName){
  const types={},stats={};
  headers.forEach(h=>{const raw=rows.map(r=>r[h]);const nonEmpty=raw.filter(v=>v!==null&&v!==undefined&&String(v).trim()!=='');
    const nums=raw.map(toNum);const numCount=nums.filter(v=>v!==null).length;
    const uniq=new Set(nonEmpty.map(String)).size;
    types[h]=nonEmpty.length&&numCount/nonEmpty.length>=0.95?'scale':'nominal';
    stats[h]=types[h]==='scale'?Object.assign(describe(nums),{missing:rows.length-numCount,uniq}):{n:nonEmpty.length,missing:rows.length-nonEmpty.length,uniq};});
  APP.data={rows,headers,types,stats,fileName};
  // drop model assignments that no longer exist
  APP.models.forEach(m=>{if(!headers.includes(m.dependent))m.dependent=null;m.covariates=m.covariates.filter(v=>headers.includes(v));m.factors=m.factors.filter(v=>headers.includes(v));});
  APP.results=null;
  if(APP.step===1)showDataInfo();
}
function showDataInfo(){
  const d=APP.data;if(!d||!$('file-info'))return;
  const scale=d.headers.filter(h=>d.types[h]==='scale');
  const anyMissing=d.headers.some(h=>d.stats[h].missing>0);
  const flagged=scale.filter(h=>Math.abs(d.stats[h].skew)>2||Math.abs(d.stats[h].kurt)>7);
  $('file-info').innerHTML=`<div class="ok-box"><strong>✅ ${esc(d.fileName)}</strong> — ${d.rows.length} rows × ${d.headers.length} columns (${scale.length} numeric, ${d.headers.length-scale.length} categorical/text).</div>
   ${anyMissing?`<div class="tip-box"><strong>Missing values detected.</strong> Like SPSS, SaNaSoft-ANN applies <strong>listwise deletion</strong>: a case is excluded from a model only if one of <em>that model's</em> variables is missing. The number of excluded cases is shown in the Case Processing Summary.</div>`:''}`;
  $('data-screen').innerHTML=`
    <div class="section-title">🔎 Data screening (descriptive statistics)</div>
    <div style="overflow-x:auto"><table>
      <tr><th>Variable</th><th>Type</th><th class="num">Valid N</th><th class="num">Missing</th><th class="num">Mean</th><th class="num">SD</th><th class="num">Min</th><th class="num">Max</th><th class="num">Skewness</th><th class="num">Kurtosis</th></tr>
      ${d.headers.map(h=>{const s=d.stats[h];const sc=d.types[h]==='scale';const bad=sc&&(Math.abs(s.skew)>2||Math.abs(s.kurt)>7);
        return `<tr><td><strong>${esc(h)}</strong></td><td>${sc?'Scale':'Categorical ('+s.uniq+' levels)'}</td><td class="num">${s.n}</td><td class="num" style="${s.missing?'color:var(--error);font-weight:700':''}">${s.missing}</td>
        ${sc?`<td class="num">${f(s.mean)}</td><td class="num">${f(s.sd)}</td><td class="num">${f(s.min)}</td><td class="num">${f(s.max)}</td><td class="num" style="${bad?'color:var(--warning);font-weight:700':''}">${f(s.skew)}</td><td class="num" style="${bad?'color:var(--warning);font-weight:700':''}">${f(s.kurt)}</td>`:'<td colspan="6" class="small">—</td>'}</tr>`;}).join('')}
    </table></div>
    <div class="hint-box"><strong>How to read this:</strong> Leong et al. (2025) ask researchers to assess multivariate assumptions (normality, linearity, multicollinearity). ANN makes no distributional assumptions, so non-normal data are not a problem for the ANN itself — but you should report them. |Skewness| > 2 or |kurtosis| > 7 are flagged as substantial departures from normality${flagged.length?` (flagged: <strong>${flagged.map(esc).join(', ')}</strong>)`:''}. Linearity and multicollinearity are tested for each model after the run (Results → Descriptives & Assumptions).</div>
    <div class="section-title">📋 Preview (first 5 rows)</div>
    <div style="overflow-x:auto"><table><tr>${d.headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>
    ${d.rows.slice(0,5).map(r=>`<tr>${d.headers.map(h=>`<td>${esc(r[h])}</td>`).join('')}</tr>`).join('')}</table></div>`;
}
function validateStep1(){if(!APP.data){toast('Please upload a data file first (or try the demo data).','err');return;}next();}
