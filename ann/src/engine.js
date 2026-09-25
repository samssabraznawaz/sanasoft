// ═══════════════════════════════════════════════════════════════════
// SaNaSoft-ANN ENGINE v2 — pure JavaScript multilayer perceptron
// Float64 precision, seeded & reproducible, runs inside a Web Worker.
// Algorithms: FFBP (gradient descent + momentum), SCG (Møller, 1993), Adam.
// ═══════════════════════════════════════════════════════════════════
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const ACT_CODE={sigmoid:0,tanh:1,relu:2,identity:3,linear:3};
function sig(z){if(z>=0){return 1/(1+Math.exp(-z));}const e=Math.exp(z);return e/(1+e);}
function actF(c,z){return c===0?sig(z):c===1?Math.tanh(z):c===2?(z>0?z:0):z;}
function actD(c,a){return c===0?a*(1-a):c===1?1-a*a:c===2?(a>0?1:0):1;}

function Net(sizes,hAct,oAct){
  this.sizes=sizes.slice();this.L=sizes.length-1;
  this.hCode=ACT_CODE[hAct]??0;this.oCode=ACT_CODE[oAct]??0;
  this.off=[];let o=0;
  for(let l=0;l<this.L;l++){this.off.push(o);o+=(sizes[l]+1)*sizes[l+1];}
  this.nParams=o;
  this.isBias=new Uint8Array(o);
  for(let l=0;l<this.L;l++){const nIn=sizes[l],st=nIn+1;for(let j=0;j<sizes[l+1];j++)this.isBias[this.off[l]+j*st+nIn]=1;}
  this.A=[];this.D=[];
  for(let l=0;l<=this.L;l++){this.A.push(new Float64Array(sizes[l]));this.D.push(new Float64Array(sizes[l]));}
}
Net.prototype.init=function(rng,center,offset){
  const t=new Float64Array(this.nParams);
  for(let i=0;i<t.length;i++)t[i]=center+(2*rng()-1)*offset;
  return t;
};
Net.prototype.forward=function(th,X,r){
  const s=this.sizes,L=this.L,A=this.A,p=s[0],a0=A[0],base=r*p;
  for(let i=0;i<p;i++)a0[i]=X[base+i];
  for(let l=0;l<L;l++){
    const nIn=s[l],nOut=s[l+1],ain=A[l],aout=A[l+1],off=this.off[l],st=nIn+1;
    const c=(l===L-1)?this.oCode:this.hCode;
    for(let j=0;j<nOut;j++){
      const o=off+j*st;let z=th[o+nIn];
      for(let i=0;i<nIn;i++)z+=th[o+i]*ain[i];
      aout[j]=c===0?sig(z):c===1?Math.tanh(z):c===2?(z>0?z:0):z;
    }
  }
  return A[L][0];
};
Net.prototype.backward=function(th,g,err){
  const s=this.sizes,L=this.L,A=this.A,D=this.D;
  D[L][0]=err*actD(this.oCode,A[L][0]);
  for(let l=L-1;l>=0;l--){
    const nIn=s[l],nOut=s[l+1],ain=A[l],dout=D[l+1],off=this.off[l],st=nIn+1;
    if(l>0){
      const din=D[l];for(let i=0;i<nIn;i++)din[i]=0;
      for(let j=0;j<nOut;j++){const dj=dout[j];const o=off+j*st;
        for(let i=0;i<nIn;i++){g[o+i]+=dj*ain[i];din[i]+=dj*th[o+i];}
        g[o+nIn]+=dj;}
      const hc=this.hCode;for(let i=0;i<nIn;i++)din[i]*=actD(hc,ain[i]);
    }else{
      for(let j=0;j<nOut;j++){const dj=dout[j];const o=off+j*st;
        for(let i=0;i<nIn;i++)g[o+i]+=dj*ain[i];
        g[o+nIn]+=dj;}
    }
  }
};
// E = ½·SSE/m + ½·λ·Σw²   (biases not penalised)
Net.prototype.lossGrad=function(th,X,Y,idx,from,to,g,l2){
  g.fill(0);let sse=0;const m=to-from;
  for(let k=from;k<to;k++){const r=idx?idx[k]:k;const e=this.forward(th,X,r)-Y[r];sse+=e*e;this.backward(th,g,e);}
  const sc=1/m;for(let i=0;i<g.length;i++)g[i]*=sc;
  let E=0.5*sse/m;
  if(l2>0){const ib=this.isBias;let w2=0;for(let i=0;i<g.length;i++)if(!ib[i]){g[i]+=l2*th[i];w2+=th[i]*th[i];}E+=0.5*l2*w2;}
  return E;
};
Net.prototype.loss=function(th,X,Y,n,l2){
  let sse=0;for(let r=0;r<n;r++){const e=this.forward(th,X,r)-Y[r];sse+=e*e;}
  let E=0.5*sse/n;
  if(l2>0){const ib=this.isBias;let w2=0;for(let i=0;i<th.length;i++)if(!ib[i])w2+=th[i]*th[i];E+=0.5*l2*w2;}
  return E;
};
Net.prototype.sse=function(th,X,Y,n){let s=0;for(let r=0;r<n;r++){const e=this.forward(th,X,r)-Y[r];s+=e*e;}return s;};
Net.prototype.predict=function(th,X,n){const o=new Float64Array(n);for(let r=0;r<n;r++)o[r]=this.forward(th,X,r);return o;};

