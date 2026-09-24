# SaNaSoft

Guided fuzzy-set Qualitative Comparative Analysis (fsQCA) for researchers who already have a PLS-SEM model.

**Developed by Prof. S. Sabraz Nawaz and Prof. Ghazanfar Ali.**

SaNaSoft takes the standardised latent variable scores exported from SmartPLS and walks the researcher through a complete fsQCA in plain language: describing the model (dependent variables, independent variables, mediators, moderators), converting scores to set membership, testing must-have (necessary) conditions, building the truth table, and finding the recipes (configurations) that lead to high and low levels of each outcome. At every step it explains what to enter and recommends settings from the published methodological literature.

Its analysis engine has been benchmarked against the R package QCA 3.25.5 on 241 test cases and reproduces it exactly (see `validation/VALIDATION.md`).

## Features

- Accepts standardised latent variable scores, unstandardised scores or raw questionnaire items (CSV or Excel); groups items into constructs, handles reverse-coded items and higher-order constructs, and removes row numbers and SmartPLS interaction terms automatically
- Turns the SmartPLS model into suggested fsQCA analyses, including mediators and moderators
- Calibration with sample percentiles for standardised scores (95/50/5 recommended) or scale-based anchors for scores on the questionnaire scale (for example 6/4/2 on 1–7), matching either fsQCA 4.x or R QCA
- Necessary condition analysis with consistency, coverage and relevance (RoN)
- Truth table with recommended frequency, consistency and PRI thresholds
- Complex, parsimonious and intermediate solutions, core and peripheral conditions, all alternative models (model ambiguity)
- Enhanced Standard Analysis (contradictory simplifying assumptions and necessary-condition checks)
- Cases per configuration, XY plots, one-click robustness check, predictive validity test (subsample and holdout)
- Word report in APA 7th edition style (numbered tables and figures, editable Word tables, notes, XY plots, methods paragraph, references), Excel workbook with every table, and a full text report
- Save and reopen projects as files; work is also kept automatically in the browser
- Numbered file names that never overwrite earlier downloads: `SaNaSoft_1_Project_<data>.sanasoft.json`, `SaNaSoft_1_Report_<data>_<outcome>.docx`, `SaNaSoft_1_Results_<data>_<outcome>.xlsx`, then 2, 3 and so on for each kind of file
- Runs entirely in the browser: data never leave the user’s computer

## Running SaNaSoft

SaNaSoft is a single file, `index.html`. Open it in any modern browser (Chrome, Edge, Firefox, Safari). It needs no installation and no server.

It loads optional resources from the internet: web fonts from Google Fonts, SheetJS from cdnjs (for Excel files) and docx from jsDelivr (for Word reports, loaded only when a report is requested). Without an internet connection the analysis still works, using system fonts and accepting CSV files; the Word and Excel downloads need a connection the first time.

## Hosting SaNaSoft on its own website

Any static web host works, because there is nothing to run on the server.

**GitHub Pages (free).** Create a public GitHub repository, upload the contents of this folder, then open Settings → Pages, choose the main branch and the root folder, and save. The site appears at `https://<username>.github.io/<repository>/` within a few minutes.

**Netlify or Cloudflare Pages (free tiers).** Drag this folder onto the Netlify dashboard, or connect the GitHub repository. Either service gives you a web address and lets you attach your own domain.

**University web space.** Copy `index.html` to any folder your institution serves over the web.

To use your own domain name (for example `sanasoft.org`), buy it from any registrar and follow your host’s custom-domain instructions.

## Validation

`validation/VALIDATION.md` reports the benchmark against R QCA 3.25.5. `validation/benchmark/` contains the scripts to reproduce it; see the README there.

## Citing SaNaSoft

Samsudeen, S.N. and Ghazanfar, A.A. (2026), “SaNaSoft: Guided fsQCA for PLS-SEM latent variable scores”, Version 1.2, available at: https://claude.ai/artifact/UZhqVjLjtwhis75rAuUbnS

SaNaSoft shows this citation on its first page in six reference styles (APA 7th, Harvard, Emerald, Chicago author-date, IEEE and Vancouver), and adds it automatically to the methods paragraph, the Word report, the Excel workbook and the text report in the style the user selects. See also `CITATION.cff`. A draft software paper is in `paper/`.

## Changing the software link

The link used in every citation is set in one line near the top of the script in `index.html`:

    const SOFTWARE_URL='https://claude.ai/artifact/UZhqVjLjtwhis75rAuUbnS';

Replace it with the new address when SaNaSoft moves to its own website (for example GitHub Pages), and update `CITATION.cff` and the citation above to match. The version number is set in `APP_VERSION` on the line above it.

## Licence

MIT licence (see `LICENSE`). Copyright © 2026 Prof. S. Sabraz Nawaz and Prof. Ghazanfar Ali.
