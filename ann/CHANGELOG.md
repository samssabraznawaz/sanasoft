# Changelog — SaNaSoft-ANN

## [2.0.0] – 2026-09-25

### Added
- New pure-JavaScript neural engine (Float64, seeded) running in a Web Worker; FFBP (gradient descent with momentum), scaled conjugate gradient (Møller, 1993) and Adam.
- Full Leong et al. (2025) procedure: ten networks via k-fold cross-validation (90/10), RMSE table (mean, SD), R² (predictive and Leong formula), averaged normalized importance.
- Multiple ANN models (one per endogenous construct) in one run.
- Automatic selection of hidden neurons.
- PLS-SEM vs ANN ranking comparison.
- SPSS-style case processing summary, model summary, parameter estimates and network diagram (SVG/PNG export).
- Training curves, predicted vs observed, residuals, linear-regression benchmark, RESET test, VIF, data screening.
- Report generator with APA-formatted tables in seven citation styles (APA 7th, APA 6th, Harvard, Emerald, Chicago, IEEE, Vancouver — aligned with SaNaSoft fsQCA); Word/HTML export; software citation added automatically.
- Project save/open, built-in demo data, one-click presets (Leong et al., SPSS defaults), SPSS tutorial.
- Unit tests, end-to-end test and calibration against scikit-learn.
- Published as part of the SaNaSoft repository at `/ann/`, with links to and from SaNaSoft fsQCA.

### Fixed (relative to 1.x)
- Dependent variable is now normalized to 0–1 when the output activation is sigmoid.
- Missing values are handled by listwise deletion instead of being replaced by 0.
- Relative error now follows the SPSS definition (SSE / total sum of squares).
- Importance is averaged over all networks instead of a single small test sample.
- Random seed is respected for reproducibility.
- Corrected the Leong et al. (2025) reference and DOI.

## [1.0.0] – 2026-09-24
- First version (TensorFlow.js based).
