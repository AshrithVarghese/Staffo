import { useEffect, useState, useMemo } from "react";
import { supabase } from "../utils/supabase";
import { MagnifyingGlass } from "@phosphor-icons/react";

const FILTERS = ["All", "OFFICE", "BSH", "CSE", "CY", "AD", "EEE", "ME", "CE", "ECE", "MR", "RA"];

export default function Meeting({ staffId }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("");

  const [staffList, setStaffList] = useState([]);
  const [selected, setSelected] = useState([]);

  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Load all staff
  useEffect(() => {
    const loadStaff = async () => {
      const { data } = await supabase
        .from("staff")
        .select("id, name, dept, photo_url");

      setStaffList(data || []);
      setLoading(false);
    };
    loadStaff();
  }, []);

  const toggleStaff = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Filtering logic
  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();

    return staffList.filter((s) => {
      const matchDept = filter === "All" ? true : s.dept === filter;
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.dept.toLowerCase().includes(q);

      return matchDept && matchSearch;
    });
  }, [staffList, filter, search]);

  const saveMeeting = async () => {
    if (!title || !date || !start || !end || !location || selected.length === 0) {
      alert("All fields required!");
      return;
    }

    // 1. Create meeting
    const { data: meeting, error: mErr } = await supabase
      .from("meetings")
      .insert({
        host_staff_id: staffId,
        title,
        description: desc,
        meeting_date: date,
        start_time: start,
        end_time: end,
        location,
      })
      .select()
      .single();

    if (mErr) {
      console.error(mErr);
      alert("Failed to create meeting");
      return;
    }

    // 2. Add participants
    const participants = selected.map((id) => ({
      meeting_id: meeting.id,
      staff_id: id,
    }));

    await supabase.from("meeting_participants").insert(participants);

    // 3. Notify participants
    const notifications = selected.map((id) => ({
      staff_id: id,
      message: `You have a scheduled meeting: ${title} at ${location}`,
    }));

    await supabase.from("notifications").insert(notifications);

    alert("Meeting scheduled!");
  };

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-5">
      <h1 className="text-2xl font-semibold mb-5">Schedule a Meeting</h1>

      <div className="bg-white p-6 rounded-2xl shadow space-y-5">

        <input
          type="text"
          placeholder="Meeting Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border bg-gray-50"
        />

        <textarea
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border bg-gray-50"
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border bg-gray-50"
        />

        <div className="flex gap-3">
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border bg-gray-50"
          />
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border bg-gray-50"
          />
        </div>

        <input
          type="text"
          placeholder="Location (e.g., Conference Hall)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border bg-gray-50"
        />

        {/* PARTICIPANTS PICKER */}
        <div>
          <h3 className="font-medium mb-2">Select Participants</h3>

          {/* Search Bar */}
          <div className="relative mb-3">
            <MagnifyingGlass
              size={20}
              className="absolute left-3 top-3 text-gray-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff"
              className="w-full pl-10 pr-4 py-2 rounded-xl border bg-gray-50"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3 overflow-x-auto pb-2 mb-4">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-sm font-medium 
                  ${filter === f
                    ? "bg-black text-white"
                    : "bg-white text-gray-700 border"
                  }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* STAFF GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto">
            {filteredStaff.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleStaff(s.id)}
                className={`flex items-center gap-3 p-3 border rounded-xl 
                  ${selected.includes(s.id)
                    ? "border-black bg-gray-100"
                    : "bg-white border-gray-200"}
                `}
              >
                <img
                  src={s.photo_url || "/profile-icon.png"}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-gray-500">{s.dept}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={saveMeeting}
          className="w-full py-3 bg-black text-white rounded-xl font-medium shadow"
        >
          Schedule Meeting
        </button>
      </div>
    </div>
  );
}
