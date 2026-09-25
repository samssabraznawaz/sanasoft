// ───────────────────────── ENGINE BRIDGE (Web Worker with fallback) ─────────────────────────
const ENGINE_SRC=()=>$('engine-src').textContent;
function runEngine(job,onProgress){
  return new Promise((resolve,reject)=>{
    APP.rejectRun=reject;
    const mainThread=async()=>{
      APP.engineMode='main thread';
      try{const api=new Function(ENGINE_SRC()+'\nreturn {runJob};')();
        const res=await api.runJob(job,{progress:m=>{if(APP.cancel)throw new Error('__cancel__');onProgress(m);},tick:()=>new Promise(r=>setTimeout(r,0))});
        resolve(res);}catch(e){reject(e);}
    };
    let w;
    try{
      const glue=`\nself.onmessage=async e=>{try{const res=await runJob(e.data,{progress:m=>self.postMessage({type:'progress',m})});self.postMessage({type:'done',res});}catch(err){self.postMessage({type:'error',msg:String(err&&err.message||err)});}};self.postMessage({type:'ready'});`;
      w=new Worker(URL.createObjectURL(new Blob([ENGINE_SRC()+glue],{type:'text/javascript'})));
    }catch(e){mainThread();return;}
    APP.worker=w;let ready=false;
    const to=setTimeout(()=>{if(!ready){w.terminate();APP.worker=null;mainThread();}},2500);
    w.onmessage=e=>{const d=e.data;
      if(d.type==='ready'){ready=true;APP.engineMode='background worker';clearTimeout(to);w.postMessage(job);}
      else if(d.type==='progress')onProgress(d.m);
      else if(d.type==='done'){w.terminate();APP.worker=null;resolve(d.res);}
      else if(d.type==='error'){w.terminate();APP.worker=null;reject(new Error(d.msg));}};
    w.onerror=e=>{e.preventDefault&&e.preventDefault();if(!ready){clearTimeout(to);w.terminate();APP.worker=null;mainThread();}else{w.terminate();APP.worker=null;reject(new Error(e.message||'Worker error'));}};
  });
}
function cancelRun(){APP.cancel=true;if(APP.worker){APP.worker.terminate();APP.worker=null;if(APP.rejectRun)APP.rejectRun(new Error('__cancel__'));}}
function setProg(frac,msg,sub){$('run-fill').style.width=(Math.max(0,Math.min(1,frac))*100).toFixed(1)+'%';if(msg!==undefined)$('run-progress-text').textContent=msg;if(sub!==undefined)$('run-sub').textContent=sub;}

// ───────────────────────── JOB PREPARATION ─────────────────────────
function buildJob(){
  const models=APP.models.map(m=>{
    const covs=m.covariates,facs=m.factors,kept=[];let excl=0;
    APP.data.rows.forEach(r=>{
      const y=toNum(r[m.dependent]);if(y===null){excl++;return;}
      const xs=covs.map(v=>toNum(r[v]));if(xs.some(v=>v===null)){excl++;return;}
      if(facs.some(v=>r[v]===null||r[v]===undefined||String(r[v]).trim()==='')){excl++;return;}
      kept.push({y,xs,fs:facs.map(v=>String(r[v]).trim())});
    });
    const levels=facs.map((v,i)=>[...new Set(kept.map(k=>k.fs[i]))].sort());
    const cols=[],groups=[];
    covs.forEach(v=>{cols.push({kind:'cov',label:v,group:groups.length});groups.push({name:v,cols:[cols.length-1]});});
    facs.forEach((v,i)=>{const gi=groups.length,cc=[];levels[i].forEach(l=>{cols.push({kind:'dummy',label:`${v}=${l}`,group:gi});cc.push(cols.length-1);});groups.push({name:v,cols:cc});});
    const p=cols.length,n=kept.length,X=new Array(n*p),Y=new Array(n);
    kept.forEach((k,r)=>{Y[r]=k.y;let c=0;k.xs.forEach(v=>X[r*p+c++]=v);facs.forEach((v,i)=>levels[i].forEach(l=>X[r*p+c++]=(k.fs[i]===l?1:0)));});
    return {name:m.name,dep:m.dependent,n,p,X,Y,nExcluded:excl,cols,groups,levels};
  });
  return {models,settings:JSON.parse(JSON.stringify(APP.settings))};
}

async function runAnalysis(){
  const job=buildJob();APP.cancel=false;
  const bad=job.models.find(m=>m.n<20);if(bad){toast(`${bad.name}: only ${bad.n} usable cases.`,'err');return;}
  $('run-overlay').classList.add('show');setProg(0,'Starting the neural engine…','');
  const nM=job.models.length,auto=job.settings.autoUnits,t0=performance.now();
  try{
    const res=await runEngine(job,m=>{
      const mi=m.model||0;const pf=auto?(m.phase==='arch'?0.4*m.frac:0.4+0.6*m.frac):m.frac;
      setProg((mi+pf)/nM,m.phase==='arch'?`Automatic neuron search — ${job.models[mi].name}`:`Training networks — ${job.models[mi].name}`,m.msg);
    });
    setProg(1,'Computing benchmark and assumption tests…','');await new Promise(r=>setTimeout(r,20));
    res.ms=performance.now()-t0;res.settings=job.settings;res.dataName=APP.data.fileName;res.date=new Date().toISOString();
    res.models.forEach((rm,i)=>{rm.spec=JSON.parse(JSON.stringify(APP.models[i]));rm.extra=postAnalyses(job.models[i],rm);});
    APP.results=res;APP.resModel=0;APP.resNet=0;APP.resTab='Summary';
    $('run-overlay').classList.remove('show');goStep(8);
    toast(`Analysis finished in ${(res.ms/1000).toFixed(1)} s`);
  }catch(e){
    $('run-overlay').classList.remove('show');
    if(e.message==='__cancel__'||APP.cancel)toast('Analysis cancelled');else{console.error(e);alert('Analysis error: '+e.message);}
  }
}

