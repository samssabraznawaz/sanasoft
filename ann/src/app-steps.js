// ───────────────────────── STEP 2 — MODELS & VARIABLES ─────────────────────────
const curModel=()=>APP.models[APP.active];
function validCases(m){
  if(!APP.data||!m.dependent)return 0;const vars=[m.dependent,...m.covariates];
  return APP.data.rows.filter(r=>vars.every(v=>toNum(r[v])!==null)&&m.factors.every(v=>r[v]!==null&&r[v]!==undefined&&String(r[v]).trim()!=='')).length;
}
function maxArrows(){const auto=Math.max(0,...APP.models.map(m=>m.covariates.length+m.factors.length));return toNum(APP.maxArrows)||auto;}
function renderStep2(c){
  if(!APP.data){c.innerHTML=`<div class="card"><div class="card-title">📊 Step 2: Models & Variables</div><div class="warn-box">Please import a data file first.</div>${navBtns('Back')}</div>`;return;}
  const m=curModel(),d=APP.data;
  const scaleVars=d.headers.filter(h=>d.types[h]==='scale');
  const inputs=d.headers.filter(h=>h!==m.dependent);
  const nValid=validCases(m),arrows=maxArrows(),need=50*arrows;
  const nonSig=m.covariates.concat(m.factors).filter(v=>m.pls[v]&&m.pls[v].beta!==''&&m.pls[v].beta!==undefined&&m.pls[v].sig===false);
  const idLike=m.covariates.filter(v=>{const s=d.stats[v];return s.uniq===d.rows.length&&/id|no|number|case|resp/i.test(v);});
  c.innerHTML=`
  <div class="card">
    <div class="card-title">📊 Step 2: Define Your ANN Model(s)</div>
    <div class="card-subtitle">One ANN model per endogenous construct that has significant predictors in your PLS-SEM results</div>
    <div class="hint-box"><strong>How SEM-ANN papers do it:</strong> for every endogenous (dependent) construct in the PLS-SEM model, the <strong>significant</strong> predictors become the input neurons of a separate ANN (Model A, Model B, …). Example: <em>BI ← PE, SI, HM</em> is Model A and <em>UB ← BI, FC</em> is Model B. Enter the PLS-SEM path coefficients too — SaNaSoft-ANN will then build the PLS-SEM vs ANN ranking comparison table for you.</div>
    <div class="model-tabs">
      ${APP.models.map((mm,i)=>`<button class="model-tab ${i===APP.active?'active':''}" onclick="APP.active=${i};renderStep(2)">${esc(mm.name)}${mm.dependent?` · ${esc(mm.dependent)}`:''}</button>`).join('')}
      <button class="model-tab add" onclick="addModel()">＋ Add model</button>
    </div>
    <div class="row-3">
      <div class="form-group"><label class="field-label">Model name</label><input type="text" value="${esc(m.name)}" onchange="curModel().name=this.value.trim()||'Model';renderStep(2)"></div>
      <div class="form-group"><label class="field-label">🎯 Output neuron (dependent construct)</label>
        <select onchange="setDV(this.value)"><option value="">— select —</option>${scaleVars.map(v=>`<option ${v===m.dependent?'selected':''}>${esc(v)}</option>`).join('')}</select>
        <div class="field-hint">A numeric latent variable score</div></div>
      <div class="form-group"><label class="field-label">PLS-SEM R² of this construct (optional)</label><input type="number" step="0.001" min="0" max="1" value="${esc(m.plsR2)}" placeholder="e.g. 0.562" onchange="curModel().plsR2=this.value">
        <div class="field-hint">Reported next to the ANN R² for comparison</div></div>
    </div>
    <div class="section-title">📥 Input neurons (predictors)</div>
    <div style="overflow-x:auto"><table class="var-table">
      <tr><th style="width:60px">Use</th><th>Variable</th><th>Measurement</th><th>Role in ANN</th><th>PLS-SEM path coefficient (β)</th><th>Significant in PLS-SEM?</th></tr>
      ${inputs.map(v=>{const use=m.covariates.includes(v)||m.factors.includes(v);const isScale=d.types[v]==='scale';const role=m.factors.includes(v)?'factor':'covariate';const pl=m.pls[v]||{};
        return `<tr class="${use?'in-use':''}">
          <td><input type="checkbox" class="chk" ${use?'checked':''} onchange="toggleInput('${jsq(v)}',this.checked)"></td>
          <td><strong>${esc(v)}</strong></td>
          <td class="small">${isScale?'Scale':'Categorical'} · ${d.stats[v].missing} missing</td>
          <td>${use?`<select onchange="setRole('${jsq(v)}',this.value)" ${isScale?'':'disabled'}><option value="covariate" ${role==='covariate'?'selected':''}>Covariate (scale)</option><option value="factor" ${role==='factor'?'selected':''}>Factor (categorical)</option></select>`:'<span class="small">—</span>'}</td>
          <td>${use?`<input type="number" step="0.001" value="${esc(pl.beta??'')}" placeholder="optional" onchange="setPls('${jsq(v)}','beta',this.value)">`:''}</td>
          <td>${use?`<label class="inline-flex"><input type="checkbox" class="chk" ${pl.sig!==false?'checked':''} onchange="setPls('${jsq(v)}','sig',this.checked)"> <span class="small">p &lt; .05</span></label>`:''}</td>
        </tr>`;}).join('')}
    </table></div>
    ${nonSig.length?`<div class="warn-box"><strong>Non-significant predictor(s): ${nonSig.map(esc).join(', ')}.</strong> Leong et al. (2025) use only the <em>significant</em> PLS-SEM predictors as input neurons. Consider removing them from this model.</div>`:''}
    ${idLike.length?`<div class="warn-box"><strong>${idLike.map(esc).join(', ')}</strong> looks like an ID column. Identifier columns should not be used as predictors.</div>`:''}
    <div class="section-title">📏 Sample size check (Leong et al., 2025: 50 × arrows rule)</div>
    <div class="row-2">
      <div class="form-group"><label class="field-label">Maximum number of arrows pointing at any endogenous construct in your PLS-SEM model</label>
        <input type="number" min="1" value="${esc(APP.maxArrows)}" placeholder="${Math.max(0,...APP.models.map(x=>x.covariates.length+x.factors.length))} (auto: largest number of ANN inputs)" onchange="APP.maxArrows=this.value;renderStep(2)">
        <div class="field-hint">Count all arrows in the structural model (including non-significant paths and controls).</div></div>
      <div>${m.dependent&&arrows?`<div class="${nValid>=need?'ok-box':'warn-box'}">Usable cases for ${esc(m.name)}: <strong>${nValid}</strong> (after listwise deletion). Required: 50 × ${arrows} = <strong>${need}</strong>. ${nValid>=need?'✅ Requirement met.':'⚠️ Below the recommended minimum — report this as a limitation.'}</div>`:'<div class="hint-box">Select an output and at least one input to check the sample size.</div>'}</div>
    </div>
    <div class="section-title">⚖️ Rescaling of covariates</div>
    <div class="row-2"><div class="form-group">
      <select onchange="APP.settings.covRescale=this.value">
        ${[['standardized','Standardized (z-scores) — SPSS default ✅'],['normalized','Normalized (0 to 1)'],['adjnormalized','Adjusted normalized (−1 to 1)'],['none','None']].map(o=>`<option value="${o[0]}" ${APP.settings.covRescale===o[0]?'selected':''}>${o[1]}</option>`).join('')}
      </select><div class="field-hint">The dependent variable is rescaled automatically to match the output activation (sigmoid ⇒ 0–1, as SPSS requires).</div></div>
      <div>${APP.models.length>1?`<button class="btn btn-outline btn-sm" style="color:var(--error);border-color:var(--error)" onclick="delModel(${APP.active})">🗑 Delete ${esc(m.name)}</button>`:''}</div>
    </div>
  </div>
  ${navBtns('Back','Next: Partitioning','validateStep2()')}`;
}
function setDV(v){const m=curModel();m.dependent=v||null;m.covariates=m.covariates.filter(x=>x!==v);m.factors=m.factors.filter(x=>x!==v);APP.results=null;renderStep(2);}
function toggleInput(v,on){const m=curModel();m.covariates=m.covariates.filter(x=>x!==v);m.factors=m.factors.filter(x=>x!==v);
  if(on){if(APP.data.types[v]==='scale')m.covariates.push(v);else m.factors.push(v);if(!m.pls[v])m.pls[v]={beta:'',sig:true};}
  APP.results=null;renderStep(2);}
