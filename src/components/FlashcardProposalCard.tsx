import { useState, useEffect, memo } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FlashcardProposalViewModel } from "./FlashcardGenerator";

interface FlashcardProposalCardProps {
  proposal: FlashcardProposalViewModel;
  onUpdate: (front: string, back: string) => void;
  onDelete: () => void;
}

/**
 * Komponent reprezentujący pojedynczą propozycję fiszki.
 * Posiada tryb widoku i edycji.
 * Zoptymalizowany z React.memo aby uniknąć niepotrzebnych re-renderów.
 */
const FlashcardProposalCard = memo(function FlashcardProposalCard({
  proposal,
  onUpdate,
  onDelete,
}: FlashcardProposalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFront, setEditedFront] = useState(proposal.front);
  const [editedBack, setEditedBack] = useState(proposal.back);

  const handleSaveEdit = () => {
    if (!editedFront.trim() || !editedBack.trim()) {
      return;
    }
    onUpdate(editedFront, editedBack);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedFront(proposal.front);
    setEditedBack(proposal.back);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditedFront(proposal.front);
    setEditedBack(proposal.back);
    setIsEditing(true);
  };

  // Keyboard shortcut: Escape w trybie edycji anuluje edycję
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancelEdit();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isEditing]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        {proposal.isEdited && (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 w-fit">
            Edytowane
          </span>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {isEditing ? (
          <>
            {/* Tryb edycji */}
            <div className="mb-2 text-xs text-gray-500 flex items-center gap-1">
              <span>Naciśnij</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                Esc
              </kbd>
              <span>aby anulować</span>
            </div>
            <div className="space-y-2">
              <label htmlFor={`front-${proposal.id}`} className="text-sm font-medium">
                Przód fiszki
              </label>
              <Input
                id={`front-${proposal.id}`}
                value={editedFront}
                onChange={(e) => setEditedFront(e.target.value)}
                placeholder="Pytanie lub termin"
                aria-label="Przód fiszki"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor={`back-${proposal.id}`} className="text-sm font-medium">
                Tył fiszki
              </label>
              <Textarea
                id={`back-${proposal.id}`}
                value={editedBack}
                onChange={(e) => setEditedBack(e.target.value)}
                placeholder="Odpowiedź lub definicja"
                className="min-h-[100px] resize-y"
                aria-label="Tył fiszki"
              />
            </div>
          </>
        ) : (
          <>
            {/* Tryb widoku */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Przód:</p>
              <p className="text-base font-semibold">{proposal.front}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Tył:</p>
              <p className="text-base">{proposal.back}</p>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
        {isEditing ? (
          <>
            <Button
              onClick={handleSaveEdit}
              disabled={!editedFront.trim() || !editedBack.trim()}
              className="flex-1"
            >
              Zapisz
            </Button>
            <Button
              onClick={handleCancelEdit}
              variant="outline"
              className="flex-1"
            >
              Anuluj
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={handleStartEdit}
              variant="outline"
              className="flex-1"
            >
              Edytuj
            </Button>
            <Button
              onClick={onDelete}
              variant="destructive"
              className="flex-1"
            >
              Usuń
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
});

export default FlashcardProposalCard;

