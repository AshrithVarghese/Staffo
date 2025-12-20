import { useState, useMemo, useEffect, useRef } from "react";
import { MagnifyingGlass, MapPin, Bug, SignOut, CircleNotch, DownloadSimpleIcon, List, X } from "@phosphor-icons/react";
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
  holiday: { label: "Holiday", bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  closed: { label: "College Closed", bg: "bg-slate-200", text: "text-slate-700", dot: "bg-slate-400" },
};

export default function Dashboard() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState("All");
  const [selected, setSelected] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("staff").select("*");
      if (error) console.error("Supabase error:", error);
      else setStaff(data || []);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel("public:staff")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff" }, (payload) => {
        if (payload.eventType === "INSERT") setStaff((prev) => [...prev, payload.new]);
        else if (payload.eventType === "UPDATE") {
          setStaff((prev) => prev.map((s) => (s.id === payload.new.id ? payload.new : s)));
          setSelected((prevSelected) => (prevSelected?.id === payload.new.id ? payload.new : prevSelected));
        } else if (payload.eventType === "DELETE") setStaff((prev) => prev.filter((s) => s.id !== payload.old.id));
      })
      .subscribe();

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      const matchFilter = active === "All" ? true : s.dept === active;
      const qLower = q.trim().toLowerCase();
      const matchQuery = !qLower ||
        s.name?.toLowerCase().includes(qLower) ||
        s.dept?.toLowerCase().includes(qLower) ||
        s.location?.toLowerCase().includes(qLower) ||
        s.designation?.toLowerCase().includes(qLower);
      return matchFilter && matchQuery;
    });
  }, [q, active, staff]);

  const handleMail = () => {
    const recipients = "ashrithvarghese.cs24@jecc.ac.in,abhishekkrishnaam.cs24@jecc.ac.in";
    const subject = encodeURIComponent("Bug Report - Staffo");
    const body = encodeURIComponent("Describe the issue here:\n\n\n\n• What is the issue?\n\n• Do you have any solution for the issue?\n\n\n");
    window.location.href = `mailto:${recipients}?subject=${subject}&body=${body}`;
    setMenuOpen(false);
  };

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-20 pt-4 font-sans">
      <header className="max-w-full mx-auto mb-6 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <img src="/staffo.png" alt="Staffo" className="w-32 cursor-pointer transition-transform active:scale-95" onClick={() => navigate("/")} />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          <div className="rounded-full bg-black flex items-center justify-center px-2 py-1 mt-3 text-white cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => navigate("/download")}>
            <DownloadSimpleIcon size={18} />
            <p className="m-1 text-xs">Download App</p>
          </div>
          <div className="rounded-full bg-black flex items-center justify-center px-2 py-1 mt-3 text-white cursor-pointer hover:bg-gray-800 transition-colors" onClick={handleMail}>
            <Bug size={18} />
            <p className="m-1 text-xs">Report Issue</p>
          </div>
          <div className="rounded-full bg-black border-t border-gray-200 z-50 p-1 flex mt-3 cursor-pointer hover:bg-gray-800 transition-colors" onClick={handleSignOut}>
            <SignOut size={22} className="text-white" />
          </div>
        </div>

        {/* Mobile Hamburger Trigger */}
        <div className="md:hidden flex items-center mt-3" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 bg-black text-white rounded-full shadow-lg transition-transform active:scale-90 z-[110]"
          >
            <div className="transition-all duration-300 ease-in-out">
              {menuOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
            </div>
          </button>

          {/* Mobile Dropdown Menu with Animation */}
          <div
            className={`absolute right-0 top-14 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-[100] overflow-hidden transition-all duration-300 ease-out origin-top-right
              ${menuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
          >
            <div className="flex flex-col">
              <button onClick={() => { navigate("/download"); setMenuOpen(false); }} className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 text-gray-700 transition-colors border-b border-gray-50 active:bg-gray-100">
                <DownloadSimpleIcon size={20} />
                <span className="text-sm font-medium">Download App</span>
              </button>
              <button onClick={handleMail} className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 text-gray-700 transition-colors border-b border-gray-50 active:bg-gray-100">
                <Bug size={20} />
                <span className="text-sm font-medium">Report Issue</span>
              </button>
              <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-4 hover:bg-red-50 text-red-600 transition-colors active:bg-red-100">
                <SignOut size={20} />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="mb-4 max-w-full">
          <div className="relative">
            <MagnifyingGlass size={24} className="text-gray-500 absolute left-3.5 top-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for staff..."
              className="w-full rounded-xl py-3 pl-12 pr-4 shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
            />
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-3 mb-6 scrollbar-thin">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium shadow-sm cursor-pointer transition-all
                ${active === f ? "bg-black text-white scale-105" : "bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <CircleNotch size={40} className="animate-spin text-gray-400" />
            <p className="text-gray-500 mt-4 font-medium">Fetching staff directory...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {filtered.map((s) => {
              const meta = STATUS_META[s.status] || STATUS_META["available"];
              return (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="relative w-full text-left bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-start gap-4"
                >
                  <div className="shrink-0 h-full flex items-center">
                    <img
                      src={s.photo_url || "/profile-icon.png"}
                      alt={s.name}
                      onError={(e) => (e.currentTarget.src = "/profile-icon.png")}
                      className="w-22 h-22 md:w-20 md:h-20 rounded-full object-cover shadow-sm"
                    />
                    <img src="/bluetick.png" alt="verified" className="w-5 h-5 md:w-6 md:h-6 mt-18 ml-15 md:ml-12 absolute" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-base md:text-lg font-semibold text-gray-800 truncate">{s.name}</div>
                        {s.designation && <div className="text-sm text-gray-600 truncate">{s.designation}</div>}
                        <div className="text-sm text-gray-500 mt-1">{s.dept}</div>
                      </div>
                    </div>

                    {/* UPDATED LOCATION LOGIC */}
                    <div className="mt-3 flex items-center text-sm text-gray-500 gap-0.5 mb-6">
                      <MapPin size={18} />
                      <span className="truncate">
                        {s.status === 'on_leave' ? "Staff on Leave" : (s.location || "N/A")}
                      </span>
                    </div>

                    <div className="mt-3 absolute right-5 bottom-3.5 gap-3">
                      <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full ${meta.bg} transition-colors duration-500`}>
                        <span className={`text-xs font-medium ${meta.text} whitespace-nowrap`}>{meta.label}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center text-gray-500 mt-6 animate-pulse">No staff found.</div>
        )}
      </main>

      {selected && (
        <StaffPopup
          staff={selected}
          onClose={() => setSelected(null)}
          onViewMap={() => {
            alert(`Open map for ${selected.name} — location: ${selected.location}`);
            setSelected(null);
          }}
        />
      )}
      <p className="fixed bottom-0 left-0 right-0 text-xs text-center text-gray-400 w-screen z-1000">Beta version</p>
    </div>
  );
}
