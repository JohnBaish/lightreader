const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const views = [['wide', 1200, 900, false], ['phone', 390, 844, true], ['side', 844, 390, true]];
  const looks = (process.argv[2] || 'ember').split(','), nights = (process.argv[3] || '0').split(',').map(Number);
  for (const [name, w, h, touch] of views) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await p.goto('file://' + __dirname + '/test.html'); await p.waitForTimeout(900);
    for (const l of looks) for (const n of nights) {
      await p.click(`#nights button:nth-child(${n + 1})`); await p.waitForTimeout(250);
      if (name === 'side' && (l !== looks[0] || n !== nights[0])) continue;
      if (process.argv[4]) { await p.evaluate(v => { const e = document.getElementById('ptime'); e.value = v; e.dispatchEvent(new Event('input')); }, process.argv[4]); }
      await p.screenshot({ path: `out/${name}-${l}-${n}.png`, fullPage: true });
    }
    const info = await p.evaluate(async () => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight) }));
    console.log(name, JSON.stringify(info), errs.length ? errs : 'no errors');
    await ctx.close();
  }
  await b.close();
})();
