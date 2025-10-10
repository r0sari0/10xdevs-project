# API Endpoint Implementation Plan: Create AI Flashcard Generation Job

## 1. Przegląd punktu końcowego

Ten punkt końcowy inicjuje zadanie generowania fiszek przez AI. Odbiera tekst źródłowy od uwierzytelnionego użytkownika, przetwarza go za pomocą zewnętrznego serwisu AI, a następnie zapisuje wyniki w bazie danych. W odpowiedzi zwraca podsumowanie zadania generowania oraz listę propozycji nowo utworzonych fiszek.

## 2. Szczegóły żądania

-   **Metoda HTTP**: `POST`
-   **Struktura URL**: `/api/generations`
-   **Request Body**: Ciało żądania musi zawierać obiekt JSON o następującej strukturze:
    ```json
    {
      "source_text": "Długi tekst źródłowy (od 1000 do 10000 znaków), na podstawie którego zostaną wygenerowane fiszki."
    }
    ```

## 3. Wykorzystywane typy

Do implementacji zostaną wykorzystane następujące, predefiniowane w `src/types.ts`, typy DTO i Command Modele:

-   **Command Model**:
    -   `CreateGenerationCommand`: Reprezentuje dane wejściowe dla operacji tworzenia.
-   **DTOs**:
    -   `CreateGenerationResponseDto`: Struktura danych zwracana w przypadku pomyślnego utworzenia zadania.
    -   `FlashcardProposalDto`: Reprezentuje obiekty w tablicy `flashcards_proposals`.

## 4. Szczegóły odpowiedzi

-   **Odpowiedź sukcesu (`201 Created`)**:
    ```json
    {
      "generation_id": 1,
      "flashcards_proposals": [
        {
          "front": "Jakie jest stolica Polski?",
          "back": "Warszawa",
          "source": "ai-full"
        }
      ],
      "generated_count": 15
    }
    ```
