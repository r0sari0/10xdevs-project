import type { Page, Locator } from '@playwright/test';

/**
 * Page Object Model dla strony logowania
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('email-input');
    this.passwordInput = page.getByTestId('password-input');
    this.loginButton = page.getByTestId('login-button');
  }

  /**
   * Przechodzi do strony logowania
   */
  async goto() {
    await this.page.goto('/login');
  }

  /**
   * Wykonuje logowanie użytkownika
   * @param email - Adres email użytkownika
   * @param password - Hasło użytkownika
   */
  async login(email: string, password: string) {
    // Kliknij w pole email aby uzyskać focus
    await this.emailInput.click();
    
    // Wyczyść pole i wypełnij email
    await this.emailInput.clear();
    await this.emailInput.fill(email);
    
    // Sprawdź, czy wartość została ustawiona
    await this.emailInput.evaluate((el: HTMLInputElement, value: string) => {
      if (el.value !== value) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, email);
    
    // Przejdź do pola hasła
    await this.passwordInput.click();
    
    // Wyczyść pole i wypełnij hasło
    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
    
    // Sprawdź, czy wartość została ustawiona
    await this.passwordInput.evaluate((el: HTMLInputElement, value: string) => {
      if (el.value !== value) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, password);
    
    // Małe opóźnienie dla React state update
    await this.page.waitForTimeout(300);
    
    // Sprawdź, czy przycisk jest dostępny i kliknij
    await this.loginButton.waitFor({ state: 'visible' });
    await this.loginButton.click();
  }
}

