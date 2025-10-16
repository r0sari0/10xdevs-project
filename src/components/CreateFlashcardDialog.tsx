"use client";

import type { CreateFlashcardCommand } from "../types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import FlashcardForm from "./FlashcardForm";

interface CreateFlashcardDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateFlashcardCommand) => Promise<void>;
  isLoading?: boolean;
}

export default function CreateFlashcardDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: CreateFlashcardDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Dodaj nową fiszkę</DialogTitle>
          <DialogDescription>Wpisz pytanie i odpowiedź dla nowej fiszki</DialogDescription>
        </DialogHeader>
        <FlashcardForm mode="create" onSubmit={onSubmit} onCancel={() => onOpenChange(false)} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
}
