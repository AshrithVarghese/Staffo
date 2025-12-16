// AvailabilityAdvanced.jsx
import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlass, MapPin } from "@phosphor-icons/react";
import { supabase } from "../utils/supabase";

/* weekday-aware period times */
function getPeriodTimeMap(dayKey) {
  const monThu = [
    { period: 1, start: "09:00:00", end: "09:50:00" },
    { period: 2, start: "09:50:00", end: "10:40:00" },
    { period: 3, start: "10:50:00", end: "11:40:00" },
    { period: 4, start: "11:40:00", end: "12:30:00" },
    { period: 5, start: "13:20:00", end: "14:10:00" },
    { period: 6, start: "14:20:00", end: "15:10:00" },
    { period: 7, start: "15:10:00", end: "16:00:00" },
  ];
  const fri = [
    { period: 1, start: "09:00:00", end: "09:50:00" },
    { period: 2, start: "09:50:00", end: "10:40:00" },
    { period: 3, start: "10:50:00", end: "11:40:00" },
    { period: 4, start: "11:40:00", end: "12:30:00" },
    { period: 5, start: "13:50:00", end: "14:30:00" },
    { period: 6, start: "14:40:00", end: "15:20:00" },
    { period: 7, start: "15:20:00", end: "16:00:00" },
  ];
  if (!dayKey) return monThu;
  if (dayKey === "friday") return fri;
  return monThu;
}

const FILTERS = ["All", "OFFICE", "BSH", "CSE", "CY", "AD", "EEE", "ME", "CE", "ECE", "MR", "RA"];

function getDayKeyFromDate(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  const idx = d.getDay();
  if (idx === 0) return null;
  const map = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return map[idx].toLowerCase();
}

function parseTimeOnDate(dateIso, timeStr) {
  return new Date(`${dateIso}T${timeStr}`);
}

function meetingOverlapsPeriod(meeting, dateIso, periodTime) {
  const mStart = parseTimeOnDate(dateIso, meeting.start_time);
  const mEnd = parseTimeOnDate(dateIso, meeting.end_time);
  const pStart = parseTimeOnDate(dateIso, periodTime.start);
  const pEnd = parseTimeOnDate(dateIso, periodTime.end);
  return mStart < pEnd && mEnd > pStart;
}

function busyPeriodsFromTimetableRow(timetableRow, dayKey) {
  const set = new Set();
  if (!timetableRow || !dayKey) return set;
  const arr = timetableRow[dayKey];
  if (!Array.isArray(arr)) return set;
  for (let i = 0; i < Math.min(arr.length, 7); i++) {
    if (typeof arr[i] === "string" && arr[i].trim() !== "") set.add(i + 1);
  }
  return set;
}

