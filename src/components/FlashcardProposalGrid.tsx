import { Button } from "@/components/ui/button";
import FlashcardProposalCard from "./FlashcardProposalCard";
import type { FlashcardProposalViewModel } from "./FlashcardGenerator";

interface FlashcardProposalGridProps {
  proposals: FlashcardProposalViewModel[];
  onUpdateProposal: (id: string, front: string, back: string) => void;
  onDeleteProposal: (id: string) => void;
  onSaveAll: () => void;
  isSaving?: boolean;
}

/**
 * Komponent wyświetlający siatkę propozycji fiszek.
 * Zawiera karty propozycji i przycisk zapisu wszystkich fiszek.
 */
export default function FlashcardProposalGrid({
  proposals,
  onUpdateProposal,
  onDeleteProposal,
  onSaveAll,
  isSaving = false,
}: FlashcardProposalGridProps) {
  if (proposals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Propozycje fiszek ({proposals.length})</h2>
        <Button onClick={onSaveAll} disabled={isSaving || proposals.length === 0} size="lg">
          {isSaving ? "Zapisywanie..." : `Zapisz wszystkie (${proposals.length})`}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proposals.map((proposal) => (
          <FlashcardProposalCard
            key={proposal.id}
            proposal={proposal}
            onUpdate={(front, back) => onUpdateProposal(proposal.id, front, back)}
            onDelete={() => onDeleteProposal(proposal.id)}
          />
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={onSaveAll} disabled={isSaving || proposals.length === 0} size="lg">
          {isSaving ? "Zapisywanie..." : `Zapisz wszystkie (${proposals.length})`}
        </Button>
      </div>
    </div>
  );
}
