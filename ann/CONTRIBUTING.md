# Contributing to SaNaSoft-ANN

SaNaSoft-ANN lives in the `ann/` folder of the SaNaSoft repository; run all commands below from `ann/`.

Thank you for helping improve SaNaSoft-ANN!

## Reporting problems
Open an [issue](https://github.com/samssabraznawaz/sanasoft/issues) and include:
- what you did (steps), what you expected and what happened;
- your browser and operating system;
- if possible, a small anonymised dataset or a saved project file (💾 *Save project*) that reproduces the problem.

## Making changes
1. Edit the files in `src/` — **never edit `index.html` directly**; it is generated.
2. Rebuild: `node build.js`
3. Test: `node --test tests/engine.test.js` and, for UI changes, `python tests/e2e/test_app.py`
4. Commit both `src/` and the rebuilt `index.html`, then open a pull request describing the change.

## Source layout
| File | Contents |
|---|---|
| `src/engine.js` | Neural network engine (training, sensitivity analysis, cross-validation). Runs in a Web Worker; must stay free of DOM code. |
| `src/app-core.js` | State, utilities, statistics, navigation, welcome and data import steps |
| `src/app-steps.js` | Models, partitioning, architecture, training, output and review steps |
| `src/app-results.js` | Worker bridge, job preparation, post-analyses and results rendering |
| `src/app-report.js` | Report generator, citation styles, project save/open, initialisation |
| `src/tutorial.js` | SPSS → SaNaSoft-ANN tutorial |
| `src/styles/` | CSS |

## Methodological changes
Changes that affect numerical results must include a test in `tests/engine.test.js` and a short justification
(with references) in the pull request, and should be noted in `CHANGELOG.md`.
