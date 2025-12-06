import { useState, useMemo, useEffect } from "react";
import { MagnifyingGlass, MapPin, Bug, SignOut } from "@phosphor-icons/react";
import StaffPopup from "../components/StaffPopup.jsx";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";

const FILTERS = ["All", "OFFICE", "BSH", "CSE", "CY", "AD", "EEE", "ME", "CE", "ECE", "MR", "RA"];
const STATUS_META = {
  available: { label: "Available", bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  in_class: { label: "In Class", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  busy: { label: "Busy", bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  on_leave: { label: "On Leave", bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" },
  in_meeting: { label: "In Meeting", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
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

  const handleMail = () => {
    const recipients = "ashrithvarghese.cs24@jecc.ac.in,abhishekkrishnaam.cs24@jecc.ac.in";
    const subject = encodeURIComponent("Bug Report - Staffo");
    const body = encodeURIComponent("Describe the issue here:\n\n\n\n• What is the issue?\n\n• Do you have any solution for the issue?\n\n\n");

    window.location.href = `mailto:${recipients}?subject=${subject}&body=${body}`;
  };

  const handleSignOut = () =>{
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-50 pt-4">
      <header className="max-w-full mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/staffo.png"
            alt="Staffo"
            className="w-32 cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>

        <div className="flex items-center gap-1">
          <div
            className="rounded-full bg-black flex items-center justify-center px-2 py-1 mt-3 text-white cursor-pointer"
            onClick={handleMail}
          >
            <Bug size={18} />
            <p className="m-1 text-xs">Report Issue</p>
          </div>

          <div className="rounded-full bg-black border-t border-gray-200 z-50 p-1 flex mt-3 cursor-pointer" onClick={() => handleSignOut()}>
            <SignOut size={22} className="text-white" />
          </div>
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
            const meta = STATUS_META[s.status] || STATUS_META["available"];

            return (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="relative w-full text-left bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex items-start gap-4"
              >
                {/* avatar */}
                <div className="shrink-0 h-full flex items-center">
                  <img
                    src={s.photo_url || "/profile-icon.png"}
                    alt={s.name}
                    onError={(e) => (e.currentTarget.src = "/profile-icon.png")}
                    className="w-22 h-22 md:w-20 md:h-20  rounded-full object-cover shadow-sm"
                  />
                  {/* verified tick — positioned relative to avatar */}
                  <img
                    src="/bluetick.png"
                    alt="verified"
                    className="w-5 h-5 md:w-6 md:h-6 mt-18 ml-15 md:ml-12 absolute "
                  />
                </div>

                {/* main content — takes most of the horizontal space */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-base md:text-lg font-semibold text-gray-800 truncate">
                        {s.name}
                      </div>

                      {s.designation && (
                        <div className="text-sm text-gray-600 truncate">
                          {s.designation}
                        </div>
                      )}

                      <div className="text-sm text-gray-500 mt-1">{s.dept}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center text-sm text-gray-500 gap-0.5">
                    <MapPin size={18} />
                    <span className="truncate">{s.location || "N/A"}</span>
                  </div>

                  {/* mobile: show badge and map link below so they don't steal width */}
                  <div className="mt-3 absolute right-5 bottom-3.5 gap-3">
                    <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full ${meta.bg}`}>
                      <span className={`text-xs font-medium ${meta.text} whitespace-nowrap`}>{meta.label}</span>
                    </div>
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
          staff={selected}            // pass the full DB row object (contains id, photo_url, etc.)
          onClose={() => setSelected(null)}
          onViewMap={() => {
            handleViewMap(selected);
            setSelected(null);
          }}
        />
      )}

      <p className="fixed bottom-0 left-0 right-0 text-xs text-center text-gray-400 w-screen">Beta version</p>
    </div>
  );
}
