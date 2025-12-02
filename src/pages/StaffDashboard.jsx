import { useState, useEffect } from "react";
import { MapPin } from "@phosphor-icons/react";
import { supabase } from "../utils/supabase";
import Timetable from "../components/Timetable";

const STATUS_META = {
  available: { label: "Available", bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  in_class: { label: "In Class", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  busy: { label: "Busy", bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  on_leave: { label: "On Leave", bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" },
};

const TITLE_OPTIONS = ["Mr", "Mrs", "Ms", "Dr", "Prof"];

export default function StaffDashboard() {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [staff, setStaff] = useState(null);

  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showTimetable, setShowTimetable] = useState(false);

  // ----------------------------------------------------------------
  // LOAD AUTH USER → PROFILE → STAFF
  // ----------------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) return;
      setAuthUser(user);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      // Fetch staff row
      const { data: staffData } = await supabase
        .from("staff")
        .select("*")
        .eq("profile_id", user.id)
        .single();

      setStaff(staffData);

      // Open setup automatically if dept missing
      if (!staffData?.dept || staffData.dept.trim() === "") {
        setShowSetup(true);
      }

      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!profile || !staff) return null;

  const meta = STATUS_META[staff.status] || STATUS_META.on_leave;

  // ----------------------------------------------------------------
  // UPDATE HELPERS
  // ----------------------------------------------------------------

  // UPDATE STATUS (manual override enabled)
  const updateStatus = async (value) => {
    setStaff((prev) => ({
      ...prev,
      status: value,
      manual_override: true,
    }));

    await supabase
      .from("staff")
      .update({ status: value, manual_override: true })
      .eq("id", staff.id);
  };

  // UPDATE LOCATION (manual override enabled)
  const updateLocation = async (value) => {
    setStaff((prev) => ({
      ...prev,
      location: value,
      manual_location: true,
    }));

    await supabase
      .from("staff")
      .update({ location: value, manual_location: true })
      .eq("id", staff.id);
  };

  // UPDATE GENERIC STAFF FIELD (for setup modal)
  const updateStaffField = async (field, value) => {
    setStaff((prev) => ({
      ...prev,
      [field]: value
    }));

    await supabase
      .from("staff")
      .update({ [field]: value })
      .eq("id", staff.id);
  };

  const updateProfileField = async (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));

    await supabase
      .from("profiles")
      .update({ [field]: value })
      .eq("id", profile.id);
  };

  // ----------------------------------------------------------------
  // UI
  // ----------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-10 pt-6">

      {/* Header */}
      <header className="max-w-full mx-auto mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Staff Dashboard</h1>

        <img
          onClick={() => setShowSetup(true)}
          src={staff.photo_url || "/profile-icon.png"}
          className="w-12 h-12 rounded-full object-cover shadow cursor-pointer hover:scale-105 transition"
        />
      </header>

      <main className="max-w-3xl mx-auto space-y-6">

        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-5">
            <img
              src={staff.photo_url || "/profile-icon.png"}
              className="w-20 h-20 rounded-full object-cover"
            />

            <div>
              <h2 className="text-lg font-semibold text-gray-800">{staff.name}</h2>
              <p className="text-sm text-gray-500">
                {staff.designation || "No Designation"} — {staff.dept || "No Dept"}
              </p>

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
                onClick={() => updateStatus(key)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition 
                  ${staff.status === key ? "border-black bg-gray-100" : "border-gray-200 bg-white"}`}
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
            <span className="font-medium text-gray-700">{staff.location || "No location set"}</span>
          </div>

          <input
            type="text"
            value={staff.location || ""}
            onChange={(e) => updateLocation(e.target.value)}
            placeholder="Enter your room / block"
            className="w-full rounded-xl px-4 py-3 border border-gray-300 bg-gray-50 
             focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* Timetable Button */}
        <button
          onClick={() => setShowTimetable(true)}
          className="w-full py-3 bg-black text-white rounded-xl font-medium shadow-md"
        >
          Add / Edit Timetable
        </button>
      </main>

      {/* Setup Modal */}
      {showSetup && (
        <SetupModal
          staff={staff}
          profile={profile}
          updateStaff={updateStaffField}
          updateProfile={updateProfileField}
          onClose={() => setShowSetup(false)}
        />
      )}

      {/* Timetable Modal */}
      {showTimetable && (
        <Timetable
          staffId={staff.id}
          onClose={() => setShowTimetable(false)}
        />
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
   SETUP MODAL
-------------------------------------------------------------------------- */

function SetupModal({ staff, profile, updateStaff, updateProfile, onClose }) {
  const initialTitle = TITLE_OPTIONS.includes(staff.name.split(" ")[0])
    ? staff.name.split(" ")[0]
    : "Dr";

  const [title, setTitle] = useState(initialTitle);
  const [name, setName] = useState(staff.name.replace(initialTitle, "").trim());
  const [dept, setDept] = useState(staff.dept || "");
  const [designation, setDesignation] = useState(staff.designation || "");
  const [phone, setPhone] = useState(profile.phone || "");

  const save = async () => {
    const fullName = `${title} ${name}`.trim();

    await updateStaff("name", fullName);
    await updateStaff("dept", dept);
    await updateStaff("designation", designation);

    await updateProfile("name", fullName);
    await updateProfile("phone", phone);

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow">
        <h2 className="text-lg font-semibold mb-4">Complete Your Profile</h2>

        <div className="space-y-4">

          {/* Title */}
          <select
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-gray-50"
          >
            {TITLE_OPTIONS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          {/* Name */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-gray-50"
          />

          {/* Phone */}
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone Number"
            className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-gray-50"
          />

          {/* Designation */}
          <input
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="Designation (Assistant Professor, HOD CSE)"
            className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-gray-50"
          />

          {/* Department */}
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-gray-50"
          >
            <option value="">Select Department</option>
            {["CSE", "ECE", "EEE", "ME", "CE", "BSH", "CY", "AD", "MR", "RA", "OFFICE"].map((d) => (
              <option value={d} key={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={save}
            className="px-4 py-2 bg-black text-white rounded-xl"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
