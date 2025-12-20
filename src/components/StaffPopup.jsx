import React, { useEffect, useState } from "react";
import { MapPin, ClockAfternoon, CircleNotch, Phone, Envelope, HouseLine, CalendarSlash } from "@phosphor-icons/react";
import { supabase } from "../utils/supabase";

/* ------------------ Helpers ------------------ */

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
  return dayKey === "friday" ? fri : monThu;
}

const STATUS_META = {
  available: { label: "Available", bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  in_class: { label: "In Class", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  busy: { label: "Busy", bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  on_leave: { label: "On Leave", bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" },
  in_meeting: { label: "In Meeting", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  holiday: { label: "Holiday", bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  closed: { label: "College Closed", bg: "bg-slate-200", text: "text-slate-700", dot: "bg-slate-400" },
};

function getDayKeyFromDateObj(d) {
  const idx = d.getDay();
  if (idx === 0) return null;
  const map = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return map[idx].toLowerCase();
}

function toISODateOnly(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function parseDateTimeLocal(dateIso, timeStr) {
  return new Date(`${dateIso}T${timeStr}`);
}

function formatTo12(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let hh = parseInt(parts[0], 10);
  const mm = (parts[1] || "00").padStart(2, "0");
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 || 12;
  return `${hh}:${mm} ${ampm}`;
}

/* ------------------ Main Component ------------------ */

export default function StaffPopup({ staff, onClose = () => { } }) {
  const [profile, setProfile] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [todayMeetings, setTodayMeetings] = useState([]);
  const [superStatuses, setSuperStatuses] = useState([]);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  if (!staff) return null;

  const todayDateIso = toISODateOnly(new Date());
  const dayKey = getDayKeyFromDateObj(new Date());
  const meta = STATUS_META[staff.status] || STATUS_META.available;

  // Logical check: If status is holiday, closed, or on_leave, we treat it as "Schedule Unavailable"
  const isGlobalOff = staff.status === 'holiday' || staff.status === 'closed' || staff.status === 'on_leave';

  useEffect(() => {
    if (!staff?.id) return;

    const loadAllData = async () => {
      setLoading(true);
      // We always load profile data so contact info is available
      await loadProfileData();

      if (!isGlobalOff) {
        await Promise.all([
          loadTimetableDynamic(),
          loadMeetingsDynamic(),
          loadSuperStatuses()
        ]);
      }
      setLoading(false);
    };

    loadAllData();
  }, [staff?.id, todayDateIso, isGlobalOff]);

  const loadProfileData = async () => {
    if (!staff.profile_id) return;
    const { data } = await supabase
      .from("profiles")
      .select("email, phone")
      .eq("id", staff.profile_id)
      .single();
    if (data) setProfile(data);
  };

  const loadSuperStatuses = async () => {
    const { data } = await supabase
      .from("super_statuses")
      .select("*")
      .eq("staff_id", staff.id)
      .eq("status_date", todayDateIso)
      .order("start_time", { ascending: true });

    if (data) {
      setSuperStatuses(data.map(s => ({
        ...s,
        start_display: formatTo12(s.start_time),
        end_display: formatTo12(s.end_time)
      })));
    }
  };

  const loadTimetableDynamic = async () => {
    const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
    try {
      const { data: perDayRows } = await supabase
        .from("timetable")
        .select("start_time, end_time, place")
        .eq("staff_id", staff.id)
        .eq("day", todayName)
        .order("start_time", { ascending: true });

      if (perDayRows?.length > 0) {
        setTodayClasses(perDayRows.map(r => ({
          place: r.place || "—",
          start_display: formatTo12(r.start_time),
          end_display: formatTo12(r.end_time),
        })));
        return;
      }

      const { data: arrayRow } = await supabase
        .from("timetable")
        .select("*")
        .eq("staff_id", staff.id)
        .maybeSingle();

      if (arrayRow && dayKey) {
        const dayArr = arrayRow[dayKey] || [];
        const periodTimes = getPeriodTimeMap(dayKey);
        const classes = dayArr
          .map((place, i) => {
            if (!place || place.trim() === "") return null;
            const pt = periodTimes[i] || { start: "", end: "" };
            return {
              place,
              start_display: formatTo12(pt.start),
              end_display: formatTo12(pt.end),
            };
          })
          .filter(Boolean);
        setTodayClasses(classes);
      }
    } catch (err) {
      setTodayClasses([]);
    }
  };

  const loadMeetingsDynamic = async () => {
    const hostQ = supabase.from("meetings").select("*").eq("host_staff_id", staff.id).eq("meeting_date", todayDateIso);
    const partQ = supabase.from("meeting_participants").select(`meetings (*)`).eq("staff_id", staff.id);

    const [hostRes, partRes] = await Promise.all([hostQ, partQ]);
    let all = hostRes.data || [];
    if (partRes.data) {
      const guestMeetings = partRes.data.map(r => r.meetings).filter(m => m && m.meeting_date === todayDateIso);
      all = [...all, ...guestMeetings];
    }

    const unique = Array.from(new Map(all.map(m => [m.id, m])).values());
    unique.sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

    const normalized = unique.map(m => ({
      ...m,
      start_disp: formatTo12(m.start_time),
      end_disp: formatTo12(m.end_time),
    }));

    setTodayMeetings(normalized);
    const now = new Date();
    setCurrentMeeting(normalized.find(m => {
      const s = parseDateTimeLocal(todayDateIso, m.start_time);
      const e = parseDateTimeLocal(todayDateIso, m.end_time);
      return s <= now && now < e;
    }));
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl p-6 shadow-lg overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg">Close</button>
        <div className="flex justify-center -mt-3 mb-5">
          <div className="w-24 h-1.5 bg-gray-200 rounded-full" />
        </div>

        <div className="flex flex-col items-center text-center">
          <img src={staff.photo_url || "/profile-icon.png"} alt={staff.name} className="w-28 h-28 rounded-full object-cover shadow-sm" />
          <h2 className="mt-4 text-xl font-semibold">{staff.name}</h2>
          <p className="text-sm text-gray-500">{staff.designation ? staff.designation + " - " : ""}{staff.dept}</p>
          <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${meta.bg}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
            <span className={`text-sm font-medium ${meta.text}`}>{meta.label}</span>
          </div>

          <div className="mt-5 flex gap-4">
            {profile?.phone && (
              <a href={`tel:${profile.phone}`} className="p-3 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                <Phone size={22} weight="fill" />
              </a>
            )}
            {profile?.email && (
              <a href={`mailto:${profile.email}`} className="p-3 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                <Envelope size={22} weight="fill" />
              </a>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="p-2 rounded-full bg-gray-100"><MapPin size={18} className="text-black" /></div>
          <div className="text-sm text-gray-800 font-medium">
            {staff.status === 'on_leave' ? "Staff on Leave" : (staff.location || "No location set")}
          </div>
        </div>

        <hr className="my-6 border-gray-100" />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CircleNotch size={32} className="animate-spin text-gray-400" />
            <p className="text-sm text-gray-500 mt-2">Checking schedule...</p>
          </div>
        ) : isGlobalOff ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
              {staff.status === 'holiday' ?
                <CalendarSlash size={40} weight="duotone" className="text-blue-500" /> :
                staff.status === 'on_leave' ?
                  <CalendarSlash size={40} weight="duotone" className="text-gray-400" /> :
                  <HouseLine size={40} weight="duotone" className="text-slate-500" />
              }
            </div>
            <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">
              {staff.status === 'holiday' ? 'On Holiday' : staff.status === 'on_leave' ? 'On Personnel Leave' : 'College Closed'}
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-[250px]">
              {staff.status === 'on_leave' ?
                `${staff.name} is currently away. Regular schedules will resume upon return.` :
                staff.status === 'holiday' ?
                  `Routine schedules are suspended for ${staff.location || 'holiday'}.` :
                  'Academic schedules are currently unavailable as the college is closed.'
              }
            </p>
          </div>
        ) : (
          <>
            {superStatuses.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <ClockAfternoon size={20} className="text-yellow-600" /> Special Schedule
                </h3>
                <div className="mt-2 space-y-2">
                  {superStatuses.map((s) => (
                    <div key={s.id} className="p-3 border border-yellow-200 rounded-xl bg-yellow-50/50 text-sm flex flex-col">
                      <span className="font-bold text-gray-800">{s.description}</span>
                      <span className="text-gray-600 text-xs font-medium uppercase mt-0.5">{s.start_display} - {s.end_display}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentMeeting && (
              <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="font-semibold text-black-800">Ongoing Meeting</h3>
                <p className="text-sm text-black-700 mt-1">{currentMeeting.title}</p>
                <p className="text-xs text-black-600">{currentMeeting.start_disp} - {currentMeeting.end_disp}</p>
                <p className="text-xs text-black-600 flex flex-row gap-1"><MapPin size={15} />{currentMeeting.location}</p>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-base font-semibold">Today's Meetings</h3>
              <div className="mt-2 space-y-2">
                {todayMeetings.length === 0 && <p className="text-gray-500 text-sm">No meetings today</p>}
                {todayMeetings.map((m) => (
                  <div key={m.id} className="p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm flex flex-col">
                    <span className="font-medium">{m.title}</span>
                    <span className="text-gray-500">{m.start_disp} - {m.end_disp}</span>
                    <span className="text-gray-500 flex flex-row gap-1"><MapPin size={15} className="mt-0.5" /> {m.location}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pb-5">
              <h3 className="text-base font-semibold">Today's Timetable</h3>
              {todayClasses.length === 0 ? (
                <p className="text-sm text-gray-500 mt-2">No classes today</p>
              ) : (
                <div className="mt-3 space-y-3 relative pl-3">
                  <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-gray-200" />
                  {todayClasses.map((cls, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="relative" style={{ marginLeft: "-14px" }}>
                        <div className="w-3.5 h-3.5 rounded-full bg-black border-2 border-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{cls.place}</div>
                        <div className="text-sm text-gray-500">{cls.start_display} – {cls.end_display}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
