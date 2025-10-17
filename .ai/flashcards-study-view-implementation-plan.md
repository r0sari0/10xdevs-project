# Plan implementacji widoku Sesji Nauki

## 1. Przegląd

Widok Sesji Nauki (`/study`) jest interfejsem przeznaczonym do uproszczonej sesji przeglądania fiszek. Jego głównym celem jest umożliwienie użytkownikom przeglądania ich kolekcji fiszek w intuicyjny i skupiony sposób. Widok prezentuje jedną fiszkę naraz, najpierw pokazując awers (przód), następnie umożliwiając odkrycie rewersu (tył). Użytkownik może przechodzić między fiskami za pomocą przycisków nawigacyjnych. Fiszki wyświetlane są w losowej kolejności, aby poprawy doświadczenie nauki. Widok jest prosty i wolny od rozpraszaczy, pozwalając użytkownikowi skoncentrować się wyłącznie na nauce.

## 2. Routing widoku

- **Ścieżka:** `/study`
- **Dostęp:** Wymagana autentykacja (chroniony widok)
- **Przekierowanie:** Niezalogowani użytkownicy są automatycznie przekierowywani do `/login`
- **Nawigacja:** Dostęp poprzez link "Nauka" w nagłówku aplikacji lub z widoku `/flashcards`

## 3. Struktura komponentów

```
StudyPage (strona Astro - `/src/pages/study.astro`)
├── StudySessionContainer (komponent React)
│   ├── StudySessionStart (jeśli sesja nie została rozpoczęta)
│   │   └── Button "Rozpocznij naukę"
│   ├── StudySession (jeśli sesja jest aktywna)
│   │   ├── StudySessionHeader
│   │   │   └── Counter (x z y fiszek)
│   │   ├── StudyCard
│   │   │   ├── CardFront (awers - zawsze widoczny)
│   │   │   │   └── Tekst fiszki
│   │   │   └── CardBack (rewers - ukryty do momentu kliknięcia)
│   │   │       └── Tekst odpowiedzi
│   │   ├── ShowAnswerButton
│   │   ├── RatingButtons
│   │   │   ├── Button "Łatwe" (easy)
│   │   │   ├── Button "Trudne" (hard)
│   │   │   └── Button "Do powtórki" (again)
│   │   └── NextCardButton
│   ├── StudySessionEmpty (jeśli brak fiszek)
│   │   ├── Ikona/ilustracja
│   │   ├── Wiadomość o braku fiszek
│   │   └── Link do `/flashcards`
│   └── StudySessionError (jeśli błąd pobierania fiszek)
│       ├── Wiadomość o błędzie
│       └── Button "Spróbuj ponownie"
```

## 4. Szczegóły komponentów

### StudyPage

- **Opis komponentu:** Strona Astro stanowiąca punkt wejścia dla widoku sesji nauki. Obsługuje middleware do sprawdzenia autentykacji i renderuje główny komponent React.
- **Główne elementy:** Layout Astro, StudySessionContainer (React island)
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji (wszystkie obsługiwane przez komponenty React)
- **Obsługiwana walidacja:** Walidacja autentykacji odbywa się w middleware
- **Typy:** `StudySessionState`
- **Propsy:** Brak

### StudySessionContainer

- **Opis komponentu:** Główny komponent React zarządzający logiką sesji nauki, w tym załadowaniem fiszek, mieszaniem, nawigacją i obsługą stanów (start, sesja aktywna, koniec, błąd).
- **Główne elementy:** 
  - Stan sesji (`sessionState`: 'notStarted' | 'loading' | 'active' | 'finished' | 'error')
  - Tablica losowo uszeregowanych fiszek
  - Indeks aktualnie wyświetlanej fiszki
  - Flaga ujawnienia odpowiedzi (`isAnswerRevealed`)
- **Obsługiwane interakcje:**
  - Kliknięcie "Rozpocznij naukę" → załadowanie fiszek i przejście do stanu 'active'
  - Kliknięcie "Pokaż odpowiedź" → zmiana `isAnswerRevealed` na `true`
  - Kliknięcie przycisku oceny → przejście do następnej fiszki
  - Osiągnięcie końca listy → przejście do stanu 'finished'
