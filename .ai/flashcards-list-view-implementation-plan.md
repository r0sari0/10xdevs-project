# Plan implementacji widoku "Moje Fiszki"

## 1. Przegląd

Widok "Moje Fiszki" jest centralnym miejscem do zarządzania całą kolekcją fiszek użytkownika. Umożliwia użytkownikowi:
- Przeglądanie wszystkich zapisanych fiszek w postaci listy z paginacją
- Sortowanie fiszek po różnych kryteriach (data utworzenia, ostatnia aktualizacja, źródło)
- Ręczne dodawanie nowych fiszek poprzez formularz
- Edycję istniejących fiszek
- Usuwanie fiszek z możliwością potwierdzenia
- Przeglądanie informacji o źródle fiszki (AI-wygenerowana, ręcznie utworzona, edytowana)

Widok jest dostępny wyłącznie dla zalogowanych użytkowników i wyświetla fiszki należące do aktualnie zalogowanego użytkownika.

## 2. Routing widoku

- **Ścieżka**: `/flashcards`
- **Typ**: Astro page component z React client-side components
- **Plik**: `src/pages/flashcards.astro`
- **Wymagana autentykacja**: Tak (przekierowanie na `/login` jeśli użytkownik niezalogowany)

## 3. Struktura komponentów

```
flashcards.astro (Astro Layout Page)
├── FlashcardListPage.tsx (React Client Component)
│   ├── Header z przyciskami
│   ├── SearchAndFilter
│   │   ├── SortDropdown
│   │   └── SearchInput (opcjonalnie)
│   ├── FlashcardList
│   │   ├── EmptyState (jeśli brak fiszek)
│   │   └── FlashcardListItem[] (dla każdej fiszki)
│   │       ├── FlashcardContent
│   │       └── ActionButtons (Edytuj, Usuń)
│   ├── PaginationControl
│   ├── CreateFlashcardDialog
│   │   └── FlashcardForm
│   ├── EditFlashcardDialog
│   │   └── FlashcardForm
│   └── DeleteConfirmDialog
```

## 4. Szczegóły komponentów

### FlashcardListPage

**Opis**: Główny komponent React zarządzający stanem całego widoku. Odpowiada za pobieranie danych z API, zarządzanie paginacją, sortowaniem, oraz obsługę wszystkich interakcji użytkownika (tworzenie, edycja, usunięcie).

**Główne elementy**:
- Header z tytułem "Moje Fiszki" i przyciskiem "Dodaj nową fiszkę"
- Kontrolki sortowania i filtrowania
- Lista fiszek z paginacją
- Dialogi: tworzenia, edycji, potwierdzenia usunięcia
- Toast notyfikacje (poprzez Sonner)

**Obsługiwane interakcje**:
- Kliknięcie "Dodaj nową fiszkę" → otwarcie dialugu tworzenia
- Zmiana strony paginacji → nowe zapytanie API
- Zmiana parametrów sortowania → nowe zapytanie API
- Kliknięcie "Edytuj" przy fiszce → otwarcie dialugu edycji
- Kliknięcie "Usuń" przy fiszce → otwarcie dialugu potwierdzenia
- Potwierdzenie usunięcia → DELETE request
- Wysłanie formularza tworzenia/edycji → POST/PUT request

**Obsługiwana walidacja**:
- Sprawdzenie autentykacji (via middleware Astro)
- Walidacja numerów strony i limitu (muszą być > 0)
- Sprawdzenie czy odpowiedź API zawiera dane w oczekiwanym formacie

**Typy**: `FlashcardDto`, `PaginatedResponseDto<FlashcardDto>`, `GetFlashcardsQueryDto`, `CreateFlashcardCommand`, `UpdateFlashcardCommand`, `FlashcardListPageState`, `SortConfig`

**Propsy**: brak (component główny)

---

### FlashcardList

**Opis**: Komponent wyświetlający listę fiszek. W zależności od stanu wyświetla: pustą listę (empty state), skeleton loading, lub listę poszczególnych fiszek.

**Główne elementy**:
- Warunkowe renderowanie: `EmptyState` | `SkeletonLoader` | `ul` z `FlashcardListItem`
- Każdy element listy to karta z informacją o fiszce

