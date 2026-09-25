// ───────────────────────── STEP 9 — REPORT ─────────────────────────
// Citation styles — same set as the SaNaSoft fsQCA tool, plus APA 6th
const REF_STYLES=[['apa7','APA 7th edition'],['apa6','APA 6th edition'],['harvard','Harvard (Cite Them Right)'],['emerald','Emerald (Harvard variant)'],['chicago','Chicago author-date'],['ieee','IEEE'],['vancouver','Vancouver']];
const SOFTWARE_URL='https://samssabraznawaz.github.io/sanasoft/ann/'; // change this one line if SaNaSoft-ANN moves
const REFS={
  leong:{type:'article',a:[['Leong','L.-Y.'],['Hew','T.-S.'],['Ooi','K.-B.'],['Tan','G. W.-H.'],['Koohang','A.']],y:2025,t:'An SEM-ANN approach – Guidelines in information systems research',j:'Journal of Computer Information Systems',v:65,i:6,p:'706–737',doi:'10.1080/08874417.2024.2329128'},
  rumelhart:{type:'article',a:[['Rumelhart','D. E.'],['Hinton','G. E.'],['Williams','R. J.']],y:1986,t:'Learning representations by back-propagating errors',j:'Nature',v:323,i:6088,p:'533–536',doi:'10.1038/323533a0'},
  moller:{type:'article',a:[['Møller','M. F.']],y:1993,t:'A scaled conjugate gradient algorithm for fast supervised learning',j:'Neural Networks',v:6,i:4,p:'525–533',doi:'10.1016/S0893-6080(05)80056-5'},
  kingma:{type:'conf',a:[['Kingma','D. P.'],['Ba','J.']],y:2015,t:'Adam: A method for stochastic optimization',conf:'3rd International Conference on Learning Representations (ICLR 2015)',url:'https://arxiv.org/abs/1412.6980'},
  breiman:{type:'article',a:[['Breiman','L.']],y:2001,t:'Random forests',j:'Machine Learning',v:45,i:1,p:'5–32',doi:'10.1023/A:1010933404324'},
  hair:{type:'article',a:[['Hair','J. F.'],['Risher','J. J.'],['Sarstedt','M.'],['Ringle','C. M.']],y:2019,t:'When to use and how to report the results of PLS-SEM',j:'European Business Review',v:31,i:1,p:'2–24',doi:'10.1108/EBR-11-2018-0203'},
  ramsey:{type:'article',a:[['Ramsey','J. B.']],y:1969,t:'Tests for specification errors in classical linear least-squares regression analysis',j:'Journal of the Royal Statistical Society: Series B (Methodological)',v:31,i:2,p:'350–371',doi:'10.1111/j.2517-6161.1969.tb00796.x'},
  sanasoft:{type:'software',a:[['Samsudeen','S. N.'],['Ghazanfar','A. A.']],y:2026,t:'SaNaSoft-ANN: Guided artificial neural network analysis for PLS-SEM latent variable scores'}
};
let CITED=[];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const todayParts=()=>{const d=new Date();return{d:d.getDate(),m:MONTHS[d.getMonth()],mon:MONTHS[d.getMonth()].slice(0,3),y:d.getFullYear()};};
const noSp=i=>i.replace(/\s+/g,'');
const tc=t=>t.replace(/(^|[\s:–-]+)([a-z])/g,(m,a,b)=>a+b.toUpperCase()).replace(/\b(A|An|The|And|Or|Of|In|On|For|To|By|With)\b(?!:)/g,(w,x,o)=>o===0?w:w.toLowerCase()).replace(/^./,c=>c.toUpperCase());
const lowerAfterColon=t=>t.replace(/:\s+([A-Z])/g,(m,c)=>': '+c.toLowerCase());
function joinA(list,sep,last){return list.length<2?list.join(''):list.slice(0,-1).join(sep)+last+list[list.length-1];}
function authorsFor(r,st){const A=r.a;
  if(st==='apa7'||st==='apa6')return joinA(A.map(([f,i])=>`${f}, ${i}`),', ',A.length===2?', &amp; ':', &amp; ');
  if(st==='harvard'||st==='emerald')return joinA(A.map(([f,i])=>`${f}, ${noSp(i)}`),', ',' and ');
  if(st==='chicago')return joinA(A.map(([f,i],k)=>k===0?`${f}, ${i}`:`${i} ${f}`),', ',A.length===2?', and ':', and ');
  if(st==='ieee')return joinA(A.map(([f,i])=>`${i} ${f}`),', ',A.length===2?' and ':', and ');
  return A.map(([f,i])=>`${f} ${i.replace(/[.\-\s]/g,'')}`).join(', ');}
