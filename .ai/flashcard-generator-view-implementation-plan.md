# Plan implementacji widoku Generatora Fiszek

## 1. Przegląd
Widok Generatora Fiszek to główne narzędzie w aplikacji, umożliwiające użytkownikom automatyczne tworzenie fiszek na podstawie dostarczonego tekstu. Użytkownik wkleja tekst, inicjuje proces generowania za pomocą AI, a następnie otrzymuje listę propozycji fiszek. W tym widoku może przeglądać, edytować i usuwać propozycje przed ostatecznym zapisaniem ich w swojej kolekcji. Stan widoku jest zarządzany w całości po stronie klienta, co oznacza, że niezapisane zmiany zostaną utracone po odświeżeniu strony.

## 2. Routing widoku
Widok będzie dostępny pod główną ścieżką aplikacji dla zalogowanych użytkowników:
- **Ścieżka:** `/` lub `/generate` (zostanie zaimplementowany jako `src/pages/index.astro`)

## 3. Struktura komponentów
Główny komponent `FlashcardGenerator` będzie renderowany po stronie klienta i będzie zawierał całą logikę.

```
/src/pages/index.astro
└── <FlashcardGenerator client:only="react">
    ├── <SourceTextInput />
    ├── <Button "Generuj fiszki" />
    ├── <Loader /> (warunkowo)
    ├── <ErrorMessage /> (warunkowo)
    └── <FlashcardProposalGrid>
        ├── <FlashcardProposalCard />
        ├── <FlashcardProposalCard />
        ├── ...
        └── <Button "Zapisz wszystkie" />
```

## 4. Szczegóły komponentów
### `FlashcardGenerator` (Komponent kontenerowy)
- **Opis komponentu:** Główny komponent React, który zarządza całym stanem i logiką generatora. Odpowiada za komunikację z API, obsługę stanu ładowania, błędów oraz zarządzanie listą propozycji fiszek.
- **Główne elementy:** `SourceTextInput`, `FlashcardProposalGrid`, przyciski akcji (`Button` z Shadcn/ui), `Loader` (lub `Spinner`).
- **Obsługiwane interakcje:**
  - Wprowadzanie tekstu źródłowego.
  - Inicjowanie generowania fiszek.
  - Aktualizacja i usuwanie poszczególnych propozycji fiszek.
  - Zapisywanie wszystkich zweryfikowanych fiszek.
- **Obsługiwana walidacja:** Sprawdza, czy długość tekstu źródłowego mieści się w zakresie 1000-10000 znaków.
- **Typy:** `FlashcardProposalViewModel[]`, `CreateGenerationCommand`, `CreateFlashcardCommand[]`.
- **Propsy:** Brak.

### `SourceTextInput`
- **Opis komponentu:** Komponent do wprowadzania tekstu źródłowego przez użytkownika. Zawija `textarea` i wyświetla licznik znaków.
- **Główne elementy:** `label`, `Textarea` (z Shadcn/ui), `p` (dla licznika znaków).
- **Obsługiwane interakcje:** `onChange` na polu `textarea`.
- **Obsługiwana walidacja:** Wizualne wskazanie liczby znaków.
- **Typy:** `string`.
- **Propsy:**
  - `value: string`
  - `onTextChange: (text: string) => void`
  - `minLength: number`
  - `maxLength: number`

### `FlashcardProposalGrid`
- **Opis komponentu:** Wyświetla siatkę propozycji fiszek otrzymanych z API. Iteruje po liście propozycji i renderuje dla każdej z nich komponent `FlashcardProposalCard`.
- **Główne elementy:** Kontener `div` z `grid layout`, przycisk "Zapisz wszystkie".
- **Obsługiwane interakcje:** Kliknięcie przycisku "Zapisz wszystkie".
- **Obsługiwana walidacja:** Brak.
- **Typy:** `FlashcardProposalViewModel[]`.
- **Propsy:**
  - `proposals: FlashcardProposalViewModel[]`
  - `onUpdateProposal: (id: string, front: string, back: string) => void`
  - `onDeleteProposal: (id: string) => void`
  - `onSaveAll: () => void`

### `FlashcardProposalCard`
- **Opis komponentu:** Reprezentuje pojedynczą propozycję fiszki. Posiada dwa stany: widoku i edycji, zarządzane wewnętrznie.
- **Główne elementy:**
  - **Tryb widoku:** Wyświetla tekst `front` i `back`, przyciski "Edytuj" i "Usuń".
  - **Tryb edycji:** Wyświetla pola `Input` lub `Textarea` dla `front` i `back`, przyciski "Zapisz" i "Anuluj".
