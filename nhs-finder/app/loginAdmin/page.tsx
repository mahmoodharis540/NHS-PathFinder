"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Settings,
  Map,
  Pencil,
  Download,
  Trash2,
  Building2,
  MapPin,
  CalendarDays,
} from "lucide-react";

export default function StaffPortalPage() {
  const [tab, setTab] = useState("upload");

  // Manage Paths UI state
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Mock data (swap for DB later)
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
      {
        id: "4",
        name: "Main Entrance to Radiology",
        building: "St Thomas' Hospital",
        routeSummary: "Ground to Basement 1",
        date: "2026-02-08",
        status: "Active",
      },
    ],
    []
  );

  const buildings = useMemo(() => {
    const unique = [...new Set(paths.map((p) => p.building))];
    return unique.sort();
  }, [paths]);

  const filteredPaths = useMemo(() => {
    const s = search.trim().toLowerCase();

    return paths.filter((p) => {
      const matchesSearch =
        !s ||
        p.name.toLowerCase().includes(s) ||
        p.building.toLowerCase().includes(s) ||
        p.routeSummary.toLowerCase().includes(s);

      const matchesBuilding =
        !buildingFilter || p.building === buildingFilter;

      const matchesStatus = !statusFilter || p.status === statusFilter;

      return matchesSearch && matchesBuilding && matchesStatus;
    });
  }, [paths, search, buildingFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-700 text-white px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-xl cursor-pointer">←</span>
          <div>
            <h1 className="text-2xl font-semibold">Staff Portal</h1>
            <p className="text-black opacity-80">Path Management System</p>
          </div>
        </div>

        {/* Keep original settings icon button */}
        <Link
          href="/settings"
          className="bg-white text-blue-700 p-2 rounded-full hover:bg-gray-100 transition"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="px-8 mt-6">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`px-6 py-2 rounded-full shadow text-black font-medium ${
              tab === "upload"
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-900 hover:bg-gray-300"
            }`}
          >
            Upload Paths
          </button>

          <button
            type="button"
            onClick={() => setTab("manage")}
            className={`px-6 py-2 rounded-full text-black ${
              tab === "manage"
                ? "bg-black text-white shadow font-medium"
                : "bg-gray-200 text-gray-900 hover:bg-gray-300"
            }`}
          >
            Manage Paths
          </button>
        </div>
      </div>

      {/* Upload Paths View (your original code kept) */}
      {tab === "upload" && (
        <>
          {/* Main Card */}
          <div className="px-8 mt-6">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-xl font-semibold mb-2">Upload New Path</h2>
              <p className="text-gray-500 mb-6">
                Upload navigation paths for patients to follow within hospital
                buildings
              </p>

              {/* Select Building */}
              <div className="mb-4">
                <label className="block text-black font-medium mb-2">
                  Select Building
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black">
                  <option>Choose a building</option>
                </select>
              </div>

              {/* Path Name */}
              <div className="mb-4">
                <label className="block text-black font-medium mb-2">
                  Path Name
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black"
                  placeholder="e.g., Main Entrance to Cardiology"
                />
              </div>

              {/* Start & End Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-black font-medium mb-2">
                    Start Point
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black"
                    placeholder="e.g., Main Entrance"
                  />
                </div>

                <div>
                  <label className="block text-black font-medium mb-2">
                    End Point
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black"
                    placeholder="e.g., Cardiology - Room 301"
                  />
                </div>
              </div>

              {/* Floors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-black font-medium mb-2">
                    Start Floor
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black">
                    <option>Select floor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-black font-medium mb-2">
                    End Floor
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black">
                    <option>Select floor</option>
                  </select>
                </div>
              </div>

              {/* Upload Box */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-500 mb-6">
                <p className="text-3xl mb-2">📁</p>
                <p className="text-black">Click to upload or drag and drop</p>
                <p className="text-xs mt-1">
                  Supported formats: JPEG, HVEC, MOV, PNG, MP4
                </p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-black font-medium mb-2">
                  Path Description (Optional)
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black min-h-[100px]"
                  placeholder="Add any additional notes or instructions for this path..."
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button className="flex-1 bg-blue-700 text-white py-3 rounded-lg text-black font-medium hover:bg-blue-800 transition">
                  Upload Path
                </button>

                <button className="flex-1 bg-gray-100 border border-gray-300 py-3 rounded-lg text-black hover:bg-gray-200 transition">
                  Save as Draft
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="px-8 mt-8 pb-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <h3 className="text-3xl font-semibold text-blue-700">24</h3>
                <p className="text-black text-gray-500 mt-1">Total Paths</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <h3 className="text-3xl font-semibold text-green-600">18</h3>
                <p className="text-black text-gray-500 mt-1">Active Paths</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <h3 className="text-3xl font-semibold text-amber-500">6</h3>
                <p className="text-black text-gray-500 mt-1">Draft Paths</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Manage Paths View */}
      {tab === "manage" && (
        <div className="px-8 mt-6 pb-10">
          {/* Search + Filters Row */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-black"
                placeholder="Search paths..."
              />

              <select
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                className="w-full md:w-56 border border-gray-200 rounded-lg px-4 py-3 text-black bg-white"
              >
                <option value="">Filter by building</option>
                {buildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-56 border border-gray-200 rounded-lg px-4 py-3 text-black bg-white"
              >
                <option value="">Filter by status</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Uploaded Paths List */}
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Map className="h-5 w-5 text-blue-700" />
              <h2 className="text-base font-semibold">Uploaded Paths</h2>
            </div>

            <div className="space-y-4">
              {filteredPaths.map((p) => (
                <div
                  key={p.id}
                  className="border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  {/* Left */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-black font-semibold">{p.name}</h3>

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

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-black text-gray-600">
                      <span className="inline-flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {p.building}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {p.routeSummary}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {p.date}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button className="inline-flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-black hover:bg-gray-50">
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      <button className="inline-flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-black hover:bg-gray-50">
                        <Download className="h-4 w-4" />
                        Export
                      </button>
                      <button className="inline-flex items-center gap-2 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-black hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredPaths.length === 0 && (
                <div className="text-black text-gray-500 border border-dashed border-gray-300 rounded-xl p-8 text-center">
                  No paths match your filters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
