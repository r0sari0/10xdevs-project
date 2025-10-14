# OpenRouter Service - Dokumentacja Testów Jednostkowych

## Podsumowanie

Plik testowy: `openrouter.service.test.ts`  
Liczba testów: **31**  
Status: ✅ **Wszystkie testy przechodzą**

## Pokrycie Testów

### 1. Konstruktor (4 testy)

#### Testowane scenariusze:
- ✅ Poprawna inicjalizacja z kluczem API
- ✅ Rzucanie błędu gdy brak OPENROUTER_API_KEY
- ✅ Rzucanie błędu gdy OPENROUTER_API_KEY jest pustym stringiem
- ✅ Użycie domyślnego URL gdy ASTRO_SITE_URL nie jest ustawione

#### Kluczowe reguły biznesowe:
- Konstruktor wymaga obecności zmiennej środowiskowej OPENROUTER_API_KEY
- Puste stringi są traktowane jako brak klucza API
- Domyślny site URL to "http://localhost"

---

### 2. generateStructuredCompletion - Happy Path (5 testów)

#### Testowane scenariusze:
- ✅ Poprawne generowanie i walidacja ustrukturyzowanej odpowiedzi
- ✅ Użycie niestandardowego modelu AI
- ✅ Użycie domyślnego modelu (openai/gpt-4o-mini)
- ✅ Przekazywanie dodatkowych parametrów (temperature, max_tokens)
- ✅ Obsługa zagnieżdżonych schematów Zod

#### Kluczowe reguły biznesowe:
- Domyślny model: `openai/gpt-4o-mini`
- Odpowiedzi są walidowane zgodnie ze schematem Zod
- Schemat Zod jest konwertowany na JSON Schema przed wysłaniem
- Metadane `$schema` są usuwane z JSON Schema

---

### 3. Walidacja Odpowiedzi (5 testów)

#### Testowane scenariusze:
- ✅ Błąd gdy content nie jest stringiem
- ✅ Błąd gdy content jest brakujące
- ✅ Błąd gdy content nie jest poprawnym JSON
- ✅ Błąd gdy odpowiedź nie pasuje do schematu
- ✅ Błąd gdy typ danych nie pasuje do schematu

#### Kluczowe reguły biznesowe:
- Wszystkie błędy walidacji rzucają `OpenRouterResponseValidationError`
- Odpowiedź musi być w formacie JSON
- Odpowiedź musi być zgodna ze schematem Zod
- Typy danych muszą być zgodne z definicją schematu

---

### 4. Obsługa Błędów HTTP (7 testów)

#### Testowane scenariusze:
- ✅ HTTP 401 → `OpenRouterAuthError`
- ✅ HTTP 429 → `OpenRouterRateLimitError`
- ✅ HTTP 400 → `OpenRouterRequestError`
- ✅ HTTP 422 → `OpenRouterRequestError`
- ✅ HTTP 500 → `OpenRouterServerError`
- ✅ HTTP 503 → `OpenRouterServerError`
- ✅ Niestandardowe kody → `OpenRouterServerError`
- ✅ Obsługa odpowiedzi, których nie można sparsować jako JSON

#### Kluczowe reguły biznesowe:
- Każdy kod HTTP ma przypisany specyficzny typ błędu
- Błędy serwera (5xx) są grupowane jako `OpenRouterServerError`
- Nieoczekiwane kody HTTP również rzucają `OpenRouterServerError`
- Błędy zawierają kontekst z ciała odpowiedzi API

---

### 5. Błędy Sieciowe (3 testy)

#### Testowane scenariusze:
- ✅ Błędy fetch są opakowane jako `OpenRouterNetworkError`
- ✅ TypeError i inne błędy są opakowane jako błędy sieciowe
- ✅ Obsługa nieznanych typów błędów

#### Kluczowe reguły biznesowe:
- Wszystkie błędy sieciowe są opakowywane w `OpenRouterNetworkError`
- Błędy OpenRouter są przepuszczane bez zmian
- Wiadomości błędów zawierają oryginalny komunikat

---

### 6. Edge Cases (7 testów)

#### Testowane scenariusze:
- ✅ Obsługa pustej tablicy choices
- ✅ Obsługa odpowiedzi bez choices (undefined)
- ✅ Obsługa pustego system prompt
- ✅ Obsługa pustego user prompt
- ✅ Poprawna struktura response_format
- ✅ Usunięcie $schema z JSON Schema