export default function Availability() {
  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);

  const [timetableMap, setTimetableMap] = useState({});
  const [meetingsByStaff, setMeetingsByStaff] = useState({});
  const [perDateData, setPerDateData] = useState({}); // { date: { perStaffBusy, availableCount, perPeriodDetails } }
  const [bestPeriods, setBestPeriods] = useState({ exactCommon: [], fallbackBest: [] });

  const [hideHeatMap, setHideHeatMap] = useState(false);

  /* ---------- Groups (DB-backed) ---------- */
  // groups: [{ id, name, staff_ids: [...] }]
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // Load staff list (existing) and groups on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingStaff(true);
      const res = await supabase.from("staff").select("id, name, dept, designation, location, photo_url").order("name", { ascending: true });
      if (!mounted) return;
      if (res.error) {
        console.error("Failed to load staff", res.error);
        setStaff([]);
      } else setStaff(res.data || []);
      setLoadingStaff(false);
    };
    load();
    return () => (mounted = false);
  }, []);

  // Fetch groups (DB-backed) — non-invasive read
  useEffect(() => {
    let mounted = true;
    const loadGroups = async () => {
      setGroupsLoading(true);
      const { data, error } = await supabase
        .from("staff_groups")
        .select("id, name, staff_ids, created_by, created_at")
        .order("name", { ascending: true });
      if (!mounted) return;
      if (error) {
        console.error("Failed fetching groups", error);
        setGroups([]);
      } else {
        // sanitize staff_ids: ensure array of strings
        const normalized = (data || []).map((g) => {
          let ids = [];
          try {
            if (Array.isArray(g.staff_ids)) ids = g.staff_ids;
            else if (typeof g.staff_ids === "string") ids = JSON.parse(g.staff_ids);
            else if (g.staff_ids && typeof g.staff_ids === "object") ids = g.staff_ids;
          } catch (e) {
            ids = [];
          }
          return { ...g, staff_ids: Array.isArray(ids) ? ids : [] };
        });
        setGroups(normalized);
      }
      setGroupsLoading(false);
    };
    loadGroups();
    return () => (mounted = false);
  }, []);


  const toggleStaffSelection = (id) => {
    setSelectedStaffIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Apply group: replace current selection with group's staff (filter out missing IDs),
  // then run analyze() automatically.
  const applyGroup = async (group) => {
    if (!group) return;
    // filter out non-existing staff ids
    const validIds = (group.staff_ids || []).filter((id) => staff.some((s) => s.id === id));
    setSelectedStaffIds(validIds);
    // run analyze after state update — ensure analyze sees newest selection
    // small delay to let state update (React setState is async); using microtask
    await new Promise((res) => setTimeout(res, 0));
    analyze();
  };

  // Create a new group record in DB from currently selected staff
  const createGroupInDB = async () => {
    if (selectedStaffIds.length === 0) {
      alert("Select at least one staff to save as a group.");
      return;
    }
    const name = prompt("Enter new group name (e.g. Club1):");
    if (!name) return;
    const cleanName = name.trim();
    if (!cleanName) return;
    // Check duplicate locally first
    const duplicate = groups.find((g) => g.name.toLowerCase() === cleanName.toLowerCase());
    if (duplicate) {
      if (!confirm(`${cleanName} already exists. Overwrite?`)) return;
      // overwrite: use upsert
      const { error } = await supabase
        .from("staff_groups")
        .upsert({ id: duplicate.id, name: cleanName, staff_ids: selectedStaffIds, created_by: null }, { onConflict: "id" });
      if (error) {
        console.error("Failed overwriting group:", error);
        alert("Failed to overwrite group. Check console.");
        return;
      }
      // refresh groups
      await refreshGroups();
      return;
    }

    // insert new
    const { data, error } = await supabase
      .from("staff_groups")
      .insert([{ name: cleanName, staff_ids: selectedStaffIds, created_by: null }])
      .select();
    if (error) {
      console.error("Failed creating group:", error);
      alert("Failed to create group. Check console.");
      return;
    }
    await refreshGroups();
  };

  // delete group
  const deleteGroupInDB = async (groupId, groupName) => {
    if (!confirm(`Delete group "${groupName}"?`)) return;
    const { error } = await supabase.from("staff_groups").delete().eq("id", groupId);
    if (error) {
      console.error("Failed deleting group:", error);
      alert("Failed to delete group. Check console.");
      return;
    }
    await refreshGroups();
  };

  const refreshGroups = async () => {
    setGroupsLoading(true);
    const { data, error } = await supabase
      .from("staff_groups")
      .select("id, name, staff_ids, created_by, created_at")
      .order("name", { ascending: true });
    if (error) {
      console.error("Failed refreshing groups", error);
      setGroups([]);
    } else {
      const normalized = (data || []).map((g) => {
        let ids = [];
        try {
          if (Array.isArray(g.staff_ids)) ids = g.staff_ids;
          else if (typeof g.staff_ids === "string") ids = JSON.parse(g.staff_ids);
          else if (g.staff_ids && typeof g.staff_ids === "object") ids = g.staff_ids;
        } catch (e) {
          ids = [];
        }
        return { ...g, staff_ids: Array.isArray(ids) ? ids : [] };
      });
      setGroups(normalized);
    }
    setGroupsLoading(false);
  };

  /* ---------- existing analyze logic (unchanged) ---------- */
  const renderBusyDetails = (details) => {
    if (!details) return null;
    
    if (Array.isArray(details.meta)) {
      return (
        <div className="space-y-1">
          {details.meta.map((item, idx) => {
            if (typeof item === "string") {
              return (
                <div key={idx} className="text-xs text-gray-700">
                  <strong>Class</strong> — {item}
                </div>
              );
            } else if (item && typeof item === "object" && item.type === "meeting") {
              return (
                <div key={idx} className="text-xs text-gray-700">
                  <strong>Meeting</strong> — {item.title} ({item.start_time.slice(0,5)} - {item.end_time.slice(0,5)}) @ {item.location || "—"}
                </div>
              );
            } else if (item && typeof item === "object") {
              return (
                <div key={idx} className="text-xs text-gray-700">
                  <strong>Meeting</strong> — {item.title || "Untitled"} ({(item.start_time || "").slice(0,5)} - {(item.end_time || "").slice(0,5)}) @ {item.location || "—"}
                </div>
              );
            } else {
              return null;
            }
          })}
        </div>
      );
    }
    if (typeof details.meta === "string") {
      return (
        <div className="text-xs text-gray-700">
          <strong>Class</strong> — {details.meta}
        </div>
      );
    }
    if (details.meta && typeof details.meta === "object") {
      const m = details.meta;
      return (
        <div className="text-xs text-gray-700">
          <strong>Meeting</strong> — {m.title || "Untitled"} ({(m.start_time || "").slice(0,5)} - {(m.end_time || "").slice(0,5)}) @ {m.location || "—"}
        </div>
      );
    }
    return <div className="text-xs text-gray-700">Busy</div>;
  };

  // Helper function to get all dates in the range
  const getDateRange = (start, end) => {
    const dates = [];
    const startDt = new Date(start);
    const endDt = new Date(end);
    
    for (let dt = new Date(startDt); dt <= endDt; dt.setDate(dt.getDate() + 1)) {
      const isoDate = dt.toISOString().slice(0, 10);
      const dayKey = getDayKeyFromDate(isoDate);
      // Skip Sundays (dayKey = null)
      if (dayKey) {
        dates.push(isoDate);
      }
    }
    return dates;
  };

  const analyze = async () => {
    if (selectedStaffIds.length === 0) {
      setTimetableMap({}); setMeetingsByStaff({}); setPerDateData({}); setBestPeriods({ exactCommon: [], fallbackBest: [] });
      return;
    }

    setAnalyzing(true);
    
    // Get all dates in the range (excluding Sundays)
    const dateRange = getDateRange(startDate, endDate);
    
    if (dateRange.length === 0) {
      alert("No valid dates in the selected range (excluding Sundays)");
      setAnalyzing(false);
      return;
    }

    // 1) timetables
    const ttRes = await supabase
      .from("timetable")
      .select("staff_id, monday, tuesday, wednesday, thursday, friday, saturday")
      .in("staff_id", selectedStaffIds);
    if (ttRes.error) console.error("Timetable fetch error:", ttRes.error);
    const ttMap = {};
    (ttRes.data || []).forEach((r) => (ttMap[r.staff_id] = r));
    setTimetableMap(ttMap);

    // 2) meeting participants (meeting_participants has meeting_id + staff_id)
    const mpRes = await supabase
      .from("meeting_participants")
      .select("meeting_id, staff_id")
      .in("staff_id", selectedStaffIds);
    if (mpRes.error) console.error("Meeting participants fetch error:", mpRes.error);

    // collect meeting ids where selected staff are participants
    const meetingIdsFromParticipants = new Set((mpRes.data || []).map((r) => r.meeting_id));

    // 3) fetch meetings where host in selected OR id in participant meeting ids (filter BY date range)
    const meetingIdArray = Array.from(meetingIdsFromParticipants);
    let meetings = [];
    try {
      // meetings where selected are hosts (within date range)
      const qHost = supabase
        .from("meetings")
        .select("id, host_staff_id, title, description, meeting_date, start_time, end_time, location")
        .gte("meeting_date", startDate)
        .lte("meeting_date", endDate)
        .in("host_staff_id", selectedStaffIds);

      const queries = [qHost];

      // meetings where selected are participants (only ids we collected) — also filter by date range
      if (meetingIdArray.length) {
        const qPart = supabase
          .from("meetings")
          .select("id, host_staff_id, title, description, meeting_date, start_time, end_time, location")
          .in("id", meetingIdArray)
          .gte("meeting_date", startDate)
          .lte("meeting_date", endDate);
        queries.push(qPart);
      }

      const results = await Promise.all(queries);
      const arrs = results.flatMap((r) => (r && r.data ? r.data : []));
      const seen = new Set();
      meetings = arrs.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
    } catch (err) {
      console.error("Meetings fetch error:", err);
    }

    // 4) build meetingsMap per staff (host OR participant)
    const meetingsMap = {};
    selectedStaffIds.forEach((id) => (meetingsMap[id] = []));
    // attach host meetings
    meetings.forEach((m) => {
      if (selectedStaffIds.includes(m.host_staff_id)) meetingsMap[m.host_staff_id].push(m);
    });
    // attach participant meetings using mpRes rows (mpRes.data contains meeting_id + staff_id)
    (mpRes.data || []).forEach((mp) => {
      const sid = mp.staff_id; // correct column name
      if (!meetingsMap[sid]) meetingsMap[sid] = [];
      const meeting = meetings.find((x) => x.id === mp.meeting_id);
      if (meeting) {
        if (!meetingsMap[sid].some((mm) => mm.id === meeting.id)) meetingsMap[sid].push(meeting);
      }
    });

    setMeetingsByStaff(meetingsMap);

    // 5) compute busy periods per date separately
    const perDateDataLocal = {};
    
    dateRange.forEach((dateIso) => {
      const dayKey = getDayKeyFromDate(dateIso);
      const PERIOD_TIME_MAP = getPeriodTimeMap(dayKey);
      
      const perStaffBusyLocal = {};
      const perPeriodDetailsLocal = {};
      for (let p = 1; p <= 7; p++) perPeriodDetailsLocal[p] = {};

      selectedStaffIds.forEach((sid) => {
        const sBusy = new Set();
        const ttRow = ttMap[sid];
        
        // Check timetable busy periods for this date
        const ttBusy = busyPeriodsFromTimetableRow(ttRow, dayKey);
        ttBusy.forEach((p) => {
          sBusy.add(p);
          perPeriodDetailsLocal[p][sid] = {
            reason: "class",
            meta: (ttRow && ttRow[dayKey] && ttRow[dayKey][p - 1]) || "Class",
          };
        });

        // Check meetings for this date
        const staffMeetings = meetingsMap[sid] || [];
        staffMeetings.filter(m => m.meeting_date === dateIso).forEach((m) => {
          for (const pt of PERIOD_TIME_MAP) {
            if (meetingOverlapsPeriod(m, dateIso, pt)) {
              sBusy.add(pt.period);
              const prev = perPeriodDetailsLocal[pt.period][sid];
              const meetingInfo = { type: "meeting", meetingId: m.id, title: m.title, start_time: m.start_time, end_time: m.end_time, location: m.location };
              
              if (prev) {
                if (!Array.isArray(prev.meta)) prev.meta = [prev.meta];
                prev.meta.push(meetingInfo);
                prev.reason = "mixed";
              } else {
                perPeriodDetailsLocal[pt.period][sid] = {
                  reason: "meeting",
                  meta: meetingInfo,
                };
              }
            }
          }
        });

        perStaffBusyLocal[sid] = sBusy;
      });
      
      // Calculate available count for this date
      const availCountLocal = {};
      for (let p = 1; p <= 7; p++) {
        let free = 0;
        selectedStaffIds.forEach((sid) => {
          const busySet = perStaffBusyLocal[sid] || new Set();
          if (!busySet.has(p)) free++;
        });
        availCountLocal[p] = free;
      }
      
      perDateDataLocal[dateIso] = {
        perStaffBusy: perStaffBusyLocal,
        availableCount: availCountLocal,
        perPeriodDetails: perPeriodDetailsLocal,
        dayKey: dayKey
      };
    });

    // 6) Calculate best periods across all dates (periods that are free on ALL dates)
    const periodFrequency = {}; // How many dates each period is fully free
    for (let p = 1; p <= 7; p++) {
      let freeOnAllDates = true;
      dateRange.forEach((dateIso) => {
        const dateData = perDateDataLocal[dateIso];
        if (dateData.availableCount[p] !== selectedStaffIds.length) {
          freeOnAllDates = false;
        }
      });
      periodFrequency[p] = freeOnAllDates ? dateRange.length : 0;
    }
    
    const exactCommon = [];
    for (let p = 1; p <= 7; p++) {
      if (periodFrequency[p] === dateRange.length) exactCommon.push(p);
    }
    
    let maxFreeDates = 0;
    for (let p = 1; p <= 7; p++) maxFreeDates = Math.max(maxFreeDates, periodFrequency[p]);
    const fallbackBest = [];
    for (let p = 1; p <= 7; p++) if (periodFrequency[p] === maxFreeDates) fallbackBest.push(p);

    setPerDateData(perDateDataLocal);
    setBestPeriods({ exactCommon, fallbackBest });

    setAnalyzing(false);
  };

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter((s) => {
      if (deptFilter !== "All" && s.dept !== deptFilter) return false;
      if (!q) return true;
      return (s.name || "").toLowerCase().includes(q) || (s.dept || "").toLowerCase().includes(q) || (s.location || "").toLowerCase().includes(q);
    });
  }, [staff, search, deptFilter]);

  const colorForRatio = (ratio) => {
    if (ratio === 1) return "bg-green-700 text-white";
    if (ratio >= 0.75) return "bg-green-400 text-white";
    if (ratio >= 0.5) return "bg-green-200 text-gray-800";
    if (ratio >= 0.25) return "bg-yellow-200 text-gray-800";
    if (ratio > 0) return "bg-red-200 text-gray-800";
    return "bg-red-500 text-white";
  };

  const [activePeriod, setActivePeriod] = useState(null); // { date, period }
  // Use Monday-Thursday as default period map for display (most common case)
  const currentPeriodTimes = getPeriodTimeMap("monday");

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-25 pt-4">
      <header className="max-w-6xl mx-auto mb-3 flex items-left justify-between flex-col ml-1 mt-3">
        <div className="flex items-center gap-3">
          <img src="/staffo.png" alt="Staffo" className="w-32 cursor-pointer" onClick={() => (window.location.href = "/")} />
        </div>
        <h1 className="text-xl font-semibold text-gray-800 ml-2 mt-2">Advanced Availability Analyzer</h1>
      </header>

      <main className="max-w-6xl mx-auto space-y-5">
        {/* Controls (search, date, dept) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlass size={22} className="text-gray-500 absolute left-3.5 top-8" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff..." className="w-full rounded-xl py-2.5 pl-11 pr-4 shadow-sm border border-gray-200 focus:outline-none mt-5" />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none" />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none" />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Department</label>
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin">
                {FILTERS.map((f) => (
                  <button key={f} onClick={() => setDeptFilter(f)} className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium ${deptFilter === f ? "bg-black text-white" : "bg-white text-gray-700 border border-gray-200"}`} type="button">
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Groups UI (DB-backed) */}
          <div className="bg-white rounded-2xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-600">Groups</div>
              <div className="text-xs text-gray-500">{groupsLoading ? "Loading…" : `${groups.length} groups`}</div>
            </div>

            <div className="flex gap-2 flex-wrap items-center">

              {groups.length === 0 && <div className="text-xs text-gray-500">No groups</div>}

              {groups.map((g) => (
                <div key={g.id} className="flex items-center gap-2 border border-black rounded-full cursor-pointer">
                  <button
                    onClick={() => applyGroup(g)}
                    className="whitespace-nowrap px-3 py-1 rounded-full text-xs bg-white text-black cursor-pointer"
                  >
                    {g.name}
                  </button>
                  <button
                    onClick={() => deleteGroupInDB(g.id, g.name)}
                    className="text-lg text-black-500 pr-2 cursor-pointer"
                    title={`Delete ${g.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                onClick={createGroupInDB}
                className=" px-3 py-1 rounded-full text-xs bg-blue-50 text-green-700 border border-green-100"
                title="Save current selection as a group"
              >
                Create new group with selected staff
              </button>


              {/*Option to refresh groups from DB on run (This will not be requires as of now)*/}

              {/* <button
                onClick={refreshGroups}
                className="ml-2 px-3 py-1 rounded-full text-xs bg-white border border-gray-200"
                title="Refresh groups"
              >
                Refresh
              </button> */}
            </div>
          </div>

          {/* staff list + selection */}
          <div className="mt-2">
            <div className="flex flex-row items-center lg:w-2/3 justify-between mb-2">
              <p className="text-xs font-medium text-gray-600">Tap to select staff to analyze</p>
              <button
                onClick={() => {
                  setSelectedStaffIds([]);
                  setHideHeatMap(false);
                }}
                className="px-3 py-1 rounded-full text-xs bg-white border border-gray-200"
              >
                Clear selection
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="col-span-1 md:col-span-2 bg-white rounded-2xl p-3 shadow-sm max-h-64 overflow-auto">
                {loadingStaff ? (
                  <div className="text-sm text-gray-500">Loading staff…</div>
                ) : (
                  filteredStaff.map((s) => {
                    const selected = selectedStaffIds.includes(s.id);
                    return (
                      <div key={s.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          <img src={s.photo_url || "/profile-icon.png"} alt={s.name} className="w-9 h-9 rounded-full object-cover" onError={(e) => (e.currentTarget.src = "/profile-icon.png")} />
                          <div>
                            <div className="text-sm font-medium">{s.name}</div>
                            <div className="text-xs text-gray-500">{s.designation ? `${s.designation} • ` : ""}{s.dept || "No Dept"}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleStaffSelection(s.id)} className={`px-3 py-1 rounded-full text-xs ${selected ? "bg-black text-white" : "bg-white border border-gray-200"}`}>
                            {selected ? "Selected" : "Select"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected staff preview + analyze CTA */}
              <div className="bg-white rounded-2xl p-3 shadow-sm">
                <p className="text-xs text-gray-600 mb-2">Selected staff</p>
                <div className="flex flex-wrap gap-2">
                  {selectedStaffIds.length === 0 && <div className="text-sm text-gray-500">None selected</div>}
                  {selectedStaffIds.map((id) => {
                    const s = staff.find((x) => x.id === id) || { name: "Unknown", photo_url: "/profile-icon.png" };
                    return (
                      <div key={id} className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-full">
                        <img src={s.photo_url} alt={s.name} className="w-6 h-6 rounded-full object-cover" onError={(e) => (e.currentTarget.src = "/profile-icon.png")} />
                        <span className="text-xs">{s.name}</span>
                        <button onClick={() => { toggleStaffSelection(id); analyze(); setHideHeatMap(true); }} className="ml-1 text-lg text-black-500 cursor-pointer">×</button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3">
                  <button onClick={() => { analyze(); setHideHeatMap(false); }} disabled={analyzing} className="w-full bg-black text-white px-3 py-2 rounded-xl text-sm cursor-pointer">
                    {analyzing ? "Analyzing…" : "Analyze availability"}
                  </button>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  <div>Best exact free periods: {bestPeriods.exactCommon.length ? bestPeriods.exactCommon.join(", ") : "None"}</div>
                  <div>Fallback best (max free): {bestPeriods.fallbackBest.length ? bestPeriods.fallbackBest.join(", ") : "—"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        {!hideHeatMap && Object.keys(perDateData).length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium">Availability Heatmap</div>
                <div className="text-xs text-gray-500">
                  Click a period to see per-staff availability details for that date
                </div>
              </div>
              <div className="text-xs text-gray-500">Selected: {selectedStaffIds.length}</div>
            </div>

            <div className="space-y-3">
              {Object.keys(perDateData).map((dateIso) => {
                const dateData = perDateData[dateIso];
                const dayKey = dateData.dayKey;
                const periodTimes = getPeriodTimeMap(dayKey);
                const dayName = getDayKeyFromDate(dateIso);
                
                return (
                  <div key={dateIso} className="border rounded-xl p-3">
                    <div className="text-xs font-medium text-gray-600 mb-2">
                      {dateIso} ({dayName.charAt(0).toUpperCase() + dayName.slice(1)})
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {periodTimes.map((pt) => {
                        const free = dateData.availableCount[pt.period] ?? 0;
                        const ratio = selectedStaffIds.length ? free / selectedStaffIds.length : 0;
                        const classes = colorForRatio(ratio);
                        return (
                          <button
                            key={pt.period}
                            onClick={() => setActivePeriod({ date: dateIso, period: pt.period })}
                            className={`flex-1 rounded-xl py-3 px-1 flex flex-col items-center cursor-pointer justify-center ${classes} shadow-sm`}
                          >
                            <div className="text-sm font-semibold">P{pt.period}</div>
                            <div className="text-xs mt-1">{free}/{selectedStaffIds.length || 0} free</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Details */}
        {activePeriod && perDateData[activePeriod.date] && (
          <div className="mt-4 bg-gray-50 p-3 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium">Period {activePeriod.period} details for {activePeriod.date}</div>
                <div className="text-xs text-gray-500">
                  Time: {getPeriodTimeMap(perDateData[activePeriod.date].dayKey)[activePeriod.period - 1].start.slice(0,5)} - {getPeriodTimeMap(perDateData[activePeriod.date].dayKey)[activePeriod.period - 1].end.slice(0,5)}
                </div>
              </div>
              <div>
                <button onClick={() => setActivePeriod(null)} className="text-xs text-gray-500">Close</button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              {selectedStaffIds.length === 0 && <div className="text-sm text-gray-500">No staff selected</div>}
              {selectedStaffIds.map((sid) => {
                const s = staff.find((x) => x.id === sid) || { name: "Unknown", photo_url: "/profile-icon.png" };
                const dateData = perDateData[activePeriod.date];
                const busySet = dateData.perStaffBusy[sid] || new Set();
                const isBusy = busySet.has(activePeriod.period);
                const details = dateData.perPeriodDetails[activePeriod.period] ? dateData.perPeriodDetails[activePeriod.period][sid] : null;
                return (
                  <div key={sid} className="bg-white p-3 rounded-lg shadow-sm flex items-start gap-3">
                    <img src={s.photo_url || "/profile-icon.png"} alt={s.name} className="w-10 h-10 rounded-full object-cover" onError={(e) => (e.currentTarget.src = "/profile-icon.png")} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{s.name}</div>
                          <div className="text-xs text-gray-500">{s.dept || "No Dept"}</div>
                        </div>
                        <div className={`text-[11px] px-2 py-0.5 rounded-full ${isBusy ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                          {isBusy ? "Busy" : "Free"}
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-gray-600">
                        {isBusy && details ? (
                          renderBusyDetails(details)
                        ) : !isBusy ? (
                          <div>Free during this period</div>
                        ) : (
                          <div>No detail available</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
