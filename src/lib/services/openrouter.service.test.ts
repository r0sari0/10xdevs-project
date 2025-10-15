import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { OpenRouterService } from "./openrouter.service";
import {
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterRequestError,
  OpenRouterServerError,
  OpenRouterNetworkError,
  OpenRouterResponseValidationError,
} from "../errors/openrouter.errors";

// Mock zod-to-json-schema
vi.mock("zod-to-json-schema", () => ({
  default: vi.fn(() => ({
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {
      result: { type: "string" },
    },
    required: ["result"],
    additionalProperties: false,
  })),
}));

describe("OpenRouterService", () => {
  // Helper do mockowania globalnego fetch
  const mockFetch = (status: number, responseBody: unknown, shouldReject = false) => {
    const mockResponse = {
      ok: status >= 200 && status < 300,
      status,
      json: vi.fn().mockResolvedValue(responseBody),
    };

    if (shouldReject) {
      return vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    }

    return vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));
  };

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe("Constructor", () => {
    it("should initialize successfully with valid API key", () => {
      // Arrange
      vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
      vi.stubEnv("ASTRO_SITE_URL", "https://example.com");

      // Act
      const service = new OpenRouterService();

      // Assert
      expect(service).toBeInstanceOf(OpenRouterService);
    });

    it("should throw error when OPENROUTER_API_KEY is missing", () => {
      // Arrange
      // Nie stubujemy zmiennej, więc będzie undefined

      // Act & Assert
      expect(() => new OpenRouterService()).toThrow("Zmienna środowiskowa OPENROUTER_API_KEY nie jest ustawiona.");
    });

    it("should throw error when OPENROUTER_API_KEY is empty string", () => {
      // Arrange
      vi.stubEnv("OPENROUTER_API_KEY", "");

      // Act & Assert
      expect(() => new OpenRouterService()).toThrow("Zmienna środowiskowa OPENROUTER_API_KEY nie jest ustawiona.");
    });

    it("should use default site URL when ASTRO_SITE_URL is not set", () => {
      // Arrange
      vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
      // Nie stubujemy ASTRO_SITE_URL

      // Act
      const service = new OpenRouterService();

      // Assert
      expect(service).toBeInstanceOf(OpenRouterService);
      // Domyślnie powinien użyć "http://localhost"
    });
  });

  describe("generateStructuredCompletion", () => {
    beforeEach(() => {
      vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
      vi.stubEnv("ASTRO_SITE_URL", "https://example.com");
    });

    describe("Happy Path", () => {
      it("should successfully generate and validate structured response", async () => {
        // Arrange
        const responseSchema = z.object({
          result: z.string(),
        });

        const mockApiResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({ result: "test response" }),
              },
            },
          ],
        };

        mockFetch(200, mockApiResponse);

        const service = new OpenRouterService();

        // Act
        const result = await service.generateStructuredCompletion({
          systemPrompt: "You are a helpful assistant",
          userPrompt: "Generate a response",
          responseSchema,
        });

        // Assert
        expect(result).toEqual({ result: "test response" });
        expect(fetch).toHaveBeenCalledWith(
          "https://openrouter.ai/api/v1/chat/completions",
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer test-api-key",
              "Content-Type": "application/json",
              "HTTP-Referer": "https://example.com",
            }),
          })
        );
      });

      it("should use custom model when provided", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        const mockApiResponse = {
          choices: [{ message: { content: JSON.stringify({ data: "test" }) } }],
        };

        mockFetch(200, mockApiResponse);

        const service = new OpenRouterService();

        // Act
        await service.generateStructuredCompletion({
          systemPrompt: "Test",
          userPrompt: "Test",
          responseSchema,
          model: "openai/gpt-4",
        });

        // Assert
        const fetchCall = vi.mocked(fetch).mock.calls[0];
        const requestBody = JSON.parse(fetchCall[1]?.body as string);
        expect(requestBody.model).toBe("openai/gpt-4");
      });

      it("should use default model when not provided", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        const mockApiResponse = {
          choices: [{ message: { content: JSON.stringify({ data: "test" }) } }],
        };

        mockFetch(200, mockApiResponse);

        const service = new OpenRouterService();

        // Act
        await service.generateStructuredCompletion({
          systemPrompt: "Test",
          userPrompt: "Test",
          responseSchema,
        });

        // Assert
        const fetchCall = vi.mocked(fetch).mock.calls[0];
        const requestBody = JSON.parse(fetchCall[1]?.body as string);
        expect(requestBody.model).toBe("openai/gpt-4o-mini");
      });

      it("should include custom parameters in request payload", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        const mockApiResponse = {
          choices: [{ message: { content: JSON.stringify({ data: "test" }) } }],
        };

        mockFetch(200, mockApiResponse);

        const service = new OpenRouterService();

        // Act
        await service.generateStructuredCompletion({
          systemPrompt: "Test",
          userPrompt: "Test",
          responseSchema,
          params: { temperature: 0.7, max_tokens: 1000 },
        });

        // Assert
        const fetchCall = vi.mocked(fetch).mock.calls[0];
        const requestBody = JSON.parse(fetchCall[1]?.body as string);
        expect(requestBody.temperature).toBe(0.7);
        expect(requestBody.max_tokens).toBe(1000);
      });

      it("should handle complex nested schema", async () => {
        // Arrange
        const responseSchema = z.object({
          user: z.object({
            name: z.string(),
            age: z.number(),
          }),
          items: z.array(z.string()),
        });

        const mockApiResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  user: { name: "John", age: 30 },
                  items: ["item1", "item2"],
                }),
              },
            },
          ],
        };

        mockFetch(200, mockApiResponse);

        const service = new OpenRouterService();

        // Act
        const result = await service.generateStructuredCompletion({
          systemPrompt: "Test",
          userPrompt: "Test",
          responseSchema,
        });

        // Assert
        expect(result).toEqual({
          user: { name: "John", age: 30 },
          items: ["item1", "item2"],
        });
      });
    });

    describe("Response Validation Errors", () => {
      it("should throw OpenRouterResponseValidationError when content is not a string", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        const mockApiResponse = {
          choices: [{ message: { content: null } }],
        };

        mockFetch(200, mockApiResponse);

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterResponseValidationError);

        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow("Odpowiedź API nie zawierała treści tekstowej.");
      });

      it("should throw OpenRouterResponseValidationError when content is missing", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        const mockApiResponse = {
          choices: [{ message: {} }],
        };

        mockFetch(200, mockApiResponse);

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterResponseValidationError);
      });

      it("should throw OpenRouterResponseValidationError when content is not valid JSON", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        const mockApiResponse = {
          choices: [{ message: { content: "not a valid json" } }],
        };

        mockFetch(200, mockApiResponse);

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterResponseValidationError);

        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow("Nie udało się sparsować treści odpowiedzi jako JSON.");
      });

      it("should throw OpenRouterResponseValidationError when response doesn't match schema", async () => {
        // Arrange
        const responseSchema = z.object({
          data: z.string(),
          count: z.number(),
        });

        const mockApiResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({ data: "test" }), // brakuje 'count'
              },
            },
          ],
        };

        mockFetch(200, mockApiResponse);

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterResponseValidationError);

        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(/Walidacja odpowiedzi nie powiodła się/);
      });

      it("should throw OpenRouterResponseValidationError when type doesn't match schema", async () => {
        // Arrange
        const responseSchema = z.object({
          count: z.number(),
        });

        const mockApiResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({ count: "not a number" }),
              },
            },
          ],
        };

        mockFetch(200, mockApiResponse);

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterResponseValidationError);
      });
    });

    describe("HTTP Error Handling", () => {
      it("should throw OpenRouterAuthError on 401 status", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        mockFetch(401, { error: "Unauthorized" });

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterAuthError);

        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow("Błąd uwierzytelniania API OpenRouter.");
      });

      it("should throw OpenRouterRateLimitError on 429 status", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        mockFetch(429, { error: "Rate limit exceeded" });

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterRateLimitError);

        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow("Przekroczono limit zapytań API OpenRouter.");
      });

      it("should throw OpenRouterRequestError on 400 status", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        const errorBody = { error: "Bad request", details: "Invalid payload" };
        mockFetch(400, errorBody);

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterRequestError);

        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(/Nieprawidłowe żądanie do API OpenRouter/);
      });

      it("should throw OpenRouterRequestError on 422 status", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        mockFetch(422, { error: "Unprocessable entity" });

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterRequestError);
      });

      it("should throw OpenRouterServerError on 500 status", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        mockFetch(500, { error: "Internal server error" });

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterServerError);

        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow("Błąd serwera API OpenRouter: 500");
      });

      it("should throw OpenRouterServerError on 503 status", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        mockFetch(503, { error: "Service unavailable" });

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterServerError);

        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow("Błąd serwera API OpenRouter: 503");
      });

      it("should throw OpenRouterServerError on unexpected status codes", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        mockFetch(418, { error: "I'm a teapot" }); // Niestandardowy kod

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterServerError);

        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow("Nieoczekiwany błąd API OpenRouter: 418");
      });

      it("should handle error response that cannot be parsed as JSON", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        const mockResponse = {
          ok: false,
          status: 500,
          json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
        };

        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterServerError);
      });
    });

    describe("Network Errors", () => {
      it("should throw OpenRouterNetworkError on fetch failure", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        mockFetch(200, {}, true); // shouldReject = true

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterNetworkError);

        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(/Błąd sieci podczas wywoływania API OpenRouter/);
      });

      it("should wrap non-OpenRouter errors as OpenRouterNetworkError", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterNetworkError);

        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(/Failed to fetch/);
      });

      it("should handle unknown error types", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue("string error"));

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterNetworkError);

        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(/Nieznany błąd/);
      });
    });

    describe("Edge Cases", () => {
      it("should handle empty choices array", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        const mockApiResponse = {
          choices: [],
        };

        mockFetch(200, mockApiResponse);

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterResponseValidationError);
      });

      it("should handle response with undefined choices", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        const mockApiResponse = {};

        mockFetch(200, mockApiResponse);

        const service = new OpenRouterService();

        // Act & Assert
        await expect(
          service.generateStructuredCompletion({
            systemPrompt: "Test",
            userPrompt: "Test",
            responseSchema,
          })
        ).rejects.toThrow(OpenRouterResponseValidationError);
      });

      it("should handle empty system prompt", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        const mockApiResponse = {
          choices: [{ message: { content: JSON.stringify({ data: "test" }) } }],
        };

        mockFetch(200, mockApiResponse);

        const service = new OpenRouterService();

        // Act
        await service.generateStructuredCompletion({
          systemPrompt: "",
          userPrompt: "Test",
          responseSchema,
        });

        // Assert
        const fetchCall = vi.mocked(fetch).mock.calls[0];
        const requestBody = JSON.parse(fetchCall[1]?.body as string);
        expect(requestBody.messages[0].content).toBe("");
      });

      it("should handle empty user prompt", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        const mockApiResponse = {
          choices: [{ message: { content: JSON.stringify({ data: "test" }) } }],
        };

        mockFetch(200, mockApiResponse);

        const service = new OpenRouterService();

        // Act
        await service.generateStructuredCompletion({
          systemPrompt: "Test",
          userPrompt: "",
          responseSchema,
        });

        // Assert
        const fetchCall = vi.mocked(fetch).mock.calls[0];
        const requestBody = JSON.parse(fetchCall[1]?.body as string);
        expect(requestBody.messages[1].content).toBe("");
      });

      it("should correctly build response_format structure", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        const mockApiResponse = {
          choices: [{ message: { content: JSON.stringify({ data: "test" }) } }],
        };

        mockFetch(200, mockApiResponse);

        const service = new OpenRouterService();

        // Act
        await service.generateStructuredCompletion({
          systemPrompt: "Test",
          userPrompt: "Test",
          responseSchema,
        });

        // Assert
        const fetchCall = vi.mocked(fetch).mock.calls[0];
        const requestBody = JSON.parse(fetchCall[1]?.body as string);
        expect(requestBody.response_format).toEqual({
          type: "json_schema",
          json_schema: {
            name: "structured_response",
            strict: true,
            schema: expect.objectContaining({
              type: "object",
            }),
          },
        });
      });

      it("should remove $schema from JSON schema", async () => {
        // Arrange
        const responseSchema = z.object({ data: z.string() });
        const mockApiResponse = {
          choices: [{ message: { content: JSON.stringify({ data: "test" }) } }],
        };

        mockFetch(200, mockApiResponse);

        const service = new OpenRouterService();

        // Act
        await service.generateStructuredCompletion({
          systemPrompt: "Test",
          userPrompt: "Test",
          responseSchema,
        });

        // Assert
        const fetchCall = vi.mocked(fetch).mock.calls[0];
        const requestBody = JSON.parse(fetchCall[1]?.body as string);
        expect(requestBody.response_format.json_schema.schema).not.toHaveProperty("$schema");
      });
    });
  });
});
