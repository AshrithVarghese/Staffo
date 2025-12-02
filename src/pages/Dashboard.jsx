import { useState, useMemo, useEffect } from "react";
import { MagnifyingGlass, MapPin } from "@phosphor-icons/react";
import StaffPopup from "../components/StaffPopup.jsx";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";

const FILTERS = ["All", "OFFICE", "BSH", "CSE", "CY", "AD", "EEE", "ME", "CE", "ECE", "MR", "RA"];
const STATUS_META = {
  available: { label: "Available", bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  in_class: { label: "In Class", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  busy: { label: "Busy", bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  on_leave: { label: "On Leave", bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" },
};

export default function Dashboard() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState("All");
  const [selected, setSelected] = useState(null);
  const [staff, setStaff] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("staff").select("*");

      if (error) {
        console.error("Supabase error:", error);
        return;
      }

      const mapped = data.map((s) => ({
        ...s,
        avatar: s.photo_url,
      }));

      setStaff(mapped);
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      const matchFilter = active === "All" ? true : s.dept === active;
      const qLower = q.trim().toLowerCase();

      const matchQuery =
        !qLower ||
        s.name?.toLowerCase().includes(qLower) ||
        s.dept?.toLowerCase().includes(qLower) ||
        s.location?.toLowerCase().includes(qLower) ||
        s.designation?.toLowerCase().includes(qLower);

      return matchFilter && matchQuery;
    });
  }, [q, active, staff]);

  const handleViewMap = (staff) => {
    alert(`Open map for ${staff.name} — location: ${staff.location}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-8 pt-4">
      <header className="max-w-full mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/staffo.png"
            alt="Staffo"
            className="w-32 cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>

        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="3" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">

        {/* Search */}
        <div className="mb-4 max-w-full">
          <div className="relative">
            <MagnifyingGlass size={24} className="text-gray-500 absolute left-3.5 top-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for staff..."
              className="w-full rounded-xl py-3 pl-12 pr-4 shadow-sm border border-transparent 
                         focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-3 overflow-x-auto pb-3 mb-6 scrollbar-thin">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium shadow-sm cursor-pointer 
                ${active === f ? "bg-black text-white" : "bg-white text-gray-700"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Staff cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {filtered.map((s) => {
            const meta = STATUS_META[s.status] || STATUS_META["on_leave"];

            return (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="w-full text-left bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 
                           hover:shadow-md transition cursor-pointer"
              >
                <img
                  src={s.avatar}
                  alt={s.name}
                  onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/64")}
                  className="w-14 h-14 rounded-full object-cover shrink-0"
                />

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>

                      <div className="text-lg font-semibold text-gray-800 leading-tight">
                        {s.name}
                      </div>

                      {s.designation && (
                        <div className="text-sm text-gray-600">
                          {s.designation}
                        </div>
                      )}

                      <div className="text-sm text-gray-500">{s.dept}</div>
                    </div>

                    <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full ${meta.bg} shrink-0`}>
                      <span className={`text-xs font-medium ${meta.text} whitespace-nowrap`}>
                        {meta.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 items-center text-sm text-gray-500 gap-0.5 inline-flex">
                    <MapPin size={18} />
                    <span className="truncate max-w-xs">{s.location}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center text-gray-500 mt-6">
            No staff found.
          </div>
        )}
      </main>

      {/* Staff popup */}
      {selected && (
        <StaffPopup
          staff={{
            name: selected.name,
            dept: selected.dept,
            role: selected.role || "",
            avatar: selected.avatar,
            designation: selected.designation || "",
            status: selected.status,
            statusLabel: STATUS_META[selected.status]?.label,
            location: selected.location,
            room: selected.location?.split(",")[0] || "",
            block: selected.location?.split("Block")?.[1]?.trim() || "",
            schedule: selected.schedule,
          }}
          onClose={() => setSelected(null)}
          onViewMap={() => {
            handleViewMap(selected);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
