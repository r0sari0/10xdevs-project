import { Textarea } from "@/components/ui/textarea";

interface SourceTextInputProps {
  value: string;
  onTextChange: (text: string) => void;
  minLength: number;
  maxLength: number;
}

/**
 * Komponent do wprowadzania tekstu źródłowego przez użytkownika.
 * Zawiera pole textarea i licznik znaków.
 */
export default function SourceTextInput({ value, onTextChange, minLength, maxLength }: SourceTextInputProps) {
  const currentLength = value.length;
  const isValid = currentLength >= minLength && currentLength <= maxLength;
  const isTooShort = currentLength > 0 && currentLength < minLength;
  const isTooLong = currentLength > maxLength;

  const getCharCountColor = () => {
    if (isTooLong) return "text-red-600";
    if (isTooShort) return "text-yellow-600";
    if (isValid) return "text-green-600";
    return "text-gray-500";
  };

  const getHelperText = () => {
    if (isTooLong) {
      return `Tekst jest za długi (${currentLength - maxLength} znaków powyżej limitu)`;
    }
    if (isTooShort) {
      return `Tekst jest za krótki (potrzeba jeszcze ${minLength - currentLength} znaków)`;
    }
    if (isValid) {
      return "Długość tekstu jest poprawna";
    }
    return `Wprowadź tekst (minimum ${minLength} znaków)`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="source-text" className="block text-sm font-medium">
          Tekst źródłowy
        </label>
        <p className="text-xs text-gray-500">
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl</kbd>
          {" + "}
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Enter</kbd>
          {" do generowania"}
        </p>
      </div>
      <Textarea
        id="source-text"
        value={value}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki..."
        className="min-h-[200px] resize-y"
        aria-describedby="char-count-info"
        data-testid="source-text-input"
      />
      <div id="char-count-info" className="flex items-center justify-between text-sm">
        <p className="text-gray-600">{getHelperText()}</p>
        <p className={`font-medium ${getCharCountColor()}`}>
          {currentLength} / {maxLength}
        </p>
      </div>
    </div>
  );
}
