import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('SauceDemo Shopping Cart Flow', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
  });

  test('add to cart increments cart badge to 1', async ({ page }) => {
    // Locate the first "Add to cart" button
    const firstAddBtn = page.getByRole('button', { name: 'Add to cart' }).first();
    await firstAddBtn.click();

    // Verify cart badge shows 1
    const cartBadge = page.getByTestId('shopping-cart-badge');
    await expect(cartBadge).toBeVisible();
    await expect(cartBadge).toHaveText('1');
  });

  test('bonus: remove product from cart clears the cart badge', async ({ page }) => {
    // Add product to cart
    const firstAddBtn = page.getByRole('button', { name: 'Add to cart' }).first();
    await firstAddBtn.click();

    const cartBadge = page.getByTestId('shopping-cart-badge');
    await expect(cartBadge).toHaveText('1');

    // Click Remove button
    const removeBtn = page.getByRole('button', { name: 'Remove' }).first();
    await removeBtn.click();

    // Verify badge disappears
    await expect(cartBadge).not.toBeVisible();
  });
});