- **Obsługiwana walidacja:**
  - Sprawdzenie autentykacji (401) - jeśli brak tokena, redirect do `/login`
  - Sprawdzenie czy API zwróci fiszki (200) - jeśli error, pokazanie StudySessionError
  - Sprawdzenie czy są fiszki do wyświetlenia (minimum 1) - jeśli nie, pokazanie StudySessionEmpty
- **Typy:** `StudySessionState`, `StudySessionPhase`
- **Propsy:** Brak (komponent jest samodzielny)

### StudySessionStart

- **Opis komponentu:** Komponent wyświetlany przed rozpoczęciem sesji. Zawiera przycisk do uruchomienia sesji i opcjonalnie informacje przygotowawcze.
- **Główne elementy:**
  - Wiadomość powitalną
  - Button "Rozpocznij naukę"
  - Opcjonalnie: liczba dostępnych fiszek
- **Obsługiwane interakcje:**
  - Kliknięcie Button "Rozpocznij naukę" → callback `onStartSession()`
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:**
  ```typescript
  interface StudySessionStartProps {
    flashcardCount: number;
    onStartSession: () => void;
  }
  ```

### StudySessionHeader

- **Opis komponentu:** Nagłówek sesji wyświetlający postęp (np. "Fiszka 3 z 15").
- **Główne elementy:**
  - Licznik: "Fiszka [currentIndex + 1] z [totalCards]"
  - Pasek postępu (opcjonalnie)
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:**
  ```typescript
  interface StudySessionHeaderProps {
    currentIndex: number;
    totalCards: number;
  }
  ```

### StudyCard

- **Opis komponentu:** Komponent wyświetlający pojedynczą fiszkę z możliwością odkrycia rewersu. Zajmuje większość ekranu i jest wizualnym centrum sesji.
- **Główne elementy:**
  - Kontener karty (tło, cień, zaokrąglone narożniki)
  - CardFront (zawsze widoczny) - zawiera tekst awersu
  - CardBack (ukryty aż do kliknięcia) - zawiera tekst rewersu
  - Animacja przejścia między front/back (flip effect)
- **Obsługiwane interakcje:**
  - Kliknięcie na kartę lub przycisk "Pokaż odpowiedź" → zmiana `isAnswerRevealed`
- **Obsługiwana walidacja:**
  - `front` i `back` nie mogą być puste (walidacja na poziomie API)
  - `front` musi być maksymalnie 200 znaków
  - `back` musi być maksymalnie 500 znaków
- **Typy:** `FlashcardDto`
- **Propsy:**
  ```typescript
  interface StudyCardProps {
    flashcard: FlashcardDto;
    isAnswerRevealed: boolean;
    onToggleAnswer: () => void;
  }
  ```

### ShowAnswerButton

- **Opis komponentu:** Przycisk do odkrycia rewersu fiszki. Zmienia label w zależności od stanu ujawnienia.
- **Główne elementy:**
  - Button z dynamicznym labelem ("Pokaż odpowiedź" lub "Ukryj odpowiedź")
- **Obsługiwane interakcje:**
  - Kliknięcie → callback `onToggleAnswer()`
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:**
  ```typescript
  interface ShowAnswerButtonProps {
    isAnswerRevealed: boolean;
    onToggleAnswer: () => void;
  }
  ```

### RatingButtons

- **Opis komponentu:** Grupa trzech przycisków do oceny znajomości odpowiedzi.
- **Główne elementy:**
  - Button "Łatwe" (easy) - zielony
  - Button "Trudne" (hard) - pomarańczowy
  - Button "Do powtórki" (again) - czerwony
- **Obsługiwane interakcje:**
  - Kliknięcie każdego przycisku → callback `onRate(rating)` z parametrem oceny
- **Obsługiwana walidacja:**
  - Przyciski są dostępne tylko jeśli `isAnswerRevealed` jest `true`