- **Obsługiwane interakcje:** Przełączanie między trybem edycji a widoku, zapisywanie zmian, usuwanie karty.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `FlashcardProposalViewModel`.
- **Propsy:**
  - `proposal: FlashcardProposalViewModel`
  - `onUpdate: (front: string, back: string) => void`
  - `onDelete: () => void`

## 5. Typy
Do implementacji widoku, oprócz istniejących typów DTO, potrzebny będzie nowy typ `ViewModel` do zarządzania stanem propozycji fiszek po stronie klienta.

```typescript
// Ten typ powinien zostać zdefiniowany w pliku komponentu FlashcardGenerator lub w dedykowanym pliku z typami dla widoku.
import type { FlashcardProposalDto } from "@/types";

/**
 * ViewModel dla propozycji fiszki, rozszerzający DTO o dane potrzebne w UI.
 */
export type FlashcardProposalViewModel = FlashcardProposalDto & {
  /**
   * Unikalny identyfikator na potrzeby UI (np. UUID lub indeks), kluczowy dla operacji w React.
   */
  id: string;
  /**
   * Flaga wskazująca, czy użytkownik zmodyfikował daną propozycję.
   * Używane do określenia `source` ("ai-full" vs "ai-edited") podczas zapisu.
   */
  isEdited: boolean;
};
```

## 6. Zarządzanie stanem
Cała logika i stan zostaną zamknięte w customowym hooku `useFlashcardGenerator`, co zapewni czystość i reużywalność.

**`useFlashcardGenerator` hook:**
- **Cel:** Zarządzanie cyklem życia widoku: od wprowadzania tekstu, przez generowanie, edycję, aż po zapis fiszek.
- **Zarządzany stan:**
  - `sourceText: string`: Tekst z `textarea`.
  - `proposals: FlashcardProposalViewModel[]`: Lista propozycji fiszek.
  - `status: 'idle' | 'loading' | 'success' | 'error'`: Faza przetwarzania.
  - `error: string | null`: Komunikat błędu.
- **Udostępniane funkcje:**
  - `setSourceText`: Aktualizuje tekst źródłowy.
  - `handleGenerate`: Wywołuje `POST /api/generations`.
  - `handleUpdateProposal`: Modyfikuje propozycję na liście.
  - `handleDeleteProposal`: Usuwa propozycję z listy.
  - `handleSaveAll`: Wywołuje `POST /api/flashcards`.

## 7. Integracja API
### 1. Generowanie propozycji fiszek
- **Endpoint:** `POST /api/generations`
- **Wywołanie:** Po kliknięciu przycisku "Generuj fiszki".
- **Typ żądania:** `CreateGenerationCommand` (`{ source_text: string }`)
- **Typ odpowiedzi ( sukces, 201):** `CreateGenerationResponseDto` (`{ generation_id: number, flashcards_proposals: FlashcardProposalDto[], ... }`)
- **Obsługa:** Odpowiedź jest mapowana na `FlashcardProposalViewModel[]`, dodając unikalne `id` i `isEdited: false` do każdego elementu.

### 2. Zapisywanie zaakceptowanych fiszek
- **Endpoint:** `POST /api/flashcards`
- **Wywołanie:** Po kliknięciu przycisku "Zapisz wszystkie".
- **Typ żądania:** `CreateFlashcardCommand[]`. Każdy element tablicy będzie miał postać:
  ```typescript
  {
    front: string;
    back: string;
    source: "ai-full" | "ai-edited"; // Ustawiane na podstawie flagi `isEdited` w ViewModelu
  }
  ```
- **Typ odpowiedzi (sukces, 201):** `FlashcardDto[]`
- **Obsługa:** Po pomyślnym zapisie stan widoku jest resetowany, a użytkownik otrzymuje powiadomienie o sukcesie (np. toast).

