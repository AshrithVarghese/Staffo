// Dashboard.jsx
import { useState, useMemo } from "react";
import { MagnifyingGlass, MapPin } from "@phosphor-icons/react";
import StaffPopup from "./StaffPopup"; // <- make sure path is correct

export const staffList = [
  // OFFICE
  {
    id: 1,
    name: "Mrs. Anitha R.",
    dept: "OFFICE",
    location: "Main Office, Block A",
    status: "available",
    avatar: "/profile-icon.png",
  },
  {
    id: 2,
    name: "Mr. Sanjay Kumar",
    dept: "OFFICE",
    location: "Finance Section, Block A",
    status: "busy",
    avatar: "/profile-icon.png",
  },

  // BSH
  {
    id: 3,
    name: "Dr. Maya Pillai",
    dept: "BSH",
    location: "Maths Dept – Room 112",
    status: "available",
    avatar: "/profile-icon.png",
  },
  {
    id: 4,
    name: "Prof. Ramesh Varma",
    dept: "BSH",
    location: "Science Block – Room 210",
    status: "in_class",
    avatar: "/profile-icon.png",
  },

  // CSE
  {
    id: 5,
    name: "Dr. Evelyn Reed",
    dept: "CSE",
    location: "Room 402, Block C",
    status: "available",
    avatar: "/profile-icon.png",
  },
  {
    id: 6,
    name: "Ms. Sandra Jacob",
    dept: "CSE",
    location: "Project Lab – Block C",
    status: "busy",
    avatar: "/profile-icon.png",
  },

  // CY (Chemistry)
  {
    id: 7,
    name: "Dr. Ravi Chandran",
    dept: "CY",
    location: "Chemistry Lab 1 – Block B",
    status: "in_class",
    avatar: "/profile-icon.png",
  },
  {
    id: 8,
    name: "Ms. Neethu Raj",
    dept: "CY",
    location: "Chemistry Office – Block B",
    status: "available",
    avatar: "/profile-icon.png",
  },

  // AD (Architecture / Additional Dept)
  {
    id: 9,
    name: "Prof. Helen Mathew",
    dept: "AD",
    location: "Architecture Studio – Block D",
    status: "on_leave",
    avatar: "/profile-icon.png",
  },
  {
    id: 10,
    name: "Mr. Aju Francis",
    dept: "AD",
    location: "Design Room – Block D",
    status: "available",
    avatar: "/profile-icon.png",
  },

  // EEE
  {
    id: 11,
    name: "Dr. Suraj Menon",
    dept: "EEE",
    location: "Power Systems Lab – Block E",
    status: "busy",
    avatar: "/profile-icon.png",
  },
  {
    id: 12,
    name: "Ms. Fathima Noor",
    dept: "EEE",
    location: "Electronics Lab – Block E",
    status: "available",
    avatar: "/profile-icon.png",
  },

  // ME
  {
    id: 13,
    name: "Mr. Rajeev Nair",
    dept: "ME",
    location: "Workshop – Block F",
    status: "in_class",
    avatar: "/profile-icon.png",
  },
  {
    id: 14,
    name: "Dr. Priya Joseph",
    dept: "ME",
    location: "Mechanics Lab – Block F",
    status: "available",
    avatar: "/profile-icon.png",
  },

  // CE
  {
    id: 15,
    name: "Prof. Deepak S.",
    dept: "CE",
    location: "Civil Lab – Block G",
    status: "busy",
    avatar: "/profile-icon.png",
  },
  {
    id: 16,
    name: "Ms. Lincy Thomas",
    dept: "CE",
    location: "Survey Lab – Block G",
    status: "available",
    avatar: "/profile-icon.png",
  },

  // ECE
  {
    id: 17,
    name: "Dr. Rekha N.",
    dept: "ECE",
    location: "Electronics Lab – Block H",
    status: "in_class",
    avatar: "/profile-icon.png",
  },
  {
    id: 18,
    name: "Mr. Varun Krishna",
    dept: "ECE",
    location: "Communication Lab – Block H",
    status: "available",
    avatar: "/profile-icon.png",
  },

  // MR (Mechanical Robotics / Mechatronics)
  {
    id: 19,
    name: "Dr. Ajith Mohan",
    dept: "MR",
    location: "Robotics Lab – Block R",
    status: "busy",
    avatar: "/profile-icon.png",
  },
  {
    id: 20,
    name: "Ms. Riya Joseph",
    dept: "MR",
    location: "Automation Lab – Block R",
    status: "available",
    avatar: "/profile-icon.png",
  },

  // RA (Research & Analysis)
  {
    id: 21,
    name: "Dr. Thomas Abraham",
    dept: "RA",
    location: "Research Center – Block X",
    status: "available",
    avatar: "/profile-icon.png",
  },
  {
    id: 22,
    name: "Ms. Sneha Prasad",
    dept: "RA",
    location: "Data Lab – Block X",
    status: "on_leave",
    avatar: "/profile-icon.png",
  },
];

