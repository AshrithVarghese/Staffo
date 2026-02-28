import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { Clock, Trash, X, CalendarPlus, CalendarBlank } from "@phosphor-icons/react";
import { logStaffActivity } from "../utils/logger";

export default function SuperStatusManager({ staffId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // Get today's date in YYYY-MM-DD format for initial state
  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    status_date: getTodayStr(), // Initialized to today
    start_time: "",
    end_time: "",
    description: "",
  });

  useEffect(() => {
    fetchSuperStatuses();
  }, [formData.status_date]); // Re-fetch list if the user changes the date filter

  const fetchSuperStatuses = async () => {
    const { data } = await supabase
      .from("super_statuses")
      .select("*")
      .eq("staff_id", staffId)
      .eq("status_date", formData.status_date) // Filters list based on selected date
      .order("start_time", { ascending: true });
    setHistory(data || []);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("super_statuses").insert([
      {
        staff_id: staffId,
        status_date: formData.status_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        description: formData.description,
      },
    ]);
    await logStaffActivity(staffId, "SUPER_STATUS_ADDED", { date: formData.status_date, desc: formData.description });
    if (!error) {
      // Clear inputs but keep the date the same for multiple entries on one day
      setFormData({ ...formData, start_time: "", end_time: "", description: "" });
      fetchSuperStatuses();
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await supabase.from("super_statuses").delete().eq("id", id);
    fetchSuperStatuses();
    await logStaffActivity(staffId, "SUPER_STATUS_DELETED", { status_id: id });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-5 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <CalendarPlus size={24} weight="fill" className="text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-800">Super Status</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-5">
          Schedule busy blocks. These take priority over your automated timetable.
        </p>

        <form onSubmit={handleAdd} className="space-y-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
          {/* Date Picker */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Date</label>
            <div className="relative mt-1">
              <CalendarBlank size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                required
                type="date"
                className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 bg-white focus:ring-2 focus:ring-yellow-400 outline-none"
                value={formData.status_date}
                onChange={(e) => setFormData({ ...formData, status_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">From</label>
              <input
                required
                type="time"
                className="w-full border border-gray-200 rounded-xl p-2.5 mt-1 bg-white focus:ring-2 focus:ring-yellow-400 outline-none"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">To</label>
              <input
                required
                type="time"
                className="w-full border border-gray-200 rounded-xl p-2.5 mt-1 bg-white focus:ring-2 focus:ring-yellow-400 outline-none"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Reason / Location</label>
            <input
              required
              type="text"
              placeholder="e.g. Lab External Exam"
              className="w-full border border-gray-200 rounded-xl p-2.5 mt-1 bg-white focus:ring-2 focus:ring-yellow-400 outline-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Add Super Status"}
          </button>
        </form>

        <h3 className="font-bold text-gray-800 mb-3 px-1 flex justify-between items-center">
          <span>Schedule for {formData.status_date === getTodayStr() ? "Today" : formData.status_date}</span>
        </h3>

        <div className="space-y-3">
          {history.length === 0 && (
            <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
              <p className="text-sm text-gray-400">No blocks for this date</p>
            </div>
          )}
          {history.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <Clock size={16} className="text-yellow-600" />
                  {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                </div>
                <div className="text-xs text-gray-500 mt-1 uppercase font-medium tracking-wider">{item.description}</div>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-gray-400 hover:text-red-500 p-2 transition"
              >
                <Trash size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
