import { useEffect, useState, useMemo } from "react";
import { supabase } from "../utils/supabase";
import { MagnifyingGlass } from "@phosphor-icons/react";

const FILTERS = ["All", "OFFICE", "BSH", "CSE", "CY", "AD", "EEE", "ME", "CE", "ECE", "MR", "RA"];

export default function MeetingForm({ staffId, meeting, onClose }) {
  const [title, setTitle] = useState(meeting?.title || "");
  const [desc, setDesc] = useState(meeting?.description || "");
  const [date, setDate] = useState(meeting?.meeting_date || "");
  const [start, setStart] = useState(meeting?.start_time || "");
  const [end, setEnd] = useState(meeting?.end_time || "");
  const [location, setLocation] = useState(meeting?.location || "");

  const [staffList, setStaffList] = useState([]);
  const [selected, setSelected] = useState([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  // -----------------------------------------------------
  // Load staff (id, name, dept, photo_url)
  // -----------------------------------------------------
  useEffect(() => {
    const loadStaff = async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("id, name, dept, photo_url")
        .order("name");

      if (error) console.error(error);

      setStaffList(data || []);
    };

    loadStaff();
  }, []);

  // -----------------------------------------------------
  // Load selected participants when editing
  // -----------------------------------------------------
  useEffect(() => {
    if (!meeting) {
      setSelected([]);
      return;
    }

    const loadParticipants = async () => {
      const { data, error } = await supabase
        .from("meeting_participants")
        .select("staff_id")
        .eq("meeting_id", meeting.id);

      if (error) {
        console.error("Failed to load participants:", error);
        return;
      }

      setSelected(data.map(x => x.staff_id));
    };

    loadParticipants();
  }, [meeting]);

  // -----------------------------------------------------
  // Search & filter staff
  // -----------------------------------------------------
  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase();
    return staffList.filter(s => {
      const matchDept = filter === "All" ? true : s.dept === filter;
      const matchSearch =
        s.name.toLowerCase().includes(q) ||
        s.dept.toLowerCase().includes(q);

      return matchDept && matchSearch;
    });
  }, [staffList, filter, search]);

  const toggleStaff = id => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  // -----------------------------------------------------
  // SAVE MEETING (create or update)
  // -----------------------------------------------------
  const save = async () => {
    if (!title || !date || !start || !end || !location || selected.length === 0) {
      alert("All fields are required.");
      return;
    }

    let meetingId = meeting?.id;

    // -----------------------------------------------------
    // CREATE MEETING
    // -----------------------------------------------------
    if (!meeting) {
      const { data, error } = await supabase
        .from("meetings")
        .insert({
          host_staff_id: staffId,        // Correct FK → staff.id
          title,
          description: desc,
          meeting_date: date,
          start_time: start,
          end_time: end,
          location,
        })
        .select()
        .single();

      if (error) {
        alert("Insert error: " + error.message);
        return;
      }

      meetingId = data.id;
    }

    // -----------------------------------------------------
    // UPDATE MEETING
    // -----------------------------------------------------
    else {
      const { error } = await supabase
        .from("meetings")
        .update({
          title,
          description: desc,
          meeting_date: date,
          start_time: start,
          end_time: end,
          location,
        })
        .eq("id", meetingId);

      if (error) {
        alert("Update error: " + error.message);
        return;
      }
    }

    // -----------------------------------------------------
    // DELETE OLD PARTICIPANTS
    // -----------------------------------------------------
    await supabase
      .from("meeting_participants")
      .delete()
      .eq("meeting_id", meetingId);

    // -----------------------------------------------------
    // INSERT NEW PARTICIPANTS → triggers notifications
    // -----------------------------------------------------
    const participantRows = selected.map(sid => ({
      meeting_id: meetingId,
      staff_id: sid,
    }));

    const { error: insertErr } = await supabase
      .from("meeting_participants")
      .insert(participantRows);

    if (insertErr) {
      console.error("Participant insert error:", insertErr);
      alert("Failed to save participants");
      return;
    }

    alert("Meeting saved!");
    onClose();
  };

  // -----------------------------------------------------
  // RENDER UI
  // -----------------------------------------------------
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-200 p-5"
      role="dialog"
      aria-modal="true"
    >
      {/* Dialog: constrained height + internal scrolling so longer forms still look perfect */}
      <div className="bg-white w-full max-w-lg rounded-2xl shadow space-y-5 my-8
                      flex flex-col max-h-[90vh] overflow-hidden">
        {/* Scrollable content */}
        <div className="px-6 py-5 overflow-y-auto space-y-5">
          <h2 className="text-xl font-semibold mb-5">
            {meeting ? "Edit Meeting" : "New Meeting"}
          </h2>

          {/* Inputs */}
          <input
            type="text"
            placeholder="Meeting Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl bg-gray-50"
          />

          <textarea
            placeholder="Description"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl bg-gray-50"
          />

          <div>
            <label htmlFor="date-input" className="block text-xs font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              id="date-input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl bg-gray-50"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl bg-gray-50"
              />
            </div>
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={end}
                onChange={e => setEnd(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl bg-gray-50"
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl bg-gray-50"
          />

          {/* Search + Filter */}
          <div className="relative">
            <MagnifyingGlass size={20} className="absolute left-3 top-3 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search staff..."
              className="w-full pl-10 pr-4 py-3 border rounded-xl bg-gray-50"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-sm ${filter === f ? "bg-black text-white" : "bg-white border"
                  }`}
                type="button"
              >
                {f}
              </button>
            ))}
          </div>

          {/* Staff list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto">
            {filteredStaff.map(s => (
              <button
                key={s.id}
                onClick={() => toggleStaff(s.id)}
                className={`flex items-center gap-3 p-3 border rounded-xl ${selected.includes(s.id)
                  ? "bg-gray-100 border-black"
                  : "bg-white border-gray-200"
                  }`}
                type="button"
              >
                <img
                  src={s.photo_url || "/profile-icon.png"}
                  className="w-12 h-12 rounded-full object-cover"
                  alt={s.name}
                />
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-gray-500">{s.dept}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer buttons — kept visually identical but pinned so actions stay visible */}
        <div className="px-6 py-4 border-t flex justify-between bg-white gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-300">
            Cancel
          </button>

          <button
            onClick={save}
            className="px-5 py-2 rounded-xl bg-black text-white"
            type="button"
          >
            {meeting ? "Save Changes" : "Create Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}
