// Engine unit tests — run with:  node --test tests/
// No dependencies required (Node.js ≥ 18).
const test = require('node:test');
const assert = require('node:assert/strict');
const { runJob, Net, trainNet, mulberry32, sensitivity } = require('../src/engine.js');

const BASE = {
  seed: 42, holdout: 0, networks: 10, scheme: 'kfold', training: 90, test: 10,
  covRescale: 'standardized', dvRescale: 'standardized', hAct: 'sigmoid', oAct: 'sigmoid',
  hiddenLayers: 2, units: [4, 3], autoUnits: false, autoMax: 6, autoMax2: 3,
  algorithm: 'ffbp', type: 'batch', batchSize: 32, lr: 1, momentum: 0.9, lrLower: 0.001, lrReductionEpochs: 10,
  adamLr: 0.01, scgLambda: 5e-7, scgSigma: 5e-5, maxEpochs: 800, patience: 50, minEpochs: 100, minRelChange: 1e-5,
  maxTimeMin: 5, l2: 0, initCenter: 0, initOffset: 0.5, permRepeats: 5
};

function synthetic(n, seed, nonlinear) {
  const r = mulberry32(seed);
  const g = () => { let u = 0; for (let i = 0; i < 6; i++) u += r(); return (u - 3) * 1.41; };
  const X = [], Y = [];
  for (let i = 0; i < n; i++) {
    const x = [g(), g(), g(), g()];
    const y = 0.6 * x[0] + 0.3 * x[1] + (nonlinear ? 0.5 * Math.tanh(2 * x[2]) * x[3] : 0.1 * x[2]) + 0.4 * g();
    X.push(...x); Y.push(y);
  }
  return {
    name: 'T', dep: 'Y', n, p: 4, X, Y, nExcluded: 0,
    cols: [0, 1, 2, 3].map(i => ({ kind: 'cov', label: 'X' + (i + 1), group: i })),
    groups: [0, 1, 2, 3].map(i => ({ name: 'X' + (i + 1), cols: [i] }))
  };
}

test('analytic gradient matches finite differences (back-propagation is correct)', () => {
  for (const [h, o] of [['sigmoid', 'sigmoid'], ['tanh', 'identity'], ['sigmoid', 'identity']]) {
    const net = new Net([3, 4, 3, 1], h, o);
    const rng = mulberry32(7);
    const th = net.init(rng, 0, 0.8);
    const n = 20, X = new Float64Array(n * 3), Y = new Float64Array(n);
    for (let i = 0; i < n * 3; i++) X[i] = rng() * 2 - 1;
    for (let i = 0; i < n; i++) Y[i] = rng();
    const g = new Float64Array(net.nParams);
    net.lossGrad(th, X, Y, null, 0, n, g, 0.001);
    const eps = 1e-6;
    for (let k = 0; k < net.nParams; k++) {
      const a = th.slice(), b = th.slice(); a[k] += eps; b[k] -= eps;
      const num = (net.loss(a, X, Y, n, 0.001) - net.loss(b, X, Y, n, 0.001)) / (2 * eps);
      const rel = Math.abs(num - g[k]) / Math.max(1e-8, Math.abs(num) + Math.abs(g[k]));
      assert.ok(rel < 1e-5, `${h}/${o} parameter ${k}: analytic ${g[k]} vs numeric ${num}`);
    }
  }
});

test('every training algorithm reduces the error', () => {
  const m = synthetic(200, 3, true);
  for (const alg of ['ffbp', 'scg', 'adam']) {
    const net = new Net([4, 4, 3, 1], 'sigmoid', 'identity');
    const X = Float64Array.from(m.X), Y = Float64Array.from(m.Y);
    const cfg = Object.assign({}, BASE, { algorithm: alg, maxTimeMs: 60000, lr: 0.3, patience: 1e9, minEpochs: 0, minRelChange: 0, maxEpochs: 300 });
    const start = new Net([4, 4, 3, 1], 'sigmoid', 'identity');
    const th0 = start.init(mulberry32(1), 0, 0.5);
    const e0 = start.sse(th0, X, Y, 200);
    const res = trainNet(net, { Xtr: X, Ytr: Y, ntr: 200, Xte: X, Yte: Y, nte: 200 }, cfg, mulberry32(1));
    const e1 = net.sse(res.theta, X, Y, 200);
    assert.ok(e1 < 0.6 * e0, `${alg}: SSE ${e0.toFixed(2)} → ${e1.toFixed(2)}`);
  }
});