**Obsługiwane interakcje**:
- Brak bezpośrednich interakcji (interakcje obsługiwane w parent component lub FlashcardListItem)

**Obsługiwana walidacja**: brak

**Typy**: `FlashcardDto[]`, `PaginatedResponseDto<FlashcardDto>`

**Propsy**:
```typescript
interface FlashcardListProps {
  flashcards: FlashcardDto[];
  isLoading: boolean;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
}
```

---

### FlashcardListItem

**Opis**: Komponent reprezentujący pojedynczą fiszkę na liście. Wyświetla awers i rewers fiszki, informację o źródle oraz przyciski akcji.

**Główne elementy**:
- Kontener karty (Card component z shadcn/ui)
- Sekcja z frontem (awersem) i backiem (rewersem) fiszki
- Badge informujący o źródle fiszki (`ai-full`, `ai-edited`, `manual`)
- Przyciski akcji: "Edytuj" (pencil icon) i "Usuń" (trash icon)
- Meta informacje: data utworzenia, ostatnia aktualizacja

**Obsługiwane interakcje**:
- Kliknięcie przycisku "Edytuj" → wywołanie `onEdit` callback
- Kliknięcie przycisku "Usuń" → wywołanie `onDelete` callback
- Hovering → podświetlenie karty (CSS)

**Obsługiwana walidacja**:
- Sprawdzenie czy `flashcard` zawiera wszystkie wymagane pola (front, back, source)

**Typy**: `FlashcardDto`

**Propsy**:
```typescript
interface FlashcardListItemProps {
  flashcard: FlashcardDto;
  onEdit: () => void;
  onDelete: () => void;
}
```

---

### FlashcardForm

**Opis**: Komponent formularza używany zarówno do tworzenia nowych fiszek jak i edycji istniejących. Zawiera pola dla awersu i rewersu fiszki z walidacją.

**Główne elementy**:
- Input pole dla awersu (front) z label "Pytanie" lub "Przód"
- Textarea dla rewersu (back) z label "Odpowiedź" lub "Tył"
- Wyświetlanie liczby znaków dla każdego pola (informacja o długości)
- Przycisk "Zapisz" (aktywny gdy oba pola wypełnione)
- Przycisk "Anuluj"
- Walidacja online (real-time error messages)

**Obsługiwane interakcje**:
- Zmiana wartości w input/textarea → update state
- Blur na input → walidacja pola
- Submit formularza → walidacja wszystkich pól i callback

**Obsługiwana walidacja**:
- Pole `front` wymagane, nie może być puste po trim
- Pole `back` wymagane, nie może być puste po trim
- `front`: min 1 znak, max 500 znaków (rekomendacja)
- `back`: min 1 znak, max 2000 znaków (rekomendacja)
- Walidacja integralności danych przed wysłaniem

**Typy**: `CreateFlashcardCommand`, `UpdateFlashcardCommand`

**Propsy**:
```typescript
interface FlashcardFormProps {
  initialData?: Partial<FlashcardDto>;
  isLoading?: boolean;
  onSubmit: (data: CreateFlashcardCommand | UpdateFlashcardCommand) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
}
```

---

### CreateFlashcardDialog

**Opis**: Dialog (Modal) do tworzenia nowej fiszki. Opakowuje `FlashcardForm` w komponencie `Dialog` z shadcn/ui.

**Główne elementy**:
- Dialog header: "Dodaj nową fiszkę"
- Dialog content: `FlashcardForm` w trybie create
- Dialog footer: przyciski Submit i Cancel (wewnątrz formu)

**Obsługiwane interakcje**:
- Otworzenie dialugu
- Zamknięcie dialugu (ESC, klik poza dialogiem, klik Cancel)
- Submit formularza → API call

**Obsługiwana walidacja**: walidacja formularza (patrz FlashcardForm)

**Typy**: `CreateFlashcardCommand`

**Propsy**:
```typescript
interface CreateFlashcardDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateFlashcardCommand) => Promise<void>;
  isLoading?: boolean;
}
```

---

