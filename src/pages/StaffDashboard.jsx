import { useState } from "react";
import { MapPin } from "@phosphor-icons/react";

const STATUS_META = {
  available: { label: "Available", bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  in_class: { label: "In Class", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  busy: { label: "Busy", bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  on_leave: { label: "On Leave", bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" },
};

// Dummy staff profile (replace with Supabase later)
const DEFAULT_STAFF = {
  id: "staff-01",
  name: "Dr. Evelyn Reed",
  dept: "CSE",
  role: "Professor",
  avatar: "/profile-icon.png",
  status: "available",
  location: "Room 402, Block C",
};

export default function StaffDashboard() {
  const [staff, setStaff] = useState(DEFAULT_STAFF);

  const updateField = (field, value) => {
    setStaff((prev) => ({ ...prev, [field]: value }));
  };

  const meta = STATUS_META[staff.status] || STATUS_META.available;

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-10 pt-6">
      {/* Header */}
      <header className="max-w-full mx-auto mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Staff Dashboard</h1>
        <img
          src={staff.avatar}
          alt={staff.name}
          className="w-12 h-12 rounded-full object-cover shadow"
        />
      </header>

      <main className="max-w-3xl mx-auto space-y-6">

        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-5">
            <img
              src={staff.avatar}
              alt={staff.name}
              className="w-20 h-20 rounded-full object-cover shadow-sm"
            />

            <div>
              <h2 className="text-lg font-semibold text-gray-800">{staff.name}</h2>
              <p className="text-sm text-gray-500">{staff.dept} Dept — {staff.role}</p>

              <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full ${meta.bg}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                <span className={`text-sm font-medium ${meta.text}`}>{meta.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Editor */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Status</h3>

          <div className="grid grid-cols-2 gap-4">
            {Object.entries(STATUS_META).map(([key, m]) => (
              <button
                key={key}
                onClick={() => updateField("status", key)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-xl 
                  border transition 
                  ${staff.status === key ? "border-black bg-gray-100" : "border-gray-200 bg-white"}
                `}
              >
                <span className={`w-3 h-3 rounded-full ${m.dot}`} />
                <span className="text-sm font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Location Editor */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Location</h3>

          <div className="flex items-center gap-3 mb-3">
            <MapPin size={20} className="text-black" />
            <span className="font-medium text-gray-700">{staff.location}</span>
          </div>

          <input
            type="text"
            value={staff.location}
            onChange={(e) => updateField("location", e.target.value)}
            placeholder="Enter your room / block"
            className="w-full rounded-xl px-4 py-3 border border-gray-300 bg-gray-50 
                       focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* Department Editor */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Department</h3>

          <select
            value={staff.dept}
            onChange={(e) => updateField("dept", e.target.value)}
            className="w-full rounded-xl px-4 py-3 border border-gray-300 bg-gray-50 
                       focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="ME">ME</option>
            <option value="CE">CE</option>
            <option value="BSH">BSH</option>
            <option value="RA">RA</option>
            <option value="CY">CY</option>
            <option value="AD">AD</option>
            <option value="MR">MR</option>
            <option value="OFFICE">OFFICE</option>
          </select>
        </div>

        {/* Save Button (dummy) */}
        <button
          onClick={() => alert("Saved (dummy). Connect to Supabase later.")}
          className="w-full py-3 bg-black text-white rounded-xl font-medium shadow-md"
        >
          Save Changes
        </button>
      </main>
    </div>
  );
}

