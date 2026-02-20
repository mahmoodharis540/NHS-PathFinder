"use client";

import { useMemo, useState } from "react";

type Building = {
  BuildingID: number;
  BuildingName: string;
};

export default function AdminBuildingSelect({
  buildings,
  value,
  onChange,
  onBuildingCreated,
  disabled,
}: {
  buildings: Building[];
  value: string;
  onChange: (val: string) => void;
  onBuildingCreated: (b: Building) => void;
  disabled?: boolean;
}) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  const canCreate = useMemo(() => {
    return newName.trim().length > 0 && !creating;
  }, [newName, creating]);

  const create = async () => {
    if (!canCreate) return;
    setCreating(true);
    setErr("");

    try {
      const res = await fetch("/api/admin/buildings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      const created: Building = JSON.parse(text);

      // add to list + select it
      onBuildingCreated(created);
      onChange(String(created.BuildingID));
      setNewName("");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create building");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Select Building</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
      >
        <option value="">{disabled ? "Loading buildings..." : "Choose a building (optional)"}</option>
        {buildings.map((b) => (
          <option key={b.BuildingID} value={String(b.BuildingID)}>
            {b.BuildingName}
          </option>
        ))}
      </select>

      <div className="mt-3 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm"
          placeholder='Add new building e.g. "New Radiography Building"'
        />
        <button
          type="button"
          onClick={create}
          disabled={!canCreate}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            canCreate ? "bg-[#003087] text-white hover:bg-blue-800" : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          {creating ? "Adding..." : "Add"}
        </button>
      </div>

      {err && <p className="text-xs text-red-600 mt-2 whitespace-pre-wrap">{err}</p>}
    </div>
  );
}
