"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
import ManagePathsSection from "@/components/ManagePathsSection";

export default function StaffPortalPage() {
  const [tab, setTab] = useState("upload");
  const router = useRouter();

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

      {/* Upload Section (Your Original Code) */}
      {tab === "upload" && (
        <>
          <div className="px-8 mt-6">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-xl font-semibold mb-2">Upload New Path</h2>
              <p className="text-gray-500 mb-6">
                Upload navigation paths for patients to follow within hospital buildings
              </p>

              {/* Select Building */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Select Building
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm">
                  <option>Choose a building</option>
                </select>
              </div>

              {/* Path Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Path Name
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                  placeholder="e.g., Main Entrance to Cardiology"
                />
              </div>

              {/* Start & End Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Point
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                    placeholder="e.g., Main Entrance"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    End Point
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                    placeholder="e.g., Cardiology - Room 301"
                  />
                </div>
              </div>

              {/* Floors */}
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
                  <label className="block text-sm font-medium mb-2">
                    End Floor
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm">
                    <option>Select floor</option>
                  </select>
                </div>
              </div>

              {/* Upload Box */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-500 mb-6">
                <p className="text-3xl mb-2">📁</p>
                <p className="text-sm">Click to upload or drag and drop</p>
                <p className="text-xs mt-1">
                  Supported formats: JPEG, HVEC, MOV, PNG, MP4
                </p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Path Description (Optional)
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm min-h-[100px]"
                  placeholder="Add any additional notes or instructions for this path..."
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button className="flex-1 bg-[#003087] text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-800 transition">
                  Upload Path
                </button>

                <button className="flex-1 bg-gray-100 border border-gray-300 py-3 rounded-lg text-sm hover:bg-gray-200 transition">
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {tab === "manage" && <ManagePathsSection />}
    </div>
  );
}
