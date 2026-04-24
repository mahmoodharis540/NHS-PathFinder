"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Map,
  Pencil,
  Download,
  Trash2,
  Building2,
  MapPin,
  CalendarDays,
  Accessibility,
} from "lucide-react";
import { useTranslations } from "next-intl";

type PathRow = {
  id: number | string;
  name: string;
  building: string;
  start?: string;
  end?: string;
  date?: string;
  status?: string;
  accessToggle?: number | boolean;
  buildingId?: number;
  startId?: number;
  endId?: number;
  statusId?: number;
};

type ManagePathsSectionProps = {
  onEditPath: (path: any) => void;
};

function toCsv(rows: PathRow[]) {
  const headers = ["id", "name", "building", "start", "end", "date", "status", "accessToggle"];
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return `"${s.replaceAll('"', '""')}"`;
  };

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [r.id, r.name, r.building, r.start ?? "", r.end ?? "", r.date ?? "", r.status ?? "", r.accessToggle ?? ""]
        .map(escape)
        .join(",")
    ),
  ];

  return lines.join("\n");
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ManagePathsSection({ onEditPath }: ManagePathsSectionProps) {
  const t = useTranslations("managePaths");

  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [onlyAccessible, setOnlyAccessible] = useState(false);

  const [paths, setPaths] = useState<PathRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadPaths = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/manage", { cache: "no-store" });
      const text = await res.text();

      if (!res.ok) {
        throw new Error(text || "Failed to load paths.");
      }

      const data: PathRow[] = JSON.parse(text);
      setPaths(data);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to load paths.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaths();
  }, []);

  const buildings = useMemo(() => {
    const list = [...new Set(paths.map((p) => p.building).filter(Boolean))];
    return list.sort((a, b) => a.localeCompare(b));
  }, [paths]);

  const statuses = useMemo(() => {
    const list = [...new Set(paths.map((p) => p.status ?? "").filter(Boolean))];
    return list.sort((a, b) => a.localeCompare(b));
  }, [paths]);

  const filteredPaths = useMemo(() => {
    const s = search.trim().toLowerCase();

    return paths.filter((p) => {
      const hay = `${p.name} ${p.building} ${p.start ?? ""} ${p.end ?? ""} ${p.status ?? ""}`.toLowerCase();

      const matchesSearch = !s || hay.includes(s);
      const matchesBuilding = !buildingFilter || p.building === buildingFilter;
      const matchesStatus = !statusFilter || (p.status ?? "") === statusFilter;

      const access = typeof p.accessToggle === "boolean" ? p.accessToggle : Number(p.accessToggle) === 1;
      const matchesAccessible = !onlyAccessible || access;

      return matchesSearch && matchesBuilding && matchesStatus && matchesAccessible;
    });
  }, [paths, search, buildingFilter, statusFilter, onlyAccessible]);

  const exportAll = () => {
    const csv = toCsv(filteredPaths);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(`paths-${stamp}.csv`, csv);
  };

  const exportOne = (p: PathRow) => {
    const csv = toCsv([p]);
    downloadText(`path-${p.id}.csv`, csv);
  };

  const deleteOne = async (id: PathRow["id"]) => {
    if (!confirm("Delete this path?")) return;

    setMessage("");

    try {
      const res = await fetch(`/api/manage/${id}`, { method: "DELETE" });
      const text = await res.text();

      if (!res.ok) {
        throw new Error(text || "Delete failed.");
      }

      setPaths((prev) => prev.filter((p) => String(p.id) !== String(id)));
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  const handleEdit = async (id: PathRow["id"]) => {
    setMessage("");

    try {
      const res = await fetch(`/api/manage/${id}`, {
        method: "GET",
        cache: "no-store",
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (!res.ok || !data?.ok || !data?.path) {
        throw new Error(data?.error || "Failed to load path.");
      }

      onEditPath(data.path);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to load path.");
    }
  };

  return (
    <div className="px-8 mt-6 pb-10">
      <div className="bg-white rounded-xl shadow-sm p-6">
        {message && (
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">
            {message}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm"
            placeholder={t("searchPlaceholder")}
          />

          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="w-full md:w-56 border border-gray-200 rounded-lg px-4 py-3 text-sm bg-white"
          >
            <option value="">{t("filterByBuilding")}</option>
            {buildings.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-56 border border-gray-200 rounded-lg px-4 py-3 text-sm bg-white"
          >
            <option value="">{t("filterByStatus")}</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "Active" ? t("active") : s === "Draft" ? t("draft") : s}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={onlyAccessible}
              onChange={(e) => setOnlyAccessible(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="inline-flex items-center gap-2">
              <Accessibility className="h-4 w-4" />
              Accessible only
            </span>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadPaths}
              className="border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={exportAll}
              className="border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              disabled={filteredPaths.length === 0}
            >
              Export filtered (CSV)
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-blue-700" />
            <h2 className="text-base font-semibold">
              {t("uploadedPaths")}{" "}
              <span className="text-sm font-normal text-gray-500">({filteredPaths.length})</span>
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-gray-600">Loading...</div>
        ) : filteredPaths.length === 0 ? (
          <div className="text-sm text-gray-600">No paths found.</div>
        ) : (
          <div className="space-y-4">
            {filteredPaths.map((p) => {
              const status = p.status ?? "Unknown";
              const isActive = status === "Active";
              const isDraft = status === "Draft";
              const routeSummary = `${p.start ?? "?"} → ${p.end ?? "?"}`;
              const access =
                typeof p.accessToggle === "boolean" ? p.accessToggle : Number(p.accessToggle) === 1;

              return (
                <div key={String(p.id)} className="border border-gray-200 rounded-xl p-5">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold truncate">{p.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">ID: {p.id}</p>
                    </div>

                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
                        isActive
                          ? "bg-green-500 text-white"
                          : isDraft
                          ? "bg-amber-500 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {isActive ? t("active") : isDraft ? t("draft") : status}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {p.building}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {routeSummary}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      {p.date ?? "—"}
                    </span>
                    {access && (
                      <span className="flex items-center gap-1 text-xs font-medium bg-gray-100 border border-gray-200 px-2 py-1 rounded-full">
                        <Accessibility className="h-4 w-4" />
                        Accessible
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(p.id)}
                      className="flex items-center gap-1 border px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
                    >
                      <Pencil className="h-4 w-4" />
                      {t("edit")}
                    </button>

                    <button
                      type="button"
                      onClick={() => exportOne(p)}
                      className="flex items-center gap-1 border px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4" />
                      {t("export")}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteOne(p.id)}
                      className="flex items-center gap-1 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("delete")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}