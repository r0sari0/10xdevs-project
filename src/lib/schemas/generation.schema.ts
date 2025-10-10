import { z } from "zod";

/**
 * Zod schema for validating the CreateGenerationCommand input.
 * Validates that source_text is a string with minimum 1000 and maximum 10000 characters.
 */
export const CreateGenerationSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Source text must be at least 1000 characters long")
    .max(10000, "Source text must not exceed 10000 characters"),
});

/**
 * Type inferred from the CreateGenerationSchema.
 * This ensures type safety for validated input data.
 */
export type CreateGenerationInput = z.infer<typeof CreateGenerationSchema>;