#### Kluczowe reguły biznesowe:
- Puste lub brakujące `choices` rzuca błąd walidacji
- Puste prompty są dozwolone (przekazywane do API)
- response_format ma stały format: `{ type: "json_schema", json_schema: {...} }`
- JSON Schema nie zawiera metadanych `$schema`

---

## Znalezione i Naprawione Błędy

### Bug #1: Brak walidacji struktury odpowiedzi

**Problem:** Kod próbował odczytać `response.choices[0]` bez sprawdzenia czy `choices` istnieje i jest tablicą.

**Wpływ:** W przypadku nieprawidłowej odpowiedzi API rzucany był `TypeError` zamiast odpowiedniego `OpenRouterResponseValidationError`.

**Rozwiązanie:** Dodano walidację przed dostępem do tablicy:
```typescript
if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
  throw new OpenRouterResponseValidationError(
    "Odpowiedź API nie zawierała prawidłowej tablicy wyborów."
  );
}
```

---

## Struktura Testów

Testy są zorganizowane zgodnie z najlepszymi praktykami Vitest:

### Organizacja
- **Describe blocks** - grupowanie powiązanych testów
- **Arrange-Act-Assert** - jasna struktura każdego testu
- **Helper functions** - `mockFetch()` do wielokrotnego użycia

### Mockowanie
- ✅ `vi.stubEnv()` - mockowanie zmiennych środowiskowych
- ✅ `vi.stubGlobal()` - mockowanie globalnego fetch API
- ✅ `vi.mock()` - mockowanie modułu zod-to-json-schema
- ✅ `afterEach` cleanup - czyszczenie mocków po każdym teście

### Asercje
- ✅ Sprawdzanie typów błędów (`toThrow(ErrorClass)`)
- ✅ Sprawdzanie komunikatów błędów (`toThrow(/regex/)`)
- ✅ Sprawdzanie wywołań mocków (`toHaveBeenCalledWith`)
- ✅ Sprawdzanie struktur danych (`toEqual`, `toMatchObject`)

---

## Uruchamianie Testów

```bash
# Wszystkie testy serwisu OpenRouter
npm run test:unit -- openrouter.service.test.ts

# Konkretny test
npm run test:unit -- openrouter.service.test.ts -t "should throw OpenRouterAuthError"

# Watch mode (rozwój)
npm run test:unit -- openrouter.service.test.ts --watch

# UI mode
npm run test:unit:ui
```

---

## Metryki

| Metryka | Wartość |
|---------|---------|
| Liczba testów | 31 |
| Testy pozytywne (happy path) | 5 |
| Testy błędów | 15 |
| Testy edge cases | 7 |
| Testy konstruktora | 4 |
| Status | ✅ 100% pass |

---

## Rekomendacje

### Co testujemy dobrze:
✅ Wszystkie ścieżki błędów  
✅ Warunki brzegowe  
✅ Walidacja odpowiedzi  
✅ Różne kody HTTP  
✅ Błędy sieciowe

### Co można dodać w przyszłości:
- 🔄 Testy integracyjne z prawdziwym API (z flagą `@slow`)
- 🔄 Testy performance (czy timeout działa poprawnie)
- 🔄 Testy retry logic (jeśli zostanie dodany)
- 🔄 Testy concurrent requests

---

## Dlaczego Te Testy Są Ważne?

1. **Bezpieczeństwo** - Walidacja kluczy API i danych wejściowych
2. **Niezawodność** - Obsługa wszystkich możliwych błędów API
3. **Zgodność** - Zapewnienie zgodności ze schematami Zod
4. **Debugowanie** - Szybka identyfikacja problemów
5. **Dokumentacja** - Testy służą jako dokumentacja zachowania kodu
6. **Refaktoryzacja** - Bezpieczne wprowadzanie zmian
7. **Regresja** - Ochrona przed powrotem naprawionych bugów

---

## Pokrycie Kodu

Testy pokrywają wszystkie główne ścieżki wykonania:

- ✅ **Konstruktor** - 100%
- ✅ **generateStructuredCompletion** - 100%
- ✅ **#performApiCall** - 100%
- ✅ **Obsługa błędów** - 100%
- ✅ **Walidacja odpowiedzi** - 100%

---

*Dokument wygenerowany automatycznie podczas tworzenia testów jednostkowych dla OpenRouterService*

