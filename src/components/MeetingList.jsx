export default function MeetingList({ meetings, onEdit }) {
  if (!meetings || meetings.length === 0) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow text-center text-gray-500">
        No meetings scheduled yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {meetings.map((m) => (
        <button
          key={m.id}
          onClick={() => onEdit(m)}
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

            <div className="mt-3 text-sm text-gray-600">
              <p>📅 {m.meeting_date}</p>
              <p>⏰ {m.start_time} – {m.end_time}</p>
              <p>📍 {m.location}</p>
            </div>
          </div>

          <div className="text-black text-sm font-medium underline ml-4 shrink-0">
            Edit
          </div>
        </button>
      ))}
    </div>
  );
}