function setRole(v,role){const m=curModel();m.covariates=m.covariates.filter(x=>x!==v);m.factors=m.factors.filter(x=>x!==v);(role==='factor'?m.factors:m.covariates).push(v);APP.results=null;renderStep(2);}
function setPls(v,k,val){const m=curModel();m.pls[v]=m.pls[v]||{beta:'',sig:true};m.pls[v][k]=k==='beta'?(val===''?'':Number(val)):val;if(k==='sig')renderStep(2);}
function addModel(){const L='ABCDEFGHIJKLMNOPQRSTUVWXYZ';APP.models.push(newModel('Model '+(L[APP.models.length]||APP.models.length+1)));APP.active=APP.models.length-1;renderStep(2);}
function delModel(i){if(!confirm(`Delete ${APP.models[i].name}?`))return;APP.models.splice(i,1);APP.active=0;APP.results=null;renderStep(2);}
function validateStep2(){
  const bad=APP.models.filter(m=>!m.dependent||(m.covariates.length+m.factors.length)<1);
  if(bad.length){toast(`${bad[0].name}: choose an output and at least one input.`,'err');return;}
  const small=APP.models.filter(m=>validCases(m)<20);
  if(small.length){toast(`${small[0].name} has only ${validCases(small[0])} usable cases — at least 20 are needed.`,'err');return;}
  next();
}

