# Testy E2E - Playwright

## 📋 Konfiguracja

### 1. Zmienne środowiskowe

Utwórz plik `.env.test` w głównym katalogu projektu:

```bash
# Test Environment Variables
E2E_USERNAME=test@example.com
E2E_PASSWORD=TestPassword123!
```

**⚠️ Ważne:** Upewnij się, że użytkownik testowy istnieje w bazie danych Supabase!

### 2. Struktura projektu

```
e2e/
├── poms/              # Page Object Models
│   ├── LoginPage.ts   # Strona logowania
│   └── HomePage.ts    # Strona główna
├── login.spec.ts      # Test logowania
└── README.md          # Ta dokumentacja
```

## 🧪 Uruchamianie testów

```bash
# Wszystkie testy
npm run test:e2e

# Tryb UI (interaktywny)
npm run test:e2e:ui

# Tylko wybrane testy
npx playwright test login.spec.ts

# Z debugowaniem
npx playwright test --debug
```

## 📦 Page Object Models (POM)

### LoginPage

```typescript
const loginPage = new LoginPage(page);

// Przejście na stronę logowania
await loginPage.goto();

// Wykonanie logowania
await loginPage.login('email@example.com', 'password123');
```

### HomePage

```typescript
const homePage = new HomePage(page);

// Przejście na stronę główną
await homePage.goto();

// Sprawdzenie czy użytkownik jest zalogowany
const isLoggedIn = await homePage.isUserLoggedIn();
```

## 🏷️ Data-testid

Komponenty mają następujące atrybuty testowe:

### LoginForm
- `email-input` - pole email
- `password-input` - pole hasła
- `login-button` - przycisk logowania

### Topbar
- `topbar` - główny pasek nawigacji
- `user-avatar-button` - avatar użytkownika

### SourceTextInput
- `source-text-input` - pole tekstowe dla źródła

## 🔧 Rozwiązywanie problemów

### Problem: Pola formularza się resetują przy kliknięciu

**Przyczyna:** React może nie zdążyć zaktualizować stanu przed kliknięciem przycisku.

**Rozwiązanie:** Metoda `login()` w `LoginPage`:
1. Klika w pole aby uzyskać focus
2. Czyści pole przed wypełnieniem
3. Wypełnia wartość
4. Weryfikuje ustawioną wartość i wywołuje zdarzenia React
5. Czeka na aktualizację stanu (300ms)
6. Dopiero wtedy klika przycisk

### Problem: Test timeout

**Rozwiązanie:** Zwiększ timeout w asercjach:
```typescript
await expect(element).toBeVisible({ timeout: 10000 });
```

### Problem: Użytkownik testowy nie istnieje

**Rozwiązanie:** 
1. Zaloguj się do Supabase Dashboard
2. Przejdź do Authentication → Users
3. Dodaj użytkownika testowego z danymi z `.env.test`

## 📝 Tworzenie nowych testów

### 1. Utwórz Page Object Model

```typescript
// e2e/poms/MyPage.ts
import type { Page, Locator } from '@playwright/test';

export class MyPage {
  readonly page: Page;
  readonly myElement: Locator;

  constructor(page: Page) {
    this.page = page;
    this.myElement = page.getByTestId('my-element');
  }

  async goto() {
    await this.page.goto('/my-path');
  }
}
```

### 2. Dodaj data-testid do komponentu

```tsx
<button data-testid="my-button">
  Click me
</button>
```

### 3. Napisz test

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';
import { MyPage } from './poms/MyPage';

test.describe('Moja funkcjonalność', () => {
  test('powinien wykonać akcję', async ({ page }) => {
    const myPage = new MyPage(page);
    
    await myPage.goto();
    await expect(myPage.myElement).toBeVisible();
  });
});
```

## 📊 Raporty

Po uruchomieniu testów, raport HTML jest dostępny w:
```
playwright-report/index.html
```

Otwórz go w przeglądarce:
```bash
npx playwright show-report
```