test('results are exactly reproducible with the same seed', async () => {
  const m = synthetic(150, 5, false);
  const a = await runJob({ models: [m], settings: BASE });
  const b = await runJob({ models: [m], settings: BASE });
  assert.deepEqual(a.models[0].summary.normImportance, b.models[0].summary.normImportance);
  assert.deepEqual(a.models[0].nets.map(n => n.rmseTest), b.models[0].nets.map(n => n.rmseTest));
});

test('k-fold: every case is tested exactly once and splits are 90/10', async () => {
  const m = synthetic(137, 9, false);
  const r = (await runJob({ models: [m], settings: Object.assign({}, BASE, { maxEpochs: 50, minEpochs: 0 }) })).models[0];
  const seen = new Array(137).fill(0);
  r.nets.forEach(n => n.testRows.forEach(i => seen[i]++));
  assert.ok(seen.every(c => c === 1));
  r.nets.forEach(n => { assert.ok(Math.abs(n.nTest / 137 - 0.1) < 0.01); assert.equal(n.nTrain + n.nTest, 137); });
});

test('relative importance sums to 1 per network; normalized max is 100', async () => {
  const m = synthetic(150, 11, false);
  const r = (await runJob({ models: [m], settings: BASE })).models[0];
  r.nets.forEach(n => assert.ok(Math.abs(n.importance.reduce((s, v) => s + v, 0) - 1) < 1e-9));
  assert.ok(Math.abs(Math.max(...r.summary.normImportance) - 100) < 1e-9);
  // the strongest simulated predictor (X1) should rank first
  assert.equal(r.summary.normImportance.indexOf(100), 0);
});

test('R² formulas: Leong et al. (2025) as printed, and predictive R²', async () => {
  const m = synthetic(160, 13, false);
  const r = (await runJob({ models: [m], settings: BASE })).models[0];
  const K = r.nets.length, sumR = r.nets.reduce((s, n) => s + n.rmseTest, 0), sumS = r.nets.reduce((s, n) => s + n.sseTest, 0);
  assert.ok(Math.abs(r.summary.r2Leong - (1 - sumR / (K * (sumS / K)))) < 1e-12);
  assert.ok(r.summary.r2Pred > 0.5 && r.summary.r2Pred < 1);
  r.nets.forEach(n => assert.ok(Math.abs(n.rmseTest - Math.sqrt(n.sseTest / n.nTest)) < 1e-12));
});

test('sigmoid output ⇒ dependent variable normalized to [0,1]', async () => {
  const m = synthetic(120, 17, false);
  const r = (await runJob({ models: [m], settings: Object.assign({}, BASE, { maxEpochs: 50, minEpochs: 0 }) })).models[0];
  assert.equal(r.dv.mode, 'normalized');
});

test('ANN beats a constant model on non-linear data', async () => {
  const m = synthetic(300, 21, true);
  const r = (await runJob({ models: [m], settings: Object.assign({}, BASE, { algorithm: 'scg' }) })).models[0];
  assert.ok(r.summary.r2Pred > 0.6, 'predictive R² = ' + r.summary.r2Pred);
});

test('permutation sensitivity: an irrelevant input gets (near) zero importance', () => {
  const net = new Net([2, 1], 'sigmoid', 'identity');
  const th = Float64Array.from([1, 0, 0]); // y = 1·x1 + 0·x2 + 0
  const n = 200, X = new Float64Array(n * 2), Y = new Float64Array(n), rng = mulberry32(3);
  for (let i = 0; i < n; i++) { X[2 * i] = rng() * 4 - 2; X[2 * i + 1] = rng() * 4 - 2; Y[i] = net.forward(th, X, i); }
  const s = sensitivity(net, th, X, Y, n, 2, [{ name: 'a', cols: [0] }, { name: 'b', cols: [1] }], 5, mulberry32(4));
  assert.ok(s.importance[0] > 0.99 && s.importance[1] < 0.01);
});
