# Przewodnik Implementacji Usługi OpenRouter

## 1. Opis usługi

`OpenRouterService` to klasa TypeScript po stronie serwera, zaprojektowana do hermetyzacji interakcji z API OpenRouter AI. Upraszcza proces wysyłania żądań do różnych modeli językowych (LLM), ze szczególnym uwzględnieniem generowania ustrukturyzowanych, walidowanych odpowiedzi JSON przy użyciu schematów Zod.

Usługa ta jest przeznaczona do użytku wyłącznie w środowisku serwerowym (np. w punktach końcowych API Astro), aby zapewnić bezpieczeństwo klucza API.

## 2. Opis konstruktora

Konstruktor inicjuje usługę, konfigurując niezbędne poświadczenia i ustawienia do komunikacji z API OpenRouter.

```typescript
// src/lib/services/openrouter.service.ts

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly siteUrl: string;
  private readonly apiBaseUrl = "https://openrouter.ai/api/v1";

  constructor() {
    // Pobiera klucz API ze zmiennych środowiskowych serwera.
    this.apiKey = import.meta.env.OPENROUTER_API_KEY;
    this.siteUrl = import.meta.env.ASTRO_SITE_URL ?? "http://localhost";

    // Rzuca błąd, jeśli klucz API nie jest skonfigurowany, aby zapobiec awarii w czasie działania.
    if (!this.apiKey) {
      throw new Error("Zmienna środowiskowa OPENROUTER_API_KEY nie jest ustawiona.");
    }
  }
}
```

## 3. Publiczne metody i pola

### `generateStructuredCompletion<T extends z.ZodTypeAny>(options: GenerationOptions<T>): Promise<z.infer<T>>`

Jest to główna metoda publiczna usługi. Generuje ona kompletację czatu, która jest parsowana i walidowana zgodnie z dostarczonym schematem Zod.

#### Parametry (`GenerationOptions<T>`)

-   `systemPrompt` (string, wymagany): Instrukcja systemowa, która ustawia kontekst dla LLM.
-   `userPrompt` (string, wymagany): Konkretne zapytanie lub instrukcja od użytkownika.
-   `responseSchema` (`z.ZodTypeAny`, wymagany): Schemat Zod używany do zdefiniowania oczekiwanej struktury odpowiedzi JSON oraz do walidacji.
-   `model` (string, opcjonalny): Nazwa modelu OpenRouter do użycia. Domyślnie: `openai/gpt-4o-mini`.
-   `params` (obiekt, opcjonalny): Dodatkowe parametry do przekazania do API, takie jak `temperature`, `max_tokens`, itp.

#### Zwraca

`Promise<z.infer<T>>`: Obietnica, która po rozwiązaniu zwraca obiekt JavaScript zgodny z typem wywnioskowanym ze schematu `responseSchema`.

#### Rzuca

-   `OpenRouterAuthError`: Jeśli klucz API jest nieprawidłowy (HTTP 401).
-   `OpenRouterRateLimitError`: Jeśli przekroczono limit zapytań (HTTP 429).
-   `OpenRouterRequestError`: Jeśli żądanie jest nieprawidłowo sformułowane (HTTP 400/422).
-   `OpenRouterServerError`: W przypadku błędów po stronie serwera OpenRouter (HTTP 5xx).
-   `OpenRouterResponseValidationError`: Jeśli odpowiedź LLM nie jest zgodna z `responseSchema`.
-   `OpenRouterNetworkError`: W przypadku problemów z siecią.

## 4. Prywatne metody i pola

### Pola

-   `apiKey` (string): Przechowuje klucz API OpenRouter.
-   `siteUrl` (string): URL witryny, używany w nagłówku `HTTP-Referer`.
-   `apiBaseUrl` (string): Podstawowy URL dla API OpenRouter.

### Metody

-   `#performApiCall(payload: object): Promise<any>`: Prywatna metoda odpowiedzialna za wykonanie wywołania `fetch` do punktu końcowego API. Konstruuje nagłówki, obsługuje różne statusy odpowiedzi HTTP i rzuca odpowiednie niestandardowe błędy.
-   `#buildRequestPayload(...)`: Prywatna metoda pomocnicza do konstruowania obiektu payload JSON na podstawie opcji dostarczonych do metody publicznej. Konwertuje schemat Zod na schemat JSON i formatuje tablicę `messages`.

## 5. Obsługa błędów

