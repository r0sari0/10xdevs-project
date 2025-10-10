import { z } from "zod";

/**
 * Zod schema dla pojedynczej fiszki generowanej przez AI.
 * Opisuje strukturę odpowiedzi, którą AI powinno zwrócić.
 */
export const AIFlashcardSchema = z.object({
  front: z
    .string()
    .min(3, "Front must be at least 3 characters")
    .max(500, "Front must not exceed 500 characters")
    .describe("Pytanie lub termin na przedniej stronie fiszki"),
  back: z
    .string()
    .min(3, "Back must be at least 3 characters")
    .max(1000, "Back must not exceed 1000 characters")
    .describe("Odpowiedź lub definicja na tylnej stronie fiszki"),
});

/**
 * Zod schema dla odpowiedzi AI zawierającej listę wygenerowanych fiszek.
 * Jest używany do walidacji odpowiedzi z OpenRouter API.
 */
export const AIFlashcardsResponseSchema = z.object({
  flashcards: z
    .array(AIFlashcardSchema)
    .min(1, "At least one flashcard must be generated")
    .max(20, "Cannot generate more than 20 flashcards at once")
    .describe("Lista wygenerowanych fiszek na podstawie tekstu źródłowego"),
});

/**
 * Typ dla pojedynczej fiszki wygenerowanej przez AI
 */
export type AIFlashcard = z.infer<typeof AIFlashcardSchema>;

/**
 * Typ dla odpowiedzi AI z listą fiszek
 */
export type AIFlashcardsResponse = z.infer<typeof AIFlashcardsResponseSchema>;