// Main-thread post-analyses: descriptives, correlations, VIF, RESET test, linear benchmark on identical splits
function postAnalyses(jm,rm){
  const {n,p,X,Y,cols,groups}=jm;
  const covIdx=cols.map((c,i)=>c.kind==='cov'?i:-1).filter(i=>i>=0);
  const col=i=>Array.from({length:n},(_,r)=>X[r*p+i]);
  const vars=[{name:jm.dep,v:Y.slice()}].concat(covIdx.map(i=>({name:cols[i].label,v:col(i)})));
  const desc=vars.map(x=>Object.assign({name:x.name},describe(x.v)));
  const corr=vars.map(a=>vars.map(b=>{const ma=meanA(a.v),mb=meanA(b.v);let sab=0,sa=0,sb=0;for(let i=0;i<n;i++){const da=a.v[i]-ma,db=b.v[i]-mb;sab+=da*db;sa+=da*da;sb+=db*db;}return sab/Math.sqrt(sa*sb||1);}));
  let vif=null;
  if(covIdx.length>=2){const Rm=corr.slice(1).map(r=>r.slice(1));const inv=invert(Rm);if(inv)vif=covIdx.map((ci,k)=>({name:cols[ci].label,vif:inv[k][k]}));}
  // design matrix: covariates + dummies minus the first level of each factor
  const keep=[];groups.forEach(g=>{g.cols.forEach((c,j)=>{if(cols[c].kind==='cov'||j>0)keep.push(c);});});
  const design=rows=>rows.map(r=>keep.map(c=>X[r*p+c]));
  const allRows=Array.from({length:n},(_,i)=>i);
  const lin=ols(design(allRows),Y);
  let reset=null;
  if(lin){const yh=lin.yhat,m=meanA(yh),s=sdA(yh)||1;const z=yh.map(v=>(v-m)/s);
    const aug=ols(design(allRows).map((r,i)=>[...r,z[i]**2,z[i]**3]),Y);
    if(aug){const q=2,df2=n-(keep.length+1)-q;const F=((lin.sse-aug.sse)/q)/(aug.sse/df2);reset={F,df1:q,df2,p:pF(F,q,df2),r2Lin:lin.r2,r2Aug:aug.r2};}}
  // linear benchmark on exactly the same training/testing splits, in the ANN's rescaled DV units
  const a=rm.dv.a,b=rm.dv.b;const ys=Y.map(v=>(v-a)/b);
  const bench=rm.nets.map(net=>{const tr=net.trainRows,te=net.testRows;const fit=ols(design(tr),tr.map(r=>ys[r]));if(!fit||!te.length)return null;
    const Xte=design(te);let sse=0;const pred=Xte.map(row=>fit.b[0]+row.reduce((s,v,j)=>s+v*fit.b[j+1],0));te.forEach((r,i)=>sse+=(ys[r]-pred[i])**2);
    let sst=0;const mt=meanA(te.map(r=>ys[r]));te.forEach(r=>sst+=(ys[r]-mt)**2);return{rmse:Math.sqrt(sse/te.length),r2:1-sse/(sst||1),pred,te};});
  let linPredR2=null;
  if(rm.summary.oofPred&&bench.every(Boolean)){const oof={};bench.forEach(bm=>bm.te.forEach((r,i)=>oof[r]=bm.pred[i]));const rowsA=Object.keys(oof).map(Number);const m=meanA(rowsA.map(r=>ys[r]));let se=0,st=0;rowsA.forEach(r=>{se+=(ys[r]-oof[r])**2;st+=(ys[r]-m)**2;});linPredR2=1-se/(st||1);}
  else if(bench.every(Boolean))linPredR2=meanA(bench.map(x=>x.r2));
  return{desc,corr,corrNames:vars.map(v=>v.name),vif,reset,linR2:lin?lin.r2:null,linCoef:lin?keep.map((c,j)=>({name:cols[c].label,b:lin.b[j+1],se:lin.se[j+1]})):null,
    bench:bench.map(x=>x?{rmse:x.rmse,r2:x.r2}:null),linPredR2,linMeanRmse:meanA(bench.filter(Boolean).map(x=>x.rmse))};
}

// ───────────────────────── STEP 8 — RESULTS ─────────────────────────
const RM=()=>APP.results.models[APP.resModel];
const hasPls=rm=>rm.groups.some(g=>rm.spec.pls[g]&&rm.spec.pls[g].beta!==''&&rm.spec.pls[g].beta!==undefined&&rm.spec.pls[g].beta!==null);
const PER_NET_TABS=['Model Summary','Network Diagram','Parameter Estimates','Training Curves'];
function resultTabs(rm){const O=APP.results.settings.output,t=['Summary'];
  if(O.caseSummary)t.push('Case Processing');if(O.rmse)t.push('RMSE');if(O.sensitivity)t.push('Sensitivity Analysis');
  if(O.comparison&&hasPls(rm))t.push('PLS-SEM vs ANN');if(O.modelSummary)t.push('Model Summary');if(O.diagram)t.push('Network Diagram');
  if(O.weights)t.push('Parameter Estimates');if(O.curves)t.push('Training Curves');if(O.predObs)t.push('Predicted vs Observed');
  if(O.benchmark)t.push('Linear Benchmark');if(O.descriptives)t.push('Descriptives & Assumptions');if(rm.archSearch)t.push('Architecture Search');return t;}
