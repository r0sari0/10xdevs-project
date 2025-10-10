# Architektura UI dla AI Flashcard Generator

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla AI Flashcard Generator została zaprojektowana z myślą o prostocie i skupieniu na kluczowych funkcjonalnościach MVP. Opiera się na nowoczesnym stosie technologicznym, wykorzystując **Astro** do budowy wysoce wydajnych, statycznych stron i layoutów oraz **React** do tworzenia interaktywnych "wysp" (Astro Islands) dla dynamicznych części interfejsu, takich jak formularze i zarządzanie danymi w czasie rzeczywistym.

Głównym założeniem jest zapewnienie płynnego i intuicyjnego doświadczenia użytkownika, prowadząc go od generowania fiszek, przez ich weryfikację, aż po naukę. Aplikacja będzie w pełni responsywna, zapewniając komfort użytkowania zarówno na urządzeniach desktopowych, jak i mobilnych. Nawigacja będzie scentralizowana w globalnym pasku nagłówka, zapewniając łatwy dostęp do wszystkich kluczowych sekcji: Generatora, Moich Fiszek i Nauki.

## 2. Lista widoków

### Widoki Uwierzytelniania

#### 1. Widok Logowania
- **Ścieżka:** `/login`
- **Główny cel:** Uwierzytelnienie istniejącego użytkownika.
- **Kluczowe informacje:** Formularz z polami na e-mail i hasło.
- **Kluczowe komponenty:** `LoginForm`, `Input`, `Button`, linki do rejestracji i resetowania hasła.
- **UX, dostępność i bezpieczeństwo:** Komunikacja z API odbywa się przez HTTPS. Błędy walidacji wyświetlane są bezpośrednio pod polami. Pola formularza mają odpowiednie etykiety (`<label>`) dla czytników ekranu.

#### 2. Widok Rejestracji
- **Ścieżka:** `/register`
- **Główny cel:** Umożliwienie nowym użytkownikom założenia konta.
- **Kluczowe informacje:** Formularz z polami na e-mail, hasło i potwierdzenie hasła.
- **Kluczowe komponenty:** `RegisterForm`, `Input`, `Button`, link do logowania.
- **UX, dostępność i bezpieczeństwo:** Walidacja siły hasła po stronie klienta. Zapewnione jasne komunikaty o błędach (np. "hasła nie są zgodne", "e-mail jest już zajęty").

#### 3. Widok Resetowania Hasła
- **Ścieżka:** `/reset-password`
- **Główny cel:** Umożliwienie użytkownikowi odzyskania dostępu do konta po zapomnieniu hasła.
- **Kluczowe informacje:** Dwuetapowy proces: (1) Formularz do wpisania adresu e-mail w celu wysłania linku resetującego. (2) Formularz do ustawienia nowego hasła (dostępny z unikalnego linku).
- **Kluczowe komponenty:** `ForgotPasswordForm`, `ResetPasswordForm`, `Input`, `Button`.
- **UX, dostępność i bezpieczeństwo:** Link resetujący jest jednorazowy i ma ograniczony czas ważności. Użytkownik otrzymuje jasną informację zwrotną o wysłaniu linku.

### Główne Widoki Aplikacji

#### 4. Widok Generatora Fiszek
- **Ścieżka:** `/generate` (strona główna po zalogowaniu)
- **Główny cel:** Główne narzędzie aplikacji do generowania, weryfikowania i zapisywania fiszek z tekstu.
- **Kluczowe informacje:** Pole tekstowe (`textarea`) na tekst źródłowy, licznik znaków, siatka z propozycjami fiszek wygenerowanymi przez AI.
- **Kluczowe komponenty:** `Textarea` z licznikiem, `Button` "Generuj", `FlashcardProposalGrid`, `FlashcardProposalCard` (z opcjami edycji inline i usunięcia), `Button` "Zapisz wszystkie", `Spinner`/`Loader`.
- **UX, dostępność i bezpieczeństwo:** Stan propozycji fiszek zarządzany jest w całości po stronie klienta. Odświeżenie strony powoduje utratę niezapisanych danych, co jest świadomym uproszczeniem w MVP. Interaktywne elementy (edycja, usuwanie) są dostępne z klawiatury. Przycisk "Generuj" jest nieaktywny, gdy tekst nie spełnia kryteriów długości.

#### 5. Widok "Moje Fiszki"
- **Ścieżka:** `/flashcards`
- **Główny cel:** Przeglądanie i zarządzanie wszystkimi zapisanymi fiszkami użytkownika.
- **Kluczowe informacje:** Lista/siatka wszystkich zapisanych fiszek, kontrolki do paginacji i sortowania.
- **Kluczowe komponenty:** `FlashcardList`, `FlashcardListItem` (z opcjami edycji i usunięcia), `PaginationControl`, `SortDropdown`, `Dialog` (do edycji fiszki), `AlertDialog` (do potwierdzenia usunięcia).
- **UX, dostępność i bezpieczeństwo:** W przypadku braku fiszek wyświetlany jest pomocny komunikat ("empty state") z linkiem do generatora. Wszystkie akcje (edycja, usunięcie) wymagają interakcji użytkownika (np. potwierdzenia).

