const E=require('./engine.js'); const fs=require('fs');
const M=JSON.parse(fs.readFileSync('manifest.json'));
const readCSV=f=>{ const L=fs.readFileSync(f,'utf8').trim().split(/\r?\n/); const h=L.shift().split(',').map(x=>x.replace(/"/g,'')); const d=Object.fromEntries(h.map(k=>[k,[]])); L.forEach(l=>l.split(',').forEach((v,i)=>d[h[i]].push(+v))); return d; };
const lab=(t,n)=>t.split('').map((c,j)=>c==='1'?n[j]:c==='0'?'~'+n[j]:null).filter(Boolean).join('*');
for(const m of M){
  const d=readCSV(m.file), n=m.conditions, conds=n.map(c=>d[c]); let Y=d[m.outcome]; if(m.negate) Y=Y.map(v=>1-v);
  const tt=E.truthTable(conds,Y), map={};
  tt.rows.forEach(r=>{ map[r.idx]= r.n<m.freq?null:(r.incl>=m.incl&&r.pri>=m.pri?1:0); });
  const out={id:m.id, tt:tt.rows.map(r=>({n:r.n,incl:r.incl,pri:r.pri,out:map[r.idx]===null?'?':map[r.idx]}))};
  out.nec=n.map((c,j)=>({c, pos:E.necessity(conds[j],Y), neg:E.necessity(conds[j].map(v=>1-v),Y)}));
  const pos=tt.rows.filter(r=>map[r.idx]===1).map(r=>r.str), rem=tt.rows.filter(r=>map[r.idx]===null).map(r=>r.str);
  if(pos.length){
    const cm=E.minimalModels(E.primeImplicants(pos),pos), pm=E.minimalModels(E.primeImplicants(pos.concat(rem)),pos);
    out.complex=cm.models.map(mm=>mm.map(t=>lab(t,n)).sort());
    out.pars=pm.models.map(mm=>mm.map(t=>lab(t,n)).sort());
    const res=E.solveTruthTable(conds,Y,tt.rows,map,m.dir);
    const pk=s=>({terms:s.terms.map(t=>({t:lab(t.term,n),incl:t.incl,cov:t.cov,ucov:t.ucov})),sol:s.sol});
    out.complexFirst=pk(res.complex); out.parsFirst=pk(res.pars); out.inter=pk(res.inter);
    out.core=res.inter.terms.map(t=>({t:lab(t.term,n),core:[...res.inter.core.get(t.term)].map(j=>n[j]).sort()}));
  }
  fs.writeFileSync(`js/${m.id}.json`,JSON.stringify(out));
}
console.log('js done',M.length);