### EditFlashcardDialog

**Opis**: Dialog do edycji istniejącej fiszki. Opakowuje `FlashcardForm` w componencie `Dialog` z shadcn/ui.

**Główne elementy**:
- Dialog header: "Edytuj fiszkę"
- Dialog content: `FlashcardForm` w trybie edit z pre-filled danymi
- Dialog footer: przyciski Submit i Cancel

**Obsługiwane interakcje**:
- Otworzenie dialugu z danymi fiszki
- Zamknięcie dialugu (ESC, klik poza dialogiem, klik Cancel)
- Submit formularza → API call

**Obsługiwana walidacja**: walidacja formularza (patrz FlashcardForm)

**Typy**: `FlashcardDto`, `UpdateFlashcardCommand`

**Propsy**:
```typescript
interface EditFlashcardDialogProps {
  isOpen: boolean;
  flashcard: FlashcardDto | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: number, data: UpdateFlashcardCommand) => Promise<void>;
  isLoading?: boolean;
}
```

---

### DeleteConfirmDialog

**Opis**: AlertDialog do potwierdzenia usunięcia fiszki. Wyświetla ostrzeżenie i prosi o potwierdzenie akcji.

**Główne elementy**:
- AlertDialog header: "Potwierdzenie usunięcia"
- AlertDialog description: "Czy jesteś pewien, że chcesz trwale usunąć tę fiszkę?"
- Przycisk "Anuluj" (cancel)
- Przycisk "Usuń" (destructive - czerwony)

**Obsługiwane interakcje**:
- Kliknięcie "Anuluj" → zamknięcie dialugu
- Kliknięcie "Usuń" → API call DELETE
- ESC → zamknięcie dialugu

**Obsługiwana walidacja**: brak (dialug tylko potwierdza intencję)

**Typy**: `FlashcardDto`

**Propsy**:
```typescript
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  flashcard: FlashcardDto | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: number) => Promise<void>;
  isLoading?: boolean;
}
```

---

### PaginationControl

**Opis**: Komponent do navigacji między stronami. Wyświetla numery stron, przyciski Previous/Next i informacje o całkowitej liczbie elementów.

**Główne elementy**:
- Przycisk "Poprzednia strona" (Previous)
- Numery stron (1, 2, 3, ..., N)
- Przycisk "Następna strona" (Next)
- Informacja tekstowa: "Strona X z Y, ogółem Z fiszek"
- Select do zmiany limit na stronę (10, 20, 50, 100)

**Obsługiwane interakcje**:
- Kliknięcie numeru strony → `onPageChange` callback
- Kliknięcie Previous/Next → `onPageChange` callback
- Zmiana limitu → `onLimitChange` callback

**Obsługiwana walidacja**:
- Sprawdzenie czy page >= 1 i page <= totalPages
- Sprawdzenie czy limit > 0

**Typy**: `Pagination`

**Propsy**:
```typescript
interface PaginationControlProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isLoading?: boolean;
}
```

---

### SortDropdown

**Opis**: Dropdown do wyboru kryteriów sortowania. Pozwala wybrać pole do sortowania i kierunek (ascending/descending).

**Główne elementy**:
- Dropdown/Select component z shadcn/ui
- Opcje sortowania: `created_at`, `updated_at`, `source`
- Toggle/Radio dla kierunku: `asc` (rosnąco) vs `desc` (malejąco)

**Obsługiwane interakcje**:
- Zmiana pola sortowania → `onSortChange` callback
- Zmiana kierunku sortowania → `onOrderChange` callback

**Obsługiwana walidacja**:
- Sprawdzenie czy wybrane pole jest dozwolone
- Sprawdzenie czy kierunek to `asc` lub `desc`

**Typy**: `SortConfig`

**Propsy**:
```typescript
interface SortDropdownProps {
  currentSort: string;
  currentOrder: 'asc' | 'desc';
  onSortChange: (sort: string) => void;
  onOrderChange: (order: 'asc' | 'desc') => void;
}
```

---

### EmptyState

**Opis**: Komponent wyświetlany gdy użytkownik nie ma żadnych fiszek. Wyświetla przyjazny komunikat i link do generatora fiszek.

