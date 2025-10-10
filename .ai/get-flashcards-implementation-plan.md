# API Endpoint Implementation Plan: Get a list of flashcards

## 1. Przegląd punktu końcowego
Ten punkt końcowy (`GET /api/flashcards`) jest odpowiedzialny za pobieranie spaginowanej i filtrowalnej listy fiszek należących do uwierzytelnionego użytkownika. Umożliwia sortowanie i filtrowanie wyników na podstawie różnych kryteriów.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `GET`
-   **Struktura URL**: `/api/flashcards`
-   **Parametry (Query Parameters)**:
    -   **Opcjonalne**:
        -   `page` (number, domyślnie: 1): Numer strony do wyświetlenia.
        -   `limit` (number, domyślnie: 20): Maksymalna liczba fiszek na stronie (zalecane ograniczenie do 100).
        -   `sort` (string, domyślnie: 'created_at'): Pole do sortowania. Dozwolone wartości: `created_at`, `updated_at`, `source`.
        -   `order` (string, domyślnie: 'desc'): Kierunek sortowania. Dozwolone wartości: `asc`, `desc`.
        -   `source` (string): Filtr na podstawie źródła fiszki. Dozwolone wartości: `ai-full`, `ai-edited`, `manual`.
        -   `generation_id` (number): Filtr na podstawie ID generacji, z której pochodzą fiszki.

## 3. Wykorzystywane typy
-   `FlashcardDto`: Reprezentuje pojedynczą fiszkę w odpowiedzi.
-   `PaginatedResponseDto<FlashcardDto>`: Reprezentuje całą strukturę odpowiedzi, zawierającą dane i informacje o paginacji.
-   `GetFlashcardsQueryDto`: Nowy typ DTO oparty na schemacie Zod, reprezentujący zwalidowane parametry zapytania.

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu (200 OK)**:
    ```json
    {
      "data": [
        // array of FlashcardDto objects
      ],
      "pagination": {
        "current_page": 1,
        "limit": 20,
        "total": 150
      }
    }
    ```
-   **Odpowiedzi błędów**:
    -   `400 Bad Request`: Błąd walidacji parametrów zapytania.
    -   `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
    -   `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do `/api/flashcards`.
2.  Astro middleware weryfikuje sesję użytkownika. W przypadku braku sesji zwraca `401 Unauthorized`.
3.  Handler `GET` w `src/pages/api/flashcards.ts` przejmuje żądanie.
4.  Parametry zapytania są walidowane przy użyciu dedykowanego schematu Zod. W przypadku błędu walidacji, handler zwraca `400 Bad Request` z odpowiednią informacją.
5.  Handler wywołuje metodę `getFlashcards` z serwisu `FlashcardService`, przekazując zwalidowane parametry oraz instancję klienta Supabase (`context.locals.supabase`) w celu zapewnienia przestrzegania RLS.
6.  `FlashcardService` buduje zapytanie do Supabase, uwzględniając filtry, sortowanie i paginację. Wykonuje dwa zapytania: jedno po dane, drugie po całkowitą liczbę rekordów pasujących do filtrów (potrzebne do paginacji).
7.  Serwis zwraca obiekt `PaginatedResponseDto<FlashcardDto>` do handlera.
8.  Handler serializuje odpowiedź i wysyła ją do klienta ze statusem `200 OK`.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Dostęp do endpointu jest chroniony przez middleware, które weryfikuje token JWT użytkownika i odrzuca żądania od nieuwierzytelnionych użytkowników.
-   **Autoryzacja**: Zapytania do bazy danych są wykonywane w kontekście zalogowanego użytkownika dzięki wykorzystaniu Row Level Security (RLS) w Supabase. Gwarantuje to, że użytkownik ma dostęp wyłącznie do swoich fiszek.
-   **Walidacja danych wejściowych**: Wszystkie parametry zapytania są rygorystycznie walidowane za pomocą Zod, co zapobiega błędom zapytań i potencjalnym atakom.

## 7. Rozważania dotyczące wydajności
-   **Indeksy bazy danych**: Należy upewnić się, że istnieją indeksy na kolumnach `user_id`, `generation_id` i `source` w tabeli `flashcards`, aby przyspieszyć operacje filtrowania i złączeń. Plan bazy danych (`db-plan.md`) już przewiduje te indeksy.
-   **Limit paginacji**: Maksymalna wartość parametru `limit` powinna być ograniczona po stronie serwera (np. do 100), aby zapobiec nadmiernemu obciążeniu bazy danych przez pojedyncze żądanie.
-   **Liczba zapytań**: Proces pobierania danych wymaga dwóch zapytań do bazy danych: jednego do pobrania paginowanej listy fiszek i drugiego do uzyskania całkowitej liczby pasujących rekordów. Jest to optymalne podejście dla paginacji.

## 8. Etapy wdrożenia
1.  **Schemat walidacji**: W pliku `src/lib/schemas/flashcard.schema.ts` zdefiniować nowy schemat Zod (`getFlashcardsQuerySchema`) do walidacji parametrów `page`, `limit`, `sort`, `order`, `source` i `generation_id`.
2.  **Serwis**: W pliku `src/lib/services/flashcard.service.ts` zaimplementować nową metodę `async getFlashcards(supabase: SupabaseClient, query: GetFlashcardsQueryDto)`. Metoda ta będzie:
    -   Konstruować zapytanie do tabeli `flashcards` z użyciem `supabase.from('flashcards').select()`.
    -   Dynamicznie dodawać filtry (`.eq()`, `.in()`) na podstawie parametrów `query`.
    -   Dynamicznie dodawać sortowanie (`.order()`).
    -   Implementować paginację za pomocą `.range()`.
    -   Wykonywać drugie zapytanie w celu pobrania całkowitej liczby rekordów (`select('*', { count: 'exact', head: true })`).
    -   Zwracać `PaginatedResponseDto<FlashcardDto>`.
3.  **Endpoint API**: W pliku `src/pages/api/flashcards.ts`:
    -   Zaimplementować handler `GET`.
    -   Pobrać parametry z `Astro.url.searchParams`.
    -   Użyć `getFlashcardsQuerySchema.safeParse()` do walidacji parametrów.
    -   W przypadku błędu walidacji, zwrócić odpowiedź `400`.
    -   Wywołać metodę `flashcardService.getFlashcards`, przekazując `context.locals.supabase` i zwalidowane dane.
    -   Zwrócić wynik z serwisu jako odpowiedź JSON ze statusem `200`.
4.  **Typy**: W pliku `src/types.ts` dodać `GetFlashcardsQueryDto` wyinferowany ze schematu Zod.