- **Typy:** `RatingOption`
- **Propsy:**
  ```typescript
  interface RatingButtonsProps {
    isAnswerRevealed: boolean;
    onRate: (rating: RatingOption) => void;
  }
  ```

### NextCardButton

- **Opis komponentu:** Przycisk do przejścia do następnej fiszki. Alternatywa dla przycisków oceny.
- **Główne elementy:**
  - Button "Następna fiszka"
- **Obsługiwane interakcje:**
  - Kliknięcie → callback `onNextCard()`
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:**
  ```typescript
  interface NextCardButtonProps {
    onNextCard: () => void;
  }
  ```

### StudySessionEmpty

- **Opis komponentu:** Komponent wyświetlany, gdy użytkownik nie ma żadnych fiszek lub lista jest pusta.
- **Główne elementy:**
  - Ikona/ilustracja
  - Wiadomość "Brak fiszek do nauki"
  - Link "Wróć do Moich Fiszek" (`/flashcards`)
  - Link "Wygeneruj nowe fiszki" (`/generate`)
- **Obsługiwane interakcje:**
  - Kliknięcie linków do nawigacji
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:** Brak

### StudySessionError

- **Opis komponentu:** Komponent wyświetlany w przypadku błędu podczas pobierania fiszek.
- **Główne elementy:**
  - Ikona błędu
  - Wiadomość o błędzie
  - Button "Spróbuj ponownie"
  - Link "Wróć do Moich Fiszek"
- **Obsługiwane interakcje:**
  - Kliknięcie "Spróbuj ponownie" → callback `onRetry()`
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:**
  ```typescript
  interface StudySessionErrorProps {
    error: string;
    onRetry: () => void;
  }
  ```

## 5. Typy

### StudySessionPhase

Reprezentuje aktualną fazę sesji nauki.

```typescript
type StudySessionPhase = 'notStarted' | 'loading' | 'active' | 'finished' | 'error';
```

### RatingOption

Reprezentuje opcję oceny fiszki przez użytkownika.

```typescript
interface RatingOption {
  label: string;
  value: 'easy' | 'hard' | 'again';
  color: string; // Klasa Tailwind (np. "bg-green-500")
}
```

### StudySessionState

Stan sesji nauki, przechowywany w komponencie.

```typescript
interface StudySessionState {
  // Dane
  flashcards: FlashcardDto[];
  currentCardIndex: number;
  
  // Stany UI
  sessionPhase: StudySessionPhase;
  isAnswerRevealed: boolean;
  isLoading: boolean;
  error: string | null;
}
```

### StudySessionViewProps

Propsy dla głównego komponentu React (jeśli konieczne).

```typescript
interface StudySessionViewProps {
  // Brak wymaganych propsów - komponent jest samodzielny
}
```

## 6. Zarządzanie stanem

Zarządzanie stanem dla widoku Sesji Nauki powinno być zrealizowane za pomocą custom React hooka `useStudySession`, który enkapsuluje całą logikę sesji.

### Custom Hook: `useStudySession`

Ścieżka: `/src/lib/hooks/useStudySession.ts`

**Cel:** Zarządzanie całą logiką sesji nauki, w tym załadowaniem fiszek, mieszaniem, nawigacją i obsługą stanów.

**Funkcje:**
- `loadFlashcards(): Promise<void>` - pobranie fiszek z API
- `shuffleFlashcards(): void` - losowe uszeregowanie fiszek
- `startSession(): void` - uruchomienie sesji
- `toggleAnswerRevealed(): void` - przełączenie stanu ujawnienia odpowiedzi
- `rateCard(rating: RatingOption): void` - ocena karty i przejście do następnej
- `nextCard(): void` - przejście do następnej karty bez oceny
- `retryLoadFlashcards(): void` - ponowna próba załadowania fiszek