**Główne elementy**:
- Ikona (np. Inbox, BookOpen)
- Tekst: "Nie masz jeszcze żadnych fiszek"
- Tekst pomocniczy: "Zacznij od wygenerowania fiszek z tekstu lub dodaj je ręcznie."
- Przycisk/Link do `/flashcards/generate` (generatora)
- Przycisk "Dodaj fiszkę" (modal create)

**Obsługiwane interakcje**:
- Kliknięcie linku do generatora → nawigacja
- Kliknięcie "Dodaj fiszkę" → callback do parent

**Obsługiwana walidacja**: brak

**Typy**: brak

**Propsy**:
```typescript
interface EmptyStateProps {
  onAddFlashcardClick: () => void;
}
```

## 5. Typy

### Istniejące typy (z `src/types.ts`)

```typescript
// Są już zdefiniowane w types.ts:
export type FlashcardDto = Pick<
  Flashcard,
  "id" | "generation_id" | "front" | "back" | "source" | "created_at" | "updated_at"
>;

export type PaginatedResponseDto<T> = {
  data: T[];
  pagination: Pagination;
};

export interface Pagination {
  current_page: number;
  limit: number;
  total: number;
}

export type CreateFlashcardCommand = Pick<TablesInsert<"flashcards">, "front" | "back" | "source">;

export type UpdateFlashcardCommand = z.infer<typeof updateFlashcardCommandSchema>;

export type GetFlashcardsQueryDto = z.infer<typeof getFlashcardsQuerySchema>;
```

### Nowe typy wymagane dla widoku

#### ViewModels dla komponentu FlashcardListPage

```typescript
// Stan wewnętrzny komponentu FlashcardListPage
export interface FlashcardListPageState {
  // Dane fiszek
  flashcards: FlashcardDto[];
  totalCount: number;
  currentPage: number;
  limit: number;
  
  // Stany UI
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Dialog states
  createDialogOpen: boolean;
  editDialogOpen: boolean;
  editingFlashcard: FlashcardDto | null;
  deleteConfirmOpen: boolean;
  deletingFlashcard: FlashcardDto | null;
  
  // Sortowanie i filtrowanie
  sortBy: string; // 'created_at', 'updated_at', 'source'
  sortOrder: 'asc' | 'desc';
}

// Konfiguracja sortowania
export interface SortConfig {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Parametry do API
export interface FlashcardsAPIParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
```

#### Query Parameters dla GET /api/flashcards

```typescript
// Już zdefiniowane przez getFlashcardsQuerySchema:
export type GetFlashcardsQueryDto = {
  page?: number; // default: 1
  limit?: number; // default: 20
  sort?: string; // 'created_at' | 'updated_at' | 'source'
  order?: 'asc' | 'desc'; // default: 'desc'
  source?: string; // opcjonalnie: 'ai-full' | 'ai-edited' | 'manual'
  generation_id?: number; // opcjonalnie
};
```

#### Źródła fiszek (source)

```typescript
export type FlashcardSource = 'ai-full' | 'ai-edited' | 'manual';

export const FLASHCARD_SOURCE_LABELS: Record<FlashcardSource, string> = {
  'ai-full': 'Wygenerowana przez AI',
  'ai-edited': 'Edytowana wygenerowana',
  'manual': 'Ręcznie utworzona',
};

export const FLASHCARD_SOURCE_COLORS: Record<FlashcardSource, string> = {
  'ai-full': 'bg-blue-100 text-blue-800',
  'ai-edited': 'bg-purple-100 text-purple-800',
  'manual': 'bg-green-100 text-green-800',
};
```

#### Typy dla formularza

```typescript
export interface FlashcardFormData {
  front: string;
  back: string;
}

export interface FlashcardFormErrors {
  front?: string;
  back?: string;
}
```

## 6. Zarządzanie stanem

### Główny komponent (FlashcardListPage) - Stan na poziomie komponentu

**Podejście**: Użycie React hooks (`useState`, `useEffect`, `useCallback`) do zarządzania stanem lokalnym komponentu.