function cite(key,narr){
  const st=APP.settings.report.style,r=REFS[key];if(!CITED.includes(key))CITED.push(key);const n=CITED.indexOf(key)+1;
  const a=r.a.map(x=>x[0]);const names=a.length===1?a[0]:a.length===2?a[0]+((st==='apa7'||st==='apa6')&&!narr?' &amp; ':' and ')+a[1]:a[0]+' et al.';
  if(st==='ieee')return narr?`${names} [${n}]`:`[${n}]`;
  if(st==='vancouver')return narr?`${names} (${n})`:`(${n})`;
  if(narr)return `${names} (${r.y})`;
  return st==='chicago'?`(${names} ${r.y})`:`(${names}, ${r.y})`;
}
function fmtRef(key){
  const st=APP.settings.report.style,r=REFS[key],A=authorsFor(r,st),Y=r.y,t=todayParts(),v=VERSION,url=SOFTWARE_URL,I=x=>`<i>${x}</i>`;
  const noDot=A.replace(/\.$/,'');
  if(st==='apa7'||st==='apa6'){const doi=st==='apa7'?`https://doi.org/${r.doi}`:`doi:${r.doi}`;
    if(r.type==='article')return `${A} (${Y}). ${r.t}. ${I(r.j+', '+r.v)}(${r.i}), ${r.p}. ${doi}`;
    if(r.type==='conf')return `${A} (${Y}). ${I(r.t)}. Paper presented at the ${r.conf}. ${st==='apa6'?'Retrieved from ':''}${r.url}`;
    return `${A} (${Y}). ${I(r.t)} (Version ${v}) [Computer software]. ${st==='apa6'?'Retrieved from ':''}${url}`;}
  if(st==='harvard'){
    if(r.type==='article')return `${A} (${Y}) ‘${r.t}’, ${I(r.j)}, ${r.v}(${r.i}), pp. ${r.p}. Available at: https://doi.org/${r.doi}.`;
    if(r.type==='conf')return `${A} (${Y}) ‘${r.t}’, ${I(r.conf)}. Available at: ${r.url}.`;
    return `${A} (${Y}) ${I(r.t)} (Version ${v}) [Computer program]. Available at: ${url} (Accessed: ${t.d} ${t.m} ${t.y}).`;}
  if(st==='emerald'){
    if(r.type==='article')return `${A} (${Y}), “${r.t}”, ${I(r.j)}, Vol. ${r.v} No. ${r.i}, pp. ${r.p.replace('–','-')}, doi: ${r.doi}.`;
    if(r.type==='conf')return `${A} (${Y}), “${r.t}”, ${I(r.conf)}, available at: ${r.url}.`;
    return `${A} (${Y}), “${r.t}”, Version ${v}, available at: ${url} (accessed ${t.d} ${t.m} ${t.y}).`;}
  if(st==='chicago'){
    if(r.type==='article')return `${noDot}. ${Y}. “${tc(r.t)}.” ${I(r.j)} ${r.v} (${r.i}): ${r.p}. https://doi.org/${r.doi}.`;
    if(r.type==='conf')return `${noDot}. ${Y}. “${tc(r.t)}.” Paper presented at the ${r.conf}. ${r.url}.`;
    return `${noDot}. ${Y}. ${I(tc(r.t))}. Version ${v}. ${url}.`;}
  if(st==='ieee'){
    if(r.type==='article')return `${A}, “${r.t},” ${I(r.j)}, vol. ${r.v}, no. ${r.i}, pp. ${r.p}, ${Y}, doi: ${r.doi}.`;
    if(r.type==='conf')return `${A}, “${r.t},” in ${I('Proc. '+r.conf)}, ${Y}. [Online]. Available: ${r.url}`;
    return `${A}, ${I(tc(r.t))}, version ${v}. (${Y}). [Online]. Available: ${url}`;}
  if(r.type==='article')return `${A}. ${lowerAfterColon(r.t)}. ${r.j}. ${Y};${r.v}(${r.i}):${r.p.replace('–','-')}. doi:${r.doi}`;
  if(r.type==='conf')return `${A}. ${lowerAfterColon(r.t)}. In: ${r.conf}; ${Y}. Available from: ${r.url}`;
  return `${A}. ${lowerAfterColon(r.t)} [Internet]. Version ${v}. ${Y} [cited ${t.y} ${t.mon} ${t.d}]. Available from: ${url}`;
}
const styleOptions=cur=>REF_STYLES.map(x=>`<option value="${x[0]}" ${cur===x[0]?'selected':''}>${x[1]}</option>`).join('');
function renderStep9(c){
  if(!APP.results){c.innerHTML=`<div class="card"><div class="card-title">📄 Report</div><div class="warn-box">No results yet — run the analysis first (Step 7).</div><div class="btn-group"><button class="btn btn-primary" onclick="goStep(7)">Go to Step 7</button></div></div>`;return;}
  const rp=APP.settings.report;
  c.innerHTML=`
  <div class="card">
    <div class="card-title">📄 Step 9: Publication-Ready Report</div>
    <div class="card-subtitle">Method and results text with formatted tables and a verified reference list</div>
    <div class="row-3">
      <div class="form-group"><label class="field-label">Citation style</label><select onchange="APP.settings.report.style=this.value;generateReport()">${styleOptions(rp.style)}</select></div>
      <div class="form-group"><label class="field-label">Study context (optional)</label><input type="text" value="${esc(rp.context)}" placeholder="e.g., mobile banking adoption in Sri Lanka" onchange="APP.settings.report.context=this.value;generateReport()"></div>
      <div class="form-group"><label class="field-label">First table number</label><input type="number" min="1" value="${rp.tableStart}" onchange="APP.settings.report.tableStart=Math.max(1,Math.round(+this.value));generateReport()"></div>
    </div>
    <div class="inline-flex" style="margin-bottom:14px">
      <button class="btn btn-primary" onclick="downloadDoc()">⬇ Download Word (.doc)</button>
      <button class="btn btn-outline" onclick="copyReport()">📋 Copy formatted</button>
      <button class="btn btn-outline" onclick="downloadHTML()">⬇ Download HTML</button>
      <button class="btn btn-outline" onclick="window.print()">🖨 Print / PDF</button>
    </div>
    <div class="hint-box">Edit freely — the text is a starting point. Numbers are taken directly from your results; check that the interpretation fits your theory. Values in brackets <strong>[ ]</strong> need your input.</div>
    <div id="report-output"></div>
  </div>
  <div class="btn-group"><button class="btn btn-outline" onclick="prev()">← Back to Results</button></div>`;
  generateReport();
}
function aptable(num,title,head,rows,note){
  return `<p class="tcap">Table ${num}</p><p class="ttitle">${title}</p><table><thead>${head}</thead><tbody>${rows}</tbody></table>${note?`<p class="tnote"><i>Note.</i> ${note}</p>`:''}`;
}
function buildReportHTML(forDoc){
  CITED=[];const R=APP.results,S=R.settings,RP=APP.settings.report,st=RP.style,ctx=RP.context;let tn=RP.tableStart;
  const M=R.models,K=S.networks;const numW=['zero','one','two','three','four','five','six','seven','eight','nine','ten'];const w=n=>n<=10?numW[n]:String(n);
  const alg={ffbp:()=>`the feed-forward back-propagation (FFBP) algorithm ${cite('rumelhart')}, implemented as ${S.type==='batch'?'batch':S.type==='minibatch'?'mini-batch':'online'} gradient descent with a learning rate of ${S.lr} and momentum of ${S.momentum}`,scg:()=>`the scaled conjugate gradient algorithm ${cite('moller')}`,adam:()=>`the Adam optimiser ${cite('kingma')}`}[S.algorithm];
  const actN={sigmoid:'sigmoid',tanh:'hyperbolic tangent',relu:'ReLU',identity:'identity'};
  const arrows=maxArrows(),nMin=Math.min(...M.map(m=>m.nTotal));
  const modelList=M.map(m=>`${m.name} (output: ${esc(m.dep)}; inputs: ${m.groups.map(esc).join(', ')})`).join(M.length>2?'; ':' and ');
  let h=`<h1>Artificial Neural Network Analysis</h1><h2>Method</h2>`;
  h+=`<p>To complement the PLS-SEM results and to capture non-linear and non-compensatory relationships, an artificial neural network (ANN) analysis was performed following the guidelines of ${cite('leong',true)}${ctx?` in the context of ${esc(ctx)}`:''}. The significant predictors from the PLS-SEM analysis were used as input neurons and the corresponding endogenous constructs as output neurons, resulting in ${w(M.length)} ANN model${M.length>1?'s':''}: ${modelList}. The sample of ${nMin} usable responses ${nMin>=50*arrows?'satisfies':'is below'} the recommended minimum of 50 times the maximum number of arrows pointing at an endogenous construct (50 × ${arrows} = ${50*arrows}) ${cite('leong')}.</p>`;
  const units=M.map(m=>`${m.units.join('–')} for ${m.name}`).join(', ');
  h+=`<p>Each model was a multilayer perceptron with ${w(S.hiddenLayers)} hidden layer${S.hiddenLayers>1?'s':''}${S.hiddenLayers===2?' to obtain a deep-learning analysis':''}, using the ${actN[S.hAct]} activation function in the hidden layer${S.hiddenLayers>1?'s':''} and the ${actN[S.oAct]} activation function in the output layer ${cite('leong')}. The number of hidden neurons was ${S.autoUnits?`generated automatically (smallest network whose mean testing error was within 2% of the best candidate), yielding ${units}`:`set to ${units}`}. The networks were trained with ${alg()}. ${S.scheme==='kfold'?`To prevent over-fitting, a ${w(K)}-fold cross-validation was applied, so that each of the ${w(K)} networks used ${f(100-100/K,0)}% of the data for training and ${f(100/K,0)}% for testing`:`${w(K)} networks were trained, each on a random split of ${S.training}% training and ${S.test}% testing cases`}${S.holdout?`, after setting aside a holdout sample of ${S.holdout}%`:''}. Covariates were ${S.covRescale==='none'?'not rescaled':S.covRescale==='standardized'?'standardized':S.covRescale==='normalized'?'normalized to 0–1':'rescaled to −1 to 1'} and the output variable was ${M[0].dv.mode==='normalized'?'normalized to the 0–1 range':M[0].dv.mode==='adjnormalized'?'rescaled to the −1 to 1 range':M[0].dv.mode==='standardized'?'standardized':'not rescaled'}. Training stopped when the testing error had not decreased for ${S.patience} consecutive epochs (after at least ${S.minEpochs} epochs; maximum ${S.maxEpochs}), and the weights with the lowest testing error were retained. Model fit was assessed with the root mean square error (RMSE) of the training and testing samples, and the relative importance of the predictors was obtained from a sensitivity analysis ${cite('leong')} based on permutation importance ${cite('breiman')}. All analyses were conducted in SaNaSoft-ANN ${cite('sanasoft')} with random seed ${S.seed}.</p>`;
  h+=`<h2>Results</h2>`;
  M.forEach(rm=>{
    const s=rm.summary,g=rm.groups,ord=rankOrder(s.normImportance);
    h+=`<h3>${esc(rm.name)}: ${esc(rm.dep)}</h3>`;
    const tR=tn++;
    h+=`<p>Table ${tR} reports the RMSE values of the ${w(rm.nets.length)} networks for ${esc(rm.name)}. The mean RMSE values were ${f0(s.meanRmseTrain,4)} for training (<i>SD</i> = ${f0(s.sdRmseTrain,4)}) and ${f0(s.meanRmseTest,4)} for testing (<i>SD</i> = ${f0(s.sdRmseTest,4)}). ${s.meanRmseTest/(s.meanRmseTrain||1)<1.25?'These small and similar values indicate that the model fits the data well and predicts with high accuracy without over-fitting':'The testing error is somewhat larger than the training error, suggesting a degree of over-fitting'} ${cite('leong')}. The ANN explained ${f(s.r2Pred*100,1)}% of the variance in ${esc(rm.dep)} in out-of-sample prediction (predictive <i>R</i>² = ${f0(s.r2Pred,3)})${s.r2Leong!==null?`; applying the formula of ${cite('leong',true)}, <i>R</i>² = ${f0(s.r2Leong,3)}`:''}${rm.spec.plsR2?`, compared with a PLS-SEM <i>R</i>² of ${f0(+rm.spec.plsR2,3)}`:''}.</p>`;
    h+=aptable(tR,`RMSE Values of the Artificial Neural Networks (${esc(rm.name)}; Output: ${esc(rm.dep)})`,
      `<tr><th rowspan="2">Network</th><th colspan="3">Training</th><th colspan="3">Testing</th></tr><tr><th><i>N</i></th><th>SSE</th><th>RMSE</th><th><i>N</i></th><th>SSE</th><th>RMSE</th></tr>`,
      rm.nets.map(n=>`<tr><td>ANN${n.k}</td><td>${n.nTrain}</td><td>${f(n.sseTrain,3)}</td><td>${f0(n.rmseTrain,4)}</td><td>${n.nTest}</td><td>${f(n.sseTest,3)}</td><td>${f0(n.rmseTest,4)}</td></tr>`).join('')+
      `<tr><td>Mean</td><td></td><td>${f(s.meanSseTrain,3)}</td><td>${f0(s.meanRmseTrain,4)}</td><td></td><td>${f(s.meanSseTest,3)}</td><td>${f0(s.meanRmseTest,4)}</td></tr><tr><td><i>SD</i></td><td></td><td></td><td>${f0(s.sdRmseTrain,4)}</td><td></td><td></td><td>${f0(s.sdRmseTest,4)}</td></tr>`,
      `SSE = sum of squared errors; RMSE = root mean square error = √(SSE/<i>N</i>). Values are based on the ${rm.dv.mode==='normalized'?'normalized (0–1)':'rescaled'} output variable. Architecture: ${rm.sizes.join('–')} (inputs–hidden–output).`);
    const tS=tn++;
    h+=`<p>The sensitivity analysis (Table ${tS}) shows that ${esc(g[ord[0]])} is the most important predictor of ${esc(rm.dep)} (normalized importance = 100%)`+(ord.length>1?`, followed by ${ord.slice(1).map(i=>`${esc(g[i])} (${f(s.normImportance[i],1)}%)`).join(ord.length>3?', ':' and ').replace(/, ([^,]*)$/,', and $1')}`:'')+`. Normalized importance was computed by dividing each predictor's average relative importance across the ${w(rm.nets.length)} networks by the highest average relative importance ${cite('leong')}.</p>`;
    h+=aptable(tS,`Sensitivity Analysis (${esc(rm.name)}; Output: ${esc(rm.dep)})`,
      `<tr><th>Network</th>${g.map(x=>`<th>${esc(x)}</th>`).join('')}</tr>`,
      rm.nets.map(n=>`<tr><td>ANN${n.k}</td>${n.importance.map(v=>`<td>${f0(v,3)}</td>`).join('')}</tr>`).join('')+
      `<tr><td>Average relative importance</td>${s.avgImportance.map(v=>`<td>${f0(v,3)}</td>`).join('')}</tr><tr><td>Normalized relative importance (%)</td>${s.normImportance.map(v=>`<td>${f(v,1)}</td>`).join('')}</tr>`,
      `Relative importance values of each network sum to 1.`);
    if(hasPls(rm)){const rows=compRows(rm);const tC=tn++;const nm=rows.filter(r=>r.match===false);
      h+=`<p>Table ${tC} compares the PLS-SEM and ANN rankings. ${nm.length?`The rankings differ for ${nm.map(r=>esc(r.name)).join(', ')}, which can be attributed to the ANN's ability to capture non-linear and non-compensatory relationships that the linear PLS-SEM model cannot detect ${cite('leong')}. [Discuss the theoretical meaning of these differences.]`:'The ANN ranking matches the PLS-SEM ranking, confirming the robustness of the PLS-SEM findings.'}</p>`;
      h+=aptable(tC,`Comparison Between PLS-SEM and ANN Results (${esc(rm.name)})`,
        `<tr><th>Predictor</th><th>PLS-SEM path coefficient</th><th>Ranking (PLS-SEM)</th><th>ANN normalized importance (%)</th><th>Ranking (ANN)</th><th>Remark</th></tr>`,
        rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${r.beta===null?'–':f0(r.beta,3)}</td><td>${r.pRank??'–'}</td><td>${f(r.imp,1)}</td><td>${r.aRank}</td><td>${r.match===null?'–':r.match?'Matched':'Not matched'}</td></tr>`).join(''),
        'PLS-SEM rankings are based on the absolute value of the path coefficients.');}
    const ex=rm.extra;
    if(ex&&S.output.descriptives&&ex.reset)h+=`<p>A Ramsey RESET test ${cite('ramsey')} on the linear specification of ${esc(rm.name)} ${ex.reset.p<.05?'indicated significant non-linearity':'did not indicate significant non-linearity'}, <i>F</i>(${ex.reset.df1}, ${ex.reset.df2}) = ${f(ex.reset.F,2)}, <i>p</i> ${fmtP(ex.reset.p)}.${ex.vif?` All VIF values were ${ex.vif.every(v=>v.vif<3)?'below 3':'computed'} (maximum = ${f(Math.max(...ex.vif.map(v=>v.vif)),2)}), ${ex.vif.every(v=>v.vif<3)?'indicating no multicollinearity concern':'and values of 3 or more indicate possible multicollinearity'} ${cite('hair')}.`:''}${ex.linPredR2!==null&&S.output.benchmark?` On the same data splits, the ANN achieved a predictive <i>R</i>² of ${f0(s.r2Pred,3)} versus ${f0(ex.linPredR2,3)} for a linear regression model.`:''}</p>`;
    h+=forDoc?`<p><i>[Insert Figure: ANN diagram of ${esc(rm.name)} — download it from Results → Network Diagram.]</i></p>`:`<p class="tcap">Figure</p><p class="ttitle">ANN Diagram of ${esc(rm.name)} (Network ${rm.nets[0].k})</p><div style="overflow-x:auto">${diagramSVG(rm,rm.nets[0])}</div>`;
  });
  const keys=(st==='vancouver'||st==='ieee')?CITED.slice():CITED.slice().sort((a,b)=>REFS[a].a[0][0].localeCompare(REFS[b].a[0][0]));
  h+=`<h2>References</h2><div class="refs">${keys.map((k,i)=>`<p>${st==='vancouver'?(i+1)+'. ':st==='ieee'?'['+(i+1)+'] ':''}${fmtRef(k)}</p>`).join('')}</div>`;
  return h;
}
function generateReport(){const el=$('report-output');if(!el||!APP.results)return;el.innerHTML=buildReportHTML(false);}
const DOC_CSS=`body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.6}h1{font-size:14pt;text-align:center}h2{font-size:12pt}h3{font-size:12pt;font-style:italic}p{margin:0 0 8pt;text-align:justify}table{border-collapse:collapse;font-size:10pt;margin:4pt 0}th,td{padding:2pt 7pt;text-align:center;border:none}thead tr:first-child th{border-top:1.5pt solid #000}thead tr:last-child th{border-bottom:.75pt solid #000}tbody tr:last-child td{border-bottom:1.5pt solid #000}td:first-child,th:first-child{text-align:left}.tcap{font-weight:bold;margin:12pt 0 0}.ttitle{font-style:italic}.tnote{font-size:10pt}.refs p{margin-left:.5in;text-indent:-.5in;text-align:left}`;
function downloadDoc(){const body=buildReportHTML(true);
  download('SaNaSoft-ANN_report.doc',`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>ANN Report</title><style>${DOC_CSS}</style></head><body>${body}</body></html>`,'application/msword');}
function downloadHTML(){download('SaNaSoft-ANN_report.html',`<!DOCTYPE html><html><head><meta charset="utf-8"><title>ANN Report</title><style>${DOC_CSS}body{max-width:820px;margin:40px auto}</style></head><body>${buildReportHTML(false)}</body></html>`,'text/html');}
async function copyReport(){const html=buildReportHTML(true);const tmp=document.createElement('div');tmp.innerHTML=html;
  try{await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([`<style>${DOC_CSS}</style>`+html],{type:'text/html'}),'text/plain':new Blob([tmp.innerText],{type:'text/plain'})})]);toast('Report copied — paste into Word to keep the formatting');}
  catch(e){const el=$('report-output');const r=document.createRange();r.selectNodeContents(el);const sel=getSelection();sel.removeAllRanges();sel.addRange(r);document.execCommand('copy');sel.removeAllRanges();toast('Report copied');}}

// ───────────────────────── PROJECT SAVE / LOAD ─────────────────────────
function saveProject(){
  if(!APP.data){toast('Nothing to save yet — import data first.','err');return;}
  const proj={app:'SaNaSoft-ANN',version:VERSION,saved:new Date().toISOString(),data:{rows:APP.data.rows,headers:APP.data.headers,fileName:APP.data.fileName},models:APP.models,settings:APP.settings,maxArrows:APP.maxArrows};
  download((APP.data.fileName.replace(/\.[^.]+$/,'').replace(/[^\w-]+/g,'_')||'project')+'.sanaann.json',JSON.stringify(proj),'application/json');
  toast('Project saved (data, models and settings). Re-running with the same seed reproduces the results exactly.');
}
function loadProject(file){
  if(!file)return;const rd=new FileReader();
  rd.onload=()=>{try{const p=JSON.parse(rd.result);if(p.app!=='SaNaSoft-ANN')throw new Error('Not a SaNaSoft-ANN project file');
    setData(p.data.rows,p.data.headers,p.data.fileName);APP.models=p.models;APP.active=0;APP.maxArrows=p.maxArrows||'';
    const d=DEFAULT_SETTINGS();APP.settings=Object.assign(d,p.settings,{output:Object.assign(d.output,p.settings.output||{}),report:Object.assign(d.report,p.settings.report||{})});
    APP.results=null;toast('Project loaded');goStep(7);}catch(e){toast('Could not open project: '+e.message,'err');}};
  rd.readAsText(file);
}

// ───────────────────────── INIT ─────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  goStep(0);
  if(typeof Papa==='undefined'||typeof XLSX==='undefined'||typeof Chart==='undefined')
    setTimeout(()=>toast('Some libraries could not load (offline?). CSV/Excel import or charts may be unavailable.','err'),800);
});