**Stan zwracany:**
```typescript
{
  flashcards: FlashcardDto[];
  currentCardIndex: number;
  sessionPhase: StudySessionPhase;
  isAnswerRevealed: boolean;
  isLoading: boolean;
  error: string | null;
  currentCard: FlashcardDto | null;
  totalCards: number;
  
  // Funkcje
  startSession: () => void;
  toggleAnswerRevealed: () => void;
  rateCard: (rating: RatingOption) => void;
  nextCard: () => void;
  retryLoadFlashcards: () => void;
}
```

**Implementacja:**
- Używa `useState` do zarządzania stanem sesji
- Używa `useEffect` do załadowania fiszek podczas montowania komponentu
- Używa `useCallback` do memoizacji funkcji callback'ów
- Obsługuje błędy API i konwertuje je na czytelne komunikaty

### Alternatywnie: Zarządzanie stanem bez custom hooka

Jeśli stosujemy bardziej bezpośrednie podejście, można zarządzać stanem bezpośrednio w komponencie `StudySessionContainer` przy użyciu `useState` i `useEffect`.

## 7. Integracja API

### Wywołanie API

**GET `/api/flashcards`** - Pobieranie listy fiszek użytkownika.

**Żądanie:**
```javascript
const response = await fetch('/api/flashcards?page=1&limit=1000', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json',
  },
});
```

**Parametry zapytania:**
- `page`: `1` (zawsze pierwsza strona, ponieważ pobieramy wszystkie fiszki)
- `limit`: `1000` (wystarczająco duży limit, aby pobić wszystkie fiszki)
- `sort`: `created_at` (domyślnie)
- `order`: `desc` (domyślnie)

**Odpowiedź (sukces - 200 OK):**
```json
{
  "data": [
    {
      "id": 101,
      "generation_id": 1,
      "front": "Pytanie 1?",
      "back": "Odpowiedź 1",
      "source": "ai-full",
      "created_at": "2025-10-09T10:00:00Z",
      "updated_at": "2025-10-09T10:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "limit": 1000,
    "total": 45
  }
}
```

**Obsługa błędów:**
- `401 Unauthorized` - Użytkownik nie jest zalogowany, redirect do `/login`
- `500 Internal Server Error` - Błąd serwera, wyświetlenie wiadomości o błędzie

### Akcje frontendowe

1. **Załadowanie fiszek** → `GET /api/flashcards`
2. **Mieszanie fiszek** → Losowe uszeregowanie tablicy na kliencie (Fisher-Yates)
3. **Rating** → Lokalnie (brak endpointu do zapisu ocen w MVP)

## 8. Interakcje użytkownika

### Scenariusz 1: Normalna sesja nauki

1. Użytkownik naviguje do `/study`
2. Widok wyświetla StudySessionStart z przyciskiem "Rozpocznij naukę"
3. Użytkownik klika przycisk
4. Aplikacja załadowuje fiszki (`GET /api/flashcards`)
5. Aplikacja mieszuje fiszki losowo
6. Widok wyświetla StudySession z pierwszą fiszkę (awers)
7. Użytkownik klika "Pokaż odpowiedź"
8. Widok odkrywa rewers fiszki (animacja flip)
9. Użytkownik klika jeden z przycisków oceny ("Łatwe", "Trudne", "Do powtórki")
10. Aplikacja przechodzi do następnej fiszki
11. Powtórzenie kroków 6-10 aż do ostatniej fiszki
12. Po ostatniej fiszce, użytkownik klika przycisk oceny
13. Widok wyświetla StudySessionEmpty z wiadomością o zakończeniu sesji

### Scenariusz 2: Brak fiszek

1. Użytkownik naviguje do `/study`
2. Widok załadowuje fiszki
3. API zwraca pustą listę
4. Widok wyświetla StudySessionEmpty z linkami do wygenerowania/dodania fiszek

### Scenariusz 3: Błąd pobierania fiszek

1. Użytkownik naviguje do `/study`
2. Widok załadowuje fiszki
3. API zwraca błąd (5xx)
4. Widok wyświetla StudySessionError z przyciskiem "Spróbuj ponownie"
5. Użytkownik klika przycisk
6. Widok próbuje ponownie załadować fiszki

