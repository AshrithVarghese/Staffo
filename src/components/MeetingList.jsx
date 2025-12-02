export default function MeetingList({ meetings, onEdit }) {
  if (!meetings.length)
    return (
      <div className="p-6 bg-white rounded-2xl shadow text-center text-gray-500">
        No meetings scheduled
      </div>
    );

  return (
    <div className="space-y-4">
      {meetings.map((m) => (
        <button
          key={m.id}
          onClick={() => onEdit(m)}
          className="w-full text-left bg-white p-5 rounded-2xl shadow flex justify-between items-start hover:shadow-md transition"
        >
          <div>
            <h3 className="font-semibold text-lg">{m.title}</h3>
            <p className="text-gray-600">{m.description}</p>

            <p className="mt-2 text-sm text-gray-500">
              📅 {m.meeting_date}
              <br />
              ⏰ {m.start_time} - {m.end_time}
              <br />
              📍 {m.location}
            </p>
          </div>

          <div className="text-black text-sm font-medium underline">Edit</div>
        </button>
      ))}
    </div>
  );
}