// ───────────────────────── STEP 3 — PARTITIONING ─────────────────────────
function renderStep3(c){
  const s=APP.settings;const n=APP.models[0]?validCases(APP.models[0]):0;
  const nH=Math.round(n*s.holdout/100),nA=n-nH;
  const trPct=s.scheme==='kfold'?(100-s.holdout)*(1-1/s.networks):s.training*(100-s.holdout)/100;
  const tePct=s.scheme==='kfold'?(100-s.holdout)/s.networks:s.test*(100-s.holdout)/100;
  c.innerHTML=`
  <div class="card">
    <div class="card-title">✂️ Step 3: Partitioning & Number of Networks</div>
    <div class="card-subtitle">How the cases are split into training and testing samples, and how many networks are trained</div>
    <div class="ok-box"><strong>Leong et al. (2025):</strong> use <strong>90% training / 10% testing</strong> and a <strong>ten-fold cross-validation</strong> — i.e. ten networks, each tested on a different 10% of the data. RMSE and importance are then averaged over the ten networks.</div>
    <div class="row-2" style="margin-top:12px">
      <div class="scheme-card ${s.scheme==='kfold'?'sel':''}" onclick="APP.settings.scheme='kfold';renderStep(3)"><input type="radio" ${s.scheme==='kfold'?'checked':''}><div><div class="t">k-fold cross-validation ✅ <span class="badge-pill badge-success">Recommended</span></div><div class="d">The data are cut into k equal folds; network k is tested on fold k and trained on the rest. With k = 10 every network is exactly 90/10 and every case is tested once.</div></div></div>
      <div class="scheme-card ${s.scheme==='random'?'sel':''}" onclick="APP.settings.scheme='random';renderStep(3)"><input type="radio" ${s.scheme==='random'?'checked':''}><div><div class="t">Repeated random splits</div><div class="d">Each network gets a fresh random training/testing split with the percentages below — equivalent to re-running the SPSS MLP several times.</div></div></div>
    </div>
    <div class="row-3" style="margin-top:16px">
      <div class="form-group"><label class="field-label">Number of networks (k)</label>
        <input type="number" min="1" max="30" value="${s.networks}" onchange="APP.settings.networks=Math.max(${s.scheme==='kfold'?2:1},Math.min(30,Math.round(+this.value||10)));renderStep(3)">
        <div class="field-hint">10 recommended (ten-fold cross-validation)</div></div>
      <div class="form-group"><label class="field-label">Holdout sample (%) — optional</label>
        <div class="slider-row"><input type="range" min="0" max="30" step="5" value="${s.holdout}" oninput="APP.settings.holdout=+this.value;this.nextElementSibling.textContent=this.value+'%'" onchange="renderStep(3)"><span class="num-display">${s.holdout}%</span></div>
        <div class="field-hint">Set aside before training, used only for a final independent check. Leong et al. use 0%.</div></div>
      <div class="form-group"><label class="field-label">Random seed</label>
        <input type="number" value="${s.seed}" onchange="APP.settings.seed=Math.round(+this.value)||1">
        <div class="field-hint">Same seed + same settings ⇒ identical results (reproducible)</div></div>
    </div>
    ${s.scheme==='random'?`<div class="row-2">
      <div class="form-group"><label class="field-label">Training % (of non-holdout cases)</label>
        <div class="slider-row"><input type="range" min="50" max="95" step="5" value="${s.training}" oninput="APP.settings.training=+this.value;APP.settings.test=100-this.value;this.nextElementSibling.textContent=this.value+'% / '+(100-this.value)+'%'" onchange="renderStep(3)"><span class="num-display" style="min-width:90px">${s.training}% / ${s.test}%</span></div></div></div>`:''}
    <div class="section-title">Resulting split per network</div>
    <div id="partition-bar">
      <div id="part-train" style="width:${trPct}%">Training ${trPct.toFixed(0)}%</div>
      <div id="part-test" style="width:${tePct}%">${tePct>=7?'Test '+tePct.toFixed(0)+'%':''}</div>
      <div id="part-holdout" style="width:${s.holdout}%">${s.holdout>=7?'Holdout '+s.holdout+'%':''}</div>
    </div>
    ${n?`<div class="hint-box">${esc(APP.models[0].name)} has <strong>${n}</strong> usable cases → holdout <strong>${nH}</strong>; each network trains on about <strong>${Math.round(s.scheme==='kfold'?nA*(1-1/s.networks):nA*s.training/100)}</strong> and tests on about <strong>${Math.round(s.scheme==='kfold'?nA/s.networks:nA*s.test/100)}</strong> cases.</div>`:''}
    ${(Math.round(trPct)!==90||Math.round(tePct)!==10)?`<div class="tip-box">⚠️ The current split (${trPct.toFixed(0)}/${tePct.toFixed(0)}${s.holdout?'/'+s.holdout:''}) deviates from the 90/10 recommendation and will be flagged in the compliance check.</div>`:`<div class="ok-box">✅ Every network uses a 90/10 training/testing split.</div>`}
  </div>
  ${navBtns('Back','Next: Architecture')}`;
}