## 9. Warunki i walidacja

### Warunki na poziomie API

1. **Autentykacja:**
   - Jeśli `Authorization` header nie zawiera ważnego JWT, API zwraca `401 Unauthorized`
   - Komponenta: `StudySessionContainer` - sprawdza odpowiedź z API i redirectuje do `/login`

2. **Długość listy fiszek:**
   - API zwraca maksymalnie 100 fiszek na stronę (parametr `limit`)
   - Komponent pobiera wszystkie fiszki ustawiając `limit=1000` (lub podobnie)

3. **Prawidłowość danych fiszek:**
   - Każda fiszka musi mieć `front` i `back` (walidacja na poziomie API)
   - `front` musi mieć maksymalnie 200 znaków
   - `back` musi mieć maksymalnie 500 znaków

### Warunki na poziomie komponentu

1. **Możliwość odkrycia odpowiedzi:**
   - Przycisk "Pokaż odpowiedź" jest zawsze dostępny
   - Po kliknięciu zmienia label i ukrywa rewers

2. **Dostępność przycisków oceny:**
   - Przyciski oceny są dostępne TYLKO gdy `isAnswerRevealed === true`
   - Przed odkryciem odpowiedzi, przyciski są `disabled`

3. **Nawigacja między fiskami:**
   - Po kliknięciu przycisku oceny, sesja przechodzi do następnej fiszki
   - `isAnswerRevealed` resetuje się na `false` dla nowej fiszki
   - Licznik aktualizuje się

4. **Koniec sesji:**
   - Po ostatniej fiszce, sesja przechodzi do stanu `finished`
   - Wyświetlany jest StudySessionEmpty

## 10. Obsługa błędów

### Błędy pobierania fiszek

**Scenariusz:** API zwraca błąd podczas pobierania fiszek.

**Obsługa:**
1. Hook/komponent łapie błąd
2. Ustawia `sessionPhase` na `'error'`
3. Przechowuje wiadomość o błędzie w `error`
4. Wyświetla `StudySessionError` z przyciskiem "Spróbuj ponownie"
5. Użytkownik klika przycisk → hook ponownie pobiera fiszki

**Wiadomości dla użytkownika:**
- Generyczne: "Nie udało się załadować fiszek. Spróbuj ponownie."
- Specificzne (jeśli 401): "Sesja wygasła. Zaloguj się ponownie." + redirect do `/login`

### Brak autentykacji

**Scenariusz:** Użytkownik naviguje do `/study` bez tokena JWT.

**Obsługa:**
1. Middleware w Astro sprawdza `context.locals.user`
2. Jeśli brak użytkownika, redirect do `/login`
3. Alternatywnie: komponent zauważa `401` z API i redirectuje do `/login`

**Wiadomości dla użytkownika:** Redirect bez komunikatu (dobrze znana praktyka)

### Brak fiszek

**Scenariusz:** Użytkownik nie ma żadnych fiszek.

**Obsługa:**
1. Hook załadowuje fiszki
2. API zwraca pustą listę (`data: []`)
3. Hook ustawia `flashcards = []`
4. Komponent wyświetla `StudySessionEmpty`
5. Użytkownik widzi linki do wygenerowania lub dodania fiszek

**Wiadomości dla użytkownika:** "Nie masz żadnych fiszek. Wygeneruj lub dodaj je, aby rozpocząć naukę."

### Network timeout

**Scenariusz:** Połączenie sieciowe przerwane podczas pobierania fiszek.

**Obsługa:**
1. `fetch()` rzuca wyjątek
2. Hook łapie wyjątek i ustawia `error`
3. Komponent wyświetla `StudySessionError`
4. Użytkownik może spróbować ponownie

**Wiadomości dla użytkownika:** "Błąd połączenia. Spróbuj ponownie."

## 11. Kroki implementacji

### Krok 1: Utworzenie typów i schematów

1. Dodać nowy plik `/src/types.ts` (lub zaktualizować istniejący):
   - Typ `StudySessionPhase`
   - Typ `RatingOption`
   - Typ `StudySessionState`

