import { BookOpen, Plus } from "lucide-react";
import { Button } from "./ui/button";

interface EmptyStateProps {
  onAddFlashcardClick: () => void;
}

export default function EmptyState({ onAddFlashcardClick }: EmptyStateProps) {
  return (
    <div className="rounded-lg bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
        <BookOpen className="h-6 w-6 text-blue-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Nie masz jeszcze fiszek</h3>
      <p className="mt-2 text-gray-600">Zacznij od wygenerowania fiszek z tekstu lub dodaj je ręcznie.</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={onAddFlashcardClick} className="flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" />
          Dodaj fiszkę ręcznie
        </Button>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/generate")}
          className="flex items-center justify-center gap-2"
        >
          Wygeneruj fiszki z tekstu
        </Button>
      </div>
    </div>
  );
}
