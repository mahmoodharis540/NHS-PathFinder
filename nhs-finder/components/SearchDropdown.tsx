"use client";

import { useEffect, useState } from "react";

type Item = {
  DestinationID: number;
  DestinationName: string;
  BuildingID: number;
  isEntrance: number;
};

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function SearchDropdown({
  label,
  placeholder,
  apiUrl,
  onSelect,
}: {
  label: string;
  placeholder: string;
  apiUrl: string; // "/api/entrances" or "/api/destinations-search"
  onSelect?: (item: Item) => void;
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 250);
  const [results, setResults] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const run = async () => {
      // fetch even when empty -> shows up to 35 items
      const res = await fetch(`${apiUrl}?take=35&q=${encodeURIComponent(debounced)}`);
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      setResults(JSON.parse(text));
    };

    run().catch(() => setResults([]));
  }, [apiUrl, debounced]);

  return (
    <div className="w-full max-w-lg">
      {/* label is OUTSIDE the white box */}
      <label className="block text-sm mb-2 text-white">{label}</label>

      {/* white box ONLY around the input + dropdown */}
      <div className="relative bg-white rounded-2xl shadow-md p-3">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="w-full rounded-xl px-4 py-3 text-sm text-black border border-gray-200 focus:outline-none"
          placeholder={placeholder}
        />

        {open && results.length > 0 && (
          <div className="absolute left-0 right-0 z-20 mt-2 rounded-xl bg-white text-black border border-gray-200 shadow-sm max-h-64 overflow-auto">
            {results.map((r) => (
              <button
                key={r.DestinationID}
                type="button"
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => {
                  setQuery(r.DestinationName);
                  setOpen(false);
                  onSelect?.(r);
                }}
              >
                {r.DestinationName}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
