# API Endpoint Implementation Plan: Get a single flashcard

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia pobranie pojedynczej fiszki na podstawie jej unikalnego identyfikatora (`id`). Dostęp jest ograniczony do uwierzytelnionych użytkowników, którzy mogą pobierać wyłącznie własne fiszki. W przypadku sukcesu zwraca obiekt fiszki, a w przypadku błędu odpowiedni kod statusu HTTP.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `GET`
-   **Struktura URL**: `/api/flashcards/{id}`
-   **Parametry**:
    -   **Wymagane**:
        -   `id` (parametr ścieżki): Unikalny identyfikator fiszki. Musi być liczbą całkowitą.
    -   **Opcjonalne**: Brak.
-   **Request Body**: Brak.

## 3. Wykorzystywane typy
-   **DTO**: `FlashcardDto` - Używany do strukturyzacji danych fiszki w odpowiedzi.
    ```typescript
    export type FlashcardDto = Pick<
      Flashcard,
      "id" | "generation_id" | "front" | "back" | "source" | "created_at" | "updated_at"
    >;
    ```

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu (200 OK)**:
    ```json
    {
      "id": 101,
      "generation_id": 1,
      "front": "What is the capital of Poland?",
      "back": "Warsaw",
      "source": "ai-full",
      "created_at": "2025-10-09T10:00:00Z",
      "updated_at": "2025-10-09T10:00:00Z"
    }
    ```
-   **Kody statusu**:
    -   `200 OK`: Fiszka została pomyślnie znaleziona i zwrócona.
    -   `400 Bad Request`: Identyfikator `id` jest nieprawidłowy (np. nie jest liczbą).
    -   `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
    -   `404 Not Found`: Fiszka o podanym `id` nie istnieje lub nie należy do zalogowanego użytkownika.
    -   `500 Internal Server Error`: Wystąpił nieoczekiwany błąd po stronie serwera.

## 5. Przepływ danych
1.  Klient wysyła żądanie `GET` na adres `/api/flashcards/{id}`.
2.  Middleware Astro weryfikuje sesję użytkownika i dołącza obiekt użytkownika do `context.locals`.
3.  Handler endpointu API weryfikuje, czy użytkownik jest uwierzytelniony.
4.  Handler waliduje parametr `id`, sprawdzając, czy jest to prawidłowa liczba.
5.  Handler wywołuje metodę `getFlashcardById(id, userId)` z serwisu `FlashcardService`.
6.  `FlashcardService` wykonuje zapytanie do bazy danych Supabase, aby pobrać fiszkę z tabeli `flashcards`, filtrując jednocześnie po `id` i `user_id`.
7.  Jeśli fiszka zostanie znaleziona, serwis zwraca dane do handlera.
8.  Handler formatuje dane przy użyciu `FlashcardDto` i wysyła odpowiedź JSON z kodem statusu `200 OK`.
9.  W przypadku błędu na którymkolwiek etapie (np. brak autoryzacji, nieznaleziona fiszka, błąd bazy danych), odpowiedni kod błędu jest zwracany do klienta.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Dostęp do endpointu jest chroniony. Middleware Astro musi zweryfikować token sesji użytkownika. Handler musi sprawdzić istnienie `context.locals.user` i zwrócić `401 Unauthorized`, jeśli go brakuje.
-   **Autoryzacja**: Zapytanie do bazy danych w `FlashcardService` musi zawierać warunek `WHERE user_id = :userId`, aby zapewnić, że użytkownicy mogą uzyskać dostęp tylko do swoich danych. Jest to kluczowy element, który działa jako druga linia obrony obok polityk RLS w Supabase.
-   **Walidacja danych wejściowych**: Parametr `id` musi być zweryfikowany jako liczba, aby zapobiec błędom zapytań do bazy danych i potencjalnym atakom.
-   **Zapobieganie wyliczaniu identyfikatorów (ID Enumeration)**: Zwracanie tego samego błędu `404 Not Found` zarówno dla nieistniejących fiszek, jak i dla fiszek należących do innego użytkownika, uniemożliwia atakującym odgadnięcie, które identyfikatory są prawidłowe.

## 7. Rozważania dotyczące wydajności
-   **Indeksowanie bazy danych**: Tabela `flashcards` powinna mieć indeks na kolumnie `user_id`, aby przyspieszyć zapytania. Zgodnie z planem bazy danych (`db-plan.md`), taki indeks (`idx_flashcards_user_id`) już istnieje. Ponieważ `id` jest kluczem głównym, jest on automatycznie indeksowany.
-   **Rozmiar odpowiedzi**: Odpowiedź zawiera tylko niezbędne pola dzięki zastosowaniu `FlashcardDto`, co minimalizuje transfer danych.
-   **Złożoność zapytania**: Zapytanie jest proste (SELECT z warunkiem WHERE), co zapewnia wysoką wydajność.

## 8. Etapy wdrożenia
1.  **Modyfikacja serwisu `FlashcardService`**:
    -   W pliku `src/lib/services/flashcard.service.ts` zaimplementuj nową metodę asynchroniczną `getFlashcardById(id: number, userId: string): Promise<FlashcardDto | null>`.
    -   Wewnątrz metody użyj klienta Supabase, aby wykonać zapytanie `select()` do tabeli `flashcards`.
    -   Dodaj warunki `.eq('id', id)` i `.eq('user_id', userId)`, a także `.single()` do zapytania.
    -   Zaimplementuj obsługę błędów dla zapytania do bazy danych.
    -   Jeśli dane zostaną znalezione, zwróć je. W przeciwnym razie zwróć `null`.

2.  **Implementacja handlera endpointu API**:
    -   W pliku `src/pages/api/flashcards.ts` dodaj nową dynamiczną ścieżkę dla pojedynczej fiszki, np. tworząc plik `src/pages/api/flashcards/[id].ts`.
    -   Zaimplementuj handler `GET` dla tego endpointu.
    -   Sprawdź, czy `context.locals.user` istnieje. Jeśli nie, zwróć odpowiedź z kodem `401`.
    -   Pobierz `id` z `context.params` i przekonwertuj je na liczbę. Sprawdź, czy konwersja się powiodła. Jeśli nie, zwróć odpowiedź z kodem `400`.
    -   Wywołaj metodę `flashcardService.getFlashcardById()` z poprawnymi parametrami (`id` i `user.id`).
    -   Jeśli metoda zwróci `null`, zwróć odpowiedź z kodem `404`.
    -   Jeśli metoda zwróci dane fiszki, zwróć je w odpowiedzi JSON z kodem `200`.
    -   Dodaj blok `try...catch` do obsługi nieoczekiwanych błędów i zwracaj odpowiedź z kodem `500`.
    -   Dodaj `export const prerender = false;` na końcu pliku.