function dot(a,b){let s=0;for(let i=0;i<a.length;i++)s+=a[i]*b[i];return s;}

// ───────────────────────── TRAINING ─────────────────────────
// d = {Xtr,Ytr,ntr,Xte,Yte,nte}; early stopping monitors the TESTING sample (as SPSS does).
function trainNet(net,d,cfg,rng){
  const t0=Date.now();
  let th=net.init(rng,cfg.initCenter,cfg.initOffset);
  const P=net.nParams,g=new Float64Array(P);
  const hasTe=d.nte>0;
  const histTr=[],histTe=[];
  let best=Infinity,bestTh=th.slice(),bestEp=0,noImp=0,stop='Maximum number of epochs reached',ep=0;
  const monitor=()=>{
    const mTr=net.sse(th,d.Xtr,d.Ytr,d.ntr)/d.ntr;
    const mTe=hasTe?net.sse(th,d.Xte,d.Yte,d.nte)/d.nte:mTr;
    histTr.push(mTr);histTe.push(mTe);
    if(mTe<best-1e-12){best=mTe;bestTh.set(th);bestEp=ep;noImp=0;}else noImp++;
    if(noImp>=cfg.patience&&ep>=(cfg.minEpochs||0)){stop=`${cfg.patience} consecutive epoch(s) with no decrease in error${hasTe?' (testing sample)':''}`;return true;}
    const w=50;const L=histTr.length;
    if(cfg.minRelChange>0&&L>Math.max(2*w,cfg.minEpochs||0)){const a=histTr[L-1-w],b=histTr[L-1];if(a>0&&(a-b)/a<cfg.minRelChange){stop='Relative change in training error criterion';return true;}}
    if(Date.now()-t0>cfg.maxTimeMs){stop='Maximum training time exceeded';return true;}
    return false;
  };
  const alg=cfg.algorithm;
  if(alg==='scg'){
    // Møller (1993) scaled conjugate gradient — batch only
    const s=new Float64Array(P),p=new Float64Array(P),r=new Float64Array(P),rOld=new Float64Array(P),wN=new Float64Array(P),g2=new Float64Array(P);
    let E=net.lossGrad(th,d.Xtr,d.Ytr,null,0,d.ntr,g,cfg.l2);
    for(let i=0;i<P;i++){p[i]=-g[i];r[i]=-g[i];}
    let lambda=cfg.scgLambda,lambdaBar=0,success=true,delta=0;const sigma0=cfg.scgSigma;
    for(ep=1;ep<=cfg.maxEpochs;ep++){
      const pn2=dot(p,p);
      if(pn2<1e-30){stop='Error gradient vanished (converged)';monitor();break;}
      if(success){
        const sg=sigma0/Math.sqrt(pn2);
        for(let i=0;i<P;i++)wN[i]=th[i]+sg*p[i];
        net.lossGrad(wN,d.Xtr,d.Ytr,null,0,d.ntr,g2,cfg.l2);
        for(let i=0;i<P;i++)s[i]=(g2[i]-g[i])/sg;
        delta=dot(p,s);
      }
      delta+=(lambda-lambdaBar)*pn2;
      if(delta<=0){lambdaBar=2*(lambda-delta/pn2);delta=-delta+lambda*pn2;lambda=lambdaBar;}
      const mu=dot(p,r),alpha=mu/delta;
      for(let i=0;i<P;i++)wN[i]=th[i]+alpha*p[i];
      const En=net.loss(wN,d.Xtr,d.Ytr,d.ntr,cfg.l2);
      const Delta=2*delta*(E-En)/(mu*mu);
      if(Delta>=0){
        th.set(wN);E=En;rOld.set(r);
        E=net.lossGrad(th,d.Xtr,d.Ytr,null,0,d.ntr,g,cfg.l2);
        for(let i=0;i<P;i++)r[i]=-g[i];
        lambdaBar=0;success=true;
        if(ep%P===0){p.set(r);}else{const beta=(dot(r,r)-dot(r,rOld))/mu;for(let i=0;i<P;i++)p[i]=r[i]+beta*p[i];}
        if(Delta>=0.75)lambda=Math.max(lambda/4,1e-15);
      }else{lambdaBar=lambda;success=false;}
      if(Delta<0.25)lambda=Math.min(lambda+delta*(1-Delta)/pn2,1e100);
      if(monitor())break;
    }
  }else{
    const n=d.ntr;
    const bs=cfg.type==='online'?1:cfg.type==='minibatch'?Math.max(1,Math.min(cfg.batchSize,n)):n;
    const idx=new Int32Array(n);for(let i=0;i<n;i++)idx[i]=i;
    const v=new Float64Array(P);
    const m1=new Float64Array(P),m2=new Float64Array(P);let tAdam=0;
    const b1=0.9,b2=0.999,eps=1e-8;
    for(ep=1;ep<=cfg.maxEpochs;ep++){
      if(bs<n){for(let i=n-1;i>0;i--){const j=Math.floor(rng()*(i+1));const tmp=idx[i];idx[i]=idx[j];idx[j]=tmp;}}
      // SPSS-style learning-rate reduction for online / mini-batch training
      let lr=alg==='adam'?cfg.adamLr:cfg.lr;
      if(alg!=='adam'&&bs<n&&cfg.lrReductionEpochs>0&&cfg.lrLower<lr){lr=Math.max(cfg.lrLower,lr*Math.pow(cfg.lrLower/lr,Math.min(1,(ep-1)/cfg.lrReductionEpochs)));}
      for(let b=0;b<n;b+=bs){
        const e=Math.min(n,b+bs);
        net.lossGrad(th,d.Xtr,d.Ytr,bs<n?idx:null,b,e,g,cfg.l2);
        if(alg==='adam'){
          tAdam++;const c1=1-Math.pow(b1,tAdam),c2=1-Math.pow(b2,tAdam);
          for(let i=0;i<P;i++){m1[i]=b1*m1[i]+(1-b1)*g[i];m2[i]=b2*m2[i]+(1-b2)*g[i]*g[i];th[i]-=lr*(m1[i]/c1)/(Math.sqrt(m2[i]/c2)+eps);}
        }else{
          const mom=cfg.momentum;
          for(let i=0;i<P;i++){v[i]=mom*v[i]-lr*g[i];th[i]+=v[i];}
        }
      }
      if(monitor())break;
    }
  }
  if(ep>cfg.maxEpochs)ep=cfg.maxEpochs;
  return {theta:bestTh,bestEpoch:bestEp,epochs:Math.min(ep,cfg.maxEpochs),stopReason:stop,ms:Date.now()-t0,histTr,histTe};
}

