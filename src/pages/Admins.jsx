import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { 
  Calendar, Copy, Check, CalendarPlus, Trash, 
  UserCircle, Users, Clock, DownloadSimple, CaretLeft 
} from "@phosphor-icons/react";
import * as XLSX from 'xlsx';

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
  const [isDownloading, setIsDownloading] = useState(false);

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
        staff ( name )
      `)
      .order('start_at', { ascending: false });

    if (!error && data) {
      setGlobalHolidays(data.filter(h => h.staff_id === null));
      setStaffLeaves(data.filter(h => h.staff_id !== null));
    }
  };

  // Helper: UTC to IST
  const toIST = (utcString) => {
    if (!utcString) return '-';
    return new Date(utcString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadUsageReport = async () => {
    setIsDownloading(true);
    try {
      const { data, error } = await supabase
        .from('staff_activity')
        .select(`created_at, log_history, staff ( name )`);

      if (error) throw error;

      const flattenedData = [];
      data.forEach(record => {
        const staffName = record.staff?.name || 'Unknown Staff';
        const logs = record.log_history || [];
        logs.forEach(log => {
          flattenedData.push({
            'Staff Name': staffName,
            'IST Time': toIST(log.timestamp),
            'Action': log.action,
            'Details': log.page || log.new_status || log.new_location || log.desc || '-'
          });
        });
      });

      const worksheet = XLSX.utils.json_to_sheet(flattenedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Usage Log");
      XLSX.writeFile(workbook, `Staff_Usage_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      alert("Export failed: " + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!holidayReason || !startDate || !endDate) return alert("Fill all fields");
    setIsSubmitting(true);
    const { error } = await supabase.from('holidays').insert([{
      reason: holidayReason,
      start_at: new Date(startDate).toISOString(),
      end_at: new Date(endDate).toISOString(),
      staff_id: null
    }]);

    if (!error) {
      setHolidayReason(''); setStartDate(''); setEndDate('');
      setSuccessMessage('Global status updated!');
      fetchHolidays();
      setTimeout(() => setSuccessMessage(''), 3000);
    }
    setIsSubmitting(false);
  };

  const deleteHoliday = async (id) => {
    if (!confirm("Remove this entry?")) return;
    const { error } = await supabase.from('holidays').delete().eq('id', id);
    if (!error) fetchHolidays();
  };

  const copyDayToSaturday = async () => {
    if (!selectedDay) return alert('Select a day');
    setCopying(true);
    try {
      const { data: timetables } = await supabase.from('timetable').select('*');
      const updates = timetables.map(tt => 
        supabase.from('timetable').update({ saturday: tt[selectedDay] }).eq('staff_id', tt.staff_id)
      );
      await Promise.all(updates);
      setSuccessMessage(`Timetable synced!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e) { alert('Sync failed'); } finally { setCopying(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-10 font-sans text-gray-900">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white/80 px-6 py-4 backdrop-blur-lg border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-2 hover:bg-gray-100 rounded-full transition-all">
            <CaretLeft size={20} weight="bold" />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Admin Console</h1>
        </div>
        
        <button 
          onClick={downloadUsageReport}
          disabled={isDownloading}
          className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
        >
          <DownloadSimple size={18} weight="bold" />
          {isDownloading ? "Exporting..." : "Usage Report"}
        </button>
      </div>

      <div className="mx-auto max-w-2xl p-6 space-y-8">
        {successMessage && (
          <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-600 border border-green-100 animate-in fade-in slide-in-from-top-2">
            <Check weight="bold" /> {successMessage}
          </div>
        )}

        {/* 1. CAMPUS AVAILABILITY */}
        <section className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl p-2"><Calendar size={20} weight="fill" color='black' /></div>
            <h2 className="font-bold">Campus Availability</h2>
          </div>

          <form onSubmit={handleAddHoliday} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Reason for Closure</label>
              <input value={holidayReason} onChange={(e) => setHolidayReason(e.target.value)} className="mt-1 w-full rounded-2xl border-none bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-black transition-all" placeholder="e.g. Public Holiday" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Start Date/Time</label>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full rounded-2xl border-none bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-black" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">End Date/Time</label>
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full rounded-2xl border-none bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-black" />
            </div>
            <button type="submit" disabled={isSubmitting} className="sm:col-span-2 w-full rounded-2xl bg-black py-4 text-sm font-bold text-white hover:bg-gray-800 transition-all">
              {isSubmitting ? "Processing..." : "Set Campus-Wide Holiday"}
            </button>
          </form>

          <div className="mt-8 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Active Holidays</p>
            {globalHolidays.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-2xl bg-gray-50 p-4 border border-gray-50">
                <div>
                  <p className="text-sm font-bold">{h.reason}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{toIST(h.start_at)} — {toIST(h.end_at)}</p>
                </div>
                <button onClick={() => deleteHoliday(h.id)} className="rounded-xl p-2 text-red-500 hover:bg-red-50 transition-all"><Trash size={18} /></button>
              </div>
            ))}
          </div>
        </section>

        {/* 2. PERSONNEL LEAVE LOG (SCROLLABLE) */}
        <section className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl p-2 "><Users size={20} weight="fill" color='black' /></div>
            <h2 className="font-bold">Personnel Leave Log</h2>
          </div>

          <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {staffLeaves.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400 italic">No staff leave records found</div>
            ) : (
              staffLeaves.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-2xl border border-gray-100 p-4 hover:border-gray-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-gray-100 p-2 text-gray-400"><UserCircle size={24} /></div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{h.staff?.name}</p>
                      <p className="text-[11px] text-gray-500 font-medium italic">Reason: {h.reason}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{toIST(h.start_at).split(',')[0]} to {toIST(h.end_at).split(',')[0]}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteHoliday(h.id)} className="rounded-xl p-2 text-gray-300 hover:text-red-500 transition-all"><Trash size={18} /></button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 3. TIMETABLE SYNC */}
        <section className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100 mb-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl p-2"><Clock size={20} weight="fill" color='black'/></div>
            <h2 className="font-bold">Saturday Sync</h2>
          </div>
          <p className="mb-6 text-xs text-gray-500 leading-relaxed">Copies a weekday's timetable to Saturday for all staff members.</p>
          
          <div className="flex flex-col gap-3 sm:flex-row">
            <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="flex-1 rounded-2xl border-none bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-black transition-all appearance-none cursor-pointer">
              <option value="">Select Weekday...</option>
              {days.map(day => <option key={day.value} value={day.value}>{day.label}</option>)}
            </select>
            <button onClick={copyDayToSaturday} disabled={copying} className="rounded-2xl bg-black px-8 py-3 text-sm font-bold text-white hover:bg-gray-800 transition-all shadow-md shadow-black/10 disabled:opacity-50 flex items-center justify-center gap-2">
              <Copy size={18} /> {copying ? "Syncing..." : "Sync to Saturday"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Admins;
