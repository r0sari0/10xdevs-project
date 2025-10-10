import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import {
  OpenRouterError,
  OpenRouterNetworkError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterRequestError,
  OpenRouterServerError,
  OpenRouterResponseValidationError,
} from "../errors/openrouter.errors";

/**
 * Interfejs opcji dla generowania ustrukturyzowanych odpowiedzi
 */
export interface GenerationOptions<T extends z.ZodTypeAny> {
  /** Instrukcja systemowa, która ustawia kontekst dla LLM */
  systemPrompt: string;
  /** Konkretne zapytanie lub instrukcja od użytkownika */
  userPrompt: string;
  /** Schemat Zod używany do zdefiniowania oczekiwanej struktury odpowiedzi JSON */
  responseSchema: T;
  /** Nazwa modelu OpenRouter do użycia (domyślnie: openai/gpt-4o-mini) */
  model?: string;
  /** Dodatkowe parametry do przekazania do API (temperature, max_tokens, itp.) */
  params?: Record<string, unknown>;
}

/**
 * Serwis do komunikacji z API OpenRouter AI
 * Zaprojektowany do użytku wyłącznie w środowisku serwerowym (punkty końcowe API Astro)
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly siteUrl: string;
  private readonly apiBaseUrl = "https://openrouter.ai/api/v1";

  constructor() {
    // Pobiera klucz API ze zmiennych środowiskowych serwera
    this.apiKey = import.meta.env.OPENROUTER_API_KEY;
    this.siteUrl = import.meta.env.ASTRO_SITE_URL ?? "http://localhost";

    // Walidacja: rzuca błąd jeśli klucz API nie jest skonfigurowany
    if (!this.apiKey) {
      throw new Error(
        "Zmienna środowiskowa OPENROUTER_API_KEY nie jest ustawiona."
      );
    }
  }

  /**
   * Generuje kompletację czatu, która jest parsowana i walidowana zgodnie z dostarczonym schematem Zod
   *
   * @param options - Opcje generowania ustrukturyzowanej odpowiedzi
   * @returns Obietnica z obiektem zgodnym z typem wywnioskowanym ze schematu responseSchema
   * @throws {OpenRouterAuthError} Jeśli klucz API jest nieprawidłowy (HTTP 401)
   * @throws {OpenRouterRateLimitError} Jeśli przekroczono limit zapytań (HTTP 429)
   * @throws {OpenRouterRequestError} Jeśli żądanie jest nieprawidłowo sformułowane (HTTP 400/422)
   * @throws {OpenRouterServerError} W przypadku błędów po stronie serwera OpenRouter (HTTP 5xx)
   * @throws {OpenRouterResponseValidationError} Jeśli odpowiedź LLM nie jest zgodna z responseSchema
   * @throws {OpenRouterNetworkError} W przypadku problemów z siecią
   */
  public async generateStructuredCompletion<T extends z.ZodTypeAny>(
    options: GenerationOptions<T>
  ): Promise<z.infer<T>> {
    const {
      systemPrompt,
      userPrompt,
      responseSchema,
      model = "openai/gpt-4o-mini",
      params = {},
    } = options;

    // Konwersja schematu Zod na schemat JSON
    // Usuwamy metadane JSON Schema które OpenRouter nie akceptuje
    const rawJsonSchema = zodToJsonSchema(responseSchema, {
      $refStrategy: "none",
    });
    
    // Wyciągamy tylko właściwości schematu bez metadanych ($schema, etc.)
    const { $schema, ...jsonSchema } = rawJsonSchema as Record<string, unknown>;

    // Budowanie payloadu żądania
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

    // Wykonanie wywołania API
    const response = await this.#performApiCall(payload);

    // Ekstrakcja treści odpowiedzi
    const content = response.choices[0]?.message?.content;

    if (typeof content !== "string") {
      throw new OpenRouterResponseValidationError(
        "Odpowiedź API nie zawierała treści tekstowej."
      );
    }

    // Parsowanie treści jako JSON
    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      throw new OpenRouterResponseValidationError(
        "Nie udało się sparsować treści odpowiedzi jako JSON."
      );
    }

    // Walidacja odpowiedzi zgodnie ze schematem Zod
    const validationResult = responseSchema.safeParse(parsedContent);

    if (!validationResult.success) {
      throw new OpenRouterResponseValidationError(
        `Walidacja odpowiedzi nie powiodła się: ${validationResult.error.toString()}`
      );
    }

    return validationResult.data;
  }

  /**
   * Prywatna metoda do wykonania wywołania API do OpenRouter
   * Obsługuje autoryzację, różne statusy odpowiedzi HTTP i rzuca odpowiednie błędy
   *
   * @param payload - Obiekt payload JSON do wysłania do API
   * @returns Obietnica z odpowiedzią JSON z API
   * @throws Różne typy błędów OpenRouter w zależności od statusu odpowiedzi
   */
  async #performApiCall(payload: object): Promise<any> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": this.siteUrl,
        },
        body: JSON.stringify(payload),
      });

      // Obsługa różnych statusów HTTP
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        switch (response.status) {
          case 401:
            throw new OpenRouterAuthError(
              "Błąd uwierzytelniania API OpenRouter."
            );
          case 429:
            throw new OpenRouterRateLimitError(
              "Przekroczono limit zapytań API OpenRouter."
            );
          case 400:
          case 422:
            throw new OpenRouterRequestError(
              `Nieprawidłowe żądanie do API OpenRouter: ${JSON.stringify(errorBody)}`
            );
          default:
            if (response.status >= 500) {
              throw new OpenRouterServerError(
                `Błąd serwera API OpenRouter: ${response.status}`
              );
            }
            throw new OpenRouterServerError(
              `Nieoczekiwany błąd API OpenRouter: ${response.status}`
            );
        }
      }

      return response.json();
    } catch (error) {
      // Przepuszczanie błędów OpenRouter bez zmian
      if (error instanceof OpenRouterError) throw error;

      // Opakowanie innych błędów jako błędy sieciowe
      throw new OpenRouterNetworkError(
        `Błąd sieci podczas wywoływania API OpenRouter: ${error instanceof Error ? error.message : "Nieznany błąd"}`
      );
    }
  }
}

