import { expect, test } from '@playwright/test';

test('acceso, navegación y ambiente caben en el viewport móvil', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByLabel('Usuario').fill('analista');
  await page.getByLabel('Contraseña').fill('demostracion');
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page.getByRole('heading', { name: 'Credenciales' })).toBeVisible();
  await expect(page.getByText('AMBIENTE DE DEMOSTRACIÓN')).toBeVisible();
  await page.getByRole('tab', { name: 'Producción' }).click();
  await expect(page.getByRole('alert')).toContainText('PRODUCCIÓN');
  await expect(page.getByRole('button', { name: /Abrir / }).first()).toBeVisible();

  const overflow = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(overflow.content).toBeLessThanOrEqual(overflow.viewport);
});

test('una ruta directa sin permiso vuelve al primer destino autorizado', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByLabel('Usuario').fill('analista');
  await page.getByLabel('Contraseña').fill('demostracion');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('heading', { name: 'Credenciales' })).toBeVisible();

  await page.evaluate(() => {
    window.history.pushState({}, '', '/audit');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });

  await expect(page).toHaveURL(/\/applications$/);
  await expect(page.getByRole('heading', { name: 'Credenciales' })).toBeVisible();
});
