"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function AdminSearchDropdown({
  label,
  placeholder,
  apiUrl,
  buildingId, 
  isEntrance,
  value,
  onChangeText,
  onSelect,
  labelClassName,
}: {
  label: string;
  placeholder: string;
  apiUrl: string;
  buildingId: string; 
  isEntrance: 0 | 1;
  value: string;
  onChangeText: (text: string) => void;
  onSelect?: (item: Item) => void;
  labelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  const debounced = useDebouncedValue(value, 250);
  const trimmed = value.trim();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${apiUrl}?take=35&q=${encodeURIComponent(debounced)}`, {
          cache: "no-store",
        });
        const text = await res.text();
        if (!res.ok) throw new Error(text);
        const data = JSON.parse(text) as Item[];
        if (!cancelled) setResults(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!cancelled) {
          setResults([]);
          setErr(e?.message ?? "Failed to load results");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, debounced]);

  const exactMatch = useMemo(() => {
    const lower = trimmed.toLowerCase();
    return results.find((r) => r.DestinationName.toLowerCase() === lower) ?? null;
  }, [results, trimmed]);

  const canCreate = trimmed.length > 0 && !creating;

  const createOrSelect = async () => {
    setErr("");

    if (exactMatch) {
      onChangeText(exactMatch.DestinationName);
      onSelect?.(exactMatch);
      setOpen(false);
      return;
    }

    if (!canCreate) return;

    setCreating(true);
    try {
      const res = await fetch("/api/admin/destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          buildingId: buildingId ? Number(buildingId) : null, 
          isEntrance,
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      const created = JSON.parse(text) as Item;
      onChangeText(created.DestinationName);
      onSelect?.(created);

      setResults((prev) => {
        const already = prev.some((p) => p.DestinationID === created.DestinationID);
        return already ? prev : [created, ...prev];
      });

      setOpen(false);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create destination");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-full max-w-lg">
      <label className={`block text-sm mb-2 ${labelClassName ?? "text-gray-900"}`}>{label}</label>

      <div className="relative bg-white rounded-2xl shadow-md p-3">
        <input
          value={value}
          onChange={(e) => {
            onChangeText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="w-full rounded-xl px-4 py-3 text-sm text-black border border-gray-200 focus:outline-none"
          placeholder={placeholder}
        />

        {open && (
          <div className="absolute left-0 right-0 z-20 mt-2 rounded-xl bg-white text-black border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100">
              <button
                type="button"
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={createOrSelect}
                disabled={!canCreate && !exactMatch}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition ${
                  canCreate || exactMatch
                    ? "bg-[#003087] text-white hover:bg-blue-800"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {creating ? "Adding..." : exactMatch ? `Use existing "${exactMatch.DestinationName}"` : `Add "${trimmed || "..."}"`}
              </button>

              {!buildingId && (
                <p className="text-xs text-gray-500 mt-2">
                  No building selected — this new point will be attached to the first building in the database.
                </p>
              )}

              {err && <p className="text-xs text-red-600 mt-2 whitespace-pre-wrap">{err}</p>}
            </div>

            <div className="max-h-64 overflow-auto">
              {loading && <div className="px-4 py-3 text-sm text-gray-500">Loading...</div>}
              {!loading && results.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500">No matches.</div>
              )}

              {results.map((r) => (
                <button
                  key={r.DestinationID}
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => {
                    onChangeText(r.DestinationName);
                    onSelect?.(r);
                    setOpen(false);
                  }}
                >
                  {r.DestinationName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

