import { test, expect, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 390, height: 844 },
});

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    indexedDB.deleteDatabase('scriptor');
    indexedDB.deleteDatabase('scriptor-share');
  });
  await context.close();
});

async function waitApp(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('page-header')).toBeVisible();
}

test('1 home pessoal com geral, def, leite e HMI com link', async ({ page }) => {
  await waitApp(page);
  await expect(page.getByTestId('page-header')).toContainText('pessoal');
  await expect(page.getByTestId('section-geral')).toBeVisible();
  await expect(page.getByTestId('section-def')).toBeVisible();
  await expect(page.getByTestId('note-leite')).toBeVisible();
  await expect(page.getByTestId('note-hmi')).toBeVisible();
  await expect(page.getByTestId('note-hmi').locator('a')).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(0);
});

test('2 mais em def foca chip def', async ({ page }) => {
  await waitApp(page);
  await page.getByTestId('section-def').getByRole('button', { name: /Adicionar/ }).click();
  await expect(page.getByTestId('composer-chip')).toContainText('def');
  await expect(page.locator('[data-testid="composer"] textarea')).toBeFocused();
});

test('3 chip muda destino e hash cria secao', async ({ page }) => {
  await waitApp(page);
  await page.getByTestId('composer-chip').click();
  await expect(page.getByTestId('overlay-sheet')).toBeVisible();
  await page.getByRole('button', { name: '#def' }).click();
  await expect(page.getByTestId('composer-chip')).toHaveText('#def');
  await page.locator('[data-testid="composer"] textarea').fill('nota no def');
  await page.getByTestId('composer-send').click();
  await expect(page.getByTestId('section-def').getByTestId('note-nota-no-def')).toBeVisible();

  await page.locator('[data-testid="composer"] textarea').fill('#compras');
  await page.getByTestId('composer-send').click();
  await expect(page.getByTestId('section-compras')).toBeVisible();
});

