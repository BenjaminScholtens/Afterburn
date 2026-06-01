import { expect, test } from '@playwright/test';

test.describe('Tutorial shell', () => {
  test('home lists all 9 chapters', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Build a Collaborative Canvas Game' })).toBeVisible();
    for (let i = 1; i <= 9; i++) {
      await expect(page.getByRole('link', { name: new RegExp(`Chapter ${i}`) })).toBeVisible();
    }
  });

  test('chapter navigation works', async ({ page }) => {
    await page.goto('/chapter/1');
    await expect(page.getByRole('heading', { name: 'Project setup' })).toBeVisible();
    await page.getByRole('link', { name: '4', exact: true }).click();
    await expect(page).toHaveURL('/chapter/4');
    await expect(page.getByRole('heading', { name: 'Canvas coordinates' })).toBeVisible();
  });
});

test.describe('Chapter 1 — connectivity', () => {
  test('dev-tier APIs are reachable via local proxy', async ({ page }) => {
    await page.goto('/chapter/1');
    await page.getByRole('button', { name: 'Re-check connectivity' }).click();
    await expect(page.locator('.check-list li.pass', { hasText: 'Management API reachable' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('.check-list li.pass', { hasText: 'Game API reachable' })).toBeVisible();
  });
});

test.describe('Chapter 2 — guest auth', () => {
  test('auto-registers a guest on visit', async ({ page }) => {
    await page.goto('/chapter/2');
    await expect(page.locator('.check-list li.pass', { hasText: 'Bearer token stored' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('.check-list li.pass', { hasText: 'User ID assigned' })).toBeVisible();
    await expect(page.locator('.check-list li.pass', { hasText: 'Guest email generated' })).toBeVisible();
  });
});

test.describe('Chapter 4 — coordinates', () => {
  test('hovering canvas shows chunk and voxel coords', async ({ page }) => {
    await page.goto('/chapter/4');
    const canvas = page.locator('.demo-pane canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(page.locator('.status-panel dt', { hasText: 'Chunk' })).toBeVisible();
    await expect(page.locator('.check-list li.pass', { hasText: 'Hover shows chunk/voxel coords' })).toBeVisible({
      timeout: 5_000,
    });
  });
});

test.describe('Chapter 3 — UDP bootstrap', () => {
  test('connects and opens UDP subscription', async ({ page }) => {
    await page.goto('/chapter/3');
    await expect(page.locator('.check-list li.pass', { hasText: 'gameClientBootstrap succeeded' })).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.locator('.check-list li.pass', { hasText: 'UDP proxy connected' })).toBeVisible({
      timeout: 25_000,
    });
  });
});

test.describe('Full game route', () => {
  test('/play loads collaborative canvas', async ({ page }) => {
    await page.goto('/play');
    await expect(page.getByRole('heading', { name: 'Collaborative Canvas' })).toBeVisible();
    await expect(page.locator('.demo-pane canvas')).toBeVisible();
    await expect(page.locator('.palette button')).toHaveCount(5);
  });

  test('two browser contexts see shared peer state', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await Promise.all([pageA.goto('/play'), pageB.goto('/play')]);

    const canvasA = pageA.locator('.demo-pane canvas');
    const canvasB = pageB.locator('.demo-pane canvas');
    await expect(canvasA).toBeVisible();
    await expect(canvasB).toBeVisible();

    const boxA = await canvasA.boundingBox();
    const boxB = await canvasB.boundingBox();
    expect(boxA).not.toBeNull();
    expect(boxB).not.toBeNull();

    await pageA.mouse.move(boxA!.x + 80, boxA!.y + 80);
    await pageB.mouse.move(boxB!.x + boxB!.width - 80, boxB!.y + boxB!.height - 80);

    await expect
      .poll(async () => Number(await pageA.getByTestId('peer-count').textContent()), {
        timeout: 25_000,
      })
      .toBeGreaterThanOrEqual(1);
    await expect
      .poll(async () => Number(await pageB.getByTestId('peer-count').textContent()), {
        timeout: 25_000,
      })
      .toBeGreaterThanOrEqual(1);

    await contextA.close();
    await contextB.close();
  });

  test('two browser contexts see shared paint', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await Promise.all([pageA.goto('/play'), pageB.goto('/play')]);

    const canvasA = pageA.locator('.demo-pane canvas');
    const canvasB = pageB.locator('.demo-pane canvas');
    await expect(canvasA).toBeVisible();
    await expect(canvasB).toBeVisible();

    const boxA = await canvasA.boundingBox();
    expect(boxA).not.toBeNull();

    const before = Number(await pageB.getByTestId('paint-count').textContent());
    await pageA.mouse.click(boxA!.x + 120, boxA!.y + 120);

    await expect
      .poll(async () => Number(await pageB.getByTestId('paint-count').textContent()), {
        timeout: 10_000,
      })
      .toBeGreaterThan(before);

    await contextA.close();
    await contextB.close();
  });
});
