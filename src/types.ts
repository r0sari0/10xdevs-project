import { z } from "zod";
import type { getFlashcardsQuerySchema, updateFlashcardCommandSchema } from "./lib/schemas/flashcard.schema";
import type { Tables, TablesInsert } from "./db/database.types";

// #region Database Entities
/**
 * Represents the base type for a single generation record from the 'generations' table.
 * It's derived directly from the auto-generated Supabase types.
 */
export type Generation = Tables<"generations">;

/**
 * Represents the base type for a single flashcard record from the 'flashcards' table.
 */
export type Flashcard = Tables<"flashcards">;

/**
 * Represents the base type for a single error log record from the 'generation_error_logs' table.
 */
export type GenerationErrorLog = Tables<"generation_error_logs">;
// #endregion

// #region Data Transfer Objects (DTOs)
/**
 * DTO for a generation job.
 * Used when retrieving a single generation or a list of generations.
 */
export type GenerationDto = Pick<
  Generation,
  | "id"
  | "model"
  | "generated_count"
  | "accepted_unedited_count"
  | "accepted_edited_count"
  | "source_text_hash"
  | "source_text_length"
  | "generation_duration"
  | "created_at"
  | "updated_at"
>;

/**
 * DTO for a flashcard.
 * Used for displaying flashcard data throughout the application.
 */
export type FlashcardDto = Pick<
  Flashcard,
  "id" | "generation_id" | "front" | "back" | "source" | "created_at" | "updated_at"
>;
/**
 * DTO representing a flashcard proposal (used in generation responses).
 */
export interface FlashcardProposalDto {
  front: string;
  back: string;
  source: "ai-full";
}

/**
 * DTO for a generation error log.
 * Provides details about errors that occurred during the AI generation process.
 */
export type GenerationErrorLogDto = Pick<
  GenerationErrorLog,
  "id" | "model" | "source_text_hash" | "source_text_length" | "error_message" | "created_at"
>;

/**
 * DTO for querying flashcards with pagination, sorting, and filtering.
 * It's inferred from the Zod schema for consistency and validation.
 */
export type GetFlashcardsQueryDto = z.infer<typeof getFlashcardsQuerySchema>;
// #endregion

// #region Command Models
/**
 * Command model for creating a new AI flashcard generation job.
 * Contains the source text to be processed.
 */
export interface CreateGenerationCommand {
  source_text: string;
}

/**
 * Command model for manually creating a new flashcard.
 * It uses the 'Insert' type from the database schema for consistency.
 */
export type CreateFlashcardCommand = Pick<TablesInsert<"flashcards">, "front" | "back" | "source">;

/**
 * Command model for updating an existing flashcard.
 * All fields are optional, allowing for partial updates.
 */
export type UpdateFlashcardCommand = z.infer<typeof updateFlashcardCommandSchema>;
// #endregion

// #region API Response Structures
/**
 * Defines the structure for pagination information in API responses.
 */
export interface Pagination {
  current_page: number;
  limit: number;
  total: number;
}

/**
 * A generic structure for paginated API responses.
 * @template T The type of the data items in the response.
 */
export interface PaginatedResponseDto<T> {
  data: T[];
  pagination: Pagination;
}

/**
 * Defines the successful response structure for the 'Create AI Flashcard Generation Job' endpoint.
 */
export interface CreateGenerationResponseDto {
  generation_id: number;
  flashcards_proposals: FlashcardProposalDto[];
  generated_count: number;
}
// #endregion

// #region ViewModels for FlashcardListPage

/**
 * Type representing a source of a flashcard for display/styling purposes
 */
export type FlashcardSource = "ai-full" | "ai-edited" | "manual";

/**
 * Labels for flashcard sources in Polish
 */
export const FLASHCARD_SOURCE_LABELS: Record<FlashcardSource, string> = {
  "ai-full": "Wygenerowana przez AI",
  "ai-edited": "Edytowana wygenerowana",
  manual: "Ręcznie utworzona",
};

/**
 * Color classes for flashcard sources (Tailwind)
 */
export const FLASHCARD_SOURCE_COLORS: Record<FlashcardSource, string> = {
  "ai-full": "bg-blue-100 text-blue-800",
  "ai-edited": "bg-purple-100 text-purple-800",
  manual: "bg-green-100 text-green-800",
};

/**
 * Internal state of the FlashcardListPage component
 */
export interface FlashcardListPageState {
  // Data
  flashcards: FlashcardDto[];
  totalCount: number;
  currentPage: number;
  limit: number;

  // UI states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Dialog states
  createDialogOpen: boolean;
  editDialogOpen: boolean;
  editingFlashcard: FlashcardDto | null;
  deleteConfirmOpen: boolean;
  deletingFlashcard: FlashcardDto | null;

  // Sorting and filtering
  sortBy: string; // 'created_at', 'updated_at', 'source'
  sortOrder: "asc" | "desc";
}

/**
 * Sort configuration object
 */
export interface SortConfig {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

/**
 * Form validation errors
 */
export interface FlashcardFormErrors {
  front?: string;
  back?: string;
}

// #endregion

// #region Study Session ViewModels

/**
 * Represents a rating option for a flashcard in study session
 */
export interface RatingOption {
  label: string;
  value: "easy" | "hard" | "again";
  color: string; // Tailwind class (e.g., "bg-green-500")
}

/**
 * Represents the phase/state of a study session
 */
export type StudySessionPhase = "notStarted" | "loading" | "active" | "finished" | "error";

/**
 * Internal state of the StudySessionContainer component
 */
export interface StudySessionState {
  // Data
  flashcards: FlashcardDto[];
  currentCardIndex: number;

  // UI states
  sessionPhase: StudySessionPhase;
  isAnswerRevealed: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Computed values derived from StudySessionState
 */
export interface StudySessionComputedState extends StudySessionState {
  currentCard: FlashcardDto | null;
  totalCards: number;
  currentCardNumber: number;
}

// #endregion
