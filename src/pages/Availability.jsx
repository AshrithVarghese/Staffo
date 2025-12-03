import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlass, MapPin } from "@phosphor-icons/react";
import { supabase } from "../utils/supabase";

const FILTERS = ["All", "OFFICE", "BSH", "CSE", "CY", "AD", "EEE", "ME", "CE", "ECE", "MR", "RA"];

const PERIODS = [
  { value: 1, label: "1st Hour" },
  { value: 2, label: "2nd Hour" },
  { value: 3, label: "3rd Hour" },
  { value: 4, label: "4th Hour" },
  { value: 5, label: "5th Hour" },
  { value: 6, label: "6th Hour" },
  { value: 7, label: "7th Hour" },
];

// Helper: get today's day-name for timetable (Monday–Saturday)
function getTodayDayKey() {
  const idx = new Date().getDay(); // 0=Sun
  const map = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const name = map[idx];
  if (!name || name === "Sunday") return null; // no timetable on Sunday
  return name.toLowerCase(); // "monday", "tuesday", …
}

export default function Availability() {
  const [staff, setStaff] = useState([]);
  const [timetableMap, setTimetableMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [period, setPeriod] = useState(null);

  const dayKey = getTodayDayKey();

  // Load staff + timetable
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [staffRes, ttRes] = await Promise.all([
        supabase
          .from("staff")
          .select("id, name, dept, designation, status, location, photo_url")
          .order("name"),
        supabase
          .from("timetable")
          .select("staff_id, monday, tuesday, wednesday, thursday, friday, saturday"),
      ]);

      if (staffRes.error) console.error("Staff load error:", staffRes.error);
      if (ttRes.error) console.error("Timetable load error:", ttRes.error);

      setStaff(staffRes.data || []);

      const map = {};
      (ttRes.data || []).forEach((row) => {
        map[row.staff_id] = row;
      });
      setTimetableMap(map);

      setLoading(false);
    };

    load();
  }, []);

  const freeStaff = useMemo(() => {
    if (!period || !dayKey) return [];

    const q = search.trim().toLowerCase();

    return staff.filter((s) => {
      // Department filter
      if (deptFilter !== "All" && s.dept !== deptFilter) return false;

      // Search by name / dept / location
      const matchSearch =
        !q ||
        s.name?.toLowerCase().includes(q) ||
        s.dept?.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Timetable-based free check
      const t = timetableMap[s.id];

      // No timetable row → assume free
      if (!t) return true;

      const idx = period - 1;
      const daySlots = t[dayKey]; // e.g. t.monday, t.friday (array)

      // No slots array → assume free
      if (!Array.isArray(daySlots)) return true;

      const slot = daySlots[idx];

      // If slot is null/empty string → free
      const hasClass = typeof slot === "string" && slot.trim() !== "";
      return !hasClass;
    });
  }, [staff, timetableMap, deptFilter, search, period, dayKey]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-8 pt-4">
      {/* Header */}
      <header className="max-w-5xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/staffo.png"
            alt="Staffo"
            className="w-32 cursor-pointer"
            onClick={() => (window.location.href = "/")}
          />
        </div>
        <h1 className="text-xl font-semibold text-gray-800">Check Availability</h1>
      </header>

      <main className="max-w-5xl mx-auto space-y-5">
        {/* Controls */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlass size={22} className="text-gray-500 absolute left-3.5 top-2.5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, department, or location…"
              className="w-full rounded-xl py-2.5 pl-11 pr-4 shadow-sm border border-gray-200 
                         focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
            />
          </div>

          {/* Filters row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Period selector */}
            <div className="flex flex-col gap-1 w-full md:w-1/2">
              <label className="text-xs font-medium text-gray-600">Period (Today)</label>
              <select
                value={period || ""}
                onChange={(e) => setPeriod(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 
                           text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Select a period</option>
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Department filter chips */}
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 mb-1">Department (optional)</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setDeptFilter(f)}
                    className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium shadow-sm cursor-pointer 
                      ${deptFilter === f
                        ? "bg-black text-white"
                        : "bg-white text-gray-700 border border-gray-200"
                      }`}
                    type="button"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Day info */}
          {!dayKey && (
            <p className="text-xs text-red-500">
              Today is Sunday / outside teaching days — everyone is considered free.
            </p>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="bg-white rounded-2xl p-6 text-center text-gray-500 shadow">
            Loading…
          </div>
        ) : !period ? (
          <div className="bg-white rounded-2xl p-6 text-center text-gray-500 shadow">
            Select a period to see who is free.
          </div>
        ) : freeStaff.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-gray-500 shadow">
            No free staff found for this period.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {freeStaff.map((s) => (
              <div
                key={s.id}
                className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 
                           hover:shadow-md transition"
              >
                <img
                  src={s.photo_url || "/profile-icon.png"}
                  alt={s.name}
                  onError={(e) => (e.currentTarget.src = "/profile-icon.png")}
                  className="w-14 h-14 rounded-full object-cover shrink-0"
                />

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-gray-800 leading-tight">
                        {s.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {s.designation ? `${s.designation} • ` : ""}
                        {s.dept || "No Dept"}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                      Free this period
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin size={16} />
                    <span className="truncate">
                      {s.location || "No current location set"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

