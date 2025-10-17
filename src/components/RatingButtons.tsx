import { Button } from "./ui/button";
import { ThumbsUp, AlertCircle, RotateCcw } from "lucide-react";
import type { RatingOption } from "../types";

export interface RatingButtonsProps {
  isAnswerRevealed: boolean;
  onRate: (rating: RatingOption) => void;
}

/**
 * RatingButtons Component
 *
 * Displays three buttons for rating a flashcard:
 * - Easy (zielony)
 * - Hard (pomarańczowy)
 * - Again (czerwony)
 *
 * Buttons are disabled until the answer is revealed.
 *
 * Props:
 * - isAnswerRevealed: Whether the answer is shown (enables buttons)
 * - onRate: Callback when user rates the card
 */
export default function RatingButtons({ isAnswerRevealed, onRate }: RatingButtonsProps) {
  const ratingOptions: RatingOption[] = [
    {
      label: "Łatwe",
      value: "easy",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      label: "Trudne",
      value: "hard",
      color: "bg-orange-500 hover:bg-orange-600",
    },
    {
      label: "Do powtórki",
      value: "again",
      color: "bg-red-500 hover:bg-red-600",
    },
  ];

  return (
    <div className="flex gap-4 flex-wrap justify-center">
      {ratingOptions.map((option) => (
        <Button
          key={option.value}
          onClick={() => onRate(option)}
          disabled={!isAnswerRevealed}
          className={`flex items-center gap-2 ${option.color} transition-colors`}
          size="lg"
        >
          {option.value === "easy" && <ThumbsUp className="w-5 h-5" />}
          {option.value === "hard" && <AlertCircle className="w-5 h-5" />}
          {option.value === "again" && <RotateCcw className="w-5 h-5" />}
          {option.label}
        </Button>
      ))}
    </div>
  );
}
