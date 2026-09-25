#!/usr/bin/env node
// Builds the single-file application (index.html) from the sources in src/.
// Usage: node build.js        → writes index.html
//        node build.js --check → fails if index.html is out of date (used by CI)
const fs = require('fs');
const path = require('path');
const src = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');

const head = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="SaNaSoft-ANN: free, guided artificial neural network analysis for PLS-SEM + ANN research, implementing Leong et al. (2025). Developed by Prof. S. Sabraz Nawaz and Prof. Ghazanfar Ali.">
<title>SaNaSoft-ANN: guided neural network analysis for PLS-SEM latent variable scores (developed by Prof. S. Sabraz Nawaz and Prof. Ghazanfar Ali)</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
`;

// The engine is embedded as plain text so it can be started inside a Web Worker.
const engine = src('engine.js').replace(/\nif\(typeof module!=='undefined'\)module\.exports=.*\n?/, '\n');
if (engine.includes('</script>')) throw new Error('engine.js must not contain </script>');

const appFiles = ['app-core.js', 'app-steps.js', 'app-results.js', 'app-report.js', 'tutorial.js'];
const out =
  head +
  src('styles/base.css') + src('styles/v2.css') +
  src('shell.html') +
  engine + '\n</script>\n<script>\n' +
  appFiles.map(src).join('\n') +
  '\n</script>\n</body>\n</html>\n';

const target = path.join(__dirname, 'index.html');
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (cur !== out) { console.error('index.html is out of date — run `node build.js` and commit the result.'); process.exit(1); }
  console.log('index.html is up to date.');
} else {
  fs.writeFileSync(target, out);
  console.log(`Built index.html (${out.split('\n').length} lines, ${(out.length / 1024).toFixed(0)} KB)`);
}