function renderStep8(c){
  if(!APP.results){c.innerHTML=`<div class="card"><div class="card-title">📈 Results</div><div class="warn-box">No results yet — run the analysis in Step 7.</div><div class="btn-group"><button class="btn btn-primary" onclick="goStep(7)">Go to Step 7</button></div></div>`;return;}
  const R=APP.results,rm=RM(),tabs=resultTabs(rm);if(!tabs.includes(APP.resTab))APP.resTab='Summary';
  const perNet=PER_NET_TABS.includes(APP.resTab);
  c.innerHTML=`
  <div class="card">
    <div class="card-title">📈 Step 8: Results</div>
    <div class="card-subtitle">${esc(R.dataName)} · finished in ${(R.ms/1000).toFixed(1)} s · ${esc(R.engine)}</div>
    <div class="res-toolbar">
      ${R.models.length>1?`<label class="small"><strong>Model:</strong></label><select onchange="APP.resModel=+this.value;APP.resNet=0;renderStep(8)">${R.models.map((m,i)=>`<option value="${i}" ${i===APP.resModel?'selected':''}>${esc(m.name)} — ${esc(m.dep)}</option>`).join('')}</select>`:''}
      ${perNet?`<label class="small"><strong>Network:</strong></label><select onchange="APP.resNet=+this.value;renderStep(8)">${rm.nets.map((n,i)=>`<option value="${i}" ${i===APP.resNet?'selected':''}>Network ${n.k} (test RMSE ${f(n.rmseTest,4)})</option>`).join('')}</select>`:''}
      <span style="margin-left:auto"></span>
      <button class="btn btn-outline btn-sm" onclick="exportCSV()">⬇ All results (CSV)</button>
    </div>
    <div class="tabs">${tabs.map(t=>`<div class="tab ${t===APP.resTab?'active':''}" onclick="APP.resTab='${t}';renderStep(8)">${t}</div>`).join('')}</div>
    <div id="res-pane">${tabContent(APP.resTab,rm)}</div>
  </div>
  ${navBtns('Back','Generate Report')}`;
  setTimeout(()=>drawTabCharts(APP.resTab,rm),30);
}

