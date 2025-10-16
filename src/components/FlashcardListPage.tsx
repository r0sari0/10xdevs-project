"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import type {
  FlashcardDto,
  FlashcardListPageState,
  CreateFlashcardCommand,
  UpdateFlashcardCommand,
  PaginatedResponseDto,
} from "../types";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import FlashcardList from "./FlashcardList";
import PaginationControl from "./PaginationControl";
import SortDropdown from "./SortDropdown";
import CreateFlashcardDialog from "./CreateFlashcardDialog";
import EditFlashcardDialog from "./EditFlashcardDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import EmptyState from "./EmptyState";

const INITIAL_STATE: FlashcardListPageState = {
  flashcards: [],
  totalCount: 0,
  currentPage: 1,
  limit: 20,
  isLoading: true,
  isSaving: false,
  error: null,
  createDialogOpen: false,
  editDialogOpen: false,
  editingFlashcard: null,
  deleteConfirmOpen: false,
  deletingFlashcard: null,
  sortBy: "created_at",
  sortOrder: "desc",
};

export default function FlashcardListPage() {
  const [state, setState] = useState<FlashcardListPageState>(INITIAL_STATE);

  /**
   * Fetch flashcards from API
   */
  const fetchFlashcards = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const params = new URLSearchParams({
        page: state.currentPage.toString(),
        limit: state.limit.toString(),
        sort: state.sortBy,
        order: state.sortOrder,
      });

      const response = await fetch(`/api/flashcards?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to fetch flashcards");
      }

      const data: PaginatedResponseDto<FlashcardDto> = await response.json();

      setState((prev) => ({
        ...prev,
        flashcards: data.data,
        totalCount: data.pagination.total,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      toast.error("Błąd podczas pobierania fiszek");
    }
  }, [state.currentPage, state.limit, state.sortBy, state.sortOrder]);

  /**
   * Fetch flashcards on component mount and when pagination/sorting changes
   */
  useEffect(() => {
    void fetchFlashcards();
  }, [fetchFlashcards]);

  /**
   * Create a new flashcard
   */
  const handleCreateFlashcard = useCallback(
    async (data: CreateFlashcardCommand) => {
      try {
        setState((prev) => ({ ...prev, isSaving: true }));

        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([data]),
        });

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = "/login";
            return;
          }
          throw new Error("Failed to create flashcard");
        }

        setState((prev) => ({
          ...prev,
          isSaving: false,
          createDialogOpen: false,
          currentPage: 1, // Reset to first page
        }));

        toast.success("Fiszka została dodana");
        await fetchFlashcards();
      } catch (error) {
        setState((prev) => ({ ...prev, isSaving: false }));
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error(`Błąd: ${errorMessage}`);
      }
    },
    [fetchFlashcards]
  );

  /**
   * Update an existing flashcard
   */
  const handleUpdateFlashcard = useCallback(
    async (id: number, data: UpdateFlashcardCommand) => {
      try {
        setState((prev) => ({ ...prev, isSaving: true }));

        const response = await fetch(`/api/flashcards/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = "/login";
            return;
          }
          if (response.status === 404) {
            throw new Error("Fiszka nie znaleziona");
          }
          throw new Error("Failed to update flashcard");
        }

        setState((prev) => ({
          ...prev,
          isSaving: false,
          editDialogOpen: false,
          editingFlashcard: null,
        }));

        toast.success("Fiszka została zaktualizowana");
        await fetchFlashcards();
      } catch (error) {
        setState((prev) => ({ ...prev, isSaving: false }));
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error(`Błąd: ${errorMessage}`);
      }
    },
    [fetchFlashcards]
  );

  /**
   * Delete a flashcard
   */
  const handleDeleteFlashcard = useCallback(
    async (id: number) => {
      try {
        setState((prev) => ({ ...prev, isSaving: true }));

        const response = await fetch(`/api/flashcards/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = "/login";
            return;
          }
          if (response.status === 404) {
            throw new Error("Fiszka nie znaleziona");
          }
          throw new Error("Failed to delete flashcard");
        }

        setState((prev) => {
          const newPage =
            prev.flashcards.length === 1 && prev.currentPage > 1 ? prev.currentPage - 1 : prev.currentPage;
          return {
            ...prev,
            isSaving: false,
            deleteConfirmOpen: false,
            deletingFlashcard: null,
            currentPage: newPage,
          };
        });

        toast.success("Fiszka została usunięta");
        await fetchFlashcards();
      } catch (error) {
        setState((prev) => ({ ...prev, isSaving: false }));
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error(`Błąd: ${errorMessage}`);
      }
    },
    [fetchFlashcards]
  );

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  }, []);

  /**
   * Handle limit change
   */
  const handleLimitChange = useCallback((limit: number) => {
    setState((prev) => ({
      ...prev,
      limit,
      currentPage: 1, // Reset to first page when limit changes
    }));
  }, []);

  /**
   * Handle sort change
   */
  const handleSortChange = useCallback((sortBy: string) => {
    setState((prev) => ({
      ...prev,
      sortBy,
      currentPage: 1, // Reset to first page
    }));
  }, []);

  /**
   * Handle sort order change
   */
  const handleSortOrderChange = useCallback((sortOrder: "asc" | "desc") => {
    setState((prev) => ({
      ...prev,
      sortOrder,
      currentPage: 1, // Reset to first page
    }));
  }, []);

  /**
   * Handle edit button click
   */
  const handleEditClick = useCallback((flashcard: FlashcardDto) => {
    setState((prev) => ({
      ...prev,
      editingFlashcard: flashcard,
      editDialogOpen: true,
    }));
  }, []);

  /**
   * Handle delete button click
   */
  const handleDeleteClick = useCallback((flashcard: FlashcardDto) => {
    setState((prev) => ({
      ...prev,
      deletingFlashcard: flashcard,
      deleteConfirmOpen: true,
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Moje Fiszki</h1>
            <p className="mt-2 text-gray-600">
              {state.totalCount} {state.totalCount === 1 ? "fiszka" : "fiszek"}
            </p>
          </div>
          <Button
            onClick={() =>
              setState((prev) => ({
                ...prev,
                createDialogOpen: true,
              }))
            }
            size="lg"
          >
            + Dodaj nową fiszkę
          </Button>
        </div>

        {/* Search and Filter Controls */}
        {state.totalCount > 0 && (
          <Card className="mb-6 p-4">
            <SortDropdown
              currentSort={state.sortBy}
              currentOrder={state.sortOrder}
              onSortChange={handleSortChange}
              onOrderChange={handleSortOrderChange}
            />
          </Card>
        )}

        {/* Main Content */}
        {state.totalCount === 0 && !state.isLoading ? (
          <EmptyState
            onAddFlashcardClick={() =>
              setState((prev) => ({
                ...prev,
                createDialogOpen: true,
              }))
            }
          />
        ) : (
          <>
            <FlashcardList
              flashcards={state.flashcards}
              isLoading={state.isLoading}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />

            {/* Pagination */}
            {state.totalCount > 0 && (
              <div className="mt-8">
                <PaginationControl
                  pagination={{
                    current_page: state.currentPage,
                    limit: state.limit,
                    total: state.totalCount,
                  }}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                  isLoading={state.isLoading}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <CreateFlashcardDialog
        isOpen={state.createDialogOpen}
        onOpenChange={(open) =>
          setState((prev) => ({
            ...prev,
            createDialogOpen: open,
          }))
        }
        onSubmit={handleCreateFlashcard}
        isLoading={state.isSaving}
      />

      <EditFlashcardDialog
        isOpen={state.editDialogOpen}
        flashcard={state.editingFlashcard}
        onOpenChange={(open) =>
          setState((prev) => ({
            ...prev,
            editDialogOpen: open,
            editingFlashcard: open ? prev.editingFlashcard : null,
          }))
        }
        onSubmit={handleUpdateFlashcard}
        isLoading={state.isSaving}
      />

      <DeleteConfirmDialog
        isOpen={state.deleteConfirmOpen}
        flashcard={state.deletingFlashcard}
        onOpenChange={(open) =>
          setState((prev) => ({
            ...prev,
            deleteConfirmOpen: open,
            deletingFlashcard: open ? prev.deletingFlashcard : null,
          }))
        }
        onConfirm={handleDeleteFlashcard}
        isLoading={state.isSaving}
      />
    </div>
  );
}
