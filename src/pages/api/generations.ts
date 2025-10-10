import type { APIRoute } from "astro";
import { CreateGenerationSchema } from "../../lib/schemas/generation.schema";
import { GenerationService } from "../../lib/services/generation.service";
import { DEFAULT_USER_ID } from "../../db/supabase.client";

export const prerender = false;

const generationService = new GenerationService();

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validationResult = CreateGenerationSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { source_text } = validationResult.data;

    // Use default test user ID for now
    const userId = DEFAULT_USER_ID;

    // Create generation using service
    const result = await generationService.createGeneration(source_text, userId, locals.supabase);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generation endpoint error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