test('4 mais do compositor, enter nao envia, seta envia', async ({ page }) => {
  await waitApp(page);
  await page.getByTestId('composer').getByRole('button', { name: 'Mais' }).click();
  await expect(page.getByTestId('overlay-sheet')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anexar imagem' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nova seção' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar' }).click();

  const ta = page.locator('[data-testid="composer"] textarea');
  await ta.fill('nao enviar');
  await ta.press('Enter');
  await expect(page.getByTestId('note-nao-enviar')).toHaveCount(0);
  await page.getByTestId('composer-send').click();
  await expect(page.getByTestId('note-nao-enviar')).toBeVisible();
});

test('5 nota nova no fim e compositor blur', async ({ page }) => {
  await waitApp(page);
  await page.getByTestId('section-geral').getByRole('button', { name: /Adicionar/ }).click();
  await page.locator('[data-testid="composer"] textarea').fill('ultima geral');
  await page.getByTestId('composer-send').click();
  const notes = page.getByTestId('section-geral').locator('[data-testid^="note-"]');
  await expect(notes.last()).toHaveAttribute('data-testid', 'note-ultima-geral');
  await expect(page.locator('[data-testid="composer"] textarea')).not.toBeFocused();
});

test('6 tap texto editor, vazio e long-press selecionam, arquivo mesma secao', async ({ page }) => {
  await waitApp(page);
  await page.getByTestId('note-leite').locator('.note-title').click();
  await expect(page.getByTestId('overlay-editor')).toBeVisible();
  await page.getByRole('button', { name: 'Fechar' }).click();
  await expect(page.getByTestId('overlay-editor')).toHaveCount(0);

  await page.getByTestId('note-leite').locator('.note-empty').click();
  await expect(page.getByTestId('note-leite')).toHaveClass(/selected/);
  await expect(page.getByTestId('selection-cluster')).toBeVisible();

  await page.getByTestId('note-leite').locator('.note-radio').click();
  await expect(page.getByTestId('note-leite')).not.toHaveClass(/selected/);

  const box = await page.getByTestId('note-hmi').boundingBox();
  if (!box) throw new Error('no box');
  await page.mouse.move(box.x + 80, box.y + 20);
  await page.mouse.down();
  await page.waitForTimeout(650);
  await page.mouse.up();
  await expect(page.getByTestId('note-hmi')).toHaveClass(/selected/);
  await expect(page.getByTestId('overlay-editor')).toHaveCount(0);

  await page.getByTestId('selection-cluster').getByRole('button', { name: 'Arquivar' }).click();
  await page.locator('.strip-sq.archive').click();
  await expect(page.getByTestId('page-header')).toContainText('arquivo');
  await expect(page.getByTestId('section-def').getByTestId('note-hmi')).toBeVisible();
});

test('7 busca PWM acha trabalho e chip de pagina', async ({ page }) => {
  await waitApp(page);
  await page.getByTestId('search').fill('PWM');
  await expect(page.getByTestId('note-pwm')).toBeVisible();
  await expect(page.locator('.search-hit-chip')).toContainText('trabalho');
});

test('8 long-press no quadrado oferece excluir pagina', async ({ page }) => {
  await waitApp(page);
  const sq = page.locator('.strip-sq').first();
  const box = await sq.boundingBox();
  if (!box) throw new Error('no sq');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(650);
  await page.mouse.up();
  await expect(page.getByTestId('overlay-confirm')).toBeVisible();
  await expect(page.getByTestId('overlay-confirm')).toContainText('Excluir pagina');
  await page.getByRole('button', { name: 'Cancelar' }).click();
});

test('9 share com thumb chama navigator.share files e text', async ({ page }) => {
  await waitApp(page);
  await page.getByTestId('composer').getByRole('button', { name: 'Mais' }).click();
  await page.getByRole('button', { name: 'Anexar imagem' }).click();
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  await page.locator('input[type="file"]').setInputFiles({
    name: 'dot.png',
    mimeType: 'image/png',
    buffer: png,
  });
  await page.locator('[data-testid="composer"] textarea').fill('com foto');
  await page.getByTestId('composer-send').click();
  await expect(page.getByTestId('note-com-foto')).toBeVisible();

  await page.evaluate(() => {
    const w = window as unknown as { __shares: unknown[] };
    w.__shares = [];
    navigator.canShare = () => true;
    navigator.share = async (data) => {
      w.__shares.push({
        text: data.text,
        fileCount: data.files ? data.files.length : 0,
      });
    };
  });

  await page.getByTestId('note-com-foto').locator('.note-empty').click();
  await expect(page.getByTestId('selection-cluster')).toBeVisible();
  await page.getByTestId('selection-cluster').getByRole('button', { name: 'Compartilhar' }).click();
  await page.waitForFunction(() => {
    const w = window as unknown as { __shares?: unknown[] };
    return (w.__shares?.length ?? 0) > 0;
  });
  const shares = await page.evaluate(() => (window as unknown as { __shares: { text: string; fileCount: number }[] }).__shares);
  expect(shares.length).toBeGreaterThan(0);
  expect(shares[0].text).toMatch(/com foto/i);
  expect(shares[0].fileCount).toBeGreaterThan(0);
});

test('10 reload mantem notas de teste, nao reseeda', async ({ page }) => {
  await waitApp(page);
  await page.locator('[data-testid="composer"] textarea').fill('persistente xyz');
  await page.getByTestId('composer-send').click();
  await expect(page.getByTestId('note-persistente-xyz')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('note-persistente-xyz')).toBeVisible();
  await expect(page.getByTestId('note-leite')).toBeVisible();
});

test('11 menu nao mostra Conectar Drive', async ({ page }) => {
  await waitApp(page);
  await page.getByTestId('menu-app').click();
  await expect(page.getByTestId('overlay-menu')).toBeVisible();
  await expect(page.getByText('Conectar Drive')).toHaveCount(0);
});

test('extras wrap, history.back, mover e unarchive, manifest', async ({ page }) => {
  await waitApp(page);
  const long = 'supercalifragilisticexpialidocious'.repeat(4);
  await page.locator('[data-testid="composer"] textarea').fill(long);
  await page.getByTestId('composer-send').click();
  const title = page.locator(`[data-testid="note-${long.slice(0, 32)}"] .note-title, [data-testid^="note-supercalifragilistic"] .note-title`).first();
  await expect(title).toBeVisible();
  const wrap = await title.evaluate((el) => getComputedStyle(el).overflowWrap);
  expect(wrap === 'anywhere' || wrap === 'break-word').toBeTruthy();

  await page.getByTestId('note-leite').locator('.note-title').click();
  await expect(page.getByTestId('overlay-editor')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('overlay-editor')).toHaveCount(0);

  await page.getByTestId('section-def').getByRole('button', { name: /Adicionar/ }).click();
  await page.locator('[data-testid="composer"] textarea').fill('mover def');
  await page.getByTestId('composer-send').click();
  await expect(page.getByTestId('note-mover-def')).toBeVisible();
  await page.getByTestId('note-mover-def').locator('.note-radio').click();
  await page.getByTestId('selection-move').click();
  await expect(page.getByTestId('overlay-move')).toBeVisible();
  await page.getByTestId('overlay-move').getByRole('button', { name: 'trabalho' }).click();
  await page.locator('.strip-sq').nth(1).click();
  await expect(page.getByTestId('page-header')).toContainText('trabalho');
  await expect(page.getByTestId('section-def').getByTestId('note-mover-def')).toBeVisible();

  await page.getByTestId('note-pwm').locator('.note-radio').click();
  await page.getByTestId('selection-cluster').getByRole('button', { name: 'Arquivar' }).click();
  await page.locator('.strip-sq.archive').click();
  await expect(page.getByTestId('note-pwm')).toBeVisible();
  await page.getByTestId('note-pwm').locator('.note-radio').click();
  await page.getByTestId('selection-move').click();
  await page.getByTestId('overlay-move').getByRole('button', { name: 'trabalho' }).click();
  await page.locator('.strip-sq').nth(1).click();
  const archived = await page.evaluate(() => {
    const raw = localStorage.getItem('scriptor.notes');
    if (!raw) return null;
    const doc = JSON.parse(raw) as {
      pages: { id: string; notes: { id: string; archived?: boolean; section: string }[] }[];
    };
    const n = doc.pages.flatMap((p) => p.notes).find((x) => x.id === 'pwm');
    return n ?? null;
  });
  expect(archived?.archived).toBeFalsy();

  const manifest = await page.request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBeTruthy();
  const m = await manifest.json();
  expect(m.share_target).toBeTruthy();
  const sizes = (m.icons as { sizes: string }[]).map((i) => i.sizes);
  expect(sizes).toContain('192x192');
  expect(sizes).toContain('512x512');
  const i192 = await page.request.get('/icons/icon-192.png');
  const i512 = await page.request.get('/icons/icon-512.png');
  expect(i192.ok()).toBeTruthy();
  expect(i512.ok()).toBeTruthy();
});
