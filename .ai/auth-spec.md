# Specyfikacja techniczna modułu uwierzytelniania

## 1. Architektura interfejsu użytkownika

### 1.1. Nowe strony (Astro)

W celu obsługi procesów uwierzytelniania, zostaną utworzone następujące strony w katalogu `src/pages`:

-   `src/pages/login.astro`: Strona logowania.
-   `src/pages/register.astro`: Strona rejestracji.
-   `src/pages/password-reset.astro`: Strona do inicjowania procesu resetowania hasła.
-   `src/pages/auth/callback.astro`: Endpoint dla Supabase Auth do przekierowania użytkownika po udanej autoryzacji (np. przez OAuth, ale w MVP używany do obsługi potwierdzenia e-mail).
-   `src/pages/api/auth/signout.ts`: Endpoint API do wylogowywania użytkownika.

### 1.2. Modyfikacja Layoutu

Główny layout aplikacji, `src/layouts/Layout.astro`, zostanie zmodyfikowany. Zamiast osadzać logikę uwierzytelniania bezpośrednio w layoucie, dodamy dedykowany, interaktywny komponent `Topbar.tsx`, który będzie odpowiedzialny za wyświetlanie stanu zalogowania i odpowiednich akcji.

```astro
---
// src/layouts/Layout.astro (fragment)
import Topbar from '../components/Topbar';
---
<header class="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <Topbar client:load />
</header>
<main class="pt-16">
  <slot />
</main>
```

### 1.3. Komponenty (React)

Do obsługi formularzy oraz nowego paska nawigacyjnego zostaną stworzone komponenty React w `src/components`:

-   `src/components/Topbar.tsx`: Nowy komponent, który zastąpi dotychczasową nawigację. Będzie renderowany po stronie klienta (`client:load`) i będzie nasłuchiwał na zmiany stanu autentykacji z Supabase (`onAuthStateChange`).
    -   **Stan niezalogowany (non-auth):** Wyświetli przyciski "Zaloguj się" i "Zarejestruj się" (komponent `Button` z `shadcn/ui`), które będą linkami do odpowiednich stron.
    -   **Stan zalogowany (auth):** Wyświetli komponent `Avatar` z `DropdownMenu` z `shadcn/ui`. W menu rozwijanym znajdzie się adres e-mail użytkownika oraz opcja "Wyloguj", która będzie formularzem POST wysyłającym żądanie do endpointu `/api/auth/signout`.

-   `src/components/LoginForm.tsx`: Formularz logowania z polami na e-mail i hasło. Będzie on komunikował się z Supabase Auth po stronie klienta.
-   `src/components/RegisterForm.tsx`: Formularz rejestracji z polami na e-mail i hasło (z powtórzeniem hasła).
-   `src/components/PasswordResetForm.tsx`: Formularz z polem na e-mail do wysłania linku resetującego hasło.

Pozostałe komponenty (`LoginForm`, `RegisterForm`, `PasswordResetForm`) będą renderowane na odpowiednich stronach Astro (`login.astro`, `register.astro`, `password-reset.astro`) z atrybutem `client:load`, aby zapewnić ich interaktywność.

### 1.4. Walidacja i obsługa błędów

-   **Walidacja po stronie klienta:** Komponenty React będą wykorzystywać bibliotekę (np. `zod` z `react-hook-form`) do walidacji formatu e-mail, wymagań dotyczących hasła (min. 8 znaków) oraz zgodności haseł.
-   **Komunikaty dla użytkownika:** Błędy walidacji będą wyświetlane bezpośrednio pod polami formularza. Błędy pochodzące z API (np. "użytkownik już istnieje", "nieprawidłowe hasło") będą wyświetlane w formie globalnego komunikatu nad formularzem (np. przy użyciu komponentu `Sonner` z `shadcn/ui`).

### 1.5. Scenariusze

-   **Rejestracja (US-001):**
    1.  Użytkownik wypełnia formularz w `RegisterForm.tsx`.
    2.  Komponent wywołuje `supabase.auth.signUp()`.
    3.  Supabase wysyła e-mail weryfikacyjny.
    4.  Po pomyślnym wywołaniu, użytkownik jest informowany o konieczności sprawdzenia skrzynki e-mail i przekierowywany na stronę główną lub stronę logowania.
-   **Logowanie (US-002):**
    1.  Użytkownik wypełnia formularz w `LoginForm.tsx`.
    2.  Komponent wywołuje `supabase.auth.signInWithPassword()`.
    3.  W przypadku sukcesu, Supabase ustawia ciasteczka sesji. Użytkownik jest przekierowywany na stronę główną (`/`).
    4.  W przypadku błędu, `LoginForm.tsx` wyświetla stosowny komunikat.
-   **Resetowanie hasła (US-003):**
    1.  Użytkownik wprowadza e-mail w `PasswordResetForm.tsx`.
    2.  Komponent wywołuje `supabase.auth.resetPasswordForEmail()`.
    3.  Użytkownik jest informowany, że jeśli konto istnieje, otrzymał link do resetu hasła.
    4.  Link w mailu prowadzi do specjalnej strony Supabase, gdzie użytkownik może ustawić nowe hasło.
