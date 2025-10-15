/**
 * Bazowa klasa dla wszystkich błędów związanych z OpenRouter
 */
export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterError";
  }
}

/**
 * Błąd sieci - problemy z połączeniem podczas próby kontaktu z API
 */
export class OpenRouterNetworkError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterNetworkError";
  }
}

/**
 * Błąd uwierzytelniania - nieprawidłowy klucz API (status 401)
 */
export class OpenRouterAuthError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterAuthError";
  }
}

/**
 * Błąd limitu zapytań - przekroczono limit zapytań (status 429)
 */
export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterRateLimitError";
  }
}

/**
 * Błąd żądania - nieprawidłowe żądanie (status 400/422)
 */
export class OpenRouterRequestError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterRequestError";
  }
}

/**
 * Błąd serwera - błąd po stronie serwera API (status 5xx)
 */
export class OpenRouterServerError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterServerError";
  }
}

/**
 * Błąd walidacji odpowiedzi - odpowiedź LLM nie jest zgodna z oczekiwanym schematem
 */
export class OpenRouterResponseValidationError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterResponseValidationError";
  }
}