Usługa wykorzystuje niestandardowe klasy błędów w celu zapewnienia szczegółowego kontekstu w przypadku niepowodzenia operacji. Wszystkie niestandardowe błędy dziedziczą po bazowej klasie `OpenRouterError`.

-   `OpenRouterError`: Bazowa klasa dla wszystkich błędów związanych z usługą.
-   `OpenRouterNetworkError`: Problem z połączeniem sieciowym podczas próby kontaktu z API.
-   `OpenRouterAuthError`: Błąd uwierzytelniania (status 401).
-   `OpenRouterRateLimitError`: Przekroczono limit zapytań (status 429).
-   `OpenRouterRequestError`: Nieprawidłowe żądanie (status 400/422).
-   `OpenRouterServerError`: Błąd serwera API (status 5xx).
-   `OpenRouterResponseValidationError`: Odpowiedź LLM nie jest zgodna z oczekiwanym schematem.

## 6. Kwestie bezpieczeństwa

1.  **Zarządzanie kluczem API**: Klucz API musi być przechowywany jako zmienna środowiskowa (`OPENROUTER_API_KEY`) i nigdy nie może być ujawniany po stronie klienta. Usługa musi być używana wyłącznie w kontekstach serwerowych (punkty końcowe API Astro, ładowarki danych po stronie serwera).
2.  **Walidacja danych wejściowych**: Chociaż usługa nie waliduje bezpośrednio treści `userPrompt`, kod wywołujący powinien zawsze sanityzować i walidować dane wejściowe od użytkownika, aby zapobiec atakom typu prompt injection.
3.  **Nagłówek Referer**: Dołączenie `HTTP-Referer` (`siteUrl`) jest najlepszą praktyką zalecaną przez OpenRouter do identyfikacji źródła żądań.

## 7. Plan wdrożenia krok po kroku

### Krok 1: Konfiguracja środowiska

1.  **Zainstaluj zależności**: Upewnij się, że `zod` jest zainstalowany. Dodaj bibliotekę do konwersji schematów Zod na schematy JSON.
    ```bash
    npm install zod zod-to-json-schema
    ```
2.  **Dodaj zmienne środowiskowe**: Utwórz lub zaktualizuj plik `.env` w głównym katalogu projektu i dodaj swój klucz API OpenRouter. Pamiętaj, aby dodać `.env` do `.gitignore`.
    ```env
    # .env
    OPENROUTER_API_KEY="sk-or-..."
    ```
3.  **Zaktualizuj `env.d.ts`**: Zdefiniuj typy dla zmiennych środowiskowych serwera.
    ```typescript
    // src/env.d.ts
    /// <reference types="astro/client" />

    interface ImportMetaEnv {
      readonly OPENROUTER_API_KEY: string;
      // ... inne zmienne
    }

    interface ImportMeta {
      readonly env: ImportMetaEnv;
    }
    ```

### Krok 2: Utworzenie niestandardowych typów błędów

Utwórz plik `src/lib/errors/openrouter.errors.ts` do zdefiniowania niestandardowych klas błędów.

```typescript
// src/lib/errors/openrouter.errors.ts

export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export class OpenRouterNetworkError extends OpenRouterError { /* ... */ }
export class OpenRouterAuthError extends OpenRouterError { /* ... */ }
export class OpenRouterRateLimitError extends OpenRouterError { /* ... */ }
export class OpenRouterRequestError extends OpenRouterError { /* ... */ }
export class OpenRouterServerError extends OpenRouterError { /* ... */ }
export class OpenRouterResponseValidationError extends OpenRouterError { /* ... */ }
```

### Krok 3: Implementacja szkieletu usługi

Utwórz plik `src/lib/services/openrouter.service.ts` i zaimplementuj konstruktor oraz definicje metod publicznych i prywatnych.

```typescript
// src/lib/services/openrouter.service.ts
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { /* importuj niestandardowe błędy */ } from "../errors/openrouter.errors";

// Zdefiniuj interfejs opcji
export interface GenerationOptions<T extends z.ZodTypeAny> {
  systemPrompt: string;
  userPrompt: string;
  responseSchema: T;
  model?: string;
  params?: Record<string, unknown>;
}

export class OpenRouterService {
  // ... implementacja konstruktora z sekcji 2 ...
  
  public async generateStructuredCompletion<T extends z.ZodTypeAny>(
    options: GenerationOptions<T>
  ): Promise<z.infer<T>> {
    // Logika zostanie dodana w kolejnych krokach
  }
  
  // Prywatne pola
  // Prywatne metody
}
```

