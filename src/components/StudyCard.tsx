import { useState } from "react";
import type { FlashcardDto } from "../types";

export interface StudyCardProps {
  flashcard: FlashcardDto;
  isAnswerRevealed: boolean;
  onToggleAnswer: () => void;
}

/**
 * StudyCard Component
 *
 * Displays a single flashcard with flip animation.
 * Shows the front (question) by default, and flips to show the back (answer)
 * when the user clicks or when isAnswerRevealed is true.
 *
 * Props:
 * - flashcard: The flashcard data to display
 * - isAnswerRevealed: Whether to show the back/answer
 * - onToggleAnswer: Callback when user clicks the card to toggle answer
 */
export default function StudyCard({ flashcard, isAnswerRevealed, onToggleAnswer }: StudyCardProps) {
  const [isFlipping, setIsFlipping] = useState(false);

  const handleCardClick = () => {
    setIsFlipping(true);
    onToggleAnswer();
    // Remove flip animation class after animation completes
    setTimeout(() => setIsFlipping(false), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div className="perspective w-full h-96">
      {/* Card container with flip effect */}
      <div
        className={`relative w-full h-full transition-transform duration-300 cursor-pointer ${
          isFlipping ? "scale-95" : "scale-100"
        }`}
        style={{
          transformStyle: "preserve-3d" as const,
          transform: isAnswerRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-pressed={isAnswerRevealed}
      >
        {/* Front of card */}
        <div
          className="absolute w-full h-full bg-white rounded-lg shadow-lg p-8 flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: "hidden" as const,
            transform: "rotateY(0deg)",
          }}
        >
          <p className="text-gray-500 text-sm mb-4">Pytanie</p>
          <p className="text-2xl font-semibold text-center text-gray-900 leading-relaxed">{flashcard.front}</p>
          <p className="text-gray-400 text-sm mt-8 italic">Kliknij, aby zobaczyć odpowiedź</p>
        </div>

        {/* Back of card */}
        <div
          className="absolute w-full h-full bg-blue-50 rounded-lg shadow-lg p-8 flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: "hidden" as const,
            transform: "rotateY(180deg)",
          }}
        >
          <p className="text-gray-500 text-sm mb-4">Odpowiedź</p>
          <p className="text-2xl font-semibold text-center text-blue-900 leading-relaxed">{flashcard.back}</p>
          <p className="text-gray-400 text-sm mt-8 italic">Kliknij, aby ukryć odpowiedź</p>
        </div>
      </div>

      {/* Source badge */}
      <div className="mt-4 flex justify-center">
        <span className="text-xs px-3 py-1 rounded-full bg-gray-200 text-gray-700">
          {flashcard.source === "ai-full" && "Wygenerowana przez AI"}
          {flashcard.source === "ai-edited" && "Edytowana wygenerowana"}
          {flashcard.source === "manual" && "Ręcznie utworzona"}
        </span>
      </div>
    </div>
  );
}