// ───────────────────────── STEP 4 — ARCHITECTURE ─────────────────────────
function renderStep4(c){
  const s=APP.settings;const opt=(v,l,cur)=>`<option value="${v}" ${cur===v?'selected':''}>${l}</option>`;
  c.innerHTML=`
  <div class="card">
    <div class="card-title">🧠 Step 4: Network Architecture</div>
    <div class="card-subtitle">Layers, neurons and activation functions of the multilayer perceptron</div>
    <div class="ok-box"><strong>Leong et al. (2025):</strong> <strong>two hidden layers</strong> (deep learning), hidden neurons <strong>generated automatically</strong>, and the <strong>sigmoid</strong> activation for both hidden and output layers.</div>
    <div class="row-3" style="margin-top:12px">
      <div class="form-group"><label class="field-label">Number of hidden layers</label>
        <select onchange="APP.settings.hiddenLayers=+this.value;renderStep(4)">${opt(1,'1 hidden layer',s.hiddenLayers)}${opt(2,'2 hidden layers ✅ (deep learning)',s.hiddenLayers)}</select></div>
      <div class="form-group"><label class="field-label">Hidden layer activation</label>
        <select onchange="APP.settings.hAct=this.value">${opt('sigmoid','Sigmoid ✅',s.hAct)}${opt('tanh','Hyperbolic tangent (SPSS default)',s.hAct)}${opt('relu','ReLU',s.hAct)}</select></div>
      <div class="form-group"><label class="field-label">Output layer activation</label>
        <select onchange="APP.settings.oAct=this.value;renderStep(4)">${opt('sigmoid','Sigmoid ✅',s.oAct)}${opt('identity','Identity (SPSS default)',s.oAct)}${opt('tanh','Hyperbolic tangent',s.oAct)}</select></div>
    </div>
    <div class="section-title">Number of neurons in the hidden layer(s)</div>
    <div class="row-2">
      <div class="scheme-card ${s.autoUnits?'sel':''}" onclick="APP.settings.autoUnits=true;renderStep(4)"><input type="radio" ${s.autoUnits?'checked':''}><div><div class="t">Automatically compute ✅</div><div class="d">SaNaSoft-ANN trains candidate networks with different numbers of hidden neurons and keeps the smallest network whose testing error is within 2% of the best. The chosen architecture is reported.</div></div></div>
      <div class="scheme-card ${!s.autoUnits?'sel':''}" onclick="APP.settings.autoUnits=false;renderStep(4)"><input type="radio" ${!s.autoUnits?'checked':''}><div><div class="t">Custom</div><div class="d">Specify the number of neurons in each hidden layer yourself.</div></div></div>
    </div>
    <div class="row-3" style="margin-top:12px">
      ${s.autoUnits?`<div class="form-group"><label class="field-label">Maximum neurons searched (layer 1)</label><input type="number" min="2" max="12" value="${s.autoMax}" onchange="APP.settings.autoMax=Math.max(2,Math.min(12,+this.value||8))"><div class="field-hint">Search grid 1–${s.autoMax}${s.hiddenLayers===2?`; layer 2 ≤ layer 1 and ≤ ${s.autoMax2}`:''}</div></div>
        ${s.hiddenLayers===2?`<div class="form-group"><label class="field-label">Maximum neurons searched (layer 2)</label><input type="number" min="1" max="8" value="${s.autoMax2}" onchange="APP.settings.autoMax2=Math.max(1,Math.min(8,+this.value||4))"></div>`:''}`
      :`<div class="form-group"><label class="field-label">Neurons in hidden layer 1</label><input type="number" min="1" max="50" value="${s.units[0]}" onchange="APP.settings.units[0]=Math.max(1,Math.round(+this.value||1))"></div>
        ${s.hiddenLayers===2?`<div class="form-group"><label class="field-label">Neurons in hidden layer 2</label><input type="number" min="1" max="50" value="${s.units[1]}" onchange="APP.settings.units[1]=Math.max(1,Math.round(+this.value||1))"></div>`:''}`}
    </div>
    ${s.oAct==='identity'?`<div class="form-group" style="max-width:420px"><label class="field-label">Rescaling of the dependent variable</label><select onchange="APP.settings.dvRescale=this.value">${opt('standardized','Standardized',s.dvRescale)}${opt('normalized','Normalized (0–1)',s.dvRescale)}${opt('none','None',s.dvRescale)}</select></div>`
      :`<div class="hint-box">With a <strong>${s.oAct}</strong> output the dependent variable is rescaled to ${s.oAct==='sigmoid'?'0–1 (normalized)':'−1 to 1 (adjusted normalized)'} automatically, because the output neuron can only produce values in that range. SSE and RMSE are therefore reported in these rescaled units — exactly as SPSS does.</div>`}
    <details class="adv"><summary>Advanced: weight initialisation & regularisation</summary>
      <div class="row-3" style="margin-top:10px">
        <div class="form-group"><label class="field-label">Initial weights: interval center</label><input type="number" step="0.1" value="${s.initCenter}" onchange="APP.settings.initCenter=+this.value"><div class="field-hint">SPSS default 0</div></div>
        <div class="form-group"><label class="field-label">Initial weights: interval offset (±)</label><input type="number" step="0.1" min="0.01" value="${s.initOffset}" onchange="APP.settings.initOffset=Math.max(0.01,+this.value)"><div class="field-hint">SPSS default ±0.5</div></div>
        <div class="form-group"><label class="field-label">L2 weight decay (λ)</label><input type="number" step="0.0001" min="0" value="${s.l2}" onchange="APP.settings.l2=Math.max(0,+this.value)"><div class="field-hint">0 = none (default). Try 0.0001–0.001 if the testing error is much larger than the training error.</div></div>
      </div>
    </details>
  </div>
  ${navBtns('Back','Next: Training')}`;
}

