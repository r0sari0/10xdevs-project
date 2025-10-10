# API Endpoint Implementation Plan: Create Flashcards

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom tworzenie jednej lub więcej fiszek w jednej operacji (bulk). Przyjmuje tablicę obiektów fiszek i zapisuje je w bazie danych, kojarząc je z zalogowanym użytkownikiem. W odpowiedzi zwraca tablicę nowo utworzonych fiszek.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `POST`
-   **Struktura URL**: `/api/flashcards`
-   **Ciało żądania**: Ciało żądania musi być tablicą JSON, zawierającą od 1 do 100 obiektów fiszek.
    ```json
    [
      {
        "front": "What is the speed of light?",
        "back": "299,792,458 m/s",
        "source": "manual"
      },
      {
        "front": "What is the capital of France?",
        "back": "Paris",
        "source": "ai-full"
      }
    ]
    ```
-   **Parametry obiektu fiszki**:
    -   `front` (Wymagane): `string`, min. 1 znak, maks. 200 znaków.
    -   `back` (Wymagane): `string`, min. 1 znak, maks. 500 znaków.
    -   `source` (Wymagane): `string`, musi być jedną z wartości: `"manual"`, `"ai-full"`, lub `"ai-edited"`.

## 3. Wykorzystywane typy
-   **Command Model**: `CreateFlashcardCommand[]` - tablica obiektów, gdzie każdy obiekt jest zgodny z typem `CreateFlashcardCommand` z `src/types.ts`.
-   **DTO**: `FlashcardDto[]` - odpowiedź będzie tablicą obiektów zgodnych z typem `FlashcardDto` z `src/types.ts`.

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu (201 Created)**: Zwraca tablicę JSON nowo utworzonych obiektów fiszek, z których każdy zawiera `id`, `generation_id` (w tym przypadku `null`), `front`, `back`, `source`, `created_at` i `updated_at`.
    ```json
    [
      {
        "id": 103,
        "generation_id": null,
        "front": "What is the speed of light?",
        "back": "299,792,458 m/s",
        "source": "manual",
        "created_at": "2025-10-09T11:00:00Z",
        "updated_at": "2025-10-09T11:00:00Z"
      }
    ]
    ```
-   **Odpowiedzi błędów**:
    -   `400 Bad Request`: Błąd walidacji danych wejściowych.
    -   `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
    -   `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1.  Klient wysyła żądanie `POST` do `/api/flashcards` z tablicą danych fiszek w ciele żądania.
2.  Oprogramowanie pośredniczące Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje sesję użytkownika i udostępnia dane użytkownika w `Astro.locals`.
3.  Handler punktu końcowego (`src/pages/api/flashcards.ts`) otrzymuje żądanie.
4.  Sprawdza, czy użytkownik jest uwierzytelniony, sprawdzając `Astro.locals`. Jeśli nie, zwraca `401`.
5.  Waliduje ciało żądania za pomocą schematu Zod w celu zapewnienia, że jest to niepusta tablica (do 100 elementów) prawidłowych obiektów fiszek. Jeśli walidacja zawiedzie, zwraca `400`.
6.  Handler wywołuje metodę `createFlashcards` z nowego `FlashcardService`, przekazując ID użytkownika i zwalidowane dane fiszek.
7.  `FlashcardService` mapuje tablicę wejściową, dodając do każdego obiektu `user_id` pobrane z sesji.
8.  Serwis wykonuje operację masowego wstawiania (`.insert()`) do tabeli `flashcards` w Supabase.
9.  Po pomyślnym wstawieniu, serwis mapuje zwrócone rekordy bazy danych na tablicę `FlashcardDto`.
10. Handler API odbiera tablicę DTO, serializuje ją do formatu JSON i wysyła odpowiedź `201 Created` do klienta.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Dostęp do punktu końcowego jest ograniczony do uwierzytelnionych użytkowników. Oprogramowanie pośredniczące Astro będzie odpowiedzialne za walidację tokenów/sesji. Handler musi jawnie sprawdzić istnienie sesji użytkownika.
-   **Autoryzacja**: Identyfikator `user_id` dla nowo tworzonych fiszek musi być pobierany z obiektu sesji serwera (`Astro.locals`), a nie z ciała żądania. Zapobiega to podszywaniu się pod innych użytkowników. Polityki RLS (Row Level Security) w Supabase zapewniają dodatkową warstwę ochrony.
-   **Walidacja danych wejściowych**: Rygorystyczna walidacja za pomocą Zod zapobiega wprowadzaniu nieprawidłowych lub źle sformułowanych danych. Obejmuje to sprawdzanie typów, długości ciągów znaków oraz wartości enum dla pola `source`.

