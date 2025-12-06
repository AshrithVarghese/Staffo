import { MapPin, Timer, Calendar, PencilSimple } from '@phosphor-icons/react';
import { useState } from 'react';

export default function MeetingList({ meetings, userId, onEdit }) {
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' | 'ongoing' | 'past'

  if (!meetings || meetings.length === 0) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow text-center text-gray-500">
        No meetings scheduled yet
      </div>
    );
  }

  // visible: host or participant
  const visibleMeetings = meetings.filter(m => {
    const isHost = String(m.host_staff_id) === String(userId);
    const isParticipant =
      Array.isArray(m.participants) &&
      m.participants.some(pid => String(pid) === String(userId));

    return isHost || isParticipant;
  });

  const now = new Date();

  // helper: build full Date from date + time strings; returns null if invalid
  const buildDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    const dt = new Date(`${dateStr}T${timeStr}`);
    return isNaN(dt.getTime()) ? null : dt;
  };

  // Filter by upcoming / ongoing / past using start and end times
  const filteredMeetings = visibleMeetings.filter(m => {
    const start = buildDateTime(m.meeting_date, m.start_time);
    const end = buildDateTime(m.meeting_date, m.end_time);

    // require valid start & end for reliable classification
    if (!start || !end) return false;

    if (filter === 'upcoming') {
      return start > now;
    }

    if (filter === 'ongoing') {
      // ongoing if now is between start (inclusive) and end (exclusive)
      return start <= now && now <= end;
    }

    // past
    return end < now;
  });

  // Sort:
  // upcoming -> nearest first (start asc)
  // ongoing  -> started earlier first (start asc)
  // past     -> most recent past first (end desc)
  const sortedMeetings = [...filteredMeetings].sort((a, b) => {
    const aStart = buildDateTime(a.meeting_date, a.start_time) || new Date(0);
    const bStart = buildDateTime(b.meeting_date, b.start_time) || new Date(0);
    const aEnd = buildDateTime(a.meeting_date, a.end_time) || new Date(0);
    const bEnd = buildDateTime(b.meeting_date, b.end_time) || new Date(0);

    if (filter === 'past') {
      return bEnd - aEnd; // most recent past first
    }
    // upcoming or ongoing
    return aStart - bStart; // earliest start first
  });

  // Date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const opts = { day: 'numeric', month: 'long', year: 'numeric' }; // -> "6 December 2025"
    return d.toLocaleDateString('en-GB', opts);
  };

  return (
    <div className="space-y-4 mb-25">
      {/* Filter buttons */}
      <div className="flex flex-row gap-2 mb-4">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${filter === 'upcoming'
            ? 'bg-black text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Upcoming
        </button>

        <button
          onClick={() => setFilter('ongoing')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${filter === 'ongoing'
            ? 'bg-black text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Ongoing
        </button>

        <button
          onClick={() => setFilter('past')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${filter === 'past'
            ? 'bg-black text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Past
        </button>
      </div>

      {sortedMeetings.length === 0 ? (
        <div className="p-6 bg-white rounded-2xl shadow text-center text-gray-500">
          {filter === 'upcoming'
            ? 'No upcoming meetings'
            : filter === 'ongoing'
            ? 'No ongoing meetings'
            : 'No past meetings'}
        </div>
      ) : (
        sortedMeetings.map((m) => {
          const isHost = String(m.host_staff_id) === String(userId);
          const start = buildDateTime(m.meeting_date, m.start_time);
          const end = buildDateTime(m.meeting_date, m.end_time);
          const now = new Date();
          const isNowOngoing = start && end && start <= now && now <= end;

          return (
            <button
              key={m.id}
              onClick={() => isHost && onEdit(m)} // edit only if user is host
              className="w-full text-left bg-white p-5 rounded-2xl shadow border border-gray-100
              hover:shadow-md hover:border-gray-300 transition cursor-pointer flex justify-between items-start"
            >
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-gray-800">{m.title}</h3>

                {m.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {m.description}
                  </p>
                )}

                <div className="mt-3 text-sm text-gray-600 flex flex-col gap-1">
                  <p className="flex flex-row gap-1 items-center">
                    <Calendar size={20} /> {formatDate(m.meeting_date)}
                  </p>
                  <p className="flex flex-row gap-1 items-center">
                    <Timer size={20} /> {m.start_time} – {m.end_time}
                  </p>
                  <p className="flex flex-row gap-1 items-center">
                    <MapPin size={20} /> {m.location}
                  </p>

                  {/* Display role (Host or Participant) and status badge for ongoing */}
                  <div className="mt-1 flex items-center gap-3">
                    <p className="text-xs text-gray-500">
                      {isHost ? 'You are the Host' : 'You are a Participant'}
                    </p>

                    {isNowOngoing && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Ongoing
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Show Edit button only if host */}
              {isHost && (
                <div
                  className="text-black text-sm font-medium ml-4 shrink-0 flex flex-row gap-0.5 
                  border border-black rounded-lg px-2 py-1"
                >
                  <PencilSimple size={18} />
                  <p>Edit</p>
                </div>
              )}
            </button>
          );
        })
      )}
    </div>
  );
}