// ───────────────────────── STEP 5 — TRAINING ─────────────────────────
function applyPreset(k){
  const s=APP.settings;
  if(k==='leong')Object.assign(s,{scheme:'kfold',networks:10,holdout:0,hiddenLayers:2,autoUnits:true,hAct:'sigmoid',oAct:'sigmoid',algorithm:'ffbp',type:'batch',lr:1.0,momentum:0.9,maxEpochs:3000,patience:100,minEpochs:300,covRescale:'standardized'});
  if(k==='spss')Object.assign(s,{scheme:'random',networks:1,training:70,test:30,holdout:0,hiddenLayers:1,autoUnits:true,autoMax:12,hAct:'tanh',oAct:'identity',dvRescale:'standardized',algorithm:'scg',type:'batch',maxEpochs:3000,patience:100,minEpochs:100,covRescale:'standardized'});
  if(k==='defaults'){const o=s.output,r=s.report;APP.settings=Object.assign(DEFAULT_SETTINGS(),{output:o,report:r});}
  toast(k==='leong'?'Leong et al. (2025) settings applied':k==='spss'?'SPSS default settings applied':'Defaults restored');renderStep(5);
}
function renderStep5(c){
  const s=APP.settings;const opt=(v,l,cur)=>`<option value="${v}" ${cur===v?'selected':''}>${l}</option>`;
  const algCard=(k,t,d)=>`<div class="scheme-card ${s.algorithm===k?'sel':''}" onclick="APP.settings.algorithm='${k}';if('${k}'==='scg')APP.settings.type='batch';renderStep(5)"><input type="radio" ${s.algorithm===k?'checked':''}><div><div class="t">${t}</div><div class="d">${d}</div></div></div>`;
  c.innerHTML=`
  <div class="card">
    <div class="card-title">⚙️ Step 5: Training</div>
    <div class="card-subtitle">Optimisation algorithm and stopping rules</div>
    <div class="inline-flex" style="margin-bottom:12px"><span class="small"><strong>One-click presets:</strong></span>
      <button class="btn btn-outline btn-sm" onclick="applyPreset('leong')">📘 Leong et al. (2025)</button>
      <button class="btn btn-outline btn-sm" onclick="applyPreset('spss')">🖥️ SPSS MLP defaults</button>
      <button class="btn btn-outline btn-sm" onclick="applyPreset('defaults')">↺ Restore SaNaSoft defaults</button></div>
    <div class="ok-box"><strong>Leong et al. (2025):</strong> feed-forward back-propagation (<strong>FFBP</strong>) to minimise errors. SaNaSoft-ANN implements FFBP as gradient descent with momentum, the algorithm SPSS labels “Gradient descent”.</div>
    <div class="row-3" style="margin-top:12px">
      ${algCard('ffbp','FFBP — gradient descent ✅','Classic back-propagation with momentum. Recommended by Leong et al. (2025).')}
      ${algCard('scg','Scaled conjugate gradient','Møller (1993). SPSS default for batch training; very fast and precise.')}
      ${algCard('adam','Adam','Adaptive modern optimiser (Kingma & Ba, 2015). Not available in SPSS.')}
    </div>
    <div class="row-3" style="margin-top:14px">
      <div class="form-group"><label class="field-label">Type of training</label>
        <select onchange="APP.settings.type=this.value;renderStep(5)" ${s.algorithm==='scg'?'disabled':''}>${opt('batch','Batch ✅ (all training cases per update)',s.type)}${opt('minibatch','Mini-batch',s.type)}${opt('online','Online (one case per update)',s.type)}</select>
        ${s.algorithm==='scg'?'<div class="field-hint">SCG works with batch training only (as in SPSS)</div>':''}</div>
      ${s.algorithm==='ffbp'?`
      <div class="form-group"><label class="field-label">Learning rate</label><input type="number" step="0.05" min="0.001" value="${s.lr}" onchange="APP.settings.lr=Math.max(0.001,+this.value)"><div class="field-hint">Default 1.0 (applied to the mean-error gradient)</div></div>
      <div class="form-group"><label class="field-label">Momentum</label><input type="number" step="0.05" min="0" max="0.99" value="${s.momentum}" onchange="APP.settings.momentum=Math.min(0.99,Math.max(0,+this.value))"><div class="field-hint">SPSS default 0.9</div></div>`:''}
      ${s.algorithm==='adam'?`<div class="form-group"><label class="field-label">Learning rate (Adam)</label><input type="number" step="0.001" min="0.0001" value="${s.adamLr}" onchange="APP.settings.adamLr=Math.max(0.0001,+this.value)"><div class="field-hint">Default 0.01</div></div>`:''}
      ${s.algorithm==='scg'?`<div class="form-group"><label class="field-label">Initial lambda (λ)</label><input type="number" step="1e-7" value="${s.scgLambda}" onchange="APP.settings.scgLambda=+this.value"><div class="field-hint">SPSS default 0.0000005</div></div>
      <div class="form-group"><label class="field-label">Initial sigma (σ)</label><input type="number" step="1e-5" value="${s.scgSigma}" onchange="APP.settings.scgSigma=+this.value"><div class="field-hint">SPSS default 0.00005</div></div>`:''}
    </div>
    ${s.type==='minibatch'&&s.algorithm!=='scg'?`<div class="row-3"><div class="form-group"><label class="field-label">Mini-batch size</label><input type="number" min="2" value="${s.batchSize}" onchange="APP.settings.batchSize=Math.max(2,Math.round(+this.value))"></div></div>`:''}
    ${s.algorithm==='ffbp'&&s.type!=='batch'?`<div class="row-3"><div class="form-group"><label class="field-label">Learning-rate lower boundary</label><input type="number" step="0.001" value="${s.lrLower}" onchange="APP.settings.lrLower=+this.value"><div class="field-hint">SPSS default 0.001</div></div><div class="form-group"><label class="field-label">Learning-rate reduction (epochs)</label><input type="number" min="1" value="${s.lrReductionEpochs}" onchange="APP.settings.lrReductionEpochs=Math.max(1,+this.value)"><div class="field-hint">SPSS default 10</div></div></div>`:''}
    <div class="section-title">Stopping rules</div>
    <div class="row-3">
      <div class="form-group"><label class="field-label">Epochs without a decrease in testing error</label><input type="number" min="1" value="${s.patience}" onchange="APP.settings.patience=Math.max(1,Math.round(+this.value))"><div class="field-hint">Early stopping on the testing sample (as in SPSS). The weights with the lowest testing error are kept. Default 100.</div></div>
      <div class="form-group"><label class="field-label">Minimum epochs before early stopping</label><input type="number" min="0" value="${s.minEpochs}" onchange="APP.settings.minEpochs=Math.max(0,Math.round(+this.value))"><div class="field-hint">Prevents stopping on the initial learning plateau of sigmoid networks. Default 300.</div></div>
      <div class="form-group"><label class="field-label">Maximum epochs</label><input type="number" min="10" value="${s.maxEpochs}" onchange="APP.settings.maxEpochs=Math.max(10,Math.round(+this.value))"><div class="field-hint">Default 3000</div></div>
      <div class="form-group"><label class="field-label">Minimum relative change in training error</label><input type="number" step="0.00001" min="0" value="${s.minRelChange}" onchange="APP.settings.minRelChange=Math.max(0,+this.value)"><div class="field-hint">Over 50 epochs. 0 disables. Default 0.00001</div></div>
      <div class="form-group"><label class="field-label">Maximum training time per network (min)</label><input type="number" min="1" value="${s.maxTimeMin}" onchange="APP.settings.maxTimeMin=Math.max(1,+this.value)"><div class="field-hint">SPSS default 15</div></div>
      <div class="form-group"><label class="field-label">Sensitivity analysis: permutations per predictor</label><input type="number" min="1" max="100" value="${s.permRepeats}" onchange="APP.settings.permRepeats=Math.max(1,Math.min(100,Math.round(+this.value)))"><div class="field-hint">More = more stable importance values. Default 10</div></div>
    </div>
  </div>
  ${navBtns('Back','Next: Output Options')}`;
}

