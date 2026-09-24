const E=require('./engine.js'), fs=require('fs');
const L=fs.readFileSync('manifest_esa.tsv','utf8').trim().split('\n'); L.shift();
const lab=(t,n)=>t.split('').map((c,j)=>c==='1'?n[j]:c==='0'?'~'+n[j]:null).filter(Boolean).join('*');
for(const l of L){ const [id,file,outc,cs,neg,incl,pri,freq,dir]=l.split('\t'); const n=cs.split(','), de=dir.split(',');
  const T=fs.readFileSync(file,'utf8').trim().split(/\r?\n/); const h=T.shift().split(',').map(x=>x.replace(/"/g,'')); const d=Object.fromEntries(h.map(k=>[k,[]])); T.forEach(r=>r.split(',').forEach((v,i)=>d[h[i]].push(+v)));
  const conds=n.map(c=>d[c]); let Y=d[outc]; if(neg==='1') Y=Y.map(v=>1-v);
  const tt=E.truthTable(conds,Y), map={}; tt.rows.forEach(r=>{ map[r.idx]= r.n<+freq?null:(r.incl>=+incl&&r.pri>=+pri?1:0); });
  const out=[];
  if(!tt.rows.some(r=>map[r.idx]===1)){ fs.writeFileSync(`esa_js/${id}.txt`,'NOPOS\n'); continue; }
  const e=E.esaExclusions(conds,Y,tt.rows,+freq,+incl,+pri);
  out.push('CSA '+e.csa.map(s=>parseInt(s,2)+1).sort((a,b)=>a-b).join(','));
  tt.rows.forEach(r=>{ if(map[r.idx]===null && e.csa.includes(r.str)) map[r.idx]=0; });
  const pos=tt.rows.filter(r=>map[r.idx]===1).map(r=>r.str), rem=tt.rows.filter(r=>map[r.idx]===null).map(r=>r.str);
  const pm=E.minimalModels(E.primeImplicants(pos.concat(rem)),pos);
  out.push('PARS '+pm.models.map(m=>m.map(t=>lab(t,n)).sort().join('+')).join(' | '));
  const res=E.solveTruthTable(conds,Y,tt.rows,map,de);
  out.push('INTER '+res.inter.terms.map(t=>lab(t.term,n)).sort().join('+'));
  fs.writeFileSync(`esa_js/${id}.txt`,out.join('\n')+'\n'); }
