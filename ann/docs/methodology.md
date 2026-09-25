# Methodology

This document describes exactly what SaNaSoft-ANN computes, so that results can be reported and reviewed transparently.

## 1. Data preparation
- **Missing values:** listwise deletion per model — a case is excluded from a model only if one of that model's variables is missing (as in SPSS). Excluded cases are reported in the Case Processing Summary.
- **Factors** (categorical inputs) are one-of-c (dummy) coded with one column per category; in the sensitivity analysis all dummy columns of a factor are permuted together, so each factor receives a single importance value.
- **Rescaling** uses the analysis sample (all non-holdout cases):
  - covariates: standardized (default), normalized (0–1), adjusted normalized (−1 to 1) or none;
  - dependent variable: normalized to 0–1 for a sigmoid output (required, because a sigmoid neuron can only produce values in that range), adjusted normalized for a tanh output, or the chosen method for an identity output.
  SSE and RMSE are reported in these rescaled units, as in SPSS.

## 2. Partitioning
- A holdout sample (optional) is set aside first.
- **k-fold cross-validation (default, k = 10):** the remaining cases are shuffled with the random seed and divided into k near-equal folds; network *k* is tested on fold *k* and trained on the others. With k = 10 each network uses 90% training / 10% testing and every case is tested exactly once (Leong et al., 2025).
- **Repeated random splits:** each network receives an independent random split with the chosen percentages.

## 3. Network
Multilayer perceptron with one or two hidden layers. Activation functions: sigmoid (default), hyperbolic tangent, ReLU (hidden); sigmoid (default), identity, tanh (output). Initial weights are drawn uniformly from *center ± offset* (default 0 ± 0.5, as SPSS).

**Automatic hidden neurons.** Candidate architectures (layer 1 ∈ {1, 2, 3, 4, 5, 6, 8, …} up to the chosen maximum; layer 2 ≤ layer 1) are trained on the first two data splits (max. 400 epochs). The smallest network whose mean testing MSE is within 2% of the best candidate is selected and then used for all networks.

## 4. Training
Error function: E = ½·SSE/n (+ ½·λ·Σw² if L2 weight decay is used; biases are not penalised).
- **FFBP** (default): back-propagation (Rumelhart et al., 1986) with gradient descent and momentum; batch (default), mini-batch or online. Default learning rate 1.0 applied to the mean-error gradient, momentum 0.9. For mini-batch/online training the learning rate decreases towards a lower bound as in SPSS.
- **SCG:** scaled conjugate gradient (Møller, 1993), batch only; initial λ = 5·10⁻⁷, σ = 5·10⁻⁵ (SPSS defaults).
- **Adam** (Kingma & Ba, 2015), learning rate 0.01.

**Stopping rules:** training stops when the testing-sample error has not decreased for *patience* epochs (default 100, counted only after a minimum of 300 epochs to avoid stopping on the initial plateau of sigmoid networks), when the relative change in training error over 50 epochs falls below 10⁻⁵, at the maximum number of epochs (3000), or at the time limit. The weights with the lowest testing error are retained. Because the testing sample guides early stopping (as in SPSS), testing errors are slightly optimistic; a holdout sample provides a fully independent estimate.

## 5. Fit measures
For each network and sample (training, testing, holdout):
- SSE = Σ(y − ŷ)²; **RMSE = √(SSE/n)** (Leong et al., 2025);
- relative error = SSE / Σ(y − ȳ)² (SPSS definition); 1 − relative error is the R² of that sample.

Across networks: mean and SD of RMSE.

**R².** Two values are reported:
- **Predictive R²** = 1 − SSE/SST computed over all held-out cases (k-fold: every case is predicted once by the network that did not see it); for random splits, the mean testing R².
- **Leong et al. (2025) formula, as printed (pp. 731–732):** R² = 1 − ΣRMSE_testing / (k × S²_y), with S²_y = ΣSSE_testing / k. This value can differ considerably from the predictive R²; report the formula you use.

## 6. Sensitivity analysis (variable importance)
For each network, on its combined training and testing sample: the values of one predictor (or all dummy columns of one factor) are randomly permuted and the increase in SSE is recorded (mean of *r* permutations, default 10; negative values set to 0) — permutation importance (Breiman, 2001). Relative importance = increase / sum of increases (so it sums to 1 per network, like SPSS). Following Leong et al. (2025): **average relative importance** = mean over the k networks; **normalized importance** = average ÷ largest average × 100%.

## 7. Additional analyses (main thread)
- **Linear benchmark:** ordinary least squares on exactly the same training/testing splits (same rescaled units), giving testing RMSE and predictive R² for comparison.
- **Ramsey RESET test:** adds ŷ² and ŷ³ (standardized) to the linear model; F-test with (2, n − p − 3) df.
- **VIF** from the inverse correlation matrix of the covariates; descriptive statistics with bias-corrected skewness and excess kurtosis.

## References
- Breiman, L. (2001). Random forests. *Machine Learning, 45*(1), 5–32. https://doi.org/10.1023/A:1010933404324
- Kingma, D. P., & Ba, J. (2015). Adam: A method for stochastic optimization. *ICLR 2015*. https://arxiv.org/abs/1412.6980
- Leong, L.-Y., Hew, T.-S., Ooi, K.-B., Tan, G. W.-H., & Koohang, A. (2025). An SEM-ANN approach – Guidelines in information systems research. *Journal of Computer Information Systems, 65*(6), 706–737. https://doi.org/10.1080/08874417.2024.2329128
- Møller, M. F. (1993). A scaled conjugate gradient algorithm for fast supervised learning. *Neural Networks, 6*(4), 525–533. https://doi.org/10.1016/S0893-6080(05)80056-5
- Ramsey, J. B. (1969). Tests for specification errors in classical linear least-squares regression analysis. *Journal of the Royal Statistical Society: Series B, 31*(2), 350–371. https://doi.org/10.1111/j.2517-6161.1969.tb00796.x
- Rumelhart, D. E., Hinton, G. E., & Williams, R. J. (1986). Learning representations by back-propagating errors. *Nature, 323*(6088), 533–536. https://doi.org/10.1038/323533a0