#### 6. Widok Sesji Nauki
- **Ścieżka:** `/study`
- **Główny cel:** Uproszczona sesja nauki umożliwiająca przeglądanie fiszek.
- **Kluczowe informacje:** Pojedyncza fiszka wyświetlana w danym momencie (najpierw awers).
- **Kluczowe komponenty:** `StudyCard` (z logiką odkrywania rewersu), `Button` "Pokaż odpowiedź", `Button` "Następna fiszka".
- **UX, dostępność i bezpieczeństwo:** Fiszki prezentowane są w losowej kolejności. Widok jest prosty i wolny od rozpraszaczy, skupiając się wyłącznie na nauce.

## 3. Mapa podróży użytkownika

1.  **Rejestracja/Logowanie:** Nowy użytkownik przechodzi przez `POST /register`, a istniejący przez `POST /login`. Po pomyślnym uwierzytelnieniu jest przekierowywany do `/generate`. Dostęp do widoków `/generate`, `/flashcards` i `/study` jest chroniony i wymaga aktywnej sesji.
2.  **Generowanie:** W widoku `/generate` użytkownik wkleja tekst i klika "Generuj". Aplikacja wysyła żądanie `POST /api/generations`.
3.  **Weryfikacja:** Po otrzymaniu odpowiedzi od API, propozycje fiszek są renderowane w siatce. Użytkownik edytuje (`ai-edited`) lub usuwa (tylko na kliencie) fiszki. Fiszki niezmodyfikowane zachowują status `ai-full`.
4.  **Zapisywanie:** Użytkownik klika "Zapisz wszystkie". Aplikacja wysyła tablicę zweryfikowanych fiszek za pomocą `POST /api/flashcards`.
5.  **Zarządzanie:** Użytkownik nawiguje do `/flashcards`. Aplikacja pobiera wszystkie zapisane fiszki (`GET /api/flashcards`) i wyświetla je z opcjami edycji (`PUT /api/flashcards/{id}`) i usunięcia (`DELETE /api/flashcards/{id}`).
6.  **Nauka:** Użytkownik przechodzi do `/study`, gdzie rozpoczyna się uproszczona sesja przeglądania wszystkich jego fiszek w losowej kolejności.

## 4. Układ i struktura nawigacji

Aplikacja będzie korzystać z jednego, spójnego układu (`Layout.astro`), który obejmuje:
-   **Globalny Nagłówek (`Header`):** Widoczny we wszystkich widokach po zalogowaniu.
    -   Logo aplikacji (link do `/generate`).
    -   Linki nawigacyjne: "Generator" (`/generate`), "Moje Fiszki" (`/flashcards`), "Nauka" (`/study`).
    -   Menu użytkownika z opcją "Wyloguj".
-   **Główna treść strony:** Kontener, w którym renderowane są poszczególne widoki (np. `/generate`, `/flashcards`).
-   **System powiadomień:** Globalny kontener dla powiadomień typu "toast", które informują o sukcesach lub błędach operacji.

Dla użytkowników niezalogowanych, nagłówek będzie zawierał jedynie linki do "Zaloguj się" i "Zarejestruj się".

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów UI, które będą stanowić podstawę aplikacji:

-   **`HeaderNav`:** Komponent nawigacji globalnej.
-   **`FlashcardProposalCard`:** Interaktywna karta dla propozycji fiszek w widoku `/generate`. Umożliwia edycję `front` i `back` w miejscu oraz usunięcie karty ze stanu klienta.
-   **`FlashcardListItem`:** Komponent do wyświetlania pojedynczej zapisanej fiszki w widoku `/flashcards` z przyciskami do edycji i usuwania.
-   **`StudyCard`:** Komponent wyświetlający jedną stronę fiszki z opcją jej odwrócenia w widoku `/study`.
-   **`LoginForm` / `RegisterForm`:** Kompletne, interaktywne formularze React do obsługi uwierzytelniania.
-   **`PaginationControl`:** Komponent do nawigacji między stronami na liście fiszek.
-   **`Toast`:** System globalnych powiadomień do informowania użytkownika o wynikach operacji.
-   **Komponenty UI z `Shadcn/ui`:** `Button`, `Input`, `Textarea`, `Card`, `Dialog`, `AlertDialog`, `Spinner` będą szeroko wykorzystywane do budowy spójnego interfejsu.