// ───────────────────────── STEP 6 — OUTPUT ─────────────────────────
function renderStep6(c){
  const o=APP.settings.output;
  const tog=(k,l,sub,rec)=>`<div class="toggle-row"><div><div class="toggle-label">${l} ${rec?'✅':''}</div>${sub?`<div class="toggle-sub">${sub}</div>`:''}</div><label class="toggle-switch"><input type="checkbox" ${o[k]?'checked':''} onchange="APP.settings.output.${k}=this.checked"><span class="toggle-slider"></span></label></div>`;
  c.innerHTML=`
  <div class="card">
    <div class="card-title">📋 Step 6: Output Options</div>
    <div class="card-subtitle">Tables and charts shown in the Results step</div>
    <div class="ok-box"><strong>Leong et al. (2025, Fig. 21):</strong> report the <strong>synaptic weights</strong>, the <strong>model summary</strong> (SSE, relative error), <strong>RMSE for training and testing</strong>, <strong>R²</strong> and the <strong>independent variable importance</strong> (sensitivity analysis).</div>
    <div class="section-title">Guideline outputs</div>
    ${tog('rmse','RMSE of the ten networks (training & testing, mean, SD)','The standard SEM-ANN model-fit table.',true)}
    ${tog('sensitivity','Sensitivity analysis (independent variable importance)','Importance per network, average relative importance and normalized importance (%).',true)}
    ${tog('comparison','PLS-SEM vs ANN comparison','Ranks the predictors by PLS-SEM path coefficient and by ANN normalized importance. Needs β values from Step 2.',true)}
    ${tog('weights','Parameter estimates (synaptic weights)','SPSS-style table of all connection weights and biases.',true)}
    ${tog('modelSummary','Model summary (SPSS Table 9 layout)','SSE, relative error, stopping rule and training time.',true)}
    ${tog('caseSummary','Case processing summary','Training, testing, holdout and excluded cases.',true)}
    ${tog('diagram','Network diagram','Figure 22-style diagram with weights coloured by sign and scaled by size.',true)}
    <div class="section-title">Diagnostics</div>
    ${tog('curves','Training curves','Training and testing error by epoch — shows convergence and over-fitting.')}
    ${tog('predObs','Predicted vs observed & residuals','Out-of-sample predictions for every case.')}
    ${tog('benchmark','Linear regression benchmark','Same folds, linear model — shows whether the ANN captures non-linear relationships.')}
    ${tog('descriptives','Descriptives & assumptions','Correlations, VIF (multicollinearity) and Ramsey RESET test (linearity).')}
    <div class="section-title">Report</div>
    <div class="row-2"><div class="form-group"><label class="field-label">Citation style</label>
      <select onchange="APP.settings.report.style=this.value">${styleOptions(APP.settings.report.style)}</select></div></div>
  </div>
  ${navBtns('Back','Next: Review & Run')}`;
}

