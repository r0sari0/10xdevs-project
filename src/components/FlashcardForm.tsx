"use client";

import { useState, useCallback } from "react";
import type { CreateFlashcardCommand, UpdateFlashcardCommand, FlashcardDto, FlashcardFormErrors } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface FlashcardFormProps {
  initialData?: Partial<FlashcardDto>;
  isLoading?: boolean;
  onSubmit: (data: CreateFlashcardCommand | UpdateFlashcardCommand) => void;
  onCancel: () => void;
  mode: "create" | "edit";
}

const MAX_FRONT = 200;
const MAX_BACK = 500;

export default function FlashcardForm({
  initialData,
  isLoading = false,
  onSubmit,
  onCancel,
  mode,
}: FlashcardFormProps) {
  const [front, setFront] = useState(initialData?.front || "");
  const [back, setBack] = useState(initialData?.back || "");
  const [errors, setErrors] = useState<FlashcardFormErrors>({});
  const [touched, setTouched] = useState({ front: false, back: false });

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (fieldName: string, value: string) => {
      const newErrors: FlashcardFormErrors = {};

      if (fieldName === "front" || !fieldName) {
        const trimmedFront = (fieldName === "front" ? value : front).trim();
        if (!trimmedFront) {
          newErrors.front = "Pytanie jest wymagane";
        } else if (trimmedFront.length > MAX_FRONT) {
          newErrors.front = `Pytanie nie może być dłuższe niż ${MAX_FRONT} znaków`;
        }
      }

      if (fieldName === "back" || !fieldName) {
        const trimmedBack = (fieldName === "back" ? value : back).trim();
        if (!trimmedBack) {
          newErrors.back = "Odpowiedź jest wymagana";
        } else if (trimmedBack.length > MAX_BACK) {
          newErrors.back = `Odpowiedź nie może być dłuższa niż ${MAX_BACK} znaków`;
        }
      }

      if (fieldName) {
        setErrors((prev) => ({
          ...prev,
          ...newErrors,
        }));
      } else {
        setErrors(newErrors);
      }

      return Object.keys(newErrors).length === 0;
    },
    [front, back]
  );

  /**
   * Handle front input change
   */
  const handleFrontChange = (value: string) => {
    if (value.length <= MAX_FRONT) {
      setFront(value);
      if (touched.front) {
        validateField("front", value);
      }
    }
  };

  /**
   * Handle back input change
   */
  const handleBackChange = (value: string) => {
    if (value.length <= MAX_BACK) {
      setBack(value);
      if (touched.back) {
        validateField("back", value);
      }
    }
  };

  /**
   * Handle blur on front field
   */
  const handleFrontBlur = () => {
    setTouched((prev) => ({ ...prev, front: true }));
    validateField("front", front);
  };

  /**
   * Handle blur on back field
   */
  const handleBackBlur = () => {
    setTouched((prev) => ({ ...prev, back: true }));
    validateField("back", back);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const isValid = validateField("", "");

    if (!isValid) {
      return;
    }

    const data = {
      front: front.trim(),
      back: back.trim(),
      ...(mode === "create" && { source: "manual" as const }),
    };

    onSubmit(data);
  };

  const isSubmitDisabled = isLoading || !front.trim() || !back.trim() || Object.keys(errors).length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Front Field */}
      <div className="space-y-2">
        <Label htmlFor="front">
          Pytanie ({front.length}/{MAX_FRONT})
        </Label>
        <Input
          id="front"
          type="text"
          placeholder="Wpisz pytanie..."
          value={front}
          onChange={(e) => handleFrontChange(e.target.value)}
          onBlur={handleFrontBlur}
          disabled={isLoading}
          className={errors.front && touched.front ? "border-red-500" : ""}
        />
        {errors.front && touched.front && <p className="text-sm text-red-600">{errors.front}</p>}
      </div>

      {/* Back Field */}
      <div className="space-y-2">
        <Label htmlFor="back">
          Odpowiedź ({back.length}/{MAX_BACK})
        </Label>
        <Textarea
          id="back"
          placeholder="Wpisz odpowiedź..."
          value={back}
          onChange={(e) => handleBackChange(e.target.value)}
          onBlur={handleBackBlur}
          disabled={isLoading}
          rows={5}
          className={errors.back && touched.back ? "border-red-500" : ""}
        />
        {errors.back && touched.back && <p className="text-sm text-red-600">{errors.back}</p>}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitDisabled} className="flex-1">
          {isLoading ? "Zapisywanie..." : "Zapisz"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
          Anuluj
        </Button>
      </div>
    </form>
  );
}