const IMP_NAMES=rm=>rm.groups;
function interpretation(rm){
  const s=rm.summary,ord=rankOrder(s.normImportance),g=rm.groups;
  const ratio=s.meanRmseTest/(s.meanRmseTrain||1);
  const ex=rm.extra;const gain=(ex&&ex.linPredR2!==null&&s.r2Pred!==null)?s.r2Pred-ex.linPredR2:null;
  let t=`<p>Across the ${rm.nets.length} networks, the mean RMSE was <strong>${f(s.meanRmseTrain,4)}</strong> (SD = ${f(s.sdRmseTrain,4)}) for training and <strong>${f(s.meanRmseTest,4)}</strong> (SD = ${f(s.sdRmseTest,4)}) for testing. `;
  t+=ratio<1.25?`The small and similar training and testing errors indicate that the model fits the data well and is not over-fitted.</p>`:`The testing error is noticeably larger than the training error (ratio ${f(ratio,2)}), which suggests some over-fitting; consider fewer hidden neurons or a small L2 weight decay.</p>`;
  t+=`<p>The out-of-sample predictive R² is <strong>${f(s.r2Pred,3)}</strong>${rm.spec.plsR2?` (PLS-SEM R² = ${esc(rm.spec.plsR2)})`:''}.`+(s.r2Leong!==null?` Using the formula of Leong et al. (2025), R² = <strong>${f(s.r2Leong,3)}</strong>.`:'')+`</p>`;
  t+=`<p>In the sensitivity analysis, <strong>${esc(g[ord[0]])}</strong> is the most important predictor of ${esc(rm.dep)} (normalized importance 100%)`+(ord.length>1?`, followed by ${ord.slice(1).map(i=>`${esc(g[i])} (${f(s.normImportance[i],1)}%)`).join(', ')}.`:'.')+`</p>`;
  if(gain!==null)t+=`<p>${gain>0.02?`The ANN predicts ${esc(rm.dep)} better than a linear regression on the same splits (predictive R² ${f(s.r2Pred,3)} vs ${f(ex.linPredR2,3)}), supporting the presence of non-linear or non-compensatory relationships.`:`The ANN and a linear regression on the same splits predict ${esc(rm.dep)} similarly (predictive R² ${f(s.r2Pred,3)} vs ${f(ex.linPredR2,3)}); the relationships appear largely linear, so the ANN mainly serves to confirm the predictor ranking.`}</p>`;
  return t;
}
function rankOrder(v){return v.map((x,i)=>i).sort((a,b)=>v[b]-v[a]);}
function tabContent(tab,rm){
  const R=APP.results,S=R.settings,s=rm.summary,g=rm.groups,net=rm.nets[APP.resNet]||rm.nets[0];
  const kpi=(v,l,sub,cls)=>`<div class="kpi ${cls||''}"><div class="v">${v}</div><div class="l">${l}</div>${sub?`<div class="s">${sub}</div>`:''}</div>`;
  switch(tab){
  case 'Summary':{const ord=rankOrder(s.normImportance);return `
    <div class="kpi-grid">
      ${kpi(f(s.meanRmseTrain,4),'Mean RMSE — training','SD = '+f(s.sdRmseTrain,4))}
      ${kpi(f(s.meanRmseTest,4),'Mean RMSE — testing','SD = '+f(s.sdRmseTest,4),s.meanRmseTest/(s.meanRmseTrain||1)<1.25?'good':'warn')}
      ${kpi(f(s.r2Pred,3),'Predictive R² (out-of-sample)',S.scheme==='kfold'?'1 − SSE/SST over all held-out cases':'mean testing R²')}
      ${kpi(s.r2Leong!==null?f(s.r2Leong,3):'–','R² — Leong et al. (2025) formula','1 − ΣRMSE / (k × S²y), S²y = ΣSSE / k')}
      ${kpi(esc(g[ord[0]]),'Most important predictor','normalized importance 100%','good')}
      ${kpi(rm.sizes.join('–'),'Architecture (inputs–hidden–output)',rm.archSearch?'hidden neurons chosen automatically':'custom')}
      ${rm.extra&&rm.extra.linPredR2!==null?kpi(f(rm.extra.linPredR2,3),'Linear regression predictive R²','same splits, for comparison'):''}
      ${kpi(rm.nets.length,'Networks trained',`${f(meanA(rm.nets.map(n=>n.epochs)),0)} epochs on average`)}
    </div>
    <div class="section-title">Automatic interpretation</div>${interpretation(rm)}
    <div class="section-title">Normalized importance</div><div class="chart-box" style="height:${Math.max(180,g.length*38+60)}px"><canvas id="ch-imp"></canvas></div>
    <div class="hint-box"><strong>About the two R² values.</strong> The <em>predictive R²</em> is the conventional share of variance in the held-out cases explained by the ANN. The second value applies the formula printed in Leong et al. (2025, p. 731–732) exactly (R² = 1 − ΣRMSE<sub>testing</sub> / (10 × S²<sub>y</sub>), with S²<sub>y</sub> = ΣSSE / 10). Because the two can differ considerably, report the formula you use and consider reporting both.</div>`;}
  case 'Case Processing':{const n1=rm.nets[0];const tot=rm.nTotal+rm.nExcluded;return `
    <table class="spss"><caption>Case Processing Summary</caption>
      <tr><th></th><th></th><th class="num">N</th><th class="num">Percent</th></tr>
      <tr><td rowspan="3"><strong>Sample</strong> (per network)</td><td>Training</td><td class="num">${n1.nTrain}</td><td class="num">${f(n1.nTrain/rm.nTotal*100,1)}%</td></tr>
      <tr><td>Testing</td><td class="num">${n1.nTest}</td><td class="num">${f(n1.nTest/rm.nTotal*100,1)}%</td></tr>
      <tr><td>Holdout</td><td class="num">${rm.nHoldout}</td><td class="num">${f(rm.nHoldout/rm.nTotal*100,1)}%</td></tr>
      <tr><td colspan="2"><strong>Valid</strong></td><td class="num">${rm.nTotal}</td><td class="num">100.0%</td></tr>
      <tr><td colspan="2"><strong>Excluded</strong> (missing values)</td><td class="num">${rm.nExcluded}</td><td></td></tr>
      <tr class="mean"><td colspan="2">Total</td><td class="num">${tot}</td><td></td></tr></table>
    <div class="hint-box">${S.scheme==='kfold'?`With ${rm.nets.length}-fold cross-validation each network trains on about ${n1.nTrain} and tests on about ${n1.nTest} cases; across the ${rm.nets.length} networks every valid case is used for testing exactly once.`:`Each network uses a new random split of the ${rm.nAnalysis} non-holdout cases.`}</div>`;}
  case 'Model Summary':{const ms=x=>{const d=new Date(x);return d.toISOString().substr(11,12);};return `
    <table class="spss"><caption>Model Summary — Network ${net.k}</caption>
      <tr><td rowspan="4"><strong>Training</strong></td><td>Sum of Squares Error</td><td class="num">${f(net.sseTrain,3)}</td></tr>
      <tr><td>Relative Error</td><td class="num">${f0(net.relErrTrain,3)}</td></tr>
      <tr><td>Stopping Rule Used</td><td>${esc(net.stopReason)}<sup>a</sup></td></tr>
      <tr><td>Training Time</td><td class="num">${ms(net.ms)}</td></tr>
      <tr><td rowspan="2"><strong>Testing</strong></td><td>Sum of Squares Error</td><td class="num">${f(net.sseTest,3)}</td></tr>
      <tr><td>Relative Error</td><td class="num">${f0(net.relErrTest,3)}</td></tr>
      ${net.hold?`<tr><td><strong>Holdout</strong></td><td>Relative Error</td><td class="num">${f0(net.hold.relErr,3)}</td></tr>`:''}
    </table>
    <div class="small" style="margin-top:6px">Dependent Variable: ${esc(rm.dep)}.<br>a. Error computations are based on the testing sample. Best weights found at epoch ${net.bestEpoch} of ${net.epochs}. Errors are in rescaled units (${rm.dv.mode}).</div>
    <div class="hint-box"><strong>Relative error</strong> = SSE ÷ total sum of squares of the dependent variable in that sample — the share of variance <em>not</em> explained (so 1 − relative error is the R² of that sample). This is how SPSS defines it.</div>`;}
  case 'RMSE':return rmseTable(rm)+`
    <div class="kpi-grid" style="margin-top:14px">${kpi(f(s.r2Pred,3),'Predictive R² (out-of-sample)')}${kpi(s.r2Leong!==null?f(s.r2Leong,3):'–','R² — Leong et al. (2025) formula',`S²y = ΣSSE/k = ${f(s.s2y,4)}`)}${rm.spec.plsR2?kpi(esc(rm.spec.plsR2),'PLS-SEM R² (entered)'):''}</div>
    <div class="hint-box">RMSE = √(SSE / n) for the training and testing sample of each network (Leong et al., 2025). Small RMSE values that are similar for training and testing indicate accurate predictions without over-fitting. Units: rescaled ${esc(rm.dep)} (${rm.dv.mode}${rm.dv.mode==='normalized'?', range 0–1':''}).</div>`;
  case 'Sensitivity Analysis':return sensTable(rm)+`<div class="chart-box" style="height:${Math.max(180,g.length*38+60)}px"><canvas id="ch-imp"></canvas></div>
    <div class="hint-box"><strong>Procedure (Leong et al., 2025):</strong> in every network the relative importance of each predictor is computed (they sum to 1, as in SPSS); these are averaged over the ${rm.nets.length} networks, and the normalized importance is each average divided by the largest average × 100%. Method: permutation sensitivity analysis on the combined training and testing samples (${S.permRepeats} permutations per predictor per network).</div>`;
  case 'PLS-SEM vs ANN':return compTable(rm);
  case 'Network Diagram':return `<div class="svg-wrap" id="diagram-wrap">${diagramSVG(rm,net)}</div>
    <div class="inline-flex" style="margin-top:10px"><button class="btn btn-outline btn-sm" onclick="downloadDiagram('svg')">⬇ SVG (vector, for Word)</button><button class="btn btn-outline btn-sm" onclick="downloadDiagram('png')">⬇ PNG (high resolution)</button></div>
    <div class="hint-box">Blue lines = positive synaptic weights, grey = negative; thicker = larger |weight| (SPSS convention). Figure 22 in Leong et al. (2025) shows the same kind of diagram.</div>`;
  case 'Parameter Estimates':return paramTable(rm,net);
  case 'Training Curves':return `<div class="chart-box"><canvas id="ch-curve"></canvas></div><div class="hint-box">Mean squared error per epoch (rescaled units) for Network ${net.k}. The dashed line marks the epoch with the lowest testing error — those weights are kept. A testing curve that rises while the training curve keeps falling is the sign of over-fitting that early stopping prevents.</div>`;
  case 'Predicted vs Observed':return `<div class="row-2"><div class="chart-box"><canvas id="ch-po"></canvas></div><div class="chart-box"><canvas id="ch-res"></canvas></div></div><div class="hint-box">${S.scheme==='kfold'?'Each point is a case predicted by the network that did <em>not</em> see it during training (out-of-sample).':'Testing-sample predictions of all networks.'} Values are in the original units of ${esc(rm.dep)}. Points near the diagonal and residuals scattered randomly around zero indicate a good model.</div>`;
  case 'Linear Benchmark':return benchTable(rm);
  case 'Descriptives & Assumptions':return assumptionsHTML(rm);
  case 'Architecture Search':{const a=rm.archSearch;const sorted=a.grid.slice().sort((x,y)=>x.testMSE-y.testMSE);return `
    <div class="ok-box">Selected: <strong>${a.units.join('–')}</strong> hidden neurons — ${esc(a.criterion)}.</div>
    <table class="spss"><caption>Candidate architectures (mean testing MSE, first two splits)</caption><tr><th>Hidden neurons</th><th class="num">Weights</th><th class="num">Mean testing MSE</th></tr>
    ${sorted.map(x=>`<tr style="${x.units.join()===a.units.join()?'font-weight:700;color:var(--success)':''}"><td>${x.units.join('–')}</td><td class="num">${x.params}</td><td class="num">${f(x.testMSE,5)}</td></tr>`).join('')}</table>`;}
  }
  return '';
}
function rmseTable(rm){const s=rm.summary;return `
  <div style="overflow-x:auto"><table class="spss"><caption>RMSE values of the ${rm.nets.length} networks — ${esc(rm.name)} (output: ${esc(rm.dep)})</caption>
    <tr><th rowspan="2">Network</th><th colspan="3" style="text-align:center">Training</th><th colspan="3" style="text-align:center">Testing</th></tr>
    <tr><th class="num">N</th><th class="num">SSE</th><th class="num">RMSE</th><th class="num">N</th><th class="num">SSE</th><th class="num">RMSE</th></tr>
    ${rm.nets.map(n=>`<tr><td>ANN${n.k}</td><td class="num">${n.nTrain}</td><td class="num">${f(n.sseTrain,3)}</td><td class="num">${f(n.rmseTrain,4)}</td><td class="num">${n.nTest}</td><td class="num">${f(n.sseTest,3)}</td><td class="num">${f(n.rmseTest,4)}</td></tr>`).join('')}
    <tr class="mean"><td>Mean</td><td></td><td class="num">${f(s.meanSseTrain,3)}</td><td class="num">${f(s.meanRmseTrain,4)}</td><td></td><td class="num">${f(s.meanSseTest,3)}</td><td class="num">${f(s.meanRmseTest,4)}</td></tr>
    <tr><td>SD</td><td></td><td></td><td class="num">${f(s.sdRmseTrain,4)}</td><td></td><td></td><td class="num">${f(s.sdRmseTest,4)}</td></tr>
  </table></div>`;}
