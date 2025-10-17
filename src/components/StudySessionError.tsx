import { Button } from "./ui/button";
import { AlertTriangle } from "lucide-react";

export interface StudySessionErrorProps {
  error: string;
  onRetry: () => void;
}

/**
 * StudySessionError Component
 *
 * Displays an error message when flashcards fail to load.
 * Provides a retry button and link back to flashcards list.
 *
 * Props:
 * - error: Error message to display
 * - onRetry: Callback when user clicks retry button
 */
export default function StudySessionError({ error, onRetry }: StudySessionErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      {/* Icon */}
      <div className="bg-red-100 p-6 rounded-full">
        <AlertTriangle className="w-16 h-16 text-red-600" />
      </div>

      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Błąd podczas ładowania</h1>
        <p className="text-lg text-gray-600">Nie udało się załadować Twoich fiszek.</p>
      </div>

      {/* Error message */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md text-center">
        <p className="text-red-800">{error}</p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <Button onClick={onRetry} size="lg">
          Spróbuj ponownie
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href="/flashcards">Moje fiszki</a>
        </Button>
      </div>
    </div>
  );
}
