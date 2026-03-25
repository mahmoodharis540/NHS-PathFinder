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

  value,
  onChangeText,

  labelClassName,
}: {
  label: string;
  placeholder: string;
  apiUrl: string; 
  onSelect?: (item: Item) => void;

  value?: string;
  onChangeText?: (text: string) => void;
  labelClassName?: string;
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(value ?? query, 250);

  const [results, setResults] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const run = async () => {
      const res = await fetch(`${apiUrl}?take=35&q=${encodeURIComponent(debounced)}`);
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      setResults(JSON.parse(text));
    };

    run().catch(() => setResults([]));
  }, [apiUrl, debounced]);

  const displayValue = value ?? query;

  return (
    <div className="w-full max-w-lg">
      <label className={`block text-sm mb-2 ${labelClassName ?? "text-white"}`}>{label}</label>

      <div className="relative rounded-2xl bg-white p-3 shadow-md dark:bg-slate-900">
        <input
          value={displayValue}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            onChangeText?.(next);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          placeholder={placeholder}
        />

        {open && results.length > 0 && (
          <div className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            {results.map((r) => (
              <button
                key={r.DestinationID}
                type="button"
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-800"
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => {
                  setQuery(r.DestinationName);
                  onChangeText?.(r.DestinationName);
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
