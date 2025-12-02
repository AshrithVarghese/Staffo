import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import MeetingForm from "../components/MeetingForm";
import MeetingList from "../components/MeetingList";

export default function MeetingDashboard() {
  const navigate = useNavigate();

  const [authUser, setAuthUser] = useState(null);
  const [staff, setStaff] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);

  // -------------------------------------------------------------
  // FETCH AUTH USER → STAFF ROW
  // -------------------------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      // 1. Get auth user
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        setLoading(false);
        return;
      }

      setAuthUser(user);

      // 2. Find staff row where profile_id = user.id
      const { data: staffRow, error: staffErr } = await supabase
        .from("staff")
        .select("*")
        .eq("profile_id", user.id)
        .single();

      if (staffErr) {
        console.error("Failed to load staff row:", staffErr);
        setLoading(false);
        return;
      }

      setStaff(staffRow);

      // 3. Load their meetings (hosted by staff.id)
      const { data: meetingRows, error: meetErr } = await supabase
        .from("meetings")
        .select("*")
        .eq("host_staff_id", staffRow.id)
        .order("meeting_date", { ascending: true });

      if (meetErr) console.error(meetErr);

      setMeetings(meetingRows || []);
      setLoading(false);
    };

    loadData();
  }, []);

  // Reload meetings after create/edit/delete
  const reloadMeetings = async () => {
    if (!staff?.id) return;

    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("host_staff_id", staff.id)
      .order("meeting_date", { ascending: true });

    if (!error) setMeetings(data || []);
  };

  if (loading)
    return (
      <div className="p-6 text-center">
        <img src="/staffo.png" className="w-24 mx-auto mb-5" />
        Loading meetings…
      </div>
    );

  if (!authUser || !staff)
    return (
      <div className="p-6 text-center text-gray-500">
        Staff profile not found.
      </div>
    );

  return (
    <div className="min-h-screen px-4 py-6 bg-gray-50">
      {/* HEADER */}
      <header className="max-w-full mx-auto mb-6 flex items-center justify-between">
        <img
          src="/staffo.png"
          alt="Staffo"
          className="w-32 cursor-pointer"
          onClick={() => navigate("/staffdashboard")}
        />

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

      {/* MEETING LIST */}
      <MeetingList
        meetings={meetings}
        onEdit={(meeting) => {
          setEditingMeeting(meeting);
          setShowForm(true);
        }}
      />

      {/* FORM MODAL */}
      {showForm && (
        <MeetingForm
          staffId={staff.id}          // ✔ Correct staff.id for FK
          meeting={editingMeeting}
          onClose={() => {
            setShowForm(false);
            setEditingMeeting(null);
            reloadMeetings();        // Refresh list
          }}
        />
      )}
    </div>
  );
}
