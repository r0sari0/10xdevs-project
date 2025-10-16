import { ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "./ui/button";

interface SortDropdownProps {
  currentSort: string;
  currentOrder: "asc" | "desc";
  onSortChange: (sort: string) => void;
  onOrderChange: (order: "asc" | "desc") => void;
}

const SORT_OPTIONS = [
  { value: "created_at", label: "Data utworzenia" },
  { value: "updated_at", label: "Ostatnia edycja" },
  { value: "source", label: "Źródło" },
];

export default function SortDropdown({ currentSort, currentOrder, onSortChange, onOrderChange }: SortDropdownProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="flex items-center gap-3">
        <label htmlFor="sort" className="text-sm font-medium text-gray-700">
          Sortuj po:
        </label>
        <select
          id="sort"
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm font-medium"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={currentOrder === "asc" ? "default" : "outline"}
          size="sm"
          onClick={() => onOrderChange("asc")}
          className="flex items-center gap-1"
        >
          <ArrowUp className="h-4 w-4" />
          Rosnąco
        </Button>
        <Button
          variant={currentOrder === "desc" ? "default" : "outline"}
          size="sm"
          onClick={() => onOrderChange("desc")}
          className="flex items-center gap-1"
        >
          <ArrowDown className="h-4 w-4" />
          Malejąco
        </Button>
      </div>
    </div>
  );
}
