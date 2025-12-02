import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function Timetable({ staffId, onClose }) {
  const [entries, setEntries] = useState({});
  const [expanded, setExpanded] = useState({});

  // Load timetable
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("timetable")
        .select("*")
        .eq("staff_id", staffId);

      if (error) {
        console.error(error);
        return;
      }

      // Convert array → structured data
      const grouped = {};
      DAYS.forEach((d) => (grouped[d] = []));

      data.forEach((row) => {
        grouped[row.day].push({
          id: row.id,
          start_time: row.start_time,
          end_time: row.end_time,
          place: row.place,
        });
      });

      setEntries(grouped);
    };

    load();
  }, [staffId]);

  const addSlot = (day) => {
    setEntries((prev) => ({
      ...prev,
      [day]: [...prev[day], { id: null, start_time: "", end_time: "", place: "" }],
    }));
  };

  const updateSlot = (day, index, field, value) => {
    const copy = { ...entries };
    copy[day][index][field] = value;
    setEntries(copy);
  };

  const saveAll = async () => {
    // Clear existing data
    await supabase.from("timetable").delete().eq("staff_id", staffId);

    // Reinsert all
    for (const day of DAYS) {
      for (const slot of entries[day]) {
        if (!slot.start_time || !slot.end_time) continue;

        await supabase.from("timetable").insert({
          staff_id: staffId,
          day,
          start_time: slot.start_time,
          end_time: slot.end_time,
          place: slot.place,
          is_active: true,
        });
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow overflow-y-auto max-h-[90vh]">

        <h2 className="text-xl font-semibold mb-4">Timetable</h2>

        {DAYS.map((day) => (
          <div key={day} className="mb-4">
            <button
              onClick={() => setExpanded((prev) => ({ ...prev, [day]: !prev[day] }))}
              className="w-full flex justify-between items-center py-3 px-4 bg-gray-100 rounded-xl"
            >
              <span className="font-medium">{day}</span>
              <span>{expanded[day] ? "−" : "+"}</span>
            </button>

            {expanded[day] && (
              <div className="mt-3 space-y-3">
                {entries[day].map((slot, idx) => (
                  <div key={idx} className="border p-3 rounded-xl">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="time"
                        value={slot.start_time}
                        onChange={(e) => updateSlot(day, idx, "start_time", e.target.value)}
                        className="border rounded-xl px-2 py-2"
                      />
                      <input
                        type="time"
                        value={slot.end_time}
                        onChange={(e) => updateSlot(day, idx, "end_time", e.target.value)}
                        className="border rounded-xl px-2 py-2"
                      />
                    </div>

                    <input
                      type="text"
                      value={slot.place}
                      onChange={(e) => updateSlot(day, idx, "place", e.target.value)}
                      placeholder="Room / Lab"
                      className="border rounded-xl px-3 py-2 w-full mt-2"
                    />
                  </div>
                ))}

                <button
                  onClick={() => addSlot(day)}
                  className="px-3 py-2 bg-black text-white rounded-xl text-sm"
                >
                  + Add Slot
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end mt-4">
          <button
            onClick={saveAll}
            className="px-4 py-2 bg-black text-white rounded-xl"
          >
            Save Timetable
          </button>
        </div>

        <div className="flex justify-end mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