-   **Wylogowanie (US-004):**
    1.  Użytkownik klika opcję "Wyloguj" w `DropdownMenu` w komponencie `Topbar.tsx`.
    2.  Formularz wewnątrz `DropdownMenu` wysyła żądanie POST do `/api/auth/signout`.
    3.  Endpoint wywołuje `supabase.auth.signOut()` i przekierowuje użytkownika na stronę logowania.

## 2. Logika backendowa

### 2.1. Middleware

Kluczowym elementem logiki backendowej będzie middleware Astro zdefiniowany w `src/middleware/index.ts`. Jego zadaniem będzie:

1.  **Inicjalizacja Supabase Client:** Na każde żądanie, middleware stworzy instancję klienta Supabase z wykorzystaniem ciasteczek (`cookies`) z kontekstu żądania. To pozwoli na bezpieczną komunikację z Supabase w kontekście serwerowym.
2.  **Zarządzanie sesją:** Middleware będzie odczytywał sesję użytkownika na podstawie ciasteczek.
3.  **Udostępnianie danych sesji:** Informacje o zalogowanym użytkowniku (`session`, `user`) będą przekazywane do wszystkich stron i endpointów API poprzez `Astro.locals`.
4.  **Ochrona tras:** Middleware będzie sprawdzał, czy użytkownik jest zalogowany. Jeśli użytkownik spróbuje uzyskać dostęp do chronionej strony (np. strona główna z generatorem fiszek) bez aktywnej sesji, zostanie przekierowany na stronę logowania (`/login`). Strony publiczne (`/login`, `/register`) będą dostępne dla niezalogowanych użytkowników.

```typescript
// src/middleware/index.ts
import { defineMiddleware } from "astro:middleware";
import { createSupabaseClient } from "../db/supabase.client"; // Funkcja pomocnicza

const protectedRoutes = ["/"]; // Strona główna jest chroniona
const publicRoutes = ["/login", "/register", "/password-reset"];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseClient(context.cookies);
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  context.locals.supabase = supabase;
  context.locals.session = session;
  context.locals.user = user;

  const { pathname } = context.url;

  if (protectedRoutes.includes(pathname) && !user) {
    return context.redirect("/login");
  }

  if (publicRoutes.includes(pathname) && user) {
    return context.redirect("/");
  }

  return next();
});
```

### 2.2. Endpointy API

-   `src/pages/api/auth/signout.ts`:
    -   Przyjmuje żądania `POST`.
    -   Pobiera klienta Supabase z `Astro.locals.supabase`.
    -   Wywołuje `supabase.auth.signOut()`.
    -   Usuwa ciasteczka sesji.
    -   Przekierowuje użytkownika na `/login`.

```typescript
// src/pages/api/auth/signout.ts
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals, cookies, redirect }) => {
  const { supabase } = locals;
  await supabase.auth.signOut();
  // Supabase client handles cookie removal automatically
  return redirect("/login");
};
```

### 2.3. Renderowanie po stronie serwera (SSR)

Dzięki `output: "server"` w `astro.config.mjs`, middleware będzie wykonywany przy każdym żądaniu, co gwarantuje, że decyzje o renderowaniu i przekierowaniach będą zawsze podejmowane na podstawie aktualnego stanu sesji użytkownika. Strony Astro będą mogły bezpiecznie korzystać z `Astro.locals.user` do warunkowego renderowania treści dla zalogowanych lub niezalogowanych użytkowników.

## 3. System autentykacji (Supabase)

### 3.1. Konfiguracja Supabase

-   **Email Templates:** Należy skonfigurować szablony e-maili w panelu Supabase dla:
    -   Potwierdzenia rejestracji ("Confirm your signup").
    -   Resetowania hasła ("Reset your password").
-   **URL konfiguracyjny:** W ustawieniach Supabase Auth należy podać adres URL aplikacji (Site URL), aby linki generowane w e-mailach były poprawne.
-   **Providerzy:** W MVP wykorzystany będzie tylko provider `Email/Password`.

### 3.2. Integracja z Astro

-   **Zmienne środowiskowe:** Klucze Supabase (`SUPABASE_URL` i `SUPABASE_ANON_KEY`) będą przechowywane w pliku `.env` i dostępne w aplikacji.
-   **Klient Supabase:** Zostanie stworzona funkcja `createSupabaseClient` w `src/db/supabase.client.ts`, która będzie odpowiedzialna za tworzenie instancji klienta Supabase. Będzie ona w stanie operować zarówno po stronie serwera (w middleware, z użyciem `cookies`), jak i po stronie klienta (w komponentach React). To kluczowe dla poprawnego działania uwierzytelniania w architekturze Astro SSR.

### 3.3. Kontrakty i modele danych

-   **Model użytkownika:** Będziemy korzystać z domyślnego modelu użytkownika dostarczanego przez Supabase (`Auth.User`), który zawiera m.in. `id`, `email`, `created_at`.
-   **Model sesji:** Podobnie, będziemy operować na domyślnym modelu sesji Supabase (`Auth.Session`), który zawiera tokeny dostępu i odświeżania.
-   Wszystkie interakcje z danymi użytkownika i sesji będą odbywać się za pośrednictwem Supabase JS Client SDK. Nie ma potrzeby tworzenia dodatkowych modeli danych dla samego procesu uwierzytelniania. Relacje do tabel (np. `flashcards`) będą opierać się na `user.id` z Supabase.

