import type { APIRoute } from "astro";
import { flashcardService } from "../../../lib/services/flashcard.service";
import { updateFlashcardCommandSchema } from "../../../lib/schemas/flashcard.schema";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const { id } = context.params;

  if (!id) {
    return new Response("Flashcard ID is required.", { status: 400 });
  }

  const flashcardId = parseInt(id, 10);
  if (isNaN(flashcardId)) {
    return new Response("Invalid Flashcard ID. Must be a number.", { status: 400 });
  }

  try {
    const flashcard = await flashcardService.getFlashcardById(context.locals.supabase, flashcardId, context.locals.user?.id);

    if (!flashcard) {
      return new Response("Flashcard not found.", { status: 404 });
    }

    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching flashcard:", error);
    return new Response("An internal server error occurred.", { status: 500 });
  }
};

export const PUT: APIRoute = async (context) => {
  // Check if user is authenticated
  if (!context.locals.user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized - user not authenticated" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { id } = context.params;

  if (!id) {
    return new Response(JSON.stringify({ error: "Flashcard ID is required." }), { status: 400 });
  }

  const flashcardId = parseInt(id, 10);
  if (isNaN(flashcardId)) {
    return new Response(JSON.stringify({ error: "Invalid Flashcard ID. Must be a number." }), {
      status: 400,
    });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400 });
  }

  const validationResult = updateFlashcardCommandSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(JSON.stringify({ error: validationResult.error.flatten() }), {
      status: 400,
    });
  }

  try {
    const updatedFlashcard = await flashcardService.updateFlashcard(
      context.locals.supabase,
      flashcardId,
      context.locals.user.id,
      validationResult.data
    );

    if (!updatedFlashcard) {
      return new Response(JSON.stringify({ error: "Flashcard not found or access denied." }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error updating flashcard:", error);
    return new Response(JSON.stringify({ error: "An internal server error occurred." }), {
      status: 500,
    });
  }
};

export const DELETE: APIRoute = async (context) => {
  // Check if user is authenticated
  if (!context.locals.user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized - user not authenticated" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { id } = context.params;

  if (!id) {
    return new Response("Flashcard ID is required.", { status: 400 });
  }

  const flashcardId = parseInt(id, 10);
  if (isNaN(flashcardId) || flashcardId <= 0) {
    return new Response("Invalid Flashcard ID. Must be a positive number.", { status: 400 });
  }

  try {
    const deletedCount = await flashcardService.deleteFlashcard(context.locals.supabase, flashcardId, context.locals.user.id);

    if (deletedCount === 0) {
      return new Response("Flashcard not found or you do not have permission to delete it.", {
        status: 404,
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error deleting flashcard:", error);
    return new Response("An internal server error occurred.", { status: 500 });
  }
};
