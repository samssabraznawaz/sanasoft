const E=require('../../src/engine.js');const d=require(__dirname+'/data.json');const fs=require('fs');
(async()=>{const out={};
for(const kind of ['linear','nonlinear']){const X=d[kind].X,y=d[kind].y,n=X.length,p=5;
 const model={name:kind,dep:'Y',n,p,X:X.flat(),Y:y,nExcluded:0,cols:[0,1,2,3,4].map(i=>({kind:'cov',label:'X'+(i+1)})),groups:[0,1,2,3,4].map(i=>({name:'X'+(i+1),cols:[i]}))};
 out[kind]={};
 for(const [lab,o] of [['FFBP sigmoid/sigmoid (Leong)',{}],['SCG sigmoid/sigmoid',{algorithm:'scg'}],['FFBP sigmoid/identity',{oAct:'identity',dvRescale:'normalized'}],['SCG sigmoid/identity',{algorithm:'scg',oAct:'identity',dvRescale:'normalized'}]]){
  const S=Object.assign({seed:42,holdout:0,networks:10,scheme:'kfold',training:90,test:10,covRescale:'standardized',dvRescale:'standardized',hAct:'sigmoid',oAct:'sigmoid',hiddenLayers:2,units:[4,3],autoUnits:false,autoMax:8,autoMax2:4,algorithm:'ffbp',type:'batch',batchSize:32,lr:1,momentum:0.9,lrLower:0.001,lrReductionEpochs:10,adamLr:0.01,scgLambda:5e-7,scgSigma:5e-5,maxEpochs:3000,patience:100,minEpochs:300,minRelChange:1e-5,maxTimeMin:15,l2:0,permRepeats:10},o);
  const t=Date.now();const r=(await E.runJob({models:[model],settings:S},{})).models[0];
  out[kind][lab]={r2:r.summary.r2Pred,imp:r.summary.normImportance,ms:Date.now()-t,folds:r.nets.map(n=>n.testRows)};
 }}
fs.writeFileSync(__dirname+'/js_out.json',JSON.stringify(out));})();
