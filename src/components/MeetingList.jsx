import { MapPin, Timer, Calendar, PencilSimple } from '@phosphor-icons/react';
import { useState } from 'react';

export default function MeetingList({ meetings, userId, onEdit }) {
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' or 'past'

  if (!meetings || meetings.length === 0) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow text-center text-gray-500">
        No meetings scheduled yet
      </div>
    );
  }

  // Filter meetings where:
  // 1. user is host
  // 2. OR user is included in meeting_participants (m.participants)
  const visibleMeetings = meetings.filter(m => {
    const isHost = String(m.host_staff_id) === String(userId);
    const isParticipant =
      Array.isArray(m.participants) &&
      m.participants.some(pid => String(pid) === String(userId));

    return isHost || isParticipant;
  });

  // Filter by upcoming/past
  // Replace the filtering section with this if you want to consider time as well:

  const filteredMeetings = visibleMeetings.filter(m => {
    if (!m.meeting_date || !m.start_time) return false;

    // Combine date and time for accurate comparison
    const meetingDateTime = new Date(`${m.meeting_date}T${m.start_time}`);
    const now = new Date();

    if (filter === 'upcoming') {
      return meetingDateTime >= now;
    } else {
      return meetingDateTime < now;
    }
  });
  // Sort meetings: upcoming by date ascending, past by date descending
  const sortedMeetings = [...filteredMeetings].sort((a, b) => {
    const dateA = new Date(a.meeting_date);
    const dateB = new Date(b.meeting_date);

    if (filter === 'upcoming') {
      return dateA - dateB; // Oldest upcoming first
    } else {
      return dateB - dateA; // Most recent past first
    }
  });

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
            : 'No past meetings'}
        </div>
      ) : (
        sortedMeetings.map((m) => {
          const isHost = String(m.host_staff_id) === String(userId);

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
                  <p className="flex flex-row gap-1">
                    <Calendar size={20} /> {m.meeting_date}
                  </p>
                  <p className="flex flex-row gap-1">
                    <Timer size={20} /> {m.start_time} – {m.end_time}
                  </p>
                  <p className="flex flex-row gap-1">
                    <MapPin size={20} /> {m.location}
                  </p>

                  {/* Display role (Host or Participant) */}
                  <p className="mt-1 text-xs text-gray-500">
                    {isHost ? "You are the Host" : "You are a Participant"}
                  </p>
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