function sensTable(rm){const s=rm.summary,g=rm.groups,ord=rankOrder(s.normImportance);const rank=g.map((_,i)=>ord.indexOf(i)+1);return `
  <div style="overflow-x:auto"><table class="spss"><caption>Sensitivity analysis — ${esc(rm.name)} (output: ${esc(rm.dep)})</caption>
    <tr><th>Network</th>${g.map(x=>`<th class="num">${esc(x)}</th>`).join('')}</tr>
    ${rm.nets.map(n=>`<tr><td>ANN${n.k}</td>${n.importance.map(v=>`<td class="num">${f0(v,3)}</td>`).join('')}</tr>`).join('')}
    <tr class="mean"><td>Average relative importance</td>${s.avgImportance.map(v=>`<td class="num">${f0(v,3)}</td>`).join('')}</tr>
    <tr><td>Normalized relative importance (%)</td>${s.normImportance.map(v=>`<td class="num"><strong>${f(v,1)}%</strong></td>`).join('')}</tr>
    <tr><td>Ranking</td>${rank.map(r=>`<td class="num">${r}</td>`).join('')}</tr>
  </table></div>`;}
function compRows(rm){
  const s=rm.summary,g=rm.groups,pl=rm.spec.pls;
  const beta=g.map(x=>pl[x]&&pl[x].beta!==''&&pl[x].beta!==undefined?Number(pl[x].beta):null);
  const pOrd=g.map((_,i)=>i).filter(i=>beta[i]!==null).sort((a,b)=>Math.abs(beta[b])-Math.abs(beta[a]));
  const aOrd=rankOrder(s.normImportance);
  return g.map((x,i)=>({name:x,beta:beta[i],sig:pl[x]?pl[x].sig!==false:true,pRank:beta[i]===null?null:pOrd.indexOf(i)+1,imp:s.normImportance[i],aRank:aOrd.indexOf(i)+1}))
    .map(r=>Object.assign(r,{match:r.pRank===null?null:r.pRank===r.aRank})).sort((a,b)=>a.aRank-b.aRank);
}
function compTable(rm){const rows=compRows(rm);const nm=rows.filter(r=>r.match===false).length;return `
  <table class="spss"><caption>Comparison between PLS-SEM and ANN results — ${esc(rm.name)} (output: ${esc(rm.dep)})</caption>
    <tr><th>Predictor</th><th class="num">PLS-SEM path coefficient</th><th class="num">Ranking (PLS-SEM)</th><th class="num">ANN normalized importance (%)</th><th class="num">Ranking (ANN)</th><th>Remark</th></tr>
    ${rows.map(r=>`<tr><td>${esc(r.name)}${r.sig?'':' <span class="small">(n.s.)</span>'}</td><td class="num">${r.beta===null?'–':f0(r.beta,3)}</td><td class="num">${r.pRank??'–'}</td><td class="num">${f(r.imp,1)}</td><td class="num">${r.aRank}</td><td>${r.match===null?'–':r.match?'<span class="pill-ok">Matched</span>':'<span class="pill-no">Not matched</span>'}</td></tr>`).join('')}
  </table>
  <div class="kpi-grid" style="margin-top:12px">${rm.spec.plsR2?`<div class="kpi"><div class="v">${esc(rm.spec.plsR2)}</div><div class="l">PLS-SEM R²</div></div>`:''}<div class="kpi"><div class="v">${f(rm.summary.r2Pred,3)}</div><div class="l">ANN predictive R²</div></div>${rm.summary.r2Leong!==null?`<div class="kpi"><div class="v">${f(rm.summary.r2Leong,3)}</div><div class="l">ANN R² (Leong et al. formula)</div></div>`:''}</div>
  <div class="hint-box">${nm?`<strong>${nm} predictor(s) rank differently.</strong> This is expected and is one of the main contributions of the hybrid approach: PLS-SEM captures linear, compensatory effects while the ANN also captures non-linear and non-compensatory effects. Discuss why the ranking changes (Leong et al., 2025).`:'The ANN ranking matches the PLS-SEM ranking, which strengthens the robustness of your findings.'} Rankings for PLS-SEM use the absolute path coefficient.</div>`;}