// ───────────────── PERMUTATION SENSITIVITY ANALYSIS ─────────────────
// Importance of each input variable (dummy groups are permuted jointly, like SPSS
// treats a factor as one predictor). Raw ΔSSE → importance summing to 1.
function sensitivity(net,th,X,Y,n,p,groups,repeats,rng){
  const base=net.sse(th,X,Y,n);
  const Xp=X.slice();const perm=new Int32Array(n);const raw=[];
  for(const grp of groups){
    let acc=0;
    for(let rep=0;rep<repeats;rep++){
      for(let i=0;i<n;i++)perm[i]=i;
      for(let i=n-1;i>0;i--){const j=Math.floor(rng()*(i+1));const t=perm[i];perm[i]=perm[j];perm[j]=t;}
      for(let r=0;r<n;r++){const src=perm[r]*p,dst=r*p;for(const c of grp.cols)Xp[dst+c]=X[src+c];}
      acc+=net.sse(th,Xp,Y,n)-base;
    }
    for(let r=0;r<n;r++){const b=r*p;for(const c of grp.cols)Xp[b+c]=X[b+c];}
    raw.push(Math.max(0,acc/repeats));
  }
  const tot=raw.reduce((a,b)=>a+b,0);
  const imp=raw.map(v=>tot>0?v/tot:1/raw.length);
  const mx=Math.max(...imp)||1;
  return {raw,importance:imp,normalized:imp.map(v=>v/mx*100),baseSSE:base};
}

