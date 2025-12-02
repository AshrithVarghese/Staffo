// StaffPopup.jsx (FULLY DYNAMIC)
import React, { useEffect, useState } from "react";
import { MapPin } from "@phosphor-icons/react";
import { supabase } from "../utils/supabase";

const STATUS_META = {
  available: { label: "Available", bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  in_class: { label: "In Class", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  busy: { label: "Busy", bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  on_leave: { label: "On Leave", bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" },
  in_meeting: { label: "In Meeting", bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
};

export default function StaffPopup({ staff, onClose = () => { }, onViewMap = () => { } }) {
  const [todayClasses, setTodayClasses] = useState([]);
  const [todayMeetings, setTodayMeetings] = useState([]);
  const [currentMeeting, setCurrentMeeting] = useState(null);

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  useEffect(() => {
    if (!staff?.id) return;
    loadTodayTimetable();
    loadTodayMeetings();
  }, [staff?.id]);

  /* -------------------------------------------
      LOAD TIMETABLE FOR TODAY
  ------------------------------------------- */
  const loadTodayTimetable = async () => {
    const { data, error } = await supabase
      .from("timetable")
      .select("start_time, end_time, place")
      .eq("staff_id", staff.id)
      .eq("day", todayName)
      .order("start_time", { ascending: true });

    if (!error) setTodayClasses(data || []);
  };

  /* -------------------------------------------
      LOAD TODAY'S MEETINGS
  ------------------------------------------- */
  const loadTodayMeetings = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("meeting_participants")
      .select(`
        meeting_id,
        meetings (
          title,
          description,
          meeting_date,
          start_time,
          end_time,
          location
        )
      `)
      .eq("staff_id", staff.id)
      .order("meetings.start_time", { ascending: true });

    if (error) return;

    const meetings = (data || [])
      .map((m) => m.meetings)
      .filter((m) => m.meeting_date === today);

    setTodayMeetings(meetings);

    // check current meeting
    const now = new Date();
    const curTime = now.toTimeString().slice(0, 5); // HH:MM

    const active = meetings.find(
      (m) => curTime >= m.start_time && curTime <= m.end_time
    );

    setCurrentMeeting(active || null);
  };

  if (!staff) return null;
  const meta = STATUS_META[staff.status] || STATUS_META.available;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40"
      onClick={onClose}
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Close
        </button>

        {/* Handle */}
        <div className="flex justify-center mt-3 mb-5">
          <div className="w-24 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Profile */}
        <div className="flex flex-col items-center text-center">
          <img
            src={staff.photo_url || "/profile-icon.png"}
            alt={staff.name}
            className="w-28 h-28 rounded-full object-cover shadow-sm"
          />
          <h2 className="mt-4 text-xl font-semibold">{staff.name}</h2>
          <p className="text-sm text-gray-500">
            {staff.designation ? staff.designation + " - " : ""}
            {staff.dept}
          </p>

          {/* Status */}
          <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${meta.bg}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
            <span className={`text-sm font-medium ${meta.text}`}>{meta.label}</span>
          </div>
        </div>

        {/* Location */}
        <div className="mt-6 flex items-center gap-3">
          <div className="p-2 rounded-full bg-gray-100">
            <MapPin size={18} className="text-black" />
          </div>
          <div className="text-sm text-gray-800 font-medium">
            {staff.location || "No location set"}
          </div>
        </div>

        {/* Current Meeting */}
        {currentMeeting && (
          <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
            <h3 className="font-semibold text-blue-800">Ongoing Meeting</h3>
            <p className="text-sm text-blue-700 mt-1">{currentMeeting.title}</p>
            <p className="text-xs text-blue-600">
              {currentMeeting.start_time} – {currentMeeting.end_time}
            </p>
            <p className="text-xs text-blue-600">📍 {currentMeeting.location}</p>
          </div>
        )}

        {/* Today's Meetings */}
        <div className="mt-6">
          <h3 className="text-base font-semibold">Today's Meetings</h3>
          <div className="mt-2 space-y-2">
            {todayMeetings.length === 0 && (
              <p className="text-gray-500 text-sm">No meetings today</p>
            )}
            {todayMeetings.map((m, i) => (
              <div
                key={i}
                className="p-3 border rounded-xl bg-gray-50 text-sm flex flex-col"
              >
                <span className="font-medium">{m.title}</span>
                <span className="text-gray-500">
                  {m.start_time} – {m.end_time}
                </span>
                <span className="text-gray-500">📍 {m.location}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timetable */}
        <div className="mt-6 mb-6">
          <h3 className="text-base font-semibold">Today's Timetable</h3>

          {todayClasses.length === 0 ? (
            <p className="text-sm text-gray-500 mt-2">No classes today</p>
          ) : (
            <div className="mt-3 space-y-3 relative pl-3">
              <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-gray-200"></div>

              {todayClasses.map((cls, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="relative" style={{ marginLeft: "-14px" }}>
                    <div className="w-3.5 h-3.5 rounded-full bg-black border-2 border-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {cls.place}
                    </div>
                    <div className="text-sm text-gray-500">
                      {cls.start_time} – {cls.end_time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
