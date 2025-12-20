import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Calendar, Copy, Check, CalendarPlus, Trash, UserCircle, Users, Clock } from "@phosphor-icons/react";

const Admins = () => {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState('');
  const [copying, setCopying] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form States
  const [holidayReason, setHolidayReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [globalHolidays, setGlobalHolidays] = useState([]);
  const [staffLeaves, setStaffLeaves] = useState([]);

  const days = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' }
  ];

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    const { data, error } = await supabase
      .from('holidays')
      .select(`
        *,
        staff (
          name
        )
      `)
      .order('start_at', { ascending: false });

    if (!error && data) {
      setGlobalHolidays(data.filter(h => h.staff_id === null));
      setStaffLeaves(data.filter(h => h.staff_id !== null));
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!holidayReason || !startDate || !endDate) {
      alert("Please fill all fields");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from('holidays')
      .insert([{
        reason: holidayReason,
        start_at: new Date(startDate).toISOString(),
        end_at: new Date(endDate).toISOString(),
        staff_id: null
      }]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setHolidayReason('');
      setStartDate('');
      setEndDate('');
      setSuccessMessage('Global status updated!');
      fetchHolidays();
      setTimeout(() => setSuccessMessage(''), 5000);
    }
    setIsSubmitting(false);
  };

  const deleteHoliday = async (id) => {
    if (!confirm("Remove this entry?")) return;
    const { error } = await supabase.from('holidays').delete().eq('id', id);
    if (!error) fetchHolidays();
  };

  const copyDayToSaturday = async () => {
    if (!selectedDay) { alert('Please select a day'); return; }
    if (!confirm(`Copy ${selectedDay} timetable to Saturday?`)) return;

    setCopying(true);
    try {
      const { data: timetables, error: fetchError } = await supabase.from('timetable').select('*');
      if (fetchError) throw fetchError;
      const updates = timetables.map(async (tt) => {
        return supabase.from('timetable').update({ saturday: tt[selectedDay] }).eq('staff_id', tt.staff_id);
      });
      await Promise.all(updates);
      setSuccessMessage(`Timetable synced!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      alert('Sync failed.');
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-20 pt-4 font-sans">
      <header className="max-w-4xl mx-auto mb-6 flex flex-col">
        <div className="flex items-center gap-3">
          <img src="/staffo.png" alt="Staffo" className="w-32 cursor-pointer" onClick={() => navigate("/")} />
        </div>
        <h1 className='text-xl mt-2 ml-2 font-semibold text-gray-800 tracking-tight'>Admin Console</h1>
      </header>

      <main className="max-w-4xl mx-auto space-y-6">
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 p-4 bg-black text-white rounded-2xl shadow-2xl animate-in fade-in slide-in-from-right">
            <Check size={20} className="text-green-400" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        )}

        {/* 1. CAMPUS AVAILABILITY (GLOBAL) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Users size={24} className="text-black" weight="bold" />
            <h2 className="text-lg font-bold text-gray-800">Campus Availability</h2>
          </div>

          <form onSubmit={handleAddHoliday} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Reason for Closure</label>
              <input type="text" placeholder="e.g. Public Holiday, Summer Vacation" className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all" value={holidayReason} onChange={(e) => setHolidayReason(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Start</label>
              <input type="datetime-local" className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">End</label>
              <input type="datetime-local" className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <button type="submit" disabled={isSubmitting} className="md:col-span-2 bg-black text-white font-bold py-3.5 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all">
              {isSubmitting ? "Updating..." : "Set Campus-Wide Holiday"}
            </button>
          </form>

          <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 ml-1 tracking-widest">Global History</h3>
          <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {globalHolidays.length === 0 && <p className="text-center py-8 text-gray-400 text-sm italic">No global holidays found</p>}
            {globalHolidays.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100/30">
                <div>
                  <div className="font-bold text-gray-800">{h.reason}</div>
                  <div className="text-[11px] text-blue-600 font-medium">{new Date(h.start_at).toLocaleString()} — {new Date(h.end_at).toLocaleString()}</div>
                </div>
                <button onClick={() => deleteHoliday(h.id)} className="p-2.5 text-red-500 hover:bg-white rounded-xl transition-all"><Trash size={20} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. PERSONNEL LEAVE LOG (STAFF) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <UserCircle size={24} className="text-black" weight="bold" />
            <h2 className="text-lg font-bold text-gray-800">Personnel Leave Log</h2>
          </div>

          <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {staffLeaves.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Clock size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm italic">No staff leave records found</p>
              </div>
            )}
            {staffLeaves.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-300 transition-all">
                <div className="flex gap-4 items-center">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm"><UserCircle size={24} className="text-gray-400" /></div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{h.staff?.name || 'Unknown Staff'}</div>
                    <div className="text-[11px] text-gray-500 font-medium">Reason: {h.reason}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tight">
                      {new Date(h.start_at).toLocaleDateString()} to {new Date(h.end_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteHoliday(h.id)} className="p-2.5 text-red-400 hover:text-red-600 rounded-xl transition-all"><Trash size={20} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. TIMETABLE SYNC */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={24} className="text-gray-700" weight="bold" />
            <h2 className="text-lg font-bold text-gray-800">Timetable Sync (Saturday)</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Source Weekday</label>
              <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm outline-none focus:bg-white transition-all" disabled={copying}>
                <option value="">Select a day...</option>
                {days.map(day => (<option key={day.value} value={day.value}>{day.label}</option>))}
              </select>
            </div>
            <button onClick={copyDayToSaturday} disabled={!selectedDay || copying} className="flex items-center justify-center gap-2 px-10 py-3.5 rounded-2xl text-sm font-bold bg-black text-white w-full md:w-auto transition-all shadow-sm active:scale-95 disabled:opacity-30">
              {copying ? "Syncing..." : <><Copy size={18} /> Run Saturday Sync</>}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Admins;