// ───────────────────────── HELPERS ─────────────────────────
function mean(a){let s=0;for(const v of a)s+=v;return a.length?s/a.length:0;}
function sd(a){if(a.length<2)return 0;const m=mean(a);let s=0;for(const v of a)s+=(v-m)*(v-m);return Math.sqrt(s/(a.length-1));}
function sst(Y,n){let m=0;for(let i=0;i<n;i++)m+=Y[i];m/=n;let s=0;for(let i=0;i<n;i++)s+=(Y[i]-m)*(Y[i]-m);return s;}
function shuffled(arr,rng){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}
function subset(X,Y,p,rows){
  const n=rows.length,Xs=new Float64Array(n*p),Ys=new Float64Array(n);
  for(let k=0;k<n;k++){const r=rows[k];Ys[k]=Y[r];for(let c=0;c<p;c++)Xs[k*p+c]=X[r*p+c];}
  return {X:Xs,Y:Ys,n};
}
function downsample(a,maxPts){if(a.length<=maxPts)return a.map(v=>+v.toPrecision(6));const out=[];const step=a.length/maxPts;for(let i=0;i<maxPts;i++)out.push(+a[Math.floor(i*step)].toPrecision(6));out.push(+a[a.length-1].toPrecision(6));return out;}

// Rescale covariates and the dependent variable using the analysis sample (non-holdout cases)
function rescale(model,S,analysisRows){
  const {p,n}=model;const X=Float64Array.from(model.X),Y=Float64Array.from(model.Y);
  const colInfo=[];
  for(let c=0;c<p;c++){
    const meta=model.cols[c];
    if(meta.kind!=='cov'||S.covRescale==='none'){colInfo.push({type:'none'});continue;}
    let mn=Infinity,mx=-Infinity,m=0;
    for(const r of analysisRows){const v=X[r*p+c];if(v<mn)mn=v;if(v>mx)mx=v;m+=v;}
    m/=analysisRows.length;let s2=0;for(const r of analysisRows){const v=X[r*p+c];s2+=(v-m)*(v-m);}
    const s=Math.sqrt(s2/Math.max(1,analysisRows.length-1))||1;
    let a=0,b=1;
    if(S.covRescale==='standardized'){a=m;b=s;}
    else if(S.covRescale==='normalized'){a=mn;b=(mx-mn)||1;}
    else if(S.covRescale==='adjnormalized'){a=(mx+mn)/2;b=((mx-mn)/2)||1;}
    for(let r=0;r<n;r++)X[r*p+c]=(X[r*p+c]-a)/b;
    colInfo.push({type:S.covRescale,a,b,mean:m,sd:s,min:mn,max:mx});
  }
  // Dependent: sigmoid output ⇒ normalized [0,1] (SPSS enforces this); tanh ⇒ adjusted normalized [-1,1]
  let dvMode=S.dvRescale;
  if(S.oAct==='sigmoid')dvMode='normalized';
  if(S.oAct==='tanh')dvMode='adjnormalized';
  let mn=Infinity,mx=-Infinity,m=0;
  for(const r of analysisRows){const v=Y[r];if(v<mn)mn=v;if(v>mx)mx=v;m+=v;}
  m/=analysisRows.length;let s2=0;for(const r of analysisRows)s2+=(Y[r]-m)**2;const s=Math.sqrt(s2/Math.max(1,analysisRows.length-1))||1;
  let a=0,b=1;
  if(dvMode==='normalized'){a=mn;b=(mx-mn)||1;}
  else if(dvMode==='adjnormalized'){a=(mx+mn)/2;b=((mx-mn)/2)||1;}
  else if(dvMode==='standardized'){a=m;b=s;}
  for(let r=0;r<n;r++)Y[r]=(Y[r]-a)/b;
  return {X,Y,colInfo,dv:{mode:dvMode,a,b,mean:m,sd:s,min:mn,max:mx}};
}

