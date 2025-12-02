import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import MeetingForm from "../components/MeetingForm";
import MeetingList from "../components/MeetingList";

export default function MeetingDashboard({ staffId }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadMeetings = async () => {
    const { data } = await supabase
      .from("meetings")
      .select("*")
      .eq("host_staff_id", staffId)
      .order("meeting_date", { ascending: true });

    setMeetings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="min-h-screen px-4 py-6 bg-gray-50">
      <header className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-semibold">Meetings Dashboard</h1>

        <button
          onClick={() => {
            setEditingMeeting(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-black text-white rounded-xl"
        >
          + New Meeting
        </button>
      </header>

      {/* Meeting List */}
      <MeetingList
        meetings={meetings}
        onEdit={(meeting) => {
          setEditingMeeting(meeting);
          setShowForm(true);
        }}
      />

      {/* Meeting Form Modal */}
      {showForm && (
        <MeetingForm
          staffId={staffId}
          meeting={editingMeeting}
          onClose={() => {
            setShowForm(false);
            setEditingMeeting(null);
            loadMeetings();
          }}
        />
      )}
    </div>
  );
}
