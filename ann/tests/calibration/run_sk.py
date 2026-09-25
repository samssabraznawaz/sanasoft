import json,os,numpy as np,time,warnings
D=os.path.dirname(os.path.abspath(__file__))
from sklearn.neural_network import MLPRegressor
from sklearn.linear_model import LinearRegression
from sklearn.inspection import permutation_importance
warnings.filterwarnings('ignore')
d=json.load(open(os.path.join(D,'data.json')));js=json.load(open(os.path.join(D,'js_out.json')))
for kind in ['linear','nonlinear']:
    X=np.array(d[kind]['X']);y=np.array(d[kind]['y'])
    folds=js[kind]['FFBP sigmoid/sigmoid (Leong)']['folds']
    Xs=(X-X.mean(0))/X.std(0,ddof=1);ys=(y-y.min())/(y.max()-y.min())
    def cv(make,imp=True):
        oof=np.zeros(len(y));I=[]
        for k,te in enumerate(folds):
            te=np.array(te);tr=np.setdiff1d(np.arange(len(y)),te)
            m=make(k).fit(Xs[tr],ys[tr]);oof[te]=m.predict(Xs[te])
            if imp:
                pi=permutation_importance(m,Xs,ys,n_repeats=10,random_state=k,scoring='neg_mean_squared_error').importances_mean.clip(0)
                I.append(pi/pi.sum())
        r2=1-((ys-oof)**2).sum()/((ys-ys.mean())**2).sum()
        if imp: a=np.mean(I,0);return r2,a/a.max()*100
        return r2,None
    print(f"\n=== {kind.upper()} data (n=400, 5 predictors, same 10 folds) ===")
    print(f"{'Software / setting':40s} {'pred R2':>8s}  normalized importance X1..X5")
    for lab,v in js[kind].items():
        print(f"{'SaNaSoft '+lab:40s} {v['r2']:8.3f}  {' '.join(f'{x:5.1f}' for x in v['imp'])}   ({v['ms']} ms)")
    for lab,mk in [('sklearn MLP logistic/identity, SGD',lambda k:MLPRegressor(hidden_layer_sizes=(4,3),activation='logistic',solver='sgd',learning_rate_init=0.5,momentum=0.9,max_iter=3000,n_iter_no_change=100,early_stopping=False,random_state=k,batch_size=10**6)),
                   ('sklearn MLP logistic/identity, L-BFGS',lambda k:MLPRegressor(hidden_layer_sizes=(4,3),activation='logistic',solver='lbfgs',max_iter=3000,random_state=k)),
                   ('sklearn MLP logistic/identity, Adam',lambda k:MLPRegressor(hidden_layer_sizes=(4,3),activation='logistic',solver='adam',learning_rate_init=0.01,max_iter=3000,random_state=k))]:
        t=time.time();r2,im=cv(mk);print(f"{lab:40s} {r2:8.3f}  {' '.join(f'{x:5.1f}' for x in im)}   ({int((time.time()-t)*1000)} ms)")
    r2,_=cv(lambda k:LinearRegression(),imp=False);print(f"{'OLS linear regression':40s} {r2:8.3f}")
