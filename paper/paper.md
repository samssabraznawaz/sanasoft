---
title: 'SaNaSoft: Guided fuzzy-set QCA for PLS-SEM latent variable scores'
tags:
  - fsQCA
  - qualitative comparative analysis
  - PLS-SEM
  - configurational analysis
  - management research
authors:
  - name: S. Sabraz Nawaz Samsudeen
    orcid: 0000-0000-0000-0000
    affiliation: 1
  - name: Ghazanfar Ali
    orcid: 0000-0000-0000-0000
    affiliation: 2
affiliations:
  - name: "[Institution, Country]"
    index: 1
  - name: "[Institution, Country]"
    index: 2
date: 24 September 2026
bibliography: paper.bib
---

# Summary

Fuzzy-set qualitative comparative analysis (fsQCA) identifies combinations of conditions that are sufficient or necessary for an outcome [@ragin2008]. In management, marketing, tourism and information systems research it is increasingly combined with partial least squares structural equation modelling (PLS-SEM): PLS-SEM estimates the net effects of each construct, and fsQCA shows which configurations of the same constructs lead to high and low outcomes [@rasoolimanesh2021; @pappas2021]. SaNaSoft is a browser-based application that performs a complete fsQCA directly on the latent variable scores exported from SmartPLS. It guides researchers who know PLS-SEM but are new to fsQCA through every decision in plain language, and it produces the tables, fit statistics and methods text that journals expect.

# Statement of need

Established fsQCA software is powerful but assumes methodological expertise. The fsQCA program [@ragin2008] provides a graphical interface without guidance on calibration, thresholds or directional expectations, and the R packages QCA [@dusa2019] and SetMethods [@oana2021] require programming. Researchers moving from PLS-SEM face recurring questions that neither addresses directly: how to calibrate standardised latent variable scores, whether mediators and moderators belong in the analysis, which thresholds to choose, and how to report core and peripheral conditions, robustness and predictive validity. Inconsistent answers to these questions are a common weakness of applied PLS-SEM plus fsQCA studies.

SaNaSoft addresses this by translating the researcher's PLS-SEM model into a set of recommended fsQCA analyses. The user assigns each construct a role (dependent, independent, mediator or moderator) and indicates the structural paths. SaNaSoft then proposes one analysis per endogenous construct, includes moderators as ordinary conditions rather than interaction terms, and analyses mediators both as outcomes and as conditions. Each subsequent step states what to enter, pre-fills settings recommended in the literature, and explains technical terms in everyday language while showing the term used in publications.

# Functionality

SaNaSoft implements the direct method of calibration [@ragin2008] with percentile anchors suitable for standardised scores, offering both the fsQCA and the R QCA logistic conventions. It computes necessity consistency, coverage and relevance [@schneider2012], builds the truth table with raw consistency and PRI, and derives the complex, parsimonious and intermediate solutions using Quine–McCluskey minimisation with exhaustive enumeration of all minimal models. The intermediate solution follows the procedure implemented in the QCA package. Core and peripheral conditions are identified following @fiss2011. Enhanced Standard Analysis [@schneider2012] excludes contradictory simplifying assumptions and remainders that contradict necessary conditions. Additional tools report the cases covered by each configuration, draw XY plots, run a robustness check across alternative calibrations and thresholds, and test predictive validity with a subsample and holdout design [@pappas2021]. All computation runs locally in the browser, so survey data never leave the researcher's computer.

# Validation

The analysis engine was benchmarked against QCA 3.25.5 [@dusa2019] on six published fuzzy-set datasets, a real PLS-SEM dataset of 378 respondents and 90 simulated survey datasets with two to eight conditions and 60 to 1,000 cases, under a wide range of thresholds and directional expectations. Calibration, truth tables, necessity statistics, complex and parsimonious models, and all consistency and coverage measures agreed to within $10^{-14}$. Every intermediate solution was identical to one produced by R, and contradictory simplifying assumptions matched R's `findRows()` in all 97 comparable cases. The benchmark scripts are distributed with the software.

# Acknowledgements

[Funding and acknowledgements.] Development was assisted by Anthropic's Claude; all functionality was verified against the reference implementation as described above.

# References
