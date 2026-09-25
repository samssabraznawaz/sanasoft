# Validation

## 1. Automated correctness tests
`tests/engine.test.js` (run on every commit by GitHub Actions) verifies that:
- analytic gradients match finite-difference gradients (relative error < 10⁻⁵) for several activation combinations — i.e. back-propagation is implemented correctly;
- FFBP, SCG and Adam all reduce the training error;
- results are bit-for-bit reproducible with the same seed;
- k-fold partitioning tests every case exactly once with 90/10 splits;
- relative importance sums to 1 per network and the strongest simulated predictor ranks first;
- RMSE = √(SSE/n) and the Leong et al. (2025) R² formula are computed exactly as specified;
- an irrelevant input receives zero permutation importance.

## 2. Calibration against scikit-learn
Scripts: `tests/calibration/` (`python gen.py && node run_js.js && python run_sk.py`).
Two simulated datasets (n = 400, five correlated predictors): one linear, one with non-linear and interaction effects
(X1 linear, X2 tanh, X3 quadratic, X4 × X5 interaction). All software used **identical ten folds**, a 5–4–3–1 network,
standardized inputs and a 0–1 normalized output. scikit-learn's `MLPRegressor` has an identity output only.

### Linear data
| Software / setting | Predictive R² | Normalized importance X1 / X2 / X3 / X4 / X5 |
|---|---|---|
| SaNaSoft FFBP sigmoid/sigmoid (Leong) | 0.624 | 100.0 / 31.0 / 21.5 / 6.8 / 1.1 |
| SaNaSoft SCG sigmoid/sigmoid | 0.647 | 100.0 / 31.1 / 23.5 / 7.9 / 3.0 |
| SaNaSoft FFBP sigmoid/identity | 0.634 | 100.0 / 32.3 / 20.8 / 6.3 / 1.0 |
| SaNaSoft SCG sigmoid/identity | 0.646 | 100.0 / 28.6 / 20.8 / 5.8 / 0.9 |
| sklearn MLP logistic/identity, SGD | 0.620 | 100.0 / 28.2 / 20.0 / 5.0 / 0.1 |
| sklearn MLP logistic/identity, L-BFGS | 0.601 | 100.0 / 30.2 / 21.9 / 7.8 / 1.1 |
| sklearn MLP logistic/identity, Adam | 0.484 | 100.0 / 39.2 / 32.5 / 15.3 / 4.7 |
| OLS linear regression | 0.640 | – |

### Non-linear data
| Software / setting | Predictive R² | Normalized importance X1 / X2 / X3 / X4 / X5 |
|---|---|---|
| SaNaSoft FFBP sigmoid/sigmoid (Leong) | 0.500 | 100.0 / 35.5 / 27.3 / 10.8 / 17.9 |
| SaNaSoft SCG sigmoid/sigmoid | 0.551 | 100.0 / 32.6 / 31.9 / 30.4 / 31.7 |
| SaNaSoft FFBP sigmoid/identity | 0.517 | 100.0 / 39.5 / 31.8 / 14.6 / 21.3 |
| SaNaSoft SCG sigmoid/identity | 0.565 | 100.0 / 34.2 / 33.7 / 34.1 / 32.1 |
| sklearn MLP logistic/identity, SGD | 0.407 | 100.0 / 39.7 / 22.8 / 0.2 / 10.2 |
| sklearn MLP logistic/identity, L-BFGS | 0.499 | 100.0 / 33.9 / 30.3 / 51.3 / 43.4 |
| sklearn MLP logistic/identity, Adam | 0.360 | 100.0 / 45.2 / 31.6 / 2.0 / 18.2 |
| OLS linear regression | 0.450 | – |

### Interpretation
- On linear data all implementations agree closely with each other and with OLS, and all produce the same importance ranking.
- On non-linear data SaNaSoft-ANN attains a predictive R² equal to or higher than scikit-learn and higher than OLS, confirming that it captures non-linear effects.
- Importance of the two interaction-only predictors (X4, X5) depends on the optimiser: gradient-descent methods (SaNaSoft FFBP, scikit-learn SGD/Adam) under-estimate them, whereas second-order methods (SaNaSoft SCG, scikit-learn L-BFGS) recover them. **Recommendation:** report FFBP results as prescribed by Leong et al. (2025) and use SCG as a robustness check when the ranking of weaker predictors matters.

## 3. Comparison with IBM SPSS Neural Networks (planned)
Because SPSS does not expose its random initial weights, agreement is assessed statistically:
1. **Exact forward-pass check:** SPSS parameter estimates entered into SaNaSoft-ANN must reproduce SPSS predictions.
2. **Distributional check:** identical partitions (SPSS "use variable to assign cases"), ten networks each; compare mean RMSE, relative error and importance rankings (Kendall's τ), with pre-registered tolerances (e.g., RMSE within ±10%, τ ≥ .80).

Contributions of SPSS comparison results are very welcome — please open an issue.
