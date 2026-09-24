// SaNaSoft analysis engine, extracted verbatim from index.html for benchmarking.

function calibrateValue(x, full, cross, non, L){
  if(!Number.isFinite(x)) return NaN;
  L=L||3; let lo;
  if(full>non){ lo = x>=cross ? (x-cross)*L/(full-cross) : (x-cross)*L/(cross-non); }
  else { lo = x<=cross ? (cross-x)*L/(cross-full) : (cross-x)*L/(non-cross); }
  return 1/(1+Math.exp(-lo));
}
function validAnchors(a){
  return a && [a.full,a.cross,a.non].every(Number.isFinite) &&
    ((a.full>a.cross && a.cross>a.non) || (a.full<a.cross && a.cross<a.non));
}
function necessity(X,Y){
  let sxy=0,sx=0,sy=0,snx=0,snm=0;
  for(let i=0;i<X.length;i++){ const m=Math.min(X[i],Y[i]); sxy+=m; sx+=X[i]; sy+=Y[i]; snx+=1-X[i]; snm+=1-m; }
  return {cons:sxy/sy, cov:sxy/sx, ron:snx/snm};
}
function rowStr(idx,k){ let s=''; for(let j=0;j<k;j++) s+=(idx>>(k-1-j))&1; return s; }
function termMembership(term, conds){
  const n=conds[0].length, out=new Array(n);
  for(let i=0;i<n;i++){
    let m=1;
    for(let j=0;j<term.length;j++){ const t=term[j]; if(t==='-') continue; const v=t==='1'?conds[j][i]:1-conds[j][i]; if(v<m) m=v; }
    out[i]=m;
  }
  return out;
}
function fitStats(M,Y){
  let smy=0,sm=0,sy=0,smyny=0;
  for(let i=0;i<M.length;i++){ const my=Math.min(M[i],Y[i]); smy+=my; sm+=M[i]; sy+=Y[i]; smyny+=Math.min(my,1-Y[i]); }
  return {incl:smy/sm, cov:smy/sy, pri:(smy-smyny)/(sm-smyny)};
}
function truthTable(conds, Y){
  const k=conds.length, n=Y.length, R=1<<k, counts=new Array(R).fill(0);
  let ambiguous=0;
  for(let i=0;i<n;i++){
    let idx=0, amb=false;
    for(let j=0;j<k;j++){ const v=conds[j][i]; if(v===0.5) amb=true; idx=(idx<<1)|(v>0.5?1:0); }
    if(amb) ambiguous++; else counts[idx]++;
  }
  const rows=[];
  for(let r=0;r<R;r++){
    const str=rowStr(r,k);
    let st={incl:NaN,pri:NaN};
    if(counts[r]>0) st=fitStats(termMembership(str,conds),Y);
    rows.push({idx:r,str,n:counts[r],incl:st.incl,pri:st.pri});
  }
  return {rows, ambiguous};
}
function combineTerms(a,b){
  let diff=-1;
  for(let i=0;i<a.length;i++){
    if(a[i]!==b[i]){ if(a[i]==='-'||b[i]==='-') return null; if(diff>=0) return null; diff=i; }
  }
  if(diff<0) return null;
  return a.slice(0,diff)+'-'+a.slice(diff+1);
}
function primeImplicants(minterms){
  let cur=[...new Set(minterms)];
  const P=new Set();
  while(cur.length){
    const used=new Set(), next=new Set();
    for(let i=0;i<cur.length;i++) for(let j=i+1;j<cur.length;j++){
      const c=combineTerms(cur[i],cur[j]);
      if(c){ used.add(cur[i]); used.add(cur[j]); next.add(c); }
    }
    cur.forEach(t=>{ if(!used.has(t)) P.add(t); });
    cur=[...next];
  }
  return [...P];
}
function covers(t,m){ for(let i=0;i<t.length;i++){ if(t[i]!=='-' && t[i]!==m[i]) return false; } return true; }
function subsumes(p,c){ for(let j=0;j<p.length;j++){ if(p[j]!=='-' && p[j]!==c[j]) return false; } return true; }
function lits(t){ let n=0; for(const ch of t) if(ch!=='-') n++; return n; }
function totalLits(model){ return model.reduce((s,t)=>s+lits(t),0); }
function minimalModels(P, targets, cap){
  // Finds every cover of the target rows that uses the smallest possible number of prime implicants,
  // matching R QCA's default (all minimal models). Models are ordered by total number of literals.
  cap=cap||500;
  const pis=P.filter(p=>targets.some(m=>covers(p,m)));
  const cov=new Map(pis.map(p=>[p,new Set(targets.filter(m=>covers(p,m)))]));
  const byRow=new Map(targets.map(m=>[m,pis.filter(p=>cov.get(p).has(m))]));
  const ess=new Set(); for(const m of targets){ const c=byRow.get(m); if(c.length===1) ess.add(c[0]); }
  const essArr=[...ess];
  const rem0=targets.filter(m=>!essArr.some(p=>cov.get(p).has(m)));
  if(!rem0.length) return {models:[essArr], ambiguous:false, capped:false};
  const found=new Map(); let capped=false, work=0; const LIMIT=3e6;
  function dfs(chosen, uncovered, size){
    if(found.size>=cap||work>LIMIT){ capped=true; return; }
    work++;
    if(!uncovered.length){ const k=[...chosen].sort().join('|'); if(!found.has(k)) found.set(k,[...chosen]); return; }
    if(chosen.length>=size) return;
    // lower bound: need at least ceil(uncovered / largest remaining cover) more terms
    let best=null;
    for(const m of uncovered){ const c=byRow.get(m).filter(p=>!ess.has(p)); if(!best||c.length<best.c.length) best={m,c}; if(best.c.length<=1) break; }
    for(const p of best.c){ if(chosen.includes(p)) continue; chosen.push(p); dfs(chosen, uncovered.filter(m=>!cov.get(p).has(m)), size); chosen.pop(); if(found.size>=cap||work>LIMIT){ capped=true; return; } }
  }
  for(let size=1; size<=pis.length && !found.size; size++){ dfs([], rem0, size); if(work>LIMIT) break; }
  let models=[...found.values()].map(f=>[...essArr,...f]);
  if(!models.length) models=[pis];
  models.sort((a,b)=>(totalLits(a)-totalLits(b)) || (a.slice().sort().join('|')<b.slice().sort().join('|')?-1:1));
  return {models, ambiguous:models.length>1, capped};
}
function describeSolution(terms, conds, Y){
  if(!terms.length) return {terms:[], sol:{incl:NaN,cov:NaN}};
  const Ms=terms.map(t=>termMembership(t,conds));
  const stats=terms.map((t,i)=>Object.assign({term:t}, fitStats(Ms[i],Y)));
  const n=Y.length, sy=Y.reduce((a,b)=>a+b,0);
  const maxOf=(list)=>{ const S=new Array(n).fill(0); for(const M of list) for(let i=0;i<n;i++) if(M[i]>S[i]) S[i]=M[i]; return S; };
  const S=maxOf(Ms), sol=fitStats(S,Y);
  stats.forEach((s,i)=>{
    const So=maxOf(Ms.filter((_,j)=>j!==i));
    let c=0; for(let q=0;q<n;q++) c+=Math.min(So[q],Y[q]);
    s.ucov=sol.cov - c/sy;
  });
  stats.sort((a,b)=>b.cov-a.cov);
  return {terms:stats, sol};
}
function expandTerm(t){ let out=['']; for(const ch of t){ out = ch==='-' ? out.flatMap(x=>[x+'0',x+'1']) : out.map(x=>x+ch); } return out; }
function intermediateTerms(C, P, dirExp){
  // Same procedure as R QCA (Dusa): for every complex term c and every parsimonious term p contained in it,
  // drop from c the literals (absent from p) that contradict the directional expectation; keep the rest.
  const terms=[];
  for(const c of C){
    const subs=P.filter(p=>subsumes(p,c));
    if(!subs.length){ terms.push(c); continue; }
    for(const p of subs){
      let t=''; for(let j=0;j<c.length;j++){ const e=dirExp[j]; t += (p[j]==='-' && c[j]!=='-' && e!=='-' && e!==c[j]) ? '-' : c[j]; }
      terms.push(t);
    }
  }
  return [...new Set(terms)];
}
function easyRemainders(pos, remd, P, dirExp, C){
  const cells=new Set(intermediateTerms(C||pos,P,dirExp).flatMap(expandTerm));
  return remd.filter(r=>cells.has(r));
}
function coreSets(I,P,k){
  return I.map(t=>{ const set=new Set(); P.filter(p=>subsumes(p,t)).forEach(p=>{ for(let j=0;j<k;j++) if(p[j]!=='-') set.add(j); }); return set; });
}
function intermediateFor(pos, remd, C, P, dirExp, k){
  const cells=[...new Set(intermediateTerms(C,P,dirExp).flatMap(expandTerm))];
  const res=minimalModels(primeImplicants(cells),pos);
  const remSet=new Set(remd);
  return {models:res.models, easy:cells.filter(x=>remSet.has(x)).length};
}
function solveTruthTable(conds, Y, rows, outMap, dirExp, choice){
  const k=conds.length;
  const pos=rows.filter(r=>outMap[r.idx]===1).map(r=>r.str);
  const remd=rows.filter(r=>outMap[r.idx]===null).map(r=>r.str);
  if(!pos.length) return null;
  choice=choice||{};
  const cPr=primeImplicants(pos), cRes=minimalModels(cPr,pos);
  const pPr=primeImplicants(pos.concat(remd)), pRes=minimalModels(pPr,pos);
  const ci=Math.min(choice.c||0,cRes.models.length-1), pi=Math.min(choice.p||0,pRes.models.length-1);
  const C=cRes.models[ci], P=pRes.models[pi];
  const iRes=intermediateFor(pos,remd,C,P,dirExp,k);
  const I=iRes.models[0];
  const core=coreSets(I,P,k);
  return {
    complex:{...describeSolution(C,conds,Y), ambiguous:cRes.ambiguous, nModels:cRes.models.length, models:cRes.models, idx:ci, capped:cRes.capped},
    pars:{...describeSolution(P,conds,Y), ambiguous:pRes.ambiguous, nModels:pRes.models.length, models:pRes.models, idx:pi, capped:pRes.capped},
    inter:{...describeSolution(I,conds,Y), core:new Map(I.map((t,i)=>[t,core[i]])), nModels:iRes.models.length, easy:iRes.easy},
    nPos:pos.length, nRem:remd.length, pos, remd
  };
}
function parsSA(pos, remd){
  const pm=minimalModels(primeImplicants(pos.concat(remd)),pos), set=new Set();
  pm.models.forEach(m=>remd.forEach(r=>{ if(m.some(t=>covers(t,r))) set.add(r); }));
  return set;
}
function esaExclusions(conds, Y, rows, freq, incl, pri){
  // Enhanced Standard Analysis (Schneider & Wagemann 2012):
  // (1) contradictory simplifying assumptions: remainders used by the parsimonious solutions of both Y and ~Y (as R QCA findRows type 2);
  // (2) remainders that contradict a necessary condition (consistency >= 0.90 and RoN >= 0.50).
  const Yn=Y.map(v=>1-v), ttn=truthTable(conds,Yn);
  const code=tt=>{ const pos=[],rem=[]; tt.rows.forEach(r=>{ if(r.n<freq) rem.push(r.str); else if(r.incl>=incl&&r.pri>=pri) pos.push(r.str); }); return {pos,rem}; };
  const A=code({rows}), B=code(ttn);
  let csa=[];
  if(A.pos.length&&B.pos.length){ const s1=parsSA(A.pos,A.rem), s2=parsSA(B.pos,B.rem); csa=[...s1].filter(x=>s2.has(x)); }
  const nec=[];
  conds.forEach((X,j)=>{ const a=necessity(X,Y); if(a.cons>=0.9&&a.ron>=0.5) nec.push([j,'1']); const b=necessity(X.map(v=>1-v),Y); if(b.cons>=0.9&&b.ron>=0.5) nec.push([j,'0']); });
  const necRows=nec.length? A.rem.filter(r=>nec.some(([j,v])=>r[j]!==v)) : [];
  return {csa, necRows, nec};
}
function percentile(arr,p){
  const a=arr.filter(Number.isFinite).sort((x,y)=>x-y); if(!a.length) return NaN;
  const h=(a.length-1)*p, lo=Math.floor(h), hi=Math.ceil(h);
  return a[lo]+(a[hi]-a[lo])*(h-lo);
}

module.exports={calibrateValue,primeImplicants,minimalModels,solveTruthTable,truthTable,necessity,describeSolution,esaExclusions};
