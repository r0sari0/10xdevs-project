import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import type { Pagination } from "../types";

interface PaginationControlProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isLoading?: boolean;
}

export default function PaginationControl({
  pagination,
  onPageChange,
  onLimitChange,
  isLoading = false,
}: PaginationControlProps) {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const canGoPrevious = pagination.current_page > 1;
  const canGoNext = pagination.current_page < totalPages;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (pagination.current_page > 3) {
        pages.push("...");
      }

      // Show surrounding pages
      const start = Math.max(2, pagination.current_page - 1);
      const end = Math.min(totalPages - 1, pagination.current_page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (pagination.current_page < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="space-y-4">
      {/* Pagination Info and Limit */}
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="text-sm text-gray-600">
          Strona <span className="font-semibold">{pagination.current_page}</span> z{" "}
          <span className="font-semibold">{totalPages}</span> •{" "}
          <span className="font-semibold">{pagination.total}</span> fiszek
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="limit" className="text-sm font-medium text-gray-700">
            Na stronę:
          </label>
          <select
            id="limit"
            value={pagination.limit}
            onChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
            disabled={isLoading}
            className="rounded border border-gray-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Pagination Buttons */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.current_page - 1)}
          disabled={!canGoPrevious || isLoading}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Poprzednia
        </Button>

        <div className="flex flex-wrap justify-center gap-1">
          {getPageNumbers().map((page, i) => (
            <div key={i}>
              {page === "..." ? (
                <span className="px-2 py-2 text-gray-600">...</span>
              ) : (
                <Button
                  variant={page === pagination.current_page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  disabled={isLoading}
                  className="min-w-[40px]"
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.current_page + 1)}
          disabled={!canGoNext || isLoading}
          className="flex items-center gap-1"
        >
          Następna
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
