import type { FlashcardDto, FlashcardSource } from "../types";
import { FLASHCARD_SOURCE_LABELS, FLASHCARD_SOURCE_COLORS } from "../types";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface FlashcardListItemProps {
  flashcard: FlashcardDto;
  onEdit: () => void;
  onDelete: () => void;
}

export default function FlashcardListItem({ flashcard, onEdit, onDelete }: FlashcardListItemProps) {
  const source = (flashcard.source || "manual") as FlashcardSource;
  const sourceLabel = FLASHCARD_SOURCE_LABELS[source];
  const sourceColor = FLASHCARD_SOURCE_COLORS[source];

  const formattedCreatedAt = new Date(flashcard.created_at).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedUpdatedAt = new Date(flashcard.updated_at).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            {/* Front (Question) */}
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-600">Pytanie</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">{flashcard.front}</p>
            </div>

            {/* Back (Answer) */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600">Odpowiedź</h3>
              <p className="mt-1 text-gray-700">{flashcard.back}</p>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <div>
                <span className="font-medium">Utworzona:</span> {formattedCreatedAt}
              </div>
              <div>
                <span className="font-medium">Edytowana:</span> {formattedUpdatedAt}
              </div>
            </div>
          </div>

          {/* Source Badge */}
          <div
            className={`ml-4 inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${sourceColor}`}
          >
            {sourceLabel}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit} className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Edytuj
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Usuń
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
