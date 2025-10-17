export interface StudySessionHeaderProps {
  currentIndex: number;
  totalCards: number;
}

/**
 * StudySessionHeader Component
 *
 * Displays progress information during a study session.
 * Shows current card number and total cards with a progress bar.
 *
 * Props:
 * - currentIndex: Zero-based index of current card
 * - totalCards: Total number of cards in session
 */
export default function StudySessionHeader({ currentIndex, totalCards }: StudySessionHeaderProps) {
  const progress = totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0;

  return (
    <div className="w-full space-y-2">
      {/* Progress counter */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Fiszka {currentIndex + 1} z {totalCards}
        </h2>
        <span className="text-sm text-gray-500">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