**Stan główny**:
```typescript
const [state, setState] = useState<FlashcardListPageState>({
  flashcards: [],
  totalCount: 0,
  currentPage: 1,
  limit: 20,
  isLoading: false,
  isSaving: false,
  error: null,
  createDialogOpen: false,
  editDialogOpen: false,
  editingFlashcard: null,
  deleteConfirmOpen: false,
  deletingFlashcard: null,
  sortBy: 'created_at',
  sortOrder: 'desc',
});
```

**Akcje stanów**:
- `setState(prev => ({ ...prev, currentPage: newPage }))` - zmiana strony
- `setState(prev => ({ ...prev, limit: newLimit }))` - zmiana limitu
- `setState(prev => ({ ...prev, isLoading: true }))` - początek ładowania
- Itp.

### Effects

**useEffect 1**: Pobieranie danych przy zmianie paginacji/sortowania
```typescript
useEffect(() => {
  fetchFlashcards();
}, [state.currentPage, state.limit, state.sortBy, state.sortOrder]);
```

### Custom Hook: `useFlashcardList`

Opcjonalnie można stworzyć custom hook do enkapsulacji logiki zarządzania listą fiszek:

```typescript
export function useFlashcardList() {
  const [state, setState] = useState<FlashcardListPageState>({
    // ...initial state
  });

  const fetchFlashcards = useCallback(async () => {
    // Logika pobierania
  }, []);

  const createFlashcard = useCallback(async (data) => {
    // Logika tworzenia
  }, []);

  const updateFlashcard = useCallback(async (id, data) => {
    // Logika aktualizacji
  }, []);

  const deleteFlashcard = useCallback(async (id) => {
    // Logika usuwania
  }, []);

  const handlePageChange = useCallback((page) => {
    // Zmiana strony
  }, []);

  const handleSortChange = useCallback((sort, order) => {
    // Zmiana sortowania
  }, []);

  // Return state i akcje
  return {
    state,
    fetchFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    handlePageChange,
    handleSortChange,
    // ... inne metody
  };
}
```

### Persist State (opcjonalnie)

Można rozważyć persist stanu w `localStorage` dla:
- Zapamiętania wybranej strony
- Zapamiętania parametrów sortowania

### Toast Notyfikacje (Sonner)

Dla feedback użytkownika wykorzystać Sonner:
```typescript
import { toast } from 'sonner';

// Na sukces
toast.success('Fiszka została usunięta');

// Na błąd
toast.error('Błąd podczas usuwania fiszki');

// Loading
const id = toast.loading('Usuwanie fiszki...');
toast.dismiss(id);
```

## 7. Integracja API

### Pobieranie listy fiszek (GET /api/flashcards)

**Endpoint**: `GET /api/flashcards`

**Parametry zapytania**:
```typescript
interface FetchFlashcardsParams {
  page: number; // Domyślnie 1
  limit: number; // Domyślnie 20
  sort: string; // Np. 'created_at'
  order: 'asc' | 'desc'; // Domyślnie 'desc'
  source?: string; // Opcjonalnie
  generation_id?: number; // Opcjonalnie
}
```

**Typ odpowiedzi**:
```typescript
interface FetchFlashcardsResponse {
  data: FlashcardDto[];
  pagination: {
    current_page: number;
    limit: number;
    total: number;
  };
}
```

**Implementacja**:
```typescript
const fetchFlashcards = async (params: FetchFlashcardsParams): Promise<FetchFlashcardsResponse> => {
  const queryString = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
    sort: params.sort,
    order: params.order,
    ...(params.source && { source: params.source }),
    ...(params.generation_id && { generation_id: params.generation_id.toString() }),
  }).toString();

  const response = await fetch(`/api/flashcards?${queryString}`);
  
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to fetch flashcards');
  }

  return response.json();
};
```

### Tworzenie fiszki (POST /api/flashcards)

**Endpoint**: `POST /api/flashcards`

**Typ żądania**:
```typescript
interface CreateFlashcardRequest {
  data: CreateFlashcardCommand[];
}
```

**Typ odpowiedzi**:
```typescript
interface CreateFlashcardResponse {
  data: FlashcardDto[];
}
```