## 8. Interakcje użytkownika
1. **Wprowadzanie tekstu:** Użytkownik wpisuje lub wkleja tekst. Interfejs na bieżąco aktualizuje licznik znaków i stan przycisku "Generuj fiszki".
2. **Generowanie:** Użytkownik klika "Generuj fiszki". Przycisk staje się nieaktywny, pojawia się wskaźnik ładowania.
3. **Weryfikacja:** Po otrzymaniu odpowiedzi z API, na ekranie pojawia się siatka z propozycjami.
4. **Edycja:** Użytkownik klika "Edytuj" na karcie, co przełącza ją w tryb edycji. Po modyfikacji i kliknięciu "Zapisz", zmiany są zapisywane w stanie lokalnym, a flaga `isEdited` jest ustawiana na `true`.
5. **Usuwanie:** Użytkownik klika "Usuń" na karcie, co usuwa ją z lokalnej listy propozycji.
6. **Zapis:** Użytkownik klika "Zapisz wszystkie". Przycisk zostaje zablokowany, pojawia się wskaźnik ładowania. Aplikacja wysyła przetworzoną listę do API. Po sukcesie widok jest czyszczony.

## 9. Warunki i walidacja
- **Warunek:** Długość `source_text` musi zawierać się w przedziale od 1000 do 10000 znaków.
- **Komponent:** `FlashcardGenerator` / `useFlashcardGenerator`.
- **Implementacja:**
  - Wartość boolowska `isTextValid` będzie wyliczana na podstawie `sourceText.length`.
  - Przycisk "Generuj fiszki" będzie miał atrybut `disabled={!isTextValid || status === 'loading'}`.
  - Zapobiega to wysyłaniu niepoprawnych żądań do API i daje natychmiastową informację zwrotną użytkownikowi.

## 10. Obsługa błędów
- **Błędy walidacji (400):** Jeśli API zwróci błąd walidacji, komunikat zostanie wyświetlony użytkownikowi w dedykowanym komponencie `ErrorMessage`.
- **Błędy serwera (500):** Użytkownik zobaczy ogólny komunikat o błędzie, np. "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później."
- **Błędy sieciowe:** W przypadku problemów z połączeniem, hook `useFlashcardGenerator` przechwyci błąd i wyświetli stosowny komunikat, np. "Błąd połączenia. Sprawdź swoją sieć."
- **Stan UI:** W przypadku błędu `status` zostanie ustawiony na `'error'`, a ładowanie przerwane. Komunikat błędu powinien być możliwy do zamknięcia lub zniknąć po rozpoczęciu nowej akcji przez użytkownika.

## 11. Kroki implementacji
1. **Utworzenie pliku strony:** Stworzyć plik `src/pages/index.astro`.
2. **Struktura komponentu głównego:** W `src/components/` stworzyć plik `FlashcardGenerator.tsx` i osadzić go w `index.astro` z dyrektywą `client:only="react"`.
3. **Implementacja `useFlashcardGenerator`:**
   - Zdefiniować stan (`sourceText`, `proposals`, `status`, `error`).
   - Zaimplementować logikę do zmiany `sourceText` i walidacji długości.
4. **Stworzenie komponentów UI:**
   - Zaimplementować `SourceTextInput` z wykorzystaniem `Textarea` z Shadcn/ui.
   - Zaimplementować szkielety komponentów `FlashcardProposalGrid` i `FlashcardProposalCard`.
5. **Integracja z API generowania:**
   - W `useFlashcardGenerator` zaimplementować funkcję `handleGenerate`.
   - Dodać obsługę stanu ładowania i błędów.
   - Połączyć logikę z przyciskiem "Generuj fiszki".
   - Zaimplementować mapowanie `FlashcardProposalDto` na `FlashcardProposalViewModel`.
6. **Implementacja logiki weryfikacji:**
   - Dokończyć implementację `FlashcardProposalCard`, w tym wewnętrzny stan edycji.
   - W `useFlashcardGenerator` zaimplementować funkcje `handleUpdateProposal` i `handleDeleteProposal`.
   - Przekazać te funkcje jako propsy przez `FlashcardProposalGrid` do odpowiednich kart.
7. **Integracja z API zapisu:**
   - W `useFlashcardGenerator` zaimplementować funkcję `handleSaveAll`.
   - Dodać logikę transformacji `FlashcardProposalViewModel[]` na `CreateFlashcardCommand[]`, poprawnie ustawiając pole `source`.
   - Połączyć logikę z przyciskiem "Zapisz wszystkie".
8. **Finalne szlify i obsługa błędów:**
   - Dodać komponent do wyświetlania komunikatów o błędach.
   - Upewnić się, że wszystkie stany ładowania są poprawnie obsługiwane, blokując interfejs w odpowiednich momentach.
   - Dodać powiadomienie "toast" o pomyślnym zapisaniu fiszek.
   - Przetestować cały przepływ manualnie.
