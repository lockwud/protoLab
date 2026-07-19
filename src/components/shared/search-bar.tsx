"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  type: "project" | "course" | "assignment";
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchAsync = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(searchAsync, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    const paths: Record<string, string> = {
      project: `/projects/${result.id}`,
      course: `/courses/${result.id}`,
      assignment: `/assignments/${result.id}`,
    };
    router.push(paths[result.type]);
    setQuery("");
    setIsOpen(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "project":
        return "text-blue-500";
      case "course":
        return "text-green-500";
      case "assignment":
        return "text-purple-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="relative">
      <div className="relative h-8 w-56 hidden lg:flex items-center gap-2 rounded-md border border-border bg-card/70 px-3 text-[11px] text-muted-foreground shadow-sm">
        <SearchIcon aria-hidden="true" className="size-3.5 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search projects, courses..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        />
        {isLoading && (
          <div className="animate-spin">
            <SearchIcon className="size-3 opacity-50" />
          </div>
        )}
      </div>

      {isOpen && (results.length > 0 || query.trim()) && (
        <div
          ref={dropdownRef}
          className="absolute top-full right-0 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg z-50"
        >
          {results.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className="w-full px-4 py-3 text-left hover:bg-muted border-b border-border/50 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-medium uppercase px-2 py-1 rounded bg-secondary", getTypeColor(result.type))}>
                      {result.type}
                    </span>
                    <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