**Implementacja**:
```typescript
const createFlashcard = async (data: CreateFlashcardCommand): Promise<FlashcardDto[]> => {
  const response = await fetch('/api/flashcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([data]), // Zawsze wysyłamy tablicę
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    if (response.status === 400) throw new Error('Validation failed');
    throw new Error('Failed to create flashcard');
  }

  return response.json();
};
```

### Aktualizacja fiszki (PUT /api/flashcards/{id})

**Endpoint**: `PUT /api/flashcards/{id}`

**Typ żądania**:
```typescript
interface UpdateFlashcardRequest {
  front?: string;
  back?: string;
}
```

**Typ odpowiedzi**:
```typescript
interface UpdateFlashcardResponse {
  data: FlashcardDto;
}
```

**Implementacja**:
```typescript
const updateFlashcard = async (id: number, data: UpdateFlashcardCommand): Promise<FlashcardDto> => {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    if (response.status === 404) throw new Error('Flashcard not found');
    if (response.status === 400) throw new Error('Validation failed');
    throw new Error('Failed to update flashcard');
  }

  return response.json();
};
```

### Usunięcie fiszki (DELETE /api/flashcards/{id})

**Endpoint**: `DELETE /api/flashcards/{id}`

**Typ odpowiedzi**: Empty (204 No Content)

**Implementacja**:
```typescript
const deleteFlashcard = async (id: number): Promise<void> => {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    if (response.status === 404) throw new Error('Flashcard not found');
    throw new Error('Failed to delete flashcard');
  }
};
```

## 8. Interakcje użytkownika

### Scenariusz 1: Przeglądanie listy fiszek

1. Użytkownik wchodzi na `/flashcards`
2. Komponent pobiera fiszkę z `?page=1&limit=20&sort=created_at&order=desc`
3. Wyświetlana jest lista fiszek
4. Przy każdej fiszce widoczne są informacje: awers, rewers, źródło, data

### Scenariusz 2: Zmiana paginacji

1. Użytkownik jest na stronie 1
2. Kliknie przycisk "2" lub "Następna"
3. Parametr `page` zmienia się na 2
4. API pobiera fiszkę dla strony 2
5. Lista jest odświeżana

### Scenariusz 3: Zmiana sortowania

1. Użytkownik kliknie na dropdown sortowania
2. Wybiera "Ostatnio edytowana"
3. Parametry `sort=updated_at` i `order=desc` są ustawiane
4. API pobiera fiszkę z nowymi parametrami
5. Lista jest odświeżana w nowej kolejności

### Scenariusz 4: Dodanie nowej fiszki

1. Użytkownik kliknie "Dodaj nową fiszkę"
2. Otwarty jest dialog z formularzem
3. Użytkownik wpisuje pytanie i odpowiedź
4. Kliknie "Zapisz"
5. API wysyła POST `/api/flashcards` z danymi
6. Po powodzeniu: lista jest odświeżana, wyświetlona jest notyfikacja sukcesu
7. Dialog jest zamykany

### Scenariusz 5: Edycja fiszki

1. Użytkownik kliknie ikonę "Edytuj" przy fiszce
2. Otwarty jest dialog z formularzem pre-filled
3. Użytkownik zmienia dane
4. Kliknie "Zapisz"
5. API wysyła PUT `/api/flashcards/{id}` z danymi
6. Po powodzeniu: lista jest odświeżana, wyświetlona jest notyfikacja sukcesu
7. Dialog jest zamykany

### Scenariusz 6: Usunięcie fiszki

1. Użytkownik kliknie ikonę "Usuń" przy fiszce
2. Otwarty jest AlertDialog z prośbą o potwierdzenie
3. Użytkownik kliknie "Usuń"
4. API wysyła DELETE `/api/flashcards/{id}`
5. Po powodzeniu: fiszka jest usuwana z listy, wyświetlona jest notyfikacja sukcesu
6. Dialog jest zamykany
7. Jeśli ostatnia fiszka na stronie: nawigacja na stronę wcześniejszą

### Scenariusz 7: Empty state

