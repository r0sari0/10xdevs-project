import { Button } from "./ui/button";
import { BookOpen } from "lucide-react";

/**
 * StudySessionEmpty Component
 *
 * Displays a message when user has no flashcards available for study.
 * Provides links to create or generate flashcards.
 */
export default function StudySessionEmpty() {
  return (
    <div className="flex flex-col items-center justify-start gap-8 px-4 pt-16" style={{ height: "calc(100vh - 4rem)" }}>
      {/* Icon */}
      <div className="bg-gray-100 p-6 rounded-full">
        <BookOpen className="w-16 h-16 text-gray-400" />
      </div>

      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Brak fiszek do nauki</h1>
        <p className="text-lg text-gray-600">
          Nie masz jeszcze żadnych fiszek. Utwórz lub wygeneruj nowe fiszki, aby rozpocząć naukę.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <Button asChild variant="default" size="lg">
          <a href="/generate">Wygeneruj fiszki przez AI</a>
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href="/flashcards">Moje fiszki</a>
        </Button>
      </div>
    </div>
  );
}
