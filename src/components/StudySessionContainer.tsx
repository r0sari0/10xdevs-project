import { useStudySession } from "../lib/hooks/useStudySession";
import StudySessionStart from "./StudySessionStart";
import StudySessionHeader from "./StudySessionHeader";
import StudyCard from "./StudyCard";
import RatingButtons from "./RatingButtons";
import StudySessionEmpty from "./StudySessionEmpty";
import StudySessionError from "./StudySessionError";
import { Loader2 } from "lucide-react";

/**
 * StudySessionContainer Component
 *
 * Main container component for the study session view.
 * Orchestrates all UI based on the current session phase and manages
 * all user interactions within the study session.
 *
 * Phases:
 * - "notStarted": Show start screen (StudySessionStart)
 * - "loading": Show loading spinner while fetching flashcards
 * - "active": Show study card with controls (StudyCard + RatingButtons)
 * - "finished": Show completion message (StudySessionEmpty - session complete)
 * - "error": Show error screen with retry option (StudySessionError)
 */
export default function StudySessionContainer() {
  const {
    currentCard,
    currentCardIndex,
    totalCards,
    sessionPhase,
    isAnswerRevealed,
    isLoading,
    error,
    startSession,
    toggleAnswerRevealed,
    rateCard,
    retryLoadFlashcards,
  } = useStudySession();

  // Handle loading phase
  if (sessionPhase === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-lg text-gray-600">Ładowanie fiszek...</p>
      </div>
    );
  }

  // Handle error phase
  if (sessionPhase === "error" && error) {
    return <StudySessionError error={error} onRetry={retryLoadFlashcards} />;
  }

  // Handle empty flashcards list
  if (totalCards === 0) {
    return <StudySessionEmpty />;
  }

  // Handle notStarted phase - show welcome screen
  if (sessionPhase === "notStarted") {
    return <StudySessionStart flashcardCount={totalCards} onStartSession={startSession} />;
  }

  // Handle finished phase - show completion screen
  if (sessionPhase === "finished") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
        <div className="bg-green-100 p-6 rounded-full">
          <div className="w-16 h-16 text-green-600 flex items-center justify-center">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Świetnie!</h1>
          <p className="text-xl text-gray-600">Przejrzeliśmy wszystkie {totalCards} fiszek.</p>
        </div>

        <p className="text-center text-gray-500 max-w-md">
          Możesz powtórzyć sesję lub wrócić do zarządzania swoimi fiskami.
        </p>

        <div className="flex gap-4 flex-col sm:flex-row">
          <button
            onClick={startSession}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Powtórz sesję
          </button>
          <a
            href="/flashcards"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
          >
            Moje fiszki
          </a>
        </div>
      </div>
    );
  }

  // Handle active phase - show study card
  if (sessionPhase === "active" && currentCard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto">
        {/* Header with progress */}
        <StudySessionHeader currentIndex={currentCardIndex} totalCards={totalCards} />

        {/* Spacer */}
        <div className="mt-12" />

        {/* Study Card */}
        <StudyCard flashcard={currentCard} isAnswerRevealed={isAnswerRevealed} onToggleAnswer={toggleAnswerRevealed} />

        {/* Spacer */}
        <div className="mt-12" />

        {/* Show Answer Button and Rating Buttons */}
        <div className="w-full space-y-6">
          {/* Show/Hide Answer Button */}
          <div className="flex justify-center">
            <button
              onClick={toggleAnswerRevealed}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              {isAnswerRevealed ? "Ukryj odpowiedź" : "Pokaż odpowiedź"}
            </button>
          </div>

          {/* Rating Buttons */}
          <RatingButtons isAnswerRevealed={isAnswerRevealed} onRate={rateCard} />
        </div>
      </div>
    );
  }

  // Fallback (shouldn't normally reach here)
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Ładowanie...</p>
    </div>
  );
}