1. Użytkownik bez fiszek wchodzi na `/flashcards`
2. Wyświetlony jest komunikat "Nie masz jeszcze żadnych fiszek"
3. Dostępne linki:
   - "Wygeneruj fiszkę" → `/flashcards/generate`
   - "Dodaj fiszkę ręcznie" → otwarcie Create dialog

## 9. Warunki i walidacja

### Walidacja na poziomie komponentu

#### Paginacja
- `page` musi być >= 1
- `limit` musi być > 0 i <= 100
- Jeśli `page` > `totalPages`: nie wysyłaj zapytania lub ustaw na ostatnią stronę

#### Sortowanie
- Dozwolone pola: `created_at`, `updated_at`, `source`
- Dozwolone kierunki: `asc`, `desc`
- Domyślnie: `sort=created_at`, `order=desc`

#### Formularz (FlashcardForm)
- `front` (awers):
  - Wymagane
  - Nie może być puste po trim
  - Min 1 znak, max 500 znaków (hardlimit)
  - Walidacja online na blur
  - Error message: "Pytanie jest wymagane" lub "Pytanie nie może być dłuższe niż 500 znaków"

- `back` (rewers):
  - Wymagane
  - Nie może być puste po trim
  - Min 1 znak, max 2000 znaków (hardlimit)
  - Walidacja online na blur
  - Error message: "Odpowiedź jest wymagana" lub "Odpowiedź nie może być dłuższa niż 2000 znaków"

- Submit button:
  - Aktywny tylko gdy `front.trim() !== ''` i `back.trim() !== ''`
  - Disabled podczas wysyłania (isSaving = true)

### Walidacja na poziomie API

Patrz implementacja API w plikach `src/pages/api/flashcards.ts` i `src/pages/api/flashcards/[id].ts`.

#### GET /api/flashcards
- Sprawdzenie czy user jest zalogowany
- Walidacja `page`, `limit`, `sort`, `order` parametrów
- Zwrócenie 400 jeśli parametry są niepoprawne

#### POST /api/flashcards
- Sprawdzenie czy user jest zalogowany (401)
- Walidacja struktury request body (array fiszek)
- Walidacja każdej fiszki: `front`, `back`, `source` wymagane
- `front` i `back` nie mogą być puste
- Zwrócenie 400 jeśli walidacja się nie powiodła

#### PUT /api/flashcards/{id}
- Sprawdzenie czy user jest zalogowany (401)
- Walidacja ID (musi być liczba > 0)
- Sprawdzenie czy fiszka należy do użytkownika (404)
- Walidacja pól: `front` i `back` (jeśli dostarczone)
- Zwrócenie 400 jeśli walidacja się nie powiodła

#### DELETE /api/flashcards/{id}
- Sprawdzenie czy user jest zalogowany (401)
- Walidacja ID
- Sprawdzenie czy fiszka należy do użytkownika (404)
- Zwrócenie 204 po powodzeniu

## 10. Obsługa błędów

### Błędy API

| Status | Scenariusz | Obsługa |
|--------|-----------|---------|
| 400 | Złe parametry lub dane | Wyświetlenie toast error message, ponieważ to błąd aplikacji |
| 401 | Użytkownik niezalogowany | Przekierowanie na `/login`, wyświetlenie "Musisz się zalogować" |
| 404 | Fiszka nie znaleziona | Usunięcie z listy, toast message: "Fiszka nie istnieje" |
| 500 | Błąd serwera | Toast: "Coś poszło nie tak, spróbuj ponownie", retry button |

### Błędy sieciowe

- Brak połączenia: Toast error, możliwość retry
- Timeout: Toast error, możliwość retry
- CORS error: Toast error

### Obsługa w kodzie

```typescript
try {
  // API call
} catch (error) {
  if (error instanceof TypeError) {
    // Network error
    toast.error('Błąd połączenia. Spróbuj ponownie.');
  } else if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      // Redirect to login
      window.location.href = '/login';
    } else {
      toast.error(error.message || 'Coś poszło nie tak');
    }
  }
  
  // Update state
  setState(prev => ({ ...prev, error: error.message, isSaving: false }));
}
```

### Loading state