function makeSplits(n,S,rng){
  const all=shuffled(Array.from({length:n},(_,i)=>i),rng);
  const nH=Math.round(n*(S.holdout||0)/100);
  const hold=all.slice(0,nH),ana=all.slice(nH);
  const K=S.networks;const splits=[];
  if(S.scheme==='kfold'){
    const nA=ana.length;
    for(let k=0;k<K;k++){
      const s=Math.floor(k*nA/K),e=Math.floor((k+1)*nA/K);
      splits.push({train:ana.slice(0,s).concat(ana.slice(e)),test:ana.slice(s,e)});
    }
  }else{
    const trShare=S.training/(S.training+S.test);
    for(let k=0;k<K;k++){
      const sh=shuffled(ana,rng);const nTr=Math.max(2,Math.min(sh.length-1,Math.round(sh.length*trShare)));
      splits.push({train:sh.slice(0,nTr),test:sh.slice(nTr)});
    }
  }
  return {hold,ana,splits};
}

function trainCfg(S,overrides){
  return Object.assign({
    algorithm:S.algorithm,type:S.algorithm==='scg'?'batch':S.type,batchSize:S.batchSize,
    lr:S.lr,momentum:S.momentum,lrLower:S.lrLower,lrReductionEpochs:S.lrReductionEpochs,adamLr:S.adamLr,
    scgLambda:S.scgLambda,scgSigma:S.scgSigma,maxEpochs:S.maxEpochs,patience:S.patience,
    minRelChange:S.minRelChange,minEpochs:S.minEpochs,maxTimeMs:S.maxTimeMin*60000,l2:S.l2,
    initCenter:S.initCenter??0,initOffset:S.initOffset??0.5
  },overrides||{});
}

