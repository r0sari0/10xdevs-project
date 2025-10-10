import { z } from "zod";

export const createFlashcardSchema = z.object({
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
  source: z.enum(["manual", "ai-full", "ai-edited"]),
});

export const createFlashcardsSchema = z.array(createFlashcardSchema).min(1).max(100);

export const getFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["created_at", "updated_at", "source"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
  generation_id: z.coerce.number().int().positive().optional(),
});

export const updateFlashcardCommandSchema = z.object({
  front: z
    .string({ required_error: "Front is required." })
    .min(1, "Front is required.")
    .max(200, "Front must be 200 or fewer characters long."),
  back: z
    .string({ required_error: "Back is required." })
    .min(1, "Back is required.")
    .max(500, "Back must be 500 or fewer characters long."),
});
