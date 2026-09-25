"""End-to-end browser test of SaNaSoft-ANN (index.html).

    pip install playwright && python -m playwright install chromium
    python tests/e2e/test_app.py

Loads the built-in demo data, runs the full analysis, visits every result tab,
generates the report in all citation styles and fails on any JavaScript error.
"""
import asyncio, json, os, pathlib, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
URL = (ROOT / 'index.html').as_uri()


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1400, 'height': 1000})
        libs = os.environ.get('SANASOFT_LIBS')  # optional: folder with local copies of the CDN libraries (offline testing)
        if libs:
            for pat, f in [('**/papaparse.min.js', 'papaparse.min.js'), ('**/xlsx.full.min.js', 'xlsx.full.min.js'), ('**/chart.umd.min.js', 'chart.umd.min.js')]:
                def serve(path):
                    return lambda route: route.fulfill(path=path, content_type='text/javascript')
                await page.route(pat, serve(os.path.join(libs, f)))
            await page.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        await page.goto(URL)
        await page.wait_for_function("typeof Papa !== 'undefined' && typeof Chart !== 'undefined'", timeout=30000)

        await page.evaluate('loadDemo()')
        await page.evaluate('goStep(7)')
        await page.evaluate('runAnalysis()')
        await page.wait_for_function('APP.step === 8', timeout=180000)
        mode = await page.evaluate('APP.engineMode')
        secs = await page.evaluate('APP.results.ms / 1000')
        print(f'analysis finished in {secs:.1f} s ({mode})')

        for tab in await page.evaluate('resultTabs(RM())'):
            await page.evaluate(f'APP.resTab = {json.dumps(tab)}; renderStep()')
            await page.wait_for_timeout(150)

        await page.evaluate('goStep(9)')
        for style in ['apa7', 'apa6', 'harvard', 'emerald', 'chicago', 'ieee', 'vancouver']:
            await page.evaluate(f"APP.settings.report.style = '{style}'; generateReport()")
            text = await page.inner_text('#report-output')
            assert 'Leong' in text and 'References' in text, style

        summary = await page.evaluate(
            "APP.results.models.map(m => ({name: m.name, r2: m.summary.r2Pred, top: m.groups[m.summary.normImportance.indexOf(100)]}))")
        print(json.dumps(summary, indent=1))
        assert all(m['r2'] > 0.3 for m in summary), 'unexpectedly low predictive R²'
        await browser.close()
        if errors:
            print('JavaScript errors:', errors)
            sys.exit(1)
        print('E2E OK')


asyncio.run(main())
