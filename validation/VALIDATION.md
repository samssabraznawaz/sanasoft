# SaNaSoft validation report

**Software validated:** SaNaSoft, guided fsQCA for PLS-SEM latent variable scores (browser application, September 2026)
**Reference implementation:** R package QCA, version 3.25.5 (Duşa), built from its official source code, running on R 4.3.3
**Result:** SaNaSoft reproduces the reference implementation on every quantity tested.

## Why this validation matters

Researchers need to trust that SaNaSoft produces the same results as the established fsQCA software before they report its output in a paper. The R QCA package is the most complete and widely used fsQCA implementation, so every part of SaNaSoft's analysis engine was compared with it on identical data and settings.

## Benchmark design

The main benchmark contained 133 test cases in three groups; a further 108 cases tested Enhanced Standard Analysis.

**Published fsQCA datasets (36 cases).** Six fuzzy-set datasets distributed with the QCA package: Lipset's survival of democracy (LF), ethnic protest in Europe (CVF), class voting (NF), Hicks's welfare data (HC), Emmenegger's job security regulation (Emme) and Krook's women's representation (Krook). Each was analysed for the outcome and its negation under three settings: consistency cutoffs of 0.75, 0.80 and 0.85, with PRI cutoffs of 0, 0.5 and 0.7.

**Real survey data (7 cases).** Standardised SmartPLS latent variable scores from a study of 378 respondents (AAIR, HAIC, AIGM and BVC), calibrated with sample percentiles, analysed for high and low BVC under three PRI cutoffs and for HAIC.

**Simulated survey datasets (90 cases).** Standardised scores with 2 to 8 conditions, 60 to 1,000 respondents, three calibration schemes (95/50/5, 90/50/10 and 80/50/20 percentiles), consistency cutoffs from 0.75 to 0.85, PRI cutoffs from 0.5 to 0.75, frequency thresholds from 1 to 5, negated outcomes and mixed directional expectations (present, absent and no expectation).

Both programs received the same calibrated data and settings. Every truth table row, necessity statistic, solution and fit measure was compared automatically. Numbers were treated as equal when they differed by less than 0.000000001.

## Results

| What was compared | Cases | Agreement with R QCA | Largest numerical difference |
|---|---|---|---|
| Calibration, fsQCA 4.x standard (0.953) and R standard (0.95) | 1,512 values | All identical | 0.0000000000000008 |
| Truth table: cases per row, raw consistency, PRI, output code | 130 cases, 6,784 rows | All identical | 0.0000000000000008 |
| Necessity: consistency, coverage, relevance (RoN) | 130 cases | All identical | 0.0000000000000006 |
| Complex (conservative) solution: all minimal models | 117 cases | 117 identical | — |
| Parsimonious solution: all minimal models | 117 cases | 116 identical; 1 capped (see below) | — |
| Consistency, raw and unique coverage of solution terms | All comparable cases | All identical | 0.0000000000000014 |
| Intermediate solution | 105 cases | 91 identical to R's first solution; 14 identical to another of R's equally valid solutions; 0 different | 0.0000000000000010 |
| Enhanced Standard Analysis: contradictory simplifying assumptions (R `findRows(type = 2)`) | 97 cases (42 with at least one) | All identical | — |
| Solutions after excluding contradictory assumptions | 97 cases | Parsimonious models all identical; intermediate solution within R's set in all 97 | — |

Of the remaining cases, 13 had no configuration passing the cutoffs; both programs correctly reported no solution. For one further case, R declined to build a truth table because no row passed the cutoffs, and SaNaSoft likewise found no sufficient rows.

On the published Lipset data, SaNaSoft reproduces the well-known intermediate solution DEV·URB·LIT·STB + DEV·LIT·~IND·STB.

## Enhanced Standard Analysis

SaNaSoft applies Schneider and Wagemann's (2012) Enhanced Standard Analysis by default. It excludes two kinds of simplifying assumptions: contradictory simplifying assumptions (remainders used by the parsimonious solutions of both the outcome and its negation, identified exactly as R QCA's `findRows(type = 2)`), and remainders that contradict a necessary condition with consistency of at least 0.90 and relevance of at least 0.50. The first part was benchmarked against R on all 97 comparable cases with up to six conditions and agreed in every case. The second part has no automatic equivalent in R, so it was checked by construction: excluded rows are exactly the remainders in which a necessary condition takes the opposite value. Users can switch Enhanced Standard Analysis off to reproduce a standard analysis.

## Problems found during validation and how they were fixed

The benchmark revealed two errors in earlier versions of SaNaSoft. Both were fixed, and the full benchmark was rerun on the final version.

**Alternative models were under-reported.** When several equally simple solutions fit the data (model ambiguity), SaNaSoft found only some of them; in one case it reported 2 and 4 models where R reported 5 and 88. The search was rewritten to find every minimal model, as R does. SaNaSoft now also lets users choose among them and reports the ambiguity in the methods paragraph.

**The intermediate solution was sometimes too complex.** Earlier versions simplified each complex term on its own. The corrected version follows the procedure in the QCA package's source code: for every complex term and every parsimonious term contained in it, conditions that contradict the directional expectation are removed, and the resulting terms are then minimised together. Conditions marked "Not sure" are never used for simplifying assumptions, which is the conservative choice and matches R.

## Known differences and limitations

**Choice among equally valid intermediate solutions.** When model ambiguity is present, R and SaNaSoft may show a different solution first; in 14 cases SaNaSoft's default was another of R's valid solutions. Users can select any version in SaNaSoft, and the methods paragraph states which one is reported.

**Very large numbers of alternative models.** SaNaSoft lists up to 500 equally simple models. In one simulated 8-condition case, R found 704; SaNaSoft marks such results as "500+".

**Features not yet included.** Exclusion of logically impossible (untenable) remainders specified by the researcher, conjunctural directional expectations, and crisp-set, multi-value and temporal QCA are not implemented. SaNaSoft currently accepts only standardised latent variable scores.

**Robustness and predictive validity tools.** These use SaNaSoft's validated engine. The robustness check follows common practice (alternative percentile anchors, consistency, PRI and frequency thresholds). The predictive test follows Pappas and Woodside's (2021) subsample and holdout approach, with a fixed random seed so results are reproducible.

## Reproducing this validation

The benchmark consists of a dataset generator, one runner for SaNaSoft's engine, one for R QCA 3.25.5, and a comparison script. Any researcher can repeat the check on their own data: SaNaSoft's "Copy converted scores" button gives the exact calibrated values it uses, which can be analysed in fsQCA 4.x or R with the same settings.

## References

Duşa, A. (2019). *QCA with R: A comprehensive resource*. Springer.
Pappas, I. O., & Woodside, A. G. (2021). Fuzzy-set qualitative comparative analysis (fsQCA): Guidelines for research practice in information systems and marketing. *International Journal of Information Management, 58*, 102310.
Ragin, C. C. (2008). *Redesigning social inquiry: Fuzzy sets and beyond*. University of Chicago Press.
Schneider, C. Q., & Wagemann, C. (2012). *Set-theoretic methods for the social sciences: A guide to qualitative comparative analysis*. Cambridge University Press.
Ragin, C. C., & Sonnett, J. (2005). Between complexity and parsimony: Limited diversity, counterfactual cases, and comparative analysis. In S. Kropp & M. Minkenberg (Eds.), *Vergleichen in der Politikwissenschaft* (pp. 180–197). VS Verlag.
