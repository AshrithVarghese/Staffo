import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Calendar, Copy, Check } from "@phosphor-icons/react";

const Admins = () => {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState('');
  const [copying, setCopying] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const days = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' }
  ];

  const copyDayToSaturday = async () => {
    if (!selectedDay) {
      alert('Please select a day');
      return;
    }

    if (!confirm(`Are you sure you want to copy ${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}'s timetable to Saturday for all staff? This will overwrite existing Saturday schedules.`)) {
      return;
    }

    setCopying(true);
    setSuccessMessage('');

    try {
      // Fetch all timetables
      const { data: timetables, error: fetchError } = await supabase
        .from('timetable')
        .select('*');

      if (fetchError) throw fetchError;

      if (!timetables || timetables.length === 0) {
        alert('No timetables found');
        setCopying(false);
        return;
      }

      // Update each timetable's saturday column with selected day's data
      const updates = timetables.map(async (tt) => {
        const daySchedule = tt[selectedDay]; // Get the selected day's schedule
        return supabase
          .from('timetable')
          .update({ saturday: daySchedule })
          .eq('staff_id', tt.staff_id);
      });

      const results = await Promise.all(updates);

      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error('Some updates failed:', errors);
        alert(`${errors.length} updates failed. Check console for details.`);
      } else {
        setSuccessMessage(`Successfully copied ${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}'s timetable to Saturday for ${timetables.length} staff members!`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error copying timetable:', error);
      alert('Failed to copy timetable. Check console for details.');
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-50 pt-4">
        <header className="max-w-full mx-auto mb-6 flex flex-col">
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
          {/* Copy Timetable to Saturday Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={24} className="text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-800">Assign Weekday Timetable to Saturday</h2>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Select a weekday to copy its entire timetable schedule to Saturday for all staff members. This is useful for makeup classes or special Saturday sessions.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Day to Copy
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full md:w-64 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  disabled={copying}
                >
                  <option value="">-- Choose a day --</option>
                  {days.map(day => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={copyDayToSaturday}
                disabled={!selectedDay || copying}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  !selectedDay || copying
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800 cursor-pointer'
                }`}
              >
                {copying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Copying...
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy to Saturday
                  </>
                )}
              </button>

              {successMessage && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <Check size={20} className="text-green-600" />
                  <span className="text-sm text-green-700">{successMessage}</span>
                </div>
              )}
            </div>
          </div>

        </main>
    </div>
  )
}

export default Admins