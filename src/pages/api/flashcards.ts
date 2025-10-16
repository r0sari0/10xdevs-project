import type { APIContext } from "astro";
import { ZodError } from "zod";
import { flashcardService } from "../../lib/services/flashcard.service";
import { createFlashcardsSchema, getFlashcardsQuerySchema } from "../../lib/schemas/flashcard.schema";

export const prerender = false;

export async function GET(context: APIContext): Promise<Response> {
  try {
    // Check if user is authenticated
    if (!context.locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized - user not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

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
      validationResult.data,
      context.locals.user.id
    );

    return new Response(JSON.stringify(paginatedResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/flashcards:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(context: APIContext): Promise<Response> {
  try {
    // Check if user is authenticated
    if (!context.locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized - user not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const flashcardsData = await context.request.json();
    const validatedData = createFlashcardsSchema.parse(flashcardsData);

    const newFlashcards = await flashcardService.createFlashcards(
      context.locals.supabase,
      context.locals.user.id,
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
    // eslint-disable-next-line no-console
    console.error("Error in POST /api/flashcards:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
