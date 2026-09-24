import json, os, collections
man={}
for i,l in enumerate(open('manifest.tsv')):
    if i==0: continue
    f=l.rstrip('\n').split('\t'); man[int(f[0])]=f
M=json.load(open('manifest.json')); names={m['id']:m['name'] for m in M}
TOL=1e-9
stats=collections.Counter(); issues=collections.defaultdict(list); maxdiff=collections.defaultdict(float)
def close(a,b,key):
    if a is None and b is None: return True
    if a is None or b is None: return False
    d=abs(a-b); maxdiff[key]=max(maxdiff[key],d); return d<TOL
def key(model): return tuple(sorted(model))
for m in M:
    i=m['id']; rp=f'r/{i}.json'
    if not os.path.exists(rp): stats['missing']+=1; continue
    r=json.loads(open(rp).read().replace(":TRUE",":true").replace(":FALSE",":false"),strict=False); j=json.load(open(f'js/{i}.json')); nm=names[i]
    if 'fatal' in r: issues['r_fatal'].append((nm,r['fatal'])); continue
    if r.get('ttErr'):
        # R refuses to build a truth table when no row passes the cutoffs; SaNaSoft should then have no positive rows
        pos=[t for t in j['tt'] if t['out']==1]
        stats['tt_no_config']+=1
        if pos: issues['tt_nopos_mismatch'].append(nm)
        continue
    stats['cases']+=1
    # truth table
    ok=True
    rt_rows=r['tt'] if len(r['tt'])==len(j['tt']) else None
    if rt_rows is None:
        idx=r.get('ttidx'); rt_rows=[None]*len(j['tt'])
        for q,b in zip(idx,r['tt']): rt_rows[int(q)-1]=b
        rt_rows=[b if b is not None else {'n':0,'incl':None,'pri':None,'out':'?'} for b in rt_rows]
    freq=float(man[i][7])
    for a,b in zip(j['tt'],rt_rows):
        stats['tt_rows']+=1
        if b['n']==0 and b['out']=='?' and a['n']<freq and len(r['tt'])!=len(j['tt']): a=dict(a,n=0,out='?')
        if a['n']!=b['n']: ok=False; issues['tt_n'].append(nm); break
        if a['n']>0:
            if not close(a['incl'],b['incl'],'tt_incl') or not close(a['pri'],b['pri'],'tt_pri'): ok=False; issues['tt_val'].append((nm,a,b)); break
        if str(a['out'])!=str(b['out']): ok=False; issues['tt_out'].append((nm,a,b)); break
    stats['tt_ok']+=ok
    # necessity
    nok=True
    for a,b in zip(j['nec'],r['nec']):
        for s in ('pos','neg'):
            for k in ('cons','cov','ron'):
                if not close(a[s][k],b[s][k],'nec_'+k): nok=False; issues['nec'].append((nm,a['c'],s,k,a[s][k],b[s][k]))
    stats['nec_ok']+=nok
    if 'complex' not in r:
        if 'complex' in j: issues['sol_presence'].append(nm)
        stats['no_solution']+=1; continue
    stats['with_solution']+=1
    for sol in ('complex','pars'):
        R=set(key(x) for x in r[sol]); J=[key(x) for x in j[sol]]
        if J[0] in R: stats[sol+'_first_in_R']+=1
        else: issues[sol+'_first_notin_R'].append((nm,J[0],list(R)[:3]))
        if set(J)==R: stats[sol+'_models_equal']+=1
        else: issues[sol+'_models_differ'].append((nm,len(J),len(R)))
        # metrics when first models coincide
        rf=r[sol+'First']; jf=j[sol+'First']
        if key([t['t'] for t in jf['terms']])==key([t['t'] for t in rf['terms']]):
            rt={t['t']:t for t in rf['terms']}; mok=True
            for t in jf['terms']:
                for k in ('incl','cov','ucov'):
                    if k=='ucov' and rt[t['t']][k] is None: continue
                if not close(t[k],rt[t['t']][k],sol+'_'+k): mok=False
            for k in ('incl','cov'):
                if not close(jf['sol'][k],rf['sol'][k],sol+'_sol'+k): mok=False
            stats[sol+'_metrics_ok']+=mok
            if not mok: issues[sol+'_metrics'].append(nm)
            stats[sol+'_metrics_checked']+=1
    if 'interErr' in r: issues['r_inter_err'].append((nm,r['interErr'][:60])); continue
    if 'interSkipped' in r: stats['inter_skipped_R_too_many_pairs']+=1; continue
    if 'interAll' not in r: issues['r_inter_missing'].append(nm); continue
    Jm=key([t['t'] for t in j['inter']['terms']])
    allI=[key(x) for grp in r['interAll'].values() for x in grp] if isinstance(r['interAll'],dict) else [key(x) for grp in r['interAll'] for x in grp]
    C1=key([t['t'] for t in r['inter']['terms']])
    stats['inter_cases']+=1
    if Jm==C1: stats['inter_eq_C1P1']+=1
    elif Jm in allI: stats['inter_in_R_set']+=1; issues['inter_other_CP'].append((nm,Jm,C1))
    else: issues['inter_differs'].append((nm,Jm,C1,len(allI)))
    if Jm==C1:
        rt={t['t']:t for t in r['inter']['terms']}; mok=True
        for t in j['inter']['terms']:
            for k in ('incl','cov','ucov'):
                if k=='ucov' and rt[t['t']][k] is None and len(j['inter']['terms'])==1: continue
                if not close(t[k],rt[t['t']][k],'inter_'+k): mok=False
        for k in ('incl','cov'):
            if not close(j['inter']['sol'][k],r['inter']['sol'][k],'inter_sol'+k): mok=False
        stats['inter_metrics_ok']+=mok
        if not mok: issues['inter_metrics'].append(nm)
print(dict(stats)); print('max abs differences:',{k:f'{v:.2e}' for k,v in maxdiff.items()})
for k,v in issues.items(): print('\nISSUE',k,len(v)); [print('   ',x) for x in v[:6]]