2. Zatwierdzić, że typy `FlashcardDto` i `PaginatedResponseDto` są już dostępne w `types.ts`

### Krok 2: Utworzenie custom hooka

1. Utworzyć plik `/src/lib/hooks/useStudySession.ts`
2. Zaimplementować hook z funkcjami:
   - `loadFlashcards()`
   - `shuffleFlashcards()`
   - `startSession()`
   - `toggleAnswerRevealed()`
   - `rateCard()` / `nextCard()`
   - `retryLoadFlashcards()`
3. Hook zwraca stan i funkcje kontrolujące sesję

### Krok 3: Utworzenie komponentów pomocniczych

1. Utworzyć `/src/components/StudySessionStart.tsx`
   - Prosty komponent z przyciskiem i wiadomością

2. Utworzyć `/src/components/StudySessionHeader.tsx`
   - Wyświetla licznik fiszek

3. Utworzyć `/src/components/StudyCard.tsx`
   - Karta fiszki z animacją flip
   - Wyświetla awers i rewers
   - Callback na kliknięcie

4. Utworzyć `/src/components/ShowAnswerButton.tsx`
   - Przycisk do odkrycia odpowiedzi

5. Utworzyć `/src/components/RatingButtons.tsx`
   - Trzy przyciski oceny
   - Obsługuje `disabled` jeśli odpowiedź nie jest odkryta

6. Utworzyć `/src/components/NextCardButton.tsx`
   - Przycisk do następnej fiszki (opcjonalnie)

7. Utworzyć `/src/components/StudySessionEmpty.tsx`
   - Wyświetla komunikat dla pustej listy

8. Utworzyć `/src/components/StudySessionError.tsx`
   - Wyświetla komunikat o błędzie

### Krok 4: Utworzenie głównego komponentu React

1. Utworzyć `/src/components/StudySessionContainer.tsx`
   - Importuje `useStudySession` hook
   - Renderuje odpowiedni komponent w zależności od `sessionPhase`
   - Przekazuje propsy do komponentów pomocniczych

### Krok 5: Utworzenie strony Astro

1. Utworzyć `/src/pages/study.astro`
   - Weryfikuje autentykację (middleware)
   - Renderuje layout
   - Montuje `StudySessionContainer` jako React Island

### Krok 6: Aktualizacja nawigacji

1. Zaktualizować komponent `Topbar.tsx` (lub główny nagłówek)
   - Dodać link do `/study` ("Nauka")

2. Zaktualizować layout `Layout.astro`
   - Upewnić się, że link do `/study` jest widoczny dla zalogowanych użytkowników

### Krok 7: Stylizacja i animacje

1. Dodać CSS dla StudyCard:
   - Animacja flip (CSS transform)
   - Przejście (transition) na 0.3s
   - Responsive design

2. Stylizacja przycisków:
   - Kolory dla "Łatwe" (zielony), "Trudne" (pomarańczowy), "Do powtórki" (czerwony)

3. Stylizacja ogólna:
   - Duża czcionka dla awersu/rewersu
   - Centrowanie treści
   - Wcięcie/padding

### Krok 8: Testy

1. Testy jednostkowe hooka `useStudySession`
   - Test załadowania fiszek
   - Test mieszania fiszek
   - Test nawigacji
   - Test oceny

2. Testy komponentów
   - Test renderowania `StudyCard`
   - Test kliknięcia przycisków

3. Testy E2E (Playwright)
   - Test pełnego przepływu sesji nauki
   - Test błędów

### Krok 9: Walidacja i poprawki

1. Sprawdzić walidację lintów ESLint i TypeScript
2. Sprawdzić responsywność na urządzeniach mobilnych
3. Sprawdzić dostępność (accessibility) - focus states, aria labels itp.
4. Sprawdzić obsługę błędów i edge cases

### Krok 10: Wdrożenie

1. Commit zmian do gita
2. Push do brancha (`feature/study-view`)
3. Code review
4. Merge do `master`
5. Deploy na staging/produkcję
