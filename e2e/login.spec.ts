import { test, expect } from '@playwright/test';
import { LoginPage } from './poms/LoginPage';
import { HomePage } from './poms/HomePage';

test.describe('Logowanie użytkownika', () => {
  test('powinien umożliwić zalogowanie się i wyświetlić stronę główną', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);

    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error('E2E_USERNAME i E2E_PASSWORD muszą być ustawione w zmiennych środowiskowych');
    }

    // Act
    await loginPage.goto();
    
    // Verify login form is visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
    
    // Perform login
    await loginPage.login(email, password);

    // Wait for navigation to complete
    await page.waitForURL('/', { timeout: 10000 });

    // Assert
    await expect(homePage.userAvatarButton).toBeVisible({ timeout: 10000 });
    await expect(homePage.topbar).toBeVisible();
  });
});

