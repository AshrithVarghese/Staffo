import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Calendar, Copy, Check, CalendarPlus, Trash, ClockCounterClockwise } from "@phosphor-icons/react";

const Admins = () => {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState('');
  const [copying, setCopying] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Holiday States
  const [holidayReason, setHolidayReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [holidays, setHolidays] = useState([]);

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
      .select('*')
      .order('start_at', { ascending: false });
    if (!error) setHolidays(data);
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!holidayReason || !startDate || !endDate) {
      alert("Please fill all holiday fields");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from('holidays')
      .insert([{
        reason: holidayReason,
        start_at: new Date(startDate).toISOString(),
        end_at: new Date(endDate).toISOString()
      }]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setHolidayReason('');
      setStartDate('');
      setEndDate('');
      setSuccessMessage('Holiday added successfully!');
      fetchHolidays();
      setTimeout(() => setSuccessMessage(''), 5000);
    }
    setIsSubmitting(false);
  };

  const deleteHoliday = async (id) => {
    if (!confirm("Remove this holiday? Statuses will revert to normal.")) return;
    const { error } = await supabase.from('holidays').delete().eq('id', id);
    if (!error) fetchHolidays();
  };

  const copyDayToSaturday = async () => {
    if (!selectedDay) {
      alert('Please select a day');
      return;
    }

    if (!confirm(`Are you sure you want to copy ${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}'s timetable to Saturday for all staff?`)) {
      return;
    }

    setCopying(true);
    try {
      const { data: timetables, error: fetchError } = await supabase.from('timetable').select('*');
      if (fetchError) throw fetchError;

      const updates = timetables.map(async (tt) => {
        return supabase
          .from('timetable')
          .update({ saturday: tt[selectedDay] })
          .eq('staff_id', tt.staff_id);
      });

      await Promise.all(updates);
      setSuccessMessage(`Timetable copied to Saturday successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      alert('Failed to copy timetable.');
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-20 pt-4">
      <header className="max-w-4xl mx-auto mb-6 flex flex-col">
        <div className="flex items-center gap-3">
          <img
            src="/staffo.png"
            alt="Staffo"
            className="w-32 cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>
        <h1 className='text-xl mt-2 ml-2 font-semibold text-gray-800'>Admin Dashboard</h1>
      </header>

      <main className="max-w-4xl mx-auto space-y-6">

        {/* SUCCESS MESSAGE TOAST */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 p-4 bg-black text-white rounded-2xl shadow-2xl animate-in slide-in-from-right">
            <Check size={20} className="text-green-400" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        )}

        {/* HOLIDAY MANAGEMENT SECTION */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <CalendarPlus size={24} className="text-black" />
            <h2 className="text-lg font-semibold text-gray-800">Global Holiday Management</h2>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Set a holiday period. During this time, all staff statuses will automatically change to <b>"Holiday"</b> and their location will display the reason.
          </p>

          <form onSubmit={handleAddHoliday} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Holiday Reason / Name</label>
              <input
                type="text"
                placeholder="e.g. Christmas Vacation, Summer Break"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none"
                value={holidayReason}
                onChange={(e) => setHolidayReason(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date & Time</label>
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date & Time</label>
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="md:col-span-2 bg-black text-white font-semibold py-3 rounded-xl"
            >
              {isSubmitting ? "Processing..." : "Set Global Holiday"}
            </button>
          </form>

          {/* ACTIVE HOLIDAYS LIST */}
          {holidays.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 tracking-wider">Upcoming / Past Holidays</h3>
              <div className="space-y-3">
                {holidays.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <div className="font-semibold text-gray-800">{h.reason}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(h.start_at).toLocaleString()} — {new Date(h.end_at).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteHoliday(h.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COPY TIMETABLE SECTION */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={24} className="text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-800">Assign Weekday Timetable to Saturday</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Select a weekday to copy its entire schedule to Saturday. This overwrites existing Saturday data for all staff.
          </p>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Source Day</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none"
                disabled={copying}
              >
                <option value="">-- Choose a day --</option>
                {days.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={copyDayToSaturday}
              disabled={!selectedDay || copying}
              className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold bg-black text-white disabled:opacity-20 w-full md:w-auto transition-all"
            >
              {copying ? "Copying..." : <><Copy size={18} /> Copy Now</>}
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}

export default Admins
