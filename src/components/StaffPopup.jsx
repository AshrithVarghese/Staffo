// StaffPopup.jsx
// Simple popup/modal compatible with your Dashboard.jsx
// Props: staff (object), onClose(fn), onViewMap(fn)

import React from "react";
import { MapPin } from "@phosphor-icons/react";

const STATUS_META = {
  available: { label: "Available", bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  in_class: { label: "In Class", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  busy: { label: "Busy", bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  on_leave: { label: "On Leave", bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" },
};

export default function StaffPopup({ staff, onClose = () => { }, onViewMap = () => { } }) {
  if (!staff) return null;
  const meta = STATUS_META[staff.status] || STATUS_META.on_leave;

  // minimal sample schedule fallback (if staff.schedule absent)
  const schedule = staff.schedule || [
    { id: 1, title: "AI & Machine Learning Lecture", time: "10:00 AM - 11:30 AM" },
    { id: 2, title: "Office Hours", time: "2:00 PM - 3:00 PM" },
    { id: 3, title: "Faculty Meeting", time: "4:00 PM - 5:00 PM" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl p-6 md:p-8 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >

        <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer absolute right-0">
            Close
        </button>
        {/* handle + close */}
        <div className="flex items-center justify-between mb-3 -mt-3">
          <div className="mx-auto w-24 h-1.5 rounded-full bg-gray-200" />
        </div>

        {/* avatar / name */}
        <div className="flex flex-col items-center text-center">
          <img
            src={staff.avatar || "/profile-icon.png"}
            alt={staff.name}
            className="w-28 h-28 rounded-full object-cover shadow-sm"
          />
          <img src="/bluetick.png" alt="verified" className="w-8 absolute ml-17 mt-21"/>
          <h2 className="mt-4 text-xl font-semibold text-gray-800">{staff.name}</h2>
          <p className="text-sm text-gray-500">
            {staff.designation ? `${staff.designation} - ` : ""}{staff.dept}
          </p>

          {/* status pill */}
          <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${meta.bg}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
            <span className={`text-sm font-medium ${meta.text}`}>{meta.label}</span>
          </div>
        </div>

        {/* location */}
        <div className="mt-6 flex items-center gap-3">
          <div className="p-2 rounded-full bg-gray-100">
            <MapPin size={18} className="text-black" />
          </div>
          <div className="text-sm text-gray-800">
            <div className="font-medium">{staff.location || "-"}</div>
          </div>
        </div>


        {/* schedule */}
        <div className="mt-6 mb-25">
          <h3 className="text-base font-semibold text-gray-800">Today's Schedule</h3>
          <div className="mt-3 space-y-4 pl-3 relative">
            {/* vertical line */}
            <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-gray-200 rounded" />
            {schedule.map((item, idx) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className={`relative z-10`} style={{ marginLeft: "-14px" }}>
                  <div className={`w-3.5 h-3.5 rounded-full ${idx === 1 ? "bg-black" : "bg-gray-300"} border-2 border-white`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">{item.title}</div>
                  <div className="text-sm text-gray-500">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

