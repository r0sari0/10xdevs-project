import type { APIContext } from "astro";
import { ZodError } from "zod";
import { flashcardService } from "../../lib/services/flashcard.service";
import {
  createFlashcardsSchema,
  getFlashcardsQuerySchema,
} from "../../lib/schemas/flashcard.schema";
import { DEFAULT_USER_ID } from "../../db/supabase.client";

export const prerender = false;

export async function GET(context: APIContext): Promise<Response> {
  try {
    const queryParams = Object.fromEntries(context.url.searchParams.entries());
    const validationResult = getFlashcardsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          message: "Invalid query parameters.",
          errors: validationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const paginatedResponse = await flashcardService.getFlashcards(
      context.locals.supabase,
      validationResult.data
    );

    return new Response(JSON.stringify(paginatedResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/flashcards:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(context: APIContext): Promise<Response> {
  try {
    const flashcardsData = await context.request.json();
    const validatedData = createFlashcardsSchema.parse(flashcardsData);

    const newFlashcards = await flashcardService.createFlashcards(
      context.locals.supabase,
      DEFAULT_USER_ID,
      validatedData
    );

    return new Response(JSON.stringify(newFlashcards), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          message: "Invalid input.",
          errors: error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // TODO: Add proper logging
    console.error("Error in POST /api/flashcards:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