-   **Odpowiedzi błędów**:
    -   `400 Bad Request`: Błąd walidacji danych wejściowych.
    -   `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
    -   `500 Internal Server Error`: Wewnętrzny błąd serwera (np. błąd komunikacji z AI, błąd bazy danych).

## 5. Przepływ danych

1.  Klient wysyła żądanie `POST` na adres `/api/generations` z `source_text` w ciele.
2.  Middleware Astro weryfikuje sesję użytkownika na podstawie `Astro.locals.session`. W przypadku braku sesji, zwraca `401`.
3.  Handler endpointu (`src/pages/api/generations.ts`) odbiera żądanie.
4.  Handler waliduje ciało żądania przy użyciu schemy Zod, sprawdzając obecność i długość `source_text`. W przypadku błędu zwraca `400`.
5.  Handler wywołuje metodę `createGeneration` z nowo utworzonego `GenerationService`, przekazując tekst, ID użytkownika i klienta Supabase z `Astro.locals.supabase`.
6.  `GenerationService` rozpoczyna pomiar czasu operacji.
7.  Serwis oblicza hash SHA-256 oraz długość tekstu źródłowego.
8.  Serwis wysyła `source_text` do zewnętrznego API AI (OpenRouter.ai).
9.  Po otrzymaniu odpowiedzi, serwis parsuje ją, aby uzyskać listę propozycji fiszek.
10. Serwis rozpoczyna transakcję w bazie danych.
11. Zapisuje nowy rekord w tabeli `generations` z obliczonymi metadanymi.
12. Nie zapisuje propozycji fiszek do tabeli `flashcards` – propozycje są zwracane użytkownikowi, a zapis do tabeli `flashcards` nastąpi dopiero, gdy użytkownik zaakceptuje wybrane fiszki.
13. Zatwierdza transakcję.
14. Kończy pomiar czasu i oblicza `generation_duration`.
15. Formatuje dane do struktury `CreateGenerationResponseDto`.
16. Handler API zwraca DTO z kodem statusu `201 Created`.
17. Jeśli na którymkolwiek etapie (od 8 do 13) wystąpi błąd, serwis przechwytuje wyjątek, zapisuje szczegóły w tabeli `generation_error_logs`, a następnie rzuca błędem, co skutkuje odpowiedzią `500` od handlera.

## 6. Względy bezpieczeństwa

-   **Uwierzytelnianie**: Dostęp do endpointu jest chroniony. Middleware (`src/middleware/index.ts`) musi zapewnić, że `Astro.locals.session` zawiera aktywne dane sesji. Żądania bez uwierzytelnienia zostaną odrzucone z kodem `401 Unauthorized`.
-   **Walidacja wejścia**: Użycie biblioteki `zod` do walidacji `source_text` (typ `string`, długość min. 1000, maks. 10000) zapobiega błędom bazy danych i nieoczekiwanemu zachowaniu aplikacji.
-   **Zarządzanie sekretami**: Klucz API do OpenRouter.ai musi być przechowywany w zmiennych środowiskowych po stronie serwera (`import.meta.env.OPENROUTER_API_KEY`) i nie może być nigdy ujawniony w kodzie front-endowym.
-   **Rate Limiting (Rekomendacja)**: Należy rozważyć wprowadzenie mechanizmu ograniczania liczby żądań na użytkownika, aby zapobiec nadużywaniu kosztownych zasobów AI.

## 7. Obsługa błędów

| Kod statusu              | Wyzwalacz                                                              | Akcja                                                                             |
| ------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `400 Bad Request`        | Błąd walidacji Zod (brak `source_text` lub nieprawidłowa długość).     | Zwrócenie odpowiedzi z informacją o błędzie walidacji.                            |
| `401 Unauthorized`       | Brak aktywnej sesji użytkownika w `Astro.locals.session`.              | Zwrócenie odpowiedzi z informacją o braku autoryzacji.                            |
| `500 Internal Server Error` | Błąd API AI, błąd transakcji bazy danych, lub inny błąd serwera. | Zapisanie szczegółów błędu w tabeli `generation_error_logs`, zwrócenie ogólnej odpowiedzi o błędzie serwera. |

## 8. Rozważania dotyczące wydajności

-   **Wąskie gardło**: Głównym czynnikiem wpływającym na czas odpowiedzi będzie zewnętrzne wywołanie API AI, które jest operacją asynchroniczną i może trwać kilka sekund.
-   **Operacje na bazie danych**: Zapisy do tabel `generations` i `flashcards` zostaną wykonane w ramach jednej transakcji, aby zapewnić spójność danych i zoptymalizować wydajność operacji bazodanowych.
-   **Hashing**: Obliczanie hasha SHA-256 jest operacją szybką i nie będzie miało znaczącego wpływu na wydajność.

## 9. Etapy wdrożenia

1.  **Utworzenie schemy walidacji**: Stworzyć plik `src/lib/schemas/generation.schema.ts` i zdefiniować w nim schemę `CreateGenerationSchema` używając `zod` do walidacji `source_text`.
2.  **Implementacja serwisu**:
    -   Utworzyć plik `src/lib/services/generation.service.ts`.
    -   Zaimplementować w nim klasę `GenerationService` z publiczną metodą `createGeneration(sourceText: string, userId: string, supabase: SupabaseClient)`.
    -   Wewnątrz metody zaimplementować pełen przepływ danych (pomiar czasu, hashing, wywołanie API AI, transakcja bazodanowa, obsługa błędów z logowaniem do `generation_error_logs`).
3.  **Implementacja endpointu API**:
    -   Utworzyć plik `src/pages/api/generations.ts`.
    -   Dodać `export const prerender = false;`.
    -   Zaimplementować handler `POST`, który:
        -   Pobiera sesję użytkownika i klienta Supabase z `Astro.locals`.
        -   Waliduje ciało żądania przy użyciu `CreateGenerationSchema`.
        -   Wywołuje metodę `generationService.createGeneration(...)` w bloku `try...catch`.
        -   W przypadku sukcesu, zwraca odpowiedź `201 Created` z danymi z serwisu.
        -   W przypadku błędu, zwraca odpowiedź `500 Internal Server Error`.
4.  **Konfiguracja zmiennych środowiskowych**: Upewnić się, że klucz `OPENROUTER_API_KEY` jest poprawnie skonfigurowany w zmiennych środowiskowych projektu.