// Automatic selection of hidden-unit counts: small grid search, evaluated by
// mean testing MSE on the first three data splits (quick training).
async function autoArchitecture(model,R,sp,S,hooks,label,mi){
  const p=model.p,cands=[];
  const maxH1=Math.max(2,Math.min(S.autoMax||8,2*model.groups.length+2));
  const h1s=[1,2,3,4,5,6,8,10,12].filter(h=>h<=maxH1);
  if(S.hiddenLayers===1){h1s.forEach(h=>cands.push([h]));}
  else{for(const h1 of h1s)for(let h2=1;h2<=Math.min(h1,S.autoMax2||4);h2++)cands.push([h1,h2]);}
  const folds=sp.splits.slice(0,Math.min(2,sp.splits.length));
  const cfg=trainCfg(S,{maxEpochs:Math.min(S.maxEpochs,400),patience:30,minEpochs:Math.min(S.minEpochs||0,100),maxTimeMs:15000});
  const grid=[];
  for(let ci=0;ci<cands.length;ci++){
    const hs=cands[ci];let acc=0;
    for(let f=0;f<folds.length;f++){
      const tr=subset(R.X,R.Y,p,folds[f].train),te=subset(R.X,R.Y,p,folds[f].test);
      const net=new Net([p,...hs,1],S.hAct,S.oAct);
      const res=trainNet(net,{Xtr:tr.X,Ytr:tr.Y,ntr:tr.n,Xte:te.X,Yte:te.Y,nte:te.n},cfg,mulberry32(S.seed*31+ci*7+f));
      acc+=net.sse(res.theta,te.X,te.Y,te.n)/te.n;
    }
    grid.push({units:hs,testMSE:acc/folds.length,params:new Net([p,...hs,1],S.hAct,S.oAct).nParams});
    if(hooks.progress)hooks.progress({phase:'arch',msg:`${label}: evaluating hidden-unit configuration ${hs.join('–')} (${ci+1}/${cands.length})`,frac:(ci+1)/cands.length,model:mi});
    await hooks.tick();
  }
  // parsimony: smallest network whose testing error is within 2% of the best
  const bestV=Math.min(...grid.map(g=>g.testMSE));
  const ok=grid.filter(g=>g.testMSE<=bestV*1.02).sort((a,b)=>a.params-b.params);
  return {units:ok[0].units,grid,criterion:'smallest network within 2% of the lowest mean testing MSE'};
}

