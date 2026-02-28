import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import { logStaffActivity } from "../utils/logger";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Timetable({ staffId, onClose }) {
  const [data, setData] = useState(null); // whole row
  const [expanded, setExpanded] = useState({});

  // Load timetable (ONE row)
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("timetable")
        .select("*")
        .eq("staff_id", staffId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error(error);
        return;
      }

      // If no row exists → create a blank one
      if (!data) {
        const blank = {
          staff_id: staffId,
          monday: Array(7).fill(""),
          tuesday: Array(7).fill(""),
          wednesday: Array(7).fill(""),
          thursday: Array(7).fill(""),
          friday: Array(7).fill(""),
          saturday: Array(7).fill(""),
        };

        setData(blank);
        await supabase.from("timetable").insert(blank);
        return;
      }

      setData(data);
    };

    load();
  }, [staffId]);

  if (!data)
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl">Loading…</div>
      </div>
    );

  // Update slot
  const updateSlot = (day, index, value) => {
    setData((prev) => ({
      ...prev,
      [day]: prev[day].map((v, i) => (i === index ? value : v)),
    }));
  };

  // Save whole row
  const saveAll = async () => {
    const payload = {
      monday: data.monday,
      tuesday: data.tuesday,
      wednesday: data.wednesday,
      thursday: data.thursday,
      friday: data.friday,
      saturday: data.saturday,
      updated_at: new Date().toISOString(),
    };

    await supabase.from("timetable").update(payload).eq("staff_id", staffId);
    await logStaffActivity(staffId, "TIMETABLE_UPDATE");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-1000 px-5">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow overflow-y-auto max-h-[90vh]">

        <h2 className="text-xl font-semibold mb-4">Timetable</h2>

        {DAYS.map((day) => {
          const key = day.toLowerCase();
          return (
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
                  {data[key].map((slot, idx) => (
                    <div key={idx} className="border p-3 rounded-xl">
                      <div className="text-sm font-medium mb-2">
                        Period {idx + 1}
                      </div>

                      <input
                        type="text"
                        value={slot}
                        onChange={(e) => updateSlot(key, idx, e.target.value)}
                        placeholder="Room / Lab"
                        className="border rounded-xl px-3 py-2 w-full"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="flex flex-row gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={saveAll}
            className="px-4 py-2 bg-black text-white rounded-xl cursor-pointer"
          >
            Save
          </button>

        </div>


      </div>
    </div>
  );
}
