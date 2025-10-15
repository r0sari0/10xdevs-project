import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import SourceTextInput from "./SourceTextInput";
import FlashcardProposalGrid from "./FlashcardProposalGrid";
import type {
  CreateGenerationCommand,
  CreateGenerationResponseDto,
  FlashcardProposalDto,
  CreateFlashcardCommand,
  FlashcardDto,
} from "@/types";

/**
 * ViewModel dla propozycji fiszki, rozszerzający DTO o dane potrzebne w UI.
 */
export type FlashcardProposalViewModel = FlashcardProposalDto & {
  /**
   * Unikalny identyfikator na potrzeby UI (np. UUID lub indeks), kluczowy dla operacji w React.
   */
  id: string;
  /**
   * Flaga wskazująca, czy użytkownik zmodyfikował daną propozycję.
   * Używane do określenia `source` ("ai-full" vs "ai-edited") podczas zapisu.
   */
  isEdited: boolean;
};

type Status = "idle" | "loading" | "success" | "error";

/**
 * Custom hook do zarządzania stanem generatora fiszek.
 */
function useFlashcardGenerator() {
  const [sourceText, setSourceText] = useState<string>("");
  const [proposals, setProposals] = useState<FlashcardProposalViewModel[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const minLength = 1000;
  const maxLength = 10000;
  const isTextValid = sourceText.length >= minLength && sourceText.length <= maxLength;

  /**
   * Wywołuje API do generowania fiszek.
   */
  const handleGenerate = useCallback(async () => {
    if (!isTextValid) {
      toast.error("Tekst musi mieć od 1000 do 10000 znaków");
      return;
    }

    setStatus("loading");
    setError(null);
    setProposals([]);

    try {
      const command: CreateGenerationCommand = {
        source_text: sourceText,
      };

      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Błąd walidacji danych.");
        }
        throw new Error("Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.");
      }

      const data: CreateGenerationResponseDto = await response.json();

      // Mapowanie na ViewModel
      const viewModels: FlashcardProposalViewModel[] = data.flashcards_proposals.map((proposal, index) => ({
        ...proposal,
        id: `${data.generation_id}-${index}`,
        isEdited: false,
      }));

      setProposals(viewModels);
      setStatus("success");
      toast.success(`Wygenerowano ${viewModels.length} ${viewModels.length === 1 ? "fiszkę" : "fiszek"}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Błąd połączenia. Sprawdź swoją sieć.";
      setError(errorMessage);
      setStatus("error");
      toast.error(errorMessage);
    }
  }, [isTextValid, sourceText]);

  /**
   * Aktualizuje propozycję fiszki na liście.
   */
  const handleUpdateProposal = useCallback((id: string, front: string, back: string) => {
    setProposals((prev) =>
      prev.map((proposal) => (proposal.id === id ? { ...proposal, front, back, isEdited: true } : proposal))
    );
  }, []);

  /**
   * Usuwa propozycję z listy.
   */
  const handleDeleteProposal = useCallback((id: string) => {
    setProposals((prev) => prev.filter((proposal) => proposal.id !== id));
    toast.info("Usunięto propozycję fiszki");
  }, []);

  /**
   * Zapisuje wszystkie propozycje jako fiszki.
   */
  const handleSaveAll = useCallback(async () => {
    if (proposals.length === 0) {
      toast.error("Brak fiszek do zapisania");
      return;
    }

    setIsSaving(true);
    setError(null);

    const savingToast = toast.loading(
      `Zapisywanie ${proposals.length} ${proposals.length === 1 ? "fiszki" : "fiszek"}...`
    );

    try {
      const commands: CreateFlashcardCommand[] = proposals.map((proposal) => ({
        front: proposal.front,
        back: proposal.back,
        source: proposal.isEdited ? ("ai-edited" as const) : ("ai-full" as const),
      }));

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commands),
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Błąd walidacji danych.");
        }
        throw new Error("Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.");
      }

      const savedFlashcards: FlashcardDto[] = await response.json();

      // Reset stanu po pomyślnym zapisie
      setSourceText("");
      setProposals([]);
      setStatus("idle");

      toast.success(
        `Pomyślnie zapisano ${savedFlashcards.length} ${savedFlashcards.length === 1 ? "fiszkę" : "fiszek"}!`,
        { id: savingToast }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Błąd połączenia. Sprawdź swoją sieć.";
      setError(errorMessage);
      toast.error(errorMessage, { id: savingToast });
    } finally {
      setIsSaving(false);
    }
  }, [proposals]);

  return {
    sourceText,
    setSourceText,
    proposals,
    status,
    error,
    setError,
    isSaving,
    isTextValid,
    minLength,
    maxLength,
    handleGenerate,
    handleUpdateProposal,
    handleDeleteProposal,
    handleSaveAll,
  };
}

/**
 * Główny komponent generatora fiszek.
 */
export default function FlashcardGenerator() {
  const {
    sourceText,
    setSourceText,
    proposals,
    status,
    error,
    setError,
    isSaving,
    isTextValid,
    minLength,
    maxLength,
    handleGenerate,
    handleUpdateProposal,
    handleDeleteProposal,
    handleSaveAll,
  } = useFlashcardGenerator();

  // Keyboard shortcuts: Ctrl/Cmd + Enter do generowania
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter w textarea generuje fiszki
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        const target = e.target as HTMLElement;
        if (target.tagName === "TEXTAREA" && target.id === "source-text") {
          e.preventDefault();
          if (isTextValid && status !== "loading") {
            handleGenerate();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleGenerate, isTextValid, status]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Generator Fiszek</h1>
        <p className="text-gray-600">Wklej tekst i wygeneruj fiszki automatycznie za pomocą AI</p>
      </div>

      {/* Input tekstowy */}
      <div className="mb-6">
        <SourceTextInput value={sourceText} onTextChange={setSourceText} minLength={minLength} maxLength={maxLength} />
      </div>

      {/* Przycisk generowania */}
      <div className="mb-8">
        <Button
          disabled={!isTextValid || status === "loading"}
          onClick={handleGenerate}
          size="lg"
          className="w-full sm:w-auto"
        >
          {status === "loading" ? "Generowanie fiszek..." : "Generuj fiszki"}
        </Button>
      </div>

      {/* Komunikat błędu */}
      {error && (
        <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Wystąpił błąd</h3>
              <p>{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900 ml-4"
              aria-label="Zamknij komunikat o błędzie"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Wskaźnik ładowania */}
      {status === "loading" && (
        <div className="mb-8 flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="text-gray-600">Generuję fiszki...</p>
          </div>
        </div>
      )}

      {/* Siatka propozycji fiszek */}
      <FlashcardProposalGrid
        proposals={proposals}
        onUpdateProposal={handleUpdateProposal}
        onDeleteProposal={handleDeleteProposal}
        onSaveAll={handleSaveAll}
        isSaving={isSaving}
      />
    </div>
  );
}
