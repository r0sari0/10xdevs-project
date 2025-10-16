"use client";

import type { FlashcardDto, UpdateFlashcardCommand } from "../types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import FlashcardForm from "./FlashcardForm";

interface EditFlashcardDialogProps {
  isOpen: boolean;
  flashcard: FlashcardDto | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: number, data: UpdateFlashcardCommand) => Promise<void>;
  isLoading?: boolean;
}

export default function EditFlashcardDialog({
  isOpen,
  flashcard,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: EditFlashcardDialogProps) {
  if (!flashcard) {
    return null;
  }

  const handleSubmit = async (data: UpdateFlashcardCommand) => {
    await onSubmit(flashcard.id, data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <DialogDescription>Zmień pytanie lub odpowiedź dla fiszki</DialogDescription>
        </DialogHeader>
        <FlashcardForm
          mode="edit"
          initialData={flashcard}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
