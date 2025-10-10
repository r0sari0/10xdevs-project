# API Endpoint Implementation Plan: Update a Flashcard

## 1. Przegląd punktu końcowego
Ten endpoint umożliwia aktualizację istniejącej fiszki poprzez metodę PUT na `/api/flashcards/{id}`. Jest przeznaczony zarówno dla edycji manualnych, jak i edycji kart generowanych przez AI podczas przeglądu. Endpoint aktualizuje pola `front` i `back`, a jeśli źródło to 'ai-full', zmienia je na 'ai-edited'. Używa Supabase jako backendu z RLS dla bezpieczeństwa.

## 2. Szczegóły żądania
- **Metoda HTTP**: PUT
- **Struktura URL**: `/api/flashcards/{id}` (gdzie {id} jest BIGINT identyfikatorem fiszki)
- **Parametry**:
  - **Wymagane**: 
    - `id` (w ścieżce URL): BIGINT identyfikator fiszki
    - `front` (w request body): string, maksymalnie 200 znaków, wymagany
    - `back` (w request body): string, maksymalnie 500 znaków, wymagany
  - **Opcjonalne**: Brak - wszystkie pola są wymagane zgodnie ze specyfikacją
- **Request Body**:
  ```json
  {
    "front": "An updated question?",
    "back": "An updated answer."
  }
  ```

## 3. Wykorzystywane typy
- **Command Model**: `UpdateFlashcardCommand` (z types.ts) - dla walidacji danych wejściowych.
- **DTO**: `FlashcardDto` (z types.ts) - dla struktury odpowiedzi zawierającej pełne dane zaktualizowanej fiszki.

## 4. Szczegóły odpowiedzi
- **Success Response (200 OK)**:
  ```json
  {
    "id": 101,
    "generation_id": 1,
    "front": "An updated question?",
    "back": "An updated answer.",
    "source": "ai-edited",
    "created_at": "2025-10-09T10:00:00Z",
    "updated_at": "2025-10-09T11:30:00Z"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Validation failed: [details]" }`
  - `401 Unauthorized`: `{ "error": "Unauthorized" }`
  - `404 Not Found`: `{ "error": "Flashcard not found" }`
  - `500 Internal Server Error`: `{ "error": "Internal server error" }`

## 5. Przepływ danych
1. **Middleware**: Sprawdź autoryzację użytkownika poprzez Supabase auth.
2. **Route Handler**: Parsuj i waliduj request body przy użyciu Zod schema.
3. **Service Layer**: Wywołaj `flashcard.service.updateFlashcard(id, command, userId)` - sprawdź istnienie fiszki, własność, zaktualizuj w bazie danych (używając SupabaseClient z context.locals).
4. **Database**: Zaktualizuj tabelę `flashcards` z triggerem na `updated_at`. Jeśli source to 'ai-full', zmień na 'ai-edited'.
5. **Response**: Zwróć `FlashcardDto` z zaktualizowanymi danymi.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Wymagane poprzez Supabase auth - sprawdź `auth.uid()` w middleware.
- **Autoryzacja**: RLS zapewnia dostęp tylko do własnych fiszek użytkownika.
- **Walidacja**: Użyj Zod dla input sanitization, sprawdź długości pól zgodnie z bazą danych (front <=200, back <=500).
- **Zapobieganie atakom**: Użyj parametrów w zapytaniach do zapobiegnięcia SQL injection. Nie pozwalaj na aktualizację pól innych niż front/back.
- **Dodatkowe**: Rozważ rate limiting jeśli endpoint jest krytyczny.

## 7. Obsługa błędów
- **Walidacja (400)**: Nieprawidłowe dane wejściowe (puste stringi, przekroczone długości, nieprawidłowy format id).
- **Autoryzacja (401)**: Brak ważnego tokena auth.
- **Nie znaleziono (404)**: Fiszka nie istnieje lub nie należy do użytkownika.
- **Serwer (500)**: Błędy bazy danych lub inne wewnętrzne błędy - loguj dla debugowania.
- **Strategia**: Użyj early returns, loguj błędy po stronie serwera, zwracaj user-friendly komunikaty.

## 8. Wydajność
- **Optymalizacja**: Użyj indeksów na `user_id` i `id` w tabeli flashcards dla szybkich zapytań.
- **Wąskie gardła**: Duże obciążenie na bazie danych przy częstych aktualizacjach - monitoruj poprzez Supabase.
- **Strategie**: Buforowanie nie dotyczy, ale unikaj niepotrzebnych zapytań poprzez wstępną walidację.

## 9. Kroki implementacji
1. **Przygotuj walidację**: Utwórz lub rozszerz schemat Zod w `src/lib/schemas/flashcard.schema.ts` dla update command.
2. **Rozszerz serwis**: Dodaj metodę `updateFlashcard` w `src/lib/services/flashcard.service.ts` - sprawdź istnienie, własność, aktualizuj bazę.
3. **Zaimplementuj endpoint**: W `src/pages/api/flashcards/[id].ts` dodaj handler PUT - parsuj request, wywołaj serwis, zwróć odpowiedź.
4. **Dodaj middleware**: Jeśli potrzebne, rozszerz `src/middleware/index.ts` dla dodatkowej autoryzacji.
5. **Testowanie**: Przetestuj walidację, błędy, sukces - użyj narzędzi jak Postman.
6. **Linting i security check**: Uruchom eslint, sprawdź bezpieczeństwo zgodnie z regułami.
7. **Dokumentacja**: Zaktualizuj README lub dokumentację API.
