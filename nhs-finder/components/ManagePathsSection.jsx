import { useMemo, useState } from "react";
import {
  Map,
  Pencil,
  Download,
  Trash2,
  Building2,
  MapPin,
  CalendarDays,
} from "lucide-react";

export default function ManagePathsSection() {
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const paths = useMemo(
    () => [
      {
        id: "1",
        name: "Main Entrance to Cardiology",
        building: "Royal London Hospital",
        routeSummary: "Ground to Floor 3",
        date: "2026-02-10",
        status: "Active",
      },
      {
        id: "2",
        name: "Reception to Emergency Ward",
        building: "Royal London Hospital",
        routeSummary: "Ground to Floor 1",
        date: "2026-02-12",
        status: "Active",
      },
      {
        id: "3",
        name: "Car Park B to Pediatrics",
        building: "Royal London Hospital",
        routeSummary: "Ground to Floor 2",
        date: "2026-02-13",
        status: "Draft",
      },
    ],
    []
  );

  const buildings = useMemo(() => {
    return [...new Set(paths.map((p) => p.building))];
  }, [paths]);

  const filteredPaths = useMemo(() => {
    const s = search.toLowerCase();

    return paths.filter((p) => {
      const matchesSearch =
        !s ||
        p.name.toLowerCase().includes(s) ||
        p.building.toLowerCase().includes(s);

      const matchesBuilding =
        !buildingFilter || p.building === buildingFilter;

      const matchesStatus =
        !statusFilter || p.status === statusFilter;

      return matchesSearch && matchesBuilding && matchesStatus;
    });
  }, [paths, search, buildingFilter, statusFilter]);

  return (
    <div className="px-8 mt-6 pb-10">
      {/* Search + Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm"
            placeholder="Search paths..."
          />

          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="w-full md:w-56 border border-gray-200 rounded-lg px-4 py-3 text-sm bg-white"
          >
            <option value="">Filter by building</option>
            {buildings.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-56 border border-gray-200 rounded-lg px-4 py-3 text-sm bg-white"
          >
            <option value="">Filter by status</option>
            <option>Active</option>
            <option>Draft</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Map className="h-5 w-5 text-blue-700" />
          <h2 className="text-base font-semibold">Uploaded Paths</h2>
        </div>

        <div className="space-y-4">
          {filteredPaths.map((p) => (
            <div
              key={p.id}
              className="border border-gray-200 rounded-xl p-5"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    p.status === "Active"
                      ? "bg-green-500 text-white"
                      : "bg-amber-500 text-white"
                  }`}
                >
                  {p.status}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {p.building}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {p.routeSummary}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {p.date}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex items-center gap-1 border px-3 py-2 rounded-lg text-sm">
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button className="flex items-center gap-1 border px-3 py-2 rounded-lg text-sm">
                  <Download className="h-4 w-4" />
                  Export
                </button>
                <button className="flex items-center gap-1 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}