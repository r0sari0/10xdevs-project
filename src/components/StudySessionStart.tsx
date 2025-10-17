import { Button } from "./ui/button";
import { BookOpen } from "lucide-react";

export interface StudySessionStartProps {
  flashcardCount: number;
  onStartSession: () => void;
}

/**
 * StudySessionStart Component
 *
 * Displays the initial screen of a study session with a welcoming message
 * and a button to begin the session.
 *
 * Props:
 * - flashcardCount: Number of flashcards available for study
 * - onStartSession: Callback when user clicks "Start Study" button
 */
export default function StudySessionStart({ flashcardCount, onStartSession }: StudySessionStartProps) {
  return (
    <div className="flex flex-col items-center justify-start gap-8 px-4 pt-8">
      {/* Icon */}
      <div className="bg-blue-100 p-6 rounded-full">
        <BookOpen className="w-16 h-16 text-blue-600" />
      </div>

      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">Rozpocznij naukę</h1>
        <p className="text-xl text-gray-600">
          Masz do nauki {flashcardCount} {flashcardCount === 1 ? "fiszkę" : "fiszek"}
        </p>
      </div>

      {/* Description */}
      <p className="text-center text-gray-500 max-w-md">
        Przejrzyj swoje fiszki w skupiony sposób. Pokaż odpowiedź, oceń swoją wiedzę i przejdź do następnej fiszki.
      </p>

      {/* Start Button */}
      <Button onClick={onStartSession} size="lg" className="mt-4">
        Zacznij naukę
      </Button>
    </div>
  );
}
