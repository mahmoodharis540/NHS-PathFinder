import Link from "next/link";
import { Settings } from "lucide-react";

export default function StaffPortalPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-700 text-white px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-xl cursor-pointer">←</span>
          <div>
            <h1 className="text-2xl font-semibold">Staff Portal</h1>
            <p className="text-sm opacity-80">Path Management System</p>
          </div>
        </div>
        <Link
            href="/settings"
            className="bg-white text-blue-700 p-2 rounded-full hover:bg-gray-100 transition"
            >
            <Settings className="h-5 w-5" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="px-8 mt-6">
        <div className="flex gap-4">
          <button className="bg-black px-6 py-2 rounded-full shadow text-sm font-medium">
            Upload Paths
          </button>
          <button className="bg-gray-200 px-6 py-2 rounded-full text-sm">
            Manage Paths
          </button>
        </div>
      </div>

      {/* Main Card */}
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
            <button className="flex-1 bg-blue-700 text-white py-3 rounded-lg text-sm font-medium">
              Upload Path
            </button>

            <button className="flex-1 bg-gray-100 border border-gray-300 py-3 rounded-lg text-sm">
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
            <p className="text-sm text-gray-500 mt-1">Total Paths</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <h3 className="text-3xl font-semibold text-green-600">18</h3>
            <p className="text-sm text-gray-500 mt-1">Active Paths</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <h3 className="text-3xl font-semibold text-amber-500">6</h3>
            <p className="text-sm text-gray-500 mt-1">Draft Paths</p>
          </div>
        </div>
      </div>
    </div>
  );
}
