# API Endpoint Implementation Plan: Delete a Flashcard

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom trwałe usunięcie jednej ze swoich fiszek na podstawie jej unikalnego identyfikatora. Operacja jest nieodwracalna.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `DELETE`
-   **Struktura URL**: `/api/flashcards/{id}`
-   **Parametry**:
    -   **Wymagane**:
        -   `id` (parametr ścieżki): Numeryczny identyfikator fiszki do usunięcia.
-   **Request Body**: Brak.

## 3. Wykorzystywane typy
Dla tego punktu końcowego nie są wymagane żadne nowe typy DTO ani Command Modele.

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu**:
    -   **Kod stanu**: `204 No Content`
    -   **Ciało odpowiedzi**: Puste.
-   **Odpowiedzi błędów**:
    -   **Kod stanu**: `400 Bad Request` (np. gdy `id` nie jest liczbą).
    -   **Kod stanu**: `401 Unauthorized` (gdy użytkownik nie jest zalogowany).
    -   **Kod stanu**: `404 Not Found` (gdy fiszka nie istnieje lub nie należy do użytkownika).
    -   **Kod stanu**: `500 Internal Server Error` (w przypadku nieoczekiwanych błędów serwera).

## 5. Przepływ danych
1.  Użytkownik wysyła żądanie `DELETE` na adres `/api/flashcards/{id}`.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje token sesji użytkownika i w przypadku sukcesu dołącza obiekt `supabase` i `user` do `context.locals`. W razie niepowodzenia zwraca `401 Unauthorized`.
3.  Handler API w pliku `src/pages/api/flashcards/[id].ts` odbiera żądanie.
4.  Handler waliduje parametr `id` z URL, sprawdzając, czy jest to poprawna, dodatnia liczba całkowita. Jeśli nie, zwraca `400 Bad Request`.
5.  Handler wywołuje funkcję `deleteFlashcard(id, userId)` z serwisu `flashcard.service.ts`, przekazując sparsowane `id` oraz `id` użytkownika z `context.locals.user`.
6.  Funkcja `deleteFlashcard` wykonuje zapytanie `DELETE` w bazie danych Supabase, używając warunków `id = :id` i `user_id = :userId`.
7.  Baza danych (dzięki RLS i warunkowi w zapytaniu) usuwa wiersz tylko wtedy, gdy oba warunki są spełnione.
8.  Serwis zwraca liczbę usuniętych wierszy do handlera.
9.  Jeśli liczba usuniętych wierszy wynosi `0`, handler zwraca `404 Not Found`.
10. Jeśli liczba usuniętych wierszy wynosi `1`, handler zwraca `204 No Content`.
11. W przypadku błędu na którymkolwiek etapie po stronie serwera (np. błąd połączenia z bazą), zwracany jest status `500 Internal Server Error`.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Dostęp do punktu końcowego musi być chroniony. Middleware Astro będzie odpowiedzialne za weryfikację sesji użytkownika przed przetworzeniem żądania.
-   **Autoryzacja**: Kluczowe jest, aby użytkownik mógł usunąć tylko własne fiszki. Zostanie to zapewnione na dwóch poziomach:
    1.  **Poziom aplikacji**: Zapytanie `DELETE` w `flashcard.service.ts` będzie zawierało warunek `WHERE user_id = {userId}`.
    2.  **Poziom bazy danych**: Skonfigurowane zasady RLS (Row Level Security) w Supabase dodatkowo zabezpieczą dane, uniemożliwiając modyfikację zasobów nienależących do zalogowanego użytkownika.
-   **Walidacja danych wejściowych**: Parametr `id` musi być rygorystycznie walidowany, aby upewnić się, że jest to poprawna liczba. Zapobiegnie to błędom zapytań i potencjalnym atakom (np. SQL Injection, chociaż Supabase SDK parametryzuje zapytania).

## 7. Rozważania dotyczące wydajności
-   Operacja `DELETE` na indeksowanym kluczu głównym (`id`) jest wysoce wydajna w PostgreSQL.
-   Dodatkowy warunek na `user_id` również będzie wydajny, ponieważ na tej kolumnie istnieje indeks (`idx_flashcards_user_id`).
-   Nie przewiduje się problemów z wydajnością dla tego punktu końcowego, ponieważ operacja dotyczy pojedynczego rekordu.

## 8. Etapy wdrożenia
1.  **Aktualizacja Serwisu (`flashcard.service.ts`)**:
    -   Dodać nową, eksportowaną funkcję asynchroniczną `deleteFlashcard`.
    -   Funkcja powinna przyjmować dwa argumenty: `id: number` i `userId: string`.
    -   Wewnątrz funkcji, użyć klienta Supabase do wykonania operacji `delete()` na tabeli `flashcards`.
    -   Zapytanie musi zawierać `match({ id: id, user_id: userId })` w celu zapewnienia, że usuwana jest właściwa fiszka należąca do danego użytkownika.
    -   Funkcja powinna zwracać wynik operacji, w szczególności informację o powodzeniu lub liczbie usuniętych rekordów.
2.  **Utworzenie Handlera API (`[id].ts`)**:
    -   Utworzyć nowy plik `src/pages/api/flashcards/[id].ts`.
    -   Zaimplementować handler dla metody `DELETE`.
    -   Upewnić się, że `export const prerender = false` jest ustawione.
    -   Pobrać `id` z `Astro.params`.
    -   Zwalidować `id` - sparsować je do liczby całkowitej i sprawdzić, czy jest dodatnia. W przypadku błędu zwrócić `400 Bad Request`.
    -   Pobrać `user` i `supabase` z `Astro.locals`.
    -   Wywołać nową funkcję `deleteFlashcard` z serwisu, przekazując `id` i `user.id`.
    -   Na podstawie wyniku zwróconego przez serwis, zwrócić odpowiedni kod statusu: `204 No Content` w przypadku sukcesu lub `404 Not Found`, jeśli fiszka nie została znaleziona/usunięta.
    -   Dodać blok `try...catch` do obsługi ewentualnych błędów z serwisu i zwrócenia `500 Internal Server Error`.
