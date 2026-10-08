import { test, expect, type Page } from '@playwright/test';

const vtNames = (page: Page) =>
  page.$$eval('*', (els) =>
    els
      .map((e) => getComputedStyle(e).viewTransitionName)
      .filter((n) => n && n !== 'none' && n !== 'root'),
  );

test('html.js and the cross-document view-transition rules are present', async ({ page }) => {
  await page.goto('/en/about');
  await expect(page.locator('html')).toHaveClass(/\bjs\b/);
  const css = await page.evaluate(() =>
    [...document.styleSheets]
      .flatMap((s) => {
        try {
          return [...s.cssRules].map((r) => r.cssText);
        } catch {
          return [];
        }
      })
      .join('\n'),
  );
  expect(css).toMatch(/@view-transition\s*\{\s*navigation:\s*auto/);
  expect(css).toMatch(
    /::view-transition-new\(root\)[^{]*\{[^}]*animation-duration:\s*var\(--dur-fade\)/,
  );
});

for (const url of ['/en', '/en/work', '/en/work/churchapp', '/es/proyectos/chapel']) {
  test(`${url}: view-transition names are unique`, async ({ page }) => {
    await page.goto(url);
    const names = await vtNames(page);
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);
  });
}

test('a work card and its case header share sheet-{id}', async ({ page }) => {
  await page.goto('/en/work');
  const card = page.locator('a.card.grid').first();
  const name = await card.evaluate((e) => getComputedStyle(e).viewTransitionName);
  expect(name).toMatch(/^sheet-fm-\d\d$/);
  await page.goto((await card.getAttribute('href'))!);
  await expect(page.locator('.case-frame')).toHaveCSS('view-transition-name', name);
});

test.describe('D06 theme', () => {
  const toggle = (page: Page) => page.locator('.theme-toggle:visible').first();
  const theme = (page: Page) =>
    page.evaluate(() => [document.documentElement.dataset.theme, localStorage.getItem('theme')]);

  test('flips with view transitions and clears theme-reveal', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/en/about');
    await toggle(page).click();
    expect(await theme(page)).toEqual(['dark', 'dark']);
    await expect(page.locator('html')).not.toHaveClass(/theme-reveal/);
  });

  test('with motion on, the reveal runs (theme-reveal set, then cleared)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/en/about');
    await page.evaluate(() => {
      new MutationObserver(() => {
        if (document.documentElement.classList.contains('theme-reveal'))
          (window as unknown as { sawReveal?: boolean }).sawReveal = true;
      }).observe(document.documentElement, { attributes: true });
    });
    await toggle(page).click();
    await expect(page.locator('html')).not.toHaveClass(/theme-reveal/);
    expect(
      await page.evaluate(() => (window as unknown as { sawReveal?: boolean }).sawReveal),
    ).toBe(true);
  });

  test('a fast double click ends consistent', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/en/about');
    await toggle(page).click();
    await toggle(page).click();
    await expect(page.locator('html')).not.toHaveClass(/theme-reveal/);
    const [attr, stored] = await theme(page);
    expect(attr).toBe(stored);
    expect(attr).toBe('light');
  });

  test('without the API it flips instantly', async ({ page }) => {
    await page.addInitScript(() => {
      // @ts-expect-error simulate a browser without View Transitions
      document.startViewTransition = undefined;
    });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/en/about');
    await toggle(page).click();
    expect(await theme(page)).toEqual(['dark', 'dark']);
  });

  test('reduced motion never adds theme-reveal', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto('/en/about');
    await page.evaluate(() => {
      new MutationObserver(() => {
        if (document.documentElement.classList.contains('theme-reveal'))
          (window as unknown as { sawReveal?: boolean }).sawReveal = true;
      }).observe(document.documentElement, { attributes: true });
    });
    await toggle(page).click();
    expect(await theme(page)).toEqual(['dark', 'dark']);
    expect(
      await page.evaluate(() => (window as unknown as { sawReveal?: boolean }).sawReveal),
    ).toBeUndefined();
  });
});

test.describe('D07 language swap', () => {
  const sectionTop = (page: Page, i: number) =>
    page.evaluate(
      (i) => document.querySelectorAll('main section')[i].getBoundingClientRect().top,
      i,
    );

  test('lands on the same section of the twin page', async ({ page }) => {
    await page.goto('/en');
    await page.evaluate(() => {
      const el = document.querySelectorAll('main section')[1] as HTMLElement;
      scrollTo(0, el.getBoundingClientRect().top + scrollY + 40);
    });
    await page.locator('.lang-switch a[data-lang="es"]:visible').first().click();
    await expect(page).toHaveURL(/\/es\/?$/);
    await expect.poll(() => sectionTop(page, 1)).toBeLessThan(-35);
    expect(await sectionTop(page, 1)).toBeGreaterThan(-45);
  });

  test('from the top it opens at the top and leaves nothing behind', async ({ page }) => {
    await page.goto('/en/about');
    await page.locator('.lang-switch a[data-lang="es"]:visible').first().click();
    await expect(page).toHaveURL(/\/es\/sobre-mi\/?$/);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    expect(await page.evaluate(() => sessionStorage.getItem('fm-lang-swap'))).toBeNull();
  });
});