- Podczas pobierania listy: wyświetlenie Skeleton loaders dla fiszek
- Podczas tworzenia/edycji/usuwania: disable przycisków, spinner

### Edge cases

1. **Usunięcie ostatniej fiszki na stronie**: Nawigacja na stronę wcześniejszą (page - 1)
2. **Zmiana parametrów sortowania gdy na stronie > 1**: Reset do page 1
3. **Bardzo dużo fiszek**: Paginacja automatycznie robi limit, max 100 na stronę
4. **Równoczesne edycje**: Konflikty będą obsługiwane przez backend (last-write-wins), frontend wyświetla ostatnią wersję

## 11. Kroki implementacji

### Krok 1: Przygotowanie infrastruktury

1. Stwórz plik `src/pages/flashcards.astro` (Astro page)
2. Stwórz plik `src/components/FlashcardListPage.tsx` (główny React component)
3. Stwórz katalog `src/lib/hooks/` i plik `useFlashcardList.ts` (custom hook - opcjonalnie)
4. Aktualizuj `src/types.ts` z nowymi typami (ViewModels, konfiguracje sortowania)

### Krok 2: Przygotowanie komponentów pomocniczych

1. Stwórz komponent `FlashcardList.tsx` - renderowanie listy
2. Stwórz komponent `FlashcardListItem.tsx` - pojedyncza fiszka
3. Stwórz komponent `EmptyState.tsx` - pusty stan
4. Stwórz komponent `PaginationControl.tsx` - kontrolka paginacji
5. Stwórz komponent `SortDropdown.tsx` - dropdown sortowania

### Krok 3: Przygotowanie komponentów formularza i dialogów

1. Stwórz komponent `FlashcardForm.tsx` - formularz tworzenia/edycji
2. Stwórz komponent `CreateFlashcardDialog.tsx` - dialog tworzenia
3. Stwórz komponent `EditFlashcardDialog.tsx` - dialog edycji
4. Stwórz komponent `DeleteConfirmDialog.tsx` - potwierdzenie usunięcia

### Krok 4: Implementacja logiki pobierania danych

1. Implementuj `fetchFlashcards()` w głównym komponencie lub hook
2. Obsługuj loading state, error state, dane
3. Dodaj `useEffect` do pobierania danych przy zmianie paginacji/sortowania
4. Testuj API integration

### Krok 5: Implementacja logiki tworzenia

1. Implementuj `createFlashcard()` call do API
2. Obsługuj loading, error, success states
3. Odśwież listę po sukces
4. Dodaj toast notyfikacje

### Krok 6: Implementacja logiki edycji

1. Implementuj `updateFlashcard()` call do API
2. Obsługuj loading, error, success states
3. Odśwież listę po sukces
4. Dodaj toast notyfikacje

### Krok 7: Implementacja logiki usuwania

1. Implementuj `deleteFlashcard()` call do API
2. Obsługuj loading, error, success states
3. Usuń fiszkę z listy po sukces
4. Obsługuj navigację gdy ostatnia fiszka na stronie
5. Dodaj toast notyfikacje

### Krok 8: Stylowanie i UX

1. Stylowanie komponentów (Tailwind 4)
2. Dodaj responsive design
3. Testuj accessibility (labels, ARIA, keyboard navigation)
4. Dodaj hover states, transitions

### Krok 9: Testowanie

1. Testy jednostkowe komponentów (Vitest + React Testing Library)
2. Testy integracyjne (fetch API mocking)
3. Testy e2e (Playwright) - patrz `e2e/` folder
4. Manual testing

### Krok 10: Finaliza

1. Code review
2. Performance optimization (memoization, lazy loading)
3. SEO (meta tags, structured data - jeśli wymagane)
4. Dokumentacja kodu
5. Merge i deployment

---

**Informacje dodatkowe**:
- Wszystkie komponenty powinny być TypeScript-aware
- Używaj Shadcn/ui components (Button, Card, Dialog, AlertDialog, Input, Textarea, Label, DropdownMenu)
- Implementuj proper error handling i logging
- Pamiętaj o accessibility (WCAG 2.1 AA)
- Testuj cross-browser compatibility

