import { createHash } from "crypto";
import type { Database } from "../../db/database.types";
import type { CreateGenerationResponseDto, FlashcardProposalDto } from "../../types";
import type { SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";

export class GenerationService {
  private readonly model = "mock-ai-model"; // Mock model for testing

  /**
   * Creates a new AI flashcard generation job.
   * Processes the source text through AI, saves results to database, and returns proposals.
   */
  async createGeneration(
    sourceText: string,
    userId: string,
    supabase: SupabaseClientType
  ): Promise<CreateGenerationResponseDto> {
    const startTime = Date.now();

    try {
      // Calculate hash and length
      const sourceTextHash = this.calculateHash(sourceText);
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
   * Calculates SHA-256 hash of the source text.
   */
  private calculateHash(text: string): string {
    return createHash("sha256").update(text).digest("hex");
  }

  /**
   * Mock implementation - returns sample flashcards instead of calling AI API.
   */
  private async generateFlashcardsWithAI(sourceText: string): Promise<FlashcardProposalDto[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return mock flashcards
    return [
      {
        front: "What is the capital of Poland?",
        back: "Warsaw",
        source: "ai-full" as const,
      },
      {
        front: "What is the largest planet in our solar system?",
        back: "Jupiter",
        source: "ai-full" as const,
      },
      {
        front: "What is the chemical symbol for water?",
        back: "H2O",
        source: "ai-full" as const,
      },
      {
        front: "What year did World War II end?",
        back: "1945",
        source: "ai-full" as const,
      },
      {
        front: "What is the powerhouse of the cell?",
        back: "Mitochondria",
        source: "ai-full" as const,
      },
    ];
  }

  /**
   * Logs generation errors to the database.
   */
  private async logError(
    error: Error,
    userId: string,
    model: string,
    sourceText: string,
    supabase: SupabaseClientType
  ): Promise<void> {
    try {
      const sourceTextHash = this.calculateHash(sourceText);
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
      console.error("Failed to log generation error:", logError);
    }
  }
}