// ───────────────────────── STEP 7 — REVIEW & RUN ─────────────────────────
function complianceChecks(){
  const s=APP.settings,C=[];
  const add=(label,status,current,msg)=>C.push({label,status,current,msg});
  const allIn=APP.models.flatMap(m=>m.covariates.concat(m.factors).map(v=>({m,v})));
  const withPls=allIn.filter(x=>x.m.pls[x.v]&&x.m.pls[x.v].beta!==''&&x.m.pls[x.v].beta!==undefined);
  const nonSig=allIn.filter(x=>x.m.pls[x.v]&&x.m.pls[x.v].sig===false);
  add('Inputs are significant PLS-SEM predictors',nonSig.length?'warn':'pass',nonSig.length?`${nonSig.length} non-significant input(s)`:(withPls.length?'All inputs marked significant':'All inputs marked significant (no β entered)'),nonSig.length?'Use only significant predictors as input neurons':'✓ As recommended');
  const arrows=maxArrows();const nMin=Math.min(...APP.models.map(validCases));
  add('Sample size ≥ 50 × maximum arrows',nMin>=50*arrows?'pass':'warn',`n = ${nMin} vs ${50*arrows} required`,nMin>=50*arrows?'✓ Requirement met':'Below the recommended minimum — report as a limitation');
  const tr=s.scheme==='kfold'?(1-1/s.networks)*100:s.training,te=s.scheme==='kfold'?100/s.networks:s.test;
  const ok9010=Math.round(tr)===90&&Math.round(te)===10&&!s.holdout;
  add('Partition 90% training / 10% testing',ok9010?'pass':'warn',`${tr.toFixed(0)}/${te.toFixed(0)}${s.holdout?' + '+s.holdout+'% holdout':''}`,ok9010?'✓ Follows guideline':'Guideline: 90/10');
  add('Ten-fold cross-validation (10 networks)',s.networks===10&&s.scheme==='kfold'?'pass':'warn',`${s.networks} network(s), ${s.scheme==='kfold'?'k-fold':'random splits'}`,s.networks===10&&s.scheme==='kfold'?'✓ Ten networks, averaged results':'Guideline: ten-fold cross-validation');
  add('Two hidden layers (deep learning)',s.hiddenLayers===2?'pass':'warn',`${s.hiddenLayers} hidden layer(s)`,s.hiddenLayers===2?'✓ Deep ANN':'Guideline: two hidden layers');
  add('Hidden neurons generated automatically',s.autoUnits?'pass':'warn',s.autoUnits?'Automatic':'Custom '+s.units.slice(0,s.hiddenLayers).join('–'),s.autoUnits?'✓ As recommended':'Guideline: automatic');
  add('Sigmoid activation (hidden layers)',s.hAct==='sigmoid'?'pass':'warn',s.hAct,s.hAct==='sigmoid'?'✓':'Guideline: sigmoid');
  add('Sigmoid activation (output layer)',s.oAct==='sigmoid'?'pass':'warn',s.oAct,s.oAct==='sigmoid'?'✓':'Guideline: sigmoid');
  add('FFBP training algorithm',s.algorithm==='ffbp'?'pass':'warn',{ffbp:'FFBP',scg:'SCG',adam:'Adam'}[s.algorithm],s.algorithm==='ffbp'?'✓':'Guideline: FFBP');
  add('RMSE reported (training & testing)',s.output.rmse?'pass':'fail',s.output.rmse?'On':'Off',s.output.rmse?'✓':'Enable in Step 6');
  add('Sensitivity analysis / normalized importance',s.output.sensitivity?'pass':'fail',s.output.sensitivity?'On':'Off',s.output.sensitivity?'✓ Averaged over all networks':'Enable in Step 6');
  add('Synaptic weights reported',s.output.weights?'pass':'warn',s.output.weights?'On':'Off',s.output.weights?'✓':'Enable in Step 6');
  return C;
}
function renderStep7(c){
  const s=APP.settings;
  if(!APP.data||APP.models.some(m=>!m.dependent||!(m.covariates.length+m.factors.length))){c.innerHTML=`<div class="card"><div class="card-title">▶️ Step 7: Review & Run</div><div class="warn-box">Please import data and complete every model in Step 2 first.</div><div class="btn-group"><button class="btn btn-primary" onclick="goStep(APP.data?2:1)">Go to ${APP.data?'Step 2':'Step 1'}</button></div></div>`;return;}
  const C=complianceChecks();const nPass=C.filter(x=>x.status==='pass').length;
  c.innerHTML=`
  <div class="card">
    <div class="card-title">▶️ Step 7: Review & Compliance Check</div>
    <div class="card-subtitle">${nPass} of ${C.length} guideline checks passed</div>
    <div class="section-title">Models</div>
    <div style="overflow-x:auto"><table><tr><th>Model</th><th>Output</th><th>Inputs</th><th class="num">Usable cases</th></tr>
      ${APP.models.map(m=>`<tr><td><strong>${esc(m.name)}</strong></td><td>${esc(m.dependent)}</td><td>${m.covariates.concat(m.factors).map(esc).join(', ')}</td><td class="num">${validCases(m)}</td></tr>`).join('')}</table></div>
    <div class="section-title">Settings</div>
    <div class="row-2"><table>
      <tr><td>Networks / scheme</td><td><strong>${s.networks} · ${s.scheme==='kfold'?s.networks+'-fold cross-validation':'random '+s.training+'/'+s.test+' splits'}</strong></td></tr>
      <tr><td>Holdout</td><td><strong>${s.holdout}%</strong></td></tr>
      <tr><td>Hidden layers / neurons</td><td><strong>${s.hiddenLayers} · ${s.autoUnits?'automatic':s.units.slice(0,s.hiddenLayers).join('–')}</strong></td></tr>
      <tr><td>Activation (hidden / output)</td><td><strong>${s.hAct} / ${s.oAct}</strong></td></tr></table>
      <table><tr><td>Algorithm</td><td><strong>${{ffbp:'FFBP (gradient descent, lr '+s.lr+', momentum '+s.momentum+')',scg:'Scaled conjugate gradient',adam:'Adam (lr '+s.adamLr+')'}[s.algorithm]}</strong></td></tr>
      <tr><td>Training type</td><td><strong>${s.algorithm==='scg'?'batch':s.type}</strong></td></tr>
      <tr><td>Stopping</td><td><strong>${s.patience} epochs without improvement (after ${s.minEpochs}); max ${s.maxEpochs}</strong></td></tr>
      <tr><td>Covariate rescaling / seed</td><td><strong>${s.covRescale} · ${s.seed}</strong></td></tr></table></div>
    <div class="section-title">🔍 Leong et al. (2025) compliance check</div>
    ${C.map(ch=>`<div class="compliance-item ${ch.status}"><span class="compliance-icon">${ch.status==='pass'?'✅':ch.status==='warn'?'⚠️':'❌'}</span><div><strong>${ch.label}:</strong> ${esc(ch.current)} — ${ch.msg}</div></div>`).join('')}
  </div>
  <div class="card" style="text-align:center;border:2px solid var(--accent)">
    <h2 style="font-size:20px;color:var(--accent);margin-bottom:6px">🚀 Ready to run</h2>
    <p style="color:var(--muted);margin-bottom:16px;font-size:13px">${APP.models.length} model(s) × ${s.networks} network(s)${s.autoUnits?' + automatic neuron search':''}. Usually a few seconds; large samples may take up to a minute.</p>
    <button class="btn btn-accent" onclick="runAnalysis()">▶ RUN ANN ANALYSIS</button>
  </div>
  ${navBtns('Back')}`;
}