## 7. Obsługa błędów
-   **Błędy walidacji (400)**: Zwracane, gdy ciało żądania nie przejdzie walidacji Zod. Odpowiedź powinna zawierać szczegółowe informacje o błędach walidacji.
-   **Błędy uwierzytelniania (401)**: Zwracane, gdy żądanie nie zawiera ważnych danych uwierzytelniających.
-   **Błędy serwera (500)**: W przypadku niepowodzenia operacji na bazie danych lub wystąpienia innego nieoczekiwanego błędu, błąd jest logowany na serwerze, a do klienta zwracana jest generyczna odpowiedź o błędzie.

## 8. Rozważania dotyczące wydajności
-   **Masowe wstawianie**: Użycie pojedynczej operacji `.insert()` dla wielu wierszy jest znacznie bardziej wydajne niż wykonywanie wielu pojedynczych zapytań w pętli. Supabase SDK obsługuje to domyślnie przy przekazaniu tablicy obiektów.
-   **Rozmiar ładunku**: Walidacja maksymalnej liczby fiszek na żądanie pomaga utrzymać rozsądny rozmiar ładunku żądania i odpowiedzi.

## 9. Etapy wdrożenia
1.  **Tworzenie schematu walidacji**:
    -   W nowym pliku `src/lib/schemas/flashcard.schema.ts` zdefiniuj schemat Zod dla obiektu `CreateFlashcardCommand` oraz dla tablicy tych obiektów, uwzględniając wszystkie ograniczenia (długość, typy, wartości enum, maksymalna liczba elementów w tablicy).
2.  **Tworzenie serwisu `FlashcardService`**:
    -   Utwórz nowy plik `src/lib/services/flashcard.service.ts`.
    -   Zaimplementuj w nim klasę `FlashcardService`.
    -   Dodaj publiczną metodę asynchroniczną `createFlashcards(userId: string, flashcardsData: CreateFlashcardCommand[]): Promise<FlashcardDto[]>`.
    -   Wewnątrz tej metody:
        -   Przygotuj dane do wstawienia, dodając `user_id` do każdego obiektu fiszki.
        -   Użyj klienta Supabase, aby wstawić dane do tabeli `flashcards`.
        -   Obsłuż potencjalne błędy z bazy danych.
        -   Zmapuj pomyślny wynik na tablicę `FlashcardDto` i ją zwróć.
3.  **Implementacja punktu końcowego API**:
    -   Utwórz nowy plik `src/pages/api/flashcards.ts`.
    -   Zaimplementuj funkcję `POST`, która będzie pełnić rolę handlera żądania.
    -   Pobierz sesję użytkownika z `Astro.locals` i sprawdź uwierzytelnienie.
    -   Pobierz i zwaliduj ciało żądania za pomocą wcześniej zdefiniowanego schematu Zod.
    -   W bloku `try...catch`:
        -   Utwórz instancję `FlashcardService`.
        -   Wywołaj metodę `createFlashcards`.
        -   Zwróć odpowiedź `201 Created` z danymi DTO.
    -   W bloku `catch` obsłuż błędy i zwróć odpowiednie kody statusu (`400`, `500`).
4.  **Aktualizacja typów**:
    -   Jeśli to konieczne, zaktualizuj `src/types.ts`, aby upewnić się, że wszystkie potrzebne typy są poprawnie zdefiniowane i wyeksportowane.
