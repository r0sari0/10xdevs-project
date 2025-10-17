import { useState, useCallback, useEffect } from "react";
import type {
  FlashcardDto,
  StudySessionState,
  StudySessionPhase,
  StudySessionComputedState,
  RatingOption,
  PaginatedResponseDto,
} from "../../types";

/**
 * Fisher-Yates shuffle algorithm to randomly reorder an array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Custom hook for managing study session state and logic
 *
 * Handles:
 * - Loading flashcards from API
 * - Shuffling flashcards randomly
 * - Managing session lifecycle (notStarted -> loading -> active -> finished)
 * - Answer reveal state
 * - Error handling and recovery
 */
export function useStudySession() {
  // Session state management
  const [state, setState] = useState<StudySessionState>({
    flashcards: [],
    currentCardIndex: 0,
    sessionPhase: "notStarted",
    isAnswerRevealed: false,
    isLoading: false,
    error: null,
  });

  /**
   * Load all flashcards from API
   * Fetches up to 100 flashcards (API limit)
   */
  const loadFlashcards = useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        sessionPhase: "loading",
        isLoading: true,
        error: null,
      }));

      const params = new URLSearchParams({
        page: "1",
        limit: "100",
        sort: "created_at",
        order: "desc",
      });

      const response = await fetch(`/api/flashcards?${params.toString()}`);

      // Handle authentication errors
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Nie udało się załadować fiszek" }));
        throw new Error(errorData.message || `Błąd ${response.status}`);
      }

      const data: PaginatedResponseDto<FlashcardDto> = await response.json();

      // Handle empty flashcard list
      if (!data.data || data.data.length === 0) {
        setState((prev) => ({
          ...prev,
          flashcards: [],
          sessionPhase: "notStarted",
          isLoading: false,
        }));
        return;
      }

      // Shuffle flashcards
      const shuffled = shuffleArray(data.data);

      setState((prev) => ({
        ...prev,
        flashcards: shuffled,
        currentCardIndex: 0,
        isAnswerRevealed: false,
        isLoading: false,
        sessionPhase: "notStarted",
        error: null,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Nieznany błąd podczas pobierania fiszek";
      console.error("useStudySession loadFlashcards error:", error);
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        sessionPhase: "error",
      }));
    }
  }, []);

  /**
   * Start the study session - transition from notStarted to active
   */
  const startSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sessionPhase: "active",
      currentCardIndex: 0,
      isAnswerRevealed: false,
    }));
  }, []);

  /**
   * Toggle the answer reveal state for current card
   */
  const toggleAnswerRevealed = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAnswerRevealed: !prev.isAnswerRevealed,
    }));
  }, []);

  /**
   * Move to next flashcard
   * If at the end, transition to finished state
   */
  const nextCard = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentCardIndex + 1;

      // Check if we've reached the end
      if (nextIndex >= prev.flashcards.length) {
        return {
          ...prev,
          sessionPhase: "finished",
          currentCardIndex: prev.currentCardIndex, // Keep current index for display
        };
      }

      return {
        ...prev,
        currentCardIndex: nextIndex,
        isAnswerRevealed: false,
      };
    });
  }, []);

  /**
   * Rate the current card (easy/hard/again) and move to next
   * Currently just moves to next card (rating storage not implemented in MVP)
   */
  const rateCard = useCallback((rating: RatingOption) => {
    // In MVP, we don't persist ratings, just move to next card
    // Future: send rating to API endpoint
    nextCard();
  }, [nextCard]);

  /**
   * Retry loading flashcards after error
   */
  const retryLoadFlashcards = useCallback(() => {
    void loadFlashcards();
  }, [loadFlashcards]);

  /**
   * Load flashcards on component mount
   */
  useEffect(() => {
    void loadFlashcards();
  }, [loadFlashcards]);

  /**
   * Computed values derived from state
   */
  const computed: StudySessionComputedState = {
    ...state,
    currentCard: state.flashcards[state.currentCardIndex] || null,
    totalCards: state.flashcards.length,
    currentCardNumber: state.currentCardIndex + 1,
  };

  return {
    // State
    ...computed,

    // Actions
    startSession,
    toggleAnswerRevealed,
    nextCard,
    rateCard,
    retryLoadFlashcards,
  };
}
