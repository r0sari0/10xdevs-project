"use client";

import type { FlashcardDto } from "../types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  flashcard: FlashcardDto | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: number) => Promise<void>;
  isLoading?: boolean;
}

export default function DeleteConfirmDialog({
  isOpen,
  flashcard,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  if (!flashcard) {
    return null;
  }

  const handleConfirm = async () => {
    await onConfirm(flashcard.id);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Potwierdzenie usunięcia</AlertDialogTitle>
          <AlertDialogDescription>
            Czy jesteś pewien, że chcesz trwale usunąć tę fiszkę?
            <br />
            <br />
            <span className="font-semibold text-gray-900">Pytanie:</span> {flashcard.front}
            <br />
            <br />
            Ta akcja nie może być cofnięta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3">
          <AlertDialogCancel disabled={isLoading}>Anuluj</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
            {isLoading ? "Usuwanie..." : "Usuń"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
