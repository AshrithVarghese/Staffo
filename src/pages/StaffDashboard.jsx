import { useState, useEffect } from "react";
import {
  MapPin,
  PencilSimple,
  Plus,
  ClockAfternoon,
  CalendarBlank,
  CircleNotch,
  X
} from "@phosphor-icons/react";
import { supabase } from "../utils/supabase";
import Timetable from "../components/Timetable";
import PhotoUploader from "../components/PhotoUploader";
import SuperStatusManager from "../components/StaffStatusManager.jsx";
import { useNavigate } from "react-router-dom";
import { logStaffActivity } from "../utils/logger.js";
import { Trash } from "@phosphor-icons/react/dist/ssr";

const STATUS_META = {
  available: { label: "Available", bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  in_class: { label: "In Class", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  busy: { label: "Busy", bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  on_leave: { label: "On Leave", bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" },
  in_meeting: { label: "In Meeting", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  holiday: { label: "Holiday", bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  closed: { label: "College Closed", bg: "bg-slate-200", text: "text-slate-700", dot: "bg-slate-400" },
};

const TITLE_OPTIONS = ["Mr", "Mrs", "Ms", "Dr", "Prof"];
const MANUAL_STATUS_KEYS = ["available", "busy", "in_class", "on_leave", "in_meeting"];

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showTimetable, setShowTimetable] = useState(false);
  const [showDpUploader, setShowDpUploader] = useState(false);
  const [showSuperStatus, setShowSuperStatus] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    let staffSubscription;
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return;

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(profileData);

      const { data: staffData } = await supabase.from("staff").select("*").eq("profile_id", user.id).single();
      setStaff(staffData);

      if (!staffData?.dept?.trim() || !profileData?.phone?.trim()) setShowSetup(true);
      setLoading(false);

      staffSubscription = supabase.channel(`staff_own_${staffData.id}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "staff", filter: `id=eq.${staffData.id}` },
          (p) => setStaff(p.new)).subscribe();
    };
    load();
    return () => { if (staffSubscription) supabase.removeChannel(staffSubscription); };
  }, []);

  if (loading) return (
    <div className="p-6 flex flex-col justify-center items-center mt-[35dvh]">
      <img src="/staffo.png" alt="Loading..." className="w-50" />
      <p className="mt-5 text-gray-500">Setting up your dashboard...</p>
    </div>
  );

  if (!profile || !staff) return null;
  const meta = STATUS_META[staff.status] || STATUS_META.on_leave;

  const updateStatus = async (val) => {
    if (val === 'on_leave') return setShowLeaveModal(true);
    await logStaffActivity(staff.id, "STATUS_UPDATE", { new_status: val });
    setStaff(prev => ({ ...prev, status: val, manual_override: true }));
    await supabase.from("staff").update({ status: val, manual_override: true }).eq("id", staff.id);
  };

  const updateLocation = async (val) => {
    setStaff(prev => ({ ...prev, location: val, manual_location: true }));
    await supabase.from("staff").update({ location: val, manual_location: true }).eq("id", staff.id);
  };

  const updateStaffField = async (f, v) => {
    setStaff(prev => ({ ...prev, [f]: v }));
    await supabase.from("staff").update({ [f]: v }).eq("id", staff.id);
  };

  const updateProfileField = async (f, v) => {
    setProfile(prev => ({ ...prev, [f]: v }));
    await supabase.from("profiles").update({ [f]: v }).eq("id", profile.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-10 pt-6 mb-20">
      {showDpUploader && <PhotoUploader show={showDpUploader} onClose={() => setShowDpUploader(false)} staffId={staff?.id} updateStaffField={updateStaffField} updateProfileField={updateProfileField} />}
      {showSuperStatus && <SuperStatusManager staffId={staff.id} onClose={() => setShowSuperStatus(false)} />}
      {showLeaveModal && <OnLeaveModal staffId={staff.id} onClose={() => setShowLeaveModal(false)} onSuccess={() => setShowLeaveModal(false)} />}

      <header className="max-w-full mx-auto mb-6 flex items-center justify-between">
        <div className="flex flex-col gap-5">
          <img src="/staffo.png" alt="staffo logo" className="w-32 cursor-pointer" onClick={() => navigate("/dashboard")} />
          <h1 className="text-xl font-semibold text-gray-800 ml-2">Staff Dashboard</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img src={staff.photo_url || "/profile-icon.png"} className="w-20 h-20 rounded-full object-cover shadow-inner" />
              <PencilSimple size={25} className="cursor-pointer absolute bottom-0 right-0 bg-black text-white rounded-full p-1 border-2 border-white" onClick={() => setShowDpUploader(true)} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{staff.name}</h2>
              <p className="text-sm text-gray-500">{staff.designation || "No Designation"} - {staff.dept || "No Dept"}</p>
              <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full ${meta.bg}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                <span className={`text-sm font-medium ${meta.text}`}>{meta.label}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-row justify-center gap-4">
          <div className="bg-white text-black border rounded-full px-4 py-2 flex items-center gap-2 cursor-pointer shadow-sm hover:bg-gray-50 transition-colors" onClick={() => setShowSetup(true)}>
            <PencilSimple size={18} />
            <p className="text-sm font-medium">Edit Details</p>
          </div>
          <div className="bg-yellow-400 text-black border border-yellow-500 rounded-full px-4 py-2 flex items-center gap-2 cursor-pointer shadow-sm hover:bg-yellow-500 transition-colors" onClick={() => setShowSuperStatus(true)}>
            <ClockAfternoon size={18} weight="bold" />
            <p className="text-sm font-bold">Super Status</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Status</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(STATUS_META).filter(([key]) => MANUAL_STATUS_KEYS.includes(key)).map(([key, m]) => (
              <button key={key} onClick={() => updateStatus(key)} className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition cursor-pointer ${staff.status === key ? "border-black bg-gray-100 font-bold" : "border-gray-200 bg-white"}`}>
                <span className={`w-3 h-3 rounded-full ${m.dot}`} />
                <span className="text-sm font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Location</h3>
          <p className="text-sm mb-1 text-gray-500 uppercase font-bold text-[10px]">Current</p>
          <div className="flex items-center gap-3 mb-3">
            <MapPin size={20} className="text-black" />
            <span className="font-bold text-gray-700">{staff.location || "No location set"}</span>
          </div>
          <input type="text" value={staff.location || ""} disabled={staff.status === 'closed' || staff.status === 'holiday'} onChange={(e) => updateLocation(e.target.value)} placeholder="Enter your room / block" className="w-full rounded-xl px-4 py-3 border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50" />
        </div>

        <button onClick={() => setShowTimetable(true)} className="w-full bg-white text-black border border-black border-dashed rounded-xl font-medium shadow-md flex flex-col items-center justify-center py-10 cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="bg-black rounded-full p-2"><Plus size={24} weight="bold" className="text-white" /></div>
          <p className="mt-3 font-bold">Manage Timetable</p>
          <p className="text-xs w-[80%] text-gray-500 mt-2 text-center">Update your daily schedule for automatic status changes.</p>
        </button>
      </main>

      {showSetup && <SetupModal staff={staff} profile={profile} updateStaff={updateStaffField} updateProfile={updateProfileField} onClose={() => setShowSetup(false)} />}
      {showTimetable && <Timetable staffId={staff.id} onClose={() => setShowTimetable(false)} />}
    </div>
  );
}

function OnLeaveModal({ staffId, onClose, onSuccess }) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingLeaves, setExistingLeaves] = useState([]);

  // Fetch existing leaves on load
  useEffect(() => {
    fetchExistingLeaves();
  }, [staffId]);

  const fetchExistingLeaves = async () => {
    const { data, error } = await supabase
      .from("holidays")
      .select("*")
      .eq("staff_id", staffId)
      .order("start_at", { ascending: false });

    if (!error) setExistingLeaves(data);
  };

  const handleSave = async () => {
    if (!startDate || !endDate) return alert("Please select dates.");
    if (!reason.trim()) return alert("Please provide a reason.");

    setIsSubmitting(true);
    const startTimestamp = `${startDate}T${startTime}:00`;
    const endTimestamp = `${endDate}T${endTime}:00`;

    const { error } = await supabase.from("holidays").insert([
      {
        staff_id: staffId,
        start_at: startTimestamp,
        end_at: endTimestamp,
        reason: reason.trim()
      }
    ]);

    if (!error) {
      // Set manual override so the DB function respects the immediate change
      await supabase.from("staff").update({ status: "on_leave", manual_override: true }).eq("id", staffId);
      setReason(""); // Clear input
      fetchExistingLeaves(); // Refresh list
      onSuccess();
    } else {
      alert(`Error: ${error.message}`);
    }
    setIsSubmitting(false);
  };

  const deleteLeave = async (id) => {
    if (!confirm("Cancel this leave?")) return;
    const { error } = await supabase.from("holidays").delete().eq("id", id);
    if (!error) fetchExistingLeaves();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Container: Max height set to 90% of screen */}
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header: Fixed */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <h3 className="text-xl font-bold text-gray-900">Leave Management</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content: Scrollable Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
          
          {/* Section 1: Create New Leave */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Schedule New Leave</h4>
            
            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div>
                <label className="text-xs font-medium text-gray-500 ml-1">Reason</label>
                <input 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Personal Work"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-black outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 ml-1">Starts</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-black outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 ml-1">Time</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-black outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 ml-1">Ends</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-black outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 ml-1">Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-black outline-none" />
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={isSubmitting}
                className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Apply for Leave"}
              </button>
            </div>
          </div>

          {/* Section 2: List Existing Leaves */}
          <div className="space-y-3 pb-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Scheduled History</h4>
            {existingLeaves.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4 italic">No leave history found.</p>
            ) : (
              <div className="space-y-2">
                {existingLeaves.map((leave) => (
                  <div key={leave.id} className="p-3 border border-gray-100 rounded-2xl flex justify-between items-center group hover:border-gray-300 transition-all">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{leave.reason}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(leave.start_at).toLocaleDateString()} - {new Date(leave.end_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => deleteLeave(leave.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SetupModal({ staff, profile, updateStaff, updateProfile, onClose }) {
  const initialTitle = TITLE_OPTIONS.includes(staff.name?.split(" ")[0]) ? staff.name.split(" ")[0] : "Dr";
  const [title, setTitle] = useState(initialTitle);
  const [name, setName] = useState(staff.name?.replace(initialTitle, "").trim() || "");
  const [dept, setDept] = useState(staff.dept || "");
  const [designation, setDesignation] = useState(staff.designation || "");
  const [phone, setPhone] = useState(profile.phone || "");

  const save = async () => {
    const fullName = `${title} ${name}`.trim();
    await updateStaff("name", fullName);
    await updateStaff("dept", dept);
    await updateStaff("designation", designation);
    await updateProfile("name", fullName);
    await updateProfile("phone", phone);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-5 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Complete Your Profile</h2>
        <div className="space-y-4">
          <select value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-gray-50">
            {TITLE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-gray-50" />
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-gray-50" />
          <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Designation" className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-gray-50" />
          <select value={dept} onChange={(e) => setDept(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-gray-50">
            <option value="">Select Department</option>
            {["CSE", "ECE", "EEE", "ME", "CE", "BSH", "CY", "AD", "MR", "RA", "OFFICE"].map((d) => <option value={d} key={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 mr-3 bg-gray-200 text-gray-700 rounded-xl">Close</button>
          <button onClick={save} className="px-4 py-2 bg-black text-white rounded-xl">Save</button>
        </div>
      </div>
    </div>
  );
}
