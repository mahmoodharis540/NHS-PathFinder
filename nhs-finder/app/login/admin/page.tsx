"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
import ManagePathsSection from "@/components/ManagePathsSection";

type Building = { BuildingID: number; BuildingName: string };
type Status = { StatusID: number; StatusType: string };
type Destination = {
  DestinationID: number;
  DestinationName: string;
  BuildingID: number;
  isEntrance: number;
};

export default function StaffPortalPage() {
  const [tab, setTab] = useState<"upload" | "manage">("upload");
  const router = useRouter();

  // dropdown data
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);

  // form state (IDs for DB)
  const [BuildingID, setBuildingID] = useState<number | "">("");
  const [PathName, setPathName] = useState("");
  const [Start, setStart] = useState<number | "">("");
  const [End, setEnd] = useState<number | "">("");
  const [StatusID, setStatusID] = useState<number | "">("");
  const [AccessToggle, setAccessToggle] = useState<number>(0);

  // ✅ renamed from `Date` to avoid colliding with global Date()
  const [pathDate, setPathDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Searchable input text for Start/End
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showEndDropdown, setShowEndDropdown] = useState(false);

  // Optional extras (not in DB yet)
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load buildings + statuses once
  useEffect(() => {
    (async () => {
      try {
        const [b, s] = await Promise.all([
          fetch("/api/buildings").then((r) => r.json()),
          fetch("/api/statuses").then((r) => r.json()),
        ]);

        setBuildings(Array.isArray(b) ? b : []);
        setStatuses(Array.isArray(s) ? s : []);

        // set default status if available and not chosen yet
        if (Array.isArray(s) && s.length && StatusID === "") {
          setStatusID(s[0].StatusID);
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load dropdown data.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load destinations when building changes
  useEffect(() => {
    (async () => {
      if (BuildingID === "") {
        setDestinations([]);
        setStart("");
        setEnd("");
        setStartText("");
        setEndText("");
        return;
      }

      try {
        const d = await fetch(`/api/destinations?buildingId=${BuildingID}`).then(
          (r) => r.json()
        );
        setDestinations(Array.isArray(d) ? d : []);
        // clear previous selections when switching building
        setStart("");
        setEnd("");
        setStartText("");
        setEndText("");
      } catch (e) {
        console.error(e);
        setError("Failed to load destinations.");
      }
    })();
  }, [BuildingID]);

  const filteredStart = useMemo(() => {
    const q = startText.trim().toLowerCase();
    if (!q) return destinations.slice(0, 50);
    return destinations
      .filter((d) => d.DestinationName.toLowerCase().includes(q))
      .slice(0, 50);
  }, [destinations, startText]);

  const filteredEnd = useMemo(() => {
    const q = endText.trim().toLowerCase();
    if (!q) return destinations.slice(0, 50);
    return destinations
      .filter((d) => d.DestinationName.toLowerCase().includes(q))
      .slice(0, 50);
  }, [destinations, endText]);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setFiles(list);
  };

  const resetForm = () => {
    setPathName("");
    setStart("");
    setEnd("");
    setStartText("");
    setEndText("");
    setAccessToggle(0);
    setPathDate(new Date().toISOString().slice(0, 10));
    setFiles([]);
    setNotes("");
    setError(null);
    setSuccess(null);
    setShowStartDropdown(false);
    setShowEndDropdown(false);
  };

  const onUploadPath = async () => {
    setError(null);
    setSuccess(null);

    if (
      BuildingID === "" ||
      StatusID === "" ||
      !PathName.trim() ||
      Start === "" ||
      End === ""
    ) {
      setError("Please fill: Building, Path Name, Start, End, Status.");
      return;
    }

    if (Start === End) {
      setError("Start and End cannot be the same destination.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          PathName: PathName.trim(),
          BuildingID,
          Start,
          End,
          StatusID,
          AccessToggle,
          Date: pathDate, // matches schema field `Date`
          // notes/files not saved yet (schema doesn't include them)
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to upload path.");
        return;
      }

      setSuccess("Path uploaded successfully.");
      setTab("manage");
      resetForm();
    } catch (e) {
      console.error(e);
      setError("Server error while uploading path.");
    } finally {
      setIsSubmitting(false);
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

        <Link
          href="/settings"
          className="bg-white text-[#003087] p-2 rounded-full hover:bg-gray-100 transition"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="px-8 mt-6">
        <div className="flex gap-4">
          <button
            onClick={() => setTab("upload")}
            className={`px-6 py-2 rounded-full text-sm font-medium ${
              tab === "upload"
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-900 hover:bg-gray-300"
            }`}
          >
            Upload Paths
          </button>

          <button
            onClick={() => setTab("manage")}
            className={`px-6 py-2 rounded-full text-sm font-medium ${
              tab === "manage"
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-900 hover:bg-gray-300"
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
            <p className="text-gray-500 mb-6">
              Upload navigation paths for patients to follow within hospital
              buildings
            </p>

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            {success && <p className="mb-4 text-sm text-green-700">{success}</p>}

            {/* Select Building */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Select Building
              </label>
              <select
                value={BuildingID}
                onChange={(e) =>
                  setBuildingID(e.target.value ? Number(e.target.value) : "")
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              >
                <option value="">Choose a building</option>
                {buildings.map((b) => (
                  <option key={b.BuildingID} value={b.BuildingID}>
                    {b.BuildingName}
                  </option>
                ))}
              </select>
            </div>

            {/* Path Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Path Name</label>
              <input
                value={PathName}
                onChange={(e) => setPathName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                placeholder="e.g., Main Entrance to Cardiology"
              />
            </div>

            {/* Start & End Points (Searchable dropdown inputs) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Start */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  Start Point
                </label>
                <input
                  value={startText}
                  onChange={(e) => {
                    setStartText(e.target.value);
                    setShowStartDropdown(true);
                    setStart("");
                  }}
                  onFocus={() => setShowStartDropdown(true)}
                  onBlur={() => {
                    // delay closing so click registers
                    setTimeout(() => setShowStartDropdown(false), 120);
                  }}
                  disabled={BuildingID === ""}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                  placeholder={BuildingID === "" ? "Select a building first" : "Type to search..."}
                />

                {showStartDropdown && BuildingID !== "" && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow max-h-44 overflow-y-auto">
                    {filteredStart.length > 0 ? (
                      filteredStart.map((d) => (
                        <button
                          key={d.DestinationID}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setStart(d.DestinationID);
                            setStartText(d.DestinationName);
                            setShowStartDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          {d.DestinationName}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No matches found
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-1 text-xs text-gray-500">
                  Selected ID: {Start === "" ? "—" : Start}
                </p>
              </div>

              {/* End */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  End Point
                </label>
                <input
                  value={endText}
                  onChange={(e) => {
                    setEndText(e.target.value);
                    setShowEndDropdown(true);
                    setEnd("");
                  }}
                  onFocus={() => setShowEndDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => setShowEndDropdown(false), 120);
                  }}
                  disabled={BuildingID === ""}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                  placeholder={BuildingID === "" ? "Select a building first" : "Type to search..."}
                />

                {showEndDropdown && BuildingID !== "" && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow max-h-44 overflow-y-auto">
                    {filteredEnd.length > 0 ? (
                      filteredEnd.map((d) => (
                        <button
                          key={d.DestinationID}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setEnd(d.DestinationID);
                            setEndText(d.DestinationName);
                            setShowEndDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          {d.DestinationName}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No matches found
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-1 text-xs text-gray-500">
                  Selected ID: {End === "" ? "—" : End}
                </p>
              </div>
            </div>

            {/* Floors (kept as your original UI placeholders) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Start Floor
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm">
                  <option>Select floor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Floor</label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm">
                  <option>Select floor</option>
                </select>
              </div>
            </div>

            {/* Status + Accessible + Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={StatusID}
                  onChange={(e) =>
                    setStatusID(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                >
                  <option value="">Select status</option>
                  {statuses.map((s) => (
                    <option key={s.StatusID} value={s.StatusID}>
                      {s.StatusType}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Accessible Route
                </label>
                <select
                  value={AccessToggle}
                  onChange={(e) => setAccessToggle(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={pathDate}
                  onChange={(e) => setPathDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                />
              </div>
            </div>

            {/* Upload Box (kept, but functional file input) */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-500 mb-6">
              <p className="text-3xl mb-2">📁</p>
              <p className="text-sm">Click to upload or drag and drop</p>
              <p className="text-xs mt-1">
                Supported formats: JPEG, HEVC, MOV, PNG, MP4
              </p>

              <div className="mt-4">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={onPickFiles}
                  className="block w-full text-sm"
                />
                {files.length > 0 && (
                  <p className="mt-2 text-xs text-gray-600">
                    {files.length} file(s) selected
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Path Description (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm min-h-[100px]"
                placeholder="Add any additional notes or instructions for this path..."
              />
              <p className="mt-1 text-xs text-gray-500">
                (Not saved yet — your DB schema doesn’t have a Notes column.)
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={onUploadPath}
                disabled={isSubmitting}
                className="flex-1 bg-[#003087] text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-60"
              >
                {isSubmitting ? "Uploading..." : "Upload Path"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-100 border border-gray-300 py-3 rounded-lg text-sm hover:bg-gray-200 transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage tab */}
      {tab === "manage" && <ManagePathsSection />}
    </div>
  );
}
