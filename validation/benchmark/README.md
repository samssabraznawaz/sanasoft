# Reproducing the SaNaSoft benchmark

These scripts compare SaNaSoft's analysis engine (`engine.js`, extracted verbatim from `index.html`) with the R package QCA.

## Requirements

- Node.js 18 or later
- R 4.3 or later with the QCA package (tested with version 3.25.5): `install.packages("QCA")`
- Python 3.9 or later (standard library only)

## Steps

1. Export the published datasets from R:
   `Rscript -e 'library(QCA); for (n in c("LF","CVF","NF","HC","Emme","Krook")) { d <- get(data(list=n)); d <- data.frame(lapply(d, function(x) as.numeric(unclass(x)))); write.csv(d, paste0("data/pub_",n,".csv"), row.names=FALSE) }'`
   (create the `data`, `js` and `r` folders first)
2. Generate the synthetic datasets and the manifest: `node gen.js`, then write `manifest.tsv` from `manifest.json` (one tab-separated row per case: id, file, outcome, conditions, negate, incl, pri, freq, dir).
3. Run SaNaSoft's engine: `node run_js.js`
4. Run R QCA: `Rscript run_r.R` (resumable; slow cases have a 40-second limit)
5. Compare: `python3 compare.py`
6. Enhanced Standard Analysis: filter the manifest to cases with up to six conditions as `manifest_esa.tsv`, create the `esa_js` and `esa_r` folders, then run `node esa_js.js` and `Rscript esa_r.R`.

The original study's latent variable scores used in the published validation are not distributed with this package.