test.describe('D03 Home signature', () => {
  test('plays once per session, on Home only, never hiding the h1', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('html')).toHaveClass(/\bsig\b/);
    await expect(page.locator('.hero .edge')).toHaveCount(4);
    await expect(page.locator('.hero .edge-t')).toHaveCSS('display', 'block');
    expect(await page.locator('.hero h1').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    await page.goto('/en/about');
    await expect(page.locator('html')).not.toHaveClass(/\bsig\b/);
    await page.goto('/en');
    await expect(page.locator('html')).not.toHaveClass(/\bsig\b/);
  });

  test('reduced motion skips the drawing', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/es');
    await expect(page.locator('.hero .edge-t')).toHaveCSS('display', 'none');
    await expect(page.locator('.hero')).not.toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
  });
});

test.describe('D08 mobile menu', () => {
  test.use({ viewport: { width: 375, height: 740 } });
  const btn = (page: Page) => page.locator('.menu-btn:visible').first();
  const panel = (page: Page) => page.locator('#site-menu');

  test('opens and closes with the animation, Escape included', async ({ page }) => {
    await page.goto('/en/about');
    await btn(page).click();
    await expect(btn(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(panel(page)).toBeVisible();
    await btn(page).click();
    await expect(btn(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(panel(page)).toBeHidden();
    await btn(page).click();
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden();
  });

  test('opening and closing are animated (clip from the top)', async ({ page }) => {
    await page.goto('/en/about');
    await btn(page).click();
    const opening = await panel(page).evaluate((e) =>
      e.getAnimations().map((a) => Object.keys((a.effect as KeyframeEffect).getKeyframes()[0])),
    );
    expect(opening.flat()).toContain('clipPath');
    await page.waitForTimeout(300);
    await btn(page).click();
    expect(await panel(page).evaluate((e) => (e as HTMLElement).hidden)).toBe(false);
    await expect(panel(page)).toBeHidden();
  });

  test('a double tap ends in a consistent state', async ({ page }) => {
    await page.goto('/en/about');
    await btn(page).dblclick();
    await expect(btn(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(panel(page)).toBeHidden();
  });

  test('growing to desktop mid-animation closes it cleanly', async ({ page }) => {
    await page.goto('/en/about');
    await btn(page).click();
    await page.setViewportSize({ width: 1300, height: 740 });
    await expect(panel(page)).toBeHidden();
    await expect(page.locator('.menu-btn').first()).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('D04 Home cards entrance', () => {
  test.use({ viewport: { width: 1280, height: 500 } }); // keeps the cards below the fold
  const first = (page: Page) => page.locator('.cases [data-reveal]').first();

  test('only Home uses data-reveal', async ({ page }) => {
    for (const url of ['/en/services', '/en/work', '/en/about', '/en/pricing']) {
      await page.goto(url);
      await expect(page.locator('[data-reveal]')).toHaveCount(0);
    }
  });

  test('cards rise in once when scrolled into view', async ({ page }) => {
    await page.goto('/en');
    await expect(first(page)).toHaveCSS('opacity', '0');
    await first(page).scrollIntoViewIfNeeded();
    await expect(first(page)).toHaveClass(/is-in/);
    await expect(first(page)).toHaveCSS('opacity', '1');
  });

  test('a #hash and print show them immediately', async ({ page }) => {
    await page.goto('/en#contact');
    await expect(first(page)).toHaveClass(/is-in/);
    await page.goto('/en');
    await page.emulateMedia({ media: 'print' });
    await expect(first(page)).toHaveCSS('opacity', '1');
  });

  test('reduced motion: no translation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/en');
    const t = await first(page).evaluate((e) => getComputedStyle(e).transform);
    expect(t).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  });
});

test.describe('D04 without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1280, height: 500 } });
  test('cards are visible', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('.cases [data-reveal]').first()).toHaveCSS('opacity', '1');
  });
});

test.describe('D11 / D15 drawings', () => {
  test('404 diagonals draw progressively (the clip interpolates)', async ({ page }) => {
    await page.goto('/en/nope-404');
    const mid = await page
      .locator('.sheet svg path')
      .first()
      .evaluate((p) => {
        const a = p.getAnimations()[0];
        a.pause();
        a.currentTime = 300; // halfway through --dur-draw
        return getComputedStyle(p).clipPath;
      });
    expect(mid).toMatch(/^inset\(0px \d+(\.\d+)?% \d+(\.\d+)?% 0px\)$/);
    expect(mid).not.toBe('inset(0px 100% 100% 0px)');
  });

  test('404 diagonals stay solid lines (non-scaling-stroke ignores pathLength)', async ({
    page,
  }) => {
    await page.goto('/en/nope-404');
    for (const path of await page.locator('.sheet svg path').all())
      await expect(path).toHaveCSS('stroke-dasharray', 'none');
  });

  for (const [url, sel] of [
    ['/en/contact/sent', '.sent svg path'],
    ['/en/nope-404', '.sheet svg path'],
  ] as const) {
    test(`${url}: strokes draw, and are static under reduced motion`, async ({ page }) => {
      await page.goto(url);
      const path = page.locator(sel).first();
      if (url.includes('sent')) await expect(path).toHaveAttribute('pathLength', '1');
      expect(await path.evaluate((e) => getComputedStyle(e).animationName)).not.toBe('none');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();
      expect(await path.evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
    });
  }

  test('the sent panel only moves; it is never transparent', async ({ page }) => {
    await page.goto('/en/contact/sent');
    expect(await page.locator('.sent').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  });
});
