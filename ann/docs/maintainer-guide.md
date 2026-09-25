# Maintainer guide — SaNaSoft-ANN

SaNaSoft-ANN is the `ann/` folder of https://github.com/samssabraznawaz/sanasoft. The fsQCA tool in the repository
root is not touched by anything in this folder.

## Adding SaNaSoft-ANN to the repository (first time)

The download `sanasoft-ann-upload.zip` contains exactly three items to add to the **root** of the repository:

| Item | What it is |
|---|---|
| `ann/` | the whole ANN tool (new folder) |
| `.github/workflows/ann-tests.yml` | automatic tests for the ANN tool (new file; runs only when `ann/` changes) |
| `README.md` | your existing README with a short *SaNaSoft-ANN* section added (replaces the current README) |

**In the browser:**
1. Unzip the file.
2. On GitHub open the repository → **Add file → Upload files**.
3. Drag the `ann` folder, the `.github` folder and `README.md` onto the page (show hidden files first so you can see `.github`: ⌘⇧. on macOS, *View → Hidden items* on Windows). Existing files are not deleted; only `README.md` is replaced.
4. Commit message `Add SaNaSoft-ANN 2.0` → **Commit changes**.

If `.github` will not upload, create it by hand: **Add file → Create new file**, name `.github/workflows/ann-tests.yml`, paste the contents.

**With git:** copy the three items into your local clone, then `git add ann .github README.md && git commit -m "Add SaNaSoft-ANN 2.0" && git push`.

GitHub Pages already serves the repository, so after about a minute the tool is live at
**https://samssabraznawaz.github.io/sanasoft/ann/** — no settings to change.

## Everyday changes
Edit `ann/src/`, then from `ann/` run `node build.js` and `npm test`; commit `src/` **and** `index.html`.
The *ANN tests* workflow fails if `index.html` was not rebuilt.

## Version and citation
Change the version in `src/app-core.js` (`VERSION`), `src/shell.html` (header badge), `package.json` and `CHANGELOG.md`;
the citation link in `src/app-report.js` (`SOFTWARE_URL`).

## Releases and DOI
Repository releases (and a Zenodo DOI, if enabled) cover the whole repository, i.e. both tools. If you want a separate
DOI for the ANN tool, mention both tools in the release notes or archive the `ann/` folder separately on Zenodo.