const FILTERS = ["All","OFFICE", "BSH", "CSE", "CY", "AD", "EEE", "ME", "CE", "ECE", "MR", "RA"];

const STATUS_META = {
  available: { label: "Available", bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  in_class: { label: "In Class", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  busy: { label: "Busy", bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  on_leave: { label: "On Leave", bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" },
};

export default function Dashboard() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState("All");
  const [selected, setSelected] = useState(null); // selected staff for popup

  const filtered = useMemo(() => {
    return staffList.filter((s) => {
      const matchFilter = active === "All" ? true : s.dept === active;
      const qLower = q.trim().toLowerCase();
      const matchQuery =
        !qLower ||
        s.name.toLowerCase().includes(qLower) ||
        s.dept.toLowerCase().includes(qLower) ||
        s.location.toLowerCase().includes(qLower);
      return matchFilter && matchQuery;
    });
  }, [q, active]);

  const handleViewMap = (staff) => {
    // replace with navigation to map or other behavior
    alert(`Open map for ${staff.name} — location: ${staff.location}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-8 pt-4">
      <header className="max-w-full mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <img src="/staffo.png" alt="Staffo" className="w-30" />
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
        <div className="mb-4 max-w-xl mx-auto">
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

        {/* Filter chips */}
        <div className="flex gap-3 overflow-x-auto pb-3 mb-6 mx-auto max-w-xl">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium shadow-sm ${
                active === f ? "bg-black text-white" : "bg-white text-gray-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Staff cards */}
        <div className="space-y-5 max-w-xl mx-auto">
          {filtered.map((s) => {
            const meta = STATUS_META[s.status] || STATUS_META["on_leave"];
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s)} // open popup on click
                className="w-full text-left bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition"
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
                      <div className="text-lg font-semibold text-gray-800 leading-tight">{s.name}</div>
                      <div className="text-sm text-gray-500">{s.dept}</div>
                    </div>

                    <div className={`flex items-center justify-center px-2 py-1 rounded-full ${meta.bg} min-w-16`}>
                        <span className={`text-xs font-light ${meta.text} text-center`}>{meta.label}</span>
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

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl p-6 text-center text-gray-500">No staff found.</div>
          )}
        </div>
      </main>

      {/* Staff popup (rendered when selected != null) */}
      {selected && (
        <StaffPopup
          staff={{
            name: selected.name,
            dept: selected.dept,
            role: selected.role || "",
            avatar: selected.avatar,
            status: selected.status,
            statusLabel: STATUS_META[selected.status]?.label,
            location: selected.location,
            room: selected.location?.split(",")[0] || "",
            block: selected.location?.split("Block")?.[1]?.trim() || "",
            schedule: selected.schedule, // optional
          }}
          onClose={() => setSelected(null)}
          onViewMap={(s) => {
            handleViewMap(selected);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
