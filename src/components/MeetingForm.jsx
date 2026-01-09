import { useEffect, useState, useMemo } from "react";
import { supabase } from "../utils/supabase";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { logStaffActivity } from "../utils/logger";

const FILTERS = ["All", "OFFICE", "BSH", "CSE", "CY", "AD", "EEE", "ME", "CE", "ECE", "MR", "RA"];
const LOCATION_SUGGESTIONS = [
  "Board Room",
  "Decennial Hall",
  "Seminar Hall",
  "Conference Room",
  "Principal Office",
  "Staff Room",
  "Others",
];

export default function MeetingForm({ staffId, meeting, onClose }) {
  const [title, setTitle] = useState(meeting?.title || "");
  const [desc, setDesc] = useState(meeting?.description || "");
  
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(meeting?.meeting_date || today);

  const [start, setStart] = useState(meeting?.start_time || "");
  const [end, setEnd] = useState(meeting?.end_time || "");
  const [location, setLocation] = useState(meeting?.location || "");
  // Track if we are in "Manual Entry" mode for location
  const [isOtherLocation, setIsOtherLocation] = useState(false);

  const [staffList, setStaffList] = useState([]);
  const [selected, setSelected] = useState([]); 

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showEndOptions, setShowEndOptions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

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

  useEffect(() => {
    if (!meeting) {
      setSelected([staffId]);
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

      let ids = data.map(x => x.staff_id);
      if (!ids.includes(staffId)) ids.push(staffId);
      setSelected(ids);
    };

    loadParticipants();

    // If editing and location isn't in suggestions, enable "Other" mode
    if (meeting?.location && !LOCATION_SUGGESTIONS.includes(meeting.location)) {
        setIsOtherLocation(true);
    }
  }, [meeting, staffId]);

  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase();
    return staffList.filter(s => {
      const matchDept = filter === "All" ? true : s.dept === filter;
      const matchSearch = (s.name || "").toLowerCase().includes(q) || (s.dept || "").toLowerCase().includes(q);
      return matchDept && matchSearch;
    });
  }, [staffList, filter, search]);

  const toggleStaff = id => {
    if (id === staffId) return;
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const save = async () => {
    if (!title || !date || !start || !end || !location || selected.length === 0) {
      alert("All fields are required.");
      return;
    }

    let meetingId = meeting?.id;

    if (!meeting) {
      const { data, error } = await supabase
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
      
      if (error) {
        alert("Insert error: " + error.message);
        return;
      }
      await logStaffActivity(staffId, "MEETING_CREATED", { title });
      meetingId = data.id;
    } else {
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
      await logStaffActivity(staffId, "MEETING_UPDATED", { title });
    }

    await supabase.from("meeting_participants").delete().eq("meeting_id", meetingId);
    const participantRows = selected.map(sid => ({ meeting_id: meetingId, staff_id: sid }));
    const { error: insertErr } = await supabase.from("meeting_participants").insert(participantRows);

    if (insertErr) {
      alert("Failed to save participants");
      return;
    }

    alert("Meeting saved!");
    onClose();
  };

  const toMinutes = t => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const toTime24 = mins => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const toTime12 = t => {
    const [h, m] = t.split(":").map(Number);
    const hr = h % 12 || 12;
    const ap = h >= 12 ? "PM" : "AM";
    return `${hr}:${String(m).padStart(2, "0")} ${ap}`;
  };

  const endOptions = useMemo(() => {
    if (!start) return [];
    const base = toMinutes(start);
    const out = [];
    for (let m = base + 10; m <= base + 6 * 60; m += 10) {
      const dur = m - base;
      const durLabel = dur >= 60 ? `${Math.floor(dur / 60)}h ${dur % 60}m` : `${dur} min`;
      const t24 = toTime24(m);
      out.push({ value: t24, label: `${toTime12(t24)} (${durLabel})` });
    }
    return out;
  }, [start]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-1000 p-5">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-5 overflow-y-auto space-y-5">
          <h2 className="text-xl font-semibold mb-5">{meeting ? "Edit Meeting" : "New Meeting"}</h2>

          <input type="text" placeholder="Meeting Title" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl bg-gray-50" />

          <textarea placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl bg-gray-50" />

          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl bg-gray-50" />

          <div className="flex gap-3">
            <input type="time" value={start} onChange={e => { setStart(e.target.value); if (!end) setEnd(e.target.value); }}
              className="w-full px-4 py-3 border rounded-xl bg-gray-50" />

            <div className="relative w-full">
              <input type="time" value={end} onChange={e => setEnd(e.target.value)} onFocus={() => setShowEndOptions(true)}
                className="w-full px-4 py-3 border rounded-xl bg-gray-50" />
              {start && showEndOptions && (
                <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border bg-white shadow">
                  {endOptions.map(opt => (
                    <button type="button" key={opt.value} onClick={() => { setEnd(opt.value); setShowEndOptions(false); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">{opt.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Updated Location Logic */}
          <div className="relative">
            {!isOtherLocation ? (
              <div 
                onClick={() => setShowLocationSuggestions(!showLocationSuggestions)}
                className="w-full px-4 py-3 border rounded-xl bg-gray-50 cursor-pointer flex justify-between items-center"
              >
                <span className={location ? "text-black" : "text-gray-400"}>
                  {location || "Select Location"}
                </span>
                <span className="text-gray-400 text-xs">▼</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Enter custom location..."
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-black rounded-xl bg-white"
                />
                <button 
                    type="button"
                    onClick={() => { setIsOtherLocation(false); setLocation(""); }}
                    className="text-xs text-blue-600 underline"
                >
                    Reset
                </button>
              </div>
            )}

            {!isOtherLocation && showLocationSuggestions && (
              <div className="absolute z-50 mt-1 w-full rounded-xl border bg-white shadow max-h-56 overflow-y-auto">
                {LOCATION_SUGGESTIONS.map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => {
                      if (l === "Others") {
                        setIsOtherLocation(true);
                        setLocation("");
                      } else {
                        setLocation(l);
                      }
                      setShowLocationSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 border-b last:border-0"
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <MagnifyingGlass size={20} className="absolute left-3 top-3 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff..."
              className="w-full pl-10 pr-4 py-3 border rounded-xl bg-gray-50" />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {FILTERS.map(f => (
              <button type="button" key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-sm shrink-0 ${filter === f ? "bg-black text-white" : "bg-white border"}`}>
                {f}
              </button>
            ))}
          </div>

          <h3 className="text-sm font-medium text-gray-700 mt-3">Select Participants</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto">
            {filteredStaff.map(s => {
              const isHost = s.id === staffId;
              const isSelected = selected.includes(s.id);
              return (
                <button type="button" key={s.id} onClick={() => toggleStaff(s.id)} disabled={isHost}
                  className={`flex items-center gap-3 p-3 border rounded-xl text-left
                    ${isSelected ? "bg-gray-100 border-black" : "bg-white border-gray-200"}
                    ${isHost ? "opacity-60 cursor-not-allowed" : ""}`}>
                  <img src={s.photo_url || "/profile-icon.png"} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <div className="font-medium">{s.name} {isHost && "(Host)"}</div>
                    <div className="text-sm text-gray-500">{s.dept}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-between bg-white gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-300">Cancel</button>
          <button type="button" onClick={save} className="px-5 py-2 rounded-xl bg-black text-white">
            {meeting ? "Save Changes" : "Create Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}
