# Calibration against scikit-learn

Compares SaNaSoft-ANN's engine with scikit-learn's `MLPRegressor` and ordinary least squares on two simulated
datasets, using identical ten folds. Results are summarised in [docs/validation.md](../../docs/validation.md).

```bash
pip install numpy scikit-learn
python tests/calibration/gen.py      # simulate data → data.json
node   tests/calibration/run_js.js   # SaNaSoft-ANN engine → js_out.json (also stores the folds)
python tests/calibration/run_sk.py   # scikit-learn + OLS on the same folds, prints the comparison
```
