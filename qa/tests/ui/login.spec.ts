import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('SauceDemo Login Flow', () => {
  test('valid login as standard_user displays Products page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    // Verify title 'Products' is visible
    const productsTitle = page.getByText('Products');
    await expect(productsTitle).toBeVisible();
    await expect(page).toHaveURL(/.*inventory.html/);
  });

  test('locked-out user sees error message containing "locked out"', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('locked_out_user', 'secret_sauce');

    // Verify error banner is visible and contains expected text
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('locked out');
  });

  test('bonus: logs out from side menu and returns to login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    // Open side menu and click Logout
    await page.getByRole('button', { name: 'Open Menu' }).click();
    const logoutBtn = page.getByRole('button', { name: 'Logout' });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Verify back on login page
    await expect(loginPage.loginButton).toBeVisible();
    await expect(page).toHaveURL('https://www.saucedemo.com/');
  });
});