function benchTable(rm){const ex=rm.extra;if(!ex||!ex.bench)return '<p>Not available.</p>';return `
  <table class="spss"><caption>ANN vs linear regression on identical splits (testing RMSE, rescaled units)</caption>
    <tr><th>Network</th><th class="num">ANN RMSE</th><th class="num">Linear RMSE</th></tr>
    ${rm.nets.map((n,i)=>`<tr><td>ANN${n.k}</td><td class="num">${f(n.rmseTest,4)}</td><td class="num">${ex.bench[i]?f(ex.bench[i].rmse,4):'–'}</td></tr>`).join('')}
    <tr class="mean"><td>Mean</td><td class="num">${f(rm.summary.meanRmseTest,4)}</td><td class="num">${f(ex.linMeanRmse,4)}</td></tr>
    <tr><td>Predictive R²</td><td class="num">${f(rm.summary.r2Pred,3)}</td><td class="num">${f(ex.linPredR2,3)}</td></tr></table>
  <div class="hint-box">A clearly lower ANN error than the linear model is evidence of non-linear relationships that PLS-SEM cannot capture — a strong justification for the hybrid approach. Similar errors indicate mostly linear relationships.</div>`;}
function assumptionsHTML(rm){const ex=rm.extra;if(!ex)return '';const nm=ex.corrNames;return `
  <div class="section-title">Descriptive statistics (analysis sample, n = ${rm.nTotal})</div>
  <div style="overflow-x:auto"><table class="spss"><tr><th>Variable</th><th class="num">Mean</th><th class="num">SD</th><th class="num">Min</th><th class="num">Max</th><th class="num">Skewness</th><th class="num">Kurtosis</th></tr>
  ${ex.desc.map(d=>`<tr><td>${esc(d.name)}</td><td class="num">${f(d.mean)}</td><td class="num">${f(d.sd)}</td><td class="num">${f(d.min)}</td><td class="num">${f(d.max)}</td><td class="num">${f(d.skew)}</td><td class="num">${f(d.kurt)}</td></tr>`).join('')}</table></div>
  <div class="section-title">Correlation matrix</div>
  <div style="overflow-x:auto"><table class="spss"><tr><th></th>${nm.map(x=>`<th class="num">${esc(x)}</th>`).join('')}</tr>
  ${ex.corr.map((r,i)=>`<tr><td><strong>${esc(nm[i])}</strong></td>${r.map((v,j)=>`<td class="num" style="${j<i?'':'color:#bbb'}">${j<=i?f0(v,3):''}</td>`).join('')}</tr>`).join('')}</table></div>
  ${ex.vif?`<div class="section-title">Multicollinearity (VIF)</div><table class="spss"><tr><th>Predictor</th><th class="num">VIF</th></tr>${ex.vif.map(v=>`<tr><td>${esc(v.name)}</td><td class="num" style="${v.vif>=3?'color:var(--error);font-weight:700':''}">${f(v.vif,3)}</td></tr>`).join('')}</table><div class="small">VIF &lt; 3 indicates no multicollinearity concern (Hair et al., 2019).</div>`:''}
  ${ex.reset?`<div class="section-title">Linearity — Ramsey RESET test</div>
    <div class="${ex.reset.p<.05?'ok-box':'hint-box'}">F(${ex.reset.df1}, ${ex.reset.df2}) = ${f(ex.reset.F,3)}, p ${fmtP(ex.reset.p)}. ${ex.reset.p<.05?'<strong>Significant non-linearity detected</strong> — the linear model is mis-specified, which justifies the ANN stage of the hybrid approach.':'No significant non-linearity detected by this test; the ANN is still useful for ranking predictors and capturing non-compensatory effects.'} (Linear R² = ${f(ex.reset.r2Lin,3)}.)</div>`:''}`;}
