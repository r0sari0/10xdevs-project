import type { FlashcardDto } from "../types";
import FlashcardListItem from "./FlashcardListItem";

interface FlashcardListProps {
  flashcards: FlashcardDto[];
  isLoading: boolean;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
}

export default function FlashcardList({ flashcards, isLoading, onEdit, onDelete }: FlashcardListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="rounded-lg bg-white py-12 text-center">
        <p className="text-gray-500">Nie znaleziono fiszek</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {flashcards.map((flashcard) => (
        <li key={flashcard.id}>
          <FlashcardListItem
            flashcard={flashcard}
            onEdit={() => onEdit(flashcard)}
            onDelete={() => onDelete(flashcard)}
          />
        </li>
      ))}
    </ul>
  );
}
