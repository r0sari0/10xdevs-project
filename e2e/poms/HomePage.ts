import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model dla strony głównej aplikacji
 */
export class HomePage {
  readonly page: Page;
  readonly topbar: Locator;
  readonly userAvatarButton: Locator;
  readonly sourceTextInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.topbar = page.getByTestId("topbar");
    this.userAvatarButton = page.getByTestId("user-avatar-button");
    this.sourceTextInput = page.getByTestId("source-text-input");
  }

  /**
   * Przechodzi do strony głównej
   */
  async goto() {
    await this.page.goto("/");
  }

  /**
   * Sprawdza czy użytkownik jest zalogowany (avatar widoczny)
   */
  async isUserLoggedIn(): Promise<boolean> {
    return await this.userAvatarButton.isVisible();
  }
}
