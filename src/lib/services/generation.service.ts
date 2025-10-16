import type { Database } from "../../db/database.types";
import type { CreateGenerationResponseDto, FlashcardProposalDto } from "../../types";
import type { SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";
import { OpenRouterService } from "./openrouter.service";
import { AIFlashcardsResponseSchema } from "../schemas/ai-response.schema";
import { OpenRouterError, OpenRouterAuthError, OpenRouterRateLimitError } from "../errors/openrouter.errors";

export class GenerationService {
  private readonly openRouterService: OpenRouterService;
  private readonly model = "openai/gpt-4o-mini";
  private readonly systemPrompt = `Jesteś ekspertem w tworzeniu fiszek edukacyjnych. 
Twoim zadaniem jest przeanalizowanie dostarczonego tekstu źródłowego i wygenerowanie zestawu wysokiej jakości fiszek.

Zasady tworzenia fiszek:
- Każda fiszka powinna koncentrować się na jednym kluczowym pojęciu lub fakcie
- Pytanie (front) powinno być jasne i konkretne
- Odpowiedź (back) powinna być zwięzła, ale kompletna
- Unikaj pytań typu "prawda/fałsz" - preferuj pytania wymagające zrozumienia
- Używaj języka tekstu źródłowego (jeśli tekst jest po polsku, fiszki też powinny być po polsku)
- Generuj między 5 a 15 fiszek, w zależności od treści i długości tekstu źródłowego

Zwróć odpowiedź w formacie JSON zgodnym ze schematem.`;

  constructor() {
    this.openRouterService = new OpenRouterService();
  }

  /**
   * Creates a new AI flashcard generation job.
   * Processes the source text through AI, saves results to database, and returns proposals.
   */
  async createGeneration(
    sourceText: string,
    userId: string,
    supabase: SupabaseClientType<Database>
  ): Promise<CreateGenerationResponseDto> {
    const startTime = Date.now();

    try {
      // Calculate hash and length
      const sourceTextHash = await this.calculateHash(sourceText);
      const sourceTextLength = sourceText.length;

      // Generate flashcards using AI
      const flashcards = await this.generateFlashcardsWithAI(sourceText);

      // Create generation record
      const generationDuration = Date.now() - startTime;
      const { data: generationData, error: generationError } = await supabase
        .from("generations")
        .insert({
          user_id: userId,
          model: this.model,
          generated_count: flashcards.length,
          accepted_unedited_count: 0,
          accepted_edited_count: 0,
          source_text_hash: sourceTextHash,
          source_text_length: sourceTextLength,
          generation_duration: generationDuration,
        })
        .select("id")
        .single();

      if (generationError) {
        throw new Error(`Failed to create generation record: ${generationError.message}`);
      }

      const generationId = generationData.id;

      return {
        generation_id: generationId,
        flashcards_proposals: flashcards,
        generated_count: flashcards.length,
      };
    } catch (error) {
      // Log error to database
      await this.logError(error as Error, userId, this.model, sourceText, supabase);
      throw error;
    }
  }

  /**
   * Calculates SHA-256 hash of the source text using Web Crypto API.
   * Compatible with Cloudflare Pages and all modern browsers.
   */
  private async calculateHash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  }

  /**
   * Generates flashcards using OpenRouter AI API.
   * Uses structured completion to ensure consistent output format.
   */
  private async generateFlashcardsWithAI(sourceText: string): Promise<FlashcardProposalDto[]> {
    // Walidacja wejścia
    if (!sourceText || sourceText.trim().length === 0) {
      throw new Error("Source text cannot be empty");
    }

    try {
      const userPrompt = `Przeanalizuj poniższy tekst i wygeneruj odpowiedni zestaw fiszek edukacyjnych:

---
${sourceText}
---

Wygeneruj fiszki w formacie JSON.`;

      // Wywołanie OpenRouter API z ustrukturyzowaną odpowiedzią
      const response = await this.openRouterService.generateStructuredCompletion({
        systemPrompt: this.systemPrompt,
        userPrompt,
        responseSchema: AIFlashcardsResponseSchema,
        model: this.model,
        params: {
          temperature: 0.7,
          max_tokens: 4000,
        },
      });

      // Konwersja odpowiedzi AI do formatu FlashcardProposalDto
      return response.flashcards.map((flashcard) => ({
        front: flashcard.front,
        back: flashcard.back,
        source: "ai-full" as const,
      }));
    } catch (error) {
      // Obsługa specyficznych błędów OpenRouter
      if (error instanceof OpenRouterAuthError) {
        throw new Error("Błąd uwierzytelniania API OpenRouter. Sprawdź konfigurację klucza API.");
      }
      if (error instanceof OpenRouterRateLimitError) {
        throw new Error("Przekroczono limit zapytań do API OpenRouter. Spróbuj ponownie później.");
      }
      if (error instanceof OpenRouterError) {
        throw new Error(`Błąd API OpenRouter: ${error.message}`);
      }

      // Przepuszczanie innych błędów
      throw error;
    }
  }

  /**
   * Logs generation errors to the database.
   */
  private async logError(
    error: Error,
    userId: string,
    model: string,
    sourceText: string,
    supabase: SupabaseClientType<Database>
  ): Promise<void> {
    try {
      const sourceTextHash = await this.calculateHash(sourceText);
      const sourceTextLength = sourceText.length;

      await supabase.from("generation_error_logs").insert({
        user_id: userId,
        model,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        error_code: error.name,
        error_message: error.message,
      });
    } catch (logError) {
      // eslint-disable-next-line no-console
      console.error("Failed to log generation error:", logError);
    }
  }
}
