import numpy as np, json
rng=np.random.default_rng(11)
def make(n,kind):
    g=rng.normal(size=n)
    X=np.column_stack([0.5*g+np.sqrt(.75)*rng.normal(size=n) for _ in range(5)])
    if kind=='linear': y=.45*X[:,0]+.3*X[:,1]+.2*X[:,2]+.1*X[:,3]+0*X[:,4]
    else: y=.45*X[:,0]+.35*np.tanh(2*X[:,1])+.3*np.maximum(0,X[:,2])**2*.5+.25*X[:,3]*X[:,4]+.05*X[:,4]
    y=y+.55*rng.normal(size=n)
    return X,y
out={}
for kind in ['linear','nonlinear']:
    X,y=make(400,kind); out[kind]={'X':X.tolist(),'y':y.tolist()}
import os
json.dump(out,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'data.json'),'w'))
