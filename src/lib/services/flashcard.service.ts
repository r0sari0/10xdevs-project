import type {
  CreateFlashcardCommand,
  Flashcard,
  FlashcardDto,
  GetFlashcardsQueryDto,
  PaginatedResponseDto,
  UpdateFlashcardCommand,
} from "../../types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesUpdate } from "../../db/database.types";

export class FlashcardService {
  public async getFlashcards(
    supabase: SupabaseClient<Database>,
    query: GetFlashcardsQueryDto
  ): Promise<PaginatedResponseDto<FlashcardDto>> {
    const { page, limit, sort, order, source, generation_id } = query;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let queryBuilder = supabase.from("flashcards").select("*", { count: "exact" });

    if (source) {
      queryBuilder = queryBuilder.eq("source", source);
    }

    if (generation_id) {
      queryBuilder = queryBuilder.eq("generation_id", generation_id);
    }

    queryBuilder = queryBuilder.order(sort, { ascending: order === "asc" });
    queryBuilder = queryBuilder.range(from, to);

    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error("Error fetching flashcards:", error);
      throw new Error("Could not fetch flashcards.");
    }

    const flashcardDtos: FlashcardDto[] = data.map((flashcard) => ({
      id: flashcard.id,
      generation_id: flashcard.generation_id,
      front: flashcard.front,
      back: flashcard.back,
      source: flashcard.source,
      created_at: flashcard.created_at,
      updated_at: flashcard.updated_at,
    }));

    return {
      data: flashcardDtos,
      pagination: {
        current_page: page,
        limit,
        total: count ?? 0,
      },
    };
  }

  public async createFlashcards(
    supabase: SupabaseClient<Database>,
    userId: string,
    flashcardsData: CreateFlashcardCommand[]
  ): Promise<FlashcardDto[]> {
    const flashcardsToCreate = flashcardsData.map((flashcard) => ({
      ...flashcard,
      user_id: userId,
    }));

    const { data, error } = await supabase
      .from("flashcards")
      .insert(flashcardsToCreate)
      .select();

    if (error) {
      // TODO: Add proper logging
      console.error("Error creating flashcards:", error);
      throw new Error("Could not create flashcards.");
    }

    if (!data) {
      return [];
    }

    const flashcardDtos: FlashcardDto[] = data.map((flashcard) => ({
      id: flashcard.id,
      generation_id: flashcard.generation_id,
      front: flashcard.front,
      back: flashcard.back,
      source: flashcard.source,
      created_at: flashcard.created_at,
      updated_at: flashcard.updated_at,
    }));

    return flashcardDtos;
  }

  public async getFlashcardById(
    supabase: SupabaseClient<Database>,
    id: number,
    userId: string
  ): Promise<FlashcardDto | null> {
    const { data, error } = await supabase
      .from("flashcards")
      .select("id, generation_id, front, back, source, created_at, updated_at")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // This code indicates that no rows were found, which is a valid case.
        return null;
      }
      // TODO: Add proper logging
      console.error(`Error fetching flashcard with id ${id}:`, error);
      throw new Error("Could not fetch flashcard.");
    }

    return data;
  }

  public async updateFlashcard(
    supabase: SupabaseClient<Database>,
    id: number,
    userId: string,
    command: UpdateFlashcardCommand
  ): Promise<FlashcardDto | null> {
    const { data: existingFlashcard, error: fetchError } = await supabase
      .from("flashcards")
      .select("source")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingFlashcard) {
      if (fetchError && fetchError.code !== "PGRST116") {
        console.error(`Error fetching flashcard with id ${id} for update:`, fetchError);
        throw new Error("Could not fetch flashcard before update.");
      }
      return null;
    }

    const dataToUpdate: TablesUpdate<"flashcards"> = {
      front: command.front,
      back: command.back,
    };

    if (existingFlashcard.source === "ai-full") {
      dataToUpdate.source = "ai-edited";
    }

    const { data, error } = await supabase
      .from("flashcards")
      .update(dataToUpdate)
      .eq("id", id)
      .select("id, generation_id, front, back, source, created_at, updated_at")
      .single();

    if (error) {
      console.error(`Error updating flashcard with id ${id}:`, error);
      throw new Error("Could not update flashcard.");
    }

    return data;
  }

  public async deleteFlashcard(
    supabase: SupabaseClient<Database>,
    id: number,
    userId: string
  ): Promise<number> {
    const { count, error } = await supabase
      .from("flashcards")
      .delete({ count: "exact" })
      .match({ id: id, user_id: userId });

    if (error) {
      console.error(`Error deleting flashcard with id ${id}:`, error);
      throw new Error("Could not delete flashcard.");
    }

    return count ?? 0;
  }
}

export const flashcardService = new FlashcardService();