// ───────────────────────── MAIN JOB ─────────────────────────
async function runJob(job,hooks){
  hooks=hooks||{};hooks.tick=hooks.tick||(()=>Promise.resolve());
  const S=job.settings;const out={models:[],engine:'SaNaSoft-ANN engine v2 (JavaScript, Float64)',started:Date.now()};
  for(let mi=0;mi<job.models.length;mi++){
    const model=job.models[mi];const label=model.name;
    const rng=mulberry32(S.seed+mi*7919);
    const sp=makeSplits(model.n,S,rng);
    const R=rescale(model,S,sp.ana);
    const p=model.p;
    let units=S.units.slice(0,S.hiddenLayers),archSearch=null;
    if(S.autoUnits){archSearch=await autoArchitecture(model,R,sp,S,hooks,label,mi);units=archSearch.units;}
    const sizes=[p,...units,1];
    const cfg=trainCfg(S);
    const nets=[];const oof=new Float64Array(model.n).fill(NaN);
    const impSum=new Array(model.groups.length).fill(0);
    for(let k=0;k<sp.splits.length;k++){
      const {train,test}=sp.splits[k];
      const tr=subset(R.X,R.Y,p,train),te=subset(R.X,R.Y,p,test);
      const net=new Net(sizes,S.hAct,S.oAct);
      const res=trainNet(net,{Xtr:tr.X,Ytr:tr.Y,ntr:tr.n,Xte:te.X,Yte:te.Y,nte:te.n},cfg,mulberry32(S.seed+1009*(k+1)+mi*104729));
      const th=res.theta;
      const sseTr=net.sse(th,tr.X,tr.Y,tr.n),sseTe=te.n?net.sse(th,te.X,te.Y,te.n):0;
      const sstTr=sst(tr.Y,tr.n),sstTe=te.n?sst(te.Y,te.n):0;
      const predTe=net.predict(th,te.X,te.n);
      if(S.scheme==='kfold')test.forEach((r,i)=>{oof[r]=predTe[i];});
      let hold=null;
      if(sp.hold.length){const h=subset(R.X,R.Y,p,sp.hold);const s1=net.sse(th,h.X,h.Y,h.n);hold={n:h.n,sse:s1,rmse:Math.sqrt(s1/h.n),relErr:s1/(sst(h.Y,h.n)||1)};}
      // sensitivity analysis on the combined training + testing sample (as SPSS does)
      const comb=subset(R.X,R.Y,p,train.concat(test));
      const sens=sensitivity(net,th,comb.X,comb.Y,comb.n,p,model.groups,S.permRepeats,mulberry32(S.seed+k*13+mi*17+5));
      sens.importance.forEach((v,i)=>impSum[i]+=v);
      nets.push({
        k:k+1,nTrain:tr.n,nTest:te.n,
        sseTrain:sseTr,sseTest:sseTe,
        rmseTrain:Math.sqrt(sseTr/tr.n),rmseTest:te.n?Math.sqrt(sseTe/te.n):0,
        relErrTrain:sseTr/(sstTr||1),relErrTest:te.n?sseTe/(sstTe||1):0,
        r2Train:1-sseTr/(sstTr||1),r2Test:te.n?1-sseTe/(sstTe||1):0,
        hold,epochs:res.epochs,bestEpoch:res.bestEpoch,stopReason:res.stopReason,ms:res.ms,
        theta:Array.from(th),importance:sens.importance,normalized:sens.normalized,rawImportance:sens.raw,
        histTr:downsample(res.histTr,400),histTe:downsample(res.histTe,400),
        trainRows:train,testRows:test,predTest:Array.from(predTe),obsTest:Array.from(te.Y)
      });
      if(hooks.progress)hooks.progress({phase:'net',msg:`${label}: network ${k+1} of ${sp.splits.length} trained (${res.epochs} epochs, ${res.ms} ms)`,frac:(k+1)/sp.splits.length,model:mi});
      await hooks.tick();
    }
    const K=nets.length;
    const avgImp=impSum.map(v=>v/K);const mx=Math.max(...avgImp)||1;
    const sumRmseTe=nets.reduce((a,b)=>a+b.rmseTest,0),sumSseTe=nets.reduce((a,b)=>a+b.sseTest,0);
    const s2y=sumSseTe/K; // Leong et al. (2025): S²y = ΣSSE / 10
    const r2Leong=s2y>0?1-sumRmseTe/(K*s2y):null;
    // pooled out-of-sample (predictive) R² — k-fold: every case predicted exactly once
    let r2Pred=null;
    if(S.scheme==='kfold'){let se=0,m=0,c=0;for(const r of sp.ana){m+=R.Y[r];c++;}m/=c;let st=0;for(const r of sp.ana){se+=(R.Y[r]-oof[r])**2;st+=(R.Y[r]-m)**2;}r2Pred=1-se/(st||1);}
    else r2Pred=mean(nets.map(n=>n.r2Test));
    out.models.push({
      name:model.name,dep:model.dep,groups:model.groups.map(g=>g.name),cols:model.cols,featureNames:model.cols.map(c=>c.label),
      nTotal:model.n,nExcluded:model.nExcluded,nHoldout:sp.hold.length,holdRows:sp.hold,nAnalysis:sp.ana.length,
      sizes,units,archSearch,colInfo:R.colInfo,dv:R.dv,nets,
      summary:{
        meanRmseTrain:mean(nets.map(n=>n.rmseTrain)),sdRmseTrain:sd(nets.map(n=>n.rmseTrain)),
        meanRmseTest:mean(nets.map(n=>n.rmseTest)),sdRmseTest:sd(nets.map(n=>n.rmseTest)),
        meanSseTrain:mean(nets.map(n=>n.sseTrain)),meanSseTest:mean(nets.map(n=>n.sseTest)),
        meanR2Test:mean(nets.map(n=>n.r2Test)),sdR2Test:sd(nets.map(n=>n.r2Test)),
        s2y,r2Leong,r2Pred,
        avgImportance:avgImp,normImportance:avgImp.map(v=>v/mx*100),
        sdImportance:model.groups.map((_,i)=>sd(nets.map(n=>n.importance[i]))),
        oofPred:S.scheme==='kfold'?sp.ana.map(r=>oof[r]):null,oofObs:S.scheme==='kfold'?sp.ana.map(r=>R.Y[r]):null,
        totalMs:nets.reduce((a,b)=>a+b.ms,0)
      }
    });
  }
  out.finished=Date.now();
  return out;
}
if(typeof module!=='undefined')module.exports={runJob,Net,trainNet,mulberry32,sensitivity};