### Krok 4: Implementacja logiki wywołania API

Zaimplementuj prywatną metodę `#performApiCall`, która obsługuje `fetch`, autoryzację i podstawową obsługę błędów HTTP.

```typescript
// Wewnątrz klasy OpenRouterService

private async #performApiCall(payload: object): Promise<any> {
  try {
    const response = await fetch(`${this.apiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": this.siteUrl,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      switch (response.status) {
        case 401:
          throw new OpenRouterAuthError("Błąd uwierzytelniania API OpenRouter.");
        case 429:
          throw new OpenRouterRateLimitError("Przekroczono limit zapytań API OpenRouter.");
        case 400:
        case 422:
          throw new OpenRouterRequestError(`Nieprawidłowe żądanie do API OpenRouter: ${JSON.stringify(errorBody)}`);
        default:
          throw new OpenRouterServerError(`Błąd serwera API OpenRouter: ${response.status}`);
      }
    }
    return response.json();
  } catch (error) {
    if (error instanceof OpenRouterError) throw error;
    throw new OpenRouterNetworkError(`Błąd sieci podczas wywoływania API OpenRouter: ${error.message}`);
  }
}
```

### Krok 5: Implementacja logiki generowania

Zaimplementuj metodę `generateStructuredCompletion`, aby budować payload i obsługiwać walidację odpowiedzi.

```typescript
// Wewnątrz klasy OpenRouterService

public async generateStructuredCompletion<T extends z.ZodTypeAny>(
  options: GenerationOptions<T>
): Promise<z.infer<T>> {
  const {
    systemPrompt,
    userPrompt,
    responseSchema,
    model = "openai/gpt-40-mini",
    params = {},
  } = options;

  const jsonSchema = zodToJsonSchema(responseSchema, "responseSchema");

  const payload = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "structured_response",
        strict: true,
        schema: jsonSchema,
      },
    },
    ...params,
  };

  const response = await this.#performApiCall(payload);
  const content = response.choices[0]?.message?.content;

  if (typeof content !== "string") {
    throw new OpenRouterResponseValidationError("Odpowiedź API nie zawierała treści tekstowej.");
  }
  
  let parsedContent: any;
  try {
    parsedContent = JSON.parse(content);
  } catch {
    throw new OpenRouterResponseValidationError("Nie udało się sparsować treści odpowiedzi jako JSON.");
  }

  const validationResult = responseSchema.safeParse(parsedContent);

  if (!validationResult.success) {
    throw new OpenRouterResponseValidationError(
      `Walidacja odpowiedzi nie powiodła się: ${validationResult.error.toString()}`
    );
  }

  return validationResult.data;
}
```

### Krok 6: Przykład użycia w punkcie końcowym API Astro

Utwórz lub zaktualizuj punkt końcowy API (np. `src/pages/api/generate-flashcards.ts`), aby użyć nowej usługi.

```typescript
// src/pages/api/generate-flashcards.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { OpenRouterService } from "@/lib/services/openrouter.service";

// Zdefiniuj schemat odpowiedzi Zod
const flashcardResponseSchema = z.array(
  z.object({
    term: z.string().describe("Kluczowe pojęcie fiszki."),
    definition: z.string().describe("Definicja pojęcia."),
  })
);

export const POST: APIRoute = async ({ request }) => {
  const { topic } = await request.json();

  if (!topic || typeof topic !== "string") {
    return new Response(JSON.stringify({ error: "Topic is required" }), { status: 400 });
  }

  const openrouterService = new OpenRouterService();

  try {
    const flashcards = await openrouterService.generateStructuredCompletion({
      systemPrompt: "Jesteś ekspertem w tworzeniu zwięzłych i dokładnych fiszek edukacyjnych na podstawie podanego tematu. Zwróć tablicę obiektów fiszek.",
      userPrompt: `Wygeneruj 3 fiszki na temat: ${topic}.`,
      responseSchema: flashcardResponseSchema,
      model: "openai/gpt-4o-mini",
      params: {
        temperature: 0.7,
      },
    });

    return new Response(JSON.stringify(flashcards), { status: 200 });

  } catch (error) {
    console.error(error);
    // Tutaj możesz dodać bardziej szczegółową obsługę błędów w oparciu o typ błędu
    return new Response(JSON.stringify({ error: "Failed to generate flashcards" }), { status: 500 });
  }
};
```