function paramTable(rm,net){
  const sz=rm.sizes,L=sz.length-1,th=net.theta;const off=[];let o=0;for(let l=0;l<L;l++){off.push(o);o+=(sz[l]+1)*sz[l+1];}
  const unitName=(l,j)=>l===0?rm.featureNames[j]:l===L?rm.dep:`H(${l}:${j+1})`;
  const colHdr=[];for(let l=1;l<=L;l++)for(let j=0;j<sz[l];j++)colHdr.push({l,j});
  let h=`<div style="overflow-x:auto"><table class="spss"><caption>Parameter Estimates — Network ${net.k}</caption><tr><th rowspan="2" colspan="2">Predictor</th>`;
  for(let l=1;l<=L;l++)h+=`<th colspan="${sz[l]}" style="text-align:center">${l===L?'Output Layer':'Hidden Layer '+l}</th>`;
  h+=`</tr><tr>${colHdr.map(c=>`<th class="num">${esc(unitName(c.l,c.j))}</th>`).join('')}</tr>`;
  for(let l=0;l<L;l++){
    const nIn=sz[l],rows=[{name:'(Bias)',i:nIn}].concat(Array.from({length:nIn},(_,i)=>({name:unitName(l,i),i})));
    rows.forEach((r,ri)=>{h+=`<tr>${ri===0?`<td rowspan="${rows.length}"><strong>${l===0?'Input Layer':'Hidden Layer '+l}</strong></td>`:''}<td>${esc(r.name)}</td>`;
      colHdr.forEach(c=>{h+=c.l===l+1?`<td class="num">${f(th[off[l]+c.j*(nIn+1)+r.i],3)}</td>`:'<td></td>';});h+='</tr>';});
  }
  return h+`</table></div><div class="small" style="margin-top:6px">Synaptic weights connecting each unit (rows) to the units of the next layer (columns). Inputs were rescaled (${esc(APP.results.settings.covRescale)}) before training.</div>`;
}
function diagramSVG(rm,net){
  const sz=rm.sizes,L=sz.length-1,th=net.theta,S=APP.results.settings;const off=[];let o=0;for(let l=0;l<L;l++){off.push(o);o+=(sz[l]+1)*sz[l+1];}
  const maxN=Math.max(...sz),W=Math.max(640,190*L+260),H=Math.max(300,maxN*48+120),x0=150,x1=W-150,top=80,bot=H-50;
  const X=l=>x0+(x1-x0)*l/L,Y=(l,j)=>{const n=sz[l];const sp=Math.min(56,(bot-top)/Math.max(1,n));return (top+bot)/2+(j-(n-1)/2)*sp;},BY=45;
  let maxW=0;for(let i=0;i<th.length;i++)maxW=Math.max(maxW,Math.abs(th[i]));maxW=maxW||1;
  let lines='',nodes='';
  for(let l=0;l<L;l++){const nIn=sz[l];for(let j=0;j<sz[l+1];j++){for(let i=0;i<=nIn;i++){const w=th[off[l]+j*(nIn+1)+i];const xa=i===nIn?X(l)+34:X(l),ya=i===nIn?BY:Y(l,i);
    lines+=`<line x1="${xa.toFixed(1)}" y1="${ya.toFixed(1)}" x2="${X(l+1).toFixed(1)}" y2="${Y(l+1,j).toFixed(1)}" stroke="${w>=0?'#1e5bb8':'#9e9e9e'}" stroke-width="${(0.4+4*Math.abs(w)/maxW).toFixed(2)}" stroke-opacity="0.85"><title>${w.toFixed(4)}</title></line>`;}}}
  for(let l=0;l<L;l++)nodes+=`<circle cx="${X(l)+34}" cy="${BY}" r="13" fill="#fff" stroke="#555" stroke-width="1.2"/><text x="${X(l)+34}" y="${BY+4}" font-size="9" text-anchor="middle" fill="#333">Bias</text>`;
  for(let l=0;l<=L;l++)for(let j=0;j<sz[l];j++){const cx=X(l),cy=Y(l,j);const fill=l===0?'#ff8f00':l===L?'#2e7d32':'#3949ab';
    nodes+=`<circle cx="${cx}" cy="${cy}" r="16" fill="${fill}" stroke="#fff" stroke-width="2"/>`;
    if(l===0)nodes+=`<text x="${cx-24}" y="${cy+4}" font-size="12" text-anchor="end" fill="#222" font-weight="600">${esc(rm.featureNames[j])}</text>`;
    else if(l===L)nodes+=`<text x="${cx+24}" y="${cy+4}" font-size="12" fill="#222" font-weight="600">${esc(rm.dep)}</text>`;
    else nodes+=`<text x="${cx}" y="${cy+3.5}" font-size="8.5" text-anchor="middle" fill="#fff">H(${l}:${j+1})</text>`;}
  let labels='';for(let l=0;l<=L;l++)labels+=`<text x="${X(l)}" y="${H-22}" font-size="11" text-anchor="middle" fill="#1a237e" font-weight="700">${l===0?'Input layer':l===L?'Output layer':'Hidden layer '+l}</text>`;
  const act={sigmoid:'Sigmoid',tanh:'Hyperbolic tangent',relu:'ReLU',identity:'Identity'};
  return `<svg xmlns="http://www.w3.org/2000/svg" id="net-svg" width="${W}" height="${H+16}" viewBox="0 0 ${W} ${H+16}" font-family="Arial, Helvetica, sans-serif"><rect width="100%" height="100%" fill="#fff"/>${lines}${nodes}${labels}
    <g transform="translate(${W-230},14)"><line x1="0" y1="6" x2="26" y2="6" stroke="#1e5bb8" stroke-width="3"/><text x="32" y="10" font-size="10.5" fill="#333">Synaptic weight &gt; 0</text><line x1="0" y1="22" x2="26" y2="22" stroke="#9e9e9e" stroke-width="3"/><text x="32" y="26" font-size="10.5" fill="#333">Synaptic weight &lt; 0</text></g>
    <text x="10" y="${H+8}" font-size="10.5" fill="#555">Hidden layer activation: ${act[S.hAct]} · Output layer activation: ${act[S.oAct]} · Network ${net.k}</text></svg>`;
}
function downloadDiagram(kind){
  const svg=$('net-svg');if(!svg)return;const src=new XMLSerializer().serializeToString(svg);const name=`${RM().name.replace(/\s+/g,'_')}_network${RM().nets[APP.resNet].k}`;
  if(kind==='svg'){download(name+'.svg',src,'image/svg+xml');return;}
  const img=new Image();img.onload=()=>{const sc=3,cv=document.createElement('canvas');cv.width=svg.width.baseVal.value*sc;cv.height=svg.height.baseVal.value*sc;const cx=cv.getContext('2d');cx.scale(sc,sc);cx.drawImage(img,0,0);cv.toBlob(b=>download(name+'.png',b));};
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(src);
}
function drawTabCharts(tab,rm){
  if(typeof Chart==='undefined')return;Chart.defaults.animation.duration=300;
  const s=rm.summary,g=rm.groups,net=rm.nets[APP.resNet]||rm.nets[0];
  const mk=(id,cfg)=>{const el=$(id);if(!el)return;const ex=Chart.getChart(el);if(ex)ex.destroy();APP.charts[id]=new Chart(el,cfg);};
  if(tab==='Summary'||tab==='Sensitivity Analysis'){const ord=rankOrder(s.normImportance);
    mk('ch-imp',{type:'bar',data:{labels:ord.map(i=>g[i]),datasets:[{label:'Normalized importance (%)',data:ord.map(i=>+s.normImportance[i].toFixed(1)),backgroundColor:ord.map((_,k)=>k===0?'#1a237e':'#7986cb'),borderRadius:4}]},
      options:{indexAxis:'y',maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.raw+'%'}}},scales:{x:{min:0,max:100,title:{display:true,text:'Normalized importance (%)'}}}}});}
  if(tab==='Training Curves'){const n=net.histTr.length,ep=net.epochs;const lab=net.histTr.map((_,i)=>Math.round(1+i*(ep-1)/Math.max(1,n-1)));
    mk('ch-curve',{type:'line',data:{labels:lab,datasets:[{label:'Training MSE',data:net.histTr,borderColor:'#1a237e',pointRadius:0,borderWidth:2},{label:'Testing MSE',data:net.histTe,borderColor:'#ff8f00',pointRadius:0,borderWidth:2}]},
      options:{maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{title:{display:true,text:`Network ${net.k} — best epoch ${net.bestEpoch}`}},scales:{x:{title:{display:true,text:'Epoch'},ticks:{maxTicksLimit:12}},y:{type:'logarithmic',title:{display:true,text:'MSE (log scale)'}}}},
      plugins:[{id:'best',afterDraw(ch){const xs=ch.scales.x;const idx=lab.findIndex(v=>v>=net.bestEpoch);if(idx<0)return;const x=xs.getPixelForValue(idx);const c=ch.ctx;c.save();c.setLineDash([5,4]);c.strokeStyle='#2e7d32';c.beginPath();c.moveTo(x,ch.chartArea.top);c.lineTo(x,ch.chartArea.bottom);c.stroke();c.restore();}}]});}
  if(tab==='Predicted vs Observed'){const a=rm.dv.a,b=rm.dv.b;let obs,pred;
    if(s.oofPred){obs=s.oofObs;pred=s.oofPred;}else{obs=rm.nets.flatMap(n=>n.obsTest);pred=rm.nets.flatMap(n=>n.predTest);}
    const O=obs.map(v=>v*b+a),P=pred.map(v=>v*b+a);const lo=Math.min(...O,...P),hi=Math.max(...O,...P);
    mk('ch-po',{type:'scatter',data:{datasets:[{label:'Cases',data:O.map((v,i)=>({x:v,y:P[i]})),backgroundColor:'rgba(26,35,126,.45)',pointRadius:3},{label:'Perfect prediction',type:'line',data:[{x:lo,y:lo},{x:hi,y:hi}],borderColor:'#c62828',borderDash:[6,4],pointRadius:0}]},
      options:{maintainAspectRatio:false,plugins:{title:{display:true,text:'Predicted vs observed'}},scales:{x:{title:{display:true,text:'Observed '+rm.dep}},y:{title:{display:true,text:'Predicted '+rm.dep}}}}});
    mk('ch-res',{type:'scatter',data:{datasets:[{label:'Residual',data:P.map((v,i)=>({x:v,y:O[i]-v})),backgroundColor:'rgba(255,143,0,.55)',pointRadius:3}]},
      options:{maintainAspectRatio:false,plugins:{legend:{display:false},title:{display:true,text:'Residuals vs predicted'}},scales:{x:{title:{display:true,text:'Predicted'}},y:{title:{display:true,text:'Residual (observed − predicted)'}}}}});}
}
function exportCSV(){
  const R=APP.results,q=v=>{const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};const L=[];const row=(...a)=>L.push(a.map(q).join(','));
  row('SaNaSoft-ANN',VERSION,R.dataName,R.date);
  R.models.forEach(rm=>{const s=rm.summary;L.push('');row(rm.name,'Output: '+rm.dep,'Architecture: '+rm.sizes.join('-'));
    row('Network','N train','SSE train','RMSE train','N test','SSE test','RMSE test','Relative error test','Epochs','Stopping rule');
    rm.nets.forEach(n=>row('ANN'+n.k,n.nTrain,n.sseTrain.toFixed(6),n.rmseTrain.toFixed(6),n.nTest,n.sseTest.toFixed(6),n.rmseTest.toFixed(6),n.relErrTest.toFixed(6),n.epochs,n.stopReason));
    row('Mean','',s.meanSseTrain.toFixed(6),s.meanRmseTrain.toFixed(6),'',s.meanSseTest.toFixed(6),s.meanRmseTest.toFixed(6));row('SD','','',s.sdRmseTrain.toFixed(6),'','',s.sdRmseTest.toFixed(6));
    row('Predictive R2',s.r2Pred.toFixed(6));row('R2 Leong et al. (2025) formula',s.r2Leong===null?'':s.r2Leong.toFixed(6));L.push('');
    row('Sensitivity analysis',...rm.groups);rm.nets.forEach(n=>row('ANN'+n.k,...n.importance.map(v=>v.toFixed(6))));
    row('Average relative importance',...s.avgImportance.map(v=>v.toFixed(6)));row('Normalized importance (%)',...s.normImportance.map(v=>v.toFixed(3)));
    if(hasPls(rm)){L.push('');row('Predictor','PLS beta','PLS rank','ANN normalized importance','ANN rank','Remark');compRows(rm).forEach(r=>row(r.name,r.beta??'',r.pRank??'',r.imp.toFixed(2),r.aRank,r.match===null?'':r.match?'Matched':'Not matched'));}
  });
  download('SaNaSoft-ANN_results.csv','﻿'+L.join('\n'),'text/csv');
}
