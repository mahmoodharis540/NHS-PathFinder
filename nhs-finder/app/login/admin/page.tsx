"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
import ManagePathsSection from "@/components/ManagePathsSection";

type Building = {
  BuildingID: number;
  BuildingName: string;
};

function moveItem<T>(arr: T[], from: number, to: number) {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export default function StaffPortalPage() {
  const [tab, setTab] = useState<"upload" | "manage">("upload");
  const router = useRouter();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);

  // Form state
  const [buildingId, setBuildingId] = useState<string>("");
  const [pathName, setPathName] = useState("");
  const [startName, setStartName] = useState("");
  const [endName, setEndName] = useState("");
  const [description, setDescription] = useState("");
  const [accessible, setAccessible] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string>("");

  // drag reorder state
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadBuildings = async () => {
      setLoadingBuildings(true);
      setMessage("");
      try {
        const res = await fetch("/api/buildings");
        const text = await res.text();
        if (!res.ok) throw new Error(text);
        const data: Building[] = JSON.parse(text);
        setBuildings(data);
      } catch (e: any) {
        setMessage(e?.message ?? "Failed to load buildings.");
      } finally {
        setLoadingBuildings(false);
      }
    };

    loadBuildings();
  }, []);

  const canSubmit = useMemo(() => {
    return (
      !!buildingId &&
      pathName.trim().length > 0 &&
      startName.trim().length > 0 &&
      endName.trim().length > 0 &&
      files.length > 0 &&
      !isSaving
    );
  }, [buildingId, pathName, startName, endName, files.length, isSaving]);

  const openFilePicker = () => fileInputRef.current?.click();

  const addFiles = (incoming: FileList | File[]) => {
    const next = Array.from(incoming);
    setFiles((prev) => [...prev, ...next]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    setFiles((prev) => moveItem(prev, idx, idx - 1));
  };

  const moveDown = (idx: number) => {
    if (idx >= files.length - 1) return;
    setFiles((prev) => moveItem(prev, idx, idx + 1));
  };

  const submit = async (statusType: "Active" | "Draft") => {
    setMessage("");
    setIsSaving(true);

    try {
      const fd = new FormData();
      fd.append("buildingId", buildingId);
      fd.append("pathName", pathName.trim());
      fd.append("startName", startName.trim());
      fd.append("endName", endName.trim());
      fd.append("description", description.trim());
      fd.append("statusType", statusType);
      fd.append("accessToggle", accessible ? "1" : "0");

      // store date as YYYY-MM-DD
      const d = new Date();
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      fd.append("date", date);

      // Order preserved
      for (const f of files) fd.append("files", f);

      const res = await fetch("/api/admin/path", {
        method: "POST",
        body: fd,
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      setMessage(statusType === "Draft" ? "Saved draft to database ✅" : "Uploaded path to database ✅");

      // reset
      setPathName("");
      setStartName("");
      setEndName("");
      setDescription("");
      setAccessible(false);
      setFiles([]);
    } catch (e: any) {
      setMessage(e?.message ?? "Upload failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#003087] text-white px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-xl select-none hover:opacity-80 transition"
            aria-label="Go to main page"
          >
            ←
          </button>

          <div>
            <h1 className="text-2xl font-semibold">Staff Portal</h1>
            <p className="text-sm opacity-80">Path Management System</p>
          </div>
        </div>

        <Link href="/settings" className="bg-white text-[#003087] p-2 rounded-full hover:bg-gray-100 transition">
          <Settings className="h-5 w-5" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="px-8 mt-6">
        <div className="flex gap-4">
          <button
            onClick={() => setTab("upload")}
            className={`px-6 py-2 rounded-full text-sm font-medium ${
              tab === "upload" ? "bg-black text-white" : "bg-gray-200 text-gray-900 hover:bg-gray-300"
            }`}
          >
            Upload Paths
          </button>

          <button
            onClick={() => setTab("manage")}
            className={`px-6 py-2 rounded-full text-sm font-medium ${
              tab === "manage" ? "bg-black text-white" : "bg-gray-200 text-gray-900 hover:bg-gray-300"
            }`}
          >
            Manage Paths
          </button>
        </div>
      </div>

      {/* Upload Section */}
      {tab === "upload" && (
        <div className="px-8 mt-6">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-semibold mb-2">Upload New Path</h2>
            <p className="text-gray-500 mb-6">Upload navigation paths for patients to follow within hospital buildings</p>

            {message && (
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">
                {message}
              </div>
            )}

            {/* Select Building */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Building</label>
              <select
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              >
                <option value="">{loadingBuildings ? "Loading buildings..." : "Choose a building"}</option>
                {buildings.map((b) => (
                  <option key={b.BuildingID} value={String(b.BuildingID)}>
                    {b.BuildingName}
                  </option>
                ))}
              </select>
            </div>

            {/* Path Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Path Name</label>
              <input
                value={pathName}
                onChange={(e) => setPathName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                placeholder="e.g., Main Entrance to Cardiology"
              />
            </div>

            {/* Start & End Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Point</label>
                <input
                  value={startName}
                  onChange={(e) => setStartName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                  placeholder="e.g., Main Entrance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Point</label>
                <input
                  value={endName}
                  onChange={(e) => setEndName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                  placeholder="e.g., Cardiology - Room 301"
                />
              </div>
            </div>

            {/* Accessible toggle */}
            <div className="mb-6 flex items-center gap-3">
              <input
                id="accessible"
                type="checkbox"
                checked={accessible}
                onChange={(e) => setAccessible(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="accessible" className="text-sm">
                Accessible route (avoid stairs) / AccessToggle
              </label>
            </div>

            {/* Upload Box */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.currentTarget.value = "";
              }}
            />

            <div
              role="button"
              tabIndex={0}
              onClick={openFilePicker}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openFilePicker();
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-500 mb-4 cursor-pointer hover:bg-gray-50 transition"
            >
              <p className="text-3xl mb-2">📁</p>
              <p className="text-sm">Click to upload or drag and drop</p>
              <p className="text-xs mt-1">Then reorder the list below before uploading</p>
            </div>

            {/* Reorder list */}
            {files.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Files order (drag to reorder)</p>
                  <p className="text-xs text-gray-500">Top = first step</p>
                </div>

                <div className="space-y-2">
                  {files.map((f, idx) => (
                    <div
                      key={`${f.name}-${f.size}-${idx}`}
                      draggable
                      onDragStart={() => setDragIndex(idx)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragIndex === null || dragIndex === idx) return;
                        setFiles((prev) => moveItem(prev, dragIndex, idx));
                        setDragIndex(null);
                      }}
                      onDragEnd={() => setDragIndex(null)}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm bg-white border-gray-200"
                      title="Drag to reorder"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-gray-400 select-none">☰</span>
                        <span className="text-gray-500 w-6 text-right select-none">{idx + 1}.</span>
                        <div className="min-w-0">
                          <div className="truncate">{f.name}</div>
                          <div className="text-xs text-gray-400">{Math.round(f.size / 1024)} KB</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveUp(idx)}
                          className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                          disabled={idx === 0}
                          aria-label="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDown(idx)}
                          className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                          disabled={idx === files.length - 1}
                          aria-label="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-red-600 hover:underline ml-2"
                        >
                          remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Media Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Media Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm min-h-[100px]"
                placeholder="Optional notes for these media items..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                disabled={!canSubmit}
                onClick={() => submit("Active")}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition ${
                  canSubmit ? "bg-[#003087] text-white hover:bg-blue-800" : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isSaving ? "Saving..." : "Upload Path"}
              </button>

              <button
                disabled={!canSubmit}
                onClick={() => submit("Draft")}
                className={`flex-1 py-3 rounded-lg text-sm transition ${
                  canSubmit
                    ? "bg-gray-100 border border-gray-300 hover:bg-gray-200"
                    : "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isSaving ? "Saving..." : "Save as Draft"}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "manage" && <ManagePathsSection />}
    </div>
  );
}
